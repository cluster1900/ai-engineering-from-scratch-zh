# 库伯内特 上的GPU自动扩展 卡珀特,KAI定制器,帮派定制器

> 是三层,不是一层. 卡巴中心 动态供应节点(不到一分钟,比集群自动缩放器 快 40%) ∙KAI 计划器 处理帮派排序、拓感知和分层队列  它可以避免7个8个部分的分配陷:七个节点因为缺少一个GPU而等并烧钱. 应用层自动缩放器(NVIDIA Dynamo 计划器, llm-d 工作负载变量自动缩放器) 基于推断专业信号扩容  队列深度、KV缓存利用率 而不是CPU/DCGM 工作周期. 经典HPA 陷在`DCGM_FI_DEV_GPU_UTIL`由于它是个任务周期测量:100% 可能是10个请求,也可能是100个.`WhenEmptyOrUnderutilized`策略,因为它会在推算过程中终止正在运行的GPU工作.

**Type:** Learn
**Languages:** Python (stdlib, toy queue-depth autoscaler simulator)
**前置要求：**阶段17 · 02 (信息平台经济学),阶段17 · 04 (vLLM服务内部)
**Time:** ~75 minutes

## 学习目标
- 画出三层自动扩展架构节点供应,团队安排,应用层),并说出每层使用的工具.
- 解释为什么`DCGM_FI_DEV_GPU_UTIL`是vLLM的错误HPA信号,并说出两个替代信号.
- 描述团队安排以及KAI安排器 防止部分分配失败模式 (8).
- 说见终止正在运行GPU工作的卡宾特整合策略`WhenEmptyOrUnderutilized`),并说明2026年安全替代方案.

## 问题
你的团队在 Kubernetes 上发布了一个 LLM服务服务.`DCGM_FI_DEV_GPU_UTIL`作为信号――业务时间内服务一直在100%的利用率――HPA从未扩大 它已经认为你满载了――你手动增加一个复制;TTFT 降落了――HPA 仍然不扩容――这个信号在骗你――

另外,你使用 Cluster Autoscaler 管理节点――凌晨2点来一个1M-Token提示;

另外,你部署了一个需要跨2个节点的70B模型使用8个GPU. 集群有7个空GPU,还有1个GPU分布在3个节点上.

三层,三种不同的失败模式――2026年 GPU 意识的自动扩展 不是开 HPA──它是组合节点供应、帮派调度和应用信号自动扩展──

## 概念
### 层1 节点供给 (卡普门特)

卡珀特监视待发的 pods,并在约45-60秒内提供节点.`NodePool`约束动态选择实例类型  如果你的需要8个H100,而集群中没有匹配节点,卡普伦特会直接提供一个节点,而不是扩展某个现有组.

**consolidation 陷阱**卡普林特默认的`consolidationPolicy: WhenEmptyOrUnderutilized`对GPU池来说,很危险.它会停止运行的GPU节点,把 pod 迁移到更便宜且更合适尺寸的实例.对于推断工作负载,这意味着驱逐正在运行的请求,并重新加载70B模型在新节点.

 GPU 池的安全设置:

```yaml
disruption:
  consolidationPolicy: WhenEmpty
  consolidateAfter: 1h
```

允许卡珀特在一小时后巩固真正空的节点,但绝不驱逐正在运行的工作.

### 层2 帮派安排KAI安排器)

卡尔普 (KAI Scheduler) 项目原名 "卡尔普",后改名) 处理默认的库尔普 (KAI Scheduler) 不处理的事情:

**Gang scheduling**完全有或完全无地调节.需要8个GPU的分布式推理模块,要么8个一起启动,要么一个都不启动.没有它,你会遇到部分分配陷.

**拓扑感知** 知道哪些GPU共享NVLink、哪些位于同一架架间、哪些之间有InfiniBand──并根据此放置 pod──DeepSeek-V3 67B索平行工作负载必须留在一个NVLink域内;KAI计划器将遵守这一点──

**分层队列** 多个团队优先和配额 竞争与一个GPU组.

作为二级调度器和be-scheduler 一起部署;你通过注释 让工作负载 使用它──Ray 和 vLLM生产堆都有集成──

### 层3  应用层信号

**HPA 陷阱**其他:`DCGM_FI_DEV_GPU_UTIL`根据工作周期的扩容容量是盲目扩容容量.

