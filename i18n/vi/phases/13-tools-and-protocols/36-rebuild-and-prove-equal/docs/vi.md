# 重建并证明等价:差分测试、字节比较与证据闭环

> 测通过 chỉ chứng minh kết quả trên các thử nghiệm này phù hợp; để hỗ trợ sự bình đẳng giá trị, cần phải bao gồm các đường nhập của mỗi biên giới, cũng như các phụtogram vẫn phù hợp sau khi ngăn chặn tái định vị.

**Type:** Build
**Languages:** Python, C
**Prerequisites:** Phase 13 · 34（提升为伪代码）、Phase 13 · 35（证据、置信度与未知项）
**Time:** ~110 分钟

## Học mục tiêu

- 根据指令清单编写重建实现,并指出依据的证据记录──
- Để mỗi loại rủi ro xây dựng các mạng nhập: bảo vệ giá trị không; số lượng âm tính; phân giải cắt giảm không; 32 điểm tràn và phân giải bẫy.
- Trong cùng một chương trình chạy hàm gốc và hàm tái tạo, ghi lại mỗi đơn vị nhập, bao gồm cả các cạm bẫy.
- Sử dụng nguyên bản biên dịch các thành phần tái biên dịch tái xây dựng thực hiện,屏蔽重定位字段后比较函数节──
- 读取并比较重定位指向的常量, ngăn chặn sai chữ số được nhầm lẫn.
- Sử dụng một máy chủ MCP của một studio nhỏ, và ghi nhận bằng chứng cho từng bước.
- Sinh ra sử dụng nguyên tắc chứng minh thất bại bảo thủ, các dấu hiệu của nó được tạo thành bởi các tuyên bố và kết nối chứng minh.

## 问题

Bạn đến với thực sự yêu cầu `ledger-x86_64-O1.o`Trung `percent_change`Trong Ghidra 12.1.4  trả lại mã giả,智能体 theo đây đã viết ra các mã C sau:

```c
int percent_change(int before, int after) {
    if (before == 0) return 0;
    return (int)(((long)after - before) * 100 / before);
}
```

4 bài kiểm tra:`(100, 150)`- Tôi có 50 người.`(200, 100)`- Tôi nhận được -50,`(0, 5)`được 0,`(50, 100)`得到100.`grade`Được xây dựng lại dựa trên bốn bộ 90 ̊80 ̊70 ̊60 ̊`if`语句, còn 6 bài kiểm tra khác cũng đã được thông qua.

Nhưng báo cáo này không trả lời bất kỳ câu hỏi nào sau đây:

- Khi đó`(after - before) * 100`Không thể sử dụng 32 位表示时, hàm nguyên thủy trả lại gì?
- 分数 là 110 时, hàm nguyên thủy trở lại là gì?
- 重建实现能否编译成与原始函数相同的16字节?
- Trong hai phông chữ sau biên dịch, vị trí tái định vị của chúng có hướng đến cùng một lượng thường không?
- Cần phải có một mã thông minh hay mã giả?
- 宿主机没有C 编译器时,证明应是什么状态?

Mỗi mục tiêu của bài học này là một quy trình tự viết và biên dịch của chúng tôi.

```figure
re-36-prove-equal
```

## Bằng chứng cho thấy

`code/main.py`Trung tâm vòng tròn thông qua phòng thu để 6.5.0  phát hành 6 lần điều chỉnh, lưu trữ hoạt động nằm`code/fixtures/runs/agent-run.json` máy chủ đối với `initialize`                                                                                                                                                                                                                                                              `2025-11-25`Trong số đó, ba lần được sử dụng trở lại bằng chứng:

| 步骤 | 工具 | 耗时 | 证据标识符 |
|---|---|---|---|
| 2 | `analyze_function percent_change` | 6.31 秒 | `ev_e88b10dc0c6400e51bb6f7fdc3eaea8d2c97cc02463f0db3e6afeefc273197cd` |
| 3 | `analyze_function grade` | 0.02 秒 | `ev_67b6d3f992eaf49a2e16de084b6ebfdd9884e8c5c7f75e175b7bb20f4f748ce1` |
| 4 | `read_bytes 0x1000b4, 20` | 0.00 秒 | `ev_c26146cfedf4c1ee146d8ff00cfa9a5d3f5335bdd9c97ccf4e1af5f6ea3ed6bc` |

Lần đầu tiên điều chỉnh chịu trách nhiệm của Ghidra 导入和自动分析的开销.`confidence: "observed"``authority: "shipped-artifact"`, và các mục tiêu tài liệu SHA-256:`9a4a8082ba5e285a732552981a6935e0c5255725664f380e37c44ebfb04d803f`❖ Ghidra 加载可重定位目标文件时,将 `.text` đặt `0x100000`, vì vậy `percent_change`位于 `0x100000`- Tôi không biết.`grade`位于 `0x100010`

`long`Từ`percent_change`Cái đoạn giả này:

```c
undefined1  [16] percent_change(int param_1,int param_2,ulong param_3)
{
  long lVar1;
  undefined1 auVar3 [16];
  if (param_1 != 0) {
    lVar1 = (long)((param_2 - param_1) * 100);
    auVar3._0_8_ = lVar1 / (long)param_1 & 0xffffffff;
    auVar3._8_8_ = lVar1 % (long)param_1 & 0xffffffff;
    return auVar3;
  }
  ...
}
```

反编译器 xem `cltd`和 `idivl`Đồng thời viết vào`edx`Với`eax`,便将其建模为使用64位除法16字节返回值── trong cùng một ghi chép chỉ thị đơn giản hơn:

```
0x100000: TEST EDI, EDI
0x100002: JZ 0x0010000d
0x100004: SUB ESI, EDI
0x100006: IMUL EAX, ESI, 0x64
0x100009: CDQ
0x10000a: IDIV EDI
0x10000c: RET
0x10000d: XOR EAX, EAX
0x10000f: RET
```

Mỗi hoạt động đều là 32 bit rộng.`IMUL EAX, ESI, 0x64`执行 32 位乘法, chỉ giữ lại một nửa phần thấp hơn.`CDQ`sẽ`eax`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `edx`- Tôi không biết.`IDIV EDI`则使用32位除数删除64位寄存器对──按命令清单重建,应使用 `int`类型 `100 * (after - before) / before`

`grade`记录也是如此.`*(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4)`, và đưa ra một từ `0x66666667`构成、难读的默认表达式──命令清单使用 `IMUL RAX, RAX, 0x66666667``SAR RCX, 0x22``SHR RAX, 0x3f``ADD ECX, EAX`实现除以 10 ∞`ADD ECX, -0x6``CMP ECX, 0x4`和 `JA`保留十位商 6 至 10──比较前的 `XOR EAX, EAX`给出默认值 0`LEA RCX, [0x1000b4]`和 `MOV EAX, dword ptr [RCX + RAX*0x4]`读取包含五个 4 字节条目的表――

步骤 4 读出这20字节:`01000000 02000000 03000000 04000000 04000000`◊表的内容为 `1, 2, 3, 4, 4`, đối应十位商 6、7、8、9、10── đó là`ledger.c`Trung `switch`, trong số đó `case 10`和 `case 9`共用值 4。

Thực tế 2 chứng minh trong trang chứng minh bản thân đều từ chỉ thị đơn giản và thực hiện đối với số lượng thường xuyên`read_bytes`开始――DX-Ball                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      `FUN_00406400(void)`, chỉ thị hình ảnh sửa nó. Trước tiên đọc, trích dẫn ghi nhận, sau đó viết lại C.

## 编写候选实现

`code/fixtures/candidates/`Ký tự chứa tám bản tái tạo, mỗi tập tin có một hàm. Bốn trong số đó theo đơn chỉ dẫn, hoặc có thể biên dịch thành cùng một mã; bốn khác có vẻ hợp lý nhưng có sai lầm, hoặc sai lầm của nó có thể được một bản kiểm tra viết tay phát hiện.

| 文件 | 源码 | 作用 |
|---|---|---|
| `percent_change_mul_first.c` | `100 * (after - before) / before` | 指令清单的 C 表达 |
| `percent_change_split.c` | `(after * 100 - before * 100) / before` | 文本不同，clang 折叠后字节相同 |
| `percent_change_wide.c` | `(int)(((long)after - before) * 100 / before)` | 沿用伪代码的 `long`，先除法再截回 |
| `percent_change_div_first.c` | `(after - before) / before * 100` | 先做除法，因此舍入不同 |
| `grade_switch.c` | 带五个分支的 `switch (score / 10)` | 原始源码 |
| `grade_table.c` | `unsigned slot = score / 10 - 6; slot < 5 ? points[slot] : 0` | 指令清单的 C 表达 |
| `grade_thresholds.c` | `if (score >= 90) return 4; ...` | 最高分段没有上界 |
| `grade_case10_wrong.c` | `case 10: return 3;` | 一个表条目错误 |

Mỗi tài liệu đều có lệnh.`clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c`编译――编译后的目标文件与源码一起提交,以便没有的宿主机也能运行测试――

## 首条验证路径: thực hiện并比较

McKeeman trong định nghĩa của thử nghiệm phân biệt năm 1998 yêu cầu sẽ  các thí nghiệm được tạo ra bởi máy tính nhập vào hai hoặc nhiều hệ thống so sánh, và sẽ kết quả khác nhau  treo hoặc sụp đổ như là ứng cử viên thiếu sót. Ông chỉ ra điểm khó khăn: vấn đề khó khăn nhất trong thử nghiệm, là kết quả đánh giá. Ở đây, hàm gốc được dùng như một tiêu chuẩn tham khảo.

### 设计输入网格

`code/main.py`Trung `input_grid()`构建 92 个单元── đối với `percent_change`, nó mất mười `before`值和七个 `after`值所有配对:

```
before: 0, 1, -1, 3, -3, 7, 100, -100, 2147483647, -2147483648
after:  0, 5, -5, 105, 536870911, 2147483647, -2147483648
```

 Đối với `grade`, nó lấy 22 phần tử: mỗi phần tử bên cạnh 2 bên của ranh giới, số âm 0, 110, và hai`int`极值──`classify()`Đối với mỗi đơn vị thêm thẻ:溢出 32 个,负数 17 个,边界 14 个,普通 12 个,零值保护 7 个;负数截断 5 个,舍进 2 个,超出交换 范围 2 个,陷 1 个.

Mỗi lớp có mục đích rõ ràng.`TEST EDI, EDI`分支──负数单元检查向零截断的除法:C 和 `idiv`向零舍入, vì vậy `-9 / 10`Nên 0,`-10 / 10`为 -1──舍入单元检查乘法先于除法, vì vậy `(105 - 100) * 100 / 100`Vì 5 chứ không phải 0 溢出单元使 `(after - before) * 100`超出 32 位──唯一陷单元让回绕后的乘积等于 `INT_MIN`, đồng thời`before`- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

Yang、Chen、Eide 和 Regehr đã xây dựng Csmith, được sử dụng để tạo ra các quy trình hành vi không được xác định. Các phân biệt chỉ là tiếng ồn, không nên tạo ra các báo cáo thiếu sót. C có các biểu tượng tràn vào hành vi không được xác định.

### 驱动程序与陷

`code/driver.c`Từ stdin Mỗi行读取一个单元,输出输入、原始结果和重建结果──`build_harness()`用 `-Dpercent_change=cand_percent_change -Dgrade=cand_grade`编译候选实现, để hai phiên bản có thể liên kết với cùng một chương trình với tên khác nhau. trên máy chủ x86-64 Linux, thực hiện ban đầu là chính tệp mục tiêu của nó; trên máy chủ khác, là bản gốc của 编译.`ledger.c`, báo cáo `original_kind: fixture-source`

驱动程序使用 `sigsetjmp`和 `siglongjmp`                                          `SIGFPE`处理器──当`before = -1``after = 536870911`时,差为 536870912,32 位乘积回绕到 -2147483648──在 x86-64 上,`idiv`Sử dụng được phân số phân số bằng -1 会触发除法错误异常, vì商无法使用32位表示(Intel SDM 第2卷,IDIV) ⋅ xử lý sẽ chuyển đổi thành giá trị ghi chép `trap`

AArch64 上的 `sdiv`Không chạm vào bẫy, cùng số hoạt động sẽ trở lại -2147483648── Chúng tôi đã ghi lại kết quả này trên arm64 Mac.

### Kết quả

`prove_behaviour(PLAUSIBLE)`构建使用 `long`Các đơn vị khác nhau được sử dụng để tạo ra các mô hình khác nhau.

| 函数 | 输入 | 类别 | 原始结果 | 重建结果 |
|---|---|---|---|---|
| `percent_change` | 3, 2147483647 | 溢出 | -133 | -1431655899 |
| `percent_change` | 100, 2147483647 | 溢出 | -101 | 2147483547 |
| `percent_change` | 2147483647, 5 | 溢出 | 0 | -99 |
| `grade` | 110 | 超出 switch 范围 | 0 | 4 |
| `grade` | 2147483647 | 超出 switch 范围 | 0 | 4 |

`percent_change`26 lần thất bại tất cả đều xảy ra`|before| > 1`n n n n n n`before`Vì 1 hoặc -1 thì, 64 điểm giao dịch cắt ngược lại đúng như vòng tròn, vì vậy các đơn vị này chỉ là trùng hợp ngẫu nhiên.`grade`失败, là vì chuyển đổi ban đầu 没有十位商为 11 及以上分支,而 `110 / 10`Vì 11...

`prove_behaviour(EQUAL)` xây dựng `percent_change_mul_first.c`和 `grade_switch.c`, tất cả 92 đơn vị đồng nhất.`percent_change_div_first.c`Trong bốn trường hợp đơn giản, thất bại trong hai, đó là một trong những sai lầm mà bài kiểm tra viết tay thực sự có thể phát hiện.

`oracle_disagreements()`Xem thêm một chuyện khác.`percent_change_model()`和 `grade_model()`là chỉ thị đơn giản của Python 模型, sử dụng `wrap32()`表达 32 位乘法, sử dụng `idiv32()`Quản lý quy tắc cấu trúc. Báo cáo so sánh mô hình trên mỗi đơn vị với kết quả ban đầu thực tế được quan sát.

## 第二条验证路径: tái biên dịch并比较

网格上的行为是一条验证路径――第二条路径考察: sử dụng cùng một biên dịch viên và các tham số biên dịch tái tạo, có tạo ra cùng một字节, DX-Ball 项目报告其辅助函数63字节匹配,TH04 项目报告 2,139字节匹配, cả hai đều sử dụng các biên dịch viên của riêng mình.`compare_functions`Đối với các văn bản cung cấp từng bước so sánh,并附带限制:

### 读取目标文件

