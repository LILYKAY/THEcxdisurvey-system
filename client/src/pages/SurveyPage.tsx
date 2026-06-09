import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Loader2,
  Star,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────
type QuestionType =
  | "open_ended"
  | "multiple_choice_single"
  | "multiple_choice_multi"
  | "yes_no"
  | "nps"
  | "csat"
  | "ces_5"
  | "ces_7"
  | "range_0_10"
  | "number_input"
  | "year"
  | "date"
  | "consent"
  | "end_message"
  | "nps_comment"
  | "single_choice"
  | "multiple_choice"
  | "checkboxes";

interface QuestionOption {
  value: string;
  label: string;
}

interface SurveyQuestion {
  key: string;
  number: number;
  text: string;
  type: QuestionType;
  required: boolean;
  options?: QuestionOption[] | null;
  maxSelections?: number | null;
  maxChars?: number | null;
}

// ─── NPS Widget ───────────────────────────────────────────────────────────────
function NpsWidget({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-center">
        {Array.from({ length: 11 }, (_, i) => {
          const selected = value === i;
          const color =
            i <= 6 ? "bg-red-100 border-red-300 text-red-700 hover:bg-red-200" :
            i <= 8 ? "bg-yellow-100 border-yellow-300 text-yellow-700 hover:bg-yellow-200" :
                     "bg-green-100 border-green-300 text-green-700 hover:bg-green-200";
          const selectedColor =
            i <= 6 ? "bg-red-500 border-red-500 text-white" :
            i <= 8 ? "bg-yellow-500 border-yellow-500 text-white" :
                     "bg-green-500 border-green-500 text-white";
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              className={cn(
                "h-11 w-11 rounded-lg border-2 text-sm font-semibold transition-all active:scale-95",
                selected ? selectedColor : color
              )}
            >
              {i}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>Not at all likely</span>
        <span>Extremely likely</span>
      </div>
    </div>
  );
}

// ─── CSAT Widget (1–5 stars) ──────────────────────────────────────────────────
function CsatWidget({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const labels = ["Very Dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very Satisfied"];
  return (
    <div className="space-y-3">
      <div className="flex justify-center gap-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)} className="flex flex-col items-center gap-1 group">
            <Star
              className={cn(
                "h-10 w-10 transition-all group-hover:scale-110",
                value !== null && n <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/30 group-hover:text-yellow-300"
              )}
            />
            <span className="text-[10px] text-muted-foreground">{n}</span>
          </button>
        ))}
      </div>
      {value !== null && (
        <p className="text-center text-sm font-medium text-foreground">{labels[value - 1]}</p>
      )}
    </div>
  );
}

// ─── CES Widget ───────────────────────────────────────────────────────────────
function CesWidget({ max, value, onChange }: { max: 5 | 7; value: number | null; onChange: (v: number) => void }) {
  const options5 = [
    { v: 1, label: "Strongly Disagree" }, { v: 2, label: "Disagree" }, { v: 3, label: "Neutral" },
    { v: 4, label: "Agree" }, { v: 5, label: "Strongly Agree" },
  ];
  const options7 = [
    { v: 1, label: "Strongly Disagree" }, { v: 2, label: "Disagree" }, { v: 3, label: "Somewhat Disagree" },
    { v: 4, label: "Neutral" }, { v: 5, label: "Somewhat Agree" }, { v: 6, label: "Agree" }, { v: 7, label: "Strongly Agree" },
  ];
  const options = max === 5 ? options5 : options7;
  return (
    <div className="space-y-2.5">
      {options.map(({ v, label }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "w-full flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-sm text-left transition-all",
            value === v
              ? "border-primary bg-primary/5 font-medium text-foreground"
              : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-secondary/50"
          )}
        >
          <span className={cn(
            "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
            value === v ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
          )}>{v}</span>
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Range 0–10 Widget ────────────────────────────────────────────────────────
function RangeWidget({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-center">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={cn(
              "h-11 w-11 rounded-lg border-2 text-sm font-semibold transition-all active:scale-95",
              value === i
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-secondary/50"
            )}
          >{i}</button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>Low</span><span>High</span>
      </div>
    </div>
  );
}

// ─── Yes/No Widget ────────────────────────────────────────────────────────────
function YesNoWidget({ value, onChange }: { value: string | null; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-4 justify-center">
      {["Yes", "No"].map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt.toLowerCase())}
          className={cn(
            "flex-1 max-w-[160px] rounded-xl border-2 py-5 text-base font-semibold transition-all active:scale-95",
            value === opt.toLowerCase()
              ? "border-primary bg-primary text-primary-foreground shadow-md"
              : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-secondary/50"
          )}
        >{opt}</button>
      ))}
    </div>
  );
}

