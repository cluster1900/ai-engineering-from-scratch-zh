# 多头注意力

> 一个注意力头 一次学习一种关系 八个头 学习八种头 很便宜 多用几个

**类型：**构建
**语言：**字符串
**前置知识：**阶段7 · 02(自从零开始自觉注意)
**时间：**七十五分钟

## 问题

单个自我注意力头 会计算一个注意力矩阵. 这个矩阵 捕捉一种关系,通常是能够在当前训练信号上最小化损失的那种. 如果你的数据里主题verb协议,co-reference,长距离的演讲和语法分断,全部纠在一起,单个头会把它们抹在单个软最大分布,丢掉一半信号.

2017年瓦斯瓦尼论文 给出的修复方式是:并行运行多个注意力功能,每个都有自己的Q、K、V投影,然后把输出拼接起来──每个头都在维度为`d_model / n_heads`总参数保持不变.表达能力上升.

单一的争论是需要使用多少头,以及关键和值是否共享预测.

## 概念

![Multi-head attention splits, attends, concatenates](../assets/multi-head-attention.svg)

**Split。**取形状为`(N, d_model)`的`X`△分别投影到形状为`(N, d_model)`,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,`(N, n_heads, d_head)`在其中`d_head = d_model / n_heads`‧ 转移为`(n_heads, N, d_head)`,我知道.

**并行 Attend。**在每个头内运行量化点产品关注.`(N, d_head)`,这些头在嵌入的不同子空间上运行,并且在注意力计算中,不会在本身期间相互通信.

**Concatenate 并 project。**将头部堆回`(N, d_model)`然后乘以形状为`(d_model, d_model)`学习输出矩阵`W_o`,我知道.`W_o`是头部进行混合位置.

**为什么有效。**每个头都可以专业化,而不必其他头 争抢表征预算――20192024年探测研究显示了不同的头角色:位置头 关注前代币头 副本头 命名实体头 诱导头 它们构成了在环境中学习的底层机制)

**2026 年的变体谱系：**

| Variant | Q heads | K/V heads | Used by |
|---------|---------|-----------|---------|
| Multi-head (MHA) | N | N | GPT-2, BERT, T5 |
| Multi-query (MQA) | N | 1 | PaLM, Falcon |
| Grouped-query (GQA) | N | G (e.g. N/8) | Llama 2 70B, Llama 3+, Qwen 2+, Mistral |
| Multi-head latent (MLA) | N | compressed to low-rank | DeepSeek-V2, V3 |

由于它能按`N/G`倍数减轻KV缓存内存,同时几乎保持完整质量――MLA 更进一步,把K/V 压缩到隐藏空间,然后在计算时项目回来它会消耗FLOPs,但节省更多的内存――


```figure
multihead-split
```

## 构建它

### 步骤1:从我们已经有的单头注意力中分开头

取02课 里的`SelfAttention`起一个对分/起一个对`code/main.py`中有numpy 实现;逻辑如下:

```python
def split_heads(X, n_heads):
    n, d = X.shape
    d_head = d // n_heads
    return X.reshape(n, n_heads, d_head).transpose(1, 0, 2)  # (heads, n, d_head)

def combine_heads(H):
    h, n, d_head = H.shape
    return H.transpose(1, 0, 2).reshape(n, h * d_head)
```

一次重塑和一次转换.没有环.`nn.MultiheadAttention`下做的事.

### 步骤2:按头 运行 标点产品关注

每个头都得到了Q、K、V的自己的片子.

```python
def mha_forward(X, W_q, W_k, W_v, W_o, n_heads):
    Q = X @ W_q
    K = X @ W_k
    V = X @ W_v
    Qh = split_heads(Q, n_heads)         # (heads, n, d_head)
    Kh = split_heads(K, n_heads)
    Vh = split_heads(V, n_heads)
    scores = Qh @ Kh.transpose(0, 2, 1) / np.sqrt(Qh.shape[-1])
    weights = softmax(scores, axis=-1)
    out = weights @ Vh                    # (heads, n, d_head)
    concat = combine_heads(out)
    return concat @ W_o, weights
```

在真实硬件上,`Qh @ Kh.transpose(...)`是一个`bmm`△GPU 看到的是形状为`(heads, N, d_head) × (heads, d_head, N) -> (heads, N, N)`单个批量子. 增加头子.

### 步骤3: 组列-查询注意力 变体

只有关键和值预测 会改变──Q 获得 `n_heads`个群体;K 和 V 获得`n_kv_heads < n_heads`个组,并被重复以匹配:

