# Sources

> 一棵钉住的源树、其文档页、一次已录制的捕获，以及规范、论文与成文法，按权威排序。

钉住的是 `rea-agents` 6.7.0，2026-10-18 发布的 npm 包，其标签 `rea-agents-6.7.0` 是 `github.com/morluto/rea` 的提交 `27dc42d10249f0410904a75c0997842eb03b931c`。provider 是带 OpenJDK 21.0.12.1 的 Ghidra 12.1.4。事实于 2026-10-18 对照该提交的只读检出核对，每一节的源文件是其中的路径。

## 分级源 {#s-ref-sources-the-ranked-sources}

当两个源不一致时，更高的那个胜出，且该节会说明。

| Rank | Source | Used for | Source key |
|---|---|---|---|
| 1 | `27dc42d` 上的 rea 源 | 关于 rea 如何工作的每一条主张 | 该文件 |
| 2 | `27dc42d` 上的 rea 文档 | 已文档化的行为、限制，以及负责任使用规则 | `{{mcp ...}}`、`{{cli ...}}`、`{{install ...}}`，以及下面的其他键 |
| 3 | [捕获](manuals/reverse-engineering-101/capture/out)，录于 2026-10-18 | 每一段 listing 和图里的每一个数字 | 文件名 |
| 4 | 格式与体系结构规范 | ELF、Mach-O、x86-64、AArch64、调用约定 | `{{spec ...}}` |
| 5 | 程序分析与反编译器评估的论文 | 反汇编、提升、类型恢复，以及 2026 年的测量 | `{{paper ...}}` 与一个链接 |
| 6 | 成文法与法院判决 | 分析与互操作的法律 | `{{law ...}}` |
| 7 | 工具发行说明 | Ghidra 与其他工具版本 | 该文件 |

每一个源键都在没有本地文件的情况下声明，因为没有源文件被复制进本仓库。事实在撰写手册时对照钉住的标签核对，且该标签不变。

## rea 文档 {#s-ref-sources-the-rea-documentation}

每一个引用键点名 `rea-agents-6.7.0` 标签上 rea 仓库的一页。该仓库在 MIT 许可下，版权 2026 morluto。

| Key | Path in the rea repository |
|---|---|
| `readme` | `README.md` |
| `cli` | `docs/cli.md` |
| `mcp` | `docs/mcp-contracts.md` |
| `ghidra` | `docs/ghidra-provider.md` |
| `native` | `docs/native-investigation.md` |
| `install` | `docs/installation.md` |
| `readiness` | `docs/reconstruction-readiness.md` |
| `ledgers` | `docs/reconstruction-obligation-ledgers.md` |
| `jsgraph` | `docs/javascript-application-graph.md` |
| `design` | `docs/tool-design.md` |

`DISCLAIMER.md` 在标签的根上。[第 2.1 节](#s-the-readme-use-rule-and-the-law) 读它。

## 捕获 {#s-ref-sources-the-capture}

[捕获套件](manuals/reverse-engineering-101/capture) 在一台 Apple silicon Mac 上驱动 rea 6.7.0 及其 MCP 服务器，并向[其输出文件夹](manuals/reverse-engineering-101/capture/out) 写入 69 个文件。主机跑 macOS 26.2、Node 22.22.0、来自 Homebrew 的 Ghidra 12.1.4、OpenJDK 21.0.12.1、Apple clang 17.0.0，以及 WABT 1.0.42，也就是 `inspect-wasm-artifact` 所跑的（[捕获](manuals/reverse-engineering-101/capture/out/00-versions.txt)）。目标是[为本手册写的程序](manuals/reverse-engineering-101/capture/fixtures)，且[夹具列表](manuals/reverse-engineering-101/capture/out/00-fixtures.txt) 持有每一个的 SHA-256。

`python3 capture/run.py --check` 把整套再录进一个临时目录，并与已录制的集合比较。比较掩掉时间戳、时长、id 与临时路径，69 个文件匹配。Evidence id 是内容哈希，比较时不掩。证明文件不是 rea 输出：它们持有[第 36 课](phases/13-tools-and-protocols/36-rebuild-and-prove-equal) 的两个证明，由套件用主机 clang 在 `ledger-x86_64-O1.o` 上跑出。

## 外部源 {#s-ref-sources-outside-sources}

第 7 与第 8 部分带着 URL 引用了两项外部研究。第一项是 Liu、Raff 与 Micinski，When LLM Decompilers Recompile More and Preserve Less，arXiv 2609.05370，2026。第二项是 Santos-Grueiro，When Binaries Talk Back，arXiv 2607.12507，2026。第 7 部分引用了两份规范。它们是 Intel 64 and IA-32 Architectures Software Developer's Manual，Volume 2，以及 Arm Architecture Reference Manual for A-profile，DDI 0487。

Sources: manual.json (pin, sources, quoteSources, capture); rea LICENSE; capture/README.md; capture/out/00-versions.txt, 00-fixtures.txt
