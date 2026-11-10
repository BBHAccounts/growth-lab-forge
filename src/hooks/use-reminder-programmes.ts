import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBookEntry } from "./use-book-entry";
export function useReminderProgrammes() {
  const entry = useBookEntry();
  return useQuery({ queryKey: ["reminder-programmes", entry.user?.id], enabled: !entry.loading && Boolean(entry.user), queryFn: async () => {
    const { data, error } = await supabase.rpc("book_reminder_programmes");
    if (error) throw error;
    return data ?? [];
  }});
}
