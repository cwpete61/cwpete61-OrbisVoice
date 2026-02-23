
async function test() {
    try {
        const res = await fetch('http://localhost:4001/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com', password: 'password' })
        });
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Body snippet:', text.substring(0, 100));
        try {
            JSON.parse(text);
            console.log('Valid JSON');
        } catch (e) {
            console.log('Invalid JSON');
        }
    } catch (err) {
        console.error('Fetch failed:', err);
    }
}

test();
