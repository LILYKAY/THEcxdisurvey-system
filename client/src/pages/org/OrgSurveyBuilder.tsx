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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, ArrowLeft, Send, CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [qOptions, setQOptions] = useState<string[]>(["Option 1", "Option 2"]);
  const [expiryOpen, setExpiryOpen] = useState(false);

  // Thank You screen customisation
  const [editingHeadline, setEditingHeadline] = useState(false);
  const [headlineDraft, setHeadlineDraft] = useState("");
  const [editingClosing, setEditingClosing] = useState(false);
  const [closingDraft, setClosingDraft] = useState("");

  const needsOptions = ["multiple_choice_single", "multiple_choice_multi"].includes(qType);

  const { data: survey } = trpc.surveys.get.useQuery({ id: surveyIdNum });
  const { data: questions, isLoading } = trpc.questions.list.useQuery({ surveyId: surveyIdNum });

  // Derive the current expiry date from the loaded survey
  const currentExpiry = survey?.expiresAt ? new Date(survey.expiresAt) : undefined;

  const setThankYouHeadline = trpc.surveys.setThankYouHeadline.useMutation({
    onSuccess: () => {
      utils.surveys.get.invalidate({ id: surveyIdNum });
      setEditingHeadline(false);
      toast.success("Thank You headline updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const setClosingMessage = trpc.surveys.setClosingMessage.useMutation({
    onSuccess: () => {
      utils.surveys.get.invalidate({ id: surveyIdNum });
      setEditingClosing(false);
      toast.success("Closing message updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const setExpiry = trpc.surveys.setExpiry.useMutation({
    onSuccess: () => {
      utils.surveys.get.invalidate({ id: surveyIdNum });
      setExpiryOpen(false);
      toast.success("Survey expiry date updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSetExpiry = (date: Date | undefined) => {
    setExpiry.mutate({ id: surveyIdNum, expiresAt: date ?? null });
  };

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
    if (needsOptions && qOptions.filter(o => o.trim()).length < 2) {
      toast.error("Please add at least 2 options"); return;
    }
    const key = `q_${Date.now()}`;
    const options = needsOptions
      ? qOptions.filter(o => o.trim()).map((o, i) => ({ value: `opt_${i + 1}`, label: o.trim() }))
      : undefined;
    createQ.mutate({ surveyId: surveyIdNum, organizationId: orgIdNum, questionKey: key, questionText: qText, questionType: qType as any, isRequired: qRequired, sortOrder: (questions?.length ?? 0) + 1, options });
  };

  const resetDialog = () => {
    setQText(""); setQType("open_ended"); setQRequired(true); setQOptions(["Option 1", "Option 2"]);
  };

  const navItems = [
    { label: "Dashboard", href: `/org/${orgId}` },
    { label: "Surveys", href: `/org/${orgId}/surveys` },
    { label: "Builder", href: `/org/${orgId}/surveys/${surveyId}/builder`, active: true },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Survey Builder">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/org/${orgId}/surveys`)} className="text-gray-500 shrink-0">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{survey?.title ?? "Survey Builder"}</h1>
            <p className="text-sm text-gray-500">{questions?.length ?? 0} questions</p>
          </div>
          <Button onClick={() => navigate(`/org/${orgId}/surveys/${surveyId}/send`)} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 gap-2">
            <Send className="w-4 h-4" /><span className="hidden sm:inline">Send Survey</span>
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

        {/* Survey Settings Panel */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Survey Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Expiry date */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Expiry Date</Label>
                <p className="text-xs text-gray-500 mt-0.5">
                  After this date the survey will no longer accept responses.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {currentExpiry && (
                  <span className="text-sm text-gray-600">
                    {currentExpiry.toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </span>
                )}
                <Popover open={expiryOpen} onOpenChange={setExpiryOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "gap-2",
                        currentExpiry && "border-amber-300 text-amber-700 hover:bg-amber-50"
                      )}
                    >
                      <CalendarIcon className="w-4 h-4" />
                      {currentExpiry ? "Change" : "Set expiry"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={currentExpiry}
                      onSelect={(date) => handleSetExpiry(date)}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                    {currentExpiry && (
                      <div className="border-t p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 gap-2"
                          onClick={() => handleSetExpiry(undefined)}
                          disabled={setExpiry.isPending}
                        >
                          <X className="w-4 h-4" />
                          Remove expiry date
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {/* Separator */}
            <div className="border-t border-gray-100" />

            {/* Thank You Headline */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Thank You Headline</Label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    The bold heading shown on the completion screen after submission.
                  </p>
                </div>
                {!editingHeadline && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      setHeadlineDraft((survey as any)?.thankYouHeadline ?? "");
                      setEditingHeadline(true);
                    }}
                  >
                    {(survey as any)?.thankYouHeadline ? "Edit" : "Set headline"}
                  </Button>
                )}
              </div>
              {(survey as any)?.thankYouHeadline && !editingHeadline && (
                <p className="text-sm text-gray-700 italic border-l-2 border-primary pl-3">
                  {(survey as any).thankYouHeadline}
                </p>
              )}
              {editingHeadline && (
                <div className="space-y-2">
                  <Input
                    value={headlineDraft}
                    onChange={(e) => setHeadlineDraft(e.target.value)}
                    placeholder="e.g. Thank you for your time!"
                    maxLength={255}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setThankYouHeadline.mutate({ id: surveyIdNum, thankYouHeadline: headlineDraft.trim() || null })}
                      disabled={setThankYouHeadline.isPending}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {setThankYouHeadline.isPending ? "Saving…" : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingHeadline(false)}>Cancel</Button>
                    {(survey as any)?.thankYouHeadline && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 ml-auto"
                        onClick={() => setThankYouHeadline.mutate({ id: surveyIdNum, thankYouHeadline: null })}
                        disabled={setThankYouHeadline.isPending}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="border-t border-gray-100" />

            {/* Closing Message */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Closing Message</Label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    The body text shown beneath the headline on the completion screen.
                  </p>
                </div>
                {!editingClosing && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      setClosingDraft((survey as any)?.closingMessage ?? "");
                      setEditingClosing(true);
                    }}
                  >
                    {(survey as any)?.closingMessage ? "Edit" : "Set message"}
                  </Button>
                )}
              </div>
              {(survey as any)?.closingMessage && !editingClosing && (
                <p className="text-sm text-gray-700 italic border-l-2 border-primary pl-3 whitespace-pre-wrap">
                  {(survey as any).closingMessage}
                </p>
              )}
              {editingClosing && (
                <div className="space-y-2">
                  <Textarea
                    value={closingDraft}
                    onChange={(e) => setClosingDraft(e.target.value)}
                    placeholder="e.g. We are deeply grateful — and we are just getting started."
                    rows={4}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setClosingMessage.mutate({ id: surveyIdNum, closingMessage: closingDraft.trim() || null })}
                      disabled={setClosingMessage.isPending}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {setClosingMessage.isPending ? "Saving…" : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingClosing(false)}>Cancel</Button>
                    {(survey as any)?.closingMessage && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 ml-auto"
                        onClick={() => setClosingMessage.mutate({ id: surveyIdNum, closingMessage: null })}
                        disabled={setClosingMessage.isPending}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={showAdd} onOpenChange={(open) => { setShowAdd(open); if (!open) resetDialog(); }}>
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
              {needsOptions && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Answer Options</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 text-xs gap-1 h-auto py-1"
                      onClick={() => setQOptions([...qOptions, ""])}
                    >
                      <Plus className="w-3 h-3" /> Add option
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {qOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          value={opt}
                          onChange={(e) => {
                            const updated = [...qOptions];
                            updated[idx] = e.target.value;
                            setQOptions(updated);
                          }}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1"
                        />
                        {qOptions.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 h-9 w-9 p-0 shrink-0"
                            onClick={() => setQOptions(qOptions.filter((_, i) => i !== idx))}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
