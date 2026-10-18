# 提升为伪代码: de zéro à bâtir IR、SSA et structuration

> Les sorties de l'antitranscripteur sont un ensemble de déclarations cachées dans le processus de production. Après le processus de production, chaque ligne de production devient un objet à vérifier.

**Type:** Build
**Languages:** Python, C
**Prerequisites:** Phase 13 · 32（从零理解 ELF）、Phase 13 · 33（反汇编与控制流）
**Time:** ~150 分钟

## Objectif de l'apprentissage

- Le code x86-64 est modifié pour une petite IR (intermédiaire de la représentation), une expression expresse de la marque, le chargement, le stockage, la distribution, la mise en service et le retour.
- Pour le système V, le paramètre de référencement est transformé en paramètre de structure.
- Dans le cadre de la mise en place de la fonction phi, construire le plus petit SSA, puis effectuer un remplacement, simplification et élimination du code mort.
- Utilisation des points de contrôle et de la reprise, de la récupération du flux de contrôle`if`- Je suis là.`else``if`- Je suis là.`while`et `do while`Il y a une autre.
- Il va être multiplié .`0x66666667`Expliquer pour déduire à 10, et prouver cette relation égale.
- 逐行阅读Ghidra 伪代码 of the same group of functions, pointant à chaque différence derrière les instructions ou les suppositions.

## 问题所在

Vous allez réellement vous en prier`ledger-x86_64-O1.o`- Je suis là .`percent_change`La réponse de Ghidra 12.1.4 est:

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

Il n'y a que quatre lignes, deux lignes.`int`值并返回一个 `int`Ghidra a rapporté une valeur de retour de 16 caractères, ainsi que le troisième paramètre qui n'existe pas dans le code source.

Réaliser ce texte en tant que`procedure_pseudo_code`Le résultat est de retourner, et de donner un enregistrement avec une restriction explication:  faux code est la sortie de Ghidra contre le compilateur, pas le source source original, ni avec Hopper 输出文本等价──`compare_functions`工具按文本行对伪代码做差异比较──它自己的维度记录写着汇编是不透明的提供方文,并说明无法重定位归化──area 无法透视这些文本,只读取文本的代理也一样──

Le prix de la réa a été démontré par le DX-Ball.`FUN_00406400(void)`调用 `__ftol()`◊ l'instruction visuelle montre une  entrée et une expression x87 ⋅ agent ⋅ c'est pourquoi continuer à enquêter, simplement parce que les deux visuels sont contradictoires ⋅

Le cours de formation de l'antitranscripteur est un processus de formation qui a été créé.`percent_change`- Je suis là.`grade`et `total`伪代码与Ghidra的输出并排对照,解释每处差异──测试会使用 clang 编译你的输出,并输入网格上运行它,进行对比与源码──

```figure
lifting-stages-percent-change
```

## 测试样例与参考判断据

`code/fixtures/ledger.c`Exemple de test commun à cette partie du cours:

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

文件和目标文件中还包含 `grade_label`Le test de cette classe est les trois fonctions ci-dessus.

目标文件使用 `clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c ledger.c`构建──旁边还存放用于槽位章节的 `-O0`Le projet de loi`code/fixtures/README.md`列出了两条构建命令, SHA-256 de chaque doc, ainsi que réel 命令生成 Ghidra 测试样例.

Le codeur de référence est`llvm-objdump -d -r`◊ Il a été soumis à deux documents objectifs.`ledger-x86_64-O1.objdump.txt`et `ledger-x86_64-O0.objdump.txt` Un test analysera ces fichiers, et comparera l'adresse de l'ordre ∞ et le texte AT&T ∞.`-O1`Les 56 articles de l'ordonnance, ainsi que`-O0`Chaque instruction est installée sur un chemin fixe.`llvm-objdump`, un deuxième test se fera à nouveau en cours de fonctionnement, faire une autre comparaison.

参考工具打印的 `percent_change`Les suivants:

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

## 阶段 1: de la section à l'ordre

Le code est un code qui peut fonctionner indépendamment.`ledger.c`Dans le`-O0`et `-O1`Quand il rencontre d'autres codes d'exploitation, il se jette.`DecodeError`,附带地址和操作码字节──

Le décodeur suit le rythme de la mise en page de l'Intel SDM, le deuxième tome, le deuxième et deuxième sections:`0x40`À la`0x4F`之间一个字节, must紧邻操作码之前──REX.W 选择 64 位操作数,REX.R 扩展 `reg`字段,REX.X 扩展 SIB 索引,REX.B 扩展 `r/m`Ou SIB 基址──第 2.1.3 节 définit les trois phases de la ModR/M `mod`- Je suis là.`reg`- Je suis là.`r/m`, ainsi que les trois sections de la SIB`scale`- Je suis là.`index`- Je suis là.`base`Dans le cadre de 64 positions,`mod = 00`Avec `r/m = 101`La composition des données est indiquée par rapport à la section 32 de la directive.

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

