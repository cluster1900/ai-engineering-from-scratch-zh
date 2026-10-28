---
id: positional-encoding
title: Positional Encoding: Sinusoidal, RoPE, ALiBi
code: PR
subtitle: 选择、构建并检查位置方案。Sinusoidal、learned、RoPE、YaRN 与 ALiBi 并排，用 Python。
hue: 285
sources: phases/07-transformers-deep-dive/04-positional-encoding, phases/19-capstone-projects/32-token-positional-embeddings, phases/10-llms-from-scratch/14-open-models-architecture-walkthroughs
source_hash: c52bb51c4688d3d8
---

## 并排对比
type: comparison
from: phases/07-transformers-deep-dive/04-positional-encoding/docs/en.md, phases/19-capstone-projects/32-token-positional-embeddings/docs/en.md

| 方案 | 作用位置 | 外推 | 训练成本 | 使用者 |
|---|---|---|---|---|
| Absolute sinusoidal | 嵌入，相加 | 差 | 免费 | 原始 transformer，早期 BERT |
| Learned absolute | 嵌入，查表 | 无 | 极小 | GPT-2，GPT-3 |
| RoPE | 旋转 Q 和 K | 配合缩放则好 | 免费 | Llama 2/3/4，Qwen 2/3，Mistral，DeepSeek-V3，Kimi |
| RoPE + YaRN | 旋转 Q 和 K | 优秀 | 微调阶段 | Qwen2-1M，Llama 3.1 128K |
| ALiBi | 注意力分数 | 优秀 | 免费 | BLOOM，MPT，Baichuan |

## 各方案作用在哪里
type: architecture
from: phases/07-transformers-deep-dive/04-positional-encoding/docs/en.md, phases/19-capstone-projects/32-token-positional-embeddings/docs/en.md

```arch
node | ids | 1,1 | Token ids | (B, T) | client
node | tok | 2,1 | Token embedding | (B, T, D) | store
node | abs | 3,1 | Add absolute PE | sinusoidal or learned | process
node | qk | 4,1 | Q and K | per head | process
node | rope | 4,2 | RoPE | rotate Q and K | process
node | score | 3,2 | Scores | q dot k over sqrt d | process
node | alibi | 2,2 | ALiBi bias | minus m_h times distance | process
node | soft | 1,2 | Softmax | then times V | process
edge | ids | tok | lookup
edge | tok | abs | sum
edge | abs | qk | X
edge | qk | rope | pos
edge | rope | score | dot
edge | score | alibi | add
edge | alibi | soft |
```

## 代码中的三种方案
type: annotated-code
lang: python
from: phases/07-transformers-deep-dive/04-positional-encoding/code/main.py

```python
def sinusoidal_pe(n, d, base=10000.0):  # add to embeddings
    theta = pos / (base ** (2 * i / d))  # one frequency per pair i
    pe[pos][2 * i] = math.sin(theta)  # even dim
    pe[pos][2 * i + 1] = math.cos(theta)  # odd dim
def apply_rope(x, pos, base=10000.0):  # call on Q and on K
    c = math.cos(theta)  # same theta as above
    out[2 * i] = a * c - b * s  # 2D rotation of pair i
    out[2 * i + 1] = a * s + b * c
def alibi_slopes(n_heads):  # one slope per head
    return [2 ** (-8 * (h + 1) / n_heads) for h in range(n_heads)]
row.append(-m * abs(i - j))  # bias for head slope m
row.append(float("-inf"))  # causal and j > i
```

## 代码中的任务
type: task-table
span: 2
from: phases/07-transformers-deep-dive/04-positional-encoding/code/main.py, phases/19-capstone-projects/32-token-positional-embeddings/code/main.py, phases/19-capstone-projects/32-token-positional-embeddings/docs/en.md

| 任务 | 代码 |
|---|---|
| Sinusoidal 表，n 个位置 | `sinusoidal_pe(n, d, base=10000.0)` |
| 旋转一个 Q 或 K 向量 | `apply_rope(x, pos, base=10000.0)` |
| 每个头的 ALiBi 偏置 | `alibi_bias(n_heads, seq_len, causal=True)` |
| Learned 表，每个位置一行 | `LearnedPositionalEmbedding(max_context_length, d_model)` |
| 固定表作为 buffer | `SinusoidalPositionalEmbedding(max_context_length, d_model)` |
| 把 token 与位置向量相加 | `EmbeddingComposer(token_emb, learned_pos)` |
| 邻居相似度诊断 | `neighbour_cosine_curve(table, max_offset=8)` |
| 跑演示 | `python3 code/main.py` |

## 检查 RoPE 的相对性质
type: flow
from: phases/07-transformers-deep-dive/04-positional-encoding/code/main.py, phases/07-transformers-deep-dive/04-positional-encoding/docs/en.md

1. **向量**：用 `rng.gauss(0, 1)` 抽 `q` 和 `k`，`d = 16`。
2. **旋转**：用同一函数对 `apply_rope(q, pq)` 和 `apply_rope(k, pk)`。
3. **分数**：对 (3, 5)、(7, 9)、(100, 102)、(1024, 1026) 算 `dot(q_rot, k_rot)`。
4. **期望**：所有 gap=2 的行在浮点误差内给出相同点积。
5. **Base 扫描**：对 base 10000、100000、1_000_000，在 `pos=4096` 和 `pos=4098` 打分。
6. **解读**：更大的 base 旋转更慢，上下文更长且不发生相位回绕。

