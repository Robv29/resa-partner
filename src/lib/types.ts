export type UserRole = "admin" | "manager" | "client";
export type BookingStatus = "pending" | "scheduled" | "done" | "cancelled";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  site_id: string | null;
}

export interface Site {
  id: string;
  name: string;
  address: string | null;
  active: boolean;
  notes: string | null;
  reminder_day: number;
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
