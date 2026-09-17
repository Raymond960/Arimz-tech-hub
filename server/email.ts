import nodemailer from 'nodemailer';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  fromName: string;
  fromEmail?: string;
  from: string;
  frontendUrl: string;
  inviteExp: string;
}

export interface SmtpConfigStatus {
  configured: boolean;
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  from?: string;
  missingFields: string[];
  note?: string;
}

/**
 * Parse an invitation expiry duration string (e.g., "24h", "48h", "7d", "1440m", or numeric hours/ms).
 * Defaults to 24 hours (86,400,000 ms) in accordance with ADMIN_INVITE_EXP=24h.
 */
export function parseAdminInviteExpiryMs(expStr?: string): number {
  const val = (expStr || process.env.ADMIN_INVITE_EXP || process.env.ADMIN_INVITE_EXPIRY_HOURS || '24h')
    .trim()
    .toLowerCase();

  if (val.endsWith('h')) {
    const hours = parseFloat(val.slice(0, -1));
    return (isNaN(hours) || hours <= 0 ? 24 : hours) * 60 * 60 * 1000;
  }
  if (val.endsWith('d')) {
    const days = parseFloat(val.slice(0, -1));
    return (isNaN(days) || days <= 0 ? 1 : days) * 24 * 60 * 60 * 1000;
  }
  if (val.endsWith('m')) {
    const mins = parseFloat(val.slice(0, -1));
    return (isNaN(mins) || mins <= 0 ? 1440 : mins) * 60 * 1000;
  }
  const num = parseFloat(val);
  if (!isNaN(num) && num > 0) {
    // If number is small (e.g. 24 or 48), interpret as hours; if large (>= 1000), interpret as ms
    return num < 1000 ? num * 60 * 60 * 1000 : num;
  }
  return 24 * 60 * 60 * 1000;
}

/**
 * Reads and validates the SMTP configuration from environment variables.
 * Automatically fixes known typos (such as SMP.gmail.com -> smtp.gmail.com).
 * Reads:
 *  - SMTP_HOST (default: smtp.gmail.com)
 *  - SMTP_PORT (default: 587)
 *  - SMTP_SECURE (default: false for port 587, true for port 465)
 *  - SMTP_USER
 *  - SMTP_PASS
 *  - SMTP_FROM_NAME (default: Shendam Connect)
 *  - SMTP_FROM_EMAIL
 *  - FRONTEND_URL
 *  - ADMIN_INVITE_EXP
 */
export function getSmtpConfig(): SmtpConfig {
  let rawHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();

  // Correct known typographical error SMP.gmail.com -> smtp.gmail.com
  if (/^smp\./i.test(rawHost)) {
    console.warn(
      `[SMTP Warning] Detected typographical error in SMTP_HOST: '${rawHost}'. Auto-correcting to '${rawHost.replace(/^smp\./i, 'smtp.')}'. Please update your deployed environment variable to SMTP_HOST=smtp.gmail.com.`
    );
    rawHost = rawHost.replace(/^smp\./i, 'smtp.');
    // Also update runtime process.env so subsequent reads are consistent
    process.env.SMTP_HOST = rawHost;
  }

  const host = rawHost || 'smtp.gmail.com';
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;

  // If SMTP_SECURE is explicitly set, use it; otherwise true only for port 465
  let secure = false;
  if (process.env.SMTP_SECURE !== undefined) {
    secure = String(process.env.SMTP_SECURE).trim().toLowerCase() === 'true';
  } else {
    secure = port === 465;
  }

  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  const fromName = process.env.SMTP_FROM_NAME?.trim() || 'Shendam Connect';
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim() || user || 'no-reply@shendamconnect.gov.ng';
  const from = `"${fromName}" <${fromEmail}>`;

  const frontendUrl =
    process.env.FRONTEND_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    'https://shendamconnectapp.vercel.app/';

  const inviteExp =
    process.env.ADMIN_INVITE_EXP?.trim() ||
    process.env.ADMIN_INVITE_EXPIRY_HOURS?.trim() ||
    '24h';

  return {
    host,
    port,
    secure,
    user,
    pass,
    fromName,
    fromEmail,
    from,
    frontendUrl,
    inviteExp
  };
}

