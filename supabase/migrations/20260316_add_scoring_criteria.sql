-- Add "Company size 10-50" scoring criterion (firmographic)
INSERT INTO public.scoring_settings (org_id, category, key, label, max_points)
VALUES ('790916f3-4316-4c3b-929a-716c1f14f8a2', 'firmographic', 'company_size_small', 'Company size 10-50', 8)
ON CONFLICT DO NOTHING;

-- Add "Conversation started" scoring criterion (engagement)
INSERT INTO public.scoring_settings (org_id, category, key, label, max_points)
VALUES ('790916f3-4316-4c3b-929a-716c1f14f8a2', 'engagement', 'conversation_started', 'Conversation started', 8)
ON CONFLICT DO NOTHING;
