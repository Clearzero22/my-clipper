import * as React from "react";
import { cn } from "../../lib/utils";

export function Badge({
  className,
  tone = "ink",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "ink" | "brick" | "forest" }) {
  const tones = {
    ink: "bg-paper2 text-ink",
    brick: "bg-brickSoft text-brick",
    forest: "bg-[rgba(47,93,58,0.14)] text-forest",
  };
  return (
    <span
      className={cn(
        "inline-flex cursor-pointer select-none items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide transition-colors",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

export function Glyph({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-md bg-paper2 font-serif",
        className
      )}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-contain p-1" />
      ) : (
        <span className="text-base text-ink/80">{alt.slice(0, 1).toUpperCase()}</span>
      )}
    </div>
  );
}

export function Dialog({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,26,23,0.35)] backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-line bg-paper p-6 shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
