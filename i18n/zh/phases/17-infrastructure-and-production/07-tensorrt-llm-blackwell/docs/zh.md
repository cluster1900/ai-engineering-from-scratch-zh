# 在黑上使用FP8和NVFP4 运行 TensorRT-LLM

> 强度RT-LLM 仅限于NVIDIA,但它在Blackwell上胜出. 在配合Dynamo编排的GB200 NVL72上,半分析InferenceX在2026年Q1-Q2测得120B模型成本为每百万代币.$0.012，而 H100 + vLLM 为 $0.09/M,形成7x的经济差距.这个堆是三种浮点精度体系的叠加:FP8对KV缓存和注意内核仍然关键,因为它具有它们所需的动态范围;NVFP4[4]4-位微量化) 处理权重和激活值;多代币预测 (MTP) 与分类预填/解码.

**Type:** 学习
**Languages:** Python (stdlib，玩具级 FP8/NVFP4 内存与成本计算器)
**前置要求：**阶段17 · 04 (vLLM服务内部),阶段10 · 13 (量化)
**Time:** ~75 分钟

## 学习目标

- 解释为什么即便权重使用NVFP4,FP8对KV缓存和注意力 仍然关键──
- 计算边界模型 在 BF16、FP8 和 NVFP4 下的HBM足迹,并推理节省来自哪里.
- 描述TRT-LLM利用的黑特有特点 ((日-0 FP4、MTP、分类服务、所有对所有原始的) 
- 判断什么时候 TRT-LLM 的NVIDIA锁值得交换对 Hopper 上 vLLM 的 7x 成本差距.

## 问题

2026年推理经济前沿问题是每美元能产生多少代币──答案取决于四层叠加选择:硬件代际(Hopper H100/H200 vs Blackwell B200/GB200) 精度(BF16 → FP8 → NVFP4) 服务引擎(vLLM vs SGLang vs TRT-LLM) 和编排方式(平坦 vs 分类式 vs 迪纳摩) ──

在 Hopper + vLLM 上,120B MoE 的运行成本约为每百万代币 ~$0.09。在 Blackwell + TRT-LLM + Dynamo 上，同一个模型的运行成本约为 ~$另一部分来自堆:FP4权重、MTP草案、分类预填/解码以及用于MoE专家通信的NVLink 5全至全――

您无法在NVIDIA堆之外复现这一点. 这就是取舍:使用可移植性换经济性.

## 概念

### 为什么FP8仍然是KV缓存的底线

2026年的一个常见错误是:假设NVFP4可以应用在所有地方──事实并非如此──KV缓存需要FP8 ((8-位浮点),因为它存储的注意力键和值 跨越很宽的动态范围──把KV量化到FP4会造成灾难性精度损失:分布尾部会落下,注意力分数会崩──FP8的指数位为KV缓存提供所需范围──

NVFP4(2025-2026)适用于权重和激活值.微量化:每个权重块都有自己的规模因子,因此小块可以覆盖不同动态范围,而不会遭受每ensor规模损失.

典型的黑布莱克韦尔配置:

- 权重:NVFP4 ((4位微量化)
- 激活值:NVFP4──
- 存储器:FP8。
- 注意积累器:FP32 ((软max 稳定性) ⋅

### 黑特有原始的使用 TRT-LLM

- **Day-0 FP4 weights**没有必要进行培训后转换即可加载――FP4 不需要AWQ/GPTQ 步骤――
- **Multi-token prediction (MTP)**子和子 (子) 相似,但集成到TRT-LLM构建中──
- **Disaggregated serving**通过NVLink或InfiniBand传输──与Dynamo(Phase 17 · 20)思路相同──
- **All-to-all communication primitives**为了实现这一目标,NVLink 5将MoE专家通信延迟相比Hopper 降低3x──TRT-LLM的MoE内核.
- **NVFP4 + MXFP8 microscaling**黑电压芯 上的硬件加速规模因素处理

### 你应该记住的数字

- 通过TRT-LLM在GPT-OSS-120B上达到0.02/M代币.
- 通过动态 (通过动态) 编排TRT-LLM) 达到0.012/M美元的代币.
- 钱的价格为0.09美元/M的代币.
- 增长率增长率增长率增长率增长率增长率增长率增长率增长率增长率
- 黑尔相对霍珀的单个GPULLM吞吐量为11-15倍.
- 黑 主导每个提交任务──

### 质量上的真实价格

在推理重量工作中,FP4 权重会明显退化. 每块校准可以缓解,但不能消除.推理模型的团队通常使用FP8 权重 +FP4 激活值作为折扣,或坚持在H200 上全程使用FP8──

规则:在承诺使用NVFP4权重前,始终在你的评估设置上验证任务质量.

### 为什么这是一个NVIDIA锁定决策

如果你的基础战略是多供应商,那么TRT-LLM对TRT-LLM服务层来说不可行;你仍然可以在混合硬件上使用vLLM服务.如果你只为NVIDIA,那么7x差距足以认为锁定付费.

### 2026 年实用配方

对于每年100万美元以上的推理账单,运行Hopper + vLLM 会留下7-10倍的优化空间――把成本主导型工作负载 迁移到Blackwell + TRT-LLM + Dynamo――把实验层保留在H100+ vLLM上,以获得模型代速度――每个NVFP4转换的模型上生产前必须验证质量――

### 分类奖励

在黑上,乘数会叠加:FP4权重 × MTP加速 × 分类配置 ×缓存意识路由──7x 数字假设使用的是这个套件的完整堆──


```figure
pipeline-parallel
```

## 使用它

`code/main.py`会为三种堆 计算模型的HBM足迹、解码吞吐量(记忆绑定模式) 和 $/M-代码:H100 + BF16 + vLLM、H100 + FP8 + vLLM、B200 + NVFP4/FP8 + TRT-LLM──运行它,观察复合效应,以及每个变化贡献了差距中的哪一部分──

## 交付它

本课会生成`outputs/skill-trtllm-blackwell-advisor.md`△给定工作负载、模型大小和年度代币量,它会判断黑+TRT-LLM堆是否值得NVIDIA锁.

## 练习

1. 运行`code/main.py`△对一个活跃参数为30%的120B MoE,计算H100 BF16、H100 FP8 和B200 NVFP4/FP8 上的内存带宽限制的解码吞吐量──最大的跃升来自哪里?
2. 某客户每年在H100+vLLM上花费2M美元. 考虑到7倍的经济差距,他们需要购买多少黑GPU才能在12个月内销售转移到TRT-LLM的成本?
3. 据了解,在NVFP4权重转换后,你在 MATH上看到准确率下降3个点.
4. 阅读MLPerf v6.0推断结果. 黑超级跳跃任务的差距最小,为什么?
5. 计算 405B 模型在 NVFP4 权重 + FP8 KV缓存、128k 文本下所需的HBM──它能装入单个GB200 NVL72 节点吗?

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| FP8 | "eight-bit float" | 8-bit floating point；由于动态范围，用于 KV cache 和 Attention |
| NVFP4 | "four-bit micro" | NVIDIA 的 4-bit microscaling FP format；用于 Blackwell 上的权重和激活值 |
| MXFP8 | "MX eight" | Microscaling FP8 variant；在 Blackwell Tensor Cores 上硬件加速 |
| Day-0 FP4 | "ship FP4 weights" | 模型提供方发布已经是 FP4 的权重；无需 post-train conversion 步骤 |
| MTP | "multi-token prediction" | TRT-LLM 集成的 speculative-decoding draft（Phase 17 · 05） |
| Disaggregated serving | "split prefill/decode" | Prefill 和 decode 位于独立 GPU pools；KV 通过 NVLink/IB 传输 |
| All-to-all | "MoE expert comm" | 将 Token 路由到 expert GPUs 的通信模式；NVLink 5 降低 3x |
| InferenceX | "SemiAnalysis inference bench" | 2026 年行业接受的 cost-per-token benchmark |

## 延伸阅读

- [NVIDIA — Blackwell Ultra MLPerf Inference v6.0](https://developer.nvidia.com/blog/nvidia-blackwell-ultra-sets-new-inference-records-in-mlperf-debut/) 2026 年 4 月 MLPerf 结果──
- [NVIDIA — Blackwell 上的 MoE Inference](https://developer.nvidia.com/blog/delivering-massive-performance-leaps-for-mixture-of-experts-inference-on-nvidia-blackwell/) NVLink 5 全面与MoE核子
- [TensorRT-LLM Overview](https://nvidia.github.io/TensorRT-LLM/overview.html) 官方引擎文档──
- [NVIDIA — Introducing Dynamo](https://developer.nvidia.com/blog/introducing-nvidia-dynamo-a-low-latency-distributed-inference-framework-for-scaling-reasoning-ai-models/) TRT-LLM 之上的分类组合.
- [MLPerf Inference](https://mlcommons.org/benchmarks/inference-datacenter/) 发布布莱克威尔数字的基准套件.
