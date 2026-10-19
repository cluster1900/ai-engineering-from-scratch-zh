# 链接、加载与剥离符号后的二进制:PLT、GOT、导入、修正与函数识别

> 链接后程序将调用本身不包含的函数――本课读取链接器为这些调用写入三种格式表,沿着一次调用追踪到载器填充的槽位,然后在构建产品名称消失后找回其中的函数――

**Type:** Build
**Languages:** Python, C, x86-64 和 arm64 汇编
**Prerequisites:** Phase 13 · 32（从零理解 ELF）、33（反汇编与控制流）、38（调用约定）
**Time:** ~160 分钟

## Học mục tiêu

- 根据重定位记录和符号表,判断链接器将其处理为固定距离,带GOT 槽位的PLT条条,还是动态重定位──
- 读取位置无关 ELF 可执行文件的动态节、PLT 和 GOT,并使用 psABI 公式沿沿一调穿穿这些结构──
- 读取 COFF 目标文件(20 字节文件头、40 字节节表项、18 字节符号记录、10 字节重定位记录) cũng như PE32+ 映像的导入、导出和基址重定位目录──
- 逐字解码 Mach-O 链式修改链,并将每个字与 `dyld_info`Để xem.
- Nói rõ trong mỗi kiểu`strip`删除什么,保留什么,并运行剥离后程序证明 nó vẫn có thể hoạt động.
- 用 `LC_FUNCTION_STARTS`、序言扫描和调用目标恢复已剥离 arm64 构建产品函数起点,对照未剥离副本的符号表给每种方法评分,并使用FLIRT 式签名为函数命名──

## 问题

Bạn sẽ`main.c`Với`libledger.dylib`链接,并问一个代理:`main`Trong `0x1000005a0`调用了哪个函数──agent 反汇编该命令,读到 `bl 0x100000694`                                                                                                                                                                                                                                                              `adrp x16``ldr x16, [x16, #0x38]``br x16`◊ đại lý 沿载操作追踪到 `0x100004038`, đọc đến 8 chữ cái `00 00 00 00 00 00 10 80`, báo cáo tiến trình thông qua một chỉ số bị hư hỏng đã được điều chỉnh trong không gian hạt nhân.

Sau đó, bạn tách ra các sản phẩm cấu trúc tĩnh của cùng một quy trình, và hỏi có bao nhiêu trong số đó là chức năng.`nm`, chỉ thấy một cái tên `__mh_execute_header`, là trả lời một .

Hai câu trả lời đều đưa các tài liệu như là một quá trình đang chạy để đọc.`0x100004038`处的字是链式修正──第 63 位表示绑定,十二位表示下一个修正的位置,低位表示要绑定哪个导入──dyld 在 `main`运行前将该字替换为 `_puts`Địa chỉ của nó. Các tài liệu sau khi bị cướp mất biểu tượng, nhưng vẫn còn.`LC_FUNCTION_STARTS`, sau đây sử dụng 9 chữ cái để liệt kê tất cả 5 hàm bắt đầu.

Bài học này sử dụng Python  chuẩn xây dựng năm máy đọc: dùng cho các COFF  đọc của các tệp mục tiêu của chúng ta, cũng như đọc nhập, xuất và đặt địa điểm tái định vị danh mục PE32 +  đọc; đọc tải lệnh 、 gián tiếp biểu tượng 链式修改链和导出字典树的Mach-O 读器,并与`dyld_info`逐字核对;读取动态节、PLT 和 GOT's ELF 读取器,加上预测这些目标文件经 PIE 链接会生成什么的规划器; sử dụng bốn phương pháp tìm kiếm các hàm trong cấu trúc đã bị tách rời、并为各方法评分的函数查找器;以及 FLIRT 式签名构建器, sẽ định vị lại các phần cấu trúc được thiết lập để chia sẻ,并计算尾部的CRC16──

本机只能链接 Mach-O.arm64 可执行文件和dylib 已完成链接、符号剥离并实际运行──ELF 和 COFF 目标文件在这里使用 `clang -target`编译;由于没有安装 ELF或PE 链接器,这两种形式的已链接视频由固定 文件中的两个Python脚本按规范逐字节写出.`llvm-objdump`Và các chương trình tìm kiếm đều có thể đọc chúng. Chúng không hoạt động, văn bản đã nói rõ về điều này.

```figure
re-40-call-through-three-formats
```

## 链接器 làm thế nào để xử lý định vị lại

第32 课读取重定位记录, 第33 课将`S + A - P`应用于一条 `lea`✿ Một条记录指定位置 `P`、 loại 符号 `S`Và số`A`◊x86-64 psABI Bảng 4.9 cho mỗi loại cho ra một công thức, trong đó `L`为符号的PLT 条目位置,`G`Vì nó đã di chuyển,`GOT`Vì địa điểm của mình,`B`Vì video của tải về.

链接器将值写入字段,记录随之消失──针对输入中已定义符号的 `R_X86_64_PC32`属于这种情况――无论地址如何, khoảng cách giữa hai字节 trong cùng một hình ảnh đều không thay đổi――

链接器 tạo một PLT 条目 và một GOT 槽位── nhắm vào các hàm chưa được xác định `R_X86_64_PLT32` thuộc tình huống này.`L + A - P`, tức là đến mục đích khoảng cách.`.rela.plt`Trung `R_X86_64_JUMP_SLOT`记录通知动态链接器填充该槽位──

链接器为载器保留一个重定位──`R_X86_64_64`Đó là 8 chữ số tuyệt đối địa chỉ, và vị trí không liên quan đến các tài liệu thực hiện cho đến khi tải lên chỉ biết địa chỉ của mình.`.rela.dyn`Trung `R_X86_64_RELATIVE`,公式为 `B + A`

`main-x86_64-O1.o`Có 18 条 ghi chép:`.text`Trung 14 条`.data.rel.ro`Trung 2 条`.rodata`Trung 2 条。`code/main.py`Trung `plan_dynamic_link()`Các quy tắc được nêu trên sẽ được áp dụng cho các hồ sơ này và`ledger-x86_64-O1.o`- Có thể là:

| 记录 | 数量 | 决策 | 原因 |
|---|---|---|---|
| 指向 `.rodata`、`.L.str`、`fns`、`.rodata` 中表的 `R_X86_64_PC32` | 16 | 原地处理 | 符号在输入中已定义 |
| 指向 `percent_change`、`grade`、`total`、`grade_label` 的 `R_X86_64_PLT32` | 4 | 直接调用，不使用 PLT | 在 `ledger-x86_64-O1.o` 中已定义，因此链接器将 PLT32 化简为 PC32 |
| 两次指向 `puts`、两次指向 `printf` 的 `R_X86_64_PLT32` | 4 | PLT 条目和 GOT 槽位 | 未定义，由共享库提供 |
| 指向 `fns[]` 中 `grade` 的 `R_X86_64_64` | 2 | `R_X86_64_RELATIVE` | PIE 中的绝对地址字段 |

两个导入产生 48 字节的 `.plt`(PLT0 cộng lên hai 16 字节条目) 、40 字节的 `.got.plt`(các vị trí lưu giữ cộng với hai vị trí lưu giữ) và 48 字节的`.rela.plt`◊ Hai hồ sơ định vị trọng lượng tương đối tạo ra 48 字节 `.rela.dyn`Những con số này được đưa ra từ các quy tắc được áp dụng cho các tài liệu của chúng tôi.`tiny-dyn-x86_64`Đối với hai nhập khẩu tương tự đã thực hiện phần PLT trong kế hoạch này, kích thước của nó phù hợp với kế hoạch.

Từ Binutils 2.31(H.J. Lu,2018-02-13) và LLVM 7.0.0(D43383,2018-02-20) bắt đầu, biên dịch viên đối với mỗi lần调用都写入 `PLT32`,不论目标已定义与否―― quyết định quyền trong các liên kết.`PLT32`Chỉ chỉ cho biết một lần调用, không thể nói rõ liệu có PLT 条目. Trong các cấu trúc khác cũng sẽ xuất hiện hai loại.`R_X86_64_GOTPCRELX`和 `R_X86_64_REX_GOTPCRELX`(`G + GOT + A - P`) yêu cầu không mang PLT của GOT 槽位, đây là `-fno-plt`产生的形式;符号为本地符号时,链接器可能将其松为直接的 `lea`Hoặc`call`(psABI 附录 B)`R_X86_64_32`和 `R_X86_64_32S`Không thể dung dung dung địa chỉ trong PIE, sẽ dẫn đến sự thất bại của liên kết.

## 动态节、PLT và GOT

GABI Chương 5 chỉ ra, tham gia động thái liên kết của có thể thực hiện tài liệu có một`PT_INTERP`程序头, nó phải nằm trước tất cả các đoạn tải; cũng có một phủ sóng `.dynamic`节 của `PT_DYNAMIC`✿ ✿ ✿`Elf64_Dyn`2 nhóm số, mỗi nhóm chứa các biểu tượng nhãn và giá trị,`DT_NULL`Kết thúc.

