# Disaggregated Prefill/Decode — NVIDIA Dynamo 和 llm-d

> Prefill 是 compute-bound；decode 是 memory-bound。在同一块 GPU 上同时运行两者会浪费其中一种资源。Disaggregation 会把它们拆分到独立的资源池，并通过 NIXL（RDMA/InfiniBand 或 TCP fallback）在它们之间传输 KV cache。NVIDIA Dynamo（GTC 2025 发布，1.0 GA）位于 vLLM/SGLang/TRT-LLM 之上，它的 Planner Profiler + SLA Planner 会自动按速率匹配 prefill:decode 比例以满足 SLO。NVIDIA 发布的吞吐提升大致在这个范围内：developer.nvidia.com（2025-06）展示了在 GB200 NVL72 + Dynamo 上，DeepSeek-R1 MoE 在中等延迟区间约 6x 的提升；Dynamo 产品页（developer.nvidia.com，未注明日期）宣称在 GB300 NVL72 + Dynamo 上，相比 Hopper，MoE 吞吐最高可达 50x。“30x”数字是社区对 full-stack Blackwell + Dynamo + DeepSeek-R1 报告的聚合；我们没有找到单一 primary source 明确写着 exactly 30x，所以应把它视为方向性说法。llm-d（Red Hat + AWS）是 Kubernetes-native：prefill / decode / router 作为独立 Services，并针对每个角色使用 HPA。llm-d 0.5 增加了 hierarchical KV offloading、cache-aware LoRA routing、UCCL networking、scale-to-zero。经济性：对多份客户披露的内部汇总表明，在保持 SLA 不变时，从 colocated serving 切换到 Dynamo 的 disaggregated serving，可在 $2M 级别推理支出上节省 30–40%（即 $600-800K/年）；这个具体的 $2M→$600-800K 数字是内部 composite，不是单个已发布 case study，应把它作为数量级锚点，而不是引用参考。短 prompts（<512 tokens，短输出）不足以抵消传输成本。

**Type:** 学习
**Languages:** Python（stdlib，玩具级 disaggregated-vs-colocated simulator）
**Prerequisites:** Phase 17 · 04（vLLM Serving Internals），Phase 17 · 08（Inference Metrics）
**Time:** ~75 分钟

## 学习目标

- 解释为什么 prefill 和 decode 有不同的最优 GPU 分配，并量化 colocation 下的浪费。
- 画出 disaggregated architecture：prefill pool、decode pool、通过 NIXL 的 KV transfer、router。
- 说出 disaggregation 不划算的条件（短 prompts、短 outputs）。
- 区分 NVIDIA Dynamo（stack-above）和 llm-d（Kubernetes-native），并把它们匹配到对应的运维场景。

## 问题

你在 8 块 H100 上运行 Llama 3.3 70B。在混合工作负载（长 prompts + 短 outputs）下，GPU 在 decode 期间空闲，因为大部分 compute 已经花在 prefill 上。在另一类工作负载（短 prompts + 长 outputs）下，情况相反。Colocated prefill + decode 意味着你会对两者都过度配置。

预算影响：20-40% 的 GPU 时间浪费在错误资源上。你在购买 H100 compute 去运行 memory-bound decode，或者购买 H100 HBM bandwidth 去运行 compute-bound prefill。两者都是昂贵的浪费。

Disaggregation 会把 prefill 和 decode 拆分到独立资源池，并按各自瓶颈进行 sizing。KV cache 通过高带宽 interconnect 从 prefill pool 传输到 decode pool。

## 概念

### 为什么瓶颈不同

**Prefill** — 对完整输入 prompt 执行一次 transformer forward。Matrix multiplications 占主导；compute-bound。H100 FP8 可提供约 2000 TFLOPS 的有效吞吐。Batch efficiency 很好，一次 forward 可处理许多 tokens。

**Decode** — 一次生成一个 token，每次迭代都读取完整 weights。Memory-bandwidth-bound。HBM3 提供约 3 TB/s。Batch efficiency 只有在高 concurrency 下才好，因为 weights read 会在 batch 上分摊。

