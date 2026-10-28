# Reverse Engineering 101 capture kit

手册里每一段 listing 都从 `out/` 里的文件裁出。本套件在跑它的主机上驱动真实的 `rea` 6.7.0 命令行及其 MCP 服务器，配 Ghidra 12.1.4 provider，并记录它们返回的内容。它只用 Python 标准库。

```bash
python3 run.py                   # writes out/
python3 run.py --check           # captures again into a temporary directory and compares with out/ after masking
python3 run.py --build-fixtures  # rebuilds the fixture binaries and the WASM module, then prints their SHA-256
```

主题需要 Ghidra、JDK 与 Node，所以不能在仓库 CI 里跑。`--check` 在缺少 rea 6.7.0、Ghidra 12.1.4 或 JDK 21 时打印 `skipped: <reason>` 并以 0 退出。普通运行打印原因并以 1 退出。一次运行会先清空 `out/` 里的每个文件，所以 `out/` 始终持有一次完整捕获。

## 录制所用

| 项 | 值 |
|---|---|
| 主机 | 一台 Apple silicon 笔记本，macOS 26.2（build 25C56），arm64 |
| rea | 来自 npx 缓存的 rea-agents 6.7.0，以 `node .../node_modules/rea-agents/scripts/rea.mjs` 启动，Node 22.22.0 |
| Ghidra | 来自 Homebrew 的 12.1.4 PUBLIC（build 2026-Sep-21），`GHIDRA_INSTALL_DIR=/opt/homebrew/Cellar/ghidra/12.1.4/libexec` |
| JDK | 来自 Homebrew 的 OpenJDK 21.0.12.1，`JAVA_HOME=/opt/homebrew/opt/openjdk@21` |
| clang | Apple clang 17.0.0（clang-1700.6.3.2），目标 arm64-apple-darwin25.2.0 |
| WABT | 1.0.42（Homebrew formula `wabt` 1.0.42_1），`REA_WABT_BIN_DIRECTORY=/opt/homebrew/bin` |
| 录制于 | 2026-10-18 |

`00-versions.txt` 持有录制主机上每个工具打印的版本输出。

`run.py` 按顺序找工具的方式：已设置时用 `REA_COMMAND`（一份 argv 字符串），然后当 `PATH` 上的 `rea` 其 `--version` 打印 6.7.0 时用它，再然后用版本为 6.7.0 的 npx 缓存 `~/.npm/_npx/*/node_modules/rea-agents`。Ghidra 来自 `GHIDRA_INSTALL_DIR` 或 Homebrew 路径，且 `Ghidra/application.properties` 必须写 `application.version=12.1.4`。JDK 来自 `JAVA_HOME` 或 `/opt/homebrew/opt/openjdk@21`。WABT 来自 `REA_WABT_BIN_DIRECTORY` 或 `/opt/homebrew/bin`。没有 WABT，`inspect-wasm-artifact` 跑不了它的工具。

每一条 rea 命令都以本目录为工作目录运行，设置了 `GHIDRA_INSTALL_DIR`、`JAVA_HOME` 与 `REA_WABT_BIN_DIRECTORY`，并从环境里去掉了 `PWD` 与 `JAVA_TOOL_OPTIONS`。路径以绝对形式传入，在 `00-commands.txt` 里显示为相对路径。

## 耗时

完整跑一次在录制主机上大约 125 s。每个需要 Ghidra 的一次性 CLI 调用把目标导入全新的无头项目，并花 7 到 9 s。`00-commands.txt` 持有每次调用的时间。在 MCP 会话里，`open_binary` 之后第一次带 Ghidra 的调用花 5 到 7 s，同一目标上之后每一次调用不到 100 ms（`10-mcp-session.txt`）。`--check` 会再跑整次捕获，所以在 `manual.json` 里给它时间：

```json
"capture": {
  "run": ["python3", "capture/run.py"],
  "check": ["python3", "capture/run.py", "--check"],
  "timeoutSeconds": 900
}
```

## out/ 里的文件

