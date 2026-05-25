import { DashboardShell, getOrgNav } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Building2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";

export default function OrgSettings() {
  const { orgId } = useParams<{ orgId: string }>();
  const nav = getOrgNav(orgId);
  const utils = trpc.useUtils();

  const { data: org, isLoading } = trpc.organizations.get.useQuery({ id: Number(orgId) });
  const update = trpc.organizations.update.useMutation({
    onSuccess: () => {
      toast.success("Organization updated");
      utils.organizations.get.invalidate({ id: Number(orgId) });
    },
    onError: (e) => toast.error(e.message),
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    if (org) {
      setName(org.name ?? "");
      setDescription(org.description ?? "");
      setIndustry(org.industry ?? "");
      setCountry(org.country ?? "");
    }
  }, [org]);

  if (isLoading) {
    return (
      <DashboardShell navItems={nav}>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell navItems={nav} title="Organization Settings">
      <div className="p-6 max-w-2xl">
        <Card className="shadow-elegant border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Organization Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Organization Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none min-h-[80px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your organization…"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Industry</Label>
                <Input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Audit & Assurance"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Nigeria"
                />
              </div>
            </div>
            <div className="pt-2">
              <Button
                className="gap-2"
                disabled={!name || update.isPending}
                onClick={() =>
                  update.mutate({
                    id: Number(orgId),
                    name,
                    description,
                    industry,
                    country,
                  })
                }
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Org identifier */}
        <Card className="mt-4 shadow-elegant border-border">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-foreground mb-1">Organization Identifier</p>
            <p className="text-xs text-muted-foreground mb-3">
              This slug is used in URLs and cannot be changed after creation.
            </p>
            <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-4 py-2.5">
              <span className="text-xs text-muted-foreground font-mono">{org?.slug}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
