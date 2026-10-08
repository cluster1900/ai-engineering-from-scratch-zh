# 从零实现自我注意力

> 注意是一个查询表,其中每个词都会问:谁对我重要?并学习答案.

**类型：**构建
**语言：**字符串
**先修要求：**阶段3 (深度学习核心),阶段5课程10 (序列到序列)
**时间：**时间90分钟

## 学习目标

- 仅使用NumPy 从零实现规模点产品自注意,包括查询/关键/价值 投影和软max 加权求和
- 构建多头注意力层,用于拆分头,计算并行注意力,并拼接结果
- 追踪注意力矩阵 如何捕捉代币 关系,并解释为什么除以平方
- 应用因果化掩饰,将双向注意力 转换为自动降低式码器式注意力

## 问题

随着你到达第50个代币时,来自第1个代币的信息已经被压缩50次.长距离依赖将被挤压到一个固定的大小的隐藏状态中.

2014年巴哈达努关注论文展示了解如何:让解码器回看每个编码器位置,并判断哪些位置对当前步骤很重要――但它仍然附加在RNN上. 2017年的"注意力是你需要的"论文提出了一个更尖的问题:如果注意力是唯一的机制呢?没有重复――没有卷曲――只有注意力――

让序列中的每个位置都能在单个并行步骤中参加到其他每个位置.

## 概念

### 数据库查询类比

想象一下一个软数据库查询:

```
Traditional database:
  Query: "capital of France"  -->  exact match  -->  "Paris"

Attention:
  Query: "capital of France"  -->  similarity to ALL keys  -->  weighted blend of ALL values
```

每个代币会产生三个向量:
- **Query (Q)**我在寻找什么?
- **Key (K)**我包含什么?
- **Value (V)**如果被选中,我会提供什么信息?

一个查询与所有关键的点产品会产生关注分数──高分表示这个关键匹配我的查询──这些分数会对值加权──输出是值加权和──

### 计算

每个插入的代币都通过三个学习的权重矩阵进行投影:

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

从视觉上看,对于一个标志:

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

### 关注矩阵

一旦你得到了所有代币的Q,K,V,注意力分数,就会形成一个矩阵:

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

一次看一个查询 如何扫描所有键:每一行都给每个代币 打分,软最大 把分数 变成重量,而文本向量就是值的加权混合──

```figure
attention-matrix
```

### 为什么要缩小?

如果dk=64,dot产品可能达到几十的范围,把软max推进渐变消失的区域.

```
Scaled scores = (Q @ K^T) / sqrt(dk)
```

这将使数值保持在软max 能产生有用的梯度范围内.

### 软max 将分数转换为重量

软max 会将原始分数转换为每行概率分布:

```
Raw scores for q1:   [2.1, 0.3, 0.1, 0.8, 0.2]
                            |
                         softmax
                            |
Attention weights:   [0.52, 0.09, 0.07, 0.14, 0.08]   (sums to ~1.0)
```

现在,每个代币都有一组重量,表示它应该在多大程度上参加其他每个代币.

### 价值的增权和

每个代币的最终输出是所有值向量的加权和:

```
output_i = sum( attention_weight[i][j] * v_j  for all j )

For token 1:
  output_1 = 0.52 * v1 + 0.09 * v2 + 0.07 * v3 + 0.14 * v4 + 0.08 * v5
```

### 完整流程

```mermaid
flowchart LR
  X["X (input)"] --> Q["Q = X · Wq"]
  X --> K["K = X · Wk"]
  X --> V["V = X · Wv"]
  Q --> S["Q · Kᵀ / √dk"]
  K --> S
  S --> SM["softmax"]
  SM --> WS["weighted sum"]
  V --> WS
  WS --> O["output"]
```

一行公式:

```
Attention(Q, K, V) = softmax( Q @ K^T / sqrt(dk) ) @ V
```

```figure
softmax-attention-scaling
```

## 构建它

### 步骤1:从零实现软max

软max 会将原始的记录转换为概率.

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

### 步骤2: 标级点产品关注

核心函数──接收Q、K、V矩阵,并返回注意力输出和重量矩阵──

```python
def scaled_dot_product_attention(Q, K, V):
    dk = Q.shape[-1]
    scores = Q @ K.T / np.sqrt(dk)
    weights = softmax(scores)
    output = weights @ V
    return output, weights
```

### 步骤3:带学习投影的自我注意力课程

一个完整的自我注意模块,包含使用Xavier像规模初始化的Wq、Wk、Wv重量矩阵──

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

### 步骤4:在一个句子上运行

为一个句子创建假嵌入,并观察注意力重量.

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

### 步骤5:使用ASCII热图可视化注意力

将注意力重量映射为字符,快速获得视觉结果.

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

皮托尔奇的`nn.MultiheadAttention`做的正是我们刚刚构建的事情,还包括多头分断和输出投影:

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

关键区别:多头注意 会并行运行多个注意力功能,每个都有自己的Q、K、V投影,大小为dk = d_model / n_heads,然后拼接结果──这使得模型能够同时参加不同类型的关系──

## 交付它

本课会产出:
- `outputs/prompt-attention-explainer.md`- 通过数据库查询类比来解释注意的提示

## 练习

1. 修改`scaled_dot_product_attention`让它接受可选的面具矩阵,在软max之前将设置某些位置为负无穷 (这是因果/解码器掩盖的工作方式)
2. 从零实现多头关注:将Q、K、V 拆分为`n_heads`个块,在每个块上运行注意,拼接,并通过最终重量矩阵 Wo 投影
3. 取两个相同长度的句子,将它们输入到同一 SelfAttention 实例中,并比较它们的注意力模式.

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

- [Attention Is All You Need (Vaswani et al., 2017)](https://arxiv.org/abs/1706.03762)- 原始变压器论文
- [The Illustrated Transformer (Jay Alammar)](https://jalammar.github.io/illustrated-transformer/)- 完整的结构最好的可视化解说
- [The Annotated Transformer (Harvard NLP)](https://nlp.seas.harvard.edu/annotated-transformer/)- 带解释的逐行 PyTorch 实现
