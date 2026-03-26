
import fetch from "node-fetch";

async function testInbound(phoneNumberTo) {
  const url = "http://localhost:4001/voice/inbound"; // In development or test locally
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: phoneNumberTo,
      From: "+1234567890",
      CallSid: "CA123456789",
    }).toString(),
  });

  const text = await response.text();
  console.log("Status:", response.status);
  console.log("TwiML:", text);
}

const targetNumber = process.argv[2] || "+1234567890";
testInbound(targetNumber);
