// 按需注入：响应 PING + GET_CAPTURE，回传选中文字 + 标题
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "PING") {
    sendResponse({ ok: true });
    return;
  }
  if (msg && msg.type === "GET_CAPTURE") {
    const sel = window.getSelection();
    const selectionText = sel ? sel.toString().trim() : "";
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const title =
      (ogTitle && ogTitle.getAttribute("content")) ||
      document.title ||
      location.title ||
      "";
    sendResponse({ selectionText, title });
  }
});
