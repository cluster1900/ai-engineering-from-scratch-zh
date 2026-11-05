---
id: speculative-decoding
title: Speculative Decoding: Draft, EAGLE, MTP
code: SD
subtitle: 草稿加验证，质量无损。Vanilla、Medusa、EAGLE-3 与 MTP 草稿、加速比公式、vLLM 配置与门控。
hue: 252
sources: phases/07-transformers-deep-dive/16-speculative-decoding, phases/10-llms-from-scratch/15-speculative-decoding-eagle3, phases/10-llms-from-scratch/18-multi-token-prediction, phases/10-llms-from-scratch/25-speculative-decoding, phases/17-infrastructure-and-production/05-eagle3-speculative-decoding, phases/19-capstone-projects/14-speculative-decoding-server
source_hash: defbe2502f92af6a
---

## 草稿类型并列对比
type: comparison
from: phases/10-llms-from-scratch/15-speculative-decoding-eagle3/docs/en.md, phases/10-llms-from-scratch/18-multi-token-prediction/docs/en.md, phases/07-transformers-deep-dive/16-speculative-decoding/docs/en.md

| 因素 | Vanilla 草稿 | Medusa | EAGLE-3 | MTP (DeepSeek-V3) |
|---|---|---|---|---|
| 草稿 | 单独的小 LLM | 验证器上的额外 LM heads | 多层特征融合 + TTT | 1 个 transformer block + 投影 |
| 何时训练 | 复用已有模型 | 在验证器上的 SFT 阶段 | 预训练之后 | 预训练期间 |
| 训练成本 | 无 | ~1B SFT tokens | ~60-200B tokens | 预训练大约慢 10% |
| `α` | 0.55-0.70 | 0.65-0.75 | 0.88-0.92 | 深度 1 时 0.80+ |
| 加速比 | 1.8-2.3× | 2-3× | 3.5-6.5× | 1.8× |
| 第二个模型 | 是 | 否 | 很小的草稿头 | 否，是模型的一部分 |
| 已有权重 | 是 | 需要微调 | 是 | 否，要重新训练 |

## 一次投机步骤
type: flow
from: phases/07-transformers-deep-dive/16-speculative-decoding/docs/en.md, phases/10-llms-from-scratch/15-speculative-decoding-eagle3/docs/en.md

1. **Draft**：便宜模型 $M_p$ 提出 $N$ 个 token，概率为 $p_1 \ldots p_N$。
2. **Verify**：验证器 $M_q$ 在前缀加草稿上跑一次。它返回 $q_1 \ldots q_{N+1}$。
3. **Accept**：从左到右走。以概率 $\min(1, q_i(d_i) / p_i(d_i))$ 接受。
4. **Reject**：在第一次拒绝处，从归一化的 $(q_j - p_j)_+$ 采样。丢掉后面的草稿。
5. **Bonus**：当全部 $N$ 个都接受时，从 $q_{N+1}$ 再采样一个 token。
6. **Roll back**：把 KV cache 设到已接受前缀的长度。
7. **Result**：输出与单独用验证器同分布。

## 代码中的循环
type: annotated-code
lang: python
from: phases/10-llms-from-scratch/15-speculative-decoding-eagle3/code/main.py

```python
for i, d in enumerate(drafts):
    u = rng.random()
    ratio = q_prob / p_prob if p_prob > 0 else float("inf")   # q verifier, p draft
    if u < min(1.0, ratio):
        emitted.append(d)
        kv.extend(1)   # accepted: cache grows by one
    else:
        correction = sample(residual(q, p), rng)   # (q - p)+ renormalized
        emitted.append(correction)
        kv.truncate_to(prefix_len + len(emitted))   # KV rollback
        return emitted, 1   # one verifier forward
bonus = sample(q, rng)   # all N accepted: free token
emitted.append(bonus)
```

## 服务技术栈
type: architecture
from: phases/19-capstone-projects/14-speculative-decoding-server/docs/en.md

