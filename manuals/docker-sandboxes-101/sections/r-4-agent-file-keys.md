# 智能体文件的键

> schema 第 16 版智能体文件的每个键，按块分组，以及它的类型、默认值、是否必需，和来自 v1.149.0 的 `agent-schema.json` 的含义。

该 schema 标题为 Docker Agent Configuration，锁定的副本是 tag v1.149.0、commit bf4169cdd31229d52385410c52c3dcc59b497858 处的文件 {{schema Docker Agent Configuration}}。它的 `version` 枚举从 `"0"` 到 `"16"`，所以 `"16"` 是当前形式 {{schema version}}。顶层及其下每个块都把 `additionalProperties` 设为 `false`，因此未知键会导致加载失败。唯一必需的顶层键是 `agents` {{schema agents}}。必需一列表示 schema 是否把该键列在 `required` 下。默认值是 schema 的 `default` 值，「无」表示 schema 未给出。

## 顶层键 {#s-ref-agent-file-keys-top-level-keys}

全部 16 个键来自根 `properties` 对象 {{schema properties}}。文档页 `configuration/overview` 讲解可复用块 `mcps`、`rag`、`commands`、`skills` 和 `toolsets`。

| 键 | 类型 | 默认值 | 必需 | 含义 |
|---|---|---|---|---|
| `version` | 字符串，`"0"` 到 `"16"` | 无 | 否 | 配置版本 |
| `providers` | ProviderConfig 的映射 | 无 | 否 | 可复用的提供方默认值：`base_url`、`token_key`、`api_type` |
| `agents` | AgentConfig 的映射 | 无 | 是 | 各智能体。至少需要一个 |
| `models` | ModelConfig 的映射 | 无 | 否 | 具名的模型配置 |
| `mcps` | MCPToolset 的映射 | 无 | 否 | 可复用的 MCP 服务器定义，由 toolset 按名称引用 |
| `rag` | RAGToolset 的映射 | 无 | 否 | 可复用的 RAG 源定义 |
| `commands` | Commands 的映射 | 无 | 否 | 具名的命令组，与 `use_commands` 合并 |
| `skills` | SkillsConfig 的映射 | 无 | 否 | 具名的 skill 组，与 `use_skills` 合并 |
| `toolsets` | Toolset 的映射 | 无 | 否 | 具名的 toolset 定义，用 `use_toolsets` 追加 |
| `metadata` | Metadata | 无 | 否 | 作者、许可证、readme、描述、版本、标签 |
| `permissions` | PermissionsConfig | 无 | 否 | 整个文件的工具批准模式 |
| `runtime` | RuntimeDefaults | 无 | 否 | 作者想要的执行默认值。CLI 标志和用户设置优先 |
| `budget` | BudgetConfig | 无 | 否 | 一次运行的上限，其中每个子会话共享 |
| `budgets` | BudgetConfig 的映射 | 无 | 否 | 具名预算。同名智能体共享一个上限 |
| `flavors` | 对象或 null 的映射 | 无 | 否 | 用 `--flavor` 应用的具名 YAML 补丁，遵循 JSON Merge Patch 规则，`key+` 追加，`key-` 删除 |
| `evaluators` | EvaluatorConfig 的映射 | 无 | 否 | 由提供方支持的具名评估，用于 `tool_guard` 和路由 hook |

## 智能体下的键 {#s-ref-agent-file-keys-keys-under-agents}

每个智能体的每个键都来自 `AgentConfig` {{schema AgentConfig}}。文档页 `configuration/agents` 讲解它们，`configuration/structured-output` 覆盖 `structured_output`，`features/harnesses` 覆盖 `harness`。