`grade+0x23`- Je suis là.`leaq (%rip), %rcx`长七字节,位移量为零──目标文件在位移字段的偏移 `0x36`处携带一个重定位项 `R_X86_64_PC32.rodata+0x10`❖ L'équipe de réflexion se tient à la phase 3

## 阶段 2: élément de base et élément de contrôle

Le bas bloc est une séquence de phrases, le haut n'a qu'une entrée, le bas n'a qu'une sortie.`build_blocks()`收集块首地址: entrée de la fonction、 chaque saut dans la fonction, ainsi que l'adresse de chaque saut ou retour après l'ordre.`jmp`Il y en a un.`ret`没有后继,以普通命令结尾的块则顺序落入下一个块首地址──

`-O1`Je suis là .`total`Il y a cinq éléments de base:

| 基本块 | 指令 | 后继 |
|---|---|---|
| `0x40` | `testl %esi, %esi`，然后是 `jle 0x5c` | `0x5c`、`0x44` |
| `0x44` | `movl %esi, %ecx`, `xorl %edx, %edx`, `xorl %eax, %eax`, `nopw` | `0x50` |
| `0x50` | `addl (%rdi,%rdx,4), %eax`, `incq %rdx`, `cmpq %rdx, %rcx`, `jne 0x50` | `0x50`, `0x5b` |
| `0x5b` | `retq` | 出口 |
| `0x5c` | `xorl %eax, %eax`，然后是 `retq` | 出口 |

`immediate_dominators()`Il a réalisé l'algorithme de Cooper, Harvey et Kennedy en 2001: il a parcouru le bloc de base, en fonction de l'ordre inverse, jusqu'à ce que les nœuds de contrôle de l'avance déjà traitées ne changent plus.`total`Je l'ai trouvé.`0x44`- Je veux dire .`0x50`Je l' ai aussi.`0x50`通过回边控制自己,阶段 8 est en train de trouver un cycle.

La même fonction sera réutilisée à deux reprises.`dominance_frontiers()`Utilisez-le pour construire le SSA.`post_dominators()`则在添加虚拟出口节点的反向图上运行它,寻找汇合点──

## 阶段 3: L'amélioration en IR

Il y a 6 mots:`Assign`- Je suis là.`Store`- Je suis là.`Branch`- Je suis là.`Jump`- Je suis là.`IndirectJump`et `Return`◊ Expression comprenant la quantité constante, la quantité variable, le volume de charge, le volume de charge, le volume de charge, le volume de charge, le volume de charge, le volume de charge, le volume de charge, le volume de charge, le volume de charge, le volume de charge, le volume de charge, le volume de charge, le volume de charge, le volume de charge, le volume de charge, le volume de charge, le volume de charge, le volume de charge, le volume de charge, le volume de charge, le volume de charge, le volume de charge, le volume de charge, le volume de charge, le volume de charge, le volume de charge, le volume de charge, le volume de charge, le volume de charge, le volume de charge, etc.`sext`- Je suis là.`zext`- Je suis là.`trunc`Il existe cinq autres formes qui ne sont plus encore éliminées:`Flags`- Je suis là.`Cond`- Je suis là.`Concat`- Je suis là.`SignFill`et `Symbolic`Il y a une autre.

寄存器被表示为其64位寄存器族命名的变量──写入`%eax`Oui, c'est vrai.`rax`Une fois, une place large de 32 `Assign`, 读取`%eax`则是以 32 位宽读取 `rax` Dans le mode 64 bits, 32 bits se sont étendus à l'ensemble du référentiel, de sorte que 64 bits sont ensuite lus pour la même valeur une seule fois `zext` L'élévateur ne sait pas quel est le sens de la position de lecture, alors commencez par enregistrer la largeur de lecture, laissez SSA en phase 5

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

### 将标志表示为变量

Chaque article de la directive est inscrit en nom.`flags`Les conditions changent, les conditions changent, les conditions changent.`cmp a, b`写入 `cmp(a, b)`- Je suis désolé .`test a, b`写入 `test(a, b)`- Je suis désolé .`sub`则作为副作用写入 同样 `cmp`形态:`jcc`变为 `Branch(Cond(cc, flags), target, fallthrough)`◊ Lorsque les conditions sont en phase 6 avec les marqueurs, les conditions décident de comparer les calculs:

| 条件码 | 在 `cmp(a, b)` 之后 | 在 `test(a, a)` 之后 |
|---|---|---|
| `je` | `a == b` | `a == 0` |
| `jne` | `a != b` | `a != 0` |
| `jl`、`jge`、`jle`、`jg` | 有符号 `<`、`>=`、`<=`、`>` | 与 0 进行有符号比较 |
| `jb`、`jae`、`jbe`、`ja` | 无符号 `<`、`>=`、`<=`、`>` | 与 0 进行无符号比较 |

