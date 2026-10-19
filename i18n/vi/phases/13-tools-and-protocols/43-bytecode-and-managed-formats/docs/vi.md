# 超越原生代码:Python、JVM、.NET 与 WebAssembly 字节码

> 字节码文件既包含程序,也包含编译器对程序的记录; 本课将构建读取器,揭露每个容器保留了哪些记录――

**Type:** Build
**Languages:** Python, Java, C#, WebAssembly text
**Prerequisites:** 第 13 阶段 · 32（从零实现 ELF）、33（反汇编与控制流）
**Time:** ~150 分钟

## Học mục tiêu

- Theo PEP 552 读取 `.pyc`của 16 字节头部, và không sử dụng `marshal`Trong trường hợp 模块,反序列化四个解释器版本写出的代码对象──
- Theo JVMS Chương 4 phân tích các tập tin JVM, bao gồm các tập tin thường量池、字段、方法、`Code`属性以及`javac -g`添加的表――
- 反汇编 `Ledger.class`Trung tâm JVM mã hoạt động, và đối với bốn cấu trúc của cùng nguồn mã từng một`javap -c`của một số người.
- 逐节读取 WebAssembly 模块,解码 mỗi hàm,并与 `wasm-objdump -d`核对结果──
- 穿越 .NET 程序集的 ECMA-335 元数据, từ PE 数据目录到 `MethodDef`行及每个方法的CIL,并使用ILSpy 所使用的读取库核对──
- So sánh biểu hiện của cùng một hàm trong 5 loại thùng, đo từng kiểu hình thức được giữ lại và mất tên, kiểu và cấu trúc kiểm soát nào.

## 问题

Anh đã xây dựng nó.`ledger.py`, và `__pycache__`中发现 `ledger.cpython-314.pyc` Bạn hỏi thông minh trong tập tin này chứa những gì.`Unsupported opcode`, lại in một dòng .`# WARNING: Decompyle incomplete`智能体因此断言文件经过混──

文件并没有混──它的前两字节是 `2b 0e`,即小端字 3627── đây là giá trị số của CPython 3.14 写入, trong khi bảng điều hành của máy biên dịch chỉ hỗ trợ đến 3.13──过时 là tool──智能体没有读取头部,因此无法分辨两者──

Chương 33 trình trình bày nội dung bị mất mã gốc: số, loại, và biến thành biểu đồ nhảy`switch`△字节码容器丢失少得少,而且各不相同──pyc giữ giữ từng biến thể tên, nhưng không giữ kiểu, nhưng không giữ kiểu, chỉ có bạn xác định yêu cầu khi bạn giữ tên biến thể địa phương.

Bài học này sử dụng Python  chuẩn thư viện xây dựng bốn loại máy đọc. Mỗi loại máy đọc bắt đầu từ phần đầu đọc dung lượng, liệt kê một hàm, và kiểm tra các mẫu thử nghiệm bạn xây dựng với các công cụ của riêng bạn trong định dạng này.`ledger`của `grade`Không có gì khác.

```figure
re-43-five-containers
```

## pyc 头部由四个字组成

PEP 552 将头部定义为四个32位字符――第一个是魔数,第二个是位字段――第 0位为 1 表示文件基于哈希――第 1位为 1 表示`check_source`: giải thích viên trong nhập vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào vào năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm năm

魔数定义在 `Include/internal/pycore_magic_number.h`Từ 3.11 ∞, quy tắc là Python 3.n từ 2900 + 50n ∞, bắt đầu trong chu kỳ phát hành mỗi lần mã thay đổi thành phố ∞.`\r\n`, do đó, trong mô hình văn bản mở pyc sẽ nhận được số lượng sai lầm. Giá trị cuối cùng là: 3.11 của 3495 ̊3.12 của 3531 ̊3.13 của 3571 ̊3.14 của 3627, và 3.15 của 3666 ̊ Python 3.15.0 được phát hành vào năm 2026-10-09, nhưng các máy cấu trúc của các mẫu này không cài đặt nó, vì vậy giá trị này đến từ các tài liệu đầu, chứ không phải là các tài liệu thực tế ở đây.

样本为每个解释器保留两份 pyc¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬`compile_pyc.py`Sử dụng `py_compile.compile(..., dfile="ledger.py")`写入文件,使存储文件名为 `ledger.py`, thay vì xây dựng trên máy tính là như sau:

```text
checked-hash   2b 0e 0d 0a  03 00 00 00  c7 16 c7 fc c5 1d 81 01
timestamp      2b 0e 0d 0a  00 00 00 00  8d 60 cf 6a  f1 01 00 00
```

逐字读取时间头部──`03 00 00 00`Hoặc`00 00 00 00`Đó là một chữ ký.`8d 60 cf 6a`Đối với 0x6acf608d = 1791975565, tức cấu trúc文件时 `ledger.py`- Đúng rồi.`f1 01 00 00`Vì 497, có nghĩa là mã nguồn lớn. Các tài liệu hash của các trường học được thử nghiệm có giá trị 3 chữ cái và 8 chữ cái hash.

| 解释器 | 魔数字节 | 字值 | 文件字节数 | `grade.co_code` 字节数 | `grade` 指令数 |
|---|---|---|---|---|---|
| 3.11.14 | `a7 0d 0d 0a` | 3495 | 1054 | 80 | 31 |
| 3.12.12 | `cb 0d 0d 0a` | 3531 | 937 | 62 | 26 |
| 3.13.12 | `f3 0d 0d 0a` | 3571 | 943 | 70 | 26 |
| 3.14.6 | `2b 0e 0d 0a` | 3627 | 965 | 96 | 35 |

`code/main.py`Trung `read_pyc_header()`Trở lại những đoạn văn này, và theo phiên bản nhận dạng số.`importlib.util.MAGIC_NUMBER`给出当前运行解释器对应的相同四字节──`python3 code/main.py compare`Sử dụng trong `PATH`Trong tìm thấy của mỗi `python3.11`至 `python3.15`编译源码,并将读者看到的头部与各解释器报告的自信息并排输出──

