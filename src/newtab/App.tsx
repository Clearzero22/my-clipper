import { useMemo, useState } from "react";
import { Button, Input } from "../components/ui/basic";
import { Badge, Dialog } from "../components/ui/widgets";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { ClipGrid } from "./ClipGrid";
import { useClips } from "../shared/hooks";
import { searchClips } from "../shared/fuse";
import { clipStore } from "../shared/storage";
import { faviconFor, normalizeUrl, isUrlLike } from "../shared/types";
import "../index.css";

export default function NewTabApp() {
  const { clips } = useClips();
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = useMemo(() => searchClips(clips, query), [clips, query]);
  const tagSet = useMemo(() => [...new Set(clips.flatMap((c) => c.tags))], [clips]);
  const shown = activeTag ? filtered.filter((c) => c.tags.includes(activeTag)) : filtered;

  const open = (u: string) => chrome.tabs.update({ url: u });

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
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-6xl px-6 pb-16 pt-7">
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
            />
            <ThemeToggle />
            <Button onClick={() => setAddOpen(true)}>+ 添加</Button>
          </div>
        </header>

        {tagSet.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge
              tone={activeTag === null ? "brick" : "ink"}
              onClick={() => setActiveTag(null)}
            >
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

        <main className="mt-7">
          <ClipGrid clips={shown} onOpen={open} onDelete={(id) => clipStore.delete(id)} />
        </main>
      </div>

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
            <Input placeholder="逗号分隔" value={tags} onChange={(e) => setTags(e.target.value)} />
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
