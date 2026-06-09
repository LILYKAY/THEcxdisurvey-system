import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Question, SurveyFormDefinition } from "@shared/surveyForms";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { cn } from "@/lib/utils";

// ─── Question Renderer ────────────────────────────────────────────────────────

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string | string[] | null;
  onChange: (val: string | string[] | null) => void;
}) {
  if (question.type === "open_ended") {
    return (
      <textarea
        className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-shadow min-h-[120px]"
        placeholder="Share your thoughts…"
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
      />
    );
  }

  if (question.type === "single_choice") {
    return (
      <div className="space-y-2.5">
        {question.options?.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-all",
              value === opt.value
                ? "border-primary bg-primary/5 text-foreground shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-secondary/50"
            )}
          >
            <div
              className={cn(
                "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                value === opt.value ? "border-primary bg-primary" : "border-muted-foreground/40"
              )}
            >
              {value === opt.value && (
                <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
              )}
            </div>
            <input
              type="radio"
              className="sr-only"
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>
    );
  }

  if (question.type === "multiple_choice" || question.type === "checkboxes") {
    const selected = (value as string[]) ?? [];
    const maxSel = question.maxSelections;

    const toggle = (v: string) => {
      if (selected.includes(v)) {
        onChange(selected.filter((s) => s !== v));
      } else {
        if (maxSel && selected.length >= maxSel) return;
        onChange([...selected, v]);
      }
    };

    return (
      <div className="space-y-2.5">
        {maxSel && (
          <p className="text-xs text-muted-foreground">Select up to {maxSel} options</p>
        )}
        {question.options?.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-all",
                checked
                  ? "border-primary bg-primary/5 text-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-secondary/50"
              )}
            >
              <div
                className={cn(
                  "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition-colors",
                  checked ? "border-primary bg-primary" : "border-muted-foreground/40"
                )}
              >
                {checked && (
                  <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                )}
              </div>
              <input
                type="checkbox"
                className="sr-only"
                value={opt.value}
                checked={checked}
                onChange={() => toggle(opt.value)}
              />
              {opt.label}
            </label>
          );
        })}
      </div>
    );
  }

  return null;
}

// ─── Respondent Info Form ─────────────────────────────────────────────────────

