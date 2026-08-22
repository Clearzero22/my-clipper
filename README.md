# 藏书 · my-clipper

一个 Chrome 扩展（MV3）：把网页和划词内容收藏到本地，新标签页即收藏矩阵主页，弹窗快速检索。

## 功能
- 新标签页矩阵主页：自适应多列图标网格，悬停上浮、砖红下划线
- 弹窗：一键收藏当前页（`Ctrl+Shift+S`）、搜索、删除
- 本地存储（`chrome.storage.local`），不上传服务器
- 模糊搜索（Fuse.js）：标题 / 网址 / 标签 / 划词
- 标签筛选、昼/夜主题切换（暖纸感 / 暖墨底，跟随系统并记忆偏好）
- 设置页：导出 / 导入 JSON 备份

## 开发
```bash
npm install
npm run build      # 产物输出到 dist/
npm test           # 运行模块化单元测试（vitest）
```

## 安装
1. `npm run build`
2. 打开 `chrome://extensions`，开启「开发者模式」
3. 「加载已解压的扩展程序」，选择 `dist/` 目录

> 收藏数据存于浏览器本地 `chrome.storage.local`；换设备或重装前请用设置页导出备份。
