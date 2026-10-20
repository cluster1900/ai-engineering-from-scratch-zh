# 调用约定与:System V、Windows x64 和 AArch64

> Anti汇编能显示函数读取哪些寄存器,但只有ABI明确这些寄存器的含义,而ABI由目标文件头决定.

**Type:** Build
**Languages:** Python, C, x86-64 and AArch64 assembly
**Prerequisites:** Phase 13 · 32（从零构建 ELF）、Phase 13 · 33（反汇编与控制流）
**Time:** ~140 分钟

## Öğrenme hedefi

- 根据目标文件头选择调用约定:ELF x86-64 使用 System V psABI,COFF AMD64 使用 Microsoft x64,ELF AArch64 使用 AAPCS64,Mach-O arm64 使用 Apple 变体。
- Her ABI'nin bir fonksiyonun başlangıcını çözmesi için, her bir kaydetme cihazı, geri dönüş adresi ve  işaretçi giriş  işaretçisinin göreci yönüne doğru konumlandırılır.
- Giriş  işaretinin yukarıdaki yükleme  parametreler  槽ı 
- 区分 System V'nin bağımsız kaydetme makinesi 区分 System V'nin bağımsız kaydetme makinesi 区分 System V'nin bağımsız kaydetme makinesi 区分 System V'nin bağımsız kaydetme makinesi 区分 Microsoft x64'in konumsal dağılım makinesi 区分 System V'nin bağımsız kaydetme makinesi 区分 System V'in bağımsız kaydetme makinesi 区分 System V'in bağımsız kaydetme makinesi 区分 System V'in bağımsız kaydetme makinesi 区分 Microsoft x64'in konumsal dağılım makinesi 区分 system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system system
- Her sonucu ve kaynak kodu imzası, kural kuralları ve bir düzenleyici ile birlikte`.pdata`- Evet.`.xdata`和 `.eh_frame`Orta üretilen 展开数据核对──
- Ghidra DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA  DATA DATA DATA  DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA      DATA DATA DATA DATA DATA DATA           DATA DATA DATA DATA DATA DATA DATA DATA DATA                DATA DATA    DATA

## 问题

Sen de`-O2`Linux x86-64 için 编译 `convention.c`Sonra radar'ı sor.`eight_args`Bu soruların cevabı yedi.`rdi`- Evet.`rsi`- Evet.`rdx`- Evet.`r8`- Evet.`r9`- Evet.`rsp+0x8`- Evet.`rsp+0x10`C kaynak kodu sadece sekiz element var.`leaq (%rdx,%rcx), %rax`İç çeken`%rcx`Bir kere, araç değişkeninin geri kazanılması sadece adreste bulunan kaydı kaçırmış.

️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️`amd64`- Evet , buldum .`r8`- Evet.`rcx`- Evet.`rdx`Ve üç tane tane tane. Amaç dosyası COFF'dir. Bu nedenle Microsoft x64 için bir düzenleme yapıldı.`r9`, 槽 dört tane olmalı. Aynı kaynak kodunda iki araç farklı kaydedici kayıp etmiştir.

