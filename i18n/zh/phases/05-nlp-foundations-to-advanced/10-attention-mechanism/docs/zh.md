# 注意力机制 突破

> 解码器不再用一个压缩摘要费力识别,而是开始查看整个来源.

**Type:** Build
**Languages:** Python
**先修要求：**阶段5 · 09(序列到序列模型)
**Time:** ~45 分钟

## 问题

课时09 以一次可测量的失败结尾. 一个在玩具复制任务上训练的GRU编码器-解码器,长度为5小时的准确度为89%,长度到80小时接近随机.原因是结构性,不是训练 bug:编码器提取到的每一点信息都必须塞进一个固定的大小的隐藏状态,而解码器又看不到别的东西.

巴哈达努、乔 和 孟基奥在2014年发表了一篇三行修复──不要只把最终编码状态给编码器,而是保留每个编码器状态──在每个编码器步骤中,计算编码器状态的加权平均,其中权重表示编码器现在需要看编码器位置.`i`多少?这个加权平均是文本,并且它在每个解码器步骤都会变化.

这就是完整的想法.转变器 扩展了它.自我注意力 将它应用到单个序列.多头注意力并运行它.

## 概念

![Bahdanau attention: decoder queries all encoder states](../assets/attention.svg)

在每个解码器步骤中`t`其他:

1. 使用前一个解码器隐藏状态`s_{t-1}`作为一个**query**,我知道.
2. 将它与每个编码器隐藏状态`h_1, ..., h_T`打分――每个编码器都在一个尺度位置.
3. 为了得分做软最大,得到注意力重量`α_{t,1}, ..., α_{t,T}`它们总共为1个.
4. 文本向量`c_t = Σ α_{t,i} * h_i`△加权平均的编码状态
5. 解码器接收`c_t`增加前一个输出代币,生成下一个代币.

加权平均才是重点. 当解码器需要把"Je" 翻译为"I"时,它会让"Je"上方的编码器状态 权重大,其他位置权重小. 当它需要"不"时,它会让"通过"权重大.

## 形状最容易咬人的地方)

这是每一个注意力实施的第一个地方都会出错.

| Thing | Shape | Notes |
|-------|-------|-------|
| Encoder hidden states `H` | `(T_enc, d_h)` | 如果是 BiLSTM，`d_h = 2 * d_hidden` |
| Decoder hidden state `s_{t-1}` | `(d_s,)` | 一个 vector |
| Attention score `e_{t,i}` | scalar | 每个 encoder 位置一个 |
| Attention weight `α_{t,i}` | scalar | 对所有 `i` 做 softmax 之后 |
| Context vector `c_t` | `(d_h,)` | 与一个 encoder state 的 shape 相同 |

**Bahdanau（additive）score。** `e_{t,i} = v_α^T * tanh(W_a * s_{t-1} + U_a * h_i)`,我知道.

- `s_{t-1}`的形状是`(d_s,)`没有任何`h_i`的形状是`(d_h,)`,我知道.
- `W_a`的形状是`(d_attn, d_s)`,我知道.`U_a`的形状是`(d_attn, d_h)`,我知道.
- 它们在内部相加后的形状是`(d_attn,)`,我知道.
- `v_α`的形状是`(d_attn,)`△与`v_α`制造内部产品会缩成一个尺度.**这就是 `v_α` 的作用。**它不是魔法. 它是把注意力向量转化为尺度分数的投影.

**Luong（multiplicative）score。**三个变体:

- `dot`其他`e_{t,i} = s_t^T * h_i`△要求`d_s == d_h`如果你的编码器是双向,就跳过.
- `general`其他`e_{t,i} = s_t^T * W * h_i`在其中`W`的形状是`(d_s, d_h)`△移除维度相等的束.
- `concat`基本上是Bahdanau 形式──很少使用,因为前两个更便宜──

**一个值得点名的 Bahdanau / Luong gotcha。**百达纳乌 使用`s_{t-1}`(生成当前词 *之前* 的解码状态) ―― 长 使用 `s_t`它们的混合会产生非常难的微妙错误梯度.


```figure
attention-heatmap
```

## 构建它

### 步骤1:添加剂

```python
import numpy as np


def additive_attention(decoder_state, encoder_states, W_a, U_a, v_a):
    projected_dec = W_a @ decoder_state
    projected_enc = encoder_states @ U_a.T
    combined = np.tanh(projected_enc + projected_dec)
    scores = combined @ v_a
    weights = softmax(scores)
    context = weights @ encoder_states
    return context, weights


def softmax(x):
    x = x - np.max(x)
    e = np.exp(x)
    return e / e.sum()
```

根据表格检查你的形状.`encoder_states`的形状是`(T_enc, d_h)`,我知道.`projected_enc`的形状是`(T_enc, d_attn)`,我知道.`projected_dec`的形状是`(d_attn,)`没有播出.`combined`的形状是`(T_enc, d_attn)`,我知道.`scores`的形状是`(T_enc,)`,我知道.`weights`的形状是`(T_enc,)`,我知道.`context`的形状是`(d_h,)`,可以发行.

### 步骤2: 卢昂点 和一般

```python
def dot_attention(decoder_state, encoder_states):
    scores = encoder_states @ decoder_state
    weights = softmax(scores)
    return weights @ encoder_states, weights


def general_attention(decoder_state, encoder_states, W):
    projected = W.T @ decoder_state
    scores = encoder_states @ projected
    weights = softmax(scores)
    return weights @ encoder_states, weights
```

每个都是三行. 这就是卢昂的论文成立的原因. 在大多数任务上,准确度同样,代码更少.

### 步骤3:一个完整的数值示例

