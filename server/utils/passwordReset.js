import crypto from 'crypto';
import nodemailer from 'nodemailer';

const RESET_TOKEN_LIFETIME_MS = 15 * 60 * 1000;

export const createPasswordResetCode = () => {
  const code = crypto.randomInt(100000, 1000000).toString();

  return {
    code,
    codeHash: crypto.createHash('sha256').update(code).digest('hex'),
    expiresAt: new Date(Date.now() + RESET_TOKEN_LIFETIME_MS),
  };
};

export const hashPasswordResetCode = (code) =>
  crypto.createHash('sha256').update(String(code || '')).digest('hex');

export const sendPasswordResetEmail = async ({ recipient, code }) => {
  const gmailUser = String(process.env.GMAIL_USER || '').trim();
  const gmailAppPassword = String(process.env.GMAIL_APP_PASSWORD || '').trim();

  if (!gmailUser || !gmailAppPassword) {
    throw new Error(
      'Password reset email is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.'
    );
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  await transporter.sendMail({
    from: `Huruspaces <${gmailUser}>`,
    to: recipient,
    subject: 'Your Huruspaces password reset code',
    text: `Your Huruspaces password reset code is ${code}. It expires in 15 minutes. Do not share this code.`,
    html: `<p>Your Huruspaces password reset code is:</p><p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${code}</p><p>It expires in 15 minutes. Do not share this code.</p>`,
  });

  return { delivery: 'email' };
};
