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
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
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
  // New fields
  country: string | null;
  location_region: string | null;
  job_title: string | null;
  interest_areas: string[];
  international_scope: boolean;
  growth_maturity_level: number;
  data_maturity_level: number;
  firm_type: string | null;
}

const INTEREST_OPTIONS = [
  'Growth Strategy',
  'Business Development',
  'Marketing',
  'Technology',
  'Client Relations',
  'Thought Leadership',
  'Data & Analytics',
  'Innovation',
  'Operations',
  'Talent & Culture',
];

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
    country: "",
    location_region: "",
    job_title: "",
    interest_areas: [] as string[],
    international_scope: false,
    growth_maturity_level: 1,
    data_maturity_level: 1,
    firm_type: "",
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
            country: data.country || "",
            location_region: data.location_region || "",
            job_title: data.job_title || "",
            interest_areas: data.interest_areas || [],
            international_scope: data.international_scope || false,
            growth_maturity_level: data.growth_maturity_level || 1,
            data_maturity_level: data.data_maturity_level || 1,
            firm_type: data.firm_type || "",
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

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interest_areas: prev.interest_areas.includes(interest)
        ? prev.interest_areas.filter((i) => i !== interest)
        : [...prev.interest_areas, interest],
    }));
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
            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                placeholder="Senior Marketing Manager"
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="United States"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location_region">Location/Region</Label>
                <Input
                  id="location_region"
                  value={formData.location_region}
                  onChange={(e) => setFormData({ ...formData, location_region: e.target.value })}
                  placeholder="New York"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interest Areas */}
        <Card>
          <CardHeader>
            <CardTitle>Interest Areas</CardTitle>
            <CardDescription>Select topics you're interested in for personalized recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => (
                <Badge
                  key={interest}
                  variant={formData.interest_areas.includes(interest) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80 transition-colors"
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </Badge>
              ))}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firm_type">Firm Type</Label>
                <Select
                  value={formData.firm_type}
                  onValueChange={(v) => setFormData({ ...formData, firm_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="law_firm">Law Firm</SelectItem>
                    <SelectItem value="in_house">In-House Legal</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                    <SelectItem value="academia">Academia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="practice_area">Primary Practice Area</Label>
                <Input
                  id="practice_area"
                  value={formData.practice_area}
                  onChange={(e) => setFormData({ ...formData, practice_area: e.target.value })}
                  placeholder="Corporate M&A, Litigation..."
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div>
                <Label>International Scope</Label>
                <p className="text-sm text-muted-foreground">Does your work span multiple countries?</p>
              </div>
              <Switch
                checked={formData.international_scope}
                onCheckedChange={(checked) => setFormData({ ...formData, international_scope: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Maturity Levels */}
        <Card>
          <CardHeader>
            <CardTitle>Maturity Assessment</CardTitle>
            <CardDescription>Help us personalize recommendations based on your growth stage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Growth Maturity Level</Label>
                <span className="text-sm font-medium text-primary">{formData.growth_maturity_level}/5</span>
              </div>
              <Slider
                min={1}
                max={5}
                step={1}
                value={[formData.growth_maturity_level]}
                onValueChange={([value]) => setFormData({ ...formData, growth_maturity_level: value })}
              />
              <p className="text-xs text-muted-foreground">
                1 = Just starting growth initiatives • 5 = Mature, optimized growth strategy
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Data Maturity Level</Label>
                <span className="text-sm font-medium text-primary">{formData.data_maturity_level}/5</span>
              </div>
              <Slider
                min={1}
                max={5}
                step={1}
                value={[formData.data_maturity_level]}
                onValueChange={([value]) => setFormData({ ...formData, data_maturity_level: value })}
              />
              <p className="text-xs text-muted-foreground">
                1 = Limited data usage • 5 = Data-driven decision making
              </p>
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
