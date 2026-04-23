const nodemailer = require("nodemailer");

const getMailConfig = () => ({
  user: String(process.env.GMAIL_USER || "").trim(),
  pass: String(process.env.GMAIL_APP_PASSWORD || "").trim(),
  from:
    String(process.env.EMAIL_FROM || "").trim() ||
    String(process.env.GMAIL_USER || "").trim(),
});

const isEmailDeliveryConfigured = () => {
  const config = getMailConfig();
  return Boolean(config.user && config.pass && config.from);
};

const createTransporter = () => {
  const config = getMailConfig();

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
};

const sendResetCodeEmail = async ({ to, name, resetCode, expiresInMinutes }) => {
  const config = getMailConfig();

  if (!isEmailDeliveryConfigured()) {
    throw new Error("Email delivery is not configured");
  }

  const transporter = createTransporter();
  const displayName = String(name || "there").trim();

  await transporter.sendMail({
    from: config.from,
    to,
    subject: "Invy password reset code",
    text: `Hello ${displayName}, your Invy password reset code is ${resetCode}. It expires in ${expiresInMinutes} minutes.`,
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#17324a">
        <h2 style="margin-bottom:12px;">Invy password reset</h2>
        <p>Hello ${displayName},</p>
        <p>Use the reset code below to update your password:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:0.2em;margin:20px 0;color:#1f8ef1;">
          ${resetCode}
        </p>
        <p>This code expires in ${expiresInMinutes} minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
};

module.exports = {
  isEmailDeliveryConfigured,
  sendResetCodeEmail,
};
