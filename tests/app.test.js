#!/usr/bin/env node
/**
 * 功能測試：用 jsdom 載入真實的 index.html + data.js + app.js，模擬使用者操作。
 * 執行：node tests/app.test.js
 */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
const t = (name, cond, extra) => {
    cond ? pass++ : fail++;
    console.log(cond ? '  PASS' : '  FAIL', name, !cond && extra !== undefined ? '→ ' + extra : '');
};
const section = s => console.log('\n=== ' + s + ' ===');

// 建立一個載好程式的測試環境
function boot(url = 'https://example.com/index.html', seed = null) {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
        .replace(/<script src="https:\/\/cdnjs[^"]*"><\/script>/g, '')   // 離線測試，不載 CDN
        .replace(/<link rel="stylesheet" href="https:\/\/cdnjs[^"]*">/g, '');
    const dom = new JSDOM(html, { runScripts: 'outside-only', url });
    const { window } = dom;
    window.alert = m => { window.__alert = m; };
    window.prompt = (a, b) => b;
    window.confirm = () => window.__confirm !== false;
    // jsdom 沒有在 window 上提供 TextEncoder/TextDecoder，但所有瀏覽器都有，
    // 這裡補上 Node 的實作，讓 base64 編解碼跑得起來
    if (!window.TextEncoder) window.TextEncoder = TextEncoder;
    if (!window.TextDecoder) window.TextDecoder = TextDecoder;
    if (!window.btoa) window.btoa = s => Buffer.from(s, 'binary').toString('base64');
    if (!window.atob) window.atob = s => Buffer.from(s, 'base64').toString('binary');
    window.matchMedia = window.matchMedia || (q => ({ matches: false, addListener() {}, removeListener() {} }));

    // 定位替身：預設回傳台北車站附近
    window.__geoPos = { coords: { latitude: 25.0478, longitude: 121.5170 } };
    window.__geoErr = null;
    Object.defineProperty(window.navigator, 'geolocation', {
        value: { getCurrentPosition: (ok, err) => window.__geoErr ? err(window.__geoErr) : ok(window.__geoPos) },
        configurable: true });

    // Canvas 替身：記錄畫了哪些文字，並讓 toBlob 回傳假的 blob
    window.__canvasText = [];
    window.HTMLCanvasElement.prototype.getContext = function () {
        const rec = window.__canvasText;
        return { fillRect() {}, strokeRect() {}, fillText(t) { rec.push(String(t)); },
                 measureText: t => ({ width: String(t).length * 20 }),
                 set font(v) {}, get font() { return ''; },
                 set fillStyle(v) {}, get fillStyle() { return ''; },
                 set strokeStyle(v) {}, get strokeStyle() { return ''; },
                 set lineWidth(v) {}, get lineWidth() { return 0; },
                 set textAlign(v) {}, get textAlign() { return ''; } };
    };
    window.HTMLCanvasElement.prototype.toBlob = function (cb) { cb(new window.Blob(['x'], { type: 'image/png' })); };
    window.URL.createObjectURL = () => 'blob:fake';
    window.URL.revokeObjectURL = () => {};

    let clipboard = null;
    Object.defineProperty(window.navigator, 'clipboard', {
        value: { writeText: txt => { clipboard = txt; return Promise.resolve(); } }, configurable: true });

    // Leaflet 替身：記錄被建立的圖層與圖釘
    const map = { markers: [], clustered: false, tiles: 0, fitBounds: 0, invalidate: 0 };
    const layer = { addTo() { return this; }, clearLayers() { map.markers = []; } };
    window.L = {
        map: () => { const m = { setView: () => m, invalidateSize() { map.invalidate++; },
                                fitBounds(p) { map.fitBounds = p.length; } }; return m; },
        tileLayer: () => ({ addTo() { map.tiles++; return this; } }),
        layerGroup: () => layer,
        markerClusterGroup: () => { map.clustered = true; return layer; },
        divIcon: o => o,
        circleMarker: (ll, o) => ({ latlng: ll, opts: o, _popup: null,
            bindPopup(h) { this._popup = h; return this; },
            addTo() { map.markers.push(this); return this; } })
    };

    // 模擬「重新整理」：程式啟動前就先把資料放進 localStorage
    if (seed) window.localStorage.setItem('barbible.v1', JSON.stringify(seed));

    // 真實瀏覽器中多個 <script> 共用頂層作用域，所以合併成一次 eval
    window.eval(
        fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8') + '\n' +
        fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8') + '\n' +
        ';window.__t = { BARS, PRICE_TIERS, hasGeo, hasAward, isFriend, barKey, byKey, store, saveStore,' +
        ' handleAction, update, renderRoute, renderList, openList, selectCity, stateToUrl, autoSortRoute,' +
        ' parseHours, openState, selectedTypes, selectedTraits, distanceKm, routeSchedule, yearStats,' +
        ' sinceText, myNote, visitLog, applyTheme, toggleTheme, randomPick, shareCard, lastFiltered,' +
        ' budgetText, statusText, openForm, closeForm, readForm, validateBar, toDataJsLine, pushToRepo,' +
        ' rebuildBars, refreshForm, renderPreview, validateNow, CITY_ORDER, normName, findDuplicate,' +
        ' insertIntoDataJs, findDuplicateInSource, parseDataJs, b64encode, b64decode,' +
        ' loadGh, saveGh, fillGhForm, saveGhFromForm, formDirty, snapshotForm, applyLocalChange, removeLocal,' +
        ' expiryInfo, cleanToken, tokenLooksValid, applyReveal, testGh,' +
        ' lastResetPoint, pruneRoute, touchRoute, personalData, syncUp, syncDown, ROUTE_RESET_HOUR };');

    const api = window.__t;
    return {
        window, api, map,
        get clipboard() { return clipboard; },
        $: id => window.document.getElementById(id),
        qsa: sel => [...window.document.querySelectorAll(sel)],
        click: el => el && el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })),
        input: el => el.dispatchEvent(new window.Event('input', { bubbles: true })),
        cards: () => window.document.querySelectorAll('.bar-card').length
    };
}

// ---------------------------------------------------------------- 基本渲染
{
    const e = boot();
    section('基本渲染');
    const total = e.api.BARS.length;
    t(`渲染 ${total} 張卡片`, e.cards() === total, e.cards());
    t('副標顯示總數', e.$('subtitle').textContent.includes(String(total)));
    t('進度條初始為 0', e.$('progressText').textContent.startsWith('0 /'));
    t('路線列初始隱藏', e.$('routeBar').hidden);
    t('每張卡都有營業狀態', e.qsa('.open-pill').length === total);
    t('星級數 = 有評分筆數', e.qsa('.stars-fill').length === e.api.BARS.filter(b => b.rating).length);
    t('人均數 = 有價位筆數',
        (e.$('barGrid').innerHTML.match(/人均/g) || []).length === e.api.BARS.filter(b => b.price).length);
}

