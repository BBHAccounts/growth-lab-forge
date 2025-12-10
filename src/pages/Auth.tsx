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
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for password reset flow from URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    if (type === 'recovery') {
      setIsResettingPassword(true);
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
      } else if (session?.user && !isResettingPassword && !isLoggingIn) {
        // Only auto-navigate if not in the middle of a manual login check
        navigate("/");
      }
    });
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !isResettingPassword && !isLoggingIn) {
        navigate("/");
      }
    });
    
    return () => subscription.unsubscribe();
  }, [navigate, isResettingPassword, isLoggingIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIsLoggingIn(true);
    
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Auth error:', error);
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive"
        });
        setLoading(false);
        setIsLoggingIn(false);
        return;
      }

      // Check if email is verified
      if (authData.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email_verified")
          .eq("user_id", authData.user.id)
          .maybeSingle();

        if (profile && !profile.email_verified) {
          // Sign out the user and show message
          await supabase.auth.signOut();
          toast({
            title: "Email not verified",
            description: "Please check your email and click the verification link before logging in.",
            variant: "destructive"
          });
          setLoading(false);
          setIsLoggingIn(false);
          return;
        }
      }
      
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in."
      });
      setIsLoggingIn(false);
      navigate("/");
    } catch (err: any) {
      console.error('Network error details:', err);
      toast({
        title: "Connection error",
        description: "Unable to connect to authentication service. Please check your internet connection or try again later.",
        variant: "destructive"
      });
      setIsLoggingIn(false);
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Sign up with auto-confirm enabled (user is created immediately)
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          consent_accepted_at: new Date().toISOString()
        }
      }
    });
    
    if (error) {
      let errorMessage = error.message;
      if (error.message.toLowerCase().includes('already registered') || 
          error.message.toLowerCase().includes('already been registered')) {
        errorMessage = "An account with this email already exists. Please sign in instead, or use the 'Forgot password' option if you need to reset your password.";
      }
      toast({
        title: "Signup failed",
        description: errorMessage,
        variant: "destructive"
      });
      setLoading(false);
      return;
    }
    
    if (data.user) {
      // Sign out immediately so user can't access until verified
      await supabase.auth.signOut();
      
      // Send custom verification email
      try {
        const { error: emailError } = await supabase.functions.invoke("send-auth-email", {
          body: {
            email,
            type: "signup",
            user_id: data.user.id,
            site_url: window.location.origin
          }
        });
        
        if (emailError) {
          console.error("Error sending verification email:", emailError);
          toast({
            title: "Account created",
            description: "Your account was created but we couldn't send the verification email. Please contact support.",
            variant: "destructive"
          });
        } else {
          setSignupSuccess(true);
        }
      } catch (err) {
        console.error("Error sending verification email:", err);
        toast({
          title: "Account created",
          description: "Your account was created but we couldn't send the verification email. Please contact support.",
          variant: "destructive"
        });
      }
    }
    
    setLoading(false);
    setConsentAccepted(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Use our custom email function for password reset
    try {
      const { error } = await supabase.functions.invoke("send-auth-email", {
        body: {
          email,
          type: "recovery",
          site_url: window.location.origin
        }
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
    } catch (err: any) {
      toast({
        title: "Request failed",
        description: err.message || "Failed to send reset email",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
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

  return (
    <div className="min-h-screen flex">
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
              <img alt="Beyond Billable Hours" src="/lovable-uploads/795bbaf9-8839-4d49-bec7-219bd69566c9.png" className="h-5 w-5" />
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
            {isResettingPassword ? (
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
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Update Password
                </Button>
              </form>
            ) : forgotPassword ? (
              resetEmailSent ? (
                <div className="text-center py-6 space-y-4">
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
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
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
                </form>
              )
            ) : (
              <Tabs defaultValue="login" className="w-full">
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
                  {signupSuccess ? (
                    <div className="text-center py-6 space-y-4">
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
                    </div>
                  ) : (
                    <form onSubmit={handleSignup} className="space-y-4">
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
                    </form>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
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
                <p>
                  Welcome to Growth Lab, a strategic toolkit for legal business development provided by Beyond Billable Hours Limited ("we", "us", "our"). By creating an account, you agree to these terms.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">2. Account Registration</h3>
                <p>
                  You must provide accurate and complete information when creating your account. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">3. Use of the Platform</h3>
                <p>
                  Growth Lab provides access to business models, frameworks, research insights, and martech resources. You may use these materials for your professional development and business activities within your organisation.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">4. Data Collection and Use</h3>
                <p>
                  We collect personal information including your name, email, job title, firm details, and platform usage data. This information is used to:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Provide personalised content and recommendations</li>
                  <li>Generate anonymised industry insights and benchmarks</li>
                  <li>Improve our platform and services</li>
                  <li>Send you relevant updates and communications</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">5. Data Protection</h3>
                <p>
                  We process your data in accordance with applicable data protection laws, including the UK GDPR. Your personal data is stored securely and will not be sold to third parties. Anonymised, aggregated data may be used for research and industry insights.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">6. Your Rights</h3>
                <p>
                  You have the right to access, correct, or delete your personal data. You can manage your preferences in your account settings or contact us at privacy@beyondbillablehours.io.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">7. Intellectual Property</h3>
                <p>
                  All content, frameworks, and materials on Growth Lab are owned by Beyond Billable Hours Limited. You may not reproduce, distribute, or create derivative works without our written permission.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">8. Communications</h3>
                <p>
                  By creating an account, you consent to receive platform notifications, feature updates, and occasional marketing communications. You can unsubscribe from marketing emails at any time.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">9. Changes to Terms</h3>
                <p>
                  We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the updated terms.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">10. Contact</h3>
                <p>
                  For questions about these terms or your data, contact us at:<br />
                  Beyond Billable Hours Limited<br />
                  Email: privacy@beyondbillablehours.io
                </p>
              </section>

              <p className="text-xs text-muted-foreground pt-4">
                Last updated: January 2025
              </p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
