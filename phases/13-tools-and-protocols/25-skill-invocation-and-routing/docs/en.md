# Skill 调用与路由

> 调用首先是权限决策，然后是相关性决策。好的描述可以帮助 Model 做出选择；好的策略则决定是否允许这一选择。

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 24（Skill 发现与渐进式披露）
**Time:** ~105 分钟

## 学习目标

- 区分用户显式调用、Model 隐式调用、应用调用以及 Skill 到 Skill 的调用。
- 将人类可见性和 Model 可用性建模为相互独立的策略维度。
- 编写包含正向触发条件和近似但不匹配边界的路由描述。
- 在 trace 和测试中分离资格判断、选择、激活、参数绑定和执行。
- 适配特定 runtime 的调用字段，而不将其表述为可移植 frontmatter。

## 问题

你安装了一个 `database-migration` Skill。用户可以按名称运行它，但 Model 也会看到它的描述，并在有人询问一般数据库问题时选择它。随后，这个 Skill 会为一个原本只需要解释的任务提出 schema 变更。

你添加了 `user-invocable: false`，期望阻止用户手动运行它。在另一个 runtime 中，该字段被忽略。你又添加了 `disable-model-invocation: true`，期望让这个 Skill 完全消失。但在能够识别该字段的 runtime 中，用户仍然可以显式调用它。

字段名称没有问题。错误在于 Model。“用户可以看到它”“Model 可以选择它”“应用可以预加载它”以及“其中的 Tool 可以执行”是彼此独立的事实。一个名为 `invocable` 的 boolean 无法表达这些差异。

路由还有第二种失败模式。如果描述含糊不清，多个 Skill 都可能看似适用。如果描述中塞满关键词，无关任务也会触发它们。目录是一种 Probability 接口：既要足够紧凑以便容纳，又要足够具体以便路由。

## 概念

### 五种渠道可以启动生命周期

| 参与者 | 调用形式 | 典型用途 | 主要风险 |
|---|---|---|---|
| 人类用户 | 在 UI 或 Prompt 中指定 Skill | 有意选择工作流 | 用户期望 host 并未授予的可用性或权限 |
| Model 或自主 Agent | 根据任务 Context 选择目录条目 | 自动执行专家流程 | 误报路由 |
| 应用 | 通过 runtime 代码激活或预加载 Skill | 固定的产品工作流 | 与单一 host 产生隐性耦合 |
| 另一个 Skill 或 subagent | 请求一个确切的 Skill 作为工作流依赖项 | 组合 | 循环、缺失依赖项或 Context 泄漏 |
| Evaluation harness | 在固定场景下激活确切的 Skill | 可重复测量 | 测试 Skill 时意外绕过正在研究的生产策略 |

可移植的 Agent Skills 规范定义了 package。它并未标准化一种通用的 slash-command UI、隐式路由标志、应用 API 或 subagent 生命周期。

### 调用的五个阶段

```figure
skill-invocation-stages
```

请准确使用以下词语：

- **Eligible** 表示策略允许该参与者请求此 Skill。
- **Selected** 表示用户指定了它，或者路由器判断它与任务相关。
- **Activated** 表示它的指令已进入工作 Context。
- **Executing** 表示 Agent 已开始在这些指令下执行 Model 或 Tool 工作。
- **Completed** 表示输出通过了独立的成功检查。

仅记录 `skill_used=true` 的 trace 会掩盖故障发生的边界。

### 人类调用和 Model 调用构成一个 2x2 Matrix

| 人类可以调用 | Model 可以调用 | 模式 | 适用示例 |
|:---:|:---:|---|---|
| 是 | 是 | 共享 | 代码解释、测试规划、文档审查 |
| 是 | 否 | 仅限人类 | 发布准备、账单导出、破坏性清理计划 |
| 否 | 是 | 仅限 Model | 内部风格指南、领域参考、自动支持流程 |
| 否 | 否 | 已禁用或仅限应用 | 分阶段发布、已弃用 package、程序化预加载 |

