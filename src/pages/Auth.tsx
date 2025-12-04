import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, Mail, CheckCircle, ArrowLeft } from "lucide-react";
import glLogoYellow from "@/assets/gl-logo-yellow.svg";
import glLogoDark from "@/assets/gl-logo-dark.svg";
export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  useEffect(() => {
    // Check for password reset flow from URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    if (type === 'recovery') {
      setIsResettingPassword(true);
    }
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
      } else if (session?.user && !isResettingPassword) {
        navigate("/");
      }
    });
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      if (session?.user && !isResettingPassword) {
        navigate("/");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, isResettingPassword]);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const {
      error
    } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in."
      });
      navigate("/");
    }
    setLoading(false);
  };
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    const {
      error,
      data
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          consent_accepted_at: new Date().toISOString()
        }
      }
    });
    if (error) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive"
      });
    } else if (data.user && !data.session) {
      // User created but needs email verification
      setSignupSuccess(true);
      toast({
        title: "Check your email",
        description: "We've sent you a verification link to complete your registration."
      });
    } else if (data.session) {
      // Auto-confirmed (for testing or if disabled)
      toast({
        title: "Account created!",
        description: "Welcome to Growth Lab."
      });
      navigate("/");
    }
    setLoading(false);
    setConsentAccepted(false);
  };
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const {
      error
    } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`
    });
    if (error) {
      toast({
        title: "Request failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setResetEmailSent(true);
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link."
      });
    }
    setLoading(false);
  };
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const {
      error
    } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) {
      toast({
        title: "Password update failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Password updated",
        description: "Your password has been successfully reset."
      });
      setIsResettingPassword(false);
      setNewPassword("");
      navigate("/");
    }
    setLoading(false);
  };
  return <div className="min-h-screen flex">
      {/* Left side - Branding with tech grid pattern */}
      <div className="hidden lg:flex lg:w-1/2 hero-tech items-center justify-center p-12">
        <div className="max-w-md relative z-10">
          <img alt="Growth Lab" className="w-16 h-16 rounded-xl mb-8" src="/lovable-uploads/89dc4fa4-283a-40b4-aaf9-cd91cde9af43.png" />
          <h1 className="text-4xl font-bold mb-4 text-foreground">Growth Lab</h1>
          <p className="text-xl text-foreground/80 mb-8">
            Strategic frameworks and tools to accelerate your legal business development.
          </p>
          <div className="space-y-4 text-foreground/70">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📚</span>
              <span>Interactive business models</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🗺️</span>
              <span>Legal martech landscape</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧪</span>
              <span>Exclusive research insights</span>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-foreground/20">
            <a href="https://beyondbillablehours.io/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-foreground/60 hover:text-foreground/80 transition-colors">
              <img alt="Beyond Billable Hours" src="/lovable-uploads/795bbaf9-8839-4d49-bec7-219bd69566c9.png" className="" />
              <span className="text-sm">By Beyond Billable Hours</span>
            </a>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md border-border shadow-elevated">
          <CardHeader className="text-center">
            <img src={glLogoDark} alt="Growth Lab" className="lg:hidden w-12 h-12 rounded-lg mx-auto mb-4" />
            <CardTitle className="text-2xl">
              {isResettingPassword ? "Reset Your Password" : forgotPassword ? "Forgot Password" : "Welcome to Growth Lab"}
            </CardTitle>
            <CardDescription>
              {isResettingPassword ? "Enter your new password below" : forgotPassword ? "Enter your email to receive a reset link" : "Sign in to access your strategic toolkit"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isResettingPassword ? <form onSubmit={handlePasswordUpdate} className="space-y-4">
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
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Update Password
                </Button>
              </form> : forgotPassword ? resetEmailSent ? <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Check your email
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      We've sent a password reset link to <strong>{email}</strong>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Click the link in the email to reset your password.
                    </p>
                  </div>
                  <Button variant="outline" className="mt-4" onClick={() => {
              setForgotPassword(false);
              setResetEmailSent(false);
              setEmail("");
            }}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to sign in
                  </Button>
                </div> : <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input id="reset-email" type="email" placeholder="you@lawfirm.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Send Reset Link
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => {
              setForgotPassword(false);
              setEmail("");
            }}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to sign in
                  </Button>
                </form> : <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="you@lawfirm.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>
                      <button type="button" onClick={() => setForgotPassword(true)} className="text-xs text-primary hover:underline">
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Input id="login-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                {signupSuccess ? <div className="text-center py-6 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Check your email
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        We've sent a verification link to <strong>{email}</strong>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Click the link in the email to complete your registration and sign in.
                      </p>
                    </div>
                    <Button variant="outline" className="mt-4" onClick={() => {
                  setSignupSuccess(false);
                  setEmail("");
                  setPassword("");
                  setFullName("");
                }}>
                      Back to sign up
                    </Button>
                  </div> : <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input id="signup-name" type="text" placeholder="Jane Smith" value={fullName} onChange={e => setFullName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input id="signup-email" type="email" placeholder="you@lawfirm.com" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Input id="signup-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                    </div>
                    <div className="flex items-start space-x-3 pt-2">
                      <Checkbox id="consent" checked={consentAccepted} onCheckedChange={checked => setConsentAccepted(checked === true)} className="mt-0.5" />
                      <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer text-muted-foreground">
                        By creating an account, I agree to the Growth Lab{" "}
                        <button type="button" onClick={() => setShowTerms(true)} className="text-primary underline hover:no-underline">
                          Terms of Use and Privacy Notice
                        </button>
                        . I understand that Growth Lab is part of BeyondBillableHours, that anonymised data may be used for industry insights, and that I may receive platform and marketing communications.
                      </Label>
                    </div>
                    <Button type="submit" className="w-full" disabled={!consentAccepted || loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Create Account
                    </Button>
                  </form>}
              </TabsContent>
            </Tabs>}
          </CardContent>
        </Card>
      </div>

      {/* Terms of Use & Privacy Notice Dialog */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-xl">Growth Lab – Terms of Use & Privacy Notice</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6 text-sm text-muted-foreground">
              <p className="text-xs">
                <strong>Effective date:</strong> December 4, 2025<br />
                Growth Lab is part of BeyondBillableHours, a tradename of BKG Consulting, a company registered in Dubai.
              </p>
              <p>
                By creating an account on Growth Lab ("the Platform"), you agree to the following Terms of Use and Privacy Notice.
              </p>
              <p className="font-medium text-foreground">
                If you do not agree, you should not use the Platform.
              </p>

              <section className="space-y-2">
                <h3 className="font-semibold text-foreground">1. Purpose of the Platform</h3>
                <p>
                  Growth Lab is a free community tool designed to support marketing, business development, and growth practices within law firms.
                  It provides models, tools, insights, vendor information, research activities, and—potentially in the future—community features such as discussions and shared content.
                </p>
                <p>The Platform is provided "as is", without guarantees and may evolve over time.</p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-foreground">2. Account Registration</h3>
                <p>
                  By registering, you confirm that the information you provide is accurate and that you will keep your login details secure.
                </p>
                <p>We may suspend or remove accounts that violate these Terms or disrupt the community.</p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-foreground">3. Data Use & Privacy</h3>
                <p>We collect profile and usage data to:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>personalise your experience</li>
                  <li>improve platform functionality</li>
                  <li>produce anonymised industry insights</li>
                  <li>maintain platform security and performance</li>
                </ul>
                <p className="mt-2">We do not share any personally identifiable information with third parties.</p>
                <p>We may use anonymised and aggregated data for:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>industry reports and benchmarks</li>
                  <li>presentations or thought leadership</li>
                  <li>platform analytics</li>
                  <li>community insights</li>
                </ul>
                <p className="mt-2">No person or firm will ever be individually identifiable in these outputs.</p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-foreground">4. Communications & Marketing</h3>
                <p>By creating an account, you agree that we may contact you with:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>platform updates</li>
                  <li>new feature announcements</li>
                  <li>research invitations</li>
                  <li>community-related content</li>
                  <li>marketing communications from Growth Lab / BeyondBillableHours</li>
                </ul>
                <p className="mt-2">You can opt out of marketing emails at any time.</p>
                <p>We do not sell or distribute your email address.</p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-foreground">5. Content Ownership & Rights</h3>
                <p>The Platform includes:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>original content by Growth Lab / BeyondBillableHours</li>
                  <li>third-party content (vendor information, articles, videos)</li>
                  <li>future community contributions</li>
                  <li>materials provided or uploaded by users</li>
                </ul>
                <p className="mt-2">External content remains the property of its owners. Users retain ownership of their contributions. We claim no rights over third-party or user-generated content.</p>
                <p>You are responsible for ensuring you have permission to share anything you upload.</p>
                <p>We are not responsible for the accuracy, legality, or reliability of external or user-generated content.</p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-foreground">6. Vendor Information & External Tools</h3>
                <p>Vendor listings and third-party tools included in Growth Lab:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>may contain incomplete or outdated information</li>
                  <li>do not constitute endorsements</li>
                  <li>are used at your own risk</li>
                  <li>must be independently verified by users</li>
                </ul>
                <p className="mt-2">We are not liable for issues related to external vendors or tools.</p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-foreground">7. Community & Forum Behaviour (present or future features)</h3>
                <p>If Growth Lab includes community features (forums, discussions, comments, posts), the following rules apply:</p>
                
                <h4 className="font-medium text-foreground mt-3">7.1 Respectful Conduct</h4>
                <p>Users must behave professionally and respectfully at all times. Prohibited behaviours include:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>harassment, discrimination, or offensive language</li>
                  <li>personal attacks or bullying</li>
                  <li>sharing confidential or sensitive client/firm information</li>
                  <li>posting misleading, illegal, or harmful content</li>
                  <li>spam, promotions, or solicitation without permission</li>
                  <li>impersonation of individuals or organisations</li>
                </ul>

                <h4 className="font-medium text-foreground mt-3">7.2 Content Responsibility</h4>
                <p>You are fully responsible for anything you post. By contributing, you confirm that:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>you have the right to share the content</li>
                  <li>it does not infringe on intellectual property or confidentiality</li>
                  <li>it does not violate law or contractual obligations</li>
                </ul>

                <h4 className="font-medium text-foreground mt-3">7.3 Moderation Rights</h4>
                <p>Growth Lab / BeyondBillableHours may:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>edit, hide, or delete posts</li>
                  <li>remove or restrict accounts</li>
                  <li>disable community features</li>
                  <li>moderate discussions in any manner deemed necessary</li>
                </ul>
                <p className="mt-2">This may be done without notice if content violates these rules or risks harm to the community.</p>

                <h4 className="font-medium text-foreground mt-3">7.4 No Liability for Community Content</h4>
                <p>User-generated content reflects individual opinions only. Growth Lab / BeyondBillableHours:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>does not endorse community posts</li>
                  <li>is not liable for accuracy or harm resulting from them</li>
                </ul>
                <p className="mt-2">Use community content at your own discretion.</p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-foreground">8. Anonymised Industry Insights</h3>
                <p>
                  By using Growth Lab, you agree that your activity may be used in anonymised, aggregated form to generate industry insights, reports, or research.
                </p>
                <p>We will never publish or share identifiable personal or firm-level data.</p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-foreground">9. Platform Availability & Liability</h3>
                <p>Growth Lab is provided without warranties, including:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>uninterrupted availability</li>
                  <li>accuracy, completeness, or reliability of content</li>
                  <li>error-free performance</li>
                </ul>
                <p className="mt-2">We are not responsible for:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>data loss</li>
                  <li>downtime or technical issues</li>
                  <li>errors or outdated information</li>
                  <li>decisions made based on platform content</li>
                  <li>the availability or behaviour of third-party services</li>
                  <li>any direct or indirect damages from use of the Platform</li>
                </ul>
                <p className="mt-2">Use of the Platform is at your own risk.</p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-foreground">10. Changes to Terms</h3>
                <p>We may modify or update these Terms at any time. Continued use of the Platform after changes constitutes acceptance.</p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-foreground">11. Contact</h3>
                <p>
                  Growth Lab is part of BeyondBillableHours, a tradename of BKG Consulting, registered in Dubai.
                </p>
                <p>
                  For questions or data requests, contact:<br />
                  📧 info@beyondbillablehours.io
                </p>
              </section>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>;
}