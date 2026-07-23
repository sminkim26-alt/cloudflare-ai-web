"use client";

import {
  Frame,
  Image,
  Layers,
  Palette,
  PenTool,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";

const suggestions = [
  { text: "Create a logo", icon: Sparkles },
  { text: "Design a poster", icon: Layers },
  { text: "A landscape photo", icon: Image },
  { text: "Pixel art character", icon: Frame },
  { text: "Watercolor painting", icon: Palette },
  { text: "3D render", icon: Wand2 },
  { text: "Abstract wallpaper", icon: Zap },
  { text: "Product mockup", icon: PenTool },
];

export default function SuggestionChips({
  onSelect,
}: {
  onSelect: (text: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl mx-auto">
      {suggestions.map((s) => (
        <button
          key={s.text}
          type="button"
          onClick={() => onSelect(s.text)}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border bg-card hover:bg-accent hover:border-primary/50 transition-all text-sm text-left cursor-pointer group"
        >
          <s.icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          <span className="truncate">{s.text}</span>
        </button>
      ))}
    </div>
  );
}
