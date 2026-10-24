---
id: agent-workbench-ops
title: Repo Memory, Init Scripts and Handoffs
code: RM
subtitle: 框定任务，把状态放在经 schema 检查的文件里，开始前先探测，每次会话以交接包结束。
hue: 30
sources: phases/14-agent-engineering/34-repo-memory-and-state, phases/14-agent-engineering/35-initialization-scripts, phases/14-agent-engineering/40-multi-session-handoff, phases/14-agent-engineering/41-workbench-for-real-repos, phases/14-agent-engineering/43-frame-the-task-before-code
source_hash: 02eda89dcde22cea
---

## 一次 workbench 会话
type: flow
from: phases/14-agent-engineering/41-workbench-for-real-repos/docs/en.md, phases/14-agent-engineering/43-frame-the-task-before-code/docs/en.md, phases/14-agent-engineering/35-initialization-scripts/docs/en.md, phases/14-agent-engineering/40-multi-session-handoff/docs/en.md

1. **Frame**：在任何编辑之前写下目标、事实、路径、验收标准和未知项。
2. **Init 脚本**：探测 workbench。失败时停止并上报给人。
3. **Read**：加载范围契约和 `agent_state.json`。
4. **Edit**：只改允许的文件。
5. **Prove**：通过 feedback runner 运行验收命令。
6. **Judge**：运行验证关卡，然后运行 reviewer。
7. **Clean up**：`clean_state.json` 必须是空列表。
8. **Hand off**：生成 `handoff.md` 和 `handoff.json`。

## 命令
type: command-table
span: 2
from: phases/14-agent-engineering/34-repo-memory-and-state/docs/en.md, phases/14-agent-engineering/35-initialization-scripts/code/main.py, phases/14-agent-engineering/40-multi-session-handoff/docs/en.md, phases/14-agent-engineering/41-workbench-for-real-repos/docs/en.md, phases/14-agent-engineering/43-frame-the-task-before-code/docs/en.md, phases/14-agent-engineering/43-frame-the-task-before-code/code/main.py

| 命令 | 作用 |
|---|---|
| `python3 code/main.py` | 运行课程 demo。每个都在脚本旁写出自己的文件 |
| 第 34 课中的 `python3 code/main.py` | 写出 `workdir/agent_state.json` 和 `workdir/task_board.json` |
| `python3 code/main.py --no-cache` | 第 35 课：忽略 `prereqs.lock`，运行全部探测 |
| `python3 code/main.py --write-lkg` | 第 35 课：把当前 HEAD 固定为 last-known-good |
| `git diff --name-only <baseline> HEAD` | `lkg_diff` 探测背后的命令 |
| 第 40 课中的 `python3 code/main.py` | 写出 `handoff.md` 和 `handoff.json` |
| `python3 -m unittest discover code/tests -v` | 第 43 课：测试任务框架校验器 |
| `python3 -m unittest tests.test_accounts` | 示例框架的验收命令 |

## Schema 优先的状态
type: annotated-code
lang: python
from: phases/14-agent-engineering/34-repo-memory-and-state/code/main.py

```python
"required": ["schema_version", "active_task_id", "touched_files", "next_action"]
"active_task_id": {"type": ["string", "null"], "pattern": r"^(T-\d{3,}|)$"}
"status": {"enum": ["todo", "in_progress", "done", "blocked"]}
mgr = StateManager(state_path, STATE_SCHEMA)
state = mgr.load()                          # read, then validate
mgr.commit(state)                           # validate, then atomic_write
fd, tmp_name = tempfile.mkstemp(prefix=path.name + ".", dir=path.parent)
os.fsync(fh.fileno())                       # flush to disk first
os.replace(tmp_name, path)                  # atomic rename
```

## Init 探测
type: concepts
from: phases/14-agent-engineering/35-initialization-scripts/code/main.py, phases/14-agent-engineering/35-initialization-scripts/docs/en.md

- **`probe_runtime`**：低于 `REQUIRED_PYTHON` 时失败。
- **`probe_dependencies`**：对每个依赖执行 `importlib.util.find_spec`。
- **`probe_test_command`**：对测试命令执行 `shutil.which`。
- **`probe_env`**：缺少环境变量时失败。
- **`probe_state_freshness`**：状态过旧或缺失时警告。
- **`probe_lkg_diff`**：超过文件 diff 预算时失败。
- **Probe**：返回 `(name, status, detail)`。
- **Report**：`init_report.json`。任何一项失败则以 1 退出。

## 默认值与数字
type: defaults
from: phases/14-agent-engineering/35-initialization-scripts/code/main.py, phases/14-agent-engineering/34-repo-memory-and-state/code/main.py, phases/14-agent-engineering/40-multi-session-handoff/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `REQUIRED_PYTHON` | (3, 10) | 运行时探测的下限 |
| `STATE_FRESHNESS_SECONDS` | 24 * 60 * 60 | 更旧的状态给出警告 |
| `LOCK_TTL_SECONDS` | 24 * 60 * 60 | 新鲜的锁会跳过探测 |
| `PROBE_BUDGET_SECONDS` | 3.0 | 更慢的通过变为警告 |
| `LKG_FILE_DIFF_BUDGET` | 50 | 改动文件更多则失败 |
| `schema_version` | 1 | 唯一允许的枚举值 |
| `TAIL_K` | 5 | 交接中保留的 feedback 记录数 |
| Review 总风险 | 7 | 低于该值时交接会加一条警告 |

## 交接的七个字段
type: concepts
from: phases/14-agent-engineering/40-multi-session-handoff/docs/en.md, phases/14-agent-engineering/40-multi-session-handoff/code/main.py

