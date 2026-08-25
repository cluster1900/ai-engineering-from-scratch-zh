# AI SRE — Multi-Agent 事件响应、Runbooks、预测性检测

> AI SRE 通过 RAG 使用基于基础设施数据（日志、runbooks、服务拓扑）的 LLMs，来自动化调查、文档记录和协调阶段。2026 年的架构模式是 multi-agent orchestration — 专门化 agents（日志、指标、runbooks）由 supervisor 协调；AI 提出假设和查询，人类批准需要判断的决策。Datadog Bits AI 和 Azure SRE Agent 将其作为托管产品提供。Runbooks 正在演进：NeuBird Hawkeye 使用 adversarial evaluation（两个模型分析同一个 incident；一致 = 置信，不一致 = 不确定）；operational memory 会在团队变动后持续保留。Auto-remediation 仍保持谨慎：AI 提建议，人类批准。完全 autonomous action 范围很窄（restart pod、rollback specific deploy），并配有严格 guardrails — 任何兜售“set it and forget it”的人都在过度承诺。新兴前沿：pre-incident prediction。MIT 研究报告称，一个基于历史日志 + GPU 温度 + API 错误模式训练的 LLM 提前 10-15 分钟预测了 89% 的 outages。预测：到 2026 年底，95% 的企业 LLMs 具备 automated failover。

**Type:** Learn
**Languages:** Python (stdlib, toy multi-agent incident triage simulator)
**Prerequisites:** Phase 17 · 13 (Observability), Phase 17 · 24 (Chaos Engineering)
**Time:** ~60 minutes

## 学习目标
- 画出 multi-agent AI SRE 架构图：supervisor + specialized agents（日志、指标、runbooks）+ human approval gate。
- 解释为什么 auto-remediation 的范围很窄（restart pod、revert deploy），而不是很宽（re-architect service）。
- 说出 adversarial evaluation 模式（NeuBird Hawkeye）：两个模型一致 = 置信；不一致 = escalate。
- 引用 MIT 89% early-detection 结果，以及 operational constraint：没有 actuation 的预测只是 dashboards。

## 问题
一名 on-call engineer 在凌晨 3 点收到告警：“checkout 中的 error rate 很高。”他们检查 Datadog、Loki、三个 runbooks、deploy log。30 分钟后，他们意识到 root cause 是 KV cache spike 导致的 vLLM OOM。他们 restart pod；错误消失。

到 2026 年，这类调查的前 20 分钟可以自动化。按服务聚合日志、关联最近 deploy、匹配 runbooks — 这些都是 RAG + tool-use。一个受监督的 agent 可以完成 first-pass triage，并在人工打开 Datadog 之前给出一个 hypothesis。

完全 autonomous remediation 是另一个问题。Restart pod：安全。Scale GPU pool：如果 policy 允许则安全。Re-architect the service：绝对不行。关键原则是划清这条狭窄边界。

## 概念
### Multi-agent architecture

```
          Incident
             │
             ▼
        Supervisor
        /    |    \
       ▼     ▼     ▼
  Log agent  Metric agent  Runbook agent
       │     │     │
       └─────┴─────┘
             │
             ▼
        Hypothesis + evidence
             │
             ▼
        Human approval
             │
             ▼
        Action (narrow set)
```

Supervisor 将 incident 拆分为 sub-queries。Specialized agents 拥有 tool access（log search、PromQL、doc retrieval）。Supervisor 进行综合，将 hypothesis + evidence 呈现给人类。人类批准或重新引导。

### Auto-remediation scope

**Safe (narrow)**：restart pod、revert specific deploy、在预先批准的边界内 scale pool、启用预先批准的 feature flag。

**Not safe (broad)**：更改 service topology、修改 resource limits、deploy new code、更改 IAM、修改 databases。

任何兜售“set it and forget it”的人都在过度承诺。随着 AI SRE 成熟，安全集合会扩大，但边界是真实存在的。

### 对抗性评估（NeuBird Hawkeye）

两个模型独立分析同一个 incident。如果它们对 root cause 达成一致，置信度较高。如果它们不一致，则带着两个可见 hypotheses escalate 给人类。简单的模式，却是过滤 hallucinated root causes 的有效机制。

