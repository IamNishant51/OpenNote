import { useMemo } from "react";
import { Plus } from "lucide-react";
import { useDBStore } from "@/stores/database";
import { useDatabase } from "@/hooks/useDatabase";
import { cn } from "@/lib/utils";

const groupColors: Record<string, string> = {
  gray: "bg-gray-100", red: "bg-red-50", orange: "bg-orange-50",
  yellow: "bg-yellow-50", green: "bg-green-50", teal: "bg-teal-50",
  blue: "bg-blue-50", purple: "bg-purple-50", pink: "bg-pink-50",
};

export function BoardView() {
  const { properties, items, itemProperties } = useDBStore();
  const { addItem } = useDatabase();

  const statusProp = properties.find((p) => p.prop_type === "select" || p.prop_type === "status");
  let options: { name: string; color: string }[] = [];
  try { if (statusProp) options = JSON.parse(statusProp.options || "[]"); } catch {}

  const groups = useMemo(() => {
    const map: Record<string, typeof items> = {};
    for (const opt of options) map[opt.name] = [];
    map["No Status"] = [];

    for (const item of items) {
      const props = itemProperties[item.id] || [];
      const cell = props.find((p) => p.property_id === statusProp?.id);
      const val = cell?.value || "";
      if (map[val]) map[val].push(item);
      else map["No Status"].push(item);
    }
    if (map["No Status"]?.length === 0) delete map["No Status"];
    return map;
  }, [items, itemProperties, statusProp, options]);

  return (
    <div className="flex h-full gap-3 overflow-x-auto p-4">
      {Object.entries(groups).map(([group, groupItems]) => (
        <div key={group} className="flex-shrink-0 w-64 flex flex-col rounded-lg bg-sidebar-bg border border-hairline">
          <div className="flex items-center justify-between px-3 py-2 border-b border-hairline">
            <div className="flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full", groupColors[options.find((o) => o.name === group)?.color || "gray"])} />
              <span className="text-sm font-medium text-ink">{group}</span>
              <span className="text-xs text-ink-faint">{groupItems.length}</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {groupItems.map((item) => (
              <div key={item.id} className="rounded-lg border border-hairline bg-canvas p-3 text-sm text-ink-secondary shadow-soft cursor-pointer hover:border-ink-faint transition-colors">
                <p className="font-medium text-ink mb-1">{item.title || "Untitled"}</p>
                <p className="text-xs text-ink-faint">{item.created_at}</p>
              </div>
            ))}
            <button onClick={() => addItem()} className="flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-sm text-ink-muted hover:bg-sidebar-hover transition-colors">
              <Plus className="h-4 w-4" /> New
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
