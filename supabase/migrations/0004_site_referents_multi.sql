-- =========================================================================
-- Un site ne pouvait avoir qu'un seul "manager référent" (recevant les
-- notifications de nouvelles plaques). Robin a besoin de pouvoir désigner
-- plusieurs référents par site, et de pouvoir y mettre un admin (pas
-- seulement un manager). On remplace la colonne unique sites.manager_id par
-- une table de liaison site_referents (site_id, profile_id), qui accepte
-- n'importe quel profil admin ou manager, en nombre illimité.
-- =========================================================================

create table site_referents (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (site_id, profile_id)
);

create index site_referents_site_id_idx on site_referents(site_id);

alter table site_referents enable row level security;

-- Lecture : admin/manager seulement (utilisé pour la notif interne, pas
-- exposé aux clients).
create policy site_referents_select on site_referents for select
  using (internal.auth_role() in ('admin','manager'));

create policy site_referents_admin_write on site_referents for insert
  with check (internal.auth_role() = 'admin');
create policy site_referents_admin_delete on site_referents for delete
  using (internal.auth_role() = 'admin');

-- Reprend les référents déjà définis via l'ancienne colonne manager_id
insert into site_referents (site_id, profile_id)
  select id, manager_id from sites where manager_id is not null
  on conflict do nothing;

-- La colonne (et sa contrainte de clé étrangère sites_manager_id_fkey)
-- disparaissent au profit de la table de liaison ci-dessus.
alter table sites drop column manager_id;
