# 恢复数据与类型:结构体,数组,C++对象和DWARF

> 反编译器有类型表时会输出`a->balance`没有时间输出`*(int *)(param_1 + 4)`△本课程从访问操作构建类型表,从DWARF 5 读取真正类型表,并展示两者之间的一致性.

**Type:** Build
**Languages:** Python, C, C++, x86-64 assembly
**Prerequisites:** Phase 13 · 33（反汇编与控制流）、Phase 13 · 34（提升为伪代码）
**Time:** ~140 分钟

## 学习目标

- 根据Intel SDM寻址规则,将结构体成员访问解读为基址寄存器加位移,将数组访问解读为基址加索乘步长――
- 手工将系统 V 对齐规则应应用于`struct account`解释每一个填充字节.
- 构建类型恢复分析遍,将清单中的访问转换为字段偏移,宽度,类别,步长和大小,并为每个项目提供证据.
- 为重定目标文件的`.debug_info`,我知道.`.debug_abbrev`,我知道.`.debug_str_offsets`和 `.debug_addr`编写 DWARF 5 读取器,并对照 `llvm-dwarfdump`检查.
- 对于恢复的布局和DWARF布局,将每个差异归类为缺失证据,合并访问或无法证明的类别.
- 从重定位记录读取Itanum C++ 虚函数表、类型信息和修饰名称,并将虚调用解析到槽位──

## 问题

你在没有带着`-g`编译了`account.c`然后问问代理人,`bump`作为一个目标文件,将目标文件交给Ghidra 12.1.4,得到以下结果:

```c
void bump(long param_1,int param_2)
{
  *(int *)(param_1 + 4) = param_2 + *(int *)(param_1 + 4);
  return;
}
```

作为一个源码带`-g`编译后,同一个反编译器给出的结果如下:

```c
int bump(account *a,int by)
{
  a->balance = by + a->balance;
  return a->balance;
}
```

两个目标文件中的指令完全相同,区别在于类型表. 有这个表,反编译器知道第一个参数指向一个32字节的结构体,其中偏移4个处是命名的.`balance`的 4 字节`int`字段.没有这张表,它只知道.`%rdi`中传来了一个8字节宽的值,并且`+4`处的4字节被读取和写入.

图表中的每一个项目都有来源.`addl 0x4(%rax), %ecx`的位移字节;宽度 4 来自 `l`后;名称来自 `.debug_info`中中 `DW_TAG_member`条目――本课程构建了两个部分:一个恢复指令所能证明信息的分析遍及,以及一个解码编译器记录的读取器――两者之间的差异就是获得类型名称需要付出的代价――

```figure
re-41-struct-recovery
```

## 成员访问就是位移

智能 SDM 第1卷 第3.7.5节将有效地址定义为`Offset = Base + (Index * Scale) + Displacement`部分的比例因子为1,2,4或8,位移为8,16或32位.`RIP + Displacement`形式──结构体成员访问采用第一种形式但没有索引:基址寄存器保存对象地址,位移就是成员偏移──数组访问加入索引项,比例因子或单独乘法承载元素大小──

以 `-O0`下一个`bump`举例来说,`llvm-objdump -d -r`清单如下:

```text
       4: 48 89 7d f8                  	movq	%rdi, -0x8(%rbp)
       e: 48 8b 45 f8                  	movq	-0x8(%rbp), %rax
      12: 03 48 04                     	addl	0x4(%rax), %ecx
      15: 89 48 04                     	movl	%ecx, 0x4(%rax)
```

用第33课规则解码`03 48 04`,我知道.`03`表示`ADD r32, r/m32`〔ModRM〕`48`是 `01 001 000`其他:`mod = 01`表示带8位位移的内存操作数,`reg = 001`是 `%ecx`没有任何`r/m = 000`是 `%rax`位移字节为`04`△该指令读取`%rax + 4`处的4字节,并将其加到`%ecx`,我知道.`llvm-objdump`输出`l`后表示操作数大小,因此字段宽 4字节.`%rax`现在`-0x8(%rbp)`处的槽,而槽接收了`%rdi`系统V调用约定中的第一个整数参数. 结果得到了三个事实:第一个参数是指针;它指向的对象在偏移4处有一个4字节字段;`bump`读取并写入该字段.

这些字节没有说明`int`,我知道.`balance`或`struct account`没有说明对象有多大.`bump`没有人能看到.

## 系统 V 布局规则

x86-64 psABI 第3.1.2节给出三条聚合类型规则:结构体和联合体采用其对齐要求最严格的成员对齐要求.每个成员被分配到满足其对齐要求的最小可用的偏移.`char`为1和1,`short`为 2 和 2,`int`为4和4,`double`为 8 和 8,任何指针均为 8 和 8.

将这些规则应用于`account.c`中的结构体:

```c
struct account {
    char kind;
    int balance;
    short code;
    double rate;
    const char *label;
};
```

| 成员 | 大小 | 对齐 | 满足条件的最低偏移 | 前置填充 |
|---|---|---|---|---|
| `kind` | 1 | 1 | 0 | 0 |
| `balance` | 4 | 4 | 4 | 3（字节 1 至 3） |
| `code` | 2 | 2 | 8 | 0 |
| `rate` | 8 | 8 | 16 | 6（字节 10 至 15） |
| `label` | 8 | 8 | 24 | 0 |

最后一个字符结束于32──最严格的对齐为8.32是8的倍数,因此大小为32 ,没有尾部填充──32 字节中有9 字节是填充,而 psABI 规定任何填充的内容均未定义──

成员顺序决定大小──将同样五个成员按 `double, pointer, int, short, char`排列,将占据偏移 0、8、16、20、22,结束在 23,再上升对齐到 24、`code/main.py`中中 `sysv_layout()`应用这三条规则并得到两种结果.`ctypes`模块通过主编译器约定应用相同规则;对相同结构体,`ctypes.sizeof`,我知道.`ctypes.alignment`和各个字段的`.offset`分别给出32、8 和`0, 4, 8, 16, 24`在这个机器上构建和运行程序时,程序本身会印出第三个结果:

```text
sizeof 32 align 8
kind 0 balance 4 code 8 rate 16 label 24
sum 315 tag -3 projected 318.75 label_length 7
```

亚博app下载的亚博app下载的亚博app下载的亚博app下载的亚博app下载的亚博app下载的亚博app下载的亚博app下载的亚博app下载的亚博app下载的亚博app下载的亚博app下载的亚博app下载下载,亚博app下载的亚博app下载的亚博app下载下载的亚博app下载下载,亚博app下载的亚博app下载下载的亚博app下载下载,亚博app下载的亚博app下载下载,亚博app下载的亚博app下载下载下载,亚博app下载下载下载下载,亚博app下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下载下下下下载下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下下`-target x86_64-unknown-linux-gnu`编译,以便第33课的ELF读取器和下文的DWARF读取器能够处理它们.

