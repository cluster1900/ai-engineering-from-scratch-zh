# 提升为伪代码:零构建 IR、SSA与结构化

> Anti-kompilatörün çıkışı, bir yönlendirme sürecinin ifadelerini gizleyen bir gruptur.

**Type:** Build
**Languages:** Python, C
**Prerequisites:** Phase 13 · 32（从零理解 ELF）、Phase 13 · 33（反汇编与控制流）
**Time:** ~150 分钟

## Öğrenme hedefi

- Açıklama, kaydetme, depolama, bölme, düzenleme ve geri dönüş için, küçük IR olarak yükseltme yöntemi.
- Sistemi V 参数寄存器 槽位 形参数 形参数 
- Kontrol sınırında bir phi  işlevi yerleştirerek, en az SSA oluşturmak için, sonra değiştirmek için, basitleştirmek ve ölme kodunu ortadan kaldırmak için kullanılır.
- Kontrol etkisi ve geri dönüş noktasını kullanmak, kontrol etkisi içinde yeniden kurulmak`if`、带 `else``if`- Evet.`while`和 `do while`- Evet.
- - Yukarıdaki`0x66666667`解释为除以 10,并证明这个恒等关系――
- 逐行阅读同一组函数的 Ghidra 伪代码, 指出每处差背后的指令或猜测──

## 问题所在

- Lütfen.`ledger-x86_64-O1.o`İçeride`percent_change`12.1.4 yaklaşık 10 saniye sonra cevap verdi:

```c
undefined1  [16] percent_change(int param_1,int param_2,ulong param_3)

{
  long lVar1;
  undefined1 auVar2 [16];
  undefined1 auVar3 [16];
  
  if (param_1 != 0) {
    lVar1 = (long)((param_2 - param_1) * 100);
    auVar3._0_8_ = lVar1 / (long)param_1 & 0xffffffff;
    auVar3._8_8_ = lVar1 % (long)param_1 & 0xffffffff;
    return auVar3;
  }
  auVar2._8_8_ = 0;
  auVar2._0_8_ = param_3;
  return auVar2 << 0x40;
}
```

Çıkış kodu sadece dört satır, iki tane al.`int`值并返回一个  değer`int`Ghidra'nın 16 字节 geri dönüş değerini ve kaynak kodunda bulunmayan üçüncü parametreni bildirdi. Ghidra'nın her bir 字节 için açıklaması da doğru.

Bu makaleyi gerçekleştireceğim.`procedure_pseudo_code`Bu nedenle, bu kısıtlamalar, HOPPER'in 输出文本等价──`compare_functions`工具按文本行对伪代码做差异比较──它自己的维度记录写着汇编是不透明的提供方文,并说明无法进行重定位归归化──area 无法透视这些文本,只读取文本的代理也一样──

rea'nın DX-Ball kayıtları fiyatı gösterdi.`FUN_00406400(void)`调用 `__ftol()`◊ talimat görüntüsü bir  giriş ve bir x87 ifade gösterir.

Bu ders, bir yazıcıya karşı bir yazıcı oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu oluşturmak için bir kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kurgu kur`percent_change`- Evet.`grade`和 `total`伪代码与Ghidra的输出并排对照,解释每处差异──测试会使用 clang 编译你的输出,并输入网格上运行它,与源码进行对比──

```figure
lifting-stages-percent-change
```

## 测试样例与参考判定

`code/fixtures/ledger.c`Bu bölümde ortak kullanımlı test örnekleri:

```c
int percent_change(int before, int after) {
    if (before == 0) return 0;
    return (after - before) * 100 / before;
}

int grade(int score) {
    switch (score / 10) {
    case 10:
    case 9: return 4;
    case 8: return 3;
    case 7: return 2;
    case 6: return 1;
    default: return 0;
    }
}

int total(const int *values, int count) {
    int sum = 0;
    for (int i = 0; i < count; i++) sum += values[i];
    return sum;
}
```

文件和目标文件中还包含 `grade_label`Bu ders testinin üstteki üç işlevi vardır.

目标文件使用 `clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c ledger.c`构建──旁边还存放用于槽位章节的 槽位章节的 槽位章节的 槽位章节的 槽位章节的 槽位章节的 槽位章节的 槽位章节的 槽位章节的 槽位章节的 旁边还存存着的`-O0`目標文件──`code/fixtures/README.md`列列列两条构建命令、每个目标文件的SHA-256,以及生成 Ghidra 测试样例的实际命令── 在固定版本的工具链上,构建结果可逐字节复现──

Çözme cihazının referansı `llvm-objdump -d -r`◊ İki hedef dosya için oluşturulan metin gönderildi.`ledger-x86_64-O1.objdump.txt`和 `ledger-x86_64-O0.objdump.txt`                                                                                                                                                                                                                                                              `-O1`Tüm 56 条 emirleri ve `-O0`Eğer sabit yol altında yüklenmişse.`llvm-objdump`, ikinci test tekrar gerçek sahada çalışır, tekrar bir kez karşılaştırmak.

参考工具打印的 `percent_change`Aşağıda:

```text
0000000000000000 <percent_change>:
       0: 85 ff                        	testl	%edi, %edi
       2: 74 09                        	je	0xd <percent_change+0xd>
       4: 29 fe                        	subl	%edi, %esi
       6: 6b c6 64                     	imull	$0x64, %esi, %eax
       9: 99                           	cltd
       a: f7 ff                        	idivl	%edi
       c: c3                           	retq
       d: 31 c0                        	xorl	%eax, %eax
       f: c3                           	retq
```

## 阶段 1: from字节 to instruction

Bölüm 33 Kodeyi Bilmek için Kurul: Bu Kurul: Küçük bir kopyasını koru, kodun bağımsız çalışmasına izin ver.`ledger.c`- Evet .`-O0`和 `-O1`Aşağıda oluşturulan işlem kodları... Diğer işlem kodlarına rastladığında, dışarı atılır.`DecodeError`,附带地址和操作码字节──

解码器 Intel SDM 第2卷 第2.1 节 规定的字节序列: öncelikle 前, sonra操作码、ModR/M、SIB、位移量,最后是立即数──第2.2.1 节加入了REX 前, it is `0x40`- Ne ?`0x4F`之间一个字节,必须紧邻操作码之前――REX.W 选择 64 位操作数,REX.R 扩展 `reg`字段,REX.X 扩展 SIB 索引,REX.B 扩展 `r/m`Ya da SIB 基址──第 2.1.3 节 define ModR/M'nin üç bölümünü tanımladı`mod`- Evet.`reg`- Evet.`r/m`, ve SIB'nin üç bölümünü`scale`- Evet.`index`- Evet.`base`64'te bir modde,`mod = 00`ile`r/m = 101`组合表示对下一条指示的32位位移量 (→ 2.2.1.6 节) ⋅

