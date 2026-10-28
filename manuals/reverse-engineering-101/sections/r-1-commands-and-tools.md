# Commands and tools used in this manual

> 捕获跑过的每一个 rea 命令与 MCP 工具，带着它回答什么、持有其输出的捕获文件，以及解释它的那一节。

rea 6.7.0 有 153 个 CLI 命令与 207 个 MCP 工具。`binary_session` 在其目录里报告这些计数（[捕获](manuals/reverse-engineering-101/capture/out/10-mcp-04-binary-session.json)）。捕获套件跑了 17 个一次性命令与 13 个工具，外加 `rea mcp` 以及每一次会话都以之开始的两个 MCP 方法。CLI 名用 `-` 连接词，MCP 名用 `_`。三个原生命令映射到名字不同的工具：`function` 调用 `analyze_function`，`decompile` 调用 `procedure_pseudo_code`，`analyze` 调用 `binary_overview`。捕获对每一个命令传了 `--format json`，并在记录太大无法整份保留时用键列表传了 `--filter-output`（[捕获](manuals/reverse-engineering-101/capture/out/00-commands.txt)）。

输出旗标 `--format`、`--filter-output`、`--token-limit` 与 `--token-offset` 接受 `--flag=value` 形式，例如 `--format=json` {{cli Output and exit status}}。setup 运行对 `--skill=false` 用了同样形式。

## CLI 命令 {#s-ref-commands-and-tools-cli-commands}

