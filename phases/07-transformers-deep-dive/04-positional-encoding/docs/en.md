# Positional Encoding — Sinusoidal, RoPE, ALiBi

> Attention 是 permutation-invariant 的。“The cat sat on the mat”和“mat the on sat cat the”如果没有位置信号，会产生相同的输出。有三种算法可以解决它，而且每一种都对“position”意味着什么做出了不同假设。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 02 (Self-Attention), Phase 7 · 03 (Multi-Head Attention)
**Time:** ~45 分钟

## 问题

Scaled dot-product attention 对顺序是盲目的。Attention Matrix `softmax(Q K^T / √d) V` 是由成对相似度计算出来的。把 `X` 的行打乱，输出的行也会以同样方式被打乱。Attention 内部没有任何东西关心 position。

在 bag-of-words model 中，这不是 bug。但对于语言、代码、音频、视频，也就是任何顺序承载意义的东西来说，这是致命的。

解决办法是以某种方式把 position 注入 Embedding。三个时代的答案：

1. **Absolute sinusoidal** (Vaswani 2017)。把 position 的 `sin/cos` 加到 Embedding 上。简单、无需学习，但在训练长度之外 extrapolate 很差。
2. **RoPE — Rotary Position Embeddings** (Su 2021)。按与 position 成正比的角度旋转 Q 和 K Vector。直接在 dot product 中编码*相对* position。2026 年的主流方案。
3. **ALiBi — Attention with Linear Biases** (Press 2022)。完全跳过 Embedding；根据距离给 attention score 加一个每个 head 独有的线性惩罚。长度 extrapolation 很强。

截至 2026 年，几乎所有前沿开源模型都使用 RoPE：Llama 2/3/4、Qwen 2/3、Mistral、Mixtral、DeepSeek-V3、Kimi。少数 long-context 模型使用 ALiBi 或其现代变体。Absolute sinusoidal 已经偏历史化。

## 概念

![Sinusoidal absolute vs RoPE rotations vs ALiBi distance bias](../assets/positional-encoding.svg)

### Absolute sinusoidal

预先计算一个形状为 `(max_len, d_model)` 的固定 Matrix `PE`：

```
PE[pos, 2i]   = sin(pos / 10000^(2i / d_model))
PE[pos, 2i+1] = cos(pos / 10000^(2i / d_model))
```

然后在 attention 之前执行 `X' = X + PE[:N]`。每个维度都是不同频率的正弦波。模型会学习从相位模式中读取 position。它在 `max_len` 之外会失败：如果模型只见过位置 0–2047，就没有任何东西告诉它 position 2048 会发生什么。

### RoPE

旋转 Q 和 K Vector（不是 Embedding）。对于一对维度 `(2i, 2i+1)`：

```
[q'_2i    ]   [ cos(pos·θ_i)  -sin(pos·θ_i) ] [q_2i   ]
[q'_2i+1  ] = [ sin(pos·θ_i)   cos(pos·θ_i) ] [q_2i+1 ]

θ_i = base^(-2i / d_head),  base = 10000 by default
```

对 position 为 `pos_k` 的 key 应用同样的旋转。dot product `q'_m · k'_n` 会变成只依赖 `(m - n)` 的函数。也就是说：**attention score 只取决于相对距离**，尽管旋转本身是由绝对 position 驱动的。一个漂亮的技巧。

扩展 RoPE：可以缩放 `base`（NTK-aware、YaRN、LongRoPE），从而无需重新训练就 extrapolate 到更长 context。Llama 3 就是用这种方式从 8K context 扩展到 128K。

### ALiBi

跳过 Embedding 技巧。直接给 attention score 加 bias：

```
attn_score[i, j] = (q_i · k_j) / √d  -  m_h · |i - j|
```

其中 `m_h` 是 head-specific slope（例如 `1 / 2^(8·h/H)`）。更近的 token 会被增强；更远的 token 会被惩罚。没有训练时成本。论文显示，长度 extrapolation 超过 sinusoidal，并且在原始训练长度上能匹配 RoPE。

### 2026 年该选什么

| Variant | Extrapolation | Training cost | Used by |
|---------|---------------|---------------|---------|
| Absolute sinusoidal | 差 | 免费 | original transformer, early BERT |
| Learned absolute | 无 | 很小 | GPT-2, GPT-3 |
| RoPE | 配合 scaling 时良好 | 免费 | Llama 2/3/4, Qwen 2/3, Mistral, DeepSeek-V3, Kimi |
| RoPE + YaRN | 优秀 | fine-tune 阶段 | Qwen2-1M, Llama 3.1 128K |
| ALiBi | 优秀 | 免费 | BLOOM, MPT, Baichuan |

RoPE 胜出，是因为它可以Embedding attention 而不改变架构，能编码相对 position，并且它的 `base` hyperparameter 为 long-context fine-tuning 提供了一个干净的调节旋钮。

## 构建它

### Step 1: sinusoidal encoding

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

在第一层 attention layer 之前，把它加到 Embedding Matrix 上。

### Step 2: RoPE applied to Q, K

RoPE 原地作用于 Q 和 K。对每一对维度：

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

