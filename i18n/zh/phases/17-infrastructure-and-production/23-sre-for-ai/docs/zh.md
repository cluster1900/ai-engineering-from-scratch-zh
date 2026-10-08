# 许多人认为,这些人是""的.

> 通过RAG,AI SRE 采用基于基础设施数据的LLM,来自动化调查,文档记录和协调阶段.2026年的架构模式是多代理配套.

**Type:** Learn
**Languages:** Python (stdlib, toy multi-agent incident triage simulator)
**Prerequisites:** Phase 17 · 13 (Observability), Phase 17 · 24 (Chaos Engineering)
**Time:** ~60 minutes

## 学习目标
- 画出多代理AI SRE架构图:监督员+专业代理人 (日志、指标、走行簿) +人体批准门──
- 解释为什么自动补救的范围很窄 (而不是很宽)
- 说出对立评估模式:两个模型一致 = 置信;不一致 = 升级.
- 引用MIT 89%早期检测结果,以及操作限制:没有动作的预测只是仪表板.

## 问题
一名电话工程师在凌晨3点收到警报:检查中错误率很高. 他们检查了数据库,Loki,三个跑本,部署记录.30分钟后,他们意识到根本原因是KV缓存升导致了VLLM OOM.

到2026年,这种类型的调查前20分钟可以自动化. 根据服务聚合日志,关联最近部署,匹配运行簿. 这些都是RAG+工具使用.

完全自主修复是另一个问题. 恢复组:安全. 规模的GPU池:如果政策允许则安全.

## 概念
### 多代理架构

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

监督员将事件分为子查询――专业代理人 拥有工具访问――日志搜索、PromQL、文档检索) ・监督员将综合,将假设+证据 呈现给人类――人类批准或重新引导――

### 自动补救范围

**Safe (narrow)**:重启 pod、重启特定部署、在预先批准的边界内规模池、启用预先批准的功能旗──

**Not safe (broad)**改进服务拓,改进资源限制,部署新代码,改进IAM,改进数据库.

任何人都在过度承诺, 随着AI SRE 成熟,安全集合会扩大,

### 对抗性评估 (新鸟)

两个模型独立分析同一个事件. 如果它们与根本原因一致,则信任较高. 如果它们不一致,则带有两个可见假设升级给人类.

### 运行内存

团队人员流动是传统的SRE的隐形杀手 部落知识 会流失──AI SRE将运行书籍+死后遗迹存入向量DB;代理会在每一个新事件中检索──当新工程师加入时,AI 拥有完整的历史──

### 事件前预测

在测试组上,基于历史日志,GPU 温度,API 错误模式训练的LLM,在停机发生前10-15分钟预测到其中89%.

现实检查:没有动作的预测只是仪表板――操作问题是:当我们预测到时,要做什么?

### 2026年产品

- **Datadog Bits AI**数据库 内部托管 SRE副飞行员──
- **Azure SRE Agent**    
- **NeuBird Hawkeye**对抗性评估+运行记忆力――
- **PagerDuty AIOps**分类+减倍量――
- **Incident.io Autopilot**事件指挥官+协调――

### 运行书籍作为代码

结构化跑本可以提供更好的RAG检索――启动任何AI-SRE推广时,都应先把非结构化跑本转换为结构化格式――

### 你应该记住的数字

- 麻省理工学院早期检测:89% 的停机,10-15 分钟的领先时间.
- 多代理分类:监督者+日志、指标、跑本) +人──
- 安全自动补救设置:重启组,重新部署,在边界内规模.
- 竞争对手的评价:两个模型独立;协议 =信心──


```figure
i4-incident-agents
```

## 使用它
`code/main.py`模拟多代理分类:记录代理 找到错误,测量代理 找到CPU尖,运行簿代理 匹配已知问题――监督假设 排序――

## 交付它
本课会生成`outputs/skill-ai-sre-plan.md`△基于当前的电话事件量,团队成熟度,设计一个AI SRE推广.

## 练习
1. 运行`code/main.py`如果记录和计量代理不同,监督员怎么解决?
2. 为您的服务定义三个安全的自动补救行动.
3. 编写一个结构化运行簿模板:部分,要求字段,验证命令.
4. 预测检测 提前 12 分钟触发. 你的政策是什么?
5. 论证一个3人团队应该在2026年采用AI SRE,还是等待.

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
