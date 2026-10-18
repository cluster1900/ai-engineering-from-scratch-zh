# 两进制差异与符号执行:匹配函数并求解输入

> 两个函数的匹配,是某种质量给出的结论;求解输入,是某条路径条件的一个模型. 本课构建这两种方法,并对照 radiff2、Ghidra、angr 和 z3 检查.

**Type:** Build
**Languages:** Python, C, x86-64 assembly, Java (one Ghidra script)
**Prerequisites:** Phase 13 · 33（反汇编与控制流）、34（提升为伪代码）、36（重建并证明等价）
**Time:** ~150 分钟

## 学习目标

- 从目标文件及清单构建五种函数签名:精确字节、屏蔽重定位字段后的字节、助记符序列、控制流图形和符号名称──
- 运行BinDiff 风格的分阶段贪心匹配器,只有签名在两侧均唯一时才匹配,并记录每个匹配后的阶段和质量.
- 复现两个字节完全相同的函数在加载的视频上无法通过字节关联器,屏蔽后却可以通过情况,并使用重定位算术解释四个变化字节.
- 根据莱文施泰因的复现射线2的相似度比例,并解释为什么其中一个比例只有在比较雷达2的实际到达82字节时出现.
- 在小型 IR 上举函数路径,为每条路径带有条件,并使用有界限搜索为每个叶节点求解输入.
- 测量具有符号边界循环中的路径爆炸,并将数量,类别和模型与angr 10.0.3、z3 5.1.0 比较.

## 问题

你的`-O2`重建了`ledger.c`问询代理 相比 `-O1`构建是否有变化.`grade`由于它在两个加载后程序中的字节不同,因此它使用了分析预算,解释一个不存在的变化.`grade`工具比较是重定位后的影像,而`-O2`程序的`.rodata`后移了0x70字节,因此`grade`中一个位移增加了0x70

同一天下午,你问哪个分数会让`grade`返回4──代理 阅读伪代码后回答90──这是一个答案──函数对90至109的每个分数都返回4,而问题没有限制的边界,所以你需要的是集合,代理却给了一个样本──

两种失败源于同一个缺口:匹配和求解输入都是后面有方法支的结论. 本课程使用Python 标准库构建这两种方法,并运行旁边生产工具.

```figure
re-44-matches-and-paths
```

## 函数签名是带质量结论

弗莱克在2004年将二进制比较描述为:在两个相似可执行文件的函数集合中构建与构建.杜林和罗尔斯在2005年将其扩展到基本块和指令.BinDiff概念页面描述了由此发展的策略:计算两边每个函数的属性;如果某个值在每个侧出现一次,就构建匹配;出现多次的值有差异,需要在该等价类内继续分离下属性;没有对项值保持未匹配.

每种匹配算法都有质量. 这个页面将原始函数数字节的哈希匹配和名称哈希匹配评价非常好;流图 MD 指数和素数签名匹配(每个助记符对应一个小素数,取整个函数的乘积) 评价好;字符串引用评价中等;循环数或地址序列评价差异.匹配信度是产生匹配算法质量的平均值,并经过sigmoid加权.

本课保留其中五种属性,以及最重要的条例:两侧均唯一,否则不匹配. 我们省略 MD 指数,因为概念页面只给出名称没有公式,改用普通度序列.质量标签仍然保留,因为匹配的可靠性受到其最弱的实际限制.

## 从一个函数记录得到五种签名

差异比较器为每个目标文件读取两类信息.`.rela.*`记录;`llvm-objdump -d`清单提供指令边界和助记符,第33课已经证明解码器在这些目标文件中的每条指令与清单一致.`function_record()`检查每条清单指令的字节是否与目标文件对应地址的字节相同,否则抛出异常.

以 `ledger-x86_64-O1.o`中中 `grade`例如:"符号给出偏移 0x10、大小46 ,因此记录覆盖 0x10 至 0x3e,不包含用于对齐下一函数的两字节.`nop`,我知道.

精确字节签名是这46字节的SHA-256──屏蔽字节签名先将每个重定位字段置零──这里只有一个字段:偏移 0x36 处的记录`R_X86_64_PC32 .rodata+0x10`宽四字节,是0x33处`leaq (%rip), %rcx`在RELA 目标文件中,这四字节原本是零,所以在这里每个目标文件的每个函数的两个签名都一致.

助记符签名对以下14个助记符的序列取哈希:

```text
movslq imulq movq sarq shrq addl addl xorl cmpl ja movl leaq movl retq
```

流图形签名来自第33课的基本块和带类型边,并且仅包含可进口的块.`-O1`下一个`grade`有三个块,三条边缘.`ja 0x3d`结束,有一条跳转边和一条顺序落下边;块0x31 顺序进入0x3d;0x3d 返回.`3b 3e [0/2,1/1,2/0]`对对`-O0`下一个`grade`记录与第33课一样,通过五个.`.rela.rodata`条目解析间接跳转,得到八块,10条边,其中四条是`table`边边

