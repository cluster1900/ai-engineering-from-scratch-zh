# WMDP ile iki kullanım kabiliyetinin değerlendirilmesi

> Li et al., "WMDP Benchmark: Unlearning ile Kötü Kullanımı Ölçmek ve azaltmak" (ICML 2024, arXiv:2403.03218);; biyosecurity (1.520) ▌cybersecurity (2.225) ▌hakimi (412)  4,157 yollu seçenek seçimi konuları kapsamaktadır. Sorun "sarı bölge"                                                                                                                                                                                                                 

**类型：**Öğrenme
**语言：**Python (stdlib, WMDP şeklinde yükseltme değerlendirme harnes)
**先修要求：**18 · 16 aşama (kırmızı ekip aletleri), 14 aşama (ajan mühendisliği)
**时间：**~ 60 dakika

## Öğrenme hedefi

- WMDP'nin üç alanını, sorun sayısını ve "sarı bölge" i tanımlamak
- RMU'yu ve neden WMDP'nin hem değerlendirilmesi hem de öğrenme engelli bir referans olduğunu açıklayın.
- 描述 2024-2025 的升起 叙事:"轻微升起" -> "处于临界点" -> "不足以排除 ASL-3"
- Yeni başlayanların yükselmesine ve uzmanların mutlak yeteneklerine karşı farkı vardır.

## 问题

双用途能力是每个实验室前沿安全框架 (BİLGİN 18) 下面的测量问题──问题是: Model X是否实质性提升了新手在生物、化学或网络领域的大规模伤害的能力?直接测量(模型实际产生伤害的要求)既违法又不道德──代理测量需要一个模型不能拒绝的基准(才能数字产生真实能力数字),但其中的问题本身也不能成为有害出版──

## 概念

### "sarı bölge"

Bu sorular zararlı süreçlerin yakınlığı, gelişme bilgisi ile ilgili olarak belirlenir, ancak doğrudan bir yapım yapısı değildir. "Ne reagent 催化 [published pathway] nın 4. adımıdır?" ve "I how to manufacture [dangerous compound]?" değil.

 toplam 4.157 道問題:
- Biyolojik güvenlik: 1.520
- Siber güvenlik: 2.225
- Kimya: 412

Çoğu seçim biçimi: Model herhangi bir şeye yardımcı olmak için gerekli değildir; bu nedenle zararlı davranışlara neden olmaksızın ölçüm kapasitesi kullanılabilir.

### RMU  Değerlendirme Yalancı Yöntem

配套的不学习方法──应用于LLaMa-2-7B 后, WMDP oranını hızla yaklaştıracak şekilde düşürür, aynı zamanda MMLU ve diğer genel yetenek referansını birkaç yüz puan içinde tutar.

### 2024-2025 yükseltme 叙事

Üç aşama:

1. **2024 "轻微 uplift"。**OpenAI ve Anthropic  erken Hazırlık/RSP  değerlendirme raporları, deneylerin biyolojik yakınlıklı  görevleri için, modellerin internet aramalarına göre küçük avantajları vardır.

2. **2025 年 4 月 "处于临界点"。**OpenAI'nin Hazırlık Çerçevi v2 raporuna göre, model "bilindiği biyolojik tehditlerin kritik noktasını oluşturmak için yeni kullanıcılara anlamlı bir şekilde yardımcı olmak üzerindedir"

3. **Anthropic 的 2025 生物武器获取试验。**Bir yeni katılımcı içerir kontrol edilen çalışma, ölçüm elde aşama görevlerinin nispeten başarısı oranı── rapor 2.53x yükseltme── başarısızlık dışı ASL-3(Desin 18)  Antropik Sorumlu Ölçekleme Politikası 3 seviyesinin  değerleri ulaştı veya yaklaştı 

### Yeni Hükümdarlar vs. Uzmanlar

Bir önemli fark:

- **相对于新手的 uplift。**模型对非专家有多大的帮助吗? Bu çarpılık 量. △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                                                                                                                 
- **专家绝对能力。**模型最大努力下能产生多少信息? Uzmanlar yeni cihazlardan daha fazla bilgi edinebilir.

Güvenli durumlar (Disim 18) Aynı zamanda iki kişiye yöneliktir: "Model yeni başlatıcıya yeteri kadar yükseltme sağlayamaz" Üstelik "Özeller modelden henüz açık olmayan bilgileri çekemezler"

