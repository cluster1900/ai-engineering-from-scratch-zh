# 调用约定与:System V、Windows x64 和 AArch64

> 反汇编能显示 hàm đọc những ký 存器, nhưng chỉ có ABI nói rõ ý nghĩa của những ký 存器, còn ABI được quyết định bởi mục tiêu tài liệu đầu.

**Type:** Build
**Languages:** Python, C, x86-64 and AArch64 assembly
**Prerequisites:** Phase 13 · 32（从零构建 ELF）、Phase 13 · 33（反汇编与控制流）
**Time:** ~140 分钟

## Học mục tiêu

- 根据目标文件头选择调用约定:ELF x86-64 使用 System V psABI,COFF AMD64 使用 Microsoft x64,ELF AArch64 使用 AAPCS64,Mach-O arm64 使用 Apple 变体。
- Đối với mỗi ABI 字节 giải mã một hàm, sẽ mỗi lưu trữ寄存器 返回地址和指针定位到相对入口指针偏移──
- Từ hàm trước đọc sau viết寄存器推断参数寄存器, từ nhập指针 trên tải 推断参数槽。
- 区分 System V's Independent寄存器序列、Microsoft x64's Location Distribution槽, cũng như AAPCS64's NGRN và NSRN 计量器──
- Các quy định và quy tắc của mỗi kết luận và mã nguồn được ký kết, cũng như các trình biên dịch được`.pdata``.xdata`和 `.eh_frame`Trung tạo ra  triển khai dữ liệu hạt nhân
- So sánh Ghidra、IDA、Binary Ninja、radar2、rizin 和 angr 如何命名和恢复相同的事实,并记录输出与源码的差异──

## 问题

Anh là`-O2`Vì Linux x86-64 编译 `convention.c`, rồi hỏi radar2, 6.2.4,`eight_args`Có những yếu tố nào... nó trả lời bảy:`rdi``rsi``rdx``r8``r9``rsp+0x8``rsp+0x10`△C 源码 có 8 tham số △字节 chỉ có `leaq (%rdx,%rcx), %rax`中读取 `%rcx`Một lần, biến số của công cụ phục hồi đã bị mất chỉ xuất hiện trong địa chỉ ghi nhớ.

 Sau đó bạn mở cùng một file trong Rizin 0.9.1 Windows  cấu trúc. Nó sẽ được định báo cáo cho `amd64`, tìm thấy `r8``rcx``rdx`Và ba 槽── mục tiêu file là COFF, vì vậy định nghĩa là Microsoft x64, thứ tư ký 存器参数 là `r9`, 槽 nên có bốn... hai công cụ trong cùng mã nguồn bị bỏ lỡ các bộ lưu trữ khác nhau.

列表 là một chuỗi lệnh,调用约定则是单单之外的契约:哪些寄存器携带参数、哪些必须由调用者保留、返回地址和参数在哪里,以及调用者必须在指针上预留什么空间──四份文件定义本课程的契约:System V AMD64 psABI(版本 1.0,构建日期 2025 年 3 月 12 日) 节 3.2.1 至 3.2.3 节;Microsoft x64 调用约定 语句使用,序言和尾页面(页面日期 2018-12-17 至 2025-03-19);Arm AAPCS644 版 版 2026 年 1 月 23 日) 节 6.1 至 6.9 节;Apple应 64 平台说明──阅读这些规则,其规则文件用于编辑相同类文件的 C 编译器,构建器,存储,转换位置和转换 组的核心列表.

```figure
re-38-three-frames
```

## 文件头决定 sử dụng quy tắc nào

`convention.c`Có 12 hàm:`leaf_add``eight_args``mixed``by_value``big_ret``sum_varargs``keeps`, và 5 điều chỉnh cùng hình dạng .`extern`函数的调用者──结构体使用 `long long`, vì mục tiêu của MSVC `long`Đối với 4 chữ cái, mục tiêu khác là 8 chữ cái, trong khi cấu trúc lớn thay đổi sẽ thay đổi về định mệnh.`-target x86_64-unknown-linux-gnu``x86_64-pc-windows-msvc`和 `aarch64-unknown-linux-gnu`Các`-O0``-O2`, tái sử dụng`arm64-apple-macos`编译 `-O2`Không cài đặt Linux hoặc Windows 头文件, vì vậy nguồn tự tuyên bố nội dung cần thiết, chỉ chứa clang tự带的 `stdarg.h`和 `stddef.h`

`code/main.py`Trung `describe_object()`读取四字节魔数和一个机器字段, để xác định契约:

| 文件头 | 字段 | 值 | 规范 |
|---|---|---|---|
| `7f 45 4c 46` ELF | 偏移 0x12 的 `e_machine` | 62 | System V AMD64 psABI |
| `64 86` COFF | 偏移 0 的 `Machine` | 0x8664 | Microsoft x64 |
| `7f 45 4c 46` ELF | `e_machine` | 183 | AAPCS64 |
| `cf fa ed fe` Mach-O 64 | 偏移 4 的 `cputype` | 0x0100000c | 带 Apple 差异的 AAPCS64 |

Ba hợp đồng trên bảng dưới hầu hết đều khác nhau. Mỗi giá trị đều xuất phát từ bảng chỉ định tài liệu, và qua các bài kiểm tra hạt nhân.

| 规则 | System V psABI | Microsoft x64 | AAPCS64 |
|---|---|---|---|
| 整数参数 | `%rdi %rsi %rdx %rcx %r8 %r9`，取下一个空闲寄存器 | `RCX RDX R8 R9`，按位置 | `x0` 至 `x7`，按 NGRN |
| 浮点参数 | `%xmm0` 至 `%xmm7`，取下一个空闲寄存器 | `XMM0` 至 `XMM3`，按位置 | `v0` 至 `v7`，按 NSRN |
| 整数结果 | `%rax`，再 `%rdx` | `RAX` | `x0`，再 `x1` |
| 浮点结果 | `%xmm0`，再 `%xmm1` | `XMM0` | `v0` |
| 结果过大，寄存器装不下 | 地址通过 `%rdi` 传入，“如同第一个参数”，再通过 `%rax` 返回 | 指针通过 `RCX` 传入，参数向右移，通过 `RAX` 返回 | 地址放在 `x8`，不影响 `x0` 至 `x7` |
| 被调用者保存 | `%rbp %rbx %r12` 至 `%r15` | `RBX RBP RDI RSI RSP R12` 至 `R15`，`XMM6` 至 `XMM15` | `r19` 至 `r29`、`SP`、`v8` 至 `v15` 的低 64 位 |
| 入口处第一个栈参数 | `8(%rsp)` | `40(%rsp)`，位于 32 字节影子存储区上方 | `0(sp)` |
| 栈指针以下 | 128 字节红区 | “视为易失” | 无红区（Apple：128 字节） |
| 调用处对齐 | 入口处 `(%rsp + 8)` 为 16 的倍数 | 序言、尾声之外按 16 字节对齐 | `SP mod 16 = 0` |
| 可变参数标记 | `%al` 保存使用的向量寄存器数上界 | 浮点值同时复制到整数寄存器 | 无寄存器标记；Apple 使用 8 字节栈槽 |

## Hệ thống V: hai hệ thống đăng ký độc lập với vùng đỏ

