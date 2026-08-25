# 官方 Claude 认证蓝图映射

> 供课程维护者使用的事实来源说明。每次发布前都要重新核验。

**核验日期：** 2026-08-09
**考试指南版本：** 1.0
**生效时间：** 2026 年 7 月

## 官方指南

- [CCAO-F 考试指南](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542847%2FClaude+Certified+Associate+%E2%80%93+Foundations+Exam+Guide.pdf)
- [CCDV-F 考试指南](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542875%2FClaude+Certified+Developer+%E2%80%93+Foundations+Exam+Guide.pdf)
- [CCAR-F 考试指南](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542750%2FClaude+Certified+Architect+%E2%80%93+Foundations+Exam+Guide.pdf)
- [CCAR-P 考试指南](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542810%2FClaude+Certified+Architect+%E2%80%93+Professional+Exam+Guide.pdf)

## 覆盖策略

该 repository 已经为 Prompting、Structured Output、Context Engineering、
Evaluation、Agents、Tool 设计、MCP、安全、RAG、可观测性和生产运维提供了
扎实基础。认证部分承担阶段课程不应承担的三项工作：

1. 将每个主题表述为考试风格约束下的蓝图决策。
2. 填补 Claude 特有的产品、API、配置和生命周期空白。
3. 组织针对不同角色的 Capstone 和加权评估。

现有课程中发现的最重要空白包括：

- Claude chat、research、Projects、Artifacts 和项目 knowledge 维护。
- 完整的 Messages API 状态机，包括 content blocks、stop reasons、
  Tool continuations、streaming、thinking、caching 和 batch 权衡。
- Claude Code 配置优先级、Rules、Skills、Commands、Agents、
  memory、headless execution 和 CI 工作流。
- 业务发现、利益相关者沟通、架构论证、实现交接和运维责任。

根据当前 Anthropic Academy 目录进行第二轮检查后，在不修改公开蓝图的前提下，
增加了产品界面的深度：

- 直接使用 Claude、Amazon Bedrock、Google Vertex AI 和 Microsoft Foundry
  的部署决策。
- SDK、REST、streaming、asynchronous、Multimodal、Files API、Tool Runner
  和托管 Agent 访问模式。
- 高级 MCP sampling、roots、notifications、Inspector、Streamable HTTP，
  以及 stateful 与 stateless 部署决策。
- 当前 Claude Code 运维控制、真实 Skill 编写、subagent 契约和团队分发。
- 针对 next-token prediction、knowledge、working memory 和 steerability
  的四属性诊断。

## 现有深入课程

应使用以下课程，而不是重复其从零教学内容：

| 能力 | 现有课程路径 |
|------------|-----------------------|
| Prompting 和 few-shot reasoning | `phases/11-llm-engineering/01-prompt-engineering`、`phases/11-llm-engineering/02-few-shot-cot` |
| Structured Outputs | `phases/11-llm-engineering/03-structured-outputs`、`phases/13-tools-and-protocols/04-structured-output` |
| Context 和 caching | `phases/11-llm-engineering/05-context-engineering`、`phases/11-llm-engineering/11-caching-cost`、`phases/11-llm-engineering/15-prompt-caching` |
| Evaluation | `phases/11-llm-engineering/10-evaluation`、`phases/14-agent-engineering/30-eval-driven-agent-development` |
| Agent 循环与编排 | `phases/14-agent-engineering/01-the-agent-loop`、`phases/14-agent-engineering/12-anthropic-workflow-patterns`、`phases/14-agent-engineering/28-orchestration-patterns` |
| Claude Agent SDK | `phases/14-agent-engineering/17-claude-agent-sdk` |
| Tool 和 MCP 设计 | `phases/13-tools-and-protocols/01-the-tool-interface`、`phases/13-tools-and-protocols/05-tool-schema-design`、`phases/13-tools-and-protocols/06-mcp-fundamentals`、`phases/13-tools-and-protocols/07-building-an-mcp-server`、`phases/13-tools-and-protocols/11-mcp-sampling`、`phases/13-tools-and-protocols/12-mcp-roots-and-elicitation` |
| 安全与审批 | `phases/14-agent-engineering/27-prompt-injection-defense`、`phases/15-autonomous-systems/10-claude-code-permission-modes`、`phases/17-infrastructure-and-production/25-security-secrets-audit` |
| RAG 和 retrieval | `phases/11-llm-engineering/06-rag`、`phases/11-llm-engineering/07-advanced-rag`、`phases/19-capstone-projects/65-hybrid-retrieval-bm25-dense` |
| 可观测性和运维 | `phases/17-infrastructure-and-production/13-llm-observability`、`phases/17-infrastructure-and-production/23-sre-for-ai`、`phases/17-infrastructure-and-production/27-finops-llms` |

## Track 重点

### CCAO-F

权重最高的领域是输出 Evaluation 和验证，占 21%。
因此，该路线在事实核验、偏见检查、受众适配、合适格式和人工审核上投入的时间，
多于 Prompt 语法。

### CCDV-F

Applications and Integration 占 33.1%。该路线坚持协议优先：
Messages API 状态、应用边界、SDK 和 REST 行为、Session 卫生、配置、
Tools 和生产故障隔离。

### CCAR-F

考试围绕现实场景组织。该路线教授一种可在六个公开场景 Context 中重复使用的
决策方法，并将最多时间分配给占 27% 的 Agentic Architecture and Orchestration。

### CCAR-P

Integration 是占比最大的单一领域，为 19%，但 Professional 是一项覆盖完整
生命周期的考试。本课程将业务发现、架构、Prompting、RAG、Evaluation、安全、
利益相关者沟通、Claude Code 赋能和运维责任连接起来，而不是将它们视为孤立事实。
