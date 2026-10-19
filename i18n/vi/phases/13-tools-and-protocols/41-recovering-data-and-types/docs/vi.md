# Khả năng khôi phục dữ liệu và loại: cấu trúc, số, C++ đối tượng và DWARF

> Quản lý có kiểu biểu đồ khi xuất`a->balance`, không có thời gian để xuất`*(int *)(param_1 + 4)` Bài học này được đọc từ trình duyệt của các hoạt động xây dựng mô hình, từ DWARF 5  đọc mô hình mô hình thực sự, và hiển thị sự đồng nhất của hai mô hình.

**Type:** Build
**Languages:** Python, C, C++, x86-64 assembly
**Prerequisites:** Phase 13 · 33（反汇编与控制流）、Phase 13 · 34（提升为伪代码）
**Time:** ~140 分钟

## Học mục tiêu

- Theo quy tắc tìm kiếm địa chỉ của Intel SDM,将结构体成员访问解读为基址寄存器加位移,将数组访问解读为基址加索乘步长──
- 手工将 Hệ thống V đối với quy tắc được sử dụng `struct account`, giải thích mỗi phần đầy đủ.
- Xây dựng kiểu phục hồi phân tích khắp, sẽ chuyển đổi truy cập trong danh sách thành字段偏移、宽度、类别、步长和大小, và cung cấp bằng chứng cho mỗi mục.
- Để định vị lại các mục tiêu tài liệu `.debug_info``.debug_abbrev``.debug_str_offsets`和 `.debug_addr`编写 DWARF 5 读取器,并对照 `llvm-dwarfdump`Chuẩn bị kiểm tra.
- So sánh thiết kế phục hồi với thiết kế DWARF, phân loại từng sự khác biệt thành loại chứng minh thiếu hụt, truy cập hợp tác hoặc không thể chứng minh.
- Từ重定位记录读取 Itanium C++ 虚函数表、类型信息和修饰名称,并将虚调用解析到槽位──

## 问题

Anh không có`-g`Trong trường hợp biên dịch `account.c`, rồi hỏi đại lý,`bump`Làm gì? Trưởng sẽ giao tập tin mục tiêu cho Ghidra 12.1.4, có kết quả sau:

```c
void bump(long param_1,int param_2)
{
  *(int *)(param_1 + 4) = param_2 + *(int *)(param_1 + 4);
  return;
}
```

Cùng với một nguồn mã `-g`编译后, cùng một phản编译器 đưa ra kết quả như sau:

```c
int bump(account *a,int by)
{
  a->balance = by + a->balance;
  return a->balance;
}
```

 Chỉ thị trong hai tập tin mục tiêu hoàn toàn giống nhau, sự khác biệt nằm ở bảng kiểu.  Nếu có bảng này, người biên dịch biết tham số đầu tiên chỉ ra một cấu trúc 32 字节, trong đó chuyển hướng 4 字节 được gọi là `balance`字节 `int`Không có cái này, nó chỉ biết`%rdi`Trung truyền đến một giá trị 8 chữ cái rộng, và `+4`4 字节 được đọc và viết vào:

Mỗi một trong số đó có nguồn gốc.`addl 0x4(%rax), %ecx`字节 位移;宽度 4 来自 `l`后;名称来自 `.debug_info`Trung `DW_TAG_member`条目──本课构建这两个部分: một phân tích thông tin có thể chứng minh chỉ thị phục hồi, và một giải mã biên dịch viên ghi chép đọc máy.

```figure
re-41-struct-recovery
```

## 成员访问就是位移

Intel SDM 第 1 卷 第 3.7.5 节将有效地址定义为 `Offset = Base + (Index * Scale) + Displacement`, trong đó tỷ lệ nhân tố là 1、2、4 hoặc 8, vị trí chuyển đổi là 8、16 hoặc 32 vị trí.`RIP + Displacement`hình thức── cấu trúc thành viên truy cập được sử dụng hình thức đầu tiên nhưng không có chỉ dẫn:基址寄存器保存对象地址,位移就是成员偏移──数组访问加入索引项,比例因子或单独乘法承载元素大小──

以 `-O0`下的 `bump`Ví dụ:`llvm-objdump -d -r`清单如下:

```text
       4: 48 89 7d f8                  	movq	%rdi, -0x8(%rbp)
       e: 48 8b 45 f8                  	movq	-0x8(%rbp), %rax
      12: 03 48 04                     	addl	0x4(%rax), %ecx
      15: 89 48 04                     	movl	%ecx, 0x4(%rax)
```

Sử dụng điều 33 của bài học`03 48 04``03` 表示`ADD r32, r/m32` ModRM`48` `01 001 000`- Có thể là:`mod = 01`表示带 8 位位移的内存操作数,`reg = 001` `%ecx`- Tôi không biết.`r/m = 000` `%rax`△位移字节为 `04`❖ 該命令读取 `%rax + 4`4 chữ cái của 处,并将其加到 `%ecx``llvm-objdump`输出 `l`后表示操作数大小,因此字段宽 4 字节。`%rax`Từ`-0x8(%rbp)`đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ đồ `%rdi`, tức là Hệ thống V 调用约定中的第一个整数参数──由此得到三个事实:参数 thứ nhất là chỉ số; nó hướng về đối tượng ở vị trí chuyển động 4 có một đoạn 4 字节字段;`bump`读取并写入该字段。

Những chữ này không giải thích`int``balance`Hoặc`struct account`, cũng không nói rõ đối tượng có nhiều hơn.`bump`Không thể thấy được.

## Hệ thống V 布局规则

x86-64 psABI Mục 3.1.2 đưa ra ba quy tắc về kiểu tập hợp: cấu trúc và hiệp hội áp dụng các yêu cầu tập hợp nhất của các thành viên của họ. Mỗi thành viên được phân bổ để đáp ứng các yêu cầu tập hợp tối thiểu có thể chuyển hướng.`char`1 và 1,`short`Nên 2 và 2,`int`4 và 4,`double`Đối với 8 và 8, bất kỳ chỉ số nào đều là 8 và 8.

Các quy tắc này sẽ được áp dụng.`account.c`Trung tâm cấu trúc:

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

Cuối cùng một thành viên kết thúc vào 32[6]. Các chữ cái được thực hiện nghiêm ngặt nhất là 8,32 là số nhân của 8, vì vậy, không có phần cuối được thực hiện.

成员顺序决定大小──将同样五个成员按 `double, pointer, int, short, char`排列, sẽ chiếm chuyển biến 0、8、16、20、22, kết thúc vào 23,再上对齐到24──`code/main.py`Trung `sysv_layout()`应用这三条规则并得到两种结果──Python của `ctypes`模块 thông qua máy biên dịch chủ约定应用相同规则; đối với cùng cấu trúc,`ctypes.sizeof``ctypes.alignment`和各字段的 `.offset`Đưa ra 32/8 và`0, 4, 8, 16, 24`❖ Trong máy tính này, khi xây dựng và chạy chương trình, chương trình tự in kết quả thứ ba:

