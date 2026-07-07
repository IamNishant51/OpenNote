import { useMemo, useState } from "react";
import { useDBStore } from "@/stores/database";

export function ChartView() {
  const { items, itemProperties, properties } = useDBStore();
  const [chartType, setChartType] = useState<"bar" | "donut">("bar");

  const numberProps = properties.filter((p) => p.prop_type === "number");
  const selectProps = properties.filter((p) => p.prop_type === "select" || p.prop_type === "status");
  const countBy = useMemo(() => {
    const prop = selectProps[0];
    if (!prop) return [];
    const counts: Record<string, number> = {};
    for (const item of items) {
      const props = itemProperties[item.id] || [];
      const cell = props.find((p) => p.property_id === prop.id);
      const val = cell?.value || "None";
      counts[val] = (counts[val] || 0) + 1;
    }
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [items, itemProperties, selectProps]);

  const maxCount = Math.max(...countBy.map((c) => c.count), 1);
  const colors = ["#0075de", "#62aef0", "#d6b6f6", "#ff64c8", "#dd5b00", "#2a9d99", "#1aae39", "#523410"];

  if (countBy.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-ink-muted">Add a select property to generate a chart</div>;
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setChartType("bar")} className={`rounded-md px-3 py-1 text-xs font-medium ${chartType === "bar" ? "bg-primary text-white" : "bg-sidebar-bg text-ink-muted"}`}>Bar</button>
        <button onClick={() => setChartType("donut")} className={`rounded-md px-3 py-1 text-xs font-medium ${chartType === "donut" ? "bg-primary text-white" : "bg-sidebar-bg text-ink-muted"}`}>Donut</button>
      </div>

      {chartType === "bar" && (
        <div className="space-y-2">
          {countBy.map((c, i) => (
            <div key={c.name} className="flex items-center gap-3">
              <span className="text-xs text-ink-secondary w-24 truncate text-right">{c.name}</span>
              <div className="flex-1 h-6 rounded-md bg-sidebar-bg overflow-hidden">
                <div className="h-full rounded-md transition-all duration-500" style={{ width: `${(c.count / maxCount) * 100}%`, backgroundColor: colors[i % colors.length] }} />
              </div>
              <span className="text-xs text-ink-faint w-8">{c.count}</span>
            </div>
          ))}
        </div>
      )}

      {chartType === "donut" && (
        <div className="flex items-center justify-center h-64">
          <svg viewBox="0 0 100 100" className="w-64 h-64 -rotate-90">
            {countBy.map((c, i) => {
              const total = countBy.reduce((s, x) => s + x.count, 0);
              const pct = c.count / total;
              const circumference = 2 * Math.PI * 38;
              const offset = countBy.slice(0, i).reduce((s, x) => s + (x.count / total) * circumference, 0);
              return (
                <circle key={c.name} cx="50" cy="50" r="38" fill="none" stroke={colors[i % colors.length]} strokeWidth="12"
                  strokeDasharray={`${pct * circumference} ${circumference}`} strokeDashoffset={-offset} className="transition-all duration-500" />
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}
