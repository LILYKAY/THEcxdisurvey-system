import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { DashboardShell, getOrgNav } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Plus, Trash2, GripVertical, ChevronDown, ChevronUp,
  HelpCircle, List, CheckSquare, Circle, AlignLeft, Settings2
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

type QuestionType = "open_ended" | "multiple_choice" | "single_choice" | "checkboxes";

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  open_ended: "Open-ended",
  multiple_choice: "Multiple Choice",
  single_choice: "Single Choice",
  checkboxes: "Checkboxes",
};

const QUESTION_TYPE_ICONS: Record<QuestionType, React.ReactNode> = {
  open_ended: <AlignLeft className="h-4 w-4" />,
  multiple_choice: <List className="h-4 w-4" />,
  single_choice: <Circle className="h-4 w-4" />,
  checkboxes: <CheckSquare className="h-4 w-4" />,
};

interface OptionItem { value: string; label: string; }

export default function OrgCustomQuestions() {
  const [, params] = useRoute("/org/:orgId/surveys/:surveyId/questions");
  const orgId = Number(params?.orgId);
  const surveyId = Number(params?.surveyId);
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: org } = trpc.organizations.get.useQuery({ id: orgId }, { enabled: !!orgId });
  const { data: survey } = trpc.surveys.get.useQuery({ id: surveyId }, { enabled: !!surveyId });
  const { data: questions, isLoading } = trpc.org.customQuestions.useQuery(
    { surveyId, organizationId: orgId },
    { enabled: !!surveyId && !!orgId }
  );

  const addQuestion = trpc.org.addCustomQuestion.useMutation({
    onSuccess: () => {
      utils.org.customQuestions.invalidate();
      toast.success("Question added");
      setShowAddForm(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateQuestion = trpc.org.updateCustomQuestion.useMutation({
    onSuccess: () => {
      utils.org.customQuestions.invalidate();
      toast.success("Question updated");
      setEditingId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteQuestion = trpc.org.deleteCustomQuestion.useMutation({
    onSuccess: () => {
      utils.org.customQuestions.invalidate();
      toast.success("Question deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // New question form state
  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState<QuestionType>("open_ended");
  const [newRequired, setNewRequired] = useState(false);
  const [newOptions, setNewOptions] = useState<OptionItem[]>([{ value: "", label: "" }]);

  // Edit form state
  const [editText, setEditText] = useState("");
  const [editType, setEditType] = useState<QuestionType>("open_ended");
  const [editRequired, setEditRequired] = useState(false);
  const [editOptions, setEditOptions] = useState<OptionItem[]>([]);

  function resetForm() {
    setNewText("");
    setNewType("open_ended");
    setNewRequired(false);
    setNewOptions([{ value: "", label: "" }]);
  }

  function startEdit(q: NonNullable<typeof questions>[0]) {
    setEditingId(q.id);
    setEditText(q.questionText);
    setEditType(q.questionType as QuestionType);
    setEditRequired(q.isRequired);
    const opts = Array.isArray(q.options) ? (q.options as OptionItem[]) : [];
    setEditOptions(opts.length > 0 ? opts : [{ value: "", label: "" }]);
  }

  function needsOptions(type: QuestionType) {
    return type !== "open_ended";
  }

  function handleAddOption(setter: React.Dispatch<React.SetStateAction<OptionItem[]>>) {
    setter((prev) => [...prev, { value: "", label: "" }]);
  }

  function handleRemoveOption(setter: React.Dispatch<React.SetStateAction<OptionItem[]>>, idx: number) {
    setter((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleOptionChange(
    setter: React.Dispatch<React.SetStateAction<OptionItem[]>>,
    idx: number,
    field: "value" | "label",
    val: string
  ) {
    setter((prev) => prev.map((o, i) => (i === idx ? { ...o, [field]: val } : o)));
  }

  function handleSubmitNew() {
    if (!newText.trim()) return toast.error("Question text is required");
    const opts = needsOptions(newType)
      ? newOptions.filter((o) => o.label.trim())
      : undefined;
    addQuestion.mutate({
      organizationId: orgId,
      surveyId,
      questionText: newText.trim(),
      questionType: newType,
      isRequired: newRequired,
      options: opts,
      sortOrder: (questions?.length ?? 0) + 1,
    });
  }

  function handleSubmitEdit() {
    if (!editingId) return;
    if (!editText.trim()) return toast.error("Question text is required");
    const opts = needsOptions(editType)
      ? editOptions.filter((o) => o.label.trim())
      : undefined;
    updateQuestion.mutate({
      id: editingId,
      organizationId: orgId,
      questionText: editText.trim(),
      questionType: editType,
      isRequired: editRequired,
      options: opts,
    });
  }

  if (!user) return null;

  return (
    <DashboardShell navItems={getOrgNav(orgId)} title={org?.name ?? "Organization"}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <span>{org?.name}</span>
              <span>/</span>
              <span>{survey?.title}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Settings2 className="h-6 w-6 text-primary" />
              Custom Questions
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Add custom questions that appear after the standard form questions for this survey.
            </p>
          </div>
          <Button onClick={() => { setShowAddForm(true); setEditingId(null); }} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Add Question
          </Button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <Card className="border-primary/30 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                New Custom Question
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Question Text <span className="text-destructive">*</span></Label>
                <Textarea
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Enter your question here..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <Select value={newType} onValueChange={(v) => setNewType(v as QuestionType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => (
                        <SelectItem key={t} value={t}>
                          <span className="flex items-center gap-2">
                            {QUESTION_TYPE_ICONS[t]}
                            {QUESTION_TYPE_LABELS[t]}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch checked={newRequired} onCheckedChange={setNewRequired} id="new-required" />
                  <Label htmlFor="new-required" className="cursor-pointer">Required</Label>
                </div>
              </div>

              {needsOptions(newType) && (
                <div className="space-y-2">
                  <Label>Answer Options</Label>
                  <div className="space-y-2">
                    {newOptions.map((opt, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input
                          placeholder={`Option ${idx + 1}`}
                          value={opt.label}
                          onChange={(e) => {
                            const v = e.target.value;
                            handleOptionChange(setNewOptions, idx, "label", v);
                            handleOptionChange(setNewOptions, idx, "value", v.toLowerCase().replace(/\s+/g, "_"));
                          }}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOption(setNewOptions, idx)}
                          disabled={newOptions.length <= 1}
                          className="text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => handleAddOption(setNewOptions)} className="gap-1">
                      <Plus className="h-3 w-3" /> Add Option
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSubmitNew} disabled={addQuestion.isPending} className="gap-2">
                  {addQuestion.isPending ? "Saving..." : "Save Question"}
                </Button>
                <Button variant="outline" onClick={() => { setShowAddForm(false); resetForm(); }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : !questions || questions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <HelpCircle className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-1">No custom questions yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Add custom questions to appear after the standard survey questions.
              </p>
              <Button onClick={() => setShowAddForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add First Question
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <Card key={q.id} className={editingId === q.id ? "border-primary/40 shadow-md" : ""}>
                <CardContent className="p-4">
                  {editingId === q.id ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Question Text</Label>
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Question Type</Label>
                          <Select value={editType} onValueChange={(v) => setEditType(v as QuestionType)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => (
                                <SelectItem key={t} value={t}>
                                  <span className="flex items-center gap-2">
                                    {QUESTION_TYPE_ICONS[t]}
                                    {QUESTION_TYPE_LABELS[t]}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                          <Switch checked={editRequired} onCheckedChange={setEditRequired} id={`edit-req-${q.id}`} />
                          <Label htmlFor={`edit-req-${q.id}`} className="cursor-pointer">Required</Label>
                        </div>
                      </div>
                      {needsOptions(editType) && (
                        <div className="space-y-2">
                          <Label>Answer Options</Label>
                          <div className="space-y-2">
                            {editOptions.map((opt, oidx) => (
                              <div key={oidx} className="flex gap-2 items-center">
                                <Input
                                  placeholder={`Option ${oidx + 1}`}
                                  value={opt.label}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    handleOptionChange(setEditOptions, oidx, "label", v);
                                    handleOptionChange(setEditOptions, oidx, "value", v.toLowerCase().replace(/\s+/g, "_"));
                                  }}
                                  className="flex-1"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveOption(setEditOptions, oidx)}
                                  disabled={editOptions.length <= 1}
                                  className="text-muted-foreground hover:text-destructive shrink-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => handleAddOption(setEditOptions)} className="gap-1">
                              <Plus className="h-3 w-3" /> Add Option
                            </Button>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button onClick={handleSubmitEdit} disabled={updateQuestion.isPending} size="sm">
                          {updateQuestion.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="text-muted-foreground mt-0.5 shrink-0">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground">Q{idx + 1}</span>
                          <Badge variant="secondary" className="gap-1 text-xs">
                            {QUESTION_TYPE_ICONS[q.questionType as QuestionType]}
                            {QUESTION_TYPE_LABELS[q.questionType as QuestionType]}
                          </Badge>
                          {q.isRequired && <Badge variant="outline" className="text-xs text-destructive border-destructive/40">Required</Badge>}
                        </div>
                        <p className="text-sm font-medium leading-snug">{q.questionText}</p>
                        {Array.isArray(q.options) && (q.options as OptionItem[]).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(q.options as OptionItem[]).map((o, oi) => (
                              <span key={oi} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{o.label}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(q)} className="text-muted-foreground hover:text-foreground">
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteQuestion.mutate({ id: q.id, organizationId: orgId })}
                          disabled={deleteQuestion.isPending}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