更糟糕的是,VLLM 和类似的引擎会预先分配KV缓存`--gpu-memory-utilization`尽管只有一个请求,内存使用量也保持在90%左右.

**2026 年替代信号**其他:

- 队列深度(等待预填的请求数量)。
- 按存储器使用率 (KV cache utilization rate) 分配给主动序列的块 (例如) ⋅
- 每个复制品的 P99 TTFT 信号
- 为了满足所有SLO的请求数量

它们将完全取代用于LLM服务的HPA──

### 什么时候用什么

| Scale decision | Tool |
|----------------|------|
| 添加/移除节点 | Karpenter |
| 调度 multi-GPU job | KAI Scheduler |
| 添加/移除 replica | Dynamo Planner / llm-d WVA（或基于队列深度的自定义 HPA） |
| 选择 GPU type | Karpenter NodePool |
| 抢占 low-priority | KAI Scheduler queues |

### 解散的预填/解码会让一切变得更加复杂

如果运行分类的预填/解码(17期 · 17期),你会有两类 pod,它们有不同的扩展触发器:预填 pod 基于队列深度扩缩容量,解码 pod 基于 KV缓存压力扩缩容量.llm-d 会将它们暴露为带有每角色 HPA 的独立`Services`,不要试图在两者面前放一个单独的HPA.

### 开始冷在这里也是很重要

缓解冷启动 (Cold-start mitigation) (第17阶段) 是节点供给时间的转变为用户可见延迟的地方──卡尔本特的45-60秒预热,加上20GB模型负载,再加上发动机 init,意味着从零 请求需要2-5分钟──对SLO关键路径保持一个热池`min_workers=1`),或在应用层使用摩达式检查点.

### 你应该记住的数字

- 卡珀特节点供应:约45-60s,对比集群自动缩器约90-120s(GPU节点) ⋅
- 防止部分分配浪费  7/8 陷
- `DCGM_FI_DEV_GPU_UTIL`作为HPA信号:坏掉的;使用队列深度或KV利用率──
- 匠`WhenEmptyOrUnderutilized`终止正在运行的GPU工作.`WhenEmpty + consolidateAfter: 1h`,我知道.


```figure
autoscaling
```

## 使用它
`code/main.py`在爆发的GPU工作负载上模拟一个三层自动缩放器──比较天真的HPA(职务周期)、排列深度HPA 和KAI团队计划缩放──报告未满足请求、空置GPU 分钟数和复合分数──

## 交付它
本课会生成`outputs/skill-gpu-autoscaler-plan.md`△给定集群拓,工作负载形状和SLO,它将设计一个三层次的自动扩展方案.

## 练习
1. 运行`code/main.py`在繁忙的工作负载下,无常工作周期的HPA会丢失多少次排队深度的HPA能接收的请求?差异来自哪里?
2. 为一个在H100 SXM5 上服务 Llama 3.3 70B FP8 的集群设计 卡珀特 NodePool──指定 `capacity-type`,我知道.`disruption.consolidationPolicy`,我知道.`consolidateAfter`并且让非GPU工作负载无法调节到这些节点上的污染.
3. 您的团队报告部署卡在等待,因为GPU可用但无法调节.
4. 为分类预填机组 选择一个自动缩放信号,并为解码机组 选择另一个不同信号.说明两者理由.
5. 计算`WhenEmptyOrUnderutilized`整合 陷在24x7生产服务上的成本:该服务平均每天有60次请求下降事件,且P99 TTFT > 10s──

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
- [KAI Scheduler GitHub](https://github.com/kai-scheduler/KAI-Scheduler) 设计文档和配置示例.
- [Karpenter Disruption Controls](https://karpenter.sh/docs/concepts/disruption/)整合政策 语义和GPU安全默认值
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/) 动力计划器扩展信号――
- [Ray docs — KAI Scheduler for RayClusters](https://docs.ray.io/en/latest/cluster/kubernetes/k8s-ecosystem/kai-scheduler.html)雷集成模式
- [AWS EKS Compute and Autoscaling Best Practices](https://docs.aws.amazon.com/eks/latest/best-practices/aiml-compute.html)管理-库伯内特特指导
- [llm-d GitHub](https://github.com/llm-d/llm-d) 工作负载变量自动尺设计