## 手工读取结构体的余部分

`bump`只有一个字段可以看到.`account.c`中另外四个函数可以看到其余字段,而且每个函数都显示出一种不同的命令形式――下面所有地址均来自`account-x86_64-O0-g.objdump.txt`,我知道.

`sum_balances`引入该结构体数组:

```text
      51: 48 8b 45 f8                  	movq	-0x8(%rbp), %rax
      55: 48 63 4d ec                  	movslq	-0x14(%rbp), %rcx
      59: 48 c1 e1 05                  	shlq	$0x5, %rcx
      5d: 48 01 c8                     	addq	%rcx, %rax
      60: 8b 40 04                     	movl	0x4(%rax), %eax
```

`%rax`是 `list`没有任何`%rcx`是符号扩展到64位的`i`现在,`shlq $0x5`将其乘以32 执行`addq`后,`%rax`为`list + 32 * i`运行运行`i`个元素偏移 4 处的 4 字节. 移位次数是这个目标文件中唯一的数值形式体现结构体大小的地方.`0x49`延伸到`0x72`处的`jmp 0x49`,我知道.

`tag`读取两个狭段:

```text
      8c: 0f be 00                     	movsbl	(%rax), %eax
      98: 0f bf 48 08                  	movswl	0x8(%rax), %ecx
```

`movsbl`加载偏移 0 处的一个字节并进行符号扩展,因此偏移 0 的字段是有符号 1 字节整数.`movswl`加载偏移 8 处的两个字节并进行符号扩展,因此偏移 8 的字段是有符号 2 字节整数.`-O1`下,第一次访问变成了`cmpb $0x6c, (%rdi)`它们仍然可以说明偏移 0 处有 1 字节,但不能说明符号性.

`projected`读取浮点数:

```text
      cc: f2 0f 2a 40 04               	cvtsi2sdl	0x4(%rax), %xmm0
      d5: f2 0f 59 40 10               	mulsd	0x10(%rax), %xmm0
```

`cvtsi2sdl`将内存中的有符号32位整数转换为双精度数,确认偏移4处保存有符号4字节整数――`mulsd`乘以内存中的双精度数,因此偏移16处保存8字节浮点值.

`label_length`读取指针,然后沿着指针访问:

```text
      f3: 48 8b 40 18                  	movq	0x18(%rax), %rax
      f7: 48 63 4d f4                  	movslq	-0xc(%rbp), %rcx
      fb: 80 3c 08 00                  	cmpb	$0x0, (%rax,%rcx)
```

`movq`读取偏移24个地方的8字节.`cmpb`将加载值用于内存操作数的基址.`cmpb`从中读取索引 `%rcx`处的 1 字节;在`-O1`下,循环中通过`leaq 0x1(%rcx), %rcx`推进指针,因此它指向的元素间隔为1字节.

综合五个函数,结构体为`{ i8 at 0, i32 at 4, i16 at 8, f64 at 16, pointer at 24 }`步长为 32──1 至 3 和 10 至 15 的空隙恰好是 psABI 规则预测的填充.`const char *`偏移 0 处有符号字节的声明类型,源码写作 `char`接收的函数是相同的类型.`main`它们将传递给所有五个函数.`-O0`下,调用点让这一点清楚可见:`leaq -0x70(%rbp), %rdi`后,在`callq bump`前执行`addq $0x20, %rdi`在`callq tag`前执行`addq $0x40, %rdi`△偏移 0`0x20`和 `0x40`是同一数组的三个元素;用于填充数组的`memcpy`拷贝`0x60`字节,即96字节,正好是三个32字节元素.

## 分析遍

`code/main.py`中中 `trace_function()`按地址顺序穿过一个函数的指令,并维护一个小型抽象状态――值的承载位置是64位寄存器或类似的`-0x8(%rbp)`每个位置都有三种值之一.`Pointer`包括根,常量偏移和步长集合,其中步长表示已加上该字节数的某个未知倍数.`Index`是数值未知,但为某个比例因子整数倍的整数.

始状态让六个系统 V 参数寄存器分别保存`Pointer("param0", 0)`至 `Pointer("param5", 0)`接下来每条命令应用一条规则:

- 64 位寄存器与槽之间`movq`复制值──对寄存器的32位或更窄的写入会变为比例因子为1的.`Index`,我知道.
- 以指针为基址的`leaq`生成加上位移后的指针;如果有索引寄存器,则向步长集合加入`scale * index_scale` `%rbp`或`%rsp`为了建立一个`leaq`标识对象,这是`main`传递`rows`如何?
- 对于`Index`执行`shlq $n`比例因子乘以`2^n`执行`imulq $k`则乘以`k`,我知道.
- 指标与索引相加`addq`保留指针,并将索引比例因子加入步长集合.`addq $k`会改变其偏移,同时记录该寄存器的增量.
- 调用使所有调用者保存寄存器变为未知;保存指针的参数寄存器会记录为调用点。
- 基址寄存器保存指针的任何内存操作数都会变为`Access`包含指针的根和偏移,由助记符确定的宽度和类型以及存储标志.

宽度和类别由助记符决定.`access_width()`将`b`,我知道.`w`,我知道.`l`,我知道.`q`后映射到1、2、4、8 字节;将 `movsbl`和 `movswl`映射为有符号窄载,`movzbl`映射为无符号加载;将 `sd`和 `ss`标量 SSE 指令映射为 8 字节和 4 字节浮点数;将 `cvtsi2sdl`映射为有符号 4 字节整数源;将 16 字节的 `movaps`导令族映射为向量──`leaq`和各类`nop`不属于访问.

```python
if memory.base in FRAME_REGISTERS:
    return Pointer(f"frame({memory.base}{format_signed(memory.displacement) if memory.displacement else ''})", 0)
base = env.get(memory.base)
if not isinstance(base, Pointer):
    return Unknown
strides = set(base.strides)
if memory.index is not None:
    index_value = env.get(memory.index)
    strides.add((index_value.scale if isinstance(index_value, Index) else 1) * memory.scale)
return Pointer(base.root, base.offset + memory.displacement, frozenset(strides), base.origin)
```

通过指标加载 8 字节会生成一个新的指标,其根标值来自的字段,例如`param0->0x18`△当该值之后被用作基址,或通过`leaq`推进时,来源字段就被标记为已证明是指针──这条规则将偏移24从8字节变为指针──

### 四种步长证据

