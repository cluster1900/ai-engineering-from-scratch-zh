# open_binary 与无头桥接

> open_binary 在没有 Ghidra 导入的情况下把一个目标绑定到一个 provider，而第一次由 Ghidra 支撑的调用为一次无头导入、自动分析与一个私有套接字买单。

你的 agent 在不到两秒内经 MCP 打开了 `ledger-arm64-O1`，然后为 `list_procedures` 等了好几秒。没有出错。那次 open 调用并没有把文件导入 Ghidra。第一个问题导入了，而它之后的每一个问题都在毫秒内回来。

读完本节后，你能读一次会话的服务器日志，并点名第一次查询启动的那个进程。你也能预测哪些调用会慢。

## open_binary {#s-open-binary-and-the-headless-bridge-open-binary}

```listing
title: the open_binary exchange
source: capture/out/10-mcp-03-open-binary-O1.json
lang: json
note: The request and the result. The text copy of the result is cut by the capture kit.
---
"method": "tools/call",
"params": {
  "name": "open_binary",
  "arguments": {
    "path": "$CAPTURE/fixtures/ledger-arm64-O1",
    "provider_id": "ghidra"
  }
}
…
"structuredContent": {
  "result": {
    "path": "$CAPTURE/fixtures/ledger-arm64-O1",
    "format": "mach-o",
    "kind": "executable",
    "sha256": "01b5d08b…",
    "architecture": "arm64"
  }
}
```

处理器用路径与 provider id 调用 `session.open`，然后返回五个字段：`path`、`format`、`kind`、`sha256` 与 `architecture`。为填它们，rea 读魔术字节：ELF 是 `7f 45 4c 46`，DOS 与 PE 是 `MZ`，以及四个 Mach-O 值。它按 64 KiB 块对整个文件做哈希。没有头的文件需要显式的 `format`。带 `format: "raw-binary"` 时你还要给出 `architecture` 与 `entry_point`，结果会加上 `entry_point`。rea 在这里拒绝 WebAssembly 模块，并把它送到 `inspect_wasm_artifact`。对其余每一个目标，rea 选择你请求的 provider，而 `binary_session` 记录那个选择。

选择会等待 provider 的就绪检查。在抓取用的 Mac 上，服务器日志显示第一次 `open_binary` 大约 1.6 s，第二次大约 0.4 s。设计文档允许这次等待：就绪检查可以等待它拥有的命令。发行版 6.5.0 以 36 ms 与 1 ms 回答同样的调用。两个版本在这一步都不导入目标。

```listing
title: the binding that binary_session reports
source: capture/out/10-mcp-04-binary-session.json
lang: json
note: Cut to the provider binding and the server identity. The capabilities, candidates, and tool availability lists are cut.
---
"open": true,
…
"analysis_provider_binding": {
  "provider": {
    "id": "ghidra",
    "name": "Ghidra",
    "version": "12.1.4"
  },
  "selection_source": "request",
  "analysis_profile": {
    …
    "digest": "3fc72c9b…"
  }
},
…
"server_identity": {
  "package": {
    "name": "rea-agents",
    "version": "6.7.0",
    …
  },
  …
  "sdk": {
    "server": "2.3.1",
    …
  },
  "negotiated_protocol_version": "2025-06-18",
  …
```

`selection_source: "request"` 表示 agent 选择了 Ghidra。配置摘要是该目标每一份 Ghidra 记录都带着的那个。文档用一句话陈述 open 调用的界限：

```rule
label: what open_binary does not do
source: mcp §Ghidra first-query deadlines and recovery
---
`open_binary` picks the target and binds the provider. It does not prove that Ghidra has finished the import of the target.
```

## 第一次由 Ghidra 支撑的调用 {#s-open-binary-and-the-headless-bridge-the-first-ghidra-backed-call}

```listing
title: six calls from the session index
source: capture/out/10-mcp-session.txt
lang: text
note: Lines 03 to 08 of the index. The time in parentheses is measured by the capture client around each call, changes on every run, and is cut.
---
03  tools/call open_binary              ok     -> 10-mcp-03-open-binary-O1.json  (…)
04  tools/call binary_session           ok     -> 10-mcp-04-binary-session.json  (…)
05  tools/call list_procedures          ok     -> 10-mcp-05-list-procedures.json  (…)
06  tools/call procedure_assembly       ok     -> 10-mcp-06-procedure-assembly-grade.json  (…)
07  tools/call xrefs                    ok     -> 10-mcp-07-xrefs-grade.json  (…)
08  tools/call list_strings             ok     -> 10-mcp-08-list-strings.json  (…)
```

