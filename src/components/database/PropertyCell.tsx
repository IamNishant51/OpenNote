import { useState } from "react";
import { cn } from "@/lib/utils";
import type { DBProperty, DBItemProperty } from "@/types/database";

interface PropertyCellProps {
  property: DBProperty;
  cell: DBItemProperty | undefined;
  onChange: (value: string) => void;
}

const selectColors: Record<string, string> = {
  gray: "bg-gray-100 text-gray-700", red: "bg-red-100 text-red-700",
  orange: "bg-orange-100 text-orange-700", yellow: "bg-yellow-100 text-yellow-700",
  green: "bg-green-100 text-green-700", teal: "bg-teal-100 text-teal-700",
  blue: "bg-blue-100 text-blue-700", purple: "bg-purple-100 text-purple-700",
  pink: "bg-pink-100 text-pink-700", brown: "bg-amber-100 text-amber-700",
};

export function PropertyCell({ property, cell, onChange }: PropertyCellProps) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(cell?.value || "");

  const value = cell?.value || "";

  if (property.prop_type === "title") {
    return (
      <div className="px-3 py-2 min-w-[200px] font-medium text-sm text-ink">
        {value || "Untitled"}
      </div>
    );
  }

  if (property.prop_type === "select" || property.prop_type === "status") {
    let options: { name: string; color: string }[] = [];
    try { options = JSON.parse(property.options || "[]"); } catch {}
    const selected = options.find((o) => o.name === value);
    return (
      <div className="px-3 py-2 min-w-[140px]">
        {selected ? (
          <span className={cn("inline-block rounded-md px-2 py-0.5 text-xs font-medium", selectColors[selected.color] || selectColors.gray)}>
            {selected.name}
          </span>
        ) : (
          <span className="text-ink-faint text-sm">—</span>
        )}
      </div>
    );
  }

  if (property.prop_type === "checkbox") {
    return (
      <div className="px-3 py-2 min-w-[60px] flex items-center">
        <input type="checkbox" checked={value === "true"} onChange={(e) => onChange(e.target.checked ? "true" : "false")}
          className="h-4 w-4 rounded border-hairline text-primary focus:ring-primary" />
      </div>
    );
  }

  if (property.prop_type === "date") {
    return (
      <div className="px-3 py-2 min-w-[140px] text-sm text-ink-secondary">
        {value || "—"}
      </div>
    );
  }

  if (property.prop_type === "number") {
    return (
      <div className="px-3 py-2 min-w-[100px] text-sm text-ink-secondary text-right tabular-nums">
        {value || "—"}
      </div>
    );
  }

  if (property.prop_type === "url") {
    return (
      <div className="px-3 py-2 min-w-[180px] text-sm text-primary truncate">
        {value || "—"}
      </div>
    );
  }

  if (property.prop_type === "email") {
    return (
      <div className="px-3 py-2 min-w-[180px] text-sm text-primary">
        {value || "—"}
      </div>
    );
  }

  if (property.prop_type === "phone") {
    return (
      <div className="px-3 py-2 min-w-[130px] text-sm text-ink-secondary">
        {value || "—"}
      </div>
    );
  }

  if (property.prop_type === "rating") {
    const n = parseInt(value) || 0;
    return (
      <div className="px-3 py-2 min-w-[100px] flex items-center gap-0.5">
        {[1,2,3,4,5].map((i) => (
          <button key={i} onClick={() => onChange(String(i))} className="text-sm hover:scale-110 transition-transform">
            {i <= n ? "★" : "☆"}
          </button>
        ))}
      </div>
    );
  }

  if (property.prop_type === "created-time" || property.prop_type === "last-edited-time") {
    return (
      <div className="px-3 py-2 min-w-[140px] text-sm text-ink-faint">
        {value || "—"}
      </div>
    );
  }

  if (editing) {
    return (
      <div className="px-3 py-2 min-w-[140px]">
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={() => { setEditing(false); onChange(val); }}
          onKeyDown={(e) => { if (e.key === "Enter") { setEditing(false); onChange(val); } }}
          className="w-full border border-primary rounded px-1.5 py-0.5 text-sm text-ink outline-none bg-canvas"
        />
      </div>
    );
  }

  return (
    <div className="px-3 py-2 min-w-[140px] cursor-text text-sm text-ink-secondary truncate" onClick={() => { setVal(value); setEditing(true); }}>
      {value || <span className="text-ink-faint">—</span>}
    </div>
  );
}
