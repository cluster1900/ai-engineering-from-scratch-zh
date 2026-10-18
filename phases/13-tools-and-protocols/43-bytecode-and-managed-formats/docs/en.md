# 超越原生代码：Python、JVM、.NET 与 WebAssembly 字节码

> 字节码文件既包含程序，也包含编译器对程序的记录；本课将构建读取器，揭示每种容器保留了哪些记录。

**Type:** Build
**Languages:** Python, Java, C#, WebAssembly text
**Prerequisites:** 第 13 阶段 · 32（从零实现 ELF）、33（反汇编与控制流）
**Time:** ~150 分钟

## 学习目标

- 依据 PEP 552 读取 `.pyc` 的 16 字节头部，并在不使用 `marshal` 模块的情况下，反序列化四个解释器版本写出的代码对象。
- 依据 JVMS 第 4 章解析 JVM 类文件，包括常量池、字段、方法、`Code` 属性以及 `javac -g` 添加的表。
- 反汇编 `Ledger.class` 中的 JVM 操作码，并对同一源码的四种构建逐一与 `javap -c` 的清单核对。
- 逐节读取 WebAssembly 模块，解码每个函数体，并与 `wasm-objdump -d` 核对结果。
- 遍历 .NET 程序集的 ECMA-335 元数据，从 PE 数据目录到 `MethodDef` 行及每个方法的 CIL，并使用 ILSpy 所用的读取库核对。
- 比较同一函数在五种容器中的表现，测量每种格式保留和丢失了哪些名称、类型及控制结构。

## 问题

你构建了 `ledger.py`，并在 `__pycache__` 中发现 `ledger.cpython-314.pyc`。你询问智能体该文件包含什么。智能体运行了反编译器，工具输出 `Unsupported opcode`，还打印了一行 `# WARNING: Decompyle incomplete`。智能体因此断言文件经过混淆。

文件并没有混淆。它的前两个字节是 `2b 0e`，即小端字 3627。这是 CPython 3.14 写入的数值，而反编译器的操作码表只支持到 3.13。过时的是工具。智能体没有读取头部，因此无法分辨两者。

第 33 课展示了原生代码丢失的内容：参数名、类型，以及变成跳转表的 `switch`。字节码容器丢失得更少，而且各不相同。pyc 保留每个变量名，却不保留类型。类文件保留类型，只有你明确要求时才保留局部变量名。Wasm 模块保留控制结构，却丢弃名称，除非自定义节携带了这些名称。.NET 程序集把参数名放在表中，而把局部变量名留给独立文件。只有先知道容器原本携带了哪些记录，才能评价反编译器针对它的输出。

本课使用 Python 标准库构建四种读取器。每种读取器从首字节开始读取容器，列出一个函数，并在你构建的测试样本上与该格式自己的工具核对。最后一节将五种容器中 `ledger` 的 `grade` 并排比较。

```figure
re-43-five-containers
```

## pyc 头部由四个字组成

PEP 552 将头部定义为四个 32 位字。第一个是魔数，第二个是位字段。第 0 位为 1 表示文件基于哈希。第 1 位为 1 表示 `check_source`：解释器在导入时对源码计算哈希并比较。第 0 位为 0 时，第三和第四个字分别是源码修改时间 mtime 和源码大小；第 0 位为 1 时，它们存储源码的 64 位 SipHash。

魔数定义在 `Include/internal/pycore_magic_number.h` 中。从 3.11 起，规则是 Python 3.n 从 2900 + 50n 开始，发布周期内每次字节码变更都会加一。存储的标记是 16 位数值后接 `\r\n`，因此以文本模式打开 pyc 会得到错误的魔数。最终值分别为：3.11 的 3495、3.12 的 3531、3.13 的 3571、3.14 的 3627，以及 3.15 的 3666。Python 3.15.0 于 2026-10-09 发布，但构建这些样本的机器没有安装它，因此这个数值来自头文件，而不是此处的实际文件。

样本为每个解释器保留两份 pyc。`compile_pyc.py` 使用 `py_compile.compile(..., dfile="ledger.py")` 写入文件，使存储的文件名为 `ledger.py`，而不是构建机器上的路径。3.14 文件的前 16 字节如下：

```text
checked-hash   2b 0e 0d 0a  03 00 00 00  c7 16 c7 fc c5 1d 81 01
timestamp      2b 0e 0d 0a  00 00 00 00  8d 60 cf 6a  f1 01 00 00
```

逐字读取时间戳头部。`03 00 00 00` 或 `00 00 00 00` 是标志字。`8d 60 cf 6a` 为 0x6acf608d = 1791975565，即构建文件时 `ledger.py` 的 mtime。`f1 01 00 00` 为 497，即源码大小。经过校验的哈希文件则携带值为 3 的标志和八个哈希字节。除魔数字外，四个解释器的头部内容一致：

| 解释器 | 魔数字节 | 字值 | 文件字节数 | `grade.co_code` 字节数 | `grade` 指令数 |
|---|---|---|---|---|---|
| 3.11.14 | `a7 0d 0d 0a` | 3495 | 1054 | 80 | 31 |
| 3.12.12 | `cb 0d 0d 0a` | 3531 | 937 | 62 | 26 |
| 3.13.12 | `f3 0d 0d 0a` | 3571 | 943 | 70 | 26 |
| 3.14.6 | `2b 0e 0d 0a` | 3627 | 965 | 96 | 35 |

`code/main.py` 中的 `read_pyc_header()` 返回这些字段，并根据魔数字识别版本。`importlib.util.MAGIC_NUMBER` 给出当前运行解释器对应的相同四字节。`python3 code/main.py compare` 使用在 `PATH` 中找到的每个 `python3.11` 至 `python3.15` 编译源码，并将读取器看到的头部与各解释器报告的自身信息并排输出。

## Marshal 逐字段写入代码对象

每个样本的第 16 字节都是 `e3`，即 `0x80 | ord('c')`：这是设置了 `FLAG_REF` 的代码对象的 marshal 类型码，告诉读取器记住此对象，以供后续 `r` 引用。marshal 文档明确表示，该格式刻意不提供文档，且代码对象不跨版本兼容。这两点都属实，但格式仍然足够小，可以自行读取。`Python/marshal.c` 列出了类型码：`N` 表示 None，`i` 表示 32 位整数，`s` 表示字节串，`z` 和 `Z` 表示短 ASCII 字符串，`(` 和 `)` 表示元组，`c` 表示代码对象，`r` 表示反向引用。容器先预留自己的引用槽位，再处理子对象，读取器也遵循这一顺序。

`w_complex_object()` 按固定顺序写入代码对象。对于 3.11 至 3.15，先以 32 位整数写入 `argcount`、`posonlyargcount`、`kwonlyargcount`、`stacksize`、`flags`；再以对象写入 `code`、`consts`、`names`、`localsplusnames`、`localspluskinds`、`filename`、`name`、`qualname`；随后是 `firstlineno`，最后是 `linetable` 和 `exceptiontable`。从第 17 字节开始手动解码 3.14 文件的模块代码对象：

```text
00 00 00 00   argcount 0
00 00 00 00   posonlyargcount 0
00 00 00 00   kwonlyargcount 0
01 00 00 00   stacksize 1
00 00 00 00   flags 0
f3 22 00 00 00   type 's' with FLAG_REF, 34 bytes of co_code follow
80 00  52 06  74 00  52 01  17 00  74 01 ...
```

代码中每条指令占两字节：`80 00` 是 `RESUME 0`，`52 06` 是 `LOAD_CONST 6`，`74 00` 是 `STORE_NAME 0`，`17 00` 是 `MAKE_FUNCTION`。样本中的 3.14 清单输出了相同的五条模块级语句。`code` 之后是包含四个嵌套代码对象的常量，再之后是 `names`：`('LABELS', 'percent_change', 'grade', 'total', 'grade_label')`。

`code/main.py` 中的 `Unmarshaller` 可以读取这种布局，以及 3.9 和 3.10 使用的旧布局；后者将 `nlocals`、`varnames`、`freevars` 和 `cellvars` 设为独立字段。它构造一个 `CodeObject`，使用与真实对象相同的属性名。`varnames` 根据 `localspluskinds` 的 `CO_FAST_LOCAL` 位筛选 `localsplusnames`。对四个文件中的每个 `grade`，它都返回 `('score', 'bucket')`、值为 10 的 `firstlineno` 和非空的 `linetable`。测试 `test_unmarshaller_agrees_with_the_running_interpreter` 针对当前解释器写出的文件，将每个字段与 `marshal.loads()` 比较。其余三个文件能被我们的代码读取，但不能被当前解释器的 `marshal` 读取。

## 四个解释器，四种 grade 字节码

dis 文档在每个版本中都有同一条警告：字节码是 CPython 的实现细节，不保证保持不变。这些样本展示了这句话对十一行 Python 意味着什么。每个解释器的 `python3.1N -m dis ledger.py` 输出都已保存。

3.11 中的 `grade` 开头如下：

```text
 11           2 LOAD_FAST                0 (score)
              4 LOAD_CONST               1 (10)
              6 BINARY_OP                2 (//)
             10 STORE_FAST               1 (bucket)
 12          12 LOAD_FAST                1 (bucket)
             14 LOAD_CONST               2 (9)
             16 COMPARE_OP               5 (>=)
             22 POP_JUMP_FORWARD_IF_FALSE     2 (to 28)
```

`BINARY_OP` 位于偏移 6，下一条指令位于 10。中间两字节是 PEP 659 专门化自适应解释器引入的内联缓存项。偏移 16 的 `COMPARE_OP` 之后是偏移 22 的指令，因此它占用两个缓存项。除非传入 `show_caches=True`，否则缓存会被隐藏。3.12 将 `LOAD_CONST` 加 `RETURN_VALUE` 替换为 `RETURN_CONST`，将跳转重命名为 `POP_JUMP_IF_FALSE`，使 `grade` 从 80 字节缩减到 62 字节。3.13 输出标签 `L1` 至 `L4` 而非偏移，并为命令行提供显示缓存的 `-C` 和显示偏移的 `-O`。3.14 又移除了 `RETURN_CONST`，加入 `LOAD_SMALL_INT` 和 `LOAD_FAST_BORROW`，并在每个条件跳转后插入 `NOT_TAKEN`：

```text
 12         20       LOAD_FAST_BORROW         1 (bucket)
            22       LOAD_SMALL_INT           9
            24       COMPARE_OP             188 (bool(>=))
            26       CACHE                    0 (counter: 0)
            28       POP_JUMP_IF_FALSE        3 (to L1)
            30       CACHE                    0 (counter: 0)
            32       NOT_TAKEN
```

`-C -O` 清单显示 `grade` 中有 13 个 `CACHE` 项：`BINARY_OP` 后五个，每个 `COMPARE_OP` 后一个，每个 `POP_JUMP_IF_FALSE` 后一个。自适应样本展示了这些缓存的用途。调用 200 次后，`dis.dis(grade, adaptive=True)` 在普通清单中原为 `RESUME` 和 `COMPARE_OP` 的位置输出 `RESUME_CHECK` 和 `COMPARE_OP_INT`，而 `total` 中出现 `FOR_ITER_LIST`、`BINARY_OP_ADD_INT` 和 `JUMP_BACKWARD_NO_JIT`。专门化形式存在于同一组 `co_code` 字节中。pyc 永远不包含它们，因为专门化发生在内存中。

这就是反编译器存在版本上限的原因。uncompyle6 3.9.3 声明接受 Python 1.0 至 3.8 的字节码。decompyle3 3.9.3 读取 3.7 和 3.8。两者使用的跨版本反汇编器 xdis 6.3.0 支持到 3.13。pycdc 的构建文件中，操作码表最多到 `python_3_13.cpp`，遇到未知操作码时会输出 `Unsupported opcode` 并标记结果不完整。PyLingual 声称支持从 3.6 起的所有已发布版本，并使用 3.8 至 3.15 的解释器重新编译、检查自己的输出。对于 3.14 文件，前三者会拒绝或失败，只有后两者适用。选择工具前先读取魔数字。

## 类文件保存了自身的字典

JVMS Java SE 25 第 4.1 节将布局定义为一个结构：`magic`、`minor_version`、`major_version`、`constant_pool_count`、常量池、`access_flags`、`this_class`、`super_class`、接口、字段、方法、属性。魔数是 `0xCAFEBABE`。Java SE 25 虚拟机接受 45 至 69 的主版本号，次版本号 65535 则表示预览特性文件。`Ledger-g.class` 的前十字节是 `ca fe ba be 00 00 00 41 00 5e`：主版本 65 对应 Java 21，`0x5e` = 94 是常量池计数。同一源码由 javac 25.0.2 构建的 `Ledger-jdk25.class` 以 `ca fe ba be 00 00 00 45` 开头，主版本为 69。

