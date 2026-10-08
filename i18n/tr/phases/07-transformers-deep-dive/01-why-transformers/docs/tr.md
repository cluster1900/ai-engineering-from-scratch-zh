# Transformers  RNNs neden sorun

> RNN'ler bir Token bir kez işlenir. Transformers bir kez tüm Token'leri işlenir. Bu tek yapı seçeneği, 2017 yılından sonra Deep Learning'in her bir genişleme eğilimi değişti.

**类型：**Öğrenme
**语言：**Python
**先修要求：**3 (Depth Learning Core), 5 · 09 (Sequence to Sequence), 5 · 10 (Agatans Mekanizması)
**时间：**~ 45 dakika

## 问题

2017 yılına kadar, dünyadaki her en gelişmiş dizi modeli 语言、翻译、语音 hepsi geri dönük Nöral Ağlar。LSTMs 和 GRU'lar ImageNet Yer Yerel Yerleşiminin çevirme tabanında yarım on yıl boyunca hüküm sürdü。 onlar o zamanlar sahip olan tek kullanılabilir araçtı。

Üç ölümcül zayıf noktası var.`t+1`Token ' den gelmek istiyorum .`t`1.024-Token 序列, her bir döngüde 1.000.000 kez hareket noktası işlemini gerçekleştirmek için 1.024 串行步骤を実行できる GPU'yı ifade eder.

Kayıp gradientler 50 Token anlamına gelir  Önceki bilgiler 50 katınlıktan uzak bir şekilde sıkıştırılmıştı. Gated recurrent units (LSTM, GRU) bu sıkıştırmayı hafifletti, ancak asla ortadan kaldırmadı.

固定宽度的隐藏状态意味着编码器会在解码器 看到任何内容之前,把整个源序列 挤压到单个矢量──源是5个代币 还是500个都无关紧要;瓶始终是相同的形状──

2017 Atension Is All You Need                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

2026 yılına kadar, bu sonuç tüm modaliteyi yönetiyor.

## 概念

![RNN sequential compute vs Transformer parallel attention](../assets/rnn-vs-transformer.svg)

**Recurrence 是瓶颈。**RNN 计算 `h_t = f(h_{t-1}, x_t)`Her adım öncesine bağlı. Sen burada olamazsın.`h_4`之前计算 `h_5`❖ 10.000+ ve daha fazla çekirdekli modern GPU'lara sahip olmakla birlikte, bu uzun dizide %99'u boşa harcayacaktır.

**Attention 是广播。**Kendine dikkat etmek için bir çift var .`(i, j)`Aynı zamanda hesaplama`output_i = sum_j(a_ij * v_j)`◊ Tüm N×N dikkat matrisi 会在一次批量中填满──没有任何步骤依赖另一个步骤──GPUs 喜欢这一点──

