export interface Comment {
  id: string;
  page_id: string;
  parent_id: string | null;
  block_id: string;
  author: string;
  content: string;
  resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface PageVersion {
  id: string;
  page_id: string;
  title: string;
  snapshot: string;
  created_at: string;
}

export interface Share {
  id: string; page_id: string; user_email: string;
  permission_level: string; created_at: string;
}

export interface Notification {
  id: string; workspace_id: string; type: string;
  title: string; message: string; page_id: string | null;
  read: boolean; created_at: string;
}

export interface Collaborator {
  name: string; color: string; isLocal: boolean;
}

export interface Template {
  id: string;
  workspace_id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  content: string;
  created_at: string;
}
