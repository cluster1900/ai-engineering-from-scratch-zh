# Lesson Template

创建新 lesson 时使用此 template。复制 folder structure 并填入内容。

## Folder Structure

```
NN-lesson-name/
├── code/
│   ├── main.py            (主要实现)
│   ├── main.ts            (TypeScript 版本，如适用)
│   ├── main.rs            (Rust 版本，如适用)
│   └── main.jl            (Julia 版本，如适用)
├── notebook/
│   └── lesson.ipynb       (用于实验的 Jupyter notebook)
├── docs/
│   └── en.md              (lesson documentation)
└── outputs/
    ├── prompt-*.md         (本 lesson 生成的 prompts)
    └── skill-*.md          (本 lesson 生成的 skills)
```

## Documentation Format (docs/en.md)

```markdown
# [Lesson 标题]

> [一句话 motto — 能让人记住的核心想法]

**Type:** Build | Learn
**Languages:** Python, TypeScript, Rust, Julia (列出实际使用的语言)
**Prerequisites:** [列出需要先完成的 lessons]
**Time:** ~[预计时间] 分钟

## The Problem

[2-3 段。没有这个你会做不到什么？为什么你应该关心？
要具体 — 展示一个不了解它会造成问题的场景。]

## The Concept

[用 diagrams 和直觉来解释。先不要放 code。
使用 ASCII diagrams、tables，或链接到 web app 中的 visuals。
先建立 mental models，再进入实现。]

## Build It

[从零开始的逐步实现。
先从最简单版本开始，再增加复杂度。
每个 code block 都应该可以独立运行。]

### 步骤 1： [名称]

[说明]

    [code block]

### 步骤 2： [名称]

[说明]

    [code block]

[...继续...]

## Use It

[现在展示 frameworks/libraries 如何做同样的事。
将你的 from-scratch 版本与 library 版本进行比较。
这会证明 concept，并引入实用工具。]

## Ship It

[本 lesson 会产出什么可复用 artifact？
可以是 prompt、skill、agent、MCP server 或 tool。
在这里包含它，并将其保存到 outputs/ folder。]

## Exercises

1. [Easy — 巩固核心 concept]
2. [Medium — 将其应用到不同问题]
3. [Hard — 扩展或与之前的 lessons 结合]

## Key Terms

| Term | 人们通常怎么说 | 它实际意味着什么 |
|------|----------------|----------------------|
| [term] | [常见误解] | [实际定义] |

## Further Reading

- [Resource 1](url) — [为什么值得阅读]
- [Resource 2](url) — [为什么值得阅读]
```

## Code File Guidelines

- Code 必须无错误运行
- 不写 comments — code 应该自解释
- 使用最适合该主题的语言
- 如果有 dependencies，包含 `requirements.txt` 或等效文件
- 从简单开始，逐步增加复杂度
- 每个 function 和 class 都应该有清晰目的

## Output File Format

### Prompts

```markdown
---
name: prompt-name
description: 这个 prompt 做什么
phase: [phase number]
lesson: [lesson number]
---

[Prompt 内容]
```

### Skills

```markdown
---
name: skill-name
description: 这个 skill 教什么
version: 1.0.0
phase: [phase number]
lesson: [lesson number]
tags: [相关, tags]
---

[Skill 内容]
```
