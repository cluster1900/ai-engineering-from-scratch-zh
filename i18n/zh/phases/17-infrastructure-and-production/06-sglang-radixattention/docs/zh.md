# 面向前-重工负载 的SGLang 与Radix注意

> 根据FCFS的初次服务,vLLM 调度请求,而SGLang的缓存意识调度程序将优先处理更长的共享预先的请求,本质上是深度第一的半径穿越,让热分支保持在HBM 中. 在Llama 3.1 8B 配合GPT类似1K提示的场地下,SGLang 达到约 16,200个托克/s,而vLLM 约 12,500个优势为 29%. 在这个预先重的RAG 工作负载上,这一优势可达 6.4x──在语音克隆式的高端下,高达 86% 的高端下载率超过了 20 个月.

**Type:** Learn
**Languages:** Python (stdlib, toy radix-tree cache + cache-aware scheduler)
**前置要求：**阶段17 · 04 (vLLM服务内部),阶段14 (Agentic RAG)
**Time:** ~75 minutes

## 学习目标
- 画出Radix注意:前 如何存储在基因树中,以及KV块 如何在根植于同一分支的序列之间共享.
- 解释缓存预示的时间表以及为什么FCFS不适合前密集的流量.
- 给定预先设置缓存击率和快速长度分布,计算某个工作负载的预期速度――
- 让6.4x这个数字出现,而不是错误收益的快速订单纪律.

## 问题
经典服务 会把每个请求的提示当作不透明.即使有5000个RAG请求都用同一个2000个Token系统提示加上同一个检索序言.开头,vLLM也会对这个2000个Token前预写5000次.

观察结论是:agentic 和 RAG工作负载中的提示 几乎总是共享长时间的预写.系统提示,工具方案,几次示例,恢复标题,对话历史,全都会在请求之间重复.

基因注意 正是这样做的──代币被索引到基因树中;每个节点 拥有从根到该节点 路径上的代币序列对应的基因块──新请求会遍历这个树:任何代币匹配的节点都会使用该节点的基因块──预填成本 变为与新的后音成正比,而不是与完整的提示成正比──

挑战在于安排. 如果两个请求共享2000代码前,而第三请求只共享200代码中相同的前,你会希望把两个长共享请求放在一起服务,让长前留在HBM中.

## 概念
### 作为KV指数的基因树

基因树 () 存符号序列──每个节点都有一个代币范围,以及为该范围计算的KV块──儿童会把序列扩展一个或多个代币──

```
root
 |- "You are a helpful assistant..."  (2,000 tokens, 124 KV blocks)
      |- "Context: <doc A>..."        (500 tokens, 31 blocks)
           |- "Question: Alice..."    (80 tokens, 5 blocks)
           |- "Question: Bob..."      (95 tokens, 6 blocks)
      |- "Context: <doc B>..."        (520 tokens, 33 blocks)
```

一个新请求带着系统提示+"文本: <doc A>"+"问题: Carol"进来──调度器遍历:系统前匹配(复用124块),doc-A分支匹配(复用31块),然后只为"问题: Carol" 分配新块[4]4块)──预填成本:4块的新代币──没有这个树:160块──预填省约 ~40x──

### 缓存预定时间

如果缓存不断转移,基于基因树的重复使用就没有意义.

1. **Depth-first dispatch**△从排列中选择下一个请求时,优先选择与当前运行集中的请求根植于同一分支.
2. **Branch level 的 LRU，而不是 block level 的 LRU**△驱逐整条枝从最短的叶子开始),而不是单独的块,这样缓存形状与基因形状匹配.

FCFS违反了这两点. 发行2000个代币的请求, 发行50个代币的请求后面,

### 你应该记住的基准数字

- 拉马 3.1 8B、H100、ShareGPT 1K提示:SGLang ~16,200个/秒,对比vLLM ~12,500(约29% 优势) ⋅
- 预写重 RAG(同样的系统 + 相同文件,变化问题):SGLang 上最高可达6.4x。
- 语音克隆工作量:86.4%的预写缓存击中率──
- 公司客户的生产率:取决于快速的纪律,为50-99%.
- 据了解,在2026年,

### 命令陷

