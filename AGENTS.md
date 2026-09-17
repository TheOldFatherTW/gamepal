# GamePal — 代理進場說明

GamePal 是 **Fami 可分享門面**（GitHub Pages）＋ **家裡保險庫**（本機 HTTP + Cloudflare 隧道）。與 FamiBook、Kodohon 同一套分享政策；產品內容是遊戲攻略／地圖／觀戰，**門面殼與共用件**必須對齊 fami-shared-ui。

## 架構

- **公開門面**：<https://theoldfathertw.github.io/gamepal/>（靜態 HTML／JS／CSS；鑰匙、截圖、記憶不上這個庫）
- **家裡保險庫**：`python -m gamepal vault`（埠 8769），經隧道對外
- **隧道網址**：寫在 `config.js` 的 `window.VAULT_ORIGIN`（本 Wave 不改 runtime config）
- **鑰匙**：URL `?k=`／hash／cookie／localStorage；由 `gate.js` 的 `FamiGate` 核心處理

## UI 詞彙（fami-shared-ui）

門面 chrome 一律用 skill **`fami-shared-ui`** 詞彙表，不得自造第三種卡片或私製按鈕：

- **返回**、**確認**、**找卡**／**操作卡**、**齒輪**、**愛心**、**首頁頭**
- 等待文案三種語言、入口色塊（`.blobs`）、長押多選工具列等，比照活標本（Famiphoto／FamiBook）

改樣式若與原件不同，須定義編號版（如返回2）並寫進 skill；不得偷偷改無編號原件。

## 共用政策

- **能共用的物件 100% 共用**：返回、確認、操作卡、等待、鍵盤抬起、sheet 鎖頁等，與 FamiBook／Kodohon／GamePal 保持一致
- **不要各做第三種卡**：禁止為單一專案發明新的卡片類型或第三套門面殼
- **優先一顆 FamiGate 核心**：`gate.js` 提供 `window.FamiGate`；無充分理由不得 fork 或複製成第二套 gate
- 改共用 chrome 時，**同一回合**檢查兄弟門面（famibook、kodohon、gamepal），避免只修一庫

## 本專案邊界

- **可共用**：門面殼、FamiGate、等待／鍵盤／sheet 行為、個人頁骨架
- **GamePal 專屬**：遊戲格子、地圖標記、觀戰／聊天、攻略記憶等產品邏輯（`door.js`、`play.js`、`map.js`、`watch.js` 等）
- **Wave1**：本文件與 `.cursor/rules/fami-shared.mdc` 僅補政策；不動 `gate.js`、`hey.html`、`door.js`、`app.js`、`app.css` 或 runtime config

## 交付與 Git

- 使用者入口是 **GitHub Pages**，桌機／iPad／iPhone 同一顆網址；禁止把 exe／bat 當交付入口
- 會上 Pages 的改動：驗證後 **直接 commit + push `main`**，提高 `?v=`；不要開 PR（本 Wave 例外：僅 docs/rules 可開 PR）
- 詳細 push／Safari 快取規則見專案 `.cursor/rules/`（若已存在 always-push 等規則則一併遵守）

## 相關 skill

- **`fami-shared-ui`** — 詞彙表、標準版個人頁、共用 chrome
- **`ios-home-web`** — Pages 門面 + 隧道 + 三種裝置表面
