---
id: text-workflow-desks
title: Text Workflow Desks
code: TW
subtitle: 分拣邮件、抽取行动项、改写正文、归组反馈并写 changelog。每份输出都等审阅。
hue: 200
sources: projects/inbox-triage-desk, projects/meeting-notes-to-actions, projects/plain-language-rewrite-desk, projects/feedback-theme-board, projects/changelog-writer-from-git
source_hash: 9a0e9b97988adf97
---

## 每张工作台产出什么
type: concepts
from: projects/inbox-triage-desk/README.md, projects/meeting-notes-to-actions/README.md, projects/plain-language-rewrite-desk/README.md, projects/feedback-theme-board/README.md, projects/changelog-writer-from-git/README.md

- **Inbox triage desk**：.eml 文件夹进。index.html、triage.json 和未发送的 .eml 草稿出。
- **Meeting notes to actions**：notes.txt 进。actions.json、actions.html 和 approved.csv 出。
- **Plain language rewrite desk**：散文 JSON 进。已接受的 Markdown 和 revision-decisions.json 出。
- **Feedback theme board**：JSONL 反馈和主题进。证据板和 issue 草稿出。
- **Changelog writer from Git**：一个 Git 范围进。release.md 和一份 release.json 回执出。
- **运行时**：收件箱和会议用 Python 3.10。改写用 Node 22.18。changelog 用 Go 1.22。

## 运行每张工作台
type: command-table
span: 2
from: projects/inbox-triage-desk/README.md, projects/meeting-notes-to-actions/README.md, projects/plain-language-rewrite-desk/README.md, projects/feedback-theme-board/README.md, projects/changelog-writer-from-git/README.md

| 命令 | 作用 |
|---|---|
| `python3 scripts/project_test.py <project> --init <workspace>` | 创建工作区。第一阶段会失败 |
| `python3 scripts/project_test.py <project> --all --solution --strict` | 检查参考解答 |
| `python3 main.py --input ./fixtures --out ./inbox-output` | 构建收件箱审阅工作台 |
| `python3 cli.py samples/notes.txt --today 2026-09-29 --output actions.json --html actions.html --csv approved.csv` | 提出行动项。只导出已批准的行 |
| `node cli.ts sample.json output` | 比较改写。写出 output/report.html |
| `node cli.ts sample.jsonl themes.json output` | 把反馈归到主题 |
| `go run .` | 从一个两提交夹具写出 changelog |

## 收件箱工作台流水线
type: architecture
from: projects/inbox-triage-desk/solution/main.py, projects/inbox-triage-desk/README.md

```arch
node | eml | 1,1 | .eml folder | at most 1 MB each | store
node | parse | 2,1 | parse_message | plain body, Message-ID | process
node | group | 3,1 | group_threads | References and In-Reply-To | process
node | tri | 4,1 | triage | phrase rules plus evidence | process
node | draft | 4,2 | build_draft | X-Unsent reply | process
node | desk | 3,2 | index.html | sorted by priority | client
node | json | 2,2 | triage.json | threads and entries | store
edge | eml | parse |
edge | parse | group |
edge | group | tri |
edge | tri | draft |
edge | draft | desk |
edge | desk | json |
```

## 会议审阅循环
type: flow
from: projects/meeting-notes-to-actions/solution, projects/meeting-notes-to-actions/API.md, projects/meeting-notes-to-actions/README.md

1. **parse_notes**：读取带行号的 `ACTION owner | due | task` 行。
2. **proposals**：把 `NAME will TASK by YYYY-MM-DD` 行加为提案。
3. **validate_action**：owner 或 due 为 "?" 时加上 `needs_owner` 或 `needs_date`。
4. **deduplicate**：对 owner、due 和 task 做 casefold。合并它们的源行。
5. **inbox**：给每个行动项一个来自 SHA-256 的 16 hex id。
6. **Reviewer**：选择 pending、approved 或 rejected。下载 decisions.json。
7. **Rerun**：`--decisions decisions.json` 只导出已批准的完整行动项。

## 从 Git 范围生成 changelog
type: annotated-code
lang: bash
from: projects/changelog-writer-from-git/README.md, projects/changelog-writer-from-git/solution/main.go, projects/changelog-writer-from-git/solution/integration.go

```bash
cd projects/changelog-writer-from-git/solution
go run . --repo <path> --from <rev> --to HEAD    # immutable range
go run . --input <file>                          # NUL-delimited export
git log --format=%H%x00%s%x00%b%x00 FROM..TO     # the export format
go run . --output release.md --receipt release.json  # reusable files
```

## 项目函数
type: task-table
from: projects/inbox-triage-desk/solution/main.py, projects/meeting-notes-to-actions/API.md, projects/plain-language-rewrite-desk/README.md, projects/feedback-theme-board/solution/main.ts, projects/changelog-writer-from-git/solution

| 任务 | 代码 |
|---|---|
| 分类一条消息 | `triage(message, rules)` |
| 写一封未发送回复 | `build_draft(message: dict, decision: dict)` |
| 发布检查清单 | `publish(actions, today)` |
| 测量一段 | `measures(text:string)` |
| 导出已接受文本 | `exportRevisions(comparisons,value?)` |
| 匹配一个短语跨度 | `findEvidence(row: Feedback, phrase: string)` |
| 构建主题板 | `buildBoard(rows: Feedback[], themes: Theme[])` |
| 渲染发布说明 | `Release(label string, commits []Commit, max int)` |

