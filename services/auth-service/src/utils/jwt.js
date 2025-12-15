const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

/**
 * Get allowed roles based on user role hierarchy
 */
function getAllowedRoles(role) {
    const roleHierarchy = {
        'super_admin': ['super_admin', 'super_admin_team_member'],
        'super_admin_team_member': ['super_admin_team_member'],
        'partner_admin': ['partner_admin', 'partner_team_member'],
        'partner_team_member': ['partner_team_member'],
        'owner': ['owner', 'company_admin', 'team_member'],
        'company_admin': ['company_admin', 'team_member'],
        'team_member': ['team_member'],
        'vendor': ['vendor']
    };
    return roleHierarchy[role] || [role];
}

/**
 * Generate JWT access token with custom claims
 */
function generateAccessToken(user, company) {
    const payload = {
        sub: user.id,
        email: user.email,
        userId: user.id,
        companyId: company.id,
        companyName: company.name,
        schema: company.schema_name || 'public',
        role: user.role,
        allowedRoles: getAllowedRoles(user.role)
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Generate refresh token
 */
function generateRefreshToken(userId) {
    const payload = {
        sub: userId,
        type: 'refresh'
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
}

/**
 * Decode JWT without verification (for debugging)
 */
function decodeToken(token) {
    return jwt.decode(token);
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
    decodeToken
};
