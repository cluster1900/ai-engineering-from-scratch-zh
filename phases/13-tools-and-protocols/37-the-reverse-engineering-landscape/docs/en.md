# 逆向工程全景：历史、工具家族与反编译器的构建方式

> 五种工具读取同一个目标文件，却给出四种地址、三种基本块计数，以及同一个 switch 的两种答案。本课将构建一套对比框架，厘清这些结果各自的含义。

**Type:** Build
**Languages:** Python, C, x86-64 汇编, Java（一个 Ghidra 脚本）
**Prerequisites:** Phase 13 · 32（从零构建 ELF）, Phase 13 · 33（反汇编与控制流）, Phase 13 · 34（提升为伪代码）
**Time:** ~150 分钟

## 学习目标

- 将本领域的主要工具放到 1973 至 2026 年的带日期时间线上，并说出各自所属的家族。
- 说出反编译器的八个阶段，以及 Ghidra、Binary Ninja、Hex-Rays、radare2、rizin 和 angr 对每个阶段使用的术语。
- 将一条指令提升为 ESIL、RzIL、P-code 和 VEX，并解释哪些会立即写入标志位，哪些会存储 thunk（延迟计算记录）。
- 将五种工具的地址归一化为同一个 `.text` 偏移，并在一个函数上验证这种归一化。
- 构建读取已采集工具输出的对比框架，报告指令起点、基本块、边和函数起点的一致性。
- 根据采集的证据，指出每种工具在哪里臆造代码、漏掉代码，或停在间接跳转处。

## 问题

你请一个 agent 总结三种逆向工程工具对 `ledger-x86_64-O1.o` 中 `grade` 的分析。agent 运行各个工具，读取三份列表，并报告该函数在一种工具中位于 `0x08000050`，另一种中位于 `0x400010`，第三种中位于 `0x100010`。它由此断言，各工具对函数位置存在分歧。

实际上，工具的结论一致。该目标文件可重定位，没有加载地址，因此每种工具会自行选择一个地址。减去各工具赋给 `.text` 的地址后，所有答案都是 `0x10`。agent 比较了原始地址，因为没有任何信息告诉它这些地址在各工具中的含义。

随后，同一个 agent 读取 `-O0` 构建中的 `grade`，报告四种工具分别给出 3、8、8、9 个基本块。这四个数都是真实的。一种工具停在 `jmp rax`。两种工具通过重定位读取跳转表。一种工具为了放置标签而在跳转处拆分了基本块。不解释原因的基本块计数，只是没有明确论断的数字。

在信任任何这样的数字前，你需要本课提供的地图。第 32 至 36 课构建了解码器、提升器、证据记录和重建结果。本系列后半部分将它们与人们实际使用的工具并列比较。为此，你需要了解领域历史、工具所属家族、每个反编译器执行的流水线，以及一套能在你自己编译的目标文件上对比工具结论的框架。

```figure
re-37-field-map
```

## 用日期串起五十三年

这个领域比其中大多数工具都古老。下列每个日期都能在“延伸阅读”中找到一手来源。

### 1973 至 1991 年：先有调试器，后有反汇编器

最早的反编译学位论文出现在 1973 年，作者分别是斯坦福大学的 Hollander 和普渡大学的 Housel，如今人们通过引用了解这两篇论文。当时实用的工具是调试器。Maranzano 和 Bourne 于 1977 年在贝尔实验室编写 `adb` 教程，该调试器随 1979 年的 UNIX V7 发布。Tim Paterson 的 `DEBUG` 内含 8086 反汇编器，随 1981 年 8 月的 PC-DOS 1.00 发布。Richard Stallman 的 GDB 于 1986 年开始分发。SoftICE 于 1987 年将内核调试器带到 DOS 下。

接下来出现了批处理反汇编器。V Communications 在 1988 年推出的 Sourcer 对 DOS 程序进行多遍处理，生成带注释的列表。GNU binutils 始于 1988 年没有版本编号的快照，`objdump` 的版权标注为 1990 年。Ilfak Guilfanov 于 1991 年 1 月写下 IDA 的第一行代码，并于 1991 年 5 月 20 日以共享软件形式发布 IDA 0.1。

### 1991 至 2009 年：交互式反汇编器与早期反编译器

Cristina Cifuentes 于 1994 年 7 月在 QUT 完成《Reverse Compilation Techniques》。她的反编译器 `dcc` 将 i80286 DOS 程序转换为 C；她与 Gough 于 1995 年发表的论文确立了此后所有反编译器沿用的阶段。随后是 1997 年的 REC，以及 2002 年的 Boomerang，后者是首个开源反编译器，采用 BSD 许可证。

IDA 于 1996 年在 DataRescue 成为商业产品，1999 年加入插件 SDK，后来转入 2005 年成立的 Hex-Rays。Hex-Rays Decompiler 1.0 于 2007 年 9 月 17 日发布。同年，Mike Van Emmerik 提交《Static Single Assignment for Decompilation》，这篇学位论文将 SSA（静态单赋值）置于反编译器数据流的核心。Halvar Flake 的《Structural Comparison of Executable Objects》（2004）开创了差异比较工具家族，BinDiff 于 2004 年 8 月开始销售。

radare 始于 2006 年 2 月，最初是支持 64 位偏移的取证十六进制编辑器。radare2 是采用 LGPL-3.0 的模块化重写版，于 2009 年 3 月 7 日首次发布。

### 2009 至 2019 年：框架与中间表示

LLDB 于 2010 年 6 月 8 日宣布成为 LLVM 子项目。使用 BIL 中间语言的二进制分析平台 BAP 在 CAV 2011 亮相。Google 于 2011 年 3 月 1 日收购 BinDiff 的开发商 zynamics。Hopper 在 2011 年底左右出现在 Mac App Store。Matt Godbolt 于 2012 年创办 Compiler Explorer，让 C++ 程序员能够看到编译器生成的汇编。

angr 的第一行代码写于 2013 年 8 月。Phoenix 论文（Schwartz、Lee、Woo、Brumley，USENIX Security 2013）展示了保持语义的结构化方法，在 8,676 个函数中保留了 40 条 `goto` 语句。DREAM（Yakdan 等，NDSS 2015）通过不依赖模式的结构化消除了这些 `goto` 语句。Vector 35 于 2015 年 1 月 14 日成立，Binary Ninja 于 2016 年 7 月 23 日开始销售，带有 Low Level IL 和 Python API。angr 于 2015 年公开发布，并在 2016 年 8 月的 DARPA Cyber Grand Challenge 中获得第三名。BinDiff 于 2016 年 3 月改为免费。Cutter 1.0 于 2017 年 12 月为 radare2 提供 Qt GUI。2018 年，Guilfanov 在 Recon 发表“Decompiler internals: microcode”，首次公开介绍 Hex-Rays IR。

### 2019 至 2026 年：开放反编译器与研究转向

