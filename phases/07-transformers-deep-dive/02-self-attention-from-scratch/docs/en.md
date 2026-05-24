# 从零实现 Self-Attention

> Attention 是一个查询表，其中每个词都会问：“谁对我重要？”并学习答案。

**类型：** 构建
**语言：** Python
**先修要求：** Phase 3 (Deep Learning Core), Phase 5 Lesson 10 (Sequence-to-Sequence)
**时间：** ~90 分钟

## 学习目标

- 仅使用 NumPy 从零实现 scaled dot-product self-attention，包括 query/key/value 投影和 softmax 加权求和
- 构建 multi-head attention 层，用于拆分 head、计算并行 attention，并拼接结果
- 追踪 attention matrix 如何捕捉 Token 关系，并解释为什么除以 sqrt(d_k) 可以防止 softmax 饱和
- 应用 causal masking，将 bidirectional attention 转换为 autoregressive（decoder-style）attention

## 问题

RNNs 一次处理一个 Token。等你到达第 50 个 Token 时，来自第 1 个 Token 的信息已经被压缩了 50 次。长距离依赖会被挤压进一个固定大小的 hidden state 中——这是一个瓶颈，再多的 LSTM gating 也无法完全解决。

2014 年的 Bahdanau attention 论文展示了解法：让 decoder 回看每个 encoder 位置，并判断哪些位置对当前步骤重要。但它仍然是附加在 RNN 上的。2017 年的 "Attention Is All You Need" 论文提出了一个更尖锐的问题：如果 Attention 是*唯一*机制呢？没有 recurrence。没有 convolution。只有 Attention。

Self-attention 让序列中的每个位置都能在单个并行步骤中 attend 到其他每个位置。这正是 transformers 快速、可扩展且占据主导地位的原因。

## 概念

### 数据库查询类比

把 Attention 想象成一种软数据库查询：

```
Traditional database:
  Query: "capital of France"  -->  exact match  -->  "Paris"

Attention:
  Query: "capital of France"  -->  similarity to ALL keys  -->  weighted blend of ALL values
```

每个 Token 会生成三个 vectors：
- **Query (Q)**： “我在寻找什么？”
- **Key (K)**： “我包含什么？”
- **Value (V)**： “如果被选中，我提供什么信息？”

一个 query 与所有 keys 的 dot product 会产生 attention scores。高分表示“这个 key 匹配我的 query”。这些 scores 会对 values 加权。输出是 values 的加权和。

### Q、K、V 计算

每个 Token embedding 都会通过三个学习得到的 weight matrices 进行投影：

```
Input embeddings (sequence of n tokens, each d-dimensional):

  X = [x1, x2, x3, ..., xn]       shape: (n, d)

Three weight matrices:

  Wq  shape: (d, dk)
  Wk  shape: (d, dk)
  Wv  shape: (d, dv)

Projections:

  Q = X @ Wq    shape: (n, dk)      each token's query
  K = X @ Wk    shape: (n, dk)      each token's key
  V = X @ Wv    shape: (n, dv)      each token's value
```

从视觉上看，对于一个 Token：

```
             Wq
  x_i ------[*]------> q_i    "What am I looking for?"
       |
       |     Wk
       +----[*]------> k_i    "What do I contain?"
       |
       |     Wv
       +----[*]------> v_i    "What do I offer?"
```

### Attention Matrix

一旦你获得了所有 Tokens 的 Q、K、V，attention scores 就会形成一个 Matrix：

```
Scores = Q @ K^T    shape: (n, n)

              k1    k2    k3    k4    k5
        +-----+-----+-----+-----+-----+
   q1   | 2.1 | 0.3 | 0.1 | 0.8 | 0.2 |   <- how much q1 attends to each key
        +-----+-----+-----+-----+-----+
   q2   | 0.4 | 1.9 | 0.7 | 0.1 | 0.3 |
        +-----+-----+-----+-----+-----+
   q3   | 0.2 | 0.6 | 2.3 | 0.5 | 0.1 |
        +-----+-----+-----+-----+-----+
   q4   | 0.9 | 0.1 | 0.4 | 1.7 | 0.6 |
        +-----+-----+-----+-----+-----+
   q5   | 0.1 | 0.3 | 0.2 | 0.5 | 2.0 |
        +-----+-----+-----+-----+-----+

Each row: one token's attention over the entire sequence
```

