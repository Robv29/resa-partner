-- =========================================================================
-- VGS AUTOS — Booking app schema
-- Remplace le système Google Sheet / "bon de commande" Excel par site.
-- =========================================================================

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------------------
-- PROFILES (étend auth.users) — rôle + rattachement site
-- -------------------------------------------------------------------------
create type user_role as enum ('admin', 'manager', 'client');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'client',
  full_name text not null,
  email text not null,
  -- pour un client : le site auquel il est rattaché (un contact = un site).
  -- Pas de "references sites(id)" ici : la table sites n'existe pas encore.
  -- La contrainte de clé étrangère est ajoutée plus bas, une fois "sites" créée.
  site_id uuid,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------------------
-- SITES (concessions clientes)
-- -------------------------------------------------------------------------
create table sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,                     -- ex: "REITER", "INVEST CARS"
  address text,
  -- manager interne VGS Autos référent (reçoit les notifs de nouvelles plaques)
  manager_id uuid references profiles(id) on delete set null,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

alter table profiles
  add constraint profiles_site_id_fkey foreign key (site_id) references sites(id) on delete set null;

-- -------------------------------------------------------------------------
-- OPTIONS (catalogue global des prestations : lavage de base + suppléments)
-- ex: "Lavage extérieur", "Cuirs complet + nourrissage", "Retrait sticker"...
-- -------------------------------------------------------------------------
create table options (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_base boolean not null default false, -- true = prestation de base (le lavage lui-même)
  sort_order int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------------------
-- SITE_OPTIONS — quelles options sont dispo sur quel site, et à quel prix.
-- C'est ici que se règle "les options dispo par site, les prix par site".
-- -------------------------------------------------------------------------
create table site_options (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  option_id uuid not null references options(id) on delete cascade,
  price numeric(10,2) not null default 0,
  active boolean not null default true,
  unique (site_id, option_id)
);

-- -------------------------------------------------------------------------
-- BOOKINGS — une ligne = une plaque déposée pour nettoyage
-- -------------------------------------------------------------------------
create type booking_status as enum ('pending', 'scheduled', 'done', 'cancelled');

create table bookings (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  requested_by uuid not null references profiles(id) on delete set null,

  plate text not null,
  brand_model text,
  attention_notes text,               -- "point d'attention" (goudron, taches...)

  status booking_status not null default 'pending',
  scheduled_date date,
  scheduled_time time,
  scheduled_by uuid references profiles(id) on delete set null,

  -- semaine ISO ciblée par la demande (calculée à l'insertion côté appli)
  iso_week text not null,             -- format "2026-W31"

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_site_id_idx on bookings(site_id);
create index bookings_status_idx on bookings(status);
create index bookings_scheduled_date_idx on bookings(scheduled_date);

-- -------------------------------------------------------------------------
-- BOOKING_OPTIONS — options choisies pour une plaque, prix figé au moment
-- de la demande (pour que la facturation reste exacte même si le tarif
-- du site change ensuite).
-- -------------------------------------------------------------------------
create table booking_options (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  option_id uuid not null references options(id) on delete restrict,
  option_name text not null,          -- snapshot du nom au moment de la demande
  price numeric(10,2) not null,       -- snapshot du prix au moment de la demande
  unique (booking_id, option_id)
);

create index booking_options_booking_id_idx on booking_options(booking_id);

-- -------------------------------------------------------------------------
-- WEEKLY_REMINDER_LOG — trace des relances du vendredi (anti-doublon)
-- -------------------------------------------------------------------------
create table weekly_reminder_log (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  iso_week text not null,
  sent_at timestamptz not null default now(),
  recipients_count int not null default 0,
  unique (site_id, iso_week)
);

-- -------------------------------------------------------------------------
-- updated_at auto
-- -------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger bookings_set_updated_at
  before update on bookings
  for each row execute function set_updated_at();

-- =========================================================================
-- ROW LEVEL SECURITY
-- =========================================================================
alter table profiles enable row level security;
alter table sites enable row level security;
alter table options enable row level security;
alter table site_options enable row level security;
alter table bookings enable row level security;
alter table booking_options enable row level security;
alter table weekly_reminder_log enable row level security;

-- Helpers rôle / site de l'utilisateur courant.
-- SECURITY DEFINER + search_path figé : indispensable, sinon ces fonctions
-- déclenchent à nouveau les policies RLS de "profiles" en les appelant,
-- ce qui provoque une récursion infinie sur la table profiles elle-même.
create or replace function auth_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function auth_site_id() returns uuid
language sql stable security definer set search_path = public as $$
  select site_id from profiles where id = auth.uid();
$$;

-- PROFILES : chacun voit son propre profil ; admin/manager voient tout
create policy profiles_select on profiles for select
  using (id = auth.uid() or auth_role() in ('admin','manager'));
create policy profiles_update_self on profiles for update
  using (id = auth.uid());
create policy profiles_admin_all on profiles for all
  using (auth_role() = 'admin') with check (auth_role() = 'admin');

-- SITES : client voit uniquement son site ; admin/manager voient tout
create policy sites_select on sites for select
  using (auth_role() in ('admin','manager') or id = auth_site_id());
create policy sites_admin_write on sites for insert with check (auth_role() = 'admin');
create policy sites_admin_update on sites for update using (auth_role() = 'admin');
create policy sites_admin_delete on sites for delete using (auth_role() = 'admin');

-- OPTIONS (catalogue) : lecture pour tous les connectés, écriture admin
create policy options_select on options for select using (auth.uid() is not null);
create policy options_admin_write on options for insert with check (auth_role() = 'admin');
create policy options_admin_update on options for update using (auth_role() = 'admin');
create policy options_admin_delete on options for delete using (auth_role() = 'admin');

-- SITE_OPTIONS : client voit celles de son site (actives) ; admin gère tout
create policy site_options_select on site_options for select
  using (auth_role() in ('admin','manager') or site_id = auth_site_id());
create policy site_options_admin_write on site_options for insert with check (auth_role() = 'admin');
create policy site_options_admin_update on site_options for update using (auth_role() = 'admin');
create policy site_options_admin_delete on site_options for delete using (auth_role() = 'admin');

-- BOOKINGS : client CRUD limité à son site ; admin/manager tout
create policy bookings_select on bookings for select
  using (auth_role() in ('admin','manager') or site_id = auth_site_id());
create policy bookings_client_insert on bookings for insert
  with check (
    auth_role() = 'client' and site_id = auth_site_id()
    or auth_role() in ('admin','manager')
  );
create policy bookings_update on bookings for update
  using (
    auth_role() in ('admin','manager')
    or (auth_role() = 'client' and site_id = auth_site_id() and status = 'pending')
  );
create policy bookings_admin_delete on bookings for delete using (auth_role() = 'admin');

-- BOOKING_OPTIONS : suit la visibilité de la réservation parente
create policy booking_options_select on booking_options for select
  using (exists (
    select 1 from bookings b where b.id = booking_options.booking_id
    and (auth_role() in ('admin','manager') or b.site_id = auth_site_id())
  ));
create policy booking_options_insert on booking_options for insert
  with check (exists (
    select 1 from bookings b where b.id = booking_options.booking_id
    and (auth_role() in ('admin','manager') or b.site_id = auth_site_id())
  ));
create policy booking_options_delete on booking_options for delete
  using (auth_role() in ('admin','manager'));

-- WEEKLY_REMINDER_LOG : admin/manager seulement
create policy weekly_log_select on weekly_reminder_log for select
  using (auth_role() in ('admin','manager'));

-- =========================================================================
-- Données de départ (catalogue d'options observé sur le bon de commande
-- REITER — à ajuster / dupliquer par site dans l'admin ensuite)
-- =========================================================================
insert into options (name, description, is_base, sort_order) values
  ('Lavage standard', 'Prestation de nettoyage de base', true, 0),
  ('Déperlant carrosserie', 'Protection hydrophobe appliquée après lavage extérieur', false, 1),
  ('Cuirs complet + nourrissage', 'Nettoyage en profondeur de tous les cuirs + application de nourrissant', false, 2),
  ('Retrait sticker ≤ 15 cm', 'Par sticker. Au-delà de 15 cm, à valider au préalable.', false, 3),
  ('Véhicule très sale', 'Forfait pour tout véhicule nécessitant un traitement renforcé', false, 4),
  ('Dégoudronnage / dérésinage', 'Retrait des projections de goudron ou de résine sur la carrosserie', false, 5),
  ('Teinture moquette', 'Application de teinture sur moquette décolorée', false, 6),
  ('Nettoyage jante profondeur', 'Nettoyage complet des jantes, y compris les recoins', false, 7);
