import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Palette, Upload, Image, Eye, CheckCircle2, Loader2, X } from "lucide-react";

// ─── Email Preview Component ──────────────────────────────────────────────────
function EmailPreview({
  logoUrl,
  primaryColor,
  secondaryColor,
  signatureTag,
  usePlatformBranding,
  orgName,
}: {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  signatureTag: string;
  usePlatformBranding: boolean;
  orgName: string;
}) {
  return (
    <div className="bg-gray-100 rounded-lg p-4 text-sm font-sans">
      {/* Email wrapper */}
      <div className="bg-white rounded-md shadow-sm overflow-hidden max-w-md mx-auto border border-gray-200">
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center gap-3"
          style={{ backgroundColor: primaryColor }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="h-8 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="h-8 w-8 rounded bg-white/20 flex items-center justify-center">
              <Image className="w-4 h-4 text-white/70" />
            </div>
          )}
          <span className="text-white font-semibold text-base">
            {usePlatformBranding ? "CXDi SurveyPro" : orgName}
          </span>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-gray-800 font-medium">Hi [Recipient Name],</p>
          <p className="text-gray-600 text-xs leading-relaxed">
            You have been invited to complete a short survey. Your feedback is
            valuable and will help us improve our services. This survey takes
            approximately 3–5 minutes to complete.
          </p>
          <div className="pt-1">
            <a
              href="#"
              className="inline-block px-5 py-2 rounded text-white text-xs font-semibold"
              style={{ backgroundColor: secondaryColor }}
              onClick={(e) => e.preventDefault()}
            >
              Start Survey →
            </a>
          </div>
          <p className="text-gray-400 text-xs pt-1">
            This survey is confidential. Your responses will only be used for
            research and service improvement purposes.
          </p>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 border-t border-gray-100 flex items-center justify-between"
        >
          <span className="text-gray-400 text-xs">
            {signatureTag || (usePlatformBranding ? "Powered by CXDi SurveyPro" : orgName)}
          </span>
          <span className="text-gray-300 text-xs">Unsubscribe</span>
        </div>
      </div>
    </div>
  );
}

