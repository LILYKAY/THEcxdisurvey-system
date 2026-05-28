import puppeteer from "puppeteer-core";

/**
 * Generates a PDF buffer from an HTML string using system Chromium.
 * Returns a Buffer suitable for streaming as a PDF download.
 */
export async function generatePdfFromHtml(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
    ],
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * Builds a professional HTML report for a survey, suitable for PDF rendering.
 */
export function buildSurveyReportHtml(opts: {
  orgName: string;
  surveyTitle: string;
  formKey: string;
  generatedAt: Date;
  stats: {
    totalResponses: number;
    completedResponses: number;
    completionRate: number;
  };
  questionInsights: Array<{
    questionKey: string;
    questionText: string;
    questionType: string;
    totalAnswers: number;
    openEndedResponses?: string[];
    choiceBreakdown?: Array<{ option: string; count: number; percentage: number }>;
  }>;
  invitationStats?: {
    totalSent: number;
    opened: number;
    completed: number;
  };
}): string {
  const { orgName, surveyTitle, formKey, generatedAt, stats, questionInsights, invitationStats } = opts;

  const formKeyLabel: Record<string, string> = {
    current_customers: "Current Customers",
    dropped_customers: "Dropped / Lapsed Customers",
    repeat_trial: "Repeat Trial Firms",
    single_trial: "Single-Trial Firms",
  };

  const categoryLabel = formKeyLabel[formKey] ?? formKey;
  const dateStr = generatedAt.toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const renderChoiceBar = (pct: number) =>
    `<div style="background:#e2e8f0;border-radius:4px;height:10px;width:100%;margin-top:4px;">
       <div style="background:#1e3a5f;border-radius:4px;height:10px;width:${Math.min(pct, 100)}%;"></div>
     </div>`;

  const questionsHtml = questionInsights.map((q, idx) => {
    let answerSection = "";
    if (q.questionType === "open_ended" && q.openEndedResponses?.length) {
      const items = q.openEndedResponses.slice(0, 20).map(
        (r) => `<li style="padding:6px 0;border-bottom:1px solid #f1f5f9;color:#334155;font-size:13px;">${escapeHtml(r)}</li>`
      ).join("");
      answerSection = `<ul style="list-style:none;padding:0;margin:8px 0 0;">${items}</ul>`;
      if (q.openEndedResponses.length > 20) {
        answerSection += `<p style="color:#94a3b8;font-size:12px;margin-top:6px;">… and ${q.openEndedResponses.length - 20} more responses</p>`;
      }
    } else if (q.choiceBreakdown?.length) {
      const rows = q.choiceBreakdown.map(
        (c) => `<div style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:13px;color:#334155;">${escapeHtml(c.option)}</span>
            <span style="font-size:13px;font-weight:600;color:#1e3a5f;">${c.count} <span style="font-weight:400;color:#64748b;">(${c.percentage}%)</span></span>
          </div>
          ${renderChoiceBar(c.percentage)}
        </div>`
      ).join("");
      answerSection = `<div style="margin-top:10px;">${rows}</div>`;
    } else {
      answerSection = `<p style="color:#94a3b8;font-size:13px;margin-top:8px;">No responses yet.</p>`;
    }

    return `
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:16px;page-break-inside:avoid;">
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">
          <span style="background:#1e3a5f;color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">${idx + 1}</span>
          <div style="flex:1;">
            <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">${escapeHtml(q.questionText)}</p>
            <span style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">${q.questionType.replace("_", " ")} · ${q.totalAnswers} response${q.totalAnswers !== 1 ? "s" : ""}</span>
          </div>
        </div>
        ${answerSection}
      </div>`;
  }).join("");

  const inviteHtml = invitationStats
    ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:24px;">
        <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#0f172a;">Invitation Summary</h3>
        <div style="display:flex;gap:24px;">
          <div><p style="margin:0;font-size:22px;font-weight:700;color:#1e3a5f;">${invitationStats.totalSent}</p><p style="margin:2px 0 0;font-size:12px;color:#64748b;">Total Sent</p></div>
          <div><p style="margin:0;font-size:22px;font-weight:700;color:#d97706;">${invitationStats.opened}</p><p style="margin:2px 0 0;font-size:12px;color:#64748b;">Opened</p></div>
          <div><p style="margin:0;font-size:22px;font-weight:700;color:#059669;">${invitationStats.completed}</p><p style="margin:2px 0 0;font-size:12px;color:#64748b;">Completed</p></div>
        </div>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(surveyTitle)} — Survey Report</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f8fafc; color: #0f172a; }
    @media print { body { background: #fff; } }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="background:#1e3a5f;color:#fff;padding:32px 40px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;opacity:0.7;">Survey Report</p>
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;">${escapeHtml(surveyTitle)}</h1>
        <p style="margin:0;font-size:14px;opacity:0.85;">${escapeHtml(orgName)} · ${escapeHtml(categoryLabel)}</p>
      </div>
      <div style="text-align:right;">
        <p style="margin:0;font-size:12px;opacity:0.7;">Generated</p>
        <p style="margin:4px 0 0;font-size:14px;font-weight:600;">${dateStr}</p>
      </div>
    </div>
  </div>

  <div style="padding:32px 40px;">
    <!-- Overview Stats -->
    <div style="display:flex;gap:16px;margin-bottom:24px;">
      <div style="flex:1;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center;">
        <p style="margin:0;font-size:28px;font-weight:700;color:#1e3a5f;">${stats.totalResponses}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#64748b;">Total Responses</p>
      </div>
      <div style="flex:1;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center;">
        <p style="margin:0;font-size:28px;font-weight:700;color:#059669;">${stats.completedResponses}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#64748b;">Completed</p>
      </div>
      <div style="flex:1;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center;">
        <p style="margin:0;font-size:28px;font-weight:700;color:#d97706;">${stats.completionRate}%</p>
        <p style="margin:4px 0 0;font-size:12px;color:#64748b;">Completion Rate</p>
      </div>
    </div>

    ${inviteHtml}

    <!-- Questions -->
    <h2 style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 16px;">Question-by-Question Insights</h2>
    ${questionsHtml}

    <!-- Footer -->
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">Generated by SurveyPro · ${escapeHtml(orgName)} · ${dateStr}</p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
