# 调用约定与:Système V、Windows x64 和 AArch64

> Le référencement peut montrer quelles sont les archives que la fonction lit, mais seulement l'ABI explique le sens de ces archives, tandis que l'ABI est déterminé par le dossier cible.

**Type:** Build
**Languages:** Python, C, x86-64 and AArch64 assembly
**Prerequisites:** Phase 13 · 32（从零构建 ELF）、Phase 13 · 33（反汇编与控制流）
**Time:** ~140 分钟

## Objectif de l'apprentissage

- Selon le but du dossier, le choix de la version suivante est effectué: ELF x86-64 Utilise le système V psABI, COFF AMD64 Utilise Microsoft x64, ELF AArch64 Utilise AAPCS64, Mach-O arm64 Utilise Apple 变体。
- Pour chaque ABI 字节解码 de la première partie d'une fonction, chaque enregistrement de l'enregistrement 寄存器 返回地址 指针 positionné à l'entrée 指针 relative déviation 指针 
- De la fonction avant lecture après écriture du consigneur de consigneur de paramètres, de l'entrée  indice de charge supérieure de consigneur  tranche de paramètres
- 区分 System V's sequence de réservoirs indépendants, Microsoft x64's distribution de localisation, ainsi que les NGRN et NSRN du AAPCS64 计数器──
- Les conclusions et les signatures du code source, les règles et les règles de chaque compilateur sont`.pdata`- Je suis là.`.xdata`et `.eh_frame`Le nombre de données générées est de 0,6%.
- Comparer Ghidra、IDA、Binary Ninja、Radar2、Rizin 和 Angr 如何命名和恢复相同的事实,并记录输出与源码的差异──

##  problématique

Vous êtes`-O2`Pour Linux x86-64 编译 `convention.c`Puis interrogez le radar2.6.2.4.`eight_args`Il y a des paramètres.`rdi`- Je suis là.`rsi`- Je suis là.`rdx`- Je suis là.`r8`- Je suis là.`r9`- Je suis là.`rsp+0x8`- Je suis là.`rsp+0x10`Le code source est composé de 8 paramètres.`leaq (%rdx,%rcx), %rax` 中读取 `%rcx`Une fois, la récupération de la variable de l'outil a été perdue, le seul référentiel apparaissant dans l'adresse.

 Ensuite, vous ouvrez le même fichier dans rizin 0.9.1  Windows  Construction`amd64`Je l' ai trouvé .`r8`- Je suis là.`rcx`- Je suis là.`rdx`Et trois tranches. Le but du fichier est COFF, donc il est prévu que Microsoft x64 soit utilisé.`r9`, 槽 devrait avoir quatre. Deux outils ont perdu différents archivateurs dans le même code source.

列是指令序列,调用约定则是清单之外的契约: quels sont les référentiels qui doivent être conservés par le convocateur, quels doivent être conservés par le convocateur, quels doivent être conservés par le convocateur, quels doivent être conservés par le convocateur, quels sont les paramètres qui doivent être conservés par le convocateur, quels sont les paramètres qui doivent être conservés par le convocateur, quels sont les paramètres qui doivent être conservés par le convocateur, quels sont les paramètres qui doivent être conservés par le convocateur, quels sont les paramètres qui doivent être conservés par le convocateur, quels sont les paramètres qui doivent être conservés par le convocateur, quels sont les paramètres qui doivent être conservés par le convocateur, quels sont les paramètres qui doivent être conservés par le convocateur, quels sont les paramètres qui doivent être conservés par le convocateur, quels sont les paramètres qui doivent être conservés par le convocateur, quels sont les paramètres qui doivent être conservés par le convocateur, quels sont les paramètres qui doivent être conservés par le convocateurs, quels sont les paramètres qui doivent être conservés par le texte de la liste, quels sont les paramètres qui doivent être conservés par le texte, quels sont les paramètres qui doivent être conservés par le texte, quels sont les paramètres qui doivent être conservés par le texte de la liste. 列 sont les paramètres de la liste.

```figure
re-38-three-frames
```

## 文件头决定使用哪本规范

`convention.c`Il y a 12 fonctions:`leaf_add`- Je suis là.`eight_args`- Je suis là.`mixed`- Je suis là.`by_value`- Je suis là.`big_ret`- Je suis là.`sum_varargs`- Je suis là.`keeps`, ainsi que cinq réglages de même forme .`extern`函数的调用者──结构体使用 `long long`, parce que le MSVC  objectif `long`Pour 4 caractères, les autres objectifs sont 8 caractères, tandis que la structure du gros changement va changer de format.`-target x86_64-unknown-linux-gnu`- Je suis là.`x86_64-pc-windows-msvc`et `aarch64-unknown-linux-gnu`À chaque fois`-O0`- Je suis là.`-O2`, à nouveau .`arm64-apple-macos`编译 `-O2` Pas installé Linux ou Windows 头文件, donc le source code déclare lui-même le contenu nécessaire, ne contient que des clanges `stdarg.h`et `stddef.h`Il y a une autre.

`code/main.py`Le centre`describe_object()`读取四字节魔数和一个机器字段, afin de déterminer le contrat:

| 文件头 | 字段 | 值 | 规范 |
|---|---|---|---|
| `7f 45 4c 46` ELF | 偏移 0x12 的 `e_machine` | 62 | System V AMD64 psABI |
| `64 86` COFF | 偏移 0 的 `Machine` | 0x8664 | Microsoft x64 |
| `7f 45 4c 46` ELF | `e_machine` | 183 | AAPCS64 |
| `cf fa ed fe` Mach-O 64 | 偏移 4 的 `cputype` | 0x0100000c | 带 Apple 差异的 AAPCS64 |

Trois accords sont en bas de la liste.

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

## Système V: deux séries de postes indépendants avec la zone rouge

psABI 3.2.3 classifiera chaque paramètre de chaque 8 caractères en unité INTEGER, SSE ou MEMORY, puis distribuera le寄存器 de deux listes interdépendantes.`%xmm0`Pour`%xmm7`Si l'unité de 8 caractères de certains paramètres n'a pas de référentiel disponible, l'ensemble du paramètre passe par le référentiel, le paramètre de l'inventaire est inversé par le référentiel.