`tiny-dyn-x86_64`bởi`build_tiny_dyn_elf.py`按 gABI 和 psABI 写出,共 5,184 字节──它的动态节在 `0x1000`处包含十二二元组:

| 标签 | 编号 | 值 | 含义 |
|---|---|---|---|
| `DT_NEEDED` | 1 | `libc.so.6` | 字符串表偏移 `0xb`，指定要加载的库 |
| `DT_HASH` | 4 | `0x1a0` | SysV 哈希表 |
| `DT_STRTAB` | 5 | `0x188` | `.dynstr` |
| `DT_SYMTAB` | 6 | `0x140` | `.dynsym`，每条目 24 字节 |
| `DT_STRSZ` | 10 | `0x15` | 21 字节的字符串 |
| `DT_SYMENT` | 11 | `0x18` | 24 |
| `DT_PLTGOT` | 3 | `0x10c0` | `.got.plt` |
| `DT_PLTRELSZ` | 2 | `0x30` | 两条 24 字节记录 |
| `DT_PLTREL` | 20 | 7 | 记录类型为 `DT_RELA` |
| `DT_JMPREL` | 23 | `0x1b8` | `.rela.plt` |
| `DT_FLAGS_1` | `0x6ffffffb` | `0x08000000` | `DF_1_PIE`，GNU 标签 |
| `DT_NULL` | 0 | 0 | 结束 |

GABI  giải thích đã làm gì `DT_JMPREL`Chia: Nó chỉ lưu lại các mục đích định vị liên quan đến các trình liên kết.`DT_FLAGS`Trung `DF_BIND_NOW``DT_FLAGS_1`Trung `DF_1_NOW`Hoặc trong môi trường`LD_BIND_NOW`会关闭延迟绑定,使动态链接器在启动处理这些条目.

### PLT0 và đặt

Phương pháp này được đưa ra trong đoạn 5.2 trong hình 5.2:

```text
     1f0: ff 35 d2 0e 00 00    pushq  0xed2(%rip)      # 0x10c8 = GOT+8
     1f6: ff 25 d4 0e 00 00    jmpq   *0xed4(%rip)     # 0x10d0 = GOT+16
     1fc: 0f 1f 40 00          nopl   (%rax)

     200: ff 25 d2 0e 00 00    jmpq   *0xed2(%rip)     # 0x10d8 = GOT+24, the slot for puts
     206: 68 00 00 00 00       pushq  $0x0             # index 0 into DT_JMPREL
     20b: e9 e0 ff ff ff       jmp    0x1f0            # PLT0
```

亲手计算一次──RIP 相对位移后一条命令为基准──`0x1f6 + 0xed2 = 0x10c8`,即 `.got.plt + 8``0x1fc + 0xed4 = 0x10d0`,即 `.got.plt + 16``0x206 + 0xed2 = 0x10d8`, đó là 4th slot.`0x210 - 0x20 = 0x1f0`, tức PLT0── mỗi条目 đều là 16 字节, vì vậy `exit`条目 từ `0x210`开始,将 `$0x1` 入,并读取 `0x10e0`

GOT 保留三个槽位──psABI 5.2 规定:第零个条目保存 `_DYNAMIC`Địa chỉ, và  toàn bộ các mục trong bảng chuyển động 1 và 2 cũng được giữ lại.`.got.plt`内容为 `0x1000, 0, 0, 0x206, 0x216`✿glibc 加载文件时,将自己的 ✿`struct link_map`填入槽位一,将 `_dl_runtime_resolve`填入槽位二──文件中的槽位三保存 `0x206`,即 `puts@plt`内部的 `pushq`psABI  chỉ ra,该槽位最初......保存紧随其后的推q 指令的地址──

Vì vậy, lần đầu tiên调用执行`call 0x200`- Tôi không biết.`jmpq *0x10d8`落到 `pushq $0`- Tôi không biết.`jmp 0x1f0`使 GOT+8 入并经 GOT+16 跳入解析器;解析器读取 `DT_JMPREL`                                                                                                                                                                                                                                                              `R_X86_64_JUMP_SLOT puts`, trong `libc.so.6`中查找 `puts`,将其地址写入 `0x10d8`, sau đó nhảy chuyển qua.`call``jmpq *0x10d8`Vì vậy, ngoại trừ lần đầu tiên, tất cả các cuộc gọi được sử dụng chỉ có một lần gián tiếp nhảy.`%r11`脚注 giải thích một trong các lựa chọn寄存器 trong bài học 38: nó là寄存器 tạm thời, vì vậy mã trong PLT không cần phải tràn ra để lưu giữ bất kỳ寄存器 nào.

`.text`Trung `0x227`处的调用点字节为 `e8 d4 ff ff ff`, và `0x22c - 0x2c = 0x200``llvm-objdump`Để in nó cho`callq 0x200 <puts@plt>`,并根据 `.rela.plt`记录为条目命名,`plt_entries()`Cũng dùng cách gọi như vậy.

### Không có gì trong tài liệu

Tài liệu không có`PT_GNU_RELRO` Jacob Jelinek 于 2004-01-06 在二维码邮件列表中提出RELRO: sẽ chỉ chuyển phần viết trong thời gian định vị lại cho phần viết được mở, để động thái liên kết sau đó có thể sử dụng `mprotect`Để đặt nó chỉ để đọc.`.init_array``.fini_array``.data.rel.ro``.dynamic`和 `.got`放入其中, nhưng đối với `.got.plt`, chỉ có 3 chỗ lưu giữ trong 24 phần để vào, vì phần còn lại sẽ bị trì hoãn.`-z now`设置 `DF_BIND_NOW`,并将 toàn bộ `.got.plt` Đưa vào đó, hình thành RELRO hoàn chỉnh, vì sau khi khởi động không còn xảy ra `_dl_protect_relro`Đối với trang đối với phạm vi调用 `mprotect(start, end - start, PROT_READ)``-fno-plt`Trong biên dịch hơn nữa:调用经由 `jmpq *name@GOTPCREL(%rip)`, không thể trì hoãn được, GCC 手册称 Tất cả các biểu tượng bên ngoài đều đang được tải lên