## Marshal 逐字段写入代码对象

Mỗi mẫu có 16 chữ cái.`e3`,即 `0x80 | ord('c')`: Đó là thiết lập `FLAG_REF`类型码, nói với người đọc ghi nhớ đối tượng này, để tiếp tục `r`引用── Marshall 文档明确表示,该格式刻意不提供文档,且代码对象不跨版本兼容──`Python/marshal.c`列出类型码:`N`Không có biểu hiện,`i`biểu hiện 32 位整数,`s`biểu diễn`z`和 `Z`表示短 ASCII 字符串,`(`和 `)`表示元组,`c`biểu hiện code đối tượng,`r`biểu hiện ngược chiều引用──容器先预留自己的引用槽位,再处理子对象,读取器也遵循这一顺序──

`w_complex_object()`按固定顺序写入代码对象──对于3.11至3.15,先以32位整数写入 `argcount``posonlyargcount``kwonlyargcount``stacksize``flags`; tái以对象写入 `code``consts``names``localsplusnames``localspluskinds``filename``name``qualname`; sau đó là `firstlineno`, cuối cùng là`linetable`和 `exceptiontable` Từ第 17 字节 bắt đầu手动解码 3.14 文件的模块代码对象:

```text
00 00 00 00   argcount 0
00 00 00 00   posonlyargcount 0
00 00 00 00   kwonlyargcount 0
01 00 00 00   stacksize 1
00 00 00 00   flags 0
f3 22 00 00 00   type 's' with FLAG_REF, 34 bytes of co_code follow
80 00  52 06  74 00  52 01  17 00  74 01 ...
```

代码中每条命令占两字节:`80 00` `RESUME 0`- Tôi không biết.`52 06` `LOAD_CONST 6`- Tôi không biết.`74 00` `STORE_NAME 0`- Tôi không biết.`17 00` `MAKE_FUNCTION` trong mẫu 3.14 清单输出相同的五条模块级语句──`code`后是包含四个嵌套代码对象的常量,再后是 后是`names`- Có thể là:`('LABELS', 'percent_change', 'grade', 'total', 'grade_label')`

`code/main.py`Trung `Unmarshaller`Có thể đọc được cấu trúc này, cũng như 3.9 và 3.10 sử dụng cấu trúc cũ; sau này sẽ `nlocals``varnames``freevars`和 `cellvars`设为独立字段──它构造一个 `CodeObject`, sử dụng tên thuộc tính giống với đối tượng thực sự.`varnames`Theo`localspluskinds`của `CO_FAST_LOCAL`位选 `localsplusnames`❖ Đối với mỗi 4 tài liệu `grade`, nó đã trở lại `('score', 'bucket')`、 giá trị là 10 `firstlineno`和非空的 `linetable`测试 `test_unmarshaller_agrees_with_the_running_interpreter`针对当前解释器写出的文件,将每个字段与 `marshal.loads()`Bước: 3 tài liệu còn lại có thể được đọc bằng mã của chúng tôi, nhưng không thể được giải thích bởi các nhà giải thích hiện tại.`marshal`读取:

## 4 giải thích, 4 lớp 字节码

Các bản sao trong mỗi phiên bản đều có một cảnh báo:字节码 là chi tiết thực hiện của CPython, không đảm bảo giữ nguyên.`python3.1N -m dis ledger.py`输出都已保存。

3.11 Trung `grade`开头如下:

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

`BINARY_OP`位于偏移 6,下一条指令位于 10──中间两字节是 PEP 659 专门化自适应解释器引入的内联缓存项──偏移 16 的 `COMPARE_OP`后是偏移22的命令, vì vậy nó chiếm hai bộ nhớ trừ khi truyền vào `show_caches=True`Nếu không, lưu trữ sẽ được ẩn.`LOAD_CONST`加 `RETURN_VALUE`替换为 `RETURN_CONST`, sẽ được đổi tên thành `POP_JUMP_IF_FALSE`,使 `grade`Từ 80 字节 giảm xuống còn 62 字节──3.13 输出标签 `L1`至 `L4`Thay vì chuyển,并为命令行提供显示缓存的`-C`和显示 chuyển động `-O`△3.14  又移除 `RETURN_CONST`,加入 `LOAD_SMALL_INT`和 `LOAD_FAST_BORROW`, và sau mỗi điều kiện nhảy vào `NOT_TAKEN`- Có thể là:

```text
 12         20       LOAD_FAST_BORROW         1 (bucket)
            22       LOAD_SMALL_INT           9
            24       COMPARE_OP             188 (bool(>=))
            26       CACHE                    0 (counter: 0)
            28       POP_JUMP_IF_FALSE        3 (to L1)
            30       CACHE                    0 (counter: 0)
            32       NOT_TAKEN
```

`-C -O`清单显示 `grade`Có 13 cái trong số đó.`CACHE`项:`BINARY_OP`5 người, mỗi người`COMPARE_OP`后一个, mỗi `POP_JUMP_IF_FALSE`后一个──自适应样本展示了这些缓存的用途──调用 200次后,`dis.dis(grade, adaptive=True)`Trong đơn giản`RESUME`和 `COMPARE_OP`位置输出 `RESUME_CHECK`和 `COMPARE_OP_INT`, và `total`Trong khi xuất hiện`FOR_ITER_LIST``BINARY_OP_ADD_INT`和 `JUMP_BACKWARD_NO_JIT` hình thức đặc biệt tồn tại trong cùng một nhóm`co_code`字节中──c 永远不包含它们,因为专门发生在内存中──

Đó là lý do vì sao các phiên bản chống biên dịch có giới hạn trên. Uncompyle6 3.9.3  tuyên bố chấp nhận Python 1.0 đến 3.8 của các mã từ.`python_3_13.cpp`, gặp không biết mã hoạt động khi sẽ xuất .`Unsupported opcode`并标记结果不完整──PyLingual 声称支持 3.6 起所有已发布版本,并使用 3.8 至 3.15 的解释器重新编译、检查自己的输出──对于 3.14 文件,前三者会拒绝或失败,只有后两者适用──选择工具前先读取魔数字──

