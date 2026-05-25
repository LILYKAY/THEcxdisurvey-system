import { DashboardShell, ADMIN_NAV } from "@/components/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo } from "react";

const FORM_LABELS: Record<string, string> = {
  current_customers: "Current Customers",
  dropped_customers: "Dropped / Lapsed",
  repeat_trial: "Repeat Trial",
  single_trial: "Single Trial",
};

const CHART_COLORS = ["#4f46e5", "#0ea5e9", "#f59e0b", "#10b981"];

function MetricCard({
  title,
  value,
  icon: Icon,
  sub,
  color = "text-primary",
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  color?: string;
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
          <div className={`rounded-lg bg-primary/10 p-2.5 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: metrics, isLoading: metricsLoading } = trpc.admin.overview.useQuery();
  const { data: trend } = trpc.admin.responseTrend.useQuery({ days: 30 });
  const { data: byForm } = trpc.admin.responsesByForm.useQuery();

  const trendData = useMemo(() => {
    if (!trend) return [];
    return trend.map((row) => ({
      date: new Date(row.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      responses: Number(row.count),
    }));
  }, [trend]);

  const formData = useMemo(() => {
    if (!byForm) return [];
    return byForm.map((row) => ({
      name: FORM_LABELS[row.formKey] ?? row.formKey,
      count: Number(row.count),
    }));
  }, [byForm]);

  return (
    <DashboardShell navItems={ADMIN_NAV} title="Admin Overview">
      <div className="p-6 space-y-6">
        {/* Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          <MetricCard
            title="Total Organizations"
            value={metricsLoading ? "—" : (metrics?.totalOrganizations ?? 0)}
            icon={Building2}
          />
          <MetricCard
            title="Total Respondents"
            value={metricsLoading ? "—" : (metrics?.totalRespondents ?? 0)}
            icon={Users}
          />
          <MetricCard
            title="Total Responses"
            value={metricsLoading ? "—" : (metrics?.totalResponses ?? 0)}
            icon={BarChart3}
          />
          <MetricCard
            title="Completion Rate"
            value={metricsLoading ? "—" : `${metrics?.completionRate ?? 0}%`}
            icon={CheckCircle2}
            sub={`${metrics?.completedResponses ?? 0} completed`}
            color="text-emerald-600"
          />
        </div>

        {/* Charts row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Trend chart */}
          <Card className="lg:col-span-2 shadow-elegant border-border">
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
                      <linearGradient id="colorResp" x1="0" y1="0" x2="0" y2="1">
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
                      fill="url(#colorResp)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* By form chart */}
          <Card className="shadow-elegant border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <BarChart3 className="h-4 w-4 text-primary" />
                Responses by Form
              </CardTitle>
            </CardHeader>
            <CardContent>
              {formData.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                  No data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={formData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.005 260)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "white",
                        border: "1px solid oklch(0.9 0.005 260)",
                        borderRadius: "8px",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {formData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick links */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-elegant">
          <h3 className="mb-4 font-semibold text-foreground">Quick Actions</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Manage Organizations", href: "/admin/organizations", icon: Building2 },
              { label: "View All Respondents", href: "/admin/respondents", icon: Users },
              { label: "Manage Users & Roles", href: "/admin/users", icon: Users },
            ].map((action) => (
              <a
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:shadow-sm"
              >
                <action.icon className="h-4 w-4 text-primary" />
                {action.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
