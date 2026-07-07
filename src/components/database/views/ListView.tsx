import { Plus, GripVertical, Trash2 } from "lucide-react";
import { useDBStore } from "@/stores/database";
import { useDatabase } from "@/hooks/useDatabase";

export function ListView() {
  const { items } = useDBStore();
  const { addItem, deleteItem } = useDatabase();

  return (
    <div className="h-full overflow-y-auto p-4">
      {items.map((item) => (
        <div key={item.id} className="group flex items-center gap-3 border-b border-hairline px-3 py-2 hover:bg-sidebar-hover transition-colors">
          <GripVertical className="h-4 w-4 text-ink-faint opacity-0 group-hover:opacity-100 flex-shrink-0" />
          <span className="text-sm text-ink flex-1">{item.title || "Untitled"}</span>
          <span className="text-xs text-ink-faint">{item.created_at}</span>
          <button onClick={() => deleteItem(item.id)} className="opacity-0 group-hover:opacity-100 text-ink-faint hover:text-red-500">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button onClick={() => addItem()} className="flex items-center gap-1.5 px-3 py-2 text-sm text-ink-muted hover:text-ink-secondary transition-colors">
        <Plus className="h-4 w-4" /> New
      </button>
    </div>
  );
}
