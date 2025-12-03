import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { HeroBanner } from "@/components/ui/hero-banner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Mail } from "lucide-react";

export default function GameOfLife() {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("game_of_life_access")
          .eq("user_id", user.id)
          .single();

        setHasAccess(profile?.game_of_life_access || false);
      }
      setLoading(false);
    };

    checkAccess();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="animate-pulse p-8">
          <div className="h-48 bg-muted rounded-lg" />
        </div>
      </AppLayout>
    );
  }

  if (!hasAccess) {
    return (
      <AppLayout>
        <HeroBanner
          emoji="🎲"
          title="Law Firm Game of Life"
          description="An immersive simulation experience for legal professionals."
        />

        <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md text-center">
            <CardHeader>
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Lock className="h-10 w-10 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl">Access Restricted</CardTitle>
              <CardDescription className="text-base">
                The Law Firm Game of Life is an exclusive feature available only to selected users.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Interested in gaining access? Contact us to learn more about this immersive workshop experience.
              </p>
              <Button asChild className="w-full">
                <a href="mailto:hello@beyondbillablehours.com?subject=Game%20of%20Life%20Access">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Us
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // If user has access, show the actual game content
  return (
    <AppLayout>
      <HeroBanner
        emoji="🎲"
        title="Law Firm Game of Life"
        description="Navigate your career through strategic decisions and unexpected challenges."
      />

      <div className="p-6 md:p-8">
        <Card className="text-center p-12">
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground">
            The Game of Life experience is being prepared for you. Stay tuned!
          </p>
        </Card>
      </div>
    </AppLayout>
  );
}
