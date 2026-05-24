# 贡献指南

Lessons、translations、fixes、outputs 都欢迎。每个 pull
request 只包含一项贡献，可以让 review 更快，也能让 contributor 计数和署名正确运作。

## 重要：README 和 ROADMAP 会供给 website

`site/build.js` 会解析 `README.md`、`ROADMAP.md` 和 `glossary/terms.md` 来
生成 `site/data.js`。任何触及这些文件的 pull request 都必须保持以下两种模式完整：

- Phase headers 采用 `### Phase N: Name \`X lessons\`` 形式，或
  `<details><summary><b>Phase N — Name</b> ... <code>X lessons</code> ... <em>Description</em></summary>` 形式。
- Lesson tables 使用列形状 `| # | Lesson | Type | Lang |`（capstone tables 则为
  `| # | Project | Combines | Lang |`）。`Lang` 列
  接受纯文本（`Python, TypeScript`）或旧版 emoji flags
  （`🐍 🟦 🦀 🟣 ⚛️`）；两者对 parser 等价。
- Phase headers 和 lesson rows 上的 ROADMAP status glyphs（`✅`、`🚧`、`⬚`）。
  不要把它们替换成文本 — parser 会依据这些精确字符识别。

编辑这些文件后运行 `node site/build.js`；如果你的编辑在结构上安全，`git diff site/data.js`
应该只显示 timestamp 变化。

## 贡献方式

### 1. 添加 New Lesson

每个 lesson 位于 `phases/XX-phase-name/NN-lesson-name/`，结构如下：

```
NN-lesson-name/
├── code/           至少一个可运行 implementation
├── notebook/       用于 experimentation 的 Jupyter notebook（optional）
├── docs/
│   └── en.md       Lesson documentation（required）
└── outputs/        此 lesson 产生的 prompts、skills 或 agents（if applicable）
```

**Lesson doc format** (`en.md`)：

```markdown
# Lesson Title

> One-line motto — the core idea in one sentence.

## The Problem

Why does this matter? What can't you do without this?

## The Concept

Explain with diagrams, visuals, and intuition. Code comes later.

## Build It

Step-by-step implementation from scratch.

## Use It

Now use a real framework or library to do the same thing.

## Ship It

The prompt, skill, agent, or tool this lesson produces.

## Exercises

1. Exercise one
2. Exercise two
3. Challenge exercise
```

### 2. 添加 Translation

在任意 lesson 的 `docs/` 文件夹中创建新文件：

```
docs/
├── en.md    (English — always required)
├── zh.md    (Chinese)
├── ja.md    (Japanese)
├── es.md    (Spanish)
├── hi.md    (Hindi)
└── ...
```

保持与 English 版本相同的结构。翻译 content，不翻译 code。

### 3. 添加 Output

如果某个 lesson 应该产出可复用的 prompt、skill、agent 或 MCP server：

1. 在该 lesson 的 `outputs/` 文件夹中创建它
2. 在顶层 `outputs/` index 中添加 reference

**Prompt format：**

```markdown
---
name: prompt-name
description: What this prompt does
phase: 14
lesson: 01
---

[System prompt or template here]
```

**Skill format：**

```markdown
---
name: skill-name
description: What this skill teaches
version: 1.0.0
phase: 14
lesson: 01
tags: [agents, loops]
---

[Skill content here]
```

### 4. 修复 Bugs 或改进 Existing Lessons

- 修复无法运行的 code
- 改进 explanations
- 添加更好的 diagrams
- 更新过时信息

### 5. 添加 Exercises 或 Projects

更多 exercises 和 projects 始终欢迎，尤其是连接多个 phases 的内容。

## Guidelines

- **Code 必须运行。** 每个 code 文件都应使用列出的 dependencies 无错误执行。
- **Code 中不要有 comments。** Code 应该自解释。使用 docs 进行说明。
- **为任务选择最合适的语言。** 不要在 TypeScript 或 Rust 更适合时强行使用 Python。
- **先从零构建。** 在展示 framework 版本之前，始终先从第一性原理实现 concept。
- **保持实用。** Theory 服务于 practice，而不是相反。
- **不要 AI slop。** 像人一样写。直接。删掉废话。

## Pull Request Process

1. Fork repository
2. 创建 feature branch（`git checkout -b add-lesson-phase3-gradient-descent`）
3. 进行修改
4. 确保所有 code 都能运行
5. 提交 pull request，并附上清晰描述

## Code of Conduct

见 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。友善、乐于助人、具有建设性。

## Style

- 直接的 prose。删掉废话。匹配 manual 的语气，不要写成 marketing copy。
- headings 中不要使用装饰性 emojis。Lang column emoji flags 是唯一
  例外，且仅因为 parser 会映射它们。
- Code 使用 lesson 中列出的 dependencies 即可原样运行。
- 先从零构建，再展示 framework。