| 操作码字节 | 形式 | 测试样例中的示例 |
|---|---|---|
| `01 29 31 39 85 89` | `op Ev, Gv` | `29 fe` `subl %edi, %esi` |
| `03 2b 3b 8b 8d` | `op Gv, Ev` | `03 04 97` `addl (%rdi,%rdx,4), %eax` |
| 带 REX.W 的 `63` | `movsxd Gv, Ev` | `48 63 c7` `movslq %edi, %rax` |
| `69` 和 `6b` | `imul Gv, Ev, imm` | `48 69 c0 67 66 66 66` |
| `83 /0 /5 /7` | `add sub cmp Ev, imm8` | `83 c1 fa` `addl $-0x6, %ecx` |
| `c1 /5 /7` | `shr sar Ev, imm8` | `48 c1 f9 22` `sarq $0x22, %rcx` |
| `f7 /7` | `idiv Ev` | `f7 ff` `idivl %edi` |
| `ff /0 /4` | `inc Ev`, `jmp Ev` | `48 ff c2` `incq %rdx` |
| `70` 到 `7f`、`eb`、`e8` | `jcc rel8`、`jmp rel8`、`call rel32` | `74 09` `je 0xd` |
| `99`, `c3`, `90`, `0f 1f` | `cltd`, `retq`, `nop` | `66 0f 1f 44 00 00` `nopw (%rax,%rax)` |

`grade+0x23`- Ne ?`leaq (%rip), %rcx`长七字节,位移量为零──目标文件在位移字段的偏移 `0x36`Bir tane yeniden yerleştirme.`R_X86_64_PC32.rodata+0x10`❖ 提升器会在阶段 3 解析它──

## 阶段 2: temel blok ve kontrol noktası

基本块 (Basis) bir语句序列, üst kısmı sadece bir giriş, alt kısmı sadece bir çıkışdır.`build_blocks()`收集块首地址:函数入口、函数内每个跳转目标,以及每个跳转或返回命令后的地址──每个块的后续由其最后条命令决定──条件跳转有两个后续,`jmp`Bir tane var.`ret`没有后继,以普通命令结尾的块则顺序落入下一个块首地址──

`-O1`Aşağıda `total`Beş temel parça var:

| 基本块 | 指令 | 后继 |
|---|---|---|
| `0x40` | `testl %esi, %esi`，然后是 `jle 0x5c` | `0x5c`、`0x44` |
| `0x44` | `movl %esi, %ecx`, `xorl %edx, %edx`, `xorl %eax, %eax`, `nopw` | `0x50` |
| `0x50` | `addl (%rdi,%rdx,4), %eax`, `incq %rdx`, `cmpq %rdx, %rcx`, `jne 0x50` | `0x50`, `0x5b` |
| `0x5b` | `retq` | 出口 |
| `0x5c` | `xorl %eax, %eax`，然后是 `retq` | 出口 |

`immediate_dominators()`Cooper, Harvey ve Kennedy'nin 2001'deki generation algoritmasını gerçekleştirdi. Bu, daha önce işlenmiş olan drive'nin kontrol noktalarını, daha fazla değişmeden önce, temel parçaları üzerinde bir arada tutarak, bu kadar küçük bir çizim için iki kez tamamlanabilir.`total`- Evet .`0x44`支配 `0x50`- Evet .`0x50`通過回邊支配自身,阶段 8 正如在此的发现循环──

Aynı işlevi tekrar tekrar kullanır.`dominance_frontiers()`SSA kullanın.`post_dominators()`则在添加虚拟出口节点的反向图上运行它,寻找汇合点──

## 阶段 3: 提升为小型 IR

IR 包含六种语句:`Assign`- Evet.`Store`- Evet.`Branch`- Evet.`Jump`- Evet.`IndirectJump`和 `Return`◊ ifade, her zamankın ≠ ≠ ≠ ≠ ≠ ≠ ≠ ≠ ≠ ≠ ≠ ∞ ≠ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞`sext`- Evet.`zext`- Evet.`trunc`) ve yüklenmesi. Diğer beş biçim daha sonra basitleştirilmiş ve ortadan kaldırılmış olarak mevcuttur:`Flags`- Evet.`Cond`- Evet.`Concat`- Evet.`SignFill`和 `Symbolic`- Evet.

寄存器被表示为其64位寄存器族命名的变量──写入`%eax`Evet , evet .`rax`Bir kez 32'lik bir yer.`Assign`,读取 `%eax`则是以 32 位宽读取 `rax` 64 bit mode'de 32 bit yazışın tüm kaydeticine yayılması, böylece aynı değer için 64 bit okuma tek bir kez yapılması `zext`❖ 升升器 hangi anlamda okuma konumunu elde edeceğini bilmiyor, bu yüzden önce okuma alanını kaydet, SSA'nın 5'inci aşamada 插入转换――

| 指令 | IR 语句 |
|---|---|
| `subl %edi, %esi` | `flags = cmp(esi, edi)`，然后是 `esi = esi - edi` |
| `testl %edi, %edi` | `flags = test(edi, edi)` |
| `je 0xd` | `if je(flags) goto 0xd else goto 0x4` |
| `xorl %eax, %eax` | `eax = 0` |
| `cltd` | `edx = signfill(eax)` |
| `idivl %edi` | `dividend = edx:eax`, `eax = dividend / edi`, `edx = dividend % edi` |
| `movslq %edi, %rax` | `rax = sext64(edi)` |
| `sarq $0x22, %rcx` | `rcx = rcx >>s 34` |
| `shrq $0x3f, %rax` | `rax = rax >>u 63` |
| `addl (%rdi,%rdx,4), %eax` | `flags = add(eax, load32(rdi + rdx * 4))`，然后是 `eax = eax + load32(rdi + rdx * 4)` |
| `leaq (%rip), %rcx` 及其重定位项 | `rcx = &.rodata+0x14` |
| `pushq %rbp`、`movq %rsp, %rbp`、`subq $0x10, %rsp`、`popq %rbp` | 不生成语句，仅用于栈帧管理 |
| `retq` | `return rax` |

### Geçicilik gösterir

Her kuralın kuralları yazılı olarak belirlenir.`flags`Her koşul değişir, her koşul değişir, her şey değişir.`cmp a, b`写入 `cmp(a, b)`- Evet .`test a, b`写入 `test(a, b)`- Evet .`sub`则作为副作用写入 同样 `cmp`形态──`jcc`变为 `Branch(Cond(cc, flags), target, fallthrough)`◊ Şartlı bir şekilde, koşullar ile belirlenen 6'da karşı karşıya kalırken, koşullar belirlenir:

| 条件码 | 在 `cmp(a, b)` 之后 | 在 `test(a, a)` 之后 |
|---|---|---|
| `je` | `a == b` | `a == 0` |
| `jne` | `a != b` | `a != 0` |
| `jl`、`jge`、`jle`、`jg` | 有符号 `<`、`>=`、`<=`、`>` | 与 0 进行有符号比较 |
| `jb`、`jae`、`jbe`、`ja` | 无符号 `<`、`>=`、`<=`、`>` | 与 0 进行无符号比较 |