### 测量陷

WMDP, bir uygulama içinde yeni kullanıcıların tarafından kullanılabilmesi için WMDP'de yüksek puan alan bir model, deployment measurement yerine kapasite temsilcisi olarak kullanılır.
- 引出抗性(不触发安全过器而取能力有多难)
- 默会知识( bilgi değil, ıslak laboratuvar becerisi gerekir)
- 执行障碍(采购、设备)

Anthropic'in 2025 Bioweapons Acquisition deneyi WMDP tarzı  kapasite üzerine yeni bir aşama katıldı: Birçok seçeneği değil, gerçek görev başarısını ölçüyor.

### Bu 18'inci aşamada.

Ders 12-16 model çıkış saldırı ve savunma araçları hakkında. Ders 17 iki kullanımlı yetenek seviyesi  sınır güvenliği çerçeveleri  Ders 18) ölçüm değerlendirmesi. Ders 30 以当前 2026 yıl siber/biyo/kimya/nükleer yükseltme 証拠束この脈──


```figure
al-wmdp-yellow-zone
```

## Kullan

`code/main.py`构建一个玩具版 WMDP şeklinde değerlendirme harness──一个模拟模型会在按类别分组问题上测试;报告每个领域的分数──一个简单的不学习干预(将将领域的特定表示 置零) 分数降低;你可以测量它与通用能力之间的权衡──

## - Söyle.

本课会生成 `outputs/skill-wmdp-eval.md` İki kullanım kabiliyet açıklaması ("Modellerimiz biyolojik silahlarla ilgili davranışlara anlamlı bir şekilde yardımcı olmayacak") verilir.

## 练习

1. 运行  İşlem`code/main.py` Rapor oyun unlearning 步骤前后 her alanın doğruluğunu

2. Oyuncak WMDP  dördüncü alanı artırmak için  örneğin radyolojik  belirten iki tür sarı bölge arasında örnekleyici sorunun türü  açıklamak neden bu tür sorular MMLU şeklinde eklenir   sorun daha zor 

3. 阅读WMDP 2024 Bölüm 5 (RMU metodolojisi) 勾勒一种更简单的不学习方法 (örneğin, üst-k nöronları inhibe eden alanlardaki içeriği doğrultusunda),并描述其预期的通用能力成本──

4. Anthropic 2025'in biyolojik silah elde etme deneyi raporunda 2.53x yükseltme bulunmaktadır. Bu rakamı açıklamak için iki farklı yöntem vardır.

5.  Açıklama ASL-3'ün güvenliği örneği WMDP'nin öğrenme dışı olarak en az iki ek araştırma başlatılmasına ihtiyaç duyulur.

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|------|-----------------|------------------------|
| WMDP | "双用途 benchmark" | yellow zone 中跨 bio/cyber/chem 的 4,157 道 MCQ 问题 |
| Yellow zone | "促成但非合成" | 邻近有害能力的接近性知识，但不是合成配方 |
| RMU | "unlearning baseline" | Representation Misdirection for Unlearning；降低 WMDP 分数，同时保留通用能力 |
| Novice-relative uplift | "它对非专家有多大帮助" | 对新手而言，相比现状 internet search 的乘法优势 |
| Expert-absolute capability | "专家的上限" | 有动机的专家可从模型中提取的最大信息量 |
| Acquisition-phase task | "合成前的步骤" | 采购、设备、许可 —— 危害路径最早期的部分 |
| ITAR/EAR | "出口管制合规" | 约束某些促成性知识发布的法律框架 |

## 延伸阅读

- [Li et al. — The WMDP Benchmark (arXiv:2403.03218, ICML 2024)](https://arxiv.org/abs/2403.03218) referans değerleri 和 RMU 论文
- [OpenAI — Preparedness Framework v2 (April 15, 2025)](https://openai.com/index/updating-our-preparedness-framework/) "处于临界点" ifadesi
- [Anthropic — Responsible Scaling Policy v3.0 (February 2026)](https://www.anthropic.com/responsible-scaling-policy) ASL-3 bioloji  değer ve elde edilen deney sonuçları
- [DeepMind — Frontier Safety Framework v3.0 (September 2025)](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) Biyolojik yükseltme CCL
