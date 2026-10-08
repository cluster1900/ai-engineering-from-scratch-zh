# Açık Ağırlıklı VLM Reçepleri: Gerçekten önemli olan nedir ?

> 2024-2026 yılları açık ağırlıklı VLM yayınları bir parça ablation tabloları forestı。Apple'ın MM1 13 çeşit görüntü kodlayıcı、konektör 和 veri karışımı kombinasyonunu test etti。Allen AI's Molmo 証明,详细的人类作文 胜过GPT-4V destillation。Cambrian-1 20+项编码器对五比──Idefics2 将轴设计空间 形式化──Prismatic VLMs 在受控基准上比较27种培训食谱──在这些噪声中,有一小组成果跨论文都成立:image encoder 比连接架构更重要,课数据混合比二者更重要,而详细的人类作文 胜过了这些代码合成数据──你读完整版──

**Type:** Learn + lab
**Languages:** Python (stdlib, ablation table parser + recipe picker)
**Prerequisites:** Phase 12 · 05 (LLaVA baseline)
**Time:** ~180 分钟

## Öğrenme hedefi
- VLM tasarım alanı: görüntü kodlayıcı, bağlantı, LLM, veri karışımı, çözünürlük programı
- 阅读 MM1 / Idefics2 / Cambrian-1 ablation table,并预测哪个按 会改变给定基准──
- Verilmiş hesaplama bütçesi ve görev karışımı durumunda, yeni VLM  seçin tarifi ((encoder, connector, data, çözünürlük) ⋅
- Neden aynı simge sayısında?

## 问题
已有数百的开放权重VLM──大多数从好到最先进的差距不来自建筑,而是来自数据,解析度时间表和编码器选择──当你的模型表现不佳时,知道先调哪个按,可以避免一次500万 GPU 小时的错误──

2023 yıl 浪潮(LLaVA-1.5、InstructBLIP、MiniGPT-4) Based caption-pair pretraining + LLaVA-Instruct-150k──不错的基线──上限约在MMMU 35%──

2024 yılın dalgaları (MM1、Idefics2、Molmo、Cambrian-1、Prismatic VLMs) ayrıntılı şekilde uygulanmıştır.

## 概念
### 五轴 tasarım alanı

Idefics2 ((Laurençon et al., 2024) bu ekselerin isimlerini verdi:

1. Resim kodlayıcı──CLIP ViT-L/14、SigLIP SO400m/14、DINOv2 ViT-g/14、InternViT-6B──Enkodlayıcılar 在补丁尺寸、解析 和预训目标上不同──
2. Bağlantı──MLP(2-4 katman)、Q-Former(32 sorgu + çapraz atn)、Perceiver Resampler(64 sorgu)、C-Abstraktor(konvülsiyonal + bilinear birleştirme)。
3. Dil modeli―Llama-3 8B / 70B、Mistral 7B、Phi-3、Gemma-2、Qwen2.5──LLM boyutu en önemli parametreler maliyetidir―
4. Eğitim verileri.Kapsiyon çiftleri.CC3M,LAION, interleaved, OBELICS,MMC4, instruction,LLaVA-Instruct,ShareGPT4V,PixMo,Cauldron.
5. Çözüm planı──Sıkılamalı 224/336/448、AnyRes、mülki dinamik──---

Her üretim VLM şehri her bir eksede 上做选择。MMMU puanlarının büyük bölümü, hangi bağlantıyı seçtiğinizden değil, 1、4 ve 5 ekselerinden açıklanır。

### Axis 1:encoder > konektör

MM1 Bölüm 3.2 显示: CLIP ViT-L/14 换成 SigLIP SO400m/14, MMMU 增加 3+ puan。 MLP 换成 Perceiver Resampler,增加不到1 point。Idefics2 复现了这一点:SigLIP > CLIP,Q-Former ≈ MLP ≈ Perceiver,在同样的代币计下相近。

Cambrian-1'in Cambrian Vision Encoders Match-Up(Tong et al., 2024) vizyon merkezli referans markasında(CV-Bench) 20+ 个 encoders üzerinde çalıştı.

2026 yıl açık VLM'lerin öntanımlı kodlayıcıları semantik + yoğun özellikler için kullanılır SigLIP 2 SO400m/14, sometimes会与DINOv2 ViT-g/14 özellikleri 拼接(Cambrian'ın Spatial Vision Aggregator 就这样做)

### Axis 2: Bağlantı tasarımı 差异不大

MM1、Idefics2、Prismatic 和 MM-Interleaved hepsi aynı sonuca vardı: sabit görsel-token sayısında, bağlantı mimarisi 几乎不重要── ortalama birleştirilmiş yamalar için 2 katmanlı MLP kullanmak, aynı token bütçesinde, 表现距离 32-query Q-Former 不到1点──

Gerçekten önemli olan token sayısıdır. Daha fazla görsel token = 更多LLM hesaplama = 更好表现,直到某点后收益递减── 每张图像 64 token对 OCR 太少──576-1024 token是大多数开放VLMs的甜点──2048+

Q-Former vs MLP is cost problem, not quality problem: regardless of image resolution 如何, Q-Former 都把 tokens 限制在 32-64;MLP 输出全部补丁代码──对高分辨率输入, Q-Former 省 LLM bağlamına;对低分辨率,差异只是噪声──

### Axis 3:LLM boyutu belirlenir

Her makalede VLM makalesinde, LLM'yi 7B'den 13B'ye kat katlamak, genellikle MMMU'nun 2-4 puan artmasına izin verir.

Bu yüzden Qwen2.5VL-72B ve Claude Opus 4.7 MMMU-Pro ve ScreenSpot-Pro'da büyük bir liderlik göstermektedir.

### Axis 4:data  详细的人类字幕 胜过蒸化

Molmo + PixMo(Deitke et al., 2024) is everyone should read of 2024 year results。 Allen AI 让人类标注员使用 1-3 分钟的密集语音通文通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通

Molmo-72B 11/11 个基准上击败Llama-3.2-90B-Vision──差不在建筑,而在字幕质量──详细的人类字幕 每张图像含有信息量比短网字幕多多 5-10x,并且在GPT-4V蒸化中 易于幻觉的地方保持事实地植地──

ShareGPT4V(Chen et al., 2023)和 Cauldron(Idefics2) aynı oyun kitabı, mixte human + GPT-4V başlıkları benimsemiştir。 Trend çok net: 2026 sınır için而言, başlık yoğunluğu > başlık miktarı > destillasyon kolaylığı。

### 5 . eks: karar  ve programı

Idefics2'nin ablations:384 -> 448                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 

Cambrian-1 çözünürlük vs. jetonlar ticaret yaptı: sabit hesaplamalarda, düşük çözünürlük aşağı daha fazla jeton, veya yüksek çözünürlük aşağı daha az jetonlar.

2026 yıl üretim tarifi:Etap 1 以 384 sabit 訓練,Etap 2 OCR ağır görevler için en yüksek 1280'lik dinamik çözünürlük kullanmak

### Prismatic ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓ ̓                                                                                                                                                                                           

Prismatic VLMs ((Karamcheti et al., 2024) is controlling paper of all axes― identical 13B LLM、 identical instruction data、 identical evaluation  每次只改变一条轴── sonuç:

- Resim başına görsel-token sayısı 解释约60%变异──
- Kodlama seçimi 解释约20%──
- Bağlantı mimarisi 解释约 5%──
- Diğer tüm faktörler: %15'i açıklayan veri karışımı, programcı,

Bu bir kaba ayrıntı, ama aynı zamanda ilk önce                                                                                                                                                                                                                                                          

### 2026 yıl seçicisi

基于证据,2026年新项目的默认开放VLM reçete:

- Kodlayıcı: doğuştan çözünürlük 下的 SigLIP 2 SO400m/14 NaFlex ile; eğer segmentasyon / yerleştirme gerekiyorsa, DINOv2 ViT-g/14 için yoğun özellikler elde etmek için
- Bağlantı: Çıkış tokens 上的2层 MLP──除非令牌-stressed,否则跳过Q-Former──
- LLM: Qwen2.5 / Llama-3.1 / Gemma 2;7B Kullanımlılık, 70B Kalite, hedef gecikme  Seçim
- Veriler:PixMo + ShareGPT4V + Kağız,并用任务特定指示数据 补足。
- Çözüm: dinamik ((长边 min 256、max 1280 piksel)
- Şart:Stage 1 ayarlama(sadece projector) Stage 2 tam ince ayarlama Stage 3 görev-specifik ince ayarlama 

Bu ilkelerden her biri, bu ders sonuna kadar kaydedilmiş makaleler arasında gerçek test ablationleridir.


```figure
l5-vlm-recipe-knobs
```

## Kullan
`code/main.py`Bu bir ablation tablo analizi ve tarif seçicisi.

- Bütçeyi belirle X ve görev Y, hangi tarif kazanır?
- Eğer 7B Llama'dayken SigLIP'i CLIP'e değiştirirsem, MMMU delta tahmininin ne kadarı olur?
- %80 güvenli bir cevap almak için önce hangi ekseni ayırmalıyım?

输出 bir sıralama reçete listesidir, önümüzdeki referans değerleri ve ablate ilk  tavsiyesi içerir.

## - Söyle.
本课生成 `outputs/skill-vlm-recipe-picker.md` belirlenmiş hedef görev karışımı, hesaplama bütçesi ve gecikme hedefi, tam bir tarif üretir, her seçeneğe göre bir ablasyonu kullanır ve mühendislerin yeni VLM projelerinin başlaması sırasında yeni bir ablasyon tabloyu yeniden geliştirmelerini engelleyebilir.

## 练习
1. MM1 Bölüm 3.2.. .. 2B LLM için, 50M görüntü bütçesinde, hangi kodlayıcı 胜出?

2. Cambrian-1 发现,拼音 DINOv2 + SigLIP 在视觉-centric benchmarks 上胜过单独使用任一者,但在MMMU上没有新增信号──预测哪些 benchmarks会升升,哪些会持平──

3. 2B LLM'de hedefiniz, mobil kullanıcı kullanımı ajanı oluşturmaktır. Seçim kodlayıcı, bağlantı, çözünürlük ve veri karışımı kullanmak.

4. Molmo 4B ve 72B modellerini yayınladı. 4B ve kapalı 7B VLM'ler rekabet gücüne sahip. 72B 11/11'de Llama-3.2-90B vizyonunu yendi.

5. 7B VLM'de kullanılan bir ablation tablosu tasarlayın.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Ablation | “调一个 knob” | 训练多次 runs，它们只在一个 design-space axis 上不同，其他全部保持 constant |
| Connector | “Bridge” / “projector” | 将 vision encoder output 映射到 LLM token space 的 trainable module（MLP、Q-Former、Perceiver） |
| Detailed human caption | “Dense caption” | 多句人类撰写的描述（通常 80-300 tokens），比 web alt text 更丰富 |
| Distillation | “GPT-4V captions” | 由更强的 proprietary VLM 生成的 training data；方便，但容易继承 hallucination |
| AnyRes / dynamic res | “High-res path” | 通过 tiling 或 M-RoPE 输入大于 encoder native resolution 的图像的 strategy |
| Resolution ramp | “Curriculum” | 从 low-resolution 开始并逐步提高的 training schedule，可加快 alignment learning |
| Vision-centric bench | “CV-Bench / BLINK” | 强调细粒度 visual perception，而非 language-heavy reasoning 的 evaluation |
| PixMo | “Molmo's data” | Allen AI 的 712K densely-captioned image dataset；人类语音被转写为 dense captions |

## 延伸阅读
- [McKinzie et al. — MM1 (arXiv:2403.09611)](https://arxiv.org/abs/2403.09611)
- [Laurençon et al. — Idefics2 / What matters building VLMs (arXiv:2405.02246)](https://arxiv.org/abs/2405.02246)
- [Deitke et al. — Molmo and PixMo (arXiv:2409.17146)](https://arxiv.org/abs/2409.17146)
- [Tong et al. — Cambrian-1 (arXiv:2406.16860)](https://arxiv.org/abs/2406.16860)
- [Karamcheti et al. — Prismatic VLMs (arXiv:2402.07865)](https://arxiv.org/abs/2402.07865)
