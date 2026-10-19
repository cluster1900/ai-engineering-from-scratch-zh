# 逆向工程全景: lịch sử、工具家族与反编译器的构建方式

> 5 công cụ đọc cùng một tập tin mục tiêu, nhưng cung cấp 4 địa chỉ, 3 số khối cơ bản, và 2 câu trả lời cho cùng một chuyển đổi.

**Type:** Build
**Languages:** Python, C, x86-64 汇编, Java（一个 Ghidra 脚本）
**Prerequisites:** Phase 13 · 32（从零构建 ELF）, Phase 13 · 33（反汇编与控制流）, Phase 13 · 34（提升为伪代码）
**Time:** ~150 分钟

## Học mục tiêu

- Các công cụ chính trong lĩnh vực này được đặt vào thời gian từ năm 1973 đến năm 2026 và cho biết các gia đình của họ.
- Nói ra tám giai đoạn của máy biên dịch, cũng như Ghidra、Binary Ninja、Hex-Rays、radar2、rizin 和 angr đối với từng giai đoạn sử dụng các thuật ngữ.
- Để nâng cấp một chỉ thị lên ESIL、RzIL、P-code 和 VEX, và giải thích những gì sẽ ngay lập tức viết vào các dấu hiệu, những gì sẽ lưu trữ thunk (延迟计算记录) 👇
- Địa chỉ của 5 loại công cụ sẽ được kết hợp với nhau.`.text`偏移, và xác nhận một hàm trên một kết hợp này.
- 构建读取已采集工具输出对比框架,报告指令起点、基本块、边和函数起点的一致性──
- Theo bằng chứng thu thập, chỉ ra mỗi loại công cụ trong đó tạo ra mã hóa, bỏ qua mã hóa, hoặc dừng lại trong việc nhảy qua gián tiếp.

## 问题

Bạn yêu cầu một đại lý 总结三种逆向工程工具对 `ledger-x86_64-O1.o`Trung `grade`                                                                                                                                                                                                                                                              `0x08000050`, một loại khác nằm trong `0x400010`,第三种中位于 `0x100010` Nó cho rằng, các công cụ khác nhau về vị trí hàm có sự phân biệt

Thực tế, kết luận của tool đồng ý. Các mục tiêu của tool có thể được định vị lại, không có địa chỉ tải, vì vậy mỗi tool tự chọn một địa chỉ.`.text`Sau đó, tất cả các câu trả lời đều là`0x10`◊ đại lý so sánh địa chỉ gốc, vì không có bất kỳ thông tin nào cho biết nó các địa chỉ trong các công cụ.

Sau đó, cùng một đại lý 读取 `-O0`构建中的 `grade`, báo cáo bốn loại công cụ riêng biệt cho ra 3、8、8、9 khối cơ bản.`jmp rax`◊ 2 loại công cụ thông qua định vị lại đọc biểu đồ nhảy. Một công cụ để đặt nhãn và phân chia các khối cơ bản trong nhảy.

Trước khi tin vào bất kỳ số liệu nào như vậy, bạn cần phải có bản đồ được cung cấp trong bài học này. Phần 32 đến 36  Khóa xây dựng hiểu về bộ lập trình, nâng cấp, ghi chép bằng chứng và kết quả xây dựng lại. Phần sau của loạt bài này sẽ so sánh chúng với các công cụ thực sự được sử dụng của người ta.

```figure
re-37-field-map
```

## 用日期串起五十三年

Đây là một lĩnh vực lâu đời hơn hầu hết các công cụ.

### 1973 đến 1991: trước có调试器, sau có反汇编器

Bài luận đầu tiên chống biên dịch xuất hiện vào năm 1973, tác giả là Housel của Hollander và Purdue University của Đại học Stanford, ngày nay người ta thông qua các trích dẫn để hiểu hai bài luận này.`adb`Giáo dục, điều tra thiết bị theo năm 1979 UNIX V7  phát hành.`DEBUG`Nội dung 8086 反汇编器, theo tháng 8 năm 1981 PC-DOS 1.00 发布. GDB của Richard Stallman bắt đầu phát triển vào năm 1986.

Sau đó xuất hiện bộ xử lý hàng hóa phản viền. V Communications được tung ra vào năm 1988 Sourcer cho các chương trình DOS thực hiện nhiều lần xử lý, tạo ra danh sách các mục nhập.`objdump`Ilfak Guilfanov đã viết IDA's code 1st line vào tháng 1 năm 1991 và đã phát hành IDA 0.1 vào tháng 5 năm 1991.

### 1991 đến 2009: giao tiếp với các nhà biên dịch và các nhà biên dịch đầu tiên

Cristina Cifuentes 于 1994 年 7 月在 QUT 完成Reverse Compilation Techniques──她的反编译器 `dcc`Để chuyển đổi i80286 DOS 程序 thành C; She & Gough xuất bản năm 1995 đã thiết lập tất cả các giai đoạn sử dụng chống biên dịch viên sau đó.

IDA được thành lập vào năm 1996 tại DataRescue  trở thành sản phẩm thương mại, vào năm 1999 gia nhập phần mềm SDK, sau đó chuyển vào năm 2005 thành lập Hex-Rays。Hex-Rays Decompiler 1.0 được phát hành vào năm 2007 tháng 9 ngày 17 ngày. Cùng năm, Mike Van Emmerik đệ trình Static Single Assignment for Decompilation, bài viết này sẽ đưa SSA 静态单赋) vào trung tâm của dòng dữ liệu chống biên dịch viên.

Radar bắt đầu vào tháng 2 năm 2006, ban đầu được hỗ trợ 64 vị trí chuyển biến của取证十六进制编辑器.

### 2009 đến 2019 năm: framework与中间表示

LLDB được công bố vào tháng 6 năm 2010 là một dự án LLVM. Sử dụng BIL 中间语言的二进制分析平台 BAP trong CAV 2011 亮相. Google mua lại BinDiff vào tháng 3 năm 2011.

Angr's first line code was written in 2013 8 月──Phoenix 论文(Schwartz、Lee、Woo、Brumley,USENIX Security 2013) đã trình bày phương pháp cấu trúc giữ ngữ nghĩa, trong 8,676 hàm giữ 40 条 `goto`语句──DREAM(Yakdan 等,NDSS 2015) thông qua không phụ thuộc mô hình cấu trúc đã loại bỏ những điều này `goto`语句。Vector 35 được thành lập vào ngày 14 tháng 1 năm 2015, Binary Ninja bắt đầu bán hàng vào ngày 23 tháng 7 năm 2016, với có trình độ IL và Python API thấp.  Angr được công bố vào năm 2015, và giành được vị trí thứ ba trong DARPA Cyber Grand Challenge vào tháng 8 năm 2016.  BinDiff được chuyển đổi vào tháng 3 năm 2016 miễn phí.  Cutter 1.0 vào tháng 12 năm 2017 cho radar2 提供 Qt GUI.  2018 năm, Guilfanov xuất bản trong Recon Decompiler internal: microcode, lần đầu tiên công khai giới thiệu Hex-Rays IR。

### 2019 đến 2026 năm: mở rộng chống biên dịch và nghiên cứu chuyển hướng

NSA năm 2019 tháng 3 ngày 5 ngày trên Hội nghị RSA trên Apache 2.0  giấy phép phát hành Ghidra 9.0, một tháng sau trên GitHub công bố đầy đủ nguồn gốc.

