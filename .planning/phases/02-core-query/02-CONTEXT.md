# Phase 2: Core Query - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

使用者可選擇起訖站與日期，查詢當日所有高鐵班次，看到每班次的時刻、座位狀態（標準席/商務席），並直接點擊前往官方訂票頁。僅支援單程查詢。起訖站選擇器使用下拉選單（視覺化線路圖留待 Phase 4）。

</domain>

<decisions>
## Implementation Decisions

### 座位狀態視覺
- 使用顏色 Badge：充足（綠）、有限（黃）、售完（紅）
- 標準席與商務席分兩行上下展示，不合併
- Badge 文字使用完整中文：「充足」「有限」「售完」
- 商務席標籤（席型文字）使用特別顏色標示，與標準席視覺有所區隔

### 頁面狀態設計
- **初始狀態**：只顯示查詢表單，下方加提示文字（如「選擇起訖站與日期，即可查詢時刻表」）
- **查詢中**：Skeleton 卡片（灰色模擬展示內容），讓用戶知道將有內容出現
- **查無結果**：簡短文字說明（「無符合的班次」），不需圖示
- **API 錯誤**：錯誤文字 + 「重試」按鈕，讓用戶可重新觸發查詢

### 查詢表單佈局
- 起訖站選擇器使用下拉選單（Phase 4 升級為視覺化線路圖）
- 手機版佈局：起站 [交換鈕] 訖站（並排） / 日期 / 查詢按鈕（縱向排列）
- 日期預設值：台灣時區（UTC+8）今天
- 交換鈕視覺：圈圈箭頭圖示（⇄ 或 ↻ 類型），位於起站與訖站之間

### Claude's Discretion
- 查詢按鈕的確切樣式（大小、顏色）
- Skeleton 卡片數量
- 提示文字的確切措辭
- 桌面版（desktop）的表單佈局細節

</decisions>

<specifics>
## Specific Ideas

- 座位狀態 badge 靈感參考：顏色直覺易讀（綠=有位、黃=快滿、紅=售完）
- 班次列表在手機版以卡片呈現，桌面版以表格式呈現（mobile-first，桌面清爽表格）
- 商務席 badge 可考慮用金/棕色系標示，區隔標準席的中性色系

</specifics>

<deferred>
## Deferred Ideas

- 來回車票查詢 — 需要選擇回程日期與班次，功能複雜度高，建議獨立為 Phase 加入 backlog
- 記憶上次查詢的起訖站（PERS-02）— v2 Requirements，非 Phase 2 範圍

</deferred>

---

*Phase: 02-core-query*
*Context gathered: 2026-02-19*
