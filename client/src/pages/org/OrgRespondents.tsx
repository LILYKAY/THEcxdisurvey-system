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
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Respondents</h1>
          <p className="text-sm text-muted-foreground mt-1">View all survey responses</p>
        </div>
        {isLoading ? (
          <div className="text-center text-muted-foreground py-10">Loading...</div>
        ) : !responses?.length ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-14 h-14 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-foreground font-semibold text-lg">No responses yet</p>
              <p className="text-muted-foreground text-sm mt-1">Responses will appear here as they are submitted</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {responses.map((r: any) => (
              <Card key={r.id} className="hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate(`/org/${orgId}/respondents/${r.id}`)}>
                <CardContent className="p-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={r.isComplete ? "default" : "outline"} className={r.isComplete ? "bg-green-100 text-green-700 border-green-200 font-medium" : "font-medium"}>{r.isComplete ? "Complete" : "Partial"}</Badge>
                    {r.sentiment && <Badge variant="outline" className={`capitalize font-medium ${r.sentiment === "promoter" ? "text-green-600" : r.sentiment === "passive" ? "text-yellow-600" : "text-red-600"}`}>{r.sentiment}</Badge>}
                    {r.npsScore !== null && <span className="text-sm font-medium text-foreground">NPS: <strong className="font-semibold">{r.npsScore}</strong></span>}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{new Date(r.createdAt).toLocaleDateString()}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
