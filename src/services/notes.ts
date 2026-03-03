import { createClient } from "@/lib/supabase/server";
import type { TeamNote } from "@/types";

export async function getTeamNotes(): Promise<TeamNote[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("team_notes")
    .select("*, user:users(full_name)")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;

  return (data ?? []).map((note) => ({
    id: note.id,
    org_id: note.org_id,
    user_id: note.user_id,
    content: note.content,
    color: note.color,
    created_at: note.created_at,
    user_name: (note.user as { full_name: string } | null)?.full_name ?? "Unknown",
  }));
}