## 类文件保存了自己的字典

JVMS Java SE 25 Mục 4.1 节将布局定义为一个结构:`magic``minor_version``major_version``constant_pool_count`、thường là 、`access_flags``this_class``super_class`、接口、字段、方法、属性──魔数是`0xCAFEBABE`Java SE 25 虚拟机接受 45 至 69 的主版本号,次版本号 65535 则表示预览特性文件。`Ledger-g.class`                                                                                                                                                                                                                                                              `ca fe ba be 00 00 00 41 00 5e`: Main version 65 đối với Java 21,`0x5e`= 94 là số lượng bình thường.`Ledger-jdk25.class`以 `ca fe ba be 00 00 00 45`开头,主版为 69。

常量池是类文件存储自己的字典的地方.`-g`构建中的条目 `#13`Là một `Methodref`, hướng tới`#8`和名称与类条目 `#14`                                                                                                                                                                                                                                                              `Ledger.grade:(I)I`, với `javap -v`Trong `//`Nội dung sau xuất hiện hoàn toàn phù hợp.`(I)I`表示一个 `int`参数 và một `int`返回值──`total`của `([I)I`表示参数为 `int`Số组―― mã liên quan đến mỗi phương pháp、字段和类 có mục như thế, Điều 4.10 quy định của chứng thực sẽ từ chối các lệnh không phù hợp với mục đích.`code/main.py`Trung `ClassFile`类读取表 4.4 全部 17 种常量标签,并将一个 `Long`Hoặc`Double`计为两个槽位――遇到未知标签或最后属性后的余字节,它会抛出异常――

属性可附加在类,每个字段,每个方法以及`Code`属性本身.JVMS 要求虚拟机忽略不认识的属性, do đó thêm hoặc di chuyển bảng điều tra không cần phải thay đổi phương pháp.`-g`生成 bao gồm tất cả thông tin điều chỉnh trong biến động địa phương, thông tin nguồn và thông tin từ,`-g:none`则什么都不生成──三种构建测得的结果如下:

| 构建 | 字节数 | 常量池计数 | `LineNumberTable` | `LocalVariableTable` | `SourceFile` | `grade` 代码字节数 |
|---|---|---|---|---|---|---|
| `javac -g` | 1832 | 94 | 7 个方法 | 6 个方法 | 有 | 50 |
| `javac` | 1581 | 82 | 7 个方法 | 无 | 有 | 50 |
| `javac -g:none` | 1404 | 79 | 无 | 无 | 无 | 50 |

3 tài liệu trong`grade`50 个代码字节 hoàn toàn phù hợp, test cũng sẽ kiểm tra điều này.`-g`Vì vậy`grade`增加的是一行 `LocalVariableTable`:起点 0、长度 50、槽位 0、名称 `score`、 mô tả `I`Không có nó, máy biên dịch chỉ có thể nhìn thấy kiểu như`int`Trong số 0 các vị trí, phải tự tạo tên gọi.`StackMapTable`, vì máy kiểm tra cần nó;`BootstrapMethods`属性也保留, vì `main` Thông qua `invokedynamic`拼接字符串──

## 手动解码 bàn chuyển đổi

JVMS Chương 6 sẽ định nghĩa mỗi lệnh là một mã điều hành chữ cái và số hoạt động được xác định bởi mã điều hành đó.`tableswitch`和 `lookupswitch`开头包含零至三填字节, làm cho số hoạt động 32位 bắt đầu địa chỉ là 4倍数──

`Ledger-g.class`Trung `grade`Từ pc 4 开始的字节如下:

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

三十六字节,一条命令,就表示整个`switch (score / 10)`, bao gồm 9 và 10 chia sẻ sử dụng.`switch`Các nhà xây dựng cần kiểm tra biên giới.`lea`、一条 `movslq`、一条 `add`、 một lần nhảy thẳng, cũng như 5 vị trí quay lại trong phần khác.

`disassemble_jvm()`覆盖全部 202 已定义操作码及其操作数宽度, tuân theo quy tắc填充,并以`javap`Cách trình bày số hoạt động:`compare_with_javap()`解析保存的 `javap -c -p`文本, bao gồm多行 `tableswitch`块,并检查每条指令的偏移、助记符和操作数──四种构建的108条指令全部一致──测试`test_branch_offsets_are_relative_to_the_branch_instruction`检查 pc 1 的 `ifne` nhảy đến 6 ̊13 `if_icmpge` nhảy đến 33, và 30 `goto`跳回 10 ⋅

Vì những bài học này từ nguồn mã hóa radar2 6.2.4 cũng đọc cùng một tài liệu.`rabin2 -I` báo cáo `arch java``lang java 21``linenum true`和 `lsyms true`, thể hiện sự nhận dạng của nó đối với phiên bản và hai bảng điều chỉnh.`pd 14 @ sym.Ledger.grade`输出 `tableswitch`, không dùng mũi tên hướng tới 5 mục tiêu. Nó cũng hướng tới việc xuất tập tin.`Unable to parse code attribute: 2`, đó là giới hạn mà mình chỉ ra, cũng tiếp tục như vậy.`javap`Đối với các cơ sở thích, đối với Python, các định dạng này của các máy tính chống biên dịch hơn trưởng thành. CFR 0.152 sử dụng MIT  giấy phép. Procion 0.6.0 và Vineflower 1.12.0 sử dụng Apache-2.0; Vineflower là hỗ trợ của Java 21 của Fernflower phân chia. Fernflower tự đặt tại IntelliJ cộng đồng kho. JADX 1.5.6 hỗ trợ Android DEX định dạng, trong khi JD-GUI cuối cùng được phát hành vào năm 2019.

## Wasm 模块 là một bộ phim