NSA 于 2019 年 3 月 5 日在 RSA Conference 上以 Apache-2.0 许可证发布 Ghidra 9.0，一个月后在 GitHub 公布完整源码。同年，angr 8.19.2.4 加入初步的反编译器。Binary Ninja 2.0 于 2020 年 5 月 20 日推出 High Level IL 反编译器。Rizin 于 2020 年 12 月 8 日宣布成为 radare2 的分支，Cutter 团队随后迁移至它。IDA Freeware 7.6 于 2021 年 5 月加入云端 x64 反编译器。

BinDiff 8 于 2023 年 9 月 25 日以 Apache-2.0 开源。SAILR（Basque 等，USENIX Security 2024）成为 angr 默认的结构化器，并主张仅删除多余的 `goto` 语句，因为 Linux 6.1 源码中本来就有 3,754 条。Binary Ninja 4.0 于 2024 年 2 月加入 Free 版本，IDA 9.0 则加入用于无界面运行的 `idalib`。学习式反编译器论文从 SLaDe（2023）发展到 LLM4Decompile（2024）、DecompileBench（2025），以及 2026 年两项研究，分别讨论 agent 辅助的可读性，以及重新编译成功更多、语义保留却更少的反编译器。

本课运行的版本是截至 2026 年 10 月 14 日的当前版本：Ghidra 12.1.4（2026 年 9 月 21 日）、radare2 6.2.4（2026 年 10 月 5 日）、rizin 0.9.1（2026 年 6 月 29 日）和 angr 10.0.3（2026 年 10 月 10 日）。当前闭源工具是 Binary Ninja 6.0 “Krypton”（2026 年 9 月 3 日）和 IDA 9.4（2026 年 7 月 13 日）。本课没有运行它们。

## 工具家族

工具按产出归类。同一个程序可能横跨多个家族，而这种重叠正是大多数混淆的来源。

### 反汇编器

线性扫描从代码节的第一个字节一直解码到最后一个字节。GNU `objdump -d` 和 `llvm-objdump -d` 都这样工作，且都不构建控制流图。GNU `objdump` 将符号视为指令边界，并在符号之间扫描。binutils 2.47（2026 年 7 月 26 日）采用 GPL-3.0-or-later。LLVM 23.1.3 采用附带 LLVM 例外的 Apache-2.0。Apple 的 Command Line Tools 提供的 `llvm-objdump` 显示为“Apple LLVM version 17.0.0”，本课采集的就是这个版本。

交互式反汇编器从已知入口进行递归下降，加入识别函数起点的启发式规则，并维护数据库。IDA Pro（处理器模块、自动分析队列、FLIRT 签名）、Ghidra（`Disassembler` 加上 Auto Analysis 分析器）、Binary Ninja（先递归下降，再对未知区域线性扫描）、Hopper、radare2 和 rizin（`aa`、`aaa`、`af`，搭配 Cutter 和 iaito 作为 GUI）都属于这个家族。Andriesse 等（USENIX Security 2016）在编译器生成的二进制文件上测量了其中九种工具。指令准确率接近 100%，而困难的基础任务是函数起点识别，其假阴性率达到 20% 或更高。

### 反编译器

商业反编译器包括：Hex-Rays Decompiler（从 x86 到 RISC-V 的十二种目标家族）、Binary Ninja 的 HLIL 及其 Pseudo C 渲染，以及 Hopper 的伪代码视图。开放反编译器包括：Ghidra 反编译器，即采用 Apache-2.0 的 C++ 引擎，r2ghidra 和 rz-ghidra 将其复用为插件，pypcode 将其复用为提升器；基于 AIL、使用 SAILR 结构化、采用 BSD-2-Clause 的 angr 反编译器；用 JavaScript 编写的 r2dec 和 jsdec；以及作为历史代表的 Boomerang 和 `dcc`。radare2 还内置 `pdc`，即“用类 C 语法表示的伪反汇编输出”。rizin 没有内置反编译器。rizin 0.9.1 中不存在 `pdc` 命令，`pdg` 需要 rz-ghidra 插件。

### 调试器

包括带 GEF 和 pwndbg 前端的 GDB（1986）、LLDB（2010）、带 Time Travel Debugging 的 WinDbg（2017）、OllyDbg（2014 年停止更新）、x64dbg（GPL-3.0，2014）、带 Python 连接器的 Ghidra Debugger、Binary Ninja 调试器，以及 radare2 和 rizin 的内置调试器。第 42 课会在你自己的构建结果上使用其中两种。

### 二进制分析框架

angr（VEX IR、符号执行、`CFGFast` 和 `CFGEmulated`、反编译器）、BAP（BIL、OCaml）、Dyninst、Jakstab 和 ByteWeight 是 Andriesse 提到的框架。Ghidra 可通过 PyGhidra 作为库使用，Binary Ninja 通过 `import binaryninja`，IDA 通过 `idalib`。

### 格式库与引擎库

LIEF 1.0.0（2026 年 7 月 12 日，Apache-2.0）解析 ELF、PE、Mach-O、COFF 和 Android 格式。CLE，即“CLE Loads Everything”，是 angr 的加载器。Capstone 5.0.9（2026 年 5 月 28 日，BSD-3-Clause）负责解码；Keystone 0.9.2（GPL-2.0）负责汇编；Unicorn 2.1.4（GPL-2.0）负责仿真。radare2 6.2.4 捆绑 Capstone 5，rizin 0.9.1 随附 Capstone、Zydis 和 tree-sitter。

### 差异比较工具与编译器侧查看器

包括 BinDiff 8（Apache-2.0）及其用于 IDA Pro、Binary Ninja 和 Ghidra 的 BinExport 12 插件；作为 IDA 插件的 Diaphora 3.4.3（2026 年 10 月 11 日，AGPL-3.0）；以及 `radiff2` 和 `rz-diff`。Compiler Explorer（BSD-2-Clause）显示编译器为源码片段生成的汇编，其方向与本列表中其余工具的逆向工作正好相反。第 44 课使用差异比较家族。

### 版本、许可证与本课实际运行的工具

| 工具 | 2026-10-14 读取的版本 | 许可证 | 无界面入口 | 本课是否运行 |
|---|---|---|---|---|
| Ghidra | 12.1.4 | Apache-2.0 | `analyzeHeadless`, `pyghidra.start()` | 是，运行于全部四个目标文件 |
| radare2 | 6.2.4 | LGPL-3.0 | `r2 -qc '<cmds>' file`, `rabin2` | 是 |
| rizin | 0.9.1 | LGPL-3.0 | `rizin -qc '<cmds>' file`, `rz-bin` | 是 |
| angr | 10.0.3 | BSD-2-Clause | Python 中的 `angr.Project` | 是 |
| llvm-objdump | Apple LLVM 17.0.0 | 附带 LLVM 例外的 Apache-2.0 | `llvm-objdump -d -r` | 是 |
| Binary Ninja | 6.0 “Krypton” | 商业；Free 版本仅限非商业用途 | 持 Commercial、Ultimate 或无界面许可证调用 `binaryninja.load()` | 否，仅依据文档 |
| IDA Pro | 9.4 | 商业订阅；IDA Free 适用于非商业 x86 和 x86-64 用途 | `idat`, `ida -A -S`, `idalib` | 否，仅依据文档 |
| Hopper | 6.6.0 | 商业，永久许可 | 文档未记载 | 否，仅依据文档 |
| Cutter | 2.5.0 | GPL-3.0 | 基于 rizin 的 GUI | 否 |

