const https = require('https');

/**
 * Sends a transactional email containing the OTP code using Brevo's SMTP API.
 * Uses native https module to avoid version compatibility issues with fetch.
 * 
 * @param {string} toEmail - Recipient email
 * @param {string} otpCode - 4-digit OTP code
 * @param {string} [toName] - Recipient name
 * @returns {Promise<{success: boolean, messageId?: string}>}
 */
const sendOtpEmail = (toEmail, otpCode, toName = 'User') => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'support@foodfreshness.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'FoodFreshness Support';

    if (!apiKey) {
      console.error('Brevo API key is not configured in environment variables.');
      return reject(new Error('Email service configuration missing'));
    }

    const payload = JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: toEmail, name: toName }],
      subject: `Your FoodFreshness Verification Code: ${otpCode}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #00E676; text-align: center; margin-bottom: 20px;">FoodFreshness Verification</h2>
          <p>Hello ${toName},</p>
          <p>To verify your email address and secure your account, please enter the following 4-digit verification code (OTP):</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333333; background-color: #f5f5f5; padding: 10px 20px; border-radius: 4px; border: 1px dashed #cccccc; display: inline-block;">
              ${otpCode}
            </span>
          </div>
          <p style="color: #666666; font-size: 14px;">This code is valid for 10 minutes. If you did not request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #999999; font-size: 12px; text-align: center;">This is an automated message from FoodFreshness. Please do not reply directly to this email.</p>
        </div>
      `
    });

    const options = {
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        let parsedData;
        try {
          parsedData = JSON.parse(responseBody);
        } catch (e) {
          parsedData = { message: 'Invalid JSON response from Brevo' };
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, messageId: parsedData.messageId });
        } else {
          console.error('Brevo API error:', parsedData);
          reject(new Error(parsedData.message || `Failed with status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (e) => {
      console.error('Connection error with Brevo API:', e);
      reject(e);
    });

    req.write(payload);
    req.end();
  });
};

module.exports = { sendOtpEmail };