```text
sizeof 32 align 8
kind 0 balance 4 code 8 rate 16 label 24
sum 315 tag -3 projected 318.75 label_length 7
```

Các cấu trúc cấu trúc của bản gốc là arm64;.Arm AAPCS64 Mục 5.10.1 quy định các quy tắc loại tập hợp giống nhau, tài liệu của Apple arm64 cũng giữ lại các mô hình mô hình này, do đó số lượng của hai nền tảng mục tiêu phù hợp.`-target x86_64-unknown-linux-gnu`编译, để ELF 读取器 của bài 33 và DWARF 读取器 của bài viết dưới đây có thể xử lý chúng.

## Cài đặt phần còn lại của cấu trúc

`bump`Chỉ có thể thấy một đoạn.`account.c`Trong bốn hàm khác có thể xem phần còn lại, và mỗi hàm hiển thị một hình thức chỉ thị khác nhau.`account-x86_64-O0-g.objdump.txt`

`sum_balances`Để chỉ số các cấu trúc:

```text
      51: 48 8b 45 f8                  	movq	-0x8(%rbp), %rax
      55: 48 63 4d ec                  	movslq	-0x14(%rbp), %rcx
      59: 48 c1 e1 05                  	shlq	$0x5, %rcx
      5d: 48 01 c8                     	addq	%rcx, %rax
      60: 8b 40 04                     	movl	0x4(%rax), %eax
```

`%rax` `list`- Tôi không biết.`%rcx`là biểu tượng mở rộng đến 64 vị trí của `i`, và `shlq $0x5`Để làm được 32`addq`后,`%rax`Vì vậy`list + 32 * i`, tải về`i`个元素偏移 4 处的 4 字节──移位次数 là nơi duy nhất trong các mục tiêu tài liệu này trong dạng số thể hiện cấu trúc lớn──包含这些指令的循环从 `0x49`延伸到 `0x72`处的 `jmp 0x49`

`tag`读取两个狭字段:

```text
      8c: 0f be 00                     	movsbl	(%rax), %eax
      98: 0f bf 48 08                  	movswl	0x8(%rax), %ecx
```

`movsbl`Lên một字节 ở 0 位并进行符号扩展, do đó, một字段 ở 0 位 là có符号 1 字节整数──`movswl`Các 2 chữ cái của chuyển động 8 được tải và mở rộng mã, do đó các chữ cái của chuyển động 8 là có mã 2 chữ cái.`-O1`下, lần đầu tiên thăm thành `cmpb $0x6c, (%rdi)`, nó vẫn có thể mô tả sự chuyển biến ở 0 có 1 chữ cái, nhưng không thể mô tả tính năng.

`projected`读取浮点数:

```text
      cc: f2 0f 2a 40 04               	cvtsi2sdl	0x4(%rax), %xmm0
      d5: f2 0f 59 40 10               	mulsd	0x10(%rax), %xmm0
```

`cvtsi2sdl`Để chuyển đổi số nguyên 32 chữ cái trong bộ nhớ thành số chính xác đôi, xác nhận chuyển chuyển 4 处保存 số nguyên 4 chữ cái.`mulsd`Nồng độ 2 trong bộ nhớ, do đó chuyển 16 处保存 8 字节浮点值。

`label_length`读取指针, sau đó đi theo hướng dẫn truy cập:

```text
      f3: 48 8b 40 18                  	movq	0x18(%rax), %rax
      f7: 48 63 4d f4                  	movslq	-0xc(%rbp), %rcx
      fb: 80 3c 08 00                  	cmpb	$0x0, (%rax,%rcx)
```

`movq`读取偏移 24 处的 8 字节──单看这一步,它可能是8 字节整数,也可能是指针──`cmpb`Để sử dụng giá trị tải như địa chỉ cơ sở của số hoạt động trong bộ nhớ.`cmpb`Từ中读取索引 `%rcx`处的 1 字节;在 `-O1`下, vòng tròn qua`leaq 0x1(%rcx), %rcx` tiến hướng, vì vậy nó hướng về các yếu tố chia cách thành 1 字节.

综合五个函数, cấu trúc体为`{ i8 at 0, i32 at 4, i16 at 8, f64 at 16, pointer at 24 }`,步长为 32──1至3 和 10至15的空隙恰好是 psABI 规则预测的填充──指令没有说明内容包括:成员名称;指针类型是`const char *`;偏移 0 处有符字节的声明类型,源码写作 `char`; và 5 hàm nhận là cùng một loại.`main`, nó sẽ truyền cùng một đối tượng cho tất cả năm hàm.`-O0`下,调用点让这一点清晰可见:`leaq -0x70(%rbp), %rdi`后, trong `callq bump`前执行 `addq $0x20, %rdi`, trong `callq tag`前执行 `addq $0x40, %rdi`偏移 0`0x20`和 `0x40`là ba yếu tố của cùng một số; được sử dụng để lấp đầy số`memcpy`拷贝 `0x60`字节, tức là 96 字节,正好是三个 32 字节元素──

## 分析遍

`code/main.py`Trung `trace_function()`按地址顺序穿越一个函数的命令,并维护一个小型抽象状态──值的承载位置是64位寄存器或类似的`-0x8(%rbp)`Mỗi vị trí có 3 giá trị trong số đó.`Pointer`Bao gồm các hàm ∞ định vị và bộ sưu tập dài, trong đó dài biểu hiện đã thêm vào số chữ số này một số lần không rõ ràng.`Index`là giá trị số không biết, nhưng vì một tỷ lệ nào đó các yếu tố tích lũy được số lần.

Đệ thống khởi tạo để lưu lại 6 hệ thống V 参数寄存器分别保存 `Pointer("param0", 0)`至 `Pointer("param5", 0)`                                                                                                                                                                                                                                                              

