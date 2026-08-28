import type { Clip } from "../shared/types";

export function ClipGrid({
  clips,
  onOpen,
  onDelete,
}: {
  clips: Clip[];
  onOpen: (clip: Clip) => void;
  onDelete: (id: string) => void;
}) {
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
    <div className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-x-5 gap-y-7 px-1 py-2">
      {clips.map((c, i) => (
        <button
          key={c.id}
          className="group flex animate-rise flex-col gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick"
          style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}
          onClick={() => onOpen(c)}
          onContextMenu={(e) => {
            e.preventDefault();
            onDelete(c.id);
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
          <span className="line-clamp-2 font-serif text-[13px] leading-snug text-ink">
            {c.title}
          </span>
          <span className="truncate text-[11px] text-inksoft">
            {new URL(c.url.startsWith("http") ? c.url : `https://${c.url}`).hostname.replace(
              /^www\./,
              ""
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
