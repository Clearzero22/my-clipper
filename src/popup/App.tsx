import { useMemo, useState } from "react";
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
  const filtered = useMemo(() => searchClips(clips, query), [clips, query]);

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

  return (
    <div className="w-[340px] bg-paper text-ink">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="font-serif text-lg font-semibold">藏书</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={saveCurrent}
            className="rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-paper transition-all active:scale-95 hover:bg-inkHover"
          >
            {saved ? "已收藏 ✓" : "+ 收藏此页"}
          </button>
        </div>
      </header>

      <div className="px-4 pt-3">
        <Input placeholder="搜索…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <ul className="max-h-[360px] space-y-1 overflow-auto px-3 py-2">
        {filtered.map((c) => (
          <li key={c.id} className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-paper2">
            <Glyph src={c.favicon} alt={c.title} className="h-8 w-8 shrink-0" />
            <button
              className="min-w-0 flex-1 text-left"
              onClick={() => openClip(c)}
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
              className="shrink-0 text-xs text-inksoft opacity-0 transition-opacity hover:text-brick focus:opacity-100 group-hover:opacity-100"
              onClick={() => clipStore.delete(c.id)}
            >
              删
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="py-10 text-center font-serif text-sm text-inksoft">空空如也</li>
        )}
      </ul>
    </div>
  );
}
