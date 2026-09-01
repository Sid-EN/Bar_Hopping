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

// 酒類標籤：可複選，符合其中任一種即列入
const TYPE_TAGS = [
    { id: '經典', label: '經典調酒' },
    { id: '特調', label: '創意特調' },
    { id: '啤酒', label: '啤酒' }
];

// 亮點標籤：可複選，必須全部符合（用來逐步收斂）
const TRAIT_TAGS = [
    { id: 'award',   label: '🏆 獲獎名店', test: b => hasAward(b) },
    { id: 'special', label: '⭐ 私心推薦', test: b => !!b.special },
    { id: 'friend',  label: '🧡 脆友推薦', test: b => isFriend(b) },
    { id: 'jp',      label: '🇯🇵 日本調酒師', test: b => (b.note || '').includes('日本調酒師') },
    { id: 'tea',     label: '🍵 茶酒', test: b => (b.note || '').includes('茶') || (b.style || '').includes('茶') },
    { id: 'daytime', label: '🕐 下午開喝', test: b => (b.note || '').includes('下午') || opensBefore(b, 17 * 60) },
    { id: 'cheap',   label: '💸 高 CP 值', test: b => b.price === 1 || (b.note || '').includes('便宜') },
    { id: 'late',    label: '🌃 營業到 3 點後', test: b => closesAfter(b, 27 * 60) }
];

let selectedTypes = new Set();
let selectedTraits = new Set();

// ===== 營業時間解析 =====
// 把中文營業時間字串解析成每週七天的時段。解析不出來一律回 null（顯示「時間未知」），
// 寧可不判斷，也不要誤報「還在營業」害人白跑一趟。
const DAY_CH = { '日': 0, '天': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6 };

function parseDays(spec) {
    const s = spec.replace(/週|周|星期|禮拜/g, '');
    const days = [];
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (!(c in DAY_CH)) continue;
        if ((s[i + 1] === '至' || s[i + 1] === '到') && s[i + 2] in DAY_CH) {
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
    const t = str
        .replace(/[–—〜~－]/g, '-')
        .replace(/：/g, ':')
        .replace(/周/g, '週')                                   // 「周日」是「週日」的常見寫法
        .replace(/每[日天]|天天|全年無休/g, '週一至週日')          // 「每日 18:00-02:00」
        .replace(/\s+/g, ' ')
        .trim();

    const notes = [];
    const main = t.replace(/[（(]([^）)]*)[)）]/g, (_, g) => { notes.push(g); return ' '; }).trim();

    const segs = main.split(/[、；;]/).map(s => s.trim()).filter(Boolean);
    const schedule = {};
    let lastOpen = null, parsedAny = false;

    for (const seg of segs) {
        const dayMatch = seg.match(/^(?:約\s*)?((?:(?:週|周|星期|禮拜)[一二三四五六日天至到、]+)+)/);
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
        const ov = note.match(/((?:週|周|星期)?[一二三四五六日天、至到]+?)[至到]\s*(\d{1,2}):(\d{2})/);
        if (ov) {
            for (const d of parseDays(ov[1])) if (schedule[d]) {
                let c = toMin(ov[2], ov[3]);
                if (c <= schedule[d].open) c += 1440;
                schedule[d] = { open: schedule[d].open, close: c };
            }
        }
        for (const m of note.matchAll(/((?:週|周|星期)?[一二三四五六日天、至到]+?)\s*(?:公休|店休|休息|休)(?![息])/g)) {
            for (const d of parseDays(m[1])) delete schedule[d];
        }
    }
    for (const m of main.matchAll(/((?:週|周|星期)[一二三四五六日天、至到]+?)\s*(?:公休|店休|休)(?![息])/g)) {
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

// 有沒有任何一天在指定時間之前就開門
function opensBefore(bar, mins) {
    const p = parseHours(bar.hours);
    if (!p) return false;
    return Object.values(p.schedule).some(s => s.open <= mins);
}

// 有沒有任何一天營業到指定時間之後（跨夜以 24:00 之後的分鐘數計算，例如凌晨 3 點 = 27*60）
function closesAfter(bar, mins) {
    const p = parseHours(bar.hours);
    if (!p) return false;
    return Object.values(p.schedule).some(s => s.close >= mins);
}

// ===== 收藏、打卡、路線（存在瀏覽器本機）=====
const STORE_KEY = 'barbible.v1';
const barKey = b => `${b.name}|${b.city}`;

function loadStore() {
    try {
        const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
        return {
            want: raw.want || {}, visited: raw.visited || {},
            route: Array.isArray(raw.route) ? raw.route : [],
            custom: Array.isArray(raw.custom) ? raw.custom : []
        };
    } catch (e) { return { want: {}, visited: {}, route: [], custom: [] }; }
}
function saveStore() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* 無痕模式等情況，忽略 */ }
}
let store = loadStore();

const isWant = b => !!store.want[barKey(b)];
const isVisited = b => !!store.visited[barKey(b)];
const myRating = b => (store.visited[barKey(b)] || {}).rating || 0;
const myNote = b => (store.visited[barKey(b)] || {}).note || '';
const visitLog = b => (store.visited[barKey(b)] || {}).visits || [];
const inRoute = b => store.route.includes(barKey(b));

const today = () => new Date().toISOString().slice(0, 10);

// 「上次來是 3 個月前」這種相對時間
function sinceText(dateStr) {
    if (!dateStr) return '';
    const days = Math.floor((Date.now() - new Date(dateStr + 'T12:00:00').getTime()) / 86400000);
    if (days < 0) return '未來的日期？';
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 30) return `${days} 天前`;
    if (days < 365) return `${Math.floor(days / 30)} 個月前`;
    return `${Math.floor(days / 365)} 年前`;
}

// ===== 共用小工具 =====
const grid = document.getElementById('barGrid');
const countDisplay = document.getElementById('resultCount');
const districtSelect = document.getElementById('districtFilter');
const overlay = document.getElementById('modalOverlay');
const modalContent = document.getElementById('modalContent');
const $ = id => document.getElementById(id);

// data.js 的原始資料，使用者自訂的酒吧會疊在這之上
const BASE_BARS = BARS.slice();
const CITY_ORDER = REGIONS.reduce((a, r) => a.concat(r.cities), []);
const byKey = {};

function rebuildBars() {
    BARS.length = 0;
    for (const b of BASE_BARS) BARS.push(b);
    for (const b of (store.custom || [])) BARS.push({ ...b, _custom: true });
    // 依縣市重新分組（sort 是穩定的，同縣市內原有順序不變，自訂的排在該縣市最後）
    BARS.sort((a, b) => CITY_ORDER.indexOf(a.city) - CITY_ORDER.indexOf(b.city));
    BARS.forEach((b, i) => { b._id = i; });
    for (const k of Object.keys(byKey)) delete byKey[k];
    for (const b of BARS) byKey[barKey(b)] = b;
}
rebuildBars();

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
    renderChips();
    update();
}

function updateDistrictOptions() {
    const pool = currentCity === 'all' ? BARS : BARS.filter(b => b.city === currentCity);
    const districts = [...new Set(pool.map(b => b.district).filter(Boolean))];
    districtSelect.innerHTML = '<option value="all">所有行政區</option>' +
        districts.map(d => `<option value="${d}">${d}</option>`).join('');
}

// ===== 多選標籤 =====
// 每個標籤都標上「在目前縣市範圍內符合的間數」，避免點了才發現是空的
function renderChips() {
    const pool = currentCity === 'all' ? BARS : BARS.filter(b => b.city === currentCity);
    $('typeChips').innerHTML = TYPE_TAGS.map(t => {
        const n = pool.filter(b => (b.type || '').includes(t.id)).length;
        return `<button class="chip ${selectedTypes.has(t.id) ? 'on' : ''}" data-chip="type" data-id="${t.id}"` +
               `${n ? '' : ' disabled style="opacity:.35;cursor:default"'}>${t.label}<span class="n">${n}</span></button>`;
    }).join('');
    $('traitChips').innerHTML = TRAIT_TAGS.map(t => {
        const n = pool.filter(t.test).length;
        return `<button class="chip ${selectedTraits.has(t.id) ? 'on' : ''}" data-chip="trait" data-id="${t.id}"` +
               `${n ? '' : ' disabled style="opacity:.35;cursor:default"'}>${t.label}<span class="n">${n}</span></button>`;
    }).join('');
}