核心规范将模块定义为前导字节 `00 61 73 6d 01 00 00 00`,即字符串 `\0asm`Và phiên bản 1, sau đó là một loạt các phần. Mỗi phần được tạo ra bởi một phần mã hóa, một phần được mã hóa bằng LEB128.`u32`Ưu điểm 1 đến 13 là các phần được biết đến, mỗi loại xuất hiện nhiều nhất một lần và theo thứ tự xếp hạng Ưu điểm 0 là các phần tự định nghĩa của tên gọi, có thể nằm ở bất kỳ vị trí nào Ưu điểm toàn bộ đều sử dụng LEB128, do đó Ưu điểm 0 là các phần tự định nghĩa của tên gọi.`e4 00`100 người.`80 08`Vì 1024  đối với`ledger.wasm`运行 `wasm-objdump -h`会列出七节,`WasmModule`找到的七节节及其载荷偏移完全相同:

| 节 | 载荷范围 | 数量 | 为 ledger 保存的内容 |
|---|---|---|---|
| 类型 | 10 至 26 | 3 | `(i32) -> nil`、`(i32, i32) -> i32`、`(i32) -> i32` |
| 导入 | 28 至 39 | 1 | 类型为 0 的 `env.log` |
| 函数 | 41 至 46 | 4 | 每个已定义函数的类型索引 |
| 内存 | 48 至 51 | 1 | 一页，无最大值 |
| 导出 | 53 至 110 | 5 | `memory` 和四个函数名 |
| 代码 | 113 至 271 | 4 | 大小为 23、63、44 和 23 字节的函数体 |
| 数据 | 273 至 290 | 1 | 位于偏移 1024 的 `F\0D\0C\0B\0A\0` |

Phần hàm và phần mã tách biệt, để cho trình duyệt có thể bắt đầu biên dịch trước khi toàn bộ tập tin đến. Mỗi mục mã bao gồm kích thước, biến số địa phương tuyên bố và biểu hiện.`grade`                                                                                                                                                                                                                                                              `01 7f`Một nhóm một`i32`Đó là điều đó.`bucket`, có kiểu và không có tên gọi:.

Control flow từ cấu trúc lên là cấu trúc hóa.`block``loop`Hoặc`if`结构──标签按嵌套深度索引──`br_table`通过索引标签列表的操作数执行间接分支――解码文件偏移 `0xa3`处 `grade`của chuyển đổi:

```text
0e                  br_table
0b                  11 labels follow
04 04 04 04 04 04   buckets 0 to 5: label 4, the outermost block, returns 0
03 02 01 00         buckets 6, 7, 8, 9: labels 3, 2, 1, 0
00                  bucket 10: label 0, shared with 9
04                  default label 4
```

Mỗi nhãn là một độ sâu.                                                                                                                                                                                                                                                            `block`,其 `end`后后的代码是 `i32.const 4`, rồi dùng`br 4`跳出结果块──表前的六条 `block`Chỉ thị, 10 nhãn và 5 bài sau biểu diễn`br`Chỉ thị cấu thành toàn bộ`switch`, kiểm chứng sẽ từ chối bất kỳ phân đoạn nào tách rời khỏi cấu trúc này.`disassemble_wasm()`Theo chiều sâu, làm cho nó rõ ràng`wasm-objdump`Một cách rút gọn; nó bao gồm từ `unreachable`Đến`i64.extend32_s`Mỗi mã lệnh của một chữ cái, và được xây dựng trong hai loại và lưu giữ.`wasm-objdump -d`输出实现 77 条 命令全部一致。

Một mô hình thường bị bỏ rơi là tên gọi.`wasm-objdump`仍然会输出 `<grade>`, vì các phần dẫn sẽ hiển thị các chuỗi này vào chỉ mục hàm 2, cũng như máy đọc.`wat2wasm --debug-names`添加名为 `name`Các phần tự định nghĩa, trong đó có tên khối, tên hàm và tên biến số của phần.`{0: 'score', 1: 'bucket'}`,为函数 3 找到 `{0: 'values', 1: 'count', 2: 'sum', 3: 'i'}``wasm-strip`Có thể di chuyển lại phần này.`.debug_*`tự định nghĩa phần嵌入;`sourceMappingURL`Bản thể định nghĩa节可指向源码映射,其列号表示二进制中的字节偏移──

工具生态 trong năm 2026 đã xảy ra sự thay đổi.`wasm-decompile`, Homebrew trên máy tính này  cấu trúc 恰好包含剩下的十个工具──wasm-tools 1.261.0 提供 `print``objdump`和 `demangle`◊ Binaryen version_133 提供 `wasm-dis`△ radar2 6.2.4 cũng có thể đọc 模块,其 `rabin2 -I` báo cáo `arch wasm` Nó sẽ `grade`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `0x8e`, và `wasm-objdump`将 hàm ký 字段大小开始 `0x8b`                                                                                                                                                                                                                                                              `get_local``set_local`和会输出标签 số lượng `brtable 11 4 4 ...`◊三个工具读取的字节相同,拼写却不同,因此比较时必须说明清单由哪个工具生成的. 本课调研未在Ghidra's处理器目录中发现WebAssembly 处理器模块,但没有完整阅读该目录清单.`wasm-core-2`页面 là ngày dự thảo đề xuất ứng cử viên cho năm 2026 năm tháng 10 ngày 13 ngày, bản tóm tắt mô tả là 3.0  phiên bản; 编辑草案 cũng có ngày dự thảo cùng ngày.

## ECMA-335 là cơ sở dữ liệu của chính chương trình

.NET 程序集是PE 文件──`LedgerNet.dll`以 `MZ`开头,包含名为 `.text``.rsrc`和 `.reloc`Trong 3 phần,并将机器类型声明为`0x14c`, vì trình biên dịch được tạo bởi nền tảng không liên quan đến mã.`0x2008` ECMA-335 II.25.3.3  đã định nghĩa 72 个字节 của vị trí này:

```text
48 00 00 00   Cb 72
02 00 05 00   MajorRuntimeVersion 2, MinorRuntimeVersion 5
78 21 00 00   MetaData RVA 0x2178
84 07 00 00   MetaData size 1924
01 00 00 00   Flags: COMIMAGE_FLAGS_ILONLY
05 00 00 06   EntryPointToken 0x06000005, MethodDef row 5, which is Main
```