/**
 * Returns the public status of SMTP configuration without exposing secrets.
 */
export function getSmtpStatus(): SmtpConfigStatus {
  const config = getSmtpConfig();
  const missingFields: string[] = [];

  if (!config.host) missingFields.push('SMTP_HOST');
  if (!config.user) missingFields.push('SMTP_USER');
  if (!config.pass) missingFields.push('SMTP_PASS');

  return {
    configured: missingFields.length === 0,
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.user,
    from: config.from,
    missingFields
  };
}

/**
 * Formats a clean, safe diagnostic error message without leaking passwords or internal secrets.
 */
export function formatSafeSmtpError(err: any): string {
  if (!err) {
    return 'Email delivery is not configured correctly. Please check SMTP_HOST, SMTP_USER and SMTP_PASS.';
  }

  const msg = String(err?.message || '');
  const code = String(err?.code || '');
  const responseCode = Number(err?.responseCode || 0);

  if (code === 'ENOTFOUND' || code === 'EDNS' || /ENOTFOUND/i.test(msg)) {
    return `Email delivery failed: Cannot resolve SMTP host (${err?.hostname || 'SMP.gmail.com'}). Please verify SMTP_HOST is exactly smtp.gmail.com in your environment variables.`;
  }

  if (code === 'EAUTH' || responseCode === 534 || /Application-specific password/i.test(msg) || /InvalidSecondFactor/i.test(msg)) {
    return 'Email delivery is not configured correctly. Gmail authentication failed: an Application-Specific Password is required for your Google account. Please generate a 16-character App Password at https://myaccount.google.com/apppasswords and set it as SMTP_PASS, then check SMTP_HOST, SMTP_USER and SMTP_PASS.';
  }

  if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ESOCKETTIMEDOUT') {
    return 'Email delivery failed: SMTP connection timed out or was refused. Please check SMTP_HOST and SMTP_PORT.';
  }

  return 'Email delivery is not configured correctly. Please check SMTP_HOST, SMTP_USER and SMTP_PASS.';
}

/**
 * Safe connection test against the SMTP provider.
 */