`xorl %eax, %eax`直接提升为 `eax = 0`◊ Il est configuré en marque`add`风格的标志,测试样例中没有跳转读取这些标志──`xor`C'est un modèle habituel.`grade`Le centre est important, mais Ghidra ne le garde pas.

### L'équipe de l'équipe

`cltd`- Je veux le faire .`%eax`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `%edx`Il y a une autre.`idivl %edi`64 places de réservoir pour`%edx:%eax`À l' exception de`%edi`, commerce écrit`%eax`,余数写入 `%edx` Élever le nombre de références à l'écriture`dividend`Le nombre de mots qui sont en cours d'écriture est le même que le nombre de mots qui sont en cours d'écriture.`%eax`Dans les SSA, la moitié supérieure se présente comme la moitié inférieure.`signfill` simplifier ce référentiel à simplifier en moitié, en plus de faire 32 places `/`Il y a une autre.

### -O0 de la salle de bain

Dans le`-O0`Je vais faire en sorte que chaque partie reste en place.`percent_change`Je ne sais pas .`%edi`Je suis là .`-0x8(%rbp)`Je suis là .`%esi`Je suis là .`-0xc(%rbp)`Après chaque utilisation, je reviens.`movq %rsp, %rbp``pushq %rbp`在这个函数序言后,基址为 `%rbp`、 sans indice et avec un nombre de déplacements de mémoire, deviendra nommé `local_<hex>`De la variation.`-0x8(%rbp)`Pour la`local_8`- Je suis désolé .`-0xc(%rbp)`Pour la`local_c`Il y a une autre.

 l'ordre lui-même ne génère pas d'IR, pour `%rsp``subq`et `addq`Il n'y a pas de production.`Load`Ou `Store`Il y a une autre.

### Références

`grade`Le centre`leaq (%rip), %rcx`Dans le dossier, le volume de déplacements est de 0.`0x36`Le lieu de répartition est`R_X86_64_PC32.rodata+0x10` Les liens seront réunis`S + A - P`写入该字段──`S`Oui `.rodata`À l'adresse`A`Il y a plus de chiffres .`0x10`- Je suis désolé .`P`Il est le nom de la ville.`next_ip + disp = (P + 4) + S + A - P = S + A + 4`Il y a une autre.

L'élévateur applique le même calcul sans connecteur. Le déviation cible est égale à la distance de l'ajout de chiffres et de phases jusqu'à la fin de l'ordre, à savoir:`0x10 + 4 = 0x14`Il est un homme de bien.`rcx = &.rodata+0x14`Il y a cinq cartes de cette position.`int` Value `1, 2, 3, 4, 4`Il y a une autre.

## 阶段 4: de la régulation à la régénération des paramètres

Système V AMD64 psABI Section 3.2.3 节 规则,INTEGER 类参数依次通过 `%rdi`- Je suis là.`%rsi`- Je suis là.`%rdx`- Je suis là.`%rcx`- Je suis là.`%r8`- Je suis là.`%r9`Le résultat est passé.`%rax`, encore une fois`%rdx`返回──第 3.2.1 节说明,`%rbp`- Je suis là.`%rbx`et `%r12`À la`%r15`属于调用方, doit être conservé; le reste du寄存器 appartient à être调用方.

`collect_params()`应用一条规则: le paramètre de l'enregistrement écrit dans la fonction est le paramètre de la structure.`%rsi`Je ne lis pas.`%rdi`La fonction a encore deux paramètres:`percent_change`读取 `%edi`et `%esi`, donc il y a`param_1`et `param_2`Il y a une autre.`grade`Je ne peux pas le lire.`%edi`Il y a une autre.`total`Il va`%rdi`作为 64 位基址读取,将 `%esi`作为 32 位计数读取──

Maintenant, on peut expliquer Ghidra.`param_3`- Je suis désolé.`idivl`Il est écrit:`%rdx`, et le PSABI permet de passer .`%rax:%rdx`返回 128 位 INTEGER── Dans le fichier objectif, aucun mode de traitement ne peut nous dire si la valeur de retour est vraiment large──Ghidra conservera les deux périphériques pour la valeur de retour──

Sur le chemin du retour à zéro,`xorl %eax, %eax`Il suffit d'écrire`%eax`◊ Ghidra dans le même chemin`%rdx` comme une fonction d'entrée en lecture, cette entrée est devenue `param_3` L'ordre n'a pas d'erreur.

## 阶段 5:SSA, chaque définition un nom