- 64 位寄存器与槽之间 `movq`复制值── đối với 32 bit hoặc viết nhỏ hơn của trình ghi sẽ thay đổi theo tỷ lệ nhân tố là 1 `Index`
- 以指针为基址的 `leaq`生成加上位移后的指针; nếu có chỉ số寄存器,则向步长集合加入 `scale * index_scale``%rbp`Hoặc`%rsp`Vì địa điểm của `leaq`标识  đối tượng, đó là `main`传递 `rows`Cách của nó.
- Đối với`Index`执行 `shlq $n`会将比例因子乘以`2^n`, thực hiện`imulq $k`则乘以`k`
- Chỉ số và chỉ số`addq`Bảo trì chỉ số,并将索引比例因子加入步长集合──对指针执行 `addq $k`Sẽ thay đổi sự chuyển động của nó, đồng thời ghi lại cho sự gia tăng của bộ ghi nhớ này.
- 调用使所有调用者保存寄存器变为未知; lưu trữ chỉ số các tham số寄存器会记录为调用点。
- 基址寄存器保存指针 bất kỳ số lượng hoạt động trong bộ nhớ sẽ thay đổi`Access`, bao gồm các gốc và chuyển hướng của chỉ số, độ rộng và loại xác định bởi các ký hiệu, cũng như các dấu hiệu lưu trữ.

宽度和类别 chỉ được quyết định bởi các ký 符.`access_width()`sẽ`b``w``l``q`后映射到 1、2、4、8 字节;将 `movsbl`和 `movswl`映射为有符号窄加载,`movzbl`映射为无符号加载;将 `sd`和 `ss`标量 SSE 指令映射为 8 字节和 4 字节浮点数;将 `cvtsi2sdl`映射为有符号 4 字节整数源;将 16 字节的 `movaps`Chỉ thị 族映射为向量──`leaq`和 mọi loại `nop`Không thuộc về truy cập.

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

Thông qua chỉ số tải lên 8 字节 sẽ tạo ra một chỉ số mới, có giá trị nhận dạng gốc từ các字段, ví dụ:`param0->0x18`◊ Khi giá trị này sau đó được sử dụng như cơ sở địa điểm, hoặc thông qua `leaq`推进时,来源字段就被标记为已证明是指针──这条规则将偏移24从8字节变为指针──

### 4 bước chứng minh

`infer_layout()`合并所有见证函数的访问,并从四种来源收集步长,每个项都附带产生它的指示.

| 类别 | 来源 | 展示它的构建 |
|---|---|---|
| `scale` | 由 `shlq $0x5` 或 `imulq` 产生、比例因子大于 1 的 `Index` 到达指针 | `-O0`，`0x59` 处的 `shlq $0x5, %rcx` |
| `loop-step` | 循环内基址或索引寄存器的 64 位增量，且同一循环也包含该访问 | `-O1`，`0x24` 处的 `addq $0x20, %rdx` |
| `offset-delta` | 同一循环中通过同一基址寄存器、宽度相同且偏移间距恒定的访问 | `-O2`，八次间隔 32 的加载 |
| `call-site` | 将同一栈帧对象传给见证函数时所采用的偏移 | `-O0`，`main` 传递 `rows`、`rows+0x20`、`rows+0x40` |

Chuyển từ phía sau`jmp`Hoặc điều kiện cho phép xác định, chỉ có vòng lặp bao gồm tăng và truy cập, tăng không được tính vào chứng cứ.`-O0`下推进 `i`của `addl $0x1, %eax`Vì nó là 32 điểm tăng, và chuyến thăm không qua.`%eax`◊ bước dài cuối cùng là số lượng lớn nhất của tất cả các giá trị số được tìm thấy.

### -O2 vòng lặp quy mô

Trong `-O2`Này, clang sẽ`sum_balances`Để đo lường.`0x50`Đến`0xaa`Chuyện chu kỳ mỗi vòng đọc 8 yếu tố:

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

`%rax`Từ `list + 0xe4`开始──八位移使加载位置对比 `list`                                                                                                                                                                                                                                                              `0x04, 0x24, 0x44, 0x64, 0x84, 0xa4, 0xc4, 0xe4`, cũng vậy`4, 36, 68, 100, 132, 164, 196, 228`                                                                                                                                                                                                                                                              `0x100`, tức là 256 ⋅ Nếu phân tích qua toàn bộ thấy chuyển động trên ghi chép trực tiếp, sẽ báo cáo tám đoạn và một ít nhất 232 字节 cấu trúc.

`fold_unrolled()`应用一条规则: Trong một vòng lặp, lấy qua cùng một địa điểm đăng ký được thực hiện cùng truy cập rộng.`d`, đây là 32 ⋅ Nếu vòng lặp dài `k * d`, và thực sự có`k`个不同偏移,则循环展开了 `k`Lần thứ hai, mỗi lần truy cập đều chuyển.`(offset - lowest) mod d`处的同一个元素访问──这里`256 = 8 * 32`, và có tám chuyển động, do đó, tám lần tải toàn bộ gấp lại đến chuyển động 4, bước dài chứng cứ ghi chép là`offset-delta 32``unrolled 32`和 `loop-step 256``0xe0`处的标量余数循环再次从 `shlq $0x5, %rdx`加入 `scale 32`, từ`addq $0x20, %rdx`加入 `loop-step 32`❖ Số convention lớn nhất của 5 giá trị số là 32 ⋅

Trong một bức tranh, một cái kết nối của việc gấp.`-O2`构建会显示7 nằm ở字节 32 后段,且没有大小──这是只相信位移、不考察循环的读者会看到的状态──

## Từ字节读取 DWARF 5

`account.c`của `-g`构建携带八个调试节。`.debug_info`为 493 字节,`.debug_abbrev`179,`.debug_str`Vì 230,`.debug_str_offsets`124,`.debug_addr`112,`.debug_line`312,`.debug_line_str`12`.debug_frame`为 264 ――DWARF 5 标准的引言将`.debug_str_offsets``.debug_addr`和 `.debug_line_str`列为第5 版新增内容──`code/main.py`Trung học cần 5 đoạn

### 单元头

标准第 7.5.1.1 节给出完整编译单元头:`unit_length``version``unit_type``address_size`和 `debug_abbrev_offset``.debug_info`                                                                                                                                                                                                                                                              

```text
e9 01 00 00   unit_length = 0x1e9 = 489
05 00         version = 5
01            unit_type = DW_UT_compile
08            address_size = 8
00 00 00 00   debug_abbrev_offset = 0
```

`unit_type`字节 là 5 版新增的, tiêu chuẩn trong cùng một đoạn đã nêu rõ điều này.`4 + 489 = 493`开始,也就是节的末尾.`llvm-dwarfdump --debug-info`Trong đó`Compile Unit:`行印同样五个值,第一个测试会解析并比较该行──

### 缩写

Chương 2.1 节说明, mỗi调试信息条目由标识标签和一系列属性组成──条目本身只保存缩写代码──代码选择`.debug_abbrev`(§ 7.5.3 节) trong tuyên bố, tuyên bố này chỉ định nhãn, sau đó có có nội dung, và liệt kê các thuộc tính và hình thức mã hóa.

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