常量池是类文件存储自身字典的地方。`-g` 构建中的条目 `#13` 是一个 `Methodref`，指向类 `#8` 和名称与类型条目 `#14`。沿索引查找会得到 `Ledger.grade:(I)I`，与 `javap -v` 在 `//` 后输出的内容完全一致。描述符 `(I)I` 表示一个 `int` 参数和一个 `int` 返回值。`total` 的 `([I)I` 表示参数为 `int` 数组。代码涉及的每个方法、字段和类都有这样的条目，第 4.10 节规定的验证器会拒绝指令与条目不一致的文件。`code/main.py` 中的 `ClassFile` 类读取表 4.4 的全部 17 种常量标签，并将一个 `Long` 或 `Double` 计为两个槽位。遇到未知标签或最后一个属性后的多余字节时，它会抛出异常。

属性可附加在类、每个字段、每个方法以及 `Code` 属性自身上。JVMS 要求虚拟机忽略不认识的属性，因此添加或移除调试表不必改变方法体。javac 手册说明：`-g` 生成包括局部变量在内的全部调试信息，默认仅生成行号和源文件信息，`-g:none` 则什么都不生成。三种构建测得的结果如下：

| 构建 | 字节数 | 常量池计数 | `LineNumberTable` | `LocalVariableTable` | `SourceFile` | `grade` 代码字节数 |
|---|---|---|---|---|---|---|
| `javac -g` | 1832 | 94 | 7 个方法 | 6 个方法 | 有 | 50 |
| `javac` | 1581 | 82 | 7 个方法 | 无 | 有 | 50 |
| `javac -g:none` | 1404 | 79 | 无 | 无 | 无 | 50 |

三个文件中 `grade` 的 50 个代码字节完全一致，测试也会检查这一点。`-g` 为 `grade` 增加的是一行 `LocalVariableTable`：起点 0、长度 50、槽位 0、名称 `score`、描述符 `I`。没有它，反编译器只能看到类型为 `int` 的槽位 0，必须自行编造名称。每种构建都保留 `StackMapTable`，因为验证器需要它；`BootstrapMethods` 属性也保留，因为 `main` 通过 `invokedynamic` 拼接字符串。

## 手动解码 tableswitch

JVMS 第 6 章将每条指令定义为一个操作码字节及该操作码指定的操作数。分支偏移是相对于分支操作码地址的 16 位有符号值，这与相对于下一条指令计算位移的 x86-64 不同。`tableswitch` 和 `lookupswitch` 开头包含零至三个填充字节，使其 32 位操作数起始地址为四的倍数。

`Ledger-g.class` 中 `grade` 从 pc 4 开始的字节如下：

```text
aa                 tableswitch at pc 4
00 00 00           padding to pc 8
00 00 00 2c        default: 4 + 44 = 48
00 00 00 06        low 6
00 00 00 0a        high 10
00 00 00 2a        case 6:  4 + 42 = 46
00 00 00 28        case 7:  4 + 40 = 44
00 00 00 26        case 8:  4 + 38 = 42
00 00 00 24        case 9:  4 + 36 = 40
00 00 00 24        case 10: 4 + 36 = 40
```

三十六字节，一条指令，就表示了整个 `switch (score / 10)`，包括 9 和 10 共用的分支。第 33 课中同一 `switch` 的原生构建需要边界检查、一条 `lea`、一条 `movslq`、一条 `add`、一次间接跳转，以及另一节中的五个重定位项。这里的目标就在指令中，目标彼此属于同一结构这一事实也一样。

`disassemble_jvm()` 覆盖全部 202 个已定义操作码及其操作数宽度，遵循填充规则，并以 `javap` 的方式呈现操作数。`compare_with_javap()` 解析保存的 `javap -c -p` 文本，包括多行 `tableswitch` 块，并检查每条指令的偏移、助记符和操作数。四种构建的 108 条指令全部一致。测试 `test_branch_offsets_are_relative_to_the_branch_instruction` 检查 pc 1 的 `ifne` 跳到 6、13 的 `if_icmpge` 跳到 33，以及 30 的 `goto` 跳回 10。

为这些课程从源码构建的 radare2 6.2.4 也读取了同一文件。`rabin2 -I` 报告 `arch java`、`lang java 21`、`linenum true` 和 `lsyms true`，体现了它对版本及两个调试表的识别。`pd 14 @ sym.Ledger.grade` 输出 `tableswitch`，并用箭头指向五个目标。它还针对该文件输出 `Unable to parse code attribute: 2`，这是工具自己指出的局限，也是继续以 `javap` 为基准的理由。与 Python 相比，这种格式的反编译器较为成熟。CFR 0.152 使用 MIT 许可证。Procyon 0.6.0 和 Vineflower 1.12.0 使用 Apache-2.0；Vineflower 是支持 Java 21 的 Fernflower 分支。Fernflower 本身位于 IntelliJ Community 仓库中。JADX 1.5.6 支持 Android DEX 格式，而 JD-GUI 的最后一次发布是在 2019 年。Harrand、Soto-Valero、Monperrus 和 Baudry 在 2020 年测评了其中八款工具。表现最好的工具对 84% 的类生成语法正确的输出，对 78% 生成语义等价的输出。他们的元反编译器恢复了任何单一工具都无法处理的类中的 37.6%。类型、名称和经过验证的栈让这种格式可以反编译，但不意味着任何一款反编译器能覆盖所有情况。

## Wasm 模块是一系列节

核心规范将模块定义为前导字节 `00 61 73 6d 01 00 00 00`，即字符串 `\0asm` 和版本 1，之后是一系列节。每节由一个标识字节、一个以 LEB128 编码的 `u32` 大小和内容组成。标识 1 至 13 是已知节，每种最多出现一次并按顺序排列。标识 0 是带名称的自定义节，可以位于任意位置。整数均使用 LEB128，因此 `e4 00` 为 100，`80 08` 为 1024。对 `ledger.wasm` 运行 `wasm-objdump -h` 会列出七个节，`WasmModule` 找到的七个节及其载荷偏移完全相同：

