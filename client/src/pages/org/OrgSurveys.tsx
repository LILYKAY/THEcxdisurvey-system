import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, BarChart2, Send, Settings, FileText, Mail } from "lucide-react";

export default function OrgSurveys() {
  const { orgId } = useParams<{ orgId: string }>();
  const orgIdNum = parseInt(orgId ?? "0");
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data: surveys, isLoading } = trpc.surveys.list.useQuery({ organizationId: orgIdNum });

  const createSurvey = trpc.surveys.create.useMutation({
    onSuccess: (survey) => {
      utils.surveys.list.invalidate({ organizationId: orgIdNum });
      setShowCreate(false);
      setTitle(""); setDescription("");
      toast.success("Survey created");
      navigate(`/org/${orgId}/surveys/${survey.id}/builder`);
    },
    onError: (e) => toast.error(e.message),
  });

  const activateSurvey = trpc.surveys.activate.useMutation({
    onSuccess: () => { utils.surveys.list.invalidate({ organizationId: orgIdNum }); toast.success("Survey activated"); },
    onError: (e) => toast.error(e.message),
  });

  const deactivateSurvey = trpc.surveys.deactivate.useMutation({
    onSuccess: () => { utils.surveys.list.invalidate({ organizationId: orgIdNum }); toast.success("Survey deactivated"); },
    onError: (e) => toast.error(e.message),
  });

  const navItems = [
    { label: "Dashboard", href: `/org/${orgId}` },
    { label: "Surveys", href: `/org/${orgId}/surveys`, active: true },
    { label: "Contacts", href: `/org/${orgId}/contacts` },
    { label: "Audiences", href: `/org/${orgId}/audiences` },
    { label: "Settings", href: `/org/${orgId}/settings` },
  ];

  const statusColor: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    active: "bg-green-100 text-green-700",
    inactive: "bg-yellow-100 text-yellow-700",
    archived: "bg-red-100 text-red-700",
  };

  return (
    <DashboardLayout navItems={navItems} title="Surveys">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Surveys</h1>
            <p className="text-sm text-gray-500 mt-0.5">Build, send, and analyse your surveys</p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white h-10 gap-2 shrink-0">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Survey</span>
                <span className="sm:hidden">New</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>Create Survey</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Survey Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Customer Satisfaction Q3" className="mt-1.5" />
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this survey" rows={3} className="mt-1.5" />
                </div>
                <Button
                  onClick={() => createSurvey.mutate({ organizationId: orgIdNum, title, description: description || undefined })}
                  disabled={!title || createSurvey.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
                >
                  {createSurvey.isPending ? "Creating..." : "Create & Build Survey"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center text-gray-500 py-10">Loading surveys...</div>
        ) : !surveys?.length ? (
          <Card>
            <CardContent className="p-10 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No surveys yet</p>
              <p className="text-gray-400 text-sm mt-1">Create your first survey to start collecting feedback</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {surveys.map((s) => (
              <Card key={s.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {/* Survey title + status row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 leading-snug">{s.title}</h3>
                      {s.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{s.description}</p>}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${statusColor[s.status ?? "draft"]}`}>
                      {s.status ?? "draft"}
                    </span>
                  </div>

                  {/* Action buttons — wrap on mobile */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/org/${orgId}/surveys/${s.id}/builder`)} className="h-9 px-3 gap-1.5">
                      <Settings className="w-3.5 h-3.5" /><span>Build</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/org/${orgId}/surveys/${s.id}/send`)} className="h-9 px-3 gap-1.5">
                      <Send className="w-3.5 h-3.5" /><span>Send</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/org/${orgId}/surveys/${s.id}/analytics`)} className="h-9 px-3 gap-1.5">
                      <BarChart2 className="w-3.5 h-3.5" /><span>Analytics</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/org/${orgId}/surveys/${s.id}/invitations`)} className="h-9 px-3 gap-1.5">
                      <Mail className="w-3.5 h-3.5" /><span>Invitations</span>
                    </Button>
                    {s.status === "active" ? (
                      <Button variant="outline" size="sm" onClick={() => deactivateSurvey.mutate({ id: s.id })} className="h-9 px-3 text-yellow-600 border-yellow-300 hover:bg-yellow-50">
                        Pause
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => activateSurvey.mutate({ id: s.id })} className="h-9 px-3 text-green-600 border-green-300 hover:bg-green-50">
                        Activate
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