`xorl %eax, %eax`直接提升为 `eax = 0`                                                                                                                                                                                                                                                              `add`风格的标志,测试样例中没有跳转读取这些标志──`xor`Bu alışkanlıklı bir yöntem.`grade`İçinde çok önemli, Ghidra ise onu saklamadı.

### KTM ve İDİV

`cltd`Kullan .`%eax`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `%edx`- Evet.`idivl %edi`64 bit寄存器对`%edx:%eax`Üstelik`%edi`,商写入 `%eax`,余数写入 `%edx`❖ 提升器 öncelikle bu dosyayı 写入名为 olarak adlandırır.`dividend`Bu yüzden, kalan sayılar `%eax`SSA'da, yüksek yarı bölüm düşük yarıya kadar ortaya çıkıyor.`signfill`◊ 化简器 化简器 化简器 化简器 化简器 化简器 化简器 化简器 化简器 化简器 化简器 化简器 化简器 化简器 化简器 化简器 化简器 化简器 化简为低半部 除法也变成32位 `/`- Evet.

### -O0 Aşağıdaki 槽位

- Evet .`-O0`Aşağıda, her bölge değişimi içinde kalacak.`percent_change`- Ne ?`%edi`- Evet .`-0x8(%rbp)`, `%esi`- Evet .`-0xc(%rbp)`Aradan sonra her kullanımda tekrar okuyorum.`movq %rsp, %rbp``pushq %rbp`在这个函数序言后,基址为 `%rbp`、 hiçbir gösterge ve yer taşıma miktarı ile bellek işletim sayısı, isim değiştirir `local_<hex>`Değişiklikler.`-0x8(%rbp)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `local_8`- Evet .`-0xc(%rbp)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `local_c`- Evet.

 emir kendi kendine IR üretmez, `%rsp``subq`和 `addq`Ayrıca üretilmiyor. Diğer kayıtlı işlem sayısı hâlâ devam ediyor.`Load`Ya da`Store`- Evet.

### 重定位

`grade`Orta `leaq (%rip), %rcx`Dosyalarda yer değiştirme miktarı = 0.`0x36`处的重定位项是 `R_X86_64_PC32.rodata+0x10`❖ 链接器会将 `S + A - P`写入该字段。`S`Evet .`.rodata`Adresini,`A`Evet , evet .`0x10`- Evet .`P`Evet, bu da bir hikaye.`next_ip + disp = (P + 4) + S + A - P = S + A + 4`- Evet.

提升器, bağlantı cihazı olmadan aynı işlemleri uyguluyor.`0x10 + 4 = 0x14`✿IR 写为 ✿`rcx = &.rodata+0x14`Bu konumda beş tane var .`int` değeri `1, 2, 3, 4, 4`- Evet.

## 阶段 4:调用约定恢复参数

Sistem V AMD64 psABI Bölüm 3.2.3 节 条例,INTEGER 类参数依次通过 `%rdi`- Evet.`%rsi`- Evet.`%rdx`- Evet.`%rcx`- Evet.`%r8`- Evet.`%r9`传递──结果先通过 `%rax`, tekrar geçiyor .`%rdx`3.2.1 Bölüm Açıklama,`%rbp`- Evet.`%rbx`和 `%r12`- Ne ?`%r15`调用方, must retain; kalan寄存器lar 调用方, 保存しなければならない.

`collect_params()`应用一条规则: 函数内先读后写的参数寄存器就是形参──其中序号最高寄存器决定参数数数,因此只读`%rsi`、从不读 `%rdi`Bu fonksiyon hala iki parametre vardır.`percent_change`读取 `%edi`和 `%esi`Bu yüzden var .`param_1`和 `param_2`- Evet.`grade`Sadece okuyacağım.`%edi`- Evet.`total`- Ben de .`%rdi`作为 64 位基址读取,将 `%esi`32 sayı olarak okuyun.

Şimdi Ghidra'nın ne olduğunu anlatabilirim.`param_3`- Evet.`idivl`Yazışmak için .`%rdx`, ve PSABI  izin `%rax:%rdx`返回 128位 INTEGER── hedef dosyalarda, hangi dönüş değeri olduğunu bize söyleyecek bir yöntem yoktur.

Geri dönüş yolunda,`xorl %eax, %eax`Sadece yazın.`%eax` Ghidra 在该路上将 `%rdx`Bu giriş, bir işlevi olarak dönüştürülmüştür.`param_3`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                                                      

## 阶段 5:SSA,每个定义一个名字

提升后,`grade`写入 `rax`Dört kez, yazın.`rcx`Üç kez: Citron、Ferrante、Rosen、Wegman 和 Zadeck, 1991'de statistik tek değerlendirme biçimini tanımladı: Her değişiklik bir kez değerlendirilir, bir nokta için bir fi fonksiyonu seçilir.`insert_phis()`和 `rename()`Bu iki bölümün yöntemini izleyin.

`total`SSA listesi, yapısal sonuçları gösterdi:

```text
block 0x44 -> 0x50
  ecx_1 = esi_0
  edx_1 = 0
  eax_1 = 0
block 0x50 -> 0x50, 0x5b
  eax_2 = phi(0x44: eax_1, 0x50: eax_3)
  rdx_2 = phi(0x44: edx_1, 0x50: rdx_3)
  flags_2 = phi(0x44: flags_1, 0x50: flags_5)
  flags_3 = add(eax_2, load32(rdi_0 + rdx_2 * 4))
  eax_3 = eax_2 + load32(rdi_0 + rdx_2 * 4)
  flags_4 = inc(rdx_2, 1)
  rdx_3 = rdx_2 + 1
  flags_5 = cmp(zext64(ecx_1), rdx_3)
  if jne(flags_5) goto 0x50 else goto 0x5b
```

寄存器'ın versiyonu 0 = fonksiyon girişindeki değer.`esi_0`和 `rdi_0`Bu da bir değişim.`0x50`İki öncü vardır: başlangıç blok ve kendisi, böylece her döngü içinde tanımlanmış bir değişim burada bir fi olarak elde edilir.`flags_2`Bu bir fi oluşur, bu bir ölüme yol açar. En az SSA'nın onu bırakması, çünkü iki öncü tanımlanmıştır.`flags`6. aşama da kaldırırım çünkü onu okumak için hiçbir yer yok.

Yeniden isimlendirme adımları da genişliği değiştirir.`edx_1 = 0`32 位 定義,`rdx_3 = rdx_2 + 1`Evet, bu yüzden bu da çok önemli.`rdx_2` Büyük bir genişlik kullanmak`cmpq %rdx, %rcx`- Evet .`%rcx`Çıkış: 64 bit, tanımı:`ecx_1 = esi_0`32'de, bu yüzden 該使用变为`zext64(ecx_1)`                                                                                                                                                                                                                                                              

