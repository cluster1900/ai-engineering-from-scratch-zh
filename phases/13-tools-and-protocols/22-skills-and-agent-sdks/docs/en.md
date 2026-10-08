# Agent Skills：可移植契约与运行时边界

> Skill 绝非仅仅是换了个更好文件名的长 prompt。它是一个包含了指令、资源和可执行辅助工具的可发现程序包，依照明确的运行时契约载入 agent 的上下文。

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 01 (The Tool Interface), Phase 13 · 05 (Tool Schema Design)
**Time:** ~90 minutes

## 学习目标

- 明确定义 Agent Skill，不将其与 prompt、代码库规范文件（repository instructions）、tool、hook、subagent 或 plugin 混淆。
- 研读可移植的 `SKILL.md` 契约，并将其与特定运行时的专有扩展清晰解耦。
- 将服务发现（Discovery）、选择（Selection）、激活（Activation）、资源加载（Resource Loading）、工具调用（Tool Use）和验证（Verification）阐释为独立的生命周期阶段。
- 在运行时将 skill 纳入 agent 技能目录前，对其软件包实施严格的静态验证。
- 针对具体工程任务，在 skill、MCP tool、hook、subagent 或普通代码之间做出理性的技术选型。

## 十分钟极速初体验

在阅读深入讲解之前，请先完成此操作。你将亲手创建一个微型 skill，将完整的审查器程序包安装到真实的 agent 宿主环境中，调用它，验证结果，并将其卸载。这能让你通过可观测的结果亲身验证整个生命周期。

### 真实宿主实验前置检查

该真实宿主检查点需要 Node.js、`npx`、Python 3、一个选定支持 skill 的宿主环境，以及对你在安装器中选择的项目或用户作用域拥有写入权限。首先验证本地开发环境工具：

```bash
node --version
npx --version
python3 --version
```

在安装之前，先确定你要使用的宿主和安装作用域。如果缺少上述任何依赖，你可以在网站上阅读本课，或者直接进行下方的软件包手动练习。手动练习同样传授契约规范，但无法直接体验宿主的服务发现、调用、内置脚本执行或卸载行为。

### 1. 从空工作目录开始

在任意用于存放学习项目的父目录下执行：

```bash
mkdir -p agent-skills-first-run
cd agent-skills-first-run
TARGET_ROOT="$(pwd -P)"
printf 'TARGET_ROOT=%s\n' "$TARGET_ROOT"
ls -A
```

最后一条命令应没有任何输出。如果有输出，请更换一个空的目录，以便本次审查拥有干净清晰的边界。

为你的第一个 skill 创建目录：

```bash
mkdir -p my-first-skill
```

创建 `my-first-skill/SKILL.md`，内容如下：

```markdown
---
name: my-first-skill
description: Turn rough meeting notes into a compact decision record when the user asks to capture a technical decision.
---

# Decision record

Extract the decision, context, alternatives, owner, and next review date.
If the notes do not contain a decision, ask one clarifying question instead
of inventing one.
```

验证该文件是否已在目标目录成功创建：

```bash
test -f my-first-skill/SKILL.md
```

无任何输出且退出码为 0 表示文件已存在。

### 2. 安装完整的审查器套件

保持在 `agent-skills-first-run` 目录下并运行：

```bash
npx skills add cluster1900/ai-engineering-from-scratch-zh --skill skill-contract-reviewer --full-depth
```

选择你当前正在使用的 agent 宿主和作用域。安装器会列出 `skill-contract-reviewer` 及其写入的目标位置。必须加上 `--full-depth` 参数，因为本课提供的 skill 是一个包含了 references、脚本和静态资产的嵌套程序包。

将 `SKILL_ROOT` 设置为安装器所报告的绝对路径。它必须是包含已安装 `SKILL.md` 的目录，而不是课程源码目录，也不是当前工作区：

```bash
# 将占位符替换为安装器打印出的绝对路径
SKILL_ROOT="$(cd "/absolute/path/to/skill-contract-reviewer" && pwd -P)"
test -f "$SKILL_ROOT/SKILL.md"
printf 'SKILL_ROOT=%s\n' "$SKILL_ROOT"
```

如果宿主会话此前已经打开，请启动新会话或使用该宿主的 skill 重新扫描命令。不要假定每个宿主都会对技能目录进行热重载。

### 3. 显式调用它