| 文件 | 内容 |
|---|---|
| `00-commands.txt` | 按顺序的每条 CLI 命令，带退出码、耗时、stderr，以及写出的文件 |
| `00-versions.txt` | rea、node、clang、llvm-objdump、macOS、Ghidra、JDK 与 WABT 的版本 |
| `00-fixtures.txt` | 每个 fixture 文件的 SHA-256 与大小 |
| `01-doctor-ghidra.json` | `rea doctor --provider ghidra`，过滤到 `healthy`、`environment_healthy`、`scope` 与 `scope_checks`。信息性检查会点名本用户的 agent 注册，过滤器已去掉它们 |
| `02-capabilities.json` | `rea capabilities`：每个操作及其可用性、效果与限制 |
| `03-inspect-artifact.json` | 对 arm64 可执行文件的 `inspect-artifact` |
| `04-inspect-binary-layout.json` | macOS 上的错误信封：`capability_unavailable`，pwntools 配置只支持 Linux x64 |
| `04-inspect-macho.json` | 对 arm64 可执行文件的 `inspect-macho`，macOS 上可用的布局工具 |
| `05-analyze-arm64-O1.json`, `05-analyze-x86_64-O1.json` | Mach-O 可执行文件与 ELF 可重定位目标的 `binary_overview` Evidence |
| `06-function-*.json` | arm64 -O1 可执行文件里 `_percent_change`、`_grade`、`_total` 与 `_grade_label`，以及 x86-64 -O1 目标里 `grade` 的 `analyze_function` dossier |
| `07-decompile-total.json`, `07-decompile-grade-x86_64-O1.json` | `_total`（arm64）与 `grade`（x86-64）的 `procedure_pseudo_code` |
| `08-address-to-file-offset.json` | `0x100000518`，`_grade` 的入口，解析为文件偏移 1304 |
| `10-mcp-NN-<tool>.json` | 每次一次 MCP 交换：`request`、`response`、服务器若发送则有的 `notifications`，以及结果为错误时的 `decoded_text`（解析后的 `content[0].text`） |
| `10-mcp-session.txt` | 交换顺序，带 method、tool、status、file 与时间 |
| `10-mcp-server.log` | `rea mcp` 的 stderr：每次工具调用一行 pino JSON |
| `11-bundle-O1.json`, `11-bundle-O2.json` | `export_evidence_bundle` 写出的 bundle，按写出字节，捕获路径已掩码并加了换行 |
| `11-inspect-evidence-bundle-O1.json`, `-O2.json` | 每个 bundle 的 `rea inspect-evidence-bundle` 摘要：每条记录一行 |
| `11-bundles.txt` | 两个 bundle 文件的 SHA-256 与大小 |
| `12-evidence-export.json`, `12-evidence-export.txt` | 把 bundle O1 `rea evidence-export` 到规范文件，以及两个文件的 digest |
| `13-evidence-import.json` | 对 bundle O1 的 `rea evidence-import` |
| `13-evidence-import-rea-6.5.0.json` | 对 `fixtures/bundle-rea-6.5.0-O1.json`（rea 6.5.0 写出的 bundle O1）的 `rea evidence-import`：`evidence_integrity_mismatch` 拒绝 |
| `14-compare-bundles.json` | 对 bundle O1 与 bundle O2 的 `rea compare` |
| `15-js-app.json` | 去掉 `graph` 与 `semantic_graph` 的 `analyze_javascript_application` 记录，用 `--filter-output` 选出 |
| `15-js-app-graph.json` | 同一记录的 `normalized_result.graph`：42 个节点与 59 条边 |
| `15-js-app-view-summary.json`, `15-js-app-view-modules.json` | 对完整记录的 `rea inspect-analysis-view` 摘要与 modules 页 |
| `16-inspect-wasm-artifact.json` | 对 `wasm/ledger.wasm` 的 `inspect-wasm-artifact`：provider `wabt-artifact` 的 Evidence 记录 |
| `16-wabt.txt` | rea 在该模块上跑的三条 WABT 命令，直接运行 |
| `17-harness-grid.json` | 第 36 课 harness 的 92 个输入格：`percent_change` 对、`grade` 分数、hazard 类计数，以及十个 naive 用例 |
| `17-harness-execute-plausible.json`, `17-harness-execute-equal.json` | execute-and-compare 运行：原件与候选编进同一程序并在网格上跑，带每一行、不匹配，以及模型分歧。Plausible 是 `percent_change_wide.c` 配 `grade_thresholds.c`，equal 是 `percent_change_mul_first.c` 配 `grade_switch.c` |
| `17-harness-bytes.json` | 对八个候选相对 `ledger-x86_64-O1.o` 的 recompile-and-compare：函数字节、重定位记录、掩去范围、引用表、状态与原因 |
| `17-harness.txt` | harness 是什么、从哪加载，以及跑它的主机与编译器 |
| `18-setup-claude-jsonc.json` | 对带注释与末尾逗号的 Claude Code 配置跑 `rea setup --client claude_code --skill=false --dry-run`：`needs_human`，注册 `invalid` |
| `18-setup-claude-duplicate.json` | 对带两个 `rea` 成员的配置跑 `rea setup --client claude_code --skill=false --yes`：`ready` |
| `18-setup-configs.txt` | setup 之后两份配置文件的样子 |

## MCP 会话

