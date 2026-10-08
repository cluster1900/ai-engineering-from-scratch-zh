# 代理技能:可移植契约与运行时边界

> 技能绝对不仅仅是更好的文件名的长提示. 它是一个包含指令,资源和可执行辅助工具的可发现程序包,根据明确的运行时合约载入代理的下文.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 01 (The Tool Interface), Phase 13 · 05 (Tool Schema Design)
**Time:** ~90 minutes

## 学习目标

- 明确定义 代理技能,不将其与快速、代码库规范文件(存储器说明) 工具、克、副机或插件 混──
- 研读可移植的`SKILL.md`契约,并将其与特定运行时专有扩展清晰解──
- 将服务发现 (发现) 选择 (选择) 选择 (选择) 激活 (激活) 资源加载 (资源加载) 工具调用 (工具使用) 和验证 (验证) 解释为独立的生命周期阶段――
- 在运行时将技能纳入代理技能目录前,对其软件包进行严格的静态验证.
- 针对具体工程任务,在技能,MCP工具,,子代码或普通代码之间做出理性的技术选择.

## 十分钟极速初体验

在阅读深入讲解之前,请先完成此操作――你将亲手创建一个微型技能,将完整的审查器程序包装安装到真实的代理主环境中,调用它,验证结果,并将卸载它――这将让你通过可观测结果亲自验证整个生命周期――

### 真实宿主实验前置检查

实际主机检查点需要 Node.js,`npx`、Python 3、一个选择支持技能的主机环境,以及你在安装器中选择的项目或用户作用域的写入权限.

```bash
node --version
npx --version
python3 --version
```

在安装之前,先确定你要使用的宿主和安装作用域.如果缺少上述任何依赖,你可以在网站上阅读本课程,或者直接进行下面的软件包手动练习.

### 1. 从空工作目录开始

在任意用于存储学习项目的父目录下执行:

```bash
mkdir -p agent-skills-first-run
cd agent-skills-first-run
TARGET_ROOT="$(pwd -P)"
printf 'TARGET_ROOT=%s\n' "$TARGET_ROOT"
ls -A
```

最后一条命令应没有任何输出. 如果有输出,请更换一个空的目录,以便本次审查拥有干净清晰的边界.

为了你的第一个技能 创建目录:

```bash
mkdir -p my-first-skill
```

创建`my-first-skill/SKILL.md`内容如下:

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

验证该文件是否成功创建目标目录:

```bash
test -f my-first-skill/SKILL.md
```

无任何输出和退出码为 0 表示文件已经存在.

### 2. 装备完整的审查器套件

保持在`agent-skills-first-run`目录下并运行:

```bash
npx skills add rohitg00/ai-engineering-from-scratch --skill skill-contract-reviewer --full-depth
```

选择您目前正在使用的代理 宿主和作用域──安装器会列出 `skill-contract-reviewer`及其写入的目标位置.必须加上.`--full-depth`参数,因为本课程提供的技能是包含参考,脚本和静态资产的嵌套程序包.

将`SKILL_ROOT`设置为安装器所报告的绝对路径.`SKILL.md`课程源码目录,也不是当前工作区:

```bash
# 将占位符替换为安装器打印出的绝对路径
SKILL_ROOT="$(cd "/absolute/path/to/skill-contract-reviewer" && pwd -P)"
test -f "$SKILL_ROOT/SKILL.md"
printf 'SKILL_ROOT=%s\n' "$SKILL_ROOT"
```

如果主持人会话已经开启,请启动新会话或使用主持人的技能重复扫描命令.

### 3. 显然调用它

在安装的代理中,`agent-skills-first-run`作为工作目录,使用该主持人支持的显式语法:

| 宿主 | 显式调用方式 |
|---|---|
| Codex | 输入 `skill-contract-reviewer`，或从 `/skills` 菜单中选择，然后提交审查请求 |
| Claude Code | 输入 `/skill-contract-reviewer` 紧跟审查请求 |
| 通用可移植回退 | `Use skill-contract-reviewer to review the target package.` |

在请求中使用印发`SKILL_ROOT`和 `TARGET_ROOT`绝对路径――要求主管在执行前展开并展示完整解析后的命令,而不是依赖于当前工作目录的模糊命令:

```text
Use skill-contract-reviewer to review <TARGET_ROOT>/my-first-skill. The installed bundle root is <SKILL_ROOT>. Run python3 <SKILL_ROOT>/scripts/check_skill.py <TARGET_ROOT>/my-first-skill. Before running it, show the fully resolved argv. Return the validation report, selected primitives, and one sentence for each selection. Include the resolved script path, resolved target path, cwd, argv, and exit code as execution evidence.
```

解析后的命令应呈现如下结构,不留任何未填写的占位符:

```bash
python3 "/absolute/install/path/skill-contract-reviewer/scripts/check_skill.py" \
  "/absolute/workspace/path/agent-skills-first-run/my-first-skill"
```

成功审查结果应同时满足以下三个特征:

1. 宿主能按名称准确找到`skill-contract-reviewer`,我知道.
2. 审查器成功读取程序包契约并运行其附带的验证脚本.
3. 返回的回应包含一个验证报告,包括无结构性错误的示例,并提出了合理的基本构件选择类型建议.

执行证据中还必须明确列出脚本路径"",目标路径"",当前工作目录"",精确参数数组"",argv"以及退出码――一个缺乏这些段落的流报告并不能证明附带的配套脚本确实执行了――

如果主机报告该技能不可用,请检查安装目标路径,重新扫描或重新启动一次主机,然后再试试显式请求――不要为了掩盖安装失败而随意改写技能描述――

### 4. 探查隐式选择 (暗示选择)

启动一个新的代理转,输入相同任务但**不提及**这项技能的名字:

```text
Review <TARGET_ROOT>/my-first-skill as a reusable agent package and tell me whether its package contract is valid.
```

如果主机向用户展示所选的技能,记录它是否自动被选用.`skill-contract-reviewer`如果主机不透露路由决策细节,则将隐式选择标记为未验证显式调用永远是主机跨移植的基本手段.

### 5. 清理环境

仅移除已安装的审查器程序包:

```bash
npx skills remove skill-contract-reviewer
```

选择与安装时相同的主机和作用域. 在重新扫描或新建会话后,显然请求.`skill-contract-reviewer`应该回归这个技能不可用.`my-first-skill`对于后续课程的使用,也可以在完成该方向学习后完全删除实验目录.

## 问题

假设你的团队有一个非常可靠的发布上线工作流:查找已合并的改动,检查数据库迁移说明,更新变更记录,执行打包命令,并输出上线审查清单.

如果把这个工作流直接插入一个长提示中,虽然很方便复制粘贴,但在工程运维上漏洞出现:这个提示缺乏稳定的身份识别,没有发现规则,缺乏资源加载边界,没有可测试的包结构,并且无法回答一系列基础工程问题:谁有权调用它?模型在什么时候应该选中它?它可以执行哪些脚本?哪些文件是可信的?

相反,极端错误是把所有可重复的指令都成了一个脑部的技能――代码库规范,确定性自动化脚本,外部工具,事件子以及委托代理解决了截然不同的问题――如果把它们全部包装进来.`SKILL.md`实际上,它深深地绑定了特定主人的未公开行为.

软件工程的首要任务是**分类**在决定如何包装构件之前,先考虑清楚构件是什么.

## 概念

### 封装过程性知识

机关技巧是一个`SKILL.md`为入口文件的标准目录. 该入口文件包含YAML前线元数据,紧跟Markeddown格式操作指南.

```figure
skill-package-anatomy
```

这是一个**目录**单个标记文件是外交部部署的最小单元,`SKILL.md`虽然它是完全正确的,但它遗漏了引用的资源文件,

### 临近概念分辨

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

发布技能 可以指导代理 如何审查发布――MCP服务器 可以暴露发布注册中心――可以禁止向主分支直接推代码――可独立审查候选版本――各组件之所以能够有机组合,正是因为它们各自坚守不同的职责边界――

### 技能 一词指向的两种不同的理念

在科学研究领域,技能有时指代已熟悉的程序代码,成功的交互轨迹,或针对特定环境的策略片段.

