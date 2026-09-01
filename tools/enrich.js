#!/usr/bin/env node
/**
 * 用 Google Places API (New) 補齊 data.js 的評分、地址、營業時間、電話、價位、座標。
 *
 * 用法：
 *   GOOGLE_MAPS_API_KEY=你的key node tools/enrich.js --dry-run   # 只抓取並產生報告，不改 data.js
 *   GOOGLE_MAPS_API_KEY=你的key node tools/enrich.js             # 抓取並寫回 data.js
 *   node tools/enrich.js --from-cache                            # 用既有快取重新產生 data.js（不呼叫 API）
 *
 * 說明：
 *   - 抓回來的原始結果會存在 tools/places_cache.json，重跑預設會沿用快取（省 API 費用）；
 *     要強制重抓某些店，刪掉快取中對應的項目，或加 --refresh 全部重抓。
 *   - Google 資料視為權威來源，會覆蓋 address / phone / hours / rating / ratingCount / price / location。
 *   - 你自己整理的欄位（note、awards、special、style、type、purpose、budget）一律保留不動。
 *   - 查無結果或已歇業的店家不會被自動刪除，只會列在報告裡讓你人工判斷。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_JS = path.join(ROOT, 'data.js');
const CACHE = path.join(__dirname, 'places_cache.json');
const REPORT = path.join(__dirname, 'enrich_report.md');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FROM_CACHE = args.includes('--from-cache');
const REFRESH = args.includes('--refresh');
const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';
const FIELDS = [
  'places.id', 'places.displayName', 'places.formattedAddress', 'places.shortFormattedAddress',
  'places.rating', 'places.userRatingCount', 'places.priceLevel', 'places.priceRange',
  'places.nationalPhoneNumber', 'places.regularOpeningHours.weekdayDescriptions',
  'places.location', 'places.businessStatus', 'places.websiteUri', 'places.googleMapsUri'
].join(',');

const PRICE_MAP = {
  PRICE_LEVEL_FREE: 1, PRICE_LEVEL_INEXPENSIVE: 1, PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3, PRICE_LEVEL_VERY_EXPENSIVE: 3
};

// ---------- 讀取現有資料 ----------
function loadData() {
  const src = fs.readFileSync(DATA_JS, 'utf8');
  const { BARS } = new Function(src + '; return { BARS };')();
  return { src, BARS };
}

// ---------- 呼叫 Places API ----------
async function searchPlace(bar) {
  const textQuery = `${bar.name} ${bar.city}${bar.district || ''} 酒吧`;
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': FIELDS
    },
    body: JSON.stringify({ textQuery, languageCode: 'zh-TW', regionCode: 'TW', maxResultCount: 3 })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  return (json.places || [])[0] || null;
}

// ---------- 把 Google 結果併入酒吧資料 ----------
function mergePlace(bar, place) {
  if (!place) return bar;
  const out = { ...bar };
  if (place.formattedAddress) out.address = place.formattedAddress.replace(/^\d{3,5}\s*/, '').replace(/^台灣/, '').trim();
  if (place.nationalPhoneNumber) out.phone = place.nationalPhoneNumber;
  if (typeof place.rating === 'number') out.rating = Math.round(place.rating * 10) / 10;
  if (typeof place.userRatingCount === 'number') out.ratingCount = place.userRatingCount;
  if (place.priceLevel && PRICE_MAP[place.priceLevel]) out.price = PRICE_MAP[place.priceLevel];
  const days = place.regularOpeningHours && place.regularOpeningHours.weekdayDescriptions;
  if (days && days.length) out.hours = compactHours(days);
  if (place.location) out.lat = round6(place.location.latitude), out.lng = round6(place.location.longitude);
  if (place.businessStatus && place.businessStatus !== 'OPERATIONAL') out.status = place.businessStatus;
  else delete out.status;
  return out;
}

const round6 = n => Math.round(n * 1e6) / 1e6;

// 「星期一: 20:00 – 02:00」×7 → 壓成精簡字串，連續同時段的日子會合併
function compactHours(days) {
  const parsed = days.map(d => {
    const i = d.indexOf(':');
    return { day: d.slice(0, i).replace('星期', '週'), time: d.slice(i + 1).trim() };
  });
  const groups = [];
  for (const p of parsed) {
    const last = groups[groups.length - 1];
    if (last && last.time === p.time) last.days.push(p.day);
    else groups.push({ time: p.time, days: [p.day] });
  }
  return groups.map(g => {
    const label = g.days.length > 2 ? `${g.days[0]}至${g.days[g.days.length - 1]}` : g.days.join('、');
    return g.time.includes('休息') || g.time.includes('Closed') ? `${label}公休` : `${label} ${g.time}`;
  }).join('；').replace(/\s+/g, ' ');
}

