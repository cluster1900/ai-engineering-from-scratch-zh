# analyze-javascript-application and the application graph

> rea 解析 ledger-desk 的六个文件而不运行它们，并返回一份派生记录，其图有 42 个节点与 59 条边，每一条有自己的权威。

你有一个小型 Electron 风格应用，六个文件在 `capture/fixtures/js-app/`。你想在读代码之前拿到地图：哪个 renderer 与哪个主进程 handler 对话，以及什么离开机器。该分析在没有 Ghidra、也不运行应用任何一行的情况下回答那一点。读完本节后，你能跑分析、读记录及其图，并用 `inspect-analysis-view` 翻阅一份大结果。

## 命令与记录 {#s-analyze-javascript-application-the-command-and-the-record}

CLI 命令是 `rea analyze-javascript-application PATH`。普通的 `rea analyze PATH` 到达同一段代码。当你既不给 `--provider` 也不给 `--snapshot` 时，它对目录或 `.asar` 文件选这个工作流 {{cli Run a command}}。

输入是 `input_path`、作为 `auto`、`asar` 或 `directory` 的 `format`，以及 `integrity_policy`。可选的 `source_paths` 输入点名精确的已清点文件。然后 rea 只分析那些文件，其他文件的关系保持未知。

四个资源限制是可选的。`max_heap_mb` 默认 1024 MiB，`analysis_timeout_ms` 默认 300,000 ms。`max_semantic_nodes` 默认 100,000，`max_semantic_nodes_per_file` 是 20,000。经 MCP，你也可以把 `detail` 设为 `complete` 或 `summary`。解析器是 `@babel/parser`。它带着打开的 `errorRecovery` 跑，并且不附着注释。

```listing
title: the head of the analyze_javascript_application record
source: capture/out/15-js-app.json
lang: json
note: The kit kept the record without graph and semantic_graph, with --filter-output. The result fields follow.
---
{
  "evidence_id": "ev_14bd1d1e…",
  "subject": {
    "name": "js-app",
    "digest": {
      "sha256": "bb9f726c…"
    },
    "local_path": "$CAPTURE/fixtures/js-app",
    "format": "directory",
    "architecture": null
  },
  "provider": {
    "id": "rea-javascript-application",
    "name": "REA JavaScript application analyzer",
    "version": "1"
  },
  "analysis_profile": null,
  "predicate_type": "rea.javascript-application-analysis",
  "operation": "analyze_javascript_application",
  "parameters": {
    "format": "auto",
    "integrity_policy": "fail"
  },
```

这是一份像第 5 部分那些一样的 Evidence 记录，与 Ghidra dossier 有三点不同。provider 是 rea 自己，`rea-javascript-application` 版本 `1`。置信度是 `derived`，因为 rea 从语法计算出关系，权威是 `shipped-artifact`，因为磁盘上的六个文件是源。主体是目录，以其清单的 SHA-256 `bb9f726c…` 为摘要。`normalized_result` 有十一个字段：`input_path`、`format`、`root_artifact_sha256`、`inventory_manifest_id`、`inventory_graph_sha256`、`integrity_contradictions`、`graph`、`summary`、`statistics`、`limitations` 与 `semantic_graph`。第十二个字段 `source_selection` 只在请求点名 `source_paths` 时出现。

```listing
title: the summary and the statistics of ledger-desk
source: capture/out/15-js-app.json
lang: json
note: The utility-process and native-addon counts, all zero, are cut.
---
"summary": {
  "browser_windows": 1,
  "explicit_web_preferences": 3,
  "preload_entrypoints": 1,
  "context_bridge_apis": 1,
  "exposed_api_members": 3,
  "ipc": {
    "operations": 6,
    "literal_channels": 3,
    "dynamic_channel_operations": 0,
    "renderer_transmissions": 3,
    "renderer_listeners": 0,
    "main_handlers": 3,
    "paired_renderer_transmissions": 3,
    "ambiguous_renderer_transmissions": 0,
    "unpaired_literal_renderer_transmissions": 0
  },
  …
},
"statistics": {
  "relevant_files": 6,
  "nested_asar_containers": 0,
  "text_bytes_read": 2888,
  "invalid_utf8_files": 0,
  "parsed_javascript_files": 4,
  "skipped_javascript_files": 0,
  "visited_ast_nodes": 424,
  "findings": 25,
  "modules": 0,
  "parse_failures": 0
},
```