// ---------------------------------------------------------------- 營業時間解析
{
    const e = boot();
    section('營業時間解析');
    const P = e.api.parseHours, DN = ['日', '一', '二', '三', '四', '五', '六'];
    const days = str => { const p = P(str); return p ? Object.keys(p.schedule).map(Number).sort().map(d => DN[d]).join('') : null; };
    const cases = [
        ['週二至週四 18:00–01:00（週日一休）', '二三四'],
        ['週一至週五 20:00–02:00', '一二三四五'],
        ['週二至日 18:00–01:30（週五六至02:30，週一休）', '日二三四五六'],
        ['20:00–02:00（週五六至03:00，週四休）', '日一二三五六'],
        ['19:30–01:30（週二三休）', '日一四五六'],
        ['16:00–24:00（不定休）', '日一二三四五六'],
        ['營業至02:00', null]
    ];
    for (const [str, exp] of cases) t(`解析「${str}」`, days(str) === exp, days(str) + ' 應為 ' + exp);

    const S = e.api.openState;
    const D = (off, h, m) => new Date(2026, 7, 30 + off, h, m);   // 2026-08-30 是週日
    t('跨夜：週一凌晨屬週日場次', S({ hours: '20:00–02:00' }, D(1, 1, 0)).state === 'open');
    t('跨夜：週一凌晨3點已打烊', S({ hours: '20:00–02:00' }, D(1, 3, 0)).state === 'closed');
    t('公休日不因跨夜而營業', S({ hours: '20:00–02:00（週一休）' }, D(2, 1, 0)).state === 'closed');
    t('公休當晚為休息', S({ hours: '20:00–02:00（週一休）' }, D(1, 21, 0)).state === 'closed');
    t('白天店晚上已關', S({ hours: '11:00–18:00（週四休）' }, D(0, 19, 0)).state === 'closed');
    t('無法解析回報 unknown', S({ hours: '營業至02:00' }, D(0, 21, 0)).state === 'unknown');
}

