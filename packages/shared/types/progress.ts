export interface Progress {
  id: string;
  user_id: string;
  user: unknown;
  concept_slug: string;
  status: string;
  completed_at: string | null;
  synced_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}
