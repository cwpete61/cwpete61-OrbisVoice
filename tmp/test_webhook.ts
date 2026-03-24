import axios from "axios";
import qs from "qs";

async function testWebhook() {
  const url = "http://localhost:4001/voice/inbound"; // Replace with your actual local URL/port
  
  const payload = {
    To: "+14846665235", // Twilio sends E.164
    From: "+15550001234",
    CallSid: "CA" + Math.random().toString(36).substring(7)
  };

  console.log(`Testing webhook at ${url} with phone ${payload.To}...`);

  try {
    const response = await axios.post(url, qs.stringify(payload), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log("Status:", response.status);
    console.log("Response Body:\n", response.data);
  } catch (err: any) {
    console.error("Error:", err.response?.status || err.message);
    if (err.response?.data) {
      console.log("Error Data:", err.response.data);
    }
  }
}

testWebhook();