Bu durumda, SSA'dan çıkma şekli mevcut.`coalesce_webs()`Her fi'yi ve parametrelerini web olarak adlandırılan bir değişken olarak birleştirerek ve web'e bir isim vererek. Bu, bu fonksiyonları oluşturan yapı için bir yazıcıya uygundur. Ancak birleştirme işleminde, aynı birleştirme noktasının iki fi değişim değeri gibi, başarısız olabilir.

## 阶段 6:化简、替换与死代码消除

`optimize()`Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: re: re: re: re: re: re: re: re: re: re: re: re: re: re: re: re: re: re: re: re: re: re: re: re: re: re: re:

| 改写前 | 改写后 |
|---|---|
| `Cond(je, cmp(a, b))` | `a == b`，其余九种条件码同理 |
| `Cond(jle, test(a, a))` | `a <= 0` |
| `x + (-6)` | `x - 6` |
| `trunc32(zext64(x))`，其中 `x` 为 32 位 | `x` |
| 对 64 位操作数执行 `trunc32(a + b)` | `trunc32(a) + trunc32(b)` |
| `(signfill(x): x) / d` | 位宽为 32 的 `x / d` |
| `load32(base + idx * 4)` | `base[idx]` |
| `trunc32(p >>s 34) + trunc32(p >>u 63)`，其中 `p = sext64(x) * 0x66666667` | `x / 10` |

Ön yönde bir değişim, tek kullanım noktasına bir tanım taşır. Bu kural üç şartta bulunur: kullanım noktası aynı temel blokta yer alır; kullanım noktası bir ifade, phi değil; eğer tanım yükleme içerirse, tanım ve kullanım arasında bir depolama veya düzenleme olamaz.

Önemli olan her bir işlemin sırasıdır.`percent_change`中,余数 `edx_2 = dividend_1 % edi_0`Evet, ölen kod, bu yüzden önce silinmiş.`edx_1 = signfill(eax_1)`Sadece bir kullanım noktası kaldı, sonra değiştirilir.`dividend_1 = edx_1:eax_1`- Evet.

寄存器对规则随后将 `signfill(eax_1):eax_1`化简为`eax_1`,除法变成 `eax_1 / edi_0`Şimdi.`eax_1 = esi_1 * 100`Sadece bir kullanım noktası,`esi_1 = esi_0 - edi_0`Ayrıca sadece bir kullanım noktası vardır, ikisi de geri dönüştürülmüştür.`flags`Bu nedenle, bu ayetlerin bir satır olarak değiştirilmesi gerekmektedir.

```c
return (param_2 - param_1) * 100 / param_1;
```

### 0x66666667'den fazla

`grade`10'a ayırırız ama clang oluşmaz.`idiv`- Evet, evet.`imulq $0x66666667, %rax, %rax`, tekrar bir başkanlık yaptırmak için`sarq $0x22, %rcx`, sonra da gerçekleştirir `shrq $0x3f, %rax`,最后将两者相加──Granlund 和 Montgomery 的论文Kultiplikanı kullanarak Değişkin Birimlerle Bölüm(PLDI 1994) bu yöntemi tanımladı──编译器选择乘数 `m`和移位量 `s`Herkese göre.`x`Şehir tatmin eder`(x * m) >> s`Ben de öyleyim .`x / d`- Evet.

Burada .`m = 0x66666667 = 1717986919`- Evet .`s = 34`◊运算可以核对:`2^34 / 10 = 1717986918.4`Yukarı çıkıp dur.`1717986919`△ yanlış △`m * 10 - 2^34 = 6`                                                                                                                                                                                                                                                              `x`- Evet, yanlışlık.`2^31`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `2^34`İşte, bu yüzden hatalar 8¬6=8'den fazla değil, bu yüzden her bir negatif karşılığı`int`- Evet .`(x * m) >> 34`... ...böylece .`floor(x / 10)`- Evet.

负数 için`x`C'nin ayrımı ise tamamen sıfırdan uzaklaşır.`shrq $0x3f`提取乘积的符号位, ve恰好在 `x`Negatif zaman 1'e eşit.

`magic_divisor(m, s)`检验一对候选价值──它将 `d`计算为 `2^s`Üstelik`m`Bu yüzden de bunu yapmayı denedim.`d`和 `d + 1`Sadece şimdi.`m`Ben de öyleyim .`2^s / d`                                                                                                                                                                                                                                                              `d` Aynı sayı `s = 33`- Evet .`d = 5`Bu da doğru, çünkü.`0x66666667`Aynı şey.`2^33 / 5`                                                                                                                                                                                                                                                              `c_div(x, 10)`Buna göre,`int`範囲の2つの端点──

启用识别时,`grade`Göstermek için`ecx_1 = param_1 / 10 - 6;`关闭识别时,演示会打印原始形式:

```c
rax_1 = (long)param_1 * 0x66666667;
ecx_1 = (int)(rax_1 >> 34) + (int)((unsigned long)rax_1 >> 63) - 6;
```

两种形式都编译,也计算出相同的值――保留这个开关――; henüz araştırılmamış bir编译器 tarafından üretilen kodları okuduğunuzda, orijinal biçim sadece dürüst bir ifade olarak kullanılır.

## 阶段 7: Kullanım biçiminden tip

机器码只有位宽,没有类型──`infer_types()`C 类型 △ 32 ′ genişliğine sahip web △`int`,64 位 さんの web `long` Eğer bir web ise `base[idx]`Bu da bir şey.`int *`◊ işaret tipi                                                                                                                                                                                                                                                             `-O0`Aşağıda `local_8 = param_1`İkisini de yapalım.`int *`◊ Geri dönüş türü belirlenir `return`语句中值的位宽──

`total`Sonuç şu:`int total(int *param_1, int param_2)`Ghidra yazıyor`int total(long param_1,uint param_2)`                                                                                                                                                                                                                                                              `*(int *)(param_1 + uVar2 * 4)`                                                                                                                                                                                                                                                              `const`, de hepsi ayırt edilemez .`int *`和 `unsigned *`- Evet.

Lee、Avgerinos 和 Brumley(TIE,NDSS 2011) olarak sınıflandırılmış olarak yeniden ortaya çıkmıştır. Sonuç olarak, bir üst界 ve bir alt界, bir tek tahmin değil.`const`İpuç işaretlerinin geri dönüş oranı %98'e ulaştı. Bu ders, bu araştırma yolunun en düşük fiyatlı iki kuralını kullanıyor ve bunların hiçbir şey görmediğini belirtmektedir.

无符号运算保留在表式中,不体现在变量类型里──`cmpl $0x4, %ecx`Sonraki`ja`打印为`(unsigned int)ecx_1 > 4`- Evet .`shrq`打印为`(unsigned long)rax_1 >> 63` Değişiklikler hâlâ simge türü vardır, böylece okuyucu zaten kaydetme cihazının değerini görebilir, ayrıca talimatları hangi konumda simge değersiz olarak görebilir.