`parse_abbreviations()`读取 ULEB128 代码、ULEB128 标签、一个子条目标志字节, rồi đọc tính chất và hình thức của sự phối hợp, cho đến khi gặp `0, 0` Mục 7.5.6 节 给出形式编码:`data1`为一个字节;`ref4`Đối với các đơn vị 4 字节 chuyển động;`strx1`为字符串偏移表的 1 字节索引;`sec_offset`和 `data4`为 4 字节;`addrx`索引 ULEB128 của bảng địa chỉ;`exprloc`为 ULEB128 长度及相应 số lượng chữ cái;`flag_present`完全不占字节──

### 手工解码 cân bằng 成员

`account`                                                                                                                                                                                                                                                              `0x195`,字节为`0c 15 20 00 03`△缩写代码为 12,表示结构体──`DW_AT_name`字符串索引 `0x15`- Tôi không biết.`DW_AT_byte_size`Vì vậy`0x20`= 32,`DW_AT_decl_file`Nên 0,`DW_AT_decl_line`Nên 3, tức nguồn từ `struct account {`- Tôi đang đi.

第二条条条目 từ `0x1a3`开始,字节为 `0d 10 88 01 00 00 00 05 04`- Có thể là:

1. `0d`是缩写 13,表示成员──
2. `10`là `strx1`编码 của `DW_AT_name`:字符串索引 16──
3. `88 01 00 00`là `ref4`编码 của `DW_AT_type`: Từ đơn vị khởi điểm chuyển `0x188`,即名为`int`của `DW_TAG_base_type`条目。
4. `00` `DW_AT_decl_file`- Tôi không biết.`05` `DW_AT_decl_line`- Có thể là:`account.c`Đâu là 5 ̊
5. `04` `DW_AT_data_member_location`:偏移 4。

Chương 5.7.6 节说明, member条目 có thể có DW_AT_data_member_location 属性 hoặc DW_AT_data_bit_offset 属性, trong khi số lượng thường xuyên là đối với bao gồm các vật thể bắt đầu của các pha chữ chuyển động;;`addl 0x4(%rax), %ecx`Trung tâm vị trí số giá trị tương tự,`compare_layouts()`Đó là hàm so sánh hai hàm.

### 字符串和地址经由两张表解析

字符串索引 16 不是 `.debug_str`Trung tâm chuyển hướng.`DW_AT_str_offsets_base`,其值为 8,然后读取 `.debug_str_offsets`Trung `8 + 4 * 16`处的 4 字节条目──该条目保存 `"balance"`Trong `.debug_str`Trung tâm chuyển hướng. địa điểm cũng sử dụng cùng một cách gián tiếp.`sum_balances`条目以字节 `07 07`开头:缩写 7 表示子程序,随后是以`addrx`编码、索引为 7 的 `DW_AT_low_pc``.debug_addr`Trung `8 + 8 * 7`处的 8 字节条目为 `0x30`,即该函数在 `.text`Địa chỉ trung ương.

Trong các tập tin mục tiêu có thể định vị lại, hai biểu tượng đều không lưu lại giá trị cuối cùng trong các tập tin `.debug_str_offsets`Mỗi phần trung bình là 0,`.rela.debug_str_offsets`保存 đối với `.debug_str`của 29 个 `R_X86_64_32`重定位, thực sự chuyển động trong số lượng gia tăng.`.debug_addr`Có 13 mục tiêu.`.text`和 `.rodata.str1.1`của `R_X86_64_64`重定位.`.debug_info`自身有四重定位:缩写偏移;以 `.debug_str_offsets+0x8`biểu diễn của `DW_AT_str_offsets_base`-`DW_AT_stmt_list`; và`.debug_addr+0x8`biểu diễn của `DW_AT_addr_base`在读取器解析节之前,`ElfObject.relocated()`Đối với 32 và 64 ứng dụng kiểu `S + A`△ mục tiêu trong tập tin có giá trị 节符号为 0, vì vậy 字段获得加数。`llvm-dwarfdump`执行相同解析, đó là lý do tại sao các chỉ mục sẽ được phân tích đầy đủ.

### 类型、函数和位置

`DwarfInfo.type_name()`沿 `DW_AT_type`引用追踪:`label`成员指向 `DW_TAG_pointer_type`, người sau hướng tới`DW_TAG_const_type`, Đổi hướng`char` cơ bản, do đó, danh hiệu của nhóm là `const char *``type_size()`Trở về các loại cơ bản và cấu trúc`DW_AT_byte_size`, đối với chỉ số quay lại 8, đối với số lượng quay lại nhân phần tử lớn.`type_kind()`Các loại cơ bản`DW_AT_encoding`简化为带符号性 `int`Hoặc`float`, sẽ chỉ số loại đơn giản hóa thành `pointer`, đây là các loại sử dụng khi so sánh.

`DwarfInfo.functions()`读取六个  读取六个 `DW_TAG_subprogram`条目。`bump`Từ `0x0`延伸到 `0x21`,即 `DW_AT_low_pc`     `DW_AT_high_pc`长度──它的基址为 `DW_OP_reg6 RBP`,参数 `a`                                                                                                                                                                                                                                                              `91 78`- Có thể là:`DW_OP_fbreg`加上 SLEB128  giá trị `0x78`, tức là -8 . Đó chính là danh sách trong địa chỉ .`0x4`sẽ`%rdi`存入的槽 `-0x8(%rbp)`◊调试信息和命令从两个角度描述一个槽──

## So sánh 2 kiểu

`compare_layouts()`遍历 DWARF 成员,并寻找相同偏移处的推断字段──没有对应字段的成员标记为 `no-evidence`;字段大小不同为 `size-mismatch`;字段从未被解引用的指针成员为 `pointer-unproven`;类别不一致为 `kind-mismatch`Ví dụ: kiểu là số điểm浮点 và chỉ dẫn sử dụng thuật toán toàn số.`unexpected`◊                                                                                                                                                                                                                                                              `DW_AT_byte_size`So sánh:

3 số lượng xây dựng từ `python3 code/main.py`- Có thể là:

| 构建 | 通过第一个参数的访问数 | 字段 | 步长证据 | 匹配成员 | 大小 |
|---|---|---|---|---|---|
| `-O0` | 11 | 5 | `scale 32`、`call-site 32`、`call-site 64` | 5/5 | 32，匹配 |
| `-O1` | 9 | 5 | `loop-step 32` | 5/5 | 32，匹配 |
| `-O2` | 17 | 折叠后 5，折叠前 12 | `offset-delta 32`、`unrolled 32`、`loop-step 256`、`scale 32`、`loop-step 32` | 5/5 | 32，匹配 |

