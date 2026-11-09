# 提供商与模型

> docker-agent 1.149.0 认识的每个提供商 id、它读取的凭据、`provider/model` 引用形式、DMR 端点顺序、`auto` 规则，以及调节模型的键。

`docker-agent doctor` 在 capture 机器上打印了 20 个提供商及其凭据变量，每一个都是 `not set`（[我们的来源记录（英文原文）](manuals/docker-sandboxes-101/research/sources/probes/docker-agent-doctor.txt)）。文档点名 31 个 id，`provider` 的 schema 描述列出了内置别名 {{schema ProviderConfig}}。下表是并集，按 doctor 输出的顺序，然后按文档的顺序。doctor 打印规范 id，例如 `fireworks-ai`，旧 id 仍作为别名被接受（[冲突 C58](#s-ref-sources-and-the-conflicts-register)）。

## 提供商 id {#s-ref-providers-and-models-the-provider-ids}

| 提供商 id | 旧 id | 凭据 |
| --- | --- | --- |
| `anthropic` | 无 | `ANTHROPIC_API_KEY`，或 `auth.type: workload_identity_federation` |
| `openai` | 无 | `OPENAI_API_KEY` |
| `chatgpt` | 无 | 无。通过 `docker agent setup` 做浏览器登录，显示为 `CHATGPT_OAUTH_TOKEN` |
| `github-copilot` | 无 | `GITHUB_TOKEN` 或 `GH_TOKEN`，带 `copilot` scope 的 PAT |
| `google` | 无 | `GOOGLE_API_KEY` 或 `GEMINI_API_KEY`。Vertex AI 使用 `GOOGLE_GENAI_USE_VERTEXAI`、`GOOGLE_CLOUD_PROJECT`、`GOOGLE_CLOUD_LOCATION` |
| `mistral` | 无 | `MISTRAL_API_KEY` |
| `openrouter` | 无 | `OPENROUTER_API_KEY` |
| `baseten` | 无 | `BASETEN_API_KEY` |
| `ovhcloud` | 无 | `OVH_AI_ENDPOINTS_ACCESS_TOKEN` |
| `groq` | 无 | `GROQ_API_KEY` |
| `fireworks-ai` | `fireworks` | `FIREWORKS_API_KEY` |
| `deepseek` | 无 | `DEEPSEEK_API_KEY` |
| `cerebras` | 无 | `CEREBRAS_API_KEY` |
| `togetherai` | `together` | `TOGETHER_API_KEY` |
| `huggingface` | 无 | `HF_TOKEN` |
| `moonshotai` | `moonshot` | `MOONSHOT_API_KEY` |
| `vercel` | 无 | `AI_GATEWAY_API_KEY` |
| `amazon-bedrock` | 无 | `AWS_BEARER_TOKEN_BEDROCK`，或 AWS 凭据链，doctor 把它计为另外三个变量 |
| `opencode` | `opencode-zen` | `OPENCODE_API_KEY` |
| `opencode-go` | 无 | `OPENCODE_API_KEY` |
| `dmr` | 无 | 无。本地 Docker Model Runner |
| `ollama` | 无 | 无。可选的 `base_url` |
| `xai` | 无 | `XAI_API_KEY` |
| `nebius` | 无 | `NEBIUS_API_KEY` |
| `nvidia` | 无 | `NVIDIA_API_KEY` |
| `minimax` | 无 | `MINIMAX_API_KEY` |
| `cloudflare-workers-ai` | 无 | `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID` |
| `cloudflare-ai-gateway` | 无 | `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID` 和 `CLOUDFLARE_GATEWAY_ID` |
| `requesty` | 无 | `REQUESTY_API_KEY` |
| `azure` | 无 | `AZURE_API_KEY` 和一个 `base_url` |
| `providers` 下的名称 | 无 | `token_key` 中的变量 |

doctor 列出了文档表格不算作提供商的十一个 id，文档列出了 doctor 未打印的十个。凭据也可以来自 `~/.config/cagent/.env`、用户配置中的 `credential_helper` 命令、Docker Desktop，或 1Password 的 `op://` 引用 {{docs-agent Secrets}}。

## 模型引用 {#s-ref-providers-and-models-the-model-reference}

| 形式 | 示例 | 含义 | 来源 |
|---|---|---|---|
| `provider/model` | `dmr/ai/qwen3`，`anthropic/claude-sonnet-4-5` | 已知提供商上的内联模型 | {{docs-agent Models}} |
| `models` 中的名称 | `model: local` | 带有自己的键的命名模型 | {{docs-agent Models}} |
| `name/model` | `my_gateway/gpt-4o` | 在 `providers` 下定义的提供商上的模型 | {{docs-agent Provider Definitions}} |
| `a,b` | `anthropic/claude-sonnet-4-5,openai/gpt-5` | alloy。运行时在一次对话中在这些模型之间交替 | {{docs-agent Models}} |
| `auto` | `model: auto` | 第一个有凭据的云提供商，否则是已拉取的 DMR 模型 | {{docs-agent Set up a model}} |
| `first_available: [...]` | 一组引用 | 凭据已配置的第一个候选，在加载时解析 | {{docs-agent Models}} |
| `--model [agent=]provider/model` | `--model root=dmr/ai/qwen3` | CLI 覆盖，可按智能体重复 | {{help-agent docker-agent run}} |

## auto 规则 {#s-ref-providers-and-models-the-auto-rule}

`auto` 先选第一个配有凭据的云提供商，然后是本地已拉取的 Docker Model Runner 模型 {{docs-agent Set up a model}}。在 DMR 一侧，当 `model:` 中点名的模型已经拉取时，它优先用该模型。否则它取第一个可用的非 embedding 模型，而不是要求拉取 `ai/qwen3:latest` {{docs-agent Docker Model Runner}}。它从不选择在 `providers` 下定义的提供商 {{docs-agent Provider Definitions}}。`DOCKER_AGENT_DEFAULT_MODEL` 设置未给出模型时使用的模型 {{docs-agent User settings}}。在 capture 机器上，没有凭据且 runner 不可达时，doctor 仍打印 `auto -> dmr/ai/qwen3:latest` 并报告一个问题（[我们的来源记录（英文原文）](manuals/docker-sandboxes-101/research/sources/probes/docker-agent-doctor.txt)）。

## DMR 端点 {#s-ref-providers-and-models-the-dmr-endpoint}

| 步骤 | 端点 |
| --- | --- |
| 1 | 模型或提供商上的 `base_url`（已设置时） |
| 2 | `docker model` 插件报告的端点。doctor 通过 Desktop 上下文运行 `docker model status --json` |
| 3 | 找不到插件时的默认 `http://127.0.0.1:12434/engines/llama.cpp/v1` |
| 在容器中 | `http://model-runner.docker.internal/engines/v1`，提供商上带 `unload_api: /engines/_unload` |
| unload | 把 `base_url` 末尾的 `/v1` 换成 `_unload`，由 `on_agent_switch` 上的 `unload` builtin 调用 |

runner 不需要 API 密钥，该 API 也不做认证（[冲突 C84](#s-ref-sources-and-the-conflicts-register)）。文档只说找不到插件时使用默认 URL。上面的顺序把该默认放在第三，排在 `base_url` 和插件之后，与研究文件的读法一致。

## models gateway {#s-ref-providers-and-models-the-models-gateway}

`--models-gateway` 和 `DOCKER_AGENT_MODELS_GATEWAY` 把模型流量路由到一个地址，`bypass_models_gateway: true` 或自定义 `base_url` 把模型直接发往其提供商 {{docs-agent Model Configuration}}。`docker agent models` 先向网关请求 `/v1/models`，网关没有可用回答时再使用带凭据的提供商 {{docs-agent features/cli}}。Docker 网关需要 Docker token。Desktop 发放一个有效期 15 分钟的 token。Desktop 没有时，docker-agent 通过 HTTPS 把 `docker login` 的 access token 换成一个新的 {{docs-agent Secrets}}。该交换缓存在缓存目录下，`DOCKER_AGENT_NO_TOKEN_EXCHANGE=1` 关闭它，`docker agent debug auth` 显示正在使用的 token。

## 调节模型的键 {#s-ref-providers-and-models-keys-that-tune-a-model}

| 键 | 适用于 | 取值 | 来源 |
|---|---|---|---|
| `temperature`、`top_p`、`frequency_penalty`、`presence_penalty` | 每个提供商 | 采样参数，随每次请求发送 | {{schema ModelConfig}} |
| `max_tokens` | 每个提供商 | 每次响应的输出 token，不是上下文窗口 | {{schema ModelConfig}} |
| `thinking_budget` | OpenAI | `none`、`minimal`、`low`、`medium`、`high`、`xhigh`、`max`。`xhigh` 需要 gpt-5.2 或更新，`none` 和 `max` 需要 gpt-5.6 或更新 | {{schema ModelConfig}} |
| `thinking_budget` | Anthropic | 1024 到 32768 的整数、`adaptive`、`adaptive/<effort>`，或一个 effort 级别 | {{schema ModelConfig}} |
| `thinking_budget` | 带 Claude 的 Amazon Bedrock | 整数，或 `low`、`medium`、`high` | {{schema ModelConfig}} |
| `thinking_budget` | Gemini 2.5 | 整数，`-1` 为动态，`0` 为关闭，最多 24576 | {{schema ModelConfig}} |
| `thinking_budget` | Gemini 3 | 仅 Flash 上的 `minimal`，以及 `low`、`medium`、`high` | {{schema ModelConfig}} |
| `thinking_budget` | llama.cpp 上的 DMR | 通过 `_configure` 以 `llamacpp.reasoning-budget` 发送。在 vLLM 上作为每次请求的 `thinking_token_budget`。在 MLX 和 SGLang 上被忽略 | {{docs-agent Docker Model Runner}} |
| `task_budget` | Anthropic | 整数或 `{type: tokens, total: N}`，作为 `output_config.task_budget` 发送 | {{schema ModelConfig}} |
| `provider_opts.context_size` | DMR | 上下文窗口，通过 `_configure` 发送。`max_tokens` 从不是窗口 | {{docs-agent Docker Model Runner}} |
| `provider_opts.runtime_flags`、`raw_runtime_flags` | DMR | 推理运行时的标志，可以是列表或一个字符串。二者互斥 | {{docs-agent Docker Model Runner}} |
| `provider_opts.keep_alive` | DMR | Go duration，`0` 立即卸载，`-1` 永不卸载 | {{docs-agent Docker Model Runner}} |
| `provider_opts.mode` | DMR | `completion`、`embedding`、`reranking`、`image-generation` | {{docs-agent Docker Model Runner}} |
| `provider_opts.speculative_draft_model`、`speculative_num_tokens`、`speculative_acceptance_rate` | DMR | 用 draft 模型做 speculative decoding | {{docs-agent Docker Model Runner}} |
| `provider_opts.gpu_memory_utilization`、`hf_overrides` | vLLM 上的 DMR | 通过 `_configure` 发送的引擎设置 | {{docs-agent Docker Model Runner}} |
| `provider_opts.supports_images`、`supports_pdf` | DMR | 声明附件类型，因为 DMR 模型不在 models.dev 目录中 | {{schema ModelConfig}} |
| `provider_opts.http_headers` | 兼容 OpenAI 的提供商 | 每次请求上的 header，例如 Copilot 集成 id | {{schema ModelConfig}} |
| `fallback.models`、`retries`（`2`）、`cooldown`（`1m`） | 每个提供商 | 失败后尝试的模型，带退避 | {{schema FallbackConfig}} |
| `capabilities`、`output_capabilities`、`cost` | 每个提供商 | 附件标志、图像输出，以及覆盖目录的美元价格 | {{schema ModelConfig}} |
| `title_model`、`compaction_model`、`compaction_threshold`（`0.9`） | 每个提供商 | 用于标题和摘要的更便宜模型，以及压缩点 | {{schema ModelConfig}} |
| `providers.<name>` 默认值 | 每个提供商 | `temperature`、`max_tokens`、`thinking_budget`、`task_budget`，以及模型继承的其他默认值 | {{docs-agent Provider Definitions}} |

文档给出了每个提供商的默认 reasoning effort {{docs-agent Models}}。在 OpenAI 的 always-reasoning 模型上是 `medium`，在 Anthropic 上关闭，在 Gemini 2.5 上是 `-1`，在 Gemini 3 上依模型而定。

Sources: research/sources/probes/docker-agent-doctor.txt, docker-agent-models-list.txt; research/sources/agent-schema.json (`ModelConfig`, `ProviderConfig`, `FallbackConfig`); research/sources/docs-docker-agent.md (pages concepts/models, configuration/models, providers/overview, providers/custom, providers/dmr, getting-started/set-up-a-model, guides/secrets, configuration/user-settings, features/cli); research/sources/help-docker-agent.md (`run`, `models`, `doctor`); /Users/rohitghumare/.cache/aiefs-manuals-wip/docker-research/03-stack.md note 14; research/conflicts-register.md rows C58, C84