在已安装的 agent 中，以 `agent-skills-first-run` 为工作目录，使用该宿主支持的显式语法：

| 宿主 | 显式调用方式 |
|---|---|
| Codex | 输入 `skill-contract-reviewer`，或从 `/skills` 菜单中选择，然后提交审查请求 |
| Claude Code | 输入 `/skill-contract-reviewer` 紧跟审查请求 |
| 通用可移植回退 | `Use skill-contract-reviewer to review the target package.` |

在请求中使用打印出的 `SKILL_ROOT` 和 `TARGET_ROOT` 绝对路径。要求宿主在执行前将其展开并展示完全解析后的命令，而不是依赖当前工作目录的模糊命令：

```text
Use skill-contract-reviewer to review <TARGET_ROOT>/my-first-skill. The installed bundle root is <SKILL_ROOT>. Run python3 <SKILL_ROOT>/scripts/check_skill.py <TARGET_ROOT>/my-first-skill. Before running it, show the fully resolved argv. Return the validation report, selected primitives, and one sentence for each selection. Include the resolved script path, resolved target path, cwd, argv, and exit code as execution evidence.
```

解析后的命令应当呈现如下结构，不留任何未填充的占位符：

```bash
python3 "/absolute/install/path/skill-contract-reviewer/scripts/check_skill.py" \
  "/absolute/workspace/path/agent-skills-first-run/my-first-skill"
```

成功的审查结果应同时满足以下三个特征：

1. 宿主能按名称准确找到 `skill-contract-reviewer`。
2. 审查器成功读取程序包契约并运行其附带的验证脚本。
3. 返回的响应包含一份验证报告（示例包无结构性错误），并给出有理有据的基本构件选型建议。

执行证据中还必须明确列出脚本路径、目标路径、当前工作目录（cwd）、精确参数数组（argv）以及退出码。一份缺乏这些字段的流畅报告并不能证明附带的配套脚本确实被执行了。

如果宿主报告该 skill 不可用，请核对安装目标路径，重新扫描或重启一次宿主，然后重试显式请求。切勿为了掩盖安装失败而随意改写 skill description。

### 4. 探查隐式选择（Implicit Selection）

开启一个新的 agent turn，输入相同的任务但**不提及**该 skill 的名字：

```text
Review <TARGET_ROOT>/my-first-skill as a reusable agent package and tell me whether its package contract is valid.
```

如果宿主向用户展示了所选用的 skills，记录它是否自动选用了 `skill-contract-reviewer`。如果宿主不暴露路由决策细节，则将隐式选择标记为未验证。显式调用永远是跨宿主的可移植兜底手段。

### 5. 清理环境

仅移除已安装的审查器程序包：

```bash
npx skills remove skill-contract-reviewer
```

选择与安装时相同的宿主和作用域。在重新扫描或新建会话后，显式请求 `skill-contract-reviewer` 应当返回该 skill 不可用。你可以保留 `my-first-skill` 供后续课程使用，也可以在完成该方向的学习后彻底删除实验目录。

## 问题

假设你的团队拥有一套非常可靠的发布上线工作流：找出已合并的改动、检查数据库迁移说明、更新 changelog、执行打包命令，并输出上线审查清单。

如果把这套工作流直接塞进一条长 prompt 中，虽然方便复制粘贴，但在工程化运维上漏洞百出：该 prompt 缺乏稳定的身份标识、没有服务发现规则、缺乏资源加载边界、没有可测试的包结构，并且无法回答一系列基础工程问题：谁有权调用它？模型在什么时候应该选中它？它可以执行哪些脚本？哪些文件是受信任的？在上下文被压缩时，哪些核心规则能够留存？

相反的极端错误，则是把所有可复用的指令一股脑全做成 skill。代码库规范、确定性自动化脚本、外部工具、事件钩子以及被委托的 agent 解决的是截然不同的问题。如果把它们全部打包进 `SKILL.md`，所产生的目录看似具备通用结构，实则深度绑定了某个特定宿主的未公开行为。

软件工程的首要任务是**分类**：在决定如何打包构件之前，先想清楚这个构件究竟是什么。

## 概念

### Skills 封装过程性知识（Procedural Knowledge）

Agent Skill 是一个以 `SKILL.md` 为入口文件的标准目录。该入口文件包含 YAML frontmatter 元数据，紧跟 Markdown 格式的操作指南。该目录还可以按需包含 references（参考资料）、scripts（可执行脚本）与 assets（静态资产）。

