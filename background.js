// MV3 Service Worker: 收藏读写中枢 + 快捷键命令

const CLIPS_KEY = "clips";

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

// 保存当前活动标签为收藏
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
  const idx = clips.findIndex((c) => c.url === clip.url);
  if (idx >= 0) {
    clips[idx] = {
      ...clips[idx],
      title: clip.title,
      favicon: clip.favicon || clips[idx].favicon,
      selectionText: clip.selectionText || clips[idx].selectionText,
    };
  } else {
    clips.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      ...clip,
    });
  }
  await chrome.storage.local.set({ [CLIPS_KEY]: clips });
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
