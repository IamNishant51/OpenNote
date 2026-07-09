import { Plus, GripVertical, Trash2 } from "lucide-react";
import { useDBStore } from "@/stores/database";
import { useDatabase } from "@/hooks/useDatabase";
import { PropertyCell } from "@/components/database/PropertyCell";
import type { DBItem, DBProperty, DBItemProperty } from "@/types/database";

interface TableViewProps {
  filteredItems: DBItem[];
  properties: DBProperty[];
  itemProperties: Record<string, DBItemProperty[]>;
}

export function TableView({ filteredItems, properties, itemProperties }: TableViewProps) {
  const { addItem, updateItemProperty, deleteItem } = useDatabase();

  return (
    <div className="h-full overflow-auto">
      <div className="inline-block min-w-full">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-hairline">
              <th className="w-8 px-2 py-2" />
              {properties.map((prop) => (
                <th key={prop.id} className="px-3 py-2 text-left text-eyebrow text-ink-muted uppercase tracking-wider border-r border-hairline last:border-r-0 whitespace-nowrap">
                  {prop.name}
                </th>
              ))}
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const props = itemProperties[item.id] || [];
              return (
                <tr key={item.id} className="border-b border-hairline hover:bg-sidebar-hover group">
                  <td className="px-2 py-0 text-ink-faint opacity-0 group-hover:opacity-100">
                    <GripVertical className="h-4 w-4 cursor-grab" />
                  </td>
                  {properties.map((prop) => {
                    const cell = props.find((p) => p.property_id === prop.id);
                    return (
                      <td key={prop.id} className="border-r border-hairline last:border-r-0 p-0">
                        <PropertyCell
                          property={prop}
                          cell={cell}
                          onChange={(value) => updateItemProperty(item.id, prop.id, value)}
                        />
                      </td>
                    );
                  })}
                  <td className="px-2 py-0 opacity-0 group-hover:opacity-100">
                    <button onClick={() => deleteItem(item.id)} className="text-ink-faint hover:text-red-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <button
          onClick={() => addItem()}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-ink-muted hover:text-ink-secondary hover:bg-sidebar-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>
    </div>
  );
}