---
id: serving-engines-compared
title: Serving Engines Compared
code: SN
subtitle: vLLM、SGLang、TRT-LLM 与 llama.cpp 并列对比。调度器、KV 复用、精度、卸载与选型。
hue: 262
sources: phases/17-infrastructure-and-production/04-vllm-serving-internals, phases/17-infrastructure-and-production/06-sglang-radixattention, phases/17-infrastructure-and-production/07-tensorrt-llm-blackwell, phases/17-infrastructure-and-production/18-vllm-production-stack-lmcache, phases/17-infrastructure-and-production/28-self-hosted-serving-selection
source_hash: b662bf5b651f8306
---

## 引擎并列对比
type: comparison
span: 2
from: phases/17-infrastructure-and-production/04-vllm-serving-internals, phases/17-infrastructure-and-production/06-sglang-radixattention, phases/17-infrastructure-and-production/07-tensorrt-llm-blackwell, phases/17-infrastructure-and-production/28-self-hosted-serving-selection

| 因素 | vLLM | SGLang | TRT-LLM | llama.cpp |
|---|---|---|---|---|
| 核心思想 | PagedAttention、连续批处理、分块 prefill | RadixAttention、缓存感知调度器 | NVFP4 权重、FP8 KV、MTP | CPU 上最快，模型支持最广 |
| 调度 | V1 scheduler、FCFS | 深度优先分发、分支级 LRU | 分离的 prefill/decode | 对线程有完全控制 |
| 硬件 | NVIDIA、AMD ROCm | NVIDIA、AMD | 仅 NVIDIA，Blackwell | CPU、Apple Silicon Metal |
| 头条数字 | 2,200-2,400 tok/s，70B FP8，H100 | 8B 上 ~16,200 vs ~12,500 tok/s | GB200 NVL72 上 $0.012/M tokens | Ollama 慢 15-30% |
| 权重格式 | HF safetensors | HF safetensors | 按 GPU SKU 编译 | GGUF |
| 弱点 | 前缀密集流量 | 独特 prompt，回到 vLLM 水平 | 无 AMD、无 Intel、无 ARM | 不是流水线的生产阶段 |

## 何时用各引擎
type: concepts
from: phases/17-infrastructure-and-production/28-self-hosted-serving-selection, phases/17-infrastructure-and-production/06-sglang-radixattention, phases/17-infrastructure-and-production/07-tensorrt-llm-blackwell, phases/17-infrastructure-and-production/18-vllm-production-stack-lmcache

- **vLLM**：通用聊天、100+ 用户、AMD GPU 或混合硬件。
- **SGLang**：共享长前缀的 agent、RAG 和聊天。
- **TRT-LLM**：仅 NVIDIA 的基础设施，以及 Blackwell 上成本主导的工作。
- **llama.cpp**：CPU、edge 或 Apple Silicon。
- **Ollama**：开发笔记本上的单用户。不是共享生产。
- **TGI**：仅用于现有部署。自 Dec 11, 2025 起为维护模式。
- **原生 CPU 卸载**：单个引擎有 HBM 压力。
- **LMCache**：多个引擎共享前缀，或抢占很重。

## vLLM 调度器循环
type: annotated-code
lang: python
from: phases/17-infrastructure-and-production/04-vllm-serving-internals/docs/en.md

```python
while True:
    finished = [s for s in RUNNING if s.is_done()]
    for s in finished: release_blocks(s); RUNNING.remove(s)  # free blocks
    while WAITING and have_free_blocks_for(WAITING[0]):  # admit on free KV
        s = WAITING.pop(0)
        allocate_initial_blocks(s)
        RUNNING.append(s)
    batch = []
    for s in RUNNING:
        if s.in_prefill:
            batch.append(next_prefill_chunk(s))  # e.g. 512 tokens
        else:
            batch.append(decode_one_token(s))  # 1 token
    run_forward(batch)  # one fused GPU call
```

## radix 树中的一次请求
type: flow
from: phases/17-infrastructure-and-production/06-sglang-radixattention/docs/en.md

1. **Request**：system prompt 加上 "Context: <doc A>" 加上 "Question: Carol"。
2. **Scheduler**：遍历树。system 前缀匹配，复用 124 个块。
3. **Scheduler**：doc A 分支匹配，复用 31 个块。
4. **Allocator**：只给 "Question: Carol" 新块，4 个块。
5. **Result**：prefill 4 个块，而不是 160。大约少 40x 的 prefill。
6. **Eviction**：从最短使用的叶子整支移除。

## 生产技术栈
type: architecture
from: phases/17-infrastructure-and-production/18-vllm-production-stack-lmcache/docs/en.md

```arch
node | client | 1,1 | Client | requests | client
node | router | 2,1 | Router | cache-aware, KV events | process
node | eng | 3,1 | vLLM engines | one per GPU or TP/PP group | gpu
node | conn | 3,2 | Connector API | v0.9.0+, async in 0.11.0 | process
node | lmc | 2,2 | LMCache server | CPU DRAM, shared | store
node | ceph | 1,2 | Ceph/S3 tier | disk below DRAM | store
node | obs | 3,3 | Observability | Prometheus, Grafana, OTel | process
edge | client | router | HTTP
edge | router | eng | route
edge | eng | conn | offload
edge | conn | lmc | store
edge | lmc | ceph | spill
edge | eng | obs | scrape
```

