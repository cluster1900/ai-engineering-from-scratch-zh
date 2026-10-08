# LLM'lerdeki önyargılar ve belirtici yaralanmalar

> Gallegos, Rossi, Barrow, Tanjim, Kim, Dernoncourt, Yu, Zhang, Ahmed (Computational Linguistics 2024, arXiv:2309.00770)。2024 yılının temel genel tarifi, 刻板印象、抹除) ve dağılımcı 傷害(資源 dağılım eşitsizliği) ayrılığı, 并将评估指标归类为基于嵌入、基于概率或基于生成文本──2024-2025 实证研究:An et al. (PNAS Nexus, Mart 2025) 20 个入门级位的自动简历评估中,衡量 GPT-3.5 Turbo、GPT-4o、Gemini 1.5 Flash、Claude 3.5 Sonnet、Llama 3-70B 上的交叉性性别 x 偏见──WinoIdentity (COLM 2025, arXiv:2508.07111) 不确定性基础上的交叉身份公平性评估──Yu & Ananiadou 2025 识别 MLP 层中的性别神经元;Ahsan & Wallace 2025 使用SAEs 揭露临床场中的种族偏见;Zhou et al. 2024 (UniBias) 通过操纵注意头进行去偏──元批判 (arXiv:2508.11067): 10年文献过度聚焦于二元性别偏见──

**类型：**Yapım
**语言：**Python (stdlib, oyuncak yerleştirme tabanlı önyargı sorgulaması)
**先修要求：**EY 05 (sözler yerleştirme), EY 18 · 01 (geleneksel talimat)
**时间：**~ 60 dakika

## Öğrenme hedefi

- ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐
- Gallegos et al. 2024'te üç sınıf değerlendirme göstergesi bulunur,并分别描述其中一个指标──
- 交叉性, ve neden WinoIdentity'nin belirsizliklere dayalı adillik ölçümleri tek birim önyargılı değerlendirme eksikliğini giderdi.
- 描述两种偏见的机制可解释性方法(cinsel nöronlar、SAE özellikleri、 dikkat başı manipülasyonu)

## 问题

Önceki dersler kasıtlı zararları (jailbreaks, scheming) ve güvenlik yönetimi ile kapsamaktadır. Önyargı, kasıtlı olarak ortaya çıkan bir zarardır.

## 概念

### Ünlülik vs. bölünme

- **表征性伤害。**刻板印象、抹除、损性描画── 护士描画完全是女性的LLM,表征性伤害产生──
- **分配性伤害。**Bir sistematik olarak siyah                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

İki taraf aynı değildir. Bir model önyargısız bir şekilde ortaya çıkabilir.

### Üç sınıf değerlendirme göstergesi ((Gallegos et al. 2024)

- **基于 Embedding。**RLHF öncesi yerleştirmelerde WEAT 风格测试进行──衡量身份词与属性词之间的统计关联──局限:衡量的是表示,而不是行为──
- **基于概率。**刻板印象确认型补全与刻板印象违反型补全的日志-概率──Decoder 侧测量──能捕捉部分行为偏见──
- **基于生成文本。**Yapım metininde aşağıdaki görev ölçümleri yapılır.

### 交叉性

Sadece cinsiyetle ilgili önyargıları değerlendirecek, sadece (cinsel, ırk) 组合da tetiklenen önyargıları kaybedecektir.

WinoIdentity (COLM 2025) belirsizliğe dayalı bir geçiş eşitliğini tanıttı. Bu, farklı geçiş kimlik gruplarında sonuçların belirsizliğe erişip-eşitmediğini ölçen bir modeldir. Sadece tahminleri ölçmekle kalmaz. Bu, bazı durumları ele alabilir: model her grupta aynı hatalar yapar, ancak bazı gruplar için daha belirsizdir, bu da farklı bir aşağı akış dağılım davranışını oluşturabilir.

### 機制方法

2024-2025 yıllarındaki açıklanabilir çalışmalar, önde gelenleri kabul edilebilir bir mekanizma seviyesinde müdahale etmesini sağlar:

