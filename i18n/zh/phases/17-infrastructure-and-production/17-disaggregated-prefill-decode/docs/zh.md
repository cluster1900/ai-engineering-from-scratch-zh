# 已分类的预填/解码  NVIDIA Dynamo 和 llm-d

> 预填是计算的;解码是内存的. 在同一块GPU上同时运行,它们将自动分开成独立资源池,并通过NIXL进行分离. 通过RDMA/InfiniBand或 TCP fallback) 它们之间传输KV缓存. 通过NVIDIA Dynamo. GTC 2025发布,1.0 GA总部位于vLLM/SGLang/TRT-LLM 上,其规划器在调整器+SLA规划器上会自动按速度分配预填:解码比如满足SLO. NVIDIA发布的吐槽在这个范围内不适合.$2M 级别推理支出上节省 30–40%（即 $具体情况:$2M→$600-800K 数字是内部复合的,不是单个已发布的案例研究,应把它作为数量级点,而不是引用参考.

**Type:** 学习
**Languages:** Python（stdlib，玩具级 disaggregated-vs-colocated simulator）
**Prerequisites:** Phase 17 · 04（vLLM Serving Internals），Phase 17 · 08（Inference Metrics）
**Time:** ~75 分钟

## 学习目标

- 解释为什么预填和解码有不同的优质的GPU 分布,并量化配合 下的浪费.
- 画出分类结构:预填池、解码池、通过NIXL的KV转移、路由器──
- 描述分类 不划算的条件
- 区分 NVIDIA 动力系统 (上) 和Illm-d (Kubernetes) 产地,并将它们匹配对应的运维场景.

## 问题

你在 8 块 H100 上运行 Llama 3.3 70B 在混合工作负载中,GPU 在解码期间空,因为大部分计算已经花在预填上. 在另一类工作负载中,情况相反.

预算影响:20-40%的GPU 时间浪费在错误资源上――你是在购买H100计算,运行内存绑定解码,或者购买H100HBM带宽运行计算绑定预填料――这两者都是昂贵的浪费.

分类 会把预填和解码 拆分成独立资源池,并按各自的瓶子进行尺寸化.

## 概念

### 为什么瓶子不同

**Prefill**对完整输入提示 执行一次变压器前进――矩阵乘法占主导地位;计算式――H100 FP8 可提供约2000 TFLOPS的有效吞吐量――批量效率很好,一次前进可处理许多代币――

**Decode** 一次生成一个代币,每次代都读取完整的权重――内存带宽限制――HBM3 提供约3TB/s――批量效率只有在高的同步下才好,因为重量读 会在批量上分摊――

在规模化时,你希望预填池使用H100/计算重;解码池使用H200/内存重,或者配合攻击性量化――

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

传输延迟是真实存在的,70B FP8 上4K-代币提示的KV缓存通常需要20-80ms──这是短提示不适合分类的原因:传输税超过省收收.

### 迪纳摩vsIIM-D

**NVIDIA Dynamo**(通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通
- 作为乐团主持人,位于VLLM、SGLang、TRT-LLM 之上.
- 规划者 测量工作负载,SLA规划者 自动配置预填:代码 比例。
- 芯,Python可扩展性.
- 吞吐提升:NVIDIA 报告称,在 GB200 NVL72 + Dynamo 上,DeepSeek-R1 MoE 在中等延迟区间达到6x(developer.nvidia.com,2025-06);社区关于全布莱克威尔 + 迪纳莫 + DeepSeek-R1堆 高达30x 的报告缺少单一主要来源,应视为方向性信息──
- 根据Dynamo 产品页面(developer.nvidia.com,未注明期),相比Hopper,MoE 吞吐最高可可达50x──

**llm-d**网络服务:
- 作为独立的库伯内特服务.
- 按角色 HPA 使用队列深度 (prefill) / KV使用 (decode) 信号。
- `topologyConstraint packDomain: rack`为了实现高带宽 KV 转移,会把预填+解码点击放在同一架上.
- 置,缓存,LoRA路由,UCCL网络,规模到零.

如果你想管理堆的管弦乐器,使用Dynamo. 如果你想Kubernetes原生原始,并且已经投入CNCF 生态,使用 llm-d.

### 经济性

内部复合 (不是单个已发布的案例研究,仅作为数量级点):

- 配送的推支出为每年2亿美元.
- 切换到使用 迪纳莫的分类服务──
- 同样的请求量,同样的P99延迟SLA.
- 报告节省:$600K–$平均水平为35%
- 无新增硬件──

我们从多个客户披露中得到了这一数字,而不是来自单个可引用的案例研究;最近发布的数据点是Baseten的Dynamo KV路由带来了2倍更快的TTFT / 61%更高的吞吐量(baseten.co,2025-10),以及VAST + CoreWeave 在4060%KV的打击率下预测代币/$ 增加60130%(vastdata.com,2025-12) 节省来自对每个池的资源进行正确的尺寸;预填重工作负载(带有8K+预写的RAG) 比平衡负载受益更多.

### 什么时候不要分类

- 提示 < 512 代币 且输出 < 200 代币:传输税主导收益。
- 小型集群 ((< 4 GPU):没有足够的游泳池多样性──
- 团队无法运行两个GPU池并进行每个角色的扩展:动态会有帮助,但并不是无复杂性.
- 没有RDMA:TCP转让税更重.

### 路由器与第17阶段 · 11 集成

断分路由器是KV缓存意识的(第17阶段 · 11) 请求会落到持有其前的解码池上;如果没有匹配,就走先填 →解码――热速与断分会叠加收益,缓存意识的路由器决定是否甚至需要新的预填――

### 黑尔上部的MOE才是真正数字化的地方

GB300 NVL72 + Dynamo 显示相比Hopper基线的 MoE 吞吐量50x.MoE专家路由在预填上计算重,但在解码上内存重.

### 你应该记住的数字

基准数字会变化,NVIDIA 和推断堆 每季都会发布更新结果.

- GB200 NVL72 + Dynamo 上的深度搜索-R1:中等延迟区间相比基线约 ~6x 吞吐(developer.nvidia.com,2025-06);社区关于全局黑+dynamo堆 高达30x的说法是方向性聚合,没有单一的首要来源──
- 据悉,这次的发展将在全球范围内持续到5亿美元.
- 节省点(内部复合,不是单个案例研究):在SLA 不变时,从 $2M 年度支出中节省 $平均每年600-800K.
- 分类门:提示>512个令牌+输出>200个令牌。
- 通过NIXL的KV转移:70B FP8 上4K提示KV需要20-80ms──


```figure
prefill-decode-split
```

## 使用它

`code/main.py`模拟定位服务与分类服务――报告每次请求的吞吐量、成本以及快速续航交叉量――

## 交付它

本课会产出 `outputs/skill-disaggregation-decider.md`△给定工作负载和集群,判断是否应该分类.

## 练习

1. 运行`code/main.py`什么快速长度下,分类会比定位更好?
2. 为一个P99预写长度 为8K,输出 为300的RAG服务 设计预填池 和解码池.
3. 为了一个纯库伯内特的商店 选择一个方案,且没有Python运行时间 偏好.
4. 计算KV转移成本:70B FP8 上4K预填 = ~500MB KV──在RDMA 100GB/s 下,转移 = 5ms──在TCP 10GB/s 下 = 50ms──哪些会影响你的SLA?
5. 如何表现出MOE的分类,对每个代币的不同专家的激活?

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
