import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Building2,
  ChevronRight,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Send,
  Settings,
  Users,
} from "lucide-react";
import { ReactNode, useState } from "react";
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

function SidebarContent({
  navItems,
  user,
  onLogout,
  onNavClick,
}: {
  navItems: NavItem[];
  user: { name?: string | null; role?: string } | null;
  onLogout: () => void;
  onNavClick?: () => void;
}) {
  const [location] = useLocation();
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5 flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
          <BarChart3 className="h-4 w-4 text-sidebar-primary-foreground" />
        </div>
        <span className="font-serif text-lg font-semibold text-sidebar-foreground">The CXDi Surveys</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            location === item.href || location.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
              {isActive && (
                <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-50" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-border p-3 flex-shrink-0">
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
          onClick={onLogout}
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </Button>
      </div>
    </div>
  );
}

export function DashboardShell({ children, navItems, title }: DashboardShellProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      navigate("/login");
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
    window.location.href = "/login";
    return null;
  }

  const handleLogout = () => logout.mutate();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Desktop Sidebar (md+) ── */}
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col">
        <SidebarContent
          navItems={navItems}
          user={user}
          onLogout={handleLogout}
        />
      </aside>

      {/* ── Mobile Sidebar (drawer) ── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72 border-0">
          <SidebarContent
            navItems={navItems}
            user={user}
            onLogout={handleLogout}
            onNavClick={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* ── Main content ── */}
      <main className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top bar — mobile hamburger + title */}
        <header className="flex h-14 md:h-16 flex-shrink-0 items-center gap-3 border-b border-border bg-card px-4 md:px-6">
          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9 text-muted-foreground"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </Sheet>

          {title && (
            <h1 className="font-serif text-lg md:text-xl font-semibold text-foreground truncate">
              {title}
            </h1>
          )}

          {/* Mobile logo (when no title) */}
          {!title && (
            <div className="flex md:hidden items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <BarChart3 className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-serif text-base font-semibold text-foreground">The CXDi Surveys</span>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}

// ─── Admin nav ────────────────────────────────────────────────────────────────

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/admin/surveys", label: "Survey Forms", icon: ClipboardList },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/respondents", label: "Respondents", icon: Users },
];

// ─── Org nav factory ──────────────────────────────────────────────────────────

export function getOrgNav(orgId: number | string): NavItem[] {
  return [
    { href: `/org/${orgId}`, label: "Overview", icon: LayoutDashboard },
    { href: `/org/${orgId}/invite`, label: "Invite Customers", icon: Send },
    { href: `/org/${orgId}/invitations`, label: "Invitations", icon: Mail },
    { href: `/org/${orgId}/respondents`, label: "Respondents", icon: Users },
    { href: `/org/${orgId}/reports`, label: "Reports", icon: FileText },
    { href: `/org/${orgId}/settings`, label: "Settings", icon: Settings },
  ];
}
