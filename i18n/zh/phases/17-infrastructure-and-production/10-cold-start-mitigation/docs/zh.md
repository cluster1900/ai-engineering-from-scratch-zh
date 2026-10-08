# 无服务器LLM的冷开始缓解

> 一个20GB模型图像从冷到服务需要5-10分钟(7B) 到20+分钟(70B) ⋅在真正的无服务器世界里,这不是加热,而是停机――减速作用在五层:预种子节点图像(AWS 上的瓶、双体积弧) 、模型流媒体(NVIDIA Run:ai Model Streamer,vLLM 原生支持)、GPU内存快照(Modal检查站,重启 最多快10x)、热池(`min_workers=1`◎ 层次加载 (※) ◎ 无服务器LLM的NVMe→DRAM→HBM管道,延迟率降低10-200x),以及传输输输入代码 (※) 而不是KV缓存(GB) 的现场迁移── 模型发布的 2-4s冷开始是下限; 基本默认 5-10s,配合预加热可达次下次── 本课教你测量、预算并叠加这五层──

**Type:** Learn
**Languages:** Python (stdlib, toy cold-start path simulator)
**前置要求：**期17 · 02 (推理平台经济学),期17 · 03 (GPU自动扩展)
**Time:** ~60 minutes

## 学习目标
- 列举冷启动缓解的五层,并说出一个工具或模式的每个层次.
- 将 70B模型的总冷启动时间计算为 (节点提供) + (重量下载) + (重量加载到HBM) + (引擎启动) 之和。
- 解释为什么直播迁移传输输输入代币(KB) 而不是KV缓存(GB),以及代价是什么(重新计算)
- 为了置GPU付费,或接受冷启动尾巴),以及`min_workers > 0`成为必需的SLA门.

## 问题
你的无服务器LLM终点在夜间规模到零.

1. 卡珀特提供一个GPU节点:45-60s.
2. 集装箱拉一带重量的30GB图像:120-300s──
3. 发动机将重量加载到HBM:45-120s,取决于模型大小和存储速度.
4. 首先,我们需要在线观看,

总计:220-510s(大约3-8分钟) 后才会返回一个代币――你的SLA是2s――你发布一个热池――`min_workers=1`),问题似乎消失了,但现在你需要为一个空置的GPU24x7付费. 如果你的服务有5个产品,每个产品都有一个热的副本,那就是5 × 24 × 30 =3600个GPU-小时/月,无论是否有一个用户调用过.

缓解冷启动是保持无服务器经济的方法,同时接近始终延迟.

## 概念
### 层1  预置节点镜像(瓶子弹)

在 AWS 上,Bottlerocket的双体积架构将操作系统与数据分离.`EC2NodeClass`中引用快照ID──新节点 启动时重量 已经在本地NVMe上,步骤2和步骤3的一部分将消失──它与卡宾特原生配合──典型节省:大型模型 每次冷启动节省 2-4 分钟──

采用相同模式的管理磁盘快照.

### 层2 模式流 (Run:ai模型流器)

不等完整的文件加载 完整回应第一个请求,而是逐层将权重流到GPU内存,并在第一个变压器区块 常驻后立即开始处理.

### 层3  GPU内存快照 (Modal)

在第一次加载后对 GPU状态进行检查点.后续重新启动.直接消化到 HBM,比重新启动快 10x. 这最接近的在 2 秒内启动一个温暖的 GPU.

### 层4 热池 (min_workers=1)

最简单的减轻:保持一个复制品 始终准备好. 成本是一个GPU的每小时率 24x7――对小型号来说这个算法很残酷.$0.85-$1,50 避免30 年代冷开始),对大型车型则更友好(每小时支付 $4 避免5 分钟冷开始) ・热池 变得必需的SLA门:通常是70B+模型 上 TTFT P99 < 60s──

### 五层 层次加载 (ServerlessLLM)

服务器无LLM将存储视为一个层次:NVMe(快但大)、DRAM(中等但可分层)、HBM(小但即时) ⋅重量 预先加载到DRAM;按需加载到HBM。纸质报告,相比于天真的磁盘到HBM,冷负载的延迟 降低10-200x。生产采用 仍处于早期阶段,但已经存在与vLLM的集成──

### 层6 直播迁移 (奖金模式)

