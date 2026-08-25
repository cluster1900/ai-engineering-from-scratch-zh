# 解耦式 Prefill/Decode — NVIDIA Dynamo 与 llm-d

> Prefill 受 compute 限制；decode 受 memory 限制。在同一块 GPU 上运行两者会浪费其中一种资源。解耦会将它们拆分到不同的资源池中，并通过 NIXL（RDMA/InfiniBand，或回退到 TCP）在两者之间传输 KV cache。NVIDIA Dynamo（在 GTC 2025 发布，1.0 GA）位于 vLLM/SGLang/TRT-LLM 之上，其 Planner Profiler + SLA Planner 会自动匹配 prefill:decode 比例以满足 SLO。NVIDIA 公布的吞吐量提升大致处于这一范围：developer.nvidia.com（2025-06）显示，在中等延迟场景下，GB200 NVL72 + Dynamo 上的 DeepSeek-R1 MoE 提升约 6 倍；Dynamo 产品页面（developer.nvidia.com，未注明日期）则宣称，GB300 NVL72 + Dynamo 相比 Hopper 可将 MoE 吞吐量提升多达 50 倍。“30 倍”这一数字是社区对完整 Blackwell + Dynamo + DeepSeek-R1 报告的汇总；我们尚未找到明确陈述恰好提升 30 倍的单一一手来源，因此应将其视为方向性说法。llm-d（Red Hat + AWS）是 Kubernetes-native 的：prefill、decode 和 router 分别作为独立 Service 运行，并为每种角色配置 HPA。llm-d 0.5 增加了分层 KV offloading、cache-aware LoRA routing、UCCL networking 和 scale-to-zero。经济性方面：对多份客户披露信息的内部汇总表明，在 SLA 不变的情况下，从共置式服务切换到使用 Dynamo 的解耦式服务，可在约 $2M 的 Inference 支出中节省 30–40%（即每年 $600-800K）；具体的 $2M→$600-800K 数字是内部综合估算，并非来自单一公开案例研究，应将其用作数量级参考，而不是引用来源。短 prompt（<512 Token，输出较短）不足以抵消传输成本。

**Type:** Learn
**Languages:** Python（stdlib，简化的解耦式与共置式模拟器）
**Prerequisites:** Phase 17 · 04（服务引擎内部机制），Phase 17 · 08（Inference 指标）
**Time:** 约 75 分钟

## 学习目标

- 解释为什么 prefill 和 decode 的最优 GPU 分配不同，并量化共置情况下的浪费。
- 绘制解耦式架构图：prefill pool、decode pool、通过 NIXL 传输 KV，以及 router。
- 说明解耦无法带来收益的条件（短 prompt、短输出）。
- 区分 NVIDIA Dynamo（上层技术栈）与 llm-d（Kubernetes-native），并将两者匹配到相应的运维场景。

## 问题

你在 8 块 H100 上运行 Llama 3.3 70B。在混合工作负载（长 prompt + 短输出）下，GPU 在 decode 期间处于空闲状态，因为大部分 compute 已消耗在 prefill 上。在另一种工作负载（短 prompt + 长输出）下，情况恰好相反。将 prefill + decode 共置意味着你需要为两者都进行过度配置。

预算影响：20-40% 的 GPU 时间被浪费在不匹配的资源上。你购买 H100 的 compute 能力来运行受 memory 限制的 decode，或者购买 H100 的 HBM 带宽来运行受 compute 限制的 prefill。两者都是代价高昂的浪费。

解耦会将 prefill 和 decode 拆分到不同资源池中，并根据各自的瓶颈确定资源池规模。KV cache 通过高带宽互连从 prefill pool 传输到 decode pool。

## 概念

### 为什么瓶颈不同

**Prefill** — 在一次 forward 中对完整输入 prompt 运行 Transformer。Matrix 乘法占主导，因此受 compute 限制。H100 FP8 可提供约 2000 TFLOPS 的有效吞吐量。Batch 效率很高，一次 forward 可以处理多个 Token。

**Decode** — 每次生成一个 Token，并在每轮迭代中读取完整权重。它受 memory bandwidth 限制。HBM3 可提供约 3 TB/s。只有在高并发下 Batch 效率才高，因为读取权重的成本可以分摊到整个 Batch。

