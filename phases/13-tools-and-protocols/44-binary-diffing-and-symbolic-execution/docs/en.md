# 二进制差异比较与符号执行：匹配函数并求解输入

> 两个函数的匹配，是某种签名以某种质量给出的结论；求解出的输入，是某条路径条件的一个模型。本课构建这两种方法，并对照 radiff2、Ghidra、angr 和 z3 检查。

**Type:** Build
**Languages:** Python, C, x86-64 assembly, Java (one Ghidra script)
**Prerequisites:** Phase 13 · 33（反汇编与控制流）、34（提升为伪代码）、36（重建并证明等价）
**Time:** ~150 分钟

## 学习目标

- 从目标文件及清单构建五种函数签名：精确字节、屏蔽重定位字段后的字节、助记符序列、控制流图形状和符号名称。
- 运行 BinDiff 风格的分阶段贪心匹配器，只有签名在两侧均唯一时才匹配，并记录每个匹配背后的阶段和质量。
- 复现两个字节完全相同的函数在加载映像上无法通过字节关联器、屏蔽后却能通过的情况，并用重定位算术解释四个变化字节。
- 根据 Levenshtein 距离复现 radiff2 的相似度比例，并解释为何其中一个比例只有在比较 radare2 实际到达的 82 字节时才出现。
- 在小型 IR 上枚举函数路径，为每条路径携带条件，并用有界搜索为每个叶节点求解输入。
- 测量具有符号边界的循环中的路径爆炸，并将数量、类别和模型与 angr 10.0.3、z3 5.1.0 比较。

## 问题

你以 `-O2` 重建了 `ledger.c`，询问 agent 相比 `-O1` 构建是否有变化。agent 运行差异工具后报告 `grade` 被修改，因为它在两个加载后程序中的字节不同。随后它用掉分析预算，解释一个并不存在的变更。两个目标文件中 `grade` 的 46 字节完全相同。工具比较的是重定位后的映像，而 `-O2` 程序的 `.rodata` 后移了 0x70 字节，因此 `grade` 中一个位移增加了 0x70。

同一天下午，你问哪个分数会让 `grade` 返回 4。agent 阅读伪代码后回答“90”。这只是一个答案。函数对 90 至 109 的每个分数都返回 4，而问题没有限定边界，因此你需要的是集合，agent 却给了一个样本。

两种失败源于同一个缺口：匹配和求解输入都是背后有方法支撑的结论。本课用 Python 标准库构建这两种方法，并在旁边运行生产工具。工具与代码一致时，你有两条推导；不一致时，则有地址、字节或边界可供检查。

```figure
re-44-matches-and-paths
```

## 函数签名是带质量的结论

Flake 在 2004 年将二进制比较描述为：在两个相似可执行文件的函数集合间构建同构。Dullien 和 Rolles 在 2005 年将其扩展到基本块和指令。BinDiff 概念页描述了由此发展出的策略：计算两侧每个函数的一种属性；若某值在每侧恰好出现一次，就构成匹配；出现多次的值有歧义，需要在该等价类内部用下一属性继续细分；没有对应项的值保持未匹配。每轮之后，新匹配的调用者和被调用者形成小集合，下一属性在其中更可能唯一，随后用下一属性重复过程。

每种匹配算法带有质量。该页面将原始函数字节的哈希匹配和名称哈希匹配评为非常好；流图 MD 指数和素数签名匹配（每个助记符对应一个小素数，取整个函数的乘积）评为好；字符串引用评为中等；循环数量或地址序列评为差。匹配置信度是产生匹配的算法质量的平均值，并经过 sigmoid 加权。函数相似度大约由 25% 的匹配流图边、15% 的匹配基本块、10% 的匹配指令和 50% 的流图 MD 指数差异组成，再乘以置信度。

本课保留其中五种属性，以及最重要的一条规则：两侧均唯一，否则不匹配。我们省略 MD 指数，因为概念页只给出名称没有公式，改用普通度序列。质量标签仍保留，因为匹配的可靠性受产生它的最弱事实限制。

## 从一个函数记录得到五种签名

差异比较器为每个目标文件读取两类信息。ELF 提供字节、符号大小和 `.rela.*` 记录；`llvm-objdump -d` 清单提供指令边界和助记符，第 33 课已经证明解码器在这些目标文件的每条指令上与清单一致。`function_record()` 检查每条清单指令的字节是否等于目标文件对应地址的字节，否则抛出异常。过期清单意味着样例发生了变化。

以 `ledger-x86_64-O1.o` 中的 `grade` 为例。符号给出偏移 0x10、大小 46，因此记录覆盖 0x10 至 0x3e，不包含用于对齐下一函数的两字节 `nop`。

精确字节签名是这 46 字节的 SHA-256。屏蔽字节签名先将每个重定位字段置零。这里只有一个字段：偏移 0x36 处的记录 `R_X86_64_PC32 .rodata+0x10`，宽四字节，是 0x33 处 `leaq (%rip), %rcx` 的位移。在 RELA 目标文件中，这四字节原本就是零，所以这里每个目标文件的每个函数的两种签名都一致。屏蔽操作是为下一节准备的。

助记符签名对以下 14 个助记符的序列取哈希：

```text
movslq imulq movq sarq shrq addl addl xorl cmpl ja movl leaq movl retq
```

流图形状签名来自第 33 课的基本块和带类型边，并且仅包含入口可达的块。`-O1` 下的 `grade` 有三个块、三条边。块 0x10 以 `ja 0x3d` 结束，有一条跳转边和一条顺序落下边；块 0x31 顺序进入 0x3d；0x3d 返回。度序列按排序后的顺序列出各块的（入度，出度），因此签名为 `3b 3e [0/2,1/1,2/0]`。对 `-O0` 下的 `grade`，记录与第 33 课一样，通过五个 `.rela.rodata` 条目解析间接跳转，得到八个块、十一条边，其中四条是 `table` 边。

