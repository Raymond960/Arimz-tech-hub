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

  const SMTP_HOST = rawHost || "smtp.gmail.com";
  const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const SMTP_SECURE =
    process.env.SMTP_SECURE !== undefined
      ? String(process.env.SMTP_SECURE).toLowerCase() === "true"
      : SMTP_PORT === 465;

  const SMTP_USER = process.env.SMTP_USER?.trim();
  const SMTP_PASS = process.env.SMTP_PASS?.trim();

  const SMTP_FROM_NAME =
    process.env.SMTP_FROM_NAME?.trim() || "Shendam Connect";

  const SMTP_FROM_EMAIL =
    process.env.SMTP_FROM_EMAIL?.trim() || SMTP_USER || "no-reply@shendamconnect.gov.ng";

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
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
