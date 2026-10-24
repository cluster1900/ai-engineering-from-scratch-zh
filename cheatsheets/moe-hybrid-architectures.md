---
id: moe-hybrid-architectures
title: Mixture of Experts and Hybrid Architectures
code: MH
subtitle: 路由器、专家、无辅助损失均衡、MLA、DeepSeek-V3 参数量与 Jamba SSM 混合架构。公式与标准库计算器。
hue: 168
sources: phases/07-transformers-deep-dive/11-mixture-of-experts, phases/10-llms-from-scratch/14-open-models-architecture-walkthroughs, phases/10-llms-from-scratch/20-deepseek-v3-walkthrough, phases/10-llms-from-scratch/21-jamba-hybrid-ssm-transformer
source_hash: 47145a3c1db1c893
---

## 一个 MoE 层
type: architecture
from: phases/07-transformers-deep-dive/11-mixture-of-experts/docs/en.md, phases/10-llms-from-scratch/14-open-models-architecture-walkthroughs/docs/en.md

```arch
node | tok | 1,1 | Token hidden state | after attention + norm | client
node | router | 2,1 | Router | one linear layer, scores (N_tokens, E) | process
node | bias | 3,1 | scores + bias | selection only | store
node | topk | 4,1 | Top-k selection | k of E per token | process
node | shared | 1,2 | Shared expert | every token | model
node | e1 | 2,2 | Routed expert | SwiGLU FFN | model
node | e2 | 3,2 | Routed expert | SwiGLU FFN | model
node | sum | 4,2 | Weighted sum | gates from raw scores | process
edge | tok | router |
edge | router | bias |
edge | bias | topk |
edge | topk | e1 |
edge | topk | e2 |
edge | e1 | sum |
edge | e2 | sum |
edge | shared | sum |
```

## 无辅助损失均衡循环
type: flow
from: phases/07-transformers-deep-dive/11-mixture-of-experts/code/main.py, phases/07-transformers-deep-dive/11-mixture-of-experts/docs/en.md

1. **初始化**：`bias = [0.0] * n_experts`。目标使用率为 `n_tokens * top_k / n_experts`。
2. **路由**：按 `scores + bias` 选出 top k。
3. **门控**：对选中专家的原始分数做 softmax。
4. **计数**：`run_epoch` 统计每个专家被激活的次数。
5. **更新**：高于目标时 `bias[e] -= gamma`，低于目标时 `bias[e] += gamma`。
6. **重复**：演示用 `gamma=0.15` 迭代 10 次。
7. **检查**：熵上升，趋近均匀分布的最大值 `ln(n_experts)`。

## 代码中的路由器
type: annotated-code
lang: python
from: phases/07-transformers-deep-dive/11-mixture-of-experts/code/main.py

```python
def route(hidden, W_router, top_k, bias):
    E = len(W_router)
    scores = [sum(h * w for h, w in zip(hidden, W_router[e])) for e in range(E)]
    biased = [s + b for s, b in zip(scores, bias)]   # bias moves selection
    top_idx = sorted(range(E), key=lambda i: -biased[i])[:top_k]
    chosen = [scores[i] for i in top_idx]   # original scores, not biased
    m = max(chosen)
    exps = [math.exp(c - m) for c in chosen]
    s = sum(exps)
    gates = [e / s for e in exps]   # softmax gates sum to 1
    return top_idx, gates
```

## 课程中的计算器
type: task-table
from: phases/07-transformers-deep-dive/11-mixture-of-experts/code/main.py, phases/10-llms-from-scratch/14-open-models-architecture-walkthroughs/code/main.py, phases/10-llms-from-scratch/20-deepseek-v3-walkthrough/code/main.py, phases/10-llms-from-scratch/21-jamba-hybrid-ssm-transformer/code/main.py

| 任务 | 代码 |
|---|---|
| DeepSeek-V3 报告 | `print_report(name, cfg, ctx=131_072)` |
| 均衡专家 | `update_bias(bias, usage, target, gamma=0.15)` |
| 给路由均衡度打分 | `entropy(counts)` |
| 统计任意 config.json 的参数 | `analyze(name, config)` |
| 识别注意力类型 | `attention_scheme(config)` |
| DeepSeek-V3 总量 | `compute_totals(cfg, ctx=None)` |
| 混合架构 SSM 状态 | `ssm_state_bytes(cfg, bytes_per_elem)` |
| 混合架构 KV cache | `kv_cache_bytes(cfg, ctx, bytes_per_elem)` |