Listesi, talimat sırasıdır, çağrı düzenlemesi, listeden dışındaki anlaşma: hangi kaydı taşıyan parametreler, hangi kayıtlı cihazlar, çağrıda bulunulan kullanıcı tarafından tutulması gereken, geri dönüş adresi ve  parametreleri nerede olduğu, ayrıca çağrıda bulunulan kullanıcı tarafından  göstergesinde neyi tutması gereken bir alanı belirleyen dört belge bu ders sözleşmesini tanımlıyor:System V AMD64 psABI(Version 1.0, yapılandırma tarihi 2025 yılının 12 Mart günü) Bölüm 3.2.1'den 3.2.3'e kadar; Microsoft x64 çağrı düzenlemesi,  Ses kullanımı  Başlangıç ve son sayfalar(sayfalar tarihleri 2018-12-17'den 2025-03-19);Arm AAPCS644  Sürümü  2025 yılının 23 Ocak günü) Bölüm 6.1'den 6.9'e kadar;Apple  64 平台 açıklamaları  Bu kuralları okuyun, sonuçları, aynı dosya sınıfı için kullanılır C  Kayıtlama, yapılandırma ve yapılandırma makinesi konumları  Değilimlemelemeleme biçimleri  Analizleme biçimleri 

```figure
re-38-three-frames
```

## 文件头决定使用哪本规范

`convention.c`On iki işlevi var:`leaf_add`- Evet.`eight_args`- Evet.`mixed`- Evet.`by_value`- Evet.`big_ret`- Evet.`sum_varargs`- Evet.`keeps`, ve beş farklı şekil kullanıyor.`extern`函数的调用者──结构体使用 `long long`MSVC'nin hedefleri`long`4 字节, diğer hedefler 8 字节, ve yapı体大小改变会改变约定──Apple clang 17.0.0 在本机编译七次:`-target x86_64-unknown-linux-gnu`- Evet.`x86_64-pc-windows-msvc`和 `aarch64-unknown-linux-gnu`Çeşitli`-O0`- Evet.`-O2`, tekrar kullan `arm64-apple-macos`编译 `-O2` Linux veya Windows 头文件, bu nedenle kaynak kod kendiliğinden açıklama gerekli içeriği, sadece kendiliğinden içeren clang `stdarg.h`和 `stddef.h`- Evet.

`code/main.py`Orta `describe_object()`读取四字节魔数和一个机器字段, böylece anlaşmayı belirle:

| 文件头 | 字段 | 值 | 规范 |
|---|---|---|---|
| `7f 45 4c 46` ELF | 偏移 0x12 的 `e_machine` | 62 | System V AMD64 psABI |
| `64 86` COFF | 偏移 0 的 `Machine` | 0x8664 | Microsoft x64 |
| `7f 45 4c 46` ELF | `e_machine` | 183 | AAPCS64 |
| `cf fa ed fe` Mach-O 64 | 偏移 4 的 `cputype` | 0x0100000c | 带 Apple 差异的 AAPCS64 |

Aşağıdaki tabloda üç anlaşma var. Neredeyse her satır farklıdır.

| 规则 | System V psABI | Microsoft x64 | AAPCS64 |
|---|---|---|---|
| 整数参数 | `%rdi %rsi %rdx %rcx %r8 %r9`，取下一个空闲寄存器 | `RCX RDX R8 R9`，按位置 | `x0` 至 `x7`，按 NGRN |
| 浮点参数 | `%xmm0` 至 `%xmm7`，取下一个空闲寄存器 | `XMM0` 至 `XMM3`，按位置 | `v0` 至 `v7`，按 NSRN |
| 整数结果 | `%rax`，再 `%rdx` | `RAX` | `x0`，再 `x1` |
| 浮点结果 | `%xmm0`，再 `%xmm1` | `XMM0` | `v0` |
| 结果过大，寄存器装不下 | 地址通过 `%rdi` 传入，“如同第一个参数”，再通过 `%rax` 返回 | 指针通过 `RCX` 传入，参数向右移，通过 `RAX` 返回 | 地址放在 `x8`，不影响 `x0` 至 `x7` |
| 被调用者保存 | `%rbp %rbx %r12` 至 `%r15` | `RBX RBP RDI RSI RSP R12` 至 `R15`，`XMM6` 至 `XMM15` | `r19` 至 `r29`、`SP`、`v8` 至 `v15` 的低 64 位 |
| 入口处第一个栈参数 | `8(%rsp)` | `40(%rsp)`，位于 32 字节影子存储区上方 | `0(sp)` |
| 栈指针以下 | 128 字节红区 | “视为易失” | 无红区（Apple：128 字节） |
| 调用处对齐 | 入口处 `(%rsp + 8)` 为 16 的倍数 | 序言、尾声之外按 16 字节对齐 | `SP mod 16 = 0` |
| 可变参数标记 | `%al` 保存使用的向量寄存器数上界 | 浮点值同时复制到整数寄存器 | 无寄存器标记；Apple 使用 8 字节栈槽 |

## Sistem V: İki bağımsız kaydetmeci sırası ve kırmızı bölge

psABI 3.2.3 her parametreyi her sekiz karakterden birim olarak INTEGER、SSE veya MEMORY olarak sınıflandırır, sonra birbirinden etkilenmeyen iki listeden寄存器¬ları dağıtır.`%xmm0`- Evet .`%xmm7` Eğer bir parametre'nin herhangi bir sekiz karakterli birimi kullanılabilir bir kaydetmeci yoksa, tüm parametre                                                                                                                                                                                                                                                 

`eight_args(a, b, c, d, e, f, g, h)`- Evet .`-O2`Aşağıda 27 字节:

```text
      10: 48 01 fe                     	addq	%rdi, %rsi
      13: 48 8d 04 0a                  	leaq	(%rdx,%rcx), %rax
      17: 48 01 f0                     	addq	%rsi, %rax
      1a: 4c 01 c0                     	addq	%r8, %rax
      1d: 4c 01 c8                     	addq	%r9, %rax
      20: 48 03 44 24 08               	addq	0x8(%rsp), %rax
      25: 48 03 44 24 10               	addq	0x10(%rsp), %rax
      2a: c3                           	retq
```

Önce altı tane kaydetme cihazı kullan, sonra da.`8(%rsp)`和 `16(%rsp)`İki kez yükleniyor.`%rbp`Kökleşme zaman,psABI Resim 3.3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  `16(%rbp)`Bu , henüz baskı yapılmamış giriş yerine eşittir .`8(%rsp)`- Evet.`g`位于 8,`h`16'da.

`mixed(int i, double d, long long l, float f)`展示两个列表──整数占用 `%edi`和 `%rsi`, yani 1. ̊ 2. INTEGER 寄存器; çift ve yüzen 占用 `%xmm0`- Evet.`%xmm1`, yani ilk ̇ ikinci SSE 寄存器 ̇首条指示是 ̇`cvtsi2sd %edi, %xmm2`, içinden `%xmm2`Önceden yazılanlar için de bir süreli kaydetme cihazı var.`cvtsi2sd`Bu, bir diğer deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir de, bir deyişle, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir`mixed`Rapor için`xmm0`- Evet.`xmm1`- Evet.`xmm2``(double arg1, double arg2, double arg3)`- Evet.

`by_value(struct pair p)`16 字节 yapı 2 bütün 8 字节 birim olarak bölünür.`%rdi`- Evet.`%rsi`传入,返回也用两个寄存器:`leaq 0x1(%rdi), %rax; leaq -0x1(%rsi), %rdx; retq`- Evet.`big_ret(long long seed)`返回 32 字节, MEMORY 类──psABI 规定调用者提供返回值空间,并将该存储地址通过 %rdi 作为第一个参数传递──于是 `seed`移到 `%rsi`, işlevi`movq %rdi, %rax`开始,因为返回时 %rax 应包含调用者通过 %rdi 传入的地址──

红区是系统 V'nin bir diğer özelliği.psABI 3.2.2 规定:%rsp 所指位置以下的128 字节区域视为保留,信号或中断处理器不得改.`-O0`Aşağı,`eight_args`Önceden gerçekleştirilmek`pushq %rbp; movq %rsp, %rbp`, tekrar`-0x8(%rbp)`- Evet .`-0x30(%rbp)`6 kez depolama, hiç.`subq`                                                                                                                                                                                                                                                              `sum_varargs``-O2`Yapı kullanımı`subq $0x58, %rsp`Bölüm bölümü, sonra da kayıt makinesi yazıyor.`-0x58(%rsp)`- Evet .`-0x80(%rsp)`En derin açı: 字节,满红区──用 `-mno-red-zone`Aynı dosya oluşturduktan sonra,`leaf_add`增加 `pushq %rax`和 `addq $0x8, %rsp`,将 8 字节局部变量放到指针上方──

可变参数调用额外使用一个寄存器──%al 作为隐藏参数,指定已使用的向量寄存器数,是0至8的上界──`call_varargs`- Evet .`-O2`Kullan .`xorl %eax, %eax`- Yapma.`-O0`Kullan .`movb $0x0, %al`设置──`sum_varargs`İlk olarak oku:`testb %al, %al; je`Yasak bir depolama makinesi kullanırken 8 kez atladı .`movaps %xmmN`- Korumak.

## Microsoft x64: konumlara göre dağılımı 影子存储区与无红区

Microsoft 規則按位置分配──整数参数通过RCX、RDX、R8、R9 传入;浮点参数通过XMM0L、XMM1L、XMM2L、XMM3L 传入──前四个参数中浮点和双精度参数根据位置通过XMM0 - XMM3 传递──同一`mixed`Geldiğine kadar.`%ecx`- Evet.`%xmm1`- Evet.`%r8`- Evet.`%xmm3`:槽 0 is integer, so use `RCX`Çukur 1 iki kat, bu yüzden kullanın.`XMM1`Çukur 3 yüzer, bu yüzden kullan.`XMM3`- Evet.`XMM0`和 `XMM2`- Evet.

调用者也必须预留空间──调用者始终必须分配足以存储四寄存器参数的空间,即便被调用者没有如此多参数──文档称其为影影存区或家地址,四槽实际归归调用函数所有──入口处`0(%rsp)`Adresine dönmek için,`8(%rsp)`- Evet .`39(%rsp)`Dört tane ev çukur, ilk                                                                                                                                                                                                                                                           `40(%rsp)`- Evet.`eight_args`- Evet .`-O2`读取 `0x28(%rsp)`- Evet.`0x30(%rsp)`- Evet.`0x38(%rsp)`- Evet.`0x40(%rsp)`, yani 40、48、56、64¬

调用者一侧展示了计算──`-O2``call8`Önceden gerçekleştirilmek`subq $0x48, %rsp`, 5 , 6 , 7 , 8 ı tekrar yaşayacak`0x20(%rsp)`- Evet .`0x38(%rsp)`, sonra da gerçekleştirir `movl $1, %ecx`等──72 字节, 32 字节 影子区、32 字节'in dört 参数inden oluşur ve geri dönüş adresi 16 字节 sınırının 8 字节inden oluşur.`call_varargs`Sadece寄存器参数, hala kullanılıyor.`subq $0x28, %rsp`分配:32 字节影子区加8 字节对齐──`keeps`压入三个非易失寄存器(24 字节),再执行 `subq $0x20, %rsp`,让 `ext`獲得返回地址下方的 32 字节影子区──

结构体 kendi kurallarına uymaktadır.  herhangi bir yapı 8 字节, veya 大小 değil 1、2、4、8 字节 parametreleri, hepsi 引用传递。16 字节参数 引用传递。 bu nedenle `by_value`- Evet .`%rcx`Bu yüzden, bu bir şey değil.`%rdx`接收结构体副本指针:调用者必须为返值分配内存,指针将作为第一个参数传入,其余参数向右移动一位──`call_pair`Kullan .`movaps`- Evet .`0x20(%rsp)`Yapım yapımını yapın.`leaq 0x20(%rsp), %rdx`传入副本,通过 `leaq 0x38(%rsp), %rcx`传入结果缓冲区,再从 `0x40(%rsp)`读回 `.b`- Evet.

Burada kırmızı bölge yok. RSP'nin mevcut adresleri altında bulunan tüm kaydı kolaylıkla kontrol edilebilir.`-O0``leaf_add`Çevreyi açmak için bir giriş yapın.`pushq %rax`和 `retq`Önceki`popq %rcx`获取,使用两条单字节指令代替 `subq`和 `addq`使用页面对叶函数的定义为:叶函数不需要函数表条目──它不能修改包括 RSP 在内的任何非易失寄存器──

Değişken Parametrler Kullanıcılar Kayıtlayıcıyı Evde Yazır.`sum_varargs`- Evet .`-O2`Önceden bir kez yapın.`pushq %rax`,再将 `%rdx`- Evet.`%r8`- Evet.`%r9`- Evet .`0x18(%rsp)`- Evet.`0x20(%rsp)`- Evet.`0x28(%rsp)`, yani giriş yönü 16、24、32,分別是第二、第三、第四寄存器参数的家槽──其`va_list`Çı`leaq 0x18(%rsp), %rax`,即 `%rdx`Ev 槽, ilk isimsiz parametre.

## AAPCS64, Apple'ın modifi

AAPCS64 6.8.2 İki hesaplayıcı kullanın.`8 - NGRN`个双字的复合类型复制到连续通用寄存器──C.13 规定参数 Once entered,NGRN 设为8,之后不再返回通用寄存器──`eight_args`Kullanım`x0`- Evet .`x7`,                                                                                                                                                                                                                                                               `mixed`Çı`w0`- Evet.`d0`- Evet.`x1`- Evet.`s1`- Evet.`by_value`İçeri ve dışarıda her şey var.`x0`- Evet.`x1`- Evet.

6.9                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `big_ret`写入 `str x0, [x8]`- Evet.`stur q0, [x8, #0x8]`- Evet.`str x9, [x8, #0x18]`, yazma `x0`- Evet.`call_big` ayar `mov x8, sp`... ve ...`seed`Hâlâ orada .`x0`6.9 Ayrıca, çağrıda bulunulanların x8'in değerini koruması gerekmiyor.`x8`Not one of the parameter寄存器.

6.1.1 子程序调用必须保留寄存器 r19-r29 和 SP'nin içeriği. 6.4.5.2 SP mod 16 = 0。为满递减,任何线程都不得读写其下方的非活动区域,因此 Linux `-O0``leaf_add`Çeviri: 8 字节 `sub sp, sp, #0x10`Ve Sistemi V burada kullanıyor.

6.4.6 定義记录:上由两个64位值构成的记录......低地址双字应指向前一记录,高地址双字应包含进入当前函数时传入 LR的值──未规定记录在中的位置──clang 在此文件中显示了两种位置──Linux`-O2``keeps`Kullan .`stp x29, x30, [sp, #-0x30]!; mov x29, sp`Kayıtı aşağıya koyacağız; aynı fonksiyonda.`-O0`Kullan .`sub sp, sp, #0x20; stp x29, x30, [sp, #0x10]; add x29, sp, #0x10`Üstüne bırakırsın.

Apple arm64 açıklaması kaydetme kaydeticisi ve kaydetme kuralları, değişiklikler, kırmızı bölge ve değişken parametreler kullanımı.`keeps`Önceden saklamak`x22, x21, x20, x19`, tekrar kayıtların üstüne yerleştirilir:`stp x29, x30, [sp, #0x20]; add x29, sp, #0x20`                                                                                                                                                                                                                                                              `-O0`叶函数 hâlâ oluşuyor `sub sp, sp, #0x10`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,`call_varargs`10 , 20 , 30 存入`[sp]`- Evet.`[sp, #8]`- Evet.`[sp, #0x10]`Sadece ...`w0`Linux 构建传 `w1`- Evet.`w2`- Evet.`w3`,并以`b extva`尾调用──Apple'ın `sum_varargs`- Ben de .`add x8, sp, #0x10`,即调用者指针, olarak `va_list`Linux'un `sum_varargs`- Ben de .`x1`- Evet .`x7`- Evet.`q0`- Evet .`q7`保存到 224 字节中,并通过 `mov x8, #-0x38; movk x8, #0xff80, lsl #32` 将结构字段 `__gr_offs`İlk olarak -56`__vr_offs`İlk başlama -128

符号也不同──Mach-O için her C 符号加`_`Önceki yazı`_keeps`, Birinci işlevi özel etiketlerde görünmektedir .`ltmp0`Aşağı. Analitik cihazı geçiyor.

## Üç kez elini açmak

`keeps(int n)`Çemberde düzenlenir`ext(i)`, geçiş için kullanılması gerekmektedir.`n`- Evet.`i`和 `acc`Bu yüzden her ABI'nin kaydedilmesi gerekiyor.`-O2`Yapımcılık başlama ayeti:

Sistem V,共 4 字节:

1. `55`Yapımcı numarası düşük üç yerlerde.`push r64`- ...`50 + 5`,即 `%rbp`❖ 8'lik derinlik.`%rbp`Giriş yönü -8..
2. `41 56`- ...`41`Yapıldı.`B`- Evet.`56`Evet .`50 + 6`REX.B 6'a 14'e kadar uzanır:`pushq %r14`-16 pozisyonu
3. `53`Evet .`50 + 3`- ...`pushq %rbx`-24 pozisyonu

Üç kez basın 共 24 字节, tekrar tekrar return address  نىڭ 8 字节,32  16  نىڭ倍数, bu nedenle döngü içinde `callq ext`- Hayır .`subq`Burada yok.`movq %rsp, %rbp`Bu yüzden yapılandırmak için bir işaret yok.`%rbp`Kullanımlı.`acc`Yazıcıların kaydetmesi için bir araç var.`xorl %ebp, %ebp`- Evet.`addl %eax, %ebp`)―尾声是镜像操作:`5b 41 5e 5d c3`- Evet.

