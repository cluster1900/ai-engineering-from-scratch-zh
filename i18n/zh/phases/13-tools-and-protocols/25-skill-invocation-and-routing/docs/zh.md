# 调用与路由技能

> 调用 (调用) 调用 (调用) 是一个先权限决策后相关性决策的过程.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 24 (Skill Discovery and Progressive Disclosure)
**Time:** ~105 minutes

## 学习目标

- 区分显式用户调用 (明确用户调用) 隐式模型调用 (隐式模型调用) 隐式模型调用 (隐式模型调用) 应用程序调用 (应用调用) 应用调用 (应用调用) 和技能调用 (技能调用)
- 技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,技术的发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展,发展, 发展, 发展, 发展, 发展, 发展, 发展, 发展, 发展, 发展, 发展, 发展, 发展, 发展, 发展, 发展, 发展, 发展, 发展, 发展, 发展, 发展, 发展, 发展, 发展, 发展, 发展, 发展, 发展
- 编写包含正向触发条件和近邻误触发边界的路由描述.
- 在追踪记录 (追踪记录) 和测试中分离合格性 (合格性) 选择 (选择) 选择 (选择) 激活 (激活) 激活 (激活) 参数绑定 (绑定) 论点 (结合) 和执行 (执行)
- 适应特定运行时调用字段,同时避免将它们冒充为可移植的前面材料规范字段.

## 问题

你安装了一个.`database-migration`技能──用户可以通过名称运行它,但模型也会看到它的描述,并有人问通用数据库问题时选择它──随后,该技能 针对一个只需要解释的任务提出了方案变更建议──

你加入了`user-invocable: false`预计用户手动运行它. 但在另一个运行时,该字段被直接忽略.`disable-model-invocation: true`预计该技能将完全消失. 但在理解该段的运行时,用户仍然可以显然调用它.

字段名称本身没有错误.错在概念模型. 用户可以看到它. 模型可以选择它. 应用程序可以预装它. 内部工具可以执行它. 完全独立的事实.`invocable`单一的价值根本无法表达这些复杂的维度.

路由还存在第二种失败模式――如果描述过于模糊,多个技能都会显得似是而非――如果描述堆积了大量的关键词,不相关的任务也会触发它们――目录本质上是一个概率接口:既要足够紧以适应下文,又要足够具体以准确路由――

## 概念

### 五个方法可以启动生命周期

| 主体 (Actor) | 调用形式 | 典型用途 | 主要风险 |
|---|---|---|---|
| 人类用户 (Human user) | 在 UI 或 prompt 中指明 skill 名称 | 刻意选择特定工作流 | 用户期望获得宿主并未授予的可用性或权限 |
| 模型或自主 Agent (Model or autonomous agent) | 根据任务上下文从目录条目中自主选择 | 自动触发专家流程 | 假阳性误路由（False-positive routing） |
| 应用程序 (Application) | 通过运行时代码激活或预加载 skill | 固定的产品工作流 | 对特定 host 产生隐式耦合 |
| 另一个 Skill 或 Subagent | 请求将特定 skill 作为工作流依赖 | 组合（Composition） | 循环调用、依赖缺失或上下文泄露 |
| 评测运行套件 (Evaluation harness) | 在固定测试场景下激活指定 skill | 可重复度量 | 在测试该 skill 的同时意外绕过了正在研究的生产策略 |

可移植的代理技能 规范定义是组件包――它没有标准化通用斜命令 UI、隐式路由标志、应用程序 API或子代 生命周期――

### 调用五阶段

```figure
skill-invocation-stages
```

精准使用这些词汇:

- **Eligible（合格）**策略允许当前主体 (演员) 要求这个技能.
- **Selected（已选中）**用户直接指名,或路由器判定其相关性.
- **Activated（已激活）**命令已经进入工作上下文.
- **Executing（执行中）**经过这些指令,代理开始推理或操作工具.
- **Completed（已完成）**通过独立的成功经验.

仅记录`skill_used=true`后者被发现是的.

### 人工与模型调用构成2x2矩阵

| 人类可调用 | 模型可调用 | 模式 | 适用示例 |
|:---:|:---:|---|---|
| 是 | 是 | 共享 (Shared) | 代码解释、测试规划、文档审查 |
| 是 | 否 | 仅人类 (Human-only) | 发布准备、计费数据导出、破坏性清理方案 |
| 否 | 是 | 仅模型 (Model-only) | 内部风格指南、领域参考、自动化支持流程 |
| 否 | 否 | 禁用或仅应用 (Disabled or application-only) | 分阶段发布、已废弃包、程序化预加载 |

这是一个策略模型,而不是标准的YAML.