Các tài liệu cũng không có phiên bản.`libc.so.6`会添加 `.gnu.version`, mỗi người `.dynsym`条目对应一个 `Elfxx_Half`; còn sẽ thêm `.gnu.version_r`, mỗi người trong số họ đối phó với một .`Verneed`, mỗi phiên bản tên đối ứng một bài `Vernaux`记录──`printf@GLIBC_2.2.5`Ý nghĩa là:`printf`Trong `.gnu.version`中的条目保存一个索引;`vna_other`Như vậy là chỉ số của `Vernaux`của `vna_name`Vì GLIBC_2.2.5, thuộc về`vn_file`Vì vậy, chúng tôi đã có thể làm điều đó.`Verneed`△索引 0 表示本地,1 表示全局,第 15 位(`VERSYM_HIDDEN``0x8000`(Let the linker look not till some version)

哈希表是SysV `DT_HASH`, bao gồm một cái thùng và một cái ba chuỗi, có 24 chữ cái.`DT_HASH`Hoặc`DT_GNU_HASH`Để tìm các mã trong tài liệu. Tài liệu này không xuất ra bất kỳ nội dung nào, cũng không hoạt động trong đó, do đó chưa được xác minh liệu glibc có chấp nhận đơn buồng biểu.

### .dynsym、.symtab với dải

GABI sẽ `.dynsym`和 `.dynstr`规定 cho phân phối内存的节,将 `.symtab`和 `.strtab`规定为不分配内存的节──动态链接器读取前一对,从不读取后一对──Drepper nói: biểu tượng thông thường không được sử dụng khi chạy, do đó không cần phải tách nó ra khỏi hệ thống thứ hai── nó không ảnh hưởng đến hiệu suất──

GNU `strip --strip-all`删除 `.symtab``.strtab``.debug_*`和 `.comment` Tất cả các phân bổ内存 của các phần sẽ được giữ lại:`.interp``.dynsym``.dynstr``.gnu.hash``.gnu.version*``.rela.dyn``.rela.plt``.plt``.text``.rodata``.eh_frame``.init_array``.dynamic``.got``.got.plt``.data``.bss`Và lưu ý:`--strip-section-headers`(các mục 2.41) hoặc运行 `llvm-strip --strip-sections``--strip-debug`Bảo tồn符号.`--only-keep-debug`写出调试文件, sau đó có thể sử dụng `--add-gnu-debuglink`Trong các tài liệu sau khi chia tay, ông đã trích dẫn nó và`.gnu_debuglink`中保存 CRC32;`ld --build-id`写入 `.note.gnu.build-id`, easy to调试器匹配二者──

## COFF 目标文件

`clang -target x86_64-pc-windows-msvc -O1 -fno-asynchronous-unwind-tables -c`sinh thành`main-x86_64.obj`和 `ledger-x86_64.obj` PE Format 页面 định nghĩa mục tiêu này: 20 字节文件头, không có lựa chọn,节表每项 40 字节,符号表每条记录 18 字节, mỗi节重定位记录为 10 字节.

`code/main.py`Trung `CoffObject`读取这四部分──文件头给出机器类型 `0x8664`、10 个节、37 条符号记录, cũng như vì 0 `SizeOfOptionalHeader`│ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │`.text``.data``.bss`、六名为 六个名为`.rdata``/16``/`开头的名称是字符串表中的十进制偏移,字符串表以自身的四字节大小字段开头;`/16`解析为 `.llvm_addrsig`, cũng vậy`llvm-objdump -h`打印的名称──

37 条记录包含辅助记录──节符号(存储类别 3)带有一条辅助记录,保存节长度、重定位数、校验和及COMDAT 选择策略──五个`.rdata`节的选择值为 2,即any,每个都以MSVC修饰后的名称保存一个字符串字面量:`??_C@_04JDDJEAHN@even?$AA@`Đó là một chuỗi, thậm chí là một chuỗi.`.file`,辅助记录为main.c。`llvm-objdump -t`Để in chúng cho `[ 0]``AUX scnlen ...``[ 2]`等, nhảy qua chỉ số ghi chép hỗ trợ; test会 sẽ so sánh chỉ số của chúng tôi với tên của mình với bài viết này.

重定位 bao gồm:`.text`中 14 条 `IMAGE_REL_AMD64_REL32`, và`.rdata`中 4 条 `IMAGE_REL_AMD64_ADDR64``REL32` Đối với vị trí tái định vị, 32 vị trí địa chỉ của phần đó ──`-4`của `R_X86_64_PC32`:ELF 记录携带加数 `-4`Vì ghi lại có thêm số đoạn, còn ghi lại COFF không có.`ledger-x86_64.obj`Trong `0x36``0x84`和 `0x93`Có 3 bài`REL32`,第 32 课的`ledger-x86_64-O1.o`  `R_X86_64_PC32`Cũng ở cùng 3 vị trí chuyển đổi. Mã giống nhau, sự khác biệt về hình dạng chỉ nằm ở cái 4 này được viết ở đâu.`ADDR64`                                                                                                                                                                                                                                                              `labels`, trong đoạn phim biến đổi thành địa điểm tái định vị, như `R_X86_64_64`变为 `R_X86_64_RELATIVE`Như vậy.

| | ELF `Elf64_Rela` | COFF 重定位 | Mach-O `relocation_info` |
|---|---|---|---|
| 记录大小 | 24 字节 | 10 字节 | 8 字节 |
| 字段 | 偏移、`r_info` 中的类型与符号、加数 | 偏移、符号索引、类型 | 地址，随后为含 symbolnum:24、pcrel:1、length:2、extern:1、type:4 的 32 位字 |
| 加数 | 显式给出 | 无，存于被修正字段内 | 无，或在真正记录之前有一条 `ARM64_RELOC_ADDEND` 记录 |
| 对 `puts` 的调用 | `R_X86_64_PLT32 puts-0x4` | `IMAGE_REL_AMD64_REL32 puts` | `ARM64_RELOC_BRANCH26 _puts` |

## PE 映像:导入,导出与基址重定位

`tiny-x86_64.exe`bởi`build_tiny_pe.py`写出,共 2,560 字节──它 giống như nhiệm vụ của Micro ELF:调用 `msvcrt.dll`Trung `puts`和 `exit`Nó cũng xuất hiện một cái tên, và mang theo một địa điểm đặt lại, do đó, các danh mục cần thiết cho bài học này là đầy đủ.`pefile`2024.8.26 và `llvm-objdump -p`Thành phố có thể đọc nó, cả hai đều bắt và đưa ra các bài kiểm tra.

逐步浏览头部──MS-DOS 以`MZ`        `0x3c`处保存 `e_lfanew`, giá trị`0x40``0x40`处是签名 `PE\0\0`                                                                                                                                                                                                                                                              `0x8664`4 个节`SizeOfOptionalHeader`240  Chất tính`0x22`(可执行映像、支持大地址) ⋅可选头以`Magic`字段开头, giá trị为 `0x20b`, biểu thị PE32+。`AddressOfEntryPoint`Vì vậy`0x1000`- Tôi không biết.`ImageBase`Vì vậy`0x140000000`- Tôi không biết.`SectionAlignment`Vì vậy`0x1000`- Tôi không biết.`FileAlignment`Vì vậy`0x200`- Tôi không biết.`SizeOfImage`Vì vậy`0x5000`- Tôi không biết.`Subsystem`Vì 3( kiểm soát)`DllCharacteristics`của `0x8160`解码为 `HIGH_ENTROPY_VA 0x0020``DYNAMIC_BASE 0x0040``NX_COMPAT 0x0100`和 `TERMINAL_SERVER_AWARE 0x8000`Sau đó là 16 danh mục dữ liệu được tạo thành bởi RVA và các nhóm lớn.`0x2080`、大小 `0x4d`,导入目录 nằm ở `0x2000`、大小 `0x28`,基址重定位目录 nằm ở `0x4000`、大小 `0xc`,IAT 位于`0x2040`、大小 `0x18`

Địa chỉ trong hình ảnh là RVA, tức là chuyển hướng của địa điểm tải về.`.text`RVA của `0x1000`, trong tài liệu `0x200`-`.rdata`RVA của `0x2000`, nằm trong`0x400`-`.data`RVA của `0x3000`, nằm trong`0x600`-`.reloc`RVA của `0x4000`, nằm trong`0x800``PeImage.rva_to_offset()`实现的就是此表――

### 导入目录

RVA `0x2000`处由 20字节导入描述符组成、以全零描述符终止的数组──我们的数组只有一个:导入查找表`0x2028`、 thời gian 、 chuyển发链 、名称 `0x2068`、导入地址表 `0x2040`△名称 RVA 指向 msvcrt.dll──查找表保存 64 位条目,以零结束。第 63 位置位表示按序号导入,序号位于第 15 至 0 位。第 63 位清零表示第 30 至 0 位是提示/名称 条目的 RVA:先是16 位提示值,即导出名称指针表中的索引,然后是ASCII 名称。我们的条目为`0x2058`(提示值 0,puts) và `0x2060`(提示值 0,exit)

规范指出,IAT 在视频绑定之前,与导入查找表的内容完全相同.`0x2040`của IAT 保存同样两个RVA,测试验证 `0x2028`处的24字节等于 `0x2040`处的 24 字节──绑定期间,导入地址表的条目会被导入符号的 32 位(PE32) 或 64 位(PE32+)地址覆盖──Windows 加载器在入口点运行前完成此事──这里没有延迟绑定,也没有──代码直接访问槽位:

```text
    100b: ff 15 2f 10 00 00    call qword ptr [rip + 0x102f]   # 0x1011 + 0x102f = 0x2040, the IAT slot of puts
    1013: ff 15 2f 10 00 00    call qword ptr [rip + 0x102f]   # 0x1019 + 0x102f = 0x2048, the IAT slot of exit
```

`FF /2`là gần调用. Các chữ cái của hai lệnh này giống nhau, vì thứ hai nằm sau cái trước.`iat_calls()`Trong phần code trong quá trình quét`ff 15`,加上六和位移,再依据导入目录为槽位命名──

### 导出目录

RVA `0x2080`处是 40 字节导出目录表:标志、时间、版本、指向tiny-x86_64.exe的名称 RVA、序号基数 1、1个地址表条目、1个名称指针──随后有三张表──`0x20a8`处的导出地址表保存一个RVA `0x1000``0x20ac`处的导出名称指针表保存一个指向字符串tiny_entry的 RVA──`0x20b0`处的导出序号表保存一个16位未加基数的索引 0──名称 `k`映射到地址条目 `ordinals[k]`,导出序号为 `ordinals[k] + ordinal base` quy tắc cũng bổ sung một điều chúng ta không sử dụng: Nếu địa chỉ chỉ mục đích hướng dẫn ra bên trong, nó là một chuyển phát字符串, ví dụ `MYDLL.expfunc`;名称指针表则按字典序排列,以支持二分查找──

### 基址重定位

`.reloc`保存多块──每块以页面 RVA 和块大小开头,随后是16位条目,高四位为类型,低十二位为页面内偏移──我们的唯一块包含:页面 `0x3000`、大小 12 条目 `0xa000`、 loại 10, tức là `IMAGE_REL_BASED_DIR64`、 chuyển 0 và một loại 0 của việc điền `IMAGE_REL_BASED_ABSOLUTE`│RVA`0x3000`处的八字节保存 `0x1400020d0`,即映像基址加上字符串链接手的 RVA。 Nếu tải sẽ video được đưa đến vị trí khác, nó sẽ đưa giá trị差差基址加到该字段。规范说明:映像文件不包含 COFF重定位......映像以 .reloc 节中的基址重定位形式包含重定位信息(除非映像具有IMAGE_FILE_RELOCS_STRIPPED 属性) 当前链接.exe 默认开启`/DYNAMICBASE`, vì vậy hình ảnh có`.reloc`和 `DYNAMIC_BASE`

PE 映像 không có biểu tượng có thể tách rời.`PointerToSymbolTable` Đối với hình ảnh nên là không, vì COFF 调试信息已弃用,名称存存于单独的PDB.`.pdata`, trong số đó `RUNTIME_FUNCTION`条 hướng ra khỏi mỗi phân bổ 空间 hoặc调用 các hàm của các hàm khác.

## Mach-O 映像: tải lệnh 与间接符号表

`ledger_main`là link sau của arm64 có thể thực hiện các tài liệu.`otool -h`打印 19 条加载命令和标志 `0x00200085``MH_NOUNDEFS 0x1``MH_DYLDLINK 0x4``MH_TWOLEVEL 0x80`和 `MH_PIE 0x200000`相加即得到该值──19 条命令包括四条 `LC_SEGMENT_64`(`__PAGEZERO``__TEXT``__DATA_CONST``__LINKEDIT`), 两条 `LC_LOAD_DYLIB`(先 `@rpath/libledger.dylib`,后 `/usr/lib/libSystem.B.dylib`), cũng như các bài`LC_DYLD_CHAINED_FIXUPS``LC_DYLD_EXPORTS_TRIE``LC_SYMTAB``LC_DYSYMTAB``LC_LOAD_DYLINKER``LC_UUID``LC_BUILD_VERSION``LC_SOURCE_VERSION``LC_MAIN``LC_RPATH``LC_FUNCTION_STARTS``LC_DATA_IN_CODE`和 `LC_CODE_SIGNATURE``MachoFile.command_names()`返回与 `otool -l`Danh sách tương tự và theo thứ tự phù hợp.

`__TEXT`Từ `0x100000000`开始──`__text`位于 `0x100000558`,长 256 字节, chỉ có `main`, vì bốn sổ cái hàm nằm trong dylib`__stubs`位于 `0x100000658`,长 84 字节, chứa bảy十二字节──`__DATA_CONST`Từ `0x100004000`开始,包含长 64 字节的 `__got`, trong đó có tám điểm hố vị trí , loại phần là`S_NON_LAZY_SYMBOL_POINTERS`; còn chứa长 32 字节的 `__const`,即 `main.c`của `fns[]`和 `names[]`- Bố

### 手工解析一个

`_puts`   `0x100000694`- Có thể là:

```text
    30 00 00 90    adrp x16, 0x100004000
    10 1e 40 f9    ldr  x16, [x16, #0x38]
    00 02 1f d6    br   x16
```

`0x90000030` `adrp`❖ Số lượng寄存器 ở vị trí thấp, giá trị là 16。`immlo`Trong số 30 đến 29 vị trí, giá trị là 0:`immhi`Trong số 23 đến 5, giá trị là 1 ∙ kết quả là `immhi << 2 | immlo = 4`, đơn vị là 4,096 字节 của trang, vì vậy mục tiêu trang là chỉ dẫn nơi trang `0x100000000`     `0x4000``0xf9401e10` `ldr`,带有按8 缩缩的无符号12位偏移:第21 至10位为7,乘8为`0x38`, Vì vậy tải `0x100004038``0xd61f0200` `br x16`ld64 源码中的 arm64 正是这个三指令 `StubAtom`

槽位 thuộc về cái tên, được quyết định bởi các biểu tượng间接.`LC_DYSYMTAB`Chỉ số 15 个符号表索引.`reserved1` chỉ ra điểm khởi đầu của mình trong đoạn chỉ dẫn, sử dụng `reserved2`指出每个大小(12);;指针节使用 `reserved1`, mỗi vị trí là 8 chữ.`__stubs`Từ索引 0 开始,`__got`Từ chỉ số 7  bắt đầu, vì vậy  5 映射到符号表条目 10,即 `_puts`- Tôi không biết.`__got`                                                                                                                                                                                                                                                              `otool -Iv`印这两段索引,`indirect_table()`复现其中每一行──

### 两级命名空间

`nm -m`打印 `(undefined) external _puts (from libSystem)`和 `(undefined) external _grade (from libledger)`Thông tin của bộ nhớ đến từ bản thân ký hiệu.`nlist.h`sẽ`GET_LIBRARY_ORDINAL(n_desc)`定义为 `n_desc`                                                                                                                                                                                                                                                              `LC_LOAD_DYLIB`, 2 đối với bài viết thứ hai,`0xfe`表示动态查找,`0xff`biểu hiện có thể thực hiện các tài liệu.`ld(1)`Nói: sử dụng -two_levelnamespace (từ 2_levelnamespace) khi, các liên kết chỉ tìm kiếm các mã trong các dylb được chỉ định trong lệnh,并 ghi lại chúng trong các dylb nào tìm thấy.`nm_lines()`Theo`n_type``n_sect``n_desc`和 `n_value`染十二条记录,测试将其输出和捕获的 `nm -m`逐行比较──用 `-Wl,-flat_namespace`重新链接, tái đọc `otool -h`, ngay khi thấy`MH_TWOLEVEL`位 biến mất.

## 逐字节理解链式修正

`LC_DYLD_CHAINED_FIXUPS` `linkedit_data_command`- Có thể là:`dataoff 0x8000``datasize 208` This 208 字节 `fixup-chains.h`

头部有七个32位字段:`fixups_version 0``starts_offset 32``imports_offset 80``symbols_offset 112``imports_count 8``imports_format 1`(`DYLD_CHAINED_IMPORT`)`symbols_format 0`(未压缩)`llvm-objdump --macho --chained-fixups`Bác in 7 giá trị này, thử so sánh chúng.

偏移 32 处是 `dyld_chained_starts_in_image`- Có thể là:`seg_count 4`Và bốn chuyển động, mỗi đoạn một, không sửa đổi đoạn lấy零.`__DATA_CONST`Có sửa chữa.`dyld_chained_starts_in_segment`内容为 `size 24``page_size 0x4000``pointer_format 6`(`DYLD_CHAINED_PTR_64_OFFSET`, mục tiêu là chuyển động bộ nhớ ảo)`segment_offset 0x4000``max_valid_pointer 0``page_count 1`, và một vì 0 `page_start``DYLD_CHAINED_PTR_START_NONE`,即 `0xffff`, cho biết trang này không được sửa đổi.

链从文件偏移 `0x4000 + 0`开始── mỗi 64 chữ cái mang theo hai thông tin:应在此写入什么,以及下一个字在哪里──

```text
  dyld_chained_ptr_64_bind    ordinal:24  addend:8  reserved:19  next:12  bind:1 = 1
  dyld_chained_ptr_64_rebase  target:36   high8:8   reserved:7   next:12  bind:1 = 0
```

读取第一个字`0x8010000000000000`❖第 63 位置位,表示绑定──`next`位于第 62 至 51 位, giá trị为 `0x002`, đơn vị là 4 字节, vì vậy Next một sửa đổi trong 8 字节 sau đó.`0x4058`处的第十二个字母  处的第十二个字母 `0x00000000000006db`△第 63 位清零,表示重设基址──`next`为 0, biểu thị kết thúc链.`0x6db`, đây là chuyển lưu trữ ảo, cộng lại hình ảnh.`0x100000000`后成为 `0x1000006db`,即 `__cstring`中的字符串odd──前一个字符 `0x00100000000006d6`则将 `names[0]`重设基址后指向even──

遍历访问十二个字:`__got`Trung số là 8 lần liên kết từ 0 đến 7,`__const`Trung序号为 0 的两次绑定(`fns[]`của hai mục tiêu đều hướng tới`_grade`), và `names[]`của hai cơ sở đặt lại:`chained_fixups()`Trả lại chúng và các tài liệu chuyển biến và chữ gốc, test将12对 `(offset, raw)`Với`dyld_info -fixup_chain_details`So sánh, cuối cùng đối với ấn đầu tiên`raw: 0x8010000000000000 bind: (next: 002, bindOrdinal: 0x000000)`

偏移 80 处的导入表有八个32位条目:`lib_ordinal:8``weak_import:1``name_offset:23`,名称位于偏移 112──序号 0 đến 3 là từ 库 1 `_grade``_grade_label``_percent_change``_total`, số 4 đến 7 là từ 2 của KUK`___stack_chk_fail``___stack_chk_guard``_printf``_puts``fixup_rows()`连接两张表,生成 `dyld_info -fixups`打印的行, ví dụ `__DATA_CONST __got 0x100004038 bind libSystem/_puts`;测试比较全部十二行──

Vì vậy,`0x100004038`处的损坏指针实际上是导入7――dld 在加载时穿过链一次,并将`_puts`Trong bài diễn văn của WWDC22 Apple giải thích như sau: trong 64 vị trí chỉ số trong dữ liệu, một số vị trí bao gồm chuyển hướng vị trí sửa đổi tiếp theo. Trong đó, cũng được gói một vị trí, để chỉ định sửa đổi này là bị ràng buộc hoặc được đặt lại.Xcode 13 sẽ đặt định dạng này để triển khai mục tiêu của macOS 12 hoặc iOS 15.`main`运行前完成绑定──

### Nó thay thế cấu trúc

`ledger_main_nochain`Sử dụng cùng một quá trình liên kết, nhưng thêm `-Wl,-no_fixup_chains` Nó được thay đổi `LC_DYLD_INFO_ONLY`, chứa bốn chữ cái 编码表:基址重设 8 chữ cái 绑定 72 chữ cái 延迟绑定 120 chữ cái 导出 64 chữ cái 编码表:基址重设 8 chữ cái 绑定 72 chữ cái 延迟绑定 120 chữ cái 导出 64 chữ cái 编码表:基址重设 8 chữ cái 绑定 72 chữ cái 延迟绑定 120 chữ cái 导出 64 chữ cái 编码表:基址重设 8 chữ cái 绑定 72 chữ cái 延迟绑定 120 chữ cái 导出 64 chữ cái 编码表:`__TEXT,__stub_helper`(108 字节) 、 chỉ 16 字节且保存 `___stack_chk_guard`Với`dyld_stub_binder`của `__got`, và`__DATA,__la_symbol_ptr`(56 字节,七个槽位)`dyld_info -fixups`列出七行 `lazy-bind`Và 7条基址重设, mỗi条都将一个延迟槽位指向它在`__stub_helper`Trong bản thân mình nhảy板──跳板将索引入并跳到 `dyld_stub_binder`,后者解析名称并写入槽位──这是前文 PLT 和 GOT 的Mach-O形态:`__la_symbol_ptr`Đối với`.got.plt`- Tôi không biết.`__stub_helper`Đối phó PLT0 và`pushq $index`- Tôi không biết.`dyld_stub_binder`Đối với`_dl_runtime_resolve``code/main.py`报告文件的偏移和节,但不解码绑定操作码; thực tế thực nghiệm yêu cầu hoàn thành phần này.

### 导出字典树

`LC_DYLD_EXPORTS_TRIE`là một cây trước ⋅ từng node trước là uleb128 编码的终端数据大小;若非零, tiếp theo là uleb128 标志和 uleb128 偏移; sau đó là một số các node của một字节; mỗi node chứa một string bên và một uleb128 节偏移──`exports_trie()`n khắp cây `libledger.dylib`, nó quay lại `_percent_change 0x410``_grade 0x428``_total 0x464``_grade_label 0x498`,即 `dyld_info -exports`4 chuyển động của bản in. Đối với các tệp có thể thực hiện, nó sẽ quay lại.`__mh_execute_header``_fns`和 `_main`

## strip 留下什么

Apple của `strip(1)`Nói rõ, đối với động thái liên kết có thể thực hiện các tài liệu không có tùy chọn khi hoạt động, hành vi của nó tương đương với `-u -r`: giữ giữ không xác định符号和动态引用的符号──`-x`删除本地符号──`-N`删除 toàn bộ biểu tượng và biểu tượng. Đối với động thái chia sẻ thư viện, cấp độ tách biệt lớn nhất thường là -x, vì quá trình liên kết động thái chỉ sử dụng biểu tượng toàn diện.

Chúng tôi đã quan sát trong các bài kiểm tra:`strip ledger_main`sẽ`LC_SYMTAB`Từ 12 条减为 10 条,并删除 `_main``_fns`和 `_names`◊ 8 个未定义导入保留下来, vì ld 需要它们的名称来绑定;`__mh_execute_header`Cũng giữ, vì nó là `REFERENCED_DYNAMICALLY`△第十条记录是一个类型为 `N_OPT`、名为 `radr://5614542`của dao,Apple 工具 viết vào nó để đảm bảo biểu tượng không bao giờ trống rỗng;`nm`Không in nó. Các chương trình sau khi bị tẩy ra in cùng 3 dòng với bản gốc, và được phát hành bằng 0  xuất bản.`LC_FUNCTION_STARTS` vẫn còn một điểm khởi đầu, tức là `main`

Không có lựa chọn `strip libledger.dylib`Hơn trong sổ tay thường `-x`Hơn nữa:`LC_SYMTAB`Có 1 ghi chép,`nm`印无符号──导出字典树仍在相同偏移处列出四个函数,因为 已过字典树绑定,从不过 已过字典树绑定,从不过 已过字典树绑定,从不过 已过字典树绑定,从不过 已过字典树绑定,从不过 已过字典树绑定,从不过 已过字典树绑定,从不过 已过字典树绑定,从不过 已过字典树绑定,从不过 已过字典树绑定,从不过 已过字典树`LC_SYMTAB``LC_FUNCTION_STARTS`Có 4 điểm khởi đầu.`main.c`Với các kết nối của sau khi cởi, để cho thấy các kết nối cũng phụ thuộc vào cây chữ cái này.

| 内容 | ELF 在 `--strip-all` 后 | PE 映像 | Mach-O 在 `strip` 后 |
|---|---|---|---|
| 静态符号表 | 删除 | 映像中从不存在 | 本地名称与已定义名称被删除，未定义导入保留 |
| 加载器绑定的名称 | `.dynsym` 和 `.dynstr` 保留 | 导入目录保留 | 导入保留在 `LC_SYMTAB` 和链式导入表中 |
| 导出的名称 | `.dynsym` 保留 | 导出目录保留 | 导出字典树保留 |
| 函数起点 | `.eh_frame` 的 FDE，除非构建时禁用了展开表 | 非叶函数的 `.pdata` | `LC_FUNCTION_STARTS` 保留 |
| 调试信息 | `.debug_*` 删除 | 位于 PDB，从不在映像中 | 位于 dSYM，从不在映像中 |
| 节头或加载命令头 | 除非使用 `--strip-section-headers`，否则保留 | 保留 | 保留 |

## 没有符号时查找 hàm

`static-arm64-O2`sẽ`main-arm64-O2.o`Với`ledger-arm64-O2.o`链接为一个可执行文件,`__text`Trong đó có 5 hàm.`nm -n`Ừm, tôi đã nói.`_main`位于 `0x100000500`(244 字节),`_percent_change`位于 `0x1000005f4`(24),`_grade`位于 `0x10000060c`(60),`_total`位于 `0x100000648`(248),`_grade_label`位于 `0x100000740`(72):`static-arm64-O2.stripped`của `__text`Trong không có `N_SECT`符号――`FunctionFinder`Trong việc vận hành trên bốn phương pháp,`score()`Để so sánh từng danh sách với thực tế.

### LC_FUNCTION_STARTS

Chỉ thị hướng tới`__LINKEDIT`Trung 九字节:`80 0a f4 01 18 3c f8 01 00`△格式是 uleb128 增量,第一个以 `__TEXT`Địa điểm:`80 0a`Vì vậy`0x500`, vì vậy điểm đầu tiên là`0x100000500``f4 01`Vì vậy`0xf4`, nhận được`0x1000005f4``18` Đưa ra `0x10000060c`- Tôi không biết.`3c` Đưa ra `0x100000648`- Tôi không biết.`f8 01` Đưa ra `0x100000740`- Tôi không biết.`00`Kết thúc danh sách.`-O0`和 `-O2`Sau đó là 5 báo cáo, và không có báo cáo sai.`strip`Không thay đổi nó. Ghidra trong hàm Mach-O khởi động.`dyld_info -function_starts`Bác in nó, sống sẽ cho nó lộ ra.`function_starts`

### 序言扫描

Ghidra của AARCH64  khởi điểm`fd 7b bf a9`开始,即 `stp x29, x30, [sp, #-0x10]!`Trong các tập tin của chúng tôi, nó chỉ được tìm thấy ở hai cấp độ tối ưu hóa chỉ có 0/5 clang được tạo ra trước.`sub sp, sp, #N`, tái sinh thành chuyển động đúng `stp x29, x30, [sp, #M]`, do đó chưa bao giờ xuất hiện hình thức chỉ dẫn trước.`sub sp, sp, #imm`Sử dụng ẩn码 `(word & 0xff0003ff) == 0xd10003ff`, trong mỗi hàm có  `-O0`Tôi có thể tìm được 5/5, còn trong `-O2`Tôi chỉ tìm thấy 1/5, vì `percent_change``grade``total`和 `grade_label`都是完全没有的叶函数──`percent_change`以 `cbz w0, ...`开始──序言扫描 phản ánh nội dung mà biên dịch viên chọn tạo, 第38 课已显示,很多时候编译器根本不生成序言──

Cả hai loại quét đều không có thông báo sai, vì quá trình rất nhỏ.`push rbp`                  `55`Đây là một kiểu chữ, sẽ được định nghĩa bên trong các lệnh khác; do đó, các file x86-64 của Ghidra sẽ được định nghĩa.`55 48 89 e5`Mô hình này là một hình thức`ret`Hoặc`nop`Như vậy, các mô hình đặt trước được đối tác, yêu cầu các mô hình đặt trước kết thúc một hàm trước.

### 调用目标

`__text`Trong mỗi người`bl`Đ chỉ hướng tới hàm khởi điểm, vì trình biên dịch sẽ không tạo ra mã C nhảy vào giữa hàm.`bl` 编码为`0x94000000`,带有有符号 26 位字偏移──`0x1000005a0`处的 `bl`字节为 `3d 00 00 94`- Có thể là:`0x3d`là 61,乘 4 là `0xf4`, vì vậy mục tiêu là`0x100000694` `ledger_main`Trung, đây là `_puts`Trong tình trạng tĩnh,`call_targets()`收集 `__text`内部的目标, bỏ rơi vào `__stubs`                                                                                                                                                                                                                                                              `LC_MAIN`Nhập vào, vì không có bất kỳ hàm调用 `main` Hai cấp độ tối ưu hóa đều tìm thấy 5/5──Nucleus(Andriesse、Slowinska、Bos,2017) dựa trên suy nghĩ này kiểm tra biên dịch viên tạo ra các hàm trong mã;Andriesse 等人 trong phép đo năm 2016 cho thấy, biên giới hàm là điểm khó khăn của phản汇编, so với chỉ thị biên giới khó khăn hơn。

## FLIRT 式签名

Hex-Rays mô tả FLIRT trong tài liệu như sau: mô hình là 32 chữ cái trước của hàm , trong đó tất cả các chữ cái có thể thay đổi đều được đánh dấu , các chữ cái có thể thay đổi được từ sửa đổi và trích dẫn bên ngoài, nằm trong mô hình; sau đó, chúng ta bắt đầu tính toán từ vị trí 33 字节 CRC16, cho đến khi gặp được thứ nhất có thể thay đổi 字节, và lưu giữ độ dài này.

`signatures_from_object()`Từ `ledger-arm64-O2.o`和 `main-arm64-O2.o` xây dựng loại chữ ký này, giống như FLAIR từ thư viện mục tiêu  xây dựng chữ ký như vậy.`relocation_info`记录覆盖一个四字节字,这些字节成为可变字节.`.pat`行布局依次为:模式、CRC 长度、CRC16、函数长度、`:0000`和名称,以及每个引用名称对应的`^offset name`- Có thể là:

```text
A00000342800004B890C8052087D091B000DC01AC0035FD6 00 0000 0018 :0000 _percent_change
E8CC8C52C8CCAC72087C289B09FD7FD308FD62930801090B081900511F110071 04 9AAF 003C :0000 _grade ^0000 l_switch.table.grade ^0001 l_switch.table.grade
E8CC8C52C8CCAC72087C289B09FD7FD308FD62930801090B081900511F110071 04 9AAF 0048 :0000 _grade_label ^0000 l_switch.table.grade_label ^0001 l_switch.table.grade_label ^0002 _labels ^0003 _labels
```

`_percent_change`长 24 字节, vì vậy mô hình là toàn bộ hàm, CRC 长度为 0。`_grade`长 60 字节,第一个重定位在字节 36, do đó CRC 覆盖四个字节──CRC16 使用公开 `.pat`解析器中的算法:多项式 `0x8408`, giá trị đầu tiên`0xffff`,取反,再交换两个字节──ASCII 字符串123456789的结果为 `0x6e90`,测试 sẽ cố định giá trị này

`match_signatures()`Trong mỗi hàm đã được tách ra xây dựng bắt đầu thử mỗi chữ ký, trước phù hợp mô hình, tái phù hợp CRC.`-O0`下,五函数都恢复名称,没有冲突.`-O2`Nên, hai đường trên xảy ra xung đột.`grade_label`Nên vào`grade`, do đó hai hàm chia sẻ trước 36 chữ cái và bốn chữ cái CRC.`0x10000060c`和 `0x100000740`Thành phố sẽ phân biệt chúng: 字节 44 处,`_grade` `20`- Tôi không biết.`_grade_label` `28`,分别对应 `ldr w0, [x9, w8, uxtw #2]`Với`ldr x8, [x9, w8, uxtw #3]`, độ dài phân biệt là 60 và 72;; báo cáo ghi lại hai cuộc xung đột và các định nghĩa định nghĩa;; hai cấp độ tối ưu hóa đều thành công được đặt tên là 5/5;;

测试 `test_object_bytes_equal_linked_bytes_outside_relocated_words`检查这个假设: tất cả các字节 không thể thay đổi của mỗi hàm mục tiêu, đều bằng với các字节 của các file có thể thực hiện được liên kết cùng một vị trí, do đó, các thiết bị liên kết chỉ sửa đổi các字符 tái định vị.`_total`Không có định vị, cũng hoàn toàn không có biến đổi.

### 工具如何运用同样思路

IDA Pro 9.4  kèm theo các bộ xử lý FLIRT  chữ ký, cũng như sử dụng để xây dựng chữ ký `sigmake`工具;IDA Free 仅支持 x86 和 x86-64,限非商业使用――Lumina là một máy chủ có hàm md5 để lưu trữ dữ liệu hàm quan trọng, sẽ nhảy qua hàm 32 字节.Ghidra 12.1.4(Apache-2.0) có hàm ID: hỗ trợ ghi chép và tìm kiếm mô hình tính toán hash hoàn chỉnh, làm cho nó  có thể chống lại các thay đổi gây ra liên kết; còn có thêm hàm số thường của hàm hash, theo chỉ thị đánh giá, sử dụng hàm phụ tử để phá trục; bộ dữ liệu phụ tùng của nó chỉ bao gồm Visual Studio Library, bạn có thể tự sạc từ các bộ dữ liệu tự xây dựng riêng của mình.`zg``z/``zb`),并用 `zfs`读取 FLIRT `.sig`文件;rizin 0.9.1(LGPL-3.0)  dùng`Fc`Từ mở ra hệ thống tạo ra`.pat`Hoặc`.sig`, dùng`Fs`应用签名──

