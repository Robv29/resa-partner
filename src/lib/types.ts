export type UserRole = "super_admin" | "admin" | "manager" | "client";
export type BookingStatus = "pending" | "scheduled" | "done" | "cancelled";
export type OrganizationStatus = "active" | "suspended" | "trialing";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  site_id: string | null;
  organization_id: string | null;
}

// Un client (concessionnaire/groupe) de la plateforme : possède un ou
// plusieurs sites, chacun facturé 25€/mois (Stripe, phase 2).
export interface Organization {
  id: string;
  name: string;
  status: OrganizationStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
}

// Lien d'inscription à usage unique envoyé par un super_admin à un futur
// admin — la création de l'organisation + du compte se fait en self-service
// sur la page publique /onboarding/[token].
export interface AdminInvite {
  id: string;
  email: string;
  company_name: string | null;
  token: string;
  status: "pending" | "completed" | "expired";
  organization_id: string | null;
  created_by: string | null;
  created_at: string;
  expires_at: string;
  completed_at: string | null;
}

export interface Site {
  id: string;
  name: string;
  address: string | null;
  active: boolean;
  notes: string | null;
  reminder_day: number;
  organization_id: string;
}

// Un ou plusieurs admins/managers rattachés à un site, qui reçoivent les
// notifications de nouvelles plaques (remplace l'ancien manager_id unique).
export interface SiteReferent {
  id: string;
  site_id: string;
  profile_id: string;
}

export interface OptionCatalog {
  id: string;
  name: string;
  description: string | null;
  is_base: boolean;
  sort_order: number;
  archived: boolean;
}

export interface SiteOption {
  id: string;
  site_id: string;
  option_id: string;
  price: number;
  active: boolean;
  option?: OptionCatalog;
}

export interface Booking {
  id: string;
  site_id: string;
  requested_by: string;
  plate: string;
  brand_model: string | null;
  attention_notes: string | null;
  status: BookingStatus;
  scheduled_date: string | null;
  scheduled_time: string | null;
  scheduled_by: string | null;
  iso_week: string;
  created_at: string;
  booking_options?: BookingOption[];
  site?: Site;
}

export interface BookingOption {
  id: string;
  booking_id: string;
  option_id: string;
  option_name: string;
  price: number;
}
