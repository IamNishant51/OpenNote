import { useEffect, useMemo, useRef, useState } from "react";
import { Table2, Columns3, Calendar, Image, GitBranch, List, BarChart3, Plus, Settings2, Type, Hash, CheckSquare, CalendarDays, Link, Mail, Phone, Star, GripVertical } from "lucide-react";
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
import type { ViewType, DBItem, FilterGroup, SortRule, PropertyType } from "@/types/database";

const viewIcons: Record<ViewType, React.ReactNode> = {
  table: <Table2 className="h-4 w-4" />,
  board: <Columns3 className="h-4 w-4" />,
  calendar: <Calendar className="h-4 w-4" />,
  gallery: <Image className="h-4 w-4" />,
  timeline: <GitBranch className="h-4 w-4" />,
  list: <List className="h-4 w-4" />,
  chart: <BarChart3 className="h-4 w-4" />,
};

const PROPERTY_TYPES: { type: PropertyType; label: string; icon: React.ReactNode }[] = [
  { type: "text", label: "Text", icon: <Type className="h-3.5 w-3.5" /> },
  { type: "number", label: "Number", icon: <Hash className="h-3.5 w-3.5" /> },
  { type: "select", label: "Select", icon: <GripVertical className="h-3.5 w-3.5" /> },
  { type: "multi-select", label: "Multi-select", icon: <CheckSquare className="h-3.5 w-3.5" /> },
  { type: "date", label: "Date", icon: <CalendarDays className="h-3.5 w-3.5" /> },
  { type: "checkbox", label: "Checkbox", icon: <CheckSquare className="h-3.5 w-3.5" /> },
  { type: "url", label: "URL", icon: <Link className="h-3.5 w-3.5" /> },
  { type: "email", label: "Email", icon: <Mail className="h-3.5 w-3.5" /> },
  { type: "phone", label: "Phone", icon: <Phone className="h-3.5 w-3.5" /> },
  { type: "status", label: "Status", icon: <Star className="h-3.5 w-3.5" /> },
  { type: "rating", label: "Rating", icon: <Star className="h-3.5 w-3.5" /> },
];

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
  const [showTypePicker, setShowTypePicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDatabase(pageId);
  }, [pageId, loadDatabase]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowTypePicker(false);
      }
    };
    if (showTypePicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showTypePicker]);

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

  const handleAddProperty = (type: PropertyType) => {
    addProperty("New Property", type);
    setShowTypePicker(false);
  };

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
        <div className="flex items-center gap-1 relative">
          <div ref={pickerRef} className="relative">
            <button
              onClick={() => setShowTypePicker(!showTypePicker)}
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-ink-muted hover:bg-sidebar-hover transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Property
            </button>
            {showTypePicker && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-canvas border border-hairline rounded-lg shadow-lg z-50 p-1.5">
                <div className="grid grid-cols-2 gap-1">
                  {PROPERTY_TYPES.map((pt) => (
                    <button
                      key={pt.type}
                      onClick={() => handleAddProperty(pt.type)}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-ink-secondary hover:bg-sidebar-hover transition-colors"
                    >
                      {pt.icon}
                      {pt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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
