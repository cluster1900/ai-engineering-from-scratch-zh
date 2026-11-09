# sbx mcp add、sbx mcp load 和 --static-mcp

> MCP 服务器在主机上注册，通过一个网关端点提供给沙箱，要么在创建时固定，要么带着 `tools/list_changed` 通知实时 load。

你想让智能体通过 MCP 服务器读文档，又不想让该服务器的令牌进入 VM。`sbx mcp` 把注册、OAuth 令牌和任何本地服务器进程留在主机上，只给沙箱一个 URL。

读完本节后，你能注册服务器、选择静态或动态模式，并把服务器 load 进正在运行的沙箱。

## 在主机上注册 {#s-sbx-mcp-add-load-and-static-mcp-register-on-the-host}

**sbx mcp add：** 按名称注册一个 MCP 服务器。`sbx` 校验该服务器，并存储其规范，供 `sbx create` 和 `sbx run` 上的 `--static-mcp` 使用 {{help-sbx sbx mcp add}}。

`--url` 接受四种形式：远程端点、社区注册表 URL、`server.json` 或 `server.yaml` manifest URL，以及 `dhi.io/` 镜像引用。其他镜像引用会被拒绝，`--local` 用 `docker run` 在主机上运行注册表 OCI 服务器 {{help-sbx sbx mcp add}}。capture 注册了一个远程服务器并列了出来：

```listing
title: 已注册的服务器及其网关
source: capture/out/11-mcp-ls.json
lang: json
---
{
  "gateway": {
    "name": "LOCAL",
    "local": true,
    "operator": "managed by you",
    "decision": "local",
    "signed_in_as": "<docker-user>"
  },
  "servers": [
    {
      "name": "m101-deepwiki",
      "transport": "remote http",
      "status": "ready",
      "type": "remote"
    }
  ]
}
```

