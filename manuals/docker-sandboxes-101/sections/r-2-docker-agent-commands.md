# docker-agent 命令

> docker-agent 1.149.0 根帮助中四组里的每一条命令、每一个全局标志，以及每一个 `serve` 子命令及其默认监听地址。

docker-agent 1.149.0 的根帮助按四组列出 19 条命令：Core、Diagnose、Advanced 和 Additional {{help-agent docker-agent}}。加上子命令，纳入仓库的帮助树有 47 页。二进制是 Homebrew 构建。Desktop 插件 `docker agent` 运行同样的命令，只是名字里有一个空格（[冲突 C48](#s-ref-sources-and-the-conflicts-register)）。文档页 `features/cli` 是仅有的另一份参考，因为 `/reference/cli/docker/agent/` 不存在（[冲突 C68](#s-ref-sources-and-the-conflicts-register)）。

## 全局标志 {#s-ref-docker-agent-commands-global-flags}

每条命令都接受这些标志 {{help-agent docker-agent}}。

| 标志 | 默认值 | 含义 |
|---|---|---|
| `--cache-dir` | macOS 上为 `~/Library/Caches/cagent` | 覆盖缓存目录 |
| `--config-dir` | `~/.config/cagent` | 覆盖配置目录。文档补充说 `DOCKER_AGENT_CONFIG_DIR` 和遗留的 `CAGENT_CONFIG_DIR` 设置同一路径 {{docs-agent features/cli}} |
| `--data-dir` | `~/.cagent`，或 `DOCKER_AGENT_DATA_DIR` | 覆盖数据目录，其中存放 `session.db`、worktree 和 plan {{docs-agent features/cli}} |
| `-d, --debug` | 关 | 启用调试日志 |
| `--log-file` | `~/.cagent/cagent.debug.log` | 调试日志的路径，只与 `--debug` 一起使用 |
| `-o, --otel` | 关 | 启用 OpenTelemetry 追踪 |
| `-h, --help` | 无 | 打印该命令的帮助 |

## 核心命令 {#s-ref-docker-agent-commands-core-commands}

| 命令 | 用途 | 关键标志 | 需要 | 章节 |
|---|---|---|---|---|
| `getting-started` | 通过动手交互导览学习 docker agent {{help-agent docker-agent}} | 无。帮助树没有它的页面（[冲突 C75](#s-ref-sources-and-the-conflicts-register)）。文档描述了一个两分钟可跳过的导览，也可以用 `docker agent tour` 进入 {{docs-agent features/cli}} | 交互式终端 | [§5.1](#s-docker-agent-run-new-and-doctor) |
| `run [<agent-file>\|<registry-ref>] [message]...` | 从文件、仓库引用、别名或内置默认运行一个智能体 {{help-agent docker-agent run}} | 见下表 | 带凭据的模型、Docker Model Runner，或 `--fake` | [§5.1](#s-docker-agent-run-new-and-doctor) |
| `setup` | 通过四条路径之一设置模型：内置提供方、Docker Model Runner、自定义 OpenAI 兼容端点，或 Claude Code harness {{help-agent docker-agent setup}} | 无 | 终端。提供方路径会写入 `~/.config/cagent/.env` | [§5.1](#s-docker-agent-run-new-and-doctor) |
| `share push <agent-file> <registry-ref>` | 把智能体文件推送到 OCI 仓库，明文，可在注解中带可选签名或 MAC {{help-agent docker-agent share push}} | `--key`（PEM、OpenSSH 或 16 字节密钥，或 `DOCKER_AGENT_ENCRYPT_KEY`）、`--encrypt` | 仓库访问 | [§6.4](#s-share-push-and-share-pull) |
| `share pull <registry-ref>` | 拉取智能体文件，有密钥时验证或解密 {{help-agent docker-agent share pull}} | `--key`、`--force` | 仓库访问 | [§6.4](#s-share-push-and-share-pull) |

## run 的标志 {#s-ref-docker-agent-commands-the-flags-of-run}

`run` 页列出 54 个标志 {{help-agent docker-agent run}}。下表按组列出本手册用到的那些，以及它们的默认值。

| 组 | 标志 |
|---|---|
| 智能体与输入 | `-a, --agent`（团队的第一个智能体）、`--agent-picker [refs]`、`--prompt-file`（可重复）、`--attach <image>`、`-` 从 stdin 读取消息 |
| 输出 | `--exec`（无 TUI）、`--last`（只要最终回答，需要 `--exec`）、`--json`（NDJSON 事件）、`--hide-tool-calls`、`--hide-tool-results`、`--on-event <type>=<cmd>` |
| 批准 | `--safety strict\|balanced\|restricted\|autonomous`、`--yolo`（与 `--safety autonomous` 相同，[冲突 C59](#s-ref-sources-and-the-conflicts-register)） |
| 模型 | `--model [agent=]provider/model`（可重复）、`--models-gateway`、`--dry-run` |
| 会话 | `--session <id or -1>`、`-s, --session-db`（默认 `<data-dir>/session.db`）、`--session-read-only`、`--working-dir` |
| 录制与回放 | `--record [path]`（一份 cassette 外加一次 TUI e2e 测试）、`--fake <path>`、`--fake-stream [15]` 块间隔毫秒 |
| 沙箱 | `--sandbox`、`--sbx`（默认 `true`，`--sbx=false` 强制走已移除的 `docker sandbox` 插件，[冲突 C60](#s-ref-sources-and-the-conflicts-register)）、`--template`（默认 `docker/docker-agent-sbx-templates:latest`）、`--sandbox-kit`、`--kit`（可重复）、`--kit-arg`、`--no-kit`、`--cloud`（隐含 `--sandbox`）、`--sandbox-ttl`（默认 `1h0m0s`） |
| Hook | `--hook-pre-tool-use`、`--hook-post-tool-use`、`--hook-session-start`、`--hook-session-end`、`--hook-on-user-input`、`--hook-stop`，全部可重复 |
| 配置 | `--flavor`（可重复，按顺序应用）、`--env-from-file`、`--code-mode-tools`、`--mcp-oauth-redirect-uri`、`--remote <addr>` |
| Worktree | `-w, --worktree [name]`（默认 `auto`）、`--worktree-base <ref>`、`--worktree-pr <number or URL>`（需要 GitHub CLI） |
| TUI | `--lean`、`--sidebar`（默认 `true`）、`--theme`、`--app-name`、`--disable-commands` |

## 诊断命令 {#s-ref-docker-agent-commands-diagnose-commands}

| 命令 | 用途 | 关键标志 | 需要 | 章节 |
|---|---|---|---|---|
| `doctor [agent-file]` | 报告哪些提供方有凭据、Docker Model Runner 是否应答、`auto` 选哪个模型，遇问题以非零退出 {{help-agent docker-agent doctor}} | `--json`、`--env-from-file`、`--models-gateway` | 无。它运行 `docker model status --json` 来检查 runner | [§5.1](#s-docker-agent-run-new-and-doctor) |
| `models [list\|ls]` | 列出 `--model` 接受的模型，先看网关 `/v1/models`，再看来自带凭据的提供方 {{help-agent docker-agent models}} | `-a, --all`、`-p, --provider`、`--format table\|json`、`--models-gateway` | 无 | [§5.1](#s-docker-agent-run-new-and-doctor) |
| `toolsets` | 列出 27 种内置 toolset 类型 {{help-agent docker-agent toolsets}} | `--format table\|json` | 无 | [§5.3](#s-toolsets-and-mcps) 和 [R.5](#s-ref-toolsets) |

## 高级命令 {#s-ref-docker-agent-commands-advanced-commands}

| 命令 | 用途 | 关键标志 | 需要 | 章节 |
|---|---|---|---|---|
| `alias add <alias-name> <agent-path>` | 为智能体文件或仓库引用保存一个带运行选项的名字 {{help-agent docker-agent alias add}} | `--yolo`、`--safety`（压过 `--yolo`）、`--model`、`--hide-tool-results`、`--sandbox` | 无 | [§5.1](#s-docker-agent-run-new-and-doctor) |
| `alias list\|ls`, `alias remove\|rm <alias-name>` | 列出或删除别名 {{help-agent docker-agent alias list}} | `--json` | 无 | [§5.1](#s-docker-agent-run-new-and-doctor) |
| `board` | 打开一个 Kanban TUI，每张卡片在自己的 git worktree 上、在 tmux 会话中运行一个智能体 {{help-agent docker-agent board}} | 无 | tmux、git，以及 `~/.config/cagent/config.yaml` 中的项目 | 无 |
| `debug auth` | 打印正在使用的 Docker token 以及它从哪里来 {{help-agent docker-agent debug auth}} | `--json` | 无 | [R.6](#s-ref-providers-and-models) |
| `debug config <agent-file> [flavor...]` | 打印应用了 flavor 之后智能体文件的规范形式 {{help-agent docker-agent debug config}} | `debug` 组的标志 | 无 | [§5.2](#s-agents-models-and-providers) |
| `debug oauth list\|login\|remove` | 列出已存的 OAuth token、登录远程 MCP 服务器，或删除一个 token {{help-agent docker-agent debug oauth}} | `--json`（list） | `login` 需要浏览器 | [§5.3](#s-toolsets-and-mcps) |
| `debug skills <agent-file>` | 显示智能体发现的 skill {{help-agent docker-agent debug skills}} | `--json` | 无 | [§4.5](#s-sbx-skills-add-and-skills-true) |
| `debug title <agent-file> <question>` | 从问题生成会话标题 {{help-agent docker-agent debug title}} | `--model` | 一个模型 | [§5.6](#s-session-db-sessions-diff-and-eval) |
| `debug tool <agent-file> <tool-name> [parameters-json]` | 直接调用一个工具，有真实副作用，没有模型回合 {{help-agent docker-agent debug tool}} | `-a, --agent`、`--json`、`--no-hook` | 该工具需要的任何东西 | [§5.3](#s-toolsets-and-mcps) |
| `debug toolsets <agent-file>` | 列出智能体的工具和参数 schema {{help-agent docker-agent debug toolsets}} | `--json` | 无 | [§5.3](#s-toolsets-and-mcps) |
| `eval <agent-file> [<eval-dir>]` | 在容器中回放已保存的会话并打分 {{help-agent docker-agent eval}} | `-c, --concurrency`（默认 `10`）、`--judge-model`（默认 `openai/gpt-5.6-terra`）、`--judge-type llm\|evaluator`（默认 `llm`）、`--agent-image`（默认钉住的 `docker/docker-agent:<version>`）、`--base-image`、`--container-runtime`（默认 `docker`）、`-e, --env`、`--keep-containers`、`--only`、`--output`（默认 `<eval-dir>/results`）、`--repeat`（默认 `1`）、`--baseline`、`--regression-tolerance`（[冲突 C65](#s-ref-sources-and-the-conflicts-register)） | 容器运行时和 judge 模型 | [§5.6](#s-session-db-sessions-diff-and-eval) |
| `new [description]` | 从描述写出一份新的智能体文件 {{help-agent docker-agent new}} | `--model`（anthropic、openai、google、dmr 或自定义提供方，[冲突 C66](#s-ref-sources-and-the-conflicts-register)）、`--max-iterations`（DMR 默认 20，别处不限） | 一个模型 | [§5.1](#s-docker-agent-run-new-and-doctor) |
| `plans create\|delete\|export\|get\|list\|status\|update` | 从主机编辑 `plan` toolset 的共享 plan，带乐观锁 {{help-agent docker-agent plans}} | `--file`（`-` 是 stdin）、`--title`、`--author`、`--status`、`--expected-version`（冲突时退出码 3）、`--force`、`--output`、`--json` | 无 | [sub_agents、transfer_task 与 background_agents](#s-sub-agents-transfer-task-and-background-agents) |
| `sandbox allow <host>...` | 把主机加到之后每一次 `--sandbox` 运行的持久允许列表 {{help-agent docker-agent sandbox allow}} | 无 | 无 | [§1.2](#s-docker-agent-run-sandbox-end-to-end) |
| `sandbox deny\|remove\|rm <host>`, `sandbox list\|ls` | 移除一个主机，或列出允许列表 {{help-agent docker-agent sandbox}} | 无 | 无 | [§1.2](#s-docker-agent-run-sandbox-end-to-end) |
| `serve a2a\|acp\|api\|chat\|mcp` | 把智能体作为服务器启动 {{help-agent docker-agent serve}} | 见下表 | 一个模型 | [§6.1](#s-serve-api-and-serve-chat) 到 [§6.3](#s-serve-a2a) |
| `sessions diff <session-a> <session-b>` | 报告两次已记录会话第一次工具调用分叉的位置 {{help-agent docker-agent sessions diff}} | `--json`、`--fail-on-divergence`、`-s, --session-db` | 无 | [§5.6](#s-session-db-sessions-diff-and-eval) |

`debug` 组共享一套标志：`--code-mode-tools`、`--env-from-file`、`--flavor`、六个 `--hook-*` 标志、`--mcp-oauth-redirect-uri`、`--models-gateway` 和 `--working-dir` {{help-agent docker-agent debug}}。同样的标志出现在 `eval`、`new` 和每一个 `serve` 子命令上。

## serve 子命令 {#s-ref-docker-agent-commands-the-serve-subcommands}

| 子命令 | 传输 | 默认监听地址 | 会话数据库 | 认证与安全标志 | 章节 |
|---|---|---|---|---|---|
| `serve a2a <agent-file>` | HTTP，Agent-to-Agent 协议 {{help-agent docker-agent serve a2a}} | `127.0.0.1:8082` | `<data-dir>/session.db` | `--auth-token`、`--insecure-no-auth`、`--cors-origin`、`--safety`、`-a`（团队的第一个智能体，[冲突 C64](#s-ref-sources-and-the-conflicts-register)） | [§6.3](#s-serve-a2a) |
| `serve acp <agent-file>` | stdio，Agent Client Protocol {{help-agent docker-agent serve acp}} | 无 | `<data-dir>/session.db` | 无 | [§6.2](#s-serve-mcp-and-serve-acp) |
| `serve api <agent-file>\|<agents-dir>` | HTTP，会话和 SSE {{help-agent docker-agent serve api}} | `127.0.0.1:8080` | 当前目录中的 `session.db`（[冲突 C63](#s-ref-sources-and-the-conflicts-register)） | `--auth-token`（空则关闭认证）、`--max-request-size`（默认 `1048576`）、`--session-workingdir-root`、`--pull-interval`（0 关闭）、`--fake`、`--record` | [§6.1](#s-serve-api-and-serve-chat) |
| `serve chat <agent-file>` | HTTP，`/v1/chat/completions` 和 `/v1/models` {{help-agent docker-agent serve chat}} | `127.0.0.1:8083` | 无标志 | `--api-key`、`--api-key-env`、`--insecure-no-auth`、`--cors-origin`、`--safety`、`--conversations-max`、`--conversation-ttl`（默认 `30m0s`）、`--request-timeout`（默认 `5m0s`）、`--max-idle-runtimes`（默认 `4`）、`--max-request-size`、`-a`（未设置时为全部智能体） | [§6.1](#s-serve-api-and-serve-chat) |
| `serve mcp <agent-file>` | 默认 stdio，带 `--http` 时为流式 HTTP {{help-agent docker-agent serve mcp}} | 带 `--http` 时为 `127.0.0.1:8081` | 无标志 | `--auth-token`、`--insecure-no-auth`，以及仅在 `--http` 时的 `--safety`、`--attach [latest]` 以暴露正在运行的 TUI、`--tool-name`、`--mcp-keepalive`（仅 stdio）、`-a`（未设置时为全部智能体） | [§6.2](#s-serve-mcp-and-serve-acp) |

帮助文本在 `serve a2a`、`serve chat` 和 `serve mcp --http` 上点名四种安全模式，并且没有给出它们的默认值。因此每个服务器内部的默认值在帮助中没有记录。

## 附加命令 {#s-ref-docker-agent-commands-additional-commands}

| 命令 | 用途 | 关键标志 | 需要 | 章节 |
|---|---|---|---|---|
| `completion` | 为 shell 生成自动补全脚本 {{help-agent docker-agent}} | 它的页面不在纳入仓库的帮助树中 | 无 | 无 |
| `help` | 关于任意命令的帮助 {{help-agent docker-agent}} | 它的页面不在纳入仓库的帮助树中 | 无 | 无 |
| `version` | 打印版本和 commit hash {{help-agent docker-agent version}} | 无 | 无 | [§1.1](#s-sbx-and-docker-agent) |

在 capture 机器上，`docker-agent version` 打印了 `v1.149.0` 和 `Commit: Homebrew`（[我们的来源记录（英文原文）](manuals/docker-sandboxes-101/research/sources/probes/docker-agent-version.txt)）。

Sources: research/sources/help-docker-agent.md (every `docker-agent` help page, docker-agent v1.149.0, Commit: Homebrew); research/sources/docs-docker-agent.md (page features/cli for `getting-started`, `--config-dir`, and `--data-dir`); research/sources/probes/docker-agent-version.txt, docker-agent-toolsets.txt; research/conflicts-register.md rows C48, C59, C60, C63, C64, C65, C66, C68, C75; manual.json (section files and ids)