关键点：对 position `m` 的 Q 和 position `n` 的 K 应用同一个函数。它们的 dot product 会在每一对坐标上得到一个 `cos((m-n)·θ_i)` 因子。Attention 免费学到了相对 position。

### Step 3: ALiBi slopes and bias

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

把 `bias[h]` 加到 head `h` 的 `(seq_len, seq_len)` attention score Matrix 上，然后执行 softmax。

### Step 4: verify relative-distance property of RoPE

选两个随机 Vector `a, b`。先按 `(pos_a, pos_b)` 旋转。再按 `(pos_a + k, pos_b + k)` 旋转。两个 dot product 必须在浮点误差范围内一致。这个性质正是 RoPE 的核心：它对绝对 offset 不变，只关心相对间隔。

## 使用它

PyTorch 2.5+ 在 `torch.nn.functional` 中提供了 RoPE utilities。大多数生产代码使用 `flash_attn` 或 `xformers`，其中 RoPE 会在 attention kernel 内部应用。

```python
from transformers import AutoModel
model = AutoModel.from_pretrained("meta-llama/Llama-3.2-3B")
# model.config.rope_scaling → {"type": "yarn", "factor": 32.0, "original_max_position_embeddings": 8192}
```

**2026 年的 long-context 技巧：**

- **NTK-aware interpolation.** 从 4K 扩展到 16K+ 时，把 `base` 重新缩放为 `base * (scale_factor)^(d/(d-2))`。
- **YaRN.** 更聪明的 interpolation，在 long context 上保持 attention entropy。Llama 3.1 128K 使用它。
- **LongRoPE.** Microsoft 2024 年的方法，使用 evolutionary search 为每个维度选择 scale factor。Phi-3-Long 使用它。
- **Position interpolation + fine-tuning.** 直接按扩展因子缩小 position，然后 fine-tune 1–5B tokens。效果出奇地好。

## 交付它

见 `outputs/skill-positional-encoding-picker.md`。这个 skill 会根据目标 context length、extrapolation 需求和 training budget，为新模型选择 encoding strategy。

## 练习

1. **Easy.** 将 `max_len=512, d=128` 的 sinusoidal `PE` Matrix 绘制为 heatmap。确认“随着维度索引增大，条纹变宽”的模式。
2. **Medium.** 实现 NTK-aware RoPE scaling。在长度 256 的序列上训练一个 tiny LM，然后在长度 1024 上分别测试有无 scaling 的结果。测量 perplexity。
3. **Hard.** 在同一个 attention module 中实现 ALiBi 和 RoPE。在长度 512 的 copy task 上训练一个 4-layer transformer。测试时 extrapolate 到 2048。比较退化程度。

## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Positional encoding | “告诉 attention 顺序信息” | 添加到 Embedding 或 attention 中、用于编码 position 的任何信号。 |
| Sinusoidal | “最原始的那个” | 以几何频率变化的 `sin/cos`，加到 Embedding 上；不能 extrapolate。 |
| RoPE | “Rotary embeddings” | 按 position-dependent angle 旋转 Q、K；dot product 编码相对距离。 |
| ALiBi | “Linear bias trick” | 把 `-m·|i-j|` 加到 attention score 上；不需要 Embedding，extrapolation 很强。 |
| base | “RoPE 的旋钮” | RoPE 中的频率缩放器；增大它可以在 inference 时扩展 context。 |
| NTK-aware | “一种 RoPE scaling trick” | 重新缩放 `base`，让 context 扩展时高频维度不会被挤压。 |
| YaRN | “更高级的那个” | 每维度 interpolation+extrapolation，用来保持 attention entropy。 |
| Extrapolation | “在训练长度之外也能工作” | position scheme 能否在超过训练时见过的 `max_len` 后继续给出正确输出？ |

## Further Reading

- [Vaswani et al. (2017). Attention Is All You Need §3.5](https://arxiv.org/abs/1706.03762) — 原始 sinusoidal。
- [Su et al. (2021). RoFormer: Enhanced Transformer with Rotary Position Embedding](https://arxiv.org/abs/2104.09864) — RoPE 论文。
- [Press, Smith, Lewis (2021). Train Short, Test Long: Attention with Linear Biases Enables Input Length Extrapolation](https://arxiv.org/abs/2108.12409) — ALiBi。
- [Peng et al. (2023). YaRN: Efficient Context Window Extension of Large Language Models](https://arxiv.org/abs/2309.00071) — 最先进的 RoPE scaling。
- [Chen et al. (2023). Extending Context Window of Large Language Models via Positional Interpolation](https://arxiv.org/abs/2306.15595) — Meta 的 Llama 2 long-context 论文。
- [Ding et al. (2024). LongRoPE: Extending LLM Context Window Beyond 2 Million Tokens](https://arxiv.org/abs/2402.13753) — Phi-3-Long 使用、并在 Use It 一节中引用的 Microsoft 方法。
- [HuggingFace Transformers — `modeling_rope_utils.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/modeling_rope_utils.py) — 每种 RoPE scaling scheme（default、linear、dynamic、YaRN、LongRoPE、Llama-3）的生产级实现。