名称签名就是符号名称。存在时它是最强事实，构建被剥离符号时则毫无作用。

还有一个字段用于后面的补丁案例。当函数包含指向 `.rodata` 的 `lea` 重定位、边界检查和索引加载时，`referenced_table()` 按第 36 课的方式读取表：`ja` 前的 `cmpl $0x4` 表示五个条目，加载 `movl (%rcx,%rax,4), %eax` 表示每项四字节。`-O1` 下 `grade` 的 `.rodata+0x14` 表内容为 `1, 2, 3, 4, 4`。

## 贪心匹配器

`match_functions()` 按顺序运行各阶段。每个阶段按该阶段签名分别对两侧尚未匹配的函数分组，接受所有在每侧恰有一个函数的值。匹配记录阶段、阶段质量、其他同样一致的签名，以及相似度比例。

```python
for stage in order:
    for signature, candidates in left_groups.items():
        partners = right_groups.get(signature, [])
        if len(candidates) != 1 or len(partners) != 1:
            continue
        a, b = candidates[0], partners[0]
        agreeing = [s.id for s in STAGES if a.signatures()[s.id] == b.signatures()[s.id]]
        matches.append(Match(a, b, stage, agreeing, radare2_ratio(a.raw, b.raw), data_equal))
```

本课的顺序先运行四个结构阶段，最后才用名称，使结构阶段接受检验，再由名称事后评判。`-O1` 与 `-O2` 比较如下：

| 函数 | 阶段 | 一致的签名 | 相似度 |
|---|---|---|---|
| `percent_change` | 精确字节 | 全部五种 | 1.000 |
| `grade` | 精确字节 | 全部五种 | 1.000 |
| `total` | 名称 | 仅名称 | 0.171 |
| `grade_label` | 精确字节 | 全部五种 | 1.000 |

`total` 从 31 字节、13 条指令增长为 140 字节、41 条指令，因为 clang 用 SSE2 向量化循环，并保留了标量余数循环。其形状从五块五边变为十块十三边。结构属性全部改变，只有符号将两者联系起来。

对 `-O0` 与 `-O1`，同样的顺序产生一个错误匹配：

| -O0 函数 | 匹配的 -O1 函数 | 阶段 | 名称一致 |
|---|---|---|---|
| `percent_change` | `grade_label` | 流图形状 | 否 |
| `grade` | `grade` | 名称 | 是 |
| `total` | `total` | 名称 | 是 |
| `grade_label` | 未匹配 | | |

`-O0` 下的 `percent_change` 是四块菱形：入口判断 `before == 0`，两个分支臂，再汇合返回。其度序列为 `0/2, 1/1, 1/1, 2/0`。`-O1` 下的 `grade_label` 内联了 `grade`，在边界检查周围具有相同菱形。该形状在两侧均唯一，规则就接受它。中等质量标签是警告，随后运行的名称阶段则与它矛盾。错误匹配还占用了右侧的 `grade_label`，导致真正的 `percent_change` 和 `grade_label` 配对保持未匹配。

存在真实名称时，BinDiff 顺序将名称匹配放在第二阶段，代码中的 `BINDIFF_ORDER` 也如此。使用该顺序，全部四个 `-O0` 函数都按名称匹配到其 `-O1` 版本，这也是下文 Ghidra 的结果。演示保留两种顺序，使失败可见。四节点流图形状，同样也是每个在返回前汇合的 `if` 和 `else` 的形状。

## 相同字节，重定位后的操作数

Ghidra 导入目标文件时应用重定位，因此其字节关联器比较加载后的映像，第 36 课也正因如此屏蔽重定位字段。`load_image()` 复现导入过程：按节头顺序遍历已分配节，按各自 `sh_addralign` 对齐，从 0x100000 开始布局；随后应用每条记录：`R_X86_64_PC32` 和 `R_X86_64_PLT32` 将 `S + A - P` 写为有符号 32 位值，`R_X86_64_64` 将 `S + A` 写为 64 位值。

两个程序的每个节起点都与 Ghidra 12.1.4 一致，测试套件对照捕获的 Version Tracking 输出检查这一点：

| 节 | `-O1` 程序 | `-O2` 程序 |
|---|---|---|
| `.text` | 0x100000，159 字节 | 0x100000，271 字节 |
| `.rodata` | 0x1000a0 | 0x100110 |
| `.rodata.str1.1` | 0x1000f0 | 0x100160 |

`-O2` 下 `.text` 增长 112 字节，即 `total` 的增量，因此 `.rodata` 后移 0x70 字节。两个程序的 `grade` 都位于 0x100010。偏移 0x33 处的 `leaq` 的位移字段在 0x36，指令结束于 0x3a。重定位加数 0x10 加上通常的 4，使表位于 `.rodata+0x14`。

在 `-O1` 映像中：`0x1000a0 + 0x14 - 0x10003a = 0x7a = 122`。在 `-O2` 映像中：`0x100110 + 0x14 - 0x10003a = 0xea = 234`。一个映像的字段字节为 `7a 00 00 00`，另一个为 `ea 00 00 00`。46 字节中一个字节不同，Levenshtein 比例为 0.978，精确字节阶段失败；屏蔽字节阶段将字段清零后通过。`grade_label` 与其表同样移动了 0x70，因此位移保持相同，在两种视图中都通过精确字节匹配。

Ghidra 报告相同划分。对 `-O1` 与 `-O2`，Exact Function Bytes Match 找到 `percent_change` 和 `grade_label`；Exact Function Instructions Match 额外找到 `grade`；Exact Function Mnemonics Match 找到相同三个函数。指令关联器屏蔽操作数，因此覆盖该位移。本课映像视图的精确字节匹配恰好对应 Ghidra 字节关联器找到的两个函数，屏蔽字节一致性恰好对应其指令关联器找到的三个函数。测试套件断言这两种相等关系。

