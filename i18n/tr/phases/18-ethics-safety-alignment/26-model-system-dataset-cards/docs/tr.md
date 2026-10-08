# Model 、Sistem ve Veri Dizini Kartları

> Üç çeşit dosya biçimi oluşturur AI 透明性的结构──Model Cards(Mitchell et al. 2019),  modellerin beslenme etiketleri: eğitim verileri, ölçümsel grup analizleri, etik değerleri, dikkatleri; Sadece %0,3'ü Hugging Face model kartları etik değerleri kaydetti. 2023) ・Data Satıları Verim Sayfaları 2018 yılında, CACM) 动机、组成、收集过程、标注、分发、维护;类比电子元件数据表──Data Cards(Pushkarna et al., Google 2022) 模块化分层细节(teleskopik、periskopik、mikroskopik), farklı okuyucuların sınırları karşısında bir nesne olarak──2024-2025 yıllarındaki gelişme: LLM'ler üzerinden otomatik üretim(CardGen, Liu et al. 2024), model kartı 细节 HF 上最高 29% 下载量增长相关(Liang et al. 2024),可验证证明 (Laminator, Duddu et al. Karbon/su'nun sürdürülebilirliği raporu tamamlanmaktadır. Temmuz 2025);EU/ISO 監管卡 正在出現──System Cards(Sidhpurwala 2024;Meta 系统级透明度;"Bluprints of Trust" arXiv:2509.20394) 端到端 AI 系统文档,覆盖安全能力、即时注射、防护、数据-exfiltration 检测、与人类价值一致性──

**Type:** Build
**Languages:** Python (stdlib, model-card + datasheet + system-card generator)
**Prerequisites:** Phase 18 · 18（安全框架），Phase 18 · 24（监管）
**Time:** ~60 分钟

## Öğrenme hedefi

- 描述 Mitchell et al. 2019 原始模型卡 和 Gebru et al. 2018 veri sayfası。
- 描述 Data Cards 的 teleskopik/periskopik/mikroskopik 分层──
- Sistem Kartlarını ve sonuna kadar kapsamını açıklayın.
- 2024-2025 yıllarındaki gelişme için üç projeyi açıklayın:

## 问题

监管框架 (Sınıf 24) ve实验室安全政策 (Sınıf 18) için dosya biçimi gereklidir. Dokumente biçimi belirli modellere yöneliktir.

## 概念

### Model Kartlar ((Mitchell et al. 2019)

Bölüm:
- Model detayları
- İstihbaratı:
- Değerlendirmek için kullanılan faktörler (ölkeme veya çevre faktörleri)
- Metrikler
- Değerlendirme verileri。
- Eğitim verileri
- Kalamsal analizler faktörlere göre 分组)
- Etik bakış açıları:
- Dikkatler ve öneriler:

采用问题:Oreamuno et al. 2023'te Hugging Face model kartlarının denetim bulguları, sadece %0,3'ü etik değerleri kaydetti.

### Verim Satıları Verim Sayfaları (Gebru et al. 2018)

类比电子元件 veri sayfası── bölüm:
- Motivasyon (Bunlar için neden oluşturuldu?)
- Yapılandırma (doğrusu içeren)
- Toplama süreci (How to set up)
- Etiketleme (如适用)
- Uses (预期用途,禁止用途,风险)
- dağıtımı.
- Bakım.

CACM 2021'de yayınlanmıştır.

### Veri Kartları (Pushkarna et al., Google 2022)

模块化分层细节──三缩层:
- **Telescopic。**面向非专家的高层摘要──
- **Periscopic。**面向 ML uygulayıcılarının orta seviyede genel bir özet:
- **Microscopic。**面向审计员详细特征级文档──

边界对象框架:不同读者从同一文档中提取不同信息──

### Sistem Kartları

范围:端到端 AI 系统, modelleri içerir + 安全 + 部署上下文── bölümler genellikle şunları içerir:
- Güvenlik yeteneği.
- Hızlı enjeksiyon 防护。
- Veri-sızdırma 检测。
- İnsan değerleriyle uyumlu olmak için yapılan açıklamalar.
- 事件响应──

Sidhpurwala 2024 和 Meta 系统级透明度工作── "Tirançın Blüprintleri" (arXiv:2509.20394) Sistem Kartı 形式化 模型カード 在部署层的补充──

### 2024-2025 yılları

