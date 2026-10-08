# 实战项目编写规范（Project authoring contract）

每个项目都通过 4 到 8 个渐进阶段传授一个可复用的实用工具。每个阶段引入一项新特性，详细解析一个具体案例，并对学习者的实现代码进行严格测试。参考实现与演示流程完全使用标准库离线运行。策略模拟器必须明确标识自身为模拟器，绝不能声称具备操作系统级的安全隔离。

## 规划中的项目（Planned projects）

未实现的想法保存在 `projects/roadmap.json` 的 `planned` 数组中。每个条目必须具备唯一的 `id`、`title`、`level`、`languages`、`source`、`tagline`、`summary`、具体的 `output`、四个规划的 `milestones` 以及 `prerequisiteProjects` 依赖 ID。添加 `distinctFrom` 和 `firstDemo` 说明其独立的教学重点。起始阶段项目可以没有先修项目。依赖链接必须可解析且不能形成循环依赖。

[ROADMAP.md](ROADMAP.md) 中的文档描述须与上述元数据保持严格同步。使用 `status: "planned"`；不要编写空的参考实现或捏造完成证明。当某个真实项目满足就绪契约时，其就绪清单会自动替换构建目录中的规划卡片。

## 文件与元数据结构

`projects/<id>/project.json` 管理项目的目录元数据。`id` 须与目录名严格匹配，采用小写字母连字符命名。必填字段包括 `title`、`tagline`、`summary`、`level`（1 到 5）、`hours`、`languages`、`status`（`draft` 或 `ready`）、`source`（`core` 或 `community`）以及非空的 `stages` 数组。阶段 ID 须全局唯一。在项目被标记为 `ready` 之前，README、参考答案（solution）、各阶段的教学文档、测试用例和初始代码必须全部齐备。Draft 草稿项目不会出现在就绪列表中。

```json
{
  "id": "example-project",
  "title": "示例项目",
  "tagline": "一个具体且实用的工具。",
  "summary": "你将构建什么以及如何验证它。",
  "level": 2,
  "hours": 8,
  "languages": ["Python", "TypeScript"],
  "status": "draft",
  "source": "community",
  "author": {"name": "Your Name", "github": "your-handle"},
  "demo": {"command": ["python3", "demo.py"], "cwd": "solution"},
  "stages": [
    {
      "id": "01-first-stage",
      "title": "第一阶段",
      "summary": "一项具体的新能力。",
      "hours": 2,
      "difficulty": "starter",
      "concepts": ["input validation"],
      "language": "python",
      "timeout": 60
    }
  ]
}
```

每个阶段位于 `stages/<stage-id>/`，包含 `docs/en.md`、`starter/` 和 `tests/`。完整的累积参考实现保存在 `solution/` 中。Starter 路径相对于学习者的工作区。初始化会复制所有常规文件，包括 `.rs`、`.ts`、`.go`、测试夹具（fixtures）及模块文件。除非显式指定 `--force`，否则它会保护已存在的文件。避免在后续阶段的 starter 中重复提供前序阶段的代码：脚手架应累积添加，而非覆盖学习者的劳动成果。

## 评测执行器（Grader runners）

每个阶段声明 `language`：`python`、`typescript`、`rust` 或 `go`。多语言混合阶段使用 `language: "rust+python"` 并配合 `runners: [{"language":"rust"},{"language":"python"}]`。评测器会为每个 runner 将 `PROJECT_WORKSPACE`、`PROJECT_ROOT` 和 `PROJECT_STAGE` 设置为绝对路径，并将工作区路径前置到 `PYTHONPATH` 中。