给定三个编码状态 ((大致对应"猫""",sat"、"mat") 以及最接近第一个状态的编码状态,注意力分布会集中在位置0――如果编码状态 移动到更接近最后一个编码状态,注意力就会移动到位置2――文本向量会随之跟踪――

```python
H = np.array([
    [1.0, 0.0, 0.2],
    [0.5, 0.5, 0.1],
    [0.1, 0.9, 0.3],
])

s_close_to_cat = np.array([0.9, 0.1, 0.2])
ctx, w = dot_attention(s_close_to_cat, H)
print("weights:", w.round(3))
```

```
weights: [0.464 0.305 0.231]
```

首先,获胜.然后把解码状态移到更接近第三个编码状态,观察重量如何移动.

### 步骤4:为什么这是通往变压器的桥梁

把上面的语言翻译成 Q/K/V:

- **Query**= 解码器状态`s_{t-1}`
- **Key**它们是个"编码状态"
- **Value**它们是"加权求和的对象"

在经典的注意力中,key 和 values 是同一个东西.自我注意力将分开它们:你可以让一个序列查询 自身,并为 K 和 V 使用不同的学习投影.

数学是相同的. 从巴哈达努注意力到规模点产品注意力的教学跃迁,主要只是符号.

## 使用它

火和光流直接提供注意力.

```python
import torch
import torch.nn as nn

mha = nn.MultiheadAttention(embed_dim=128, num_heads=8, batch_first=True)
query = torch.randn(2, 5, 128)
key = torch.randn(2, 10, 128)
value = torch.randn(2, 10, 128)

output, weights = mha(query, key, value)
print(output.shape, weights.shape)
```

```
torch.Size([2, 5, 128]) torch.Size([2, 5, 10])
```

这就是一个变压器注意力层. 查询批量有5个位置,关键/值批量有10个位置,每个位置都是128维,8个头.`output`是新的背景增强的查询.`weights`是可视化的5×10对齐矩阵.

### 经典的注意力 什么时候仍然重要

- 教学――单头――单层――基于RNN的版本让每个概念都可见――
- 变压器 放不下设备上的序列任务.
- 任何2014-2017年报纸都不知道巴哈达努的约定,你会读错它.
- 分析细粒度的配列分析. 即使在变压器模型中,重量重量也是可解释的工具,但读懂它们需要知道它们是什么.

### 关注重量作为解释陷

注意重量看起来可以解释──它们是跨位置求和为一的重量;你可以画出来;高值表示看了这里──评论者很喜欢它们──

它们看起来不那么可解释. 简和华莱斯 (Jain 和 Wallace) 指出,在一些任务中,注意力分布可以被取代,并被任意替代方案取代,而不改变模型预测.

## 发布它

保存为`outputs/prompt-attention-shapes.md`其他:

```markdown
---
name: attention-shapes
description: Debug shape bugs in attention implementations.
phase: 5
lesson: 10
---

给定一个损坏的 attention implementation，你需要识别 shape mismatch。输出：

1. 哪个 matrix 的 shape 错了。命名这个 tensor。
2. 它的 shape 应该是什么，从 (d_s, d_h, d_attn, T_enc, T_dec, batch_size) 推导。
3. 一行修复。Transpose、reshape 或 project。
4. 一个捕获 regressions 的测试。通常是：assert `output.shape == (batch, T_dec, d_h)` and `weights.shape == (batch, T_dec, T_enc)` and `weights.sum(dim=-1) close to 1`。

拒绝建议会静默 broadcast 的修复。被 broadcast 隐藏的 bugs 之后会表现为静默 accuracy degradation，这是最糟糕的一类 attention bug。

对于 Bahdanau 混淆，坚持 decoder input 是 `s_{t-1}`（pre-step state）。对于 Luong，是 `s_t`（post-step state）。对于 dot-product，把 query 和 key 之间的 dimension mismatch 标记为新手最常见错误。
```

## 练习

1. **Easy.**实现`softmax`获得零注意力重量──在包含可变长度序列的批量上测试──
2. **Medium.**给卢昂`general`形式添加多头关注――把`d_h`拆成`n_heads`组,每个头 运行注意,然后连接――验证单头 情况与你之前的实现一致――
3. **Hard.**在第09课中,玩具复制 任务上训练一个带巴哈达努注意力的GRU编码器-解码器――绘制准确性与序列长度――与没有注意的基线比较――你应该看到长度增加时差距扩大,这确认了注意力 抬起瓶──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Attention | 看东西 | 对 value sequence 做加权平均，weights 由 query-key similarity 计算。 |
| Query, Key, Value | QKV | 三个 projections：Q 发问，K 是要匹配的内容，V 是要返回的内容。 |
| Additive attention | Bahdanau | Feed-forward score: `v^T tanh(W q + U k)`。 |
| Multiplicative attention | Luong dot / general | Score 是 `q^T k` 或 `q^T W k`。更便宜，在大多数任务上 accuracy 相同。 |
| Alignment matrix | 好看的图 | Attention weights 作为 `(T_dec, T_enc)` 网格。读取它可以看到 model attend 到了什么。 |

## 延伸阅读
- [Bahdanau, Cho, Bengio (2014). Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473)这篇报纸.
- [Luong, Pham, Manning (2015). Effective Approaches to Attention-based Neural Machine Translation](https://arxiv.org/abs/1508.04025) 三种分数变体及其比较.
- [Jain and Wallace (2019). Attention is not Explanation](https://arxiv.org/abs/1902.10186) 可解释性注意事项
- [Dive into Deep Learning — Bahdanau Attention](https://d2l.ai/chapter_attention-mechanisms-and-transformers/bahdanau-attention.html) 使用PyTorch的可运行行程────────────────────────