BinDiff 8 于 2023 年 9 月 25 日以 Apache-2.0 开源;;SAILR(Basque 等,USENIX Security 2024) trở thành một cấu trúc hóa 默认,并主张仅删除多余的`goto`语句, vì Linux 6.1 源码中原本就有3,754条.`idalib`◊学习式反编译器论文 từ SLaDe(2023) phát triển đến LLM4Decompile(2024)、DecompileBench(2025), cũng như hai nghiên cứu năm 2026 ,分别讨论代理 辅助的可读性,以及重新编译成功更多、语义保留却更少的反编译器──

Bản chạy của 本课是截至 2026 年 10 月 14 日的当前版本:Ghidra 12.1.4(2026 年 9 月 21 日) 、radar2 6.2.4(2026 年 10 月 5 日) 、rizin 0.9.1(2026 年 6 月 29 日) 和 angr 10.0.3(2026 年 10 月 10 日) ⋅当前闭源工具是二进制忍者 6.0 Krypton(2026 年 9 月 3 日) 和 IDA 9.4(2026 年 7 月 13 日) ・ 本课没有运行它们──

## 工具家族

Các công cụ theo sản phẩm xuất phân loại. Một quy trình có thể trải qua nhiều gia đình, và sự chồng chất này chính là nguồn gốc của hầu hết các hỗn hợp.

### 反汇编器

线性扫描 từ phần đầu tiên của code节一直解码到最后一个字节──GNU `objdump -d`和 `llvm-objdump -d`Tất cả làm việc như vậy, và tất cả không xây dựng kiểm soát dòng.`objdump`将符号视为指令边界,并符号之间扫描──binutils 2.47(2026 年 7 月 26 日) sử dụng GPL-3.0 hoặc sau hơn──LLVM 23.1.3 采用附带LLVM 例外的Apache-2.0──Apple's Command Line Tools 提供`llvm-objdump`显示为Apple LLVM phiên bản 17.0.0,本课采集的就是这个版本──

交互式反汇编器 từ known input để chuyển tiếp xuống,加入识别函数起点的启动式规则,并维护数据库──IDA Pro(处理器模块、自动分析队列、FLIRT 签名)、Ghidra(`Disassembler`加上 Auto Analysis 分析器) 、Binary Ninja(先递归下降,再对未知区域线性扫描) 、Hopper、radar2 和 rizin(`aa``aaa``af`, kết hợp với Cutter và iaito (như GUI) đều thuộc về gia đình này. Andriesse và các khác) USENIX Security 2016 đã đo được 9 loại công cụ trên các tệp thứ hai được tạo ra bởi trình biên dịch viên.

### 反编译器

