import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import {
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Globe2,
  Lock,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { useLocation } from "wouter";

const FEATURES = [
  {
    icon: Shield,
    title: "Immutable Audit Trail",
    description:
      "Every response is preserved forever. Updates create versioned history — no data is ever lost or overwritten without a record.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description:
      "Aggregated charts, response trends, and per-question breakdowns update instantly as new submissions arrive.",
  },
  {
    icon: Globe2,
    title: "Shareable Survey Links",
    description:
      "Generate unique links for each survey segment. Respondents fill out forms without needing an account.",
  },
  {
    icon: Users,
    title: "Multi-Tenant Organizations",
    description:
      "Each organization sees only its own data. Isolated analytics and respondent management per account.",
  },
  {
    icon: TrendingUp,
    title: "Structured Insight Forms",
    description:
      "Four pre-built survey forms targeting current customers, lapsed customers, repeat trials, and single-trial firms.",
  },
  {
    icon: Lock,
    title: "Role-Based Access",
    description:
      "Admins, organization owners, and respondents each have precisely scoped permissions throughout the platform.",
  },
];

const FORMS = [
  {
    key: "current_customers",
    label: "Current Customers",
    count: 10,
    color: "bg-indigo-50 text-indigo-700 border-indigo-100",
    dot: "bg-indigo-500",
  },
  {
    key: "dropped_customers",
    label: "Dropped / Lapsed",
    count: 9,
    color: "bg-amber-50 text-amber-700 border-amber-100",
    dot: "bg-amber-500",
  },
  {
    key: "repeat_trial",
    label: "Repeat Trial Firms",
    count: 8,
    color: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-500",
  },
  {
    key: "single_trial",
    label: "Single-Trial Firms",
    count: 5,
    color: "bg-rose-50 text-rose-700 border-rose-100",
    dot: "bg-rose-500",
  },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const handleGetStarted = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
    } else if (user?.role === "admin") {
      navigate("/admin");
    } else if (user?.role === "org_owner") {
      navigate("/admin");
    } else {
      navigate("/admin");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BarChart3 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-serif text-lg font-semibold text-foreground">SurveyPro</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#forms" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Survey Forms
            </a>
          </nav>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button onClick={handleGetStarted} size="sm">
                Go to Dashboard
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  Sign In
                </Button>
                <Button size="sm" onClick={handleGetStarted}>
                  Get Started
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-24 pb-20">
        {/* Background decoration */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden="true"
        >
          <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute top-20 right-0 h-[400px] w-[400px] rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="container text-center">
          <div className="animate-fade-in">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Built for Africa's growing business ecosystem
            </div>
            <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
              Collect customer insights with{" "}
              <span className="text-gradient">precision and trust</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              A professional survey platform for businesses, organizations, and individuals
              across Africa. Every response is preserved, every insight is real-time.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" onClick={handleGetStarted} className="px-8 shadow-elegant">
                Start collecting insights
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="px-8">
                View demo
              </Button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-20 grid grid-cols-3 gap-8 border-t border-border pt-12 animate-fade-in">
            {[
              { value: "4", label: "Pre-built survey forms" },
              { value: "100%", label: "Response data preserved" },
              { value: "Real-time", label: "Analytics & insights" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-serif text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Survey Forms ── */}
      <section id="forms" className="py-20 bg-secondary/30">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">
              Four structured survey forms
            </h2>
            <p className="mt-3 text-muted-foreground">
              Each form is purpose-built for a specific respondent segment with tailored questions.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
            {FORMS.map((form) => (
              <div
                key={form.key}
                className={`rounded-xl border p-6 shadow-elegant transition-shadow hover:shadow-elegant-lg ${form.color}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`h-2 w-2 rounded-full ${form.dot}`} />
                  <span className="text-xs font-medium uppercase tracking-wider opacity-70">
                    {form.count} questions
                  </span>
                </div>
                <h3 className="font-serif text-lg font-semibold">{form.label}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">
              Everything you need to collect and understand feedback
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Designed for organizations that take data integrity and actionable insight seriously.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6 shadow-elegant transition-shadow hover:shadow-elegant-lg"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-primary">
        <div className="container text-center">
          <h2 className="font-serif text-3xl font-bold text-primary-foreground">
            Ready to start collecting insights?
          </h2>
          <p className="mt-4 text-primary-foreground/70">
            Sign in to access your dashboard and begin distributing surveys today.
          </p>
          <Button
            size="lg"
            className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90 px-10 shadow-elegant"
            onClick={handleGetStarted}
          >
            Get started for free
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <BarChart3 className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">SurveyPro</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} SurveyPro. Built for Africa's business ecosystem.
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            All data preserved with full audit trail
          </div>
        </div>
      </footer>
    </div>
  );
}
