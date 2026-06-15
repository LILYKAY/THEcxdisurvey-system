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
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 flex-col justify-between bg-sidebar text-sidebar-foreground p-10 lg:p-16">
        <div className="flex items-center">
          <img src="/manus-storage/cxdi-logo-transparent_f890673f.png" alt="The CXDi Surveys" className="h-10 w-auto rounded-lg" />
        </div>

        <div className="space-y-6">
          <blockquote className="font-serif text-3xl lg:text-4xl font-medium leading-snug text-sidebar-foreground">
            "Collect customer insights with{" "}
            <span className="text-amber-400">precision and trust</span>."
          </blockquote>
          <p className="text-sidebar-foreground/60 text-base leading-relaxed max-w-md">
            A professional survey platform for businesses, organizations, and individuals
            across Africa. Every response is preserved, every insight is real-time.
          </p>
        </div>

        <div className="flex items-center gap-8 text-sidebar-foreground/50 text-sm">
          <span>4 Pre-built survey forms</span>
          <span>·</span>
          <span>100% data preserved</span>
          <span>·</span>
          <span>Real-time analytics</span>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10 md:px-12 lg:px-16">
        {/* Mobile logo */}
        <div className="flex md:hidden items-center mb-10">
          <img src="/manus-storage/cxdi-logo-transparent_f890673f.png" alt="The CXDi Surveys" className="h-9 w-auto rounded-lg" />
        </div>

        <div className="w-full max-w-sm">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className={`flex h-16 w-16 items-center justify-center rounded-full ${emailFound ? 'bg-emerald-100' : 'bg-red-100'}`}>
                  {emailFound
                    ? <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                    : <span className="text-2xl font-bold text-red-500">!</span>
                  }
                </div>
              </div>
              {emailFound ? (
                <>
                  <h1 className="font-serif text-2xl font-semibold text-foreground">Check your inbox</h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A password reset link has been sent to{" "}
                    <strong className="text-foreground">{email}</strong>. The link expires in 1 hour.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Didn't receive the email? Check your spam folder or{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline underline-offset-4"
                      onClick={() => { setSubmitted(false); setEmailFound(null); }}
                    >
                      try again
                    </button>
                    .
                  </p>
                </>
              ) : (
                <>
                  <h1 className="font-serif text-2xl font-semibold text-foreground">No account found</h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    There is no account registered with{" "}
                    <strong className="text-foreground">{email}</strong>. Please check the email address or{" "}
                    <Link href="/signup" className="text-primary hover:underline underline-offset-4">create a new account</Link>.
                  </p>
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline underline-offset-4"
                    onClick={() => { setSubmitted(false); setEmailFound(null); }}
                  >
                    Try a different email
                  </button>
                </>
              )}
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-4"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="font-serif text-3xl font-semibold text-foreground">Forgot password?</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter your email address and we will send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 bg-card border-border focus-visible:ring-primary"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-medium"
                  disabled={forgotMutation.isPending}
                >
                  {forgotMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending reset link…
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline underline-offset-4"
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
