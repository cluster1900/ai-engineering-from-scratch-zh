# toolset 与 mcp

> toolset 是固定 27 种 `type` 之一，给智能体提供工具，而 `mcp` 通过 Docker 引用、命令或 URL 到达服务器。

你的智能体凭记忆回答关于仓库的问题，你怀疑它从未拿到过文件工具。智能体文件写的是 `filesystem`，但模型看到的是工具名，不是 toolset。

读完本节后，你能列出智能体交给模型的工具、在没有模型的情况下调用其中一个，并选择一种 MCP 形式。

## 27 种类型 {#s-toolsets-and-mcps-the-27-types}

**Toolset：** 智能体 `toolsets` 下的一个条目，带有一个 `type` 和选项，运行时会把它变成一个或多个工具。`docker-agent toolsets` 打印 27 种类型，schema 的 `Toolset` 枚举也是同样的 27 种 {{schema Toolset}}。

```listing
title: 27 种 toolset 类型中的六种
source: capture/out/16-toolsets.txt
lang: text
note: 只保留表头和六行。其余 21 种类型列在 toolsets 参考表中。
---
$ docker-agent toolsets
TYPE                SUMMARY
…
background_agents   Dispatch work to sub-agents concurrently and collect results
…
filesystem          Read, write, list, search, and navigate files and directories
…
mcp                 Extend agents with external tools via the Model Context Protocol
mcp_catalog         Discover and activate remote MCP servers from the Docker MCP Catalog
…
plan                Shared persistent scratchpad for multi-agent collaboration
…
shell               Execute shell commands in the user's environment
…
[exit 0]
```

