---
id: transformers-attention
title: Transformers and Attention
code: TA
subtitle: 计算注意力、加掩码、拆分多头、加入位置信息并堆叠成块。PyTorch 和 NumPy 代码均来自课程。
hue: 12
sources: phases/07-transformers-deep-dive/02-self-attention-from-scratch, phases/07-transformers-deep-dive/03-multi-head-attention, phases/07-transformers-deep-dive/04-positional-encoding, phases/07-transformers-deep-dive/05-full-transformer, phases/07-transformers-deep-dive/07-gpt-causal-language-modeling, phases/07-transformers-deep-dive/12-kv-cache-flash-attention, phases/07-transformers-deep-dive/13-scaling-laws, phases/07-transformers-deep-dive/14-build-a-transformer-capstone, phases/05-nlp-foundations-to-advanced/10-attention-mechanism, phases/19-capstone-projects/32-token-positional-embeddings, phases/19-capstone-projects/33-multihead-self-attention, phases/19-capstone-projects/34-transformer-block, phases/19-capstone-projects/35-gpt-model-assembly, phases/10-llms-from-scratch/04-pre-training-mini-gpt
source_hash: 06904d9e0a23754d
---

## 一个 pre-LN 解码器块
type: architecture
from: phases/19-capstone-projects/34-transformer-block/docs/en.md, phases/19-capstone-projects/34-transformer-block/code/main.py, phases/19-capstone-projects/35-gpt-model-assembly/docs/en.md

```arch
node | in | 1,1 | Input embedding | token + position, B, T, D
node | ln1 | 2,1 | LayerNorm 1 |
node | mha | 2,2 | Multi head causal attention | Q, K, V and mask
node | r1 | 1,2 | Add residual | x + attn(ln1(x))
node | ln2 | 1,3 | LayerNorm 2 |
node | mlp | 2,3 | Position wise MLP | D to 4D to D
node | r2 | 2,4 | Add residual | x + mlp(ln2(x))
node | out | 1,4 | Final LayerNorm, LM head | logits B, T, 50257
edge | in | ln1 |
edge | ln1 | mha |
edge | mha | r1 |
edge | r1 | ln2 |
edge | ln2 | mlp |
edge | mlp | r2 |
edge | r2 | out | x 12
```

## 注意力前向传播
type: flow
from: phases/19-capstone-projects/33-multihead-self-attention/docs/en.md, phases/19-capstone-projects/33-multihead-self-attention/code/main.py

1. **qkv_proj**：一个线性层把 `(B, T, D)` 映射到 `(B, T, 3 * D)`。
2. **拆分**：切成 Q、K、V，再 reshape 为 `(B, H, T, d_head)`。
3. **分数**：`q @ k.transpose(-2, -1)` 得到 `(B, H, T, T)`。
4. **缩放**：把分数除以 `sqrt(d_head)`。
5. **掩码与 softmax**：未来位置填入 `-inf`，再在 key 维度上做 softmax。
6. **加权求和**：`weights @ V`，再把多头合并回 `(B, T, D)`。
7. **out_proj**：一个 `(D, D)` 线性层混合各个头。

## 形状
type: command-table
from: phases/19-capstone-projects/32-token-positional-embeddings/docs/en.md, phases/19-capstone-projects/33-multihead-self-attention/docs/en.md, phases/19-capstone-projects/35-gpt-model-assembly/docs/en.md, phases/05-nlp-foundations-to-advanced/10-attention-mechanism/docs/en.md

| 张量 | 形状 |
|---|---|
| Token id | `(B, T)`，int64 |
| Token 嵌入矩阵 | `(V, D)` |
| 注意力的输入 | `(B, T, D)` |
| QKV 投影输出 | `(B, T, 3 * D)` |
| 每个头的 Q、K、V | `(B, H, T, d_head)`，`d_head = D // H` |
| 分数与权重 | `(B, H, T, T)` |
| Logits | GPT-2 small 为 `(B, T, 50257)` |
| 交叉注意力权重 | `(batch, T_dec, T_enc)` |

## 关键公式
type: concepts
from: phases/07-transformers-deep-dive/02-self-attention-from-scratch/docs/en.md, phases/07-transformers-deep-dive/03-multi-head-attention/docs/en.md, phases/07-transformers-deep-dive/04-positional-encoding/docs/en.md, phases/07-transformers-deep-dive/07-gpt-causal-language-modeling/docs/en.md, phases/10-llms-from-scratch/04-pre-training-mini-gpt/docs/en.md

