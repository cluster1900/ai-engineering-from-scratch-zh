# 逆向工程全景:历史、工具家族与反编译器的构建方式

> 五种工具阅读相同的目标文件,但给出四种地址,三种基本块计数,以及两个答案,

**Type:** Build
**Languages:** Python, C, x86-64 汇编, Java（一个 Ghidra 脚本）
**Prerequisites:** Phase 13 · 32（从零构建 ELF）, Phase 13 · 33（反汇编与控制流）, Phase 13 · 34（提升为伪代码）
**Time:** ~150 分钟

## 学习目标

- 将这一领域的主要工具放在1973年至2026年带日期时间线上,并指出各自属的家庭.
- 描述反编译器的八个阶段,以及Ghidra、二进制忍者、六射线、雷达2、里津 和愤怒对每个阶段使用的术语──
- 将一条指示升级为ESIL、RzIL、P-代码和VEX,并解释哪些会立即写入标志位,哪些会存储 (延迟计算记录) .
- 将五种工具的地址归结为一个.`.text`偏移,并验证一个函数上这种归结.
- 构建读取已采集的工具输出对比框架,报告指令起点、基本块、边和函数起点的一致性──
- 根据采集证据,指出每种工具都在哪里构建代码,丢失代码,或间接跳转.

## 问题

你请一个代理 总结三种逆向工程工具对`ledger-x86_64-O1.o`中 中`grade`分析――代理运行各工具,读取三份列表,并报告该函数在某种工具中存在`0x08000050`其他地方`0x400010`其他地方`0x100010` 据此,各工具对函数位置存在分歧.

实际上,工具的结论一致. 该目标文件可重定位,没有加载地址,因此每个工具会自行选择一个地址.`.text`现在,所有的答案都是`0x10`应对原始地址,因为没有任何信息告诉它这些地址在各工具中的含义.

随后,同一个代理 读取 `-O0`构建中的`grade`报告四种工具分别给出3、8、8、9个基本块.`jmp rax`△两种工具通过重定位读取跳转表. 一种工具为了放置标签而在跳转处分开基本块.

在信任任何这样的数字之前,你需要本课提供的地图. 第32至36课 构建了解码器,升级器,证据记录和重建结果. 本系列的后半部分将将它们与人们实际使用的工具进行比较.

```figure
re-37-field-map
```

## 用日期串起五十三年

这一领域比大多数工具都很老.

### 1973至1991年:先有调试器,后有反汇编器

最早的反编译学位论文出现在1973年,作者分别是斯坦福大学的荷兰人和普渡大学的豪斯尔,如今人们通过引用了解这两个论文.`adb`根据1979年发布的 UNIX V7 版本,`DEBUG`内含 8086 反汇编器,随着1981年8月的 PC-DOS 1.00 发布.

随后出现了批量处理反汇编器. 在1988年推出的Sourcer对DOS程序进行多次处理,生成注释列表.`objdump`伊尔法克·吉尔法诺夫于1991年1月写下了IDA的第一行代码,并于1991年5月20日以共享软件形式发布了IDA0.1──

### 1991年至2009年:交互式反汇编器与早期反编译器

克里斯蒂娜·西福内斯 1994年7月在QUT完成逆编译技术──她的反编译器`dcc`将 i80286 DOS 程序转换为C;她与Gough 在 1995 年发表的论文确定了所有后来的反编译器沿用阶段.

IDA 于 1996 年在 DataRescue 成为商业产品,1999 年加入插件 SDK,后来转入了 2005 年成立的 Hex-Rays。Hex-Rays Decompiler 1.0 于 2007 年 9 月 17 日发布。同年,Mike Van Emmerik 提交了静态单赋的SSA 文本将将 SSA 静态单赋) 置于反编译器数据流的核心──Halvar Flake 的结构对比可执行对象🏻2004年开创差异比较工具家族,BinDiff 于 2004 年 8 月开始销售──

雷达开始于2006年2月,最初是支持64位偏移的取证十六进制编辑器.

### 2009至 2019年:框架与中间表示

