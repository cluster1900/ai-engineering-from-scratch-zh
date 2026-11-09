# docker-agent run、new 和 doctor

> `docker-agent run` 加载一份智能体文件，在有或没有终端的情况下驱动循环，`doctor` 说出 `auto` 会选哪个模型，`new` 需要终端。

同事发给你一份智能体文件和一条运行它的命令。你没有 API key，只有带 Model Runner 的 Docker Desktop，你想在打开聊天窗口之前证明这份文件能运行。

读完本节后，你能在没有终端的情况下运行一份智能体文件，读懂它的事件流，并问 `doctor`，`auto` 会选哪个模型。

## run 接受什么 {#s-docker-agent-run-new-and-doctor-what-run-takes}

**智能体引用：** `docker-agent run` 的第一个参数。它是 `.yaml`、`.yml` 或 `.hcl` 文件、registry 引用、别名，或什么都没有 {{help-agent docker-agent run}}。什么都没有时，`run` 使用当前目录中的 `docker-agent.yaml`、`docker-agent.yml` 或 `docker-agent.hcl`，否则使用内置的默认智能体 {{docs-agent CLI Reference}}。`coder` 是第二个内置智能体，`alias add` 为一个文件或引用保存一个名称，并带上 `--safety` 这类运行选项 {{help-agent docker-agent alias add}}。

