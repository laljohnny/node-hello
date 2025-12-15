const Joi = require('joi');
const db = require('../utils/db');
const AIProviderFactory = require('../utils/ai-provider');

const generateDocumentSchema = Joi.object({
    assetId: Joi.string().uuid().required(),
    documentType: Joi.string().valid('sop', 'incident_plan').required(),
    instructions: Joi.string().allow('', null)
});

async function generateAssetDocument(req, res) {
    try {
        // Get User Context from Auth Middleware
        const { userId, companyId, schema } = req.user;

        if (!userId || !companyId || !schema) {
            return res.status(400).json({ message: 'User context missing required information' });
        }

        const { error, value } = generateDocumentSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const input = value;

        // 1. Fetch Asset Details
        const assetQuery = `
            SELECT a.id, a.name, a.description, 
                   mat.name as asset_type_name,
                   l.location_name, l.description as location_description
            FROM ${schema}.assets a
            LEFT JOIN master_asset_types mat ON a.asset_type_id = mat.id
            LEFT JOIN ${schema}.locations l ON l.id = ANY(a.location_ids)
            WHERE a.id = $1 AND a.deleted_at IS NULL
            LIMIT 1
        `;

        const assetResult = await db.query(assetQuery, [input.assetId]);
        if (assetResult.rows.length === 0) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        const asset = assetResult.rows[0];

        // 2. Fetch Company AI Config
        const configQuery = `
            SELECT provider, model, api_key, base_url, settings
            FROM company_ai_configs
            WHERE company_id = $1 AND is_enabled = true
            ORDER BY created_at DESC
            LIMIT 1
        `;

        const configResult = await db.query(configQuery, [companyId]);
        if (configResult.rows.length === 0) {
            return res.status(400).json({
                message: 'No AI provider configured. Please configure an AI provider in settings.'
            });
        }

        const aiConfig = configResult.rows[0];

        // 3. Build Prompt
        const prompt = buildPrompt(asset, input.documentType, input.instructions);

        // 4. Generate Content using AI Provider
        const provider = AIProviderFactory.createProvider(aiConfig);
        const result = await provider.generate(prompt);

        // 5. Return Generated Content
        res.json({
            content: result.content,
            provider: result.provider,
            model: result.model,
            tokensUsed: result.tokensUsed
        });

    } catch (error) {
        console.error('Generate document error:', error);
        res.status(500).json({
            message: 'Failed to generate document',
            error: error.message
        });
    }
}

function buildPrompt(asset, documentType, customInstructions) {
    const baseContext = `
Asset Name: ${asset.name}
Asset Type: ${asset.asset_type_name || 'N/A'}
Location: ${asset.location_name || 'N/A'}
Description: ${asset.description || 'N/A'}
`;

    const instructionsBlock = customInstructions
        ? `\nIMPORTANT: You must strictly follow these custom instructions:\n"${customInstructions}"\n`
        : '';

    if (documentType === 'sop') {
        return `You are an expert technical writer specializing in Standard Operating Procedures (SOPs).

${baseContext}

Task: Create a comprehensive Standard Operating Procedure (SOP) for this asset.
${instructionsBlock}
The SOP should include (unless overridden by custom instructions):
1. Purpose and Scope
2. Safety Precautions
3. Required Tools and Materials
4. Step-by-Step Operating Procedures
5. Troubleshooting Guide
6. Maintenance Schedule
7. Emergency Shutdown Procedures

Format the output in clear, professional markdown with appropriate headings and bullet points.`;
    } else {
        return `You are an expert in incident response and emergency management.

${baseContext}

Task: Create a detailed Incident Response Plan for this asset.
${instructionsBlock}
The Incident Response Plan should include (unless overridden by custom instructions):
1. Incident Classification and Severity Levels
2. Immediate Response Actions
3. Notification and Escalation Procedures
4. Containment Strategies
5. Recovery Procedures
6. Post-Incident Review Process
7. Contact Information (placeholder sections)

Format the output in clear, professional markdown with appropriate headings and bullet points.`;
    }
}

module.exports = { generateAssetDocument };