| 节 | 载荷范围 | 数量 | 为 ledger 保存的内容 |
|---|---|---|---|
| 类型 | 10 至 26 | 3 | `(i32) -> nil`、`(i32, i32) -> i32`、`(i32) -> i32` |
| 导入 | 28 至 39 | 1 | 类型为 0 的 `env.log` |
| 函数 | 41 至 46 | 4 | 每个已定义函数的类型索引 |
| 内存 | 48 至 51 | 1 | 一页，无最大值 |
| 导出 | 53 至 110 | 5 | `memory` 和四个函数名 |
| 代码 | 113 至 271 | 4 | 大小为 23、63、44 和 23 字节的函数体 |
| 数据 | 273 至 290 | 1 | 位于偏移 1024 的 `F\0D\0C\0B\0A\0` |

函数节与代码节分离，是为了让浏览器在整个文件到达之前就能开始编译。每个代码条目包括大小、局部变量声明向量和表达式。`grade` 的局部变量向量是 `01 7f`：一组一个 `i32`。这就是 `bucket`，有类型而没有名称。

控制流从构造上就是结构化的。规范要求分支只能指向包围它的 `block`、`loop` 或 `if` 结构。标签按嵌套深度索引。`br_table` 通过索引标签列表的操作数执行间接分支。解码文件偏移 `0xa3` 处 `grade` 的 switch：

```text
0e                  br_table
0b                  11 labels follow
04 04 04 04 04 04   buckets 0 to 5: label 4, the outermost block, returns 0
03 02 01 00         buckets 6, 7, 8, 9: labels 3, 2, 1, 0
00                  bucket 10: label 0, shared with 9
04                  default label 4
```

每个标签都是一个深度。标签 0 是最内层的 `block`，其 `end` 之后的代码是 `i32.const 4`，然后用 `br 4` 跳出结果块。表前的六条 `block` 指令、十一个标签和表后的五条 `br` 指令构成了整个 `switch`，验证器会拒绝任何脱离该结构的分支。`disassemble_wasm()` 跟踪深度，让清单像 `wasm-objdump` 一样缩进；它覆盖从 `unreachable` 到 `i64.extend32_s` 的每个单字节操作码，并在两种构建中都与保存的 `wasm-objdump -d` 输出实现 77 条指令全部一致。

普通模块丢弃的是名称。`wasm-objdump` 仍会输出 `<grade>`，因为导出节将该字符串映射到函数索引 2，读取器也是如此。290 字节的文件中完全没有局部变量名。`wat2wasm --debug-names` 添加名为 `name` 的自定义节，其中包含模块名、函数名和局部变量名的子节。文件增长到 425 字节。读取器为函数 2 找到 `{0: 'score', 1: 'bucket'}`，为函数 3 找到 `{0: 'values', 1: 'count', 2: 'sum', 3: 'i'}`。`wasm-strip` 可以再次移除此节。tool-conventions 仓库描述了另外两种载体：DWARF 可作为 `.debug_*` 自定义节嵌入；`sourceMappingURL` 自定义节可指向源码映射，其列号表示二进制中的字节偏移。

工具生态在 2026 年发生了变化。于 2026-09-15 发布的 wabt 1.0.42 移除了 `wasm-decompile`，这台机器上的 Homebrew 构建恰好包含剩下的十一个工具。wasm-tools 1.261.0 提供 `print`、`objdump` 和 `demangle`。Binaryen version_133 提供 `wasm-dis`。radare2 6.2.4 也能读取模块，其 `rabin2 -I` 报告 `arch wasm`。它将 `grade` 的符号起点设为局部变量向量起始处 `0x8e`，而 `wasm-objdump` 将函数标记在大小字段起始处 `0x8b`。它的清单使用较旧的助记符 `get_local`、`set_local` 和会输出标签数量的 `brtable 11 4 4 ...`。三个工具读取的字节相同，拼写却不同，因此比较时必须说明清单由哪个工具生成。本课调研未在 Ghidra 的处理器目录中发现 WebAssembly 处理器模块，但没有完整阅读该目录清单。第三方 ghidra-wasm-plugin v2.4.0 面向 Ghidra 12.0。规范本身是持续更新的文档。W3C 的 `wasm-core-2` 页面是日期为 2026 年 10 月 13 日的候选推荐草案，摘要描述的是 3.0 版本；编辑草案也标有同一天的日期。

## ECMA-335 元数据是程序自身的数据库

.NET 程序集是 PE 文件。`LedgerNet.dll` 以 `MZ` 开头，包含名为 `.text`、`.rsrc` 和 `.reloc` 的三个节，并将机器类型声明为 `0x14c`，因为编译器生成的是平台无关代码。可选头部的数据目录 14，即 CLR 运行时头部，指向 RVA `0x2008`。ECMA-335 II.25.3.3 定义了该位置的 72 个字节：

```text
48 00 00 00   Cb 72
02 00 05 00   MajorRuntimeVersion 2, MinorRuntimeVersion 5
78 21 00 00   MetaData RVA 0x2178
84 07 00 00   MetaData size 1924
01 00 00 00   Flags: COMIMAGE_FLAGS_ILONLY
05 00 00 06   EntryPointToken 0x06000005, MethodDef row 5, which is Main
```

RVA `0x2178` 处的元数据根以签名 `42 53 4a 42` 开头，读作 `BSJB`，之后是版本 1.1 和字符串 `v4.0.30319`。随后有五个流头部：偏移 `0x6c` 处的 `#~`，以及 `#Strings`、`#US`、`#GUID` 和 `#Blob`。II.24.2 规定每种流最多出现一次。`#~` 流开头是一个 `HeapSizes` 字节，这里为零，因此每个字符串、GUID 和 blob 索引都占两字节；另有一个 64 位 `Valid` 掩码，标识存在的表。其中十四个位被置为 1：

| 表 | 标识 | 行数 | 行大小 | 各行内容 |
|---|---|---|---|---|
| Module | 0x00 | 1 | 10 | 模块名及其 GUID |
| TypeRef | 0x01 | 21 | 6 | `System.Object`、`System.Console` 及另外 19 项 |
| TypeDef | 0x02 | 4 | 14 | `<Module>`、`Ledger` 及两个编译器辅助类型 |
| Field | 0x04 | 2 | 6 | `Labels` 和一个静态数组初始化器 |
| MethodDef | 0x06 | 6 | 14 | 五个方法和 `.cctor` |
| Param | 0x08 | 5 | 6 | `before`、`after`、`score`、`values`、`score` |
| MemberRef | 0x0a | 16 | 6 | 12 个特性构造函数及 `Main` 调用的 4 个方法 |
| CustomAttribute | 0x0c | 12 | 6 | 编译器和 SDK 添加的特性 |
| StandAloneSig | 0x11 | 3 | 2 | 三个局部变量签名 |
| Assembly、AssemblyRef、ClassLayout、FieldRva、NestedClass | | 1、2、1、1、1 | | 标识、引用、布局 |

