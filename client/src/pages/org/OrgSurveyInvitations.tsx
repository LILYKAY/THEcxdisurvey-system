import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Mail,
  CheckCircle2,
  Clock,
  Eye,
  XCircle,
  Send,
  Search,
  RefreshCw,
} from "lucide-react";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: <Clock className="w-3 h-3" />,
  },
  sent: {
    label: "Sent",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <Send className="w-3 h-3" />,
  },
  opened: {
    label: "Opened",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: <Eye className="w-3 h-3" />,
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  failed: {
    label: "Failed",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: <XCircle className="w-3 h-3" />,
  },
};

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function OrgSurveyInvitations() {
  const { orgId, surveyId } = useParams<{ orgId: string; surveyId: string }>();
  const orgIdNum = parseInt(orgId ?? "0");
  const surveyIdNum = parseInt(surveyId ?? "0");
  const [, navigate] = useLocation();

  const [search, setSearch] = useState("");

  const { data: survey } = trpc.surveys.get.useQuery(
    { id: surveyIdNum },
    { enabled: !!surveyIdNum }
  );

  const {
    data: invitations,
    isLoading,
    refetch,
    isRefetching,
  } = trpc.org.surveyInvitations.useQuery(
    { organizationId: orgIdNum, surveyId: surveyIdNum },
    { enabled: !!orgIdNum && !!surveyIdNum }
  );

  const navItems = [
    { label: "Dashboard", href: `/org/${orgId}` },
    { label: "Surveys", href: `/org/${orgId}/surveys` },
    { label: "Contacts", href: `/org/${orgId}/contacts` },
    { label: "Audiences", href: `/org/${orgId}/audiences` },
    { label: "Settings", href: `/org/${orgId}/settings` },
  ];

  const filtered = (invitations ?? []).filter((inv) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      inv.recipientEmail?.toLowerCase().includes(q) ||
      inv.recipientName?.toLowerCase().includes(q) ||
      inv.status?.toLowerCase().includes(q)
    );
  });

  const statusCounts = (invitations ?? []).reduce<Record<string, number>>(
    (acc, inv) => {
      const s = inv.status ?? "pending";
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <DashboardLayout navItems={navItems} title="Invitations">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/org/${orgId}/surveys`)}
            className="gap-1 text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Surveys
          </Button>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Invitations
            </h1>
            {survey && (
              <p className="text-sm text-gray-500 mt-1">
                {survey.title}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-2 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Status summary */}
        {invitations && invitations.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusCounts).map(([status, count]) => {
              const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
              return (
                <span
                  key={status}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${cfg.color}`}
                >
                  {cfg.icon}
                  {cfg.label}: {count}
                </span>
              );
            })}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
              Total: {invitations.length}
            </span>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, or status…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center text-gray-500 py-12">Loading invitations…</div>
        ) : !invitations?.length ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No invitations sent yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Send this survey to contacts or audiences to see delivery tracking here.
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate(`/org/${orgId}/surveys/${surveyId}/send`)}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Survey
              </Button>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No invitations match your search.</div>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-700">
                {filtered.length} invitation{filtered.length !== 1 ? "s" : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-left">
                      <th className="px-4 py-3 font-medium text-gray-600">Recipient</th>
                      <th className="px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Channel</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Sent</th>
                      <th className="px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Opened</th>
                      <th className="px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Completed</th>
                      <th className="px-4 py-3 font-medium text-gray-600 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((inv, idx) => {
                      const cfg =
                        STATUS_CONFIG[inv.status ?? "pending"] ??
                        STATUS_CONFIG.pending;
                      return (
                        <tr
                          key={inv.id}
                          className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${
                            idx % 2 === 0 ? "" : "bg-gray-50/30"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">
                              {inv.recipientName || "—"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {inv.recipientEmail || "—"}
                            </div>
                          </td>
                          <td className="px-4 py-3 capitalize text-gray-600 hidden sm:table-cell">
                            {inv.channel ?? "email"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}
                            >
                              {cfg.icon}
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap hidden md:table-cell">
                            {formatDate(inv.sentAt)}
                          </td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap hidden lg:table-cell">
                            {formatDate(inv.openedAt)}
                          </td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap hidden lg:table-cell">
                            {formatDate(inv.completedAt)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {(inv.status === "sent" ||
                              inv.status === "pending" ||
                              inv.status === "failed") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/org/${orgId}/surveys/${surveyId}/send`)}
                                className="text-xs gap-1"
                              >
                                <Send className="w-3 h-3" />
                                Send Again
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
