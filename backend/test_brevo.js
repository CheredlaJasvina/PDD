require('dotenv').config();
const { sendOtpEmail } = require('./utils/emailService');

console.log("Testing Brevo Integration...");
console.log("Using API Key:", process.env.BREVO_API_KEY ? "Loaded (length: " + process.env.BREVO_API_KEY.length + ")" : "Not Loaded");
console.log("Using Sender Email:", process.env.BREVO_SENDER_EMAIL);

const targetEmail = process.argv[2] || "jasvina@foodfreshness.com";
console.log(`Sending a test OTP code '5577' to: ${targetEmail}`);

sendOtpEmail(targetEmail, "5577", "Test Developer")
  .then(res => {
    console.log("Success! Email sent. Response:", res);
    process.exit(0);
  })
  .catch(err => {
    console.error("Failed to send email:", err.message);
    process.exit(1);
  });
