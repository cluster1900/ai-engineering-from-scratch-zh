# 程序解剖: từ零编写 ELF 读取器

> 编译后程序 là một tập hợp các biểu đồ hướng về nhau.

**Type:** Build
**Languages:** Python（标准库）、C（仅用于测试夹具）
**Prerequisites:** Phase 0 · 01（开发环境），已安装 clang；Python 3.10 或更高版本；十六进制运算
**Time:** ~120 分钟

## Học mục tiêu

- Nói rõ các quy định về quyền hạn của mỗi mục tiêu phân tích, cũng như bốn hạn chế của 17 U.S.C. 1201 (f)
- Sử dụng `struct.unpack`读取 ELF 文件头、节头表和两个字符串表──
- 根据 gABI 与 x86-64 psABI 中的名称解码 `.symtab`条目与 `.rela`记录──
- 返回指定函数的准确字节,并将每个文件偏移映射到其属结构──
- 读取程序头, qua `PT_LOAD`将虚拟地址映射为文件偏移──
- 读取 Mach-O 目标文件的加载命令,并指出每个命令对应的ELF概念──

## 开始之前:授权与法律

Các mục tiêu của các bài học 32 đến 36 là các chương trình tự viết và biên dịch của bạn.`code/fixtures/ledger.c`, bao gồm bốn hàm C ngắn gọn. Mã nguồn, lệnh biên dịch và các tài liệu mục tiêu được tạo đều thuộc về bạn. Ở đây không cần phải giải thích giấy phép, cần phải đi qua bảo vệ, cũng không mở bất kỳ mã phần mềm thứ ba nào.

Lý do của quy định này là, luật sẽ xem xét phản汇编 như sao chép. Trong trường hợp *Sega Enterprises Ltd. v. Accolade, Inc.*, 977 F.2d 1510 (9th Cir. 1992) 案, tòa án xác định rằng các bản sao trung gian phát sinh trong quá trình phản汇编 thuộc về  bản quyền pháp luật  nghĩa sao chép. Sau đó tòa án quyết định: khi phản汇编 là cách duy nhất để có được những ý tưởng và chức năng được thể hiện trong các chương trình máy tính được bảo vệ bản quyền, và tìm kiếm các yếu tố này có lý do hợp lý, khi tìm kiếm loại này có được hợp lý, phản汇编 được tạo thành trên pháp luật để sử dụng hợp lý các tác phẩm được bảo vệ bản quyền.

Trường hợp thứ hai là *Sony Computer Entertainment, Inc. v. Connectix Corp.*, 203 F.3d 596 (9th Cir. 2000)  Connectix trong quá trình phát triển mô phỏng đã sao chép PlayStation BIOS, tòa án xác nhận những bản sao này thuộc về sử dụng hợp lý.

 2 văn bản quy định giới hạn. 17 U.S.C. 1201 (f)                                                                                                                                                                                                                                                    

Trong Liên minh châu Âu,Đạo chỉ đạo 2009/24/EC, Mục 5 (3) ▌ liên quan đến nghiên cứu. Người có quyền sử dụng bản sao có thể quan sát, xem xét hoặc kiểm tra các quy trình để xác định ý tưởng và nguyên tắc đằng sau các yếu tố của quy trình.

Điều 6                                                                                                                                                                                                                                                              

| 来源 | 允许的行为 | 条件 |
|---|---|---|
| 17 U.S.C. 1201(f) | 绕过访问控制以分析程序 | 合法副本、互操作目的、信息不易获得、不构成侵权 |
| Directive 2009/24/EC 第 5(3) 条 | 观察、研究和测试运行中的程序 | 有权使用副本，行为处于正常加载和运行范围内 |
| Directive 2009/24/EC 第 6 条 | 反编译 | 被许可人、互操作目的、信息不易获得、仅限必要部分 |
| *Sega v. Accolade* | 构成合理使用的反汇编 | 获取思想和功能要素的唯一途径，且理由正当 |
| *Sony v. Connectix* | 逆向工程过程中的中间复制 | 最终产品不侵权 |

Những thông tin này đến từ các điều luật và phán quyết, không tạo thành các đề xuất pháp lý. Sau đó, khi gặp không thuộc mục tiêu của bạn, bạn nên trước tiên có được giấy phép mở lại tài liệu, và sẽ được bảo quản cùng với bằng chứng.

## 问题

Anh đã viết rồi.`ledger.c`, và đối với mục tiêu tài liệu đã hoạt động .`llvm-objdump -t` Xuất khẩu `percent_change` 的值为`0000000000000000`, ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm`0000000000000010`◊ Trong 1768 字节文件中哪个 16 字节属于该函数?`0x36`处显示 `R_X86_64_PC32 .rodata+0x10`, trong khi bốn chữ cái trong văn bản này là không. Chúng cuối cùng sẽ trở thành gì?`0x14`开始,为什么加数却是`0x10`- Không .

Sử dụng `inspect_binary_layout` trả lời các câu hỏi về thiết kế, nhưng công cụ này chỉ được cung cấp trên Linux x64 và được thông qua `REA_PWNTOOLS_PYTHON`Sử dụng các công cụ 4.15.0...`address_to_file_offset`需要 Ghidra 会话,以及 SHA-256 匹配的原始文件完整字节副本──`inspect_artifact`Theo đường dẫn và nội dung, nội dung trong hộp sẽ không đọc bảng nội dung của tập tin mục tiêu.`struct.unpack`和零 phụ thuộc bên ngoài vào máy đọc tự biên tập.`llvm-objdump`文本 để so sánh

```figure
elf-byte-map
```

## 文件就是指向其他表的表

Hệ thống V GABI Chương 4 Hình 4-1 cho thấy hai hình ảnh của cùng một tệp. Khối kết nối hình ảnh chứa ELF 文件头, có thể chọn các chương trình đầu, và các phần cần thiết.

