
const http = require('http');

const data = JSON.stringify({
  tier: 'starter'
});

const options = {
  hostname: 'localhost',
  port: 4001,
  path: '/billing/checkout',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbW1vOTJiZWgwMDAxY3ZxNG93dWFoa2tsIiwiZW1haWwiOiJhZG1pbkBvcmJpc3ZvaWNlLmFwcCIsInRlbmFudElkIjoiY21tbzkyYmVkMDAwMGN2cTRvYm44ZHhwaCJpYXQiOjE3NzMzNzI4Njh9.QvK9mhrdm1YTYlbSjzQiku1enDUIrxUsR5YlFAhdHk4AwMGN2Ym9kbDlsZ1VyNC'
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('STATUS: ' + res.statusCode);
    console.log('BODY: ' + body);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