行大小并不存储在任何位置。II.22 为每列指定种类，II.24.2.6 给出大小规则。堆索引根据 `HeapSizes` 占两字节或四字节。当目标表少于 65536 行时，简单表索引占两字节。若编码索引能指向 n 个表，使用 b 个标签位，那么当这些表的行数都小于 2^(16-b) 时，它占两字节。`CliAssembly` 根据这些规则和行数计算十四个表的行大小。样本中的 System.Reflection.Metadata 转储报告相同的大小和表偏移，测试据此证明计算正确。

III.1.9 定义了令牌：高字节表示表，低三个字节表示从 1 开始的行号。`0x06000002` 是 `MethodDef` 第 2 行。该行的 RVA 为 `0x2060`，名称为 `Grade`，签名 blob 为 `00 01 08 08`：默认调用约定、一个参数、返回 `int32`、参数为 `int32`。它的 `ParamList` 指向 `Param` 第 3 行，其名称为 `score`。Param 表使 ILSpy 能从剥离后的发布构建中输出 `Grade(int score)`。RVA `0x2060` 处的方法体以胖头部开头：

```text
13 30         flags 0x13: fat, init locals; size 3 dwords
02 00         MaxStack 2
2d 00 00 00   CodeSize 45
01 00 00 11   LocalVarSigTok 0x11000001
```

`StandAloneSig` 第 1 行保存 `07 01 08`：`LOCAL_SIG`、一个局部变量、`int32`。局部变量有类型而无名称。ECMA-335 在第 V 部分的调试交换格式中保存局部变量名，.NET SDK 将其写入 PDB。这个样本以 `DebugType` none 构建，因此没有任何表或文件携带名称 `bucket`。`PercentChange` 则使用微型头部：首字节 `3a` 为 `0x0e << 2 | 2`，表示一个 14 字节的方法体，没有局部变量，默认栈深为 8。

`Grade` 的 45 个代码字节使用第 III 部分的操作码表解码。`switch` 的操作码为 `0x45`，后接一个 `u32` 计数，以及相应数量的 `int32` 目标，它们相对于表后的下一条指令计算：

```text
IL_0000: 02           ldarg.0
IL_0001: 1f 0a        ldc.i4.s 10
IL_0003: 5b           div
IL_0004: 0a           stloc.0
IL_0005: 06           ldloc.0
IL_0006: 1c           ldc.i4.6
IL_0007: 59           sub
IL_0008: 45 05 00 00 00 08 00 00 00 06 00 00 00 04 00 00 00 02 00 00 00 02 00 00 00
                      switch (IL_0029, IL_0027, IL_0025, IL_0023, IL_0023)
IL_0021: 2b 08        br.s IL_002b
IL_0023: 1a 2a        ldc.i4.4, ret
```

编译器在 `switch` 之前减去了 6，因此分支 6 是第一个目标。`disassemble_cil()` 通过表解析并呈现令牌：`ldsfld Labels`、`call Grade`、`call System.Console::WriteLine`，以及来自 `#US` 堆的 `ldstr ' '`。这些结果的基准是 `MetaDump`，即样本中基于 ILSpy 内部所用库 `System.Reflection.Metadata` 编写的简短 C# 程序。它输出每张表的行数、大小和偏移，每个方法的 RVA、签名、参数名和 IL 字节，以及 `System.Reflection.Emit.OpCodes` 的 226 个字段。`compare_with_metadump()` 的全部 246 项检查一致。运行时表包含 218 个操作码以及八个 `prefix` 占位项。本课的表有 219 项，因为它包含 III.2.2 中的 `no.`，而 Emit 表从未包含它。

该格式的工具包括：ILSpy 11.0（MIT 许可证，2026-08-12 发布）通过 Avalonia 桌面构建在 macOS 上运行。`ilspycmd` 11.1.0.9782 使用 `-il` 输出 IL，使用 `-m 0x06000002` 按令牌选择方法。dnSpyEx 6.6.0 继续维护 dnSpy，但只支持 Windows。IL 反汇编器 `ildasm` 以 NuGet 包提供，而不随 SDK 内置。radare2 6.2.4 也读取元数据：`rabin2 -I` 报告 `arch cil` 和 `class PE32`，`is` 列出 `Ledger.Grade(int:score):int`，其中参数名和两个类型取自 Param 表及签名表。此构建中没有 CIL 反汇编器。样本使用 .NET SDK 8.0.205 构建，因为构建机器安装的是这个 SDK。.NET 10 自 2025-11-11 起成为当前版本，写出的 ECMA-335 结构相同。

## 各容器保留了什么

将五种容器的 `grade` 放在同一张表中。每行都来自 `python3 code/main.py keeps`，它会对样本运行读取器：

| 容器 | 函数体字节数 | 函数名 | 参数名 | 参数与返回类型 | 局部变量名 | 行号 | 控制流 |
|---|---|---|---|---|---|---|---|
| ELF 目标文件，clang -O0 | 118 | `.symtab` 中的 `grade` | 无 | 无 | 无 | 无，没有 `.debug_*` 节 | 5 次跳转及 1 次经过重定位表的间接跳转 |
| CPython 3.14 pyc | 96 | `co_qualname` | `score` | 无 | `bucket` | `co_linetable`，首行为 10 | 4 对比较及 `POP_JUMP_IF_FALSE` |
| JVM 类，`javac -g` | 50 | 常量池 | `LocalVariableTable` 中的 `score` | `(I)I` | 参数以外无其他名称 | `LineNumberTable`，6 行 | 1 条 `tableswitch` |
| WebAssembly | 63 | 导出节 | 仅在有名称节时存在 | `(i32) -> i32` | 仅在有名称节时存在 | 无 | 6 个嵌套块、1 条 `br_table`、4 条 `br` |
| .NET 程序集 | 45 | `MethodDef` | `Param` 中的 `score` | `static int32(int32)` | 无，只有 `StandAloneSig` 中的类型 | 没有 PDB 则无 | 1 条 `switch`、1 条 `br.s` |

