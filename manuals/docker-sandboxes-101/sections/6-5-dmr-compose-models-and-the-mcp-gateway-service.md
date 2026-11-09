# DMR、Compose 的 models 与 docker/mcp-gateway 服务

> 本地模型是 12434 端口上未认证的 OpenAI 兼容端点，Compose 把它作为两个变量绑定到服务，四个名叫 gateway 的东西要分清。

第 5 部分和本部分的每次模型调用都没有 API 密钥，也没有云账号。模型是 Docker Model Runner 上的 `ai/qwen3:4b`，和智能体在同一台 Mac 上。

读完本节后，你能从主机、容器和沙箱访问 runner，并把它交给 Compose 服务。

## 12434 端口上的 Docker Model Runner {#s-dmr-compose-models-and-the-mcp-gateway-service-docker-model-runner-on-port-12434}

**Docker Model Runner (DMR)：** 从 Docker Hub、OCI 仓库或 Hugging Face 拉取模型的 Docker 组件 {{docs-dmr Docker Model Runner}}。它通过 OpenAI、Anthropic 和 Ollama 兼容 API 提供这些模型 {{docs-dmr DMR REST API}}。自 Desktop 4.71.0 起，Docker Model Runner 默认关闭，你在 Settings 里打开它 {{docs-desktop 4.71.0}}。`docker desktop enable model-runner --tcp <port>` 打开主机 TCP {{docs-dmr DMR REST API}}，这次 capture 用的是 12434 端口。

```listing
title: docker model status --json 所报告的 runner
source: capture/out/25-model-status.json
lang: json
note: 其他 backend 已删节。
---
{
  "running": true,
  "backends": {
…
    "llama.cpp": "Running: llama.cpp b9879-metal (sha256:<digest>) 72874f5",
…
  },
  "kind": "Docker Desktop",
  "endpoint": "http://model-runner.docker.internal/v1/",
  "endpointHost": "http://localhost/exp/vDD4.40/v1/"
}
```

