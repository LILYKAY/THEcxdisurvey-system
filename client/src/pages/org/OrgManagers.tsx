import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { UserPlus, Trash2, Mail, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function OrgManagers() {
  const { orgId } = useParams<{ orgId: string }>();
  const orgIdNum = parseInt(orgId ?? "0", 10);
  const { data: org } = trpc.org.get.useQuery({ id: orgIdNum });
  const { data: managersData, refetch } = trpc.orgManager.listManagers.useQuery({ organizationId: orgIdNum });

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");

  const inviteMutation = trpc.orgManager.invite.useMutation({
    onSuccess: () => {
      toast.success("Invitation sent successfully!");
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteName("");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to send invitation");
    },
  });

  const revokeMutation = trpc.orgManager.revokeManager.useMutation({
    onSuccess: () => {
      toast.success("Manager access revoked");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to revoke access");
    },
  });

  const navItems = [
    { label: "Dashboard", href: `/org/${orgId}` },
    { label: "Surveys", href: `/org/${orgId}/surveys` },
    { label: "Contacts", href: `/org/${orgId}/contacts` },
    { label: "Managers", href: `/org/${orgId}/managers`, active: true },
    { label: "Settings", href: `/org/${orgId}/settings` },
  ];

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate({
      organizationId: orgIdNum,
      email: inviteEmail,
      name: inviteName || undefined,
      origin: window.location.origin,
    });
  };

  return (
    <DashboardLayout
      appName="The CXDi Surveys"
      navItems={navItems}
    >
      <div className="max-w-3xl space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold">Managers</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Invite people to manage <strong>{org?.name}</strong>.
            </p>
          </div>
          <Button
            className="bg-[#03989e] hover:bg-[#027a7f] text-white h-10 px-3 gap-1.5 shrink-0"
            onClick={() => setShowInviteDialog(true)}
          >
            <UserPlus size={16} />
            <span className="hidden sm:inline">Invite Manager</span>
            <span className="sm:hidden">Invite</span>
          </Button>
        </div>

        {/* Active Managers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Active Managers</CardTitle>
            <CardDescription>People with manager access to this organization</CardDescription>
          </CardHeader>
          <CardContent>
            {!managersData ? (
              <div className="flex justify-center py-6"><Spinner /></div>
            ) : managersData.managers.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">No managers yet. Invite someone to get started.</p>
            ) : (
              <div className="space-y-3">
                {managersData.managers.map((mgr) => (
                  <div key={mgr.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#03989e]/20 flex items-center justify-center text-[#03989e] font-semibold text-sm">
                        {(mgr.name ?? mgr.email ?? "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{mgr.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{mgr.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">Manager</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                        onClick={() => revokeMutation.mutate({ userId: mgr.id, organizationId: orgIdNum })}
                        disabled={revokeMutation.isPending}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invites */}
        <Card className="mt-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pending Invitations</CardTitle>
            <CardDescription>Invites that have been sent but not yet accepted</CardDescription>
          </CardHeader>
          <CardContent>
            {!managersData ? (
              <div className="flex justify-center py-6"><Spinner /></div>
            ) : managersData.invites.filter(i => !i.acceptedAt).length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">No pending invitations.</p>
            ) : (
              <div className="space-y-3">
                {managersData.invites.filter(i => !i.acceptedAt).map((inv) => {
                  const expired = new Date(inv.expiresAt) < new Date();
                  return (
                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                          <Mail size={14} className="text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{inv.name ?? inv.email}</p>
                          <p className="text-xs text-muted-foreground">{inv.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {expired ? (
                          <Badge variant="destructive" className="text-xs">Expired</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <Clock size={10} />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accepted Invites (history) */}
        {managersData && managersData.invites.filter(i => i.acceptedAt).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Accepted Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {managersData.invites.filter(i => i.acceptedAt).map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-green-500" />
                      <div>
                        <p className="font-medium text-sm">{inv.name ?? inv.email}</p>
                        <p className="text-xs text-muted-foreground">{inv.email}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Accepted</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite a Manager</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="inviteEmail">Email Address *</Label>
              <Input
                id="inviteEmail"
                type="email"
                placeholder="manager@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inviteName">Name (optional)</Label>
              <Input
                id="inviteName"
                type="text"
                placeholder="Their full name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              An invitation email will be sent. The link expires in 7 days. They will only be able to manage <strong>{org?.name}</strong>.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowInviteDialog(false)}>Cancel</Button>
              <Button
                type="submit"
                className="bg-[#03989e] hover:bg-[#027a7f] text-white"
                disabled={inviteMutation.isPending || !inviteEmail}
              >
                {inviteMutation.isPending ? <Spinner className="mr-2" /> : null}
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
