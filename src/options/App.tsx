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
      setImportMsg(`\u590D\u5236\u5931\u8D25\uFF1A${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const doImportFromText = async (text: string) => {
    setImportMsg(null);
    try {
      const parsed = parseImportText(text);
      const valid = parsed.clips;
      const invalid = parsed.invalid;
      const rawCount = parsed.rawCount;
      if (rawCount === 0) {
        setImportMsg("\u5BFC\u5165\u5931\u8D25\uFF1A\u6587\u4EF6\u4E3A\u7A7A\u6216\u683C\u5F0F\u4E0D\u6B63\u786E\u3002");
        return;
      }
      if (valid.length === 0) {
        setImportMsg("\u5BFC\u5165\u5931\u8D25\uFF1A\u6CA1\u6709\u5408\u6CD5\u7684\u85CF\u4E66\u6761\u76EE\u3002");
        return;
      }
      if (importMode === "overwrite") {
        const ok = confirm(`\u8986\u76D6\u6A21\u5F0F\u5C06\u7528\u6587\u4EF6\u4E2D\u7684 ${valid.length} \u6761\u66FF\u6362\u5168\u90E8\u73B0\u6709\u6570\u636E\uFF08\u5F53\u524D ${clips.length} \u6761\uFF09\uFF0C\u786E\u5B9A\u7EE7\u7EED\uFF1F`);
        if (!ok) return;
      }
      const result = await clipStore.importClips(valid, importMode);
      const skip = invalid > 0 ? `\uFF0C\u8DF3\u8FC7 ${invalid} \u6761\u975E\u6CD5\u6570\u636E` : "";
      setImportMsg(
        importMode === "overwrite"
          ? `\u5DF2\u8986\u76D6\u5BFC\u5165 ${valid.length} \u6761${skip}\u3002`
          : `\u5DF2\u5BFC\u5165\uFF1A\u65B0\u589E ${result.added} \u6761\uFF0C\u66F4\u65B0 ${result.updated} \u6761${skip}\u3002`
      );
    } catch (e) {
      setImportMsg(`\u5BFC\u5165\u5931\u8D25\uFF1A${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    await doImportFromText(text);
  };

  const handlePasteImport = async () => {
    if (!pasteText.trim()) {
      setImportMsg("\u8BF7\u5148\u7C98\u8D34 JSON \u5185\u5BB9\u3002");
      return;
    }
    await doImportFromText(pasteText);
    setPasteOpen(false);
    setPasteText("");
  };

  const clearAll = async () => {
    if (confirm("\u786E\u5B9A\u6E05\u7A7A\u5168\u90E8\u85CF\u4E66\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002")) await clipStore.clear();
  };

  const toggleSync = async () => {
    const next = !syncOn;
    try {
      await setSyncEnabled(next);
      setSyncOn(next);
      setSyncMsg(next ? "\u5DF2\u5F00\u542F\u540C\u6B65\uFF0C\u672C\u5730\u6570\u636E\u5DF2\u5907\u4EFD\u5230\u4E91\u7AEF\u3002" : "\u5DF2\u5173\u95ED\u540C\u6B65\u3002");
    } catch (e) {
      setSyncMsg(`\u540C\u6B65\u5931\u8D25\uFF1A${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleSyncNow = async () => {
    setSyncMsg(null);
    try {
      const merged = await syncNow();
      setSyncMsg(`\u540C\u6B65\u5B8C\u6210\uFF0C\u5171 ${merged.merged} \u6761\uFF08\u6309\u6700\u65B0\u65F6\u95F4\u5408\u5E76\u53BB\u91CD\uFF09\u3002`);
    } catch (e) {
      setSyncMsg(`\u540C\u6B65\u5931\u8D25\uFF1A${e instanceof Error ? e.message : String(e)}`);
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
            <p className="font-serif text-lg text-brick">\u677E\u5F00\u4EE5\u5BFC\u5165</p>
            <p className="text-xs text-inksoft">\u652F\u6301 .json \u6587\u4EF6</p>
          </div>
        </div>
      )}

      <h1 className="font-serif text-3xl font-semibold">\u85CF\u4E66 \u00B7 \u8BBE\u7F6E</h1>
      <p className="mt-1 text-sm text-inksoft">\u672C\u5730\u6536\u85CF\uFF0C\u5171 {clips.length} \u679A\u3002\u53EF\u5BFC\u51FA\u5907\u4EFD\u6216\u5BFC\u5165\u6062\u590D\u3002</p>

      <div className="mt-8 space-y-3">
        <div className="rounded-md border border-line bg-paper2 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-serif">\u5BFC\u51FA\u5907\u4EFD</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCopyJson} className="text-xs">
                {copied ? "\u5DF2\u590D\u5236 \u2713" : "\u590D\u5236 JSON"}
              </Button>
              <Button onClick={handleExportFile}>\u4E0B\u8F7D .json</Button>
            </div>
          </div>
          <p className="mt-2 text-xs text-inksoft">\u6587\u4EF6\u540D\u5E26\u65F6\u95F4\u6233\uFF0C\u5185\u5BB9\u542B\u7248\u672C\u53F7\u4E0E\u5BFC\u51FA\u65F6\u95F4\uFF0C\u53EF\u76F4\u63A5\u7528\u4E8E\u6062\u590D\u3002</p>
        </div>

        <div className="rounded-md border border-line bg-paper2 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-serif">\u5BFC\u5165\u6062\u590D</span>
            <div className="flex items-center gap-2">
              <select
                value={importMode}
                onChange={(e) => setImportMode(e.target.value as ImportMode)}
                className="h-8 rounded-md border border-line bg-paper px-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brick"
                aria-label="import mode"
              >
                <option value="merge">\u5408\u5E76</option>
                <option value="overwrite">\u8986\u76D6</option>
              </select>
              <label className="cursor-pointer rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-paper transition-all active:scale-95 hover:bg-[#2c2823]">
                \u9009\u62E9\u6587\u4EF6
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
            {importMode === "merge" ? "\u5408\u5E76\uFF1A\u6309 ID \u53BB\u91CD\uFF0C\u5DF2\u6709\u5219\u8986\u76D6\uFF0C\u4E0D\u5B58\u5728\u5219\u65B0\u589E\u3002" : "\u8986\u76D6\uFF1A\u7528\u6587\u4EF6\u5185\u5BB9\u66FF\u6362\u5168\u90E8\u73B0\u6709\u6570\u636E\u3002"}
            \u652F\u6301\u62D6\u62FD\u6587\u4EF6\u5230\u672C\u9875\u5BFC\u5165\u3002
          </p>
          <div className="mt-3">
            <Button variant="ghost" onClick={() => setPasteOpen((v) => !v)} className="text-xs">
              {pasteOpen ? "\u6536\u8D77\u7C98\u8D34\u5BFC\u5165" : "\u7C98\u8D34 JSON \u5BFC\u5165"}
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
                    \u53D6\u6D88
                  </Button>
                  <Button onClick={handlePasteImport}>\u5BFC\u5165</Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {importMsg && <p className="rounded-md border border-line bg-paper2 px-4 py-2 text-sm text-inksoft">{importMsg}</p>}

        <div className="rounded-md border border-line bg-paper2 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="font-serif">\u4E91\u540C\u6B65\uFF08chrome.storage.sync\uFF09</span>
            <button
              onClick={toggleSync}
              aria-pressed={syncOn}
              className={`relative h-6 w-11 rounded-full transition-colors ${syncOn ? "bg-brick" : "bg-line"}`}
              aria-label="toggle sync"
            >
              <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-transform ${syncOn ? "translate-x-5" : ""}`} />
            </button>
          </div>
          <p className="mt-2 text-xs text-inksoft">
            \u5F00\u542F\u540E\u5C06\u672C\u5730\u6536\u85CF\u5907\u4EFD\u5230\u6D4F\u89C8\u5668\u8D26\u53F7\u4E91\u7AEF\uFF0C\u6362\u8BBE\u5907\u81EA\u52A8\u5408\u5E76\u3002
          </p>
          {syncOn && (
            <div className="mt-3 flex gap-2">
              <Button variant="outline" onClick={handleSyncNow}>
                \u7ACB\u5373\u540C\u6B65
              </Button>
            </div>
          )}
          {syncMsg && <p className="mt-2 text-xs text-inksoft">{syncMsg}</p>}
        </div>

        <div className="flex items-center justify-between rounded-md border border-line bg-paper2 px-4 py-3">
          <span className="font-serif text-brick">\u6E05\u7A7A\u5168\u90E8</span>
          <Button variant="outline" onClick={clearAll} className="!border-brick !text-brick hover:!bg-brickSoft">
            \u6E05\u7A7A
          </Button>
        </div>
      </div>
    </div>
  );
}
