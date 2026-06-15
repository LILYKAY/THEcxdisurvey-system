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
        <h1 className="text-2xl font-bold text-gray-900">Organisation Settings</h1>
        <Card>
          <CardHeader><CardTitle className="text-base">General Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Organisation Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Industry</Label>
                <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Financial Services" className="h-11" />
              </div>
              <div>
                <Label>Country</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Nigeria" className="h-11" />
              </div>
            </div>
            <Button onClick={() => update.mutate({ id: orgIdNum, name, description: description || undefined, industry: industry || undefined, country: country || undefined })} disabled={!name || update.isPending}             className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11">
              {update.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
