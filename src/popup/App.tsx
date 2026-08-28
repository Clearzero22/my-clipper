import { useMemo, useState, useRef, useEffect } from "react";
import { Input } from "../components/ui/basic";
import { Glyph } from "../components/ui/widgets";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { useClips } from "../shared/hooks";
import { searchClips } from "../shared/fuse";
import { clipStore } from "../shared/storage";
import { type Clip } from "../shared/types";
import "../index.css";

export default function PopupApp() {
  const { clips } = useClips();
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const filtered = useMemo(() => searchClips(clips, query), [clips, query]);

  useEffect(() => {
    setFocusedIdx(0);
  }, [query]);

  const saveCurrent = () => {
    setSaved(true);
    chrome.runtime.sendMessage({ type: "SAVE_ACTIVE_TAB" }, () => {
      setTimeout(() => setSaved(false), 1500);
    });
  };

  const openClip = (clip: Clip) => {
    clipStore.touch(clip.id);
    chrome.tabs.update({ url: clip.url });
    window.close();
  };

  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      openClip(filtered[focusedIdx]);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      if (confirm(`删除 “${filtered[focusedIdx].title}” ？`)) {
        clipStore.delete(filtered[focusedIdx].id);
      }
    }
  };

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${focusedIdx}"]`);
    el?.focus();
  }, [focusedIdx]);

  return (
    <div className="w-[340px] bg-paper text-ink">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="font-serif text-lg font-semibold">藏书</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={saveCurrent}
            aria-label="收藏当前页"
            className="rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-paper transition-all active:scale-95 hover:bg-inkHover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick"
          >
            {saved ? "已收藏 ✓" : "+ 收藏此页"}
          </button>
        </div>
      </header>

      <div className="px-4 pt-3">
        <Input
          placeholder="搜索…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && filtered.length > 0) {
              e.preventDefault();
              listRef.current?.querySelector<HTMLElement>("[data-idx]")?.focus();
            }
          }}
          aria-label="搜索收藏"
          autoFocus
        />
      </div>

      <ul
        ref={listRef}
        role="listbox"
        aria-label="收藏列表"
        className="max-h-[360px] space-y-1 overflow-auto px-3 py-2"
        onKeyDown={handleListKeyDown}
      >
        {filtered.map((c, idx) => (
          <li
            key={c.id}
            className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-paper2 focus-within:bg-paper2"
          >
            <Glyph src={c.favicon} alt={c.title} className="h-8 w-8 shrink-0" />
            <button
              data-idx={idx}
              role="option"
              aria-selected={idx === focusedIdx}
              tabIndex={idx === focusedIdx ? 0 : -1}
              className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick rounded"
              onClick={() => openClip(c)}
              onFocus={() => setFocusedIdx(idx)}
            >
              <div className="truncate font-serif text-sm text-ink">{c.title}</div>
              <div className="truncate text-[11px] text-inksoft">
                {(c.url.startsWith("http") ? c.url : `https://${c.url}`)
                  .replace(/^https?:\/\//, "")
                  .replace(/^www\./, "")
                  .split("/")[0]}
              </div>
            </button>
            <button
              aria-label={`删除 ${c.title}`}
              className="shrink-0 text-xs text-inksoft opacity-0 transition-opacity hover:text-brick focus:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brick rounded px-1"
              onClick={() => {
                if (confirm(`删除 “${c.title}” ？`)) clipStore.delete(c.id);
              }}
            >
              删
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="py-10 text-center font-serif text-sm text-inksoft">空空如也</li>
        )}
      </ul>
      {filtered.length > 0 && (
        <p className="border-t border-line px-4 py-2 text-center text-[10px] text-inksoft">
          ↑↓ 选择 · 回车打开 · Delete 删除
        </p>
      )}
    </div>
  );
}
