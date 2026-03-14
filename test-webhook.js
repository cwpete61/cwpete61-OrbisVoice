const crypto = require('crypto');
const axios = require('axios');

const secret = '4ab4f40a34b1c2362aebce211196649fd3da0f83b5768bf662a4e6bd66d2145a';
const url = 'http://147.93.183.4:9000/webhook';

const payload = JSON.stringify({
    ref: 'refs/heads/master',
    pusher: { name: 'antigravity-test' },
    commits: [ { id: 'test', message: 'test gitup' } ]
});

const hmac = crypto.createHmac('sha256', secret);
hmac.update(payload);
const signature = 'sha256=' + hmac.digest('hex');

axios.post(url, payload, {
    headers: {
        'Content-Type': 'application/json',
        'X-GitHub-Event': 'push',
        'X-Hub-Signature-256': signature
    }
}).then(res => {
    console.log('Status:', res.status);
    console.log('Body:', res.data);
}).catch(err => {
    console.error('Error:', err.response ? err.response.data : err.message);
});
