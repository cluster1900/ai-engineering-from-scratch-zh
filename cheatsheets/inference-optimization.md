---
id: inference-optimization
title: Inference Optimization: KV Cache, Quantization, Batching
code: IO
subtitle: KV cache、量化、批处理与投机解码。公式、调度器数字，以及拖慢延迟的常见错误。
hue: 200
sources: phases/07-transformers-deep-dive/12-kv-cache-flash-attention, phases/10-llms-from-scratch/11-quantization, phases/10-llms-from-scratch/12-inference-optimization, phases/17-infrastructure-and-production/04-vllm-serving-internals, phases/17-infrastructure-and-production/05-eagle3-speculative-decoding, phases/17-infrastructure-and-production/08-inference-metrics-goodput, phases/17-infrastructure-and-production/09-production-quantization
source_hash: 24eabbf93445b948
---

## 推理流水线
type: architecture
from: phases/10-llms-from-scratch/12-inference-optimization/code/main.py, phases/17-infrastructure-and-production/04-vllm-serving-internals/code/main.py

```arch
node | req | 1,1 | Request | queue and arrival | client
node | pc | 1,2 | PrefixCache | shared prompt trie | store
node | admit | 2,1 | Admit | free KV blocks | process
node | kv | 2,2 | KVCache | K and V per token | store
node | pre | 3,1 | Prefill | chunked prompt | gpu
node | dec | 3,2 | Decode | one token per step | gpu
edge | req | admit | arrive
edge | pc | pre | reuse prefix
edge | admit | pre | blocks free
edge | pre | dec | prompt done
edge | dec | kv | append
edge | kv | dec | read
```

## 一次 decode 步
type: flow
from: phases/10-llms-from-scratch/12-inference-optimization/code/main.py

1. **写入**：`kv_cache.update` 为每层存入新的 K 和 V。
2. **读取**：缓存返回截至当前长度的切片。
3. **注意力**：`scaled_dot_product_attention` 在已缓存的前缀上运行。
4. **前进**：在单 token decode 时，`kv_cache.advance(1)` 推进长度。

## 核心 softmax 更新
type: annotated-code
lang: python
from: phases/07-transformers-deep-dive/12-kv-cache-flash-attention/code/main.py

```python
new_m = max(m, *scores)                      # running max
if m == float("-inf"):
    exp_old = 0.0
else:
    exp_old = math.exp(m - new_m)            # rescale old sums
exp_new = [math.exp(sc - new_m) for sc in scores]
s = s * exp_old + sum(exp_new)               # running sum
```

## 任务参考
type: task-table
from: phases/07-transformers-deep-dive/12-kv-cache-flash-attention/code/main.py, phases/10-llms-from-scratch/12-inference-optimization/code/main.py

| 任务 | 代码 |
|---|---|
| 计算 KV cache 字节数 | `kv_cache_bytes(N, n_layers, n_heads_kv, d_head, dtype=2)` |
| 分块注意力输出 | `tiled_softmax_dot(q, Ks, Vs, tile=4)` |
| 模拟批处理 | `simulate_continuous_batching(requests, batch_size)` |
| 缓存共享前缀 | `PrefixCache(max_entries=1000)` |
| 投机生成 token | `speculative_decode(draft_model, target_model, context, num_speculative=5)` |
| 检查显存是否放得下 | `memory_budget(config, gpu_memory_gb)` |

## 默认值
type: defaults
from: phases/07-transformers-deep-dive/12-kv-cache-flash-attention/code/main.py, phases/10-llms-from-scratch/12-inference-optimization/code/main.py, phases/17-infrastructure-and-production/04-vllm-serving-internals/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `kv_cache_bytes` 中的 `dtype` | 2 | 每个值的字节数。fp16 或 bf16 |
| `tiled_softmax_dot` 中的 `tile` | 4 | 每个分块的 key 数 |
| `PrefixCache` 中的 `max_entries` | 1000 | Trie 节点上限 |
| `num_speculative` | 5 | 每轮草稿 token 数 |
| `DraftModel` 中的 `acceptance_rate` | 0.8 | 模拟接受率 |
| `CHUNK_SIZE` | 512 | 每个切片的 prefill token 数 |
| `KV_BLOCK_SIZE` | 16 | 每个 KV 块的 token 数 |
| `KV_BLOCKS_AVAILABLE` | 1800 | 玩具块预算 |

