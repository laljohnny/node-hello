const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const signupHandler = require('./actions/signup');
const partnerSignupHandler = require('./actions/partner-signup');
const loginHandler = require('./actions/login');
const refreshTokenHandler = require('./actions/refresh-token');
const sendInvitationHandler = require('./actions/send-invitation');
const resendInvitationHandler = require('./actions/resend-invitation');
const acceptInvitationHandler = require('./actions/accept-invitation');
const resetPasswordRequestHandler = require('./actions/reset-password-request');
const resetPasswordHandler = require('./actions/reset-password');
const enable2FAHandler = require('./actions/enable-2fa');
const verify2FAHandler = require('./actions/verify-2fa');
const switchCompanyContextHandler = require('./actions/switch-company-context');
const getCompanyHandler = require('./actions/get-company');
const getCompaniesHandler = require('./actions/get-companies');
const updateCompanyHandler = require('./actions/update-company');
const deleteCompanyHandler = require('./actions/delete-company');
const updateCompanyUserHandler = require('./actions/update-company-user');
const deleteCompanyUserHandler = require('./actions/delete-company-user');
const enumHandlers = require('./actions/manage-enums');
const { authenticateToken, optionalAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'auth-service' });
});

// Action endpoints
app.post('/auth/signup', optionalAuth, signupHandler);  // Company signup (creates tenant schema)
app.post('/auth/partner-signup', optionalAuth, partnerSignupHandler);  // Partner signup (no schema)
app.post('/auth/login', loginHandler);
app.post('/auth/refresh-token', refreshTokenHandler);
app.post('/auth/send-invitation', authenticateToken, sendInvitationHandler);
app.post('/auth/resend-invitation', authenticateToken, resendInvitationHandler);
app.post('/auth/accept-invitation', acceptInvitationHandler);
app.post('/auth/reset-password-request', resetPasswordRequestHandler);
app.post('/auth/reset-password', resetPasswordHandler);
app.post('/auth/enable-2fa', authenticateToken, enable2FAHandler);
app.post('/auth/verify-2fa', authenticateToken, verify2FAHandler);
app.post('/auth/switch-company-context', authenticateToken, switchCompanyContextHandler);

// Company Management
app.get('/auth/company/:id', authenticateToken, getCompanyHandler);
app.get('/auth/companies', authenticateToken, getCompaniesHandler);
app.put('/auth/company', authenticateToken, updateCompanyHandler);
app.delete('/auth/company/:id', authenticateToken, deleteCompanyHandler);

// Company User Management
app.put('/auth/company-user', authenticateToken, updateCompanyUserHandler);
app.delete('/auth/company-user/:userId', authenticateToken, deleteCompanyUserHandler);

// Enum Management (filtered by user's company/schema)
// IMPORTANT: /enums/all must come before /enums/:enumName to avoid route conflict
app.get('/enums', authenticateToken, enumHandlers.getEnums);
app.get('/enums/all', authenticateToken, enumHandlers.getAllEnums); // Admin only
app.get('/enums/:enumName', authenticateToken, enumHandlers.getEnumByName);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Auth Service running on port ${PORT}`);
});

module.exports = app;