商业反编译器包括:Hex-Rays Decompiler(from x86 to RISC-V's十二种目标家族) 、Binary Ninja's HLIL 及其 Pseudo C 染,以及 Hopper's伪代码视图。开放反编译器包括:Ghidra 反编译器,即采用 Apache 2.0's C++ 引擎,r2ghidra 和 rz-ghidra 将其复用为插件,pypcode将其复用为升级器;基于 AIL、使用 SAILR 结构化、使用 BSD-2-Clause采用angr 反编译器;使用 JavaScript编写的 r2和和和;以及作为历史代表的Boomerang`dcc`❖ Radar2 còn được cài đặt `pdc`,即用类 C 语法表示的伪反汇编输出──rizin 没有内置反编译器──rizin 0.9.1 中不存在 `pdc`命令,`pdg`需要 rz-ghidra 插件──

### 调试器

Bao gồm GEF và pwndbg 前端的 GDB(1986)、LLDB(2010)、带 Time Travel Debugging 的 WinDbg(2017)、OllyDbg(2014年停止更新)、x64dbg(GPL-3.0,2014)、带 Python 连接器的Ghidra Debugger、Binary Ninja 调试器,以及radar2 和 rizin 的内置调试器──第 42 课会你在自己的构建结果上使用其中两种──

### 2 cơ cấu phân tích

Angr(VEX IR、符号执行、`CFGFast`和 `CFGEmulated`、反编译器)、BAP(BIL、OCaml)、Dyninst、Jakstab 和 ByteWeight 是 Andriesse 提到的框架──Ghidra 可通过Pyghidra 作为库使用,Binary Ninja 通过`import binaryninja`,IDA 通过 `idalib`

### 格式库与引擎库

LIEF 1.0.0(2026 年 7 月 12 日,Apache-2.0)解析 ELF、PE、Mach-O、COFF 和 Android 格式。CLE,即CLE Loads Everything,是angr的加载器。Capstone 5.0.9(2026 年 5 月 28 日,BSD-3-Clause) chịu trách nhiệm giải mã;Keystone 0.9.2(GPL-2.0) chịu trách nhiệm汇编;Unicorn 2.1.4(GPL-2.0) chịu trách nhiệm仿真──radar2 6.2.4 捆绑 Capstone 5,rizin 0.9.1 附随 Capstone、Zydis 和树-sitter。

### 差异比较工具与编译器侧查看器

Bao gồm BinDiff 8(Apache-2.0) và các tiện ích BinExport 12 của IDA Pro、Binary Ninja 和 Ghidra; cũng như Diaphora 3.4.3 của IDA 插件`radiff2`和 `rz-diff`❖ Compiler Explorer ((BSD-2-Clause) hiển thị trình biên dịch viên cho nguồn code đoạn tạo ra các tập hợp, hướng của nó đối với các phần còn lại trong danh sách này công việc ngược ngược ngược.

### 版本、许可与本课实际运行工具

| 工具 | 2026-10-14 读取的版本 | 许可证 | 无界面入口 | 本课是否运行 |
|---|---|---|---|---|
| Ghidra | 12.1.4 | Apache-2.0 | `analyzeHeadless`, `pyghidra.start()` | 是，运行于全部四个目标文件 |
| radare2 | 6.2.4 | LGPL-3.0 | `r2 -qc '<cmds>' file`, `rabin2` | 是 |
| rizin | 0.9.1 | LGPL-3.0 | `rizin -qc '<cmds>' file`, `rz-bin` | 是 |
| angr | 10.0.3 | BSD-2-Clause | Python 中的 `angr.Project` | 是 |
| llvm-objdump | Apple LLVM 17.0.0 | 附带 LLVM 例外的 Apache-2.0 | `llvm-objdump -d -r` | 是 |
| Binary Ninja | 6.0 “Krypton” | 商业；Free 版本仅限非商业用途 | 持 Commercial、Ultimate 或无界面许可证调用 `binaryninja.load()` | 否，仅依据文档 |
| IDA Pro | 9.4 | 商业订阅；IDA Free 适用于非商业 x86 和 x86-64 用途 | `idat`, `ida -A -S`, `idalib` | 否，仅依据文档 |
| Hopper | 6.6.0 | 商业，永久许可 | 文档未记载 | 否，仅依据文档 |
| Cutter | 2.5.0 | GPL-3.0 | 基于 rizin 的 GUI | 否 |

Binary Ninja's Free  phiên bản chỉ đơn giản x86、x86-64、ARMv7 和 AArch64, và không có API。IDA Free  không có IDAPython、SDK hoặc `idalib`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,

## 逐阶段查看反编译器流水线

Cifuentes đã liệt kê vào năm 1994 những giai đoạn này: phân tích ngôn ngữ, phân tích ngữ nghĩa, tạo mã trung gian, tạo quy trình kiểm soát, phân tích dữ liệu, phân tích và tạo mã. Cô phân chia nó thành các giai đoạn đầu tiên liên quan đến máy, máy và không liên quan đến ngôn ngữ, cũng như các giai đoạn sau của ngôn ngữ.

| 阶段 | Ghidra | Binary Ninja | Hex-Rays / IDA | radare2 | rizin | angr |
|---|---|---|---|---|---|---|
| 加载器 | `ElfLoader`, `MachoLoader`, `PeLoader`；`.ldefs` 选择语言 | `BinaryView`, `BinaryViewType` | 加载器模块（`LDSC`） | RBin（`rabin2`） | RzBin（`rz-bin`） | CLE（`cle.Loader`, `main_object`） |
| 反汇编 | `Disassembler`；SLEIGH `.slaspec` 编译为 `.sla`；分析器“Disassemble Entry Points”“Function Start Search” | 架构插件；Recursive Descent，随后是线性扫描阶段 | 处理器模块（`ana.cpp`, `emu.cpp`, `out.cpp`）；自动分析队列；FLIRT | RArch 插件生成 `RAnalOp`；`aa`, `aaa`, `af` | RzAnalysis 插件；`aa`, `aaa`, `af` | Capstone 基本块；`CFGFast` 函数起点搜索 |
| CFG 恢复 | “Generate Basic Blocks and the CFG”；`BlockGraph`；“Decompiler Switch Analysis” | `Function`, `BasicBlock`；“Control Flow Graph (CFG) Analysis”阶段 | `mbl_graph_t`，在 `MMAT_LOCOPT` 时就绪 | `afb`, `agf`, `aab` | `afb`, `agf`, `aab`（Nucleus） | `CFGFast`, `CFGEmulated`；`kb.functions`；IRSB |
| 提升 | “Generate Raw P-code”；位于 `ram`, `register`, `const`, `unique` 的 Varnode | Lifted IL, LLIL, Mapped MLIL, MLIL | 微代码（`minsn_t`, `mop_t`）；`MMAT_GENERATED` | ESIL（`asm.esil`, `ae`） | RzIL（`aoi`, `aez`） | VEX（`pyvex.lift`, IRSB），随后是 AIL |
| SSA | `Heritage`, `ActionHeritage`；`MULTIEQUAL`, `INDIRECT` | LLIL SSA, MLIL SSA, HLIL SSA；`HLIL_VAR_PHI` | 没有命名为 SSA 的形式；在 `MMAT_GLBOPT1` 至 `3` 中做 use-def 数据流分析 | 无；ESIL 为仿真而构建 | 无；RzIL 为仿真而构建 | `_stage_transform_to_ssa_level0` 和 `level1`；`SeqNodeDephication` |
| 数据流与类型 | `ActionDeadCode`, `ActionInferTypes`，`Rule` 池；原型来自 `.cspec` | MLIL 常量传播、变量和类型；`analyzeReturns` | “Transform microcode”；`MMAT_CALLS`, `MMAT_GLBOPT`, `MMAT_LVARS`；TIL | `afv`, `afc`, `aaft`；ESIL 仿真 | `afv`, `afc`, `aft` | `CallingConventionAnalysis`, `VariableRecoveryFast`, `Typehoon` |
| 结构化 | `CollapseStructure`；`BlockIf`, `BlockWhileDo`, `BlockSwitch`, `BlockGoto` | `HLIL_IF`, `HLIL_WHILE`, `HLIL_SWITCH`；AST 位于 `root` | “Generate ctree”；结构分析；goto 区域 | `pdc`；`pdd`（r2dec）；`pdg`（r2ghidra） | `pdg`（rz-ghidra）；jsdec | `RegionIdentifier`；使用 `SAILRStructurer` 的 `RecursiveStructurer` |
| 输出 | “Emit Final C Tokens”；`PrintC`, `ActionNameVars`, `ActionSetCasts` | HLIL 渲染；Pseudo C、Pseudo Rust、Pseudo Python | “Beautify ctree; Print ctree”；`cfunc_t` | `pdc`, `pdd`, `pdg` 的文本 | `pdg` 文本 | `CStructuredCodeGenerator`；`codegen.text` |

### Bộ tải

Các phần mềm này được chọn để phân tích các mục tiêu và định vị.`0x08000000`,使 `.text`位于 `0x08000040`, vì phần này đã di chuyển từ tài liệu`0x40`开始――CLE 将 `.text`放到 `0x400000`✿Ghidra của ✿`ElfLoader`Để nó đi.`0x100000``llvm-objdump`打印节内偏移, hoàn toàn không sử dụng基址。

Các bộ xử lý chuyển vị cũng khác nhau. Ghidra trong khi nhập vào xử lý, CLE sẽ áp dụng chuyển vị.`bin.relocs.apply=true`Có thể thay đổi hành vi này. Làm thế nào để xử lý vị trí tải lại, quyết định tất cả các giai đoạn tiếp theo có thể thấy những gì bạn sẽ ở dưới đây.`-O0`跳转表中看其影响──

### 反汇编

Chương 33  xây dựng hai phương pháp:`llvm-objdump`Ngoài ra, mỗi loại công cụ đều chuyển sang xuống, tái gia nhập hàm bắt đầu tìm kiếm. Biến Ninja 文档 theo thứ tự được liệt kê trong các giai đoạn này: Quăng ngược truy cập, Phân tích mục tiêu gọi, phân tích CFG về các khu vực chưa biết, cũng như phân tích gọi đuôi.`CFGFast`文档列出函数起点的四个来源:符号、函数序言扫描、调用目标,以及对剩余字节的完整扫描──最后一个来源正是在填充区的模拟函数的原因──

### CFG 恢复

Các công cụ phân chia các khối cơ bản theo cách của bài học 33, nhưng có một sự khác biệt trong số đó bạn sẽ tự đo lường.`call`处结束基本块, vì IRSB của nó là một nhập khẩu, nhiều xuất khẩu,调用 thuộc về xuất khẩu.`grade`của `-O0`版  `grade_label`上,angr 报告 2 个块,其他三种报告 1 个.

### 提升

Binary Ninja sẽ nâng cao định nghĩa là từ ngôn ngữ thấp hơn dịch thành được coi là ngôn ngữ trung lưu cao hơn. Các mục đích của các IR khác nhau. P-code và VEX được xây dựng để phân tích và chống biên dịch. ESIL và RzIL được xây dựng để bắt chước, không có SSA 阶段.`MMAT_GENERATED`Đến`MMAT_LVARS`Các Binary Ninja trước tiên nâng lên Lifted IL, sau đó trong LLIL sẽ có các dấu hiệu được gấp đôi, trong khi MLIL sẽ có các mục ký và lưu trữ truy cập được dịch thành biến số.

### SSA

Bài luận của Van Emmerik liệt kê khả năng của SSA đối với các trình biên dịch: biểu hiện truyền tải, không cần ABI  giả định của các tham số và giá trị trở lại nhận dạng, phân tích bảo tồn, phân tích kiểu như các vấn đề lưu thông dữ liệu hiếm, cũng như phân tích chuyển đổi và điều chỉnh gián tiếp.`Heritage`,并加入 chỉ tồn tại trong 2 hoạt động trong biểu đồ: biểu thị phi của `MULTIEQUAL`和 biểu hiện tác dụng phụ `INDIRECT`❖ Ninja nhị phân trong mỗi IL 层暴露 SSA 形式──angr 在 `Clinic`Trong có hai giai đoạn SSA: Hex-Rays không được đặt tên là SSA, nhưng trong toàn diện tối ưu hóa sau đó được sử dụng để phân tích dữ liệu.

### Dữ liệu và loại

Ghidra  chủ yếu đơn giản hóa vòng lặp liên tục thực hiện Tấm mã chết Tổ xuất các loại địa phương 和 Thực hiện viết lại thuật ngữ , cho đến khi không còn thay đổi, trong đó tái viết bởi `Rule`đối tượng池完成──Hex-Rays 转换微代码,在 `MMAT_CALLS`检测调用 thực参, trong `MMAT_LVARS`分配局部变量──angr 运行 `CallingConventionAnalysis``VariableRecoveryFast`和 `Typehoon`, sau đó thực hiện Noonan、Loginov 和 Cok của nhiều kiểu loại luận.

###  cấu trúc

Ghidra của `CollapseStructure`搜索匹配某种结构的子图,将其折叠为一个节点; gặp không thể tiếp tục, xóa một条边并标记为非结构化――Hex-Rays将CFG归约为`if``while``do`和 `switch`, còn lại được giữ cho sẵn 区域──angr 识别单入口、单出口区域,默认使用 `SAILRStructurer`结构化, cũng có thể chọn`PhoenixStructurer`和 `DreamStructurer`◊第 34 课手写过一个结构化器――

### 输出

Ghidra ở `ActionNameVars`和 `ActionSetCasts`之后, qua `PrintC`配合 Oppen 美化打印器输出 C token──Hex-Rays 美化并打印 ctree──Binary Ninja sẽ HLIL 染为 Pseudo C、Pseudo Rust 或 Pseudo Python──angr 返回`codegen.text`◊Radar2 打印 `pdc``pdd`Hoặc`pdg`

## Cùng một điều chỉ dẫn của bốn IR

取 `48 83 ec 10`,即 `subq $0x10, %rsp` Sử dụng quy tắc của bài học 33  trên giấy giải mã

1. `48` `W = 1`của REX, số hoạt động là 64 位.
2. `83`带 8 位立即数的第 1 组算术操作码──ModRM 的 reg 字段选择操作──
3. `ec`是 ModRM `11 101 100``mod = 11`表示寄存器形式──`reg = 101` `/5`,即 `sub``r/m = 100` `%rsp`
4. `10`是立即数, giá trị为 16──

Để phân phối bốn chữ cái này cho bốn loại nâng cấp. Trong thiết bị kiểm tra, lưu giữ các lệnh chính xác và toàn bộ văn bản.

ESIL của radar2 6.2.4 chứa 30 token của逗号分隔字符串:

```text
16,0x8000000000000000,-,!,16,rsp,-=,63,$o,^,of,:=,63,$s,sf,:=,$z,zf,:=,$p,pf,:=,64,$b,cf,:=,4,$b,af,:=
```

Nó là một cái máy.`16,rsp,-=`Sau đó, mỗi dấu hiệu đều thông qua các trình điều khiển bên trong viết:`$o`biểu hiện xuất hiện,`$s`biểu tượng`$z`表示零,`$p`biểu hiện kỳ lạ,`$b`表示借位──

Rizin 0.9.1 của RzIL là một chứa 14 `set`效果的 S biểu hiện:

```text
(seq (set op1 (var rsp)) (set op2 (bv 64 0x10)) (set sub (- (var op1) (var op2))) (set rsp (var sub))
     (set _result (var sub)) (set pf (! (lsb (let _val (cast 8 false (var _result)) ...))))
     (set zf (is_zero (var _result))) (set sf (msb (var _result))) ... (set cf (|| ...)) (set of (|| ...)) (set af (|| ...)))
```

Mỗi dấu hiệu là biểu hiện của biểu tượng trên khối lượng của dấu hiệu. Chỉ cần có bốn tầng.`let`

通过pypcode 4.0.1 Từ SLEIGH 规范 `x86:LE:64:default`生成的P-code, trong `IMARK`Có 9 hoạt động sau:

```text
CF = RSP < 0x10
OF = sborrow(RSP, 0x10)
RSP = RSP - 0x10
SF = RSP s< 0x0
ZF = RSP == 0x0
unique[58300:8] = RSP & 0xff
unique[58400:1] = popcount(unique[58300:8])
unique[58500:1] = unique[58400:1] & 0x1
PF = unique[58500:1] == 0x0
```

Đây là một bộ chuyển tải, giá trị tạm thời nằm ở `unique`空间──标志位在命令处立即计算,并且 `CF`和 `OF`Trong giảm法 `RSP`Trước đây đã tính toán.

pyvex 10.0.3 生成的 VEX 在 `IMark`后有七条语句:

```text
t2 = GET:I64(offset=48)
t0 = Sub64(t2,0x0000000000000010)
PUT(offset=144) = 0x0000000000000008
PUT(offset=152) = t2
PUT(offset=160) = 0x0000000000000010
PUT(offset=168) = 0x0000000000000000
PUT(offset=48) = t0
```

Không có dấu hiệu nào xuất hiện ở đây. VEX theo ký Ứng dụng trong trạng thái khách hàng đặt tên ký Ứng dụng, chuyển động 48 là`rsp`△ chuyển động 144 đến 168 分分为 `cc_op``cc_dep1``cc_dep2`和 `cc_ndep` Bộ xử lý bộ nhớ nâng cao 8, tức là 64 điểm giảm, cùng với hai số.`pcode.writesFlags`Vì vậy,`vex.computesFlags`Vì lý do sai, cũng là lý do ngắn nhất trong bốn biểu hiện.

Cũng sẽ có 4 loại nâng được sử dụng.`48 63 c7`,即 `movslq %edi, %rax`(`-O1`下 `grade`n đầu tiên chỉ thị), nhận được 5 mã ESIL`32,edi,~,rax,=`) 、1 个 RzIL `set`、1 个 P-code 操作(`RAX = sext(EDI)`Không có máy nâng cao để viết vào vị trí biểu tượng, vì chỉ thị này tự nó không liên quan đến vị trí biểu tượng.`(register, 0x0, 8) INT_SEXT (register, 0x38, 4)`:寄存器偏移 0 是 `RAX`, chuyển`0x38` `RDI`,大小分分为 8 和 4 字节.

`grade`边界检查中的 `83 f9 04`,即 `cmpl $0x4, %ecx`, tạo ra 30 token ESIL 13 token RzIL`set`效果、10 个 P-code 操作, cũng như 7 条 VEX 语句, sau đây `cc_op`为 7, biểu thị 32 位减法.`%ecx`◊ Các phiên dịch viên bạn xây dựng sẽ lưu trữ bảng này:

## Một hàm có 4 địa chỉ

Trong framework bắt đầu so sánh, nó phải được xác định vị trí của hàm trước.`ledger-x86_64-O1.o`Trung `grade`Tôi nghĩ là một lần thôi.

| 工具 | `.text` 地址 | `grade` 地址 | 偏移 |
|---|---|---|---|
| `llvm-objdump` | `0x0` | `0x10` | `0x10 - 0x0 = 0x10` |
| radare2, rizin | `0x08000040` | `0x08000050` | `0x08000050 - 0x08000040 = 0x10` |
| angr | `0x400000` | `0x400010` | `0x400010 - 0x400000 = 0x10` |
| Ghidra | `0x100000` | `0x100010` | `0x100010 - 0x100000 = 0x10` |

符号表表示,`grade`位于 `.text + 0x10`,大小为46── bỏ bỏ基址后, tất cả các dụng cụ đều phù hợp──框架 từ các phần thu thập kết quả读取基址:radare2 和 rizin 的 `iSj`、r 采集结果的 、r 采集结果的`.text`节条目、Ghidra 采集结果的 `.text`Trong khi đó, các bộ phận trong bộ nhớ trong bộ nhớ có thể được kiểm tra.`test_every_tool_places_grade_at_offset_0x10_from_its_own_base`Sự thật này là xác minh cố định.

## 工具在哪里一致,在哪里分歧 工具在哪里一致,在哪里分歧

`code/main.py`Trong khung đọc kết quả thu thập, phân tích từng địa chỉ, so sánh lại.

### Một致性案例: - O1 下的 sổ cái

Trong bốn hàm, quét tuyến tính có 56 điều hướng, trong đó có 54 điều trong phạm vi mã, vùng lấp đầy 2 điều. Mỗi loại công cụ trong mỗi hàm báo cáo cùng một hướng dẫn bắt đầu: phân biệt là 9、14、13、18个.`total`5 khối và 5 đoạn là những đoạn 33 của bài vẽ.

唯一差异在填充区──函数之间的 3 个字节(`grade`后的 `66 90``total`后的 `90`) bị quét mã hóa bởi vì nó không có lý do để dừng lại; tức giận cũng giải mã chúng, và tạo ra không có mã `sub_40003e`和 `sub_40005f`                                                                                                                                                                                                                                                              

### Trường hợp quy mô: O2

Trong bốn loại thiết bị xây dựng,`total`là 41 条 chỉ thị  10 块  13 条边缘  33 条 课程 SSE2 循环和处理剩余元素的标量循环, trong mỗi công cụ cách phân chia giống nhau                                                                                                                                                                                                                                       

### 跳转表:-O0 下的级别

Trong công cụ này xuất hiện sự phân biệt, và sự phân biệt chính là trọng tâm của bài học này.

| 工具 | 基本块 | 边 | 采集结果的说明 |
|---|---|---|---|
| radare2 | 3 | 2 | `0x62` 处的块没有后继；从未到达 `0x76` 至 `0x9a` 的字节；缺少 8 个指令起点 |
| rizin | 8 | 11 | `0x62` 处的块带有 `switch_op`，其中有 5 个 case 和 4 个不同目标 |
| angr | 8 | 7 | case 块存在，`0x62` 处的控制转移指向一个无法解析的目标节点 |
| Ghidra | 9 | 12 | `0x74` 处的 `switchD` 标签拆分了块；四条 `COMPUTED_JUMP` 流分别指向 `0x76`、`0x7f`、`0x88`、`0x91` |

Chỉ cần đạt đến vị trí thích hợp, bốn loại công cụ giải mã đều giống nhau 33 lệnh.`jmp rax`,留下 36 字节未认领,框架将这个范围标为遗漏代码――rizin 和 Ghidra 找到了四个不同的目标,即第33 课从 `.rela.rodata`Ưu điểm của 5 bài học Ưu điểm của 5 bài học Ưu điểm của 5 bài học Ưu điểm của 5 bài học Ưu điểm của 5 bài học Ưu điểm của 5 bài học Ưu điểm của 5 bài học Ưu điểm của 5 bài học Ưu điểm của 5 bài học Ưu điểm của 5 bài học Ưu điểm của 5 bài học Ưu điểm của 5 bài học Ưu điểm của 5 bài học Ưu điểm của 5 bài học Ưu điểm của 5 bài học Ưu điểm của 5 bài học Ưu điểm của 5 bài học Ưu điểm của 5 bài học Ưu điểm của 5 bài học Ưu điểm của 1 bài học Ưu điểm của 1 bài học Ưu điểm của 1 bài học Ưu điểm của 1 bài học Ưu điểm của 1 bài học Ưu điểm của 1 bài học Ưu điểm Ưu điểm Ưu điểm của 1 bài học Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm`grade`Trong trường hợp các khối, nhưng vẫn không có từ nhảy các khối hướng đến bên của chúng; kết quả thu thập của nó sẽ`0x62`处的转移记录指向无法解析的目标节,反编译器则打印计算式 `goto`Đối với cùng một dòng kiểm soát, Ghidra hơn rizin nhiều một khối và một cạnh, vì chuyển đổi của nó  phân tích trong `jmp rax`Trên đặt nhãn, và mô hình khối cơ bản sẽ bắt đầu khối mới ở vị trí nhãn.

Chương 33 trong biểu đồ có 8 khối, 11 biên,...rizin hoàn toàn phù hợp với nó. Điểm nhấn là hiểu,9、11、7、2 không phải là bốn lần đo số lượng mã hóa được tìm thấy, mà là bốn công cụ cho cùng một thời gian nhảy theo dõi nhiều cách, chọn trong đó phân chia bốn câu trả lời.

### 代码中的数据:sweep-trap

`lookup`长 24 字节, trong `0x10`处包含 4 个表数据字节 `31 c0 90 48`◊ Lần quét trên đường trong phạm vi này báo cáo 8 chỉ dẫn bắt đầu điểm.`0x10``0x12``0x13`Đứng lên, ở `0x14`缺少起点── Đó là bài học thứ 33.`addq $0x1, %rax`提前一个字节──radare2、rizin 和 Ghidra 报告 6 个起点、2 个块、1 条边,并将 `0x10`至 `0x14`留作未认领──rồng giận đối với `lookup` báo cáo 2 khối và 1 条边, sau đó được tạo ra trên biểu tượng`sub_400010`Một 4 字节块中 2 条命令,块结束于 `0x14`, cũng vậy`lookup`Điểm khởi đầu của phần hai, vì vậy `0x13`处的REX字节 không thuộc về bất kỳ hướng dẫn nào.`0x10`至 `0x14`, vì vậy những chữ trong hàm là dữ liệu.

### 按工具统计 构造与遗漏

Trong bốn tài liệu mục tiêu, framework chỉ ra rằng angr  đã tạo ra 9 hàm không có biểu tượng, mỗi trong số đó nằm trong vùng lấp đầy hoặc bảng bẫy.`-O0`下 `grade`Trong 36 trường hợp 字节── nó chỉ ra mã hóa quét tuyến tính, nhưng không có mô hình xây dựng được xem như mã hóa 9 phạm vi: tám lấp đầy khoảng trống cộng với các bẫy bảng── không có bất kỳ công cụ nào được báo cáo hàm bị bỏ lỡ──

## 三种反编译器分析级

Trong số các công cụ thu thập được có ba loại:`-O1`下的 `grade`输出类C 文本──源码是带五个案例的 `switch (score / 10)`, biên dịch sau trở thành biên giới kiểm tra và trở lại giá trị bảng.

Ghidra 12.1.4:

```c
uint grade(int param_1)
{
  uint uVar1;
  uint uVar2;

  uVar2 = param_1 / 10 - 6;
  uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);
  if (uVar2 < 5) {
    uVar1 = *(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4);
  }
  return uVar1;
}
```

Angr 10.0.3:

```c
extern unsigned int g_4000b4[4];

unsigned int grade(int a0)
{
    unsigned int v1;  // ecx
    unsigned int v2;  // eax

    v1 = (unsigned int)((long long)(a0 * 1717986919) >> 0x22) + (unsigned int)(a0 * 1717986919 >> 63) - 6;
    v2 = 0;
    if (v1 <= 4)
        v2 = g_4000b4[v1];
    return v2;
}
```

radar2 6.2.4, `pdc`- Có thể là:

```c
void sym.grade (int64_t arg1) {
    rax = edi
    rax = rax * 0x66666667
    rcx = rax
    rcx >>= 0x22
    rax >>>= 0x3f
    ecx += eax
    ecx += 0xfffffffa
    eax = 0
    v = ecx - 4
    if (((unsigned) v) <= 0) {
        eax = ecx
        rcx = rip
        eax = dword [rcx + rax*4]
    }
    return
}
```

结合流水线阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅   阅 阅      阅      阅                                                                           `0x66666667`和右移 34 位 折叠回 `param_1 / 10`, cũng là 34  课的惯用模式. 愤怒 提升同样字节, nhưng sẽ được vận hành để giữ lại.`a0 * 1717986919 >> 0x22`◊Radar2 của ◊`pdc`模仿加伪语法: sử dụng tên ký 存器, không biến đổi và loại, biên giới kiểm tra trong không ký 符减法 sau khi in for `<= 0`✿Ghidra 通过 ✿`DAT_001000b4`Để chứng minh việc trao đổi các loại hình;ngr tuyên bố`g_4000b4[4]`Có 5 yếu tố, nhưng nó chỉ ra 4... Ghidra và Angr đều không có trường hợp phục hồi, vì...`-O1`字节中已不再保留转换. 字节中已不再保留转换.`-O0`Giới thiệu về các loại hình hình ảnh của các công cụ`switch(param_1 / 10)`,ngr 则打印计算式 `goto`

Rizin  không có máy biên dịch riêng của mình, thu thập hồ sơ cho thấy không có trong đó `pdc`❖ HLIL và Hex-Rays của Binary Ninja ctree là hai loại đầu ra

## 动手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/37-the-reverse-engineering-landscape
python3 code/main.py
```

输出 là một báo cáo JSON. Đầu tiên là phiên bản công cụ của hồ sơ thu thập thời gian, cũng như các công cụ hiện có trên máy tính của bạn, sau đó có thể bị mất tích hoàn toàn. Sau đó, cho bốn tệp mục tiêu một cách riêng biệt cung cấp phạm vi mã, lấp đầy khoảng trống, địa chỉ cơ sở của các công cụ sử dụng, các công cụ tìm thấy hoặc tạo ra các điểm khởi đầu của các hàm, cũng như sự phù hợp của các chỉ dẫn của từng hàm, số lượng khối cơ bản, ranh giới và các bên thiếu sót của các công cụ. Cuối cùng là danh sách ghi nhận của các công cụ theo thống kê từng phần, các công cụ tự nó, sử dụng các câu thông thường được diễn tả, cũng như phần IR: trình dịch sẽ hiển thị các số lượng phát ra của các chỉ thị cho ba điều, với kết quả nâng cao của thu thập.

预期结构:

```json
{
  "captureTools": {"llvm-objdump": "Apple LLVM version 17.0.0", "radare2": "radare2 6.2.4 ...", "rizin": "rizin 0.9.1 ...", "angr": "10.0.3", "ghidra": "12.1.4"},
  "localTools": {"radare2": "absent", "...": "..."},
  "fixtures": {
    "ledger-x86_64-O0.o": {
      "bases": {"llvm-objdump": "0x0", "radare2": "0x8000040", "angr": "0x400000", "ghidra": "0x100000", "...": "..."},
      "functions": {"grade": {"blocks": {"radare2": 3, "rizin": 8, "angr": 8, "ghidra": 9}, "edges": {"radare2": 2, "rizin": 11, "angr": 7, "ghidra": 12}, "...": "..."}},
      "findings": ["radare2 never reaches bytes 0x76-0x9a inside grade that the other graph builders decode", "..."]
    }
  },
  "ir": {"translator": [{"text": "subq $0x10, %rsp", "flags": {"pcodeLike": "eager", "vexLike": "thunk"}, "...": "..."}], "observed": {"...": "..."}}
}
```

按以下顺序阅读 `code/main.py`- Có thể là:

1. `read_text_symbols()`读取节头以及 `.text`của `STT_FUNC`符号――符号表是框架唯一的真价值依据,`TextSection.gaps()`Theo đề xuất này,
2. `parse_objdump()``parse_r2_family()``parse_angr()`和 `parse_ghidra()`Mỗi người sẽ có một kết quả thu thập trở thành`ToolView`: chứa các địa chỉ cơ bản, từ chuyển từ biểu đồ đến độ dài, cũng như các hàm đối ứng`FunctionView`, trong đó có các khối, bên và có thể tồn tại các văn bản chống biên dịch. Mỗi máy phân tích chỉ hiểu một từ ngữ của công cụ, không liên quan đến các công cụ khác.
3. `majority()`和 `ranges()`là hai hàm hỗ trợ được sử dụng mỗi lần so sánh.
4. `function_report()`Trước đó, chỉ thị bắt đầu điểm so với hầu hết kết quả của thiết kế hình ảnh, so sánh lại số lượng khối cơ bản và tập hợp bên, và liệt kê nội dung thiếu sót của mỗi loại công cụ.
5. `byte_report()`Đánh thành mỗi字节 thành mã trong mã, lấp đầy, không được xác nhận, tạo ra hoặc bỏ qua, và chỉ ra không có mô hình trong mã.
6. `findings()`Để chuyển đổi kết quả này thành câu,`compare()`Để mỗi mục tiêu tập tin tập hợp một báo cáo.
7. `decode_small()``to_pcode_like()`和 `to_vex_like()`构成翻译器: 三种寄存器形式的编码, một kiểu lập tức tính toán, một kiểu 风格Thunk
8. `observed_ir()`Kết quả tăng trưởng của việc đo lường`figure_data()`组装时间线、阶段表和图中展示的证据──

Còn 3 lệnh nữa.`python3 code/main.py compare FIXTURE.o`印单个目标文件报告――`python3 code/main.py ir 4883ec10`打印翻译器对一条命令生成的两种形式──`python3 code/main.py figure-data`印嵌图中的数据──

采集由 `code/fixtures/capture_tools.py`Một lần hoàn thành, nó là `captures.json`Trong ghi từng lệnh và phiên bản. khung và thử nghiệm từ không khởi động các công cụ. Nếu bạn cài đặt các công cụ này, bạn có thể chạy lấy các văn bản, tải file, và đọc các thử nghiệm.

##  thực tế sử dụng

Theo quy trình sau đây sẽ được sử dụng trong các mục tiêu mới.

1. tự xây dựng mục tiêu tài liệu và lưu trữ lệnh biên tập.
2. Với mô hình không giao diện để thu thập từng loại công cụ một lần.
3. 检查基址──选择一个函数, xác nhận giảm đi các công cụ `.text`Sau địa chỉ, mỗi loại công cụ sẽ định vị nó ở cùng một vị trí. Nếu có công cụ không phù hợp, dừng lại và tìm hiểu nó tải gì.
4. Nếu các thiết kế hình ảnh không phù hợp ở đây, thì việc so sánh tiếp theo sẽ được thảo luận là giải mã, chứ không phải phân tích.
5. So sánh các khối cơ bản và bên, đọc trước số đánh giá ghi chú của mỗi công cụ.`switch_op``COMPUTED_JUMP`Hoặc không thể giải quyết được các mục tiêu có thể giải thích hầu hết sự khác biệt.
6. 逐字节统计──工具认领填充区,说明启动式规则正在起作用──工具留下符号字节,说明遍历停止──没有图构建器认领的符号字节是数据──
7.  viết rõ những công cụ không hoạt động.                                                                                                                                                                                                                                                          

## 交互实验

### 实验 A: một hàm,四种基址

Trong `code`Giờ mở Python:

```bash
cd phases/13-tools-and-protocols/37-the-reverse-engineering-landscape/code
python3 -q
```

运行:

```python
from main import *
views = load_views("ledger-x86_64-O1.o")
{tool: hex(view.base) for tool, view in views.items()}
{tool: hex(view.functions["grade"].start + view.base) for tool, view in views.items()}
```

运行第二行前,先写下四个原始地址,并对照本课的表格检查――随后将 `grade`替换为 `grade_label`, bàn tay tính nó ở vị trí của Ghidra.

### 实验 B: Từ bốn góc nhìn nhảy chuyển bảng

```python
report = compare("ledger-x86_64-O0.o")
report["functions"]["grade"]["blocks"]
report["functions"]["grade"]["edgesMissingPerTool"]["radare2"]
report["notes"]["rizin"]
report["notes"]["ghidra"]
report["bytes"]["radare2"]["misses"]
```

统计 radar2 缺少边,将每条边与第33 课`-O0`Một dòng trong danh sách đối phó với .`switchD`标签:

### 实验 C:立即计算标志位与thunk

```python
translate("48 83 ec 10")["pcodeLike"]
translate("48 83 ec 10")["vexLike"]
translate("83 f9 04")["vexLike"]
{row["name"]: (row["pcode"]["ops"], row["vex"]["statements"]) for row in observed_ir()["instructions"]}
```

Trong hai xuất phát tìm thấy `cc_op`常量,并解释 tại sao một là 8, một khác là 7... sau đó thử `translate("48 01 c8")`Không đọc `TranslateError`

### 实验 D:五种工具下的陷

```python
report = compare("sweep-trap.o")
report["functions"]["lookup"]["instructionStarts"]
report["bytes"]["dataInsideSymbols"]
report["functionStarts"]["angr"]
```

Trong giấy theo cách quét đường dây`31 c0 90 48 83 c0 01`, tái theo`jmp`后递归下降方式解码──将两列表与框架报告的余额和缺失起点对应起来──

## 实践实验

加入第五份采集结果并扩展框架──

要求:

-  chọn một loại công cụ mà bạn có thể chạy trên máy tính của mình: GNU `objdump`、LIEF 搭配 Capstone、手动导出 Binary Ninja Free 会话, hoặc sử dụng các bộ nhớ của các bộ sưu tập phân tích khác nhau.`captures.json`Trung ghi chép chính xác lệnh và phiên bản.
- 编写一个解析器,将采集结果转换为 `ToolView`, bao gồm các địa chỉ cơ bản của công cụ, hướng dẫn, chức năng, cũng như các khối cơ bản và bên trong khi cung cấp công cụ.
- 将工具加入 `TOOLS`Nếu nó xây dựng, cũng tham gia`DESCENT_TOOLS`◊运行演示, xem hầu hết tập hợp đã xảy ra những thay đổi gì.
- 编写一个测试,断言工具在 `ledger-x86_64-O1.o`Số khối cơ bản trên; viết lại một bài kiểm tra, nói rằng nó xử lý như thế nào trong bẫy.
- Để viết một đoạn văn trong bài học này, sử dụng cụ thể của mình để giải thích nó gọi là loader, counter currency editor và CFG.

Định nghĩa thành công là:`python3 code/main.py`Trong `captureTools`Trung báo cáo công cụ mới,`ledger-x86_64-O1.o`của mỗi hàm đều giữ `allDescentToolsAgree`Vì đúng, và `sweep-trap.o`                                                                                                                                                                                                                                                              `0x10`至 `0x14`                                                                                                                                                                                                                                                              

## 本课产物

本课包含 `outputs/skill-the-reverse-engineering-landscape.md` Sử dụng nó để chạy nhiều công cụ trên một tài liệu mục tiêu bạn xây dựng, sẽ kết hợp địa chỉ thành cùng một基准, và báo cáo về tính thống nhất của chúng trên các chỉ thị bắt đầu, khối và bên, cũng như các phụ kiện của các công cụ được tạo ra hoặc bỏ qua.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/37-the-reverse-engineering-landscape
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明:

- ELF 读取器在 `ledger-x86_64-O1.o`Trong đó tìm được bốn biểu tượng hàm, kích thước là 16、46、31、63, và tìm thấy hai fill gap
- Kết quả thu thập các tài liệu mục tiêu có chứa 86,56,84,11 điều khoản
- Radar2 和 Rizin 在 `ledger-x86_64-O1.o`Chỉ có radar 2 có.`pdc`文本
- `sub_40003e`和 `sub_40005f`Chức năng 标为没有符号
- Ghidra đối với`total`Các khối phân chia là 5 khối của lớp 33, và không phải là bên trong biểu đồ.
- Sau khi bỏ ra địa điểm của riêng mình, mỗi loại công cụ sẽ được `grade` đặt ở chỗ `0x10`
- Mỗi loại công cụ`ledger-x86_64-O1.o`Trong mỗi hàm mỗi chỉ dẫn bắt đầu đều phù hợp
- Có 4 hình ảnh cấu trúc trong đó báo cáo 3、3、5、4 khối và 2、3、5、4 条边, và边集合 giống nhau
- `-O2`下的 `total`Trong mỗi thiết bị xây dựng hình ảnh có 10 khối và 13 bên
- `-O0`下的 `grade`Trong radar2、rizin、angr、Ghidra 中分别有3、8、8、9个块和2、11、7、12条边,原因见各工具注记
- `-O0`下的 `grade_label`Trong tất cả các công cụ là một khối, chỉ có một khối trong việc sử dụng kết thúc cơ bản
- Angr trong mỗi lấp đầy khoảng trống tạo ra một hàm, và tạo ra một hàm lại trên bảng bẫy; các công cụ khác không tạo ra hoặc bỏ qua hàm
- 线性扫描 在陷中多出起点 `0x10``0x12``0x13`, mất đi`0x14`, và không có thiết bị giải mã`0x10`至 `0x14`
- 发现列表指出 radar2 遗漏的范围和愤怒 臆造的每个函数
- 清单为全部 21 采集文件记录版本和命令
- 三种工具反编译 `grade`, chỉ có Ghidra 折叠除法惯用模式
- 翻译器的一种风格立即写入 CF、OF、SF、ZF、PF,另一种写入 `cc_op`thùng; đối với `cmp`Không viết寄存器, đối với `movslq`Không viết dấu vị trí
- 翻译器拒绝内存形式、其他操作码、额外 REX 位和错误长度
- 翻译器的 翻译器的`cc_op`Số 8 và 7 giống nhau với VEX trong thu thập
- Kết quả nâng cao của việc thu thập đối với 3 chỉ thị phân biệt đưa ra 9、1、10 mã P 操作 và 7、4、7 条 VEX 语句
- Thời gian dòng theo thứ tự từ năm 1973 kéo dài đến năm 2026, dòng nước có tám giai đoạn và sáu loại công cụ, mỗi đơn vị có thuật ngữ, hai loại công cụ nguồn đóng dấu không hoạt động
-  giao tiếp hình ảnh nhập dữ liệu giống như dữ liệu được tạo ra trong khung

## 生产环境失效模式

| 失效 | 不严谨的报告怎么说 | 框架必须证明什么 |
|---|---|---|
| 使用不同工具的原始地址 | “工具对 grade 的位置存在分歧” | 去掉各自基址后得到同一个偏移，并在一个函数上验证 |
| 用基本块数衡量发现的代码量 | “Ghidra 发现的代码最多” | 指令起点相同，多出的块由标签解释 |
| 将一种工具当作绝对真值 | “objdump 表明表字节是指令” | 扫描属于线性扫描；三种图构建器没有认领这些字节 |
| 将填充区函数算作发现 | “angr 多发现了七个函数” | 每个都位于填充空隙或数据上，且都没有符号 |
| 将停止的遍历报告为死代码 | “四个 case 块不可达” | 一种工具遗漏 36 字节，另外三种能够到达 |
| 不看注记就比较边数 | “rizin 和 Ghidra 对 grade 存在分歧” | 四个计算式目标相同，只是在标签处多一次拆分 |
| 将反编译器的算术表达式当作程序本意 | “该函数乘以 1717986919” | 这是第 34 课的惯用模式，一种工具折叠了它，另一种保留了它 |
| 将闭源工具描述得仿佛运行过 | “Binary Ninja 报告五个块” | 图和表都将其标为仅依据文档 |
| 采集结果没有命令 | “我们运行了 radare2” | 清单为每个文件记录版本、命令和日期 |
| 将不显式含标志位的 IR 视为有损提升 | “VEX 丢掉了标志位” | thunk 保存在 `cc_op`、`cc_dep1`、`cc_dep2` 中，在分支处求值 |

## 操作准则

Mỗi phần được thu thập một lần, ghi lệnh và phiên bản, tập hợp từng địa chỉ vào cùng một chuẩn, so sánh các chỉ dẫn bắt đầu, so sánh lại các khối, so sánh cuối cùng.

## 延伸阅读

- [Cifuentes, "Reverse Compilation Techniques", 博士论文，QUT (1994)](https://eprints.qut.edu.au/36820/)
- [Cifuentes and Gough, "Decompilation of Binary Programs", Software: Practice and Experience (1995)](https://doi.org/10.1002/spe.4380250706)
- [Van Emmerik, "Static Single Assignment for Decompilation", 博士论文，昆士兰大学 (2007)](https://espace.library.uq.edu.au/view/UQ:158682)
- [Schwartz, Lee, Woo, Brumley, "Native x86 Decompilation Using Semantics-Preserving Structural Analysis and Iterative Control-Flow Structuring" (USENIX Security 2013)](https://www.usenix.org/conference/usenixsecurity13/technical-sessions/presentation/schwartz)
- [Yakdan et al., "No More Gotos" (NDSS 2015)](https://www.ndss-symposium.org/ndss2015/ndss-2015-programme/no-more-gotos-decompilation-using-pattern-independent-control-flow-structuring-and-semantics/)
- [Basque et al., "Ahoy SAILR! There is No Need to DREAM of C" (USENIX Security 2024)](https://www.usenix.org/conference/usenixsecurity24/presentation/basque)
- [Andriesse et al., "An In-Depth Analysis of Disassembly on Full-Scale x86/x64 Binaries" (USENIX Security 2016)](https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/andriesse)
- [Flake, "Structural Comparison of Executable Objects" (DIMVA 2004)](https://dl.gi.de/items/7f573931-cb51-49ef-a12c-0452a9fb0ea4)
- [Maranzano and Bourne, "A Tutorial Introduction to ADB", Bell Labs (1977)](http://squoze.net/UNIX/v7/files/doc/18_adb.pdf)
- [Stallman, 关于 GDB 开始分发的 KTH 演讲（1986 年 10 月 30 日）](https://www.gnu.org/philosophy/stallman-kth.html)
- [Hex-Rays, "IDA: celebrating 30 years of binary analysis innovation"](https://hex-rays.com/blog/ida-celebrating-30-years-of-binary-analysis-innovation)
- [Guilfanov, "Decompiler internals: microcode", Recon Brussels 2018 （幻灯片）](https://www.recon.cx/2018/brussels/resources/slides/RECON-BRX-2018-Decompiler-internals-microcode.pdf)
- [Hex-Rays, 微代码视图与成熟度级别](https://docs.hex-rays.com/core/decompiler/how-tos/microcode-view)
- [Hex-Rays, IDA 9.4 发行说明](https://docs.hex-rays.com/release-notes/9_4)
- [Hex-Rays, IDA Free](https://hex-rays.com/ida-free)
- [Ghidra 发行版本 (12.1.4)](https://github.com/NationalSecurityAgency/ghidra/releases)
- [Ghidra P-code 参考文档](https://github.com/NationalSecurityAgency/ghidra/blob/master/GhidraDocs/languages/html/pcoderef.html)
- [Ghidra 反编译器源码、主工作流与 Action 类](https://github.com/NationalSecurityAgency/ghidra/tree/master/Ghidra/Features/Decompiler/src/decompile/cpp)
- [Ghidra analyzeHeadless README](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/RuntimeScripts/support/analyzeHeadlessREADME.md)
- [Binary Ninja, BNIL 概览](https://docs.binary.ninja/dev/bnil-overview.html)
- [Binary Ninja, "Architecture Agnostic Function Detection in Binaries" (2017)](https://binary.ninja/2017/11/06/architecture-agnostic-function-detection-in-binaries.html)
- [Binary Ninja, 批处理与无界面许可证](https://docs.binary.ninja/dev/batch.html)
- [Binary Ninja 6.0 "Krypton" 发布公告](https://binary.ninja/2026/09/03/binary-ninja-6.0-krypton.html)
- [Binary Ninja Free](https://binary.ninja/free/)
- [radare2 手册，ESIL](https://book.rada.re/emulation/esil.html)
- [radare2 手册，反编译器](https://book.rada.re/arch/decompile.html)
- [radare2 发行版本 (6.2.4)](https://github.com/radareorg/radare2/releases)
- [rizin, RzIL 设计说明](https://github.com/rizinorg/rizin/blob/dev/doc/rzil.md)
- [rizin 发行版本 (0.9.1)](https://github.com/rizinorg/rizin/releases)
- [Rizin 发布公告（2020 年 12 月 8 日）](https://rizin.re/posts/announcing-rizin/)
- [Cutter 发行版本 (2.5.0)](https://github.com/rizinorg/cutter/releases)
- [angr 文档，CFG 恢复](https://docs.angr.io/en/latest/analyses/cfg.html)
- [angr 文档，反编译器及其分析遍次](https://docs.angr.io/en/latest/analyses/decompiler.html)
- [angr 文档，中间表示（VEX）](https://docs.angr.io/en/latest/advanced-topics/ir.html)
- [PyPI 上的 angr (10.0.3)](https://pypi.org/project/angr/)
- [PyPI 上的 pypcode](https://pypi.org/project/pypcode/)
- [llvm-objdump 命令指南](https://llvm.org/docs/CommandGuide/llvm-objdump.html)
- [GNU objdump 手册](https://sourceware.org/binutils/docs/binutils/objdump.html)
- [LIEF 文档](https://lief.re/doc/stable/index.html)
- [Capstone 发行版本](https://github.com/capstone-engine/capstone/releases)
- [BinDiff 发行版本（v8，开源）](https://github.com/google/bindiff/releases/tag/v8)
- [Diaphora](https://github.com/joxeankoret/diaphora)
- [Hopper Disassembler 下载](https://www.hopperapp.com/download.html)
- [Compiler Explorer](https://github.com/compiler-explorer/compiler-explorer)
- [LLDB 宣布成为 LLVM 子项目 (2010)](https://blog.llvm.org/2010/06/new-lldb-debugger.html)
- [Boomerang 反编译器](https://boomerang.sourceforge.net/)
- [Tan et al., "LLM4Decompile" (EMNLP 2024)](https://aclanthology.org/2024.emnlp-main.203/)
- [Gao et al., "DecompileBench" (Findings of ACL 2025)](https://aclanthology.org/2025.findings-acl.1194/)
- [Liu, Raff, Micinski, "When LLM Decompilers Recompile More and Preserve Less" (2026)](https://arxiv.org/abs/2609.05370)
