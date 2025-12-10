import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const regions = [
  "North America",
  "Europe",
  "Asia Pacific",
  "Latin America",
  "Middle East & Africa",
  "Global",
];

const firmSizes = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
];

interface ExistingUserInfo {
  email: string;
  user_id: string;
  status: string;
  can_resend: boolean;
}

export default function AdminUserForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);
  const [existingUser, setExistingUser] = useState<ExistingUserInfo | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    role_title: "",
    firm_name: "",
    firm_region: "",
    firm_size: "",
    is_admin: false,
    is_client: false,
    research_contributor: false,
  });

  const handleResendInvite = async () => {
    if (!existingUser) return;
    
    setResending(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: {
          email: existingUser.email,
          resend_invite: true,
          redirect_url: window.location.origin,
        },
      });

      if (error) throw error;

      if (data?.error && data.error !== "user_exists") {
        throw new Error(data.error);
      }

      toast({
        title: "Invite resent",
        description: `A new invitation has been sent to ${existingUser.email}`,
      });

      setExistingUser(null);
      navigate("/admin/users");
    } catch (error: any) {
      console.error("Error resending invite:", error);
      toast({
        title: "Failed to resend invite",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.full_name.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please enter both email and full name to invite the user.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    setExistingUser(null);

    try {
      const response = await supabase.functions.invoke("invite-user", {
        body: {
          ...formData,
          redirect_url: window.location.origin,
        },
      });

      // Check if it's a user_exists response (409 status)
      if (response.data?.error === "user_exists") {
        setExistingUser({
          email: formData.email,
          user_id: response.data.user_id,
          status: response.data.status,
          can_resend: response.data.can_resend,
        });
        setSaving(false);
        return;
      }

      if (response.error) throw response.error;

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${formData.email}`,
      });

      navigate("/admin/users");
    } catch (error: any) {
      console.error("Error inviting user:", error);
      toast({
        title: "Failed to invite user",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/users")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Invite New User</h1>
            <p className="text-muted-foreground">Send an invitation email to add a new user</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <h2 className="font-semibold">Basic Information</h2>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role_title">Role / Job Title</Label>
              <Input
                id="role_title"
                value={formData.role_title}
                onChange={(e) => setFormData({ ...formData, role_title: e.target.value })}
                placeholder="Marketing Director"
              />
            </div>
          </div>

          {existingUser && (
            <Alert variant="destructive" className="border-amber-500 bg-amber-500/10">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-500">User Already Exists</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>
                  A user with email <strong>{existingUser.email}</strong> already exists with status: <strong className="capitalize">{existingUser.status}</strong>
                </p>
                {existingUser.can_resend ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResendInvite}
                      disabled={resending}
                    >
                      {resending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Resend Invite
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/users/${existingUser.user_id}`)}
                    >
                      View User
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/users/${existingUser.user_id}`)}
                    >
                      View User Profile
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg border bg-card p-6 space-y-4">
            <h2 className="font-semibold">Firm Information</h2>
            
            <div className="space-y-2">
              <Label htmlFor="firm_name">Firm Name</Label>
              <Input
                id="firm_name"
                value={formData.firm_name}
                onChange={(e) => setFormData({ ...formData, firm_name: e.target.value })}
                placeholder="Acme Inc."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firm_region">Region</Label>
                <Select
                  value={formData.firm_region}
                  onValueChange={(value) => setFormData({ ...formData, firm_region: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="firm_size">Firm Size</Label>
                <Select
                  value={formData.firm_size}
                  onValueChange={(value) => setFormData({ ...formData, firm_size: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {firmSizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size} employees
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6 space-y-4">
            <h2 className="font-semibold">Permissions</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_admin">Admin Access</Label>
                  <p className="text-sm text-muted-foreground">Full access to admin panel</p>
                </div>
                <Switch
                  id="is_admin"
                  checked={formData.is_admin}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_admin: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_client">Client</Label>
                  <p className="text-sm text-muted-foreground">Mark as a client user</p>
                </div>
                <Switch
                  id="is_client"
                  checked={formData.is_client}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_client: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="research_contributor">Research Contributor</Label>
                  <p className="text-sm text-muted-foreground">Grant Research Contributor badge</p>
                </div>
                <Switch
                  id="research_contributor"
                  checked={formData.research_contributor}
                  onCheckedChange={(checked) => setFormData({ ...formData, research_contributor: checked })}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/admin/users")}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
