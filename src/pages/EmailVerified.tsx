import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const EmailVerified = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (tokenHash && type === "signup") {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "signup",
          });

          if (error) {
            setError(error.message);
          } else {
            setIsVerified(true);
          }
        } catch (err: any) {
          setError(err.message || "Verification failed");
        }
      } else {
        // No token hash, assume already verified or direct access
        setIsVerified(true);
      }
      setIsVerifying(false);
    };

    verifyEmail();
  }, [searchParams]);

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-destructive/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠️</span>
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
          Email Verified Successfully!
        </h1>
        
        <p className="text-muted-foreground mb-8">
          Your email address has been verified. You can now log in to your Growth Lab account and start exploring our strategic frameworks and tools.
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
