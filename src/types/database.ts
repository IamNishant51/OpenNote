export type PropertyType =
  | "title" | "text" | "number" | "select" | "multi-select" | "status"
  | "date" | "checkbox" | "url" | "email" | "phone" | "formula"
  | "relation" | "rollup" | "button" | "rating" | "progress"
  | "created-time" | "last-edited-time" | "ai-summary";

export type ViewType = "table" | "board" | "calendar" | "gallery" | "timeline" | "list" | "chart";

export interface Database_ {
  id: string;
  page_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface DBProperty {
  id: string;
  database_id: string;
  name: string;
  prop_type: PropertyType;
  options: string;
  sort_order: number;
}

export interface DBItem {
  id: string;
  database_id: string;
  title: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DBItemProperty {
  id: string;
  item_id: string;
  property_id: string;
  value: string;
}

export interface DBView {
  id: string;
  database_id: string;
  name: string;
  view_type: ViewType;
  config: string;
  sort_order: number;
}

export interface SelectOption {
  id: string;
  name: string;
  color: string;
}

export interface FilterGroup {
  id: string;
  operator: "and" | "or";
  conditions: FilterCondition[];
}

export interface FilterCondition {
  id: string;
  property_id: string;
  operator: "equals" | "not-equals" | "contains" | "not-contains" | "greater-than" | "less-than" | "is-empty" | "is-not-empty";
  value: string;
}

export interface SortRule {
  id: string;
  property_id: string;
  direction: "asc" | "desc";
}
