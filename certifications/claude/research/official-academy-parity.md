# 官方 Anthropic Academy 对齐映射

> 对齐意味着每个与认证相关的学习目标都有本地讲解、决策练习、产物和验证路径。这并不意味着复制 Academy 目录。

**核验日期：** 2026-08-09

## 官方备考概览

当前合作伙伴备考页面说明：

- Associate Foundations：八个模块，标示时长共 389 分钟。
- Developer Foundations：五个模块，标示时长共 774 分钟。
- Architect Foundations：由七门现有 Academy 课程组成的套装。
- Architect Professional：五个模块，标示时长共 733 分钟。

这些总数是带日期的课程目录快照，并非考试时长或要求的学习时间。
Academy 可以新增、移除或重新组织课程，而无需修改公开考试指南。

来源：[Associate 备考路径](https://anthropic-partners.skilljar.com/path/claude-certified-associate-foundations)、
[Developer 备考路径](https://anthropic-partners.skilljar.com/path/claude-certified-developer-foundations)、
[Architect Foundations 备考课程套装](https://anthropic-partners.skilljar.com/page/claude-certified-architect-foundations-prep-courses)以及
[Architect Professional 备考路径](https://anthropic-partners.skilljar.com/path/claude-certified-architect-professional)。

## 学习界面映射

| 官方 Academy 界面 | 与认证相关的目标 | 本地覆盖 |
|---|---|---|
| [AI Fluency: Framework and Foundations](https://anthropic.skilljar.com/ai-fluency-framework-foundations) | Delegation、Description、Discernment 和 Diligence | 第 00、05、06 和 07 课将 4Ds 转化为学习计划、能力诊断、控制映射和人工交接 |
| [AI Capabilities and Limitations](https://anthropic.skilljar.com/ai-capabilities-and-limitations) | 诊断 next-token prediction、knowledge、working memory 和 steerability | 第 04 和 05 课提供 Context 决策和经过验证的四属性失败诊断 |
| [Claude 101](https://anthropic.skilljar.com/claude-101) | Claude 产品界面、Projects、knowledge、connectors、research 和安全的日常工作流 | 第 01、04 和 07 课，以及 Associate Capstone |
| [Product Foundations](https://anthropic-partners.skilljar.com/product-foundations) | 根据业务和控制要求，在直接使用 Claude、Amazon Bedrock、Google Vertex AI 或 Microsoft Foundry 之间作出选择 | 第 01 课的部署 ADR；第 22、23 和 25 课进一步扩展采购、架构、身份和数据边界决策 |
| [Claude Platform 101](https://anthropic.skilljar.com/claude-platform-101) | 原始 Messages 循环、SDK Tool Runner、第一方 Tools、托管 Agents、事件流、工作区和支出控制 | 第 08、10、12、13 和 26 课提供离线状态机、执行界面、安全和运维练习 |
| [Building with the Claude API](https://anthropic.skilljar.com/claude-with-the-anthropic-api) | API 生命周期、streaming、Tools、Structured Outputs、caching、batch、RAG、evals、Computer Use 和 Agents | 第 08 至 14、20、24 和 26 课；现有阶段课程提供从零构建 RAG 和 eval 的深入内容 |
| [Introduction to MCP](https://anthropic.skilljar.com/introduction-to-model-context-protocol) | Clients、Servers、Tools、Resources、Prompts、Transport、MIME 和清理 | 第 11 课的契约实验，以及第 13 阶段的 MCP Server 和 Client 构建 |
| [MCP Advanced Topics](https://anthropic.skilljar.com/model-context-protocol-advanced-topics) | Sampling、roots、notifications、JSON-RPC、Streamable HTTP、Sessions 和扩展 | 第 11 课的决策与部署实验，以及第 13 阶段的 sampling 和 roots/elicitation 构建 |
| [Claude Code 101](https://anthropic.skilljar.com/claude-code-101) | Permissions、Plan Mode、Context 恢复、CLAUDE.md、subagents、Skills、MCP 和 hooks | 第 15 和 19 课，以及现有的 Claude Code permission mode 课程 |
| [Claude Code in Action](https://anthropic.skilljar.com/claude-code-in-action) | Compaction、rewind、目标与循环、worktrees、headless automation、review、routines 和分发 | 第 15 和 19 课的运维包与 CI 验证器 |
| [Introduction to Agent Skills](https://anthropic.skilljar.com/introduction-to-agent-skills) | 编写 SKILL.md、通过 descriptions 触发、限制 Tools、打包 scripts、分发和调试 | 第 19 课交付并验证一个真实的多文件 Skill；repository tutor 展示可移植分发 |
| [Introduction to Subagents](https://anthropic.skilljar.com/introduction-to-subagents) | 隔离的 Context、受限 Tools、结构化报告、障碍、时间盒和委派限制 | 第 16、17 和 19 课 |
| [Introduction to Claude Cowork](https://anthropic.skilljar.com/introduction-to-claude-cowork) | 引导式任务循环、持续 Context、Skills/plugins、文件工作流和负责任的引导 | 仅提供简要的产品版图和工作流选择覆盖；未将其提升为公开考试目标 |
| Amazon Bedrock 和 Google Vertex AI 上的 Claude | 特定 Provider 的部署和运维 | 第 01 课教授架构决策；Provider Console 操作教程仍作为可选的官方配套材料 |

## 本地对齐增加的内容

每节已映射课程都必须做到不只是提及官方目标：

1. 解释机制及其失败边界。
2. 让学习者操作场景或作出决策。
3. 生成归学习者所有的产物。
4. 运行确定性的验证器或模拟器。
5. 通过原创问题和角色 Capstone 测试知识迁移。

对于概念类课程，可执行界面会对政策、威胁 Model、ADR、审批流程或证据包进行评分。
它绝不会为了让课程看起来更具技术性而加入虚假的 Provider 代码。

## 有意不对齐的内容

- 本课程不复制 Academy 的讲解、幻灯片、练习或测验措辞。
- 本课程不维持固定的 Academy 课程总数。
- 本课程不会将合作伙伴销售赋能内容转化为技术考试要求。
- 在这个坚持 stdlib 优先的 repository 中，本课程不要求 Pydantic；第 09 课
  讲解其验证职责如何映射到底层契约。
- 当公开蓝图要求的是架构决策而非 Console 导航时，本课程不会重复 Provider
  Console 教程。
- 本课程不会让认证课程经过图书工作流，因为 tutor 状态、实验、图示和评估都是
  必需的学习界面。
