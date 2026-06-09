import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart2, Users, FileText, Send, TrendingUp, Plus, Settings, Mail } from "lucide-react";

export default function OrgDashboard() {
  const { orgId } = useParams<{ orgId: string }>();
  const orgIdNum = parseInt(orgId ?? "0");
  const [, navigate] = useLocation();

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
    { label: "Email Branding", href: `/org/${orgId}/branding` },
    { label: "Settings", href: `/org/${orgId}/settings` },
  ];

  const activeSurveys = surveys?.filter((s) => s.status === "active") ?? [];

  return (
    <DashboardLayout navItems={navItems} title="Dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{org?.name ?? "Organisation Dashboard"}</h1>
            <p className="text-sm text-gray-500 mt-1">{org?.industry ?? ""} {org?.country ? `· ${org.country}` : ""}</p>
          </div>
          <Button onClick={() => navigate(`/org/${orgId}/surveys`)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> New Survey
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-500">Total Surveys</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics?.totalSurveys ?? 0}</p>
              <p className="text-xs text-green-600 mt-1">{activeSurveys.length} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-gray-500">Total Responses</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics?.totalResponses ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart2 className="w-4 h-4 text-green-500" />
                <span className="text-xs text-gray-500">Completion Rate</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics?.completionRate ?? 0}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-gray-500">Total Responses</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics?.totalResponses ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Surveys</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/org/${orgId}/surveys`)} className="text-blue-600 text-xs">View all</Button>
              </div>
            </CardHeader>
            <CardContent>
              {!surveys?.length ? (
                <div className="text-center py-6">
                  <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No surveys yet</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate(`/org/${orgId}/surveys`)}>Create your first survey</Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {surveys.slice(0, 5).map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/org/${orgId}/surveys/${s.id}/analytics`)}>
                      <p className="text-sm font-medium text-gray-900 truncate flex-1">{s.title}</p>
                      <div className="flex items-center gap-2 ml-2">
                        <Badge variant="outline" className={`text-xs ${s.status === "active" ? "text-green-600 border-green-200 bg-green-50" : "text-gray-500"}`}>{s.status ?? "draft"}</Badge>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); navigate(`/org/${orgId}/surveys/${s.id}/send`); }}>
                          <Send className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Responses</CardTitle>
            </CardHeader>
            <CardContent>
              {!feed?.length ? (
                <div className="text-center py-6">
                  <BarChart2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No responses yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {feed.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2">
                        {r.sentiment && (
                          <Badge variant="outline" className={`text-xs capitalize ${r.sentiment === "promoter" ? "text-green-600 border-green-200" : r.sentiment === "passive" ? "text-yellow-600 border-yellow-200" : "text-red-600 border-red-200"}`}>{r.sentiment}</Badge>
                        )}
                        {r.npsScore !== null && <span className="text-sm font-medium">NPS: {r.npsScore}</span>}
                      </div>
                      <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => navigate(`/org/${orgId}/surveys`)}>
                <FileText className="w-5 h-5 text-blue-500" />
                <span className="text-xs">New Survey</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => navigate(`/org/${orgId}/contacts`)}>
                <Users className="w-5 h-5 text-purple-500" />
                <span className="text-xs">Add Contacts</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => navigate(`/org/${orgId}/branding`)}>
                <Mail className="w-5 h-5 text-green-500" />
                <span className="text-xs">Email Branding</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => navigate(`/org/${orgId}/settings`)}>
                <Settings className="w-5 h-5 text-gray-500" />
                <span className="text-xs">Settings</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