- **注意力**：$\text{Attention}(Q, K, V) = \mathop{\mathrm{softmax}}\left( \frac{Q K^T}{\sqrt{d_k}} \right) V$
- **头宽度**：$d_{\text{head}} = d_{\text{model}} / n_{\text{heads}}$
- **因果掩码**：$M_{ij} = \begin{cases} 0 & \text{if } j \le i \\ -\infty & \text{if } j > i \end{cases}$
- **正弦编码（偶数维）**：$PE_{(pos, 2i)} = \sin\left(pos / 10000^{2i / d_{\text{model}}}\right)$
- **正弦编码（奇数维）**：$PE_{(pos, 2i+1)} = \cos\left(pos / 10000^{2i / d_{\text{model}}}\right)$
- **RoPE 角度**：$\theta_i = \text{base}^{-2i / d_{\text{head}}}$。分数只依赖 $(m - n)$。
- **ALiBi**：$\text{attn\_score}[i, j] = \frac{q_i \cdot k_j}{\sqrt{d}} - m_h \cdot |i - j|$
- **数值稳定的 softmax**：$\mathop{\mathrm{softmax}}(x - c) = \mathop{\mathrm{softmax}}(x)$

## 代码中的任务
type: task-table
from: phases/19-capstone-projects/33-multihead-self-attention/code/main.py, phases/19-capstone-projects/32-token-positional-embeddings/code/main.py, phases/07-transformers-deep-dive/03-multi-head-attention/docs/en.md, phases/07-transformers-deep-dive/04-positional-encoding/docs/en.md, phases/19-capstone-projects/35-gpt-model-assembly/code/main.py

| 任务 | 代码 |
|---|---|
| 应用因果掩码 | `scores.masked_fill(mask_slice == 0, float("-inf"))` |
| 在 key 上做 softmax | `F.softmax(scores, dim=-1)` |
| 合并多头 | `x.transpose(1, 2).contiguous().view(b, t, h * dh)` |
| 加入位置 | `x = tok + pos.unsqueeze(0)` |
| 填充正弦表 | `pe[:, 0::2] = torch.sin(angle)` |
| 旋转 Q 和 K | `apply_rope(x, pos, base=10000)` |
| 带 GQA 的融合 kernel | `scaled_dot_product_attention(q, k, v, is_causal=True, enable_gqa=True)` |
| 绑定 LM 头 | `self.lm_head.weight = self.tok_embed.weight` |

## MultiHeadSelfAttention 前向传播
type: annotated-code
lang: python
from: phases/19-capstone-projects/33-multihead-self-attention/code/main.py

```python
self.qkv_proj = nn.Linear(d_model, 3 * d_model, bias=True)  # Q, K, V in one matmul
causal_mask = torch.tril(torch.ones(max_context_length, max_context_length))
self.register_buffer("causal_mask", causal_mask, persistent=False)  # no grad
qkv = self.qkv_proj(x)                          # (B, T, 3D)
q, k, v = qkv.chunk(3, dim=-1)                  # three (B, T, D) views
q = self._split_heads(q)                        # (B, H, T, d_head)
k = self._split_heads(k)
v = self._split_heads(v)
scores = torch.matmul(q, k.transpose(-2, -1)) / math.sqrt(self.d_head)
mask_slice = self.causal_mask[:t, :t]           # top left (T, T)
scores = scores.masked_fill(mask_slice == 0, float("-inf"))
weights = F.softmax(scores, dim=-1)             # rows sum to 1
context = self._merge_heads(torch.matmul(weights, v))  # (B, T, D)
out = self.out_proj(context)                    # mixes the heads
```

## 默认值与数字
type: defaults
from: phases/07-transformers-deep-dive/04-positional-encoding/docs/en.md, phases/19-capstone-projects/34-transformer-block/code/main.py, phases/07-transformers-deep-dive/03-multi-head-attention/docs/en.md, phases/19-capstone-projects/35-gpt-model-assembly/code/main.py, phases/19-capstone-projects/35-gpt-model-assembly/docs/en.md, phases/07-transformers-deep-dive/12-kv-cache-flash-attention/docs/en.md, phases/07-transformers-deep-dive/13-scaling-laws/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| 正弦与 RoPE 的 base | 10000 | 上下文更长时调大 RoPE base |
| mlp_expansion | 4 | MLP 为 D 到 4D 再到 D |
| d_head | 64 | 生产中为 64 或 128 |
| 初始化 std | 0.02 | Linear 和 Embedding 的权重 |
| 残差投影缩放 | 1 / sqrt(2 * num_layers) | out_proj 和 fc2 |
| GPT-2 small 的 d_model | 768 | 12 个头，12 层，约 124M |
| 每 token 每层的 KV 字节数 | `2 * n_kv_heads * d_head * dtype_size` | 所有 KV 头，K 和 V |
| 计算最优比例 | 20 | 每个参数对应的 token 数 |

