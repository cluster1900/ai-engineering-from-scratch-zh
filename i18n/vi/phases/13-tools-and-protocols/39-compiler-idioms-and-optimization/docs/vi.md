# 编译器惯用模式:优化如何改写代码,以及如何反向读懂它

> 优化编译器 sẽ sử dụng chi phí thấp hơn để thay thế cấu trúc nguồn hình thức chỉ dẫn. Mỗi hình thức có cơ sở dẫn, bài học này xây dựng một hướng dẫn dẫn ngược thực hiện, và kiểm tra các định dạng nguồn.

**Type:** Build
**Languages:** Python, C, x86-64 assembly, AArch64 assembly
**Prerequisites:** Phase 13 · 33（反汇编与控制流）、Phase 13 · 34（提升为伪代码）、Phase 13 · 38（调用约定）
**Time:** ~150 分钟

## Học mục tiêu

- Sử dụng định nghĩa giới hạn Granlund-Montgomery để phân loại từ số lượng và chuyển vị của bất kỳ số lượng thường xuyên nào, và từ clang sinh ra số lượng thường xuyên phục hồi phân số.
- Nói ra LLVM 降低 `switch`5 cách, và từ mục tiêu tài liệu đọc số lượng mục, biểu tượng vị trí và nội dung mục.
- Các vòng tròn định lượng được giải thích là số đường dẫn, số tích hợp, số nguyên tố mỗi vòng, số lần ẩn chứa, kết hợp và vòng tròn số dư.
- 识别尾调用、内联的被调用函数、无分支选择,以及转化为`memset`Hoặc`memcpy`Chuyện này.
- Đối với x86-64 với AArch64,`-O0`至 `-O3`Các mô hình thông thường, báo cáo chứng chỉ chỉ và giải mã nguồn gốc
- Kết quả sẽ được so sánh với Ghidra, Angr, Radar2 ∞ Rizin 和 Lldb đối với cùng một phần.

## 问题

Anh dùng`-O2`编译了 `idioms.c`,问智能体 `div7u`Làm gì... Nhất trí`imulq $0x24924925, %rax, %rax`, trả lời rằng hàm này nhân bằng 613566757, tái chuyển vị trí 相加.`x / 7`

Trong cùng một mục tiêu, còn có một phần tử 7 nhưng hoàn toàn không nhảy.`switch`, một biến thành một cái bàn nhảy`switch`, một biến thành`sete`和 `cmovne`    `switch`, và một quá trình`n`个整数的循环: mỗi vòng trong hai vòng`xmm`寄存器中处理八个整数, tái sử dụng vòng thứ hai xử lý các phần còn lại.`-O0`Này, cùng mã nguồn được tạo ra.`divl`、7 mục tiêu trượt bảng và một vòng lặp tiêu chuẩn; trong `-O1`下,七分支 chuyển đổi 变成 giá trị biểu đồ, trong khi vòng lặp khối lượng chưa xuất hiện.

Những hình thức này là các mô hình thông thường. Các biên dịch viên dựa trên các quy tắc có thể kiểm tra trong mã nguồn của nó tạo ra mỗi mô hình, cũng có thể giải mã chúng trở lại cấu trúc nguyên thủy.`0x66666667`❖ Bài học này xây dựng bao gồm tất cả các mô hình nhận dạng, 18 bộ xây dựng của mã bản thân chúng ta, và sẽ có tổng cộng 373 báo cáo với C 源码验证.

```figure
re-39-idioms-by-level
```

## Mô hình thông thường là hình thức dựa trên

Mô hình sử dụng thường là một trình soạn thảo hướng dẫn hướng dẫn hướng dẫn của một cấu trúc nguồn nguồn. Nó có thể được nhận ra bởi vì có hình dạng cố định, số hoạt động mang theo số lượng thường xuyên của dự đoán, và hình dạng khác với mã thông thường được viết tay của lập trình viên.

`code/main.py`Trung 识别器处理 `llvm-objdump -d -r`Các trình nhận dạng sẽ phân tích từng hàm thành chứa địa chỉ, chữ, trợ ký, số hoạt động và các lệnh định vị lại tiếp theo.`.rodata`字节,以及链接前保存跳转表目标的 `.rela.rodata`条目。

Mỗi bài kiểm tra đều là một bài`Idiom`记录,包含 `kind`、 giải mã `source`hình thức`evidence`Địa chỉ danh sách`detail`字典和 `verified`标志──标志来自C 源码──`parse_source()`读取 `idioms.c`, tìm mỗi hàm,提取 `/`Với`%`Số số trừ sau`*`Số lần sau`switch`分支 và giá trị của nó,`? :`运算符,`for`循环和调用者──除法模式的除数出现在函数除法列表中时即获验证;查找表条目与分支值相同或相差固定倍数时即获验证;尾调用者在源码中确实被调用时即获验证──演示报告`unverified`列表结束,测试套件断言全部18 构建的该列表都为空──

解码需要名称──识别器按清单顺序对每个函数的基本块运行小符号求值器,根据第 38 课的系统 V 和 AAPCS64 调用约定,将源码参数名放进参数寄存器──槽按操作数文本跟踪,因此能穿过`-O0`代码的溢出保存操作──在每个块入口合并前驱状态; Nếu trạng thái khác,名称分配前模式优先于常量──正因而,`digest`Trung `cmovll %edx, %eax`可读回 `sum % 10 < 5 ? sum % 10 : 5`: vòng mô hình sẽ được đặt tên `sum`,除法模式将商命名为`sum / 10`,取模模式将结果命名为`sum % 10`✿ nguồn gốc `rem > 5 ? 5 : rem`, hai biểu hiện đều được lấy`rem`和 5 của giá trị nhỏ hơn, và `rem == 5`时一致。

## Ngoài số lượng thường

Granlund 和 Montgomery 的Tân bằng số nguyên không biến bằng cách nhân(PLDI 1994) 用乘法和移位替代 `n / d`△ chọn chuyển位量`s`和乘数 `m = ceil(2^s / d)` Chỉ cần sai lầm `e = m * d - 2^s`足足小, trong phạm vi tất cả `n`của `floor(n * m / 2^s)`Như vậy.`floor(n / d)`△对无符号 32 位 `n`, giới hạn là `e <= 2^(s - 32)`; đối với thỏa mãn `|n| < 2^31``n`, giới hạn cho `e <= 2^(s - 31)`, và `n`Vì không có một đường lối nào khác để thay đổi.

`main.py`Trung `magic_numbers(d, bits, signed)`Từ 32  bắt đầu tìm kiếm `s`, quay lại第一组满足界限参数──该搜索能复现器件中 clang 生成的每常量──

### Số không có biểu tượng trừ 10

`2^35 / 10 = 3435973836.8`, lên lấy toàn bộ vì `3435973837 = 0xCCCCCCCD` 误差 là `0xCCCCCCCD * 10 - 2^35 = 2`, và `s = 35`      `2^3 = 8`若 `s = 34`, sự khác biệt là 6, vượt quá giới hạn 4, vì vậy 35 là số lượng chuyển động tối thiểu.`n = 123`检查:`123 * 3435973837 = 422624781951`- Tôi không biết.`422624781951 >> 35 = 12`

Clang trong x86-64 của `-O2`下为 `div10u`Sự phát triển chính xác là theo cách này:

```text
       0: 89 f9                        	movl	%edi, %ecx
       2: b8 cd cc cc cc               	movl	$0xcccccccd, %eax
       7: 48 0f af c1                  	imulq	%rcx, %rax
       b: 48 c1 e8 23                  	shrq	$0x23, %rax
```

`0x23`35 người.`movl %edi, %ecx`Để mở rộng 32 điểm số thành 64 điểm ký gửi, đây là dạng không có mã.`imulq`提供输入的 `movl $imm`读取乘数,读取移位量, rồi调用 `divisor_from_magic(0xCCCCCCCD, 35)`△该函数尝试 `2^35 // m = 10`和 11,并接受 10,因为 `magic_numbers(10)`返回相同乘数和移位量──

Trong AArch64 上, cùng một hàm là `mov w8, #0xcccd; movk w8, #0xcccc, lsl #16; umull x8, w0, w8; lsr x0, x8, #35`                                                                                                                                                                                                                                                              `umull`, chuyển vị số lượng bằng cách viết trong 10 thành phần.

### Số không có mã trừ 7: thêm sửa đổi

`2^35 / 7 = 4908534052.57`, lên lấy toàn bộ vì `4908534053 = 0x124924925`, cần 33 điểm. 误差 3 không vượt quá giới hạn 8, vì vậy chuyển位量 là 35, và nhỏ hơn chuyển位量均不成立.`0x24924925`, tái theo chuỗi cố định加回被除数:

```text
      32: 48 69 c0 25 49 92 24         	imulq	$0x24924925, %rax, %rax
      39: 48 c1 e8 20                  	shrq	$0x20, %rax
      3d: 29 c7                        	subl	%eax, %edi
      3f: d1 ef                        	shrl	%edi
      41: 01 f8                        	addl	%edi, %eax
      43: c1 e8 02                     	shrl	$0x2, %eax
```

Để đọc nó`t = (n * 0x24924925) >> 32`, rồi rồi`q = (((n - t) >> 1) + t) >> 2`总移位量为 `32 + 1 + 2 = 35``n = 100`时:`t = 14`- Tôi không biết.`(100 - 14) >> 1 = 43`- Tôi không biết.`43 + 14 = 57`- Tôi không biết.`57 >> 2 = 14`❖ nhận dạng器在右移 32 位后检测 `sub``shr``add``shr`尾部,给乘数加回 `2^32`, phục hồi 7`evaluate_division()`精确执行这个序列,测试在32位边界值上将其与`n // 7`Bị so sánh: AArch64 形式是`sub w9, w0, w8; add w8, w8, w9, lsr #1; lsr w0, w8, #2`, vì带移位加法 là một lệnh, nên ít nhất là một câu.

### Số chữ số trừ 3

`2^32 / 3 = 1431655765.33`, lên lấy toàn bộ vì `1431655766 = 0x55555556`,误差 2,`s = 32`时的有符号界限为 `2^1 = 2`恰好满足界限, vì vậy chuyển位量 là 32,clang 使用 `shrq $0x20``n = -7`时,乘积为`-10021590362`,算术右移 32 位 được `-3`;符号位已置位, sửa đổi加 1, kết quả为 `-2`, chính là C trung `-7 / 3`有符号具 `div10s`和 `div3s`Thành phố đối với số lượng phụ trách thực hiện`shrq $0x3f`, tiếp tục`addl`实现修正──

### 常量 tự nó không thể giải thích được điều gì

Chỉ có số không thể xác định số trừ.`0x66666667`配合移位 34 表示 10; cùng số乘法配合移位 33 表示 5,第 34 课已展示过.`clangMatchesAlgorithm`字段记录 liệu bộ sưu tập này có đúng là bộ sưu tập phát sinh từ thuật toán tìm kiếm không?`magic_numbers()`Sẽ từ chối chúng, vì biên dịch viên đã thay đổi sử dụng với các biểu tượng chuyển vị của vị trí.`mod8s` thể hiện hình dạng này:

### 惯用模式 thuộc chỉ thị chọn阶段

Trong `-O0`下,`div10u` `movl $0xa, %ecx; xorl %edx, %edx; divl %ecx`- Tôi không biết.`div10s` `cltd; idivl %ecx`Nhưng trong cùng một mục tiêu.`digest`用 `imulq $0x66666667`Một số phân tích giải thích sự khác biệt:`idioms-x86_64-nofastisel-O0.o`Sử dụng `-O0 -mllvm -fast-isel=false`构建, trong đó mỗi lần phân法都变成乘法, bao gồm sử dụng `movl $0xcccccccd, %ecx; imulq %rcx, %rax; shrq $0x23`của `div10u`❖ Hardware deferencing là một lựa chọn nhanh chóng`-O0`下的选择;乘法是 SelectionDAG 的降低结果,来自LLVM 的 `UnsignedDivisionByConstantInfo`和 `SignedDivisionByConstantInfo``digest`中包含除法块还包含 `switch`, vì vậy, khối này được giao cho SelectionDAG.`hardware idivl`Với`magic multiply`两种形式,图中显示混合形式 `-O0`函数。

## 取模跟随商

`x % d`Đúng vậy.`x - (x / d) * d`△编译器先用上述模式计算商,再乘回除数并相减──x86-64 上乘回 10 是`addl %ecx, %ecx; leal (%rcx,%rcx,4), %ecx`,即 `2 * q * 5`✿AArch64 上只需一条 `msub w0, w8, w9, w0`, nó ở trong `w9 = 10`时计算 `w0 - w8 * w9` nhận dạng trên các thiết bị sao chép`add``lea``shl``imul`Theo các yếu tố tích lũy, khi yếu tố bằng với số lượng phân bổ sau đó chấp nhận`sub`

Khi một thương gia cũng sử dụng các biểu hiện khác, báo cáo sẽ giữ lại hai mô hình:`-O1`下, biên dịch viên trong `digest`Trung chỉ tính một lần `sum / 10`, đồng thời được sử dụng`switch`索引和取模──在 x86-64 上, nó thậm chí hai lần hợp并该商:取模用 `leal (%rax,%rsi), %edi`, chuyển đổi sử dụng `addl %esi, %eax` nhận dạng báo cáo một lần phân loại và một lần lấy, và sẽ chia sẻ thương hiệu.`switch`索引就难以读.

Đối với 2 có biểu tượng có hình thức độc lập, vì nó không tính toán:

```text
      92: 8d 48 07                     	leal	0x7(%rax), %ecx
      95: 85 ff                        	testl	%edi, %edi
      97: 0f 49 cf                     	cmovnsl	%edi, %ecx
      9a: 83 e1 f8                     	andl	$-0x8, %ecx
      9d: 29 c8                        	subl	%ecx, %eax
```

đối với số lượng âm`x`, mã trong cache trước thêm định vị 7, để cắt theo yêu cầu C   hướng vào cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục cục c cục cục c cục c c c c c c c c c c c c c c c c c c cục c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c c`x`,相减后留下 `x % 8`△AArch64 使用 `negs w8, w0; and w9, w0, #0x7; and w8, w8, #0x7; csneg w0, w9, w8, mi`: đồng thời ẩn码 `x`和 `-x`,再按符号选择并取负. Ghidra 将此规则命名为`RuleSignMod2nOpt`,简介为转换 INT_SREM 形式:`(V + (sign >> (64-n)) & (2^n-1)) - (sign >> (64-n)) => V s% 2^n`──

