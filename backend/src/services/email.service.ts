import nodemailer from "nodemailer";

export function getSmtpConfig() {
  let rawHost = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
  if (/^smp\./i.test(rawHost)) {
    console.warn(
      `[SMTP Warning] Detected typographical error in SMTP_HOST: '${rawHost}'. Correcting to '${rawHost.replace(/^smp\./i, "smtp.")}'.`
    );
    rawHost = rawHost.replace(/^smp\./i, "smtp.");
    process.env.SMTP_HOST = rawHost;
  }

  // Always ensure exact host smtp.gmail.com
  let SMTP_HOST = "smtp.gmail.com";
  if (rawHost && !/^smp\./i.test(rawHost)) {
    SMTP_HOST = rawHost;
  }
  process.env.SMTP_HOST = SMTP_HOST;

  const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  process.env.SMTP_PORT = String(SMTP_PORT);

  const SMTP_SECURE =
    process.env.SMTP_SECURE !== undefined
      ? String(process.env.SMTP_SECURE).toLowerCase() === "true"
      : SMTP_PORT === 465;

  let SMTP_USER = (process.env.SMTP_USER || "domnanraymond9@gmail.com").trim().replace(/^["']|["']$/g, "");
  if (!SMTP_USER) SMTP_USER = "domnanraymond9@gmail.com";
  process.env.SMTP_USER = SMTP_USER;

  // Read password strictly from environment variable SMTP_PASS
  let SMTP_PASS = (process.env.SMTP_PASS || "").trim().replace(/^["']|["']$/g, "");
  SMTP_PASS = SMTP_PASS.replace(/\s+/g, "");
  process.env.SMTP_PASS = SMTP_PASS;

  const SMTP_FROM_NAME =
    process.env.SMTP_FROM_NAME?.trim() || "Shendam Connect";

  const SMTP_FROM_EMAIL =
    (process.env.EMAIL_FROM || process.env.SMTP_FROM_EMAIL || SMTP_USER || "domnanraymond9@gmail.com").replace(/^["']|["']$/g, "").trim();
  process.env.EMAIL_FROM = SMTP_FROM_EMAIL;

  const FRONTEND_URL =
    process.env.FRONTEND_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "https://shendamconnectapp.vercel.app/";

  const ADMIN_INVITE_EXP =
    process.env.ADMIN_INVITE_EXP?.trim() ||
    process.env.ADMIN_INVITE_EXPIRY_HOURS?.trim() ||
    "24h";

  return {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM_NAME,
    SMTP_FROM_EMAIL,
    FRONTEND_URL,
    ADMIN_INVITE_EXP
  };
}

export function formatSafeSmtpError(err: any): string {
  if (!err) {
    return "Email delivery is not configured correctly. Please check SMTP_HOST, SMTP_USER and SMTP_PASS.";
  }

  const msg = String(err?.message || "");
  const code = String(err?.code || "");
  const responseCode = Number(err?.responseCode || 0);

  if (code === "ENOTFOUND" || code === "EDNS" || /ENOTFOUND/i.test(msg)) {
    return `Email delivery failed: Cannot resolve SMTP host (${err?.hostname || "SMP.gmail.com"}). Please verify SMTP_HOST is exactly smtp.gmail.com in your environment variables.`;
  }

  if (
    code === "EAUTH" ||
    responseCode === 534 ||
    /Application-specific password/i.test(msg) ||
    /InvalidSecondFactor/i.test(msg)
  ) {
    return "Email delivery is not configured correctly. Gmail authentication failed: an Application-Specific Password is required for your Google account. Please generate a 16-character App Password at https://myaccount.google.com/apppasswords and set it as SMTP_PASS, then check SMTP_HOST, SMTP_USER and SMTP_PASS.";
  }

  if (code === "ECONNREFUSED" || code === "ETIMEDOUT" || code === "ESOCKETTIMEDOUT") {
    return "Email delivery failed: SMTP connection timed out or was refused. Please check SMTP_HOST and SMTP_PORT.";
  }

  return "Email delivery is not configured correctly. Please check SMTP_HOST, SMTP_USER and SMTP_PASS.";
}

function validateSMTPConfiguration() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = getSmtpConfig();
  const missing: string[] = [];

  if (!SMTP_HOST) missing.push("SMTP_HOST");
  if (!SMTP_USER) missing.push("SMTP_USER");
  if (!SMTP_PASS) missing.push("SMTP_PASS");

  if (missing.length > 0) {
    throw new Error(
      "Email delivery is not configured correctly. Please check SMTP_HOST, SMTP_USER and SMTP_PASS."
    );
  }
}

export function getTransporter() {
  validateSMTPConfiguration();
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = getSmtpConfig();

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    requireTLS: !SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false
    }
  });
}

export async function verifySMTP(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    return true;
  } catch (err: any) {
    const safeError = formatSafeSmtpError(err);
    console.error("[SMTP Service] verifySMTP error:", safeError);
    throw new Error(safeError);
  }
}

export async function sendAdminInvitationEmail({
  email,
  name,
  invitationUrl,
  expiresAt
}: {
  email: string;
  name?: string;
  invitationUrl: string;
  expiresAt: Date;
}) {
  try {
    const transporter = getTransporter();
    const { SMTP_FROM_NAME, SMTP_FROM_EMAIL, ADMIN_INVITE_EXP } = getSmtpConfig();

    const recipientName = name?.trim() || "Administrator";

    const expiryText = expiresAt.toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Lagos"
    });

    const expiryDuration = ADMIN_INVITE_EXP.endsWith("h")
      ? `${ADMIN_INVITE_EXP.slice(0, -1)} hours`
      : ADMIN_INVITE_EXP.endsWith("d")
      ? `${ADMIN_INVITE_EXP.slice(0, -1)} days`
      : "24 hours";

    const text = `
Hello ${recipientName},

You have been invited to become an administrator of Shendam Connect.

Shendam Connect is the digital platform connecting Shendam to the digital world.

To accept your administrator invitation, open this link:

${invitationUrl}

This invitation expires on: ${expiryText} (${expiryDuration}).

For security reasons, do not share this invitation link with anyone.

If you did not expect this invitation, you can safely ignore this email.

Regards,
Shendam Connect Administration
`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shendam Connect Administrator Invitation</title>
</head>
<body style="margin:0; padding:0; background:#f4f7fb; font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.08);">
    <div style="background:#082d5c; padding:30px 20px; text-align:center;">
      <h1 style="margin:0; color:#ffffff; font-size:28px;">Shendam Connect</h1>
      <p style="color:#dbeafe; margin:8px 0 0; font-size:14px;">Connecting Shendam to the Digital World</p>
    </div>
    <div style="padding:32px 25px; color:#172033;">
      <h2 style="margin-top:0; font-size:22px;">Administrator Invitation</h2>
      <p>Hello <strong>${escapeHtml(recipientName)}</strong>,</p>
      <p>You have been invited to become an administrator of <strong>Shendam Connect</strong>.</p>
      <p>Click the button below to accept your administrator invitation.</p>
      <div style="text-align:center; margin:32px 0;">
        <a href="${escapeHtml(invitationUrl)}" style="display:inline-block; padding:15px 28px; background:#ffc107; color:#172033; text-decoration:none; border-radius:10px; font-weight:bold; font-size:16px;">
          Accept Admin Invitation
        </a>
      </div>
      <p style="font-size:14px; color:#5b6575;">
        This invitation expires on: <strong>${escapeHtml(expiryText)}</strong> (${escapeHtml(expiryDuration)})
      </p>
      <div style="background:#fff8df; border-radius:10px; padding:16px; margin-top:24px; color:#665300; font-size:13px;">
        For security reasons, do not share this invitation link with anyone.
      </div>
      <p style="color:#6b7280; font-size:13px; margin-top:28px;">
        If you did not expect this invitation, you can safely ignore this email.
      </p>
    </div>
    <div style="background:#f8fafc; padding:20px; text-align:center; color:#7b8794; font-size:12px;">
      Shendam Connect Administration
    </div>
  </div>
</body>
</html>
`;

    const result = await transporter.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
      to: email,
      subject: "You have been invited to Shendam Connect Admin",
      text,
      html
    });

    return {
      messageId: result.messageId
    };
  } catch (err: any) {
    const safeError = formatSafeSmtpError(err);
    console.error("[EmailService] sendAdminInvitationEmail error:", safeError);
    throw new Error(safeError);
  }
}

export async function sendUserVerificationEmail({
  email,
  code,
  name,
  expiresMinutes = 10
}: {
  email: string;
  code: string;
  name?: string;
  expiresMinutes?: number;
}) {
  try {
    const transporter = getTransporter();
    const { SMTP_FROM_NAME, SMTP_FROM_EMAIL } = getSmtpConfig();

    console.log("[AUTH] Email service initialized");
    const maskedEmail = email.replace(/(?<=^.{2}).(?=.*@)/g, "*");
    console.log(`[AUTH] Sending verification email to ${maskedEmail}`);

    const recipientGreeting = name?.trim() ? `Hello ${escapeHtml(name.trim())},` : "Hello,";

    const text = `
SHENDAM CONNECT
========================================
Account Verification

Your verification code:
${code}

This code expires in ${expiresMinutes} minutes.

If you did not request this verification code, you can ignore this email.

Shendam Connect Platform • Plateau State, Nigeria
    `.trim();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Shendam Connect Verification Code</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #020C1B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #04142F; border: 1px solid #1E293B; border-radius: 16px; overflow: hidden; margin: 0 auto; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
    <tr>
      <td style="padding: 28px 24px 20px 24px; text-align: center; background: linear-gradient(180deg, #0A2246 0%, #04142F 100%); border-bottom: 1px solid #1E293B;">
        <div style="display: inline-block; background-color: rgba(255, 201, 40, 0.12); border: 1px solid rgba(255, 201, 40, 0.35); border-radius: 10px; padding: 6px 14px; margin-bottom: 10px;">
          <span style="color: #FFC928; font-weight: 800; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase;">SHENDAM CONNECT</span>
        </div>
        <h1 style="color: #FFFFFF; font-size: 20px; font-weight: 700; margin: 6px 0 0 0; letter-spacing: -0.5px;">Account Verification</h1>
        <p style="color: #9BAABD; font-size: 12px; margin: 4px 0 0 0;">Community & Commerce Digital Hub</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 28px 24px;">
        <p style="color: #E2E8F0; font-size: 15px; line-height: 1.5; margin: 0 0 12px 0;">
          ${recipientGreeting}
        </p>
        <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
          Welcome to <strong style="color: #FFC928;">Shendam Connect</strong>! Please use the 4-digit verification code below to complete your registration and activate your account:
        </p>
        <div style="background-color: #08254D; border: 2px dashed rgba(255, 201, 40, 0.45); border-radius: 14px; padding: 22px 16px; text-align: center; margin: 20px 0;">
          <div style="color: #9BAABD; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Your 4-Digit Verification Code</div>
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #FFC928; text-shadow: 0 2px 8px rgba(255, 201, 40, 0.3); padding-left: 12px;">
            ${code}
          </div>
          <div style="color: #CBD5E1; font-size: 12px; margin-top: 10px;">
            ⏱️ This code expires in <strong>${expiresMinutes} minutes</strong>.
          </div>
        </div>
        <p style="color: #94A3B8; font-size: 12px; line-height: 1.5; margin: 20px 0 0 0;">
          If you did not request this verification code, you can ignore this email.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 24px; background-color: #020C1B; border-top: 1px solid #1E293B; text-align: center;">
        <p style="color: #64748B; font-size: 11px; margin: 0;">
          Shendam Connect Platform &bull; Plateau State, Nigeria
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const result = await transporter.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
      to: email,
      subject: `${code} is your Shendam Connect verification code`,
      text,
      html
    });

    console.log("[AUTH] Email provider accepted message", result.messageId);
    return {
      success: true,
      messageId: result.messageId
    };
  } catch (err: any) {
    const safeError = formatSafeSmtpError(err);
    console.error("[AUTH] Verification email failed:", safeError);
    return {
      success: false,
      error: safeError
    };
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
