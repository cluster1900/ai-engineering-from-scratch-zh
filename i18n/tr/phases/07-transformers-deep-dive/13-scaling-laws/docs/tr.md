# Ölçekleme Kanunları

> 2020年 Kaplan 论文说:模型越大,Loss 越低──2022年 Hoffmann 论文说:你们训练不足──计算会进入两个桶:参数和代币,而两者的分配不显而易见──

**Type:** Learn
**Languages:** Python
**先修要求:**7. faz · 05 (Tüm Transformer), 7. faz · 07 (GPT)
**Time:** ~45 分钟

## 问题

C FLOPs'in eğitimini hesapladığında ve en iyi modeli elde etmek istediğinde iki dönümle karşılaşırsın:

1. **多少参数 (N)？**Model daha büyük, kapasitesi daha yüksek.
2. **多少训练 Token (D)？**Veriler daha fazla, kapasite daha fazla kullanılıyor.

FLOPs 近似按 `6 × N × D`N'yi yükseltebilir, D'yi düşürürsün.

2022 yılından önce, cevap, mümkün olduğunca yüksek N── GPT-3 (2020) 175B 参数, yaklaşık 300B Token 上訓練── oranı yaklaşık olarak her parametre 1.7  token── Kaplan Skalime Kanunları  bunu destekledi──

Hoffmann et al. (2022)  Chinchilla'nın küçük model ailesinin adıyla bir grup eğitimi aldılar.**每个参数 20 个 Token**△GPT-3 訓練不足 10×──Chinchilla(70B 参数,1.4T Token)

2026 yılı Chinchilla'nın dünyasıdır, ancak önemli bir dönüşüm var. Llama 3 8B 15 milyar Token üzerinde eğitim, oranı her parametre 1,875 Token üzerinde. Chinchilla-optimal 九十四倍.

## 概念

![Chinchilla 曲线：不同 N/D 比例下的 Loss vs compute](../assets/scaling-laws.svg)

### Hoffmann Yasası

Chinchilla'dan alınan makalede, Kayıp aşağıdakileri içerir:

```
L(N, D) = A / N^α + B / D^β + E
```

- `N`= 参数(非 Embedding)
- `D`= 訓練 Token。
- `α ≈ 0.34`- Evet .`β ≈ 0.28`(大致对称)
- `E ≈ 1.69`- Kayıplar.
- `A ≈ 406`- Evet .`B ≈ 411`- Evet.

                                                                                                                                                                                                                                                              `N`求导并求解:

```
N_opt ≈ 0.6 × (C/6)^0.5
D_opt ≈ 0.6 × (C/6)^0.5
D_opt / N_opt ≈ 20
```

Hesaplama-optimal: her parametre 20 Token

### Neden hala fazla eğitim alıyorsun?

Chinchilla-optimal en küçük düşüş, antrenman kaybına karşı yapılan antrenman FLOP'sidir.

对于每月服务1000000000 Token的聊天机,推理会主导总成本──Llama 的方法是:模型更小,训练更久──8B 在 15T Token 上训练,是高度推理优化的:

- İsteğe girebilmek için GPU'lar.
- 延迟只是70B Chinchilla-optimal 的一小部分──
- Çoğu görev için ise kalitesi yeterince yakın.

DeepMind 2024 论文 (("Üzer eğitim yeni en iyi şeydir") bu noktayı biçimlendirecektir.

### 涌现 vs 平滑性

主张: Bazı beceriler (算术、多步推理、遵循链思维) bir ölçüde birden ortaya çıkacak.

Schaeffer et al. (2023) bu ölçüm sahte görüntüsü olduğunu düşünüyor:涌现指标使用不连续评分(exact match、值精度),会隐藏底层logits的平滑改进──连续指标──横向) 显示的是平滑曲线──

2026 yılına kadar, ortak fikir: Kayıplar devam ederek tahmin edilmesi güvenilirdir.

### 2026 yılın resmini

Ölçekleme Kanunu hala geçerlidir, ancak:

| 因素 | 如何变化 |
|--------|-------------|
| 数据质量 | 筛选“好”Token（Phi-style）可使曲线移动，相当于 >2× effective compute |
| MoE | 总参数与 active FLOPs 解耦；Scaling Laws 按 per-active-FLOP 计算 |
| 后训练 | 某些能力（指令遵循、代码）受 SFT+RLHF 的影响比 pretraining 更大 |
| Multimodal | 图像 + 文本 Token 一起缩放；每种模态有单独曲线 |
| 合成数据 | 模型生成训练数据；effective compute 可以复合增长 |

Muon Optimizer (Kim Moonlight, 2024) gösterir ki, uyumlu veri miktarı altında, AdamW'ye göre yaklaşık 2×'ün etkili hesaplama 益 ∞ vardır. Bazı 2026 yılları Muon kullanımı ile düzenli olarak çalışmaktadır.


```figure
scaling-laws
```

## Yapın onu.

Görüyorum .`code/main.py`❖ Çincilla Kayıp                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `(N, D)`- Evet.

### 步骤 1: Chinchilla kaybı

