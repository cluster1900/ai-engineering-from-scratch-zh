#            

> 提供商锁定 代价高昂――不同的工具调用 工作负载适合不同模型――路由网关 提供统一的API 表面、重试、失败、成本跟踪和护──2026年有三种主流形态:LiteLLM(开源、自托管)、OpenRouter(托管SaaS)、Portkey(生产级,2026年3月开源)──本课会说明决策标准,并演示了一个难以实现的路由网关──

**Type:** Learn
**Languages:** Python (stdlib, routing + failover + cost tracker)
**Prerequisites:** Phase 13 · 02 (function calling), Phase 13 · 17 (gateways)
**Time:** ~45 分钟

## 学习目标
- 区分自托管,托管和生产级路由选项
- 实现一个倒退链,在供应商失败时按定义好的优先级顺序重试.
- 随访跨供应商的单次请求成本和代币使用量.
- 针对特定生产束,在LiteLLM、OpenRouter和Portkey之间做出选择.

## 问题
提供商路由 重要场景:

1. **成本。**对于分类任务,Haiku 足够;对于合成任务,Sonnet 值得.

2. **Failover。**任何请求都失败了. 你希望自动回归人类,而无需重新部署.

3. **延迟。**实时聊天 UI 需要快速的时间到第一代标志――批量摘要器不需要――按延迟 SLA 路由――

4. **合规。**欧盟用户必须留在欧盟区域内.

5. **实验。**在同一工作负载上对两个模型做A/B──按测试桶路由──

为每个集成手写这些逻辑很重复――路由网关提供一个与OpenAI兼容的API,并处理其余部分――

## 概念
### 形态与OpenAI兼容的代理

所有人都使用OpenAI形式.`/v1/chat/completions`接受OpenAI计划,并内部代理到人类 / 双子座 / 协同 / 奥拉马 / 任何后端.

### 模型姓名

你的代码不写`claude-3-5-sonnet-20251022`写作`our_smart_model`盖特韦将名映射到真实模型. 当人类发布Claude 4时,你在服务端修改名.你的代码无需改变任何东西.

### 背后链

```
primary: openai/gpt-4o
on 5xx: anthropic/claude-3-5-sonnet
on 5xx: google/gemini-1.5-pro
on 5xx: refuse
```

通过设置中定义这些. 重试计入预算,避免跌倒.

### 语义缓存

相似或近似的相同提示,而不是访问提供者──重复代理循环 上的节省可达30%至60%──重点基于嵌入式;近似的相同提示共享一个缓存槽位──

### 防护

网关级:

- **PII redaction.**在发送快速前执行 Regex 或基于 ML 的处理.
- **Policy violations.**拒绝包含禁止内容的提示.
- **Output filters.**清理完成 中的泄漏内容

港口和港口都内置有明确的取向护.

### 每个关键利率限制

一个API关键 = 一个团队――每一个关键预算――防止一个团队消耗共享配额――大多数网关都支持这一点――

### 自主托管与管理的取舍

| Factor | LiteLLM (self-hosted) | OpenRouter (managed) | Portkey (production) |
|--------|----------------------|----------------------|----------------------|
| Code | 开源，Python | 托管 SaaS | 开源（2026 年 3 月）+ 托管 |
| Setup | 部署一个 proxy | 注册 | 二者均可 |
| Providers | 100+ | 300+ | 100+ |
| Billing | 你自己的 key | OpenRouter credits | 你自己的 key |
| Observability | OpenTelemetry | Dashboard | 完整 OTel + PII redaction |
| Best for | 想要完全控制的团队 | 快速原型开发 | 有合规需求的生产环境 |

当你有SRE团队并希望拥有数据主权时,LiteLLM 胜出. 当你想要单单订阅并且不想维护基础设施时,OpenRouter 胜出. 当你需要开箱即时使用的护和合规能力时,Portkey 胜出.

### 成本追踪

每个请求都带着`provider`,我知道.`model`,我知道.`input_tokens`,我知道.`output_tokens`△乘以模型按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按币的价格按比

### 转换方式

门户可以同时路由LLM调用和MCP样本请求. 当采样请求的模型. 偏好某个特定模型时,门户 会转换到正确后端.

### 路由策略

- **Static priority.**列表中的第一个;出错时倒退――
- **Load balancing.**圆或加权──
- **Cost-aware.**选择满足延迟 / 质量要求的最低成本模型――
- **Latency-aware.**选择过去的N 分钟内最快的模型――
- **Task-aware.**快速分类器将编码 路由到一个模型,将总结 路由到另一个模型.


```figure
tp-router-failover
```

## 使用它
`code/main.py`用约150 行实现一个路由门户:接受OpenAI形状的请求,转换到各供应商的,运行优先级倒退链,跟踪单次请求成本,并对输入应用程序的PII编辑通行.

需要关注:

- `ROUTES`按优先排序的具体供应商列表.
- 倒退循环会在5xx上重试.
- 代价跟踪器将代币使用量乘以每个模型的费用率.
- 信息信息编辑会在转发前清理形状类似SSN的模式.

## 交付它
本课会产出 `outputs/skill-routing-config-designer.md`△给定一个工作负载配置文件 (延迟、成本、合规),该技能会选择LiteLLM/OpenRouter/Portkey,并生成路由配置.

## 练习
1. 运行`code/main.py`触发停机场景;确认倒退 落到第二个供应商,并且成本归因正确.

2. 添加语义缓存:即时的 SHA256 作为搜索密钥;缓存击中立即返回──测量重复调用成本节省──

3. 添加一个快速分类器,将 `"code ..."`快速路由到偏向智能的号,将`"summarize ..."`快速路由到偏向速度的号.

4. 设计每组预算:每个团队有月度支出上限;达到上限后,门户 拒绝请求――选择一个执行细分性(每请求或窗口)

5. 并排阅LiteLLM、OpenRouter 和 Portkey 文档──指出每个产品提供而另外两个没有一个功能──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Routing gateway | "LLM proxy" | 位于多个 provider 前方的统一 API 表面层 |
| OpenAI-compatible | "Speaks the OpenAI schema" | 接受 `/v1/chat/completions` shape，并转换到任意 backend |
| Model alias | "our_smart_model" | 你代码中的名称，由 gateway 映射到具体模型 |
| Fallback chain | "Retry list" | 失败时按顺序尝试的 provider 列表 |
| Semantic caching | "Prompt-embedding cache" | Key 是 prompt 的 Embedding；近似重复内容共享一次 cache hit |
| Guardrails | "Input/output filters" | 脱敏 PII，拒绝 policy violations |
| Per-key rate limit | "Team budget" | 作用域限定到 API key 的 quota |
| Cost tracking | "Per-request spend" | 聚合 Token 使用量 x 每个模型的价格 |
| LiteLLM | "The open proxy" | 可自托管的 OSS routing gateway |
| OpenRouter | "The managed SaaS" | 基于 credit 计费的托管 gateway |
| Portkey | "The production option" | 开源 + 托管，内置 guardrails |

## 延伸阅读
- [LiteLLM — docs](https://docs.litellm.ai/)自托管路由门户
- [OpenRouter — quickstart](https://openrouter.ai/docs/quickstart) 托管路由SaaS
- [Portkey — docs](https://portkey.ai/docs) 带有护的生产级路由
- [TrueFoundry — LiteLLM vs OpenRouter](https://www.truefoundry.com/blog/litellm-vs-openrouter) 决策指南
- [Relayplane — LLM gateway comparison 2026](https://relayplane.com/blog/llm-gateway-comparison-2026)供应商调研
