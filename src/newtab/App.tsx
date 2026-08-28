import { useMemo, useState } from "react";
import { cn } from "../lib/utils";
import { Button, Input } from "../components/ui/basic";
import { Badge, Dialog } from "../components/ui/widgets";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { TagAutocomplete } from "../components/ui/TagAutocomplete";
import { ClipGrid } from "./ClipGrid";
import { useClips, useSortPreference } from "../shared/hooks";
import { useDebounce } from "../shared/useDebounce";
import { searchClips } from "../shared/fuse";
import { clipStore } from "../shared/storage";
import { faviconFor, normalizeUrl, isUrlLike, type Clip } from "../shared/types";
import { buildExportPayload, exportFileName, downloadJson, copyToClipboard } from "../shared/importExport";
import "../index.css";

export default function NewTabApp() {
  const { clips } = useClips();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 150);
  const [addOpen, setAddOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sort, setSort] = useSortPreference("recent");
  const [exportCopied, setExportCopied] = useState(false);

  const filtered = useMemo(() => searchClips(clips, debouncedQuery), [clips, debouncedQuery]);
  const tagSet = useMemo(() => [...new Set(clips.flatMap((c) => c.tags))], [clips]);
  const shown = useMemo(() => {
    const base = activeTag ? filtered.filter((c) => c.tags.includes(activeTag)) : filtered;
    const arr = [...base];
    arr.sort((a, b) => {
      if (sort === "frequent") return (b.visitCount ?? 0) - (a.visitCount ?? 0);
      if (sort === "recent") return (b.lastVisited ?? 0) - (a.lastVisited ?? 0);
      return b.createdAt - a.createdAt;
    });
    return arr;
  }, [filtered, activeTag, sort]);

  const openClip = (clip: Clip) => {
    clipStore.touch(clip.id);
    chrome.tabs.update({ url: clip.url });
  };

  const open = (u: string) => chrome.tabs.update({ url: u });

  const openOptions = () => {
    if (typeof chrome !== "undefined" && chrome.runtime?.openOptionsPage) chrome.runtime.openOptionsPage();
    else window.open(chrome.runtime.getURL("dist/options.html"), "_blank");
  };

  const handleExportFile = async () => {
    const data = await clipStore.list();
    downloadJson(exportFileName(), buildExportPayload(data));
  };

  const handleCopyExport = async () => {
    const data = await clipStore.list();
    await copyToClipboard(JSON.stringify(buildExportPayload(data), null, 2));
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 1500);
  };

  const submitAdd = async () => {
    if (!url.trim()) return;
    await clipStore.save({
      url: normalizeUrl(url),
      title: title.trim() || url,
      favicon: faviconFor(url),
      tags: tags.split(/[,\s]+/).filter(Boolean),
    });
    setUrl("");
    setTitle("");
    setTags("");
    setAddOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-10 pt-7">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">
              藏书 <span className="text-inksoft">·</span>{" "}
              <span className="text-lg font-normal italic text-inksoft">Clippings</span>
            </h1>
            <p className="mt-1 text-sm text-inksoft">
              共 {clips.length} 枚书签
              {activeTag && <span className="text-brick"> · {activeTag}</span>}
            </p>
            <div className="mt-3 flex gap-1" role="group" aria-label="排序方式">
              {(
                [
                  ["recent", "最近"],
                  ["frequent", "常用"],
                  ["new", "最新"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setSort(k)}
                  aria-pressed={sort === k}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick",
                    sort === k ? "bg-ink text-paper" : "text-inksoft hover:bg-paper2"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex w-full max-w-md items-center gap-2 sm:w-auto">
            <Input
              placeholder="搜索标题、网址、标签…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  isUrlLike(query) &&
                  !clips.some((c) => c.url === normalizeUrl(query))
                )
                  open(normalizeUrl(query));
              }}
              aria-label="搜索收藏"
            />
            <ThemeToggle />
            <Button onClick={() => setAddOpen(true)}>+ 添加</Button>
          </div>
        </header>

        {tagSet.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="标签筛选">
            <Badge tone={activeTag === null ? "brick" : "ink"} onClick={() => setActiveTag(null)}>
              全部
            </Badge>
            {tagSet.map((t) => (
              <Badge
                key={t}
                tone={activeTag === t ? "forest" : "ink"}
                onClick={() => setActiveTag(activeTag === t ? null : t)}
              >
                {t}
              </Badge>
            ))}
          </div>
        )}

        <main className="mt-7 flex-1 flex flex-col justify-center">
          <ClipGrid clips={shown} onOpen={openClip} onDelete={(id) => clipStore.delete(id)} />
        </main>
      </div>

      <footer className="border-t border-line py-5 text-center text-xs text-inksoft">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <span>
            藏书 · 收藏存于本地浏览器 · 按{" "}
            <span className="font-serif text-ink">Ctrl + Shift + S</span> 收藏当前页 · 右键瓷砖可删除
          </span>
          <span className="hidden sm:inline text-line">|</span>
          <span className="flex items-center gap-2">
            <button
              onClick={openOptions}
              className="underline decoration-line underline-offset-4 hover:text-ink hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick rounded px-1"
            >
              设置
            </button>
            <span className="text-line">·</span>
            <button
              onClick={handleExportFile}
              className="underline decoration-line underline-offset-4 hover:text-ink hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick rounded px-1"
            >
              导出 .json
            </button>
            <span className="text-line">·</span>
            <button
              onClick={handleCopyExport}
              className="underline decoration-line underline-offset-4 hover:text-ink hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick rounded px-1"
            >
              {exportCopied ? "已复制 ✓" : "复制 JSON"}
            </button>
          </span>
        </div>
      </footer>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)}>
        <h2 className="mb-4 font-serif text-xl text-ink">添一卷藏书</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-inksoft">网址</label>
            <Input placeholder="example.com" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-inksoft">标题</label>
            <Input placeholder="留空则取网址" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-inksoft">标签</label>
            <TagAutocomplete value={tags} onChange={setTags} allTags={tagSet} placeholder="逗号分隔，支持自动补全" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              取消
            </Button>
            <Button onClick={submitAdd}>收下</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
