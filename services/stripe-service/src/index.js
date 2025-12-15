const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const createCheckoutSessionHandler = require('./actions/create-checkout-session');
const createAddonCheckoutHandler = require('./actions/create-addon-checkout');
const cancelSubscriptionHandler = require('./actions/cancel-subscription');
const updatePaymentMethodHandler = require('./actions/update-payment-method');
const getBillingPortalUrlHandler = require('./actions/get-billing-portal-url');
const webhookHandler = require('./actions/webhook');
const { createPlan, updatePlan, deletePlan, getPlans, getPlan } = require('./actions/plans');
const { createAddon, updateAddon, deleteAddon, getAddons, getAddon } = require('./actions/addons');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(helmet());
app.use(cors());

// Use JSON parser for all routes except webhook
app.use((req, res, next) => {
    if (req.originalUrl === '/stripe/webhook') {
        next();
    } else {
        express.json()(req, res, next);
    }
});

app.use(morgan('combined'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'stripe-service' });
});

// Action endpoints
app.post('/stripe/create-checkout-session', createCheckoutSessionHandler);
app.post('/stripe/create-addon-checkout', createAddonCheckoutHandler);
app.post('/stripe/cancel-subscription', cancelSubscriptionHandler);
app.post('/stripe/update-payment-method', updatePaymentMethodHandler);
app.post('/stripe/get-billing-portal-url', getBillingPortalUrlHandler);

// Plan Management
app.get('/stripe/plans', getPlans);
app.get('/stripe/plans/:id', getPlan);
app.post('/stripe/plans/create', createPlan);
app.post('/stripe/plans/update', updatePlan);
app.post('/stripe/plans/delete', deletePlan);

// Addon Management
app.get('/stripe/addons', getAddons);
app.get('/stripe/addons/:id', getAddon);
app.post('/stripe/addons/create', createAddon);
app.post('/stripe/addons/update', updateAddon);
app.post('/stripe/addons/delete', deleteAddon);

// Webhook endpoint (needs raw body)
app.post('/stripe/webhook', express.raw({ type: 'application/json' }), webhookHandler);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Stripe Service running on port ${PORT}`);
});

module.exports = app;
