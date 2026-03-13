
const Stripe = require('stripe');

const testValues = [
    undefined,
    null,
    '',
    ' ',
    'undefined',
    'null'
];

testValues.forEach(val => {
    console.log(`Testing with value: [${val}] (type: ${typeof val})`);
    try {
        const stripe = new Stripe(val);
        console.log('Success (Constructor did not throw)');
    } catch (err) {
        console.log(`Error: ${err.message}`);
    }
    console.log('---');
});
