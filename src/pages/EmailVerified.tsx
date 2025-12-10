import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader2, XCircle, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const EmailVerified = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const token = searchParams.get("token");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError("Invalid verification link. No token provided.");
        setIsVerifying(false);
        return;
      }

      try {
        const { data, error: verifyError } = await supabase.functions.invoke("verify-email", {
          body: { token },
        });

        if (verifyError) {
          console.error("Verification error:", verifyError);
          setError(verifyError.message || "Verification failed. Please try again.");
        } else if (data?.error) {
          setError(data.error);
        } else if (data?.needs_password) {
          // Invited user needs to set password
          setNeedsPassword(true);
          setUserEmail(data.user_email);
        } else if (data?.success) {
          setIsVerified(true);
        } else {
          setError("Verification failed. Please try again.");
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setError(err.message || "Verification failed. Please try again.");
      }

      setIsVerifying(false);
    };

    verifyEmail();
  }, [token]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSettingPassword(true);
    setError(null);

    try {
      const { data, error: verifyError } = await supabase.functions.invoke("verify-email", {
        body: { token, password },
      });

      if (verifyError) {
        setError(verifyError.message || "Failed to set password");
      } else if (data?.error) {
        setError(data.error);
      } else if (data?.success) {
        setIsVerified(true);
        setNeedsPassword(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to set password");
    }

    setIsSettingPassword(false);
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying your email...</p>
        </div>
      </div>
    );
  }

  if (needsPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Complete Your Account
            </h1>
            <p className="text-muted-foreground">
              Set a password to finish setting up your Growth Lab account
              {userEmail && <span className="block mt-1 text-sm">for <strong>{userEmail}</strong></span>}
            </p>
          </div>

          <form onSubmit={handleSetPassword} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
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

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSettingPassword}>
              {isSettingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Setting up account...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            Welcome to Growth Lab by Beyond Billable Hours
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-destructive/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Verification Failed
          </h1>
          <p className="text-muted-foreground mb-8">
            {error}
          </p>
          <Button onClick={() => navigate("/auth")} className="w-full">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-12 w-12 text-primary" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-4">
          Account Ready!
        </h1>
        
        <p className="text-muted-foreground mb-8">
          Your email has been verified and your account is all set. You can now log in to Growth Lab and start exploring strategic frameworks and tools.
        </p>
        
        <Button 
          onClick={() => navigate("/auth")} 
          className="w-full"
          size="lg"
        >
          Continue to Login
        </Button>
        
        <p className="text-sm text-muted-foreground mt-6">
          Welcome to Growth Lab by Beyond Billable Hours
        </p>
      </div>
    </div>
  );
};

export default EmailVerified;
