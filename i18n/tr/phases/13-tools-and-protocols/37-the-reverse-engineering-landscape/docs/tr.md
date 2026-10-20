# 逆向工程全景:歷史、工具家族与反编译器的构建方式

> 五种工具读取相同目标文件,但给出四种地址,三种基本块计数,以及两种答案的相同交换.

**Type:** Build
**Languages:** Python, C, x86-64 汇编, Java（一个 Ghidra 脚本）
**Prerequisites:** Phase 13 · 32（从零构建 ELF）, Phase 13 · 33（反汇编与控制流）, Phase 13 · 34（提升为伪代码）
**Time:** ~150 分钟

## Öğrenme hedefi

- Bu alanın ana araçlarını 1973-2026 yılları arasında bir süre boyunca yerleştirerek, kendi ailelerini belirler.
- Çözümler: Ghidra, Binary Ninja, Hex-Rays, radar, rizin, ve her aşama için kullanılan kelimeler
- Bir emirle ESIL、RzIL、P-kod ve VEX olarak yükseltilmesini, hangisinin hemen işaretlenmiş olduğunu, hangisinin depolama işlemini yapıp yapıldığını açıklamasını yaparak.
- Beş çeşit aletin adreslerini bir araya getirir.`.text`偏移, ve bir işlevi üzerinde bu tür birleştirme onaylamak
- 构建读取已采集工具输出对比框架,报告指令起点、基本块、边和函数起点的一致性──
- Toplanan kanıtlara göre, her bir araçın kod üretmekte olduğu, kod kaçırmakta olduğu veya dolaylı olarak atlatmakta olduğu belirtildi.

## 问题

Bir ajanı istedin .`ledger-x86_64-O1.o`İçeride`grade`Bu işlemin bir araçta bulunması için üç listeyi okuyun ve rapor edin.`0x08000050`Diğer bir yer ise ...`0x400010`, III. içi yerleşik`0x100010` Bu nedenle, her bir fonksiyonun konumunda farklılıklar vardır.

实际上,工具的结论一致──该目标文件可重定位,没有加载地址,因此每个工具会自行选择一个地址──减去各工具赋予的地址──`.text`Tüm cevaplar da bu.`0x10`◊ ajan orijinal adresleri karşılaştırdı çünkü bu adreslerin her araçta anlamını gösteren hiçbir bilgi yok.

Sonra, bir ajanı buldu.`-O0`构建中 `grade`, rapor dört türlü araç ayrı ayrı 3、8、8、9 temel blok vererek. Bu dört sayı gerçek bir şekilde.`jmp rax`◊ İki çeşit araç yeniden konumlandırma yoluyla okuyucuyu atlamak için bir araç etiketleme amacıyla atlamakta temel blokları ayırır.

Bu sayılardaki herhangi bir sayıdan önce, bu dersin sağladığı haritalara ihtiyacınız var. Bölüm 32 ila 36  Dersler kodlayıcıları, yükselticileri, kanıt kayıtlarını ve yeniden inşa sonuçlarını anlamak için. Bu serinin ikinci yarısında bunları insanların gerçekte kullandığı araçlarla karşılaştırmak ve karşılaştırmak için. Bu nedenle, alanın tarihi, araçların ailesi, her bir anti-kompilatör tarafından gerçekleştirilen akıntıları ve kendi kendine düzenleyebileceğiniz hedef dosyalarda araç sonuçlarını karşılaştırmak için bir çerçeve oluşturmanız gerekir.

```figure
re-37-field-map
```

## Uzd日期串起五十三年

Bu alanın çoğu araçtan daha eski. Aşağıdaki her gün, bir kaynak bulabilirsiniz.

### 1973-1991: Önce düzenleyici, sonra da geri dönüş düzenleyici

İlk anti-kolapsiyon derecesi makalesi 1973 yılında yayımlandı. Bu makaleyi bugün insanlar tarafından anlamak için kullanılır.`adb`Öğrenim, bu düzenleyici 1979 yılında UNIX V7 tarafından yayınlandı.`DEBUG`İçinde 8086 反汇编器, 1981 yılının Ağustos ayında PC-DOS 1.00 发布──Richard Stallman'ın GDB  1986 yılında başladı 分发──SoftICE  1987 yılında将内核调试器带到DOS 下──

Sonra bir toplama işlemci ve bir geri dönüşüm düzenleyicisi ortaya çıktı. V Communications, 1988 yılında DOS programlarına yönelik bir çok işlem yaparak, bir liste oluşturarak yayımladı.`objdump`Ilfak Guilfanov, IDA'nın ilk satır kodunu 1991 yılının 1 ayında yazdı ve Mayıs 20 günü ortaklık yazılım biçiminde IDA 0.1 olarak yayınladı.

### 1991 yılından 2009 yılına kadar:交互式反汇编器与早期反编译器

Cristina Cifuentes 1994 yılında 7 月在 QUT 完成Reverse Compilation Techniques──她的反编译器 `dcc`i80286 DOS 程序ı C'ye dönüştürmek; 1995 yılında yayınlanan She & Gough'un makalesi, sonradan tüm anti-kompilatör kullanım aşamasını belirledi.