某个当前宿主使用 `disable-model-invocation: true`表示仅人类行,使用 `user-invocable: false`表示仅模型行.默认两者都是.另一个主机使用.`agents/openai.yaml`中中 `allow_implicit_invocation: false`为了保留显式调用同时禁用隐式选择. 这些都是运行时适配器.

容易混的细节非常关键:`user-invocable: false`不意味着模型不能使用这种技能. 在定义它的主机中,它只是移除了直接的用户调用入口.`disable-model-invocation: true`也不意味着该技能已被禁用. 它只是移除了模型发起的自主选择,同时保留了用户的明显访问权限.

### 显然调用是优先的

显式调用直接提供身份标识:

```text
/release-readiness v2.4.0
```

或是:

```text
release-readiness check v2.4.0 without publishing
```

当前的Codex界面文档记录用于选择的`/skills`直接使用纯技能名字进行显式调用.`/skill-name`具体语法,菜单可见性,引用规则和变量展开均归属主体实现.

显然要求仍需要通过策略考验. 指定某种技能不应绕过缺失权限.

### 隐式调用是描述优先的

对于隐式路径,模型最初看到的是目录元数据而不是完整正文.

薄弱的描述:

```yaml
description: Helps with releases.
```

宽泛无度的描述:

```yaml
description: Use for release, version, package, build, deploy, publish, tag, changelog, GitHub, CI, or software tasks.
```

界限清晰的描述:

```yaml
description: Inspect an already prepared release candidate and produce a readiness report. Use when the user asks whether a version, tag, package, or image is ready to publish; do not use for ordinary build failures or feature development.
```

界限清晰的版本包含:

1. **能力（Capability）：**检查已准备好候选版本.
2. **输出（Output）：**关于此次报告.
3. **正向边界（Positive boundary）：**询问发布产品是否准备就绪.
4. **负向边界（Negative boundary）：**常规构建和功能开发不属于本流程范围.

当两个相邻的技能共享词汇时,负向边界尤为有用――但它们不能替代近邻误触发评测 (近错评测)

### 路由是带有权力选择的分类任务

对于技能$s$和请求$x$现在,我们可以设想一个路由器.

```text
score(s, x) = capability_match + trigger_match + context_match - exclusion_match - ambiguity_penalty
```

具体打分可能由LLM 判定而非算术.工程原则仍然存在:选中必须超过值并压力竞争的技能.

```figure
skill-routing-abstention
```

对于高影响力技能,即便描述写得好,隐式路由也可能不合适.

### 合格性必须先排序

不要给每一个发现的技能,然后分分,选择最合适的技能,然后再检查该技能的策略.

隐式路由应采用以下顺序:

1. 根据请求主体和当前活跃的宿主适配器过已发现的技能──
2. 仅对合格的候选人打分.
3. 如果最高分数的合格匹配满足值和差义规则,则选中它.
4. 当没有任何候选人合格或合格分数均不高时,弃权.

假设`incident-triage`得到分为`0.80`虽然它的主人扩展了,但它已经禁止使用模型调用.`incident-review`得到分为`0.55`且允许模型调用──路由器应将`incident-review`作为最佳合格候选人进行评估.`incident-triage`拒绝它,然后直接停止.

这种执行顺序也可以防止策略变化,更改相关性分数本身的含义.

### 路由评测需要近邻误触发例

正向例证召回率 (回忆):

```json
{"prompt":"Is version 2.4.0 ready to publish?","expected":"release-readiness"}
```

明确负向使用例证明基本精确率(精确度):

```json
{"prompt":"Explain rotary position embeddings.","expected":null}
```

近邻误触发使用例 (近错误) 揭示边界质量:

```json
{"prompt":"Why did today's package build fail?","expected":"build-diagnostics"}
```

近邻用例与发布技能共享`package`和 `build`其他词汇,但属于完全不同的任务――仅由明显正向用例和不相关的负向用例组成的路由评测集会虚高评测质量――

### 参数具有三种表示形式

调用参数在流转过程中跨越多个边界:

```figure
skill-argument-boundaries
```

在每个边界,同时不要把文本直接作为代码执行:

- 宿主解析器决定命令语法和引号转义。
- 根据宿主规则接收绑定的文本或变量.
- 指令校验必需参数值和默认值──
- 工具调用将值转换为类型化方案并重新校验.

不要将原始参数直接拼接到 shell 命令中。优先调用接收参数数组的脚本或类型化MCP 工具。

### 应用程序调用是显式编排

产品可以直接激活某种技能,因为其业务工作流已经预先预知任务类型.例如,拉取请求 审查服务可以在用户点击 评论 按 后预载 `pull-request-risk-review`,我知道.

这消除了路由的不确定性,但在运行时,API 产生了依赖.

