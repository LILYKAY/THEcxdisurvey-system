import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Building2,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface DashboardShellProps {
  children: ReactNode;
  navItems: NavItem[];
  title?: string;
}

export function DashboardShell({ children, navItems, title }: DashboardShellProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const [location, navigate] = useLocation();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      navigate("/");
      window.location.reload();
    },
    onError: () => toast.error("Failed to sign out"),
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar ── */}
      <aside className="flex w-64 flex-shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <BarChart3 className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <span className="font-serif text-lg font-semibold text-sidebar-foreground">
            SurveyPro
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                  {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-50" />}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold text-sidebar-accent-foreground">
              {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user?.name ?? "User"}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/50 capitalize">
                {user?.role?.replace("_", " ")}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            onClick={() => logout.mutate()}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {title && (
          <header className="flex h-16 flex-shrink-0 items-center border-b border-border bg-card px-6">
            <h1 className="font-serif text-xl font-semibold text-foreground">{title}</h1>
          </header>
        )}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

// ─── Admin nav ────────────────────────────────────────────────────────────────

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/respondents", label: "Respondents", icon: Users },
];

// ─── Org nav factory ──────────────────────────────────────────────────────────

export function getOrgNav(orgId: number | string): NavItem[] {
  return [
    { href: `/org/${orgId}`, label: "Overview", icon: LayoutDashboard },
    { href: `/org/${orgId}/respondents`, label: "Respondents", icon: Users },
    { href: `/org/${orgId}/settings`, label: "Settings", icon: Settings },
  ];
}
