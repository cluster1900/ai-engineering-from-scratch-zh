---
id: data-quality-workbenches
title: Data Quality and Dataset Gates
code: DQ
subtitle: 带种子加载并切分数据、修复 CSV 单元格、按契约拦截行、审计泄漏并预演迁移。
hue: 30
sources: phases/00-setup-and-tooling/09-data-management, projects/csv-repair-workbench, projects/csv-sql-question-workbench, projects/dataset-contract-gate, projects/dataset-split-auditor, projects/database-migration-rehearsal
source_hash: 6c2b1ac3adce3387
---

## 每道关卡产出什么
type: comparison
span: 2
from: projects/csv-repair-workbench/README.md, projects/csv-repair-workbench/API.md, projects/dataset-contract-gate/README.md, projects/dataset-contract-gate/API.md, projects/dataset-split-auditor/README.md, projects/database-migration-rehearsal/README.md, projects/database-migration-rehearsal/API.md

| 维度 | CSV 修复 | 契约关卡 | 切分审计 | 迁移预演 |
|---|---|---|---|---|
| 产出 | 清洗后的表与 recipe | 接受行与隔离行 | 逐条记录的泄漏报告 | 预演回执 |
| 输入 | csv 文本、aliases、date_columns | JSONL 加 contract.json | {train,test} 或 {records} | 数据库、迁移、回滚、不变式 |
| 输出 | cleaned.csv、recipe.json | accepted.jsonl、quarantine.jsonl | split-audit.json | rehearsal.json、schema-diff.json |
| 通过信号 | 没有待定单元格 | `passed` 为 true | `usable` 为 true | `release_ready` 为 true |
| 关卡退出码 | 失败时非零 | 规则失败 exit 1，输入错误 exit 2 | 不可用时 exit 2 | 失败时非零 |
| 局限 | 只支持斜杠与 ISO 日期 | 不判断语义真伪 | 只查完全相同的副本，不查改写 | SQLite 授权策略，而非操作系统隔离 |

## 运行与评分
type: command-table
span: 2
from: projects/csv-repair-workbench/README.md, projects/csv-sql-question-workbench/README.md, projects/dataset-contract-gate/README.md, projects/dataset-split-auditor/README.md, projects/database-migration-rehearsal/README.md, phases/00-setup-and-tooling/09-data-management/docs/en.md

| 命令 | 作用 |
|---|---|
| `python3 scripts/project_test.py <project> --init <workspace>` | 创建工作区。首次运行会失败 |
| `python3 scripts/project_test.py <project> --all --solution --strict` | 检查参考解 |
| `python3 cli.py samples/input.json --output demo-output` | 运行 CSV 修复或迁移预演 |
| `python3 cli.py sample.csv --question "sum units by region" --output output/report.html` | 回答一个 CSV 问题并附回执 |
| `python3 cli.py samples/input.jsonl --contract samples/contract.json --output demo-output` | 把行分为接受与隔离 |
| `python3 cli.py samples/input.json --output split-audit.json --html split-audit.html` | 审计一组 train 与 test 切分 |
| `python3 cli.py --train train.jsonl --test test.jsonl --check --output split-audit.json` | 在 CI 中审计 JSONL 分区 |
| `python code/data_utils.py` | 加载、转换、切分数据集并计算指纹 |

## 只读 CSV 问答
type: architecture
from: projects/csv-sql-question-workbench/solution/main.py, projects/csv-sql-question-workbench/solution/cli.py, projects/csv-sql-question-workbench/README.md

```arch
node | csv | 1,1 | sample.csv | UTF-8, under 2 MB | store
node | load | 2,1 | load_csv | REAL or TEXT per column | process
node | plan | 3,1 | plan_question | small question grammar | process
node | model | 3,2 | --model | proposes SQL from schema | model
node | run | 4,1 | run_query | authorizer, query_only, budget | process
node | out | 4,2 | report.html | plus .json receipt | client
edge | csv | load |
edge | load | plan | question
edge | load | model | schema
edge | plan | run | SQL
edge | model | run | SQL
edge | run | out | sha256 and SQL
```

## 迁移预演
type: flow
from: projects/database-migration-rehearsal/API.md, projects/database-migration-rehearsal/solution/main.py, projects/database-migration-rehearsal/README.md

1. **snapshot**：以只读方式打开源库，并备份到内存。
2. **snapshot**：记录 schema、行数、行内容 SHA-256 与序列。
3. **rehearse**：只在内存副本上应用迁移。
4. **rehearse**：拒绝 ATTACH、DETACH、PRAGMA、虚拟表与文件函数。
5. **test_rollback**：在一份一次性备份上运行迁移与回滚。
6. **reversible**：没有错误，且恢复后的快照与之前相等。
7. **receipt**：逐条检查不变式。`release_ready` 要求全部通过且可回滚。

## 带种子切分
type: annotated-code
lang: python
from: phases/00-setup-and-tooling/09-data-management/docs/en.md

```python
dataset = load_dataset("stanfordnlp/imdb", split="train")
split = dataset.train_test_split(test_size=0.2, seed=42)
train_val = split["train"].train_test_split(test_size=0.125, seed=42)
train_ds = train_val["train"]                # 70 percent of all rows
val_ds = train_val["test"]                   # 10 percent
test_ds = split["test"]                      # 20 percent
dataset.to_parquet("imdb_train.parquet")     # best storage format
load_dataset("wikimedia/wikipedia", "20231101.en", split="train", streaming=True)
```

## 项目函数
type: task-table
from: projects/csv-repair-workbench/API.md, projects/dataset-contract-gate/API.md, projects/dataset-split-auditor/API.md, projects/database-migration-rehearsal/API.md, projects/csv-sql-question-workbench/solution/main.py

