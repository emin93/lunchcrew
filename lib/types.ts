export type Workspace = {
  id: string;
  name: string;
  invite_code: string;
  search_area_label?: string | null;
  search_area_lat?: number | null;
  search_area_lng?: number | null;
  plan?: 'free' | 'founding' | string;
  billing_status?: 'free' | 'pending' | 'active' | 'canceled' | 'refunded' | string;
  purchase_model?: 'one_time' | 'subscription' | string | null;
  pro_enabled?: boolean;
  upgraded_at?: string | null;
  created_at: string;
};

export type WorkspaceRole = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin';
  created_at: string;
};

export type WorkspacePurchase = {
  id: string;
  workspace_id: string;
  user_id?: string | null;
  provider: string;
  purchase_type: 'founding_crew' | string;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'voided' | string;
  access_scope: 'crew' | string;
  checkout_session_id?: string | null;
  payment_intent_id?: string | null;
  amount_cents?: number | null;
  currency: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  paid_at?: string | null;
};
export type Poll = { id: string; workspace_id: string; poll_date: string; title: string; created_at: string };
export type WorkspaceMember = {
  id: string;
  workspace_id: string;
  device_id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
};
export type PlaceLite = {
  id?: string;
  provider: string;
  external_place_id: string;
  name: string;
  formatted_address?: string | null;
  rating?: number | null;
  price_level?: number | null;
  google_maps_url?: string | null;
  website_url?: string | null;
  detected_menu_url?: string | null;
};
export type PollOption = {
  id: string;
  poll_id: string;
  name: string;
  votes: number;
  voters: string[];
  menu_url?: string | null;
  place?: PlaceLite | null;
};
export type PlaceSuggestion = { id: string; provider: string; externalPlaceId: string; name: string; secondaryText?: string };
export type HistoryDaySummary = { poll_date: string; winner_name: string; winner_votes: number };
export type LeaderboardPlace = { name: string; wins: number };
export const ONBOARDING_SLIDES = [
  { title: 'Create or Join Instantly', body: 'Open the app to create a workspace, or use an invite code to join your crew.' },
  { title: 'Vote in One Tap', body: 'Today’s lunch options load automatically and everyone sees votes update live.' },
  { title: 'Keep It Collaborative', body: 'Anyone can add another place idea, including nearby restaurant suggestions.' },
];