Binary Ninja 的 Free 版本仅反编译 x86、x86-64、ARMv7 和 AArch64，且没有 API。IDA Free 没有 IDAPython、SDK 或 `idalib`，其反编译器在云端运行。本课关于这两种工具的每项陈述都来自其文档和发行说明，图中也标注了未运行。

## 逐阶段查看反编译器流水线

Cifuentes 在 1994 年列出这些阶段：语法分析、语义分析、中间代码生成、控制流图生成、数据流分析、控制流分析和代码生成。她将其划分为机器相关的前端、机器和语言无关的中间层，以及语言相关的后端。此后的每个反编译器都保留这一形态，只是更换各部分的名字。下表列出本课使用的八个阶段及各工具的名称。图中展示相同的表格，并支持选择工具列。

| 阶段 | Ghidra | Binary Ninja | Hex-Rays / IDA | radare2 | rizin | angr |
|---|---|---|---|---|---|---|
| 加载器 | `ElfLoader`, `MachoLoader`, `PeLoader`；`.ldefs` 选择语言 | `BinaryView`, `BinaryViewType` | 加载器模块（`LDSC`） | RBin（`rabin2`） | RzBin（`rz-bin`） | CLE（`cle.Loader`, `main_object`） |
| 反汇编 | `Disassembler`；SLEIGH `.slaspec` 编译为 `.sla`；分析器“Disassemble Entry Points”“Function Start Search” | 架构插件；Recursive Descent，随后是线性扫描阶段 | 处理器模块（`ana.cpp`, `emu.cpp`, `out.cpp`）；自动分析队列；FLIRT | RArch 插件生成 `RAnalOp`；`aa`, `aaa`, `af` | RzAnalysis 插件；`aa`, `aaa`, `af` | Capstone 基本块；`CFGFast` 函数起点搜索 |
| CFG 恢复 | “Generate Basic Blocks and the CFG”；`BlockGraph`；“Decompiler Switch Analysis” | `Function`, `BasicBlock`；“Control Flow Graph (CFG) Analysis”阶段 | `mbl_graph_t`，在 `MMAT_LOCOPT` 时就绪 | `afb`, `agf`, `aab` | `afb`, `agf`, `aab`（Nucleus） | `CFGFast`, `CFGEmulated`；`kb.functions`；IRSB |
| 提升 | “Generate Raw P-code”；位于 `ram`, `register`, `const`, `unique` 的 Varnode | Lifted IL, LLIL, Mapped MLIL, MLIL | 微代码（`minsn_t`, `mop_t`）；`MMAT_GENERATED` | ESIL（`asm.esil`, `ae`） | RzIL（`aoi`, `aez`） | VEX（`pyvex.lift`, IRSB），随后是 AIL |
| SSA | `Heritage`, `ActionHeritage`；`MULTIEQUAL`, `INDIRECT` | LLIL SSA, MLIL SSA, HLIL SSA；`HLIL_VAR_PHI` | 没有命名为 SSA 的形式；在 `MMAT_GLBOPT1` 至 `3` 中做 use-def 数据流分析 | 无；ESIL 为仿真而构建 | 无；RzIL 为仿真而构建 | `_stage_transform_to_ssa_level0` 和 `level1`；`SeqNodeDephication` |
| 数据流与类型 | `ActionDeadCode`, `ActionInferTypes`，`Rule` 池；原型来自 `.cspec` | MLIL 常量传播、变量和类型；`analyzeReturns` | “Transform microcode”；`MMAT_CALLS`, `MMAT_GLBOPT`, `MMAT_LVARS`；TIL | `afv`, `afc`, `aaft`；ESIL 仿真 | `afv`, `afc`, `aft` | `CallingConventionAnalysis`, `VariableRecoveryFast`, `Typehoon` |
| 结构化 | `CollapseStructure`；`BlockIf`, `BlockWhileDo`, `BlockSwitch`, `BlockGoto` | `HLIL_IF`, `HLIL_WHILE`, `HLIL_SWITCH`；AST 位于 `root` | “Generate ctree”；结构分析；goto 区域 | `pdc`；`pdd`（r2dec）；`pdg`（r2ghidra） | `pdg`（rz-ghidra）；jsdec | `RegionIdentifier`；使用 `SAILRStructurer` 的 `RecursiveStructurer` |
| 输出 | “Emit Final C Tokens”；`PrintC`, `ActionNameVars`, `ActionSetCasts` | HLIL 渲染；Pseudo C、Pseudo Rust、Pseudo Python | “Beautify ctree; Print ctree”；`cfunc_t` | `pdc`, `pdd`, `pdg` 的文本 | `pdg` 文本 | `CStructuredCodeGenerator`；`codegen.text` |

### 加载器

加载器解析容器、映射各节，并读取符号和重定位。可重定位目标文件中的内容还没有地址，因此加载器会自行选择。radare2 和 rizin 将文件映射到 `0x08000000`，使 `.text` 位于 `0x08000040`，因为该节从文件偏移 `0x40` 开始。CLE 将 `.text` 放到 `0x400000`。Ghidra 的 `ElfLoader` 将它放到 `0x100000`。`llvm-objdump` 打印节内偏移，完全不使用基址。

加载器对重定位的处理也不同。Ghidra 在导入时处理，CLE 会应用重定位。radare2 打开目标文件时会提示：尚未应用重定位，设置 `bin.relocs.apply=true` 可改变这一行为。加载器如何处理重定位，决定了后续所有阶段能看到什么，你将在下方的 `-O0` 跳转表中看到其影响。

### 反汇编

第 33 课构建了两种方法。表中除 `llvm-objdump` 外，每种工具都先递归下降，再加入函数起点搜索。Binary Ninja 文档按顺序列出这些阶段：Recursive Descent、Call Target Analysis、作为“对未知区域进行线性反汇编”的 CFG Analysis，以及 Tail Call Analysis。Ghidra 按优先级运行分析器，“Disassemble Entry Points”和“Function Start Search”位于前期。IDA 维护各有优先级的自动分析队列，以及库代码的 FLIRT 签名。angr 的 `CFGFast` 文档列出函数起点的四个来源：符号、函数序言扫描、调用目标，以及对剩余字节的完整扫描。最后一种来源正是 angr 在填充区臆造函数的原因。

### CFG 恢复

各工具以第 33 课的方式划分基本块，但有一项你将亲自测量的差异。angr 在 `call` 处结束基本块，因为它的 IRSB 是单入口、多出口基本块，调用属于出口。Ghidra、radare2 和 rizin 则跨过调用继续处理。在调用 `grade` 的 `-O0` 版 `grade_label` 上，angr 报告 2 个块，其他三种报告 1 个。指令却完全相同。

### 提升