Microsoft x64,共 7 字节:

1. `56`-8'in konumudur.`pushq %rsi`- Evet .`57`-16'ın konumudur.`pushq %rdi`- Evet .`53`-24'in konumudur.`pushq %rbx`三者中均为非易失寄存器,而`RDI`和 `RSI`Sistem V'de bir parameter kaydedici var.
2. `48 83 ec 20`:REX.W、带 8 位立即数操作码 `83 /5`ModRM `ec`Çı`11 101 100`,即 `subq $0x20, %rsp`56'lık derinlik.

56 加返回地址等于 64,满足对齐──32 字节就是应提供给`ext`尾声页面只允许添加 RSP,常数或 Lea RSP,常数[FPReg],后接零个或多个 8字节寄存器弹,再接回或jmp;实际字节为`48 83 c4 20 5b 5f 5e c3`- Evet.

AArch64,四个字共 16 字节,小端:

1. `a9bd7bfd`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `stp` 31:30'ın.`10`选择 64 位寄存器,位 25:23 的 `011`选择预索引,位 22 为 0 表示储存──位 21:15 的 imm7 为 `1111010`, yani -6, çarpı 8 -48 ⋅位 14:10 Rt2 = 30, ⋅位 9:5 Rn = 31 ⋅`sp`),位 4:0'ın Rt 为 29。`stp x29, x30, [sp, #-0x30]!`48'e düşecek.`x29`-48'e kadar var.`x30`-40'a kadar var.
2. `f9000bf5`12 bit hareketli, 8                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `str`21:10'ın imm12 = 2,Rn =`sp`21'i.`str x21, [sp, #0x10]`-32
3. `910003fd`Evet , hemen .`add`:imm12 为 0,Rn 为 `sp`Rd için 29`mov x29, sp`-48'den itibaren göstergeyi göster.
4. `a9024ff4`- Evet. - Evet.`stp`:imm7 为 4,缩放为 32;;Rt2 为 19,Rt 为 20;;`stp x20, x19, [sp, #0x20]`- Ben de .`x20`- 16'ı koy.`x19`-8'e yerleştir.

