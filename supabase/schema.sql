-- ============================================================
-- MedCare HMS Pro — Complete Supabase Database Schema
-- Run this entire script in your Supabase SQL Editor
-- ============================================================

-- ─── EXTENSIONS ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── 1. PROFILES (linked to auth.users) ──────────────────────
create table if not exists public.profiles (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade not null unique,
  full_name     text not null,
  role          text not null check (role in ('admin','doctor','nurse','receptionist','pharmacy','laboratory','accounts')),
  department    text,
  phone         text,
  created_at    timestamptz default now()
);

-- ─── 2. PATIENTS ─────────────────────────────────────────────
create table if not exists public.patients (
  id                uuid primary key default uuid_generate_v4(),
  registration_no   text unique not null,
  full_name         text not null,
  date_of_birth     date,
  gender            text check (gender in ('male','female','other')),
  blood_group       text,
  phone             text,
  address           text,
  emergency_contact text,
  created_at        timestamptz default now()
);

-- ─── 3. APPOINTMENTS ─────────────────────────────────────────
create table if not exists public.appointments (
  id          uuid primary key default uuid_generate_v4(),
  patient_id  uuid references public.patients(id) on delete cascade,
  doctor_id   uuid references public.profiles(id) on delete set null,
  date        date not null,
  time_slot   text not null,
  status      text default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  notes       text,
  created_at  timestamptz default now()
);

-- ─── 4. MEDICAL RECORDS ──────────────────────────────────────
create table if not exists public.medical_records (
  id             uuid primary key default uuid_generate_v4(),
  patient_id     uuid references public.patients(id) on delete cascade,
  doctor_id      uuid references public.profiles(id) on delete set null,
  visit_date     date not null default current_date,
  diagnosis      text,
  symptoms       text,
  treatment_plan text,
  notes          text,
  created_at     timestamptz default now()
);

-- ─── 5. PRESCRIPTIONS ────────────────────────────────────────
create table if not exists public.prescriptions (
  id          uuid primary key default uuid_generate_v4(),
  patient_id  uuid references public.patients(id) on delete cascade,
  doctor_id   uuid references public.profiles(id) on delete set null,
  record_id   uuid references public.medical_records(id) on delete set null,
  date        date not null default current_date,
  status      text default 'pending' check (status in ('pending','dispensed')),
  created_at  timestamptz default now()
);

-- ─── 6. PRESCRIPTION ITEMS ───────────────────────────────────
create table if not exists public.prescription_items (
  id              uuid primary key default uuid_generate_v4(),
  prescription_id uuid references public.prescriptions(id) on delete cascade,
  medicine_name   text not null,
  dosage          text,
  frequency       text,
  duration        text,
  quantity        integer,
  created_at      timestamptz default now()
);

-- ─── 7. LAB ORDERS ───────────────────────────────────────────
create table if not exists public.lab_orders (
  id           uuid primary key default uuid_generate_v4(),
  patient_id   uuid references public.patients(id) on delete cascade,
  doctor_id    uuid references public.profiles(id) on delete set null,
  record_id    uuid references public.medical_records(id) on delete set null,
  test_name    text not null,
  ordered_date date not null default current_date,
  status       text default 'pending' check (status in ('pending','in-progress','completed')),
  created_at   timestamptz default now()
);

-- ─── 8. LAB RESULTS ──────────────────────────────────────────
create table if not exists public.lab_results (
  id               uuid primary key default uuid_generate_v4(),
  lab_order_id     uuid references public.lab_orders(id) on delete cascade,
  result_value     text,
  reference_range  text,
  remarks          text,
  result_date      date not null default current_date,
  lab_tech_id      uuid references public.profiles(id) on delete set null,
  created_at       timestamptz default now()
);

-- ─── 9. PHARMACY INVENTORY ───────────────────────────────────
create table if not exists public.pharmacy_inventory (
  id                uuid primary key default uuid_generate_v4(),
  medicine_name     text not null,
  generic_name      text,
  category          text,
  quantity_in_stock integer not null default 0,
  unit              text,
  expiry_date       date,
  reorder_level     integer default 10,
  created_at        timestamptz default now()
);

