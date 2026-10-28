---
id: reverse-engineering
title: Reverse Engineering with rea
code: RE
subtitle: rea 6.7.0 配 Ghidra 12.1.4：检查二进制、读 Evidence 记录并比较包。
hue: 200
sources: manuals/reverse-engineering-101, phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch, phases/13-tools-and-protocols/33-disassembly-and-control-flow, phases/13-tools-and-protocols/34-lifting-to-pseudocode, phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns, phases/13-tools-and-protocols/36-rebuild-and-prove-equal, phases/13-tools-and-protocols/37-the-reverse-engineering-landscape, phases/13-tools-and-protocols/38-calling-conventions-and-stack-frames, phases/13-tools-and-protocols/39-compiler-idioms-and-optimization, phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries, phases/13-tools-and-protocols/41-recovering-data-and-types, phases/13-tools-and-protocols/42-dynamic-analysis-of-your-own-program, phases/13-tools-and-protocols/43-bytecode-and-managed-formats, phases/13-tools-and-protocols/44-binary-diffing-and-symbolic-execution, phases/13-tools-and-protocols/45-ai-assisted-reverse-engineering
source_hash: 65dedcb05fc8fd0b
---

## rea 停在哪里，Ghidra 从哪里开始
type: architecture
from: manuals/reverse-engineering-101/sections/1-1-rea-providers-and-evidence.md

```arch
node | cli | 1,1 | rea CLI | one question per call | client
node | mcp | 2,1 | rea MCP server | 207 tools, 6 prompts | client
node | session | 3,1 | BinarySession | one active target | process
node | art | 1,2 | rea-artifact-graph | no Ghidra needed | process
node | prov | 2,2 | GhidraProvider | analyzeHeadless and a socket | process
edge | cli | session | one question
edge | mcp | session | one session
edge | session | prov | bind Ghidra
edge | session | art | inspect
```

## 一次检查，逐步来
type: flow
from: manuals/reverse-engineering-101/sections/1-1-rea-providers-and-evidence.md, manuals/reverse-engineering-101/sections/3-1-inspect-artifact.md

1. **调用方**：跑 `rea inspect-artifact fixtures/ledger-arm64-O1 --format json`。不会启动 Ghidra。
2. **rea-artifact-graph**：用 SHA-256 哈希文件，并从魔数检测格式。
3. **Manifest**：一个节点与一次出现，`integrity_policy` 设为 `fail`。
4. **答案**：Evidence 记录在一秒内返回，没有 Java。

## 一个二进制，从头到尾
type: annotated-code
lang: bash
from: manuals/reverse-engineering-101/sections/r-1-commands-and-tools.md

```bash
rea doctor --provider ghidra                        # is the provider healthy
rea inspect-artifact <path>                         # artifact graph of the file, no Ghidra
rea analyze <path> --provider ghidra                # segments, procedure and string counts
rea function <path> <name> --provider ghidra        # the dossier of one procedure
rea decompile <path> <name> --provider ghidra       # pseudocode of one procedure
```

## 使用 Evidence 包
type: task-table
from: manuals/reverse-engineering-101/sections/r-1-commands-and-tools.md

| 任务 | 代码 |
|---|---|
| 列出包的记录且不含载荷 | `rea inspect-evidence-bundle '{"path":"<bundle>", "detail": "summary"}'` |
| 写出带排序键的规范副本 | `rea evidence-export <bundle> <out>` |
| 校验包里每一条记录 id 与 manifest | `rea evidence-import <bundle>` |
| 按记录成员比较两个包 | `rea compare <left> <right>` |
| 把虚拟地址映射到文件偏移 | `rea address-to-file-offset <path> <address> --provider ghidra` |

## 向 rea 问一个问题
type: task-table
from: manuals/reverse-engineering-101/sections/1-1-rea-providers-and-evidence.md

| 任务 | 代码 |
|---|---|
| 检查 Ghidra 与环境 | `rea doctor --provider ghidra --format json --filter-output healthy,environment_healthy,scope,scope_checks` |
| 列出能力 | `rea capabilities --format json` |
| 检查一个工件 | `rea inspect-artifact fixtures/ledger-arm64-O1 --format json` |
| 在 macOS 上检查 Mach-O 布局 | `rea inspect-macho` |

## 命令与环境变量
type: command-table
from: manuals/reverse-engineering-101/sections/1-1-rea-providers-and-evidence.md, manuals/reverse-engineering-101/capture/README.md

| 命令 | 作用 |
|---|---|
| `rea function` | 为每个过程调用一次 `analyze_function` 取 dossier |
| `rea decompile` | 调用 `procedure_pseudo_code` 取伪代码 |
| `rea analyze` | 调用 `binary_overview` 看整个二进制 |
| `GHIDRA_INSTALL_DIR` | Ghidra 安装目录，否则用 Homebrew 路径 |

## 钉住版本与限制
type: defaults
from: manuals/reverse-engineering-101/README.md, manuals/reverse-engineering-101/capture/README.md, manuals/reverse-engineering-101/sections/1-1-rea-providers-and-evidence.md, manuals/reverse-engineering-101/sections/3-1-inspect-artifact.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| rea | 6.7.0 | `rea-agents` 包版本 |
| Ghidra | 12.1.4 | PUBLIC 构建 |
| JDK | OpenJDK 21.0.12.1 | `JAVA_HOME` 或 Homebrew 路径 |
| 一次性 Ghidra 调用 | 7 到 9 s | 导入到全新项目 |
| `integrity_policy` | fail | `inspect-artifact` 的参数 |

## 排障
type: troubleshooting
from: manuals/reverse-engineering-101/sections/r-1-commands-and-tools.md, manuals/reverse-engineering-101/sections/1-1-rea-providers-and-evidence.md

| 症状 | 原因 | 修复 |
|---|---|---|
| `rea doctor` 某项检查失败 | 缺少 rea 6.7.0、Ghidra 12.1.4 或 JDK 21 | 安装钉住版本并再跑 `rea doctor` |
| 第一次 Ghidra 调用要 7 到 9 s | Ghidra 把文件导入全新项目 | 保持一个 MCP 会话打开 |
| `inspect-binary-layout` 返回 `capability_unavailable` | 它用 pwntools 配置，仅 Linux x64 | 在 Linux x64 上跑，或在 macOS 上用 `rea inspect-macho` |

## 问与答
type: qa
from: manuals/reverse-engineering-101/sections/1-1-rea-providers-and-evidence.md, manuals/reverse-engineering-101/sections/3-1-inspect-artifact.md

- **`inspect-artifact` 需要 Ghidra 吗？** 不需要。它在一秒内返回，没有 Java。
- **哪条命令给出一个函数的伪代码？** `rea decompile`，它调用 `procedure_pseudo_code`。
- **对新文件的第一次调用是什么？** 跑 `rea inspect-artifact`。它不需要引擎。

## 提示
type: tips
from: manuals/reverse-engineering-101/sections/1-1-rea-providers-and-evidence.md

- 向 rea 要一份 Evidence 记录；有疑虑时读 Ghidra 自己的 listing。
- 一个问题用 CLI；许多问题的会话用 MCP 服务器。
- 对一个文件的第一个 Ghidra 问题预期 7 到 9 s，之后是毫秒级。
