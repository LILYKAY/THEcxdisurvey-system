import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, BarChart2 } from "lucide-react";

export default function AdminSurveys() {
  const [, navigate] = useLocation();
  const { data: surveys, isLoading } = trpc.admin.allSurveys.useQuery();

  const navItems = [
    { label: "Overview", href: "/admin" },
    { label: "Organisations", href: "/admin/organizations" },
    { label: "Users", href: "/admin/users" },
    { label: "Surveys", href: "/admin/surveys", active: true },
  ];

  const statusColor: Record<string, string> = {
    draft: "text-gray-500",
    active: "text-green-600 border-green-200 bg-green-50",
    inactive: "text-yellow-600 border-yellow-200 bg-yellow-50",
    archived: "text-red-600 border-red-200 bg-red-50",
  };

  return (
    <DashboardLayout navItems={navItems} title="All Surveys" appName="CXDi Admin">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">All Surveys</h1>
        {isLoading ? <div className="text-center text-gray-500 py-8">Loading...</div> : !surveys?.length ? (
          <Card><CardContent className="p-12 text-center"><FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No surveys yet</p></CardContent></Card>
        ) : (
          <div className="space-y-2">
            {surveys.map((s: any) => (
              <Card key={s.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{s.title}</p>
                      <Badge variant="outline" className={`text-xs ${statusColor[s.status ?? "draft"]}`}>{s.status ?? "draft"}</Badge>
                    </div>
                    <p className="text-xs text-gray-500">{s.organization?.name ?? "Unknown org"}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/surveys/${s.id}/insights`)}>
                    <BarChart2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