IDA 1996 yılında DataRescue'da işçi ürünler haline geldi, 1999 yılında ekleme SDK'ye katıldı, daha sonra 2005 yılında kurulan Hex-Rays'e aktarıldı. Hex-Rays Decompiler 1.0'ın 2007 yılında yayımlanması 17 Eylül 2007 tarihinde Mike Van Emmerik tarafından yayınlandı. Bu makalede SSA'nın SSA'yı sabit bir değer vermesi için bir tek çalışma yapıldı. Halvar Flake'in  İcra edilebilir nesnelerin yapısal karşılaştırması 2004 yılında BinDiff tarafından oluşturulmuş bir araç ailesi tarafından satılmaya başlandı.

Radar 2006 2 月, başlangıçta 64 bit çevrilişi destekledi. Radar2 LGPL 3.0'un modülasyonlı yeniden yazılı sürümünü kullanıyor.

### 2009 ~ 2019 yıl: framework & intermediary gösterimi

LLDB, 2010 yılında 6 月 8 日 olarak ilan edildi LLVM 子 projesi olarak. BIL 中间语言的二进制分析平台 BAP olarak kullanıldı. BIL CAV 2011 亮相. CAV 2011 亮相. BIL 中间语言的二进制分析平台 BAP olarak kullanıldı.

Angr'ın ilk satırı 2013 8 月〜Phoenix 论文(Schwartz、Lee、Woo、Brumley,USENIX Security 2013) 8.676 işlevi arasında 40 条yi koruyarak, ifadeyi korumak için yapılandırma yöntemini gösterdi.`goto`语句──DREAM(Yakdan 等,NDSS 2015) üstelik bu tür sistemlerin yapılandırılması da bu sistemlerin ortadan kaldırılmasını sağladı.`goto`语句。Vector 35 始于2015年1月14日成立,Binary Ninja 始于2016年7月23日开始销售,带有低级 IL 和 Python API。angr 发行于2015年公开发布,并获得2016年8月的DARPA Cyber Grand Challenge 中第三名。BinDiff 始于2016年3月改为免费。Cutter 1.0 始于2017年12月为radar2 提供Qt GUI。2018年,Guilfanov 在 Recon 发行Decompiler internals:microcode,首次公开介绍 Hex-Rays IR。

### 2019 ~ 2026 yıl: ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü ötürü

NSA, Ghidra 9.0'u Apache 2.0 lisansıyla yayınladı. Bir ay sonra GitHub'da yayınladı. Aynı yıl, Angr 8.19.2.4'e katıldı. İlk olarak, Binary Ninja 2.0'ı yayınladı. 20 Mayıs 2020'de, Yüksek Denizdeki IL Anti-Kompayoler yayınladı. Rizin, 12 Mayıs 2020'de, Cutter Ekibini daha sonra radare2'in bir parçası olarak ilan etti.

BinDiff 8 于 2023 年 9 月 25 日以 Apache-2.0 开源;;SAILR(Basque 等,USENIX Security 2024) became an 默认的结构化器,并主张仅删除多余的`goto`语句,因为 Linux 6.1 源码中原本就有3,754条──Binary Ninja 4.0 于 2024 年 2 月加入 免费版,IDA 9.0 则加入用于无界面运行`idalib`◊ öğrenme biçimi anti-kompilatör makalesi SLaDe(2023) gelişme ile LLM4Decompile(2024) ◊DecompileBench(2025), ve 2026 yılında iki çalışma, ayrı ayrı tartışmak ajanı 辅助的可读性,以及重新编译成功更多、语义保留却更少的反编译器──

Bu ders yürütülmesinin sürümü ise 2026 yılı 10 月 14 日 tarihine kadar sürüyor. Bu ders, Binary Ninja 6.0 Krypton

## 工具家族

工具按产出归类──同一程序可能跨多家族,而这种重叠正是大多数混的来源──

### Çözümcü

線性掃描 代碼節の第1字節から最後の字節まで解码され続けています.`objdump -d`和 `llvm-objdump -d`Tüm bunlar, tüm yapılandırma kontrol sistemleri değil.`objdump`2.47  26  7  26  2026  GPL-3.0 veya daha sonraki  LLVM 23.1.3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               `llvm-objdump`Apple LLVM sürüm 17.0.0 için gösterildi.

