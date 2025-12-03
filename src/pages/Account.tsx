import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { HeroBanner } from "@/components/ui/hero-banner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, CheckCircle } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface Profile {
  full_name: string | null;
  role_title: string | null;
  seniority: string | null;
  firm_name: string | null;
  firm_region: string | null;
  firm_size: string | null;
  practice_area: string | null;
  research_contributor: boolean;
}

export default function Account() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    role_title: "",
    seniority: "",
    firm_name: "",
    firm_region: "",
    firm_size: "",
    practice_area: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (data) {
          setProfile(data);
          setFormData({
            full_name: data.full_name || "",
            role_title: data.role_title || "",
            seniority: data.seniority || "",
            firm_name: data.firm_name || "",
            firm_region: data.firm_region || "",
            firm_size: data.firm_size || "",
            practice_area: data.practice_area || "",
          });
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update(formData)
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile updated",
        description: "Your changes have been saved.",
      });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="animate-pulse p-8">
          <div className="h-48 bg-muted rounded-lg mb-8" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <HeroBanner
        emoji="👤"
        title="My Account"
        description="Manage your profile and preferences."
      />

      <div className="p-6 md:p-8 space-y-8 max-w-2xl">
        {/* Status Badges */}
        <div className="flex flex-wrap gap-3">
          {profile?.research_contributor && (
            <Badge className="bg-chart-4 text-chart-4-foreground">
              <CheckCircle className="h-3 w-3 mr-1" />
              Research Contributor
            </Badge>
          )}
        </div>

        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Jane Smith"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role_title">Role</Label>
                <Select
                  value={formData.role_title}
                  onValueChange={(v) => setFormData({ ...formData, role_title: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lawyer">Lawyer</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="associate">Associate</SelectItem>
                    <SelectItem value="mbd">Marketing/BD</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seniority">Seniority</Label>
                <Select
                  value={formData.seniority}
                  onValueChange={(v) => setFormData({ ...formData, seniority: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select seniority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="junior">Junior (0-3 years)</SelectItem>
                    <SelectItem value="mid">Mid (4-7 years)</SelectItem>
                    <SelectItem value="senior">Senior (8+ years)</SelectItem>
                    <SelectItem value="executive">Executive/Leadership</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Firm Info */}
        <Card>
          <CardHeader>
            <CardTitle>Firm Information</CardTitle>
            <CardDescription>About your organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firm_name">Firm Name</Label>
              <Input
                id="firm_name"
                value={formData.firm_name}
                onChange={(e) => setFormData({ ...formData, firm_name: e.target.value })}
                placeholder="Smith & Associates LLP"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firm_region">Region</Label>
                <Select
                  value={formData.firm_region}
                  onValueChange={(v) => setFormData({ ...formData, firm_region: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NA">North America</SelectItem>
                    <SelectItem value="EMEA">Europe/Middle East</SelectItem>
                    <SelectItem value="APAC">Asia Pacific</SelectItem>
                    <SelectItem value="LAC">Latin America</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="firm_size">Firm Size</Label>
                <Select
                  value={formData.firm_size}
                  onValueChange={(v) => setFormData({ ...formData, firm_size: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (1-50)</SelectItem>
                    <SelectItem value="medium">Medium (51-250)</SelectItem>
                    <SelectItem value="large">Large (251-1000)</SelectItem>
                    <SelectItem value="global">Global (1000+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="practice_area">Primary Practice Area</Label>
              <Input
                id="practice_area"
                value={formData.practice_area}
                onChange={(e) => setFormData({ ...formData, practice_area: e.target.value })}
                placeholder="Corporate M&A, Litigation, IP..."
              />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </AppLayout>
  );
}
