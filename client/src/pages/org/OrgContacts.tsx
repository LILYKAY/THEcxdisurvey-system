import { useRef, useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Plus, Trash2, Upload, Users, X } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}
function isPhone(s: string) {
  return /^\+?[\d\s\-().]{7,20}$/.test(s.trim());
}

interface ParsedContact {
  name?: string;
  email?: string;
  phone?: string;
  preferredChannel: "email" | "whatsapp" | "sms";
  _valid: boolean;
  _raw: string;
}

/**
 * Parse a plain-text list (one entry per line) or a CSV blob.
 * Supports:
 *   - email only:          "alice@example.com"
 *   - phone only:          "+254712345678"
 *   - name, email:         "Alice, alice@example.com"
 *   - name, email, phone:  "Alice, alice@example.com, +254712345678"
 *   - CSV with header row: name,email,phone
 */
function parseContactText(raw: string, defaultChannel: "email" | "whatsapp" | "sms"): ParsedContact[] {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const results: ParsedContact[] = [];

  for (const line of lines) {
    // Skip obvious CSV header rows
    if (/^(name|email|phone|contact)/i.test(line) && !isEmail(line) && !isPhone(line)) continue;

    const parts = line.split(/,|\t/).map((p) => p.trim());
    let name: string | undefined;
    let email: string | undefined;
    let phone: string | undefined;

    for (const part of parts) {
      if (!part) continue;
      if (isEmail(part)) { email = part; }
      else if (isPhone(part)) { phone = part; }
      else if (!name) { name = part; }
    }

    const valid = !!(email || phone);
    const channel: "email" | "whatsapp" | "sms" = email ? "email" : defaultChannel;

    results.push({ name, email, phone, preferredChannel: channel, _valid: valid, _raw: line });
  }

  return results;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrgContacts() {
  const { orgId } = useParams<{ orgId: string }>();
  const orgIdNum = parseInt(orgId ?? "0");
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single add state
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newChannel, setNewChannel] = useState<"email" | "whatsapp" | "sms">("email");

  // Bulk import state
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkChannel, setBulkChannel] = useState<"email" | "whatsapp" | "sms">("email");
  const [preview, setPreview] = useState<ParsedContact[] | null>(null);
  const [importStep, setImportStep] = useState<"input" | "preview" | "done">("input");
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);

  const { data: contacts, isLoading } = trpc.contacts.list.useQuery({ organizationId: orgIdNum });

  const createContact = trpc.contacts.create.useMutation({
    onSuccess: () => {
      utils.contacts.list.invalidate({ organizationId: orgIdNum });
      setShowAdd(false);
      setNewName(""); setNewEmail(""); setNewPhone("");
      toast.success("Contact added");
    },
    onError: (e) => toast.error(e.message),
  });

  const bulkImport = trpc.contacts.bulkImport.useMutation({
    onSuccess: (res) => {
      utils.contacts.list.invalidate({ organizationId: orgIdNum });
      setImportResult(res);
      setImportStep("done");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteContact = trpc.contacts.delete.useMutation({
    onSuccess: () => {
      utils.contacts.list.invalidate({ organizationId: orgIdNum });
      toast.success("Contact deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleAdd = () => {
    if (!newEmail && !newPhone) { toast.error("Email or phone is required"); return; }
    createContact.mutate({
      organizationId: orgIdNum,
      name: newName || undefined,
      email: newEmail || undefined,
      phone: newPhone || undefined,
      preferredChannel: newChannel,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setBulkText(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handlePreview = () => {
    if (!bulkText.trim()) { toast.error("Please paste or upload contact data first"); return; }
    const parsed = parseContactText(bulkText, bulkChannel);
    if (!parsed.length) { toast.error("No contacts found in the input"); return; }
    setPreview(parsed);
    setImportStep("preview");
  };

  const handleConfirmImport = () => {
    if (!preview) return;
    const valid = preview.filter((c) => c._valid).map(({ name, email, phone, preferredChannel }) => ({
      name, email, phone, preferredChannel,
    }));
    if (!valid.length) { toast.error("No valid contacts to import"); return; }
    bulkImport.mutate({ organizationId: orgIdNum, contacts: valid });
  };

  const resetBulk = () => {
    setBulkText("");
    setPreview(null);
    setImportStep("input");
    setImportResult(null);
  };

  const navItems = [
    { label: "Dashboard", href: `/org/${orgId}` },
    { label: "Surveys", href: `/org/${orgId}/surveys` },
    { label: "Contacts", href: `/org/${orgId}/contacts`, active: true },
    { label: "Audiences", href: `/org/${orgId}/audiences` },
    { label: "Respondents", href: `/org/${orgId}/respondents` },
    { label: "Email Branding", href: `/org/${orgId}/branding` },
    { label: "Settings", href: `/org/${orgId}/settings` },
  ];

  const validCount = preview?.filter((c) => c._valid).length ?? 0;
  const invalidCount = preview ? preview.length - validCount : 0;

  return (
    <DashboardLayout navItems={navItems} title="Contacts">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
            <p className="text-sm text-muted-foreground mt-1">{contacts?.length ?? 0} / 1,500 contacts</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Bulk Import */}
            <Dialog open={showBulk} onOpenChange={(open) => { setShowBulk(open); if (!open) resetBulk(); }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/5">
                  <Upload className="w-4 h-4 mr-2" /> Bulk Import
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Bulk Import Contacts</DialogTitle>
                </DialogHeader>

                {importStep === "input" && (
                  <div className="space-y-4 pt-2">
                    <p className="text-sm text-muted-foreground">
                      Paste a list of emails or phone numbers (one per line), or upload a CSV file.
                      Supported formats: <code className="text-xs bg-muted px-1 rounded">email</code>,{" "}
                      <code className="text-xs bg-muted px-1 rounded">phone</code>,{" "}
                      <code className="text-xs bg-muted px-1 rounded">Name, email</code>,{" "}
                      <code className="text-xs bg-muted px-1 rounded">Name, email, phone</code>
                    </p>

                    <Tabs defaultValue="paste">
                      <TabsList className="mb-3">
                        <TabsTrigger value="paste">Paste List</TabsTrigger>
                        <TabsTrigger value="csv">Upload CSV</TabsTrigger>
                      </TabsList>

                      <TabsContent value="paste">
                        <Textarea
                          rows={10}
                          placeholder={"alice@example.com\nbob@example.com\n+254712345678\nCharlie, charlie@example.com\nDiana, diana@example.com, +254700000001"}
                          value={bulkText}
                          onChange={(e) => setBulkText(e.target.value)}
                          className="font-mono text-sm"
                        />
                      </TabsContent>

                      <TabsContent value="csv">
                        <div
                          className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-10 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="w-8 h-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Click to upload a CSV file</p>
                          <p className="text-xs text-muted-foreground">Columns: name, email, phone (header row optional)</p>
                          <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
                        </div>
                        {bulkText && (
                          <p className="mt-2 text-xs text-primary flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> File loaded — {bulkText.split("\n").filter(Boolean).length} lines
                          </p>
                        )}
                      </TabsContent>
                    </Tabs>

                    <div>
                      <Label className="mb-1 block">Default channel for phone-only contacts</Label>
                      <Select value={bulkChannel} onValueChange={(v) => setBulkChannel(v as "email" | "whatsapp" | "sms")}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={handlePreview} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                      Preview Contacts
                    </Button>
                  </div>
                )}

                {importStep === "preview" && preview && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-primary font-medium">
                        <CheckCircle2 className="w-4 h-4" /> {validCount} valid
                      </span>
                      {invalidCount > 0 && (
                        <span className="flex items-center gap-1 text-destructive font-medium">
                          <AlertCircle className="w-4 h-4" /> {invalidCount} invalid (will be skipped)
                        </span>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-8"></TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Channel</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preview.map((c, i) => (
                            <TableRow key={i} className={!c._valid ? "opacity-40" : ""}>
                              <TableCell>
                                {c._valid
                                  ? <CheckCircle2 className="w-4 h-4 text-primary" />
                                  : <X className="w-4 h-4 text-destructive" />}
                              </TableCell>
                              <TableCell className="text-sm">{c.name ?? "—"}</TableCell>
                              <TableCell className="text-sm">{c.email ?? "—"}</TableCell>
                              <TableCell className="text-sm">{c.phone ?? "—"}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs capitalize">{c.preferredChannel}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setImportStep("input")} className="flex-1">
                        Back
                      </Button>
                      <Button
                        onClick={handleConfirmImport}
                        disabled={bulkImport.isPending || validCount === 0}
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {bulkImport.isPending ? "Importing..." : `Import ${validCount} Contacts`}
                      </Button>
                    </div>
                  </div>
                )}

                {importStep === "done" && importResult && (
                  <div className="flex flex-col items-center gap-4 py-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle2 className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-foreground">{importResult.imported} contacts imported</p>
                      {importResult.skipped > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">{importResult.skipped} were skipped (duplicates or over limit)</p>
                      )}
                    </div>
                    <Button onClick={() => { setShowBulk(false); resetBulk(); }} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      Done
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Single Add */}
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="w-4 h-4 mr-2" /> Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Contact</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>Name</Label>
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@example.com" />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+1234567890" />
                  </div>
                  <div>
                    <Label>Preferred Channel</Label>
                    <Select value={newChannel} onValueChange={(v) => setNewChannel(v as "email" | "whatsapp" | "sms")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAdd} disabled={createContact.isPending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    {createContact.isPending ? "Adding..." : "Add Contact"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Contact list */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading contacts...</div>
            ) : !contacts?.length ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No contacts yet.</p>
                <div className="flex items-center justify-center gap-3">
                  <Button variant="outline" onClick={() => setShowBulk(true)} className="border-primary/30 text-primary hover:bg-primary/5">
                    <Upload className="w-4 h-4 mr-2" /> Bulk Import
                  </Button>
                  <Button onClick={() => setShowAdd(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="w-4 h-4 mr-2" /> Add Contact
                  </Button>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name ?? "—"}</TableCell>
                      <TableCell>{c.email ?? "—"}</TableCell>
                      <TableCell>{c.phone ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-primary border-primary/30">{c.preferredChannel ?? "email"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteContact.mutate({ id: c.id, organizationId: orgIdNum })}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
