import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not configured");
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM_ADDRESS = "SurveyPro <noreply@thecxdi.com>";

// ─── Branding Defaults ────────────────────────────────────────────────────────

const DEFAULT_PRIMARY_COLOR = "#00BCD4";
const DEFAULT_SECONDARY_COLOR = "#0097A7";
const DEFAULT_PLATFORM_NAME = "CXDi SurveyPro";

/**
 * Convert a potentially relative /manus-storage/... path into an absolute URL.
 * Email clients cannot load relative URLs, so we need the full origin.
 * The origin is passed in from the procedure that calls sendSurveyInvitationEmail
 * (it already receives `input.origin` for the survey URL).
 */
function toAbsoluteUrl(url: string | null | undefined, origin: string): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Relative path like /manus-storage/... — prepend origin
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

export interface EmailBrandingOptions {
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  signatureTag?: string | null;
  usePlatformBranding?: boolean | null;
  organizationName: string;
}

function resolveBranding(b: EmailBrandingOptions) {
  const primary = b.primaryColor?.trim() || DEFAULT_PRIMARY_COLOR;
  const secondary = b.secondaryColor?.trim() || DEFAULT_SECONDARY_COLOR;
  const senderLabel = b.usePlatformBranding ? DEFAULT_PLATFORM_NAME : b.organizationName;
  const footer = b.signatureTag?.trim() || (b.usePlatformBranding
    ? `Powered by ${DEFAULT_PLATFORM_NAME}`
    : b.organizationName);
  return { primary, secondary, senderLabel, footer, logoUrl: b.logoUrl ?? null };
}

// ─── Survey Invitation Email ──────────────────────────────────────────────────

export interface SendInvitationParams {
  to: string;
  recipientName: string | null;
  organizationName: string;
  surveyTitle: string;
  surveyUrl: string;
  personalMessage?: string | null;
  senderName: string;
  branding?: EmailBrandingOptions | null;
  /** Origin of the app (e.g. https://surveyapp-je5r8hbw.manus.space) used to make relative logo URLs absolute */
  origin?: string | null;
}

export async function sendSurveyInvitationEmail(params: SendInvitationParams): Promise<boolean> {
  const {
    to,
    recipientName,
    organizationName,
    surveyTitle,
    surveyUrl,
    personalMessage,
    senderName,
    branding,
    origin,
  } = params;

  const b = resolveBranding(branding ?? { organizationName });
  const greeting = recipientName ? `Dear ${recipientName},` : "Dear Valued Customer,";

  // Make logo URL absolute so email clients can load it
  const absoluteLogoUrl = b.logoUrl && origin ? toAbsoluteUrl(b.logoUrl, origin) : b.logoUrl;
  const logoHtml = absoluteLogoUrl
    ? `<img src="${absoluteLogoUrl}" alt="${b.senderLabel}" style="max-height:48px;max-width:180px;object-fit:contain;display:block;" />`
    : `<span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">${b.senderLabel}</span>`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Survey Invitation</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:${b.primary};padding:28px 40px;">
              ${logoHtml}
            </td>
          </tr>

          <!-- Survey title banner -->
          <tr>
            <td style="background:${b.primary}18;padding:16px 40px;border-bottom:1px solid ${b.primary}30;">
              <p style="margin:0;color:#374151;font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Survey Invitation</p>
              <h2 style="margin:4px 0 0;color:#111827;font-size:20px;font-weight:700;line-height:1.3;">${surveyTitle}</h2>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="margin:0 0 18px;color:#374151;font-size:16px;line-height:1.6;">${greeting}</p>
              <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.7;">
                <strong>${organizationName}</strong> has invited you to share your feedback through the
                <strong>${surveyTitle}</strong> survey. Your responses are confidential and will only
                be used to improve our services.
              </p>
              ${
                personalMessage
                  ? `<div style="background:#f9fafb;border-left:4px solid ${b.secondary};padding:14px 18px;margin:0 0 24px;border-radius:0 8px 8px 0;">
                      <p style="margin:0;color:#374151;font-size:14px;font-style:italic;line-height:1.6;">"${personalMessage}"</p>
                      <p style="margin:8px 0 0;color:#6b7280;font-size:12px;">— ${senderName}</p>
                    </div>`
                  : ""
              }
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">The survey takes approximately 3–5 minutes to complete.</p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:28px 0 20px;">
                <tr>
                  <td style="background:${b.secondary};border-radius:8px;">
                    <a href="${surveyUrl}" target="_blank"
                       style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">
                      Start Survey &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">Or copy this link into your browser:</p>
              <p style="margin:0;color:${b.primary};font-size:12px;word-break:break-all;">${surveyUrl}</p>
            </td>
          </tr>

          <!-- Confidentiality notice -->
          <tr>
            <td style="background:#f9fafb;padding:16px 40px;border-top:1px solid #f0f0f0;">
              <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6;">
                <strong>Confidentiality:</strong> Your responses are completely confidential and will only be used for research and service improvement. They will not be shared with third parties.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f4f6f8;padding:20px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                If you did not expect this message, you may safely ignore it.
              </p>
              <p style="margin:8px 0 0;color:#9ca3af;font-size:11px;">${b.footer}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${greeting}\n\n${organizationName} has invited you to complete the "${surveyTitle}" survey.\n\n${personalMessage ? `Message from ${senderName}: "${personalMessage}"\n\n` : ""}Click the link below to start:\n${surveyUrl}\n\nYour responses are confidential.\n\n${b.footer}`;

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Survey Invitation: ${surveyTitle} — ${organizationName}`,
      html,
      text,
    });
    if (error) {
      console.error("[Email] Resend error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Email] Failed to send invitation:", err);
    return false;
  }
}

