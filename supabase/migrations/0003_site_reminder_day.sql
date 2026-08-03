-- =========================================================================
-- Jour de rappel hebdomadaire personnalisable par site. Jusqu'ici la
-- relance automatique ("merci de renseigner vos plaques pour la semaine
-- prochaine") partait pour tous les sites le vendredi, sans possibilité de
-- l'ajuster site par site. On ajoute une colonne reminder_day (1=lundi ...
-- 7=dimanche, ISO) pour permettre à chaque site d'avoir son propre jour
-- d'envoi, tout en gardant vendredi (5) comme valeur par défaut (= le
-- comportement actuel).
-- =========================================================================

alter table sites
  add column reminder_day smallint not null default 5
  check (reminder_day between 1 and 7);

comment on column sites.reminder_day is 'Jour ISO (1=lundi..7=dimanche) où la relance hebdomadaire de rappel des plaques est envoyée à ce site.';
