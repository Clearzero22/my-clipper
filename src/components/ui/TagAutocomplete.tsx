import { useState, useMemo, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";
import { Input } from "./basic";

interface Props {
  value: string;
  onChange: (v: string) => void;
  allTags: string[];
  placeholder?: string;
}

export function TagAutocomplete({ value, onChange, allTags, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Current token being typed (after last comma/space)
  const token = useMemo(() => {
    const m = value.match(/[^,\s]+$/);
    return m ? m[0].toLowerCase() : "";
  }, [value]);

  const suggestions = useMemo(() => {
    if (!token) return [];
    const seen = new Set(value.split(/[,\s]+/).filter(Boolean).map((t) => t.toLowerCase()));
    return allTags.filter((t) => t.toLowerCase().startsWith(token) && !seen.has(t.toLowerCase())).slice(0, 6);
  }, [token, allTags, value]);

  useEffect(() => {
    setActiveIdx(0);
    setOpen(suggestions.length > 0);
  }, [suggestions]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const apply = (tag: string) => {
    // Replace current token with selected tag
    const next = value.replace(/[^,\s]*$/, tag + ", ");
    onChange(next);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length && setOpen(true)}
        onKeyDown={(e) => {
          if (!open || suggestions.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            apply(suggestions[activeIdx]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        aria-autocomplete="list"
        aria-expanded={open}
      />
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-40 overflow-auto rounded-md border border-line bg-paper py-1 shadow-panel"
        >
          {suggestions.map((t, i) => (
            <li
              key={t}
              role="option"
              aria-selected={i === activeIdx}
              className={cn(
                "cursor-pointer px-3 py-1.5 text-sm",
                i === activeIdx ? "bg-paper2 text-ink" : "text-inksoft hover:bg-paper2 hover:text-ink"
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                apply(t);
              }}
            >
              {t}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
