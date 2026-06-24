# Kubernetes 上的 GPU Autoscaling — Karpenter, KAI Scheduler, Gang Scheduling

> 是三层，不是一层。Karpenter 动态供给节点（不到一分钟，比 Cluster Autoscaler 快 40%）。KAI Scheduler 处理 gang scheduling、拓扑感知和分层队列 —— 它能避免 7-of-8 的部分分配陷阱：七个节点因为缺一个 GPU 而等待并烧钱。应用层 autoscaler（NVIDIA Dynamo Planner, llm-d Workload Variant Autoscaler）基于推理专用信号扩缩容 —— 队列深度、KV cache 利用率 —— 而不是 CPU/DCGM duty cycle。经典 HPA 陷阱在于 `DCGM_FI_DEV_GPU_UTIL` 是 duty-cycle 测量：100% 可能是 10 个请求，也可能是 100 个。vLLM 会预分配 KV cache memory，所以 memory 永远不会触发 scale-down。本课会教你组合这三层，并避开默认的 Karpenter `WhenEmptyOrUnderutilized` 策略，因为它会在推理过程中终止正在运行的 GPU job。

**Type:** Learn
**Languages:** Python (stdlib, toy queue-depth autoscaler simulator)
**前置要求：** Phase 17 · 02 (Inference Platform Economics), Phase 17 · 04 (vLLM Serving Internals)
**Time:** ~75 minutes

## 学习目标
- 画出三层 autoscaling 架构（节点供给、gang scheduling、应用层），并说出每一层使用的工具。
- 解释为什么 `DCGM_FI_DEV_GPU_UTIL` 是 vLLM 的错误 HPA 信号，并说出两个替代信号（队列深度、KV cache 利用率）。
- 描述 gang scheduling 以及 KAI Scheduler 防止的部分分配失败模式（8 个 GPU 中有 7 个空闲等待）。
- 说出会终止正在运行 GPU job 的 Karpenter consolidation 策略（`WhenEmptyOrUnderutilized`），并说明 2026 年的安全替代方案。

## 问题
你的团队在 Kubernetes 上发布了一个 LLM serving 服务。你把 HPA 设置为使用 `DCGM_FI_DEV_GPU_UTIL` 作为信号。业务时间内服务一直卡在 100% 利用率。HPA 从不 scale up —— 它已经认为你满载了。你手动增加一个 replica；TTFT 降下来了。HPA 仍然不扩容。这个信号在骗你。

另外，你使用 Cluster Autoscaler 管理节点。凌晨 2 点来了一个 1M-Token prompt；cluster 花了 3 分钟供给节点，请求超时。

再另外，你部署了一个需要跨 2 个节点使用 8 个 GPU 的 70B model。cluster 有 7 个空闲 GPU，还有 1 个 GPU 分散在 3 个节点上。Cluster Autoscaler 为缺的那 1 个 GPU 供给一个节点。七个节点等待 4 分钟，一边烧钱，一边等 Kubernetes 把最后一个 GPU 拉起来。

三层，三种不同的失败模式。2026 年的 GPU-aware autoscaling 不是“打开 HPA”。它是组合节点供给、gang scheduling 和应用信号 autoscaling。

## 概念
### Layer 1 — 节点供给 (Karpenter)

Karpenter 监听 pending pods，并在约 45-60 秒内供给节点（Cluster Autoscaler 对 GPU 节点通常需要 90-120 秒）。它会根据 `NodePool` 约束动态选择 instance type —— 如果你的 pod 需要 8 个 H100，而 cluster 中没有匹配节点，Karpenter 会直接供给一个节点，而不是扩展某个现有 group。

**consolidation 陷阱**：Karpenter 默认的 `consolidationPolicy: WhenEmptyOrUnderutilized` 对 GPU pool 很危险。它会终止正在运行的 GPU 节点，把 pod 迁移到更便宜且更合适尺寸的 instance。对于 inference workload，这意味着驱逐正在运行的请求，并在新节点上重新加载 70B model。损失是数分钟容量外加请求失败。

