const axios = require('axios');

async function testSave() {
  const adminEmail = 'admin@orbisvoice.app';
  const adminPassword = 'admin123';
  
  try {
    const loginRes = await axios.post('http://localhost:4001/auth/login', {
      email: adminEmail,
      password: adminPassword
    });
    const token = loginRes.data.data.token;

    // Get current settings
    const current = await axios.get('http://localhost:4001/admin/settings', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const settings = current.data.data;
    console.log('Current lowCommission:', settings.lowCommission);

    // Update settings
    const newVal = settings.lowCommission === 20 ? 21 : 20;
    const saveRes = await axios.patch('http://localhost:4001/admin/settings', 
      { lowCommission: newVal },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('Save result:', saveRes.data.ok, saveRes.data.message);
    
    // Verify
    const verify = await axios.get('http://localhost:4001/admin/settings', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('New lowCommission:', verify.data.data.lowCommission);
    
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

testSave();
