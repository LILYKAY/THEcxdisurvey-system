import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, LogOut, Plus, Loader2, BarChart3 } from "lucide-react";
import { toast } from "sonner";

export default function OrgSelect() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const utils = trpc.useUtils();

  // Create org form state
  const [showCreate, setShowCreate] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");

  const { data: orgs, isLoading } = trpc.org.list.useQuery(undefined, {
    enabled: !!user,
  });

  const createOrg = trpc.org.create.useMutation({
    onSuccess: async (org) => {
      await utils.auth.me.invalidate();
      await utils.org.list.invalidate();
      toast.success("Organisation created!");
      navigate(`/org/${org.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  // Auto-redirect if user has exactly one org
  useEffect(() => {
    if (!orgs) return;
    if (orgs.length === 1) {
      navigate(`/org/${orgs[0].id}`);
    }
  }, [orgs, navigate]);

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    setOrgName(val);
    setOrgSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) { toast.error("Organisation name is required"); return; }
    if (!orgSlug.trim()) { toast.error("Slug is required"); return; }
    createOrg.mutate({ name: orgName.trim(), slug: orgSlug.trim(), industry: industry || undefined, country: country || undefined });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <BarChart3 className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">SurveyPro</h1>
          <p className="text-sm text-muted-foreground text-center">
            Welcome, <span className="font-medium text-foreground">{user?.name}</span>
          </p>
        </div>

        {/* No org yet — show create form or prompt */}
        {!orgs?.length ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Set up your organisation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showCreate ? (
                <div className="text-center py-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    You don't have an organisation yet. Create one to start building surveys and collecting responses.
                  </p>
                  <Button className="w-full gap-2" onClick={() => setShowCreate(true)}>
                    <Plus className="w-4 h-4" /> Create your organisation
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="orgName">Organisation name <span className="text-destructive">*</span></Label>
                    <Input
                      id="orgName"
                      placeholder="e.g. Acme Corp"
                      value={orgName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="orgSlug">URL slug <span className="text-destructive">*</span></Label>
                    <Input
                      id="orgSlug"
                      placeholder="e.g. acme-corp"
                      value={orgSlug}
                      onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="industry">Industry</Label>
                      <Input id="industry" placeholder="e.g. Healthcare" value={industry} onChange={(e) => setIndustry(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="country">Country</Label>
                      <Input id="country" placeholder="e.g. Kenya" value={country} onChange={(e) => setCountry(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 gap-2" disabled={createOrg.isPending}>
                      {createOrg.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : "Create"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        ) : orgs.length === 1 ? (
          // Single org — show spinner while auto-redirecting
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          // Multiple orgs — let user choose
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground text-center">Select an organisation to continue</p>
            {orgs.map((org) => (
              <Card
                key={org.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/40"
                onClick={() => navigate(`/org/${org.id}`)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{org.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {org.industry ?? ""}{org.country ? ` · ${org.country}` : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              variant="outline"
              className="w-full gap-2 border-dashed"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="w-4 h-4" /> Create another organisation
            </Button>
            {showCreate && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">New organisation</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreate} className="space-y-3">
                    <Input placeholder="Organisation name" value={orgName} onChange={(e) => handleNameChange(e.target.value)} required />
                    <Input placeholder="URL slug (e.g. acme-corp)" value={orgSlug} onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} required />
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
                      <Button type="submit" className="flex-1" disabled={createOrg.isPending}>
                        {createOrg.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Button variant="ghost" onClick={logout} className="w-full text-muted-foreground gap-2">
          <LogOut className="w-4 h-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}