GABI cũng đã xác định loại tiêu chuẩn, và tuyên bố ELF không sử dụng vùng ──`Elf64_Addr`和 `Elf64_Off`Mỗi người chiếm 8 字节,`Elf64_Half`占 2 字节,`Elf64_Word`占 4 字节,`Elf64_Xword`占 8 字节──x86-64 psABI 第 4.1.1 节要求使用 `ELFCLASS64``ELFDATA2LSB`- Tôi không biết.`e_machine`Vì vậy`EM_X86_64`(62),`e_flags`为 ⋅小端字节序加上固定宽度 nghĩa là: sử dụng带 `<`前的 `struct.unpack`, một lần调用就能读取一条记录.

`ledger-x86_64-O1.o`字节:

```text
00000000: 7f45 4c46 0201 0100 0000 0000 0000 0000  .ELF............
00000010: 0100 3e00 0100 0000 0000 0000 0000 0000  ..>.............
00000020: 0000 0000 0000 0000 2804 0000 0000 0000  ........(.......
00000030: 0000 0000 4000 0000 0000 4000 0b00 0100  ....@.....@.....
```

Đối với GABI của SELF Header  trang đọc những chữ này.`e_ident`占 16 字节,包含 `7f 45 4c 46`(魔数,即识别文件格式的固定字节) 类别 2(64位) DATA编码 1(小端) 版本 1、OS ABI 0(System V)及填充──

接着,`e_type`của `0x0001` 表示`ET_REL`, là có thể định vị lại mục tiêu.`e_machine`của `0x003e`Vì 62, tức là`EM_X86_64` mục tiêu không có điểm nhập cảnh, vì vậy `e_entry`为零; nó không có quy trình đầu, vì vậy `e_phoff`Vì vậy,`e_shoff`Vì vậy`0x428`, là chuyển hướng của các tài liệu của bảng.`e_ehsize` `0x40``e_phentsize`0`e_phnum`0`e_shentsize` `0x40``e_shnum` `0x0b`(11 个节头), cũng như`e_shstrndx` `0x0001`

读取器用一次调用解析这一行:

```python
fields = struct.unpack_from("<HHIQQQIHHHHHH", data, 16)
```

字符串对应从左到右读取的 gABI图:两个半字、一个字、三个 8字节值、一个字、六个半字──读取器拒绝魔数、类别或字节序不符的文件,也拒绝不符合 64 和 56 的`e_shentsize`Hoặc`e_phentsize`△ độ rộng một khi sai, tất cả các chuyển động sau sẽ sai, vì vậy kiểm tra phải được đặt trước nhất.

## 节头与两个字符串表

Mỗi đoạn là một đoạn 64 chữ cái.`Elf64_Shdr`(gABI 图 4-8):`sh_name``sh_type``sh_flags``sh_addr``sh_offset``sh_size``sh_link``sh_info``sh_addralign``sh_entsize`✿格式字符串为 ✿`<IIQQQQIIQQ``sh_name` `e_shstrndx`                                                                                                                                                                                                                                                              `e_shstrndx`Vì vậy, sẽ được đặt tên là`.strtab`, do đó cùng một bảng cùng lưu trữ tên và mã tên.

读取器输出 -O1 目标文件的 11 个节头:

```text
Idx Name             Type         Flags   Offset     Size       Addr Link Info Align
  0                  NULL                    0x0      0x0        0x0    0    0     0
  1 .strtab          STRTAB                0x368     0xbe        0x0    0    0     1
  2 .text            PROGBITS     AX        0x40     0x9f        0x0    0    0    16
  3 .rela.text       RELA         I        0x2a8     0x48        0x0   10    2     8
  4 .rodata          PROGBITS     A         0xe0     0x50        0x0    0    0     8
  5 .rela.rodata     RELA         I        0x2f0     0x78        0x0   10    4     8
  6 .rodata.str1.1   PROGBITS     AMS      0x130      0xa        0x0    0    0     1
  7 .comment         PROGBITS     MS       0x13a     0x2f        0x0    0    0     1
  8 .note.GNU-stack  PROGBITS              0x169      0x0        0x0    0    0     1
  9 .llvm_addrsig    LLVM_ADDRSIG E        0x368      0x0        0x0   10    0     1
 10 .symtab          SYMTAB                0x170    0x138        0x0    1    9     8
```

索引 0 是保留的空节头──`.text`Trong tài liệu chuyển động`0x40`处存放 159 字节代码,紧接文件头,标志为`A`(在内存中分配) và `X`(可执行)`.rodata`存放 80 字节 chỉ đọc dữ liệu.`.rodata.str1.1`存放五个标签符串 `F\0D\0C\0B\0A\0`,共 10 字节,标志为 `M`(可合并) và `S`(字符串)

`.comment`存放 47 字节的编译器标记 `\0Apple clang version 17.0.0 (clang-1700.6.3.2)\0``.llvm_addrsig``0x6fff4c03`, nằm trong gABI bảo quản cho hệ điều hành loại đặc biệt `SHT_LOOS`至 `SHT_HIOS`范围内,LLVM của `ELF.h`给出它的名称.`E`Vì vậy`SHF_EXCLUDE`, vì vậy các thiết bị liên kết sẽ bỏ nó.

`sh_link`和 `sh_info`两列是表之间的指针──`.rela.text`của `sh_info`2`sh_link`Nên 10: nó sửa đổi phần 2, và từ phần 10 nhận được mã.`.symtab`của `sh_link`为 1,指向符号名称字符串表;`sh_info`Nên 9, biểu thị chỉ số đầu tiên không địa phương.`sh_addr`都为零, vì mục tiêu文件还没有地址; địa chỉ được phân phối bởi các liên kết.

Hai quy tắc của gABI cho phép người đọc có thể vẽ toàn bộ file映射:节连续且不重叠,文件 có thể chứa không gian chưa được sử dụng── người đọc có thể chuyển theo từng cấu trúc sắp xếp, và lấp vào khoảng trống:

```text
     0x0 +64    header   ELF header
    0x40 +159   section  .text
    0xdf +1     gap      inactive space
    0xe0 +80    section  .rodata
   0x130 +10    section  .rodata.str1.1
   0x13a +47    section  .comment
   0x169 +7     gap      inactive space
   0x170 +312   section  .symtab
   0x2a8 +72    section  .rela.text
   0x2f0 +120   section  .rela.rodata
   0x368 +190   section  .strtab
   0x426 +2     gap      inactive space
   0x428 +704   table    section header table
```

