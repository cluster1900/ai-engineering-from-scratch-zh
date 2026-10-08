#  LLM 的终点业务  单位经济性与多租户归因

> 传统的FinOps在 LLM 支出上会失效.成本是代币交易,而不是资源在线时长.标签无法映射,一个API呼叫是交易,不是资产.工程决策.`user_id`)用于座位定价和扩展,每任务`task_id`其他`route`)用于产品表面成本和优先级,`tenant_id`按租户设置率限度:预期峰值的2-3倍,清晰的429+复试后);每天花费 cap 根据合同上限的1.5-3倍;触发率 收紧 + 警报);当花费 z-score > 4 时启动杀死开关 (自动暂停 + 页面开关) ◎归因模式:标签和集成;远程测量连接标签-查询;准确性最高) ◎样本和抽取不是基于模型的流媒体时间分配;事件-实源的单位; ◎指标: 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签

**类型：**学习
**语言：**玩具成本归类模拟器)
**先修：**阶段17 · 13 查,阶段17 · 14 存储
**时间：**约60分钟

## 学习目标

- 解释为什么传统的FinOps (标签+层) 在LLM 支出上会失效,并说出三个新的归因维度.
- 枚举四个代币层 (即时,工具,记忆,响应),并说明为什么单桶的发票会隐藏成本.
- 为多租户 产品设计执行梯度(利率 →支出 cap →杀死开关)
- 选择单位指标(每个解决的查询/文物成本),而不是$/M代币──

## 问题

你的账单显示4万美元.
- 哪个租户把钱丢掉了?
- 哪些产品特征推动了这笔支出?
- 是否有个别用户在滥用.
- 祸首是快速的膨胀,工具的呼叫,还是记忆放大.

提供商侧的标签和集对云资源的标签 (EC2、S3) 有效,因为标签将传播到线条项.LLM API 调用将不会自动带标签,你必须在调用站点上打上用户/任务/租户,并一路传递.

## 概念

### 三个归因维度

**Per-user**(`user_id`):谁产生了多少成本――驱动座位定价――扩张对话,并识别电源用户――

**Per-task**(`task_id`其他`route`):哪个产品表面产生了多少成本?

**Per-tenant**(`tenant_id`):哪个客户是利的――驱动单位经济性――续订价格――水平门――

从第一天起就在电话站上埋葬了这三个维度.

### 四个标志层

| Layer | Example | Typical % of total |
|-------|---------|---------------------|
| Prompt | system + user input | 40-60% |
| Tool | tool-call results fed back | 20-40%（agent workloads） |
| Memory | prior conversation / retrieved docs | 10-30% |
| Response | model output | 10-30% |

把四层全部放进一个桶里,让优化失明.

### 执行阶梯

1. **Rate limit**按租户设置.预期峰值的2-3倍.`Retry-After`租户会感受到阻碍;不会出现意外账单.

2. **Daily spend cap**按租户设置――合同上限的1.5-3x――触发:收紧率限制+警报客户成功――

3. **Kill switch**基于租户基线的支出z分数 > 4──自动暂停租户;在电话上页面;升级给运营 + CS──

### 归因模式

- **Tag-and-aggregate**打转字幕;稍后聚聚合――简单;粗略――
- **Telemetry joiner**通过追踪身份证 把追踪 连接到账单――准确性最高――成熟团队会这样做――
- **Sampling + extrapolation**实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际上, 实际
- **Model-based allocation**适用于没有标签的遗产数据.
- **Event-sourced**作为流量 (Kafka/Kinesis) 中的事件──实时──
- **Real-time streaming**现在,我们在做什么?

### 每个X的成本是单位指标

标签: $/M 标签:

- 每个已解决的工业成本.
- 每篇文章的成本.
- 每个成功代理任务的成本.
- 每个用户会话分钟成本.

转换成本,将其绑定到产品结果.

### 成本归因 结构

```
trace_id: abc123
  user_id: u_42
  tenant_id: t_7
  task_id: task_classify_doc
  route: model_haiku
  layers:
    prompt_tokens: 1800
    tool_tokens: 600
    memory_tokens: 400
    response_tokens: 150
  cost_usd: 0.0135
  cached_input: true
  batch: false
```

每次通话都发射,存储到数据湖中,按维度聚合,

### 复合节省

堆积:缓存+批量+路线+门口──四个都用上时:
- 缓存 L2(阶段17 · 14):输入 约便宜 10x。
- 批次17期15期:50%折扣
- 路线到便宜模式17期16期:成本降低60%
- 网关效率17期:冗余性+重试――

最佳的架情况:大约为原始的5-10%──大多数团队启动了2-3个杆;很少把四个全部架起来──

### 你应该记住的数字

- 归因维度:每用户,每任务,每租户.
- 标志层:即时,工具,记忆,响应.
- 关闭开关:花费z分数> 4 ⋅
- 单位指标:每个解决查询的成本,而不是$/M代币──
- 堆积优化:有可能达到基线的约5-10%.


```figure
i4-spend-ladder
```

## 使用它

`code/main.py`模拟一个多租户的LLM服务,带三层执法梯子.

## 交付它

本课会生成`outputs/skill-finops-plan.md`△给定产品和规模,设计归因方案和执行梯度.

## 练习

1. 运行`code/main.py`杀号开关在什么z-score 触发?你怎么选择值?
2. 设计一个每租户的成本仪表板. 你会先构建哪个5个视图?
3. 你最大的租户是单位经济负面的.
4. 为支持产品 计算每张解决的门票的成本:3M代币/门票,约800门票/天,GPT-5缓存率――
5. 论证反动标签是否可能有效.

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Per-user attribution | “user-level cost” | 每次 call 都打上 `user_id` |
| Per-task attribution | “feature cost” | `task_id` + `route` 识别 product surface |
| Per-tenant attribution | “customer cost” | `tenant_id`；驱动单位经济性 |
| Four token layers | “cost layers” | prompt + tool + memory + response |
| Rate limit | “429 guard” | 在 gateway 强制执行的 per-tenant ceiling |
| Daily spend cap | “daily ceiling” | Tenant-scoped budget，带 alert |
| Kill switch | “auto-pause” | Spend z-score > 4 触发 auto-suspension |
| Cost per resolved | “product unit metric” | 成本绑定到产品结果，而不是 Token |
| Telemetry joiner | “trace-to-billing” | 准确性最高的归因模式 |
| Stacked optimization | “cache+batch+route+gateway” | 复合节省到约 5-10% baseline |

## 延伸阅读

- [FinOps Foundation — AI FinOps Overview](https://www.finops.org/wg/finops-for-ai-overview/)
- [FinOps School — Cost per Unit 2026 Guide](https://finopsschool.com/blog/cost-per-unit/)
- [Digital Applied — LLM Agent Cost Attribution 2026](https://www.digitalapplied.com/blog/llm-agent-cost-attribution-guide-production-2026)
- [PointFive — Azure OpenAI 中的 Managed LLMs](https://www.pointfive.co/blog/finops-for-ai-economics-of-managed-llms-in-azure-open-ai)
