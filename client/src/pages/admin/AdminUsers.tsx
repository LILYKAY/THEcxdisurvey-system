import { DashboardShell, ADMIN_NAV } from "@/components/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Users } from "lucide-react";
import { toast } from "sonner";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-50 text-red-700 border-red-100",
  org_owner: "bg-indigo-50 text-indigo-700 border-indigo-100",
  user: "bg-gray-50 text-gray-600 border-gray-100",
};

export default function AdminUsers() {
  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.admin.allUsers.useQuery();
  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated");
      utils.admin.allUsers.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <DashboardShell navItems={ADMIN_NAV} title="Users & Roles">
      <div className="p-6">
        <p className="mb-6 text-sm text-muted-foreground">
          {users?.length ?? 0} registered user{users?.length !== 1 ? "s" : ""}
        </p>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
        ) : users?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="font-semibold text-foreground">No users yet</h3>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card shadow-elegant overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Sign In</TableHead>
                  <TableHead className="text-right">Change Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id} className="hover:bg-secondary/20">
                    <TableCell className="font-medium">{user.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{user.email ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs capitalize ${ROLE_COLORS[user.role] ?? ""}`}
                      >
                        {user.role.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.lastSignedIn).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={user.role}
                        onValueChange={(val) =>
                          updateRole.mutate({
                            userId: user.id,
                            role: val as "user" | "admin" | "org_owner",
                          })
                        }
                      >
                        <SelectTrigger className="h-8 w-36 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="org_owner">Org Owner</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
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
