
import jwt from 'jsonwebtoken';
import { fetch } from 'undici';
import dotenv from 'dotenv';
import path from 'path';

// Load env from api
dotenv.config({ path: path.join(__dirname, '../apps/api/.env') });

const API_URL = 'http://localhost:4001';
const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
    console.error("JWT_SECRET not found");
    process.exit(1);
}

const tenantId = 'test-tenant-' + Date.now();
const userId = 'test-user-' + Date.now();

const token = jwt.sign({ userId, tenantId, email: 'test@example.com', role: 'USER' }, SECRET);

console.log("Token:", token);

async function run() {
    console.log("1. GET /settings/google-config (Should be empty/null)");
    let res = await fetch(`${API_URL}/api/settings/google-config`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    let data = await res.json();
    console.log("GET Response:", JSON.stringify(data, null, 2));

    console.log("\n2. POST /settings/google-config (Set keys)");
    res = await fetch(`${API_URL}/api/settings/google-config`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            clientId: 'my-client-id',
            clientSecret: 'my-client-secret',
            geminiApiKey: 'my-gemini-key'
        })
    });
    data = await res.json();
    console.log("POST Response:", JSON.stringify(data, null, 2));

    console.log("\n3. GET /settings/google-config (Should be masked)");
    res = await fetch(`${API_URL}/api/settings/google-config`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    data = await res.json();
    console.log("GET Masked:", JSON.stringify(data, null, 2));

    console.log("\n4. GET /settings/google-config?include_secrets=true (Should be unmasked)");
    res = await fetch(`${API_URL}/api/settings/google-config?include_secrets=true`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    data = await res.json();
    console.log("GET Unmasked:", JSON.stringify(data, null, 2));

    console.log("\n5. DELETE /settings/google-config");
    res = await fetch(`${API_URL}/api/settings/google-config`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
    });
    data = await res.json();
    console.log("DELETE Response:", JSON.stringify(data, null, 2));

    console.log("\n6. GET /settings/google-config (Should be empty again)");
    res = await fetch(`${API_URL}/api/settings/google-config`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    data = await res.json();
    console.log("GET Response:", JSON.stringify(data, null, 2));
}

run().catch(console.error);
