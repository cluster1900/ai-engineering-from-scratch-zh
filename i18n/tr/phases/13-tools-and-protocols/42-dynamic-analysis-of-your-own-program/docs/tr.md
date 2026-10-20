# 动态分析自己的程序:调试器、跟踪与静态结论的验证

> 断点命中只是对某构建的运行观察――本课构建测试驱动器,将这些观察转换为针对静态分析课程结论的已确认已反驳和未观察判定──

**Type:** Build
**Languages:** Python, C, arm64 assembly, lldb command language
**Prerequisites:** Phase 13 · 33（反汇编与控制流）、Phase 13 · 35（证据、置信度和未知项）
**Time:** ~130 分钟

## Öğrenme hedefi

- 解释调试器 on Linux 上 hangi işletim sistemlerine ihtiyaç duyar?`ptrace`MacOS'ta hangi destek gerekiyor? (Mac 任务端口和异常端口), ayrıca "沙箱中的 shell neden başlatılamıyor?
- 按名称和清单地址 设置软件断点,设置硬件观察点,并理解处理器对两者施加的限制──
- Python'dan, bir paket işlem modusu ile çalıştırılan lldb, durdurma 子'u kullanarak, her durdurma sırasında kaydetmiş kaydeticiler, bellek ve  değişimleri, ve konuşma kaydetmiş zaman çizgisini çözecek.
- Bu zaman çizgisinin kontrolü için 32,34,41 dersinin statistik sonucu: parametre寄存器、结构体字段偏移、条件分支实际走过边,以及发生调用──
- - Evet .`-O2`Bu, neyi kanıtlayabileceğini, neyi kanıtlayamayacağını açıklıyor.
- 保存和加载核心文件,并指出式核心 遗漏了什么──
- Gösterim: GDB ve LLDB`strace`- Evet.`ltrace`- Evet.`bpftrace`- Evet.`dtrace`和 `rr`放到正确的操作系统,并说明版本和许可证──
- MacOS'un hangi kod imza koşulları LLDB'nin kendi kendini oluşturan ikili sistemleri test etmesine izin verdiğini ve iki tür durumunu reddettiğini açıklayın.

## 问题

第41 课从 DWARF 读取 `struct account`, belirtti`balance`位于偏移 4──第 33 课构建 `classify`Bu yüzden, ilk bölümü,`return -1`块──第 32 课指出前两参数通过 `x0`和 `x1`传入──每句都从字节推导而来,没有一句来自实际观察──

Sonra bir ajan 阅读同程序并报告:`bump`- Evet.`classify`和 `sum_balances`                                                                                                                                                                                                                                                              `-O2`构建程序,每个函数设置断点并运行;;进程印四行后退出,所有断点都报告 `hit count = 0`- Evet.

Çevre koduna yönelik bir kararın yanlış olmadığı, yanlış kullanıcıların oluşturduğu soruların yanlış olduğu belirlenmiştir.`sum_balances(rows, 3)`Bu makinede bu ikili sistemin gerçek durumunu bilmek için, düzenleyici altında çalışmak ve gözlemlemek gerekir.

Bu ders, bir çalışma yapma ve bir çalışma yapma yöntemi oluşturur.`account.c`,读取清单,规划一次 LLDB 会话,运行并根据停止时显示的信息评判每个静态结论――判定有三种结果:`confirmed`Bu operasyon için bir sonucun durdurulduğunu göstermek;`refuted`Bir durdurma kanıtlaması geçerli değil;`not-observed`Bu nedenle, bu konuyla ilgili bir karar verildiğinde, bu kararın, bir karar verildiğinde, bir karar verildiğinde, bir karar verildiğinde, bir karar verildiğinde, bir karar verildiğinde, bir karar verildiğinde, bir karar verildiğinde, bir karar verildiğinde, bir karar verildiğinde, bir karar verildiğinde, bir karar verildiğinde, bir karar verildiğinde, bir karar verildiğinde, bir karar verildiğinde, bir karar verildiğinde, bir karar verildiğinde, bir karar verildiğinde, bir karar verildiğinde, bir karar verildiğinde, bir karar verildiğinde, bir karar verildiğinde, bir karar verildiğinde, bir karar verildiğinde, bir karar verildiğinde, bir karar verildi.`controlled-replay``observed`Kayıt.

```figure
re-42-run-timeline
```

## 调试器是三项系统服务加一张表

调试器, kod sahibi olmayan süreçlere dört şey yapar: durdurma süreci, okuyucu kaydetme süreci, okuyucu kaydetme süreci ve bilerek yeniden durdurulması.

Linux'ın üst hizmetleri `ptrace(2)`手冊说明, bir sürecin takipçisinin diğer sürecin icrasını gözlemleyebilmesi ve kontrol etmesi için bir yol sunar.`PTRACE_TRACEME`让子进程声明其父进程将跟随它;`PTRACE_ATTACH`                                                                                                                                                                                                                                                              `PTRACE_PEEKDATA`读取被跟踪进程内存中 addr 地址处的一个字;`PTRACE_GETREGS`读取寄存器;`PTRACE_SINGLESTEP`执行一条指令──Yama 模块限制附加操作:`/proc/sys/kernel/yama/ptrace_scope`默认值 1 anlamı  目标进程 must be the later generation process of the调用or 2, 表示只管理员可附加,3 表示任何人都不能──

macOS `ptrace`接口较小──Apple 手册列出 `PT_TRACE_ME`- Evet.`PT_ATTACHEXC`- Evet.`PT_STEP`- Evet.`PT_CONTINUE`和 `PT_KILL`,并说明使用 `PT_ATTACHEXC`时,子进程的信号以马奇异形式传给父进程──内存和寄存器根本不经过 时,子进程的信号以马奇异形式传给父进程──内存和寄存器根本不经过 时,子进程的信号以马奇异形式传给父进程──内存和寄存器根本不经过 时,子进程的信号以马奇异形式传给父进程──内存和寄存器根本不经过`ptrace`❖ İlldb `debugserver`调用 `task_for_pid()`获取进程的Mach 任务端口,然后调用 `task_set_exception_ports()`, sistem koruma süreci için kesintiyi anormal haber biçiminde gerçekleştirmek .`taskgated`Kimin kullanacağını belirle`task_for_pid`- Evet.

Bu ders için bir kayıt bu tasarımın fiyatını göstermektedir. Bu proje, bir sandalye altında çalışmaktadır. Aynı planın sandalye dışında bir kez durdurulması ve sandalye içinde aşağıdaki sonuçlar elde edilmektedir:

```text
(lldb) run
error: process exited with status -1 (attach failed ((os/kern) invalid address))
```

进程 has been created, but cannot be taken over by the调试器. 进程 has been created, but cannot be taken over by the调试器. 进程 has been created, but cannot be taken over by the调试器. 进程 has been created, but cannot be taken over by the调试器. 进程 has been created, but cannot be taken over by the调试器. 进程 has been created, but cannot be taken over by the调试器. 进程 has been created, but cannot be taken over by the调试器. 错误 involves the调试器's power, cannot explain the process itself has any problems. 进程 itself has any problems. 进程 itself has no problems. 进程 will record it for start failure, stop times for zero, no determination.

Çönem, kendi yerini hatırlamak için hangi adreste hangi emir şifresini değiştirdiğini hatırlamak için, orijinal içeriği yeniden başlatmaya devam etmek için, konumlarına göre toplam yaşam süresi sayısını hatırlamak için.`breakpoint list`Bu tabloyu basın, motor her seferinde çalışırken okur.

## 断点:替换一个字节或一个字

软件断点是处理器会陷入异常命令,它覆盖目标停止命令的起始字节──x86-64 使用 `INT3`, Operasyon kod`CC`,长度为一个字节,Intel 手册描述其用途为调用调试异常处理程序──arm64 使用 `BRK #imm16`,一条四字节指示,其异常 EC 值 0x3C 将异常记录到ESR_ELx──Arm 手册还说明,首选返回地址就是`BRK`Bu nedenle, durdurma raporunun yerine yeni bir emir gönderildiği yerden, aşağıdaki yerden değil, adres olarak belirlenmesi gerekir.

