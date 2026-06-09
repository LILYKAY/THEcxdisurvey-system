import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart2, Users, Building2, FileText, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { data: metrics } = trpc.admin.overviewMetrics.useQuery();

  const navItems = [
    { label: "Overview", href: "/admin", active: true },
    { label: "Organisations", href: "/admin/organizations" },
    { label: "Users", href: "/admin/users" },
    { label: "Surveys", href: "/admin/surveys" },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Admin" appName="CXDi Admin">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2"><Building2 className="w-4 h-4 text-blue-500" /><span className="text-xs text-gray-500">Organisations</span></div>
              <p className="text-2xl font-bold text-gray-900">{metrics?.totalOrganizations ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-purple-500" /><span className="text-xs text-gray-500">Users</span></div>
              <p className="text-2xl font-bold text-gray-900">{metrics?.totalRespondents ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-green-500" /><span className="text-xs text-gray-500">Surveys</span></div>
              <p className="text-2xl font-bold text-gray-900">{metrics?.totalSurveys ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2"><BarChart2 className="w-4 h-4 text-orange-500" /><span className="text-xs text-gray-500">Responses</span></div>
              <p className="text-2xl font-bold text-gray-900">{metrics?.totalResponses ?? 0}</p>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => navigate("/admin/organizations")}><Building2 className="w-5 h-5 text-blue-500" /><span className="text-xs">Manage Orgs</span></Button>
          <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => navigate("/admin/users")}><Users className="w-5 h-5 text-purple-500" /><span className="text-xs">Manage Users</span></Button>
          <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => navigate("/admin/surveys")}><FileText className="w-5 h-5 text-green-500" /><span className="text-xs">All Surveys</span></Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