```python
def chinchilla_loss(N, D, A=406.4, B=410.7, alpha=0.34, beta=0.28, E=1.69):
    return A / N ** alpha + B / D ** beta + E
```

Düzgün`C = 6ND`Aşağı, geleceğim`L`Çizim için`(N, D)`Yukarıdaki en düşük değerleri bul.

### 步骤 2: 计算最优边界

 için `1e17`- Ne ?`1e25`FLOPs'in hesaplama  bütçe, bulmak `6ND = C`Aşağıda Kalanın Minimumlanması`(N, D)`❖ Test oranı `D/N ≈ 20`- Evet.

### 步骤 3: aşırı eğitim maliyeti

計算訓練一個小10×的模型(最优 N 的 1/10,最优 D 的 10×) 付出的额外损失──報告换来的推理 FLOP 节省(与 N 成正比)──

### 4 adım: Gerçek modelle karşılaştır

GPT-3 ∞ Chinchilla ∞ Llama 3 8B ∞ DeepSeek-V3 ∞ Active Params ∞`(N, D)`Hasar karşılaştırma

## Kullan

Kendi kendini eğitmek için sınırları kullanmak çok kolay. Ama ölçekleme yasaları size şunu söyleyebilir:

1. **你的 fine-tune 是否有足够数据。**Eğer görev belirli veriler temel modelden düşükse, her parametre 20 Token, bir Kayıp zeminde 处和──
2. **是否选择更大的 base model。**Eğer tüm bütçeniz düşünceye harcanırsa, daha küçük bir model seçmeyi öncelikle seçin.
3. **收益在哪里递减。** 1000                                                                                                                                                                                                                                                              

**2026 年的研究轨迹：**

- **数据受限状态。**Web 上高质量 Token 数量有限(过后约 5-10亿 İngilizce) ・・・Sınır öncesi eğitim şu üst sınırına yaklaşıyor。合成数据、多语言、多模,以及 RLHF ölçekli ince ayarlama 〜
- **Compute-multiplier 技巧。**Muon Optimizer, MoE, daha iyi veri seçimi, her tür hareket eder mutlak sabit sayı, değil, hızlandırma.
- **RL 的 Scaling Laws。**开放问题── erken kanıtlar RL örneklerinde güç yasası olduğunu göstermektedir, ancak gösterge ve önceden eğitim çok farklıdır──

## - Söyle.

Görüyorum .`outputs/skill-training-budget-estimator.md`Bu beceriler, belirli bir hesaplama 予算                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    `(N, D, hours, GPU)`- Evet.

## 练习

1. **Easy.**运行  İşlem`code/main.py`△打印 预算 `1e20`- Evet.`1e22`- Evet.`1e24`Aşağıdaki Chinchilla-optimal `(N, D)`                                                                                                                                                                                                                                                              
2. **Medium.**实现 Hoffmann Loss-as-function-of-compute 曲线──为 compute-optimal sınır 绘制 Loss vs `log10(C)`◊ bu yasayı tanımak                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `>10^28`FLOPs 才能让交叉 Entropi 再降低 0.1──
3. **Hard.**Aynı veri kümesi içinde 5 küçük model eğitimi (100K'ye 10M'lik parametre) kendi ölçekleme yasasına uygun olarak.`α`和 `E`◊ İndeksiniz yayınlanan sonuçlarla nasıl uyumludur?

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|-----------------|-----------------------|
| Parameters (N) | “模型大小” | 非 Embedding 权重数量；决定容量。 |
| Tokens (D) | “训练数据” | 见过的训练 Token 数；决定参数被利用得有多充分。 |
| Compute (C) | “花费的 FLOPs” | 对标准 Transformer 来说，约为 `6 × N × D`。 |
| Chinchilla-optimal | “D/N ≈ 20” | 最小化 pretraining 每 FLOP Loss 的比例。 |
| Over-training | “超过 Chinchilla” | 花费额外训练 FLOPs 来节省推理 FLOPs；D/N >> 20。 |
| Irreducible loss | “底部” | Scaling Law 中的 `E` 项；数据本身的熵。 |
| Emergent capability | “规模上的突然跳变” | 通常是评分器伪影；连续 Loss 是平滑的。 |
| Effective compute | “训练效率倍增器” | 更好的数据 / Optimizer / 架构会倍增每个 FLOP 的作用距离。 |

## 延伸阅读

- [Kaplan et al. (2020). Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361) 第一篇 Ölçekleme Yasası 论文; training insufficient──
- [Hoffmann et al. (2022). Training Compute-Optimal Large Language Models](https://arxiv.org/abs/2203.15556)Çincilla.
- [Schaeffer et al. (2023). Are Emergent Abilities of Large Language Models a Mirage?](https://arxiv.org/abs/2304.15004) 涌现作为测量伪影──
- [Sardana, Frankle (2024). Beyond Chinchilla-Optimal: Accounting for Inference in Language Model Scaling Laws](https://arxiv.org/abs/2401.00448) Neden Llama'nın aşırı eğitimi  iş yüküne uygun hale gelmiştir.
- [Jordan et al. (2024). Muon: An optimizer for hidden layers in neural networks](https://kellerjordan.github.io/posts/muon/) 2× hesap çarpıcıı。