2010年6月8日宣布成为LLVM子项目.使用BIL 中间语言的二进制分析平台BAP在CAV 2011亮相.2011年3月1日收购了Google的BinDiff开发商 zynamics.2011年底或左右,Hopper已经出现在Mac App Store.Matt Godbolt于2012年创立了Compiler Explorer,让C++程序员能够看到编译器生成的汇编.

的第一行代码写于2013年8月――尼克斯论文(Schwartz、Lee、Woo、Brumley,USENIX Security 2013) 展示了保持语义的结构化方法,在8,676个函数中保留了40条`goto`语句──DREAM(Yakdan等,NDSS 2015) 通过不依赖模式的结构化消除了这些`goto`语句。Vector 35 于 2015 年 1 月 14 日成立,Binary Ninja 于 2016 年 7 月 23 日开始销售,带有低级 IL 和 Python API。angr 于 2015 年公开发布,并在 2016 年 8 月的 DARPA 网络大挑战中获得第三名。BinDiff 于 2016 年 3 月改为免费。Cutter 1.0 于 2017 年 12 月为 radare2 提供 Qt GUI。2018 年,Guilfanov 在 Recon 发表 解构器内部:microcode,首次公开介绍 Hex-Rays IR。

### 2019 至 2026 年:开放反编译器与研究转向

NSA于2019年3月5日在RSA会议上以Apache-2.0许可发布Ghidra 9.0,一个月后在GitHub公布完整源码。同年,angr 8.19.2.4 加入初步的反编译器。双色球忍者 2.0于2020年5月20日推出高级IL反编译器。Rizin于2020年12月8日宣布成为radar2的分支,Cutter团队随后迁至它。IDA自由软件 7.6 于2021年5月加入云端 x64反编译器。

果版 8 于 2023 年 9 月 25 日以 Apache-2.0 开源.SAILR 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 果版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版 版`goto`语句,因为Linux 6.1 源码中原本就有3,754条.`idalib`〔学习式反编译器论文从SLaDe(2023) 发展到LLM4Decompile(2024) ‧DecompileBench(2025),以及2026年两项研究,分别讨论代理 辅助可读性,以及重新编译成功更多、语义保留更少的反编译器──

本课运行的版本是截至2026年10月14日的当前版本:Ghidra 12.1.4(2026年9月21日) 、radar2 6.2.4(2026年10月5日) 、rizin 0.9.1(2026年6月29日) 和angr 10.0.3(2026年10月10日) ⋅当前闭源工具是二元忍者 6.0 Krypton(2026年9月3日) 和IDA 9.4(2026年7月13日) ・本课没有运行它们──

## 工具家族

工具按产出类. 一个程序可能跨越多个家庭,而这种重叠正是大多数混的来源.

### 反汇编器

线性扫描从代码节的第一个字节一直解码到最后一个字节.`objdump -d`和 `llvm-objdump -d`没有构建控制流图.`objdump`将符号视为指令边界,并在符号之间扫描.2.47;;2026年7月26日) 采用GPL-3.0或后期.LLVM 23.1.3 采用附带LLVM 例外的Apache-2.0──果的命令线工具 提供`llvm-objdump`显示为果LLVM版本17.0.0,本课采集的就是这个版本.

交互式反汇编器从已知入口进行回归下降,加入识别函数起点的启动式规则,并维护数据库.`Disassembler`首先归降,再对未知区域线性扫描) 霍珀,雷达2 和里津(`aa`,我知道.`aaa`,我知道.`af`作为GUI,搭配切割和IAIT都属于这个家族.安德里斯等) USENIX Security 2016 在编译器生成的二进制文件中测量了其中九种工具.指令准确率接近100%,而困难的基本任务是函数起点识别,假阴性率达到20%或更高.

### 反编译器

商业反编译器包括:Hex-Rays Decompiler(从x86到RISC-V的十二种目标家族) ‧二进制忍者的HLIL 及其伪C染色,以及Hopper的伪代码视图──开放反编译器包括:Ghidra反编译器,即采用Apache 2.0的C++引擎,r2ghidra 和 rz-ghidra将其复用为插件,pypcode将其复用为升级器;基于AIL、使用SAILR 结构化、BSD-2-Clause采用angr反编译器;使用 JavaScript编写的r2和和和和;以及作为历史代表的Boomerang`dcc`射器还内置`pdc`无内置反编译器.无内置反编译器.`pdc`命令,`pdg`需要一个插件.