Après la mise en place,`grade`写入 `rax`Quatre fois, écrit dans`rcx`三次──Cytron、Ferrante、Rosen、Wegman 和 Zadeck(1991) définit la forme de la statique de la seule attribution: chaque variable est attribuée une seule fois, la fonction phi du point de rencontre est sélectionnée à partir de la définition de ce point.`insert_phis()`et `rename()`Suivre les deux méthodes.

`total`La liste de l'ASS montre les résultats de la construction:

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

La version 0 du寄存器 est la valeur de l'entrée de la fonction.`esi_0`et `rdi_0`Il s'agit d'un cycle.`0x50`Il y a deux facteurs: initialisation du bloc et lui-même, donc chaque variable définie dans le cycle obtient ici un ph.`flags_2`Cette phi 1 produit est le code mort. La SSA minimale la place, parce que les deux précédents ont été définis.`flags`;étape 6 Je vais aussi le supprimer, parce qu'il n'y a nulle part où le lire.

Réinitialisation des mesures de réinitialisation`edx_1 = 0`est 32 位 définition,`rdx_3 = rdx_2 + 1`est 64 位 définie, donc phi `rdx_2`采用 un plus grand largeur de taille ⋅`cmpq %rdx, %rcx`Pour le`%rcx`Il est de 64 places, et il est défini.`ecx_1 = esi_0`est 32 bits, donc 該使用变为 `zext64(ecx_1)` Tous les changements dans le pseudo-code sont dus à cette règle

La légèreté est maintenant à l'échelle de la SSA.`coalesce_webs()`Pour ce faire, il est nécessaire de combiner chaque ph avec ses paramètres en une variable appelée web, et de donner un nom à ce web. Ceci s'applique à la structure générée par le compilateur pour ces fonctions. Mais en cas de réplication, il peut être défaillant, par exemple, deux valeurs de transfert de ph du même point de conversion.

## 阶段 6: simplification 替换与死代码消除

`optimize()`Répondre à l'expression "réfléchissez à la réaction"

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

Le point d'utilisation est un mot de passe et non un ph; si la définition contient un chargement, la définition et l'utilisation ne peuvent pas être stockées ou modifiées. La fréquence ou l'adresse peut être remplacée à n'importe quelle position de phi à l'extérieur, car les paramètres de phi doivent être maintenus en tant que variables pour former un web.

Le code de suppression est utilisé sans objet, et l'expression ne contient pas de valeur de modification ou de fi.`percent_change`- Je suis en train de faire un travail.`edx_2 = dividend_1 % edi_0`Oui, c'est pourquoi il a été supprimé.`edx_1 = signfill(eax_1)`Il ne reste qu'un seul point d'utilisation, et il est remplacé.`dividend_1 = edx_1:eax_1`Il y a une autre.

寄存器对规则随后将 `signfill(eax_1):eax_1`化简为`eax_1`, à la différence de la loi`eax_1 / edi_0`Je suis là.`eax_1 = esi_1 * 100`Il n'y a qu'un seul point d'utilisation.`esi_1 = esi_0 - edi_0`Il n'y a qu'un seul point d'utilisation, tous deux sont déplacés dans le retour de la phrase.`flags`La définition est remplacée par la définition de la condition de départ.

```c
return (param_2 - param_1) * 100 / param_1;
```

### Je suis à 0x66666667

`grade`Le clang n' est pas généré .`idiv`Il est très bien.`imulq $0x66666667, %rax, %rax`, à nouveau à un second exécuteur`sarq $0x22, %rcx`, puis exécuté `shrq $0x3f, %rax`,最后将两者相加──Granlund 和 Montgomery 的论文Division par intégrales invariables en utilisant la multiplication(PLDI 1994) décrit cette méthode──编译器选择乘数 `m`Et le volume de déplacement`s`, faire dans le cadre de chaque `x`Tout le monde est satisfait`(x * m) >> s`Ça va .`x / d`Il y a une autre.

Je suis là.`m = 0x66666667 = 1717986919`- Je suis désolé .`s = 34`◊运算可以核对:`2^34 / 10 = 1717986918.4`, à l'étage`1717986919`                                                                                                                                                                                                                                                              `m * 10 - 2^34 = 6`                                                                                                                                                                                                                                                              `x`Les erreurs sont multipliées.`2^31`Il faut rester là.`2^34`Voici, donc l'erreur est de 8:6).`int`- Je suis désolé .`(x * m) >> 34`Tout est comme ça .`floor(x / 10)`Il y a une autre.

Pour le négatif`x`, vers le bas, l'ensemble est loin de zéro, tandis que la différence de C est vers le zéro.`shrq $0x3f`提取乘积的符号位, et il est juste dans `x`Pour négatif, il est égal à 1.

