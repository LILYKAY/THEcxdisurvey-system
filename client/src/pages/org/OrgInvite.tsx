import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, Plus, X, Send, Users, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface Recipient {
  id: string;
  email: string;
  name: string;
}

const FORM_DESCRIPTIONS: Record<string, { label: string; color: string; description: string }> = {
  current_customers: {
    label: "Current Customers",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    description: "For active clients currently using your services",
  },
  dropped_customers: {
    label: "Dropped / Lapsed Customers",
    color: "bg-rose-100 text-rose-800 border-rose-200",
    description: "For clients who have stopped using your services",
  },
  repeat_trial: {
    label: "Repeat Trial Firms",
    color: "bg-violet-100 text-violet-800 border-violet-200",
    description: "For firms that have trialled your services multiple times",
  },
  single_trial: {
    label: "Single Trial Firms",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    description: "For firms that have trialled your services only once",
  },
};

export default function OrgInvite() {
  const { orgId } = useParams<{ orgId: string }>();
  const organizationId = parseInt(orgId ?? "0");

  const [selectedSurveyId, setSelectedSurveyId] = useState<string>("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [sendResults, setSendResults] = useState<{ sent: number; failed: number } | null>(null);

  const surveysQuery = trpc.surveys.listByOrg.useQuery({ organizationId });
  const sendMutation = trpc.org.sendInvitations.useMutation({
    onSuccess: (data) => {
      setSendResults({ sent: data.sent, failed: data.failed });
      if (data.sent > 0) {
        toast.success(`${data.sent} invitation${data.sent !== 1 ? "s" : ""} sent successfully`);
      }
      if (data.failed > 0) {
        toast.error(`${data.failed} invitation${data.failed !== 1 ? "s" : ""} failed to send`);
      }
      setRecipients([]);
      setPersonalMessage("");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const surveys = surveysQuery.data ?? [];
  const selectedSurvey = surveys.find((s) => s.id === parseInt(selectedSurveyId));
  const formMeta = selectedSurvey ? FORM_DESCRIPTIONS[selectedSurvey.formKey] : null;

  function addRecipient() {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (recipients.some((r) => r.email === email)) {
      toast.error("This email is already in the list");
      return;
    }
    setRecipients((prev) => [
      ...prev,
      { id: crypto.randomUUID(), email, name: nameInput.trim() },
    ]);
    setEmailInput("");
    setNameInput("");
  }

  function removeRecipient(id: string) {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  }

  function parseBulkEmails() {
    const lines = bulkInput
      .split(/[\n,;]+/)
      .map((l) => l.trim())
      .filter(Boolean);
    let added = 0;
    let skipped = 0;
    for (const line of lines) {
      // Support "Name <email>" or just "email"
      const match = line.match(/^(?:(.+?)\s*<(.+?)>|(.+))$/);
      const name = match?.[1]?.trim() ?? "";
      const email = (match?.[2] ?? match?.[3] ?? "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { skipped++; continue; }
      if (recipients.some((r) => r.email === email)) { skipped++; continue; }
      setRecipients((prev) => [...prev, { id: crypto.randomUUID(), email, name }]);
      added++;
    }
    setBulkInput("");
    setShowBulk(false);
    if (added > 0) toast.success(`Added ${added} recipient${added !== 1 ? "s" : ""}`);
    if (skipped > 0) toast.warning(`Skipped ${skipped} invalid or duplicate entries`);
  }

  function handleSend() {
    if (!selectedSurveyId) { toast.error("Please select a survey form"); return; }
    if (recipients.length === 0) { toast.error("Please add at least one recipient"); return; }
    setSendResults(null);
    sendMutation.mutate({
      organizationId,
      surveyId: parseInt(selectedSurveyId),
      recipients: recipients.map((r) => ({ email: r.email, name: r.name || undefined })),
      personalMessage: personalMessage.trim() || undefined,
    });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Invite Customers</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Select a survey category and send personalised invitations directly to customer inboxes.
        </p>
      </div>

      {/* Success banner */}
      {sendResults && (
        <div className={`rounded-xl border p-4 flex items-start gap-3 ${sendResults.failed === 0 ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
          {sendResults.failed === 0 ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          )}
          <div>
            <p className="font-semibold text-sm">
              {sendResults.sent} invitation{sendResults.sent !== 1 ? "s" : ""} sent
              {sendResults.failed > 0 && `, ${sendResults.failed} failed`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Responses will appear in your dashboard as customers complete the survey.
            </p>
          </div>
        </div>
      )}

      {/* Step 1: Select survey */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
            <CardTitle className="text-base">Select Survey Category</CardTitle>
          </div>
          <CardDescription className="text-sm">
            Choose which survey form matches this group of customers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {surveysQuery.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading surveys…
            </div>
          ) : (
            <Select value={selectedSurveyId} onValueChange={setSelectedSurveyId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a survey form…" />
              </SelectTrigger>
              <SelectContent>
                {surveys.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {formMeta && (
            <div className={`rounded-lg border px-3 py-2 text-xs font-medium ${formMeta.color}`}>
              <span className="font-semibold">{formMeta.label}</span>
              <span className="mx-2">·</span>
              {formMeta.description}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Add recipients */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
              <CardTitle className="text-base">Add Recipients</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => setShowBulk((v) => !v)}
            >
              {showBulk ? "Single entry" : "Bulk paste"}
            </Button>
          </div>
          <CardDescription className="text-sm">
            Enter customer email addresses. You can add a name for a personalised greeting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {showBulk ? (
            <div className="space-y-2">
              <Textarea
                placeholder={`Paste emails, one per line or comma-separated.\nAlso supports: Name <email@example.com>`}
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                rows={5}
                className="text-sm font-mono"
              />
              <Button size="sm" onClick={parseBulkEmails} disabled={!bulkInput.trim()}>
                Add All
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Name (optional)"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="sm:w-40 shrink-0"
              />
              <Input
                placeholder="email@example.com"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRecipient()}
                className="flex-1"
              />
              <Button size="sm" onClick={addRecipient} className="shrink-0">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          )}

          {/* Recipient list */}
          {recipients.length > 0 && (
            <div className="space-y-1.5 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-1">
                <Users className="h-3.5 w-3.5" />
                {recipients.length} recipient{recipients.length !== 1 ? "s" : ""}
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {recipients.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate text-foreground">{r.email}</span>
                      {r.name && (
                        <Badge variant="secondary" className="text-xs shrink-0">{r.name}</Badge>
                      )}
                    </div>
                    <button
                      onClick={() => removeRecipient(r.id)}
                      className="ml-2 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Personal message */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
            <CardTitle className="text-base">Personal Message <span className="text-muted-foreground font-normal text-sm">(optional)</span></CardTitle>
          </div>
          <CardDescription className="text-sm">
            Add a note that will appear in the invitation email above the survey link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="e.g. We value your feedback and would appreciate 5 minutes of your time to help us improve our services…"
            value={personalMessage}
            onChange={(e) => setPersonalMessage(e.target.value)}
            rows={3}
            className="text-sm"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">{personalMessage.length}/500</p>
        </CardContent>
      </Card>

      {/* Send button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 pb-6">
        <div className="text-sm text-muted-foreground">
          {recipients.length > 0 && selectedSurvey ? (
            <span className="flex items-center gap-1.5">
              <ChevronRight className="h-4 w-4 text-primary" />
              Ready to send <strong>{recipients.length}</strong> invitation{recipients.length !== 1 ? "s" : ""} for <strong>{selectedSurvey.title}</strong>
            </span>
          ) : (
            "Complete the steps above to send invitations."
          )}
        </div>
        <Button
          size="lg"
          className="w-full sm:w-auto"
          onClick={handleSend}
          disabled={sendMutation.isPending || !selectedSurveyId || recipients.length === 0}
        >
          {sendMutation.isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…</>
          ) : (
            <><Send className="h-4 w-4 mr-2" /> Send Invitations</>
          )}
        </Button>
      </div>
    </div>
  );
}