交互式反汇编器已知入口から回归下降,加入识别函数起点の启动式規則,并维护数据库──IDA Pro(处理器模块、自动分析队列、FLIRT 签名)、Ghidra(`Disassembler`Üstü Otomatik Analiz (Analyzer) 、Binar Ninja (((Binear Ninja)) ∞`aa`- Evet.`aaa`- Evet.`af`Cutter ve iaito ile birlikte (GUI olarak) tüm bu aileye aittir. Andriesse etg.) USENIX Security 2016'da, kompozisyoncu tarafından üretilen ikili sistemli dosyalarda dokuz araç ölçüldü.

### Çözümcü

商业反编译器包括:Hex-Rays Decompiler(x86'den RISC-V'nin 12种目标家族) 、Binary Ninja'nın HLIL 及其 Pseudo C 染,以及 Hopper'ın伪代码视图。开放反编译器包括:Ghidra 反编译器,即 Apache 2.0'ın C++ motorunu,r2ghidra 和 rz-ghidra'yı kullanarak,pypcode js'i kullanarak,bölgeci olarak kullanır;AIL'e dayanır; SAILR 结构化、BSD-2-Clause'i kullanarak,angr antidec编译器 kullanır; JavaScript'in r2 和 和 写的 r2 写的;以及 Boomerang'ın tarihi temsilcisi olarak kullanır.`dcc`Radare 2 daha içinde `pdc`,即用类 C 语法表示的伪反汇编输出──rizin 没有内置反编译器──rizin 0.9.1 中不存在 `pdc`- Emir,`pdg`需要 rz-ghidra 插件──

### 调试器

GEF ve pwndbg ön uç GDB'i (1986) ̊LLDB ̊2010) ̊带 Time Travel Debugging'in WinDbg ̊2017) ̊OllyDbg ̊2014 yılın durdurma güncellemesi) ̊x64dbg ̊GPL-3.0,2014) ̊带 Python 连接器'ın Ghidra Debugger ̊Binary Ninja 调试器, ̊radare2 ̊Rizin ̊内置调试器 ̊第 42 ̊ ders kendi yapı sonuçlarına göre kullanın.

### 2. İçeriği analiz çerçevesini

Vex IR 符号执行`CFGFast`和 `CFGEmulated`、反编译器)、BAP(BIL、OCaml)、Dyninst、Jakstab 和 ByteWeight 是 Andriesse 提到的框架──Ghidra 可通过 PyGhidra 作为库使用,Binary Ninja 通过`import binaryninja`,IDA      `idalib`- Evet.

### 格式库与引擎库

LIEF 1.0.0(2026 yıl 7 月 12 日,Apache-2.0)解析 ELF、PE、Mach-O、COFF 和 Android 格式。CLE,即CLE Loads Everything,是angr的加载器。Capstone 5.0.9(2026 yıl 5 月 28 日,BSD-3-Clause) Responsable解码;Keystone 0.9.2(GPL-2.0) Responsable汇编;Unicorn 2.1.4(GPL-2.0) Responsable仿真──radar2 6.2.4 捆绑 Capstone 5,rizin 0.9.1 附附 Capstone、Zydis 和 tree-sitter。

### 差异比较工具与编译器侧查看器 差异比较工具与编译器侧查看器

BinDiff 8(Apache-2.0) ve kullanılacak olan IDA Pro、Binary Ninja 和 Ghidra'nın BinExport 12 插件;`radiff2`和 `rz-diff`❖Compiler Explorer(BSD-2-Clause) gösterir.

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

Binary Ninja'nın Ücretsiz  Sürüm sadece x86、x86-64、ARMv7 和 AArch64, ve API yok。IDA Ücretsiz  IDAPython、SDK veya `idalib`Bu ders, bu iki araçla ilgili her bir açıklamayı, dosya ve yayın açıklamasından aldı.

## 逐阶段查看反编译器流水线 (BİRİ)

Cifuentes 1994 yılında bu aşamaları listeler:语法分析、语义分析、中间代码生成、控制流图生成、数据流分析、控制流分析和代码生成── onu makinelerle ilgili ön uç, makineler ve dilsiz orta uçlar ve dille ilgili arka uçlar olarak ayırmıştır.

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

### Kargolayıcı

Üreticiler çözücülere ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ haritalama ⁄ ⁄                                                                                                                                                                                                                                                                             `0x08000000`,使 `.text`位于 `0x08000040`Çünkü bu bölümler dosyalardan uzaklaşıyor.`0x40`Başlamak için.`.text`- Bırak .`0x400000`Ghidra'nın `ElfLoader`Onu bırakırsın.`0x100000`- Evet.`llvm-objdump`打印节内偏移,完全不使用基址──

Üreticiler için yeniden konumlandırma işlemleri de farklıdır. Ghidra, CLE, yeniden konumlandırma işlemleri için kullanılacak.`bin.relocs.apply=true`Bu davranışı değiştirebilir. Bu yüklemeci nasıl yeniden konumlandırılır, sonraki tüm aşamalarda ne göreceğinizi belirler.`-O0`跳转表中看到其影响──

### Çekil

Bölüm 33  Ders iki yöntem oluşturdu:`llvm-objdump`Dış, her türlü araç önce geri döner ve geri döner, tekrar fonksiyon başlangıç noktasını aramaya katılır. Biinary Ninja 文档顺序列列出这些阶段:Recursive Descent、Call Target Analysis、作为对未知区域进行线性反汇编的CFG Analysis,以及 Tail Call Analysis。Ghidra 按优先运行分析器,Disassemble Entry Points和Function Start Search位于前期──IDA 维护各有优先级自动分析队列,以及库代码的FLIRT 签名──angr的`CFGFast`文档列出函数起点的四个来源:符号、函数序言扫描、调用目标,以及剩余字节的完整扫描──最后一个来源正是在填充区的虚构函数的原因──

### CFG 恢复

Her araç 33'cü ders şeklinde temel parçaları ayırır, ama kendi ölçümlerinize göre bir fark vardır.`call`处结束基本块,因为它的IRSB是单进口多出口基本块,调用属于出口──Ghidra、radare2 和 rizin 则跨过调用继续处理──在调用`grade``-O0`版 `grade_label`Ü, öfke  rapor 2 个块, diğer üç tür rapor 1 个.

