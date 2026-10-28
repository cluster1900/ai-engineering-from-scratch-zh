---
id: sglang-serving
title: LLM Serving with SGLang
code: LS
subtitle: 启动、定容、测量并修好一台 SGLang 服务器。SGLang 0.5.22。
hue: 200
sources: manuals/sglang-101
source_hash: d7a954f07c2cb645
---

## 启动服务器
type: annotated-code
lang: bash
from: manuals/sglang-101/capture/gpu/out-l4/server-default.command.txt, manuals/sglang-101/capture/README.md, manuals/sglang-101/sections/1-1-install-sglang-and-serve-your-first-model.md

```bash
export HF_HUB_OFFLINE=1   # no Hub contact once the models are cached
sglang serve --model-path <model> --host 127.0.0.1 --port 30000 --enable-cache-report --enable-metrics --mem-fraction-static 0.85   # the L4 flags
curl http://127.0.0.1:30000/ready   # 200 when the server accepts requests
```

## 三个进程
type: architecture
from: manuals/sglang-101/sections/2-1-sglang-serve-and-the-three-processes.md, manuals/sglang-101/sections/3-1-kv-bytes-per-token-and-the-kv-pool.md

```arch
node | client | 1,1 | Client | POST /generate | client
node | tok | 2,1 | TokenizerManager | text to token ids | process
node | sched | 3,1 | Scheduler | batches and KV pool | process
node | detok | 4,1 | Detokenizer | ids to text | process
node | gpu | 3,2 | Model on GPU | forward pass | model
node | kv | 3,3 | KV pool | slots per token | store
edge | client | tok | HTTP
edge | tok | sched | ZMQ
edge | sched | gpu | batch
edge | sched | kv | slots
edge | sched | detok | ids
edge | detok | client | text
```

## 请求与检查
type: task-table
from: manuals/sglang-101/sections/1-1-install-sglang-and-serve-your-first-model.md, manuals/sglang-101/sections/2-5-streaming-stop-strings-and-the-openai-api.md, manuals/sglang-101/sections/5-1-sglang-benchmark-serving.md, manuals/sglang-101/sections/4-6-deterministic-inference-and-logprobs.md, manuals/sglang-101/sections/7-1-operating-sglang.md

| 任务 | 代码 |
|---|---|
| 发一条原生请求 | `POST /generate` |
| 用 OpenAI chat 格式询问 | `POST /v1/chat/completions` |
| 读一次请求的缓存命中 | `meta_info` 字段 `cached_tokens` |
| 探测就绪 | `/ready` |
| 固定基准测试的长度分布 | `--random-range-ratio 1.0` |
| 扫一个并发上限 | `--max-concurrency 8` |
| 发送固定到达率 | `--request-rate <rate>` |
| 测输出稳定性 | `python3 -m sglang.test.test_deterministic --n-trials 50 --test-mode single` |

## 基准测试你的服务器
type: command-table
from: manuals/sglang-101/sections/5-1-sglang-benchmark-serving.md

| 命令 | 作用 |
|---|---|
| `python -m sglang.benchmark.serving --backend sglang --port 30000 --dataset-name random --num-prompts 32 --max-concurrency 8 --seed 7` | 发送 32 条随机 prompt，最多 8 条在途，然后打印报告 |
| `--random-input-len 512 --random-output-len 128` | 设置 prompt 与答案长度 |
| `--random-range-ratio 1.0` | 让每条 prompt 都保持你要求的长度。默认 0.0 会让平均值大约减半 |
| `--request-rate <rate>` | 按日程发送请求，好让服务器像真实流量一样落后 |

## 要紧的默认值
type: defaults
from: manuals/sglang-101/sections/r-1-flags-and-defaults.md, manuals/sglang-101/sections/2-2-the-scheduler-loop-and-schedule-policy.md, manuals/sglang-101/sections/2-3-admission-and-retraction.md, manuals/sglang-101/sections/3-5-eviction-policies-and-hicache.md, manuals/sglang-101/sections/6-4-sgl-model-gateway.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `--schedule-policy` | `fcfs` | `lpm` 是论文里的顺序，不是默认 |
| `--schedule-conservativeness` | 1.0 | 日志出现 retraction 时调高 |
| `--radix-eviction-policy` | `lru` | 只在测过命中率之后再改 |
| `--kv-cache-dtype` | `auto` | 保持模型数据类型 |
| `--stream-interval` | 1 | 每一步之后流式输出 |
| `--tp-size` | 1 | 一个 GPU，除非权重要更多 |
| `--cache-threshold` | 0.3 | 网关前缀亲和的匹配率 |

