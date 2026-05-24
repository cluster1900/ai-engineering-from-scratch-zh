# Skills 和 Agent SDKs — Anthropic Skills, AGENTS.md, OpenAI Apps SDK

> MCP 说明“有哪些工具”。Skills 说明“如何完成一项任务”。2026 年的 stack 会同时分层使用二者。Anthropic 的 Agent Skills（开放标准，2025 年 12 月）以带有 progressive disclosure 的 SKILL.md 形式发布。OpenAI 的 Apps SDK 是 MCP 加上 widget metadata。AGENTS.md（目前已在 60,000+ 个 repo 中使用）位于 repo root，作为项目级 Agent 上下文。本课会说明每一层覆盖的内容，并构建一个最小的 SKILL.md + AGENTS.md bundle，可在多个 agents 之间流转。

**类型：** 学习
**语言：** Python（stdlib，SKILL.md parser and loader）
**前置要求：** Phase 13 · 07（MCP server）
**时间：** 约 45 分钟

## 学习目标

- 区分三层：AGENTS.md（项目上下文）、SKILL.md（可复用 know-how）、MCP（工具）。
- 编写一个包含 YAML frontmatter 和 progressive disclosure 的 SKILL.md。
- 以 filesystem-style 将 skills 加载到 agent runtime 中。
- 将一个 skill 与 MCP server 和 AGENTS.md 组合，让一个 package 可在 Claude Code、Cursor 和 Codex 中工作。

## 问题

一位工程师把 release notes 编写 workflow 提炼成一个多步骤 prompt：“读取最新合并的 PR。按区域分组。分别总结。按照团队风格编写 changelog 条目。发布到 Slack draft。”他们把它放在团队的 Notion 文档里。

现在他们想在 Claude Code、Cursor 和 Codex CLI 中使用这个 workflow。每个 agent 加载 instructions 的方式都不同：Claude Code slash-commands、Cursor rules、Codex `.codex.md`。这位工程师把 workflow 复制了三份，并维护三份副本。

AGENTS.md 和 SKILL.md 结合起来可以解决这个问题：

- **AGENTS.md** 位于 repo root。每个兼容的 agent 都会在 session start 时读取它。“这个项目如何工作？有哪些约定？哪些命令运行 tests？”
- **SKILL.md** 是一个可移植 bundle：YAML frontmatter（name、description）+ markdown body + 可选 resources。支持 skills 的 agents 会按需通过名称加载它们。
- **MCP**（Phase 13 · 06-14）处理 skill 需要调用的工具。

三层，一个可移植 artifact。

## 概念

### AGENTS.md (agents.md)

于 2025 年末推出，到 2026 年 4 月已有 60,000+ 个 repo 采用。一个文件放在 repo root。格式：

```markdown
# Project: my-service

## Conventions
- TypeScript with strict mode.
- Use Pydantic for models on the Python side.
- Tests run with `pnpm test`.

## Build and run
- `pnpm dev` for local dev server.
- `pnpm build` for production bundle.
```

Agents 会在 session start 时读取它，并用它来校准自己在该项目中的行为。2026 年的每个 coding agent 都支持 AGENTS.md：Claude Code、Cursor、Codex、Copilot Workspace、opencode、Windsurf、Zed。

### SKILL.md 格式

Anthropic 的 Agent Skills（2025 年 12 月作为开放标准发布）：