`code/main.py`Trung `ElfObject`用 `struct.unpack_from`读取一个ELF64 可重定位目标文件――它检查魔数、64位类别、小端数据、`e_machine`62 và`e_type`1, rồi qua các đoạn văn,`.symtab`及 mỗi người `.rela`Trong một cái gì đó,`percent_change`Từ `.text`偏移 0 开始,大小16`grade`Từ `0x10`开始,大小 46;`total`Từ `0x40`开始,大小31`grade_label`Từ `0x60`开始,大小 63。

`percent_change`của 16 字节为`85 ff 74 09 29 fe 6b c6 64 99 f7 ff c3 31 c0 c3`, không có vị trí quay lại.`grade`Có một条: hàm trong chuyển động`0x26`, loại `R_X86_64_PC32`,符号 `.rodata`, thêm số`0x10` Nó thuộc về chuyển động `0x23`处的 7 字节 `leaq`, 4 đoạn cuối cùng là chuyển đoạn.

### Trước khi được xem xét,

Trong các tài liệu RELA 目标, số lượng được lưu trữ trong hồ sơ định vị lại, bốn字段字节均为零──候选 `grade_switch.o`Trong đó cũng có 0. Vì vậy, ngay cả khi hai định vị quay về vị trí khác nhau, so sánh chữ trực tiếp vẫn sẽ được thông qua.`mask_relocations()`仍将两侧字段清零, như vậy một phương pháp tương tự cũng có thể áp dụng cho việc tăng số lưu trữ trong字段 REL 目标文件和 Mach-O。

随后 `prove_bytes()`按偏移、类型和目标节比较重定位记录──原始记录为 `.rodata+0x10`,候选为`.rodata-0x4`◊ tăng số khác nhau là vì các mục tiêu của các ứng cử viên thay đổi biểu hiện trước mặt không có `labels.rel`表──不同加数 nghĩa là khác biệt chuyển động, không nhất thiết nghĩa là hàm khác nhau──

### 读取重定位指向的常量

Đối với PC nằm ở cuối lệnh tương đối với phần, CPU trên là địa chỉ lệnh, vì vậy mục tiêu là mã tăng thêm thêm 4...`.rodata+0x14`,候选中是`.rodata+0x0``read_table()`Từ đó đọc được 5 4 字节条目, cả hai đều là `1, 2, 3, 4, 4`

số 5 từ chỉ thị:`CMP ECX, 0x4`配合 `JA`允许索引 0 đến 4, và `[RCX + RAX*0x4]`Đối với mỗi chỉ dẫn đọc 4 字节.`code/main.py`Trung `CLAIMS`- Đăng ký rồi.`grade`Chuyện này cũng được ghi nhận.`percent_change`Không có vị trí quay lại.

Đây là một bước xuất phát từ một lỗ hổng đã được ghi lại trong dự án TH08 .`0.0`Có thể trông giống như mục tiêu.`128.0`完全一致. 修复时审计 1.548 浮点字面量引用, sửa đổi 12 处.`grade_case10_wrong.c`Có thể có một lỗi trong cấu trúc của bài học này: có 46 字节 mã code phù hợp với nguyên bản, cấu trúc ghi lại định vị lại cũng giống nhau, nhưng biểu tượng là`1, 2, 3, 4, 3`Chỉ có kiểm tra thường xuyên mới làm nó thất bại.

### Kết quả

| 候选 | 大小 | 屏蔽后的字节 | 重定位记录 | 表 | 状态 |
|---|---|---|---|---|---|
| `percent_change_mul_first` | 16 对 16 | 相同 | 无 | 无 | pass |
| `percent_change_split` | 16 对 16 | 相同 | 无 | 无 | pass |
| `percent_change_wide` | 16 对 26 | 大小不同 | 无 | 无 | fail |
| `percent_change_div_first` | 16 对 18 | 大小不同 | 无 | 无 | fail |
| `grade_switch` | 46 对 46 | 相同 | 结构相同 | 两者均为 `1,2,3,4,4` | pass |
| `grade_table` | 46 对 46 | 相同 | 结构相同 | 两者均为 `1,2,3,4,4` | pass |
| `grade_thresholds` | 46 对 39 | 大小不同 | 1 对 0 | 无 | fail |
| `grade_case10_wrong` | 46 对 46 | 相同 | 结构相同 | `1,2,3,4,4` 对 `1,2,3,4,3` | fail |

Có hai kết quả đáng xem lại một lần nữa.`percent_change_split.c`字节 hoàn toàn giống nhau, vì clang sẽ có các biểu tượng tràn ra nhìn vào hành vi không xác định,`after * 100 - before * 100`折叠为一次乘法──`grade_table.c`Cũng từng chữ cái phù hợp,说明 biên dịch viên từ số liệu chỉ số và `switch`得到相同表──字节匹配证明: bộ biên dịch viên này sử dụng các tham số này, sẽ ứng cử viên thực hiện biên dịch thành cùng một mã; nó không chứng minh ứng cử viên là nguyên thủy nguồn văn bản──

                                                                                                                                                                                                                                                              `wide`重建有 26 字节,是因为 `movslq``imulq``cqto`和 `idivq`取代32位形式──在任何编译发生之前,命令清单已经告诉我们宽度──