## 修这些错误
type: troubleshooting
from: manuals/sglang-101/sections/3-2-mem-fraction-static-and-startup-sizing.md, manuals/sglang-101/sections/2-3-admission-and-retraction.md, manuals/sglang-101/sections/6-1-tp-size-dp-size-and-attn-dp-size.md, manuals/sglang-101/sections/4-1-forwardmode-and-cuda-graphs.md, manuals/sglang-101/sections/3-4-prefix-friendly-prompts.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 32 个请求时 `RuntimeError: [METAL] Command buffer execution failed` | 池按空闲内存的 87% 定容 | 传 `--mem-fraction-static 0.4` 并重启 |
| 中位 TTFT 接近 28 s 且 GPU 内存空闲 | 准入把请求排进满池队列 | 提高 `--schedule-conservativeness` 或降低 `--max-running-requests` |
| 循环出现 `KV cache pool is full. Retract requests.` | 预测过于大胆 | 提高 `--schedule-conservativeness` 并发送现实的 `max_new_tokens` |
| `RuntimeError: The memory capacity is unbalanced` | 一张 TP 卡与其他 pod 共享内存 | 释放另一张卡并重启。没有标志能关掉该检查 |
| 负载下 decode 行出现 `cuda graph: False` | decode 批次超过图上限 | 把 `--cuda-graph-max-bs-decode` 设到峰值并发 |
| `ambiguous option: --cuda-graph-max-bs` | 该标志在 v0.5.22 被拆分 | 使用 `--cuda-graph-max-bs-decode` 或 `--cuda-graph-max-bs-prefill` |
| 每一次重复都是 `#cached-token: 0` | 系统 prompt 开头有随机 ID | 把 ID 移到末尾或去掉 |

## 按这个顺序调
type: flow
from: manuals/sglang-101/sections/7-1-operating-sglang.md, manuals/sglang-101/sections/5-1-sglang-benchmark-serving.md, manuals/sglang-101/sections/6-1-tp-size-dp-size-and-attn-dp-size.md

1. **测量**：用 `--random-range-ratio 1.0` 在三个上限上跑 `sglang.benchmark.serving`。
2. **内存**：在任何共享机器上设置 `--mem-fraction-static`。
3. **Prompt**：把共享文本放前面，并把请求 ID 留在开头之外。
4. **上限**：把 `--max-running-requests` 设在你测到的拐点。
5. **内核**：一次只改图与注意力设置中的一项。
6. **并行**：只有当一个副本饱和时才加 `--tp-size` 或 `--dp-size`。

## 要盯的数字
type: concepts
from: manuals/sglang-101/sections/5-2-the-metrics-endpoint.md, manuals/sglang-101/sections/1-3-what-the-server-does-with-your-request.md, manuals/sglang-101/sections/2-5-streaming-stop-strings-and-the-openai-api.md

- **sglang:token_usage**：接近 1.0 表示 KV 池已满。
- **sglang:num_queue_reqs**：连续几分钟高于 0 表示服务器已过拐点。
- **sglang:cache_hit_rate**：一个区间上的仪表。从 `sglang:prefill_effective_tokens_total` 计算速率。
- **cached_tokens**：从缓存复用的 prompt token 数。
- **Goodput**：同时满足 TTFT 与 TPOT 目标的每秒请求数。

## 有记录的事故
type: concepts
from: manuals/sglang-101/sections/2-2-the-scheduler-loop-and-schedule-policy.md, manuals/sglang-101/sections/4-2-attention-backend.md, manuals/sglang-101/sections/4-4-speculative-decoding.md, manuals/sglang-101/sections/3-4-prefix-friendly-prompts.md

- **Issue #36889**：一个 Mamba 上限把请求限制设成 2，只有一行 info 说了这件事。
- **Issue #17411**：一次 FlashInfer 升级让 Hopper decode 慢了七倍。
- **Issue #5274**：EAGLE-3 把 batch-1 速度加倍，却把并发 20 砍掉四分之一。
- **Issue #35129**：去掉按会话的哈希后，命中率从 66.8% 升到 94.4%。

## 术语
type: glossary
from: manuals/sglang-101/sections/1-3-what-the-server-does-with-your-request.md, manuals/sglang-101/sections/3-1-kv-bytes-per-token-and-the-kv-pool.md, manuals/sglang-101/sections/6-2-moe-serving-deepep-and-eplb.md, manuals/sglang-101/sections/6-3-prefill-decode-disaggregation.md

- **ITL**：inter-token latency，token 之间的间隔。
- **MLA**：multi-head latent attention，DeepSeek 使用的紧凑 KV 布局。
- **MoE**：mixture of experts，每个 token 使用少数专家。
- **EPLB**：跨 GPU 的专家放置负载均衡。
- **PD**：prefill-decode disaggregation，prefill 与 decode 在不同服务器上。

## 问题
type: qa
from: manuals/sglang-101/sections/2-1-sglang-serve-and-the-three-processes.md, manuals/sglang-101/sections/3-2-mem-fraction-static-and-startup-sizing.md, manuals/sglang-101/sections/7-1-operating-sglang.md

- **首 token 时间高且 GPU 空闲时我该看哪里？** 在内核之前先查 tokenizer 进程。
- **为什么更大的池加不出吞吐？** 在我们的运行里，64 用户时池从未满过。
- **该部署 `latest` 吗？** 不该。钉住诸如 `v0.5.22` 的标签。

## 提示
type: tips
from: manuals/sglang-101/sections/2-5-streaming-stop-strings-and-the-openai-api.md, manuals/sglang-101/sections/2-1-sglang-serve-and-the-three-processes.md, manuals/sglang-101/sections/5-2-the-metrics-endpoint.md, manuals/sglang-101/sections/7-1-operating-sglang.md

- 用 `--enable-cache-report` 与 `--enable-metrics` 启动服务器。
- 在给客户端定容之前，先读启动日志里的池大小。
- 只给主进程发 SIGTERM。
- 对存活探针设置 `SGLANG_ENABLE_HEALTH_ENDPOINT_GENERATION=false`。