rea 6.5.0 的 `compare_functions` 对 provider 文本进行逐行差异比较。在汇编维度，它附带限制“relocation normalization is unavailable”。本课的加载器和屏蔽操作提供了该归一化。

## radiff2 测量什么

radare2 6.2.4 提供 `radiff2`。使用 `-AC` 时，它分析两个文件，为每个函数打印一行：左侧大小与地址、MATCH 或 UNMATCH、比例、右侧大小与地址。本课目标文件的捕获行如下：

| 比较对 | `percent_change` | `grade` | `total` | `grade_label` |
|---|---|---|---|---|
| `-O0` 对 `-O1` | UNMATCH 0.130435 | UNMATCH 0.426829 | UNMATCH 0.106061 | UNMATCH 0.269841 |
| `-O1` 对 `-O2` | MATCH 1.000000 | MATCH 1.000000 | UNMATCH 0.171429 | MATCH 1.000000 |
| `-O1` 对 `-O1` | MATCH 1.000000 | MATCH 1.000000 | MATCH 1.000000 | MATCH 1.000000 |

radare2 源码中的比例为 `1 - distance / max(len_a, len_b)`，其中距离是两个函数指纹之间的 Levenshtein 距离，指纹是按地址顺序拼接函数基本块的结果。匹配阈值为 0.7。`code/main.py` 中的 `radare2_ratio()` 对原始函数字节实现相同公式，将 0.130435、0.106061、0.269841 和 0.171429 复现到小数点后六位。

它无法复现 `-O0` 下 `grade` 的 0.426829。对该函数全部 118 字节，比例为 0.296610。radare2 在大小列打印 `118`，但它的指纹更短。不应用重定位时，它无法解析跳转表，因此分析只到达入口块、以 `jmpq *%rax` 结束的块、默认分支和返回：共 82 字节，正是第 33 课普通递归下降认定的那 82 字节。这 82 字节与 `-O1` 的 46 字节之间的 Levenshtein 距离为 47，因此 `1 - 47/82 = 0.426829`。启用 `-e bin.relocs.apply=true` 后，radare2 找到全部 118 字节，打印 0.288136，等于本课对重定位映像计算的比例；映像中的四个位移字节不同于目标文件的零字段。只有比较相同字节时，两个工具才会一致，而大小列并不说明实际输入了哪些字节。

`-O` 将指纹限定为操作码字节，并将操作数置零。`-O0` 对 `-O1` 的比例提高到 0.239130、0.512195、0.303030 和 0.523810；`total` 在 `-O1` 对 `-O2` 时提高到 0.192857。还可以计算整个文件的距离：`-s`（Myers）报告两个目标文件相似度 0.956、距离 162；`-ss`（Levenshtein）报告 0.927 和 137。这些数值包含头、符号表和重定位节，不能说明函数情况。

## Ghidra Version Tracking 关联器

Ghidra 的 Version Tracking 工具通过关联器将源程序与目标程序匹配。函数关联器包括 Exact Function Bytes Match、Exact Function Instructions Match（屏蔽操作数）、Exact Function Mnemonics Match，以及 Duplicate Function Instructions Match（1:N 和 N:M）。数据关联器包括 Exact、Duplicate 和 Similar Data Match。符号关联器按名称精确、重复或相似匹配。引用关联器使用已接受匹配寻找更多匹配。目标程序必须已定义函数，最小函数长度默认为 10 字节。Auto Version Tracking 依次运行 Exact Symbol Name、Exact Data、Exact Function Bytes、Exact Function Instructions、Exact Function Mnemonics、Duplicate Function Instructions，最后是引用关联器，并为已接受项创建隐含匹配。11.2 加入了 BSim 关联器。

本课以无界面方式捕获关联器输出。`capture_ghidra_vt.sh` 将三个目标文件导入项目，运行 `ListVersionTrackingMatches.java`。这个短脚本继承 `AbstractGhidraVersionTrackingScript`，按路径打开源和目标程序，依照 Auto Version Tracking 顺序运行六个非引用关联器，并为每个块、函数、关联器和匹配打印一行。本节所有数值均来自这两个文本文件。

| 关联器 | `-O0` 到 `-O1` | `-O1` 到 `-O2` |
|---|---|---|
| Exact Symbol Name Match | 4 个函数 | 4 个函数、5 个数据项（`labels.rel`、`.L.str.1` 至 `.L.str.4`） |
| Exact Data Match | 0 | 0 |
| Exact Function Bytes Match | 0 | 2（`percent_change`、`grade_label`） |
| Exact Function Instructions Match | 0 | 3（增加 `grade`） |
| Exact Function Mnemonics Match | 0 | 3 |
| Duplicate Function Instructions Match | 0 | 0 |

从 `-O0` 到 `-O1`，每个函数都发生变化，因此只有名称匹配，这也是本课匹配器采用 BinDiff 顺序时的结果。每个匹配打印相似度 1.000、置信度 10.000。帮助页却将精确关联器描述为相似度 1.0、置信度 1.0，因此打印置信度的量纲是本课记录但不解决的开放问题。

Tools 下的 Program Differences 是另一回事。它针对同一地址空间的两个程序，在相同地址比较字节、标签、代码单元、引用、注释和函数。它是按地址对齐的差异比较，不会匹配移动过的内容。

## 根据文档了解 Diaphora 和 Binary Ninja