Model Runner API 没有认证 {{docs-dmr Docker Model Runner}}。任何能到达该端口的客户端都可以拉取、加载和运行模型。base URL 取决于调用方运行在哪里，[图](#fig-6-5)画出了本手册遇到的五个：

| 调用方 | Base URL | 证据 |
|---|---|---|
| 主机上的进程 | `http://localhost:12434` | [capture](manuals/docker-sandboxes-101/capture/out/25-models.json) |
| Docker Desktop 上的容器 | `http://model-runner.docker.internal` | [capture](manuals/docker-sandboxes-101/capture/out/26-compose-up.txt) |
| Docker Engine 上的容器 | `http://172.17.0.1:12434` | {{docs-dmr DMR REST API}}，未 capture |
| 主机上的进程，经 Docker socket | `http://localhost/exp/vDD4.40` | [capture](manuals/docker-sandboxes-101/capture/out/25-model-status.json)，`endpointHost` |
| 沙箱内的 `docker-agent`，经其代理 | `http://host.docker.internal:12434` | [capture](manuals/docker-sandboxes-101/capture/out/27-inside-run.txt) |

base URL 之后是路径前缀和完整端点。OpenAI 路径在 `/engines/v1/` 下，`/engines/llama.cpp/v1/` 点名引擎 {{docs-dmr DMR REST API}}。Anthropic 表列出 `/anthropic/v1/messages`，而其示例调用 `/v1/messages`（[冲突 C79](#s-ref-sources-and-the-conflicts-register)）。两条路径都没有 capture 测试过。Ollama 客户端使用 `/api/`。这次 capture 还遇到了 `/v1/` 根路径，`status` 把它报告为 `endpoint`。

```figure
id: fig-6-5
kind: structure
title: 同一个 Docker Model Runner 的五个 base URL
claim: 五个调用方通过五个 base URL 到达同一个 runner，其后的每条路径对任何到达该端口的客户端都开放.
caption: 每行从左到右读，从调用方到 runner。虚线调用方来自文档，没有 capture。右侧路径跟在任意 base URL 之后。 From capture/out/25-model-status.json, 25-models.json, 26-compose-up.txt, capture/fixtures/agents/files-sandbox.yaml, and research/sources/docs-model-runner.md.
```

8B 的 tag `ai/qwen3:latest` 在录制用的 Mac 上拉取失败，如 [docker-agent run、new 和 doctor](#s-docker-agent-run-new-and-doctor) 所解释（[这次 capture](manuals/docker-sandboxes-101/capture/out/25-model-pull-latest.txt)）。只拉取了 4B 的 tag 时，`doctor` 把 `auto` 解析为 `dmr/docker.io/ai/qwen3:4b`（[这次 capture](manuals/docker-sandboxes-101/capture/out/25-doctor.txt)）。默认情况下，Model Runner 在几分钟后卸载空闲模型 {{docs-agent Docker Model Runner}}，`provider_opts.keep_alive` 会改变这段时间。`provider_opts.context_size` 通过 runner 的 `_configure` 端点设置上下文窗口 {{docs-agent Docker Model Runner}}。没有 capture 运行过 `docker model configure`，所以 [冲突 C77](#s-ref-sources-and-the-conflicts-register) 仍未解决。

智能体文件也可以在 `providers:` 块中点名 runner。`fixtures/agents/dmr.yaml` 设置 `base_url: http://localhost:12434/engines/llama.cpp/v1`，它的运行回答了 `Hello`（[这次 capture](manuals/docker-sandboxes-101/capture/out/25-run-dmr.txt)）。显式的 `base_url` 会绕过 `--record` 代理，所以那次运行在每次 capture 上都是真实调用（[这次 capture](manuals/docker-sandboxes-101/capture/README.md)）。

## Compose 的 models {#s-dmr-compose-models-and-the-mcp-gateway-service-compose-models}

```listing
title: 这次 capture 的 Compose 文件
source: capture/fixtures/compose/compose.yaml
lang: yaml
note: printer 的 command 已删节。
---
name: m101

models:
  llm:
    model: ai/qwen3:4b

services:
  mcp-gateway:
    image: docker/mcp-gateway
    use_api_socket: true
    command: ["--transport=streaming", "--port=8811"]

  printer:
    image: alpine:3.22
    depends_on: [mcp-gateway]
    models:
      llm:
        endpoint_var: LLM_URL
        model_var: LLM_MODEL
…
```

**models：** 顶层 Compose 元素，声明一个模型，服务按名字绑定它。简写语法从名字 `llm` 派生 `LLM_URL` 和 `LLM_MODEL`，`endpoint_var` 和 `model_var` 选择这些名字。需要 Compose v2.38 或更高版本（[我们的来源记录（英文原文）](manuals/docker-sandboxes-101/research/sources/docs-compose-models.md)）。`docker compose up` 在启动容器之前拉取并配置了模型：

```listing
title: 模型步骤以及 printer 看到的内容
source: capture/out/26-compose-up.txt
lang: text
note: 容器步骤、gateway 日志和退出行已删节。
---
 llm Pulling
 llm Pulled
 llm Configuring
 llm Configured
…
printer-1 | LLM_MODEL=ai/qwen3:4b
printer-1 | LLM_URL=http://model-runner.docker.internal/v1/
printer-1 | {"object":"list","data":[{"id":"docker.io/ai/qwen3:4b","object":"model","created":0,"owned_by":"docker","dmr":{}}]}
printer-1 | wget: server returned error: HTTP/1.1 401 Unauthorized
```

Compose 注入的是 `/v1/` 根路径，而从 model-runner 源码读出的计划预期的是 `/engines/v1/`。`GET ${LLM_URL}models` 从容器内部照样得到了回答。Compose 不能启动沙箱（[冲突 C96](#s-ref-sources-and-the-conflicts-register)），也没有 capture 在沙箱内的私有引擎上运行过 `models:`（[冲突 C95](#s-ref-sources-and-the-conflicts-register)）。

## docker/mcp-gateway 服务 {#s-dmr-compose-models-and-the-mcp-gateway-service-the-docker-mcp-gateway-service}

`mcp-gateway` 服务用主机的 Docker API socket 运行开源 MCP gateway，以便把 MCP 服务器作为容器启动。在这次 capture 中，它没有找到 profile 也没有找到服务器，列出了 0 个工具，并加上了自己的管理工具，例如 `mcp-find` 和 `mcp-add`。它打印了 `Gateway URL: http://localhost:8811/mcp` 和一个 bearer token，`printer` 不带该 token 的请求得到了 401（[这次 capture](manuals/docker-sandboxes-101/capture/out/26-compose-up.txt)）。[图](#fig-6-6)画出了这套栈。

```figure
id: fig-6-6
kind: flow
title: 这次 capture 的 compose.yaml，带一个模型和一个 gateway
claim: Compose 拉取模型，向 printer 注入两个变量，并用 API socket 运行 gateway，后者拒绝没有其 bearer token 的请求.
caption: 从左上角的 models 元素读起。实心墨色箭头是调用，虚线玫瑰色箭头是被拒绝的请求。 From capture/fixtures/compose/compose.yaml and capture/out/26-compose-config.txt and 26-compose-up.txt.
```

## 四个名叫 gateway 的东西 {#s-dmr-compose-models-and-the-mcp-gateway-service-four-things-named-gateway}

| 本手册中的名称 | 它是什么 | capture 中的地址 |
|---|---|---|
| models gateway | `--models-gateway` 或 `DOCKER_AGENT_MODELS_GATEWAY` 设置的地址，把所有 provider 流量送到一个 models gateway URL {{docs-agent A2A Protocol}} | `http://localhost:12434/engines`，`--record` 配合 `dmr` 需要它（[这次 capture](manuals/docker-sandboxes-101/capture/README.md)） |
| sbx MCP gateway | 每个沙箱一个主机侧 gateway，由 `sbx mcp` 建立，与 MCP Toolkit 分开 {{docs-sbx MCP gateway}} | VM 内的 `http://mcp-gateway.docker.internal/mcp` |
| MCP gateway 服务 | `docker mcp gateway run` 或 `docker/mcp-gateway` 镜像，录制主机上是 mcp v0.44.1 | 服务内的 `http://localhost:8811/mcp` |
| 托管 MCP gateway | Docker AI Governance 的 gateway，"an invite-only feature" {{docs-mcp MCP Gateway}} | 未 capture |

Toolkit gateway 在各自的容器中运行每个 MCP 服务器。每个 MCP 工具容器的上限是 2 GB {{docs-mcp MCP Toolkit}}，每个得到 1 个 CPU。带 `ref: docker:<name>` 的 docker-agent toolset 走这条路，把 MCP 服务器作为 MCP Gateway 后面的 Docker 容器运行 {{docs-agent MCP Tool}}。sbx MCP gateway 见 [sbx mcp add、sbx mcp load 和 --static-mcp](#s-sbx-mcp-add-load-and-static-mcp)，[MCP gateway 一课](phases/13-tools-and-protocols/17-mcp-gateways-and-registries) 讲解这个模式。

```takeaways
- 主机上的智能体调用 `dmr` 之前，先为 Docker Model Runner 打开主机 TCP。
- 不要把 12434 端口放到你不信任的网络上，因为 runner 不检查凭据。
- 在服务内部读 `LLM_URL`，不要用手写的路径。
- 说清你指的是哪个 gateway：models、sbx MCP、MCP 服务，还是托管的。
```

Sources: docs-dmr Docker Model Runner, DMR REST API, Get started (research/sources/docs-model-runner.md); docs-desktop 4.71.0 (research/sources/docs-desktop-release-notes.md); docs-agent Docker Model Runner, A2A Protocol, MCP Tool (research/sources/docs-docker-agent.md); docs-mcp MCP Gateway, MCP Toolkit (research/sources/docs-mcp.md); docs-sbx MCP gateway (research/sources/docs-sandboxes.md); research/sources/docs-compose-models.md; research/sources/mcp-gateway-README.md; research/conflicts-register.md rows C77, C79, C82, C84, C88, C91, C94, C95, C96; research/plan.md, Part 6; capture/README.md; capture/fixtures/agents/dmr.yaml, files-sandbox.yaml; capture/fixtures/compose/compose.yaml; capture/out/25-model-status.json, 25-models.json, 25-model-ls.txt, 25-model-pull-latest.txt, 25-doctor.txt, 25-run-dmr.txt, 26-compose-config.txt, 26-compose-up.txt, 26-compose-down.txt, 27-inside-run.txt, 11-static-inside.txt