- Python 通过 `unittest` 自动发现 `tests/test_*.py`。正常导入学习者的模块即可。
- TypeScript 使用 Node 22.18+、`--experimental-strip-types` 以及带有 `tests/*.test.ts` 或 `tests/*.test.mjs` 的 `node --test`。使用 `pathToFileURL(path.join(process.env.PROJECT_WORKSPACE, 'main.ts'))` 导入学习者文件。使用可擦除（erasable）的 TypeScript 语法。
- Rust 使用 `rustc --edition 2021 --test` 单独编译每个 `tests/*.rs`，随后执行测试二进制。通过 `include!(concat!(env!("PROJECT_WORKSPACE"), "/main.rs"));` 导入学习者代码（通常置于 module 内部）。无需 Cargo 依赖。
- Go 将工作区和当前阶段的 `tests/*.go` 复制到临时目录并运行 `go test -json ./...`。模块化工作区需包含 `go.mod`；缺失时执行器使用 `GO111MODULE=off`。相对于 `tests/` 的阶段测试路径在临时工作区中保持不变。

显式的单 runner 可以是 argv 数组：`"runner": ["node", "--experimental-strip-types", "--test", "{tests}/stage.test.ts"]`。多 runner 使用 `"runners": [{"language":"python","argv":["python3","-m","unittest","discover","-s","{tests}"]}]`。支持的宏替换为 `{workspace}`、`{project}`、`{stage}` 和 `{tests}`。命令在无 shell 环境下直接执行。自定义 runner 必须输出所选语言的标准测试摘要；0 退出码但测试用例数为 0 将被判定为失败。

可选的 `requires: ["rustc"]` 列出可执行程序前置依赖。Runner 继承阶段的 `requires` 和 `timeout`（以秒为单位的正整数，上限 600 秒）。缺少依赖工具会产生 `skip`；常规评测可以以退出码 0 继续，但 `--strict` 会将任何 skip 判定为失败。测试级别的 skip 永远无法获得完成证明。超时与断言失败均判定为命令执行失败。工具检测结果、测试计数、跳过用例及各 runner 状态均完整记录在评测报告中。

## 运行命令与完成证明

```bash
python3 scripts/project_test.py example-project --init /tmp/example-work
python3 scripts/project_test.py example-project --stage 2 --path /tmp/example-work
python3 scripts/project_test.py example-project --all --solution --strict
python3 scripts/project_test.py --all --solution --strict
python3 scripts/project_test.py example-project --all --path /tmp/example-work --strict --report /tmp/example-result.json
```

`--stage N` 校验阶段 1 到 N；`--only` 仅校验指定阶段。不带项目名的 `--all` 校验所有已发布的就绪项目。JSON 报告包含 `schemaVersion: 1`、`generatedAt`、`projects` 以及汇总的 `certificateEligible`。每个项目包含 `id`、`title`、`mode`、`manifestHash`、`selectedStages`、`stages`、`allStagesPassed` 和 `certificateEligible`。每个阶段包含 `id`、`number`、`language`、`status`（`pass`、`fail` 或 `skip`）、`tests`、`skippedTests`、`durationMs`、`reason` 和 `runners`。

学习者必须完整运行所有声明的阶段，并且每个阶段通过至少一个测试且无任何跳过，方具备证书资格。运行参考答案、缺失运行时、部分运行或存在失败阶段均不可获得证书。这是本地、自主报告的学习凭证，而非密码学认证或防作弊考试系统。

## 文档、交互原理图与演示

每节课的文档均阐明你将构建什么、为什么重要、完整示例、函数签名契约、测试命令、边界失败用例和扩展思考。在 `figure` 代码块中嵌入注册的机制原理图。在 `site/figures/projects/<id>.js` 中编写原创 SVG 渲染器，调用 `window.AIFSProjectFigures.register('pj-<id>-1', {title, steps: [{label, detail}], caption})`。每个图示必须清晰展示该阶段特有的状态机转换与机制流程。为学习者提供可编辑的输入控件与实时计算的中间状态值；仅切换高亮标签的静态方块图是不合格的。

为需要动态计算的机制在注册时提供 `lab` 对象：

```javascript
lab: {
  controls: [
    {key: 'events', label: '已完成事件', type: 'range', value: 3, min: 0, max: 10, step: 1}
  ],
  calculate(values, stepIndex) {
    return {
      summary: values.events + ' 个凭证记录可供检查。',
      metrics: [{label: '凭据数', value: values.events}],
      bars: [{label: '已完成事件', value: values.events, max: 10}]
    };
  }
}
```