Diaphora 是 IDA Pro 插件，首次发布于 2015 年，截至 2026-08-18 为 3.4.2。自 2.0 起采用 AGPL-3.0，需要 IDAPython，因此可在 IDA Home 或 IDA Pro 中运行，不能在 IDA Free 中运行。它将每个数据库导出到 SQLite，以 SQL 查询运行启发式。每种启发式有名称、Best/Partial/Unreliable 类别、比例类型，以及 SAME_CPU 或 SLOW 等可选标志。当前源码中的名称类似本课阶段，但更多：Bytes hash、Same address and mnemonics、Same cleaned assembly、Mnemonics small-primes-product、Same nodes, edges, loops and strongly connected components、Topological sort hash，以及需要 Hex-Rays 反编译器的伪代码模糊哈希。发布说明展示了调优历史：慢速启发式只在约 2,000 个函数以下运行，“Same graph”被移到不可靠类别。这正是本课四块菱形问题在大规模场景下的表现。

2026-09-03 发布的 Binary Ninja 6.0 加入 Binary Similarity 框架，包含 provider 和 resolver。它将 BinDiff 作为结构 provider，并提供 WARP，用于容忍可重定位操作数的精确函数匹配。指南建议：函数除了可重定位指令外一致时用 WARP；重新编译后仍保持结构联系时用 BinDiff。该功能仅限 Ultimate 版。此处未通过包管理器安装 Binary Ninja，也没有运行它，因此本段仅依据文档。

BinDiff 自 2023-09-25 起以 Apache-2.0 开源，最新发布版为 v8。它需要反汇编器和 BinExport 插件，后者支持 IDA Pro 9.4 或更新版本、Binary Ninja 和 Ghidra。学习者的免费路线是 Ghidra 加 BinExport 加 BinDiff 命令行。本课没有运行它，实践实验会要求你运行。

## 相同代码，不同常量

第 36 课保留了一个 `grade` 候选重建，其表的最后一项为 3，而原始值为 4。`grade_case10_wrong.o` 与 `-O1` 下的 `grade` 具有完全相同的 46 个代码字节。匹配器按精确字节配对，所有签名一致。引用表检查通过一个重定位读出 `1, 2, 3, 4, 4`，通过另一个读出 `1, 2, 3, 4, 3`，报告 `dataEqual: false`。另外三个 `-O1` 函数在左侧未匹配，因为候选目标文件只有一个函数。

这就是补丁分析的典型形态。只检查代码字节的函数比较器会说没有变化。Ghidra 的 Exact Data Match 和 BinDiff 的字符串引用匹配也是为此而存在。本课的版本很小：对每个匹配对，比较函数重定位所指向的字节，数量来自边界检查，宽度来自加载。

## 符号执行：路径、条件和求解器

King 在 1976 年描述了符号执行。输入变为符号，每条语句更新符号存储，每个分支向路径加入条件，求解器判断路径是否可行，并产生沿该路径执行的具体输入。带分支的函数变成路径树，叶节点就是附带条件的返回。

Baldoni、Coppa、D'Elia、Demetrescu 和 Finocchi 在 2018 年综述了该领域。其第 5 节指出路径爆炸是核心成本：执行器可能在每个分支处分叉，因此状态数可随分支数量指数增长；若循环边界依赖符号输入，就会产生无界路径集合。缓解措施包括：每个分支求解并剪去不可行路径、函数和循环摘要、状态合并，以及欠近似。混合执行同时以具体和符号方式运行程序，记录具体运行上的条件，将其中一个取反，再向求解器请求下一个输入。代表系统有 DART（2005）、CUTE（2005）和 SAGE（2008）。

KLEE（Cadar、Dunbar、Engler，OSDI 2008）是 LLVM bitcode 上的符号虚拟机，因此输入是 `clang -emit-llvm` 输出，而不是二进制。它提供 POSIX 环境模型和重放库。在 89 个 GNU coreutils 程序上，它达到 84.5% 行覆盖率，开发者测试为 67.7%，并发现 56 个严重缺陷。KLEE 3.2 于 2025-12-23 发布，采用 NCSA 许可证，推荐 LLVM 16。

angr 面向二进制工作。`angr.Project` 包含映射目标文件并应用重定位的 CLE 加载器，将块转换为 VEX IR（`block.vex`）的提升器，可用 pypcode 替代，以及状态工厂。`SimState` 保存寄存器、内存和求解器。`SimulationManager` 对名为 `active`、`deadended`、`found`、`avoided` 和 `errored` 的状态集合步进，`explore(find=..., avoid=...)` 封装该过程。每步引擎依次处理失败、系统调用、钩子、用于具体数据的 unicorn，最后回退到 VEX。claripy 是 Z3 之上的求解前端，在 angr 10.0 中改为内置 Rust 实现，通过 `from angr import claripy` 导入。angr 10.0.3 于 2026-10-10 上传，采用 BSD-2-Clause，需要 Python 3.12 或更新版本。Z3 5.1.0 于 2026-08-16 发布，采用 MIT，是 angr、Triton 以及 KLEE 可选后端背后的求解器。

## 基于第 34 课 IR 的小型执行器

`code/main.py` 中的执行器使用小型 IR，语句形态与第 34 课一致：`Assign`、`Branch`、`Jump`、`Return`，另加第 34 课实践实验要求实现的 `Switch` 终结指令。表达式包括 `Const`、`Var`、带宽度的 `Bin`、`Cast`、从命名具体表读取的 `Load` 和 `Not`。四个样例函数是在第 34 课简化后达到的层级手工提升的，此时 `0x66666667` 乘法已变为 `score / 10`，每个 IR 块都列出来源指令地址。`check_ir_against_listing()` 断言这些地址恰好覆盖函数清单一次。

该 IR 中 `-O0` 下的 `grade`：