psABI 3.2.3 sẽ phân loại từng tám phần tử của từng tham số thành INTEGER、SSE hoặc MEMORY, sau đó phân phối寄存器 từ hai danh sách không liên quan lẫn nhau.`%xmm0`至 `%xmm7`Nếu bất kỳ 8 chữ số của một số tham số nào đó không có ký hiệu có thể sử dụng, toàn bộ tham số sẽ được chuyển giao, trong số đó các tham số trong bộ nhớ sẽ được chuyển giao ngược (đến bên phải đến bên trái).

`eight_args(a, b, c, d, e, f, g, h)`Trong `-O2`下占 27 字节:

```text
      10: 48 01 fe                     	addq	%rdi, %rsi
      13: 48 8d 04 0a                  	leaq	(%rdx,%rcx), %rax
      17: 48 01 f0                     	addq	%rsi, %rax
      1a: 4c 01 c0                     	addq	%r8, %rax
      1d: 4c 01 c8                     	addq	%r9, %rax
      20: 48 03 44 24 08               	addq	0x8(%rsp), %rax
      25: 48 03 44 24 10               	addq	0x10(%rsp), %rax
      2a: c3                           	retq
```

Trước tiên sử dụng 6 bộ ghi nhớ, sau đó`8(%rsp)`和 `16(%rsp)`         `%rbp`Vì vậy, trong cơ sở, pSABI 图 3.3 sẽ đặt các bộ nhớ trong bộ nhớ`16(%rbp)`, tương đương với lối vào chưa được áp lực.`8(%rsp)``g`位于 8,`h`位于 16 ⋅

`mixed(int i, double d, long long l, float f)`展示两个列表──整数占用 `%edi`和 `%rsi`, tức là 1st, 2nd INTEGER 寄存器; đôi và float 占用 `%xmm0``%xmm1`, tức là thứ nhất, thứ hai SSE 寄存器, thứ nhất chỉ thị là`cvtsi2sd %edi, %xmm2`, trong số đó `%xmm2`là trước viết sau đọc của tạm thời ghi nhớ 若分析器把`cvtsi2sd`Ưu điểm của mục tiêu xem xét, sẽ được giả tạo ra thứ ba của các yếu tố浮点.`mixed` báo cáo`xmm0``xmm1``xmm2`của `(double arg1, double arg2, double arg3)`

`by_value(struct pair p)`将 16 字节结构体分成两个整体 八字节单元,通过 `%rdi``%rsi`传入,返回也使用两个寄存器:`leaq 0x1(%rdi), %rax; leaq -0x1(%rsi), %rdx; retq``big_ret(long long seed)`返回 32 字节, thuộc loại MEMORY ⋅psABI 规定调用者提供返回值空间,并将该存储地址通过 %rdi 作为第一个参数传递──于是`seed`移到 `%rsi`, hàm`movq %rdi, %rax`开始,因为返回时 %rax 应包含调用者通过 %rdi 传入的地址──

红区是系统 V的另一个特征──psABI 3.2.2 规则:%rsp 所指位置以下的128 字节区域视为保留,信号或中断处理器不得修改──在`-O0`下,`eight_args`先执行 `pushq %rbp; movq %rsp, %rbp`, tái hướng`-0x8(%rbp)`至 `-0x30(%rbp)`存储六次,没有 `subq`这些存储位于以下 48 字节内`sum_varargs`của `-O2` cấu trúc `subq $0x58, %rsp`Chia sẻ 88 chữ, rồi sẽ viết trong`-0x58(%rsp)`至 `-0x80(%rsp)`:                                                                                                                                                                                                                                                               `-mno-red-zone`构建同一文件后,`leaf_add`增加 `pushq %rax`和 `addq $0x8, %rsp`, sẽ 8 字节 局部变量放到指针上方

可变参数调用额外使用一个寄存器──%al 作为隐藏参数,指定已使用的向量寄存器数量,是0至8的上界──`call_varargs`Trong `-O2`用 `xorl %eax, %eax`设置 nó, trong `-O0`用 `movb $0x0, %al`设置──`sum_varargs`首先读取它:`testb %al, %al; je`Trong không sử dụng các máy lưu trữ khối lượng nhảy qua tám lần`movaps %xmmN`保存。

## Microsoft x64: phân phối theo vị trí √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ 

Microsoft quy tắc phân phối vị trí. 整数参数通过RCX、RDX、R8、R9 传入;浮点参数通过XMM0L、XMM1L、XMM2L、XMM3L 传入.`mixed`Đến lúc đó`%ecx``%xmm1``%r8``%xmm3`:槽 0 là số nguyên, vì vậy sử dụng `RCX`; Sòng 1 là gấp đôi, vì vậy sử dụng `XMM1`Hộp 3 là nổi, vì vậy sử dụng`XMM3``XMM0`和 `XMM2`Không có gì.

Người dùng cũng phải có không gian dự trữ. Người dùng luôn phải phân bổ đủ không gian để lưu trữ bốn ký ư ký tham số, ngay cả khi người dùng không có nhiều tham số như vậy.`0(%rsp)`Để quay lại địa chỉ,`8(%rsp)`至 `39(%rsp)`Vì bốn cái hố, thứ nhất là số lượng nằm ở`40(%rsp)``eight_args`Trong `-O2`读取 `0x28(%rsp)``0x30(%rsp)``0x38(%rsp)``0x40(%rsp)`, tức là 40、48、56、64。

调用者一侧展示了计算──`-O2`của `call8`先执行 `subq $0x48, %rsp`, tái sẽ 5 6, 7, 8  tồn tại`0x20(%rsp)`至 `0x38(%rsp)`, rồi thực hiện`movl $1, %ecx`等──72 字节 được tạo thành từ 32 字节影子区、32 字节的四个参数,以及使返回地址落在16 字节边界的8 字节组成──`call_varargs`Chỉ có số ký 存器, vẫn còn sử dụng`subq $0x28, %rsp`分配:32 字节影子区加8 字节对齐──`keeps`压入三个非易失寄存器(24 字节),再执行 `subq $0x20, %rsp`,让 `ext`获得返回地址下方的 32 字节影子区──

结构体 tuân theo quy tắc của mình.  bất kỳ装不进 8 字节,或大小不是1、2、4、8 字节参数,都必须按引用传递.`by_value`Trong `%rcx`n sau đó, qua `%rdx`接收结构体副本指针:调用者必须为返值分配内存,将指针作为第一个参数传入,其余参数向右移动一位──`call_pair`用 `movaps`Trong `0x20(%rsp)`构造副本, qua `leaq 0x20(%rsp), %rdx`传入副本, qua `leaq 0x38(%rsp), %rcx`传入结果缓冲区,再从 `0x40(%rsp)`读回 `.b`

Đây không có vùng đỏ. RRSP 当前地址 下所有内存都视为易失:操作系统,调试器, trong user调试会话, hoặc bộ xử lý bị gián đoạn có thể phủ kín bộ nhớ này.`-O0`của `leaf_add`需要 8 字节局部空间, qua lối vào `pushq %rax`和 `retq`前的 `popq %rcx`获取,使用两条单字节指令代替 `subq`和 `addq`                                                                                                                                                                                                                                                              

Các biến số được调用 sẽ đưa ký tự vào nhà 槽. Đối với các biến số hoặc không nguyên mẫu hàm, giá trị浮点 phải được sao chép đồng thời vào ký tự chung đối phó.`sum_varargs`Trong `-O2`Trước tiên thực hiện một lần `pushq %rax`,再将 `%rdx``%r8``%r9`存到 `0x18(%rsp)``0x20(%rsp)``0x28(%rsp)`, tức là chuyển hướng nhập 16、24、32, phân biệt là 2、3、4 槽 nhà của các tham số ký 存器.`va_list`Vì vậy`leaq 0x18(%rsp), %rax`,即 `%rdx`Địa ngục nhà, cũng là số không được đặt tên đầu tiên.

