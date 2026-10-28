# Glossary

> 下面每一个术语在本手册里有一个含义，并点名定义它的那一节。

每一个术语只定义一次，在最后一列点名的那一节里，带着该节引用的那些源。下面的含义来自标签上的 rea 源、其文档、规范，以及捕获。

| Term | Meaning in this manual | Defined in |
|---|---|---|
| Analysis profile | provider 已提交的设置，对 RFC 8785 规范 JSON 做哈希，因此变更的契约版本会改变摘要 | [1.2](#s-rea-function-end-to-end) |
| Analysis snapshot cache | 一次会话的内存表，为一个目标身份持有最多 10,000 个缓存答案 | [5.3](#s-snapshots-and-the-answer-cache) |
| Application graph | 一个 JavaScript 应用作为节点与有向边的、与 provider 无关的模型，仅从语法构建，每条边上有一块 evidence | [6.1](#s-analyze-javascript-application) |
| Artifact graph | rea 为一个文件及其内部文件构建的清单：按 SHA-256 每个不同内容一个节点，每个位置一次出现，以及从容器到成员的一条边 | [3.1](#s-inspect-artifact) |
| Authority | 事实背后的来源种类：`shipped-artifact`、`controlled-replay`、`historical-reference`、`external-service` 或 `analyst-inference` | [5.1](#s-the-evidence-record) |
| Basic block | 一段指令，顶部一个入口、底部一个出口 | [4.3](#s-procedure-assembly) |
| Basic blocks | dossier 的 `basic_blocks` 列表，带排他的结束地址 | [1.2](#s-rea-function-end-to-end) |
| Bridge | `ReaGhidraBridge.java`，在 Unix 套接字上按每个请求服务一行 JSON 的 Ghidra post-script | [1.1](#s-rea-providers-and-evidence) |
| Capability | 共享一个 `available` 标志、不可用时的原因与代码、七项中为真的那些效果，以及限制的一组操作 | [2.3](#s-rea-capabilities) |
| Circumvention | 在 17 U.S.C. 1201(a)(3)(A) 下，在没有版权所有者授权的情况下避免、绕过、移除、停用或损害一项技术措施 | [2.1](#s-the-readme-use-rule-and-the-law) |
| Claim status | `verify_reconstruction` 的一条主张的 `pass`、`fail` 或 `unknown`，按该顺序来自权威限制、观察到的状态，以及打开的未知事项 | [7.1](#s-verify-reconstruction) |
| Composed operation | 由其他操作构建的 rea 操作，provider 为 `rea-workflow`，`confidence: "derived"` | [3.4](#s-analyze-overview) |
| Confidence | 三个词之一，`observed`、`derived` 或 `inferred`，绝不是一个数字 | [5.1](#s-the-evidence-record) |
| Decompiler artifact | 反编译器需要、且没有任何源行产生的一行伪代码 | [4.6](#s-analyze-function-and-pseudocode) |
| Dossier | `analyze_function` 返回的一个函数的组合记录，由五个 Ghidra 源构建 | [4.6](#s-analyze-function-and-pseudocode) |
| Evidence | 每一次成功分析调用返回的那一种记录类型，带 16 个字段的严格对象 | [1.1](#s-rea-providers-and-evidence) |
| Evidence bundle | 带七个数组的一个 JSON 对象：`artifacts`、`providers`、`environments`、`scenarios`、`captures`、`unknowns` 与 `records` | [5.4](#s-evidence-bundles-export-and-import) |
| Evidence ledger | agent 在一次调查期间保持的表：每个主张一行，带着其种类、其 Evidence id，以及其边界 | [8.2](#s-an-agent-investigation) |
| Evidence record | 记录类型本身，如[第 5 部分](#p-5) 逐字段所读 | [5.1](#s-the-evidence-record) |
| File offset | 字节在文件中的位置，从零计起 | [3.3](#s-address-to-file-offset) |
| Function body | Ghidra 赋给一个函数的地址集合，报告为带包含端的范围 | [4.2](#s-list-procedures-and-function-bodies) |
| Function match | `compare_functions` 如何决定两份 dossier 描述同一个函数，捕获里按 `symbol` 的 `matched` | [5.5](#s-compare-and-compare-functions) |
| Function starts | Mach-O 映像里命名每个函数入口的 LEB128 增量表 | [4.4](#s-xrefs-and-the-jump-table) |
| Ghidra provider | 通过 `analyzeHeadless` 驱动已安装 Ghidra 的 rea 适配器，钉在 12.1.4 与 JDK 21 | [2.2](#s-rea-doctor-and-the-ghidra-provider) |
| Headless import | 没有窗口的一次 Ghidra 运行，把一个文件导入项目并跑默认分析器 | [4.1](#s-open-binary-and-the-headless-bridge) |
| Input grid | 证明 harness 喂给原件与重建件的输入单元列表，每类危险一类单元 | [7.2](#s-a-proof-harness-outside-rea) |
| Jump table | 间接跳转索引的代码地址表 | [4.4](#s-xrefs-and-the-jump-table) |
| Load command | Mach-O 头之后的一条记录，带一个 `cmd` 类型与一个 `cmdsize` | [3.2](#s-inspect-binary-layout-and-the-load-image) |
| Procedure | dossier 里的函数身份：地址、体范围、签名与分类 | [1.2](#s-rea-function-end-to-end) |
| Provider | 一个接口背后的分析引擎。6.7.0 时二进制会话有四个候选：`hopper`、`ghidra`、`ida` 与 `kuna` | [1.1](#s-rea-providers-and-evidence) |
| Query id | `query_` 与一个缓存答案的目标身份、绑定、操作与参数的 SHA-256 | [5.3](#s-snapshots-and-the-answer-cache) |
| References | dossier 的入边与出边，每一条带一个 Ghidra 引用类型 | [1.2](#s-rea-function-end-to-end) |
| Relocation masking | 在比较字节之前把两个函数里每一个重定位字段清零，然后比较记录并读它们指向的字节 | [7.2](#s-a-proof-harness-outside-rea) |
| Residual unknown | 证据尚未解决的一个问题，保存为带 `unk_` id、修订链、状态，以及会关闭它的证据的一份记录 | [5.2](#s-residual-unknowns-and-coverage) |
| Semantic projection | id 对其做哈希的那份记录视图，`subject.name` 与 `subject.local_path` 留在外面 | [5.1](#s-the-evidence-record) |
| Snapshot file | `close_binary` 写入、`open_binary` 读取的 JSON 文件，带着目标身份、绑定、缓存项与 Evidence 包 | [5.3](#s-snapshots-and-the-answer-cache) |
| Specification | `verify_reconstruction` 的输入：一个名字与至少一条带种类、维度与比较 id 的主张 | [7.1](#s-verify-reconstruction) |
| Startup deadline | rea 允许 Ghidra 导入、分析、连接并报告健康的时间，默认 330,000 ms | [8.1](#s-the-rea-mcp-server) |
| `Surface` | 调用者到达会话的方式：一次性 CLI 或 MCP 服务器 | [1.1](#s-rea-providers-and-evidence) |
| Target snapshot | Ghidra 启动器用 `-readOnly` 与 `-deleteProject` 导入、并在会话关闭时删除的输入私有副本 | [5.3](#s-snapshots-and-the-answer-cache) |
| Target text | 结果从被分析文件里复制出的每一个字符串、符号名、注释与伪代码行，要被引用且绝不当作指令执行 | [8.2](#s-an-agent-investigation) |
| Thunk | 唯一工作是跳到另一个函数的小函数 | [4.2](#s-list-procedures-and-function-bodies) |
| Tool catalog | MCP 服务器在 `tools/list` 里广告的 207 个工具，不论可用与否 | [8.1](#s-the-rea-mcp-server) |
| Value table | 一次加载索引的数据表，因此一条指令返回若干值之一 | [4.4](#s-xrefs-and-the-jump-table) |
| Virtual address | 加载器映射包含它的段之后，字节在内存中的位置 | [3.3](#s-address-to-file-offset) |

Sources: the definition paragraphs of every file under sections/; rea at 27dc42d: src/domain/evidence.ts, src/domain/evidenceBundle.ts, src/domain/residualUnknown.ts, src/domain/reconstructionVerification.ts, src/config/providerStartupTimeout.ts, src/contracts/toolOutputSchemaPrimitives.ts; capture/out/02-capabilities.json; rea docs/mcp-contracts.md
