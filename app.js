// =============================================================
// TAIWAN BAR BIBLE — 應用邏輯
// 資料在 data.js（BARS / PRICE_TIERS），畫面骨架在 index.html
// =============================================================

// ===== 縣市分區設定（依此順序呈現頁籤；資料中沒有的縣市自動隱藏）=====
const REGIONS = [
    { label: '北部', cities: ['台北市', '新北市', '基隆市', '桃園市', '新竹市', '新竹縣'] },
    { label: '中部', cities: ['苗栗縣', '台中市', '彰化縣', '南投縣', '雲林縣'] },
    { label: '南部', cities: ['嘉義市', '嘉義縣', '台南市', '高雄市', '屏東縣'] },
    { label: '東部離島', cities: ['宜蘭縣', '花蓮縣', '台東縣', '澎湖縣', '金門縣', '連江縣'] }
];
const MAX_ROUTE = 8;                       // 一晚最多排幾攤

// ===== 營業時間解析 =====
// 把中文營業時間字串解析成每週七天的時段。解析不出來一律回 null（顯示「時間未知」），
// 寧可不判斷，也不要誤報「還在營業」害人白跑一趟。
const DAY_CH = { '日': 0, '天': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6 };

function parseDays(spec) {
    const s = spec.replace(/週|星期|禮拜/g, '');
    const days = [];
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (!(c in DAY_CH)) continue;
        if (s[i + 1] === '至' && s[i + 2] in DAY_CH) {
            const a = DAY_CH[c], b = DAY_CH[s[i + 2]];
            for (let d = a; ; d = (d + 1) % 7) { days.push(d); if (d === b) break; }
            i += 2;
        } else days.push(DAY_CH[c]);
    }
    return [...new Set(days)];
}

const toMin = (h, m) => Number(h) * 60 + Number(m);

function parseHours(str) {
    if (!str) return null;
    const t = str.replace(/[–—〜~－]/g, '-').replace(/：/g, ':').replace(/\s+/g, ' ').trim();

    const notes = [];
    const main = t.replace(/[（(]([^）)]*)[)）]/g, (_, g) => { notes.push(g); return ' '; }).trim();

    const segs = main.split(/[、；;]/).map(s => s.trim()).filter(Boolean);
    const schedule = {};
    let lastOpen = null, parsedAny = false;

    for (const seg of segs) {
        const dayMatch = seg.match(/^(?:約\s*)?((?:(?:週|星期|禮拜)[一二三四五六日天至、]+)+)/);
        const days = dayMatch ? parseDays(dayMatch[1]) : [0, 1, 2, 3, 4, 5, 6];
        if (!days.length) continue;

        const range = seg.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
        const onlyClose = seg.match(/至\s*(\d{1,2}):(\d{2})/);
        let open, close;
        if (range) { open = toMin(range[1], range[2]); close = toMin(range[3], range[4]); lastOpen = open; }
        else if (onlyClose && lastOpen !== null) { open = lastOpen; close = toMin(onlyClose[1], onlyClose[2]); }
        else continue;

        if (close <= open) close += 1440;              // 跨夜
        if (close === 0) close = 1440;
        for (const d of days) schedule[d] = { open, close };
        parsedAny = true;
    }
    if (!parsedAny) return null;

    let irregular = false;
    for (const note of notes) {
        if (/不定休|依.*公告|季節|預約制/.test(note)) irregular = true;
        const ov = note.match(/((?:週|星期)?[一二三四五六日天、至]+?)至\s*(\d{1,2}):(\d{2})/);
        if (ov) {
            for (const d of parseDays(ov[1])) if (schedule[d]) {
                let c = toMin(ov[2], ov[3]);
                if (c <= schedule[d].open) c += 1440;
                schedule[d] = { open: schedule[d].open, close: c };
            }
        }
        for (const m of note.matchAll(/((?:週|星期)?[一二三四五六日天、至]+?)\s*(?:公休|店休|休息|休)(?![息])/g)) {
            for (const d of parseDays(m[1])) delete schedule[d];
        }
    }
    for (const m of main.matchAll(/((?:週|星期)[一二三四五六日天、至]+?)\s*(?:公休|店休|休)(?![息])/g)) {
        for (const d of parseDays(m[1])) delete schedule[d];
    }

    if (!Object.keys(schedule).length) return null;
    return { schedule, irregular, approx: /約/.test(str) };
}

