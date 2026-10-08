# Dikkat 变体  Çıkanış Pencere, Sparse, Farklı

> Tam Dikkat bir yuvarlaktir. Her bir token her bir token'ı görebilir, ve kayda bunun için bir ücret ödenir.

**Type:** Build
**Languages:** Python
**先修要求:**7 · 02 aşaması (Öz dikkat), 7 · 03 aşaması (Büyük baş), 7 · 12 aşaması (KV Kaş / Akşam Dikkat)
**Time:** ~60 minutes

## 问题

Tüm dikkat , dizinin uzunluğundaki bellek maliyeti`O(N²)`, hesaplama maliyeti de `O(N²)`❖ 128K bağlamlı bir Llama 3 70B için, bu her katın 160 milyar dikkatli olması anlamına gelir ❖ 80 katın tekrar tekrarlanması ❖ Flash dikkatli olması ❖ Ders 12) gizli`O(N²)`Aktifleştirme kaydı, ama hesaplama maliyetini değiştirmez.

Üç kategori değişim:

1. **Sliding window attention (SWA).**Her bir simge, tam bir önbellek değil, sabit penceredeki komşu simgeye kadar devam eder.`O(N · W)`, içinden `W`Bu da bir tane.
2. **Sparse / block attention.**Sadece seçilmiş .`(i, j)`Bu yüzden, bu durumun bir parçası olarak, bir diğerinden daha fazla bilgi almak için, bir diğerinden daha fazla bilgi almak için,
3. **Differential attention.**İzdependent Q/K projesi kullanılarak 計算两张 Atention map,再相减── elimination将把权重泄漏到前几个代币的 注意沉──Microsoft's DIFF Transformer(2024)──

Bunlar ortak yaşanabilir. 2026 yılının bir sınır modeli onları kullanmak için karışık bir şekilde kullanır: çoğu kat SWA-1024, her beş kat bir kat küresel tam dikkat, ayrıca incelemeyi gidermek için kullanılan az sayıda farklılık başları vardır.

## 概念

### Çekilme Penceresi Dikkat (SWA)

 konum `i`Her soruya sadece katılın .`[i - W, i]`(kötü nedenlik SWA) veya `[i - W/2, i + W/2]`(iki yönlü) içinde konum── pencerenin dışında Token 会在 skor Matrix 中得到 `-inf`- Evet.

```
full causal:           sliding window (W=4):
positions 0-7          positions 0-7, W=4
    0 1 2 3 4 5 6 7        0 1 2 3 4 5 6 7
0 | x                0 |  x
1 | x x              1 |  x x
2 | x x x            2 |  x x x
3 | x x x x          3 |  x x x x
4 | x x x x x        4 |    x x x x
5 | x x x x x x      5 |      x x x x
6 | x x x x x x x    6 |        x x x x
7 | x x x x x x x x  7 |          x x x x
```

- Evet .`N = 8192`和 `W = 1024`Matrix'in puan beklentileri 1024 × 8192 ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′ az ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′den fazla ′dendi ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den ′den  ′den ′den ′den ′den   ′den ′den                                                                                                                                                          

**KV cache 会随 SWA 缩小。**Her katın sadece yakın zamanda tutulması gerekiyor.`W`个 Token of K 和 V── için Gemma-3'a benzer bir konfigürasyon için(1024 penceresi,128K bağlamı),KV önbelleği 会降低 128×──

**质量成本。**純 SWA Transformer 難以處理長距離检索──修复方法: 在 SWA 層間交错 完全注意層──Gemma 3 使用 5:1 SWA:global──Mistral 7B 使用因果性-SWA stack,信息通过重叠窗口向前流动 每层都将有效感受野扩展`W`Geçmişte .`L`层后,模型 canı `L × W`- Göstergi.

### İzleme / Blok Et

预先选择一个 `N × N`Sıkışıklık modeli:

- **Local + strided (OpenAI sparse transformer).**Sonuna kadar katılın .`W`- Token, tekrar ekle.`stride`个 Token'ın konumundan.`O(N · sqrt(N))`計算同時捕捉局部と長距離情報──
- **Longformer / BigBird.**Yerel pencere + az miktarda küresel token`[CLS]`), bu tokenler tüm tokenlere katılır, ayrıca tüm tokenlere katılır + rastgele sıfır bağlantılar──在匹配质量下经验上获得2×文脈──
- **Native Sparse Attention (DeepSeek, 2025).**Öğrenmek ne?`(Q, K)`blok 重要; в ядра 层面跳过零 блок──兼容 FlashAttention──

