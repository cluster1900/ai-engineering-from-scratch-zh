# 多区域LLM服务与KV缓存本地

> 对于缓存式LLM推断来说,圆负载平衡是有害的. 如果没有落到持有其先的节点,则必须支付完整的预填费. 成本:长提示上P50约800 ms,而缓存击中约80 ms. 到2026年,生产模式是缓存知路由器. 它消耗了KV-cache 事件,并基于预先匹配进行路由. 近期研究 (GORGO) 将跨区域网络延迟路由目标的显式比分. 中央商业化"跨区域推断"作为产品量推断.

**Type:** Learn
**Languages:** Python (stdlib, toy prefix-cache-aware router simulator)
**Prerequisites:** Phase 17 · 04 (vLLM Serving), Phase 17 · 06 (SGLang RadixAttention)
**Time:** ~60 minutes

## 学习目标
- 解释为什么圆负载平衡会破坏缓存式推断,并量化TTFT 惩罚――
- 画出缓存知情路由器:输入(KV缓存事件) 算法(前-hash匹配) 关键切断器(GPU使用)
- 解释了LLM的32% DR 失败驱动因素(缺失Tokenizer 文件 /量化配置),并陈述三文件 DR 检查列表──
- 区分商业跨区域产品 (Bedrock CRI、GKE多集群门口) 与KV意识的路由

## 问题
你在前面放了一个ALB,并使用圆. 在生产中预写缓存击中率降至8%──TTFT P50增加到三倍──你的VLLM日志显示每个请求都在支付完整的预填 成本──

圆对无状态服务是最优质的. 根据设计是有状态的:KV缓存编码了模型已经看到的一切.

另外,你的团队有一个DR计划. 你把模型权重备份到S3跨区域.区域故障发生. 你尝试过失;复制拒绝启动.

多区域的LLM服务是缓存问题 路由问题和DR卫生问题,不是负载平衡问题.

## 概念
### 缓存知性路由

请带着快速到达.路由器对预सर्ग做哈希 (例如前512代币);它询问每个复制:你有这个预सर्ग的缓存吗?.

**vLLM Router**产量: 订阅 `kv.cache.block_added`事件,维护前-hash →复制索引,使用O(1) 搜索路由──没有匹配时回落到最小队列深度──

**llm-d router**通过ControlPlane API发布事件.

**SGLang RadixAttention**转换到其他版本,

### 数字

标记提示 上的TTFT P50,Llama 3.3 70B FP8,H100:
- 缓存击中:~80 ms──
- 缓存错误: ~ 800 ms。

如果你的路由器在复制中达到60至80%的预写缓存命中,你就在N-复制容量下接近单次复制性能.如果它只有10%,你就接近天真规模.

### 跨地区有一个新约:网络延迟

区域间RTT:
- 东部-1 西部-2: ~65 ms──
- 美国东部-1 欧西部-1: ~75 ms──
- 东北-1 南东-1: ~220 ms──

如果路由 将请求从美国东-1 送到AP东南-1 的热先,节省的预填(800 → 80 ms) 将被 440 ms回路旅行抵消.`prefill_time + network_latency`答案通常是保持区域路由,除非是预填占主导的巨大的多MB预写.

### 商业"跨地区推断" 在这里帮不上忙

在容量压力期间,AWS Bedrock跨区域推理会自动把请求路由到其他地区. 它优化可用性,不优化TTFT,并且把推理当作黑盒子.

它们处理了东部-1的情况.

### 卫生:32% 缺失文件问题

据2026年统计:32%的LLM DR失败,因为团队备份了体重,却忘了:

- `tokenizer.json`或`tokenizer.model`
- 定量化配置`quantize_config.json`、AWQ尺度、GPTQ零点)
- 模型特定配置 ((RoPE扩展,注意力面具,聊天模板)
- 发动机配置`vllm_config.yaml`、采样默认的设置、LoRA适配器表现)

修复方式是三文件最小DR宣言:

1. 文件的重量+配置+标记器)
2. 引擎特定服务配置
3. 部署说明 ((K8s YAML、Dockerfile、依赖锁) ⋅

另外:每季度运行一次DR演习. 摩根大通东部-1演习在2024年11月达到22分钟恢复,只是因为游戏手册已经练习过.

### 数据居住是正交问题

欧盟客户PHI 不能离开欧盟. 如果您的缓存知性路由器 为了匹配预写,把巴黎发起的请求发送到东美-1,那么无论TTFT 收益如何,你都已经违反了GDPR.

### 你应该记住的数字

- 缓存击中与错过TTFT差距:~10x(2K提示 上80ms对800ms) ⋅
- 区域间RTT 美国-欧盟:~75 ms──
-  DR 失败:32% 缺失Tokenizer/量子配置──
- 美国东方-1 失败 2024 年 11 月 22 分钟


```figure
cache-aware-router
```

## 使用它
`code/main.py`在多区域工作负载上模拟三种路由策略(轮,缓存知情的区域,缓存知情的全球) 报告缓存击中率,TTFT P50/P99 和跨区域法案──

## 交付它
本课产出发 `outputs/skill-multi-region-router.md`△给定地区,居住限制和SLA,设计路线计划.

## 练习
1. 运行`code/main.py`在75ms的RTT下,即时路线长度到什么时候跨地区路线会胜过只有本地路线?
2. 您的缓存击中率从70%降至12%――诊断三个可能原因,以及确认每个原因的可观察性因素――
3. 为一个在vLLM中服务的,带 5 个LoRA适配器的 70B AWQ-量化模型设计 DR 宣言――列出每个文件和配置――
4. 论证Bedrock跨地区推断对有严格的TTFT SLO的金融技术是否足够;;引用具体行为
5. 一个巴黎发起的请求与美国东部1中文前相匹配.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Cache-aware routing | "smart LB" | 基于 prefix-hash match，把请求路由到持有 KV-cache 的 replica |
| KV-cache events | "cache pub-sub" | Replicas 发布 block add/evict；router 建索引 |
| Prefix hash | "cache key" | 前 N tokens 的 hash，用作 router lookup |
| GORGO | "cross-region routing research" | arXiv 2602.11688；把 network latency 作为显式项 |
| Cross-region inference | "Bedrock CRI" | AWS 产品；availability failover，不感知 TTFT |
| DR manifest | "the backup list" | 恢复所需的每个文件，不只是 weights |
| Data residency | "GDPR boundary" | 关于哪个 region 可以看到 user data 的法律约束 |
| RTT | "round-trip time" | Network latency；75 ms US-EU，220 ms US-APAC |
| LLM-aware LB | "cache-hit LB" | 作为产品类别的 cache-aware router |

## 延伸阅读
- [BentoML — Multi-cloud and cross-region inference](https://bentoml.com/llm/infrastructure-and-operations/multi-cloud-and-cross-region-inference)
- [arXiv — GORGO (2602.11688)](https://arxiv.org/html/2602.11688v1)带网络延迟 项的跨区域 KV缓存重复使用
- [TianPan — Multi-Region LLM Serving Cache Locality](https://tianpan.co/blog/2026-04-17-multi-region-llm-serving-data-residency-routing)
- [AWS Bedrock Cross-Region Inference](https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference.html)可用性故障转移文件──
- [vLLM Production Stack Router](https://github.com/vllm-project/production-stack)缓存知性路由器源――
