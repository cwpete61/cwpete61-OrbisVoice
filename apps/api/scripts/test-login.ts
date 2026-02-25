
import axios from 'axios';

async function testLogin() {
    try {
        console.log("Testing login with admin@orbisvoice.app...");
        const response = await axios.post('http://localhost:4001/auth/login', {
            email: 'admin@orbisvoice.app',
            password: 'admin123'
        });
        console.log("Login Success:", response.data);
    } catch (error: any) {
        console.error("Login Failed:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else {
            console.error("Error:", error.message);
        }
    }
}

testLogin();
