import { create } from "zustand";
import type { Database_, DBProperty, DBItem, DBItemProperty, DBView, PropertyType, ViewType, FilterGroup, SortRule } from "@/types/database";

interface DBStore {
  database: Database_ | null;
  properties: DBProperty[];
  items: DBItem[];
  itemProperties: Record<string, DBItemProperty[]>;
  views: DBView[];
  activeViewId: string | null;
  loading: boolean;
  filters: FilterGroup[];
  sorts: SortRule[];
  groupBy: string | null;

  setDatabase: (db: Database_ | null) => void;
  setProperties: (props: DBProperty[]) => void;
  addProperty: (prop: DBProperty) => void;
  updateProperty: (id: string, updates: Partial<DBProperty>) => void;
  removeProperty: (id: string) => void;
  setItems: (items: DBItem[]) => void;
  addItem: (item: DBItem) => void;
  updateItem: (id: string, updates: Partial<DBItem>) => void;
  removeItem: (id: string) => void;
  setItemProperties: (itemId: string, props: DBItemProperty[]) => void;
  updateItemProperty: (itemId: string, propertyId: string, value: string) => void;
  setViews: (views: DBView[]) => void;
  setActiveViewId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setFilters: (filters: FilterGroup[]) => void;
  setSorts: (sorts: SortRule[]) => void;
  setGroupBy: (propId: string | null) => void;
  reset: () => void;
}

export const useDBStore = create<DBStore>((set) => ({
  database: null,
  properties: [],
  items: [],
  itemProperties: {},
  views: [],
  activeViewId: null,
  loading: false,
  filters: [],
  sorts: [],
  groupBy: null,

  setDatabase: (db) => set({ database: db }),
  setProperties: (props) => set({ properties: props }),
  addProperty: (prop) => set((s) => ({ properties: [...s.properties, prop] })),
  updateProperty: (id, updates) => set((s) => ({ properties: s.properties.map((p) => p.id === id ? { ...p, ...updates } : p) })),
  removeProperty: (id) => set((s) => ({ properties: s.properties.filter((p) => p.id !== id) })),
  setItems: (items) => set({ items }),
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
  updateItem: (id, updates) => set((s) => ({ items: s.items.map((i) => i.id === id ? { ...i, ...updates } : i) })),
  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  setItemProperties: (itemId, props) => set((s) => ({ itemProperties: { ...s.itemProperties, [itemId]: props } })),
  updateItemProperty: (itemId, propertyId, value) => set((s) => ({
    itemProperties: {
      ...s.itemProperties,
      [itemId]: (s.itemProperties[itemId] || []).map((ip) =>
        ip.property_id === propertyId ? { ...ip, value } : ip
      ),
    },
  })),
  setViews: (views) => set({ views }),
  setActiveViewId: (id) => set({ activeViewId: id }),
  setLoading: (loading) => set({ loading }),
  setFilters: (filters) => set({ filters }),
  setSorts: (sorts) => set({ sorts }),
  setGroupBy: (propId) => set({ groupBy: propId }),
  reset: () => set({ database: null, properties: [], items: [], itemProperties: {}, views: [], activeViewId: null, filters: [], sorts: [], groupBy: null }),
}));
