import { useState } from "react";
import type { Clip } from "../shared/types";
import { Dialog } from "../components/ui/widgets";
import { Button as UIButton } from "../components/ui/basic";

export function ClipGrid({
  clips,
  onOpen,
  onDelete,
}: {
  clips: Clip[];
  onOpen: (clip: Clip) => void;
  onDelete: (id: string) => void;
}) {
  const [pending, setPending] = useState<Clip | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const handleDeleteConfirm = () => {
    if (pending) {
      onDelete(pending.id);
      setPending(null);
    }
  };

  if (clips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center">
        <div className="font-serif text-5xl text-inksoft">❧</div>
        <p className="mt-4 font-serif text-lg text-ink">书房还空着</p>
        <p className="mt-1 text-sm text-inksoft">
          按 <span className="font-serif text-ink">Ctrl + Shift + S</span> 收藏当前网页
        </p>
      </div>
    );
  }
  return (
    <>
      <div
        className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-x-5 gap-y-7 px-1 py-2"
        role="grid"
        aria-label="收藏网格"
      >
        {clips.map((c, i) => (
          <button
            key={c.id}
            role="gridcell"
            aria-label={`${c.title}, ${new URL(c.url.startsWith("http") ? c.url : `https://${c.url}`).hostname}`}
            className="group flex animate-rise flex-col gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick"
            style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}
            onClick={() => onOpen(c)}
            onContextMenu={(e) => {
              e.preventDefault();
              setPending(c);
            }}
            onFocus={() => setFocusedId(c.id)}
            onBlur={() => setFocusedId((prev) => (prev === c.id ? null : prev))}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen(c);
              } else if (e.key === "Delete" || e.key === "Backspace") {
                e.preventDefault();
                setPending(c);
              }
            }}
            title={c.selectionText ? c.selectionText.slice(0, 160) : c.url}
          >
            <div className="relative overflow-hidden rounded-md border border-line bg-paper2 shadow-tile transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lift">
              <div className="flex h-20 items-center justify-center bg-gradient-to-br from-tileFrom to-tileTo">
                {c.favicon ? (
                  <img src={c.favicon} alt="" className="h-9 w-9 rounded" />
                ) : (
                  <span className="font-serif text-3xl text-ink/70">
                    {c.title.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="absolute inset-x-0 bottom-0 h-0.5 scale-x-0 bg-brick transition-transform duration-200 group-hover:scale-x-100" />
            </div>
            <span className="line-clamp-2 font-serif text-[13px] leading-snug text-ink">{c.title}</span>
            <span className="truncate text-[11px] text-inksoft">
              {new URL(c.url.startsWith("http") ? c.url : `https://${c.url}`).hostname.replace(/^www\./, "")}
            </span>
            {focusedId === c.id && (
              <span className="text-[10px] text-inksoft">回车打开 · Delete 删除</span>
            )}
          </button>
        ))}
      </div>

      <Dialog open={!!pending} onClose={() => setPending(null)}>
        <h2 className="font-serif text-lg font-semibold text-ink">确认删除？</h2>
        <p className="mt-2 line-clamp-2 text-sm text-inksoft">
          将删除 “{pending?.title}” ，此操作不可撤销。
        </p>
        <p className="mt-1 text-xs text-inksoft">提示：也可在弹窗列表中使用 Delete 键删除。</p>
        <div className="mt-6 flex justify-end gap-2">
          <UIButton variant="ghost" onClick={() => setPending(null)}>
            取消
          </UIButton>
          <UIButton onClick={handleDeleteConfirm} className="!bg-brick !text-white hover:!bg-[#8a2e22]">
            删除
          </UIButton>
        </div>
      </Dialog>
    </>
  );
}
