# Quản lý và kiểm soát: từ chữ cái đến hình ảnh có thể xác minh

> 反汇编单 là những câu nào là lệnh; 本课将构建解码器和图,检查这一 câu.

**Type:** Build
**Languages:** Python, C, x86-64 assembly
**Prerequisites:** Phase 13 · 32（从零构建 ELF）
**Time:** ~150 分钟

## Học mục tiêu

- Theo quy tắc của Intel SDM 第 2卷 第二章, giải mã sổ cái 测试样例中的 x86-64 指令子集──
- Đối với mỗi mẫu sản phẩm xây dựng, mỗi chỉ thị,`llvm-objdump -d`Để kiểm tra chứng minh giải mã.
- Đối với các chữ cái tương tự, các chữ cái được sơn và quay lại và xuống, và giải thích vị trí sai lầm của họ.
- Để phân chia chỉ thị thành các khối cơ bản, xây dựng với các loại hình bên cạnh của quy trình kiểm soát.
- Sử dụng Cooper, Harvey và Kennedy's 代算法 tính toán các nút kiểm soát trực tiếp, và qua lại tìm kiếm vòng lặp.
- Từ hướng trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt trượt

## 问题

Anh dùng`-O0`编译了 `ledger.c`, rồi hỏi một đại lý:`grade`Làm gì?agent 调用反汇编器、读取清单, trả lời rằng hàm này với mục tiêu không được biết `jmpq *%rax`结束―― sau đó nó viết ra một câu mã giả`return 0`

Anh dùng`llvm-objdump -d` mở cùng một tập tin mục tiêu, xem sau khi nhảy có bốn khối, phân biệt lưu trữ 4、3、2、1── chúng luôn luôn trong danh sách── danh sách không nêu rõ cách thực hiện để đạt được các khối, vì vậy các công cụ sẽ coi chúng như mã chết──

清单 chỉ trả lời một câu hỏi: những chữ cái nào tạo thành những chỉ thị nào. Nó không giải thích những chỉ thị nào sẽ được thực hiện.

rea 6.5.0  không có bộ lập trình phản汇编器 riêng của mình. Nếu muốn phân tích sâu hơn, README  yêu cầu bạn tự cung cấp Ghidra、Hopper hoặc IDA. Khi kiểm tra ngoài khớp,rea cũng có thể调用 các mục đích chưa được giải quyết của bạn.

```figure
re-33-sweep-vs-descent
```

## Mỗi đoạn trong hình thức chỉ thị có quy tắc đối phó

Intel SDM thứ 2 卷图 2-1  đưa ra chuỗi các chữ cái của mỗi lệnh. Đầu tiên là có thể chọn trước, sau đó là một trong ba mã điều hành, sau đó là có thể chọn ModRM 字节 và có thể chọn SIB 字节. tiếp theo là 0 、1 、2 hoặc 4 字节 vị trí, sau đó là 0 、1 、2 hoặc 4 字节 số ngay lập tức.

Vì vậy, giải mã là một chuỗi các quyết định nhỏ, sau mỗi quyết định đều có thể tìm thấy trong cuốn sách các lời giải thích.

### 分为四组

SDM 2.1.1 列出传统前──第 1 组包含 `F0`khóa 和重复前 `F2``F3`❖ thứ 2 组包含六种段覆盖`2E` `%cs`(văn) và分支提示──第 3 组是`66`, tức là số hoạt động lớn.`67`,即地址大小覆盖──

手册 nói mỗi nhóm có thể sử dụng một cái trước, nhưng biên dịch viên sẽ tạo ra nhiều hơn.`ledger-x86_64-O0.o`Trung偏移 `0xf2`   `66 66 66 66 66 2e 0f 1f 84 00 00 00 00 00`, liên tục xuất hiện năm `66``llvm-objdump`Để in nó cho`nopw %cs:(%rax,%rax)`, bạn xây dựng các mã hóa cũng vậy.

`66`Còn có một tác dụng thứ hai. Đối với lệnh SSE, nó là một lệnh bắt buộc của chọn mã hoạt động, vì vậy `66 0f ef c0` `pxor %xmm0, %xmm0`, thay vì gì 16 位操作.`F3 0f 6f` `movdqu` Giải mã đầu tiên tìm kiếm các bộ phận của các mã lệnh trước và thứ hai.`66`才表示 16 位操作数──

### REX tăng 4 vị trí, và phải được vận hành chặt chẽ

SDM 2.2.1 sẽ định nghĩa REX như`40`Đến`4F`之间的一个字节,格式为 `0100WRXB``W`选择 64 位操作数。`R`扩展 ModRM 的 reg 字段──`X`扩展 SIB's index 字段──`B`扩展 ModRM's r/m 字段、SIB's base 字段或操作码字节中的寄存器(表 2-4);; REX 必须紧接在操作码或转义字节之前; nếu REX 后面跟随传统前, nó sẽ bị bỏ qua。

Trong `48 89 e5`中,字节 `48``W`Ứng dụng của REX.`89` `MOV r/m, r`, ModRM `e5`选择将 `%rsp`移入 `%rbp` bỏ REX, phần còn lại giống như chữ`movl %esp, %ebp`

REX cũng sẽ thay đổi tên của các ký tự寄存器.`%spl``%bpl``%sil``%dil`, thay vì `%ah``%ch``%dh``%bh`Vì vậy, giải mã器维护两张表.

### 操作码分布在两张映射表中

单字节操作码最常见──`0F`转义到双字节映射表, và `0F 38`Hoặc`0F 3A`转义到样例从未使用的三字节映射表(SDM 2.1.2)──有些操作码将 ModRM's reg 字段用作额外的三字节映射表,手册中写作 `/digit``83 /7`là 8 位立即数的`cmp`- Tôi không biết.`83 /5` `sub`- Tôi không biết.`FF /4``jmp`