## AAPCS64, và sửa đổi của Apple

AAPCS64 6.8.2 Sử dụng hai bộ đếm từng条 ứng dụng quy tắc C.9  quy định số lượng toàn bộ các tham số sao chép đến x[NGRN] mức tối thiểu hiệu quả, sau đó tăng NGRN; C.1 đối với các tham số浮点 sử dụng NSRN làm tương tự xử lý C.12  quy định không vượt quá `8 - NGRN`个双字的复合类型复制到连续通用寄存器──C.13 规定 tham số một khi vào,NGRN 设为8, sau đó không trở lại通用寄存器──`eight_args`Sử dụng `x0`至 `x7`, không chạm vào 🏼`mixed`Vì vậy`w0``d0``x1``s1``by_value`                                                                                                                                                                                                                                                              `x0``x1`

6.9  quy định, nếu kết quả có thể qua寄存器传参,就通过相同寄存器返回;否则内存块地址应通过 x8 作为附加参数传入函数。`big_ret`写入 `str x0, [x8]``stur q0, [x8, #0x8]``str x9, [x8, #0x18]`, Từ không viết`x0``call_big`设置 `mov x8, sp`, và `seed` vẫn còn `x0`, vì 6.9 còn ghi rõ rằng người được调用 không cần phải giữ giá trị x8 trong, và`x8`Không phải là một trong những bộ lưu trữ số.

6.1.1  quy định:子程序调用必须保留寄存器 r19-r29 和 SP 的内容.6.4.5.2 规定 ở giao diện công cộng满足SP mod 16 = 0。为满递减,任何线程都不得读写其下面的非活动区域,因此 Linux `-O0`của `leaf_add`为 8 字节 局部变量生成 `sub sp, sp, #0x10`, và hệ thống V ở đây sử dụng vùng đỏ.

6.4.6 定义记录:上由两个64位值构成的记录......低地址双字应指向前一记录,高地址双字应包含进入当前函数时传入 LR的值──未规定记录在中的位置──clang 在此文件中显示两种位置──Linux`-O2`của `keeps`用 `stp x29, x30, [sp, #-0x30]!; mov x29, sp`sẽ ghi lại vào phần dưới; cùng hàm trong `-O0`用 `sub sp, sp, #0x20; stp x29, x30, [sp, #0x10]; add x29, sp, #0x10`Để nó lên trên đỉnh.

Apple arm64 nói giữ ký 存器 và đối với các quy tắc, sửa đổi 、红区及可变参数调用.`keeps`            `x22, x21, x20, x19`, sẽ ghi lại trên:`stp x29, x30, [sp, #0x20]; add x29, sp, #0x20`                                                                                                                                                                                                                                                              `-O0`叶函数 vẫn được tạo ra`sub sp, sp, #0x10`, vì vậy默认不使用红区──可变参数 phân chia thành 8 字节槽,va_list 类型是 char* 的别名──Apple 上`call_varargs`Để 10 20, 30 存入`[sp]``[sp, #8]``[sp, #0x10]`, chỉ truyền `w0`;Linux 构建传 `w1``w2``w3`,并以`b extva`尾调用──Apple của `sum_varargs`sẽ`add x8, sp, #0x10`,即调用者指针, như là`va_list`;Linux của `sum_varargs`sẽ`x1`至 `x7``q0`至 `q7`保存到 224 字节中,并通过 `mov x8, #-0x38; movk x8, #0xff80, lsl #32`将结构字段 `__gr_offs`-56`__vr_offs`Đổi đầu là -128

符号也不同──Mach-O 为每一个C符号添加`_`前, vì vậy清单显示 `_keeps`, hàm thứ nhất xuất hiện trong Private Label`ltmp0`下──分析器通过符号表重命名标签──

## 三次手动解码 hàm số

`keeps(int n)`Trong vòng tròn`ext(i)`, cần phải xuyên调用 giữ `n``i`和 `acc`, vì vậy mỗi loại ABI đều phải lưu trữ寄存器.`-O2`构建的起始字节──

Hệ thống V,共 4 字节:

1. `55`                                                                                                                                                                                                                                                              `push r64`- Có thể là:`50 + 5`,即 `%rbp` độ sâu là 8,`%rbp`Ưu điểm nhập cảnh -8
2. `41 56`- Có thể là:`41``B`của REX,`56` `50 + 6`REX.B sẽ mở rộng đến 14 ngày:`pushq %r14`, vị trí -16
3. `53` `50 + 3`- Có thể là:`pushq %rbx`, vị trí -24

三次压共 24 字节,再加返回地址的 8 字节,32 là 16 的倍数, do đó trong vòng lặp `callq ext`Không cần thiết`subq`Không có gì ở đây.`movq %rsp, %rbp`, vì vậy nên xây dựng không có chỉ số.`%rbp`用作保存 `acc`                                                                                                                                                                                                                                                              `xorl %ebp, %ebp``addl %eax, %ebp`──尾声是镜像操作:`5b 41 5e 5d c3`

Microsoft x64,共 7 字节:

1. `56`-8 của vị trí`pushq %rsi`- Tôi không biết.`57`      `pushq %rdi`- Tôi không biết.`53`-24 của vị trí`pushq %rbx` Người dùng trong đó là người không dễ bị mất tích, và`RDI`和 `RSI`Trong Hệ thống V 下曾是参数寄存器──
2. `48 83 ec 20`:REX.W、带 8 位立即数操作码 `83 /5`, ModRM `ec`Vì vậy`11 101 100`,即 `subq $0x20, %rsp` độ sâu là 56

56 加返回地址等于 64,满足对齐──32 字节就是应提供给`ext`后接零个或多个 8字节寄存器弹,再接回或 jmp;实际字节为`48 83 c4 20 5b 5f 5e c3`

AArch64,四个字共 16 字节,小端:

1. `a9bd7bfd`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `stp` Bước 31:30 của `10`选择 64 位寄存器,位 25:23 的 `011`选择预索引,位 22 为 0 表示存储.位 21:15 的 imm7 为 `1111010`, tức -6, nhân bằng 8 lấy -48──位 14:10 của Rt2 là 30,位 9:5 của Rn là 31(`sp`),位 4:0 của Rt 为 29。`stp x29, x30, [sp, #-0x30]!`Làm cho chỉ số giảm 48, sẽ`x29`存到-48`x30`存到 -40:
2. `f9000bf5`là có không có biểu tượng 12 điểm chuyển động, theo 8 缩放`str`Đọc từ: 21:10 của imm12 为 2,Rn 为 `sp`, Rt vì 21...`str x21, [sp, #0x10]`Đối với sự chuyển động nhập khẩu -32
3. `910003fd`là số ngay lập tức`add`:imm12 为 0,Rn 为 `sp`, Rd vì 29`mov x29, sp`让指针指向 -48 处的记录──
4. `a9024ff4`Có dấu hiệu chuyển động `stp`:imm7 为 4,缩放为 32;;Rt2 为 19,Rt 为 20;;`stp x20, x19, [sp, #0x20]`sẽ`x20`Đặt -16,`x19` đặt -8

