---
id: visual-explainers
title: Diagram, Chart and Infrastructure Explainers
code: DE
subtitle: 四个本地讲解项目。运行、喂入数据、阅读输出并修复错误。
hue: 262
sources: projects/chart-storyboard-builder, projects/diagram-reading-companion, projects/infrastructure-plan-explainer, projects/service-ownership-navigator
source_hash: 6fb01345df287c0d
---

## 四个项目并列对比
type: comparison
span: 3
from: projects/chart-storyboard-builder/README.md, projects/chart-storyboard-builder/solution/cli.py, projects/diagram-reading-companion/README.md, projects/diagram-reading-companion/solution/cli.ts, projects/infrastructure-plan-explainer/README.md, projects/infrastructure-plan-explainer/solution/cli.py, projects/service-ownership-navigator/README.md, projects/service-ownership-navigator/solution/cli.ts

| 因素 | Chart Storyboard Builder | Diagram Reading Companion | Infrastructure Plan Explainer | Service Ownership Navigator |
|---|---|---|---|---|
| 语言 | Python 3.10+ | Node 22.18 或更新 | Python 3.10+ | Node 22.18 或更新 |
| 输入 | `csv`、`roles`、`periods`、`charts` | `svg`、`graph` | Terraform plan 的 JSON | `catalog`、`path` |
| 输出 | `chart-N.svg`、`chart-specs.json`、`storyboard.html` | `graph.json`、`analysis.json`、`report.html` | `change-brief.md`、`resource-impact.json`、`review.html` | `handoff.json`、`catalog.json`、`report.html` |
| 审阅文件 | 无 | 第三个参数，已审阅的顺序 | 无 | 无 |
| 从不做 | 推断日期或因果关系 | 从 SVG 的几何读出含义 | 应用 plan | 发送通知 |

## 运行参考实现
type: command-table
from: projects/chart-storyboard-builder/README.md, projects/infrastructure-plan-explainer/README.md, projects/diagram-reading-companion/README.md, projects/service-ownership-navigator/README.md, projects/diagram-reading-companion/solution/cli.ts

| 命令 | 作用 |
|---|---|
| `python3 cli.py samples/input.json --output demo-output` | 图表或基础设施的示例 |
| `node cli.ts sample.json output` | 示意图或所有权的示例 |
| `node cli.ts <input.json> <dir> <review.json>` | 带上你审阅过的顺序，跑示意图 |
| `node cli.ts --help` | 打印参数行 |
| `python3 scripts/project_test.py <project> --all --solution --strict` | 给参考实现评分 |
| `python3 scripts/project_test.py <project> --init <dir>` | 生成 starter |

## 讲解一份真实的 Terraform plan
type: annotated-code
lang: bash
from: projects/infrastructure-plan-explainer/README.md, projects/infrastructure-plan-explainer/solution/cli.py

```bash
terraform show -json saved.plan > input.json  # saved plan as JSON
python3 cli.py input.json --output review  # never applies the plan
# review/change-brief.md        addresses with local anchors
# review/resource-impact.json   graph.edges and resources
# review/review.html            changes, edges, unresolved
```

## plan 讲解器流水线
type: flow
from: projects/infrastructure-plan-explainer/API.md, projects/infrastructure-plan-explainer/solution/main.py

1. **load_plan**：只接受 format 的主版本 1。它保留动作，以及打过掩码的 `before` 和 `after`。
2. **load_plan**：敏感值显示成 `[sensitive]`，计算出来的值显示成 `[unknown]`。
3. **classify**：把每一种精确的动作序列映射成一个动作名。
4. **impact_graph**：按最长的地址前缀，把引用和 `depends_on` 连起来。
5. **impact_graph**：跳过 `var`、`local`、`path`、`count`、`each`、`terraform` 和 `self`。
6. **explain**：写出 Markdown，每个地址一个锚点，并写上声明的依赖。

## 动作序列
type: command-table
from: projects/infrastructure-plan-explainer/solution/main.py, projects/infrastructure-plan-explainer/API.md

| 命令 | 作用 |
|---|---|
| `["create"]` | create |
| `["update"]` | update，原地 |
| `["delete", "create"]` | replace |
| `["create", "delete"]` | replace |
| `["delete"]` | delete |
| `["read"]`、`["no-op"]`、`["forget"]` | read、no-op、forget |
| 其他任何列表 | `unsupported action sequence` |

## 示意图伴侣
type: architecture
from: projects/diagram-reading-companion/solution/main.ts, projects/diagram-reading-companion/solution/cli.ts

```arch
node | in | 1,1 | sample.json | svg, graph | client
node | load | 2,1 | loadDiagram() | node ids must be SVG ids | process
node | an | 3,1 | analyzeGraph() | order, branches, cycles | process
node | rev | 3,2 | reviewGraph() | order, reviewed | process
node | graph | 2,2 | graph.json | reviewed manifest | store
node | html | 1,2 | report.html | keyboard walkthrough | store
edge | in | load | svg, graph
edge | load | an | graph
edge | an | rev | order
edge | rev | graph | save
edge | graph | html | render
```