-- ─── 10. DISPENSING RECORDS ──────────────────────────────────
create table if not exists public.dispensing_records (
  id              uuid primary key default uuid_generate_v4(),
  prescription_id uuid references public.prescriptions(id) on delete cascade,
  dispensed_by    uuid references public.profiles(id) on delete set null,
  dispensed_at    timestamptz default now(),
  notes           text,
  created_at      timestamptz default now()
);

-- ─── 11. INVOICES ────────────────────────────────────────────
create table if not exists public.invoices (
  id             uuid primary key default uuid_generate_v4(),
  patient_id     uuid references public.patients(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  total_amount   numeric(12,2) not null default 0,
  paid_amount    numeric(12,2) not null default 0,
  payment_status text default 'unpaid' check (payment_status in ('unpaid','partial','paid')),
  payment_method text,
  created_at     timestamptz default now()
);

-- ─── 12. INVOICE ITEMS ───────────────────────────────────────
create table if not exists public.invoice_items (
  id          uuid primary key default uuid_generate_v4(),
  invoice_id  uuid references public.invoices(id) on delete cascade,
  description text not null,
  quantity    integer not null default 1,
  unit_price  numeric(12,2) not null,
  created_at  timestamptz default now()
);

-- ─── 13. WARD ASSIGNMENTS ────────────────────────────────────
create table if not exists public.ward_assignments (
  id                uuid primary key default uuid_generate_v4(),
  patient_id        uuid references public.patients(id) on delete cascade,
  ward_name         text not null,
  bed_number        text not null,
  admitted_at       timestamptz default now(),
  discharged_at     timestamptz,
  assigned_nurse_id uuid references public.profiles(id) on delete set null,
  created_at        timestamptz default now()
);

-- ─── 14. VITAL SIGNS ─────────────────────────────────────────
create table if not exists public.vital_signs (
  id                uuid primary key default uuid_generate_v4(),
  patient_id        uuid references public.patients(id) on delete cascade,
  nurse_id          uuid references public.profiles(id) on delete set null,
  recorded_at       timestamptz default now(),
  temperature       numeric(4,1),
  blood_pressure    text,
  pulse_rate        integer,
  oxygen_saturation numeric(5,2),
  weight            numeric(5,2),
  height            numeric(5,2),
  created_at        timestamptz default now()
);

-- ─── 15. AUDIT LOGS ──────────────────────────────────────────
create table if not exists public.audit_logs (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete set null,
  action     text not null,
  table_name text,
  record_id  uuid,
  timestamp  timestamptz default now()
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================
alter table public.profiles           enable row level security;
alter table public.patients           enable row level security;
alter table public.appointments       enable row level security;
alter table public.medical_records    enable row level security;
alter table public.prescriptions      enable row level security;
alter table public.prescription_items enable row level security;
alter table public.lab_orders         enable row level security;
alter table public.lab_results        enable row level security;
alter table public.pharmacy_inventory enable row level security;
alter table public.dispensing_records enable row level security;
alter table public.invoices           enable row level security;
alter table public.invoice_items      enable row level security;
alter table public.ward_assignments   enable row level security;
alter table public.vital_signs        enable row level security;
alter table public.audit_logs         enable row level security;

-- ============================================================
-- HELPER FUNCTION: get current user's role
-- ============================================================
create or replace function public.get_my_role()
returns text as $$
  select role from public.profiles where user_id = auth.uid() limit 1;
$$ language sql security definer stable;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- ── PROFILES ─────────────────────────────────────────────────
-- Users can read their own profile; admin can read all
create policy "profiles_select" on public.profiles
  for select using (
    auth.uid() = user_id or public.get_my_role() = 'admin'
  );

-- Only admin can insert/update/delete profiles
create policy "profiles_admin_all" on public.profiles
  for all using (public.get_my_role() = 'admin');

-- ── PATIENTS ─────────────────────────────────────────────────
-- Admin, doctors, nurses, receptionists can view patients
create policy "patients_select" on public.patients
  for select using (
    public.get_my_role() in ('admin','doctor','nurse','receptionist','pharmacy','laboratory','accounts')
  );
-- Admin and receptionist can insert
create policy "patients_insert" on public.patients
  for insert with check (
    public.get_my_role() in ('admin','receptionist')
  );
-- Admin and receptionist can update
create policy "patients_update" on public.patients
  for update using (
    public.get_my_role() in ('admin','receptionist')
  );
-- Only admin can delete
create policy "patients_delete" on public.patients
  for delete using (public.get_my_role() = 'admin');

-- ── APPOINTMENTS ─────────────────────────────────────────────
create policy "appointments_select" on public.appointments
  for select using (
    public.get_my_role() in ('admin','doctor','nurse','receptionist')
  );
create policy "appointments_insert" on public.appointments
  for insert with check (
    public.get_my_role() in ('admin','receptionist','doctor')
  );
create policy "appointments_update" on public.appointments
  for update using (
    public.get_my_role() in ('admin','receptionist','doctor')
  );
create policy "appointments_delete" on public.appointments
  for delete using (public.get_my_role() = 'admin');

-- ── MEDICAL RECORDS ──────────────────────────────────────────
create policy "medical_records_select" on public.medical_records
  for select using (
    public.get_my_role() in ('admin','doctor','nurse')
  );
create policy "medical_records_insert" on public.medical_records
  for insert with check (public.get_my_role() in ('admin','doctor'));
create policy "medical_records_update" on public.medical_records
  for update using (public.get_my_role() in ('admin','doctor'));
create policy "medical_records_delete" on public.medical_records
  for delete using (public.get_my_role() = 'admin');

-- ── PRESCRIPTIONS ─────────────────────────────────────────────
create policy "prescriptions_select" on public.prescriptions
  for select using (
    public.get_my_role() in ('admin','doctor','pharmacy','nurse')
  );
create policy "prescriptions_insert" on public.prescriptions
  for insert with check (public.get_my_role() in ('admin','doctor'));
create policy "prescriptions_update" on public.prescriptions
  for update using (public.get_my_role() in ('admin','doctor','pharmacy'));
create policy "prescriptions_delete" on public.prescriptions
  for delete using (public.get_my_role() = 'admin');

-- ── PRESCRIPTION ITEMS ────────────────────────────────────────
create policy "prescription_items_select" on public.prescription_items
  for select using (
    public.get_my_role() in ('admin','doctor','pharmacy','nurse')
  );
create policy "prescription_items_insert" on public.prescription_items
  for insert with check (public.get_my_role() in ('admin','doctor'));
create policy "prescription_items_delete" on public.prescription_items
  for delete using (public.get_my_role() = 'admin');

-- ── LAB ORDERS ───────────────────────────────────────────────
create policy "lab_orders_select" on public.lab_orders
  for select using (
    public.get_my_role() in ('admin','doctor','laboratory','nurse')
  );
create policy "lab_orders_insert" on public.lab_orders
  for insert with check (public.get_my_role() in ('admin','doctor'));
create policy "lab_orders_update" on public.lab_orders
  for update using (public.get_my_role() in ('admin','doctor','laboratory'));
create policy "lab_orders_delete" on public.lab_orders
  for delete using (public.get_my_role() = 'admin');

-- ── LAB RESULTS ──────────────────────────────────────────────
create policy "lab_results_select" on public.lab_results
  for select using (
    public.get_my_role() in ('admin','doctor','laboratory','nurse')
  );
create policy "lab_results_insert" on public.lab_results
  for insert with check (public.get_my_role() in ('admin','laboratory'));
create policy "lab_results_update" on public.lab_results
  for update using (public.get_my_role() in ('admin','laboratory'));
create policy "lab_results_delete" on public.lab_results
  for delete using (public.get_my_role() = 'admin');

-- ── PHARMACY INVENTORY ────────────────────────────────────────
create policy "pharmacy_inventory_select" on public.pharmacy_inventory
  for select using (
    public.get_my_role() in ('admin','pharmacy','doctor','nurse')
  );
create policy "pharmacy_inventory_insert" on public.pharmacy_inventory
  for insert with check (public.get_my_role() in ('admin','pharmacy'));
create policy "pharmacy_inventory_update" on public.pharmacy_inventory
  for update using (public.get_my_role() in ('admin','pharmacy'));
create policy "pharmacy_inventory_delete" on public.pharmacy_inventory
  for delete using (public.get_my_role() = 'admin');

-- ── DISPENSING RECORDS ────────────────────────────────────────
create policy "dispensing_records_select" on public.dispensing_records
  for select using (
    public.get_my_role() in ('admin','pharmacy','accounts')
  );
create policy "dispensing_records_insert" on public.dispensing_records
  for insert with check (public.get_my_role() in ('admin','pharmacy'));
create policy "dispensing_records_delete" on public.dispensing_records
  for delete using (public.get_my_role() = 'admin');

-- ── INVOICES ─────────────────────────────────────────────────
create policy "invoices_select" on public.invoices
  for select using (
    public.get_my_role() in ('admin','accounts','receptionist')
  );
create policy "invoices_insert" on public.invoices
  for insert with check (public.get_my_role() in ('admin','accounts','receptionist'));
create policy "invoices_update" on public.invoices
  for update using (public.get_my_role() in ('admin','accounts'));
create policy "invoices_delete" on public.invoices
  for delete using (public.get_my_role() = 'admin');

-- ── INVOICE ITEMS ─────────────────────────────────────────────
create policy "invoice_items_select" on public.invoice_items
  for select using (
    public.get_my_role() in ('admin','accounts','receptionist')
  );
create policy "invoice_items_insert" on public.invoice_items
  for insert with check (public.get_my_role() in ('admin','accounts','receptionist'));
create policy "invoice_items_delete" on public.invoice_items
  for delete using (public.get_my_role() = 'admin');

-- ── WARD ASSIGNMENTS ─────────────────────────────────────────
create policy "ward_assignments_select" on public.ward_assignments
  for select using (
    public.get_my_role() in ('admin','nurse','doctor','receptionist')
  );
create policy "ward_assignments_insert" on public.ward_assignments
  for insert with check (public.get_my_role() in ('admin','nurse','receptionist'));
create policy "ward_assignments_update" on public.ward_assignments
  for update using (public.get_my_role() in ('admin','nurse'));
create policy "ward_assignments_delete" on public.ward_assignments
  for delete using (public.get_my_role() = 'admin');

-- ── VITAL SIGNS ───────────────────────────────────────────────
create policy "vital_signs_select" on public.vital_signs
  for select using (
    public.get_my_role() in ('admin','nurse','doctor')
  );
create policy "vital_signs_insert" on public.vital_signs
  for insert with check (public.get_my_role() in ('admin','nurse'));
create policy "vital_signs_update" on public.vital_signs
  for update using (public.get_my_role() in ('admin','nurse'));
create policy "vital_signs_delete" on public.vital_signs
  for delete using (public.get_my_role() = 'admin');

-- ── AUDIT LOGS ────────────────────────────────────────────────
create policy "audit_logs_select" on public.audit_logs
  for select using (public.get_my_role() = 'admin');
create policy "audit_logs_insert" on public.audit_logs
  for insert with check (auth.uid() is not null);

-- ============================================================
-- AUTO-CREATE PROFILE TRIGGER on new user signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'receptionist')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- SAMPLE DATA (optional — comment out if not needed)
-- ============================================================

-- Sample patient registration numbers sequence
create sequence if not exists patient_reg_seq start 1000;

-- ============================================================
-- DONE ✅
-- All tables, RLS policies, and triggers have been created.
-- ============================================================
