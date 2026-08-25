# Skill 发现与渐进式披露

> Skill 在加载其主体之前就能发挥作用。它的名称和描述使其获得目录中的一席之地；只有当任务需要时，其更深层的文件才会进入 Context。

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 22（Agent Skills：可移植契约与 Runtime 边界）
**Time:** ~105 分钟

## 学习目标

- 构建一个文件系统发现 Pipeline，将作用域、验证、冲突策略和目录发布分离。
- 解释三个披露级别：目录元数据、已激活指令和任务特定资源。
- 设计 references，使 Agent 无需加载整个软件包即可直接访问所需细节。
- 分别规划目录空间和已激活 Skill 的 Context。
- 当 Skill 读取自身资源时，拒绝路径遍历和 symlink 逃逸。

## 问题

你的 Agent 安装了 200 个 Skill。如果在会话开始时加载每个 `SKILL.md`、reference 文件、script 和 template，当前任务就会被无关流程淹没。什么都不加载，则会迫使用户记住准确的文件系统路径。

常见的折中方案是目录：为每个符合条件的 Skill 向 Model 展示紧凑的身份信息和路由描述，然后仅在选中后加载完整主体。这会带来两个新的工程问题。

首先，发现过程不只是递归文件搜索。Skill 可以存在于 project、user、administrator、plugin 或 built-in 作用域中。两个软件包可能使用相同名称。symlink 可能指向受信任根目录之外。格式错误的软件包可能占用目录空间，或变得无法调用。

其次，渐进式披露可能演变为渐进式混乱。如果 `SKILL.md` 写着“阅读相关指南”，而软件包中有十二份指南，Model 就必须猜测。如果每份指南又指向另外三个文件，加载过程就会变成无边界的图遍历。

良好的 Runtime 会让发现过程具有确定性，并让披露行为具有明确意图。

## 概念

### 发现过程是一个编译器 Pipeline

将文件系统视为源输入。不要把原始路径直接发布给 Model。

```figure
skill-discovery-pipeline
```

每个阶段都应该生成结构化数据和结构化失败信息。发现日志应该能够回答：

- 搜索了哪些根目录？
- 找到了哪些候选项？
- 哪些候选项被拒绝，原因是什么？
- 冲突中哪个软件包胜出？
- 哪些目录条目因预算限制而被缩短或省略？

如果没有这些证据，“Model 没有使用我的 Skill”几乎无法诊断。

### 作用域是 Runtime 策略

可移植规范定义了 Skill 软件包，而不是唯一通用的安装路径或优先级顺序。由 host 决定搜索位置。

通用 Runtime 可能使用以下作用域：

| 作用域 | 示例根目录 | 预期所有者 |
|---|---|---|
| Workspace | `<repo>/.agents/skills/` | Project 维护者 |
| User | `<user-data>/skills/` | 单个开发者 |
| Administrator | `<system>/skills/` | 机器或组织策略 |
| Plugin | 已签名的 plugin bundle | Plugin 发布者和安装者 |
| Built-in | Runtime package | Runtime 供应商 |

