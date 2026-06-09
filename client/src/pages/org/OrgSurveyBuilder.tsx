import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, ArrowLeft, Send } from "lucide-react";

const QUESTION_TYPES = [
  { value: "nps", label: "NPS (0-10 Scale)" },
  { value: "csat", label: "CSAT (1-5 Stars)" },
  { value: "ces_5", label: "CES (1-5 Scale)" },
  { value: "ces_7", label: "CES (1-7 Scale)" },
  { value: "open_ended", label: "Open Ended Text" },
  { value: "multiple_choice_single", label: "Multiple Choice (Single)" },
  { value: "multiple_choice_multi", label: "Multiple Choice (Multi)" },
  { value: "yes_no", label: "Yes / No" },
  { value: "range_0_10", label: "Range (0-10)" },
  { value: "number_input", label: "Number Input" },
  { value: "year", label: "Year" },
  { value: "date", label: "Date" },
  { value: "consent", label: "Consent" },
  { value: "nps_comment", label: "NPS Comment" },
  { value: "end_message", label: "End Message" },
];

export default function OrgSurveyBuilder() {
  const { orgId, surveyId } = useParams<{ orgId: string; surveyId: string }>();
  const orgIdNum = parseInt(orgId ?? "0");
  const surveyIdNum = parseInt(surveyId ?? "0");
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [showAdd, setShowAdd] = useState(false);
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState("open_ended");
  const [qRequired, setQRequired] = useState(true);

  const { data: survey } = trpc.surveys.get.useQuery({ id: surveyIdNum });
  const { data: questions, isLoading } = trpc.questions.list.useQuery({ surveyId: surveyIdNum });

  const createQ = trpc.questions.create.useMutation({
    onSuccess: () => {
      utils.questions.list.invalidate({ surveyId: surveyIdNum });
      setShowAdd(false);
      setQText(""); setQType("open_ended");
      toast.success("Question added");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteQ = trpc.questions.delete.useMutation({
    onSuccess: () => { utils.questions.list.invalidate({ surveyId: surveyIdNum }); toast.success("Question deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const handleAddQuestion = () => {
    if (!qText.trim()) { toast.error("Question text is required"); return; }
    const key = `q_${Date.now()}`;
    createQ.mutate({ surveyId: surveyIdNum, organizationId: orgIdNum, questionKey: key, questionText: qText, questionType: qType as any, isRequired: qRequired, sortOrder: (questions?.length ?? 0) + 1 });
  };

  const navItems = [
    { label: "Dashboard", href: `/org/${orgId}` },
    { label: "Surveys", href: `/org/${orgId}/surveys` },
    { label: "Builder", href: `/org/${orgId}/surveys/${surveyId}/builder`, active: true },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Survey Builder">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/org/${orgId}/surveys`)} className="text-gray-500">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{survey?.title ?? "Survey Builder"}</h1>
            <p className="text-sm text-gray-500">{questions?.length ?? 0} questions</p>
          </div>
          <Button onClick={() => navigate(`/org/${orgId}/surveys/${surveyId}/send`)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Send className="w-4 h-4 mr-2" /> Send Survey
          </Button>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center text-gray-500 py-8">Loading questions...</div>
          ) : !questions?.length ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No questions yet. Add your first question below.
              </CardContent>
            </Card>
          ) : (
            questions.map((q, idx) => (
              <Card key={q.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <GripVertical className="w-5 h-5 text-gray-300 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-400">Q{idx + 1}</span>
                        <Badge variant="outline" className="text-xs capitalize">{q.questionType.replace(/_/g, " ")}</Badge>
                        {q.isRequired && <Badge className="text-xs bg-blue-50 text-blue-700 border-blue-200">Required</Badge>}
                      </div>
                      <p className="text-sm font-medium text-gray-900">{q.questionText}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteQ.mutate({ id: q.id, organizationId: orgIdNum })} className="text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full border-dashed border-2 border-gray-300 hover:border-blue-400 hover:text-blue-600 h-12">
              <Plus className="w-4 h-4 mr-2" /> Add Question
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Question</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Question Type</Label>
                <Select value={qType} onValueChange={setQType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Question Text</Label>
                <Textarea value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Enter your question..." rows={3} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="required" checked={qRequired} onChange={(e) => setQRequired(e.target.checked)} className="rounded" />
                <Label htmlFor="required">Required</Label>
              </div>
              <Button onClick={handleAddQuestion} disabled={!qText || createQ.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                {createQ.isPending ? "Adding..." : "Add Question"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