Binary Ninja 将提升定义为“从较低层语言翻译到被视为较高层的中间语言”。各 IR 的用途不同。P-code 和 VEX 为分析与反编译而构建。ESIL 和 RzIL 为仿真而构建，都没有 SSA 阶段。Hex-Rays 微代码起初是带 72 个操作码的类 RISC 代码，依次经过从 `MMAT_GENERATED` 到 `MMAT_LVARS` 的成熟度级别。Binary Ninja 先提升到 Lifted IL，再在 LLIL 中将标志位折叠为条件，而 MLIL“将寄存器和内存访问翻译成变量”。下一节将在同一条指令上并列展示其中四种 IR。

### SSA

Van Emmerik 的论文列出 SSA 为反编译器带来的能力：表达式传播、无需 ABI 假设的参数与返回值识别、保留性分析、作为稀疏数据流问题的类型分析，以及间接跳转和调用的分析。Ghidra 将 SSA 构造称为 `Heritage`，并加入仅存在于图中的两种操作：表示 phi 的 `MULTIEQUAL` 和表示副作用的 `INDIRECT`。Binary Ninja 在每个 IL 层级暴露 SSA 形式。angr 在 `Clinic` 内有两个 SSA 阶段。Hex-Rays 没有命名为 SSA 的形式，而是在全局优化遍次中做 use-def 数据流分析。ESIL 和 RzIL 则没有 SSA。

### 数据流与类型

Ghidra 的主简化循环不断执行“Eliminate Dead Code”“Propagate Local Types”和“Perform Term Rewriting”，直到不再变化，其中重写由 `Rule` 对象池完成。Hex-Rays 转换微代码，在 `MMAT_CALLS` 检测调用实参，在 `MMAT_LVARS` 分配局部变量。angr 运行 `CallingConventionAnalysis`、`VariableRecoveryFast` 和 `Typehoon`，后者实现 Noonan、Loginov 和 Cok 的多态类型推断。第 41 课讨论这个阶段。

### 结构化

Ghidra 的 `CollapseStructure` 搜索匹配某种结构的子图，将其折叠为一个节点；遇到无法继续的情况时，删除一条边并标记为非结构化。Hex-Rays 将 CFG 归约为 `if`、`while`、`do` 和 `switch`，其余保留为 goto 区域。angr 识别单入口、单出口区域，默认使用 `SAILRStructurer` 结构化，也可选择 `PhoenixStructurer` 和 `DreamStructurer`。第 34 课手写过一个结构化器。

### 输出

Ghidra 在 `ActionNameVars` 和 `ActionSetCasts` 之后，通过 `PrintC` 配合 Oppen 美化打印器输出 C token。Hex-Rays 美化并打印 ctree。Binary Ninja 将 HLIL 渲染为 Pseudo C、Pseudo Rust 或 Pseudo Python。angr 返回 `codegen.text`。radare2 打印 `pdc`、`pdd` 或 `pdg`。

## 同一条指令的四种 IR

取 `48 83 ec 10`，即 `subq $0x10, %rsp`。用第 33 课的规则在纸上解码。

1. `48` 是 `W = 1` 的 REX，操作数为 64 位。
2. `83` 是带 8 位立即数的第 1 组算术操作码。ModRM 的 reg 字段选择操作。
3. `ec` 是 ModRM `11 101 100`。`mod = 11` 表示寄存器形式。`reg = 101` 是 `/5`，即 `sub`。`r/m = 100` 是 `%rsp`。
4. `10` 是立即数，值为 16。

将这四个字节交给四种提升器。测试夹具中保存了精确命令和完整文本。

radare2 6.2.4 的 ESIL 是包含 30 个 token 的逗号分隔字符串：

```text
16,0x8000000000000000,-,!,16,rsp,-=,63,$o,^,of,:=,63,$s,sf,:=,$z,zf,:=,$p,pf,:=,64,$b,cf,:=,4,$b,af,:=
```

它是一台栈机器。`16,rsp,-=` 原地执行减法。随后，每个标志位都通过内部操作符写入：`$o` 表示溢出，`$s` 表示符号，`$z` 表示零，`$p` 表示奇偶，`$b` 表示借位。

rizin 0.9.1 的 RzIL 是一个包含 14 个 `set` 效果的 S 表达式：

```text
(seq (set op1 (var rsp)) (set op2 (bv 64 0x10)) (set sub (- (var op1) (var op2))) (set rsp (var sub))
     (set _result (var sub)) (set pf (! (lsb (let _val (cast 8 false (var _result)) ...))))
     (set zf (is_zero (var _result))) (set sf (msb (var _result))) ... (set cf (|| ...)) (set of (|| ...)) (set af (|| ...)))
```

每个标志位都是位向量上的布尔表达式。仅奇偶标志就需要四层 `let`。

通过 pypcode 4.0.1 从 SLEIGH 规范 `x86:LE:64:default` 生成的 P-code，在 `IMARK` 后有九个操作：

```text
CF = RSP < 0x10
OF = sborrow(RSP, 0x10)
RSP = RSP - 0x10
SF = RSP s< 0x0
ZF = RSP == 0x0
unique[58300:8] = RSP & 0xff
unique[58400:1] = popcount(unique[58300:8])
unique[58500:1] = unique[58400:1] & 0x1
PF = unique[58500:1] == 0x0
```

这是一组寄存器传送，临时值位于 `unique` 空间。标志位在指令处立即计算，并且 `CF` 和 `OF` 在减法覆盖 `RSP` 前就已计算。

pyvex 10.0.3 生成的 VEX 在 `IMark` 后有七条语句：

```text
t2 = GET:I64(offset=48)
t0 = Sub64(t2,0x0000000000000010)
PUT(offset=144) = 0x0000000000000008
PUT(offset=152) = t2
PUT(offset=160) = 0x0000000000000010
PUT(offset=168) = 0x0000000000000000
PUT(offset=48) = t0
```

这里没有出现标志位。VEX 按寄存器在客户机状态中的偏移命名寄存器，偏移 48 就是 `rsp`。偏移 144 至 168 分别为 `cc_op`、`cc_dep1`、`cc_dep2` 和 `cc_ndep`。提升器存储操作码 8，即 64 位减法，以及两个操作数。后续读取标志位的分支再根据 thunk 计算标志。这就是框架报告中 `pcode.writesFlags` 为 true 而 `vex.computesFlags` 为 false 的原因，也是 VEX 在四种表示中最短的原因。

将同样四种提升器用于 `48 63 c7`，即 `movslq %edi, %rax`（`-O1` 下 `grade` 的第一条指令），得到 5 个 ESIL token（`32,edi,~,rax,=`）、1 个 RzIL `set`、1 个 P-code 操作（`RAX = sext(EDI)`）和 4 条 VEX 语句。没有提升器写入标志位，因为这条指令本身不涉及标志位。通过无界面脚本采集的 Ghidra 指令列表将同一操作打印为 `(register, 0x0, 8) INT_SEXT (register, 0x38, 4)`：寄存器偏移 0 是 `RAX`，偏移 `0x38` 是 `RDI`，大小分别为 8 和 4 字节。

