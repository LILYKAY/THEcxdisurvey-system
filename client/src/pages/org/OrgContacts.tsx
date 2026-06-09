import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Upload, Users } from "lucide-react";

export default function OrgContacts() {
  const { orgId } = useParams<{ orgId: string }>();
  const orgIdNum = parseInt(orgId ?? "0");
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newChannel, setNewChannel] = useState<"email" | "whatsapp" | "sms">("email");

  const { data: contacts, isLoading } = trpc.contacts.list.useQuery({ organizationId: orgIdNum });

  const createContact = trpc.contacts.create.useMutation({
    onSuccess: () => {
      utils.contacts.list.invalidate({ organizationId: orgIdNum });
      setShowAdd(false);
      setNewName(""); setNewEmail(""); setNewPhone("");
      toast.success("Contact added successfully");
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
    createContact.mutate({ organizationId: orgIdNum, name: newName || undefined, email: newEmail || undefined, phone: newPhone || undefined, preferredChannel: newChannel });
  };

  const navItems = [
    { label: "Dashboard", href: `/org/${orgId}` },
    { label: "Surveys", href: `/org/${orgId}/surveys` },
    { label: "Contacts", href: `/org/${orgId}/contacts`, active: true },
    { label: "Audiences", href: `/org/${orgId}/audiences` },
    { label: "Settings", href: `/org/${orgId}/settings` },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Contacts">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
            <p className="text-sm text-gray-500 mt-1">{contacts?.length ?? 0} / 1,500 contacts</p>
          </div>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
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
                <Button onClick={handleAdd} disabled={createContact.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  {createContact.isPending ? "Adding..." : "Add Contact"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading contacts...</div>
            ) : !contacts?.length ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No contacts yet. Add your first contact to get started.</p>
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
                        <Badge variant="outline" className="capitalize">{c.preferredChannel ?? "email"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => deleteContact.mutate({ id: c.id, organizationId: orgIdNum })} className="text-red-500 hover:text-red-700 hover:bg-red-50">
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