function toggleChip(kind, id) {
    const set = kind === 'type' ? selectedTypes : selectedTraits;
    set.has(id) ? set.delete(id) : set.add(id);
    renderChips();
    update();
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
    } else if (mode === 'near' && myPos) {
        // 沒有座標的排最後，不然會被誤認為在附近
        const d = b => hasGeo(b) ? distanceKm(myPos, b) : Infinity;
        arr.sort((a, b) => d(a) - d(b) || a._id - b._id);
    }
    return arr;
}

// ===== 卡片 =====
function renderCard(b, now) {
    const badges = [];
    if (b._custom) badges.push('<span class="custom-badge">✎ 我新增的</span>');
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
    const dist = distanceText(b);
    if (dist) details.push(`<span class="dist">📍 距離 ${esc(dist)}</span>`);
    if (b.rating) details.push(ratingHtml(b));
    if (budgetText(b)) details.push(`<span>💰 人均 <span class="budget">${esc(budgetText(b))}</span></span>`);
    if (b.hours) details.push(`<span>🕘 ${esc(b.hours)}</span>`);
    if (b.address) details.push(`<span>📍 ${esc(b.address)}</span>`);
    if (b.phone) details.push(`<span>☎️ ${esc(b.phone)}</span>`);
    if (myRating(b)) details.push(`<span class="my-rating">我的評分 ${'★'.repeat(myRating(b))}${'☆'.repeat(5 - myRating(b))}</span>`);
    const vl = visitLog(b);
    if (vl.length) details.push(`<span class="my-visit">📅 去過 ${vl.length} 次・上次 ${esc(sinceText(vl[vl.length - 1]))}</span>`);
    if (myNote(b)) details.push(`<span class="my-note">📝 ${esc(myNote(b).slice(0, 40))}${myNote(b).length > 40 ? '…' : ''}</span>`);

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
    if (distanceText(b)) rows.push(['離我多遠', `<span class="dist">${esc(distanceText(b))}</span>`]);
    if (b.rating) rows.push(['Google 評分', ratingHtml(b, true)]);
    if (budgetText(b)) rows.push(['人均消費', `<span class="budget">${esc(budgetText(b))}</span>${b.budget ? '' : '　<span style="color:#777;font-size:0.85em">(依價位級距估算)</span>'}`]);
    if (b.hours) rows.push(['營業時間', esc(b.hours)]);
    if (b.address) rows.push(['地址', esc(b.address)]);
    if (b.phone) rows.push(['電話', `<a href="tel:${esc(b.phone.replace(/[^0-9+]/g, ''))}" style="color:#ccc">${esc(b.phone)}</a>`]);
    if (b.purpose) rows.push(['適合場合', esc(b.purpose)]);

    const tags = [];
    if (b._custom) tags.push('<span class="custom-badge">✎ 我新增的</span>');
    if (statusText(b)) tags.push(`<span class="status-badge">⚠️ ${statusText(b)}</span>`);
    if (b.special) tags.push('<span class="special-badge">⭐ 私心推薦</span>');
    if (isFriend(b)) tags.push('<span class="tag tag-friend">🧡 脆友推薦</span>');
    if ((b.note || '').includes('日本調酒師')) tags.push('<span class="tag tag-highlight">🇯🇵 日本調酒師</span>');

    const k = esc(barKey(b));
    const mine = myRating(b);
    const visits = visitLog(b);
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

        ${isVisited(b) ? `
        <div class="visit-box">
            <div class="visit-head">
                <span>📅 到訪紀錄</span>
                <span class="visit-since">${visits.length ? `共 ${visits.length} 次・上次 ${esc(sinceText(visits[visits.length - 1]))}` : '尚未記錄日期'}</span>
                <button class="mini-btn" data-act="revisit" data-key="${k}" title="記錄今天又來了一次">＋ 今天又來了</button>
            </div>
            ${visits.length ? `<div class="visit-dates">${visits.slice(-8).reverse().map(d => `<span class="visit-chip">${esc(d)}</span>`).join('')}</div>` : ''}
            <label class="visit-note-label" for="noteInput">📝 我的筆記</label>
            <textarea id="noteInput" class="visit-note" rows="3" placeholder="喝了什麼、跟誰去、下次想試什麼…"
                      data-key="${k}">${esc(myNote(b))}</textarea>
            <div class="visit-note-hint">離開輸入框就會自動儲存</div>
        </div>` : ''}

        <div class="modal-section-label">地圖位置</div>
        <iframe class="modal-map" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
                title="${esc(b.name)} 地圖" src="https://maps.google.com/maps?q=${mapQuery(b)}&z=16&output=embed"></iframe>
        <div class="modal-actions">
            <a class="btn" href="https://www.google.com/maps/search/?api=1&query=${mapQuery(b)}" target="_blank" rel="noopener">🗺️ 在 Google Maps 開啟</a>
            ${b.phone ? `<a class="btn btn-ghost" href="tel:${esc(b.phone.replace(/[^0-9+]/g, ''))}">☎️ 撥打電話</a>` : ''}
            <button class="btn btn-ghost" data-act="card" data-id="${b._id}">🖼️ 產生分享圖</button>
            ${b._custom ? `<button class="btn btn-ghost" data-act="edit" data-id="${b._id}">✏️ 編輯</button>` : ''}
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
        else store.visited[key] = { rating: 0, date: today(), visits: [today()] };
    } else if (act === 'revisit') {
        // 再訪一次：把今天加進到訪紀錄
        const v = store.visited[key] || { rating: 0, date: today(), visits: [] };
        v.visits = [...new Set([...(v.visits || []), today()])].sort();
        v.date = v.visits[v.visits.length - 1];
        store.visited[key] = v;
    } else if (act === 'note') {
        const v = store.visited[key] || { rating: 0, date: today(), visits: [today()] };
        v.note = n;
        store.visited[key] = v;
    } else if (act === 'route') {
        const i = store.route.indexOf(key);
        if (i >= 0) store.route.splice(i, 1);
        else if (store.route.length >= MAX_ROUTE) { alert(`一晚排 ${MAX_ROUTE} 攤已經很拚了，先移除幾間再加吧 🍻`); return false; }
        else store.route.push(key);
    } else if (act === 'rate') {
        const v = store.visited[key] || { date: today(), visits: [today()] };
        store.visited[key] = { ...v, rating: Number(n) };
    } else if (act === 'unrate') {
        if (store.visited[key]) store.visited[key].rating = 0;
    } else return false;
    if (act === 'route' || act === 'want' || act === 'visited') {
        if (!$('listOverlay').hidden) setTimeout(renderList, 0);   // 酒單開著就順便刷新
    }
    saveStore();
    return true;
}

// ===== 淺色 / 深色主題 =====
const THEME_KEY = 'barbible.theme';

function applyTheme(mode) {
    document.documentElement.dataset.theme = mode;
    const btn = $('themeBtn');
    if (btn) {
        btn.textContent = mode === 'light' ? '🌙 深色' : '☀️ 淺色';
        btn.title = mode === 'light' ? '切換到深色主題' : '切換到淺色主題';
    }
    // 手機瀏覽器的網址列顏色
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', mode === 'light' ? '#f7f4ec' : '#d4af37');
    // 地圖底圖也要跟著換
    if (mapReady) swapTiles(mode);
}

function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* 無痕模式，忽略 */ }
    applyTheme(next);
}

function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) { /* 忽略 */ }
    // 沒設定過就跟隨系統
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    applyTheme(saved || (prefersLight ? 'light' : 'dark'));
}

