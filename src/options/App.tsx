import { useState, useEffect } from "react";
import { Button } from "../components/ui/basic";
import { useClips } from "../shared/hooks";
import { clipStore } from "../shared/storage";
import { isClip } from "../shared/types";
import { isSyncEnabled, setSyncEnabled, syncNow } from "../shared/sync";
import "../index.css";

export default function OptionsApp() {
  const { clips } = useClips();
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [syncOn, setSyncOn] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  useEffect(() => {
    isSyncEnabled().then(setSyncOn);
  }, []);

  const exportJson = async () => {
    const data = await clipStore.list();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "clippings.json";
    a.click();
  };

  const importJson = async (file: File) => {
    setImportMsg(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        setImportMsg("导入失败：文件内容不是数组。");
        return;
      }
      const valid = data.filter(isClip);
      const invalid = data.length - valid.length;
      if (valid.length === 0) {
        setImportMsg("导入失败：没有合法的藏书条目。");
        return;
      }
      await clipStore.importClips(valid);
      setImportMsg(
        invalid > 0 ? `已导入 ${valid.length} 条，跳过 ${invalid} 条非法数据。` : `已导入 ${valid.length} 条。`
      );
    } catch (e) {
      setImportMsg(`导入失败：${e instanceof Error ? e.message : String(e)}`);
    }
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
      const { merged } = await syncNow();
      setSyncMsg(`同步完成，共 ${merged} 条（按最新时间合并去重）。`);
    } catch (e) {
      setSyncMsg(`同步失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div className="mx-auto max-w-md bg-paper px-6 py-10 text-ink">
      <h1 className="font-serif text-3xl font-semibold">藏书 · 设置</h1>
      <p className="mt-1 text-sm text-inksoft">本地收藏，共 {clips.length} 枚。可导出备份或导入恢复。</p>

      <div className="mt-8 space-y-3">
        <div className="flex items-center justify-between rounded-md border border-line bg-paper2 px-4 py-3">
          <span className="font-serif">导出为 JSON</span>
          <Button onClick={exportJson}>导出</Button>
        </div>

        <div className="flex items-center justify-between rounded-md border border-line bg-paper2 px-4 py-3">
          <span className="font-serif">从 JSON 恢复</span>
          <label className="cursor-pointer rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-paper transition-all active:scale-95 hover:bg-[#2c2823]">
            选择文件
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])}
            />
          </label>
        </div>
        {importMsg && (
          <p className="rounded-md border border-line bg-paper2 px-4 py-2 text-sm text-inksoft">{importMsg}</p>
        )}

        <div className="rounded-md border border-line bg-paper2 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="font-serif">云同步（chrome.storage.sync）</span>
            <button
              onClick={toggleSync}
              aria-pressed={syncOn}
              className={`relative h-6 w-11 rounded-full transition-colors ${syncOn ? "bg-brick" : "bg-line"}`}
              aria-label="开关云同步"
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-transform ${syncOn ? "translate-x-5" : ""}`}
              />
            </button>
          </div>
          <p className="mt-2 text-xs text-inksoft">
            开启后将本地收藏备份到浏览器账号云端，换设备自动合并（按最新访问时间去重，标签合并）。
          </p>
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
