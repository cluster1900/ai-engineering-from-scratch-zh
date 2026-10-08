# Skill 调用与路由

> 调用（Invocation）是一个先权限决策后相关性决策的过程。好的描述有助于模型做出选择；好的策略则决定这种选择是否被允许。

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 24 (Skill Discovery and Progressive Disclosure)
**Time:** ~105 minutes

## 学习目标

- 区分显式用户调用（explicit user invocation）、隐式模型调用（implicit model invocation）、应用程序调用（application invocation）和 skill 间调用（skill-to-skill invocation）。
- 将人工可见性（human visibility）与模型合格性（model eligibility）建模为独立的策略维度。
- 编写包含正向触发条件和近邻误触发边界（near-miss boundaries）的路由描述。
- 在追踪记录（traces）和测试中分离合格性（eligibility）、选择（selection）、激活（activation）、参数绑定（argument binding）和执行（execution）。
- 适配特定运行时的调用字段，同时避免将它们冒充为可移植的 frontmatter 规范字段。

## 问题

你安装了一个 `database-migration` skill。用户可以通过名称运行它，但模型也会看到它的描述，并在有人询问通用的数据库问题时选中它。随后，该 skill 针对一个只需要解释说明的任务提出了 schema 变更建议。

你添加了 `user-invocable: false`，期望阻止用户手动运行它。但在另一个运行时中，该字段被直接忽略了。你添加了 `disable-model-invocation: true`，期望该 skill 完全消失。但在理解该字段的运行时中，用户仍然可以显式调用它。

字段名称本身没有错。错在概念模型。“用户可以看到它”、“模型可以选择它”、“应用程序可以预加载它”以及“其内部的工具可以执行”是完全独立的事实。一个名为 `invocable` 的单一布尔值根本无法表达这些复杂的维度。

路由还存在第二种失败模式。如果描述过于模糊，多个 skills 都会显得似是而非。如果描述堆砌了大量关键词，不相关的任务也会触发它们。目录本质上是一个概率接口：既要足够紧凑以适应上下文，又要足够具体以准确路由。

## 概念

### 五个渠道可以启动生命周期

| 主体 (Actor) | 调用形式 | 典型用途 | 主要风险 |
|---|---|---|---|
| 人类用户 (Human user) | 在 UI 或 prompt 中指明 skill 名称 | 刻意选择特定工作流 | 用户期望获得宿主并未授予的可用性或权限 |
| 模型或自主 Agent (Model or autonomous agent) | 根据任务上下文从目录条目中自主选择 | 自动触发专家流程 | 假阳性误路由（False-positive routing） |
| 应用程序 (Application) | 通过运行时代码激活或预加载 skill | 固定的产品工作流 | 对特定 host 产生隐式耦合 |
| 另一个 Skill 或 Subagent | 请求将特定 skill 作为工作流依赖 | 组合（Composition） | 循环调用、依赖缺失或上下文泄露 |
| 评测运行套件 (Evaluation harness) | 在固定测试场景下激活指定 skill | 可重复度量 | 在测试该 skill 的同时意外绕过了正在研究的生产策略 |

可移植的 Agent Skills 规范定义的是组件包。它并没有标准化通用的斜杠命令 UI、隐式路由标志、应用程序 API 或 subagent 生命周期。

### 调用的五个阶段

```figure
skill-invocation-stages
```

精准使用这些词汇：

- **Eligible（合格）**：策略允许当前主体（actor）请求该 skill。
- **Selected（已选中）**：用户直接指名，或路由器判定其相关。
- **Activated（已激活）**：其指令已经进入工作上下文。
- **Executing（执行中）**：agent 在这些指令指导下开始模型推理或工具操作。
- **Completed（已完成）**：输出通过了独立的成功校验。

仅记录 `skill_used=true` 的 trace 会掩盖真正发生故障的阶段边界。

### 人工与模型调用构成 2x2 矩阵

| 人类可调用 | 模型可调用 | 模式 | 适用示例 |
|:---:|:---:|---|---|
| 是 | 是 | 共享 (Shared) | 代码解释、测试规划、文档审查 |
| 是 | 否 | 仅人类 (Human-only) | 发布准备、计费数据导出、破坏性清理方案 |
| 否 | 是 | 仅模型 (Model-only) | 内部风格指南、领域参考、自动化支持流程 |
| 否 | 否 | 禁用或仅应用 (Disabled or application-only) | 分阶段发布、已废弃包、程序化预加载 |

