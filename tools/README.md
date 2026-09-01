# tools/enrich.js — 用 Google Maps 補齊酒吧資料

把 `data.js` 裡每間酒吧的**評分、評論數、地址、電話、營業時間、價位、座標**改以 Google 地圖為準。

## 取得 API 金鑰（約 5 分鐘）

1. 到 https://console.cloud.google.com/ 建立一個專案
2. 左側「API 和服務」→「程式庫」→ 搜尋 **Places API (New)** → 啟用
3. 「憑證」→「建立憑證」→ API 金鑰 → 複製
4. （建議）點該金鑰 →「API 限制」只勾 Places API (New)，避免金鑰外流被濫用

費用：Places API 的 Text Search 每月有免費額度（遠超過本專案的 222 次查詢），跑一輪實務上是 0 元。

## 使用

```bash
export GOOGLE_MAPS_API_KEY=你的金鑰

node tools/enrich.js --dry-run   # 先試跑：只抓資料、產生報告，不動 data.js
node tools/enrich.js             # 正式跑：抓完後寫回 data.js
```

跑完看 `tools/enrich_report.md`，裡面會列出需要你人工判斷的部分：
- 查無 Google 商家的店
- 已歇業／暫停營業的店（網頁上會自動標成灰色並掛「⚠️ 已永久歇業」）
- 店名對不太起來、可能配錯的店（附 Google 地圖連結讓你核對）

## 其他選項

```bash
node tools/enrich.js --from-cache   # 用既有快取重建 data.js，不呼叫 API（免費、秒完成）
node tools/enrich.js --refresh      # 忽略快取，全部重抓（想更新評分時用）
```

原始回應會存在 `tools/places_cache.json`，是邊抓邊存的，中途中斷不會白跑。
想單獨重抓某幾間，把快取裡對應的項目刪掉再跑一次即可。

## 不會被覆蓋的欄位

你自己整理的內容一律保留，Google 不會蓋掉：
`note`（介紹與註記）、`awards`（獲獎）、`special`（私心推薦）、`style`（風格）、
`type`（酒類）、`purpose`（適合場合）、`budget`（自訂人均金額）
