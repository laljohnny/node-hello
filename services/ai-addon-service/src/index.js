const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const consumeCreditsHandler = require('./actions/consume-credits');
const checkCreditLimitHandler = require('./actions/check-credit-limit');
const { generateAssetDocument } = require('./actions/generate-document');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'ai-addon-service' });
});

// Action endpoints (protected with JWT authentication)
app.post('/ai-addon/consume-credits', authenticateToken, consumeCreditsHandler);
app.get('/ai-addon/check-credit-limit', authenticateToken, checkCreditLimitHandler);
app.post('/ai-addon/generate-document', authenticateToken, generateAssetDocument);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

app.listen(PORT, () => {
    console.log(`🚀 AI Addon Service running on port ${PORT}`);
});

module.exports = app;