| 任务 | 代码 |
|---|---|
| 分析 CSV 各列 | `profile(text)` |
| 预览单元格改动 | `preview(table, recipe)` |
| 应用已审阅的修复 | `repair(table, recipe, decisions=None)` |
| 检查一条记录 | `row_issues(row, contract)` |
| 查找重复组 | `duplicate_rows(rows, contract)` |
| 审计两个分区 | `audit(train, test)` |
| 按组哈希切分 | `split_groups(records, test_fraction=0.2, seed='course')` |
| 执行有界读取 | `run_query(data, sql, max_rows=100, max_steps=100000)` |

## 大文件版本管理
type: command-table
from: phases/00-setup-and-tooling/09-data-management/docs/en.md

| 命令 | 作用 |
|---|---|
| `git lfs track "*.safetensors"` | 把文件存在 git 之外，只留指针 |
| `dvc add data/training_set.parquet` | 生成一个小的 `.dvc` 指针文件 |
| `dvc remote add -d myremote s3://my-bucket/dvc-store` | 设置 DVC 远端 |
| `dvc push` | 把跟踪的数据上传到远端 |
| `snapshot_download("sentence-transformers/all-MiniLM-L6-v2")` | 缓存完整的模型仓库 |

## 默认值与上限
type: defaults
from: projects/csv-sql-question-workbench/solution/main.py, projects/csv-sql-question-workbench/solution/cli.py, projects/dataset-split-auditor/solution/cli.py, projects/dataset-contract-gate/solution/main.py, projects/database-migration-rehearsal/README.md, phases/00-setup-and-tooling/09-data-management/docs/en.md, phases/00-setup-and-tooling/09-data-management/code/data_utils.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `--limit` | 100 | 结果行数，最多 1000 |
| `max_steps` | 100000 | SQLite 指令预算 |
| `load_csv` 行 | 10000 | 小于 2 MB，最多 50 列 |
| `--seed` | course | `--split` 的组哈希种子 |
| 契约行数 | 100000 | API 输入上限 |
| SQL 时限 | two-second | 约束语句，不约束备份 |
| `make_splits` 种子 | 42 | train 0.8，validation 0.1 |
| 本地存储 | 10 GB | 超过则改用云存储 |

## 错误与修复
type: troubleshooting
from: projects/csv-repair-workbench/solution/main.py, projects/csv-sql-question-workbench/solution/main.py, projects/dataset-contract-gate/README.md, projects/dataset-split-auditor/README.md, projects/database-migration-rehearsal/API.md

| 症状 | 原因 | 修复 |
|---|---|---|
| "ragged row" | 某行单元格数量不对 | 修正源数据行 |
| 待定 "ambiguous date" | 两部分都不大于 12 且不相等 | 在 decisions 中给出 ISO 日期 |
| "stale review" | 审阅后表或 recipe 有改动 | 重新审阅新的预览 |
| "Query rejected: " | SQL 越出只读边界 | 对 `data` 只写一条 SELECT |
| "Aggregate column must contain finite numeric values" | 该列是 TEXT | 对 REAL 列做聚合 |
| 契约 `--check` 以 1 退出 | 有行进入隔离 | 阅读 review.html，逐行分别决定 |
| 切分 `usable` 为 false | 内容或组泄漏 | 用 `--split` 按组切分 |
| `release_ready` 为 false | 回滚不精确 | 编写能恢复各行的回滚 SQL |

## 代码中的规则
type: concepts
from: projects/csv-repair-workbench/API.md, projects/dataset-contract-gate/API.md, projects/dataset-split-auditor/solution/main.py, phases/00-setup-and-tooling/09-data-management/docs/en.md

- **Recipe 顺序**：每列先 trim，再 alias，再处理日期。
- **改动**：每处改动注明行、列、改前与改后。
- **不做强制转换**：布尔值 true 在 integer 与 number 字段上判为失败。
- **重复**：每一行冲突行都会报告，包括第一行。
- **关卡**：没有隔离行且没有数据集问题，数据集才通过。
- **指纹**：NFKC、casefold、合并空白，然后 SHA-256。
- **按组切分**：对种子与组计算 SHA-256 再除以 `2**256`，低于比例的划入 test。
- **格式**：存储用 Parquet，内存中用 Arrow，交换用 CSV 与 JSON。

## 问答
type: qa
from: projects/dataset-split-auditor/README.md, projects/database-migration-rehearsal/API.md, projects/dataset-contract-gate/API.md, projects/csv-sql-question-workbench/README.md, phases/00-setup-and-tooling/09-data-management/docs/en.md

- **规范化能发现改写吗？** 不能。它只找规范化后完全相同的副本。
- **预演会改动源数据库吗？** 不会。源库从不以可写方式打开。
- **模型可以随意执行它的 SQL 吗？** 不可以。执行仍受 SQLite 授权控制。
- **能一次性丢弃隔离行吗？** 不能。分区是证据，不是丢弃许可。
- **为什么要设种子？** 相同种子每次产生相同的切分。

## 提示
type: tips
from: projects/csv-repair-workbench/README.md, projects/dataset-contract-gate/API.md, projects/dataset-split-auditor/README.md, phases/00-setup-and-tooling/09-data-management/docs/en.md

- 用 `--recipe recipe.json` 把 recipe 重放到另一张表上。
- 以下游使用者身份用 `csv.DictReader` 读取 cleaned.csv。
- 等关卡命令结束后再加载它的输出。
- 输入与输出放在一起，方便他人复现。
- 用 `.gitignore` 把模型权重留在 git 之外。用 DVC 复现运行。
