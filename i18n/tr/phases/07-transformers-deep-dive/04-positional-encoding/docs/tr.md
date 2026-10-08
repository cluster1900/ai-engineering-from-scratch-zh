# Konut kodlaması  Sinusoidal, RoPE, ALiBi

> Dikkat 排列不敏感──没有位置信号 时,猫坐在床和马上猫在床上会产生相同输出──三种算法修复它

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 02 (Self-Attention), Phase 7 · 03 (Multi-Head Attention)
**Time:** ~45 分钟

## Sorun

Skalalı nokta- ürünün dikkatini 顺序不敏感―attention matrix `softmax(Q K^T / √d) V`Çiftlik benzerlikleri tarafından hesaplanmaktadır.`X`Çıkışın da aynı şekilde bozulması gerekir.

Bu bir kelime çantası modeli değil. Ama dil, kod, ses, video ve anlam taşıyan herhangi bir şey için ölümcül bir şey.

修复方法 is in some way to put position into embeddings.

1. **Absolute sinusoidal**(Vaswani 2017)。将 pozisyonu `sin/cos`Üzerine ekleme yapılması                                                                                                                                                                                                                                                            
2. **RoPE — Rotary Position Embeddings**(Su 2021) ・ göre göre göre göre 成比例の角度旋转 Q 和 K vektörleri──直接在点产品中编码 *相関* pozisyon──2026年 主流选择──
3. **ALiBi — Attention with Linear Biases**(Press 2022)。 tamamen atladı embedments; 极佳。

截至2026年, neredeyse tüm sınır açık modeli RoPE kullanıyor:Llama 2/3/4、Qwen 2/3、Mistral、Mixtral、DeepSeek-V3、Kimi。 az sayıda uzun bağlamlı model ALiBi veya onun modern变体。Absolu sinusoidal 已成为历史方案。

## Anlaşım

![Sinusoidal absolute vs RoPE rotations vs ALiBi distance bias](../assets/positional-encoding.svg)

### Kesin sinusoidal

预先计算一个形 为 `(max_len, d_model)`Düzgün Matrix`PE`- ...

```
PE[pos, 2i]   = sin(pos / 10000^(2i / d_model))
PE[pos, 2i+1] = cos(pos / 10000^(2i / d_model))
```

Sonra dikkat  önce gerçekleştirmek `X' = X + PE[:N]`◊ her boyut farklı frekanslı sinusoidlerdir.`max_len`后会失败:当模型只见过位置02047 时,没有什么告诉它位置2048 会发生什么──

### RoPE

旋转 Q 和 K vektörleri( gömülmemiş)。对对对 boyutları `(2i, 2i+1)`- ...

```
[q'_2i    ]   [ cos(pos·θ_i)  -sin(pos·θ_i) ] [q_2i   ]
[q'_2i+1  ] = [ sin(pos·θ_i)   cos(pos·θ_i) ] [q_2i+1 ]

θ_i = base^(-2i / d_head),  base = 10000 by default
```

Pozisyon için`pos_k`应用相同旋转──dot product `q'_m · k'_n`Sadece bağımlılıktan dönmüş olacağım.`(m - n)`Bu da bir ifade.**attention score 只依赖 relative distance**, dönme mutlak pozisyonlar tarafından gösterilmesine rağmen.

扩展 RoPE: 可以缩放 `base`(NTK-aware、YaRN、LongRoPE), böylece yeniden eğitilmemiş durumda daha uzun bağlamlara kadar ekstrapolasyon yapılır.

### ALiBi

跳过嵌入 技巧──直接给注意分加偏见:

```
attn_score[i, j] = (q_i · k_j) / √d  -  m_h · |i - j|
```

İçlerinden `m_h`Başın özel bir yamacıdır.`1 / 2^(8·h/H)`)。 Yakınlık tokenleri  güçlendirilmiş; uzaklık tokenleri  ceza görmüş。 hiç eğitim zaman maliyeti。

### 2026 yılında ne seçilecek?