## 阶段 8: 图中恢复结构

Cifuentes(1994) Bölüm 6'da çizilen bölge ve yüksek dillerin yapı biçimleri uyumludur. İlk işleme döngüsü, iki yol koşullarını yeniden işleme, son işleme, çok yol koşullarını yeniden işleme, Yakdan, Eskweiler, Gerhards-Padilla ve Smith'in diğer yollarını değiştirdi.`goto`, ortalama 32 bir bir; ve onların yapılandırma yöntemleri 1.530 temel  işlevi içinde herhangi bir bu tür bir ifade üretmedi.

`structure()`İlk sınıf bir yöntemin küçük bir gerçekleşmesi.`Branch`Son blok, doğrudan kontrolden sonra yönlendirilmiş nokta, koşulların bir parçası olan bir birleşim noktasıdır. Geri kenar, bir kontrolden sonra yönlendirilmiş nokta, bir kaynak noktasının bir kenarına yönlendirilir. Doğal döngü, bir döngüden sonra geri dönüp geri dönüp gelen noktaların bir araya gelmesi gerekmez.

对于汇合点为 `j``Branch`- ...

- Eğer `j`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `if (!cond) { fallthrough region }`Sonra da ...`j`Devam et.
- Eğer `j`Bu da bir dizi oluşum.`if (cond) { target region }`Sonra da ...`j`Devam et.
- Eğer `j`Bu da bir işlevi çıkarmak, iki parça geri dönmek.`if (cond) {... }`, başka bir bölümü arkasına koy, kullanma `else`İşte bu.`percent_change`和 `total`Çıkışlar.
- 否则生成 `if (cond) { target } else { fallthrough }`Sonra da ...`j`Devam et.`-O0`Aşağıda `percent_change`İşte böyle bir durum: iki tane depolama.`local_4`, ve funkta尾声处汇合──

Çember için:

- Eğer bir döngü`Branch`Sonunda, bir sonraki dönüşün de oluştuğu bir döngüden dışarıda oluşuyor.`while (cond) { body }`- Evet.`-O0`Aşağıda `total`Bu şekil: döngü`local_14`和 `local_c`,并通过 `jge`Ayrılmak.
- Eğer döngü başı da bir kenarın bir parçası ise, ya da çıkış döngü kovanında ise,`do { body } while (cond);`- Evet.`-O1`Aşağıda `total`Bu şekil: blok`0x50`执行加法、递增、比较, sonra kendinize atlayın.

`IndirectJump`Bir parça bitireceğim ve bir şey olmayacak.`-O0`Aşağıda `grade`Gerçekten de kullanıyorum.`jmpq *%rax`- Evet .`.rodata+0x0`处的五个相对偏移量跳转,第 33 课会解析这些目标──本课提升器则打印一条说明──`0x76`- Evet.`0x7f`- Evet.`0x88`和 `0x91`Dört bölge sadece dolaylı olarak atlayarak ulaşılabilir, bu nedenle geliştirilmemiştir.`switch`- Evet.

### - O1 anahtar için ne yapıyorsunuz?

- Evet .`-O1`Aşağı, çırpın                                                  `grade`Kalkıp kalkacak.`score / 10 - 6`, sonucu 4 ile simgesiz sayı olarak görecek, sonra `.rodata+0x14`5 tane var .`int`Bir kez simgesiz bir karşılaştırma yapıldı.`score / 10 < 6`和 `score / 10 > 10`两种情况──负差值作为无符号数很大,因此同样无法通过检查──

Çekilme`1, 2, 3, 4, 4`,分分对应商 6〜10〜带五条 `return``switch`Bir tane oldu.`if`Ve bir kez bir dizi okuyun.`lookup_14`- Evet.

Çöneme kuralları belirlenmiştir.`table_values()`Çekilme noktasından okuyacağım.`.text`重定位项引用的下一个 `.rodata`偏移, veya bölüm sonuna kadar. Bu hedef dosyasında, sonraki alıntılanan 偏移`0x28`,即 `grade_label`Bu yüzden.`lookup_14`- Evet .`(0x28 - 0x14) / 4 = 5`项──与 4 的无符号比较也吻合──Ghidra 同样不知道表长──它写成 `*(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4)`, yani bir ayet adres ve çevriliş miktarı, ve okuyucuya bırakılan beş değerli iş bulmak.

## Ghidra'nın yanında

演示会打印每一对结果──Ghidra 文本来自 `code/fixtures/ghidra/*.json`2026-10-14'te kanıt kayıtları geri dönmek için emir verildi .`npx -y rea-agents@6.5.0 decompile ledger-x86_64-O1.o <function> --provider ghidra --format json`❖ Her kayıt var`confidence: observed`和 `authority: shipped-artifact` Yazılar gözlemlenmiş sonuçlardır, ama yazılar içindeki ifadeler, yönlendirilmiş sonuçlardır.

### %_değişim

```text
lifter                                         | ghidra
-----------------------------------------------+-----------------------------------------------
int percent_change(int param_1, int param_2)   | undefined1  [16] percent_change(int param_1,int param_2,ulong param_3)
{                                              | {
  if (param_1 == 0) {                          |   long lVar1;
    return 0;                                  |   undefined1 auVar2 [16];
  }                                            |   undefined1 auVar3 [16];
  return (param_2 - param_1) * 100 / param_1;  |   if (param_1 != 0) {
}                                              |     lVar1 = (long)((param_2 - param_1) * 100);
                                               |     auVar3._0_8_ = lVar1 / (long)param_1 & 0xffffffff;
                                               |     auVar3._8_8_ = lVar1 % (long)param_1 & 0xffffffff;
                                               |     return auVar3;
                                               |   }
                                               |   auVar2._8_8_ = 0;
                                               |   auVar2._0_8_ = param_3;
                                               |   return auVar2 << 0x40;
                                               | }
```

| 差异 | 指令或猜测 |
|---|---|
| 返回类型 `undefined1 [16]` 与 `int` | 猜测。`idivl` 写入 `%rax` 和 `%rdx`，且没有调用方确定返回位宽，因此两个寄存器都被保留。 |
| `param_3` | 由第一个猜测引出的猜测。返回零的路径上只有 `%eax` 被写入，所以 `%rdx` 被作为输入读取。 |
| `lVar1 / (long)param_1 & 0xffffffff` 与 `/ param_1` | 来自指令。`cltd` 加 `idivl` 对符号扩展后的 32 位值做 64 位除法，再截断到 32 位。两段文本都在描述这个过程。我们的版本用 `signfill` 规则化简了寄存器对。 |
| 保留 `lVar1 % (long)param_1` | 源于返回类型。在我们的分析中，`%rdx` 中的余数是死值；在 Ghidra 的分析中，它是活值。 |
| `if (param_1 != 0)`，后面才是零值情况 | 源于指令顺序。`je 0xd` 跳到返回零的位置。Ghidra 先放计算分支，我们先放较小分支。两者都正确。 |
| `return auVar2 << 0x40` | 猜测。反编译器用一个低半部装有 `param_3`、再移到高半部的 16 字节值，表达 `%rax = 0` 且 `%rdx` 未知的情况。 |