这个 Matrix 是策略 Model，而不是标准 YAML。

当前某个 host 使用 `disable-model-invocation: true` 表示仅限人类这一行，并使用 `user-invocable: false` 表示仅限 Model 这一行。默认情况下两者都允许。另一个 host 使用 `agents/openai.yaml` 中的 `allow_implicit_invocation: false`，在保留显式调用的同时禁用隐式选择。这些都是 runtime adapter。未知 host 可能会忽略它们。

这个容易混淆的细节很重要：`user-invocable: false` 并不表示“Model 不能使用这个 Skill”。它会在定义该字段的 host 中移除用户直接调用。`disable-model-invocation: true` 也不表示“这个 Skill 已被禁用”。它会移除由 Model 发起的选择，同时保留用户显式访问。

### 显式调用以身份为先

显式调用会直接提供身份：

```text
/release-readiness v2.4.0
```

或者：

```text
release-readiness 检查 v2.4.0，但不要发布
```

当前 Codex 接口使用文档说明了通过 `/skills` 进行选择，以及在请求中使用纯 Skill 名称进行显式调用。Claude Code 使用文档说明了 `/skill-name` 和 host 特定的参数展开方式。确切语法、菜单可见性、引用规则和变量展开方式均由 host 定义。

显式请求仍然必须通过策略检查。指定 Skill 不应绕过缺失的权限、workspace 约束、审批关卡或 runtime 隔离。

### 隐式调用以描述为先

对于隐式路由，Model 最初看到的是目录 metadata，而不是完整正文。因此，description 就是 Skill 的路由接口。

薄弱：

```yaml
description: 帮助处理发布。
```

过于宽泛：

```yaml
description: 用于发布、版本、package、构建、部署、推送、tag、changelog、GitHub、CI 或软件任务。
```

边界明确：

```yaml
description: 检查已经准备好的发布候选项并生成就绪报告。当用户询问某个版本、tag、package 或 image 是否可以发布时使用；不要用于普通构建失败或 Feature 开发。
```

边界明确的版本包含：

1. **能力：** 检查准备好的候选项。
2. **输出：** 就绪报告。
3. **正向边界：** 询问发布产物是否准备就绪。
4. **负向边界：** 普通构建和开发不在作用域内。

当两个相近 Skill 使用相同词汇时，负向边界很有用。但它不能代替近似但不匹配的 eval。

### 路由是带有弃选选项的 Classification

对于 Skill `s` 和请求 `x`，可以设想一个路由器分数：

```text
score(s, x) = capability_match + trigger_match + context_match - exclusion_match - ambiguity_penalty
```

实际评分可能由 LLM 决策完成，而不是进行算术计算。工程原则仍然成立：选择结果应该超过阈值并胜过竞争 Skill。当证据不足时，应选择弃选。

```figure
skill-routing-abstention
```

对于高影响 Skill，即使描述十分明确，隐式路由也可能不合适。当误报的成本高于自动选择带来的便利时，应使用仅限人类的策略。

### 资格判断必须先于排名

不要对所有已发现的 Skill 进行评分，选择最匹配的 Skill，然后才检查该 Skill 的策略。被阻止的最高匹配项会错误地导致系统不再考虑分数稍低但具备资格的候选项。

隐式路由应使用以下顺序：

1. 根据请求方和当前启用的 host adapter 筛选已发现的 Skill。
2. 仅对具备资格的候选项评分。
3. 如果最匹配且具备资格的候选项超过阈值并符合歧义规则，则选择它。
4. 如果没有具备资格的候选项，或所有合格候选项的分数都不够高，则弃选。

假设 `incident-triage` 得分为 `0.80`，但其 host extension 禁止 Model 调用。`incident-review` 得分为 `0.55`，并允许 Model 调用。路由器应该将 `incident-review` 作为最优的合格候选项进行评估，而不应该先选择 `incident-triage`、拒绝它，然后停止。

