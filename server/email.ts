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

const FROM_ADDRESS = "CXDi SurveyPro <noreply@thecxdisurveys.com>";
const REPLY_TO_ADDRESS = "support@thecxdisurveys.com";

// ─── Branding Defaults ────────────────────────────────────────────────────────

const DEFAULT_PRIMARY_COLOR = "#00BCD4";
const DEFAULT_SECONDARY_COLOR = "#0097A7";
const DEFAULT_PLATFORM_NAME = "CXDi SurveyPro";

/**
 * Convert a potentially relative /manus-storage/... path into an absolute URL.
 */
function toAbsoluteUrl(url: string | null | undefined, origin: string): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
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
  const footer = b.signatureTag?.trim() || DEFAULT_PLATFORM_NAME;
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
  const greeting = recipientName ? `Hi ${recipientName},` : "Hi there,";

  // Simple, personal-style HTML — minimal styling to avoid Promotions tab
  // Gmail classifies emails based on: HTML complexity, image-to-text ratio,
  // marketing language, CTA patterns, and sender reputation.
  // This template mimics a personal/transactional email.
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;font-size:14px;color:#333;">
<p>${greeting}</p>

<p>${senderName} from <strong>${organizationName}</strong> would like your feedback on a brief survey.</p>

${personalMessage ? `<p style="margin:16px 0;padding:12px 16px;border-left:3px solid #ccc;color:#555;"><em>"${personalMessage}"</em><br/><small>— ${senderName}</small></p>` : ""}

<p><strong>Survey:</strong> ${surveyTitle}</p>

<p>It should only take a few minutes. Your responses are confidential.</p>

<p><a href="${surveyUrl}" style="color:#0066cc;">${surveyUrl}</a></p>

<p>Thank you for your time.</p>

<p style="margin-top:24px;color:#666;font-size:13px;">
${senderName}<br/>
${organizationName}
</p>
</body>
</html>`;

  const text = `${greeting}\n\n${senderName} from ${organizationName} would like your feedback on a brief survey.\n\n${personalMessage ? `"${personalMessage}"\n— ${senderName}\n\n` : ""}Survey: ${surveyTitle}\n\nIt should only take a few minutes. Your responses are confidential.\n\n${surveyUrl}\n\nThank you for your time.\n\n${senderName}\n${organizationName}`;

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      replyTo: REPLY_TO_ADDRESS,
      to,
      subject: `${senderName} invited you to share feedback`,
      html,
      text,
      headers: {
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        "Importance": "high",
        "X-Entity-Ref-ID": `survey-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
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

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;font-size:14px;color:#333;">
<p>Hi ${recipientName},</p>

<p>Your survey report for <strong>${surveyTitle}</strong> is ready.</p>

<p style="margin:16px 0;">
<strong>Summary (${reportPeriod}):</strong><br/>
Total responses: ${totalResponses}<br/>
Completed: ${completedResponses}<br/>
Completion rate: ${completionRate}%
</p>

<p>The full response data is attached as ${csvFilename}. You can open it in Excel or Google Sheets for detailed analysis.</p>

<p>Best regards,<br/>${organizationName}</p>
</body>
</html>`;

  const text = `Hi ${recipientName},\n\nYour survey report for "${surveyTitle}" is ready.\n\nSummary (${reportPeriod}):\n- Total responses: ${totalResponses}\n- Completed: ${completedResponses}\n- Completion rate: ${completionRate}%\n\nThe full response data is attached as ${csvFilename}.\n\nBest regards,\n${organizationName}`;

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      replyTo: REPLY_TO_ADDRESS,
      to,
      subject: `Your survey report: ${surveyTitle}`,
      html,
      text,
      headers: {
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        "Importance": "high",
        "X-Entity-Ref-ID": `report-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
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

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;font-size:14px;color:#333;">
<p>${greeting}</p>

<p>We received a request to reset your password. Click the link below to set a new one:</p>

<p><a href="${resetUrl}" style="color:#0066cc;">${resetUrl}</a></p>

<p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>

<p style="margin-top:24px;color:#666;font-size:13px;">
${DEFAULT_PLATFORM_NAME}
</p>
</body>
</html>`;

  const text = `${greeting}\n\nWe received a request to reset your password. Click the link below to set a new one:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can safely ignore this email.\n\n${DEFAULT_PLATFORM_NAME}`;

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      replyTo: REPLY_TO_ADDRESS,
      to,
      subject: "Reset your password",
      html,
      text,
      headers: {
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        "Importance": "high",
        "X-Entity-Ref-ID": `reset-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
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