当某个节点不可用时(点驱逐、节点排泄),传统模式是冷启动 另一个复制并排泄请求队列──直播迁移将输入代币(千字节) 移动到已加载模型的目的地,并在目的地上重新计算KV缓存──重新计算 比通过网络传输GB级KV缓存 更便宜──适用于分类部署──

### 热池的数学

对于P99 TTFT SLA 为2s的服务,问题不是要不要热池,而是需要多少热复制品,以及哪些途径可以获得它们──

- 互动路径 (高价值)`min_workers=1-2`,我知道.
- 背景批量路径 (夜间分类):接受从零到零,可容忍 5-10 分钟冷开始――
- 优质级别:每个租户使用 `min_workers`和专用容量.

### 在优化之前测量

全新节点 上 70B模型的冷启动解剖 (示例):

| Phase | Time | Mitigation |
|-------|------|-----------|
| Node provision | 50s | Bottlerocket + pre-seeded image, warm pool |
| Image pull | 180s | Pre-seeded data volume (eliminate) |
| Weights to HBM | 75s | Model streamer (halve); GPU snapshot (eliminate) |
| Engine init | 20s | Persistent CUDA graph cache |
| First forward | 3s | Min inherent latency |
| **Total cold** | **328s** | |
| **Total with mitigations** | **~15s** | 22x reduction |

### 你应该记住的数字

- 电脑的速度很快.
- 默认冷开始:5-10s;使用预加热时次下秒
- 原始70B冷开始:3-8分钟.
- 运行:ai 流量模型:~2倍重量加载速度――
- 无服务器LLM级载荷:延迟 降低10-200x (纸张数量) ⋅


```figure
cold-start-pipeline
```

## 使用它
`code/main.py`报告冷开始时间,热池成本以及热池回本所需的平衡要求率.

## 交付它
本课会产出 `outputs/skill-cold-start-planner.md`△给定SLA、模型大小和交通形状,选择应加些减轻措施──

## 练习
1. 运行`code/main.py`△计算破产要求率:超过这个速度后,热复制会比因SLO下额外要求下降而支付冷开始税更便宜──
2. 你部署一个13B模型,P99 TTFT SLA 为3s──选择能达到其最小减轻堆 (最少的层)──
3. 提前播放瓶子 消除了图像拉力,但重量仍然需要从快照载荷到HBM──如果快照支持的NVMe的读取速度为7GB/s,计算70B模型的墙钟──
4. 你的无服务器提供GPU快照,但你的团队拒绝了,理由是快照会泄露PII──论证双方的观点:现实风险是什么,减轻是什么?
5. 设计一个层次的热池政策:付费用户,试用用户和批量工作负载 分别需要多少热复制?展示计算过程――

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Cold start | “the big pause” | Fresh replica 上从 request 到 first token 的时间 |
| Warm pool | “always-on minimum” | `min_workers >= 1`，保持至少一个 replica ready |
| Pre-seeded image | “baked AMI” | Container weights 已预先常驻的 node image |
| Bottlerocket | “AWS node OS” | 支持 dual-volume snapshot 的 AWS container-optimized OS |
| Model streamer | “streaming load” | 将 weights I/O 与 compute setup 重叠 |
| GPU snapshot | “checkpoint to HBM” | 序列化 post-load GPU state；restart 时 deserialize |
| Tiered loading | “NVMe + DRAM + HBM” | Storage tiers 的 hierarchy；按需 load |
| Live migration | “move tokens” | 传输 input（KB），在 destination 上 recompute KV |
| `min_workers` | “warm replicas” | Serverless minimum keep-alive count |
| Scale-to-zero | “full serverless” | Idle 时无 cost；接受完整 cold-start tax |

## 延伸阅读
- [Modal — Cold start performance](https://modal.com/docs/guide/cold-start) 汽车 发布的基准和检查点架构
- [AWS Bottlerocket](https://github.com/bottlerocket-os/bottlerocket)预先播种的数据量快照图案――
- [NVIDIA Run:ai Model Streamer](https://github.com/run-ai/runai-model-streamer) 将重量加载与计算设置 重叠
- [Baseten — Cold-start mitigation](https://www.baseten.co/blog/cold-start-mitigation/)预热游戏册──
- [ServerlessLLM paper (USENIX OSDI'24)](https://www.usenix.org/conference/osdi24/presentation/fu)层次装载设计――
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/)分类部署的现场迁移――