// ===== 今晚喝哪間：從目前篩選結果裡隨機抽一間 =====
function randomPick() {
    const pool = lastFiltered.filter(b => !statusText(b));
    if (!pool.length) { toast('目前的篩選條件沒有可以抽的店'); return; }
    const b = pool[Math.floor(Math.random() * pool.length)];
    openDetail(b._id);
    toast(`就決定是你了：${b.name} 🍸`);
}

// ===== 定位：離我最近 =====
let myPos = null;              // { lat, lng }，取得後才會出現距離排序

function locateMe() {
    if (!navigator.geolocation) { toast('這個瀏覽器不支援定位'); return; }
    const btn = $('locateBtn');
    btn.disabled = true;
    btn.textContent = '📍 定位中…';
    navigator.geolocation.getCurrentPosition(
        pos => {
            myPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            btn.disabled = false;
            btn.textContent = '📍 已定位';
            btn.classList.add('on');
            // 加入距離排序選項並直接套用
            if (!$('sortFilter').querySelector('[value="near"]')) {
                const o = document.createElement('option');
                o.value = 'near'; o.textContent = '📍 離我最近';
                $('sortFilter').insertBefore(o, $('sortFilter').firstChild);
            }
            $('sortFilter').value = 'near';
            update();
            const n = BARS.filter(b => hasGeo(b)).length;
            toast(`已定位，依距離排序 ${n} 間有座標的店`);
        },
        err => {
            btn.disabled = false;
            btn.textContent = '📍 離我最近';
            toast(err.code === 1 ? '你拒絕了定位權限' : '定位失敗，請確認裝置定位已開啟');
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
}

// 距離文字：1 公里內用公尺表示，並附上大概的步行時間（時速 4.5 公里）
function distanceText(b) {
    if (!myPos || !hasGeo(b)) return '';
    const km = distanceKm(myPos, b);
    const mins = Math.round(km / 4.5 * 60);
    const d = km < 1 ? `${Math.round(km * 1000)} 公尺` : `${km.toFixed(1)} 公里`;
    return km < 3 ? `${d}・步行約 ${mins} 分` : d;
}

// ===== 我的酒單（收藏 / 已攻略 / 今晚路線）=====
let listTab = 'want';

function listBars(tab) {
    if (tab === 'route') return store.route.map(k => byKey[k]).filter(Boolean);
    const src = tab === 'want' ? store.want : store.visited;
    return Object.keys(src).map(k => byKey[k]).filter(Boolean);
}

function renderList() {
    $('cntWant').textContent = Object.keys(store.want).length;
    $('cntVisited').textContent = Object.keys(store.visited).length;
    $('cntRoute').textContent = store.route.length;
    document.querySelectorAll('.list-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === listTab));

    const bars = listBars(listTab);
    if (!bars.length) {
        const msg = { want: '還沒有收藏任何酒吧。在卡片上點 🤍 就會加進來。',
                      visited: '還沒有標記喝過的店。在卡片上點 ✓ 就會記錄下來。',
                      route: '今晚路線是空的。在卡片上點 🍺 加入想跑的店。' }[listTab];
        $('listBody').innerHTML = `<div class="list-empty">${msg}</div>`;
        return;
    }

    $('listBody').innerHTML = bars.map((b, i) => {
        const k = esc(barKey(b));
        const meta = [b.city + (b.district ? ' ' + b.district : ''), b.type,
                      myRating(b) ? '我的評分 ' + '★'.repeat(myRating(b)) : ''].filter(Boolean).join('｜');
        const actions = listTab === 'route'
            ? `<button class="mini-btn" data-list="up" data-key="${k}" ${i === 0 ? 'disabled' : ''} title="往前一攤">↑</button>
               <button class="mini-btn" data-list="down" data-key="${k}" ${i === bars.length - 1 ? 'disabled' : ''} title="往後一攤">↓</button>
               <button class="mini-btn danger" data-list="remove" data-key="${k}" title="移出路線">✕</button>`
            : `<button class="mini-btn danger" data-list="remove" data-key="${k}" title="${listTab === 'want' ? '取消收藏' : '取消已攻略'}">✕</button>`;
        return `<div class="list-item">
            <span class="list-seq">${listTab === 'route' ? i + 1 : '·'}</span>
            <div class="list-main" data-list="open" data-key="${k}">
                <div class="list-name">${esc(b.name)}</div>
                <div class="list-meta">${esc(meta)}</div>
            </div>
            <div class="list-actions">${actions}</div>
        </div>`;
    }).join('');
}

function openList(tab) {
    if (tab) listTab = tab;
    renderList();
    $('listOverlay').hidden = false;
    document.body.style.overflow = 'hidden';
    $('listClose').focus();
}
function closeList() {
    $('listOverlay').hidden = true;
    document.body.style.overflow = '';
}

// 匯出 / 匯入備份，避免清瀏覽器資料就全部消失
function exportBackup() {
    const data = JSON.stringify({ ...store, _exportedAt: new Date().toISOString() }, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `bar-bible-備份-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('已匯出備份檔');
}

function importBackup(file) {
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const d = JSON.parse(reader.result);
            if (!d || typeof d !== 'object') throw new Error('格式不對');
            store.want = d.want && typeof d.want === 'object' ? d.want : {};
            store.visited = d.visited && typeof d.visited === 'object' ? d.visited : {};
            store.custom = Array.isArray(d.custom) ? d.custom.filter(b => b && b.name && b.city) : [];
            rebuildBars();
            store.route = Array.isArray(d.route) ? d.route.filter(k => byKey[k]) : [];
            saveStore(); renderCityNav(); updateDistrictOptions(); renderChips(); renderList(); update();
            toast('備份已匯入');
        } catch (e) { toast('匯入失敗：檔案格式不正確'); }
    };
    reader.readAsText(file);
}

let toastTimer = null;
function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
}

// ===== 新增／編輯酒吧 =====
// 這是靜態網站，沒有後端，所以新增的酒吧存在瀏覽器本機。
// 想讓它變成正式資料，用「複製 data.js 格式」把那一行貼進 repo。
const VALID_TYPES = ['經典', '特調', '經典特調', '啤酒'];
const VALID_PURPOSES = ['一個人', '聚會', '聚會或一個人'];
let editingKey = null;          // 正在編輯哪一筆（null = 新增）
let formSnapshot = '';          // 開啟當下的表單內容，用來判斷有沒有改過

function snapshotForm() {
    const f = $('barForm');
    if (!f) return '';
    return [...f.elements].map(el => el.type === 'checkbox' ? el.checked : el.value).join('\u0000');
}

const formDirty = () => snapshotForm() !== formSnapshot;

// 從表單讀出一個乾淨的酒吧物件，空欄位一律省略而不是存空字串
function readForm() {
    const f = $('barForm');
    const g = n => (f.elements[n] ? String(f.elements[n].value).trim() : '');
    const b = { name: g('name'), city: g('city') };
    for (const k of ['district', 'type', 'purpose', 'style', 'budget', 'address', 'phone', 'hours', 'note']) {
        if (g(k)) b[k] = g(k);
    }
    if (g('price')) b.price = Number(g('price'));
    if (g('rating')) b.rating = Number(g('rating'));
    if (g('ratingCount')) b.ratingCount = Number(g('ratingCount'));
    if (g('lat')) b.lat = Number(g('lat'));
    if (g('lng')) b.lng = Number(g('lng'));
    const aw = g('awards').split('\n').map(x => x.trim()).filter(Boolean);
    if (aw.length) b.awards = aw;
    if (f.elements.special && f.elements.special.checked) b.special = true;
    return b;
}

// 驗證規則跟 tests/validate-data.js 一致，避免存進去的資料在 CI 被擋下
function validateBar(b, originalKey) {
    const errs = [];
    if (!b.name) errs.push('店名是必填的');
    if (!b.city) errs.push('縣市是必填的');
    else if (!CITY_ORDER.includes(b.city)) errs.push(`縣市「${b.city}」不在清單中`);

    if (b.name && b.city) {
        const key = `${b.name}|${b.city}`;
        if (key !== originalKey && byKey[key]) errs.push(`「${b.name}」在${b.city}已經有一筆了，請換個名字或確認是否重複`);
    }
    if (b.type && !VALID_TYPES.includes(b.type)) errs.push('酒類不合法');
    if (b.purpose && !VALID_PURPOSES.includes(b.purpose)) errs.push('適合場合不合法');
    if (b.price !== undefined && ![1, 2, 3].includes(b.price)) errs.push('價位必須是 1、2 或 3');
    if (b.rating !== undefined && (isNaN(b.rating) || b.rating < 0 || b.rating > 5)) errs.push('評分必須介於 0 到 5');
    if (b.ratingCount !== undefined && (!Number.isInteger(b.ratingCount) || b.ratingCount < 0)) errs.push('評論數必須是非負整數');

    const hasLat = b.lat !== undefined, hasLng = b.lng !== undefined;
    if (hasLat !== hasLng) errs.push('緯度與經度要嘛都填、要嘛都不填');
    if (hasLat && hasLng) {
        if (isNaN(b.lat) || isNaN(b.lng)) errs.push('座標必須是數字');
        else if (b.lat < 21.5 || b.lat > 26.5 || b.lng < 118 || b.lng > 122.2) errs.push('座標超出台灣範圍，是不是填反了？');
    }
    return errs;
}

// 產生可以直接貼進 data.js 的一行
function toDataJsLine(b) {
    const ORDER = ['name', 'city', 'district', 'type', 'purpose', 'style', 'price', 'budget',
                   'address', 'phone', 'hours', 'lat', 'lng', 'rating', 'ratingCount',
                   'awards', 'special', 'note'];
    return '  {' + ORDER.filter(k => b[k] !== undefined)
        .map(k => `${k}: ${JSON.stringify(b[k])}`).join(', ') + '},';
}

let previewTimer = null;

// 打字時只跑輕量驗證，卡片預覽延後 180ms 再畫
function refreshForm() {
    validateNow();
    clearTimeout(previewTimer);
    previewTimer = setTimeout(renderPreview, 180);
}

function renderPreview() {
    const b = readForm();
    $('formPreview').innerHTML = b.name
        ? renderCard({ ...b, _id: -1 }, new Date())
        : '<div class="list-empty">填入店名後這裡會顯示卡片預覽</div>';
}

function validateNow() {
    const b = readForm();
    const errs = validateBar(b, editingKey);

    // 營業時間即時回饋：讓使用者知道程式看不看得懂他寫的格式
    const hint = $('hoursHint');
    const hv = $('barForm').elements.hours.value.trim();
    if (!hv) {
        hint.className = 'f-hint';
        hint.textContent = '支援「週二至週日 19:00–02:00（週一休）」「20:00–02:00（週五六至03:00，週一休）」等寫法';
    } else {
        const p = parseHours(hv);
        if (p) {
            const DN = ['日', '一', '二', '三', '四', '五', '六'];
            const days = Object.keys(p.schedule).map(Number).sort();
            const t = p.schedule[days[0]];
            const fmt = m => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
            const varied = new Set(days.map(d => p.schedule[d].open + '_' + p.schedule[d].close)).size > 1;
            hint.className = 'f-hint good';
            hint.textContent = `✓ 看得懂：週${days.map(d => DN[d]).join('')} ${fmt(t.open)}–${fmt(t.close)}` +
                               (varied ? '（各日略有不同）' : '');
        } else {
            hint.className = 'f-hint warn';
            hint.textContent = '⚠ 這個格式解析不了，卡片上會顯示「時間未知」，「現在還有開」也篩不到';
        }
    }

    // 錯誤清單
    const box = $('formErrors');
    if (errs.length) {
        box.hidden = false;
        box.innerHTML = '<b>還有幾個地方要修：</b><ul>' + errs.map(e => `<li>${esc(e)}</li>`).join('') + '</ul>';
    } else box.hidden = true;
    $('formSave').disabled = errs.length > 0;
}

function openForm(bar) {
    const f = $('barForm');
    f.reset();
    // 縣市選單
    f.elements.city.innerHTML = '<option value="">請選擇</option>' +
        CITY_ORDER.map(c => `<option value="${c}">${c}</option>`).join('');

    editingKey = bar ? barKey(bar) : null;
    $('formTitle').textContent = bar ? '✏️ 編輯酒吧' : '➕ 新增酒吧';
    $('formDelete').hidden = !bar;

    if (bar) {
        for (const k of ['name', 'city', 'district', 'type', 'purpose', 'style', 'budget',
                         'address', 'phone', 'hours', 'note']) {
            if (f.elements[k]) f.elements[k].value = bar[k] || '';
        }
        for (const k of ['price', 'rating', 'ratingCount', 'lat', 'lng']) {
            if (f.elements[k]) f.elements[k].value = bar[k] !== undefined ? bar[k] : '';
        }
        f.elements.awards.value = (bar.awards || []).join('\n');
        f.elements.special.checked = !!bar.special;
    } else if (currentCity !== 'all') {
        f.elements.city.value = currentCity;     // 從某個縣市頁籤按新增，就預選那個縣市
    }

    refreshForm();
    renderPreview();
    fillGhForm();
    formSnapshot = snapshotForm();
    $('formOverlay').hidden = false;
    document.body.style.overflow = 'hidden';
    f.elements.name.focus();
}

// force = true 代表儲存或刪除完成，不需要再問
function closeForm(force) {
    if (!force && formDirty() && !confirm('表單還有沒儲存的內容，確定要關閉嗎？')) return false;
    $('formOverlay').hidden = true;
    document.body.style.overflow = '';
    editingKey = null;
    formSnapshot = '';
    return true;
}

function saveForm(e) {
    if (e) e.preventDefault();
    const b = readForm();
    const errs = validateBar(b, editingKey);
    if (errs.length) { validateNow(); renderPreview(); return; }

    store.custom = store.custom || [];
    if (editingKey) {
        const i = store.custom.findIndex(x => `${x.name}|${x.city}` === editingKey);
        if (i >= 0) store.custom[i] = b; else store.custom.push(b);
    } else {
        store.custom.push(b);
    }
    saveStore();
    rebuildBars();
    renderCityNav(); updateDistrictOptions(); renderChips(); update();
    const wasEdit = !!editingKey;
    closeForm(true);
    toast(wasEdit ? `已更新「${b.name}」` : `已新增「${b.name}」🍸`);
}

function deleteCustom(key) {
    if (!confirm('確定要刪除這筆自訂酒吧嗎？此動作無法復原。')) return;
    store.custom = (store.custom || []).filter(x => `${x.name}|${x.city}` !== key);
    delete store.want[key];
    delete store.visited[key];
    store.route = store.route.filter(k => k !== key);
    saveStore();
    rebuildBars();
    renderCityNav(); updateDistrictOptions(); renderChips(); update();
    closeForm(true);
    toast('已刪除');
}

async function copyDataJs() {
    const b = readForm();
    if (!b.name || !b.city) { toast('至少要有店名和縣市才能產生'); return; }
    const line = toDataJsLine(b);
    try {
        await navigator.clipboard.writeText(line);
        toast('已複製，貼到 data.js 對應縣市段落即可');
    } catch (err) {
        window.prompt('複製這一行貼進 data.js：', line);
    }
}

// ===== 寫回 GitHub repo =====
// 用 GitHub 的 Contents API 直接讀寫 repo 裡的 data.js，不需要任何後端。
// 權杖存在瀏覽器本機，只有這台裝置用得到。
const GH_KEY = 'barbible.gh';
const GH_DEFAULT_REPO = 'Sid-EN/Bar_Hopping';

function loadGh() {
    try {
        const g = JSON.parse(localStorage.getItem(GH_KEY) || '{}');
        return { repo: g.repo || GH_DEFAULT_REPO, token: g.token || '' };
    } catch (e) { return { repo: GH_DEFAULT_REPO, token: '' }; }
}
function saveGh(g) {
    try { localStorage.setItem(GH_KEY, JSON.stringify(g)); } catch (e) { /* 無痕模式，忽略 */ }
}

// UTF-8 安全的 base64：GitHub API 收送的檔案內容都是 base64，
// 而 data.js 有大量中文，直接 btoa 會壞掉。分段處理避免參數過多。
function b64encode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
        bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    }
    return btoa(bin);
}
function b64decode(b64) {
    const bin = atob(String(b64).replace(/\s/g, ''));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
}

async function ghFetch(path, opts) {
    const g = loadGh();
    if (!g.token) throw new Error('還沒設定存取權杖');
    const res = await fetch(`https://api.github.com/repos/${g.repo}/${path}`, {
        ...opts,
        headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': `Bearer ${g.token}`,
            'X-GitHub-Api-Version': '2022-11-28',
            ...(opts && opts.body ? { 'Content-Type': 'application/json' } : {})
        }
    });
    if (!res.ok) {
        const detail = await res.text().catch(() => '');
        let msg = `GitHub 回應 ${res.status}`;
        if (res.status === 401) msg = '權杖無效或已過期';
        else if (res.status === 403) msg = '權杖權限不足（需要 Contents: Read and write）';
        else if (res.status === 404) msg = '找不到這個 repo 或檔案，請確認 Repository 欄位';
        else if (res.status === 409) msg = 'CONFLICT';
        else if (res.status === 422) msg = 'GitHub 拒絕這次修改：' + detail.slice(0, 120);
        const err = new Error(msg);
        err.status = res.status;
        throw err;
    }
    return res.json();
}

// 把一行酒吧資料插進 data.js 的對應縣市段落；同名同縣市已存在就取代那一行
function insertIntoDataJs(src, bar) {
    const line = toDataJsLine(bar);
    const marker = c => `  // ───── ${c} ─────`;

    // 已經有同一間了嗎（用 name + city 判斷）
    const escRe = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existing = new RegExp(
        `^\\s*\\{name: ${escRe(JSON.stringify(bar.name))}, city: ${escRe(JSON.stringify(bar.city))}[,}].*$`, 'm');
    if (existing.test(src)) {
        return { content: src.replace(existing, line), mode: 'update' };
    }

    const at = src.indexOf(marker(bar.city));
    if (at >= 0) {
        // 插在這個縣市區塊的最後一行之後
        const nextSection = src.indexOf('\n  // ─────', at + 1);
        const endOfArray = src.lastIndexOf('];');
        let end = nextSection >= 0 ? nextSection : endOfArray;
        // 往回退到最後一個非空白行的行尾
        let cut = src.lastIndexOf('},', end);
        if (cut < at) cut = src.indexOf('\n', at);
        else cut = src.indexOf('\n', cut);
        return { content: src.slice(0, cut + 1) + line + '\n' + src.slice(cut + 1), mode: 'insert' };
    }

    // 這個縣市還沒有任何店：依 CITY_ORDER 找到該插在哪個縣市之前
    const idx = CITY_ORDER.indexOf(bar.city);
    let before = -1;
    for (let i = idx + 1; i < CITY_ORDER.length; i++) {
        const p = src.indexOf(marker(CITY_ORDER[i]));
        if (p >= 0) { before = p; break; }
    }
    const block = `\n${marker(bar.city)}\n${line}\n`;
    if (before >= 0) return { content: src.slice(0, before) + block.slice(1) + src.slice(before), mode: 'new-city' };
    const endOfArray = src.lastIndexOf('];');
    return { content: src.slice(0, endOfArray) + block + src.slice(endOfArray), mode: 'new-city' };
}

async function pushToRepo() {
    const bar = readForm();
    const errs = validateBar(bar, editingKey);
    if (errs.length) { validateNow(); toast('還有欄位要修正，先處理完再寫回'); return; }

    const g = loadGh();
    if (!g.token) {
        $('ghBox').open = true;
        toast('請先在下方的 GitHub 設定填入存取權杖');
        $('ghToken').focus();
        return;
    }

    const btn = $('formPush');
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = '寫入中…';

    try {
        // 最多重試一次：別人剛好也改了 data.js 時 sha 會對不上
        for (let attempt = 0; attempt < 2; attempt++) {
            const file = await ghFetch('contents/data.js');
            const src = b64decode(file.content);
            const { content, mode } = insertIntoDataJs(src, bar);

            if (content === src) { toast('data.js 裡已經有一模一樣的內容了'); break; }

            const verb = mode === 'update' ? '更新' : '新增';
            try {
                const res = await ghFetch('contents/data.js', {
                    method: 'PUT',
                    body: JSON.stringify({
                        message: `${verb}酒吧：${bar.name}（${bar.city}）\n\n由網站的新增表單提交`,
                        content: b64encode(content),
                        sha: file.sha
                    })
                });
                // 寫回成功，本機那份自訂資料就不需要了（避免同一間出現兩次）
                const key = `${bar.name}|${bar.city}`;
                store.custom = (store.custom || []).filter(x => `${x.name}|${x.city}` !== key);
                saveStore();
                rebuildBars();
                renderCityNav(); updateDistrictOptions(); renderChips(); update();
                closeForm(true);

                const url = res.commit && res.commit.html_url;
                setGhStatus(`已${verb}並提交`, 'ok');
                toast(`已${verb}到 repo！Pages 大約一分鐘後更新`);
                if (url && confirm(`已${verb}「${bar.name}」並提交到 data.js。\n\n要開啟這個 commit 看看嗎？`)) {
                    window.open(url, '_blank', 'noopener');
                }
                break;
            } catch (e) {
                if (e.message === 'CONFLICT' && attempt === 0) continue;   // 重抓最新版再試一次
                throw e;
            }
        }
    } catch (e) {
        setGhStatus(e.message, 'err');
        toast('寫回失敗：' + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = original;
    }
}

function setGhStatus(msg, kind) {
    const el = $('ghStatus');
    if (!el) return;
    el.textContent = msg;
    el.className = 'gh-status' + (kind ? ' ' + kind : '');
}

async function testGh() {
    saveGhFromForm();
    setGhStatus('測試中…');
    try {
        const file = await ghFetch('contents/data.js');
        setGhStatus(`連線正常，讀到 data.js（${(file.size / 1024).toFixed(0)} KB）`, 'ok');
    } catch (e) {
        setGhStatus(e.message, 'err');
    }
}

function saveGhFromForm() {
    saveGh({ repo: $('ghRepo').value.trim() || GH_DEFAULT_REPO, token: $('ghToken').value.trim() });
}

function fillGhForm() {
    const g = loadGh();
    $('ghRepo').value = g.repo;
    $('ghToken').value = g.token;
    setGhStatus(g.token ? '已設定權杖' : '尚未設定權杖');
}

// ===== 年度回顧 =====
function yearStats(year) {
    const visited = Object.entries(store.visited)
        .map(([k, v]) => ({ bar: byKey[k], v }))
        .filter(x => x.bar);

    // 有到訪日期就用日期篩年份，沒有的（舊資料）只在「全部」時計入
    const inYear = year === 'all' ? visited
        : visited.filter(x => (x.v.visits || [x.v.date]).some(d => d && d.startsWith(String(year))));

    const visitCount = inYear.reduce((n, x) =>
        n + (year === 'all' ? (x.v.visits || [x.v.date]).filter(Boolean).length
                            : (x.v.visits || [x.v.date]).filter(d => d && d.startsWith(String(year))).length), 0);

    const byCity = {}, byDistrict = {}, byType = {};
    for (const x of inYear) {
        byCity[x.bar.city] = (byCity[x.bar.city] || 0) + 1;
        if (x.bar.district) {
            const d = x.bar.city + ' ' + x.bar.district;
            byDistrict[d] = (byDistrict[d] || 0) + 1;
        }
        if (x.bar.type) byType[x.bar.type] = (byType[x.bar.type] || 0) + 1;
    }
    const top = obj => Object.entries(obj).sort((a, b) => b[1] - a[1])[0];
    const rated = inYear.filter(x => x.v.rating > 0);
    const avg = rated.length ? rated.reduce((n, x) => n + x.v.rating, 0) / rated.length : 0;
    const favourites = rated.filter(x => x.v.rating === 5).map(x => x.bar.name);
    const awarded = inYear.filter(x => hasAward(x.bar)).length;

    return {
        bars: inYear.length, visitCount, avg, favourites, awarded,
        topCity: top(byCity), topDistrict: top(byDistrict), topType: top(byType),
        cities: Object.keys(byCity).length
    };
}

function availableYears() {
    const ys = new Set();
    for (const v of Object.values(store.visited)) {
        for (const d of (v.visits || [v.date])) if (d) ys.add(d.slice(0, 4));
    }
    return [...ys].sort().reverse();
}

function renderRecap() {
    const years = availableYears();
    const year = $('recapYear') ? $('recapYear').value : (years[0] || 'all');
    const st = yearStats(year);
    const label = year === 'all' ? '至今' : year + ' 年';

    if (!st.bars) {
        $('recapBody').innerHTML = `<div class="list-empty">${label}還沒有攻略紀錄。在卡片上點 ✓ 開始記錄吧 🍸</div>`;
        return;
    }

    const cards = [
        ['🍸', st.bars, `${label}攻略的酒吧`],
        ['🔁', st.visitCount, '總到訪次數'],
        ['🗺️', st.cities, '踏足的縣市'],
        ['🏆', st.awarded, '其中的獲獎名店']
    ];

    $('recapBody').innerHTML = `
        <div class="recap-grid">
            ${cards.map(([ico, n, lab]) =>
                `<div class="recap-card"><div class="recap-ico">${ico}</div>
                 <div class="recap-num">${n}</div><div class="recap-lab">${lab}</div></div>`).join('')}
        </div>
        <dl class="modal-rows">
            ${st.topCity ? `<dt>最常去的縣市</dt><dd>${esc(st.topCity[0])}（${st.topCity[1]} 間）</dd>` : ''}
            ${st.topDistrict ? `<dt>最常去的區域</dt><dd>${esc(st.topDistrict[0])}（${st.topDistrict[1]} 間）</dd>` : ''}
            ${st.topType ? `<dt>偏好的類型</dt><dd>${esc(st.topType[0])}（${st.topType[1]} 間）</dd>` : ''}
            ${st.avg ? `<dt>平均給分</dt><dd><span class="rating-num">${st.avg.toFixed(1)}</span> / 5</dd>` : ''}
            ${st.favourites.length ? `<dt>五星愛店</dt><dd>${st.favourites.map(esc).join('、')}</dd>` : ''}
        </dl>
        <div class="recap-progress">
            已攻略全台 ${BARS.length} 間中的 ${Object.keys(store.visited).length} 間
            （${(Object.keys(store.visited).length / BARS.length * 100).toFixed(1)}%）
        </div>`;
}

function openRecap() {
    const years = availableYears();
    $('recapYear').innerHTML = years.map(y => `<option value="${y}">${y} 年</option>`).join('') +
        '<option value="all">全部時間</option>';
    if (!years.length) $('recapYear').value = 'all';
    renderRecap();
    $('recapOverlay').hidden = false;
    document.body.style.overflow = 'hidden';
    $('recapClose').focus();
}
function closeRecap() {
    $('recapOverlay').hidden = true;
    document.body.style.overflow = '';
}

// ===== 分享卡片圖：用 Canvas 畫一張可以直接發到社群的圖 =====
function shareCard(bar) {
    const W = 1080, H = 1080, cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    if (!c) { toast('這個瀏覽器不支援產生圖片'); return; }

    const GOLD = '#d4af37', MUTED = '#9a9a9a';
    c.fillStyle = '#121212'; c.fillRect(0, 0, W, H);
    // 金色外框
    c.strokeStyle = GOLD; c.lineWidth = 6; c.strokeRect(40, 40, W - 80, H - 80);
    c.strokeStyle = 'rgba(212,175,55,0.25)'; c.lineWidth = 2; c.strokeRect(58, 58, W - 116, H - 116);

    const F = (size, weight) => `${weight || ''} ${size}px "PingFang TC","Microsoft JhengHei",sans-serif`;
    c.textAlign = 'center';

    c.fillStyle = MUTED; c.font = F(30);
    c.fillText('TAIWAN BAR BIBLE', W / 2, 150);

    // 店名：太長就自動縮小字級
    let fs = 84;
    c.font = F(fs, 'bold');
    while (c.measureText(bar.name).width > W - 220 && fs > 40) { fs -= 4; c.font = F(fs, 'bold'); }
    c.fillStyle = GOLD;
    c.fillText(bar.name, W / 2, 300);

    c.fillStyle = '#cfcfcf'; c.font = F(34);
    c.fillText([bar.city + (bar.district ? ' ' + bar.district : ''), bar.type, bar.style].filter(Boolean).join('　·　'), W / 2, 366);

    // 星等
    let y = 460;
    if (bar.rating) {
        c.font = F(46);
        const full = Math.round(bar.rating);
        c.fillStyle = '#f5c518';
        c.fillText('★'.repeat(full) + '☆'.repeat(5 - full), W / 2, y);
        c.fillStyle = '#cfcfcf'; c.font = F(30);
        c.fillText(`Google ${bar.rating}${bar.ratingCount ? ` · ${bar.ratingCount.toLocaleString()} 則評論` : ''}`, W / 2, y + 46);
        y += 110;
    }
    if (budgetText(bar)) {
        c.fillStyle = '#9fd4a3'; c.font = F(34);
        c.fillText('人均 ' + budgetText(bar), W / 2, y);
        y += 66;
    }

    // 介紹（自動換行）
    if (bar.note) {
        c.fillStyle = '#d8d8d8'; c.font = F(34);
        const words = [...bar.note];
        let line = '', ly = Math.max(y + 20, 640);
        for (const ch of words) {
            if (c.measureText(line + ch).width > W - 260) { c.fillText(line, W / 2, ly); line = ch; ly += 50; }
            else line += ch;
            if (ly > 850) break;
        }
        if (line && ly <= 850) c.fillText(line, W / 2, ly);
    }

    // 獲獎
    if (hasAward(bar)) {
        c.fillStyle = '#d9b8ff'; c.font = F(28);
        c.fillText('🏆 ' + bar.awards[0], W / 2, 920);
    }

    c.fillStyle = MUTED; c.font = F(26);
    c.fillText('未成年請勿飲酒 · 酒後不開車', W / 2, 1000);

    cv.toBlob(blob => {
        if (!blob) { toast('圖片產生失敗'); return; }
        const file = new File([blob], `${bar.name}.png`, { type: 'image/png' });
        // 手機上優先用系統分享，桌機則直接下載
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file], title: bar.name }).catch(() => {});
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `${bar.name}.png`;
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            toast('卡片圖已下載');
        }
    }, 'image/png');
}