共 48 字节:`x29`位于 0,`x30`位于 8,`x21`位于 16,24 处有 8字节填充,`x20`位于 32,`x19`位于 40。记录的低地址字指向前一记录,下一个字保存 LR,符合 6.4.6。`cmp w0, #0x1`位于第一、第二次存储之间, là điều chỉnh sẽ chuyển nó vào các lệnh; phân tích cho phép các lệnh so sánh hoặc toán học xuất hiện giữa các lệnh.

## 编译器 sẽ viết hai lần cùng một sự thật

序言解析 là một cách dẫn xuất. 编译器 cũng để tạo ra một biểu hiện khác, hai thứ phải phù hợp.

Phương thức thứ hai của Windows trên là `.pdata`和 `.xdata`❖ Không带`-fno-asynchronous-unwind-tables` xây dựng `-O2`目标文件,`llvm-objdump -h`显示 `.xdata`为 0x34 字节,`.pdata`为 0x48 字节──0x48 即 72,对应六条 12 字节的`RUNTIME_FUNCTION`, mỗi条带三个 `IMAGE_REL_AMD64_ADDR32NB`重定位──六个函数是 `sum_varargs``keeps``call8``call_varargs``call_pair``call_big` Nếu tìm thấy không đến hàm表条目,则假定代码属于叶函数,RSP 直接指向返回指针

`keeps`của `.xdata`字节为 `01 07 04 00 07 32 03 30 02 70 01 60``UNWIND_INFO`开头的3位是版本,随后的5位是旗:版本为1,无标志;;sizeOfProlog为7,CountOfCodes为4,FrameRegister 和 FrameOffset 均为0──每条`UNWIND_CODE`包含 một phần mở đầu trong chuyển động, cũng như một phần mã hóa mã hóa và thông tin.`07 32`Trong chuyển động 7 处,操作码 2 là `UWOP_ALLOC_SMALL`,信息值 3 表示 `3 * 8 + 8 = 32`字节。`03 30`:操作码 0 是 `UWOP_PUSH_NONVOL`,寄存器编号 3 là `rbx``02 70`- Có thể là:`rdi``01 60`- Có thể là:`rsi` Những mã này theo thứ tự thực hiện, mô tả 3 áp suất hoạt động và 32 chữ cái phân phối và`56 57 53 48 83 ec 20`字节完全一致──`sum_varargs`条目为`01 01 01 00 01 02 00 00`:1 字节序言,包含一条编码, tức là phân phối 8 字节的 `UWOP_ALLOC_SMALL`Đó là cái nhìn của một cái máy.`pushq %rax`Một lần phân phối, vì `%rax`Đây là một hệ thống ghi nhớ dễ bị mất, đây không lưu trữ giá trị của hệ thống ghi nhớ.

Trong Linux, đường dẫn thứ hai là`.eh_frame`, nó được định nghĩa bởi PSABI 4.2.4, và được định lập bởi DWARF 5 Mục 6.4 节 `llvm-dwarfdump --eh-frame`, sẽ in một FDE cho mỗi hàm,并解析 `R_X86_64_PC32`重定位, do đó, phạm vi địa chỉ được nhận được có thể được sử dụng trực tiếp.`keeps`- Có thể là:

```text
  DW_CFA_def_cfa_offset: +16
  DW_CFA_def_cfa_offset: +24
  DW_CFA_def_cfa_offset: +32
  DW_CFA_offset: RBX -32
  DW_CFA_offset: R14 -24
  DW_CFA_offset: RBP -16
```

CFA là điều chỉnh trước của chỉ số, so với nhập khẩu chỉ số cao hơn 8, do đó`RBP -16`đối với chuyển động nhập khẩu -8,`R14 -24`đối với -16,`RBX -32`Đối với -24, và sâu nhất CFA 偏移 32 là 24 字节加上返回地址──Aarch64 上 `keeps`của FDE  viết `DW_CFA_def_cfa: W29 +48`,并列出 `W29 -48``W30 -40``W21 -32``W20 -16``W19 -8`CFA ở đây chính là chỉ số nhập cảnh, vì vậy những chuyển động này không cần phải được chuyển đổi là chuyển động;`x29`为基准定义:`eh_frame_cross_check()`Tôi sẽ so sánh tất cả 12 FDE của hai tài liệu mục tiêu riêng của mình.`call8`Trong một hàm, áp lực vào hai thông số truyền, do đó độ sâu nhất CFA chuyển động là 32, trong khi đầu tiên là 8; kiểm tra khi so sánh là độ sâu nhất của chỉ số trong hàm đạt 24, cộng thêm 8:

## Các công cụ làm thế nào để gọi những khái niệm này

Mỗi công cụ trong lĩnh vực này có cấu trúc dữ liệu được định định, cũng có quá trình phân tích được định định định để phân phối các hàm.

**Ghidra 12.1.4（Apache-2.0）。**规则位于 SLEIGH 语言定义旁的编译器规格文件 `.cspec`Ở giữa.`x86-64-gcc.cspec`声明了名为 `__stdcall`của `<default_proto>`,注明源自 2016 年 4 月的 System V Application Binary Interface AMD64 Architecture Processor Supplement──它使用 `<pentry>`列表指定 `XMM0_Qa`Đến`XMM7_Qa`Và `RDI, RSI, RDX, RCX, R8, R9`,条目 từ偏移 8 开始,为不超过16 字节的类型提供 `join_dual_class`规则,输出为 `XMM0_Qa, XMM1_Qa, RAX, RDX`, còn lại sử dụng`hidden_return``x86-64-win.cspec` tuyên bố `__fastcall`, dùng bốn .`<group>`元素将 `XMM0_Qa`Với`RCX``XMM1_Qa`Với`RDX`等逐一配对, đây chính là quy tắc phân phối theo vị trí; 条目 từ chuyển hướng 40 开始, đối với 3 ̊5 ̊6 ̊7 字节 sử dụng cấu trúc`convert_to_ptr`,注释写着 chỉ có cấu trúc nhỏ 8、16、32、64 bit để được lắp vào hồ sơ;`unaffected`列出 `RBX RBP RDI RSI RSP R12`Đến`R15`Và `XMM6`Đến`XMM15`, chuyển hướng từ 8 đến 39 `localrange`Đó là khu lưu trữ bóng tối.`AARCH64.cspec` tuyên bố `__cdecl`, thứ nhất là có`storage="hiddenret"`của `x8`, sau đó là`q0`Đến`q7`和 `x0`Đến`x7`; đối với 17 字节及以上的结构体使用 `convert_to_ptr`- Tôi không biết.`killedbycall`包含 `x8`,注释写着间接结果位置寄存器,未体现在 pentry 列表中──反编译器的最后阶段名为建立函数的原型;分析器名为Call Convention ID和Decompiler Parameter ID;程序选项原型评估选择默认模型──

**IDA Pro 和 IDA Free（Hex-Rays，商业软件；当前版本 9.4，构建号 9.4.260714）。**函数类型是通过 SetType 设置的C 声明,IDA会使用类型信息,在反汇编中添加函数参数信息注释──标准约定无法表达位置使用 IDA 自己的约定书写:`int __usercall func@<ebx>(int x, int y@<esi>)`Kết quả sẽ được đưa vào`EBX`,将 `y`放入 `ESI`-`@<^12.4>`则通过偏移和大小指定位置──`__userpurge`Cùng với nó, nhưng được người dùng giải quyết.`__spoils`, cũng như biểu hiện các yếu tố ẩn của việc khôi phục công việc trong lớp`__hidden``__return_ptr`和 `__struct_ptr`△反编译器的Dekompile như call操作允许为单条指令指定 `__usercall`原型──IDA Free 仅支持 x86 和 x86-64──