GPU pool 的安全设置：

```yaml
disruption:
  consolidationPolicy: WhenEmpty
  consolidateAfter: 1h
```

允许 Karpenter 在一小时后 consolidation 真正空闲的节点，但绝不驱逐正在运行的 job。

### Layer 2 — gang scheduling（KAI Scheduler）

KAI Scheduler（项目原名 "Karp"，后改名）处理默认 kube-scheduler 不处理的事情：

**Gang scheduling** —— 全有或全无地调度。需要 8 个 GPU 的分布式 inference pod，要么 8 个一起启动，要么一个都不启动。没有它，你会遇到部分分配陷阱：8 个 pod 中启动了 7 个，无限期等待并烧钱。

**拓扑感知** —— 知道哪些 GPU 共享 NVLink、哪些位于同一 rack、哪些之间有 InfiniBand。并据此放置 pod。DeepSeek-V3 67B tensor-parallel workload 必须留在一个 NVLink domain 内；KAI Scheduler 会遵守这一点。

**分层队列** —— 多个团队以 priority 和 quota 竞争同一个 GPU pool。Team A 的生产紧急需求只有在 priority 规则允许时，才会被 Team B 的 training job 抢占。

KAI 作为 secondary scheduler 与 kube-scheduler 一起部署；你通过 annotation 让 workload 使用它。Ray 和 vLLM production-stack 都有集成。

### Layer 3 — 应用层信号

**HPA 陷阱**：`DCGM_FI_DEV_GPU_UTIL` 是 duty-cycle metric —— 它测量 GPU 在每个采样间隔是否正在工作。100% 利用率可能意味着 10 个并发请求，也可能是 100 个；不管哪种，GPU 都在忙。基于 duty cycle 扩缩容就是盲目扩缩容。

更糟的是，vLLM 和类似 engine 会预分配 KV cache memory（最高到 `--gpu-memory-utilization`）。即使只有一个请求，memory usage 也保持在接近 90%。基于 memory 的 HPA 永远不会 scale down。

**2026 年替代信号**：

- 队列深度（等待 prefill 的请求数）。
- KV cache 利用率（分配给 active sequence 的 block 比例）。
- 每个 replica 的 P99 TTFT（你的 SLA 信号）。
- Goodput（每秒满足所有 SLO 的请求数）。

NVIDIA Dynamo Planner 和 llm-d Workload Variant Autoscaler 会消费这些信号并扩缩 replica。它们会完全取代用于 LLM serving 的 HPA。

### 什么时候用什么

| Scale decision | Tool |
|----------------|------|
| 添加/移除节点 | Karpenter |
| 调度 multi-GPU job | KAI Scheduler |
| 添加/移除 replica | Dynamo Planner / llm-d WVA（或基于队列深度的自定义 HPA） |
| 选择 GPU type | Karpenter NodePool |
| 抢占 low-priority | KAI Scheduler queues |

### Disaggregated prefill/decode 会让一切更复杂

如果你运行 disaggregated prefill/decode（Phase 17 · 17），你会有两类 pod，且它们有不同的 scaling trigger：prefill pod 基于队列深度扩缩容，decode pod 基于 KV cache pressure 扩缩容。llm-d 会把它们暴露为带有 per-role HPA 的独立 `Services`。不要尝试在两者前面放一个单独的 HPA。

### Cold start 在这里也很重要

Cold-start mitigation（Phase 17 · 10）是节点供给时间变成用户可见延迟的地方。Karpenter 的 45-60 秒预热，加上 20GB model load，再加上 engine init，意味着 from-zero 请求需要 2-5 分钟。对 SLO-critical path 保持一个 warm pool（`min_workers=1`），或在应用层使用 Modal-style checkpointing。

### 你应该记住的数字

