import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, CheckCircle, ArrowLeft, Eye, EyeOff, Star } from "lucide-react";
import glLogoDark from "@/assets/gl-logo-dark.svg";

type AuthMode = "signin" | "signup" | "success" | "password" | "forgot" | "reset-sent" | "resetting";

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get('type') === 'recovery') {
      setMode("resetting");
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode("resetting");
      } else if (session?.user && mode !== "resetting") {
        // Mark email as verified on magic link login
        supabase.from('profiles')
          .update({ email_verified: true })
          .eq('user_id', session.user.id)
          .then(() => {});
        navigate("/");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && mode !== "resetting") {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, mode]);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await supabase.functions.invoke("send-auth-email", {
        body: { email, type: "magiclink", site_url: window.location.origin }
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await supabase.functions.invoke("send-auth-email", {
        body: { email, type: "signup_magiclink", full_name: fullName, site_url: window.location.origin }
      });
      if (response.error) throw response.error;
      const data = response.data;
      if (data?.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      } else {
        setMode("success");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to create account", variant: "destructive" });
    }
    setLoading(false);
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      if (authData.user) {
        const { data: profile } = await supabase.from("profiles").select("email_verified").eq("user_id", authData.user.id).maybeSingle();
        if (profile && !profile.email_verified) {
          await supabase.auth.signOut();
          toast({ title: "Email not verified", description: "Please check your email for a verification link.", variant: "destructive" });
          setLoading(false);
          return;
        }
      }
      toast({ title: "Welcome back!", description: "You've successfully logged in." });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Connection error", description: "Unable to connect. Please try again.", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-auth-email", {
        body: { email, type: "recovery", site_url: window.location.origin }
      });
      if (error) throw error;
      setMode("reset-sent");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to send reset link", variant: "destructive" });
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
      setMode("signin");
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
            <Button variant="outline" onClick={() => { setMode("signin"); setEmail(""); }}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to sign in
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
                <div className="relative">
                  <Input id="new-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} required />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Update Password
              </Button>
            </form>
          </div>
        );

      case "reset-sent":
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-secondary" />
                Check your email
              </h3>
              <p className="text-sm text-muted-foreground">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
            </div>
            <Button variant="outline" onClick={() => { setMode("signin"); setEmail(""); }}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to sign in
            </Button>
          </div>
        );

      case "forgot":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Forgot Password</h2>
              <p className="text-muted-foreground mt-1">Enter your email to receive a reset link</p>
            </div>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input id="reset-email" type="email" placeholder="you@lawfirm.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Send Reset Link
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => { setMode("signin"); setEmail(""); }}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to sign in
              </Button>
            </form>
          </div>
        );

      case "password":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Sign in with password</h2>
              <p className="text-muted-foreground mt-1">Enter your email and password</p>
            </div>
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pw-email">Email</Label>
                <Input id="pw-email" type="email" placeholder="you@lawfirm.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pw-password">Password</Label>
                  <button type="button" onClick={() => setMode("forgot")} className="text-xs text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input id="pw-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Sign In
              </Button>
              <button type="button" onClick={() => setMode("signin")} className="w-full text-sm text-muted-foreground hover:text-foreground text-center">
                ← Back to magic link sign in
              </button>
            </form>
          </div>
        );

      case "signup":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Create your account</h2>
              <p className="text-muted-foreground mt-1">
                Join Growth Lab and access strategic frameworks for legal business development.
              </p>
            </div>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input id="signup-name" type="text" placeholder="Jane Smith" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Work Email</Label>
                <Input id="signup-email" type="email" placeholder="you@lawfirm.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="flex items-start space-x-3 pt-2">
                <Checkbox id="consent" checked={consentAccepted} onCheckedChange={checked => setConsentAccepted(checked === true)} className="mt-0.5" />
                <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer text-muted-foreground">
                  I agree to the{" "}
                  <button type="button" onClick={() => setShowTerms(true)} className="text-primary underline hover:no-underline">
                    Terms of Use and Privacy Notice
                  </button>
                  . I understand that Growth Lab is part of BeyondBillableHours, that anonymised data may be used for industry insights, and that I may receive platform communications.
                </Label>
              </div>
              <Button type="submit" className="w-full" disabled={!consentAccepted || loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Account
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <button type="button" onClick={() => setMode("signin")} className="text-primary hover:underline font-medium">
                  Sign in
                </button>
              </p>
            </form>
          </div>
        );

      case "signin":
      default:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
              <p className="text-muted-foreground mt-1">
                Enter your email and we'll send you a sign-in link — no password needed.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              Accounts are for professionals in legal business development.
            </div>
            <form onSubmit={handleSendMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Work Email</Label>
                <Input id="signin-email" type="email" placeholder="you@lawfirm.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                <Mail className="h-4 w-4 mr-2" />
                Send Sign-In Link
              </Button>
            </form>
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">
                New to Growth Lab?{" "}
                <button type="button" onClick={() => setMode("signup")} className="text-primary hover:underline font-medium">
                  Create account
                </button>
              </p>
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

      {/* Right side - Dark panel with testimonial */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground items-center justify-center p-12">
        <div className="max-w-md">
          <div className="flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-primary-foreground/50 mb-6">
            <Star className="h-4 w-4 fill-secondary text-secondary" />
            Member Insight
          </div>
          <div className="flex gap-1 mb-6">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="h-5 w-5 fill-secondary text-secondary" />
            ))}
          </div>
          <blockquote className="text-xl leading-relaxed mb-8 text-primary-foreground/90">
            "Growth Lab has transformed how we approach business development strategy. The frameworks and research insights are invaluable for our team's growth."
          </blockquote>
          <div>
            <p className="font-medium text-primary-foreground/80">Senior BD Director</p>
            <p className="text-sm text-primary-foreground/50">International Law Firm</p>
          </div>

          <div className="mt-16 pt-8 border-t border-primary-foreground/10">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-2xl">📚</p>
                <p className="text-xs text-primary-foreground/50 mt-1">Interactive Models</p>
              </div>
              <div>
                <p className="text-2xl">🗺️</p>
                <p className="text-xs text-primary-foreground/50 mt-1">Martech Map</p>
              </div>
              <div>
                <p className="text-2xl">🧪</p>
                <p className="text-xs text-primary-foreground/50 mt-1">Research Lab</p>
              </div>
            </div>
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
                <p>Growth Lab provides access to business models, frameworks, research insights, and martech resources. You may use these materials for your professional development and business activities within your organisation.</p>
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
