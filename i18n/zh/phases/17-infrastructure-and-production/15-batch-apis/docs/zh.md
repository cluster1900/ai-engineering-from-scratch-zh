# 批量API  50% 折扣成为行业标准

> 每个主要供应商都提供非同步批量API,带有50%折扣和约24小时转换.OpenAI、Anthropic、Google,以及大多数推断平台都实现了相同的模式. 按批量和快速缓存叠加,夜间管道的成本将降至同步未缓存成本的约10%. 规则非常简单:如果它不是交互式,就应该放到批量.

**Type:** Learn
**Languages:** Python (stdlib, toy batch-vs-sync cost simulator)
**前置要求：**17 · 14阶段 (即时和语义缓存)
**Time:** ~45 minutes

## 学习目标
- 提供商的三种API (OpenAI、Anthropic、Google) 以及共同的50%折扣+24小时回报保证.
- 计算一夜间 分类工作负载 中叠加批量+缓存输入的成本,并与同步未缓存的基线相比――
- 将一个工作负载分为互动/半互动/批量,并说明车道的原因.
- 解释两个陷:部分互动性 (用户预期比24h更快) 和输出方案漂移 (批量文件格式因供应商而异)

## 问题
你的团队发布了一个每晚报告生成管道――50,000 文件,个别总结,集群总结,再起草执行简报――同步运行需要4小时,成本是2000美元/夜――你听说了批量API――

按时缓存所有50k通话共享) 启动了快速缓存. 后,账单降至180美元/夜的基本线的9%.

团队认为是实时,但SLA实际上是早上. 本课讲的是不要把90%的账单留在桌子上.

## 概念
### 三批次 API

**OpenAI Batch API**预约24小时回报 (通常在实践中约2-8小时)`/v1/batches`根据缓存条件的输入,也可以获得缓存输入的定价.

**Anthropic Message Batches**您可以在此查看:`cache_control`缓存写的是显而易见的,读到会在批量内自动发生.

**Google Vertex AI Batch Prediction**双色球有类似的50%折扣.

### 语义:不同步,不是慢

批量是我承诺在24小时内回报不是这会花24小时──典型的P50是2-6小时──供应商会在 GPU 库存利用不足的非高峰窗口调度你的批量──

### 与缓存叠加

通过使用相同的4K标识系统提示:

- 交时未存储:50000 × ($input × 4000 + $产量 × 200),按全额率――
- 同步缓存:系统提示 在首次写后被缓存;剩余49999次获得便宜的10倍的输入.
- 收藏:以上全部,再加上阅读和写 两者的50%折扣.

叠加效果:批量+缓存 = 约为同步未缓存账单的10%──任何一夜运行且拥有共享系统提示的工作负载都应该使用它──

### 工作负载分类

**Interactive** 用户等待响应──TTFT 很重要──使用带快速缓存的同步调用──不能批量──

**Semi-interactive** 用户提交任务,数分钟后回来查看──同步队列,并在批量不可用时倒退到同步──可以想到中等规模的RAG索引──

**Batch** 用户期待结果 早上或下一个小时──内容管道、大规模分类、离线分析──始终批量,始终叠加缓存──

常见错误:因为管道是生产,就把一切归类为互动.

### 部分互动性陷

部分功能看起来是互动的,但能容忍 5-10 分钟.例如:带有 refresh 按的每晚客户健康报告.用户点击更新;等待 10 分钟是可接受的.团队却把它做为同步.

问题是:24小时对这个用户意味着什么?

### 输出方案 陷

批量文件格式因供应商而异:

- 开放AI:JSONL,每行一个请求.
- 简单的信息:JSONL,每行一个消息;响应格式内嵌──
- 垂直:BigQuery表或带TFRecord的GCS前.

跨供应商编写 一批客户端 意思是每个供应商都需要适配码──宣传多供应商批量的门口                                                                                                                                                                                                                                            

### 你应该记住的数字

- 跨供应商的批量折扣:输入+输出 统一 50%。
- 转换SLA:保证 24 小时,典型P50 为 2-6 小时──
- 叠加批量+缓存输入:约为同步未缓存成本的10%──
- 工作负载分类规则:如果24小时延迟可接受,始终批量──


```figure
batch-lane-triage
```

## 使用它
`code/main.py`为一个50万份文件工作负载计算同步,同步+缓存,批量,批量+缓存的成本,报告以 $ 和百分比表示节省.

## 交付它
本课会产出 `outputs/skill-batch-triager.md`△给定工作负载特性,分流到互动/半/批量,并估计节省量――

## 练习
1. 运行`code/main.py`△对于一个100kdoc管道,使用3K代码系统提示和500代码输出,计算完整堆(批量+缓存) 相对于同步基线的节省――
2. 选择一个你熟悉的真实产品中的三个特征.
3. 用户抱怨他们的报告花了3小时.这是批量错误的试验,还是合法的互动?写出决定标准.
4. 你的批量API回报SLA是24h,但P99是20小时.
5. 计算破解平衡:共享前长度 达到多少时,批量+缓存 会比你自己的预留的GPU上一夜运行更便宜?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Batch API | “async discount” | 50% off，24h turnaround |
| JSONL | “batch format” | 每行一个 JSON request；OpenAI/Anthropic standard |
| Message Batches | “Anthropic batch” | Anthropic 的 batch API product name |
| Batch prediction | “Vertex batch” | Vertex AI 的 batch API product |
| Turnaround SLA | “24h promise” | 保证，不是典型值；典型是 2-6h |
| Workload triage | “interactivity decision” | Interactive / semi / batch routing decision |
| Output schema | “response format” | 每个 provider 的 JSONL layout；不可移植 |
| Stacked discount | “batch + cache” | 两者都适用时，约为 uncached sync bill 的 10% |

## 延伸阅读
- [OpenAI Batch API](https://platform.openai.com/docs/guides/batch) JSONL格式 和 `/v1/batches`语义
- [Anthropic Message Batches](https://docs.anthropic.com/en/docs/build-with-claude/batch-processing)批量格式 和 `cache_control`互动
- [Vertex AI Batch Prediction](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/batch-prediction)双子座批次 语义。
- [Finout — OpenAI vs Anthropic API Pricing 2026](https://www.finout.io/blog/openai-vs-anthropic-api-pricing-comparison)
- [Zen Van Riel — LLM API Cost Comparison 2026](https://zenvanriel.com/ai-engineer-blog/llm-api-cost-comparison-2026/)
