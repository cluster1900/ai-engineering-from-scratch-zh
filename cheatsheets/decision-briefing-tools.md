---
id: decision-briefing-tools
title: Decision, Change and Tutorial Tools
code: DT
subtitle: 四个证据工具：为选项打分、简报页面变化、检查 API 教程、对比本地模型运行。
hue: 205
sources: projects/decision-tradeoff-explorer, projects/web-change-brief, projects/api-tutorial-runner, projects/local-model-eval-harness
source_hash: 966cc7216fdac29d
---

## 四个项目并列对比
type: comparison
span: 3
from: projects/decision-tradeoff-explorer/README.md, projects/decision-tradeoff-explorer/solution/cli.ts, projects/web-change-brief/README.md, projects/web-change-brief/solution/main.go, projects/api-tutorial-runner/README.md, projects/api-tutorial-runner/solution/cli.ts, projects/local-model-eval-harness/README.md, projects/local-model-eval-harness/solution/cli.py

| 维度 | Decision Tradeoff Explorer | Web Change Brief | API Tutorial Runner | Local Model Eval Harness |
|---|---|---|---|---|
| 语言 | Node 22.18+ | Go 1.22 或更新 | Node 22.18 或更新 | Python 3.10+ |
| 输入 | `criteria`、`options` | 两份 HTML 快照，或基线加 URL | `tutorial`、`fixture` 或 `endpoint` | `manifest`、`source`、`labels`、`records` |
| 输出 | `criteria.csv`、`decision-record.json`、`index.html` | `index.html`、`changes.json`、`baseline.json` | `requests.json`、`results.json`、`junit.xml`、`report.html` | `scorecard.json`、`reliability.html` |
| 关卡 | 所选选项必须合格 | `--accept` 替换基线 | 真实端点需 `--allow-network` | `--min-accuracy` 以 2 退出 |
| 从不做 | 替用户做决定 | 执行 JavaScript 或抓取链接资源 | 压力测试 | 下载或启动模型 |

## 运行参考实现
type: command-table
span: 2
from: projects/decision-tradeoff-explorer/README.md, projects/web-change-brief/README.md, projects/api-tutorial-runner/README.md, projects/local-model-eval-harness/README.md

| 命令 | 作用 |
|---|---|
| `node --experimental-strip-types cli.ts fixtures/exhibition.json /tmp/decision-board` | 写出决策看板 |
| `python3 -m http.server 8123 --directory /tmp/decision-board` | 在 localhost:8123 上提供服务，用完即停 |
| `go run . --before fixtures/before.html --after fixtures/after.html --url <url> --out ./web-change-output` | 比较两份已保存的快照 |
| `go run . --fetch <url> --baseline ./web-change-output/baseline.json --out ./next-report` | 抓取一个在线页面与基线比较 |
| `node cli.ts sample.json output` | 在回环 fixture 上运行教程 |
| `python3 cli.py samples/input.json --output scorecard.json --html reliability.html` | 为示例录制打分 |
| `python3 scripts/project_test.py <project> --all --solution --strict` | 为参考实现评分 |

## 决策打分规则
type: concepts
from: projects/decision-tradeoff-explorer/solution/main.ts, projects/decision-tradeoff-explorer/README.md

- **收益型**：`(v - c.min) / (c.max - c.min)`。
- **成本型**：`(c.max - v) / (c.max - c.min)`。
- **得分**：归一化值乘权重之和，再除以总权重。
- **缺失值**：该选项不合格，即使该项权重为 0。
- **限值**：硬性限制。成本高于它或收益低于它即失败。
- **并列**：按选项 id 排序。
- **被支配**：另一选项在所有标准上都不差且至少一项更好。
- **敏感性**：在 `steps` 中把某一权重从 0 扫到 1。

## 网页变化简报
type: architecture
from: projects/web-change-brief/solution/main.go, projects/web-change-brief/README.md

```arch
node | in | 1,1 | before.html, after.html | or --fetch one URL | client
node | ex | 2,1 | ExtractBlocks() | readable text blocks | process
node | snap | 3,1 | NewSnapshot() | canonical URL, hash | process
node | cmp | 3,2 | Compare() | added, removed, unchanged | process
node | exp | 2,2 | ExportBrief() | index.html, changes.json | store
node | base | 1,2 | SaveSnapshot() | baseline.json | store
edge | in | ex | HTML
edge | ex | snap | blocks
edge | snap | cmp | two snapshots
edge | cmp | exp | brief
edge | exp | base | after
```

## 一个教程请求块
type: annotated-code
lang: text
from: projects/api-tutorial-runner/solution/sample.json, projects/api-tutorial-runner/solution/main.ts

```text
# The tutorial holds JSON inside a request fence
{"id": "create-loan", "method": "POST", "path": "/loans",
 "status": 201,  # expected status, 100..599
 "capture": {"loanId": {"path": "id", "type": "number"}}}  # typed capture
{"id": "read-loan", "method": "GET",
 "path": "/loans/{{loanId}}",  # only declared variables
 "status": 200,
 "assert": {"bookName": "Neighborhood Trees"}}  # stale field, fails
```

## API 教程运行器步骤
type: flow
from: projects/api-tutorial-runner/solution/main.ts, projects/api-tutorial-runner/solution/cli.ts