## 基线与模型选项
type: comparison
from: projects/inbox-triage-desk/README.md, projects/meeting-notes-to-actions/API.md, projects/plain-language-rewrite-desk/README.md, projects/feedback-theme-board/README.md, projects/feedback-theme-board/solution/cli.ts

| 因素 | Inbox | Meeting | Rewrite | Feedback |
|---|---|---|---|---|
| 基线 | 显式短语规则 | ACTION 行 | 短语替换 | 词短语 |
| 模型选项 | `--provider-url` | 无 | 录制的提案 | `--suggest` |
| 模型输出 | model-proposals.json | 无 | 作者提案 | themes.proposed.json |
| 审阅关卡 | 每份草稿都需要审阅 | 显式决定 | 作者接受 | 使用前审阅 |
| 从不做 | 发送回复 | 发布任务 | 证明含义 | 发到 tracker |

## 默认值与上限
type: defaults
from: projects/changelog-writer-from-git/solution/main.go, projects/inbox-triage-desk/solution/main.py, projects/feedback-theme-board/solution/main.ts, projects/feedback-theme-board/solution/cli.ts, projects/plain-language-rewrite-desk/solution/main.ts

| 设置 | 默认值 | 说明 |
|---|---|---|
| Label 标志 | v0.2.0 | 发布标题 |
| To 标志 | HEAD | 包含的结束修订 |
| 每次发布的提交 | 1000 | 更多会给出 budget exceeded |
| 收件箱 `--model` | local-model | 仅可选 provider |
| 消息大小 | 1 MB | 每个 .eml 文件 |
| 反馈输入 | 2 MB | 最多 10000 条记录 |
| 模型主题输入 | 50 | `--suggest` 的反馈记录 |
| 长词 | 8 | 更多字母计为长词 |

## 错误与修复
type: troubleshooting
from: projects/inbox-triage-desk/solution/main.py, projects/inbox-triage-desk/README.md, projects/meeting-notes-to-actions/solution/cli.py, projects/meeting-notes-to-actions/API.md, projects/plain-language-rewrite-desk/solution/main.ts, projects/feedback-theme-board/solution/main.ts, projects/changelog-writer-from-git/solution, projects/changelog-writer-from-git/README.md

| 症状 | 原因 | 修复 |
|---|---|---|
| "Conflicting duplicate Message-ID" | 两个文件共享一个 id | 只保留一份消息副本 |
| 类别是 uncertain | 规则冲突或没有匹配 | 编辑 `--rules` 里的短语 |
| 正文状态 `no-plain-body` | 仅 HTML 的消息 | 手工审阅它 |
| "unknown or stale action ids" | 源行变了 | 重新生成 inbox。再审阅一遍 |
| "cannot approve missing owner or due date" | Owner 或 due 是 "?" | 在笔记里填上 |
| "Resolve factual issues before accepting" | 数字或受保护术语变了 | 先修好提案 |
| "Provide 1 to 30 themes" | 主题列表为空或过长 | 保持 1 到 30 个主题 |
| "changelog: budget exceeded" | 范围超过 1000 个提交 | 收窄 `--from` 和 `--to` |

## 代码中的规则
type: concepts
from: projects/inbox-triage-desk/solution/main.py, projects/plain-language-rewrite-desk/solution/main.ts, projects/feedback-theme-board/solution/main.ts, projects/changelog-writer-from-git/solution

- **分拣优先级**：action 0，uncertain 1，information 2。
- **行动短语**：please、can you、could you、confirm。
- **改写**："in order to" 改为 "to"，"utilize" 改为 "use"，"prior to" 改为 "before"。
- **重复**：相同来源和 NFKC 小写文本只计一次。
- **主题顺序**：先按不同来源最多，再按 id。
- **分组**：Breaking changes、Features、Fixes、Other。
- **Breaking**：`BREAKING CHANGE:` 页脚，或类型后的 `!`。
- **Revert**："This reverts commit" 带一个 40 hex id。

## 问题
type: qa
from: projects/inbox-triage-desk/README.md, projects/meeting-notes-to-actions/API.md, projects/plain-language-rewrite-desk/README.md, projects/feedback-theme-board/README.md, projects/changelog-writer-from-git/README.md

- **收件箱工作台会发邮件吗？** 不。它从不连接到邮箱。
- **笔记里什么保持未分配？** 两种文法之外的建议。
- **改写检查能证明事实吗？** 不。它们是词汇防护。作者审阅含义。
- **来源计数能衡量需求吗？** 不。标签不是核验过的人或市场规模。
- **changelog 支持哪种哈希？** SHA-1 提交 ID。SHA-256 需要扩展。

## 提示
type: tips
from: projects/inbox-triage-desk/README.md, projects/meeting-notes-to-actions/README.md, projects/feedback-theme-board/README.md, projects/changelog-writer-from-git/README.md

- 运行你自己的导出前，先写下预期结果。
- 把输入放在输出旁边，好让别人复现。
- 读 JSON 回执，并在集成前测试一个新输入。
- 远程 provider 需要 HTTPS。HTTP 只对 loopback 有效。
- 核心阶段之后阅读 integration.go。
