import { useState } from "react";
import { DashboardShell, ADMIN_NAV } from "@/components/DashboardShell";
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
import { ArrowLeft, BarChart3, MessageSquare, Download, FileDown, Loader2 } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";

const COLORS = ["#4f46e5", "#0ea5e9", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AdminSurveyInsights() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const { data, isLoading } = trpc.surveys.insights.useQuery({ surveyId: Number(id) });
  const utils = trpc.useUtils();

  async function handleDownloadCsv() {
    setDownloadingCsv(true);
    try {
      const result = await utils.surveys.exportCsv.fetch({ surveyId: Number(id) });
      if (!result) throw new Error("No data");
      const blob = new Blob([result.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV report downloaded");
    } catch {
      toast.error("Failed to download CSV report");
    } finally {
      setDownloadingCsv(false);
    }
  }

  async function handleDownloadPdf() {
    setDownloadingPdf(true);
    try {
      const result = await utils.surveys.exportPdf.fetch({ surveyId: Number(id) });
      if (!result) throw new Error("No data");
      const binary = atob(result.pdf);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF report downloaded");
    } catch {
      toast.error("Failed to generate PDF report");
    } finally {
      setDownloadingPdf(false);
    }
  }

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

  return (
    <DashboardShell navItems={ADMIN_NAV}>
      <div className="p-6 space-y-6">
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">{data.survey.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{data.form.audience}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-sm">
              {data.totalResponses} response{data.totalResponses !== 1 ? "s" : ""}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCsv}
              disabled={downloadingCsv || downloadingPdf || data.totalResponses === 0}
            >
              {downloadingCsv ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              onClick={handleDownloadPdf}
              disabled={downloadingCsv || downloadingPdf || data.totalResponses === 0}
            >
              {downloadingPdf ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <FileDown className="h-4 w-4 mr-1.5" />}
              PDF
            </Button>
          </div>
        </div>

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
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart
                          data={(insight as any).options}
                          layout="vertical"
                          margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="oklch(0.9 0.005 260)" />
                          <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                          <YAxis
                            type="category"
                            dataKey="label"
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            width={140}
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
      </div>
    </DashboardShell>
  );
}