RVA `0x2178`处的元数据根以签名 `42 53 4a 42`开头,读作 `BSJB`, sau đó là phiên bản 1.1 và chữ `v4.0.30319`Sau đó có 5 dòng đầu:`0x6c`处的 `#~`, và`#Strings``#US``#GUID`和 `#Blob`II.24.2  quy định mỗi dòng chảy xuất hiện nhiều nhất một lần`#~`流开头 là một `HeapSizes`字节,这里为零, do đó mỗi字符串、GUID 和 blob 索引都占两字节; còn lại có một 64 位 `Valid`掩码,标识存在表;; trong đó mười bốn vị trí được đặt cho 1:

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

行大小不存储在任何位置.II.22 为每列指定类,II.24.2.6 给出大小规则.`HeapSizes`占两字节或四字节. Khi mục tiêu biểu dưới 65536 行时,简单表索引占两字节. Nếu mã chỉ số chỉ dẫn có thể chỉ ra n 个表, sử dụng b 个标签位, thì khi số lượng các biểu đồ này đều nhỏ hơn 2^(16-b) 时, nó chiếm hai字节.`CliAssembly`根据这些规则和行数计算十四表的行大小──样本中的 System.Reflection.Metadata 转储报告相同的大小和表偏移,测试据此证明计算正确──

III.1.9 定义令牌:高字节表示表,低三个字节表示从 1 开始的行号――`0x06000002` `MethodDef`第 2 行── RVA của đường`0x2060`,名称为 `Grade`, ký  danh mục`00 01 08 08`:默认调用约定、一个参数、返回 `int32`、参数为`int32`  `ParamList`指向 `Param`第 3 行,其名称为`score` Phương trình biểu hiện ILSpy có thể phát hành sau khi bị cởi mở`Grade(int score)`│RVA`0x2060`Cách làm cho đầu béo:

```text
13 30         flags 0x13: fat, init locals; size 3 dwords
02 00         MaxStack 2
2d 00 00 00   CodeSize 45
01 00 00 11   LocalVarSigTok 0x11000001
```

`StandAloneSig`第 1 行 lưu trữ`07 01 08`- Có thể là:`LOCAL_SIG`、 một biến động trong cơ quan,`int32` Các biến thể địa phương có kiểu và không có tên. ECMA-335 trong phần V của các định dạng chuyển đổi điều tra lưu giữ tên biến thể địa phương.`DebugType`Không có một tòa nhà nào được xây dựng, do đó không có bất kỳ biểu tượng hay tài liệu mang tên `bucket``PercentChange`则使用微型头部:首字节 `3a`Vì vậy`0x0e << 2 | 2`, biểu thị một 14 字节的方法体,没有局部变量,默认深为8──

`Grade`45 个代码字节使用第 III 部分的操作码表解码──`switch``0x45`, tiếp theo`u32`计数, cũng như số lượng相应 `int32`目标, chúng đối với表后的下一条指令计算:

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

编译器在 `switch`Trước đây đã giảm 6, vì vậy phân đoạn 6 là mục tiêu đầu tiên.`disassemble_cil()`通过表解析并呈现令牌:`ldsfld Labels``call Grade``call System.Console::WriteLine`, và từ`#US`堆 của `ldstr ' '`                                                                                                                                                                                                                                                              `MetaDump`, dựa trên mẫu trong ILSpy  trong thư viện sử dụng `System.Reflection.Metadata`编写简短C#程序―― nó xuất ra số dãy của mỗi biểu đồ, kích thước và chuyển hướng, RVA của mỗi phương pháp, ký hiệu, số liệu và IL 字节, cũng như`System.Reflection.Emit.OpCodes`của 226 个字段──`compare_with_metadump()`Tất cả 246 điều kiểm tra phù hợp.`prefix`占位項──本课表有219项,因为 nó chứa III.2.2 trong `no.`, và Emit biểu hiện chưa bao gồm nó.

Các công cụ trong kiểu này bao gồm: ILSpy 11.0(MIT  giấy phép,2026-08-12 发布) thông qua Avalonia 桌面构建在macOS 上运行。`ilspycmd`11.1.0.9782 使用 `-il`输出 IL, sử dụng `-m 0x06000002`按令牌选择方法──dnSpyEx 6.6.0 继续维护 dnSpy, nhưng chỉ hỗ trợ Windows──IL 反汇编器 `ildasm`以 NuGet 包提供, không theo SDK 内置──radar2 6.2.4 也读取元数据:`rabin2 -I` báo cáo `arch cil`和 `class PE32`- Tôi không biết.`is`列出 `Ledger.Grade(int:score):int`, trong đó các số liệu tên và hai loại được lấy từ Param 表及签名表. Trong cấu trúc này không có CIL 反汇编器.

## Mỗi thùng giữ lại gì

Tóm lại 5 loại `grade`Đặt trong cùng một tấm bảng.`python3 code/main.py keeps`, nó sẽ đối với mẫu vận hành máy đọc:

| 容器 | 函数体字节数 | 函数名 | 参数名 | 参数与返回类型 | 局部变量名 | 行号 | 控制流 |
|---|---|---|---|---|---|---|---|
| ELF 目标文件，clang -O0 | 118 | `.symtab` 中的 `grade` | 无 | 无 | 无 | 无，没有 `.debug_*` 节 | 5 次跳转及 1 次经过重定位表的间接跳转 |
| CPython 3.14 pyc | 96 | `co_qualname` | `score` | 无 | `bucket` | `co_linetable`，首行为 10 | 4 对比较及 `POP_JUMP_IF_FALSE` |
| JVM 类，`javac -g` | 50 | 常量池 | `LocalVariableTable` 中的 `score` | `(I)I` | 参数以外无其他名称 | `LineNumberTable`，6 行 | 1 条 `tableswitch` |
| WebAssembly | 63 | 导出节 | 仅在有名称节时存在 | `(i32) -> i32` | 仅在有名称节时存在 | 无 | 6 个嵌套块、1 条 `br_table`、4 条 `br` |
| .NET 程序集 | 45 | `MethodDef` | `Param` 中的 `score` | `static int32(int32)` | 无，只有 `StandAloneSig` 中的类型 | 没有 PDB 则无 | 1 条 `switch`、1 条 `br.s` |