- **Gender neurons (Yu & Ananiadou 2025)。**特定 MLP neuronları 〜性別特異行為関連──消融 〜これらのニューロン 〜限定能力コスト下, 〜性別差を減らすことができる〜
- **通过 SAEs 识别临床种族偏见 (Ahsan & Wallace 2025)。**Sparse otomotik kodlayıcı özellikleri içeriden açıklanabilir boyutlara ayrıştırılır; ırk ile ilgili özellikleri tanımlayabilir ve engelleyebilir.
- **UniBias (Zhou et al. 2024)。**Zira atışlı dikkat başı manipülasyonu kullanılarak. Özel başlar kimlik sınıfının hassasiyetini arttırır. Bu başları sıfırla veya yeniden yüklerek, ince ayarlama yapılmadığında önyargıları azaltabilirsiniz.

### 元批判

Bu 10 yıllık yazılım genelinde, bu alanda aşırı olarak ikili cinsiyet önyargısına odaklandığını bulmuştur. Diğer aksanlar, şiddete, din, göçmenlik, çok dilli bir varlık dahil olmak üzere, daha az ilgi görüyor.

### Bu 18'inci aşamada.

Dersler 20-21 Formal Coverage of Prejudice and Fairness. Ders 22  Coverage of Privacy. Ders 23  Coverage of Watermarking. Bunlar kullanıcı zararlı katman, yanıltıcı yanıltıcı yanıltıcı yanıltıcı yanıltıcı yanıltıcı güvenlik katman.


```figure
an-bias-two-harms
```

## Kullan

`code/main.py` Oyuncak yerleştirme tabanlı bir önyargı araştırması oluştur: in简单共现 Embedding,测量身份词与属性词之间的 WEAT 风格距离――; bir önyargı ve gözlem göstergesi 触发; uygulamak için basit bir önyargı,并观察部分恢复――

## - Söyle.

本课产 出 `outputs/skill-bias-eval.md`❖ Bir model kart veya adillik bildirimi belirlenir, değerlendirme için üç sınıf gösterge ile birlikte, ❖ yerleştirme, olasılık, oluşturulan metin) ❖ geçişsel kapsam ve herhangi bir önlemleme mekanizması ile birlikte denetim yapılacaktır.

## 练习

1. 运行  İşlem`code/main.py`◊ Rapor Değişiklik adımları ön ve son  风格偏见分数── açıklama neden bu gösterge sıfır düşmedi

2. Bir tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane

3. An et al. 2025 (PNAS Nexus) ­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­

4. Yu & Ananiadou 2025                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

5. Eski eleştirmenler bu alanın çok dar bir yere odaklanmasının ikili cinsiyet olduğunu düşünüyor.

## 关键术语

| 术语 | 人们的说法 | 它实际意味着什么 |
|------|-----------------|------------------------|
| 表征性伤害 | “刻板印象 / 抹除” | 对某个群体的有偏描绘 |
| 分配性伤害 | “不平等决策” | 针对某个群体的有偏物质结果 |
| WEAT | “Embedding 测试” | Word Embedding Association Test；基于共现的偏见 probe |
| 交叉性 | “组合身份效应” | 在多个身份轴线交汇处出现的偏见 |
| Gender neurons | “MLP 偏见 neurons” | 激活与性别特异行为相关的特定 neurons |
| SAE feature | “可解释维度” | Sparse-autoencoder 识别出的 feature；可用于机制性偏见分析 |
| UniBias | “attention-head 去偏” | 通过重新加权 attention heads 进行 zero-shot 去偏 |

## 延伸阅读

- [Gallegos et al. — Bias and Fairness in LLMs: A Survey (arXiv:2309.00770, Computational Linguistics 2024)](https://arxiv.org/abs/2309.00770) 经典综述
- [An et al. — Intersectional resume-evaluation bias (PNAS Nexus, March 2025)](https://academic.oup.com/pnasnexus/article/4/3/pgaf089/8111343) 五模型交叉性研究
- [WinoIdentity — 基于不确定性的交叉公平性（arXiv:2508.07111, COLM 2025）](https://arxiv.org/abs/2508.07111) Yeni referans değer
- [UniBias — attention-head manipulation (Zhou et al. 2024, ACL)](https://arxiv.org/abs/2405.20612) sıfır atış
