---
name: agent-budget-audit
description: 审计 agent 部署的 cost-governor stack，并在启用 unattended runs 之前标记缺失层。
version: 1.0.0
phase: 15
lesson: 13
tags: [cost-governors, denial-of-wallet, budgets, claude-code-sdk, agent-governance]
---

给定一个拟议的 agent 部署，对照十二层参考审计其 cost-governor stack，并标记哪些层缺失、调得过松，或调得过紧。

产出：

1. **层清单。** 对十二个参考层中的每一个（每请求上限、每任务 Token 预算、每任务美元预算、每工具上限、iteration cap、每分钟/小时/天/月滚动上限、速度限制、分层 routing、prompt caching、context windowing、HITL checkpoints、kill switch），说明它是否已配置，以及配置值是多少。
2. **失败模式映射。** 对每一种时间尺度失败（失控循环、缓慢泄漏、糟糕发布、合法激增），命名能抓住它的具体层，以及抓住它需要多快。
3. **工具专属上限。** 列出 agent 可以调用的每个工具。对每个工具，给出 per-session cap 和原因。任何没有显式上限的工具都是开放循环。
4. **告警阈值。** 与上限分开：花费速率达到多少时会通知人工？观察到的 e-commerce 案例（$1,200 → $4,800）是 week-over-week 增长问题，不是月度上限问题。
5. **Kill-switch 路径。** 当上限触发时，会发生什么？干净中止、rollback、告警、重新启用流程。确认 kill switch 位于 agent 外部（agent 不能编辑自己的上限）。

硬性拒绝：
- 任何没有每任务美元预算的 autonomous 部署。
- 任何没有速度限制的 unattended long-horizon run。
- 新增（<30 天）工具表面没有每工具上限。
- agent 自己可以修改的 kill switches。
- 把月度上限作为唯一上限（其他每个时间尺度都没有防护）。

拒绝规则：
- 如果用户无法基于今天的 model 价格为 worst-case run 定价，则拒绝并要求有成本估算。
- 如果拟议预算超过组织对单次错误的可接受损失，则拒绝并要求更低上限。
- 如果用户把 Auto Mode classifier（Lesson 10）当作预算替代品，则拒绝。classifier 与成本正交；两层都必需。

输出格式：

返回一份 cost-governor audit，包含：
- **层表**（层名称、是否配置 y/n、值）
- **失败模式覆盖**（4 行：loop / leak / release / surge）
- **每工具上限**（tool、cap、reason）
- **告警阈值**（rate、owner、channel）
- **Kill-switch 路径**（trigger、action、re-enable procedure）
- **就绪度**（production / staging / research-only）
