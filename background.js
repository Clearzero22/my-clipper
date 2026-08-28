// MV3 Service Worker: 收藏读写中枢 + 快捷键命令

const CLIPS_KEY = "clips";

function mergeTags(a, b) {
  if (!b || !b.length) return a;
  const set = new Set(a);
  for (const t of b) if (t) set.add(t);
  return [...set];
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(CLIPS_KEY, (res) => {
    if (!res[CLIPS_KEY]) chrome.storage.local.set({ [CLIPS_KEY]: [] });
  });
});

// 从 content script 抓取选中文字与页面元数据
async function getPageCapture(tabId) {
  try {
    const r = await chrome.tabs.sendMessage(tabId, { type: "GET_CAPTURE" });
    return r || {};
  } catch (e) {
    return {};
  }
}

// 保存当前活动标签为收藏（去重规则与 ClipStore.save 对齐）
async function saveActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url || !tab.url.startsWith("http")) return;
  const capture = tab.id ? await getPageCapture(tab.id) : {};
  const clip = {
    url: tab.url,
    title: capture.title || tab.title || tab.url,
    favicon: tab.favIconUrl || "",
    selectionText: capture.selectionText || "",
    tags: capture.tags || [],
  };
  const res = await chrome.storage.local.get(CLIPS_KEY);
  const clips = res[CLIPS_KEY] || [];
  const existing = clips.find((c) => c.url === clip.url);
  let next;
  if (existing) {
    const updated = {
      ...existing,
      title: clip.title || existing.title,
      favicon: clip.favicon || existing.favicon,
      selectionText: clip.selectionText || existing.selectionText,
      tags: mergeTags(existing.tags, clip.tags),
    };
    next = clips.map((c) => (c.url === clip.url ? updated : c));
  } else {
    next = [
      ...clips,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        ...clip,
      },
    ];
  }
  try {
    await chrome.storage.local.set({ [CLIPS_KEY]: next });
    if (chrome.runtime.lastError) throw new Error(chrome.runtime.lastError.message);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (chrome.notifications) {
      chrome.notifications.create("clip-error", {
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "保存失败",
        message: msg.includes("QUOTA") ? "存储空间已满，请导出备份后清理部分藏书。" : `写入失败：${msg}`,
      });
    }
    return;
  }
  if (chrome.notifications) {
    chrome.notifications.create("clipped", {
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "已收藏",
      message: clip.title,
    });
  }
}

// 命令：Ctrl+Shift+S
chrome.commands.onCommand.addListener((cmd) => {
  if (cmd === "save-clip") saveActiveTab();
});

// 来自 popup / newtab / options 的消息
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "SAVE_ACTIVE_TAB") {
    saveActiveTab().then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg && msg.type === "OPEN_URL") {
    chrome.tabs.update({ url: msg.url });
  }
});