`grade` 边界检查中的 `83 f9 04`，即 `cmpl $0x4, %ecx`，产生 30 个 ESIL token、13 个 RzIL `set` 效果、10 个 P-code 操作，以及 7 条 VEX 语句，后者的 `cc_op` 为 7，表示 32 位减法。没有任何操作写入 `%ecx`。你将在 VEX 中遇到的两种减法宽度编号为：32 位对应 7，64 位对应 8；你构建的翻译器会保存这张表。

## 一个函数的四种地址基址

在框架开始比较前，它必须先统一函数位置的定义。对 `ledger-x86_64-O1.o` 中的 `grade` 手算一次。

| 工具 | `.text` 地址 | `grade` 地址 | 偏移 |
|---|---|---|---|
| `llvm-objdump` | `0x0` | `0x10` | `0x10 - 0x0 = 0x10` |
| radare2, rizin | `0x08000040` | `0x08000050` | `0x08000050 - 0x08000040 = 0x10` |
| angr | `0x400000` | `0x400010` | `0x400010 - 0x400000 = 0x10` |
| Ghidra | `0x100000` | `0x100010` | `0x100010 - 0x100000 = 0x10` |

符号表表明，`grade` 位于 `.text + 0x10`，大小为 46。去掉基址后，所有工具都一致。框架从各份采集结果读取基址：radare2 和 rizin 的 `iSj`、angr 采集结果的 `.text` 节条目、Ghidra 采集结果的 `.text` 内存块，而线性扫描的基址为零。测试 `test_every_tool_places_grade_at_offset_0x10_from_its_own_base` 固定验证这一事实。

## 工具在哪里一致，在哪里分歧

`code/main.py` 中的框架读取采集结果，归一化每个地址，再进行比较。以下是它报告的数字，测试会逐一断言。

### 一致性案例：-O1 下的 ledger

四个函数，线性扫描中有 56 条指令，其中符号范围内 54 条，填充区 2 条。每种工具在每个函数中报告相同的指令起点：分别为 9、14、13、18 个。四种图构建器报告 3、3、5、4 个基本块，以及 2、3、5、4 条边；radare2、rizin、angr 和 Ghidra 的边集合逐对完全相同。`total` 的五个块和五条边就是第 33 课手绘的那些。

唯一差异在填充区。函数之间的 3 个字节（`grade` 后的 `66 90`、`total` 后的 `90`）被线性扫描解码，因为它没有理由停止；angr 也解码了它们，并创建没有符号的 `sub_40003e` 和 `sub_40005f`。radare2、rizin 和 Ghidra 都不将这些字节认作代码。

### 向量化案例：-O2 下的 ledger

在四种图构建器中，`total` 都是 41 条指令、10 个块、13 条边。第 33 课的 SSE2 循环和处理剩余元素的标量循环，在各工具中的切分方式相同。angr 又在填充区增加了两个函数。

### 跳转表：-O0 下的 grade

这里工具出现分歧，而分歧本身正是本课的重点。

| 工具 | 基本块 | 边 | 采集结果的说明 |
|---|---|---|---|
| radare2 | 3 | 2 | `0x62` 处的块没有后继；从未到达 `0x76` 至 `0x9a` 的字节；缺少 8 个指令起点 |
| rizin | 8 | 11 | `0x62` 处的块带有 `switch_op`，其中有 5 个 case 和 4 个不同目标 |
| angr | 8 | 7 | case 块存在，`0x62` 处的控制转移指向一个无法解析的目标节点 |
| Ghidra | 9 | 12 | `0x74` 处的 `switchD` 标签拆分了块；四条 `COMPUTED_JUMP` 流分别指向 `0x76`、`0x7f`、`0x88`、`0x91` |

只要到达相应位置，四种工具解码的都是相同的 33 条指令。radare2 停在 `jmp rax`，留下 36 字节未认领，框架将这个范围标为遗漏代码。rizin 和 Ghidra 找到了四个不同目标，即第 33 课从 `.rela.rodata` 的五项重定位中读取的目标。angr 列出了 `grade` 内的 case 块，却仍然没有从跳转块指向它们的边；其采集结果将 `0x62` 处的转移记录为指向无法解析的目标节点，反编译器则打印计算式 `goto`。对于相同的控制流，Ghidra 比 rizin 多一个块和一条边，因为它的 switch 分析在 `jmp rax` 上放置了标签，而基本块模型会在标签处开始新块。

第 33 课的图有 8 个块、11 条边。rizin 与它完全一致。重点在于理解，9、11、7、2 并不是对发现代码量的四次测量，而是四种工具对同一次间接跳转跟踪多远、选择在哪里切分的四个答案。

### 代码中的数据：sweep-trap

`lookup` 长 24 字节，在 `0x10` 处包含 4 个表数据字节 `31 c0 90 48`。线性扫描在该范围中报告 8 个指令起点。框架列出它与多数结果的差异：在 `0x10`、`0x12`、`0x13` 多出起点，在 `0x14` 缺少起点。这就是第 33 课的 `addq $0x1, %rax` 提前了一个字节。radare2、rizin 和 Ghidra 报告 6 个起点、2 个块、1 条边，并将 `0x10` 至 `0x14` 留作未认领。angr 对 `lookup` 报告相同的 2 个块和 1 条边，随后在表字节上臆造 `sub_400010`：一个 4 字节块中有 2 条指令，块结束于 `0x14`，也就是 `lookup` 第二个块的起点，因此 `0x13` 处的 REX 字节不属于任何指令。框架对此目标文件的最后一项发现是，没有图构建器解码 `0x10` 至 `0x14`，所以这些位于函数内部的字节是数据。

### 按工具统计臆造与遗漏

在四个目标文件中，框架指出 angr 臆造了 9 个没有符号的函数，每个都位于填充区或陷阱表。它指出 radare2 遗漏了一个范围，即 `-O0` 下 `grade` 的 36 个 case 字节。它指出线性扫描解码、但没有图构建器视为代码的 9 个范围：八个填充空隙加上陷阱表。没有任何工具被报告遗漏函数。

## 三种反编译器分析 grade

所采集的工具中有三种为 `-O1` 下的 `grade` 输出类 C 文本。源码是带五个 case 的 `switch (score / 10)`，编译后成为边界检查和返回值表。

Ghidra 12.1.4:

```c
uint grade(int param_1)
{
  uint uVar1;
  uint uVar2;

  uVar2 = param_1 / 10 - 6;
  uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);
  if (uVar2 < 5) {
    uVar1 = *(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4);
  }
  return uVar1;
}
```

angr 10.0.3:

```c
extern unsigned int g_4000b4[4];

unsigned int grade(int a0)
{
    unsigned int v1;  // ecx
    unsigned int v2;  // eax

    v1 = (unsigned int)((long long)(a0 * 1717986919) >> 0x22) + (unsigned int)(a0 * 1717986919 >> 63) - 6;
    v2 = 0;
    if (v1 <= 4)
        v2 = g_4000b4[v1];
    return v2;
}
```