### 调试器

包括带 GEF 和 pwndbg 前端的 GDB(1986)、LLDB(2010)、带 时间旅行调试的 WinDbg(2017)、OllyDbg(2014年停止更新)、x64dbg(GPL-3.0,2014)、带 Python 连接器的 Ghidra 调试器、二进制忍者 调试器,以及雷达2 和里津 的内置调试器──第 42 课程你会在自己的构建结果上使用其中两种.

### 二进制分析框架

它们是的.`CFGFast`和 `CFGEmulated`、反编译器)、BAP(BIL、OCaml)、Dyninst、Jakstab 和 ByteWeight 是Andriesse 提到的框架──Ghidra 可通过Pyghidra 作为库使用,二进制忍者 通过`import binaryninja`通过了`idalib`,我知道.

### 格式库与引擎库

简单的解码: 关键字 0.9.2 PL-2.0) 负责编编; 独角兽 2.1.4 PL-2.0) 负责仿真――雷达2 6.2.4 捆绑 Capstone 5,里津 0.9.1 附加 Capstone、Zydis 和树座者──

### 差异比较工具与编译器侧查看器

包括BinDiff 8(Apache-2.0) 以及用于IDA Pro、Binary Ninja 和 Ghidra的BinExport 12插件;作为IDA插件的Diaphora 3.4.3(2026年10月11日,AGPL-3.0);以及`radiff2`和 `rz-diff`〔BSD-2-Clause〕显示编译器为源码片段生成的汇编,其方向与本列表中的其余工具的逆向工作正好相反.

### 版本、许可与本课实际运行工具

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

双色球忍者的免费版本仅仅反编译 x86、x86-64、ARMv7 和 AArch64,且没有API──IDA免费 没有 IDAPython、SDK或`idalib`关于这两种工具的每一个陈述都来自其文档和发行说明,图中也标记未运行.

## 逐阶段查看反编译器流水线

1994年,Cifuentes列出了这些阶段:语法分析,语义分析,中间代码生成,控制流图生成,数据流分析,控制流分析和代码生成.她将其分为机器相关的前端,机器和语言无关的中端,以及语言相关的后端.

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

### 载体

加载器解析容器、映射各节,并读取符号和重定位──可重定位目标文件中的内容还没有地址,因此加载器会自动选择──radare2 和 rizin 将文件映射到`0x08000000`让`.text`位于`0x08000040`由于该节目从文件移动`0x40`开始.`.text`放到`0x400000`〔Ghidra 的〕`ElfLoader`将它放到`0x100000`,我知道.`llvm-objdump`打印节内偏移,完全不使用基址。

导入处理中,CLE 会应用重定位.`bin.relocs.apply=true`如何处理重定位,决定后续所有阶段能看到什么,你将在下面的`-O0`跳转表中看到其影响.

### 反汇编

第33课 构建了两种方法.`llvm-objdump`外,每种工具都先递归下降,再加入函数起点搜索――二进制忍者 文档按顺序列列出这些阶段:回归下降、呼叫目标分析、作为对未知的区域进行线性反汇编的CFG分析,以及尾声呼叫分析──Ghidra 按优先运行分析器,拆入入点和Function Start Search位于前期──IDA 维护各有优先自动分析队列,以及库代码的FLIRT 签名──愤怒的`CFGFast`文档列出函数起点的四个来源:符号、函数序言扫描、调用目标,以及剩余字节的完整扫描――最后一个来源正是填充区的虚构函数的原因――

### 恢复资金总和

根据第33课程的方法,各工具分开基本块,但有一种你将亲自测量的差异.`call`处结束基本块,因为它的IRSB是单入口多出口基本块,调用属于出口.`grade`的`-O0`版  其他`grade_label`上,angr 报告 2个块,其他三种报告 1个.

### 提升

双色球忍者将升级定义为从较低层语言翻译到被视为较高层次的中级语言──各类IR的用途不同──P-代码和VEX为分析和反编译而构建──ESIL和RzIL为仿真而构建,没有SSA阶段──Hex-Rays微代码起初是带有72个操作代码类的风险代码,随后经历了`MMAT_GENERATED`到了`MMAT_LVARS`在LIL中将标志位折叠为条件,而在MLIL中将寄存器和内存访问转化为变量.

