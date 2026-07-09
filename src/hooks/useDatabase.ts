import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useDBStore } from "@/stores/database";
import { isTauriRuntime } from "@/lib/tauri";
import type { Database_, DBProperty, DBItem, DBItemProperty, DBView } from "@/types/database";

export function useDatabase() {
  const store = useDBStore();

  const loadDatabase = useCallback(async (pageId: string) => {
    store.setLoading(true);
    try {
      if (!isTauriRuntime()) {
        const now = new Date().toISOString();
        const database: Database_ = {
          id: pageId,
          page_id: pageId,
          title: "Untitled database",
          created_at: now,
          updated_at: now,
        };
        const defaultView: DBView = {
          id: `${pageId}-table`,
          database_id: database.id,
          name: "Table",
          view_type: "table",
          config: "{}",
          sort_order: 0,
        };

        store.setDatabase(database);
        store.setProperties([]);
        store.setItems([]);
        store.setItemProperties(pageId, []);
        store.setViews([defaultView]);
        store.setActiveViewId(defaultView.id);
        return;
      }

      const db = await invoke<Database_>("get_database", { pageId });
      store.setDatabase(db);

      const [properties, items, views] = await Promise.all([
        invoke<DBProperty[]>("get_properties", { databaseId: db.id }),
        invoke<DBItem[]>("get_items", { databaseId: db.id }),
        invoke<DBView[]>("get_views", { databaseId: db.id }),
      ]);
      store.setProperties(properties);
      store.setItems(items);
      store.setViews(views);

      const allProps = await invoke<DBItemProperty[]>("get_item_properties_batch", { itemIds: items.map(i => i.id) });
      const propsByItemId: Record<string, DBItemProperty[]> = {};
      for (const prop of allProps) {
        if (!propsByItemId[prop.item_id]) propsByItemId[prop.item_id] = [];
        propsByItemId[prop.item_id].push(prop);
      }
      for (const item of items) {
        store.setItemProperties(item.id, propsByItemId[item.id] || []);
      }

      if (views.length > 0) store.setActiveViewId(views[0].id);
    } catch (e) {
      console.error("Failed to load database:", e);
    } finally {
      store.setLoading(false);
    }
  }, []);

  const addProperty = useCallback(async (name: string, propType: string) => {
    if (!isTauriRuntime()) {
      const db = store.database;
      if (!db) return;

      const now = new Date().toISOString();
      const prop: DBProperty = {
        id: crypto.randomUUID(),
        database_id: db.id,
        name,
        prop_type: propType as DBProperty["prop_type"],
        options: "[]",
        sort_order: store.properties.length,
      };

      store.addProperty(prop);
      return;
    }

    const db = store.database; if (!db) return;
    try {
      const prop = await invoke<DBProperty>("create_property", { databaseId: db.id, name, propType });
      store.addProperty(prop);
    } catch (e) { console.error(e); }
  }, [store.database]);

  const addItem = useCallback(async () => {
    if (!isTauriRuntime()) {
      const db = store.database;
      if (!db) return;

      const now = new Date().toISOString();
      const item: DBItem = {
        id: crypto.randomUUID(),
        database_id: db.id,
        title: "Untitled",
        sort_order: store.items.length,
        created_at: now,
        updated_at: now,
      };

      store.addItem(item);
      store.setItemProperties(item.id, []);
      return item;
    }

    const db = store.database; if (!db) return;
    try {
      const item = await invoke<DBItem>("create_item", { databaseId: db.id, title: "Untitled" });
      store.addItem(item);
      const props = await invoke<DBItemProperty[]>("get_item_properties", { itemId: item.id });
      store.setItemProperties(item.id, props);
      return item;
    } catch (e) { console.error(e); }
  }, [store.database]);

  const updateItemProperty = useCallback(async (itemId: string, propertyId: string, value: string) => {
    if (!isTauriRuntime()) {
      const current = store.itemProperties[itemId] || [];
      const next = current.some((prop) => prop.property_id === propertyId)
        ? current.map((prop) => (prop.property_id === propertyId ? { ...prop, value } : prop))
        : [...current, { id: crypto.randomUUID(), item_id: itemId, property_id: propertyId, value }];
      store.setItemProperties(itemId, next);
      return;
    }

    try {
      await invoke("update_item_property", { itemId, propertyId, value });
      store.updateItemProperty(itemId, propertyId, value);
    } catch (e) { console.error(e); }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    if (!isTauriRuntime()) {
      store.removeItem(id);
      return;
    }

    try {
      await invoke("delete_item", { id });
      store.removeItem(id);
    } catch (e) { console.error(e); }
  }, []);

  return { loadDatabase, addProperty, addItem, updateItemProperty, deleteItem };
}
