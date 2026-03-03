import { createClient } from "@/lib/supabase/server";
import { getPhaseSettings, getScoringSettings, getDefaultScoringCriteria } from "@/services/scoring";
import { SettingsNav } from "@/components/settings/settings-nav";
import { SettingsView } from "@/components/settings/settings-view";
import type { PhaseSetting, ScoringSetting } from "@/types";
import { DEFAULT_PHASES } from "@/types";

export default async function SettingsPage() {
  let phases: PhaseSetting[];
  let scoring: ScoringSetting[];
  let isAdmin = false;
  let workDays = [1, 2, 3, 4, 5];
  let missionCategories = ["sales", "marketing"];

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("role, work_days, mission_categories")
        .eq("id", user.id)
        .single();
      isAdmin = profile?.role === "admin";
      if (profile?.work_days) workDays = profile.work_days;
      if (profile?.mission_categories) missionCategories = profile.mission_categories;
    }

    const dbPhases = await getPhaseSettings();
    phases = dbPhases.length > 0
      ? dbPhases
      : DEFAULT_PHASES.map((p, i) => ({ ...p, id: `default-${i}`, org_id: "" })) as PhaseSetting[];

    const dbScoring = await getScoringSettings();
    scoring = dbScoring.length > 0
      ? dbScoring
      : getDefaultScoringCriteria().map((s, i) => ({ ...s, id: `default-${i}`, org_id: "" })) as ScoringSetting[];
  } catch {
    phases = DEFAULT_PHASES.map((p, i) => ({ ...p, id: `default-${i}`, org_id: "" })) as PhaseSetting[];
    scoring = getDefaultScoringCriteria().map((s, i) => ({ ...s, id: `default-${i}`, org_id: "" })) as ScoringSetting[];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure pipeline phases and lead scoring criteria
        </p>
      </div>
      <SettingsNav isAdmin={isAdmin} />
      <SettingsView phases={phases} scoring={scoring} workDays={workDays} missionCategories={missionCategories} />
    </div>
  );
}
