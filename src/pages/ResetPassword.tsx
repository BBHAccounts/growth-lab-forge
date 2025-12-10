import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, CheckCircle, KeyRound, ArrowLeft } from "lucide-react";
import glLogoDark from "@/assets/gl-logo-dark.svg";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    const refreshToken = hashParams.get('refresh_token');

    console.log("Reset password page loaded, type:", type);

    if (type === 'recovery' && accessToken) {
      // Set the session with the recovery token
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      }).then(({ data, error }) => {
        if (error) {
          console.error("Error setting session:", error);
          setError("Invalid or expired reset link. Please request a new one.");
        } else if (data.session) {
          console.log("Session set successfully for password reset");
          setSessionReady(true);
        }
      });
    } else {
      // Check if we already have a session from the auth state change
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSessionReady(true);
        } else {
          setError("Invalid or expired reset link. Please request a new one.");
        }
      });
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event);
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setSessionReady(true);
        setError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive"
      });
      return;
    }

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
      setSuccess(true);
      toast({
        title: "Password updated",
        description: "Your password has been successfully reset."
      });
    }
    setLoading(false);
  };

  const handleGoToLogin = async () => {
    // Sign out and redirect to login
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 hero-tech items-center justify-center p-12">
        <div className="max-w-md relative z-10">
          <img alt="Growth Lab" className="w-16 h-16 rounded-xl mb-8" src="/lovable-uploads/89dc4fa4-283a-40b4-aaf9-cd91cde9af43.png" />
          <h1 className="text-4xl font-bold mb-4 text-foreground">Growth Lab</h1>
          <p className="text-xl text-foreground/80 mb-8">
            Strategic frameworks and tools to accelerate your legal business development.
          </p>
          <div className="mt-12 pt-8 border-t border-foreground/20">
            <a href="https://beyondbillablehours.io/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-foreground/60 hover:text-foreground/80 transition-colors">
              <img alt="Beyond Billable Hours" src="/lovable-uploads/795bbaf9-8839-4d49-bec7-219bd69566c9.png" className="h-5 w-5" />
              <span className="text-sm">By Beyond Billable Hours</span>
            </a>
          </div>
        </div>
      </div>

      {/* Right side - Reset password form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md border-border shadow-elevated">
          <CardHeader className="text-center">
            <img src={glLogoDark} alt="Growth Lab" className="lg:hidden w-12 h-12 rounded-lg mx-auto mb-4" />
            <CardTitle className="text-2xl">
              {success ? "Password Updated" : "Create New Password"}
            </CardTitle>
            <CardDescription>
              {success 
                ? "You can now sign in with your new password" 
                : "Enter your new password below"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8 space-y-6">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                  <KeyRound className="h-10 w-10 text-destructive" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-destructive">
                    Link Expired or Invalid
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {error}
                  </p>
                </div>
                <Button onClick={() => navigate("/auth")} className="mt-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              </div>
            ) : success ? (
              <div className="text-center py-8 space-y-6">
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold">
                    Password Changed Successfully!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your password has been updated. You can now sign in with your new password.
                  </p>
                </div>
                <Button onClick={handleGoToLogin} className="w-full mt-4">
                  Sign In Now
                </Button>
              </div>
            ) : sessionReady ? (
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input 
                      id="new-password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
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
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input 
                    id="confirm-password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    minLength={6} 
                    required 
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Update Password
                </Button>
              </form>
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