共 48 字节:`x29`位于 0,`x30`位于 8,`x21`16.24'de 8 yazı var.`x20`32'de`x19`位于 40。记录的低地址字指向前一记录,下一个字保存 LR,符合 6.4.6。`cmp w0, #0x1`位於第一、第二次存储之间, 调度器将它移动到序言; analizer 允许操作之间出现比较或算术指令──

## Aynı şeyi iki kez yazmış olacak .

Bir başka ifade oluşturmak için bir başka ifade oluşturmak için bir başka yöntemdir.

Windows'ın ikinci göstergesi`.pdata`和 `.xdata`❖ 不带 `-fno-asynchronous-unwind-tables`Yapımcılık`-O2`目標文件,`llvm-objdump -h`显示 `.xdata`Çıxmak için,`.pdata`Çıktı. Çıktı.`RUNTIME_FUNCTION`, her birinden üç`IMAGE_REL_AMD64_ADDR32NB`重定位──六个函数是 `sum_varargs`- Evet.`keeps`- Evet.`call8`- Evet.`call_varargs`- Evet.`call_pair`- Evet.`call_big`

`keeps``.xdata`字节为 `01 07 04 00 07 32 03 30 02 70 01 60`- Evet.`UNWIND_INFO`开头的3位是版本,随后的5位是旗:版本为1,无标志;;sizeOfProlog为7,CountOfCodes为4,FrameRegister 和 FrameOffset 均为0──每条`UNWIND_CODE`包含一个序言内偏移,以及一个编码操作码和信息的字节──`07 32`Bu da bir çok şey.`UWOP_ALLOC_SMALL`,信息值 3 表示 `3 * 8 + 8 = 32`- Evet.`03 30`Operasyon kodu 0 `UWOP_PUSH_NONVOL`,寄存器编号 3  `rbx`- Evet.`02 70`- ...`rdi`- Evet.`01 60`- ...`rsi` Bu kodlar, uygulanma sırasıyla, üç baskı işleminin ve 32 karakterlerin dağıtımı ile anlatılır.`56 57 53 48 83 ec 20`字节完全一致──`sum_varargs`Çıkışlar`01 01 01 00 01 02 00 00`1 字节序言,包含一条编码,即分配 8 字节的 `UWOP_ALLOC_SMALL`Bu, bir gösteri gözünde.`pushq %rax`Bir kere dağıtma, çünkü`%rax`Bu durumda, bu durumun bir parçası olarak, bu durumun bir parçası olarak, bir diğerinden daha fazla kaydedilmesini sağlayabiliriz.

Linux'da, ikinci yönlü yöntemi:`.eh_frame`, PSABI 4.2.4 tarafından tanımlanmıştır ve DWARF 5 6.4 Bölüm'ün kuralları tarafından kodlanmıştır.`llvm-dwarfdump --eh-frame`, her fonksiyon için bir FDE yazdırır,并解析 `R_X86_64_PC32`重定位, bu nedenle elde edilen adres aralığı doğrudan kullanılabilir.`keeps`- ...

```text
  DW_CFA_def_cfa_offset: +16
  DW_CFA_def_cfa_offset: +24
  DW_CFA_def_cfa_offset: +32
  DW_CFA_offset: RBX -32
  DW_CFA_offset: R14 -24
  DW_CFA_offset: RBP -16
```

CFA                                                                                                                                                                                                                                                              `RBP -16`-8 giriş yönü`R14 -24`-16`RBX -32`CFA                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `keeps`Bu yüzden de bunu yapıyorum.`DW_CFA_def_cfa: W29 +48`,并列出 `W29 -48`- Evet.`W30 -40`- Evet.`W21 -32`- Evet.`W20 -16`- Evet.`W19 -8` Burada CFA'nın giriş  işaretleri kendisidir, bu yüzden bu yönlendirmeler değiştirilmez  yönlendirmeler;`x29`"Kütle" tanımı:`eh_frame_cross_check()`Bu karşılaştırmayı iki hedef dosyasının her biriyle 12 FDE ile yapacağım.`call8`Bu nedenle en derin CFA 偏移ı 32'dir, başlangıç 大小 8'dir; kontrol sırasında, işlev içinde  işaretinin en derin derin 24'e ulaşması ile karşılaştırılır.

## Bu kavramları nasıl adlandırırız?

Bu alanın her bir aracı için belirli bir veri yapısı vardır, ayrıca belirli bir analiz süreci vardır.

**Ghidra 12.1.4（Apache-2.0）。**规则位于 SLEIGH 语言定义旁的编译器规格文件                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `.cspec`İçeride.`x86-64-gcc.cspec`声明了名为 `__stdcall``<default_proto>`,注明源自 2016 年 4 月的 System V Application Binary Interface AMD64 Arsitektur Süperimi──它使用 `<pentry>`列表指定 `XMM0_Qa`- Ne ?`XMM7_Qa`Ve `RDI, RSI, RDX, RCX, R8, R9`,条目偏移 8 开始,为不超过16 字节的类型提供 `join_dual_class`规则,输出为 `XMM0_Qa, XMM1_Qa, RAX, RDX`, ü ü ü ü ü ü ü ü ü ü ü ü`hidden_return`- Evet.`x86-64-win.cspec`Açıklama`__fastcall`, 4 tane kullan .`<group>`- Bu da ...`XMM0_Qa`ile`RCX`- Evet.`XMM1_Qa`ile`RDX`条目 偏移 40 开始, 3 ̊5 ̊6 ̊7 字节 yapısal kullanım 条目 偏移 40 开始, 条目 偏移 40 开始, 条目 偏移 40 开始,  条目 偏移 40 开始,  条目 偏移 40 开始,  条目 偏移 40 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条                                                                                                                                                                                                                                                                                                               `convert_to_ptr`Notasyon yazıyor:  Sadece 8、16、32、64 bit büyüklüğündeki yapıların kayıt makinesine yerleştirilmesi mümkün.`unaffected`列出 `RBX RBP RDI RSI RSP R12`- Ne ?`R15`Ve `XMM6`- Ne ?`XMM15`8'den 39'a kadar.`localrange`İşte bir gölge depolama bölgesi.`AARCH64.cspec`Açıklama`__cdecl`İlk madde:`storage="hiddenret"``x8`Sonra da...`q0`- Ne ?`q7`和 `x0`- Ne ?`x7`; 17 字节及以上的结构体使用 `convert_to_ptr`- Evet .`killedbycall`包含 `x8`,注释写着间接结果位置寄存器,未体现在 pentry 列表中──反编译器的最后阶段名为Establish's Function's Prototype;分析器名为Call Convention ID和Decompiler Parameter ID;程序选项Prototype Evaluation选择默认模型