IDA và Binary Ninja là một công cụ nguồn đóng, trong đó có giới thiệu dựa trên tài liệu của nó.`clang``ld``llvm-objdump``otool``nm``strip`和 `dyld_info`, cũng như thông qua các chương trình phát hiện hoạt động LIEF 1.0.0 │các công cụ 0.33 và hồ sơ 2024.8.26 │LIEF đã đọc tất cả các định dạng trong đây, bao gồm cả COFF  mục tiêu tài liệu được hỗ trợ từ 0.17.0 ; nó đối với `ledger_main`报告十次绑定和两次基址重设,即同样十二次修正──pytools 只读取 ELF文件──profile 以`PEFormatError: 'DOS Header magic not found.'`n từ chối `main-x86_64.obj`, nhưng thành công trong việc đọc hình ảnh nhỏ.

## 亲手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries
python3 code/main.py
```

输出 là một báo cáo JSON có 5 phần.`elf`保存 2 mục tiêu file số lượng định vị lại,`tiny-dyn-x86_64`∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙          ∙      ∙   ∙         ∙              ∙      ∙                                                                                                                                                                                                          `coff`保存两个目标文件的节、重定位、函数和未定义名称──`pe`保存 `tiny-x86_64.exe`                                                                                                                                                                                                                                                              `macho`保存 `ledger_main`、链式修改、修行和导出,`ledger_main_nochain`Trong khi đó, các nhà nghiên cứu đã có nhiều nghiên cứu về các vấn đề khác nhau.`identification`保存 `-O0`和 `-O2`Các phương pháp thực tế của các phân tích, cũng như các chữ ký và xung đột.

预期结构:

```json
{
  "elf": {"linkPlan": {"pltSymbols": ["puts", "printf"], "sizes": {".plt": 48, ".got.plt": 40, ".rela.plt": 48, ".rela.dyn": 48}, "...": "..."}, "tiny-dyn-x86_64": {"...": "..."}},
  "coff": {"main-x86_64.obj": {"...": "..."}},
  "pe": {"imports": [{"dll": "msvcrt.dll", "iat": "0x2040", "...": "..."}], "...": "..."},
  "macho": {"ledger_main": {"flags": "0x200085", "fixupRows": ["__DATA_CONST __got 0x100004000 bind libledger/_grade", "..."], "...": "..."}, "strip": {"...": "..."}},
  "identification": {"O2": {"methods": {"functionStarts": {"recall": "5/5"}, "prologueSub": {"recall": "1/5"}, "...": "..."}, "correctNames": 5}}
}
```

按以下顺序阅读 `code/main.py`- Có thể là:

1. `ElfFile`读取头部节 两张符号表和重定位,`dynamic_entries()``jump_slots()``plt_entries()`和 `plt0()`读取已链接映像──
2. `plan_dynamic_link()`Các bài viết 4.9 và 5.2 được áp dụng cho hồ sơ định vị lại của các tệp mục tiêu có thể định vị lại.
3. `CoffObject`读取文件头、节表、带辅助记录的18字节符号记录,以及10字节重定位记录──
4. `PeImage`读取 MS-DOS 、PE 签名、可选头、数据目录、节, cũng như nhập khẩu, xuất khẩu và tái định vị danh mục địa điểm,`iat_calls()`解码 `ff 15`
5. `MachoFile`读取加载命令 段`nlist`记录、间接符号表、、链式修改、导出字典树和目标文件重定位──
6. `FunctionFinder`运行四种起点搜找机,`score()`Để so sánh từng kết quả với thực tế cơ sở.
7. `signatures_from_object()`和 `match_signatures()`构建并应用 FLIRT 式签名──
8. `parse_*`函数读取捕获的工具文本,供测试对照──

更多命令:`python3 code/main.py elf FILE``coff FILE``pe FILE`和 `macho FILE`Mỗi bản in một báo cáo.`python3 code/main.py plan OBJECT...`打印任意一组 ELF 目标文件的链接规划──`python3 code/main.py functions STRIPPED UNSTRIPPED OBJECT...`Trong các sản phẩm xây dựng khác của riêng bạn cho các công cụ tìm kiếm và đánh giá chữ ký.

##  thực tế sử dụng

Đối với các chương trình bạn xây dựng, theo thứ tự sau đây sử dụng máy đọc.

1. 读取头部, xác định định hình thức và loại: 可重定位目标文件、可执行文件或共享库──读取器会拒绝不认识的内容,这种拒绝本身也是信息──
2. 列出导入及其提供者:使用 `DT_NEEDED`和 `.dynsym`、 nhập mục, hoặc chuỗi nhập khẩu biểu đồ`LC_LOAD_DYLIB`❖ Mỗi lần sử dụng tên trong danh sách này đều sẽ rời khỏi hình ảnh hiện tại.
3. 手工沿着一次调用追到它的槽位──记下调用字节、或PLT字节、槽位地址、文件中的字,以及载器在那里写的内容──如果文件中的字看似垃圾数据,在下结论前先将其作为修改来解码──
4. Để so sánh biểu tượng với xuất và hàm bắt đầu điểm.`strip`后保留, chỉ调试器需要的名称则不会.说明缺失名称原本属于哪一组.
5. Trong khi đã được tách khỏi cấu trúc trên hoạt động tìm kiếm có thể sử dụng,并利用未剥离副本还在时对照它评分.`LC_FUNCTION_STARTS``.pdata`Hoặc`.eh_frame`, thay vì kiểu chữ,并用调用目标填补空缺──
6. Từ tài liệu mục tiêu của riêng mình xây dựng và áp dụng chữ ký. ghi lại từng cuộc xung đột và phân biệt các phần của nó. Nếu hai chữ ký đều tuyên bố một cái tên phù hợp, trước khi quyết định, kết quả đó nên được xem là không rõ.

Để giữ lại văn bản và tài liệu của các công cụ được bắt giữ, hãy giữ lại các công cụ khi các biến đổi, vì sự thay đổi trong các loại sản phẩm cũng có nghĩa là các biến đổi trong các thiết bị thử nghiệm.

## 交互实验

### 实验 A: 手工分析 PLT

Trong `code`目录中启动 Python:

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries/code
python3 -q
```