// ===== 今晚路線 =====
// store.route 的順序就是實際順序，使用者可以自己調。
// 「自動排序」按鈕才會套用最近鄰演算法把順序重排一次。
function orderedRoute() {
    return store.route.map(k => byKey[k]).filter(Boolean);
}

// 最近鄰：從第一間出發，每次挑距離最近的下一間
function autoSortRoute() {
    const bars = orderedRoute();
    if (bars.length < 3) { toast('至少 3 攤才需要排順序'); return; }
    if (!bars.every(hasGeo)) { toast('有店家還沒有座標，無法自動排序'); return; }
    const rest = bars.slice(1), path = [bars[0]];
    while (rest.length) {
        const last = path[path.length - 1];
        let bi = 0, bd = Infinity;
        rest.forEach((b, i) => { const d = distanceKm(last, b); if (d < bd) { bd = d; bi = i; } });
        path.push(rest.splice(bi, 1)[0]);
    }
    store.route = path.map(barKey);
    saveStore();
    update();
    if (!$('listOverlay').hidden) renderList();
    toast('已依地理位置排出最順的順序');
}

// ===== 路線的時間推算與營業時間檢查 =====
const STAY_MINUTES = 60;        // 每攤大約待多久
const WALK_KMH = 4.5;           // 步行速度

