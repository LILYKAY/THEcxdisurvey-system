import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Mail, CheckCircle2, Clock, AlertCircle, Eye, XCircle } from "lucide-react";
import { format } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: "Pending", icon: Clock, className: "bg-slate-100 text-slate-700 border-slate-200" },
  sent: { label: "Sent", icon: Mail, className: "bg-blue-100 text-blue-700 border-blue-200" },
  opened: { label: "Opened", icon: Eye, className: "bg-amber-100 text-amber-700 border-amber-200" },
  completed: { label: "Completed", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  failed: { label: "Failed", icon: XCircle, className: "bg-rose-100 text-rose-700 border-rose-200" },
};

export default function OrgInvitations() {
  const { orgId } = useParams<{ orgId: string }>();
  const organizationId = parseInt(orgId ?? "0");
  const [search, setSearch] = useState("");

  const invitationsQuery = trpc.org.invitations.useQuery({ organizationId });
  const invitations = invitationsQuery.data ?? [];

  const filtered = invitations.filter((inv) => {
    const q = search.toLowerCase();
    return (
      inv.recipientEmail.toLowerCase().includes(q) ||
      (inv.recipientName ?? "").toLowerCase().includes(q)
    );
  });

  // Summary stats
  const stats = {
    total: invitations.length,
    sent: invitations.filter((i) => i.status === "sent").length,
    opened: invitations.filter((i) => i.status === "opened").length,
    completed: invitations.filter((i) => i.status === "completed").length,
    failed: invitations.filter((i) => i.status === "failed").length,
  };
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Invitation Tracker</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Track the status of all survey invitations sent to your customers.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Sent", value: stats.total, icon: Mail, color: "text-blue-600" },
          { label: "Opened", value: stats.opened, icon: Eye, color: "text-amber-600" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Completion Rate", value: `${completionRate}%`, icon: CheckCircle2, color: "text-primary" },
        ].map((stat) => (
          <Card key={stat.label} className="border shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="pb-0 border-b bg-muted/30">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {filtered.length} invitation{filtered.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {invitationsQuery.isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <Mail className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                {search ? "No invitations match your search" : "No invitations sent yet"}
              </p>
              {!search && (
                <p className="text-xs text-muted-foreground mt-1">
                  Go to <strong>Invite Customers</strong> to send your first survey invitations.
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((inv) => {
                const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.pending;
                const Icon = cfg.icon;
                return (
                  <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {inv.recipientName ? `${inv.recipientName}` : inv.recipientEmail}
                        </p>
                        {inv.recipientName && (
                          <p className="text-xs text-muted-foreground truncate">{inv.recipientEmail}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                      <Badge className={`text-xs border font-medium ${cfg.className}`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {cfg.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {inv.sentAt
                          ? format(new Date(inv.sentAt), "MMM d, yyyy · h:mm a")
                          : "—"}
                      </span>
                      {inv.completedAt && (
                        <span className="text-xs text-emerald-600 font-medium">
                          Completed {format(new Date(inv.completedAt), "MMM d")}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
