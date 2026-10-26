# 编写速查表

> **本中文仓库的说明。** 本文译自上游 rohitg00/ai-engineering-from-scratch 的 `cheatsheets/AUTHORING.md`（3f9715c6 中的版本，最后一次修改是 19441d68）。中文仓库没有移植上游的 `site/build-cheatsheets.js`、`cheatsheets/topics.yaml`、`scripts/cheatsheets/generate.js` 和 `.github/workflows/cheatsheets-generate.yml`。下文提到它们的地方只描述上游的做法。在本仓库中，用 `node scripts/audit_cheatsheets.js` 检查结构、事实和证据，用 `node scripts/verify_evidence_lines.js <id>` 抽查证据行号。翻译时，速查表的副标题、块标题和正文译成中文。front matter 的键、id、块的元数据行、代码和架构节点保持英文。证据文件的条目保持英文，但每个 `##` 标题必须包含对应块的中文标题。

速查表是工作时随手查阅的参考资料，不是课程摘要。一个文件只讲一个主题。构建脚本把文件做成一张海报：一页横向页面，最多两页。

每个主题是一个文件，`cheatsheets/<id>.md`。id 使用小写字母和连字符。

## 文件结构

```text
---
id: sglang-serving
title: LLM Serving with SGLang
subtitle: Start, size, measure and fix an SGLang server. SGLang 0.5.22.
hue: 200
sources: manuals/sglang-101, phases/17-infrastructure-and-production/03-vllm-serving
---

## Start a server
type: annotated-code
lang: bash
from: manuals/sglang-101/sections/2-1-sglang-serve-and-the-three-processes.md

    ```bash
    sglang serve --model-path <model> --port 30000   # start the HTTP server
    ```
```

front matter 有五个必填键。`id`、`title` 和 `subtitle` 是文本。副标题最多 120 个字符，这样能放在一行内。`hue` 是 0 到 359 之间的数字，决定海报的颜色。`sources` 列出该主题覆盖的课程、手册和项目。课程页面根据这些路径链接到速查表。可选键 `code` 设置磁贴上的两个字母，默认取标题的首字母。每个主题的 code 必须不同。键 `source_hash` 记录写作速查表时依据的源文件。`code` 和 `source_hash` 由脚本自动设置。

每个块以一个 `## ` 标题开始。标题就是彩色标题栏上的文字。标题之后是若干 `key: value` 行，遇到空行结束。空行之后是正文。

| 键 | 必填 | 含义 |
|---|---|---|
| `type` | 是 | 下列块类型之一 |
| `from` | 是 | 以逗号分隔的仓库路径，这些文件包含本块的事实 |
| `lang` | 代码块必填 | `annotated-code` 块的语言 |
| `col` | 否 | 海报上的列，1 到 4。不设置时，构建脚本按顺序放置各块并平衡各列 |
| `span` | 否 | 块占用的列数，1 到 4。annotated code、architecture、defaults 和 troubleshooting 默认占 2 列，其余默认占 1 列 |

## 块类型

| 类型 | 颜色 | 正文 |
|---|---|---|
| `concepts` | 紫色 | 列表：`- **Name**: one line` |
| `glossary` | 紫色 | 列表：`- **ABBR**: what it stands for and one line` |
| `task-table` | 蓝色 | 表格：`\| Task \| Code \|`。代码单元格放在反引号中 |
| `command-table` | 蓝色 | 表格：`\| Command \| What it does \|` |
| `annotated-code` | 墨色 | 一个围栏代码块。注释放在两个或更多空格之后。构建脚本会把注释对齐成一列 |
| `flow` | 青色 | 编号列表：`1. **Actor**: what happens`。构建脚本会画出带编号的步骤 |
| `architecture` | 青色 | 一个围栏 `arch` 块，包含 `node` 和 `edge` 行，见下文 |
| `defaults` | 琥珀色 | 表格：`\| Setting \| Default \| Note \|` |
| `comparison` | 石板灰 | 3 到 5 列的表格：`\| Factor \| Option A \| Option B \|`。第一列写比较的维度，其余每列是一个选项 |
| `troubleshooting` | 红色 | 表格：`\| Symptom \| Cause \| Fix \|` |
| `qa` | 绿色 | 列表：`- **Question?** Answer.` |
| `tips` | 绿色 | 列表 |

