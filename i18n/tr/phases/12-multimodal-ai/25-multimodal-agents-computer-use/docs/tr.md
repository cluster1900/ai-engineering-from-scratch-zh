# Multimodal ajanlar ve bilgisayar kullanımı (Capstone)

> 2026 yılı sınır ürünü bir çok modüllü ajan: it can read screenshots、click buttons、 browse web UI、 fill form,并端到端 complete workflows。SeeClick 和 CogAgent(2024) GUI-grounding primitives proves──Ferret-UI  mobile has increased──ChartAgent  charts'in kullanımı için görsel araç kullanımı ‒VisualWebArena 和 AgentVista ‒2026) ‒ frontiers ‒ benchmarks, ve hatta Gemini 3 Pro 和 Claude Opus 4.7 ‒AgentVista'nın zor görevlerinin da yüzde 30'u kadar ‒ Capstone 汇总 Fase 12'nin başlıca kısmı: yüksek çözünürlüklü VLM) ‒Reasoning ‒accept tool ‒ LLM) ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒   ‒ ‒     ‒                                    

**Type:** Capstone
**语言：**Python(stdlib、action schema + agent döngüsü iskelet)
**Prerequisites:** Phase 12 · 05（LLaVA）、Phase 12 · 09（Qwen-VL JSON）、Phase 14（Agent Engineering）
**Time:** 约 240 分钟

## Öğrenme hedefi
- 设计一个多型代理循环:perceive → reason → act → observe → repeat──
- 构建一个GUI grounding output schema(click coordinates、type text、scroll、drag),让VLM 能以 JSON发发出──
- Sadece ekran görüntüsü ajanları, erişilebilirlik ağacı ajanları ve hibrit ajanları karşılaştırın.
- Küçük bir VisualWebArena parçası üzerinde ayar Multimodal ajan referans değerlendirme

## 问题
Bir rezervasyon sitesi iş akışı: "15 Nisan için Tokyo'ya bir uçak bul bana, 800 dolarlık bir koridor koltuğu, rezervasyon yap".

Multimodal ajan 需要:

1. 获取浏览器的截图──
2. Ekran çekimi + URL + hedef 解析为计划──
3. 发出结构化行动:click(在 x,y) 、type "Tokyo"(在元素 E) 、滚动下滑、选择(radio按) ⋅
4. Bu eylem, tarayıcıya uygulanır.
5. 观察新状态(下一个截图)。
6. Görev tamamlanana kadar 重复

Her adım bir çok modüllü VLM çağrısıdır. VLM çıkışı çözülebilir JSON olmalıdır. Hatalar adımlar arasından oluşur.

## 概念
### GUI yerleştirme  ilkel

GUI yerleştirme: 给定一个屏幕截图 和一条自然语言指示,输出要点击的 (x, y) koordinat(或其他动作)

SeeClick(arXiv:2401.10935) ilk büyüklükte açık sonuç: sintetik + gerçek GUI verileri içinde ince ayarlanmış bir VLM, düz metin işaretleri 输出坐标──有效──

CogAgent ((arXiv:2312.08914) yoğun UI'ler için 1120x1120 yüksek çözünürlüklü kodlama artışı göstermiştir.

Ferret-UI(arXiv:2404.05719) mobil UI'lere odaklanmıştır,并与iOS erişilebilirlik verileri 集成──

Çıktı biçimi genellikle JSON:

```json
{"action": "click", "x": 384, "y": 220, "element_desc": "Search button"}
```

`element_desc`Geri kazanmaya yardımcı olur: Eğer koordinatlar ekran görüntüleri arasında hareket ederse, semantik ipucu sistemi yeniden yerleştirir.

### Eylem düzenlemeleri

Bir tipik eylem şeması vardır 6-10 tür eylem türü vardır:

- `click`(x, y)
- `type`(seks, x?, y?)
- `scroll`: (yön, miktar)
- `drag`(x0, y0, x1, y1)
- `select`: (option_index)
- `hover`(x, y)
- `navigate`- Evet .
- `wait`(ms)
- `done`: (Başarısı, açıklama)

Ajan her adım bir eylem gönderir. Browser paketleri 执行并返回新状态──

### 仅截图 vs 可访问性树

两种输入方式:

- Ekran çekimi: tam görüntü, yapısal bilgi yok.
- Erişilebilirlik ağacı: yapılandırılmış DOM / iOS erişilebilirlik bilgileri。 yerleşim için güvenilir; ağaç için uygundur 可用的地方。
- Hibrit: ikisi de var, ağaç kullanmak atomik eylemlerin güvenilir temeli olarak, ekran görüntüsü kullanmak  semantik bağlamı sağlamak ⋅

Üretim ajanları 在可能时使用混合──浏览器自动化(Selenium + erişilebilirlik)

### Uzun uzayda hafıza

Bir 20 adımlı iş akışı 20 张 ekran görüntüsü üretir. VLM'in bağlamı 很快就会被填满.

- Özet zinciri: 5 adımdan sonra, olup bitenleri bir bütün olarak, eski ekran görüntüleri bırakın.
- Skip-frame:保留第一张、最后一张,以及每第 3 张屏幕截图──
- Araç kayıtlı günlüğü: eylemleri gerçekleştirin, tamamlanmış içeriğin metin günlüğünü koruyun; eski ekran görüntüleri yeniden görmeyin。

Claude'un bilgisayar kullanımı API kullan log model. Daha basit, daha güvenilir.

### Görsel araç kullanımı

ChartAgent(arXiv:2510.04514) Çarşın anlama için görsel araç kullanımı:crop、zoom、OCR、调用外部检测──agent "crop to region (100, 200, 300, 400) can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can be can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can can be can can can can can can can can can can can can can can can can can can can can can be can can can can can can can

Bu örneği genel hale getirebilir: işaretleme çağrısı, bölge notasyonu ve dış algılama araçları aynı  çıkış araç çağrısına, alım yapılandırılmış yanıt  şemalarına uymaktadır.

### 2026 referans değerleri

- ScreenSpot-Pro── Yaklaşık 1k web ekran görüntüsü  GUI yerleşimi  Open SOTA Qwen2.5-VL-72B  Yaklaşık 85%──Frontier  Yaklaşık 90%──
- VisualWebArena。Ende-to-end web görevleri(şapı、forum、bilimler)。Açık SOTA ≈20%─Gemini 3 Pro ≈27%─
- AgentVista(arXiv:2602.23166)──2026'da en zorlanan referans──12 alanın gerçekçi çalışma akışları──Sınır modelleri kazanmak 27-40%; açık modeller 10-20%──
- WebArena / WebShop── daha önceki referanslar; sınır 和──

### Neden hala zor?

Ajan 性能瓶:

1. 细粒度 görsel yerleştirme. "Klik küçük X" 经常在移动解析下失败.
2. Uzun vadede planlama. 10 eylemden sonra, ajan hedefinden uzaklaşır.
3. Hata kurtarma── Bir kez tıklayın 失败(错误 düğmesi) 当,检测 + 恢复很少出现在训练有素数据 中──
4. Sayfa çapındaki bağlamı──在表或长形式 之间跳转会丢失状态──

Araştırma yönleri: bellek mimarileri, açık bir yeniden planlama, çok yönlü doğrulama, eylem başarısının ekran görüntüsü ile karşılaştırılması için kullanılır)

