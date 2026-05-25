import { DashboardShell, ADMIN_NAV } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Building2, ClipboardList, ExternalLink, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

function CreateOrgDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");

  const create = trpc.organizations.create.useMutation({
    onSuccess: () => {
      toast.success("Organization created — all 4 survey forms are ready to share!");
      setOpen(false);
      onCreated();
    },
    onError: (e) => toast.error(e.message),
  });

  const autoSlug = (n: string) =>
    n.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New Organization
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              placeholder="Acme Audit Partners"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(autoSlug(e.target.value));
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Slug (URL identifier)</Label>
            <Input
              placeholder="acme-audit"
              value={slug}
              onChange={(e) => setSlug(autoSlug(e.target.value))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Industry</Label>
              <Input placeholder="Audit & Assurance" value={industry} onChange={(e) => setIndustry(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Input placeholder="Nigeria" value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
          </div>
          <Button
            className="w-full"
            disabled={!name || !slug || create.isPending}
            onClick={() => create.mutate({ name, slug, industry, country })}
          >
            Create Organization
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminOrganizations() {
  const utils = trpc.useUtils();
  const { data: orgs, isLoading } = trpc.organizations.list.useQuery();
  const [, navigate] = useLocation();

  return (
    <DashboardShell navItems={ADMIN_NAV} title="Organizations">
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {orgs?.length ?? 0} organization{orgs?.length !== 1 ? "s" : ""} registered
          </p>
          <CreateOrgDialog onCreated={() => utils.organizations.list.invalidate()} />
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-secondary" />
            ))}
          </div>
        ) : orgs?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="font-semibold text-foreground">No organizations yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first organization to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {orgs?.map((org) => (
              <Card key={org.id} className="shadow-elegant border-border hover:shadow-elegant-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {org.industry ?? "General"}
                    </Badge>
                  </div>
                  <CardTitle className="mt-3 text-base">{org.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">/{org.slug}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {org.country && (
                    <p className="text-xs text-muted-foreground">{org.country}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1.5 text-xs"
                      onClick={() => navigate(`/org/${org.id}`)}
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Dashboard
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1.5 text-xs"
                      onClick={() => navigate("/admin/surveys")}
                    >
                      <ClipboardList className="h-3 w-3" />
                      View Survey Links
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