Mỗi đoạn xây dựng của các suy đoán là các chữ số 1 đến 3 và 10 đến 15, đúng như các chữ cái điền của cấu trúc DWARF. Mỗi đoạn suy đoán đều nằm ở một số lượng lớn của mình, phù hợp với quy tắc của psABI.`natural_alignment_ok()`Tôi sẽ ghi lại điều đó.

个别加入函数时, kết quả cũng theo sau.`bump`时,布局只有偏移4 的一个字段,大小未知,下界为8──`sum_balances`加入步长;`tag`加入偏移 0 和 8;`projected`加入偏移 16 的浮点数;`label_length`加入偏移 24 的指针,并证明它是指针──`main`Trong `-O0`下加入调用点, trong `-O1`和 `-O2`Các bản kế hoạch không có nội dung tăng lên, vì các bộ biên dịch đã kết nối tất cả các thiết bị.

三类信息仍无法获取──名称不在命令中,限定符 `const`Cũng không trong lệnh.`label`                                                                                                                                                                                                                                                              `leaq 0x1(%rcx), %rcx`Nhận biết các nguyên tố cách nhau 1 chữ, điều này cũng có thể là`char`, cũng có thể là `unsigned char`Hoặc`_Bool` `-O1`下,偏移 0 的字节符号性未知,因为 `cmpb $0x6c, (%rdi)`Chỉ so sánh không mở rộng.`int8`, và đang sử dụng`movsbl`符号扩展的  符号扩展的`-O0` 下 báo cáo`i8` Chương 35 课会将这些事实记录为未知项.

## Đối tượng C++

`shapes.cpp`定义了 `Shape`, chứa hàm cấu trúc ảo`area()`和虚 `name()`; cũng xác định sinh mạng`Shape`、 tăng thêm 2 `int`成员的 `Rect`❖ Itanium C++ ABI 规则 clang trong x86-64 Linux 上如何布局这些对象──

### 修饰名称

ABI § 5.1.2 节 quy định  sửa đổi cách thức của tên được thêm vào `_Z`── mục tiêu có 19 biểu tượng như thế này──`_ZNK4Rect4areaEv`Có thể đọc:`_Z`, sau đó`N`biểu hiện tên của nó,`K`表示 const 成员函数,`4Rect`和 `4area`                                                                                                                                                                                                                                                              `E`结束嵌套名称,`v`表示空参数列表──`llvm-cxxfilt`输出 `Rect::area() const``_Z8describeRK5Shapei` `describe(Shape const&, int)`- Có thể là:`R`表示引用,`K`表示 const,`5Shape`là loại,`i` 表示`int` Mục 5.1.4 节 có tên đặc biệt:`_ZTV`biểu hiện hàm ảo,`_ZTI`biểu thị loại thông tin,`_ZTS`表示类型信息名称字符串── cấu trúc hàm và phân tích cấu trúc hàm sử dụng `C1``C2``D0``D1``D2`, vì vậy `_ZN4RectD0Ev`和 `_ZN4RectD2Ev`Thành phố xuất khẩu`Rect::~Rect()`:删除型解析构函数与基对象解析函数共享源码名称。

`code/main.py`Trung `Demangler` bao gồm phần này, cũng như phần 5.1.5.2 của phần nội bộ kiểu mã và phần 5.1.10 của phần `S_`替换──测试会对全部19名运行它,并与捕获的 `llvm-cxxfilt --no-strip-underscore`输出比较. 标志 này rất quan trọng trên macOS, vì các công cụ默认 sẽ bỏ một pre-direct, sau đó không thể nhận ra.`Z8describe...`

### Từ重定位读取虚函数表

ABI 2.5.2 节按顺序列出虚函数表组成部分:虚调用偏移、虚基类偏移、到顶层对象的偏移、类信息指针,最后是虚函数指针──地址点是对象的 vptr 保存的值,即第一个函数指针的地址(第 2.6.2 节) ⋅`Rect`Không có loại giả, vì vậy biểu đồ của nó bao gồm chuyển hướng đối tượng ở cấp trên, loại thông tin và hàm.

符号 `_ZTV4Rect`Đối với 0x30 字节, tức là 6 8 字节槽.`.rela.data.rel.ro._ZTV4Rect`- Có thể là:

```text
0000000000000008 R_X86_64_64              _ZTI4Rect
0000000000000010 R_X86_64_64              _ZN4RectD2Ev
0000000000000018 R_X86_64_64              _ZN4RectD0Ev
0000000000000020 R_X86_64_64              _ZNK4Rect4areaEv
0000000000000028 R_X86_64_64              _ZNK4Rect4nameEv
```

槽 0  lưu đến chuyển hướng đối tượng trên tầng, ở đây là 0, không cần định vị lại. 槽 1 là loại thông tin.`+16`Từ đây,槽 0 là hàm cấu trúc đối tượng hoàn chỉnh,槽 1 là hàm loại bỏ kiểu cấu trúc,槽 2 là`area`, Trọng 3 là `name``read_vtable()`读取符号大小、其范围内的重定位以及偏移 0 的零──`Shape`                                                                                                                                                                                                                                                              `__cxa_pure_virtual`, nghĩa là hàm thời gian vận hành được thực hiện.

### RTTI

Chương 2.9.4 节将`std::type_info`描述为 vptr 后一个指向修饰类型名指针,并列出其派生类──`_ZTI4Rect`Có 3 vị trí:`_ZTVN10__cxxabiv120__si_class_type_infoE+0x10``_ZTS4Rect`和 `_ZTI5Shape`Thứ nhất là`__si_class_type_info`Trong bảng hàm giả, đây là ABI được sử dụng cho các loại phân đoạn không phân đoạn chỉ có một loại công cộng không phải là dạng giả,`+0x10`则是该虚函数表的地址点.`4Rect`,即修饰类型名; trong `type_info`上调用 `name()`返回的正是该字符串──第三表示基类──`_ZTI5Shape`Sử dụng `__class_type_info`, không có chỉ số cơ bản.`read_typeinfo()`Trở lại những 3 sự thật này.

### 虚调用

`-O0`下的 `describe` thực hiện một lần虚调用:

```text
       f: 48 8b 7d f8                  	movq	-0x8(%rbp), %rdi
      13: 48 8b 07                     	movq	(%rdi), %rax
      16: ff 50 10                     	callq	*0x10(%rax)
```

Thứ nhất`movq`Lấy các dấu hiệu đối tượng. Đọc thêm 8 chữ cái của các dấu hiệu chuyển động đối tượng ở 0 , tức là vptr, vì ABI sẽ đặt nó ở phía trước nhất của các loại có hàm giả.`callq`经由 vptr 后 `0x10`处的指针调用, còn `0x10 / 8`Đối với các cỗ 2`find_virtual_calls()`匹配该模式并报告 hai ứng cử viên: từ `_ZTV4Rect`của `Rect::area() const`, và từ`_ZTV5Shape`của `__cxa_pure_virtual` cụ thể thực hiện phụ thuộc vào đối tượng, đây chính là lý do cho việc thực hiện liên tục.

