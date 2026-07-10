import { Plus, X, ArrowUpDown, ChevronDown } from "lucide-react";
import { useDBStore } from "@/stores/database";
import type { FilterGroup, FilterCondition, SortRule, PropertyType } from "@/types/database";
import { useState, useRef, useEffect } from "react";

const OPERATORS_BY_TYPE: Record<string, { value: string; label: string }[]> = {
  text: [
    { value: "contains", label: "Contains" },
    { value: "not-contains", label: "Does not contain" },
    { value: "equals", label: "Equals" },
    { value: "not-equals", label: "Does not equal" },
    { value: "is-empty", label: "Is empty" },
    { value: "is-not-empty", label: "Is not empty" },
  ],
  title: [
    { value: "contains", label: "Contains" },
    { value: "not-contains", label: "Does not contain" },
    { value: "equals", label: "Equals" },
    { value: "not-equals", label: "Does not equal" },
    { value: "is-empty", label: "Is empty" },
    { value: "is-not-empty", label: "Is not empty" },
  ],
  number: [
    { value: "equals", label: "Equals" },
    { value: "not-equals", label: "Does not equal" },
    { value: "greater-than", label: "Greater than" },
    { value: "less-than", label: "Less than" },
    { value: "is-empty", label: "Is empty" },
    { value: "is-not-empty", label: "Is not empty" },
  ],
  select: [
    { value: "equals", label: "Is" },
    { value: "not-equals", label: "Is not" },
    { value: "is-empty", label: "Is empty" },
    { value: "is-not-empty", label: "Is not empty" },
  ],
  "multi-select": [
    { value: "contains", label: "Has" },
    { value: "not-contains", label: "Does not have" },
    { value: "is-empty", label: "Is empty" },
    { value: "is-not-empty", label: "Is not empty" },
  ],
  status: [
    { value: "equals", label: "Is" },
    { value: "not-equals", label: "Is not" },
    { value: "is-empty", label: "Is empty" },
    { value: "is-not-empty", label: "Is not empty" },
  ],
  date: [
    { value: "equals", label: "Is" },
    { value: "not-equals", label: "Is not" },
    { value: "is-empty", label: "Is empty" },
    { value: "is-not-empty", label: "Is not empty" },
  ],
  checkbox: [
    { value: "equals", label: "Is" },
    { value: "is-empty", label: "Is empty" },
    { value: "is-not-empty", label: "Is not empty" },
  ],
};

function getOperators(propType: string) {
  return OPERATORS_BY_TYPE[propType] || OPERATORS_BY_TYPE.text;
}

function needsValue(operator: string) {
  return operator !== "is-empty" && operator !== "is-not-empty";
}