// 目前營業狀態：open / closed / unknown
function openState(bar, now) {
    const p = parseHours(bar.hours);
    if (!p) return { state: 'unknown' };
    const day = now.getDay(), mins = now.getHours() * 60 + now.getMinutes();
    // 檢查今天的場次，以及昨天跨夜延續到現在的場次
    for (const [d, offset] of [[day, 0], [(day + 6) % 7, 1440]]) {
        const s = p.schedule[d];
        if (!s) continue;
        const cur = mins + offset;
        if (cur >= s.open && cur < s.close) return { state: 'open', closesIn: s.close - cur, ...p };
    }
    const today = p.schedule[day];
    if (today && mins < today.open) return { state: 'closed', opensIn: today.open - mins, ...p };
    return { state: 'closed', ...p };
}

function openPill(bar, now) {
    const r = openState(bar, now);
    if (r.state === 'unknown') return '<span class="open-pill unknown">❔ 時間未知</span>';
    if (r.state === 'open') {
        const h = Math.floor(r.closesIn / 60), m = r.closesIn % 60;
        const left = h >= 1 ? `${h} 小時${m ? m + ' 分' : ''}` : `${m} 分`;
        const cls = r.closesIn <= 60 ? 'soon' : 'open';
        return `<span class="open-pill ${cls}">${r.closesIn <= 60 ? '⏰' : '🟢'} 營業中${r.approx ? '（時間約略）' : ''}・還有 ${left}</span>`;
    }
    if (r.opensIn !== undefined) {
        const h = Math.floor(r.opensIn / 60), m = r.opensIn % 60;
        return `<span class="open-pill closed">🔴 未營業・${h ? h + ' 小時' : ''}${m ? m + ' 分' : ''}後開</span>`;
    }
    return '<span class="open-pill closed">🔴 今日已打烊</span>';
}

// ===== 收藏、打卡、路線（存在瀏覽器本機）=====
const STORE_KEY = 'barbible.v1';
const barKey = b => `${b.name}|${b.city}`;

function loadStore() {
    try {
        const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
        return { want: raw.want || {}, visited: raw.visited || {}, route: Array.isArray(raw.route) ? raw.route : [] };
    } catch (e) { return { want: {}, visited: {}, route: [] }; }
}
function saveStore() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* 無痕模式等情況，忽略 */ }
}
let store = loadStore();

const isWant = b => !!store.want[barKey(b)];
const isVisited = b => !!store.visited[barKey(b)];
const myRating = b => (store.visited[barKey(b)] || {}).rating || 0;
const inRoute = b => store.route.includes(barKey(b));

// ===== 共用小工具 =====
const grid = document.getElementById('barGrid');
const countDisplay = document.getElementById('resultCount');
const districtSelect = document.getElementById('districtFilter');
const overlay = document.getElementById('modalOverlay');
const modalContent = document.getElementById('modalContent');
const $ = id => document.getElementById(id);

BARS.forEach((b, i) => { b._id = i; });
const byKey = {};
BARS.forEach(b => { byKey[barKey(b)] = b; });

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const isFriend = b => b.friend || (b.note || '').includes('脆友推薦');
const hasAward = b => Array.isArray(b.awards) && b.awards.length > 0;
const cityCount = city => BARS.filter(b => b.city === city).length;
const mapQuery = b => encodeURIComponent(b.address || `${b.name} ${b.city}${b.district || ''}`);
const hasGeo = b => typeof b.lat === 'number' && typeof b.lng === 'number';

const priceSymbol = b => b.price
    ? ` <span class="price">${'$'.repeat(b.price)}<span class="off">${'$'.repeat(3 - b.price)}</span></span>` : '';
const budgetText = b => b.budget || (b.price && PRICE_TIERS[b.price] ? PRICE_TIERS[b.price].range : '');

const STATUS_TEXT = { CLOSED_PERMANENTLY: '已永久歇業', CLOSED_TEMPORARILY: '暫停營業' };
const statusText = b => (b.status && STATUS_TEXT[b.status]) || '';