`code/main.py`Trung giải mã bao gồm bốn ví dụ về mã hoạt động trong các tệp mục tiêu và một số ít mã hoạt động gần như.`mov``lea``movslq``movzbl``imul`、移位、`test`和 `idiv`, và`push``pop``call``ret`十六种条件跳转 多字节 `nop`Và 5 mã hoạt động của SSE2... bất kỳ mã hoạt động nào khác đều được đưa ra với địa chỉ và nguyên nhân.`DecodeError`                                                                                                                                                                                                                                                              

### ModRM và SIB  chọn操作数

SDM 2.1.3 sẽ chia ModRM thành`mod`(Bí 7:6)`reg`(5:3) và `r/m`(2:0):`mod = 11`表示 r/m 是寄存器──`mod = 00``01``10`分别表示无位移、8位位移或32位位位移的内存寻址。`r/m = 100`biểu hiện hậu diện theo một SIB 字节。SIB 分为 `scale`(7:6)`index`(5:3) và `base`(2:0);điểm chỉ số 为 `100`表示没有索引寄存器──

Trong bảng 2-2 có hai quy tắc đặc biệt trong mô hình 64 vị trí rất quan trọng.`mod = 00`且 `r/m = 101`Không phải `(%rbp)`, thay vì đối với các chỉ thị 32 vị trí chuyển tiếp (SDM 2.2.1.6)`mod = 00`且 SIB cơ sở 为 `101`,则表示没有基址寄存器的32位位位移──

以 `-O0`下 `grade`Trung `8d 44 08 fa`Ví dụ:`8D` `lea` ModRM`44` `01 000 100`:8 位位移、reg 为 `%eax`, sau cùng theo SIB.`08` `00 001 000`:缩放因子 1 索引 `%rcx`、基址 `%rax`△位移字节 `fa`文本为 `leal -0x6(%rax,%rcx), %eax`, tính là chuyển đổi 索引 `score / 10 - 6`

### 位移是链接器写入的位置

`48 8d 0d 00 00 00 00` `leaq (%rip), %rcx`◊ 4 零字节 là RIP đối với số vị trí chuyển đổi ◊ trong các tập tin mục tiêu có thể định vị lại, chúng là vị trí符`.rela.text`Trung偏移 `0x69`条目写着 `R_X86_64_PC32.rodata-0x4`◊psABI(表 4.9) sẽ `R_X86_64_PC32`定义为 `S + A - P`Mã số địa chỉ: + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + +

处理器 sẽ thêm đoạn này vào địa chỉ của lệnh, vì vậy mục tiêu cuối cùng là `S + A + (end - P)` Đối với bài viết này `lea`,该字段占最后四字节,所以 `end - P`Mục tiêu là:`.rodata + (-4) + 4 =.rodata + 0x0` số -4  tiền trả trước cho các 4 chữ số này  mỗi RIP trong các ví dụ tương đối với các hoạt động đều trong số -4 này, do đó `-O1`của `lea` 上 的`.rodata+0x10` thực sự có nghĩa là `.rodata+0x14`

解码器记录每条命令内部位移字段的偏移──`resolve_reference()`Trong bảng định vị lại tìm kiếm chuyển hướng này, và báo cáo các hàm hoạt động sau liên kết sẽ chỉ ra hướng nào.`leaq (%rip), %rcx`转变 thành 位于 `.rodata+0x0`của biểu diễn.

### Số ngay tối đa 32 vị trí, chỉ có một ngoại lệ

SDM 2.2.1.5 quy định, trong mô hình 64 位, số ngay lập tức vẫn có tối đa 32 位,并 tiến hành biểu tượng mở rộng.`MOV r64, imm64`(带 `REX.W`của `B8+r`),AT&T 语法称之为 `movabsq`❖ Đối với các phép toán, giải mã sẽ 8 điểm ngay lập tức`83 c1 fa` `addl $-0x6, %ecx`); Đối với chuyển vị tính và chọn trục trọng,则读取为无符号数`pshufd $0xee`(■) Sự khác biệt này với`llvm-objdump`                                                                                                                                                                                                                                                              

Quần phân`push`和 `pop`默认使用 64 位操作数并忽略 `66`(SDM 2.2.1.7)  Vì vậy, máy giải mã không cần phải đọc số lượng các hoạt động, sẽ được đặt tên `pushq``popq``callq`和 `retq`

## 手工解码 一条命令

Trước khi có thể giải mã, trước khi có thể giải mã trên giấy.`grade`Trung `48 69 c0 67 66 66 66`

1. `48`位于 `40`Đến`4F`之间, vì vậy là `W = 1`của REX. Operating Number là 64 bit.
2. `69` `IMUL r, r/m, imm32`
3. `c0`是 ModRM `11 000 000`:寄存器形式,reg 为 `%rax`, r/m 为 `%rax`
4. 4 chữ cái là số nhỏ.`0x66666667`
5. AT&T 顺序为立即数、源、目标:`imulq $0x66666667, %rax, %rax`

总计七字节,`llvm-objdump`印文本完全相同──这个常数是一个倒数,让 clang có thể thông qua乘法和后续的`sarq $0x22`(右移 34 位) thực hiện trừ 10 〜 第 34 课也会遇到这个操作,届时升机将将其恢复为`score / 10`

解码器在 `Decoder.decode()``_State.modrm()`和 `_State.finish()`Trong thực hiện 5 bước này. Theo thứ tự này, nó sẽ đưa mỗi phân khúc của SDM với các chuỗi văn bản của nó.

## 线性扫描

Schwarz、Debray 和 Andrews 在Dissassembly of Executable Code Revisited(WCRE 2002) § 3.1 节 mô tả việc quét đường: từ phần đầu tiên của code节 bắt đầu, giải mã một条 chỉ thị, tiếp tục từ phần sau nó cho đến cuối cùng.`objdump`如此工作,`llvm-objdump`Cũng vậy.

