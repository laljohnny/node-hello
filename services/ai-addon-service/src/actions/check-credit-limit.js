const db = require('../utils/db');

/**
 * Check Credit Limit Handler
 * Returns available credits for the company's active AI subscription
 */
async function checkCreditLimit(req, res) {
    try {
        // Get User Context from Auth Middleware
        const { companyId } = req.user;

        if (!companyId) {
            return res.status(400).json({ message: 'User context missing company information' });
        }

        const query = `
            SELECT caa.credits_remaining, aa.name as addon_name
            FROM public.company_ai_addons caa
            JOIN public.ai_addons aa ON caa.ai_addon_id = aa.id
            WHERE caa.company_id = $1 AND caa.status = 'active'
            ORDER BY caa.created_at ASC
            LIMIT 1
        `;

        const result = await db.query(query, [companyId]);

        if (result.rows.length === 0) {
            return res.json({
                hasCredits: false,
                remainingCredits: 0,
                addonName: null
            });
        }

        const row = result.rows[0];
        res.json({
            hasCredits: row.credits_remaining === null || row.credits_remaining > 0,
            remainingCredits: row.credits_remaining,
            addonName: row.addon_name
        });

    } catch (error) {
        console.error('Check credit limit error:', error);
        res.status(500).json({ message: 'Failed to check credit limit' });
    }
}

module.exports = checkCreditLimit;
