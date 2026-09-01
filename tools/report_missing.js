#!/usr/bin/env node
/**
 * 產生「還缺哪些欄位」的檢查表，方便手動補資料。
 * 用法：node tools/report_missing.js
 * 產出：tools/missing_fields.md
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { BARS } = new Function(fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8') + '; return { BARS };')();

const FIELDS = [
  { key: 'rating',  label: '評分' },
  { key: 'price',   label: '價位' },
  { key: 'address', label: '地址' },
  { key: 'hours',   label: '營業時間' },
  { key: 'phone',   label: '電話' }
];

const mapsUrl = b =>
  'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent(b.address || `${b.name} ${b.city}${b.district || ''}`);

// 依縣市分組
const byCity = {};
for (const b of BARS) (byCity[b.city] = byCity[b.city] || []).push(b);

let md = `# 待補欄位檢查表

產生時間：${new Date().toLocaleString('zh-TW')}

補資料的方式：點店名開 Google 地圖 → 抄下需要的欄位 → 回 \`data.js\` 找到該行加上去。
格式範例（欄位順序不拘，沒查到的就不要加）：

\`\`\`js
{name: "某某 Bar", city: "台北市", district: "大安區", type: "經典", purpose: "一個人",
 price: 2, rating: 4.6, ratingCount: 320,
 address: "台北市大安區某某路100號", phone: "02-1234-5678",
 hours: "週二至週日 19:00–02:00（週一休）", note: "原本的註記保持不變"},
\`\`\`

**price 對照**：1 = NT$400–700、2 = NT$700–1,200、3 = NT$1,200 以上
**hours 寫法**：程式看得懂「週二至週日 19:00–02:00（週一休）」「20:00–02:00（週五六至03:00，週一休）」這類寫法，
跨夜、公休日、週末延長都會自動判斷。寫不出來也沒關係，網頁會顯示「時間未知」。

---

## 總覽

| 縣市 | 總數 | 缺評分 | 缺價位 | 缺地址 | 缺時間 | 缺電話 |
|---|---|---|---|---|---|---|
`;

const cities = Object.keys(byCity);
for (const city of cities) {
  const list = byCity[city];
  const miss = f => list.filter(b => b[f.key] === undefined).length;
  md += `| ${city} | ${list.length} | ${FIELDS.map(miss).join(' | ')} |\n`;
}
const allMiss = f => BARS.filter(b => b[f.key] === undefined).length;
md += `| **全台** | **${BARS.length}** | ${FIELDS.map(f => '**' + allMiss(f) + '**').join(' | ')} |\n`;

md += `\n---\n\n## 逐間清單\n\n只列出有缺欄位的店家。已經齊全的不會出現在這裡。\n`;

for (const city of cities) {
  const list = byCity[city].filter(b => FIELDS.some(f => b[f.key] === undefined));
  if (!list.length) continue;
  md += `\n### ${city}（${list.length} 間待補）\n\n`;
  for (const b of list) {
    const missing = FIELDS.filter(f => b[f.key] === undefined).map(f => f.label).join('、');
    md += `- [ ] [${b.name}](${mapsUrl(b)})${b.district ? ` · ${b.district}` : ''} — 缺 **${missing}**\n`;
  }
}

fs.writeFileSync(path.join(__dirname, 'missing_fields.md'), md);
const totalIncomplete = BARS.filter(b => FIELDS.some(f => b[f.key] === undefined)).length;
console.log(`已產生 tools/missing_fields.md`);
console.log(`${totalIncomplete} / ${BARS.length} 間有欄位待補`);
for (const f of FIELDS) console.log(`  缺${f.label}：${allMiss(f)} 間`);
