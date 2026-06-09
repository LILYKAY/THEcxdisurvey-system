import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, FolderPlus, Plus, Trash2, UserPlus, Users, X } from "lucide-react";

export default function OrgAudiences() {
  const { orgId } = useParams<{ orgId: string }>();
  const orgIdNum = parseInt(orgId ?? "0");
  const utils = trpc.useUtils();

  // Create audience
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newChannel, setNewChannel] = useState<"email" | "whatsapp" | "sms">("email");
  const [newCountry, setNewCountry] = useState("");

  // Expanded audience (to show members)
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Add contacts to audience
  const [showAddContacts, setShowAddContacts] = useState<number | null>(null); // audienceId
  const [selectedContactIds, setSelectedContactIds] = useState<Set<number>>(new Set());

  const { data: audiences, isLoading } = trpc.audiences.list.useQuery({ organizationId: orgIdNum });
  const { data: allContacts } = trpc.contacts.list.useQuery({ organizationId: orgIdNum });

  // Members for expanded audience (display)
  const { data: members, isLoading: membersLoading } = trpc.audiences.getContacts.useQuery(
    { audienceId: expandedId ?? 0, organizationId: orgIdNum },
    { enabled: expandedId !== null }
  );

  // Members for the audience whose "Add Contacts" dialog is open (for filtering)
  const { data: editingMembers } = trpc.audiences.getContacts.useQuery(
    { audienceId: showAddContacts ?? 0, organizationId: orgIdNum },
    { enabled: showAddContacts !== null }
  );

  const createAudience = trpc.audiences.create.useMutation({
    onSuccess: () => {
      utils.audiences.list.invalidate({ organizationId: orgIdNum });
      setShowCreate(false); setNewName(""); setNewCountry("");
      toast.success("Audience created");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteAudience = trpc.audiences.delete.useMutation({
    onSuccess: () => {
      utils.audiences.list.invalidate({ organizationId: orgIdNum });
      if (expandedId !== null) setExpandedId(null);
      toast.success("Audience deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const addContacts = trpc.audiences.addContacts.useMutation({
    onSuccess: () => {
      utils.audiences.list.invalidate({ organizationId: orgIdNum });
      utils.audiences.getContacts.invalidate({ audienceId: showAddContacts ?? 0, organizationId: orgIdNum });
      setShowAddContacts(null); setSelectedContactIds(new Set());
      toast.success("Contacts added to audience");
    },
    onError: (e) => toast.error(e.message),
  });

  const removeContact = trpc.audiences.removeContact.useMutation({
    onSuccess: () => {
      utils.audiences.list.invalidate({ organizationId: orgIdNum });
      utils.audiences.getContacts.invalidate({ audienceId: expandedId ?? 0, organizationId: orgIdNum });
      toast.success("Contact removed from audience");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleContactSelect = (id: number) => {
    setSelectedContactIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Contacts not yet in the audience whose dialog is open
  const editingMemberIds = new Set(editingMembers?.map((m) => m.id) ?? []);
  const availableContacts = allContacts?.filter((c) => !editingMemberIds.has(c.id)) ?? [];

  const navItems = [
    { label: "Dashboard", href: `/org/${orgId}` },
    { label: "Surveys", href: `/org/${orgId}/surveys` },
    { label: "Contacts", href: `/org/${orgId}/contacts` },
    { label: "Audiences", href: `/org/${orgId}/audiences`, active: true },
    { label: "Respondents", href: `/org/${orgId}/respondents` },
    { label: "Email Branding", href: `/org/${orgId}/branding` },
    { label: "Settings", href: `/org/${orgId}/settings` },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Audiences">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Audiences</h1>
            <p className="text-sm text-muted-foreground mt-1">Group contacts for targeted survey distribution</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild className="border-primary/30 text-primary hover:bg-primary/5">
              <a href={`/org/${orgId}/contacts`}><UserPlus className="w-4 h-4 mr-2" /> Manage Contacts</a>
            </Button>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <FolderPlus className="w-4 h-4 mr-2" /> New Audience
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Audience</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div><Label>Audience Name</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Premium Customers" /></div>
                  <div>
                    <Label>Channel</Label>
                    <Select value={newChannel} onValueChange={(v) => setNewChannel(v as "email" | "whatsapp" | "sms")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Country (optional)</Label><Input value={newCountry} onChange={(e) => setNewCountry(e.target.value)} placeholder="e.g. Kenya" /></div>
                  <Button onClick={() => { if (!newName.trim()) { toast.error("Name required"); return; } createAudience.mutate({ organizationId: orgIdNum, name: newName, channel: newChannel, country: newCountry || undefined }); }} disabled={createAudience.isPending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    {createAudience.isPending ? "Creating..." : "Create Audience"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Audience list */}
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Loading audiences...</div>
        ) : !audiences?.length ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No audiences yet. Create your first audience to group contacts for survey distribution.</p>
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" asChild className="border-primary/30 text-primary hover:bg-primary/5">
                  <a href={`/org/${orgId}/contacts`}><UserPlus className="w-4 h-4 mr-2" /> Import Contacts First</a>
                </Button>
                <Button onClick={() => setShowCreate(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <FolderPlus className="w-4 h-4 mr-2" /> Create Audience
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {audiences.map((a) => (
              <Card key={a.id} className="overflow-hidden">
                {/* Audience row */}
                <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}>
                  <div className="text-muted-foreground">
                    {expandedId === a.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{a.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{a.contactCount} contact{a.contactCount !== 1 ? "s" : ""}</span>
                      <Badge variant="outline" className="capitalize text-xs text-primary border-primary/30">{a.channel ?? "email"}</Badge>
                      {a.country && <Badge variant="outline" className="text-xs">{a.country}</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {/* Add contacts to this audience */}
                    <Dialog open={showAddContacts === a.id} onOpenChange={(open) => { setShowAddContacts(open ? a.id : null); setSelectedContactIds(new Set()); }}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/5">
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add Contacts
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader><DialogTitle>Add Contacts to "{a.name}"</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-2">
                          {availableContacts.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">All contacts are already in this audience.</p>
                          ) : (
                            <>
                              <p className="text-sm text-muted-foreground">{selectedContactIds.size} selected</p>
                              <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-10"></TableHead>
                                      <TableHead>Name</TableHead>
                                      <TableHead>Email / Phone</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {availableContacts.map((c) => (
                                      <TableRow key={c.id} className={selectedContactIds.has(c.id) ? "bg-primary/5" : ""}>
                                        <TableCell>
                                          <Checkbox checked={selectedContactIds.has(c.id)} onCheckedChange={() => toggleContactSelect(c.id)} />
                                        </TableCell>
                                        <TableCell className="text-sm font-medium">{c.name ?? "—"}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{c.email ?? c.phone ?? "—"}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                              <Button onClick={() => { if (selectedContactIds.size === 0) { toast.error("Select at least one contact"); return; } addContacts.mutate({ audienceId: a.id, contactIds: Array.from(selectedContactIds), organizationId: orgIdNum }); }} disabled={addContacts.isPending || selectedContactIds.size === 0} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                                {addContacts.isPending ? "Adding..." : `Add ${selectedContactIds.size || ""} Contact${selectedContactIds.size !== 1 ? "s" : ""}`}
                              </Button>
                            </>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button variant="ghost" size="sm" onClick={() => deleteAudience.mutate({ id: a.id, organizationId: orgIdNum })} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Expanded members list */}
                {expandedId === a.id && (
                  <div className="border-t border-border bg-muted/20">
                    {membersLoading ? (
                      <div className="px-5 py-4 text-sm text-muted-foreground">Loading members...</div>
                    ) : !members?.length ? (
                      <div className="px-5 py-6 text-center">
                        <p className="text-sm text-muted-foreground mb-3">No contacts in this audience yet.</p>
                        <Button size="sm" variant="outline" onClick={() => { setShowAddContacts(a.id); setSelectedContactIds(new Set()); }} className="border-primary/30 text-primary hover:bg-primary/5">
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add Contacts
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Channel</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {members.map((m) => (
                            <TableRow key={m.id}>
                              <TableCell className="font-medium text-sm">{m.name ?? "—"}</TableCell>
                              <TableCell className="text-sm">{m.email ?? "—"}</TableCell>
                              <TableCell className="text-sm">{m.phone ?? "—"}</TableCell>
                              <TableCell><Badge variant="outline" className="capitalize text-xs text-primary border-primary/30">{m.preferredChannel ?? "email"}</Badge></TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" onClick={() => removeContact.mutate({ audienceId: a.id, contactId: m.id, organizationId: orgIdNum })} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