读者需要替换的值用尖括号标出：`<model>`、`<port>`。构建脚本会给它们着色。

### 架构块

```text
node | api | 1,1 | HTTP server | tokenizer manager
node | sched | 2,1 | Scheduler | batches and KV pool
edge | api | sched | ZMQ
```

节点行的格式是 `node | <id> | <column>,<row> | <label> | <second line> | <kind>`。列和行从 1 开始。第二行可以为空。kind 可选，它会在方框角上画一个小标记：`client`、`process`、`store`、`queue`、`gpu` 或 `model`。边行的格式是 `edge | <from id> | <to id> | <label>`。label 可以为空。

## 事实

每个事实都必须来自所在块 `from` 列表中的某个文件：课程、课程代码、手册章节或手册截取内容。不要写这些文件中没有的命令、参数、API 名称、默认值或数字。`node site/build-cheatsheets.js --check` 会强制执行这条规则的一部分：每个参数（`--name`），每个带下划线、点号或调用的名称，以及每个默认值，都必须出现在所在块的至少一个 `from` 文件中。

## 证据文件

每个速查表都有一个证据文件，`cheatsheets/evidence/<id>.md`。它以 `# Evidence: cheatsheets/<id>.md` 开头，每个块对应一个 `##` 小节。每个条目写出一个事实，以及包含它的 `path:line` 或 `path:line-line`，例如 `phases/01-x/01-y/docs/en.md:12, 40-42`。为了缩短路径，可以在顶部写一行，例如 `Abbreviations: L01 = phases/01-x/01-y, d = docs/en.md.`，然后写成 `L01/d:12`。每个键用一个 `KEY = path` 对，不要写成键的列表或范围。`node site/build-cheatsheets.js --check` 会解析每一条引用。以下情况会失败：路径不存在，路径不属于该主题的来源，引用的行不在文件中，某个块没有对应小节，或者某个小节中带有效引用的条目少于该块的行、步骤、节点或条目数。每个事实写一个条目。

## 行文

使用简化技术英语（Simplified Technical English）写短句。每行或每个条目只占一行。不要使用破折号、分号或比喻性的词语。速查表告诉读者该输入什么、会看到什么，不讲故事。

## 覆盖图

`cheatsheets/topics.yaml` 列出每个主题的 `id`、`title`、`kind` 和 `sources`。kind 是 `concept`、`commands`、`comparison`、`debugging`、`manual` 或 `project` 之一。`phases/` 中的每节课、每本手册和每个项目都必须至少是一个主题的来源，否则 `node site/build-cheatsheets.js --check` 会失败。速查表的 `title` 和 `sources` 必须与覆盖图中的条目一致。

添加课程时，把它加到覆盖图的某个主题中。修改主题的来源后，运行 `node scripts/cheatsheets/generate.js --stamp <id>`，把新的列表和哈希写入速查表。

## 过期与缺失的速查表

`node site/build-cheatsheets.js --status` 列出还没有速查表的主题，以及写作之后源文件发生变化的速查表。工作流 `.github/workflows/cheatsheets-generate.yml` 用 `scripts/cheatsheets/generate.js` 编写这些速查表，并开一个 pull request 供审阅。要在本机编写单个速查表，设置 `ANTHROPIC_API_KEY`，安装 `@anthropic-ai/sdk`，然后运行 `node scripts/cheatsheets/generate.js <id>`。加上 `--model opus` 可以使用更大的模型。脚本会对每次回复运行事实检查。它最多把问题发回模型两次，仍然失败的主题不会写入任何内容。

## 质量评分标准

`node site/build-cheatsheets.js --check-quality` 给每个速查表打分，违反任何一条规则都会失败。规则如下：10 到 14 个块；至少 6 种块类型；一个 flow 或 architecture 图；一个 qa 或 tips 块；按主题的 kind，任务或命令表、故障排查表达到最低行数；`commands` 和 `manual` 主题要有一个 annotated-code 块；`comparison` 主题要有一个对比表；每个 defaults 行都有真实的值；没有内容单薄的块；没有重复的行；打印出来最多 2 页。
