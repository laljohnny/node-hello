const path = require('path');
const envPath = path.resolve(__dirname, '../../.env');
console.log('Loading .env from:', envPath);
require('dotenv').config({ path: envPath });

console.log('STRIPE_SECRET_KEY loaded:', process.env.STRIPE_SECRET_KEY ? 'YES' : 'NO');
if (process.env.STRIPE_SECRET_KEY) {
    console.log('Key starts with:', process.env.STRIPE_SECRET_KEY.substring(0, 7));
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function listStripeProducts() {
    console.log('Fetching products from Stripe...');
    try {
        const products = await stripe.products.list({
            limit: 10,
            active: true
        });

        console.log(`Found ${products.data.length} active products:`);
        for (const product of products.data) {
            console.log(`- [${product.id}] ${product.name} (${product.description})`);

            const prices = await stripe.prices.list({
                product: product.id,
                limit: 5
            });

            prices.data.forEach(price => {
                const amount = (price.unit_amount / 100).toFixed(2);
                const type = price.type === 'recurring'
                    ? `/${price.recurring.interval}`
                    : ' (one-time)';
                console.log(`  - [${price.id}] $${amount} ${price.currency.toUpperCase()}${type}`);
            });
        }
    } catch (error) {
        console.error('Error fetching from Stripe:', error);
    }
}

listStripeProducts();
