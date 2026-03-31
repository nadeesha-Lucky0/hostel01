const fetch = require('node-fetch');

const API = 'http://localhost:5000/api';
const TOKEN = 'YOUR_JWT_TOKEN_HERE'; // This script is for manual use or if I had a way to get a token

async function testClearance() {
    console.log('Testing Clearance APIs...');
    
    try {
        // Test GET /me allocation
        const allocRes = await fetch(`${API}/allocations/me`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const allocData = await allocRes.json();
        console.log('Allocation Response:', allocData);

        // Test GET /me clearance
        const clearRes = await fetch(`${API}/clearance/me`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const clearData = await clearRes.json();
        console.log('Clearance Status:', clearData);
    } catch (err) {
        console.error('Test failed:', err.message);
    }
}

// testClearance();