function ratingHtml(b, big) {
    if (!b.rating) return '';
    const pct = Math.max(0, Math.min(100, b.rating / 5 * 100)).toFixed(1);
    return `<span class="rating-row"${big ? ' style="font-size:1rem"' : ''}>` +
           `<span class="stars" title="${b.rating} / 5"><span class="stars-fill" style="width:${pct}%"></span></span>` +
           `<span class="rating-num">${b.rating}</span>` +
           (b.ratingCount ? `<span class="rating-count">(${b.ratingCount.toLocaleString()} 則評論)</span>` : '') +
           `</span>`;
}

// 兩點間直線距離（公里）
function distanceKm(a, b) {
    const R = 6371, rad = d => d * Math.PI / 180;
    const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
}

// ===== 縣市頁籤 =====
let currentCity = 'all';

function renderCityNav() {
    let html = `<div class="region-row"><div class="region-label">全台</div><div class="city-tabs">` +
        `<button class="city-tab ${currentCity === 'all' ? 'active' : ''}" data-city="all">全部酒吧<span class="cnt">${BARS.length}</span></button></div></div>`;
    for (const region of REGIONS) {
        const cities = region.cities.filter(c => cityCount(c) > 0);
        if (!cities.length) continue;
        html += `<div class="region-row"><div class="region-label">${region.label}</div><div class="city-tabs">` +
            cities.map(c => `<button class="city-tab ${currentCity === c ? 'active' : ''}" data-city="${c}">${c}<span class="cnt">${cityCount(c)}</span></button>`).join('') +
            `</div></div>`;
    }
    const nav = $('cityNav');
    nav.innerHTML = html;
    nav.querySelectorAll('.city-tab').forEach(btn => btn.addEventListener('click', () => selectCity(btn.dataset.city)));
}

function selectCity(city) {
    currentCity = city;
    renderCityNav();
    updateDistrictOptions();
    update();
}

function updateDistrictOptions() {
    const pool = currentCity === 'all' ? BARS : BARS.filter(b => b.city === currentCity);
    const districts = [...new Set(pool.map(b => b.district).filter(Boolean))];
    districtSelect.innerHTML = '<option value="all">所有行政區</option>' +
        districts.map(d => `<option value="${d}">${d}</option>`).join('');
}

// ===== 排序 =====
function sortBars(list, mode) {
    const arr = list.slice();
    if (mode === 'award') {
        const score = b => (hasAward(b) ? 4 : 0) + (b.special ? 2 : 0) + (isFriend(b) ? 1 : 0);
        arr.sort((a, b) => score(b) - score(a) || a._id - b._id);
    } else if (mode === 'rating') {
        arr.sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.ratingCount || 0) - (a.ratingCount || 0) || a._id - b._id);
    } else if (mode === 'price-asc') {
        arr.sort((a, b) => (a.price || 99) - (b.price || 99) || a._id - b._id);
    } else if (mode === 'name') {
        arr.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
    }
    return arr;
}

