# 行动预算,延续 cap 和成本管理

> 某中型电子商务代理的月度LLM 成本,在团队启动"订单跟踪"技能 后,从 $1,200 跳到了 $4,800──这不是定价错误──这是一个代理 发现了新的循环,并继续在循环中花钱──微软的代理管理工具包(2026年4月2日) 针对此类问题进行了防线标准化:每次请求的`max_tokens`、每个任务的代币和美元预算、每天/月度上限、代限、分层模型路由、即时缓存、文本窗口、昂贵的操作HITL检查点、预算违规时的杀伤开关――人类的克劳德代码代理SDK用不同的名称提供相同的基础能力――财务速度限制,例如10分钟内超过50美元的断断访问,比月度上限更快抓住循环――

**Type:** Learn
**Languages:** Python (stdlib, layered cost-governor simulator)
**先修要求：**阶段15·10 (许可模式),阶段15·12 (可持续执行)
**Time:** ~60 minutes

## 问题

专业代理的每轮都会花真钱.聊天机的坏输出是一条坏回复.代理的坏循环是一张账单.行业文档中对这种失败模式的术语是"拒绝钱包":代理持续推理"",持续调用工具"",持续计费,没有什么阻止它,因为从一开始就没有设计过这种阻止机制.

修复方法不是一个数字,而是一个不同的时间尺度和粒度的限制:每次请求,每次任务,每小时,每天,每月.

这是一个工程课程:数学很简单,团队失败的地方在纪律. 下面的限制列表,来自微软代理管理工具包,来自人类克劳德代码代理SDK 文档中的名称.

## 概念

### 成本管理员

1. **每次请求的 `max_tokens`。**简单――防止任何一次调用产生无边界的完成――
2. **每个任务的 Token 预算。**整个运行过程中,必须超过N个标志.
3. **每个任务的美元预算。**与代币类似,但单位是货币.`max_budget_usd`,我知道.
4. **每个工具调用上限。**不超过N次`WebFetch`调用 时间`shell_exec`调用等等等
5. **Iteration cap (`max_turns`)。**防止无限推理循环.
6. **每分钟 / 每小时 / 每天 / 每月上限。**滚动窗口――用于抓住漏洞的不同时间尺度――
7. **财务速度限制。**例如,如果10分钟内花费超过50美元,则切断访问.
8. **分层 model routing。**默认使用更小的模型;只有当分类器判断任务值得时才升级到更大的模型――
9. **Prompt caching。**系统提示和稳定文本 存在供应商缓存中;重新发送的代币 成本接近零──
10. **Context windowing。**通过缩写/总结 把活跃的语境保持在值以下;直接降低代币 成本。
11. **昂贵操作上的 HITL checkpoints。**在已知昂贵的操作之前,需要人工确认.
12. **预算违约时的 kill switch。**任一上限触发时会议 中止――记录触发的上限;需要单独的重新启动路径――

### 为什么需要,而不是单个上限

单个月度上限仅在钱包已经空后才抓住失控代理.

- **失控循环**通过速度限制抓住.
- **缓慢泄漏**据报道,每天的每次任务都在预期工作中完成.
- **糟糕发布**通过每周 / 每月上限抓住.
- **合法激增**没有错误:由小时 / 天上限抓住,并产生清晰日志──

### 克劳德代码的预算表

克劳德代码代理 SDK 暴露了:

- `max_turns`回复盖
- `max_budget_usd` 美元上限;违约时会议 中止──
- `allowed_tools`现在,`disallowed_tools` 工具和丹尼尔
- 工具使用前的点,用于自定义成本核算.

与许可模式梯度 (课 10)结合使用.没有`max_budget_usd`的`autoMode`无政府自主化.

### 欧盟人工智能法、OWASP代理人前十

微软的代理管理工具包 覆盖OWASP代理排名第10和欧盟人工智能法第14条 (人力监督) 要求――对于欧盟的生产环境,日志记录和上限执行不是可选项――

### 观察到的$1,200 → $4,800 案例

微软文档中的真实案例:一个电子商务代理在增加新工具后,月度成本翻了三倍.该工具允许代理在每个会议中查询订单状态.没有循环检查.没有每一个工具的上限.


```figure
cost-governor-stack
```

## 使用它

`code/main.py`模拟一个有层次的成本管理堆和没有该的代理运行.模拟中的代理在几轮后漂移到轮询循环中;层次的堆将在速度窗口内抓住它,而单个月度的上限只需要几天后触发.

## 交付它

`outputs/skill-agent-budget-audit.md`审计一个拟议代理 部署的成本管理层,并标记缺失层次.

## 练习

1. 运行`code/main.py`△确认在轮回循环轨迹上,速度限制先于代 cap 触发.

2. 为浏览器代理 (?? 课 11) 设计一组每种工具的上限.

3. 阅读微软代理管理工具包 文档――列出工具包 命名的每种上限类型――把每种映射到某种失败模式(失控循环、缓慢泄漏、糟糕发布、激增) 』

4. 为一个真实任务的一夜间无人监督运行 定价 譬如,在一个 repo ) 把 50 个问题.`max_budget_usd`设为点估计的2x.说明为什么是2x.

5. 克劳德代码的`max_budget_usd`基于会议的 聚合成本触发. 设计一个你将在外部执行互补速度限制.

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| Denial of Wallet | "Runaway bill" | agent 循环产生花费，并且没有上限阻止它 |
| max_tokens | "Per-request cap" | 单个 completion 大小的上限 |
| max_turns | "Iteration cap" | 一个 session 中 agent loop 迭代次数的上限 |
| max_budget_usd | "Dollar kill switch" | session 成本上限；违约时中止 |
| Velocity limit | "Rate cap" | 短窗口内花费的限制（例如，$50 / 10 min） |
| Tiered routing | "Small model first" | 默认使用便宜 model；只有 classifier 判断值得时才升级 |
| Prompt caching | "Cached system prompt" | provider 侧 cache 将重发 Token 成本降到接近零 |
| HITL checkpoint | "Human approval gate" | 昂贵操作前需要人工确认 |

## 延伸阅读

- [Anthropic Claude Code Agent SDK — agent loop and budgets](https://code.claude.com/docs/en/agent-sdk/agent-loop) `max_turns`,我知道.`max_budget_usd`、工具允许的员工――
- [Microsoft Agent Framework — human-in-the-loop 与治理](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop)成本管理员 检查点――
- [Anthropic — Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview)供应商 侧成本控制
- [Anthropic — Prompt caching (Claude API docs)](https://platform.claude.com/docs/en/prompt-caching)缓存机器――
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy)长远代理的成本图像