该矩阵是一种策略模型，而非标准 YAML。

某个当前宿主使用 `disable-model-invocation: true` 表示仅人类行，使用 `user-invocable: false` 表示仅模型行。默认两者皆是。另一个宿主使用 `agents/openai.yaml` 中的 `allow_implicit_invocation: false` 来保留显式调用的同时禁用隐式选择。这些都是运行时适配器（runtime adapters）。未知的宿主可能会直接忽略它们。

容易混淆的细节非常关键：`user-invocable: false` 并不意味着“模型不能使用此 skill”。在定义它的宿主中，它只是移除了直接的用户调用入口。`disable-model-invocation: true` 也不意味着“该 skill 已被禁用”。它只是移除了模型发起的自主选择，同时仍保留用户的显式访问权限。

### 显式调用是身份优先的

显式调用直接提供身份标识：

```text
/release-readiness v2.4.0
```

或者：

```text
release-readiness check v2.4.0 without publishing
```

当前 Codex 界面文档记录了用于选择的 `/skills` 以及在请求中直接使用纯 skill 名称进行显式调用。Claude Code 文档记录了 `/skill-name` 以及特定于宿主的参数展开机制。具体的语法、菜单可见性、引用规则和变量展开均归属于宿主实现。

显式请求仍需通过策略校验。指名某个 skill 不应该绕过缺失的权限、工作区约束、审批卡点或运行时隔离。

### 隐式调用是描述优先的

对于隐式路由，模型最初看到的是目录元数据而非完整正文。因此，描述就是该 skill 的路由接口。

薄弱的描述（Weak）：

```yaml
description: Helps with releases.
```

宽泛无度的描述（Over-broad）：

```yaml
description: Use for release, version, package, build, deploy, publish, tag, changelog, GitHub, CI, or software tasks.
```

界限清晰的描述（Bounded）：

```yaml
description: Inspect an already prepared release candidate and produce a readiness report. Use when the user asks whether a version, tag, package, or image is ready to publish; do not use for ordinary build failures or feature development.
```

界限清晰的版本包含：

1. **能力（Capability）：** 检查已准备好的候选版本。
2. **输出（Output）：** 就绪度报告。
3. **正向边界（Positive boundary）：** 询问发布产物是否准备就绪。
4. **负向边界（Negative boundary）：** 常规构建和功能开发不在本流程范围内。

当两个相邻的 skills 共享词汇时，负向边界尤为有用。但它们不能替代近邻误触发评测（near-miss evals）。

### 路由是带有弃权选项的分类任务

对于 skill $s$ 和请求 $x$，可以设想一个路由器得分：

```text
score(s, x) = capability_match + trigger_match + context_match - exclusion_match - ambiguity_penalty
```

具体打分可能由 LLM 判定而非算术。工程原则依然成立：选中必须超过阈值并压过竞争的 skill。当证据不足时，主动弃权（abstain）。

```figure
skill-routing-abstention
```

对于高影响力的 skills，即便描述写得再好，隐式路由也可能并不合适。当假阳性误触发的代价超过了自动选择的便利性时，应当采用“仅人类（human-only）”策略。

### 合格性必须先于排序

不要给每个发现的 skill 都打分、选出最匹配的之后再去检查该 skill 的策略。如果得分最高的匹配被策略阻拦，就会错误地阻止考虑原本合格但得分稍低的候选者。

隐式路由应采用以下顺序：

1. 根据请求主体和当前活跃的宿主适配器过滤已发现的 skills。
2. 仅对合格的候选者打分。
3. 如果最高分的合格匹配满足阈值和歧义规则，则选中它。
4. 当没有任何候选者合格或合格得分均不够高时，弃权。

假设 `incident-triage` 得分为 `0.80`，但其宿主扩展禁用了模型调用。`incident-review` 得分为 `0.55` 且允许模型调用。路由器应将 `incident-review` 作为最佳合格候选进行评估。它绝不应该选中 `incident-triage`，拒绝它，然后直接停止。