这一顺序还可以防止策略变更改变相关性分数的含义。资格定义选择集合，相关性对该集合进行排名。

### 路由 eval 需要近似但不匹配的案例

正向案例用于证明 recall：

```json
{"prompt":"版本 2.4.0 可以发布了吗？","expected":"release-readiness"}
```

明确的负向案例用于证明基本 precision：

```json
{"prompt":"请解释 rotary position embeddings。","expected":null}
```

近似但不匹配的案例用于暴露边界质量：

```json
{"prompt":"为什么今天的 package 构建失败了？","expected":"build-diagnostics"}
```

这个近似案例与发布 Skill 共享 `package` 和 `build`，但它属于其他工作流。只包含明显正向案例和无关负向案例的路由测试集会夸大质量。

### 参数有三种表示形式

调用参数会跨越多个边界：

```figure
skill-argument-boundaries
```

在每个边界上，都要保留意图，但不要把文本当作代码。

- host parser 决定命令语法和引用方式。
- Skill 根据 host 规则接收绑定后的文本或变量。
- 指令验证必需值和默认值。
- Tool call 将值转换为类型化 schema，并重新验证它们。

不要把原始参数插入 shell 命令。应优先使用通过参数 Vector 调用的 script，或使用类型化 MCP Tool。

### 应用调用是显式编排

产品可以激活某个 Skill，因为它的工作流已经知道任务类型。例如，当用户按下 Review 后，pull-request review 服务可以预加载 `pull-request-risk-review`。

这消除了路由的不确定性，但会产生对 runtime API 的依赖。应将该 adapter 放在可移植正文之外：

```figure
skill-host-adapter
```

当不同的兼容 client 打开该 Skill 时，它仍然应该易于理解。

### Skill 到 Skill 的调用是一条类似 Tool 的边

假设 `release-readiness` 在依赖文件发生变化时请求 `security-change-review`。

调用方应该提供：

- 目标 Skill 身份；
- 有明确边界的任务和产物路径；
- 预期的响应契约；
- 调用原因；
- 不可用时的回退方案；
- 最大深度或循环规则。

```json
{
  "target_skill": "security-change-review",
  "task": "审查候选 diff 中的依赖变更",
  "inputs": ["artifacts/release.diff"],
  "expected": "risk-report.json",
  "max_depth": 2
}
```

第二个 Skill 不会被盲目粘贴进第一个 Skill。host 决定如何激活它，以及它是共享 Context、在 fork 中运行，还是通过 Tool 结果返回。

### Context 生命周期取决于 host

激活之后，Skill 正文可能保留在对话中、在压缩期间被总结，或者在委派的 Context 中运行。Tool 的许可可能只持续一个 turn，而指令持续得更久。subagent 可能会收到 Skill，但不会收到父级的完整历史记录。

不要编写依赖不可见生命周期假设的 Skill。将持久输出写入文件或类型化状态，确保重新进入时安全，并说明中断后必须重新加载什么。

```markdown
恢复时，如果 `artifacts/release-readiness.json` 存在，请读取该文件。
继续之前，重新验证候选 commit。
如果已记录幂等 key，请勿重复执行外部写入。
```

## 动手构建

`code/main.py` 将策略和路由实现为彼此独立的 adapter。

该 Model 包含：

- `Actor`，用于人类、Model、自主 Agent、应用、Skill 和 harness 调用方；
- `SkillMetadata`，用于路由身份；
- `InvocationPolicy`，用于人类/Model Matrix；
- `InvocationRequest` 和 `InvocationDecision`，用于可追踪的输入和结果；
- `CorePolicyAdapter`，用于不含 host extension 的可移植行为；
- `ExtensionPolicyAdapter`，用于识别 runtime 字段；
- `build_invocation_matrix(policy)`，用于生成 2x2 视图；
- `route_request(skills, request, adapter)`，用于在相关性排名、选择和拒绝之前进行资格筛选。

运行：