DWARF ghi lại cùng một vị trí.`area`của `DW_TAG_subprogram`条目均带有 `DW_AT_vtable_elem_location (DW_OP_constu 0x2)`- Tôi không biết.`name`带有槽 3, phân tích hàm 带有槽 0`Rect`là 16 字节的`DW_TAG_structure_type`, chứa chuyển hướng 0 处指向 `Shape`của `DW_TAG_inheritance`条目,以及偏移 8 的成员 `w`和偏移 12 的 `h``Shape`为 8 字节, chứa một thành viên nhân tạo `_vptr$Shape` Các bài viết về định vị và điều chỉnh được đưa ra bởi hai loại hướng dẫn độc lập.`area`ng vị trí là 2 

Trong `-O1`下, mục tiêu tài liệu hoàn toàn không có hàm giả表.`main`sẽ`Rect`构成为局部对象, do đó biên dịch viên trong giai đoạn biên dịch phân tích并内联了 `r.name()`和 `describe(r, 2)`Không có nơi nào để lấy địa chỉ biểu diễn, vì vậy biểu diễn sẽ không được tạo ra.`describe`仍包含 `movq (%rdi), %rax`和 `callq *0x10(%rax)`, vì các tham số của nó có thể là bất kỳ .`Shape`                                                                                                                                                                                                                                                              `test_the_optimised_object_keeps_the_call_pattern_but_drops_the_vtables`Chuẩn bị hai khía cạnh này.

Microsoft ABI trong các chi tiết trên đều khác nhau.`?`开头并编码调用约定, do đó là C++ `__cdecl`编译的`void test(void)` `?test@@ZAXXZ` RTTI  định vị器`_RTTICompleteObjectLocator`形式位于 `vfptr[-1]`符号`??_7`biểu thị vtable,`??_R4`表示定位器──Microsoft 自己的文档说明编译器供应商之间没有C++ 命名标准──本课的样例仅采用Itanium──

## 工具如何呈现恢复出的类型

Các biểu tượng dưới đây đều đề cập đến các dòng phát hành, tất cả đều được tạo ra trên máy tính này và bắt giữ.`code/fixtures/tools/`未安装工具的行只描述其文档,并明确标注──

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

Ghidra 不带 DWARF xuất hiện cho thấy hai quy tắc tương tự.`tag`      `char *`, vì hàm qua nó so sánh một chữ cái;`0x18`处的字段 phân phối `char **`Vì`label_length`解引用加载的值并比较字节. Đây chính là hai quy tắc được áp dụng trên toàn lớp: từ chỉ dẫn xác định chiều rộng, từ giải引用 xác định chỉ số.

│ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │`td`, tất cả cho phép bạn theo thiết kế nhập cấu trúc đã phục hồi, và quan sát chống biên dịch viên tái tạo.

rea 6.5.0  cộng tác với nhà cung cấp Ghidra của mình, sẽ phản biên dịch văn bản như ghi chép trở lại.`python3 code/main.py infer`Tôi có thể nhận được bằng chứng này.

## 类型推断研究

Phân tích trong đây là một nửa của các hệ thống đoán kiểu tạo ra các khối, và chỉ giới hạn trong một cấu trúc có thể đạt được các tham số.

- TIE (Lee、Avgerinos、Brumley,NDSS 2011) sẽ mô tả các loại xây dựng lại để phân tích các quy trình tạo ra và tìm kiếm giải pháp trong các hệ thống IR, đo bảo mật và chính xác, và so sánh 87 phần tử chính trong các quy trình với các máy biên dịch kinh doanh.
- Retypd(Noonan、Loginov、Cok,PLDI 2016) đã tăng thành phần của các loại、多态和递归类型,并报告指针`const`Năng lượng quay lại của xây dựng lại là 98%.
- OSPREY(Zhang 等,IEEE S&P 2021) sẽ xem mỗi vị trí trong bộ nhớ như là biến động theo thời gian, xác định tỷ lệ xác suất cao nhất của các loại.
- DIRTY(Chen 等,USENIX Security 2022) và ReSym(Xie 等,CCS 2024) sử dụng mô hình học tập đối với phản biên dịch xuất và xử lý sau đó,ReSym  báo cáo tỷ lệ xác thực của toàn bộ cấu trúc cấu trúc là 72.9%。
- RecStruct(Chen 等,USENIX Security 2026) không cần chống biên dịch, thông qua流不敏感符号执行及槽上的并查集恢复嵌套结构体──

                                                                                                                                                                                                                                                              `-O1`下,`main`sẽ`rows`Bảo tồn 上,内联代码读取 `0x24(%rsp)``0x40(%rsp)``0x48(%rsp)``0x30(%rsp)`和 `0x38(%rsp)`Những chuyển hướng này đối với 32 取模后分别 là 4、0、8、16、24: cùng một cấu trúc, nhưng không có tham số có thể sử dụng như hạt đầu tiên.