- Karpenter 节点供给：约 45-60s，对比 Cluster Autoscaler 约 90-120s（GPU 节点）。
- KAI Scheduler 防止部分分配浪费 —— 7-of-8 陷阱。
- `DCGM_FI_DEV_GPU_UTIL` 作为 HPA 信号：坏掉的；使用队列深度或 KV 利用率。
- Karpenter `WhenEmptyOrUnderutilized`：终止正在运行的 GPU job。对 inference 使用 `WhenEmpty + consolidateAfter: 1h`。


```figure
autoscaling
```

## 使用它
`code/main.py` 在 bursty GPU workload 上模拟一个三层 autoscaler。比较 naive HPA（duty cycle）、queue-depth HPA 和 KAI-gang-scheduled scaling。报告未满足请求、idle-GPU 分钟数和 composite score。

## 交付它
本课会生成 `outputs/skill-gpu-autoscaler-plan.md`。给定 cluster topology、workload shape 和 SLO，它会设计一个三层 autoscaling 方案。

## 练习
1. 运行 `code/main.py`。在 bursty workload 下，naive duty-cycle HPA 会丢掉多少个 queue-depth HPA 能接住的请求？差异来自哪里？
2. 为一个在 H100 SXM5 上服务 Llama 3.3 70B FP8 的 cluster 设计 Karpenter NodePool。指定 `capacity-type`、`disruption.consolidationPolicy`、`consolidateAfter`，以及一个让 non-GPU workload 无法调度到这些节点上的 taint。
3. 你的团队报告 deployment 卡在 Pending，因为“GPU 可用但 pod 无法调度”。诊断一下 —— 这是 Karpenter、kube-scheduler，还是 KAI Scheduler 的问题？哪些 metric 能确认？
4. 为 disaggregated prefill pod 选择一个 autoscaling 信号，并为 decode pod 选择另一个不同信号。说明两者理由。
5. 计算 `WhenEmptyOrUnderutilized` consolidation 陷阱在一个 24x7 生产服务上的成本：该服务平均每天有 60 次 request-dropping event，且 P99 TTFT > 10s。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Karpenter | "the node provisioner" | Kubernetes 节点 autoscaler；亚分钟级供给 |
| Cluster Autoscaler | "the old scaler" | Kubernetes 节点 autoscaler 的前身；更慢，基于 group |
| KAI Scheduler | "the GPU scheduler" | 用于 gang + topology + queues 的 secondary scheduler |
| Gang scheduling | "all or nothing" | 原子化调度 N 个 pod，或全部延后 |
| Topology awareness | "rack-aware" | 基于 NVLink/IB/rack placement 放置 pod |
| `DCGM_FI_DEV_GPU_UTIL` | "GPU utilization" | Duty-cycle metric；不是 LLM 的 scaling signal |
| Queue depth | "waiting requests" | 对 prefill-bound scaling 正确的 HPA 信号 |
| KV cache utilization | "memory pressure" | 对 decode-bound scaling 正确的 HPA 信号 |
| Consolidation | "Karpenter consolidation" | 终止节点以迁移到更便宜的 instance type |
| `WhenEmpty + 1h` | "safe consolidation" | 不驱逐正在运行 GPU job 的策略 |

## 延伸阅读
- [KAI Scheduler GitHub](https://github.com/kai-scheduler/KAI-Scheduler) — 设计文档和配置示例。
- [Karpenter Disruption Controls](https://karpenter.sh/docs/concepts/disruption/) — consolidation policy 语义和 GPU-safe 默认值。
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/) — Dynamo Planner scaling signals。
- [Ray docs — KAI Scheduler for RayClusters](https://docs.ray.io/en/latest/cluster/kubernetes/k8s-ecosystem/kai-scheduler.html) — Ray 集成模式。
- [AWS EKS Compute and Autoscaling Best Practices](https://docs.aws.amazon.com/eks/latest/best-practices/aiml-compute.html) — managed-Kubernetes-specific guidance。
- [llm-d GitHub](https://github.com/llm-d/llm-d) — Workload Variant Autoscaler 设计。