```figure
skill-package-anatomy
```

这个**目录**本身——而非单纯的单个 Markdown 文件——才是对外交付部署的最小单元。如果只复制了 `SKILL.md` 却遗漏了引用的资源文件，即便它的 frontmatter 语法完全正确，这也是一个残缺损坏的程序包。

### 临近概念辨析

| 构件类型 | 核心职责 | 何时加载或运行 | 不应被冒充为 |
|---|---|---|---|
| Prompt | 塑造单次模型交互 | 由应用或用户内联引入 | 包含丰富资源的带版本软件包 |
| 代码库规范（Repository instructions） | 阐明某特定代码库的固有通用准则 | 编码运行时进入该作用域时载入 | 可复用的具体任务工作流 |
| Agent Skill | 提供可复用的过程性知识 | 显式或隐式激活时载入 | 强安全隔离边界 |
| MCP Tool | 暴露类型化的远程能力 | 由模型或应用程序主动发起调用时 | 复杂详细的端到端操作步骤 |
| Hook（钩子） | 在特定事件发生时执行确定性逻辑 | 当所声明的事件发生时触发 | 具有概率性的模型自主路由 |
| Subagent（子代理） | 委托具有独立上下文和状态的任务 | 由编排器创建或调用时启动 | 静态的只读指令包 |
| Plugin（插件） | 分发更大规模的运行时功能扩展 | 宿主安装或启用它时生效 | 可移植的 skill 契约本身 |
| 习得的 Skill 库（Learned skill library） | 存储通过实践探索习得的行为沉淀 | 策略检索到先验程序或轨迹时 | 基于规范标准的 `SKILL.md` 软件包 |

发布 skill 可以指导 agent 如何审查发布。MCP server 可以暴露发布注册中心。Hook 可以禁止向 main 分支直接 push 代码。Subagent 可以独立审查候选版本。各组件之所以能够有机组合，正是因为它们各自坚守不同的职责边界。

### “Skill” 一词指向的两种不同理念

在科研领域，“skill” 有时指代习得的程序代码、成功的交互轨迹，或针对特定环境的策略片段。Agent 可以在自主探索中生成这些产物，根据任务相似度检索它们，执行它们，并根据环境反馈更新技能库。Phase 14 · 10 构建的就是这种终身学习技能库。

本系列课程中的 Agent Skill 则截然不同。它是一个手工编写或精选的软件包，具备明确声明的文件系统契约、技能目录元数据、渐进式上下文加载（Progressive Disclosure）、由运行时介导的调用机制，以及受宿主严格掌控的工具权限。它可以由 agent 辅助生成或迭代改进，但其格式本身并不强制依赖强化学习或探索训练。

| 评估维度 | Agent Skill 软件包 | 习得的 Skill 库 |
|---|---|---|
| 基本单元 | 包含 `SKILL.md` 的目录 | 程序代码、策略片段、交互轨迹或记忆记录 |
| 创建方式 | 人工编写、生成或精选策划 | 通常由 agent 在环境交互中自主探索习得 |
| 选用机制 | 依赖目录描述（Description）加运行时策略 | 基于任务状态的向量检索或策略匹配 |
| 执行方式 | 模型遵循 Markdown 指令并调用宿主工具 | 环境直接执行存储的行为逻辑或代码产物 |
| 可移植性 | 程序包契约可在所有兼容的宿主间流通 | 通常与特定环境及特定的动作空间深度绑定 |
| 评测标准 | 路由准确率、制品质量、安全及宿主兼容性 | 强化学习奖励值、任务成功率、泛化能力及库规模 |

这两种理念都在打包可复用的能力，但切勿仅因为它们同名就混淆彼此的工程实现。

### 可移植的核心规范

Agent Skills 规范在 frontmatter 中强制要求两个必填字段：

```yaml
---
name: release-readiness
description: Inspect a release candidate when the user asks whether a version is ready to publish.
---
```

`name` 是稳定标识符，必须符合规范命名约束，且必须与父目录名完全一致。`description` 既是给人类看的文档，又是模型进行语义路由的关键元数据。它必须清晰阐明该 skill **能做什么**以及**何时应当选用它**。

核心规范允许的可选字段包括：

