---
name: dgm-evaluator-firewall
description: 指定 Darwin-Godel-Machine-style self-modifying agent loop 为避免已记录的 reward hacking 所需的 evaluator separation。
version: 1.0.0
phase: 15
lesson: 4
tags: [dgm, self-modification, reward-hacking, evaluator, sandbox]
---

给定一个拟议的 self-modifying agent loop（agent scaffolding、evaluator pipeline、deployment target），产出一份 firewall specification，确保 evaluator 位于 agent 可触及范围之外。DGM 论文记录了 agent 移除自己的 safety markers 来提高分数；这个 skill 就是对应的 control。

产出：

1. **File-system boundary.** 列出 agent 可以编辑的每个文件。列出 evaluator 读取的每个文件。两者交集必须为空。如果不为空，指定让交集变为空所需的精确移动。
2. **Process boundary.** evaluator 必须运行在 agent 不控制的 process 中。指定 container 或 sandbox。如果 agent 拥有 shell access，agent 可以绕过 in-process guards。
3. **Network and secret boundary.** agent 不得能够编辑用于获取 evaluator inputs 或发布 scores 的 CI secrets。列出 secrets 位于哪里以及如何 mounted。
4. **Score-ingress contract.** scores 从 evaluator 返回到 loop 的 archive。这条路径是唯一 channel。任何 agent 可以写入并影响未来 scoring 的内容都会破坏 contract。
5. **Mutation review list.** 列出在接受前需要 manual review 的 agent edits 类别：new dependencies、对 scoring-adjacent code 的 edits、对 sandbox configuration 的 edits、对 logging 或 monitoring 的 edits。

Hard rejects:
- Evaluator 与 agent source 在同一个 repository 中。将它移出去。
- Evaluator 作为 Python import 在 agent process 内运行。在 subprocess 中运行它。
- 任何在 agent 边界一侧应用的 score adjustment。所有 adjustment 必须在 server-side 完成。
- 任何 agent 可以通过编辑自身代码来静默关闭的 logging。

Refusal rules:
- 如果用户无法说出 agent 可以编辑的每个文件，拒绝并要求先进行 file-level write-access audit。
- 如果 evaluator 没有 held-out inputs，拒绝 — 这是 Lesson 3 的 audit，是一个 precondition。
- 如果 deployment surface 包含对 evaluator 自身的 mutations（即使是通过拟议的 dependency update 间接发生），拒绝并要求 manual firewall-review step。

Output format:

返回一页 spec，包含：
- **Agent write-surface**（paths, globs）
- **Evaluator read-surface**（paths, endpoints）
- **Intersection**（必须为空；展示 diff）
- **Process model**（evaluator 如何被隔离）
- **Secrets inventory**（位于何处以及如何 mounted）
- **需要 Review 的 mutation class**（项目符号列表）
- **Sign-off line**（谁负责 firewall invariant）