名称签名就是符号名称.存在时,它是最强的事实,构建被剥离符号时则无作用.

另有一个字段用于后面的补丁案例.`.rodata`的`lea`重定位,边界检查和索引加载时,`referenced_table()`按第36课的方式读取表:`ja`前的`cmpl $0x4`表示五条条目,加载 `movl (%rcx,%rax,4), %eax`表示每项四字节──`-O1`下一个`grade`的`.rodata+0x14`内容为`1, 2, 3, 4, 4`,我知道.

## 贪心匹配器

`match_functions()`按顺序运行各阶段. 按该阶段签名分别对两边未相匹配的函数分组,接受所有在每个边恰有一个函数的值.

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

本课程的顺序先运行四个结构阶段,最后才使用名称,使结构阶段接受检查,再由名称事后评判.`-O1`与`-O2`比较如下:

| 函数 | 阶段 | 一致的签名 | 相似度 |
|---|---|---|---|
| `percent_change` | 精确字节 | 全部五种 | 1.000 |
| `grade` | 精确字节 | 全部五种 | 1.000 |
| `total` | 名称 | 仅名称 | 0.171 |
| `grade_label` | 精确字节 | 全部五种 | 1.000 |

`total`从31字节、13条指令增长到140字节、41条指令,因为用SSE2向量化循环,并保留标量余数循环──其形状从五块五边变为十块十三边──结构属性全部改变,只有符号将两者联系在一起──

对于`-O0`与`-O1`类似的顺序产生错误匹配:

| -O0 函数 | 匹配的 -O1 函数 | 阶段 | 名称一致 |
|---|---|---|---|
| `percent_change` | `grade_label` | 流图形状 | 否 |
| `grade` | `grade` | 名称 | 是 |
| `total` | `total` | 名称 | 是 |
| `grade_label` | 未匹配 | | |

`-O0`下一个`percent_change`是四块形:入口判断`before == 0`两支支臂,再汇合回归.`0/2, 1/1, 1/1, 2/0`,我知道.`-O1`下一个`grade_label`,我在.`grade`边界检查周围的形状是相同的. 两侧的形状是唯一的,规则就接受它. 中等质量标签是警告,随后运行的名称阶段则与它矛盾.`grade_label`导致真正的`percent_change`和 `grade_label`配对保持未匹配.

存在真名时,BinDiff 顺序将名称匹配放在第二阶段,代码中 `BINDIFF_ORDER`也如此. 使用这个顺序,全部四个.`-O0`函数都按名称匹配到其`-O1`版本,这也是下文Ghidra的结果.演示保留两种顺序,使失败可见.`if`和 `else`形状的

## 相同字节,重定位后的操作数

导入目标文件时应用重定位,因此其字节关联器比载后的视频,第36课也正是因为如此屏蔽重定位字段.`load_image()`复现导入过程:按节头顺序遍历已分配节,按各自 `sh_addralign`开始编程,然后应用每条记录:`R_X86_64_PC32`和 `R_X86_64_PLT32`将`S + A - P`写为有符号 32位值,`R_X86_64_64`将`S + A`写为64位值──

两个程序的每个节点都与Ghidra 12.1.4 一致,测试套件对照捕获版本追踪输出检查这一点:

| 节 | `-O1` 程序 | `-O2` 程序 |
|---|---|---|
| `.text` | 0x100000，159 字节 | 0x100000，271 字节 |
| `.rodata` | 0x1000a0 | 0x100110 |
| `.rodata.str1.1` | 0x1000f0 | 0x100160 |

`-O2`下一个`.text`增长 112 字节,即 `total`增量,因此`.rodata`后移 0x70 字节──两个程序的`grade`城市位置为0x100010──偏移为0x33处`leaq`的位移字段在0x36,指令结束于0x3a──重定位加加数0x10加上通常的4,使表位于`.rodata+0x14`,我知道.

在`-O1`影片中:`0x1000a0 + 0x14 - 0x10003a = 0x7a = 122`在`-O2`影片中:`0x100110 + 0x14 - 0x10003a = 0xea = 234`◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎`7a 00 00 00`另一个为`ea 00 00 00`△46 字节中一个字节不同,Levenstein 比如为0.978,精确字节阶段失败;屏蔽字节阶段将字段清零后通过──`grade_label`与表一样移动 0x70,因此位置保持相同,在两种视图中都通过精确字节匹配.

报告相同分分.对.`-O1`与`-O2`查看  函数的确切字节匹配`percent_change`和 `grade_label`; 准确的功能说明 额外找到 `grade`确切函数 符号 匹配 找到相同的三个函数 命令关联器屏蔽操作数,因此覆盖该位移.

