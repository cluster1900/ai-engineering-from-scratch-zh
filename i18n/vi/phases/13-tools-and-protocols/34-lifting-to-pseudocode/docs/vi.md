# 提升为伪代码: từ không xây dựng IR、SSA và cấu trúc

> Các đầu ra của một nhà biên dịch là một tập hợp ẩn trong các phát biểu của quá trình trình trình trình dẫn. Sau quá trình xây dựng và dẫn xuất, mỗi dòng đầu ra đều trở thành đối tượng có thể kiểm chứng.

**Type:** Build
**Languages:** Python, C
**Prerequisites:** Phase 13 · 32（从零理解 ELF）、Phase 13 · 33（反汇编与控制流）
**Time:** ~150 分钟

## Học mục tiêu

- Để giải mã được x86-64 chỉ thị nâng cấp thành IR nhỏ ((trung biểu), biểu hiện hiển nhiên biểu tượng, tải, lưu trữ, phân đoạn, điều chỉnh và trả lại.
- Để chuyển đổi vị trí hầm thành biến động địa phương, sẽ chuyển đổi hệ thống V 参数寄存器 thành hình参――
- Trong biên giới kiểm soát đặt phi hàm, xây dựng SSA tối thiểu (static single assignment form), sau đó thực hiện thay thế, biến đổi và xóa mã chết.
- Sử dụng các nút kiểm soát và quay lại, khôi phục từ kiểm soát dòng`if`、带 `else`của `if``while`和 `do while`
- Sẽ tăng lên`0x66666667`Giải thích cho chia bằng 10,并 chứng minh mối quan hệ này.
- 逐行阅读 Ghidra 伪代码 của cùng nhóm hàm, chỉ ra mỗi phần khác biệt phía sau của chỉ thị hoặc đoán.

## 问题所在

Bạn đến với thực sự xin `ledger-x86_64-O1.o`Trung `percent_change`Ghidra 12.1.4  khoảng 10 giây sau đã trả lời:

```c
undefined1  [16] percent_change(int param_1,int param_2,ulong param_3)

{
  long lVar1;
  undefined1 auVar2 [16];
  undefined1 auVar3 [16];
  
  if (param_1 != 0) {
    lVar1 = (long)((param_2 - param_1) * 100);
    auVar3._0_8_ = lVar1 / (long)param_1 & 0xffffffff;
    auVar3._8_8_ = lVar1 % (long)param_1 & 0xffffffff;
    return auVar3;
  }
  auVar2._8_8_ = 0;
  auVar2._0_8_ = param_3;
  return auVar2 << 0x40;
}
```

源码 chỉ có 4 dòng, nhận 2 `int`值并返回一个 `int`Ghidra đã báo cáo một giá trị trả lại 16 chữ cái, cũng như các tham số thứ ba không tồn tại trong mã nguồn. Ghidra đã báo cáo một số vấn đề về giải mã của mỗi chữ cái.

sẽ thực hiện bài viết này như là`procedure_pseudo_code`Kết quả trả lại,并给记录附上一条限制说明:伪代码 là Ghidra phản biên dịch viên của xuất, không phải là nguồn gốc gốc, cũng không giống với Hopper 输出文本等价──`compare_functions`工具按文本行对伪代码做差异比较──它 viết bản ghi kích thước của nó 汇编是不透明的提供方文,并说明无法重定位归结──area 无法看透这些文本,只读取文本的代理也一样──

DX-Ball của rea 记录 đã chứng minh giá.`FUN_00406400(void)`调用 `__ftol()`◊ chỉ thị hình ảnh nhưng cho thấy một  nhập và một x87 biểu hiện.

Bài viết này sẽ được viết bởi các nhà nghiên cứu và các nhà nghiên cứu.`percent_change``grade`和 `total`伪代码与Ghidra的输出并排对照,解释每处差异──测试会使用 clang 编译你的输出,并输入网格上运行它,与源码进行对比──

```figure
lifting-stages-percent-change
```

## 测试样例与参考判定据

`code/fixtures/ledger.c`Đây là các thí nghiệm chung trong phần này:

```c
int percent_change(int before, int after) {
    if (before == 0) return 0;
    return (after - before) * 100 / before;
}

int grade(int score) {
    switch (score / 10) {
    case 10:
    case 9: return 4;
    case 8: return 3;
    case 7: return 2;
    case 6: return 1;
    default: return 0;
    }
}

int total(const int *values, int count) {
    int sum = 0;
    for (int i = 0; i < count; i++) sum += values[i];
    return sum;
}
```

文件和目标文件中还包含 `grade_label`, bài thuyết trình cũng sẽ nâng cao nó.

目标文件使用 `clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c ledger.c`构建──旁边还存放用于槽位章节的 `-O0`目标文件――`code/fixtures/README.md`列出 hai lệnh xây dựng  SHA-256 của mỗi tập tin mục tiêu, cũng như các lệnh thực tế của các ví dụ thử nghiệm Ghidra    trên chuỗi công cụ phiên bản cố định, kết quả xây dựng có thể từng chữ phần tái hiện

解码器的参考判定是`llvm-objdump -d -r`◊ Nó đã gửi cho 2 mục tiêu văn bản được tạo ra.`ledger-x86_64-O1.objdump.txt`和 `ledger-x86_64-O0.objdump.txt`Một test sẽ phân tích các tài liệu này,并逐条比较 chỉ thị địa chỉ,字节 và AT&T 文本.`-O1`Tất cả 56 điều chỉ thị,`-O0`Nếu cố định được cài đặt theo đường`llvm-objdump`, 2nd test cũng sẽ thực hiện nó, làm một lần so sánh lại.

参考工具打印的 `percent_change`Như sau:

```text
0000000000000000 <percent_change>:
       0: 85 ff                        	testl	%edi, %edi
       2: 74 09                        	je	0xd <percent_change+0xd>
       4: 29 fe                        	subl	%edi, %esi
       6: 6b c6 64                     	imull	$0x64, %esi, %eax
       9: 99                           	cltd
       a: f7 ff                        	idivl	%edi
       c: c3                           	retq
       d: 31 c0                        	xorl	%eax, %eax
       f: c3                           	retq
```

## 阶段 1: từ字节 đến lệnh

Chương 33  Khóa học xây dựng hiểu mã máy. Bài học này giữ một bản nhỏ, để mã có thể hoạt động độc lập.`ledger.c`Trong `-O0`和 `-O1`Các mã hoạt động khác gặp phải, nó sẽ bị bỏ ra`DecodeError`,附带地址和操作码字节──

解码器 theo quy định của Intel SDM 第 2 卷 第 2.1 节 节 节 节 节 节 节 序: trước tiên là , sau đó là操作码、ModR/M、SIB、位移量, cuối cùng là số ngay lập tức.`0x40`Đến`0x4F`之间一个字节,必须紧邻操作码之前――REX.W 选择 64 位操作数,REX.R 扩展 `reg`字段,REX.X 扩展 SIB 索引,REX.B 扩展 `r/m` SIB 基址──第 2.1.3 节 đã định nghĩa ba đoạn của ModR/M`mod``reg``r/m`, và ba phần của SIB`scale``index``base` 在 64 位模式下,`mod = 00`Với`r/m = 101`组合表示相对下一条指令的32位位移量 (→ 2.2.1.6 节)

| 操作码字节 | 形式 | 测试样例中的示例 |
|---|---|---|
| `01 29 31 39 85 89` | `op Ev, Gv` | `29 fe` `subl %edi, %esi` |
| `03 2b 3b 8b 8d` | `op Gv, Ev` | `03 04 97` `addl (%rdi,%rdx,4), %eax` |
| 带 REX.W 的 `63` | `movsxd Gv, Ev` | `48 63 c7` `movslq %edi, %rax` |
| `69` 和 `6b` | `imul Gv, Ev, imm` | `48 69 c0 67 66 66 66` |
| `83 /0 /5 /7` | `add sub cmp Ev, imm8` | `83 c1 fa` `addl $-0x6, %ecx` |
| `c1 /5 /7` | `shr sar Ev, imm8` | `48 c1 f9 22` `sarq $0x22, %rcx` |
| `f7 /7` | `idiv Ev` | `f7 ff` `idivl %edi` |
| `ff /0 /4` | `inc Ev`, `jmp Ev` | `48 ff c2` `incq %rdx` |
| `70` 到 `7f`、`eb`、`e8` | `jcc rel8`、`jmp rel8`、`call rel32` | `74 09` `je 0xd` |
| `99`, `c3`, `90`, `0f 1f` | `cltd`, `retq`, `nop` | `66 0f 1f 44 00 00` `nopw (%rax,%rax)` |

`grade+0x23`处的 `leaq (%rip), %rcx`长七字节,位移量为零──目标文件在位移字段的偏移 `0x36`处携带一个重定位项 `R_X86_64_PC32.rodata+0x10`❖ nâng máy sẽ trong giai đoạn 3  phân tích nó.

## 阶段 2: cơ bản khối và kiểm soát

基本块 là một chuỗi语句, trên chỉ có một lối vào, dưới chỉ có một lối ra.`build_blocks()`收集块首地址: hàm nhập, trong hàm có mỗi bước nhảy mục tiêu, cũng như địa chỉ sau mỗi bước nhảy hoặc quay lại chỉ thị.`jmp`Có một người.`ret`Không có sau, theo lệnh chung kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết

`-O1`下的 `total`Có 5 phần cơ bản:

| 基本块 | 指令 | 后继 |
|---|---|---|
| `0x40` | `testl %esi, %esi`，然后是 `jle 0x5c` | `0x5c`、`0x44` |
| `0x44` | `movl %esi, %ecx`, `xorl %edx, %edx`, `xorl %eax, %eax`, `nopw` | `0x50` |
| `0x50` | `addl (%rdi,%rdx,4), %eax`, `incq %rdx`, `cmpq %rdx, %rcx`, `jne 0x50` | `0x50`, `0x5b` |
| `0x5b` | `retq` | 出口 |
| `0x5c` | `xorl %eax, %eax`，然后是 `retq` | 出口 |

`immediate_dominators()`实现了Cooper,Harvey, Kennedy,2001 代算法. 代算法. 代算法. 代算法. 代算法. 代算法. 代算法. 代算法. 代算法. 代算法. 代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.代算法.`total`, nó được `0x44`支配 `0x50`, cũng được `0x50`Thông qua việc kiểm soát bản thân, giai đoạn 8 chính là một vòng lặp được phát hiện ra.

Cùng một hàm cũng sẽ được chạy lại hai lần.`dominance_frontiers()`Sử dụng nó xây dựng SSA.`post_dominators()`则在添加虚拟出口节点的反向图上运行它, tìm kiếm汇合点──

## 阶段 3:提升为小型 IR

IR 包含六种语句:`Assign``Store``Branch``Jump``IndirectJump`和 `Return`△ biểu hiện bao gồm thường lượng, biến lượng,带位宽的二元运算,转换`sext``zext``trunc`(v) và tải. Có 5 hình thức khác chỉ tồn tại sau đó được đơn giản hóa và loại bỏ:`Flags``Cond``Concat``SignFill`和 `Symbolic`

寄存器 được biểu thị cho số thay đổi của các gia đình寄存器 có 64 vị trí khác.`%eax`Ừ `rax`Một lần ở 32 `Assign`,读取 `%eax`则是以 32 位宽读取 `rax` Trong chế độ 64 bit, 32 bit viết vào sẽ mở rộng đến toàn bộ bộ bộ lưu trữ, do đó sau đó thực hiện 64 bit đọc là một lần`zext` nâng máy không biết đến vị trí đọc được định nghĩa là gì, vì vậy trước ghi lại vị trí đọc được rộng, để SSA vào giai đoạn 5 插入转换。

| 指令 | IR 语句 |
|---|---|
| `subl %edi, %esi` | `flags = cmp(esi, edi)`，然后是 `esi = esi - edi` |
| `testl %edi, %edi` | `flags = test(edi, edi)` |
| `je 0xd` | `if je(flags) goto 0xd else goto 0x4` |
| `xorl %eax, %eax` | `eax = 0` |
| `cltd` | `edx = signfill(eax)` |
| `idivl %edi` | `dividend = edx:eax`, `eax = dividend / edi`, `edx = dividend % edi` |
| `movslq %edi, %rax` | `rax = sext64(edi)` |
| `sarq $0x22, %rcx` | `rcx = rcx >>s 34` |
| `shrq $0x3f, %rax` | `rax = rax >>u 63` |
| `addl (%rdi,%rdx,4), %eax` | `flags = add(eax, load32(rdi + rdx * 4))`，然后是 `eax = eax + load32(rdi + rdx * 4)` |
| `leaq (%rip), %rcx` 及其重定位项 | `rcx = &.rodata+0x14` |
| `pushq %rbp`、`movq %rsp, %rbp`、`subq $0x10, %rsp`、`popq %rbp` | 不生成语句，仅用于栈帧管理 |
| `retq` | `return rax` |

### 将标志表示为变量

Mỗi điều đặt điều kiện của lệnh sẽ được viết tên gọi`flags`Ưu điểm của sự thay đổi, từng điều kiện sẽ thay đổi.`cmp a, b`写入 `cmp(a, b)`- Tôi không biết.`test a, b`写入 `test(a, b)`- Tôi không biết.`sub`则作为副作用写入同样 `cmp`hình dạng:`jcc`变为 `Branch(Cond(cc, flags), target, fallthrough)`◊ Khi điều kiện và biểu tượng trong giai đoạn 6 tương ứng, điều kiện quyết định so sánh vận hành:

| 条件码 | 在 `cmp(a, b)` 之后 | 在 `test(a, a)` 之后 |
|---|---|---|
| `je` | `a == b` | `a == 0` |
| `jne` | `a != b` | `a != 0` |
| `jl`、`jge`、`jle`、`jg` | 有符号 `<`、`>=`、`<=`、`>` | 与 0 进行有符号比较 |
| `jb`、`jae`、`jbe`、`ja` | 无符号 `<`、`>=`、`<=`、`>` | 与 0 进行无符号比较 |

`xorl %eax, %eax`直接提升为 `eax = 0`◊ Nó đặt ra dấu hiệu viết thành `add`风格的标志,测试样例中没有跳转读取这些标志──`xor`Đây là một mô hình thông thường.`grade`Trong đó rất quan trọng, còn Ghidra không giữ nó.

### CLtd và IDV

`cltd`用 `%eax` 符号位填满 `%edx``idivl %edi`将 64 位寄存器对 `%edx:%eax`Ngoài ra`%edi`,商写入 `%eax`,余数写入 `%edx`❖提升器 trước tiên sẽ đặt tên寄存器 này cho viết vào`dividend`                                                                                                                                                                                                                                                              `%eax`Trong SSA, nửa phần cao hiện ra là nửa phần thấp.`signfill`化简器将这个寄存器对化简为低半,除法也变成32位的 `/`

### -O0 dưới 槽位

Trong `-O0`Clang sẽ giữ lại mỗi biến động trong đó.`percent_change`- Đưa đi.`%edi`存到 `-0x8(%rbp)`,把 `%esi`存到 `-0xc(%rbp)`Sau đó mỗi lần sử dụng đều đọc lại. Máy nâng sẽ tìm kiếm sau.`movq %rsp, %rbp`của `pushq %rbp` 在这个函数序言之后,基址为 `%rbp`Không có chỉ số và không có số lượng lưu trữ chuyển động, sẽ trở thành tên gọi`local_<hex>`của biến đổi.`-0x8(%rbp)`Đối với`local_8`- Tôi không biết.`-0xc(%rbp)`Đối với`local_c`

Chỉ thị tự nó không tạo ra IR, đối với`%rsp`của `subq`和 `addq`Cũng không tạo ra. Số lượng hoạt động trong bộ nhớ còn tồn tại.`Load`Hoặc`Store`

### 重定位

`grade`Trung `leaq (%rip), %rcx`Trong file số chuyển động là 0.`0x36`处的重定位项 là `R_X86_64_PC32.rodata+0x10` 链接器会将 `S + A - P`写入该字段──`S` `.rodata`Địa chỉ của,`A``0x10`- Tôi không biết.`P`是字段地址──随后指令计算 `next_ip + disp = (P + 4) + S + A - P = S + A + 4`

提升器 áp dụng cùng một vận hành trong trường hợp không có các liên kết. 目标偏移等于加数加字段到命令末段的距离,即`0x10 + 4 = 0x14`✿IR 写为 ✿`rcx = &.rodata+0x14`, trong đó có 5 biểu tượng .`int` giá trị `1, 2, 3, 4, 4`

## 阶段 4: từ调用约定恢复参数

Hệ thống V AMD64 psABI 第 3.2.3 节规定,INTEGER 类参数依次通过 `%rdi``%rsi``%rdx``%rcx``%r8``%r9`传递── kết quả trước qua `%rax`, qua lại `%rdx`返回──第 3.2.1 节说明,`%rbp``%rbx`和 `%r12`Đến`%r15`属于调用方, phải giữ lại; còn lại寄存器 thuộc được调用方.

`collect_params()`应用一条规则: Trong hàm trước đọc sau viết các ký tự số là hình thành. Trong số đó số ký tự cao nhất quyết định số lượng các ký tự, do đó chỉ đọc`%rsi`、从不读 `%rdi`Các hàm vẫn có hai tham số:`percent_change`读取 `%edi`和 `%esi`, vì vậy có`param_1`和 `param_2``grade`Chỉ đọc `%edi``total`sẽ`%rdi`作为 64 位基址读取,将 `%esi`作为 32 位计数读取──

Giờ thì tôi có thể giải thích Ghidra của `param_3`   `idivl`会写入 `%rdx`, và PSABI 允许通过 `%rax:%rdx`返回 128 位 INTEGER── trong các mục tiêu tài liệu, không có người dùng có thể nói cho chúng ta về giá trị trả lại có thật sự nhiều.

Trên đường trở về 0`xorl %eax, %eax`Chỉ viết vào`%eax` Ghidra 在该路径上将 `%rdx`Như hàm nhập-đọc, nhập này đã trở thành`param_3`❖ chỉ thị không có lỗi.

## 阶段 5:SSA, mỗi định nghĩa một名字

提升 sau đó,`grade`写入 `rax`Bốn lần, viết vào`rcx`三次──Cytron、Ferrante、Rosen、Wegman 和 Zadeck(1991) xác định định hình thức định giá tĩnh đơn lẻ: mỗi biến biến được định giá một lần, các hàm phi của điểm汇合处 được chọn từ định nghĩa đến đây.`insert_phis()`和 `rename()`遵循这两节的方法――

`total`Danh sách SSA cho thấy kết quả xây dựng:

```text
block 0x44 -> 0x50
  ecx_1 = esi_0
  edx_1 = 0
  eax_1 = 0
block 0x50 -> 0x50, 0x5b
  eax_2 = phi(0x44: eax_1, 0x50: eax_3)
  rdx_2 = phi(0x44: edx_1, 0x50: rdx_3)
  flags_2 = phi(0x44: flags_1, 0x50: flags_5)
  flags_3 = add(eax_2, load32(rdi_0 + rdx_2 * 4))
  eax_3 = eax_2 + load32(rdi_0 + rdx_2 * 4)
  flags_4 = inc(rdx_2, 1)
  rdx_3 = rdx_2 + 1
  flags_5 = cmp(zext64(ecx_1), rdx_3)
  if jne(flags_5) goto 0x50 else goto 0x5b
```

寄存器的版本 0 là giá trị của hàm nhập.`esi_0`和 `rdi_0`                                                                                                                                                                                                                                                              `0x50`Có hai động cơ trước: khởi tạo khối và chính nó, vì vậy mỗi biến thể trong vòng có định nghĩa sẽ được một phi.`flags_2`Cái này phi một sinh là cái chết của mã. SSA nhỏ nhất để nó, vì hai mã trước đã định nghĩa.`flags`; giai đoạn 6 cũng sẽ xóa nó, vì không có nơi nào để đọc nó.

重命名步骤还会修改位宽──`edx_1 = 0`là 32 位 định nghĩa,`rdx_3 = rdx_2 + 1`là 64 位 định nghĩa, vì vậy phi `rdx_2`采用较大的位宽──`cmpq %rdx, %rcx`Đối với`%rcx`Đọc: 64 vị trí, và định nghĩa của nó`ecx_1 = esi_0`là 32 vị trí, vì vậy nên sử dụng biến为`zext64(ecx_1)`                                                                                                                                                                                                                                                              

Đường độ nhẹ của SSA hiện đang xuất hiện trên đường lối.`coalesce_webs()`Để kết hợp mỗi phi với các tham số của nó thành một biến số được gọi là web, và cho web này một tên gọi. Điều này áp dụng cho cấu trúc mà trình biên dịch tạo ra các hàm này. Nhưng khi gặp phải các đường nét có thể bị thất bại, ví dụ như hai giá trị trao đổi phi của cùng một điểm汇合点; Bài này không xử lý tình huống này.

## 阶段 6: 化简"", thay đổi và chết mã hóa

`optimize()`反复执行三轮处理,直到不再变化――化简器 theo quy tắc sau:

| 改写前 | 改写后 |
|---|---|
| `Cond(je, cmp(a, b))` | `a == b`，其余九种条件码同理 |
| `Cond(jle, test(a, a))` | `a <= 0` |
| `x + (-6)` | `x - 6` |
| `trunc32(zext64(x))`，其中 `x` 为 32 位 | `x` |
| 对 64 位操作数执行 `trunc32(a + b)` | `trunc32(a) + trunc32(b)` |
| `(signfill(x): x) / d` | 位宽为 32 的 `x / d` |
| `load32(base + idx * 4)` | `base[idx]` |
| `trunc32(p >>s 34) + trunc32(p >>u 63)`，其中 `p = sext64(x) * 0x66666667` | `x / 10` |

Trước hướng thay thế sẽ chuyển một định nghĩa vào điểm sử dụng duy nhất của nó. Quy tắc này có ba điều kiện: điểm sử dụng nằm trong cùng một khối cơ bản; điểm sử dụng là một câu nói chứ không phải phi; nếu định nghĩa chứa tải, thì định nghĩa và sử dụng không thể có lưu trữ hoặc điều chỉnh.

Cái chết mã loại bỏ sẽ xóa mục tiêu không sử dụng và biểu hiện không chứa định giá hoặc phiền.`percent_change`中,余数 `edx_2 = dividend_1 % edi_0`Đó là cái chết của nó, vì vậy nó được xóa đi trước.`edx_1 = signfill(eax_1)`Chỉ còn một điểm sử dụng, rồi được thay vào.`dividend_1 = edx_1:eax_1`

寄存器对规则随后将 `signfill(eax_1):eax_1`化简为`eax_1`,除法变成`eax_1 / edi_0`  `eax_1 = esi_1 * 100`Chỉ có một điểm sử dụng,`esi_1 = esi_0 - edi_0`Cũng chỉ có một điểm sử dụng, cả hai đều được chuyển vào trở lại语句.`flags`                                                                                                                                                                                                                                                              

```c
return (param_2 - param_1) * 100 / param_1;
```

### 乘以 0x66666667

`grade`sẽ phân số chia thành 10, nhưng không tạo ra clang`idiv`     `imulq $0x66666667, %rax, %rax`, tái đối với một phụ lệnh thực hiện`sarq $0x22, %rcx`, rồi thực hiện`shrq $0x3f, %rax`,最后将两者相加──Granlund 和 Montgomery 的论文Bổn bằng số nguyên tố không biến bằng cách nhân số(PLDI 1994) mô tả phương pháp này──编译器选择乘数 `m`和移位量 `s`, để trong phạm vi của mỗi `x`Thành phố đáp ứng`(x * m) >> s`Đúng vậy.`x / d`

Ở đây`m = 0x66666667 = 1717986919`- Tôi không biết.`s = 34`◊运算可以核对:`2^34 / 10 = 1717986918.4`, lên lấy toàn bộ vì `1717986919` 误差 là `m * 10 - 2^34 = 6` Để tạo ra mối quan hệ với mỗi 32 vị trí `x`Thành lập, sai lầm gấp đôi`2^31` phải giữ `2^34`Sau đây, vì vậy sự sai lầm là 8――6 không vượt quá 8, vì vậy đối với mỗi người không bị tiêu cực.`int`- Tôi không biết.`(x * m) >> 34`Đường như `floor(x / 10)`

Đối với số lượng`x`, hướng xuống lấy toàn bộ từ không, còn C là cách phân biệt đối với không.`shrq $0x3f`提取乘积的符号位, và恰好在 `x`Nên thời gian tương đương với 1 ⋅ cộng với nó là có thể sửa đổi hướng đi ⋅

`magic_divisor(m, s)`检验一对候选价值──它将 `d`计算为 `2^s`Ngoài ra`m`        `d`和 `d + 1` Chỉ có lúc `m`Đúng vậy.`2^s / d`Ưu điểm của kết quả, và đáp ứng giới hạn sai lầm, chỉ chấp nhận một số `d` cùng số cộng đồng `s = 33`Tôi sẽ nhận được`d = 5`, cũng đúng, vì `0x66666667`Tương tự như vậy.`2^33 / 5`Kết quả trên toàn bộ. Một bài kiểm tra sẽ được thực hiện ở 2.406 giá trị trên`c_div(x, 10)`So sánh, trong đó bao gồm:`int`2 điểm trong phạm vi:

启用识别时,`grade`显示为 `ecx_1 = param_1 / 10 - 6;`关闭识别时,演示会打印原始形式:

```c
rax_1 = (long)param_1 * 0x66666667;
ecx_1 = (int)(rax_1 >> 34) + (int)((unsigned long)rax_1 >> 63) - 6;
```

两种形式都编译,也计算出相同的值――保留这个开关―― khi bạn đọc các mã do trình biên dịch viên tạo ra mà chưa nghiên cứu, hình thức ban đầu chỉ là biểu hiện trung thực――

## 阶段 7: Từ cách sử dụng

机器码 chỉ có kích thước rộng, không có kiểu.`infer_types()`将三类证据转换为 C类型――定义位宽为 32 的网是`int`,64 位的网 是 `long`Nếu một trang web là yếu tố truy cập`base[idx]`√{\displaystyle \mathbb {\mathbb {\mathbb {\mathbb {\mathbb {\mathbb {\mathbb}}}{\mathbb {\mathbb {\mathbb {\mathbb {\mathbb {\mathbb {\mathbb {\mathbb {\mathbb {\mathbb {\mathbb {\mathbb {\mathbb}}}`int *` chỉ số loại sẽ được sử dụng để sao chép và truyền bá, do đó`-O0`下的 `local_8 = param_1`Để cả hai trở thành`int *`                                                                                                                                                                                                                                                              `return`语句中值的位宽──

`total`Kết quả là:`int total(int *param_1, int param_2)`Ghidra viết là`int total(long param_1,uint param_2)`                                                                                                                                                                                                                                                              `*(int *)(param_1 + uVar2 * 4)`                                                                                                                                                                                                                                                              `const`, cũng không thể phân biệt được`int *`和 `unsigned *`

Lee、Avgerinos 和 Brumley(TIE,NDSS 2011) sẽ loại phục hồi biểu diễn để giải thích về các quy tắc trên. Kết quả là một giới trên và một giới dưới, chứ không phải là một sự đoán đơn lẻ.`const`Tỷ lệ quay lại của dấu chỉ đạt 98%. Bài học này áp dụng hai quy tắc giá thấp nhất trong tuyến nghiên cứu này, và chỉ ra rằng chúng không nhìn thấy gì.

无符号运算保留在表式中,而不体现在变量类型里──`cmpl $0x4, %ecx`后的 `ja`打印为`(unsigned int)ecx_1 > 4`- Tôi không biết.`shrq`打印为`(unsigned long)rax_1 >> 63` Variable vẫn giữ được kiểu ký hiệu, do đó người đọc cũng có thể thấy giá trị ký hiệu, cũng có thể thấy lệnh ở vị trí nào sẽ coi nó là không có giá trị ký hiệu.

## 阶段 8: Từ图中恢复结构

Cifuentes(1994) Chương 6 sẽ được hình trong khu vực với các ngôn ngữ cao cấp cấu trúc hình dạng phù hợp.`goto`, trung bình mỗi 32 行 một; trong khi cách cấu trúc của họ trong 1,530 các hàm cốt lõi không tạo ra bất kỳ loại câu nào.

`structure()`là một phương pháp nhỏ để thực hiện. Nó cần giai đoạn 2 cung cấp hai thực tế.`Branch`结尾块,其直接后支配节点就是条件分支的汇合点――回边指向一个控制其源节点块的边缘――自然循环则是无需经过循环的头来才能达到回边源节点的那些块的集合――

Đối với汇合点为`j`của `Branch`- Có thể là:

- Nếu `j`                                                                                                                                                                                                                                                              `if (!cond) { fallthrough region }`, rồi từ`j`继续──
- Nếu `j`là thứ tự, tạo ra`if (cond) { target region }`, rồi từ`j`继续──
- Nếu `j`Là hàm xuất khẩu, hai phân tử sẽ trở lại.`if (cond) {... }`, một分支放 vào sau nó, không sử dụng `else`Đó là điều đó.`percent_change`和 `total`Trung 提前返回──
- 否则生成 `if (cond) { target } else { fallthrough }`, rồi từ`j`继续──`-O0`下的 `percent_change`Đó là tình huống: hai phần tử lưu trữ.`local_4`, và trong hàm尾声处汇合──

Đối với vòng tròn:

- Nếu vòng tròn`Branch`结尾, còn có một hậu hậu nằm bên ngoài vòng lặp, tạo ra `while (cond) { body }``-O0`下的 `total`                                                                                                                                                                                                                                                              `local_14`和 `local_c`,并通过 `jge`离开──
- Nếu đầu vòng cũng là một khối bên cạnh, hoặc xuất khẩu nằm trong vòng khóa, thì tạo ra`do { body } while (cond);``-O1`下的 `total`Đây là hình dạng:块 `0x50`执行加法、递增、比较, sau đó nhảy trở lại chính mình.

`IndirectJump`Sẽ kết thúc một phần, và không có sau sau.`-O0`下的 `grade`Sử dụng biểu đồ chuyển đổi thực sự:`jmpq *%rax` Thông qua `.rodata+0x0`处的五个相对偏移量跳转,第 33 课会解析这些目标――本课提升器则打印一条说明――`0x76``0x7f``0x88`和 `0x91`4 khối chỉ có thể được chuyển đổi gián tiếp, do đó không được nâng cao.`switch`

### -O1 để chuyển đổi làm gì?

Trong `-O1`下,clang 没有为 `grade`Bảo trì nhảy chuyển表―― nó tính toán `score / 10 - 6`, sẽ kết quả là số không biểu tượng so với 4 so sánh, sau đó từ `.rodata+0x14`处包含五个 `int`                                                                                                                                                                                                                                                              `score / 10 < 6`和 `score / 10 > 10`两种情况──负差值作为无符号数很大,因此也无法通过检查──

表中存放 `1, 2, 3, 4, 4`,分分对应商 6 đến 10 带五条 `return`của `switch` biến thành một `if`Và một lần số lượng đọc:                                                                                                                                                                                                                                                            `lookup_14`

表长通过启发式规则确定──`table_values()`Từ từ từ từ từ, cho đến khi bạn muốn`.text`重定位项引用的下一个 `.rodata`偏移, hoặc cho đến cuối phần. Trong mục tiêu này, 偏移 được trích dẫn tiếp theo là `0x28`,即 `grade_label``lookup_14`Có `(0x28 - 0x14) / 4 = 5`项──与 4 的无符比较也吻合──Ghidra 同样不知道表长──它写成 `*(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4)`, tức là một字节 địa chỉ cộng với số chuyển động, và tìm kiếm 5 giá trị làm việc để lại cho người đọc.

## Với Ghidra 并排对照

演示会打印每对结果──Ghidra 文本来自 `code/fixtures/ghidra/*.json`, đó là thực tế trong 2026-10-14  trả lại bằng chứng 记录 命令为`npx -y rea-agents@6.5.0 decompile ledger-x86_64-O1.o <function> --provider ghidra --format json`                                                                                                                                                                                                                                                              `confidence: observed`和 `authority: shipped-artifact`Văn bản là kết quả quan sát, nhưng những phát biểu trong văn bản là kết luận xuất phát, và ghi chép không chỉ ra những gì là kết quả kết luận.

### %_change

```text
lifter                                         | ghidra
-----------------------------------------------+-----------------------------------------------
int percent_change(int param_1, int param_2)   | undefined1  [16] percent_change(int param_1,int param_2,ulong param_3)
{                                              | {
  if (param_1 == 0) {                          |   long lVar1;
    return 0;                                  |   undefined1 auVar2 [16];
  }                                            |   undefined1 auVar3 [16];
  return (param_2 - param_1) * 100 / param_1;  |   if (param_1 != 0) {
}                                              |     lVar1 = (long)((param_2 - param_1) * 100);
                                               |     auVar3._0_8_ = lVar1 / (long)param_1 & 0xffffffff;
                                               |     auVar3._8_8_ = lVar1 % (long)param_1 & 0xffffffff;
                                               |     return auVar3;
                                               |   }
                                               |   auVar2._8_8_ = 0;
                                               |   auVar2._0_8_ = param_3;
                                               |   return auVar2 << 0x40;
                                               | }
```

| 差异 | 指令或猜测 |
|---|---|
| 返回类型 `undefined1 [16]` 与 `int` | 猜测。`idivl` 写入 `%rax` 和 `%rdx`，且没有调用方确定返回位宽，因此两个寄存器都被保留。 |
| `param_3` | 由第一个猜测引出的猜测。返回零的路径上只有 `%eax` 被写入，所以 `%rdx` 被作为输入读取。 |
| `lVar1 / (long)param_1 & 0xffffffff` 与 `/ param_1` | 来自指令。`cltd` 加 `idivl` 对符号扩展后的 32 位值做 64 位除法，再截断到 32 位。两段文本都在描述这个过程。我们的版本用 `signfill` 规则化简了寄存器对。 |
| 保留 `lVar1 % (long)param_1` | 源于返回类型。在我们的分析中，`%rdx` 中的余数是死值；在 Ghidra 的分析中，它是活值。 |
| `if (param_1 != 0)`，后面才是零值情况 | 源于指令顺序。`je 0xd` 跳到返回零的位置。Ghidra 先放计算分支，我们先放较小分支。两者都正确。 |
| `return auVar2 << 0x40` | 猜测。反编译器用一个低半部装有 `param_3`、再移到高半部的 16 字节值，表达 `%rax = 0` 且 `%rdx` 未知的情况。 |

`code/fixtures/ghidra/ledger-x86_64-O1.ghidra-repaired.c`Bản sửa đổi trung bình chỉ sửa đổi hàm này, test sẽ so sánh nó với mã nguồn trên 81 lần nhập.

### cấp

```text
lifter                                         | ghidra
-----------------------------------------------+-----------------------------------------------
static const int lookup_14[5] = {1, 2, 3, 4, 4}; | uint grade(int param_1)
int grade(int param_1)                         | {
{                                              |   uint uVar1;
  int eax_1;                                   |   uint uVar2;
  int ecx_1;                                   |   
                                               |   uVar2 = param_1 / 10 - 6;
  ecx_1 = param_1 / 10 - 6;                    |   uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);
  eax_1 = 0;                                   |   if (uVar2 < 5) {
  if ((unsigned int)ecx_1 <= 4) {              |     uVar1 = *(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4);
    eax_1 = lookup_14[(unsigned long)(unsigned int)ecx_1]; |   }
  }                                            |   return uVar1;
  return eax_1;                                | }
}                                              |
```

| 差异 | 指令或猜测 |
|---|---|
| 两者都有 `param_1 / 10 - 6` | 来自指令。两者都识别出了 `0x66666667` 惯用模式。 |
| `uVar1 = -(param_1 >> 0x1f) ^ (uint)(... >> 0x3f)` 与 `eax_1 = 0` | 来自 `grade+0x1a` 处的 `xorl %eax, %eax`。寄存器为零。Ghidra 将 `xor` 表达为 `param_1` 的符号与乘积符号位的异或，这是同一个位的两种写法，却没有将两者消去。对每个 `int`，值都为 0，测试在 141 个分数上验证了这一点。相信文本的读者会误以为默认值依赖分数。 |
| `uVar2 < 5` 与 `(unsigned int)ecx_1 <= 4` | 来自 `cmpl $0x4, %ecx`，随后是 `ja`。条件相同。Ghidra 将 `uVar2` 定为 `uint`，我们则在使用处转换。 |
| `*(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4)` 与 `lookup_14[...]` | 来自指令加重定位。Ghidra 加载目标文件时，将 `.rodata` 放在 `0x001000a0`，所以 `0x001000b4` 就是 `.rodata + 0x14`。它应用了重定位并保留字节地址。我们为表命名，并读取了其中五个值。 |
| `uint` 返回值与 `int` | 两边都是猜测。指令只说明是 32 位。 |

### tổng số

```text
lifter                                         | ghidra
-----------------------------------------------+-----------------------------------------------
int total(int *param_1, int param_2)           | int total(long param_1,uint param_2)
{                                              | {
  int eax_1;                                   |   int iVar1;
  int ecx_1;                                   |   ulong uVar2;
  long rdx_1;                                  |   
                                               |   if (0 < (int)param_2) {
  if (param_2 <= 0) {                          |     uVar2 = 0;
    return 0;                                  |     iVar1 = 0;
  }                                            |     do {
  ecx_1 = param_2;                             |       iVar1 = iVar1 + *(int *)(param_1 + uVar2 * 4);
  rdx_1 = 0;                                   |       uVar2 = uVar2 + 1;
  eax_1 = 0;                                   |     } while (param_2 != uVar2);
  do {                                         |     return iVar1;
    eax_1 = eax_1 + param_1[rdx_1];            |   }
    rdx_1 = rdx_1 + 1;                         |   return 0;
  } while ((unsigned long)(unsigned int)ecx_1 != rdx_1); | }
  return eax_1;                                |
}                                              |
```

| 差异 | 指令或猜测 |
|---|---|
| `int *param_1` 与 `long param_1` | 我们根据 `addl (%rdi,%rdx,4), %eax` 作出的推断。Ghidra 保留了位宽。 |
| `uint param_2` 与 `(int)param_2`，对比 `int param_2` | Ghidra 选择无符号类型，因为 `cmpq %rdx, %rcx` 比较的是零扩展后的计数。我们保留 `int`，在比较处转换。 |
| 两者都有 `do { } while` | 来自块跳回自身的指令 `jne 0x50`。编译器旋转了循环。`-O0` 目标文件保留 `while`。 |
| 保留 `ecx_1 = param_2`，对比 `param_2 != uVar2` | 我们的替换规则仅限于同一基本块。复制 `movl %esi, %ecx` 位于初始化块，而比较位于循环内，所以变量保留。Ghidra 则传播了它。 |
| `(unsigned long)(unsigned int)ecx_1` | 来自指令。`movl %esi, %ecx` 执行零扩展，64 位比较读取整个寄存器。 |

行为测试会原样编译 `grade`和 `total`của Ghidra 文本, chỉ thêm hai dòng `typedef`, và theo`.rodata+0x14`处二十字节                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `DAT_001000b4`定义── 在输入网格上, hai hàm đều phù hợp với mã nguồn──

## Nghiên cứu về những lời khai giả

LLM4Decompile(EMNLP 2024) đã được đánh giá, đơn độc sử dụng Ghidra trên HumanEval-Decompile có tỷ lệ tái thực hiện là 20,12%。 khoảng năm phần trăm các hàm có thể được biên dịch lại và thông qua các tuyên bố của基准自带── sử dụng 6.7B mô hình sửa đổi Ghidra 输出, tỷ lệ này tăng lên 52,74%──DecompileBench (Phát hiện của ACL 2025) đã thử nghiệm trên 23,400 hàm từ 130 chương trình từ sáu loại công nghiệp chống biên dịch và sáu loại LLM  phương pháp──LLM 输出 dễ đọc hơn, nhưng tính chính xác chức năng đã giảm 52,2%──

Liu、Raff 和 Micinski(arXiv 2609.05370, 2026 年 9 月) giải thích sự khác biệt này. Họ sử dụng 300 hàm thư viện GitHub và 287 hàm dựa trên CVE. Mô hình sửa đổi mạnh nhất sẽ nâng tỷ lệ thành công xây dựng của Ghidra từ 75% lên 90%, nhưng tỷ lệ phù hợp hành vi giảm từ 74% xuống còn 62%. Ngay cả khi kết quả ứng cử vượt qua tất cả các thử nghiệm trong基准, việc nhập vào thử nghiệm mờ vẫn có thể có kết quả khác nhau. Trong tám hệ thống, 4.9%, trong đó một hệ thống đạt đến 13%. Trong các lỗ hổng đã được tiết lộ, nhiều nhất một phần mười mã đã biến mất sau khi sửa đổi.

Lý do họ theo dõi là rất đơn giản: với không gian tạo các đoạn văn, loại, được gọi chức năng và điều kiện bảo vệ, thay thế các phần mềm chống biên dịch được để lại trong văn bản.

Đây là máy in nâng.`(unsigned long)(unsigned int)ecx_1`Không phải là lý do của cái tên đẹp hơn... đối với những bước nhảy chưa được giải quyết, nó được in ghi chép thay vì...`switch`Đối với表, nó sử dụng `lookup_14`, thay vì mô hình có thể tạo ra các nhãn.`code/main.py`中阅读的推导过程──Ghidra của `undefined1 [16]`很难看,但诚实──修订模型生成的整洁签名 `int percent_change(int, int)`Mặc dù đúng, lý do không đúng. Một mô hình tương tự có thể tạo ra chữ ký hoàn chỉnh nhưng sai lầm trên hàm tiếp theo.

## 亲手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/34-lifting-to-pseudocode
python3 code/main.py
```

演示会解码 `-O1`Tất cả bốn hàm của mục tiêu tài liệu, và sẽ mỗi chỉ thị với các yêu cầu đã gửi `llvm-objdump`文本比较──对于 `percent_change``grade`和 `total`, nó sẽ in SSA  trước đó IR 、 chứa phi  hàm SSA danh sách, cũng như với Ghidra 文本并排的伪代码── sau đó in关闭除法识别后的`grade``-O0`版本 của `percent_change``total`和 `grade_label`, và汇总:

```json
{
  "functions": ["grade", "grade_label", "percent_change", "total"],
  "instructions": 56,
  "blocks": {"percent_change": 3, "grade": 3, "total": 5, "grade_label": 4},
  "phis": {"percent_change": 0, "grade": 1, "total": 2, "grade_label": 1},
  "objdumpDifferences": 0
}
```

按以下顺序阅读 `code/main.py`- Có thể là:

1. `read_object()`读取 ELF64 可重定位目标文件的节头,符号表和 `.rela`节──
2. `decode_one()`和 `render_att()`解码一条命令,并按 `llvm-objdump`Cách in nó.
3. `build_blocks()``immediate_dominators()`和 `dominance_frontiers()`构建图的相关事实──
4. `lift_insn()`将一条命令转换为 IR 语句,并解析重定位──
5. `insert_phis()`和 `rename()`构建 SSA,并插入位宽转换──
6. `make_simplifier()``substitute_once()`和 `remove_dead_code()`Trong `optimize()`Trong hành trình.
7. `collect_params()``coalesce_webs()`和 `infer_types()`为 web 命名并推断类型──
8. `structure()`配合 `post_dominators()`和 `natural_loops()`生成 C 函数体──
9. `lift_function()`串联各阶段,`lift_all()`则携带被调用函数签名,提升整个目标文件──

##  thực tế sử dụng

Để nâng cao hàm trong mục tiêu của bạn, sử dụng `clang -target x86_64-unknown-linux-gnu -c` xây dựng nó, rồi调用 `lift_all(read_object(path))`解码器抛出 `DecodeError`时,从消息中读取操作码字节,在SDM操作码映射表中查找它,再在文件顶部表中增加一个――提升器因某助记符抛错时,为`lift_insn()`增加一条规则── cấu trúc hóa器生成 `goto`时, sử dụng `IrPrinter`印图,判断缺少哪条形态规则── mỗi lần tăng lên nội dung đều rất nhỏ, hiện có kiểm tra sẽ đối chiếu `llvm-objdump`Hoặc clang  kiểm tra nó.

Sau khi cài đặt Ghidra, đối với cùng một hàm hoạt động thực tế,并将两段文本并排放置―― 在相信任何一段文本之前,先填写差异表――有指令依据的差异是表达方式的选择;没有指令依据的差异是猜测,而且猜测可能出现任意一方――

## 交互实验

### 实验 A: để một hàm qua 5 giai đoạn

Trong `code`Giờ mở Python:

```bash
cd phases/13-tools-and-protocols/34-lifting-to-pseudocode/code
python3 -q
```

运行:

```python
from main import *
obj = read_object(FIXTURES / "ledger-x86_64-O1.o")
lifted = lift_function(obj, "percent_change")
for insn in lifted.decoded: print(f"0x{insn.address:x}: {insn.raw.hex(' ')}  {insn.att()}")
print(lifted.ir_text)
print(lifted.ssa_text)
print(lifted.pseudocode)
```

Theo dõi`%esi`Làm thế nào để làm thế?`subl %edi, %esi`变成 `esi_1 = esi_0 - edi_0`, tái biến thành`(param_2 - param_1)`✿字节 `fe` `subl`của ModR/M, trong đó `mod = 11``reg = edi``r/m = esi`

### 实验 B:除法惯用模式

```python
print(lift_function(obj, "grade", recognize_division=False).pseudocode)
print(magic_divisor(0x66666667, 34), magic_divisor(0x66666667, 33), magic_divisor(0x66666667, 31))
```

First line printing original乘法和移位──第二 line printing `10 5 None` Xin giới thiệu tại sao cùng một số nhân trong số số chuyển vị giảm một khi biểu hiện chia bằng 5, và tại sao số chuyển vị 31 không đáp ứng giới hạn sai lầm

### 实验 C:新目标文件让解码器停下

以 `-O2`构建测试样例并提升它:

```bash
clang -target x86_64-unknown-linux-gnu -O2 -fno-asynchronous-unwind-tables -c fixtures/ledger.c -o "$TMPDIR/ledger-O2.o"
python3 -c 'from main import *; from pathlib import Path; import os; lift_all(read_object(Path(os.environ["TMPDIR"]) / "ledger-O2.o"))'
```

解码器在 `0x56`处停止, báo cáo `opcode 81 is outside the fixture subset`操作码 `81`là带 32 位立即数的第 1 组形式──该指令是`andl $0x7ffffff8, %edx`, clang trong `total`Trong chu kỳ định lượng hóa sử dụng nó.`decode_one()`của `0x83`Bên cạnh đó, chạy lại, và ghi lại các mã hoạt động tiếp theo để bạn dừng lại.`llvm-objdump`Chuẩn bị kiểm tra.

### 实验 D: Ghidra 在级中的默认值

```python
print(ghidra_pseudocode("grade"))
for score in (-25, 0, 59, 60, 100, 115):
    sign = -(score >> 31)
    product_sign = ((score * 0x66666667) & ((1 << 64) - 1)) >> 63
    print(score, sign ^ product_sign)
```

Mỗi lần đều in số 0...`uVar1`Sự thật là khó đọc, nhưng chỉ dẫn là khó đọc.`xorl %eax, %eax`Với hai chữ cái, chúng ta đã thể hiện cùng một ý nghĩa.

## 实践实验

Vì vậy`-O0`下的 `grade`添加 `switch`恢复:

要求:

- 读取 `ledger-x86_64-O0.o`của `.rela.rodata`Trong số đó có 5 vị trí, mỗi vị trí là `R_X86_64_PC32.text+offset`,并根据 `.rodata+0x0`处的表计算五个案例 目标──
- Vì vậy,`Switch`终结命令,包含索引表达, mục tiêu danh sách, cũng như từ biểu đồ tải trước `ja`Ưu tiên của tôi là...
- Để chuyển đổi từng mục tiêu của khối đặt một sau, để điều khiển các nút, sau điều khiển các nút và SSA vẫn hoạt động bình thường.
- 生成 `switch (local_10) { case 0:... }`, mỗi mục tiêu đối với một `case`,并将共用函数尾声 đặt vào汇合点后.
- 对于无法确定表边界的间接跳转,保留说明――
- 用 clang 编译结果, và trong test số phân số trên mạng với nguồn so sánh.

Định nghĩa thành công là:`-O0`下的 `grade`Với`-O1`下的 `grade`Trong toàn bộ mạng lưới xuất phát giống nhau, và kết quả khôi phục chứa một `switch`, không có `goto`

## 评分实验

5 cách về các bài học này. Sử dụng mã xây dựng của bạn để tìm ra mỗi câu trả lời, sau đó viết vào.`code/lab_answers.json`◊ số viết thành số, hoặc viết thành `"0x40"`Như vậy, các chuỗi được tạo thành các chuỗi JSON.

1. `t1`:调用约定在 -O1 下给 %_change 的参数数量――
2. `t2`:-Tổng số của O1 trong hình thức SSA 中 phi 函数的个数──
3. `t3`:magic_divisor đối với 0x66666667  shift 34 求出除数
4. `t4`:-O1 của %_change 伪代码的最后一条语句,写成一行文本──
5. `t5`:-O1 tổng số 中 param_1 恢复出的 C 类型。

检查你的答案:

```bash
cd phases/13-tools-and-protocols/34-lifting-to-pseudocode
python3 code/lab.py
```

检查器在已提交的固定 上使用 `code/main.py`计算每个期望值── nó cho mỗi bài toán输出 `PASS``FAIL`Hoặc`TODO`Và tất cả, chỉ có 5 câu hỏi được thông qua khi chỉ có 0  xuất phát.`python3 code/lab.py my-answers.json`可检查另一个文件.`code/tests/test_lab.py`证明检查器 chấp nhận đúng câu trả lời并拒绝错误答案──

### Xem nó hoạt động

[Inside a Decompiler](https://aiengineeringfromscratch.com/inside-a-decompiler?opt=O0)Máy trộn bài học này như là máy áp suất nâng cao, loại cây đinh, cấu trúc, thiết bị và máy in để chạy, và sử dụng`code/main.py`输出 IR、SSA 和伪代码──这个链接打开`-O0`目标文件:三个槽变成局部变量,具为如果/else 合上两爪──

## 交付产物

本课产 出 `outputs/skill-lifting-to-pseudocode.md` Sử dụng nó để nâng cao một hàm, cung cấp hướng dẫn cho mỗi dòng, và lấp đầy bảng khác biệt của văn bản chống biên dịch viên.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/34-lifting-to-pseudocode
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

套件共有 25 个测试──验证证证:

- Đối với hai tài liệu mục tiêu, mỗi lệnh giải mã đều có cùng với các lệnh đã gửi.`llvm-objdump`文本一致;若安装了 `llvm-objdump`, cũng phù hợp với kết quả hoạt động tại hiện trường
- REX, ModR/M, SIB và`leaq (%rip), %rcx`∆位移字段 ∆位移均按照 SDM 的描述解码
- 遇到子集之外的操作码时抛出 `DecodeError`, thay vì đoán
- ELF 读取器列出四函数和三 `.text`重定位项
- `total`Có 5 viên,`0x44`支配 `0x50`- Tôi không biết.`0x50`Là đầu vòng tròn của một cơ thể tự do
- `%rdi`和 `%rsi`变为 `param_1`和 `param_2`, và`total`Trung `param_1`Vì vậy`int *`
- `test`和 `cmp`配合 `je``jle``ja`和 `jge`, biến为`==``<=`Không có mã`>`和 `<`
- SSA ở `total`循环头放置两个活跃的 phi 函数,在 `percent_change`中不放置任何 phi
- `percent_change``grade`和 `total`n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n
- 启用识别时,`grade`显示 `param_1 / 10 - 6`;关闭识别时,显示原始乘法
- `0x66666667`配合移位量 34 biểu hiện chia với 10,配合移位量 33 biểu hiện chia với 5, và tương tự được hình thành trên mạng nhập
- `-O0`Đường dưới biến thành `local_4``local_8``local_c`, và không còn xuất hiện
- 通过重定位, trong `.rodata+0x14`处的表中读取到 `1, 2, 3, 4, 4`
- `-O0`下 `grade`Chuyển động liên quan đến 4 khối chưa được nâng cao được báo cáo
- Ghidra 测试样例包含 16 字节返回值,`param_3`、 chưa được đơn giản hóa `xor`和 `long param_1`
- Có 6 đơn vị được tạo ra.`clang -std=c11 -Wall -Werror`Vì vậy`x86_64-unknown-linux-gnu`编译
- 提升后函数、修复后 Ghidra 文本和源码, in输入网格印出相同的232行

## Mô hình thất bại trong môi trường sản xuất

| 失效情况 | 浅层阅读的结论 | 推导过程必须展示的内容 |
|---|---|---|
| 反编译器扩大返回值位宽 | “返回 16 字节结构体” | `idivl` 写入 `%rdx`，且没有调用方确定其位宽 |
| 反编译器增加参数 | “接收三个参数” | 只是因为猜测了返回位宽，才在一条路径上读取该寄存器 |
| 未识别惯用模式 | “乘以魔数常量” | 乘数是 `2^s / d` 向上取整的结果，且满足误差界 |
| 识别了惯用模式，却丢失 `xor` | “默认值依赖输入” | `xorl %eax, %eax` 写入零，同一位的两种表达相互抵消 |
| 指针被定为整数类型 | “接收一个 long” | 从该寄存器进行带比例因子的 4 字节加载，是指针的证据 |
| 表长未知 | “读出了表的范围” | 下一个被引用的偏移或节末尾限定表边界，且范围检查与此吻合 |
| 误读循环结构 | “while 循环” | 循环头没有出口，闩锁块向后跳转，因此是 `do while` |
| 猜测间接跳转 | “有五个 case 的 switch” | 目标来自 `.rela.rodata`，否则应报告跳转未解析 |
| 跨存储进行替换 | “一个表达式” | 将已加载的值移过存储或调用，会改变含义 |
| 修订模型编辑文本 | “能够编译，看起来没错” | 构建成功率上升，行为匹配率下降，编造的保护条件替换了显式未知项 |
| 解码器猜测未知操作码 | “反汇编看起来没问题” | 抛出含地址与字节的 `DecodeError`，然后增加一个经 `llvm-objdump` 验证的表项 |

## 操作原则

Hãy xem mã giả là một quá trình dẫn hướng mà bạn chưa thấy. Sử dụng bộ nâng cấp mà bạn có thể đọc được, hãy làm việc theo lệnh tái hiện nó. Hãy đặt hai đoạn văn trong một thứ tự, viết ra lệnh hoặc đoán sau mỗi dòng khác nhau. Nếu có mã nguồn, hãy chạy hai thứ này và so sánh với mã nguồn. Một dòng mã miễn là không có cơ sở chỉ dẫn, dù đọc được tốt hay không, đều vẫn là đoán.

## 延伸阅读

- [Intel SDM Volume 2, chapter 2, Instruction Format](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [System V AMD64 psABI, section 3.2, Function Calling Sequence](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Cytron et al., Efficiently Computing Static Single Assignment Form and the Control Dependence Graph, TOPLAS 1991](https://doi.org/10.1145/115372.115320)
- [Cooper, Harvey, Kennedy, A Simple, Fast Dominance Algorithm, 2001](https://www.cs.tufts.edu/~nr/cs257/archive/keith-cooper/dom14.pdf)
- [Cifuentes, Reverse Compilation Techniques, PhD thesis, QUT 1994](https://eprints.qut.edu.au/36820/)
- [Yakdan et al., No More Gotos, NDSS 2015](https://www.ndss-symposium.org/ndss2015/ndss-2015-programme/no-more-gotos-decompilation-using-pattern-independent-control-flow-structuring-and-semantics/)
- [Granlund, Montgomery, Division by Invariant Integers using Multiplication, PLDI 1994](https://doi.org/10.1145/178243.178249)
- [Lee, Avgerinos, Brumley, TIE, NDSS 2011](https://www.ndss-symposium.org/ndss2011/tie-principled-reverse-engineering-of-types-in-binary-programs/)
- [Noonan, Loginov, Cok, Polymorphic Type Inference for Machine Code, PLDI 2016](https://arxiv.org/abs/1603.05495)
- [LLM4Decompile, EMNLP 2024](https://arxiv.org/abs/2403.05286)
- [DecompileBench, Findings of ACL 2025](https://aclanthology.org/2025.findings-acl.1194/)
- [Liu, Raff, Micinski, When LLM Decompilers Recompile More and Preserve Less, 2026](https://arxiv.org/abs/2609.05370)
- [rea 6.5.0 Ghidra provider notes](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/ghidra-provider.md)
- 本课讨论的 rea 6.5.0 源码位于标签 `3b79af2`- Có thể là:`src/domain/functionComparisonDimensions.ts``website/evidence/dx-ball-sound-pan.md`
