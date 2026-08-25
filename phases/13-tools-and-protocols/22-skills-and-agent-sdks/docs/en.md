# Agent Skills：可移植契约与 Runtime 边界

> Skill 并不是一个文件名更好看的长 Prompt。它是一组可被发现的指令、资源和可执行辅助程序，通过 runtime 契约进入 Agent 的 Context。

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 01（Tool Interface），Phase 13 · 05（Tool Schema Design）
**Time:** ~90 分钟

## 学习目标

- 定义 Agent Skill，并避免将其与 Prompt、repository instructions、Tool、Hook、subagent 或 plugin 混淆。
- 阅读可移植的 `SKILL.md` 契约，并将其与 runtime 特定扩展区分开来。
- 将发现、选择、激活、资源加载、Tool 使用和验证解释为不同的生命周期阶段。
- 在 runtime 将 Skill package 放入 Agent catalog 之前对其进行验证。
- 针对具体任务，在 Skill、MCP Tool、Hook、subagent 或普通代码之间作出选择。

## 十分钟首次成功体验

请在阅读详细讲解之前完成这部分。你将创建一个小型 Skill，将完整的 reviewer bundle 安装到真实的 Agent host 中，调用它、验证结果，然后将其移除。这个过程会通过可观察的结果证明整个生命周期。

### 真实 host 实验的预检

真实 host 检查点需要 Node.js、`npx`、Python 3、一个选定的支持 Skill 的 host，以及你在安装程序中所选项目 scope 或用户 scope 的写入权限。首先验证本地命令：

```bash
node --version
npx --version
python3 --version
```

安装前，确定要使用的 host 和 scope。如果缺少任何要求，请在网站上阅读本课程，或继续完成下面的手动 package 练习。这个 fallback 会讲解契约，但无法证明 host discovery、invocation、bundle script execution 或 uninstall behavior。将这些观察结果标记为待验证。

### 1. 从空工作目录开始

在任何用于存放学习内容的父目录中运行以下命令：

```bash
mkdir -p agent-skills-first-run
cd agent-skills-first-run
TARGET_ROOT="$(pwd -P)"
printf 'TARGET_ROOT=%s\n' "$TARGET_ROOT"
ls -A
```

最后一个命令不应输出任何内容。如果它输出了文件，请选择另一个空目录，以便为审查提供清晰的边界。

为你的第一个 Skill 创建目录：

```bash
mkdir -p my-first-skill
```

使用以下内容创建 `my-first-skill/SKILL.md`：

```markdown
---
name: my-first-skill
description: 当用户要求记录技术决策时，将粗略的会议笔记整理为简洁的决策记录。
---

# 决策记录

提取决策、Context、替代方案、负责人和下次审查日期。
如果笔记中不包含决策，请提出一个澄清问题，而不要虚构决策。
```

验证文件是否已创建在预期目录中：

```bash
test -f my-first-skill/SKILL.md
```

没有输出且退出码为 0，表示文件存在。

### 2. 安装完整的 reviewer bundle

留在 `agent-skills-first-run` 中并运行：

```bash
npx skills add rohitg00/ai-engineering-from-scratch --skill skill-contract-reviewer --full-depth
```

选择你正在使用的 Agent host 和 scope。安装程序应列出 `skill-contract-reviewer` 以及写入的目标位置。必须使用 `--full-depth`，因为本课程的 Skill 是一个嵌套 bundle，其中包含 references、script 和 asset。

将 `SKILL_ROOT` 设置为安装程序报告的绝对目录。它必须是包含已安装 `SKILL.md` 的目录，而不是课程源目录，也不是当前 workspace：

```bash
# 将占位符替换为安装程序输出的目标位置。
SKILL_ROOT="$(cd "/absolute/path/to/skill-contract-reviewer" && pwd -P)"
test -f "$SKILL_ROOT/SKILL.md"
printf 'SKILL_ROOT=%s\n' "$SKILL_ROOT"
```

如果 Agent session 已经打开，请启动一个新 session，或使用该 host 的 Skill rescan 命令。不要假设每个 host 都会热重载其 catalog。

### 3. 显式调用

在已安装的 Agent 中，将 `agent-skills-first-run` 作为工作目录，并使用该 host 支持的语法：

| Host | 显式调用 |
|---|---|
| Codex | 使用 `skill-contract-reviewer`，或从 `/skills` 中选择它，然后提供审查请求 |
| Claude Code | 在审查请求前添加 `/skill-contract-reviewer` |
| 可移植 fallback | `使用 skill-contract-reviewer 审查目标 package。` |

