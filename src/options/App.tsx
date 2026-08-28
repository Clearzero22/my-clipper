import { useState, useEffect, useRef } from "react";
import { Button } from "../components/ui/basic";
import { useClips } from "../shared/hooks";
import { clipStore } from "../shared/storage";
import { isSyncEnabled, setSyncEnabled, syncNow } from "../shared/sync";
import { buildExportPayload, exportFileName, parseImportText, downloadJson, copyToClipboard } from "../shared/importExport";
import "../index.css";

type ImportMode = "merge" | "overwrite";

export default function OptionsApp() {
  const { clips } = useClips();
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("merge");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [syncOn, setSyncOn] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    isSyncEnabled().then(setSyncOn);
  }, []);

  const handleExportFile = async () => {
    const data = await clipStore.list();
    const payload = buildExportPayload(data);
    downloadJson(exportFileName(), payload);
  };

  const handleCopyJson = async () => {
    const data = await clipStore.list();
    const payload = buildExportPayload(data);
    try {
      await copyToClipboard(JSON.stringify(payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      setImportMsg(`复制失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const doImportFromText = async (text: string) => {
    setImportMsg(null);
    try {
      const parsed = parseImportText(text);
      if (parsed.rawCount === 0) {
        setImportMsg("导入失败：文件为空或格式不正确。");
        return;
      }
      if (parsed.clips.length === 0) {
        setImportMsg("导入失败：没有合法的藏书条目。");
        return;
      }
      if (importMode === "overwrite") {
        const ok = confirm(`覆盖模式将用文件中的 ${parsed.clips.length} 条替换全部现有数据（当前 ${clips.length} 条），确定继续？`);
        if (!ok) return;
      }
      const result = await clipStore.importClips(parsed.clips, importMode);
      const skip = parsed.invalid > 0 ? `，跳过 ${parsed.invalid} 条非法数据` : "";
      setImportMsg(
        importMode === "overwrite"
          ? `已覆盖导入 ${parsed.clips.length} 条${skip}。`
          : `已导入：新增 ${result.added} 条，更新 ${result.updated} 条${skip}。`
      );
    } catch (e) {
      setImportMsg(`导入失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    await doImportFromText(text);
  };

  const handlePasteImport = async () => {
    if (!pasteText.trim()) {
      setImportMsg("请先粘贴 JSON 内容。");
      return;
    }
    await doImportFromText(pasteText);
    setPasteOpen(false);
    setPasteText("");
  };

  const clearAll = async () => {
    if (confirm("确定清空全部藏书？此操作不可撤销。")) await clipStore.clear();
  };

  const toggleSync = async () => {
    const next = !syncOn;
    try {
      await setSyncEnabled(next);
      setSyncOn(next);
      setSyncMsg(next ? "已开启同步，本地数据已备份到云端。" : "已关闭同步。");
    } catch (e) {
      setSyncMsg(`同步失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleSyncNow = async () => {
    setSyncMsg(null);
    try {
      const merged = await syncNow();
      setSyncMsg(`同步完成，共 ${merged.merged} 条（按最新时间合并去重）。`);
    } catch (e) {
      setSyncMsg(`同步失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div
      className="mx-auto max-w-md bg-paper px-6 py-10 text-ink"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) await handleFile(file);
      }}
    >
      {dragOver && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-[rgba(28,26,23,0.08)] backdrop-blur-[1px]">
          <div className="rounded-lg border-2 border-dashed border-brick bg-paper px-8 py-6 text-center shadow-panel">
            <p className="font-serif text-lg text-brick">松开以导入</p>
            <p className="text-xs text-inksoft">支持 .json 文件</p>
          </div>
        </div>
      )}

      <h1 className="font-serif text-3xl font-semibold">藏书 · 设置</h1>
      <p className="mt-1 text-sm text-inksoft">本地收藏，共 {clips.length} 枚。可导出备份或导入恢复。</p>

      <div className="mt-8 space-y-3">
        <div className="rounded-md border border-line bg-paper2 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-serif">导出备份</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCopyJson} className="text-xs">
                {copied ? "已复制 ✓" : "复制 JSON"}
              </Button>
              <Button onClick={handleExportFile}>下载 .json</Button>
            </div>
          </div>
          <p className="mt-2 text-xs text-inksoft">文件名带时间戳，内容含版本号与导出时间，可直接用于恢复。</p>
        </div>

        <div className="rounded-md border border-line bg-paper2 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-serif">导入恢复</span>
            <div className="flex items-center gap-2">
              <select
                value={importMode}
                onChange={(e) => setImportMode(e.target.value as ImportMode)}
                className="h-8 rounded-md border border-line bg-paper px-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brick"
                aria-label="import mode"
              >
                <option value="merge">合并</option>
                <option value="overwrite">覆盖</option>
              </select>
              <label className="cursor-pointer rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-paper transition-all active:scale-95 hover:bg-[#2c2823]">
                选择文件
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </label>
            </div>
          </div>
          <p className="mt-2 text-xs text-inksoft">
            {importMode === "merge" ? "合并：按 ID 去重，已有则覆盖，不存在则新增。" : "覆盖：用文件内容替换全部现有数据。"}
            支持拖拽文件到本页导入。
          </p>
          <div className="mt-3">
            <Button variant="ghost" onClick={() => setPasteOpen((v) => !v)} className="text-xs">
              {pasteOpen ? "收起粘贴导入" : "粘贴 JSON 导入"}
            </Button>
            {pasteOpen && (
              <div className="mt-2 space-y-2">
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="paste JSON"
                  rows={6}
                  className="w-full rounded-md border border-line bg-paper px-3 py-2 font-mono text-xs text-ink placeholder:text-inksoft focus:outline-none focus:ring-2 focus:ring-brick"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setPasteOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handlePasteImport}>导入</Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {importMsg && <p className="rounded-md border border-line bg-paper2 px-4 py-2 text-sm text-inksoft">{importMsg}</p>}

        <div className="rounded-md border border-line bg-paper2 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="font-serif">云同步（chrome.storage.sync）</span>
            <button
              onClick={toggleSync}
              aria-pressed={syncOn}
              className={`relative h-6 w-11 rounded-full transition-colors ${syncOn ? "bg-brick" : "bg-line"}`}
              aria-label="toggle sync"
            >
              <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-transform ${syncOn ? "translate-x-5" : ""}`} />
            </button>
          </div>
          <p className="mt-2 text-xs text-inksoft">开启后将本地收藏备份到浏览器账号云端，换设备自动合并。</p>
          {syncOn && (
            <div className="mt-3 flex gap-2">
              <Button variant="outline" onClick={handleSyncNow}>
                立即同步
              </Button>
            </div>
          )}
          {syncMsg && <p className="mt-2 text-xs text-inksoft">{syncMsg}</p>}
        </div>

        <div className="flex items-center justify-between rounded-md border border-line bg-paper2 px-4 py-3">
          <span className="font-serif text-brick">清空全部</span>
          <Button variant="outline" onClick={clearAll} className="!border-brick !text-brick hover:!bg-brickSoft">
            清空
          </Button>
        </div>
      </div>
    </div>
  );
}
