import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

import { useIsMobile } from "@/hooks/useMobile";
import { LogOut, PanelLeft } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

export type NavItem = {
  label: string;
  href: string;
  active?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
};

type DashboardLayoutProps = {
  children: React.ReactNode;
  navItems?: NavItem[];
  title?: string;
  appName?: string;
};

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
  navItems,
  title,
  appName = "The CXDi Surveys",
}: DashboardLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="flex flex-col items-center gap-8 p-6 max-w-md w-full">
          <img
            src="/manus-storage/cxdi-logo-transparent_f890673f.png"
            alt="The CXDi Surveys"
            className="h-10 w-auto"
          />
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in to continue</h1>
            <p className="text-sm text-muted-foreground max-w-sm">
              Access to this dashboard requires authentication.
            </p>
          </div>
          <Button onClick={() => { window.location.href = "/login"; }} size="lg" className="w-full shadow-lg hover:shadow-xl transition-all">
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth} navItems={navItems} title={title} appName={appName}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
  navItems?: NavItem[];
  title?: string;
  appName?: string;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
  navItems = [],
  title,
  appName = "The CXDi Surveys",
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar, openMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const activeItem = navItems.find((item) => item.active) ?? navItems.find((item) => location === item.href);

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const handleNavClick = (href: string) => {
    setLocation(href);
    // Close mobile sidebar after navigation
    if (isMobile) setOpenMobile(false);
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          <SidebarHeader className="h-auto py-4 px-2 justify-between">
            <div className="flex items-center justify-between w-full">
              {!isCollapsed && (
                <Link href="/" className="flex items-center cursor-pointer flex-1 min-w-0">
                  <img
                    src="/manus-storage/cxdi-logo-transparent_f890673f.png"
                    alt="The CXDi Surveys"
                    className="h-20 w-auto"
                  />
                </Link>
              )}
              <button
                onClick={toggleSidebar}
                className="h-10 w-10 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0 ml-2"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-2 space-y-1">
              {navItems.map((item) => {
                const isActive = item.active ?? location === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => handleNavClick(item.href)}
                      tooltip={item.label}
                      className="h-12 transition-all font-medium text-sm"
                    >
                      {item.icon && <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />}
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-10 w-10 border shrink-0">
                    <AvatarFallback className="text-sm font-semibold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-semibold truncate leading-none">{user?.name || "-"}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1 capitalize">{(user as any)?.role?.replace("_", " ") || user?.email || "-"}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Desktop resize handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* Mobile top bar — sticky, full-width */}
        {isMobile && (
          <div className="flex border-b h-16 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/95 sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-10 w-10 rounded-lg" />
              <span className="font-bold text-base tracking-tight text-foreground truncate max-w-[160px]">
                {activeItem?.label ?? title ?? appName}
              </span>
            </div>
            <Link href="/" className="flex items-center cursor-pointer shrink-0">
              <img
                src="/manus-storage/cxdi-logo-transparent_f890673f.png"
                alt="The CXDi Surveys"
                className="h-8 w-auto"
              />
            </Link>
          </div>
        )}
        <main className="flex-1 p-4 sm:p-5 md:p-6 lg:p-8 overflow-x-hidden">{children}</main>
      </SidebarInset>
    </>
  );
}