## 公式
type: concepts
from: phases/07-transformers-deep-dive/12-kv-cache-flash-attention/code/main.py, phases/10-llms-from-scratch/12-inference-optimization/code/main.py, phases/10-llms-from-scratch/11-quantization/code/main.py, phases/17-infrastructure-and-production/04-vllm-serving-internals/code/main.py

- **KV cache 字节数**：`2 * N * n_layers * n_heads_kv * d_head * dtype`。
- **每 token 的 KV**：两个张量乘以层数、KV 头数、头维度和元素大小。
- **运行最大值 softmax**：输出与完整 softmax 一致，只需保留一个分块。
- **块数**：总 token 数除以块大小后向上取整。
- **量化 scale**：绝对值最大值除以整数范围最大值。

## 故障排查
type: troubleshooting
from: phases/10-llms-from-scratch/12-inference-optimization/code/main.py, phases/17-infrastructure-and-production/04-vllm-serving-internals/code/main.py

| 症状 | 原因 | 修复 |
|---|---|---|
| 前缀查找返回 0 | 开头的 token 不同，trie 遍历停止 | 让共享 prompt 从第一个 token 起完全一致 |
| Trie 不再插入 | 达到 `max_entries` | 调高 `max_entries` |
| 批处理槽位空闲 | 静态批处理要等最长的输出 | 使用连续批处理 |
| 长 prompt 时 decode 停顿 | prefill 没有分块 | 设置 `chunked`，使 prefill 使用 `CHUNK_SIZE` |
| 投机解码反而更慢 | 接受率低 | 启用前先测量接受率 |
| 模型放不下 | 权重超过 GPU 显存 | 量化或增加 GPU |

## 术语表
type: glossary
from: phases/10-llms-from-scratch/12-inference-optimization/code/main.py, phases/17-infrastructure-and-production/04-vllm-serving-internals/code/main.py

- **KV cache**：为过去的 token 存储的 key 和 value，避免重新计算。
- **Prefill**：在第一个输出 token 之前处理整个 prompt。
- **Decode**：每步生成一个输出 token。
- **TTFT**：首 token 时间。在 prefill 结束时确定。
- **ITL**：token 间延迟。相邻输出 token 之间的时间。

## 问答
type: qa
from: phases/10-llms-from-scratch/12-inference-optimization/code/main.py, phases/17-infrastructure-and-production/04-vllm-serving-internals/code/main.py, phases/17-infrastructure-and-production/08-inference-metrics-goodput/code/main.py

- **为什么要存 K 和 V？** 每个 decode 步直接读取它们，而不是重新计算前缀。
- **为什么静态批处理浪费？** 每一行都要等最长的输出长度。
- **为什么要分块 prefill？** 长 prompt 会阻塞其他请求的 decode token。
- **为什么各基准工具的 TPOT 不一致？** 一个把 TTFT 时间计入速率，另一个不计入。

## 提示
type: tips
from: phases/17-infrastructure-and-production/08-inference-metrics-goodput/code/main.py, phases/17-infrastructure-and-production/04-vllm-serving-internals/code/main.py, phases/10-llms-from-scratch/12-inference-optimization/code/main.py

- 报告 P99 延迟，而不是平均值。逐个请求检查三项上限。
- 由调度器常量推出分块大小和块数。
- 让各请求的共享 prompt 前缀保持一致。
- 调大 batch size 前，先对照预算检查 KV 显存。