```text
0x30: local_8 = score; local_10 = score / 10 - 6; if (local_10 >u 4) goto 0x9a else 0x62
0x62: switch local_10 -> 0x91, 0x88, 0x7f, 0x76, 0x76
0x76: local_4 = 4; goto 0xa1        0x7f: local_4 = 3; goto 0xa1
0x88: local_4 = 2; goto 0xa1        0x91: local_4 = 1; goto 0xa1
0x9a: local_4 = 0                    0xa1: return local_4
```

分支表目标来自 `jump_table_targets()`，采用与第 33 课相同的重定位算术，因此 IR 实际读取样例。

`execute()` 维护路径状态工作列表。状态包含当前块、块轨迹、条件列表，以及将每个变量映射为输入表达式的环境。`Assign` 将环境代入源表达式并保存结果。`Branch` 将环境代入条件，然后请求求解器两次：一次加入条件，一次加入其否定。求解器无法满足的一侧被丢弃，这就是综述所说的即时剪枝。`Switch` 按目标对表项分组，对每个不同目标分叉一次，条件是各表项相等条件的析取；angr 也如此处理符号跳转目标。`Return` 将环境代入返回值并关闭叶节点。轨迹超过步数限制时，该路径被标为截断并停止。

手工沿着到达 `return 4` 的路径走一遍。入口赋值 `local_10 = score / 10 - 6`。此路径上的分支条件 `local_10 >u 4` 为假，因此条件列表包含 `!(score / 10 - 6 >u 4)`。switch 条目 3 和 4 都指向 0x76，所以进入 0x76 的分叉加入 `score / 10 - 6 == 3 || score / 10 - 6 == 4`。块 0x76 赋值 `local_4 = 4`，跳到 0xa1，返回值代入后为 `4`。叶节点就是该条件与该值组成的二元组。

求解器为 `BoundedSearch`。它为每个输入保存有限域，枚举这些域的笛卡尔积，并按 C 语义计算每个约束：32 位回绕、截断除法、有符号与无符号比较，以及算术或逻辑移位。除零或表索引越界会使该赋值无法满足约束。`score` 在 -200 至 1200 时，`grade` 的五条路径需要 44,460 次求值，耗时几毫秒。为每个叶节点求解输入集合，得到：

| 叶节点 | 返回值 | 条件 | 边界内的分数 |
|---|---|---|---|
| 0x76 | 4 | `!(q >u 4) && (q == 3 \|\| q == 4)` | 90 至 109，20 个输入 |
| 0x7f | 3 | `!(q >u 4) && q == 2` | 80 至 89，10 个输入 |
| 0x88 | 2 | `!(q >u 4) && q == 1` | 70 至 79，10 个输入 |
| 0x91 | 1 | `!(q >u 4) && q == 0` | 60 至 69，10 个输入 |
| 0x9a | 0 | `q >u 4` | 1,351 个输入，即域中其余输入 |

`q` 代表 `score / 10 - 6`。`-O1` 下的 `grade` 也产生相同类别，但其 IR 只有两条路径：返回 `lookup_14[q]` 的查表路径，以及返回 0 的默认路径。因为没有可到达的 case 块，问题变成对返回值的约束。表 `lookup_14` 从目标文件 `.rodata` 的 0x14 处读取。

边界就是该方法的限制。有界搜索在域内完备，在域外不作结论。在 -200 至 1200 内，60 至 109 中没有分数返回 0，110 或更大的分数中没有返回非零值。z3 为全部 2^32 个分数证明这两项；下一节展示两种方法会在哪些地方返回不同见证。

## 测量路径爆炸

`-O1` 下的 `total` 是第 33 课的循环：先检查 `count`，循环体累加 `values[rdx]` 并递增 `rdx`，当 `rdx != rcx` 时通过 `jne` 回到循环体。IR 中 `rcx` 为 `zext64(count)`，`rdx` 从 0 开始。每次经过回边，都在 `rdx != count` 上分叉，其中 `rdx` 为常量，因此 `count = c` 的路径运行循环体 `c` 次后退出。将 `count` 限定为 0 至 2，执行器找到 3 条路径；0 至 4 时为 5 条；0 至 8 时为 9 条。每条路径返回该计数对应的三角数：（0, 0）、（1, 1）、（2, 3），直至（8, 36）。angr 在三个优化级别上都报告 3、5、9 个 deadended 状态，以及相同的九个计数与和配对，包括 `-O2`；其向量循环要求计数至少为 8，因此在此范围内不改变路径数。

没有边界时，执行器永远不会结束，因为每个迭代次数都是另一条可行路径。本课将每条路径限制为 24 个块，以 `count` 最大 64 运行时返回 22 条路径、截断 2 条，并且 65 条可能路径中的另外 41 条从未开始。报告给出这三个数字。求解成本也增长：边界 2 时求值 33 次，4 时 115 次，8 时 531 次，受限运行时 6,900 次。

## 用 angr 和 z3 回答相同问题

`capture_angr.py` 在三个目标文件上运行 angr 10.0.3。CLE 使用 ELF 后端将每个可重定位目标文件加载到 0x400000，对 `-O0` 应用 13 个重定位，对其他文件应用 8 个，并解析四个符号。对具有一个符号 64 位参数的 `grade`，`run()` 在 `-O0` 下得到 5 个 deadended 状态，`-O1` 和 `-O2` 下各 2 个，耗时分别为 0.475、0.408 和 0.318 秒。向每个终止状态加入 `eax == v`，请求求解器给出有符号最小值与最大值，在每个优化级别上，`v` 为 1 至 4 时都得到 60 至 69、70 至 79、80 至 89、90 至 109；为 0 时得到 -2147483648 至 2147483647。两项交叉检查均为 unsat。