## 亲手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/41-recovering-data-and-types
python3 code/main.py
```

输出 là một báo cáo JSON có 5 phần.`dwarf`保存 `-O0`目标文件的单元头、结构体和函数;`oracles`保存 psABI 规则布局、`ctypes`布局、DWARF 布局、原生运行结果和 `agree`标志;`builds`保存3 tài liệu mục tiêu của mỗi truy cập  kết luận về kết quả so sánh;`cxx`保存解修饰名称、两张虚函数表、两类信息记录、虚调用和 DWARF 槽位;`tools`列出捕获的工具输出──

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

按以下顺序阅读 `code/main.py`- Có thể là:

1. `ElfObject`读取节、符号和重定位,`relocated()`Đối với các ứng dụng`S + A`
2. `parse_abbreviations()`和 `DwarfInfo._parse_unit()`读取头、缩写表和条目, sau đó qua hai张表解析 `strx`和 `addrx`
3. `DwarfInfo.struct_layouts()`和 `functions()`借助 `type_name()``type_size()`和 `type_kind()`,将条目转换为 `StructLayout`和 `FunctionInfo`记录──
4. `parse_listing()``parse_memory()`和 `access_width()`读取 `llvm-objdump`文本。
5. `trace_function()`là một tình trạng trừu tượng,`fold_unrolled()`和 `infer_layout()`Sẽ truy cập chuyển đổi thành trang web.
6. `compare_layouts()`生成状态行,`sysv_layout()`和 `ctypes_layout()`Có hai điểm khác.
7. `Demangler``read_vtable()``read_typeinfo()`和 `find_virtual_calls()`负责 C++ 目标文件。

Còn bốn lệnh nữa.`python3 code/main.py dwarf FILE.o`打印任意 DWARF 5 可重定位目标文件的结构体和函数──`python3 code/main.py infer LISTING.txt [FILE.o]`Đối với các hoạt động phân tích trên toàn thế giới, nếu cung cấp các tài liệu mục tiêu, thì so với DWARF so sánh.`python3 code/main.py demangle NAME...`和 `python3 code/main.py vtable FILE.o`负责 C++ 部分──

##  thực tế sử dụng

 Đối với các tài liệu mục tiêu mới bạn tự xây dựng:

1.  nắm bắt tài liệu mục tiêu `llvm-objdump -d -r`输出,并与目标文件一起保存──分析遍读此文献──
2. Đối với hoạt động thanh toán`python3 code/main.py infer`❖ Trước đọc trình hàm chứng: nó liệt kê các tham số đầu tiên được sử dụng như hàm trong bộ nhớ cơ sở địa chỉ. Nếu thiếu một hàm, chỉ ra các tham số của nó chưa đạt đến bộ nhớ hoạt động, hoặc thông qua phân tích qua các đường không được theo dõi.
3. Kết hợp số lần truy cập đọc mỗi đoạn. Một lần truy cập là một đoạn chứng kiến. Chỉ có một đoạn chứng kiến nên ghi lại kết quả kết luận.
4. 阅读步长证券。`call-site`Hoặc`scale`条目是强证; không có các loại khác hỗ trợ đơn 条`loop-step`Là bằng chứng yếu, vì báo cáo vòng lặp mở là bước của nhiều yếu tố.`unrolled`,应手工检查折叠──
5. Nếu có`-g`构建,运行比较并阅读每个非 `match`Đi đi.`no-evidence`行指出没有函数触及的成员,`unexpected`行指出分析遍无法定位的访问──
6. Lập kế hoạch như một loại quản lý công cụ nhập cấu trúc, và ghi lại những phần nào, tên và loại thuộc vào đoán.

随时保留三个对照基准. Nếu quy tắc,`ctypes`Và DWARF không đồng ý với các thiết kế bạn viết, bạn đã gặp phải các cấu trúc cấu trúc, các đoạn văn, hoặc sử dụng các mục tiêu của các quy tắc khác nhau.

## 交互实验

### 实验 A:解码成员条目

Từ `code`目录启动 Python:

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

查看字典前,先用缩写13 在纸上解码这九字节──随后读取未重定位的原始节 `elf.section(".debug_str_offsets").data[8:16].hex()`和重定位后节 `elf.relocated(".debug_str_offsets")[8:16].hex()`,并解释差异──

### 实验 B: theo dõi một hàm

```python
listing = load_listing("account-x86_64-O0-g.objdump.txt")
trace = trace_function("label_length", listing["label_length"])
[(hex(a.address), a.root, a.offset, a.width, a.kind) for a in trace.accesses]
trace.pointer_uses
trace_function("sum_balances", listing["sum_balances"]).loops
```

运行前先写下,哪次访问证明偏移 24 是指针──然后对 `-O1`清单运行相同代码, và `trace.increments`中找到 `leaq 0x1(%rcx), %rcx`

### 实验 C: vòng xoắn

```python
o2 = load_listing("account-x86_64-O2-g.objdump.txt")
trace = trace_function("sum_balances", o2["sum_balances"])
sorted({a.offset for a in trace.accesses})
folded, evidence = fold_unrolled(trace, trace.accesses)
sorted({a.offset for a in folded}), [(e.kind, e.value, e.text) for e in evidence]
```

接着运行 `analyze_build("O2", fold=False)["comparison"]`, thống kê`unexpected`行数── sửa đổi quy tắc gấp, yêu cầu vòng lặp phải được đúng`k * d`, và`k`Ít nhất là 2 lần, chỉ có một lần.`-O1`Chuyện giữ không thay đổi.

### 实验 D:虚函数表和名称

```python
shapes = load_object("shapes-x86_64-O0-g.o")
read_vtable(shapes, "_ZTV4Rect")
read_typeinfo(shapes, "_ZTI4Rect")
demangle("_ZNK4Rect4areaEv"), demangle("_Z8describeRK5Shapei")
find_virtual_calls(load_listing("shapes-x86_64-O0-g.objdump.txt"), [read_vtable(shapes, "_ZTV5Shape"), read_vtable(shapes, "_ZTV4Rect")])
```

Trên giấy`callq *0x10(%rax)`计算槽位, rồi dùng `DwarfInfo(shapes).struct("Rect").virtual_methods`确认──接着加载 `shapes-x86_64-O1-g.o`Và cố gắng để điều chỉnh nó`read_vtable`阅读 `ElfError`, giải thích vì sao có sự thiếu hụt.

## 实践实验

 Khôi phục `-O1`下 `main`Trung 上结构体──

要求:

- 扩展 `trace_function()`,使槽区域可以作为根.`movaps` lưu trữ cho hạt giống, những lưu trữ từ `.data.rel.ro`填充 `0x0(%rsp)`至 `0x5f(%rsp)`,即 `rows`字节初始化内容──
- 将内联访问 `0x24(%rsp)``0x40(%rsp)``0x48(%rsp)``0x30(%rsp)`和 `0x38(%rsp)`归属该根,并报告偏移对候选人步长取模的结果.
- Từ `0x120`至 `0x12c`                                                                                                                                                                                                                                                              `%r14`Từ 4 开始,以`0x20`递增直至 `0x64`;并 giải thích vòng giới `0x64`Đó là ba yếu tố cộng với chuyển động của phần.
- Kết quả so sánh với DWARF, đạt được 5 sự phù hợp, và ghi lại những loại nào vẫn chưa được chứng minh.
- 添加一个测试, đảm bảo sẽ 根错归属于参数时测试失败──

Kiểm chuẩn thành công là: đối với`-O1`清单运行 `python3 code/main.py infer`时,将 `main`列为具有根的见证函数,且仅凭`main`Trong so sánh có thể hiển thị 5 sự phù hợp.

## 本课产物

本课包含 `outputs/skill-recovering-data-and-types.md` Sử dụng nó sẽ chuyển đổi các bảng xếp hạng và các điều chỉnh có thể lựa chọn thành: cấu trúc cấu trúc từng đoạn với chứng cứ, ghi nhận nguồn gốc của bước dài, so sánh với DWARF, cũng như danh sách thông tin vẫn chưa được biết.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/41-recovering-data-and-types
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明:

- 单元头、14 个缩写和五个成员偏移与 `llvm-dwarfdump`Một
- 名称经由重定位后的 `.debug_str_offsets`表获得,且单元的 `str_offsets_base`和 `addr_base`平均为 8
- 六个函数携带转储显示的地址范围`DW_OP_reg6 RBP`和 `DW_OP_fbreg`位置,且其起始地址 bằng với hàm起点 trong danh sách
- 缺少 `.debug_info`nđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđãđ`0x78`xử lý cho -8
- `pyelftools`和 `lldb`Bài in và máy đọc cùng một cấu trúc
- PSABI 规则`ctypes`、DWARF và hoạt động nguyên sinh đều đưa ra chuyển động `0, 4, 8, 16, 24`和大小 32,重排后的结构体为 24 字节
- 清单解析器 在 `bump`中读取 13 条 命令,将 `R_X86_64_PLT32 bump-0x4` tệp thêm vào `0x194`处的调用,并找到 `0x72`处的后向跳转
- Nữ số hoạt động trong bộ nhớ, độ rộng, loại và mã hóa bởi AT&T 文本及助记符解码
- `-O0`下的 `bump`Từ 槽 đọc trở lại chỉ số, và chuyển đi 4 nơi để thực hiện 3 lần thăm
- 步长在 `-O0`Từ dưới`shlq $0x5`, trong `-O1`Từ dưới`addq $0x20, %rdx`, trong `-O2`Từ bước 256  gấp 8 lần tải
- `label_length`通过解引用证明偏移 24 是指针
- `main`Trong `-O0`Nên chuyển hướng 0`0x20`和 `0x40`传递 cùng một đối tượng, trong `-O1`下只调用 `printf`
- Mỗi cấu trúc đều phù hợp với 5 thành viên, kích thước là 32, khoảng trống phù hợp với DWARF 填充
- Không được lắp đặt,`-O2`构建报告七位位于字节 32 后段,且没有大小
- 解修饰器复现全部 19 个 `llvm-cxxfilt`字符串
- 两张虚函数表、两类信息记录及 `0x16`处的虚调用均解析到槽 2,DWARF 也一致
- `-O1`C++ 目标文件保留调用模式, nhưng không có biểu đồ hàm giả
- Ghidra、rizin 和 radar2  chụp kết quả trong khi có DWARF  hiển thị cấu trúc, không DWARF  hiển thị chuyển động ban đầu
- 交互图嵌入式数据与分析产生的数据一致

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

Từ truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy cập truy

## 延伸阅读

- [System V Application Binary Interface, AMD64 Architecture Processor Supplement, section 3.1.2: Data Representation](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Procedure Call Standard for the Arm 64-bit Architecture (AAPCS64), section 5.10: Composite Types](https://github.com/ARM-software/abi-aa/blob/main/aapcs64/aapcs64.rst)
- [Writing ARM64 code for Apple platforms](https://developer.apple.com/documentation/xcode/writing-arm64-code-for-apple-platforms)
- [Intel 64 and IA-32 Architectures Software Developer's Manual, Volume 1, section 3.7.5: Specifying an Offset](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [DWARF Debugging Information Format Version 5, sections 2.1, 5.7.6, 7.5.1.1, 7.5.3, 7.5.6](https://dwarfstd.org/doc/DWARF5.pdf)
- [Itanium C++ ABI, sections 2.5 (Virtual Table Layout), 2.9 (Run-Time Type Information), 5.1 (External Names)](https://itanium-cxx-abi.github.io/cxx-abi/abi.html)
- [Microsoft Learn: Decorated names](https://learn.microsoft.com/en-us/cpp/build/reference/decorated-names?view=msvc-170)và [Name Decoration](https://learn.microsoft.com/en-us/cpp/error-messages/tool-errors/name-decoration?view=msvc-170)
- [llvm-dwarfdump command guide](https://llvm.org/docs/CommandGuide/llvm-dwarfdump.html)và [llvm-cxxfilt command guide](https://llvm.org/docs/CommandGuide/llvm-cxxfilt.html)
- [Python ctypes: Structure layout, sizeof, alignment](https://docs.python.org/3/library/ctypes.html)
- [Ghidra Data Type Manager](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/Base/src/main/help/help/topics/DataTypeManagerPlugin/data_type_manager_description.htm)- [Decompiler Concepts](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/Decompiler/src/main/help/help/topics/DecompilePlugin/DecompilerConcepts.html)- [Decompiler Options](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/Decompiler/src/main/help/help/topics/DecompilePlugin/DecompilerOptions.html), và[Ghidra 12.1.4 release](https://github.com/NationalSecurityAgency/ghidra/releases/tag/Ghidra_12.1.4_build)
- [IDA 9.1 user guide: Types](https://docs.hex-rays.com/9.1/user-guide/types)- [IDA 9.4 release post](https://hex-rays.com/blog/ida-9.4-release-a-new-dyld-shared-cache-swift-analysis-new-teams-add-on-and-more-), và[IDA Free](https://hex-rays.com/ida-free)
- [Binary Ninja user guide: Types](https://docs.binary.ninja/guide/types/)và [Binary Ninja 6.0 Krypton](https://binary.ninja/2026/09/03/binary-ninja-6.0-krypton.html)
- [radare2 6.2.4 release](https://github.com/radareorg/radare2/releases/tag/6.2.4)và [rizin v0.9.1 release](https://github.com/rizinorg/rizin/releases/tag/v0.9.1)
- [GDB manual: Examining the Symbol Table, ptype /o](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Symbols.html)
- [pyelftools on PyPI](https://pypi.org/project/pyelftools/)
- [Lee, Avgerinos, Brumley, "TIE: Principled Reverse Engineering of Types in Binary Programs" (NDSS 2011)](https://www.ndss-symposium.org/ndss2011/tie-principled-reverse-engineering-of-types-in-binary-programs/)
- [Noonan, Loginov, Cok, "Polymorphic Type Inference for Machine Code" (PLDI 2016)](https://arxiv.org/abs/1603.05495)và [the retypd repository](https://github.com/GrammaTech/retypd)
- [Zhang et al., "OSPREY: Recovery of Variable and Data Structure via Probabilistic Analysis for Stripped Binary" (IEEE S&P 2021)](https://ieeexplore.ieee.org/document/9519451/)
- [Chen et al., "Augmenting Decompiler Output with Learned Variable Names and Types" (USENIX Security 2022)](https://www.usenix.org/conference/usenixsecurity22/presentation/chen-qibin)
- [Xie et al., "ReSym: Harnessing LLMs to Recover Variable and Data Structure Symbols from Stripped Binaries" (CCS 2024)](https://dl.acm.org/doi/10.1145/3658644.3670340)
- [Chen et al., "RecStruct" (USENIX Security 2026)](https://www.usenix.org/conference/usenixsecurity26/presentation/chen-yuxin)
