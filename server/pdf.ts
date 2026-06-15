import { createRequire } from "module";
const _require = createRequire(import.meta.url);
// pdfkit is a CommonJS module; use createRequire to import it in ESM context
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PDFDocument = _require("pdfkit") as any;

// ─── Brand colours ────────────────────────────────────────────────────────────
const TEAL = "#03989e";
const TEAL_DARK = "#027a80";
const TEAL_LIGHT = "#e6f7f7";
const AMBER = "#f59e0b";
const GREEN = "#10b981";
const SLATE_900 = "#0f172a";
const SLATE_700 = "#334155";
const SLATE_500 = "#64748b";
const SLATE_200 = "#e2e8f0";
const WHITE = "#ffffff";
const PAGE_WIDTH = 595.28;   // A4 points
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface QuestionInsight {
  questionKey: string;
  questionText: string;
  questionType: string;
  totalAnswers: number;
  openEndedResponses?: string[];
  choiceBreakdown?: Array<{ option: string; count: number; percentage: number }>;
  npsScore?: number | null;
}

export interface PdfReportOptions {
  orgName: string;
  surveyTitle: string;
  formKey: string;
  generatedAt: Date;
  stats: {
    totalResponses: number;
    completedResponses: number;
    completionRate: number;
  };
  questionInsights: QuestionInsight[];
  invitationStats?: {
    totalSent: number;
    opened: number;
    completed: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function setFill(doc: any, hex: string) {
  doc.fillColor(hexToRgb(hex));
}

function setStroke(doc: any, hex: string) {
  doc.strokeColor(hexToRgb(hex));
}

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + "…" : str;
}

function questionTypeLabel(type: string): string {
  const map: Record<string, string> = {
    nps: "NPS (0–10)",
    csat: "CSAT",
    ces_5: "CES (1–5)",
    ces_7: "CES (1–7)",
    open_ended: "Open-ended",
    multiple_choice_single: "Single choice",
    multiple_choice_multi: "Multiple choice",
    yes_no: "Yes / No",
    range_0_10: "Range (0–10)",
    number_input: "Number",
    year: "Year",
    date: "Date",
    consent: "Consent",
    nps_comment: "NPS Comment",
  };
  return map[type] ?? type.replace(/_/g, " ");
}

// ─── Page helpers ─────────────────────────────────────────────────────────────
function drawPageFooter(doc: any, pageNum: number, totalPages: number, orgName: string, dateStr: string) {
  const y = PAGE_HEIGHT - 30;
  setFill(doc, SLATE_500);
  doc.fontSize(8).text(
    `${orgName}  ·  Generated ${dateStr}  ·  Page ${pageNum} of ${totalPages}`,
    MARGIN, y, { width: CONTENT_WIDTH, align: "center" },
  );
}

function drawSectionTitle(doc: any, title: string, y: number): number {
  setFill(doc, SLATE_900);
  doc.fontSize(12).font("Helvetica-Bold").text(title, MARGIN, y);
  const lineY = y + 18;
  setStroke(doc, TEAL);
  doc.moveTo(MARGIN, lineY).lineTo(MARGIN + CONTENT_WIDTH, lineY).lineWidth(1.5).stroke();
  return lineY + 10;
}

// ─── Header ───────────────────────────────────────────────────────────────────
function drawHeader(doc: any, opts: PdfReportOptions, dateStr: string) {
  // Teal header band
  const headerH = 90;
  setFill(doc, TEAL);
  doc.rect(0, 0, PAGE_WIDTH, headerH).fill();

  // White "CXDi SurveyPro" wordmark
  setFill(doc, WHITE);
  doc.fontSize(9).font("Helvetica").text("CXDi SurveyPro", MARGIN, 16, { width: CONTENT_WIDTH });

  // Survey title
  doc.fontSize(18).font("Helvetica-Bold").text(
    truncate(opts.surveyTitle, 60), MARGIN, 30, { width: CONTENT_WIDTH - 120 },
  );

  // Org name + category
  const formKeyLabel: Record<string, string> = {
    current_customers: "Current Customers",
    dropped_customers: "Dropped / Lapsed Customers",
    repeat_trial: "Repeat Trial Firms",
    single_trial: "Single-Trial Firms",
  };
  const categoryLabel = formKeyLabel[opts.formKey] ?? opts.formKey;
  doc.fontSize(10).font("Helvetica").text(
    `${opts.orgName}  ·  ${categoryLabel}`, MARGIN, 56, { width: CONTENT_WIDTH - 120 },
  );

  // Generated date (top-right)
  doc.fontSize(8).text("Generated", PAGE_WIDTH - MARGIN - 90, 20, { width: 90, align: "right" });
  doc.fontSize(10).font("Helvetica-Bold").text(dateStr, PAGE_WIDTH - MARGIN - 90, 32, { width: 90, align: "right" });
}

// ─── Stat cards ───────────────────────────────────────────────────────────────
function drawStatCards(doc: any, stats: PdfReportOptions["stats"], startY: number): number {
  const cardW = (CONTENT_WIDTH - 16) / 3;
  const cardH = 64;
  const cards = [
    { label: "Total Responses", value: String(stats.totalResponses), color: TEAL },
    { label: "Completed", value: String(stats.completedResponses), color: GREEN },
    { label: "Completion Rate", value: `${stats.completionRate}%`, color: AMBER },
  ];

  cards.forEach((card, i) => {
    const x = MARGIN + i * (cardW + 8);
    // Card background
    setFill(doc, TEAL_LIGHT);
    doc.roundedRect(x, startY, cardW, cardH, 6).fill();
    // Left accent bar
    setFill(doc, card.color);
    doc.rect(x, startY, 4, cardH).fill();
    // Value
    setFill(doc, SLATE_900);
    doc.fontSize(24).font("Helvetica-Bold").text(card.value, x + 14, startY + 10, { width: cardW - 18 });
    // Label
    setFill(doc, SLATE_500);
    doc.fontSize(9).font("Helvetica").text(card.label, x + 14, startY + 40, { width: cardW - 18 });
  });

  return startY + cardH + 20;
}

// ─── Invitation summary ───────────────────────────────────────────────────────
function drawInvitationSummary(doc: any, inv: NonNullable<PdfReportOptions["invitationStats"]>, startY: number): number {
  // Section title
  startY = drawSectionTitle(doc, "Invitation Summary", startY);

  const cardW = (CONTENT_WIDTH - 16) / 3;
  const cardH = 56;
  const items = [
    { label: "Sent", value: String(inv.totalSent), color: TEAL },
    { label: "Opened", value: String(inv.opened), color: AMBER },
    { label: "Completed", value: String(inv.completed), color: GREEN },
  ];

  items.forEach((item, i) => {
    const x = MARGIN + i * (cardW + 8);
    setFill(doc, TEAL_LIGHT);
    doc.roundedRect(x, startY, cardW, cardH, 6).fill();
    setFill(doc, item.color);
    doc.rect(x, startY, 4, cardH).fill();
    setFill(doc, SLATE_900);
    doc.fontSize(20).font("Helvetica-Bold").text(item.value, x + 14, startY + 8, { width: cardW - 18 });
    setFill(doc, SLATE_500);
    doc.fontSize(9).font("Helvetica").text(item.label, x + 14, startY + 34, { width: cardW - 18 });
  });

  return startY + cardH + 20;
}

// ─── Bar chart for choice questions ──────────────────────────────────────────
function drawChoiceBar(
  doc: any,
  breakdown: NonNullable<QuestionInsight["choiceBreakdown"]>,
  startX: number,
  startY: number,
  availableWidth: number,
): number {
  const barH = 14;
  const rowGap = 8;
  const labelWidth = Math.min(availableWidth * 0.45, 200);
  const barAreaX = startX + labelWidth + 8;
  const barAreaW = availableWidth - labelWidth - 60; // 60 for count+pct label
  const countLabelX = barAreaX + barAreaW + 6;

  let y = startY;
  breakdown.forEach((item) => {
    const pct = Math.max(0, Math.min(100, item.percentage));
    const filledW = Math.round((pct / 100) * barAreaW);

    // Option label
    setFill(doc, SLATE_700);
    doc.fontSize(9).font("Helvetica").text(
      truncate(item.option, 40), startX, y + 2, { width: labelWidth, lineBreak: false },
    );

    // Bar background
    setFill(doc, SLATE_200);
    doc.roundedRect(barAreaX, y, barAreaW, barH, 3).fill();

    // Bar fill
    if (filledW > 0) {
      setFill(doc, TEAL);
      doc.roundedRect(barAreaX, y, filledW, barH, 3).fill();
    }

    // Count + percentage
    setFill(doc, SLATE_500);
    doc.fontSize(8).font("Helvetica").text(
      `${item.count} (${pct}%)`, countLabelX, y + 3, { width: 52, lineBreak: false },
    );

    y += barH + rowGap;
  });

  return y + 4;
}

// ─── NPS gauge ────────────────────────────────────────────────────────────────
function drawNpsGauge(doc: any, score: number, cx: number, cy: number, r: number) {
  // Background arc (full semicircle)
  setStroke(doc, SLATE_200);
  doc.circle(cx, cy, r).lineWidth(0).stroke();

  // Determine colour
  const color = score >= 50 ? GREEN : score >= 0 ? AMBER : "#ef4444";
  setFill(doc, color);
  doc.fontSize(18).font("Helvetica-Bold").text(
    String(score), cx - r, cy - 12, { width: r * 2, align: "center" },
  );
  setFill(doc, SLATE_500);
  doc.fontSize(8).font("Helvetica").text("NPS Score", cx - r, cy + 8, { width: r * 2, align: "center" });
}

// ─── Single question block ────────────────────────────────────────────────────
function drawQuestionBlock(
  doc: any,
  q: QuestionInsight,
  idx: number,
  startY: number,
): number {
  const blockPad = 14;
  const innerW = CONTENT_WIDTH - blockPad * 2;
  let y = startY + blockPad;

  // Question number badge
  setFill(doc, TEAL);
  doc.circle(MARGIN + blockPad + 8, y + 6, 9).fill();
  setFill(doc, WHITE);
  doc.fontSize(8).font("Helvetica-Bold").text(
    String(idx + 1), MARGIN + blockPad, y + 2, { width: 16, align: "center" },
  );

  // Question text
  setFill(doc, SLATE_900);
  doc.fontSize(11).font("Helvetica-Bold").text(
    q.questionText, MARGIN + blockPad + 22, y, { width: innerW - 22 },
  );
  y += doc.heightOfString(q.questionText, { width: innerW - 22, fontSize: 11 }) + 4;

  // Type + response count badge
  setFill(doc, TEAL_LIGHT);
  const badgeText = `${questionTypeLabel(q.questionType)}  ·  ${q.totalAnswers} response${q.totalAnswers !== 1 ? "s" : ""}`;
  doc.roundedRect(MARGIN + blockPad + 22, y, doc.widthOfString(badgeText, { fontSize: 8 }) + 10, 14, 4).fill();
  setFill(doc, TEAL_DARK);
  doc.fontSize(8).font("Helvetica").text(badgeText, MARGIN + blockPad + 27, y + 3, { lineBreak: false });
  y += 22;

  if (q.totalAnswers === 0) {
    setFill(doc, SLATE_500);
    doc.fontSize(9).font("Helvetica").text("No responses yet.", MARGIN + blockPad + 22, y);
    y += 16;
  } else if (q.questionType === "open_ended" || q.questionType === "nps_comment") {
    // Open-ended: show up to 10 responses as quoted lines
    const responses = (q.openEndedResponses ?? []).slice(0, 10);
    responses.forEach((resp) => {
      setFill(doc, TEAL);
      doc.rect(MARGIN + blockPad + 22, y, 3, 12).fill();
      setFill(doc, SLATE_700);
      doc.fontSize(9).font("Helvetica").text(
        truncate(resp, 120), MARGIN + blockPad + 30, y, { width: innerW - 30 },
      );
      y += doc.heightOfString(truncate(resp, 120), { width: innerW - 30, fontSize: 9 }) + 6;
    });
    if ((q.openEndedResponses?.length ?? 0) > 10) {
      setFill(doc, SLATE_500);
      doc.fontSize(8).text(
        `… and ${(q.openEndedResponses!.length) - 10} more responses`,
        MARGIN + blockPad + 22, y,
      );
      y += 14;
    }
  } else if (q.choiceBreakdown?.length) {
    y = drawChoiceBar(doc, q.choiceBreakdown, MARGIN + blockPad + 22, y, innerW - 22);
  } else if (q.questionType === "nps" && q.npsScore != null) {
    drawNpsGauge(doc, q.npsScore, MARGIN + blockPad + 22 + 30, y + 20, 24);
    y += 56;
  }

  y += blockPad;

  // Card border
  setStroke(doc, SLATE_200);
  doc.roundedRect(MARGIN, startY, CONTENT_WIDTH, y - startY, 6).lineWidth(0.5).stroke();

  return y + 10;
}

// ─── Main export ─────────────────────────────────────────────────────────────
export async function generateSurveyPdf(opts: PdfReportOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      autoFirstPage: true,
      bufferPages: true,
    });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const dateStr = opts.generatedAt.toLocaleDateString("en-GB", {
      day: "2-digit", month: "long", year: "numeric",
    });

    // ── Page 1 ────────────────────────────────────────────────────────────────
    drawHeader(doc, opts, dateStr);

    let y = 110; // below header band

    // Overview stats
    y = drawSectionTitle(doc, "Overview", y);
    y = drawStatCards(doc, opts.stats, y);

    // Invitation summary (if available)
    if (opts.invitationStats) {
      // Check if we need a new page
      if (y + 120 > PAGE_HEIGHT - 50) { doc.addPage(); y = MARGIN; }
      y = drawInvitationSummary(doc, opts.invitationStats, y);
    }

    // ── Questions ─────────────────────────────────────────────────────────────
    if (opts.questionInsights.length > 0) {
      if (y + 40 > PAGE_HEIGHT - 50) { doc.addPage(); y = MARGIN; }
      y = drawSectionTitle(doc, "Question-by-Question Insights", y);

      opts.questionInsights.forEach((q, idx) => {
        // Estimate block height (rough)
        const estH = q.questionType === "open_ended"
          ? 60 + Math.min(q.openEndedResponses?.length ?? 0, 10) * 20
          : q.choiceBreakdown?.length
          ? 60 + q.choiceBreakdown.length * 26
          : 80;

        if (y + estH > PAGE_HEIGHT - 50) {
          doc.addPage();
          y = MARGIN;
        }

        y = drawQuestionBlock(doc, q, idx, y);
      });
    } else {
      if (y + 60 > PAGE_HEIGHT - 50) { doc.addPage(); y = MARGIN; }
      setFill(doc, SLATE_500);
      doc.fontSize(10).font("Helvetica").text(
        "No question data available for this report.", MARGIN, y, { width: CONTENT_WIDTH },
      );
    }

    // ── Footer on every page ──────────────────────────────────────────────────
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      drawPageFooter(doc, i + 1, totalPages, opts.orgName, dateStr);
    }

    doc.end();
  });
}

// ─── Legacy shim (keeps existing call sites working) ─────────────────────────
/**
 * @deprecated Use generateSurveyPdf() with structured PdfReportOptions instead.
 * This shim exists only for backward compatibility during the migration.
 */
export async function generatePdfFromHtml(_html: string): Promise<Buffer> {
  // Return a minimal placeholder — callers should migrate to generateSurveyPdf
  return generateSurveyPdf({
    orgName: "Organisation",
    surveyTitle: "Survey Report",
    formKey: "custom",
    generatedAt: new Date(),
    stats: { totalResponses: 0, completedResponses: 0, completionRate: 0 },
    questionInsights: [],
  });
}

/** @deprecated kept for backward compatibility */
export function buildSurveyReportHtml(_opts: unknown): string {
  return "";
}