// ─── Main Question Field ──────────────────────────────────────────────────────
function QuestionField({ question, value, onChange }: {
  question: SurveyQuestion;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const strVal = typeof value === "string" ? value : null;
  const numVal = typeof value === "number" ? value : null;
  const arrVal = Array.isArray(value) ? (value as string[]) : [];

  if (question.type === "nps") return <NpsWidget value={numVal} onChange={onChange as (v: number) => void} />;
  if (question.type === "csat") return <CsatWidget value={numVal} onChange={onChange as (v: number) => void} />;
  if (question.type === "ces_5") return <CesWidget max={5} value={numVal} onChange={onChange as (v: number) => void} />;
  if (question.type === "ces_7") return <CesWidget max={7} value={numVal} onChange={onChange as (v: number) => void} />;
  if (question.type === "range_0_10") return <RangeWidget value={numVal} onChange={onChange as (v: number) => void} />;
  if (question.type === "yes_no") return <YesNoWidget value={strVal} onChange={onChange as (v: string) => void} />;

  if (question.type === "open_ended" || question.type === "nps_comment") {
    return (
      <Textarea
        className="min-h-[120px] resize-none"
        placeholder="Share your thoughts…"
        maxLength={question.maxChars ?? undefined}
        value={strVal ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
      />
    );
  }

  if (question.type === "number_input") {
    return (
      <Input type="number" placeholder="Enter a number" value={strVal ?? ""}
        onChange={(e) => onChange(e.target.value || null)} className="max-w-xs" />
    );
  }

  if (question.type === "year") {
    return (
      <Input type="number" placeholder="e.g. 2024" min={1900} max={new Date().getFullYear() + 10}
        value={strVal ?? ""} onChange={(e) => onChange(e.target.value || null)} className="max-w-xs" />
    );
  }

  if (question.type === "date") {
    return (
      <Input type="date" value={strVal ?? ""} onChange={(e) => onChange(e.target.value || null)} className="max-w-xs" />
    );
  }

  if (question.type === "multiple_choice_single" || question.type === "single_choice") {
    const opts = question.options ?? [];
    return (
      <div className="space-y-2.5">
        {opts.map((opt) => (
          <label key={opt.value} className={cn(
            "flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 text-sm transition-all",
            strVal === opt.value
              ? "border-primary bg-primary/5 font-medium text-foreground shadow-sm"
              : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-secondary/50"
          )}>
            <div className={cn(
              "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
              strVal === opt.value ? "border-primary bg-primary" : "border-muted-foreground/40"
            )}>
              {strVal === opt.value && <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
            </div>
            <input type="radio" className="sr-only" value={opt.value} checked={strVal === opt.value}
              onChange={() => onChange(opt.value)} />
            {opt.label}
          </label>
        ))}
      </div>
    );
  }

  if (question.type === "multiple_choice_multi" || question.type === "multiple_choice" || question.type === "checkboxes") {
    const opts = question.options ?? [];
    const maxSel = question.maxSelections;
    const toggle = (v: string) => {
      if (arrVal.includes(v)) { onChange(arrVal.filter((s) => s !== v)); }
      else { if (maxSel && arrVal.length >= maxSel) return; onChange([...arrVal, v]); }
    };
    return (
      <div className="space-y-2.5">
        {maxSel && <p className="text-xs text-muted-foreground">Select up to {maxSel} options</p>}
        {opts.map((opt) => {
          const checked = arrVal.includes(opt.value);
          return (
            <label key={opt.value} className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 text-sm transition-all",
              checked ? "border-primary bg-primary/5 font-medium text-foreground shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-secondary/50"
            )}>
              <div className={cn(
                "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition-colors",
                checked ? "border-primary bg-primary" : "border-muted-foreground/40"
              )}>
                {checked && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
              </div>
              <input type="checkbox" className="sr-only" value={opt.value} checked={checked}
                onChange={() => toggle(opt.value)} />
              {opt.label}
            </label>
          );
        })}
      </div>
    );
  }

  if (question.type === "consent") {
    return (
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border-2 px-4 py-3 text-sm transition-all border-border bg-card hover:border-primary/40">
        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary"
          checked={strVal === "true"} onChange={(e) => onChange(e.target.checked ? "true" : null)} />
        <span className="text-muted-foreground">I agree and consent to this survey</span>
      </label>
    );
  }

  return null;
}


// ─── Thank You Screen ─────────────────────────────────────────────────────────
function ThankYouScreen({ surveyTitle, branding, alreadyDone }: {
  surveyTitle: string;
  branding?: { logoUrl?: string | null; primaryColor?: string | null; signatureTag?: string | null } | null;
  alreadyDone?: boolean;
}) {
  const primary = branding?.primaryColor ?? "#0d9488";
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-fade-in">
      {branding?.logoUrl ? (
        <img src={branding.logoUrl} alt="Organisation logo" className="h-12 object-contain" />
      ) : null}
      <div className="flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: `${primary}20` }}>
        <CheckCircle2 className="h-10 w-10" style={{ color: primary }} />
      </div>
      <div className="space-y-2">
        <h1 className="font-serif text-3xl font-bold text-foreground">
          {alreadyDone ? "Already Submitted" : "Thank You!"}
        </h1>
        <p className="text-muted-foreground max-w-sm leading-relaxed">
          {alreadyDone
            ? "You have already submitted a response to this survey. Each invitation link can only be used once."
            : <>Your response to <span className="font-medium text-foreground">{surveyTitle}</span> has been recorded. We appreciate you taking the time to share your feedback.</>}
        </p>
      </div>
      {branding?.signatureTag && (
        <p className="text-xs text-muted-foreground border-t border-border pt-4 max-w-xs">{branding.signatureTag}</p>
      )}
      <p className="text-xs text-muted-foreground">You may now close this window.</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SurveyPage() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = trpc.public.getSurveyByToken.useQuery(
    { token: token ?? "" },
    { enabled: !!token }
  );
  const startResponse = trpc.public.startResponse.useMutation();
  const saveAnswer = trpc.public.saveAnswer.useMutation();
  const completeResponse = trpc.public.completeResponse.useMutation();

  const [responseId, setResponseId] = useState<number | null>(null);
  const [step, setStep] = useState<"survey" | "done" | "already_done">("survey");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Show already-completed screen immediately if invitation was already used
  const alreadyCompleted = data?.alreadyCompleted ?? false;

  // Auto-start response as soon as survey data loads (no intro screen)
  useEffect(() => {
    if (!data || alreadyCompleted || responseId) return;
    startResponse.mutateAsync({ token: token ?? "" })
      .then((result) => setResponseId(result.responseId))
      .catch((e) => console.error("startResponse error:", e));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!data, alreadyCompleted]);

  const questions: SurveyQuestion[] = useMemo(() => {
    if (!data?.questions) return [];
    return data.questions.map((q: any, i: number) => ({
      key: q.questionKey,
      number: i + 1,
      text: q.questionText,
      type: q.questionType as QuestionType,
      required: !!q.isRequired,
      options: q.options ?? null,
      maxSelections: q.maxSelections ?? null,
      maxChars: q.maxChars ?? null,
    }));
  }, [data]);

  const totalQ = questions.length;
  const progress = totalQ > 0 ? Math.round(((currentQ + 1) / totalQ) * 100) : 0;
  const currentQuestion = questions[currentQ];
  const currentAnswer = currentQuestion ? (answers[currentQuestion.key] ?? null) : null;

  const canProceed = useMemo(() => {
    if (!currentQuestion) return false;
    if (!currentQuestion.required) return true;
    const val = answers[currentQuestion.key];
    if (val === null || val === undefined) return false;
    if (typeof val === "string") return val.trim().length > 0;
    if (typeof val === "number") return true;
    if (Array.isArray(val)) return val.length > 0;
    return false;
  }, [currentQuestion, answers]);

  const handleAnswer = (val: unknown) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.key]: val }));
  };

  const handleNext = async () => {
    if (!responseId || !currentQuestion) return;
    try {
      await saveAnswer.mutateAsync({ responseId, questionKey: currentQuestion.key, value: currentAnswer });
    } catch (e) { console.error("saveAnswer error:", e); }
    setCurrentQ((q) => q + 1);
  };

  const handleBack = () => setCurrentQ((q) => Math.max(0, q - 1));

  const handleSubmit = async () => {
    if (!responseId || !token) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (currentQuestion) {
        await saveAnswer.mutateAsync({ responseId, questionKey: currentQuestion.key, value: currentAnswer });
      }
      let npsScore: number | undefined;
      let csatScore: number | undefined;
      let cesScore: number | undefined;
      for (const q of questions) {
        const ans = answers[q.key];
        if (q.type === "nps" && typeof ans === "number") npsScore = ans;
        if (q.type === "csat" && typeof ans === "number") csatScore = ans;
        if ((q.type === "ces_5" || q.type === "ces_7") && typeof ans === "number") cesScore = ans;
      }
      await completeResponse.mutateAsync({ responseId, token, npsScore, csatScore, cesScore });
      setStep("done");
    } catch (e: any) {
      setSubmitError(e?.message ?? "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h1 className="font-serif text-2xl font-bold text-foreground">Survey Not Found</h1>
        <p className="max-w-sm text-muted-foreground">
          This survey link is invalid, expired, or has been deactivated. Please contact the sender for a new link.
        </p>
      </div>
    );
  }

  const isLastQuestion = currentQ === totalQ - 1;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary">
              <BarChart3 className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-serif text-base font-semibold text-foreground">SurveyPro</span>
          </div>
          {data.survey && (
            <span className="hidden sm:block text-sm text-muted-foreground truncate max-w-[200px]">{data.survey.title}</span>
          )}
        </div>
      </header>

      <div className="container max-w-2xl py-10">
        {step === "done" && (
          <ThankYouScreen
            surveyTitle={data.survey.title}
            branding={data.branding}
          />
        )}
        {(step === "already_done" || alreadyCompleted) && (
          <ThankYouScreen surveyTitle={data.survey.title} branding={data.branding} alreadyDone />
        )}

        {step === "survey" && !alreadyCompleted && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Question {currentQ + 1} of {totalQ}</span>
                <span className="text-muted-foreground">{progress}% complete</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>

            {currentQuestion && (
              <div key={currentQuestion.key} className="animate-fade-in">
                <div className="mb-6 rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Question {currentQuestion.number}
                    {currentQuestion.required && <span className="ml-1 text-destructive">*</span>}
                  </div>
                  <h2 className="mb-6 font-serif text-xl font-semibold leading-snug text-foreground">{currentQuestion.text}</h2>
                  <QuestionField question={currentQuestion} value={currentAnswer} onChange={handleAnswer} />
                </div>

                {submitError && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />{submitError}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={handleBack} disabled={currentQ === 0} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />Back
                  </Button>
                  {isLastQuestion ? (
                    <Button onClick={handleSubmit} disabled={!canProceed || submitting} className="gap-2 px-8">
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Submit Survey
                    </Button>
                  ) : (
                    <Button onClick={handleNext} disabled={!canProceed || saveAnswer.isPending} className="gap-2">
                      {saveAnswer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Next<ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
