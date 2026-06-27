import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BarChart2, Users, CheckCircle, TrendingUp, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AiInsights } from "@/components/AiInsights";


function ExportButtons({ surveyId, surveyTitle }: { surveyId: number; surveyTitle: string }) {
  const [isExporting, setIsExporting] = useState(false);
  const { mutate: downloadPdf } = trpc.surveys.downloadPdf.useMutation();
  const { mutate: exportCsv } = trpc.surveys.exportCsv.useMutation();

  const handleExportPDF = async () => {
    if (!surveyId) return;
    setIsExporting(true);
    try {
      downloadPdf(
        { surveyId },
        {
          onSuccess: (data) => {
            const link = document.createElement("a");
            link.href = `data:application/pdf;base64,${data.pdf}`;
            link.download = `${surveyTitle}-report.pdf`;
            link.click();
            toast.success("PDF downloaded successfully");
          },
          onError: () => {
            toast.error("Failed to download PDF");
          },
        }
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    if (!surveyId) return;
    setIsExporting(true);
    try {
      exportCsv(
        { surveyId },
        {
          onSuccess: (data) => {
            const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = data.filename;
            link.click();
            URL.revokeObjectURL(link.href);
            toast.success("CSV downloaded successfully");
          },
          onError: () => {
            toast.error("Failed to export CSV");
          },
        }
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-2 shrink-0 flex-wrap">
      <Button
        size="sm"
        variant="outline"
        onClick={handleExportPDF}
        disabled={isExporting}
        className="flex items-center gap-2 h-10 px-4 font-medium"
      >
        {isExporting ? <Spinner className="w-4 h-4" /> : <Download className="w-4 h-4" />}
        PDF
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleExportCSV}
        disabled={isExporting}
        className="flex items-center gap-2 h-10 px-4 font-medium"
      >
        {isExporting ? <Spinner className="w-4 h-4" /> : <Download className="w-4 h-4" />}
        CSV
      </Button>
    </div>
  );
}

export default function OrgAnalytics() {
  const { orgId, surveyId } = useParams<{ orgId: string; surveyId: string }>();
  const orgIdNum = parseInt(orgId ?? "0");
  const surveyIdNum = parseInt(surveyId ?? "0");
  const [, navigate] = useLocation();

  const { data: survey } = trpc.surveys.get.useQuery({ id: surveyIdNum });
  const { data: responses, isLoading } = trpc.surveys.getResponses.useQuery({ surveyId: surveyIdNum });

  const totalResponses = responses?.length ?? 0;
  const completedResponses = responses?.filter((r: any) => r.isComplete).length ?? 0;
  const completionRate = totalResponses > 0 ? Math.round((completedResponses / totalResponses) * 100) : 0;

  const npsResponses = responses?.filter((r: any) => r.npsScore !== null) ?? [];
  const promoters = npsResponses.filter((r: any) => r.npsScore >= 9).length;
  const passives = npsResponses.filter((r: any) => r.npsScore >= 7 && r.npsScore < 9).length;
  const detractors = npsResponses.filter((r: any) => r.npsScore < 7).length;
  const npsScore = npsResponses.length > 0 ? Math.round(((promoters - detractors) / npsResponses.length) * 100) : null;

  const navItems = [
    { label: "Dashboard", href: `/org/${orgId}` },
    { label: "Surveys", href: `/org/${orgId}/surveys` },
    { label: "Analytics", href: `/org/${orgId}/surveys/${surveyId}/analytics`, active: true },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Analytics">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/org/${orgId}/surveys`)} className="text-muted-foreground shrink-0 h-10">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">{survey?.title ?? "Analytics"}</h1>
              <p className="text-sm text-muted-foreground mt-1">Response analytics and insights</p>
            </div>
          </div>
          <ExportButtons surveyId={surveyIdNum} surveyTitle={survey?.title ?? "Survey"} />
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ai-insights" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-xs font-medium text-muted-foreground">Total Responses</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{totalResponses}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-xs font-medium text-muted-foreground">Completed</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{completedResponses}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-5 h-5 text-purple-500" />
                <span className="text-xs font-medium text-muted-foreground">Completion Rate</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{completionRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <span className="text-xs font-medium text-muted-foreground">NPS Score</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{npsScore !== null ? npsScore : "—"}</p>
            </CardContent>
          </Card>
        </div>

        {npsResponses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">NPS Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-5 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-3xl font-bold text-green-700">{promoters}</p>
                  <p className="text-sm font-medium text-green-600 mt-1">Promoters (9-10)</p>
                  <p className="text-xs text-muted-foreground mt-1">{npsResponses.length > 0 ? Math.round((promoters / npsResponses.length) * 100) : 0}%</p>
                </div>
                <div className="p-5 bg-yellow-50 rounded-lg border border-yellow-100">
                  <p className="text-3xl font-bold text-yellow-700">{passives}</p>
                  <p className="text-sm font-medium text-yellow-600 mt-1">Passives (7-8)</p>
                  <p className="text-xs text-muted-foreground mt-1">{npsResponses.length > 0 ? Math.round((passives / npsResponses.length) * 100) : 0}%</p>
                </div>
                <div className="p-5 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-3xl font-bold text-red-700">{detractors}</p>
                  <p className="text-sm font-medium text-red-600 mt-1">Detractors (0-6)</p>
                  <p className="text-xs text-muted-foreground mt-1">{npsResponses.length > 0 ? Math.round((detractors / npsResponses.length) * 100) : 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Responses</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center text-muted-foreground py-8">Loading responses...</div>
            ) : !responses?.length ? (
              <div className="text-center text-muted-foreground py-8">No responses yet.</div>
            ) : (
              <div className="space-y-3">
                {responses.slice(0, 20).map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-4 bg-card border rounded-lg hover:bg-accent/5 transition-colors">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant={r.isComplete ? "default" : "outline"} className={r.isComplete ? "bg-green-100 text-green-700 border-green-200 font-medium" : "font-medium"}>
                        {r.isComplete ? "Complete" : "Partial"}
                      </Badge>
                      {r.sentiment && (
                        <Badge variant="outline" className={`capitalize font-medium ${r.sentiment === "promoter" ? "text-green-600" : r.sentiment === "passive" ? "text-yellow-600" : "text-red-600"}`}>
                          {r.sentiment}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="ai-insights" className="space-y-6">
            <AiInsights surveyId={surveyIdNum} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
