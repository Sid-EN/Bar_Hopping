# 待補欄位檢查表

產生時間：2026/9/1 上午10:53:05

補資料的方式：點店名開 Google 地圖 → 抄下需要的欄位 → 回 `data.js` 找到該行加上去。
格式範例（欄位順序不拘，沒查到的就不要加）：

```js
{name: "某某 Bar", city: "台北市", district: "大安區", type: "經典", purpose: "一個人",
 price: 2, rating: 4.6, ratingCount: 320,
 address: "台北市大安區某某路100號", phone: "02-1234-5678",
 hours: "週二至週日 19:00–02:00（週一休）", note: "原本的註記保持不變"},
```

**price 對照**：1 = NT$400–700、2 = NT$700–1,200、3 = NT$1,200 以上
**hours 寫法**：程式看得懂「週二至週日 19:00–02:00（週一休）」「20:00–02:00（週五六至03:00，週一休）」這類寫法，
跨夜、公休日、週末延長都會自動判斷。寫不出來也沒關係，網頁會顯示「時間未知」。

---

## 總覽

| 縣市 | 總數 | 缺評分 | 缺價位 | 缺地址 | 缺時間 | 缺電話 |
|---|---|---|---|---|---|---|
| 台北市 | 119 | 119 | 116 | 116 | 116 | 118 |
| 新北市 | 6 | 6 | 6 | 6 | 6 | 6 |
| 基隆市 | 5 | 5 | 2 | 0 | 0 | 1 |
| 桃園市 | 9 | 8 | 1 | 0 | 0 | 1 |
| 新竹市 | 6 | 5 | 0 | 0 | 0 | 0 |
| 新竹縣 | 3 | 3 | 0 | 0 | 0 | 0 |
| 苗栗縣 | 2 | 2 | 0 | 1 | 0 | 1 |
| 台中市 | 13 | 13 | 0 | 0 | 0 | 11 |
| 彰化縣 | 3 | 3 | 0 | 1 | 1 | 1 |
| 南投縣 | 2 | 2 | 0 | 0 | 0 | 0 |
| 雲林縣 | 2 | 2 | 0 | 0 | 0 | 0 |
| 嘉義市 | 4 | 4 | 0 | 0 | 0 | 4 |
| 台南市 | 11 | 10 | 0 | 0 | 1 | 1 |
| 高雄市 | 10 | 3 | 0 | 0 | 0 | 1 |
| 屏東縣 | 3 | 3 | 0 | 0 | 0 | 1 |
| 宜蘭縣 | 5 | 5 | 0 | 0 | 1 | 1 |
| 花蓮縣 | 5 | 4 | 5 | 0 | 0 | 2 |
| 台東縣 | 5 | 4 | 5 | 0 | 0 | 3 |
| 澎湖縣 | 4 | 4 | 1 | 0 | 0 | 1 |
| 金門縣 | 5 | 5 | 4 | 0 | 0 | 1 |
| **全台** | **222** | **210** | **140** | **124** | **125** | **154** |

---

## 逐間清單

只列出有缺欄位的店家。已經齊全的不會出現在這裡。

### 台北市（119 間待補）