**IDA Pro 和 IDA Free（Hex-Rays，商业软件；当前版本 9.4，构建号 9.4.260714）。**函数类型 is through SetType 设置的C 声明,IDA 会使用类型信息,反汇编中添加函数参数信息注释──标准约定无法表达位置使用 IDA 自己的约定书写:`int __usercall func@<ebx>(int x, int y@<esi>)`Sonuçlar içeri girecek .`EBX`,将 `y`放入 `ESI`- ...`@<^12.4>`则通过偏移和大小指定位置──`__userpurge`Aynı sayfa aynı, ama ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ `__spoils`, ve bu ders çalışmalarının yeniden başlatılması için gizli parametrelerin gösterilmesi.`__hidden`- Evet.`__return_ptr`和 `__struct_ptr`△反编译器的Dekompile olarak call操作允许为单条指令指定 `__usercall`Ürün: IDA Ücretsiz  Sadece x86 ve x86-64 desteklenir

**Binary Ninja 6.0“Krypton”（Vector 35，商业软件；另有可反编译 x86、x86_64、ARMv7 和 AArch64 的 Free 版本）。** `Platform` 2. İcra ortamı ile ilgili tüm bilgileri içerir, esas olarak kullanılan düzenleme, işletim sistemi ve yapı, platform listesi de dahil`linux-x86_64`- Evet.`windows-x86_64`- Evet.`linux-aarch64`和 `mac-aarch64`Her platformda var .`default_calling_convention`- Evet.`CallingConvention`包含 `int_arg_regs`- Evet.`float_arg_regs`- Evet.`callee_saved_regs`- Evet.`caller_saved_regs`- Evet.`int_return_reg`- Evet.`high_int_return_reg`- Evet.`float_return_reg`, ve iki doğrudan kodlanmış sınıf farkı işaretleri:`arg_regs_share_index` için True 时, parametre tipinden bağımsız olarak, n 个参数  个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 `stack_reserved_for_arg_regs`调用约定使用的影子/归位空间 ──`eligible_for_heuristics`- Evet.`required_arg_regs`和 `required_clobbered_regs`驱动其启发式调用约定检测──平台类型是 `types/platform/`Aşağıdaki C 头文件, her platform adı bir dosya için 应应一个文件──

**radare2 6.2.4（LGPL-3.0，本课已实际运行）。** `afcl`列出架构插件已知的调用约定:x86-64 下为 `amd64 amd64syscall dlang golang golang_abi0 ms p9 reg swift`Arç64'in altını.`arm64 dlang golang p9 reg swift`- Evet.`afc`Rapor mevcut fonksiyonların düzenlenmesi,`afcr`打印从 `cc.amd64.arg0: rdi`- Ne ?`arg5: r9`Ve `ret0: rax`Bu yüzden, bu durumun farkında değilim.`cc-ARCH-BITS.sdb`SDB 文件中──radar2 为 ELF 目标文件选择 `amd64`, COFF 目标文件选择 `ms`Bu fark doğru.`afv`列出参数 ve değişimi,`afs`打印签名──对于Linux 的 `-O2`目標文件,`afv`Çı`eight_args`Yedi parametrini buldum, kayboldu.`rcx`Windows için hedef dosya, bu bulduk.`rcx, rdx, r8`Ve dört tane delik, kayboldu.`r9`İki kayıp kayıt cihazı ortaya çıktı.`lea`İçeri.`mixed`Linux'ta rapor ediyor .`double arg1 @ xmm0, arg2 @ xmm1, arg3 @ xmm2`Windows'ta, bu rakamın raporlama parametre yok.`eight_args`- Ben buldum .`x0`- Ne ?`x7`-`big_ret`则列出 `x0`和 `double arg2 @ d1`, ve işlevi aslında `x8`, bir sürekli yüklenir .`q1`Herkes.`afs`İmzalama`void`Başlangıç, çünkü araçlar geri dönüş türünü belirlememiştir.`-O0`Aşağıda, her element kayıtlı.`afv`Çünkü buldum.`eight_args`Bu sekiz elementin tamamı, bunlardan ikisi                                                                                                                                                                                                                                                          `rbp+0x10`和 `rbp+0x18`- Evet.

**rizin 0.9.1（LGPL-3.0，本课已实际运行）和 Cutter 2.5.0。** `afcl`列出 `amd64 amd64syscall ms reg swift`- Evet.`afc`COFF  hedef dosyaları için geri dönüş`amd64`Microsoft'un 配置'u mevcut olsa da, dosya biçimine göre seçilmedi.`afi`Linux'a göre`eight_args`Yedi parametre listesi, aynı zamanda kayıp.`rcx`;对 Windows 则列出 `r8, rcx, rdx`Ve üç tane tane tane, zaten kaybolmuş.`r9`- Evet .`0x40`- Ne? - Hayır.`afv`Varlık yok; 列出变量命令是`afvl`❖ Kürtmek ❖ rizin'in şekli

**angr 10.0.3（BSD-2，本课已实际运行）。**Önceki işlem`CFGFast`,再运行 `CompleteCallingConventions(recover_variables=True)`, ikili biçime göre olacak .`function.calling_convention`设为 `SimCCSystemVAMD64`- Evet.`SimCCMicrosoftAMD64`Ya da`SimCCAArch64`,并将 `function.prototype`Bir imza için ayarlandı. Üç hedef platformda yeniden başlandı.`eight_args`Tüm sekiz parametre; x86-64 yukarı `big_ret`Gizli işaretleme geri kazanıldı`(BOT*, long long) -> BOT*`, Windows yukarı `by_value`按引用传递的结构体恢复为 `(BOT*, BOT*) -> BOT*`, System V 下's değişken parametreler fonksiyonunu `sum_varargs`恢复为 `(long long, ...)`                                                                                                                                                                                                                                                              `mixed`Şehir geri döndü`(long long, long long, double, float)`,寄存器 doğru ama sırası yanlış, çünkü tüm sayı listesi üzerinde yazılmış listeden önce;AArch64 上的 `big_ret` 被恢复为`(long long) -> double`Kaybolduğunu açıklayın .`x8`约定,并将向量存储操作误读为结果;AArch64 上的 `sum_varargs`则被恢复为16参数,也就是整个寄存器保存区──

**其他工具。**Hopper 6.6.0 MacOS ve Linux'un ticari anti-çevir düzenleyicisi ve anti-kompilatör yönünde; bu ders yürütülmedi veya düzenleme durumunu kaydetti.`frame info`和 `register read`显示实时, bu aynı grupın hareketliliğini gözlemleme yöntemidir. 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書