## 故障排查
type: troubleshooting
from: phases/19-capstone-projects/33-multihead-self-attention/code/main.py, phases/19-capstone-projects/33-multihead-self-attention/docs/en.md, phases/19-capstone-projects/34-transformer-block/docs/en.md, phases/19-capstone-projects/35-gpt-model-assembly/docs/en.md, phases/10-llms-from-scratch/04-pre-training-mini-gpt/docs/en.md, phases/05-nlp-foundations-to-advanced/10-attention-mechanism/docs/en.md, phases/07-transformers-deep-dive/04-positional-encoding/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| d_model 与 n_heads 报 `ValueError` | D 不能被 H 整除 | 选一个能整除 D 的 H |
| `seq_len` exceeds max_context_length | T 比掩码大 | 截取最后 context_length 个 token |
| 模型偷看下一个 token | 没有因果掩码 | 用 `-inf` 遮住上三角 |
| Softmax 得到 `inf` | 对大数取了 `exp` | 先减去行最大值 |
| 学习停滞 | 分数没有缩放 | 除以 `sqrt(d_head)` |
| 深层堆叠发散 | 残差路径上用了 post-LN | 改用 pre-LN |
| 权重绑定没省下参数 | 权重是复制的，不是共享的 | 赋值为同一个参数 |
| 超出训练长度后输出变差 | 位置编码不能外推 | 使用带 base 缩放的 RoPE |

## 缩写
type: glossary
from: phases/07-transformers-deep-dive/03-multi-head-attention/docs/en.md, phases/07-transformers-deep-dive/04-positional-encoding/docs/en.md, phases/07-transformers-deep-dive/05-full-transformer/docs/en.md, phases/07-transformers-deep-dive/12-kv-cache-flash-attention/docs/en.md

- **MHA**：多头注意力。N 个 query 头，N 个 K/V 头。
- **MQA**：多查询注意力。共享一个 K/V 投影。
- **GQA**：分组查询注意力。K/V 头更少，重复后与 Q 对齐。
- **MLA**：多头潜在注意力。K 和 V 存放在低秩潜空间中。
- **RoPE**：旋转位置编码。按位置旋转 Q 和 K。
- **ALiBi**：带线性偏置的注意力。对分数施加距离惩罚。
- **RMSNorm**：不减均值的 LayerNorm。
- **KV cache**：每个前缀 token 存下来的 K 和 V。

## 问答
type: qa
from: phases/07-transformers-deep-dive/02-self-attention-from-scratch/docs/en.md, phases/07-transformers-deep-dive/07-gpt-causal-language-modeling/docs/en.md, phases/07-transformers-deep-dive/04-positional-encoding/docs/en.md, phases/07-transformers-deep-dive/03-multi-head-attention/docs/en.md, phases/07-transformers-deep-dive/12-kv-cache-flash-attention/docs/en.md

- **为什么除以 sqrt(d_k)？** 点积太大会让 softmax 饱和，梯度消失。
- **掩码里为什么用 -inf？** exp(-inf) = 0，所以未来位置的权重为零。
- **为什么要加位置信息？** 仅靠注意力具有置换不变性。
- **为什么用 GQA？** 它把 KV cache 内存降为 1/(N/G)，质量几乎不变。
- **Flash Attention 是近似计算吗？** 不是。维护一个运行中的 (max, sum) 让结果保持精确。

## 提示
type: tips
from: phases/19-capstone-projects/33-multihead-self-attention/docs/en.md, phases/19-capstone-projects/33-multihead-self-attention/code/tests/test_attention.py, phases/19-capstone-projects/34-transformer-block/docs/en.md, phases/19-capstone-projects/35-gpt-model-assembly/docs/en.md, phases/05-nlp-foundations-to-advanced/10-attention-mechanism/docs/en.md

- 测试每行权重之和为 1。
- 测试未来 token 不会改变过去的输出。
- 随机初始化时，loss 应接近 log(V)。
- 对照参考模型核对参数量。
- 在 softmax 之后和第二个 MLP 线性层之后加 dropout。
- 不要把注意力权重当作推理的证据。
