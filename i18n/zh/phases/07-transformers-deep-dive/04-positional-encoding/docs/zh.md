# 位置编码 鼻状,ROPE,ALiBi

> 注意排列不敏感──没有位置信号 时,猫坐在床和猫上猫会产生相同输出──三种算法修复它 每种都对位置的含义做了不同的下注──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 02 (Self-Attention), Phase 7 · 03 (Multi-Head Attention)
**Time:** ~45 分钟

## 问题

标级点产品关注顺序不敏感――注意力矩阵`softmax(Q K^T / √d) V`由双相似性计算得到.`X`关注 内部没有什么关心位置──

这不是一个错误的词包模型,但对于语言,代码,音频,视频以及任何命令,

修复方法是以某种方式将位置插入嵌入式中.

1. **Absolute sinusoidal**现在,我们已经开始做了一些事情.`sin/cos`简单、不需要学习参数,但对训练长度之外的抽象非常差.
2. **RoPE — Rotary Position Embeddings**根据位置 成比例的角度旋转Q和K向量──直接在点产品中编码 *相对*位置──2026年的主流选择──
3. **ALiBi — Attention with Linear Biases**根据距离 给注意力分数加上每头线性罚款 长度抽象 极佳。

截至2026年,几乎所有边境开放模型都使用RoPE:Llama 2/3/4、Qwen 2/3、Mistral、Mixtral、DeepSeek-V3、Kimi──少数长文本模型使用ALiBi或其现代变体──绝对突形已成为历史方案──

## 概念

![Sinusoidal absolute vs RoPE rotations vs ALiBi distance bias](../assets/positional-encoding.svg)

### 绝对的阴影状

预先计算一个形状 为`(max_len, d_model)`固定矩阵`PE`其他:

```
PE[pos, 2i]   = sin(pos / 10000^(2i / d_model))
PE[pos, 2i+1] = cos(pos / 10000^(2i / d_model))
```

然后在注意之前执行`X' = X + PE[:N]`△每个维度都是不同频率的阴影.`max_len`后会失败:当模型只看到位置 02047 时,没有什么告诉它位置 2048 会发生什么.

### 子

旋转Q和K向量 (不是嵌入式) △对对尺寸`(2i, 2i+1)`其他:

```
[q'_2i    ]   [ cos(pos·θ_i)  -sin(pos·θ_i) ] [q_2i   ]
[q'_2i+1  ] = [ sin(pos·θ_i)   cos(pos·θ_i) ] [q_2i+1 ]

θ_i = base^(-2i / d_head),  base = 10000 by default
```

对于位置`pos_k`的关键 应用相同的旋转.`q'_m · k'_n`变得依赖`(m - n)`的函数──也就是说:**attention score 只依赖 relative distance**虽然旋转是绝对的位置指引的.

扩展 可缩放`base`为了在不重新训练的情况下,将其推移到更长的背景下.

### 鱼

跳过嵌入 技巧──直接给注意力分数加偏见:

```
attn_score[i, j] = (q_i · k_j) / √d  -  m_h · |i - j|
```

其中`m_h`是头部特定的斜率`1 / 2^(8·h/H)`,长度抽出比突状,并与RoPE相平.

### 2026年该选择什么

| Variant | Extrapolation | Training cost | Used by |
|---------|---------------|---------------|---------|
| Absolute sinusoidal | 差 | 免费 | original transformer, early BERT |
| Learned absolute | 无 | 很小 | GPT-2, GPT-3 |
| RoPE | 配合 scaling 时很好 | 免费 | Llama 2/3/4, Qwen 2/3, Mistral, DeepSeek-V3, Kimi |
| RoPE + YaRN | 极佳 | fine-tune stage | Qwen2-1M, Llama 3.1 128K |
| ALiBi | 极佳 | 免费 | BLOOM, MPT, Baichuan |