将它们共置意味着：你购买针对两者优化的 GPU。H100 在两方面都表现良好，但无论用于哪一方面，成本都相同。在大规模场景下，你会希望 prefill pool 使用 H100 或偏重 compute 的硬件；decode pool 使用 H200 或偏重 memory 的硬件，或者采用激进的 Quantization。

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

NIXL 是 NVIDIA 的节点间传输层。在可用时使用 RDMA/InfiniBand，否则回退到 TCP。传输延迟确实存在：对于 70B FP8 上 4K-Token prompt 的 KV cache，通常为 20-80 ms。这就是短 prompt 不适合解耦的原因：传输开销会超过节省的成本。

### Dynamo 与 llm-d

**NVIDIA Dynamo**（在 GTC 2025 发布，1.0 GA）：
- 作为 orchestrator 位于 vLLM、SGLang 和 TRT-LLM 之上。
- Planner Profiler 测量工作负载，SLA Planner 自动配置 prefill:decode 比例。
- Rust 核心，支持通过 Python 扩展。
- 吞吐量提升：NVIDIA 报告称，在中等延迟场景下，GB200 NVL72 + Dynamo 上的 DeepSeek-R1 MoE 提升了 6 倍（developer.nvidia.com，2025-06）；社区报告称，完整 Blackwell + Dynamo + DeepSeek-R1 技术栈可“提升多达 30 倍”，但缺乏单一一手来源，应将其视为方向性说法。
- GB300 NVL72 + Dynamo：根据 Dynamo 产品页面（developer.nvidia.com，未注明日期），MoE 吞吐量相比 Hopper 最多提升 50 倍。

**llm-d**（Red Hat + AWS，Kubernetes-native）：
- Prefill、decode 和 router 分别作为独立的 Kubernetes Service 运行。
- 每种角色使用 HPA，并分别采用队列深度（prefill）和 KV 利用率（decode）信号。
- `topologyConstraint packDomain: rack` 会将 prefill+decode clique 放置在同一 rack，以便进行高带宽 KV 传输。
- llm-d 0.5（2026）：分层 KV offloading、cache-aware LoRA routing、UCCL networking、scale-to-zero。

如果你需要托管式的上层技术栈 orchestrator，请使用 Dynamo。如果你需要 Kubernetes-native 原语，并且已经采用 CNCF 生态系统，请使用 llm-d。

### 经济性

内部综合估算（并非单一公开案例研究，仅作为数量级参考）：

- 共置式服务每年的 Inference 支出为 $2M。
- 切换到使用 Dynamo 的解耦式服务。
- 请求量相同，P99 延迟 SLA 相同。
- 报告的节省金额：每年 $600K–$800K（减少 30–40%）。
- 无需新增硬件。

我们根据多份客户披露信息综合得出这一数字，而非引用单一案例研究；最接近的已公开数据点是 Baseten 使用 Dynamo KV routing 后 TTFT 加快 2 倍、吞吐量提升 61%（baseten.co，2025-10），以及 VAST + CoreWeave 预测在 KV 命中率为 40–60% 时，每美元可生成的 Token 数量增加 60–130%（vastdata.com，2025-12）。节省来自对每个资源池进行合理配置；prefill 密集型工作负载（具有 8K+ prefix 的 RAG）比均衡工作负载受益更多。

### 不应进行解耦的情况

- Prompt < 512 Token 且输出 < 200 Token：传输开销会超过收益。
- 小型集群（< 4 块 GPU）：资源池差异不足。
- 团队无法运维两个采用不同角色扩缩策略的 GPU pool：Dynamo 可以提供帮助，但并非轻而易举。
- 没有 RDMA fabric：TCP 传输开销更大。

### Router 与 Phase 17 · 11 集成

解耦式 router 能感知 KV cache（Phase 17 · 11）。请求会落到持有其 prefix 的 decode pool 上；如果没有匹配项，则按 prefill → decode 的路径流转。命中率与解耦效果会相互叠加，cache-aware router 决定是否确实需要执行新的 prefill。

### Blackwell 上的 MoE 才是实际性能数字的关键