Trong `-O0`Này, dùng Arch64 `sdiv w9, w8, w10; mul w9, w9, w10; subs w0, w8, w9`☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐`hardware sdiv + mul + subs`

## chuyển đổi của 5 cách giảm

LLVM ở hai vị trí quyết định`switch`hình dạng:`SimplifyCFG::simplifySwitchLookup`Trong `-O1`及以上运行: Khi ít nhất có ba phân tử, mỗi phân tử đều tạo ra một lượng thường xuyên, và mục tiêu hỗ trợ tìm kiếm biểu đồ, sẽ chuyển đổi thành biểu đồ giá trị.`SingleValueKind``LinearMapKind``BitMapKind`和 `ArrayKind``-O0`流水线不运行该过程――剩余交换 进入命令选择阶段的 `SwitchLowering::findJumpTables`Có ít nhất`min-jump-table-entries`个条目(默认 4) và đủ dày đặc khi xây dựng nhảy chuyển表―― độ dày đặc điều kiện là `NumCases * 100 >= Range * MinDensity`, hàm thông thường của `jump-table-density`10`-Os`下为 40―― dư tình thay đổi cho phân số thường xuyên, bởi `splitWorkItem`选择枢轴──具为每种结果提供一个函数──

| 函数 | 源码 | `-O0` x86-64 | `-O2` x86-64 | `-O2` AArch64 |
|---|---|---|---|---|
| `linear_switch` | 分支 0 至 6 返回 10 至 70 | 7 条目跳转表 | 线性映射 `10*k + 10`，默认 -1 | `madd` 和 `csinv` |
| `table_switch` | 分支 0 至 6 返回 10 至 60，再返回 71 | 7 条目跳转表 | `.rodata+0x28` 处的查找表 | `.rodata+0x0` 处的查找表 |
| `call_switch` | 分支 0 至 4 调用五个指针中的一个 | 5 条目跳转表 | 5 条目跳转表 | 比较树，枢轴 1 |
| `sparse_switch` | 分支 1、100、10000、1000000、100000000 | 比较链 | 比较树，枢轴 9999 | 比较树，枢轴 9999 |
| `two_cases` | 分支 3、4 返回 7、9 | 比较链 | 选择链 `k != 3 ? (k == 4)*9 : 7` | 两条 `csel` |

### Từ mục tiêu tài liệu读取查找表

`-O2`下的 `table_switch`- Có thể là:

```text
      d0: b8 ff ff ff ff               	movl	$0xffffffff, %eax
      d5: 83 ff 06                     	cmpl	$0x6, %edi
      d8: 77 0c                        	ja	0xe6 <table_switch+0x16>
      da: 89 f8                        	movl	%edi, %eax
      dc: 48 8d 0d 00 00 00 00         	leaq	(%rip), %rcx
		00000000000000df:  R_X86_64_PC32	.rodata+0x24
      e3: 8b 04 81                     	movl	(%rcx,%rax,4), %eax
      e6: c3                           	retq
```

边界检查 `cmpl $6; ja`Chỉ số có 7 điều khoản hiệu quả.`0x24`+ RIP 相对字段的 4 字节, sẽ biểu định vị đến `.rodata+0x28`, Đây chính là quy tắc của bài học 33 .`0a 00 00 00 14 00 00 00 ...`, vì vậy条目为`[10, 20, 30, 40, 50, 60, 71]`, với nguồn mã phân chia giá trị, vv.`.s`文件中将表命名为 `.Lswitch.table.table_switch`,并附注释 `@switch.table.table_switch` mục tiêu trong tập tin chỉ còn lại một định vị và chữ cái.

AArch64 形式通过 `adrp x8`和 `add x8, x8, #0x0`拼出表地址,两者各带一条指向 `.rodata`重定位, tái sử dụng `ldr w0, [x8, w0, uxtw #2]`                                                                                                                                                                                                                                                              `add`                                                                                                                                                                                                                                                              

### 完全没有表的线性映射

`linear_switch`Đối với 0 đến 6 `k` quay lại `10 * (k + 1)``simplifySwitchLookup`检测到仿射关系,改为生成算术操作:

```text
      b0: 83 ff 07                     	cmpl	$0x7, %edi
      b3: 8d 04 bf                     	leal	(%rdi,%rdi,4), %eax
      b6: 8d 4c 00 0a                  	leal	0xa(%rax,%rax), %ecx
      ba: b8 ff ff ff ff               	movl	$0xffffffff, %eax
      bf: 0f 42 c1                     	cmovbl	%ecx, %eax
```

求值器将 `leal (%rdi,%rdi,4)`读为 `5*k`,将 `leal 0xa(%rax,%rax)`读为 `10*k + 10`,将 `cmpl $7`后的 `cmovb`读为 `k < 7 ? 10*k + 10 : -1`△ sau đó nhận dạng thiết bị sử dụng mỗi nguồn mã分支检查公式,并将模式标记为已验证──AArch64 通过 △`madd w8, w0, w8, w9`和 `csinv w0, w8, wzr, lo` nhận được biểu hiện tương tự, trong đó có `wzr`của `csinv`Trong các đường dẫn được thông qua`-1`

### Từ重定位读取跳转表

`-O2`下的 `call_switch`Với thứ 33 课在`-O0`của `grade`Trong hình thức phục hồi tương tự:`cmpl $4; ja`、 hướng tới `.rodata-0x4`của `leaq`、读取 4 字节条目的 `movslq``addq`, tiếp tục`jmpq *%rax`◊五条条目是 `.rela.rodata`Trung tâm trọng tâm,`target = addend - 4k` Đưa ra `0x10c, 0x107, 0x10e, 0x110, 0x109`,分别指向五个不同的块, mỗi块通过函数指针尾跳转.`dispatch`具将其扩展为16 个分支:x86-64 上有16 条重定位;AArch64 上则是16 个单字节组成的压缩表,用`ldrb w11, [x9, x8]`读取,以 `add x10, x10, x11, lsl #2`Lần thứ 4 chỉ ra phần đầu tiên của phần.`adr`为基址──识别器 从字节表解码出 `[0x24, 0x74, 0x54, ...]`,并 báo cáo `compressed: true`

### Cùng một chuyển đổi của bốn loại tối ưu hóa

`digest`包含对 `sum / 10`của chuyển đổi, chia thành 6 đến 10, giá trị là 1 2, 4, 8, sau đó kết quả sẽ được nhân lên 16... trên x86-64, nó là`-O0`下为跳转表, trong `-O1`下为条目 `[16, 32, 64, 128, 128]`       `-O2`和 `-O3`Trở lại, 4 phần còn lại được lưu lại.`0x10``0x20``0x40``0x80` Từ `-O1`起,乘以 16 移 into分支; trong `-O0`下,分支保存 1、2、4、8,乘法 vẫn đang chuyển đổi 之后──对`-O1`查找表,识别器将条目与源码值比较, tìm tỷ lệ cố định,并报告 `foldedFactor: 16`✿AArch64 của ✿`-O2`hình thức là một cái cây so sánh của 8 trục trung tâm, bao gồm các thử nghiệm tương tự của 6、7、8 trục, cũng như các thử nghiệm phạm vi.`sub w9, w9, #9; cmp w9, #2; b.hs`, sử dụng hai bài kiểm tra hoạt động bao gồm phân đoạn 9 và 10  báo cáo nhận dạng `rangeTests: [[9, 10]]`