| 字段 | 用途 | 可移植性说明 |
|---|---|---|
| `license` | 声明该程序包的开源或商用许可条款 | 核心标准规范 |
| `compatibility` | 声明环境要求（如 Python 3.10+、特定 CLI 工具等） | 核心标准规范 |
| `metadata` | 携带字符串键值的自定义扩展数据 | 核心标准规范 |
| `allowed-tools` | 建议预先批准的工具列表 | 实验性特性；不同宿主支持度不一 |

Markdown 正文承载操作指南。它应当清晰界定工作流、关键决策分歧点、异常失败处理策略，以及指向配套资源文件的相对路径。

```markdown
# Release readiness

Use this workflow for a release candidate, not for ordinary development builds.

1. Read `references/release-policy.md`.
2. Run `python3 scripts/inspect_release.py --format json`.
3. Stop if the report contains a blocking failure.
4. Produce the checklist from `assets/release-checklist.md`.
5. Ask for approval before any publish or tag action.
```

### 运行时扩展（Runtime Extensions）是第二层

部分宿主允许在 frontmatter 中写入额外字段或关联特定配置文件。这些字段在特定平台上十分有用，但它们并不属于通用可移植标准。

| 行为特性 | 宿主扩展示例 | 属于通用核心规范？ |
|---|---|:---:|
| 对模型自主路由隐藏，但保留用户手动直接调用 | `disable-model-invocation` | 否 |
| 对用户的命令菜单隐藏，但允许模型自主路由选用 | `user-invocable` | 否 |
| 在斜杠命令菜单中展示参数使用提示 | `argument-hint` | 否 |
| 在被委托的隔离子上下文中运行该 skill | `context`, `agent` | 否 |
| 固定模型型号或思考计算等级（Reasoning Effort） | `model`, `effort` | 否 |
| 注册生命周期自动化钩子 | `hooks` | 否 |
| 在 Codex 中禁用隐式调用 | `agents/openai.yaml` 策略 | 否 |

应将每一项专有扩展视为外接适配器。确保即使剥离这些字段，核心工作流依然合法可用；为它们撰写降级回退文档，并在实际消费它们的宿主上完成针对性测试。未知的专有字段可能被运行时直接忽略、报错拒绝，或者仅被原样保留而不执行任何实际行为。

### Frontmatter 是可执行的元数据

元数据在技能正文被模型阅读之前，就已经在改变系统的运行行为了：

- 格式错误的 `name` 会直接导致服务发现失败。
- 含糊不清的 `description` 会导致错误的意图路由。
- 仅限人工调用的标志会将该 skill 从模型的可用技能目录中彻底剔除。
- 工具预授权配置会改变宿主是否弹出用户授权确认框。
- 上下文委托设置会将后续执行重定向到独立的子 agent 会话中。

必须像审查配置文件和业务代码一样严谨地审查 frontmatter。对它进行自动化静态校验，纳入版本控制，并将其路由行为纳入 Eval 评测体系中。

### Skill 的生命周期

```figure
skill-runtime-lifecycle
```

图中的每一个箭头都代表一个带有独立失败模式的边界：

1. **服务发现（Discovery）：** 在预先配置的目录路径中检索可用的程序包。
2. **静态校验（Validation）：** 在向目录暴露之前，坚决拦截格式错误或不安全的程序包。
3. **编目索引（Cataloging）：** 仅向模型上下文暴露精简的 `name` 与 `description`，绝不提前全量加载。
4. **决策选择（Selection）：** 由模型或显式指令判定该 skill 是否与当前任务相关。
5. **按需激活（Activation）：** 将 `SKILL.md` 正文全量载入模型可见的上下文中。
6. **渐进披露（Disclosure）：** 仅在特定分支步骤真正需要时，才读取 references 或 assets。
7. **执行推进（Execution）：** 在宿主的权限审查与沙箱隔离规则下调用各类宿主工具。
8. **结果核验（Verification）：** 独立于模型的自述表态，客观核验最终产出的制品质量。

混淆这些阶段会导致错误的思维模型：被发现的 skill 不等于已被激活；已激活的 skill 不等于获得了它所描述的所有操作权限；单次工具调用被放行不等于最终产出的业务结果是正确的。

### Skills 与 Tools 正交互补

MCP 解决的是：“当前应用程序可以调用哪些外部能力，它们的参数 Schema 是什么？” 而 Skill 解决的是：“Agent 应当如何按部就班地处理这一类任务？”