`eight_args(a, b, c, d, e, f, g, h)`Dans le`-O2`Je suis en train de faire une petite histoire.

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

Il y a six référents.`8(%rsp)`et `16(%rsp)`Je suis là.`%rbp`Pour le cadre, p.S.A.B.I. Figure 3.3`16(%rbp)`, qui équivaut à une entrée non pressée .`8(%rsp)`Il y a une autre.`g`位于 8,`h`Il est à 16...

`mixed(int i, double d, long long l, float f)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `%edi`et `%rsi`, qui est le premier, le second, le deuxième, le deuxième, le deuxième, le deuxième, le deuxième, le deuxième, le deuxième, le deuxième, le deuxième, le deuxième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième et le troisième, le troisième, le troisième, le troisième, le troisième, le troisième, le troisième et le troisième, le troisième, le troisième, le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus le plus possible.`%xmm0`- Je suis là.`%xmm1`, c'est-à-dire le premier, le second SSE 寄存器,`cvtsi2sd %edi, %xmm2`, parmi lesquels `%xmm2`Il est un référentiel de l'analyse.`cvtsi2sd`Le troisième élément de l'objectif est de lire, de faire une fiction.`mixed` rapport pour le lieu `xmm0`- Je suis là.`xmm1`- Je suis là.`xmm2``(double arg1, double arg2, double arg3)`Il y a une autre.

`by_value(struct pair p)`Le bâtiment est divisé en deux unités intégrées de 16 caractères.`%rdi`- Je suis là.`%rsi`传入, retour avec deux寄存器:`leaq 0x1(%rdi), %rax; leaq -0x1(%rsi), %rdx; retq`Il y a une autre.`big_ret(long long seed)`返回 32 字节, appartient à la catégorie MEMORY ⋅psABI 规定调用者提供返回值空间,并将该存储地址通过 %rdi 作为第一个参数传递──于是 ⋅`seed`- Je suis là .`%rsi`, fonction`movq %rdi, %rax`开始,因为返回时 %rax 应包含调用者通过 %rdi 传入的地址──

红区是系统 V的另一特征──psABI 3.2.2 规则:%rsp 所指位置以下的128 字节区域视为保留,信号或中断处理器不得改──在 `-O0`Je suis là.`eight_args`Précédent `pushq %rbp; movq %rsp, %rbp`, à nouveau`-0x8(%rbp)`Pour`-0x30(%rbp)`6 fois, pas de stockage`subq`                                                                                                                                                                                                                                                              `sum_varargs``-O2` Construction `subq $0x58, %rsp`Partagez 88 caractères, puis écrivez dans le bloc de sauvegarde.`-0x58(%rsp)`Pour`-0x80(%rsp)`: le plus profond jusqu'à l'index ci-dessous 128 字节, avec满红区──用 `-mno-red-zone`construire le même document,`leaf_add`增加 `pushq %rax`et `addq $0x8, %rsp`, va 8 字节 local variable mettre à  pointe sur le dessus.

可变参数调用额外使用一个寄存器──%al 作为隐藏参数,指定已使用的向量寄存器数,是0至8的上界──`call_varargs`Dans le`-O2`- Je veux le faire .`xorl %eax, %eax`- Je le mets en place.`-O0`- Je veux le faire .`movb $0x0, %al`- Je suis là.`sum_varargs`Tout d'abord, je vais le lire:`testb %al, %al; je`J'ai sauté 8 fois dans un référentiel inutilisé.`movaps %xmmN`La conservation.

## Microsoft x64: Distribution par position √ Zone de stockage d'ombre et zone sans rouge

Microsoft 规则按位置分配──整数参数通过RCX、RDX、R8、R9 传入;浮点参数通过XMM0L、XMM1L、XMM2L、XMM3L 传入──前四个参数中的浮点和双精度参数通过XMM0 - XMM3 传递──同一`mixed`Pour arriver`%ecx`- Je suis là.`%xmm1`- Je suis là.`%r8`- Je suis là.`%xmm3`:槽 0 est un nombre entier, donc utilisez `RCX`La tranche 1 est double, donc utilisez-la.`XMM1`La fosse 3 est flottante, donc utilisez-la.`XMM3`Il y a une autre.`XMM0`et `XMM2`Il y a des gens qui ont des problèmes.

调用者也必须预留空间. 调用者始终必须分配足够的空间以存储四寄存器参数的空间,即便调用者没有这么多参数. 文档称其为影子存储区或家地址,四槽实际归归调用函数所有──入口.`0(%rsp)`Pour retourner à l'adresse,`8(%rsp)`Pour`39(%rsp)`Pour quatre tranchées, la première est située.`40(%rsp)`Il y a une autre.`eight_args`Dans le`-O2`读取 `0x28(%rsp)`- Je suis là.`0x30(%rsp)`- Je suis là.`0x38(%rsp)`- Je suis là.`0x40(%rsp)`, c'est-à-dire 40 48 56 64

调用者一侧展示了计算──`-O2``call8`Précédent `subq $0x48, %rsp`, revoir 5 6, 7, 8  survivent `0x20(%rsp)`Pour`0x38(%rsp)`, puis exécuté `movl $1, %ecx`等──72 字节 sont composés de 32 字节影子区、32 字节的四个参数, ainsi que de faire revenir l'adresse située dans les 8 字节 de la frontière de 16 字节.`call_varargs` seulement paramètres de l'archivage, encore utilisés `subq $0x28, %rsp`32 épisodes plus 8 épisodes plus`keeps`压入三个非易失寄存器 (en anglais seulement),`subq $0x20, %rsp`Je vous en prie .`ext`获得返回地址下方的 32 字节影子区──

结构体 suivant ses propres règles.  tout ensemble n'entrant pas dans 8 字节, ou en gros n'étant pas 1、2、4、8 字节, tous doivent être soumis à la référence.`by_value`Dans le`%rcx`Après avoir été désigné,`%rdx`接收结构体副本指针:调用者必须为返值分配内存,将指针作为第一参数传入,其余参数向右移动一位──`call_pair`- Je veux le faire .`movaps`Dans le`0x20(%rsp)`构造副本, par le biais `leaq 0x20(%rsp), %rdx`- Je suis en train de passer.`leaq 0x38(%rsp), %rcx`传入结果缓冲区, encore une fois `0x40(%rsp)`读回 `.b`Il y a une autre.

Le système d'exploitation et de traitement de données est un système de gestion de données qui peut être utilisé dans le traitement de données.`-O0``leaf_add`需要 8 字节局部空间, par l'entrée `pushq %rax`et `retq`Il y a une autre`popq %rcx`获取,使用两条单字节指令代替 `subq`et `addq` usage page pour la fonction de la feuille de définition: 叶函数不需要函数表条目──它不能修改包括 RSP 在内的任何非易失寄存器──

Les paramètres variables sont répertoriés dans le réservoir. Pour les paramètres variables ou les fonctions sans prototype, la valeur du point de substitution doit être copiée simultanément dans le réservoir général de la résolution.`sum_varargs`Dans le`-O2`Précédent`pushq %rax`, revoir `%rdx`- Je suis là.`%r8`- Je suis là.`%r9`Je suis là .`0x18(%rsp)`- Je suis là.`0x20(%rsp)`- Je suis là.`0x28(%rsp)`, c'est-à-dire déviation d'entrée 16、24、32, séparément est la deuxième、 troisième、 quatrième tranche de logement des paramètres du référentiel.`va_list`Pour`leaq 0x18(%rsp), %rax`, qui est`%rdx`La première pièce à l'intérieur de la maison est également la première pièce à l'intérieur de la maison.

## AAPCS64, ainsi que les modifications apportées à Apple

AAPCS64 6.8.2 Utiliser deux compteurs par étape Règles d'application C.9                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      `8 - NGRN`个双字的复合类型复制到连续通用寄存器──C.13 规定参数 Une fois que 进入, NGRN 设为 8,之后不再回到通用寄存器──`eight_args`Utilisation `x0`Pour`x7`Je ne peux pas le toucher.`mixed`Pour`w0`- Je suis là.`d0`- Je suis là.`x1`- Je suis là.`s1`Il y a une autre.`by_value`Les importations et les exportations sont toutes`x0`- Je suis là.`x1`Il y a une autre.

6.9                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `big_ret`写入 `str x0, [x8]`- Je suis là.`stur q0, [x8, #0x8]`- Je suis là.`str x9, [x8, #0x18]`, de ne pas écrire`x0`Il y a une autre.`call_big` mise en place `mov x8, sp`, et `seed`Je suis resté là.`x0`, puisque 6.9 a également indiqué que l'utilisateur n'a pas à conserver la valeur x8 au milieu, et`x8`Non, pas un seul des paramètres de référencement.

6.1.1                                                                                                                                                                                                                                                              `-O0``leaf_add`Pour 8 字节                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `sub sp, sp, #0x10`, et le système V utilise ici la zone rouge.

6.4.6 定义记录:上由两个64位值构成的记录......低地址双字符应指向前一记录,高地址双字符应包含进入当前函数时传入 LR的值──未规定记录在中的位置──clang Dans ce fichier, il est montré deux types de positions──Linux`-O2``keeps`- Je veux le faire .`stp x29, x30, [sp, #-0x30]!; mov x29, sp`La même fonction est en .`-O0`- Je veux le faire .`sub sp, sp, #0x20; stp x29, x30, [sp, #0x10]; add x29, sp, #0x10`Je vais le mettre au sommet.

Apple arm64 explique conserver le registre et suivre les règles, modifier 、红区及可变参数调用── pointeur le registre x29  doit toujours se référer à la valid记录; certaines fonctions, par exemple la feuille ou le dernier numéro de code, peuvent ne pas figurer dans cette liste.`keeps`Précédent conservation `x22, x21, x20, x19`, le record sera mis en haut:`stp x29, x30, [sp, #0x20]; add x29, sp, #0x20` la plateforme conserve x18, ne l'utilise pas ARM64 红区由指针正下方的 128 字节组成, mais clang contre `-O0`叶函数 est encore généré `sub sp, sp, #0x10`, donc par défaut ne pas utiliser la zone rouge. Les paramètres variables sont répartis en 8 caractères appropriés.`call_varargs`Je vais mettre 10 20, 30`[sp]`- Je suis là.`[sp, #8]`- Je suis là.`[sp, #0x10]`, seulement传 `w0`;Linux 构建传 `w1`- Je suis là.`w2`- Je suis là.`w3`,并以`b extva`尾调用──Apple de la`sum_varargs`Il va`add x8, sp, #0x10`,即调用者指针, en tant que`va_list`Le système d'exploitation`sum_varargs`Il va`x1`Pour`x7`- Je suis là.`q0`Pour`q7`保存到 224 字节中,并通过 `mov x8, #-0x38; movk x8, #0xff80, lsl #32`À la structure`__gr_offs`Il est initié à -56`__vr_offs`Il est de -128

Les symboles sont différents.`_`Il est donc clair que je suis là.`_keeps`, la première fonction apparaît dans les étiquettes privées`ltmp0`Les résultats de l'analyse sont les suivants:

## 3 fois manuellement

`keeps(int n)`Dans le cycle de la rédaction`ext(i)`, nécessite une rétention de la réglementation`n`- Je suis là.`i`et `acc`Ainsi, chaque type de BBI doit être conservé par un référentiel.`-O2`构建的起始字节──

Système V,共 4 字节:

1. `55`Le numéro de l'archiviste est situé en bas de la page 3.`push r64`- Le numéro de la liste:`50 + 5`, qui est`%rbp`La profondeur est de 8,`%rbp`Il y a une pénétration de -8
2. `41 56`- Le numéro de la liste:`41`Il est réglé.`B`Le réx,`56`Oui `50 + 6` REX.B sera étendu à 14 heures:`pushq %r14`, position -16
3. `53`Oui `50 + 3`- Le numéro de la liste:`pushq %rbx`, position -24

3 fois pressé 共 24 字节, recommencer à retourner l'adresse  8 字节, 32 est le multiplicateur de 16, donc dans le cycle `callq ext` sans nécessité `subq`On peut se mettre à l'aise.`movq %rsp, %rbp`, donc il ne doit pas être construit avec une pointe.`%rbp`Avec le temps`acc`De la réception de l'appareil`xorl %ebp, %ebp`- Je suis là.`addl %eax, %ebp`)―尾声是镜像操作:`5b 41 5e 5d c3`Il y a une autre.

Microsoft x64,共 7 字节:

1. `56`est position -8 `pushq %rsi`- Je suis désolé .`57`est position -16 `pushq %rdi`- Je suis désolé .`53`-24 de la position`pushq %rbx` Les trois sont en moyenne des références non-éteintes, et`RDI`et `RSI`Dans le système V, il y a eu un référentiel de référentiel.
2. `48 83 ec 20`: REX.W、带 8 位立即数操作码 `83 /5`, ModRM `ec`Pour`11 101 100`, qui est`subq $0x20, %rsp`La profondeur est de 56°.

56 加返回地址 équivaut à 64,满足对齐──32 字节就是应提供给`ext`后接零个或多个 8 字节寄存器弹,再接回或 jmp;实际字节为 后接零个或多个 8 字节寄存器弹,再接回或 jmp;实际字节为 后接零个或多个 8 字节寄存器弹,再接回或 jmp;实际字节为 后接零个或多个 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后接 后 后接 后接 后 后接 后 后 后接 后 后 后接 后 后 后 后 后 后 后 后 后 后 后 后 后 接 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后 后`48 83 c4 20 5b 5f 5e c3`Il y a une autre.

AArch64, quatre caractères

1. `a9bd7bfd`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `stp`Il est 31h30.`10`选择 64 位寄存器,位 25:23 的 `011`选择预索引,位 22 为 0 表示储存──位 21:15 的 imm7 为 `1111010`, qui est -6, multiplié par 8 obtenez -48──位 14:10 de Rt2 = 30,位 9:5 de Rn = 31(`sp`),位 4:0 de Rt 为 29。`stp x29, x30, [sp, #-0x30]!`La moyenne est de 48`x29`Il y a 48 ans.`x30`Il y a jusqu'à -40
2. `f9000bf5`Il y a 12 points de décalage, 8 points de réduction.`str`Le nombre de personnes qui ont été tuées est de 21 à 10 ans.`sp`Je suis à 21 ans.`str x21, [sp, #0x10]`Pour les débits d'entrée -32
3. `910003fd`Il y a des nombres`add`:imm12 pour 0,Rn pour `sp`Je suis à 29 ans.`mov x29, sp`让指针指向 -48 处的记录──
4. `a9024ff4`Il y a des symboles de décalage.`stp`Pour les autres, il est nécessaire de prendre en compte les caractéristiques de la structure de l'appareil.`stp x20, x19, [sp, #0x20]`Il va`x20`- Je vais mettre -16,`x19`- Je vais mettre -8

共 48 字节:`x29` situé à 0,`x30`位于 8,`x21`Il y a 8 caractères à remplir,`x20` 32 ans`x19`位于 40。记录的低地址字指向前一记录,下一个字保存 LR, conforme à 6.4.6。`cmp w0, #0x1`Le premier et le second stockage sont les suivants: le régulateur les met en ordre; l'analyseur permet une comparaison ou une instruction mathématique entre les deux opérations.

## Le compteur a écrit deux fois la même chose.

Le premier est un processus de démarrage.

La deuxième expression de Windows est `.pdata`et `.xdata`Il n'y a pas de quoi.`-fno-asynchronous-unwind-tables` Construction `-O2`目标文件,`llvm-objdump -h`显示 `.xdata`Pour le code de la page,`.pdata`Pour 0x48 字节──0x48 即 72,对应六条 12 字节的`RUNTIME_FUNCTION`, chaque année`IMAGE_REL_AMD64_ADDR32NB`重定位──六个函数是 `sum_varargs`- Je suis là.`keeps`- Je suis là.`call8`- Je suis là.`call_varargs`- Je suis là.`call_pair`- Je suis là.`call_big`

`keeps``.xdata`字节为 `01 07 04 00 07 32 03 30 02 70 01 60`Il y a une autre.`UNWIND_INFO`开头的3位是版本,随后的5位是旗:版本为1,无标志;;SizeOfProlog为7,CountOfCodes为4,FrameRegister 和 FrameOffset 均为0──每条`UNWIND_CODE`包含 un préfixe intériorisé, ainsi qu'un caractère de code d'exploitation et de code d'information.`07 32`: dans le déplacement 7 处,操作码 2 `UWOP_ALLOC_SMALL`, informations valeur 3 `3 * 8 + 8 = 32`Je suis un homme.`03 30`: opérateur 0 est `UWOP_PUSH_NONVOL`,寄存器编号 3 是 `rbx`Il y a une autre.`02 70`- Le numéro de la liste:`rdi`Il y a une autre.`01 60`- Le numéro de la liste:`rsi` Ces codes sont enregistrés en ordre de réaction, décrivant les trois opérations de pression et la répartition des 32 caractères.`56 57 53 48 83 ec 20`字节完全一致。`sum_varargs`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `01 01 01 00 01 02 00 00`:1 字节序言, contenant un code, c'est-à-dire une distribution de 8 字节 `UWOP_ALLOC_SMALL`C'est dans les yeux de l'équipe.`pushq %rax`Une fois distribuée, parce que`%rax`Il n'y a pas de valeur de l'appareil.

Dans Linux, le deuxième chemin de développement est `.eh_frame`, il est défini par la PSABI 4.2.4 et est codé par le Règlement de la section 6.4 du Règlement de la DWARF 5.`llvm-dwarfdump --eh-frame`, imprimera un FDE pour chaque fonction,并解析 `R_X86_64_PC32`重定位, donc la portée d'adresse obtenue peut être utilisée directement.`keeps`- Le numéro de la liste:

```text
  DW_CFA_def_cfa_offset: +16
  DW_CFA_def_cfa_offset: +24
  DW_CFA_def_cfa_offset: +32
  DW_CFA_offset: RBX -32
  DW_CFA_offset: R14 -24
  DW_CFA_offset: RBP -16
```

CFA est habituel à l'entrée, donc il est supérieur à 8.`RBP -16`Pour les débits d'entrée -8,`R14 -24`Pour les 16`RBX -32`Pour les cfc les plus profonds, les cfc les plus profonds sont les cfc les plus profonds, les cfc les plus profonds, les cfc les plus profonds, les cfc les plus profonds, les cfc les plus profonds, les cfc les plus profonds, les cfc les plus profonds, les cfc les plus profonds, les cfc les plus profonds, les cfc les plus profonds, les cfc les plus profonds, les cfc les plus profonds, les cfc les plus profonds, les cfc les plus profonds, les cfc les plus profonds, les cfc les plus profonds, les cfc les plus profonds, les cfc les plus profonds, les cfc les plus profonds, les plus profonds, les plus importants, les plus importants, les plus importants, les plus importants, les plus importants, les plus importants, les plus importants, les plus importants, les plus importants, les plus importants, les plus importants, les plus importants, sont les plus importants.`keeps`De la FDE  écrit `DW_CFA_def_cfa: W29 +48`,并列出 `W29 -48`- Je suis là.`W30 -40`- Je suis là.`W21 -32`- Je suis là.`W20 -16`- Je suis là.`W19 -8` CFA ici est l'entrée  indice elle-même, donc ces déviations ne nécessitent pas de changement  déviation ;`x29`Pour la définition de base:`eh_frame_cross_check()`Il y a un article qui nécessite une attention particulière: Système V`call8`Dans le milieu du corps de la fonction, on met en place deux paramètres de transmission, de sorte que la plus profonde CFA déviation est de 32, tandis que le premier est de 8 en taille; la comparaison est faite lorsque le point de référence atteint la plus profonde profondeur de 24, puis 8 en plus.

## Comment les différents outils appellent ces concepts

Chaque outil de ce domaine a une structure de données définie, ainsi que des processus d'analyse définis pour la répartition des fonctions. Leur nom est différent, les défauts sont également différents.

**Ghidra 12.1.4（Apache-2.0）。**规则位于 SLEIGH 语言定义旁的编译器规格文件 `.cspec`Dans le centre.`x86-64-gcc.cspec`声明了名为 `__stdcall``<default_proto>`,注明源自 2016 年 4 月的 Système V Application Interface binaire AMD64 Architecture Processor Supplement──它使用 `<pentry>`列表指定 `XMM0_Qa`À la`XMM7_Qa`et `RDI, RSI, RDX, RCX, R8, R9`,条目从偏移 8 开始,为不超过16 字节的类型提供 `join_dual_class`规则,输出为 `XMM0_Qa, XMM1_Qa, RAX, RDX`, rest de situation utilisation `hidden_return`Il y a une autre.`x86-64-win.cspec` déclaration `__fastcall`Avec quatre .`<group>` 元素将 `XMM0_Qa`Avec `RCX`- Je suis là.`XMM1_Qa`Avec `RDX`Également, c'est la règle de la répartition par position; les articles commencent par le décalage 40 à l'utilisation de structures de 3 5, 6 ou 7 caractères.`convert_to_ptr`, note écrit que seuls les structures de taille 8 16 32 64 bits peuvent être installées dans le référentiel;`unaffected`- Je suis là .`RBX RBP RDI RSI RSP R12`À la`R15`et `XMM6`À la`XMM15`,  déviation de 8 à 39 `localrange`C'est le lieu de stockage.`AARCH64.cspec` déclaration `__cdecl`, le premier article est avec`storage="hiddenret"``x8`, puis c' est`q0`À la`q7`et `x0`À la`x7`; à 17 字节及以上的结构体使用 `convert_to_ptr`- Je suis désolé .`killedbycall`包含 `x8`, note écrit sur 间接结果位置寄存器,未体现在 pentry 列表中──反编译器的最后阶段名为Establish's Function's Prototype;分析器名为Call Convention ID和Decompiler Parameter ID;程序选项Prototype Evaluation选择默认模型──

**IDA Pro 和 IDA Free（Hex-Rays，商业软件；当前版本 9.4，构建号 9.4.260714）。**函数类型是通过 SetType 设置的C 声明,IDA 会使用类型信息,在反汇编中添加函数参数信息注释──标准约定无法表达位置使用 IDA 自己的约定书写:`int __usercall func@<ebx>(int x, int y@<esi>)`Les résultats seront inclus`EBX`,将 `y`- Je suis là .`ESI`Le dépôt de la commission`@<^12.4>`则通过偏移和大小指定位置──`__userpurge`La même page contient également des expressions de la collection de sauvegardes détruites.`__spoils`, ainsi que des paramètres de rétablissement de la formation.`__hidden`- Je suis là.`__return_ptr`et `__struct_ptr` Les commandes de compilation sont décompilées en tant qu'appel操作允许为单条指令指定 `__usercall`Il est gratuit 仅支持 x86 和 x86-64──

**Binary Ninja 6.0“Krypton”（Vector 35，商业软件；另有可反编译 x86、x86_64、ARMv7 和 AArch64 的 Free 版本）。** `Platform` contenant toutes les informations relatives à l'environnement de mise en œuvre secondaire, principalement celles utilisées pour la régulation, le système d'exploitation et l'architecture, la liste des plateformes comprend `linux-x86_64`- Je suis là.`windows-x86_64`- Je suis là.`linux-aarch64`et `mac-aarch64`, chaque plateforme a .`default_calling_convention`Il y a une autre.`CallingConvention`包含 `int_arg_regs`- Je suis là.`float_arg_regs`- Je suis là.`callee_saved_regs`- Je suis là.`caller_saved_regs`- Je suis là.`int_return_reg`- Je suis là.`high_int_return_reg`- Je suis là.`float_return_reg`, ainsi que deux signes de différence directe:`arg_regs_share_index`Indiquer que  pour True , quel que soit le type de paramètre, le n° N 个参数 occupera le n° N 槽 position dans la liste des nombres entiers et des points de référencement ;`stack_reserved_for_arg_regs`Indiquer que Windows x64 est utilisé pour la mise en place de l'application.`eligible_for_heuristics`- Je suis là.`required_arg_regs`et `required_clobbered_regs`驱动其启发式调用约定检测──平台类型是 `types/platform/`Les résultats de la recherche ont été obtenus en 1er janvier.

**radare2 6.2.4（LGPL-3.0，本课已实际运行）。** `afcl`列出架构插件已知的调用约定:x86-64 下为 `amd64 amd64syscall dlang golang golang_abi0 ms p9 reg swift`,Arch64`arm64 dlang golang p9 reg swift`Il y a une autre.`afc` rapport de la fonction actuelle de la modification de la convention,`afcr`打印从 `cc.amd64.arg0: rdi`À la`arg5: r9`et `ret0: rax`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `cc-ARCH-BITS.sdb`Le RADARE2 pour ELF 目标文件选择 `amd64`, pour COFF 目标文件选择 `ms`Cette distinction est vraie.`afv`列出 paramètres et variables,`afs`Pour Linux, il est possible de faire une copie de la liste des utilisateurs.`-O2`目标文件,`afv`Pour`eight_args`J'ai trouvé sept paramètres, je me suis évanoui.`rcx`Pour Windows 目标文件, il a trouvé `rcx, rdx, r8`Et quatre trous, ils sont perdus.`r9`Deux archives manquantes sont apparues.`lea`Pour l'intérieur`mixed`, il est dans Linux rapport .`double arg1 @ xmm0, arg2 @ xmm1, arg3 @ xmm2`Il n'y a pas de rapport de paramètres dans Windows. Pour AArch64, c'est pour ça.`eight_args`Je l' ai trouvé .`x0`À la`x7`; pour `big_ret`则列出 `x0`et `double arg2 @ d1`, tandis que la fonction est en fait`x8`, et va être chargé à une quantité constante`q1`Tout le monde.`afs`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `void`开头, parce que les outils ne sont pas déterminés`-O0`Tous les paramètres sont enregistrés.`afv`Parce que j' ai trouvé`eight_args`Il y a 8 paramètres, dont 2 sont situés dans le`rbp+0x10`et `rbp+0x18`Il y a une autre.

**rizin 0.9.1（LGPL-3.0，本课已实际运行）和 Cutter 2.5.0。** `afcl`- Je suis là .`amd64 amd64syscall ms reg swift`Il y a une autre.`afc`Retour à la COFF  objectifs `amd64`, explique Microsoft  config, bien qu'il existe, n'a pas été sélectionné selon le format de fichier.`afi`Pour Linux`eight_args`L'écriture de sept paramètres, également manqué`rcx`; pour Windows 则列出 `r8, rcx, rdx`Et trois autres, déjà épuisées.`r9`Je me suis aussi évanoui .`0x40`Il y a une place dans la fosse.`afv`Il n' y a pas d' ordre de variable`afvl`La coupe est le premier bout de rizin.

**angr 10.0.3（BSD-2，本课已实际运行）。**Précédent`CFGFast`, re运行 `CompleteCallingConventions(recover_variables=True)`, sera selon le format de la seconde`function.calling_convention`设为 `SimCCSystemVAMD64`- Je suis là.`SimCCMicrosoftAMD64`Ou `SimCCAArch64`,并将 `function.prototype`Il a été rétabli sur trois plateformes.`eight_args`Toutes les 8 paramètres sont x86-64`big_ret`Les indicateurs cachés sont récupérés`(BOT*, long long) -> BOT*`, pour les fenêtres`by_value`按引用传递的结构体恢复为 `(BOT*, BOT*) -> BOT*`, va fonctionner sous la forme de paramètres variables du système V `sum_varargs`恢复为 `(long long, ...)` Ses défauts et son radar2 `mixed`Toutes les villes ont été restaurées`(long long, long long, double, float)`, le référentiel est correct mais l'ordre est erroné, car la liste entière est imprimée avant la liste de flows;Aarch64 上的`big_ret` 被恢复为`(long long) -> double`Il a raté .`x8`约定,并将向量存储操作误读为结果;AArch64 上的 `sum_varargs`则被恢复为16参数,也就是整个寄存器保存区──

**其他工具。**Hopper 6.6.0 est un rédacteur et un rédacteur de données commerciaux de macOS et Linux; ce cours n'est pas en cours ou n'a pas enregistré son utilisation.`frame info`et `register read`显示实时, c'est la 42e classe de la méthode d'observation des mouvements du même groupe de déviations.

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

 Exploitation est un rapport JSON ⋅ pour chacun des sept fichiers cibles, il énumère le format, le type de machine et l'ABI; pour chacune des douze fonctions, il donne un prédéfini de caractères ⋅ enregistré et son déviation d'entrée ⋅ taille ⋅ pointe ⋅ référentiel ⋅ déviation de paramètres ⋅ déviation de paramètres ⋅ déversion de position de sauvegarde ⋅ retourner le référentiel ou le référentiel caché ⋅ profondeur de convocation, ainsi que les opérations de stockage utilisées par les convocateurs pour transmettre les paramètres ⋅ pour effectuer les opérations de convocation ⋅ pour chaque fonction, le rapport se termine par les résultats de l'examen: règles ⋅ les valeurs d'espérance obtenues par la signature ⋅ observées à partir de la section de caractères, ainsi que la cohérence des deux dernières ⋅ fonction de rapport est constituée de deux types d'outils de vérification et de sortie ⋅ 84 fois par analyse commune 489 ⋅ vérification, ⋅ 9 éléments ⋅ 488 ⋅ fonction complète ⋅

预期 structure:

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

按以下顺序阅读 `code/main.py`- Le numéro de la liste:

1. `describe_object()`读取 ELF、COFF ou Mach-O 头部及符号表, retourner à la liste des ABI 和函数列表──
2. `parse_listing()`Il va`llvm-objdump -d -r`文本分成函数,保留每调用和跳转的重定位目标,并按应语法标记删除注释:AT&T 使用 `#`,Arch64  utilisée`//`et `;`, parce que les autres `#`Pour introduire le nombre immédiat.
3. `effect_x86()`et `effect_arm()`Pour convertir une instruction en lecture, adresse, lecture, écriture, chargement, stockage et augmentation des pointers, le dernier opérateur d'AT&T est le numéro d'opération de but; le premier opérateur d'AArch64 est le numéro d'opération de but, de stockage, de comparaison et de division, à l'exception des instructions.`lea`Je ne peux pas t'envoyer d'autres.`mov`- Je suis là.`cvtsi2sd`- Je suis là.`setcc`Et le code de conduite`xor r, r`Le nombre d'opérations de l'indexation est écrit en ligne.`sp`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,
4. `analyze_function()`Pour les fonctions à travers une fois, jusqu'à rencontrer la première.`ret`Il suit la profondeur de la dérive de l'indice par rapport à la valeur d'entrée vers le bas, donc le nombre d'opérations de mémoire`disp(%rsp)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `disp - depth`, et `disp(%rbp)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `frame_pointer + disp`Il enregistre les paramètres enregistrés précédemment ou après avoir été écrits, situés à la première étape de l'ABI, où les paramètres sont déplacés ou chargés au-dessus de lui, les opérations de l'enregistrement des paramètres enregistrés, les accès aux indices actuels et la profondeur de chaque appel.
5. `_return_registers()`L'opération de lecture de données est une opération de lecture de données.`big_ret`Dans le milieu,`movq %rcx, %rax`后通过 `(%rax)` effectuer un stockage,`rax`仍被保留为候选结果寄存器──
6. `expected_locations()`Les trois réglementations sont appliquées à la C: les deux listes du système V avec les 8 caractères de la catégorie, les localisations de Microsoft avec les structures de transmission par référence, ainsi que les compteurs AAPCS64 et les résultats de plus de 16 caractères.`x8`Il y a une autre.
7. `run_checks()`Par exemple, il y a deux règles: le réservoir doit être conservé par l'utilisateur qui a été écrit; chaque réservation doit être satisfaite.`(rsp + 8) % 16 == 0`Ou `sp % 16 == 0`; chaque fois que Microsoft 调用都必须有32 字节影子空间;Microsoft 和 AAPCS64 下不得访问指针下方,System V 下最访问其下方 128 字节;尾声必须与序言对应,并将指针恢复到输入值──
8. `seh_cross_check()`et `eh_frame_cross_check()`读取未使用 `-fno-asynchronous-unwind-tables`Les données de déploiement des documents objectifs de construction sont comparées aux résultats de l'analyse des prédictions.

Il y a trois autres ordres.`python3 code/main.py analyze convention-x86_64-windows-O2 keeps`打印单个函数──`python3 code/main.py object FILE`打印 Selon le jugement du chef`python3 code/main.py seh`打印每个具有 `UNWIND_INFO`Les résultats de la fonction

##  réel usage

Pour les nouveaux fichiers objectifs que vous construisez, utilisez l'analyseur en suivant l'ordre suivant:

1. 运行  référencement`python3 code/main.py object FILE.o`Si le chef ne correspond pas à l'ordre de construction, il faut qu'il y ait un désaccord entre les deux.
2. Dans le but de sauvegarder`llvm-objdump -d -r FILE.o`Les données sont à l'origine de la production et de l'analyse.`sub`Pour le contrôle.
3. Selon le code source, le registre de la signature est vérifié par le registre des paramètres et le déviation. Le registre de la signature est inexplicable, il peut s'agir d'un indicateur caché, d'un marqueur de paramètres variables ou d'un registre temporaire de paramètres jugé par l'analyseur à tort.
4. Si les résultats des examens ne sont pas conformes, lis-les un par un. Chaque examen est déterminé par les règles de base, donc les règles de contrôle sont d'abord établies, les caractères de contrôle sont révisés, les critères d'analyse sont définis.
5. Si les documents objectifs ont des données ouvertes, des contrôles de circulation et des contrôles de circulation, les deux voies de communication qui correspondent entre elles sont les preuves les plus puissantes que ce cours peut fournir.
6. Si d'autres outils sont installés, enregistrer les instructions précises et les sorties et les comparer.

## 交互实验

### 实验 A:一条指令,三种效果

Dans le`code`Pour le démarrage de Python:

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

Chaque fois que vous utilisez, écrivez d'abord votre prévision de lecture, adresse de lecture, écriture et augmentation.`ldp`,将 `[sp, #-0x30]!`改为 `[sp], #0x30`, observer comment augmenter de`sp_delta`- Je suis là .`post_sp_delta`Il y a une autre.

### 实验 B: garde de 

```python
info, listing = load_fixture("convention-aarch64-linux-O2")
keeps = analyze_function("keeps", listing["keeps"], info.abi)
keeps.saved
keeps.frame_pointer
[c.to_dict() for c in frame_cells(keeps)]
```

Comparer les résultats de défilement avec ceux ci-dessus.`convention-arm64-macos-O2`Il n'existe pas de code de trois lignes; les enregistrements se déplacent jusqu'à -16, les quatre référentiels se trouvent en dessous de celui-ci.`convention-x86_64-linux-O2-fp`Je suis là .`keeps``saved`Une pointe est revenue, et une autre est apparue.`pushq %rax`Son seul rôle est de faire régler le temps.`(rsp + 8)`成为 16 的倍数──

### 实验 C:mixte 的先读后写分析

```python
info, listing = load_fixture("convention-x86_64-linux-O2")
mixed = analyze_function("mixed", listing["mixed"], info.abi)
mixed.param_registers
mixed.return_registers
expected_locations(SYSV, "mixed")["parameters"]
expected_locations(WIN64, "mixed")["parameters"]
```

Liste du système V`rdi, xmm0, rsi, xmm1`, Microsoft's liste pour`rcx, xmm1, r8, xmm3`△ maintenant télécharger Windows 目标文件, encore une fois fonctionner 前三行── puis ouvrir Linux 目标文件的radar2 输出记录,找到 `[afv mixed]`Il y a trois doubles.

### 实验 D: deuxième jugement de l'équipe

```python
for row in seh_cross_check():
    print(row["function"], row["sizeOfProlog"], row["unwindPushes"], row["unwindAllocBytes"], row["agree"])
for row in eh_frame_cross_check("convention-x86_64-linux-O2-eh"):
    print(row["function"], row["cfiSaved"], row["cfiMaxOffset"], row["deepestStack"], row["agree"])
```

Dans le SEH 表中找到 `sum_varargs``pushq %rax`Expliquez pourquoi le code est mis en place pour le distribuer.`.eh_frame` 表中找到 `call8`, expliquer de ces 32

## 实践实验

添加第四目标平台和第四套规范──

要求:

- Utilisation `-target x86_64-apple-macos -O2`编译 `convention.c`,并记录汇编清单──扩展 `describe_object()`, faire en sorte que vous puissiez lire Mach-O `cputype`0x01000007, et est projeté vers Apple dans x86-64 Suivant le système V psABI, en même temps de traitement `_`Je suis un homme.
- Check si chaque fonction passe par le système V Check。 record  unique différence que vous trouverez dans les premières phrases: Darwin conserve  points dans tous les niveaux d'optimisation 
- 添加使用 `-fstack-protector-strong`构建的Linux x86-64 目标文件──扩展序言扫描,将从 `%fs:0x28`L'enregistrement des opérations de la mise en œuvre de la loi et de la mise en œuvre de la loi sur les changements locaux`canary`单元,并将 `ret`Précédent Comparison des enregistrements pour la protection des dernières vérifications
- Ajouter un test, assurez-vous que lorsque le stockage de l'or de l'oiseau est prévu pour décharger les paramètres de conservation, le test échouera.
- Dans le cadre de l'analyse, les travaux sont réalisés.`with_canary`Le tableau et les tests seront mis ensemble.

Le succès est:`python3 code/main.py` Rapport tous les examens des nouveaux documents objectifs sont cohérents, et les unités de la fonction protégée montrent que le fil de métal se trouve entre les variables locales et les archives conservées 

## Le produit

本课提供 `outputs/skill-calling-conventions-and-stack-frames.md` utiliser, transformer les documents cibles que vous construisez, en fichier de rédaction et en C, en position paramétrique, en cadre, en référentiel, et vérifier individuellement si le projet est conforme aux règles et aux données de déploiement générées par l'éditeur.`cvtsi2sd`Ou `xor r, r`Le nombre d'opérations visées est lu et s'arrête lorsqu'on découvre des désaccords pour la première fois.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/38-calling-conventions-and-stack-frames
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明:

- 七个目标文件的ELF、COFF 和 Mach-O 头部对应 系统 V、Microsoft x64、AAPCS64 和 Apple arm64
- Chaque code du fichier cible contient les mêmes 12 fonctions et traite correctement Mach-O.`_`Il y a deux`ltmp0`标签:
- 汇编清单解析器保留 `ext`作为调用目标,并完整保留 `#-0x30`À l'heure actuelle, le nombre de
- `leaq (%rdx,%rcx), %rax`读取两个地址寄存器而不加载数据;`xorl %eax, %eax`et `cvtsi2sd`Le nombre d'opérations de l'objectif est seulement écrit.`stp`Dans le stockage`sp`, 后索引 `ldp`则在加载后移动它
- `-O2`Je suis là .`keeps`Dans le système V`55 41 56 53`开头,为 24 字节且没有指针; dans Microsoft x64 上以 `56 57 53 48 83 ec 20`开头, 为 56 字节; 在 AArch64 上首先出现 `a9bd7bfd`, enregistrement se trouve à -48
- Apple construit un enregistrement de -16, situé sur quatre enregistrements de l'appareil.
- Chaque fonction de Linux est en `-O0`Il y a des pointers.`-O2`Il n'y a pas de`-fno-omit-frame-pointer`Réserver les poignées et les amener à l'opération de pression.
- `-O0`叶函数 dans le système V 下使用 8 字节红区, dans Microsoft x64 下使用 `pushq %rax`, en utilisant l' AAPCS64`sub sp, sp, #0x10`Le dépôt de la commission`-mno-red-zone`会消除红区使用
- Chaque finale est accompagnée de son ordre, la pointe est ramenée à la valeur d'entrée.
- Dans deux niveaux d'optimisation,`eight_args`Les deux parties ont été classées en quatre groupes: 6 postes de référencement et 8 postes de délocalisation, 4 postes de référencement et 40 postes de délocalisation à 64 postes de délocalisation, ou`x0`À la`x7`
- `mixed`Dans le système V 下使用 `rdi, xmm0, rsi, xmm1`, dans Microsoft x64 下使用 `rcx, xmm1, r8, xmm3`, tous les deux utilisés .`xmm0`返回结果
- 16 字节 Structure体 dans le système V et AAPCS64 下 via deux référents, dans Microsoft x64 下则在隐藏指针后按引用传递
- 32 字节 Structure体 par le biais de `rdi`- Je suis là.`rcx`Ou `x8` retour
- 可变参数被调用者会读取 `%al`,将 `rdx, r8, r9`Retour à 16 24 32 conservation`x1`À la`x7`et `q0`À la`q7`, ou dans Apple en haut de la lecture de l'indicateur de l'utilisateur
- 调用器设置预期寄存器,将7和8 存到偏移 0和8,或将5到8 存到偏移 32到56;调用在可变参数前清零 `%al`, et le fait de passer`rdi`- Je suis là.`rcx`Ou `x8`传递结果缓冲区地址
- Tous les 489 examens sont conformes à leurs propres règles.
- - Je suis là .`UNWIND_INFO`条目与序言解析结果相合,叶函数则没有这些条目
- 24 FDE correspondent à la position des déviations et des points les plus profonds du référentiel de conservation
- 工具输出记录包含雷达2 的 `amd64`et `ms`、Rizin pour les objectifs du COFF`amd64`Il a été abandonné.`rcx`、三个 double, ainsi que le type d'angr
- Image des données du module de station de mise en place et de l'analyseur de sortie etc.

## Mode de défaillance dans l'environnement de production

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

## 操作准则

En lisant la première directive, il est clair que les règles utilisées sont utilisées pour déterminer chaque enregistrement et chaque paramètre enregistrés par rapport à l'entrée. Il est nécessaire de vérifier les données ouvertes écrites par l'éditeur et de les placer à cet endroit.

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
