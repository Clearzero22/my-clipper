import { Button } from "../components/ui/basic";
import { useClips } from "../shared/hooks";
import { clipStore } from "../shared/storage";
import "../index.css";

export default function OptionsApp() {
  const { clips } = useClips();

  const exportJson = async () => {
    const data = await clipStore.list();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "clippings.json";
    a.click();
  };

  const importJson = async (file: File) => {
    const text = await file.text();
    const data = JSON.parse(text);
    if (Array.isArray(data)) await clipStore.importClips(data);
  };

  const clearAll = async () => {
    if (confirm("确定清空全部藏书？此操作不可撤销。")) await clipStore.clear();
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

        <div className="flex items-center justify-between rounded-md border border-line bg-paper2 px-4 py-3">
          <span className="font-serif text-brick">清空全部</span>
          <Button
            variant="outline"
            onClick={clearAll}
            className="!border-brick !text-brick hover:!bg-brickSoft"
          >
            清空
          </Button>
        </div>
      </div>
    </div>
  );
}