实际情况 6.5.0 的`compare_functions`在汇编维度中,它带来了限制,转移正常化是不可用的.本课程的加载器和屏蔽操作提供了归结.

## 测量什么

提供 `radiff2`△使用`-AC`时,它分析了两个文件,为每个函数打印一行:左侧大小与地址、MATCH或UNMATCH、比例、右侧大小与地址──本课目标文件的捕获行程如下:

| 比较对 | `percent_change` | `grade` | `total` | `grade_label` |
|---|---|---|---|---|
| `-O0` 对 `-O1` | UNMATCH 0.130435 | UNMATCH 0.426829 | UNMATCH 0.106061 | UNMATCH 0.269841 |
| `-O1` 对 `-O2` | MATCH 1.000000 | MATCH 1.000000 | UNMATCH 0.171429 | MATCH 1.000000 |
| `-O1` 对 `-O1` | MATCH 1.000000 | MATCH 1.000000 | MATCH 1.000000 | MATCH 1.000000 |

雷达源码中比例为`1 - distance / max(len_a, len_b)`距离是两个函数指纹之间的利文施泰因距离,指纹是按地址顺序拼接函数基本块的结果──匹配值为0.7──`code/main.py`中中 `radare2_ratio()`对原始函数数字节实现相同公式,将 0.130435、0.1060、61、0.269841 和 0.171429 复现到小数点后六位.

它无法复制.`-O0`下一个`grade`对于该函数全部118字节,比例为0.296610──雷达2 在大小列印 `118`由于它没有重定位,它无法解析跳转表,因此分析只达到进口块.`jmpq *%rax`结尾的块、默认分支和回归:共 82 字节,正是第 33 课程普通回归下降认定的那 82 字节.`-O1`距离为47个,因此`1 - 47/82 = 0.426829`◎ 启用`-e bin.relocs.apply=true`后,radar2 找到全部118字节,打印0.288136,等于本课对重定位影像计算的比例;影像中的四个位移字节不同于目标文件的零字段.

`-O`将指纹限定为操作码字节,并将操作数置零.`-O0`对于`-O1`比例提高到0.239130、0.512195、0.303030 和0.523810;`total`在`-O1`对于`-O2`时提高到0.192857──也可以计算整个文件的距离:`-s`报告两份目标文件相似度0.956 距离162;`-ss`报告 0.927 和 137──这些数值包含头、符号表和重定位节,不能说明函数情况──

## 关联器 关联器

通过关联器将源程序与目标程序匹配.函数关联器包括精确函数字节匹配.精确函数说明匹配.屏蔽操作数. 精确函数内蒙学匹配.以及重复函数说明匹配.1:N 和N:M) 数据关联器包括精确函数的名称. 精确函数的名称. 重复或相似的数据匹配. 引用关联器使用已接受更多匹配. 目标程序必须定义函数,最小函数长度默认10 字节. 根据运行的精确名称,数据, 精确函数字节, 精确函数字节, 精确函数字节, 符号, 精确函数的内容. 已接受了相关联想器. 终于加入了 BS 编辑器.

通过无界面的方式捕获关联器输出.`capture_ghidra_vt.sh`将三个目标文件导入项目,运行`ListVersionTrackingMatches.java`,这个短脚本继承了`AbstractGhidraVersionTrackingScript`按照路径开源和目标程序,根据自动版本跟踪 顺序运行六个非引用关联器,并为每个块,函数,关联器和匹配打印一行.

| 关联器 | `-O0` 到 `-O1` | `-O1` 到 `-O2` |
|---|---|---|
| Exact Symbol Name Match | 4 个函数 | 4 个函数、5 个数据项（`labels.rel`、`.L.str.1` 至 `.L.str.4`） |
| Exact Data Match | 0 | 0 |
| Exact Function Bytes Match | 0 | 2（`percent_change`、`grade_label`） |
| Exact Function Instructions Match | 0 | 3（增加 `grade`） |
| Exact Function Mnemonics Match | 0 | 3 |
| Duplicate Function Instructions Match | 0 | 0 |

从`-O0`到了`-O1`由于每个函数发生变化,因此只称匹配,这也是本课程匹配器采用BinDiff 顺序时的结果. 每个匹配打印相似度1000,可信度10,000. 帮助页面将精确描述关联器为相似度1.0,可信度1.0,因此打印可信度的量表是本课程记录但未解决的开放问题.

下列工具 程序差异是另一个事物. 它针对两个程序,在同一地址比较字节,标签,代码单元,引用,注释和函数. 它是按地址对齐的差异比较,不会匹配移动内容.

## 根据文档了解"二元忍者"和"二元忍者"

