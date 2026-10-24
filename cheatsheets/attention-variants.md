---
id: attention-variants
title: Attention Variants Compared
code: AV
subtitle: 全注意力、滑动窗口、跨步、BigBird、差分注意力与原生稀疏注意力。成本、KV cache、代码与修复。
hue: 265
sources: phases/07-transformers-deep-dive/12-kv-cache-flash-attention, phases/07-transformers-deep-dive/15-attention-variants, phases/10-llms-from-scratch/16-differential-attention-v2, phases/10-llms-from-scratch/17-native-sparse-attention
source_hash: 2d7b00775e872f21
---

## 各变体并排对比
type: comparison
from: phases/07-transformers-deep-dive/15-attention-variants/docs/en.md

| 变体 | 计算量 | KV cache | 相对全注意力的质量 |
|---|---|---|---|
| 全注意力 | `O(N^2)` | 每层 `O(N)` | 基线 |
| SWA，窗口 1024 | N 乘 W | 每层 `O(W)` | -0.1 ppl，配合全局层效果好 |
| 局部 + 跨步稀疏 | N 乘 sqrt N | 混合 | 与 SWA 相近 |
| BigBird，局部 + 全局 + 随机 | 约 `O(N)` | 混合 | 在 2× 上下文下与全注意力持平 |
| 原生稀疏（DeepSeek-V3.2） | N 乘激活比例 | `O(N)` | 差距在 0.05 ppl 以内 |
| 差分 | 2 乘 N 的平方 | `O(2N)` | ppl -5 到 -10% |

## 何时选用
type: tips
from: phases/07-transformers-deep-dive/15-attention-variants/docs/en.md, phases/10-llms-from-scratch/16-differential-attention-v2/docs/en.md, phases/10-llms-from-scratch/17-native-sparse-attention/docs/en.md

- **全注意力**：上下文不超过 ~16K 时每层都用，或检索质量至关重要时。
- **SWA + 全局混合**：32K 以上的长上下文。2026 年 32K 以上的默认做法。
- **稀疏块注意力**：自定义 kernel、自定义模式。用于检索和音频。
- **差分注意力**：attention sink 造成损害时，例如长上下文 RAG 和大海捞针。
- **从头使用 DIFF**：目标有效上下文在 64k 以上的新模型。
- **NSA**：目标上下文在 64k 以上的预训练或继续训练。
- **不用 DIFF 或 NSA**：已预训练好的稠密模型，或上下文低于 16k。

## 掩码构造
type: annotated-code
lang: python
from: phases/07-transformers-deep-dive/15-attention-variants/code/main.py, phases/07-transformers-deep-dive/15-attention-variants/docs/en.md

```python
def swa_mask(n, window):
    M = [[NEG_INF] * n for _ in range(n)]
    for i in range(n):
        lo = max(0, i - window + 1)  # window >= n gives full causal
        for j in range(lo, i + 1):
            M[i][j] = 0.0  # 0.0 attends, NEG_INF masks
    return M

def strided_mask(n, window, stride):  # local window, then:
        for j in range(0, i + 1, stride):
            M[i][j] = 0.0  # every stride-th token back to 0

render(swa_mask(8, window=4), "sliding window (W=4)")
render(strided_mask(8, window=2, stride=3), "local (W=2) + strided (stride=3)")
```

## 用 FlexAttention 实现 SWA
type: annotated-code
lang: python
from: phases/07-transformers-deep-dive/15-attention-variants/docs/en.md

```python
from torch.nn.attention.flex_attention import flex_attention, create_block_mask

def swa_pattern(b, h, q_idx, kv_idx):
    return (q_idx - kv_idx < 1024) & (q_idx >= kv_idx)  # window 1024, causal

mask = create_block_mask(swa_pattern, B=batch, H=heads, Q_LEN=n, KV_LEN=n)
out = flex_attention(q, k, v, block_mask=mask)  # compiles to a Triton kernel
```

## NSA：三个分支
type: architecture
from: phases/10-llms-from-scratch/17-native-sparse-attention/docs/en.md, phases/10-llms-from-scratch/17-native-sparse-attention/code/main.py

```arch
node | q | 1,2 | Query | one per position | client
node | cmp | 2,1 | Compressed branch | block means, N/l keys | process
node | sel | 2,2 | Selected branch | top-k blocks, k*l keys | process
node | win | 2,3 | Sliding window | last W tokens | process
node | kv | 3,2 | KV cache | fine-grained tokens | store
node | gate | 4,2 | Gate | sigmoid, 3 weights | model
edge | q | cmp | attend
edge | cmp | sel | top_k_blocks
edge | q | win | attend
edge | kv | sel | load blocks
edge | sel | gate | out_sel
edge | cmp | gate | out_cmp
edge | win | gate | out_win
```

## Flash Attention 分块循环
type: flow
from: phases/07-transformers-deep-dive/12-kv-cache-flash-attention/docs/en.md, phases/07-transformers-deep-dive/12-kv-cache-flash-attention/code/main.py

1. **外层循环**：把一个 Q 块（约 128 × 128）加载到 SRAM。
2. **内层循环**：把每个 K 块和 V 块加载到 SRAM。
3. **SRAM**：计算 `S_tile = Q_tile @ K_tile^T`。
4. **SRAM**：跨块维护一个累计的 `(max, sum)`。
5. **SRAM**：用 `exp_old` 重新缩放旧输出，再加上新块。
6. **HBM**：把 `O_tile` 写回 HBM。每个块只往返 HBM 一次。
7. **结果**：与标准注意力逐位相同，内存为 O(N) 而非 O(N^2)。