Ba khoảng trống có 10 chữ, tất cả là để đối diện.`.rodata`của `sh_addralign`Vì vậy, từ`0xe0`Không phải`0xdf`开始──`.symtab`      `.comment`之后有七字节未使用──节头表本身也按8字节对齐──

`SHT_NOBITS`类型节完全不占文件字节,因此映射会跳过它们. 本目标文件没有这种类型节,但已链接程序中的 `.bss` thuộc loại này; nếu người đọc có mù tín`sh_size`,就可能读到文件末尾之外.

## 符号:绑定、类型、属节、值与大小

`Elf64_Sym`占 24 字节 ((gABI 图 4-18):`st_name``st_info``st_other``st_shndx``st_value``st_size`, hình thức`<IBBHQQ``st_info`打包了两个字段:高四位为绑定属性,低四位为类型――gABI 定义的绑定为 `STB_LOCAL`0`STB_GLOBAL`1`STB_WEAK`2; loại `STT_NOTYPE`0`STT_OBJECT`1`STT_FUNC`2`STT_SECTION`3`STT_FILE`4 `st_other`Ước gì có thể thấy được, tất cả đều là `STV_DEFAULT`0:

```text
Idx            Value   Size Bind   Type    Section          Name
  0              0x0      0 LOCAL  NOTYPE  *UND*
  1              0x0      0 LOCAL  FILE    *ABS*            ledger.c
  2              0x0     20 LOCAL  OBJECT  .rodata          labels.rel
  3              0x0      0 LOCAL  SECTION .rodata          .rodata
  4              0x2      2 LOCAL  OBJECT  .rodata.str1.1   .L.str.1
  5              0x4      2 LOCAL  OBJECT  .rodata.str1.1   .L.str.2
  6              0x6      2 LOCAL  OBJECT  .rodata.str1.1   .L.str.3
  7              0x8      2 LOCAL  OBJECT  .rodata.str1.1   .L.str.4
  8              0x0      0 LOCAL  SECTION .rodata.str1.1   .rodata.str1.1
  9              0x0     16 GLOBAL FUNC    .text            percent_change
 10             0x10     46 GLOBAL FUNC    .text            grade
 11             0x40     31 GLOBAL FUNC    .text            total
 12             0x60     63 GLOBAL FUNC    .text            grade_label
```

索引 0 là giữ giữ được không xác định符号.`st_shndx`指定定义符号的节, còn có ba giá trị lưu giữ:`SHN_UNDEF`0 ∞ dùng trong danh sách tài liệu `SHN_ABS` `0xfff1`, và`SHN_COMMON` `0xfff2`△节符号名称为空, do đó `llvm-objdump`会打印节本身的名称,读取器也如此处理──gABI 规定所有具有STB_LOCAL 绑定的符号都排在弱符号和全局符号之前,这里体现为前九行,也正因此`.symtab`Trong `sh_info`Trong số đó có 9...

Trong tập tin mục tiêu có thể định vị lại, vì`sh_addr`为零,`st_value`là biến chuyển trong phần của符号. Vì vậy, các file của hàm biến chuyển vì`sh_offset + st_value - sh_addr`,长度为 `st_size`- Có thể là:

```python
section = elf.sections[symbol.st_shndx]
file_offset = section.sh_offset + (symbol.st_value - section.sh_addr)
code = elf.data[file_offset : file_offset + symbol.st_size]
```

Đối với`percent_change`Và, chuyển động là`0x40 + 0`,16 个字节为`85 ff 74 09 29 fe 6b c6 64 99 f7 ff c3 31 c0 c3`◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊   ◊                                                                                                                                                              `grade`Trong `.text`   `0x3e`处结束――紧随后两个字节 `66 90`là biên dịch viên 添加的`nop`Không lệnh hoạt động, để làm `total`Từ `0x40`Đây là 16 chữ giới hạn bắt đầu.`st_size`Như điều kiện dừng lại của máy tính phản hồi, bài học 36 sẽ ngăn chặn các phần này trước khi kết quả của so sánh tái xây dựng.

## 重定位:零字节 nghĩa là gì

`Elf64_Rela`占 24 字节 ((gABI 图 4-23):`r_offset``r_info`Và có biểu tượng `r_addend`, hình thức`<QQq` Quý vị lại ghi chép mô tả liên kết cần sửa chữa vị trí và cách tính toán.`r_info`- Có thể là:`ELF64_R_SYM(i)`Vì vậy`i >> 32`- Tôi không biết.`ELF64_R_TYPE(i)`Vì vậy`i & 0xffffffff` Trong các tài liệu định vị có thể,`r_offset`          `sh_info`Các định vị trong các phần được xác định.`S`là giá trị biểu tượng,`A`là số,`P`là vị trí được sửa chữa,`L`                                                                                                                                                                                                                                                              `R_X86_64_64`Vì vậy`S + A`- Tôi không biết.`R_X86_64_PC32`Vì vậy`S + A - P`- Tôi không biết.`R_X86_64_PLT32`Vì vậy`L + A - P`

-O1 目标文件有八条记录:

```text
  .rela.text       0x36 R_X86_64_PC32          .rodata+0x10
  .rela.text       0x84 R_X86_64_PC32          .rodata+0x24
  .rela.text       0x93 R_X86_64_PC32          .rodata-0x4
  .rela.rodata      0x0 R_X86_64_PC32          .rodata.str1.1
  .rela.rodata      0x4 R_X86_64_PC32          .L.str.1+0x4
  .rela.rodata      0x8 R_X86_64_PC32          .L.str.2+0x8
  .rela.rodata      0xc R_X86_64_PC32          .L.str.3+0xc
  .rela.rodata     0x10 R_X86_64_PC32          .L.str.4+0x10
```

拆解第一条记录──偏移 `0x36`位于 `grade`Trong, hậu người phạm vi`0x10`至 `0x3e``0x33`处的指示是 处的指示是`48 8d 0d 00 00 00 00`, tức tính toán RIP 相对地址 的`lea`,其四字节位移位于 `0x36`❖ Bộ xử lý sẽ được chuyển thêm vào địa chỉ của lệnh `0x3a`Ước gì

编译器希望结果为 `.rodata + 0x14`, có một cái chứa 5 giá trị 32 điểm .`1, 2, 3, 4, 4`                                                                                                                                                                                                                                                              `(.rodata + 0x14) - 0x3a`△公式`S + A - P`Trong `P = 0x36`时得到 `.rodata + A - 0x36`令两者相等可得 `A = 0x14 - 4 = 0x10` Số lượng bao gồm mục tiêu chuyển động giảm chuyển động  4  giữa các đoạn và các đoạn kết lệnh 

Đây là biểu tượng biểu hiện của tiếng clang trong -O1 下编译 `grade`Trung `switch`Cách: 代码通过乘以`0x66666667`和两次移位计算 `score / 10`, giảm lại 6 ≠ 4 so sánh, sau đó chỉ mục cho biểu tượng này. -O1 ELF  mục tiêu không có biểu tượng được giữ lại cho biểu tượng này; trích dẫn là biểu tượng节 `.rodata`Thêm vào một số cộng, chỉ có một nguồn mã arm64 xây dựng nó được đặt tên `l_switch.table.grade` 第二条记录位于 `grade_label`của `0x84`, hướng tới`.rodata + 0x28`处第二张由 8 字节值组成的表──第三条位于 `0x93`, hướng tới`.rodata + 0x0`,即 `labels.rel`Đáng lẽ là...

五条 `.rela.rodata` ghi chép đầy `labels.rel` Mỗi条目 nằm ở vị trí chuyển động`4i`, thêm số nữa `4i`, vì vậy `S + A - P`化简为字符串地址减去表基址。`grade_label`用 `movslq`读取条目,再加回表基址,就得到指针.`.rodata.str1.1`, cộng số là 0, bởi vì字符串 `F`Từ phần thứ nhất của chương bắt đầu.`.L.str.1`至 `.L.str.4`, chúng là một bộ biên dịch .`D``C``B``A`生成的局部标签──

Đồng nguồn mã trong ba loại tối ưu hóa cấp dưới sẽ biên dịch ra ba loại biểu tượng khác nhau. Không sử dụng chống汇编器, máy đọc cũng có thể thể hiện sự khác biệt:

| 构建 | `labels` 的位置 | `grade` 如何选择 | `grade_label` 如何到达 `grade` |
|---|---|---|---|
| -O0 | `.data`，五个 8 字节指针，五条 `R_X86_64_64` 记录 | `.rodata` 中的跳转表：五条指向 `.text` 的 `R_X86_64_PC32` 记录 | 带有 `R_X86_64_PLT32 grade-0x4` 的调用 |
| -O1 | `.rodata` 中的 `labels.rel`，五个 32 位相对条目 | `.rodata+0x14` 处的值表，一条 `R_X86_64_PC32` | 已内联，没有调用 |
| -O2 | 与 -O1 相同 | 与 -O1 相同 | 已内联，`total` 增长到 140 字节 |

Trong -O0 下,`switch`Đó là một biểu tượng nhảy thật sự, 5条目分别指回 `.text`Trung `+0x91``+0x8c``+0x87``+0x82`和 `+0x86` đối với `grade`                                                                                                                                                                                                                                                              `-0x4`+ số, nguyên nhân và`lea`Trong -O1 dưới, máy tối ưu hóa phát hiện ra mỗi phân支 đều trở lại với lượng thường, do đó sử dụng kết quả biểu đồ thay đổi nhảy.

## 程序头: tải máy's视图

可重定位目标文件没有程序头,因此 `e_phnum`Vì vậy, các tập tin có thể thực hiện và chia sẻ mục tiêu tập tin có chứa các chương trình đầu, tải người chỉ đọc thông tin này.`Elf64_Phdr`占 56 字节 ((gABI 图 5-1):`p_type``p_flags``p_offset``p_vaddr``p_paddr``p_filesz``p_memsz``p_align`, hình thức`<IIQQQQQQ`◊GABI 为 `PT_LOAD`条目规定三条规则:按 `p_vaddr`升序排列;`p_memsz`- Tốt hơn.`p_filesz`                                                                                                                                                                                                                                                              `p_vaddr`Với`p_offset`Đối với`p_align`取模同余──

Mỗi mục tiêu của bộ phim này là các chương trình mà bạn tự xây dựng, và máy Mac này không thể làm được.`ledger.o`生成 Linux 可执行文件的链接器.`tiny-x86_64`Từ`code/fixtures/build_tiny_elf.py`, nó dùng `struct.pack`写出 736 字节.文件包含 ELF 文件头,两个程序头,36 字节.`_start`、3 字节的 字节 của 字节 của 字节 của 字节 của 字节 字节 của 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字`.rodata`、 biểu tượng và 6 phần`_start`向文件描述符 1 写入 `ok\n`, sau đó với mã trạng thái 42 退出. Nó có thể chạy trên Linux x86-64; ở đây, nó là kiểm tra các trình điều hành đầu đường.

```text
Program headers:
  PT_LOAD          r-x offset=0x0 vaddr=0x400000 filesz=0x2e0 memsz=0x2e0 align=0x1000
  PT_GNU_STACK     rw- offset=0x0 vaddr=0x0 filesz=0x0 memsz=0x0 align=0x10

entry 0x4000b0 is file offset 0xb0 through PT_LOAD
```

唯一的`PT_LOAD`Để toàn bộ 736 字节文件映射到`0x400000`△读取器 tìm thấy chứa một địa điểm `PT_LOAD`, tái tính toán`p_offset + (address - p_vaddr)`,即可将地址映射为文件偏移──入口点的计算是 `0 + (0x4000b0 - 0x400000) = 0xb0`, đúng là`.text`Đáng lẽ là...

Đó là sự thật.`address_to_file_offset`背后的计算──对 Ghidra 目标,该工具返回 `{address, file_offset}`Húp  cung cấp  trả lại  trả lại `provider_file_offset`和 `image_base_file_offset` Công cụ cần một bản sao đầy đủ của tài liệu gốc, và bản sao của SHA-256 phải phù hợp với mục tiêu.`inspect_binary_layout`Trong tài liệu cũng có một câu đáng nhớ:  liên kết không phải là địa chỉ vận hành.

程序头也解释为什么在剥离信息后的可执行文件仍然可以运行.`e_shoff`Các công cụ của các phần sẽ không nhìn thấy bất kỳ nội dung nào, và bộ tải từ lâu không phụ thuộc vào các phần này.

## Mach-O 中的对应概念

Apple không phát hành bản văn bản của Mach-O.`EXTERNAL_HEADERS/mach-o/loader.h``nlist.h`和 `reloc.h`具 `ledger-arm64-O1.o`Từ cùng một `ledger.c`Sử dụng `clang -target arm64-apple-macos -O1 -fno-asynchronous-unwind-tables -c`构建:

`mach_header_64`占 32 字节:`magic``cputype``cpusubtype``filetype``ncmds``sizeofcmds``flags``reserved`✿ ✿ ✿`0xfeedfacf`,即 `MH_MAGIC_64``cputype`Vì vậy`0x0100000c`,即 `CPU_TYPE_ARM64``filetype`为 1,即 `MH_OBJECT``ncmds`5,`sizeofcmds`Nên 616: tải lệnh chiếm tài liệu đầu sau 616 字节, mỗi条 lệnh đều là `{cmd, cmdsize}`开始──标志 `0x2000`Vì vậy`MH_SUBSECTIONS_VIA_SYMBOLS`

```text
Load commands:
  0 LC_SEGMENT_64                cmdsize=472 at 0x20
  1 LC_BUILD_VERSION             cmdsize=24 at 0x1f8
  2 LC_LINKER_OPTIMIZATION_HINT  cmdsize=16 at 0x210
  3 LC_SYMTAB                    cmdsize=24 at 0x220
  4 LC_DYSYMTAB                  cmdsize=80 at 0x238
```

`LC_SEGMENT_64`(0x19) đối ứng ELF 的两张表――其`segment_command_64`包含 `segname``vmaddr``vmsize``fileoff``filesize``maxprot``initprot``nsects`和 `flags`                                                                                                                                                                                                                                                              `nsects`条 `section_64`记录,每条 80 字节。`loader.h` Về `MH_OBJECT`Những đoạn này nằm trong một đoạn không có tên trong một đoạn.`fileoff`- 648 người.`filesize`456, bao gồm 5 phần.

```text
  Idx Section                    Addr   Size Offset Reloff Nreloc Type
    1 __TEXT,__text               0x0   0xd0    648   1104      6 S_REGULAR
    2 __DATA,__const             0xd0   0x28    856   1152      5 S_REGULAR
    3 __TEXT,__cstring           0xf8    0xa    896      0      0 S_CSTRING_LITERALS
    4 __TEXT,__const            0x108   0x40    912      0      0 S_REGULAR
    5 __LD,__compact_unwind     0x148   0x80    976   1192      4 S_REGULAR
```

Mỗi phần qua`segname`指明所属段, vì vậy hai tên gọi là`__const`                                                                                                                                                                                                                                                              `__DATA,__const`, một người khác là `__TEXT,__const` Đổi lại`reloff`和 `nreloc`按节存放;ELF 则为每目标节设置单独 `.rela.X`节──

Mỗi 条`relocation_info`- 8 chữ cái, đầu tiên là có chữ cái.`r_address`, sau đó là một đoạn 32 chữ cái,打包为 `r_symbolnum`(24 位)`r_pcrel`(1 位)`r_length`(2 位)`r_extern`(1 位) và `r_type`(4 位) 六条`__text`记录是三对 `ARM64_RELOC_PAGE21`Với`ARM64_RELOC_PAGEOFF12`, mỗi lần trích dẫn đối tác một đối tác.`adrp`加 `add`实现了 x86-64 一条 `lea`n hiệu ứng, do đó mỗi lần trích dẫn đều cần hai bài ghi lại.`__DATA,__const`记录为 `ARM64_RELOC_UNSIGNED`- Tôi không biết.`r_length`Vì vậy, mỗi bài sửa đổi một 8 字节 tuyệt đối chỉ số.

Trong O1 dưới, arm64  xây dựng sẽ `labels`Bảo tồn cho chỉ số thông thường, trong khi x86-64 cấu trúc tạo ra biểu tượng tương đối.

`LC_SYMTAB`(0x2) chứa`symoff`1240`nsyms`17`stroff`1512`strsize`176.1512 cộng 176 等于文件大小 1688── mỗi `nlist_64`占 16 字节:`n_strx``n_type``n_sect``n_desc``n_value``n_type`Là vùng lãnh thổ.`N_TYPE`(掩码 `0x0e`) bằng với `N_SECT`(`0xe`),表示符号定义在序号为 `n_sect`Trong 1 phần, 1 số từ 1 开始.`N_EXT`(`0x01`) 标记外部符号――

`nlist_64`Không có một đoạn văn nhỏ.`_percent_change`字节,读取器使用同一节中下一个符号的地址,即位于 `0x18`của `_grade`                                                                                                                                                                                                                                                              `_`, vì vậy hàm名为`_percent_change`

`LC_DYSYMTAB`(0xb) ghi lại với ELF`sh_info`Các quy tắc ưu tiên của địa phương:`ilocalsym`0`nlocalsym`13`iextdefsym`13`nextdefsym`4 `LC_BUILD_VERSION`(0x32) 以打包的`XXXX.YY.ZZ`整数记录 `platform`1(macOS)`minos`26.0 và`sdk`26.2  vì lệnh này, arm64 具 phải được gửi dưới dạng字节; trong Mac sử dụng SDK khác trên cấu trúc sẽ tạo ra các tài liệu khác 

读取器的 读取器的`compare_formats`sẽ hai file并排 so sánh:

| 概念 | ELF，`ledger-x86_64-O1.o` | Mach-O，`ledger-arm64-O1.o` |
|---|---|---|
| 文件标识 | `e_ident` `7f 45 4c 46`，类别 64，数据 LSB | `magic` `0xfeedfacf` |
| 机器架构 | `e_machine` 62，`EM_X86_64` | `cputype` `0x100000c`，`CPU_TYPE_ARM64` |
| 文件种类 | `e_type` 1，`ET_REL` | `filetype` 1，`MH_OBJECT` |
| 表的位置 | `e_shoff` `0x428`，11 个节头 | 5 条加载命令，位于文件头后的 616 字节 |
| 代码 | `.text` 位于 `0x40`，大小 `0x9f`，标志 `AX` | 无名段内的 `__TEXT,__text` 位于 648，大小 `0xd0` |
| 符号名称 | `.symtab`（第 10 节），通过 `sh_link` 1 在 `.strtab` 中查找名称 | `LC_SYMTAB` 的 `symoff` 1240、`nsyms` 17，名称位于 `stroff` 1512 |
| 符号大小 | `st_size`：`percent_change` 为 16 字节 | 没有对应字段：下一符号减去当前符号，得到 24 字节 |
| 重定位 | `.rela.text`，3 条记录，`R_X86_64_PC32` | `__text` 的 `reloff` 1104，6 条记录，`PAGE21` 与 `PAGEOFF12` |
| 函数字节 | `percent_change`：`0x40` 处的 16 字节 | `_percent_change`：`0x288` 处的 24 字节 |

thực  thông qua `inspect_macho`读取 Mach-O,该工具经由 `xcrun`运行 `otool -h -l``nm -gjU``dyld_info -imports -exports`和 `dwarfdump --uuid`                                                                                                                                                                                                                                                              `otool -l`输出 tương tự `symoff`和 `stroff` vùng của `open_binary`工具通过魔数识别 ELF、MZ、PE,以及单架构或通用Mach-O, cũng sẽ tự đọc chuyển biến 18 处的 `e_machine`Đó chính là những gì bạn đã thực hiện ở đây.`format: raw-binary`、 cấu trúc và địa chỉ nhập cảnh.`0xcafebabe`时也这样处理――

## tự xây dựng

运行 chỉ sử dụng standard库的读取器:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch
python3 code/main.py
```

演示读取 `ledger-x86_64-O1.o`,输出文件头、节、符号、重定位和文件偏移映射; sau đó输出四函数的字节串,读取 `ledger-arm64-O1.o`Không xuất bản bảng so sánh; cuối cùng xuất bản`tiny-x86_64`Các quy trình đầu tiên:

```text
percent_change: 16 bytes at file offset 0x40: 85 ff 74 09 29 fe 6b c6 64 99 f7 ff c3 31 c0 c3
grade: 46 bytes at file offset 0x50: 48 63 c7 48 69 c0 67 66 66 66 ...
entry 0x4000b0 is file offset 0xb0 through PT_LOAD
```

传入路径可读单个文件:`python3 code/main.py code/fixtures/ledger-x86_64-O0.o`△读取器根据前四字节选择 ELF 或 Mach-O──

按以下顺序阅读 `code/main.py`- Có thể là:

1. `ElfFile._read_header()`检查魔数、类别、字节序和条目大小, sau đó giải包文件头──
2. `ElfFile._read_sections()`Với`read_cstring()`读取节头表,并通过 `e_shstrndx`解析名称。
3. `ElfFile._read_symbols()`拆分 `st_info`, qua `sh_link`解析名称,并保持保留节索引可读。
4. `ElfFile._read_relocations()`遍历 mỗi `SHT_RELA`节, tách ra `r_info`,并依据表 4.9 为类型命名──
5. `ElfFile.function_span()`Với`function_bytes()`Để chuyển đổi mã thành phạm vi của các file và các chữ trong đó.
6. `ElfFile.file_offset_map()`按偏移排序每个结构,并补入未使用空间──
7. `ElfFile._read_program_headers()`Với`address_to_file_offset()`处理可执行文件──
8. `MachOFile`读取文件头, tải lệnh, chứa phần`LC_SEGMENT_64``LC_SYMTAB``LC_BUILD_VERSION`, và mỗi phần được định vị lại.
9. `compare_formats()`Sử dụng giá trị được đọc từ hai tài liệu để thể hiện quan hệ đối phó cùng một khái niệm.

## Sử dụng nó

Trong các bài học tiếp theo, trước tiên sẽ có bài học của mình.`code`目录加入 `sys.path`, qua lại `from main import ElfFile`导入读取器──第 33 课会请求 `function_bytes`和 `relocations_for(".text")` Chương 35 课将其输出记录为观察证.

Sử dụng cùng nhau `clang -target x86_64-unknown-linux-gnu -c`Chỉ có thể thêm các tên định vị lại được trong bảng 4.9 của PSABI. Chỉ có các loại phần trong các mục tiêu của các tài liệu được thêm vào trong bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của các bảng 4.9 của bảng 4.9 của bảng 4.9 của bảng 4.9 của bảng 4.9 của bảng 4.9 của bảng 4.9 của bảng 4.9 của bảng 4.9 của bảng 4.9 của bảng 4.9 của bảng 4.9 của bảng 4.

## 交互实验

### 实验 A: 手动读取文件头

Trong `code`目录中启动 Python:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch/code
python3 -q
```

运行:

```python
import struct
from main import ElfFile, FIXTURES
data = (FIXTURES / "ledger-x86_64-O1.o").read_bytes()
data[:4], data[4], data[5]
struct.unpack_from("<HHIQQQIHHHHHH", data, 16)
elf = ElfFile(data)
elf.header.e_shoff, elf.header.e_shnum, elf.sections[elf.header.e_shstrndx].name
```

Bộ chỉ thị`e_type`1`e_machine`62`e_shoff`1064, tức là`0x428`                                                                                                                                                                                                                                                              `.strtab`存储节名称。

### 实验 B:switch 背后的值表

```python
rodata = elf.section_bytes(elf.section(".rodata"))
[int.from_bytes(rodata[i : i + 4], "little") for i in range(0x14, 0x28, 4)]
[int.from_bytes(rodata[i : i + 8], "little") for i in range(0x28, 0x50, 8)]
[r for r in elf.relocations_for(".text") if r.symbol == ".rodata"]
```

两张表都读出 `1, 2, 3, 4, 4`对照 `ledger.c`检查:`grade(65)`计算 `65 / 10 - 6 = 0`,读取条目 0, nhận được 1,即 `case 6`≈ giá trị`grade(100)`读取条目 4, nhận được 4,即 `case 10`Với`case 9`Giá trị dùng chung

### 实验 C: 3 cấu trúc cùng nguồn

```python
for level in ("O0", "O1", "O2"):
    obj = ElfFile.from_path(FIXTURES / f"ledger-x86_64-{level}.o")
    print(level, [s.name for s in obj.sections if s.name in (".data", ".rodata")])
    print(level, sorted({r.type_name for r in obj.relocations}))
    print(level, {s.name: s.st_size for s in obj.symbols if s.type == "FUNC"})
```

- Có những tài liệu mục tiêu`.data`节和三种重定位类型──-O1 与 -O2  mục tiêu không có `.data`, và chỉ có một loại.`total`Trong -O0 下为 66 字节,-O1 下为 31 字节,-O2 下为 140 字节――

### 实验 D:Mach-O 中的相同函数

```python
from main import MachOFile
macho = MachOFile.from_path(FIXTURES / "ledger-arm64-O1.o")
[(c.name, c.cmdsize) for c in macho.load_commands]
macho.function_span("_percent_change")
macho.function_bytes("_percent_change")[:4].hex()
```

函数范围为文件偏移 648 处的 24 字节──前四字节是 `a0000034`,即指令 `0x340000a0`Trong hình thức nhỏ,`llvm-objdump -d`Để xuất khẩu`cbz w0, 0x14` Đó là `before == 0`n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n`85 ff 74 09`Chuyện kiểm tra giống nhau.

## 实践实验

扩展读取器,使其支持已链接程序. trên Linux x86-64 机器,运行 `clang -O1 -shared -fPIC code/fixtures/ledger.c -o libledger.so`, và thêm vào `main`后运行 `clang -O1 code/fixtures/ledger.c -o ledger_main`, và sau đó sử dụng máy đọc để phân tích hai tệp này.

要求:

- dùng cùng nhau`Elf64_Sym`布局读取 `.dynsym`Vì`SHT_DYNSYM`Vì vậy, các hồ sơ của bạn không thay đổi.
- sẽ`.dynamic`读取为由 `d_tag`和 `d_val`组成 của `Elf64_Dyn`记录,并依据 gABIDynamic Section页面命名 `DT_NEEDED``DT_STRTAB``DT_SYMTAB``DT_RELA`和 `DT_JMPREL`
- sẽ`st_shndx`Vì vậy`SHN_UNDEF`                                                                                                                                                                                                                                                              `.rela.plt`Trung `R_X86_64_JUMP_SLOT`记录列为到达它们调用位置.
- Theo một mục tiêu tập tin gABI  bao gồm một hoặc nhiều phần của quy tắc, sẽ mỗi `PT_LOAD`段映射到其含的节点──
- 用 `address_to_file_offset` chứng minh, chia sẻ mục tiêu trong các tài liệu trong mỗi hàm được xác định`function_bytes`Đổi lại của cùng một giá trị.
- Tới hai tài liệu.`llvm-objdump -h -t -r -p`和 `llvm-objdump -T`文本采集到 `code/fixtures/`, và trong test với máy đọc

Kiểm chuẩn thành công: nhập danh sách, phân đoạn lập trình và mỗi hàm đều phù hợp với các công cụ thu thập, và không chạy trong thời gian thử nghiệm.

## 评分实验

5 cách về các bài học này. Sử dụng mã xây dựng của bạn để tìm ra mỗi câu trả lời, sau đó viết vào.`code/lab_answers.json`◊ số viết thành số, hoặc viết thành `"0x40"`Như vậy, các chuỗi được tạo thành các chuỗi JSON.

1. `t1`:ledger-x86_64-O1.o 的 e_shoff,写成数字──
2. `t2`:ledger-x86_64-O1.o Trung phần trăm_chang của st_size。
3. `t3`:ledger-x86_64-O1.o 中 .text 的文件偏移,写成十六进制──
4. `t4`:ledger-x86_64-O0.o 中的重定位类型名,排序后写成列表──
5. `t5`:ledger-x86_64-O1.o 中 .rodata+0x14 处的五个 int 值,写成列表──

检查你的答案:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch
python3 code/lab.py
```

检查器在已提交的固定 上使用 `code/main.py`计算每个期望值── nó cho mỗi bài toán输出 `PASS``FAIL`Hoặc`TODO`Và tất cả, chỉ có 5 câu hỏi được thông qua khi chỉ có 0  xuất phát.`python3 code/lab.py my-answers.json`可检查另一个文件.`code/tests/test_lab.py`证明检查器 chấp nhận đúng câu trả lời并拒绝错误答案──

### Xem nó hoạt động

[Inside a Decompiler](https://aiengineeringfromscratch.com/inside-a-decompiler)机器把本课作为它的前两个工位来运行.`percent_change`Mục tiêu của tài liệu đầu, thùng mở`.text`并读取这个符号──关闭 Các biểu tượng, bạn có thể xem những sự thật được cung cấp bởi biểu tượng──

## 本课产物

本课产 出 `outputs/skill-program-anatomy-elf-from-scratch.md` Có thể sử dụng nó cho Claude,Cursor,Codex,OpenClaw,Hermes hoặc bất kỳ một phần nào của SKILL.md.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

测试套件验证:

- Trong ba tập tin mục tiêu x86-64 và các tập tin nhỏ có thể thực hiện, mỗi phần chỉ dẫn, tên, kích thước, địa chỉ và các loại và thu thập`llvm-objdump -h`文本一致
- Giá trị của mỗi biểu tượng, ràng buộc, loại, thuộc về, kích thước và tên đều được thu thập.`llvm-objdump -t`文本一致
- Mỗi chuyển hướng định vị, kiểu tên, biểu tượng và số lượng đều được thu thập.`llvm-objdump -r`文本一致, bao gồm -O0 下的 `R_X86_64_PLT32`和 `R_X86_64_64`
- `tiny-x86_64`Hai thủ tục đầu tiên là thu thập.`llvm-objdump -p`文本一致,而目标文件没有程序头
- `percent_change`位于文件偏移 `0x40`,长度 16 字节,字节 phù hợp với dự kiến, và mỗi hàm đều nằm ở `.text`Trong
- 文件偏移映射恰好覆盖每个件的每个字节一次,且 -O1 目标文件的三个对齐空隙位置正确
- `tiny-x86_64`Địa điểm nhập cảnh qua`PT_LOAD`映射到文件偏移 `0xb0`, và có thể định vị lại mục tiêu file từ chối địa chỉ映射
- Mach-O 文件头, mỗi lệnh tải, đoạn, 5 đoạn,`LC_SYMTAB`和 `LC_BUILD_VERSION`Thành phố và thu thập `--private-headers`文本一致
- Chữ Mach-O với 15 条重定位都与采集的`llvm-objdump`文本一致,且 `_percent_change`位于偏移 648,长度 24 字节
- 错误魔数、32 位类别、大端文件、截断表、通用二进制文件和C 源文件都会触发`FormatError`
- `build_tiny_elf.py`逐字节复现已提交的 `tiny-x86_64`
- 图示模块 `site/figures-re-32.js`包含 `ledger-x86_64-O1.o`                                                                                                                                                                                                                                                              

## Mô hình thất bại trong môi trường sản xuất

| 失败 | 不严谨的读取会报告什么 | 读取器必须证明什么 |
|---|---|---|
| 将 `st_value` 当成文件偏移 | “`percent_change` 在 0 处” | 偏移为 `sh_offset + st_value - sh_addr`，这里是 `0x40` |
| 将填充计为代码 | “`grade` 有 48 字节” | `st_size` 为 46，之后的 `66 90` 不属于任何符号 |
| 从错误的表读取节名称 | 乱码名称或异常 | `e_shstrndx` 指定名称表，这里是第 1 节 |
| 对 `SHT_NOBITS` 盲目信任 `sh_size` | 读到文件末尾之外 | `.bss` 不占文件字节，映射应跳过它 |
| 将零字节读成操作数 | “`lea 0(%rip)`” | `0x36` 处的 `.rela.text` 记录指定 `.rodata+0x10` |
| 将加数读成目标偏移 | “表从 `0x10` 开始” | `S + A - P` 结合指令末尾得到 `0x14` |
| 对剥离信息的可执行文件遍历节 | “文件没有代码” | `PT_LOAD` 映射加载器使用的每个地址 |
| 将链接地址视为运行时地址 | 随机基址下得到错误偏移 | 从 `PT_LOAD` 得到的文件偏移才是稳定坐标 |
| 只按 `sectname` 查找 Mach-O 节 | 两个 `__const` 节被合并成一个 | 名称应为 `segname,sectname` |
| 期待 `nlist_64` 有大小字段 | 异常或零字节 | 同一节内的下一个符号标记函数终点 |
| 将通用二进制文件当成单一 Mach-O 读取 | “未知魔数 `0xcafebabe`” | 拒绝读取，并要求提供单架构切片 |
| 在另一台 Mac 上重建 arm64 目标文件 | “夹具变了” | `LC_BUILD_VERSION` 记录 SDK，因此已提交的字节才是夹具 |

## 操作准则

读取可信的文件头,沿其偏移定位结构,并根据定义字段的规范为每个字段命名. 读取可信的文件头,沿其偏移定位结构,并根据定义字段的规范为每个字段命名. 读取可信的文件头,将根据定义字段的规范为每个字段命名. 读取可信的文件头,并根据定义字段的规范为每个字段命名. 读取可信的文件头,并根据定义字段的规范为每个字段命名. 读取可信的文件头,并根据定义字段的规范为每个字段命名. 读取可信的文件头,并根据定义字段的规范为每个字段命名. 读取可信的文件头,并根据定义字段的规范为每个字段的规范,并根据规范的规范为每节的规范,只能按按一节核对读器,才是后续每节的可靠基础.

## 延伸阅读

- [System V gABI, 第 4 章：目标文件](https://www.sco.com/developers/gabi/latest/ch4.intro.html)Với [ELF Header](https://www.sco.com/developers/gabi/latest/ch4.eheader.html)- [Sections](https://www.sco.com/developers/gabi/latest/ch4.sheader.html)- [Symbol Table](https://www.sco.com/developers/gabi/latest/ch4.symtab.html), với[Relocation](https://www.sco.com/developers/gabi/latest/ch4.reloc.html)页面
- [System V gABI, 第 5 章：程序头](https://www.sco.com/developers/gabi/latest/ch5.pheader.html)Với[Dynamic Linking](https://www.sco.com/developers/gabi/latest/ch5.dynamic.html)
- [System V ABI, AMD64 Architecture Processor Supplement](https://gitlab.com/x86-psABIs/x86-64-ABI), Bảng 4.9: loại định vị lại
- [Apple XNU `loader.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/loader.h)- [`nlist.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/nlist.h), với[`reloc.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/reloc.h)
- [17 U.S.C. 1201](https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title17-section1201&num=0&edition=prelim)Với[Directive 2009/24/EC](https://eur-lex.europa.eu/eli/dir/2009/24/oj/eng)
- [Sega v. Accolade, 977 F.2d 1510](https://law.resource.org/pub/us/case/reporter/F2/977/977.F2d.1510.92-15655.html)Với[Sony v. Connectix, 203 F.3d 596](https://law.resource.org/pub/us/case/reporter/F3/203/203.F3d.596.99-15852.html)
- [rea 6.5.0 `docs/binary-diagnostics.md`](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/binary-diagnostics.md)Với[`docs/ghidra-provider.md`](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/ghidra-provider.md)