İsim belirtilmesiyle, başlıkları atarak şöyle başlar:

```text
(lldb) breakpoint set -n bump
Breakpoint 1: where = account-O0`bump + 12 at account.c:13:19, address = 0x00000001000004bc
```

`bump + 12`Bu benim için bir emir.`sub sp, sp, #0x10`- Evet.`str x0, [sp, #0x8]`和 `str w1, [sp, #0x4]`, yani DWARF 行号表归功于函数起始行的建立代码──停止时,`x0`和 `x1`始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始始

Adres ayarlamalarına göre, adresin hangi modülün içinde olduğunu bilmem gerekmektedir.`breakpoint set -a 0x100000504`İlk testte, tüm çalışmalar sırasında devam etti.`unresolved`, ve `hit count = 0`◊ Motor kullanımı biçimi:

```text
(lldb) breakpoint set -a 0x100000504 -s account-O0
Breakpoint 4: address = 0x0000000100000504
```

Kullanım`-s`后,该数值表示 `account-O0`內文件地址,lldb 加上加载偏移,运行后该位置显示 `resolved, hit count = 2`◊ 33 ıssı'nın listesi dosya adresini verir, bu nedenle bu biçim hareketli listesi hareketli durdurmaya bağlanır.

### Çözüm:

`-O0`Aşağı`classify`İlk şartı da bu.`0x1000004f0`处的字 `36f800a8`- Evet .`llvm-objdump`Bu yüzden basıyorum.`tbz w8, #0x1f, 0x100000504`❖ Arm A64'e göre `TBZ`- Çıkar.

1. 位 31 是位编号的高位 `b5`, değerı 0
2. 位 30 〜 25  `011011`, test并分支 instruction组──位 24 为 0,选择 `TBZ`Hayır.`TBNZ`- Evet.
3. 23'ten 19'e kadar olan yerler, sayıdaki alt beş yer.`b40`- ...`11111`= 31 结合`b5`= 0, test edilen 31 bit, yani 32 bit değerinin bir simgesidir.
4. 位 18 至 5 `imm14`- ...`00000000000101`= 5 ⋅分支偏移为`imm14 * 4`= 20 = `0x14`Bu yüzden hedefimiz`0x1000004f0 + 0x14 = 0x100000504`- Evet.
5. 位 4 至 0 `Rt`- ...`01000`= 8, bu yüzden寄存器 is `w8`- Evet.

`w8`Önceki bir emirle`ldr w8, [x8, #0x4]`Üstümde, bu da 4'nin yönünü değiştirir.`a->balance`- Evet.`TBZ`Bu nedenle, simge sıfır olarak sıfırdan sıfırdan sıfırdan sıfırdan sıfırdan sıfırdan sıfırdan sıfırdan sıfırdan sıfırdan sıfırdan sıfırdan sıfırdan sıfırdan sıfırdan sıfırdan sıfırdan sıfırdan sıfırdan sıfırdan sıfırdan sıfırdan sıfırdan sıfırdan sıfırdan sıfırdan sıfırdan sıfırdan sıfırdır.`balance >= 0`时走跳转边──源码 yazıyor`if (a->balance < 0) return -1;`, bu yüzden bir çeviricinin tersine koşulu:`return -1`块,`0x1000004f4`Bu nedenle, sürücü taşıyan hareketli sonuçlar, sözcüklerin sınır sonucu olarak belirlenir:`a->balance >= 0`时跳转,否则顺序落下――第二分支的提升方式相同――`subs w8, w8, #0xc8`计算 `balance - 200`,Nihayet sonuçlar son derece sıfır, yani`balance <= 200`时,`b.le 0x100000524`跳转――

## 观察点依赖硬件, sayı sınırlı

观察点在某地址内存被访问时停止进程──它不能通过替换命令实现,因为任意位置的任意命令都可能进行该访问──因此,处理器提供少量地址比较器──x86-64 使用调试寄存器:`DR0`- Evet .`DR3`保存最大4 个断点的地址,`DR7`                                                                                                                                                                                                                                                              `DBGWVR<n>_EL1` gözlem noktası ile uyumlu verileri virtual adreslerle kaydetmek,`DBGWCR<n>_EL1`保存控制信息;Arm 手册说明 bir gerçekleştirme 2 ila 64 个观察点── içerir.

İldb rapor edecektir elde edilen miktar:

```text
(lldb) watchpoint set variable a->balance
Watchpoint created: Watchpoint 1: addr = 0x16fdfe00c size = 4 state = enabled type = m
(lldb) watchpoint list
Number of supported hardware watchpoints: 4
```

Bu makinede dört tane var.`0x16fdfe00c`Evet .`x0 + 4`: `bump`停止处的结构体指标,加上 DWARF    `balance`偏移──`size = 4`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `int`- Evet .`type = m`Değişiklik göstermek. Çevre boşluğu bitince, ldb bir sonraki gözlem noktasını reddeder.

Intel Manual Notation,  yazmak için kayda talimatları önce orijinal verileri kapsar, sonra da bir veri kesimi oluşturmak için 调试异常;lldb kendi kayda eski değerleri saklamak için aynı zamanda yeni eski değerler yazdırmak için:

```text
Watchpoint 1 hit:
old value: 250
new value: 255
* thread #1, queue = 'com.apple.main-thread', stop reason = watchpoint 1
    frame #0: 0x00000001000004d0 account-O0`bump(a=0x000000016fdfe008, by=5) at account.c:14:12