图片是IDA Pro插件,首次发布于2015年,截至2026-08-18为3.4.2──自2.0起采用AGPL-3.0,需要IDAPython,因此可在IDA Home或IDA Pro中运行,不能在IDA Free中运行──它将每个数据库导入SQLite,以SQL查询运行启动式──每种启动式名为最佳/部分/不可靠类型、比例类型,以及SAME_CPU或SLOW等可选块标志──源码中的名称类似于本阶段,但更多:Bytes哈希课程、相同的和mnemonics 相同的排序组件、微型小序列产品、相同的节点,编辑,规模和环节,顶级组件、以及编程程序的不可靠的类型,在以下版本中需要发布的模拟化,模拟化,模拟化,模拟化,模拟化等.

2026-09-03 发布的二元忍者 6.0 加入二元类似性 框架,包含提供商和解决者. 它将将BinDiff 作为结构提供商,并提供WARP,用于容忍可重定位操作数的精确函数匹配. 指南建议:除可重定位指令外一致时使用WARP;重新编译后仍然保持结构联系时使用BinDiff. 这个功能仅限于最终版.

二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二二

## 相同代码,不同常量

第36课 保留一个`grade`候选重建,表的最后一项为3,而原始值为4.`grade_case10_wrong.o`与`-O1`下一个`grade`具有完全相同的46个代码字节──匹配器按精确字节配对,所有签名一致──引用表查查通过重定位读出 `1, 2, 3, 4, 4`通过另一个读出`1, 2, 3, 4, 3`报告`dataEqual: false`其他三`-O1`函数在左侧不匹配,因为候选目标文件只有一个函数.

这就是补丁分析的典型形式. 只有检查代码字节的函数比较器会说没有变化. 吉德拉的精确数据匹配和BinDiff的字符引用匹配也是为此存在的. 本课程的版本很小:对每个匹配对,比较函数重定位指向的字节,数量来自边界检查,宽度来自加载.

## 符号执行:路径、条件和求解器

于1976年,国王描述符号执行.输入变为符号,每句话更新符号存储,每个分支向路径加入条件,求解器判断路径是否可行,并产生沿路径执行的具体输入.带分支的函数变成路径树,叶节点就是附带条件的回归.

波尔多尼、科帕、迪利亚、德米特雷斯库 和芬诺基在2018年综述了这一领域.其第5节指出路径爆炸是核心成本:执行器可能在每个分支处分叉,因此状态数量可随分支数指数增长;如果循环边界依赖于符号输入,就会产生无限路径集合――缓解措施包括:每个分支求解并切除不可行路径、函数和循环摘要近似状态并并,以及缺陷――混合执行同时具体和符号运行程序,记录具体运行条件,将其中一个取消,反向解答器请求下输入.代表系统 DART (2005) ̊CUTE2005) 和 SAGE2008) ̊.

卡达尔·达纳·恩格勒,OSDI 2008) 是LLVM的虚拟机符号,因此输入是`clang -emit-llvm`在89个GNU核心程序中,它达到84.5%的覆盖率,开发者测试为67.7%,并发现56个严重缺陷.

