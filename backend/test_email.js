
const nodemailer = require('nodemailer');
require('dotenv').config({ path: 'd:/hackaura/Mandi-Connect/backend/.env' });

const SMTP_EMAIL = process.env.SMTP_EMAIL;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;

console.log('Using email:', SMTP_EMAIL);

async function testEmail() {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: SMTP_EMAIL,
        pass: SMTP_PASSWORD
      }
    });

    const info = await transporter.sendMail({
      from: SMTP_EMAIL,
      to: SMTP_EMAIL,
      subject: 'MandiConnect SMTP Test',
      text: 'Test email from MandiConnect'
    });

    console.log('✅ Email sent:', info.response);
  } catch (err) {
    console.error('❌ Email error:', err.message);
  }
}

testEmail();
