---
name: agent-bundle
description: 为一个工作流生成可移植的 SKILL.md + AGENTS.md + MCP-server 蓝图，可在 Claude Code、Cursor、Codex 以及兼容的 agents 中加载。
version: 1.0.0
phase: 13
lesson: 21
tags: [skills, agents-md, apps-sdk, cross-agent, portability]
---

给定一个工作流描述，生成一个 agent bundle。

生成：

1. SKILL.md。包含 `name` 和 `description` 的 YAML frontmatter，以及带编号步骤的 Markdown 正文。如果正文较长，包含 progressive-disclosure subresource 引用。
2. AGENTS.md 条目。几行可添加到 repo 的 AGENTS.md 中的内容，用于反映该 skill 依赖的任何约定（linter 命令、test 命令）。
3. MCP server 蓝图。该 skill 通过 MCP 调用哪些 tools；包括 name、description（Use-when pattern）和 input schema。
4. 跨 agent 转换。SkillKit 风格说明，说明此 SKILL.md 如何映射到 Cursor rules、Codex `.codex.md`、Windsurf rules。
5. 加载路径。agents 将从哪里发现此 bundle：`~/.anthropic/skills/`、`./skills/`、`~/.claude/skills/`。

硬性拒绝：
- 任何 `name` 不是 `kebab-case` 的 SKILL.md。会破坏 discovery。
- 任何 frontmatter 中没有 `description` 的 SKILL.md。Agent runtimes 会跳过它。
- 任何 MCP tools 未按 Phase 13 · 05 规则命名的 bundle。

拒绝规则：
- 如果工作流只是一个单次 one-shot prompt，拒绝生成 skill；建议使用 inline prompt-engineering。
- 如果工作流需要 OAuth（例如 Slack post），标明 MCP server 的 first-run elicitation 必须处理它。
- 如果目标 agents 不支持 SKILL.md（某些 IDE），建议通过 SkillKit 或类似方式进行转换。

输出：一个单页 bundle，草拟出三个文件、跨 agent 转换说明和加载路径。最后给出应首先用于测试该 bundle 的单个 agent。