registry 引用的行为像文件。`24-run-ref.txt` 运行 `localhost:15000/m101/agent:v1`，并打印与本地文件相同的回答，如 [share push 和 share pull](#s-share-push-and-share-pull) 所示。之后的每个参数是一条用户消息，这些消息按顺序作为轮次运行。`-` 从 stdin 读取消息 {{help-agent docker-agent run}}。

## --exec、--json 和 --last {#s-docker-agent-run-new-and-doctor-exec-json-and-last}

**无终端运行：** `run --exec`，它写入 stdout 且不打开 TUI。`--json` 每行写一个 JSON 事件，`--last` 只打印最终回答 {{help-agent docker-agent run}}。这次 capture 以每种形式、用相同的两条消息运行[files 智能体](manuals/docker-sandboxes-101/capture/fixtures/agents/files.yaml)。

```listing
title: 带两条消息的 run --exec --last
source: capture/out/18-run-last.txt
lang: text
note: 未删节。--fake 标志回放已录制的模型回答，如会话一节所解释。
---
$ docker-agent run --exec --working-dir fixtures/repo --last --fake work/cassettes/18-files fixtures/agents/files.yaml 'List the files in the working directory.' 'How many lines does README.md have? Count them with a shell command.'
README.md has 1 line.
[exit 0]
```

```listing
title: 同一次运行用 --json 得到的 67 个事件中的三个
source: capture/out/18-run-json.ndjson
lang: jsonl
note: 文件的第 5、13 和 24 行。tool_call 事件在调用之后、tool_definition 之前删节。
---
{"message": "List the files in the working directory.", "session_id": "<uuid>", "session_position": 0, "timestamp": "<ts>", "type": "user_message"}
{"agent_name": "root", "timestamp": "<ts>", "tool_call": {"function": {"arguments": "{\"path\": \".\"}", "name": "list_directory"}, "id": "<call-id>", "type": "function"}, "tool_definition": …
{"agent_name": "root", "content": "The working directory contains 1 file: README.md (1 line).", "message_id": "<uuid>", "session_id": "<uuid>", "timestamp": "<ts>", "type": "agent_choice"}
```

文件中其他事件类型包括 `team_info`、`toolset_info`、`tool_call_response`、`token_usage` 和 `stream_stopped`。第二轮显示了无终端运行的限度。模型请求带 `wc -l README.md` 的 `shell`，运行时抛出了 `tool_call_confirmation`。没有终端来回答它，工具结果是 "The user rejected the tool call."。模型随后使用了 `read_file`（[这次 transcript](manuals/docker-sandboxes-101/capture/out/18-transcript.txt)）。[权限、--safety 和 hooks](#s-permissions-safety-and-hooks)解释了那次调用为何询问。

## 每次录制中的模型 {#s-docker-agent-run-new-and-doctor-the-model-in-every-recording}

文档称 `ai/qwen3` 是 Docker Agent 默认使用的模型 {{docs-agent Set Up a Model}}。没有 Model Runner 时，`doctor` 把 `auto` 解析为 8B tag `ai/qwen3:latest`（`16-doctor.txt`）。在录制用的 Mac 上，对该 tag 的两次拉取都在最后一个 5.03 GB blob 之后以 digest 不匹配结束（`25-model-pull-latest.txt`）。因此 kit 的每份智能体文件都指定 `ai/qwen3:4b`，同一仓库的 4B tag。它是思考模型，所以在每个回答之前会流式输出几千个推理 token。`--exec` 打印它们，kit 把它们删到一行，例如 `[... 299 lines of model reasoning cut by run.py ...]`（`18-run-exec.txt`）。

## doctor 和 models {#s-docker-agent-run-new-and-doctor-doctor-and-models}

`doctor` 报告 provider 凭据、Docker Model Runner 是否应答、`auto` 的选择，以及在带文件时该文件需要的变量。有问题时它以非零退出 {{help-agent docker-agent doctor}}。kit 在没有 Docker 守护进程时运行了一次，在 Model Runner 起来时又运行了一次。

```listing
title: 没有 Docker 守护进程时的 doctor
source: capture/out/16-doctor.txt
lang: text
note: 20 行 provider 记录全部是 "not set"，以及 runner 检查的完整错误已删节。
---
$ docker-agent doctor
…
Docker Model Runner
  Status: unreachable: docker --config=$HOME/.docker --context=m101-no-daemon model status --json: …
…
Model auto-selection
  auto -> dmr/ai/qwen3:latest

Issues
  - no usable model: no provider credential was found and Docker Model Runner is unreachable; …
Error: 1 issue(s) found
[exit 1]
```

```listing
title: Model Runner 已启动且已拉取一个模型时的 doctor
source: capture/out/25-doctor.txt
lang: text
note: 用户配置行和 20 行 provider 记录已删节。
---
$ docker-agent doctor
…
Docker Model Runner
  Status: reachable, 1 model(s) pulled:
    - docker.io/ai/qwen3:4b

Model auto-selection
  auto -> dmr/docker.io/ai/qwen3:4b

No issues found.
[exit 0]
```

没有 runner 时，`auto` 仍点名 `dmr/ai/qwen3:latest`，问题行说明为什么什么都跑不了。runner 起来后，`auto` 取那个已拉取的模型，如 provider 页面所说：自动选择优先已在本地安装的模型 {{docs-agent Docker Model Runner}}。`models list` 打印了一行 `dmr ai/qwen3:latest`，即使没有守护进程（`16-models.txt`）。`setup` 是交互式修复。它的四条路径是 `~/.config/cagent/.env` 中的 provider 密钥、一次 Model Runner 拉取、一个自定义的 OpenAI 兼容端点，以及 Claude Code harness {{help-agent docker-agent setup}}。

## new {#s-docker-agent-run-new-and-doctor-new}

`new` 提出问题并写一份智能体文件，描述参数会跳过「the initial prompt」 {{help-agent docker-agent new}}。它的 `--model` 接受 anthropic、openai、google、dmr 或自定义 provider，`--max-iterations` 对 DMR 默认为 20（[冲突 C66](#s-ref-sources-and-the-conflicts-register)）。在这次 capture 中，带描述且没有控制终端的 `new` 停在 `/dev/tty`，没有写文件（`17-new-agent.yaml`）。

```listing
title: 带描述且没有终端的 new
source: capture/out/17-new.txt
lang: text
note: 欢迎横幅和遥测提示已删节。
---
$ docker-agent new --model dmr/ai/qwen3:4b 'an agent that greets the user and names one fact about Docker sandboxes'  (in work/, without a controlling terminal)
…
Error: bubbletea: error opening TTY: bubbletea: could not open TTY: open /dev/tty: device not configured
[exit 1]
```

[图](#fig-5-1)把一次运行的各部分放在同一页。

```figure
id: fig-5-1
kind: flow
title: 一次 docker-agent 运行，从文件到它的输出
claim: `run` 加载智能体文件，在一个循环中交替进行模型调用和工具调用，并写出回答、事件、一次会话，以及带 `--record` 时的 cassette.
caption: 从左上读起。实心 plum 是模型调用，虚线 olive 是工具效果。点线 indigo 是事件流，实心 teal 是存储的记录。使用 `--fake` 时，cassette 代替 Model Runner 作答。 From capture/fixtures/agents/files.yaml, capture/out/18-run-json.ndjson, and capture/out/18-cassette-head.txt.
```

```takeaways
- 先运行 `docker-agent doctor`，并读它的 `auto` 行和退出码。
- 在脚本中使用 `--exec --json`，并预期每个需要批准的工具调用都会失败。
- 为 CI 手写智能体文件，因为 `docker-agent new` 会打开 `/dev/tty`。
- 在智能体文件中点名一个模型 tag，而不是在共享机器上信任 `auto`。
```

Sources: help-agent docker-agent run, setup, doctor, new, alias add (research/sources/help-docker-agent.md); docs-agent CLI Reference, Set Up a Model, Docker Model Runner (research/sources/docs-docker-agent.md, pages features/cli, getting-started/set-up-a-model, providers/dmr); conflict C66 (research/conflicts-register.md); capture/README.md; capture/fixtures/agents/files.yaml; capture/out/16-doctor.txt, 16-models.txt, 17-new.txt, 17-new-agent.yaml, 18-run-exec.txt, 18-run-last.txt, 18-run-json.ndjson, 18-transcript.txt, 18-cassette-head.txt, 24-run-ref.txt, 25-doctor.txt, 25-model-pull-latest.txt
