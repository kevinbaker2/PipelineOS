-- Add score_details column to leads table
-- Stores array of scoring_setting IDs that are checked for this lead
alter table public.leads add column if not exists score_details jsonb default '[]'::jsonb;
