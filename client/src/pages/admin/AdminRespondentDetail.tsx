import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AdminRespondentDetail() {
  const { respondentId } = useParams<{ respondentId: string }>();
  const respondentIdNum = parseInt(respondentId ?? "0");
  const [, navigate] = useLocation();

  const { data: answers, isLoading } = trpc.respondents.getAnswers.useQuery({ responseId: respondentIdNum });

  const navItems = [
    { label: "Overview", href: "/admin" },
    { label: "Surveys", href: "/admin/surveys" },
    { label: "Detail", href: `/admin/respondents/${respondentId}`, active: true },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Response Detail" appName="CXDi Admin">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/surveys")} className="text-gray-500"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
          <h1 className="text-xl font-bold text-gray-900">Response Detail</h1>
        </div>
        {isLoading ? <div className="text-center text-gray-500 py-8">Loading...</div> : !answers ? (
          <div className="text-center text-gray-500 py-8">Not found</div>
        ) : (
          <Card>
            <CardHeader><CardTitle className="text-base">Survey Answers</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {Array.isArray(answers) && answers.map((a: any, i: number) => (
                <div key={i} className="border-b pb-3 last:border-0">
                  <p className="text-xs text-gray-500 mb-1">{a.questionKey ?? `Q${i + 1}`}</p>
                  <p className="text-sm text-gray-900">{String(a.value ?? "—")}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