运行:

```python
from main import *
elf = load_elf("tiny-dyn-x86_64")
[(e.tag_name, e.text) for e in elf.dynamic_entries()]
elf.plt0()
[(e.symbol, hex(e.address), hex(e.slot), hex(e.slot_initial)) for e in elf.plt_entries()]
[hex(w) for w in elf.got_plt_words()]
```

Trước mỗi lần dùng, trước tiên dựa trên các chữ trên tính toán câu trả lời.`build_tiny_dyn_elf.py`Trung `IMPORTS`改为三个名称, tái cấu trúc,并在读取之前预测 `.plt``.got.plt`和 `.rela.plt`Ước gì có thể làm gì?

### 实验 B: một chuỗi sửa đổi

```python
exe = load_macho("ledger_main")
stub = next(s for s in exe.stubs() if s.symbol == "_puts")
stub.lines()
raw = int.from_bytes(exe.read(stub.slot, 8), "little")
hex(raw), raw >> 63, (raw >> 51) & 0xfff, raw & 0xffffff
[(i.index, i.name, i.library) for i in exe.chained_fixups()["imports"]]
```

Trước trên giấy giải mã buộc chữ:绑定位,以四字节为单位`next`字段、序号──然后读取八字节后的字,确认它是下一个修正──再读取链中位于 `0x100004058`Từ cuối cùng, giải thích tại sao nó `next`Vì vậy,

