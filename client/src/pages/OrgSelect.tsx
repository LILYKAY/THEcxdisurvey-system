import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Building2, ChevronRight, LogOut, Plus } from "lucide-react";
import { useEffect } from "react";

export default function OrgSelect() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const orgsQuery = trpc.organizations.myOrgs.useQuery(undefined, {
    enabled: !!user,
  });
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => navigate("/login"),
  });
  const utils = trpc.useUtils();

  // Redirect non-org-owners away
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "user") navigate("/");
    }
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  // If org_owner has exactly one org, auto-redirect
  useEffect(() => {
    if (orgsQuery.data && orgsQuery.data.length === 1) {
      navigate(`/org/${orgsQuery.data[0].id}`);
    }
  }, [orgsQuery.data, navigate]);

  const orgs = orgsQuery.data ?? [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <BarChart3 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-serif text-xl font-semibold text-foreground">SurveyPro</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:block">{user?.name}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4 mr-1.5" />
            Sign out
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          <div className="mb-8 text-center">
            <h1 className="font-serif text-3xl font-bold text-foreground">Select an organization</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose the organization you want to manage.
            </p>
          </div>

          {authLoading || orgsQuery.isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : orgs.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <div>
                <p className="font-medium text-foreground">No organizations yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You have not been assigned to any organization. Contact your administrator.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {orgs.map((org) => (
                <Card
                  key={org.id}
                  className="cursor-pointer border hover:border-primary/50 hover:shadow-md transition-all duration-200 group"
                  onClick={() => navigate(`/org/${org.id}`)}
                >
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{org.name}</p>
                      {org.industry && (
                        <p className="text-sm text-muted-foreground truncate">{org.industry}</p>
                      )}
                      {org.country && !org.industry && (
                        <p className="text-sm text-muted-foreground truncate">{org.country}</p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