## 默认值与数字
type: defaults
from: phases/07-transformers-deep-dive/04-positional-encoding/code/main.py, phases/19-capstone-projects/32-token-positional-embeddings/code/main.py, phases/10-llms-from-scratch/14-open-models-architecture-walkthroughs/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `base` | `10000.0` | Sinusoidal 与 RoPE |
| `rope_theta` | `500000.0` | Llama 3 8B，从 10k 缩放 |
| `causal` | `True` | `alibi_bias` 掩码 `j > i` |
| `DEFAULT_INIT_STD` | `0.02` | Learned 表初始化 |
| `max_offset` | `8` | `neighbour_cosine_curve` |
| `max_context_length` | `128` | `DemoConfig` |
| `d_model` | `64` | 试 32，看条带 |
| GPT-2 learned table | 1024 | Context 1025 超出表末端 |

## 用 RoPE 做长上下文
type: concepts
from: phases/07-transformers-deep-dive/04-positional-encoding/docs/en.md, phases/10-llms-from-scratch/14-open-models-architecture-walkthroughs/docs/en.md

- **base**：RoPE 频率缩放器。增大它可在推理时扩展上下文。
- **NTK-aware**：从 4K 扩到 16K+ 时，把 `base` 重标为 `base * (scale_factor)^(d/(d-2))`。
- **YaRN**：按维插值并保持注意力熵。Llama 3.1 128K 使用它。
- **LongRoPE**：进化搜索挑选每维缩放因子。Phi-3-Long 使用它。
- **位置插值**：按扩展因子缩小位置。微调 1–5B token。
- **结果**：Llama 3 用 RoPE 缩放从 8K 扩到 128K 上下文。

## 要读的配置字段
type: command-table
from: phases/10-llms-from-scratch/14-open-models-architecture-walkthroughs/docs/en.md, phases/10-llms-from-scratch/14-open-models-architecture-walkthroughs/code/main.py, phases/07-transformers-deep-dive/04-positional-encoding/docs/en.md

| 命令 | 作用 |
|---|---|
| `rope_theta` | RoPE 基频 |
| `max_position_embeddings` | 训练上下文长度 |
| `model.config.rope_scaling` | 缩放类型与因子，例如 yarn |
| `"position": "rope-yarn"` | 计算器里的 Qwen 2.5 72B |
| `"position": "rope-sliding"` | Gemma 2 9B，RoPE 加滑动层 |
| `"position": "learned"` | GPT-2 Small，1024 个位置 |
| `sliding_window` | 滑动层的最近 W 个 token |
| `layer_types` | 哪些层是 full 或 sliding |

## 故障排查
type: troubleshooting
from: phases/19-capstone-projects/32-token-positional-embeddings/code/main.py, phases/19-capstone-projects/32-token-positional-embeddings/docs/en.md, phases/07-transformers-deep-dive/04-positional-encoding/docs/en.md, phases/07-transformers-deep-dive/04-positional-encoding/code/main.py, phases/10-llms-from-scratch/14-open-models-architecture-walkthroughs/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| `seq_len <n> exceeds max_context_length <L>` | 输入长于表 | 提高 `max_context_length` |
| `d_model must be even for sinusoidal` | 奇数 `d_model` | 用偶数 `d_model` |
| `token and positional embeddings must share d_model` | 两个宽度 | 用同一个 `d_model` 构建两者 |
| 打乱 token 后输出相同 | 没有位置信号 | 加位置方案 |
| Learned 模型超过训练长度失败 | 那一行不存在 | 用带缩放的 RoPE |
| Sinusoidal 超过 `max_len` 失败 | 那些位置没有训练 | 用 RoPE 或 ALiBi |
| 相同 gap，RoPE 分数不同 | 只旋转了 Q 或只旋转了 K | 用 `apply_rope` 旋转两者 |
| 长上下文下 RoPE 变差 | 小 base 相位回绕 | 提高 `base`，试 YaRN |

## 何时用 X
type: tips
from: phases/07-transformers-deep-dive/04-positional-encoding/docs/en.md, phases/19-capstone-projects/32-token-positional-embeddings/docs/en.md, phases/10-llms-from-scratch/14-open-models-architecture-walkthroughs/docs/en.md

- 新解码器模型用 RoPE。每个 Llama、Mistral、Qwen、DeepSeek 和 Gemma 都用 RoPE。
- 扩展上下文且能付微调成本时用 RoPE + YaRN。
- 长度外推最重要且不想要嵌入时用 ALiBi。
- 想要无参数输入表时用 sinusoidal。对前沿模型它是历史方案。
- 仅在固定最大上下文时用 learned absolute，如 GPT-2。
- 在注意力步骤应用 RoPE 和 ALiBi，而不是在输入处。

## 问答
type: qa
from: phases/07-transformers-deep-dive/04-positional-encoding/docs/en.md, phases/19-capstone-projects/32-token-positional-embeddings/docs/en.md, phases/10-llms-from-scratch/14-open-models-architecture-walkthroughs/docs/en.md

- **注意力为什么需要位置？** 它对顺序盲目。打乱 `X` 的行会得到打乱的输出行。
- **为什么 RoPE 是相对的？** 点积在每一对上拾取 gap 乘 theta 的 cos。
- **相加还是拼接？** 相加。这样整网的 `D` 保持不变。
- **参数成本？** Learned 增加 `max_context_length * D`。Sinusoidal 增加零。
- **为什么 RoPE 赢了？** 不改架构，相对位置，还有用于长上下文的 `base` 旋钮。
- **初始化时 learned 与 sinusoidal？** Learned 邻居看起来随机。Sinusoidal 平滑衰减。
