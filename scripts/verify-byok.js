
const jwt = require('jsonwebtoken');
// Native fetch is available in Node 18+
const path = require('path');
const fs = require('fs');

// Simple dotenv parser
function loadEnv(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        content.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2 && !line.startsWith('#')) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim();
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        });
    } catch (err) {
        console.error("Could not load env file:", filePath);
    }
}

loadEnv(path.join(__dirname, '../apps/api/.env'));

const API_URL = 'http://localhost:4002'; // Changed to 4002 due to port 4000/5000 conflict
const SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production'; // Fallback to avoid failure if .env read fails

// Mock verify
if (!SECRET) {
    console.error("JWT_SECRET not found");
    process.exit(1);
}

const tenantId = 'test-tenant-' + Date.now();
const userId = 'test-user-' + Date.now();

const token = jwt.sign({ userId, tenantId, email: 'test@example.com', role: 'USER' }, SECRET);

console.log("Token:", token);

async function run() {
    try {
        console.log("1. GET /settings/google-config (Should be empty/null)");
        let res = await fetch(`${API_URL}/settings/google-config`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Status:", res.status);
        let data = await res.json();
        console.log("GET Response:", JSON.stringify(data, null, 2));

        console.log("\n2. POST /settings/google-config (Set keys)");
        res = await fetch(`${API_URL}/settings/google-config`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clientId: 'my-client-id',
                clientSecret: 'my-client-secret',
                geminiApiKey: 'my-gemini-key'
            })
        });
        console.log("Status:", res.status);
        data = await res.json();
        console.log("POST Response:", JSON.stringify(data, null, 2));

        console.log("\n3. GET /settings/google-config (Should be masked)");
        res = await fetch(`${API_URL}/settings/google-config`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        data = await res.json();
        console.log("GET Masked:", JSON.stringify(data, null, 2));

        console.log("\n4. GET /settings/google-config?include_secrets=true (Should be unmasked)");
        res = await fetch(`${API_URL}/settings/google-config?include_secrets=true`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        data = await res.json();
        console.log("GET Unmasked:", JSON.stringify(data, null, 2));

        console.log("\n5. DELETE /settings/google-config");
        res = await fetch(`${API_URL}/settings/google-config`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        data = await res.json();
        console.log("DELETE Response:", JSON.stringify(data, null, 2));

        console.log("\n6. GET /settings/google-config (Should be empty again)");
        res = await fetch(`${API_URL}/settings/google-config`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        data = await res.json();
        console.log("GET Response:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error:", err);
    }
}

run();
