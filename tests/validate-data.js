#!/usr/bin/env node
/**
 * data.js 資料校驗：手動新增酒吧時打錯格式，這裡會擋下來。
 * 不需要任何套件，也不需要網路。
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const src = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');
const { BARS, PRICE_TIERS } = new Function(src + '; return { BARS, PRICE_TIERS };')();

// app.js 的營業時間解析器，抽出來重複使用，確保校驗跟實際行為一致
const appSrc = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const parseHours = new Function(
    appSrc.slice(appSrc.indexOf('const DAY_CH'), appSrc.indexOf('// 目前營業狀態')) +
    '; return parseHours;')();

const CITIES = ['台北市', '新北市', '基隆市', '桃園市', '新竹市', '新竹縣', '苗栗縣', '台中市',
                '彰化縣', '南投縣', '雲林縣', '嘉義市', '嘉義縣', '台南市', '高雄市', '屏東縣',
                '宜蘭縣', '花蓮縣', '台東縣', '澎湖縣', '金門縣', '連江縣'];
const TYPES = ['經典', '特調', '經典特調', '啤酒'];
const PURPOSES = ['一個人', '聚會', '聚會或一個人'];
const STATUSES = ['CLOSED_PERMANENTLY', 'CLOSED_TEMPORARILY'];
const KNOWN_KEYS = new Set(['name', 'city', 'district', 'type', 'purpose', 'style', 'price', 'budget',
                            'address', 'phone', 'hours', 'lat', 'lng', 'rating', 'ratingCount',
                            'awards', 'special', 'status', 'note', 'friend', '_id']);

const errors = [];
const warnings = [];
const seen = new Map();
const seenNorm = new Map();

// 忽略大小寫、空白與常見標點後比對，抓出「Bar Weekend」與「BAR  Weekend」這種實質重複
const normName = s => String(s || '').toLowerCase().replace(/[\s'’`．.·、，,\-_–—&＆()（）]/g, '');

BARS.forEach((b, i) => {
    const at = `第 ${i + 1} 筆「${b.name || '(無店名)'}」`;

    if (!b.name || typeof b.name !== 'string') errors.push(`${at}：缺少 name`);
    if (!CITIES.includes(b.city)) errors.push(`${at}：city「${b.city}」不在已知縣市清單`);

    const key = `${b.name}|${b.city}`;
    if (seen.has(key)) errors.push(`${at}：與第 ${seen.get(key) + 1} 筆重複（同名同縣市）`);
    else seen.set(key, i);

    const nkey = `${normName(b.name)}|${b.city}`;
    if (seenNorm.has(nkey) && !seen.has(key)) {
        errors.push(`${at}：與第 ${seenNorm.get(nkey) + 1} 筆「${BARS[seenNorm.get(nkey)].name}」看起來是同一間`);
    } else if (!seenNorm.has(nkey)) seenNorm.set(nkey, i);

    if (b.type !== undefined && !TYPES.includes(b.type)) errors.push(`${at}：type「${b.type}」不合法，須為 ${TYPES.join('/')}`);
    if (b.purpose !== undefined && !PURPOSES.includes(b.purpose)) errors.push(`${at}：purpose「${b.purpose}」不合法`);
    if (b.price !== undefined && ![1, 2, 3].includes(b.price)) errors.push(`${at}：price 須為 1、2 或 3`);
    if (b.status !== undefined && !STATUSES.includes(b.status)) errors.push(`${at}：status「${b.status}」不合法`);

    if (b.rating !== undefined) {
        if (typeof b.rating !== 'number' || b.rating < 0 || b.rating > 5) errors.push(`${at}：rating 須為 0~5 的數字`);
    }
    if (b.ratingCount !== undefined && (!Number.isInteger(b.ratingCount) || b.ratingCount < 0)) {
        errors.push(`${at}：ratingCount 須為非負整數`);
    }
    if (b.ratingCount !== undefined && b.rating === undefined) warnings.push(`${at}：有 ratingCount 卻沒有 rating`);

    // 座標：必須成對出現，且落在台灣範圍內
    const hasLat = b.lat !== undefined, hasLng = b.lng !== undefined;
    if (hasLat !== hasLng) errors.push(`${at}：lat 與 lng 必須成對出現`);
    if (hasLat && hasLng) {
        if (b.lat < 21.5 || b.lat > 26.5 || b.lng < 118 || b.lng > 122.2) {
            errors.push(`${at}：座標 (${b.lat}, ${b.lng}) 超出台灣範圍`);
        }
    }

    if (b.awards !== undefined && (!Array.isArray(b.awards) || b.awards.some(a => typeof a !== 'string'))) {
        errors.push(`${at}：awards 須為字串陣列`);
    }
    if (b.special !== undefined && typeof b.special !== 'boolean') errors.push(`${at}：special 須為 true/false`);

    // 營業時間寫得出來、但程式看不懂時提醒（不算錯誤，網頁會顯示「時間未知」）
    if (b.hours && !parseHours(b.hours)) warnings.push(`${at}：hours「${b.hours}」無法解析，網頁會顯示「時間未知」`);

    for (const k of Object.keys(b)) {
        if (!KNOWN_KEYS.has(k)) warnings.push(`${at}：出現未知欄位「${k}」（拼錯了嗎？）`);
    }
});

// 同地址或同電話代表很可能是同一間店用了不同名稱（各家媒體命名常不一致），
// 例如「Chance Bar 勸世吧」與「無心戒酒互助會-成都分會」其實是同一個地方。
const addrKey = a => String(a || '').replace(/[\s台臺]/g, '').replace(/^\d{3,5}/, '');
const seenAddr = new Map(), seenPhone = new Map();
BARS.forEach((b, i) => {
    if (b.address) {
        const k = addrKey(b.address);
        if (seenAddr.has(k)) warnings.push(`第 ${i + 1} 筆「${b.name}」與「${BARS[seenAddr.get(k)].name}」地址相同，是否為同一間店？`);
        else seenAddr.set(k, i);
    }
    if (b.phone) {
        const k = b.phone.replace(/\D/g, '');
        if (k.length >= 8) {
            if (seenPhone.has(k)) warnings.push(`第 ${i + 1} 筆「${b.name}」與「${BARS[seenPhone.get(k)].name}」電話相同，是否為同一間店？`);
            else seenPhone.set(k, i);
        }
    }
});

// PRICE_TIERS 檢查
for (const t of [1, 2, 3]) {
    if (!PRICE_TIERS[t] || !PRICE_TIERS[t].range) errors.push(`PRICE_TIERS 缺少第 ${t} 級的 range`);
}

console.log(`檢查 ${BARS.length} 間酒吧、${new Set(BARS.map(b => b.city)).size} 個縣市`);
if (warnings.length) {
    console.log(`\n⚠️  ${warnings.length} 個提醒：`);
    warnings.forEach(w => console.log('   ' + w));
}
if (errors.length) {
    console.log(`\n❌ ${errors.length} 個錯誤：`);
    errors.forEach(e => console.log('   ' + e));
    process.exit(1);
}
console.log('\n✅ 資料格式全部正確');
