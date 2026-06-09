import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export default function AdminUsers() {
  const { data: users, isLoading } = trpc.admin.allUsers.useQuery();

  const navItems = [
    { label: "Overview", href: "/admin" },
    { label: "Organisations", href: "/admin/organizations" },
    { label: "Users", href: "/admin/users", active: true },
    { label: "Surveys", href: "/admin/surveys" },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Users" appName="CXDi Admin">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        {isLoading ? <div className="text-center text-gray-500 py-8">Loading...</div> : !users?.length ? (
          <Card><CardContent className="p-12 text-center"><Users className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No users yet</p></CardContent></Card>
        ) : (
          <div className="space-y-2">
            {users.map((u: any) => (
              <Card key={u.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${u.role === "admin" ? "text-blue-600 border-blue-200" : "text-gray-600"}`}>{u.role}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
