import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function AcceptInvite() {
  const [, navigate] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") ?? window.location.pathname.split("/invite/")[1] ?? "";

  const { data: invite, isLoading, error } = trpc.orgManager.validateInvite.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const [name, setName] = useState("");
  const [nameInitialized, setNameInitialized] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

  if (invite && !nameInitialized) {
    if (invite.name) setName(invite.name);
    setNameInitialized(true);
  }

  const acceptMutation = trpc.orgManager.acceptInvite.useMutation({
    onSuccess: (data) => {
      setDone(true);
      setTimeout(() => navigate(`/org/${data.orgId}`), 2000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return;
    acceptMutation.mutate({ token, name: name || invite?.name || "", password });
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-destructive/20">
          <CardContent className="pt-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <div>
              <p className="font-semibold text-lg text-foreground">Invalid Link</p>
              <p className="text-sm text-muted-foreground mt-1">The invitation link is missing or invalid.</p>
            </div>
            <Button onClick={() => navigate("/login")} className="w-full h-12 font-semibold">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  if (error || !invite) {
    const msg = (error as any)?.message ?? "This invitation is invalid or has expired.";
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-destructive/20">
          <CardContent className="pt-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <div>
              <p className="font-semibold text-lg text-foreground">Invitation Error</p>
              <p className="text-sm text-muted-foreground mt-1">{msg}</p>
            </div>
            <Button onClick={() => navigate("/login")} className="w-full h-12 font-semibold">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-emerald-200/50">
          <CardContent className="pt-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
            <div>
              <p className="font-semibold text-lg text-foreground">Account Created!</p>
              <p className="text-sm text-muted-foreground mt-1">Redirecting you to your dashboard…</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4 sm:pb-6">
          <div className="mx-auto mb-4 w-14 h-14 rounded-xl bg-primary flex items-center justify-center">
            <img src="/manus-storage/cxdi-logo-transparent_f890673f.png" alt="CXDi" className="h-8 w-auto" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold">Accept Invitation</CardTitle>
          <CardDescription className="text-sm sm:text-base mt-2">
            You've been invited to manage{" "}
            <strong className="text-foreground font-semibold">{invite.orgName}</strong> on The CXDi Surveys.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Email (disabled) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={invite.email}
                disabled
                className="h-12 bg-muted border-border text-base"
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-foreground">
                Your Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-12 bg-card border-border focus-visible:ring-primary text-base"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 pr-12 bg-card border-border focus-visible:ring-primary text-base"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs sm:text-sm text-destructive font-medium">Passwords do not match</p>
              )}
            </div>

            {/* Error message */}
            {acceptMutation.error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
                <p className="text-sm text-destructive font-medium">
                  {(acceptMutation.error as any)?.message ?? "Something went wrong. Please try again."}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 font-semibold text-base gap-2 mt-6 sm:mt-8"
              disabled={acceptMutation.isPending || password !== confirmPassword || !password || !name}
            >
              {acceptMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create Account & Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
