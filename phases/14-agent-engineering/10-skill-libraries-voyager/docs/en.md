# Skill 库与终身学习 (Voyager)

> Voyager (Wang et al., TMLR 2024) 将可执行代码视为一种 Skill。Skill 具备命名、可检索、可组合的特性，并通过环境反馈持续改进。这是 Claude Agent SDK skills、skillkit，以及 2026 skill-library 模式的参考架构。

**类型：** Build
**语言：** Python (stdlib)
**先修：** Phase 14 · 07 (MemGPT), Phase 14 · 08 (Letta Blocks)
**时间：** ~75 分钟

## 学习目标

- 说出 Voyager 的三个组件：automatic curriculum、skill library、iterative prompting，并说明各自的作用。
- 解释为什么 Voyager 将动作空间设计为代码，而不是原始命令。
- 使用 stdlib 实现一个支持注册、检索、组合和由失败驱动改进的 Skill 库。
- 将 Voyager 的模式映射到 2026 Claude Agent SDK skills 与 skillkit 生态系统。

## 问题

每个 session 都从零重建所有能力的 agent，会犯三类错误：

1. **浪费 Token。** 每个任务都会重新引出同样的推理。
2. **丢失进展。** session A 中学到的修正不会迁移到 session B。
3. **无法处理长程组合。** 复杂任务需要能力层级；one-shot prompt 无法表达它们。

Voyager 的答案是：将每个可复用能力视为一段存储在库中的命名代码块，可通过相似度检索，可与其他 Skill 组合，并通过执行反馈不断改进。

## 概念

### 三个组件

Voyager (arXiv:2305.16291) 围绕以下内容组织 agent：

1. **Automatic curriculum。** 由好奇心驱动的 proposer 会根据 agent 当前的 Skill 集和环境状态选择下一个任务。探索是自底向上的。
2. **Skill library。** 每个 Skill 都是可执行代码。任务成功后会添加新的 Skill。Skill 通过 query-to-description 相似度进行检索。
3. **Iterative prompting mechanism。** 失败时，agent 会接收执行错误、环境反馈和自验证输出，然后改进该 Skill。

Minecraft 评估（Wang et al., 2024）：相比 baseline，独特物品多 3.3 倍，stone tools 快 8.5 倍，iron tools 快 6.4 倍，地图遍历距离长 2.3 倍。这些数字是 Minecraft 特定的，但模式可以迁移。

### 动作空间 = 代码

大多数 agent 输出原始命令。Voyager 输出 JavaScript 函数。一个 Skill 是：

```
async function craftIronPickaxe(bot) {
  await mineIron(bot, 3);
  await mineStick(bot, 2);
  await placeCraftingTable(bot);
  await craft(bot, 'iron_pickaxe');
}
```

由子 Skill 组合而成。按 description 和 Embedding 作为 key 存储。作为程序被检索，而不是作为 prompt。

这就是 2026 Claude Agent SDK skill：一段具名、可检索的代码，再加上 agent 按需加载的说明。

### Skill 检索

新任务是“make a diamond pickaxe”。Agent：

1. 对任务 description 进行 Embedding。
2. 查询 Skill 库，获取 top-k 相似 Skill。
3. 检索 `craftIronPickaxe`、`mineDiamond`、`placeCraftingTable` 等。
4. 用检索到的原语 + 新逻辑组合新的 Skill。

这就是 MCP resources（Phase 13）和 Agent SDK skills 实现的模式：在知识/代码表面上进行检索，并限定在当前任务范围内。

### 迭代改进

Voyager 的反馈循环：

1. Agent 编写一个 Skill。
2. Skill 在环境中运行。
3. 返回三种信号之一：`success`、`error`（带 stack trace）、`self-verification failure`。
4. Agent 使用该信号作为上下文重写 Skill。
5. 循环直到成功或达到最大轮数。

这是 Self-Refine（Lesson 05）应用于代码生成，并用环境落地验证。CRITIC（Lesson 05）是同一模式，只是用外部工具作为 verifier。

### Curriculum 与探索