// 從出發時間開始，依序推算每一攤的抵達時間，並檢查那時候店家是否還開著
function routeSchedule(bars, startAt) {
    const out = [];
    let cursor = new Date(startAt);

    bars.forEach((b, i) => {
        if (i > 0) {
            const prev = bars[i - 1];
            // 有座標就用步行時間，沒有就抓 15 分鐘當作移動時間
            const walk = (hasGeo(prev) && hasGeo(b))
                ? Math.round(distanceKm(prev, b) / WALK_KMH * 60)
                : 15;
            cursor = new Date(cursor.getTime() + (STAY_MINUTES + walk) * 60000);
        }
        const arrive = new Date(cursor);
        const leave = new Date(cursor.getTime() + STAY_MINUTES * 60000);
        const st = openState(b, arrive);

        let warn = null;
        if (st.state === 'unknown') warn = 'unknown';
        else if (st.state === 'closed') warn = 'closed';
        else if (st.closesIn !== undefined && st.closesIn < STAY_MINUTES) warn = 'closing';

        out.push({ bar: b, arrive, leave, state: st, warn });
    });
    return out;
}

const hhmm = d => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');

function renderSchedule() {
    const box = $('routeSchedule');
    if (!box) return;
    const bars = orderedRoute();
    if (bars.length < 2) { box.innerHTML = ''; return; }

    // 出發時間：使用者可以自己選，預設是現在（若現在是白天就抓晚上 8 點）
    const now = new Date();
    let start;
    const picked = $('routeStart') && $('routeStart').value;
    if (picked && /^\d{2}:\d{2}$/.test(picked)) {
        const [h, m] = picked.split(':').map(Number);
        start = new Date(now);
        start.setHours(h, m, 0, 0);
        // 選的時間已經過了就當作是今晚稍晚（避免推算出過去的時間）
        if (start < now && h < 12) start.setDate(start.getDate() + 1);
    } else {
        start = now.getHours() < 17 ? new Date(new Date(now).setHours(20, 0, 0, 0)) : now;
    }

    const plan = routeSchedule(bars, start);
    const problems = plan.filter(p => p.warn === 'closed' || p.warn === 'closing');

    box.innerHTML = `
        <div class="sched-head">
            <span>🕘 出發時間</span>
            <input type="time" id="routeStart" value="${hhmm(start)}">
            <span class="sched-note">每攤以停留 ${STAY_MINUTES} 分鐘、步行 ${WALK_KMH} km/h 推算</span>
        </div>
        <ol class="sched-list">
            ${plan.map((p, i) => {
                const cls = p.warn === 'closed' ? 'bad' : p.warn === 'closing' ? 'warn' : p.warn === 'unknown' ? 'unk' : 'ok';
                const msg = p.warn === 'closed' ? '到的時候沒開'
                    : p.warn === 'closing' ? `只剩 ${p.state.closesIn} 分鐘就打烊`
                    : p.warn === 'unknown' ? '營業時間未知'
                    : '營業中';
                return `<li class="sched-item ${cls}">
                    <span class="sched-time">${hhmm(p.arrive)}</span>
                    <span class="sched-name">${esc(p.bar.name)}</span>
                    <span class="sched-state">${msg}</span>
                </li>`;
            }).join('')}
        </ol>
        ${problems.length
            ? `<div class="sched-alert">⚠️ 有 ${problems.length} 攤趕不上，建議調整順序或提早出發</div>`
            : '<div class="sched-ok">✅ 這條路線的時間都趕得上</div>'}`;

    $('routeStart').addEventListener('change', renderSchedule);
}