到达指定块的形式对 `-O0` 下的 `grade` 使用 CFGFast，列出第 33 课找到的八个块，再通过 `explore(find=0x400076)` 寻找存储 4 的块。0.47 秒后找到一个状态，仍有三个 active 状态；参数最小值 90、最大值 109，样本为 91、93、94、97 和 101。

对 `percent_change`，得到两个 deadended 状态，约束分别为 `before[31:0] != 0` 和 `before[31:0] == 0`。对非零状态请求 `eax == 50`，在 `-O0` 下得到 `before = 21055744, after = 332315210`，在 `-O1` 下得到 `40566804, 834296877`，在 `-O2` 下得到 `-24484867, 993934694`。-16 至 16 内的有界搜索给出 `before = -10, after = -15`。z3 对第 34 课清单回答相同问题，给出 `before = -25092599, after = 305712160`。测试套件用 IR 求值器计算全部五对输入，每对结果均为 50。模型证明存在某个输入，并不是唯一输入；三个正确工具给出了不同答案。

`capture_z3.py` 用 32 位位向量建模 `grade` 的 `-O1` 清单，包含乘法、两次移位和表，并提出另外四个问题。是否存在某个 32 位分数，使清单与源码 `switch` 不同：0.068 秒内得到 unsat，因此编译函数在全部 2^32 个输入上等于源码。清单是否与第 36 课阈值重建不同：在分数 706346536 处得到 sat，此时 `score / 10` 为 70634653，switch 进入默认分支，而阈值版本返回 4。将相同差异限定在 0 至 109：unsat，这就是第 36 课网格未能发现差异的原因。对 `percent_change`，要求 `before == 3` 且结果为 -133，在 `after = 1073741823` 时得到 sat，即第 36 课的溢出单元；有界搜索在自身域内找到第二个见证 `after = -1`，此时 `(-1 - 3) * 100 / 3` 截断为 -133，完全没有溢出。

## 亲手构建

运行演示：

```bash
cd phases/13-tools-and-protocols/44-binary-diffing-and-symbolic-execution
python3 code/main.py
```

输出是一份 JSON 报告。`diffs` 保存 `-O0` 对 `-O1`、`-O1` 对 `-O2` 的目标文件与加载映像匹配，以及按 BinDiff 顺序运行的 `-O0` 比较对。`toolComparison` 将每个函数的本课阶段、radiff2 判定和比例、Ghidra 关联器并列。`patch` 是 `grade_case10_wrong.o` 案例。`radare2Ratios` 复现 radiff2 数值，`gradeRelocationCase` 展示布局和两个位移，`symbolic` 保存路径、类别和爆炸计数。

按以下顺序阅读 `code/main.py`：

1. `ElfObject` 读取节、符号和 `.rela.*` 记录，`parse_listing()` 读取 `llvm-objdump` 文本。
2. `jump_table_targets()` 和 `build_cfg()` 给出可达块和带类型边。`FunctionRecord.signatures()` 构建五种签名。
3. `load_image()` 布局已分配节，并应用 `S + A - P` 和 `S + A`。
4. `match_functions()` 是分阶段匹配器；`levenshtein()` 和 `radare2_ratio()` 提供相似度。
5. `parse_radiff2()` 和 `parse_ghidra_vt()` 读取捕获的工具输出，用于比较。
6. `evaluate()`、`substitute()` 和 `BoundedSearch` 提供表达式语义和求解器。
7. `execute()` 枚举路径，`solve_returns()` 向每个叶节点请求输入集合。
8. `grade_ir_o0()`、`grade_ir_o1()`、`percent_change_ir_o1()` 和 `total_ir_o1()` 是带指令地址的手工提升。

还有三个命令。`python3 code/main.py diff A.o B.o` 比较两个旁边保存清单的目标文件，`--image` 则比较加载映像。`python3 code/main.py paths grade O0` 打印一个函数的路径和类别，`paths total 8` 打印有边界的循环。`python3 code/main.py figure-data` 打印交互图嵌入的数据。

## 实际使用

对自己程序的两个构建，按以下顺序使用比较器和执行器。

1. 为每个目标文件捕获清单，让 `function_record()` 对照字节验证。首先修正清单。
2. 先比较目标文件。阅读每个匹配的阶段；在第二种签名一致之前，将流图形状匹配只视为建议。
3. 比较加载映像。从精确字节退到屏蔽字节匹配的函数，相对于其数据发生了移动；位移算术会指出移动的是哪个节。
4. 对每个匹配比较引用表。相同代码配不同常量，仍是函数变更。
5. 运行名称阶段并比较。有符号时采用 BinDiff 顺序，只用结构结果评判各阶段。
6. 工具报告比例时，先查明输入了哪些字节，再与自己的结果比较。
7. 对想求解输入的函数，编写每条语句带地址的 IR，为每个符号循环计数器设边界后运行 `execute()`，并求解每个叶节点。报告结果时同时报告边界。
8. 可用时，用 angr 或 z3 运行相同查询并比较类别边界。一个样本只是一个模型。

## 交互实验

### 实验 A：手工计算五种签名

从 `code` 目录启动 Python：

```bash
cd phases/13-tools-and-protocols/44-binary-diffing-and-symbolic-execution/code
python3 -q
```

运行：

```python
from main import *
grade = {r.name: r for r in fixture_records("ledger-x86_64-O1.o")}["grade"]
grade.raw.hex(" ")
grade.masked_bytes() == grade.raw
grade.mnemonics
grade.cfg_shape()
grade.signatures()
```

打印 `grade.raw` 前，先写下函数偏移 0x26 处的四个字节。随后对 `ledger-x86_64-O0.o` 中的 `grade` 运行相同代码，统计 `grade.edges` 中的 `table` 边。

### 实验 B：观察重定位如何破坏字节哈希

```python
case = grade_relocation_case()
case["layout"]
case["displacements"], case["rodataShift"]
case["objectBytesEqual"], case["imageBytesEqual"], case["maskedImageBytesEqual"]
```

