---
id: agent-skills
title: Agent Skills: Discovery, Invocation, Routing
code: AR
subtitle: 编写、安装、发现、调用和路由 SKILL.md 包。验证器、目录、路由器与安装器项目。
hue: 130
sources: phases/13-tools-and-protocols/22-skills-and-agent-sdks, phases/13-tools-and-protocols/24-skill-discovery-and-progressive-disclosure, phases/13-tools-and-protocols/25-skill-invocation-and-routing, projects/skill-router, projects/skill-installer, projects/skill-validator
source_hash: 42ff5f76dc9ee9e5
---

## Skill 生命周期
type: flow
from: phases/13-tools-and-protocols/22-skills-and-agent-sdks/docs/en.md

1. **发现**：在配置的位置中查找包。
2. **验证**：在进入目录前拒绝格式错误或不安全的包。
3. **编目**：只暴露 `name` 和 `description`。
4. **选择**：判断该 skill 是否与请求相关。
5. **激活**：把正文加载到模型可见的上下文中。
6. **披露**：只在某个分支需要时才读取 references 或 assets。
7. **执行**：在宿主的权限与隔离规则下使用宿主工具。
8. **验证**：独立于模型的声明去检查产出物。

## 安装、调用、移除
type: command-table
span: 2
from: phases/13-tools-and-protocols/22-skills-and-agent-sdks/docs/en.md, phases/13-tools-and-protocols/25-skill-invocation-and-routing/docs/en.md

| 命令 | 作用 |
|---|---|
| `npx skills add rohitg00/ai-engineering-from-scratch --skill skill-contract-reviewer --full-depth` | 安装包含 references、脚本和 asset 的嵌套包 |
| `/skill-contract-reviewer <request>` | 在支持 `/skill-name` 语法的宿主中显式调用 |
| `/skills` | 在 Codex 界面中按名称选择 skill |
| `python3 <SKILL_ROOT>/scripts/check_skill.py <TARGET_ROOT>/my-first-skill` | 运行包内的验证器。显示 argv、cwd 和退出码 |
| `npx skills remove skill-contract-reviewer` | 移除该包。使用相同的宿主和作用域 |
| `python3 scripts/install_skills.py /tmp/aiefs-skills --phase 13 --type skill` | 复制 Phase 13 的包并写入 `manifest.json` |
| `python3 -m unittest discover -s code/tests -v` | 运行一门课程的测试套件 |

## 项目运行与评分
type: task-table
span: 2
from: projects/skill-router/README.md, projects/skill-installer/README.md, projects/skill-installer/solution/cli.ts, projects/skill-validator/README.md

| 任务 | 代码 |
|---|---|
| 创建学习者工作区 | `python3 scripts/project_test.py skill-router --init learning-artifacts/skill-router` |
| 评分一个阶段 | `python3 scripts/project_test.py skill-router --stage 1 --path learning-artifacts/skill-router` |
| 路由示例请求 | `node learning-artifacts/skill-router/cli.ts projects/skill-router/examples/skills projects/skill-router/examples/request.json` |
| 安装演练（dry run） | `node learning-artifacts/skill-installer/cli.ts inspect projects/skill-installer/examples/orchard-release.json codex` |
| 正式安装 | `cli.ts install bundle.json agent root expected-source-digest` |
| 构建验证器 | `rustc --edition=2021 learning-artifacts/skill-validator/cli.rs -o learning-artifacts/skill-validator/validator` |
| 验证并在 2000 个字符内加载 | `validator projects/skill-validator/examples/orchard-release 2000 --activate references/restore.md` |
| 检查参考答案 | `python3 scripts/project_test.py skill-validator --all --solution --strict` |

## 验证、编目、披露、路由（课程）
type: annotated-code
lang: python
from: phases/13-tools-and-protocols/22-skills-and-agent-sdks/docs/en.md, phases/13-tools-and-protocols/24-skill-discovery-and-progressive-disclosure/code/main.py, phases/13-tools-and-protocols/25-skill-invocation-and-routing/code/main.py

```python
report = validate_skill_text(text, directory_name, allowed_runtime_extensions=())
select_primitives(task)                          # code, skill, hook, subagent, tool
candidates = (*discover_scope(Scope("project", project_root)),
              *discover_scope(Scope("user", user_root)))  # immediate children only
catalog = build_catalog(candidates, precedence=("project", "user"),
                        budget=CatalogBudget(max_entries=10, max_catalog_chars=2_000))
body = load_skill_body(selected, candidates)     # level 2
reference = load_reference(selected, "references/format.md")  # level 3
validate_reference(skill_directory, reference)   # blocks traversal and escape
route_request(skills, request, adapter)          # eligibility before ranking
build_invocation_matrix(policy)                  # human by model view
```

## 路由器与安装器（项目）
type: annotated-code
lang: ts
from: projects/skill-router/solution/main.ts, projects/skill-router/solution/cli.ts, projects/skill-installer/solution/main.ts

