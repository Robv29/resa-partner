-- =========================================================================
-- Durcissement RLS (audit sécurité) : bookings_client_insert et
-- booking_options_insert ne vérifiaient pas que le statut restait "pending"
-- côté client. Un client authentifié aurait pu, en théorie (hors Server
-- Action officiel), insérer directement une réservation avec
-- status="scheduled"/"done", ou ajouter une option sur une réservation déjà
-- planifiée/terminée. On aligne ces policies sur bookings_update, qui
-- restreint déjà les clients au statut "pending".
--
-- Note : les helpers auth_role()/auth_site_id() ont été déplacés dans le
-- schéma "internal" par une migration appliquée directement en base
-- (non versionnée dans ce dépôt à l'époque) — d'où le préfixe internal.
-- =========================================================================

drop policy if exists bookings_client_insert on bookings;
create policy bookings_client_insert on bookings for insert
  with check (
    internal.auth_role() in ('admin','manager')
    or (internal.auth_role() = 'client' and site_id = internal.auth_site_id() and status = 'pending')
  );

drop policy if exists booking_options_insert on booking_options;
create policy booking_options_insert on booking_options for insert
  with check (exists (
    select 1 from bookings b where b.id = booking_options.booking_id
    and (
      internal.auth_role() in ('admin','manager')
      or (b.site_id = internal.auth_site_id() and b.status = 'pending')
    )
  ));