export async function verifySmtpConnection(): Promise<{ valid: boolean; error?: string }> {
  const config = getSmtpConfig();
  const missing: string[] = [];

  if (!config.host) missing.push('SMTP_HOST');
  if (!config.user) missing.push('SMTP_USER');
  if (!config.pass) missing.push('SMTP_PASS');

  if (missing.length > 0) {
    return {
      valid: false,
      error: 'Email delivery is not configured correctly. Please check SMTP_HOST, SMTP_USER and SMTP_PASS.'
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.verify();
    return { valid: true };
  } catch (err: any) {
    console.error('[SMTP Verification Error]:', formatSafeSmtpError(err));
    return {
      valid: false,
      error: formatSafeSmtpError(err)
    };
  }
}

/**
 * Dispatches an administrative invitation email to a newly added administrator.
 * Distinguishes between account creation and email delivery success.
 */
export async function sendAdminInvitationEmail(params: {
  email: string;
  name: string;
  roleTitle: string;
  invitationToken: string;
  baseUrl?: string;
  expiresAt?: Date;
}): Promise<{ success: boolean; error?: string; inviteUrl: string; messageId?: string }> {
  const { email, name, roleTitle, invitationToken, baseUrl, expiresAt } = params;
  const config = getSmtpConfig();

  // Resolve base URL: prefer FRONTEND_URL, fallback to parameter baseUrl
  const effectiveBaseUrl = (config.frontendUrl || baseUrl || 'https://shendamconnectapp.vercel.app/').replace(/\/$/, '');
  const inviteUrl = `${effectiveBaseUrl}/?invite_token=${encodeURIComponent(invitationToken)}#accept-invite`;

  // Verify prerequisites
  if (!config.host || !config.user || !config.pass) {
    return {
      success: false,
      error: 'Email delivery is not configured correctly. Please check SMTP_HOST, SMTP_USER and SMTP_PASS.',
      inviteUrl
    };
  }

  const expiryDurationText = config.inviteExp.endsWith('h')
    ? `${config.inviteExp.slice(0, -1)} hours`
    : config.inviteExp.endsWith('d')
    ? `${config.inviteExp.slice(0, -1)} days`
    : '24 hours';

  const expiryTimestampText = expiresAt
    ? expiresAt.toLocaleString('en-NG', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Africa/Lagos'
      }) + ' (WAT)'
    : `${expiryDurationText} from now`;

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 12000,
      tls: {
        rejectUnauthorized: false
      }
    });

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You're invited to Shendam Connect Admin</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #020C1B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #04142F; border: 1px solid #1E293B; border-radius: 16px; overflow: hidden; margin: 0 auto; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
        <!-- Header -->
        <tr>
          <td style="padding: 32px 32px 24px 32px; text-align: center; background: linear-gradient(180deg, #0A2246 0%, #04142F 100%); border-bottom: 1px solid #1E293B;">
            <div style="display: inline-block; background-color: rgba(255, 201, 40, 0.1); border: 1px solid rgba(255, 201, 40, 0.3); border-radius: 12px; padding: 8px 16px; margin-bottom: 12px;">
              <span style="color: #FFC928; font-weight: 800; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">Shendam Connect</span>
            </div>
            <h1 style="color: #FFFFFF; font-size: 22px; font-weight: 700; margin: 8px 0 0 0; letter-spacing: -0.5px;">Admin Portal Invitation</h1>
            <p style="color: #9BAABD; font-size: 13px; margin: 6px 0 0 0;">Official Local Government Area Digital Platform</p>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding: 32px;">
            <p style="color: #FFFFFF; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">Hello ${name},</p>
            <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
              You have been invited to become an administrator of <strong style="color: #FFFFFF;">Shendam Connect</strong> with the role of <strong style="color: #FFC928;">${roleTitle}</strong>.
            </p>
            <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6; margin: 0 0 28px 0;">
              As an administrator, you will have access to manage local business listings, public services, community updates, and administrative tools for Shendam Local Government Area.
            </p>
            <!-- CTA Button -->
            <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 28px auto;">
              <tr>
                <td align="center" style="border-radius: 12px; background-color: #FFC928;">
                  <a href="${inviteUrl}" target="_blank" style="font-size: 15px; font-weight: 700; color: #04142F; text-decoration: none; padding: 14px 28px; border-radius: 12px; border: 1px solid #FFC928; display: inline-block;">
                    Accept Invitation & Set Password &rarr;
                  </a>
                </td>
              </tr>
            </table>
            <div style="background-color: #061D40; border: 1px solid #1E293B; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #94A3B8; font-size: 12px; margin: 0 0 8px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Direct Invitation Link:</p>
              <p style="margin: 0; word-break: break-all;">
                <a href="${inviteUrl}" style="color: #38BDF8; font-size: 13px; text-decoration: underline;">${inviteUrl}</a>
              </p>
            </div>
            <p style="color: #64748B; font-size: 12px; line-height: 1.5; margin: 0;">
              ⏱️ <strong>Security Note:</strong> This invitation link is valid until <strong>${expiryTimestampText}</strong> (${expiryDurationText}). If you were not expecting this invitation, please ignore this email.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding: 20px 32px; background-color: #020C1B; border-top: 1px solid #1E293B; text-align: center;">
            <p style="color: #64748B; font-size: 12px; margin: 0;">
              Shendam Local Government Council &bull; Plateau State, Nigeria
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: config.from,
      to: email,
      subject: `You're invited to Shendam Connect Admin (${roleTitle})`,
      html: htmlContent
    });

    return {
      success: true,
      inviteUrl,
      messageId: info.messageId
    };
  } catch (err: any) {
    const safeError = formatSafeSmtpError(err);
    console.error('[EmailService] SMTP delivery error:', safeError);
    return {
      success: false,
      error: safeError,
      inviteUrl
    };
  }
}
