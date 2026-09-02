#!/usr/bin/env node
/**
 * 從 OpenStreetMap 抓全台捷運／輕軌車站，產生 stations.js。
 *
 * 用法：node tools/fetch_stations.js
 *
 * ## 為什麼要有這個檔
 *
 * 台灣跑吧高度依賴捷運。「離最近站 320 公尺」比一組經緯度直觀得多，
 * 也讓「今晚去哪一區」這個決定有依據。
 *
 * ## 資料來源與授權
 *
 * Overpass API（OpenStreetMap）。ODbL 授權，與地圖圖磚同源，
 * 頁尾已有 OSM 出處標示。不需要金鑰、沒有額度問題。
 *
 * ## 抓了什麼、沒抓什麼
 *
 * 取 railway=station 且屬於地鐵／輕軌者。**排除桃園機場的 Skytrain**——
 * 那是航廈之間的接駁電車，對跑吧沒有意義，留著只會讓「最近的站」
 * 在機場一帶給出無用的答案。
 *
 * 台鐵與高鐵沒有納入：它們站距大、班次疏，跟「走路過去續攤」的
 * 使用情境不合。真要加的話改這裡的查詢即可。
 *
 * ## 重跑時機
 *
 * 只有新路線通車時才需要重跑。車站位置本身不會變動，
 * 所以這份資料不像 geocode 那樣需要定期更新。
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'stations.js');
const ENDPOINT = 'https://overpass-api.de/api/interpreter';

const QUERY = `[out:json][timeout:180];
area["ISO3166-1"="TW"]->.tw;
(
  node["railway"="station"]["station"="subway"](area.tw);
  node["railway"="station"]["subway"="yes"](area.tw);
  node["railway"="station"]["station"="light_rail"](area.tw);
  node["station"="subway"](area.tw);
);
out body;`;

// 台灣本島與離島的概略範圍，用來擋掉查詢意外撈到的境外節點
const TW = { latMin: 21.5, latMax: 26.5, lngMin: 118.0, lngMax: 122.5 };

const clean = s => String(s || '').replace(/站$/, '').trim();

async function main() {
    console.log('向 Overpass API 查詢…');
    const res = await fetch(ENDPOINT, {
        method: 'POST',
        // Overpass 對沒有 User-Agent 的請求回 406。與 geocode.js 同樣的規矩：
        // 公共 API 要能認出是誰在打，出問題才找得到人。
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'TaiwanBarBible/1.0 (https://github.com/Sid-EN/Bar_Hopping)'
        },
        body: new URLSearchParams({ data: QUERY })
    });
    if (!res.ok) throw new Error(`Overpass 回應 ${res.status}`);
    const data = await res.json();
    console.log(`取得 ${data.elements.length} 個節點`);

    const seen = new Set();
    const out = [];
    let skipped = { skytrain: 0, noName: 0, outOfRange: 0, dup: 0 };

    for (const e of data.elements) {
        const t = e.tags || {};
        const net = t.network || t['network:zh'] || t.operator || '';

        if (/skytrain/i.test(net)) { skipped.skytrain++; continue; }

        const name = clean(t['name:zh'] || t.name);
        if (!name) { skipped.noName++; continue; }

        if (e.lat < TW.latMin || e.lat > TW.latMax ||
            e.lon < TW.lngMin || e.lon > TW.lngMax) { skipped.outOfRange++; continue; }

        // 同名同位置的重複節點（OSM 常見：同一站不同出入口各建一個節點）。
        // 取小數三位當鍵 ≈ 100 公尺，足以合併同站又不會誤併鄰站。
        const key = `${name}|${e.lat.toFixed(3)}|${e.lon.toFixed(3)}`;
        if (seen.has(key)) { skipped.dup++; continue; }
        seen.add(key);

        out.push({
            name,
            lat: Number(e.lat.toFixed(6)),
            lng: Number(e.lon.toFixed(6)),
            // network 缺漏的station（例如三鶯線）就用路線編號前綴，總比空著好
            net: net || (t.ref ? String(t.ref).replace(/\d+$/, '') : '')
        });
    }

    out.sort((a, b) => a.net.localeCompare(b.net, 'zh-TW') || a.name.localeCompare(b.name, 'zh-TW'));

    const byNet = {};
    out.forEach(s => { byNet[s.net || '(未標示)'] = (byNet[s.net || '(未標示)'] || 0) + 1; });

    const header = `// 全台捷運／輕軌車站座標，由 tools/fetch_stations.js 從 OpenStreetMap 產生。
// 請勿手動編輯 —— 新路線通車時重跑該腳本即可。
// 資料來源：OpenStreetMap contributors，ODbL 授權。
// 產生時間：${new Date().toISOString().slice(0, 10)}，共 ${out.length} 站。
`;
    const body = 'const STATIONS = [\n' +
        out.map(s => `  {name: ${JSON.stringify(s.name)}, lat: ${s.lat}, lng: ${s.lng}, net: ${JSON.stringify(s.net)}},`).join('\n') +
        '\n];\n';
    fs.writeFileSync(OUT, header + body);

    console.log(`\n寫入 ${path.relative(process.cwd(), OUT)}：${out.length} 站`);
    Object.entries(byNet).sort((a, b) => b[1] - a[1])
        .forEach(([k, v]) => console.log(`  ${String(v).padStart(4)} ${k}`));
    console.log('\n略過：', JSON.stringify(skipped));
}

main().catch(e => { console.error('失敗：', e.message); process.exit(1); });