radare2 6.2.4, `pdc`:

```c
void sym.grade (int64_t arg1) {
    rax = edi
    rax = rax * 0x66666667
    rcx = rax
    rcx >>= 0x22
    rax >>>= 0x3f
    ecx += eax
    ecx += 0xfffffffa
    eax = 0
    v = ecx - 4
    if (((unsigned) v) <= 0) {
        eax = ecx
        rcx = rip
        eax = dword [rcx + rax*4]
    }
    return
}
```

结合流水线阅读这三份输出。Ghidra 的项重写将乘以 `0x66666667` 和右移 34 位折叠回 `param_1 / 10`，也就是第 34 课的惯用模式。angr 提升同样的字节，却将运算保留为 `a0 * 1717986919 >> 0x22`。radare2 的 `pdc` 是 ESIL 仿真加伪语法：使用寄存器名，没有变量和类型，边界检查在无符号减法之后打印为 `<= 0`。Ghidra 通过 `DAT_001000b4` 为表加载赋予类型；angr 声明了 `g_4000b4[4]`，源码有五个元素，它却给出四个。Ghidra 和 angr 都没有恢复 case 枚举，因为 `-O1` 的字节中已不再保留 switch。在存在跳转表的 `-O0` 下，Ghidra 打印带 case 6 至 10 以及 default 的 `switch(param_1 / 10)`，angr 则打印计算式 `goto`。

rizin 没有自己的反编译器，采集记录表明其中不存在 `pdc`。Binary Ninja 的 HLIL 和 Hex-Rays ctree 是本课未能采集的两种输出。

## 动手构建

运行演示：

```bash
cd phases/13-tools-and-protocols/37-the-reverse-engineering-landscape
python3 code/main.py
```

输出是一份 JSON 报告。开头给出采集时记录的工具版本，以及你机器上存在的工具，后者可能全部缺失。随后对四个目标文件逐一给出符号范围、填充空隙、各工具使用的基址、各工具找到或臆造的函数起点，以及每个函数的指令起点一致性、基本块数、边数和各工具缺少的边。结尾是按工具逐字节统计、工具自身的注记、用普通句子表述的发现列表，以及 IR 部分：将翻译器对三条指令的输出，与从采集的提升结果中测得的计数并列展示。

预期结构：

```json
{
  "captureTools": {"llvm-objdump": "Apple LLVM version 17.0.0", "radare2": "radare2 6.2.4 ...", "rizin": "rizin 0.9.1 ...", "angr": "10.0.3", "ghidra": "12.1.4"},
  "localTools": {"radare2": "absent", "...": "..."},
  "fixtures": {
    "ledger-x86_64-O0.o": {
      "bases": {"llvm-objdump": "0x0", "radare2": "0x8000040", "angr": "0x400000", "ghidra": "0x100000", "...": "..."},
      "functions": {"grade": {"blocks": {"radare2": 3, "rizin": 8, "angr": 8, "ghidra": 9}, "edges": {"radare2": 2, "rizin": 11, "angr": 7, "ghidra": 12}, "...": "..."}},
      "findings": ["radare2 never reaches bytes 0x76-0x9a inside grade that the other graph builders decode", "..."]
    }
  },
  "ir": {"translator": [{"text": "subq $0x10, %rsp", "flags": {"pcodeLike": "eager", "vexLike": "thunk"}, "...": "..."}], "observed": {"...": "..."}}
}
```

按以下顺序阅读 `code/main.py`：

1. `read_text_symbols()` 读取节头以及 `.text` 的 `STT_FUNC` 符号。符号表是框架唯一的真值依据，`TextSection.gaps()` 据此推导填充区。
2. `parse_objdump()`、`parse_r2_family()`、`parse_angr()` 和 `parse_ghidra()` 各自将一份采集结果变成 `ToolView`：包含基址、从偏移映射到长度的指令，以及每个函数对应的 `FunctionView`，其中有块、边和可能存在的反编译文本。每个解析器只了解一种工具的词汇，不涉及其他工具。
3. `majority()` 和 `ranges()` 是每次比较都会用到的两个辅助函数。
4. `function_report()` 先将指令起点与图构建器的多数结果比较，再比较基本块数和边集合，并列出每种工具缺少的内容。
5. `byte_report()` 将每个字节归为符号内代码、填充、未认领、臆造或遗漏，并指出符号内部没有图构建器解码的字节。
6. `findings()` 将这些结果转换为句子，`compare()` 为每个目标文件组装一份报告。
7. `decode_small()`、`to_pcode_like()` 和 `to_vex_like()` 构成翻译器：三种寄存器形式的编码，一种立即计算风格，一种 thunk 风格。
8. `observed_ir()` 测量采集的提升结果，`figure_data()` 组装时间线、阶段表和图中展示的证据。

还有三条命令。`python3 code/main.py compare FIXTURE.o` 打印单个目标文件的报告。`python3 code/main.py ir 4883ec10` 打印翻译器对一条指令生成的两种形式。`python3 code/main.py figure-data` 打印嵌入图中的数据。

采集由 `code/fixtures/capture_tools.py` 一次完成，它在 `captures.json` 中记录每条命令和版本。框架与测试从不启动工具。如果你安装了这些工具，可以运行采集脚本刷新文件，并阅读测试夹具 README 了解所需环境。

## 实际使用

按以下顺序将框架用于新的目标文件。

1. 自己构建目标文件并保存编译命令。在打开任何工具前读取符号表，以了解函数数量和填充区位置。
2. 以无界面模式为每种工具采集一次。将原始输出和精确命令保存在目标文件旁边。无法重新读取的分歧不能算作发现。
3. 检查基址。选择一个函数，确认减去各工具的 `.text` 地址后，每种工具都将它定位到相同偏移。如果有工具不一致，停止并查明它加载了什么。
4. 先比较指令起点。如果图构建器在此处不一致，那么接下来的比较讨论的是解码，而不是分析。
5. 比较基本块和边，在评判计数前阅读每个工具的注记。`switch_op`、`COMPUTED_JUMP` 或无法解析的目标节点能够解释大多数差异。
6. 逐字节统计。工具认领填充区，说明启发式规则正在起作用。工具留下符号字节，说明遍历停止了。没有图构建器认领的符号字节是数据。
7. 写明哪些工具没有运行。依据文档的描述有用，但与采集结果属于不同类型的证据。

## 交互实验

### 实验 A：一个函数，四种基址

在 `code` 目录中打开 Python：

```bash
cd phases/13-tools-and-protocols/37-the-reverse-engineering-landscape/code
python3 -q
```

运行：

```python
from main import *
views = load_views("ledger-x86_64-O1.o")
{tool: hex(view.base) for tool, view in views.items()}
{tool: hex(view.functions["grade"].start + view.base) for tool, view in views.items()}
```

运行第二行前，先写下四个原始地址，并对照本课的表格检查。随后将 `grade` 替换为 `grade_label`，手算它在 Ghidra 中的位置。

### 实验 B：从四个角度看跳转表

