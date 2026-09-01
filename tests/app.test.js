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
function boot(url = 'https://example.com/index.html') {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
        .replace(/<script src="https:\/\/cdnjs[^"]*"><\/script>/g, '')   // 離線測試，不載 CDN
        .replace(/<link rel="stylesheet" href="https:\/\/cdnjs[^"]*">/g, '');
    const dom = new JSDOM(html, { runScripts: 'outside-only', url });
    const { window } = dom;
    window.alert = m => { window.__alert = m; };
    window.prompt = (a, b) => b;

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

    // 真實瀏覽器中多個 <script> 共用頂層作用域，所以合併成一次 eval
    window.eval(
        fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8') + '\n' +
        fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8') + '\n' +
        ';window.__t = { BARS, PRICE_TIERS, hasGeo, hasAward, isFriend, barKey, byKey, store, saveStore,' +
        ' handleAction, update, renderRoute, renderList, openList, selectCity, stateToUrl, autoSortRoute,' +
        ' parseHours, openState, selectedTypes, selectedTraits, distanceKm };');

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

console.log('\n通過 ' + pass + ' 項，失敗 ' + fail + ' 項');
process.exit(fail ? 1 : 0);