// 手動移動某一攤的位置
function moveInRoute(key, delta) {
    const i = store.route.indexOf(key);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= store.route.length) return;
    store.route.splice(j, 0, store.route.splice(i, 1)[0]);
    saveStore();
    update();
    renderList();
}

function renderRoute() {
    const bar = $('routeBar');
    const bars = orderedRoute();
    if (!bars.length) {
        bar.hidden = true;
        $('routeSchedule').innerHTML = '';     // 清掉殘留的時間表，不然下次開啟會閃到舊資料
        return;
    }
    bar.hidden = false;

    $('routeChips').innerHTML = bars.map((b, i) => {
        const k = esc(barKey(b));
        return `<span class="route-chip"><span class="seq">${i + 1}</span>${esc(b.name)}` +
            `<button data-act="move" data-key="${k}" data-d="-1" title="往前一攤" aria-label="往前"${i === 0 ? ' disabled style="opacity:.3"' : ''}>‹</button>` +
            `<button data-act="move" data-key="${k}" data-d="1" title="往後一攤" aria-label="往後"${i === bars.length - 1 ? ' disabled style="opacity:.3"' : ''}>›</button>` +
            `<button data-act="route" data-key="${k}" title="移除" aria-label="移除">&times;</button></span>`;
    }).join('');

    let dist = 0, allGeo = bars.every(hasGeo);
    if (allGeo) for (let i = 1; i < bars.length; i++) dist += distanceKm(bars[i - 1], bars[i]);
    $('routeDist').textContent = bars.length < 2 ? '再加幾間吧'
        : allGeo ? `共 ${bars.length} 攤・步行約 ${dist.toFixed(1)} km`
        : `共 ${bars.length} 攤（部分店家無座標，順序未最佳化）`;

    renderSchedule();

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

// ===== 網址分享 =====
// 把目前的篩選條件編碼進網址，貼給別人就會看到一樣的清單
function stateToUrl() {
    const p = new URLSearchParams();
    if (currentCity !== 'all') p.set('city', currentCity);
    const put = (id, key) => { const v = $(id).value; if (v && v !== 'all') p.set(key, v); };
    put('districtFilter', 'dist'); put('purposeFilter', 'purpose');
    put('priceFilter', 'price'); put('stateFilter', 'state'); put('sortFilter', 'sort');
    if (selectedTypes.size) p.set('types', [...selectedTypes].join(','));
    if (selectedTraits.size) p.set('traits', [...selectedTraits].join(','));
    const q = $('searchInput').value.trim();
    if (q) p.set('q', q);
    if (currentView !== 'list') p.set('view', currentView);
    const s = p.toString();
    return location.origin + location.pathname + (s ? '?' + s : '');
}

function applyUrlState() {
    const p = new URLSearchParams(location.search);
    if (!p.toString()) return;
    if (p.get('city')) currentCity = p.get('city');
    updateDistrictOptions();
    const set = (id, key) => { const v = p.get(key); if (v !== null) $(id).value = v; };
    set('districtFilter', 'dist'); set('purposeFilter', 'purpose');
    set('priceFilter', 'price'); set('stateFilter', 'state'); set('sortFilter', 'sort');
    if (p.get('types')) selectedTypes = new Set(p.get('types').split(',').filter(Boolean));
    if (p.get('traits')) selectedTraits = new Set(p.get('traits').split(',').filter(Boolean));
    if (p.get('q')) $('searchInput').value = p.get('q');
    if (p.get('view') === 'map') setView('map');
}

async function share() {
    const url = stateToUrl();
    try {
        await navigator.clipboard.writeText(url);
        toast('連結已複製，可以貼給酒友了 🍻');
    } catch (e) {
        // 沒有剪貼簿權限（或非 HTTPS）時，退而求其次讓使用者自己複製
        window.prompt('複製這段連結分享給酒友：', url);
    }
}

// ===== 地圖模式 =====
let map = null, markerLayer = null, mapReady = false, tileLayer = null;

const TILES = {
    dark:  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
};

function swapTiles(mode) {
    if (!mapReady || !tileLayer) return;
    map.removeLayer(tileLayer);
    tileLayer = L.tileLayer(TILES[mode] || TILES.dark, {
        attribution: '&copy; OpenStreetMap &copy; CARTO', subdomains: 'abcd', maxZoom: 19
    }).addTo(map);
}

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
    const mode = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    tileLayer = L.tileLayer(TILES[mode], {
        attribution: '&copy; OpenStreetMap &copy; CARTO', subdomains: 'abcd', maxZoom: 19
    }).addTo(map);
    // 台北一區就上百間，沒有聚合會擠成一團；沒載到 markercluster 就退回普通圖層
    markerLayer = (typeof L.markerClusterGroup === 'function')
        ? L.markerClusterGroup({
            maxClusterRadius: 45,
            showCoverageOnHover: false,
            spiderfyOnMaxZoom: true,
            iconCreateFunction: c => L.divIcon({
                html: `<div>${c.getChildCount()}</div>`,
                className: 'marker-cluster',
                iconSize: [40, 40]
            })
        })
        : L.layerGroup();
    markerLayer.addTo(map);
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
    const pr = $('priceFilter').value;
    const st = $('stateFilter').value;
    const sort = $('sortFilter').value;
    const q = $('searchInput').value.trim().toLowerCase();

    const filtered = BARS.filter(b => {
        const note = b.note || '';
        const matchCity = currentCity === 'all' || b.city === currentCity;
        const matchDistrict = d === 'all' || b.district === d;
        const matchPurpose = p === 'all' || (b.purpose || '').includes(p) || (p === '約會' && note.includes('約會'));
        // 酒類：選了就要符合其中任一種
        const matchType = !selectedTypes.size || [...selectedTypes].some(id => (b.type || '').includes(id));
        // 亮點：選了就要全部符合
        const matchTraits = [...selectedTraits].every(id => {
            const tag = TRAIT_TAGS.find(x => x.id === id);
            return tag ? tag.test(b) : true;
        });
        const matchPrice = pr === 'all' || b.price === Number(pr);
        const matchState = st === 'all' ||
            (st === 'open' && openState(b, now).state === 'open') ||
            (st === 'want' && isWant(b)) ||
            (st === 'visited' && isVisited(b)) ||
            (st === 'unvisited' && !isVisited(b));
        const haystack = [b.name, note, b.city, b.district, b.style, ...(b.awards || [])].filter(Boolean).join(' ').toLowerCase();
        const matchSearch = !q || haystack.includes(q);
        return matchCity && matchDistrict && matchPurpose && matchType && matchTraits && matchPrice && matchState && matchSearch;
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
    if (!$('listOverlay').hidden) renderList();
}

// ===== 事件 =====
// 卡片、詳細頁、路線列共用同一套 data-act 處理
function onActionClick(e) {
    const btn = e.target.closest('[data-act]');
    if (!btn) return false;
    e.stopPropagation();
    const act = btn.dataset.act;
    if (act === 'detail') { closeDetail(); openDetail(Number(btn.dataset.id)); return true; }
    if (act === 'move') { moveInRoute(btn.dataset.key, Number(btn.dataset.d)); return true; }
    if (act === 'card') { shareCard(BARS[Number(btn.dataset.id)]); return true; }
    if (act === 'edit') { const b = BARS[Number(btn.dataset.id)]; closeDetail(); openForm(b); return true; }
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
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!overlay.hidden) closeDetail();
    else if (!$('formOverlay').hidden) closeForm();     // 內含未儲存確認
    else if (!$('listOverlay').hidden) closeList();
    else if (!$('recapOverlay').hidden) closeRecap();
});

