import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBookEntry } from "./use-book-entry";
import { isLibraryModel } from "@/lib/model-library";

export function useModelLibrary() {
  const entry = useBookEntry();
  const query = useQuery({
    queryKey: ["model-library", entry.user?.id],
    enabled: !entry.loading && entry.member,
    queryFn: async () => {
      const { data, error } = await supabase.from("models").select("*").eq("status", "active").order("name");
      if (error) throw error;
      return (data ?? []).filter(isLibraryModel);
    },
  });
  return { entry, ...query };
}