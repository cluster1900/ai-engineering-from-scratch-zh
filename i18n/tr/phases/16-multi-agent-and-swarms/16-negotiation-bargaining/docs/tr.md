# 协商与议价

> Agent 会协商资源、价格、任务分配和条款──2026 yılının referansiyel göstergesi 集合已明确:NegotiationArena (arXiv:2402.05863) 显示,LLM'ler kişi manipülasyonu yaparak desperation) gelirleri %20 oranında artıracak; "Törleşme yeteneklerini ölçmek" (arXiv:2402.15813) 显示, alıcı satıcıya göre daha zor, ölçek yardımcı olamıyor; onların**OG-Narrator**(deterministik teklif üreticisi + LLM anlatıcısı) %26.67% 提升至88.88% 成交率; Büyük ölçekli özerk müzakere yarışması (arXiv:2503.06416)  yaklaşık 180k kez müzakere edildi, bulundu **chain-of-thought-concealing**BTİ'nin bir kurum olarak seçilen ve kurum olarak seçilen kişiler için, bir kurum olarak seçilen ve kurum olarak seçilen kişiler için, bir kurum olarak seçilen kişiler için, bir kurum olarak seçilen kişiler için, bir kurum olarak seçilen kişiler için, bir kurum olarak seçilen kişiler için, bir kurum olarak seçilen kişiler için, bir kurum olarak seçilen kişiler için, bir kurum olarak seçilenler için, bir kurum olarak seçilenler için, bir kurum olarak seçilenler için, bir kurum olarak seçilenler için, bir kurum olarak seçilenler için, bir kurum olarak seçilenler için, bir kurum olarak seçilenler için, bir kurum olarak seçilenler için, bir kurum olarak seçilenler için, bir kurum olarak seçilenler için, bir kurum olarak seçilenler için, bir kurum olarak seçilenler için, bir kurum olarak seçilenler için, bir kurum olarak seçilenler için, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir kurum olarak, bir

**类型：**Öğrenim + yapı
**语言：**Python (stdlib)
**前置要求：**16 · 02 aşaması (FIPA-ACL Mirası), 16 · 09 aşaması (Parallel Swarm Networks)
**时间：**75 dakika kadar .

## 问题

İki ajan fiyat anlaşması gerekiyor. Eğer sadece dilden gelen bir istekle 2024-2026 yıllarındaki LLM'lerin müzakere edilen sonuç oranları şaşırtıcı derecede düşüktür.

根本问题在于,LLM 混了两工作:决定报价和叙述报价――OG-Narrator 将两者分离:deterministic offer generator 计算数值移动;LLM 仅负责叙述――成交率跃升至约89%――

Bu, klasik bir çok ajanı oluşturan bir mekanizma olarak ortaya çıkarılmıştır.

## 概念

### Bir bölüm anlamak Sözleşme Ağ

Smith 1980'in Sözleşme Net Protokolü: bir **manager**广播 **call for proposals (cfp)**- ...**bidders**Kullanıcılar teklifini içeren**propose**mesajlar 响应;manager 选择获胜者,并向获胜者发送 **accept-proposal**, Başarısızlara gönder**reject-proposal**❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖**refuse**(biyer teklifini reddetmiştir)`fipa-contract-net`etkileşim protokolü.

### Neden OG-Narrator kazanır ?

"Dil Modellerinin pazarlık yeteneklerini ölçmek" (arXiv:2402.15813)  observar到:

