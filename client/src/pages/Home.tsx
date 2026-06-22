import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ChevronRight,
  Globe2,
  Lock,
  Shield,
  TrendingUp,
  Users,
  Menu,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";


const FEATURES = [
  {
    icon: Shield,
    title: "Immutable Audit Trail",
    description:
      "Every response is preserved forever. Updates create versioned history — no data is ever lost or overwritten without a record.",
  },
  {
    icon: TrendingUp,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleGetStarted = () => {
    if (!isAuthenticated) {
      navigate("/signup");
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
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="container flex h-16 sm:h-20 items-center justify-between gap-4">
          <a href="/" className="flex items-center shrink-0">
            <img src="/manus-storage/cxdi-logo-transparent_f890673f.png" alt="The CXDi Surveys" className="h-14 sm:h-16 w-auto object-contain" />
          </a>
          
          {/* Desktop Nav */}
          <nav className="hidden items-center gap-8 md:flex flex-1">
            <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#forms" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Survey Forms
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <Button onClick={handleGetStarted} size="sm" className="gap-1">
                Go to Dashboard
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/login")}
                  className="font-medium"
                >
                  Sign In
                </Button>
                <Button size="sm" className="gap-1">
                  Get Started
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background">
            <div className="container py-4 space-y-3">
              <a href="#features" className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2">
                Features
              </a>
              <a href="#forms" className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2">
                Survey Forms
              </a>
              <div className="pt-2 border-t border-border/40 space-y-2">
                {isAuthenticated ? (
                  <Button onClick={handleGetStarted} size="sm" className="w-full gap-1">
                    Go to Dashboard
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/login")}
                      className="w-full font-medium"
                    >
                      Sign In
                    </Button>
                    <Button size="sm" onClick={handleGetStarted} className="w-full gap-1">
                      Get Started
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-12 pb-12 sm:pt-20 sm:pb-24 md:pt-28 md:pb-32">
        {/* Background decoration */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden="true"
        >
          <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute top-40 right-0 h-[300px] w-[300px] rounded-full bg-accent/12 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="container text-center">
          <div className="animate-fade-in space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs sm:text-sm font-medium text-muted-foreground shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Built for Africa's growing business ecosystem
            </div>

            {/* Headline */}
            <h1 className="mx-auto max-w-4xl text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-foreground">
              Collect customer insights with{" "}
              <span className="text-gradient">precision and trust</span>
            </h1>

            {/* Subheading */}
            <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              A professional survey platform for businesses, organizations, and individuals across Africa. Every response is preserved, every insight is real-time.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Button size="lg" onClick={handleGetStarted} className="px-6 sm:px-8 shadow-elegant w-full sm:w-auto gap-2 font-semibold">
                Start collecting insights
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-16 sm:mt-20 grid grid-cols-2 gap-6 sm:gap-8 border-t border-border pt-10 sm:pt-12">
            {[
              { value: "100%", label: "Response data preserved" },
              { value: "Real-time", label: "Analytics & insights" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">{stat.value}</div>
                <div className="mt-2 text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About CXDi ── */}
      <section id="about" className="py-12 sm:py-20 md:py-28 bg-muted/40">
        <div className="container">
          <div className="mb-10 sm:mb-16 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              Trusted by leading African organizations
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              The CXDi (Customer Experience Design Initiative) is committed to helping African businesses understand and serve their customers better.
            </p>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-elegant transition-all hover:shadow-elegant-lg hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                <Globe2 className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-foreground">Pan-African Reach</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Serving businesses across Africa with survey tools designed for African markets and challenges.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-elegant transition-all hover:shadow-elegant-lg hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-foreground">Community Focused</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Building a community of organizations committed to understanding customer needs and improving service delivery.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-elegant transition-all hover:shadow-elegant-lg hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-foreground">Data-Driven Growth</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Empowering organizations with actionable insights to drive business growth and customer satisfaction.
              </p>
            </div>
          </div>
          <div className="mt-10 sm:mt-16 text-center">
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              Learn more about CXDi and our mission at
            </p>
            <a href="https://thecxdi.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold transition-colors">
              thecxdi.com
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-12 sm:py-20 md:py-28">
        <div className="container">
          <div className="mb-10 sm:mb-16 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              Everything you need to collect and understand feedback
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Designed for organizations that take data integrity and actionable insight seriously.
            </p>
          </div>
          <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-elegant transition-all hover:shadow-elegant-lg hover:-translate-y-1"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-3 text-lg font-bold text-foreground">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="py-12 sm:py-20 md:py-28 bg-primary text-primary-foreground">
        <div className="container text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
            Ready to collect better insights?
          </h2>
          <p className="text-sm sm:text-base opacity-90 max-w-xl mx-auto">
            Join organizations across Africa using CXDi Surveys to understand their customers better.
          </p>
          <Button size="lg" onClick={handleGetStarted} variant="secondary" className="gap-2 font-semibold">
            Get Started Free
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 bg-muted/30 py-8 sm:py-12">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; 2026 The CXDi Surveys. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