对照 `capture/fixtures/js-app/` 里的源检查这些数字。`main.js` 创建一个带三个显式 `webPreferences` 的 `BrowserWindow`：`preload`、`contextIsolation` 与 `nodeIntegration`。`preload.js` 暴露一个 `contextBridge` API，`ledger`，带三个成员。六个 IPC 操作是 `preload.js` 里的两个 `invoke` 与一个 `send`，以及 `main.js` 里的两个 `handle` 与一个 `on`。它们使用三个字面信道，且每个信道都已配对。

六个文件里有四个是 JavaScript，访问了 424 个 AST 节点，没有文件解析失败。`skipped_javascript_files` 是 0，所以没有 JavaScript 文件因大小或资源限制被留下。当该计数大于 0 时，图不完整，且计数告诉你差了多少文件。`modules` 计数 bundler 模块，而这个应用没有 bundle。命令跑时，rea 向 stderr 写了十九个进度事件，从清点到记录的最终哈希。事件也展示文件之间的拆分。rea 只为元数据读 `index.html` 与 `package.json`，并解析四个 JavaScript 文件。

```listing
title: five of the nineteen progress events
source: capture/out/00-commands.txt
lang: text
note: Events 1, 3, 4, 5, and 19 of the first analyze-javascript-application call. The other fourteen are cut.
---
[stderr] {"rea_progress":{"phase":"analyze_javascript_application","completed":0,"total":1,"message":"Inventorying and parsing application artifacts","sequence":1}}
…
[stderr] {"rea_progress":{"phase":"parse_javascript_sources","completed":0,"total":1,"message":"Processing 6 selected application files","sequence":3}}
[stderr] {"rea_progress":{"phase":"process_javascript_artifact_metadata","completed":0,"total":1,"message":"Processing metadata for index.html (1/6)","sequence":4}}
[stderr] {"rea_progress":{"phase":"parse_javascript_source","completed":0,"total":1,"message":"Parsing and projecting ledger.js (2/6)","sequence":5}}
…
[stderr] {"rea_progress":{"phase":"analyze_javascript_application","completed":1,"total":1,"message":"Application graph and Electron boundaries reconstructed","terminal":true,"sequence":19}}
```

## 图 {#s-analyze-javascript-application-the-graph}

**应用图：** 一个应用作为节点与有向边的、与 provider 无关的模型，每条边上有一块 evidence。文档固定两条规则。图仅从语法构建。它不读文件、不做 CDP 调用，不运行 JavaScript，且没有针对一个应用的节点种类 {{jsgraph JavaScript Application Graph}}。

边使用固定的一组有向关系：`contains`、`loads`、`imports`、`maps_to`、`exposes`、`sends`、`invokes`、`handles`、`calls`、`persists_to`、`observed_as` 与 `changed_from` {{jsgraph Entities and relationships}}。

`15-js-app-graph.json` 里 ledger-desk 的图有 42 个节点与 59 条边。它自己的覆盖是 `complete`，且什么都不省略。四个源模块每一个都把其自己文件的 SHA-256 记为 `source_sha256`。那个摘要就是 `00-fixtures.txt` 为该文件列出的那个，所以你可以在没有目录摘要的情况下把模块对上其字节。

| Node kind | Count | In ledger-desk |
|---|---|---|
| `javascript-module` | 11 | 四个文件作为模块，外加按需的 `electron`、`node:path` 与 `./ledger` |
| `javascript-expression` | 9 | 三个桥接成员 `ledger.percentChange`、`ledger.gradeLabel` 与 `ledger.log` 各自的三步（暴露、闭包、终端调用） |
| `javascript-asset` | 4 | 按内容摘要的 `main.js`、`preload.js`、`renderer.js`、`ledger.js` |
| `artifact` | 3 | 根目录、`package.json`、`index.html` |
| `ipc-channel` | 3 | `ledger:percent-change`、`ledger:grade-label`、`ledger:log` |
| `ipc-handler` | 3 | `main.js` 里的两个 `ipcMain.handle` 与一个 `ipcMain.on` |
| `electron-renderer` | 2 | `index.html`，从 `loadFile` 与从 HTML 引用看到 |
| `package`、`electron-main`、`browser-window`、`electron-preload`、`context-bridge-api`、`endpoint`、`storage` | 各 1 | `ledger-desk`、`main.js`、`BrowserWindow@8:17-16:4`、`preload.js`、`ledger`、`/api/ledger/latest`、`ledger:latest` |

| Relation | Count | Evidence on the edges |
|---|---|---|
| `contains` | 19 | 7 条从工件字节观察到，8 条从 AST 观察到，4 条推断 |
| `imports` | 11 | 推断 |
| `maps_to` | 8 | 推断 |
| `loads` | 5 | 推断 |
| `calls` | 4 | 推断：一次到端点的 `fetch`，以及三条桥接调用路径里各一条步进边 |
| `invokes` | 4 | 推断 |
| `handles` | 3 | 推断 |
| `sends`、`exposes` | 各 2 | 推断 |
| `persists_to` | 1 | 推断，`localStorage.setItem` |

每一条边说出它如何获得。一条 AST 事实有权威 `ast-static-analysis`、状态 `observed`、置信度 `exact`，以及一个源范围。一条关系有权威 `static-relationship-inference`、状态 `inferred`，以及默认的置信度 `high`。它始终带着限制 `Static syntax does not prove that this relationship executes at runtime.`。文档陈述 Electron 边的规则：`loads`、`exposes`、`invokes`、`handles` 与 `imports` 保持为静态推断 {{jsgraph Entities and relationships}}。

```listing
title: one invokes edge, from preload.js to the handler in main.js
source: capture/out/15-js-app-graph.json
lang: json
note: The artifact reference, the extractor, the coverage, and the limitations of the edge are cut.
---
{
  "source_node_id": "jag_node_c239425e…",
  "target_node_id": "jag_node_36721459…",
  "relation": "invokes",
  "properties": {
    "channel": "ledger:grade-label",
    "pairing_basis": "unique-exact-literal-channel",
    "handler_path": "main.js",
    "handler_operation": "handle"
  },
  "evidence": {
    "authority": "static-relationship-inference",
    "state": "inferred",
    "confidence": "high",
    …
    "location": {
      "available": true,
      "value": {
        "kind": "source-range",
        "source": "preload.js",
        "start": {
          "line": 7,
          "column": 25
        },
        "end": {
          "line": 7,
          "column": 72
        }
      }
    },
    …
```