## 公式
type: concepts
from: phases/07-transformers-deep-dive/11-mixture-of-experts/docs/en.md, phases/10-llms-from-scratch/14-open-models-architecture-walkthroughs/docs/en.md, phases/10-llms-from-scratch/20-deepseek-v3-walkthrough/docs/en.md, phases/10-llms-from-scratch/21-jamba-hybrid-ssm-transformer/docs/en.md

- **MoE 参数**：总量为 $E \times$ FFN 大小。每个 token 的激活量为 $k \times$ FFN 大小。
- **稀疏度**：激活量除以总量。DeepSeek-V3 为 37/671 ≈ 5.5%。
- **细粒度**：每个 token 有 $\binom{256}{8} \approx 400$ 万亿种专家组合。
- **KV cache**：`2 * num_layers * num_kv_heads * head_dim * max_seq_len * bytes_per_element`
- **MLA cache**：`num_layers * kv_lora_rank * max_seq_len * bytes_per_element`
- **SSM**：$h_t = A h_{t-1} + B x_t$，$y_t = C h_t$。每个 token 的内存恒定。
- **SwiGLU 宽度**：`ff_dim = (2/3) * 4 * hidden = 8/3 * hidden`
- **Jamba 配比**：`l = 8` 即每 7 层 Mamba 配 1 层注意力。`e = 2` 即每隔一层用 MoE。

## DeepSeek-V3 配置
type: annotated-code
lang: text
from: phases/10-llms-from-scratch/20-deepseek-v3-walkthrough/docs/en.md

```text
hidden_size: 7168              # embedding dimension
intermediate_size: 18432       # dense MLP, first 3 layers
moe_intermediate_size: 2048    # each expert MLP
num_hidden_layers: 61          # 3 dense + 58 MoE
first_k_dense_layers: 3        # dense MLP for stability
num_attention_heads: 128       # query heads
kv_lora_rank: 512              # MLA latent per token per layer
num_experts: 256               # routed experts per block
num_experts_per_tok: 8         # top-8 routing
shared_experts: 1              # always-on dense floor
mtp_module: 1                  # predicts t+2, 14B params
```

## 模型并排对比
type: comparison
from: phases/07-transformers-deep-dive/11-mixture-of-experts/docs/en.md, phases/10-llms-from-scratch/14-open-models-architecture-walkthroughs/docs/en.md, phases/10-llms-from-scratch/20-deepseek-v3-walkthrough/docs/en.md, phases/10-llms-from-scratch/21-jamba-hybrid-ssm-transformer/docs/en.md

| 因素 | Llama 3 70B | Mixtral 8x7B | DeepSeek V3 | Jamba |
|---|---|---|---|---|
| 类别 | 稠密 Transformer | MoE Transformer | MoE Transformer | Mamba + 注意力 + MoE |
| 总量 / 激活 | 70B / 70B | 47B / 13B | 671B / 37B | 52B / 12B |
| 专家 | 无 | 8 个专家，top-2 | 256 + 1 个共享，top-8 | 每隔一层用 MoE |
| 注意力 | GQA (64/8) | GQA | MLA | 每 7 层 Mamba 配 1 层 |
| 上下文 | 128k | 32k | 128k | 单张 80GB GPU 上 256k |

## 内存数字
type: concepts
from: phases/07-transformers-deep-dive/11-mixture-of-experts/docs/en.md, phases/10-llms-from-scratch/14-open-models-architecture-walkthroughs/docs/en.md, phases/10-llms-from-scratch/20-deepseek-v3-walkthrough/docs/en.md, phases/10-llms-from-scratch/21-jamba-hybrid-ssm-transformer/docs/en.md

- **Llama 3 8B，128k 上下文**：KV cache 17.2 GB。BF16 权重为 16 GB。
- **DeepSeek-V3，128k 上下文**：MLA cache 7.6 GB。GQA 基线需要 30.5 GB。
- **32 层，256k 上下文**：完整 MHA 需 128 GB。Jamba 1:7 只缓存 4 个注意力层，16 GB。
- **Jamba SSM 状态**：总计 3.7 MB。不随序列长度增长。
- **fp16 下的 671B**：约 1.3 TB 显存。所有专家都留在 GPU 上。
- **MTP 模块**：在 671B 之上再加 14B。开销 2.1%。