```markdown
---
name: release-notes-writer
description: Write a changelog entry for the latest merged PRs following this project's style.
---

# Release notes writer

When invoked, run these steps:

1. List PRs merged since the last tag. Use `gh pr list --base main --state merged`.
2. Group by label: feature, fix, chore, docs.
3. For each PR in each group, write one line: `- <title> (#<num>)`.
4. Draft the release notes and stage them in CHANGELOG.md.

If the user says "ship", run `git tag vX.Y.Z` and `gh release create`.

## Notes

- Never include commits without a PR.
- Skip "chore" entries from the public changelog.
```

Frontmatter 声明 skill 的身份。Body 是 skill 加载时展示给 model 的 prompt。

### Progressive disclosure

Skills 可以引用子 resources，agent 只在需要时获取它们。示例：

```
skills/
  release-notes-writer/
    SKILL.md
    style-guide.md
    template.md
    scripts/
      generate.sh
```

SKILL.md 会说“查看 style-guide.md 了解风格规则。”Agent 只有在 skill 正在运行时才会拉取 style-guide.md。这可以避免用 model 可能不需要的细节膨胀 prompt。

### Filesystem discovery

Agent runtimes 会扫描已知目录中的 SKILL.md 文件：

- `~/.anthropic/skills/*/SKILL.md`
- Project `./skills/*/SKILL.md`
- `~/.claude/skills/*/SKILL.md`

加载依据是 folder name 和 frontmatter `name`。Claude Code、Anthropic Claude Agent SDK 和 SkillKit（cross-agent）都遵循这种模式。

### Anthropic Claude Agent SDK

`@anthropic-ai/claude-agent-sdk`（TypeScript）和 `claude-agent-sdk`（Python）会在 session start 时加载 skills，并在 runtime 内将它们暴露为可调用的“agents”。当用户调用某个 skill 时，agent loop 会 dispatch 到该 skill。

### OpenAI Apps SDK

于 2025 年 10 月推出；直接构建在 MCP 之上。它把 OpenAI 之前的 Connectors 和 Custom GPT Actions 统一到一个开发者表面中。一个 Apps SDK app 包含：

- 一个 MCP server（tools、resources、prompts）。
- 加上用于 ChatGPT UI 的 widget metadata。
- 加上可选的 MCP Apps `ui://` resource，用于交互式界面。

同一个协议，更丰富的 UX。

### 通过 SkillKit 实现 cross-agent portability

SkillKit 以及类似的 cross-agent distribution layers 可以把单个 SKILL.md 翻译成 32+ 个 AI agents（Claude Code、Cursor、Codex、Gemini CLI、OpenCode 等）的原生格式。一个 source of truth；多个 consumers。

### 三层 stack

| 层 | 文件 | 加载时机 | 目的 |
|-------|------|-------------|---------|
| AGENTS.md | repo root | session start | 项目级约定 |
| SKILL.md | skills directory | skill invoked | 可复用 workflow |
| MCP server | external process | tools needed | 可调用 actions |

三者可以组合：agent 在 session start 时读取 AGENTS.md，用户调用一个 skill，skill 的 instructions 包含 MCP tool calls，agent 通过 MCP client 进行 dispatch。

## 使用它

`code/main.py` 提供了一个 stdlib SKILL.md parser and loader。它会发现 `./skills/` 下的 skills，解析 YAML frontmatter 和 markdown body，并生成一个以 skill name 为 key 的 dict。然后它会模拟一个 agent loop，通过名称调用 `release-notes-writer`。

需要关注的内容：

- 使用最小 stdlib parser 解析 YAML frontmatter（无 `pyyaml` 依赖）。
- Skill body 原样保存；agent 在调用时将其 prepend 到 system prompt。
- 通过 `read_subresource` function 演示 progressive disclosure，该 function 会按需拉取引用文件。

## 交付它

本课会生成 `outputs/skill-agent-bundle.md`。给定一个 workflow，该 skill 会生成组合后的 SKILL.md + AGENTS.md + MCP-server-blueprint bundle，可在多个 agents 之间移植。

## 练习

1. 运行 `code/main.py`。在 `skills/` 下添加第二个 skill，并确认 loader 能发现它。

2. 为本课程 repo 编写一个 AGENTS.md。包含 testing commands、style conventions 和 Phase 13 mental model。

3. 将你团队内部文档中的一个多步骤 workflow 移植到 SKILL.md。验证它能在 Claude Code 中加载。

4. 手动将该 skill 翻译为 Cursor 和 Codex 的原生 rule formats。统计各格式之间的 diff，这就是 SkillKit 自动化处理的 translation surface。

5. 阅读 Anthropic Agent Skills blog post。找出 Claude Agent SDK 中一个本课 loader 未覆盖的功能。（提示：agent sub-invocation。）

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| SKILL.md | “skill 文件” | YAML frontmatter 加上 markdown body，由 agent runtime 加载 |
| AGENTS.md | “Repo-root agent context” | 在 session start 时读取的项目级约定文件 |
| Progressive disclosure | “Lazy-load sub-resources” | Skill body 引用仅在需要时才拉取的文件 |
| Frontmatter | “顶部的 YAML block” | `---` delimiters 中的 metadata（name、description） |
| Claude Agent SDK | “Anthropic 的 skill runtime” | `@anthropic-ai/claude-agent-sdk`，加载 skills 并进行 routes |
| OpenAI Apps SDK | “MCP + widget meta” | OpenAI 基于 MCP 并加入 ChatGPT UI hooks 的开发者表面 |
| Skill discovery | “Filesystem scan” | 遍历已知 dirs 查找 SKILL.md，并按 name 作为 key |
| Cross-agent portability | “一个 skill，多个 agents” | 通过 SkillKit-style tools 将一个 SKILL.md 翻译到 32+ 个 agents |
| Agent Skill | “Portable know-how” | MCP 工具概念之外的可复用任务模板 |
| Apps SDK | “MCP 加 ChatGPT UI” | Connectors 和 Custom GPTs 在 MCP 上统一 |

## 延伸阅读

- [Anthropic — Agent Skills announcement](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) — 2025 年 12 月发布
- [Anthropic — Agent Skills docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) — SKILL.md format reference
- [OpenAI — Apps SDK](https://developers.openai.com/apps-sdk) — 面向 ChatGPT、基于 MCP 的 developer platform
- [agents.md](https://agents.md/) — AGENTS.md 格式和采用列表
- [Anthropic — anthropics/skills GitHub](https://github.com/anthropics/skills) — 官方 skill examples