```listing
title: the same calls in the server log
source: capture/out/10-mcp-server.log
lang: jsonl
note: The first five lines of the stderr of rea mcp. durationMs is measured inside the server. The time and durationMs values change on every run and are cut.
---
{"level":30,"time":…,"application":"rea","mode":"mcp","layer":"server","tool":"open_binary","durationMs":…,"status":"ok","msg":"MCP tool execution completed"}
{"level":30,"time":…,"application":"rea","mode":"mcp","layer":"server","tool":"list_procedures","durationMs":…,"status":"ok","msg":"MCP tool execution completed"}
{"level":30,"time":…,"application":"rea","mode":"mcp","layer":"server","tool":"procedure_assembly","durationMs":…,"status":"ok","msg":"MCP tool execution completed"}
{"level":30,"time":…,"application":"rea","mode":"mcp","layer":"server","tool":"xrefs","durationMs":…,"status":"ok","msg":"MCP tool execution completed"}
{"level":30,"time":…,"application":"rea","mode":"mcp","layer":"server","tool":"list_strings","durationMs":…,"status":"ok","msg":"MCP tool execution completed"}
```

抓取套件在其 README 里记录这个模式。`open_binary` 之后第一次由 Ghidra 支撑的调用要 5 到 7 s。同一目标上之后的每一次调用都不到 100 ms。差别是 Ghidra 的启动。`GhidraClient.callTool` 在排队任何请求之前等待 `start()`，所以第一次调用为 `#startWithin` 里的整段序列买单：

1. 在会话根下创建一个名为 `rea-ghidra-` 加随机后缀的私有运行时根。
2. 分配端点，在 macOS 与 Linux 上是 Unix 套接字。
3. 把目标复制进根，名为 `target-01b5d08b08fb.bin`，边复制边哈希，并拒绝摘要不匹配。
4. 铸造一个 32 字节随机令牌与一个 run id。
5. 写入带 `transport`、`endpoint_path`、`token`、`run_id`、`target_sha256`、`provider_version` 与 `profile_digest` 的 `session.json`。
6. 启动 Java，并等待桥接受连接。

**无头导入：** 一次没有窗口的 Ghidra 运行，把一个文件导入项目并跑默认分析器。在 macOS 与 Linux 上，rea 不跑 `analyzeHeadless` shell 脚本。它向 Ghidra 的 `LaunchSupport.jar` 要环境与 JVM 参数，然后自己跑 `java`。堆是 `-Xmx2G`，除非设置了 `GHIDRA_HEADLESS_MAXMEM` 或 `GHIDRA_MAXMEM`。命令加上 `-Djava.awt.headless=true`，并把类命名为带 `ghidra.app.util.headless.AnalyzeHeadless` 的 `ghidra.Ghidra`。

文档给出直接启动的理由。在 Apple 平台上，shell 包装器把它们的环境藏在所有权检查之外。若包装器在位，rea 就不能在启动期间安全地取消进程组 {{install §Ghidra}}。

无头参数按一个固定顺序到来：

- 项目根与项目名 `rea-project`
- 带已复制目标的 `-import`
- `-readOnly` 与 `-deleteProject`
- 指向运行时根的 `-log` 与 `-scriptlog`，以及指向桥目录的 `-scriptPath`
- `-postScript ReaGhidraNoReturnFix.java`
- 带 `session.json` 路径的 `-postScript ReaGhidraBridge.java`，放在最后

有些目标与设置需要更多参数。原始二进制、DOS 文件或语言覆盖会加上加载器与处理器。种子与禁用的分析器会加上预脚本。本手册的 fixture 一个都不需要。

```figure
id: fig-4-1
kind: sequence
title: one open and three questions over MCP
claim: The open call returns after the readiness checks with no import, the first question waits seconds for the headless import, and the next takes under 100 ms.
caption: Time runs down. Solid arrows are calls, dashed arrows are replies. The violet lanes are rea's Ghidra client and the Java bridge inside analyzeHeadless. The times are the ranges that the kit notes record. From capture/out/10-mcp-server.log and 10-mcp-session.txt.
```

