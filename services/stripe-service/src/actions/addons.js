const Joi = require('joi');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../utils/db');

const createAddonSchema = Joi.object({
    input: Joi.object({
        name: Joi.string().required(),
        description: Joi.string().optional(),
        amount: Joi.number().min(0).required(),
        currency: Joi.string().default('usd'),
        type: Joi.string().valid('pay_as_you_go', 'subscription').required(),
        interval: Joi.string().valid('month', 'year').optional(), // Required if subscription
        credits: Joi.number().min(0).required()
    }).required(),
    session_variables: Joi.object({
        'x-hasura-role': Joi.string().required()
    }).unknown()
});

async function createAddon(req, res) {
    try {
        const { error, value } = createAddonSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        if (value.session_variables['x-hasura-role'] !== 'super_admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { input } = value;

        // 1. Create Product in Stripe
        const product = await stripe.products.create({
            name: input.name,
            description: input.description,
            metadata: { type: 'ai_addon', credits: input.credits }
        });

        // 2. Create Price in Stripe
        const priceData = {
            product: product.id,
            unit_amount: Math.round(input.amount * 100),
            currency: input.currency,
        };

        if (input.type === 'subscription') {
            if (!input.interval) return res.status(400).json({ message: 'Interval required for subscription addon' });
            priceData.recurring = { interval: input.interval };
        }

        const price = await stripe.prices.create(priceData);

        // 3. Insert into DB
        const result = await db.query(
            `INSERT INTO ai_addons (
        name, description, amount, currency, pricing_type, interval,
        stripe_product_id, stripe_price_id, credits
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
            [
                input.name, input.description, input.amount, input.currency,
                input.type, input.interval || null, product.id, price.id, input.credits
            ]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Create addon error:', error);
        res.status(500).json({ message: 'Failed to create addon' });
    }
}

const updateAddonSchema = Joi.object({
    input: Joi.object({
        id: Joi.string().uuid().required(),
        name: Joi.string().optional(),
        description: Joi.string().optional(),
        active: Joi.boolean().optional(),
        credits: Joi.number().min(0).optional()
    }).required(),
    session_variables: Joi.object({
        'x-hasura-role': Joi.string().required()
    }).unknown()
});

const deleteAddonSchema = Joi.object({
    input: Joi.object({
        id: Joi.string().uuid().required()
    }).required(),
    session_variables: Joi.object({
        'x-hasura-role': Joi.string().required()
    }).unknown()
});

async function updateAddon(req, res) {
    try {
        const { error, value } = updateAddonSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        if (value.session_variables['x-hasura-role'] !== 'super_admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { input } = value;

        // Get current addon
        const addonResult = await db.query('SELECT * FROM ai_addons WHERE id = $1', [input.id]);
        if (addonResult.rows.length === 0) return res.status(404).json({ message: 'Addon not found' });
        const addon = addonResult.rows[0];

        // Update Stripe Product if name or description changed
        if (input.name || input.description) {
            const updateData = {};
            if (input.name) updateData.name = input.name;
            if (input.description) updateData.description = input.description;
            if (input.credits !== undefined) updateData.metadata = { ...addon.metadata, credits: input.credits };

            await stripe.products.update(addon.stripe_product_id, updateData);
        }

        // Update DB
        const result = await db.query(
            `UPDATE ai_addons SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        active = COALESCE($3, active),
        credits = COALESCE($4, credits),
        updated_at = NOW()
      WHERE id = $5
      RETURNING *`,
            [input.name, input.description, input.active, input.credits, input.id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update addon error:', error);
        res.status(500).json({ message: 'Failed to update addon' });
    }
}

async function deleteAddon(req, res) {
    try {
        const { error, value } = deleteAddonSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        if (value.session_variables['x-hasura-role'] !== 'super_admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { input } = value;

        // Get addon
        const addonResult = await db.query('SELECT * FROM ai_addons WHERE id = $1', [input.id]);
        if (addonResult.rows.length === 0) return res.status(404).json({ message: 'Addon not found' });
        const addon = addonResult.rows[0];

        // Archive Stripe Product
        await stripe.products.update(addon.stripe_product_id, { active: false });

        // Soft delete in DB
        await db.query('UPDATE ai_addons SET active = false, updated_at = NOW() WHERE id = $1', [input.id]);

        res.json({ success: true, message: 'Addon archived' });
    } catch (error) {
        console.error('Delete addon error:', error);
        res.status(500).json({ message: 'Failed to delete addon' });
    }
}

async function getAddons(req, res) {
    try {
        const result = await db.query('SELECT * FROM ai_addons WHERE active = true ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Get addons error:', error);
        res.status(500).json({ message: 'Failed to fetch addons' });
    }
}

async function getAddon(req, res) {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM ai_addons WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Addon not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get addon error:', error);
        res.status(500).json({ message: 'Failed to fetch addon' });
    }
}

module.exports = {
    createAddon,
    updateAddon,
    deleteAddon,
    getAddons,
    getAddon
};