### 为什么要缩放？

dot products 会随着维度 dk 增大。如果 dk = 64，dot products 可能达到几十的范围，把 softmax 推入 Gradient 消失的区域。解法是：除以 sqrt(dk)。

```
Scaled scores = (Q @ K^T) / sqrt(dk)
```

这会把数值保持在 softmax 能产生有用 Gradients 的范围内。

### Softmax 将 Scores 转为 Weights

Softmax 会将原始 scores 转换为每一行上的概率分布：

```
Raw scores for q1:   [2.1, 0.3, 0.1, 0.8, 0.2]
                            |
                         softmax
                            |
Attention weights:   [0.52, 0.09, 0.07, 0.14, 0.08]   (sums to ~1.0)
```

现在，每个 Token 都有一组 weights，表示它应该在多大程度上 attend 到其他每个 Token。

### Values 的加权和

每个 Token 的最终输出是所有 value vectors 的加权和：

```
output_i = sum( attention_weight[i][j] * v_j  for all j )

For token 1:
  output_1 = 0.52 * v1 + 0.09 * v2 + 0.07 * v3 + 0.14 * v4 + 0.08 * v5
```

### 完整流程

```
                    +-------+
  X (input)  ----->|  @ Wq  |-----> Q
                    +-------+
                    +-------+
  X (input)  ----->|  @ Wk  |-----> K
                    +-------+                     +----------+
                    +-------+                     |          |
  X (input)  ----->|  @ Wv  |-----> V ---------->| weighted |----> output
                    +-------+          ^          |   sum    |
                                       |          +----------+
                              +--------+--------+
                              |    softmax      |
                              +---------+-------+
                                        ^
                              +---------+-------+
                              | Q @ K^T / sqrt  |
                              +-----------------+
```

一行公式：

```
Attention(Q, K, V) = softmax( Q @ K^T / sqrt(dk) ) @ V
```

## 构建它

### 步骤 1：从零实现 Softmax

Softmax 会将原始 logits 转换为概率。为了数值稳定性，先减去最大值。

```python
import numpy as np

def softmax(x):
    shifted = x - np.max(x, axis=-1, keepdims=True)
    exp_x = np.exp(shifted)
    return exp_x / np.sum(exp_x, axis=-1, keepdims=True)

logits = np.array([2.0, 1.0, 0.1])
print(f"logits:  {logits}")
print(f"softmax: {softmax(logits)}")
print(f"sum:     {softmax(logits).sum():.4f}")
```

### 步骤 2：Scaled dot-product attention

核心函数。接收 Q、K、V matrices，并返回 attention output 和 weight matrix。

```python
def scaled_dot_product_attention(Q, K, V):
    dk = Q.shape[-1]
    scores = Q @ K.T / np.sqrt(dk)
    weights = softmax(scores)
    output = weights @ V
    return output, weights
```

### 步骤 3：带学习投影的 Self-attention class

一个完整的 self-attention module，包含使用 Xavier-like scaling 初始化的 Wq、Wk、Wv weight matrices。

```python
class SelfAttention:
    def __init__(self, d_model, dk, dv, seed=42):
        rng = np.random.default_rng(seed)
        scale = np.sqrt(2.0 / (d_model + dk))
        self.Wq = rng.normal(0, scale, (d_model, dk))
        self.Wk = rng.normal(0, scale, (d_model, dk))
        scale_v = np.sqrt(2.0 / (d_model + dv))
        self.Wv = rng.normal(0, scale_v, (d_model, dv))
        self.dk = dk

    def forward(self, X):
        Q = X @ self.Wq
        K = X @ self.Wk
        V = X @ self.Wv
        output, weights = scaled_dot_product_attention(Q, K, V)
        return output, weights
```

### 步骤 4：在一个句子上运行

为一个句子创建假的 embeddings，并观察 attention weights。

