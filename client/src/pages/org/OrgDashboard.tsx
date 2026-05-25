import { DashboardShell, getOrgNav } from "@/components/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BarChart3,
  CheckCircle2,
  Copy,
  ExternalLink,
  Link2,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";

const FORM_LABELS: Record<string, string> = {
  current_customers: "Current Customers",
  dropped_customers: "Dropped / Lapsed",
  repeat_trial: "Repeat Trial",
  single_trial: "Single Trial",
};

const FORM_COLORS: Record<string, string> = {
  current_customers: "bg-indigo-50 text-indigo-700 border-indigo-100",
  dropped_customers: "bg-amber-50 text-amber-700 border-amber-100",
  repeat_trial: "bg-emerald-50 text-emerald-700 border-emerald-100",
  single_trial: "bg-rose-50 text-rose-700 border-rose-100",
};

function MetricCard({
  title,
  value,
  icon: Icon,
  sub,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
}) {
  return (
    <Card className="shadow-elegant border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrgDashboard() {
  const { orgId } = useParams<{ orgId: string }>();
  const [, navigate] = useLocation();
  const orgIdNum = Number(orgId);
  const nav = getOrgNav(orgId);

  const { data: org } = trpc.organizations.get.useQuery({ id: orgIdNum });
  const { data: metrics } = trpc.org.overview.useQuery({ organizationId: orgIdNum });
  const { data: trend } = trpc.org.responseTrend.useQuery({ organizationId: orgIdNum, days: 30 });
  const { data: surveys } = trpc.surveys.listByOrg.useQuery({ organizationId: orgIdNum });

  const trendData = useMemo(() => {
    if (!trend) return [];
    return trend.map((row) => ({
      date: new Date(row.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      responses: Number(row.count),
    }));
  }, [trend]);

  return (
    <DashboardShell navItems={nav} title={org?.name ?? "Organization Dashboard"}>
      <div className="p-6 space-y-6">
        {/* Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          <MetricCard
            title="Total Respondents"
            value={metrics?.totalRespondents ?? 0}
            icon={Users}
          />
          <MetricCard
            title="Total Responses"
            value={metrics?.totalResponses ?? 0}
            icon={BarChart3}
          />
          <MetricCard
            title="Completed"
            value={metrics?.completedResponses ?? 0}
            icon={CheckCircle2}
          />
          <MetricCard
            title="Completion Rate"
            value={`${metrics?.completionRate ?? 0}%`}
            icon={TrendingUp}
            sub={`${metrics?.totalSurveys ?? 0} active survey${metrics?.totalSurveys !== 1 ? "s" : ""}`}
          />
        </div>

        {/* Trend chart */}
        <Card className="shadow-elegant border-border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <TrendingUp className="h-4 w-4 text-primary" />
              Response Trend (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                No responses recorded yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOrgResp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.005 260)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "white",
                      border: "1px solid oklch(0.9 0.005 260)",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="responses"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fill="url(#colorOrgResp)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Survey forms */}
        <div>
          <h2 className="mb-4 font-semibold text-foreground">Survey Forms</h2>
          {!surveys || surveys.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <BarChart3 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">No surveys provisioned yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Ask an admin to provision surveys for your organization.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 stagger-children">
              {surveys.map((survey) => (
                <SurveyCard
                  key={survey.id}
                  survey={survey}
                  orgId={orgIdNum}
                  onViewInsights={() =>
                    navigate(`/org/${orgId}/surveys/${survey.id}/insights`)
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function SurveyCard({
  survey,
  orgId,
  onViewInsights,
}: {
  survey: { id: number; formKey: string; title: string; isActive: boolean };
  orgId: number;
  onViewInsights: () => void;
}) {
  const { data: links } = trpc.surveys.getLinks.useQuery({ surveyId: survey.id });
  const utils = trpc.useUtils();
  const createLink = trpc.surveys.createLink.useMutation({
    onSuccess: () => {
      toast.success("New survey link created");
      utils.surveys.getLinks.invalidate({ surveyId: survey.id });
    },
  });

  const activeLink = links?.find((l) => l.isActive);
  const surveyUrl = activeLink
    ? `${window.location.origin}/s/${activeLink.token}`
    : null;

  const copyLink = () => {
    if (surveyUrl) {
      navigator.clipboard.writeText(surveyUrl);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <Card className="shadow-elegant border-border hover:shadow-elegant-lg transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <Badge
            variant="outline"
            className={`text-xs ${FORM_COLORS[survey.formKey] ?? ""}`}
          >
            {FORM_LABELS[survey.formKey] ?? survey.formKey}
          </Badge>
          {survey.isActive ? (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-xs">Active</Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">Inactive</Badge>
          )}
        </div>
        <h3 className="font-semibold text-foreground mb-3">{survey.title}</h3>

        {/* Shareable link */}
        {surveyUrl ? (
          <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 mb-3">
            <Link2 className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate text-xs text-muted-foreground font-mono">
              /s/{activeLink?.token?.slice(0, 16)}…
            </span>
            <button onClick={copyLink} className="text-primary hover:text-primary/80 transition-colors">
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="w-full mb-3 gap-1.5 text-xs"
            onClick={() => createLink.mutate({ surveyId: survey.id })}
          >
            <Link2 className="h-3.5 w-3.5" />
            Generate Link
          </Button>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5 text-xs"
            onClick={onViewInsights}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            View Insights
          </Button>
          {surveyUrl && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => window.open(surveyUrl, "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
