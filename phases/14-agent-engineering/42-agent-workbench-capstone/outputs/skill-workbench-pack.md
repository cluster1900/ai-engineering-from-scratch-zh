---
name: workbench-pack
description: 生成一个按项目调优、可直接接入的 agent workbench pack —— 规则根据团队历史进一步收紧，scope globs 与 repo 匹配，rubric 维度扩展一个领域专属条目。
version: 1.0.0
phase: 14
lesson: 42
tags: [capstone, workbench-pack, installer, schemas, drop-in]
---

给定一个 repo、团队的事故历史，以及运行在其中的 agent 产品，输出一个经过调优的 agent-workbench-pack 和一个 installer。

产出：

1. `agent-workbench-pack/` 目录，匹配标准布局：AGENTS.md、docs/、schemas/、scripts/、bin/、README.md、VERSION。
2. 一个 `bin/install.sh`，在没有 `--force` 的情况下拒绝覆盖已有 pack，并把 `.workbench-version` 写入目标 repo。
3. `agent-rules.md`（每个类别至少有一条规则来自团队最近六次事故）、`reviewer-rubric.md`（包含第六个领域维度）和 `scope_contract.schema.json`（包含项目特定 globs）的项目调优版本。
4. 一个 `lint_pack.py` 脚本，当 scripts 与 schemas 之间，或 VERSION 与 schemas 的 `schema_version` 之间出现漂移时失败。
5. 可选的 CI 集成：在 demo branches 上安装 pack，并针对一个已知良好的任务运行 verification gate。

硬性拒绝：

- pack 中包含项目特定任务。任务应存在于目标 repo 的 board 上。
- pack 绑定到单一 vendor SDK。只能是 framework-agnostic；SDK wiring 是目标 repo 的工作。
- installer 修改 state files。installer 是幂等的、仅作用于表层；state 属于 agent 和 humans。
- 规则没有对应的 check function。愿景式规则属于 onboarding，而不属于 pack。

拒绝规则：

- 如果事故历史为空，拒绝发布经过调优的 `agent-rules.md`。使用标准默认版本，并暴露这个缺口。
- 如果目标 repo 的 CI 与安装不兼容（没有 `.github/workflows/`，也没有等价机制），拒绝可选 CI 步骤，并记录手动路径。
- 如果团队使用 pack 的私有 fork，拒绝编写公开 installer。私有 installer 携带私有不变量。

输出结构：

```
agent-workbench-pack/
├── AGENTS.md
├── docs/
├── schemas/
├── scripts/
├── bin/install.sh
├── lint_pack.py
├── VERSION
└── README.md
```

最后以 "what to read next" 指向：

- Lesson 41：这个 pack 所改进的前后对比 benchmark。
- Lesson 30（Eval-Driven Agent Development）：消费这个 pack verdicts 的 eval loop。
- [SkillKit](https://github.com/rohitg00/skillkit)：用于在 32 个 AI agents 之间分发这个 pack。