| 键 | 类型 | 默认值 | 必需 | 含义 |
|---|---|---|---|---|
| `model` | 字符串 | 无 | 否 | 来自 `models` 的模型名或 `provider/model` |
| `fallback` | FallbackConfig：`models`（数组）、`retries`（默认 `2`）、`cooldown`（默认 `1m`） | 无 | 否 | 主模型失败时按顺序尝试的模型，带重试和冷却规则 |
| `description` | 字符串 | 无 | 否 | 智能体的描述 |
| `welcome_message` | 字符串 | 无 | 否 | 智能体启动时显示的消息 |
| `toolsets` | Toolset 数组 | 无 | 否 | 该智能体的 toolset |
| `instruction` | 字符串或字符串数组 | 无 | 否 | 系统 prompt。列表用空行连接 |
| `instruction_file` | 字符串或字符串数组 | 无 | 否 | 相对于配置文件的文件，其内容作为指令。与 `instruction` 互斥 |
| `harness` | HarnessConfig：`type`（必需，`claude-code`、`codex`、`pi`、`opencode`）、`model`、`effort`、`agent`、`thinking` | 无 | 否 | 代替模型提供方运行该智能体的外部编码 CLI |
| `code_mode_tools` | 布尔值 | 无 | 否 | 暴露一个通过 JavaScript 调用其他工具的工具 |
| `sub_agents` | 字符串数组 | 无 | 否 | 父智能体用 `transfer_task` 委派给的智能体：本地名称、OCI 引用或 `name:reference` |
| `handoffs` | 字符串数组 | 无 | 否 | 可以接收整段对话的智能体 |
| `force_handoff` | 字符串 | 无 | 否 | 最终响应后始终接收对话的智能体 |
| `routing` | AgentRouting：`allowed_agents`（必需）、`default_agent` | 无 | 否 | 路由 hook 可以选择的智能体，以及评估器不确定时使用的那个 |
| `add_date` | 布尔值 | 无 | 否 | 把日期加入上下文 |
| `add_environment_info` | 布尔值 | 无 | 否 | 把 cwd、git、OS 和 arch 加入上下文 |
| `readonly` | 布尔值 | 无 | 否 | 在每个 toolset 中只保留带只读注解的工具 |
| `safety` | `strict`、`balanced`、`restricted`、`autonomous` | 无 | 否 | 该智能体上新会话的默认安全模式，低于任何用户选择 |
| `redact_secrets` | 布尔值 | `true` | 否 | 在工具输入、模型输入和工具输出上安装 `redact_secrets` 内置 |
| `max_iterations` | 整数 | 无 | 否 | 最大循环迭代次数 |
| `budgets` | 字符串数组 | 无 | 否 | 该智能体消耗的顶层 `budgets` 名称 |
| `max_consecutive_tool_calls` | 整数 | `0`，表示 `5` | 否 | 智能体停止前连续相同的工具调用次数 |
| `max_old_tool_call_tokens` | 整数 | 无，关闭截断 | 否 | 从旧工具参数和结果中保留的 token。`-1` 关闭截断 |
| `max_tool_result_tokens` | 整数 | 无 | 否 | 每个工具结果保留的 token，从中间向外截断 |
| `num_history_items` | 整数 | 无 | 否 | 保留的历史条目 |
| `session_compaction` | 布尔值 | `true` | 否 | 在阈值处以及上下文溢出后压缩会话 |
| `compaction_threshold` | 数值 | `0.9` | 否 | 开始压缩的上下文窗口比例。模型的值优先 |
| `compaction_model` | 字符串 | 无 | 否 | 写摘要的模型。三个级别中优先级最高 |
| `add_prompt_files` | 字符串数组 | 无 | 否 | 加入上下文的 prompt 文件，例如 `AGENTS.md` |
| `add_prompt_files_depth` | 整数 | `0` | 否 | 工作区目录之下按路径列出同名文件的层数 |
| `commands` | 对象或数组 | 无 | 否 | 斜杠命令的具名 prompt |
| `structured_output` | 对象：`name`、`description`、`schema`、`strict` | 无 | 否 | 约束响应的 JSON schema，在 OpenAI 和 Gemini 上为原生 |
| `add_description_parameter` | 布尔值 | 无 | 否 | 给每次工具调用加上 `description` 参数 |
| `hooks` | HooksConfig | 无 | 否 | 该智能体的生命周期 hook |
| `cache` | CacheConfig：`enabled`（默认 `false`）、`case_sensitive`（`false`）、`trim_spaces`（`false`）、`path` | 无 | 否 | 回放对同一问题的上一次回答 |
| `skills` | 布尔值或数组 | 无 | 否 | `true` 加载每个发现的 skill。列表混合源、名称和内联 skill |
| `use_commands` | 字符串数组 | 无 | 否 | 要合并进来的顶层命令组 |
| `use_skills` | 字符串数组 | 无 | 否 | 要合并进来的顶层 skill 组 |
| `use_toolsets` | 字符串数组 | 无 | 否 | 要追加在内联项之后的顶层 toolset |