`magic_divisor(m, s)`Il est possible de faire une évaluation de la valeur de la candidature.`d`计算为 `2^s`À l' exception de`m`Le nombre total de commerçants,并尝试 `d`et `d + 1`Il n'y a que ça.`m`Ça va .`2^s / d`En plus de l'ensemble des résultats, et de satisfaire les limites de l'erreur, il n'accepte qu'un seul.`d` Le même nombre de couples `s = 33`Je vais l' avoir .`d = 5`C'est vrai aussi, parce que`0x66666667`Il en est de même.`2^33 / 5`Un test se déroulera à 2.406 valeurs et sera associé à cette relation.`c_div(x, 10)`Comparer, parmi lesquels `int`Les deux extrémités de la portée.

启用识别时,`grade`显示为 `ecx_1 = param_1 / 10 - 6;`关闭识别时,演示会打印原始形式:

```c
rax_1 = (long)param_1 * 0x66666667;
ecx_1 = (int)(rax_1 >> 34) + (int)((unsigned long)rax_1 >> 63) - 6;
```

两种形式都编译,也计算出相同值――保留这个开关――当你读到未研究的编译器生成的代码时,原始形式才是真实的表达――

## 阶段 7: du type de type de type de type de type de type

Il n'y a pas de type.`infer_types()`Pour la première fois, le nombre de pages de données de type C est de 32 pages.`int`,64 位的网是 `long` Si un site web est visité `base[idx]`Le fond de l'élément est de 4 caractères.`int *` les types d'indices sont répétés et diffusés, de sorte que `-O0`Je suis là .`local_8 = param_1`J' ai fait tout ça.`int *`◊ Le type de retour dépend de `return`语句中值的位宽──

`total`Le résultat est `int total(int *param_1, int param_2)`✿Ghidra 写的是 ✿`int total(long param_1,uint param_2)`                                                                                                                                                                                                                                                              `*(int *)(param_1 + uVar2 * 4)`                                                                                                                                                                                                                                                              `const`, tout est impossible à distinguer .`int *`et `unsigned *`Il y a une autre.

Lee、Avgerinos 和 Brumley(TIE,NDSS 2011) va type de récupération de l'écriture pour le classement. Le résultat est un top-界 et un bottom-界, et non un seul guess.`const`Le taux de réaction des marquages d'index atteint 98%. Ce cours adopte les deux règles les plus coûteuses de cette ligne de recherche, en soulignant qu'elles ne sont pas à la hauteur de rien.

无符号运算保留在表式中,而不体现在变量类型里──`cmpl $0x4, %ecx`后的 `ja`打印为 `(unsigned int)ecx_1 > 4`- Je suis désolé .`shrq`打印为 `(unsigned long)rax_1 >> 63` La variable reste en type symbole, de sorte que le lecteur peut déjà voir la valeur du référentiel, et peut également voir l'ordre dans une position où elle sera considérée comme sans valeur symbole.

## 阶段 8: de la reconstruction de la structure

Cifuentes(1994) Section 6 将图中的区域与高级语言的结构形态匹配──先处理循环(6.6.1),再处理双路条件(6.6.2),最后处理多路条件(6.6.3)──Yakdan、Eschweiler、Gerhards-Padilla 和 Smith(NDSS 2015) a suivi une autre route── ils ont proposé chaque élément de la condition d'exécution, à partir de ces conditions, construire une structure, non dépendant de la forme fixe── son mouvement provient d'une mesure: Hex-Rays pour un échantillon généré 49,514 行代码 comprennent 1,571 `goto`, en moyenne pour chaque 32 ligne; tandis que leur méthode structurante n'a produit aucun de ces types de phrases dans les 1 530 noyaux de la fonction.

`structure()`Il faut que la phase 2 fournisse deux faits.`Branch`Le dernier bloc, dont le point de contrôle direct est le point de convergence du point de contrôle. Le dernier est le point de convergence du point de contrôle. Le cycle naturel est le point de convergence des éléments qui peuvent être rassemblés.

Pour les échanges`j``Branch`- Le numéro de la liste:

- Si `j`Il est le plus grand de tous les pays.`if (!cond) { fallthrough region }`Puis de là .`j`Continuez à faire.
- Si `j`Il est en cours de production.`if (cond) { target region }`Puis de là .`j`Continuez à faire.
- Si `j`C'est une fonction qui sort, deux branches reviennent.`if (cond) {... }`, un autre fraction de la moitié, pas utilisé `else`C'est tout.`percent_change`et `total`Le retour de la vie
- 否则生成 `if (cond) { target } else { fallthrough }`Puis de là .`j`Continuez à faire.`-O0`Je suis là .`percent_change`C'est comme ça: deux branches de stockage.`local_4`, et dans la fonction finale.

Pour le cycle:

- Si le cycle est`Branch`结尾, puis une suite se situe dans le cycle, générée `while (cond) { body }`Il y a une autre.`-O0`Je suis là .`total`C'est le cas de la même forme:`local_14`et `local_c`, et le fait de passer`jge`Je vous laisse.
- Si le boucle est également un bloc de rechange, ou si l'exportation se trouve dans un bloc de boucle, alors`do { body } while (cond);`Il y a une autre.`-O1`Je suis là .`total`C'est le cas de la section`0x50`执行加法、递增、比较, puis sauter à nouveau lui-même.

`IndirectJump`Il y aura un bout, et il n'y aura pas de suite.`-O0`Je suis là .`grade`Utilisez vraiment le tableau de bord:`jmpq *%rax`- Je suis là.`.rodata+0x0`Les cinq mouvements de la classe sont en cours de réflexion.`0x76`- Je suis là.`0x7f`- Je suis là.`0x88`et `0x91`Les quatre blocs ne peuvent être transférés que par le saut indirect, et ne sont donc pas améliorés.`switch`Il y a une autre.

### -O1 à l'interrupteur faire quoi ?

Dans le`-O1`Je ne suis pas là.`grade`Il est en train de faire le calcul.`score / 10 - 6`, le résultat sera un nombre sans symbole par rapport à 4, puis de `.rodata+0x14`Il y en a cinq.`int`Une fois sans symbole, la valeur est couverte.`score / 10 < 6`et `score / 10 > 10`两种情况──负差值作为无符号数很大,因此也无法通过检查──

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `1, 2, 3, 4, 4`,分别对应商 6 à 10 带五条 `return``switch`Il est devenu un.`if`Et une fois que le nombre de lecture.`lookup_14`Il y a une autre.

Le taux de dépôt est déterminé.`table_values()`De la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à la page à.`.text`Références de la suite`.rodata`偏移, ou jusqu'à la fin de la partie. Dans ce dossier, le prochain des écarts citées est `0x28`, qui est`grade_label`                        `lookup_14`Il y a une`(0x28 - 0x14) / 4 = 5`项──与 4 的无符比较也吻合──Ghidra 同样不知道表长──它写成 `*(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4)`, c'est-à-dire un caractère d'adresse plus le volume de déplacement, et de trouver cinq valeurs de travail laissés au lecteur.

## Avec Ghidra 并排对照

演示会打印每一对结果──Ghidra 文本来自 `code/fixtures/ghidra/*.json`, en réel dans 2026-10-14  retour des preuves 记录──命令为`npx -y rea-agents@6.5.0 decompile ledger-x86_64-O1.o <function> --provider ghidra --format json`                                                                                                                                                                                                                                                              `confidence: observed`et `authority: shipped-artifact`Le texte est le résultat de l'observation, mais les affirmations du texte interne sont les conclusions, tandis que le récit ne montre pas quelles sont les conclusions.

### pourcentage_changement

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

`code/fixtures/ghidra/ledger-x86_64-O1.ghidra-repaired.c`La version révisée du milieu modifie seulement cette fonction, testant la comparaison avec le code source sur 81 entrées.

### de qualité

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

### le total

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

行为测试会原样编译 `grade`et `total`Je suis en train de lire le livre.`typedef`, ainsi que selon `.rodata+0x14`处二十个字节                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `DAT_001000b4`定义──在输入网格上, les deux fonctions sont conformes au code source──

## Pour étudier la révélation de la fausse code

LLM4Decompile (EMNLP 2024) a obtenu, individuellement, un taux de réécriture de Ghidra en HumanEval-Decompile de 20,12%[2]. Environ cinq pour cent des fonctions sont capables de se réécrire et de passer par le principe de base. Après avoir utilisé leur modèle 6.7B modifié Ghidra, ce taux est passé à 52,74%[3].

Liu Raff et Micinski (arXiv 2609.05370, 2026 9 月) expliquent cette différence. Ils utilisent 300 fonctions de base de données GitHub et 287 fonctions basées sur CVE. Le modèle modifié le plus fort a augmenté le taux de réussite de la construction de Ghidra de 75% à 90%, mais le taux de correspondance de comportement est tombé de 74% à 62%. Même si les résultats des candidats ont passé tous les tests du KG, les résultats peuvent toujours être différents.

Ils ont pu trouver une raison très simple: avec le type de caractères, les fonctions et les conditions de protection utilisées, ils ont remplacé les éléments apparemment inconnus laissés par l'antitransplicateur dans le texte.

C' est l' imprimante de l' émetteur .`(unsigned long)(unsigned int)ecx_1`Pour le saut non résolu, il imprime des notes plutôt que de les écrire.`switch`Pour le tableau, il utilise`lookup_14`Il y a des modèles qui peuvent être fabriqués.`code/main.py`Le processus de recommandation de Ghidra`undefined1 [16]`很难看,但诚实──修订模型生成的整洁签名 `int percent_change(int, int)`Bien que la raison soit vraie, elle ne l'est pas. Le même modèle peut générer une signature complète mais erronée sur la fonction suivante.