罗佩胜出,是因为它可以直接插入注意力而不会改变建筑,能编码相对位置,并且它`base`为了长文本细调,提供了清晰旋──


```figure
rope-explorer
```

## 建立它

### 步骤1:突状编码

见`code/main.py`△4 行计算:

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

在第一个注意力层之前,将它添加到嵌入矩阵上.

### 应用于Q、K的ROPE

的的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,的,,的,的,,的,,的,,的,,,的,,,的,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,

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

关键:对位置`m`和位置`n`它们的点产量会在每个坐标对上获得一个.`cos((m-n)·θ_i)`因子──注意 免费学到相对位置──

### 步骤3:ALiBi斜率和偏差

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

将`bias[h]`加入到头`h`的`(seq_len, seq_len)`关注分数矩阵上,然后软max──

### 验证 RoPE 的相对距离属性

选两个随机向量`a, b`首先按`(pos_a, pos_b)`旋转.再按.`(pos_a + k, pos_b + k)`旋转――两个点产品 必须在浮点错误内相等――这个性质就是RoPE的全部意义它对绝对的抵消不变,只关心相对差距――

## 用它

火 2.5+ 在`torch.nn.functional`中提供RoPE公用事业――大多数生产代码使用`flash_attn`或`xformers`通过" "来实现,

```python
from transformers import AutoModel
model = AutoModel.from_pretrained("meta-llama/Llama-3.2-3B")
# model.config.rope_scaling → {"type": "yarn", "factor": 32.0, "original_max_position_embeddings": 8192}
```

**2026 年的 Long-context 技巧：**

- **NTK-aware interpolation。**从4K扩展到16K+时,将`base`重新缩放为`base * (scale_factor)^(d/(d-2))`,我知道.
- **YaRN。**更聪明的插图,可在长文本上保留注意力化――Llama 3.1 128K 使用它――
- **LongRoPE。**微软 2024年方法,使用进化搜索为每个维度 选择尺度因素――Phi-3-Long 使用它――
- **Position interpolation + fine-tuning。**根据扩展因子缩小位置,并调整15B代币.

## 运送它

见`outputs/skill-positional-encoding-picker.md`△该技能会根据目标背景长度,外分需求和培训预算,为新模型选择编码策略.

## 运动

1. **Easy。**将`max_len=512, d=128`状的状`PE`矩阵图为热图,确认随着尺寸指数增长,条纹变宽的模式.
2. **Medium。**实现NTK意识的ROPE扩展――在长度256的序列上训练小LM,然后在长度1024上分别测试有扩展和没有扩展的情况――测量困难――
3. **Hard。**在同一注意力模块中实现ALiBi和RoPE──在512个长度的序列上使用复制任务训练4层变压器──测试时提升到2048──比较降解──

## 关键词

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

## 进一步阅读

- [Vaswani et al. (2017). Attention Is All You Need §3.5](https://arxiv.org/abs/1706.03762) 原始的阴影状
- [Su et al. (2021). RoFormer: Enhanced Transformer with Rotary Position Embedding](https://arxiv.org/abs/2104.09864)        
- [Press, Smith, Lewis (2021). Train Short, Test Long: Attention with Linear Biases Enables Input Length Extrapolation](https://arxiv.org/abs/2108.12409)  
- [Peng et al. (2023). YaRN: Efficient Context Window Extension of Large Language Models](https://arxiv.org/abs/2309.00071)最先进的ROPE扩展――
- [Chen et al. (2023). Extending Context Window of Large Language Models via Positional Interpolation](https://arxiv.org/abs/2306.15595) Meta 的 Llama 2 长文本论文──
- [Ding et al. (2024). LongRoPE: Extending LLM Context Window Beyond 2 Million Tokens](https://arxiv.org/abs/2402.13753)微软方法,被 Phi-3-Long 使用,并使用它部分引用.
- [HuggingFace Transformers — `modeling_rope_utils.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/modeling_rope_utils.py) 各种RoPE扩展方案的生产级实施:
