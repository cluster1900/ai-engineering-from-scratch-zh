# agents、models 和 providers

> `agents` 是唯一的必填块，模型引用是 `provider/model` 或来自 `models` 的名称，`providers` 设置可复用的端点，例如 Docker Model Runner。

你打开 `capture/fixtures/agents/files.yaml`，在智能体上看到 `model: local`，在 `models` 下看到 `local` 条目，该条目内是 `provider: dmr`。第二个文件 `dmr.yaml` 增加了一个带 URL 的 `providers` 块，它的运行从未到达录制器。

读完本节后，你能顺着智能体的 `model` 值走到它调用的端点，并预测 `auto` 会选什么。

## 文件及其 schema {#s-agents-models-and-providers-the-file-and-its-schema}

**智能体文件：** 一份匹配 `agent-schema.json` 的 YAML 或 HCL 文档，即 Docker Agent v16 的 schema。其根允许 16 个键，并要求其中一个：`agents`，一份至少包含一个智能体的智能体配置映射 {{schema agents}}。拼错的顶层键会让加载失败，因为解析器拒绝未知的顶层键 {{docs-agent Configuration Overview}}。

`version` 是 schema 枚举中从 `"0"` 到 `"16"` 的字符串。同一文档页仍把 `15` 当作当前版本 {{docs-agent Configuration Overview}}。capture 文件声明 `"16"` 并能加载，所以本手册遵循 schema。加载较旧的配置时，Docker Agent 会把它迁移到最新 schema {{docs-agent Configuration Overview}}。`share pull` 从 `agentcatalog/pirate` 取回的智能体声明 `version: "2"`，并内联命名 `openai/gpt-4.1`（`16-share-pull-agent.yaml`）。

```listing
title: 单智能体运行所用的智能体文件
source: capture/fixtures/agents/files.yaml
lang: yaml
note: 未删节。同一文件驱动 session、eval 和 share 各节中的运行。
---
version: "16"

agents:
  root:
    model: local
    description: Lists the files of a small repository and counts lines.
    instruction: |
      You answer questions about the files in the working directory.
      Use the tools to look; never guess. Answer in one sentence that
      names the files and gives the line count.
    max_iterations: 8
    toolsets:
      - type: filesystem
      - type: shell

models:
  local:
    provider: dmr
    model: ai/qwen3:4b
    temperature: 0
```

## 智能体键 {#s-agents-models-and-providers-agent-keys}

**智能体：** `agents` 下的一个条目，以其键命名。团队的第一个智能体运行，除非 `--agent` 点名另一个 {{help-agent docker-agent run}}。schema 的 `AgentConfig` 列出这些键，下面是 capture 文件使用或依赖的那些。

| 键 | 在 capture 中 | schema 规则 |
|---|---|---|
| `model` | `local`、`qwen`、`dmr/ai/qwen3`、`openai/gpt-4.1` | 模型名或 `provider/model` {{schema AgentConfig}} |
| `instruction` | 每个文件中的块字符串 | 系统提示：一个字符串，或用空行拼接的列表 |
| `max_iterations` | `files.yaml` 中为 `8`，`writer` 为 `3` | 从 0 起的整数 |
| `max_consecutive_tool_calls` | 未设置 | 智能体停止前允许的相同调用次数，0 表示默认值 5 |
| `redact_secrets` | 未设置 | 默认为 `true`：一个 builtin 在三个 hook 事件上擦除密钥 |
| `toolsets`、`sub_agents`、`handoffs`、`hooks` | `files.yaml`、`team.yaml`、`guarded.yaml` | [toolsets](#s-toolsets-and-mcps)、[委派](#s-sub-agents-transfer-task-and-background-agents)、[权限](#s-permissions-safety-and-hooks) |

## 模型引用 {#s-agents-models-and-providers-model-references}

**模型引用：** 智能体上 `model` 的值。它有五种形式：

- 内联的 `provider/model`，例如 `greeter.yaml` 中的 `dmr/ai/qwen3` {{docs-agent Models}}。
- `models` 下的名称，例如 `local`，带有 `provider`、`model`，以及 `temperature: 0` 这类参数。
- `first_available` 列表：加载时，Docker Agent 挑选第一个已配置凭据的候选 {{docs-agent Models}}。
- alloy：两个引用，中间用逗号隔开，运行时在一次对话中交替使用。
- `auto`：第一个已配置凭据的云 provider，然后是已拉取的 Model Runner 模型 {{docs-agent Set Up a Model}}。

`run --model [agent=]provider/model` 为一次运行替换该引用 {{help-agent docker-agent run}}。在录制用的 Mac 上，`doctor` 在只拉取了 4B 标签时把 `auto` 解析为 `dmr/docker.io/ai/qwen3:4b`（`25-doctor.txt`）。没有 Model Runner 时，它命名 `dmr/ai/qwen3:latest` 并报告没有可用模型（`16-doctor.txt`）。

## providers 和 Model Runner 端点 {#s-agents-models-and-providers-providers-and-the-model-runner-endpoint}

**Provider 定义：** `providers` 下的一个条目，带有底层 `provider`（默认 `openai`）、`base_url`、`token_key`，以及其模型继承的默认值 {{docs-agent Provider Definitions}}。

```listing
title: Docker Model Runner 的命名 provider
source: capture/fixtures/agents/dmr.yaml
lang: yaml
note: agents 块已删节。
---
version: "16"

providers:
  runner:
    provider: dmr
    base_url: http://localhost:12434/engines/llama.cpp/v1

models:
  qwen:
    provider: runner
    model: ai/qwen3:4b
    temperature: 0
…
```

`files.yaml` 写了 `provider: dmr` 而没有 `base_url`，然后 Docker Agent 自行查找 DMR 端点 {{docs-agent Docker Model Runner}}。它运行 `docker model status --json`，当没有 Docker 守护进程应答时，`16-dry-run.txt` 在其错误中打印这一点。eval 容器没有 `docker` CLI，所以同样的发现会在那里失败，如 [eval](#s-session-db-sessions-diff-and-eval) 所示。

带有显式 `base_url` 时，`dmr.yaml` 回答了 `Hello`（[该 capture](manuals/docker-sandboxes-101/capture/out/25-run-dmr.txt)）。那次运行在每次 capture 中都是实时的，因为显式 `base_url` 会绕过 `--record` 代理，让 cassette 为空（[kit 说明](manuals/docker-sandboxes-101/capture/README.md)）。在发现无法工作时设置 `base_url`，想要 cassette 时则省略它。

Provider id 也变了。`doctor` 打印 `fireworks-ai`、`togetherai` 和 `moonshotai`，文档 Models 表列出 `fireworks`、`together` 和 `moonshot`。本手册打印 `doctor` 打印的 id（[冲突 C58](#s-ref-sources-and-the-conflicts-register)），其余见[providers 表](#s-ref-providers-and-models)。`flavors` 下的命名补丁用 `--flavor` 在运行时改变这些块中的任何一个 {{help-agent docker-agent run}}，capture 一个也没跑。

```figure
id: fig-5-2
kind: structure
title: 模型引用到达 Model Runner 的两条路径
claim: `files.yaml` 把 `local` 解析到 `dmr` provider 并自行发现端点，而 `dmr.yaml` 通过 `providers.runner` 把 `qwen` 解析到一个固定 URL.
caption: 每列从上往下读，从智能体到端点。紫色块是智能体条目，梅红色块是模型和 provider 条目。最下一行是 `doctor` 打印的 `auto` 决策。 From capture/fixtures/agents/files.yaml, capture/fixtures/agents/dmr.yaml, capture/out/16-doctor.txt, 16-dry-run.txt, and 25-doctor.txt.
```

```takeaways
- 给每个智能体文件一个 `version` 字符串，并且只用 schema 中的顶层键。
- 在 `models` 下命名模型，让 `temperature` 这类参数集中在一处。
- 只在发现无法工作时才设置 `base_url`，因为它会绕过 `--record`。
- 依赖 `auto` 之前，先读 `docker-agent doctor` 的 `auto` 那一行。
```

Sources: schema agents, AgentConfig (research/sources/agent-schema.json); docs-agent Configuration Overview, Models, Set Up a Model, Provider Definitions, Docker Model Runner (research/sources/docs-docker-agent.md, pages configuration/overview, concepts/models, getting-started/set-up-a-model, providers/custom, providers/dmr); help-agent docker-agent run (research/sources/help-docker-agent.md); conflict C58 (research/conflicts-register.md); capture/README.md; capture/fixtures/agents/files.yaml, dmr.yaml, greeter.yaml; capture/out/16-doctor.txt, 16-dry-run.txt, 16-share-pull-agent.yaml, 25-doctor.txt, 25-run-dmr.txt