- **CardGen (Liu et al. 2024)。**LLM'lerin otomatik olarak üretilen model kartı; rapor称在标准化米切尔 2019 字段上, birçok insan tarafından yazılan kartlardan daha yüksek objektifliktir.
- **下载相关性 (Liang et al. 2024)。**详细的模型卡与HF上最高29%下载率升升相关采用压力现在由市场驱动而非仅仅由规则驱动而已──
- **Laminator (Duddu et al. 2024)。**通过硬件 TEE / 加密签名实现可验证证明允许模型卡 携带索赔的证明,而不仅仅索赔本人――
- **Sustainability (Jouneaux et al. July 2025)。**碳、水和计算能耗足迹; 新兴 ISO 標準──
- **Regulatory cards。**AB Yapay zeka Yasası ((Desin 24)GPAI Uygulama Kodu Şeffaflık 章节要求模型卡 作为合规制品──

### Bu 18'inci aşamada.

Ders 24-25 监管和 CVE 层―― Ders 26 文档层―― Ders 27 训练数据治理,也就是数据表的上游―― Ders 28 研究生态系统,产出卡 中引用的评估――


```figure
an-card-scopes
```

## Kullan

`code/main.py`Oyuncuların bir parçası olarak en küçük model kartı oluşturmak için bir oyuncu dağıtımına başvurmak için en küçük model kartı oluşturmak için en küçük model kartı oluşturmak için en küçük model kartı oluşturmak için en küçük model kartı oluşturmak için en küçük model kartı oluşturmak için en küçük model kartı oluşturmak için en küçük model kartı oluşturmak için en küçük model kartı oluşturmak için en küçük model kartı oluşturmak için en küçük model kartı oluşturmak için en küçük model kartı oluşturmak için en küçük model kartı oluşturmak için en küçük model kartı oluşturmak için en küçük model kartı oluşturmak için en küçük bir sistem kartı oluşturmak için en küçük bir kartı oluşturmak için en küçük bir kartın en küçük bir kartı oluşturmak için en küçük bir kartı oluşturmak için en küçük bir kartı oluşturmak için en küçük bir kartın en küçük bir kartı oluşturmak için en küçük bir sistemin üç alanı oluşturmak için en küçük bir sistemin en küçük bir kartı oluşturmak için en en en en iyi bir yöntemdir.

## - Söyle.

本课产 出 `outputs/skill-card-audit.md`❖ Bir model kartı, veri levhası veya sistem kartı belirlenir, bu da bir değerli grup kapsamını ve doğrulanabilir kanıtların olup olmadığını belirler.

## 练习

1. 运行  İşlem`code/main.py`◊ kontrol oluşturulan kartlar──识别薄弱章节((仅占位符),并说明什么证据可以加强它们──

2. 扩展模型卡,加入跨两个人口统计群的量化分组分析 (Düşünme 20)

3. 阅读Oreamuno et al. 2023 采用率 0.3% 内容── 模型卡 规范 规范 结构性改动提出,以提高道德考虑的采用率──

4. Laminator (Duddu et al. 2024) TEE'leri kullanarak 可验证证明──设计一个模型卡 字段,用于承载某项评估结果的加密证明,并描述验证者的角色──

5. Geçmişte bir proje veya bir varsayılan deployment için bir Sistem Kartı yazmak. Sistem Kartı, Model Kart değil.

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| Model Card | "the Mitchell card" | Mitchell et al. 2019 针对 ML models 的标准文档 |
| Datasheet | "the Gebru datasheet" | Gebru et al. 2018 针对数据集的标准文档 |
| Data Card | "the Pushkarna card" | Google 2022 模块化分层数据文档 |
| System Card | "the deployment card" | 包括安全栈在内的端到端 AI 系统文档 |
| Boundary object | "different readers, one doc" | Data Cards 框架：同一文档服务不同受众 |
| Verifiable attestation | "the Laminator attestation" | 附加到文档 claim 上的加密或 TEE 证明 |
| Sustainability field | "carbon / water footprint" | 2025 年出现的环境核算补充项 |

## 延伸阅读

- [Mitchell et al. — Model Cards for Model Reporting (arXiv:1810.03993, FAT* 2019)](https://arxiv.org/abs/1810.03993) 规范 model kartı
- [Gebru et al. — Datasheets for Datasets (CACM 2021, arXiv:1803.09010)](https://arxiv.org/abs/1803.09010) veri sayfası 论文
- [Pushkarna et al. — Data Cards (Google 2022)](https://arxiv.org/abs/2204.01075) 分层数据文档
- [Sidhpurwala et al. — Blueprints of Trust (arXiv:2509.20394)](https://arxiv.org/abs/2509.20394) Sistem Kartı 形式化