```arch
node | client | 1,1 | Request ingress | chat completions | client
node | server | 2,1 | vLLM or SGLang | one replica per GPU | process
node | draft | 3,1 | Draft | EAGLE-3 heads or ngram | model
node | target | 4,1 | Target | FP8 or INT4 quantized | gpu
node | verify | 4,2 | Verify pass | k draft tokens in one pass | process
node | stream | 3,2 | Token stream | accepted prefix to client | client
node | metrics | 2,2 | Prometheus metrics | acceptance, queue wait, p99 | store
node | hpa | 1,2 | HPA | scales on queue wait | queue
edge | client | server |
edge | server | draft |
edge | draft | target | k tokens
edge | target | verify |
edge | verify | stream | accept, resample
edge | stream | metrics |
edge | metrics | hpa |
```

## 命令
type: command-table
span: 2
from: phases/07-transformers-deep-dive/16-speculative-decoding/docs/en.md, phases/10-llms-from-scratch/15-speculative-decoding-eagle3/docs/en.md, phases/10-llms-from-scratch/25-speculative-decoding/code/main.py

| 命令 | 作用 |
|---|---|
| `vllm serve <model> --speculative-config '{"method": "eagle", "model": "<draft>", "num_speculative_tokens": 5}'` | EAGLE 草稿头 |
| `--speculative-config '{"method": "draft_model", "model": "meta-llama/Llama-3.2-1B-Instruct", "num_speculative_tokens": 5}'` | Vanilla 草稿模型 |
| `--speculative-config '{"model": "<draft>", "num_speculative_tokens": 5, "method": "eagle3"}'` | EAGLE-3 草稿 |
| `python main.py --vocab 64 --alpha 0.75 --k 4 --samples 50000` | 拒绝规则、alpha 扫描、树掩码演示 |

## 课程中的函数
type: task-table
from: phases/07-transformers-deep-dive/16-speculative-decoding/code/main.py, phases/10-llms-from-scratch/15-speculative-decoding-eagle3/code/main.py, phases/10-llms-from-scratch/18-multi-token-prediction/code/main.py, phases/10-llms-from-scratch/25-speculative-decoding/code/main.py, phases/17-infrastructure-and-production/05-eagle3-speculative-decoding/code/main.py, phases/19-capstone-projects/14-speculative-decoding-server/code/main.py

| 任务 | 代码 |
|---|---|
| 拒绝时的残差 | `residual(q, p)` |
| 带 KV 回滚的一步 | `spec_step(q, p, N, kv, rng)` |
| 每次验证的 token 数 | `expected_tokens_per_verify(alpha, N)` |
| 每个 token 的墙钟时间 | `wall_time_per_token(alpha, N, c)` |
| 某配置的加速比 | `expected_speedup(p)` |
| 树验证掩码 | `tree_attention_mask(tree)` |
| 分布检查 | `chi_square(observed, expected)` |
| 测得的接受率 | `m.acceptance_rate(k)` |

## 加速比公式
type: concepts
from: phases/10-llms-from-scratch/15-speculative-decoding-eagle3/docs/en.md, phases/10-llms-from-scratch/25-speculative-decoding/docs/en.md, phases/17-infrastructure-and-production/05-eagle3-speculative-decoding/docs/en.md, phases/10-llms-from-scratch/18-multi-token-prediction/docs/en.md

- **每次验证的 token 数**：$\mathbb{E}[\text{accepted}] = \frac{1 - \alpha^{N+1}}{1 - \alpha}$
- **例子**：`α = 0.8, K = 4` 给出每次前向 3.36 个 token。
- **每个 token 的墙钟时间**：`(N * c + 1) / E[accepted]`，其中 `c = cost(draft) / cost(verifier)`。
- **最大杠杆**：接受率 `α` 对加速比的影响大于草稿长度 `N`。
- **生产形式**：`S(alpha, K) = (1 + K*alpha) / (1 + verify_overhead)`
- **盈亏平衡**：`alpha_breakeven = verify_overhead / K`。它随并发上升。
- **MTP 损失**：$L_{\text{MTP}} = \frac{\lambda}{D} \sum_{k=1}^{D} L_k$，`lambda` 先 0.3 再 0.1。