**加速不是常数。**- Evet .`O(N)`Seri derinliği 和 `O(1)`Serial derinliği arasındaki farkı. Praktiki olarak, N=512 ve aynı sertede, transformörler her dönem için 510× hızla eğitim süresi; dizilerin uzunluğu arttıkça farklar dikkat çektiği kadar genişlemeye devam eder.`O(N²)`Hatırlama duvarı(Flash Dikkat                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

**transformers 的代价。**Dikkat hafızası 按 `O(N²)`扩展──2K bağlamı 没问题──128K bağlamı 则需要滑窗、RoPE ekstrapolation、Flash Attention tileing,或线性注意的变量──Recurrence 在时间和内存上都是`O(N)`Transformers, zamanı kaydettikten sonra, zaman kazanmak için bir yolla geri dönüyor.

**Inductive bias 的转变。**RNN'ler 假设 lokality 和 recency──Transformers 不做假设 每对位置都是注意的候选人──这就是为什么变压器需要更多数据才能训练好,但一旦拥有足够的数据就能扩展得更远──Chinchilla(2022) bunu formalize:给定足够多的代币,Transformer 总是能击败相同的参数的RNN──


```figure
rnn-vs-parallel
```

## Yapın onu.

Burada nöral ağ yok. Biz de çekirdekleri simgeleyerek, kendi notlarında farkı hissedebiliyoruz.

### 步骤 1: 测量串行深度

Görüyorum .`code/main.py`△ Biz iki işlevi oluştururuz. △ Birini RNN'ye benzer bir dizi olarak kodlayarak eklemel zincir olarak oluştururuz.

```python
def rnn_style(xs):
    h = 0.0
    for x in xs:
        h = 0.9 * h + x   # can't parallelize: h depends on previous h
    return h

def attention_style(xs):
    return sum(xs) / len(xs)  # every x is independent
```

RNN  sürümü O(N) olarak kullanılır ve tek bir CPU borusunu kullanır.`sum()`Bu, C'yi gerçekleştirmek için kullanılır ve her aşamada bir açıklayıcı üretilmez.

### 步骤 2: 计算理论操作

İki algoritma N'yi yapar. Farklılık * bağımlılık derinliği*'ndedir: öncesinde, çok fazla işlem yapılmalıdır.

### 步骤 3: 长序列 üzerindeki deneyimlerin genişletilmesi

Bir zamanlama tablosunu yazdırırırız, O(N) ı farkı görülebilir hale getirir. 2026 Mac ı'nda, 1000'den az unsurun dizisi çok hızlı, ölçülmesi zor bir şekilde görülür. 100,000'in dizisi net bir çizgi tarama gösterir. 16.384 Token Transformer'e yayılır ve 12 katman LSTM fiyat modeli ile karşılaştırıldığında, 2016'da duvar saatini eğitmenin neden bir engel faktörü olduğunu anlayacaksınız.

## Kullan

2026 yıl 什么时候仍然选择 RNN:

| 情况 | 选择 |
|-----------|------|
| Streaming inference，一次一个 Token，常量内存 | RNN or state-space model (Mamba, RWKV) |
| 超长序列（>1M tokens），Attention memory 爆炸 | Linear attention, Mamba 2, Hyena |
| 没有 matmul accelerator 的 edge device | Depthwise-separable RNN 在 FLOPs/watt 上仍然胜出 |
| 其他任何情况（训练、batched inference、最高 128K 的 context） | Transformer |

Mamba gibi devlet- uzay modelleri (SSM) aslında yapılandırılmış parametreye sahip RNN'ler, bu nedenle iki avantajı vardır:`O(N)`Skenasyon hafızası, ayrıca seçici tarama ile gerçekleştirilen paralel eğitimler. Daha iyi uzun bağlamlı ölçeklendirme ile %90'ın dönüştürücü kalitesini yeniden elde ettiler. 2026 yılına kadar, çoğu sınır laboratuvarı hibrit SSM+ dönüştürücü modellerini eğitmektedir.

## - Söyle.

Görüyorum .`outputs/skill-architecture-picker.md`◊ Bu beceri, uzunluğu, üretimi ve eğitim bütçesine göre yeni bir dizi sorun seçimi yapılandırılması için kullanılır.

## 练习

1. **简单。**- Evet .`code/main.py`Çıkış`rnn_style`, ≠ ≠ ≠ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ 
2. **中等。**Tam Python ile paralel prefix-sum (Hillis-Steele taraması) gerçekleştirmek için kullanılır.
3. **困难。**Dikkat tarzı azaltımı 移植 GPU 上的 PyTorch──序列 uzunluğu 64 扫 to 65,536 ⋅对两者计时──绘图并解释曲线形──

## 关键术语

| 术语 | 人们常说 | 它实际意味着什么 |
|------|-----------------|-----------------------|
| Recurrence | “RNNs 是顺序的” | step `t` 依赖 step `t-1` 的计算方式，迫使执行沿时间轴串行进行。 |
| Serial depth | “图有多深” | 依赖操作的最长链；即使在无限硬件上也会限制 wall-clock。 |
| Attention | “让 Tokens 彼此查看” | Weighted sum `sum_j a_ij v_j`，其中 `a_ij` 来自位置 i 和 j 之间的相似度分数。 |
| Context window | “模型能看到多少” | 一个 Attention layer 可作为输入的位置数量；quadratic memory cost 在这里扩展。 |
| Inductive bias | “架构内置的假设” | 关于数据形态的先验；CNNs 假设 translation invariance，RNNs 假设 recency。 |
| State-space model | “背后有代数的 RNN” | 为通过结构化 state-space matrices 实现并行训练而参数化的 recurrence。 |
| Quadratic bottleneck | “为什么 context 这么昂贵” | Attention memory = 序列长度上的 `O(N²)`；Flash Attention 隐藏的是常数，而不是扩展规律。 |

## 延伸阅读

- [Vaswani et al. (2017). Attention Is All You Need](https://arxiv.org/abs/1706.03762) Bu makale ana NLP'nin tekrarlanmasını sona erdirdi.
- [Bahdanau, Cho, Bengio (2014). Neural MT by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473)RNN'de yer aldığı zaman dikkatli bir şekilde ortaya çıktı.
- [Hochreiter, Schmidhuber (1997). Long Short-Term Memory](https://www.bioinf.jku.at/publications/older/2604.pdf) 原始 LSTM 论文,作为记录──
- [Gu, Dao (2023). Mamba: Linear-Time Sequence Modeling with Selective State Spaces](https://arxiv.org/abs/2312.00752) Transformatorların modern tekrarlayıcı cevapları
