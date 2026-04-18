-- ============================================================
-- MedCare HMS Pro — Schema Upgrade v1.1
-- ============================================================

-- 1. Add is_active to profiles
alter table public.profiles 
add column if not exists is_active boolean default true;

-- 2. Create hospital_settings table
create table if not exists public.hospital_settings (
  id           integer primary key default 1,
  name         text not null default 'MedCare HMS Pro',
  logo_url     text,
  address      text,
  phone        text,
  email        text,
  currency     text default '₨',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  constraint single_row check (id = 1)
);

alter table public.hospital_settings enable row level security;

create policy "Settings select" on public.hospital_settings 
  for select using (true);

create policy "Settings update" on public.hospital_settings 
  for update using (public.get_my_role() = 'admin');

-- 3. Insert default settings if not exists
insert into public.hospital_settings (id, name)
values (1, 'MedCare HMS Pro')
on conflict (id) do nothing;

-- 4. Audit Log Triggers
create or replace function public.log_table_change()
returns trigger as $$
begin
  insert into public.audit_logs (user_id, action, table_name, record_id)
  values (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    case 
      when TG_OP = 'DELETE' then OLD.id 
      else NEW.id 
    end
  );
  return null;
end;
$$ language plpgsql security definer;

-- Apply triggers to key tables
drop trigger if exists on_patients_change on public.patients;
create trigger on_patients_change
  after insert or update or delete on public.patients
  for each row execute procedure public.log_table_change();

drop trigger if exists on_appointments_change on public.appointments;
create trigger on_appointments_change
  after insert or update or delete on public.appointments
  for each row execute procedure public.log_table_change();

drop trigger if exists on_invoices_change on public.invoices;
create trigger on_invoices_change
  after insert or update or delete on public.invoices
  for each row execute procedure public.log_table_change();

drop trigger if exists on_prescriptions_change on public.prescriptions;
create trigger on_prescriptions_change
  after insert or update or delete on public.prescriptions
  for each row execute procedure public.log_table_change();

-- 5. Profile Synchronization & Safety
-- Ensure existing auth users have a profile entry
insert into public.profiles (user_id, full_name, role)
select 
  id, 
  coalesce(raw_user_meta_data ->> 'full_name', email),
  coalesce(raw_user_meta_data ->> 'role', 'receptionist')
from auth.users
where id not in (select user_id from public.profiles)
on conflict (user_id) do nothing;

-- Allow users to create their own record if trigger misses (JIT Support)
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = user_id);

-- ── 6. ROLE CONSTRAINT FIX ───────────────────────────────────
-- Drop and recreate the role check constraint to allow 'staff'
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check 
  check (role in ('admin','doctor','nurse','receptionist','pharmacy','laboratory','accounts','staff'));
