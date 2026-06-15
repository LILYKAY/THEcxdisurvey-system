import { DashboardShell, ADMIN_NAV } from "@/components/DashboardShell";
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
import { useLocation } from "wouter";

export default function AdminRespondents() {
  const { data: respondents, isLoading } = trpc.admin.allRespondents.useQuery();
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();

  const filtered = respondents?.filter(
    (r) =>
      !search ||
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardShell navItems={ADMIN_NAV} title="All Respondents">
      <div className="p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or company…"
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
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
        ) : filtered?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="font-semibold text-foreground">No respondents found</h3>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card shadow-elegant overflow-hidden">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30">
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Company</TableHead>
                  <TableHead className="hidden md:table-cell">Country</TableHead>
                  <TableHead className="hidden sm:table-cell">Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered?.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer hover:bg-secondary/20"
                    onClick={() => navigate(`/admin/respondents/${r.id}`)}
                  >
                    <TableCell>
                      <div className="font-medium">{r.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground sm:hidden">{r.email ?? ""}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{r.email ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{r.company ?? "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {r.country ? (
                        <Badge variant="secondary" className="text-xs">{r.country}</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