### 美国国家安全局

范·埃默里克的论文列出了SA作为反编译器带来的能力:表达传播、无需ABI 假设参数与返值识别、保留性分析、作为稀疏数据流问题的类型分析,以及间接跳转和调用分析――Ghidra将SA构建称为`Heritage`,并加入仅存在图中的两种操作:表示phi 的`MULTIEQUAL`和表示副作用`INDIRECT`二进制忍者 在每个IL级暴露SSA形式`Clinic`内部有两个SSA阶段──Hex-Rays没有被命名为SSA的形式,而在全局优化中使用数据流分析──ESIL和RzIL则没有SSA──

### 数据流与类型

字符号 的主简化循环不断执行 删除死代码 传播本地类型 及 执行术语重写 直到不再变化,其中重写由 `Rule`对象池完成──Hex-Rays 转换微代码,在`MMAT_CALLS`检测调用实参,在`MMAT_LVARS`分配局部变量――愤怒运行`CallingConventionAnalysis`,我知道.`VariableRecoveryFast`和 `Typehoon`后者实现了诺南·洛基诺夫和科克的多态类型推断.

### 结构化

吉德拉的`CollapseStructure`搜索匹配某种结构的子图,将其折叠成一个节点;遇到无法继续的情况时,删除一条边并标记为非结构化――Hex-Rays将CFG归约为`if`,我知道.`while`,我知道.`do`和 `switch`其他保留为 goto 区域──angr 识别单入口、单出口区域,默认使用 `SAILRStructurer`结构化,也可选择`PhoenixStructurer`和 `DreamStructurer`◎第34课 写了一个结构化器──

### 输出

吉德拉在`ActionNameVars`和 `ActionSetCasts`之后,通过`PrintC`配合开放 美化打印机输出C代币――Hex-Rays 美化并打印ctree――二进制忍者将HLIL 染为伪C、伪或伪Python──愤怒返回`codegen.text`雷达2 打印`pdc`,我知道.`pdd`或`pdg`,我知道.

## 同一条指令的四种IR

取 `48 83 ec 10`其他`subq $0x10, %rsp`△使用第33课条规则在纸上解码──

1. `48`是 `W = 1`操作数为64位.
2. `83`是带8位立即数的第1组算术操作码――ModRM的规则 字段选择操作――
3. `ec`是ModRM`11 101 100`,我知道.`mod = 11`表示寄存器形式──`reg = 101`是 `/5`其他`sub`,我知道.`r/m = 100`是 `%rsp`,我知道.
4. `10`是立即数,值为16──

测试器中保存了精确的命令和完整的文本.

雷达2 6.2.4 的 ESIL 包含 30 个符号的逗号分隔字符串:

```text
16,0x8000000000000000,-,!,16,rsp,-=,63,$o,^,of,:=,63,$s,sf,:=,$z,zf,:=,$p,pf,:=,64,$b,cf,:=,4,$b,af,:=
```

它是一个机器.`16,rsp,-=`随后,每个标志位都通过内部操作符写入:`$o`表示溢出,`$s`表示符号,`$z`表示零,`$p`显得奇偶,`$b`表示借位

里津 0.9.1 的RzIL 是一个包含 14 个 `set`效果的S表达式:

```text
(seq (set op1 (var rsp)) (set op2 (bv 64 0x10)) (set sub (- (var op1) (var op2))) (set rsp (var sub))
     (set _result (var sub)) (set pf (! (lsb (let _val (cast 8 false (var _result)) ...))))
     (set zf (is_zero (var _result))) (set sf (msb (var _result))) ... (set cf (|| ...)) (set of (|| ...)) (set af (|| ...)))
```

每个标志位都是位向量上的表达式.`let`,我知道.

通过管码4.0.1 从SLEIGH 规范 `x86:LE:64:default`生成的P码,在`IMARK`后有九个操作:

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

这是一个寄存器传输,临时值位于`unique`空间──标志位在命令处立即计算,并且`CF`和 `OF`在减法覆盖`RSP`之前已经算了.

