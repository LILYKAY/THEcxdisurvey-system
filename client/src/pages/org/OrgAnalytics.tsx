import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BarChart2, Users, CheckCircle, TrendingUp } from "lucide-react";

export default function OrgAnalytics() {
  const { orgId, surveyId } = useParams<{ orgId: string; surveyId: string }>();
  const orgIdNum = parseInt(orgId ?? "0");
  const surveyIdNum = parseInt(surveyId ?? "0");
  const [, navigate] = useLocation();

  const { data: survey } = trpc.surveys.get.useQuery({ id: surveyIdNum });
  const { data: responses, isLoading } = trpc.surveys.getResponses.useQuery({ surveyId: surveyIdNum });

  const totalResponses = responses?.length ?? 0;
  const completedResponses = responses?.filter((r: any) => r.isComplete).length ?? 0;
  const completionRate = totalResponses > 0 ? Math.round((completedResponses / totalResponses) * 100) : 0;

  const npsResponses = responses?.filter((r: any) => r.npsScore !== null) ?? [];
  const promoters = npsResponses.filter((r: any) => r.npsScore >= 9).length;
  const passives = npsResponses.filter((r: any) => r.npsScore >= 7 && r.npsScore < 9).length;
  const detractors = npsResponses.filter((r: any) => r.npsScore < 7).length;
  const npsScore = npsResponses.length > 0 ? Math.round(((promoters - detractors) / npsResponses.length) * 100) : null;

  const navItems = [
    { label: "Dashboard", href: `/org/${orgId}` },
    { label: "Surveys", href: `/org/${orgId}/surveys` },
    { label: "Analytics", href: `/org/${orgId}/surveys/${surveyId}/analytics`, active: true },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Analytics">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/org/${orgId}/surveys`)} className="text-gray-500 shrink-0">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{survey?.title ?? "Analytics"}</h1>
            <p className="text-sm text-gray-500">Response analytics and insights</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-500">Total Responses</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalResponses}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-xs text-gray-500">Completed</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{completedResponses}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart2 className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-gray-500">Completion Rate</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-gray-500">NPS Score</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{npsScore !== null ? npsScore : "—"}</p>
            </CardContent>
          </Card>
        </div>

        {npsResponses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">NPS Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-700">{promoters}</p>
                  <p className="text-sm text-green-600">Promoters (9-10)</p>
                  <p className="text-xs text-gray-500">{npsResponses.length > 0 ? Math.round((promoters / npsResponses.length) * 100) : 0}%</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-700">{passives}</p>
                  <p className="text-sm text-yellow-600">Passives (7-8)</p>
                  <p className="text-xs text-gray-500">{npsResponses.length > 0 ? Math.round((passives / npsResponses.length) * 100) : 0}%</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-700">{detractors}</p>
                  <p className="text-sm text-red-600">Detractors (0-6)</p>
                  <p className="text-xs text-gray-500">{npsResponses.length > 0 ? Math.round((detractors / npsResponses.length) * 100) : 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Responses</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center text-gray-500 py-6">Loading responses...</div>
            ) : !responses?.length ? (
              <div className="text-center text-gray-500 py-6">No responses yet.</div>
            ) : (
              <div className="space-y-2">
                {responses.slice(0, 20).map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={r.isComplete ? "default" : "outline"} className={r.isComplete ? "bg-green-100 text-green-700 border-green-200" : ""}>
                        {r.isComplete ? "Complete" : "Partial"}
                      </Badge>
                      {r.sentiment && (
                        <Badge variant="outline" className={`capitalize ${r.sentiment === "promoter" ? "text-green-600" : r.sentiment === "passive" ? "text-yellow-600" : "text-red-600"}`}>
                          {r.sentiment}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