## Thông qua vòng tròn thông minh

Có 65 công cụ MCP không đáp ứng lệnh của CLI,`verify_reconstruction`Đó là một trong số đó.`code/main.py`Trung `McpStdioClient`Có thể điều chỉnh các khách hàng nhỏ nhất của họ.`npx -y rea-agents@6.5.0 mcp`, để stdin Mỗi dòng viết vào một JSON-RPC yêu cầu, và trong các đường dẫn từ stdout Mỗi dòng đọc một đối tượng JSON.`2025-11-25`发送 `initialize`, tái发 `notifications/initialized`, cuối cùng发 `tools/call`❖ Thời gian cắt giảm mặc định mỗi lần gọi là 330 giây, tương tự như thời gian khởi động lạnh thực sự cho phép.

`agent_loop()`发发发六次调用并记录 mỗi lần:

```json
{
  "step": 2,
  "tool": "analyze_function",
  "arguments": {"procedure": "percent_change"},
  "seconds": 6.31,
  "is_error": false,
  "evidence_id": "ev_e88b10dc0c6400e51bb6f7fdc3eaea8d2c97cc02463f0db3e6afeefc273197cd",
  "confidence": "observed",
  "authority": "shipped-artifact",
  "limitations": ["Resolved reference metadata identifies computed, indirect, external, call, jump, and data edges; unresolved targetless flows remain unknown, and function classifications distinguish thunks and externals.", "..."],
  "result_sha256": "..."
}
```

完整证据 记录按标识符保存在同一文件中;; tái xây dựng thực hiện dựa trên các mã hóa giả và chỉ thị清单也是具的一部分;;`table_address()`Trong `grade`清单中找到 `LEA`操作数,并将其传给 `read_bytes``open_binary``get_evidence_bundle`和 `close_binary`Không trả lại bằng chứng 记录, vì vậy các mã trong hồ sơ của nó là không có hiệu lực.

Khi đi trên đường`npx`, và`GHIDRA_INSTALL_DIR`Chỉ hướng một danh mục,`run_agent(live=True)`会驱动 rea;否则重放具, và trong stderr 中说明──测试进一步:`code/tests/fake_rea_server.py`là dịch vụ thay thế, đối với mỗi lần `tools/call`Trả lại kết quả đã được ghi nhận của cùng một công cụ và các tham số đối phó. Mỗi lần thử nghiệm sẽ cho phép khách hàng và vòng lặp tương tác với nó, không cần phải cài đặt rea、Ghidra hoặc Java.

### Máy kiểm tra thực sự có thể nói gì, không thể nói gì.

thực sự của `verify_reconstruction`接收指向比较 Bằng chứng của tuyên bố,并为每项回归通过、失败或未知──其固定限制为:Pass nghĩa là mỗi tuyên bố của tuyên bố đều thông qua; nó không thể xác định toàn diện thực hiện giá等──函数断言比较`compare_functions`返回的提供方文本; hành vi tuyên bố so sánh `compare_process_captures` 2 phần đã ghi lại quá trình thu thập                                                                                                                                                                                                                                                          `unknown`◊ area 内部没有任何部分会编译重建函数,或在您的输入网格上运行它──本课的两条验证路径,就是真正留给您的工作──

REAL OFSTITUTIONS `predicate_type: "rea.reconstruction-proof"``operation: "verify_reconstruction_obligations"``confidence: "observed"`, và`normalized_result.passed === true`Không có công khai thực sự 工具会生成此类记录.`code/main.py`Trung `build_proof()`Sẽ tạo ra nó:

```json
{
  "predicate_type": "rea.reconstruction-proof",
  "operation": "verify_reconstruction_obligations",
  "confidence": "observed",
  "authority": "controlled-replay",
  "normalized_result": {
    "passed": true,
    "status": "pass",
    "claims": [
      {"claim_id": "percent_change.behaviour", "kind": "behavioral", "status": "pass", "evidence_ids": ["ev_e88b10dc..."]},
      {"claim_id": "grade.behaviour", "kind": "behavioral", "status": "pass", "evidence_ids": ["ev_67b6d3f9..."]},
      {"claim_id": "percent_change.bytes", "kind": "structural-function", "status": "pass", "evidence_ids": ["ev_e88b10dc..."]},
      {"claim_id": "grade.bytes", "kind": "structural-function", "status": "pass", "evidence_ids": ["ev_67b6d3f9..."]},
      {"claim_id": "grade.referenced-constants", "kind": "structural-function", "status": "pass", "evidence_ids": ["ev_67b6d3f9..."]}
    ]
  },
  "evidence_links": ["ev_e88b10dc...", "ev_67b6d3f9..."],
  "evidence_id": "ev_..."
}
```

