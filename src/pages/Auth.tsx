import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, Mail, CheckCircle } from "lucide-react";
import bbhLogo from "@/assets/bbh-logo.jpg";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          navigate("/");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
      navigate("/");
    }

    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const redirectUrl = `${window.location.origin}/`;

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          consent_accepted_at: new Date().toISOString(),
        },
      },
    });

    if (error) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
    } else if (data.user && !data.session) {
      // User created but needs email verification
      setSignupSuccess(true);
      toast({
        title: "Check your email",
        description: "We've sent you a verification link to complete your registration.",
      });
    } else if (data.session) {
      // Auto-confirmed (for testing or if disabled)
      toast({
        title: "Account created!",
        description: "Welcome to Growth Lab.",
      });
      navigate("/");
    }

    setLoading(false);
    setConsentAccepted(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding with tech grid pattern */}
      <div className="hidden lg:flex lg:w-1/2 hero-tech items-center justify-center p-12">
        <div className="max-w-md relative z-10">
          <div className="w-16 h-16 rounded-xl bg-foreground flex items-center justify-center mb-8">
            <span className="text-background font-bold text-2xl">G</span>
          </div>
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
            <a 
              href="https://beyondbillablehours.io/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-foreground/60 hover:text-foreground/80 transition-colors"
            >
              <img 
                src={bbhLogo} 
                alt="Beyond Billable Hours" 
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="text-sm">By Beyond Billable Hours</span>
            </a>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md border-border shadow-elevated">
          <CardHeader className="text-center">
            <div className="lg:hidden w-12 h-12 rounded-lg bg-accent flex items-center justify-center mx-auto mb-4">
              <span className="text-accent-foreground font-bold text-lg">G</span>
            </div>
            <CardTitle className="text-2xl">Welcome to Growth Lab</CardTitle>
            <CardDescription>
              Sign in to access your strategic toolkit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@lawfirm.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => setShowPassword(!showPassword)}
                      >
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
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => {
                        setSignupSuccess(false);
                        setEmail("");
                        setPassword("");
                        setFullName("");
                      }}
                    >
                      Back to sign up
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Jane Smith"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@lawfirm.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          minLength={6}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                    </div>
                    <div className="flex items-start space-x-3 pt-2">
                      <Checkbox 
                        id="consent" 
                        checked={consentAccepted}
                        onCheckedChange={(checked) => setConsentAccepted(checked === true)}
                        className="mt-0.5"
                      />
                      <Label 
                        htmlFor="consent" 
                        className="text-sm leading-relaxed cursor-pointer text-muted-foreground"
                      >
                        I agree to receive marketing communications from Beyond Billable Hours and consent to my data being used anonymously for benchmarking and market research.
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