## Java 一侧的桥 {#s-open-binary-and-the-headless-bridge-the-bridge-on-the-java-side}

`ReaGhidraBridge.java` 是一段在导入与分析器之后跑的 Ghidra 脚本。其 `run()` 读 `session.json` 并删除它，然后要求有一个已导入的程序。它检查 Ghidra 版本等于 `provider_version`，并以常量时间比较程序自己的 SHA-256 与 `target_sha256`。然后它结束脚本事务，初始化反编译器，并开始服务。在 Unix 套接字上它绑定路径，把模式设为 `rw-------`，并接受一个客户端。

每个请求是一行 JSON，`{ id, token, method, params }`。每个回复是 `{ id, ok: true, result }` 或 `{ id, ok: false, error: { code, message } }`，而 rea 用严格模式解析它。`list_procedures` 是该套接字上第 2 个请求，在握手的 `ping` 之后，Java 一侧只花了几毫秒。它之前的那些秒是导入与分析器。

```figure
id: fig-4-2
kind: tree
title: the private runtime root of one session
claim: One session owns one directory with the project, the hashed target copy, the descriptor, the socket, and the logs, and close_binary deletes it.
caption: Read top to bottom. Each entry names the file or directory and what writes it. From src/ghidra/GhidraLauncher.ts and src/ghidra/GhidraClient.ts at rea 6.7.0, and capture/out/05-analyze-arm64-O1.json for the document name.
```

## 截止时间与关闭 {#s-open-binary-and-the-headless-bridge-deadlines-and-the-close}

rea 允许启动用 330,000 ms，由 `REA_GHIDRA_STARTUP_TIMEOUT_MS` 设定。在抓取用的 Mac 上启动花了 5 到 7 s，而要盯的是客户端限制。钉住的客户端 SDK 2.3.1 默认等待 60,000 ms，所以它可以在 REA 启动截止之前取消 {{mcp §Ghidra first-query deadlines and recovery}}。

文档记录 Linux fixture 大约 64 s，Windows 大约 163 s。根据你自己机器上自己的第一次运行来设置客户端截止时间。

`close_binary` 在日志里只占一秒的几分之一。客户端以 10 s 限制向桥发送 `shutdown`，桥释放反编译器，而 `-deleteProject` 删除项目。下一次对 `ledger-arm64-O2` 的 `open_binary` 大约花了 0.4 s。它的第一次 `analyze_function` 又花了几秒，因为每一个新的 provider 会话都会把目标再次导入一个新的临时项目 {{mcp §Ghidra first-query deadlines and recovery}}。

```takeaways
- 预期 `open_binary` 之后第一次由 Ghidra 支撑的调用花几秒，其余花毫秒。
- 根据你自己机器上测到的冷启动设置 MCP 客户端截止时间。
- 在 `close_binary` 之前问完你有的每一个问题，因为项目会被删除。
- 读服务器日志里的 `durationMs`，把 rea 时间与 Ghidra 时间分开。
```

Sources: capture/out/10-mcp-03-open-binary-O1.json, capture/out/10-mcp-04-binary-session.json, capture/out/10-mcp-session.txt, capture/out/10-mcp-server.log, capture/out/05-analyze-arm64-O1.json, capture/README.md; rea 6.7.0 at 27dc42d: src/server/registerSessionTools.ts, src/contracts/sessionLifecycleInputs.ts, src/domain/binaryTarget.ts, src/application/BinaryTargetResolver.ts, src/ghidra/GhidraClient.ts, src/ghidra/GhidraTransport.ts, src/ghidra/GhidraTargetSnapshot.ts, src/ghidra/GhidraLauncher.ts, src/ghidra/GhidraJavaLaunch.ts, src/ghidra/GhidraClientWire.ts, src/ghidra/protocol.ts, src/config/providerStartupTimeout.ts, src/application/binary/AnalysisProviderRegistry.ts, bridge/ghidra/ReaGhidraBridge.java; rea docs/mcp-contracts.md, rea docs/installation.md, rea docs/tool-design.md; the 6.5.0 recording of capture/out/10-mcp-server.log in commit 99d70723c of this repository