6.4x 这个数字取决于一致的提示模板订单.`[system, tools, context, history, question]`其他要求中造成的`[system, context, tools, history, question]`树上没有找到一个共同的预सर्ग.对人类看起来像一个共同的预सर्ग.对树上,两个不同的序列.

工程师的杆:你的提示模板就是缓存键――固定顺序――把所有不可变的内容――系统、工具、方案) 放在前面――然后放回收文本――最后放用户问题――不要把动态内容交错插入前――

研究中真实案例:把动态内容 移动可缓存的前,让一次部署的缓存击率 通过一次改动从7% 提升到74%.

### 激光注意力 赢在哪里,输在哪里

获奖:
- 答案: 答案: 答案: 答案:
- 代理商 (相同的工具方案,变化查询)
- 带长系统提示的聊天.
- 具有重复序文 的语音/视觉工作负载──

输出量返回vLLM级的输出量):
- 使用独特提示的单次生成(代码完成、没有系统提示的开放式聊天)。
- 每个请求都把独特的内容交错插入前的动态提示.

### 为什么这是一个调度器问题,而不是一个核心问题

只有调度器让热分支保持居民时,再使用才会有收益. 一个简单的可用就复用策略在混合负载下让缓存转移.

### 与vLLM 的相互作用

这两个系统不是严格的竞争关系.`--enable-prefix-caching`差距缩小了,但没有完全消失,SGLang的整个堆是最先的;vLLM是接上去的.对于由先重复使用的主导工作负载,SGLang 仍然是默认选择.对于没有强大的先模式的一般用途服务,vLLM 仍然相当或更好.


```figure
roofline
```

## 使用它
`code/main.py`实现一个玩具基因树KV缓存,以及一个有两种策略的规划器:FCFS和缓存意识. 它将让同一个工作负载分开通过两种运行,报告前缓存击率和吞吐量三角形. 然后运行一个缩的订单,展示6.4x 如何崩.

## 交付它
本课会生成`outputs/skill-radix-scheduler-advisor.md`△给定一个工作负载描述,它会产生一个提示订单处方,以及是否采用SGLang的去/不去判断.

## 练习
1. 运行`code/main.py`△在同一个工作负载上比较FCFS和缓存意识.
2. 修改工作负载,让提示随机排列`[system, tools, context]`,再运行,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发动,再发出,再发出,再发出,再发出,再发出,再发出,再发出,再发出,再发出,再发出.
3. 计算在 Llama 3.1 8B 上,作为一个根分支 保持一个 2,000-Token系统提示居民的HBM成本──与没有预写的重用16序列批次成本做比较──
4. 阅读SGLang Radix注意力论文──用三句话解释为什么在前重负载下,树形LRU驱逐 优于块形LRU──
5. 某客户报告缓存击中率只有8%──说出三个可能原因,以及你会为每个原因运行的诊断──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| RadixAttention | "SGLang 那个东西" | KV cache 以 radix tree 索引，使 shared prefixes 能复用 blocks |
| Radix tree | "compact trie" | 每个 node 拥有一个 Token range 及其 KV blocks 的 tree |
| Cache-aware scheduler | "hot-branch-first" | 优先处理共享 resident branch 的请求的调度器 |
| Prefix-cache hit rate | "你的 prompt 有多少是免费的" | 从复用 KV blocks 服务的 prompt Tokens 比例 |
| FCFS | "first-come first-served" | 会破坏 prefix locality 的默认 scheduling |
| Branch-level LRU | "驱逐 leaf" | 与 radix shape 匹配的 eviction policy |
| Prompt template ordering | "cache key" | prompt 的 component order 决定 tree 能共享什么 |
| System prompt pinning | "resident prefix" | 保持 immutable system portion pinned，以避免 eviction thrash |

## 延伸阅读
- [SGLang GitHub](https://github.com/sgl-project/sglang)来源 和 博士
- [SGLang documentation](https://sgl-project.github.io/) 激素注意力和安排 细节──
- [SGLang paper — 高效编程 Large Language Models (arXiv:2312.07104)](https://arxiv.org/abs/2312.07104) 设计参考.
- [LMSYS blog — SGLang with RadixAttention](https://www.lmsys.org/blog/2024-01-17-sglang/)基准数字和规划者理性――
- [vLLM — Prefix Caching](https://docs.vllm.ai/en/latest/features/prefix_caching.html) vLLM 自己的根像实现,用于比较.