**Binary Ninja 6.0“Krypton”（Vector 35，商业软件；另有可反编译 x86、x86_64、ARMv7 和 AArch64 的 Free 版本）。** `Platform` bao gồm tất cả các thông tin liên quan đến môi trường thực hiện thứ hai, chủ yếu là sử dụng quy định, hệ điều hành và cấu trúc, danh sách các nền tảng bao gồm `linux-x86_64``windows-x86_64``linux-aarch64`和 `mac-aarch64`, mọi nền tảng đều có .`default_calling_convention``CallingConvention`包含 `int_arg_regs``float_arg_regs``callee_saved_regs``caller_saved_regs``int_return_reg``high_int_return_reg``float_return_reg`, và hai dấu hiệu khác biệt trực tiếp được mã hóa trong bài học này:`arg_regs_share_index`biểu hiện  vì True 时, bất kể các số tử loại nào, số tử thứ hai sẽ chiếm vị trí thứ hai trong danh sách các số nguyên và các điểm ký 存器;`stack_reserved_for_arg_regs`表示Windows x64 调用约定使用的影子/归位空间──`eligible_for_heuristics``required_arg_regs`和 `required_clobbered_regs`驱动其启发式调用约定检测──平台类型是 `types/platform/`下的C 头文件, mỗi nền tảng tên đối ứng với một tài liệu.

**radare2 6.2.4（LGPL-3.0，本课已实际运行）。** `afcl`列出架构插件已知的调用约定:x86-64 下为 `amd64 amd64syscall dlang golang golang_abi0 ms p9 reg swift`,Aarch64 下为 `arm64 dlang golang p9 reg swift``afc` báo cáo hiện tại của hàm调用约定,`afcr`打印从 `cc.amd64.arg0: rdi`Đến`arg5: r9`Và `ret0: rax`                                                                                                                                                                                                                                                              `cc-ARCH-BITS.sdb`của SDB 文件中──radare2 为 ELF 目标文件选择 `amd64`,为 COFF 目标文件选择 `ms`, sự phân biệt này là đúng.`afv`列出参数 và biến thể,`afs`打印签名── đối với Linux `-O2`目标文件,`afv`Vì vậy`eight_args`Tìm được 7 số, bỏ qua rồi.`rcx`Đối với Windows 目标文件, nó đã tìm thấy `rcx, rdx, r8`Và bốn cái hố, bị bỏ đi.`r9`Hai bộ nhớ bị mất chỉ xuất hiện.`lea`内部── đối với `mixed`, nó trên Linux báo cáo `double arg1 @ xmm0, arg2 @ xmm1, arg3 @ xmm2`, trên Windows trên không có báo cáo tham số. Đối với AArch64, nó là`eight_args`找到了 `x0`Đến`x7`; đối với `big_ret`则列出 `x0`和 `double arg2 @ d1`, và hàm thực tế được đọc là `x8`, và sẽ có một lượng tải thường xuyên đến`q1` Mỗi người `afs`签名都以 `void`开头, vì công cụ không xác định trở lại loại.`-O0`Này, mỗi phần tử đều lưu trữ,`afv`Vì vậy tìm thấy`eight_args`Tất cả tám tham số, trong đó hai tham số nằm ở`rbp+0x10`和 `rbp+0x18`

**rizin 0.9.1（LGPL-3.0，本课已实际运行）和 Cutter 2.5.0。** `afcl`列出 `amd64 amd64syscall ms reg swift``afc`Đối với COFF  mục tiêu tài liệu trở lại `amd64`, giải thích Microsoft 配置 mặc dù tồn tại, nhưng không được chọn theo định dạng tài liệu.`afi`Đối với Linux trên `eight_args`Đặt ra 7 yếu tố, cũng bị bỏ lỡ.`rcx`; đối với Windows 则列出 `r8, rcx, rdx`Và ba cái cái, đã bị bỏ rơi.`r9`, cũng bị bỏ rơi`0x40`处的槽位──`afv`Không tồn tại; lệnh biến số列出 là `afvl`Cút là hình ảnh của rizin.

**angr 10.0.3（BSD-2，本课已实际运行）。**先运行 `CFGFast`,再运行 `CompleteCallingConventions(recover_variables=True)`, sẽ theo hình thức 2`function.calling_convention`设为 `SimCCSystemVAMD64``SimCCMicrosoftAMD64`Hoặc`SimCCAArch64`,并将 `function.prototype`设为一个签名. Nó được phục hồi trên ba nền tảng mục tiêu.`eight_args`Tất cả tám phần tử; sẽ x86-64 lên `big_ret`                                                                                                                                                                                                                                                              `(BOT*, long long) -> BOT*`,将 Windows 上 `by_value`按引用传递的结构体恢复为 `(BOT*, BOT*) -> BOT*`,将 System V 下的可变参数函数 `sum_varargs`恢复为 `(long long, ...)`nếu của nó với radar2 khác nhau: Hệ thống V và AArch64 上的 `mixed`Thành phố được phục hồi`(long long, long long, double, float)`,寄存器 đúng nhưng thứ tự sai, vì toàn bộ danh sách được in trên danh sách浮点 trước;AArch64 上的 `big_ret`Được phục hồi`(long long) -> double`- Nói cho tôi biết nó đã bị lạc rồi.`x8`约定,并将向量存储操作误读为结果;AArch64 上的 `sum_varargs`则被恢复为16参数,也就是整个寄存器保存区──

**其他工具。**Hopper 6.6.0 là một máy tính phản biên dịch và phản biên dịch thương mại của macOS và Linux; bài học này chưa được chạy hoặc ghi lại các điều kiện xử lý thông qua của nó.`frame info`和 `register read`显示实时, đây là phương pháp quan sát động thái của cùng một nhóm chuyển động.                                                                                                                                                                                                                                                     

| 概念 | Ghidra | IDA | Binary Ninja | radare2 / rizin | angr | 本课 |
|---|---|---|---|---|---|---|
| 调用约定对象 | `.cspec` 中的 `prototype` | 函数类型中的调用约定关键字 | `Platform` 上的 `CallingConvention` | `afc` 名称、`cc-ARCH-BITS.sdb` | `SimCC` 子类 | `expected_locations(abi, name)` |
| 各目标平台的默认约定 | 每个 cspec 的 `<default_proto>` | 编译器设置 | `Platform.default_calling_convention` | `afc=`、`anal.cc` | 按格式选择 | `describe_object()` |
| 参数寄存器 | `<pentry>` 列表，用 `<group>` 表示按位置分配 | `__usercall` 中的 `@<reg>` | `int_arg_regs`、`float_arg_regs`、`arg_regs_share_index` | `cc.NAME.argN` | `ARG_REGS`、`FP_ARG_REGS` | `INT_ARG_REGS`、`FLOAT_ARG_REGS` |
| 影子存储区 | `localrange` 的栈偏移 8 到 39 | 隐式处理 | `stack_reserved_for_arg_regs` | `cc.ms.argn=stack` | `STACKARG_SP_DIFF` | `STACK_ARG_BASE[WIN64] = 40` |
| 隐藏结果指针 | `hidden_return`、`storage="hiddenret"` | `__return_ptr`、`__hidden` | 返回类型大于 `int_return_reg` 的容量 | 未建模 | 第一个参数为 `BOT*` | `HIDDEN_RETURN_REG` |
| 被调用者保存寄存器 | `<unaffected>` | `__spoils` 列出相反的集合 | `callee_saved_regs` | 配置文件 | `CALLEE_CLEANUP` 和架构 | `CALLEE_SAVED` |
| 为函数指定约定 | “Call Convention ID”分析器、“Establish Function's Prototype” | 用户或类型库 | 使用 `required_arg_regs` 做启发式检测 | `afc`、`afva`、`aaft` | `CallingConventionAnalysis` | 先读后写分析加规范规则 |