```figure
skill-tool-orthogonality
```

Skill 正文中可以提及某个 tool 的名字，但实际的工具注册与调用权限完全归属于宿主运行时。若运行环境中缺失该 tool，skill 应当给出明确的降级说明或直接清晰报错，绝不能误以为在文本中提及某个能力就会凭空创造出该工具。

### Skills 与代码库说明（Repository Instructions）属于不同作用域

代码库说明文件（如 `AGENTS.md`）用于描述你**当前所处**的环境：构建命令、编码风格、生成文件规则与安全红线。而 Skill 提供的是跨越多个不同代码库通用的某类任务的标准化操作流程。

当两者同时适用时，用户的即时指令与当前代码库的既有规则拥有更高的优先级，并对 skill 形成约束。例如，一个通用的重构 skill 绝不能凌驾于本地代码库“严禁手动修改自动生成文件”的铁律之上。

### Skills 之间不进行代码级 Import

一个 skill 可以在正文中指导 agent 去调用另一个 skill，但这绝非编程语言层面的代码 `import`。被调用的第二个 skill 依然必须完整经历运行时的服务发现、准入资格审查、动态激活、权限校验以及独立的上下文管理。

在编写跨 skill 依赖时，应当将其表述为可观测的工作流步骤：

```markdown
After producing the candidate changelog, invoke the `release-risk-review` skill.
Pass the candidate path and require a blocking or non-blocking verdict.
If that skill is unavailable, stop and report the missing dependency.
```

这种表述方式使得依赖关系可被明确测试，并赋予宿主运行时执行合规策略的机会。

## 动手构建

`code/main.py` 实现了一个轻量级的标准验证器与构件选型器。全流程仅依赖 Python 标准库，确保每一条规则完全透明可读。

验证器对外暴露：

- `parse_frontmatter(text)`：精准分离元数据与 Markdown 正文。
- `validate_skill_text(text, directory_name, allowed_runtime_extensions=())`：严格校验必填字段、命名约束、未声明扩展、正文存在性以及可移植长度限制。
- `ValidationIssue` 与 `SkillReport`：返回结构化的完备审计证据，而非单一的不透明布尔值。
- `FrontmatterSyntaxError`：针对无法安全解析的非法语法输入快速抛出异常。

选型器对外暴露 `TaskShape` 与 `select_primitives(task)`。它根据任务的实际特征，将其准确映射为普通代码、代码库说明、skill、hook、subagent 或 MCP tool。

运行实验：