```figure
skill-host-adapter
```

在其他兼容客户端中开启时,它仍然保持清晰易懂.

### 技能调用是类似工具的边缘调用

假设在依赖文件发生变化时,`release-readiness`需要请求`security-change-review`,我知道.

调用方应提供:

- 目标技能的身份识别;
- 界面任务和工件路径;
- 预期的响应契约;
- 调用原因;
- 无需时退款方案;
- 最大深度限制或循环检测规则.

```json
{
  "target_skill": "security-change-review",
  "task": "Review dependency changes in the candidate diff",
  "inputs": ["artifacts/release.diff"],
  "expected": "risk-report.json",
  "max_depth": 2
}
```

第二个技能不是被盲目直接拼接到第一个中. 主人决定如何激活它,以及它是共享下文,在独立的叉子中运行,还是通过工具调用结果回归.

### 上下文生命周期取决于宿主

激活后,正文技能可能会在对话中保留在下文压缩期间被概括总结,或者在委托子上下文中运行.

不要依赖于隐式生命周期假设的技能.将在文件或类型化状态中保持持久产品,保证重入安全,并明确说明在中断后必须重新加载的内容.

```markdown
On resume, read `artifacts/release-readiness.json` if it exists.
Revalidate the candidate commit before continuing.
Do not repeat an external write whose idempotency key is already recorded.
```

## 构建它

`code/main.py`将策略与路由实现为独立适应器.

数据模型包括:

- `Actor`应用程序技能以及评测套件调用方针:
- `SkillMetadata`:用于路由身份识别;
- `InvocationPolicy`:用于人类/模型矩阵;
- `InvocationRequest`与`InvocationDecision`:用于可追踪的输入和决策结果;
- `CorePolicyAdapter`:用于无宿主扩展的可移植行为;
- `ExtensionPolicyAdapter`:用于识别运行时特定字段;
- `build_invocation_matrix(policy)`图片:用于生成2x2 视图;
- `route_request(skills, request, adapter)`通过通过相关性排序,选择和拒绝之前.

运行实验:

```bash
cd phases/13-tools-and-protocols/25-skill-invocation-and-routing
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

该演示将打印出矩阵,以及针对显式人类,隐式模型,自主代理,应用程序,技能组合和评测套件的决策结果.其扩展适配器的结果显示,在合格备选排名之前,被策略阻的词法最高匹配如何被除.它还包含了精确名称的白单.该演示不需要模型API.确定性路由器的存在是为了使策略边界易于检查,而不是宣称词法匹配对复制现生产级模型的路由行为.

### 为什么核心策略和扩展适配器必须分开

如果一个解析器盲目地赋予每个观察到的前面物质的字段特殊意义,就会隐式将运行时约定推崇为虚假的通用标准.

`CorePolicyAdapter`仅使用应用程序显然提供的策略.`ExtensionPolicyAdapter`则识别一组主持人段落,并记录下究竟是哪个段落改变了决策.

## 使用它

在发布技能之前编写调用契约 (调用契约)

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

协议是适配器和测试使用的设计文件.`SKILL.md`字段──

## 交付它

本课产出炉`skill-invocation-router`组件包.它包含调用模型参考,一个示例主机策略,以及一个不执行的CLI工具.该工具可以评估一个人体模型,自主代理,应用程序,技能组合或评测套件请求,并返回包含道,适配器,分数和原因的JSON决策.

单次请求的CLI是一种策略探测工具,而不是完整的触发评测套件. 请使用27课程中带标签的正向使用例和近邻误触发使用例设计,来计算混计数,精确率,召回率以及多次运行稳定性.

## 练习

1. 创建人类/模型矩阵的全部四行,并为每一行编写一个合法的实际使用场景.
2. 为`CorePolicyAdapter`添加仅限于应用程序激活功能――编写测试证明人类和模型调用方式仍然被拒绝――
3. 为某种部署技能编写10个近邻错误触发用例.
4. 在两个最高分数的路由项目之间增加差异义边际容量限制 (含不清的差距)`ask`,我知道.
5. 为了要求增加最大组合深度限制,并能检测出两个构成技能的死亡循环.
6. 使用核心适配器和扩展适配器运行相同的标签测试集.

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

- [优化 skill 描述](https://agentskills.io/skill-creation/optimizing-descriptions)具体性与评测:
- [评测 skills](https://agentskills.io/skill-creation/evaluating-skills)了解触发评测与输出评测的设计.
- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills)了解当前的"Codex"的显式和隐式调用控制.
- [Claude Code skills](https://code.claude.com/docs/en/skills)了解具体宿主中的`user-invocable`,我知道.`disable-model-invocation`、参数传递以及委托下文机制――