### 实验 C:剥离与重新链接

Trong các thiết bị hiện tại, sẽ có một chương trình mới với hoàn toàn thoát khỏi:

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries/code/fixtures
clang -target arm64-apple-macos -O1 main.c -L. -lledger.stripped -Wl,-rpath,@executable_path -o /tmp/relinked
nm /tmp/relinked | grep ' U '
dyld_info -exports libledger.stripped.dylib
```

Ngay cả khi `LC_SYMTAB`为空,链接 vẫn có thể thành công, vì链接器读取导出字典树──然后运行 `python3 ../main.py macho libledger.stripped.dylib`, so sánh`symtab``exports`和 `functionStarts` tiếp tục sử dụng `-N`剥离静态构建,看看 `dyld_info -function_starts`仍会打印什么.

### 实验 D: Konflikt

```python
from main import *
stripped = load_macho("static-arm64-O2.stripped")
sigs = signatures_from_object(load_macho("ledger-arm64-O2.o"))
[s.pat_line() for s in sigs]
starts = FunctionFinder(stripped).function_starts()
match_signatures(sigs, stripped, starts)
```

阅读两条冲突记录――然后从 `ledger-arm64-O0.o`构建签名,与 `static-arm64-O0.stripped`匹配,并根据 `.pat`行解释为何`-O0`Không có xung đột.`PATTERN_LENGTH`缩短到 16,统计 có bao nhiêu hàm xảy ra xung đột.

## 实践实验

解码旧版绑定表,并添加 PE 查找器──

要求:

- sẽ`ledger_main_nochain`của `LC_DYLD_INFO_ONLY`基址重设、绑定和延迟绑定操作码流解码为包含段、节、地址、类型及目标的行,使其与捕获的`dyld_info -fixups`文本中 21 行一致。
- Trong `build_tiny_dyn_elf.py`中添加 `PT_GNU_RELRO`程序头和带 `DF_BIND_NOW`của `DT_FLAGS`,将 `.got.plt`移入覆盖范围,使 `llvm-objdump -p`显示新头部──在装备中 README说明这复现了完整RELRO的哪一部分,以及哪一部分只能由glibc 执行──
- 为 PE32+ 映像编写 `.pdata`读取器,以及使用 `RUNTIME_FUNCTION`起始地址的函数查找器──用 `clang -target x86_64-pc-windows-msvc -c`构建一个目标文件,不加 `-fno-asynchronous-unwind-tables`,读取其 `.pdata`重定位,并说明 các hàm nào là hàm của 省略.
- Để mỗi người đọc viết và thu thập văn bản để so sánh các bài kiểm tra.

Kiểm chuẩn thành công:`python3 code/main.py macho ledger_main_nochain`打印与 `dyld_info`tương tự 21 行 sửa đổi; mô hình ELF 携带能被 `llvm-objdump`列出的 `PT_GNU_RELRO`-`.pdata`查找器命名它能找到的函数,并列出它无法找到的叶函数──

## 本课产物

本课包含 `outputs/skill-linking-loading-and-stripped-binaries.md` Sử dụng nó sẽ chuyển đổi các chương trình bạn xây dựng thành một báo cáo: danh sách nhập khẩu và nhà cung cấp, sẽ một lần gọi theo dõi đến các vị trí chứa tải, chi tiết`strip`删除与保留的内容,并进行评分,恢复的名称和起点. Nó yêu cầu một bản sao chưa được tách ra để thực hiện, cung cấp danh sách các công cụ được bắt giữ cho mỗi kết luận,并 ghi lại từng cuộc xung đột.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries
python3 code/main.py
python3 code/tests/test_main.py
```