在请求中使用为 `SKILL_ROOT` 和 `TARGET_ROOT` 输出的绝对值。要求 host 在执行前展开这些值并显示解析后的准确命令，而不是显示依赖进程工作目录的命令：

```text
使用 skill-contract-reviewer 审查 <TARGET_ROOT>/my-first-skill。已安装的 bundle 根目录是 <SKILL_ROOT>。运行 python3 <SKILL_ROOT>/scripts/check_skill.py <TARGET_ROOT>/my-first-skill。运行前，显示完全解析后的 argv。返回验证报告、选定的 primitive，并为每个选择提供一句说明。将解析后的 script 路径、解析后的目标路径、cwd、argv 和退出码作为执行证据。
```

解析后的命令应具有以下形式，且不得残留占位符：

```bash
python3 "/absolute/install/path/skill-contract-reviewer/scripts/check_skill.py" \
  "/absolute/workspace/path/agent-skills-first-run/my-first-skill"
```

成功的结果应同时满足以下三个条件：

1. host 能够通过名称找到 `skill-contract-reviewer`。
2. reviewer 会读取 package 契约并运行其 bundle validator。
3. 响应包含验证报告，示例中没有结构性错误，并给出有依据的 primitive 选择。

执行证据还必须列出 script 路径、目标路径、cwd、准确的参数 Vector 和退出码。缺少这些字段的流畅报告无法证明已安装的 companion script 确实运行过。

如果 host 报告该 Skill 不可用，请检查安装目标位置，执行一次 rescan 或重启，然后重试显式请求。不要通过重写 Skill description 来掩盖安装失败。

### 4. 探测隐式选择

开始一个新的 Agent turn，并在不指名 Skill 的情况下输入相同任务：

```text
将 <TARGET_ROOT>/my-first-skill 作为可复用的 Agent package 进行审查，并告诉我它的 package 契约是否有效。
```

如果 host 会公开选定的 Skills，请记录它是否选择了 `skill-contract-reviewer`。如果 host 不公开 routing，请将隐式选择标记为未验证。显式调用是可移植 fallback。

### 5. 清理

仅移除已安装的 reviewer bundle：

```bash
npx skills remove skill-contract-reviewer
```

选择安装时使用的同一 host 和 scope。执行 rescan 或启动新 session 后，显式请求 `skill-contract-reviewer` 应报告该 Skill 不可用。保留 `my-first-skill` 供后续课程使用，或者在完成本学习路线后移除实验目录。

## 问题

假设你的团队拥有一套可靠的发布工作流。它会查找已合并的变更、检查迁移说明、更新 changelog、运行打包命令并生成审查清单。

将该工作流放进一个 Prompt，复制起来很容易，实际运作却很困难。这个 Prompt 没有稳定身份、discovery rule、resource boundary、可测试的 package 结构，也无法回答一些基本问题：谁可以调用它？Model 应在什么时候选择它？它可以运行哪些 script？哪些文件可信？Context 被压缩后，哪些内容仍然存在？

另一个相反的错误，是将每条可复用指令都视为 Skill。repository conventions、确定性自动化、外部 Tools、事件 Hooks 和委派的 Agents 解决的是不同问题。把它们全都塞进 `SKILL.md`，只会得到一个看似可移植、实则依赖某个 host 未记录行为的目录。

第一个工程任务是分类。在决定如何打包之前，先确定这个 artifact 究竟是什么。

## 概念

### Skills 编码过程性知识

Agent Skill 是一个以 `SKILL.md` 为入口的目录。入口文件包含 YAML frontmatter，后面跟随 Markdown 指令。目录还可以包含 references、scripts 和 assets。

```figure
skill-package-anatomy
```

可部署单元是整个目录，而不仅仅是 Markdown 文件。即使 frontmatter 能够解析，缺少 references 的 `SKILL.md` 副本仍然是损坏的 package。

### 相邻抽象

| Artifact | 主要职责 | 何时加载或运行 | 不应冒充什么 |
|---|---|---|---|
| Prompt | 塑造一次 Model 交互 | 由应用或用户包含 | 带有资源、具备版本管理的 package |
| Repository instructions | 说明一个代码库的常驻规则 | 编码 runtime 进入该 scope 时 | 可复用的任务工作流 |
| Agent Skill | 提供可复用的过程性知识 | 显式或隐式激活时 | 严格的授权边界 |
| MCP Tool | 公开带类型的远程能力 | Model 或应用调用时 | 详细的操作流程 |
| Hook | 在事件发生时运行确定性逻辑 | 声明的事件发生时 | 概率性的 Model routing |
| Subagent | 使用独立 Context 和状态委派工作 | orchestrator 创建或调用时 | 静态指令 bundle |
| Plugin | 分发更大型的 runtime 扩展 | host 安装或启用时 | 可移植 Skill 契约本身 |
| Learned skill library | 存储通过经验发现的行为 | policy 检索以前的程序或轨迹时 | 基于标准的 `SKILL.md` package |