`run.py` 里的 `Mcp` 是一个在按换行分隔的 stdio 上跑的小型 JSON-RPC 2.0 客户端。它启动 `rea mcp`，发送协议版本为 2025-06-18 的 `initialize`、`notifications/initialized` 通知，然后是下面的调用。会话按顺序记录每一次调用：

1. `tools/list`，207 个工具。
2. 对 `fixtures/ledger-arm64-O1` 做 `open_binary`，带 `provider_id: "ghidra"`，然后 `binary_session`。
3. `list_procedures`、对 `_grade` 的 `procedure_assembly`、对 `_grade` 入口的 `xrefs`、`list_strings`。
4. 对四个 ledger 函数做 `analyze_function`，然后对 `_nothing` 做，后者以 `invalid_request` 失败。
5. `export_evidence_bundle` 到工作文件，复制为 `11-bundle-O1.json`，然后 `close_binary`。
6. 对 `fixtures/ledger-arm64-O2` 做 `open_binary`，对 `_percent_change` 与 `_total` 做 `analyze_function`，`export_evidence_bundle` 到 `11-bundle-O2.json`。
7. 对 `_percent_change`（八个维度全部未变）与对 `_total`（五个维度变了）做 `compare_functions`。
8. 带那两份比较记录上的四个 `structural-function` 主张做 `verify_reconstruction`：两个 `percent_change` 主张通过，两个 `total` 主张失败。
9. 导入 bundle O1 的 `import_evidence_bundle`，对 `wasm/ledger.wasm` 做 `inspect_wasm_artifact`，`close_binary`。

## setup 步骤

`step_setup` 对 `fixtures/setup/` 里文件的两份副本跑面向 Claude Code 的 `rea setup`。每次运行在工作目录里拿到自己的 `HOME` 与 `CLAUDE_CONFIG_DIR`，所以 setup 从不读或写主机用户的配置。`--skill=false` 把 skill 安装排除在运行之外。JSONC 情况是 dry run。重复情况用 `--yes` 应用编辑，且 `18-setup-configs.txt` 显示 setup 写了最后一个 `rea` 成员，并按原样留下了第一个。

## 第 36 课 harness

`17-*` 文件不是 rea 输出。`run.py` 从本仓库加载 `phases/13-tools-and-protocols/36-rebuild-and-prove-equal/code/main.py`，并对其两个证明跑 `fixtures/ledger-x86_64-O1.o`，字节与该课副本相同。第一条腿用主机 clang 以 `-O1` 编译 `fixtures/ledger.c` 与每个函数的一个候选，用 `-Dpercent_change=cand_percent_change -Dgrade=cand_grade` 重命名候选，与该课的 `driver.c` 链接，并跑那 92 个格子。在这台 arm64 主机上，原件是原生编译的源码（`original_kind: fixture-source`），所以 trap 格返回 `-2147483648` 而不是除零 trap。第二条腿用 `clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c` 编译八个候选源码中的每一个，用该课的 ELF 读取器读两个目标，把重定位字段清零，比较字节、重定位记录，以及 `grade` 重定位指向的五个表项。该步骤需要 clang，大约两秒。当 clang 或该课代码缺失时，`17-harness.txt` 会说明，且不写其他 `17-*` 文件。

## run.py 做的裁剪

每一处裁剪都在原位用以 `<cut by run.py:` 开头的字符串标出。

- `tools/list`：只为会话调用的十二个工具保留 `inputSchema` 与 `outputSchema`。另外 195 个工具保留 `name`、`title`、`description` 与 `annotations`。
- `binary_session`：当 `tool_availability` 或 `server_identity.catalog.tools` 是列表时，套件保留其中三条。在 6.7.0，`tool_availability` 持有组，目录只持有计数与 digest，所以这处裁剪什么都不去掉。
- 每一个其 `content[0].text` 是 `structuredContent` 的 JSON 文本的工具结果，保留 `structuredContent` 并替换文本副本。标记点名该副本的字节数。
- `compare_functions` 请求为 `left` 与 `right` 保留 `evidence_id`，并点名持有每份完整 dossier 的文件。

Evidence 记录内部什么都不裁。`out/` 里每一个 `evidence_id` 都能从旁边的记录重新算出。

## 掩码

写出的文件从不持有主机路径或用户名。写出时套件把捕获目录替换为 `$CAPTURE`，输出目录替换为 `$OUT`，工作目录替换为 `$WORK`，主目录替换为 `$HOME`，作为路径段的用户名替换为 `$USER`，以及把 npx 缓存哈希替换为 `_npx/<hash>`。

