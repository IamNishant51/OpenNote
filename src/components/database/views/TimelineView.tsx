import { useMemo } from "react";
import { Plus } from "lucide-react";
import { useDatabase } from "@/hooks/useDatabase";
import type { DBItem, DBProperty, DBItemProperty } from "@/types/database";

interface TimelineViewProps {
  filteredItems: DBItem[];
  properties: DBProperty[];
  itemProperties: Record<string, DBItemProperty[]>;
}

export function TimelineView({ filteredItems, properties, itemProperties }: TimelineViewProps) {
  const { addItem } = useDatabase();
  const dateProp = properties.find((p) => p.prop_type === "date");

  const sorted = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const aProps = itemProperties[a.id] || [];
      const bProps = itemProperties[b.id] || [];
      const aVal = aProps.find((p) => p.property_id === dateProp?.id)?.value || "";
      const bVal = bProps.find((p) => p.property_id === dateProp?.id)?.value || "";
      return aVal.localeCompare(bVal);
    });
  }, [filteredItems, itemProperties, dateProp]);

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="relative pl-8 border-l-2 border-primary/30">
        {sorted.map((item) => {
          const props = itemProperties[item.id] || [];
          const date = props.find((p) => p.property_id === dateProp?.id)?.value || "";
          return (
            <div key={item.id} className="relative mb-6">
              <div className="absolute -left-[30px] top-1 h-4 w-4 rounded-full border-2 border-primary bg-canvas" />
              <div className="rounded-lg border border-hairline p-3 hover:shadow-soft transition-shadow">
                <p className="text-sm font-medium text-ink">{item.title || "Untitled"}</p>
                {date && <p className="text-xs text-ink-faint mt-0.5">{date}</p>}
              </div>
            </div>
          );
        })}
        <button onClick={() => addItem()} className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink-secondary py-2">
          <Plus className="h-4 w-4" /> New
        </button>
      </div>
    </div>
  );
}