发布 Skill 可以告诉 Agent 如何检查一次发布。MCP server 可以公开 release registry。Hook 可以禁止直接 push。subagent 可以独立审计候选版本。这些部分能够组合，是因为它们各自承担不同的职责。

### “skill”一词指代两种不同概念

研究系统有时会将学到的程序、成功轨迹或特定环境下的 policy fragment 称为 skill。Agent 可以在探索期间创建这些 artifacts，依据任务相似度检索它们，执行它们，并根据反馈修订 library。Phase 14 · 10 将构建这种终身学习 library。

本小型学习路线中的 Agent Skill 与之不同。它是一个人工编写的 package，具有明确声明的文件系统契约、catalog metadata、progressive disclosure、由 runtime 中介的 invocation，以及由 host 控制的 Tools。它可以由 Agent 生成或改进，但这种格式并不要求具备学习过程。

| 维度 | Agent Skill package | Learned skill library |
|---|---|---|
| 主要单元 | `SKILL.md` 目录 | 程序、policy、轨迹或 memory record |
| 创建方式 | 编写、生成或整理 | 通常从环境经验中发现 |
| 选择方式 | Catalog description 加 runtime policy | 根据任务状态进行检索或应用 policy |
| 执行方式 | Model 遵循指令并调用 host Tools | 环境运行已存储的行为或代码 artifact |
| 可移植性 | Package 契约可以跨兼容 host 使用 | 通常绑定到某个环境和 action space |
| Evaluation | Routing、artifact、安全性和 host 兼容性 | reward、成功率、迁移能力和 library 增长 |

这两个概念都在打包可复用能力。不能仅仅因为名称相同，就让它们共享实现层面的论断。

### 可移植核心

Agent Skills specification 要求两个 frontmatter 字段：

```yaml
---
name: release-readiness
description: 当用户询问某个版本是否已准备好发布时，检查 release candidate。
---
```

`name` 是稳定标识符。它必须满足 specification 的命名规则，并与父目录匹配。`description` 既是文档，也是 routing metadata。它应说明 Skill 的作用及其适用时机。

可移植的可选字段包括：

| 字段 | 用途 | 可移植性说明 |
|---|---|---|
| `license` | 声明 package 的许可条款 | 核心 specification |
| `compatibility` | 声明环境要求 | 核心 specification |
| `metadata` | 携带值为字符串的扩展数据 | 核心 specification |
| `allowed-tools` | 建议预先批准的 Tools | 实验性字段；不同 host 的支持情况不同 |

Markdown body 保存操作指令。它应定义工作流、决策点、失败行为，以及支持资源的直接路径。

```markdown
# 发布就绪检查

将此工作流用于 release candidate，而不是普通的开发 build。

1. 阅读 `references/release-policy.md`。
2. 运行 `python3 scripts/inspect_release.py --format json`。
3. 如果报告包含阻断性失败，请停止。
4. 根据 `assets/release-checklist.md` 生成检查清单。
5. 执行任何发布或 tag 操作前，请先请求批准。
```

### Runtime 扩展是第二层

某些 host 接受额外的 frontmatter 或 companion configuration。这些字段可能很有用，但不会自动具备可移植性。

| 行为 | Host 扩展示例 | 可移植核心？ |
|---|---|:---:|
| 对 Model routing 隐藏 Skill，同时保留用户直接调用能力 | `disable-model-invocation` | 否 |
| 从用户命令菜单中隐藏 Skill，同时允许 Model routing | `user-invocable` | 否 |
| 在命令菜单中显示参数帮助 | `argument-hint` | 否 |
| 在委派的 Context 中运行 Skill | `context`, `agent` | 否 |
| 固定 Model 或 reasoning 设置 | `model`, `effort` | 否 |
| 注册生命周期自动化 | `hooks` | 否 |
| 在 Codex 中禁用隐式调用 | `agents/openai.yaml` policy | 否 |