Hai phần tử sẽ di chuyển những giới hạn này.`-fno-jump-tables`Trong x86-64 上将 `table_switch``call_switch`和 `digest`của chuyển đổi 转为比较树,七分支函数的枢轴为 2 和 4──AArch64 上,`-mllvm -min-jump-table-entries=4`仍让 `call_switch`保持比较树, do đó đối với mục tiêu trên, số lượng mục tiêu không phải là yếu tố quyết định.`idioms-arm64-jt4-O2.o`Tôi đã ghi lại chuyến đi này.

GCC sẽ đưa ra hai quyết định.`tree-switch-conversion.cc`中, sử dụng `jump_table_cluster``bit_test_cluster``switch_decision_tree`和 `switch_conversion`类──`-ftree-switch-conversion`Trong `-O2` mở ra,`-fjump-tables`和 `-fbit-tests`Trong `-O1`                                                                                                                                                                                                                                                              `case-values-threshold`,默认值由机器决定──This机器没有安装 GCC,因此这些名称来自 GCC 源码和手册,可在编译器探险器中检查──

## Chuyển:向量化、展开或替换

LLVM của vòng tròn`-O2``-O3``-Os`n mở, trong `-O0``-O1`关闭, This article规则 có thể được truy cập vào LLVM 3.4 tháng 1 năm 2014.`-O2`下的 `sum_n` thể hiện hình dạng này mỗi phần:

```text
     1f6: 83 fe 07                     	cmpl	$0x7, %esi
     1f9: 77 09                        	ja	0x204 <sum_n+0x14>
     206: 81 e2 f8 ff ff 7f            	andl	$0x7ffffff8, %edx
     230: f3 0f 6f 14 37               	movdqu	(%rdi,%rsi), %xmm2
     235: 66 0f fe c2                  	paddd	%xmm2, %xmm0
     239: f3 0f 6f 54 37 10            	movdqu	0x10(%rdi,%rsi), %xmm2
     23f: 66 0f fe ca                  	paddd	%xmm2, %xmm1
     243: 48 83 c6 20                  	addq	$0x20, %rsi
     24a: 75 e4                        	jne	0x230 <sum_n+0x40>
     24c: 66 0f fe c8                  	paddd	%xmm0, %xmm1
     250: 66 0f 70 c1 ee               	pshufd	$0xee, %xmm1, %xmm0
     262: 66 0f 7e c8                  	movd	%xmm1, %eax
     270: 03 04 97                     	addl	(%rdi,%rdx,4), %eax
     279: 75 f5                        	jne	0x270 <sum_n+0x80>
```

 bảo vệ điều kiện `cmpl $7; ja`Sẽ ít hơn 8 lần đưa vào vòng lặp quy mô `andl $0x7ffffff8`Để chuyển đổi số lần xuống thành 8 lần.`xmm`累加器, mỗi chứa bốn 32 位通道, do đó向量化因子为 4交错因子为 2 循环后,`paddd`、两条 `pshufd`、另外两条 `paddd`和 `movd`Để 8 đường dẫn được chia thành một số nguyên.`0x270`Chuyện này là xử lý cuối cùng 0 đến 7 nguyên tố của một chuyện số lượng dư.`paddd`读取通道数,统计不同累加器,将步长 `0x20`Ngoài ra, báo cáo`4 lanes x 2 accumulators = 8 elements per iteration`,并以字段形式记录掩码、保护条件、归约和余数循环──Aarch64 用`ldp q2, q3`、两条 `add v.4s``addv s0, v0.4s`和 `fmov w8, s0`完成相同工作──

Số lần cố định sẽ loại bỏ vòng lặp.`sum4`Từ một条 `movdqu`、đối với nhau `movd`构成,没有回边――`poly8`Không thể định lượng, vì mỗi vòng phụ thuộc vào một vòng cộng, do đó biên dịch viên sẽ mở ra nó tám lần: từ `%rdi`                                                                                                                                                                                                                                                              `0x1c`Lấy 8 lần, mỗi lần sau tất cả chuyển 5 lần nữa, tính toán`acc * 31`                                                                                                                                                                                                                                                                                                                                                   `loop unrolled by 8, no back edge`◊AArch64 cùng tải với 4 đối với`ldp`xuất hiện

用 `-fno-vectorize -fno-slp-vectorize`关闭向量化器后,`sum_n`变为展开八次的标量循环,包含八条 `addl k(%rdi,%rdx,4), %eax`和 `addq $8`, tái thêm số lượng vòng.`sum4`则变成四次加法──识别器对前者报告 `unrolled loop``copies: 8`和 `indexStep: 8`, đối với người sau báo cáo`copies: 4`

第33 课在`-O2`của `total`Trong đó tìm thấy hai vòng quay, gọi chúng là hai vòng quay; bài học này tiếp tục chỉ ra, chúng là chủ thể khối lượng và phần dư lượng của cùng vòng quay nguồn. Chỉ khi vòng quay có thể đạt được vòng quay một lần nữa, nó mới tạo thành vòng quay.`is_loop()`检查这个条件,因为 AArch64 的 `digest`含有向后跳到共享默认块的分支,它们不是循环,而识别器第一版误认为其为向量循环.

### Chuyển đổi thành vòng tròn

Từ `-O1`起,`LoopIdiomRecognize`Chuyển đổi vòng lặp của từng chữ số`memset`调用。`-O2`下的 `fill` `testl %esi, %esi; jle; movl %esi, %edx; xorl %esi, %esi; jmp memset@PLT`◊该调用是带 `R_X86_64_PLT32 memset-0x4`重定位的尾跳转, hàm của `retq`Chỉ xuất hiện trên đường空.`store loop recognized as memset(...)`,并对照源码循环验证, vì nguồn code chưa bao giờ được sử dụng trực tiếp `memset`

`copy16`用常量 16 调用 `memcpy`,x86 后端将其内联为 `movups (%rsi), %xmm0; movups %xmm0, (%rdi)`, không vượt quá mỗi lần `memcpy`Tối đa 8 lần hạn chế lưu trữ:`-O0`下, cùng调用为两对8 字节 `movq` Sử dụng`-fno-builtin`时,调用保留为带 `movl $0x10, %edx`của `jmp memcpy@PLT`-`fill`Bảo trì vòng lặp, biến số hóa sau đó chuyển thành hai vòng 16 字节`movups`存储──识别器 `vectorized store loop: 2 x 16-byte stores = 32 bytes per iteration`

##  biến mất hoặc biến thành nhảy chuyển调用

`tail_caller` quay lại `tail_target(x + 1)` `-O0`- Nó là...`addl $0x1, %edi; callq tail_target@PLT; addq $0x10, %rsp; popq %rbp; retq`; trong `-O2`下, chỉ có `incl %edi; jmp tail_target@PLT`△调用者消失,被调用者直接返回调用者的调用者──AArch64 上是带 `R_AARCH64_JUMP26`của `b tail_target`❖ Máy nhận dạng sẽ được sử dụng để định vị lại `jmp`Hoặc`b`视为尾调用──第 33 课的递归下降必须将它视为函数出口, vì mục tiêu nằm bên ngoài函数──

