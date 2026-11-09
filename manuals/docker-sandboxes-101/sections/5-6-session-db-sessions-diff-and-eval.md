# session.db、sessions diff 和 eval

> 每次运行都是一个 SQLite 文件中的行，cassette 回放其模型调用，`sessions diff` 找出第一次不同的工具调用，`eval` 在容器中为已保存的会话打分。

你改了智能体指令的一行，想知道它是否仍在做同样的工作。实时模型每次回答用词都不同，所以你需要可以回放和比较的记录。

读完本节后，你能从 cassette 回放一次运行，按工具调用比较两次运行，并用 `eval` 给智能体打分。

## session.db {#s-session-db-sessions-diff-and-eval-session-db}

**会话：** 一次对话的记录，包含每条消息、工具调用、子智能体运行和费用 {{docs-agent Sessions}}。它存放在数据目录下的 `session.db` 中，除非 `--data-dir` 或 `-s` 指向别处，否则是 `~/.cagent` {{help-agent docker-agent run}}。`--session -1` 按创建时间恢复最新会话 {{docs-agent Sessions}}。

```listing
title: 本部分各次运行之后的会话存储
source: capture/out/21-session-db.txt
lang: text
note: 删节到表列表、sessions 的列，以及五个最新的 title。
---
$ sqlite3 work/data/session.db .tables  (python sqlite3)
generated_media_blobs generated_media_manifest migrations session_items sessions sqlite_sequence
…
$ sqlite3 work/data/session.db 'pragma table_info(sessions)'  (12 rows)
id created_at tools_approved input_tokens output_tokens title cost send_user_message max_iterations working_dir starred permissions agent_model_overrides custom_models_used thinking parent_id instruction_context safety_policy attributes origin

$ sqlite3 work/data/session.db 'select id, title from sessions order by created_at desc limit 5'
<uuid> | Running agent
…
```

该表保存了 12 个会话：十次运行，以及团队运行的两个 `Transferred task` 子会话，它们带有父 id（`19-transcript.txt`）。每个会话存储其 `safety_policy`，`session_items` 保存消息。五个最新的都是 `--exec` 运行，标题为 `Running agent`，而不是文档所描述的由第一条消息生成的标题 {{docs-agent Sessions}}。

## Cassette：--record 和 --fake {#s-session-db-sessions-diff-and-eval-cassettes-record-and-fake}

**Cassette：** `docker-agent` 与模型之间 HTTP 交换的 YAML 文件。`--record` 写入它，`--fake` 在完全没有模型的情况下回放它 {{help-agent docker-agent run}}。`18-cassette-head.txt` 展示了格式：`version: 2`，然后是 `interactions`，每条都有一个发往 `localhost:12434` 的请求和流式回复。

```listing
title: kit 用来录制和回放的标志
source: capture/run.py
lang: python
note: Kit 类的一个方法和一个模块函数，两者之间有删节。DMR_URL 为 http://localhost:12434。
---
    def start_recording(self, name):
        if not self.record_cassettes and os.path.exists(cassette_path(name)):
            return None
        self.recorded.append(name)
        return ["--models-gateway", f"{DMR_URL}/engines", f"--record={CASSETTE_WORK}/{name}"]
…
def replay(name):
    return ["--fake", f"{CASSETTE_WORK}/{name}"]
```

录制发现了帮助未说明的四条规则（[kit 说明](manuals/docker-sandboxes-101/capture/README.md)）。`--record` 只接受 `--record=PATH` 这种形式的值，单独一个词会被读成智能体引用。路径相对于 `--working-dir`，并会追加 `.yaml`。使用 `dmr` 提供方时，除非运行还带有 `--models-gateway http://localhost:12434/engines`，否则录制代理会回答 400。

回放按请求体匹配每个请求。当一轮发出两次工具调用时，运行时并行执行它们，并按完成顺序追加结果。下一个请求体就会不同，回放会回答 500，"requested interaction not found"。因此 kit 每条消息只发送一次工具调用。

## sessions diff {#s-session-db-sessions-diff-and-eval-sessions-diff}

比较看的是工具调用序列，而不是助手的正文 {{help-agent docker-agent sessions diff}}，报告在第一次分歧处停止。

```listing
title: 帮助中的示例形式、可用的形式，以及一次分歧
source: capture/out/21-sessions-diff.txt
lang: text
note: 没有任何删节。
---
$ docker-agent sessions diff -1 -2
Error: unknown shorthand flag: '1' in -1
[exit 1]

$ docker-agent sessions diff -- -1 -2
Comparing -1 (5 turns) against -2 (5 turns)

✅ Identical behaviour across all 5 turns.
[exit 0]

$ docker-agent sessions diff --fail-on-divergence -- -1 -3
Comparing -1 (5 turns) against -3 (6 turns)

❌ First divergence at turn 0 (after 0 matching turn(s)).
   -1 called:
     list_directory({"path": "."})
   -3 called:
     shell({"cmd": "echo m101-ok"})

Everything after this point is downstream of the divergence and is not compared.
Error: sessions diverged
[exit 1]
```

