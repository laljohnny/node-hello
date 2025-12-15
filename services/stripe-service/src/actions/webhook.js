const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../utils/db');

/**
 * Stripe Webhook Handler
 */
async function webhook(req, res) {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Log event to database
    try {
        await db.query(
            `INSERT INTO stripe_events (stripe_event_id, type, data, status)
       VALUES ($1, $2, $3, $4)`,
            [event.id, event.type, event.data.object, 'pending']
        );
    } catch (err) {
        console.error('Error logging webhook event:', err);
    }

    // Handle specific events
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object);
                break;
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
}

async function handleCheckoutSessionCompleted(session) {
    const { companyId, planId } = session.metadata;

    if (companyId && planId) {
        // Activate subscription in database
        await db.query(
            `INSERT INTO company_plans (
        company_id, plan_id, stripe_subscription_id, status, 
        current_period_start, current_period_end
      ) VALUES ($1, $2, $3, $4, TO_TIMESTAMP($5), TO_TIMESTAMP($6))
      ON CONFLICT (company_id) DO UPDATE SET
        plan_id = EXCLUDED.plan_id,
        stripe_subscription_id = EXCLUDED.stripe_subscription_id,
        status = EXCLUDED.status,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        updated_at = NOW()`,
            [
                companyId,
                planId,
                session.subscription,
                'active',
                Date.now() / 1000, // Start now
                Date.now() / 1000 + (30 * 24 * 60 * 60) // Approx 1 month, will be updated by subscription event
            ]
        );
    }
}

async function handleSubscriptionUpdated(subscription) {
    // Update subscription status and dates
    await db.query(
        `UPDATE company_plans SET
      status = $1,
      current_period_start = TO_TIMESTAMP($2),
      current_period_end = TO_TIMESTAMP($3),
      updated_at = NOW()
    WHERE stripe_subscription_id = $4`,
        [
            subscription.status,
            subscription.current_period_start,
            subscription.current_period_end,
            subscription.id
        ]
    );
}

async function handleSubscriptionDeleted(subscription) {
    // Mark subscription as canceled
    await db.query(
        `UPDATE company_plans SET
      status = 'canceled',
      updated_at = NOW()
    WHERE stripe_subscription_id = $1`,
        [subscription.id]
    );
}

module.exports = webhook;
