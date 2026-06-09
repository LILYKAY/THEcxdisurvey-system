import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

export default function OrgRespondents() {
  const { orgId } = useParams<{ orgId: string }>();
  const orgIdNum = parseInt(orgId ?? "0");
  const [, navigate] = useLocation();

  const { data: responses, isLoading } = trpc.org.responseFeed.useQuery({ organizationId: orgIdNum, limit: 50 });

  const navItems = [
    { label: "Dashboard", href: `/org/${orgId}` },
    { label: "Surveys", href: `/org/${orgId}/surveys` },
    { label: "Respondents", href: `/org/${orgId}/respondents`, active: true },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Respondents">
      <div className="space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Respondents</h1>
        {isLoading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : !responses?.length ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No responses yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {responses.map((r: any) => (
              <Card key={r.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => navigate(`/org/${orgId}/respondents/${r.id}`)}>
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={r.isComplete ? "default" : "outline"} className={r.isComplete ? "bg-green-100 text-green-700 border-green-200" : ""}>{r.isComplete ? "Complete" : "Partial"}</Badge>
                    {r.sentiment && <Badge variant="outline" className={`capitalize ${r.sentiment === "promoter" ? "text-green-600" : r.sentiment === "passive" ? "text-yellow-600" : "text-red-600"}`}>{r.sentiment}</Badge>}
                    {r.npsScore !== null && <span className="text-sm text-gray-600">NPS: <strong>{r.npsScore}</strong></span>}
                  </div>
                  <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
