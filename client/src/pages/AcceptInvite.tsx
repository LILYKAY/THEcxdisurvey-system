import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

export default function AcceptInvite() {
  const [, navigate] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") ?? window.location.pathname.split("/invite/")[1] ?? "";

  const { data: invite, isLoading, error } = trpc.orgManager.validateInvite.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const [name, setName] = useState("");
  // Populate name from invite data once loaded
  const [nameInitialized, setNameInitialized] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  // Initialize name from invite data once loaded
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
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="mx-auto mb-3 text-destructive" size={40} />
            <p className="text-muted-foreground">Invalid invitation link.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Spinner />
      </div>
    );
  }

  if (error || !invite) {
    const msg = (error as any)?.message ?? "This invitation is invalid or has expired.";
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="mx-auto mb-3 text-destructive" size={40} />
            <p className="font-semibold text-lg mb-1">Invitation Error</p>
            <p className="text-muted-foreground text-sm">{msg}</p>
            <Button className="mt-4" variant="outline" onClick={() => navigate("/login")}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="mx-auto mb-3 text-green-500" size={40} />
            <p className="font-semibold text-lg mb-1">Account Created!</p>
            <p className="text-muted-foreground text-sm">Redirecting you to your dashboard…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 w-12 h-12 rounded-xl bg-[#03989e] flex items-center justify-center">
            <span className="text-white font-bold text-lg">CX</span>
          </div>
          <CardTitle className="text-xl">Accept Invitation</CardTitle>
          <CardDescription>
            You've been invited to manage <strong>{invite.orgName}</strong> on The CXDi Surveys.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={invite.email} disabled className="bg-muted" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>

            {acceptMutation.error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {(acceptMutation.error as any)?.message ?? "Something went wrong. Please try again."}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-[#03989e] hover:bg-[#027a7f] text-white"
              disabled={acceptMutation.isPending || password !== confirmPassword || !password || !name}
            >
              {acceptMutation.isPending ? <Spinner className="mr-2" /> : null}
              Create Account & Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