将每个扩展视为 adapter。确保核心工作流在没有它的情况下仍然有效，记录 fallback，并测试使用该扩展的 host。Runtime 可能忽略未知字段、拒绝它，或者保留该字段但不实现对应行为。

### Frontmatter 是可执行 metadata

Metadata 会在 Skill body 被读取之前改变系统行为。

- 格式错误的 `name` 可能导致 discovery 失败。
- 含糊的 `description` 可能将错误的请求 routing 到该 Skill。
- 仅供人类使用的标志可能会将 Skill 从 Model 的 catalog 中移除。
- Tool allowance 可能改变 host 是否请求权限。
- Context 设置可能将执行移入单独的 Agent session。

像审查配置代码一样审查 frontmatter。验证它、对它进行版本管理，并将它的行为纳入 evals。

### Skill 生命周期

```figure
skill-runtime-lifecycle
```

每条箭头都是一个边界，各自具有不同的失败模式。

1. **Discovery** 在已配置的位置中查找可能的 packages。
2. **Validation** 在发布到 catalog 之前拒绝格式错误或不安全的 packages。
3. **Cataloging** 公开精简的 `name` 和 `description`，而不是完整 package。
4. **Selection** 判断 Skill 是否相关。
5. **Activation** 将 body 加载到 Model 可见的 Context 中。
6. **Disclosure** 仅在某个分支需要时读取 references 或 assets。
7. **Execution** 在 host 的权限和隔离规则下使用 host Tools。
8. **Verification** 独立于 Model 的声明，对生成的 artifact 进行检查。

将这些阶段混为一谈会形成错误的心智 Model。已被发现的 Skill 并不等于已激活。已激活的 Skill 并不代表它有权执行其中描述的一切操作。获准的 Tool 调用也不能证明结果正确。

### Skills 与 Tools 相互正交

MCP 回答的是：“这个应用可以调用哪些能力，它们的 schema 是什么？”Skill 回答的是：“Agent 应该如何处理这类任务？”

```figure
skill-tool-orthogonality
```

Skill 可以指名某个 Tool，但实际的 capability registry 由 host 管理。如果缺少该 Tool，Skill 应声明 fallback 或明确失败。它绝不能暗示仅仅指名某项能力就能创建该能力。

### Skills 与 repository instructions 具有不同 scope

Repository instructions 描述你已经身处其中的环境：命令、约定、生成文件和边界。Skill 为可能出现在多个 repositories 中的任务提供可复用流程。

当两者同时适用时，当前用户请求和 repository rules 会约束 Skill。通用的重构 Skill 不得覆盖禁止编辑生成文件的 repository rule。

### Skills 不会相互 import

一个 Skill 可以指示 Agent 调用另一个 Skill，但这并不是语言层面的 import。第二个 Skill 仍然需要经过 runtime discovery、eligibility、activation、权限和 Context 处理。

将跨 Skill 依赖编写为可观察的工作流边：

```markdown
生成候选 changelog 后，调用 `release-risk-review` Skill。
传入候选文件路径，并要求返回阻断或非阻断结论。
如果该 Skill 不可用，请停止并报告缺少的依赖。
```

这会使依赖变得可测试，并让 host 有机会执行 policy。

## 动手构建

`code/main.py` 实现了一个面向标准的小型 validator 和 artifact chooser。它仅使用 stdlib，因此每条规则都清晰可见。

Validator 公开：

- `parse_frontmatter(text)`，用于分离 metadata 和 body。
- `validate_skill_text(text, directory_name, allowed_runtime_extensions=())`，用于检查必填字段、命名、未知扩展、body 是否存在以及可移植限制。
- `ValidationIssue` 和 `SkillReport`，用于返回结构化证据，而不是一个含义不透明的布尔值。
- `FrontmatterSyntaxError`，用于表示无法安全解释的输入。

Chooser 公开 `TaskShape` 和 `select_primitives(task)`。它会将任务需求映射到普通代码、repository instructions、Skill、Hook、subagent 或 MCP Tool。

运行实验：