这张表解释了你将看到的反编译结果。第 34 课将 `int total(const int *, int)` 与 Ghidra 从原生代码推断出的 `int total(long param_1, uint param_2)` 比较，因为原生代码没有保留这些列中的信息。pyc 保留所有名称而不保留类型，其控制流是形态随版本变化的跳转，因此 Python 反编译器会因版本变化而失效，却可以直接恢复名称。类文件保留类型和经过验证的栈，开启 `-g` 时保留名称，并用一条指令表达 `switch`。Wasm 模块在构造上保留结构，因此 `wasm2wat` 可实现无损往返，唯一丢失的是名称。.NET 程序集保留的描述最完整，因为元数据表具有规范性，但局部变量名仍然需要 PDB。

该表说明了反编译器可利用什么，以及哪些输出复制了已存储的事实，哪些是推断。ILSpy 输出中的参数名是复制的；同一输出中的局部变量名则是推断的，除非提供了 PDB。第 35 课将这种区别记录为每项断言的依据权威性。

## 动手构建

运行演示：

```bash
cd phases/13-tools-and-protocols/43-bytecode-and-managed-formats
python3 code/main.py
```

输出是一份 JSON 报告。对每个 pyc，它提供两种头部、文件与 `grade` 的大小、保存清单中的指令数量与操作码名称，以及当前解释器能否读取它。对每种类文件构建，它提供版本、大小、调试表计数和与 `javap` 的一致情况。对每种 Wasm 构建，它提供节、类型、函数、名称节内容和与 `wasm-objdump` 的一致情况。对程序集，它提供 CLI 头部、流、表行数、方法和与 System.Reflection.Metadata 的一致情况。最后是信息保留表，以及在 `PATH` 中找到的解释器列表。

按以下顺序阅读 `code/main.py`：

1. `Reader` 保存游标和整数宽度。`uleb()` 和 `sleb()` 是 Wasm 及 .NET blob 堆所需的 LEB128 读取器。
2. `read_pyc_header()`、`Unmarshaller` 和 `PycFile` 读取 pyc。`parse_dis_text()` 读取保存的 `dis` 清单，因此跨版本比较不必在测试时安装四个解释器。
3. `ClassFile` 读取类文件，`disassemble_jvm()` 解码其中的代码。`parse_javap_code()` 和 `compare_with_javap()` 负责基准核对。
4. `WasmModule` 读取各节，`disassemble_wasm()` 解码表达式并跟踪深度。`compare_with_wasm_objdump()` 负责基准核对。
5. `CliAssembly` 遍历 PE、CLI 头部、元数据根、流和表。`TABLE_SCHEMAS` 与 `CODED_INDEXES` 将 II.22 和 II.24.2.6 表达为数据。`disassemble_cil()` 解码方法体，`compare_with_metadump()` 核对结果。
6. `NativeObject` 读取足以列出函数符号的 ELF 内容，并采用第 33 课的清单作为文本。`what_each_keeps()` 和 `figure_data()` 构建比较结果。

另有五个命令。`python3 code/main.py pyc FILE`、`class FILE`、`wasm FILE` 和 `dll FILE` 输出给定文件的结构及每个函数的清单。`python3 code/main.py compare` 使用 `PATH` 中的每个解释器编译 `ledger.py`，并输出各自写入的内容。

## 实际使用

对你自己构建的容器，按以下顺序使用读取器。

1. 读取开头字节并识别格式。两个字节后接 `0d 0a` 表示 pyc，`ca fe ba be` 表示类文件，`00 61 73 6d` 表示模块，`4d 5a` 且数据目录 14 已设置则表示程序集。
2. 读取头部并记录它指示的生成工具版本。pyc 依据魔数字，类文件依据主版本号，程序集依据运行时和元数据版本字符串。
3. 运行任何计划使用的反编译器前，先检查其是否支持该版本。记录其版本上限以及工具文档中的出处。
4. 对同一文件运行读取器和该格式自己的工具，逐行比较。不一致意味着读取器有缺陷或工具发生变化；无论哪种情况，必须先查明原因，清单才能成为证据。
5. 为你关注的函数填写信息保留表。将每项事实标记为保留或丢失，并注明其来源表、属性或节。
6. 完成以上步骤后再阅读反编译输出。将每个名称和类型标记为对已保留事实的复制，或标记为推断。

将基准文本文件与容器保存在一起。当解释器、JDK、SDK 或 wabt 版本变化时，用 `build_fixtures.sh` 重新构建并保存输出，因为清单变化就意味着样本变化。

## 交互实验

### 实验 A：先读头部，再读代码对象

从 `code` 目录打开 Python：

```bash
cd phases/13-tools-and-protocols/43-bytecode-and-managed-formats/code
python3 -q
```

运行：

```python
from main import *
pyc = load_pyc("ledger.cpython-311.pyc")
pyc.header.to_dict()
pyc.module.names
pyc.functions()["grade"].varnames
len(pyc.functions()["grade"].code)
```

第一次调用前先写下魔数字。然后加载 `ledger.cpython-314.pyc`，比较两份 `code` 的长度。接着在你的解释器中对 3.11 文件尝试 `import marshal; marshal.loads(pyc.data[16:])`，阅读错误信息。

### 实验 B：常量池引用链

```python
cls = load_class("Ledger-g.class")
cls.constant(13)
cls.constant(14)
cls.describe_constant(13)
[row["text"] for row in jvm_listing(cls, "grade")]
```

调用 `describe_constant` 前，先手动从 `#13` 追踪到 `#8` 和 `#14`，再追踪到 `Utf8` 条目。随后加载 `Ledger-gnone.class`，对两个对象分别调用 `cls.method("grade").attribute_names()`。`Code` 数组相同，属性却不同。

### 实验 C：深度与标签

```python
module = load_wasm("ledger.wasm")
[(row["depth"], row["text"]) for row in wasm_listing(module, "grade")]
module.function_name(2)
load_wasm("ledger-names.wasm").names["locals"][2]
```

找到 `br_table` 行并读取深度。统计其后的 `end` 行，将每行与表中的标签编号对应起来。然后打开 `ledger.wat`，找到标签 3 对应的 `block $six`。

