import type { HistoryDaySummary, LeaderboardPlace, Poll, PollOption, PlaceSuggestion, Workspace, WorkspaceMember, WorkspaceRole } from '@/lib/types';

export type PlaceDetailsResponse = {
  provider: string;
  externalPlaceId: string;
  name: string;
  formattedAddress?: string | null;
  rating?: number | null;
  priceLevel?: number | null;
  googleMapsUrl?: string | null;
  websiteUrl?: string | null;
  detectedMenuUrl?: string | null;
};

export type SearchAreaResponse = {
  item?: { label: string; lat: number; lng: number } | null;
};

export type WorkspaceRolesResult = {
  workspaceHasOwner: boolean;
  workspaceRole: WorkspaceRole['role'] | null;
};

export type PollDataResult = {
  myOptionId: string | null;
  options: PollOption[];
};

export type HistoryResult = {
  history7Days: HistoryDaySummary[];
  history30Days: HistoryDaySummary[];
  leaderboard: LeaderboardPlace[];
};

export type FeedbackPayload = {
  deviceId: string;
  displayName?: string | null;
  email?: string;
  message: string;
  page?: string | null;
  source?: string;
  workspace?: Workspace | null;
  activeSearchAreaLabel?: string | null;
};

export type SearchArea = {
  label: string;
  lat: number;
  lng: number;
};

export type UpsertMemberResult = WorkspaceMember | null;
export type WorkspaceResult = Workspace | null;
export type PollResult = Poll | null;
export type WorkspaceRoles = WorkspaceRole[];
export type SuggestionsResult = PlaceSuggestion[];
