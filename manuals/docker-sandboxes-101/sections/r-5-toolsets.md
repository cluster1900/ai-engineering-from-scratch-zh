# Toolsets

> docker-agent 1.149.0 的 27 种 toolset 类型，每种列出它暴露的工具、选项，以及智能体文件之外它需要什么。

`docker-agent toolsets` 在 2026-10-08 打印了 27 种类型（[我们的来源记录（英文原文）](manuals/docker-sandboxes-101/research/sources/probes/docker-agent-toolsets.txt)），schema 的 `type` 枚举持有同样的 27 个名字 {{schema Toolset}}。工具列来自 `tools/` 下每种类型的文档页，「没有文档」标记没有页面的类型。选项是该类型会读取的 [R.4](#s-ref-agent-file-keys) 的键，默认值按文档所述。「需要」列说明 toolset 在智能体文件之外会接触什么：无、主机 shell、网络、凭据、二进制或 Docker。共享键 `instruction`、`tools`、`readonly`、`model`、`defer` 和 `toon` 适用于每种类型，不再重复 {{docs-agent Tool Configuration}}。

## 27 种类型 {#s-ref-toolsets-the-27-types}

| 类型 | 工具 | 选项 | 需要 |
|---|---|---|---|
| `a2a` | 每个远程智能体一个工具，按 `name` 命名或取自 agent card {{docs-agent A2A Tool}} | `url`（required）、`name`、`headers`、`allow_private_ips` | 网络和远程 A2A 服务器。服务器以 `--auth-token` 启动时，`headers` 中要有 token |
| `api` | 每个 `api_config` 一个工具，按 `api_config.name` 命名 {{docs-agent API Tool}} | `api_config` 带 `name`、`endpoint`、`method`（文档中是 `GET` 或 `POST`，schema 中有五个动词）、`instruction`、`args`、`required`、`headers`、`output_schema`。`timeout`（`30`）、`allow_private_ips` | 网络。通过 `${env.VAR}` 把 token 放进 `headers` |
| `background_agents` | `run_background_agent`、`list_background_agents`、`view_background_agent`、`stop_background_agent` {{docs-agent Background Agents Tool}} | 无 | `sub_agents` 下列出的智能体 |
| `background_jobs` | `run_background_job`、`list_background_jobs`、`view_background_job`、`stop_background_job`、`wait_background_job`（`timeout` 默认 `60`） {{docs-agent Background Jobs Tool}} | `env`、`recall`（`false`） | 主机 shell |
| `environment` | 没有文档。probe 摘要说它报告 OS 和解析后的 shell，只读，没有参数 | 没有文档记录 | 无 |
| `fetch` | `fetch` 带 `urls`、`format`（`text`、`markdown`、`html`）、`timeout`（`1` 到 `300`） {{docs-agent Fetch Tool}} | `timeout`（`30`）、`allowed_domains`、`blocked_domains`、`allow_private_ips`（`false`）、`headers`、`escape_html`（`false`） | 网络。只做 `GET`。默认拒绝非公开地址 |
| `file` | 没有文档。probe 摘要说它读、写和编辑单个文件 | `post_edit`、`allow_list`、`deny_list`，schema 为 `filesystem` 和 `file` 点名这些键 | 无 |
| `filesystem` | `read_file`、`read_multiple_files`、`write_file`、`edit_file`、`list_directory`、`directory_tree`、`create_directory`、`remove_directory`、`search_files_content` {{docs-agent Filesystem Tool}} | `ignore_vcs`（`true`）、`post_edit`（`path`、`cmd`）、`allow_list`、`deny_list` | 无 |
| `git` | `git_status`、`git_log`（`limit` 默认 `20`，`path`）、`git_branches`、`git_show`（`ref`）、`git_blame`（`path` required，`rev`） {{docs-agent Git Tool}} | 无 | 无。它使用 go-git，不需要 `git` 二进制 |
| `lsp` | `lsp_workspace`、`lsp_hover`、`lsp_definition`、`lsp_references`、`lsp_document_symbols`、`lsp_workspace_symbols`、`lsp_diagnostics`、`lsp_code_actions`、`lsp_rename`、`lsp_format`、`lsp_call_hierarchy`、`lsp_type_hierarchy`、`lsp_implementations`、`lsp_signature_help`、`lsp_inlay_hints` {{docs-agent LSP Tool}} | `command`（required）、`args`、`env`、`file_types`、`working_dir`、`version`、`lifecycle` | 语言服务器二进制，缺失时从 aqua registry 安装 |
| `mcp` | 服务器列出的工具，由 `tools` 过滤 {{docs-agent MCP Tool}} | `ref`（`docker:<name>` 或一个 `mcps` 名），或 `command`、`args`、`env`、`version`、`working_dir`，或带 `url`、`transport_type`（`streamable` 或 `sse`）、`headers`、`oauth` 的 `remote`。`config`、`lifecycle`、`allow_private_ips` | `ref: docker:` 需要 MCP Gateway 和 Docker。`command` 需要二进制。`remote` 需要网络，服务器要求时还要 OAuth 登录 |
| `mcp_catalog` | `search_remote_mcp_servers`、`enable_remote_mcp_server`、`list_remote_mcp_servers`、`disable_remote_mcp_server`、`reset_remote_mcp_server_auth` {{docs-agent MCP Catalog Tool}} | `allowed_servers`、`blocked_servers` | 网络。要求 OAuth 的服务器需要 OAuth。没有 gateway，因为 catalog 子集只有 streamable HTTP |
| `memory` | `add_memory`、`get_memories`、`delete_memory`、`search_memories`、`update_memory` {{docs-agent Memory Tool}} | `path`（`~/.cagent/memory/<config-name>/memory.db`） | 磁盘上的 SQLite 文件 |
| `model_picker` | `change_model`（`model` required）、`revert_model` {{docs-agent Model Picker Tool}} | `models`（required） | 所列模型的凭据 |
| `open_url` | 一个工具，默认名为 `open_url` {{docs-agent Open URL Tool}} | `url`（required）、`name` | 主机上的浏览器，通过 `open`、`xdg-open` 或 `rundll32` |
| `openapi` | 文档的每个 operation 一个工具 {{docs-agent OpenAPI Tool}} | `url`（required）、`headers`、`timeout`（`30`）、`max_output_bytes`（`30000`）、`allow_private_ips` | 网络，用于文档和每次调用 |
| `plan` | `write_plan`、`read_plan`、`list_plans`、`delete_plan`、`update_plan_from_file`、`export_plan_to_file`、`set_plan_status`、`get_plan_status` {{docs-agent Plan Tool}} | 无 | `~/.cagent/plans/` 下的存储，每个带此类型的智能体共享 |
| `rag` | `rag_config.tool` 中命名的一个搜索工具 {{docs-agent RAG Tool}} | `rag_config` 带 `docs`、`strategies`（`chunked-embeddings`、`semantic-embeddings`、`bm25`）、`results`、`respect_vcs`（`true`）、`indexing_timeout` | 一个 embedding 模型，因此需要 provider 凭据或 Docker Model Runner，以及每个 strategy 一个 SQLite 数据库 |
| `scheduler` | `create_schedule`（`prompt`、`when` required，`name`）、`list_schedules`、`cancel_schedule`（`id` required） {{docs-agent Scheduler Tool}} | 无 | 支持 recall 的正在运行的 session。schedule 不会持久化 |
| `script` | `shell` 下每个条目一个工具，按键名命名 {{docs-agent Script Tool}} | `shell.<name>.cmd`、`description`、`args`、`required`、`env`、`working_dir` | 主机 shell |
| `session_context` | `list_sessions`、`read_session` {{docs-agent Session Context Tool}} | 无 | session 数据库 |
| `shell` | `shell` 带 `cmd`（required）、`cwd`（`.`）、`timeout`（`30`） {{docs-agent Shell Tool}} | `env`、`sudo_askpass`（`false`）、`safer`（已弃用且被忽略） | 主机 shell。每条命令在批准前被分类为 `safe`、`destructive` 或 `unknown` |
| `tasks` | `create_task`、`get_task`、`update_task`、`delete_task`、`list_tasks`、`next_task`、`add_dependency`、`remove_dependency` {{docs-agent Tasks Tool}} | `path`（`tasks.json`） | 磁盘上的 JSON 文件 |
| `think` | 一个推理工具。该页没有点名工具 {{docs-agent Think Tool}} | schema 中的 `shared` | 无。没有副作用 |
| `todo` | `create_todo`、`create_todos`、`update_todos`、`list_todos` {{docs-agent Todo Tool}} | `shared`（`false`） | 无 |
| `user_prompt` | `user_prompt` 带 `message`（required）、`title`、`schema` {{docs-agent User Prompt Tool}} | 无 | 一个 elicitation 处理器，TUI 和 CLI 提供它，有些 MCP 客户端不提供 |
| `webhook` | `send_webhook` 带 `message` {{docs-agent Webhook Tool}} | `webhook_config` 带 `url`（required）、`provider`（默认 `generic`，或 `slack`、`discord`、`ifttt`、`telegram`、`mattermost`、`rocketchat`、`googlechat`、`teams`）、`headers`、`chat_id` | 网络。在 Slack 和 Mattermost 上，URL 本身就是凭据 |

## 不是类型的名字 {#s-ref-toolsets-names-that-are-not-types}

有两个工具不需要 `toolsets` 条目就能到来。`sub_agents` 注入 `transfer_task`，`handoffs` 注入同名工具（[冲突 C56](#s-ref-sources-and-the-conflicts-register)）。文档的内置表把两者都列为类型，schema 枚举和 probe 都排除它们。

| 名字 | 工具 | 由谁注入 | 需要 |
|---|---|---|---|
| `transfer_task` | `transfer_task` 带 `agent`、`task`、`expected_output`（全部 required），始终自动批准 {{docs-agent Transfer Task Tool}} | 调用方上的 `sub_agents` | 被点名的子智能体 |
| `handoffs` 的工具 | 一个带 `agent`（required）的工具，把对话转到本地智能体，不打开网络连接 {{docs-agent Handoff Tool}} | 调用方上的 `handoffs` | 同一文件中被点名的智能体 |
| `session_plan` | `write_session_plan`、`read_session_plan`、`exit_plan_mode` {{docs-agent Session Plan Tool}} | 文档把它列为内置类型。v1.149.0 的枚举和 probe 都不点名它，所以锁定的二进制不接受它作为 `type` | `~/.cagent/session_plans/` 下每个 session 一个文件 |

文档把 `session_plan` 点名为一种类型，schema 点名的 27 种类型里没有它。本手册中 schema 的等级高于文档，所以手册把 `session_plan` 视为在锁定版本上不可用。

Sources: research/sources/probes/docker-agent-toolsets.txt; research/sources/agent-schema.json (`Toolset`, `MCPToolset`, `Remote`, `ApiConfig`, `WebhookConfig`, `RAGConfig`, `ScriptShellToolConfig`, `PostEditConfig`, `Lifecycle`); research/sources/docs-docker-agent.md (page configuration/tools and the 28 pages under tools/: a2a, api, background-agents, background-jobs, fetch, filesystem, git, handoff, lsp, mcp-catalog, mcp, memory, model-picker, open-url, openapi, plan, rag, scheduler, script, session_context, session_plan, shell, tasks, think, todo, transfer-task, user-prompt, webhook); research/conflicts-register.md row C56
