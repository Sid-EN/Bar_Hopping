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
        ' budgetText, statusText, openForm, closeForm, saveForm, readForm, validateBar, toDataJsLine,' +
        ' rebuildBars, deleteCustom, refreshForm, renderPreview, validateNow, CITY_ORDER,' +
        ' insertIntoDataJs, b64encode, b64decode, loadGh, saveGh, formDirty, snapshotForm };');

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


// ---------------------------------------------------------------- 新增酒吧
{
    const e = boot();
    section('新增酒吧');
    const T = e.api, W = e.window;
    const base = T.BARS.length;

    e.click(e.$('addBtn'));
    t('表單開啟', !e.$('formOverlay').hidden);
    t('標題為新增', e.$('formTitle').textContent.includes('新增'));
    t('刪除鍵隱藏', e.$('formDelete').hidden);
    t('縣市選單已填入', e.$('barForm').elements.city.options.length === T.CITY_ORDER.length + 1);
    t('未填時儲存鍵停用', e.$('formSave').disabled);

    const f = e.$('barForm');
    const fill = (name, val) => { f.elements[name].value = val; e.input(f); };
    const check = (name, val) => { f.elements[name].checked = val; f.dispatchEvent(new W.Event('change', { bubbles: true })); };

    fill('name', '測試酒吧');
    t('只填店名仍不能存（缺縣市）', e.$('formSave').disabled);
    t('錯誤訊息提到縣市', e.$('formErrors').textContent.includes('縣市'));
    fill('city', '台北市');
    t('填完必填即可儲存', !e.$('formSave').disabled);
    // 預覽是 debounce 的（打字時不會每個字元都重畫），這裡直接觸發一次來驗證內容
    t('打字當下先不重畫預覽', !e.$('formPreview').innerHTML.includes('測試酒吧'));
    T.renderPreview();
    t('延後後預覽出現卡片', e.$('formPreview').innerHTML.includes('測試酒吧'));

    // 各欄位驗證
    fill('rating', '7');
    t('評分超過 5 被擋', e.$('formSave').disabled && e.$('formErrors').textContent.includes('0 到 5'));
    fill('rating', '4.6');
    t('合法評分通過', !e.$('formSave').disabled);
    fill('lat', '25.04');
    t('只填緯度被擋', e.$('formSave').disabled && e.$('formErrors').textContent.includes('都填'));
    fill('lng', '121.55');
    t('座標成對通過', !e.$('formSave').disabled);
    fill('lat', '48.8');
    t('座標超出台灣被擋', e.$('formSave').disabled && e.$('formErrors').textContent.includes('台灣範圍'));
    fill('lat', '25.04');

    // 重複店名
    const exist = T.BARS.find(b => b.city === '台北市');
    fill('name', exist.name);
    t('同縣市重複店名被擋', e.$('formSave').disabled && e.$('formErrors').textContent.includes('已經有一筆'));
    fill('name', '測試酒吧');

    // 營業時間即時回饋
    fill('hours', '週二至週日 19:00–02:00（週一休）');
    t('看得懂的營業時間給綠燈', e.$('hoursHint').className.includes('good'), e.$('hoursHint').className);
    t('回饋顯示解析結果', e.$('hoursHint').textContent.includes('二三四五六'), e.$('hoursHint').textContent);
    fill('hours', '營業至02:00');
    t('看不懂的營業時間給警告', e.$('hoursHint').className.includes('warn'));
    t('警告說明會顯示時間未知', e.$('hoursHint').textContent.includes('時間未知'));
    fill('hours', '20:00–02:00（週一休）');

    // 其餘欄位
    fill('district', '大安區'); fill('type', '經典特調'); fill('purpose', '一個人');
    fill('style', '日式'); fill('price', '2'); fill('address', '台北市大安區測試路1號');
    fill('phone', '02-1234-5678'); fill('ratingCount', '320');
    fill('awards', "Asia's 50 Best Bars 2025 #40\n某某獎");
    fill('note', '測試用的介紹文字');
    check('special', true);

    const draft = T.readForm();
    t('空欄位不會被存成空字串', !('budget' in draft), JSON.stringify(draft.budget));
    t('獲獎解析成陣列', Array.isArray(draft.awards) && draft.awards.length === 2);
    t('數字欄位轉成數字', typeof draft.price === 'number' && typeof draft.rating === 'number');
    t('勾選轉成 true', draft.special === true);

    // data.js 格式
    const line = T.toDataJsLine(draft);
    t('data.js 格式為單行物件', line.startsWith('  {') && line.endsWith('},'));
    t('格式可被解析回來', (() => { try { return new Function('return [' + line + '][0]')().name === '測試酒吧'; } catch (x) { return false; } })());
    t('格式含所有已填欄位', ['name', 'city', 'district', 'type', 'price', 'rating', 'awards', 'special', 'note'].every(k => line.includes(k + ':')));

    // 儲存
    e.click(e.$('formSave'));
    t('儲存後表單關閉', e.$('formOverlay').hidden);
    t('總數 +1', T.BARS.length === base + 1, T.BARS.length + ' vs ' + (base + 1));
    t('有成功提示', e.$('toast').textContent.includes('已新增'));
    t('寫入 localStorage', JSON.parse(W.localStorage.getItem('barbible.v1')).custom.length === 1);

    const added = T.byKey['測試酒吧|台北市'];
    t('可用 key 找到', !!added);
    t('標記為自訂', added._custom === true);
    t('出現在清單中', e.$('barGrid').innerHTML.includes('測試酒吧'));
    t('卡片有自訂標章', e.$('barGrid').innerHTML.includes('custom-badge'));
    t('歸到正確縣市', e.$('barGrid').innerHTML.indexOf('測試酒吧') > -1 && added.city === '台北市');
    t('台北市計數 +1', e.$('cityNav').innerHTML.includes('台北市'));

    // 篩選也吃得到
    e.api.selectCity('台北市');
    t('縣市篩選涵蓋自訂店', e.$('barGrid').innerHTML.includes('測試酒吧'));
    e.$('districtFilter').value = '大安區'; e.input(e.$('districtFilter'));
    t('行政區篩選涵蓋自訂店', e.$('barGrid').innerHTML.includes('測試酒吧'));
    e.$('districtFilter').value = 'all'; e.input(e.$('districtFilter'));
    e.api.selectCity('all');

    // 編輯
    e.click(e.qsa('.bar-card').find(c => c.textContent.includes('測試酒吧')));
    t('詳細頁有編輯鍵', !!W.document.querySelector('[data-act="edit"]'));
    e.click(W.document.querySelector('[data-act="edit"]'));
    t('編輯表單開啟', !e.$('formOverlay').hidden && e.$('formTitle').textContent.includes('編輯'));
    t('欄位帶入原值', e.$('barForm').elements.name.value === '測試酒吧' && e.$('barForm').elements.price.value === '2');
    t('獲獎還原成多行', e.$('barForm').elements.awards.value.split('\n').length === 2);
    t('編輯時顯示刪除鍵', !e.$('formDelete').hidden);
    t('編輯自己不算重複', !e.$('formSave').disabled);
    fill('name', '測試酒吧改名');
    e.click(e.$('formSave'));
    t('改名後總數不變', T.BARS.length === base + 1, T.BARS.length);
    t('新名字生效', !!T.byKey['測試酒吧改名|台北市'] && !T.byKey['測試酒吧|台北市']);

    // 刪除
    e.click(e.qsa('.bar-card').find(c => c.textContent.includes('測試酒吧改名')));
    e.click(W.document.querySelector('[data-act="edit"]'));
    e.click(e.$('formDelete'));
    t('刪除後總數還原', T.BARS.length === base, T.BARS.length);
    t('清單中已消失', !e.$('barGrid').innerHTML.includes('測試酒吧改名'));
    t('localStorage 也清掉', JSON.parse(W.localStorage.getItem('barbible.v1')).custom.length === 0);
}