```bash
cd phases/13-tools-and-protocols/25-skill-invocation-and-routing
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Demo 会输出一个 Matrix，以及显式人类、隐式 Model、自主 Agent、应用、Skill 组合和 harness 渠道的决策。它的 extension adapter 结果展示了如何在排名前移除被阻止的最高词法匹配项，再对符合资格的替代项进行排名。它还包含精确名称 allowlist。不需要 Model API。使用确定性路由器是为了让策略边界可检查，而不是声称词法匹配能够复现生产环境中的 Model 路由。

### 为什么 core adapter 和 extension adapter 相互独立

如果一个 parser 为观察到的所有 frontmatter 字段赋予含义，它就会默默地把 runtime 约定提升为虚假的标准。使用独立 adapter 会迫使调用方明确指出当前启用了哪一种 host 语义。

`CorePolicyAdapter` 仅使用应用提供的策略。`ExtensionPolicyAdapter` 识别一组明确的 host 字段，并记录是哪个字段改变了决策。

## 投入使用

在发布 Skill 之前编写调用契约：

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

该契约是 adapter 和测试的设计文档。除非某个标准明确采用它，否则它并不是可移植的 `SKILL.md` frontmatter。

## 交付成果

本课会生成 `skill-invocation-router` bundle。它包含调用 Model reference、host 策略示例，以及一个不执行操作的 CLI。该 CLI 会评估一条来自人类、Model、自主 Agent、应用、Skill 组合或 harness 的请求，并返回包含渠道、adapter、分数和原因的 JSON 决策。

单请求 CLI 是一个策略探针，并不是完整的触发器 Evaluation。使用第 27 课中带 Label 的正向案例和近似但不匹配案例设计，计算混淆计数、precision、recall 和重复运行稳定性。

## 练习

1. 创建人类/Model Matrix 的全部四行，并为每一行编写一个合理的使用场景。
2. 为 `CorePolicyAdapter` 添加仅限应用的激活方式。证明人类和 Model 调用方仍会被拒绝。
3. 为部署 Skill 编写十个近似但不匹配的案例。每个 Prompt 必须与该 Skill 共享词汇，但属于不同的工作流。
4. 在排名前两位的路由分数之间添加歧义差值。当差值过小时返回 `ask`。
5. 为 Skill 到 Skill 的请求添加最大组合深度，并检测由两个 Skill 构成的循环。
6. 使用 core adapter 和 extension adapter 运行同一组带 Label 的测试集。解释每一个发生变化的决策。

## 关键术语

| 术语 | 人们常说的含义 | 实际含义 |
|---|---|---|
| 显式调用 | “Slash command” | 参与者直接提供 Skill 身份，并接受策略约束 |
| 隐式调用 | “由 Model 选择” | 路由器根据任务 Context，从符合资格的目录 metadata 中进行选择 |
| User-invocable | “人类可以使用它” | host 特定的菜单或直接调用属性，而不是 core 字段 |
| Model-invocable | “Agent 可以使用它” | 根据 host 策略参与 Model 隐式选择的资格 |
| 调用 adapter | “Frontmatter parser” | 将 host 字段和 API 映射到已声明策略 Model 的代码 |
| 近似但不匹配 | “Hard negative” | 与 Skill 预期输入相似但不应触发的请求 |
| 弃选 | “未选择 Skill” | 在证据不足或存在歧义时主动产生的路由结果 |

## 延伸阅读

- [优化 Skill 描述](https://agentskills.io/skill-creation/optimizing-descriptions)：了解正向触发条件、具体性和 Evaluation。
- [评估 Skill](https://agentskills.io/skill-creation/evaluating-skills)：了解触发器和输出 eval 的设计。
- [OpenAI：构建 Skill](https://learn.chatgpt.com/docs/build-skills)：了解当前 Codex 的显式和隐式调用控制。
- [Claude Code Skill](https://code.claude.com/docs/en/skills)：了解某个 host 的 `user-invocable`、`disable-model-invocation`、参数和委派 Context。
