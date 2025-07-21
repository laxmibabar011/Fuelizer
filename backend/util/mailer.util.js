// Nodemailer utility for sending OTP emails
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Send OTP email
export async function sendOtpEmail(to, otp) {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'no-reply@fuelizer.com',
    to,
    subject: 'Your FUELIZER Password Reset OTP',
    text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
    html: `<p>Your OTP for password reset is: <b>${otp}</b>. It is valid for 10 minutes.</p>`,
  };
  return transporter.sendMail(mailOptions);
} 