// ---------------------------------------------------------------- 篩選與排序
{
    const e = boot();
    section('篩選與排序');
    const T = e.api, total = T.BARS.length;
    const typeChip = txt => e.qsa('#typeChips .chip').find(c => c.textContent.includes(txt));
    const traitChip = txt => e.qsa('#traitChips .chip').find(c => c.textContent.includes(txt));

    t('酒類標籤 3 個', e.qsa('#typeChips .chip').length === 3);
    t('亮點標籤 8 個', e.qsa('#traitChips .chip').length === 8);

    const classic = T.BARS.filter(b => (b.type || '').includes('經典')).length;
    e.click(typeChip('經典調酒'));
    t('選經典後數量正確', e.cards() === classic, e.cards() + ' vs ' + classic);
    const or = T.BARS.filter(b => (b.type || '').includes('經典') || (b.type || '').includes('啤酒')).length;
    e.click(typeChip('啤酒'));
    t('酒類複選為 OR', e.cards() === or, e.cards() + ' vs ' + or);
    e.click(typeChip('經典調酒')); e.click(typeChip('啤酒'));
    t('取消後回到全部', e.cards() === total);

    const awards = T.BARS.filter(T.hasAward).length;
    e.click(traitChip('獲獎'));
    t(`獲獎標籤 ${awards} 間`, e.cards() === awards, e.cards());
    const and = T.BARS.filter(b => T.hasAward(b) && T.isFriend(b)).length;
    e.click(traitChip('脆友'));
    t('亮點複選為 AND', e.cards() === and, e.cards() + ' vs ' + and);
    e.click(traitChip('獲獎')); e.click(traitChip('脆友'));
    t('標籤狀態已清空', T.selectedTraits.size === 0);

    e.api.selectCity('台南市');
    t('縣市篩選', e.$('resultCount').textContent.includes(String(T.BARS.filter(b => b.city === '台南市').length)));
    e.api.selectCity('all');

    const p2 = T.BARS.filter(b => b.price === 2).length;
    e.$('priceFilter').value = '2'; e.input(e.$('priceFilter'));
    t(`價位篩選 ${p2} 間`, e.$('resultCount').textContent.includes(p2 + ' 間'));
    e.$('priceFilter').value = 'all'; e.input(e.$('priceFilter'));

    e.$('searchInput').value = '茶酒'; e.input(e.$('searchInput'));
    t('關鍵字搜尋有結果', e.cards() > 0);
    e.$('searchInput').value = ''; e.input(e.$('searchInput'));

    const names = () => [...e.$('barGrid').innerHTML.matchAll(/class="bar-name">([^<]+)</g)].map(m => m[1]);
    const at = n => T.BARS.find(b => b.name === n.replace(/&amp;/g, '&').replace(/&#39;/g, "'"));
    for (const mode of ['award', 'rating', 'price-asc', 'name', 'default']) {
        e.$('sortFilter').value = mode; e.input(e.$('sortFilter'));
        t(`排序 ${mode} 不掉資料`, e.cards() === total, e.cards());
    }
    e.$('sortFilter').value = 'rating'; e.input(e.$('sortFilter'));
    const rated = names().slice(0, 5).map(at).filter(Boolean);
    t('評分排序為遞減', rated.every((b, i) => i === 0 || (rated[i - 1].rating || 0) >= (b.rating || 0)));
    e.$('sortFilter').value = 'default'; e.input(e.$('sortFilter'));
}

// ---------------------------------------------------------------- 收藏、打卡、酒單
{
    const e = boot();
    section('收藏、打卡與我的酒單');
    const T = e.api;
    const keys = T.BARS.slice(0, 3).map(T.barKey);

    e.click(e.qsa('.bar-card [data-act="want"]')[0]);
    t('點愛心標記收藏', e.qsa('.bar-card [data-act="want"]')[0].classList.contains('on-want'));
    e.$('stateFilter').value = 'want'; e.input(e.$('stateFilter'));
    t('收藏篩選只剩 1 間', e.cards() === 1, e.cards());
    e.$('stateFilter').value = 'all'; e.input(e.$('stateFilter'));

    e.click(e.qsa('.bar-card [data-act="visited"]')[0]);
    t('標記已喝過', e.$('progressText').textContent.startsWith('1 /'), e.$('progressText').textContent);

    e.click(e.qsa('.bar-card')[0]);
    t('詳細頁開啟', !e.$('modalOverlay').hidden);
    t('詳細頁有 5 顆評分星', e.qsa('.rate-stars button').length === 5);
    e.click(e.qsa('.rate-stars button')[3]);
    t('給 4 星後亮 4 顆', e.qsa('.rate-stars button.lit').length === 4);
    e.click(e.$('modalClose'));
    t('關閉詳細頁', e.$('modalOverlay').hidden);

    keys.forEach(k => { if (!T.store.want[k]) T.handleAction('want', k); });
    T.update();
    e.click(e.$('myListBtn'));
    t('酒單開啟', !e.$('listOverlay').hidden);
    t('收藏頁列出 3 間', e.qsa('#listBody .list-item').length === 3, e.qsa('#listBody .list-item').length);
    e.click(e.qsa('#listBody .mini-btn.danger')[0]);
    t('可從酒單移除收藏', e.qsa('#listBody .list-item').length === 2);
    e.click(e.qsa('.list-tab').find(b => b.dataset.tab === 'visited'));
    t('切到已攻略分頁', e.qsa('.list-tab.active')[0].dataset.tab === 'visited');
    e.click(e.$('listClose'));
    e.click(e.$('progressBtn'));
    t('點進度條開啟已攻略頁', !e.$('listOverlay').hidden && e.qsa('.list-tab.active')[0].dataset.tab === 'visited');
    e.click(e.$('listClose'));

    t('狀態寫入 localStorage', Object.keys(JSON.parse(e.window.localStorage.getItem('barbible.v1')).want).length === 2);
}

// ---------------------------------------------------------------- 今晚路線
{
    const e = boot();
    section('今晚路線');
    const T = e.api;
    const rkeys = T.BARS.filter(T.hasGeo).filter(b => b.city === '台北市').slice(0, 4).map(T.barKey);
    rkeys.forEach(k => T.handleAction('route', k)); T.update();

    t('路線列出現', !e.$('routeBar').hidden);
    t('路線有 4 攤', e.qsa('.route-chip').length === 4);
    t('導航連結為 Google Maps 路線', e.$('routeGo').href.includes('/maps/dir/'));
    t('導航使用經緯度', /origin=\d+\.\d+%2C\d+\.\d+/.test(e.$('routeGo').href));
    t('有算出步行距離', /步行約 [\d.]+ km/.test(e.$('routeDist').textContent), e.$('routeDist').textContent);

    const seq = () => T.store.route.slice();
    const before = seq();
    e.click(e.qsa('.route-chip')[1].querySelector('[data-act="move"]'));
    t('往前按鈕會換位', seq()[0] === before[1] && seq()[1] === before[0]);
    t('第一攤往前鍵停用', e.qsa('.route-chip')[0].querySelector('[data-act="move"]').disabled);
    t('最後一攤往後鍵停用', e.qsa('.route-chip')[3].querySelectorAll('[data-act="move"]')[1].disabled);

    e.click(e.$('routeAuto'));
    t('自動排序後仍 4 攤', T.store.route.length === 4);

    e.click(e.qsa('.route-chip [data-act="route"]')[0]);
    t('可從 chip 移除', e.qsa('.route-chip').length === 3);
    e.click(e.$('routeClear'));
    t('清空後隱藏', e.$('routeBar').hidden);

    for (let i = 0; i < 10; i++) e.click(e.qsa('.bar-card [data-act="route"]')[i]);
    t('路線上限 8 攤', e.qsa('.route-chip').length === 8, e.qsa('.route-chip').length);
    t('超過上限有提示', typeof e.window.__alert === 'string' && e.window.__alert.includes('8'));
}

// ---------------------------------------------------------------- 網址分享
{
    const e = boot();
    section('網址分享');
    e.api.selectCity('台南市');
    e.$('priceFilter').value = '2'; e.input(e.$('priceFilter'));
    e.click(e.qsa('#traitChips .chip').find(c => c.textContent.includes('獲獎')));
    e.$('searchInput').value = '茶'; e.input(e.$('searchInput'));
    const url = e.api.stateToUrl();
    t('網址含縣市', url.includes('city=' + encodeURIComponent('台南市')));
    t('網址含價位', url.includes('price=2'));
    t('網址含亮點標籤', url.includes('traits=award'));
    t('網址含關鍵字', url.includes('q=' + encodeURIComponent('茶')));
    e.click(e.$('shareBtn'));
    t('分享複製到剪貼簿', e.clipboard === url);

    const e2 = boot(url);
    t('還原縣市', e2.window.location.search.includes('city'));
    t('還原價位', e2.$('priceFilter').value === '2');
    t('還原亮點標籤', e2.api.selectedTraits.has('award'));
    t('還原關鍵字', e2.$('searchInput').value === '茶');
    t('還原後結果一致', e2.cards() === e.cards(), e2.cards() + ' vs ' + e.cards());
}

// ---------------------------------------------------------------- 地圖
{
    const e = boot();
    section('地圖模式');
    const T = e.api;
    const geo = T.BARS.filter(T.hasGeo).length;
    e.click(e.$('viewMap'));
    t('切到地圖模式', e.$('mapView').classList.contains('active'));
    t('清單隱藏', e.$('barGrid').style.display === 'none');
    t('底圖已載入', e.map.tiles === 1);
    t('使用圖釘聚合', e.map.clustered);
    t('圖釘數 = 有座標店數', e.map.markers.length === geo, e.map.markers.length + ' vs ' + geo);
    t('圖釘都在台灣範圍', e.map.markers.every(m => m.latlng[0] > 21.5 && m.latlng[0] < 26.5 && m.latlng[1] > 118 && m.latlng[1] < 122.2));
    t('popup 有店名與按鈕', e.map.markers[0]._popup.includes('popup-name') && e.map.markers[0]._popup.includes('data-act="detail"'));
    t('說明顯示數量', e.$('mapNote').textContent.includes(String(geo)));

    const awardGeo = T.BARS.filter(b => T.hasAward(b) && T.hasGeo(b)).length;
    e.click(e.qsa('#traitChips .chip').find(c => c.textContent.includes('獲獎')));
    t('地圖跟著篩選連動', e.map.markers.length === awardGeo, e.map.markers.length + ' vs ' + awardGeo);
    e.click(e.qsa('#traitChips .chip').find(c => c.textContent.includes('獲獎')));
    e.click(e.$('viewList'));
    t('切回清單', !e.$('mapView').classList.contains('active'));
}


// ---------------------------------------------------------------- 離我最近
{
    const e = boot();
    section('離我最近');
    const T = e.api;
    t('初始沒有距離排序選項', !e.$('sortFilter').querySelector('[value="near"]'));
    e.click(e.$('locateBtn'));
    t('定位後出現距離排序', !!e.$('sortFilter').querySelector('[value="near"]'));
    t('自動切到距離排序', e.$('sortFilter').value === 'near');
    t('按鈕標示已定位', e.$('locateBtn').classList.contains('on'));
    t('卡片顯示距離', e.$('barGrid').innerHTML.includes('距離'));

    const names = [...e.$('barGrid').innerHTML.matchAll(/class="bar-name">([^<]+)</g)].map(m => m[1]);
    const at = n => T.BARS.find(b => b.name === n.replace(/&amp;/g, '&').replace(/&#39;/g, "'"));
    const me = { lat: 25.0478, lng: 121.5170 };
    const first10 = names.slice(0, 10).map(at).filter(b => b && T.hasGeo(b));
    t('距離為遞增排序', first10.every((b, i) => i === 0 || T.distanceKm(me, first10[i - 1]) <= T.distanceKm(me, b)));
    const last = names.slice(-5).map(at).filter(Boolean);
    t('無座標的排最後', last.every(b => !T.hasGeo(b)));

    // 拒絕授權時的處理
    const e2 = boot();
    e2.window.__geoErr = { code: 1, message: 'denied' };
    e2.click(e2.$('locateBtn'));
    t('拒絕定位有提示', e2.$('toast').textContent.includes('拒絕'), e2.$('toast').textContent);
    t('拒絕後按鈕恢復', !e2.$('locateBtn').disabled);
}

// ---------------------------------------------------------------- 路線時間推算
{
    const e = boot();
    section('路線營業時間檢查');
    const T = e.api;

    // 用固定資料驗證推算邏輯
    const A = { name: 'A', city: '台北市', lat: 25.04, lng: 121.51, hours: '18:00–02:00' };
    const B = { name: 'B', city: '台北市', lat: 25.05, lng: 121.52, hours: '18:00–02:00' };
    const C = { name: 'C', city: '台北市', lat: 25.06, lng: 121.53, hours: '18:00–21:00' };
    const start = new Date(2026, 7, 30, 20, 0);      // 週日 20:00 出發
    const plan = T.routeSchedule([A, B, C], start);
    t('第一攤即出發時間', plan[0].arrive.getHours() === 20 && plan[0].arrive.getMinutes() === 0);
    t('第二攤晚於第一攤至少 1 小時', (plan[1].arrive - plan[0].arrive) >= 60 * 60000);
    t('第一攤營業中', plan[0].warn === null, plan[0].warn);
    t('第三攤 21 點關會被標記', plan[2].warn === 'closed' || plan[2].warn === 'closing', plan[2].warn);
    const unk = T.routeSchedule([{ name: 'X', city: '台北市', hours: '營業至02:00' }], start);
    t('無法解析標為 unknown', unk[0].warn === 'unknown');

    // UI
    const rkeys = T.BARS.filter(T.hasGeo).filter(b => b.city === '台北市').slice(0, 3).map(T.barKey);
    rkeys.forEach(k => T.handleAction('route', k)); T.update();
    t('路線列出現時間表', e.$('routeSchedule').innerHTML.includes('sched-list'));
    t('時間表有 3 攤', e.qsa('.sched-item').length === 3, e.qsa('.sched-item').length);
    t('有出發時間輸入框', !!e.$('routeStart'));
    t('每攤都有抵達時間', e.qsa('.sched-time').every(el => /^\d{2}:\d{2}$/.test(el.textContent)));
    t('有整體結論', e.$('routeSchedule').innerHTML.includes('sched-alert') || e.$('routeSchedule').innerHTML.includes('sched-ok'));
    e.click(e.$('routeClear'));
    t('清空後時間表消失', e.$('routeSchedule').innerHTML === '');
}

// ---------------------------------------------------------------- 隨機推薦
{
    const e = boot();
    section('今晚喝哪間');
    e.click(e.$('randomBtn'));
    t('隨機抽出後開啟詳細頁', !e.$('modalOverlay').hidden);
    t('有提示訊息', e.$('toast').textContent.includes('就決定是你了'));
    e.click(e.$('modalClose'));
    // 篩到沒結果時要擋下來
    e.$('searchInput').value = 'zzz不可能存在的店zzz'; e.input(e.$('searchInput'));
    e.click(e.$('randomBtn'));
    t('無結果時不開詳細頁', e.$('modalOverlay').hidden);
    t('無結果時有提示', e.$('toast').textContent.includes('沒有可以抽'));
}

// ---------------------------------------------------------------- 筆記與到訪紀錄
{
    const e = boot();
    section('個人筆記與到訪紀錄');
    const T = e.api;
    const b = T.BARS[0], k = T.barKey(b);

    T.handleAction('visited', k); T.update();
    t('打卡後記錄今天日期', T.visitLog(b).length === 1);
    e.click(e.qsa('.bar-card')[0]);
    t('詳細頁出現到訪區塊', !!e.$('noteInput'));
    t('顯示到訪次數', e.window.document.querySelector('.visit-since').textContent.includes('1 次'));

    e.$('noteInput').value = '長島冰茶很濃，下次帶朋友來';
    e.$('noteInput').dispatchEvent(new e.window.Event('focusout', { bubbles: true }));
    t('筆記自動儲存', T.myNote(b) === '長島冰茶很濃，下次帶朋友來', T.myNote(b));
    t('儲存有提示', e.$('toast').textContent.includes('筆記已儲存'));
    t('卡片顯示筆記摘要', e.$('barGrid').innerHTML.includes('長島冰茶'));

    T.handleAction('revisit', k); T.update();
    t('再訪同一天不重複計算', T.visitLog(b).length === 1, T.visitLog(b).length);
    T.store.visited[k].visits = ['2026-01-15', '2026-06-20']; T.saveStore(); T.update();
    t('多次到訪正確計數', e.$('barGrid').innerHTML.includes('去過 2 次'));
    t('相對時間文字', T.sinceText('2026-08-29').length > 0);
    t('備份含筆記', JSON.parse(e.window.localStorage.getItem('barbible.v1')).visited[k].note.includes('長島'));
}

// ---------------------------------------------------------------- 年度回顧
{
    const e = boot();
    section('年度回顧');
    const T = e.api;
    const bars = T.BARS.slice(0, 5);
    bars.forEach((b, i) => {
        const k = T.barKey(b);
        T.store.visited[k] = { rating: i < 2 ? 5 : 4, date: '2026-03-0' + (i + 1),
                               visits: ['2026-03-0' + (i + 1), '2026-07-0' + (i + 1)] };
    });
    T.saveStore(); T.update();

    const st = T.yearStats('2026');
    t('統計酒吧數', st.bars === 5, st.bars);
    t('統計到訪次數', st.visitCount === 10, st.visitCount);
    t('計算平均給分', Math.abs(st.avg - 4.4) < 0.01, st.avg);
    t('列出五星愛店', st.favourites.length === 2, st.favourites.length);
    t('有最常去的縣市', !!st.topCity);
    const st2 = T.yearStats('2020');
    t('沒紀錄的年份為 0', st2.bars === 0);

    e.click(e.$('recapBtn'));
    t('回顧視窗開啟', !e.$('recapOverlay').hidden);
    t('年份選單有 2026', e.$('recapYear').innerHTML.includes('2026'));
    t('顯示統計卡片', e.qsa('.recap-card').length === 4, e.qsa('.recap-card').length);
    t('顯示總進度', e.$('recapBody').innerHTML.includes('已攻略全台'));
    e.click(e.$('recapClose'));
    t('可以關閉', e.$('recapOverlay').hidden);
}

// ---------------------------------------------------------------- 分享卡片圖
{
    const e = boot();
    section('分享卡片圖');
    const T = e.api;
    const bar = T.BARS.find(b => b.rating && b.note) || T.BARS[0];
    e.api.shareCard(bar);
    const txt = e.window.__canvasText.join(' ');
    t('圖上有店名', txt.includes(bar.name), txt.slice(0, 60));
    t('圖上有品牌名', txt.includes('TAIWAN BAR BIBLE'));
    t('圖上有縣市', txt.includes(bar.city));
    t('圖上有飲酒警語', txt.includes('未成年請勿飲酒'));
    if (bar.rating) t('圖上有評分', txt.includes(String(bar.rating)));

    e.click(e.qsa('.bar-card')[0]);
    t('詳細頁有產生分享圖按鈕', !!e.window.document.querySelector('[data-act="card"]'));
}

// ---------------------------------------------------------------- 主題切換
{
    const e = boot();
    section('淺色 / 深色主題');
    t('預設為深色', e.window.document.documentElement.dataset.theme === 'dark',
       e.window.document.documentElement.dataset.theme);
    e.click(e.$('themeBtn'));
    t('切換到淺色', e.window.document.documentElement.dataset.theme === 'light');
    t('按鈕文字改變', e.$('themeBtn').textContent.includes('深色'));
    t('theme-color 同步', e.window.document.querySelector('meta[name="theme-color"]').getAttribute('content') === '#f7f4ec');
    t('偏好有存起來', e.window.localStorage.getItem('barbible.theme') === 'light');
    e.click(e.$('themeBtn'));
    t('切回深色', e.window.document.documentElement.dataset.theme === 'dark');

    const e2 = boot();
    t('重新載入沿用偏好', e2.window.document.documentElement.dataset.theme === 'dark');
}


// ---------------------------------------------------------------- 這次修的四個問題
{
    const e = boot();
    section('回報問題的修正');
    const T = e.api, W = e.window;

    // (1) 表單輸入不該觸發整頁重繪
    const filterBound = [...W.document.querySelectorAll('.filter-panel select, .filter-panel input[type=text]')];
    const formInputs = [...e.$('barForm').querySelectorAll('select, input[type=text]')];
    t('篩選監聽器只綁篩選面板', filterBound.length > 0 && formInputs.every(el => !filterBound.includes(el)));

    e.click(e.$('addBtn'));
    const f = e.$('barForm');
    f.elements.name.value = '效能測試吧';
    const gridBefore = e.$('barGrid').innerHTML;
    e.input(f);
    t('在表單打字不會重繪主清單', e.$('barGrid').innerHTML === gridBefore);
    t('驗證仍即時更新', !e.$('formErrors').hidden || e.$('formSave').disabled !== undefined);

    // (2) 點背景不該關閉表單
    e.click(e.$('formOverlay'));
    t('點背景不會關閉表單', !e.$('formOverlay').hidden);
    t('有未儲存內容時判定為 dirty', T.formDirty());
    W.__confirm = false;
    e.click(e.$('formClose'));
    t('未儲存時關閉會先確認（取消則不關）', !e.$('formOverlay').hidden);
    W.__confirm = true;
    e.click(e.$('formClose'));
    t('確認後才真的關閉', e.$('formOverlay').hidden);

    // (3) 週/周 異體字與各種寫法
    const P = T.parseHours, DN = ['日', '一', '二', '三', '四', '五', '六'];
    const days = s => { const p = P(s); return p ? Object.keys(p.schedule).map(Number).sort().map(d => DN[d]).join('') : null; };
    const ALL = '日一二三四五六';
    t('週一至周日（異體字）', days('週一至周日 08:00-02:00') === ALL, days('週一至周日 08:00-02:00'));
    t('周一至周日', days('周一至周日 08:00-02:00') === ALL);
    t('週一至週日', days('週一至週日 08:00-02:00') === ALL);
    t('週一到週五（用「到」）', days('週一到週五 19:00-01:00') === '一二三四五');
    t('每日', days('每日 18:00-02:00') === ALL);
    t('每天', days('每天 20:00-03:00') === ALL);
    t('全年無休', days('全年無休 17:00-01:00') === ALL);
    t('周二至周日（周一休）', days('周二至周日 19:00-02:00（周一休）') === '日二三四五六');
    t('異體字的收班覆寫與公休', days('20:00-02:00（周五六至03:00，周四休）') === '日一二三五六');
    const p7 = P('週一至周日 08:00-02:00');
    t('七天時段都正確', Object.keys(p7.schedule).length === 7 &&
        Object.values(p7.schedule).every(x => x.open === 480 && x.close === 1560));

    // (4) 必填星號不換行：標題文字與星號在同一個元素內
    const reqTitles = [...e.$('barForm').querySelectorAll('.f-title')];
    t('必填標題有兩個', reqTitles.length === 2, reqTitles.length);
    t('星號與文字在同一元素', reqTitles.every(el => el.textContent.includes('*') && el.textContent.trim().length > 1));
    t('沒有殘留的 f-req 結構', !e.$('barForm').querySelector('.f-req'));
}

// ---------------------------------------------------------------- 寫回 repo
{
    const e = boot();
    section('寫回 repo');
    const T = e.api;

    // base64 往返（data.js 全是中文，這裡最容易出錯）
    const sample = '{name: "測試吧", city: "台北市", note: "中文與 emoji 🍸 都要正確"},';
    t('base64 中文往返正確', T.b64decode(T.b64encode(sample)) === sample);
    const big = sample.repeat(3000);
    t('大檔案不會爆掉', T.b64decode(T.b64encode(big)) === big, String(big.length));

    // 插入邏輯
    const src = [
        'const BARS = [',
        '',
        '  // ───── 台北市 ─────',
        '  {name: "A吧", city: "台北市", type: "經典"},',
        '  {name: "B吧", city: "台北市", type: "特調"},',
        '',
        '  // ───── 台南市 ─────',
        '  {name: "C吧", city: "台南市", type: "特調"},',
        '];',
        ''
    ].join('\n');

    const r1 = T.insertIntoDataJs(src, { name: '新吧', city: '台北市', type: '經典' });
    t('插入模式為 insert', r1.mode === 'insert', r1.mode);
    t('插在台北市區塊內', r1.content.indexOf('新吧') > r1.content.indexOf('台北市 ─') &&
                          r1.content.indexOf('新吧') < r1.content.indexOf('台南市 ─'));
    t('沒有動到既有資料', r1.content.includes('A吧') && r1.content.includes('B吧') && r1.content.includes('C吧'));
    t('結果仍是合法 JS', (() => { try { return new Function(r1.content + '; return BARS.length')() === 4; } catch (x) { return false; } })());

    const r2 = T.insertIntoDataJs(src, { name: 'B吧', city: '台北市', type: '經典特調', price: 2 });
    t('同名同縣市為 update', r2.mode === 'update', r2.mode);
    t('取代而非新增', (() => { try { return new Function(r2.content + '; return BARS.length')() === 3; } catch (x) { return false; } })());
    t('內容確實被更新', r2.content.includes('經典特調') && !r2.content.includes('{name: "B吧", city: "台北市", type: "特調"}'));

    const r3 = T.insertIntoDataJs(src, { name: '高雄吧', city: '高雄市', type: '經典' });
    t('新縣市會建立區塊', r3.mode === 'new-city', r3.mode);
    t('新區塊有標題註解', r3.content.includes('// ───── 高雄市 ─────'));
    t('新縣市插在正確位置（台南後）', r3.content.indexOf('高雄市 ─') > r3.content.indexOf('台南市 ─'));
    t('新縣市結果合法', (() => { try { return new Function(r3.content + '; return BARS.length')() === 4; } catch (x) { return false; } })());

    const r4 = T.insertIntoDataJs(src, { name: '基隆吧', city: '基隆市', type: '經典' });
    t('基隆插在台北與台南之間', r4.content.indexOf('基隆市 ─') > r4.content.indexOf('台北市 ─') &&
                                r4.content.indexOf('基隆市 ─') < r4.content.indexOf('台南市 ─'));

    // 對真實的 data.js 做一次，確認不會弄壞
    const realSrc = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');
    const rr = T.insertIntoDataJs(realSrc, { name: '真實插入測試吧', city: '宜蘭縣', type: '特調', price: 2 });
    const rebuilt = new Function(rr.content + '; return BARS;')();
    t('真實 data.js 插入後仍可解析', Array.isArray(rebuilt));
    t('真實 data.js 筆數 +1', rebuilt.length === T.BARS.length + 1, rebuilt.length + ' vs ' + (T.BARS.length + 1));
    t('新店歸在宜蘭縣', rebuilt.filter(b => b.city === '宜蘭縣').some(b => b.name === '真實插入測試吧'));
    t('PRICE_TIERS 未受影響', rr.content.includes('PRICE_TIERS'));

    // 沒設定權杖時的行為
    e.click(e.$('addBtn'));
    e.$('barForm').elements.name.value = 'X吧';
    e.$('barForm').elements.city.value = '台北市';
    e.input(e.$('barForm'));
    e.click(e.$('formPush'));
    t('未設定權杖會提示', e.$('toast').textContent.includes('權杖'), e.$('toast').textContent);
    t('並展開設定區塊', e.$('ghBox').open);
    t('repo 欄位有預設值', e.$('ghRepo').value === 'Sid-EN/Bar_Hopping', e.$('ghRepo').value);
}

// ---------------------------------------------------------------- 表單欄位不得出現 null
{
    const e = boot();
    section('表單欄位空值處理');
    const T = e.api;
    const vals = () => [...e.$('barForm').elements].filter(el => el.name && el.type !== 'checkbox')
        .map(el => ({ name: el.name, v: el.value }));

    T.openForm();
    const fresh = vals();
    t('全新開啟時所有欄位皆為空字串', fresh.every(x => x.v === ''),
        JSON.stringify(fresh.filter(x => x.v !== '')));
    t('沒有任何欄位顯示 null/undefined',
        fresh.every(x => x.v !== 'null' && x.v !== 'undefined' && x.v !== 'NaN'));
    t('placeholder 仍在（灰色範例不被蓋掉）',
        e.$('barForm').elements.name.placeholder.length > 0 &&
        e.$('barForm').elements.address.placeholder.length > 0);

    // 編輯欄位很少的酒吧：沒資料的欄位一樣要留白
    const sparse = T.BARS.find(b => !b.address && !b.phone && !b.rating && !b.price && !b.style);
    T.openForm(sparse);
    const sp = vals();
    t('稀疏資料不產生 null', sp.every(x => x.v !== 'null' && x.v !== 'undefined' && x.v !== 'NaN'),
        JSON.stringify(sp.filter(x => ['null', 'undefined', 'NaN'].includes(x.v))));
    t('沒有的欄位留白', sp.find(x => x.name === 'address').v === '' &&
                        sp.find(x => x.name === 'rating').v === '');
    t('有的欄位正確帶入', sp.find(x => x.name === 'name').v === sparse.name);

    // 就算資料裡混進 null，也不能顯示成文字
    T.openForm({ name: 'Null 測試', city: '台北市', district: null, rating: null,
                 price: undefined, awards: null, note: null, lat: NaN });
    const nv = vals();
    t('欄位值為 null 時轉成空字串', nv.every(x => x.v !== 'null'),
        JSON.stringify(nv.filter(x => x.v === 'null')));
    t('NaN 也轉成空字串', nv.find(x => x.name === 'lat').v === '');
    t('awards 為 null 時留白', nv.find(x => x.name === 'awards').v === '');
    T.closeForm(true);
}

// ---------------------------------------------------------------- 防重複
{
    const e = boot();
    section('防止重複新增');
    const T = e.api;

    t('正規化忽略大小寫', T.normName('Bar Weekend') === T.normName('BAR WEEKEND'));
    t('正規化忽略空白', T.normName('Bar Weekend') === T.normName('Bar  Weekend'));
    t('正規化忽略連字號與標點', T.normName('Bar-Weekend') === T.normName('Bar Weekend') &&
                                 T.normName("INGE'S Bar") === T.normName('INGES Bar'));
    t('不同店名不會誤判', T.normName('Bar Weekend') !== T.normName('Bar Weekday'));

    const exist = T.BARS.find(b => b.city === '台北市');
    t('找得到同縣市實質同名的店', !!T.findDuplicate(T.BARS, exist.name.toUpperCase(), '台北市'));
    t('不同縣市不算重複', !T.findDuplicate(T.BARS, exist.name, '台南市'));
    t('編輯自己不算重複', !T.findDuplicate(T.BARS, exist.name, '台北市', `${exist.name}|台北市`));

    // 表單層級
    e.click(e.$('addBtn'));
    const f = e.$('barForm');
    f.elements.name.value = exist.name.toUpperCase().replace(/\s/g, '');
    f.elements.city.value = '台北市';
    e.input(f);
    t('大小寫/空白不同的重複會被擋', e.$('formPush').disabled);
    t('錯誤訊息點出是同一間', e.$('formErrors').textContent.includes('同一間') ||
                              e.$('formErrors').textContent.includes('已經有'));
    f.elements.name.value = '絕對不會重複的新店名 ABC';
    e.input(f);
    t('改成不重複後可以送出', !e.$('formPush').disabled);
    T.closeForm(true);

    // 對 repo 內容做的重複檢查（別人剛新增的，本機看不到）
    const src = [
        'const BARS = [', '',
        '  // ───── 台北市 ─────',
        '  {name: "別人剛加的吧", city: "台北市", type: "經典"},',
        '];', ''
    ].join('\n');
    t('可從 repo 內容解析出清單', Array.isArray(T.parseDataJs(src)));
    t('偵測到 repo 已有同名店', !!T.findDuplicateInSource(src, { name: '別人剛加的吧', city: '台北市' }));
    t('偵測到 repo 已有實質同名店', !!T.findDuplicateInSource(src, { name: '別人剛加的 吧', city: '台北市' }));
    t('沒重複時回傳 null', T.findDuplicateInSource(src, { name: '全新的店', city: '台北市' }) === null);
    t('編輯自己時不算重複',
        T.findDuplicateInSource(src, { name: '別人剛加的吧', city: '台北市' }, '別人剛加的吧|台北市') === null);

    // 寫入時同名一律取代，不會產生兩行
    const r = T.insertIntoDataJs(src, { name: '別人剛加的吧', city: '台北市', type: '特調' });
    t('同名寫入為取代', r.mode === 'update');
    t('取代後不會變成兩筆', T.parseDataJs(r.content).length === 1);
}

// ---------------------------------------------------------------- 編輯與刪除既有酒吧
{
    const e = boot();
    section('編輯既有酒吧');
    const T = e.api;

    e.click(e.qsa('.bar-card')[0]);
    const editBtn = e.window.document.querySelector('[data-act="edit"]');
    t('任何酒吧都能編輯', !!editBtn);
    e.click(editBtn);
    t('編輯表單開啟', !e.$('formOverlay').hidden);
    t('標題為編輯', e.$('formTitle').textContent.includes('編輯'));
    t('顯示從 repo 刪除鍵', !e.$('formDelete').hidden);
    t('刪除鍵文字明確', e.$('formDelete').textContent.includes('repo'));
    t('主要按鈕是寫回 repo', e.$('formPush').textContent.includes('repo'));
    t('已移除「儲存到這台裝置」', !e.window.document.getElementById('formSave'));
    T.closeForm(true);

    // 改名時，收藏／打卡／路線的 key 要跟著搬
    const b0 = T.BARS[0], oldKey = T.barKey(b0);
    T.handleAction('want', oldKey);
    T.handleAction('visited', oldKey);
    T.handleAction('route', oldKey);
    T.applyLocalChange({ ...b0, name: b0.name + ' 改名版' }, oldKey);
    const newKey = b0.city ? `${b0.name} 改名版|${b0.city}` : null;
    t('改名後總數不變', T.BARS.length === 222, T.BARS.length);
    t('收藏跟著搬到新名字', !!T.store.want[newKey] && !T.store.want[oldKey]);
    t('打卡紀錄跟著搬', !!T.store.visited[newKey]);
    t('路線也跟著更新', T.store.route.includes(newKey) && !T.store.route.includes(oldKey));

    // 刪除
    T.removeLocal(newKey);
    t('刪除後總數 -1', T.BARS.length === 221, T.BARS.length);
    t('刪除後收藏一併清掉', !T.store.want[newKey]);
    t('刪除後不在路線裡', !T.store.route.includes(newKey));
}

// ---------------------------------------------------------------- 權杖處理
{
    const e = boot();
    section('存取權杖處理');
    const T = e.api;

    e.click(e.$('addBtn'));
    t('未設定時設定區塊展開', e.$('ghBox').open);
    t('權杖欄位為 password 型別', e.$('ghToken').type === 'password');
    t('repo 有預設值', e.$('ghRepo').value === 'Sid-EN/Bar_Hopping');

    const TOK1 = 'github_pat_TESTTOKEN1234567890123456ABCD';
    e.$('ghToken').value = TOK1;
    e.click(e.$('ghSave'));
    t('權杖已儲存', T.loadGh().token === TOK1, T.loadGh().token);
    t('畫面不再顯示權杖原文', !e.$('ghToken').value.includes('TESTTOKEN'), e.$('ghToken').value);
    t('顯示為遮蔽字元', /^[•]+$/.test(e.$('ghToken').value));
    t('提示只露出末四碼', e.$('ghTokenHint').textContent.includes('ABCD') &&
                          !e.$('ghTokenHint').textContent.includes('TESTTOKEN'));
    t('設定好後區塊自動收合', !e.$('ghBox').open);
    t('儲存後提示去測試連線', e.$('ghStatus').textContent.includes('測試連線'), e.$('ghStatus').textContent);

    // 不改動遮蔽欄位再存一次，權杖不能被洗掉
    e.click(e.$('ghSave'));
    t('遮蔽狀態下重存不會清掉權杖', T.loadGh().token === TOK1);

    // 換新權杖
    const TOK2 = 'github_pat_NEWTOKEN98765432109876WXYZ';
    e.$('ghToken').value = TOK2;
    e.click(e.$('ghSave'));
    t('可以換成新權杖', T.loadGh().token === TOK2, T.loadGh().token);

    e.click(e.$('ghClear'));
    t('清除後權杖為空', T.loadGh().token === '');
    t('清除後欄位也清空', e.$('ghToken').value === '');
    t('清除後設定區塊展開', e.$('ghBox').open);

    // 權杖不該出現在原始碼裡
    const appSrc = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
    const htmlSrc = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
    const TOKEN_RE = /gh[pousr]_[A-Za-z0-9]{16,}|github_pat_[A-Za-z0-9_]{30,}/;
    t('app.js 沒有寫死的權杖', !TOKEN_RE.test(appSrc));
    t('index.html 沒有寫死的權杖', !TOKEN_RE.test(htmlSrc));
    t('README 沒有貼到真實權杖', !TOKEN_RE.test(readme));
    t('data.js 沒有權杖', !TOKEN_RE.test(fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8')));
}

// ---------------------------------------------------------------- 權杖到期日（使用者自填）
{
    const e = boot();
    section('權杖到期日');
    const T = e.api;

    e.click(e.$('addBtn'));
    t('有到期日輸入欄位', !!e.$('ghExpiryInput'));
    t('欄位型別為日期', e.$('ghExpiryInput').type === 'date');
    t('未設定時不顯示到期文字', e.$('ghExpiry').textContent === '', e.$('ghExpiry').textContent);

    e.$('ghToken').value = 'github_pat_' + 'A'.repeat(30);
    e.$('ghExpiryInput').value = '2027-09-01';
    e.click(e.$('ghSave'));
    t('到期日已儲存', T.loadGh().expiry === '2027-09-01', T.loadGh().expiry);
    t('欄位旁顯示到期日', e.$('ghExpiry').textContent.includes('2027/09/01'), e.$('ghExpiry').textContent);
    t('未接近到期時不上色', !e.$('ghExpiry').className.includes('soon'));

    const saved = JSON.parse(e.window.localStorage.getItem('barbible.gh'));
    t('存進 localStorage', saved.expiry === '2027-09-01');
    T.closeForm(true);
    e.click(e.$('addBtn'));
    t('重新開啟表單仍帶入', e.$('ghExpiryInput').value === '2027-09-01');

    const far = T.expiryInfo('2099-01-01');
    t('遠期顯示「有效期至」', far.text.includes('有效期至') && far.cls === '');
    const soon = T.expiryInfo(new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10));
    t('30 天內轉為提醒', soon.cls === 'soon' && soon.text.includes('剩'), JSON.stringify(soon));
    const past = T.expiryInfo('2020-01-01');
    t('已過期標為 expired', past.cls === 'expired' && past.text.includes('請更換'), JSON.stringify(past));
    t('沒填則不顯示', T.expiryInfo('') === null);
    t('亂填的日期不會壞掉', T.expiryInfo('不是日期') === null);

    e.click(e.$('ghClear'));
    t('清除權杖後到期日保留', T.loadGh().expiry === '2027-09-01', T.loadGh().expiry);
}

// ---------------------------------------------------------------- 權杖貼上與檢視
{
    const e = boot();
    section('權杖貼上與檢視');
    const T = e.api;
    const GOOD = 'github_pat_' + 'B'.repeat(30);

    t('清掉遮蔽圓點', T.cleanToken('\u2022'.repeat(12) + GOOD) === GOOD);
    t('清掉空白', T.cleanToken('  ' + GOOD + ' \n') === GOOD);
    t('正常權杖不受影響', T.cleanToken(GOOD) === GOOD);
    t('fine-grained 格式通過', T.tokenLooksValid(GOOD).ok);
    t('classic 格式也通過', T.tokenLooksValid('ghp_' + 'C'.repeat(36)).ok);
    t('混到圓點的被判為無效', !T.tokenLooksValid('\u2022\u2022\u2022\u2022' + GOOD).ok);
    t('空字串無效', !T.tokenLooksValid('').ok);
    t('亂打的無效', !T.tokenLooksValid('abcdefg').ok);

    e.click(e.$('addBtn'));
    const input = e.$('ghToken');

    // 貼上時混到遮蔽字元 → 輸入當下就清乾淨
    input.value = '\u2022'.repeat(12) + GOOD;
    e.input(input);
    t('輸入當下就清掉圓點', input.value === GOOD, input.value);
    e.click(e.$('ghSave'));
    t('存進去的是乾淨的權杖', T.loadGh().token === GOOD, T.loadGh().token);

    t('預設為密文', input.type === 'password');
    t('預設顯示遮蔽字串', /^[\u2022]+$/.test(input.value), input.value);
    e.click(e.$('ghReveal'));
    t('按眼睛後變明文', input.type === 'text');
    t('顯示完整權杖', input.value === GOOD, input.value);
    t('按鈕標示為已開啟', e.$('ghReveal').classList.contains('on'));
    e.click(e.$('ghReveal'));
    t('再按一次變回密文', input.type === 'password');
    t('內容變回遮蔽', /^[\u2022]+$/.test(input.value));

    input.dispatchEvent(new e.window.Event('focus', { bubbles: true }));
    t('聚焦時清空遮蔽字串', input.value === '');
    t('權杖本身沒被清掉', T.loadGh().token === GOOD);

    input.value = 'this-is-not-a-token';
    e.click(e.$('ghSave'));
    t('格式錯誤不會存進去', T.loadGh().token === '', T.loadGh().token);
    t('顯示錯誤診斷', !e.$('ghDiag').hidden && e.$('ghDiag').textContent.includes('格式'));
    t('狀態列標示未儲存', e.$('ghStatus').textContent.includes('尚未儲存'));

    T.saveGh({ repo: 'Sid-EN/Bar_Hopping', token: GOOD, expiry: '' });
    T.fillGhForm();
    e.click(e.$('ghSave'));
    t('沒改動時沿用原權杖', T.loadGh().token === GOOD);
}


// ---------------------------------------------------------------- 今晚路線中午重設
{
    const e = boot();
    section('今晚路線中午重設');
    const T = e.api;

    t('重設時點為中午 12 點', T.ROUTE_RESET_HOUR === 12);

    const at = (h, m) => new Date(2026, 7, 30, h, m);   // 2026-08-30
    const noonToday = new Date(2026, 7, 30, 12, 0, 0, 0).getTime();
    const noonYesterday = new Date(2026, 7, 29, 12, 0, 0, 0).getTime();
    t('下午時界線是今天中午', T.lastResetPoint(at(20, 0)) === noonToday);
    t('凌晨時界線仍是昨天中午', T.lastResetPoint(at(2, 30)) === noonYesterday);
    t('早上時界線是昨天中午', T.lastResetPoint(at(9, 0)) === noonYesterday);
    t('剛過中午界線就換成今天', T.lastResetPoint(at(12, 1)) === noonToday);

    // 剛加入的路線不該被清掉
    const keys = T.BARS.slice(0, 3).map(T.barKey);
    keys.forEach(k => T.handleAction('route', k));
    T.update();
    t('加入路線會記錄時間', typeof T.store.routeAt === 'number');
    t('剛建立的路線不會被清', T.pruneRoute() === false && T.store.route.length === 3);

    // 昨天中午之前建立的 → 清掉
    T.store.routeAt = Date.now() - 3 * 86400000;
    T.saveStore();
    t('過期的路線會被清空', T.pruneRoute() === true && T.store.route.length === 0);
    t('清空後 routeAt 也移除', T.store.routeAt === undefined);

    // 跨夜情境：晚上 10 點建立，凌晨 3 點仍在
    keys.forEach(k => T.handleAction('route', k));
    const lastNight = new Date();
    lastNight.setHours(22, 0, 0, 0);
    if (lastNight > Date.now()) lastNight.setDate(lastNight.getDate() - 1);
    T.store.routeAt = lastNight.getTime();
    T.saveStore();
    const kept = !T.pruneRoute();
    t('跨夜不會被清掉（晚上建立、凌晨仍在）',
        kept || T.lastResetPoint() > lastNight.getTime(), '取決於執行當下時間');

    // 沒有 routeAt 的舊資料（升級前存的）視為過期
    T.store.route = keys.slice();
    delete T.store.routeAt;
    T.saveStore();
    t('沒有時間戳的舊路線視為過期', T.pruneRoute() === true);
}

// ---------------------------------------------------------------- 個人酒單同步
{
    const e = boot();
    section('個人酒單同步');
    const T = e.api;

    t('有上傳按鈕', !!e.$('syncUpBtn'));
    t('有取回按鈕', !!e.$('syncDownBtn'));

    const k = T.barKey(T.BARS[0]);
    T.handleAction('want', k);
    T.handleAction('visited', k);
    T.handleAction('note', k, '私人筆記內容');
    T.handleAction('route', k);
    const d = T.personalData();
    t('包含收藏', !!d.want[k]);
    t('包含已攻略', !!d.visited[k]);
    t('包含筆記', d.visited[k].note === '私人筆記內容');
    t('包含今晚路線', d.route.includes(k));
    t('包含時間戳記', !!d.savedAt);
    t('可序列化為 JSON', (() => { try { JSON.parse(JSON.stringify(d)); return true; } catch (x) { return false; } })());

    // 沒有權杖時不會硬送出
    T.saveGh({ repo: 'Sid-EN/Bar_Hopping', token: '', expiry: '' });
    e.click(e.$('syncUpBtn'));
    t('未設定權杖時擋下上傳', e.$('syncStatus').textContent.includes('權杖'), e.$('syncStatus').textContent);
    e.click(e.$('syncDownBtn'));
    t('未設定權杖時擋下取回', e.$('syncStatus').textContent.includes('權杖'));

    // 介面上有講清楚公開性
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    t('介面明確警告 repo 是公開的', html.includes('這個 repo 是公開的'));
    t('警告有提到筆記會公開', html.includes('寫在筆記裡的內容'));
    t('有指引改用匯出備份', html.includes('匯出／匯入備份'));
}

// ---------------------------------------------------------------- Service Worker 不快取 API
{
    section('Service Worker 快取範圍');
    const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
    t('放行 api.github.com', sw.includes("url.hostname === 'api.github.com'"));
    t('放行帶授權標頭的請求', sw.includes("req.headers.get('Authorization')"));
    t('只快取成功的回應', sw.includes('res.ok'));
    t('版本已更新以清掉舊快取', /VERSION = 'barbible-v[2-9]/.test(sw));
    // api.github.com 的判斷必須在快取邏輯之前
    t('放行判斷在快取之前',
        sw.indexOf("api.github.com") < sw.indexOf('caches.match(req)'));
}

console.log('\n通過 ' + pass + ' 項，失敗 ' + fail + ' 項');
process.exit(fail ? 1 : 0);
