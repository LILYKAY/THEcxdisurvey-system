import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Palette } from "lucide-react";

export default function OrgEmailBranding() {
  const { orgId } = useParams<{ orgId: string }>();
  const orgIdNum = parseInt(orgId ?? "0");
  const utils = trpc.useUtils();

  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#1d4ed8");
  const [secondaryColor, setSecondaryColor] = useState("#3b82f6");
  const [signatureTag, setSignatureTag] = useState("");
  const [usePlatformBranding, setUsePlatformBranding] = useState(true);

  const { data: branding } = trpc.branding.get.useQuery({ organizationId: orgIdNum });

  useEffect(() => {
    if (branding) {
      setLogoUrl(branding.logoUrl ?? "");
      setPrimaryColor(branding.primaryColor ?? "#1d4ed8");
      setSecondaryColor(branding.secondaryColor ?? "#3b82f6");
      setSignatureTag(branding.signatureTag ?? "");
      setUsePlatformBranding(branding.usePlatformBranding ?? true);
    }
  }, [branding]);

  const upsert = trpc.branding.upsert.useMutation({
    onSuccess: () => {
      utils.branding.get.invalidate({ organizationId: orgIdNum });
      toast.success("Branding settings saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const navItems = [
    { label: "Dashboard", href: `/org/${orgId}` },
    { label: "Surveys", href: `/org/${orgId}/surveys` },
    { label: "Settings", href: `/org/${orgId}/settings` },
    { label: "Email Branding", href: `/org/${orgId}/branding`, active: true },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Email Branding">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Branding</h1>
          <p className="text-sm text-gray-500 mt-1">Customise how your survey emails look to recipients</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="w-4 h-4" /> Brand Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Use Platform Branding</Label>
                <p className="text-xs text-gray-500 mt-0.5">Show CXDi SurveyPro branding in emails</p>
              </div>
              <Switch checked={usePlatformBranding} onCheckedChange={setUsePlatformBranding} />
            </div>

            <div>
              <Label>Logo URL</Label>
              <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://yoursite.com/logo.png" />
              <p className="text-xs text-gray-400 mt-1">Direct URL to your company logo (PNG or SVG recommended)</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Primary Colour</Label>
                <div className="flex gap-2 mt-1">
                  <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-10 w-12 rounded border cursor-pointer" />
                  <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="font-mono" />
                </div>
              </div>
              <div>
                <Label>Secondary Colour</Label>
                <div className="flex gap-2 mt-1">
                  <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="h-10 w-12 rounded border cursor-pointer" />
                  <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="font-mono" />
                </div>
              </div>
            </div>

            <div>
              <Label>Email Signature Tag</Label>
              <Input value={signatureTag} onChange={(e) => setSignatureTag(e.target.value)} placeholder="e.g. Powered by Acme Corp" />
              <p className="text-xs text-gray-400 mt-1">Short text shown at the bottom of survey emails</p>
            </div>

            <Button
              onClick={() => upsert.mutate({ organizationId: orgIdNum, logoUrl: logoUrl || undefined, primaryColor, secondaryColor, signatureTag: signatureTag || undefined, usePlatformBranding })}
              disabled={upsert.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {upsert.isPending ? "Saving..." : "Save Branding Settings"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