- [ ] [隧道](https://www.google.com/maps/search/?api=1&query=%E9%9A%A7%E9%81%93%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%85%A7%E6%B9%96%E5%8D%80) · 內湖區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [小後苑 大直](https://www.google.com/maps/search/?api=1&query=%E5%B0%8F%E5%BE%8C%E8%8B%91%20%E5%A4%A7%E7%9B%B4%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [如詩](https://www.google.com/maps/search/?api=1&query=%E5%A6%82%E8%A9%A9%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [BAR DI](https://www.google.com/maps/search/?api=1&query=BAR%20DI%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [INGE'S Bar & Grill](https://www.google.com/maps/search/?api=1&query=INGE'S%20Bar%20%26%20Grill%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [the Weekend Nights](https://www.google.com/maps/search/?api=1&query=the%20Weekend%20Nights%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%85%A7%E6%B9%96%E5%8D%80) · 內湖區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Art bar 藝術家的酒吧](https://www.google.com/maps/search/?api=1&query=Art%20bar%20%E8%97%9D%E8%A1%93%E5%AE%B6%E7%9A%84%E9%85%92%E5%90%A7%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%8C%97%E6%8A%95%E5%8D%80) · 北投區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [酉茶提案](https://www.google.com/maps/search/?api=1&query=%E9%85%89%E8%8C%B6%E6%8F%90%E6%A1%88%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A3%AB%E6%9E%97%E5%8D%80) · 士林區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Bar DAD](https://www.google.com/maps/search/?api=1&query=Bar%20DAD%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A3%AB%E6%9E%97%E5%8D%80) · 士林區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [wake up bar](https://www.google.com/maps/search/?api=1&query=wake%20up%20bar%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A3%AB%E6%9E%97%E5%8D%80) · 士林區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Dobar](https://www.google.com/maps/search/?api=1&query=Dobar%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A3%AB%E6%9E%97%E5%8D%80) · 士林區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Ole Rum Bar 2F](https://www.google.com/maps/search/?api=1&query=Ole%20Rum%20Bar%202F%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A3%AB%E6%9E%97%E5%8D%80) · 士林區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [覓到by bar mood](https://www.google.com/maps/search/?api=1&query=%E8%A6%93%E5%88%B0by%20bar%20mood%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [綠門老酒吧](https://www.google.com/maps/search/?api=1&query=%E7%B6%A0%E9%96%80%E8%80%81%E9%85%92%E5%90%A7%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Bar Outlander](https://www.google.com/maps/search/?api=1&query=Bar%20Outlander%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Bar ansleep Taipei](https://www.google.com/maps/search/?api=1&query=Bar%20ansleep%20Taipei%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [BAR 忠](https://www.google.com/maps/search/?api=1&query=BAR%20%E5%BF%A0%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [心白](https://www.google.com/maps/search/?api=1&query=%E5%BF%83%E7%99%BD%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Light House](https://www.google.com/maps/search/?api=1&query=Light%20House%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [奏 ZOU Listening Bar](https://www.google.com/maps/search/?api=1&query=%E5%A5%8F%20ZOU%20Listening%20Bar%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%90%8C%E5%8D%80) · 大同區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [小小間酒吧](https://www.google.com/maps/search/?api=1&query=%E5%B0%8F%E5%B0%8F%E9%96%93%E9%85%92%E5%90%A7%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%90%8C%E5%8D%80) · 大同區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Como Tú](https://www.google.com/maps/search/?api=1&query=Como%20T%C3%BA%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%90%8C%E5%8D%80) · 大同區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [ASABAN](https://www.google.com/maps/search/?api=1&query=ASABAN%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%90%8C%E5%8D%80) · 大同區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [小城外](https://www.google.com/maps/search/?api=1&query=%E5%B0%8F%E5%9F%8E%E5%A4%96%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%90%8C%E5%8D%80) · 大同區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [蟬 Bar](https://www.google.com/maps/search/?api=1&query=%E8%9F%AC%20Bar%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%90%8C%E5%8D%80) · 大同區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [玉露](https://www.google.com/maps/search/?api=1&query=%E7%8E%89%E9%9C%B2%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%90%8C%E5%8D%80) · 大同區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [BarWay](https://www.google.com/maps/search/?api=1&query=BarWay%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%90%8C%E5%8D%80) · 大同區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Wang Tea Taipei 有記名茶](https://www.google.com/maps/search/?api=1&query=Wang%20Tea%20Taipei%20%E6%9C%89%E8%A8%98%E5%90%8D%E8%8C%B6%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%90%8C%E5%8D%80) · 大同區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [同位素](https://www.google.com/maps/search/?api=1&query=%E5%90%8C%E4%BD%8D%E7%B4%A0%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%90%8C%E5%8D%80) · 大同區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Bitter Burro Cocktail Bar](https://www.google.com/maps/search/?api=1&query=Bitter%20Burro%20Cocktail%20Bar%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%90%8C%E5%8D%80) · 大同區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Tik & Sip Wine Bar](https://www.google.com/maps/search/?api=1&query=Tik%20%26%20Sip%20Wine%20Bar%20%E5%8F%B0%E5%8C%97%E5%B8%82%E8%90%AC%E8%8F%AF%E5%8D%80) · 萬華區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [桃花源](https://www.google.com/maps/search/?api=1&query=%E6%A1%83%E8%8A%B1%E6%BA%90%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E6%AD%A3%E5%8D%80) · 中正區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [萬華世界下午酒場](https://www.google.com/maps/search/?api=1&query=%E8%90%AC%E8%8F%AF%E4%B8%96%E7%95%8C%E4%B8%8B%E5%8D%88%E9%85%92%E5%A0%B4%20%E5%8F%B0%E5%8C%97%E5%B8%82%E8%90%AC%E8%8F%AF%E5%8D%80) · 萬華區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [DUO Taipei](https://www.google.com/maps/search/?api=1&query=DUO%20Taipei%20%E5%8F%B0%E5%8C%97%E5%B8%82%E8%90%AC%E8%8F%AF%E5%8D%80) · 萬華區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [老吧 Bar](https://www.google.com/maps/search/?api=1&query=%E8%80%81%E5%90%A7%20Bar%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Book ing](https://www.google.com/maps/search/?api=1&query=Book%20ing%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%90%8C%E5%8D%80) · 大同區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Bar Soft Cure](https://www.google.com/maps/search/?api=1&query=Bar%20Soft%20Cure%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Bar Turning Point](https://www.google.com/maps/search/?api=1&query=Bar%20Turning%20Point%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Mini Base 小喬室](https://www.google.com/maps/search/?api=1&query=Mini%20Base%20%E5%B0%8F%E5%96%AC%E5%AE%A4%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [澤山](https://www.google.com/maps/search/?api=1&query=%E6%BE%A4%E5%B1%B1%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [MUD Bar](https://www.google.com/maps/search/?api=1&query=MUD%20Bar%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Bar Impromptu](https://www.google.com/maps/search/?api=1&query=Bar%20Impromptu%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [銀座酒向](https://www.google.com/maps/search/?api=1&query=%E9%8A%80%E5%BA%A7%E9%85%92%E5%90%91%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Bar Gravit.on 烏寂重子](https://www.google.com/maps/search/?api=1&query=Bar%20Gravit.on%20%E7%83%8F%E5%AF%82%E9%87%8D%E5%AD%90%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [小谷](https://www.google.com/maps/search/?api=1&query=%E5%B0%8F%E8%B0%B7%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Bar 千華](https://www.google.com/maps/search/?api=1&query=Bar%20%E5%8D%83%E8%8F%AF%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [ETNA](https://www.google.com/maps/search/?api=1&query=ETNA%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Bar Kawa 川](https://www.google.com/maps/search/?api=1&query=Bar%20Kawa%20%E5%B7%9D%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [試營運](https://www.google.com/maps/search/?api=1&query=%E8%A9%A6%E7%87%9F%E9%81%8B%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Bar Yoshi 梄時](https://www.google.com/maps/search/?api=1&query=Bar%20Yoshi%20%E6%A2%84%E6%99%82%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Lounge Vino](https://www.google.com/maps/search/?api=1&query=Lounge%20Vino%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [HiBoRu](https://www.google.com/maps/search/?api=1&query=HiBoRu%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Bar春花](https://www.google.com/maps/search/?api=1&query=Bar%E6%98%A5%E8%8A%B1%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E6%AD%A3%E5%8D%80) · 中正區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Vent](https://www.google.com/maps/search/?api=1&query=Vent%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [故地](https://www.google.com/maps/search/?api=1&query=%E6%95%85%E5%9C%B0%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [洞香春](https://www.google.com/maps/search/?api=1&query=%E6%B4%9E%E9%A6%99%E6%98%A5%20%E5%8F%B0%E5%8C%97%E5%B8%82%E6%9D%BE%E5%B1%B1%E5%8D%80) · 松山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Honn Bar](https://www.google.com/maps/search/?api=1&query=Honn%20Bar%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [THE BAR酒吧](https://www.google.com/maps/search/?api=1&query=THE%20BAR%E9%85%92%E5%90%A7%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E5%B1%B1%E5%8D%80) · 中山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [M O. Bar](https://www.google.com/maps/search/?api=1&query=M%20O.%20Bar%20%E5%8F%B0%E5%8C%97%E5%B8%82%E6%9D%BE%E5%B1%B1%E5%8D%80) · 松山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Cooper](https://www.google.com/maps/search/?api=1&query=Cooper%20%E5%8F%B0%E5%8C%97%E5%B8%82%E6%9D%BE%E5%B1%B1%E5%8D%80) · 松山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [The Glasshouse](https://www.google.com/maps/search/?api=1&query=The%20Glasshouse%20%E5%8F%B0%E5%8C%97%E5%B8%82%E6%9D%BE%E5%B1%B1%E5%8D%80) · 松山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [異塵](https://www.google.com/maps/search/?api=1&query=%E7%95%B0%E5%A1%B5%20%E5%8F%B0%E5%8C%97%E5%B8%82%E6%9D%BE%E5%B1%B1%E5%8D%80) · 松山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Histoire 隅意](https://www.google.com/maps/search/?api=1&query=Histoire%20%E9%9A%85%E6%84%8F%20%E5%8F%B0%E5%8C%97%E5%B8%82%E6%9D%BE%E5%B1%B1%E5%8D%80) · 松山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [OriginBAR 源](https://www.google.com/maps/search/?api=1&query=OriginBAR%20%E6%BA%90%20%E5%8F%B0%E5%8C%97%E5%B8%82%E6%9D%BE%E5%B1%B1%E5%8D%80) · 松山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [台北酒驛](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E5%8C%97%E9%85%92%E9%A9%9B%20%E5%8F%B0%E5%8C%97%E5%B8%82%E6%9D%BE%E5%B1%B1%E5%8D%80) · 松山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [HI NE NI](https://www.google.com/maps/search/?api=1&query=HI%20NE%20NI%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E6%AD%A3%E5%8D%80) · 中正區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Bar M](https://www.google.com/maps/search/?api=1&query=Bar%20M%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E6%AD%A3%E5%8D%80) · 中正區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Arman](https://www.google.com/maps/search/?api=1&query=Arman%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E6%AD%A3%E5%8D%80) · 中正區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Staff Only Club](https://www.google.com/maps/search/?api=1&query=Staff%20Only%20Club%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%B8%AD%E6%AD%A3%E5%8D%80) · 中正區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [一茶一瓦](https://www.google.com/maps/search/?api=1&query=%E4%B8%80%E8%8C%B6%E4%B8%80%E7%93%A6%20%E5%8F%B0%E5%8C%97%E5%B8%82%E6%9D%BE%E5%B1%B1%E5%8D%80) · 松山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [IMBIBE](https://www.google.com/maps/search/?api=1&query=IMBIBE%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Bar Pulse](https://www.google.com/maps/search/?api=1&query=Bar%20Pulse%20%E5%8F%B0%E5%8C%97%E5%B8%82%E6%9D%BE%E5%B1%B1%E5%8D%80) · 松山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [寓曰](https://www.google.com/maps/search/?api=1&query=%E5%AF%93%E6%9B%B0%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [傷心酒店](https://www.google.com/maps/search/?api=1&query=%E5%82%B7%E5%BF%83%E9%85%92%E5%BA%97%20%E5%8F%B0%E5%8C%97%E5%B8%82%E6%9D%BE%E5%B1%B1%E5%8D%80) · 松山區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [三藩市](https://www.google.com/maps/search/?api=1&query=%E4%B8%89%E8%97%A9%E5%B8%82%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [BAR MOOD](https://www.google.com/maps/search/?api=1&query=BAR%20MOOD%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [OAK](https://www.google.com/maps/search/?api=1&query=OAK%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Cozy](https://www.google.com/maps/search/?api=1&query=Cozy%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [崎白湯屋](https://www.google.com/maps/search/?api=1&query=%E5%B4%8E%E7%99%BD%E6%B9%AF%E5%B1%8B%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [To Infinity & Beyond](https://www.google.com/maps/search/?api=1&query=To%20Infinity%20%26%20Beyond%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Kitty Taipei](https://www.google.com/maps/search/?api=1&query=Kitty%20Taipei%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [羊吧](https://www.google.com/maps/search/?api=1&query=%E7%BE%8A%E5%90%A7%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%BF%A1%E7%BE%A9%E5%8D%80) · 信義區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Bar Weekend](https://www.google.com/maps/search/?api=1&query=Bar%20Weekend%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [INDULGE](https://www.google.com/maps/search/?api=1&query=INDULGE%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [深杯子](https://www.google.com/maps/search/?api=1&query=%E6%B7%B1%E6%9D%AF%E5%AD%90%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Drizzle by Fourplay](https://www.google.com/maps/search/?api=1&query=Drizzle%20by%20Fourplay%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Monkie](https://www.google.com/maps/search/?api=1&query=Monkie%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Testing Room](https://www.google.com/maps/search/?api=1&query=Testing%20Room%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Cog & J](https://www.google.com/maps/search/?api=1&query=Cog%20%26%20J%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [unDer lab](https://www.google.com/maps/search/?api=1&query=unDer%20lab%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Lab](https://www.google.com/maps/search/?api=1&query=Lab%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [MONO MONO](https://www.google.com/maps/search/?api=1&query=MONO%20MONO%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Mizu Bistro](https://www.google.com/maps/search/?api=1&query=Mizu%20Bistro%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [YiYi 液藝](https://www.google.com/maps/search/?api=1&query=YiYi%20%E6%B6%B2%E8%97%9D%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [The Fridge bar](https://www.google.com/maps/search/?api=1&query=The%20Fridge%20bar%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%BF%A1%E7%BE%A9%E5%8D%80) · 信義區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [晨箔](https://www.google.com/maps/search/?api=1&query=%E6%99%A8%E7%AE%94%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Bar Between](https://www.google.com/maps/search/?api=1&query=Bar%20Between%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Bar Three Piece](https://www.google.com/maps/search/?api=1&query=Bar%20Three%20Piece%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%BF%A1%E7%BE%A9%E5%8D%80) · 信義區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Liowl](https://www.google.com/maps/search/?api=1&query=Liowl%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [ACDC Taipei](https://www.google.com/maps/search/?api=1&query=ACDC%20Taipei%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%BF%A1%E7%BE%A9%E5%8D%80) · 信義區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Knock Knock](https://www.google.com/maps/search/?api=1&query=Knock%20Knock%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [The Public House](https://www.google.com/maps/search/?api=1&query=The%20Public%20House%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [半路餐酒](https://www.google.com/maps/search/?api=1&query=%E5%8D%8A%E8%B7%AF%E9%A4%90%E9%85%92%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Bar Pine](https://www.google.com/maps/search/?api=1&query=Bar%20Pine%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [PUN](https://www.google.com/maps/search/?api=1&query=PUN%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [晃](https://www.google.com/maps/search/?api=1&query=%E6%99%83%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Sidebar](https://www.google.com/maps/search/?api=1&query=Sidebar%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [芏](https://www.google.com/maps/search/?api=1&query=%E8%8A%8F%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [SOIL](https://www.google.com/maps/search/?api=1&query=SOIL%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Suki Salon](https://www.google.com/maps/search/?api=1&query=Suki%20Salon%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Futura by TPH](https://www.google.com/maps/search/?api=1&query=Futura%20by%20TPH%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Zoo KeepeR](https://www.google.com/maps/search/?api=1&query=Zoo%20KeepeR%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Kashoku](https://www.google.com/maps/search/?api=1&query=Kashoku%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Bar Way Home](https://www.google.com/maps/search/?api=1&query=Bar%20Way%20Home%20%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80) · 大安區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [BBAR HINOKI](https://www.google.com/maps/search/?api=1&query=BBAR%20HINOKI%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%BF%A1%E7%BE%A9%E5%8D%80) · 信義區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [tei by OBOND](https://www.google.com/maps/search/?api=1&query=tei%20by%20OBOND%20%E5%8F%B0%E5%8C%97%E5%B8%82%E4%BF%A1%E7%BE%A9%E5%8D%80) · 信義區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [無 Wu (Nothingness)](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E5%8C%97%E5%B8%82%E4%BF%A1%E7%BE%A9%E5%8D%80%E5%85%89%E5%BE%A9%E5%8D%97%E8%B7%AF419-1%E8%99%9F1%E6%A8%93) · 信義區 — 缺 **評分、電話**
- [ ] [AHA Saloon](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80%E5%BE%A9%E8%88%88%E5%8D%97%E8%B7%AF%E4%BA%8C%E6%AE%B5138%E8%99%9F) · 大安區 — 缺 **評分**
- [ ] [MAD:MEN 面麵酒屋](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E5%8C%97%E5%B8%82%E5%A4%A7%E5%AE%89%E5%8D%80%E5%92%8C%E5%B9%B3%E6%9D%B1%E8%B7%AF%E4%B8%89%E6%AE%B568%E8%99%9F1%E6%A8%93) · 大安區 — 缺 **評分、電話**

### 新北市（6 間待補）

- [ ] [多崎作 — The Ferrymen](https://www.google.com/maps/search/?api=1&query=%E5%A4%9A%E5%B4%8E%E4%BD%9C%20%E2%80%94%20The%20Ferrymen%20%E6%96%B0%E5%8C%97%E5%B8%82%E6%B7%A1%E6%B0%B4%E5%8D%80) · 淡水區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [瀑布隔壁Bar](https://www.google.com/maps/search/?api=1&query=%E7%80%91%E5%B8%83%E9%9A%94%E5%A3%81Bar%20%E6%96%B0%E5%8C%97%E5%B8%82%E7%91%9E%E8%8A%B3%E5%8D%80) · 瑞芳區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Chill Home 邱宅](https://www.google.com/maps/search/?api=1&query=Chill%20Home%20%E9%82%B1%E5%AE%85%20%E6%96%B0%E5%8C%97%E5%B8%82%E6%A8%B9%E6%9E%97%E5%8D%80) · 樹林區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [CAJU](https://www.google.com/maps/search/?api=1&query=CAJU%20%E6%96%B0%E5%8C%97%E5%B8%82%E6%9D%BF%E6%A9%8B%E5%8D%80) · 板橋區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Bar Aku](https://www.google.com/maps/search/?api=1&query=Bar%20Aku%20%E6%96%B0%E5%8C%97%E5%B8%82%E6%9D%BF%E6%A9%8B%E5%8D%80) · 板橋區 — 缺 **評分、價位、地址、營業時間、電話**
- [ ] [Bar Ripple](https://www.google.com/maps/search/?api=1&query=Bar%20Ripple%20%E6%96%B0%E5%8C%97%E5%B8%82%E6%B0%B8%E5%92%8C%E5%8D%80) · 永和區 — 缺 **評分、價位、地址、營業時間、電話**

### 基隆市（5 間待補）

- [ ] [Bad Mama 黑媽](https://www.google.com/maps/search/?api=1&query=%E5%9F%BA%E9%9A%86%E5%B8%82%E4%BB%81%E6%84%9B%E5%8D%80%E5%AD%9D%E4%B8%80%E8%B7%AF34%E5%B7%B75%E8%99%9F) · 仁愛區 — 缺 **評分**
- [ ] [艾克猴 The Alcohol Bar](https://www.google.com/maps/search/?api=1&query=%E5%9F%BA%E9%9A%86%E5%B8%82%E4%BB%81%E6%84%9B%E5%8D%80%E5%BF%A0%E4%B8%80%E8%B7%AF3%E5%B7%B723%E8%99%9F) · 仁愛區 — 缺 **評分**
- [ ] [EAT WIN 食運糖水鋪](https://www.google.com/maps/search/?api=1&query=%E5%9F%BA%E9%9A%86%E5%B8%82%E4%BB%81%E6%84%9B%E5%8D%80%E4%BB%81%E5%9B%9B%E8%B7%AF13%E4%B9%8B1%E8%99%9F1%E6%A8%93) · 仁愛區 — 缺 **評分**
- [ ] [Squid Bar 魷魚啤酒吧](https://www.google.com/maps/search/?api=1&query=%E5%9F%BA%E9%9A%86%E5%B8%82%E4%BB%81%E6%84%9B%E5%8D%80%E6%84%9B%E4%B8%89%E8%B7%AF98%E5%B7%B718%E8%99%9F1%E6%A8%93) · 仁愛區 — 缺 **評分、價位、電話**
- [ ] [避風港精釀 Haven Taproom & Bottle Shop](https://www.google.com/maps/search/?api=1&query=%E5%9F%BA%E9%9A%86%E5%B8%82%E4%BB%81%E6%84%9B%E5%8D%80%E6%84%9B%E4%B8%89%E8%B7%AF98%E5%B7%B75%E8%99%9F1%E6%A8%93) · 仁愛區 — 缺 **評分、價位**

### 桃園市（8 間待補）

- [ ] [陸小曼 Lounge Bar](https://www.google.com/maps/search/?api=1&query=%E6%A1%83%E5%9C%92%E5%B8%82%E4%B8%AD%E5%A3%A2%E5%8D%80%E4%B8%AD%E5%A4%AE%E8%A5%BF%E8%B7%AF%E4%B8%80%E6%AE%B576%E5%B7%B733%E8%99%9F) · 中壢區 — 缺 **評分**
- [ ] [NOT Bar & bistro](https://www.google.com/maps/search/?api=1&query=%E6%A1%83%E5%9C%92%E5%B8%82%E4%B8%AD%E5%A3%A2%E5%8D%80%E5%BE%A9%E8%88%88%E8%B7%AF28%E8%99%9F) · 中壢區 — 缺 **評分**
- [ ] [老石上](https://www.google.com/maps/search/?api=1&query=%E6%A1%83%E5%9C%92%E5%B8%82%E4%B8%AD%E5%A3%A2%E5%8D%80%E4%B8%AD%E5%8C%97%E8%B7%AF%E4%BA%8C%E6%AE%B5211%E8%99%9F) · 中壢區 — 缺 **評分**
- [ ] [DramYouth Whisky Bar](https://www.google.com/maps/search/?api=1&query=%E6%A1%83%E5%9C%92%E5%B8%82%E4%B8%AD%E5%A3%A2%E5%8D%80%E5%A4%A7%E5%90%8C%E8%B7%AF70%E8%99%9F2%E6%A8%93) · 中壢區 — 缺 **評分、價位、電話**
- [ ] [藏匿 Hide out Lounge Bar & Bistro](https://www.google.com/maps/search/?api=1&query=%E6%A1%83%E5%9C%92%E5%B8%82%E4%B8%AD%E5%A3%A2%E5%8D%80%E4%B8%AD%E7%BE%8E%E8%B7%AF76-10%E8%99%9F) · 中壢區 — 缺 **評分**
- [ ] [醉生夢室](https://www.google.com/maps/search/?api=1&query=%E6%A1%83%E5%9C%92%E5%B8%82%E4%B8%AD%E5%A3%A2%E5%8D%80%E4%B8%AD%E8%8F%AF%E8%B7%AF%E4%B8%80%E6%AE%B5859%E8%99%9F) · 中壢區 — 缺 **評分**
- [ ] [Jellyfish Bistro & Bar 水母餐酒館](https://www.google.com/maps/search/?api=1&query=%E6%A1%83%E5%9C%92%E5%B8%82%E6%A1%83%E5%9C%92%E5%8D%80%E5%BE%A9%E8%88%88%E8%B7%AF262%E8%99%9F) · 桃園區 — 缺 **評分**
- [ ] [BAR SPEAKEASY II](https://www.google.com/maps/search/?api=1&query=%E6%A1%83%E5%9C%92%E5%B8%82%E6%A1%83%E5%9C%92%E5%8D%80%E5%85%AC%E5%85%AD%E8%A1%9721%E8%99%9F) · 桃園區 — 缺 **評分**

### 新竹市（5 間待補）

- [ ] [Bar Back Cafe](https://www.google.com/maps/search/?api=1&query=%E6%96%B0%E7%AB%B9%E5%B8%82%E6%9D%B1%E5%8D%80%E6%B0%91%E6%AC%8A%E8%B7%AF111%E5%B7%B71%E8%99%9F) · 東區 — 缺 **評分**
- [ ] [Tender Cocktail Bar](https://www.google.com/maps/search/?api=1&query=%E6%96%B0%E7%AB%B9%E5%B8%82%E5%8C%97%E5%8D%80%E7%B6%93%E5%9C%8B%E8%B7%AF%E4%B8%80%E6%AE%B5542%E8%99%9F2%E6%A8%93) · 北區 — 缺 **評分**
- [ ] [BAR SPEAKEASY](https://www.google.com/maps/search/?api=1&query=%E6%96%B0%E7%AB%B9%E5%B8%82%E5%8C%97%E5%8D%80%E7%B6%93%E5%9C%8B%E8%B7%AF%E4%BA%8C%E6%AE%B5587%E8%99%9F) · 北區 — 缺 **評分**
- [ ] [Bar Approx. 將進酒](https://www.google.com/maps/search/?api=1&query=%E6%96%B0%E7%AB%B9%E5%B8%82%E6%9D%B1%E5%8D%80%E9%87%91%E5%B1%B1%E8%A1%9719%E8%99%9F2%E6%A8%93) · 東區 — 缺 **評分**
- [ ] [inBush – bar, café, flower](https://www.google.com/maps/search/?api=1&query=%E6%96%B0%E7%AB%B9%E5%B8%82%E6%9D%B1%E5%8D%80%E9%95%B7%E6%98%A5%E8%A1%9760%E8%99%9F) · 東區 — 缺 **評分**

### 新竹縣（3 間待補）

- [ ] [Bar Balcony 陽台酒吧](https://www.google.com/maps/search/?api=1&query=%E6%96%B0%E7%AB%B9%E7%B8%A3%E7%AB%B9%E5%8C%97%E5%B8%82%E5%8B%9D%E5%88%A9%E4%B8%83%E8%A1%97%E4%B8%80%E6%AE%B5248%E8%99%9F) · 竹北市 — 缺 **評分**
- [ ] [Bar Neat](https://www.google.com/maps/search/?api=1&query=%E6%96%B0%E7%AB%B9%E7%B8%A3%E7%AB%B9%E5%8C%97%E5%B8%82%E8%8E%8A%E6%95%AC%E4%B8%83%E8%A1%9743%E8%99%9F) · 竹北市 — 缺 **評分**
- [ ] [橋下2.0 Restaurant & Bar](https://www.google.com/maps/search/?api=1&query=%E6%96%B0%E7%AB%B9%E7%B8%A3%E7%AB%B9%E5%8C%97%E5%B8%82%E5%98%89%E8%B1%90%E5%8C%97%E8%B7%AF62%E8%99%9F) · 竹北市 — 缺 **評分**

### 苗栗縣（2 間待補）

- [ ] [上癮餐酒館 Obsession Bar](https://www.google.com/maps/search/?api=1&query=%E8%8B%97%E6%A0%97%E7%B8%A3%E7%AB%B9%E5%8D%97%E9%8E%AE%E5%85%AC%E5%8C%97%E4%B8%80%E8%B7%AF151%E8%99%9F) · 竹南鎮 — 缺 **評分**
- [ ] [紳OWL餐酒館](https://www.google.com/maps/search/?api=1&query=%E7%B4%B3OWL%E9%A4%90%E9%85%92%E9%A4%A8%20%E8%8B%97%E6%A0%97%E7%B8%A3%E9%A0%AD%E4%BB%BD%E5%B8%82) · 頭份市 — 缺 **評分、地址、電話**

### 台中市（13 間待補）

- [ ] [Vender 販](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E4%B8%AD%E5%B8%82%E8%A5%BF%E5%8D%80%E4%BA%94%E6%AC%8A%E8%A5%BF%E5%9B%9B%E8%A1%97118%E8%99%9F) · 西區 — 缺 **評分**
- [ ] [栖 Habitatto](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E4%B8%AD%E5%B8%82%E8%A5%BF%E5%8D%80%E6%B0%91%E6%AC%8A%E8%B7%AF217%E5%B7%B722%E8%99%9F) · 西區 — 缺 **評分、電話**
- [ ] [Bar Saito 齋藤](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E4%B8%AD%E5%B8%82%E8%A5%BF%E5%8D%80%E8%8F%AF%E7%BE%8E%E8%A1%97412-1%E8%99%9F) · 西區 — 缺 **評分、電話**
- [ ] [安慰劑臺中店 Placebo Taichung](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E4%B8%AD%E5%B8%82%E8%A5%BF%E5%B1%AF%E5%8D%80%E6%96%87%E5%BF%83%E8%B7%AF%E4%B8%89%E6%AE%B591-9%E8%99%9F) · 西屯區 — 缺 **評分**
- [ ] [Svart Hull 黑洞](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E4%B8%AD%E5%B8%82%E8%A5%BF%E5%B1%AF%E5%8D%80%E4%BD%95%E5%8E%9D%E8%A1%9786%E8%99%9F) · 西屯區 — 缺 **評分、電話**
- [ ] [好吧 Goût Bar](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E4%B8%AD%E5%B8%82%E8%A5%BF%E5%8D%80%E5%AD%98%E4%B8%AD%E8%A1%9746%E8%99%9F) · 西區 — 缺 **評分、電話**
- [ ] [SOAK Taichung](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E4%B8%AD%E5%B8%82%E8%A5%BF%E5%B1%AF%E5%8D%80%E6%B2%B3%E5%8D%97%E8%B7%AF%E4%B8%89%E6%AE%B5120%E8%99%9F7%E6%A8%93) · 西屯區 — 缺 **評分、電話**
- [ ] [Draft Land Taichung](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E4%B8%AD%E5%B8%82%E8%A5%BF%E5%8D%80%E8%8B%B1%E6%89%8D%E8%B7%AF534%E8%99%9F%20PARK2%E8%8D%89%E6%82%9F%E5%BB%A3%E5%A0%B4%20B1) · 西區 — 缺 **評分、電話**
- [ ] [Bar 明治](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E4%B8%AD%E5%B8%82%E8%A5%BF%E5%8D%80%E4%B8%AD%E7%BE%8E%E8%A1%97399%E8%99%9F) · 西區 — 缺 **評分、電話**
- [ ] [KOLEN Cuisine & Drink](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E4%B8%AD%E5%B8%82%E5%8C%97%E5%8D%80%E5%BF%A0%E5%A4%AA%E6%9D%B1%E8%B7%AF113%E8%99%9F) · 北區 — 缺 **評分、電話**
- [ ] [舟舟 Bar Boat](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E4%B8%AD%E5%B8%82%E8%A5%BF%E5%8D%80%E7%B2%BE%E8%AA%A0%E4%B8%80%E8%A1%974%E8%99%9F) · 西區 — 缺 **評分、電話**
- [ ] [青AO](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E4%B8%AD%E5%B8%82%E8%A5%BF%E5%8D%80%E7%BE%8E%E6%9D%91%E8%B7%AF%E4%B8%80%E6%AE%B5335%E8%99%9F) · 西區 — 缺 **評分、電話**
- [ ] [Matches](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E4%B8%AD%E5%B8%82%E8%A5%BF%E5%8D%80%E6%9D%B1%E8%88%88%E8%B7%AF%E4%B8%89%E6%AE%B5238%E8%99%9F2%E6%A8%93) · 西區 — 缺 **評分、電話**

### 彰化縣（3 間待補）

- [ ] [GUTS Cocktail Bar 蓋茲](https://www.google.com/maps/search/?api=1&query=%E5%BD%B0%E5%8C%96%E7%B8%A3%E5%BD%B0%E5%8C%96%E5%B8%82%E5%90%89%E7%A5%A5%E8%A1%973%E8%99%9F) · 彰化市 — 缺 **評分**
- [ ] [勝豐吧 Home Bar Lukang](https://www.google.com/maps/search/?api=1&query=%E5%BD%B0%E5%8C%96%E7%B8%A3%E9%B9%BF%E6%B8%AF%E9%8E%AE%E6%B0%91%E6%97%8F%E8%B7%AF131%E8%99%9F) · 鹿港鎮 — 缺 **評分**
- [ ] [老屋舊時光茶酒所](https://www.google.com/maps/search/?api=1&query=%E8%80%81%E5%B1%8B%E8%88%8A%E6%99%82%E5%85%89%E8%8C%B6%E9%85%92%E6%89%80%20%E5%BD%B0%E5%8C%96%E7%B8%A3%E5%BD%B0%E5%8C%96%E5%B8%82) · 彰化市 — 缺 **評分、地址、營業時間、電話**

### 南投縣（2 間待補）

- [ ] [Michael Bar](https://www.google.com/maps/search/?api=1&query=%E5%8D%97%E6%8A%95%E7%B8%A3%E5%8D%97%E6%8A%95%E5%B8%82%E5%A4%A7%E5%90%8C%E8%A1%97148%E8%99%9F) · 南投市 — 缺 **評分**
- [ ] [漫。島美式餐酒館 ChillBar](https://www.google.com/maps/search/?api=1&query=%E5%8D%97%E6%8A%95%E7%B8%A3%E5%9F%94%E9%87%8C%E9%8E%AE%E4%B8%AD%E5%B1%B1%E8%B7%AF%E4%BA%8C%E6%AE%B5436%E8%99%9F) · 埔里鎮 — 缺 **評分**

### 雲林縣（2 間待補）

- [ ] [艾澤拉斯小酒館](https://www.google.com/maps/search/?api=1&query=%E9%9B%B2%E6%9E%97%E7%B8%A3%E6%96%97%E5%85%AD%E5%B8%82%E5%85%A7%E7%92%B0%E8%B7%AF772%E8%99%9F) · 斗六市 — 缺 **評分**
- [ ] [Moon Lounge 月廊天台酒吧](https://www.google.com/maps/search/?api=1&query=%E9%9B%B2%E6%9E%97%E7%B8%A3%E8%99%8E%E5%B0%BE%E9%8E%AE%E4%BF%A1%E7%BE%A9%E8%B7%AF69%E8%99%9F10%E6%A8%93) · 虎尾鎮 — 缺 **評分**

### 嘉義市（4 間待補）

- [ ] [秉森酒室 Bar Bingsen](https://www.google.com/maps/search/?api=1&query=%E5%98%89%E7%BE%A9%E5%B8%82%E8%A5%BF%E5%8D%80%E6%9E%97%E6%A3%AE%E8%A5%BF%E8%B7%AF528%E8%99%9F) · 西區 — 缺 **評分、電話**
- [ ] [COP bar - Cocktails Of Pioneers](https://www.google.com/maps/search/?api=1&query=%E5%98%89%E7%BE%A9%E5%B8%82%E8%A5%BF%E5%8D%80%E8%A5%BF%E9%96%80%E8%A1%9754-1%E8%99%9F) · 西區 — 缺 **評分、電話**
- [ ] [斗酒 BAR DOUJIOU](https://www.google.com/maps/search/?api=1&query=%E5%98%89%E7%BE%A9%E5%B8%82%E6%9D%B1%E5%8D%80%E6%88%90%E4%BB%81%E8%A1%9782%E8%99%9F) · 東區 — 缺 **評分、電話**
- [ ] [CASA bar](https://www.google.com/maps/search/?api=1&query=%E5%98%89%E7%BE%A9%E5%B8%82%E6%9D%B1%E5%8D%80%E5%85%89%E5%BD%A9%E8%A1%97132%E8%99%9F) · 東區 — 缺 **評分、電話**

### 台南市（10 間待補）

- [ ] [Bar TCRC 前科累累俱樂部](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E5%8D%97%E5%B8%82%E4%B8%AD%E8%A5%BF%E5%8D%80%E6%96%B0%E7%BE%8E%E8%A1%97117%E8%99%9F) · 中西區 — 缺 **評分**
- [ ] [Phowa 頗瓦](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E5%8D%97%E5%B8%82%E4%B8%AD%E8%A5%BF%E5%8D%80%E6%96%B0%E7%BE%8E%E8%A1%97121%E8%99%9F) · 中西區 — 缺 **評分**
- [ ] [酣呷餐酒 The Han-Jia](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E5%8D%97%E5%B8%82%E5%8D%97%E5%8D%80%E8%A5%BF%E9%96%80%E8%B7%AF%E4%B8%80%E6%AE%B5669%E8%99%9F) · 南區 — 缺 **評分**
- [ ] [Moonrock](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E5%8D%97%E5%B8%82%E5%8C%97%E5%8D%80%E6%88%90%E5%8A%9F%E8%B7%AF22%E5%B7%B742%E5%BC%8413%E8%99%9F) · 北區 — 缺 **評分**
- [ ] [赤崁中藥行](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E5%8D%97%E5%B8%82%E4%B8%AD%E8%A5%BF%E5%8D%80%E8%B5%A4%E5%B5%8C%E8%A1%9745%E5%B7%B73%E8%99%9F) · 中西區 — 缺 **評分**
- [ ] [Bar Mozaiku 馬賽克酒吧](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E5%8D%97%E5%B8%82%E5%8C%97%E5%8D%80%E5%9C%8B%E8%8F%AF%E8%A1%97%E5%9B%9B%E6%AE%B55%E5%B7%B715%E8%99%9F) · 北區 — 缺 **評分**
- [ ] [籠裏 Bar Lonely](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E5%8D%97%E5%B8%82%E4%B8%AD%E8%A5%BF%E5%8D%80%E6%B0%91%E7%94%9F%E8%B7%AF%E4%B8%80%E6%AE%B5157%E5%B7%B711%E8%99%9F1%E6%A8%93) · 中西區 — 缺 **評分**
- [ ] [Bar INFU](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E5%8D%97%E5%B8%82%E4%B8%AD%E8%A5%BF%E5%8D%80%E5%BF%A0%E7%BE%A9%E8%B7%AF%E4%BA%8C%E6%AE%B584%E5%B7%B763%E8%99%9F) · 中西區 — 缺 **評分、營業時間**
- [ ] [Taleland 樂島](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E5%8D%97%E5%B8%82%E4%B8%AD%E8%A5%BF%E5%8D%80%E4%B8%AD%E6%AD%A3%E8%B7%AF150%E5%B7%B75%E8%99%9F) · 中西區 — 缺 **評分、電話**
- [ ] [在島之後 After Island](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E5%8D%97%E5%B8%82%E6%9D%B1%E5%8D%80%E6%9D%B1%E5%AF%A7%E8%B7%AF201%E5%B7%B7121%E8%99%9F) · 東區 — 缺 **評分**

### 高雄市（3 間待補）

- [ ] [MALTAIL](https://www.google.com/maps/search/?api=1&query=%E9%AB%98%E9%9B%84%E5%B8%82%E5%89%8D%E9%87%91%E5%8D%80%E4%B8%AD%E8%8F%AF%E5%9B%9B%E8%B7%AF349%E4%B9%8B1%E8%99%9F) · 前金區 — 缺 **評分**
- [ ] [Marc L³](https://www.google.com/maps/search/?api=1&query=%E9%AB%98%E9%9B%84%E5%B8%82%E5%89%8D%E9%87%91%E5%8D%80%E4%BB%81%E7%BE%A9%E8%A1%97231%E8%99%9F) · 前金區 — 缺 **評分、電話**
- [ ] [Marsalis Bar 馬沙里斯爵士酒館](https://www.google.com/maps/search/?api=1&query=%E9%AB%98%E9%9B%84%E5%B8%82%E6%96%B0%E8%88%88%E5%8D%80%E4%B8%AD%E6%AD%A3%E5%9B%9B%E8%B7%AF71%E8%99%9F2%E6%A8%93) · 新興區 — 缺 **評分**

### 屏東縣（3 間待補）

- [ ] [30M BAR](https://www.google.com/maps/search/?api=1&query=%E5%B1%8F%E6%9D%B1%E7%B8%A3%E6%81%86%E6%98%A5%E9%8E%AE%E6%81%86%E5%8D%97%E8%B7%AF125%E5%B7%B76%E8%99%9F) · 恆春鎮 — 缺 **評分**
- [ ] [恆春3000啤酒博物館](https://www.google.com/maps/search/?api=1&query=%E5%B1%8F%E6%9D%B1%E7%B8%A3%E6%81%86%E6%98%A5%E9%8E%AE%E8%8D%89%E5%9F%94%E8%B7%AF29-1%E8%99%9F) · 恆春鎮 — 缺 **評分、電話**
- [ ] [如煙人文餐酒館](https://www.google.com/maps/search/?api=1&query=%E5%B1%8F%E6%9D%B1%E7%B8%A3%E5%B1%8F%E6%9D%B1%E5%B8%82%E5%8B%9D%E7%BE%A9%E5%B7%B710%E8%99%9F%EF%BC%88%E5%8B%9D%E5%88%A9%E6%98%9F%E6%9D%91%E5%85%A7%EF%BC%89) · 屏東市 — 缺 **評分**

### 宜蘭縣（5 間待補）

- [ ] [The Roof 190 星空酒吧](https://www.google.com/maps/search/?api=1&query=%E5%AE%9C%E8%98%AD%E7%B8%A3%E7%BE%85%E6%9D%B1%E9%8E%AE%E7%AB%99%E6%9D%B1%E8%B7%AF190%E8%99%9F%EF%BC%88%E6%9D%91%E5%8D%B4%E5%9C%8B%E9%9A%9B%E6%BA%AB%E6%B3%89%E9%85%92%E5%BA%97%E9%A0%82%E6%A8%93%EF%BC%89) · 羅東鎮 — 缺 **評分**
- [ ] [Maison 迴家酒館](https://www.google.com/maps/search/?api=1&query=%E5%AE%9C%E8%98%AD%E7%B8%A3%E7%BE%85%E6%9D%B1%E9%8E%AE%E7%B4%94%E7%B2%BE%E8%B7%AF%E4%B8%89%E6%AE%B5256%E8%99%9F) · 羅東鎮 — 缺 **評分、營業時間、電話**
- [ ] [飲廊 Corridor](https://www.google.com/maps/search/?api=1&query=%E5%AE%9C%E8%98%AD%E7%B8%A3%E7%BE%85%E6%9D%B1%E9%8E%AE%E5%85%AC%E6%AD%A3%E8%A1%9756%E8%99%9F) · 羅東鎮 — 缺 **評分**
- [ ] [西江水坊](https://www.google.com/maps/search/?api=1&query=%E5%AE%9C%E8%98%AD%E7%B8%A3%E7%A4%81%E6%BA%AA%E9%84%89%E5%BE%B7%E9%99%BD%E8%B7%AF24%E5%B7%B76%E8%99%9F) · 礁溪鄉 — 缺 **評分**
- [ ] [Bar 清溪（上善若水）](https://www.google.com/maps/search/?api=1&query=%E5%AE%9C%E8%98%AD%E7%B8%A3%E7%A4%81%E6%BA%AA%E9%84%89%E4%B8%AD%E5%B1%B1%E8%B7%AF%E4%BA%8C%E6%AE%B5156%E8%99%9F) · 礁溪鄉 — 缺 **評分**

### 花蓮縣（5 間待補）

- [ ] [和嶼 Peace Isle](https://www.google.com/maps/search/?api=1&query=%E8%8A%B1%E8%93%AE%E7%B8%A3%E8%8A%B1%E8%93%AE%E5%B8%82%E5%85%89%E5%BE%A9%E8%A1%9780%E8%99%9F1%E6%A8%93) · 花蓮市 — 缺 **評分、價位**
- [ ] [島東譯電所](https://www.google.com/maps/search/?api=1&query=%E8%8A%B1%E8%93%AE%E7%B8%A3%E8%8A%B1%E8%93%AE%E5%B8%82%E5%8C%96%E9%81%93%E8%B7%AF18-1%E8%99%9F) · 花蓮市 — 缺 **評分、價位、電話**
- [ ] [牧羊人酒吧 Bar Shepherd](https://www.google.com/maps/search/?api=1&query=%E8%8A%B1%E8%93%AE%E7%B8%A3%E6%96%B0%E5%9F%8E%E9%84%89%E5%A4%A7%E6%BC%A2%E6%9D%91%E4%B8%83%E6%98%9F%E8%A1%979%E8%99%9F) · 新城鄉 — 缺 **評分、價位**
- [ ] [琴詩酒吧 Ginsman Bar](https://www.google.com/maps/search/?api=1&query=%E8%8A%B1%E8%93%AE%E7%B8%A3%E8%8A%B1%E8%93%AE%E5%B8%82%E6%96%B0%E6%B8%AF%E8%A1%9762%E8%99%9F) · 花蓮市 — 缺 **價位**
- [ ] [奉珠吧](https://www.google.com/maps/search/?api=1&query=%E8%8A%B1%E8%93%AE%E7%B8%A3%E5%90%89%E5%AE%89%E9%84%89%E7%A6%8F%E8%88%88%E5%85%AD%E8%A1%9738%E8%99%9F) · 吉安鄉 — 缺 **評分、價位、電話**

### 台東縣（5 間待補）

- [ ] [Bar Cynic 吧蟲](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E6%9D%B1%E7%B8%A3%E5%8F%B0%E6%9D%B1%E5%B8%82%E5%92%8C%E5%B9%B3%E8%A1%97118%E8%99%9F) · 台東市 — 缺 **評分、價位、電話**
- [ ] [吧東 Bar tung](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E6%9D%B1%E7%B8%A3%E5%8F%B0%E6%9D%B1%E5%B8%82%E7%A6%8F%E5%BB%BA%E8%B7%AF307%E8%99%9F) · 台東市 — 缺 **評分、價位、電話**
- [ ] [康杯 COMEBACK](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E6%9D%B1%E7%B8%A3%E5%8F%B0%E6%9D%B1%E5%B8%82%E7%A6%8F%E5%BB%BA%E8%B7%AF217%E8%99%9F) · 台東市 — 缺 **評分、價位**
- [ ] [寶桑吧（The Gaya Hotel）](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E6%9D%B1%E7%B8%A3%E5%8F%B0%E6%9D%B1%E5%B8%82%E6%96%B0%E7%94%9F%E8%B7%AF169%E8%99%9F) · 台東市 — 缺 **評分、價位**
- [ ] [喨哥Beer](https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E6%9D%B1%E7%B8%A3%E5%8F%B0%E6%9D%B1%E5%B8%82%E4%B8%AD%E6%AD%A3%E8%B7%AF191%E8%99%9F) · 台東市 — 缺 **價位、電話**

### 澎湖縣（4 間待補）

- [ ] [Beacon 說酒人](https://www.google.com/maps/search/?api=1&query=%E6%BE%8E%E6%B9%96%E7%B8%A3%E9%A6%AC%E5%85%AC%E5%B8%82%E8%87%A8%E6%B5%B7%E8%B7%AF15-3%E8%99%9F) · 馬公市 — 缺 **評分、電話**
- [ ] [弗洛伊得音樂·餐酒 Freud Bar](https://www.google.com/maps/search/?api=1&query=%E6%BE%8E%E6%B9%96%E7%B8%A3%E9%A6%AC%E5%85%AC%E5%B8%82%E6%96%B0%E7%94%9F%E8%B7%AF2%E8%99%9F) · 馬公市 — 缺 **評分**
- [ ] [蓓菈 BELLA 調酒專賣所](https://www.google.com/maps/search/?api=1&query=%E6%BE%8E%E6%B9%96%E7%B8%A3%E9%A6%AC%E5%85%AC%E5%B8%82%E6%96%87%E5%BA%B7%E8%A1%9716%E8%99%9F) · 馬公市 — 缺 **評分、價位**
- [ ] [Swave 微浮酒吧](https://www.google.com/maps/search/?api=1&query=%E6%BE%8E%E6%B9%96%E7%B8%A3%E9%A6%AC%E5%85%AC%E5%B8%82%E6%96%B0%E5%BA%97%E8%B7%AF197%E8%99%9FB2%EF%BC%88%E7%A6%8F%E6%9C%8B%E5%96%9C%E4%BE%86%E7%99%BB%EF%BC%89) · 馬公市 — 缺 **評分**

### 金門縣（5 間待補）

- [ ] [夢酒館 MOJO](https://www.google.com/maps/search/?api=1&query=%E9%87%91%E9%96%80%E7%B8%A3%E9%87%91%E5%9F%8E%E9%8E%AE%E8%8E%92%E5%85%89%E8%B7%AF110%E5%B7%B74%E8%99%9F) · 金城鎮 — 缺 **評分**
- [ ] [金城飯店｜金門威士忌博物館](https://www.google.com/maps/search/?api=1&query=%E9%87%91%E9%96%80%E7%B8%A3%E9%87%91%E5%9F%8E%E9%8E%AE%E4%B8%AD%E8%88%88%E8%B7%AF67%E5%B7%B710-1%E8%99%9F) · 金城鎮 — 缺 **評分、價位**
- [ ] [遇見 Meet Bar](https://www.google.com/maps/search/?api=1&query=%E9%87%91%E9%96%80%E7%B8%A3%E9%87%91%E5%AF%A7%E9%84%89%E7%92%B0%E5%B3%B6%E5%8C%97%E8%B7%AF%E4%B8%80%E6%AE%B5369%E8%99%9F1%E6%A8%93) · 金寧鄉 — 缺 **評分、價位**
- [ ] [帕堤 Let's party](https://www.google.com/maps/search/?api=1&query=%E9%87%91%E9%96%80%E7%B8%A3%E9%87%91%E5%9F%8E%E9%8E%AE%E8%A5%BF%E6%B5%B7%E8%B7%AF%E4%B8%89%E6%AE%B572%E5%B7%B73%E5%BC%845%E8%99%9F) · 金城鎮 — 缺 **評分、價位**
- [ ] [談醺室](https://www.google.com/maps/search/?api=1&query=%E9%87%91%E9%96%80%E7%B8%A3%E9%87%91%E5%9F%8E%E9%8E%AE%E8%8E%92%E5%85%89%E8%B7%AF118%E8%99%9F) · 金城鎮 — 缺 **評分、價位、電話**