GB300 NVL72 + Dynamo 的 MoE 吞吐量相比 Hopper 基线提升了 50 倍。MoE expert routing 在 prefill 阶段偏重 compute，但在 decode 阶段偏重 memory（expert cache），因此解耦能够带来双重收益。2026 年的前沿 Model 服务以 MoE 为主（DeepSeek-V3、未来的 GPT-5 变体）。

### 应该记住的数字

Benchmark 数字会发生变化，NVIDIA 和 Inference 技术栈每个季度都会发布更新结果。引用前请重新核验。

- GB200 NVL72 + Dynamo 上的 DeepSeek-R1：在中等延迟场景下，相比基线吞吐量提升约 6 倍（developer.nvidia.com，2025-06）；社区关于完整 Blackwell + Dynamo 技术栈“提升多达 30 倍”的说法是没有单一一手来源的方向性汇总。
- GB300 NVL72 + Dynamo：相比 Hopper，MoE 吞吐量最多提升 50 倍（developer.nvidia.com，未注明日期）。
- 节省金额参考（内部综合估算，并非单一案例研究）：在 SLA 不变的情况下，每年 $2M 的支出可节省 $600-800K。
- 解耦阈值：prompt >512 Token 且输出 >200 Token。
- 通过 NIXL 传输 KV：70B FP8 上 4K prompt 的 KV 需要 20-80 ms。

```figure
prefill-decode-split
```

## 使用它

`code/main.py` 模拟共置式与解耦式服务。它会报告吞吐量、每次请求的成本以及 prompt 长度的交叉点。

## 交付它

本课程会生成 `outputs/skill-disaggregation-decider.md`。它会根据工作负载和集群决定是否进行解耦。

## 练习

1. 运行 `code/main.py`。从多长的 prompt 开始，解耦式服务的表现会超过共置式服务？
2. 为 P99 prefix 长度为 8K、输出为 300 的 RAG 服务设计 prefill pool 和 decode pool。
3. Dynamo 与 llm-d：对于完全采用 Kubernetes 且对 Python runtime 没有偏好的团队，应选择哪一个？
4. 计算 KV 传输成本：70B FP8 上的 4K prefill 对应约 500 MB KV。在 RDMA 100 GB/s 下，传输时间为 5 ms；在 TCP 10 GB/s 下为 50 ms。哪一个会影响你的 SLA？
5. MoE expert routing 会改变 KV 访问模式。对于每个 Token 激活不同 expert 的 MoE，解耦会有怎样的表现？

## 关键术语

| 术语 | 人们通常怎么说 | 实际含义 |
|------|----------------|------------------------|
| Disaggregated serving | “拆分 prefill/decode” | 为每个阶段使用独立的 GPU pool |
| NIXL | “NVIDIA transport” | Dynamo 的节点间 KV 传输（RDMA/TCP） |
| NVIDIA Dynamo | “orchestrator” | 用于 vLLM/SGLang/TRT-LLM 的上层技术栈协调器 |
| llm-d | “Kubernetes native” | Red Hat + AWS 的 K8s 解耦式技术栈 |
| Planner Profiler | “Dynamo 自动配置” | 测量工作负载并配置资源池比例 |
| SLA Planner | “Dynamo policy” | 自动匹配 prefill:decode 速率以满足 SLO |
| `packDomain: rack` | “llm-d topology” | 将 prefill+decode 放置在同一 rack，以快速传输 KV |
| UCCL | “统一 collective” | llm-d 0.5 用于 scale-to-zero 的 networking layer |
| MoE expert routing | “每个 Token 一个 expert” | DeepSeek-V3 模式；解耦会有所帮助 |

## 延伸阅读

- [NVIDIA — Dynamo 简介](https://developer.nvidia.com/blog/introducing-nvidia-dynamo-a-low-latency-distributed-inference-framework-for-scaling-reasoning-ai-models/)
- [NVIDIA — Kubernetes 上的解耦式 LLM Inference](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/)
- [TensorRT-LLM 解耦式服务博客](https://nvidia.github.io/TensorRT-LLM/blogs/tech_blog/blog5_Disaggregated_Serving_in_TensorRT-LLM.html)
- [llm-d GitHub](https://github.com/llm-d/llm-d)
- [llm-d 0.5 release notes](https://github.com/llm-d/llm-d/releases)
