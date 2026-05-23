# MoneyFlow v7.1 白屏修正版

## 修正重點
- 重新生成 React 主程式，避免 v7 patch 殘留造成白屏
- Vite 固定 5.4.11，禁止 Vite 8
- Stats 頁最上方只顯示「每月累計支出」
- Stats 圖表包含：
  - 類別開支比例
  - 每日消費變化
  - 每日最大單項消費
  - 每月最大單項消費
- 新增「生成 IG 圖」：1080 x 1920 Story 圖片
- 自訂日期 Date Picker 可正常顯示
- Calendar 只保留日曆

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
已包含 vercel.json。