`infer_layout()`合并所有见证函数的访问,并从四种来源收集步长,每个项都附带产生它的指令.

| 类别 | 来源 | 展示它的构建 |
|---|---|---|
| `scale` | 由 `shlq $0x5` 或 `imulq` 产生、比例因子大于 1 的 `Index` 到达指针 | `-O0`，`0x59` 处的 `shlq $0x5, %rcx` |
| `loop-step` | 循环内基址或索引寄存器的 64 位增量，且同一循环也包含该访问 | `-O1`，`0x24` 处的 `addq $0x20, %rdx` |
| `offset-delta` | 同一循环中通过同一基址寄存器、宽度相同且偏移间距恒定的访问 | `-O2`，八次间隔 32 的加载 |
| `call-site` | 将同一栈帧对象传给见证函数时所采用的偏移 | `-O0`，`main` 传递 `rows`、`rows+0x20`、`rows+0x40` |

循环由向后的`jmp`只有循环范围同时包含增量和访问时,增量才被计入证据.`-O0`下推进`i`的`addl $0x1, %eax`因为它是32位加法,而且访问没有过.`%eax`△最终步长是所有找到的数值中最大的公约数.

### 气下流量化循环

在`-O2`下,将会`sum_balances`量化.`0x50`到了`0xaa`循环每轮读取八个元素:

```text
      3b: 48 8d 87 e4 00 00 00         	leaq	0xe4(%rdi), %rax
      50: 66 0f 6e 50 80               	movd	-0x80(%rax), %xmm2
      55: 66 0f 6e 98 60 ff ff ff      	movd	-0xa0(%rax), %xmm3
      61: 66 0f 6e 90 40 ff ff ff      	movd	-0xc0(%rax), %xmm2
      69: 66 0f 6e a0 20 ff ff ff      	movd	-0xe0(%rax), %xmm4
      7d: 66 0f 6e 10                  	movd	(%rax), %xmm2
      81: 66 0f 6e 58 e0               	movd	-0x20(%rax), %xmm3
      8a: 66 0f 6e 50 c0               	movd	-0x40(%rax), %xmm2
      8f: 66 0f 6e 60 a0               	movd	-0x60(%rax), %xmm4
      a0: 48 05 00 01 00 00            	addq	$0x100, %rax
      aa: 75 a4                        	jne	0x50 <sum_balances+0x40>
```

`%rax`从`list + 0xe4`开始──八个位移使加载位置相对于`list`的偏移分别为`0x04, 0x24, 0x44, 0x64, 0x84, 0xa4, 0xc4, 0xe4`现在,我还在`4, 36, 68, 100, 132, 164, 196, 228` 增量为`0x100`分析一遍看到偏移就直接记录,会报告八个字节和至少232字节的结构体.

`fold_unrolled()`应用一条规则:在一个循环中,通过同一基址寄存器进行的同宽访问.`d`现在是32个.`k * d`现在,`k`个不同偏移,则循环展开了`k`接下来,每次访问都是偏移的.`(offset - lowest) mod d`处的同一个元素访问.`256 = 8 * 32`并且有八个偏移,因此八次加载全部折叠到偏移4,步长证据记录为`offset-delta 32`,我知道.`unrolled 32`和 `loop-step 256`,我知道.`0xe0`处的标量余数循环再次从`shlq $0x5, %rdx`加入`scale 32`从`addq $0x20, %rdx`加入`loop-step 32`五个数值最大的公约数为32个.

图中有一个关闭折叠按──关闭后,`-O2`构建会显示7个字段位于字节32后,且没有大小.

## 从字节读取 DWARF 5

`account.c`的`-g`构建携带八个调试节.`.debug_info`为493字节,`.debug_abbrev`为179`.debug_str`为了230,`.debug_str_offsets`为了124,`.debug_addr`为112,`.debug_line`对于312个`.debug_line_str`为12个`.debug_frame`为264──DWARF 5 标准引言将`.debug_str_offsets`,我知道.`.debug_addr`和 `.debug_line_str`列为第五版新增内容.`code/main.py`中的读取器需要前五节.

### 单元头

标准第 7.5.1.1 节给出完整编译单元头:`unit_length`,我知道.`version`,我知道.`unit_type`,我知道.`address_size`和 `debug_abbrev_offset`,我知道.`.debug_info`后十二字节如下:

```text
e9 01 00 00   unit_length = 0x1e9 = 489
05 00         version = 5
01            unit_type = DW_UT_compile
08            address_size = 8
00 00 00 00   debug_abbrev_offset = 0
```

`unit_type`字节是第五版新增的,标准在同一节中说明这一点.`4 + 489 = 493`开始,也就是节的末尾.`llvm-dwarfdump --debug-info`在其`Compile Unit:`行印同样五个值,第一个测试会解析并比较该行.

### 缩写

第2.1节说明,每条调试信息条目由标识标签和一系列属性组成.条目本身只保存缩写代码.`.debug_abbrev`声明中,该声明指标,后面是否有条目,并列出各属性及其编码形式.

```text
[12] DW_TAG_structure_type  DW_CHILDREN_yes
     DW_AT_name              DW_FORM_strx1
     DW_AT_byte_size         DW_FORM_data1
     DW_AT_decl_file         DW_FORM_data1
     DW_AT_decl_line         DW_FORM_data1
[13] DW_TAG_member           DW_CHILDREN_no
     DW_AT_name              DW_FORM_strx1
     DW_AT_type              DW_FORM_ref4
     DW_AT_decl_file         DW_FORM_data1
     DW_AT_decl_line         DW_FORM_data1
     DW_AT_data_member_location  DW_FORM_data1
```

`parse_abbreviations()`读取ULEB128代码、ULEB128标签、一个子条目标志字节,然后读取属性与形式的配对,直到遇到`0, 0`△第7.5.6节 给出编码形式:`data1`为一个字节;`ref4`为单位的4 字节偏移;`strx1`为字符串偏移表的1字节索引;`sec_offset`和 `data4`为 4 字节;`addrx`为地址表的ULEB128索引;`exprloc`为ULEB128 长度及相应数量的字节;`flag_present`完全不占字节──

### 手工解码平衡 成员

`account`结构体条目开始偏移`0x195`字节为`0c 15 20 00 03`△缩写代码为 12,表示结构体──`DW_AT_name`是字符串索引`0x15`没有任何`DW_AT_byte_size`为`0x20`它们是32个.`DW_AT_decl_file`为0,`DW_AT_decl_line`为3,即源码中`struct account {`现在我们在行路.

第二条 成员条目`0x1a3`开始,字节为`0d 10 88 01 00 00 00 05 04`其他:

1. `0d`是缩写 13,表示成员──
2. `10`是以`strx1`编码的`DW_AT_name`字符串索引 16
3. `88 01 00 00`是以`ref4`编码的`DW_AT_type`距离单元起点偏移`0x188`名为`int`的`DW_TAG_base_type`条目:
4. `00`是 `DW_AT_decl_file`没有任何`05`是 `DW_AT_decl_line`其他:`account.c`五个行
5. `04`是 `DW_AT_data_member_location`偏移 4 个

第5.7.6 节说明,成员条目可以具有 DW_AT_data_member_location 属性或 DW_AT_data_bit_offset 属性,而整数常量是对包含实体起点的字节偏移.`addl 0x4(%rax), %ecx`中位移数值相同,`compare_layouts()`就是将两者并列比较函数.

### 字符串和地址经由两张表解析

字符串索引 16 不是`.debug_str`中的偏移──读取器从单元条目获取 `DW_AT_str_offsets_base`读取后,其值为8`.debug_str_offsets`中 中`8 + 4 * 16`处的4 字节条目──该条目保存 `"balance"`在`.debug_str`中的偏移──地址也采用相同的间接方式──`sum_balances`的条目以字节`07 07`开头:缩写7 表示子程序,随后是以`addrx`编码、索引为7的`DW_AT_low_pc`,我知道.`.debug_addr`中 中`8 + 8 * 7`处的 8 字节条目为`0x30`函数在`.text`中的地址──该表前六项是六字符串字面量地址──

在可重定位目标文件中,两张表都未保存最终值.`.debug_str_offsets`每项均为零,`.rela.debug_str_offsets`保存针对`.debug_str`没有人知道.`R_X86_64_32`重定位,真实偏移在加数中.`.debug_addr`有13个目标`.text`和 `.rodata.str1.1`的`R_X86_64_64`重定位`.debug_info`自身有四个重定位:缩写偏移;以`.debug_str_offsets+0x8`表示的`DW_AT_str_offsets_base`其他`DW_AT_stmt_list`及以`.debug_addr+0x8`表示的`DW_AT_addr_base`在读取器解析节之前,`ElfObject.relocated()`为32位和64位类型应用`S + A`△目标文件中的节符号值为0,因此字段获得加数──`llvm-dwarfdump`执行相同的解析,这就是它的输出能显示名称和地址,将每个索引全部解析的原因.

### 类型、函数和位置

`DwarfInfo.type_name()`沿着`DW_AT_type`引用追踪.`label`成员指向`DW_TAG_pointer_type`后者指向`DW_TAG_const_type`转向`char`基本类型,因此组合的名称是`const char *`,我知道.`type_size()`返回基本类型和结构体`DW_AT_byte_size`对于指针返回 8,对数组返回数量乘元素大小.`type_kind()`基本类型`DW_AT_encoding`简化为带符号性`int`或`float`简化为`pointer`它们是比较时使用的类型.

`DwarfInfo.functions()`读取六个`DW_TAG_subprogram`条目:`bump`从`0x0`延伸到`0x21`其他`DW_AT_low_pc`加上`DW_AT_high_pc`长度――它的基址为`DW_OP_reg6 RBP`参数`a`位置表达式为`91 78`其他:`DW_OP_fbreg`加上SLEB128 值 `0x78`现在,这是一个简单的地址.`0x4`将`%rdi`存入的槽`-0x8(%rbp)`调试信息和指令从两个角度描述一个槽.

## 两种布局

`compare_layouts()`遍历 DWARF 成员,并寻找相同偏移的推断字段.`no-evidence`字段大小不同为`size-mismatch`字段从未被解引用的指针成员为`pointer-unproven`类别不一致为`kind-mismatch`类型是浮点数,则指令采用整数算术.`unexpected`│ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │`DW_AT_byte_size`比较

三个构建的数值来自`python3 code/main.py`其他:

| 构建 | 通过第一个参数的访问数 | 字段 | 步长证据 | 匹配成员 | 大小 |
|---|---|---|---|---|---|
| `-O0` | 11 | 5 | `scale 32`、`call-site 32`、`call-site 64` | 5/5 | 32，匹配 |
| `-O1` | 9 | 5 | `loop-step 32` | 5/5 | 32，匹配 |
| `-O2` | 17 | 折叠后 5，折叠前 12 | `offset-delta 32`、`unrolled 32`、`loop-step 256`、`scale 32`、`loop-step 32` | 5/5 | 32，匹配 |

每个构建推断的空隙都是字节1至3和10至15的字节,恰恰等于DWARF布局的填充字节.`natural_alignment_ok()`我会记录这一点.

个别加入函数时,结果也随之变化.`bump`时,布局只有偏移4的一个字段,大小未知,下界为8个.`sum_balances`加入步长`tag`加入偏移 0 和 8;`projected`加入偏移 16 的浮点数;`label_length`加入偏移24的指针,并证明它是指针.`main`在`-O0`下加入调用点,在`-O1`和 `-O2`下则没有增加内容,因为编译器内联了全部调用.图中为每种构建按此顺序逐步展示.

三类信息仍无法获取.名称不在命令中,限定符.`const`也不在命令中.`label`只有从字符串循环中.`leaq 0x1(%rcx), %rcx`知道元素的分隔是1个字节,这既可能是`char`也可能是`unsigned char`或`_Bool`在`-O1`下,偏移 0 的字节符号性未知,因为`cmpb $0x6c, (%rdi)`分析在报告中`int8`现在使用`movsbl`符号扩展的`-O0`下报告`i8`第35课将这些事实记录为未知项.

## 语言的对象

`shapes.cpp`定义了`Shape`包含虚构函数,纯虚`area()`和虚`name()`另定义了派生自`Shape`增加两个`int`成员的`Rect`伊塔尼亚姆C++ABI 规则 clang 在 x86-64 Linux 上如何布局这些对象

### 修饰名称

标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签`_Z`──目标文件有19个这样的符号──`_ZNK4Rect4areaEv`读写:`_Z`随后`N`显示一个名字,`K`表示 const 成员函数,`4Rect`和 `4area`是长度前源码名称,`E`结束一个名字,`v`表示空参数列表――`llvm-cxxfilt`输出`Rect::area() const`,我知道.`_Z8describeRK5Shapei`是 `describe(Shape const&, int)`其他:`R`表示引用,`K`表示 const,`5Shape`是类,`i`表示`int`△第5.1.4节的特殊名称有:`_ZTV`表示虚函数表,`_ZTI`表示类型信息,`_ZTS`表示类型信息名称字符串──构建函数和解析构建函数使用 `C1`,我知道.`C2`,我知道.`D0`,我知道.`D1`,我知道.`D2`为了`_ZN4RectD0Ev`和 `_ZN4RectD2Ev`城市输出为`Rect::~Rect()`删除型解析函数与基对象解析函数共享源码名称。