帮助自己的示例 `sessions diff -1 -2` 会失败，因为解析器把 `-1` 读成标志。在引用之前加上 `--`。`-1` 和 `-2` 是 `files.yaml` 的两次回放（`21-two-runs.txt`），各有五轮，对应 `18-transcript.txt` 中的每次模型回复。`-3` 是 `guarded.yaml` 的受限运行，它先调用了 `shell`。对于相同的那一对，`--json` 打印了 `{"turns_a": 5, "turns_b": 5, "turns_matched": 5}`（`21-sessions-diff.json`）。

## eval {#s-session-db-sessions-diff-and-eval-eval}

**Eval 会话：** 一个 JSON 会话，包含一条用户消息、期望的工具调用，以及一个 `evals` 块 {{docs-agent Evaluation}}。该块保存 `relevance` 陈述、一个 `size` 和一个 `working_dir`。`eval` 在容器中回放每一个，并给工具调用 F1、由评判模型给出的 relevance，以及 size 打分。

capture 用 `--judge-model dmr/ai/qwen3:4b` 试了三次。不加额外标志时，两次 eval 都因 `exec: "docker": executable file not found in $PATH` 失败，因为镜像 `docker/docker-agent:1.149.0` 没有用来查找 Model Runner 的 `docker` CLI（`22-eval.txt`）。加上 `--models-gateway http://model-runner.docker.internal/engines` 后，评判检查先因 HTTP 403 失败。文档解释了原因：LLM 评判在主机上运行，不在 eval 容器中 {{docs-agent Evaluation}}，而主机无法访问那个名称（`22-eval-gateway.txt`）。用 `-e DOCKER_AGENT_MODELS_GATEWAY=…` 时，只有容器变了，两次 eval 都跑起来了。

```listing
title: 成功的那次 eval 运行
source: capture/out/22-eval-container-env.txt
lang: text
note: 加载行和输出路径已删节。
---
$ docker-agent eval fixtures/agents/files.yaml fixtures/evals --judge-model dmr/ai/qwen3:4b -c 1 -e DOCKER_AGENT_MODELS_GATEWAY=http://model-runner.docker.internal/engines --output work/eval-results-container-env
…
✓ Count the lines of README.md ($0.000000)
  ✓ size S
  ✓ tool calls
  ✓ relevance 1/1
✗ List the files in the working directory ($0.000000)
  ✓ size S
  ✓ relevance 1/1
  ✗ tool calls score 0.67
…
✅          Sizes: 2/2 passed (100.0%)
✅     Tool Calls: 83.3% avg F1 (2 evals)
✅      Relevance: 2/2 passed (100.0%)
…
```

第二次 eval 期望一次 `list_directory` 调用，而模型在其后又加了一次 `shell` 调用，所以 F1 降到 0.67（`22-eval-run-container-env.json`）。两次 eval 会话都以 `"safety_policy": "autonomous"` 运行。帮助的默认值是 `-c 10` 和评判模型 `openai/gpt-5.6-terra`，文档表格写的是 CPU 数量和 `anthropic/claude-opus-5`。本手册以帮助为准（[冲突 C65](#s-ref-sources-and-the-conflicts-register)）。输出目录里有 `<run>.db`、`<run>.json` 和 `<run>.log`，没有文档列出的 `-sessions.json` 文件（`22-eval-results-ls-container-env.txt`）。

```figure
id: fig-5-6
kind: timeline
title: 两次运行在同一轮次轴上，以及两个 eval 分数
claim: `files.yaml` 的两次回放在全部五轮上都匹配，guarded 运行在第 0 轮出现差异，`eval` 按每次工具调用给同一个智能体打分.
caption: 沿轮次轴从左到右读上方轨道，每个单元格对应一次模型回复。玫瑰色单元格是第一次分歧，虚线单元格不参与比较。底部各行是 eval 分数。 From capture/out/18-transcript.txt, 20-restricted.txt, 21-sessions-diff.txt, and 22-eval-container-env.txt.
```

```takeaways
- 在相对会话引用之前加上 `--`，例如 `sessions diff -- -1 -2`。
- 用 `--record=PATH` 和 `--models-gateway` 录制，并要求每条消息只做一次工具调用。
- 用 `sessions diff --fail-on-divergence` 让 CI 任务失败，它比较工具调用并忽略正文。
- 用 `-e` 把 models gateway 传给 eval 容器，因为评判留在主机上。
```

Sources: docs-agent Sessions, Evaluation (research/sources/docs-docker-agent.md, pages features/sessions, features/evaluation); help-agent docker-agent run, sessions diff, eval (research/sources/help-docker-agent.md); conflict C65 (research/conflicts-register.md); capture/README.md; capture/run.py; capture/fixtures/agents/files.yaml, guarded.yaml; capture/fixtures/evals/count-lines.json, list-files.json; capture/out/18-cassette-head.txt, 18-transcript.txt, 19-transcript.txt, 20-restricted.txt, 21-session-db.txt, 21-sessions-diff.txt, 21-sessions-diff.json, 21-two-runs.txt, 22-eval.txt, 22-eval-gateway.txt, 22-eval-container-env.txt, 22-eval-run.json, 22-eval-run-container-env.json, 22-eval-results-ls-container-env.txt