```python
def linear_sweep(code: bytes, start: int = 0, end: int | None = None) -> SweepResult:
    position = start
    while position < end:
        try:
            instruction = decode(code[:end], position)
        except DecodeError:
            undecodable.append((position, code[position]))
            position += 1
            continue
        instructions.append(instruction)
        position = instruction.end
```

Phương pháp này có một kiểu thất bại, bài viết hình 1 cho thấy nó. Các mã dữ liệu được giải mã thành lệnh, sau đó các mã hóa sẽ tạm thời vượt qua biên giới lệnh thực sự. Trên x86, các mã hóa thường được tái đồng bộ trong vài mã, điều này khiến cho lỗi khó nhận thấy. Chỉ có những mã hoạt động bất hợp pháp để kiểm tra vấn đề, do đó kết luận của bài viết là các thuật toán này sẽ thất bại lặng lẽ.

线性扫描 cũng là một thiết bị đánh giá tham khảo của bài học này.`llvm-objdump -d`Một致, và `llvm-objdump`Bản thân là một quét đường.`code/fixtures/*.objdump.txt`△测试将每一行解析为地址、字节和文本,删除 `#`后的注释,再进行比较──四个目标文件分别包含 86、56、84 和 11 条指令,总计 237 条,解码器全部匹配──

## 递归下降

Cùng một bài luận, phần 3.2 sẽ gọi là phương pháp tiếp tục quay trở lại. Từ đầu vào được biết bắt đầu, giải mã cho đến khi gặp chuyển giao kiểm soát. Đối với nhảy trực tiếp, từ mục tiêu tiếp tục. Đối với điều kiện phân chia, từ mục tiêu và từ lệnh tiếp theo tiếp tục. Đối với điều chỉnh, từ sau tiếp tục, vì người được gọi sẽ quay trở lại. Đối với trở lại, thì dừng lại.

```python
if instruction.flow == "branch":
    worklist.append(instruction.target)
    address = instruction.end
elif instruction.flow == "indirect-jump":
    table = resolver(instruction, instructions) if resolver else None
    if table is None:
        unresolved.append(instruction)
        break
```

Phương pháp thất bại của phương pháp này đúng ngược lại. Các pha tử nhảy gián tiếp không có mục tiêu, quá trình sẽ dừng lại ở đây, tất cả các khối chỉ có thể đi qua để nhảy đến đó vẫn chưa được biết.`main.py`Các hội nghị tái diễn và hạ xuống trung tâm sẽ ghi lại tình huống này như xung đột và dừng lại trên con đường, để sự chồng lên xuất hiện, thay vì lặng lẽ giải mã hai lần.

Andriesse 等人 sử dụng 981 file do bộ biên dịch tạo ra để đánh giá 9 file phản汇编译器 (USENIX Security 2016)  Thực tế trong các file biên dịch trong các file chứa dữ liệu và mã hóa trên các file, ít hơn so với giả thuyết văn bản, và nhiệm vụ cơ bản khó khăn là phục hồi các hàm biên giới.`grade`Trung间跳转 là một sự quen thuộc.

## Một sai lầm quét đường dẫn, quay lại xuống mô hình chính xác

`code/fixtures/sweep-trap.s`là 24 chữ cái viết tay, hàm chứa một张四字节的表――函数用`movzbl (%rcx,%rax), %eax`索引该表,再跳过它.

```asm
lookup:
        movslq  %edi, %rax
        leaq    .Ltable(%rip), %rcx
        movzbl  (%rcx,%rax), %eax
        jmp     .Ldone
.Ltable:
        .byte   0x31, 0xc0, 0x90, 0x48
.Ldone:
        addl    $1, %eax
        retq
```

Sử dụng `clang -target x86_64-unknown-linux-gnu -c sweep-trap.s`构建它──四个表字节经过特意挑选, có thể giải mã thành dường như chỉ thị hợp lý──`31 c0` `xorl %eax, %eax`- Tôi không biết.`90` `nop``48`Đó là REX trước, vì vậy, quét tuyến sẽ được thực hiện với thực tế.`addl $1, %eax`                                                                                                                                                                                                                                                              `addq $0x1, %rax`       `llvm-objdump`输出 chính xác như thế này:

```text
       e: eb 04                        	jmp	0x14 <lookup+0x14>
      10: 31 c0                        	xorl	%eax, %eax
      12: 90                           	nop
      13: 48 83 c0 01                  	addq	$0x1, %rax
      17: c3                           	retq
```

Hình dung này không bị hỏng: mỗi chữ được mã hóa, mỗi chữ ký đều tồn tại, và còn nhiều hơn.`retq`Nhưng vẫn có 3 sai lầm.`0xe`处跳转的目标是 `0x14`Trong danh sách không có lệnh nào.`0x14`开始── thực sự từ `0x14`执行 là 32 位 `addl`, đơn chỉ trong một đoạn trước cho thấy 64 vị trí `addq`四表字节 cũng được hiển thị là mã 

Từ `lookup`符号开始的递归下降解码出六条命令,沿跳转到达 `0x14`, báo cáo `addl $0x1, %eax`Nó không có 4 biểu tượng.`plus_one`Bất kỳ một trong 8 filling chữ cái của trước đây được xác định là chỉ thị.`main.py`Trung `trap_report()`打印比较结果:

```json
"linearSweep": {
  "instructions": 9,
  "atJumpTarget": {"starts": "0x13", "text": "addq\t$0x1, %rax", "startsAtTarget": false},
  "claimedDataBytes": 4,
  "claimedPaddingBytes": 8
},
"recursiveDescent": {
  "instructions": 6,
  "atJumpTarget": "addl\t$0x1, %eax",
  "claimedDataBytes": 0,
  "claimedPaddingBytes": 0
}
```

测试 `test_sweep_and_objdump_share_the_same_mistake`断言,`llvm-objdump`Trong `0x13`印了 `addq $0x1, %rax` Reference Juditor is linear scan, also inherited its blind point Reference Juditor is consistent with Reference Juditor, only can test decoder; regression down to test which instructions will be executed