// ─── Colour Picker Row ────────────────────────────────────────────────────────
function ColorField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <p className="text-xs text-gray-500">{description}</p>
      <div className="flex items-center gap-3 mt-1">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
            id={`color-${label}`}
          />
          <label
            htmlFor={`color-${label}`}
            className="block w-10 h-10 rounded-md border-2 border-gray-200 cursor-pointer shadow-sm hover:border-gray-400 transition-colors"
            style={{ backgroundColor: value }}
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-sm w-32"
          maxLength={7}
          placeholder="#000000"
        />
        {/* Swatch presets */}
        <div className="flex gap-1.5">
          {["#00BCD4", "#0097A7", "#1d4ed8", "#7c3aed", "#059669", "#dc2626", "#d97706", "#374151"].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className="w-5 h-5 rounded-full border border-white shadow-sm hover:scale-110 transition-transform ring-offset-1 hover:ring-2 hover:ring-gray-400"
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrgEmailBranding() {
  const { orgId } = useParams<{ orgId: string }>();
  const orgIdNum = parseInt(orgId ?? "0");
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#00BCD4");
  const [secondaryColor, setSecondaryColor] = useState("#0097A7");
  const [signatureTag, setSignatureTag] = useState("");
  const [usePlatformBranding, setUsePlatformBranding] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewTab, setPreviewTab] = useState<"settings" | "preview">("settings");

  const { data: branding, isLoading } = trpc.branding.get.useQuery({ organizationId: orgIdNum });
  const { data: org } = trpc.org.get.useQuery({ id: orgIdNum });

  useEffect(() => {
    if (branding) {
      setLogoUrl(branding.logoUrl ?? "");
      setPrimaryColor(branding.primaryColor ?? "#00BCD4");
      setSecondaryColor(branding.secondaryColor ?? "#0097A7");
      setSignatureTag(branding.signatureTag ?? "");
      setUsePlatformBranding(branding.usePlatformBranding ?? true);
    }
  }, [branding]);

  const upsert = trpc.branding.upsert.useMutation({
    onSuccess: () => {
      utils.branding.get.invalidate({ organizationId: orgIdNum });
      toast.success("Branding settings saved successfully");
    },
    onError: (e) => toast.error(e.message),
  });

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo must be under 5 MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await fetch("/api/upload/logo", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error ?? "Upload failed");
      }
      const { url } = await res.json();
      setLogoUrl(url);
      toast.success("Logo uploaded successfully");
    } catch (err: any) {
      toast.error(err.message ?? "Logo upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSave() {
    upsert.mutate({
      organizationId: orgIdNum,
      logoUrl: logoUrl || undefined,
      primaryColor,
      secondaryColor,
      signatureTag: signatureTag || undefined,
      usePlatformBranding,
    });
  }

  const navItems = [
    { label: "Dashboard", href: `/org/${orgId}` },
    { label: "Surveys", href: `/org/${orgId}/surveys` },
    { label: "Contacts", href: `/org/${orgId}/contacts` },
    { label: "Settings", href: `/org/${orgId}/settings` },
    { label: "Email Branding", href: `/org/${orgId}/branding`, active: true },
  ];

  if (isLoading) {
    return (
      <DashboardLayout navItems={navItems} title="Email Branding">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Email Branding">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Palette className="w-6 h-6 text-teal-600" />
              Email Branding
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Customise how your survey invitation emails look to recipients
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewTab(previewTab === "preview" ? "settings" : "preview")}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              {previewTab === "preview" ? "Hide Preview" : "Show Preview"}
            </Button>
            <Button
              onClick={handleSave}
              disabled={upsert.isPending}
              className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
              size="sm"
            >
              {upsert.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {upsert.isPending ? "Saving…" : "Save Settings"}
            </Button>
          </div>
        </div>

        <div className={`grid gap-6 ${previewTab === "preview" ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
          {/* ── Settings Panel ── */}
          <div className="space-y-5">
            {/* Platform branding toggle */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Branding Mode</CardTitle>
                <CardDescription className="text-xs">
                  Choose whether to show CXDi SurveyPro branding or your own organisation's branding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Use Platform Branding</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {usePlatformBranding
                        ? "Emails will show \"CXDi SurveyPro\" in the header"
                        : "Emails will show your organisation name and logo"}
                    </p>
                  </div>
                  <Switch
                    checked={usePlatformBranding}
                    onCheckedChange={setUsePlatformBranding}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Logo upload */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Image className="w-4 h-4 text-gray-500" />
                  Organisation Logo
                </CardTitle>
                <CardDescription className="text-xs">
                  Upload a PNG, JPG, SVG, or WebP logo (max 5 MB). Recommended: 200×60 px on transparent background.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current logo preview */}
                {logoUrl && (
                  <div className="relative inline-block">
                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 inline-flex items-center gap-3">
                      <img
                        src={logoUrl}
                        alt="Current logo"
                        className="h-10 max-w-[160px] object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <button
                        type="button"
                        onClick={() => setLogoUrl("")}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove logo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs">Current</Badge>
                  </div>
                )}

                {/* Upload area */}
                <div
                  className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                      <p className="text-sm text-gray-500">Uploading logo…</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-gray-300 group-hover:text-teal-500 transition-colors" />
                      <p className="text-sm font-medium text-gray-600 group-hover:text-teal-700">
                        Click to upload logo
                      </p>
                      <p className="text-xs text-gray-400">PNG, JPG, SVG, WebP — up to 5 MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp,image/gif"
                  className="hidden"
                  onChange={handleLogoUpload}
                />


              </CardContent>
            </Card>

            {/* Colours */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="w-4 h-4 text-gray-500" />
                  Brand Colours
                </CardTitle>
                <CardDescription className="text-xs">
                  These colours are used in the email header, buttons, and accents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <ColorField
                  label="Primary Colour"
                  description="Used for the email header background"
                  value={primaryColor}
                  onChange={setPrimaryColor}
                />
                <Separator />
                <ColorField
                  label="Secondary / Button Colour"
                  description="Used for the call-to-action button in the email"
                  value={secondaryColor}
                  onChange={setSecondaryColor}
                />
              </CardContent>
            </Card>

            {/* Signature tag */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Email Footer Text</CardTitle>
                <CardDescription className="text-xs">
                  Short text shown at the bottom of every survey email. Leave blank to use the default.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={signatureTag}
                  onChange={(e) => setSignatureTag(e.target.value)}
                  placeholder={usePlatformBranding ? "Powered by CXDi SurveyPro" : org?.name ?? "Your Organisation"}
                  maxLength={120}
                  className="text-sm"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  {signatureTag.length}/120 characters
                </p>
              </CardContent>
            </Card>

            {/* Save button (bottom) */}
            <Button
              onClick={handleSave}
              disabled={upsert.isPending}
              className="w-full gap-2 bg-teal-600 hover:bg-teal-700 text-white h-11"
            >
              {upsert.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {upsert.isPending ? "Saving…" : "Save Branding Settings"}
            </Button>
          </div>

          {/* ── Preview Panel ── */}
          {previewTab === "preview" && (
            <div className="space-y-4">
              <div className="sticky top-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Eye className="w-4 h-4 text-gray-500" />
                      Live Email Preview
                    </CardTitle>
                    <CardDescription className="text-xs">
                      This is how your survey invitation email will look to recipients
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <EmailPreview
                      logoUrl={logoUrl}
                      primaryColor={primaryColor}
                      secondaryColor={secondaryColor}
                      signatureTag={signatureTag}
                      usePlatformBranding={usePlatformBranding}
                      orgName={org?.name ?? "Your Organisation"}
                    />
                  </CardContent>
                </Card>

                {/* Colour summary */}
                <Card className="mt-4">
                  <CardContent className="pt-4">
                    <div className="flex gap-3 items-center">
                      <div className="flex gap-2">
                        <div
                          className="w-8 h-8 rounded-full border-2 border-white shadow"
                          style={{ backgroundColor: primaryColor }}
                          title={`Primary: ${primaryColor}`}
                        />
                        <div
                          className="w-8 h-8 rounded-full border-2 border-white shadow"
                          style={{ backgroundColor: secondaryColor }}
                          title={`Secondary: ${secondaryColor}`}
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        <p>Primary: <span className="font-mono font-medium text-gray-700">{primaryColor}</span></p>
                        <p>Secondary: <span className="font-mono font-medium text-gray-700">{secondaryColor}</span></p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
