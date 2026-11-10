import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight } from "lucide-react";
import glLogoDark from "@/assets/gl-logo-dark.svg";
import { BookLayout } from "@/components/book/BookLayout";
import { isBookEntry, needsBookOnboarding, rememberBookEntry } from "@/lib/book-entry";

export default function Onboarding() {
  const [params] = useSearchParams();
  const [fromBook] = useState(() => params.get("from") === "book" || isBookEntry(localStorage));
  const [fullName, setFullName] = useState("");
  const [firmName, setFirmName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      if (fromBook) rememberBookEntry(localStorage, null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate(fromBook ? "/book/join" : "/auth");
        return;
      }
      // If already has a name, skip onboarding
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, firm_name")
        .eq("user_id", user.id)
        .single();

      if (fromBook ? !needsBookOnboarding(profile) : profile?.full_name && profile.full_name.trim() !== '') {
        navigate(fromBook ? "/book/join" : "/");
        return;
      }
      if (fromBook && profile) {
        setFullName(profile.full_name || "");
        setFirmName(profile.firm_name || "");
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, [navigate, fromBook]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || (fromBook && !firmName.trim())) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          firm_name: firmName.trim() || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      // Also update user metadata
      await supabase.auth.updateUser({
        data: { full_name: fullName.trim() }
      });

      if (!fromBook) toast({ title: "Welcome to Growth Lab!", description: "Your profile has been set up." });
      navigate(fromBook ? "/book/join" : "/");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save profile", variant: "destructive" });
    }
    setLoading(false);
  };

  if (fromBook) return <BookLayout>
    <section className="max-w-5xl mx-auto px-6 md:px-10 py-12 md:py-16 book-enter">
      <p className="book-eyebrow mb-6">Beyond the Book</p>
      {checkingAuth ? <Loader2 role="status" aria-label="Checking your account" className="h-6 w-6 animate-spin" /> : <div className="book-card max-w-xl">
        <h1 className="book-display text-4xl mb-6">A little about you</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2"><Label htmlFor="full-name">Name</Label><Input id="full-name" className="rounded-full h-12" value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" required /></div>
          <div className="space-y-2"><Label htmlFor="firm-name">Law firm</Label><Input id="firm-name" className="rounded-full h-12" value={firmName} onChange={e => setFirmName(e.target.value)} autoComplete="organization" required /></div>
          <Button type="submit" className="rounded-full h-12 px-8" disabled={loading || !fullName.trim() || !firmName.trim()}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}Continue</Button>
        </form>
      </div>}
    </section>
  </BookLayout>;

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <img src={glLogoDark} alt="Growth Lab" className="w-10 h-10 rounded-xl" />
          <div>
            <h1 className="font-bold text-foreground text-lg">Growth Lab</h1>
            <p className="text-xs text-muted-foreground">by Beyond Billable Hours</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="space-y-2 mb-6">
            <h2 className="text-2xl font-bold text-foreground">Welcome! Let's get you set up</h2>
            <p className="text-muted-foreground">
              Tell us a bit about yourself so we can personalise your experience.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="full-name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="full-name"
                type="text"
                placeholder="Jane Smith"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="firm-name">Law Firm / Organisation</Label>
              <Input
                id="firm-name"
                type="text"
                placeholder="e.g. Clifford Chance"
                value={firmName}
                onChange={e => setFirmName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This helps us tailor content to your context
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !fullName.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              Get Started
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