`code/fixtures/ghidra/ledger-x86_64-O1.ghidra-repaired.c`Orta düzeltme sürümü sadece bu işlevi değiştirir, test 81 giriş üzerinde kaynak kodu ile karşılaştırır.

### sınıfı

```text
lifter                                         | ghidra
-----------------------------------------------+-----------------------------------------------
static const int lookup_14[5] = {1, 2, 3, 4, 4}; | uint grade(int param_1)
int grade(int param_1)                         | {
{                                              |   uint uVar1;
  int eax_1;                                   |   uint uVar2;
  int ecx_1;                                   |   
                                               |   uVar2 = param_1 / 10 - 6;
  ecx_1 = param_1 / 10 - 6;                    |   uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);
  eax_1 = 0;                                   |   if (uVar2 < 5) {
  if ((unsigned int)ecx_1 <= 4) {              |     uVar1 = *(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4);
    eax_1 = lookup_14[(unsigned long)(unsigned int)ecx_1]; |   }
  }                                            |   return uVar1;
  return eax_1;                                | }
}                                              |
```

| 差异 | 指令或猜测 |
|---|---|
| 两者都有 `param_1 / 10 - 6` | 来自指令。两者都识别出了 `0x66666667` 惯用模式。 |
| `uVar1 = -(param_1 >> 0x1f) ^ (uint)(... >> 0x3f)` 与 `eax_1 = 0` | 来自 `grade+0x1a` 处的 `xorl %eax, %eax`。寄存器为零。Ghidra 将 `xor` 表达为 `param_1` 的符号与乘积符号位的异或，这是同一个位的两种写法，却没有将两者消去。对每个 `int`，值都为 0，测试在 141 个分数上验证了这一点。相信文本的读者会误以为默认值依赖分数。 |
| `uVar2 < 5` 与 `(unsigned int)ecx_1 <= 4` | 来自 `cmpl $0x4, %ecx`，随后是 `ja`。条件相同。Ghidra 将 `uVar2` 定为 `uint`，我们则在使用处转换。 |
| `*(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4)` 与 `lookup_14[...]` | 来自指令加重定位。Ghidra 加载目标文件时，将 `.rodata` 放在 `0x001000a0`，所以 `0x001000b4` 就是 `.rodata + 0x14`。它应用了重定位并保留字节地址。我们为表命名，并读取了其中五个值。 |
| `uint` 返回值与 `int` | 两边都是猜测。指令只说明是 32 位。 |

### toplam

```text
lifter                                         | ghidra
-----------------------------------------------+-----------------------------------------------
int total(int *param_1, int param_2)           | int total(long param_1,uint param_2)
{                                              | {
  int eax_1;                                   |   int iVar1;
  int ecx_1;                                   |   ulong uVar2;
  long rdx_1;                                  |   
                                               |   if (0 < (int)param_2) {
  if (param_2 <= 0) {                          |     uVar2 = 0;
    return 0;                                  |     iVar1 = 0;
  }                                            |     do {
  ecx_1 = param_2;                             |       iVar1 = iVar1 + *(int *)(param_1 + uVar2 * 4);
  rdx_1 = 0;                                   |       uVar2 = uVar2 + 1;
  eax_1 = 0;                                   |     } while (param_2 != uVar2);
  do {                                         |     return iVar1;
    eax_1 = eax_1 + param_1[rdx_1];            |   }
    rdx_1 = rdx_1 + 1;                         |   return 0;
  } while ((unsigned long)(unsigned int)ecx_1 != rdx_1); | }
  return eax_1;                                |
}                                              |
```

| 差异 | 指令或猜测 |
|---|---|
| `int *param_1` 与 `long param_1` | 我们根据 `addl (%rdi,%rdx,4), %eax` 作出的推断。Ghidra 保留了位宽。 |
| `uint param_2` 与 `(int)param_2`，对比 `int param_2` | Ghidra 选择无符号类型，因为 `cmpq %rdx, %rcx` 比较的是零扩展后的计数。我们保留 `int`，在比较处转换。 |
| 两者都有 `do { } while` | 来自块跳回自身的指令 `jne 0x50`。编译器旋转了循环。`-O0` 目标文件保留 `while`。 |
| 保留 `ecx_1 = param_2`，对比 `param_2 != uVar2` | 我们的替换规则仅限于同一基本块。复制 `movl %esi, %ecx` 位于初始化块，而比较位于循环内，所以变量保留。Ghidra 则传播了它。 |
| `(unsigned long)(unsigned int)ecx_1` | 来自指令。`movl %esi, %ecx` 执行零扩展，64 位比较读取整个寄存器。 |

行为测试会原样编译   davranış sınavı`grade`和 `total`Bu kitapta sadece iki satır eklenir.`typedef`, ve de `.rodata+0x14`处二十个字节                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `DAT_001000b4`定义──在输入网格上, iki işlevi de kaynak kodu ile uyumlu──

## Yalancı kod okuyucuyu araştırmak

LLM4Decompile(EMNLP 2024) tarafından test edilen, Ghidra'nın tek başına kullanılması HUMANEval-Decompile'de yeniden uygulanabilir oranı %20.12'dir.

Liu、Raff 和 Micinski(arXiv 2609.05370,2026 yıl 9 月) bu farkı açıkladı. Onlar 300 GitHub kutubu işlevi ve 287 CVE tabanlı işlevi kullanmışlardır. En güçlü modifikasyon modeli Ghidra'nın inşaat başarısı oranını %75'ten %90'a yükseltecek, ancak davranış uyum oranı %74'ten %62'ye düşecek. Seçim sonuçları tüm testleri geçse bile, gizlilik testi girişlerinde farklı sonuçlar olabilir.

Bu nedenle, bu tür bir metin oluşturmak için kullanılan bir fonksiyon ve koruma koşulları ile, anti-kompilatörlerin metinde bırakılan açıkça bilinmeyen konuları değiştirmek için çok basit bir neden oluşturdular.

Bu bir yükseltme makinesi baskı.`(unsigned long)(unsigned int)ecx_1`Daha güzel isimlerin nedeni değil.`switch`Bu yüzden kullanıyorum.`lookup_14`Bu, bir modelin yapabildiği etiket değil.`code/main.py`İçokullar: `undefined1 [16]`很难看,但诚实──修订模型生成的整洁签名 `int percent_change(int, int)`Doğru olsa da, nedenler doğru değil. Aynı model bir sonraki işlevi üzerinde tam ama yanlış imza oluşturabilir.

