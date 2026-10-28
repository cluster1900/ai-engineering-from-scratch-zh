# Evidence fields

> 6.7.0 时每一份 Evidence 记录的 16 个字段，带着它们的类型、允许的值，以及来自 `_percent_change` 已捕获 dossier 的各一个值。

Evidence 模式是带 16 个字段的一个严格 Zod 对象。模式拒绝带未知字段的记录。`relationship_coverage` 是第十六个字段。一份记录必须带着它，作为对象或作为 `null`，且两种情况下 id 哈希都覆盖它。

dossier 列取其自 `ledger-arm64-O1` 里 `_percent_change` 的 `analyze_function` 记录 `ev_b492c85e`（[捕获](manuals/reverse-engineering-101/capture/out/10-mcp-09-analyze-function-percent-change-O1.json)）的值。derived 列取自 `verify_reconstruction` 记录 `ev_ccbaea4b`（[捕获](manuals/reverse-engineering-101/capture/out/10-mcp-22-verify-reconstruction.json)）。[第 5.1 节](#s-the-evidence-record) 用散文读该记录。

## 16 个字段 {#s-ref-evidence-fields-the-16-fields}

| Field | Type | In the dossier of _percent_change | In the verification record |
|---|---|---|---|
| `evidence_id` | `ev_` 与 64 个十六进制数字，语义投影的 SHA-256 | `ev_b492c85eb9570bd5f8e866f94523122c8600ea0106603d90e9ea5445cf757b2a` | `ev_ccbaea4b45697017422c68a0dcabbe574c7e1b498aa3f0f3a0b47e351b389e23` |
| `subject` | 被分析的文件，`{ name, digest.sha256, format, architecture, local_path }`，或 `null` | `ledger-arm64-O1`，`01b5d08b…`，`mach-o`，`arm64`，`$CAPTURE/fixtures/ledger-arm64-O1` | `null` |
| `provider` | `{ id, name, version }`，version 可空 | `ghidra`，`Ghidra`，`12.1.4` | `rea-reconstruction-verifier`，`REA reconstruction verifier`，`1` |
| `analysis_profile` | `{ provider, parameters, digest }` 或 `null`，始终存在 | 25 个参数，摘要 `3fc72c9b…` | `null` |
| `predicate_type` | 非空字符串 | `rea.analysis` | `rea.reconstruction-verification` |
| `operation` | 工具名 | `analyze_function` | `verify_reconstruction` |
| `parameters` | 调用者的输入对象 | `{ "procedure": "_percent_change" }` | `specification_sha256` 与四个 `claim_ids` |
| `raw_result` | provider 原生值或 `null` | 带 `procedure`、`pseudocode` 及其余的桥接值 | `null` |
| `normalized_result` | 读者使用的规范结果 | 从 `procedure` 到 `limitations` 的 16 个键 | `status`、`specification_sha256`、`summary`、`claims`、`recommended_probes`、`evidence_links`、`limitations` |
| `confidence` | `observed`、`derived` 或 `inferred` | `observed` | `derived` |
| `authority` | 下面列出的五个值之一 | `shipped-artifact` | `analyst-inference` |
| `environment` | `{ id, platform, architecture, isolation }` 或 `null` | `null` | `null` |
| `limitations` | 字符串数组 | 十条字符串，从自动分析到 macOS 反编译器 | 两条字符串，工件身份与通过规则 |
| `relationship_coverage` | 带状态 `complete`、`partial` 或 `unknown` 的 `{ status, ... }`，或 `null` | `complete`，带一条关于已解析调用引用的诊断 | `null` |
| `locations` | 五种位置形状的数组，列于下面 | `[]` | `[]` |
| `evidence_links` | 本记录派生自的那些 `ev_` id | `[]` | 六个 id：四份 dossier 与两次比较 |

一份 dossier 的 `normalized_result` 有键 `procedure`、`pseudocode`、`assembly`、`comments`、`callers`、`callees`、`incoming_references`、`outgoing_references`、`unresolved_calls`、`referenced_strings`、`referenced_names`、`basic_blocks`、`native_api`、`native_value_flow`、`facet_availability` 与 `limitations`。`facet_availability` 说出 provider 提供了八个 facet 中的哪些。那些内部限制描述 facet，而记录自己的 `limitations` 描述 provider 会话。

## 枚举 {#s-ref-evidence-fields-the-enumerations}

| Field | Allowed values |
| --- | --- |
| `confidence` | `observed`、`derived`、`inferred` |
| `authority` | `shipped-artifact`、`controlled-replay`、`historical-reference`、`external-service`、`analyst-inference` |
| `environment.isolation` | `none`、`process`、`container`、`virtual-machine` |
| `locations[].kind` | 带 `address` 的 `address`，带 `start` 与 `end` 的 `address-range`，带 `path` 的 `artifact-path`，带 `offset` 的 `file-offset`，带 `start` 与 `end` 的 `file-offset-range` |
| `subject.format` | `hopper`、`analysis-database`、`mach-o`、`elf`、`pe`、`dos-mz`、`dos-com`、`raw-binary`、`zip`、`ipa`、`apk`、`msix`、`appx`、`hap`、`hsp`、`app-pack`、`asar`、`dmg`、`pkg`、`plist`、`javascript`、`source-map`、`directory`、`file`、`unknown`、`mach-o-universal`、`javascript-bundle`、`entitlements` |
| `subject.architecture` | `x86`、`x86_64`、`arm`、`arm64`、`mips`、`riscv`、`powerpc`、`hexagon`，或 `null`，以及仅对 `raw-binary` 主体的 `6502` 或 `m68k` |

格式拥有体系结构主张。rea 知道十个家族。`6502` 与 `m68k` 只用于 raw，因为头检测从不报告它们。一个 `raw-binary` 主体可以有十个中的任一个，其他每一种格式排除那两个。`hexagon` 来自 ELF 头。

## id 字段 {#s-ref-evidence-fields-the-id}

id 对记录的语义投影做哈希。该投影保留主体的 `digest`、`format` 与 `architecture`，以及除 `evidence_id` 之外的每一个其他字段，并丢掉主体的 `name` 与 `local_path`。因此同样字节上的同一次观察在任何机器上的任何目录里得到同一个 id。捕获检查不掩地比较 id（[捕获](manuals/reverse-engineering-101/capture/README.md)）。`parseEvidence` 重新计算它读的每一份记录的哈希，并拒绝不匹配。没有主体的记录在创建时追加限制 "Artifact identity is unavailable for this observation."。

投影在 `relationship_coverage` 为 `null` 时也保留它。更早的发行版把值为 `null` 的覆盖留在哈希之外，所以其记录通不过这次检查。`evidence-import` 以 `evidence_integrity_mismatch` 拒绝这样的包（[捕获](manuals/reverse-engineering-101/capture/out/13-evidence-import-rea-6.5.0.json)）。用你跑的发行版重新生成已保存的 Evidence。

捕获里还出现另外两个 id 前缀。`unk_` id 点名残余未知事项，并对 `{ domain, question, scope_digest }` 做哈希，以及当未知事项有一个时的 `comparison_conclusion_scope`（[第 5.2 节](#s-residual-unknowns-and-coverage)）。`analysis_profile.digest` 是 provider 及其参数的规范 JSON 的 SHA-256。摘要不同的两份记录在 `compare_functions` 里不可比。

Sources: capture/out/10-mcp-09-analyze-function-percent-change-O1.json, 10-mcp-22-verify-reconstruction.json, 13-evidence-import-rea-6.5.0.json; capture/README.md; rea at 27dc42d: src/domain/evidence.ts, src/domain/relationshipCoverage.ts, src/domain/binaryTargetTypes.ts, src/domain/elfFixedHeader.ts, src/domain/residualUnknown.ts, src/domain/analysisProfile.ts
