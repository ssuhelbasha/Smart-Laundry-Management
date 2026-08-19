const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: 'shaiksuhelbasha609@gmail.com',
    pass: 'wnxk xszg qlid onps'
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function testMail() {
  try {
    console.log("Verifying SMTP connection...");
    await transporter.verify();
    console.log("SMTP connection verified successfully!");

    console.log("Sending test email to shaiksuhelbasha609@gmail.com...");
    const info = await transporter.sendMail({
      from: '"Smart Laundry" <shaiksuhelbasha609@gmail.com>',
      to: 'shaiksuhelbasha609@gmail.com',
      subject: 'Smart Laundry - Verification OTP Test',
      text: 'Your Smart Laundry verification OTP code is: 482910\n\nThis code will expire in 10 minutes.'
    });
    console.log("Email sent successfully! MessageId:", info.messageId);
  } catch (err) {
    console.error("Mail test failed:", err);
  }
}

testMail();