## 图表规则
type: concepts
from: projects/chart-storyboard-builder/API.md, projects/chart-storyboard-builder/solution/main.py, projects/chart-storyboard-builder/README.md

- **roles**：`group`、`value` 和 `unit` 用来给 CSV 的列命名，并给出一个显示单位。
- **归约**：`sum`、`mean` 和 `count`。count 统计非空值，单位是 `records`。
- **语法**：类别用 `bar`，有序的时段用 `line`。
- **空着的值**：它是缺失，不是零。折线在那里断开。
- **periods**：用来规定顺序。没有出现的时段画成 null。
- **坐标轴**：始终把零包含在内。
- **标注**：需要一个已经画出来的点。文本里带上精确的数值和单位。

## 所有权规则
type: concepts
from: projects/service-ownership-navigator/solution/main.ts, projects/service-ownership-navigator/README.md

- **最后一条匹配的获胜**：最后一条匹配上的规则决定有效的所有者。
- **锚定**：以 `/` 开头，或者中间含有 `/` 的模式，从根开始匹配。
- **通配符**：`*` 停在一个路径段里，`**/` 可以跨文件夹，`?` 是一个字符。
- **目录**：结尾的 `/` 匹配这个文件夹，以及它下面的全部内容。
- **服务**：包含这条路径的、最长的那个服务 `root`。
- **所有者**：只能是 `@user` 或 `@org/team` 这样的名字。
- **Runbook 链接**：本地链接必须指向一份已经提供的 runbook 文件。

## 默认值与限制
type: defaults
from: projects/chart-storyboard-builder/solution/main.py, projects/chart-storyboard-builder/solution/cli.py, projects/diagram-reading-companion/solution/main.ts, projects/service-ownership-navigator/solution/main.ts, projects/diagram-reading-companion/solution/cli.ts, projects/infrastructure-plan-explainer/solution/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `reducer` | `sum` | `charts` 里的每一张图 |
| `grammar` | `bar` | 或者 `line` |
| `schema_version` | 1 | 图表规格和 plan 简报 |
| SVG 大小 | 500000 | 最多这么多个字符 |
| 规则来源 | `CODEOWNERS` | 出现在证据行里的名字 |
| 输出文件夹 | `output` | Node CLI 的第二个参数 |
| 图表宽度 | 640 | SVG 的最小宽度，单位是像素 |

## 报错与修复
type: troubleshooting
from: projects/infrastructure-plan-explainer/solution/main.py, projects/chart-storyboard-builder/solution/main.py, projects/diagram-reading-companion/solution/main.ts, projects/service-ownership-navigator/solution/main.ts

| 症状 | 原因 | 修复 |
|---|---|---|
| `unsupported Terraform JSON format major` | 不是一份 `terraform show -json` 文件 | 把保存下来的 plan 导出成 JSON |
| `periods omit data or duplicate a group` | 某个数据分组不在 `periods` 里 | 每个分组只列一次 |
| `annotation needs a unique plotted point` | 标注打在空白或未知的分组上 | 标注一个有数值的点 |
| `Node missing from SVG or duplicated` | 清单里的 id 没有对应的 SVG `id` | 把这个 `id` 加到 SVG 元素上 |
| `Unsupported SVG element` | 标签不在安全子集里 | 改用形状、文本、`g`、`title`、`desc` |
| `Review order must contain every node exactly once` | 顺序是旧的，或者不完整 | 每个节点 id 只列一次 |
| `Earlier matching rules name different owners; last matching rule wins` | 规则相互重叠 | 检查最后一条规则是不是对的 |
| `Missing local runbook link` | runbook 链接了一个没有提供的文件 | 把这个文件加进 `runbooks` |

## 算例
type: qa
from: projects/chart-storyboard-builder/solution/samples/input.json, projects/chart-storyboard-builder/README.md, projects/infrastructure-plan-explainer/solution/samples/input.json, projects/infrastructure-plan-explainer/README.md, projects/service-ownership-navigator/solution/sample.json, projects/diagram-reading-companion/solution/sample.json

- **W1 用 sum 画出的是什么？** 18。它的行里是 8 和 10。
- **W2 和 W3 会怎样？** W2 是空的，W3 不存在。两者都画成缺失。
- **为什么数据库是一次 replace？** 它的动作是先 `delete`，再 `create`。
- **简报里密码显示成什么？** `[sensitive]`，数组里面也是这样。
- **谁拥有 `services/images/cache/store.ts`？** `@fictional/cache`，来自最后一条规则。
- **示意图在哪里分叉？** 在 `check`，分别通向 `share` 和 `clarify`。

## 提示
type: tips
from: projects/infrastructure-plan-explainer/README.md, projects/infrastructure-plan-explainer/API.md, projects/diagram-reading-companion/README.md, projects/chart-storyboard-builder/API.md, projects/service-ownership-navigator/README.md

- 图上的边是声明出来的依赖，不是 provider 的执行顺序。
- 这个 plan 工具不预测停机时间、成本，也不预测完整的执行顺序。
- 阅读顺序是一份待审的候选，不是教学效果的证明。
- 图表 SVG 带有 `title` 和 `desc`，而且没有 JavaScript。
- 这份所有权格式是一个本地子集，不是完整的 CODEOWNERS 格式。