这种执行顺序还能防止策略变更改变相关性得分本身的含义。合格性界定了候选集合，而相关性则在该集合内部进行排序。

### 路由评测需要近邻误触发用例

正向用例证明召回率（recall）：

```json
{"prompt":"Is version 2.4.0 ready to publish?","expected":"release-readiness"}
```

明确负向用例证明基本精确率（precision）：

```json
{"prompt":"Explain rotary position embeddings.","expected":null}
```

近邻误触发用例（Near misses）揭示边界质量：

```json
{"prompt":"Why did today's package build fail?","expected":"build-diagnostics"}
```

近邻用例与发布 skill 共享了 `package` 和 `build` 等词汇，但属于完全不同的任务。仅由明显正向用例和不相关负向用例组成的路由评测集会虚高评测质量。

### 参数具有三种表示形式

调用参数在流转过程中跨越多个边界：

```figure
skill-argument-boundaries
```

在每个边界上，保留意图的同时切勿将文本直接当做代码执行：

- 宿主解析器决定命令语法和引号转义。
- Skill 依据宿主规则接收绑定的文本或变量。
- 指令校验必需参数值和默认值。
- 工具调用将值转换为类型化 schema 并重新校验。

不要将原始参数直接拼接到 shell 命令中。优先调用接收参数数组（argument vector）的脚本或类型化的 MCP 工具。

### 应用程序调用是显式编排

产品可以直接激活某个 skill，因为其业务工作流已经预先知晓任务类型。例如，Pull Request 审查服务可以在用户点击“Review”按钮后预加载 `pull-request-risk-review`。

这消除了路由的不确定性，但对运行时 API 产生了依赖。请将此类适配器保留在可移植正文之外：

```figure
skill-host-adapter
```

这样当在其他兼容客户端中打开该 skill 时，它仍然保持清晰易懂。

### Skill 间调用是类似工具的边缘调用

假设当依赖文件发生变化时，`release-readiness` 需要请求 `security-change-review`。

调用方应当提供：

- 目标 skill 的身份标识；
- 有界的任务与工件路径；
- 预期的响应契约；
- 调用原因；
- 不可用时的回退方案；
- 最大深度限制或循环检测规则。

```json
{
  "target_skill": "security-change-review",
  "task": "Review dependency changes in the candidate diff",
  "inputs": ["artifacts/release.diff"],
  "expected": "risk-report.json",
  "max_depth": 2
}
```

第二个 skill 并不是被盲目地直接拼接到第一个之中。由宿主决定如何激活它，以及它是共享上下文、在独立的 fork 进程中运行，还是通过工具调用结果返回。

### 上下文生命周期取决于宿主

激活后，skill 正文可能会保留在对话中、在上下文压缩期间被概括总结，或者在委托子上下文中运行。工具权限可能只持续一个 turn，而指令则持续更长时间。Subagent 可能会接收该 skill，但并不包含父 agent 的完整历史。

不要编写依赖于隐式生命周期假设的 skill。将持久产出保存在文件或类型化状态中，保证重入安全（re-entry safe），并明确说明在中断后必须重新加载哪些内容。

```markdown
On resume, read `artifacts/release-readiness.json` if it exists.
Revalidate the candidate commit before continuing.
Do not repeat an external write whose idempotency key is already recorded.
```

## 构建它

`code/main.py` 将策略与路由实现为独立的适配器。

数据模型包括：

- `Actor`：用于人类、模型、自主 agent、应用程序、skill 以及评测套件调用方；
- `SkillMetadata`：用于路由身份标识；
- `InvocationPolicy`：用于人类/模型矩阵；
- `InvocationRequest` 与 `InvocationDecision`：用于可追踪的输入与决策结果；
- `CorePolicyAdapter`：用于无宿主扩展的可移植行为；
- `ExtensionPolicyAdapter`：用于识别运行时特定字段；
- `build_invocation_matrix(policy)`：用于生成 2x2 视图；
- `route_request(skills, request, adapter)`：用于在相关性排序、选择和拒绝之前先进行合格性过滤。

运行实验：

