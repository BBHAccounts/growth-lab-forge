import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, CheckCircle, KeyRound, ArrowLeft } from "lucide-react";
import { BookLayout } from "@/components/book/BookLayout";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [token]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
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
    
    try {
      const { data, error: resetError } = await supabase.functions.invoke("reset-password", {
        body: {
          token,
          new_password: newPassword
        }
      });
      
      if (resetError) {
        toast({
          title: "Password update failed",
          description: resetError.message,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      if (data?.error) {
        setError(data.error);
        toast({
          title: "Password update failed",
          description: data.error,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast({
        title: "Password updated",
        description: "Your password has been successfully reset."
      });
    } catch (err: any) {
      toast({
        title: "Password update failed",
        description: err.message || "An unexpected error occurred",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  return (
    <BookLayout>
      {/* Right side - Reset password form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md border-border shadow-elevated">
          <CardHeader className="text-center">
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
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto">
                  <CheckCircle className="h-10 w-10 text-foreground" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold">
                    Password updated
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your password has been updated. You can now sign in with your new password.
                  </p>
                </div>
                <Button onClick={() => navigate("/auth")} className="w-full mt-4">
                  Sign In Now
                </Button>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </div>
    </BookLayout>
  );
}