1. **extractRequests**：读取每个 request 围栏块，最多允许 20 步。
2. **CLI**：没有 `endpoint` 时，从 `fixture` 启动回环服务器。
3. **runTutorial**：用先前的捕获填充 `{{name}}`。未声明的名字会失败。
4. **runTutorial**：发送请求，不跟随重定向，带超时与字节上限。
5. **runTutorial**：检查状态码与每个 `assert` 路径，然后保存捕获。
6. **runTutorial**：一步失败后，跳过后续步骤，不再发送任何请求。
7. **exportResults**：写出 JUnit、HTML，并为每个失败写 `corrections.json`。

## 录制并比较本地模型
type: annotated-code
lang: bash
from: projects/local-model-eval-harness/README.md, projects/local-model-eval-harness/solution/record.py, projects/local-model-eval-harness/solution/cli.py

```bash
python3 record.py samples/cases.json \  # loopback HTTP endpoint only
  --endpoint http://127.0.0.1:11434/v1/chat/completions \
  --model <model> --revision <rev> --hardware <hw> \
  --output measured.json  # manifest, source, labels, records
python3 cli.py measured.json --baseline samples/input.json \
  --output compared.json  # rejects different dataset labels
python3 cli.py <recording> --min-accuracy <n>  # exit 2 below the gate
```

## 评分卡字段
type: concepts
from: projects/local-model-eval-harness/solution/main.py, projects/local-model-eval-harness/solution/cli.py, projects/local-model-eval-harness/README.md

- **accuracy**：大小写折叠并清理空白后的精确匹配，按全部标签计算。
- **coverage**：预测数除以标签数。
- **ece**：每个分箱的置信度差，按分箱样本数加权。
- **p50_ms, p95_ms**：最近秩法计算的延迟百分位。
- **dataset_sha256**：标签的哈希。基线必须与之一致。
- **manifest**：需要 `model`、`model_revision`、`prompt_revision`、`hardware` 和 `confidence_method`。

## 默认值与上限
type: defaults
from: projects/web-change-brief/solution/main.go, projects/api-tutorial-runner/solution/main.ts, projects/local-model-eval-harness/solution/main.py, projects/local-model-eval-harness/solution/cli.py, projects/decision-tradeoff-explorer/solution/main.ts

| 设置 | 默认值 | 说明 |
|---|---|---|
| `--out` | `web-change-output` | 网页简报报告目录 |
| `MaxHTMLBytes` | `2_000_000` | 每页 2 MB |
| `timeoutMs` | 1500 | 每个请求，1 到 30000 |
| `maxBytes` | 65536 | 响应字节上限 |
| 请求步数 | 20 | 每个教程最多 |
| `bins` | 5 | 校准分箱数 |
| `--min-accuracy` | 0 | 低于它以 2 退出 |
| 敏感性 `steps` | 10 | 1 到 100 |

## 错误信息与修复
type: troubleshooting
from: projects/decision-tradeoff-explorer/solution/main.ts, projects/web-change-brief/solution/main.go, projects/web-change-brief/README.md, projects/api-tutorial-runner/solution/main.ts, projects/api-tutorial-runner/README.md, projects/local-model-eval-harness/solution/cli.py

| 症状 | 原因 | 修复 |
|---|---|---|
| `chosen option must be eligible` | 选项有缺失值或违反限值 | 选择一个有得分的选项 |
| `value outside declared range` | 值不在 `min` 与 `max` 之间 | 修正值或范围 |
| `Snapshots must refer to the same canonical URL` | 两个不同的 URL | 比较同一页面的快照 |
| `Live fetch requires --baseline JSON` | 有 `--fetch` 但没有基线 | 先运行已保存文件模式 |
| `Baseline checksum mismatch` | 基线文件被编辑过 | 重新生成基线 |
| `Network endpoint requires explicit allowNetwork` | 端点不是回环地址 | 加上 `--allow-network` |
| `Earlier step failed; no request sent` | 前一步失败 | 修复第一个失败的步骤 |
| `cannot compare different datasets` | 标签与基线不同 | 重新录制相同的用例 |

## 示例
type: qa
from: projects/decision-tradeoff-explorer/solution/fixtures/exhibition.json, projects/decision-tradeoff-explorer/solution/main.ts, projects/api-tutorial-runner/README.md, projects/api-tutorial-runner/solution/sample.json, projects/local-model-eval-harness/README.md

- **展览示例中哪个选项胜出？** `pods`，得分 0.68。`open` 为 0.67。
- **为什么 `archive` 没有排名？** 它的 `flow` 值为 null，因此不合格。
- **`open` 何时胜出？** 在 `access` 扫描中，权重为 0.6 或更高时。
- **`read-loan` 为什么失败？** 它断言了过时字段 `bookName`。
- **评测示例得分多少？** accuracy 2/3，coverage 完整，p95 为 200 ms。

## 提示
type: tips
from: projects/web-change-brief/README.md, projects/decision-tradeoff-explorer/README.md, projects/local-model-eval-harness/README.md, projects/api-tutorial-runner/README.md

- 两份快照使用同一过滤策略。过滤短语可能掩盖变化。
- 除非传入 `--accept`，基线保持不变。
- 权重是偏好，不是概率。
- 报告的置信度是模型自报。ECE 会随分箱数和样本数变化。
- 教程命令写出证据后即算成功。请阅读回执。