读取 `displacements` 前，先在纸上计算 `0x100110 + 0x14 - 0x10003a`。再将 `load_image()` 的基址改为 0x400000，确认位移不变，因为两个操作数一起移动。

### 实验 C：错误匹配与避免它的顺序

```python
report = diff_fixtures("ledger-x86_64-O1.o", "ledger-x86_64-O2.o")
[(m.left.name, m.right.name, m.stage) for m in report.matches]
report = diff_fixtures("ledger-x86_64-O0.o", "ledger-x86_64-O1.o")
[(m.left.name, m.right.name, m.stage, m.names_agree) for m in report.matches]
report = diff_fixtures("ledger-x86_64-O0.o", "ledger-x86_64-O1.o", stages=BINDIFF_ORDER)
[(m.left.name, m.right.name, m.stage) for m in report.matches]
```

打印 `-O0` 下的 `records(...)["percent_change"].cfg_shape()` 和 `-O1` 下的 `grade_label`，阅读两个度序列。再编写第六个阶段，对排序后的助记符取哈希，使顺序不再重要，观察能否区分它们。

### 实验 D：路径与边界

```python
report = grade_paths("O0")
[(p["trace"], p["condition"], p["returns"]) for p in report["paths"]]
report["returns"]["4"]
total_paths(2), total_paths(4), total_paths(8)
total_paths(64, step_limit=24)["truncated"]
```

将 `SCORE_DOMAIN` 改为 `range(0, 110)`，重跑 `grade_paths("O0")`。返回 0 的类别缩小到 60 个输入，两项交叉检查仍成立。再将域设为 `range(90, 100)`，查看哪些叶节点完全没有模型。

## 实践实验

在样例上运行 BinDiff，并与已有三种结果比较。

要求：

- 在 Ghidra 12.1.4 中安装 BinExport 扩展，导出三个 ledger 程序。记录 BinExport 发布标签和 Ghidra 版本。
- 安装 BinDiff 8 命令行，使用仅相似度选项生成 `-O0` 对 `-O1` 和 `-O1` 对 `-O2` 的结果。
- 将逐函数相似度和置信度捕获到 `code/fixtures/`，并在 `build_fixtures.sh` 中记录确切命令。
- 为 `tool_comparison()` 增加 `bindiff` 列，并添加测试，比较 BinDiff 在 `-O1` 对 `-O2` 上的匹配集合与本课屏蔽字节集合。
- 写一段文字，指出 BinDiff 对 `grade` 使用了哪种算法，以及是否比较加载映像。

成功标准是：演示为每个函数打印四个工具列，新测试明确给出一个相等关系或一个已解释的差异。

## 本课产物

本课包含 `outputs/skill-binary-diffing-and-symbolic-execution.md`。用它将两个构建及一个函数转换为：逐匹配标明质量的分阶段差异报告、每个未匹配或变化函数的解释，以及每个叶节点带求解输入集合和产生该集合的边界的路径报告。

## 验证

运行演示和套件：

