import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Eye, EyeOff, Loader2, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Signup() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const utils = trpc.useUtils();

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      const user = await utils.auth.me.fetch();
      if (user?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/org-select");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Registration failed. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    registerMutation.mutate({ name, email, password });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* ── Left panel (branding) ── */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 flex-col justify-between bg-sidebar text-sidebar-foreground p-12 lg:p-16">
        <div className="flex items-center">
          <img src="/manus-storage/cxdi-logo-transparent_f890673f.png" alt="The CXDi Surveys" className="h-14 w-auto" />
        </div>

        <div className="space-y-8">
          <blockquote className="text-3xl lg:text-4xl font-bold leading-tight text-sidebar-foreground">
            Start collecting insights{" "}
            <span className="text-amber-400">from day one</span>.
          </blockquote>
          <p className="text-sidebar-foreground/70 text-base leading-relaxed max-w-md font-medium">
            Join organizations across Africa using The CXDi Surveys to understand their customers, track responses over time, and make data-driven decisions.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { value: "4", label: "Survey forms" },
            { value: "100%", label: "Data preserved" },
            { value: "Real-time", label: "Analytics" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-sidebar-accent/30 px-4 py-4">
              <p className="text-2xl font-bold text-sidebar-foreground">{stat.value}</p>
              <p className="text-xs text-sidebar-foreground/60 mt-1 font-medium">{stat.label}</p>
            </div>
          ))}
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
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Create account</h1>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground font-medium">
              Start collecting insights today
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-foreground">
                Full name
              </Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 bg-card border-border focus-visible:ring-primary text-base"
                required
              />
            </div>

            {/* Email */}
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

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
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

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
                Confirm password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 pr-12 bg-card border-border focus-visible:ring-primary text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Sign Up Button */}
            <Button
              type="submit"
              className="w-full h-12 font-semibold text-base gap-2 mt-6 sm:mt-8"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Create account
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          {/* Sign In Link */}
          <p className="mt-8 sm:mt-10 text-center text-sm sm:text-base text-muted-foreground font-medium">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-primary hover:underline underline-offset-4 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