### Başta taş inşa-o

Capstone görevi: bir bilgisayar kullanımı ajanı oluşturmak, bu mümkün:

1. 读取 rezervasyon sitesi sahte sayfasının HTML + ekran görüntüsü。
2. 规划 çok adımlı bir dizi:search → select → fill form → submit。
3. 发发出与行动方案匹配的 JSON 行动──
4. On görevli bir bölümde belirlenmiş bir değerlendirme.

Bu dersi  provides scaffold code, easy to expand for real browser 😇


```figure
mm-agent-loop
```

## Kullan
`code/main.py`- Taşlı bir heykel.

- Eylem şeması  JSON tanımlama  10 个 eylem)。
- 作为 dict 的模拟浏览器状态──
- Ajan kemiri:devleti al, hareket gönder, uygula, kemir.
- 10 görevli mini-benchmark (sentetik sayfalar), sonundan sonuna kadar başarıyı ölçmek için kullanılır.
- İşlem başarısızlık sırasında hata kurtarma hokusu

## - Söyle.
本 ders 生成 `outputs/skill-multimodal-agent-designer.md` Bilgisayar kullanım ürününü belirlemek, tam bir ajan döngüsünü tasarlamak, bellek stratejisi, yerleştirme modunu ve beklenen referans puanını oluşturmak.

## 练习
1. Kullanım`screenshot_region`araç ((crop + zoom) genişletme eylem şeması── hangi görevler fayda sağlayacak?

2. 阅读 AgentVista(arXiv:2602.23166)── Description of the hardest task category, as well as why frontier models still fail―

3. Uzun uzayda hafıza sıkıştırma: Design a summary-chain,保留 ≤4 张 live screenshots, logged 数量不限。

4. Bir hata kurtarma hokusu oluştur: İşlem başarısız olduğunda düğme bulunamadı)

5. Sadece ekran görüntüsüyle karşılaştırın Claude 4.7 hibrid ekran görüntüsü + erişilebilirlik ağacı Qwen2.5-VL 10  web görevleri  上 の表现 ・・・ hangi görevler 谁赢?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| GUI grounding | "Click coordinates" | Model 在 screenshot 上针对 instruction 的 target 输出 (x,y) |
| Action schema | "Tool definitions" | 有效 actions（click、type、scroll、drag）的 JSON description |
| Accessibility tree | "Structured DOM" | 来自 browser/iOS APIs 的 machine-readable UI hierarchy |
| Hybrid agent | "Screenshot + tree" | 同时使用 image 和 structured info；比单独使用任一者更可靠 |
| Visual tool use | "Zoom/crop/detect" | Agent 在 plan 中途调用 external vision tools（OCR、detection） |
| Summary-chain | "Memory compression" | 周期性 text summaries 替代很长的 screenshot history |
| VisualWebArena | "E2E web bench" | 2024 benchmark，用于 end-to-end web tasks |
| AgentVista | "2026 hard bench" | 12-domain realistic workflows；即使 Gemini 3 Pro 也只有约 30% |

## 延伸阅读
- [Cheng et al. — SeeClick (arXiv:2401.10935)](https://arxiv.org/abs/2401.10935)
- [Hong et al. — CogAgent (arXiv:2312.08914)](https://arxiv.org/abs/2312.08914)
- [You et al. — Ferret-UI (arXiv:2404.05719)](https://arxiv.org/abs/2404.05719)
- [ChartAgent (arXiv:2510.04514)](https://arxiv.org/abs/2510.04514)
- [Koh et al. — VisualWebArena (arXiv:2401.13649)](https://arxiv.org/abs/2401.13649)
- [AgentVista (arXiv:2602.23166)](https://arxiv.org/abs/2602.23166)