export function FiltersBar() {
  const { properties, filters, sorts, setFilters, setSorts } = useDBStore();

  const addFilter = () => {
    const newGroup: FilterGroup = { id: Date.now().toString(), operator: "and", conditions: [] };
    setFilters([...filters, newGroup]);
  };

  const addCondition = (groupId: string) => {
    const firstProp = properties[0];
    const cond: FilterCondition = {
      id: Date.now().toString(),
      property_id: firstProp?.id || "",
      operator: "contains",
      value: "",
    };
    setFilters(
      filters.map((g) =>
        g.id === groupId ? { ...g, conditions: [...g.conditions, cond] } : g,
      ),
    );
  };

  const updateCondition = (
    groupId: string,
    condId: string,
    updates: Partial<FilterCondition>,
  ) => {
    setFilters(
      filters.map((g) =>
        g.id === groupId
          ? {
              ...g,
              conditions: g.conditions.map((c) =>
                c.id === condId ? { ...c, ...updates } : c,
              ),
            }
          : g,
      ),
    );
  };

  const removeCondition = (groupId: string, condId: string) => {
    setFilters(
      filters
        .map((g) =>
          g.id === groupId
            ? { ...g, conditions: g.conditions.filter((c) => c.id !== condId) }
            : g,
        )
        .filter((g) => g.conditions.length > 0),
    );
  };

  const addSort = () => {
    const firstProp = properties[0];
    const rule: SortRule = {
      id: Date.now().toString(),
      property_id: firstProp?.id || "",
      direction: "asc",
    };
    setSorts([...sorts, rule]);
  };

  const updateSort = (id: string, updates: Partial<SortRule>) => {
    setSorts(sorts.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const removeSort = (id: string) =>
    setSorts(sorts.filter((s) => s.id !== id));

  if (filters.length === 0 && sorts.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-hairline">
        <button
          onClick={addFilter}
          className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink-secondary"
        >
          <Plus className="h-3 w-3" /> Filter
        </button>
        <button
          onClick={addSort}
          className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink-secondary"
        >
          <ArrowUpDown className="h-3 w-3" /> Sort
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 border-b border-hairline space-y-1.5">
      {filters.map((group) => (
        <div key={group.id} className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-ink-muted font-medium uppercase">
            Where
          </span>
          {group.conditions.map((cond) => {
            const prop = properties.find((p) => p.id === cond.property_id);
            const operators = getOperators(prop?.prop_type || "text");
            return (
              <div
                key={cond.id}
                className="flex items-center gap-1 rounded-lg bg-canvas-soft border border-hairline px-2 py-1 text-xs"
              >
                <select
                  value={cond.property_id}
                  onChange={(e) =>
                    updateCondition(group.id, cond.id, {
                      property_id: e.target.value,
                      operator: "contains",
                      value: "",
                    })
                  }
                  className="bg-transparent text-ink-secondary font-medium outline-none cursor-pointer max-w-[120px]"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <select
                  value={cond.operator}
                  onChange={(e) =>
                    updateCondition(group.id, cond.id, {
                      operator: e.target.value as FilterCondition["operator"],
                    })
                  }
                  className="bg-transparent text-ink-muted outline-none cursor-pointer max-w-[120px]"
                >
                  {operators.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
                {needsValue(cond.operator) && (
                  <input
                    type="text"
                    value={cond.value}
                    onChange={(e) =>
                      updateCondition(group.id, cond.id, {
                        value: e.target.value,
                      })
                    }
                    placeholder="..."
                    className="bg-transparent text-ink-secondary outline-none w-24 placeholder:text-ink-faint"
                  />
                )}
                <button
                  onClick={() => removeCondition(group.id, cond.id)}
                  className="text-ink-faint hover:text-ink-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
          <button
            onClick={() => addCondition(group.id)}
            className="text-xs text-ink-muted hover:text-ink-secondary"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      ))}
      {sorts.map((sort) => {
        const prop = properties.find((p) => p.id === sort.property_id);
        return (
          <div key={sort.id} className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-ink-muted font-medium uppercase">
              Sort by
            </span>
            <div className="flex items-center gap-1 rounded-lg bg-canvas-soft border border-hairline px-2 py-1 text-xs">
              <select
                value={sort.property_id}
                onChange={(e) =>
                  updateSort(sort.id, { property_id: e.target.value })
                }
                className="bg-transparent text-ink-secondary font-medium outline-none cursor-pointer max-w-[120px]"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() =>
                  updateSort(sort.id, {
                    direction: sort.direction === "asc" ? "desc" : "asc",
                  })
                }
                className="text-ink-muted hover:text-ink-secondary"
              >
                {sort.direction === "asc" ? "↑" : "↓"}
              </button>
              <button
                onClick={() => removeSort(sort.id)}
                className="text-ink-faint hover:text-ink-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        );
      })}
      <button
        onClick={addFilter}
        className="text-xs text-ink-muted hover:text-ink-secondary"
      >
        <Plus className="h-3 w-3 inline" /> Filter
      </button>
      <button
        onClick={addSort}
        className="text-xs text-ink-muted hover:text-ink-secondary ml-2"
      >
        <ArrowUpDown className="h-3 w-3 inline" /> Sort
      </button>
    </div>
  );
}
