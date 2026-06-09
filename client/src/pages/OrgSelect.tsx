import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, LogOut } from "lucide-react";

export default function OrgSelect() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { data: orgs, isLoading } = trpc.org.list.useQuery();

  if (isLoading) return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-blue-700">CXDi SurveyPro</h1>
          <p className="text-gray-500 mt-1">Welcome, {user?.name}. Select your organisation.</p>
        </div>
        {!orgs?.length ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No organisations found.</p>
              <p className="text-xs text-gray-400 mt-1">Contact your administrator.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {orgs.map((org) => (
              <Card key={org.id} className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300" onClick={() => navigate(`/org/${org.id}`)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{org.name}</p>
                    <p className="text-xs text-gray-500">{org.industry ?? ""} {org.country ? `· ${org.country}` : ""}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <Button variant="ghost" onClick={logout} className="w-full text-gray-500">
          <LogOut className="w-4 h-4 mr-2" /> Sign out
        </Button>
      </div>
    </div>
  );
}
