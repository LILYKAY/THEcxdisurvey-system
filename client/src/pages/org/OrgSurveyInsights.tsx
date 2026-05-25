import { DashboardShell, getOrgNav } from "@/components/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ArrowLeft, Download, MessageSquare } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";

const COLORS = ["#4f46e5", "#0ea5e9", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];

export default function OrgSurveyInsights() {
  const { orgId, surveyId } = useParams<{ orgId: string; surveyId: string }>();
  const [, navigate] = useLocation();
  const nav = getOrgNav(orgId);

  const { data, isLoading } = trpc.surveys.insights.useQuery({
    surveyId: Number(surveyId),
  });

  const { data: csvData, refetch: fetchCsv } = trpc.surveys.exportCsv.useQuery(
    { surveyId: Number(surveyId) },
    { enabled: false }
  );

  const handleExport = async () => {
    const result = await fetchCsv();
    if (result.data) {
      const blob = new Blob([result.data.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported successfully");
    }
  };

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

  return (
    <DashboardShell navItems={nav}>
      <div className="p-6 space-y-6">
        <button
          onClick={() => navigate(`/org/${orgId}`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">{data.survey.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{data.form.audience}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              {data.totalResponses} response{data.totalResponses !== 1 ? "s" : ""}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={handleExport}
              disabled={data.totalResponses === 0}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {data.totalResponses === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-dashed border-border">
            <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-foreground">No responses yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Share your survey link to start collecting responses.
            </p>
          </div>
        ) : (
          <div className="space-y-5 stagger-children">
            {data.insights.map((insight) => (
              <Card key={insight.questionKey} className="shadow-elegant border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {insight.questionKey.match(/q(\d+)/)?.[1] ?? "?"}
                    </div>
                    <CardTitle className="text-base leading-snug">{insight.questionText}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {insight.type === "open_ended" ? (
                    <div>
                      {(insight as any).responses?.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No responses yet</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {(insight as any).responses?.map((r: any, i: number) => (
                            <div
                              key={i}
                              className="flex gap-3 rounded-lg bg-secondary/40 px-4 py-3"
                            >
                              <MessageSquare className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                              <p className="text-sm text-foreground leading-relaxed">{r.value}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {(insight as any).options?.every((o: any) => o.count === 0) ? (
                        <p className="text-sm text-muted-foreground italic">No responses yet</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={Math.max(160, (insight as any).options?.length * 36)}>
                          <BarChart
                            data={(insight as any).options}
                            layout="vertical"
                            margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              horizontal={false}
                              stroke="oklch(0.9 0.005 260)"
                            />
                            <XAxis
                              type="number"
                              tick={{ fontSize: 11 }}
                              tickLine={false}
                              axisLine={false}
                              allowDecimals={false}
                            />
                            <YAxis
                              type="category"
                              dataKey="label"
                              tick={{ fontSize: 11 }}
                              tickLine={false}
                              axisLine={false}
                              width={150}
                            />
                            <Tooltip
                              contentStyle={{
                                background: "white",
                                border: "1px solid oklch(0.9 0.005 260)",
                                borderRadius: "8px",
                                fontSize: 12,
                              }}
                            />
                            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                              {(insight as any).options?.map((_: any, i: number) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
