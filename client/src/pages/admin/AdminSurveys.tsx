import { ADMIN_NAV, DashboardShell } from "@/components/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  Copy,
  Download,
  ExternalLink,
  Link2,
  Search,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const FORM_COLORS: Record<string, { bg: string; text: string; badge: string; border: string }> = {
  current_customers: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-400",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  dropped_customers: {
    bg: "bg-rose-50 dark:bg-rose-950/30",
    text: "text-rose-700 dark:text-rose-400",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
  },
  repeat_trial: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-400",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  single_trial: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-400",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
};

const FORM_LABELS: Record<string, string> = {
  current_customers: "Current Customers",
  dropped_customers: "Dropped / Lapsed",
  repeat_trial: "Repeat Trial",
  single_trial: "Single Trial",
};

const FORM_DESCRIPTIONS: Record<string, string> = {
  current_customers: "For active clients currently using your service",
  dropped_customers: "For clients who stopped using your service",
  repeat_trial: "For firms that have trialled your service multiple times",
  single_trial: "For firms that trialled your service only once",
};

function copyLink(url: string, label: string) {
  navigator.clipboard.writeText(url).then(() => {
    toast.success(`"${label}" link copied — ready to share!`);
  });
}

function exportSurveysCsv(
  surveys: Array<{
    id: number;
    title: string;
    formKey: string;
    isActive: boolean;
    createdAt: Date | string;
    organization: { name: string; slug?: string } | null;
    links: Array<{ token: string; isActive: boolean; createdAt: Date | string }>;
    totalResponses: number;
    completedResponses: number;
  }>
) {
  const headers = [
    "Survey ID", "Title", "Form Type", "Organization", "Status",
    "Total Responses", "Completed Responses", "Completion Rate (%)",
    "Active Survey Link", "Total Links", "Created At",
  ];
  const rows = surveys.map((s) => {
    const activeLink = s.links.find((l) => l.isActive);
    const surveyUrl = activeLink ? `${window.location.origin}/s/${activeLink.token}` : "";
    const completionRate = s.totalResponses > 0
      ? Math.round((s.completedResponses / s.totalResponses) * 100) : 0;
    return [
      String(s.id), s.title, FORM_LABELS[s.formKey] ?? s.formKey,
      s.organization?.name ?? "", s.isActive ? "Active" : "Inactive",
      String(s.totalResponses), String(s.completedResponses), String(completionRate),
      surveyUrl, String(s.links.length), new Date(s.createdAt).toISOString(),
    ];
  });
  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `survey-forms-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success(`Exported ${surveys.length} forms to CSV`);
}

export default function AdminSurveys() {
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();
  const { data: surveys, isLoading, error } = trpc.surveys.listAllWithStats.useQuery();

  const filtered = surveys?.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.organization?.name?.toLowerCase().includes(q) ||
      FORM_LABELS[s.formKey]?.toLowerCase().includes(q)
    );
  });

  const totalResponses = surveys?.reduce((sum, s) => sum + s.totalResponses, 0) ?? 0;
  const totalCompleted = surveys?.reduce((sum, s) => sum + s.completedResponses, 0) ?? 0;
  const totalForms = surveys?.length ?? 0;
  const orgsWithForms = new Set(surveys?.map((s) => s.organizationId)).size;

  return (
    <DashboardShell navItems={ADMIN_NAV} title="Survey Forms">
      <div className="p-4 sm:p-6 space-y-6">

        {/* How it works — only shown when no surveys exist */}
        {!isLoading && totalForms === 0 && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              How to get your first survey link
            </h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground mt-0.5">1</span>
                Go to <strong className="text-foreground">Organizations</strong> in the sidebar
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground mt-0.5">2</span>
                Click <strong className="text-foreground">New Organization</strong> and fill in the details
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground mt-0.5">3</span>
                All 4 survey forms are <strong className="text-foreground">automatically created</strong> — come back here to copy and share the links
              </li>
            </ol>
            <Button
              size="sm"
              className="mt-4 gap-2"
              onClick={() => navigate("/admin/organizations")}
            >
              Create an Organization
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Summary stats */}
        {totalForms > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Forms", value: totalForms, icon: ClipboardList, color: "text-primary" },
              { label: "Organizations", value: orgsWithForms, icon: Building2, color: "text-blue-600" },
              { label: "Total Responses", value: totalResponses, icon: Users, color: "text-emerald-600" },
              { label: "Completed", value: totalCompleted, icon: CheckCircle2, color: "text-amber-600" },
            ].map((stat) => (
              <Card key={stat.label} className="shadow-sm">
                <CardContent className="flex items-center gap-3 pt-4 pb-4">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Search + Export toolbar */}
        {totalForms > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by form or organization…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 flex-shrink-0"
              disabled={!surveys || surveys.length === 0}
              onClick={() => surveys && exportSurveysCsv(surveys)}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Failed to load survey forms: {error.message}
          </div>
        )}

        {/* Survey cards */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-secondary" />
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((survey) => {
              const colors = FORM_COLORS[survey.formKey] ?? FORM_COLORS.current_customers;
              const activeLink = survey.links.find((l) => l.isActive);
              const surveyUrl = activeLink
                ? `${window.location.origin}/s/${activeLink.token}`
                : null;
              const completionRate =
                survey.totalResponses > 0
                  ? Math.round((survey.completedResponses / survey.totalResponses) * 100)
                  : 0;

              return (
                <Card
                  key={survey.id}
                  className={`shadow-sm hover:shadow-md transition-shadow border ${colors.border}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
                        <ClipboardList className={`h-4 w-4 ${colors.text}`} />
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.badge}`}>
                        {FORM_LABELS[survey.formKey] ?? survey.formKey}
                      </span>
                    </div>
                    <CardTitle className="mt-3 text-sm font-semibold leading-snug">
                      {survey.title}
                    </CardTitle>
                    {survey.organization && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{survey.organization.name}</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {FORM_DESCRIPTIONS[survey.formKey]}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3">
                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground">{survey.totalResponses}</p>
                        <p className="text-[10px] text-muted-foreground">Responses</p>
                      </div>
                      <div className="text-center border-x border-border">
                        <p className="text-lg font-bold text-foreground">{survey.completedResponses}</p>
                        <p className="text-[10px] text-muted-foreground">Completed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground">{completionRate}%</p>
                        <p className="text-[10px] text-muted-foreground">Rate</p>
                      </div>
                    </div>

                    {/* Shareable link — the most important element */}
                    {surveyUrl ? (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                          <Link2 className="h-3 w-3" />
                          Shareable Link
                        </p>
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
                          <span className="flex-1 truncate font-mono text-[11px] text-muted-foreground">
                            {surveyUrl}
                          </span>
                          <button
                            onClick={() => copyLink(surveyUrl, FORM_LABELS[survey.formKey] ?? survey.title)}
                            className="flex-shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                            title="Copy link"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <Button
                          size="sm"
                          className="w-full gap-2 text-xs"
                          onClick={() => copyLink(surveyUrl, FORM_LABELS[survey.formKey] ?? survey.title)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy Link to Share
                        </Button>
                      </div>
                    ) : (
                      <div className="rounded-md border border-dashed border-border px-3 py-2 text-center">
                        <span className="text-xs text-muted-foreground">No active link — re-provision this org</span>
                      </div>
                    )}

                    {/* Secondary actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1.5 text-xs"
                        onClick={() => navigate(`/admin/surveys/${survey.id}/insights`)}
                      >
                        <BarChart3 className="h-3 w-3" />
                        Insights
                      </Button>
                      {surveyUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1.5 text-xs"
                          onClick={() => window.open(surveyUrl, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3" />
                          Preview
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-0.5">
                      <Badge variant={survey.isActive ? "default" : "secondary"} className="text-[10px]">
                        {survey.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {survey.links.length} link{survey.links.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : !isLoading && totalForms > 0 && filtered?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No forms match your search.</p>
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
