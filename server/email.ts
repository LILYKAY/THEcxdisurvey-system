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

// ─── Survey Invitation Email ──────────────────────────────────────────────────

export interface SendInvitationParams {
  to: string;
  recipientName: string | null;
  organizationName: string;
  surveyTitle: string;
  surveyUrl: string;
  personalMessage?: string | null;
  senderName: string;
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
  } = params;

  const greeting = recipientName ? `Dear ${recipientName},` : "Dear Valued Customer,";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Survey Invitation</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1e2d5a;padding:32px 40px;">
              <p style="margin:0;color:#c9a84c;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Survey Invitation</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:700;line-height:1.3;">${organizationName}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">${greeting}</p>
              <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">
                You have been invited to share your feedback through our <strong>${surveyTitle}</strong> survey.
                Your responses are valuable and will help us serve you better.
              </p>
              ${
                personalMessage
                  ? `<div style="background:#f9f7f2;border-left:4px solid #c9a84c;padding:16px 20px;margin:0 0 24px;border-radius:0 8px 8px 0;">
                      <p style="margin:0;color:#374151;font-size:15px;font-style:italic;line-height:1.6;">"${personalMessage}"</p>
                      <p style="margin:8px 0 0;color:#6b7280;font-size:13px;">— ${senderName}</p>
                    </div>`
                  : ""
              }
              <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">The survey takes approximately 5–10 minutes to complete.</p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td style="background:#1e2d5a;border-radius:8px;">
                    <a href="${surveyUrl}" target="_blank"
                       style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">
                      Start Survey &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">Or copy this link into your browser:</p>
              <p style="margin:0;color:#1e2d5a;font-size:12px;word-break:break-all;">${surveyUrl}</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9f7f2;padding:24px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                This invitation was sent by <strong>${senderName}</strong> on behalf of <strong>${organizationName}</strong>.
                If you did not expect this email, you may safely ignore it.
              </p>
              <p style="margin:8px 0 0;color:#9ca3af;font-size:12px;">Powered by SurveyPro &mdash; Professional Survey Platform for Africa</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${greeting}\n\nYou have been invited to complete the "${surveyTitle}" survey by ${organizationName}.\n\n${personalMessage ? `Message from ${senderName}: "${personalMessage}"\n\n` : ""}Click the link below to start:\n${surveyUrl}\n\nThank you for your time.`;

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
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1e2d5a;padding:32px 40px;">
              <p style="margin:0;color:#c9a84c;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Survey Report</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:700;line-height:1.3;">${organizationName}</h1>
              <p style="margin:6px 0 0;color:#94a3b8;font-size:14px;">${surveyTitle} &mdash; ${reportPeriod}</p>
            </td>
          </tr>
          <!-- Metrics -->
          <tr>
            <td style="padding:32px 40px 0;">
              <p style="margin:0 0 20px;color:#374151;font-size:16px;">Dear ${recipientName},</p>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                Here is your survey report for <strong>${surveyTitle}</strong>. The full response data is attached as a CSV file.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td width="33%" style="text-align:center;padding:16px;background:#f0f4ff;border-radius:8px;">
                    <p style="margin:0;color:#1e2d5a;font-size:28px;font-weight:700;">${totalResponses}</p>
                    <p style="margin:4px 0 0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Total Responses</p>
                  </td>
                  <td width="4%"></td>
                  <td width="33%" style="text-align:center;padding:16px;background:#f0f4ff;border-radius:8px;">
                    <p style="margin:0;color:#1e2d5a;font-size:28px;font-weight:700;">${completedResponses}</p>
                    <p style="margin:4px 0 0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Completed</p>
                  </td>
                  <td width="4%"></td>
                  <td width="26%" style="text-align:center;padding:16px;background:#f0f4ff;border-radius:8px;">
                    <p style="margin:0;color:#c9a84c;font-size:28px;font-weight:700;">${completionRate}%</p>
                    <p style="margin:4px 0 0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Completion Rate</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9f7f2;padding:24px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                The full response data is attached as <strong>${csvFilename}</strong>. Open it in Excel or Google Sheets for detailed analysis.
              </p>
              <p style="margin:8px 0 0;color:#9ca3af;font-size:12px;">Powered by SurveyPro &mdash; Professional Survey Platform for Africa</p>
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
      text: `Dear ${recipientName},\n\nYour survey report for "${surveyTitle}" is ready.\n\nTotal Responses: ${totalResponses}\nCompleted: ${completedResponses}\nCompletion Rate: ${completionRate}%\n\nThe full data is attached as ${csvFilename}.\n\nPowered by SurveyPro`,
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
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1e2d5a;padding:32px 40px;">
              <p style="margin:0;color:#c9a84c;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Password Reset</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:700;line-height:1.3;">SurveyPro</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">${greeting}</p>
              <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">
                We received a request to reset the password for your SurveyPro account.
                Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td style="background:#1e2d5a;border-radius:8px;">
                    <a href="${resetUrl}" target="_blank"
                       style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">
                      Reset Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">Or copy this link into your browser:</p>
              <p style="margin:0 0 24px;color:#1e2d5a;font-size:12px;word-break:break-all;">${resetUrl}</p>
              <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">
                If you did not request a password reset, you can safely ignore this email. Your password will not change.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9f7f2;padding:24px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">Powered by SurveyPro &mdash; Professional Survey Platform for Africa</p>
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
      subject: "Reset your SurveyPro password",
      html,
      text: `${greeting}\n\nWe received a request to reset your SurveyPro password.\n\nClick the link below to set a new password (expires in 1 hour):\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.\n\nPowered by SurveyPro`,
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