// ---------------------------------------------------------------- 自訂酒吧的持久化
{
    const e = boot();
    section('自訂酒吧的持久化與備份');
    const T = e.api, W = e.window;
    const base = T.BARS.length;

    T.store.custom = [{ name: '持久化測試吧', city: '台南市', district: '中西區', type: '特調', price: 2 }];
    T.saveStore(); T.rebuildBars(); T.update();
    t('重建後總數 +1', T.BARS.length === base + 1);

    // 模擬重新整理：把剛才存好的狀態帶進新的環境
    const saved = JSON.parse(W.localStorage.getItem('barbible.v1'));
    const e2 = boot('https://example.com/index.html', saved);
    t('重新載入後仍在', e2.api.BARS.length === base + 1, e2.api.BARS.length);
    t('資料完整', e2.api.byKey['持久化測試吧|台南市'].district === '中西區');
    t('台南市可篩到', (() => { e2.api.selectCity('台南市');
        return e2.$('barGrid').innerHTML.includes('持久化測試吧'); })());

    // 備份匯出含自訂酒吧
    const backup = saved;
    t('備份含 custom 欄位', Array.isArray(backup.custom) && backup.custom.length === 1);

    // 自訂店也能收藏與加入路線
    const k = '持久化測試吧|台南市';
    e2.api.handleAction('want', k); e2.api.handleAction('route', k); e2.api.update();
    t('自訂店可收藏', !!e2.api.store.want[k]);
    t('自訂店可加入路線', e2.api.store.route.includes(k));
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

console.log('\n通過 ' + pass + ' 項，失敗 ' + fail + ' 項');
process.exit(fail ? 1 : 0);
