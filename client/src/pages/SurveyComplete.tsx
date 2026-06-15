import { Button } from "@/components/ui/button";
import { BarChart3, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

export default function SurveyComplete() {
  const [, navigate] = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container flex h-14 items-center">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary">
              <BarChart3 className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-serif text-base font-semibold text-foreground">The CXDi Surveys</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-md w-full text-center animate-fade-in">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Thank you for your response
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Your feedback has been recorded and will support future product, messaging,
            and customer experience improvements. Your response is securely stored with
            a full audit trail.
          </p>
          <div className="mt-8 rounded-xl border border-border bg-card p-5 shadow-elegant text-left space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Your response has been securely saved and will never be deleted.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                If you need to update your answers, you can use the same survey link again.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="mt-8"
            onClick={() => navigate("/")}
          >
            Return to home
          </Button>
        </div>
      </div>
    </div>
  );
}