```bash
cd phases/13-tools-and-protocols/25-skill-invocation-and-routing
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

该演示会打印出矩阵，以及针对显式人类、隐式模型、自主 agent、应用程序、skill 组合和评测套件渠道的决策结果。其扩展适配器结果展示了在对合格备选项排序之前，被策略阻拦的词法最高匹配项如何被剔除。它还包含了精确名称白名单。该演示不需要模型 API。确定性路由器的存在是为了使策略边界易于检视，而不是宣称词法匹配就能复现生产级模型的路由行为。

### 为什么核心策略与扩展适配器必须分离

如果一个解析器盲目地为每个观察到的 frontmatter 字段赋予特殊含义，就会隐式将运行时约定推崇为虚假的通用标准。分离的适配器迫使调用方明确指明当前正在生效的是哪个宿主的语义。

`CorePolicyAdapter` 仅使用应用程序显式提供的策略。`ExtensionPolicyAdapter` 则识别明确的一组宿主字段，并记录下究竟是哪个字段改变了决策。

## 使用它

在发布 skill 之前编写调用契约（invocation contract）：

```yaml
actors:
  human: allow
  model: deny
  application: allow
  skill: deny
explicit_name: release-readiness
arguments:
  candidate: required
  publish: fixed_false
ambiguity: ask_user
missing_dependency: stop
context:
  durable_state: artifacts/release-readiness.json
  max_composition_depth: 2
```

该契约是供适配器和测试使用的设计文档。除非标准显式采纳，否则它不是可移植的 `SKILL.md` frontmatter 字段。

## 交付它

本课产出了 `skill-invocation-router` 组件包。它包含一份调用模型参考、一个示例宿主策略，以及一个非执行的 CLI 工具。该工具可以评估一次人类、模型、自主 agent、应用程序、skill 组合或评测套件请求，并返回包含渠道、适配器、得分和原因的 JSON 决策。

单次请求的 CLI 是一种策略探测工具，而非完整的触发评测套件。请使用第 27 课中带标签的正向用例和近邻误触发用例设计，来计算混淆计数、精确率、召回率以及多次运行的稳定性。

## 练习

1. 创建人类/模型矩阵的全部四行，并为每一行编写一个合法的实际使用场景。
2. 为 `CorePolicyAdapter` 添加仅限应用程序激活的功能。编写测试证明人类和模型调用方依然被拒绝。
3. 为某个部署 skill 编写 10 个近邻误触发用例。每个 prompt 必须与该 skill 共享部分词汇，但属于不同的工作流。
4. 在得分最高的两个路由项之间添加歧义边际容限（ambiguity margin）。当差距过小时返回 `ask`。
5. 为 skill 间请求添加最大组合深度限制，并能检测出由两个 skill 构成的死循环。
6. 使用核心适配器和扩展适配器运行相同的标注测试集。详细解释每一个发生变化的决策。

## 关键术语

| 术语 | 常见说法 | 实际工程含义 |
|---|---|---|
| 显式调用 (Explicit invocation) | “斜杠命令” | 调用方直接提供 skill 身份标识，受策略约束 |
| 隐式调用 (Implicit invocation) | “模型自主选择” | 路由器根据任务上下文从合格的目录元数据中自主选择 |
| 用户可调用 (User-invocable) | “人类可以使用” | 特定于宿主的菜单或直接调用属性，而非核心标准字段 |
| 模型可调用 (Model-invocable) | “agent 可以使用” | 在宿主策略下具备隐式模型选择资格 |
| 调用适配器 (Invocation adapter) | “frontmatter 解析器” | 将宿主字段和 API 映射到已声明策略模型的代码 |
| 近邻误触发用例 (Near miss) | “困难负例” | 与 skill 预期输入高度相似但不应触发该 skill 的请求 |
| 弃权 (Abstention) | “未选中任何 skill” | 在缺乏足够证据或存在歧义时刻意做出的路由结果 |

## 延伸阅读

- [优化 skill 描述](https://agentskills.io/skill-creation/optimizing-descriptions)：深入了解正向触发词、具体性与评测。
- [评测 skills](https://agentskills.io/skill-creation/evaluating-skills)：了解触发评测与输出评测的设计。
- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills)：了解当前 Codex 的显式与隐式调用控制。
- [Claude Code skills](https://code.claude.com/docs/en/skills)：了解具体宿主中的 `user-invocable`、`disable-model-invocation`、参数传递以及委托上下文机制。