## 计算器默认值
type: defaults
from: phases/10-llms-from-scratch/14-open-models-architecture-walkthroughs/code/main.py, phases/10-llms-from-scratch/14-open-models-architecture-walkthroughs/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `kv_lora_rank` | 512 | config 未给出时使用的 MLA 潜变量维度 |
| `activation` | gelu | `swiglu` 和 `geglu` 会多一个门控矩阵 |
| `norms_per_layer` | 2 | RMSNorm 每个 `h`，LayerNorm `2 * h` |
| `head_dim` | hidden_size / num_attention_heads | Gemma 2 9B 设为 256 |
| `layer_types` | full_attention | 每一层都缓存完整上下文 |
| `rope_theta` | 10k | Llama 3 将其放大到 500k |

## 故障排查
type: troubleshooting
from: phases/07-transformers-deep-dive/11-mixture-of-experts/docs/en.md, phases/10-llms-from-scratch/14-open-models-architecture-walkthroughs/docs/en.md, phases/10-llms-from-scratch/21-jamba-hybrid-ssm-transformer/docs/en.md, phases/10-llms-from-scratch/20-deepseek-v3-walkthrough/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 90% 的 token 流向同一个专家 | 路由器失衡 | 每个专家一个偏置，在损失之外更新 |
| 负载高时质量下降 | 容量溢出导致丢弃 token | 用偏置均衡，不要丢 token |
| 主任务损失变差 | 辅助负载均衡损失 | 采用无辅助损失方案 |
| 偏置影响了预测 | 门控用了加偏置的分数 | 用原始 `scores` 做门控 |
| 多 GPU 下延迟高 | 专家间的 all-to-all 通信 | 延迟敏感的服务避免用 MoE |
| KV cache 比权重还大 | 长上下文下用完整 MHA | 改用 GQA 或 MLA |
| 混合架构上下文内检索失败 | 注意力太少，1:15 | 用 1:7 或 1:8 |
| 参数量少了 525M | 未计入不共享的 LM head | 读取 `tie_word_embeddings` |

## 各设计的适用场景
type: tips
from: phases/07-transformers-deep-dive/11-mixture-of-experts/docs/en.md, phases/10-llms-from-scratch/21-jamba-hybrid-ssm-transformer/docs/en.md, phases/10-llms-from-scratch/14-open-models-architecture-walkthroughs/docs/en.md

- 想以更低的每 token 推理成本获得前沿质量时，用 MoE。
- 有足够显存和专家并行基础设施时，用 MoE。
- 边缘设备、延迟敏感的单用户服务或 7B 以下，不要用 MoE。
- 64k+ 上下文或单 GPU 显存预算下，用混合架构。
- 16k 以下上下文或需要任意位置互相注意时，不要用混合架构。
- 参数量约 13B 以上时，用 GQA 或 MLA。
- 对滑动窗口配置，先看完整层与滑动层的比例。

## 缩写
type: glossary
from: phases/07-transformers-deep-dive/11-mixture-of-experts/docs/en.md, phases/10-llms-from-scratch/14-open-models-architecture-walkthroughs/docs/en.md, phases/10-llms-from-scratch/20-deepseek-v3-walkthrough/docs/en.md, phases/10-llms-from-scratch/21-jamba-hybrid-ssm-transformer/docs/en.md

- **MoE**：混合专家（Mixture of Experts）。每个块 N 个 MLP，路由器为每个 token 选 top-k。
- **GQA**：分组查询注意力（Grouped-Query Attention）。G 组 Q 头共享一个 K 和一个 V。
- **MQA**：多查询注意力（Multi-Query Attention）。所有头共用一个 K 和一个 V。
- **MLA**：多头潜在注意力（Multi-Head Latent Attention）。K 和 V 放在共享的低秩潜空间中。
- **MTP**：多 token 预测（Multi-Token Prediction）。预测 $t+2$，相当于免费的推测草稿。
- **SSM**：状态空间模型（State space model）。状态大小固定的递推。
- **MIMO**：多输入多输出（Multi-input multi-output）。Mamba-3 的矩阵值投影。

## 问答
type: qa
from: phases/07-transformers-deep-dive/11-mixture-of-experts/docs/en.md, phases/10-llms-from-scratch/20-deepseek-v3-walkthrough/docs/en.md, phases/10-llms-from-scratch/21-jamba-hybrid-ssm-transformer/docs/en.md

- **为什么偏置只影响选择？** 它校正负载，但不左右预测。
- **共享专家做什么？** 它们捕获通用知识。路由专家负责专精。
- **为什么 V3 前 3 层是稠密的？** 前几层不经路由器，以求稳定。
- **Jamba 为什么用 1:7？** 注意力负责精确回忆，Mamba 承担廉价的大头。
- **万亿规模下谁胜出？** 纯 Transformer + MLA + MoE，即 DeepSeek-V3 路线。
