import { FileText } from "lucide-react";
import { cn, isPlainIconLabel } from "@/lib/utils";

interface PageIconProps {
  icon?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses: Record<NonNullable<PageIconProps["size"]>, string> = {
  sm: "h-5 min-w-5 px-1 text-[10px]",
  md: "h-7 min-w-7 px-2 text-[11px]",
  lg: "h-10 min-w-10 px-3 text-xs",
};

const iconSizes: Record<NonNullable<PageIconProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function PageIcon({ icon, size = "md", className }: PageIconProps) {
  if (isPlainIconLabel(icon)) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-md border border-hairline bg-canvas-soft font-medium uppercase tracking-wide text-ink-secondary",
          sizeClasses[size],
          className,
        )}
      >
        {icon!.trim().slice(0, 2)}
      </span>
    );
  }

  return <FileText className={cn("text-ink-muted", iconSizes[size], className)} />;
}