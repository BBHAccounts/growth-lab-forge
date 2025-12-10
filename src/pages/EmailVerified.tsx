import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const EmailVerified = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");

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
