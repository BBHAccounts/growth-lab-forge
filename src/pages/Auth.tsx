import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, CheckCircle, ArrowLeft, BookOpen, FlaskConical, Lightbulb, ArrowRight, Sparkles } from "lucide-react";
import glLogoDark from "@/assets/gl-logo-dark.svg";

type AuthMode = "main" | "success" | "resetting";

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("main");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get('type') === 'recovery') {
      setMode("resetting");
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode("resetting");
      } else if (session?.user && mode !== "resetting") {
        // Mark email as verified on magic link login
        await supabase.from('profiles')
          .update({ email_verified: true })
          .eq('user_id', session.user.id);

        // Check if profile needs onboarding (no name set)
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, onboarding_completed')
          .eq('user_id', session.user.id)
          .single();

        if (!profile?.full_name || profile.full_name.trim() === '') {
          navigate("/onboarding");
        } else {
          navigate("/");
        }
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && mode !== "resetting") {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, mode]);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await supabase.functions.invoke("send-auth-email", {
        body: { email, type: "auto", site_url: window.location.origin }
      });
      if (response.error) throw response.error;
      const data = response.data;
      if (data?.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      } else {
        setMode("success");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to send sign-in link", variant: "destructive" });
    }
    setLoading(false);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated", description: "Your password has been successfully reset." });
      setMode("main");
      navigate("/");
    }
    setLoading(false);
  };

  const renderForm = () => {
    switch (mode) {
      case "success":
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-secondary-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-secondary" />
                Check your email
              </h3>
              <p className="text-muted-foreground">
                We've sent a sign-in link to <strong className="text-foreground">{email}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Click the link in the email to sign in. It expires in 1 hour.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              💡 Can't find the email? Check your spam or junk folder.
            </div>
            <Button variant="outline" onClick={() => { setMode("main"); setEmail(""); }}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          </div>
        );

      case "resetting":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Reset Your Password</h2>
              <p className="text-muted-foreground mt-1">Enter your new password below</p>
            </div>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} required />
                <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Update Password
              </Button>
            </form>
          </div>
        );

      case "main":
      default:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Sign in or create account</h2>
              <p className="text-muted-foreground mt-1">
                Enter your work email — we'll send you a sign-in link. If you're new, we'll create your account automatically.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              For legal professionals looking to drive growth and build a stronger business.
            </div>
            <form onSubmit={handleContinue} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <Input id="email" type="email" placeholder="you@lawfirm.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                <Mail className="h-4 w-4 mr-2" />
                Continue with Email
              </Button>
            </form>
            <div className="text-center">
              <button type="button" onClick={() => setMode("password")} className="text-xs text-muted-foreground hover:text-foreground">
                Or sign in with password
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16 bg-background">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <img src={glLogoDark} alt="Growth Lab" className="w-10 h-10 rounded-xl" />
            <div>
              <h1 className="font-bold text-foreground text-lg">Growth Lab</h1>
              <p className="text-xs text-muted-foreground">by Beyond Billable Hours</p>
            </div>
          </div>

          {renderForm()}

          <p className="mt-8 text-xs text-muted-foreground text-center">
            By continuing, you agree to our{" "}
            <button type="button" onClick={() => setShowTerms(true)} className="underline hover:no-underline">
              Terms of Service
            </button>{" "}
            and{" "}
            <button type="button" onClick={() => setShowTerms(true)} className="underline hover:no-underline">
              Privacy Policy
            </button>.
          </p>
        </div>
      </div>

      {/* Right side - Dark panel with platform preview */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground items-center justify-center p-12">
        <div className="max-w-lg w-full">
          <div className="flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-primary-foreground/50 mb-4">
            <Sparkles className="h-4 w-4 text-secondary" />
            What's Inside
          </div>
          <h2 className="text-2xl font-bold text-primary-foreground/90 mb-2">
            Your strategic growth toolkit
          </h2>
          <p className="text-sm text-primary-foreground/50 mb-8">
            Frameworks, research, and insights built for legal professionals.
          </p>

          {/* Feature cards */}
          <div className="space-y-4">
            <div className="rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 p-5">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-primary-foreground/90 mb-1">Interactive Models</h3>
                  <p className="text-sm text-primary-foreground/50 leading-relaxed">
                    Step-by-step frameworks for BD planning, client development, pitching, and practice growth.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {["BD Planner", "Client Growth", "Pitch Builder", "Market Analysis"].map(tag => (
                      <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full bg-primary-foreground/10 text-primary-foreground/40">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 p-5">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                  <Lightbulb className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-primary-foreground/90 mb-1">Insights Hub</h3>
                  <p className="text-sm text-primary-foreground/50 leading-relaxed">
                    Curated articles, guides, and resources on legal business development trends.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 p-5">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                  <FlaskConical className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-primary-foreground/90 mb-1">Research Lab</h3>
                  <p className="text-sm text-primary-foreground/50 leading-relaxed">
                    Participate in industry studies and unlock exclusive benchmarking data.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-2 text-xs text-primary-foreground/30">
            <ArrowRight className="h-3.5 w-3.5" />
            <span>Sign in to explore all features</span>
          </div>
        </div>
      </div>

      {/* Terms Dialog */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Terms of Use and Privacy Notice</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6 text-sm text-muted-foreground">
              <section>
                <h3 className="font-semibold text-foreground mb-2">1. Introduction</h3>
                <p>Welcome to Growth Lab, a strategic toolkit for legal business development provided by Beyond Billable Hours Limited ("we", "us", "our"). By creating an account, you agree to these terms.</p>
              </section>
              <section>
                <h3 className="font-semibold text-foreground mb-2">2. Account Registration</h3>
                <p>You must provide accurate and complete information when creating your account. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.</p>
              </section>
              <section>
                <h3 className="font-semibold text-foreground mb-2">3. Use of the Platform</h3>
                <p>Growth Lab provides access to business models, frameworks, research insights, and curated resources. You may use these materials for your professional development and business activities within your organisation.</p>
              </section>
              <section>
                <h3 className="font-semibold text-foreground mb-2">4. Data Collection and Use</h3>
                <p>We collect personal information including your name, email, job title, firm details, and platform usage data. This information is used to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Provide personalised content and recommendations</li>
                  <li>Generate anonymised industry insights and benchmarks</li>
                  <li>Improve our platform and services</li>
                  <li>Send you relevant updates and communications</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-foreground mb-2">5. Data Protection</h3>
                <p>We process your data in accordance with applicable data protection laws, including the UK GDPR. Your personal data is stored securely and will not be sold to third parties. Anonymised, aggregated data may be used for research and industry insights.</p>
              </section>
              <section>
                <h3 className="font-semibold text-foreground mb-2">6. Your Rights</h3>
                <p>You have the right to access, correct, or delete your personal data. You can manage your preferences in your account settings or contact us at privacy@beyondbillablehours.io.</p>
              </section>
              <section>
                <h3 className="font-semibold text-foreground mb-2">7. Intellectual Property</h3>
                <p>All content, frameworks, and materials on Growth Lab are owned by Beyond Billable Hours Limited. You may not reproduce, distribute, or create derivative works without our written permission.</p>
              </section>
              <section>
                <h3 className="font-semibold text-foreground mb-2">8. Communications</h3>
                <p>By creating an account, you consent to receive platform notifications, feature updates, and occasional marketing communications. You can unsubscribe from marketing emails at any time.</p>
              </section>
              <section>
                <h3 className="font-semibold text-foreground mb-2">9. Changes to Terms</h3>
                <p>We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the updated terms.</p>
              </section>
              <section>
                <h3 className="font-semibold text-foreground mb-2">10. Contact</h3>
                <p>
                  For questions about these terms or your data, contact us at:<br />
                  Beyond Billable Hours Limited<br />
                  Email: privacy@beyondbillablehours.io
                </p>
              </section>
              <p className="text-xs text-muted-foreground pt-4">Last updated: January 2025</p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
