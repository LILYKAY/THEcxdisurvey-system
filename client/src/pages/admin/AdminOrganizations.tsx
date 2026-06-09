import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Building2, Lock, Unlock } from "lucide-react";

export default function AdminOrganizations() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");

  const { data: orgs, isLoading } = trpc.admin.allOrgs.useQuery();

  const create = trpc.org.create.useMutation({
    onSuccess: () => { utils.admin.allOrgs.invalidate(); setShowCreate(false); setName(""); setSlug(""); toast.success("Organisation created"); },
    onError: (e: any) => toast.error(e.message),
  });

  const restrictOrg = trpc.admin.restrictOrg.useMutation({
    onSuccess: () => { utils.admin.allOrgs.invalidate(); toast.success("Updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const navItems = [
    { label: "Overview", href: "/admin" },
    { label: "Organisations", href: "/admin/organizations", active: true },
    { label: "Users", href: "/admin/users" },
    { label: "Surveys", href: "/admin/surveys" },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Organisations" appName="CXDi Admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Organisations</h1>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="w-4 h-4 mr-2" />New Org</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Organisation</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div><Label>Slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. acme-corp" /></div>
                <div><Label>Industry</Label><Input value={industry} onChange={(e) => setIndustry(e.target.value)} /></div>
                <div><Label>Country</Label><Input value={country} onChange={(e) => setCountry(e.target.value)} /></div>
                <Button onClick={() => create.mutate({ name, slug, industry: industry || undefined, country: country || undefined })} disabled={!name || !slug || create.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white">{create.isPending ? "Creating..." : "Create"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {isLoading ? <div className="text-center text-gray-500 py-8">Loading...</div> : !orgs?.length ? (
          <Card><CardContent className="p-12 text-center"><Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No organisations yet</p></CardContent></Card>
        ) : (
          <div className="space-y-2">
            {orgs.map((org: any) => (
              <Card key={org.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1 cursor-pointer" onClick={() => navigate(`/org/${org.id}`)}>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{org.name}</p>
                      {org.isRestricted && <Badge variant="outline" className="text-red-600 border-red-200 text-xs">Restricted</Badge>}
                    </div>
                    <p className="text-xs text-gray-500">{org.slug} {org.industry ? `· ${org.industry}` : ""} {org.country ? `· ${org.country}` : ""}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {org.isRestricted ? (
                      <Button variant="outline" size="sm" onClick={() => restrictOrg.mutate({ orgId: org.id, isRestricted: false })} className="text-green-600 border-green-200 hover:bg-green-50">
                        <Unlock className="w-3 h-3 sm:mr-1" /><span className="hidden sm:inline">Unrestrict</span>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => restrictOrg.mutate({ orgId: org.id, isRestricted: true, reason: "Admin restriction" })} className="text-red-600 border-red-200 hover:bg-red-50">
                        <Lock className="w-3 h-3 sm:mr-1" /><span className="hidden sm:inline">Restrict</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