$('routeClear').addEventListener('click', () => {
    store.route = []; saveStore(); update();
    if (!$('listOverlay').hidden) renderList();
});
$('routeAuto').addEventListener('click', autoSortRoute);
$('viewList').addEventListener('click', () => setView('list'));
$('viewMap').addEventListener('click', () => setView('map'));

// 多選標籤
document.querySelector('.tag-filters').addEventListener('click', e => {
    const chip = e.target.closest('[data-chip]');
    if (chip && !chip.disabled) toggleChip(chip.dataset.chip, chip.dataset.id);
});

// 我的酒單
$('progressBtn').addEventListener('click', () => openList('visited'));
$('myListBtn').addEventListener('click', () => openList());
$('listClose').addEventListener('click', closeList);
$('listOverlay').addEventListener('click', e => { if (e.target === $('listOverlay')) closeList(); });
document.querySelector('.list-tabs').addEventListener('click', e => {
    const tab = e.target.closest('.list-tab');
    if (tab) { listTab = tab.dataset.tab; renderList(); }
});
$('listBody').addEventListener('click', e => {
    const el = e.target.closest('[data-list]');
    if (!el || el.disabled) return;
    const key = el.dataset.key, b = byKey[key];
    const action = el.dataset.list;
    if (action === 'open') { closeList(); if (b) openDetail(b._id); return; }
    if (action === 'up') return moveInRoute(key, -1);
    if (action === 'down') return moveInRoute(key, 1);
    if (action === 'remove') {
        if (listTab === 'want') delete store.want[key];
        else if (listTab === 'visited') delete store.visited[key];
        else { const i = store.route.indexOf(key); if (i >= 0) store.route.splice(i, 1); }
        saveStore(); renderList(); update();
    }
});
$('exportBtn').addEventListener('click', exportBackup);
$('importBtn').addEventListener('click', () => $('importFile').click());
$('importFile').addEventListener('change', e => {
    if (e.target.files && e.target.files[0]) importBackup(e.target.files[0]);
    e.target.value = '';
});