标识符为 `ev_`加记录 bỏ SHA-256 của biểu tượng sau, sử dụng khóa排序、紧形式 JSON。`aggregate()`采用保守失败原则:`fail`优先,其次是`unknown`,空断言 列表也是`unknown`◊ chủ nhà máy không có máy biên dịch, hai hành vi nói là `unknown`, vì vậy ngay cả khi hai câu nói qua, toàn bộ ghi chép vẫn là `unknown``authority`Vì vậy`controlled-replay`Vì chứng minh từ các chương trình thử nghiệm của chúng ta, không chỉ là mục tiêu.

## Kết quả nghiên cứu cho thấy

Liu Raff và Micinski trong năm 2026 đo lường chín loại cấu hình của tám hệ thống chống biên dịch. Qua các ứng cử viên thử nghiệm toàn bộ, trong việc nhập thử nghiệm mờ vẫn sẽ bị lệch khỏi kết quả ban đầu, tỷ lệ tổng thể là 4,9%, một hệ thống lên đến 13%. Trong 300 hàm thư viện GitHub và 287 hàm liên quan đến CVE, mô hình cải tiến mạnh nhất sẽ nâng tỷ lệ thành công xây dựng của Ghidra từ 75% lên 90%, nhưng tỷ lệ phù hợp hành vi của cùng bộ hàm giảm từ 74% xuống 62%.

本课的 `percent_change_wide.c`Nó thuộc loại tạo: giả mã cho ra`long`, tái tạo để giữ nó, kết quả có thể biên dịch, qua mười thử nghiệm, nhưng thất bại trên 26 đơn vị tràn ốp.

DecompileBench đo được 23.400 hàm từ 130 chương trình thực tế, phát hiện ra chức năng chính xác của LLM là 52,2% thấp hơn so với công nghiệp lớp chống biên dịch, nhưng điểm hiểu cao hơn.

Ba phương pháp chứng minh được sử dụng trong lĩnh vực này là bạn có thể xây dựng ba đường xác minh. Phenix và DREAM 重新编译输出并运行原始程序的测试. McKeeman và Csmith sẽ tạo ra các đầu vào so với chương trình nguyên thủy, đồng thời sẽ hạn chế các đầu vào trong phạm vi hành vi được xác định. Ramos và Engler sử dụng các biểu tượng giới hạn để thực hiện kiểm tra hai hàm C, chứng minh giá trị tương tự trên các đường khám phá trong các đầu vào lớn.

## tự xây dựng

运行 chỉ sử dụng tiêu chuẩn库的测试框架:

```bash
cd phases/13-tools-and-protocols/36-rebuild-and-prove-equal
python3 code/main.py
```

PATH 上有 clang 时,演示会编译两对候选实现,并为每对运行92单元;随后重新编译八个候选、重放智能体运行,并生成证明记录──没有 clang 时,读取已提交的目标文件,并将行为断言报告为`unknown`

Trong arm64 Mac 上预期输出结构如下:

```json
{
  "host": "aarch64 Darwin",
  "originalKind": "fixture-source",
  "gridCells": 92,
  "plausible": {"naivePassed": true, "gridMismatches": 28, "oracleDisagreements": 0},
  "equal": {"naivePassed": true, "gridMismatches": 0, "oracleDisagreements": 0},
  "legTwo": {
    "percent_change_mul_first": {"status": "pass", "reasons": []},
    "percent_change_wide": {"status": "fail", "reasons": ["size 16 vs 26 bytes"]},
    "grade_case10_wrong": {"status": "fail", "reasons": ["referenced constants differ: [1, 2, 3, 4, 4] vs [1, 2, 3, 4, 3]"]}
  },
  "agentRun": {"mode": "replayed fixture", "server": {"name": "rea", "version": "6.5.0", "protocolVersion": "2025-11-25"}},
  "proof": {"status": "pass", "evidence_id": "ev_..."}
}
```

按以下顺序阅读 `code/main.py`- Có thể là:

1. `wrap32()``c_div()``idiv32()`和两个 `*_model()`函数实现命令清单的整数语义──
2. `input_grid()`和 `classify()`构建并标记 92 个单元──
3. `build_harness()`和 `execute()`Để thực hiện chính thức, đổi tên ứng cử viên và thực hiện`driver.c`编译成一个程序,然后运行各单元――
4. `prove_behaviour()`返回第一条验证路径报告, bao gồm các quy trình không phù hợp và phân biệt mô hình.
5. `ElfObject`读取文件头、符号和 `.rela`记录;`mask_relocations()`和 `read_table()`Để so sánh với việc chuẩn bị.
6. `prove_bytes()`Trở lại 2nd article Báo cáo về các phương pháp kiểm tra, bao gồm:
7. `McpStdioClient`和 `agent_loop()`驱动 rea 并 ghi lại từng bước
8. `build_proof()`和 `aggregate()`生成采用保守失败原则的记录.

## Sử dụng nó

Để chứng minh một hàm mới, hãy lặp lại các bước sau:

1. 获取该函数的 `analyze_function`Kết quả并记录证据标识符──先读指令清单,再读伪代码──
2. 按清单中操作的位宽编写候选实现──保留原始函数名──
3. 列出列表中的每次乘乘加减除操作,添加能使每个操作在其位置宽处回绕的网格输入.
4. Đối với mỗi số lượng thường xuyên so sánh trong danh sách thêm vào hai bên.`grade`, chúng là 6 và 4 của giảm法.
5. Thêm vào số lượng các mục tiêu có thể gây ra các bẫy, và ghi lại cấu trúc của mạng lưới.
6. 运行两条验证路径,先看原因,再看状态──
7. Sẽ chứng minh hồ sơ bảo tồn ứng cử viên thực hiện bên cạnh.`evidence_links`Nói cho người đọc câu nói dựa trên những ghi chép nào.

Mỗi lần biên dịch viên update đều tái chạy hai đường.

## 交互实验

### 实验 A:模型与运行

Trong `code`目录中启动 Python:

```bash
cd phases/13-tools-and-protocols/36-rebuild-and-prove-equal/code
python3 -q
```

运行:

```python
from main import *
percent_change_model(3, INT_MAX)
percent_change_model(-1, 536870911, "x86_64")
percent_change_model(-1, 536870911, "aarch64")
report = prove_behaviour(PLAUSIBLE)
report.naive_passed, len(report.mismatches), report.mismatches[0]
```

Lần đầu tiên được -133, tức là quay lại nhân nhân bằng 3; lần thứ hai được`'trap'`, lần thứ ba nhận được -2147483648―― báo cáo cho thấy 10 đơn giản sử dụng ví dụ thông qua, 28 个网格单元失败――将 `report.oracle_disagreements`Comparison với danh sách空

### 实验 B:读取目标文件

```python
obj = ElfObject(ORIGINAL_OBJECT)
grade = obj.function("grade")
grade.size, grade.data[0x26:0x2a].hex(), grade.relocations
read_table(obj, grade.relocations[0], 5, 4)
```

字段字节为 `00000000` 重定位引用`.rodata`, thêm số cho `0x10`,表内容为 `[1, 2, 3, 4, 4]`

### 实验 C: phá vỡ một lượng thường

```python
report = prove_bytes("grade", CANDIDATES / "grade_case10_wrong.o")
report.masked_equal, report.relocations_match, report.tables_equal, report.reasons()
```

字节匹配、记录匹配, nhưng表不匹配──现在编辑 `grade_case10_wrong.c`,让 `case 10`重新返回 4, sử dụng lệnh 具重新编译,观察状态变为 `pass`

### 实验 D: động cơ

Lắp đặt rea 6.5.0 và Ghidra 12.1.4 后:

```bash
GHIDRA_INSTALL_DIR=/opt/homebrew/Cellar/ghidra/12.1.4/libexec \
JAVA_HOME=/opt/homebrew/opt/openjdk@21 \
python3 code/main.py --live
```

Lần đầu tiên`analyze_function`Sẽ mất vài giây, vì Ghidra đang nhập mục tiêu tài liệu. sẽ tạo một mã thông báo mới so với các hoạt động đã gửi.

## 实践实验

Việc mở rộng hai phương pháp chứng minh thành một tập tin mục tiêu`total`和 `grade_label`

要求:

- Đối với`total`, nhập vào các số và số lượng.
- Đối với`grade_label`, hàm trong liên调用 `grade`,并读取 `labels.rel`Nó là một bảng có 5 cấu trúc chuyển động từ các chuỗi, trong `.rela.rodata`Trong đó có vị trí trọng tâm riêng của họ.
- Vì vậy`grade_label`添加一条   thêm một bài`CLAIMS`, bao gồm hai thứ định vị và năm thứ 4 字节条目的表,并比较条向的字符串──
- Nếu mô hình và hoạt động trên một số đơn vị không phù hợp, ghi lại các đơn vị này và giải thích theo chỉ dẫn đơn vị từng đơn vị.
- Trong hồ sơ chứng minh, mỗi đường xác minh của mỗi hàm được thêm một câu nói, và làm cho các giao dịch luôn áp dụng nguyên tắc bảo tồn thất bại.

Kiểm chuẩn thành công: chứng minh ghi chép liệt kê bốn hàm, mỗi câu nói đều mang theo chứng minh ký hiệu, và để một ký hiệu string khác nhau khi `grade_label`会失败.

## 输出技能

本课产 出 `outputs/skill-rebuild-and-prove-equal.md` Sử dụng nó sẽ chuyển đổi chứng minh hàm và ứng cử viên tái tạo thành chứng minh và chứng minh ghi chép hai đường.

## 验证

运行演示和测试套件:

```bash
cd phases/13-tools-and-protocols/36-rebuild-and-prove-equal
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

35 项测试证明:

- `c_div()`Đối với phân đoạn,`wrap32()`遵循二进制补码规则
- 模型对 `(3, INT_MAX)` nhận được -133, đối với các đơn vị trong x86-64 `trap`, trong AArch64 lên nhận được -2147483648
- 网格 có 92 đơn vị và bao gồm mỗi loại rủi ro, trong khi các ví dụ đơn giản tránh tất cả các loại khó khăn
- ELF 读取器 trong ghi chép chuyển biến và kích thước tìm thấy bốn hàm
- `percent_change`16 字节 và không có trọng tâm,`grade`Trong `0x26`处有一条 `R_X86_64_PC32`
- 重定位字段字节为零,屏蔽在这个 RELA 目标文件中不会改变任何内容
- Tất cả 8 ứng cử viên đã nộp đều đạt được tình trạng dự kiến, và đưa ra nguyên nhân trong hồ sơ.
- `grade_case10_wrong`Thông qua kiểm tra ngăn chặn, chỉ thất bại trong kiểm tra lượng thường xuyên
- 已记录的第一条路径运行显示十个简单使用例通过、28个不匹配项、零模型分歧
- Khi có bộ biên dịch, hai phần thực hiện tái cấu trúc và hoạt động vẫn có kết quả tương tự
- 智能体运行按SHA-256 定位已提交目标文件,顺序正确,每个证据 步骤都带有 `ev_`标识符
- `read_bytes`记录与ELF 读取器 tìm thấy表相同的
- 客户端驱动模拟服务器, ghi chép và chứng nhận nhận dạng thực sự
- 服务器错误结果会进入运行记录
- `aggregate()`采用保守失败原则, chứng minh các biểu tượng có thể được tính lại nội dung

## Mô hình thất bại trong môi trường sản xuất

| 失败 | 不严谨的报告会说什么 | 测试框架必须证明什么 |
|---|---|---|
| 重建保留反编译器的 `long` | “十个测试通过” | 26 个溢出单元与原始结果不同 |
| 用阈值替代 switch | “每个分数段都通过” | 原始实现在 110 及更高输入上返回 0 |
| 先除后乘 | “公式在代数上等价” | 舍入单元不同，简单用例失败 |
| 跳过陷阱单元 | “没有崩溃” | x86-64 触发 `#DE`，AArch64 返回 `INT_MIN`，报告说明宿主架构 |
| 不屏蔽就比较字节 | “字节相同” | 重定位记录指向不同偏移 |
| 只屏蔽，不读常量 | “屏蔽后字节相同” | `1,2,3,4,3` 与 `1,2,3,4,4` 不同 |
| 把大小当接受标准 | “长度相同” | 相同长度内仍有不同字节 |
| 编译器或参数不同 | “字节不同，重建错误” | 相同源码会生成不同字节，因此该比较无效 |
| 将模型当作观察 | “模型一致” | 运行是观察，模型是推导，并列出分歧 |
| 断言没有证据标识符 | “已验证” | 每项断言链接到所覆盖函数的 `ev_` 记录 |
| CI 宿主机没有编译器 | “通过” | 行为断言为 `unknown`，汇总也为 `unknown` |
| 将伪代码视为源码 | “反编译器说是 long” | 清单显示 `IMUL EAX`、`CDQ`、`IDIV EDI` |

## 操作准则

根据指令清单编写重建实现,并指导出源记录――在能让每个中间值回绕、跨越每个比较常量的输入网格上,与原始实现对照运行――使用原始参数重新编译,屏蔽重定位字段,比较记录,再读取它们指向的常量――为每一个断言记录证标识符,让未经验证断言继续保持未知――

## 延伸阅读

- [McKeeman, Differential Testing for Software, Digital Technical Journal 10(1), 1998](https://www.cs.tufts.edu/comp/150FP/archive/bill-mckeeman/DifferentailTesting.pdf)
- [Yang, Chen, Eide, Regehr, Finding and Understanding Bugs in C Compilers, PLDI 2011](https://doi.org/10.1145/1993498.1993532)
- [Ramos, Engler, Practical, Low-Effort Equivalence Verification of Real Code, CAV 2011](https://doi.org/10.1007/978-3-642-22110-1_55)
- [Schwartz, Lee, Woo, Brumley, Native x86 Decompilation Using Semantics-Preserving Structural Analysis, USENIX Security 2013](https://www.usenix.org/conference/usenixsecurity13/technical-sessions/presentation/schwartz)
- [Liu, Raff, Micinski, When LLM Decompilers Recompile More and Preserve Less, arXiv 2609.05370, 2026](https://arxiv.org/abs/2609.05370)
- [Gao et al., DecompileBench, Findings of ACL 2025](https://aclanthology.org/2025.findings-acl.1194/)
- [Tan et al., LLM4Decompile, arXiv 2403.05286, 2024](https://arxiv.org/abs/2403.05286)
- [System V gABI, Chapter 4, Relocation](https://www.sco.com/developers/gabi/latest/ch4.reloc.html)
- [x86-64 psABI repository, relocation types](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Intel 64 and IA-32 Architectures Software Developer's Manual, Volume 2, IDIV](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [Arm Architecture Reference Manual for A-profile, DDI 0487, SDIV](https://developer.arm.com/documentation/ddi0487/latest)
- [rea 6.5.0 MCP contracts](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/mcp-contracts.md)
- [rea 6.5.0 reconstruction obligation ledgers](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/reconstruction-obligation-ledgers.md)