果版 10.0.3 生成的VEX 在 `IMark`后有七条语句:

```text
t2 = GET:I64(offset=48)
t0 = Sub64(t2,0x0000000000000010)
PUT(offset=144) = 0x0000000000000008
PUT(offset=152) = t2
PUT(offset=160) = 0x0000000000000010
PUT(offset=168) = 0x0000000000000000
PUT(offset=48) = t0
```

没有出现标志位. 根据寄存器在客户机状态中的偏移命名寄存器,偏移48就是`rsp`偏移144至168 分别为`cc_op`,我知道.`cc_dep1`,我知道.`cc_dep2`和 `cc_ndep`升级器存储操作码 8,即64位减法,以及两个操作数.`pcode.writesFlags`为了真相而`vex.computesFlags`为错误的原因,也是VEX 在四种表示中最短的原因.

另外,还将使用四种升降器.`48 63 c7`其他`movslq %edi, %rax`(`-O1`下一个`grade`得到了5个ESIL标志.`32,edi,~,rax,=`       `set`、1 个P码操作`RAX = sext(EDI)`没有升级器写入标志位,因为该指令本身不涉及标志位.`(register, 0x0, 8) INT_SEXT (register, 0x38, 4)`寄存器偏移 0 是`RAX`偏移`0x38`是 `RDI`长小分别为8和4字节.

`grade`边界检查中的`83 f9 04`其他`cmpl $0x4, %ecx`产生30个ESIL代币,13个RzIL.`set`效果、10个P码操作,以及7条VEX语句,后者`cc_op`为 7,表示32位减法.`%ecx`△你将在VEX中遇到的两种减法宽度编号为:32位对应 7,64位对应 8;你构建的翻译器将保存这个表.

## 一个函数的四种地址基址

在框架开始比较之前,它必须先统一函数位置的定义.`ledger-x86_64-O1.o`中中 `grade`现在我还在做一次.

| 工具 | `.text` 地址 | `grade` 地址 | 偏移 |
|---|---|---|---|
| `llvm-objdump` | `0x0` | `0x10` | `0x10 - 0x0 = 0x10` |
| radare2, rizin | `0x08000040` | `0x08000050` | `0x08000050 - 0x08000040 = 0x10` |
| angr | `0x400000` | `0x400010` | `0x400010 - 0x400000 = 0x10` |
| Ghidra | `0x100000` | `0x100010` | `0x100010 - 0x100000 = 0x10` |

符号表表示,`grade`位于`.text + 0x10`根据图文的内容,所有工具都一致.`iSj`、r 采集结果的`.text`节条目、Ghidra 采集结果的`.text`网页扫描的基址为零.`test_every_tool_places_grade_at_offset_0x10_from_its_own_base`证实这一事实.

## 工具在哪里一致,在哪里分歧

`code/main.py`中文框架读取采集结果,归纳每个地址,再进行比较.

### 一致性案例: - 下一篇

四个函数,线性扫描中有56条指令,其中符号范围54条,填充区2条. 每种工具在每个函数中报告相同的指令起点:分别为9、14、13、18个.`total`五块和五条边就是第33课的手绘.

唯一差异在填充区间──函数之间的3个字节`grade`后者`66 90`,我知道.`total`后者`90`由于它没有理由停止,`sub_40003e`和 `sub_40005f`雷达2、里津 和吉德拉都不将这些字节认作代码──

### 量化案例:O2 下一篇

在四种图形构建器中,`total`它们是41条指令,10个块13条边缘的第33课程的SSE2循环和处理剩余元素的标量循环,在各工具中切割方式相同.

### 跳转表:- 下级

这种工具出现分歧,而分歧本身就是本课的重点.

| 工具 | 基本块 | 边 | 采集结果的说明 |
|---|---|---|---|
| radare2 | 3 | 2 | `0x62` 处的块没有后继；从未到达 `0x76` 至 `0x9a` 的字节；缺少 8 个指令起点 |
| rizin | 8 | 11 | `0x62` 处的块带有 `switch_op`，其中有 5 个 case 和 4 个不同目标 |
| angr | 8 | 7 | case 块存在，`0x62` 处的控制转移指向一个无法解析的目标节点 |
| Ghidra | 9 | 12 | `0x74` 处的 `switchD` 标签拆分了块；四条 `COMPUTED_JUMP` 流分别指向 `0x76`、`0x7f`、`0x88`、`0x91` |

只有达到相应位置,四种工具解码都是相同的 33条指令.`jmp rax`留下 36 字节未认可,框架将这个范围标志为遗漏代码.`.rela.rodata`五项重定位中读取的目标.`grade`部分块,但仍然没有从跳转块指向它们边缘;其采集结果将是`0x62`处的转移记录指向无法解析的目标节点,反编译器则打印计算式`goto`对于相同的控制流,Ghidra比Rizin多一个块和一个边,因为它的交换器分析在`jmp rax`标签上放标签,基本块模型将在标签处开始新的块.

第33课图有8个块,11条边缘. 子与它完全一致. 重点在于理解,9、11、7、2不是对发现代码数量的四次测量,而是四种工具对一次间接跳跃跟踪多远,选择四个分别的答案.

### 代码中的数据:扫描陷

`lookup`长 24 字节,在`0x10`处包含4个表数据字节`31 c0 90 48`◎ 线性扫描 在该范围内报告 8 个指令起点――框架列出与大多数结果的区别:`0x10`,我知道.`0x12`,我知道.`0x13`更多的起点,在`0x14`缺点起点. 这就是第33课.`addq $0x1, %rax`提前一个字节──雷达2、里津 和 吉德拉 报告 6 个起点、2 个块、1 条边,并将 `0x10`至 `0x14`留作未认领.`lookup`报告相同的2块和1条边,然后在表字节上构成`sub_400010`两个条命令,一个块结束了.`0x14`现在,我还在`lookup`两个块的起点,所以`0x13`处的REX字节不属于任何指令.`0x10`至 `0x14`所以这些函数内部字节是数据.

### 根据统计的数据

在四个目标文件中,框架指出,Angr 设置了9个没有符号的函数,每个都位于填充区或陷表.`-O0`下一个`grade`字节. 它指出线性扫描解码,但没有图形构建器视为代码的9个范围:八个填充空隙加上陷表.

## 三种反编译器分析级

采集工具中有三种:`-O1`下一个`grade`输出类C文本.源码是带五个案例的.`switch (score / 10)`编译后成为边界检查和返回值表.

子 12.1.4:

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

其他:

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

雷达2 6.2.4`pdc`其他:

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

结合流水线阅读这三份输出―― 吉德拉的项重写将乘以`0x66666667`和右移 34 位折叠回 `param_1 / 10`节目的使用模式. 节目的使用方式.`a0 * 1717986919 >> 0x22`雷达2 的`pdc`是ESIL 仿真加伪语法:使用寄存器名,没有变量和类型,边界检查在无符号减法后打印为`<= 0`水通过`DAT_001000b4`为表达赋予类型的声明`g_4000b4[4]`源码有五个元素,但它给出了四个.`-O1`字节中已不再保留转换.`-O0`下,Ghidra 印带案例6至10以及默认的`switch(param_1 / 10)` 打印计算式`goto`,我知道.

没有自己的反编译器,采集记录表明其中没有.`pdc`△二进制忍者的HLIL和六射线树是本课未能采集的两种输出──

## 动手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/37-the-reverse-engineering-landscape
python3 code/main.py
```

输出是一个JSON报告. 首先给出采集时记录的工具版本,以及你机器上存在的工具,后者可能全部缺失. 然后给四个目标文件一个一个符号范围,填补空隙,每个工具使用的基地址,每个工具找到或假设的函数起点,以及每个函数的指令起点一致性,基本块数,边缘和工具的缺少边缘. 结尾是按工具单词统计,工具本身的注册,使用普通句子表达的发现列表,以及IR部分:将翻译器对三条指令的输出,并显示了从采集的升级结果中测量的数量列表.

预期结构:

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

按以下顺序阅读 `code/main.py`其他:

1. `read_text_symbols()`读取节头以及`.text`的`STT_FUNC`符号――符号表是框架唯一的真值依据,`TextSection.gaps()`根据此建议填充区.
2. `parse_objdump()`,我知道.`parse_r2_family()`,我知道.`parse_angr()`和 `parse_ghidra()`结果将变为`ToolView`包含基址,从偏移映射到长度的指令,以及每个函数对应的指令.`FunctionView`解析器只了解工具的词汇,不涉及其他工具.
3. `majority()`和 `ranges()`是每次比较都会使用的两个辅助函数.
4. `function_report()`首先将指令起点与图构造器的多数结果进行比较,再比较基本块数和边集合,并列出每种工具缺少的内容.
5. `byte_report()`将每个字节归类为符号内代码、填充、未认可、虚构或遗漏,并指出符号内没有图构建器解码的字节.
6. `findings()`将这些结果转换为句子,`compare()`为每一个目标文件组装一个报告.
7. `decode_small()`,我知道.`to_pcode_like()`和 `to_vex_like()`构成翻译器:三种寄存器形式的编码,一种立即计算风格,一种的风格──
8. `observed_ir()`测量采集的提升结果,`figure_data()`组装时间线、阶段表和图中展示的证据――

还有三条命令.`python3 code/main.py compare FIXTURE.o`印出单个目标文件报告.`python3 code/main.py ir 4883ec10`打印翻译器对一条命令生成的两种形式.`python3 code/main.py figure-data`打印嵌入图中的数据――

采集由`code/fixtures/capture_tools.py`一次完成,它在`captures.json`中记录每条命令和版本.框架与测试从不启动工具. 如果你安装了这些工具,你可以运行采集脚本刷新文件,并阅读测试器 README 了解所需环境.

## 实际使用

按下列顺序将框架用于新目标文件.

1. 为了了解函数数数量和填充区位置,在打开任何工具前读取符号表.
2. 以无界面模式为每种工具采集一次.将原始输出和精确命令保持在目标文件旁边.无法重新读取的分歧不能算作发现.
3. 检查基址──选择一个函数,确认减去各工具的`.text`如果有工具不一致,停止查找它是什么.
4. 如果图构建器在此处不一致,那么下一个比较讨论是解码,而不是分析.
5. 根据基本块和边,在评判数量前阅读每个工具的注册.`switch_op`,我知道.`COMPUTED_JUMP`或无法解决的目标节点能够解释大多数差异.
6. 工具认领填充区,说明启动规则正在起作用.工具留下符号字节,说明遍历停止.
7. 写出哪些工具没有运行. 根据文件描述,有用,但与采集结果属于不同类型的证据.

## 交互实验

### 实验 A:一个函数,四种基址

在`code`现在打开Python:

```bash
cd phases/13-tools-and-protocols/37-the-reverse-engineering-landscape/code
python3 -q
```

运行:

```python
from main import *
views = load_views("ledger-x86_64-O1.o")
{tool: hex(view.base) for tool, view in views.items()}
{tool: hex(view.functions["grade"].start + view.base) for tool, view in views.items()}
```

运行第二行前,先写下四个原始地址,并对照本课表格检查.`grade`替换为`grade_label`现在,我把它放在Ghidra中位置.

### 实验B:从四个角度看跳转表

```python
report = compare("ledger-x86_64-O0.o")
report["functions"]["grade"]["blocks"]
report["functions"]["grade"]["edgesMissingPerTool"]["radare2"]
report["notes"]["rizin"]
report["notes"]["ghidra"]
report["bytes"]["radare2"]["misses"]
```

统计雷达2 缺少边,将每条边与第 33 课`-O0`列表中的一行对应起. 随后阅读Ghidra注记,并在Ghidra 采集结果中找到.`switchD`标签:

### 实验C:立即计算标志位与

```python
translate("48 83 ec 10")["pcodeLike"]
translate("48 83 ec 10")["vexLike"]
translate("83 f9 04")["vexLike"]
{row["name"]: (row["pcode"]["ops"], row["vex"]["statements"]) for row in observed_ir()["instructions"]}
```

在两个输出中找到`cc_op`常量,并解释为什么一个是8,另一个是7......然后尝试`translate("48 01 c8")`并阅读`TranslateError`,我知道.

### 实验D:五种工具下陷

```python
report = compare("sweep-trap.o")
report["functions"]["lookup"]["instructionStarts"]
report["bytes"]["dataInsideSymbols"]
report["functionStarts"]["angr"]
```

在纸上按线性扫描的方式解码字节`31 c0 90 48 83 c0 01`按下`jmp`后归降方式解码――将两个列表和框架报告的余额和缺失起点对应起来――

## 实践实验

加入第五份采集结果并扩展框架――

要求:

- 选择一个本课没有采集的工具,你可以在自己的机器上运行:GNU`objdump`  配 Capstone  导动导出二元忍者免费会话,或使用不同的分析器集合的字符串.`captures.json`中记录精确命令和版本.
- 编写一个解析器,将采集结果转换为 `ToolView`包含工具的基地址,指令,函数以及工具提供时的基本块和边缘.
- 将工具加入`TOOLS`加入,如果它构建图,也加入`DESCENT_TOOLS`运行演示,查看大多数集合发生了什么变化.
- 编写一个测试,断言工具在`ledger-x86_64-O1.o`上的基本块数;再编写一个测试,断言它如何处理陷表.
- 为本课写一段文字,用工具自己的术语说明它如何称呼加载器"",反汇编器和CFG"",

成功标准是:`python3 code/main.py`在`captureTools`中报告新工具`ledger-x86_64-O1.o`保持每个函数`allDescentToolsAgree`为真,而且`sweep-trap.o`发现说明新工具如何处理`0x10`至 `0x14`字节:

## 本课产物

本课包含`outputs/skill-the-reverse-engineering-landscape.md`△使用它运行在您构建的目标文件上,将地址归结为相同基准,并逐函数报告它们在指令起点,块和边缘上的一致性,以及各工具的构造或遗漏字节. 它要求从文件本身收集结果记录命令和版本符号表,并声明哪些工具仅根据文档描述.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/37-the-reverse-engineering-landscape
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明:

- 读取器在`ledger-x86_64-O1.o`在中找到四个函数符号,大小为16、46、31、63,并找到两个填空空隙
- 搜集结果包括86、56、84、11条指令
- 雷达和子在`ledger-x86_64-O1.o`报告相同的指令, 块和边, 只有雷达.`pdc`文本
- 气将`sub_40003e`和 `sub_40005f`标为没有符号的函数
- 德拉对`total`分开的块是第33节的五块,调用流不是图中的边缘
- 放弃自己的基地,每个工具都会.`grade`放在偏移`0x10`
- 每种工具对`ledger-x86_64-O1.o`中每一个函数的每个指令都一致
- 四种图形构建器其中报告3、3、5、4块和2、3、5、4条边,边集合相同
- `-O2`下一个`total`每个图形构建器中,有10块和13条边.
- `-O0`下一个`grade`在雷达2、里津、怒、Ghidra 中分别有3、8、8、9个块和2、11、7、12条边,原因见各工具注记
- `-O0`下一个`grade_label`在所有工具中,都是一个块,只有在调用中结束基本块
- 在每个填空隙中,设置一个函数,并在陷表上重新设置一个;其他工具没有设置或遗漏函数
- 线性扫描 在陷中多出起点`0x10`,我知道.`0x12`,我知道.`0x13`丢失了`0x14`没有构建器解码`0x10`至 `0x14`
- 发现列表指出雷达2 遗漏的范围和愤怒 构造的每个函数
- 清单为全部 21 集文件记录版本和命令
- 三种工具反编译 `grade`只有Ghidra 折叠除法常用的模式
- 翻译器的一种风格立即写入CF、OF、SF、ZF、PF,另一种写入`cc_op`对于`cmp`写寄存器,对于`movslq`不写标志位
- 翻译器拒绝内存形式、其他操作码、额外的REX位和错误长度
- 翻译器的`cc_op`编号8和7与采集的VEX中相同
- 采集的提升结果对三条指令分别给出9、1、10个P码操作和7、4、7条VEX语句
- 时间线按顺序从1973年延长到2026年,流水线有八个阶段和六种工具,每个单元都有术语,两个闭源工具标志为未运行
- 交互图嵌入式数据与框架生成的数据相同

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

每种工具一次收集,记录命令和版本,将每个地址归结为同一基准,先比较指令起点,再比较块,最后比较边缘.

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
