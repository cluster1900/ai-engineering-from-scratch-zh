---
name: start-learning
version: 1.0.0
description: >
  AI Engineering from Scratch 课程（511 节课、20 个 phase）的一次性入门流程。
  通过访谈了解学习者，运行 placement quiz，并写入 LEARNING.md，
  作为 learn Skill 驱动的持久学习计划。
  触发短语："开始学习"、"设置课程"、"开始课程体系"、
  "带我入门"、"创建我的学习计划"
tags: [onboarding, curriculum, ai-engineering, learning-plan]
---

# 开始学习

你正在帮助学习者进入 **AI Engineering from Scratch** 课程：
从 Linear Algebra 到 autonomous Agent，共 20 个 phase、511 节课。
你的工作是在当前目录中生成一个 `LEARNING.md` 文件，用于记录他们为何学习、
应从何处开始，以及学习路径的结构。之后的每次 `learn` session 都会读取并更新
此文件，因此应将其视为学习者的事实来源。

适用于任何 Agent。如果你的环境提供结构化的问题/选项 Tool，则每个问题都使用它；
否则以纯文本形式展示带字母编号的选项，并等待回复。

## Host 调用契约

Skill 名称是可移植的，但调用语法由 host 决定。展示下一条命令前，
使用正确的形式：

- Codex：`start-learning`、`learn`、`course-guide` 和其他 `skill-name`
  形式，或告知学习者从 `/skills` 中选择 Skill。
- Claude Code：`/start-learning`、`/learn`、`/course-guide` 和其他
  `/skill-name` 形式。
- 其他兼容 host：使用自然语言，例如 `使用 learn 开始我的第一节课。`

绝不要把 Claude Code 的 slash command 当作通用语法展示。如果 host 未知，
使用自然语言形式。

## 跨课程模式的恢复路由

在通用入门流程前，根据以下支持的状态文件及其路径负责人，
处理每一个“恢复”或“继续”请求：

- `LEARNING.md` 由完整课程的 `learn` 负责。
- `MCP-LEARNING.md` 由 Model Context Protocol (MCP) 路径的 `learn-mcp` 负责。
- `MCP-ENGINEERING-LEARNING.md` 是同一 `learn-mcp` 路径的 legacy 文件名，
  不是单独的路径。
- `AGENT-SKILLS-LEARNING.md` 由 `learn-agent-skills` 负责。
- `CLAUDE-CERTIFICATION.md` 由 `claude-certification` 负责。

如果学习者在恢复或继续请求中指定了路径，即使存在其他状态文件，
也应立即将其分派给对应负责人，然后停止此 Skill。

对于未指定路径的恢复或继续请求，收集已存在状态文件的负责人，
并将两个 MCP 文件名归到 `learn-mcp` 下。如果最终恰好只剩一个路径负责人，
则调用它，并在通用入门流程前停止此 Skill。legacy 文件迁移和冲突报告由
`learn-mcp` 负责。如果存在两个或更多路径负责人，列出面向学习者的路径名称，
并在运行 placement 或更改任何状态前，询问要恢复哪条路径。如果一个都不存在，
继续通用入门流程。绝不要根据文件的新旧程度推断路径，也不要把一条路径的进度
合并到另一个状态文件中。

Legacy runtime 可能会提供 `learn-mcp-engineering` 作为 alias。
仅接受它作为进入 `learn-mcp` 的方式；所有面向学习者的交接都应显示为
`learn-mcp`，并将路径命名为 Model Context Protocol (MCP)。

## 专注的 MCP 交接

如果学习者明确想学习 Model Context Protocol (MCP)，而不是完整课程，
不要运行 placement，也不要创建 `LEARNING.md`。将其路由到可移植 Skill
`learn-mcp`；其来源为 `learning-paths/model-context-protocol.json`，
状态文件为 `MCP-LEARNING.md`。在 Codex 中使用 `learn-mcp`，
在 Claude Code 中使用 `/learn-mcp`，或要求其他兼容 host 使用
`learn-mcp`。专属导师负责课程选择、wire 证据和公开 deployment security gate。

## 专注的 Agent Skills 交接

