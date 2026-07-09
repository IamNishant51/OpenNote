import { useEffect, useMemo } from "react";
import { Table2, Columns3, Calendar, Image, GitBranch, List, BarChart3, Plus, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDBStore } from "@/stores/database";
import { useDatabase } from "@/hooks/useDatabase";
import { TableView } from "./views/TableView";
import { BoardView } from "./views/BoardView";
import { CalendarView } from "./views/CalendarView";
import { GalleryView } from "./views/GalleryView";
import { TimelineView } from "./views/TimelineView";
import { ListView } from "./views/ListView";
import { ChartView } from "./views/ChartView";
import { FiltersBar } from "./FiltersBar";
import type { ViewType, DBItem, FilterGroup, SortRule } from "@/types/database";

const viewIcons: Record<ViewType, React.ReactNode> = {
  table: <Table2 className="h-4 w-4" />,
  board: <Columns3 className="h-4 w-4" />,
  calendar: <Calendar className="h-4 w-4" />,
  gallery: <Image className="h-4 w-4" />,
  timeline: <GitBranch className="h-4 w-4" />,
  list: <List className="h-4 w-4" />,
  chart: <BarChart3 className="h-4 w-4" />,
};

function applyFilters(items: DBItem[], itemProperties: Record<string, any[]>, properties: any[], filters: FilterGroup[]): DBItem[] {
  if (filters.length === 0) return items;
  return items.filter((item) => {
    return filters.every((group) => {
      if (group.conditions.length === 0) return true;
      const results = group.conditions.map((cond) => {
        const prop = properties.find((p) => p.id === cond.property_id);
        if (!prop) return true;
        const props = itemProperties[item.id] || [];
        const cell = props.find((p: any) => p.property_id === cond.property_id);
        const val = (cell?.value || "").toLowerCase();
        const filterVal = cond.value.toLowerCase();
        switch (cond.operator) {
          case "equals": return val === filterVal;
          case "not-equals": return val !== filterVal;
          case "contains": return val.includes(filterVal);
          case "not-contains": return !val.includes(filterVal);
          case "greater-than": return Number(val) > Number(filterVal);
          case "less-than": return Number(val) < Number(filterVal);
          case "is-empty": return !val;
          case "is-not-empty": return !!val;
          default: return true;
        }
      });
      return group.operator === "and" ? results.every(Boolean) : results.some(Boolean);
    });
  });
}

function applySorts(items: DBItem[], itemProperties: Record<string, any[]>, properties: any[], sorts: SortRule[]): DBItem[] {
  if (sorts.length === 0) return items;
  return [...items].sort((a, b) => {
    for (const sort of sorts) {
      const prop = properties.find((p) => p.id === sort.property_id);
      if (!prop) continue;
      const aProps = itemProperties[a.id] || [];
      const bProps = itemProperties[b.id] || [];
      const aVal = aProps.find((p: any) => p.property_id === sort.property_id)?.value || "";
      const bVal = bProps.find((p: any) => p.property_id === sort.property_id)?.value || "";
      const cmp = aVal.localeCompare(bVal);
      if (cmp !== 0) return sort.direction === "asc" ? cmp : -cmp;
    }
    return a.sort_order - b.sort_order;
  });
}

export function DatabaseView({ pageId }: { pageId: string }) {
  const { views, activeViewId, setActiveViewId, properties, items, itemProperties, filters, sorts } = useDBStore();
  const { loadDatabase, addProperty } = useDatabase();

  useEffect(() => {
    loadDatabase(pageId);
  }, [pageId, loadDatabase]);

  const filteredItems = useMemo(
    () => applySorts(applyFilters(items, itemProperties, properties, filters), itemProperties, properties, sorts),
    [items, itemProperties, properties, filters, sorts],
  );

  const activeView = views.find((v) => v.id === activeViewId);

  const renderView = () => {
    if (!activeView) return null;
    const viewProps = { filteredItems, properties, itemProperties };
    switch (activeView.view_type) {
      case "table": return <TableView {...viewProps} />;
      case "board": return <BoardView {...viewProps} />;
      case "calendar": return <CalendarView {...viewProps} />;
      case "gallery": return <GalleryView filteredItems={filteredItems} />;
      case "timeline": return <TimelineView {...viewProps} />;
      case "list": return <ListView items={filteredItems} />;
      case "chart": return <ChartView />;
      default: return <TableView {...viewProps} />;
    }
  };

  const visibleProps = properties.filter((p) => views.find(v => v.id === activeViewId));

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-hairline bg-canvas">
        <div className="flex items-center gap-1">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveViewId(view.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                activeViewId === view.id
                  ? "bg-sidebar-active text-ink"
                  : "text-ink-muted hover:bg-sidebar-hover",
              )}
            >
              {viewIcons[view.view_type]}
              {view.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => addProperty("New Property", "text")}
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-ink-muted hover:bg-sidebar-hover transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Property
          </button>
          <button className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-ink-muted hover:bg-sidebar-hover transition-colors">
            <Settings2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <FiltersBar />
      <div className="flex-1 overflow-hidden">
        {renderView()}
      </div>
    </div>
  );
}