## 动手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/38-calling-conventions-and-stack-frames
python3 code/main.py
```

输出 là một báo cáo JSON. Đối với mỗi trong bảy tệp mục tiêu, nó liệt kê định dạng, loại máy và ABI; cho mỗi trong 12 hàm, nó cung cấp các ký tự đầu tiên, ký hiệu được lưu giữ và sự lệch nhập của nó,  kích thước,  chỉ số, ký hiệu tham số,  chỉ số chuyển hướng, tràn ra vị trí lưu trữ, quay lại ký hiệu hoặc chỉ số ẩn, độ sâu gọi, cũng như các ký hiệu và hoạt động lưu trữ được sử dụng để truyền các ký hiệu.

预期结构:

```json
{
  "objects": {
    "convention-x86_64-windows-O2": {
      "format": "COFF", "machine": "AMD64", "abi": "Microsoft x64", "checks": "73/73 agree",
      "functions": {
        "keeps": {
          "prologue": ["56  pushq %rsi", "57  pushq %rdi", "53  pushq %rbx", "48 83 ec 20  subq $0x20, %rsp"],
          "frameBytes": 56,
          "savedRegisters": [{"register": "rsi", "entryOffset": -8}, {"register": "rdi", "entryOffset": -16}, {"register": "rbx", "entryOffset": -24}],
          "parameterRegisters": ["rcx"],
          "returnRegisters": ["rax"],
          "calls": [{"callee": "ext", "depth": 56}],
          "checks": [{"rule": "Microsoft x64: the caller must always allocate ...", "expected": "at least 32 bytes ...", "observed": [56], "agree": true}, "..."]
        }
      }
    }
  },
  "sehCrossCheck": ["..."],
  "ehFrameCrossCheck": {"...": "..."}
}
```

按以下顺序阅读 `code/main.py`- Có thể là:

1. `describe_object()`读取 ELF、COFF hoặc Mach-O 头部及符号表, trả về ABI 和函数列表。
2. `parse_listing()`sẽ`llvm-objdump -d -r`文本分成函数,保留每个调用和跳转的重定位目标,并按应对语法标记删除注释:AT&T 使用 `#`,Aarch64 使用 `//`和 `;`, bởi vì người sau `#`Để đưa ra số ngay lập tức.
3. `effect_x86()`和 `effect_arm()`Để chuyển một lệnh thành đọc, địa chỉ đọc, ghi, tải, lưu trữ và tăng chỉ số. Số cuối cùng của AT&T là số hoạt động mục đích. Số hoạt động đầu tiên của AArch64 là số hoạt động mục đích, lưu trữ, so sánh và phân đoạn chỉ dẫn trừ.`lea`读取地址, nhưng không tải bất cứ nội dung nào.`mov``cvtsi2sd``setcc`和清零惯例法 `xor r, r`Mục đích của các hoạt động là viết không đọc.`sp`, sau lựa tải ếch sau khi truy cập di chuyển nó.
4. `analyze_function()`Để các hàm được trải qua một lần, cho đến khi gặp người đầu tiên.`ret`Nó theo dõi độ sâu của di chuyển của chỉ số so với giá trị nhập xuống, do đó số lượng bộ nhớ hoạt động`disp(%rsp)`                                                                                                                                                                                                                                                              `disp - depth`, và `disp(%rbp)`      `frame_pointer + disp`Nó ghi lại các ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu ký hiệu
5. `_return_registers()`Sẽ giữ lại trước khi xuất hiện cuối cùng của truy cập để đăng nhập kết quả寄存器.`big_ret`Trung,`movq %rcx, %rax`后通过 `(%rax)` lưu trữ,`rax`仍被保留为候选结果寄存器──
6. `expected_locations()`Các quy tắc được áp dụng cho các hệ thống C: hai danh sách của hệ thống V với 8 chữ cái phân loại, các cấu trúc của Microsoft với các cấu trúc chuyển giao theo tham khảo, cũng như các máy tính của AAPCS64 và được sử dụng với kết quả lớn hơn 16 chữ cái.`x8`
7. `run_checks()`Bước 2: Các quy tắc: được ghi vào được ghi nhớ phải được ghi nhớ trước; mỗi lần ghi nhớ phải được đáp ứng`(rsp + 8) % 16 == 0`Hoặc`sp % 16 == 0`; mỗi lần Microsoft 调用都必须有32字节影子空间;Microsoft 和 AAPCS64 下不得访问指针下方,System V 下最访问其下方 128字节;尾声必须与序言对应,并将指针恢复到输入值──
8. `seh_cross_check()`和 `eh_frame_cross_check()`读取未使用 `-fno-asynchronous-unwind-tables` Bước:                                                                                                                                                                                                                                                             

Có ba lệnh khác.`python3 code/main.py analyze convention-x86_64-windows-O2 keeps`打印单个函数──`python3 code/main.py object FILE`打印 dựa trên phán quyết của đầu người.`python3 code/main.py seh`打印 mỗi có `UNWIND_INFO`Kết quả giải mã của hàm:

##  thực tế sử dụng

Đối với các tài liệu mục tiêu mới bạn xây dựng, hãy sử dụng phân tích theo thứ tự sau đây:

1. 运行 `python3 code/main.py object FILE.o`,记下它给出的ABI──如果头部与构建命令不一致,先停下来; cả hai đều phải có một bất đối.
2. Trong mục tiêu lưu trữ `llvm-objdump -d -r FILE.o`                                                                                                                                                                                                                                                              `sub`Để xem.
3. 根据源码签名核对参数寄存器和偏移――签名无法解释寄存器可能是隐藏指针、可变参数标记,或被分析器误判为参数的临时寄存器――最后一个情况属于命令效表的缺陷,应用于该命令的一般规则修复――
4. Nếu có kết quả kiểm tra không phù hợp, từng lần đọc. Mỗi lần kiểm tra đều ghi nhận các quy tắc dựa trên nó, do đó, trước tiên kiểm tra quy tắc, kiểm tra lại, kiểm tra cuối cùng phân tích.
5. Nếu các tài liệu mục tiêu có dữ liệu mở, các kiểm tra giao thông, hai con đường dẫn tương thích, là bằng chứng mạnh nhất mà bài học này có thể cung cấp.
6. Nếu cài đặt các công cụ khác, ghi lại lệnh chính xác và các lệnh xuất và so sánh. Có 3 đoạn đường dẫn được xác định với nhau; không nhất trí sẽ đưa ra một bộ ghi chép cụ thể và một đoạn hướng dẫn cụ thể để kiểm tra, đây là một phát hiện được nói trong bài học 35.

## 交互实验

### 实验 A: 一条命令,三种效果

Trong `code`目录中启动 Python:

```bash
cd phases/13-tools-and-protocols/38-calling-conventions-and-stack-frames/code
python3 -q
```

运行:

```python
from main import *
effect(Instruction(0, "48 8d 04 0a", "leaq", "(%rdx,%rcx), %rax"), SYSV)
effect(Instruction(0, "f2 0f 2a d7", "cvtsi2sd", "%edi, %xmm2"), SYSV)
effect(Instruction(0, "a9bd7bfd", "stp", "x29, x30, [sp, #-0x30]!"), AAPCS64)
```

Mỗi lần调用前, trước viết down bạn dự kiến đọc 读取 地址读取 写入和增量―然后使用 `ldp`,将 `[sp, #-0x30]!`改为 `[sp], #0x30`, để xem tăng trưởng từ `sp_delta`移到 `post_sp_delta`

### 实验 B: giữ của

```python
info, listing = load_fixture("convention-aarch64-linux-O2")
keeps = analyze_function("keeps", listing["keeps"], info.abi)
keeps.saved
keeps.frame_pointer
[c.to_dict() for c in frame_cells(keeps)]
```

Để phân tích kết quả của việc làm trên.`convention-arm64-macos-O2`Không vận hành cùng một bộ mã;  ghi chép sẽ di chuyển đến -16, bốn ký 存器 nằm bên dưới nó.`convention-x86_64-linux-O2-fp`, xem `keeps`của `saved`Đánh dấu quay lại, đồng thời xuất hiện một bài báo.`pushq %rax`, tác dụng duy nhất của nó là để điều chỉnh thời gian .`(rsp + 8)`成为 16 的倍数──

### 实验 C:mixed 的先读后写分析

```python
info, listing = load_fixture("convention-x86_64-linux-O2")
mixed = analyze_function("mixed", listing["mixed"], info.abi)
mixed.param_registers
mixed.return_registers
expected_locations(SYSV, "mixed")["parameters"]
expected_locations(WIN64, "mixed")["parameters"]
```

Hệ thống V của danh sách`rdi, xmm0, rsi, xmm1`, Microsoft's danh sách`rcx, xmm1, r8, xmm3`△ hiện tải Windows 目标文件, chạy lại                                                                                                                                                                                                                                                          `[afv mixed]`: 3 đôi. Tìm ra dẫn đến 3 đôi.

### 实验 D:展开器的第二部分判断

```python
for row in seh_cross_check():
    print(row["function"], row["sizeOfProlog"], row["unwindPushes"], row["unwindAllocBytes"], row["agree"])
for row in eh_frame_cross_check("convention-x86_64-linux-O2-eh"):
    print(row["function"], row["cfiSaved"], row["cfiMaxOffset"], row["deepestStack"], row["agree"])
```

Trong SEH 表中 tìm thấy`sum_varargs`của `pushq %rax`, giải thích tại sao mở mã sẽ ghi lại để phân phối.`.eh_frame`表中找到 `call8`, giải thích trong số đó 32:.

## 实践实验

添加第四目标平台和第四套规范──

要求:

- Sử dụng `-target x86_64-apple-macos -O2`编译 `convention.c`,并记录汇编清单――扩展 `describe_object()`, make it读取 Mach-O của `cputype`0x01000007,并映射到 Apple 在 x86-64 上后的系统 V psABI,同时处理 `_`符号前──
- 检查每个函数是否通过系统 V 检查――记录你在序言中发现的唯一差异:Darwin trong tất cả các cấp độ tối ưu hóa đều giữ  chỉ số――
- 添加使用 `-fstack-protector-strong`构建的Linux x86-64 目标文件──扩展序言扫描,将从 `%fs:0x28`Lưu trữ các biến động địa phương dưới đây và ghi lại các hoạt động của nó`canary`单元,并将 `ret`PreviousBản ghi chép so sánh để kiểm tra kết thúc bảo vệ
- Thêm một bài kiểm tra, đảm bảo khi kho lưu trữ được dự định là để lưu trữ các tham số, bài kiểm tra sẽ thất bại.
- Trong vận hành phân tích trước, thủ công viết ra `with_canary`风格代码的布局,并将图像与测试放在一起.

Định nghĩa thành công là:`python3 code/main.py` báo cáo tất cả các kiểm tra của các tài liệu mục tiêu mới đều phù hợp, và các đơn vị của hàm được bảo vệ cho thấy con số nằm giữa biến động địa phương và các bộ lưu trữ được lưu trữ.

## 本课产物

本课提供 `outputs/skill-calling-conventions-and-stack-frames.md` sử dụng nó, sẽ xây dựng các mục tiêu tài liệu, các bảng xếp hạng và C  chữ ký chuyển thành vị trí tham số, thiết kế, quay lại ký gửi, và từng dự án kiểm tra để xác định liệu nó phù hợp với các quy tắc dựa trên và dữ liệu mở được tạo bởi trình biên dịch.`cvtsi2sd`Hoặc`xor r, r`Mục đích của các hoạt động được xem như đọc, và lần đầu tiên phát hiện ra không phù hợp dừng lại.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/38-calling-conventions-and-stack-frames
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明:

- 七个目标文件的ELF、COFF 和 Mach-O 头部对应 Hệ thống V、Microsoft x64、AAPCS64 和 Apple arm64
- Mỗi mục tiêu văn bản có danh sách 12 hàm tương tự, và chính xác xử lý Mach-O của `_`前和 `ltmp0`标签
- 汇编清单解析器保留 `ext`作为调用目标,并完整保留 `#-0x30`等 AArch64 立即数
- `leaq (%rdx,%rcx), %rax`读取两个地址寄存器而不加载数据;`xorl %eax, %eax`和 `cvtsi2sd`                                                                                                                                                                                                                                                              `stp`Trong kho trước chuyển động `sp`, 后索引 `ldp`则在加载后移动它
- `-O2`下的 `keeps`Trong hệ thống V lên`55 41 56 53`开头,为24字节且没有指针;在微软 x64 上以`56 57 53 48 83 ec 20`开头,为 56 字节; 在 AArch64 上首先出现 `a9bd7bfd`, ghi chép nằm ở -48
- Apple sẽ đặt ghi chép lên -16, nằm trên bốn bộ lưu trữ
- Mỗi hàm trên Linux là `-O0`Có chỉ số, trong`-O2`下则没有;`-fno-omit-frame-pointer`Sẽ phục hồi chỉ số, và mang lại cho hoạt động áp lực phù hợp
- `-O0`叶函数在 System V 下使用 8 字节红区,在 Microsoft x64 下使用 `pushq %rax`, trong AAPCS64 下使用 `sub sp, sp, #0x10`-`-mno-red-zone`会消除红区使用
- Mỗi kết thúc đều có phần đầu tiên đối phó, chỉ số trở lại giá trị nhập khẩu
- Trong hai cấp độ tối ưu hóa,`eight_args`Đọc cách khác nhau 6 ký 存器及偏移 8、16槽位, 4 ký 存器及偏移 40 đến 64槽位, hoặc`x0`Đến`x7`
- `mixed`Trong hệ thống V 下使用 `rdi, xmm0, rsi, xmm1`, trong Microsoft x64 下使用 `rcx, xmm1, r8, xmm3`, cả hai đều dùng`xmm0`返回结果
- 16 字节 cấu trúc体在 System V 和 AAPCS64 下通过两个寄存器传递,在 Microsoft x64 下则在隐藏指针后按引用传递
- 32 字节 cấu trúc体通过 `rdi``rcx`Hoặc`x8` quay lại
- 可变参数被调用者会读取 `%al`,将 `rdx, r8, r9`归位到 16、24、32,保存 `x1`Đến`x7`和 `q0`Đến`q7`, hoặc chỉ dẫn người dùng trên Apple
- 调用器设置预期寄存器, sẽ 7 和 8 存到偏移 0 和 8, hoặc sẽ 5 到 8 存到偏移 32 到 56; trong các tham số có thể biến调用前清零 `%al`,并通过 `rdi``rcx`Hoặc`x8`传递结果缓冲区地址
- Tất cả 489 điều tra đều phù hợp với quy tắc của riêng mình
- 六个 `UNWIND_INFO`条目与序言解析结果相合, hàm 叶则没有这些条目
- 24 FDE phù hợp với vị trí của các ca khâu lưu trữ và vị trí sâu nhất
- 工具输出记录包含雷达2 的 `amd64`和 `ms`✓ Rizin cho các tài liệu mục tiêu của COFF`amd64`、 bỏ đi `rcx`、三个 đôi, cũng như các nguyên mẫu của angr
- 嵌入站点模块图像数据与分析器输出相等

