# MoneyFlow v7.2 Stable Rescue

這是白屏修正版，重點是穩定載入。

## 改動
- 移除 Recharts / Framer Motion / Lucide，避免 runtime 白屏
- 使用純 React + CSS + SVG 圖表
- Vite 固定 5.4.11
- `base: './'`，同時支援 Vercel / GitHub Pages 靜態路徑
- Stats 頁：每月累計支出、類別開支比例、每日消費變化、每日最大單項消費、每月最大單項消費
- 一鍵生成 IG Story 尺寸圖片

## 使用
```bash
npm install
npm run dev
npm run build
```

## Vercel
直接上載 GitHub 後由 Vercel deploy。