| Variant | Extrapolation | Training cost | Used by |
|---------|---------------|---------------|---------|
| Absolute sinusoidal | 差 | 免费 | original transformer, early BERT |
| Learned absolute | 无 | 很小 | GPT-2, GPT-3 |
| RoPE | 配合 scaling 时很好 | 免费 | Llama 2/3/4, Qwen 2/3, Mistral, DeepSeek-V3, Kimi |
| RoPE + YaRN | 极佳 | fine-tune stage | Qwen2-1M, Llama 3.1 128K |
| ALiBi | 极佳 | 免费 | BLOOM, MPT, Baichuan |

RoPE 胜出, çünkü doğrudan dikkat çekebilir ve mimariyi değiştirmez, göreceli pozisyonu kodlayabilir ve `base`Hyperparameter uzun bağlamlı ince ayarlama için  provided clear旋──


```figure
rope-explorer
```

## Yapın

### Adım 1: Sinusoidal kodlama

Görüyorum .`code/main.py`△4 行计算:

```python
def sinusoidal(N, d):
    pe = [[0.0] * d for _ in range(N)]
    for pos in range(N):
        for i in range(d // 2):
            theta = pos / (10000 ** (2 * i / d))
            pe[pos][2 * i]     = math.sin(theta)
            pe[pos][2 * i + 1] = math.cos(theta)
    return pe
```

İlk dikkat katmanı 之前, onu yerleştirme matrisine 

### Adım 2: 应用于 Q、K'ın RoPE

RoPE 会在 Q 和 K 上原地操作──对对对对对对:

```python
def apply_rope(x, pos, base=10000):
    d = len(x)
    out = list(x)
    for i in range(d // 2):
        theta = pos / (base ** (2 * i / d))
        c, s = math.cos(theta), math.sin(theta)
        a, b = x[2 * i], x[2 * i + 1]
        out[2 * i]     = a * c - b * s
        out[2 * i + 1] = a * s + b * c
    return out
```

关键: pozisyon karşısında `m`                 `n`K  uygulaması aynı işlevi ve nokta ürünü her koordinat çiftinde bir tane elde eder.`cos((m-n)·θ_i)`Çünkü çocuk.

### Adım 3: ALiBi yamaçları 和 tarafsızlık

```python
def alibi_bias(n_heads, seq_len):
    # slope_h = 2 ** (-8 * h / n_heads) for h = 1..n_heads
    slopes = [2 ** (-8 * (h + 1) / n_heads) for h in range(n_heads)]
    bias = []
    for m in slopes:
        row = [[-m * abs(i - j) for j in range(seq_len)] for i in range(seq_len)]
        bias.append(row)
    return bias  # add to attention scores before softmax
```

- Ben de .`bias[h]`Başına kadar.`h``(seq_len, seq_len)`Dikkat puanı matrisi 上, sonra softmax──

### Adım 4: RoPE'nin göreceli mesafe özelliğini 验证

选两个随机向量 `a, b`İlk olarak.`(pos_a, pos_b)`旋转──再按 `(pos_a + k, pos_b + k)`旋转──两个点产品 必须在浮点错误内相等──这个性就是RoPE的全部意义它对绝对的抵消不变,只关心相对差──

## Kullan

PyTorch 2.5+ `torch.nn.functional`中提供 RoPE tiện íchları。 çoğu üretim kod kullanımı `flash_attn`Ya da`xformers`RoPE, dikkat çekirdeğinin içindeki uygulamalarda bulunacaktır.

```python
from transformers import AutoModel
model = AutoModel.from_pretrained("meta-llama/Llama-3.2-3B")
# model.config.rope_scaling → {"type": "yarn", "factor": 32.0, "original_max_position_embeddings": 8192}
```

**2026 年的 Long-context 技巧：**