面向二进制工作.`angr.Project`包含映射目标文件并应用重定位的CLE加载器,将块转换为VEX IR(`block.vex`电梯机,可用管码替代,以及工厂状态.`SimState`保存寄存器、内存和求解器──`SimulationManager`为了名为`active`,我知道.`deadended`,我知道.`found`,我知道.`avoided`和 `errored`状态集合步进,`explore(find=..., avoid=...)`封装这个过程――每步引擎依次处理失败、系统调用、子、用于具体数据的独角兽,最后回归VEX──claripy 是Z3 上的求解前端,在Angr 10.0 中改为内置 实现,通过`from angr import claripy`导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导入: 导向: 导入: 导向: 导向: 导向: 导向: 导向: 导向: 导向: 导向: 导向: 导向: 导

## 基于第34课 IR 的小型执行器

`code/main.py`中的执行器使用小型IR,语句形态与第34课一致:`Assign`,我知道.`Branch`,我知道.`Jump`,我知道.`Return`另加第34课 实践实验要求实现`Switch`终结指令――表达式包括`Const`,我知道.`Var`带宽度`Bin`,我知道.`Cast`、从名称具体表读取的 `Load`和 `Not`△四个例函数在第34课简化后达到的层次手工升级,此时`0x66666667`乘法已变为`score / 10`任何一个 IR 块都列出了源指令地址.`check_ir_against_listing()`断言这些地址恰好覆盖函数清单一次.

的中`-O0`下一个`grade`其他:

```text
0x30: local_8 = score; local_10 = score / 10 - 6; if (local_10 >u 4) goto 0x9a else 0x62
0x62: switch local_10 -> 0x91, 0x88, 0x7f, 0x76, 0x76
0x76: local_4 = 4; goto 0xa1        0x7f: local_4 = 3; goto 0xa1
0x88: local_4 = 2; goto 0xa1        0x91: local_4 = 1; goto 0xa1
0x9a: local_4 = 0                    0xa1: return local_4
```

分支表目标来自`jump_table_targets()`采用与第33课程相同的重定位算法,因此IR 实际读取样例──

`execute()`维护路径状态工作列表――状态包含当前块块轨迹条件列表,以及将每个变量映射为输入表达的环境――`Assign`将环境代入源表达并保存结果.`Branch`两次请求解答器:一次加入条件,一次加入否定.`Switch`根据目标对表项分组,对每个不同的目标分分一次,条件是对每个表项相等条件的分析;`Return`将环境代入回归值并关闭节点. 轨迹超过步数限制时,该路径被标记为截止并停止.

工人在到达`return 4`走遍遍遍.`local_10 = score / 10 - 6`道上的分支条件`local_10 >u 4`假如,因此条件列表包含`!(score / 10 - 6 >u 4)`△切换 条目 3 和 4 都指向 0x76,所以进入 0x76 的分叉加入`score / 10 - 6 == 3 || score / 10 - 6 == 4`块 0x76 赋值 `local_4 = 4`跳到0xa1,返回值代进后为`4`△叶节点是该条件与该值组成的二元组.

求解器为`BoundedSearch`△它为每一个输入保存有限域,枚举这些域的笛卡尔积,并根据C 语义计算每一个约束:32位回绕,截断除法,有符号与无符号比较,以及算术或逻辑移位.`score`在 -200 至 1200 时,`grade`五条路径需要44460次求值,耗时几毫秒.

| 叶节点 | 返回值 | 条件 | 边界内的分数 |
|---|---|---|---|
| 0x76 | 4 | `!(q >u 4) && (q == 3 \|\| q == 4)` | 90 至 109，20 个输入 |
| 0x7f | 3 | `!(q >u 4) && q == 2` | 80 至 89，10 个输入 |
| 0x88 | 2 | `!(q >u 4) && q == 1` | 70 至 79，10 个输入 |
| 0x91 | 1 | `!(q >u 4) && q == 0` | 60 至 69，10 个输入 |
| 0x9a | 0 | `q >u 4` | 1,351 个输入，即域中其余输入 |

`q`代表`score / 10 - 6`,我知道.`-O1`下一个`grade`也产生相同类别,但其 IR 只有两条路径:返回`lookup_14[q]`由于没有可达成的案例块,问题变成了返回值的约束.`lookup_14`从目标文件`.rodata`读取的处

边界就是该方法的限制. 有界搜索在域内完成,在域外不作结论. 在 -200 至 1200 内,60 至 109 中没有分数返回0.110 或更大的分数中没有返回非零值.

## 测量路径爆炸

`-O1`下一个`total`是第33课程的循环:先检查`count`循环体累加`values[rdx]`没有增长`rdx`现在`rdx != rcx`时通过`jne`回到循环体――IR 中`rcx`为`zext64(count)`没有任何`rdx`从 0 开始. 每次经过回边,都在.`rdx != count`上分叉,其中一个`rdx`为常量,因此`count = c`的路径运行循环体`c`后退出.`count`限为0至2,执行器找到3条路径;0至4时为5条;0至8时为9条.`-O2`由于其向量循环要求至少为8,因此在此范围内不会改变路径数量.

没有边界时,执行器永远不会结束,因为每个代代的次数都是另一条可行路径.`count`报告给出了这三个数字. 求解成本也增加:边界 2 时求值 33 次,4 时 115 次,8 时 531 次,限运行时间 6,900 次。

## 用g 和 z3 回答相同的问题

`capture_angr.py`在三个目标文件上运行angr 10.0.3──CLE 使用ELF后端将每个可重定位目标文件加载到0x400000,对`-O0`应用 13 个重定位,对其他文件应用 8 个,并解析四个符号.对具有一个符号的 64 位参数.`grade`没有任何`run()`在`-O0`现在,我已经有5个死态.`-O1`和 `-O2`时间分别为0.475、0.408 和0.318秒.`eax == v`要求求解器在每个优化级别中,给出具有符号最小值和最大值的符号,`v`为了 1 至 4 时都得到 60 至 69 、 70 至 79 、 80 至 89 、 90 至 109;为 0 时得到 -2147483648 至 2147483647──两项交叉检查均不满──

达到指定块的形式对`-O0`下一个`grade`使用CFGFast,列出第33课 找到的八块,再通过`explore(find=0x400076)`寻找存储4块──0.47秒后找到一个状态,仍然有三个活跃的状态;参数最小值 90、最大值 109,样本为 91、93、94、97 和 101──

对于`percent_change`两种状态, 约束分为`before[31:0] != 0`和 `before[31:0] == 0`△对非零状态请求`eax == 50`在`-O0`得到了`before = 21055744, after = 332315210`在`-O1`得到了`40566804, 834296877`在`-O2`得到了`-24484867, 993934694`△16 至 16 内的有界搜索 提供`before = -10, after = -15`△z3对第34课单 回答同样的问题,给出`before = -25092599, after = 305712160`△测试套件使用IR 求值器计算全部五对输入,每对结果均为50――模型证明存在某种输入,并不是唯一输入;三个正确工具给出不同的答案――

`capture_z3.py`用32位位量建模 `grade`的`-O1`清单,包含乘法、两次移位和表,并提出了另外四个问题──是否存在某种32位分数,使清单与源码`switch`不同:0.068秒内得到不满足,因此编译函数在全部2^32 输入上等于源码――清单是否与第36 课重建不同:在分数706346536 处得到了满足,此时`score / 10`为 70634653,开关进入默认分支,而值版本返回4.`percent_change`要求`before == 3`且结果为 -133,在`after = 1073741823`时得到了,即第36课的溢出单元;有界搜索在自己的领域找到第二个见证.`after = -1`现在`(-1 - 3) * 100 / 3`截断为 -133,完全没有溢出.

## 亲手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/44-binary-diffing-and-symbolic-execution
python3 code/main.py
```

输出是一个JSON报告.`diffs`保存`-O0`对于`-O1`,我知道.`-O1`对于`-O2`目标文件与载载图片相匹配,以及按照BinDiff 顺序运行`-O0`对于对对`toolComparison`定义和比例 关联器并列`patch`是 `grade_case10_wrong.o`案例:`radare2Ratios`复现 radiff2 数值,`gradeRelocationCase`展示布局和两个位移,`symbolic`保存路径,类别和爆炸计量.

按以下顺序阅读 `code/main.py`其他:

1. `ElfObject`读取节、符号和 `.rela.*`记录,`parse_listing()`读取`llvm-objdump`文本:
2. `jump_table_targets()`和 `build_cfg()`给出可达块和带类型边缘.`FunctionRecord.signatures()`构建五种签名――
3. `load_image()`布局已分配节,并应用`S + A - P`和 `S + A`,我知道.
4. `match_functions()`是分阶段匹配器;`levenshtein()`和 `radare2_ratio()`提供相似度.
5. `parse_radiff2()`和 `parse_ghidra_vt()`读取捕获的工具输出,用于比较.
6. `evaluate()`,我知道.`substitute()`和 `BoundedSearch`提供表达语义和求解器――
7. `execute()`枚举路径,`solve_returns()`向每个节点请求输入集合――
8. `grade_ir_o0()`,我知道.`grade_ir_o1()`,我知道.`percent_change_ir_o1()`和 `total_ir_o1()`是带指令地址的手工提升.

还有三个命令.`python3 code/main.py diff A.o B.o`两个边保存清单的目标文件,`--image`则比较加载映像──`python3 code/main.py paths grade O0`打印一个函数的路径和类别,`paths total 8`印有边界循环.`python3 code/main.py figure-data`打印交互图嵌入的数据.

## 实际使用

对于自己程序的两个构建,如下顺序使用比较器和执行器:

1. 为了每个目标文件,`function_record()`对照字节验证――首先修改清单――
2. 首先比较目标文件──阅读每个匹配阶段; 在第二种签署一致之前,将图形匹配仅视为建议──
3. 比较加载图像――从精确字节返回屏蔽字节匹配函数,与其数据相比发生移动;位移算术会指出移动的是哪个节点――
4. 对于每个匹配比较引用表.
5. 运行名称阶段并比较──有符号时采用BinDiff 顺序,只使用结构结果评判各阶段──
6. 工具报告比例时,先查看输入的字节,再与自己的结果进行比较.
7. 对于想求输入函数,编写每个语句带地址的IR,为每个符号循环计数器设置边界后运行`execute()`报告结果时同时报告边界――
8. 可用时,使用angr或z3运行相同查询并比较类别边界――一个样本只是一个模型――

## 交互实验

### 实验 A:手工计算五种签名

从`code`目录启动Python:

```bash
cd phases/13-tools-and-protocols/44-binary-diffing-and-symbolic-execution/code
python3 -q
```

运行:

```python
from main import *
grade = {r.name: r for r in fixture_records("ledger-x86_64-O1.o")}["grade"]
grade.raw.hex(" ")
grade.masked_bytes() == grade.raw
grade.mnemonics
grade.cfg_shape()
grade.signatures()
```

打印`grade.raw`前,先写下函数偏移 0x26 处的四个字节.`ledger-x86_64-O0.o`中中 `grade`运行同代码,统计`grade.edges`中中 `table`边边

### 实验B:观察重定位如何破坏字节哈希

```python
case = grade_relocation_case()
case["layout"]
case["displacements"], case["rodataShift"]
case["objectBytesEqual"], case["imageBytesEqual"], case["maskedImageBytesEqual"]
```

读取`displacements`之前,先在纸上计算`0x100110 + 0x14 - 0x10003a`再将`load_image()`基址改为0x400000,确认位移不变,因为两个操作数一起移动.

### 实验C:错误匹配与避免的顺序

```python
report = diff_fixtures("ledger-x86_64-O1.o", "ledger-x86_64-O2.o")
[(m.left.name, m.right.name, m.stage) for m in report.matches]
report = diff_fixtures("ledger-x86_64-O0.o", "ledger-x86_64-O1.o")
[(m.left.name, m.right.name, m.stage, m.names_agree) for m in report.matches]
report = diff_fixtures("ledger-x86_64-O0.o", "ledger-x86_64-O1.o", stages=BINDIFF_ORDER)
[(m.left.name, m.right.name, m.stage) for m in report.matches]
```

打印`-O0`下一个`records(...)["percent_change"].cfg_shape()`和 `-O1`下一个`grade_label`阅读两个级序列. 再编写第六阶段,对排序后的助记符取哈希,使序列不再重要,观察是否区分它们.

### 实验D:路径与边界

```python
report = grade_paths("O0")
[(p["trace"], p["condition"], p["returns"]) for p in report["paths"]]
report["returns"]["4"]
total_paths(2), total_paths(4), total_paths(8)
total_paths(64, step_limit=24)["truncated"]
```

将`SCORE_DOMAIN`改为`range(0, 110)`重跑`grade_paths("O0")`△返回0类别缩小到60个输入,两个交叉检查仍然存在.`range(90, 100)`查看哪些节点完全没有模型.

## 实践实验

在比较中,运行BinDiff与已有三种结果相比较.

要求:

- 在Ghidra 12.1.4 中安装BinExport 扩展,导出三个账本程序――记录BinExport 发布标签和Ghidra 版本――
- 安装BinDiff 8 命令行,使用仅相似度选项生成`-O0`对于`-O1`和 `-O1`对于`-O2`结果.
- 捕获函数相似性和可信性`code/fixtures/`并且`build_fixtures.sh`记录确切命令.
- 为`tool_comparison()`增加`bindiff`列,并添加测试,比较BinDiff 在 `-O1`对于`-O2`上的匹配集合与本课屏蔽字节集合.
- 写一段文字,指出BinDiff对`grade`采用哪种算法以及是否比较加载视频

成功标准是:演示为每个函数打印四个工具列,新测试明确给出一个相等关系或一个已解释的差异.

## 本课产物

本课包含`outputs/skill-binary-diffing-and-symbolic-execution.md`△将两个构建和一个函数转换为:逐匹配标识质量的分阶段差异报告,对每个不匹配或变化函数的解释,以及每个节点带来解决输入集合和产生集合的边界路径报告.

## 验证

运行演示和套件:

```bash
cd phases/13-tools-and-protocols/44-binary-diffing-and-symbolic-execution
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明:

- 符号表给出四个函数,`-O0`长小为46,1186639`-O1`为了16463163`-O2`为了16,46,14063
- `-O1`目标文件的`.rela.text`记录与`llvm-objdump -r`打印的描述一致
- 每条清单指令都在符号范围内,字节等于目标文件,修改字节会触发异常
- `-O1`下一个`total`有五块五边和一个自循环,形状字符串具有确定性
- `-O0`下一个`grade`从`.rela.rodata`恢复五跳转表目标,得到八块十一边
- 没有跳转表时,`-O0`下一个`grade`在四块中,有82字节.
- `-O0`下一个`percent_change`与`-O1`下一个`grade_label`具有相同的四块形状
- 可重定位目标文件的每个函数,精确的哈希与屏蔽哈希一致
- `-O1`和 `-O2`有三个数字节点相同,`-O0`和 `-O1`没有
- `grade`的引用表为`1, 2, 3, 4, 4`候选表为`1, 2, 3, 4, 3`
- 载体将两个程序`.text`,我知道.`.rodata`和 `.rodata.str1.1`放在与Ghidra相似的位置
- `R_X86_64_PC32`按 `S + A - P`写入并产生位移 122,`.data`中中 `R_X86_64_64`条目获得字符串地址
- `grade`在目标文件中字节一致,在视频中因0x70位移而不同,屏蔽后恢复匹配
- `-O1`对于`-O2`有三个函数按精确字节匹配,`total`按名称匹配;映像视图中 `grade`按屏蔽字节匹配,相似度为1 - 1/46
- 本课序列在`-O0`对于`-O1`中产生一个错误流图形匹配,BinDiff 顺序则将四个函数全部按名称匹配
- 补丁候选人在字节上匹配,在引用数据上失败
- 莱文施泰因 比例复现 0.130435、0.106061、0.269841、0.171429、82字节上的 0.426829,以及radiff2 应用重定位后打印的重定位字节比例
- radiff2 的 MATCH 集合等于精确字节阶段,Ghidra 的字节和命令关联器分别等于映像视图的精确和屏蔽集合
- 吉德拉在`-O0`对于`-O1`中只找到匹配的名称,每项相似度1.0、信任度10.0
- 手工提升的IR 恰好覆盖每条清单指令一次,求值器遵循C语义
- `grade`在`-O0`下有五条带开关 条件的路径,在`-O1`下有两条路径,但类别相同
- 有界类别 60 至 69 、70 至 79 、80 至 89 、90 至 109,与angr 三个优化级别及 z3 一致,死者 状态为 5 和 2,到达块的范围为 90 至 109
- 两项交叉检查在有界域,angr和z3中均无模型,z3 证明清单等于源码开关
- 有界搜索,愤怒和 z3 的每个`percent_change`模型都求值得到求值
- `total`给出3、5、9条路径及三角数和,与angr相似,步数限制返回22条并截断2条
- 图形数据包含两种视图,重定位数值,以及五个叶节点和各自的输入集合,站点模块嵌入相同的数据

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

每次按签名匹配,只接受两边均的唯一值,并保留相对阶段及其质量. 比较目标文件和加载映像,解释每一个在两种视图之间改变相对阶段的函数.

## 延伸阅读

- [BinDiff concepts: matching strategy, algorithms, and quality ratings](https://github.com/google/bindiff/blob/main/docs/concepts.md)
- [BinDiff repository and the v8 open-source release](https://github.com/google/bindiff/releases/tag/v8)
- [BinExport README: IDA Pro, Binary Ninja, and Ghidra exporters](https://github.com/google/binexport)
- [Flake, "Structural Comparison of Executable Objects" (DIMVA 2004) and Dullien, Rolles, "Graph-based comparison of Executable Objects" (SSTIC 2005), shipped in the BinDiff repository](https://github.com/google/bindiff/tree/main/docs/papers)
- [Diaphora README and heuristics source](https://github.com/joxeankoret/diaphora)
- [Ghidra Version Tracking correlators help page](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/VersionTracking/src/main/help/help/topics/VersionTrackingPlugin/VT_Correlators.html)
- [Ghidra Auto Version Tracking help page](https://www.ghidradocs.com/11.0_PUBLIC/help/VersionTracking/help/topics/VersionTrackingPlugin/VT_AutoVT.html)
- [Ghidra 12.1.4 release](https://github.com/NationalSecurityAgency/ghidra/releases)
- [Binary Ninja 6.0 "Krypton" release notes](https://binary.ninja/2026/09/03/binary-ninja-6.0-krypton.html)其他[Binary Similarity user guide](https://docs.binary.ninja/guide/similarity.html)
- [radare2 book: radiff2](https://book.rada.re/tools/radiff2/intro.html)其他[radare2 6.2.4 source](https://github.com/radareorg/radare2/releases/tag/6.2.4)
- [King, "Symbolic execution and program testing" (CACM 1976)](https://dl.acm.org/doi/10.1145/360248.360252)
- [Baldoni et al., "A Survey of Symbolic Execution Techniques" (ACM Computing Surveys 2018)](https://dl.acm.org/doi/10.1145/3182657)
- [Cadar, Sen, "Symbolic execution for software testing: three decades later" (CACM 2013)](https://dl.acm.org/doi/10.1145/2408776.2408795)
- [Cadar, Dunbar, Engler, "KLEE: Unassisted and Automatic Generation of High-Coverage Tests for Complex Systems Programs" (OSDI 2008)](https://www.usenix.org/legacy/events/osdi08/tech/full_papers/cadar/cadar.pdf)其他[KLEE 3.2 release](https://github.com/klee/klee/releases/tag/v3.2)
- [Shoshitaishvili et al., "SoK: (State of) The Art of War: Offensive Techniques in Binary Analysis" (IEEE S&P 2016)](https://oaklandsok.github.io/papers/shoshitaishvili2016.pdf)
- [angr documentation: loading, simulation managers, and the simulation pipeline](https://docs.angr.io/en/latest/core-concepts/toplevel.html)其他[angr 10.0.3 on PyPI](https://pypi.org/project/angr/)
- [Z3 5.1.0 release](https://github.com/Z3Prover/z3/releases/tag/z3-5.1.0)
- [Triton dynamic binary analysis library](https://github.com/JonathanSalwan/Triton)
- [System V Application Binary Interface, AMD64 Architecture Processor Supplement, Table 4.9: Relocation Types](https://gitlab.com/x86-psABIs/x86-64-ABI)
