# VGS Autos — App de réservation nettoyage

Remplace le Google Sheet + les "bons de commande" Excel par site (ex: `BON DE COMMANDE INVEST CARS REITER`)
par une app web : espace admin (sites, contacts, options, prix, planification, facturation) + espace client
individuel par contact (soumission des plaques, visu du planning).

## Stack

- **Next.js 14** (App Router, TypeScript, Server Actions) — front + back dans le même projet
- **Supabase** (Postgres + Auth + RLS) — base de données et comptes utilisateurs
- **Resend** — emails transactionnels (relance hebdo + notif nouvelle plaque)
- **Vercel** — hébergement + Cron (relance du vendredi matin)

## Ce que fait l'app

- **Admin** (toi) : crée les sites, rattache les contacts mail par site (compte individuel par contact,
  invitation par email), configure les options disponibles et leur prix **par site**, planifie
  jour + heure pour chaque plaque déposée, consulte la facturation par site et par mois.
- **Manager** (interne VGS) : rattaché à un ou plusieurs sites comme référent, reçoit les notifications
  de nouvelles plaques à planifier, peut planifier/valider comme l'admin.
- **Client** (contact site) : se connecte avec son compte perso, dépose des plaques (immatriculation,
  marque/modèle, point d'attention, options), voit en direct le jour/l'heure de passage une fois planifié.
- **Cron du vendredi matin** : relance par email tous les contacts de chaque site actif pour qu'ils
  remplissent leur besoin de la semaine.
- **Notification temps réel** : dès qu'une plaque est déposée par un client, un email part immédiatement
  au manager référent du site + à toi (`NOTIFY_ADMIN_EMAIL`), pour planifier jour/heure.
- **Facturation** : par site, par mois (historique glissant sur 12 mois), total général + sous-total par
  option, avec la liste des plaques concernées et un bouton pour la copier (presse-papier).

## Mise en route

### 1. Supabase

1. Crée un projet sur [supabase.com](https://supabase.com).
2. Va dans **SQL Editor** et exécute le contenu de `supabase/migrations/0001_init.sql`
   (ou utilise la Supabase CLI : `supabase db push`).
3. Dans **Project Settings > API**, récupère `Project URL`, `anon public key` et `service_role key`.
4. Dans **Authentication > Providers**, laisse uniquement "Email" activé, désactive les inscriptions
   publiques ("Allow new users to sign up" → off) : les comptes sont créés uniquement par invitation
   depuis l'espace admin.
5. **Créer le tout premier compte admin** (obligatoire, ensuite tout se fait depuis l'app) :
   - Authentication > Users > "Add user" → renseigne ton email et un mot de passe, coche "Auto confirm".
   - Copie l'UUID généré, puis dans SQL Editor :
     ```sql
     insert into profiles (id, role, full_name, email)
     values ('<uuid-copié>', 'admin', 'Robin Vergnes', 'robin@vgs-autos.fr');
     ```

### 2. Resend

1. Crée une clé API sur [resend.com/api-keys](https://resend.com/api-keys).
2. Vérifie ton domaine d'envoi (`vgs-autos.fr`) dans Resend pour pouvoir envoyer depuis
   `reservation@vgs-autos.fr` (sinon utilise l'adresse de test `onboarding@resend.dev` le temps de valider
   le domaine).

### 3. Variables d'environnement

Copie `.env.example` en `.env.local` en local, et renseigne les mêmes variables dans
**Vercel > Project Settings > Environment Variables** :

| Variable | Où la trouver |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Settings > API Keys |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase > Settings > API Keys ("Publishable key") |
| `SUPABASE_SECRET_KEY` | Supabase > Settings > API Keys ("Secret keys" ⚠️ secret, jamais côté client) |
| `RESEND_API_KEY` | Resend > API Keys |
| `RESEND_FROM_EMAIL` | ex: `VGS Autos <reservation@vgs-autos.fr>` |
| `NOTIFY_ADMIN_EMAIL` | `robin@vgs-autos.fr` |
| `CRON_SECRET` | génère une chaîne aléatoire longue (ex: `openssl rand -hex 32`) |
| `NEXT_PUBLIC_APP_URL` | l'URL Vercel de prod, ex `https://vgs-autos-booking.vercel.app` |

### 4. Git + Vercel

```bash
cd vgs-booking-app
git init
git add .
git commit -m "Init app réservation VGS Autos"
git remote add origin <url-de-ton-repo>
git push -u origin main
```

Puis sur [vercel.com](https://vercel.com) : "Add New Project" → importe le repo → renseigne les variables
d'environnement (étape 3) → Deploy.

Le cron (`vercel.json`) est détecté automatiquement au déploiement : relance chaque **vendredi 6h UTC**
(≈ 7h ou 8h heure de Paris selon la saison — ajuste `"schedule"` dans `vercel.json` si tu veux un autre
horaire, format cron standard).

### 5. Premiers pas dans l'app

1. Connecte-toi avec le compte admin créé à l'étape 1.
2. **Admin > Sites** : crée un site (ex: "REITER").
3. Dans la fiche du site : ajoute les contacts (email + nom → ils reçoivent un email pour définir leur
   mot de passe), active les options nécessaires et fixe leur prix pour ce site.
4. **Admin > Équipe interne** : ajoute les managers VGS (pour recevoir les notifs et planifier).
5. Dans la fiche du site, assigne un manager référent.
6. Les contacts du site peuvent maintenant se connecter et déposer des plaques.

## Détails utiles

- **Catalogue d'options de départ** : le fichier de migration pré-remplit le catalogue observé sur le
  bon de commande papier (Déperlant carrosserie, Cuirs complet, Retrait sticker, Véhicule très sale,
  Dégoudronnage, Teinture moquette, Nettoyage jante). Tu peux en ajouter d'autres directement en base
  (table `options`), elles apparaîtront ensuite disponibles à activer sur chaque site.
- **Prix par site uniquement** (pas par type de véhicule) : chaque option a un prix propre à chaque site,
  indépendant du véhicule concerné — conforme à ce qui a été validé.
- **Comptes individuels** : chaque contact email a son propre login (pas de compte partagé par site).
- **Historique de facturation** : le sélecteur de mois remonte 12 mois en arrière ; le calcul se base sur
  les prestations **planifiées ou terminées** dans le mois choisi (les demandes encore "en attente" ou
  "annulées" ne sont pas comptées).

## Non inclus dans cette v1 (peut être ajouté ensuite)

- La fiche de satisfaction hebdomadaire par site (présente dans l'ancien classeur Excel) — logique
  différente (notation 1-5), volontairement laissée hors périmètre de cette demande.
- Un délai de soumission strict type "mardi 18h" avec bascule automatique à la semaine suivante (le
  système actuel laisse la planification jour/heure entièrement libre, comme demandé).
- Rappels/emails au client une fois son véhicule planifié (actuellement il voit l'info dans son espace,
  mais ne reçoit pas d'email de confirmation — facile à ajouter dans
  `src/app/(admin)/admin/bookings/actions.ts`).
