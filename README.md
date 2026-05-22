# MoneyFlow v6

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