### 实验 D：从令牌到字节

```python
asm = load_assembly("LedgerNet.dll")
asm.method("Grade")
body = asm.method_body(asm.method("Grade")["RVA"])
body.fat, body.max_stack, body.code_size, hex(body.local_signature_token)
asm.token_text(0x11000001)
[row["text"] for row in cil_listing(asm, "GradeLabel")]
```

根据 `.text` 节头部，手动计算 RVA `0x2060` 对应的文件偏移，并与 `asm.rva_to_offset(0x2060)` 比较。然后查阅 `asm.row(0x08, 3)`，找出名称 `score` 存放的位置。

## 实践实验

为比较加入第五种源语言，或为表格增加第六项事实。

要求：

- 使用你已安装编译器的语言，编写包含循环和局部变量的函数，例如将 Kotlin 编译为类文件，或将 Rust 编译为 Wasm 模块。提交输出和基准清单，并在 `build_fixtures.sh` 中记录准确命令。
- 让对应读取器的每条指令都与基准一致。仅在样本需要时添加操作码。
- 扩展 `what_each_keeps()`，加入新容器，并为所有容器增加一项事实：函数体是否携带异常表或 `try` 区域。
- 将新容器加入 `figure_data()`，并重新生成 `site/figures-re-43.js`。
- 编写测试：当读取器声称某项事实被保留，却没有指明存储它的表、属性或节时，测试应失败。

验收标准是：`python3 code/main.py keeps` 显示新行，每个单元格都有证据，且所有基准比较仍然一致。

## 本课产物

本课包含 `outputs/skill-bytecode-and-managed-formats.md`。使用它可将字节码容器转化为头部报告、经过核对的单函数清单，以及将每个名称、类型和结构标记为保留或丢失的事实表。它要求以该格式自己的工具作为基准，在运行任何反编译器前检查版本，并说明每项丢失事实原本应存储在哪里。

## 验证

运行演示和确定性测试套件：

```bash
cd phases/13-tools-and-protocols/43-bytecode-and-managed-formats
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明：

- 四份 pyc 头部的魔数字分别为 3495、3531、3571 和 3627，标志为 3，并含有 8 字节哈希；时间戳文件的标志为 0、mtime 为 1791975565、大小为 497
- 3.11 及以后版本的每个魔数字都位于 `2900 + 50n` 规则为其版本指定的范围内
- 对当前解释器写出的文件，反序列化器返回的名称、常量、代码字节、变量名和行号表与 `marshal.loads()` 相同
- 四个文件都保留模块名称、`grade` 的 `('score', 'bucket')`、首行号 10，以及文件名 `ledger.py`
- 四个版本的 `grade.co_code` 分别为 80、62、70 和 96 字节，保存的清单分别有 31、26、26 和 35 条指令
- 3.11 清单含有 `POP_JUMP_FORWARD_IF_FALSE`，3.12 和 3.13 含有 `RETURN_CONST`，3.14 含有 `LOAD_SMALL_INT`、`LOAD_FAST_BORROW` 和 `NOT_TAKEN`
- 3.14 的 `-C -O` 清单显示 `grade` 内有 13 个缓存项，其中五个位于 `BINARY_OP` 后，自适应清单中出现 `COMPARE_OP_INT`
- 缺少 `0d 0a` 的头部、截断头部，以及不是代码对象的主体都会触发 `FormatError`
- 只为当前解释器写出的 pyc 生成指令清单，且与保存的 `dis` 输出一致
- 类文件的主版本为 65 或 69，大小分别为 1581、1832、1404 和 1581，常量池计数分别为 82、94、79 和 82
- 常量 `#13` 解析为 `Method Ledger.grade:(I)I`，`#47` 解析为 `String F`
- JVM 反汇编器在四种构建中均与 `javap -c -p` 实现 108 条指令全部一致
- pc 4 处的 `tableswitch` 长 36 字节，下限为 6、上限为 10、默认目标为 48，其余目标为 46、44、42、40、40
- 三种调试级别改变属性数量，但 `grade` 的 50 个代码字节保持一致
- `ifne`、`if_icmpge` 和 `goto` 的目标相对于分支操作码计算
- 错误魔数、尾随字节和未定义操作码都会触发 `FormatError`
- 七个 Wasm 节的载荷偏移与 `wasm-objdump -h` 输出一致，带名称构建在 293 至 425 处添加 `name` 自定义节
- 类型、`env.log` 导入、五个导出和偏移 1024 处的数据段均按 `ledger.wat` 所写内容解码
- Wasm 反汇编器在两种构建中均与 `wasm-objdump -d` 实现 77 条指令全部一致
- `grade` 有 6 个嵌套块，深度 6 处的 `br_table` 含标签 `4 4 4 4 4 4 3 2 1 0 0` 且默认标签为 4，以及一个 `i32` 局部变量
- 没有名称节时，函数名来自导出；局部变量名只有在名称节存在时才有
- LEB128 的 `e4 00` 为 100、`7f` 为 -1、`80 08` 为 1024，块类型的呈现方式与 `wasm-objdump` 一致
- 错误前导字节、版本 2 和未知操作码都会触发 `FormatError`
- 程序集为 PE32，机器类型为 `0x14c`，CLI 头部位于 RVA `0x2008`，运行时为 2.5，标志为 `ILONLY`，入口为 `0x06000005`
- 元数据版本为 `v4.0.30319`，存在五个流，十四张表的行数和行大小与基准报告一致
- .NET 读取器与 System.Reflection.Metadata 的 246 项检查全部一致
- `Grade` 的参数为 `score`，签名为 `static int32(int32)`，胖头部的 `MaxStack` 为 2，代码长 45 字节，并有一个无名称的 `int32` 局部变量
- CIL 的 `switch` 目标以及 `br.s`、`ldsfld`、`call` 和 `ldstr` 操作数均通过表和堆解析
- CIL 操作码表覆盖运行时的每个操作码，仅额外加入 `no.`
- 信息保留表显示四种容器保留参数名，原生代码不保留；三种容器保留类型
- 演示中的每行基准结果都显示 n 项比较中 n 项一致
- 交互图嵌入的数据与 `figure_data()` 生成的数据相同

## 生产环境中的失效模式

