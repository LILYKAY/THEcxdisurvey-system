import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function OrgSettings() {
  const { orgId } = useParams<{ orgId: string }>();
  const orgIdNum = parseInt(orgId ?? "0");
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");

  const { data: org } = trpc.org.get.useQuery({ id: orgIdNum });

  useEffect(() => {
    if (org) {
      setName(org.name);
      setDescription(org.description ?? "");
      setIndustry(org.industry ?? "");
      setCountry(org.country ?? "");
    }
  }, [org]);

  const update = trpc.org.update.useMutation({
    onSuccess: () => { utils.org.get.invalidate({ id: orgIdNum }); toast.success("Settings saved"); },
    onError: (e) => toast.error(e.message),
  });

  const navItems = [
    { label: "Dashboard", href: `/org/${orgId}` },
    { label: "Surveys", href: `/org/${orgId}/surveys` },
    { label: "Settings", href: `/org/${orgId}/settings`, active: true },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Settings">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Organisation Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your organization details</p>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-lg font-semibold">General Information</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label className="font-medium mb-2 block">Organisation Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
            </div>
            <div>
              <Label className="font-medium mb-2 block">Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label className="font-medium mb-2 block">Industry</Label>
                <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Financial Services" className="h-11" />
              </div>
              <div>
                <Label className="font-medium mb-2 block">Country</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Nigeria" className="h-11" />
              </div>
            </div>
            <Button onClick={() => update.mutate({ id: orgIdNum, name, description: description || undefined, industry: industry || undefined, country: country || undefined })} disabled={!name || update.isPending} className="w-full h-11 font-medium">
              {update.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