`--check` 在掩码之后比较新文件与 `out/`，两边都掩掉每次运行都会变的值：RFC 3339 时间戳、服务器日志里的纪元毫秒、`durationMs`、索引文件里的 `(N s)` 与 `(N ms)` 时间、诸如 `analysis_run.run_id` 的 UUID、macOS 临时目录、`rea-ghidra-*` 运行时根，以及进程 id。Evidence id 是内容哈希，比较时不掩码。录制主机上的两次运行产生了相同的记录，检查通过。

## 已录失败

- `04-inspect-binary-layout.json`：`capability_unavailable`，类别 `unsupported_provider`。pwntools ELF profile 只支持 Linux x64，所以套件把 `inspect-macho` 录为 macOS 布局工具。
- `10-mcp-13-analyze-function-missing.json`：带 `procedure: "_nothing"` 的 `analyze_function` 返回 `isError: true`，以及 `content[0].text` 里的 `invalid_request` 信封。
- `12-evidence-export.txt`：`rea evidence-export` 写出的规范文件与 MCP 上 `export_evidence_bundle` 写出的文件有相同的 JSON 内容，字节顺序不同。CLI 排序键且不写末尾换行。
- `13-evidence-import-rea-6.5.0.json`：`evidence_integrity_mismatch`，类别 `integrity_mismatch`，位于 `records.3.evidence_id`。rea 6.7.0 把 `null` 的 `relationship_coverage` 放进记录的身份，所以没有 coverage 的第一条 6.5.0 记录不再通过校验。
- `18-setup-claude-jsonc.json`：`needs_human`。Claude Code 读严格 JSON，所以 setup 在做备份或写入之前就拒绝注释与末尾逗号。
- `14-compare-bundles.json`：`status: "unknown"`，带 10 条未解析记录。两份 bundle 来自不同构建，所以没有记录同属两者，且 bundle 不携带清单完整性标记。

## 夹具

所有 fixture 都是为本手册写的程序。`ledger.c` 持有四个函数：`percent_change`（带零守卫的除法）、`grade`（对 `score / 10` 的 switch，编译成查找表并对 `0x66666667` 做乘法）、`total`（对内存的循环），以及 `grade_label`（一次调用与一次数据引用）。`ledger-main.c` 是一个小型 `main`，解析其参数并打印结果。

| 路径 | 构建命令，在 `fixtures/` 里跑 | 可复现 |
|---|---|---|
| `ledger-x86_64-O0.o`, `-O1.o`, `-O2.o` | `clang -target x86_64-unknown-linux-gnu -O<n> -fno-asynchronous-unwind-tables -c ledger.c -o ledger-x86_64-O<n>.o` | 逐字节 |
| `ledger-arm64-O1.o`, `ledger-arm64-O2.o` | `clang -O<n> -fno-asynchronous-unwind-tables -c ledger.c -o ledger-arm64-O<n>.o` | 逐字节 |
| `ledger-arm64-O1`, `ledger-arm64-O2` | `clang -O<n> -o ledger-arm64-O<n> ledger.c ledger-main.c` | 同名输出时逐字节。链接器的临时代码签名嵌入了文件名，所以链到别的名字会得到不同字节 |
| `wasm/ledger.wasm` | `wat2wasm wasm/ledger.wat -o wasm/ledger.wasm` | 逐字节 |
| `js-app/` | 无，六个源文件 |  |

提交的字节就是 `out/` 里每份记录所描述的那些。`--build-fixtures` 原地重建全部并打印哪些文件变了。在录制工具链上，每一次重建都复现了已提交字节。不同的 clang 会改可执行文件与目标文件，并随之改 `out/` 里每一个 SHA-256、`evidence_id` 与 bundle digest，所以这类改动之后必须再跑 `run.py`。

`js-app/` 是一个小型 Electron 风格应用：`main.js` 用 preload 脚本创建一个 `BrowserWindow` 与三个 `ipcMain` 处理函数，`preload.js` 通过 `contextBridge` 暴露一个 `ledger` API，`renderer.js` 调用 `fetch`、`localStorage` 与已暴露的 API，`ledger.js` 把四个 C 函数移植到 JavaScript。`wasm/ledger.wat` 是手写的 WebAssembly 文本模块，以同名四个函数为导出，带一个导入（`env.log`）、一块内存，以及带成绩标签的数据段。

`bundle-rea-6.5.0-O1.json` 是本套件 6.5.0 版录下的 bundle O1，逐字节保留以展示 6.7.0 如何对待更旧的 bundle。`setup/claude-jsonc.json` 与 `setup/claude-duplicate.json` 是 setup 步骤用的两个小型 Claude Code 配置文件。三者都不由 `--build-fixtures` 重建。

`invoice` 与 `invoice.c` 是协调者的冒烟测试程序，本套件不用。`00-fixtures.txt` 把它们与其他一起列出。
