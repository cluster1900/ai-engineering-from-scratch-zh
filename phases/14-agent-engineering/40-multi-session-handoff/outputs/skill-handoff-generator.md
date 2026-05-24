---
name: handoff-generator
description: 从 workbench artifacts 生成会话结束交接包，同时产出面向人的 Markdown 和面向机器的 JSON，并按七个规范字段组织。
version: 1.0.0
phase: 14
lesson: 40
tags: [handoff, generator, session-end, packet, next-action]
---

给定一个 workbench（state、verdict、review、feedback log、diff），产出一个接入 Agent runtime 的会话结束交接生成器。

产出：

1. `tools/generate_handoff.py`，暴露 `generate_handoff(snapshot) -> (markdown, payload)`。
2. `outputs/handoff/<session_id>/handoff.md` 和 `handoff.json`。
3. `handoff.schema.json`，覆盖七个必需字段和 feedback tail 格式。
4. 会话结束 hook 脚本：运行生成器，并在任何字段缺失时拒绝关闭会话。
5. `docs/handoff.md`，列出七个字段、它们的来源以及裁剪策略。

硬性拒绝项：

- 没有 `next_action` 的 handoff。伪装成 handoff 的状态报告会污染下一次会话。
- 手写 summary 的生成器。Agent 的职责是把 workbench 留在可生成的状态。
- 与 JSON 不一致的 Markdown 包。JSON 是源；Markdown 是 JSON 的渲染结果。
- 超过 30 条的 feedback tail。完整日志在 version control 中；交接包必须保持精简。

拒绝规则：

- 如果 verification report 缺失，拒绝生成交接包。没有 verdict 的 handoff 只是愿望。
- 如果 review report 缺失且预期需要 human reviewer，拒绝并要求先完成 review pass。
- 如果 diff summary 为空但会话运行超过 5 分钟，生成前暴露该异常；应怀疑会话卡住，而不是真正的 no-op。

输出结构：

```
<repo>/
├── outputs/handoff/<session_id>/
│   ├── handoff.md
│   └── handoff.json
├── tools/generate_handoff.py
├── handoff.schema.json
└── docs/handoff.md
```

以 "what to read next" 结尾，指向：

- Lesson 41：在真实风格示例 app 上进行端到端练习。
- Lesson 42：把生成器打包进 capstone workbench pack。
- Lesson 29（Production Runtimes）：将 session-end 接入 queue、event 和 cron 触发器。