帮助自己的注册表示例在 2026-10-08 无法解析：对 `https://registry.modelcontextprotocol.io/v0/servers/fetch-mcp/versions/latest` 的 add 以 `registry returned status 404` 失败（[capture](manuals/docker-sandboxes-101/capture/out/11-mcp-add-registry.txt)）。`--command` 是另一种输入，它在主机上以你主机用户的全部权限运行 {{help-sbx sbx mcp add}}。启动容器的本地服务器使用主机 Docker，位于[该 microVM](#s-sbx-diagnose-and-the-microvm-boundary) 的引擎边界之外 {{docs-sbx Local stdio server}}。

OAuth 元数据通过 RFC 9728 和 RFC 8414 发现，或用 `--oauth-authorization-server` 手工提供。`--client-id` 指定预注册的客户端，动态注册遵循 RFC 7591。`--scope` 按文档规定的优先级记录默认 scope，`--resource` 设置 RFC 8707 指示符，`--callback-port` 固定监听端口 {{help-sbx sbx mcp add}}。令牌留在主机上，由 `sbx mcp auth [server|--all]`、`auth status` 和 `auth rm` 管理 {{help-sbx sbx mcp auth}}。

deepwiki 服务器什么都不需要：`sbx mcp inspect` 报告 `requires_oauth: false`，`auth status --all --json` 打印了 `[]`，所以没有 capture 到 OAuth 流程。机密客户端的密钥和任何 `--header 'Name: ${placeholder}'` 值来自密钥存储，键为 `mcp:<server>:client_secret` 和 `mcp:<server>:<placeholder>`。带 header 的注册在托管网关上会被拒绝 {{help-sbx sbx mcp add}}。

## 每个沙箱一个网关 {#s-sbx-mcp-add-load-and-static-mcp-one-gateway-per-sandbox}

**MCP 网关：** 主机上的一个端点，让智能体访问已注册的 MCP 服务器 {{docs-sbx MCP gateway}}。在 `m101-mcp` 内部，环境中有 `MCP_GATEWAY_URL=http://mcp-gateway.docker.internal/mcp` 和 `MCP_SENTINEL_TOKEN_NAME=proxy-managed`（[capture](manuals/docker-sandboxes-101/capture/out/11-static-inside.txt)）。文档列出了启动时读取该 URL 的智能体：Claude Code、Codex、Devin、Gemini、Kiro 和 OpenCode {{docs-sbx Prerequisites}}。该列表中没有 Docker Agent。一个普通的 `shell` 沙箱照样用 curl 到达了网关（[capture](manuals/docker-sandboxes-101/capture/fixtures/mcp-probe.sh)）：

```listing
title: m101-mcp 内部网关的 initialize 应答
source: capture/out/11-gateway-initialize.http
lang: http
note: 三个 header 和 instructions 文本已删节。
---
HTTP/1.1 200 OK
…
Content-Type: text/event-stream
…
Mcp-Session-Id: <session>
…
event: message
id: <event-id>
data: {"jsonrpc":"2.0","id":1,"result":{"capabilities":{"logging":{},"prompts":{"listChanged":true},"resources":{"listChanged":true},"tools":{"listChanged":true}},"instructions":"### m101-deepwiki…"protocolVersion":"2025-11-25","serverInfo":{"name":"mcp-gateway-m101-mcp","version":"0.1.0"}}}
```

网关自称 `mcp-gateway-m101-mcp`，每个沙箱一个，应答协议版本 `2025-11-25`，并声明 `tools.listChanged: true`。`sbx mcp ls` 增加一列 `GATEWAY`，内容为 `LOCAL, managed by you`，JSON 中带 `signed_in_as` {{help-sbx sbx mcp ls}}。`mcp.forceLocalGateway`，默认 `false`，和 `SBX_MCP_URL=none` 在账号本来会使用托管网关时选择本地数据面 {{docs-sbx mcp.forceLocalGateway}}。

文档把它与 Desktop 产品分开：`sbx mcp` 不需要 Docker Desktop MCP Toolkit 也能工作 {{docs-sbx MCP gateway}}。网络策略不适用于主机注册的服务器，正如 Kevin Wittek 在 2026-09-04 所说 {{talk 2026-09-04 T02}}。智能体在 VM 内启动的服务器受其约束。[DMR、Compose models 和 MCP 网关服务](#s-dmr-compose-models-and-the-mcp-gateway-service)一节讲解 Toolkit 网关。

## 静态与动态 {#s-sbx-mcp-add-load-and-static-mcp-static-and-dynamic}

**静态模式：** 在 `create` 或 `run` 时的 `--static-mcp a,b` 在创建时把集合固定一次 {{help-sbx sbx create}}。静态沙箱暴露了三个 deepwiki 工具，外加 `code-mode` 和 `mcp-exec`，没有发现工具。动态沙箱一开始只有发现工具，`sbx mcp load m101-deepwiki --sandbox m101-mcp-dyn` 加上了那三个：

| 沙箱与时刻 | `tools/list` 名称 | Capture |
|---|---|---|
| `m101-mcp`，静态 | `ask_wiki_question code-mode mcp-exec read_wiki_contents read_wiki_structure` | [capture](manuals/docker-sandboxes-101/capture/out/11-gateway-probe-static.txt) |
| `m101-mcp-dyn`，load 之前 | `code-mode mcp-add mcp-config-set mcp-exec mcp-find` | [capture](manuals/docker-sandboxes-101/capture/out/11-gateway-probe-dynamic-before.txt) |
| `m101-mcp-dyn`，load 之后 | `ask_wiki_question code-mode mcp-add mcp-config-set mcp-exec mcp-find read_wiki_contents read_wiki_structure` | [capture](manuals/docker-sandboxes-101/capture/out/11-gateway-probe-dynamic-after.txt) |

```listing
title: 把已注册服务器 load 进正在运行的沙箱
source: capture/out/11-load.txt
lang: text
---
$ sbx mcp load m101-deepwiki --sandbox m101-mcp-dyn
MCP server "m101-deepwiki" loaded into sandbox "m101-mcp-dyn" (live)
```

帮助承诺会发通知：已连接的智能体立刻看到新服务器的工具，通过标准 MCP `tools/list_changed` 通知 {{help-sbx sbx mcp load}}。探测每次运行都打开新会话，所以它记录了两份列表，而不是通知本身。内置工具属于网关：`mcp-exec`、`code-mode`、`mcp-find`、`mcp-add`、`mcp-config-set`，以及 OAuth 服务器的 `<server>-authorize` {{docs-sbx Built-in gateway tools}}。在 Cedar MCP 策略中，它们是 `MCP::Primordial` 资源，服务器的工具是 `MCP::Tool` 资源 {{docs-sbx Built-in gateway tools}}，[组织策略](#s-org-policies-profiles-and-the-audit-log)一节会回到这一点。

`sbx mcp catalog` 在 v0.45.0 中被移除 {{rel-sbx v0.45.0}}，产品页上的 `sbx mcp enable` 从未存在过（[冲突 C11](#s-ref-sources-and-the-conflicts-register)）。[图](#fig-3-7)画出了存储、两个网关，以及 load。协议本身见 [MCP 课程](phases/13-tools-and-protocols/06-mcp-fundamentals)。

```figure
id: fig-3-7
kind: flow
title: 一次注册、两个网关、两份工具列表
claim: 主机存储只保存一份 m101-deepwiki，每个沙箱在同一个 URL 上有自己的网关，静态集合是固定的，而 load 会实时改变动态集合.
caption: 从左边的存储读到右边的两个沙箱。实心墨色箭头是到达网关的注册。靛蓝色点线箭头是 tools/list_changed 通知，橄榄色虚线箭头是 VM 外的远程服务器。 From capture/out/11-mcp-inspect.json, 11-static-inside.txt, 11-gateway-probe-static.txt, 11-gateway-probe-dynamic-before.txt, 11-load.txt, and 11-gateway-probe-dynamic-after.txt.
```

```takeaways
- 用 `sbx mcp add` 注册，然后选 `--static-mcp` 得到固定集合，或用 `sbx mcp load` 做实时变更。
- 把 `--command` 服务器当作拥有你权限的主机进程，绝不要当作已沙箱化。
- 用 `sbx mcp inspect NAME --json` 检查 `requires_oauth`，并把客户端密钥存为 `mcp:NAME:client_secret`。
- 当智能体不在集成列表上时，在沙箱内读取 `MCP_GATEWAY_URL`。
```

Sources: help-sbx sbx mcp, sbx mcp add, sbx mcp auth, sbx mcp inspect, sbx mcp load, sbx mcp ls, sbx create (research/sources/help-sbx.md); docs-sbx MCP gateway, Architecture, Security model, Settings (research/sources/docs-sandboxes.md); rel-sbx v0.45.0 (research/sources/sbx-releases.md); research/conflicts-register.md rows C11, C91; talk T02 (2026-09-04), T23 (2026-09-29) from research/plan.md; capture/fixtures/mcp-probe.sh; capture/out/11-mcp-add.txt, 11-mcp-add-registry.txt, 11-mcp-ls.json, 11-mcp-inspect.json, 11-mcp-auth-status.json, 11-static-create.txt, 11-static-inside.txt, 11-gateway-initialize.http, 11-gateway-probe-static.txt, 11-dynamic-create.txt, 11-gateway-probe-dynamic-before.txt, 11-load.txt, 11-gateway-probe-dynamic-after.txt, 11-mcp-rm.txt