- **NTK-aware interpolation。**4K'ten 16K'ye kadar genişlemiş olacak.`base`重新缩放为 `base * (scale_factor)^(d/(d-2))`- Evet.
- **YaRN。**Daha akıllı interpolasyon, uzun bağlamlarda dikkat entropiyi koruyabilir.
- **LongRoPE。**Microsoft 2024 yıl metod, her boyut için evrimsel arama kullanmak  ölçek faktörlerini seçmek Phi-3-Long kullanmak 👍
- **Position interpolation + fine-tuning。**Sadece genişleme faktörüne göre  küçültülmüş pozisyonlar, 5B tokensı ince ayarlama yapılması gerekir.

## Gönder

Görüyorum .`outputs/skill-positional-encoding-picker.md`◊ bu beceri, hedef bağlamın uzunluğuna göre, ekstrapolasyon ihtiyaçlarına ve eğitim bütçesine göre, yeni model seçerek kodlama stratejisini seçmek için kullanılır.

## Egzersizler

1. **Easy。**- Ben de .`max_len=512, d=128`Sinusoidal `PE`Matrix 図面 熱地図に 確認 寸索に伴い 増大,ストライプ 变宽のパターン──
2. **Medium。**实现 NTK-aware RoPE ölçeklendirme──在长度 256 的序列上训练微小LM,然后在长度 1024 上分别测试有规模和无规模的情况──测量困难──
3. **Hard。**Aynı dikkat modülü içinde ALiBi ve RoPE'yi gerçekleştirmek için 512 uzunluklı dizilerde üstü kopya görevi kullanın.

## Anahtar Terimler

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Positional encoding | “告诉 attention 顺序” | 添加到 embeddings 或 attention 中、用于编码 position 的任意 signal。 |
| Sinusoidal | “最初那个” | 以 geometric frequencies 加到 embeddings 上的 `sin/cos`；不能 extrapolate。 |
| RoPE | “Rotary embeddings” | 按 position-dependent angle 旋转 Q、K；dot product 编码 relative distance。 |
| ALiBi | “Linear bias trick” | 将 `-m·\|i-j\|` 加到 attention scores；不需要 embedding，extrapolation 很强。 |
| base | “RoPE 的旋钮” | RoPE 中的 frequency scaler；增大它可在 inference 时扩展 context。 |
| NTK-aware | “一种 RoPE scaling trick” | 重新缩放 `base`，让 context 扩展时 high-frequency dims 不会被挤压。 |
| YaRN | “高级那个” | 保留 attention entropy 的 per-dimension interpolation+extrapolation。 |
| Extrapolation | “能在训练长度之外工作” | position scheme 能否在训练时见过的 `max_len` 之外给出正确输出？ |

## Daha Fazla Okumak

- [Vaswani et al. (2017). Attention Is All You Need §3.5](https://arxiv.org/abs/1706.03762) 原始 sinusoidal──
- [Su et al. (2021). RoFormer: Enhanced Transformer with Rotary Position Embedding](https://arxiv.org/abs/2104.09864) RoPE kağıdı。
- [Press, Smith, Lewis (2021). Train Short, Test Long: Attention with Linear Biases Enables Input Length Extrapolation](https://arxiv.org/abs/2108.12409) ALiBi。
- [Peng et al. (2023). YaRN: Efficient Context Window Extension of Large Language Models](https://arxiv.org/abs/2309.00071) en son RoPE ölçeklendirme
- [Chen et al. (2023). Extending Context Window of Large Language Models via Positional Interpolation](https://arxiv.org/abs/2306.15595)Meta'nın Llama 2 uzun bağlamlı kağıdı
- [Ding et al. (2024). LongRoPE: Extending LLM Context Window Beyond 2 Million Tokens](https://arxiv.org/abs/2402.13753) Microsoft 方法,被 Phi-3-Long 使用,并使用它 部分引用──
- [HuggingFace Transformers — `modeling_rope_utils.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/modeling_rope_utils.py) RoPE ölçekleme sistemlerinin çeşitli üretim dereceli uygulamalar ((devayl 、lineer 、 dinamik 、 YaRN、 Long RoPE 、 Llama-3)