```ts
const skills = await loadCatalog(root);            // SKILL.md plus routing.json
rank(skills, query, files);                        // keyword 2, path 3
plan(skills, selected, allowed);                   // dependencies first
route(skills, query, files, allowed, margin = 1);  // ready, no-match, ambiguous, blocked
safePath(name);                                    // rejects .., absolute, C:, backslash
const files = translate(bundle, agent);            // new quoted header, same body
const expected = digest(bundle.files);             // SHA-256 of sorted pairs
await install(root, bundle, agent, expectedDigest);  // staged rename with backup
```

## 人工调用与模型调用
type: comparison
from: phases/13-tools-and-protocols/25-skill-invocation-and-routing/docs/en.md

| 维度 | 共享 | 仅人工 | 仅模型 | 禁用 |
|---|---|---|---|---|
| 人可调用 | 是 | 是 | 否 | 否 |
| 模型可调用 | 是 | 否 | 是 | 否 |
| 单个宿主字段 | 默认 | `disable-model-invocation: true` | `user-invocable: false` | 未定义 |
| 示例 | 测试规划 | 发布准备 | 内部风格指南 | 已弃用的包 |

## 限制与默认值
type: defaults
from: phases/13-tools-and-protocols/22-skills-and-agent-sdks/code/main.py, phases/13-tools-and-protocols/24-skill-discovery-and-progressive-disclosure/code/main.py, phases/13-tools-and-protocols/25-skill-invocation-and-routing/code/main.py, projects/skill-router/solution/main.ts, projects/skill-installer/solution/main.ts

| 设置 | 默认值 | 说明 |
|---|---|---|
| `name` 长度 | 64 | 用连字符连接的小写单词 |
| `description` 长度 | 1024 | 说明做什么、何时用 |
| `compatibility` 长度 | 500 | 可选的核心字段 |
| `max_description_chars` | 240 | 每个条目的 `CatalogBudget` |
| `max_catalog_chars` | 8_000 | `CatalogBudget` 总量 |
| `max_chars` | 12_000 | 正文与 reference 加载 |
| `model_threshold` | 0.2 | 隐式选择的下限 |
| 路由器 `margin` | 1 | 分差更小即视为有歧义 |

## 故障与修复
type: troubleshooting
from: projects/skill-router/solution/main.ts, projects/skill-installer/solution/main.ts, projects/skill-installer/solution/cli.ts, projects/skill-validator/solution/stage1.rs, projects/skill-installer/stages/04-upgrades/docs/en.md, phases/13-tools-and-protocols/22-skills-and-agent-sdks/docs/en.md, phases/13-tools-and-protocols/24-skill-discovery-and-progressive-disclosure/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| `no-match` | 没有关键词或路径得分 | 在 routing.json 中加上 `keywords` 或 `paths` |
| `ambiguous` | 前两名分差小于 `margin` | 让触发边界彼此区分 |
| `blocked` 伴随 `permission denied` | skill 或其依赖需要更多权限 | 授予权限或换一条路由 |
| `unsupported YAML syntax` | 标签、别名、多行或流式值 | 使用普通标量或双引号标量 |
| `integrity mismatch` | 包摘要与期望摘要不符 | 运行 `inspect`，比较 `source_digest` |
| `modified installation` | 安装后某个被跟踪的文件被改动 | 把修改移到源包中 |
| 安装后 skill 不可用 | 宿主没有重新扫描目录 | 开启新会话或重新扫描，再重试 |
| 模型从不选择该 skill | 描述含糊，或被预算截掉 | 检查发现日志和目录大小 |

## 编写规则
type: tips
from: phases/13-tools-and-protocols/24-skill-discovery-and-progressive-disclosure/docs/en.md, phases/13-tools-and-protocols/25-skill-invocation-and-routing/docs/en.md, phases/13-tools-and-protocols/22-skills-and-agent-sdks/docs/en.md

- `name` 必须与父目录名一致。
- 描述：一句说明能力，一句说明触发边界。
- 两个 skill 共用词语时，加上否定边界。测试擦边情况。
- 先按资格过滤，再排序。没有足够高的分数时就弃权。
- 不要把原始参数直接插入 shell 命令。
- 写明依赖的 skill 和回退方案。依赖不可用时停止。

## 问答
type: qa
from: phases/13-tools-and-protocols/22-skills-and-agent-sdks/docs/en.md, phases/13-tools-and-protocols/25-skill-invocation-and-routing/docs/en.md, projects/skill-router/README.md, projects/skill-installer/README.md

- **用 skill 还是 hook？** 每个事件都必须运行时用 hook。需要模型判断时用 skill。
- **用 skill 还是 MCP 工具？** 有类型的外部能力用工具。流程用 skill。
- **显式点名能绕过策略吗？** 不能。它仍要通过每一道门禁。
- **路由器会运行 skill 吗？** 不会。它只输出计划和解释。
- **安装成功能证明已激活吗？** 不能。agent 必须能发现它。
