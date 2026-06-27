import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search } from "lucide-react";
import { useState } from "react";

export default function OrgRespondents() {
  const { orgId } = useParams<{ orgId: string }>();
  const orgIdNum = parseInt(orgId ?? "0");
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const { data: responses, isLoading } = trpc.org.responseFeed.useQuery({ organizationId: orgIdNum, limit: 100 });

  const filtered = responses?.filter((r: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.surveyTitle?.toLowerCase().includes(s) ||
      r.sentiment?.toLowerCase().includes(s) ||
      String(r.npsScore ?? "").includes(s)
    );
  });

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
          <p className="text-sm text-muted-foreground mt-1">View all survey responses from your organisation</p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by survey title, sentiment…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filtered?.length ?? 0} response{filtered?.length !== 1 ? "s" : ""}
          </span>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-10">Loading...</div>
        ) : !filtered?.length ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-14 h-14 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-foreground font-semibold text-lg">No responses yet</p>
              <p className="text-muted-foreground text-sm mt-1">Responses will appear here as they are submitted</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((r: any) => (
              <Card key={r.id} className="hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate(`/org/${orgId}/respondents/${r.id}`)}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge variant={r.isComplete ? "default" : "outline"} className={r.isComplete ? "bg-green-100 text-green-700 border-green-200 font-medium" : "font-medium"}>
                          {r.isComplete ? "Complete" : "Partial"}
                        </Badge>
                        {r.sentiment && (
                          <Badge variant="outline" className={`capitalize font-medium ${r.sentiment === "promoter" ? "text-green-600 border-green-200" : r.sentiment === "passive" ? "text-yellow-600 border-yellow-200" : "text-red-600 border-red-200"}`}>
                            {r.sentiment}
                          </Badge>
                        )}
                        {r.npsScore !== null && r.npsScore !== undefined && (
                          <span className="text-sm font-medium text-foreground">NPS: <strong className="font-semibold">{r.npsScore}</strong></span>
                        )}
                        {r.csatScore !== null && r.csatScore !== undefined && (
                          <span className="text-sm font-medium text-foreground">CSAT: <strong className="font-semibold">{r.csatScore}/5</strong></span>
                        )}
                        {r.cesScore !== null && r.cesScore !== undefined && (
                          <span className="text-sm font-medium text-foreground">CES: <strong className="font-semibold">{r.cesScore}</strong></span>
                        )}
                      </div>
                      {r.surveyTitle && (
                        <p className="text-sm text-muted-foreground truncate">{r.surveyTitle}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {r.completedAt ? new Date(r.completedAt).toLocaleDateString(undefined, { dateStyle: "medium" }) : r.createdAt ? new Date(r.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