本系列课程中的代理技能是截然不同的.它是一个手工编写或精选的软件包,具有明确声明的文件系统协议,技能目录和数据,渐进式上下载,由运行时介导的调用机制以及主机严格掌握的工具权限.它可以由代理辅助生成或改进,但其格式本身并不强制依赖强化学习或探索训练.

| 评估维度 | Agent Skill 软件包 | 习得的 Skill 库 |
|---|---|---|
| 基本单元 | 包含 `SKILL.md` 的目录 | 程序代码、策略片段、交互轨迹或记忆记录 |
| 创建方式 | 人工编写、生成或精选策划 | 通常由 agent 在环境交互中自主探索习得 |
| 选用机制 | 依赖目录描述（Description）加运行时策略 | 基于任务状态的向量检索或策略匹配 |
| 执行方式 | 模型遵循 Markdown 指令并调用宿主工具 | 环境直接执行存储的行为逻辑或代码产物 |
| 可移植性 | 程序包契约可在所有兼容的宿主间流通 | 通常与特定环境及特定的动作空间深度绑定 |
| 评测标准 | 路由准确率、制品质量、安全及宿主兼容性 | 强化学习奖励值、任务成功率、泛化能力及库规模 |

这两种理念都在于可复制的能力,但不要仅仅因为它们具有相同的名称,

### 可移植的核心规范

代理技能规范在前面中强制要求两个必填字段:

```yaml
---
name: release-readiness
description: Inspect a release candidate when the user asks whether a version is ready to publish.
---
```

`name`是稳定标识符,必须符合规范命名约束,并且必须完全与父目录名称一致.`description`既是给人类看的文档,也是模型进行语义路由的关键元数据.**能做什么**以及**何时应当选用它**,我知道.

核心规范允许的可选字段包括:

| 字段 | 用途 | 可移植性说明 |
|---|---|---|
| `license` | 声明该程序包的开源或商用许可条款 | 核心标准规范 |
| `compatibility` | 声明环境要求（如 Python 3.10+、特定 CLI 工具等） | 核心标准规范 |
| `metadata` | 携带字符串键值的自定义扩展数据 | 核心标准规范 |
| `allowed-tools` | 建议预先批准的工具列表 | 实验性特性；不同宿主支持度不一 |

标记下正文承载操作指南. 它应清晰界定工作流程,关键决策分歧点,异常失败处理策略以及指向配套资源文件的相对路径.

```markdown
# Release readiness

Use this workflow for a release candidate, not for ordinary development builds.

1. Read `references/release-policy.md`.
2. Run `python3 scripts/inspect_release.py --format json`.
3. Stop if the report contains a blocking failure.
4. Produce the checklist from `assets/release-checklist.md`.
5. Ask for approval before any publish or tag action.
```

### 运行时扩展(运行时间延长) 是第二层

部分主机允许在前面材料中写额外字段或关联特定配置文件. 这些字段在特定平台上非常有用,但它们不属于通用可移植标准.

| 行为特性 | 宿主扩展示例 | 属于通用核心规范？ |
|---|---|:---:|
| 对模型自主路由隐藏，但保留用户手动直接调用 | `disable-model-invocation` | 否 |
| 对用户的命令菜单隐藏，但允许模型自主路由选用 | `user-invocable` | 否 |
| 在斜杠命令菜单中展示参数使用提示 | `argument-hint` | 否 |
| 在被委托的隔离子上下文中运行该 skill | `context`, `agent` | 否 |
| 固定模型型号或思考计算等级（Reasoning Effort） | `model`, `effort` | 否 |
| 注册生命周期自动化钩子 | `hooks` | 否 |
| 在 Codex 中禁用隐式调用 | `agents/openai.yaml` 策略 | 否 |

应将每一个专利扩展视为外接适配器. 确保即使剥离这些字段,核心工作流仍然是合法的;为它们编写降级回归文档,并实际消费它们的主机完成针对性测试.

### 前面的数据是可执行的

在技能正文被模型阅读之前,已经改变了系统运行行为:

- 格式错误的`name`直接导致服务发现失败.
- 含糊不清的`description`导致错误的意图路由.
- 仅仅仅是人工调用标志会将该技能从模型可用的技能目录中彻底除.
- 工具预授权配置会改变主机是否弹出用户授权确认框.
- 上下文委托设置会将后续执行重定向独立子代理 会话中.

