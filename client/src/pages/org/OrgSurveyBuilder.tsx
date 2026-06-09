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
import { Plus, Trash2, GripVertical, ArrowLeft, Send, CalendarIcon, X, Pencil } from "lucide-react";
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

const NEEDS_OPTIONS = ["multiple_choice_single", "multiple_choice_multi"];

/** Parse stored options (array or JSON string) into string labels */
function parseOptions(raw: unknown): string[] {
  if (!raw) return ["Option 1", "Option 2"];
  const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!Array.isArray(arr) || arr.length === 0) return ["Option 1", "Option 2"];
  return arr.map((o: any) => (typeof o === "object" && o.label ? o.label : String(o)));
}

/** Shared options editor used in both Add and Edit dialogs */
function OptionsEditor({
  options,
  onChange,
}: {
  options: string[];
  onChange: (opts: string[]) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label>Answer Options</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-700 text-xs gap-1 h-auto py-1"
          onClick={() => onChange([...options, ""])}
        >
          <Plus className="w-3 h-3" /> Add option
        </Button>
      </div>
      <div className="space-y-2">
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input
              value={opt}
              onChange={(e) => {
                const updated = [...options];
                updated[idx] = e.target.value;
                onChange(updated);
              }}
              placeholder={`Option ${idx + 1}`}
              className="flex-1"
            />
            {options.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-600 hover:bg-red-50 h-9 w-9 p-0 shrink-0"
                onClick={() => onChange(options.filter((_, i) => i !== idx))}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrgSurveyBuilder() {
  const { orgId, surveyId } = useParams<{ orgId: string; surveyId: string }>();
  const orgIdNum = parseInt(orgId ?? "0");
  const surveyIdNum = parseInt(surveyId ?? "0");
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // ── Add dialog state ──────────────────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false);
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState("open_ended");
  const [qRequired, setQRequired] = useState(true);
  const [qOptions, setQOptions] = useState<string[]>(["Option 1", "Option 2"]);

  // ── Edit dialog state ─────────────────────────────────────────────────────
  const [editId, setEditId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editType, setEditType] = useState("open_ended");
  const [editRequired, setEditRequired] = useState(true);
  const [editOptions, setEditOptions] = useState<string[]>(["Option 1", "Option 2"]);

  // ── Expiry state ──────────────────────────────────────────────────────────
  const [expiryOpen, setExpiryOpen] = useState(false);

  const needsOptionsAdd = NEEDS_OPTIONS.includes(qType);
  const needsOptionsEdit = NEEDS_OPTIONS.includes(editType);

  const { data: survey } = trpc.surveys.get.useQuery({ id: surveyIdNum });
  const { data: questions, isLoading } = trpc.questions.list.useQuery({ surveyId: surveyIdNum });

  const currentExpiry = survey?.expiresAt ? new Date(survey.expiresAt) : undefined;

  const setExpiry = trpc.surveys.setExpiry.useMutation({
    onSuccess: () => {
      utils.surveys.get.invalidate({ id: surveyIdNum });
      setExpiryOpen(false);
      toast.success("Survey expiry date updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const createQ = trpc.questions.create.useMutation({
    onSuccess: () => {
      utils.questions.list.invalidate({ surveyId: surveyIdNum });
      setShowAdd(false);
      resetAdd();
      toast.success("Question added");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateQ = trpc.questions.update.useMutation({
    onMutate: async (vars) => {
      await utils.questions.list.cancel({ surveyId: surveyIdNum });
      const prev = utils.questions.list.getData({ surveyId: surveyIdNum });
      utils.questions.list.setData({ surveyId: surveyIdNum }, (old) =>
        old?.map((q) =>
          q.id === vars.id
            ? {
                ...q,
                questionText: vars.questionText ?? q.questionText,
                questionType: (vars.questionType ?? q.questionType) as any,
                isRequired: vars.isRequired ?? q.isRequired,
                options: vars.options !== undefined ? vars.options : q.options,
              }
            : q
        )
      );
      return { prev };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev) utils.questions.list.setData({ surveyId: surveyIdNum }, ctx.prev);
      toast.error(_e.message);
    },
    onSettled: () => {
      utils.questions.list.invalidate({ surveyId: surveyIdNum });
    },
    onSuccess: () => {
      setEditId(null);
      toast.success("Question updated");
    },
  });

  const deleteQ = trpc.questions.delete.useMutation({
    onSuccess: () => {
      utils.questions.list.invalidate({ surveyId: surveyIdNum });
      toast.success("Question deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const resetAdd = () => {
    setQText(""); setQType("open_ended"); setQRequired(true); setQOptions(["Option 1", "Option 2"]);
  };

  const openEdit = (q: any) => {
    setEditId(q.id);
    setEditText(q.questionText);
    setEditType(q.questionType);
    setEditRequired(q.isRequired ?? true);
    setEditOptions(parseOptions(q.options));
  };

  const handleAddQuestion = () => {
    if (!qText.trim()) { toast.error("Question text is required"); return; }
    if (needsOptionsAdd && qOptions.filter(o => o.trim()).length < 2) {
      toast.error("Please add at least 2 options"); return;
    }
    const key = `q_${Date.now()}`;
    const options = needsOptionsAdd
      ? qOptions.filter(o => o.trim()).map((o, i) => ({ value: `opt_${i + 1}`, label: o.trim() }))
      : undefined;
    createQ.mutate({
      surveyId: surveyIdNum,
      organizationId: orgIdNum,
      questionKey: key,
      questionText: qText,
      questionType: qType as any,
      isRequired: qRequired,
      sortOrder: (questions?.length ?? 0) + 1,
      options,
    });
  };

  const handleUpdateQuestion = () => {
    if (!editText.trim()) { toast.error("Question text is required"); return; }
    if (needsOptionsEdit && editOptions.filter(o => o.trim()).length < 2) {
      toast.error("Please add at least 2 options"); return;
    }
    const options = needsOptionsEdit
      ? editOptions.filter(o => o.trim()).map((o, i) => ({ value: `opt_${i + 1}`, label: o.trim() }))
      : null;
    updateQ.mutate({
      id: editId!,
      organizationId: orgIdNum,
      questionText: editText,
      questionType: editType,
      isRequired: editRequired,
      options,
    });
  };

  const navItems = [
    { label: "Dashboard", href: `/org/${orgId}` },
    { label: "Surveys", href: `/org/${orgId}/surveys` },
    { label: "Builder", href: `/org/${orgId}/surveys/${surveyId}/builder`, active: true },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Survey Builder">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
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

        {/* Question list */}
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
                      {/* Show existing options as a preview */}
                      {NEEDS_OPTIONS.includes(q.questionType) && (() => {
                        const opts = parseOptions(q.options);
                        return opts.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {opts.map((o, i) => (
                              <span key={i} className="inline-block text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">{o}</span>
                            ))}
                          </div>
                        ) : null;
                      })()}
                    </div>
                    {/* Edit button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(q)}
                      className="text-blue-400 hover:text-blue-600 hover:bg-blue-50 shrink-0"
                      aria-label="Edit question"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteQ.mutate({ id: q.id, organizationId: orgIdNum })}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                      aria-label="Delete question"
                    >
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
                      className={cn("gap-2", currentExpiry && "border-amber-300 text-amber-700 hover:bg-amber-50")}
                    >
                      <CalendarIcon className="w-4 h-4" />
                      {currentExpiry ? "Change" : "Set expiry"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={currentExpiry}
                      onSelect={(date) => setExpiry.mutate({ id: surveyIdNum, expiresAt: date ?? null })}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                    {currentExpiry && (
                      <div className="border-t p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 gap-2"
                          onClick={() => setExpiry.mutate({ id: surveyIdNum, expiresAt: null })}
                          disabled={setExpiry.isPending}
                        >
                          <X className="w-4 h-4" /> Remove expiry date
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Add Question dialog ───────────────────────────────────────────── */}
        <Dialog open={showAdd} onOpenChange={(open) => { setShowAdd(open); if (!open) resetAdd(); }}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full border-dashed border-2 border-gray-300 hover:border-blue-400 hover:text-blue-600 h-12">
              <Plus className="w-4 h-4 mr-2" /> Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Question</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Question Type</Label>
                <Select value={qType} onValueChange={(v) => { setQType(v); setQOptions(["Option 1", "Option 2"]); }}>
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
              {needsOptionsAdd && (
                <OptionsEditor options={qOptions} onChange={setQOptions} />
              )}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="required-add" checked={qRequired} onChange={(e) => setQRequired(e.target.checked)} className="rounded" />
                <Label htmlFor="required-add">Required</Label>
              </div>
              <Button onClick={handleAddQuestion} disabled={!qText || createQ.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                {createQ.isPending ? "Adding..." : "Add Question"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Edit Question dialog ──────────────────────────────────────────── */}
        <Dialog open={editId !== null} onOpenChange={(open) => { if (!open) setEditId(null); }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Question</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Question Type</Label>
                <Select
                  value={editType}
                  onValueChange={(v) => {
                    setEditType(v);
                    if (NEEDS_OPTIONS.includes(v) && editOptions.length < 2) {
                      setEditOptions(["Option 1", "Option 2"]);
                    }
                  }}
                >
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
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="Enter your question..."
                  rows={3}
                />
              </div>
              {needsOptionsEdit && (
                <OptionsEditor options={editOptions} onChange={setEditOptions} />
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="required-edit"
                  checked={editRequired}
                  onChange={(e) => setEditRequired(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="required-edit">Required</Label>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditId(null)}
                  disabled={updateQ.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateQuestion}
                  disabled={!editText || updateQ.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {updateQ.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
