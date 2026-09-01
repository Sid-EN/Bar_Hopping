#!/usr/bin/env node
/**
 * 針對 geocode.js 查無結果的店家，再用幾種變體重試一次。
 * 常見情況：店名帶中文後綴（"Vender 販"）、含品牌前綴、或只有路名查得到。
 *
 * 用法：node tools/geocode_retry.js   （跑完後再執行 node tools/geocode.js 寫回 data.js）
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const CACHE = path.join(__dirname, 'geocode_cache.json');
const UA = 'BarHopping-TaiwanBarBible/1.0 (https://github.com/Sid-EN/Bar_Hopping)';

const BOUNDS = { latMin: 21.5, latMax: 26.5, lngMin: 118.0, lngMax: 122.2 };
const inTaiwan = (la, ln) => la > BOUNDS.latMin && la < BOUNDS.latMax && ln > BOUNDS.lngMin && ln < BOUNDS.lngMax;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// 縣市別名（台/臺 兩種寫法都要認）
const CITY_ALIAS = {
  '台北市': ['臺北市', '台北市'], '新北市': ['新北市'], '基隆市': ['基隆市'], '桃園市': ['桃園市'],
  '新竹市': ['新竹市'], '新竹縣': ['新竹縣', '新竹市'], '苗栗縣': ['苗栗縣'], '台中市': ['臺中市', '台中市'],
  '彰化縣': ['彰化縣'], '南投縣': ['南投縣'], '雲林縣': ['雲林縣'], '嘉義市': ['嘉義市'], '嘉義縣': ['嘉義縣', '嘉義市'],
  '台南市': ['臺南市', '台南市'], '高雄市': ['高雄市'], '屏東縣': ['屏東縣'], '宜蘭縣': ['宜蘭縣'],
  '花蓮縣': ['花蓮縣'], '台東縣': ['臺東縣', '台東縣'], '澎湖縣': ['澎湖縣'], '金門縣': ['金門縣'], '連江縣': ['連江縣']
};

// Nominatim 常把「Light House」配到花蓮的燈塔這類完全不同的地方，
// 所以比對回傳地址裡的縣市，對不上就視為查無，寧可留空也不要標錯位置。
function cityMatches(bar, result) {
  if (!result || !result.matched) return false;
  return (CITY_ALIAS[bar.city] || [bar.city]).some(a => result.matched.includes(a));
}


async function query(q) {
  const url = 'https://nominatim.openstreetmap.org/search?' +
    new URLSearchParams({ format: 'json', limit: '1', countrycodes: 'tw', q });
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-TW' } });
  if (res.status === 429) { await sleep(10000); return null; }
  if (!res.ok) return null;
  const j = await res.json();
  if (!j.length) return null;
  const lat = parseFloat(j[0].lat), lng = parseFloat(j[0].lon);
  if (!inTaiwan(lat, lng)) return null;
  return { lat, lng, matched: j[0].display_name, osm: j[0].osm_type + '/' + j[0].osm_id, retry: true };
}

// 針對查無的店產生變體查詢
function variants(bar) {
  const out = [];
  const city = bar.city.replace(/[市縣]$/, '');
  const name = bar.name;

  // 只留拉丁字母部分："Vender 販" → "Vender"、"Bar Home" → "Bar Home"
  const latin = (name.match(/[A-Za-z0-9][A-Za-z0-9.'&\- ]*/g) || []).join(' ').trim();
  if (latin.length >= 3 && latin !== name) { out.push(`${latin} ${city}`); out.push(latin); }

  // 只留中文部分："Bar 千華" → "千華"
  const han = (name.match(/[一-鿿]+/g) || []).join('').trim();
  if (han.length >= 2 && han !== name) out.push(`${han} ${city}`);

  // 去掉常見詞尾再試
  const stripped = name.replace(/\s*(Bar|BAR|bar|酒吧|餐酒館|Cocktail Bar|Lounge Bar|Bistro)\s*/g, ' ').trim();
  if (stripped.length >= 2 && stripped !== name) out.push(`${stripped} ${city}`);

  // 路名層級（同一條街，誤差通常在一個街廓內，跑吧用途夠了）
  if (bar.address) {
    const street = bar.address.replace(/\s*[（(].*?[)）]\s*/g, '').replace(/\d+(-\d+)?號.*$/, '').trim();
    if (street) { out.push(street); out.push(street.replace(/^\D{2,3}[市縣]/, city + '市 ')); }
  }
  return [...new Set(out)].filter(Boolean);
}

(async () => {
  const src = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');
  const { BARS } = new Function(src + '; return { BARS };')();
  const cache = JSON.parse(fs.readFileSync(CACHE, 'utf8'));

  const misses = BARS.filter(b => cache[`${b.name}|${b.city}`] === null);
  console.log(`原本查無 ${misses.length} 間，開始重試…`);

  let recovered = 0, i = 0;
  for (const bar of misses) {
    i++;
    let found = null;
    for (const q of variants(bar)) {
      try { found = await query(q); } catch (e) { /* 忽略單次失敗 */ }
      await sleep(1100);
      if (found && !cityMatches(bar, found)) found = null;   // 縣市對不上就不採用
      if (found) break;
    }
    if (found) {
      cache[`${bar.name}|${bar.city}`] = found;
      recovered++;
      fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2));
      console.log(`[${i}/${misses.length}] ✓ ${bar.name}  ${found.lat.toFixed(4)},${found.lng.toFixed(4)}`);
    } else {
      console.log(`[${i}/${misses.length}] ✗ ${bar.name}`);
    }
  }
  console.log(`\n重試救回 ${recovered} 間。接著跑 node tools/geocode.js 把座標寫回 data.js。`);
})();