输入控件支持 `range`、`number`、`text`、`select` 和 `checkbox`。下拉选择（select）选项包含 `value` 和 `label`。计算函数还可以为数据证据表返回 `columns` 和 `rows`。共享运行时会自动校验有界数值、转义显示文本、保持键盘焦点并支持重置。计算逻辑须严格符合教学契约。现有的自定义 SVG 提供器可以调用 `window.AIFSProjectFigures.mountLab(host, lab)` 而无需替换原本的动画。

阶段可选的 `figure` 属性指向注册的机制 ID。构建器还会从文档中提取 figure 标记并生成 `figures` 与 `figureScripts`。未知的 figure ID 会导致构建报错。Demo 元数据包含 argv 数组 `command` 以及相对于项目根目录的 `cwd`（通常为 `solution`）。可选的 `path`、`poster` 或 `video` 字段指向项目内的媒体文件。Demo 必须能够正常退出并展示真实输出。路径遍历与符号链接逃逸将被安全机制拦截。

## 发布验收核验清单

每个阶段须编写至少 5 个高质量的单元测试：常规输入、边界条件、畸形/非法输入以及防御性攻击失败用例。保留测试集须与演示用的 fixture 隔离。测试应针对可观察的外部契约，而非机械复制参考实现。所有声明支持的语言必须真正执行实现代码。协议引用最新的官方 RFC 和规范文档，保持原创的讲解文本和原创的代码实现。

必须提供一个完整的端到端命令，接收学习者自己的输入并串联教学中的各项能力。单纯硬编码的 demo 不能构成可复用工具。必须清晰指明输出 Schema、集成命令以及真实适配器的适用范围。确认导出的交付成果能够被下游步骤直接消费。

阶段测试只能依赖已经讲授的知识或明确提供的脚手架。初始模板中的函数签名必须精准无误，详尽解释每一个隐含前置条件，并提供一个带有中间过程的完整示例。初学者无需猜测返回值类型即可轻松定位错误。

在本地使用 `--all --solution --strict` 验证参考答案，初始化全新工作区并确认第一阶段能明确暴露出未实现的测试报错。在审查前运行 `node --test site/test_projects_data.js site/test_project_certificates.js` 以及 `node site/build-projects.js --strict`。在桌面端与移动端屏幕、明亮与暗色主题下全面检查网页渲染。检查控件是否能正确触发计算输出更新，录屏与最新命令是否一致。生成的 `site/projects-data.js` 不要 commit 到 git。社区贡献保留原作者署名，并通过 PR 进行合并。

## 可选框架对比

各阶段可以添加可选的第三方 SDK 比较，而无需让核心离线实现产生框架依赖：

```json
{
  "runners": [
    {"language": "python"},
    {
      "language": "python",
      "optional": true,
      "requires": ["python:google.adk"],
      "argv": ["{python}", "-m", "unittest", "discover", "-s", "{stage}/tests-framework", "-p", "test_framework.py"]
    }
  ]
}
```

`{python}` 自动指向当前评测器运行的 Python 解释器。依赖声明支持可执行文件名、`python:module.name` 和 `node:package-name`。Python 和 Node 探测机制只在不导入模块的前提下探测路径。缺少依赖包会输出 `skip` 及安装指引；作者须单独记录固定、兼容的依赖版本，因为包名与导入名可能不同。

运行 `--optional` 可执行这些 runner。`--optional --strict` 在缺少依赖时判定失败。默认的完成凭证仅覆盖必需的离线核心实现，不代表框架熟练度。如果勾选了可选 runner，其失败或跳过也会导致无法获得证书。将可选框架测试放置在当前阶段的 `tests-framework/` 下，与核心 `tests/` 隔离，并从 `PROJECT_WORKSPACE` 导入学习者的实现代码。
