import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useDBStore } from "@/stores/database";
import { useDatabase } from "@/hooks/useDatabase";
import { cn } from "@/lib/utils";

export function CalendarView() {
  const { items, itemProperties, properties } = useDBStore();
  const { addItem } = useDatabase();
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const dateProp = properties.find((p) => p.prop_type === "date");
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
  const firstDay = useMemo(() => new Date(year, month, 1).getDay(), [year, month]);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const itemsByDate: Record<string, typeof items> = useMemo(() => {
    const map: Record<string, typeof items> = {};
    for (const item of items) {
      const props = itemProperties[item.id] || [];
      const cell = props.find((p) => p.property_id === dateProp?.id);
      const date = cell?.value || "";
      if (date) {
        if (!map[date]) map[date] = [];
        map[date].push(item);
      }
    }
    return map;
  }, [items, itemProperties, dateProp]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-1 rounded hover:bg-sidebar-hover text-ink-muted"><ChevronLeft className="h-5 w-5" /></button>
          <h2 className="text-lg font-semibold text-ink">
            {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </h2>
          <button onClick={nextMonth} className="p-1 rounded hover:bg-sidebar-hover text-ink-muted"><ChevronRight className="h-5 w-5" /></button>
        </div>
        <button onClick={() => addItem()} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary-active">
          <Plus className="h-4 w-4" /> New
        </button>
      </div>

      <div className="grid grid-cols-7 border border-hairline rounded-lg overflow-hidden flex-1">
        {dayNames.map((d) => (
          <div key={d} className="border-b border-r border-hairline last:border-r-0 px-2 py-1.5 text-xs font-medium text-ink-muted uppercase">
            {d}
          </div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="border-b border-r border-hairline last:border-r-0 bg-sidebar-bg" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayItems = itemsByDate[dateStr] || [];
          const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
          return (
            <div key={day} className={cn("border-b border-r border-hairline last:border-r-0 p-1 min-h-[80px]", isToday && "bg-primary/5")}>
              <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full text-xs", isToday && "bg-primary text-white font-bold")}>
                {day}
              </span>
              <div className="space-y-0.5 mt-1">
                {dayItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary truncate">
                    {item.title || "Untitled"}
                  </div>
                ))}
                {dayItems.length > 3 && (
                  <div className="text-xs text-ink-faint px-1">+{dayItems.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