```python
report = compare("ledger-x86_64-O0.o")
report["functions"]["grade"]["blocks"]
report["functions"]["grade"]["edgesMissingPerTool"]["radare2"]
report["notes"]["rizin"]
report["notes"]["ghidra"]
report["bytes"]["radare2"]["misses"]
```

统计 radare2 缺少的边，将每条边与第 33 课 `-O0` 列表中的一行对应起来。随后阅读 Ghidra 注记，并在 Ghidra 采集结果中找到 `switchD` 标签。

### 实验 C：立即计算标志位与 thunk

```python
translate("48 83 ec 10")["pcodeLike"]
translate("48 83 ec 10")["vexLike"]
translate("83 f9 04")["vexLike"]
{row["name"]: (row["pcode"]["ops"], row["vex"]["statements"]) for row in observed_ir()["instructions"]}
```

在两份输出中找到 `cc_op` 常量，并解释为什么一个是 8，另一个是 7。随后尝试 `translate("48 01 c8")` 并阅读 `TranslateError`。

### 实验 D：五种工具下的陷阱

```python
report = compare("sweep-trap.o")
report["functions"]["lookup"]["instructionStarts"]
report["bytes"]["dataInsideSymbols"]
report["functionStarts"]["angr"]
```

在纸上按线性扫描的方式解码字节 `31 c0 90 48 83 c0 01`，再按 `jmp` 之后递归下降的方式解码。将两份列表与框架报告的多余及缺失起点对应起来。

## 实践实验

加入第五份采集结果并扩展框架。

要求：

- 选择一种本课没有采集、且你能在自己机器上运行的工具：GNU `objdump`、LIEF 搭配 Capstone、手动导出的 Binary Ninja Free 会话，或使用不同分析器集合的 Ghidra。采集它在全部四个目标文件上的输出，并在 `captures.json` 中记录精确命令和版本。
- 编写一个解析器，将采集结果转换为 `ToolView`，包含工具的基址、指令、函数，以及工具提供时的基本块和边。
- 将工具加入 `TOOLS`；如果它构建图，也加入 `DESCENT_TOOLS`。运行演示，查看多数集合发生了哪些变化。
- 编写一个测试，断言工具在 `ledger-x86_64-O1.o` 上的基本块数；再编写一个测试，断言它如何处理陷阱表。
- 为本课写一段文字，用工具自己的术语说明它如何称呼加载器、反汇编器和 CFG。

成功标准是：`python3 code/main.py` 在 `captureTools` 中报告新工具，`ledger-x86_64-O1.o` 的每个函数都保持 `allDescentToolsAgree` 为 true，并且 `sweep-trap.o` 的发现说明新工具如何处理 `0x10` 至 `0x14` 的字节。

## 本课产物

本课包含 `outputs/skill-the-reverse-engineering-landscape.md`。使用它在你构建的一个目标文件上运行多种工具，将地址归一化到同一基准，并逐函数报告它们在指令起点、块和边上的一致性，以及各工具臆造或遗漏的字节。它要求采集结果记录命令和版本、符号表从文件本身读取，并声明哪些工具仅依据文档描述。

## 验证

运行演示和确定性测试套件：