```python
sentence = ["The", "cat", "sat", "on", "the", "mat"]
n_tokens = len(sentence)
d_model = 8
dk = 4
dv = 4

rng = np.random.default_rng(42)
X = rng.normal(0, 1, (n_tokens, d_model))

attn = SelfAttention(d_model, dk, dv, seed=42)
output, weights = attn.forward(X)

print("Attention weights (each row: where that token looks):\n")
print(f"{'':>6}", end="")
for token in sentence:
    print(f"{token:>6}", end="")
print()

for i, token in enumerate(sentence):
    print(f"{token:>6}", end="")
    for j in range(n_tokens):
        w = weights[i][j]
        print(f"{w:6.3f}", end="")
    print()
```

### 步骤 5：使用 ASCII heatmap 可视化 Attention

将 attention weights 映射为字符，快速获得视觉结果。

```python
def ascii_heatmap(weights, tokens, chars=" ░▒▓█"):
    n = len(tokens)
    print(f"\n{'':>6}", end="")
    for t in tokens:
        print(f"{t:>6}", end="")
    print()

    for i in range(n):
        print(f"{tokens[i]:>6}", end="")
        for j in range(n):
            level = int(weights[i][j] * (len(chars) - 1) / weights.max())
            level = min(level, len(chars) - 1)
            print(f"{'  ' + chars[level] + '   '}", end="")
        print()

ascii_heatmap(weights, sentence)
```

## 使用它

PyTorch 的 `nn.MultiheadAttention` 做的正是我们刚刚构建的事情，另外还包括 multi-head splitting 和 output projection：

```python
import torch
import torch.nn as nn

d_model = 8
n_heads = 2
seq_len = 6

mha = nn.MultiheadAttention(embed_dim=d_model, num_heads=n_heads, batch_first=True)

X_torch = torch.randn(1, seq_len, d_model)

output, attn_weights = mha(X_torch, X_torch, X_torch)

print(f"Input shape:            {X_torch.shape}")
print(f"Output shape:           {output.shape}")
print(f"Attention weight shape: {attn_weights.shape}")
print(f"\nAttn weights (averaged over heads):")
print(attn_weights[0].detach().numpy().round(3))
```

关键区别：multi-head attention 会并行运行多个 attention functions，每个都有自己的 Q、K、V projections，大小为 dk = d_model / n_heads，然后拼接结果。这让 model 能够同时 attend 到不同类型的关系。

## 交付它

本课会产出：
- `outputs/prompt-attention-explainer.md` - 一个通过数据库查询类比来解释 Attention 的 prompt

## 练习

1. 修改 `scaled_dot_product_attention`，让它接受一个可选的 mask matrix，在 softmax 之前将某些位置设置为负无穷（这就是 causal/decoder masking 的工作方式）
2. 从零实现 multi-head attention：将 Q、K、V 拆分为 `n_heads` 个块，在每个块上运行 attention，拼接，并通过最终 weight matrix Wo 投影
3. 取两个长度相同的不同句子，将它们输入同一个 SelfAttention instance，并比较它们的 attention patterns。什么变了？什么保持不变？

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------------|----------------------|
| Query (Q) | “问题 Vector” | 输入的一个学习投影，表示这个 Token 正在寻找什么信息 |
| Key (K) | “标签 Vector” | 一个学习投影，表示这个 Token 包含什么信息，并会与 queries 进行匹配 |
| Value (V) | “内容 Vector” | 一个学习投影，携带会基于 attention scores 被聚合的实际信息 |
| Scaled dot-product attention | “Attention 公式” | softmax(QK^T / sqrt(dk)) @ V - 缩放可以防止高维中的 softmax 饱和 |
| Self-attention | “Token 看自己和其他 Token” | Q、K、V 都来自同一序列的 Attention，让每个位置都能 attend 到其他每个位置 |
| Attention weights | “关注程度” | 位置上的概率分布，由 scaled dot products 上的 softmax 产生 |
| Multi-head attention | “并行 Attention” | 使用不同 projections 运行多个 attention functions，然后拼接结果，以获得更丰富的 representations |

## 延伸阅读

- [Attention Is All You Need (Vaswani et al., 2017)](https://arxiv.org/abs/1706.03762) - 原始 transformer 论文
- [The Illustrated Transformer (Jay Alammar)](https://jalammar.github.io/illustrated-transformer/) - 对完整架构最好的可视化讲解
- [The Annotated Transformer (Harvard NLP)](https://nlp.seas.harvard.edu/annotated-transformer/) - 带解释的逐行 PyTorch 实现
