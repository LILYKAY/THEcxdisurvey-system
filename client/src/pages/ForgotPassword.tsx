import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [emailFound, setEmailFound] = useState<boolean | null>(null);

  const forgotMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: (data) => {
      setEmailFound(data.emailFound);
      setSubmitted(true);
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    forgotMutation.mutate({ email, origin: window.location.origin });
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
            Reset your password and{" "}
            <span className="text-amber-400">get back to work</span>.
          </blockquote>
          <p className="text-sidebar-foreground/70 text-base leading-relaxed max-w-md font-medium">
            We'll send you a secure link to reset your password. The link expires in 1 hour for your security.
          </p>
        </div>

        <div className="flex items-center gap-6 text-sidebar-foreground/60 text-sm font-medium">
          <span>Secure & encrypted</span>
          <span>·</span>
          <span>1 hour expiry</span>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-16 md:px-12 lg:px-16">
        {/* Mobile logo */}
        <div className="flex md:hidden items-center mb-12 sm:mb-16">
          <img src="/manus-storage/cxdi-logo-transparent_f890673f.png" alt="The CXDi Surveys" className="h-12 w-auto" />
        </div>

        <div className="w-full max-w-sm">
          {submitted ? (
            <div className="text-center space-y-6 sm:space-y-8">
              <div className="flex justify-center">
                <div className={`flex h-20 w-20 items-center justify-center rounded-full ${emailFound ? 'bg-emerald-100' : 'bg-red-100'}`}>
                  {emailFound
                    ? <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                    : <span className="text-3xl font-bold text-red-500">!</span>
                  }
                </div>
              </div>
              {emailFound ? (
                <>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Check your inbox</h1>
                    <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed font-medium">
                      A password reset link has been sent to{" "}
                      <strong className="text-foreground">{email}</strong>. The link expires in 1 hour.
                    </p>
                    <p className="mt-2 text-xs sm:text-sm text-muted-foreground font-medium">
                      Didn't receive the email? Check your spam folder or{" "}
                      <button
                        type="button"
                        className="text-primary hover:underline underline-offset-4 font-semibold"
                        onClick={() => { setSubmitted(false); setEmailFound(null); }}
                      >
                        try again
                      </button>
                      .
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">No account found</h1>
                    <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed font-medium">
                      There is no account registered with{" "}
                      <strong className="text-foreground">{email}</strong>. Please check the email address or{" "}
                      <Link href="/signup" className="text-primary hover:underline underline-offset-4 font-semibold">create a new account</Link>.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-sm font-semibold text-primary hover:underline underline-offset-4"
                    onClick={() => { setSubmitted(false); setEmailFound(null); }}
                  >
                    Try a different email
                  </button>
                </>
              )}
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mt-6 sm:mt-8"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8 sm:mb-10">
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Forgot password?</h1>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground font-medium">
                  Enter your email address and we will send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7">
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

                <Button
                  type="submit"
                  className="w-full h-12 font-semibold text-base gap-2"
                  disabled={forgotMutation.isPending}
                >
                  {forgotMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>

              <p className="mt-8 sm:mt-10 text-center text-sm sm:text-base text-muted-foreground font-medium">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-bold text-primary hover:underline underline-offset-4 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
