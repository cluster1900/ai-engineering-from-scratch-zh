# Skill 发现与渐进式披露

> 一个 skill 在其正文被加载之前就已经发挥作用了。它的名称和描述在目录中赢得一席之地；而其更深层次的文件只有在任务实际触及它们时，才有资格进入上下文。

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 22 (Agent Skills: Portable Contract and Runtime Boundary)
**Time:** ~105 minutes

## 学习目标

- 构建一个将作用域（scope）、校验、冲突策略和目录发布明确解耦的文件系统发现流水线（discovery pipeline）。
- 解释三种渐进式披露级别（three disclosure levels）：目录元数据（catalog metadata）、激活指令（active instructions）和特定任务资源（task-specific resources）。
- 设计 references（参考文档），使 agent 能够直接获取所需的详细信息，而无需加载整个包。
- 将目录空间预算（catalog budget）与激活 skill 的活跃上下文独立核算。
- 在 skill 读取自身资源时，拒绝路径遍历（path traversal）和符号链接逃逸（symlink escape）。

## 问题

你的 agent 安装了 200 个 skills。如果在会话开始时就加载每一个 `SKILL.md`、参考文件（reference file）、脚本和模板，当前任务就会被淹没在无关的流程细节中。而如果什么都不加载，用户就必须记住精确的文件系统路径。

常见的折中方案是目录（catalog）：向模型展示每个合格 skill 的紧凑标识和路由描述，仅在选中后才加载完整正文。这带来了两个新的工程问题。

首先，发现（discovery）不仅仅是递归文件搜索。Skills 可以存在于项目工作区（workspace）、用户（user）、管理员（administrator）、插件（plugin）或内置（built-in）作用域中。两个包可能同名。符号链接可能指向受信任根目录之外。格式错误的包可能会消耗目录空间，或者根本无法被调用。

其次，渐进式披露（progressive disclosure）可能会演变成“渐进式混乱”。如果 `SKILL.md` 写着“阅读相关指南”，而包内包含 12 份指南，模型就只能靠猜。如果每份指南又指向另外 3 个文件，加载过程就会变成无界的图遍历。

一个优秀的运行时（runtime）能让发现过程具有确定性，并让信息披露深思熟虑。

## 概念

### 发现是一个编译器流水线

将文件系统视为源码输入。不要直接将原始路径发布给模型。

```figure
skill-discovery-pipeline
```

每个阶段都应该产生结构化数据和结构化错误。发现日志应该能够回答：

- 搜索了哪些根目录？
- 找到了哪些候选包？
- 拒绝了哪些候选包，原因是什么？
- 在名称冲突中哪个包胜出？
- 由于预算限制，哪些目录条目被截短或省略？

如果没有这些可观测证据，去诊断“为什么模型没有使用我的 skill”几乎是不可能的。

### 作用域是运行时策略

可移植规范定义了 skill 包的结构，但没有定义单一通用的安装路径或优先级顺序。由 host（宿主环境）决定从哪里进行搜索。

一个通用运行时可能使用以下作用域：

| 作用域 (Scope) | 示例根目录 | 预期所有者 |
|---|---|---|
| Workspace (工作区) | `<repo>/.agents/skills/` | 项目维护者 |
| User (用户) | `<user-data>/skills/` | 单个开发者 |
| Administrator (管理员) | `<system>/skills/` | 机器或组织策略 |
| Plugin (插件) | 已签名的插件包 | 插件发布者与安装者 |
| Built-in (内置) | 运行时自带包 | 运行时提供商 |

