-- ============================================================
-- MedCare HMS Pro — Clinical Expansion Schema (v2.0)
-- Run this script in your Supabase SQL Editor
-- ============================================================

-- ─── 1. ALLERGIES ─────────────────────────────────────────────
create table if not exists public.patient_allergies (
  id             uuid primary key default uuid_generate_v4(),
  patient_id     uuid references public.patients(id) on delete cascade,
  allergen       text not null, -- e.g., 'Penicillin', 'Peanuts'
  reaction       text,          -- e.g., 'Anaphylaxis', 'Hives'
  severity       text check (severity in ('mild', 'moderate', 'severe')),
  identified_on  date,
  notes          text,
  created_at     timestamptz default now()
);

alter table public.patient_allergies enable row level security;
create policy "allergies_select" on public.patient_allergies for select using (public.get_my_role() in ('admin','doctor','nurse','pharmacy'));
create policy "allergies_insert" on public.patient_allergies for insert with check (public.get_my_role() in ('admin','doctor','nurse'));
create policy "allergies_update" on public.patient_allergies for update using (public.get_my_role() in ('admin','doctor','nurse'));

-- ─── 2. IMMUNIZATIONS ─────────────────────────────────────────
create table if not exists public.patient_immunizations (
  id             uuid primary key default uuid_generate_v4(),
  patient_id     uuid references public.patients(id) on delete cascade,
  vaccine_name   text not null,
  date_given     date not null,
  administered_by uuid references public.profiles(id) on delete set null,
  notes          text,
  created_at     timestamptz default now()
);

alter table public.patient_immunizations enable row level security;
create policy "immunizations_select" on public.patient_immunizations for select using (public.get_my_role() in ('admin','doctor','nurse'));
create policy "immunizations_all" on public.patient_immunizations for all using (public.get_my_role() in ('admin','doctor','nurse'));

-- ─── 3. FAMILY HISTORY ────────────────────────────────────────
create table if not exists public.patient_family_history (
  id             uuid primary key default uuid_generate_v4(),
  patient_id     uuid references public.patients(id) on delete cascade,
  relation       text not null, -- e.g., 'Father', 'Mother'
  condition      text not null, -- e.g., 'Type 2 Diabetes'
  notes          text,
  created_at     timestamptz default now()
);

alter table public.patient_family_history enable row level security;
create policy "family_history_select" on public.patient_family_history for select using (public.get_my_role() in ('admin','doctor','nurse'));
create policy "family_history_all" on public.patient_family_history for all using (public.get_my_role() in ('admin','doctor'));

-- ─── 4. INSURANCE & BILLING ───────────────────────────────────
create table if not exists public.patient_insurance (
  id               uuid primary key default uuid_generate_v4(),
  patient_id       uuid references public.patients(id) on delete cascade,
  provider_name    text not null,
  policy_number    text not null,
  group_number     text,
  valid_from       date,
  valid_to         date,
  copay_amount     numeric(12,2) default 0,
  is_primary       boolean default true,
  created_at       timestamptz default now()
);

alter table public.patient_insurance enable row level security;
create policy "insurance_select" on public.patient_insurance for select using (public.get_my_role() in ('admin','accounts','receptionist','doctor'));
create policy "insurance_insert_update" on public.patient_insurance for all using (public.get_my_role() in ('admin','accounts','receptionist'));

-- ─── 5. VITALS EXPANSION (Pain Scale, BMI) ────────────────────
-- Note: Re-running ADD COLUMN IF NOT EXISTS is safe in Postgres if the table exists.
alter table public.vital_signs
add column if not exists pain_scale integer check (pain_scale >= 0 and pain_scale <= 10),
add column if not exists bmi numeric(5,2);

-- ─── 6. CLINICAL SOAP NOTES & ICD-10 (Medical Records) ────────
alter table public.medical_records
add column if not exists soap_subjective text,
add column if not exists soap_objective text,
add column if not exists soap_assessment text,
add column if not exists soap_plan text,
add column if not exists icd_10_codes jsonb default '[]'::jsonb; -- e.g. ["E11.9", "I10"]

-- ============================================================
-- Triggers for Audit Logs
-- ============================================================
do $$ 
begin
  if exists (select 1 from pg_proc where proname = 'log_table_change') then
    drop trigger if exists on_allergies_change on public.patient_allergies;
    create trigger on_allergies_change after insert or update or delete on public.patient_allergies for each row execute procedure public.log_table_change();

    drop trigger if exists on_insurance_change on public.patient_insurance;
    create trigger on_insurance_change after insert or update or delete on public.patient_insurance for each row execute procedure public.log_table_change();
  end if;
end $$;
