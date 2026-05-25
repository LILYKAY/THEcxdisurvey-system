import { DashboardShell, getOrgNav } from "@/components/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Search, Users } from "lucide-react";
import { useState } from "react";
import { useParams, useLocation } from "wouter";

export default function OrgRespondents() {
  const { orgId } = useParams<{ orgId: string }>();
  const [, navigate] = useLocation();
  const nav = getOrgNav(orgId);
  const { data: respondents, isLoading } = trpc.org.respondents.useQuery({
    organizationId: Number(orgId),
  });
  const [search, setSearch] = useState("");

  const filtered = respondents?.filter(
    (r) =>
      !search ||
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardShell navItems={nav} title="Respondents">
      <div className="p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search respondents…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filtered?.length ?? 0} respondent{filtered?.length !== 1 ? "s" : ""}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
        ) : filtered?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="font-semibold text-foreground">No respondents yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Share your survey links to start collecting responses.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card shadow-elegant overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered?.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer hover:bg-secondary/20"
                    onClick={() => navigate(`/org/${orgId}/respondents/${r.id}`)}
                  >
                    <TableCell className="font-medium">{r.name ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.email ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.company ?? "—"}</TableCell>
                    <TableCell>
                      {r.country ? (
                        <Badge variant="secondary" className="text-xs">{r.country}</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