### 提升

Binary Ninja, daha düşük seviyedeki dilden tercüme edilmek üzere daha yüksek seviyedeki orta dil olarak görülecek olarak tanımlandı.`MMAT_GENERATED`- Ne ?`MMAT_LVARS`Bu nedenle, bu ikili Ninja, bir önceki dönemlerde bir önceki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir sonraki dönemlerde de bir dönemlerde de bir dönemlerde de bir dönemlerde bir dönemlerde de bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönemlerde bir dönem bir dönem bir dönem bir dönemlerde bir dönemlerde bir dönemlerde bir dönem bir dönemlerde bir dönem bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir dönemde bir döner döner döner döner döner döner döner döner döner döner döner döner döner döner döner döner döner döner döner

### SSA

Van Emmerik'in makalesinde SSA'nın anti-kompilatör olarak getirilen yetenekleri listelenmiştir: ifade yayılması  ABI ı gerektirmez                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     `Heritage`,并加入 sadece şablonda iki işleyiş var:`MULTIEQUAL`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `INDIRECT`❖ Binary Ninja ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖`Clinic`İçinde iki SSA aşaması vardır. Heks-Rays SSA olarak adlandırılmamıştır, ancak genel olarak kullanılır.

### Verim akışı ve türü

Ghidra 的主简化循环不断执行                                                                                                                                                                                                                                                         `Rule`Görevi tamamlanmak için: Heks-Rays 转换微代码,在 `MMAT_CALLS`检测调用实参,在 `MMAT_LVARS`Bölüm bölümü                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `CallingConventionAnalysis`- Evet.`VariableRecoveryFast`和 `Typehoon`Sonraki: Noonan、Loginov 和 Cok'un çok yönlü türü tahminleri gerçekleştirmek.

###  Yapılandırma

Ghidra'nın `CollapseStructure`搜索匹配某种结构的子图,将其折叠为一个节点; 遇到无法继续的情况时,删除一条边并标记为非结构化──Hex-Rays将CFG归约为`if`- Evet.`while`- Evet.`do`和 `switch`, üye kalanı hazır 区域──angr 识别单入口、单出口区域,默认使用 `SAILRStructurer`结构化,也可选择 `PhoenixStructurer`和 `DreamStructurer`34. Sınıf bir yapılandırma makinesi yazmış.

### 输出

Ghidra `ActionNameVars`和 `ActionSetCasts`Sonra, geçiyor.`PrintC`配合 Oppen 美化打印器输出 C token──Hex-Rays 美化并打印 ctree──Binary Ninja HLIL 染为 Pseudo C、Pseudo Rust 或 Pseudo Python──angr 返回`codegen.text`Radare2 打印 `pdc`- Evet.`pdd`Ya da`pdg`- Evet.

## Aynı emirde dört IR vardır.

Çekil`48 83 ec 10`,即 `subq $0x10, %rsp`◊ 33                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

1. `48`Evet .`W = 1`REX'in 64 numaralı operatörlüğü var.
2. `83`ModRM'nin düzenli 字段选择操作──
3. `ec`Evet ModRM `11 101 100`- Evet.`mod = 11`寄存器形式を表示します.`reg = 101`Evet .`/5`,即 `sub`- Evet.`r/m = 100`Evet .`%rsp`- Evet.
4. `10`Evet, 16'a kadar.

Bu dört metni dört yükseltme makinesine vererek test aletinde kesin emir ve tam metni saklıyor.

Radar2 6.2.4 ESIL 30 simge içerir.

```text
16,0x8000000000000000,-,!,16,rsp,-=,63,$o,^,of,:=,63,$s,sf,:=,$z,zf,:=,$p,pf,:=,64,$b,cf,:=,4,$b,af,:=
```

Bir makine.`16,rsp,-=`İlk olarak, her işareti iç operatörden yazıyor:`$o`Gösterme,`$s`Çekilme,`$z`0 gösterir,`$p`Çıkışlı bir şekilde,`$b`Gösterme.

RZIL 0.9.1'in RZIL'i 14'e sahip bir RZIL'dir.`set`效果的 S ifadesi:

```text
(seq (set op1 (var rsp)) (set op2 (bv 64 0x10)) (set sub (- (var op1) (var op2))) (set rsp (var sub))
     (set _result (var sub)) (set pf (! (lsb (let _val (cast 8 false (var _result)) ...))))
     (set zf (is_zero (var _result))) (set sf (msb (var _result))) ... (set cf (|| ...)) (set of (|| ...)) (set af (|| ...)))
```

Her işaret noktası, bir nokta ve bir nokta üzerinde bir ifade.`let`- Evet.

通过 pypcode 4.0.1 从 SLEIGH 规范 `x86:LE:64:default`Ürünlü P-kod, `IMARK`Son dokuz işlem var:

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

Bu bir grup kaydetme cihazı, geçici değerler yer alır.`unique`空间──标志位在命令处立即计算,并且 `CF`和 `OF`Yükleme yapma.`RSP`Önceden hesaplanmıştı.

pyvex 10.0.3 生成の VEX `IMark`后有七条语句:

```text
t2 = GET:I64(offset=48)
t0 = Sub64(t2,0x0000000000000010)
PUT(offset=144) = 0x0000000000000008
PUT(offset=152) = t2
PUT(offset=160) = 0x0000000000000010
PUT(offset=168) = 0x0000000000000000
PUT(offset=48) = t0
```

Bu durumda hiçbir işaret yerleri yok. Vex   寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄存器 寄`rsp`△ 偏移 144 至 168 分别为 `cc_op`- Evet.`cc_dep1`- Evet.`cc_dep2`和 `cc_ndep` 6.4 bit eksikliği, ayrıca iki işlem.`pcode.writesFlags`Gerçekler için.`vex.computesFlags`VEX'in yanlış olması, dört farklı ifade arasında en kısa nedenidir.

Aynı şekilde dört tane yükseltme cihazı kullanılacak.`48 63 c7`,即 `movslq %edi, %rax`(`-O1`Aşağı`grade`İlk emir, 5 ESIL simgesi elde et.`32,edi,~,rax,=`) 、1 个 RzIL `set`、1 个 P-kod 操作(`RAX = sext(EDI)`) ve 4 条 VEX 语句── hiçbir yükseltme cihazı işaretleme alanına yazılmamıştır, çünkü bu talimat kendiliğinden işaretleme alanına da değinilmez.`(register, 0x0, 8) INT_SEXT (register, 0x38, 4)`:寄存器偏移 0 是 `RAX`,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `0x38`Evet .`RDI`,大小分分为 8 和 4 字节──

`grade`边界检查中的 `83 f9 04`,即 `cmpl $0x4, %ecx`30 ESIL simgesi üretmek için 13 RzIL .`set`效果、10 个 P-code 操作, yanı sıra 7 条 VEX 语句, sonrakiler `cc_op`为 7, 32 bit eksikliği gösterir.`%ecx`◊ VEX'de karşılaştığınız iki farklı kısaltma genişliği: 32 位对应 7,64 位对应 8; inşa ettiğiniz çevirmen bu tabloyu koruyacaktır¬

## Bir fonksiyonun dört adresi

Çerçeve karşılaştırmaya başlamadan önce, önce bir fonksiyon konumunun tanımlanması gerekir.`ledger-x86_64-O1.o`Orta `grade`Bir kez yapıyorum.

| 工具 | `.text` 地址 | `grade` 地址 | 偏移 |
|---|---|---|---|
| `llvm-objdump` | `0x0` | `0x10` | `0x10 - 0x0 = 0x10` |
| radare2, rizin | `0x08000040` | `0x08000050` | `0x08000050 - 0x08000040 = 0x10` |
| angr | `0x400000` | `0x400010` | `0x400010 - 0x400000 = 0x10` |
| Ghidra | `0x100000` | `0x100010` | `0x100010 - 0x100000 = 0x10` |

符号表表明,`grade`位于 `.text + 0x10`,大小为 46──去掉基址后,所有工具都一致──框架从各分采集结果读取基址:radare2 和 rizin 的 `iSj`、r 采集结果的 、r 采集结果的 、r 采集结果的 、r 采集结果的 、r 采集结果的 、r 采集结果的 、r 采集结果的 、r 采集结果的 、r 采集结果的 、r 采集结果的 、r 采集结果的 、r 采集结果的 采集结果的 、r 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的`.text`节条目、Ghidra 采集结果的 `.text`İç depo blokları, ve 線性扫描的基址为零──测试 `test_every_tool_places_grade_at_offset_0x10_from_its_own_base`Bu gerçekle ilgili kesin bir kanıt.

## 工具在哪里一致,在哪里分歧

`code/main.py`Çerçeve Okuyucu: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerçeve: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çerce: Çer: Çer

### Birliği örneği: - O1 Aşağıdaki defter

Dört fonksiyon, linear tarama içinde 56 条 talimat vardır, bunlardan simge aralığında 54 条, doldurma bölgesi 2 条. Her bir araç her fonksiyonda aynı talimat başlama noktasını rapor eder: ayrılığı 9、14、13、18 个.`total`Beş blok ve beş sekiz kenarında 33'ü ders el çizimleri var.

唯一差异在填充区──函数间 3 个字节(`grade`Sonraki`66 90`- Evet.`total`Sonraki`90`) tarafından çizgi tarama tarafından çözülmüştür çünkü durdurulmak için bir neden yok; öfke de onları çözmüştür ve simgeler olmadan oluşturulmuştur.`sub_40003e`和 `sub_40005f`▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽

### Ölçeklendirme durumları: - O2 Aşağıdaki defter

Dört yapıtı içinde,`total`t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t

### 跳转表:-O0 下的级

Bu araçlarda ayrımlar ortaya çıkıyor, ayrımlar ise kendiliğinden bu dersin en önemli noktasıdır.

| 工具 | 基本块 | 边 | 采集结果的说明 |
|---|---|---|---|
| radare2 | 3 | 2 | `0x62` 处的块没有后继；从未到达 `0x76` 至 `0x9a` 的字节；缺少 8 个指令起点 |
| rizin | 8 | 11 | `0x62` 处的块带有 `switch_op`，其中有 5 个 case 和 4 个不同目标 |
| angr | 8 | 7 | case 块存在，`0x62` 处的控制转移指向一个无法解析的目标节点 |
| Ghidra | 9 | 12 | `0x74` 处的 `switchD` 标签拆分了块；四条 `COMPUTED_JUMP` 流分别指向 `0x76`、`0x7f`、`0x88`、`0x91` |