必须像审查配置文件和业务代码一样严格审查前面问题――对其进行自动静态校验,纳入版本控制,并将其路由行为纳入Eval评测体系――

### 技能的生命周期

```figure
skill-runtime-lifecycle
```

图中的每一个箭头都代表着一个具有独立的失败模式的边界:

1. **服务发现（Discovery）：**在预配置目录路径中检查可用的程序包.
2. **静态校验（Validation）：**在被曝光之前,坚决拦截了错误或不安全的程序包.
3. **编目索引（Cataloging）：**仅向模型上下文暴露精简的`name`与`description`没有任何问题.
4. **决策选择（Selection）：**通过模型或明确指令确定该技能是否与当前任务相关.
5. **按需激活（Activation）：**将`SKILL.md`正文全量载入可见的模型上下文中.
6. **渐进披露（Disclosure）：**只有在特定分支步骤真正需要时才读取参考或资产.
7. **执行推进（Execution）：**在主管权限审查和沙箱隔离规则下调用各类主管工具.
8. **结果核验（Verification）：**独立于模型的自述表态,客观核验最终产生的制品质量.

混这些阶段会导致错误的思维模型:被发现的技能不等于已被激活;已激活的技能不等于获得所描述的所有操作权限;单次工具调用被放弃不等于最终产生的业务结果是正确的.

### 技能与工具 正交互补

解决方案是:当前应用程序可以调用哪些外部能力,它们的参数方案是什么?

```figure
skill-tool-orthogonality
```

技能正文中可以提及某种工具的名称,但实际的工具注册和调用权完全归属主运行时. 如果运行环境中缺少该工具,技能应提供明确的降级说明或直接清晰报错,绝不能错误地认为在文本中提及某种能力就会空虚创造该工具.

### 技能与代码库说明 库说明) 属于不同作用域

代码库说明文件`AGENTS.md`) 用于描述你**当前所处**环境:构建命令,编码风格,生成文件规则和安全红线.

当两者同时适用时,用户的即时指令与当前代码库的既定规则具有更高的优先级,并对技能形成约束.例如,一个通用重构技能绝不能超越本地代码库的严禁手动修改自动生成文件的铁路规律.

### 之间不进行代码级 进口

一个技能可以在正文中导向代理调用另一个技能,但这绝对不是编程语言层面的代码.`import` 应用于第二个技能 仍然必须在运行过程中完成服务发现,进入资格审查,动态激活,权限校验以及独立的上下文管理.

在编写跨技能时,应将其描述为可观测的工作流程步骤:

```markdown
After producing the candidate changelog, invoke the `release-risk-review` skill.
Pass the candidate path and require a blocking or non-blocking verdict.
If that skill is unavailable, stop and report the missing dependency.
```

这种表达方式使依赖关系能够被明确测试,并为主机提供运行时执行合规策略的机会.

## 动手构建

`code/main.py`实现一个轻量级的标准验证器和组件选型器. 整个过程只依赖于Python 标准库,确保每个规则是完全透明的.

验证器对外暴露:

- `parse_frontmatter(text)`现在,我们已经开始了.
- `validate_skill_text(text, directory_name, allowed_runtime_extensions=())`严格校验必填字段"",命名约束"",未声明扩展"",正文存在性以及可移植长度限制"",
- `ValidationIssue`与`SkillReport`返回完整的结构化审计证据,而不是单一的不透明的布尔值.
- `FrontmatterSyntaxError`针对无法安全解析的非法语法输入快速抛出异常.

选型器对外暴露`TaskShape`与`select_primitives(task)`△根据任务的实际特征,将其准确映射为普通代码、代码库说明、技能、、子器或MCP工具──

运行实验:

```bash
cd "$(git rev-parse --show-toplevel)"
cd phases/13-tools-and-protocols/22-skills-and-agent-sdks
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

命令块需要本地对环境进行克隆,并可以从该仓库中启动任意目录,以便`git rev-parse --show-toplevel`解析代码库根路径──

运输输采用JSON格式打印一个合规的纯可移植技能,一个包含主机扩展技能,一个非法程序包,以及多个任务特征的选项决策结果.仔细观察输出的问题代码.

### 验证顺序至关重要

在执行深层次内容规则之前,必须先验证销售的结构性特征:

```figure
skill-validation-order
```

按照这一严格的顺序,能够有效防止下级派生错误掩盖系统最初被破坏的核心不变量.

## 使用它

在编写新技能之前,请认真填写这个决策卡:

| 决策问题 | 若答案为“是” | 最匹配的基本构件 |
|---|---|---|
| 该任务是否需要在多个步骤中反复运用模型的主观判断？ | 操作流程基本固定，但具体决策千变万化 | Skill |
| 该操作是否必须在特定事件发生时 100% 强制触发？ | 哪怕遗漏一次执行也是完全不可接受的故障 | Hook 或常规业务代码 |
| 模型是否需要调用具有类型化输入的外部能力？ | 该操作本身存在于模型的思维上下文之外 | Tool 或 MCP Server |
| 该工作是否需要完全隔离的上下文、独立状态或责任归属？ | 由独立的执行单元完成工作并仅返回受限结果 | Subagent |
| 该指南是否仅适用于当前这一个特定的代码库？ | 描述的是本地开发命令、目录规范与约束边界 | 代码库说明（如 AGENTS.md） |
| 单次简短的即时交互是否就足以解决问题？ | 无需任何版本化和包生命周期的管理维护 | Prompt |

许多复杂的生产阶段工作流程往往是多种构件的组合.

## 交付它

本课在`outputs/`现在已经交付完整了.`skill-contract-reviewer`程序包――它包含:

- 一份可移植的`SKILL.md`审查和评估技能程序包;
- 针对可移植标准和基本构件选型的参考核对清单(参考);
- 一个确定性的自动化验证脚本 (Scripts);
- 覆盖快速,技能,工具,子,普通代码和子代码的全量任务特征测试具(资产)

装备整个套件,而不仅仅是其进口文件:

```bash
cd "$(git rev-parse --show-toplevel)"
python3 scripts/install_skills.py /tmp/aiefs-skills --phase 13 --type skill
```

课程安装脚本会输出复制的每个阶段13技能,并生成`/tmp/aiefs-skills/manifest.json`◎该干净的安装目录用于验证包结构形态;而前文的十分钟极速初步体验则验证了在真实宿主环境中的服务发现和调用执行.

随后的课程将逐步深化每一个生命周期阶段:第24课攻略服务发现与渐进的披露;第25课深入调用策略与语义路由;第26课严格解权限控制与沙箱隔离;第27课则将整个程序包成由严格的Eval评测的可交付发布制品.

## 课后深度练习

1. 使用 `TaskShape`为了你自己的团队日常的5个真实研发工作流进行结构分类.
2. 编写边界测试用例:证明刚好 500个字符的`compatibility`字段能顺利通过,而501字符的值将被视为超出规范标准的误准拦截.
3. 在白名单中新增一个运行时扩展字段.编写自动化测试,证明该文件在成功识别中,仍然能够与纯可移植的技能得到清晰的区分.
4. 长达400行的庞大的重构快速拆除`SKILL.md`、一个专用参考资料 (引用) 、一个脚本接口契约,以及一个产品输出模板――确保每份分开的文件都在其职务中――
5. 对于某个引用当前环境中不可用的MCP工具的技能 设计降级报错响应――坚决不允许暗中将其替换为权限更广泛的其他工具――
6. 审查现有技能,将每一句话分别打标签:意图路由,操作规则,安全策略,参考资料指标或输出格式协议.

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

- [Agent Skills 规范官方文档](https://agentskills.io/specification)- 权威的可移植目录与前面材料 契约标准
- [Agent Skills 最佳实践指南](https://agentskills.io/skill-creation/best-practices)- 作用域界定"",指令编写及资源编排最佳范式.
- [OpenAI: 构建 Skills 开发者指南](https://learn.chatgpt.com/docs/build-skills)- 深入了解"Codex"环境下的服务发现与调用行为
- [Claude Code Skills 文档](https://code.claude.com/docs/en/skills)- 涵盖平台调用机制,参数提示,工具预授权及下文委托扩展的完整参考.