Chương trình này giải thích kết quả phản biên dịch mà bạn sẽ thấy.`int total(const int *, int)`Với Ghidra từ nguồn gốc `int total(long param_1, uint param_2)`So sánh, vì mã gốc không giữ lại thông tin trong các hàng này. Vì vậy, lưu giữ tất cả các tên và không giữ lại các loại, dòng kiểm soát của nó là nhảy theo các thay đổi hình thức theo phiên bản, do đó Python chống biên dịch viên sẽ không hiệu quả vì thay đổi phiên bản, nhưng có thể trực tiếp khôi phục các tên.`-g`时保留名称,并用一条命令表达 `switch`❖ Bức tranh 模块在构造上保留结构, do đó `wasm2wat`Có thể thực hiện không mất đi, chỉ mất là mô tả đầy đủ nhất của tên gọi. .NET 程序集保留, vì bảng dữ liệu có quy định, nhưng tên biến đổi địa phương vẫn cần PDB.

Bảng này mô tả những gì có thể được sử dụng bởi máy biên dịch, cũng như những sản xuất sao chép các thực tế đã lưu trữ, những gì là giả thuyết.

## 动手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/43-bytecode-and-managed-formats
python3 code/main.py
```

输出 là một báo cáo JSON ⋅ cho mỗi máy tính, nó cung cấp hai loại 文件和 `grade`Số lượng lệnh và mã hoạt động trong danh sách lưu trữ, cũng như việc các nhà giải thích hiện tại có thể đọc nó không.`javap`Đối với mỗi loại Wasm  cấu trúc, nó cung cấp các phần, loại, chức năng, tên, nội dung và kết quả.`wasm-objdump`Sự phù hợp của các tập hợp trình, nó cung cấp CLI đầu, dòng chảy, biểu hiện số, phương pháp và với System.Reflection.`PATH`Trong tìm thấy của giải thích

按以下顺序阅读 `code/main.py`- Có thể là:

1. `Reader`保存游标和整数宽度──`uleb()`和 `sleb()`là Wasm 及 .NET blob 堆所需的 LEB128 读取器──
2. `read_pyc_header()``Unmarshaller`和 `PycFile`读取 pyc。`parse_dis_text()`读取保存的 `dis`清单, vì vậy跨版本比较不必在测试时安装四个解释器──
3. `ClassFile`读取类文件,`disassemble_jvm()`解码其中的代码──`parse_javap_code()`和 `compare_with_javap()`负责基准核对――
4. `WasmModule`读取各节,`disassemble_wasm()`解码表达式并跟踪深度──`compare_with_wasm_objdump()`负责基准核对――
5. `CliAssembly`遍历 PE、CLI 头部、元数据根、流和表──`TABLE_SCHEMAS`Với`CODED_INDEXES`sẽ II.22 và II.24.2.6 được biểu diễn cho dữ liệu:`disassemble_cil()`解码方法体,`compare_with_metadump()`核对结果──
6. `NativeObject`读取足以列出函数符号的ELF内容,并采用第33课单作为文本──`what_each_keeps()`和 `figure_data()`构建比较结果──

Có 5 lệnh khác.`python3 code/main.py pyc FILE``class FILE``wasm FILE`和 `dll FILE`输出 cho cấu trúc của các tệp và các danh sách của mỗi hàm.`python3 code/main.py compare`Sử dụng `PATH`Trung của mỗi giải thích viên `ledger.py`,并输出 nội dung của riêng mình.

##  thực tế sử dụng

Đối với các thùng tự xây dựng của bạn, theo thứ tự sau đây sử dụng các máy đọc.

1. 读取开头字节并识别格式──两个字节后接 `0d 0a`biểu hiện pyc,`ca fe ba be`biểu diễn các tài liệu,`00 61 73 6d`biểu hiện mô hình,`4d 5a`且数据目录 14 已设置则表示程序集──
2. 读取头部并记录它指示的生成工具版本──pyc 根据魔数字,类文件根据主版本号,程序集根据运行时和元数据版本字符串──
3. 运行任何计划使用的反编译器前,先检查是否支持该版本──记录其版本上限以及工具文档中的出处──
4. Đối với các máy đọc cùng một tài liệu và các công cụ của riêng mình trong định dạng này, so sánh từng bước. Không phù hợp có nghĩa là máy đọc có lỗi hoặc công cụ thay đổi; bất kể tình huống nào, phải xác định trước nguyên nhân, để trở thành chứng cứ.
5. Để bạn quan tâm, các hàm điền vào bảng lưu trữ thông tin.
6. 完成以上步骤后再阅读反编译输出──将每个名称和类型标记为已保留的事实复制,或标记为推断──

将基准文本文件与容器保存在一起.`build_fixtures.sh`重新构建并保存输出, vì sự thay đổi đơn giản nghĩa là thay đổi mô hình.

## 交互实验

### 实验 A:先读头部,再读代码对象

Từ `code`Giờ mở Python:

```bash
cd phases/13-tools-and-protocols/43-bytecode-and-managed-formats/code
python3 -q
```

运行:

```python
from main import *
pyc = load_pyc("ledger.cpython-311.pyc")
pyc.header.to_dict()
pyc.module.names
pyc.functions()["grade"].varnames
len(pyc.functions()["grade"].code)
```

Lần đầu tiên dùng trước tiên viết xuống số đen... rồi tải lên`ledger.cpython-314.pyc`, so sánh hai phần `code`∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞`import marshal; marshal.loads(pyc.data[16:])`, đọc thông tin sai lầm.

### 实验 B: 常量池引用链

```python
cls = load_class("Ledger-g.class")
cls.constant(13)
cls.constant(14)
cls.describe_constant(13)
[row["text"] for row in jvm_listing(cls, "grade")]
```

调用 `describe_constant`Trước, trước, trước`#13` Theo dõi đến `#8`和 `#14`, tái theo dõi đến`Utf8`条目──随后加载 `Ledger-gnone.class`, đối với hai đối tượng分调`cls.method("grade").attribute_names()``Code`Số组 giống nhau, thuộc tính khác nhau.