验证应证明:

- `tiny-dyn-x86_64`动态节与 `llvm-objdump -p`逐标签一致, và`DT_FLAGS_1`携带 `DF_1_PIE`
- 两条 `R_X86_64_JUMP_SLOT`记录与 `llvm-objdump -R`一致,并分别命名 `puts`和 `exit`
- PLT0 sẽ GOT+8 vào 并经 GOT+16 跳转, mỗi条目读取自己的槽位并将索引,每个槽位保存其自身 `pushq`Địa chỉ của
- 微型 ELF 节目和程序头与 `llvm-objdump -h -p`Một
- 两个 ELF 目标文件的重定位记录与 `llvm-objdump -r`Một
- 链接规划 tìm ra hai PLT 符号, bốn lần điều chỉnh trực tiếp, hai thứ so với trọng tâm, cũng như kích thước của từng phần hình ảnh nhỏ
- COFF 节表、含辅助记录 37 条符号记录以及重定位与`llvm-objdump -h -t -r`Một致, và `/16`解析为 `.llvm_addrsig`
- `ledger`   `REL32`记录位于三个ELF `PC32`偏移处
- PE 头部`DllCharacteristics`Và danh mục dữ liệu`llvm-objdump -p`Một
- 导入目录、提示/nói 条目和IAT 与 `llvm-objdump`及 `pefile`Một, và kết nối trước IAT như tìm kiếm biểu
- 导出目录和 `DIR64`基址重定位可正确解码,重定位后的指针指向字符串链接手动
- RVA `0x100b`处的 `ff 15`解析 đến `puts`của IAT 槽位
- Mach-O 标志、19 个加载命令名称和两个库与 `otool`Một
- 7  có thể giải mã và đối phó với 8 `__got`槽位,间接符号表与 `otool -Iv`Một
- 链式修正头部与 `llvm-objdump --macho --chained-fixups`Một
- 链遍历复现 `dyld_info -fixup_chain_details`Tất cả 12 chữ cái đầu tiên
-  sửa行和导入表与 `dyld_info -fixups`及 `-imports`Một
- Dyllib 及其剥离副本的导出字典树与 `dyld_info -exports`Một
- Đối với các tài liệu có thể thực hiện và các bản kế hoạch,`nm_lines()`Đúng vậy.`nm -m`
- `strip`删除 `_main``_fns`和 `_names`, giữ lại 9 tên và 1 bài`radr://5614542`đâm, và tách ra sau các quy trình in cùng đầu ra
- 旧布局具有 `LC_DYLD_INFO_ONLY`、7 chỉ số chậm trễ, cũng như chỉ số hướng`__stub_helper`                                                                                                                                                                                                                                                              
- arm64 目标文件 重定位与 `llvm-objdump -r`Một
- `LC_FUNCTION_STARTS`Trong hai cấp độ tối ưu hóa đều phục hồi 5/5, và với`nm`和 `dyld_info -function_starts`Một
- `sub sp`扫描 trong `-O0`找到 5/5, trong `-O2`找到 1/5,而 `stp`扫描一个也找不到
- `bl`目标加上 `LC_MAIN`Khả năng nhập cảnh 5/5
-  ký tên trong hai cấp độ tối ưu hóa đều tên tất cả năm hàm, và ghi lại bởi chữ 44  phân biệt của `grade` Konflikt
- CRC16 của 123456789 `0x6e90`, và`main`Đơn lệnh tải lên 8 chữ cái của GOT là chữ cái có thể thay đổi
- Mỗi mục tiêu không thể thay đổi file chữ cái đều tương đương với các chữ cái đã được liên kết đối phó
-  trình bày và báo cáo dữ liệu hình ảnh địa chỉ cùng, và các mô-đun điểm đặt cùng dữ liệu với ES5