// ===== 卡片 =====
function renderCard(b, now) {
    const badges = [];
    if (statusText(b)) badges.push(`<span class="status-badge">⚠️ ${statusText(b)}</span>`);
    if (b.special) badges.push('<span class="special-badge">⭐ 私心推薦</span>');
    if (hasAward(b)) badges.push('<span class="award-badge">🏆 獲獎名店</span>');

    const infoParts = [b.city + (b.district ? ' ' + b.district : ''), b.type, b.style].filter(Boolean);

    const tags = (b.purpose || '').split('或').filter(Boolean).map(t => `<span class="tag">${t.trim()}</span>`);
    const note = b.note || '';
    if (note.includes('日本調酒師')) tags.push('<span class="tag tag-highlight">🇯🇵 日本調酒師</span>');
    if (note.includes('茶') || (b.style || '').includes('茶')) tags.push('<span class="tag">🍵 茶酒</span>');
    if (isFriend(b)) tags.push('<span class="tag tag-friend">🧡 脆友推薦</span>');
    if (hasAward(b)) tags.push(...b.awards.map(a => `<span class="tag tag-award">🏆 ${esc(a)}</span>`));

    const details = [`<span>${openPill(b, now)}</span>`];
    if (b.rating) details.push(ratingHtml(b));
    if (budgetText(b)) details.push(`<span>💰 人均 <span class="budget">${esc(budgetText(b))}</span></span>`);
    if (b.hours) details.push(`<span>🕘 ${esc(b.hours)}</span>`);
    if (b.address) details.push(`<span>📍 ${esc(b.address)}</span>`);
    if (b.phone) details.push(`<span>☎️ ${esc(b.phone)}</span>`);
    if (myRating(b)) details.push(`<span class="my-rating">我的評分 ${'★'.repeat(myRating(b))}${'☆'.repeat(5 - myRating(b))}</span>`);

    const k = esc(barKey(b));
    return `
        <div class="bar-card${statusText(b) ? ' is-closed' : ''}${inRoute(b) ? ' in-route' : ''}" data-id="${b._id}" tabindex="0" role="button" aria-label="查看 ${esc(b.name)} 詳細資訊">
            ${badges.length ? `<div class="badge-row">${badges.join('')}</div>` : ''}
            <div class="bar-name">${esc(b.name)}</div>
            <div class="bar-info">${infoParts.map(esc).join(' | ')}${priceSymbol(b)}</div>
            <div class="bar-tags">${tags.join('')}</div>
            ${note ? `<div class="bar-note">${esc(note)}</div>` : '<div class="bar-note" style="border:none;padding:0;"></div>'}
            <div class="bar-details">${details.join('')}</div>
            <div class="bar-actions">
                <button class="icon-btn ${isWant(b) ? 'on-want' : ''}" data-act="want" data-key="${k}" title="${isWant(b) ? '移除收藏' : '加入收藏'}" aria-label="收藏">${isWant(b) ? '❤️' : '🤍'}</button>
                <button class="icon-btn ${isVisited(b) ? 'on-visited' : ''}" data-act="visited" data-key="${k}" title="${isVisited(b) ? '取消已喝過' : '標記已喝過'}" aria-label="已喝過">✓</button>
                <button class="icon-btn ${inRoute(b) ? 'on-route' : ''}" data-act="route" data-key="${k}" title="${inRoute(b) ? '從今晚路線移除' : '加入今晚路線'}" aria-label="加入路線">🍺</button>
                <a class="btn btn-ghost" href="https://www.google.com/maps/search/?api=1&query=${mapQuery(b)}" target="_blank" rel="noopener">🗺️ 導航</a>
            </div>
        </div>`;
}

// ===== 詳細頁 =====
let currentDetailId = null;

