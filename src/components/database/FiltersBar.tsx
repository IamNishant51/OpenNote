import { Plus, X, ArrowUpDown } from "lucide-react";
import { useDBStore } from "@/stores/database";
import { cn } from "@/lib/utils";
import type { FilterGroup, FilterCondition, SortRule } from "@/types/database";

export function FiltersBar() {
  const { properties, filters, sorts, setFilters, setSorts } = useDBStore();

  const addFilter = () => {
    const newGroup: FilterGroup = { id: Date.now().toString(), operator: "and", conditions: [] };
    setFilters([...filters, newGroup]);
  };

  const addCondition = (groupId: string) => {
    const firstProp = properties[0];
    const cond: FilterCondition = { id: Date.now().toString(), property_id: firstProp?.id || "", operator: "contains", value: "" };
    setFilters(filters.map((g) => g.id === groupId ? { ...g, conditions: [...g.conditions, cond] } : g));
  };

  const removeCondition = (groupId: string, condId: string) => {
    setFilters(filters.map((g) => g.id === groupId ? { ...g, conditions: g.conditions.filter((c) => c.id !== condId) } : g).filter((g) => g.conditions.length > 0));
  };

  const addSort = () => {
    const firstProp = properties[0];
    const rule: SortRule = { id: Date.now().toString(), property_id: firstProp?.id || "", direction: "asc" };
    setSorts([...sorts, rule]);
  };

  const removeSort = (id: string) => setSorts(sorts.filter((s) => s.id !== id));

  if (filters.length === 0 && sorts.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-hairline">
        <button onClick={addFilter} className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink-secondary">
          <Plus className="h-3 w-3" /> Filter
        </button>
        <button onClick={addSort} className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink-secondary">
          <ArrowUpDown className="h-3 w-3" /> Sort
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 border-b border-hairline space-y-1.5">
      {filters.map((group) => (
        <div key={group.id} className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-ink-muted font-medium uppercase">Where</span>
          {group.conditions.map((cond) => {
            const prop = properties.find((p) => p.id === cond.property_id);
            return (
              <div key={cond.id} className="flex items-center gap-1 rounded-md bg-sidebar-bg border border-hairline px-2 py-1 text-xs">
                <span className="text-ink-secondary font-medium">{prop?.name || "Property"}</span>
                <span className="text-ink-muted">{cond.operator}</span>
                <span className="text-ink-secondary">{cond.value || "..."}</span>
                <button onClick={() => removeCondition(group.id, cond.id)} className="text-ink-faint hover:text-ink-muted"><X className="h-3 w-3" /></button>
              </div>
            );
          })}
          <button onClick={() => addCondition(group.id)} className="text-xs text-ink-muted hover:text-ink-secondary"><Plus className="h-3 w-3" /></button>
        </div>
      ))}
      {sorts.map((sort) => {
        const prop = properties.find((p) => p.id === sort.property_id);
        return (
          <div key={sort.id} className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-ink-muted font-medium uppercase">Sort by</span>
            <div className="flex items-center gap-1 rounded-md bg-sidebar-bg border border-hairline px-2 py-1 text-xs">
              <span className="text-ink-secondary font-medium">{prop?.name || "Property"}</span>
              <span className="text-ink-muted">{sort.direction === "asc" ? "↑" : "↓"}</span>
              <button onClick={() => removeSort(sort.id)} className="text-ink-faint hover:text-ink-muted"><X className="h-3 w-3" /></button>
            </div>
          </div>
        );
      })}
      <button onClick={addFilter} className="text-xs text-ink-muted hover:text-ink-secondary"><Plus className="h-3 w-3 inline" /> Filter</button>
      <button onClick={addSort} className="text-xs text-ink-muted hover:text-ink-secondary ml-2"><ArrowUpDown className="h-3 w-3 inline" /> Sort</button>
    </div>
  );
}
