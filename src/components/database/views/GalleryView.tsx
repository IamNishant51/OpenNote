import { Plus } from "lucide-react";
import { useDatabase } from "@/hooks/useDatabase";
import { PageIcon } from "@/components/shared/PageIcon";
import type { DBItem } from "@/types/database";

interface GalleryViewProps {
  filteredItems: DBItem[];
}

export function GalleryView({ filteredItems }: GalleryViewProps) {
  const { addItem } = useDatabase();

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="grid grid-cols-3 gap-3">
        {filteredItems.map((item) => (
          <div key={item.id} className="rounded-lg border border-hairline bg-canvas overflow-hidden hover:shadow-soft transition-shadow">
            <div className="h-32 bg-gradient-to-br from-primary/10 to-accent-teal/10 flex items-center justify-center">
              <PageIcon icon={null} size="lg" />
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-ink truncate">{item.title || "Untitled"}</p>
              <p className="text-xs text-ink-faint mt-0.5">{item.created_at}</p>
            </div>
          </div>
        ))}
        <button onClick={() => addItem()} className="rounded-lg border-2 border-dashed border-hairline flex items-center justify-center h-48 text-ink-muted hover:text-ink-secondary hover:border-ink-faint transition-colors">
          <Plus className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}