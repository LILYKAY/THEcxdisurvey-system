import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BarChart2, Users, CheckCircle } from "lucide-react";

export default function AdminSurveyInsights() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const surveyIdNum = parseInt(surveyId ?? "0");
  const [, navigate] = useLocation();

  const { data: survey } = trpc.surveys.get.useQuery({ id: surveyIdNum });
  const { data: responses } = trpc.surveys.getResponses.useQuery({ surveyId: surveyIdNum });

  const total = responses?.length ?? 0;
  const completed = responses?.filter((r: any) => r.isComplete).length ?? 0;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const navItems = [
    { label: "Overview", href: "/admin" },
    { label: "Surveys", href: "/admin/surveys" },
    { label: "Insights", href: `/admin/surveys/${surveyId}/insights`, active: true },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Survey Insights" appName="CXDi Admin">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/surveys")} className="text-gray-500"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
          <h1 className="text-xl font-bold text-gray-900">{survey?.title ?? "Survey Insights"}</h1>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-blue-500" /><span className="text-xs text-gray-500">Total</span></div><p className="text-2xl font-bold">{total}</p></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-xs text-gray-500">Completed</span></div><p className="text-2xl font-bold">{completed}</p></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><BarChart2 className="w-4 h-4 text-purple-500" /><span className="text-xs text-gray-500">Rate</span></div><p className="text-2xl font-bold">{rate}%</p></CardContent></Card>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">Responses</CardTitle></CardHeader>
          <CardContent>
            {!responses?.length ? <div className="text-center text-gray-500 py-6">No responses yet</div> : (
              <div className="space-y-2">
                {responses.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge variant={r.isComplete ? "default" : "outline"} className={r.isComplete ? "bg-green-100 text-green-700 border-green-200" : ""}>{r.isComplete ? "Complete" : "Partial"}</Badge>
                      {r.sentiment && <Badge variant="outline" className={`capitalize text-xs ${r.sentiment === "promoter" ? "text-green-600" : r.sentiment === "passive" ? "text-yellow-600" : "text-red-600"}`}>{r.sentiment}</Badge>}
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
