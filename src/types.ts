export type Workspace = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
};

export type Poll = {
  id: string;
  workspace_id: string;
  poll_date: string;
  title: string;
  created_at: string;
};

export type PollOption = {
  id: string;
  poll_id: string;
  name: string;
  votes: number;
  voters: string[];
};

export type WorkspaceMember = {
  id: string;
  workspace_id: string;
  device_id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
};

export const ONBOARDING_SLIDES = [
  {
    title: 'Create or Join Instantly',
    body: 'Open the app to create a workspace, or open an invite link to join your team.',
  },
  {
    title: 'Vote in One Tap',
    body: "Today's lunch options appear automatically. Tap once to vote.",
  },
  {
    title: 'Keep It Collaborative',
    body: 'Anyone can add a new place idea, so the whole office can decide together.',
  },
];