## 亲手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/34-lifting-to-pseudocode
python3 code/main.py
```

演示会解码 `-O1`目標 dosyasının tüm dört işlevi, her bir emir ile gönderilen `llvm-objdump`文本比较──对 `percent_change`- Evet.`grade`和 `total`SSA'nın öncesinde bulunan SSA listesi, ayrıca Ghidra'nın metin düzenindeki sahte kodları da basar.`grade`- Evet.`-O0`版本的 `percent_change`- Evet.`total`和 `grade_label`, ve汇总:

```json
{
  "functions": ["grade", "grade_label", "percent_change", "total"],
  "instructions": 56,
  "blocks": {"percent_change": 3, "grade": 3, "total": 5, "grade_label": 4},
  "phis": {"percent_change": 0, "grade": 1, "total": 2, "grade_label": 1},
  "objdumpDifferences": 0
}
```

按以下顺序阅读 `code/main.py`- ...

1. `read_object()`读取 ELF64 可重定位目标文件的节头、符号表和 `.rela`- Evet.
2. `decode_one()`和 `render_att()`解码一条命令,并按 `llvm-objdump`Nasıl basılırsa basılsın.
3. `build_blocks()`- Evet.`immediate_dominators()`和 `dominance_frontiers()`构建图的相关事实──
4. `lift_insn()`将一条命令转换为 IR 语句,并解析重定位──
5. `insert_phis()`和 `rename()`构建 SSA,并插入位宽转换──
6. `make_simplifier()`- Evet.`substitute_once()`和 `remove_dead_code()`- Evet .`optimize()`İçeride yürüyüş.
7. `collect_params()`- Evet.`coalesce_webs()`和 `infer_types()`"Name并推断类型:"
8. `structure()`配合 `post_dominators()`和 `natural_loops()`生成 C 函数体──
9. `lift_function()`串联各阶段,`lift_all()`则携带被调用函数签名,提升整个目标文件──

## 实际使用

Kendi hedef dosyalarınızdaki işlevi yükseltmek için kullanın.`clang -target x86_64-unknown-linux-gnu -c`Yapıp kullan.`lift_all(read_object(path))`❖ Çıkarıcı`DecodeError`时,消息中读取操作码字节, SDM 操作码映射表中查找它,再增加一项在文件顶部表中──提升器因某助记符抛错时,为`lift_insn()`增加一条规则── yapılandırıcı 生成`goto`时,使用 `IrPrinter`印图,判断缺少哪条形态规则──每次增加的内容都很小,现有测试会对照 `llvm-objdump`Ya da kontrol et.

Ghidra'yı yükledikten sonra, aynı işlevi çalıştırmak için, iki bölüm metni sıralayıp yerleştirir.

## 交互实验

### 实验 A: let a function pass through five stages

- Evet .`code`Şimdi Python'u aç:

```bash
cd phases/13-tools-and-protocols/34-lifting-to-pseudocode/code
python3 -q
```

运行:

```python
from main import *
obj = read_object(FIXTURES / "ledger-x86_64-O1.o")
lifted = lift_function(obj, "percent_change")
for insn in lifted.decoded: print(f"0x{insn.address:x}: {insn.raw.hex(' ')}  {insn.att()}")
print(lifted.ir_text)
print(lifted.ssa_text)
print(lifted.pseudocode)
```

- Evet .`%esi`Nasıl ?`subl %edi, %esi`变成 `esi_1 = esi_0 - edi_0`, yeniden dönüştürülür`(param_2 - param_1)`△ 字节 `fe`Evet .`subl`ModR/M'de`mod = 11`- Evet.`reg = edi`- Evet.`r/m = esi`- Evet.

### 实验 B:除法惯用模式

```python
print(lift_function(obj, "grade", recognize_division=False).pseudocode)
print(magic_divisor(0x66666667, 34), magic_divisor(0x66666667, 33), magic_divisor(0x66666667, 31))
```

İlk baskı ilk baskı ve hareket.`10 5 None`◊ Lütfen neden aynı çarpı sayıdaki hareket oranı azalırken bir kişi 5'e ayrılırken neden hareket oranı 31'ün hata sınırını karşılamıyorsa, neden önerin.

### 实验 C:新目标文件让解码器停下

E`-O2`构建测试样例并提升它:

```bash
clang -target x86_64-unknown-linux-gnu -O2 -fno-asynchronous-unwind-tables -c fixtures/ledger.c -o "$TMPDIR/ledger-O2.o"
python3 -c 'from main import *; from pathlib import Path; import os; lift_all(read_object(Path(os.environ["TMPDIR"]) / "ledger-O2.o"))'
```

Çözme makinesi`0x56`Durdur, rapor et.`opcode 81 is outside the fixture subset`❖ Operasyon kodu `81`32'den fazla birim sayıdaki 1. grup biçimi vardır.`andl $0x7ffffff8, %edx`, clang `total`Bu, bir devirde kullanılmış.`decode_one()``0x83`Bir sonraki işlemini kaydet, bir sonraki işlemini kaydet, bir sonraki işlemini kaydet.`llvm-objdump`Kontrol.

### 实验 D: Ghidra 在 级中 的默认值

```python
print(ghidra_pseudocode("grade"))
for score in (-25, 0, 59, 60, 100, 115):
    sign = -(score >> 31)
    product_sign = ((score * 0x66666667) & ((1 << 64) - 1)) >> 63
    print(score, sign ^ product_sign)
