const { sendJson, readJson, methodNotAllowed } = require('../../lib/http');
const { loadStore, saveStore, normalizeEmail, findUser } = require('../../lib/store');
const nodemailer = require('nodemailer');

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }

  let payload;
  try {
    payload = await readJson(req);
  } catch {
    sendJson(res, { success: false, message: 'Invalid JSON body.' }, 400);
    return;
  }

  const name = (payload.name || '').trim();
  const email = normalizeEmail(payload.email);
  const password = payload.password || '';

  if (!name || !email || !password) {
    sendJson(res, { success: false, message: 'All fields are required.' }, 400);
    return;
  }
  if (password.length < 6) {
    sendJson(res, { success: false, message: 'Password must be at least 6 characters.' }, 400);
    return;
  }
  if (!EMAIL_RE.test(email)) {
    sendJson(res, { success: false, message: 'Please enter a valid email address.' }, 400);
    return;
  }

  const store = await loadStore();
  const users = store.users || [];
  if (findUser(users, email)) {
    sendJson(res, { success: false, message: 'An account with this email already exists.' }, 409);
    return;
  }

  // Generate 6-digit OTP
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Store pending registration details + OTP
  if (!store.pending_otps) store.pending_otps = {};
  store.pending_otps[email] = { otp, name, password, expiresAt };
  await saveStore(store);

  // Send Email using Gmail SMTP
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'hnhandicraftO@gmail.com',
        pass: 'W8869052132w@'
      }
    });

    const mailOptions = {
      from: '"HN Handicraft" <hnhandicraftO@gmail.com>',
      to: email,
      subject: `${otp} is your HN Handicraft verification code`,
      html: `
        <div style="max-width: 500px; margin: 0 auto; background: #faf9f6; padding: 30px; border-radius: 12px; border: 1px solid #e2ded5; font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #c29d5f; text-align: center; font-family: 'Times New Roman', Times, serif;">HN Handicraft</h2>
          <hr style="border: 0; border-top: 1px solid #e2ded5; margin: 20px 0;">
          <p>Hello,</p>
          <p>Thank you for registering with HN Handicraft. Please use the following One-Time Password (OTP) to verify your email address:</p>
          <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 30px 0; color: #222;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #666; text-align: center;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    sendJson(res, { success: true });
  } catch (err) {
    console.error('SMTP send error:', err);
    sendJson(res, { success: false, message: 'Failed to send OTP verification email. Please check SMTP configuration.' }, 500);
  }
};