`code/main.py`中中 `Demangler`覆盖本子集,以及第5.1.5.2节的内置类型代码和第5.1.10节的`S_`替换.测试会对所有19个名称运行它,并与捕获.`llvm-cxxfilt --no-strip-underscore`输出比较. 在macOS上,这个标志很重要,因为工具默认会删除一个前导下划线,然后无法识别.`Z8describe...`,我知道.

### 从重定位读取虚函数表

ABI 第2.5.2节按顺序列出虚函数表组成部分:虚调偏移、虚基类偏移、到顶层对象的偏移、类型信息指标,最后是虚函数指标──地址点是对象 vptr 保存的值,即第一个函数指标的地址.`Rect`没有虚基类,因此它的表包含到顶层对象的偏移类型信息和函数.

符号`_ZTV4Rect`为0x30字节,即六个8字节槽――目标文件中的每个字节都是零,内容位于`.rela.data.rel.ro._ZTV4Rect`其他:

```text
0000000000000008 R_X86_64_64              _ZTI4Rect
0000000000000010 R_X86_64_64              _ZN4RectD2Ev
0000000000000018 R_X86_64_64              _ZN4RectD0Ev
0000000000000020 R_X86_64_64              _ZNK4Rect4areaEv
0000000000000028 R_X86_64_64              _ZNK4Rect4nameEv
```

槽 0 保存到顶层对象的偏移,此处为 0,不需要重定位.`+16`从这里起,槽0是完整的对象分析函数,槽1是删除型分析函数,槽2是`area`槽3是`name`,我知道.`read_vtable()`读取符号大小、其范围内的重定位以及偏移 0 的零──`Shape`面形相同,槽2为`__cxa_pure_virtual`运行时函数,即纯虚调用会到达的运行时函数.

### 其他技术

第2.9.4节将`std::type_info`描述为 vptr 后一个指向修饰类型名称指针,并列出其派生类──`_ZTI4Rect`有三个重定位:`_ZTVN10__cxxabiv120__si_class_type_infoE+0x10`,我知道.`_ZTS4Rect`和 `_ZTI5Shape`第一个是`__si_class_type_info`虚函数表,这是ABI用于偏移零处的只有一个公有非虚基类型类型类型类型,`+0x10`则是该虚函数表的地址点.`4Rect`修饰类型名;在`type_info`上调用 `name()`返回的正是该字符串.`_ZTI5Shape`使用 `__class_type_info`没有基类指针.`read_typeinfo()`返回这三个事实.

### 虚调用

`-O0`下一个`describe`进行一次虚调用:

```text
       f: 48 8b 7d f8                  	movq	-0x8(%rbp), %rdi
      13: 48 8b 07                     	movq	(%rdi), %rax
      16: ff 50 10                     	callq	*0x10(%rax)
```

第一个`movq`载对象指针. 第二读取对象偏移 0 处的 8 字节,即 vptr,因为ABI 将把它放在虚函数类型最前面.`callq`经由VPtr 后`0x10`处的指针调用,而`0x10 / 8`应应槽 2`find_virtual_calls()`匹配该模式并报告两个候选人:来自`_ZTV4Rect`的`Rect::area() const`及来自`_ZTV5Shape`的`__cxa_pure_virtual`具体执行取决于对象,这是调用间接进行的原因.

两类中,有两类的槽.`area`的`DW_TAG_subprogram`条目均带有`DW_AT_vtable_elem_location (DW_OP_constu 0x2)`没有任何`name`带有槽 3,解析构件带有槽 0──`Rect`是16节的`DW_TAG_structure_type`包含偏移向`Shape`的`DW_TAG_inheritance`条目,以及偏移 8 的成员`w`和偏移 12 的`h`,我知道.`Shape`为 8 字节,包含一个人工成员`_vptr$Shape`△重定位表和调试条例 两种独立推都出了`area`槽位为2个.

在`-O1`下,目标文件完全没有虚函数表.`main`将`Rect`构建为局部对象,因此编译器在编译期解析并内联了`r.name()`和 `describe(r, 2)`没有任何地方取表地址,所以表不会产生.`describe`仍包含`movq (%rdi), %rax`和 `callq *0x10(%rax)`因为它的参数可以是任意的.`Shape`△虚函数表缺失只是关于某个目标文件的事实,测试`test_the_optimised_object_keeps_the_call_pattern_but_drops_the_vtables`检查这两方面.

微软的ABI在上述每个细节上都不同.`?`开头并编码调用约定,因此作为C++`__cdecl`编译的`void test(void)`是 `?test@@ZAXXZ`△RTTI 定位器以`_RTTICompleteObjectLocator`形式位于`vfptr[-1]`符号`??_7`表示可选,`??_R4`表示定位器──微软自己的文档说明编译器供应商之间没有C++ 命名标准──本课的样本仅采用Itanum──

## 工具如何呈现恢复的类型

输出线,均在机器上生成和捕获.`code/fixtures/tools/`〔未安装工具的行〕只描述其文档,并明确标注──

| 工具 | 版本、许可证 | 类型存放位置 | 在本课样例上的结果 |
|---|---|---|---|
| Ghidra | 12.1.4，2026-09-21，Apache-2.0 | Data Type Manager 包含内置、用户定义和派生类型；`.gdt` 存档；程序使用的类型会复制到程序中 | 有 DWARF：`/DWARF/account.c/account size=32 align=8` 和 `a->balance = by + a->balance;`。无 DWARF：`*(int *)(param_1 + 4)`，以及 `long param_1`、`tag(char *param_1)` 和 `*(char **)(param_1 + 0x18)` |
| IDA Pro | 9.4，2026-07-13，商业软件；IDA Free 限非商业使用，云反编译器仅支持 x86 | Local Types 窗口、`.til` 类型库，将 DWARF 和 PDB 导入 `dwarf` 或 `pdb` 文件夹 | 未安装。仅依据文档 |
| Binary Ninja | 6.0，2026-09-03，商业软件，提供 Free 版 | 类型编辑、头文件导入导出、类型存档、DWARF 和 PDB 调试信息、类型库、平台类型 | 未安装。仅依据文档 |
| radare2 | 6.2.4，2026-10-05，LGPLv3 | `ts`、`tsc`、`afvd` | 对设置 `bin.dbginfo=true` 的可重定位目标文件，`ts` 和 `tsc account` 未输出内容；`pdf` 显示 `mov dword [rax + 4], ecx`，附有来自 DWARF 的源码行注释 |
| rizin | 0.9.1，2026-06-29，核心采用 LGPL | `ts`、`tsc`、`afvd` | `tsc account` 从 DWARF 打印 `struct account { char kind; int balance; short code; double rate; const char *label; };`；不带 `-g` 的构建只列出工具自带的头文件类型 |
| lldb | lldb-1703.0.236.21 | `image lookup -t` | 从 ELF 目标文件得到 `byte-size = 32` 及完整 `compiler_type` 文本 |
| gdb | 此处未安装 | `ptype /o` 打印“结构体字段的偏移和大小”，并标记空隙 | 仅依据文档 |
| pyelftools | 0.33，公有领域 | 面向 `.debug_info` 的 Python API | 一个 43 行脚本打印相同五个成员和 `unit version 5` |
| llvm-dwarfdump | Apple LLVM 17.0.0 | `--debug-info`、`--debug-abbrev`、`--debug-str-offsets` | 每个读取器测试的对照基准 |