## 脚本默认值
type: defaults
from: phases/10-llms-from-scratch/25-speculative-decoding/code/main.py, phases/17-infrastructure-and-production/05-eagle3-speculative-decoding/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `--vocab` | 32 | 词表大小，至少 2 |
| `--alpha` | 0.75 | 目标接受率，在 (0, 1] |
| `--k` | 4 | 草稿长度，至少 1 |
| `--samples` | 20000 | 样本数 |
| `--seed` | 0 | 随机种子 |
| `n_tokens` | 1000 | 每次运行的 `simulate_tail` token 数 |

## 排障
type: troubleshooting
from: phases/17-infrastructure-and-production/05-eagle3-speculative-decoding/docs/en.md, phases/07-transformers-deep-dive/16-speculative-decoding/docs/en.md, phases/10-llms-from-scratch/15-speculative-decoding-eagle3/docs/en.md, phases/10-llms-from-scratch/25-speculative-decoding/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 部署后没有加速 | 投机解码是 opt-in | 显式设置 `speculative_config` |
| 平均 ITL 下降，P99 ITL 上升 | 被拒绝的草稿要走两遍 | 盯住 P99 ITL，上线前再调 |
| 流量上 `α` 低于 0.55 | 草稿在通用数据上训练 | 训练领域草稿或关掉 |
| `α` 崩塌 | 高温度的创造性采样 | 退回普通 decode |
| 高并发没有收益 | 批处理已经填满 FLOPs | 在该并发下测盈亏平衡 |
| 拒绝后 cache 错了 | `j-1` 之后的条目仍写着 | 截断到已接受前缀 |
| 小模型上收益很小 | 草稿并没有便宜多少 | 3B 以下跳过投机解码 |

## 何时用各草稿
type: tips
from: phases/07-transformers-deep-dive/16-speculative-decoding/docs/en.md, phases/10-llms-from-scratch/18-multi-token-prediction/docs/en.md, phases/17-infrastructure-and-production/05-eagle3-speculative-decoding/docs/en.md, phases/10-llms-from-scratch/15-speculative-decoding-eagle3/docs/en.md

- 用 Vanilla 草稿做无需训练的快速原型。
- 能微调验证器时用 Medusa heads。
- 生产里要最大速度时用 EAGLE-2 或 EAGLE-3。
- 想要无草稿、无训练、无额外参数时用 lookahead。预期 1.3 到 1.6×。
- 你控制预训练且 hidden size 至少 4096 时用 MTP。
- 聊天延迟、代码和 JSON 输出、以及长生成用投机解码。
- 输出不到 50 tokens 和 batch-1 离线作业时跳过它。

## 缩写
type: glossary
from: phases/10-llms-from-scratch/15-speculative-decoding-eagle3/docs/en.md, phases/17-infrastructure-and-production/05-eagle3-speculative-decoding/docs/en.md, phases/10-llms-from-scratch/18-multi-token-prediction/docs/en.md, phases/19-capstone-projects/14-speculative-decoding-server/docs/en.md

- **α**：接受率。验证器接受一个草稿 token 的逐 token 概率。
- **K 或 N**：草稿长度。每次目标前向典型 4-8 个 token。
- **EAGLE**：以验证器隐状态为条件的很小草稿。
- **TTT**：training-time test。训练时草稿看见自己的输出。
- **MTP**：multi-token prediction。一个模块预测前方 `k` 个位置的 token。
- **P99 ITL**：启用投机解码后要盯的尾部指标。不是 P50。
- **HPA**：按排队等待给服务器自动扩缩，不是按 CPU。

## 问题
type: qa
from: phases/07-transformers-deep-dive/16-speculative-decoding/docs/en.md, phases/10-llms-from-scratch/15-speculative-decoding-eagle3/docs/en.md, phases/10-llms-from-scratch/18-multi-token-prediction/docs/en.md, phases/17-infrastructure-and-production/05-eagle3-speculative-decoding/docs/en.md

- **投机解码会改输出质量吗？** 不会。输出与验证器分布完全一致。
- **为什么 decode 给它留了空间？** Decode 是内存受限的。计算在闲着。
- **vLLM V1 里怎么读 alpha？** 用 `spec_decode_metrics.accepted_tokens_per_request` 除以草稿长度。
- **EAGLE-3 改了什么？** 它丢掉特征损失，并用 training-time test 训练。
- **为什么 MTP 是好草稿？** 顺序模块保持因果链，像一个解码器。
