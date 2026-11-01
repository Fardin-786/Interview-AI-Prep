const nodemailer = require("nodemailer")

// Configure SMTP transport using environment variables with IPv4 enforcement
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "465"),
        secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
        family: 4, // Force IPv4 to prevent IPv6 EHOSTUNREACH on macOS
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    })
}

/**
 * @name sendVerificationOtpEmail
 * @description Sends a beautifully styled 6-digit OTP email for email verification.
 * @param {Object} params - { email, username, otp }
 */
async function sendVerificationOtpEmail({ email, username, otp }) {

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; background-color: #0d1117; color: #e6edf3; margin: 0; padding: 0; }
    .container { max-width: 520px; margin: 30px auto; background-color: #161b22; border: 1px solid #2a3348; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #ff2d78, #d20d3b); padding: 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
    .body { padding: 32px 28px; text-align: center; }
    .greeting { font-size: 16px; color: #e6edf3; margin-bottom: 12px; font-weight: 600; }
    .message { font-size: 14px; color: #8b949e; line-height: 1.6; margin-bottom: 24px; }
    .otp-box { background-color: #1e2535; border: 1px dashed #ff2d78; border-radius: 12px; padding: 18px 24px; display: inline-block; margin-bottom: 24px; }
    .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ff2d78; font-family: monospace; }
    .expiry { font-size: 12px; color: #8b949e; margin-top: 8px; }
    .footer { background-color: #0d1117; padding: 16px; text-align: center; font-size: 12px; color: #8b949e; border-top: 1px solid #2a3348; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>GEN-AI Strategist</h1>
    </div>
    <div class="body">
      <div class="greeting">Hello ${username || "User"},</div>
      <div class="message">
        Thank you for registering with GEN-AI Strategist. Please enter the 6-digit verification code below to verify your email address and activate your account.
      </div>

      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="expiry">Expires in 15 minutes</div>
      </div>

      <div class="message" style="font-size: 12px;">
        If you did not request this account registration, please ignore this email.
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} GEN-AI Interview Strategist. All rights reserved.
    </div>
  </div>
</body>
</html>`

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("⚠️ SMTP credentials (SMTP_USER / SMTP_PASS) not configured in .env.")
        return true
    }

    try {
        const transporter = createTransporter()
        await transporter.sendMail({
            from: `"GEN-AI Strategist" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `${otp} is your GEN-AI Email Verification Code`,
            html: htmlContent
        })
        console.log(`✅ Verification OTP Email successfully sent to ${email}`)
        return true
    } catch (err) {
        console.error("❌ SMTP delivery failed:", err?.message || err)
        return false
    }
}

/**
 * @name sendPasswordResetOtpEmail
 * @description Sends a 6-digit OTP email for password reset.
 * @param {Object} params - { email, username, otp }
 */
async function sendPasswordResetOtpEmail({ email, username, otp }) {
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; background-color: #0d1117; color: #e6edf3; margin: 0; padding: 0; }
    .container { max-width: 520px; margin: 30px auto; background-color: #161b22; border: 1px solid #2a3348; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #e74c3c, #c0392b); padding: 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
    .body { padding: 32px 28px; text-align: center; }
    .greeting { font-size: 16px; color: #e6edf3; margin-bottom: 12px; font-weight: 600; }
    .message { font-size: 14px; color: #8b949e; line-height: 1.6; margin-bottom: 24px; }
    .otp-box { background-color: #1e2535; border: 1px dashed #e74c3c; border-radius: 12px; padding: 18px 24px; display: inline-block; margin-bottom: 24px; }
    .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #e74c3c; font-family: monospace; }
    .expiry { font-size: 12px; color: #8b949e; margin-top: 8px; }
    .footer { background-color: #0d1117; padding: 16px; text-align: center; font-size: 12px; color: #8b949e; border-top: 1px solid #2a3348; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="body">
      <div class="greeting">Hello ${username || "User"},</div>
      <div class="message">
        We received a request to reset your password for your GEN-AI Strategist account. Please enter the 6-digit verification code below to proceed with setting a new password.
      </div>

      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="expiry">Expires in 15 minutes</div>
      </div>

      <div class="message" style="font-size: 12px; color: #e74c3c;">
        🔒 If you did not request a password reset, please ignore this email or secure your account.
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} GEN-AI Interview Strategist. All rights reserved.
    </div>
  </div>
</body>
</html>`

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("⚠️ SMTP credentials not configured in .env.")
        return true
    }

    try {
        const transporter = createTransporter()
        await transporter.sendMail({
            from: `"GEN-AI Security" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `${otp} is your GEN-AI Password Reset Code`,
            html: htmlContent
        })
        console.log(`✅ Password Reset OTP Email successfully sent to ${email}`)
        return true
    } catch (err) {
        console.error("❌ Failed to send Password Reset email via Nodemailer:", err?.message || err)
        return false
    }
}

module.exports = { sendVerificationOtpEmail, sendPasswordResetOtpEmail }
