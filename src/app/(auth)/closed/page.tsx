import { createClient } from "@/lib/supabase/server";
import { ClosedDealsView } from "@/components/closed/closed-deals-view";
import type { Lead } from "@/types";

export default async function ClosedPage() {
  let won: Lead[] = [];
  let lost: Lead[] = [];
  let users: { id: string; full_name: string }[] = [];

  try {
    const supabase = createClient();

    const [wonResult, lostResult, usersResult] = await Promise.all([
      supabase
        .from("leads")
        .select("*")
        .eq("phase", "Closed Won")
        .order("last_activity_at", { ascending: false }),
      supabase
        .from("leads")
        .select("*")
        .eq("phase", "Closed Lost")
        .order("last_activity_at", { ascending: false }),
      supabase.from("users").select("id, full_name"),
    ]);

    won = wonResult.data ?? [];
    lost = lostResult.data ?? [];
    users = usersResult.data ?? [];
  } catch {
    // fallback to empty
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Closed Deals</h1>
        <p className="text-sm text-muted-foreground">
          Review won and lost deals with performance metrics
        </p>
      </div>
      <ClosedDealsView won={won} lost={lost} users={users} />
    </div>
  );
}
