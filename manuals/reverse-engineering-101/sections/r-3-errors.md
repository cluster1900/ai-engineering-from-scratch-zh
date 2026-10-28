# 捕获中见到的错误

> 捕获里出现三种错误信封、两个不可用代码、一次 setup 拒绝，以及两个被拒绝的结论，且每一个 rea 错误都有同样五个字段。

捕获套件录了三次失败的调用，并完整保留每一次回复。三次都来自 rea 自己的错误投影，两次来自 CLI，一次来自 MCP 服务器。其他文件持有不是错误的代码。它们展示未安装的 provider、需要人的一次 setup 计划，以及没有结论的一次比较。本节列出它们全部，然后是它们遵循的模式。

## 三种错误信封 {#s-ref-errors-the-three-error-envelopes}

当 `inspect-binary-layout` 在 macOS 上遇到 Mach-O 文件时，CLI 把它的信封打印到 stdout 并以 1 退出：

```listing
title: capability_unavailable from the CLI
source: capture/out/04-inspect-binary-layout.json
lang: json
note: Nothing is cut. The exit status 1 is in [the command record](manuals/reverse-engineering-101/capture/out/00-commands.txt).
---
{
  "code": "capability_unavailable",
  "category": "unsupported_provider",
  "message": "The initial real-verified pwntools artifact profile supports Linux x64 only.",
  "retryable": false,
  "remediation": {
    "action": "The initial real-verified pwntools artifact profile supports Linux x64 only."
  },
  "details": {
    "provider_id": "pwntools-elf",
    "operation": "inspect_binary_layout",
    "reason": "The initial real-verified pwntools artifact profile supports Linux x64 only."
  }
}
```

经 MCP，同一投影作为文本旅行。一次失败的 `tools/call` 返回 `isError: true`，并把 `{ "error":... }` 对象作为 JSON 放在 `content[0].text` 里，没有 `structuredContent`，因为广告的输出模式只描述成功 {{mcp Tool results}}。捕获套件把那段文本解码到 `decoded_text`，放在原始回复旁边：

```listing
title: invalid_request for a procedure that does not exist
source: capture/out/10-mcp-13-analyze-function-missing.json
lang: json
note: The request and the raw response are cut, and so are most fields of details.diagnostics. The raw response holds the same object as one JSON string. The cut diagnostics hold the Ghidra run id, the bridge endpoint, the launch output, and the remote failure message.
---
  "decoded_text": {
    "error": {
      "code": "invalid_request",
      "category": "invalid_input",
      "message": "Analysis input is invalid. Check the arguments and try again.",
      "retryable": true,
      "remediation": {
        "action": "Correct the listed arguments and retry."
      },
      "details": {
        "operation": "analyze_function",
        "issues": [
          {
            "path": [],
            "reason": "invalid_value",
            "message": "Unknown Ghidra procedure name or address: _nothing"
          }
        ],
        "diagnostics": {
          …
          "configured_jvm_max_heap": "2G",
          …
          "output_incomplete": false,
          …
          "failure_output": {
            …
            "complete": true
          },
          …
          "remote_code": "not_found",
          …
```

桥接以 `issues[0].message` 里的消息抛出 `not_found`，而 rea 把远程的 `not_found` 映射到 `AnalysisInputError`，其代码是 `invalid_request`。服务器日志把失败记了两次，一次给桥接层，一次给服务器层，两者都在级别 40（[捕获](manuals/reverse-engineering-101/capture/out/10-mcp-server.log)）。

诊断告诉你 Ghidra 一侧能否解释一次失败。`configured_jvm_max_heap` 是 rea 给 JVM 的堆，当既未设 `GHIDRA_HEADLESS_MAXMEM` 也未设 `GHIDRA_MAXMEM` 时是 `2G`。`failure_output` 持有失败请求期间 Ghidra 写的 stdout 与 stderr，这里为空，而 `complete: true` 表示什么都没丢。`output_incomplete: false` 对整个进程输出说同样的话。带着空输出与一个远程代码，失败在你的输入里，不在引擎里。

CLI 拒绝了 rea 6.5.0 写的一个包，在把任何记录读进会话之前：

```listing
title: evidence_integrity_mismatch for an older bundle
source: capture/out/13-evidence-import-rea-6.5.0.json
lang: json
note: Cut to the head of the envelope. The remediation repeats the message, and the details are cut.
---
{
  "error": "Analysis failed",
  "code": "evidence_integrity_mismatch",
  "category": "integrity_mismatch",
  "message": "Evidence bundle does not match the bundle schema at records.3.evidence_id: Evidence semantic identifier does not match its record. Supply an unmodified bundle written by export_evidence_bundle or rea evidence-export.",
  "retryable": false,
…
```

