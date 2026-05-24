# 位置编码 — Sinusoidal, RoPE, ALiBi

> Attention 对排列不敏感。"The cat sat on the mat" 和 "mat the on sat cat the" 在没有位置信号时会产生相同输出。三种算法解决了这个问题，并且各自对“位置”的含义做出了不同假设。

**类型：** 构建
**语言：** Python
**先修：** Phase 7 · 02 (Self-Attention), Phase 7 · 03 (Multi-Head Attention)
**时间：** ~45 分钟

## 问题

Scaled dot-product attention 对顺序无感。Attention matrix `softmax(Q K^T / √d) V` 是由成对相似度计算得到的。打乱 `X` 的行，输出的行也会以同样方式被打乱。Attention 内部没有任何东西关心位置。

这在 bag-of-words model 里不是 bug。但对于语言、代码、音频、视频，以及任何顺序承载意义的东西来说，这是致命的。

解决方法是以某种方式把位置注入到 embeddings 中。三个时代的答案：

1. **Absolute sinusoidal** (Vaswani 2017)。把位置的 `sin/cos` 加到 embedding 上。简单、无需学习，但对训练长度之外的外推很差。
2. **RoPE — Rotary Position Embeddings** (Su 2021)。按与位置成比例的角度旋转 Q 和 K vectors。直接在点积中编码*相对*位置。到 2026 年占主导地位。
3. **ALiBi — Attention with Linear Biases** (Press 2022)。完全跳过 embeddings；基于距离向 attention scores 添加每个 head 的线性惩罚。长度外推能力极佳。

截至 2026 年，几乎所有前沿开放模型都使用 RoPE：Llama 2/3/4, Qwen 2/3, Mistral, Mixtral, DeepSeek-V3, Kimi。少数 long-context models 使用 ALiBi 或其现代变体。Absolute sinusoidal 已属于历史方案。

## 概念

![Sinusoidal absolute vs RoPE rotations vs ALiBi distance bias](../assets/positional-encoding.svg)

### Absolute sinusoidal

预先计算一个形状为 `(max_len, d_model)` 的固定 Matrix `PE`：

```
PE[pos, 2i]   = sin(pos / 10000^(2i / d_model))
PE[pos, 2i+1] = cos(pos / 10000^(2i / d_model))
```

然后在 attention 前令 `X' = X + PE[:N]`。每个维度都是不同频率的正弦波。模型学习从相位模式中读取位置。它在 `max_len` 之外会失败：如果模型只见过位置 0–2047，没有任何东西告诉它位置 2048 会发生什么。

### RoPE

旋转 Q 和 K vectors（不是 embeddings）。对于一对维度 `(2i, 2i+1)`：

```
[q'_2i    ]   [ cos(pos·θ_i)  -sin(pos·θ_i) ] [q_2i   ]
[q'_2i+1  ] = [ sin(pos·θ_i)   cos(pos·θ_i) ] [q_2i+1 ]

θ_i = base^(-2i / d_head),  base = 10000 by default
```

对位置为 `pos_k` 的 keys 应用相同旋转。点积 `q'_m · k'_n` 会变成只依赖 `(m - n)` 的函数。也就是说：**attention score 只依赖相对距离**，尽管旋转是由绝对位置索引的。漂亮的技巧。

扩展 RoPE：可以缩放 `base`（NTK-aware, YaRN, LongRoPE），以便在不重新训练的情况下外推到更长 context。Llama 3 就是这样从 8K 扩展到 128K context 的。

### ALiBi

跳过 embedding 技巧。直接对 attention scores 加 bias：

```
attn_score[i, j] = (q_i · k_j) / √d  -  m_h · |i - j|
```

其中 `m_h` 是某个 head-specific slope（例如 `1 / 2^(8·h/H)`）。更近的 tokens 会被增强；更远的 tokens 会被惩罚。没有训练时成本。论文表明，长度外推优于 sinusoidal，并且在原始训练长度上与 RoPE 相当。

### 2026 年该选什么

| 变体 | 外推能力 | 训练成本 | 使用者 |
|---------|---------------|---------------|---------|
| Absolute sinusoidal | 差 | 免费 | 原始 Transformer, 早期 BERT |
| Learned absolute | 无 | 极小 | GPT-2, GPT-3 |
| RoPE | 配合缩放时良好 | 免费 | Llama 2/3/4, Qwen 2/3, Mistral, DeepSeek-V3, Kimi |
| RoPE + YaRN | 极佳 | fine-tune 阶段 | Qwen2-1M, Llama 3.1 128K |
| ALiBi | 极佳 | 免费 | BLOOM, MPT, Baichuan |

RoPE 胜出，是因为它可以无缝融入 attention 而不改变架构，能编码相对位置，并且它的 `base` hyperparameter 为 long-context fine-tuning 提供了一个清晰的调节旋钮。

## 构建它

### 步骤 1: sinusoidal encoding

见 `code/main.py`。一个 4 行计算：

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

在第一个 attention layer 之前，把它加到 embedding matrix 上。

### 步骤 2: RoPE 应用于 Q, K

RoPE 原地作用于 Q 和 K。对于每一对维度：

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

