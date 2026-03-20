const axios = require('axios');

async function testStats() {
  const adminEmail = 'admin@orbisvoice.app';
  const adminPassword = 'admin123';
  
  // Login first
  try {
    const loginRes = await axios.post('http://localhost:4001/auth/login', {
      email: adminEmail,
      password: adminPassword
    });
    
    if (!loginRes.data.ok) {
      console.error('Login failed:', loginRes.data);
      return;
    }
    
    const token = loginRes.data.data.token;
    console.log('Logged in, got token');
    
    // Get stats
    const statsRes = await axios.get('http://localhost:4001/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Stats code:', statsRes.status);
    console.log('Stats response:', JSON.stringify(statsRes.data, null, 2));
    
    // Get settings
    const settingsRes = await axios.get('http://localhost:4001/admin/settings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Settings code:', settingsRes.status);
    console.log('Settings response:', JSON.stringify(settingsRes.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.error('API Error:', err.response.status, err.response.data);
    } else {
      console.error('Request Error:', err.message);
    }
  }
}

testStats();