## 基本块

Allen trong Control Flow Analysis (1970) đã định nghĩa các khối cơ bản: một đoạn chỉ có thể nhập từ lệnh đầu tiên, từ lệnh cuối cùng để rời khỏi chuỗi lệnh. Yakdan 等人 trong No More Gotos (NDSS 2015) II.A.2 节 nhằm chống biên dịch tái mô tả định nghĩa này,并将头节设为函数入口.

 Construction process to execute two times scan── First time collect the first order: nhập , phân chia hoặc nhảy , mục tiêu, mục tiêu, cũng như bất kỳ lệnh chuyển giao kiểm soát nào.

```python
for instruction in self.instructions:
    if instruction.address in leaders or current is None or current.end != instruction.address:
        current = Block(instruction.address, [])
        self.blocks[instruction.address] = current
    current.instructions.append(instruction)
```

边由每个块的最后条命令决定──回归没有后继;跳转一个,标记为`jump`; điều kiện phân支 có hai,分分标为 `taken`和 `fallthrough`                                                                                                                                                                                                                                                              `table`Nếu không có mục tiêu, thì sẽ được ghi lại.`unresolved`

Cùng một lần quét cũng có hai sự kiện khác.`-O0`下对 `grade`Việc quét sẽ tạo ra 5 . Nếu địa điểm khởi đầu của một khối rơi vào một lệnh trong một cách khác để thanh toán, đó là tình huống chồng chất trong ví dụ dụ.

## tổng số của kiểm soát

`-O1`下的 `total`Có 31 字节、13 条 chỉ thị:

```text
      40: 85 f6                        	testl	%esi, %esi
      42: 7e 18                        	jle	0x5c <total+0x1c>
      44: 89 f1                        	movl	%esi, %ecx
      46: 31 d2                        	xorl	%edx, %edx
      48: 31 c0                        	xorl	%eax, %eax
      4a: 66 0f 1f 44 00 00            	nopw	(%rax,%rax)
      50: 03 04 97                     	addl	(%rdi,%rdx,4), %eax
      53: 48 ff c2                     	incq	%rdx
      56: 48 39 d1                     	cmpq	%rdx, %rcx
      59: 75 f5                        	jne	0x50 <total+0x10>
      5b: c3                           	retq
      5c: 31 c0                        	xorl	%eax, %eax
      5e: c3                           	retq
```

