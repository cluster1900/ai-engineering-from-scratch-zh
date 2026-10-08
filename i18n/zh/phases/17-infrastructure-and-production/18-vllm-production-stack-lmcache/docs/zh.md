# 使用 LMCache KV 卸载的vLLM 生产堆

> 根据vLLM的生产堆是库伯内特部署,把路由器、引擎和可观察性 连接在一起.LMCache 是KV卸载层,它将KV缓存从GPU内存中抽取出来,并在查询和引擎之间复用.

**Type:** Learn
**Languages:** Python (stdlib, toy KV-spill simulator)
**前置要求：**工作阶段17 · 04 (vLLM服务内部),17 · 06 (SGLang/RadixAttention)
**Time:** ~60 minutes

## 学习目标
- 画出vLLM生产堆各层:路由器,发动机,KV脱载,可观察性.
- 解释KV脱载连接器API(v0.9.0+),以及0.11.0异步路径 如何隐藏脱载延迟──
- 量化LMCache CPU-DRAM何时有帮助(KV > HBM),以及何时只增加上费用(KV小到足以放入HBM) ⋅
- 根据部署限制,在本土的VLLM CPU卸载和LMCache连接器之间做选择.

## 问题
你的vLLM服务在同步上升时显示GPUHBM达到100%,并出现预先事件──请求被驱逐、排队,然后与一个2K标记提示在一分钟内被重新填写四次──GPU计算被花在重复的预填上;产量远低于原始产量──

增加更多的GPU成本是线性的. 增加更多的HBM不可能. 但CPU DRAM 很便宜,一个插座就有512GB,延迟比HBM 差于几个数量级,但对临时保温的KV缓存来说足够.

让预先请求快速恢复,并让引擎之间的重复预先设 共享缓存,而不需要每个引擎都重新填充.

## 概念
### 机生产堆

`github.com/vllm-project/production-stack`参考库伯内特斯部署:

- **Router**预测意识 (Cache-aware) 期17 · 11)──消费KV事件──
- **Engines**VLLM工作者──每个GPU一个,或每个TP/PP组一个──
- **KV cache offload** LMCache部署或本地连接器──
- **Observability**普罗梅蒂乌斯,Grafana仪表板,OTel的痕迹.
- **Control plane**服务发现,配置,滚动更新.

以 头盔图 + 运营商 形式交付。

### 电动电源脱载连接器API (v0.9.0+)

 vLLM 0.9.0 引入了连接器API,用于可插入的KV缓存后台. 你的引擎将把块卸载到连接器;连接器存储它们.

LM 0.11.0(2026年1月) 增加了异步卸载路径:在常见情况下,卸载可能发生在后台,因此引擎不会被阻.端到端延迟和吞吐量仍然取决于工作负载的形状,KV缓存击率和系统压力.

### 原产CPU脱载对 LMCache

**Native vLLM CPU offload**实现快,零网络跳转――不能跨引擎――

**LMCache connector**任何引擎都可以访问区块──已有16倍H100基准发布──

当单个引擎有HBM压力时选择本土的――当多个引擎 共享预写时选择LMCache(带共同的系统提示的RAG、带共享模板的多租户) ――

### 基准行为

分布在 4 台 A3-高gpu-4g 上的 16x H100(80 GB HBM)测试:

- 低KV足迹 ((短提示,低同步):所有配置都与基线相等,LMCache 增加约3-5%的总费用──
- 缓慢的脚印:LMCache 开始在引擎之间 重复使用上带来帮助.
- 电动量超过HBM:原产 CPU 卸载和LMCache都会显著提高吞吐量;LMCache 增益更大,因为有跨引擎共享.

### 当LMCache是决定性的时

- 多个租户共享系统提示的多租户服务──
- 在查询中重复的RAG──
- 同一基上的细节调整的变体 (LoRA),其中基型KV重复使用会减少重复工作.
- 预先重量工作负载:从CPU恢复比重新预填更便宜.

### 什么时候 NOT 启用

- ,你会付出费用,但没有收益.
- 短文本 ((<1K代币):转移时间 > 重新预填──
- 单租户单次工作量:没有可捕获的重复使用.

### 集成与分类分类服务

17 阶段 · 17 分类服务 + LMCache 会叠加增益:从预填池到解码池的 KV 转移 如果未使用,将落入 LMCache;后续查询 会从 LMCache 拉取.

### 你应该记住的数字

- 连接器API 发布
- 无机机载荷路径;端到端延迟影响 取决于工作负载、KV撞速和系统压力(不是绝对保证)
- 时KV足迹超过HBM时,LMCache有帮助.
- 小HBM压力:有3-5%的上层费用,且没有收益.


```figure
zero-sharding
```

## 使用它
`code/main.py`报告避免重新填充,输出增长和破解HBM使用.

## 交付它
本课会产出 `outputs/skill-vllm-stack-decider.md`△给定工作负载形状和vLLM部署,判断选择本地,LMCache,还是两者都不选――

## 练习
1. 运行`code/main.py`◎ 如何开始设计?
2. 某个租户每小时 200 个查询 共享一个 6K标记系统提示――计算每个租户预期的LMCache节省――
3. 对于 LMCache 服务器来说,这是一个失败点.
4. 对于70B FP8 下4K标记KV(500MB),阅读时间相比重装如何?
5. 论证 vLLM 0.11.0异步路径 是否免费:overhead 藏在哪里?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Production-stack | “参考部署” | vLLM 的 Kubernetes Helm chart + operator |
| Connector API | “KV backend interface” | vLLM 0.9.0+ 的 pluggable KV store interface |
| Native CPU offload | “engine-local spill” | 把 KV 存到同一 engine 的 host RAM 中 |
| LMCache | “cluster KV cache” | CPU DRAM + disk 上的 cross-engine KV cache server |
| 0.11.0 async | “non-blocking offload” | 隐藏在 engine stream 后面的 offload |
| Preemption | “evict to make room” | HBM 满时的 KV cache shuffle |
| Prefix reuse | “same system prompt” | 多个 queries 共享开头；cache hit |
| Ceph tier | “disk tier” | cache hierarchy 中 DRAM 下方的 durable storage |

## 延伸阅读
- [vLLM Blog — KV Offloading Connector (Jan 2026)](https://blog.vllm.ai/2026/01/08/kv-offloading-connector.html)
- [vLLM Production Stack GitHub](https://github.com/vllm-project/production-stack) 头盔图 +操作员――
- [LMCache for Enterprise-Scale LLM Inference (arXiv:2510.09665)](https://arxiv.org/html/2510.09665v2)
- [LMCache GitHub](https://github.com/LMCache/LMCache)连接器的实现――
- [vLLM 0.11.0 release notes](https://github.com/vllm-project/vllm/releases)异步路径详细信息──