`transfer_task` 和 `handoff` 不是类型。文档的内置表把两者都列了进去，schema 枚举和 CLI 列表则没有它们，由 `sub_agents` 和 `handoffs` 注入它们（[冲突 C56](#s-ref-sources-and-the-conflicts-register)）。同一张文档表列出了 CLI 不打印的 `session_plan`，并漏掉了 `environment` 和 `file` {{docs-agent Tool Configuration}}。[toolsets 表](#s-ref-toolsets) 以 CLI 为准。

## 从 toolset 到工具 {#s-toolsets-and-mcps-from-toolsets-to-tools}

`files.yaml` 声明了两个 toolset，`filesystem` 和 `shell`。它那次运行的每个 `toolset_info` 事件都报告 `"available_tools": 10`（`18-run-json.ndjson`）。cassette `18-files.yaml` 里的请求列出了它们：从 `directory_tree` 到 `remove_directory` 的九个 filesystem 工具，然后是 `shell`。模型从该列表中选择了 `list_directory` 和 `read_file`。

`debug toolsets FILE --json` 在没有模型的情况下打印同样的名字和 schema {{help-agent docker-agent debug toolsets}}。对 `guarded.yaml` 它打印一个工具：

```listing
title: guarded.yaml 的唯一工具
source: capture/out/20-debug-toolsets.json
lang: json
note: description 和 output schema 已删节。
---
[
  {
    "agent": "root",
    "tools": [
      {
        "name": "shell",
        "category": "shell",
…
        "parameters": {
          "additionalProperties": false,
          "properties": {
            "cmd": {
              "description": "Shell command",
              "type": "string"
            },
            "cwd": {
              "description": "Working directory (default \".\")",
              "type": "string"
            },
            "timeout": {
              "description": "Timeout in seconds (default 30)",
              "type": "integer"
            }
          },
…
        "annotations": {
          "idempotentHint": false,
          "readOnlyHint": false,
          "title": "Shell"
        },
…
```

`debug tool FILE TOOL JSON` 在没有模型回合的情况下调用一个工具，这次调用有真实的副作用，并跳过其他 hooks 和批准检查 {{help-agent docker-agent debug tool}}。在 `20-debug-tool.txt` 中，带 `{"cmd":"echo m101-direct"}` 的 `shell` 打印了 `m101-direct`。在任何模型调用它之前，用它来测试工具。

## 每种 toolset 共享的键 {#s-toolsets-and-mcps-keys-every-toolset-shares}

**工具过滤器：** 收窄 toolset 交给模型的内容的键。`tools` 只保留列出的名字，`readonly` 只保留注解带有只读提示的工具 {{schema Toolset}}。`defer` 会隐藏工具，直到模型用 `search_tool` 和 `add_tool` 找到它们。`instruction` 会替换 toolset 的内置指令，除非文本包含 `{ORIGINAL_INSTRUCTIONS}`。`model` 指定工具结果之后那个回合所用的模型。自 v1.148.0 起，完整的工具结果上限为 50 KiB {{rel-agent v1.148.0}}。

`shell` 上的 `readOnlyHint: false` 在 [权限、--safety 和 hooks](#s-permissions-safety-and-hooks) 中再次重要。

## mcp 类型 {#s-toolsets-and-mcps-the-mcp-type}

**MCP toolset：** `type: mcp` 的 toolset，连接到一个 MCP 服务器并把其工具交给智能体。文档给出三种形式 {{docs-agent Tool Configuration}}：

- `ref: docker:duckduckgo` 通过 MCP Gateway 在容器中运行一个 catalog 服务器。
- `command`、`args` 和 `env` 通过 stdio 启动一个本地进程，缺失的二进制会从 aqua registry 安装到 `~/.cagent/tools/bin/`。
- `remote.url` 加上设为 `streamable` 或 `sse` 的 `transport_type` 通过网络访问服务器，可选带 `headers`。

`lifecycle.profile` 为每个 `mcp` toolset 设置重连：默认为 `resilient`，也可以是 `strict` 或 `best-effort`。顶层 `mcps` 条目保存服务器定义，智能体以 `{type: mcp, ref: <name>}` 引用它 {{schema mcps}}。顶层 `toolsets` 条目由 `use_toolsets` 点名，对任意类型做同样的事 {{schema toolsets}}。

本版 capture 没有运行过 `mcp` toolset，所以这三种形式来自文档和 schema。`ref: docker:` 是否需要 Docker Desktop 的 MCP Toolkit 仍未确定（[冲突 C73](#s-ref-sources-and-the-conflicts-register)）。MCP 的沙箱侧是 [sbx mcp add、load 和 --static-mcp](#s-sbx-mcp-add-load-and-static-mcp)。作为 MCP 服务器来提供的智能体见 [serve mcp 和 serve acp](#s-serve-mcp-and-serve-acp)。

```figure
id: fig-5-3
kind: flow
title: 每个 toolset 条目交给模型的内容
claim: 每个 `toolsets` 条目都会变成模型请求中的具名工具：内置类型在进程内运行，`mcp` 则经过 gateway、子进程或 URL.
caption: 每行从左到右读，从智能体文件条目到模型请求中的工具名。实线行在 JSON 运行 capture 中跑过，名字来自 cassette 的 tools 数组。虚线行来自文档的 Tool Configuration 页面，没有跑过。
```

```takeaways
- 运行 `docker-agent debug toolsets FILE --json` 查看模型拿到的工具名和 schema。
- 在模型调用之前用 `docker-agent debug tool` 测试工具，并预期会有真实副作用。
- 设置 `tools` 或 `readonly`，让智能体拿到的工具少于其 toolset 所含。
- 把重复使用的 MCP 服务器放在顶层 `mcps` 下，并按名字引用。
```

Sources: schema Toolset, mcps (research/sources/agent-schema.json); docs-agent Tool Configuration (research/sources/docs-docker-agent.md, page configuration/tools); help-agent docker-agent toolsets, debug toolsets, debug tool (research/sources/help-docker-agent.md); rel-agent v1.148.0 (research/sources/docker-agent-CHANGELOG.md); conflicts C56, C73 (research/conflicts-register.md); capture/fixtures/agents/files.yaml, guarded.yaml; capture/cassettes/18-files.yaml.gz; capture/out/16-toolsets.txt, 18-run-json.ndjson, 20-debug-toolsets.json, 20-debug-tool.txt
