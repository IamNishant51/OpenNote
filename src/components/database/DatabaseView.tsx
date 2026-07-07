import { useEffect } from "react";
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
import type { ViewType } from "@/types/database";

const viewIcons: Record<ViewType, React.ReactNode> = {
  table: <Table2 className="h-4 w-4" />,
  board: <Columns3 className="h-4 w-4" />,
  calendar: <Calendar className="h-4 w-4" />,
  gallery: <Image className="h-4 w-4" />,
  timeline: <GitBranch className="h-4 w-4" />,
  list: <List className="h-4 w-4" />,
  chart: <BarChart3 className="h-4 w-4" />,
};

export function DatabaseView({ pageId }: { pageId: string }) {
  const { views, activeViewId, setActiveViewId, properties, loading } = useDBStore();
  const { loadDatabase, addProperty } = useDatabase();

  useEffect(() => {
    loadDatabase(pageId);
  }, [pageId]);

  const activeView = views.find((v) => v.id === activeViewId);

  const renderView = () => {
    if (!activeView) return null;
    switch (activeView.view_type) {
      case "table": return <TableView />;
      case "board": return <BoardView />;
      case "calendar": return <CalendarView />;
      case "gallery": return <GalleryView />;
      case "timeline": return <TimelineView />;
      case "list": return <ListView />;
      case "chart": return <ChartView />;
      default: return <TableView />;
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center text-ink-muted">Loading database...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-hairline">
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
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-ink-muted hover:bg-sidebar-hover"
          >
            <Plus className="h-3.5 w-3.5" /> Property
          </button>
          <button className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-ink-muted hover:bg-sidebar-hover">
            <Settings2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {renderView()}
      </div>
    </div>
  );
}
