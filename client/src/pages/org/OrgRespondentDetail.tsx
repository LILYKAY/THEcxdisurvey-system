import { DashboardShell, getOrgNav } from "@/components/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { SURVEY_FORMS } from "@shared/surveyForms";
import { ArrowLeft, CheckCircle2, Clock, History, User } from "lucide-react";
import { useParams, useLocation } from "wouter";

function AnswerDisplay({ value }: { value: unknown }) {
  if (value === null || value === undefined)
    return <span className="text-muted-foreground italic text-sm">No answer</span>;
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {(value as string[]).map((v) => (
          <Badge key={v} variant="secondary" className="text-xs">
            {v.replace(/_/g, " ")}
          </Badge>
        ))}
      </div>
    );
  }
  return <span className="text-sm text-foreground">{String(value).replace(/_/g, " ")}</span>;
}

export default function OrgRespondentDetail() {
  const { orgId, respondentId } = useParams<{ orgId: string; respondentId: string }>();
  const [, navigate] = useLocation();
  const nav = getOrgNav(orgId);

  const { data, isLoading } = trpc.org.respondentDetail.useQuery({
    organizationId: Number(orgId),
    respondentId: Number(respondentId),
  });

  if (isLoading) {
    return (
      <DashboardShell navItems={nav}>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </DashboardShell>
    );
  }

  if (!data) return null;
  const { respondent, responses } = data;

  return (
    <DashboardShell navItems={nav}>
      <div className="p-6 space-y-6">
        <button
          onClick={() => navigate(`/org/${orgId}/respondents`)}
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
                <Badge variant="secondary">
                  {responses.length} response{responses.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Responses */}
        {responses.map((resp) => {
          const form = resp.survey ? SURVEY_FORMS[resp.survey.formKey] : undefined;
          const answerMap: Record<string, unknown> = {};
          for (const a of resp.answers) answerMap[a.questionKey] = a.value;

          // Build history map: questionKey → history entries
          const historyMap: Record<string, typeof resp.history> = {};
          for (const h of resp.history) {
            if (!historyMap[h.questionKey]) historyMap[h.questionKey] = [];
            historyMap[h.questionKey]!.push(h);
          }

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
                  <div className="space-y-5">
                    {form.questions.map((q) => {
                      const answer = resp.answers.find((a) => a.questionKey === q.key);
                      const history = historyMap[q.key] ?? [];

                      return (
                        <div
                          key={q.key}
                          className="border-b border-border pb-5 last:border-0 last:pb-0"
                        >
                          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Q{q.number}
                          </p>
                          <p className="mb-2 text-sm font-medium text-foreground">{q.text}</p>
                          <AnswerDisplay value={answerMap[q.key]} />

                          {/* Version history */}
                          {history.length > 0 && (
                            <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 p-3">
                              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-amber-700">
                                <History className="h-3.5 w-3.5" />
                                Previous versions ({history.length})
                              </p>
                              <div className="space-y-2">
                                {history.map((h) => (
                                  <div key={h.id} className="flex items-start gap-2">
                                    <span className="mt-0.5 text-xs text-amber-600 whitespace-nowrap">
                                      v{h.version} · {new Date(h.recordedAt).toLocaleString()}
                                    </span>
                                    <span className="text-xs text-amber-800">
                                      {Array.isArray(h.value)
                                        ? (h.value as string[]).join(", ")
                                        : String(h.value ?? "—")}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
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
        })}
      </div>
    </DashboardShell>
  );
}