### 实验 C: độ sâu

```python
module = load_wasm("ledger.wasm")
[(row["depth"], row["text"]) for row in wasm_listing(module, "grade")]
module.function_name(2)
load_wasm("ledger-names.wasm").names["locals"][2]
```

找到 `br_table`行并读取深度──统计其后的 `end`行,将每行与表中的标签编号对应起来――然后打开 `ledger.wat`, tìm thấy nhãn 3 đối ứng `block $six`

### 实验 D: từ令牌 đến字节

```python
asm = load_assembly("LedgerNet.dll")
asm.method("Grade")
body = asm.method_body(asm.method("Grade")["RVA"])
body.fat, body.max_stack, body.code_size, hex(body.local_signature_token)
asm.token_text(0x11000001)
[row["text"] for row in cil_listing(asm, "GradeLabel")]
```

Theo`.text`节头部,手动计算 RVA `0x2060`Đối với các tài liệu chuyển hướng,并与`asm.rva_to_offset(0x2060)`Hãy xem lại.`asm.row(0x08, 3)`, tìm ra tên `score`存放的位置──

## 实践实验

Để so sánh với gia nhập thứ 5 ngôn ngữ nguồn, hoặc để tăng số 6 thực tế.

要求:

- Sử dụng ngôn ngữ của bộ biên dịch viên đã cài đặt, biên tập hàm chứa các biến vòng và địa phương, ví dụ như sẽ Kotlin  biên dịch thành class file, hoặc sẽ Rust  biên dịch thành Wasm 模块──提交输出和基准清单, và`build_fixtures.sh`Trung ghi lại lệnh chính xác.
- 让对应读器的每条指令都与基准一致. Chỉ cần thêm mã hoạt động khi cần thiết.
- 扩展 `what_each_keeps()`,加入新容器,并为所有容器增加一个事实: hàm体是否携带异常表或`try`Khu vực:
- 将新容器加入 `figure_data()`,并 tái sinh`site/figures-re-43.js`
- 编写测试: Khi người đọc tuyên bố một sự kiện nào đó được giữ lại, nhưng không xác định tính chất hoặc thời gian lưu trữ của nó,测试应失败.

验收标准 là:`python3 code/main.py keeps`显示新行, mỗi đơn vị có bằng chứng, và tất cả các điểm so sánh vẫn phù hợp.

## 本课产物

本课包含 `outputs/skill-bytecode-and-managed-formats.md` Sử dụng nó có thể chuyển đổi bộ chứa mã字节 thành báo cáo đầu tiên ✓ thông qua kiểm tra danh sách các hàm đơn, cũng như đánh dấu từng tên, loại và cấu trúc như là lưu giữ hoặc bị mất thực tế bảng. Nó yêu cầu sử dụng các công cụ riêng của mình trong định dạng này như là cơ sở, trong việc chạy bất kỳ phiên bản kiểm tra trước của máy biên dịch, và giải thích mỗi sự mất thực sự nguyên bản nên được lưu trữ ở đâu ✓

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/43-bytecode-and-managed-formats
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明:

- Bốn phần mã số của đầu của mã số phân biệt là 3495、3531、3571 和 3627, ký hiệu là 3, và chứa 8 字节哈希; thời gian文件的标志为 0、mtime为 1791975565、大小为 497
- 3.11 và các phiên bản sau đó mỗi số được đặt tại`2900 + 50n`Quy tắc cho phiên bản của nó trong phạm vi xác định
- Đối với các tài liệu được trình giải thích hiện tại, các trình giải thích phản trình hóa trả về các tên, thường lượng, mã chữ, biến số tên và dòng số biểu đồ với `marshal.loads()`tương tự
- Bốn tài liệu đều giữ lại tên của nó.`grade`của `('score', 'bucket')`、首行号 10, cũng như danh sách tài liệu `ledger.py`
- 4 phiên bản `grade.co_code`Phần chia cho 80、62、70 và 96 字节, lưu trữ danh sách phân biệt có 31、26、26 và 35 条 chỉ thị
- 3.11 清单含有 `POP_JUMP_FORWARD_IF_FALSE`,3.12 và 3.13  chứa `RETURN_CONST`,3.14  bao gồm `LOAD_SMALL_INT``LOAD_FAST_BORROW`和 `NOT_TAKEN`
- 3.14 của `-C -O`清单显示 `grade`Có 13 bộ nhớ trong đó có 5 trong số đó nằm trong`BINARY_OP`后,自适应清单中出现 `COMPARE_OP_INT`
- 缺少 `0d 0a`Đầu, cắt đầu, cũng như các đối tượng không mã hóa chủ thể đều được kích hoạt`FormatError`
- Chỉ cho hiện tại giải thích viên đã viết ra các chỉ dẫn sinh sản đơn giản, và với lưu trữ `dis`输出一致
- 类文件 主版本为 65 或 69,大小分别为 1581、1832、1404 和 1581,常量池计分别为 82、94、79 和 82
- 常量 `#13`解析为 `Method Ledger.grade:(I)I`- Tôi không biết.`#47`解析为 `String F`
- JVM phản汇编器 trong bốn cấu trúc trung bình`javap -c -p`实现 108 条 命令全部一致
- pc 4 处的`tableswitch`长 36 字节, 下限为 6 上限为 10 默认目标为 48, 其余目标为 46、44、42、40、40
- 三种调试级别 thay đổi số lượng thuộc tính, nhưng `grade`của 50 个代码字节 giữ nguyên
- `ifne``if_icmpge`和 `goto`Mục tiêu đối với phân支操作码计算
- 错误魔数、尾随字节和未定义操作码都会触发 `FormatError`
- 7 phần của tải trọng chuyển động với`wasm-objdump -h`输出一致,带名称构建在 293至425 处添加 `name`自定义节
- 类型`env.log`导入,5导出和偏移 1024 处的数据段均按 `ledger.wat`Ứng dụng viết nội dung
- Wasm 反汇编器 trong hai cấu trúc trung bình`wasm-objdump -d`实现 77 条 命令全部一致
- `grade`Có 6 khối nhựa, độ sâu 6 chỗ.`br_table`含标签 `4 4 4 4 4 4 3 2 1 0 0`且默认标签为 4,以及一个`i32`局部变量
- Không có tên gọi, tên hàm xuất phát từ dẫn xuất; thay đổi tên chỉ có khi tên gọi tồn tại
- LEB128 của `e4 00`100 người`7f`- - -`80 08`Đối với 1024, kiểu biểu diễn khối`wasm-objdump`Một
- 错误前导字节、版本 2 和未知操作码都会触发 `FormatError`
- 程序集为 PE32,机器类型为`0x14c`,CLI 头部位于 RVA `0x2008`,运行时为2.5 ,标志为`ILONLY`, nhập khẩu`0x06000005`
- 元数据版本为 `v4.0.30319`, có 5 dòng, 14 bảng số lượng và kích thước của các dòng phù hợp với báo cáo cơ sở
- .NET 读取器与 System.Reflection.Metadata 的 246 项检查全部一致
- `Grade`               `score`,签名为`static int32(int32)`, đầu béo `MaxStack`为 2,代码长 45 字节,并有一个无名的`int32`局部变量
- CIL của `switch` mục tiêu và `br.s``ldsfld``call`和 `ldstr`操作数均通过表和堆解析
- CIL 操作码表覆盖运行时的每个操作码, chỉ thêm vào `no.`
- 信息保留表显示四种容器保留参数名,原生代码不保留;三种容器保留类型
- Mỗi dòng kết quả trong biểu diễn đều hiển thị n 项 so sánh trong n 项 phù hợp
- 交互图嵌入的数据与 `figure_data()`Sinh ra dữ liệu tương tự

