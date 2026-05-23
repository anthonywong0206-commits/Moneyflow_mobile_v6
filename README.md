# MoneyFlow v7 Stats Edition

MoneyFlow 是一個 Mobile-first 的個人記帳網站，支援收入、支出、儲蓄、快捷記帳、月曆、Stats 圖表、圖卡下載及主題模式。

## 本地運行

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Vercel

Vercel 會讀取 `vercel.json`：

```json
{
  "installCommand": "npm install --legacy-peer-deps --no-audit --no-fund --registry=https://registry.npmjs.org/",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

## GitHub Pages

如部署到 repo 子路徑，請在 `vite.config.js` 加入：

```js
base: "/你的repo名/"
```

然後 build 後部署 `dist`。

## 注意

不要上載：
- node_modules
- dist
- package-lock.json（可由 Vercel 自動生成）
- pnpm-lock.yaml


## v7 Stats 更新
- Stats 頁頂部只顯示每月累計支出。
- 圖表內容：類別開支比例、每日消費變化、每日最大單項消費、每月最大單項消費。
- 新增一鍵生成 IG Story 尺寸整頁圖片，標誌月份，專業風格。