`preload.js` 第 7 行，第 25 到 72 列，是 `ipcRenderer.invoke("ledger:grade-label", score)`。该边把这次调用与 `main.js` 里的 `ipcMain.handle` 配对，因为信道是每一侧各出现一次的一个精确字面量。它是 `inferred`，不是 `observed`，因为什么都没跑。如果两个 handler 用了该信道，同一配对会是 `ambiguous`，而动态信道名根本得不到配对边。[图](#fig-6-1) 用捕获里的文件名与信道名画出该图。

```figure
id: fig-6-1
kind: tree
title: the application graph of ledger-desk
claim: The graph links the package entry point to three IPC handlers and one network endpoint, and each edge names whether it was observed or inferred.
caption: Read from the top left. Olive boxes are the application's own code, the grey box is the network endpoint outside it, and the teal box is browser storage. Relation names sit on the arrows. The nine `javascript-expression` step nodes of the three bridge call paths are not drawn. From capture/out/15-js-app-graph.json.
```

## 大记录上的视图 {#s-analyze-javascript-application-views-over-a-large-record}

六个文件给出一份约 200 KB 的记录。文档警告，对真实应用，完整 Evidence 可达数百兆字节 {{cli Run a command}}。

`inspect-analysis-view` 从一份已存在的记录里读一个视图，不再次跑分析。其输入是一个 `source` 与一个 `view`。源是内联的完整记录，或对 MCP 会话保留的一份记录的引用。视图是一份摘要、一个集合的一页，或一个模块。捕获要了摘要，以及 `modules` 集合的前 32 项。

每一个视图是它自己的一份 Evidence 记录，来自 provider `rea-analysis-view`。父 id 在 `parameters.parent_evidence_id` 与在 `evidence_links` 里，因此从视图到分析的链是显式的。

```listing
title: the coverage block of the summary view
source: capture/out/15-js-app-view-summary.json
lang: json
note: The twelve semantic families, all partial, are cut.
---
"coverage": {
  "application": {
    "status": "complete",
    "truncated": false,
    "omitted_count": 0,
    "limits": []
  },
  …
  "application_unknowns": 0,
  "semantic_unknowns": 118
},
"limitation_count": 7
```

应用图是完整的。语义图，也就是记录里的第二张图，不是。其覆盖状态是 `unknown`，其十二个家族每一个都是 `partial`，且仍有 118 个语义未知事项。视图在其 `unknowns` 里把该事实列为 `semantic_graph.coverage.status is unknown`。这是[残余未知事项](#s-residual-unknowns-and-coverage) 的规则的第二种形状。一张说自己是部分的图，比一张什么都不说的图更有用。

```listing
title: the modules page, items and coverage
source: capture/out/15-js-app-view-modules.json
lang: json
note: Thirteen of the fifteen items are cut.
---
"items": [
  {
    "node_id": "jag_node_0fc7e361…",
    "kind": "javascript-asset",
    "path": "main.js"
  },
  {
    "node_id": "jag_node_19e7e901…",
    "kind": "javascript-module",
    "path": "main.js"
  },
  …
"coverage": {
  "status": "page",
  "examined": 15,
  "total": 15,
  "next_offset": null,
  "exhausted": true
},
```

一页说出它覆盖集合的多少：这里是 15 项里的 15 项，没有下一个偏移。对有数千个模块的记录，你会读 `next_offset` 并再问一次。最后一个细节把本节连到[Evidence 记录](#s-the-evidence-record)。两份视图记录都在 `normalized_result` 与 `locations` 里带着应用路径。因此捕获里被掩的 `$CAPTURE` 会改变它们的 id，而你自己的运行会对同样的视图显示不同的 id。

```takeaways
- 跑 `rea analyze-javascript-application PATH --format json` 并把完整记录存到文件。
- 在打开源文件之前先读 `summary.ipc` 以及 `invokes` 与 `handles` 边。
- 把每一条 `inferred` 边当作假说，直到一次运行或一次测试确认它。
- 用 `inspect-analysis-view` 翻阅大记录，而不是整份读它。
```

Sources: src/cli/electronCommands.ts, src/domain/javascript/javascriptApplicationAnalysis.ts, src/domain/javascript/javascriptAnalysisResourceControls.ts, src/domain/javascript/javascriptSourceParser.ts, src/contracts/javascript/electronToolContracts.ts, src/contracts/analysisViewToolContracts.ts, src/application/javascript/JavaScriptArtifactGraphEvidence.ts, src/domain/javascript/javascriptSourceSelection.ts at rea-agents-6.7.0 (27dc42d); rea docs/cli.md, docs/javascript-application-graph.md, docs/javascript-artifact-reconstruction.md (Select sources before analysis, What is reconstructed), docs/mcp-contracts.md; capture/README.md; capture/fixtures/js-app/main.js, preload.js, renderer.js, ledger.js, index.html, package.json; capture/out/00-commands.txt, 15-js-app.json, 15-js-app-graph.json, 15-js-app-view-summary.json, 15-js-app-view-modules.json