`skills` 下的内联 skill 以 `name`、`description` 和 `instructions` 为必需键，再加上 `context: fork`、`model`、`allowed_tools` 和 `toolsets` {{schema InlineSkill}}。`commands` 下的命令是字符串，或带有 `description`、`instruction`、`agent` 和 `url` 的对象 {{schema CommandConfig}}。

## 模型下的键 {#s-ref-agent-file-keys-keys-under-models}

每个键都来自 `ModelConfig` {{schema ModelConfig}}。文档页 `configuration/models` 讲解它们，`configuration/routing` 覆盖 `routing`。

| 键 | 类型 | 默认值 | 必需 | 含义 |
|---|---|---|---|---|
| `provider` | 字符串 | 无 | schema 中否，文档中是，除非设置了 `first_available` | 提供方 id，例如 `openai`、`anthropic`、`dmr` |
| `model` | 字符串 | 无 | schema 中否，文档中是 | 模型名称 |
| `description` | 字符串 | 无 | 否 | 给人看的摘要，不发送给模型 |
| `temperature` | 数值 | 无 | 否 | 采样温度 |
| `max_tokens` | 整数 | 无 | 否 | 每次响应的最大输出 token，不是上下文窗口 |
| `top_p` | 数值 | 无 | 否 | Top-p 采样 |
| `frequency_penalty` | 数值 | 无 | 否 | 频率惩罚 |
| `presence_penalty` | 数值 | 无 | 否 | 存在惩罚 |
| `base_url` | 字符串 | 无 | 否 | API 基础 URL，带 `${env.VAR}` 替换 |
| `parallel_tool_calls` | 布尔值 | 无 | 否 | 允许并行工具调用 |
| `token_key` | 字符串 | 无 | 否 | 保存令牌的环境变量 |
| `bypass_models_gateway` | 布尔值 | 无 | 否 | 即使设置了 models gateway 也直接连接提供方 |
| `provider_opts` | 对象 | 无 | 否 | 提供方选项。对于 `dmr`：`runtime_flags`、`context_size`、`keep_alive`，以及 [R.6](#s-ref-providers-and-models) 中的更多 |
| `track_usage` | 布尔值 | 无 | 否 | 跟踪用量 |
| `thinking_budget` | 字符串或整数 | 无 | 否 | 推理力度或 token 预算，形式见 [R.6](#s-ref-providers-and-models) |
| `task_budget` | 整数或对象 | 无 | 否 | 任务的总 token 预算，作为 `output_config.task_budget` 发给 Anthropic |
| `routing` | RoutingRule 数组：`model`、`examples`（两者都必需） | 无 | 否 | 根据示例短语选择模型的规则。该模型成为路由器 |
| `auth` | AuthConfig：`type`（必需，`workload_identity_federation`）、`workload_identity_federation` | 无 | 否 | 优先于提供方路径的非 API 密钥方案 |
| `first_available` | 字符串数组 | 无 | 否 | 按优先级排列的候选。使用第一个有凭据的。与其他键互斥 |
| `title_model` | 字符串 | 无 | 否 | 写会话标题的模型 |
| `compaction_model` | 字符串 | 无 | 否 | 写压缩摘要的模型 |
| `compaction_threshold` | 数值 | `0.9` | 否 | 使用该模型的智能体的压缩阈值 |
| `capabilities` | CapabilitiesConfig：`image`、`pdf`、`audio`、`video` | 无 | 否 | 附件能力，当 models.dev 目录错误或未给出时 |
| `output_capabilities` | OutputCapabilitiesConfig：`image` | 无 | 否 | 模型是否能生成图像 |
| `cost` | CostConfig：`input`、`output`、`cache_read`、`cache_write`，每百万 token 的美元价 | 无 | 否 | 覆盖目录的价格 |

## 提供方下的键 {#s-ref-agent-file-keys-keys-under-providers}

每个键都来自 `ProviderConfig` {{schema ProviderConfig}}。文档页 `providers/custom` 讲解它们。

| 键 | 类型 | 默认值 | 必需 | 含义 |
|---|---|---|---|---|
| `provider` | 字符串 | 未设置时为 `openai` | 否 | 底层类型：`openai`、`anthropic`、`google`、`amazon-bedrock`、`dmr`，或内置别名 |
| `api_type` | `openai_chatcompletions`、`openai_responses` | schema 中为 `openai_chatcompletions`，文档中依模型而定 | 否 | OpenAI 兼容提供方的 API schema |
| `base_url` | 字符串 | 无 | 否 | 端点，OpenAI 兼容提供方必需，带 `${env.VAR}` 替换 |
| `token_key` | 字符串 | 无 | 否 | 保存令牌的环境变量 |
| `unload_api` | 字符串 | 无 | 否 | 模型卸载端点的路径或 URL，由 `unload` 内置使用 |
| `temperature` | 数值 | 无 | 否 | 默认温度 |
| `max_tokens` | 整数 | 无 | 否 | 默认输出 token |
| `top_p` | 数值 | 无 | 否 | 默认 top-p |
| `frequency_penalty` | 数值 | 无 | 否 | 默认频率惩罚 |
| `presence_penalty` | 数值 | 无 | 否 | 默认存在惩罚 |
| `parallel_tool_calls` | 布尔值 | 无 | 否 | 并行工具调用的默认值 |
| `provider_opts` | 对象 | 无 | 否 | 传给客户端的提供方选项 |
| `track_usage` | 布尔值 | 无 | 否 | 默认用量跟踪 |
| `thinking_budget` | 整数或字符串 | 无 | 否 | 默认推理预算 |
| `task_budget` | 整数或对象 | 无 | 否 | 默认任务预算 |
| `auth` | AuthConfig | 无 | 否 | 非 API 密钥方案 |
| `compaction_model` | 字符串 | 无 | 否 | 默认压缩模型，三个级别中最低 |

`auth` 下的 federation 块需要 `federation_rule_id`（前缀 `fdrl_`）、`organization_id` 和 `identity_token`，并接受 `service_account_id` {{schema FederationAuthConfig}}。令牌源有 `file`、`env`、`command`、`url`、`headers` 和 `response_field` {{schema IdentityTokenSourceConfig}}。

## toolset 下的键 {#s-ref-agent-file-keys-keys-under-toolsets}

每个 toolset 条目的每个键都来自 `Toolset` {{schema Toolset}}。文档页 `configuration/tools` 讲解共享键，[R.5](#s-ref-toolsets) 说明哪种类型使用哪些。

| 键 | 类型 | 默认值 | 必需 | 含义 |
|---|---|---|---|---|
| `type` | 27 个名称之一 | 无 | schema 中否 | toolset 类型 |
| `instruction` | 字符串 | 无 | 否 | 替换内置指令，或用 `{ORIGINAL_INSTRUCTIONS}` 扩展它们 |
| `toon` | 字符串 | 无 | 否 | 逗号分隔的正则表达式，匹配 JSON 输出要重编码为 TOON 的工具 |
| `readonly` | 布尔值 | 无 | 否 | 只保留带只读注解的工具 |
| `model` | 字符串 | 无 | 否 | 处理该 toolset 结果的那一轮所用的模型 |
| `ref` | 字符串 | 无 | 否 | `docker:<name>` 或来自 `mcps` 的名称 |
| `config` | 任意 | 无 | 否 | 工具特定配置 |
| `command` | 字符串 | 无 | 否 | stdio MCP 或 LSP 服务器的命令 |
| `remote` | Remote：`url`（必需）、`transport_type`、`headers`、`oauth` | 无 | 否 | 远程 MCP 服务器 |
| `args` | 字符串数组 | 无 | 否 | 该命令的参数 |
| `tools` | 字符串数组 | 无 | 否 | 工具名称的允许列表 |
| `env` | 字符串映射 | 无 | 否 | 环境变量 |
| `shared` | 布尔值 | 无 | 否 | 在智能体之间共享工具状态，用于 `think` 和 `todo` |
| `path` | 字符串 | 无 | 否 | `memory` 或 `tasks` 的存储路径 |
| `shell` | 对象 | 无 | 否 | `script` 的脚本定义：`cmd`、`description`、`args`、`required`、`env`、`working_dir` |
| `post_edit` | PostEditConfig 数组：`path`、`cmd`（两者都必需） | 无 | 否 | `filesystem` 或 `file` 编辑后的命令 |
| `api_config` | ApiConfig：`name`、`endpoint`、`method`（必需）、`instruction`、`headers`、`args`、`required`、`output_schema` | 无 | 否 | `api` 的 HTTP 工具 |
| `webhook_config` | WebhookConfig：`url`（必需）、`provider`、`headers`、`chat_id` | 无 | 否 | `webhook` 的目的地 |
| `rag_config` | RAGConfig：`strategies`（必需）、`tool`、`docs`、`respect_vcs`（默认 `true`）、`indexing_timeout`、`results` | 无 | 否 | `rag` 的源和策略 |
| `ignore_vcs` | 布尔值 | `true` | 否 | 从文件系统操作中排除 `.git` 和 `.gitignore` 模式 |
| `allow_list` | 字符串数组 | 无 | 否 | 文件工具可以到达的目录 |
| `deny_list` | 字符串数组 | 无 | 否 | 文件工具不能到达的目录。优先于 `allow_list` |
| `defer` | 布尔值或数组 | 无 | 否 | 通过 `search_tool` 和 `add_tool` 按需加载工具 |
| `timeout` | 整数 | 省略时为 `30` | 否 | `fetch`、`api`、`openapi` 的 HTTP 超时，单位秒 |
| `max_output_bytes` | 整数 | `30000` | 否 | `openapi` 输出的文本截断。`0` 关闭它 |
| `escape_html` | 布尔值 | `false` | 否 | 多 URL `fetch` 结果中的旧版 HTML 转义 |
| `allowed_domains` | 字符串数组 | 无 | 否 | `fetch` 可以到达的主机 |
| `blocked_domains` | 字符串数组 | 无 | 否 | `fetch` 不能到达的主机。与 `allowed_domains` 互斥 |
| `allow_private_ips` | 布尔值 | 无 | 否 | 允许 `fetch`、`api`、`openapi`、`a2a` 和远程 `mcp` 使用非公网地址 |
| `sudo_askpass` | 布尔值 | 无 | 否 | 通过主机 UI 提示 sudo 密码，用于 `shell` |
| `recall` | 布尔值 | 无 | 否 | 在 `run_background_job` 上暴露 `recall` 参数 |
| `url` | 字符串 | 无 | 否 | `a2a`、`openapi` 或 `open_url` 的 URL |
| `headers` | 字符串映射 | 无 | 否 | `openapi`、`a2a` 和 `fetch` 的 HTTP 头 |
| `name` | 字符串 | 无 | 否 | `a2a` 的工具名 |
| `file_types` | 字符串数组 | 无 | 否 | `lsp` 服务器处理的扩展名 |
| `allowed_servers` | 字符串数组 | 无 | 否 | `mcp_catalog` 提供的目录服务器 id |
| `blocked_servers` | 字符串数组 | 无 | 否 | 从提供中移除的目录服务器 id |
| `models` | 字符串数组 | 无 | 否 | `model_picker` 可以选择的模型 |
| `version` | 字符串 | 无 | 否 | 用于自动安装的 `owner/repo@version`，或 `false` 关闭它 |
| `working_dir` | 字符串 | 无 | 否 | `mcp` 或 `lsp` 子进程的工作目录 |
| `lifecycle` | Lifecycle：`profile`（`resilient`、`strict`、`best-effort`）、`required`、`startup_timeout`、`call_timeout`、`restart`、`max_restarts`、`backoff` | 无 | 否 | `mcp` 或 `lsp` toolset 的监督规则 |

`mcps` 下的可复用条目有 `command`、`args`、`ref`、`remote`、`config`、`version`、`env`、`tools`、`instruction`、`name`、`defer`、`working_dir` 和 `lifecycle` {{schema MCPToolset}}。`remote` 下的 OAuth 块有 `clientId`、`clientSecret`、`callbackPort`、`scopes` 和 `callbackRedirectURL` {{schema RemoteOAuthConfig}}。

## 权限下的键 {#s-ref-agent-file-keys-keys-under-permissions}

三个键来自 `PermissionsConfig` {{schema PermissionsConfig}}，文档页 `configuration/permissions` 给出模式语法。

| 键 | 类型 | 默认值 | 必需 | 含义 |
|---|---|---|---|---|
| `allow` | 字符串数组 | 无 | 否 | 无需确认即批准的模式，例如 `read_*` 或 `shell:cmd=ls*` |
| `ask` | 字符串数组 | 无 | 否 | 即使对只读工具也始终询问的模式 |
| `deny` | 字符串数组 | 无 | 否 | 始终拒绝的模式。优先于 `allow` |

## hook 下的键 {#s-ref-agent-file-keys-keys-under-hooks}

事件来自 `HooksConfig` {{schema HooksConfig}}，文档页 `configuration/hooks` 讲解每一个。每个事件保存一个数组。匹配器事件保存带有 `matcher`、`hooks`（必需）和 `preempt_yolo` 的 `HookMatcherConfig` 条目 {{schema HookMatcherConfig}}。其他事件直接保存 hook 定义。

| 事件 | 条目 | 何时运行 |
|---|---|---|
| `prompt_file_guard` | 定义 | 在已加载的 prompt 文件被存储或使用之前。每个 hook 都必须批准 |
| `skill_content_guard` | 定义 | 在原始 skill 文本被展开之前。每个 hook 都必须批准 |
| `pre_tool_use` | 匹配器 | 工具运行之前。可以允许、拒绝或修改 |
| `post_tool_use` | 匹配器 | 工具完成后，带其响应 |
| `permission_request` | 匹配器 | 在请用户批准一次调用之前 |
| `session_start` | 定义 | 会话开始时 |
| `user_prompt_submit` | 定义 | 每条用户消息一次，在第一次模型调用之前 |
| `user_steering_messages_submit` | 定义 | 当排队的轮次中消息被追加时 |
| `user_followup_submit` | 定义 | 当跟进消息开始新一轮时 |
| `turn_start` | 定义 | 每次模型调用开始时，带瞬时上下文 |
| `turn_end` | 定义 | 一轮因任何原因结束时 |
| `before_llm_call` | 定义 | 每次模型调用即将开始时 |
| `after_llm_call` | 定义 | 每次成功的模型调用之后 |
| `session_end` | 定义 | 会话结束时 |
| `pre_compact` | 定义 | 在转录被压缩之前 |
| `subagent_stop` | 定义 | 子智能体完成时 |
| `on_user_input` | 定义 | 智能体需要用户输入时 |
| `stop` | 定义 | 模型完成响应时 |
| `notification` | 定义 | 智能体发送错误或警告时 |
| `on_error` | 定义 | 一轮遇到错误时 |
| `on_max_iterations` | 定义 | 达到 `max_iterations` 时 |
| `on_agent_switch` | 定义 | 活动智能体改变时 |
| `on_session_resume` | 定义 | 用户让运行超过 `max_iterations` 继续时 |
| `on_tool_approval_decision` | 定义 | 批准链做出决定之后，调用运行或拒绝被记录之前 |
| `before_compaction` | 定义 | 压缩即将开始时。可以否决它 |
| `after_compaction` | 定义 | 成功压缩之后 |
| `tool_response_transform` | 匹配器 | 在工具运行与其响应记录之间。可以改写输出 |
| `tool_input_transform` | 匹配器 | 每次工具调用之前，批准之前。可以打补丁改参数 |
| `tool_guard` | 匹配器 | 输入变换之后、批准之前。没有任何安全模式能绕过它 |
| `before_agent_run` | 路由定义 | 每次智能体激活一次。可以路由到另一个智能体 |
| `after_agent_complete` | 路由定义 | 智能体完成之后。可以路由到另一个智能体 |
| `worktree_create` | 定义 | 一次，在 `--worktree` 创建 worktree 之后 |

hook 定义来自 `HookDefinition` {{schema HookDefinition}}。

| 键 | 类型 | 默认值 | 必需 | 含义 |
|---|---|---|---|---|
| `type` | `command`、`builtin`、`model`、`evaluator` | 无 | 是 | 运行什么：shell 命令、具名的进程内函数、模型或评估器 |
| `command` | 字符串 | 无 | 否 | shell 命令或内置名称 |
| `args` | 字符串数组 | 无 | 否 | 处理程序的参数 |
| `name` | 字符串 | 无 | 否 | 用于日志和事件的名称 |
| `timeout` | 整数 | `60` | 否 | hook 被切断前的秒数 |
| `env` | 字符串映射 | 无 | 否 | 仅此 hook 的环境 |
| `working_dir` | 字符串 | 无 | 否 | 此 hook 的工作目录 |
| `on_error` | `warn`、`ignore`、`block` | `warn` | 否 | 错误、超时或不良输出会做什么。`pre_tool_use` 和 `tool_guard` 出错时一律拒绝 |
| `strict_output` | 布尔值 | `false` | 否 | 要求一个 JSON 对象并拒绝未知字段 |
| `model` | 字符串 | 无 | 否 | `model` hook 的 `provider/model` |
| `prompt` | 字符串 | 无 | 否 | `model` hook 渲染的 Go 模板 |
| `schema` | 字符串 | 无 | 否 | `pre_tool_use_decision` 把模型回复变成判定 |
| `system_prompt` | 字符串 | 无 | 否 | `model` hook 的字面系统消息 |
| `evaluator` | 字符串 | 无 | 否 | `evaluator` hook 的顶层评估器 |
| `evaluator_policy` | EvaluatorPolicy：`decisions`、`min_probability`、`fallback`（全部必需） | 无 | 否 | 评估器判定如何映射到守卫决定 |
| `routing_policy` | RoutingPolicy：`routes`、`min_probability`（两者都必需） | 无 | 否 | 评估器选择如何映射到智能体 |

`type` 的描述点名 17 个内置 {{schema HookDefinition}}。它们是 `add_context`、`add_date`、`add_environment_info`、`add_prompt_files`、`add_git_status`、`add_git_diff`、`add_directory_listing`、`add_user_info`、`add_recent_commits`、`max_iterations`、`redact_secrets`、`transform_json`、`limit_large_tool_results`、`safer_shell`、`http_post`、`snapshot` 和 `unload`。

## runtime、budget、metadata 和 evaluators 下的键 {#s-ref-agent-file-keys-keys-under-runtime-budget-metadata-and-evaluators}

| 块 | 键 | 类型 | 默认值 | 必需 | 含义 |
|---|---|---|---|---|---|
| `runtime` | `sandbox` | 布尔值 | 无 | 否 | 默认在沙箱中运行，与 `--sandbox` 一样 {{schema RuntimeDefaults}} |
| `runtime` | `network_allowlist` | 字符串数组 | 无 | 否 | 加入沙箱允许列表的主机，`host` 或 `host:port` |
| `runtime` | `safety` | 四种模式之一 | 无 | 否 | 文件的默认安全模式，低于每个智能体的 `safety` |
| `budget` | `max_cost` | 数值 | 无 | 否 | 每次运行的最大美元数，只计入有定价的响应 {{schema BudgetConfig}} |
| `budget` | `max_tokens` | 整数 | 无 | 否 | 整次运行的最大输入加输出 token |
| `budget` | `max_time` | 字符串 | 无 | 否 | 各轮时长之和的最大值，采用 Go duration |
| `metadata` | `author`、`license`、`readme`、`description`、`version`、`tags` | 字符串，`tags` 为数组 | 无 | 否 | 描述字段。`version` 用于 OCI 发布 {{schema Metadata}} |
| `evaluators` | `provider`、`model`、`type`、`instructions` | 字符串，`type` 为 `boolean`、`choice`、`score` 之一 | 无 | 是 | 在 `typesafe` 或 `openai` Decisions 后端上的具名评估 {{schema EvaluatorConfig}} |
| `evaluators` | `base_url`、`endpoint`、`token_key`、`bypass_models_gateway`、`choices`、`levels`、`timeout`、`cost` | 混合 | 描述中 `timeout` 为 10s | 否 | 评估器的端点、凭据和输出形状 |

文档页 `configuration/budget` 和 `configuration/flavors` 用示例讲解 `budget` 和 `flavors`。

Sources: research/sources/agent-schema.json at tag v1.149.0 (root `properties`, and the definitions `AgentConfig`, `ModelConfig`, `ProviderConfig`, `AuthConfig`, `FederationAuthConfig`, `IdentityTokenSourceConfig`, `Toolset`, `MCPToolset`, `Remote`, `RemoteOAuthConfig`, `PostEditConfig`, `ApiConfig`, `WebhookConfig`, `RAGConfig`, `Lifecycle`, `PermissionsConfig`, `HooksConfig`, `HookMatcherConfig`, `HookDefinition`, `RuntimeDefaults`, `BudgetConfig`, `Metadata`, `EvaluatorConfig`, `EvaluatorPolicy`, `AgentRouting`, `RoutingPolicy`, `RoutingRule`, `FallbackConfig`, `CacheConfig`, `CapabilitiesConfig`, `OutputCapabilitiesConfig`, `CostConfig`, `HarnessConfig`, `InlineSkill`, `CommandConfig`); research/sources/docs-docker-agent.md (pages configuration/overview, configuration/agents, configuration/models, providers/custom, configuration/tools, configuration/permissions, configuration/hooks, configuration/budget, configuration/flavors, configuration/routing); research/sources/README.md (the pin of the schema copy)