```

停止地址为 `0x1000004d0`,即 `0x1000004cc`- Ne ?`str w8, [x9, #0x4]`后的命令──解析输出前需要了解一个特点:刚执行 `watchpoint set`- Evet. - Evet.`Watchpoint 1 hit:`,旧值为空,`new value: 250`Bu sadece ilk okuma, sürücüler eski değerleri unutmayacaktır.

## Tek adım, durdurma ve toplama işlemleri

İldb 命令语法为 `<noun> <verb> [-options] [arguments]`❖ Tek adım emirleri dahil`thread step-in`(`s`)`thread step-over`(`n`)`thread step-inst`(`si`)`thread step-inst-over`(`ni`) ve `thread step-out`(`finish`)。`thread until 12`Bir yolla yürüyüşe,`thread return <expr>`携带一个值提前返回──本驱动器不执行单步,而在计划地址停止,让停止子读取数据:

```text
target stop-hook add -o "register read x0 x1 pc" -o "memory read -s4 -fx -c24 $x0" -o "frame variable -P 1"
```

`-o`Tekrarla tekrarlayabilirim, emirler her bir duruma göre uygulanır.`register read`☐ 2 parametre kaydeticisini ve program hesaplayıcıyı belirleyin.`memory read -s4 -fx -c24 $x0`- Evet .`x0`Orta Adresı: 十六进制 印 24 个四字节字,共 96 字节,即三行 `struct account`- Evet.`frame variable -P 1`印参数和局部变量,并将指针展开一层,因此 `a`Görüşmek için beş bölüm.

批处理模式是 `lldb -b`❖ el defteri,`--batch`运行  İşlem`-s`- Evet.`-S`- Evet.`-o`- Evet.`-O`                                                                                                                                                                                                                                                              `-s`传入──                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `settings set interpreter.stop-command-source-on-error false`- Yok, bu süreçten sonra ilk.`continue`Tüm emir dosyalarını bitireceğim.`breakpoint list`Bu iş hiç bitmeyecek.`error: Process must be launched.`- Evet, devam edeceğim.

输出形式的两个事实决定了解分析器的工作方式――首先, 子运行时立即打印输出,之后才打印包含 `frame #0`Gitmiş`Process N stopped`块── bu nedenle, çözücü önce kaydeticileri, belleklerini ve değişkenlerini bekleyen işlem bloklarına toplar, sonra da bir sonraki bulduğuna ekler.`frame #0`行──若块中的程序计器位于 `dyld``_dyld_start`Bu işlem, giriş durdurulması için bir şey yapmadı.`frame #0`Onu alacağım.`--auto-continue`Değişiklikler tamamen durdurulmadı, ne de durdurulmadı.`continue`Emir.

## 计划来自清单

`Plan.commands()`Dönüşümde devam edecek olan ikili sistemlere göre.`llvm-objdump -d`文本构建命令文件──对 `account-O0`- ...

```text
breakpoint set -n bump
breakpoint set -n classify
breakpoint set -n sum_balances
breakpoint set -a 0x100000504 -s account-O0
breakpoint set -a 0x1000004f4 -s account-O0
breakpoint set -a 0x100000524 -s account-O0
breakpoint set -a 0x100000514 -s account-O0
target stop-hook add -o "register read x0 x1 pc" -o "memory read -s4 -fx -c24 $x0" -o "frame variable -P 1"
run
watchpoint set variable a->balance
watchpoint list
continue
...
breakpoint list
watchpoint list -v
```

Üç isim bölümü karşı karşı karşı karşıya.`Listing.conditional_branches()`- Evet .`classify`İçinde bulunduğu her koşuldan ayrılmış hedef ve sırayla düşen adres:`0x1000004f0`- Ne ?`tbz`和 `0x100000510`- Ne ?`b.le`◊ ilk duruma gelince ayarlama, planlama beklenmesi`bump`Sonra on altı tane oldu.`continue`Bu bütçe programın davranışlarını bilmemek, sadece bir sınırdır.

`claims_for()`Aynı giriş yapı sonucu:

| Id | 类别 | 结论 | 来源 |
|---|---|---|---|
| `arg-registers` | argument-register | 每次进入函数时，前几个参数通过 `x0` 和 `x1` 传入 | 第 32 课和 AAPCS64 |
| `field-offsets` | field-offset | `struct account` 为 32 字节，`kind` 在 0，`balance` 在 4，`code` 在 8，`rate` 在 16，`label` 在 24 | 第 41 课和 DWARF 转储 |
| `branch-1` | branch-taken | 当 `a->balance >= 0` 时，`0x1000004f0` 处的 `tbz` 跳到 `0x100000504`，否则到 `0x1000004f4` | 第 33 课的边和第 34 课的提升 |
| `branch-2` | branch-taken | 当 `a->balance <= 200` 时，`0x100000510` 处的 `b.le` 跳到 `0x100000524`，否则到 `0x100000514` | 第 33 课的边和第 34 课的提升 |
| `calls` | call-edge | `main` 调用 `bump` 一次、`classify` 三次、`sum_balances` 一次 | 源码文本和 `nm` |
| `store-once` | store | `bump` 写入 `a->balance` 一次，新值等于旧值加 `by` | 第 34 课伪代码 |
| `stride` | struct-stride | `list[i].balance` 位于 `list + 32*i + 4` | 第 41 课和 psABI 聚合类型规则 |
| `output` | behaviour | 程序打印 `class 0 1 -1` 和 `sum 315` | 源码算术 |

字段偏移 来自 `struct_layout()`DSYM'den kaydedildi.`DW_AT_byte_size (0x20)``DW_TAG_structure_type`, ve beş tane .`DW_TAG_member`条目的 `DW_AT_data_member_location` planı sıkı kodlamadan 4'e yazmak yerine okuyun.

## -O0 运行:十一次停止

İlk duraklama.`bump`断点──子在停止块之前印印下列内容:

```text
      x0 = 0x000000016fdfe008
      x1 = 0x0000000000000005
      pc = 0x00000001000004bc  account-O0`bump + 12 at account.c:13:19
0x16fdfe008: 0x00000073 0x000000fa 0x00000009 0x00000000
0x16fdfe018: 0x00000000 0x3ff40000 0x00000719 0x00000001
0x16fdfe028: 0x0000006c 0xffffffd8 0x00000003 0x00000000
0x16fdfe038: 0x00000000 0x40000000 0x00000721 0x00000001
(account *) a = 0x000000016fdfe008 {
  kind = 's'
  balance = 250
  code = 9
  rate = 1.25
  label = 0x0000000100000719 "savings"
}
(int) by = 5
```

对照 DWARF 偏移读取第一行的八个字──偏移 0 的字 0 为`0x73`,即 `'s'`Yani ...`kind`字节,后面是三个填充字节──偏移 4 的字 1 为 `0xfa`= 250,即 `balance`△偏移 8 的字 2 为 `0x9`,即 `code`- Evet .`short`, yüksek yarısında iki doldurma metni vardır.`double`Önceki yazı: 16'ın 4 ve 5'i`0x3ff4000000000000`, yani 1.25'in IEEE-754 kodlaması,`0x100000719`, ≈ ≈ ≈`__TEXT``label`İndeksi: ∞`0x6c`= `'l'`和 `0xffffffd8`= -40 开头: 32 字节后的第三行`loan`                                                                                                                                                                                                                                                              `frame variable`Bir致, bu yüzden `_check_layout()`Bu duruma gelince`field-offsets`Kayıt için`confirmed`ve `x0`保存结构体指针的全部十一次停止中重复确认──

`x0`Ben de öyleyim .`a`- Evet .`x1`Ben de öyleyim .`by`Bu yüzden giriş sırasında onaylanmıştı.`arg-registers`◊ Dönüştürücü sadece deklarasyonun parametrelerini karşılaştırır.`classify`Durun, durun.`x1`仍为 `0x5`Bu da ...`bump`遗留的值; ve`classify` Sadece bir parametredir, bu yüzden karşılaştırmak için kullanılmaz.  Parametrlerin kaydedilmemiş kaydı sadece gürültüdür.

İkinci durdurma, eski değer 250, yeni değer 255,`by`= 5.. Tüm yolculuk sadece bir kez gerçekleşir.`store-once`- Evet. - Evet.`classify`Üç kez, her seferinde bir giriş durdurma ve bir iki kenar durdurma:

| 停止 | 地址 | 停止原因 | 检验内容 |
|---|---|---|---|
| 2 | `0x1000004e8` | breakpoint 2.1 | 入口，`a->balance` = 100，`x0` = `a` |
| 3 | `0x100000504` | breakpoint 4.1 | `tbz` 跳转，100 >= 0，确认 `branch-1` |
| 4 | `0x100000524` | breakpoint 6.1 | `b.le` 跳转，100 <= 200，确认 `branch-2` |
| 5 | `0x1000004e8` | breakpoint 2.1 | 入口，`a->balance` = 255 |
| 6 | `0x100000504` | breakpoint 4.1 | `tbz` 跳转，255 >= 0 |
| 7 | `0x100000514` | breakpoint 7.1 | `b.le` 顺序落下，255 > 200 |
| 8 | `0x1000004e8` | breakpoint 2.1 | 入口，`a->balance` = -40 |
| 9 | `0x1000004f4` | breakpoint 5.1 | `tbz` 顺序落下，-40 < 0 |
| 10 | `0x100000544` | breakpoint 3.1 | `sum_balances` 入口，`x1` = 3 |

`_check_branches()`Fonksiyonlara göre çalışmayı durdurur, giriş bölümünün kalanını okuyun ve her bir kenarın kalkınmasını önleyen sözcüklerin tahminlerinin ardından tamamıyla uyumlu olarak beş kenarın kalkınmasını tamamlayın:`branch-1`确认三次,`branch-2`确认两次──停止 5 显示余额为255,正是观察点看到写入的值──这是同程序的一次运行,证据相互连接──

10'u durdur.`list`24 个字读取`_check_stride()`取字 1、字 9 和字 17,即偏移 4、36、68:100、255 和 -40──`classify`Aynı adreste gözlemlenen artı oranı, 315'i talep ederek tekrar programın baskı yapılır.`sum 315`行比较── 后进程以状态 0 退出,`breakpoint list`显示名称断点的命中次数为 1、3、1,四边断点为 2、1、1、1──全部八个结论最终均为 `confirmed`, arkasında 25 条 kayıtları vardır, bunlardan 23 条关联停止,两条关联完整运行──

## -O2 运行:零次停止

Aynı kaynak kod`-O2`Aşağıda farklı bir prosedür var.`main``llvm-objdump -d`Sadece dört madde .`bl`,Tüm调用 `printf`原有调用被 `mov w8, #-0x1`- Evet.`mov w8, #0x1`Geçmişte.`xzr`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `mov w8, #0x13b`取代──编译器在编译期计算了所有结果──`nm`仍列出 `_bump`- Evet.`_classify`和 `_sum_balances`, çünkü bunlar dış fonksiyonlardır, diğer hedef dosyaları için içeriksiz bir kopyasını korumak gerekir.`DW_TAG_subprogram`条目, ama hiçbir şey yok `DW_TAG_inlined_subroutine`条目,所以连调试信息也未记录这次内联──

İnşaat planının üç birim ve birim yok.`-O2`Aşağıda `classify`Sadece altı条 emir:`ldr`- Evet.`cmp`- Evet.`cset`- Evet.`cmp`- Evet.`csinv`- Evet.`ret`Bu durumda hiçbir şart yok.`-O0`Bu ikincil sistemde adres yok, sürücüler onları taşımayacak.

运行结果:

```text
(lldb) breakpoint set -n bump
Breakpoint 1: where = account-O2`bump at account.c:13:16, address = 0x0000000100000460
(lldb) run
sizeof 32 align 8
offsets 0 4 8 16 24
class 0 1 -1
sum 315
Process 48444 exited with status = 0 (0x00000000)
(lldb) watchpoint set variable a->balance
error: Command requires a process which is currently stopped.
(lldb) breakpoint list
1: name = 'bump', locations = 1, resolved = 1, hit count = 0
```

Her bölüm çözüldü. Adres var, kod var, db de orada yazılmış.`BRK`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                                    

| 结论 | 判定 | 记录 |
|---|---|---|
| `calls` | 已反驳 | 完整运行以状态 0 退出后，入口停止次数为 bump 0、classify 0、sum_balances 0 |
| `output` | 已确认 | 四行输出及退出状态 0 |
| `arg-registers` | 未观察到 | 没有停止检验它，命中次数全为 0 |
| `field-offsets` | 未观察到 | 没有停止检验它 |
| `store-once` | 未观察到 | 未在 bump 停止，因此从未设置观察点 |
| `stride` | 未观察到 | 未在 sum_balances 停止 |

必須准确说明反驳的含义──原结论是:`main`Bu programda üç işlevi düzenlemiştir. Bu yapıdaki bu çalışmaya göre, bu çalışmaya göre, bu çalışmaya göre, bu çalışmaya göre, bu çalışmanın tamamlanmış olduğunu kontrol eden sürücü, bu çalışmanın henüz kullanılmamış olduğunu belirtmek için sadece 0'a göre çalışmaya devam etti. Bu sonuç, bu çalışmanın da belirtmediği bir işlevi belirtti. Bu çalışmanın da belirttiği bir sonucu yoktur: bunlar çıkarılmış, diğer hedef dosyaları hala düzenlenebilir.`balance`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `-O2`DWARF da bunu açıklıyor, ama bu sefer de göstermek için hiç bir şey yapmadı.`not-observed`Bu farkı korumak için, 35 . ders, belli bir çalışma gerçekten gözlemlenene kadar bilinmeyen bir projeyi açık tutacaktır.

## Çekirdek 转储

Core 文件, sürecin belleği ve kaydı diske yazılır, böylece program kaybolduğunda, programın durdurma durumunu okuyabilir.`core(5)`Açıklama,  az sayıda süreçlerin anormal bitmesine yol açan sinyal,  de sürecin内存 durum kaydı diske yazılacak , konum `/cores/core.pid`,                                                                                                                                                                                                                                                               `sysctl`Rapor`kern.coredump: 1`和 `kern.corefile: /cores/core.%P`- Evet .`/cores`存在,模式为 `drwxrwxr-t root admin`, ve kabuğu `ulimit -c`- Ben kullanıyorum.`ulimit -c unlimited`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `launchctl limit core unlimited`Sistem seviyesinin yükseltilmesi sınırlandırılmadan,内核 asla çekirdeğe yazılmayacak.

İldb 无需崩即可按需写出核心──在 `bump`Kesinlikle:

```text
(lldb) process save-core --style stack account-O0-stack.core
Saving 49152 bytes of data for memory region at 0x16fdf4000

Modified-memory or stack-memory only corefile created.  This corefile may 
not show library/framework/app binaries on a different system, or when 
those binaries have been updated/modified. Copies are not included
in this corefile.  Use --style full to include all process memory.
```

文件为 53,248 字节.

```text
(lldb) target create "./account-O0" --core "account-O0-stack.core"
(lldb) bt
* thread #1, stop reason = ESR_EC_BRK_AARCH64 (fault address: 0x0)
  * frame #0: 0x00000001000004bc account-O0`bump(a=0x000000016fdfe008, by=5) at account.c:13:19
    frame #1: 0x0000000100000640 account-O0`main at account.c:40:5
    frame #2: 0x000000019a949d54 dyld`start + 7184
(lldb) frame variable *a
(account) *a = (kind = 's', balance = 250, code = 9, rate = 1.25, label = "")
(lldb) frame variable a->label
(const char *) a->label = 0x0000000100000719 ""
```

Geri dönüş ve tüm sayısal bölümler tamamlanmıştır, çünkü bunlar korumaların temelinde yer almaktadır.`label`Göstermek için boş bir karakter, ama işaretleri tam.`0x100000719`Doğru . Yönlendirdiği yazı tipi , bir dosya olarak kullanılabilir .`__TEXT`段中的字面量 `"savings"`, 式核心不包含该段──指针是观察结果,字符串不可用,lldb不会编制它──`--style full`包含全部进程内存;研究机器上, bu 34 KB 程序的完整核心 达到2.1 GB,因为进程映射了共享缓存──停止原因显示为`ESR_EC_BRK_AARCH64`- Çekilme olayı kaydedildi .`BRK`- Çok normal.

Linux 内核based `/proc/sys/kernel/core_pattern`Bu tabloyu kullan.`%p`PID gösterir`%e`Göster emir adı,`%s`Sinyal göstermek`%t`Çıkış zamanı,前导 `|`Bu işlemler, bir sistemle yapılan bir işlem ve bir sistemle yapılan bir işlemden sonra, bir sistemle yapılan bir işlemden sonra, bir sistemle yapılan bir işlemden sonra, bir sistemle yapılan bir işlemden sonra, bir sistemle yapılan bir işlemden sonra, bir sistemle yapılan bir işlemden sonra, bir sistemle yapılan bir işlemden sonra, bir sistemle yapılan bir işlemden sonra, bir sistemle yapılan bir işlemden sonra, bir sistemle yapılan bir işlemden sonra, bir sistemle yapılan bir işlemden sonra, bir sistemle yapılan bir işlemden sonra, bir sistemle yapılan bir işlemden sonra, bir sistemle yapılan bir işlemden sonra, bir sistemle yapılan bir işlemden sonra, bir sistemle yapılan bir işlemden sonra, bir sistemle yapılan bir işlemden sonra, bir sistemle yapılan bir işlemden sonra, bir sistemle yapılan bir işlemden sonra, bir sistemle yapılan bir işlemden sonra, bir sistemle yapılan bir işlemden sonra, bir sistemle yapılan bir işlemden, bir işlemden sonra, bir sistemle yapılan bir işlemden, bir işlemden, bir işlemden, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir süre, bir, bir süre, bir süre, bir, bir süre, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir,`systemd-coredump`, tekrar kullan `coredumpctl list`- Evet.`info`- Evet.`dump`和 `debug`取回保存的数据──`gdb prog core`和 `lldb -c core prog`Sonuçları açarım.

## GDB ile LLDB

两个调试器用不同命令完成相同工作──驱动器中的 `COMMAND_MAP`35 tane var, geçebilir.`python3 code/main.py commands`打印──本课使用的如下:

| 任务 | gdb | lldb | lldb 别名 |
|---|---|---|---|
| 在函数处断下 | `break bump` | `breakpoint set -n bump` | `b bump` |
| 在某模块内的地址处断下 | `break *0x1000004f0` | `breakpoint set -a 0x1000004f0 -s account-O0` | |
| 每次停止时运行命令 | `define hook-stop` ... `end` | `target stop-hook add -o '...'` | |
| 列出断点及命中次数 | `info breakpoints` | `breakpoint list` | `br l` |
| 观察变量写入 | `watch a->balance` | `watchpoint set variable a->balance` | `wa s v a->balance` |
| 列出观察点 | `info watchpoints` | `watchpoint list -v` | `wa l -v` |
| 读取一个寄存器 | `p $x0` | `register read x0` | |
| 以字为单位读取内存 | `x/8xw 0x16fdfe008` | `memory read -s4 -fx -c8 0x16fdfe008` | `x -s4 -fx -c8 0x16fdfe008` |
| 显示参数 | `info args` | `frame variable --no-locals` | |
| 单步执行一条指令 | `stepi` | `thread step-inst` | `si` |
| 运行至函数返回 | `finish` | `thread step-out` | `finish` |
| 写入 core 文件 | `gcore core` | `process save-core --style stack core` | |
| 打开 core 文件 | `gdb account-O0 core` | `lldb -c core account-O0` | |

İçinde,`p`Evet .`dwim-print`Çıkışlar:`frame variable`路径打印,其他情况回归到 `expression`- Evet.`v`İşte bu .`frame variable`◊ Dönüştürücüler `frame variable`: It read DWARF 位置, from being modified in the process to execute the code.

Aşağıdaki sürüm ve lisans bilgileri, 2026-10-14 için geçerlidir.`lldb`Bu makinenin komut hattı araçları Apple'ın kendi kodunu sunuyor.`lldb-1703.0.236.21`, Python 3.9.6 içine yerleştirilmiştir; Apple'ın lldb 已具備调试签名──GDB 18.1 于 2026-09-25 发布,采用GPL-3.0-或后版本──发布说明列出 Windows、`.gdb_index`、AArch64 `FPMR`Python'a`gdb.Corefile`变更,没有 Darwin 条目──截至 18.1,GDB 尚未原生支持果芯片 进程:2025 月10月发布包含了15个补丁的初始AArch64-Darwin support系列,2026 月2月维护者说明先完成版权转让和BFD 补丁的落地路径──Homeebrew的`gdb`Formula var, ama yapım sırasında sahte.`--target=x86_64-apple-darwin20`Bu paketlere katılın. Bu paketlerin açıklaması:`com.apple.security.cs.debugger`权限,否则 `task_for_pid`会以(os/kern) başarısızlık (0x5) 失败──本课程将gdb 用Linux,Debian stable 在 arm64 上提供gdb 16.3,`rr`Orada da yürür.

## Nedir bu ?

调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调试器 调动器 调试器 调动器 调动器 调动器 调动器 调动器 调动器 调动器 调动器 调动器 调动器 调动器 调动器 调动器 调动器 调动器 调动器 调动器 调动器 调动器 调动器 调动器 调动器 调动器 调动器 调动器 调动器 调动器 调动器 调动器 调动器 调动器 调

| 工具 | 操作系统 | 版本 | 许可证 | 记录内容 |
|---|---|---|---|---|
| `strace` | Linux | 7.2，2026-08-18 | LGPL-2.1-or-later | 系统调用及参数和返回值 |
| `ltrace` | Linux | 最后发布的 tarball 为 0.7.3，Debian 使用 git 快照 | GPL-2.0 | 动态库调用 |
| `bpftrace` | Linux | v0.27.0，2026-09-10 | Apache-2.0 | 通过 eBPF 记录内核和用户态探针 |
| `dtrace` 和 `dtruss` | macOS | macOS 26.2 中为 `Sun D 1.19` | CDDL，源自 Sun OpenSolaris | D 探针；`dtruss` 打印系统调用 |

`dtruss`手册说明:DTrace'yi kullanmakla, yalnızca root 权限 sahibi kullanıcılar bu emri yürütemez.`dtrace(1)`补充:默认系统完整性保护设置下, D 程序访问内核地址值或内核内存内容,且SIP 下不允许破坏性操作──本课没有在此机上运行`sudo dtruss ./account-O0`, çünkü sürücü kök kullanmıyor, bu kaydı geçersiz olarak kaydetmişlerdir.`printf`- Çıkmış .`write`是跟踪问题; 到达 `bump`时  `x1`Bu, sadece bir seferlik çalışmayı hedef alan bir sorun.

## Kayıt ve yükleme

`rr`记录一次运行,并 gdb 下确定性重放,支持反向执行:对关心的值设置观察点,`reverse-cont`Yazılmaya geri dönmek noktasına kadar. Projenin kendi kendine anlatıldığı gibi: Sadece bir başarısızlık kaydetmek gerekir, ardından da çok sayıda kesinlik ile bu kaydı düzenleyebilirsiniz. Geçtiğimiz yayımlanan sürüm 2025-02-13'ün 5.9.0'sidir. MIT lisansı ile BSD-2-Klavü  bölümünü içerir.

Gdb'nin de kendi yazılım kaydedici var.`record full`记录进程执行日志,默认上限为200,000条命令;`record btrace`Intel'in bölük takip, 不记录数据──lldb bu iki işlevi sağlamaz. MacOS makinelerinde, sürücü kaydetme toplantısı metni kayıtlıdır: Aynı plan aynı ikili sistem üzerinde çalışır, aynı sırada aynı duruma gelir, örnek test bu sırayı sabitler.

## Bir seferinde bir şey kanıtlayabilirdim .

Bir çalışma sadece bir yapıdaki bir girişini kanıtlar. C 標準将未定義行为定义为:使用不可移植或错误程序构建或错误数据,本文件不施加任何要求的行为.`int`溢出程序在 `-O0`和 `-O2`Aşağı yasal olarak farklı sonuçlar elde etmek.`percent_change`溢出单元中遇到过这种情况──UBSan将问题转换为停止:`-fsanitize=signed-integer-overflow -fsanitize-trap=undefined`Bu nedenle, bu durumun bir sonucu olarak, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir sürececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececece

优化代码还会移动你希望观察的内容──GDB 手册说明,优化器重排了你的代码,调试器显示现实存在的内容; 优化到不存在的变量是GDB 永远看不到的变量──GDB将这种值打印为`<optimized out>`, kaynak kodunu onunla birlikte yapacağım .`<unavailable>`区分: Önceki  aslında programda mevcut değildir, sonraki  programda mevcuttur, ancak GDB 无法获取──当程序计器位于变量 DWARF 位置列表的全部范围之外时,lldb 打印`<variable not available>`❖ Kayıt makinesi içinde yerleştirilen yerel değişken ayarları kayıt gözlem noktası başlatılmayacak, çünkü kayıt makinesi kayıt değil.`-O2`运行 gösterdi极端情况: tüm işlev çarpıldı, hiç ayarlanmamış gözlem noktası sessiz kalır, hiçbir şey kanıtlayamaz.

Bu nedenle, sürücü sadece üç kayıt yazıyor, kesinlikle dördüncü yazmıyor.`confirmed`;检验后不一致,为 `refuted`Hiçbir şey kontrolden çıkmıyor.`not-observed`Bu nedenle, bu durumun bir parçası olarak, kararların sayısı da vardır.`controlled-replay``observed`Kayıt, üçüncü türü açık bilinmeyen konular için saklayacak.

## MacOS'ta kendi yapılandırmasını ayarlayın

Apple silikonu üzerinde, bağlantı cihazı senin için imzalayacak.`ld(1)`- Evet .`-adhoc_codesign`Açıklama: Apple Silicon, Ad-hoc uygulamasını onayladı.`codesign -dvvv account-O0`Çıkış:

```text
Format=Mach-O thin (arm64)
CodeDirectory v=20400 size=387 flags=0x20002(adhoc,linker-signed) hashes=9+0 location=embedded
Signature=adhoc
TeamIdentifier=not set
```

`0x20002`Evet .`CS_ADHOC`(`0x2`)加 `CS_LINKER_SIGNED`(`0x20000`), sonrakı Apple 代码签名头文件中解释为由链接器自动签名──`codesign -d --entitlements -`Yapılacak dosya adı sonrası herhangi bir içerik yazdırılmasın:`DevToolsSecurity -status`Rapor: Developer mode şu anda devre dışı  Sistem bütünlüğü koruma etkinleştirildiğinde, ldb  hâlâ etkinleştirilmiştir  tüm kesintiler  ayarlamalar 硬件观察点并写出核心──

İki tarafta bulunan iki tarafta kontrolü olan kişiyi kontrol edebiliyorlar.`com.apple.security.cs.debugger` belongs to the调试器: 一个布尔值, 表示应用是否是调试器,以及能否附加其他进程或获取任务端口──Apple's `debugserver`携带其私有形式;对命令线工具中的副本运行 `codesign -d --entitlements -`, 会列出 `com.apple.private.cs.debugger`- Evet.`com.apple.private.set-exception-port`- Evet.`com.apple.private.thread-set-state`和 `com.apple.private.logging.diagnostic`- Evet.`com.apple.security.get-task-allow`目標に属します.Xcode, onu yapılandırma, idxal ve çıkış sırasında kaldırma, ve açıklama, yine de ikilemsel bir sistemle birlikte taşımayı reddetmektedir. Apple mühendisleri reddetme kurallarını açıkladı:`get-task-allow`时, görev anıtı reddedilecek.`clang`Yapımın güçlendirilmesi gerekmez.`codesign --options runtime`给样例签名,调试前需使用 `codesign -s - -f --entitlements get-task-allow.plist`Yeni imza.

Ayrıca üç gerçek var. Birinci olarak, ilk kez bir giriş konuşmasında, Developer Tools Access'in devam etmek için başka bir debugging sürecini kontrol altına alması gerektiğini görebilirsiniz.`sudo DevToolsSecurity -enable`Çekil`admin`Ya da`_developer`组成员免去额外密码──第二,调试自己的代码无需关闭SIP──Apple açıklaması Xcode 运行和调试应用无需关闭SIP;涉及调试的SIP 组件,仅仅是`csrutil enable --without debug`Diğerlerinin ilerlemesini kolaylaştırmak için.`task_for_pid`, example `sandbox-O0.lldb.txt`                                                                                                                                                                                                                                                              

Bu ders, kendi kendinize hazırladığınız bir program için geçerlidir. Sadece başka bir sürecin sahibi aktif olarak izin verdiğinde, aynı emir eklenebilir; bu koşul nasıl değiştirileceğini öğretmez.

## 亲手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/42-dynamic-analysis-of-your-own-program
python3 code/main.py
```

输出, kaydedilmiş toplantı kayıtlarının bir JSON raporuna dayanır. DATA'nın her türü, ayrıntılı bir listeye ayrıntılı bir şekilde yerleştirilmiştir. DATA'nın her türlü yapılandırılmasının çözülme durumu ve beklenme sayısı, her bir duruma kaydedilen kaydetmen ve parametrelerin sayısı, çıkış durumları, program çıkışı, ildb.

预期结构:

```json
{
  "program": "account.c",
  "variants": {
    "O0": {
      "binary": "account-O0",
      "breakpoints": {"1": {"spec": "name=bump", "address": "0x1000004bc", "resolved": true, "hits": 1}, "...": "..."},
      "hardwareWatchpoints": 4,
      "watchpoints": {"1": {"address": "0x16fdfe00c", "size": 4, "type": "m", "hits": [[250, 255]], "hitCount": 1}},
      "stops": [{"index": 0, "pc": "0x1000004bc", "function": "bump", "kind": "entry", "registers": {"x0": "0x16fdfe008", "x1": "0x5"}, "...": "..."}],
      "exitStatus": 0,
      "claims": [{"id": "arg-registers", "verdict": "confirmed", "confirmed": 5, "refuted": 0, "not-observed": 0, "...": "..."}],
      "evidence": [{"claim": "arg-registers", "verdict": "confirmed", "stop": 0, "observation": "bump: x0 = 0x16fdfe008 and a = 0x000000016fdfe008, x1 = 0x5 and by = 5"}]
    },
    "O2": {"stops": [], "claims": [{"id": "calls", "verdict": "refuted", "...": "..."}], "...": "..."}
  },
  "core": {"savedAt": {"function": "bump", "pc": "0x1000004bc"}, "labelString": "", "...": "..."},
  "types": {"python": "3.9.6", "size": 32, "...": "..."},
  "sandbox": {"stops": 0, "errors": ["process exited with status -1 (attach failed ((os/kern) invalid address))"]},
  "absentTools": ["bpftrace", "gdb", "llvm-objdump", "ltrace", "rr", "strace"]
}
```

按以下顺序阅读 `code/main.py`- ...

1. `Listing`- Ben de .`llvm-objdump -d`文本解析为函数和命令,`Function.conditional_branches()`查找分支及目标与顺序落下地址──
2. `struct_layout()`- Evet .`llvm-dwarfdump`文本读取 yapı体和成员条目──
3. `lift_condition()`Bir şartı bir söz olarak değiştirmek için, bu 34. ders.`tbz`- Evet.`cbz`和比较后分支形式的提升步骤──
4. `Plan.commands()`Çekim yazısı ile ilgili bir emir dosyası,`Plan.lldb_command()`提供批处理调用──
5. `parse_transcript()`序列通出,构建包含寄存器、内存、变量和观察点值的 `Stop`Kayıt, ayrıca kesinti ve çıkış durumu.
6. `claims_for()`声明八个结论,`evaluate()`Kullanım`_check_*`函数逐次停止评判它们──
7. `rollup()`Kayıtlar her sonuca bir karar, bir itiraz öncelikle bir onay olarak bağlanacak.
8. `capture()`和 `capture_extras()`生成例;当 `clang`和 `lldb`Çıkışlı,`live()`Yeni inşaatın tüm sürecini tekrar yapın.

Dört emir daha var.`python3 code/main.py plan O0`打印某构建的命令文件;`python3 code/main.py commands`打印 gdb 和 lldb对照表;`python3 code/main.py tools`Rapor`PATH`Ünce dış aletler var mı?`python3 code/main.py live O0`- Ben de .`account.c`编译到临时目录,根据新清单制定计划,运行 lldb,再根据本次运行评判结论──在沙箱内,它报告 lldb 无法启动进程,附带错误,并以 1 退出──

## 实际使用

按下列顺序将驱动器用于自己的程序──

1. Kullanım`-g`Yapım ve plan teslimatının optimize derecesi.`llvm-objdump -d`文本一起保存──
2. 运行前写出结论──每项指明函数、寄存器或地址或偏移、预期值或边,以及其来源课程或文档──看停止后才写出结论只是描述停止,检验不了任何事──
3. 根据清单生成计划并阅读──每个地址都应追溯到清单的一行──如果断点没有对应行,就删除它──
4. Bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez,
5. 進行判定──閱讀确认結果之前,先读每条 `not-observed`记录及原因──原因 hangi sonuçların diğer girişlere gerek olduğunu, diğer yapıların veya diğer sonuçların gerek olduğunu size söyleyecektir──
6. Aynı sonucu kullanın. Yapım yapısı optimizasyonı.
7. Bildirilen ve Yönlendirilen Kayıtlar`observed`、 yetki kaynağı `controlled-replay`写入第 35 课账本,每次停止一条记录──未观察的结论仍作为未知项,附上断点命中次数──

## 交互实验

### 实验 A:手工读取一次停止

- Evet .`code`Python'u aç:

```bash
cd phases/13-tools-and-protocols/42-dynamic-analysis-of-your-own-program/code
python3 -q
```

运行:

```python
from main import *
t = load_transcript("session-O0.lldb.txt")
s = t.stops[0]
hex(s.pc), s.function, s.reason, s.registers
[hex(w) for w in s.memory[:8]]
s.struct_pointer().fields
```

执行第二行之前,先写下预期哪个字保存 250,哪两个字保存 1.25──然后运行 `struct.unpack("<d", struct.pack("<II", s.memory[4], s.memory[5]))`Ve karşılaştırma.`t.stops[1].watch_hit`和 `t.stops[1].pc`, `account-O0.objdump.txt`Bu bir depolama emri.

### 实验 B:分支与后继

```python
plan = make_plan("O0")
plan.branches()
classify = plan.listing.function("classify")
[lift_condition(classify, b, "a->balance")[0] for b in plan.branches()]
[(hex(s.pc), s.struct_pointer().field_int("balance")) for s in t.stops_in("classify")]
```

Her bir kenarın girişinin durdurulması, kanıtları görmeden önce, hangi sonucu olduğunu belirlemek için, sonra da çalıştırmak için.`[e.to_dict() for e in evaluate(plan, t, struct_layout(open("fixtures/account-O0.dwarfdump.txt").read(), "account")) if e.claim.startswith("branch")]`Ve karşılaştırma.

### 实验 C:从未停止的运行

```python
o2 = load_transcript("session-O2.lldb.txt")
len(o2.stops), o2.exit_status, o2.hits()
o2.errors[:3]
make_plan("O2").branches()
rollup(evaluate(make_plan("O2"), o2, struct_layout(open("fixtures/account-O2.dwarfdump.txt").read(), "account")))
```

Kendi sözünle her birini açıkla.`not-observed`Sonra aç .`account-O2.objdump.txt`, buldum`main`Ortalama değişim 4 adet adet adet.`count_tags()`统计 `account-O2.dwarfdump.txt`Orta `DW_TAG_inlined_subroutine`- Evet.

### 实验 D:破坏证据

```python
text = open("fixtures/session-O0.lldb.txt").read().replace("x1 = 0x0000000000000005", "x1 = 0x0000000000000006", 1)
broken = parse_transcript(text)
[e.to_dict() for e in evaluate(plan, broken, struct_layout(open("fixtures/account-O0.dwarfdump.txt").read(), "account")) if e.claim == "arg-registers"][:2]
```

Bir kaydı değiştir, ilk yazıyı yapalım.`arg-registers`记录及汇总变为 `refuted`, kalan dört giriş hala var .`confirmed`                                                                                                                                                                                                                                                              `old value: 250`行,观察 `store-once`变为 `not-observed`                                                                                                                                                                                                                                                              

Eğer İldb'nin, senin kabukunda bir süreci başlatması mümkünse, son çalıştırma.`python3 main.py live O0`和 `python3 main.py live O2` adresleşmek, değişmemesi gerektiği belirlenir.

## 实践实验

Dürerleri artırmak için`sum_balances`Çevre sonucu:

要求:

- Kullanım`conditional_branches()`- Evet .`-O0`清单中找到 `sum_balances`Çemberde bir nokta artıyor.
- 增加结论:当 `count`= 3 时, döngü başlat `count + 1`Bu da 33 numaralı derslerin geri kalanı ve çıkış kontrolü.
- 扩展停止子或计划,使子在每循环头停止时读取循环计器的槽,并编写 `_check_loop()`记录计计器值序列──
- İşlemi başlatmak için bir makine kullanın.`python3 main.py capture O0`Yeni programla uyumlu bir emir dosyası gönderilmeden önce, plan testi başarısız olur, bu testin amacıdır.
- 增加测试,修改会话记录中的一个计计器值,并断言结论变为 `refuted`- Evet.

Başarılı Standart: Rapor sırasıyla döngü durdurma ve hesaplama değerini gösterir.`-O2`运行将新结论保留为 `not-observed`, sebebi döngünün ölçülmesi veya çarpma ortadan kaldırılmasıdır.

## 本课产物

本课包含 `outputs/skill-dynamic-analysis-of-your-own-program.md` Kendi kendini oluşturan prosedürleri, açıklama ve duruşlu sonuç listelerini, her sonuç için bir karar, ayrıca kararlı bir durdurma ve gözlemlenmemiş sonuçların nedenleri oluşturmak için kullanılacak şekilde kaydedilen bir düzenleyici toplantı kaydına dönüştürülecek.

## 验证

运行演示和确定性套件:

```bash
cd phases/13-tools-and-protocols/42-dynamic-analysis-of-your-own-program
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Bir kere ele geçirmek için kullanılabilir.`code/fixtures/`Bu yüzden, bu bir şey değil.

- 清单解析器 dört işlevi ve alanı bul, ve `-O0`Aşağı`classify`İki şartı var: hedef ve sırayla atılmak
- `tbz w8, #0x1f`提升为 `a->balance >= 0`- Evet .`subs` 加`b.le`提升为 `a->balance <= 200`
- `-O0`Aşağı`main`调用 `bump`Üç kez.`classify`和 `sum_balances`- Evet .`-O2`Aşağı`main`Sadece kullanın.`printf`
- x86-64  `j<cc>`助记符 şöyette yer alır.`jmp`和 `callq`İşe girmiyor
- DWARF 转储产生大小 32 字节、成员位于 0、4、8、16、24 的结构体
- `-O2`DWARF'da dört tane program var.`nm`仍然列出三个函数
- İki yapı planı, gönderilen emir dosyaları ile aynıdır.
- `-O0`会话在预期函数中十次停止,退出状态为0,包含四行输出
- 子输出附加到其后的停止,其中 `x1`= 5,内存 `x0`开始,并包含标签字符串
- 断点表带解析状态,命中次数为1、3、1、2、1、1
- 观察点为 `x0 + 4`处的 4 字节 modify 类型,命中一次,旧值 250、新值 255,并报告四硬件槽位
- `-O2`Görüşme bitmedi, üç çözülmüş kesim, hiç gözlem noktası yok, her bir kullanılmamış.`continue`Bir hata yapmayı başardık.
- 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙箱 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙 沙
- çekirdek 保存加载往返                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     `balance`= 250 ama kayboldu `label`Yönlü harfler
- Python API  无需进程即可读取五字段、大小 32 和函数范围
- Çözülebilir bir konuşma .`rdi`- Evet.`rsi`和 `rip`
- `-O0`Aşağıda her sonuç onaylanmıştır, ayrılığı 5、11、3、2、1、1、1 条 kayıtları vardır.
- Bölüm Değer, Şart ve Kenarlık
- 字段偏移证据通过 DWARF 布局解码各个字
- Depo ve geçiş belgesi yeni eski değer ve üç seri bakiye sahip
- `-O2`运行反驳调用边,将其他结论保留为未观察
- 修改寄存器值会反驳,删除观察点命中会未观察,汇总时反驳优先
- 命令映射每行均有gdb 和 lldb 形式,硬件表列出四个x86 调试寄存器
- 演示 list list list missing tools instead of failure, real time model by name rapor eksiklik araçları
- Şekil verileri iki toplantıdan, istasyon modülü aynı verilere yerleştirilmiştir

## Çevre üretim başarısızlık modeli

| 失效情况 | 薄弱报告的说法 | 驱动器必须证明什么 |
|---|---|---|
| 已解析断点零命中 | “函数运行了”或“函数是死代码” | 完整运行的退出状态、命中次数，且仅对调用边给出 `refuted` 判定 |
| 在错误停止处读取寄存器 | “`classify` 中 `x1` = 5” | 仅在入口停止比较声明的参数 |
| 不看偏移就读结构体 | 一列十六进制字 | 每个字映射到 `DW_AT_data_member_location`，并与 `frame variable` 比较 |
| 仅凭助记符评判分支 | “`tbz` 表示负数时跳转” | 从编码提升出的谓词，以及后继处的停止 |
| 观察存放在寄存器中的局部变量 | “没有发生写入” | 观察点确实设置在地址上并命中，否则记录应为 `not-observed` |
| 自动继续断点 | 干净但没有停止的会话记录 | 普通断点、停止钩子和继续次数预算 |
| 地址断点未指定模块 | `unresolved, hit count = 0` | 使用 `-s MODULE`，将清单地址解析为加载地址 |
| 第一个命令错误结束批处理 | 结尾没有 `breakpoint list` | `interpreter.stop-command-source-on-error false` |
| 将栈式 core 当作完整内存读取 | 将 `label = ""` 报告为程序值 | core 类型、指针及其指向的段 |
| 沙箱 shell | “lldb 坏了” | 将 `attach failed ((os/kern) invalid address)` 记录为环境事实 |
| 强化目标没有 `get-task-allow` | “macOS 禁止调试” | Apple 规则中的两个条件，以及对自己的二进制重新签名 |
| 判定后丢弃会话记录 | 判定没有来源 | 会话文件、命令行和调试器版本 |

## Operasyon kuralları

Çekim planlama durdurma, bir kez bir kez bir kez bir kez bir kez bir kez bir kez işleme biçiminde çalışmak, toplantı kayıtlarını korumak ve her kez bir durum sonucu kontrol edilebilir bir durdurma bölümünde değerlendirmek için; sadece bir kez bir kez bir kez işlemi yerine bir kez çözülmüş bir nokta ile bir kez yazılmadan; sadece kendi kendini oluşturan prosedürü düzenlemek için bir kez yazılmadan;

## 延伸阅读

- [LLDB Tutorial: command grammar, breakpoints, watchpoints, stop hooks](https://lldb.llvm.org/use/tutorial.html)
- [lldb(1) manual page: --batch, --one-line, --source, --core](https://lldb.llvm.org/man/lldb.html)
- [GDB to LLDB Command Map](https://lldb.llvm.org/use/map.html)
- [LLDB Python Reference: SBTarget, SBFrame, SBValue, and the embedded interpreter](https://lldb.llvm.org/use/python-reference.html)
- [LLDB Caveats: the Python build lldb links against](https://lldb.llvm.org/resources/caveats.html)
- [LLVM 23.1.3 release](https://github.com/llvm/llvm-project/releases/tag/llvmorg-23.1.3)
- [GDB 18.1 release announcement, 2026-09-25](https://sourceware.org/pipermail/gdb-announce/2026/000150.html)
- [GDB manual: Process Record and Replay](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Process-Record-and-Replay.html)
- [GDB manual: Debugging Optimized Code](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Optimized-Code.html)
- [GDB wiki: Permissions on Darwin, code signing a debugger](https://sourceware.org/gdb/wiki/PermissionsDarwin)
- [gdb-patches: Initial AArch64-Darwin support series, October 2025](https://sourceware.org/pipermail/gdb-patches/2025-October/222196.html)
- [Homebrew gdb formula pull request adding arm64 bottles](https://github.com/Homebrew/homebrew-core/pull/209753)
- [ptrace(2), Linux manual page](https://man7.org/linux/man-pages/man2/ptrace.2.html)
- [lldb debugserver MachTask.mm: task_for_pid and task_set_exception_ports](https://github.com/llvm/llvm-project/blob/main/lldb/tools/debugserver/source/MacOSX/MachTask.mm)
- [Intel SDM Volume 2: INT n, INTO, INT3, INT1](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [Intel SDM Volume 3: debug registers DR0 to DR7 (Debug, Branch Profile, TSC, and Resource Monitoring Features)](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [Arm A64 ISA: BRK, Breakpoint instruction](https://developer.arm.com/documentation/ddi0602/latest/Base-Instructions/BRK--Breakpoint-instruction-)
- [Arm A64 ISA: TBZ, Test bit and branch if zero](https://developer.arm.com/documentation/ddi0602/latest/Base-Instructions/TBZ--Test-bit-and-branch-if-zero-)
- [Arm Architecture Reference Manual, D2.9 Watchpoint exceptions](https://developer.arm.com/documentation/ddi0487/latest/)
- [Apple ld(1): -adhoc_codesign](https://keith.github.io/xcode-man-pages/ld.1.html)
- [Apple ld64 LinkEdit.hpp: CS_LINKER_SIGNED](https://github.com/apple-oss-distributions/ld64/blob/59a99ab60399c5e6c49e6945a9e1049c42b71135/src/ld/LinkEdit.hpp)
- [Apple: Debugging Tool Entitlement, com.apple.security.cs.debugger](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.security.cs.debugger)
- [Apple: Hardened Runtime](https://developer.apple.com/documentation/security/hardened-runtime)
- [Apple: Resolving common notarization issues, the get-task-allow entitlement](https://developer.apple.com/documentation/security/resolving-common-notarization-issues)
- [Apple: Disabling and Enabling System Integrity Protection](https://developer.apple.com/documentation/security/disabling-and-enabling-system-integrity-protection)
- [Apple Developer Forums: debugserver may not get the taskport of a hardened process](https://developer.apple.com/forums/thread/127544)
- [Apple DevToolsSecurity(8)](https://keith.github.io/xcode-man-pages/DevToolsSecurity.8.html)
- [Apple core(5)](https://keith.github.io/xcode-man-pages/core.5.html)
- [Apple Technical Note TN2124: Mac OS X Debugging Magic, core dumps](https://developer.apple.com/library/archive/technotes/tn2124/_index.html)
- [lldb `process save-core` help text](https://github.com/llvm/llvm-project/pull/143126)
- [core(5), Linux manual page](https://man7.org/linux/man-pages/man5/core.5.html)
- [coredumpctl(1)](https://man7.org/linux/man-pages/man1/coredumpctl.1.html)
- [Apple dtrace(1)](https://keith.github.io/xcode-man-pages/dtrace.1.html)
- [Apple dtruss(1m)](https://keith.github.io/xcode-man-pages/dtruss.1m.html)
- [strace releases](https://github.com/strace/strace/releases)
- [ltrace](https://ltrace.org/)
- [bpftrace CHANGELOG](https://github.com/bpftrace/bpftrace/blob/master/CHANGELOG.md)
- [rr project](https://rr-project.org/)
- [rr 5.9.0 release](https://github.com/rr-debugger/rr/releases/tag/5.9.0)
- [rr wiki: Building And Installing, hardware and VM requirements](https://github.com/rr-debugger/rr/wiki/Building-And-Installing)
- [Clang UndefinedBehaviorSanitizer](https://clang.llvm.org/docs/UndefinedBehaviorSanitizer.html)
- [ISO/IEC 9899:2024 working draft N3220, clause 3.5 undefined behavior](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n3220.pdf)
- [DWARF Debugging Information Format Version 5](https://dwarfstd.org/doc/DWARF5.pdf)
- [Procedure Call Standard for the Arm 64-bit Architecture (AAPCS64)](https://github.com/ARM-software/abi-aa/blob/main/aapcs64/aapcs64.rst)
- [System V Application Binary Interface, AMD64 Architecture Processor Supplement](https://gitlab.com/x86-psABIs/x86-64-ABI)