## Mô hình thất bại trong môi trường sản xuất

| 失败情况 | 能力不足的工具会报告什么 | 分析必须证明什么 |
|---|---|---|
| 将 COFF 目标文件按 System V 读取 | 将函数从未读取的 `rdi` 和 `rsi` 视为参数 | 头部给出 0x8664；调用约定是 Microsoft x64 |
| 寄存器只在 `lea` 内被读取 | 为八参数函数报告七个参数 | 基址和索引寄存器都属于读取 |
| 将 `cvtsi2sd` 的目的操作数计为读取 | `xmm2` 中出现第三个 double 参数 | 对 `xmm2` 的首次写入就是写入；`mixed` 只有两个 SSE 参数 |
| 将位置槽位误读为独立序列 | 将 Windows 上的 double 参数判定为 `xmm0` | 槽位 1 是 `XMM1`，槽位 3 是 `XMM3` |
| 将 `push rbp` 视为建立帧指针 | 在把 `rbp` 用作累加器的 `-O2` 函数中报告帧指针 | 只有压栈后的 `mov %rsp, %rbp` 才会建立帧指针 |
| 从入口栈指针测量红区 | “栈指针下方”有 216 字节 | 执行 88 字节的 `sub` 后，是当前栈指针下方的 128 字节 |
| 将影子存储区视为局部变量 | 栈参数位于 8 到 32 | Microsoft 栈参数从 40 开始 |
| 将 `lea` 视为加载 | 可变参数被调用者的 `0x60(%rsp)` 处有一个栈参数 | `lea` 计算的是 `overflow_arg_area`，并未加载数据 |
| 将隐藏指针视为普通参数 | `big_ret(void *, long long)` | 经由该指针执行存储，且它分别被复制到 `rax`、`rax`，或保留在 `x8` 中 |
| 将最深 CFA 与序言栈帧比较 | 对压入传出参数的调用者报告不匹配 | 应与函数体中栈指针达到的最深位置比较 |
| 根据 ISA 直接断定调用约定 | 为 COFF 目标文件报告 `amd64` | 文件格式选择规范，ISA 再选择寄存器 |
| 只信任单个工具给出的原型 | 三个 double，或十六个可变参数 | 必须得到源码签名或第二条推导路径的印证 |

## 操作准则

Trong khi đọc đoạn đầu tiên của chỉ thị, và xác định quy tắc sử dụng. Sử dụng chuyển hướng của chỉ số so với đầu vào để xác định từng ký ư ký và từng tham số được lưu trữ, dựa trên quy tắc đặt nó vào vị trí đó, cũng như kiểm tra dữ liệu mở được viết cho trình biên dịch viên. Trước khi xác nhận các chữ cái hoặc mã nguồn, chỉ cần xem các mô hình đầu tiên được cung cấp như một chủ đề chứng minh.

## 延伸阅读

- [System V Application Binary Interface, AMD64 Architecture Processor Supplement, Version 1.0 (sections 3.2.1 to 3.2.3, 4.2.4)](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Microsoft x64 calling convention](https://learn.microsoft.com/en-us/cpp/build/x64-calling-convention)
- [Microsoft x64 stack usage](https://learn.microsoft.com/en-us/cpp/build/stack-usage)
- [Microsoft x64 prolog and epilog](https://learn.microsoft.com/en-us/cpp/build/prolog-and-epilog)
- [Microsoft x64 exception handling: RUNTIME_FUNCTION, UNWIND_INFO, UNWIND_CODE](https://learn.microsoft.com/en-us/cpp/build/exception-handling-x64)
- [Arm Procedure Call Standard for the Arm 64-bit Architecture (AAPCS64), release 2025Q4](https://github.com/ARM-software/abi-aa/blob/main/aapcs64/aapcs64.rst)
- [Apple: Writing ARM64 code for Apple platforms](https://developer.apple.com/documentation/xcode/writing-arm64-code-for-apple-platforms)
- [DWARF Debugging Information Format Version 5, section 6.4 Call Frame Information](https://dwarfstd.org/doc/DWARF5.pdf)
- [Clang driver frame-pointer defaults, `useFramePointerForTargetByDefault` in `CommonArgs.cpp`](https://github.com/llvm/llvm-project/blob/main/clang/lib/Driver/ToolChains/CommonArgs.cpp)
- [Clang command line reference: `-fomit-frame-pointer`, `-momit-leaf-frame-pointer`](https://clang.llvm.org/docs/ClangCommandLineReference.html)
- [Fedora 38 change: frame pointers by default](https://fedoraproject.org/wiki/Changes/fno-omit-frame-pointer)
- [Ubuntu 24.04: performance engineering with frame pointers by default](https://ubuntu.com/blog/ubuntu-performance-engineering-with-frame-pointers-by-default)
- [Ghidra compiler specification: `x86-64-gcc.cspec`](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Processors/x86/data/languages/x86-64-gcc.cspec)
- [Ghidra compiler specification: `x86-64-win.cspec`](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Processors/x86/data/languages/x86-64-win.cspec)
- [Ghidra compiler specification: `AARCH64.cspec`](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Processors/AARCH64/data/languages/AARCH64.cspec)
- [Hex-Rays: SetType and the `__usercall` convention](https://docs.hex-rays.com/ida-actions/settype)
- [Hex-Rays: Decompile as call](https://docs.hex-rays.com/ida-actions/hx_userdefinedcall)
- [Binary Ninja API 6.0: `callingconvention` module](https://api.binary.ninja/binaryninja.callingconvention-module.html)
- [Binary Ninja API 6.0: `platform` module](https://api.binary.ninja/binaryninja.platform-module.html)
- [Binary Ninja user documentation: platform types](https://docs.binary.ninja/guide/types/platformtypes.html)
- [The Official Radare2 Book: calling conventions](https://book.rada.re/analysis/calling_conventions.html)
- [The Official Radare2 Book: code analysis](https://book.rada.re/analysis/code_analysis.html)
- [angr documentation: decompiler analysis passes, including calling convention recovery](https://docs.angr.io/en/latest/analyses/decompiler.html)
- [radare2 6.2.4 release](https://github.com/radareorg/radare2/releases/tag/6.2.4)
- [rizin 0.9.1 release](https://github.com/rizinorg/rizin/releases/tag/v0.9.1)