function openDetail(id) {
    const b = BARS[id];
    if (!b) return;
    currentDetailId = id;
    const now = new Date();

    const meta = [b.city + (b.district ? ' ' + b.district : ''), b.type, b.style].filter(Boolean).map(esc).join('｜');

    const rows = [];
    rows.push(['目前狀態', openPill(b, now)]);
    if (b.rating) rows.push(['Google 評分', ratingHtml(b, true)]);
    if (budgetText(b)) rows.push(['人均消費', `<span class="budget">${esc(budgetText(b))}</span>${b.budget ? '' : '　<span style="color:#777;font-size:0.85em">(依價位級距估算)</span>'}`]);
    if (b.hours) rows.push(['營業時間', esc(b.hours)]);
    if (b.address) rows.push(['地址', esc(b.address)]);
    if (b.phone) rows.push(['電話', `<a href="tel:${esc(b.phone.replace(/[^0-9+]/g, ''))}" style="color:#ccc">${esc(b.phone)}</a>`]);
    if (b.purpose) rows.push(['適合場合', esc(b.purpose)]);

    const tags = [];
    if (statusText(b)) tags.push(`<span class="status-badge">⚠️ ${statusText(b)}</span>`);
    if (b.special) tags.push('<span class="special-badge">⭐ 私心推薦</span>');
    if (isFriend(b)) tags.push('<span class="tag tag-friend">🧡 脆友推薦</span>');
    if ((b.note || '').includes('日本調酒師')) tags.push('<span class="tag tag-highlight">🇯🇵 日本調酒師</span>');

    const k = esc(barKey(b));
    const mine = myRating(b);
    const rateStars = [1, 2, 3, 4, 5].map(n =>
        `<button data-act="rate" data-key="${k}" data-n="${n}" class="${n <= mine ? 'lit' : ''}" aria-label="給 ${n} 星">★</button>`).join('');

    modalContent.innerHTML = `
        <h2 class="modal-title" id="modalTitle">${esc(b.name)}</h2>
        <div class="modal-meta">${meta}${b.price ? '　' + priceSymbol(b).trim() : ''}</div>
        ${tags.length ? `<div class="bar-tags">${tags.join('')}</div>` : ''}
        ${b.note ? `<div class="modal-note">${esc(b.note)}</div>` : ''}
        ${hasAward(b) ? `<ul class="modal-awards">${b.awards.map(a => `<li>🏆 ${esc(a)}</li>`).join('')}</ul>` : ''}
        <dl class="modal-rows">${rows.map(([kk, v]) => `<dt>${kk}</dt><dd>${v}</dd>`).join('')}</dl>

        <div class="my-rate-row">
            <button class="icon-btn ${isWant(b) ? 'on-want' : ''}" data-act="want" data-key="${k}">${isWant(b) ? '❤️' : '🤍'}</button>
            <button class="icon-btn ${isVisited(b) ? 'on-visited' : ''}" data-act="visited" data-key="${k}">✓</button>
            <button class="icon-btn ${inRoute(b) ? 'on-route' : ''}" data-act="route" data-key="${k}">🍺</button>
            <span style="color:var(--muted);font-size:0.85rem">我的評分</span>
            <span class="rate-stars">${rateStars}</span>
            ${mine ? `<button class="btn btn-ghost" data-act="unrate" data-key="${k}" style="font-size:0.72rem;padding:3px 10px">清除</button>` : ''}
        </div>

        <div class="modal-section-label">地圖位置</div>
        <iframe class="modal-map" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
                title="${esc(b.name)} 地圖" src="https://maps.google.com/maps?q=${mapQuery(b)}&z=16&output=embed"></iframe>
        <div class="modal-actions">
            <a class="btn" href="https://www.google.com/maps/search/?api=1&query=${mapQuery(b)}" target="_blank" rel="noopener">🗺️ 在 Google Maps 開啟</a>
            ${b.phone ? `<a class="btn btn-ghost" href="tel:${esc(b.phone.replace(/[^0-9+]/g, ''))}">☎️ 撥打電話</a>` : ''}
        </div>`;

    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    $('modalClose').focus();
}

function closeDetail() {
    overlay.hidden = true;
    modalContent.innerHTML = '';        // 停掉 iframe 載入
    document.body.style.overflow = '';
    currentDetailId = null;
}

// ===== 收藏 / 打卡 / 路線的操作 =====
function handleAction(act, key, n) {
    const b = byKey[key];
    if (!b) return false;
    if (act === 'want') {
        store.want[key] ? delete store.want[key] : (store.want[key] = true);
    } else if (act === 'visited') {
        if (store.visited[key]) delete store.visited[key];
        else store.visited[key] = { rating: 0, date: new Date().toISOString().slice(0, 10) };
    } else if (act === 'route') {
        const i = store.route.indexOf(key);
        if (i >= 0) store.route.splice(i, 1);
        else if (store.route.length >= MAX_ROUTE) { alert(`一晚排 ${MAX_ROUTE} 攤已經很拚了，先移除幾間再加吧 🍻`); return false; }
        else store.route.push(key);
    } else if (act === 'rate') {
        store.visited[key] = { ...(store.visited[key] || {}), rating: Number(n), date: (store.visited[key] || {}).date || new Date().toISOString().slice(0, 10) };
    } else if (act === 'unrate') {
        if (store.visited[key]) store.visited[key].rating = 0;
    } else return false;
    saveStore();
    return true;
}

// ===== 今晚路線 =====
// 有座標就用最近鄰排序（從第一間出發，每次挑最近的下一間），沒座標就維持加入順序。
function orderedRoute() {
    const bars = store.route.map(k => byKey[k]).filter(Boolean);
    if (bars.length < 3 || !bars.every(hasGeo)) return bars;
    const rest = bars.slice(1), path = [bars[0]];
    while (rest.length) {
        const last = path[path.length - 1];
        let bi = 0, bd = Infinity;
        rest.forEach((b, i) => { const d = distanceKm(last, b); if (d < bd) { bd = d; bi = i; } });
        path.push(rest.splice(bi, 1)[0]);
    }
    return path;
}

