const SibApiV3Sdk = require('sib-api-v3-sdk');
require('dotenv').config();

const apiKey = process.env.BREVO_API_KEY;
const senderEmail = process.env.BREVO_SENDER_EMAIL;
const senderName = process.env.BREVO_SENDER_NAME || 'Your App';

if (!apiKey) {
  console.warn('BREVO_API_KEY not set — Brevo emails will fail until configured');
}

const client = SibApiV3Sdk.ApiClient.instance;
client.authentications['api-key'].apiKey = apiKey;

const transactionalEmailsApi = new SibApiV3Sdk.TransactionalEmailsApi();

async function sendResetEmail(toEmail, toName, resetUrl) {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = { email: senderEmail, name: senderName };
  sendSmtpEmail.to = [{ email: toEmail, name: toName || toEmail }];
  sendSmtpEmail.subject = 'Password reset instructions';
  sendSmtpEmail.htmlContent = `
    <p>Hello ${toName || ''},</p>
    <p>You requested a password reset. Click the link below to reset your password. This link expires in 1 hour.</p>
    <p><a href="${resetUrl}">Reset your password</a></p>
    <p>If you didn't request this, you can safely ignore this email.</p>
  `;

  try {
    const result = await transactionalEmailsApi.sendTransacEmail(sendSmtpEmail);
    return result;
  } catch (err) {
    console.error('Brevo send error:', err && err.response ? err.response.body : err);
    throw err;
  }
}

module.exports = { sendResetEmail };
