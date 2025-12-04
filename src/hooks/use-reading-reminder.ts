import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

export function useReadingReminder() {
  const [showReminder, setShowReminder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastReadDate, setLastReadDate] = useState<Date | null>(null);

  useEffect(() => {
    const checkLastRead = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Get the most recent resource view
      const { data, error } = await supabase
        .from("user_resource_views")
        .select("viewed_at")
        .eq("user_id", user.id)
        .order("viewed_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned, which is fine
        console.error("Error checking last read:", error);
      }

      if (data) {
        const lastRead = new Date(data.viewed_at);
        setLastReadDate(lastRead);
        const timeSinceLastRead = Date.now() - lastRead.getTime();
        setShowReminder(timeSinceLastRead > TWO_WEEKS_MS);
      } else {
        // User has never read an article
        setShowReminder(true);
      }

      setLoading(false);
    };

    checkLastRead();
  }, []);

  const dismissReminder = () => {
    setShowReminder(false);
  };

  return { showReminder, loading, lastReadDate, dismissReminder };
}

export async function trackResourceView(resourceId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return;

  await supabase
    .from("user_resource_views")
    .insert({
      user_id: user.id,
      resource_id: resourceId,
    });
}