## Mô hình thất bại trong môi trường sản xuất

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

Trước đọc đầu, nhận ra các công cụ sản xuất hướng tới. Sử dụng các nội dung chưa biết để từ chối tiếp tục đọc các công cụ đọc, và trên cùng một tài liệu sẽ kiểm tra danh sách với các công cụ của riêng mình theo định dạng này.

## 延伸阅读

- [PEP 552：确定性 pyc](https://peps.python.org/pep-0552/)
- [CPython `Include/internal/pycore_magic_number.h`](https://github.com/python/cpython/blob/main/Include/internal/pycore_magic_number.h)
- [Python `marshal` 模块文档](https://docs.python.org/3/library/marshal.html)
- [CPython `Python/marshal.c`](https://github.com/python/cpython/blob/main/Python/marshal.c)
- [Python 3.14 `dis` 模块文档](https://docs.python.org/3.14/library/dis.html)
- [PEP 659：专门化自适应解释器](https://peps.python.org/pep-0659/)
- [PEP 626：供调试及其他工具使用的精确行号](https://peps.python.org/pep-0626/)
- [PEP 790：Python 3.15 发布计划](https://peps.python.org/pep-0790/)
- [PyPI 上的 uncompyle6](https://pypi.org/project/uncompyle6/)[PyPI 上的 decompyle3](https://pypi.org/project/decompyle3/)[PyPI 上的 xdis](https://pypi.org/project/xdis/)[GitHub 上的 pycdc](https://github.com/zrax/pycdc)[GitHub 上的 PyLingual](https://github.com/syssec-utd/pylingual)
- [Java 虚拟机规范，Java SE 25，第 4 章：类文件格式](https://docs.oracle.com/javase/specs/jvms/se25/html/jvms-4.html)
- [Java 虚拟机规范，Java SE 25，第 6 章：Java 虚拟机指令集](https://docs.oracle.com/javase/specs/jvms/se25/html/jvms-6.html)
- [javac 手册，Java SE 25](https://docs.oracle.com/en/java/javase/25/docs/specs/man/javac.html)和 [javap 手册](https://docs.oracle.com/en/java/javase/25/docs/specs/man/javap.html)
- [CFR](https://www.benf.org/other/cfr/)[Procyon](https://github.com/mstrobel/procyon)[Vineflower](https://github.com/Vineflower/vineflower)[intellij-community 中的 Fernflower](https://github.com/JetBrains/intellij-community/tree/master/plugins/java-decompiler/engine)[JADX](https://github.com/skylot/jadx)
- [Harrand、Soto-Valero、Monperrus、Baudry，《Java 反编译器的多样性及其在元反编译中的应用》（JSS 2020）](https://arxiv.org/abs/2005.11315)
- [ECMA-335，公共语言基础结构，第 6 版（2012 年 6 月）](https://ecma-international.org/publications-and-standards/standards/ecma-335/)
- [PE 格式，Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format)
- [System.Reflection.Metadata.Ecma335.TableIndex](https://learn.microsoft.com/en-us/dotnet/api/system.reflection.metadata.ecma335.tableindex)
- [GitHub 上的 ILSpy](https://github.com/icsharpcode/ILSpy)[NuGet 上的 ilspycmd](https://www.nuget.org/packages/ilspycmd)[GitHub 上的 dnSpyEx](https://github.com/dnSpyEx/dnSpy)
- [WebAssembly 核心规范：二进制格式，模块](https://webassembly.github.io/spec/core/binary/modules.html)和 [值](https://webassembly.github.io/spec/core/binary/values.html)
- [WebAssembly 核心规范：自定义节（名称节）](https://webassembly.github.io/spec/core/appendix/custom.html)
- [WebAssembly tool-conventions：调试](https://github.com/WebAssembly/tool-conventions/blob/main/Debugging.md)
- [wabt 1.0.42 发布说明](https://github.com/WebAssembly/wabt/releases/tag/1.0.42)[wasm-tools](https://github.com/bytecodealliance/wasm-tools)[Binaryen](https://github.com/WebAssembly/binaryen)[ghidra-wasm-plugin](https://github.com/nneonneo/ghidra-wasm-plugin)
- [GitHub 上的 radare2](https://github.com/radareorg/radare2), bài học này sử dụng từ nguồn xây dựng 6.2.4  phiên bản