把它们 colocate：你购买同时为两者优化的 GPU。H100 两者都擅长，但无论哪种用途成本都一样。在规模化时，你希望 prefill pool 使用 H100 / compute-heavy；decode pool 使用 H200 / memory-heavy，或者配合 aggressive quantization。

### 架构

```
            ┌──────────────┐
  Request → │    Router    │ ───────────────────────┐
            └──────┬───────┘                        │
                   │                                │
                   ▼ (prompt only)                  │
            ┌──────────────┐    KV cache    ┌───────▼──────┐
            │ Prefill pool │ ─── NIXL ────► │ Decode pool  │
            │  (compute)   │                │  (memory)    │
            └──────────────┘                └──────┬───────┘
                                                   │ tokens
                                                   ▼
                                                 Client
```

NIXL 是 NVIDIA 的 inter-node transport。可用时使用 RDMA/InfiniBand，否则使用 TCP fallback。传输延迟是真实存在的，70B FP8 上 4K-token prompt 的 KV cache 通常需要 20-80 ms。这就是短 prompts 不适合 disaggregation 的原因：传输税超过节省收益。

### Dynamo vs llm-d

**NVIDIA Dynamo**（GTC 2025 发布，1.0 GA）：
- 作为 orchestrator 位于 vLLM、SGLang、TRT-LLM 之上。
- Planner Profiler 测量工作负载，SLA Planner 自动配置 prefill:decode 比例。
- Rust core，Python extensibility。
- 吞吐提升：NVIDIA 报告称，在 GB200 NVL72 + Dynamo 上，DeepSeek-R1 MoE 在中等延迟区间达到 6x（developer.nvidia.com，2025-06）；社区关于 full Blackwell + Dynamo + DeepSeek-R1 stacks “up to 30x” 的报告缺少单一 primary source，应视为方向性信息。
- GB300 NVL72 + Dynamo：根据 Dynamo 产品页（developer.nvidia.com，未注明日期），相比 Hopper，MoE 吞吐最高可达 50x。

**llm-d**（Red Hat + AWS，Kubernetes-native）：
- Prefill / decode / router 作为独立 Kubernetes Services。
- Per-role HPA 使用 queue depth（prefill）/ KV utilization（decode）信号。
- `topologyConstraint packDomain: rack` 会把 prefill+decode cliques 放在同一 rack 上，以实现高带宽 KV transfer。
- llm-d 0.5（2026）：hierarchical KV offloading、cache-aware LoRA routing、UCCL networking、scale-to-zero。

如果你想要 managed stack-above orchestrator，使用 Dynamo。如果你想要 Kubernetes-native primitives，并且已投入 CNCF 生态，使用 llm-d。

### 经济性

内部 composite（不是单个已发布 case study，仅作为数量级锚点）：

- colocated serving 的推理支出为 $2M/年。
- 切换到使用 Dynamo 的 disaggregated serving。
- 相同请求量，相同 P99 latency SLA。
- 报告节省：$600K–$800K/年（降低 30–40%）。
- 无新增硬件。

我们是从多份客户披露中综合得到这一数字，而不是来自单个可引用 case study；最接近的已发布数据点是 Baseten 的 Dynamo KV routing 带来 2x faster TTFT / 61% higher throughput（baseten.co，2025-10），以及 VAST + CoreWeave 在 40–60% KV hit rate 下预测 tokens/$ 增加 60–130%（vastdata.com，2025-12）。节省来自对每个资源池进行 right-sizing；prefill-heavy 工作负载（带 8K+ prefixes 的 RAG）比均衡负载受益更多。

### 什么时候不要 disaggregate

- Prompts < 512 tokens 且 outputs < 200 tokens：传输税主导收益。
- 小型集群（< 4 GPUs）：没有足够的 pool diversity。
- 团队无法运维两个 GPU pools 并进行 per-role scaling：Dynamo 会有所帮助，但并非毫无复杂度。
- 没有 RDMA fabric：TCP transfer tax 更重。

### Router 与 Phase 17 · 11 集成

Disaggregated routers 是 KV-cache-aware（Phase 17 · 11）。请求会落到持有其 prefix 的 decode pool 上；如果没有匹配，就走 prefill → decode。Hit rate 与 disaggregation 会叠加收益，cache-aware router 决定是否甚至需要新的 prefill。

