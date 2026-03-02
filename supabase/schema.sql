-- PipelineOS Database Schema
-- Multi-tenant B2B Sales Intelligence Platform

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

create table public.organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  created_at timestamptz default now() not null
);

create table public.users (
  id uuid references auth.users on delete cascade primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  email text not null,
  full_name text not null default '',
  role text not null default 'sales' check (role in ('admin', 'sales')),
  avatar_url text,
  xp_total integer not null default 0,
  created_at timestamptz default now() not null
);

create table public.leads (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  phase text not null default 'Discovery',
  sector text not null default 'Technology',
  country text not null default 'US',
  source text not null default 'inbound' check (source in ('inbound', 'outbound')),
  expected_mrr numeric(12,2) not null default 0,
  probability integer not null default 0 check (probability >= 0 and probability <= 100),
  forecast_month text not null default to_char(now(), 'YYYY-MM'),
  score integer not null default 0 check (score >= 0 and score <= 100),
  score_details jsonb default '[]'::jsonb,
  notes text,
  assigned_to uuid references public.users(id),
  created_at timestamptz default now() not null,
  last_activity_at timestamptz default now() not null
);

create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  lead_id uuid references public.leads(id) on delete set null,
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  xp_value integer not null default 10,
  due_date date not null default current_date,
  completed_at timestamptz,
  created_at timestamptz default now() not null
);

create table public.activities (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  lead_id uuid references public.leads(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null check (type in ('call', 'email', 'meeting', 'note', 'proposal', 'follow_up')),
  notes text not null default '',
  created_at timestamptz default now() not null
);

create table public.phase_settings (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  "order" integer not null,
  color text not null default '#6366f1',
  target_days integer not null default 7
);

create table public.scoring_settings (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  category text not null check (category in ('firmographic', 'engagement', 'strategic')),
  key text not null,
  label text not null,
  max_points integer not null default 10
);

-- ============================================
-- INDEXES
-- ============================================

create index idx_users_org_id on public.users(org_id);
create index idx_leads_org_id on public.leads(org_id);
create index idx_leads_phase on public.leads(phase);
create index idx_leads_assigned on public.leads(assigned_to);
create index idx_leads_forecast on public.leads(forecast_month);
create index idx_tasks_org_id on public.tasks(org_id);
create index idx_tasks_user_id on public.tasks(user_id);
create index idx_tasks_lead_id on public.tasks(lead_id);
create index idx_tasks_due_date on public.tasks(due_date);
create index idx_activities_org_id on public.activities(org_id);
create index idx_activities_lead_id on public.activities(lead_id);
create index idx_phase_settings_org_id on public.phase_settings(org_id);
create index idx_scoring_settings_org_id on public.scoring_settings(org_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.organizations enable row level security;
alter table public.users enable row level security;
alter table public.leads enable row level security;
alter table public.tasks enable row level security;
alter table public.activities enable row level security;
alter table public.phase_settings enable row level security;
alter table public.scoring_settings enable row level security;

-- Helper function: get user's org_id
create or replace function public.get_user_org_id()
returns uuid as $$
  select org_id from public.users where id = auth.uid()
$$ language sql security definer stable;

-- Organizations: users can only see their own org
create policy "Users can view own organization"
  on public.organizations for select
  using (id = public.get_user_org_id());

create policy "Users can insert organizations"
  on public.organizations for insert
  with check (true);

-- Users: can only see users in their org
create policy "Users can view org members"
  on public.users for select
  using (org_id = public.get_user_org_id());

create policy "Users can update own profile"
  on public.users for update
  using (id = auth.uid());

create policy "Users can insert self"
  on public.users for insert
  with check (id = auth.uid());

-- Leads: full CRUD scoped to org
create policy "Users can view org leads"
  on public.leads for select
  using (org_id = public.get_user_org_id());

create policy "Users can insert org leads"
  on public.leads for insert
  with check (org_id = public.get_user_org_id());

create policy "Users can update org leads"
  on public.leads for update
  using (org_id = public.get_user_org_id());

create policy "Users can delete org leads"
  on public.leads for delete
  using (org_id = public.get_user_org_id());

-- Tasks: full CRUD scoped to org
create policy "Users can view org tasks"
  on public.tasks for select
  using (org_id = public.get_user_org_id());

create policy "Users can insert org tasks"
  on public.tasks for insert
  with check (org_id = public.get_user_org_id());

create policy "Users can update org tasks"
  on public.tasks for update
  using (org_id = public.get_user_org_id());

create policy "Users can delete org tasks"
  on public.tasks for delete
  using (org_id = public.get_user_org_id());

-- Activities: full CRUD scoped to org
create policy "Users can view org activities"
  on public.activities for select
  using (org_id = public.get_user_org_id());

create policy "Users can insert org activities"
  on public.activities for insert
  with check (org_id = public.get_user_org_id());

create policy "Users can delete org activities"
  on public.activities for delete
  using (org_id = public.get_user_org_id());

-- Phase settings: select for all org members, mutations for admins
create policy "Users can view org phase settings"
  on public.phase_settings for select
  using (org_id = public.get_user_org_id());

create policy "Admins can insert phase settings"
  on public.phase_settings for insert
  with check (
    org_id = public.get_user_org_id()
    and exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update phase settings"
  on public.phase_settings for update
  using (
    org_id = public.get_user_org_id()
    and exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete phase settings"
  on public.phase_settings for delete
  using (
    org_id = public.get_user_org_id()
    and exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- Scoring settings: select for all org members, mutations for admins
create policy "Users can view org scoring settings"
  on public.scoring_settings for select
  using (org_id = public.get_user_org_id());

create policy "Admins can insert scoring settings"
  on public.scoring_settings for insert
  with check (
    org_id = public.get_user_org_id()
    and exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update scoring settings"
  on public.scoring_settings for update
  using (
    org_id = public.get_user_org_id()
    and exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete scoring settings"
  on public.scoring_settings for delete
  using (
    org_id = public.get_user_org_id()
    and exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- ============================================
-- XP RECALCULATION
-- ============================================

-- Function to recalculate a user's xp_total from completed tasks
create or replace function public.recalculate_user_xp()
returns trigger as $$
begin
  -- Update the affected user's xp_total
  if (TG_OP = 'DELETE') then
    update public.users
    set xp_total = coalesce((
      select sum(xp_value) from public.tasks
      where user_id = OLD.user_id and completed_at is not null
    ), 0)
    where id = OLD.user_id;
    return OLD;
  else
    update public.users
    set xp_total = coalesce((
      select sum(xp_value) from public.tasks
      where user_id = NEW.user_id and completed_at is not null
    ), 0)
    where id = NEW.user_id;
    -- If user_id changed on update, also recalc the old user
    if (TG_OP = 'UPDATE' and OLD.user_id != NEW.user_id) then
      update public.users
      set xp_total = coalesce((
        select sum(xp_value) from public.tasks
        where user_id = OLD.user_id and completed_at is not null
      ), 0)
      where id = OLD.user_id;
    end if;
    return NEW;
  end if;
end;
$$ language plpgsql security definer;

-- Trigger on tasks table to keep xp_total in sync
create trigger trg_recalculate_user_xp
  after insert or update or delete on public.tasks
  for each row execute function public.recalculate_user_xp();