首命令分别是 `0x40`(入口)`0x44`(`jle`之后)`0x50`(`jne`(đối với mục tiêu)`0x5b`(`jne`后) và `0x5c`(`jle`五块五条边:

| 起点 | 终点 | 类型 | 原因 |
|---|---|---|---|
| `0x40` | `0x44` | fallthrough | `jle` 未跳转，计数为正 |
| `0x40` | `0x5c` | taken | 计数为零或负数，返回 0 |
| `0x44` | `0x50` | fallthrough | `nopw` 是块内的对齐填充，执行会经过它 |
| `0x50` | `0x50` | taken | `jne 0x50`，即循环 |
| `0x50` | `0x5b` | fallthrough | 循环退出，返回总和 |

`0x4a`处的六字节 `nopw`Đưa đi.`0x50`处的循环头位于16字节边界――它是可达的,因此属于块 `0x44`            `retq`之后,`0x5f`处的单字节 `nop`Nó cũng được lấp đầy, nhưng không có đường dẫn nào để đến đó.`unreachable()`Sẽ xuất hiện.

Trong `-O2`下, cùng một hàm có 140 chữ cái và hai vòng.`0x80`处的SSE2 循体通过 `paddd`Mỗi vòng cộng thêm 8 giá trị, số lượng dư trong `0xc0`处理──CFG 有两条回边:`0x80 -> 0x80`和 `0xc0 -> 0xc0`, Test Suitets kiểm tra hai bên này.

## Sử dụng thuật toán tính toán kiểm soát

Nếu từ nhập khẩu đến khối`b`Mỗi đường đi qua một khối`d`,则称 `d`支配 `b``b`Định hướng trực tiếp của các yếu tố, là`b`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `b`Một trong những khái niệm gần đây nhất của Allen(1970) có thể được tìm thấy ở Prosser(1959),`if`和 `while`

Cooper, Harvey và Kennedy đã viết một thuật toán thống trị nhanh chóng và đơn giản (A Simple, Fast Dominance Algorithm) (2001)  Họ cho rằng, áp dụng các thuật toán dữ liệu hoạt động theo thứ tự ngược lại, trong khoảng 1000 điểm dưới đây tốt hơn so với Lengauer-Tarjan (1979)  Bài luận nói mục đích của nó không phải là đưa ra một thuật toán mới, mà là giải thích các thuật toán đơn giản cũng có thể chiến thắng trong thực tế, và phù hợp với các hàm CFG 几乎不会 có một ngàn điểm.

```python
def intersect(first: int, second: int) -> int:
    while first != second:
        while number[first] > number[second]:
            first = idom[first]
        while number[second] > number[first]:
            second = idom[second]
    return first

changed = True
while changed:
    changed = False
    for start in order[1:]:
        processed = [p for p in self.predecessors(start) if p in idom]
        candidate = processed[0]
        for other in processed[1:]:
            candidate = intersect(other, candidate)
        if idom.get(start) != candidate:
            idom[start] = candidate
            changed = True
```

`number`保存 mỗi khối trong phần ngược, nhập khẩu là 0。`intersect`Sử dụng hai chỉ số dọc theo cây hiện tại để đi lên, cho đến khi gặp gỡ.`<`进行比较──本代码使用逆后序号,因此比较符是 `>`Phần còn lại đều theo mã giả của bài luận.

 Đối với `-O1`下的 `total`, kết quả là`idom(0x44) = 0x40``idom(0x50) = 0x44``idom(0x5b) = 0x50`和 `idom(0x5c) = 0x40`边 `0x50 -> 0x50`Là quay lại, vì mục tiêu kiểm soát nguồn gốc của nó; quay lại là một vòng lặp (Allen 1970)`back_edges()`Trở lại đây.`test_dominators_on_a_hand_built_diamond_with_a_loop`Trong chuỗi 16 chữ cái của tập hợp, hãy chạy cùng một mã, để `intersect`xử lý hai ổ đĩa trước.

## - 0 lớp dưới trung bình

Trong `-O0`Này, clang sẽ`grade`Trung `switch`编译为位置无关跳转表的常用形式:

```text
      5d: 83 e8 04                     	subl	$0x4, %eax
      60: 77 38                        	ja	0x9a <grade+0x6a>
      62: 48 8b 45 f0                  	movq	-0x10(%rbp), %rax
      66: 48 8d 0d 00 00 00 00         	leaq	(%rip), %rcx
		0000000000000069:  R_X86_64_PC32	.rodata-0x4
      6d: 48 63 04 81                  	movslq	(%rcx,%rax,4), %rax
      71: 48 01 c8                     	addq	%rcx, %rax
      74: ff e0                        	jmpq	*%rax
```

Để đọc nó thành bốn sự thật.`subl $0x4`后跟 `ja`                                                                                                                                                                                                                                                              `0x9a`n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n`leaq`将表地址放入 `%rcx`, 上一节 đã giải thích rằng địa chỉ này là`.rodata+0x0``movslq`以 4 为缩小因子加载一个有符号 32位条目.`addq`+ biểu tượng基址, do đó mỗi mục là từ biểu tượng đến đối ứng trường hợp khoảng cách của khối.

目标文件中的每表字节都是零. 目标仅以`.rela.rodata`Trung ương định vị hình thức tồn tại:

```text
RELOCATION RECORDS FOR [.rodata]:
OFFSET           TYPE                     VALUE
0000000000000000 R_X86_64_PC32            .text+0x91
0000000000000004 R_X86_64_PC32            .text+0x8c
0000000000000008 R_X86_64_PC32            .text+0x87
000000000000000c R_X86_64_PC32            .text+0x82
0000000000000010 R_X86_64_PC32            .text+0x86
```

Đối với chuyển động`4k`của thứ`k`项 ứng dụng `S + A - P` Giá trị lưu trữ`.text + A - (.rodata + 4k)`, Code thêm lại `.rodata + 0`, vì vậy mục tiêu là`.text + A - 4k`△第 0 项是 `0x91 - 0 = 0x91`,第 1 项 là`0x8c - 4 = 0x88`, thứ 2 项 là `0x87 - 8 = 0x7f`△第3、4 项分别是 `0x82 - 12 = 0x76`和 `0x86 - 16 = 0x76``score / 10`Các trường hợp 6、7、8、9、10 phân biệt đến lưu trữ 1、2、3、4、4 khối.

`recover_table()`执行这些计算――`jump_table_resolver()`Từ `jmpq`                                                                                                                                                                                                                                                              `addq`、thùng nó `movslq`、 tạo ra các địa điểm `leaq`, cũng như thực hiện kiểm tra biên giới`ja` chuyển tiếp xuống sau đó sẽ có bốn mục tiêu khác nhau tham gia vào tập hợp xử lý và tiếp tục.`evidence`记录生成目标所用的路径──

Đây là:`-O0`下 `grade`DATA, từ `python3 code/main.py cfg code/fixtures/ledger-x86_64-O0.o grade`- Có thể là:

| 方法 | 指令数 | 块数 | 边数 | 字节 | 问题 |
|---|---|---|---|---|---|
| 线性扫描 | 34 | 9 | 7 | 118 代码 + 10 填充 | 5 个不可达块，没有进入四个 case 块的边，填充被解码为 `nopw` |
| 递归下降 | 25 | 3 | 2 | 82 代码 | 36 个代码字节从未到达，`0x74` 处的 `jmpq *%rax` 未解析 |
| 带表的递归下降 | 33 | 8 | 11 | 118 代码 | 无 |

Sau khi phục hồi, cây được kiểm soát hoàn toàn.`idom`Đó là một phần của nó.`0x62``0xa1`của `idom``0x30`, bởi vì từ `0x9a`                                                                                                                                                                                                                                                              `0x62`Chỉ có thể đến được thôi.`0xa1`

## 优化器在 -O1 下对级做了什么

Bạn có thể đã từng thấy mô tả như thế này:`grade`là một phiên bản được dịch thành chuyển đổi biểu đồ nhảy nhưng tình huống tiết lộ chữ cái là cụ thể hơn.`-O1`和 `-O2`下,`grade`Trung根本没有间接跳转:

```text
      2c: 83 f9 04                     	cmpl	$0x4, %ecx
      2f: 77 0c                        	ja	0x3d <grade+0x2d>
      31: 89 c8                        	movl	%ecx, %eax
      33: 48 8d 0d 00 00 00 00         	leaq	(%rip), %rcx
		0000000000000036:  R_X86_64_PC32	.rodata+0x10
      3a: 8b 04 81                     	movl	(%rcx,%rax,4), %eax
      3d: c3                           	retq
```

重定位加数 `0x10`Thêm vào số 4, có được địa chỉ biểu diễn `.rodata+0x14` tải chỉ là bình thường `movl`,该处字节为`01 00 00 00 02 00 00 00 03 00 00 00 04 00 00 00 04 00 00 00`◊ Bộ biên dịch có chứa năm giá trị trả lại thay thế năm khối trường hợp ◊ ở đây có định vị lại, có biểu đồ, cũng có kiểm tra biên giới, nhưng dòng kiểm soát chỉ có ba khối, ba bên và một điều kiện phân支`find_value_tables()`Chuyên bố của nó là`value-table`,条目为`[1, 2, 3, 4, 4]`,并带有`evidence: "bytes"`

`-O2`下的 `grade_label`Hơn nữa. Có 5 dấu chỉ.`labels`Số组, biến thành vị trí `.rodata+0x0`、 chứa 5 biểu đồ chuyển biến 32 điểm. Mỗi biểu đồ đều có phần chuỗi được nhắm mục tiêu.`R_X86_64_PC32`重定位, hàm sẽ表地址 được thêm vào mục được tải lên.`recover_table()`读取这五重定位, quay lại `.rodata.str1.1`Trung tâm chuyển động`0, 2, 4, 6, 8`, chúng được bảo quản riêng biệt .`F``D``C``B``A` Khôi phục các tính toán tương tự của bảng nhảy cũng có thể khôi phục đối với bảng dữ liệu, bởi vì hai trong số đó là các vị trí chuyển động được biết đến.`S + A - P`

Những bài học được đưa ra từ hai phiên bản xây dựng này là: theo các chữ cái được trình bày trong thực tế.

## rea 和 Ghidra 在这里提供什么

rea 6.5.0 配合 Ghidra 12.1.4 nhà cung cấp,将 `procedure_assembly`Trong hàm của danh sách 文本作为一个字符串返回──`inspect_native_instruction`返回单条命令的字节、长度、解码文本、操作数代币、带类型引用和控制流, trong đó là trả lại các hoạt động dựa trên mã p 分类──`xrefs`返回 Ghidra 的 `ReferenceManager.getReferencesTo`Các dịch vụ được cung cấp`analyze_function`包含函数的 CFG 和 `body``procedure_info`将函数体表示为两端都包含的地址范围,并提醒:不能将空隙和共享尾部视为函数拥有的字节──

Những sự kiện này là sự chuyển tiếp và giảm của Ghidra với các kết quả của các phân tích.`instruction_flow_evidence``function_references`和 `jump_table_evidence`Vì vậy, kết quả sẽ chỉ ra quy tắc tạo ra nó, nhưng không thể thể thể hiện quá trình dẫn hướng. Khi Ghidra tìm thấy không có biểu hiện, dòng kiểm soát là không rõ, trường hợp của khối sẽ bị mất tích từ người调用者, người được调用者 và CFG.

Bây giờ bạn đã có quá trình tiến hành trên cùng một mục tiêu tài liệu.`python3 code/main.py cfg`, sẽ có địa chỉ khởi động khối, số và số phần mềm phục hồi  trả lại đối tượng nội dung. Sự phù hợp có nghĩa là bạn có hai hướng dẫn độc lập; sự không phù hợp cung cấp một địa chỉ kiểm tra cụ thể, đây chính là mục 35 của bài học ghi lại không rõ.

Từ góc độ an toàn của quy trình, hãy nhớ lại một điểm: Capstone 6.0.0-Alpha10(2026-07-21) sửa đổi CVE-2026-55893 和 CVE-2026-55894  liên quan đến越界读写,5.0.9(2026-05-28)则 chuyển lại CVE 修复──解码器读取的字节并非自发生成──15 字节限制──`_Cursor.byte()`Việc kiểm tra cắt, cũng như từ chối đoán mã hoạt động không rõ, đều được bảo vệ.`main.py`, tránh xử lý vượt quá phạm vi thiết kế của nó.

## 动手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow
python3 code/main.py
```

输出 là một báo cáo JSON. Nó cho phép mỗi tập tin mục tiêu mẫu tương thích với các thiết bị định đo lường tham khảo; cho mỗi hàm chỉ số, khối lượng và số rìa dưới ba phương pháp. Nó cũng liệt kê các khối không thể đạt được, không phân tích, nhảy trung gian, quay lại, các nút kiểm soát trực tiếp và tất cả các biểu đồ, cuối cùng cho phép so sánh các ví dụ.

预期结构:

```json
{
  "fixtures": {
    "ledger-x86_64-O0.o": {
      "oracle": "86/86 instructions agree with llvm-objdump",
      "functions": {
        "grade": {
          "range": "0x30-0xa6",
          "paddingBytes": 10,
          "linearSweep": {"instructions": 34, "blocks": 9, "edges": 7, "unreachableBlocks": ["0x76", "0x7f", "0x88", "0x91", "0xa6"], "...": "..."},
          "recursiveDescent": {"instructions": 25, "blocks": 3, "edges": 2, "unresolvedIndirectJumps": ["0x74"], "...": "..."},
          "recursiveDescentWithTables": {"instructions": 33, "blocks": 8, "edges": 11, "...": "..."},
          "tables": [{"kind": "jump-table", "table": ".rodata+0x0", "count": 5, "entries": ["0x91", "0x88", "0x7f", "0x76", "0x76"], "evidence": "relocation", "...": "..."}]
        }
      }
    }
  },
  "sweepTrap": {"...": "..."}
}
```

按以下顺序阅读 `code/main.py`- Có thể là:

1. `ElfObject`读取节头、符号和 `.rela.*`条目,`symbolize()`按 `llvm-objdump`Định nghĩa của địa điểm đặt tên:
2. `Decoder.decode()`读取前和REX, sau đó dựa trên đơn字节 hoặc hai字节操作码映射分派.
3. `_State.modrm()`读取 ModRM、SIB 和位移,并记录位移字段的偏移──
4. `resolve_reference()`Ứng dụng định vị lại trên các đoạn chuyển động hoặc số ngay lập tức `S + A - P`
5. `linear_sweep()`和 `recursive_descent()`Có hai cách, từng ghi lại thất bại.
6. `recover_table()`和 `jump_table_resolver()`通过重定位或字节读取表──
7. `ControlFlowGraph`构建首指令、块和带类边,`dominators()`实现代算法──
8. `analyze_function()`Đối với một hàm vận hành tất cả các phương pháp,`compare_with_oracle()`检查解码器──

Còn hai lệnh nữa.`python3 code/main.py disasm FILE.o`印清单, và đưa lại mục tiêu theo từng chỉ dẫn sau đó hiển thị mục tiêu đó.`python3 code/main.py cfg FILE.o FUNCTION`打印单个函数的分析――

##  thực tế sử dụng

Đối với các tài liệu mục tiêu mới, theo thứ tự này sử dụng ba phương pháp:

1. Trước vận hành tham khảo đối chiếu.`llvm-objdump`Không phù hợp, có lỗi, sau đó tất cả các cấu trúc đều sẽ thừa kế nó.
2. Từ mỗi biểu tượng hàm bắt đầu chạy quay lại xuống,并阅读 `unresolved` Mỗi mục tiêu là bạn chưa nắm bắt mục tiêu của mình 
3. Đối với mỗi bước nhảy chưa được phân tích, tìm kiếm hình thức thường xuyên của biểu đồ và định vị trọng điểm của biểu đồ. Nếu không phù hợp, đọc đọc các pha khoản trước nhảy và ghi chú.
4. 字节 so sánh quét tuyến tính với giảm lượt. Chỉ có quét xác định các字节 của lệnh là điền hoặc dữ liệu; cả hai đều không xác định các字节 là không thể đạt được mã, hoặc thuộc về các hàm bạn chưa tìm thấy.
5. Sử dụng kết quả tái tạo sau khi quay xuống xây dựng CFG,并查看回边.`while`Hoặc`for`

Để lưu giữ các tài liệu tài liệu tham khảo và các tài liệu mục tiêu cùng tồn tại. Khi di chuyển sang phiên bản trình biên dịch mới, bắt lại chúng, vì sự thay đổi đơn giản có nghĩa là các mẫu cũng đã thay đổi.

## 交互实验

### 实验 A:先在纸上解码,再检查

Trong `code`Giờ mở Python:

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow/code
python3 -q
```

运行:

```python
from main import *
decode(bytes.fromhex("48 8d 0d 00 00 00 00"), 0).text
decode(bytes.fromhex("8d 44 08 fa"), 0).text
decode(bytes.fromhex("66 66 66 66 66 2e 0f 1f 84 00 00 00 00 00"), 0).length
```

Mỗi lần调用前先写下预期结果──然后删除第一项中的 `48`, quan sát số hoạt động lớn thay đổi.`decode(bytes.fromhex("0f 0a"), 0)`, đọc `DecodeError`

### 实验 B:lea 上的重定位

```python
elf = load_fixture("ledger-x86_64-O0.o")
code = elf.section(".text").data
lea = decode(code, 0x66)
lea.displacement_offset
resolve_reference(elf, lea)
```

引用结果是 `.rodata+0x0`将地址改成 `grade_label`Trung `0x116`,读取指向 `.data`        `0x10e`处的 `callq`Và giải quyết nó.`R_X86_64_PLT32 grade-0x4`, giải quyết mục tiêu sau`0x30`, cũng vậy`grade`

### 实验 C:观察两种方法的分歧

```python
trap = load_fixture("sweep-trap.o")
text = trap.section(".text").data
[i.text for i in linear_sweep(text, 0, 0x20).instructions]
[i.text for i in recursive_descent(text, [0], 0x20).sorted_instructions()]
```

统计 số chỉ thị trong mỗi danh sách, tìm thấy từ `0x13`开始那条──然后将 `sweep-trap.s`Từ từ từ từ từ từ`0x48`改为 `0xe8`, tái xây dựng, tái chạy hai phương pháp.`addl`和 `retq`吞进一条目标 nằm bên ngoài `callq`, hàm dường như đã không quay lại.

### 实验 D:手算支配节点

```python
analysis = analyze_function(load_fixture("ledger-x86_64-O1.o"), "total")
analysis.cfg.edges
analysis.cfg.reverse_postorder()
analysis.cfg.dominators()
analysis.cfg.back_edges()
```

Trong giấy vẽ ra 5 khối, trước tiên tính toán kiểm soát các nút xem lại kết quả.`-O0`下的 `grade`运行相同四行代码, giải thích tại sao `idom(0xa1)` `0x30`Không phải`0x62`

## 实践实验

Ví dụ: thêm một điểm điều chỉnh trực tiếp,并 mở rộng phân tích.

要求:

- 编写 một hàm C, thông qua chỉ số hàm được chọn trong một nhóm nhỏ 调用函数──分别用 `-O0`和 `-O1`构建,将目标文件及其它 `llvm-objdump`文本一起提交──
- 让解码器一致 với kết quả tham khảo trên hai mục tiêu文件. Chỉ cần chỉ dẫn trong ví dụ đó khi cần thêm mã hoạt động.
- 扩展 `recursive_descent()`, để liên tục调用 sẽ调用 điểm ghi lại`calls`, mục tiêu đặt ra`None`, sau đó tiếp tục thực hiện.
- 编写解析器, thông qua định vị lại đọc hàm chỉ số và báo cáo của người được调用者
- sẽ được调用者集合以`indirectCalls`添加到函数报告,并为每个目标提供证据类型──
- 编写测试, làm cho máy phân tích trở lại mục tiêu của các mã không hàm

Định nghĩa thành công là:`python3 code/main.py cfg`能列出每一个可能被调用者及证明其重定位, và tất cả các tài liệu mục tiêu vẫn thông qua tham khảo đối chiếu.

## 本课产物

本课包含 `outputs/skill-disassembly-and-control-flow.md` Sử dụng nó để chuyển đổi tên tập tin mục tiêu và hàm thành các đơn sơ đã được kiểm tra, các khối cơ bản, các loại bên cạnh, các nút kiểm soát, cũng như tất cả các chuyển giao kiểm soát chưa được giải quyết. Nó yêu cầu cung cấp các phương pháp kiểm tra tham khảo, hai phương pháp lập lại, tính toán chữ cái, chứng cứ vị trí lại của mỗi bảng phục hồi, cũng như các thông tin nội dung vẫn chưa được biết.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow
python3 code/main.py
python3 code/tests/test_main.py
```

验证应证明:

- Các mục tiêu của các tập tin trong 4 ví dụ được ghi vào 237 điều`llvm-objdump -d`Một
- REX.W 选择 64 位操作数,REX.R 和 REX.B 扩展寄存器字段
- ModRM và SIB chính xác trình bày số hoạt động trong bộ nhớ AT&T, bao gồm các yếu tố mở rộng, chỉ số và có biểu tượng chuyển động
- RIP tương đối với vị trí chuyển động sẽ kết nối với các đoạn chuyển động trong lệnh
- 重复传统前和段覆盖的解码结果与参考结果一致
- 强制 `66`前选择 SSE 操作码,并让寄存器保持 32 位
- 8 số ngay lập tức được sử dụng trong toán học để mở rộng biểu tượng, được sử dụng trong chuyển vị trí tính toán để không có biểu tượng
- 超过15字节的命令 截断命令和未知操作码都会被抛出`DecodeError`
- `lea` 上 的`R_X86_64_PC32`解析为表,`call` 上 的`R_X86_64_PLT32`解析为被调用者
- 线性扫描 sẽ được mã hóa trong bẫy, và nhảy đến mục tiêu không có lệnh
- 递归下降 从不将表或填充认定为指令, và đọc ở mục tiêu `addl $0x1, %eax`
- `llvm-objdump`Trong cái bẫy đã phạm sai lầm giống như việc quét qua đường dây
- Chỉ thị bên trong được ghi nhận là xung đột
- Không giải quyết được chuyển đổi gián tiếp dừng lại và giảm xuống,并 được liệt kê
- `-O1`下的 `total`Có 5 khối, 5 vòng loại, 1 vòng quay, và các nút kiểm soát trực tiếp dự kiến.
- Các mô hình hình dạng tạo ra các thuật toán định nghĩa các nốt thống trị
- `-O2`下的 `total`Có hai vòng.
- `-O0`下的 `grade`Từ `.rela.rodata`恢复出五项跳转表, mục tiêu为 `0x91, 0x88, 0x7f, 0x76, 0x76`
- Không phục hồi thời gian,`-O0`下的 `grade`Có ba khối và một không được giải quyết nhảy
- `-O1`和 `-O2`下的 `grade`         `[1, 2, 3, 4, 4]`, không có trượt trượt
- `-O2`下的 `grade_label`通过五重定位读取相对字符串表
-  giao tiếp dữ liệu được nhúng cùng dữ liệu được phân tích

## 生产环境失败模式

| 故障 | 较弱工具的报告 | 分析必须证明的内容 |
|---|---|---|
| `.text` 内有数据 | 每个字节都被解码、看似合理的清单 | 递归下降未认定任何数据字节为指令，且跳转目标是指令起点 |
| 最后一次返回之后的填充 | 函数末尾有一条 `nopw` | 这些字节从入口不可达 |
| 通过表的间接跳转 | “jmp rax”和四个死块 | 表地址来自 `lea` 重定位，条目数来自边界检查，目标来自 `.rela.rodata` |
| switch 变成值表 | “带重定位的跳转表” | 从 `.rodata+0x14` 进行 `movl` 加载，三个块，没有间接转移 |
| 位移为零的调用 | `callq 0x113`，即下一条指令 | `R_X86_64_PLT32 grade-0x4` 解析为 `0x30` |
| 解码器猜测未知操作码 | 看起来正确的助记符 | 带地址的 `DecodeError`，扫描记录该字节 |
| 指令超过 15 字节 | 一条很长的“指令” | 游标在读取第 16 字节之前抛出异常 |
| 分支进入指令中间 | 两份重叠的清单 | 包含两个地址的冲突记录 |
| 循环被报告为直线代码 | 伪代码中没有 `while` | 一条目标支配源节点的回边 |
| 参考输出来自不同编译器 | 测试在过时文本上通过 | 样例 README 标明精确的编译器和命令 |

## 操作准则

Để tham khảo các định đoan kiểm tra mã, từ các dòng kiểm soát thông qua đầu vào đã biết, sẽ tính toán mỗi chữ cái cho mã đã xác định, lấp đầy, dữ liệu hoặc không thể đạt được. Từ các định vị hoặc biểu đồ có thể xác định được để phục hồi từng mục tiêu gián tiếp.

## 延伸阅读

- [Intel 64 and IA-32 Architectures Software Developer's Manual，第 2 卷第 2 章：指令格式](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [AMD64 Architecture Programmer's Manual 第 3 卷第 1 章：指令编码](https://docs.amd.com/v/u/en-US/24594_3.38_APM_Vol3_PUB)
- [System V Application Binary Interface，AMD64 Architecture Processor Supplement，表 4.9：重定位类型](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Schwarz、Debray、Andrews，《Disassembly of Executable Code Revisited》（WCRE 2002）](https://www2.cs.arizona.edu/~debray/Publications/disasm.pdf)
- [Andriesse 等，《An In-Depth Analysis of Disassembly on Full-Scale x86/x64 Binaries》（USENIX Security 2016）](https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/andriesse)
- [Allen，《Control Flow Analysis》（1970）](https://doi.org/10.1145/800028.808479)
- [Cooper、Harvey、Kennedy，《A Simple, Fast Dominance Algorithm》（2001）](https://www.cs.tufts.edu/~nr/cs257/archive/keith-cooper/dom14.pdf)
- [Lengauer、Tarjan，《A fast algorithm for finding dominators in a flowgraph》（1979）](https://doi.org/10.1145/357062.357071)
- [Capstone 6.0.0-Alpha10 发布说明](https://github.com/capstone-engine/capstone/releases/tag/6.0.0-Alpha10)
- 本课描述的 rea 6.5.0 源码位于标签 `3b79af2`- Có thể là:`README.md``docs/ghidra-provider.md``docs/ghidra-dos.md``docs/reverse-engineering-tools.md``bridge/ghidra/ReaGhidraBridge.java``src/contracts/officialToolContracts.ts``src/ghidra/GhidraAnalysisProfile.ts`