| 概念 | Ghidra | IDA | Binary Ninja | radare2 / rizin | angr | 本课 |
|---|---|---|---|---|---|---|
| 调用约定对象 | `.cspec` 中的 `prototype` | 函数类型中的调用约定关键字 | `Platform` 上的 `CallingConvention` | `afc` 名称、`cc-ARCH-BITS.sdb` | `SimCC` 子类 | `expected_locations(abi, name)` |
| 各目标平台的默认约定 | 每个 cspec 的 `<default_proto>` | 编译器设置 | `Platform.default_calling_convention` | `afc=`、`anal.cc` | 按格式选择 | `describe_object()` |
| 参数寄存器 | `<pentry>` 列表，用 `<group>` 表示按位置分配 | `__usercall` 中的 `@<reg>` | `int_arg_regs`、`float_arg_regs`、`arg_regs_share_index` | `cc.NAME.argN` | `ARG_REGS`、`FP_ARG_REGS` | `INT_ARG_REGS`、`FLOAT_ARG_REGS` |
| 影子存储区 | `localrange` 的栈偏移 8 到 39 | 隐式处理 | `stack_reserved_for_arg_regs` | `cc.ms.argn=stack` | `STACKARG_SP_DIFF` | `STACK_ARG_BASE[WIN64] = 40` |
| 隐藏结果指针 | `hidden_return`、`storage="hiddenret"` | `__return_ptr`、`__hidden` | 返回类型大于 `int_return_reg` 的容量 | 未建模 | 第一个参数为 `BOT*` | `HIDDEN_RETURN_REG` |
| 被调用者保存寄存器 | `<unaffected>` | `__spoils` 列出相反的集合 | `callee_saved_regs` | 配置文件 | `CALLEE_CLEANUP` 和架构 | `CALLEE_SAVED` |
| 为函数指定约定 | “Call Convention ID”分析器、“Establish Function's Prototype” | 用户或类型库 | 使用 `required_arg_regs` 做启发式检测 | `afc`、`afva`、`aaft` | `CallingConventionAnalysis` | 先读后写分析加规范规则 |

## 动手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/38-calling-conventions-and-stack-frames
python3 code/main.py
```

输出, yedi hedef dosyanın her biri için biçim, makinelerin tipi ve ABI listelerini oluşturur; on iki işlevin her biri için, bir başlangıç karakterini, kaydedilen kaydedilen kaydedeni ve giriş kaydedeni, çekliği,  işaretleri, parametreler kaydedeni,  parametreler kaydedeni, kaydedilen konumunu, geri dönüş kaydedeni veya gizli işaretleri, çağrı derinliğini, ve çağrıda bulunan kaydedeni ve kaydedeni kullanan işlemleri gösterir. Her işlevin raporunda kontrol sonuçları bulunur: kurallar, imzalanmış tarafından elde edilen beklenilen değerler, karakter bölümlerinden gözlemlenenler ve son iki şeyin uyumlu olup olmadığı.

预期结构:

```json
{
  "objects": {
    "convention-x86_64-windows-O2": {
      "format": "COFF", "machine": "AMD64", "abi": "Microsoft x64", "checks": "73/73 agree",
      "functions": {
        "keeps": {
          "prologue": ["56  pushq %rsi", "57  pushq %rdi", "53  pushq %rbx", "48 83 ec 20  subq $0x20, %rsp"],
          "frameBytes": 56,
          "savedRegisters": [{"register": "rsi", "entryOffset": -8}, {"register": "rdi", "entryOffset": -16}, {"register": "rbx", "entryOffset": -24}],
          "parameterRegisters": ["rcx"],
          "returnRegisters": ["rax"],
          "calls": [{"callee": "ext", "depth": 56}],
          "checks": [{"rule": "Microsoft x64: the caller must always allocate ...", "expected": "at least 32 bytes ...", "observed": [56], "agree": true}, "..."]
        }
      }
    }
  },
  "sehCrossCheck": ["..."],
  "ehFrameCrossCheck": {"...": "..."}
}
```

按以下顺序阅读 `code/main.py`- ...

1. `describe_object()`读取 ELF、COFF 或 Mach-O 头部及符号表,返回 ABI 和函数列表──
2. `parse_listing()`- Ben de .`llvm-objdump -d -r`文本分分成函数,保留每调用和跳转的重定位目标,并按应语法标记删除注释:AT&T 使用 `#`,Arch64  kullanın`//`和 `;`Sonraki olanlardan dolayı.`#`Hemen bir sayı getirmek için kullanılır.
3. `effect_x86()`和 `effect_arm()`Bir yönergiyi okumaya, adres okumaya, yazmaya, yüklemeye, depolamaya ve  işaret sayısı olarak dönüştürmek için; AT&T'nin son işlem sayısı, amaç işlem sayısıdır; AArch64'in ilk işlem sayısı, amaç işlem sayısı, depolama, karşılaştırma ve bölme talimatları hariçtir.`lea`读取地址,但不加载任何内容──`mov`- Evet.`cvtsi2sd`- Evet.`setcc`Yasalar ve uygulama`xor r, r`Bu işlemlerin amacı sadece yazılmamış okumaktır.`sp`, 后索引加载则在访问后移动它──
4. `analyze_function()`Birinciyle karşılaşana kadar bir işlevi tekrar tekrar at.`ret`Ya da en son atlamak. Bu, giriş değerinin indirim değerine göre hareket etmesinin derinliğini takip eder.`disp(%rsp)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `disp - depth`... ve ...`disp(%rbp)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `frame_pointer + disp`                                                                                                                                                                                                                                                              
5. `_return_registers()`Bu seçeneği, bir veri işleminin bir parçası olarak seçilecek; bir adres olarak, bir adres olarak okunacak, bu nedenle Microsoft x64 aşağıdaki `big_ret`İçeride,`movq %rcx, %rax`后通过 `(%rax)` depolama sırasında,`rax`仍被保留为候选结果寄存器──
6. `expected_locations()`Üç set kural uygulanır C  imza:System V'nin iki listesi ve sekiz karakter bölümü, Microsoft'un konum yuvası ve alıntılı aktarma yapılandırması, ayrıca AAPCS64'in hesaplayıcıları ve 16 karakterden büyük olan sonuçlar için kullanılır.`x8`- Evet.
7. `run_checks()`Bu iki durumu karşılaştırın,并加入 規則: 被调用者保存寄存器必须先保存; 每次调用时必须满足`(rsp + 8) % 16 == 0`Ya da`sp % 16 == 0`Her Microsoft 调用都必须有32字节影子空间;Microsoft 和 AAPCS64 下不得访问指针下方,System V 下最多访问其下方 128字节;尾声必须与序言对应,并将指针恢复到输入值──
8. `seh_cross_check()`和 `eh_frame_cross_check()`读取未使用 `-fno-asynchronous-unwind-tables` yapılandırma hedef dosyasının açılış verileri,  başlıkların çözülmesi sonuçlarıyla karşılaştırılmaktadır.

Başka üç emir var.`python3 code/main.py analyze convention-x86_64-windows-O2 keeps`打印单个函数──`python3 code/main.py object FILE`Başkanın verdiği kararlara göre basın.`python3 code/main.py seh`打印每个具有 `UNWIND_INFO`Bu da bir işlev.

## 实际使用

İnşa ettiğiniz yeni hedef dosyaları için aşağıdaki sırada kullanın analizer.

1. 运行  İşlem`python3 code/main.py object FILE.o`Eğer başlık yapı emrine uymayacaksa, önce durup gel; ikisi de karşı karşıta olmalı.
2. Hedef dosyasının yanında saklanmak`llvm-objdump -d -r FILE.o`Bu yüzden, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuyla ilgili olarak, bu konuylacak,`sub`- Evet.
3. Kaynak imza onaylama ve 偏移── imza açıklanamayan 寄存器, gizli işaret  değişken 参数 işaretleri, ya da analizci tarafından yanlış değerlendirilmiş 参数 geçici 寄存器 olabilir. Son durum, talimat etkisi tablosunun eksikliği içindir ve bu talimatın genel kurallarına uygulanmalıdır.
4. Eğer muayene sonuçları birbiriyle uyumlu değilse, her muayene, temel kurallarını belirler, bu nedenle önce muayene kuralları, tekrar muayene et, son muayene analizisleri vardır.
5. Eğer hedef dosyaların açık veri, yürütme ve geçiş kontrolü varsa, bu iki yönlendirme yolunun birbirine uyumlu olması, bu dersin sağlayabileceği en güçlü kanıtlardır.
6. Eğer diğer araçlar yüklenirse, kesin emirleri ve çıkışlarını kaydet ve karşılaştırın.