### Operational memory

团队人员流动是传统 SRE 的隐形杀手 — tribal knowledge 会流失。AI SRE 将 runbooks + post-mortems 存入 vector DB；agents 会在每个新 incident 中检索。当新工程师加入时，AI 拥有完整历史。

### Pre-incident prediction

MIT 2025 研究：在 test set 上，基于历史日志、GPU 温度、API 错误模式训练的 LLM，在 outages 发生前 10-15 分钟预测到了其中 89%。

现实检查：没有 actuation 的预测只是 dashboards。operational question 是：“当我们预测到时，要做什么？”Pre-emptive drain？Pager？Auto-scale？答案取决于具体 policy。

### Products in 2026

- **Datadog Bits AI** — Datadog 内部的托管 SRE copilot。
- **Azure SRE Agent** — Azure-native。
- **NeuBird Hawkeye** — adversarial eval + operational memory。
- **PagerDuty AIOps** — triage + deduplication。
- **Incident.io Autopilot** — incident commander + coordination。

### Runbooks as code

Runbooks 从 Confluence 页面演进为带有结构化章节（symptom、hypothesis、verify、act）的版本化 markdown。结构化 runbooks 能提供更好的 RAG retrieval。启动任何 AI-SRE rollout 时，都应先把非结构化 runbooks 转成结构化格式。

### Numbers you should remember

- MIT early-detection：89% 的 outages，10-15 分钟 lead time。
- Multi-agent triage：supervisor +（日志、指标、runbooks）+ human。
- Safe auto-remediation set：restart pod、revert deploy、在边界内 scale。
- Adversarial eval：两个模型独立；agreement = confidence。

```figure
i4-incident-agents
```

## 使用它
`code/main.py` 模拟 multi-agent triage：log agent 找到错误，metric agent 找到 CPU spike，runbook agent 匹配到已知问题。Supervisor 对 hypotheses 排序。

## 交付它
本课会生成 `outputs/skill-ai-sre-plan.md`。基于当前 on-call、incident volume、team maturity，设计一个 AI SRE rollout。

## 练习
1. 运行 `code/main.py`。如果 log 和 metric agents 不一致会怎样？supervisor 如何解决？
2. 为你的服务定义三个“safe”auto-remediation actions。逐一说明理由。
3. 编写一个结构化 runbook template：sections、required fields、verification commands。
4. Predictive detection 提前 12 分钟触发。你的 policy 是什么 — pager、pre-drain，还是两者都有？
5. 论证一个 3 人团队应该在 2026 年采用 AI SRE，还是等待。考虑 maturity、volume、risk。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| AI SRE | “agent for on-call” | LLM-backed incident investigation + coordination |
| Supervisor agent | “the orchestrator” | 将 incidents 拆分为 sub-queries 的顶层 agent |
| Specialized agent | “domain agent” | 拥有 tool access（日志、指标、runbooks）的 sub-agent |
| Auto-remediation | “AI fixes it” | 狭窄的预先批准 action；不是宽泛的 re-architecture |
| Operational memory | “vector runbooks” | vector DB 中用于 RAG 的 post-mortems + runbooks |
| Adversarial eval | “two-model check” | 独立分析；agreement = confidence |
| NeuBird Hawkeye | “the adversarial one” | 具备 adversarial-eval + memory pattern 的产品 |
| Bits AI | “Datadog's SRE agent” | Datadog 托管的 AI SRE |
| Pre-incident prediction | “early detection” | outage prediction 的 10-15 分钟 lead time |

## 延伸阅读
- [incident.io — AI SRE Complete Guide 2026](https://incident.io/blog/what-is-ai-sre-complete-guide-2026)
- [InfoQ — Human-Centred AI for SRE](https://www.infoq.com/news/2026/01/opsworker-ai-sre/)
- [DZone — AI in SRE 2026](https://dzone.com/articles/ai-in-sre-whats-actually-coming-in-2026)
- [Datadog Bits AI](https://www.datadoghq.com/product/bits-ai/)
- [NeuBird Hawkeye](https://www.neubird.ai/)
- [awesome-ai-sre](https://github.com/agamm/awesome-ai-sre)
