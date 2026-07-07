export interface Workspace {
  id: string;
  name: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  title: string;
  icon: string;
  cover: string;
  cover_position: number;
  font: "default" | "serif" | "mono";
  width: "default" | "full";
  is_favorite: boolean;
  is_trash: boolean;
  is_database: boolean;
  created_at: string;
  updated_at: string;
}