## 交互实验

### 实验 A:一条指令,三种效果

- Evet .`code`Python'u aç:

```bash
cd phases/13-tools-and-protocols/38-calling-conventions-and-stack-frames/code
python3 -q
```

运行:

```python
from main import *
effect(Instruction(0, "48 8d 04 0a", "leaq", "(%rdx,%rcx), %rax"), SYSV)
effect(Instruction(0, "f2 0f 2a d7", "cvtsi2sd", "%edi, %xmm2"), SYSV)
effect(Instruction(0, "a9bd7bfd", "stp", "x29, x30, [sp, #-0x30]!"), AAPCS64)
```

Her seferinde, önce yazın, önce yazın, sonra kullanın.`ldp`,将 `[sp, #-0x30]!`改为 `[sp], #0x30`, nasıl artış olduğunu görmek için`sp_delta`移到 `post_sp_delta`- Evet.

### 实验 B: keeps 的

```python
info, listing = load_fixture("convention-aarch64-linux-O2")
keeps = analyze_function("keeps", listing["keeps"], info.abi)
keeps.saved
keeps.frame_pointer
[c.to_dict() for c in frame_cells(keeps)]
```

Yukarıdaki el çözümü ile kıyasla.`convention-arm64-macos-O2`Aynı üç satır kodunu kullanmaz. Kayıtlar -16.4'e kadar taşınır.`convention-x86_64-linux-O2-fp`- Bakın .`keeps``saved`Bir de bir yazı çıktı.`pushq %rax`Tek amacı, ayarlama yapmaktır.`(rsp + 8)`16'ın çoğunun sayısı.

### 实验 C:mixed 的先读后写分析

```python
info, listing = load_fixture("convention-x86_64-linux-O2")
mixed = analyze_function("mixed", listing["mixed"], info.abi)
mixed.param_registers
mixed.return_registers
expected_locations(SYSV, "mixed")["parameters"]
expected_locations(WIN64, "mixed")["parameters"]
```

Sistem V'nin listesi`rdi, xmm0, rsi, xmm1`Microsoft'un listesi`rcx, xmm1, r8, xmm3`▽ şimdi yükle Windows 目标文件, tekrar çalıştır ▽ ∞ sonra aç Linux 目标文件的radar2 输出记录,找到 ∞`[afv mixed]`Üç çiftlik. Üçüncü çiftlik.

### D: Gösterme Aracının İkinci Kararı

```python
for row in seh_cross_check():
    print(row["function"], row["sizeOfProlog"], row["unwindPushes"], row["unwindAllocBytes"], row["agree"])
for row in eh_frame_cross_check("convention-x86_64-linux-O2-eh"):
    print(row["function"], row["cfiSaved"], row["cfiMaxOffset"], row["deepestStack"], row["agree"])
```

Çevreyi bul .`sum_varargs``pushq %rax`Neden açıklama yapıldığını açıklayın.`.eh_frame`Çıkışın içinde bul`call8`Bu 32'nin açıklaması.

## 实践实验

Dördüncü hedef platformu ve dördüncü kural kuruluşu ekleyin.

要求:

- Kullanım`-target x86_64-apple-macos -O2`编译 `convention.c`,并记录汇编清单──扩展 `describe_object()`Mak-O'nun okuduklarını öğrenin.`cputype`0x01000007, ve x86-64'te Apple'a görüntülenir.`_`符号前──
- 检查每个函数是否通过系统 V 检查――记录你在序言中发现的唯一差异:Darwin 在所有优化级中保留指针――
- 添加使用 `-fstack-protector-strong`构建的Linux x86-64 目标文件──扩展序言扫描,将从 `%fs:0x28`Ürünler ve yerleşim devreye kaydedilen değişiklikler için bir çalışma kaydı.`canary`单元,并将 `ret`Önceki İçerikler:
- Bir test ekle, bir test başarısız olur.
- Önceden, el yazısı`with_canary`风格代码的布局,并将图案与测试放在一起.

Başarılılık standartları:`python3 code/main.py`Rapor yeni hedef dosyalarının tüm kontrolleri aynıdır ve korunan fonksiyonun  birimleri, yerel değişken ve kaydedilen kayıtlama cihazları arasında yer alan birimleri göstermektedir.

## 本课产物

本课提供 `outputs/skill-calling-conventions-and-stack-frames.md` Kullanıp, oluşturduğunuz hedef dosyaları, oluşturduğunuz listeyi ve imzalarını parametre konumlarına dönüştürmek, düzenlemeyi, geri gönderme kaydını kullanmak ve bir projeyi onaylamak için, kurallara ve düzenleyicinin oluşturduğu açılış verilerine uygun olup olmadığını belirlemek.`cvtsi2sd`Ya da`xor r, r`Bu nedenle, bu işlemler, bir süre sonra gerçekleşir.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/38-calling-conventions-and-stack-frames
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明:

- 七个目标文件的ELF、COFF 和 Mach-O 头部对应 System V、Microsoft x64、AAPCS64 和 Apple arm64
- Her hedef dosyanın simgesi aynı 12 işlevi listeler ve doğru şekilde Mach-O'yu işliyor.`_`Ön ve `ltmp0`标签:
- 汇编清单解析器保留 `ext`作为调用目标,并完整保留 `#-0x30`等 AArch64 立即数
- `leaq (%rdx,%rcx), %rax`读取两个地址寄存器而不加载数据;`xorl %eax, %eax`和 `cvtsi2sd`Bu yüzden de bu işlemi yapıyorum.`stp`Depolama ön hareket`sp`, 后索引`ldp`则在加载后移动它
- `-O2`Aşağıda `keeps`Sistem V'de`55 41 56 53`Açık,  24 字节 ve  指针; Microsoft x64 上以`56 57 53 48 83 ec 20`开头,为 56 字节;在 AArch64 上首先出现 `a9bd7bfd`-48'de kayıtlı.
- Apple'ın tasarımı kayıtları -16, dört kaydedilen kayıt makinesi üzerinde yerleştirilir.
- Linux'un her işlevi var.`-O0`Aşağıda bir işaret var.`-O2`Aşağıda yok.`-fno-omit-frame-pointer`İndirimleri geri kazanmak ve tam bir basınç işlemine getirmek
- `-O0`叶函数在 System V 下使用 8 字节红区,在 Microsoft x64 下使用 `pushq %rax`, AAPCS64 下使用 `sub sp, sp, #0x10`- ...`-mno-red-zone`Çekilmez kırmızı bölge kullanımı
- Her son son, başlangıçta,  işaretleri giriş değerine geri döndürülmüştür.
- İki seviye seviyesinde,`eight_args`Bölük bölük 6 kayıtlı ve 16 yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın yığın y`x0`- Ne ?`x7`
- `mixed`Sistem V 下使用`rdi, xmm0, rsi, xmm1`, Microsoft x64 下使用 `rcx, xmm1, r8, xmm3`, ikisi de kullanılıyor .`xmm0`返回結果
- 16 字节 Structure体 in System V ve AAPCS64 下通过两个寄存器传递, Microsoft x64 下则在隐藏指针后按引用传递
- 32 字节                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `rdi`- Evet.`rcx`Ya da`x8`Geri dön
- Çevirici parametre                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `%al`,将 `rdx, r8, r9`16 、24 、32'ye kadar, kaydetmek`x1`- Ne ?`x7`和 `q0`- Ne ?`q7`, veya Apple'da  kullanıcı göstergesi
- 调用器 预期寄存器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调用器 调`%al`,并通过 `rdi`- Evet.`rcx`Ya da`x8`传递结果缓冲区地址
- Tüm 489 inceleme kendi kurallarına uygun .
- - Evet .`UNWIND_INFO`条目与序言解析结果吻合,叶函数则没有这些条目
- 24 FDE kaydetme kaydeticisinin en derin işaret konumuna ve hareketine uygun
- 工具输出记录包含雷达2 的 `amd64`和 `ms`COFF hedef dosyalarına yönelik risinler`amd64`Kaybolmuş.`rcx`、三 çift, ve angr'ın orijinal tipi
- 嵌 sitesi modülünün grafik verileri ve analizer çıkışları e.

