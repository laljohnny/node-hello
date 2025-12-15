class PermissionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'PermissionError';
        this.extensions = { code: 'FORBIDDEN' };
    }
}

function requireAuth(context) {
    if (!context.user) {
        throw new PermissionError('Authentication required');
    }
}

function requireRole(context, allowedRoles) {
    requireAuth(context);

    if (!Array.isArray(allowedRoles)) {
        allowedRoles = [allowedRoles];
    }

    if (!allowedRoles.includes(context.role)) {
        throw new PermissionError(
            `Insufficient permissions. Required: ${allowedRoles.join(', ')}`
        );
    }
}

function canAccessCompany(context, companyId) {
    requireAuth(context);

    // Super admin can access all companies
    if (context.role === 'super_admin') {
        return true;
    }

    // Partner admin can access own + child companies
    if (context.role === 'partner_admin') {
        // TODO: Implement check for child companies
        // For now, allow if it's their own company
        if (context.companyId === companyId) {
            return true;
        }
        throw new PermissionError('Cannot access other partner companies');
    }

    // Others can only access their own company
    if (context.companyId !== companyId) {
        throw new PermissionError('Cannot access other company data');
    }

    return true;
}

module.exports = {
    requireAuth,
    requireRole,
    canAccessCompany,
    PermissionError
};