function RespondentInfoStep({
  onStart,
  loading,
}: {
  onStart: (info: { name: string; email: string; company: string; country: string }) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("");

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="jane@firm.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="company">Firm / Company</Label>
          <Input
            id="company"
            placeholder="Acme Audit Partners"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            placeholder="Nigeria"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>
      </div>
      <Button
        className="w-full"
        size="lg"
        disabled={!name || !email || loading}
        onClick={() => onStart({ name, email, company, country })}
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Begin Survey
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Main Survey Page ─────────────────────────────────────────────────────────

export default function SurveyPage() {
  const { token } = useParams<{ token: string }>();
  const [, navigate] = useLocation();
  // Extract invite token from ?invite=xxx query param
  const inviteToken = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("invite") ?? undefined
    : undefined;

  const { data, isLoading, error } = trpc.public.getSurveyByToken.useQuery({ token });

  const startResponse = trpc.public.startResponse.useMutation();
  const saveAnswers = trpc.public.saveAnswer.useMutation();

  const [responseId, setResponseId] = useState<number | null>(null);
  const [step, setStep] = useState<"info" | "survey">("info");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[] | null>>({});
  const [submitting, setSubmitting] = useState(false);

  const form = data ? { title: data.survey.title, questions: data.questions.map((q: any, i: number) => ({ key: q.questionKey, text: q.questionText, type: q.questionType, required: q.isRequired, options: q.options, number: i + 1 })), greeting: data.survey.description } : undefined;
  const questions = form?.questions ?? [];
  const totalQ = questions.length;
  const progress = totalQ > 0 ? Math.round(((currentQ) / totalQ) * 100) : 0;

  const currentQuestion = questions[currentQ];
  const currentAnswer = currentQuestion ? answers[currentQuestion.key] ?? null : null;

  const canProceed = useMemo(() => {
    if (!currentQuestion) return false;
    if (!currentQuestion.required) return true;
    const val = answers[currentQuestion.key];
    if (val === null || val === undefined) return false;
    if (typeof val === "string") return val.trim().length > 0;
    if (Array.isArray(val)) return val.length > 0;
    return false;
  }, [currentQuestion, answers]);

  const handleStart = async (info: {
    name: string;
    email: string;
    company: string;
    country: string;
  }) => {
    const result = await startResponse.mutateAsync({ token, respondentName: info.name, respondentEmail: info.email });
    setResponseId(result.responseId);
    setStep("survey");
  };

  const handleAnswer = (val: string | string[] | null) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.key]: val }));
  };

  const handleNext = async () => {
    if (!responseId || !currentQuestion) return;
    // Auto-save current answer
    await saveAnswers.mutateAsync({
      responseId,
      questionKey: currentQuestion.key,
      value: currentAnswer,
    });
    setCurrentQ((q) => q + 1);
  };

  const handleBack = () => setCurrentQ((q) => Math.max(0, q - 1));

  const handleSubmit = async () => {
    if (!responseId) return;
    setSubmitting(true);
    try {
      // Save all remaining answers and mark complete
      const remaining = questions.slice(currentQ).map((q) => ({
        questionKey: q.key,
        value: answers[q.key] ?? null,
      }));
      // Save answers one by one
      for (const ans of remaining) {
        await saveAnswers.mutateAsync({ responseId, questionKey: ans.questionKey, value: ans.value });
      }
      navigate("/survey-complete");
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
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-sm text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h2 className="font-serif text-xl font-semibold text-foreground">Survey not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This survey link may be invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  const isLastQuestion = currentQ === totalQ - 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary">
              <BarChart3 className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-serif text-base font-semibold text-foreground">SurveyPro</span>
          </div>
          {data.survey && (
            <span className="text-sm text-muted-foreground">{data.survey.title}</span>
          )}
        </div>
      </header>

      <div className="container max-w-2xl py-10">
        {step === "info" ? (
          <div className="animate-fade-in">
            {/* Survey header */}
            <div className="mb-8">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {data.survey.title}
              </div>
              <h1 className="font-serif text-3xl font-bold text-foreground">
                {data.survey.title}
              </h1>
              <p className="mt-3 text-muted-foreground leading-relaxed">{data.survey.description ?? ''}</p>
            </div>

            {/* Info form */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-elegant">
              <h2 className="mb-5 font-semibold text-foreground">
                Before we begin, please tell us a bit about yourself
              </h2>
              <RespondentInfoStep
                onStart={handleStart}
                loading={startResponse.isPending}
              />
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            {/* Progress */}
            <div className="mb-8">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">
                  Question {currentQ + 1} of {totalQ}
                </span>
                <span className="text-muted-foreground">{progress}% complete</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>

            {/* Question card */}
            {currentQuestion && (
              <div key={currentQuestion.key} className="animate-fade-in">
                <div className="mb-6 rounded-xl border border-border bg-card p-6 shadow-elegant">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Question {currentQuestion.number}
                    {currentQuestion.required && (
                      <span className="ml-1 text-destructive">*</span>
                    )}
                  </div>
                  <h2 className="mb-5 font-serif text-xl font-semibold leading-snug text-foreground">
                    {currentQuestion.text}
                  </h2>
                  <QuestionField
                    question={currentQuestion}
                    value={currentAnswer}
                    onChange={handleAnswer}
                  />
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentQ === 0}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>

                  {isLastQuestion ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={!canProceed || submitting}
                      className="gap-2 px-8"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Submit Survey
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      disabled={!canProceed || saveAnswers.isPending}
                      className="gap-2"
                    >
                      {saveAnswers.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      Next
                      <ArrowRight className="h-4 w-4" />
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