包没有被修改。id 规则变了：哈希现在在 `relationship_coverage` 为 `null` 时也覆盖它。记录 0 到 2 是带覆盖对象的 `analyze_function` dossier。记录 3 是带 `null` 覆盖的 `list_procedures` 记录，所以其 id 是第一个失败的（[R.2](#s-ref-evidence-fields)）。CLI 以 1 退出。已保存的 Evidence 不迁移，所以用你跑的发行版重新生成它。

对服务器没有的工具的一次调用永远到不了 rea 的投影。MCP SDK 以 JSON-RPC 错误 `-32602` 与消息 `Tool <name> not found` 作答，没有工具结果。6.7.0 捕获没有这样的调用。

拼错的 CLI 命令得到带建议最近命令的 `cta` 对象的解析器信封 `COMMAND_NOT_FOUND`。`analysisErrorProjectionSchema` 不定义它们。读 rea 错误的脚本在读 `category` 之前需要一个拼错或缺失命令的分支。6.7.0 捕获也没有这样的调用。

## 不是错误的代码 {#s-ref-errors-codes-that-are-not-errors}

`rea capabilities` 用一个 `availability` 对象列出每一个 provider。捕获主机上三个 provider 缺席，它们的代码点名原因而不让命令失败：

```listing
title: two unavailable providers
source: capture/out/02-capabilities.json
lang: json
note: The availability objects of hopper and ida. The diagnostics that follow each one are cut, and so is the kuna object, which has the same code as ida.
---
      "availability": {
        "status": "unavailable",
        "code": "executable_missing",
        "reason": "Hopper launcher is missing or not executable: /Applications/Hopper Disassembler.app/Contents/MacOS/hopper",
…
      "availability": {
        "status": "unavailable",
        "code": "not_configured",
        "reason": "Set REA_IDA_MCP_CONFIG to an upstream IDA MCP JSON registration; see docs/ida-provider.md.",
```

对带注释的 Claude Code 文件跑的 `rea setup` 返回 `status: "needs_human"` 并以 1 退出（[捕获](manuals/reverse-engineering-101/capture/out/18-setup-claude-jsonc.json)，[第 8.1 节](#s-the-rea-mcp-server)）。它没有计划任何动作，并报告注册状态 `invalid`。它是一次 setup 结果而不是错误信封，所以脚本读 `status` 与 `remediation`，不读 `code`。

捕获里有两个结果拒绝了结论并以 0 退出。对两个包的 `rea compare` 返回带十份未解决记录的 `status: "unknown"`（[捕获](manuals/reverse-engineering-101/capture/out/14-compare-bundles.json)，[第 5.5 节](#s-compare-and-compare-functions)）。没有记录是两个包的成员，且包不带完整性标记。`verify_reconstruction` 返回带两条失败主张的 `status: "fail"`（[捕获](manuals/reverse-engineering-101/capture/out/10-mcp-22-verify-reconstruction.json)，[第 7.1 节](#s-verify-reconstruction)）。两者都不是错误信封，两者都是说问题仍打开或主张为假的结果。把非零退出当作唯一失败信号的脚本会漏掉两者。

## 每个 rea 错误共有的形状 {#s-ref-errors-the-shape-every-rea-error-has}

| 字段 | 含义 |
| --- | --- |
| `code` | 判别器，下面列出的 20 个代码之一 |
| `category` | 十个之一：`invalid_input`、`unsupported_provider`、`unsupported_target`、`integrity_mismatch`、`truncated`、`cancelled`、`timeout`、`resource_constraint`、`unavailable`、`execution_failure` |
| `message` | 给人看的一句普通句子，去掉了 provider 名与内部原因 |
| `retryable` | 对 `artifact_changed`、`invalid_request`、`provider_timeout`、`cancelled`、`revision_conflict` 与 `provider_unavailable` 为真，对 provider 标为可重试的 `capability_unavailable` 错误为真，以及对标为可重试、或在没有标记时关于容量的 `resource_constraint` 错误为真 |
| `remediation.action` | 说出该做什么的一句话 |
| `details` | 可选，对通用代码是自由 JSON，对 `artifact_integrity_mismatch` 是带 `logical_path`、`declared_sha256`、`calculated_sha256` 与 `unpacked` 的固定对象 |

这 20 个代码是 `invalid_request`、`access_denied`、`artifact_changed`、`unreadable_output`、`capability_unavailable`、`unsupported_target`、`provider_unavailable`、`provider_timeout`、`resource_constraint`、`cancelled`、`artifact_integrity_mismatch`、`artifact_operation_failed`、`evidence_integrity_mismatch`、`truncated`、`process_capture_failed`、`cleanup_incomplete`、`revision_conflict`、`configuration_invalid`、`target_unavailable` 与 `execution_failure`。每一个内部错误类映射到一个代码。`AnalysisInputError` 映射到 `invalid_request`，`AnalysisCapabilityUnavailableError` 到 `capability_unavailable`，`AnalysisTimeoutError` 到 `provider_timeout`，`ConfigurationError` 到 `configuration_invalid`。`NoBinaryOpenError` 映射到 `target_unavailable`，`ProviderAdapterError` 到 `execution_failure`。清理留下已拥有资源的失败不论底层代码是什么都取代码 `cleanup_incomplete`，并在 `details` 里列出它们。rea 文档把同一联合发布为 JSON Schema，`error-contract.schema.json`。

对 Ghidra provider，两个代码值得一提。`provider_timeout` 是当[第 8.1 节](#s-the-rea-mcp-server) 的启动截止期过后，第一次由 Ghidra 支撑的调用返回的。`target_unavailable` 是每一个 provider 工具在 `open_binary` 之前返回的，消息为 "No app is open. Ask the user which app to investigate, then call open_binary with its local path."。两者都没有出现在捕获里，因为套件设了很长的客户端截止期并先打开了目标。

Sources: capture/out/04-inspect-binary-layout.json, 10-mcp-13-analyze-function-missing.json, 13-evidence-import-rea-6.5.0.json, 18-setup-claude-jsonc.json, 02-capabilities.json, 14-compare-bundles.json, 10-mcp-22-verify-reconstruction.json, 10-mcp-server.log, 00-commands.txt; rea docs/mcp-contracts.md (Tool results); rea at 27dc42d: src/contracts/errorSchemas.ts, src/domain/analysisErrorProjection.ts, src/domain/analysisErrorPresentation.ts, src/domain/configurationErrors.ts, src/ghidra/GhidraProviderClient.ts, src/ghidra/GhidraDiagnostics.ts, src/ghidra/GhidraClient.ts, src/ghidra/GhidraJavaLaunch.ts, src/domain/evidence.ts, bridge/ghidra/ReaGhidraBridge.java, docs/user-visible-errors.csv, docs/error-contract.schema.json