Düzgün bir konuma ulaşmak için, dört araç çözücü aynı 33 madde talimatları vardır.`jmp rax`,留下 36 字节未认领,框架将这个范围标为遗漏代码――rizin 和 Ghidra 找到了四个不同的目标,即第33 课从 `.rela.rodata`Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç`grade`Bu durumda, bloklar, hala, onların kenarlarına doğru atlamaktan kaçınmaktadır;`0x62`处的转移记录为指向无法解析的目标节点,反编译器则印计算式 处的转移记录为指向无法解析的目标节点,反编译器则印计算式 处的转移记录为指向的目标节点,反编译器则印计算式 处的转移记录为指向无法解析的目标节点,反编译器则印计算式 处的转移记录为指向的转移记录为指向的转移记录为指向的转移记录为指向的转移记录为指向的转移记录为指向的转移记录为指向的转移记录为指向的转移记录为指向的转移记录为指向的转移记录为指向的转移记录为指向的转移记录为指向的转移记录为指向的转移记录为指指指向的转移记录为指指指指指向的转移的转移记录为指指指的转移记录为指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指指`goto` Aynı kontrol akışına göre, Ghidra rizin çok bir blok ve bir kenar, çünkü onun anahtarı  analizi `jmp rax`Üstüne etiket yerleştirildi, temel blok modeli etiket bölümünde yeni blok başlayacak.

Bölüm 33'ün çizgisinde 8 blok vardır. 11 条 边──rizin onunla tamamen uyumludur.

### 代码中的数据:sweep-trap

`lookup`长 24 字节,在 `0x10`处包含 4 个表数据字节 `31 c0 90 48`◊ Linear scan ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊   ◊ ◊ ◊   ◊ ◊                                                                                                                                                                                                         `0x10`- Evet.`0x12`- Evet.`0x13`Çoktan çıkmıştım.`0x14`Bu da 33'üncü ders.`addq $0x1, %rax`提前一个字节──radare2、rizin 和 Ghidra 报告 6 个起点、2 个块、1 条边,并将 `0x10`- Evet .`0x14`留作未认领──rng对对 `lookup` rapor aynı 2 blok ve 1 条边, sonra da  図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書`sub_400010`Bir 4 字节块中 2 条命令,块结束于 `0x14`Yani ...`lookup`İkinci bloktan bir başlangıç noktası, bu yüzden.`0x13`处的REX 字节不属于任何指令. 框架对此目标文件的最后一个发现是,没有图构建器解码.`0x10`- Evet .`0x14`Bu nedenle, fonksiyonun içindeki bu şifreler veriymiş.

### 按工具统计 构造与遗漏

Dört hedef dosyasında, framework, her biri doldurma bölgesi veya tuzağındaki dokuz simgesiz işlevi oluşturduğunu belirtir.`-O0`Aşağı`grade`36's case 字节── it points out lineary scan decode── but no drawing constructor views the code as 9's range: eight filling gaps plus traps  table── no tool is reported missing function──

## Üç çeşit Analogue

Toplanan araçlardan üçü vardır.`-O1`Aşağıda `grade`输出类C 文本──源码是带五个案的 `switch (score / 10)`,编译后成为边界检查和回归值表──

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

10.0.3 oranı:

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

Radare2 6.2.4, `pdc`- ...

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

结合流水线阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅 阅 阅读 阅读 阅 阅 阅读 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅    阅 阅 阅   阅 阅       阅    阅 阅   阅 阅 阅                      阅                           `0x66666667`和右移 34 位                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `param_1 / 10`Bu da 34'ünci sınıfın alışkanlıklı kullanımı.`a0 * 1717986919 >> 0x22`Radare2'ün`pdc`Evet ESIL 仿真加伪语法:寄存器名, 没有变量和类型,边界检查在无符号减法后印为`<= 0`Ghidra 通過 `DAT_001000b4`Gösterme ve verilecek türler için açıklama`g_4000b4[4]`Kaynak kodunun beş elementü var ama dört tane var. Gidra ve Angr'ın hiçbir geri dönüşü yok.`-O1`Bu yüzden, bu değişikliğin devamı.`-O0`Aşağı,Ghidra 打印带 case 6 to 10 ve default `switch(param_1 / 10)`,angr 则打印计算式 `goto`- Evet.

Rizin  kendi anti-kompilatörü yok, toplama kayıtları bunların olmadığını gösterir `pdc`❖ Binary Ninja'nın HLIL 和 Hex-Rays ctree is本课未能采集的两种输出──

