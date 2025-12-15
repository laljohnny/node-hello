const Joi = require('joi');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../utils/db');

const createPlanSchema = Joi.object({
    input: Joi.object({
        name: Joi.string().required(),
        description: Joi.string().optional(),
        amount: Joi.number().min(0).required(),
        currency: Joi.string().default('usd'),
        interval: Joi.string().valid('month', 'year').required(),
        intervalCount: Joi.number().default(1),
        features: Joi.object().optional(),
        limits: Joi.object().optional(),
        is_default: Joi.boolean().default(false),
        prorata_amount: Joi.number().default(0)
    }).required(),
    session_variables: Joi.object({
        'x-hasura-role': Joi.string().required()
    }).unknown()
});

const updatePlanSchema = Joi.object({
    input: Joi.object({
        id: Joi.string().uuid().required(),
        name: Joi.string().optional(),
        active: Joi.boolean().optional(),
        is_default: Joi.boolean().optional(),
        prorata_amount: Joi.number().optional()
    }).required(),
    session_variables: Joi.object({
        'x-hasura-role': Joi.string().required()
    }).unknown()
});

const deletePlanSchema = Joi.object({
    input: Joi.object({
        id: Joi.string().uuid().required()
    }).required(),
    session_variables: Joi.object({
        'x-hasura-role': Joi.string().required()
    }).unknown()
});

async function createPlan(req, res) {
    try {
        const { error, value } = createPlanSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        // Check admin role
        if (value.session_variables['x-hasura-role'] !== 'super_admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { input } = value;

        // 1. Create Product in Stripe
        const product = await stripe.products.create({
            name: input.name,
            description: input.description
        });

        // 2. Create Price in Stripe
        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(input.amount * 100),
            currency: input.currency,
            recurring: {
                interval: input.interval,
                interval_count: input.intervalCount
            }
        });

        // 3. Insert into DB
        const result = await db.query(
            `INSERT INTO plans (
        name, description, amount, currency, interval, interval_count,
        stripe_product_id, stripe_price_id, features, limits, is_default, prorata_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
            [
                input.name, input.description, input.amount, input.currency,
                input.interval, input.intervalCount, product.id, price.id,
                input.features || {}, input.limits || {}, input.is_default, input.prorata_amount
            ]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Create plan error:', error);
        res.status(500).json({ message: 'Failed to create plan' });
    }
}

async function updatePlan(req, res) {
    try {
        const { error, value } = updatePlanSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        if (value.session_variables['x-hasura-role'] !== 'super_admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { input } = value;

        // Get current plan
        const planResult = await db.query('SELECT * FROM plans WHERE id = $1', [input.id]);
        if (planResult.rows.length === 0) return res.status(404).json({ message: 'Plan not found' });
        const plan = planResult.rows[0];

        // Update Stripe Product if name changed
        if (input.name) {
            await stripe.products.update(plan.stripe_product_id, { name: input.name });
        }

        // Update DB
        const result = await db.query(
            `UPDATE plans SET
        name = COALESCE($1, name),
        active = COALESCE($2, active),
        is_default = COALESCE($3, is_default),
        prorata_amount = COALESCE($4, prorata_amount),
        updated_at = NOW()
      WHERE id = $5
      RETURNING *`,
            [input.name, input.active, input.is_default, input.prorata_amount, input.id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update plan error:', error);
        res.status(500).json({ message: 'Failed to update plan' });
    }
}

async function deletePlan(req, res) {
    try {
        const { error, value } = deletePlanSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        if (value.session_variables['x-hasura-role'] !== 'super_admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { input } = value;

        // Get plan
        const planResult = await db.query('SELECT * FROM plans WHERE id = $1', [input.id]);
        if (planResult.rows.length === 0) return res.status(404).json({ message: 'Plan not found' });
        const plan = planResult.rows[0];

        // Archive Stripe Product
        await stripe.products.update(plan.stripe_product_id, { active: false });

        // Soft delete in DB
        await db.query('UPDATE plans SET active = false, updated_at = NOW() WHERE id = $1', [input.id]);

        res.json({ success: true, message: 'Plan archived' });
    } catch (error) {
        console.error('Delete plan error:', error);
        res.status(500).json({ message: 'Failed to delete plan' });
    }
}

async function getPlans(req, res) {
    try {
        const result = await db.query('SELECT * FROM plans WHERE deleted_at IS NULL ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({ message: 'Failed to fetch plans' });
    }
}

async function getPlan(req, res) {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM plans WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get plan error:', error);
        res.status(500).json({ message: 'Failed to fetch plan' });
    }
}

module.exports = {
    createPlan,
    updatePlan,
    deletePlan,
    getPlans,
    getPlan
};