`twice_sum`调用 `leaf_add` `-O0`Địa điểm`callq leaf_add@PLT`Từ`-O1`起,`leaf_add`  `leal (%rdi,%rsi), %eax`Tự hiện ra`twice_sum`Trong, không còn giữ lại调用.`-O0`下, clang 为 mỗi hàm ký `optnone`和 `noinline`, chỉ chạy thiết bị liên kết bắt buộc.`twice_sum`调用 rồi `leaf_add`, nếu không tìm thấy调用或尾跳转, hãy tìm trong调用者 tìm kiếm hình thức hàm thể của người được调用: bỏ đi các ký hiệu và nguồn hoạt động sau số mục tiêu.`add w8, w1, w0`能匹配被调用者中 `add w0, w1, w0` tìm thấy một sự phù hợp là bằng chứng

`dispatch`Đồng thời kết hợp hai mô hình: một 16 bài nhảy chuyển biểu, mỗi分支 đều là `movl %esi, %edi; jmp fN@PLT`❖ Identifier Report một chuyển đổi và 16 个尾调用,并全部与源码中的 16 lần调用验证──

## 变成数据移动的分支

`clamp_max` `movl %esi, %eax; cmpl %esi, %edi; cmovgl %edi, %eax`求值器将 `%edi`命名为`a``%esi`命名为`b`, ghi chép so sánh, tái `cmovg`解读为 `a > b ? a : b`, phù hợp với mã nguồn:`abs_int` `movl %edi, %eax; negl %eax; cmovsl %edi, %eax`,读作 `-x < 0 ? x : -x`;AArch64 则写作 `cmp w0, #0; cneg w0, w0, mi`,读作 `x < 0 ? -x : x``is_pos` `xorl %eax, %eax; testl %edi, %edi; setg %al`,即 `(x > 0)`GCC sẽ chuyển đổi loại này thành `-fif-conversion`,LLVM 则称为`cmov`选择――LLVM của `X86CmovConversion` quá trình phán quyết có lợi`cmov`Chuyển lại phân đoạn, điều này cũng giải thích rằng cùng một nguồn mã có thể xuất hiện trong vòng lặp một hình thức khác.

Trong `-O0`Những mô hình này không tồn tại.`clamp_max`là so sánh`jle`、Trong cùng một kho lưu trữ và tải một lần.`-O0`下不报告模式, từ `-O1`起 báo cáo `branchless select`, hình ảnh trực tiếp cho thấy sự thật này.

`mul9`Chỉ có một bài thôi.`leal (%rdi,%rdi,8), %eax`, báo cáo nhận dạng`strength reduction`和 `x * 9`, vì mã nguồn thực sự nhân lên 9 . Chỉ có mã nguồn chứa yếu tố này khi báo cáo như vậy; thu nhỏ của bảng chỉ mục .`lea`Không nên được nhận dạng là nguồn mã số.

## 2 kiểu trông giống như đặc tính cố định của mô hình thông thường

 bảo vệ là tính chất của bộ biên dịch, sẽ dễ bị người thông minh hiểu sai về hình thức logic của chương trình.`canary.c`Trong x86-64 Linux 上使用 `-fstack-protector-strong`编译, nhận được:

```text
       7: 64 48 8b 04 25 28 00 00 00   	movq	%fs:0x28, %rax
      10: 48 89 44 24 40               	movq	%rax, 0x40(%rsp)
      26: 64 48 8b 0c 25 28 00 00 00   	movq	%fs:0x28, %rcx
      2f: 48 3b 4c 24 40               	cmpq	0x40(%rsp), %rcx
      34: 75 05                        	jne	0x3b <with_canary+0x3b>
      3b: e8 00 00 00 00               	callq	0x40 <plain_leaf>
		000000000000003c:  R_X86_64_PLT32	__stack_chk_fail-0x4
```

`%fs:0x28``tcbhead_t`Trung `stack_guard`,字节偏移为 40;LLVM 的 `getIRStackGuard`Vì glibc、bionic 和 Fuchsia 指定这个槽── hàm序言将保护值复制到缓冲区上方,尾声比较,失败路径调用 `__stack_chk_fail`◊AArch64 Linux 上, bảo vệ từ toàn局 `__stack_chk_guard`经 GOT,`adrp`和 `ldr`取得,失败路径为 `bl __stack_chk_fail` báo cáo về giá trị bảo vệ nguồn; 槽; 比較和失败调用; 没有数组`plain_leaf`Trong `strong`Không có cá voi;`alloca`hoặc hàm được lấy từ địa chỉ biến đổi địa chỉ địa chỉ địa phương.`/GS`形式:cookie với `%rsp`混合, qua `__security_check_cookie`检查──机器上没有MSVC 链接器, do đó hình thức này chỉ dựa trên biên dịch viên汇编输出描述──