Voyager 的 curriculum module 会根据 agent 已拥有什么、还没有做过什么，提出类似“build a shelter near the lake”的任务。proposer 使用环境状态 + Skill inventory 来选择略高于当前能力的任务，也就是探索的最佳区间。

对生产 agent 来说，这会转化为一个“what's missing” operator：给定当前 Skill 库和一个 domain，我们还没有覆盖哪些 Skill？团队通常通过 curriculum review 手动实现这一点。

### 这种模式容易出错的地方

- **Skill library rot。** 同一个 Skill 被用略有不同的 description 添加 10 次。写入时添加去重；检索只返回一个。
- **Composed-skill drift。** 父 Skill 依赖一个后来被改进的子 Skill。给 Skill 做版本化；固定到 v1 的父 Skill 不会自动拿到 v3。
- **Retrieval quality。** 随着 Skill 库增长到几百个以上，基于 Skill description 的 Vector retrieval 会退化。用 tag filter 和硬约束补充（“only skills with `category=tooling`”）。

```figure
voyager-skills
```

## 构建它

`code/main.py` 实现了一个 stdlib Skill 库：

- `Skill` — name、description、code（字符串）、version、tags、dependencies。
- `SkillLibrary` — register、search（token overlap）、compose（依赖的拓扑排序）和 refine（更新时 version bump）。
- 一个脚本化 agent：注册三个原始 Skill，组合第四个，遇到一次失败，然后改进。

运行：

```
python3 code/main.py
```

trace 会展示库写入、检索、组合、一次失败执行，以及 v2 改进，也就是 Voyager 循环的端到端过程。

## 使用它

- **Claude Agent SDK skills** (Anthropic) — 2026 参考：每个 Skill 都有 description、code 和 instructions；在 agent session 中按需加载。
- **skillkit** (npm: skillkit) — 面向 32+ AI coding agents 的跨 agent Skill 管理。
- **Custom skill libraries** — 领域特定（例如 data agent 的 SQL skills、infra agent 的 Terraform skills）。Voyager 模式可以缩小应用。
- **OpenAI Agents SDK `tools`** — 低配版本；每个 tool 都是轻量 Skill。

## 交付它

`outputs/skill-skill-library.md` 会生成一个 Voyager 形态的 Skill 库，为任意目标 runtime 接好注册、检索、版本化和改进。

## 练习

1. 给 `compose()` 添加依赖环检测器。当 Skill A 依赖 B，而 B 又依赖 A 时会发生什么？error 还是 warning？
2. 实现每个 Skill 的版本固定。当父 Skill 组合子 Skill `crafting@1` 时，对 `crafting@2` 的改进不能静默升级父 Skill。
3. 将 token-overlap retrieval 替换为 sentence-transformers embeddings（或 BM25 stdlib 实现）。在一个 50-Skill toy library 上测量 retrieval@5。
4. 添加一个“curriculum” agent：给定当前库和一个 domain description，提出 5 个缺失 Skill。每周调用一次。
5. 阅读 Anthropic 的 Claude Agent SDK skill docs。将 toy library 移植到 SDK 的 skill schema。可发现性发生了什么变化？

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Skill | “可复用能力” | 带有 description 的命名代码块，可通过相似度检索 |
| Skill library | “agent 的 how-to 记忆” | Skill 的持久化存储，可搜索、可组合 |
| Curriculum | “任务 proposer” | 由当前能力缺口驱动的自底向上目标生成器 |
| Composition | “Skill DAG” | Skill 调用 Skill；执行时进行拓扑排序 |
| Iterative refinement | “自我修正循环” | Env 反馈 + 错误 + 自验证，会折回到下一个版本中 |
| Action-space-as-code | “程序化动作” | 输出函数，而不是原始命令，用于时间跨度更长的行为 |
| Dedup on write | “Skill collapse” | 近重复 description 会合并为一个 canonical Skill |

## 延伸阅读

- [Wang et al., Voyager (arXiv:2305.16291)](https://arxiv.org/abs/2305.16291) — 原始 Skill-library 论文
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) — skills 的 2026 产品化形态
- [Anthropic, Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) — 实践中的 skills 与 subagents
- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) — Voyager 底层的改进循环