### Blackwell 上的 MoE 才是真正有数字的地方

GB300 NVL72 + Dynamo 展示了相比 Hopper baselines 50x 的 MoE 吞吐。MoE expert routing 在 prefill 上 compute-heavy，但在 decode 上 memory-heavy（expert caches），因此 disaggregation 是双重收益。2026 年 frontier model serving 以 MoE 为主（DeepSeek-V3、未来 GPT-5 variants）。

### 你应该记住的数字

Benchmark 数字会变化，NVIDIA 和 inference stack 每季度都会发布更新结果。引用前重新检查。

- GB200 NVL72 + Dynamo 上的 DeepSeek-R1：中等延迟区间相较 baseline 约 ~6x 吞吐（developer.nvidia.com，2025-06）；社区关于 full Blackwell + Dynamo stacks “up to 30x” 的说法是方向性聚合，没有单一 primary source。
- GB300 NVL72 + Dynamo：相比 Hopper，MoE 吞吐最高可达 50x（developer.nvidia.com，未注明日期）。
- 节省锚点（内部 composite，不是单个 case study）：在 SLA 不变时，从 $2M 年度支出中节省 $600-800K/年。
- Disaggregation threshold：prompts >512 tokens + outputs >200 tokens。
- 通过 NIXL 的 KV transfer：70B FP8 上 4K-prompt KV 需要 20-80 ms。

## 使用它

`code/main.py` 模拟 colocated vs disaggregated serving。报告 throughput、cost per request，以及 prompt-length crossover。

## 交付它

本课会产出 `outputs/skill-disaggregation-decider.md`。给定 workload 和 cluster，判断是否应该 disaggregate。

## 练习

1. 运行 `code/main.py`。在什么 prompt length 下，disaggregation 会优于 colocation？
2. 为一个 P99 prefix length 为 8K、output 为 300 的 RAG service 设计 prefill pool 和 decode pool。
3. Dynamo vs llm-d：为一家 pure-Kubernetes shop 选择一个方案，且没有 Python runtime 偏好。
4. 计算 KV transfer cost：70B FP8 上 4K prefill = ~500 MB KV。在 RDMA 100 GB/s 下，transfer = 5 ms。在 TCP 10 GB/s 下 = 50 ms。哪个会影响你的 SLA？
5. MoE expert routing 会改变 KV access patterns。对于每个 token 激活不同 experts 的 MoE，disaggregation 会如何表现？

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Disaggregated serving | “split prefill/decode” | 为每个阶段使用独立 GPU pools |
| NIXL | “NVIDIA transport” | Dynamo 的 inter-node KV transfer（RDMA/TCP） |
| NVIDIA Dynamo | “the orchestrator” | vLLM/SGLang/TRT-LLM 的 stack-above coordinator |
| llm-d | “Kubernetes native” | Red Hat + AWS K8s disaggregated stack |
| Planner Profiler | “Dynamo auto-config” | 测量工作负载，配置 pool ratios |
| SLA Planner | “Dynamo policy” | 自动按速率匹配 prefill:decode 以满足 SLOs |
| `packDomain: rack` | “llm-d topology” | 将 prefill+decode 放在同一 rack 上以实现快速 KV |
| UCCL | “unified collective” | llm-d 0.5 用于 scale-to-zero 的 networking layer |
| MoE expert routing | “expert per token” | DeepSeek-V3 pattern；disaggregation 有帮助 |

## 延伸阅读

- [NVIDIA — Introducing Dynamo](https://developer.nvidia.com/blog/introducing-nvidia-dynamo-a-low-latency-distributed-inference-framework-for-scaling-reasoning-ai-models/)
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/)
- [TensorRT-LLM Disaggregated Serving blog](https://nvidia.github.io/TensorRT-LLM/blogs/tech_blog/blog5_Disaggregated_Serving_in_TensorRT-LLM.html)
- [llm-d GitHub](https://github.com/llm-d/llm-d)
- [llm-d 0.5 release notes](https://github.com/llm-d/llm-d/releases)