// ---------- 產生 data.js ----------
function writeDataJs(src, bars) {
  const KEY_ORDER = ['name', 'city', 'district', 'type', 'purpose', 'style', 'price', 'budget',
                     'address', 'phone', 'hours', 'lat', 'lng', 'rating', 'ratingCount',
                     'awards', 'special', 'status', 'note'];
  const header = src.slice(0, src.indexOf('const BARS = ['));
  const fmt = b => '  {' + KEY_ORDER.filter(k => b[k] !== undefined).map(k => `${k}: ${JSON.stringify(b[k])}`).join(', ') + '},';
  const lines = [];
  let lastCity = '';
  for (const b of bars) {
    if (b.city !== lastCity) { lines.push('', `  // ───── ${b.city} ─────`); lastCity = b.city; }
    lines.push(fmt(b));
  }
  fs.writeFileSync(DATA_JS, header + 'const BARS = [\n' + lines.join('\n') + '\n];\n');
}

// ---------- 主流程 ----------
(async () => {
  const { src, BARS } = loadData();
  let cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};

  if (!FROM_CACHE) {
    if (!API_KEY) {
      console.error('缺少 API 金鑰。請先設定：export GOOGLE_MAPS_API_KEY=你的key');
      console.error('（或用 node tools/enrich.js --from-cache 以既有快取重建 data.js）');
      process.exit(1);
    }
    let done = 0, hit = 0, miss = 0;
    for (const bar of BARS) {
      const key = `${bar.name}|${bar.city}`;
      done++;
      if (cache[key] !== undefined && !REFRESH) { process.stdout.write(`\r[${done}/${BARS.length}] 快取 ${bar.name}`.padEnd(70)); continue; }
      try {
        const place = await searchPlace(bar);
        cache[key] = place;
        place ? hit++ : miss++;
        process.stdout.write(`\r[${done}/${BARS.length}] ${place ? '✓' : '✗'} ${bar.name}`.padEnd(70));
      } catch (e) {
        console.error(`\n  ${bar.name} 查詢失敗：${e.message}`);
        cache[key] = null; miss++;
      }
      fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2));   // 邊抓邊存，中斷也不會白跑
      await new Promise(r => setTimeout(r, 120));                 // 放慢一點，避免觸發速率限制
    }
    console.log(`\n查詢完成：命中 ${hit}、查無 ${miss}`);
  }

  // 合併 + 產生報告
  const merged = [], notFound = [], closed = [], nameMismatch = [], stillMissing = [];
  for (const bar of BARS) {
    const place = cache[`${bar.name}|${bar.city}`];
    if (place === undefined) { merged.push(bar); continue; }
    if (place === null) { notFound.push(bar); merged.push(bar); continue; }
    const gName = (place.displayName && place.displayName.text) || '';
    const norm = s => s.toLowerCase().replace(/[\s'’．.·、｜|-]/g, '');
    if (gName && !norm(gName).includes(norm(bar.name).slice(0, 4)) && !norm(bar.name).includes(norm(gName).slice(0, 4))) {
      nameMismatch.push({ bar, gName, addr: place.formattedAddress, url: place.googleMapsUri });
    }
    const m = mergePlace(bar, place);
    if (m.status) closed.push({ bar, status: m.status });
    if (!m.address || !m.hours || !m.rating) stillMissing.push(m);
    merged.push(m);
  }

  const cnt = k => merged.filter(b => b[k] !== undefined).length;
  const n = merged.length;
  const summary = ['rating', 'ratingCount', 'price', 'address', 'phone', 'hours', 'lat']
    .map(k => `| ${k} | ${cnt(k)} / ${n} | ${Math.round(cnt(k) / n * 100)}% |`).join('\n');

  const report = `# Google Places 補齊報告

產生時間：${new Date().toLocaleString('zh-TW')}

## 欄位覆蓋率
| 欄位 | 筆數 | 覆蓋率 |
|---|---|---|
${summary}

## ⚠️ 需要人工確認

### 查無 Google 商家（${notFound.length} 間）
${notFound.length ? notFound.map(b => `- ${b.name}（${b.city}${b.district || ''}）`).join('\n') : '（無）'}

### 已歇業或暫停營業（${closed.length} 間）
${closed.length ? closed.map(c => `- ${c.bar.name}（${c.bar.city}）→ ${c.status}`).join('\n') : '（無）'}

### 店名對不太起來，可能配錯店（${nameMismatch.length} 間）
${nameMismatch.length ? nameMismatch.map(x => `- 清單「${x.bar.name}」 → Google「${x.gName}」\n  ${x.addr || ''} ${x.url || ''}`).join('\n') : '（無）'}

### 補完後仍有欄位缺漏（${stillMissing.length} 間）
${stillMissing.length ? stillMissing.map(b => `- ${b.name}：缺 ${['address', 'hours', 'rating'].filter(k => !b[k]).join('、')}`).join('\n') : '（無）'}
`;
  fs.writeFileSync(REPORT, report);
  console.log(`\n報告已寫入 ${path.relative(ROOT, REPORT)}`);
  console.log(`  查無商家 ${notFound.length}｜已歇業 ${closed.length}｜疑似配錯 ${nameMismatch.length}｜仍有缺漏 ${stillMissing.length}`);

  if (DRY_RUN) { console.log('\n--dry-run：未修改 data.js'); return; }
  writeDataJs(src, merged);
  console.log(`data.js 已更新（${n} 間）`);
})();