关键点：对位置 `m` 的 Q 和位置 `n` 的 K 应用相同函数。它们的点积会在每个坐标对上获得一个 `cos((m-n)·θ_i)` 因子。Attention 免费学到相对位置。

### 步骤 3：ALiBi slopes 与 bias

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

把 `bias[h]` 加到 head `h` 的 `(seq_len, seq_len)` attention score matrix 上，然后 softmax。

### 步骤 4: 验证 RoPE 的相对距离属性

选两个随机 vectors `a, b`。先按 `(pos_a, pos_b)` 旋转，再按 `(pos_a + k, pos_b + k)` 旋转。两个点积必须在浮点误差范围内匹配。这个性质就是 RoPE 的全部意义：它对绝对偏移不变，只关心相对间隔。

## 使用它

PyTorch 2.5+ 在 `torch.nn.functional` 中提供 RoPE utilities。大多数生产代码使用 `flash_attn` 或 `xformers`，其中 RoPE 会在 attention kernel 内部应用。

```python
from transformers import AutoModel
model = AutoModel.from_pretrained("meta-llama/Llama-3.2-3B")
# model.config.rope_scaling → {"type": "yarn", "factor": 32.0, "original_max_position_embeddings": 8192}
```

**2026 年的 long-context 技巧：**

- **NTK-aware interpolation.** 从 4K 扩展到 16K+ 时，把 `base` 重缩放为 `base * (scale_factor)^(d/(d-2))`。
- **YaRN.** 更智能的 interpolation，能在 long contexts 上保持 attention entropy。Llama 3.1 128K 使用它。
- **LongRoPE.** Microsoft 2024 年的方法，使用 evolutionary search 为每个维度选择缩放因子。Phi-3-Long 使用它。
- **Position interpolation + fine-tuning.** 直接按扩展因子缩小位置，然后 fine-tune 1–5B tokens。效果出人意料地好。

## 交付它

见 `outputs/skill-positional-encoding-picker.md`。这个 skill 会根据目标 context length、外推需求和训练预算，为新模型选择一种 encoding 策略。

## 练习

1. **Easy.** 将 `max_len=512, d=128` 的 sinusoidal `PE` matrix 绘制为 heatmap。确认“随着维度索引增大，条纹变宽”的模式。
2. **Medium.** 实现 NTK-aware RoPE scaling。在长度为 256 的序列上训练一个 tiny LM，然后在长度 1024 上分别测试有无 scaling 的情况。测量 perplexity。
3. **Hard.** 在同一个 attention module 中实现 ALiBi 和 RoPE。在长度 512 的 copy task 序列上训练一个 4 层 Transformer。测试时外推到 2048。比较退化程度。

## 关键术语

| 术语 | 人们通常怎么说 | 它实际意味着什么 |
|------|-----------------|-----------------------|
| Positional encoding | “告诉 attention 顺序” | 添加到 embeddings 或 attention 中、用于编码位置的任何信号。 |
| Sinusoidal | “最原始的那个” | 以几何频率变化的 `sin/cos`，添加到 embeddings；不能外推。 |
| RoPE | “Rotary embeddings” | 按位置相关角度旋转 Q、K；点积编码相对距离。 |
| ALiBi | “线性 bias 技巧” | 向 attention scores 添加 `-m·|i-j|`；不需要 embedding，外推能力很强。 |
| base | “RoPE 的旋钮” | RoPE 中的频率缩放器；增大它可以在推理时扩展 context。 |
| NTK-aware | “一种 RoPE scaling 技巧” | 重缩放 `base`，使 context 扩展时高频维度不会被挤压。 |
| YaRN | “更高级的那个” | 保持 attention entropy 的逐维 interpolation+extrapolation。 |
| Extrapolation | “能在训练长度之外工作” | position scheme 能否在训练中见过的 `max_len` 之外仍给出正确输出？ |

## 延伸阅读

- [Vaswani et al. (2017). Attention Is All You Need §3.5](https://arxiv.org/abs/1706.03762) — 原始 sinusoidal。
- [Su et al. (2021). RoFormer: Enhanced Transformer with Rotary Position Embedding](https://arxiv.org/abs/2104.09864) — RoPE 论文。
- [Press, Smith, Lewis (2021). Train Short, Test Long: Attention with Linear Biases Enables Input Length Extrapolation](https://arxiv.org/abs/2108.12409) — ALiBi。
- [Peng et al. (2023). YaRN: Efficient Context Window Extension of Large Language Models](https://arxiv.org/abs/2309.00071) — 当前最先进的 RoPE scaling。
- [Chen et al. (2023). Extending Context Window of Large Language Models via Positional Interpolation](https://arxiv.org/abs/2306.15595) — Meta 的 Llama 2 long-context 论文。
- [Ding et al. (2024). LongRoPE: Extending LLM Context Window Beyond 2 Million Tokens](https://arxiv.org/abs/2402.13753) — Phi-3-Long 使用、并在 Use It 部分引用的 Microsoft 方法。
- [HuggingFace Transformers — `modeling_rope_utils.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/modeling_rope_utils.py) — 各类 RoPE scaling scheme（default, linear, dynamic, YaRN, LongRoPE, Llama-3）的生产级实现。
