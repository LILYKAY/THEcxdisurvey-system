import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Download,
  Mail,
  BarChart3,
  Users,
  CheckCircle2,
  FileText,
  Loader2,
  Send,
  FileDown,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const FORM_COLORS: Record<string, string> = {
  current_customers: "bg-emerald-100 text-emerald-800 border-emerald-200",
  dropped_customers: "bg-rose-100 text-rose-800 border-rose-200",
  repeat_trial: "bg-violet-100 text-violet-800 border-violet-200",
  single_trial: "bg-amber-100 text-amber-800 border-amber-200",
};

export default function OrgReports() {
  const { orgId } = useParams<{ orgId: string }>();
  const organizationId = parseInt(orgId ?? "0");
  const { user } = useAuth();
  const [emailInputs, setEmailInputs] = useState<Record<number, string>>({});
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [downloadingCsvId, setDownloadingCsvId] = useState<number | null>(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState<number | null>(null);

  const surveysQuery = trpc.surveys.listByOrg.useQuery({ organizationId });
  const orgQuery = trpc.organizations.get.useQuery({ id: organizationId });
  const emailReportMutation = trpc.org.emailReport.useMutation({
    onSuccess: () => {
      toast.success("Report sent to your email");
      setSendingId(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setSendingId(null);
    },
  });

  const surveys = surveysQuery.data ?? [];
  const org = orgQuery.data;
  const utils = trpc.useUtils();

  async function handleDownloadCsv(survey: (typeof surveys)[0]) {
    setDownloadingCsvId(survey.id);
    try {
      const result = await utils.surveys.exportCsv.fetch({ surveyId: survey.id });
      if (!result) throw new Error("No data");
      const blob = new Blob([result.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${org?.slug ?? "org"}-${survey.formKey}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV report downloaded");
    } catch {
      toast.error("Failed to download CSV report");
    } finally {
      setDownloadingCsvId(null);
    }
  }

  async function handleDownloadPdf(survey: (typeof surveys)[0]) {
    setDownloadingPdfId(survey.id);
    try {
      const result = await utils.surveys.exportPdf.fetch({ surveyId: survey.id });
      if (!result) throw new Error("No data");
      // Decode base64 → binary → Blob
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
      setDownloadingPdfId(null);
    }
  }

  function handleEmailReport(survey: (typeof surveys)[0]) {
    const email = emailInputs[survey.id]?.trim() || user?.email;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSendingId(survey.id);
    emailReportMutation.mutate({
      organizationId,
      surveyId: survey.id,
      toEmail: email,
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Download or email detailed response reports for each survey category.
        </p>
      </div>

      {/* Survey report cards */}
      {surveysQuery.isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : surveys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No surveys found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create an organization and provision surveys to generate reports.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {surveys.map((survey) => {
            const colorClass = FORM_COLORS[survey.formKey] ?? "bg-slate-100 text-slate-700 border-slate-200";
            const totalResponses = (survey as { totalResponses?: number }).totalResponses ?? 0;
            const completedResponses = (survey as { completedResponses?: number }).completedResponses ?? 0;
            const completionRate = totalResponses > 0 ? Math.round((completedResponses / totalResponses) * 100) : 0;
            const emailVal = emailInputs[survey.id] ?? user?.email ?? "";
            const isCsvLoading = downloadingCsvId === survey.id;
            const isPdfLoading = downloadingPdfId === survey.id;

            return (
              <Card key={survey.id} className="border shadow-sm overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{survey.title}</CardTitle>
                        <Badge className={`text-xs border font-medium ${colorClass}`}>
                          {survey.formKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {survey.description ?? "No description"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Metrics row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <Users className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xl font-bold text-foreground">{totalResponses}</p>
                      <p className="text-xs text-muted-foreground">Responses</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
                      <p className="text-xl font-bold text-foreground">{completedResponses}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <BarChart3 className="h-4 w-4 text-primary mx-auto mb-1" />
                      <p className="text-xl font-bold text-foreground">{completionRate}%</p>
                      <p className="text-xs text-muted-foreground">Rate</p>
                    </div>
                  </div>

                  {/* Download actions row */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    {/* CSV Download */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none"
                      onClick={() => handleDownloadCsv(survey)}
                      disabled={isCsvLoading || isPdfLoading || totalResponses === 0}
                    >
                      {isCsvLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Download CSV
                    </Button>

                    {/* PDF Download */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                      onClick={() => handleDownloadPdf(survey)}
                      disabled={isCsvLoading || isPdfLoading || totalResponses === 0}
                    >
                      {isPdfLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileDown className="h-4 w-4 mr-2" />
                      )}
                      Download PDF
                    </Button>
                  </div>

                  {/* Email report row */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder={user?.email ?? "your@email.com"}
                        value={emailVal}
                        onChange={(e) =>
                          setEmailInputs((prev) => ({ ...prev, [survey.id]: e.target.value }))
                        }
                        className="pl-8 h-9 text-sm"
                      />
                    </div>
                    <Button
                      size="sm"
                      className="shrink-0"
                      onClick={() => handleEmailReport(survey)}
                      disabled={sendingId === survey.id || totalResponses === 0}
                    >
                      {sendingId === survey.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      <span className="ml-1.5 hidden sm:inline">Email Report</span>
                    </Button>
                  </div>

                  {totalResponses === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-1">
                      No responses yet — share the survey link to start collecting data.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
