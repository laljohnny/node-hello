const Joi = require('joi');
const db = require('../utils/db');

const consumeCreditsSchema = Joi.object({
    featureName: Joi.string().required(),
    credits: Joi.number().min(1).required(),
    metadata: Joi.object().optional()
});

/**
 * Consume Credits Handler
 * Deducts credits from company's active AI addon subscription
 */
async function consumeCredits(req, res) {
    const client = await db.getClient();

    try {
        // Get User Context from Auth Middleware
        const { userId, companyId } = req.user;

        if (!userId || !companyId) {
            return res.status(400).json({ message: 'User context missing required information' });
        }

        const { error, value } = consumeCreditsSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const input = value;

        await client.query('BEGIN');

        // 1. Find active AI addon subscription with available credits
        const subscriptionResult = await client.query(
            `SELECT caa.*, aa.name as addon_name
       FROM company_ai_addons caa
       JOIN ai_addons aa ON caa.ai_addon_id = aa.id
       WHERE caa.company_id = $1 
         AND caa.status = 'active'
         AND (caa.credits_remaining >= $2 OR caa.credits_remaining IS NULL)
       ORDER BY caa.created_at ASC
       LIMIT 1 FOR UPDATE`,
            [companyId, input.credits]
        );

        if (subscriptionResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(402).json({
                message: 'Insufficient credits or no active AI subscription',
                code: 'INSUFFICIENT_CREDITS'
            });
        }

        const subscription = subscriptionResult.rows[0];

        // 2. Deduct credits (if not unlimited)
        if (subscription.credits_remaining !== null) {
            await client.query(
                `UPDATE company_ai_addons 
         SET credits_remaining = credits_remaining - $1,
             updated_at = NOW()
         WHERE id = $2`,
                [input.credits, subscription.id]
            );
        }

        // 3. Log usage
        await client.query(
            `INSERT INTO ai_addon_credit_usage (
        company_id, ai_addon_id, company_ai_addon_id, credits_used, feature_used, performed_by, metadata, action_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                companyId,
                subscription.ai_addon_id,
                subscription.id,
                input.credits,
                input.featureName,
                userId,
                input.metadata || {},
                'consumption'
            ]
        );
        await client.query('COMMIT');

        res.json({
            success: true,
            creditsDeducted: input.credits,
            remainingCredits: subscription.credits_remaining !== null
                ? subscription.credits_remaining - input.credits
                : 'unlimited'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Consume credits error:', error);
        res.status(500).json({ message: 'Failed to consume credits' });
    } finally {
        client.release();
    }
}

module.exports = consumeCredits;
