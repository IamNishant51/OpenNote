import { useState, useRef, useEffect } from "react";
import { useToastStore } from "@/stores/toast";

const EMOJI_LIST = [
  "📝", "📄", "📋", "📌", "📎", "✏️", "📖", "📚", "📕", "📗",
  "📘", "📙", "📔", "📒", "📃", "📜", "📰", "🎯", "💡", "⭐",
  "🌟", "✨", "🔥", "💎", "🎨", "🎭", "🎪", "🚀", "🛠️", "⚙️",
  "🔧", "🔨", "💻", "🖥️", "📱", "🌐", "🔗", "📊", "📈", "📉",
  "🗂️", "📁", "📂", "🗄️", "📦", "🏗️", "🧠", "🎓", "🏆", "🥇",
  "❤️", "💙", "💚", "💛", "💜", "🧡", "✅", "❌", "⚠️", "🚨",
  "🔔", "🔕", "💬", "🗣️", "👤", "👥", "🤝", "👏", "💪", "🤖",
  "👁️", "🎬", "🎵", "🎶", "🔑", "🔒", "🔓", "💯", "🎉", "🎊",
  "🗓️", "⏰", "⌛", "📅", "📍", "🧩", "🎮", "🕹️", "🖼️", "🎁",
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const addToast = useToastStore(s => s.addToast);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = search
    ? EMOJI_LIST.filter(e => e.includes(search) || e.codePointAt(0)?.toString(16).includes(search))
    : EMOJI_LIST;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="text-2xl transition-transform hover:scale-110 cursor-pointer select-none"
        title="Click to change icon"
      >
        {value || "📄"}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-72 rounded-xl border border-hairline bg-canvas shadow-elevated p-2">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emoji..."
            className="w-full rounded-lg border border-hairline bg-canvas-soft px-2.5 py-1.5 text-sm text-ink outline-none mb-2 placeholder:text-ink-faint"
          />
          <div className="grid grid-cols-8 gap-0.5 max-h-48 overflow-y-auto">
            {filtered.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onChange(emoji);
                  setOpen(false);
                  setSearch("");
                }}
                className={`flex items-center justify-center w-8 h-8 rounded-md text-lg hover:bg-sidebar-hover transition-colors ${
                  emoji === value ? "bg-primary/10 ring-1 ring-primary" : ""
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