function renderRoute() {
    const bar = $('routeBar');
    const bars = orderedRoute();
    if (!bars.length) { bar.hidden = true; return; }
    bar.hidden = false;

    $('routeChips').innerHTML = bars.map((b, i) =>
        `<span class="route-chip"><span class="seq">${i + 1}</span>${esc(b.name)}` +
        `<button data-act="route" data-key="${esc(barKey(b))}" title="移除" aria-label="移除">&times;</button></span>`).join('');

    let dist = 0, allGeo = bars.every(hasGeo);
    if (allGeo) for (let i = 1; i < bars.length; i++) dist += distanceKm(bars[i - 1], bars[i]);
    $('routeDist').textContent = bars.length < 2 ? '再加幾間吧'
        : allGeo ? `共 ${bars.length} 攤・步行約 ${dist.toFixed(1)} km`
        : `共 ${bars.length} 攤（部分店家無座標，順序未最佳化）`;

    const pt = b => hasGeo(b) ? `${b.lat},${b.lng}` : `${b.name} ${b.city}${b.district || ''}`;
    const go = $('routeGo');
    if (bars.length < 2) {
        go.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pt(bars[0]))}`;
    } else {
        const mid = bars.slice(1, -1).map(pt).join('|');
        go.href = 'https://www.google.com/maps/dir/?api=1' +
            `&origin=${encodeURIComponent(pt(bars[0]))}` +
            `&destination=${encodeURIComponent(pt(bars[bars.length - 1]))}` +
            (mid ? `&waypoints=${encodeURIComponent(mid)}` : '') +
            '&travelmode=walking';
    }
}

// ===== 地圖模式 =====
let map = null, markerLayer = null, mapReady = false;

function markerColor(b) {
    if (isVisited(b)) return '#5ac77f';
    if (isWant(b)) return '#ff6b8a';
    if (hasAward(b)) return '#b388ff';
    if (b.special) return '#d4af37';
    return '#8a8a8a';
}

function initMap() {
    if (mapReady || typeof L === 'undefined') return;
    map = L.map('map', { scrollWheelZoom: true }).setView([23.7, 121.0], 8);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO', subdomains: 'abcd', maxZoom: 19
    }).addTo(map);
    markerLayer = L.layerGroup().addTo(map);
    mapReady = true;
}

function renderMap(bars) {
    if (!mapReady) return;
    markerLayer.clearLayers();
    const geo = bars.filter(hasGeo);
    const pts = [];
    for (const b of geo) {
        const m = L.circleMarker([b.lat, b.lng], {
            radius: hasAward(b) || b.special ? 8 : 6,
            color: '#111', weight: 1, fillColor: markerColor(b), fillOpacity: 0.92
        });
        m.bindPopup(
            `<div class="popup-name">${esc(b.name)}</div>` +
            `<div class="popup-meta">${esc(b.city + (b.district ? ' ' + b.district : ''))}${b.type ? '｜' + esc(b.type) : ''}` +
            (b.rating ? `　★ ${b.rating}` : '') + `</div>` +
            `<button class="btn" data-act="detail" data-id="${b._id}">看詳細資訊</button>`);
        m.addTo(markerLayer);
        pts.push([b.lat, b.lng]);
    }
    if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 15 });
    const missing = bars.length - geo.length;
    $('mapNote').textContent = missing
        ? `地圖上顯示 ${geo.length} 間；另有 ${missing} 間尚無座標（可執行 node tools/geocode.js 補上）`
        : `地圖上顯示 ${geo.length} 間`;
}

let currentView = 'list';
function setView(v) {
    currentView = v;
    $('viewList').classList.toggle('active', v === 'list');
    $('viewMap').classList.toggle('active', v === 'map');
    grid.style.display = v === 'list' ? '' : 'none';
    $('mapView').classList.toggle('active', v === 'map');
    if (v === 'map') {
        initMap();
        if (mapReady) { map.invalidateSize(); renderMap(lastFiltered); }
        else $('mapNote').textContent = '地圖元件載入失敗（可能是離線）。請確認網路後重新整理。';
    }
}

// ===== 篩選與渲染 =====
let lastFiltered = [];

function update() {
    const now = new Date();
    const d = districtSelect.value;
    const p = $('purposeFilter').value;
    const t = $('typeFilter').value;
    const pr = $('priceFilter').value;
    const st = $('stateFilter').value;
    const sort = $('sortFilter').value;
    const q = $('searchInput').value.trim().toLowerCase();

    const filtered = BARS.filter(b => {
        const note = b.note || '';
        const matchCity = currentCity === 'all' || b.city === currentCity;
        const matchDistrict = d === 'all' || b.district === d;
        const matchPurpose = p === 'all' || (b.purpose || '').includes(p) || (p === '約會' && note.includes('約會'));
        const matchType = t === 'all' ||
            (t === '日本調酒師' && note.includes('日本調酒師')) ||
            (t === '下午' && note.includes('下午')) ||
            (t === '便宜' && (note.includes('便宜') || b.price === 1)) ||
            (t === '獲獎' && hasAward(b)) ||
            (t === '脆友' && isFriend(b)) ||
            (b.type || '').includes(t);
        const matchPrice = pr === 'all' || b.price === Number(pr);
        const matchState = st === 'all' ||
            (st === 'open' && openState(b, now).state === 'open') ||
            (st === 'want' && isWant(b)) ||
            (st === 'visited' && isVisited(b)) ||
            (st === 'unvisited' && !isVisited(b));
        const haystack = [b.name, note, b.city, b.district, b.style, ...(b.awards || [])].filter(Boolean).join(' ').toLowerCase();
        const matchSearch = !q || haystack.includes(q);
        return matchCity && matchDistrict && matchPurpose && matchType && matchPrice && matchState && matchSearch;
    });

    const sorted = sortBars(filtered, sort);
    lastFiltered = sorted;

    const scope = currentCity === 'all' ? '全台' : currentCity;
    countDisplay.textContent = `${scope}｜搜尋到 ${sorted.length} 間適合的酒吧`;
    grid.innerHTML = sorted.length
        ? sorted.map(b => renderCard(b, now)).join('')
        : '<div class="empty">找不到符合條件的酒吧，換個條件試試 🍸</div>';

    // 進度條
    const visitedCount = BARS.filter(isVisited).length;
    $('progressText').textContent = `${visitedCount} / ${BARS.length} 間`;
    $('progressFill').style.width = (visitedCount / BARS.length * 100).toFixed(1) + '%';

    renderRoute();
    if (currentView === 'map' && mapReady) renderMap(sorted);
}

// ===== 事件 =====
// 卡片、詳細頁、路線列共用同一套 data-act 處理
function onActionClick(e) {
    const btn = e.target.closest('[data-act]');
    if (!btn) return false;
    e.stopPropagation();
    const act = btn.dataset.act;
    if (act === 'detail') { closeDetail(); openDetail(Number(btn.dataset.id)); return true; }
    if (!handleAction(act, btn.dataset.key, btn.dataset.n)) return true;
    update();
    if (currentDetailId !== null && !overlay.hidden) openDetail(currentDetailId);   // 詳細頁開著就同步刷新
    return true;
}

grid.addEventListener('click', e => {
    if (onActionClick(e)) return;
    if (e.target.closest('a')) return;                 // 導航連結不觸發詳細頁
    const card = e.target.closest('.bar-card');
    if (card) openDetail(Number(card.dataset.id));
});
grid.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.bar-card');
    if (card && !e.target.closest('[data-act]')) { e.preventDefault(); openDetail(Number(card.dataset.id)); }
});
modalContent.addEventListener('click', onActionClick);
$('routeChips').addEventListener('click', onActionClick);
document.getElementById('map').addEventListener('click', onActionClick);

$('modalClose').addEventListener('click', closeDetail);
overlay.addEventListener('click', e => { if (e.target === overlay) closeDetail(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) closeDetail(); });

$('routeClear').addEventListener('click', () => { store.route = []; saveStore(); update(); });
$('viewList').addEventListener('click', () => setView('list'));
$('viewMap').addEventListener('click', () => setView('map'));

// ===== 啟動 =====
$('subtitle').textContent = `全台 ${BARS.length} 間酒友、脆友、老酒鬼推薦清單`;
renderCityNav();
updateDistrictOptions();
document.querySelectorAll('select, input').forEach(el => el.addEventListener('input', update));
update();
setInterval(update, 60000);        // 每分鐘更新一次營業狀態