```bash
cd "$(git rev-parse --show-toplevel)"
cd phases/13-tools-and-protocols/22-skills-and-agent-sdks
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

该命令块需要本地 git clone 环境，并可从该仓库内任意目录启动，以便 `git rev-parse --show-toplevel` 解析代码库根路径。

运行输出会以 JSON 格式打印一个合规的纯可移植 skill、一个包含宿主扩展的 skill、一个非法的程序包，以及多个任务特征的选型决策结果。仔细观察输出的 issue codes。一个优秀的软件包验证器应当清晰地指出如何修正制品，而不是代替作者胡乱猜测。

### 验证顺序至关重要

在执行深层次的内容规则校验之前，务必先验证开销更低的结构性特征：

```figure
skill-validation-order
```

遵循这一严格顺序，能够有效防止次级派生错误掩盖系统最初被破坏的核心不变量。

## 使用它

在编写一个新 skill 之前，请认真填写这张决策卡：

| 决策问题 | 若答案为“是” | 最匹配的基本构件 |
|---|---|---|
| 该任务是否需要在多个步骤中反复运用模型的主观判断？ | 操作流程基本固定，但具体决策千变万化 | Skill |
| 该操作是否必须在特定事件发生时 100% 强制触发？ | 哪怕遗漏一次执行也是完全不可接受的故障 | Hook 或常规业务代码 |
| 模型是否需要调用具有类型化输入的外部能力？ | 该操作本身存在于模型的思维上下文之外 | Tool 或 MCP Server |
| 该工作是否需要完全隔离的上下文、独立状态或责任归属？ | 由独立的执行单元完成工作并仅返回受限结果 | Subagent |
| 该指南是否仅适用于当前这一个特定的代码库？ | 描述的是本地开发命令、目录规范与约束边界 | 代码库说明（如 AGENTS.md） |
| 单次简短的即时交互是否就足以解决问题？ | 无需任何版本化和包生命周期的管理维护 | Prompt |

很多复杂的生产级工作流往往是多种构件的组合体。该决策卡能防止开发者陷入“将所有功能塞进单一构件”的架构误区。

## 交付它

本课在 `outputs/` 目录下交付了完整的 `skill-contract-reviewer` 程序包。它包含：

- 一份可移植的 `SKILL.md`，用于审查待评估的 skill 程序包；
- 针对可移植标准与基本构件选型的参考核对清单（References）；
- 一个确定性的自动化验证脚本（Scripts）；
- 覆盖 prompt、skill、tool、hook、普通代码与 subagent 的全量任务特征测试夹具（Assets）。

安装整个套件，而不仅仅是其入口文件：

```bash
cd "$(git rev-parse --show-toplevel)"
python3 scripts/install_skills.py /tmp/aiefs-skills --phase 13 --type skill
```

课程安装脚本会输出所复制的每一个 Phase 13 skill，并生成 `/tmp/aiefs-skills/manifest.json`。该干净的安装目录用于验证包结构形态；而前文的“十分钟极速初体验”则验证了在真实宿主环境中的服务发现与调用执行。

随后的各课将逐一深化每个生命周期阶段：第 24 课攻克服务发现与渐进式披露；第 25 课深入调用策略与语义路由；第 26 课严格解耦权限控制与沙箱隔离；第 27 课则将整个程序包打造成经过严密 Eval 评测的可交付发布制品。

## 课后深练习

1. 使用 `TaskShape` 对你自身团队日常的 5 个真实研发工作流进行架构分类。为每一个选用了多种构件组合的场景写出技术选型抗辩理由。
2. 编写边界测试用例：证明刚好 500 个字符的 `compatibility` 字段能顺利通过，而 501 个字符的值会被作为超出规范标准的错误准确拦截。
3. 在白名单中新增一项运行时扩展字段。编写自动化测试，证明该文件在被成功识别的同时，依然能够与纯可移植的 skill 被清晰区分开来。
4. 将一份长达 400 行的庞杂 Prompt 优雅重构拆分：提炼出精简的 `SKILL.md`、一份专用参考资料（Reference）、一份脚本接口契约，以及一份产物输出模板。确保每个拆分出的文件各司其职。
5. 为某个引用了当前环境中不可用的 MCP Tool 的 Skill 设计降级报错响应。坚决不允许暗中将其替换为权限更宽泛的其它工具。
6. 审查一份现有的 Skill，将其中的每一句话分别打上标签：意图路由、操作规程、安全策略、参考资料指针或输出格式契约。将任何不属于该分类的冗余内容坚决剔除或移至对应文件。

## 关键术语

| 术语 | 通俗说法 | 精确工程含义 |
|---|---|---|
| Agent Skill | "保存好的 Prompt 模板" | 包含过程性操作指南与可选资源的标准化、可发现文件目录 |
| 可移植核心（Portable Core） | "所有运行时共享的通用字段" | 由 Agent Skills 官方规范所定义的基础契约标准 |
| 运行时扩展（Runtime Extension） | "额外的 Frontmatter 字段" | 平台特定的专有配置，其行为生效需要对应宿主适配器的支持 |
| 激活（Activation） | "Skill 跑起来了" | Skill 的正文指令被完整载入模型可见的上下文，后续执行可能滞后发生 |
| Skill 依赖（Skill Dependency） | "Import 另一个 Skill" | 由运行时负责调度的调用关联步骤，受到环境可用性与权限策略的严密审查 |
| Tool 契约（Tool Contract） | "函数 Schema 声明" | 为某项外部能力所定义的输入、输出、权限、副作用、错误码以及审计证据规范 |

## 延伸阅读

- [Agent Skills 规范官方文档](https://agentskills.io/specification) - 权威的可移植目录与 frontmatter 契约标准。
- [Agent Skills 最佳实践指南](https://agentskills.io/skill-creation/best-practices) - 作用域界定、指令撰写及资源编排的最佳范式。
- [OpenAI: 构建 Skills 开发者指南](https://learn.chatgpt.com/docs/build-skills) - 深入了解 Codex 环境下的服务发现与调用行为。
- [Claude Code Skills 文档](https://code.claude.com/docs/en/skills) - 涵盖平台调用机制、参数提示、工具预授权及子上下文委托扩展的完整参考。