如果学习者明确想学习 Agent Skills，而不是完整课程，或者
`AGENT-SKILLS-LEARNING.md` 已存在且他们要求恢复该路径，不要运行 placement，
也不要创建 `LEARNING.md`。将其路由到可移植 Skill `learn-agent-skills`；
其来源为 `learning-paths/agent-skills.json`，状态文件为
`AGENT-SKILLS-LEARNING.md`。在 Codex 中使用 `learn-agent-skills`，
在 Claude Code 中使用 `/learn-agent-skills`，或要求其他兼容 host 使用
`learn-agent-skills`。专属导师负责五节课的顺序、真实 host 证据、
sandbox 边界、Lesson 26 前的 Lesson 25 和 tool-poisoning prerequisite gate，
以及 release gate。

如果 `LEARNING.md` 已存在，不要覆盖它。总结其中的内容
（使命、入口点、当前进度），并且只提供以下三条路径：

- **恢复**：使用上述 host 语法调用 `learn`；完全跳过访谈和 placement。
- **重新运行 placement**：再次进行 quiz，然后只更新 Placement 章节和 Path
  状态；保持 Mission、Progress log 和 Review queue 不变。
- **重新开始**：只有在获得明确确认后，才将当前文件重命名为
  `LEARNING-<YYYY-MM-DD>.md` 作为归档，然后继续下面的完整入门流程。
  绝不要静默删除或覆盖他们的历史记录。

## 第 1 步：访谈（3 个问题，保持简短）

1. **你为什么学习 AI engineering？** 自由文本。可提供的示例：
   交付 AI 产品、转行、理解自己每天已经在使用的技术、研究。
   使用他们自己的原话记录答案，因为它将作为未来每节课程解释的基础。
2. **每周有多少时间？** 选项：约 2 小时、约 5 小时、约 10 小时、
   “越快越好”。这仅用于如实描述学习节奏，绝不能用于删减内容。
3. **结束时你最想构建什么？** 一行即可。可以是 Agent、经过 Training 的 Model、
   RAG 产品；回答“还不确定”也可以。

不要提出超过这三个问题。placement quiz 衡量知识水平；
访谈只用于记录意图。

## 第 2 步：Placement

运行 `find-your-level` Skill 中的 placement quiz
（它与此 Skill 一同安装）：5 个领域、10 道题，并映射到一个起始 phase。

如果学习者表示已经知道想从哪里开始（“直接让我从 phase 7 开始”），
则尊重该选择并跳过 quiz，同时遵循与运行 quiz 相同的输出契约，
确保 `learn` 导师始终能够读取格式完整的计划：

- 验证 phase 是否为 0-19，并解析其规范名称；如果无法解析，
  列出 20 个 phase 并让他们选择。
- 在 Path 表格中：入口点以下的 phase 标记为 `Skip`，入口点及以上全部标记为
  `Do`（由于没有领域分数可供推断，因此不设置 `Review` 行），Est. hours 总计
  为所有 `Do` 行的总和。
- 在 Placement 章节中写入 `Score: self-selected`，而不是数字。

## 第 3 步：写入 LEARNING.md

在当前目录中创建包含以下准确章节的 `LEARNING.md`：

```markdown
# 我的 AI Engineering 路径
<!-- 由 ai-engineering-from-scratch learning Skill 管理。
     Repo：https://github.com/rohitg00/ai-engineering-from-scratch -->

## 使命
<使用他们自己的原话填写问题 1 的答案，并附上问题 3 中的构建目标>

## Placement
- 日期：<YYYY-MM-DD>
- 分数：<total>/10，并附领域分数明细；如果跳过 quiz，则准确填写 `self-selected`
- 入口点：Phase <N>：<name>
- 节奏：约 <hours>/周

## 路径
| Phase | 名称 | 状态 | 预计小时 |
|-------|------|------|------------|
<全部 20 个 phase；状态根据 placement 结果设为 Skip、Review、Do 或 Done。
小时数来自 ROADMAP.md：如果 repo 已 clone，则在本地读取；
否则获取
https://raw.githubusercontent.com/rohitg00/ai-engineering-from-scratch/main/ROADMAP.md>

## 进度日志
| 日期 | 课程 | Quiz | 备注 |
|------|--------|------|------|

## Review 队列
<目前为空；learn 会添加 quiz 标记的课程>
```

## 第 4 步：交接

最后只使用以下三行，不要添加其他内容：

- 说明他们的入口点，以及 Review + Do phase 的预计总小时数。
- 提供适用于当前 host 的 `learn` 调用方式，并说明它会开始第一节课，
  且每次都会从此文件继续。
- 提供适用于当前 host 的 `course-guide <topic>` 调用方式，并说明它也可以
  直接跳转到特定主题。