```bash
cd phases/13-tools-and-protocols/37-the-reverse-engineering-landscape
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明：

- ELF 读取器在 `ledger-x86_64-O1.o` 中找到四个函数符号，大小为 16、46、31、63，并找到两个填充空隙
- 四个目标文件的线性扫描采集结果分别包含 86、56、84、11 条指令
- radare2 和 rizin 在 `ledger-x86_64-O1.o` 上报告相同的指令、块和边，且只有 radare2 有 `pdc` 文本
- angr 将 `sub_40003e` 和 `sub_40005f` 标为没有符号的函数
- Ghidra 对 `total` 划分的块就是第 33 课的五个块，其调用流不是图中的边
- 去掉各自的基址后，每种工具都将 `grade` 放在偏移 `0x10`
- 每种工具对 `ledger-x86_64-O1.o` 中每个函数的每个指令起点都一致
- 四种图构建器在其中报告 3、3、5、4 个块和 2、3、5、4 条边，且边集合相同
- `-O2` 下的 `total` 在每种图构建器中都是 10 个块和 13 条边
- `-O0` 下的 `grade` 在 radare2、rizin、angr、Ghidra 中分别有 3、8、8、9 个块和 2、11、7、12 条边，原因见各工具注记
- `-O0` 下的 `grade_label` 在所有工具中都是一个块，唯独 angr 在调用处结束基本块
- angr 在每个填充空隙臆造一个函数，并在陷阱表上再臆造一个；其他工具没有臆造或遗漏函数
- 线性扫描在陷阱中多出起点 `0x10`、`0x12`、`0x13`，丢失 `0x14`，且没有图构建器解码 `0x10` 至 `0x14`
- 发现列表指出 radare2 遗漏的范围和 angr 臆造的每个函数
- 清单为全部 21 个采集文件记录版本和命令
- 三种工具反编译 `grade`，只有 Ghidra 折叠除法惯用模式
- 翻译器的一种风格立即写入 CF、OF、SF、ZF、PF，另一种写入 `cc_op` thunk；对于 `cmp` 不写寄存器，对于 `movslq` 不写标志位
- 翻译器拒绝内存形式、其他操作码、额外 REX 位和错误长度
- 翻译器的 `cc_op` 编号 8 和 7 与采集的 VEX 中相同
- 采集的提升结果对三条指令分别给出 9、1、10 个 P-code 操作和 7、4、7 条 VEX 语句
- 时间线按顺序从 1973 年延伸至 2026 年，流水线有八个阶段和六种工具，每个单元格都有术语，两种闭源工具标为未运行
- 交互图嵌入的数据与框架生成的数据相同

## 生产环境失效模式

| 失效 | 不严谨的报告怎么说 | 框架必须证明什么 |
|---|---|---|
| 使用不同工具的原始地址 | “工具对 grade 的位置存在分歧” | 去掉各自基址后得到同一个偏移，并在一个函数上验证 |
| 用基本块数衡量发现的代码量 | “Ghidra 发现的代码最多” | 指令起点相同，多出的块由标签解释 |
| 将一种工具当作绝对真值 | “objdump 表明表字节是指令” | 扫描属于线性扫描；三种图构建器没有认领这些字节 |
| 将填充区函数算作发现 | “angr 多发现了七个函数” | 每个都位于填充空隙或数据上，且都没有符号 |
| 将停止的遍历报告为死代码 | “四个 case 块不可达” | 一种工具遗漏 36 字节，另外三种能够到达 |
| 不看注记就比较边数 | “rizin 和 Ghidra 对 grade 存在分歧” | 四个计算式目标相同，只是在标签处多一次拆分 |
| 将反编译器的算术表达式当作程序本意 | “该函数乘以 1717986919” | 这是第 34 课的惯用模式，一种工具折叠了它，另一种保留了它 |
| 将闭源工具描述得仿佛运行过 | “Binary Ninja 报告五个块” | 图和表都将其标为仅依据文档 |
| 采集结果没有命令 | “我们运行了 radare2” | 清单为每个文件记录版本、命令和日期 |
| 将不显式含标志位的 IR 视为有损提升 | “VEX 丢掉了标志位” | thunk 保存在 `cc_op`、`cc_dep1`、`cc_dep2` 中，在分支处求值 |

## 操作准则

每种工具采集一次，记录命令和版本，将每个地址归一化到同一基准，先比较指令起点，再比较块，最后比较边。逐字节将其归为已认领、填充、数据或遗漏。在评判工具的计数前，阅读它自己的注记，并说明哪些工具你只读过文档。

## 延伸阅读

- [Cifuentes, "Reverse Compilation Techniques", 博士论文，QUT (1994)](https://eprints.qut.edu.au/36820/)
- [Cifuentes and Gough, "Decompilation of Binary Programs", Software: Practice and Experience (1995)](https://doi.org/10.1002/spe.4380250706)
- [Van Emmerik, "Static Single Assignment for Decompilation", 博士论文，昆士兰大学 (2007)](https://espace.library.uq.edu.au/view/UQ:158682)
- [Schwartz, Lee, Woo, Brumley, "Native x86 Decompilation Using Semantics-Preserving Structural Analysis and Iterative Control-Flow Structuring" (USENIX Security 2013)](https://www.usenix.org/conference/usenixsecurity13/technical-sessions/presentation/schwartz)
- [Yakdan et al., "No More Gotos" (NDSS 2015)](https://www.ndss-symposium.org/ndss2015/ndss-2015-programme/no-more-gotos-decompilation-using-pattern-independent-control-flow-structuring-and-semantics/)
- [Basque et al., "Ahoy SAILR! There is No Need to DREAM of C" (USENIX Security 2024)](https://www.usenix.org/conference/usenixsecurity24/presentation/basque)
- [Andriesse et al., "An In-Depth Analysis of Disassembly on Full-Scale x86/x64 Binaries" (USENIX Security 2016)](https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/andriesse)
- [Flake, "Structural Comparison of Executable Objects" (DIMVA 2004)](https://dl.gi.de/items/7f573931-cb51-49ef-a12c-0452a9fb0ea4)
- [Maranzano and Bourne, "A Tutorial Introduction to ADB", Bell Labs (1977)](http://squoze.net/UNIX/v7/files/doc/18_adb.pdf)
- [Stallman, 关于 GDB 开始分发的 KTH 演讲（1986 年 10 月 30 日）](https://www.gnu.org/philosophy/stallman-kth.html)
- [Hex-Rays, "IDA: celebrating 30 years of binary analysis innovation"](https://hex-rays.com/blog/ida-celebrating-30-years-of-binary-analysis-innovation)
- [Guilfanov, "Decompiler internals: microcode", Recon Brussels 2018 （幻灯片）](https://www.recon.cx/2018/brussels/resources/slides/RECON-BRX-2018-Decompiler-internals-microcode.pdf)
- [Hex-Rays, 微代码视图与成熟度级别](https://docs.hex-rays.com/core/decompiler/how-tos/microcode-view)
- [Hex-Rays, IDA 9.4 发行说明](https://docs.hex-rays.com/release-notes/9_4)
- [Hex-Rays, IDA Free](https://hex-rays.com/ida-free)
- [Ghidra 发行版本 (12.1.4)](https://github.com/NationalSecurityAgency/ghidra/releases)
- [Ghidra P-code 参考文档](https://github.com/NationalSecurityAgency/ghidra/blob/master/GhidraDocs/languages/html/pcoderef.html)
- [Ghidra 反编译器源码、主工作流与 Action 类](https://github.com/NationalSecurityAgency/ghidra/tree/master/Ghidra/Features/Decompiler/src/decompile/cpp)
- [Ghidra analyzeHeadless README](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/RuntimeScripts/support/analyzeHeadlessREADME.md)
- [Binary Ninja, BNIL 概览](https://docs.binary.ninja/dev/bnil-overview.html)
- [Binary Ninja, "Architecture Agnostic Function Detection in Binaries" (2017)](https://binary.ninja/2017/11/06/architecture-agnostic-function-detection-in-binaries.html)
- [Binary Ninja, 批处理与无界面许可证](https://docs.binary.ninja/dev/batch.html)
- [Binary Ninja 6.0 "Krypton" 发布公告](https://binary.ninja/2026/09/03/binary-ninja-6.0-krypton.html)
- [Binary Ninja Free](https://binary.ninja/free/)
- [radare2 手册，ESIL](https://book.rada.re/emulation/esil.html)
- [radare2 手册，反编译器](https://book.rada.re/arch/decompile.html)
- [radare2 发行版本 (6.2.4)](https://github.com/radareorg/radare2/releases)
- [rizin, RzIL 设计说明](https://github.com/rizinorg/rizin/blob/dev/doc/rzil.md)
- [rizin 发行版本 (0.9.1)](https://github.com/rizinorg/rizin/releases)
- [Rizin 发布公告（2020 年 12 月 8 日）](https://rizin.re/posts/announcing-rizin/)
- [Cutter 发行版本 (2.5.0)](https://github.com/rizinorg/cutter/releases)
- [angr 文档，CFG 恢复](https://docs.angr.io/en/latest/analyses/cfg.html)
- [angr 文档，反编译器及其分析遍次](https://docs.angr.io/en/latest/analyses/decompiler.html)
- [angr 文档，中间表示（VEX）](https://docs.angr.io/en/latest/advanced-topics/ir.html)
- [PyPI 上的 angr (10.0.3)](https://pypi.org/project/angr/)
- [PyPI 上的 pypcode](https://pypi.org/project/pypcode/)
- [llvm-objdump 命令指南](https://llvm.org/docs/CommandGuide/llvm-objdump.html)
- [GNU objdump 手册](https://sourceware.org/binutils/docs/binutils/objdump.html)
- [LIEF 文档](https://lief.re/doc/stable/index.html)
- [Capstone 发行版本](https://github.com/capstone-engine/capstone/releases)
- [BinDiff 发行版本（v8，开源）](https://github.com/google/bindiff/releases/tag/v8)
- [Diaphora](https://github.com/joxeankoret/diaphora)
- [Hopper Disassembler 下载](https://www.hopperapp.com/download.html)
- [Compiler Explorer](https://github.com/compiler-explorer/compiler-explorer)
- [LLDB 宣布成为 LLVM 子项目 (2010)](https://blog.llvm.org/2010/06/new-lldb-debugger.html)
- [Boomerang 反编译器](https://boomerang.sourceforge.net/)
- [Tan et al., "LLM4Decompile" (EMNLP 2024)](https://aclanthology.org/2024.emnlp-main.203/)
- [Gao et al., "DecompileBench" (Findings of ACL 2025)](https://aclanthology.org/2025.findings-acl.1194/)
- [Liu, Raff, Micinski, "When LLM Decompilers Recompile More and Preserve Less" (2026)](https://arxiv.org/abs/2609.05370)