| 失效情况 | 不完善的工具报告什么 | 分析必须证明什么 |
|---|---|---|
| 反编译器比解释器旧 | `Unsupported opcode`、输出被标记为不完整，或声称存在混淆 | 魔数字、它对应的版本及工具文档中的版本上限 |
| 用错误解释器读取 pyc | `marshal.loads` 抛出异常或返回无效数据 | 我们的反序列化器可读取任意 3.9 至 3.15 文件的名称、常量和大小，指令来自匹配的 `dis` |
| 将专门化操作码误认为文件内容 | 清单中出现 `COMPARE_OP_INT` | pyc 保存非专门化形式，专门化在预热后的内存中发生 |
| 声称默认 javac 构建保留局部变量名 | 将 `var1`、`var2` 当作源码名称 | `LocalVariableTable` 只在启用 `-g` 时存在，两种情况下的 50 个代码字节相同 |
| 分支目标偏差一个指令长度 | JVM 清单中的跳转落在指令中间 | 偏移相对于分支操作码，并与 `javap` 核对 |
| 跳过 switch 填充 | `tableswitch` 的默认目标错误，分支错位 | 用零至三个字节将 pc 对齐到 4，五个分支总计 36 字节 |
| 以为 Wasm 名称已被剥离 | “没有符号” | 导出为每个导出函数命名，局部变量需要 `name` 节，`wasm-strip` 只移除该节 |
| 三种工具，三种拼写 | `get_local` 与 `local.get`，函数位置为 `0x8b` 或 `0x8e` | 字节相同，并明确用于比较的清单由什么工具生成 |
| 猜测表行大小 | 第一张表之后的每行都被读错 | 行大小由 `HeapSizes`、行数及编码索引宽度决定，并与基准相同 |
| 期望发布程序集保留局部变量名 | 将 `V_0` 当作源码名称 | 局部变量类型在 `StandAloneSig` 中，名称只在 PDB 中，而 `DebugType` none 不会生成它 |
| 读取器猜测未知操作码或类型码 | 一个看似合理的助记符 | 抛出含偏移的 `FormatError`，并在此处停止基准比较 |
| 基准来自另一构建 | 测试依靠过时文本通过 | `build_fixtures.sh` 记录每个工具版本，并写入 `versions.txt` 和 `sha256.txt` |

## 操作原则

先读头部，识别它指向的生成工具。使用遇到未知内容就拒绝继续的读取器读取容器，并在同一文件上将清单与该格式自己的工具核对。然后对反编译输出中的每个名称和类型，说明它是容器存储的，还是工具推断的。

## 延伸阅读

- [PEP 552：确定性 pyc](https://peps.python.org/pep-0552/)
- [CPython `Include/internal/pycore_magic_number.h`](https://github.com/python/cpython/blob/main/Include/internal/pycore_magic_number.h)
- [Python `marshal` 模块文档](https://docs.python.org/3/library/marshal.html)
- [CPython `Python/marshal.c`](https://github.com/python/cpython/blob/main/Python/marshal.c)
- [Python 3.14 `dis` 模块文档](https://docs.python.org/3.14/library/dis.html)
- [PEP 659：专门化自适应解释器](https://peps.python.org/pep-0659/)
- [PEP 626：供调试及其他工具使用的精确行号](https://peps.python.org/pep-0626/)
- [PEP 790：Python 3.15 发布计划](https://peps.python.org/pep-0790/)
- [PyPI 上的 uncompyle6](https://pypi.org/project/uncompyle6/)、[PyPI 上的 decompyle3](https://pypi.org/project/decompyle3/)、[PyPI 上的 xdis](https://pypi.org/project/xdis/)、[GitHub 上的 pycdc](https://github.com/zrax/pycdc)、[GitHub 上的 PyLingual](https://github.com/syssec-utd/pylingual)
- [Java 虚拟机规范，Java SE 25，第 4 章：类文件格式](https://docs.oracle.com/javase/specs/jvms/se25/html/jvms-4.html)
- [Java 虚拟机规范，Java SE 25，第 6 章：Java 虚拟机指令集](https://docs.oracle.com/javase/specs/jvms/se25/html/jvms-6.html)
- [javac 手册，Java SE 25](https://docs.oracle.com/en/java/javase/25/docs/specs/man/javac.html) 和 [javap 手册](https://docs.oracle.com/en/java/javase/25/docs/specs/man/javap.html)
- [CFR](https://www.benf.org/other/cfr/)、[Procyon](https://github.com/mstrobel/procyon)、[Vineflower](https://github.com/Vineflower/vineflower)、[intellij-community 中的 Fernflower](https://github.com/JetBrains/intellij-community/tree/master/plugins/java-decompiler/engine)、[JADX](https://github.com/skylot/jadx)
- [Harrand、Soto-Valero、Monperrus、Baudry，《Java 反编译器的多样性及其在元反编译中的应用》（JSS 2020）](https://arxiv.org/abs/2005.11315)
- [ECMA-335，公共语言基础结构，第 6 版（2012 年 6 月）](https://ecma-international.org/publications-and-standards/standards/ecma-335/)
- [PE 格式，Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format)
- [System.Reflection.Metadata.Ecma335.TableIndex](https://learn.microsoft.com/en-us/dotnet/api/system.reflection.metadata.ecma335.tableindex)
- [GitHub 上的 ILSpy](https://github.com/icsharpcode/ILSpy)、[NuGet 上的 ilspycmd](https://www.nuget.org/packages/ilspycmd)、[GitHub 上的 dnSpyEx](https://github.com/dnSpyEx/dnSpy)
- [WebAssembly 核心规范：二进制格式，模块](https://webassembly.github.io/spec/core/binary/modules.html) 和 [值](https://webassembly.github.io/spec/core/binary/values.html)
- [WebAssembly 核心规范：自定义节（名称节）](https://webassembly.github.io/spec/core/appendix/custom.html)
- [WebAssembly tool-conventions：调试](https://github.com/WebAssembly/tool-conventions/blob/main/Debugging.md)
- [wabt 1.0.42 发布说明](https://github.com/WebAssembly/wabt/releases/tag/1.0.42)、[wasm-tools](https://github.com/bytecodealliance/wasm-tools)、[Binaryen](https://github.com/WebAssembly/binaryen)、[ghidra-wasm-plugin](https://github.com/nneonneo/ghidra-wasm-plugin)
- [GitHub 上的 radare2](https://github.com/radareorg/radare2)，本课使用从源码构建的 6.2.4 版本