截至 2026 年 8 月，Codex 文档规定项目级发现会从 `$CWD/.agents/skills` 开始向上遍历祖先目录直至代码仓库根目录，外加用户、管理员和内置位置。它支持符号链接的 skill 目录。同名 skill 可能会同时出现，而不是被合并。这些是 Codex 的具体行为，并非 `SKILL.md` 规范的强制要求；在编写适配器时，请查阅最新的 [Codex skill 文档](https://learn.chatgpt.com/docs/build-skills)。

绝不要凭空从目录名称推断优先级。应将其声明为明确的策略并进行测试。本课实验为每个 `Scope` 使用显式整数优先级（integer rank），确保相同的候选集合始终解析出相同的结果。

### 冲突需要超越 `name` 的唯一标识

两个都叫 `release-readiness` 的包可能是合法的。一个可能是项目级覆盖（workspace override），另一个是用户默认配置。因此，目录条目至少需要：

```json
{
  "name": "release-readiness",
  "description": "Inspect a release candidate for this repository.",
  "scope": "workspace",
  "source": "/repo/.agents/skills/release-readiness",
  "selected": true
}
```

常见冲突策略包括：

| 策略 | 优势 | 风险 |
|---|---|---|
| 保留所有候选包 | 不会隐藏任何内容 | 模型会看到歧义的名称 |
| 最高优先级作用域胜出 | 调用简单直接 | 本地包可能会遮蔽（shadow）受信任的包 |
| 拒绝重复项 | 无隐式遮蔽 | 合法的覆盖机制将失效 |
| 按来源限定名称（命名空间化） | 身份明确 | 面向用户的名称变长 |

为 host 选择一种策略。即使某些候选包未出现在模型目录中，也要在诊断日志中保留被拒绝或被遮蔽的候选包信息。

### 三个披露级别

Agent Skills 规范描述了分阶段加载（staged loading）。其关键在于每个级别都有不同的目的。

```figure
skill-disclosure-levels
```

#### Level 1: 目录元数据 (Catalog Metadata)

模型需要足够的信息将该 skill 与相邻的 skills 区分开来。规范估计每个目录条目大约占用 100 个 tokens，但实际的序列化和 tokenization 细节由 host 决定。

一个有用的描述包含两个子句：

```yaml
description: Validate a release candidate and produce a readiness report. Use when the user asks whether a version, tag, or package is ready to publish.
```

第一个子句说明能力（capability）。第二个子句说明触发边界（trigger boundary）。第 25 课将使用正向测试用例和近邻误触发测试用例（near-miss prompts）来评估这个边界。

#### Level 2: 激活指令 (Active Instructions)

激活后，正文应当扮演路线图与工作流程的角色。规范建议将 `SKILL.md` 保持在 500 行以内。这是一个设计指引信号，而不是非要填满的目标。

正文应包含：

- 任务边界；
- 默认工作流；
- 分支条件；
- 指向更深层次文件的直接引用；
- 工具和脚本契约（contract）；
- 故障与停止行为；
- 预期输出及其验证方法。

不要仅仅为了让入口文件变短，就把核心工作流移到 reference 中。激活必须为模型提供足够的上下文以正确起步。

#### Level 3: 支撑资源 (Supporting Resources)

References 提供详细说明或数据。Scripts 提供确定性计算。Assets 则作为可供复制、填充或转换为最终交付物的材料，而不是指令本身。

| 目录 | 模型是否读取？ | 模型是否执行？ | 典型内容 |
|---|:---:|:---:|---|
| `references/` | 是，在需要时 | 否 | schemas、策略、领域指南 |
| `scripts/` | 可以视情况检视 | 通过被允许的工具 | 验证器、转换器、数据收集器 |
| `assets/` | 仅在有用时 | 否 | 模板、fixtures、图像、起始文件 |

这些目录名称只是约定，并非固有魔法能力。Host 仍然需要文件访问权限和执行工具。

### 面向分支的具体参考优于粗暴的专题倾倒

将入口文件写成决策图：

```markdown
## Choose the path

- For a Python package, read `references/python-release.md`.
- For a container image, read `references/container-release.md`.
- For a documentation-only release, read `references/docs-release.md`.
- If the release combines artifact types, read only the guides for those artifacts.
```

这给每个 reference 一个可观察的加载条件。而“阅读 `references/` 获取更多信息”则没有这种明确性。

保持引用图（reference graph）扁平浅显。官方指南建议从 `SKILL.md` 直接链接，避免深层调用链。单跳（one hop）使得可达性易于测试，并降低所需约束条件从未进入上下文的风险。

```figure
skill-reference-map
```

### 目录预算与活跃上下文是两种独立的预算

设 $c_i$ 为 skill $i$ 序列化后的目录开销，$B_c$ 为目录预算，$b_j$ 为激活正文开销，$r_k$ 为实际加载的资源开销。

```text
catalog_cost = sum(c_i for every published skill)
active_cost = sum(b_j for every activated skill) + sum(r_k for every disclosed resource)
```

削减一种预算并不会自动减少另一种预算。简短的描述可以节省目录空间，但被激活的 900 行正文仍然可能会压垮任务上下文。将正文拆分到 references 中，只有在运行时和指令实际避免加载不相关分支时，才能真正减少活跃上下文开销。

Codex 目前在已知上下文窗口大小的情况下，将初始 skill 列表的预算控制在上下文窗口的 2%。8,000 字符的限制仅在上下文窗口大小未知时作为回退机制；它并不是与 2% 规则叠加的第二个上限。当目录超出适用预算时，描述可能会被截短或省略。请将这些数字视为 Codex 当前的具体策略，而非 Agent Skills 标准的普遍属性。

### 资源路径是信任边界

一个 skill 应该只能读取自身包内部的文件。字面字符串前缀检查是远远不够的：

```text
references/../../../../.ssh/config
references/external-link -> /private/company-secrets
```

使用文件系统语义解析包根目录和候选路径，拒绝绝对路径输入，并验证解析后的候选路径是否仍然位于解析后的根目录之下。在发现之前决定是否允许符号链接。如果允许，每次都必须检查解析后的实际目标。

```figure
skill-resource-containment
```

路径限制并不能建立内容信任。一个有效的包内 reference 仍然可能包含恶意指令。第 26 课将专门处理这一威胁。

### 加载过程必须可观测

记录披露事件，同时避免记录机密信息：

```json
{
  "event": "skill.resource.loaded",
  "skill": "release-readiness",
  "resource": "references/python-release.md",
  "reason": "candidate contains pyproject.toml",
  "bytes": 2840
}
```

`reason` 字段将一次上下文选择转化为可供审查的证据。它还有助于识别出那些导致 agent“以防万一”而加载所有文件的糟糕指令。

## 构建它

`code/main.py` 构建了一个确定性的发现与披露引擎。

发现模块的接口包括：

- `Scope`：用于来源和优先级元数据；
- `SkillCandidate`：表示未校验的文件系统候选包；
- `discover_scope(scope)`：枚举直接下层的 skill 目录；
- `resolve_collisions(candidates, precedence)`：应用声明的冲突策略；
- `CatalogEntry` 与 `build_catalog(...)`：发布有界的元数据；
- `CatalogBudget`：核算序列化条目的空间占用，避免假定字符数等于通用 token 数。

披露模块的接口包括：

- `load_skill_body(entry, ...)`：用于 Level 2 的激活加载；
- `validate_reference(skill_dir, reference)`：用于路径限制检查；
- `load_reference(...)`：用于有界的 Level 3 读取。

运行实验：

```bash
cd "$(git rev-parse --show-toplevel)"
cd phases/13-tools-and-protocols/24-skill-discovery-and-progressive-disclosure
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

该命令块需要本地 git clone 环境，并可从该 clone 内部的任意工作目录解析出仓库根路径。

该演示会创建临时的项目作用域和用户作用域，引入冲突，在故意设置的极小预算下构建目录，激活一个 skill，并分别尝试合法的 reference 读取和目录遍历逃逸。演示不会安装任何永久文件。

### 为什么发现是浅层的

`discover_scope` 仅检查直接子目录下的 `SKILL.md`。它不会递归地将每个嵌套的 `SKILL.md` 视为独立包。这保护了包边界，避免意外发布已安装 skill 内部的示例或测试 fixtures。

### 为什么实验不解析任意 YAML

实验仅支持其目录所需的标量 frontmatter。生产运行时应使用安全的 YAML 解析器，配备显式 schema、大小限制，并禁用自定义对象构造。“仅用标准库（Stdlib-only）”是一项教学约束，而不是默许随意发明不完整 YAML 方言的借口。

## 使用它

将此检查清单应用于任何发现适配器：

1. 列出每个配置的根目录及其写入权限所有者。
2. 明确说明是否允许符号链接包。
3. 校验包名、目录名、必需元数据和入口正文大小。
4. 在内部身份标识中保留来源（source）与作用域（scope）。
5. 声明并测试同名重复行为。
6. 精确测量发送给模型的序列化目录大小。
7. 记录加载某个正文或资源的原因。
8. 将资源读取严格限制在解析后的包根目录下。
9. 当引用的文件缺失时明确报错失败。
10. 当安装状态或策略发生变更时重建目录。

## 交付它

本课产出了 `skill-catalog-builder` 组件包。它按照显式指定的顺序扫描根目录，拒绝符号链接的入口文件和名称-目录不匹配项，解决跨作用域冲突，拒绝同等优先级的重复项，并在声明的条目数、描述和序列化字符预算内装入选中的元数据。

其 JSON 报告包含选中的条目、被遮蔽的候选包、被省略的条目、校验错误、优先级和预算使用情况。正文与参考文档的加载仍然作为独立的运行时操作存在，因此目录构建器不会执行脚本，也不会把整个包直接塞入上下文。

## 练习

1. 添加一个 plugin 作用域，将其优先级置于 user 与 built-in 之间。编写测试证明其冲突解决结果。
2. 将冲突策略从“最高优先级胜出”改为“限定名称（qualified names）”。在目录中保留这两份条目。
3. 为 `load_reference` 添加字节大小限制。测试一个恰好等于限制的文件和一个超出一字节的文件。
4. 编写两个听起来几乎相同的描述。重写它们，使它们的触发边界互不重叠。
5. 添加一个包含每个 reference 和 script 哈希值的 manifest。在加载前检测出被篡改的资源。
6. 为演示添加埋点，分别报告 Level 1、Level 2 和 Level 3 的字节数。

## 关键术语

| 术语 | 常见说法 | 实际工程含义 |
|---|---|---|
| Skill 发现 (Skill discovery) | “找到所有 SKILL.md” | 搜索配置的作用域，校验包，附加来源溯源信息，并应用策略 |
| Skill 目录 (Skill catalog) | “已安装 skills 列表” | 面向合格包的、模型可见的紧凑路由元数据 |
| 冲突策略 (Collision policy) | “哪个重复项胜出” | 针对来自不同来源的同名候选包所声明的处理规则 |
| 渐进式披露 (Progressive disclosure) | “懒加载” | 从目录到正文再到特定分支资源的分阶段上下文引入 |
| 引用图 (Reference graph) | “skill 链接的文件” | 可达的资源结构及其加载条件 |
| 路径限制 (Path containment) | “留在文件夹内” | 验证解析后的资源目标路径始终位于解析后的包根目录下 |

## 延伸阅读

- [Agent Skills 规范](https://agentskills.io/specification)：了解包结构与渐进式披露级别。
- [优化 skill 描述](https://agentskills.io/skill-creation/optimizing-descriptions)：了解目录路由元数据的编写。
- [Agent Skills 最佳实践](https://agentskills.io/skill-creation/best-practices)：了解直接引用与入口文件大小控制。
- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills)：了解当前 Codex 的发现作用域与目录限制。