| Command | Answers | Recorded output | Section |
|---|---|---|---|
| `rea doctor --provider ghidra` | provider 及其环境是否健康，每行一次检查 | [output](manuals/reverse-engineering-101/capture/out/01-doctor-ghidra.json) | [2.2](#s-rea-doctor-and-the-ghidra-provider) |
| `rea capabilities` | 每个 provider 按组的操作，带着每组的可用性、效果与限制，以及每个 provider 的可用性 | [output](manuals/reverse-engineering-101/capture/out/02-capabilities.json) | [2.3](#s-rea-capabilities) |
| `rea inspect-artifact <path>` | 一个文件或包的按内容寻址的工件图 | [output](manuals/reverse-engineering-101/capture/out/03-inspect-artifact.json) | [3.1](#s-inspect-artifact) |
| `rea inspect-binary-layout <path>` | 经 pwntools 配置的 ELF section、符号与重定位，仅 Linux x64，因此在 macOS 上以 `capability_unavailable` 失败 | [output](manuals/reverse-engineering-101/capture/out/04-inspect-binary-layout.json) | [3.2](#s-inspect-binary-layout-and-the-load-image) |
| `rea inspect-macho <path>` | Mach-O 加载命令、段、section、导入、导出与构建元数据 | [output](manuals/reverse-engineering-101/capture/out/04-inspect-macho.json) | [3.2](#s-inspect-binary-layout-and-the-load-image) |
| `rea analyze <path> --provider ghidra` | `binary_overview`：文档、其段，以及过程与字符串计数 | [output](manuals/reverse-engineering-101/capture/out/05-analyze-arm64-O1.json)，[output](manuals/reverse-engineering-101/capture/out/05-analyze-x86_64-O1.json) | [3.4](#s-analyze-overview) |
| `rea function <path> <name> --provider ghidra` | 一个过程的 `analyze_function` dossier | [outputs](manuals/reverse-engineering-101/capture/out) | [4.6](#s-analyze-function-and-pseudocode) |
| `rea decompile <path> <name> --provider ghidra` | 一个过程的 `procedure_pseudo_code` | [outputs](manuals/reverse-engineering-101/capture/out) | [4.6](#s-analyze-function-and-pseudocode) |
| `rea address-to-file-offset <path> <address> --provider ghidra` | 一个虚拟地址的文件偏移 | [output](manuals/reverse-engineering-101/capture/out/08-address-to-file-offset.json) | [3.3](#s-address-to-file-offset) |
| `rea inspect-evidence-bundle '{"path":..., "detail": "summary"}'` | 一个包里每份记录一行，没有载荷 | [outputs](manuals/reverse-engineering-101/capture/out) | [5.4](#s-evidence-bundles-export-and-import) |
| `rea evidence-export <bundle> <out>` | 一个包的规范副本，键已排序 | [output](manuals/reverse-engineering-101/capture/out/12-evidence-export.json)，[output](manuals/reverse-engineering-101/capture/out/12-evidence-export.txt) | [5.4](#s-evidence-bundles-export-and-import) |
| `rea evidence-import <bundle>` | 验证包里每一个记录 id 与清单，以及拒绝 id 不验证的包 | [output](manuals/reverse-engineering-101/capture/out/13-evidence-import.json)，[output](manuals/reverse-engineering-101/capture/out/13-evidence-import-rea-6.5.0.json) | [5.4](#s-evidence-bundles-export-and-import) |
| `rea compare <left> <right>` | 按记录成员与未知事项修订比较两个包 | [output](manuals/reverse-engineering-101/capture/out/14-compare-bundles.json) | [5.5](#s-compare-and-compare-functions) |
| `rea analyze-javascript-application <dir>` | 一个 JavaScript 或 Electron 应用的应用图，不运行它 | [output](manuals/reverse-engineering-101/capture/out/15-js-app.json)，[output](manuals/reverse-engineering-101/capture/out/15-js-app-graph.json) | [6.1](#s-analyze-javascript-application) |
| `rea inspect-analysis-view <request.json>` | 一份已保存记录的摘要或一页 | [output](manuals/reverse-engineering-101/capture/out/15-js-app-view-summary.json)，[output](manuals/reverse-engineering-101/capture/out/15-js-app-view-modules.json) | [6.1](#s-analyze-javascript-application) |
| `rea inspect-wasm-artifact <path>` | 一个 WebAssembly 模块的验证结果、section，以及导入与导出接口，来自 WABT 1.0.42 | [output](manuals/reverse-engineering-101/capture/out/16-inspect-wasm-artifact.json) | [6.2](#s-inspect-wasm-artifact) |
| `rea setup --client claude_code --skill=false` | 把 rea 条目写入 Claude Code 配置的计划或结果 | [output](manuals/reverse-engineering-101/capture/out/18-setup-claude-jsonc.json)，[output](manuals/reverse-engineering-101/capture/out/18-setup-claude-duplicate.json)，[output](manuals/reverse-engineering-101/capture/out/18-setup-configs.txt) | [8.1](#s-the-rea-mcp-server) |
| `rea mcp` | 经 stdio 的 MCP 服务器 | [outputs](manuals/reverse-engineering-101/capture/out)，[output](manuals/reverse-engineering-101/capture/out/10-mcp-server.log) | [8.1](#s-the-rea-mcp-server) |

CLI 文档说明其退出状态 {{cli Output and exit status}}。当操作完成时是 `0`，允许部分证据或打开的问题。当它无法完成时是 `1`，当信号 `N` 结束进程时是 `128 + N`。捕获里三个命令以 `1` 退出。它们是 Mach-O 文件上的 `inspect-binary-layout`、rea 6.5.0 包上的 `evidence-import`，以及一次 setup 干跑。显式的 `--provider` 胜过 `REA_ANALYSIS_PROVIDER`，两者都未设时 rea 使用支持该目标的那个唯一可用 provider {{cli Choose a provider}}。

## MCP 方法与工具 {#s-ref-commands-and-tools-mcp-methods-and-tools}

| Name | Answers | Hints | CLI command | Recorded output | Section |
|---|---|---|---|---|---|
| `initialize` | 协商的协议版本、服务器能力、`serverInfo`，以及指令字符串 | method | | [output](manuals/reverse-engineering-101/capture/out/10-mcp-01-initialize.json) | [8.1](#s-the-rea-mcp-server) |
| `tools/list` | 全部 207 个工具及其模式与注解 | method | | [output](manuals/reverse-engineering-101/capture/out/10-mcp-02-tools-list.json) | [8.1](#s-the-rea-mcp-server) |
| `open_binary` | 已打开的目标：路径、格式、种类、SHA-256、体系结构，provider 已绑定且未启动 | open world | none | [output](manuals/reverse-engineering-101/capture/out/10-mcp-03-open-binary-O1.json)，[output](manuals/reverse-engineering-101/capture/out/10-mcp-16-open-binary-O2.json) | [4.1](#s-open-binary-and-the-headless-bridge) |
| `binary_session` | 当前目标、绑定、运行 id、工具可用性、客户端特性，以及服务器身份 | open world | none | [output](manuals/reverse-engineering-101/capture/out/10-mcp-04-binary-session.json) | [8.1](#s-the-rea-mcp-server) |
| `list_procedures` | 每一个已分析过程作为地址与名字，带 thunk 与外部标志 | | none | [output](manuals/reverse-engineering-101/capture/out/10-mcp-05-list-procedures.json) | [4.2](#s-list-procedures-and-function-bodies) |
| `procedure_assembly` | 一个过程的汇编作为一条字符串 | | none | [output](manuals/reverse-engineering-101/capture/out/10-mcp-06-procedure-assembly-grade.json) | [4.3](#s-procedure-assembly) |
| `xrefs` | 引用一个地址的那些地址 | | `rea xrefs` | [output](manuals/reverse-engineering-101/capture/out/10-mcp-07-xrefs-grade.json) | [4.4](#s-xrefs-and-the-jump-table) |
| `list_strings` | 每一个已定义字符串，带编码、终止与字节长度 | | none | [output](manuals/reverse-engineering-101/capture/out/10-mcp-08-list-strings.json) | [4.5](#s-list-strings) |
| `analyze_function` | 一个过程的 dossier | | `rea function` | [output](manuals/reverse-engineering-101/capture/out/10-mcp-09-analyze-function-percent-change-O1.json)，[output](manuals/reverse-engineering-101/capture/out/10-mcp-10-analyze-function-grade-O1.json)，[output](manuals/reverse-engineering-101/capture/out/10-mcp-11-analyze-function-total-O1.json)，[output](manuals/reverse-engineering-101/capture/out/10-mcp-12-analyze-function-grade-label-O1.json)，[output](manuals/reverse-engineering-101/capture/out/10-mcp-13-analyze-function-missing.json)，[output](manuals/reverse-engineering-101/capture/out/10-mcp-17-analyze-function-percent-change-O2.json)，[output](manuals/reverse-engineering-101/capture/out/10-mcp-18-analyze-function-total-O2.json) | [4.6](#s-analyze-function-and-pseudocode) |
| `export_evidence_bundle` | 它写入的包的路径、字节数、记录数与未知事项数 | destructive | none | [output](manuals/reverse-engineering-101/capture/out/10-mcp-14-export-evidence-bundle-O1.json)，[output](manuals/reverse-engineering-101/capture/out/10-mcp-19-export-evidence-bundle-O2.json) | [5.4](#s-evidence-bundles-export-and-import) |
| `import_evidence_bundle` | 导入的记录与新的总数 | | none | [output](manuals/reverse-engineering-101/capture/out/10-mcp-23-import-evidence-bundle-O1.json) | [5.4](#s-evidence-bundles-export-and-import) |
| `compare_functions` | 八个维度上的两份 dossier | | none | [output](manuals/reverse-engineering-101/capture/out/10-mcp-20-compare-functions-percent-change.json)，[output](manuals/reverse-engineering-101/capture/out/10-mcp-21-compare-functions-total.json) | [5.5](#s-compare-and-compare-functions) |
| `verify_reconstruction` | 每条已声明主张的 pass、fail 或 unknown | | none | [output](manuals/reverse-engineering-101/capture/out/10-mcp-22-verify-reconstruction.json) | [7.1](#s-verify-reconstruction) |
| `close_binary` | `null`，在 provider 与临时项目消失之后 | destructive, not idempotent | none | [output](manuals/reverse-engineering-101/capture/out/10-mcp-15-close-binary-O1.json)，[output](manuals/reverse-engineering-101/capture/out/10-mcp-25-close-binary-O2.json) | [4.1](#s-open-binary-and-the-headless-bridge) |
| `inspect_wasm_artifact` | 一个 WebAssembly 模块的 WABT 验证、section 与接口，作为 Evidence | open world | `rea inspect-wasm-artifact` | [output](manuals/reverse-engineering-101/capture/out/10-mcp-24-inspect-wasm-artifact.json) | [6.2](#s-inspect-wasm-artifact) |

Hints 列读 `tools/list` 里每个工具的四个注解：`readOnlyHint`、`destructiveHint`、`idempotentHint` 与 `openWorldHint`。空单元格表示 read-only false、destructive false、idempotent true，以及 open world false，也就是大多数分析工具的形状。CLI 列里的 "None" 表示该工具是没有 CLI 命令的 65 个之一。

## 捕获设置的环境变量 {#s-ref-commands-and-tools-environment-variables-the-capture-set}

| Variable | Effect at 6.7.0 | Documented in |
|---|---|---|
| `GHIDRA_INSTALL_DIR` | Ghidra 安装，绝对路径 | {{install Ghidra}} |
| `JAVA_HOME` | JDK，绝对路径 | {{install Ghidra}} |
| `REA_GHIDRA_STARTUP_TIMEOUT_MS` | 启动截止期，默认 330,000 ms | {{mcp Ghidra first-query deadlines and recovery}} |
| `REA_ANALYSIS_PROVIDER` | `--provider` 与 `provider_id` 覆盖的常设 provider 选择 | {{cli Choose a provider}} |
| `REA_MCP_INPUT_SCHEMA_PROFILE` | `compact` 在 13,312 字节内渲染每一个广告的输入模式 | {{mcp Compact input schema profile}} |
| `REA_MCP_MAX_RESPONSE_BYTES` | 响应预算，至少 10,485,760，在启动时读取 | {{mcp Tool results}} |
| `REA_WABT_BIN_DIRECTORY` | 持有来自 WABT 1.0.42 的 `wasm-validate`、`wasm-objdump` 与 `wasm2wat` 的绝对目录 | rea docs/wasm-artifacts.md, Offline WebAssembly artifacts |
| `HOME` 与 `CLAUDE_CONFIG_DIR` | 仅用于 setup 运行，一个私有工作目录，因此 setup 只找到并写入复制的测试文件 | {{install Limit REA to one project or agent profile}} |

捕获套件还从每一个 rea 进程的环境里移除了 `PWD` 与 `JAVA_TOOL_OPTIONS`（[捕获](manuals/reverse-engineering-101/capture/README.md)）。然后记录里的路径与 Java 启动在各次运行之间保持相同。

套件没有设 `REA_KUNA_COMMAND`，也就是你提供的 `kuna` 可执行文件的绝对路径。没有它时 Kuna provider 报告 `not_configured`（[第 2.3 节](#s-rea-capabilities)）。

Sources: capture/out/00-commands.txt, 02-capabilities.json, 13-evidence-import-rea-6.5.0.json, 18-setup-claude-jsonc.json, 18-setup-claude-duplicate.json, 10-mcp-session.txt, 10-mcp-02-tools-list.json, 10-mcp-04-binary-session.json, 04-inspect-binary-layout.json, 16-inspect-wasm-artifact.json, 10-mcp-24-inspect-wasm-artifact.json, 00-versions.txt; capture/README.md; rea docs/cli.md (Native analysis, Choose a provider, Import, export and compare Evidence, Output and exit status), docs/installation.md (Limit REA to one project or agent profile), docs/kuna-provider.md, docs/mcp-contracts.md (Compact input schema profile, Tool results), docs/wasm-artifacts.md (Offline WebAssembly artifacts); rea at 27dc42d: src/cliCommandNames.ts, src/config/environment.ts, src/config/providerStartupTimeout.ts, src/contracts/toolEffects.ts, src/contracts/wasm/wasmToolContracts.ts