## 生产环境中的失败模式

| 失败情况 | 能力不足的工具会报告什么 | 分析必须证明什么 |
|---|---|---|
| 将 COFF 目标文件按 System V 读取 | 将函数从未读取的 `rdi` 和 `rsi` 视为参数 | 头部给出 0x8664；调用约定是 Microsoft x64 |
| 寄存器只在 `lea` 内被读取 | 为八参数函数报告七个参数 | 基址和索引寄存器都属于读取 |
| 将 `cvtsi2sd` 的目的操作数计为读取 | `xmm2` 中出现第三个 double 参数 | 对 `xmm2` 的首次写入就是写入；`mixed` 只有两个 SSE 参数 |
| 将位置槽位误读为独立序列 | 将 Windows 上的 double 参数判定为 `xmm0` | 槽位 1 是 `XMM1`，槽位 3 是 `XMM3` |
| 将 `push rbp` 视为建立帧指针 | 在把 `rbp` 用作累加器的 `-O2` 函数中报告帧指针 | 只有压栈后的 `mov %rsp, %rbp` 才会建立帧指针 |
| 从入口栈指针测量红区 | “栈指针下方”有 216 字节 | 执行 88 字节的 `sub` 后，是当前栈指针下方的 128 字节 |
| 将影子存储区视为局部变量 | 栈参数位于 8 到 32 | Microsoft 栈参数从 40 开始 |
| 将 `lea` 视为加载 | 可变参数被调用者的 `0x60(%rsp)` 处有一个栈参数 | `lea` 计算的是 `overflow_arg_area`，并未加载数据 |
| 将隐藏指针视为普通参数 | `big_ret(void *, long long)` | 经由该指针执行存储，且它分别被复制到 `rax`、`rax`，或保留在 `x8` 中 |
| 将最深 CFA 与序言栈帧比较 | 对压入传出参数的调用者报告不匹配 | 应与函数体中栈指针达到的最深位置比较 |
| 根据 ISA 直接断定调用约定 | 为 COFF 目标文件报告 `amd64` | 文件格式选择规范，ISA 再选择寄存器 |
| 只信任单个工具给出的原型 | 三个 double，或十六个可变参数 | 必须得到源码签名或第二条推导路径的印证 |

## Operasyon kuralları

İlk talimatın başlığını okuyarak, kullanılmış kuralları belirleyin. Giriş  işaretinin hareketini kullanarak, her kaydedilen kaydı ve her parametreyi belirleyin. Bu konuma yerleştirme kurallarına göre, aynı zamanda, bir yazıcı tarafından yazılan açık verileri kontrol edin.

## 延伸阅读

- [System V Application Binary Interface, AMD64 Architecture Processor Supplement, Version 1.0 (sections 3.2.1 to 3.2.3, 4.2.4)](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Microsoft x64 calling convention](https://learn.microsoft.com/en-us/cpp/build/x64-calling-convention)
- [Microsoft x64 stack usage](https://learn.microsoft.com/en-us/cpp/build/stack-usage)
- [Microsoft x64 prolog and epilog](https://learn.microsoft.com/en-us/cpp/build/prolog-and-epilog)
- [Microsoft x64 exception handling: RUNTIME_FUNCTION, UNWIND_INFO, UNWIND_CODE](https://learn.microsoft.com/en-us/cpp/build/exception-handling-x64)
- [Arm Procedure Call Standard for the Arm 64-bit Architecture (AAPCS64), release 2025Q4](https://github.com/ARM-software/abi-aa/blob/main/aapcs64/aapcs64.rst)
- [Apple: Writing ARM64 code for Apple platforms](https://developer.apple.com/documentation/xcode/writing-arm64-code-for-apple-platforms)
- [DWARF Debugging Information Format Version 5, section 6.4 Call Frame Information](https://dwarfstd.org/doc/DWARF5.pdf)
- [Clang driver frame-pointer defaults, `useFramePointerForTargetByDefault` in `CommonArgs.cpp`](https://github.com/llvm/llvm-project/blob/main/clang/lib/Driver/ToolChains/CommonArgs.cpp)
- [Clang command line reference: `-fomit-frame-pointer`, `-momit-leaf-frame-pointer`](https://clang.llvm.org/docs/ClangCommandLineReference.html)
- [Fedora 38 change: frame pointers by default](https://fedoraproject.org/wiki/Changes/fno-omit-frame-pointer)
- [Ubuntu 24.04: performance engineering with frame pointers by default](https://ubuntu.com/blog/ubuntu-performance-engineering-with-frame-pointers-by-default)
- [Ghidra compiler specification: `x86-64-gcc.cspec`](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Processors/x86/data/languages/x86-64-gcc.cspec)
- [Ghidra compiler specification: `x86-64-win.cspec`](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Processors/x86/data/languages/x86-64-win.cspec)
- [Ghidra compiler specification: `AARCH64.cspec`](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Processors/AARCH64/data/languages/AARCH64.cspec)
- [Hex-Rays: SetType and the `__usercall` convention](https://docs.hex-rays.com/ida-actions/settype)
- [Hex-Rays: Decompile as call](https://docs.hex-rays.com/ida-actions/hx_userdefinedcall)
- [Binary Ninja API 6.0: `callingconvention` module](https://api.binary.ninja/binaryninja.callingconvention-module.html)
- [Binary Ninja API 6.0: `platform` module](https://api.binary.ninja/binaryninja.platform-module.html)
- [Binary Ninja user documentation: platform types](https://docs.binary.ninja/guide/types/platformtypes.html)
- [The Official Radare2 Book: calling conventions](https://book.rada.re/analysis/calling_conventions.html)
- [The Official Radare2 Book: code analysis](https://book.rada.re/analysis/code_analysis.html)
- [angr documentation: decompiler analysis passes, including calling convention recovery](https://docs.angr.io/en/latest/analyses/decompiler.html)
- [radare2 6.2.4 release](https://github.com/radareorg/radare2/releases/tag/6.2.4)
- [rizin 0.9.1 release](https://github.com/rizinorg/rizin/releases/tag/v0.9.1)