## Mô hình thất bại trong môi trường sản xuất

| 失败情况 | 能力不足的工具如何报告 | 分析必须证明什么 |
|---|---|---|
| `bl` 或 `call` 落入桩 | “调用了 0x694 处的未命名函数” | 桩的字节、它加载的槽位，以及该槽位绑定的导入 |
| 从文件读取 GOT 字 | “损坏指针 0x8010000000000007” | 第 63 位表示绑定，`next` 为 2，序号 7 是来自库 2 的 `_puts` |
| 目标文件中的 `PLT32` | “每次调用都经过 PLT” | 已定义符号被化简为直接距离，只有未定义符号才获得条目 |
| 将部分 RELRO 误读为完整 RELRO | “GOT 是只读的” | 不使用 `-z now` 时，`.got.plt` 中三个保留槽位之后的槽位位于 `PT_GNU_RELRO` 之外 |
| 将 COFF `REL32` 与 ELF `PC32` 比较 | “Windows 构建使用了不同重定位” | 偏移相同，`-4` 分别存于 ELF 加数和 COFF 字段中 |
| 加载前读取 IAT | “导入指向字符串” | 加载器绑定之前，IAT 等于查找表，而这些字符串属于 hint/name 条目 |
| 已剥离的 dylib | “没有符号，也没有导出” | 导出字典树和 `LC_FUNCTION_STARTS` 列出每个函数 |
| 在已剥离可执行文件上运行 `nm` | “一个函数” | `LC_FUNCTION_STARTS` 用九字节列出五个起点 |
| 在 `-O2` 下扫描序言 | “一个函数” | 四个叶函数没有栈帧，调用目标和起点表能找到它们 |
| 两个函数共享 36 个字节 | “grade_label 就是 grade” | 尾部字节 44 以及长度 60 和 72 将冲突区分开 |
| 在另一台机器的构建产物上运行工具 | 本文中的数字 | 从你自己的测试夹具重新捕获每份清单 |

## 操作准则

Từ điểm调用 dọc theo mỗi lần调用 bên ngoài theo dõi các hố chứa đầy của tải; trước khi đặt các chữ trong hố, trước khi định nghĩa theo định dạng sẽ giải mã nó.

## 延伸阅读

- [System V gABI，第 5 章：程序加载与动态链接](https://www.sco.com/developers/gabi/latest/ch5.dynamic.html)
- [System V 应用二进制接口，AMD64 架构处理器补充规范：第 5.2 节与表 4.9](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Drepper，《如何编写共享库》，版本 4.1.2](https://akkadia.org/drepper/dsohowto.pdf)
- [Drepper，《ELF 符号版本控制》](https://akkadia.org/drepper/symbol-versioning)
- [Jelinek，《对 DSO/可执行文件进行少量加固以抵御利用》，binutils 邮件列表，2004-01-06](https://www.sourceware.org/ml/binutils/2004-01/msg00070.html)
- [Taylor，《链接器 relro》，2008](https://www.airs.com/blog/archives/189)
- [binutils 提交 bd7ab16b：为调用使用 PLT32，2018-02-13](https://gnu.googlesource.com/binutils-gdb/+/bd7ab16b4537788ad53521c45469a1bdae84ad4a)和 [LLVM D43383](https://reviews.llvm.org/D43383)
- [GNU Binutils：strip](https://sourceware.org/binutils/docs/binutils/strip.html)和 [llvm-objcopy](https://llvm.org/docs/CommandGuide/llvm-objcopy.html)
- [Microsoft，PE 格式](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format)
- [CALL 指令参考，FF /2](https://www.felixcloutier.com/x86/call)
- [Apple，mach-o/loader.h](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/loader.h)和 [mach-o/nlist.h](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/nlist.h)
- [Apple dyld, mach-o/fixup-chains.h](https://github.com/apple-oss-distributions/dyld/blob/main/include/mach-o/fixup-chains.h)
- [Apple ld64, stub_arm64.hpp](https://github.com/apple-oss-distributions/ld64/blob/main/src/ld/passes/stubs/stub_arm64.hpp)
- [Xcode 13 发布说明：链式修正](https://developer.apple.com/documentation/xcode-release-notes/xcode-13-release-notes)和 [WWDC22 第 110362 场，《快速链接：改善构建与启动时间》](https://developer.apple.com/videos/play/wwdc2022/110362/)
- [strip(1)](https://keith.github.io/xcode-man-pages/strip.1.html)[ld(1)](https://keith.github.io/xcode-man-pages/ld.1.html)和 [dyld(1)](https://keith.github.io/xcode-man-pages/dyld.1.html)
- [Hex-Rays，深入理解 IDA F.L.I.R.T. 技术](https://docs.hex-rays.com/core/flirt/concepts/ida-f.l.i.r.t.-technology-in-depth)和 [Lumina 概览](https://docs.hex-rays.com/add-ons/lumina/overview)
- [Ghidra Function ID 帮助](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/FunctionID/src/main/help/help/topics/FunctionID/FunctionID.html)和 [AARCH64 函数起点模式](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Processors/AARCH64/data/patterns/AARCH64_LE_patterns.xml)
- [Vector 35，WARP](https://github.com/Vector35/warp)和 [Binary Ninja WARP 指南](https://docs.binary.ninja/guide/warp.html)
- [BinDiff 手册](https://www.zynamics.com/bindiff/manual/)和 [BinDiff 源码](https://github.com/google/bindiff)
- [Diaphora](https://github.com/joxeankoret/diaphora)
- [rizin pat.c，.pat 解析器](https://github.com/rizinorg/rizin/blob/dev/librz/sign/pat.c)[radare2 flirt.c](https://github.com/radareorg/radare2/blob/master/libr/anal/flirt.c)和 [radare2 手册：Zignatures](https://book.rada.re/signatures/zignatures.html)
- [Andriesse 等，《对完整规模 x86/x64 二进制反汇编的深入分析》（USENIX Security 2016）](https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/andriesse)和 [Andriesse、Slowinska、Bos，《与编译器无关的二进制函数检测》（EuroS&P 2017）](https://danielandriesse.com/papers/eurosp-2017.pdf)
- [Bao 等，ByteWeight（USENIX Security 2014）](https://www.usenix.org/conference/usenixsecurity14/technical-sessions/presentation/bao)和 [Shin、Song、Moazzezi，《用神经网络识别二进制中的函数》（USENIX Security 2015）](https://www.usenix.org/conference/usenixsecurity15/technical-sessions/presentation/shin)
- [LIEF 更新日志](https://lief.re/doc/latest/changelog.html)[pyelftools](https://github.com/eliben/pyelftools)和 [pefile](https://github.com/erocarrera/pefile)