## main.py 中的精度与技术栈经济性
type: comparison
span: 2
from: phases/17-infrastructure-and-production/07-tensorrt-llm-blackwell

| 因素 | H100 + BF16 + vLLM | H100 + FP8 + vLLM | B200 + NVFP4 + FP8 + TRT-LLM | GB200 NVL72 + TRT-LLM + Dyn |
|---|---|---|---|---|
| 每 GPU 的 HBM，GB | 80 | 80 | 192 | 192 |
| HBM 带宽，TB/s | 3.35 | 3.35 | 8.00 | 8.00 |
| 权重位数 | 16 | 8 | 4 | 4 |
| KV cache 位数 | 16 | 8 | 8 | 8 |
| MTP 因子 | 1.0 | 1.0 | 1.8 | 1.8 |
| 分离因子 | 1.0 | 1.0 | 1.6 | 2.5 |
| 每 GPU 小时价格 | 2.50 | 2.50 | 4.80 | 6.20 |

## 运行模拟器
type: task-table
from: phases/17-infrastructure-and-production/04-vllm-serving-internals/code/main.py, phases/17-infrastructure-and-production/06-sglang-radixattention/code/main.py, phases/17-infrastructure-and-production/07-tensorrt-llm-blackwell/code/main.py, phases/17-infrastructure-and-production/18-vllm-production-stack-lmcache/code/main.py, phases/17-infrastructure-and-production/28-self-hosted-serving-selection/code/main.py

| 任务 | 代码 |
|---|---|
| 静态批处理 | `simulate_static(reqs, batch=16)` |
| 连续批处理加分块 | `simulate_continuous(reqs, chunked=True)` |
| 缓存感知 radix 顺序 | `simulate(requests, "CACHE_AWARE")` |
| 打乱的前缀顺序 | `workload_scrambled(n=80, docs=4)` |
| 每个技术栈的 HBM 占用 | `hbm_footprint_gb(params_b, active_b, seq_len, stack)` |
| 每百万 tokens 成本 | `cost_per_million_tokens(active_b, stack)` |
| HBM 压力下的 LMCache | `simulate("LMCACHE", reqs)` |
| 按你的约束选引擎 | `pick_engine(hardware, scale, workload)` |

## 排障
type: troubleshooting
from: phases/17-infrastructure-and-production/04-vllm-serving-internals, phases/17-infrastructure-and-production/06-sglang-radixattention, phases/17-infrastructure-and-production/07-tensorrt-llm-blackwell, phases/17-infrastructure-and-production/18-vllm-production-stack-lmcache

| 症状 | 原因 | 修复 |
|---|---|---|
| 长 prompt 期间 decode 停顿 | Prefill 冻结了 decode | 分块 prefill。P99 ITL ~50 ms 到 ~15 ms |
| 共享 prompt 上命中率 7% | 前缀中有动态内容 | 不可变部分放前面。7% 到 74% |
| 6.4x 收益消失 | 模板顺序随请求变化 | 固定一种组件顺序 |
| HBM 100%，同一 prompt 再次 prefill | 抢占驱逐了 KV | 原生 CPU 卸载或 LMCache |
| 开了 LMCache 慢 3-5% | HBM 压力小 | 关掉 LMCache |
| NVFP4 之后精度下降 | reasoning 任务上用了 FP4 权重 | FP8 权重加 FP4 激活 |
| FP4 KV 时 attention 崩塌 | KV 需要动态范围 | 把 KV cache 留在 FP8 |
| 特性一起坏掉 | 组合不在矩阵里 | 按你的版本查矩阵 |

## 问题
type: qa
from: phases/17-infrastructure-and-production/04-vllm-serving-internals, phases/17-infrastructure-and-production/06-sglang-radixattention, phases/17-infrastructure-and-production/07-tensorrt-llm-blackwell, phases/17-infrastructure-and-production/18-vllm-production-stack-lmcache

- **为什么 FCFS 不适合前缀流量？** 它会驱逐热分支来接纳短前缀请求。
- **分块 prefill 保护的是什么？** TTFT 尾部和 ITL，不是平均吞吐。
- **7x 的 TRT-LLM 差距从哪来？** HBM 带宽、NVFP4 权重、MTP 和分离部署。
- **不到 1K tokens 的 prompt 用 LMCache？** 不用。传输时间比重新 prefill 还长。
- **要不要启用 PagedAttention？** 没有开关。它是 vLLM 唯一附带的分配器。
- **vLLM 会复用前缀吗？** 会，用 `--enable-prefix-caching`。SGLang 是 radix 优先。

## 术语表
type: glossary
from: phases/17-infrastructure-and-production/04-vllm-serving-internals, phases/17-infrastructure-and-production/06-sglang-radixattention, phases/17-infrastructure-and-production/07-tensorrt-llm-blackwell, phases/17-infrastructure-and-production/18-vllm-production-stack-lmcache

- **ITL**：inter-token latency。两个 decode token 之间的时间。
- **TTFT**：first token time。Prefill 加排队加网络。
- **FCFS**：first-come first-served。会破坏前缀局部性。
- **NVFP4**：NVIDIA 的 4-bit microscaling 格式，用于权重和激活。
- **MTP**：multi-token prediction。TRT-LLM 集成的草稿。
- **MXFP8**：Blackwell Tensor Cores 上的 microscaling FP8 变体。
- **Connector API**：vLLM 0.9.0+ 可插拔的 KV 存储接口。
- **Preemption**：HBM 满时的 KV cache 挪腾。