```

Her zamanki gibi.`uVar1`Doğru ifadeler okumak zor, ama emirler.`xorl %eax, %eax`İki metinle aynı şeyi ifade ediyoruz.

## 实践实验

Çı`-O0`Aşağıda `grade`添加 `switch`                                                                                                                                                                                                                                                              

要求:

- 读取 `ledger-x86_64-O0.o``.rela.rodata`İçinde beş tane yerleşim var.`R_X86_64_PC32.text+offset`,并根据 `.rodata+0x0`处的表计算五个案 目标──
- Çekilme`Switch`终结命令,包含索引表达式、目标列表,以及从表加载前的表达表达表达表达表达表达表达表达表达目标列表,以及表加载前的表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表达表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表`ja`- Evet. - Evet.
- Bu blokların her birinin bir sonraki hedefi ayarlanarak kontrol noktasını değiştirmek, kontrol noktasını ve kontrol noktasını değiştirmek ve SSA'yı normal çalışmaya devam etmesi için.
- Ürün`switch (local_10) { case 0:... }`, her hedef birine göre .`case`,并将共用函数尾声汇合点后的位置后的位置.
- ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒    ⇒ ⇒   ⇒   ⇒    ⇒     ⇒      ⇒           ⇒                                                                                                                                                                                                                                                               
- Clang 编译结果, test içindeki 分数网格上与源码比较──

Başarılılık standartları:`-O0`Aşağıda `grade`ile`-O1`Aşağıda `grade`Tüm ağda aynı çıkış ve kurtarma sonucu içerir.`switch`- Hayır .`goto`- Evet.

## 交付产物

本课产 出 `outputs/skill-lifting-to-pseudocode.md` Bir işlevi yükseltmek, her satır için bir yönlendirme sağlamak ve anti-kompilatör metninin fark çizelgesini doldurmak için kullanmak. Bu ürün referans karşılığı oluşturmak, yeniden konumlandırmak, düzenlemek, düzenleme kontrolü yapmak, davranış karşılaştırması yapmak ve her bir bölüm için farklı kodların yargılamasını sağlamak gerektirir.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/34-lifting-to-pseudocode
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

套件共有 25 个测试──验证证明:

- İki hedef dosyanın her emri, çözücü ile gönderilenleri de içerir.`llvm-objdump`文本一致;若安装了 `llvm-objdump`, aynı zamanda gerçek sahada yürütülen çalışma sonuçlarına da uymuştur
- REX,ModR/M,SIB ve`leaq (%rip), %rcx`Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Ç Ç Çeviri Çeviri Ç Ç Ç Ç Ç Ç Ç Çeviri Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç
- 遇到子集外的操作码时抛出 `DecodeError`Tahmin etmek yerine.
- ELF 读取器列出四函数和三 `.text`重定位项
- `total`Beş tane var.`0x44`支配 `0x50`- Evet .`0x50`Kendisi için döngü başı
- `%rdi`和 `%rsi`变为 `param_1`和 `param_2`, ve `total`Orta `param_1`Çı`int *`
- `test`和 `cmp`配合 `je`- Evet.`jle`- Evet.`ja`和 `jge`,变为 `==`- Evet.`<=`、 符号 `>`和 `<`
- SSA `total`循环头                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `percent_change`İçeri hiç bırakma
- `percent_change`- Evet.`grade`和 `total`Bu, bir önceki yazının aynı olduğu gibi.
- 启用识别时,`grade`显示 `param_1 / 10 - 6`;关闭识别时,显示原始乘法
- `0x66666667`配合移位量 34 gösterir 10 ayırır,配合移位量 33 gösterir 5 ayırır, ve bu ilişki giriş ağında kurulur
- `-O0`Aşağıdaki 槽位 dönüştü `local_4`- Evet.`local_8`- Evet.`local_c`, ve artık gösterge yok
- 通過重定位,在 `.rodata+0x14`处的表中读取到 `1, 2, 3, 4, 4`
- `-O0`Aşağı`grade`Bu arada 4 gelişmemiş blokla birlikte rapor edildi .
- Ghidra 测试样例包含 16 字节返回值、`param_3`、 、                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `xor`和 `long param_1`
- 6 adet bileşek kullanılabilir.`clang -std=c11 -Wall -Werror`Çı`x86_64-unknown-linux-gnu`编译
- 提升后函数、修复后 Ghidra 文本和源码,输入网格上印相同的232 行

## 生产环境中的失效模式

| 失效情况 | 浅层阅读的结论 | 推导过程必须展示的内容 |
|---|---|---|
| 反编译器扩大返回值位宽 | “返回 16 字节结构体” | `idivl` 写入 `%rdx`，且没有调用方确定其位宽 |
| 反编译器增加参数 | “接收三个参数” | 只是因为猜测了返回位宽，才在一条路径上读取该寄存器 |
| 未识别惯用模式 | “乘以魔数常量” | 乘数是 `2^s / d` 向上取整的结果，且满足误差界 |
| 识别了惯用模式，却丢失 `xor` | “默认值依赖输入” | `xorl %eax, %eax` 写入零，同一位的两种表达相互抵消 |
| 指针被定为整数类型 | “接收一个 long” | 从该寄存器进行带比例因子的 4 字节加载，是指针的证据 |
| 表长未知 | “读出了表的范围” | 下一个被引用的偏移或节末尾限定表边界，且范围检查与此吻合 |
| 误读循环结构 | “while 循环” | 循环头没有出口，闩锁块向后跳转，因此是 `do while` |
| 猜测间接跳转 | “有五个 case 的 switch” | 目标来自 `.rela.rodata`，否则应报告跳转未解析 |
| 跨存储进行替换 | “一个表达式” | 将已加载的值移过存储或调用，会改变含义 |
| 修订模型编辑文本 | “能够编译，看起来没错” | 构建成功率上升，行为匹配率下降，编造的保护条件替换了显式未知项 |
| 解码器猜测未知操作码 | “反汇编看起来没问题” | 抛出含地址与字节的 `DecodeError`，然后增加一个经 `llvm-objdump` 验证的表项 |

## 操作原理

Yalanlı kodları henüz görmediğiniz bir yönlendirme süreci olarak görüyoruz. Bu işlem, bir yönlendirme ile tekrar yapılır. İki bölümden bir metin düzenlenir. Her bir satırın arkasında bir yönlendirme ya da tahmin yazılır.

## 延伸阅读

- [Intel SDM Volume 2, chapter 2, Instruction Format](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [System V AMD64 psABI, section 3.2, Function Calling Sequence](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Cytron et al., Efficiently Computing Static Single Assignment Form and the Control Dependence Graph, TOPLAS 1991](https://doi.org/10.1145/115372.115320)
- [Cooper, Harvey, Kennedy, A Simple, Fast Dominance Algorithm, 2001](https://www.cs.tufts.edu/~nr/cs257/archive/keith-cooper/dom14.pdf)
- [Cifuentes, Reverse Compilation Techniques, PhD thesis, QUT 1994](https://eprints.qut.edu.au/36820/)
- [Yakdan et al., No More Gotos, NDSS 2015](https://www.ndss-symposium.org/ndss2015/ndss-2015-programme/no-more-gotos-decompilation-using-pattern-independent-control-flow-structuring-and-semantics/)
- [Granlund, Montgomery, Division by Invariant Integers using Multiplication, PLDI 1994](https://doi.org/10.1145/178243.178249)
- [Lee, Avgerinos, Brumley, TIE, NDSS 2011](https://www.ndss-symposium.org/ndss2011/tie-principled-reverse-engineering-of-types-in-binary-programs/)
- [Noonan, Loginov, Cok, Polymorphic Type Inference for Machine Code, PLDI 2016](https://arxiv.org/abs/1603.05495)
- [LLM4Decompile, EMNLP 2024](https://arxiv.org/abs/2403.05286)
- [DecompileBench, Findings of ACL 2025](https://aclanthology.org/2025.findings-acl.1194/)
- [Liu, Raff, Micinski, When LLM Decompilers Recompile More and Preserve Less, 2026](https://arxiv.org/abs/2609.05370)
- [rea 6.5.0 Ghidra provider notes](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/ghidra-provider.md)
- Bu ders tartıştı rea 6.5.0 源码位于标签 `3b79af2`- ...`src/domain/functionComparisonDimensions.ts`- Evet.`website/evidence/dx-ball-sound-pan.md`- Evet.
