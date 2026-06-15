import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart2, Users, Send, TrendingUp, Plus, Settings, Mail, FileText } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function OrgDashboard() {
  const { orgId } = useParams<{ orgId: string }>();
  const orgIdNum = parseInt(orgId ?? "0");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const isManager = user?.role === "org_manager";

  const { data: org } = trpc.org.get.useQuery({ id: orgIdNum });
  const { data: metrics } = trpc.org.overviewMetrics.useQuery({ organizationId: orgIdNum });
  const { data: surveys } = trpc.surveys.list.useQuery({ organizationId: orgIdNum });
  const { data: feed } = trpc.org.responseFeed.useQuery({ organizationId: orgIdNum, limit: 5 });

  const navItems = [
    { label: "Dashboard", href: `/org/${orgId}`, active: true },
    { label: "Surveys", href: `/org/${orgId}/surveys` },
    { label: "Contacts", href: `/org/${orgId}/contacts` },
    { label: "Audiences", href: `/org/${orgId}/audiences` },
    { label: "Respondents", href: `/org/${orgId}/respondents` },
    ...(!isManager ? [
      { label: "Email Branding", href: `/org/${orgId}/branding` },
      { label: "Managers", href: `/org/${orgId}/managers` },
      { label: "Settings", href: `/org/${orgId}/settings` },
    ] : []),
  ];

  return (
    <DashboardLayout navItems={navItems} title="Dashboard">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{org?.name ?? "Organisation Dashboard"}</h1>
            {(org?.industry || org?.country) && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {org?.industry ?? ""}{org?.country ? ` · ${org.country}` : ""}
              </p>
            )}
          </div>
          <Button
            onClick={() => navigate(`/org/${orgId}/surveys`)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 gap-2 h-10 px-3 sm:px-4"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Survey</span>
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground leading-tight">Total Responses</p>
                <p className="text-2xl font-bold text-foreground">{metrics?.totalResponses ?? 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
                  <BarChart2 className="w-4 h-4 text-accent-foreground" />
                </div>
                <p className="text-xs text-muted-foreground leading-tight">Completion</p>
                <p className="text-2xl font-bold text-foreground">{metrics?.completionRate ?? 0}%</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground leading-tight">Avg. NPS</p>
                <p className="text-2xl font-bold text-foreground">{metrics?.avgNps != null ? metrics.avgNps.toFixed(1) : "—"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent surveys + recent responses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Recent Surveys</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/org/${orgId}/surveys`)} className="text-primary text-xs h-7 px-2">View all</Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {!surveys?.length ? (
                <div className="text-center py-6">
                  <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No surveys yet</p>
                  <Button variant="outline" size="sm" className="mt-3 h-9" onClick={() => navigate(`/org/${orgId}/surveys`)}>
                    Create your first survey
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {surveys.slice(0, 5).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/60 active:bg-muted cursor-pointer transition-colors gap-2"
                      onClick={() => navigate(`/org/${orgId}/surveys/${s.id}/analytics`)}
                    >
                      <p className="text-sm font-medium text-foreground truncate flex-1">{s.title}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant="outline"
                          className={`text-xs ${s.status === "active" ? "text-primary border-primary/30 bg-primary/5" : "text-muted-foreground"}`}
                        >
                          {s.status ?? "draft"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-primary hover:text-primary"
                          onClick={(e) => { e.stopPropagation(); navigate(`/org/${orgId}/surveys/${s.id}/send`); }}
                        >
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm font-semibold">Recent Responses</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {!feed?.length ? (
                <div className="text-center py-6">
                  <BarChart2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No responses yet</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {feed.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {r.sentiment && (
                          <Badge
                            variant="outline"
                            className={`text-xs capitalize shrink-0 ${
                              r.sentiment === "promoter"
                                ? "text-primary border-primary/30"
                                : r.sentiment === "passive"
                                ? "text-amber-600 border-amber-200"
                                : "text-destructive border-destructive/30"
                            }`}
                          >
                            {r.sentiment}
                          </Badge>
                        )}
                        {r.npsScore !== null && <span className="text-sm font-medium text-foreground shrink-0">NPS: {r.npsScore}</span>}
                        {r.title && <span className="text-xs text-muted-foreground truncate">{r.title}</span>}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{new Date(r.completedAt ?? r.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 active:bg-primary/10" onClick={() => navigate(`/org/${orgId}/surveys`)}>
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium">New Survey</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 active:bg-primary/10" onClick={() => navigate(`/org/${orgId}/contacts`)}>
                <Users className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium">Add Contacts</span>
              </Button>
              {!isManager && (
                <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 active:bg-primary/10" onClick={() => navigate(`/org/${orgId}/branding`)}>
                  <Mail className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium">Email Branding</span>
                </Button>
              )}
              {!isManager && (
                <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 active:bg-primary/10" onClick={() => navigate(`/org/${orgId}/settings`)}>
                  <Settings className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium">Settings</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
