const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000000,
});

function authenticateToken(req) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return null;

    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        console.error('JWT verification failed:', error.message);
        return null;
    }
}

async function createContext({ req }) {
    const user = authenticateToken(req);

    return {
        req,  // Include request for accessing headers in resolvers
        user,
        db: pool,
        schema: user?.schema || 'public',
        userId: user?.userId,
        companyId: user?.companyId,
        role: user?.role,
        allowedRoles: user?.allowedRoles || []
    };
}

module.exports = { createContext, pool };