// ─── Report Email ─────────────────────────────────────────────────────────────

export interface SendReportParams {
  to: string;
  recipientName: string;
  organizationName: string;
  surveyTitle: string;
  reportPeriod: string;
  totalResponses: number;
  completedResponses: number;
  completionRate: number;
  csvContent: string;
  csvFilename: string;
}

export async function sendReportEmail(params: SendReportParams): Promise<boolean> {
  const {
    to,
    recipientName,
    organizationName,
    surveyTitle,
    reportPeriod,
    totalResponses,
    completedResponses,
    completionRate,
    csvContent,
    csvFilename,
  } = params;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Survey Report</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:${DEFAULT_PRIMARY_COLOR};padding:28px 40px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;">${DEFAULT_PLATFORM_NAME}</span>
            </td>
          </tr>
          <!-- Title banner -->
          <tr>
            <td style="padding:20px 40px 0;">
              <p style="margin:0;color:#6b7280;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Survey Report</p>
              <h2 style="margin:4px 0 0;color:#111827;font-size:20px;font-weight:700;">${surveyTitle}</h2>
              <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">${organizationName} &mdash; ${reportPeriod}</p>
            </td>
          </tr>
          <!-- Metrics -->
          <tr>
            <td style="padding:24px 40px 0;">
              <p style="margin:0 0 20px;color:#374151;font-size:15px;">Dear ${recipientName},</p>
              <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;">
                Here is your survey report for <strong>${surveyTitle}</strong>. The full response data is attached as a CSV file.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td width="33%" style="text-align:center;padding:16px;background:#f0fdfe;border-radius:8px;border:1px solid #b2ebf2;">
                    <p style="margin:0;color:${DEFAULT_PRIMARY_COLOR};font-size:28px;font-weight:700;">${totalResponses}</p>
                    <p style="margin:4px 0 0;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Total Responses</p>
                  </td>
                  <td width="4%"></td>
                  <td width="33%" style="text-align:center;padding:16px;background:#f0fdfe;border-radius:8px;border:1px solid #b2ebf2;">
                    <p style="margin:0;color:${DEFAULT_PRIMARY_COLOR};font-size:28px;font-weight:700;">${completedResponses}</p>
                    <p style="margin:4px 0 0;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Completed</p>
                  </td>
                  <td width="4%"></td>
                  <td width="26%" style="text-align:center;padding:16px;background:#f0fdfe;border-radius:8px;border:1px solid #b2ebf2;">
                    <p style="margin:0;color:${DEFAULT_SECONDARY_COLOR};font-size:28px;font-weight:700;">${completionRate}%</p>
                    <p style="margin:4px 0 0;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Completion Rate</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f4f6f8;padding:20px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                The full response data is attached as <strong>${csvFilename}</strong>. Open it in Excel or Google Sheets for detailed analysis.
              </p>
              <p style="margin:8px 0 0;color:#9ca3af;font-size:11px;">Powered by ${DEFAULT_PLATFORM_NAME}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Survey Report: ${surveyTitle} — ${organizationName}`,
      html,
      text: `Dear ${recipientName},\n\nYour survey report for "${surveyTitle}" is ready.\n\nTotal Responses: ${totalResponses}\nCompleted: ${completedResponses}\nCompletion Rate: ${completionRate}%\n\nThe full data is attached as ${csvFilename}.\n\nPowered by ${DEFAULT_PLATFORM_NAME}`,
      attachments: [
        {
          filename: csvFilename,
          content: Buffer.from(csvContent, "utf-8"),
        },
      ],
    });
    if (error) {
      console.error("[Email] Resend report error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Email] Failed to send report:", err);
    return false;
  }
}

// ─── Password Reset Email ─────────────────────────────────────────────────────

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<boolean> {
  const { to, name, resetUrl } = params;
  const greeting = name ? `Hi ${name},` : "Hi there,";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:${DEFAULT_PRIMARY_COLOR};padding:28px 40px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;">${DEFAULT_PLATFORM_NAME}</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="margin:0 0 18px;color:#374151;font-size:16px;line-height:1.6;">${greeting}</p>
              <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.7;">
                We received a request to reset the password for your ${DEFAULT_PLATFORM_NAME} account.
                Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td style="background:${DEFAULT_SECONDARY_COLOR};border-radius:8px;">
                    <a href="${resetUrl}" target="_blank"
                       style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">
                      Reset Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">Or copy this link into your browser:</p>
              <p style="margin:0 0 24px;color:${DEFAULT_PRIMARY_COLOR};font-size:12px;word-break:break-all;">${resetUrl}</p>
              <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">
                If you did not request a password reset, you can safely ignore this email. Your password will not change.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f4f6f8;padding:20px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:11px;">Powered by ${DEFAULT_PLATFORM_NAME}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Reset your ${DEFAULT_PLATFORM_NAME} password`,
      html,
      text: `${greeting}\n\nWe received a request to reset your ${DEFAULT_PLATFORM_NAME} password.\n\nClick the link below to set a new password (expires in 1 hour):\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.\n\nPowered by ${DEFAULT_PLATFORM_NAME}`,
    });
    if (error) {
      console.error("[Email] Password reset error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Email] Failed to send password reset email:", err);
    return false;
  }
}