## 亲手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/34-lifting-to-pseudocode
python3 code/main.py
```

- Je vais vous montrer .`-O1` Les quatre fonctions du fichier cible, et  chaque instruction avec les instructions soumises `llvm-objdump`Pour le plus grand nombre de personnes`percent_change`- Je suis là.`grade`et `total`Il imprime la liste précédente de la fonction SSA, qui contient des fonctions ph, ainsi que le pseudo-code de la liste de la fonction Ghidra.`grade`- Je suis là.`-O0` version `percent_change`- Je suis là.`total`et `grade_label`, ainsi que dans l'ensemble:

```json
{
  "functions": ["grade", "grade_label", "percent_change", "total"],
  "instructions": 56,
  "blocks": {"percent_change": 3, "grade": 3, "total": 5, "grade_label": 4},
  "phis": {"percent_change": 0, "grade": 1, "total": 2, "grade_label": 1},
  "objdumpDifferences": 0
}
```

按以下顺序阅读 `code/main.py`- Le numéro de la liste:

1. `read_object()`读取 ELF64 可重定位目标文件的节头,符号表和 `.rela`- Je suis là.
2. `decode_one()`et `render_att()`解码一条命令,并按 `llvm-objdump`La façon de l'imprimer.
3. `build_blocks()`- Je suis là.`immediate_dominators()`et `dominance_frontiers()`                                                                                                                                                                                                                                                              
4. `lift_insn()`将一条命令转换为 IR 语句,并解析重定位──
5. `insert_phis()`et `rename()`构建 SSA,并插入位宽转换──
6. `make_simplifier()`- Je suis là.`substitute_once()`et `remove_dead_code()`Dans le`optimize()`Je suis en train de travailler.
7. `collect_params()`- Je suis là.`coalesce_webs()`et `infer_types()`Pour le web 命名并推断类型──
8. `structure()` coup de coeur `post_dominators()`et `natural_loops()`生成 C 函数体──
9. `lift_function()`串联各阶段,`lift_all()`则携带被调用函数签名,提升整个目标文件──

##  réel usage

Pour améliorer votre propre objectif de fichier de fonction, utiliser `clang -target x86_64-unknown-linux-gnu -c`Construire, puis utiliser.`lift_all(read_object(path))` Découpage`DecodeError`时, de la nouvelle lire le code d'exploitation, le chercher dans le tableau de carte du SDM 操作码, ajouter un élément dans le tableau du haut du fichier ∙∙`lift_insn()`增加一条规则── générer des structures `goto`时,使用 `IrPrinter`印图,判断缺少哪条形态规则──每次增加的内容都很小,现有测试会对照 `llvm-objdump`Ou clang 检查它──

Après l'installation de Ghidra, il est possible de faire une réaction à la même fonction et de placer deux parties du texte.

## 交互实验

### 实验 A: faire passer une fonction à travers cinq étapes

Dans le`code`Je suis en train de lire Python:

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

Je suis là .`%esi`Comment ?`subl %edi, %esi`变成 `esi_1 = esi_0 - edi_0`, re-être transformé`(param_2 - param_1)`✿ ✿`fe`Oui `subl`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `mod = 11`- Je suis là.`reg = edi`- Je suis là.`r/m = esi`Il y a une autre.

### 实验 B: détériorer le mode habituel

```python
print(lift_function(obj, "grade", recognize_division=False).pseudocode)
print(magic_divisor(0x66666667, 34), magic_divisor(0x66666667, 33), magic_divisor(0x66666667, 31))
```

Première ligne d'impression`10 5 None` S'il vous plaît expliquer pourquoi le même nombre de fois dans le nombre de déplacements réduit un fois indiqué par division par 5, ainsi que pourquoi le nombre de déplacements 31 ne répond pas à l'erreur de limite 

### 实验 C: nouveau objectif du fichier faire arrêter le décodeur

É`-O2`构建测试样例并提升它:

```bash
clang -target x86_64-unknown-linux-gnu -O2 -fno-asynchronous-unwind-tables -c fixtures/ledger.c -o "$TMPDIR/ledger-O2.o"
python3 -c 'from main import *; from pathlib import Path; import os; lift_all(read_object(Path(os.environ["TMPDIR"]) / "ledger-O2.o"))'
```

Le codeur est en train de`0x56`处停止, rapport `opcode 81 is outside the fixture subset` Les commandes`81`Il s'agit d'une instruction de 32 places.`andl $0x7ffffff8, %edx`, clang dans `total`Il a été utilisé dans le cycle de métamorphose.`decode_one()``0x83`旁边, relancer,并记录下来哪个操作码让你停下来. Ce sous-ensemble est une fois étendu, chaque élément est contrôlé.`llvm-objdump`- Je suis en train de vous dire.

### 实验 D: Ghidra dans la note moyenne

```python
print(ghidra_pseudocode("grade"))
for score in (-25, 0, 59, 60, 100, 115):
    sign = -(score >> 31)
    product_sign = ((score * 0x66666667) & ((1 << 64) - 1)) >> 63
    print(score, sign ^ product_sign)