```python
def gqa_project(X, W, n_kv_heads, n_heads):
    kv = split_heads(X @ W, n_kv_heads)       # (kv_heads, n, d_head)
    repeat = n_heads // n_kv_heads
    return np.repeat(kv, repeat, axis=0)      # (n_heads, n, d_head)
```

在推断时,这会节省记忆,因为KV缓存中只保存`n_kv_heads`份副本,而不是`n_heads`份量: 拉马370B 使用64个查询头和8个KV头,也就是8×的缓存缩减.

### 步骤4:试试每一个头学到了什么

在一个短句上使用4个头运行MHA――对每一个头,打印`(N, N)`关注矩阵――你会看到不同的头部 即使在随机初始化下也会选择不同的结构

## 使用它

在 PyTorch 中,一行版本:

```python
import torch.nn as nn

mha = nn.MultiheadAttention(embed_dim=512, num_heads=8, batch_first=True)
```

皮托尔奇 2.5+ 中的GQA:

```python
from torch.nn.functional import scaled_dot_product_attention

# scaled_dot_product_attention auto-dispatches Flash Attention on CUDA.
# For GQA, pass Q of shape (B, n_heads, N, d_head) and K,V of shape
# (B, n_kv_heads, N, d_head). PyTorch handles the repeat.
out = scaled_dot_product_attention(q, k, v, is_causal=True, enable_gqa=True)
```

**多少个 heads？**从2026年生产模式的经验规则:

| Model size | d_model | n_heads | d_head |
|------------|---------|---------|--------|
| Small (~125M) | 768 | 12 | 64 |
| Base (~350M) | 1024 | 16 | 64 |
| Large (~1B) | 2048 | 16 | 128 |
| Frontier (~70B) | 8192 | 64 | 128 |

`d_head`几乎总是落在64或128个. 它是一个头可以看到多少内容单位.`sqrt(d_head)`较高于256,你会失去许多小专家的收益.

## 交付它

见`outputs/skill-mha-configurator.md`△这个技能将根据参数预算,序列长度和部署目标,为新的变压器推头计,kv头计和投影策略.

## 练习

1. **简单。**取 `code/main.py`中的MHA,固定在`d_model=64`情况`n_heads`在合成复制任务上绘制一个小的单层模型的损失.
2. **中等。**实现MQA(所有查询头 共享一个KV头) ――衡量参数数数 相比全MHA下降了多少――计算推断时 N=2048 下KV缓存大小缩小了多少――
3. **困难。**实现一个小的 版本的多头潜伏注意:把K,V 压缩到级别`r`隐藏在KV缓存中,在注意力时间中解压.`r`取到多少时间,缓存会降到全MHA的1/8以下,同时质量仍然保持在验证的 1比特内?

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Head | “一个单独的 attention circuit” | 一个维度为 `d_head = d_model / n_heads` 的 Q/K/V projection，拥有自己的 attention matrix。 |
| d_head | “Head dimension” | Per-head hidden width；在 production 中几乎总是 64 或 128。 |
| Split / combine | “Reshape tricks” | Attention 前后的 `(N, d_model) ↔ (n_heads, N, d_head)` reshape+transpose。 |
| W_o | “Output projection” | Concatenating heads 之后应用的 `(d_model, d_model)` matrix；heads 在这里混合。 |
| MQA | “One KV head” | Multi-Query Attention：单个共享 K/V projection。KV cache 最小，但有一些质量损失。 |
| GQA | “The default since Llama 2” | `n_kv_heads < n_heads` 的 Grouped-Query Attention；通过重复来匹配 Q。 |
| MLA | “DeepSeek 的技巧” | Multi-head Latent Attention：K,V 被压缩到 low-rank latent，并在 attend time 解压。 |
| Induction head | “in-context learning 背后的 circuit” | 一对 heads，检测之前的出现位置，并复制其后跟随的内容。 |

## 延伸阅读

- [Vaswani et al. (2017). Attention Is All You Need §3.2.2](https://arxiv.org/abs/1706.03762) 原始的多头规范
- [Shazeer (2019). Fast Transformer Decoding: One Write-Head is All You Need](https://arxiv.org/abs/1911.02150) MQA 论文──
- [Ainslie et al. (2023). GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints](https://arxiv.org/abs/2305.13245)如何在训练后把MHA转换为GQA──
- [DeepSeek-AI (2024). DeepSeek-V2 Technical Report](https://arxiv.org/abs/2405.04434) MLA,以及为什么它在缓存内存上优于MHA/GQA.
- [Olsson et al. (2022). In-context Learning and Induction Heads](https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html)从机械角度观察头脑实际做了什么.