## 代码中的任务
type: task-table
from: phases/07-transformers-deep-dive/15-attention-variants/code/main.py, phases/07-transformers-deep-dive/12-kv-cache-flash-attention/code/main.py, phases/10-llms-from-scratch/16-differential-attention-v2/code/main.py, phases/10-llms-from-scratch/17-native-sparse-attention/code/main.py

| 任务 | 代码 |
|---|---|
| SWA 因果掩码 | `swa_mask(n, window)` |
| 局部加跨步掩码 | `strided_mask(n, window, stride)` |
| 统计被关注的单元格数 | `count_nonmasked(M)` |
| KV cache 字节数 | `kv_cache_bytes(N, n_layers, n_heads_kv, d_head, dtype=2)` |
| Flash 风格 softmax | `tiled_softmax_dot(q, Ks, Vs, tile=4)` |
| 一行的信噪比 | `snr(weights_row, signal_pos)` |
| DIFF V1 与 V2 参数 | `compute_param_diff(hidden=4096, n_heads=32, kv_heads=8)` |
| NSA 每个查询的 key 数 | `count_nsa(N, l, k, W)` |

## 需要知道的数字
type: defaults
from: phases/07-transformers-deep-dive/12-kv-cache-flash-attention/docs/en.md, phases/07-transformers-deep-dive/15-attention-variants/docs/en.md, phases/07-transformers-deep-dive/15-attention-variants/code/main.py, phases/10-llms-from-scratch/16-differential-attention-v2/docs/en.md, phases/10-llms-from-scratch/17-native-sparse-attention/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| Llama 3 70B 每 token 每层 KV | 4096 bytes | 80 层，8 个 KV 头，fp16 |
| Llama 3 70B KV，32K 上下文 | 10 GiB | GQA，8 个 KV 头 |
| Gemma 3 层配比 | 5:1 SWA:global | window=1024 |
| 128K 上下文下的 SWA KV | 128× | 窗口 1024，只保留最近 W 个 token |
| Gemma-3 混合 KV | ~6x | 相对纯全注意力 |
| DIFF `lambda_init` | 0.8 | 每个头学习得到 |
| NSA 窗口 `W` | 512 | 64k 时 `l = 64, k = 16`，25x |
| 128k 时的 NSA | 3536 keys | 减少 36x |

## 故障排查
type: troubleshooting
from: phases/07-transformers-deep-dive/15-attention-variants/docs/en.md, phases/10-llms-from-scratch/16-differential-attention-v2/docs/en.md, phases/10-llms-from-scratch/17-native-sparse-attention/docs/en.md, phases/07-transformers-deep-dive/12-kv-cache-flash-attention/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| SWA 模型长程检索失败 | 没有全局层 | 按 5:1 穿插全注意力层 |
| 权重流向 token 0 | softmax 造成的 attention sink | 差分注意力 |
| 超过 32k 后出现 lost in the middle | softmax 噪声底随 N 增长 | 从头使用 DIFF，或在 Q 上做 LoRA |
| DIFF V1 解码比基线慢 | value cache 被加载两次 | DIFF V2 |
| 70B 以上训练后期不稳定 | V1 的逐头 RMSNorm | V2 去掉了它 |
| 在已预训练的稠密模型上用 NSA | 无法直接改造 | 继续训练 |
| 16k 以下 NSA 无收益 | 三分支的开销 | 全注意力 |
| 推理时稀疏化提速很小 | 模型从未经过这种路由 | 原生训练的稀疏性 |

## 问答
type: qa
from: phases/07-transformers-deep-dive/15-attention-variants/docs/en.md, phases/10-llms-from-scratch/16-differential-attention-v2/docs/en.md, phases/10-llms-from-scratch/17-native-sparse-attention/docs/en.md, phases/07-transformers-deep-dive/12-kv-cache-flash-attention/docs/en.md

- **Flash Attention 会减少计算量吗？** 不会。它省去的是激活内存。每个 token 仍然关注所有 token。
- **为什么 NSA 可训练？** 梯度会流经压缩分支的分数。`top_k` 只负责挑选要加载的块。
- **为什么 DIFF 在 128k 时帮助更大？** 噪声底随上下文增长。在 4k 时它很小。
- **DIFF V2 兼容 GQA 吗？** 兼容。V2 增加的是 Q 头，不是 KV 头。
- **1024 个 token、l 32、k 4、w 128 时 NSA 的 key 数？** 32 + 128 + 128 = 288 个 key，少 3.5x。

## 术语表
type: glossary
span: 2
from: phases/07-transformers-deep-dive/15-attention-variants/docs/en.md, phases/07-transformers-deep-dive/12-kv-cache-flash-attention/docs/en.md, phases/10-llms-from-scratch/17-native-sparse-attention/docs/en.md

- **SWA**：滑动窗口注意力。每个查询关注其最近的 W 个 token。
- **感受野**：窗口为 W 的 L 层 SWA 堆叠最多能看到 L × W 个 token。
- **Attention sink**：每行之和为 1，因此没有信息量的查询会把权重放到位置 0。
- **NSA**：Native Sparse Attention（原生稀疏注意力）。学习得到的块稀疏，kernel 中跳过全零块。
- **DSA**：Deepseek Sparse Attention，NSA 的后继者。
- **HBM**：High Bandwidth Memory（高带宽内存）。H100 上约 3 TB/s。
- **SRAM**：每个 SM 的片上内存。约 30 TB/s。