- LLM'ler  sık sık bozan fiyat kuralları 
- 它们的扎很差 ((çıkışlı ilk teklif kabul; karşı teklif; stratejik değil, sembolik para kullanmak)
-  Sadece ölçekle  bu sorunları düzeltemez.  Daha büyük modeller daha güvenilir bir dil oluşturacak, ama stratejik hatalar benzer.

OG-Narrator 分解:

```
           ┌──────────────────┐        ┌──────────────────┐
  state  → │ offer generator  │ price → │  LLM narrator    │ → message
           │  (deterministic) │        │  (writes the     │
           │                  │        │   human-style    │
           └──────────────────┘        │   accompaniment) │
                                       └──────────────────┘
```

teklif üreticisi klasik bir müzakere stratejisi:Rubinstein pazarlama modeli, Zeuthen stratejisi veya fiyatın etrafında basit bir şey için bir şey için bir şey için bir şey için bir şey için bir şey yapılması.

Çılık oranı yükseldi çünkü:
- 价格保持在谈判区内──
- Anchorlar stratejik, duygusal değil.
- LLM Yapmayı İyi Yapmak:

### Aren 发现

ArXiv:2402.05863  provided规范 benchmark──核心发现:

- LLM'ler kişileri kullanmakla yapılabilir. Cuma günü bunu satmak için umutsuzluğa düşüyorum.
- 公平/合作型 agenti 会被对抗型 agenti利用; savunma açıkça karşı duruşlara ihtiyaç duyar.
- %40 oranında karşılaştırma senaryolarında karşılaştırma oranı eşitsiz sonuçlar elde etti.

Bu, kötü bir danışmanlık değil. Bunun yerine, insan gibi, kullanılabilir kısımlar dahil olmak üzere, çok fazla danışmanlık yapılıyor.

### Düşünce zinciri 藏藏

Büyük ölçekli özerk müzakere yarışması (arXiv:2503.06416) birçok LLM stratejisi üzerinde yaklaşık 180 bin kez müzakere edildi.

- Eğer bir ajan açık görünen bir çizik çubuğunda dışarı çıksa sadece gideceğim$75; my reservation price is $70'e kadar, ben de okuyacağım.
- 胜者私下计算策略;输出通道只包含优惠和最低限度的必要叙述──

Bu klasik oyun teorisi. Aumann 1976                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

工程结论:将私用scratchpad bağlamı ve kamuoyunun mesaj bağlamı 分离──这不是可选项──

### Bhattacharya et al. 2025  model 排名

Harvard müzakere projesine dayanan bir görüşme, Batna'nın saygısı ve karşılıklı çıkarları:

- **Llama-3**Aralıklı işlem konusunda en etkili olan anlaşma oranı + ödeme.
- **Claude-3**Bu, en güçlü müzakereci.
- **GPT-4**En adil olan, farklı karşılaşmalarda ödeme farkı en küçük olan.

Bu 2025 yılındaki hızlı bir görüntüdür. Önemli olan hangi model 2026 yılındaki 4 aylık kazanç değil, farklı temel modellerdir.

### Net + LLM  Sözleşme yoluyla görev dağıtımı

Sözleşme Net 在 LLM çoklu ajan 中的现代复用:

1. Yönetimci ajanı görevleri birimlere ayırır.
2. usage任务描述向工人代理 广播 `cfp`- Evet.
3. Her işçi bir teklifte geri döner:`(price, eta, confidence)`, fiyatı token, hesap ünitesi veya dolar olabilir.
4. Yöneticisi 选择获胜者 (单个或多个,取决于任务)
5. reddedilen işçiler diğer görevleri yerine getirmek üzere özgürdürler.

Bu, 100'den fazla işçiye genişletebilir, çünkü koordinasyon tarzı senkroni sohbet değil yayın ve cevaplama biçimidir.

### LLM-Stakeholders Interactive Negotiation

NeurIPS 2024 (https://proceedings.neurips.cc/paper_files/paper/2024/file/984dd3db213db2d1454a163b65b84d08-Paper-Datasets_and_Benchmarks_Track.pdf) 带有 **secret scores**和 **minimum-acceptance thresholds**Bu, iki taraflı kongreye kadar Kuzey Kore koalisyonlarının oluşumunun genelleşmesiyle ilgilidir. Bu, farklı işçi kapasiteleri olan üretim görev pazarıyla ilgilidir.

### anlatma vs. mekanizma 规则

Tüm 2024-2026 yılları için yapılan müzakereler arasında, uyumlu inşaat kuralları şunlardır:

> 让LLM 负责叙述──不要让LLM 计算提供──

Eğer teklif 需要一个数字 (数字) 价格,ETA,数量) olursa, müzakere durumunun belirginliğine göre, bunu oluşturur ve LLM'nin oluşturulmasını sağlar. Eğer teklif 需要一个提案结构 (task decomposition, role assignment) olursa, LLM'nin hazırlanmasına izin verir, ancak göndermeden önce şema 验证并进行约束检――


```figure
a5-og-narrator
```

## Yapın onu.

`code/main.py`实现了:

- `ContractNetManager`- Evet .`ContractNetTask`- Evet .`Bid` yöneticisi + teklif verenleri,广播 cfp, önerileri toplamak, görev vermek,
- `og_narrator_bargain(state, rng)` OG-Narrator alıcı: 面向 midpoint 的决定主义 Zeuthen tarzı ihsanı。
- `seller_response(state, rng)` Deterministik satıcı karşı teklif politikası ((两种风格的结构性基础真理)
- `naive_llm_bargain(state, rng)` 模拟全LLM pazarlamacı:以高变量 选择价格,且经常落在 ZOPA 之外──
- Ölçüm: 1000 deneme sırasında, her deneme sırasında rezervasyon fiyatlarını yeniden ölçmek için.

运行:

```
python3 code/main.py
```

预期输出:naive-LLM anlaşma oranı 约65-75%;OG-Narrator anlaşma oranı 约85-95%;15-25 个百分点的差就是将提供-生成与叙述 分解开来的结构优势――此外还会输出一个包含三个投标者和一个任务的合同网任务市场分配示例――

## Kullan

`outputs/skill-bargainer-designer.md`设计一个议价协议:谁生成报价 (Deterministic) 谁负责叙述 (Deterministic) 谁负责叙述 (Deterministic) 谁负责叙述 (Deterministic) 谁负责叙述 (Deterministic) 谁负责描述 (Deterministic) 谁负责叙述 (Deterministic) 谁负责描述 (Deterministic) 谁负责描述 (Deterministic) 谁负责描述 (Deterministic) 谁负责描述 (Deterministic) 谁负责描述 (Deterministic) 谁负责描述 (Deterministic) 谁负责描述 (Deterministic) 谁负责描述 (Deterministic) 谁负责描述 (Deterministic) 谁负责描述 (Deterministic) 谁负责描述 (Deterministic) 谁负责描述 (Deterministic) 谁负责描述 (Deterministic) 谁负责负责描述 (Deterministic) 谁负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责负责

## Yayınla

生产议价 kontrol listesini:

- **分离 scratchpad。**Özel devlet asla karşı tarafın bağlamına giremez.
- **Deterministic offer generation。**Fiyatlar, miktarlar, ETA'lar: hesaplama, acele etme.
- **验证所有 incoming offers**Yapılandırma ile uyumlu değil mi?
- **限制 rounds。**Maksimum 3-5 tur; deadlock 时升级给调解员──
- **持续衡量 deal rate 和 payoff variance。**İşlem oranı, genellikle hızlı akış veya karşı taraflı saldırı olarak görülür.
- **记录所有 rejected proposals** ve belirleyici mantıkları¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

## 练习

1. 运行  İşlem`code/main.py`❖ OG-Narrator'ın anlaşma oranının naif-LLM'den daha yüksek olduğunu doğrula.
2.  gerçekleştirmek **persona-based payoff improvement**Bu hafta kişilik satın almak için umutsuzluk içinde olan bir alıcı, teklif üreticisi, anlaşma oranı veya ödeme değişecek mi?
3. 实现-chain-of-thought **concealment**Bu yüzden, bir kişiyi bir diğerinden uzaklaştırmak için, bir kişiyi bir diğerinden uzaklaştırmak için, bir kişiyi bir diğerinden uzaklaştırmak için, bir kişiyi uzaklaştırmak için, bir kişiyi uzaklaştırmak için, bir kişiyi uzaklaştırmak için, bir kişiyi uzaklaştırmak için, bir kişiyi uzaklaştırmak için, bir kişiyi uzaklaştırmak için, bir kişiyi uzaklaştırmak için, bir kişiyi uzaklaştırmak için, bir kişiyi uzaklaştırmak için, bir kişiyi uzaklaştırmak için, bir kişiyi uzaklaştırmak için, bir kişiyi uzaklaştırmak için, bir kişiyi uzaklaştırmak için, bir kişiyi uzaklaştırmak için, bir kişiyi uzaklaştırmak için, bir kişiyi uzaklaştırmak için, bir kişiyi uzaklaştırmak için, bir kişiyi uzaklaştırmak için, bir kişiyi uzaklaştırmak için, bir kişiyi korumak için, bir kişiyi korumak için, bir kişiyi korumak için, bir kişiyi korumak için, bir kişiyi korumak için, bir kişiyi korumak için, bir kişiyi korumak için, bir kişiyi korumak için, bir kişiyi korumak için, bir kişiyi korumak için, bir kişiyi korumak için, bir kişiyi korumak için, bir kişiyi sağlayabilir.
4. Bu nedenle, tüm teklifler rezervi aşırınca, yöneticiler en düşük fiyat ve en yüksek kalite arasında nasıl karar verirler?
5. Bhattacharya et al. 2025  Harvard müzakere projesi hakkında  指标的内容──实现两个不同风格的讨价价价标人(侵略性与公平)──衡量对称和不对称对称下的收益差异──

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| Contract Net | “任务市场” | Smith 1980，FIPA 1996。cfp + propose + accept/reject。规范任务市场。 |
| ZOPA | “Zone of possible agreement” | buyer 最高价与 seller 最低价之间的重叠区间。其外部的 offers 无法成交。 |
| BATNA | “Best alternative to a negotiated agreement” | 如果本次交易失败，你的后备方案。它设定你的 reservation price。 |
| OG-Narrator | “Offer generator + narrator” | 分解：deterministic offer，LLM narration。 |
| Zeuthen strategy | “Risk-minimizing concession” | 根据风险限制让步的经典 offer-generator。 |
| Rubinstein bargaining | “Alternating-offer equilibrium” | 带 discounting 的 infinite-horizon bargaining 的 game-theoretic model。 |
| CoT concealment | “隐藏你的推理” | arXiv:2503.06416 的获胜者保留 private scratchpads；public channel 只显示 offer。 |
| Persona manipulation | “情绪姿态” | arXiv:2402.05863：从 desperation/urgency personas 获得约 20% payoff gain。 |

## 延伸阅读

- [NegotiationArena](https://arxiv.org/abs/2402.05863) referans değerleri; kişi manipülasyonu
- [Measuring Bargaining Abilities of Language Models](https://arxiv.org/abs/2402.15813) OG-Narrator, ve satın alıcı-satucudan sert 结果
- [Large-Scale Autonomous Negotiation Competition](https://arxiv.org/abs/2503.06416)   180k 次协商; düşünce zinciri gizlenme 获胜
- [LLM-Stakeholders Interactive Negotiation (NeurIPS 2024)](https://proceedings.neurips.cc/paper_files/paper/2024/file/984dd3db213db2d1454a163b65b84d08-Paper-Datasets_and_Benchmarks_Track.pdf)Gizli hizmetlerle ilgili birçok farklı görüş.
- [Smith 1980 — The Contract Net Protocol](https://ieeexplore.ieee.org/document/1675516) 经典机制,IEEE Bilgisayarlardaki İşlemler