```

Chaque ligne est imprimée par Ghidra.`uVar1`L'expression exacte est difficile à lire, et les instructions.`xorl %eax, %eax`En deux caractères, on exprime le même sens.

## 实践实验

Pour`-O0`Je suis là .`grade`添加 `switch`La réparation

要求:

- 读取 `ledger-x86_64-O0.o``.rela.rodata`Il y a cinq postes de repérage, chacun est un.`R_X86_64_PC32.text+offset`,并根据 `.rodata+0x0`Il y a cinq cas de l'objectif.
- Pour l' IR 添加 `Switch`终结指令, contenant des indices exprimés ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ `ja`Je suis en train de faire une petite partie de la liste.
- Pour changer chaque objectif du bloc en un second, laissez le nœud de contrôle, le nœud de contrôle et le SSA fonctionnent normalement.
-                   `switch (local_10) { case 0:... }`, chaque objectif à la hauteur de l'un .`case`,并将共用函数尾声 être placée après汇合点──
- Pour les informations non précisées sur le saut de la frontière, conservez les informations.
- Utilisez le clang 编译结果, et comparez le nombre de tests avec le code source.

Le succès est:`-O0`Je suis là .`grade`Avec `-O1`Je suis là .`grade`Dans l'ensemble du réseau, la sortie est la même, et le résultat de récupération contient un `switch`Il n' y a pas de`goto`Il y a une autre.

## 交付产物

本课产 出 `outputs/skill-lifting-to-pseudocode.md` L'utilisation de ce produit pour améliorer une fonction, fournir des conseils pour chaque ligne, et remplir un tableau de différence avec le texte de l'anticompileur.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/34-lifting-to-pseudocode
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

套件共 25 个测试──验证证:

- Pour les deux documents cibles, chaque directive, décodeur et soumission`llvm-objdump`文本一致;若安装了 `llvm-objdump`, également conforme aux résultats des opérations sur le terrain
- REX, ModR/M, SIB et autres`leaq (%rip), %rcx`Des données de référence sont disponibles sur le site Web.
- 遇到子集之外的操作码时抛出 `DecodeError`, plutôt que des conjectures
- ELF 读取器列出四个函数和三个 `.text`Références
- `total`Il y a cinq blocs,`0x44`- Je veux dire .`0x50`- Je suis désolé .`0x50`est le cercle de l'organisme qui se fait lui-même
- `%rdi`et `%rsi`变为 `param_1`et `param_2`, et`total`Le centre`param_1`Pour`int *`
- `test`et `cmp` coup de coeur `je`- Je suis là.`jle`- Je suis là.`ja`et `jge`, pour devenir`==`- Je suis là.`<=`Il n'y a pas de symbole.`>`et `<`
- SSA dans le `total`循环                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `percent_change`中不放置任何 phi
- `percent_change`- Je suis là.`grade`et `total`Le code de la fiction est le même que le texte préalable
- 启用识别时,`grade`显示 `param_1 / 10 - 6`;关闭识别时,显示原始乘法
- `0x66666667`配合移位量 34 indique décomposition à 10, 配合移位量 33 indique décomposition à 5, et des relations similaires sont établies sur le réseau d'entrée
- `-O0`Je suis en train de me faire une petite place.`local_4`- Je suis là.`local_8`- Je suis là.`local_c`, et il n'y a plus de pointeurs
- 通过重定位, dans `.rodata+0x14`处的表中读取到 `1, 2, 3, 4, 4`
- `-O0`Je suis là .`grade`Les quatre blocs non élevés ont été signalés
- Ghidra 测试样例 contient 16 字节 retour à la valeur,`param_3`、 n'a pas été simplifié `xor`et `long param_1`
- Six unités de la production sont disponibles `clang -std=c11 -Wall -Werror`Pour`x86_64-unknown-linux-gnu`编译
- 提升后函数、修复后 Ghidra 文本和源码, imprimé sur le même 232 行

## Mode de défaillance dans l'environnement de production

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

Considérer le faux code comme un processus de recommandation que vous n'avez pas encore vu. Utiliser un élève que vous pouvez lire, de l'instruction réécrire.

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
- Le réel de cette étude est que les données de l'étude sont disponibles sur le site Web.`3b79af2`- Le numéro de la liste:`src/domain/functionComparisonDimensions.ts`- Je suis là.`website/evidence/dx-ball-sound-pan.md`Il y a une autre.
