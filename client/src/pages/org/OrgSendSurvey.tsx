import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Send, Users, Mail, Link2, Copy } from "lucide-react";

export default function OrgSendSurvey() {
  const { orgId, surveyId } = useParams<{ orgId: string; surveyId: string }>();
  const orgIdNum = parseInt(orgId ?? "0");
  const surveyIdNum = parseInt(surveyId ?? "0");
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [selectedAudience, setSelectedAudience] = useState("");
  const [channel, setChannel] = useState<"email" | "whatsapp" | "sms">("email");
  const [personalMessage, setPersonalMessage] = useState("");
  const [singleEmail, setSingleEmail] = useState("");
  const [singleName, setSingleName] = useState("");

  const { data: survey, isLoading: surveyLoading, error: surveyError } = trpc.surveys.get.useQuery(
    { id: surveyIdNum },
    { retry: false }
  );
  const { data: audiences } = trpc.audiences.list.useQuery({ organizationId: orgIdNum });
  const { data: links } = trpc.surveys.getLinks.useQuery({ surveyId: surveyIdNum });

  const sendToAudience = trpc.send.toAudience.useMutation({
    onSuccess: (result) => {
      toast.success(`Sent to ${result.sent} contacts (${result.failed} failed)`);
      utils.surveys.getLinks.invalidate({ surveyId: surveyIdNum });
    },
    onError: (e) => toast.error(e.message),
  });

  const sendToEmail = trpc.send.toEmail.useMutation({
    onSuccess: () => { toast.success("Survey sent successfully"); setSingleEmail(""); setSingleName(""); },
    onError: (e) => toast.error(e.message),
  });

  const createLink = trpc.surveys.createLink.useMutation({
    onSuccess: () => { utils.surveys.getLinks.invalidate({ surveyId: surveyIdNum }); toast.success("Survey link created"); },
    onError: (e) => toast.error(e.message),
  });

  const navItems = [
    { label: "Dashboard", href: `/org/${orgId}` },
    { label: "Surveys", href: `/org/${orgId}/surveys` },
    { label: "Send Survey", href: `/org/${orgId}/surveys/${surveyId}/send`, active: true },
  ];

  const surveyBaseUrl = window.location.origin;

  if (surveyLoading) {
    return (
      <DashboardLayout navItems={navItems} title="Send Survey">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-40 bg-gray-200 rounded" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (surveyError || !survey) {
    return (
      <DashboardLayout navItems={[{ label: "Dashboard", href: `/org/${orgId}` }, { label: "Surveys", href: `/org/${orgId}/surveys` }]} title="Send Survey">
        <div className="max-w-3xl mx-auto">
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Survey not found</h2>
            <p className="text-gray-500 mb-6">The survey you are looking for does not exist or you do not have access to it.</p>
            <Button onClick={() => navigate(`/org/${orgId}/surveys`)} className="bg-[#03989e] hover:bg-[#116962] text-white">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Surveys
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Send Survey">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/org/${orgId}/surveys/${surveyId}/builder`)} className="text-gray-500 shrink-0">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Send: {survey?.title}</h1>
            <p className="text-sm text-gray-500">Choose how to distribute this survey</p>
          </div>
        </div>

        <Tabs defaultValue="audience">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="audience" className="gap-1 text-xs sm:text-sm">
              <Users className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline">Audience</span>
              <span className="xs:hidden">Group</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-1 text-xs sm:text-sm">
              <Mail className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline">Single Email</span>
              <span className="xs:hidden">Email</span>
            </TabsTrigger>
            <TabsTrigger value="link" className="gap-1 text-xs sm:text-sm">
              <Link2 className="w-4 h-4 shrink-0" />
              <span>Link</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="audience">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Send to Audience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Audience</Label>
                  <Select value={selectedAudience} onValueChange={setSelectedAudience}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an audience..." />
                    </SelectTrigger>
                    <SelectContent>
                      {audiences?.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.name} ({a.contactCount} contacts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Channel</Label>
                  <Select value={channel} onValueChange={(v) => setChannel(v as "email" | "whatsapp" | "sms")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Personal Message (optional)</Label>
                  <Textarea value={personalMessage} onChange={(e) => setPersonalMessage(e.target.value)} placeholder="Add a personal note to recipients..." rows={3} />
                </div>
                <Button
                  onClick={() => sendToAudience.mutate({ organizationId: orgIdNum, surveyId: surveyIdNum, audienceId: parseInt(selectedAudience), channel, personalMessage: personalMessage || undefined, origin: window.location.origin })}
                  disabled={!selectedAudience || sendToAudience.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendToAudience.isPending ? "Sending..." : "Send to Audience"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Send to Individual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Recipient Email</Label>
                  <Input type="email" value={singleEmail} onChange={(e) => setSingleEmail(e.target.value)} placeholder="recipient@example.com" />
                </div>
                <div>
                  <Label>Recipient Name (optional)</Label>
                  <Input value={singleName} onChange={(e) => setSingleName(e.target.value)} placeholder="John Doe" />
                </div>
                <Button
                  onClick={() => sendToEmail.mutate({ organizationId: orgIdNum, surveyId: surveyIdNum, recipientEmail: singleEmail, recipientName: singleName || undefined, origin: window.location.origin })}
                  disabled={!singleEmail || sendToEmail.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendToEmail.isPending ? "Sending..." : "Send Email"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="link">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shareable Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={() => createLink.mutate({ surveyId: surveyIdNum, label: `Link ${(links?.length ?? 0) + 1}` })} disabled={createLink.isPending} variant="outline" className="w-full">
                  <Link2 className="w-4 h-4 mr-2" /> Generate New Link
                </Button>
                {links?.map((link) => (
                  <div key={link.id} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg sm:flex-row sm:items-center">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-0.5">{link.label ?? "Survey Link"}</p>
                      <p className="text-sm font-mono truncate text-blue-600 break-all">{surveyBaseUrl}/survey/{link.token}</p>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0 gap-2 w-full sm:w-auto" onClick={() => { navigator.clipboard.writeText(`${surveyBaseUrl}/survey/${link.token}`); toast.success("Link copied!"); }}>
                      <Copy className="w-4 h-4" /> Copy Link
                    </Button>
                  </div>
                ))}
                {!links?.length && <p className="text-sm text-gray-500 text-center py-4">No links yet. Generate one above.</p>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