// 分享
$('shareBtn').addEventListener('click', share);

// 新增／編輯酒吧
$('addBtn').addEventListener('click', () => openForm());
$('formClose').addEventListener('click', () => closeForm());
// 表單不因點到背景而關閉：誤觸一次就整份資料不見，代價太大。
// 要關請按右上角 × 或 Esc，有未儲存內容時還會再確認一次。
$('barForm').addEventListener('submit', saveForm);
$('barForm').addEventListener('input', refreshForm);
$('barForm').addEventListener('change', refreshForm);
$('formCopy').addEventListener('click', copyDataJs);
$('formPush').addEventListener('click', pushToRepo);
$('ghSave').addEventListener('click', () => { saveGhFromForm(); setGhStatus('設定已儲存', 'ok'); });
$('ghTest').addEventListener('click', testGh);
$('ghClear').addEventListener('click', () => {
    saveGh({ repo: $('ghRepo').value.trim() || GH_DEFAULT_REPO, token: '' });
    $('ghToken').value = '';
    setGhStatus('權杖已清除', 'ok');
});
$('formDelete').addEventListener('click', () => { if (editingKey) deleteCustom(editingKey); });

// 主題、定位、隨機、年度回顧
$('themeBtn').addEventListener('click', toggleTheme);
$('locateBtn').addEventListener('click', locateMe);
$('randomBtn').addEventListener('click', randomPick);
$('recapBtn').addEventListener('click', openRecap);
$('recapClose').addEventListener('click', closeRecap);
$('recapOverlay').addEventListener('click', e => { if (e.target === $('recapOverlay')) closeRecap(); });
$('recapYear').addEventListener('change', renderRecap);

// 筆記：離開輸入框時自動存
modalContent.addEventListener('focusout', e => {
    const ta = e.target.closest('#noteInput');
    if (!ta) return;
    const key = ta.dataset.key;
    if (myNote(byKey[key]) === ta.value) return;      // 沒改就不動
    handleAction('note', key, ta.value);
    update();
    toast('筆記已儲存');
});

// ===== 啟動 =====
$('subtitle').textContent = `全台 ${BARS.length} 間酒友、脆友、老酒鬼推薦清單`;
initTheme();
applyUrlState();                   // 先套用網址帶來的篩選條件
renderCityNav();
updateDistrictOptions();
renderChips();
// 只綁篩選面板裡的控制項。先前是全頁掃描，連新增表單的 11 個輸入框都綁上了，
// 導致在表單裡每打一個字就重繪 222 張卡片，輸入嚴重卡頓。
document.querySelectorAll('.filter-panel select, .filter-panel input[type=text]')
    .forEach(el => el.addEventListener('input', update));
update();
setInterval(update, 60000);        // 每分鐘更新一次營業狀態

// ===== PWA：離線可用 =====
// 只有透過 http(s) 開啟才有 service worker，直接用 file:// 開檔不會註冊（瀏覽器限制）
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => { /* 註冊失敗不影響一般使用 */ });
    });
}