```bash
cd "$(git rev-parse --show-toplevel)"
cd phases/13-tools-and-protocols/22-skills-and-agent-sdks
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

此命令块需要本地 clone，并且必须从该 clone 内的任意位置开始执行，以便 `git rev-parse --show-toplevel` 能够解析 repository 根目录。

Demo 会为一个有效的可移植 Skill、一个带 host 扩展的 Skill、一个无效 package 以及若干任务形态决策输出 JSON。检查 issue code。Package validator 应说明如何修复 artifact，而不是替作者猜测意图。

### 验证顺序很重要

先验证成本较低的结构性事实，再检查更深层的内容规则：

```figure
skill-validation-order
```

这个顺序可以防止次生错误掩盖第一个被破坏的不变量。

## 实际应用

编写 Skill 前，填写以下决策卡：

| 问题 | 如果答案为是 | 可能的 primitive |
|---|---|---|
| 是否需要跨多个步骤复用 Model 判断？ | 流程稳定，但决策会变化 | Skill |
| 每次事件触发时都必须执行吗？ | 漏掉一次执行都不可接受 | Hook 或应用代码 |
| Model 是否需要带有类型化输入的外部能力？ | 操作位于 Model Context 之外 | Tool 或 MCP server |
| 工作是否需要隔离的 Context、状态或所有权？ | 独立 worker 返回范围明确的结果 | Subagent |
| 这些指引是否只适用于某个 repository？ | 它描述本地命令和约束 | Repository instructions |
| 一次交互是否足够？ | 不需要 package 生命周期 | Prompt |

许多生产工作流会使用多行对应的 primitive。这张卡可以防止单个 artifact 假装具备所有属性。

## 交付成果

本课程会在 `outputs/` 下生成 `skill-contract-reviewer` bundle。其中包含：

- 一个用于审查候选 Skill package 的可移植 `SKILL.md`；
- 用于检查可移植契约和 primitive 选择的参考清单；
- 一个确定性验证 script；
- 覆盖 Prompts、Skills、Tools、Hooks、普通代码和 subagents 的任务形态 fixtures。

安装完整 bundle，而不只是入口文件：

```bash
cd "$(git rev-parse --show-toplevel)"
python3 scripts/install_skills.py /tmp/aiefs-skills --phase 13 --type skill
```

课程安装程序会报告复制的每个 Phase 13 Skill，并写入 `/tmp/aiefs-skills/manifest.json`。这个干净的目标位置用于检查 package 结构；上面的首次成功循环用于检查真实 host 中的 discovery 和 invocation。

后续课程会深入讲解生命周期的各个阶段。Lesson 24 构建 discovery 和 progressive disclosure。Lesson 25 构建 invocation policy 和 routing。Lesson 26 将权限与 sandboxing 分离。Lesson 27 将整个 package 转变为经过 Evaluation 的发布 artifact。

## 练习

1. 使用 `TaskShape` 对你团队中的五种工作流进行分类。对于每个选择了多个 primitive 的案例，说明理由。
2. 添加边界测试，证明包含 500 个字符的 `compatibility` 值可以通过，而包含 501 个字符的值会因 specification error 而失败。
3. 向 allowlist 添加一个 runtime extension。编写测试，证明同一个文件仍然可以与仅包含可移植字段的 Skill 区分开来。
4. 将一个 400 行的 Prompt 拆分为 `SKILL.md`、一个 reference、一个 script contract 和一个输出模板。确保每个文件只负责一种信息。
5. 为引用了不可用 MCP Tool 的 Skill 设计失败响应。不要静默地用权限更广的 Tool 进行替代。
6. 审查一个现有 Skill，并将每个句子标记为 routing、procedure、policy、reference pointer 或 output contract。移动所有不属于当前位置的内容。

## 关键术语

| 术语 | 人们常说什么 | 实际含义 |
|---|---|---|
| Agent Skill | “保存下来的 Prompt” | 一个可被发现的目录，其中包含过程性指令和可选资源 |
| Portable core | “每个 runtime 都共享的字段” | Agent Skills specification 所定义的契约 |
| Runtime extension | “额外的 frontmatter” | 特定于 host 的配置，其行为需要兼容的 adapter |
| Activation | “Skill 已经运行” | Skill body 已进入 Model 可见的 Context；Execution 可能稍后才会发生 |
| Skill dependency | “Import 另一个 Skill” | 一个由 runtime 中介的调用边，其中包含可用性和 policy 检查 |
| Tool contract | “函数 schema” | 一项能力的输入、输出、权限、副作用、错误和证据 |

## 延伸阅读

- [Agent Skills specification](https://agentskills.io/specification)：了解可移植目录和 frontmatter 契约。
- [Agent Skills best practices](https://agentskills.io/skill-creation/best-practices)：了解 scope、指令和资源组织方式。
- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills)：了解当前 Codex discovery 和 invocation 行为。
- [Claude Code skills](https://code.claude.com/docs/en/skills)：了解一种 runtime 的 invocation、参数、Tool 和委派 Context 扩展。
