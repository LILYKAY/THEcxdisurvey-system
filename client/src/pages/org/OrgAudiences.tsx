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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Users } from "lucide-react";

export default function OrgAudiences() {
  const { orgId } = useParams<{ orgId: string }>();
  const orgIdNum = parseInt(orgId ?? "0");
  const utils = trpc.useUtils();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newChannel, setNewChannel] = useState<"email" | "whatsapp" | "sms">("email");
  const [newCountry, setNewCountry] = useState("");

  const { data: audiences, isLoading } = trpc.audiences.list.useQuery({ organizationId: orgIdNum });

  const createAudience = trpc.audiences.create.useMutation({
    onSuccess: () => {
      utils.audiences.list.invalidate({ organizationId: orgIdNum });
      setShowCreate(false);
      setNewName(""); setNewCountry("");
      toast.success("Audience created");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteAudience = trpc.audiences.delete.useMutation({
    onSuccess: () => {
      utils.audiences.list.invalidate({ organizationId: orgIdNum });
      toast.success("Audience deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const navItems = [
    { label: "Dashboard", href: `/org/${orgId}` },
    { label: "Surveys", href: `/org/${orgId}/surveys` },
    { label: "Contacts", href: `/org/${orgId}/contacts` },
    { label: "Audiences", href: `/org/${orgId}/audiences`, active: true },
    { label: "Settings", href: `/org/${orgId}/settings` },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Audiences">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audiences</h1>
            <p className="text-sm text-gray-500 mt-1">Group contacts for targeted survey distribution</p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" /> New Audience
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Audience</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Audience Name</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Premium Customers" />
                </div>
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
                <div>
                  <Label>Country (optional)</Label>
                  <Input value={newCountry} onChange={(e) => setNewCountry(e.target.value)} placeholder="e.g. Nigeria" />
                </div>
                <Button
                  onClick={() => createAudience.mutate({ organizationId: orgIdNum, name: newName, channel: newChannel, country: newCountry || undefined })}
                  disabled={!newName || createAudience.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {createAudience.isPending ? "Creating..." : "Create Audience"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center text-gray-500 py-8">Loading audiences...</div>
        ) : !audiences?.length ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No audiences yet. Create your first audience to group contacts.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {audiences.map((a) => (
              <Card key={a.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base font-semibold">{a.name}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => deleteAudience.mutate({ id: a.id, organizationId: orgIdNum })} className="text-red-400 hover:text-red-600 hover:bg-red-50 -mt-1 -mr-1">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>{a.contactCount} contacts</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Badge variant="outline" className="capitalize text-xs">{a.channel ?? "email"}</Badge>
                    {a.country && <Badge variant="outline" className="text-xs">{a.country}</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