格格拉 不带 DWARF 的输出显示了相同的两条规则.`tag`的参数分配`char *`函数通过它比较一个字节;给`0x18`处的字段分配`char **`因为`label_length`解引用加载的值并比较字节. 这正是本课程分析中使用的两条规则:从指令确定宽度,从解引用确定指针.

手工构建表是另一半.Ghidra的数据类型管理器,IDA的本地类型,二进制忍者类型存档以及鱼类型.`td`根据恢复的布局,你可以检查编译器的重新编染.

rea 6.5.0 配合其Ghidra提供商,将反编译文本作为记录返回.`python3 code/main.py infer`现在我们可以得到这些证据.

## 类型推断研究

这里的分析是类型推断系统中产生约束的另一半,并且仅限于一个参数可达的结构.

- 李·阿弗格里诺斯·布鲁姆利,NDSS 2011) 将类型重建表述用于二进制 IR 上生成和求解束,衡量保守性和精确性,并对 87 个核心程序进行商业反编译器比较.
- 复式型 (Noonan、Loginov、Cok,PLDI 2016) 增加子类型、多态和递归类型,并报告指标`const`重建的回报率为98%──GrammaTech名下有其开源实现──
- 预测概率最高类型的类型.
- 通过使用学习模型对反编译输出进行后处理,ReSym 报告完整结构结构布局的精确率为72.9%──
- 通过流不敏感符号执行及槽上的并查集恢复嵌套结构体──

上结构体是本课程分析的第一跳情况.`-O1`下,`main`将`rows`保持存在,内联代码读取`0x24(%rsp)`,我知道.`0x40(%rsp)`,我知道.`0x48(%rsp)`,我知道.`0x30(%rsp)`和 `0x38(%rsp)`△这些偏移对32 取模后分别是4、0、8、16、24:同一个结构体,但没有参数可用于初始种子.