```bash
cd phases/13-tools-and-protocols/44-binary-diffing-and-symbolic-execution
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明：

- 符号表给出四个函数，`-O0` 大小为 46、118、66、39，`-O1` 为 16、46、31、63，`-O2` 为 16、46、140、63
- `-O1` 目标文件的 `.rela.text` 记录与 `llvm-objdump -r` 打印的描述一致
- 每条清单指令位于其符号范围内，字节等于目标文件，修改字节会触发异常
- `-O1` 下 `total` 有五块、五边和一个自循环，形状字符串具有确定性
- `-O0` 下 `grade` 从 `.rela.rodata` 恢复五个跳转表目标，得到八块十一边
- 没有跳转表时，`-O0` 下 `grade` 到达四个块中的 82 字节
- `-O0` 下 `percent_change` 与 `-O1` 下 `grade_label` 具有相同四块形状
- 可重定位目标文件的每个函数，精确哈希与屏蔽哈希一致
- `-O1` 和 `-O2` 有三个函数字节相同，`-O0` 和 `-O1` 没有
- `grade` 的引用表为 `1, 2, 3, 4, 4`，候选表为 `1, 2, 3, 4, 3`
- 加载器将两个程序的 `.text`、`.rodata` 和 `.rodata.str1.1` 放在与 Ghidra 相同的位置
- `R_X86_64_PC32` 按 `S + A - P` 写入并产生位移 122，`.data` 中的 `R_X86_64_64` 条目获得字符串地址
- `grade` 在目标文件中字节一致，在映像中因 0x70 位移而不同，屏蔽后恢复匹配
- `-O1` 对 `-O2` 有三个函数按精确字节匹配，`total` 按名称匹配；映像视图中 `grade` 按屏蔽字节匹配，相似度为 1 - 1/46
- 本课顺序在 `-O0` 对 `-O1` 中产生一个错误流图形状匹配，BinDiff 顺序则将四个函数全部按名称匹配
- 补丁候选在字节上匹配，在引用数据上失败
- Levenshtein 比例复现 0.130435、0.106061、0.269841、0.171429、82 字节上的 0.426829，以及 radiff2 应用重定位后打印的重定位字节比例
- radiff2 的 MATCH 集合等于精确字节阶段，Ghidra 的字节和指令关联器分别等于映像视图的精确与屏蔽集合
- Ghidra 在 `-O0` 对 `-O1` 中只找到名称匹配，每项相似度 1.0、置信度 10.0
- 手工提升的 IR 恰好覆盖每条清单指令一次，求值器遵循 C 语义
- `grade` 在 `-O0` 下有五条带 switch 条件的路径，在 `-O1` 下有两条路径，但类别相同
- 有界类别 60 至 69、70 至 79、80 至 89、90 至 109，与 angr 三个优化级别及 z3 一致，deadended 状态为 5 和 2，到达块的范围为 90 至 109
- 两项交叉检查在有界域、angr 和 z3 中均无模型，z3 证明清单等于源码 switch
- 有界搜索、angr 和 z3 的每个 `percent_change` 模型都求值得到请求值
- `total` 给出 3、5、9 条路径及三角数和，与 angr 相同，步数限制返回 22 条并截断 2 条
- 图示数据包含两种视图、重定位数值，以及五个叶节点和各自输入集合，站点模块嵌入相同数据

## 生产环境失效模式

| 失效情况 | 能力不足的工具报告什么 | 分析必须证明什么 |
|---|---|---|
| 对加载映像取字节哈希 | 两个代码相同的构建之间“grade 被修改” | 字段偏移、两个位移和节的移动；屏蔽哈希匹配 |
| 对可重定位目标文件取屏蔽哈希 | “屏蔽没有影响” | 字段原本就是零；变更存在于重定位记录和引用常量中 |
| 只看流图形状 | 自信地配对两个无关函数 | 第二种签名一致，否则名称矛盾时丢弃匹配 |
| 对已剥离符号构建先用名称再用结构 | 无法匹配 | 各结构阶段及质量，以及未匹配列表 |
| 跨工具直接比较比例 | “radiff2 为 0.43，本课为 0.30” | 两侧各自取指纹的字节；无重定位时 82 字节，有重定位时 118 字节 |
| 相同代码，不同常量 | “精确匹配” | 通过重定位和边界检查读取的表 |
| 将一个模型报告为唯一输入 | “分数是 90” | 90 至 109 的类别、数量，以及发现它的边界 |
| 将有界搜索报告为 unsat | “没有输入产生 -133” | 只在边界内 unsat；z3 在边界外找到 1073741823 |
| 符号循环没有边界 | 超时 | 边界或上限，以及返回、截断和从未开始的路径 |
| 将未运行的闭源工具描述为已运行 | 没有捕获来源的数值 | 带命令和版本的捕获文件，或明确声明仅依据文档 |

## 操作准则

每次按一种签名匹配，只接受两侧均唯一的值，并在匹配中保留阶段及其质量。比较目标文件和加载映像，解释每个在两种视图之间改变匹配阶段的函数。枚举路径时，在每个分支使用求解器，为每个符号循环设边界，并报告带边界的输入集合。没有边界的单个模型只是样本。

## 延伸阅读

- [BinDiff concepts: matching strategy, algorithms, and quality ratings](https://github.com/google/bindiff/blob/main/docs/concepts.md)
- [BinDiff repository and the v8 open-source release](https://github.com/google/bindiff/releases/tag/v8)
- [BinExport README: IDA Pro, Binary Ninja, and Ghidra exporters](https://github.com/google/binexport)
- [Flake, "Structural Comparison of Executable Objects" (DIMVA 2004) and Dullien, Rolles, "Graph-based comparison of Executable Objects" (SSTIC 2005), shipped in the BinDiff repository](https://github.com/google/bindiff/tree/main/docs/papers)
- [Diaphora README and heuristics source](https://github.com/joxeankoret/diaphora)
- [Ghidra Version Tracking correlators help page](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/VersionTracking/src/main/help/help/topics/VersionTrackingPlugin/VT_Correlators.html)
- [Ghidra Auto Version Tracking help page](https://www.ghidradocs.com/11.0_PUBLIC/help/VersionTracking/help/topics/VersionTrackingPlugin/VT_AutoVT.html)
- [Ghidra 12.1.4 release](https://github.com/NationalSecurityAgency/ghidra/releases)
- [Binary Ninja 6.0 "Krypton" release notes](https://binary.ninja/2026/09/03/binary-ninja-6.0-krypton.html) and [Binary Similarity user guide](https://docs.binary.ninja/guide/similarity.html)
- [radare2 book: radiff2](https://book.rada.re/tools/radiff2/intro.html) and [radare2 6.2.4 source](https://github.com/radareorg/radare2/releases/tag/6.2.4)
- [King, "Symbolic execution and program testing" (CACM 1976)](https://dl.acm.org/doi/10.1145/360248.360252)
- [Baldoni et al., "A Survey of Symbolic Execution Techniques" (ACM Computing Surveys 2018)](https://dl.acm.org/doi/10.1145/3182657)
- [Cadar, Sen, "Symbolic execution for software testing: three decades later" (CACM 2013)](https://dl.acm.org/doi/10.1145/2408776.2408795)
- [Cadar, Dunbar, Engler, "KLEE: Unassisted and Automatic Generation of High-Coverage Tests for Complex Systems Programs" (OSDI 2008)](https://www.usenix.org/legacy/events/osdi08/tech/full_papers/cadar/cadar.pdf) and [KLEE 3.2 release](https://github.com/klee/klee/releases/tag/v3.2)
- [Shoshitaishvili et al., "SoK: (State of) The Art of War: Offensive Techniques in Binary Analysis" (IEEE S&P 2016)](https://oaklandsok.github.io/papers/shoshitaishvili2016.pdf)
- [angr documentation: loading, simulation managers, and the simulation pipeline](https://docs.angr.io/en/latest/core-concepts/toplevel.html) and [angr 10.0.3 on PyPI](https://pypi.org/project/angr/)
- [Z3 5.1.0 release](https://github.com/Z3Prover/z3/releases/tag/z3-5.1.0)
- [Triton dynamic binary analysis library](https://github.com/JonathanSalwan/Triton)
- [System V Application Binary Interface, AMD64 Architecture Processor Supplement, Table 4.9: Relocation Types](https://gitlab.com/x86-psABIs/x86-64-ABI)