`-fcf-protection=full`sẽ`endbr64`(字节 `f3 0f 1e fa`(v) Đưa vào các lệnh đầu tiên của mỗi hàm.`nop`执行──Ghidra của x86-64  hàm bắt đầu mô hình do đó chứa `endbr64`前的 `push rbp; mov rbp, rsp`变体──识别器将其报告为 `cet landing pad`, tránh đưa các hàm bắt đầu với bốn chữ cái không thường sai lầm như dữ liệu.

## 反编译器会折叠哪些模式

Chương 37 Mỗi bộ máy biên dịch trong bài học sẽ thực hiện các quy tắc viết lại trong đó một phần của nó.`ruleaction.cc`中为规则命名──`RuleDivOpt`是将 INT_MULT 与移位形式转为 INT_DIV 或 INT_SDIV,包含形式 `sub( (zext(V)*c), d) >> e => V / (2^n/(c-1)) where n = d*8 + e`, và sử dụng`sext`和 `s>>`Có biểu tượng biến đổi.`RuleModOpt`                                                                                                                                                                                                                                                              `RuleDivTermAdd`处理加法修正,`RuleSignDiv2`sẽ`(V + -1*(V s>> 31)) s>> 1`转成 `V s/ 2`- Tôi không biết.`RulePositiveDiv`则将符号位为零的值有符号除法转变为无符号除法.`-O1`下 `grade`của xuất, trong đó viết `uVar2 = param_1 / 10 - 6;`,说明除法已被折叠──

Không cần Java cũng có thể xem các mục nhập của các quy tắc này.`code/fixtures/idioms-x86_64-O2.lifts.json` Bảo tồn `div10s`Cód P gốc: 7 lệnh đối với 112 mục, trong đó 7 là đánh dấu mỗi lệnh bắt đầu`IMARK` Trong số đó có `unique[95a00:8] = sext(0x66666667)`后后的`RAX = RAX * unique[95a00:8]`, và`RCX = RCX >> unique[d1a00:4]``RAX = RAX s>> unique[c5c00:4]``shrq`- Có 41 hoạt động.`sarq`带 40 个, 更多用于计算标志位.`RuleDivOpt`Trong dòng chảy phù hợp với số nhân và hai lần chuyển vị trí, mã cái chết loại bỏ các dấu hiệu không người đọc.

Angr 10.0.3 đối với本课 `-O2`目标文件运行,`idioms-x86_64-O2.angr.json`保存了20 hàm của反编译输出──它折叠无符号形式:`div10u`Vì vậy`return a0 / 10;`Nhưng không gấp có hình thức符号:`div10s`Vì vậy`v1 = a0 * 1717986919; return ((long long)(v1) >> 0x22) + (v1 >> 63);`- Tôi không biết.`mod10s`Vì vậy`a0 - (...) * 2 * 5` đối với `div7u`, nó xuất khẩu `(a0 / 7 + ((a0 * 6 / 7 & 0xffffffff) >> 1 & 0xffffffff) & 0xffffffff) >> 2`, sửa đổi vẫn còn trong hình thức toán học tồn tại.`mul9`折叠为 `a0 * 9``linear_switch`Vì vậy`(a0 < 7 ? a0 * 10 + 10 : 0xffffffff)``clamp_max`Vì vậy`((int)a1 < (int)a0 ? a0 : a1)``is_pos`Vì vậy`a0 > 0``fill`Vì vậy`return memset(a0, 0, a1);` Nó sẽ `table_switch`输出为不含表值的加载 `*(int *)(4 * a0 + 4195400)`-`sum_n`Sử dụng `_mm_add_epi32`和 `_mm_shuffle_epi32`内建函数;`tail_caller`Vì vậy`tail_target(); return;`, mất số lượng.`digest`Trung 跳转表变成 `goto *((void *)(...))`,并展开表地址算术──

Từ nguồn xây dựng đến nghiên cứu bộ nhớ radar2 6.2.4 và rizin 0.9.1 cũng đối với cùng một mục tiêu tập tin vận hành.`pdc`sẽ`div10s`输出为 `rax = rax * 0x66666667; rcx >>>= 0x3f; rax >>= 0x22; eax += ecx`, đây là một hệ thống ghi nhớ không gấp lớp giả C;`table_switch`Vì vậy`eax = dword [rcx + rax*4]`, trong `lea`            `RELOC 32 .rodata`注释──rizin 没有内建反编译器;其 `aoi`sẽ`imul`RzIL 打印为 128位乘积──lldb-1703.0.236.21 加载 ELF 目标文件后,`disassemble -n div10s`输出与 `llvm-objdump`Tương tự như 7条 chỉ thị, vì cả hai đều sử dụng LLVM 反汇编器──Capstone 5.0.7 解码相同字节,并报告 `ret``mode64`等分组; nó chỉ là giải mã, giải mã máy xuất không bao gồm các mô hình thông thường. Ở đây không chạy IDA Pro và Binary Ninja; tài liệu của nó mô tả giai đoạn viết lại như vậy, đó là quá trình microkode 优化 và MLIL đến HLIL, trong đó không tuyên bố chúng gấp đôi cụ thể.

Compiler Explorer dùng để xác minh chính xác.`idioms.c`, chọn như x86-64 clang 18.1.0 hoặc ARM64 GCC 14.2.0 của biên dịch viên mục, tái thiết lập các tham số。`GET /api/compilers/c`返回标识符,`POST /api/compiler/<id>/compile`以 JSON 返回汇编──Matt Godbolt trong bài viết ACM queue năm 2019 sử dụng nó để trình bày các giải pháp, đặt vị trí tính toán, các điều kiện chuỗi và yêu cầu mô hình── có thể sử dụng nó để có được các máy tính không thể tạo ra GCC 输出, sẽ GCC 跳转表值和 GCC 12 起的`-O2`To quantize default setting, với clang trong thiết bị 输出比较

## tự xây dựng

运行演示:

```bash
cd phases/13-tools-and-protocols/39-compiler-idioms-and-optimization
python3 code/main.py
```

输出 là một báo cáo JSON ⋅ cho mỗi một trong 18 cấu trúc, nó liệt kê từng hàm và mô hình sử dụng thông thường, bao gồm các loại, dạng mã nguồn, địa chỉ chứng cứ, trạng thái xác minh và các đoạn chi tiết.`-O2`Với`-O3`So sánh, và`unverified`列表:

预期结构如下:

```json
{
  "builds": {
    "idioms-x86_64-O2": {
      "arch": "x86_64", "level": "O2", "flags": "x86_64",
      "functions": {
        "div7u": [{"kind": "division", "source": "x / 7", "evidence": ["0x30", "0x32", "0x39", "0x3d", "0x3f", "0x41", "0x43"], "verified": true, "form": "magic multiply with add fix-up", "magic": "0x24924925", "effectiveMagic": "0x124924925", "shift": 35, "...": "..."}],
        "table_switch": [{"kind": "switch", "source": "switch (k) as lookup table", "table": ".rodata+0x28", "entries": 7, "values": [10, 20, 30, 40, 50, 60, 71], "...": "..."}],
        "sum_n": [{"kind": "vector loop", "lanes": 4, "accumulators": 2, "elementsPerIteration": 8, "...": "..."}]
      }
    }
  },
  "kindMatrix": {"idioms-x86_64-O2": {"division": 5, "modulo": 3, "switch": 6, "vector loop": 3, "...": "..."}},
  "sameCodeAtO2AndO3": {"x86_64": {"identical": true}, "arm64": {"identical": false, "differences": ["..."]}},
  "unverified": []
}
```

按以下顺序阅读 `code/main.py`- Có thể là:

1. `parse_listing()`Tự hình của hai loại`llvm-objdump -d -r`文本转成 hàm、 chỉ thị và kèm theo định vị lại.
2. `ElfFile`读取节、符号和 `.rela.*`条目,`words()`读取表条目──
3. `magic_numbers()``divisor_from_magic()`和 `evaluate_division()`分别实现 Granlund-Montgomery's正向推推导、反向推导及命令序列求值──
4. `parse_source()`Từ C 文件提取验证 cần thiết cấu trúc:
5. `Evaluator`là quá trình phân tích mã hóa từng khối vận hành, được đặt tên cho các ký hiệu và hầm.
6. `find_divisions()`和 `find_modulos()`匹配乘法、移位、修正、乘回和2 的等形式──
7. `find_switches()`分类跳转表, tìm kiếm表,线性映射, chọn chuỗi, so sánh cây và so sánh chuỗi.
8. `find_vector_loops()``find_unrolled_loops()``find_tail_calls()``find_inlined_calls()``find_selects()``find_memory_builtins()``find_stack_protector()``find_cet()`和 `find_strength_reduction()`覆盖其余模式──
9. `analyze_function()`Theo thứ tự vận hành các bước này, sẽ được kết quả của mỗi mô hình được đặt vào một vòng tìm giá trị.

Còn ba lệnh nữa.`python3 code/main.py scan FILE.objdump.txt [FUNCTION]`Đặt một bộ nhận dạng hoạt động và tìm kiếm các mục tiêu và các C 文件 phù hợp bên cạnh.`python3 code/main.py magic DIVISOR [signed]`输出乘数、移位、误差, cũng như liệu các trình bình thường có tồn tại trên giá trị biên giới không.`python3 code/main.py figure-data`输出图示嵌入的数据――

## Sử dụng nó

Để xây dựng các tài liệu mục tiêu mới, theo thứ tự sau đây sử dụng bộ nhận dạng:

1. Từ mục tiêu thu thập tài liệu`llvm-objdump -d -r`输出,并将准确编译命令一起保存──识别器从清单头读取架构──
2. Đối với hoạt động thanh toán`scan`, trước đọc `unverified`条目── Mỗi mục hoặc là cấu trúc của bộ phân tích mã nguồn bị bỏ qua, hoặc là hình thức của bộ nhận dạng đọc sai, đều đáng xem đối với địa chỉ chứng minh ứng dụng──
3. Đối với mỗi phân biệt`algorithm``clangMatchesAlgorithm`Vì vậy, biên dịch viên đã chọn số lượng chuyển động hiệu quả tối thiểu; vì vậy, nếu bạn không biết lý do, nên ghi lại số lượng thường xuyên.
4. Đối với mỗi chuyển đổi, so sánh các cấp độ tối ưu hóa khác nhau.`lowering` biểu tượng biến thành cây hoặc cây biến thành biểu tượng, đánh dấu giá trị được chỉ ra trong mã nguồn LLVM 
5. Đối với mỗi vòng`elementsPerIteration`和 `scalarRemainderLoop`, tái xác nhận hai phần của bài báo 33 đối phó với một vòng lặp mã nguồn.
6. Sử dụng một máy chống biên dịch xử lý cùng một tập tin mục tiêu, trích dẫn văn bản của nó bên cạnh mỗi mô hình, và ghi lại những mô hình mà nó gấp lại.

## 交互实验

### 实验 A:推导魔数, tái tìm nó

Trong `code`目录中启动 Python:

```bash
cd phases/13-tools-and-protocols/39-compiler-idioms-and-optimization/code
python3 -q
```

运行:

```python
from main import *
magic_numbers(10), magic_numbers(10, signed=True)
magic_numbers(7), magic_numbers(7, signed=True)
divisor_from_magic(0x66666667, 34, signed=True), divisor_from_magic(0x66666667, 33, signed=True)
```

Lần đầu tiên được sử dụng trước, trước tiên được tính trên giấy.`ceil(2^35 / 10)`   `idioms.c`     `unsigned div13(unsigned x) { return x / 13; }`, dùng`build_fixtures.sh`Chỉ thị trung ương`-O2`构建,将清单中的常量与 `magic_numbers(13)`Để xem.

### 实验 B:表与树

```python
listing = load_listing("idioms-x86_64-O2.objdump.txt")
elf = load_elf("idioms-x86_64-O2.o")
sources = load_source("idioms.c")
[i.to_dict() for i in analyze_function(listing, "table_switch", elf, sources)]
[i.to_dict() for i in analyze_function(listing, "sparse_switch", elf, sources)]
elf.words(".rodata", 0x28, 7)
```

Trong `table_switch`    `71`改回 `70`,`-O2`Cần xây dựng, quan sát tìm biểu đồ trở thành biểu đồ đường dẫn.`ArrayKind`- Bố

### 实验 C: 三种设置下循环

```python
for name in ("idioms-x86_64-O1", "idioms-x86_64-O2", "idioms-x86_64-novec-O2"):
    print(name, [i.source for i in analyze_function(load_listing(name + ".objdump.txt"), "sum_n", load_elf(name + ".o"), sources)])
```

手绘 `-O2`下 `sum_n`của kiểm soát dòng chảy, biểu thị điều kiện bảo vệ, ẩn chứa, chủ thể khối lượng, vòng quay về và số dư, tái hợp`detail`字段比较。

### 实验 D: chia sẻ thương mại

```python
for name in ("idioms-x86_64-O1", "idioms-arm64-O1"):
    print([(i.kind, i.source, i.detail.get("sharedQuotient")) for i in analyze_function(load_listing(name + ".objdump.txt"), "digest", load_elf(name + ".o"), sources)])
```

阅读 `digest`của `-O1`清单, tìm x86-64 上将商与符号修正合并的两条指令,再解释为什么AArch64 构建只需要一条──

## 实践实验

Trong 具中加入位运算技巧,并扩展识别器──

要求:

- Sử dụng GCC trong xây dựng hàm và chuyển vị trí hoặc vận chuyển quay, biên tập `popcount``ctz``rotl`函数, trong `-O2`下分别带和不带 `-mpopcnt -mbmi`构建,将目标文件和清单一起提交──
- 识别`TargetLowering::expandCTPOP`生成的`0x55555555``0x33333333``0x0f0f0f0f``0x01010101`置位计数序列, báo cáo`popcount`,并以四常量作为证据──
- sẽ`rep bsfl`识别为`tzcnt`Hoặc`bsf`    `roll %cl`识别为旋转,并将两者解码回内建函数──
- Trong `parse_source()`验证中加入新类别, làm `popcount`模式 chỉ trong nguồn调用 `__builtin_popcount`时才被验证――
- Để mỗi mô hình thêm một bài kiểm tra từ 具清单读取常量.

Kiểm chuẩn thành công:`python3 code/main.py`Trong hai cấu trúc, tất cả sẽ có ba loại mới báo cáo cho`verified: true`,测试套件 vẫn báo cáo空的 `unverified`列表:

## 本课产物

本课包含 `outputs/skill-compiler-idioms-and-optimization.md` Sử dụng nó để làm rõ các mục tiêu tài liệu và mã nguồn chuyển thành các báo cáo mô hình thông thường của chứng minh, và kèm theo các đối tác so sánh. Nó yêu cầu mỗi tuyên bố có địa chỉ chứng minh, mỗi phép trừ có số lượng dẫn đường, mỗi chuyển đổi có nguồn phân loại và mục tiêu giảm, mỗi mô hình có tham chiếu các đối tác soạn thảo xuất phát.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/39-compiler-idioms-and-optimization
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明:

- 清单解析器 từ `-O2`目标文件读取 25 个函数,保留字节,并将 `R_X86_64_PC32 .rodata+0x24`附到 `table_switch`Trung `leaq`
- ELF 读取器 từ `.rodata+0x28` quay lại `[10, 20, 30, 40, 50, 60, 71]`,并读取 `.rela.rodata`                                                                                                                                                                                                                                                              
- `magic_numbers`返回移位 35 的 `0xcccccccd`、移位 34 của `0x66666667`、移位 35 且带加法形式的 `0x124924925`、移位 32 của `0x55555556`, và chuyển vị trí 33 `0xaaaaaaab`
- Đối với 2 đến 64 mỗi không phải là số chia của 2 , dù có biểu tượng hay không biểu tượng, các đồng bằng đều được thành lập trên giá trị biên giới 32 điểm.
- `divisor_from_magic`Từ tham số đối với phục hồi 10、5、7、3,并拒绝错配对
- 加法修正序列精确计算 `n // 7`
- 4 x86-64 Báo cáo về số nhân chính xác, chuyển vị, số nhân và hình thức, 4 AArch64 Báo cáo về mã giải pháp`mov`和 `movk`
- `-O0`Sử dụng `divl`和 `idivl`- Tôi không biết.`-O0 -fast-isel=false`Sử dụng乘法, và `-O0`của `digest`混合两者
- 取模可识别为乘回`msub`、2 của `sdiv`加 `mul`加 `subs`, và các phần cứng `idivl`
- 共享商在 `-O1`下同时 giữ trừ法和取模
- 两种架构在 `-O2`Các cách giảm xuống dưới đây được phân loại, bao gồm các công thức, giá trị, mục tiêu, trọng tâm và biểu hiện chọn
- `-O0`Đổi xuống trên x86-64 trên là chuyển đổi biểu đồ, trên AArch64 trên là kết nối so sánh
- x86-64 của `digest`chuyển đổi theo sau cho biểu đồ nhảy ập yếu tố tìm kiếm 16 biểu đồ nhảy 4 mục tiêu khác nhau;AArch64 trên则 với 9 đến 10  phạm vi thử nghiệm cây so sánh
- `-fno-jump-tables`生成比较树,16 分支 `dispatch`Trong x86-64 上 从重定位读取目标, trong AArch64 上 从缩字节表读取
- Chuyện chu kỳ định lượng báo cáo 4 đường dẫn 2, bộ tích tụ 8, mỗi vòng 8 nguyên tố, cũng như che giấu, điều kiện bảo vệ, quy mô và vòng dư
- Chuyện liên tục cố định được định lượng hoàn toàn hoặc hoàn toàn mở ra,`-fno-vectorize`按 8 次展开
- `-O1`Không có biến đổi; x86-64 上 `-O2`Với`-O3`Tương tự như AArch64 上只在`call_switch`Không giống nhau,`-O3`Có 17 điều luật.`-O2`Có 18 条
- `-fno-builtin`Chuyển đổi vòng lưu trữ sang vòng lưu trữ định lượng hóa, sẽ`memcpy`Bảo tồn để sử dụng
- 尾调用,`memset`替换、内联 16 字节复制, cũng như `-O0`Các bản sao di động được nhận ra
- Từ `-O1`起能根据函数体形态找到内联的被调用者
- 选择表达式解码为 `a > b ? a : b``-x < 0 ? x : -x``(x > 0)`和 `sum % 10 < 5 ? sum % 10 : 5`
-  bảo vệ báo cáo `%fs:0x28`、槽 và `__stack_chk_fail`,CET  Căn cấu tạo mỗi hàm đều báo cáo `endbr64`
- 源码解析器读取 hàm chỉ số参数、switch 分支、调用和累加器名称
- Mỗi mô hình của cấu trúc đều được chứng minh, các loại mô hình phù hợp
-  giao diện hình ảnh nhập dữ liệu và phân tích cùng đầu ra

## Mô hình thất bại trong môi trường sản xuất

| 失败 | 不严谨的工具报告 | 分析必须证明什么 |
|---|---|---|
| 乘以很大的奇数常量 | “乘以 1717986919” | 常量是某个 `d` 对应的 `ceil(2^s / d)`，误差满足界限，移位量是最小有效值 |
| 右移 32 位后的加法修正 | 五条算术指令 | 乘数为 33 位，尾部是同一方法的加法形式 |
| 相同乘数、不同移位 | 相同除数 | 移位决定除数：34 对应 10，33 对应 5 |
| 对 2 的幂有符号取模 | “加 7、掩码、相减” | 偏置使舍入向零，结果为 `x % 8` |
| 从 `.rodata` 索引加载 | “跳转表” | 它是值查找表，条目从加数加 4 处的字节读取 |
| 仿射算术加 `cmov` | “计算 10k + 10” | 这是降低为线性映射的 switch，并与每个源码分支验证 |
| 按序分割的比较链 | “一串 if” | 对分支常量的二分查找，并明确枢轴 |
| 向后分支到默认块 | “循环” | 目标通过无条件跳转离开区域，属于共享尾部 |
| 一个函数中两条回边 | “两个循环” | 一个源码循环的向量主体及其标量余数部分 |
| `jmp memset@PLT` 没有 `ret` | “函数没有返回” | 尾调用通过被调用者返回，替代了存储循环 |
| 调用图缺少被调用者 | “从未调用” | 已内联：调用者中出现被调用者的函数体形态 |
| `%fs:0x28` 加载和比较 | “读取线程局部数据” | 栈保护 canary，失败路径指向 `__stack_chk_fail` |
| 函数起始四个奇怪字节 | “函数前的数据” | `endbr64`，即 CET 落点 |
| 反编译器展示原始算术 | “工具错了” | 工具没有应用折叠；推导给出源码形式，引用输出记录差距 |

## 操作准则

匹配形态,反向执行推导,写出能证明它的常量──为每种模式报告证据地址和编码出出的源码形式,对照自己编译的源码逐一验证,并引用每个反编译器对同一字节输出的内容──

## 延伸阅读

- [Granlund, Montgomery, "Division by Invariant Integers using Multiplication" (PLDI 1994)](https://gmplib.org/~tege/divcnst-pldi94.pdf)
- [Warren, Hacker's Delight, 2nd edition, Chapter 10: Integer Division By Constants](https://www.informit.com/store/hackers-delight-9780321842688)
- [Lemire, Kaser, Kurz, "Faster Remainder by Direct Computation" (2019)](https://arxiv.org/abs/1902.01961)
- [libdivide, header-only division by runtime constants](https://github.com/ridiculousfish/libdivide)
- [LLVM `DivisionByConstantInfo.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Support/DivisionByConstantInfo.cpp)
- [LLVM `SwitchLoweringUtils.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/CodeGen/SwitchLoweringUtils.cpp)và [`TargetLoweringBase.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/CodeGen/TargetLoweringBase.cpp)
- [LLVM `SimplifyCFG.cpp`, `simplifySwitchLookup`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Transforms/Utils/SimplifyCFG.cpp)
- [LLVM Auto-Vectorization documentation](https://llvm.org/docs/Vectorizers.html)và [LLVM 3.4 release notes](https://releases.llvm.org/3.4/docs/ReleaseNotes.html)
- [LLVM `LoopIdiomRecognize.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Transforms/Scalar/LoopIdiomRecognize.cpp)
- [LLVM `X86CmovConversion.cpp`](https://github.com/llvm/llvm-project/blob/release/20.x/llvm/lib/Target/X86/X86CmovConversion.cpp)
- [LLVM `StackProtector.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/CodeGen/StackProtector.cpp)và [`X86ISelLoweringCall.cpp`, `getIRStackGuard`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Target/X86/X86ISelLoweringCall.cpp)
- [glibc `sysdeps/x86_64/nptl/tls.h`, `tcbhead_t`](https://sourceware.org/git/?p=glibc.git;a=blob;f=sysdeps/x86_64/nptl/tls.h)
- [GCC `tree-switch-conversion.cc`](https://github.com/gcc-mirror/gcc/blob/master/gcc/tree-switch-conversion.cc)- [GCC Optimize Options](https://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html), và[GCC 12 release notes](https://gcc.gnu.org/gcc-12/changes.html)
- [Ghidra decompiler `ruleaction.cc`](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/Decompiler/src/decompile/cpp/ruleaction.cc)
- [angr decompiler documentation](https://docs.angr.io/en/latest/analyses/decompiler.html)
- [radare2 book: decompilers](https://book.rada.re/arch/decompile.html)
- [Compiler Explorer API](https://github.com/compiler-explorer/compiler-explorer/blob/main/docs/API.md)
- [Godbolt, "Optimizations in C++ Compilers: A practical journey", ACM Queue 17(5), 2019](https://queue.acm.org/detail.cfm?id=3372264)
- [Microsoft, `/GS` (Buffer Security Check)](https://learn.microsoft.com/en-us/cpp/build/reference/gs-buffer-security-check)
