const path = require('path');
const envPath = path.resolve(__dirname, '../../.env');
require('dotenv').config({ path: envPath });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function cleanupStripeProducts() {
    console.log('Cleaning up dummy products from Stripe...');
    try {
        const products = await stripe.products.list({
            limit: 100,
            active: true
        });

        const dummyNames = ['Pro Plan', 'AI Credits Pack'];
        let count = 0;

        for (const product of products.data) {
            if (dummyNames.includes(product.name)) {
                console.log(`Archiving product: [${product.id}] ${product.name}`);
                await stripe.products.update(product.id, { active: false });
                count++;
            }
        }
        console.log(`Archived ${count} dummy products.`);
    } catch (error) {
        console.error('Error cleaning up Stripe:', error);
    }
}

cleanupStripeProducts();
