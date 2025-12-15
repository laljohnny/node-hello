const Joi = require('joi');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../utils/db');

const createCheckoutSchema = Joi.object({
    input: Joi.object({
        planId: Joi.string().uuid().required(),
        successUrl: Joi.string().required(),
        cancelUrl: Joi.string().required()
    }).required(),
    session_variables: Joi.object({
        'x-hasura-user-id': Joi.string().required(),
        'x-hasura-company-id': Joi.string().required()
    }).required()
});

/**
 * Create Checkout Session Handler
 */
async function createCheckoutSession(req, res) {
    try {
        const { error, value } = createCheckoutSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { input, session_variables } = value;
        const companyId = session_variables['x-hasura-company-id'];
        const userId = session_variables['x-hasura-user-id'];

        // Get plan details
        const planResult = await db.query(
            'SELECT * FROM plans WHERE id = $1 AND active = true',
            [input.planId]
        );

        if (planResult.rows.length === 0) {
            return res.status(404).json({ message: 'Plan not found or inactive' });
        }

        const plan = planResult.rows[0];

        // Get company details for customer email
        const companyResult = await db.query(
            'SELECT email, name, stripe_customer_id FROM companies WHERE id = $1',
            [companyId]
        );
        const company = companyResult.rows[0];

        // Create or get Stripe customer
        let customerId = company.stripe_customer_id;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: company.email,
                name: company.name,
                metadata: {
                    companyId: companyId
                }
            });
            customerId = customer.id;

            // Update company with Stripe ID
            await db.query(
                'UPDATE companies SET stripe_customer_id = $1 WHERE id = $2',
                [customerId, companyId]
            );
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: plan.currency,
                        product_data: {
                            name: plan.name,
                            description: plan.description
                        },
                        unit_amount: Math.round(plan.amount * 100), // Stripe expects cents
                        recurring: {
                            interval: plan.interval,
                            interval_count: plan.interval_count
                        }
                    },
                    quantity: 1
                }
            ],
            mode: 'subscription',
            success_url: input.successUrl,
            cancel_url: input.cancelUrl,
            metadata: {
                companyId: companyId,
                planId: input.planId,
                userId: userId
            }
        });

        res.json({
            sessionId: session.id,
            url: session.url
        });

    } catch (error) {
        console.error('Create checkout session error:', error);
        res.status(500).json({ message: 'Failed to create checkout session' });
    }
}

module.exports = createCheckoutSession;
