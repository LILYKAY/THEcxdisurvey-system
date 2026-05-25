import { DashboardShell, ADMIN_NAV } from "@/components/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { SURVEY_FORMS } from "@shared/surveyForms";
import { ArrowLeft, CheckCircle2, Clock, History, User } from "lucide-react";
import { useParams, useLocation } from "wouter";

function AnswerDisplay({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground italic text-sm">No answer</span>;
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {(value as string[]).map((v) => (
          <Badge key={v} variant="secondary" className="text-xs">{v.replace(/_/g, " ")}</Badge>
        ))}
      </div>
    );
  }
  return <span className="text-sm text-foreground">{String(value).replace(/_/g, " ")}</span>;
}

export default function AdminRespondentDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data, isLoading } = trpc.admin.respondentDetail.useQuery({
    respondentId: Number(id),
  });

  if (isLoading) {
    return (
      <DashboardShell navItems={ADMIN_NAV}>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </DashboardShell>
    );
  }

  if (!data) return null;
  const { respondent, responses } = data;

  return (
    <DashboardShell navItems={ADMIN_NAV}>
      <div className="p-6 space-y-6">
        {/* Back */}
        <button
          onClick={() => navigate("/admin/respondents")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Respondents
        </button>

        {/* Respondent header */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-elegant">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground">
                {respondent.name ?? "Anonymous"}
              </h1>
              <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                {respondent.email && <span>{respondent.email}</span>}
                {respondent.company && <span>· {respondent.company}</span>}
                {respondent.country && <span>· {respondent.country}</span>}
              </div>
              <div className="mt-2 flex gap-2">
                <Badge variant="secondary">{responses.length} survey response{responses.length !== 1 ? "s" : ""}</Badge>
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Registered {new Date(respondent.createdAt).toLocaleDateString()}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Responses */}
        {responses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <History className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No survey responses yet</p>
          </div>
        ) : (
          responses.map((resp) => {
            const form = resp.survey ? SURVEY_FORMS[resp.survey.formKey] : undefined;
            const answerMap: Record<string, unknown> = {};
            for (const a of resp.answers) answerMap[a.questionKey] = a.value;

            return (
              <Card key={resp.id} className="shadow-elegant border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {resp.survey?.title ?? "Survey Response"}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {resp.status === "completed" ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-xs gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Clock className="h-3 w-3" />
                          In Progress
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Started: {new Date(resp.startedAt).toLocaleString()}</span>
                    {resp.completedAt && (
                      <span>Completed: {new Date(resp.completedAt).toLocaleString()}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {form ? (
                    <div className="space-y-4">
                      {form.questions.map((q) => {
                        const answer = resp.answers.find((a) => a.questionKey === q.key);
                        return (
                          <div key={q.key} className="border-b border-border pb-4 last:border-0 last:pb-0">
                            <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              Q{q.number}
                            </p>
                            <p className="mb-2 text-sm font-medium text-foreground">{q.text}</p>
                            <AnswerDisplay value={answerMap[q.key]} />
                            {answer && answer.version > 1 && (
                              <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                                <History className="h-3 w-3" />
                                Updated {answer.version - 1} time{answer.version > 2 ? "s" : ""}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Form definition not found</p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </DashboardShell>
  );
}