Sparse Attention bir çekirdek mühendisliği 故事──数学 很简单(mask score Matrix); kazançlar ise SRAMa yüklenmiş olmaktan geliyor──FlashAttention-3 和 2026 yılının FlexAttention API 让自定义稀模式 成为PyTorch 中等能力──

### Farklı Dikkat (DIFF Transformer, 2024)

常规注意 有一个注意 问题:softmax 强制每一行求和为1,因此那些不想特别出席到任何内容的代币将将权重倾倒到第一代币或前几个代币) 上.

Farklı Dikkat 通过计算**两张**Dikkat haritası bu sorunu çözmek için bir adım atmadı:

```
A1 = softmax(Q1 K1^T / √d)
A2 = softmax(Q2 K2^T / √d)
DiffAttn = (A1 - λ · A2) V
```

İçlerinden `λ`A1 捕捉真内容权重; A2 捕捉 sink。相减会抵消 sink,把权重重新分配相关代币。

報告結果(Microsoft 2024):çılgınlık  510% azaldı, aynı eğitim uzunluğunda geçerli bağlamda 延长 1.52×,hayda iğne 检索更敏。

### 变体对比

| Variant | Compute | KV cache | Quality vs full | Production use |
|---------|---------|----------|-----------------|----------------|
| Full attention | O(N²) | O(N) per layer | baseline | 每个模型的默认层 |
| SWA (window 1024) | O(N·W) | O(W) per layer | -0.1 ppl，搭配 global layers 效果好 | Gemma 2/3, Phi-3-Long |
| Local + strided sparse | O(N·√N) | mixed | 类似 SWA | OpenAI sparse transformer, Longformer |
| BigBird (local + global + random) | O(N) approx | mixed | 在 2× context 下匹配 full | early long-context BERT |
| Native Sparse (DeepSeek-V3.2) | O(N · active fraction) | O(N) | within 0.05 ppl | DeepSeek-V3.2, 2025 |
| Differential | O(2·N²) | O(2N) | -5 to -10% ppl | DIFF Transformer, early 2026 models |


```figure
gqa-kv-sharing
```

## Yapın onu.

Görüyorum .`code/main.py` Biz bir sebep maskası karşılaştırıcısı gerçekleştirdik, oyuncak sırası üzerinde ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ 

### 步骤 1: tam sebep maskası(Baş çizgi)

```python
def causal_mask(n):
    return [[0.0 if j <= i else float("-inf") for j in range(n)] for i in range(n)]
```

Ders 07'ün temel çizgisinden.

### 步骤 2: kaydırıcı pencerenin nedensel maskası

```python
def swa_mask(n, window):
    M = [[float("-inf")] * n for _ in range(n)]
    for i in range(n):
        lo = max(0, i - window + 1)
        for j in range(lo, i + 1):
            M[i][j] = 0.0
    return M
```

Bir parametre`window`- Evet.`window >= n`时,会恢复全因性注意──当`window = 1`时, her Token sadece kendine katılmak.

### 步骤 3: yerel + adımlı keskin maske

```python
def strided_mask(n, window, stride):
    M = [[float("-inf")] * n for _ in range(n)]
    for i in range(n):
        lo = max(0, i - window + 1)
        for j in range(lo, i + 1):
            M[i][j] = 0.0
        for j in range(0, i + 1, stride):
            M[i][j] = 0.0
    return M
```

密集本地窗 加上从序列开头开始每隔`stride`个 Token'ın konumları── ekstra kat sayısı arttıkça, 感受野以 log step 增长──

### 步骤 4: Farklı dikkat

```python
def diff_attention(Q1, K1, Q2, K2, V, lam):
    A1 = softmax_causal(Q1 @ K1.T / sqrt_d)
    A2 = softmax_causal(Q2 @ K2.T / sqrt_d)
    return (A1 - lam * A2) @ V
```

两次 Attention pass, using learning get mixing coefficient 相减──在代码中,我们比较单一注意与差异性注意的注意-sink热图,并观察 sink 缩──

### 步骤 5: KV önbelleği boyutları

- Evet .`N = 131072`Aşağı basın her değişkenin her kat sessiz boyutu──SWA 和稀 变体会降低 10100×──Differential 会翻倍──Sadarlı olarak hesaplarınızı ödemeniz gerekir──

## Kullan

2026 yılının üretim modeli:

```python
from transformers import AutoModelForCausalLM
# Gemma 3 mixes SWA (window=1024) and global layers at 5:1.
model = AutoModelForCausalLM.from_pretrained("google/gemma-3-27b-it")
# print(model.config.sliding_window, model.config.layer_types)
```

PyTorch 2.5+ 中的 FlexAttention  bir maske işlevi kabul edin:

```python
from torch.nn.attention.flex_attention import flex_attention, create_block_mask

def swa_pattern(b, h, q_idx, kv_idx):
    return (q_idx - kv_idx < 1024) & (q_idx >= kv_idx)

mask = create_block_mask(swa_pattern, B=batch, H=heads, Q_LEN=n, KV_LEN=n)
out = flex_attention(q, k, v, block_mask=mask)
```

Bu, otomatik olarak tanımlanan Triton çekirdeği olarak tercüme edilecek.

**何时选择哪一种：**

- **Pure full attention** Her katman en fazla 16K bağlamda uygundur, veya kontrol kalitesi çok önemlidir.
- **SWA + global mix** 长 context(>32K), training and inference 受内存限制──2026年 32K 以上的默认选择──
- **Sparse block attention** Öz tanımlı çekirdek、 öz tanımlı kalıp── özel çalışma yükü için saklanmak
- **Differential attention**   dikkat-sink kirliliği yaralanma yaratacaktır

## - Söyle.

Görüyorum .`outputs/skill-attention-variant-picker.md`◊ Bu beceri, hedef bağlam uzunluğuna, araştırma gereksinimlerine ve eğitim/söylem hesaplama profiline göre, yeni model için bir dikkat topolojisini seçmek için kullanılır.

## 练习

1. **Easy.**运行  İşlem`code/main.py`❖ Test`window=4`SWA'nın her satırında son 4 tane tokenin dışında olan tüm içeriği sıfırdan veriliyor.`window=n`会 bit-identically 复现 tam sebepli dikkat。
2. **Medium.**Ders 07 başta gerçekleşen`window=1024`SWA. # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
3. **Hard.**Önemli bir şekilde, gemma-3 tarzında 5:1 katman karışımı gerçekleştirilmiştir.
4. **Hard.**Her başın öğrenmesi gereken bir şey var .`λ`Differential Attention── in a synthetic retrieval task (Bir iğne, 2.000 个 dikkat dağıtıcı) on training── in parametre matching event, measurement relative to single-attention baseline of retrieval accuracy──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Sliding window attention (SWA) | "Local attention" | 每个 query attend 到最近 `W` 个 Token；KV cache 缩小到 `O(W)`。 |
| Effective receptive field | "模型能向后看多远" | 在一个窗口为 `W` 的 `L` 层 SWA stack 中，最多 `L × W` 个 Token。 |
| Longformer / BigBird | "Local + global + random" | Sparse pattern，包含少量始终 attend 的 global tokens；早期 long-context 方法。 |
| Native Sparse Attention | "DeepSeek's kernel trick" | 学习 block-level sparsity；在保持质量的同时，在 kernel 层面跳过零 block。 |
| Differential attention | "Two maps, one subtracts" | DIFF Transformer：从第一张 Attention map 中减去学习得到的 `λ` 倍第二张 Attention map，以抵消 attention sinks。 |
| Attention sink | "权重泄漏到 token 0" | Softmax normalization 强制行求和为 1；信息量不足的 query 会把权重倾倒到位置 0。 |
| FlexAttention | "Mask-as-Python" | PyTorch 2.5+ API，可将任意 mask function 编译成 FlashAttention 形状的 kernel。 |
| Layer type mix | "5:1 SWA-to-global" | 在 stack 中交错 sparse 和 full Attention 层，以更低内存保持质量。 |

## 延伸阅读

- [Beltagy, Peters, Cohan (2020). Longformer: The Long-Document Transformer](https://arxiv.org/abs/2004.05150) 经典的滑走窗+global-token 论文──
- [Zaheer et al. (2020). Big Bird: Transformers for Longer Sequences](https://arxiv.org/abs/2007.14062)Yerel + küresel + rastgele。
- [Child et al. (2019). Generating Long Sequences with Sparse Transformers](https://arxiv.org/abs/1904.10509) OpenAI'nin yerel+sırplı kalıpı¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- [Gemma Team (2024). Gemma 2: Improving Open Language Models at a Practical Size](https://arxiv.org/abs/2408.00118) 1:1 SWA: küresel karışım
- [Gemma Team (2025). Gemma 3 technical report](https://arxiv.org/abs/2503.19786) window=1024'in 5:1 karışımı, bugün kursu olarak kabul edilmiş bir yapılandırma olarak kullanılıyor.
- [Ye et al. (2024). Differential Transformer](https://arxiv.org/abs/2410.05258) DIFF Transformer 论文。
- [Yuan et al. (2025). Native Sparse Attention](https://arxiv.org/abs/2502.11089)DeepSeek-V3.2'nin öğrenilmiş-sparsity dikkat
- [PyTorch — FlexAttention blog and docs](https://pytorch.org/blog/flexattention/) Use It 中 mask-as-callable modelinin API referansı。
