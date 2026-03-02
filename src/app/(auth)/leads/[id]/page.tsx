import { notFound } from "next/navigation";
import { getLead, getLeadActivities } from "@/services/leads";
import { getScoringSettings, getDefaultScoringCriteria } from "@/services/scoring";
import { LeadDetailView } from "@/components/leads/lead-detail-view";
import type { ScoringSetting } from "@/types";

export default async function LeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const lead = await getLead(params.id).catch(() => null);
  if (!lead) notFound();

  let activities;
  try {
    activities = await getLeadActivities(params.id);
  } catch {
    activities = [];
  }

  let scoringSettings: ScoringSetting[];
  try {
    const dbSettings = await getScoringSettings();
    scoringSettings = dbSettings.length > 0
      ? dbSettings
      : getDefaultScoringCriteria().map((s, i) => ({ ...s, id: `default-${i}`, org_id: "" })) as ScoringSetting[];
  } catch {
    scoringSettings = getDefaultScoringCriteria().map((s, i) => ({ ...s, id: `default-${i}`, org_id: "" })) as ScoringSetting[];
  }

  return (
    <LeadDetailView
      lead={lead}
      activities={activities}
      scoringSettings={scoringSettings}
    />
  );
}
