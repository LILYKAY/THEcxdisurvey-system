import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Eye, EyeOff, Loader2, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      const user = await utils.auth.me.fetch();
      if (user?.role === "admin") {
        navigate("/admin");
      } else if (user?.role === "org_manager" && (user as any).managedOrgId) {
        navigate(`/org/${(user as any).managedOrgId}`);
      } else {
        navigate("/org-select");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Invalid email or password");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    loginMutation.mutate({ email, password, rememberMe });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* ── Left panel (branding) — hidden on small screens ── */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 flex-col justify-between bg-sidebar text-sidebar-foreground p-12 lg:p-16">
        <div className="flex items-center">
          <img src="/manus-storage/cxdi-logo-transparent_f890673f.png" alt="The CXDi Surveys" className="h-14 w-auto" />
        </div>

        <div className="space-y-8">
          <blockquote className="text-3xl lg:text-4xl font-bold leading-tight text-sidebar-foreground">
            Collect customer insights with{" "}
            <span className="text-amber-400">precision and trust</span>.
          </blockquote>
          <p className="text-sidebar-foreground/70 text-base leading-relaxed max-w-md font-medium">
            A professional survey platform for businesses, organizations, and individuals across Africa. Every response is preserved, every insight is real-time.
          </p>
        </div>

        <div className="flex items-center gap-6 text-sidebar-foreground/60 text-sm font-medium">
          <span>4 Pre-built forms</span>
          <span>·</span>
          <span>100% data preserved</span>
          <span>·</span>
          <span>Real-time analytics</span>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-16 md:px-12 lg:px-16">
        {/* Mobile logo */}
        <div className="flex md:hidden items-center mb-12 sm:mb-16">
          <img src="/manus-storage/cxdi-logo-transparent_f890673f.png" alt="The CXDi Surveys" className="h-12 w-auto" />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8 sm:mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Welcome back</h1>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground font-medium">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6" autoComplete="on">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-card border-border focus-visible:ring-primary text-base"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-12 bg-card border-border focus-visible:ring-primary text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-3 pt-2">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-5 w-5 rounded border-border accent-primary cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer select-none font-medium">
                Remember me
              </label>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              className="w-full h-12 font-semibold text-base gap-2 mt-6 sm:mt-8"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-8 sm:mt-10 text-center text-sm sm:text-base text-muted-foreground font-medium">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="font-bold text-primary hover:underline underline-offset-4 transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