## 亲手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/41-recovering-data-and-types
python3 code/main.py
```

输出是一个包含五部分的JSON报告.`dwarf`保存`-O0`目标文件的单元头,结构体和函数;`oracles`保存 psABI 规则布局`ctypes`布局、DWARF 布局、原生运行结果和 `agree`标志;`builds`保存三个目标文件的访问,推断布局和比较结果;`cxx`保存解修饰名称、两张虚函数表、两类信息记录、虚调用和DWARF槽位;`tools`列出捕获的工具输出

预期结构:

```json
{
  "dwarf": {"unit": {"unitLength": 489, "version": 5, "unitType": "DW_UT_compile", "addressSize": 8, "abbrevOffset": 0}, "...": "..."},
  "oracles": {"agree": true, "psabiRules": {"size": 32, "align": 8, "...": "..."}, "...": "..."},
  "builds": {
    "O0": {"layout": {"stride": 32, "size": 32, "gaps": [1, 2, 3, 10, 11, 12, 13, 14, 15], "...": "..."}, "comparison": {"matches": 5, "members": 5, "...": "..."}},
    "O1": {"...": "..."},
    "O2": {"...": "..."}
  },
  "cxx": {"virtualCalls": [{"slot": 2, "candidates": {"Shape": "__cxa_pure_virtual", "Rect": "_ZNK4Rect4areaEv"}, "...": "..."}], "...": "..."}
}
```

按以下顺序阅读 `code/main.py`其他:

1. `ElfObject`读取节、符号和重定位,`relocated()`调试节应用`S + A`,我知道.
2. `parse_abbreviations()`和 `DwarfInfo._parse_unit()`读取头,缩写表和条目,然后通过两张表解析`strx`和 `addrx`,我知道.
3. `DwarfInfo.struct_layouts()`和 `functions()`借助`type_name()`,我知道.`type_size()`和 `type_kind()`将条目转换为 `StructLayout`和 `FunctionInfo`记录.
4. `parse_listing()`,我知道.`parse_memory()`和 `access_width()`读取`llvm-objdump`文本:
5. `trace_function()`是抽象状态机,`fold_unrolled()`和 `infer_layout()`将访问转换为布局.
6. `compare_layouts()`发达状态行,`sysv_layout()`和 `ctypes_layout()`其他两个对照基准.
7. `Demangler`,我知道.`read_vtable()`,我知道.`read_typeinfo()`和 `find_virtual_calls()`负责C++ 目标文件──

还有四个命令.`python3 code/main.py dwarf FILE.o`打印任意 DWARF 5 可重定位目标文件的结构体和函数──`python3 code/main.py infer LISTING.txt [FILE.o]`对于清单运行分析,如果提供目标文件,则与其DWARF比较.`python3 code/main.py demangle NAME...`和 `python3 code/main.py vtable FILE.o`负责C++部分.

## 实际使用

对于你自己构建的新目标文件:

1. 捕获该目标文件`llvm-objdump -d -r`输出,并与目标文件一起保存.
2. 对清单运行`python3 code/main.py infer`△先读见证函数行:它列出第一个参数被用来作为内存基址的函数. 如果缺少某个函数,说明其参数未到达内存操作数,或通过分析未追踪的路径.
3. 结合访问次数阅读每个段子――一次访问就是一个见证――只有单条见证的段子应记录为推断结果――
4. 阅读步长证据――`call-site`或`scale`条目是强证据;没有其他类别支持单条 `loop-step`由于开放循环报告是多个元素的步幅.`unrolled`应手工检查折叠
5. 没有`-g`构建,运行比较并阅读每个非 `match`走了`no-evidence`行指出没有函数触及的成员,`unexpected`行指出分析遍无法定位访问.
6. 作为结构体输入工具类型管理器,并记录哪些字段,名称和类别属于猜测.

随时保留三个对照基准.`ctypes`和 DWARF对你编写的布局的不同意见,你就遇到了紧布局结构体,位字段,或采用不同规则的目标平台.

## 交互实验

### 实验 A:解码成员条目

从`code`目录启动Python:

```bash
cd phases/13-tools-and-protocols/41-recovering-data-and-types/code
python3 -q
```

运行:

```python
from main import *
elf = load_object("account-x86_64-O0-g.o")
dwarf = DwarfInfo(elf)
dwarf.header()
elf.section(".debug_info").data[0x1a3:0x1ac].hex(" ")
dwarf.dies[0x1a3].attributes
dwarf.type_name(dwarf.type_of(dwarf.dies[0x1a3]))
```

查看字典前,先用缩写13 在纸上解码这九字节.`elf.section(".debug_str_offsets").data[8:16].hex()`和重定位后节`elf.relocated(".debug_str_offsets")[8:16].hex()`并解释差异.

### 实验B:跟踪一个函数

```python
listing = load_listing("account-x86_64-O0-g.objdump.txt")
trace = trace_function("label_length", listing["label_length"])
[(hex(a.address), a.root, a.offset, a.width, a.kind) for a in trace.accesses]
trace.pointer_uses
trace_function("sum_balances", listing["sum_balances"]).loops
```

运行前先写下,哪次访问证明偏移24是指针.然后对.`-O1`清单运行同代码,并`trace.increments`中找到 `leaq 0x1(%rcx), %rcx`,我知道.

### 实验C:折叠向量化循环

```python
o2 = load_listing("account-x86_64-O2-g.objdump.txt")
trace = trace_function("sum_balances", o2["sum_balances"])
sorted({a.offset for a in trace.accesses})
folded, evidence = fold_unrolled(trace, trace.accesses)
sorted({a.offset for a in folded}), [(e.kind, e.value, e.text) for e in evidence]
```

接着运行`analyze_build("O2", fold=False)["comparison"]`统计`unexpected`行数――修改折叠规则,要求循环步长必须恰好为`k * d`且`k`确认只有一次访问,步长为32次`-O1`循环保持不变.

### 实验 D:虚函数表和名称

```python
shapes = load_object("shapes-x86_64-O0-g.o")
read_vtable(shapes, "_ZTV4Rect")
read_typeinfo(shapes, "_ZTI4Rect")
demangle("_ZNK4Rect4areaEv"), demangle("_Z8describeRK5Shapei")
find_virtual_calls(load_listing("shapes-x86_64-O0-g.objdump.txt"), [read_vtable(shapes, "_ZTV5Shape"), read_vtable(shapes, "_ZTV4Rect")])
```

在纸上根据`callq *0x10(%rax)`计算槽位,然后使用`DwarfInfo(shapes).struct("Rect").virtual_methods`确认――接着加载`shapes-x86_64-O1-g.o`尝试调整它`read_vtable`阅读`ElfError`解释为什么没有符号.

## 实践实验

恢复`-O1`下一个`main`中的上结构体――

要求:

- 扩展`trace_function()`让槽区域可以作为根.`movaps`存储为种子,这些存储从`.data.rel.ro`填充`0x0(%rsp)`至 `0x5f(%rsp)`其他`rows`九十六节初始化内容.
- 将内联访问`0x24(%rsp)`,我知道.`0x40(%rsp)`,我知道.`0x48(%rsp)`,我知道.`0x30(%rsp)`和 `0x38(%rsp)`归属该根,并报告其偏向对候选人长期取模的结果.
- 从`0x120`至 `0x12c`循环推导步长 32:其中`%r14`从 4 开始,以`0x20`递增直至`0x64`并说明循环边界`0x64`是三个元素加上字段偏移.
- 结果与DWARF布局相比,达到五个匹配,并记录哪些类型仍未证明.
- 添加一个测试,确保将根错误归纳于参数时测试失败.

成功标准是:对`-O1`清单运行 `python3 code/main.py infer`时,将 `main`列为具有根源的证人函数,且仅凭`main`在比较中显示五个匹配.

## 本课产物

本课包含`outputs/skill-recovering-data-and-types.md`△使用它将清单和可选调试构建转换为:逐段带证据的结构结构布局,注明来源的步长,与DWARF的比较,以及未知信息列表. 它要求提供访问表,步长证据,折叠检查,在存在时DWARF对照基准,并声明哪些名称和限制符无法通过任何指令提供.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/41-recovering-data-and-types
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明:

- 单元头、14个缩写和5个成员偏移与`llvm-dwarfdump`一致
- 名称经由重定位后的 `.debug_str_offsets`获得,且单元的`str_offsets_base`和 `addr_base`平均为8
- 六个函数携带转储显示的地址范围`DW_OP_reg6 RBP`和 `DW_OP_fbreg`位置,且其起始地址等于清单中的函数起点
- 缺少`.debug_info`目标文件将抛出异常,LEB128 解码器将 `0x78`处理为 -8
- `pyelftools`和 `lldb`打印机和读取机相同的布局
-  规则`ctypes`∆WARF 和原生运行均给出偏移`0, 4, 8, 16, 24`和大小32重排后的结构体为24字节
- 清单解析器在`bump`中读取 13条指令,将 `R_X86_64_PLT32 bump-0x4`加入到`0x194`处的调用,并找到`0x72`处的后向跳转
- 存储操作数,宽度,类别和符号性由AT&T 文本及助记符解码
- `-O0`下一个`bump`从槽读回指针,并偏移4处进行三次访问
- 步长在`-O0`下一个来自`shlq $0x5`在`-O1`下一个来自`addq $0x20, %rdx`在`-O2`下面来自按步幅 256 折叠的八次加载
- `label_length`通过解引用证明偏移24 是指针
- `main`在`-O0`下以偏移 0`0x20`和 `0x40`传递同样物体,在`-O1`下只调用`printf`
- 每个构建均匹配五个成员,大小为32个,空隙与DWARF一致填充
- 没有折叠时,`-O2`构建报告7个字段位于字节32后,且没有大小
- 解修饰器复现全部19个`llvm-cxxfilt`字符串
- 两张虚函数表,两类信息记录及`0x16`处的虚调用均解析到槽2,DWARF 也一致
- `-O1`C++ 目标文件保留调用模式,但没有虚函数表
- 捕获结果在有DWARF时显示结构体,无DWARF时显示原始偏移
- 互联图嵌入式数据与分析产生的数据一致

## 生产环境失效模式

| 失效情况 | 能力不足的工具报告什么 | 分析必须证明什么 |
|---|---|---|
| 展开循环 | 八个间隔 32 字节的字段，以及一个 232 字节结构体 | 循环步幅 256 等于偏移差 32 的 8 倍，因此只有偏移 4 的一个字段 |
| 从单个增量读取步长 | 从 `addq $0x100` 得到 `sizeof` 为 256 | 所有步长来源的最大公约数，包括标量尾循环的 `addq $0x20` |
| 将 8 字节字段称为指针 | 偏移 24 处是 `void *` | 后续访问将加载的值作为基址，否则类别仍应为 `int64` |
| 将指针称为整数 | 偏移 24 处是 `long` | `0xfb` 处的解引用，应记录为指针证据 |
| 窄比较 | 带符号性的 `char` | `cmpb` 不携带符号性，只有 `movsbl` 或 `movzbl` 才携带 |
| 假定五个函数共享类型 | 没有别名证据却合并为一个结构体 | `main` 中传递同一栈帧对象的调用点，或分析人员的明确断言 |
| 按索引从 `.debug_str` 读字符串 | 从可重定位目标文件读出乱码名称 | `str_offsets_base` 加上重定位后的 `.debug_str_offsets` 条目 |
| 将地址直接作为数值读取 | 每个函数的 `low_pc` 都为 0 | 通过重定位后的 `.debug_addr` 表解析 `addrx` |
| DWARF 4 目标文件 | 读取器错误解析头部 | 检查第二个头字段中的版本；第 4 版没有 `unit_type` 字节 |
| 虚函数表缺失 | “这个类没有虚函数” | `-O1` 目标文件内联了全部调用；`-O0` 目标文件包含表及其重定位 |
| 从错误基址读取虚函数槽位 | 槽号偏差为二 | 地址点在符号之后 16 字节，位于到顶层对象的偏移和类型信息之后 |
| 修饰名称被剥离前缀 | `Z8describeRK5Shapei` 保持原样 | 在 macOS 使用 `--no-strip-underscore`，或使用检查 `_Z` 的解修饰器 |
| 根据单个工具的猜测定义结构体 | 将 `char *param_1` 当作字段类型 | 将宽度和解引用写为证据，并将名称标为猜测 |

## 操作准则

从访问恢复字段,从循环恢复步长,并为每项附上指令. 相信超出步长的偏移之前,先折叠展开循环. 通过缩写和重定位后表读 DWARF,绝不要按索引直接读字符串节.

## 延伸阅读

- [System V Application Binary Interface, AMD64 Architecture Processor Supplement, section 3.1.2: Data Representation](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Procedure Call Standard for the Arm 64-bit Architecture (AAPCS64), section 5.10: Composite Types](https://github.com/ARM-software/abi-aa/blob/main/aapcs64/aapcs64.rst)
- [Writing ARM64 code for Apple platforms](https://developer.apple.com/documentation/xcode/writing-arm64-code-for-apple-platforms)
- [Intel 64 and IA-32 Architectures Software Developer's Manual, Volume 1, section 3.7.5: Specifying an Offset](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [DWARF Debugging Information Format Version 5, sections 2.1, 5.7.6, 7.5.1.1, 7.5.3, 7.5.6](https://dwarfstd.org/doc/DWARF5.pdf)
- [Itanium C++ ABI, sections 2.5 (Virtual Table Layout), 2.9 (Run-Time Type Information), 5.1 (External Names)](https://itanium-cxx-abi.github.io/cxx-abi/abi.html)
- [Microsoft Learn: Decorated names](https://learn.microsoft.com/en-us/cpp/build/reference/decorated-names?view=msvc-170)其他[Name Decoration](https://learn.microsoft.com/en-us/cpp/error-messages/tool-errors/name-decoration?view=msvc-170)
- [llvm-dwarfdump command guide](https://llvm.org/docs/CommandGuide/llvm-dwarfdump.html)其他[llvm-cxxfilt command guide](https://llvm.org/docs/CommandGuide/llvm-cxxfilt.html)
- [Python ctypes: Structure layout, sizeof, alignment](https://docs.python.org/3/library/ctypes.html)
- [Ghidra Data Type Manager](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/Base/src/main/help/help/topics/DataTypeManagerPlugin/data_type_manager_description.htm)现在[Decompiler Concepts](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/Decompiler/src/main/help/help/topics/DecompilePlugin/DecompilerConcepts.html)现在[Decompiler Options](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/Decompiler/src/main/help/help/topics/DecompilePlugin/DecompilerOptions.html)其他[Ghidra 12.1.4 release](https://github.com/NationalSecurityAgency/ghidra/releases/tag/Ghidra_12.1.4_build)
- [IDA 9.1 user guide: Types](https://docs.hex-rays.com/9.1/user-guide/types)现在[IDA 9.4 release post](https://hex-rays.com/blog/ida-9.4-release-a-new-dyld-shared-cache-swift-analysis-new-teams-add-on-and-more-)其他[IDA Free](https://hex-rays.com/ida-free)
- [Binary Ninja user guide: Types](https://docs.binary.ninja/guide/types/)其他[Binary Ninja 6.0 Krypton](https://binary.ninja/2026/09/03/binary-ninja-6.0-krypton.html)
- [radare2 6.2.4 release](https://github.com/radareorg/radare2/releases/tag/6.2.4)其他[rizin v0.9.1 release](https://github.com/rizinorg/rizin/releases/tag/v0.9.1)
- [GDB manual: Examining the Symbol Table, ptype /o](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Symbols.html)
- [pyelftools on PyPI](https://pypi.org/project/pyelftools/)
- [Lee, Avgerinos, Brumley, "TIE: Principled Reverse Engineering of Types in Binary Programs" (NDSS 2011)](https://www.ndss-symposium.org/ndss2011/tie-principled-reverse-engineering-of-types-in-binary-programs/)
- [Noonan, Loginov, Cok, "Polymorphic Type Inference for Machine Code" (PLDI 2016)](https://arxiv.org/abs/1603.05495)其他[the retypd repository](https://github.com/GrammaTech/retypd)
- [Zhang et al., "OSPREY: Recovery of Variable and Data Structure via Probabilistic Analysis for Stripped Binary" (IEEE S&P 2021)](https://ieeexplore.ieee.org/document/9519451/)
- [Chen et al., "Augmenting Decompiler Output with Learned Variable Names and Types" (USENIX Security 2022)](https://www.usenix.org/conference/usenixsecurity22/presentation/chen-qibin)
- [Xie et al., "ReSym: Harnessing LLMs to Recover Variable and Data Structure Symbols from Stripped Binaries" (CCS 2024)](https://dl.acm.org/doi/10.1145/3658644.3670340)
- [Chen et al., "RecStruct" (USENIX Security 2026)](https://www.usenix.org/conference/usenixsecurity26/presentation/chen-yuxin)