- **`summary`**：一段话说明做了什么。
- **`changed_files`**：一眼看清的 diff。
- **`commands_run`**：实际执行了什么。
- **`failed_attempts`**：尝试过什么、为什么失败。
- **`open_risks`**：下一次会话可能踩到的坑，带严重程度。
- **`next_action`**：第一个具体步骤。承重的字段。
- **`verdict_pointer`**：`outputs/verification/<task_id>.json` 与 review。
- **`feedback_tail`**：最近的 `TAIL_K` 条记录，加上每一个非零退出。

## 仅靠 prompt 与 workbench 对比
type: comparison
from: phases/14-agent-engineering/41-workbench-for-real-repos/code/main.py, phases/14-agent-engineering/41-workbench-for-real-repos/docs/en.md

| 结果 | 仅靠 prompt | Workbench 引导 |
|---|---|---|
| `tests_actually_run` | False | True |
| `acceptance_met` | False | True |
| `files_outside_scope` | 2 | 0 |
| `handoff_quality` | 缺失 | 完整的包 |
| `reviewer_total` | 3 | 9 |
| 步骤 | 读、改、宣称完成 | 8 步，从 init 到交接 |

## 任务框架
type: annotated-code
lang: python
from: phases/14-agent-engineering/43-frame-the-task-before-code/code/main.py, phases/14-agent-engineering/43-frame-the-task-before-code/docs/en.md

```python
frame = TaskFrame(
    goal="Prevent duplicate email addresses during signup",
    allowed_paths=["app/accounts.py", "tests/test_accounts.py"],
    forbidden_paths=["migrations/**", "deploy/**"],
    acceptance=["python3 -m unittest tests.test_accounts"],
    facts=[RepositoryFact("Duplicate errors use status 409",
                          "tests/test_accounts.py:44")],  # receipt
    unknowns=["Whether email comparison is case-insensitive"])
issues = validate(frame)          # empty list means READY
render(frame)                     # Markdown, Status: READY or BLOCKED
```

## 为每个未知项分类
type: concepts
from: phases/14-agent-engineering/43-frame-the-task-before-code/docs/en.md

- **Discoverable**：仓库或运行中的系统能回答。继续。
- **Decidable**：任务契约赋予 agent 权限。继续。
- **Human**：会改变产品行为、成本、风险或公开兼容性。暂停。
- **Deferred**：在本次切片之外。放进非目标。

## 故障排查
type: troubleshooting
span: 2
from: phases/14-agent-engineering/34-repo-memory-and-state/docs/en.md, phases/14-agent-engineering/34-repo-memory-and-state/code/main.py, phases/14-agent-engineering/35-initialization-scripts/docs/en.md, phases/14-agent-engineering/35-initialization-scripts/code/main.py, phases/14-agent-engineering/40-multi-session-handoff/code/main.py, phases/14-agent-engineering/43-frame-the-task-before-code/code/main.py

| 现象 | 原因 | 解决 |
|---|---|---|
| 下次会话重做已完成的工作 | 状态在聊天里，不在仓库里 | 把状态放在仓库中经 schema 检查的 JSON 里 |
| 会话在损坏的状态上恢复 | 带静默异常的 `write_text()` | 使用 `atomic_write`：`mkstemp`、`fsync`、`os.replace` |
| `T-bogus` 上出现 `does not match` | 任务 id 不符合模式 | 使用类似 T-001 的 id |
| `init failed; refuse to launch agent` | 某个探测状态为 fail | 修好探测。不要启动 agent |
| `lkg_diff` 失败，改动文件超出预算 | 自 last-known-good 以来超过 50 个文件 | 由人用 `--write-lkg` 确认基线 |
| 探测从 pass 变为 warn，带 `slow:` | 探测超过 3 秒预算 | 把它移出 init 或缓存结果 |
| `no next_action recorded; needs human` | 状态中没有 `next_action` | 交接前设置 `next_action` |
| 框架 `Status: BLOCKED` | `validate` 发现问题 | 逐条修复 Blocking issues 下的内容 |

## 问答
type: qa
from: phases/14-agent-engineering/34-repo-memory-and-state/docs/en.md, phases/14-agent-engineering/35-initialization-scripts/docs/en.md, phases/14-agent-engineering/40-multi-session-handoff/docs/en.md, phases/14-agent-engineering/43-frame-the-task-before-code/docs/en.md

- **仓库记忆里放什么？** 三个月后在 CI 重跑时仍有用的数据。
- **连续两次运行 init？** 第二次除了刷新时间戳外什么也不做。
- **没有 `next_action` 的交接？** 那是状态报告，不是交接。
- **`handoff.md` 和 `handoff.json` 不一致？** 以 JSON 为准。
- **何时停止阅读仓库？** 当每个决策都有证据、已委派，或已列为未知项。
- **何时收尾？** 在上下文预算的 50-75%，而不是 95%。

## 提示
type: tips
from: phases/14-agent-engineering/34-repo-memory-and-state/docs/en.md, phases/14-agent-engineering/40-multi-session-handoff/docs/en.md, phases/14-agent-engineering/43-frame-the-task-before-code/docs/en.md, phases/14-agent-engineering/35-initialization-scripts/docs/en.md

- 大的产物不要放进 `agent_state.json`。只存路径。
- 执行前把每个工具调用 ID 记到 `pending_calls.jsonl`。
- 每次变更都追加到 `state.events.jsonl`。快照写到 `state.json`。
- 每个分支和主题只保留一个活跃的交接。
- 每条事实都给出凭据：文件路径和行号。
- Init 不联网，也不调用 LLM。