截至 2026 年 8 月，Codex 文档说明，project 发现过程会从 `$CWD/.agents/skills` 开始，沿祖先目录一直搜索到 repository 根目录，并额外搜索 user、administrator 和 built-in 位置。它支持使用 symlink 的 Skill 目录。重名 Skill 可能同时出现，而不是合并。这些是 Codex 的行为，并非 `SKILL.md` 的要求；编写 adapter 时，请核验当前的 [Codex Skill 文档](https://learn.chatgpt.com/docs/build-skills)。

绝不要根据目录名称臆造优先级。应将其声明为策略并进行测试。本课实验为每个 `Scope` 使用显式整数 rank，确保相同的候选集合始终以相同方式解析。

### 冲突需要超越 `name` 的身份信息

两个名为 `release-readiness` 的软件包都可能是合法的。一个可能是 workspace override，另一个可能是 user default。因此，目录条目至少需要包含：

```json
{
  "name": "release-readiness",
  "description": "检查此 repository 的 release candidate。",
  "scope": "workspace",
  "source": "/repo/.agents/skills/release-readiness",
  "selected": true
}
```

常见的冲突策略包括：

| 策略 | 优点 | 风险 |
|---|---|---|
| 保留每个候选项 | 不会隐藏任何内容 | Model 会看到含义不明确的重名项 |
| 优先级最高的作用域胜出 | 调用方式简单 | 本地软件包可能遮蔽受信任的软件包 |
| 拒绝重名项 | 不会发生静默遮蔽 | 合法 override 将无法工作 |
| 使用来源限定名称 | 身份明确 | 面向用户的名称会变长 |

为 host 选择一种策略。即使被拒绝或遮蔽的候选项不会出现在 Model 目录中，也要将它们保留在诊断信息中。

### 三个披露级别

Agent Skills 规范描述了分阶段加载。关键在于，每个级别都有不同用途。

```figure
skill-disclosure-levels
```

#### Level 1：目录元数据

Model 需要足够的信息来区分该 Skill 与相邻 Skill。规范估计每个目录条目约占 100 个 Token，但实际的序列化和 Tokenization 由 host 决定。

有用的描述包含两个分句：

```yaml
description: 验证 release candidate 并生成 readiness report。当用户询问某个 version、tag 或 package 是否已准备好发布时使用。
```

第一个分句说明能力。第二个分句说明触发边界。Lesson 25 使用正向 Prompt 和近似但不匹配的 Prompt 来评估这一边界。

#### Level 2：已激活指令

激活后，主体应同时充当地图和流程。规范建议将 `SKILL.md` 控制在 500 行以内。这是一个设计信号，而不是需要填满的目标。

主体应该包含：

- 任务边界；
- 默认工作流；
- 分支条件；
- 指向更深层文件的直接 references；
- Tool 和 script 契约；
- 失败和停止行为；
- 预期输出及其验证方式。

不要仅仅为了缩短入口文件，就把核心工作流移入 reference。激活必须为 Model 提供足够的 Context，使其能够正确开始。

#### Level 3：支持资源

References 提供说明或数据。Scripts 提供确定性计算。Assets 会被复制、填充或转换为交付物，而不是被当作指令处理。

| 目录 | Model 会读取吗？ | Model 会执行吗？ | 典型内容 |
|---|:---:|:---:|---|
| `references/` | 是，在需要时 | 否 | schema、policy、领域指南 |
| `scripts/` | 可能检查 | 通过允许的 Tool | validator、converter、collector |
| `assets/` | 仅在有用时 | 否 | template、fixture、image、starter file |

这些名称只是约定，并不具备神奇能力。host 仍然需要文件访问权限和执行 Tool。

### 分支特定的 references 优于主题堆砌

将入口文件写成决策地图：

```markdown
## 选择路径

- 对于 Python package，阅读 `references/python-release.md`。
- 对于 container image，阅读 `references/container-release.md`。
- 对于仅包含文档的 release，阅读 `references/docs-release.md`。
- 如果 release 包含多种 artifact type，只阅读与这些 artifact 对应的指南。
```

这样，每个 reference 都有可观察的加载条件。“阅读 `references/` 以了解更多信息”则没有。

保持 reference graph 浅层化。官方指南建议从 `SKILL.md` 直接链接，并避免过深的链。单跳结构使可达性能够被测试，也能降低所需约束始终未进入 Context 的概率。

```figure
skill-reference-map
```

### 目录预算与活跃 Context 是两种不同的预算

令 `c_i` 表示 Skill `i` 序列化后的目录成本，`B_c` 表示目录预算，`b_j` 表示已激活主体的成本，`r_k` 表示实际加载的资源。

```text
catalog_cost = sum(c_i for every published skill)
active_cost = sum(b_j for every activated skill) + sum(r_k for every disclosed resource)
```

减少一种预算不会自动减少另一种预算。简短的描述可以节省目录空间，但一个已激活的 900 行主体仍可能压垮任务。只有当 Runtime 和指令确实避免加载无关分支时，将主体拆分为 references 才能降低活跃 Context 成本。

当 Context window 大小已知时，Codex 当前会将初始 Skill 列表的预算设为 Context window 的 2%。8,000 字符仅是在大小未知时使用的 fallback；它不是与 2% 规则同时应用的第二个上限。当目录超过适用预算时，描述可能会被缩短或省略。应将这些数值视为当前 Codex 策略，而不是 Agent Skills 标准的属性。

### 资源路径是信任边界

Skill 应该只读取其软件包内部的文件。仅使用字面字符串前缀检查并不足够：

```text
references/../../../../.ssh/config
references/external-link -> /private/company-secrets
```

使用文件系统语义解析软件包根目录和候选路径，拒绝绝对路径输入，并验证解析后的候选路径仍位于解析后的根目录之下。在发现之前决定是否允许 symlink。如果允许，每次都要检查解析后的目标。

```figure
skill-resource-containment
```

路径包含关系并不能建立内容信任。软件包内的有效 reference 仍然可能包含恶意指令。Lesson 26 会处理该威胁。

### 加载必须可观察

记录披露事件，但不要记录 secret：

```json
{
  "event": "skill.resource.loaded",
  "skill": "release-readiness",
  "resource": "references/python-release.md",
  "reason": "candidate 包含 pyproject.toml",
  "bytes": 2840
}
```

原因字段会把 Context 选择转化为可审查的证据。它还有助于识别那些导致 Agent“以防万一”而加载每个文件的指令。

## 动手构建

`code/main.py` 构建了一个具有确定性的发现与披露引擎。

发现部分包括：

- `Scope`，用于来源和优先级元数据；
- `SkillCandidate`，用于尚未验证的文件系统候选项；
- `discover_scope(scope)`，用于枚举直接子级 Skill 目录；
- `resolve_collisions(candidates, precedence)`，用于应用一种已声明的策略；
- `CatalogEntry` 和 `build_catalog(...)`，用于发布受限的元数据；
- `CatalogBudget`，用于统计序列化条目，但不会假装字符是通用 Token。

披露部分包括：

- `load_skill_body(entry, ...)`，用于 Level 2 激活；
- `validate_reference(skill_dir, reference)`，用于路径包含验证；
- `load_reference(...)`，用于受限的 Level 3 读取。

运行实验：

```bash
cd "$(git rev-parse --show-toplevel)"
cd phases/13-tools-and-protocols/24-skill-discovery-and-progressive-disclosure
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

此代码块需要本地 clone，并能从该 clone 内的任意工作目录解析 repository 根目录。

Demo 会创建临时 project 和 user 作用域，插入一个冲突，在刻意设置得很小的预算下构建目录，激活一个 Skill，并分别尝试有效的 reference 读取和路径遍历逃逸。它不会安装任何永久文件。

### 为什么发现过程是浅层的

`discover_scope` 会检查直接子目录中是否存在 `SKILL.md`。它不会递归地把每个嵌套的 `SKILL.md` 都视为独立软件包。这样可以保留软件包边界，并避免意外发布已安装 Skill 内部的 example 或 fixture。

### 为什么实验不解析任意 YAML

实验支持其目录所需的标量 frontmatter。生产 Runtime 应使用安全的 YAML parser，并配置显式 schema、大小限制，同时禁用自定义对象构造。“仅使用 stdlib”是一项教学约束，并不意味着可以静默发明不完整的 YAML 方言。

## 实际应用

将此检查清单应用于任何发现 adapter：

1. 列出每个已配置根目录，以及谁可以写入该目录。
2. 说明是否允许使用 symlink 的软件包。
3. 验证软件包名称、目录名称、必需元数据和入口主体大小。
4. 在内部身份信息中保留来源和作用域。
5. 声明并测试重名行为。
6. 测量发送给 Model 的确切序列化目录。
7. 记录加载主体或资源的原因。
8. 将资源读取限制在解析后的软件包根目录内。
9. 当引用的文件缺失时明确失败。
10. 当安装内容或策略发生变化时重新构建目录。

## 交付成果

本课会生成 `skill-catalog-builder` bundle。它会扫描显式排序的根目录，拒绝使用 symlink 的入口文件和名称与目录不匹配的项目，解决跨作用域冲突，拒绝同等优先级的重名项，并使选中的元数据符合已声明的条目数、描述长度和序列化字符预算。

其 JSON report 包含选中的条目、被遮蔽的候选项、省略的条目、验证错误、优先级和预算使用情况。主体和 reference 加载仍是独立的 Runtime 操作，因此目录构建器不会执行 script，也不会让整个软件包进入 Context。

## 练习

1. 添加一个 plugin 作用域，并将其优先级放在 user 与 built-in 之间。使用测试证明冲突结果。
2. 将冲突策略从最高优先级改为限定名称。在目录中保留两个条目。
3. 为 `load_reference` 添加字节大小限制。测试一个大小恰好达到上限的文件，以及一个超出上限一字节的文件。
4. 创建两个听起来几乎相同的描述。重写它们，使触发边界不重叠。
5. 添加一个 manifest，其中包含每个 reference 和 script 的 hash。在加载前检测被修改的资源。
6. 为 Demo 添加检测功能，分别报告 Level 1、Level 2 和 Level 3 的字节数。

## 关键术语

| 术语 | 人们通常怎么说 | 它的实际含义 |
|---|---|---|
| Skill discovery | “找到每个 SKILL.md” | 搜索已配置的作用域、验证软件包、附加来源信息并应用策略 |
| Skill catalog | “已安装 Skill 的列表” | 面向 Model 的紧凑路由元数据，用于符合条件的软件包 |
| Collision policy | “哪个重名项胜出” | 针对不同来源中同名候选项的已声明规则 |
| Progressive disclosure | “延迟加载” | 从目录到主体，再到分支特定资源的分阶段 Context 准入 |
| Reference graph | “由 Skill 链接的文件” | 可达的资源结构及其加载条件 |
| Path containment | “留在文件夹内” | 验证解析后的资源目标仍位于解析后的软件包根目录内 |

## 延伸阅读

- [Agent Skills specification](https://agentskills.io/specification)，了解软件包结构和渐进式披露级别。
- [Optimizing skill descriptions](https://agentskills.io/skill-creation/optimizing-descriptions)，了解目录路由元数据。
- [Agent Skills best practices](https://agentskills.io/skill-creation/best-practices)，了解直接 references 和入口文件大小。
- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills)，了解当前 Codex 发现作用域和目录限制。