## 动手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/37-the-reverse-engineering-landscape
python3 code/main.py
```

输出 bir JSON raporu vardır. Başta bir tool version verilir. Bu bir tool version verilir. Bu bir tool version verilir. Bu bir tool tool version verilir. Bu tool tool listesi, bir tool listesi verilir. Bu tool listesi, bir tool listesi verilir.

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

按以下顺序阅读 `code/main.py`- ...

1. `read_text_symbols()`读取节头以及 `.text``STT_FUNC`符号――符号表是框架唯一的真值依据,`TextSection.gaps()`Bu yüzden bu bölgeyi doldurmak için öneriler yapıyorum.
2. `parse_objdump()`- Evet.`parse_r2_family()`- Evet.`parse_angr()`和 `parse_ghidra()`Her birimizin bir araya gelmesi sonuçları değişir.`ToolView`: içerir kilit adresleri, uzaklıktan uzaklıkta gösterilen yönlendirmeler ve her işlevi karşılayan`FunctionView`, içinde bir parça vardır ∞ ve mevcut olabilir ∞ karşı tercüme metni ∞. Her çözücü sadece bir araç kelimesini bilir, diğer araçları içermez ∞.
3. `majority()`和 `ranges()`Her karşılaştırma için iki yardımcı fonksiyon kullanılır.
4. `function_report()`Önceki talimat başlangıç noktası ile grafik yapılandırıcısının çoğu sonuçları karşılaştırın, temel blok sayısını ve kenar topluluğunu karşılaştırın ve her araç eksik olan içeriği listelenin.
5. `byte_report()`Her bir karakterin karakter içindeki kodlara ʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔʔ
6. `findings()`Bu sonuçları cümle olarak çevirirken,`compare()`Her hedef dosyası bir rapor oluşturur.
7. `decode_small()`- Evet.`to_pcode_like()`和 `to_vex_like()`构成翻译器:三种寄存器形式的编码, 一种立即计算风格, 一种沉思的风格──
8. `observed_ir()`测量采集的提升结果,`figure_data()`组装时间线、阶段表和图中展示的证据──

Üç emir var.`python3 code/main.py compare FIXTURE.o`印单个目标文件报告――`python3 code/main.py ir 4883ec10`Bir emir üretilen iki biçim için 打印翻译器`python3 code/main.py figure-data`印嵌图中的数据──

采集由 `code/fixtures/capture_tools.py`Bir kere tamamlandı, orada.`captures.json`İç kayıt her emir ve sürüm. Çerçeve ve test başlatılmamış araçlar. Eğer bu araçları yükledersen, bir yazı kitabı toplayabilir, yeni dosyaları bulabilirsin.

## 实际使用

Yeni hedef dosyaları için aşağıdaki sırada çerçeve yapılacak:

1. Kendini oluştur hedef dosya ve kaydet bir düzenleme emri.
2. Bir kez bir kez her bir araç için bir arayüzsüz modelde oluşturulur.
3. 检查基址──选择一个函数,确认减去各工具的 `.text`Adres sonrasında, her araç aynı yönde konumlandırılır. Eğer bir araç eşleşmezse, yüklendiğini durdurup tespit et.
4. Eğer bir tasarımcı bu noktada uyumsuzsa, sonraki karşılaştırma analiz değil çözme konuları tartışılır.
5. Temel blok ve kenar karşılaştırın, değerlendirme sayısında önce her aletin notlarını okuyun.`switch_op`- Evet.`COMPUTED_JUMP`Ya da çözülemez hedef noktaların çoğu farklılıkları açıklayabilmektedir.
6. 逐字节统计──工具认领填充区,说明启动式规则正在起作用──工具留下符号字节,说明遍历停止了──没有图构建器认领的符号字节是数据──
7. Kayıtların açıklamasına göre hangi araçların çalışmadığını yazmak yararlı, ancak elde edilen sonuçlar farklı türde kanıtlara bağlıdır.

## 交互实验

### 实验 A:一个函数,四种基址

- Evet .`code`Şimdi Python'u aç:

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

运行第二行前,先写下四个原始地址,并对照本课的表格检查──随后将 `grade`替换为 `grade_label`- Ghidra'nın ortasında.

### 实验B: dört açıdan izle

```python
report = compare("ledger-x86_64-O0.o")
report["functions"]["grade"]["blocks"]
report["functions"]["grade"]["edgesMissingPerTool"]["radare2"]
report["notes"]["rizin"]
report["notes"]["ghidra"]
report["bytes"]["radare2"]["misses"]
```

统计雷达2 缺少边,将每条边与第 33 课 `-O0`列表中的一行对应起──随后阅读 Ghidra 注记,并在 Ghidra 采集结果中找到 `switchD`Etiketler:

### 实验 C:立即计算标志位与 

```python
translate("48 83 ec 10")["pcodeLike"]
translate("48 83 ec 10")["vexLike"]
translate("83 f9 04")["vexLike"]
{row["name"]: (row["pcode"]["ops"], row["vex"]["statements"]) for row in observed_ir()["instructions"]}
```

İki çıkışta bul .`cc_op`常量,并解释为什么一个是8 ,另一个是7 .`translate("48 01 c8")`Ve okudu .`TranslateError`- Evet.

### D: Beş çeşit araç altında bir tuzak

```python
report = compare("sweep-trap.o")
report["functions"]["lookup"]["instructionStarts"]
report["bytes"]["dataInsideSymbols"]
report["functionStarts"]["angr"]
```

Kağıt üzerinde çizgi çizgi çizgi biçimi`31 c0 90 48 83 c0 01`, tekrar`jmp`后递归下降方式解码──将两列表与框架报告的余额和缺失起点对应而起──

## 实践实验

加入第五份采集结果并扩展框架──

要求:

- Bu derslerin bir tanesini seçin.`objdump`、LIEF 搭配 Capstone、手動导出的二进制忍者自由会话,或使用不同分析器集合的Ghidra──采集它在全部四个目标文件中输出,并`captures.json`İç kayıtlar, kesin emirler ve sürümler.
- 编写一个解析器,将采集结果转换为 `ToolView`, araçların temel adreslerini, talimatlarını, fonksiyonlarını ve araçların sağlanmasında temel blokları ve kenarlarını içerir.
- Ürünleri ekle`TOOLS`Eğer yapılırsa, de katıl `DESCENT_TOOLS`◊ Çekim gösterisi, çoğu koleksiyonun hangi değişiklikler olduğunu görün.
- 编写一个测试,断言工具在 `ledger-x86_64-O1.o`Ünlü temel blok sayısı; bir test yeniden yazın, nasıl bir tuzağa düştüğünü söyleyin.
- Bu derste bir kısım yazın, araçla kendi terimlerini kullanarak yüklemeci, karşılama ve CFG nasıl adlandırıldığını açıklayın.

Başarılılık standartları:`python3 code/main.py`- Evet .`captureTools`Yeni araç rapor`ledger-x86_64-O1.o`Her bir işlevi tutmak `allDescentToolsAgree`Doğru, ve `sweep-trap.o`Yeni araçların nasıl işlediğini açıklayan bir bulgu`0x10`- Evet .`0x14`Yazı:

## 本课产物

本课包含 `outputs/skill-the-reverse-engineering-landscape.md` Kullanıldığında, oluşturduğunuz bir hedef dosyada çeşitli araçları kullanır, adresleri aynı kılavuzlara birleştirilir ve işlevler tarafından, emir başlangıç noktaları, bloklar ve kenarlarındaki uyumluluklarını, ayrıca her bir araçın yapım veya atılmasının karakterlerini rapor eder.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/37-the-reverse-engineering-landscape
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明:

- ELF 读取器在 `ledger-x86_64-O1.o`İçinde 16、46、31、63'lik dört işlevi simgesi bulun ve iki boşluk bul.
- Dört hedef dosyasının sonuçları 86,56,84-11 条 talimatları içerir.
- Radare2 和 rizin 在 `ledger-x86_64-O1.o`Üst rapor aynı yönlendirme, blok ve kenar, ve sadece radar var.`pdc`文本
- Öfke`sub_40003e`和 `sub_40005f`标为没有符号的函数
- Ghidra için`total`Bölünen bloklar 33 numaralı sınıfın beş parçasıdır.
- Her aletin yerini çıkarıp, her aletin yerini çıkarır.`grade`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `0x10`
- Her türlü alet için .`ledger-x86_64-O1.o`Her fonksiyonun her emri uyumlu bir şekilde başlar
- Dört tane grafik yapılandırıcı, 3、3、5、4 blok ve 2、3、5、4 条边, ve 边集合 aynı rapor
- `-O2`Aşağıda `total`Her bir tasarımcıda 10 blok ve 13 条 边 vardır .
- `-O0`Aşağıda `grade`Radar2 、Rzin、Angr、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Ghidra 、Gidra 、Gidra 、Gidra 、Gidra 、Gidra 、Gidra 、Gidra 、Gid 、Gid   √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ 
- `-O0`Aşağıda `grade_label`Tüm araçlar arasında tek bir blok vardır. Sadece bir tek parçası vardır.
- Angr her boşluğu doldurmak için bir işlevi oluşturur ve bir işlemi tekrar oluşturur. Diğer araçlar için bir işlevi oluşturulmaz.
- 線性掃描                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `0x10`- Evet.`0x12`- Evet.`0x13`Kaybolmuş .`0x14`, ve yapılandırıcı çözücü yok .`0x10`- Evet .`0x14`
- 发现列表指出 radar2 遗漏的范围和 angr 臆造的每个函数
- 清单为全部 21 采集文件记录版本和命令
- Üç çeşit araçlar`grade`, sadece Ghidra 折叠除法 üye üye mode
- 翻译器 One kind风格立即写入 CF、OF、SF、ZF、PF, diğer türlü写入 `cc_op`- Çöp için`cmp`Yazmak için kaydetme cihazı.`movslq`Not Not Not Not Not Not Not Not Not Not Not Not Not Not Not Not Not Not Not Not Not Not
- 翻译器拒绝内存形式、其他操作码、额外REX 位和错误长度
- 翻译器的  çevirmen`cc_op`Numara 8 ve 7 toplam VEX ile aynı
- 采集的提升结果对三条指令分别给出9、1、10 个P-code 操作和7、4、7 条 VEX 语句
- 时间线按顺序从1973年延伸至2026年,流水线有八阶段和六种工具,每个单元格都有术语,两个闭源工具标为未运行
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

## Çevre üretim başarısızlık modeli

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

## Operasyon kuralları

Her türlü araç bir kez toplanır, kayıt emirleri ve sürümleri, her adresin aynı temel noktaya birleştirilmesini, önce talimat başlangıç noktasına, tekrar karşılaştırma bloklarına, son karşılaştırma kenarına, her bir bölümün kabul edilmiş, doldurulmuş, veriler veya kayıplara ait olmasıdır.

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
