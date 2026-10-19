# 编译器惯用模式: Optimiser comment modifier le code, ainsi que comment le lire en revanche

>  Optimiser les compilers utilisent des instructions de format de source de structure de remplacement moins coûteuse.

**Type:** Build
**Languages:** Python, C, x86-64 assembly, AArch64 assembly
**Prerequisites:** Phase 13 · 33（反汇编与控制流）、Phase 13 · 34（提升为伪代码）、Phase 13 · 38（调用约定）
**Time:** ~150 分钟

## Objectif de l'apprentissage

- Utiliser la limite de Granlund-Montgomery pour déduire le nombre de fois et le nombre de déplacements de chaque temps normal, et de clang de la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à la résistance à
- Pour dire LLVM 降低 `switch`Les cinq modes de lecture du document cible sont le nombre d'articles, la position et le contenu des articles.
- Le cycle de météorologie sera interprété comme le nombre de passages, le nombre de compléments, le nombre d'éléments par cycle, le nombre de fois de génération, le nombre de couvertures, le nombre de couvertures et le nombre de cycles.
- Identification des fonctions de référencement, de référencement et de transformation en`memset`Ou `memcpy`Le cycle de la vie.
- Pour x86-64 et AArch64,`-O0`Pour`-O3`Les données de référence sont fournies par le rapport de référence.
- Pour les résultats, la comparaison avec Ghidra, Angr, Radar2

##  problématique

Vous utilisez `-O2`Il est écrit:`idioms.c`,问智能体 `div7u`Fais quoi ?`imulq $0x24924925, %rax, %rax`, répond à cette fonction multipliée par 613566757, re déplacement 相加.`x / 7`Il y a une autre.

Dans le même dossier, il y a aussi un 7%, mais pas de saut.`switch`, un changement de la carte de saut`switch`, un transformé`sete`et `cmovne`Les deux branches`switch`, ainsi qu' une traversée`n`个整数的循环: chaque tour en deux`xmm`寄存器中处理八个整数, reutiliser le deuxième cycle pour traiter les éléments restants.`-O0`Le même code source est généré.`divl`、7 articles Le cycle de saut et de la taille`-O1`La valeur de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de l'échelle de la

Ces formes sont des modèles habituels. Les règles de production de chaque modèle peuvent être décodées par un compteur en fonction de son code source.`0x66666667` Cette formation couvre tous ces modèles d'identification, 18 projets de construction de notre code personnel, et comporte 373 projets de rapports et de vérification du code source C.

```figure
re-39-idioms-by-level
```

## Le mode habituel est une forme de la base de la proposition

Le modèle habituel est un modèle de compilateur qui vise une séquence d'instructions générées par une structure source de code. Il peut donc être identifié, car il a une forme fixe, le nombre d'opérations porte une fréquence de prédiction de la présentation, et la forme est différente du code habituellement écrit par le programmeur.

`code/main.py`Traitement de l'identifiant`llvm-objdump -d -r`Le système d'identification définit chaque fonction en termes d'adresse, de caractères, de notes, de chiffres et de chiffres.`.rodata`Les résultats de la recherche ont été obtenus en ligne.`.rela.rodata`条目。

Chaque examen est une seule.`Idiom`记录, contenant `kind`Déclaration de la situation`source`≈ forme`evidence`Liste de l'adresse`detail`字典和 `verified`Le code de référence est C.`parse_source()`读取 `idioms.c`, trouver chaque fonction,提取 `/`Avec `%`后除数`*`Le nombre de fois`switch`分支 et sa valeur`? :`运算符`for`循环和调用者──除法模式的除数出现在函数除法列表中即证;查找表条目与分支值相同或相差固定倍数时即证;尾调用者在源码中确实调用时即证──演示报告即证`unverified`La liste est terminée, test suite affirmation Tous les 18 construits de cette liste sont en plein air.

解码需要名称──识别器按清单顺序对每个函数的基本块运行小符号求值器,根据第38 课的系统 V 和 AAPCS64 调用约定,将源码参数名放入参数寄存器──槽按操作数文本跟踪,因此能穿越`-O0`代码的溢出保存操作──在每个块入口合并前驱状态;若状态不同,前模式分配的名称优先于常量──正如,`digest`Le centre`cmovll %edx, %eax`Pour lire`sum % 10 < 5 ? sum % 10 : 5`: cycle mode sera nommé `sum`, le mode de démarche sera nommé `sum / 10`,取模模式将结果命名为 `sum % 10`源码写作 `rem > 5 ? 5 : rem`, deux expressions sont prises .`rem`et 5 de plus en plus faible, et`rem == 5`时一致。

## À part la quantité habituelle

Granlund 和 Montgomery 的Division par intégrales invariables en utilisant le multiplication(PLDI 1994)`n / d`△ choix de lieu de séjour `s`et le nombre`m = ceil(2^s / d)`Il faut juste faire une erreur.`e = m * d - 2^s`- Ça suffit.`n``floor(n * m / 2^s)`C' est comme ça.`floor(n / d)`Pour un nombre de 32 places`n`, la limite est `e <= 2^(s - 32)`; pour satisfaire `|n| < 2^31`Il y a un symbole`n`, limite pour`e <= 2^(s - 31)`, et et `n`Pour le temps négatif, le nombre de modifications est ajouté, car le total de l'opération négative est inversé.

`main.py`Le centre`magic_numbers(d, bits, signed)`Depuis 32  commencé à chercher `s`, retourner le premier groupe satisfaire les paramètres de la limite.

### Il n'y a pas de chiffre à 10

`2^35 / 10 = 3435973836.8`, à l'étage`3435973837 = 0xCCCCCCCD`                                                                                                                                                                                                                                                              `0xCCCCCCCD * 10 - 2^35 = 2`, et `s = 35`Les limites sont`2^3 = 8` `s = 34`, l'erreur est de 6, dépassant la limite 4, donc 35 est le minimum de déplacement.`n = 123`检查:`123 * 3435973837 = 422624781951`- Je suis désolé .`422624781951 >> 35 = 12`Il y a une autre.

Clang dans x86-64 `-O2`Pour moi`div10u`La forme de la vie est la suivante:

```text
       0: 89 f9                        	movl	%edi, %ecx
       2: b8 cd cc cc cc               	movl	$0xcccccccd, %eax
       7: 48 0f af c1                  	imulq	%rcx, %rax
       b: 48 c1 e8 23                  	shrq	$0x23, %rax
```

`0x23`35°.`movl %edi, %ecx`Pour étendre le paramètre 32 bits à un référentiel 64 bits, il s'agit d'un format sans symbole.`imulq`提供输入的 `movl $imm`读取乘数,读取移位量, puis调用 `divisor_from_magic(0xCCCCCCCD, 35)`△该函数尝试 `2^35 // m = 10`和 11,并接受 10,因为 `magic_numbers(10)`Retour à la même multiplicité et à la même quantité de déplacement.

Dans AArch64 上, la même fonction est `mov w8, #0xcccd; movk w8, #0xcccc, lsl #16; umull x8, w0, w8; lsr x0, x8, #35`◊ la quantité habituelle divisée en deux 16 places et demi`umull`, déplacement de volume à 10 dans le système de rédaction,

### Il n'y a pas de code à l'intérieur.

`2^35 / 7 = 4908534052.57`, à l'étage`4908534053 = 0x124924925`, nécessite 33 bits. L'erreur 3 ne dépasse pas la limite 8, donc le volume de déplacement est de 35, et de plus petits déplacements sont non valides.`0x24924925`, à nouveau en suivant le nombre de séquences fixées:

```text
      32: 48 69 c0 25 49 92 24         	imulq	$0x24924925, %rax, %rax
      39: 48 c1 e8 20                  	shrq	$0x20, %rax
      3d: 29 c7                        	subl	%eax, %edi
      3f: d1 ef                        	shrl	%edi
      41: 01 f8                        	addl	%edi, %eax
      43: c1 e8 02                     	shrl	$0x2, %eax
```

Je vais le lire.`t = (n * 0x24924925) >> 32`Alors ...`q = (((n - t) >> 1) + t) >> 2` 总移位量为 `32 + 1 + 2 = 35`Je suis là.`n = 100`时:`t = 14`- Je suis désolé .`(100 - 14) >> 1 = 43`- Je suis désolé .`43 + 14 = 57`- Je suis désolé .`57 >> 2 = 14` Identificateur dans le mouvement droit 32 位 `sub`- Je suis là.`shr`- Je suis là.`add`- Je suis là.`shr`Je vais vous donner un peu plus de temps.`2^32`, récupérer le 7..`evaluate_division()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `n // 7`Pour la première fois, le nombre de personnes concernées est de 6%.`sub w9, w0, w8; add w8, w8, w9, lsr #1; lsr w0, w8, #2`, parce que le déplacement de place est une instruction, donc peu.

### Les chiffres sont à 3

`2^32 / 3 = 1431655765.33`, à l'étage`1431655766 = 0x55555556`, error 2`s = 32`Il y a des limites de temps`2^1 = 2`恰好满足界限, donc le déplacement est de 32, clang 使用 `shrq $0x20`Je suis là.`n = -7`时,乘积为 `-10021590362`,算术 Right Move 32 位 obtenir `-3`;符号位已置位,修正加 1,结果为 `-2`C' est le C du milieu .`-7 / 3`Il y a des symboles.`div10s`et `div3s`Tout est fait pour l'exécution`shrq $0x3f`, encore une fois`addl`实现修正──

### La quantité ne peut pas expliquer ce qu'elle est.

                                                                                                                                                                                                                                                              `0x66666667`配合移位 34 表示 10; 相同乘数配合移位 33 表示 5,第 34 课已示范过.`clangMatchesAlgorithm`字段记录 est-ce que ce groupe est réellement le groupe généré par le algorithme de recherche ?`magic_numbers()`Je les rejetterai parce que le compilateur a changé de position avec des symboles.`mod8s` présenter cette forme:

### Le mode habituel appartient à l'ordre de sélection

Dans le`-O0`Je suis là.`div10u`Oui `movl $0xa, %ecx; xorl %edx, %edx; divl %ecx`- Je suis désolé .`div10s`Oui `cltd; idivl %ecx`Mais dans le même but.`digest`- Je veux le faire .`imulq $0x66666667`Pour les paramètres de l'échantillon, il est possible de calculer les différences entre les deux.`idioms-x86_64-nofastisel-O0.o`Utilisation `-O0 -mllvm -fast-isel=false` Construire, dont chaque déformation devient乘法, y compris l'utilisation `movl $0xcccccccd, %ecx; imulq %rcx, %rax; shrq $0x23``div10u`❖ Le dépistage des pièces est un sélecteur d'instructions à grande vitesse.`-O0`下的选择;乘法是 SelectionDAG 的降低结果,来自LLVM 的 `UnsignedDivisionByConstantInfo`et `SignedDivisionByConstantInfo`Il y a une autre.`digest`Le bloc de la loi contient également`switch`, le bloc a donc été remis à la SelectionDAG.`hardware idivl`Avec `magic multiply`两种形式,图中显示混合形式 `-O0`函数。

## 取模跟随商

`x % d`Ça va .`x - (x / d) * d`◊编译器先用上述模式计算商,再乘回除数并相减──x86-64 上乘回 10 是 `addl %ecx, %ecx; leal (%rcx,%rcx,4), %ecx`, qui est`2 * q * 5`◊AArch64 上                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `msub w0, w8, w9, w0`Il est là .`w9 = 10`时计算 `w0 - w8 * w9` Identifier le système de contrôle de l'information par le biais de l'opération de copie`add`- Je suis là.`lea`- Je suis là.`shl`- Je suis là.`imul`Suivre les facteurs cumulés, quand les facteurs sont égaux à la décomposition`sub`Il y a une autre.

Lorsque le même outil est utilisé par d'autres expressions, le rapport conserve deux modes:`-O1`Je suis en train de faire un travail.`digest`Je ne compte qu' une fois.`sum / 10`, en même temps utilisé `switch`Dans x86-64 en haut, il a même deux fois combiné avec le commerce:`leal (%rax,%rsi), %edi`- Je suis là.`addl %esi, %eax` le rapport d'identificateur une fois décomposition et une fois de retrait, et le produit commercial sera partagé.`switch`L'indice est difficile à comprendre.

Il est indépendant de 2 parce qu'il ne comporte pas de calcul:

```text
      92: 8d 48 07                     	leal	0x7(%rax), %ecx
      95: 85 ff                        	testl	%edi, %edi
      97: 0f 49 cf                     	cmovnsl	%edi, %ecx
      9a: 83 e1 f8                     	andl	$-0x8, %ecx
      9d: 29 c8                        	subl	%ecx, %eax
```

Pour le nombre négatif`x`, le code est placé en avant de la cache, en plus de la 7 , de sorte que la coupe selon la C  requête vers le zéro ∙∙ la valeur de la cache est de la valeur du zéro jusqu'à 8 de la valeur de la coupe `x`,相减后留下 `x % 8`✿Arch64 使用 `negs w8, w0; and w9, w0, #0x7; and w8, w8, #0x7; csneg w0, w9, w8, mi`: simultanément masquer码 `x`et `-x`, re按符号选择并取负. Ghidra va nommer ces règles comme `RuleSignMod2nOpt`,简介为转换 INT_SREM 形式:`(V + (sign >> (64-n)) & (2^n-1)) - (sign >> (64-n)) => V s% 2^n`Il y a une autre question.

Dans le`-O0`Avec l'Arch64`sdiv w9, w8, w10; mul w9, w9, w10; subs w0, w8, w9`Il est également accepté sous cette forme,并报告 `hardware sdiv + mul + subs`Il y a une autre.

## mode de commutation

LLVM dans deux positions décider `switch`形态:`SimplifyCFG::simplifySwitchLookup`Dans le`-O1`及以上运行: Lorsque au moins trois branches ont été produites en permanence, et que l'objectif est de trouver des émissions, elles seront transférées en émissions de valeur.`SingleValueKind`- Je suis là.`LinearMapKind`- Je suis là.`BitMapKind`et `ArrayKind`Il y a une autre.`-O0`流水线不运行该过程──剩余开关 进入命令选择阶段的 `SwitchLowering::findJumpTables`Il y a au moins`min-jump-table-entries`个条目(默认 4) et suffisamment denses lors de la construction`NumCases * 100 >= Range * MinDensity`, ordinaire de la fonction`jump-table-density`Pour 10,`-Os`La situation restante change en seconde recherche de la partition de la quantité normale, par`splitWorkItem`选择枢轴──具为每种结果提供一个函数──

| 函数 | 源码 | `-O0` x86-64 | `-O2` x86-64 | `-O2` AArch64 |
|---|---|---|---|---|
| `linear_switch` | 分支 0 至 6 返回 10 至 70 | 7 条目跳转表 | 线性映射 `10*k + 10`，默认 -1 | `madd` 和 `csinv` |
| `table_switch` | 分支 0 至 6 返回 10 至 60，再返回 71 | 7 条目跳转表 | `.rodata+0x28` 处的查找表 | `.rodata+0x0` 处的查找表 |
| `call_switch` | 分支 0 至 4 调用五个指针中的一个 | 5 条目跳转表 | 5 条目跳转表 | 比较树，枢轴 1 |
| `sparse_switch` | 分支 1、100、10000、1000000、100000000 | 比较链 | 比较树，枢轴 9999 | 比较树，枢轴 9999 |
| `two_cases` | 分支 3、4 返回 7、9 | 比较链 | 选择链 `k != 3 ? (k == 4)*9 : 7` | 两条 `csel` |

### Du fichier objectif à la page de recherche

`-O2`Je suis là .`table_switch`- Le numéro de la liste:

```text
      d0: b8 ff ff ff ff               	movl	$0xffffffff, %eax
      d5: 83 ff 06                     	cmpl	$0x6, %edi
      d8: 77 0c                        	ja	0xe6 <table_switch+0x16>
      da: 89 f8                        	movl	%edi, %eax
      dc: 48 8d 0d 00 00 00 00         	leaq	(%rip), %rcx
		00000000000000df:  R_X86_64_PC32	.rodata+0x24
      e3: 8b 04 81                     	movl	(%rcx,%rax,4), %eax
      e6: c3                           	retq
```

 frontière de contrôle `cmpl $6; ja`Indiquer qu'il y a 7 articles valides.`0x24`En plus de RIP, les 4 caractères de la section seront positionnés jusqu'à `.rodata+0x28`C'est la règle de la 33e classe.`0a 00 00 00 14 00 00 00 ...`, donc 条目为`[10, 20, 30, 40, 50, 60, 71]`, avec la source de code de la valeur de la distribution, etc.`.s`文件中将表命名为 `.Lswitch.table.table_switch`,并附注释 `@switch.table.table_switch` Le fichier objectif ne comporte que trois blocs:

Aarch64 形式通过 `adrp x8`et `add x8, x8, #0x0`拼出表地址,两者各带一条指向 `.rodata`                        `ldr w0, [x8, w0, uxtw #2]`- Je suis un homme.`add`Le nombre de personnes qui ont été affectées par la maladie

###  Absolument pas de réaction

`linear_switch`Pour 0 à 6 `k`Retour`10 * (k + 1)`Il y a une autre.`simplifySwitchLookup`检测到仿射关系,改为生成算术操作:

```text
      b0: 83 ff 07                     	cmpl	$0x7, %edi
      b3: 8d 04 bf                     	leal	(%rdi,%rdi,4), %eax
      b6: 8d 4c 00 0a                  	leal	0xa(%rax,%rax), %ecx
      ba: b8 ff ff ff ff               	movl	$0xffffffff, %eax
      bf: 0f 42 c1                     	cmovbl	%ecx, %eax
```

求值器将 `leal (%rdi,%rdi,4)`读为 `5*k`,将 `leal 0xa(%rax,%rax)`读为 `10*k + 10`,将 `cmpl $7`后的 `cmovb`读为 `k < 7 ? 10*k + 10 : -1` Il est alors identifié par chaque source de code, et le modèle est marqué par le test.`madd w8, w0, w8, w9`et `csinv w0, w8, wzr, lo` get la même expression, parmi lesquels `wzr``csinv`Dans le chemin de la création`-1`Il y a une autre.

### De réposition à lecture

`-O2`Je suis là .`call_switch`Avec le 33e cours`-O0``grade`Le même mode de récupération:`cmpl $4; ja`À l'intérieur`.rodata-0x4``leaq`、读取 4 字节条目的 `movslq`- Je suis là.`addq`, encore une fois`jmpq *%rax`Il y a cinq articles.`.rela.rodata`Le centre de la répartition,`target = addend - 4k`Je l' ai reçu .`0x10c, 0x107, 0x10e, 0x110, 0x109`, séparément indiquant cinq blocs différents, chaque bloc passant par une fonction.`dispatch`具将其扩展为 16 个分支:x86-64 上有 16 条重定位;AArch64 上则是16 个单字节组成的压缩表,使用 `ldrb w11, [x9, x8]`读取,以 `add x10, x10, x11, lsl #2`Multipliez par 4, puis faites le point vers la première partie de la pièce.`adr`Pour le code de l'écriture`[0x24, 0x74, 0x54, ...]`,并报告 `compressed: true`Il y a une autre.

### 4 niveaux d'optimisation avec un commutateur

`digest`包含对 `sum / 10`Le commutateur, divisé en 6 à 10, est de 1 2, 4, 8, puis le résultat est multiplié par 16.`-O0`Pour le saut, dans`-O1`Pour les autres`[16, 32, 64, 128, 128]`Je suis en train de chercher.`-O2`et `-O3`Il a changé de planche, ses quatre blocs ont été sauvegardés.`0x10`- Je suis là.`0x20`- Je suis là.`0x40`- Je suis là.`0x80` depuis `-O1`Le nombre de coups est de 16 à 16`-O0`J'ai commencé à faire des changements.`-O1`查找表,识别器将条目与源码值比较, trouver un taux fixe,并报告 `foldedFactor: 16`✿AArch64 ✿`-O2`形式 形式 形式 形式                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      `sub w9, w9, #9; cmp w9, #2; b.hs`, avec deux tests opérationnels couvrant les branches 9 et 10 │`rangeTests: [[9, 10]]`Il y a une autre.

Les deux paramètres se déplacent à ces frontières.`-fno-jump-tables`Dans x86-64 上将 `table_switch`- Je suis là.`call_switch`et `digest`Le commutateur 转为比较树,七分支函数的枢轴为 2 和 4──AArch64 上,`-mllvm -min-jump-table-entries=4`仍让 `call_switch`保持比较树, donc pour ce but, le nombre d'articles n'est pas un facteur déterminant.`idioms-arm64-jt4-O2.o`J'ai enregistré cette opération.

Le CCG va prendre deux décisions .`tree-switch-conversion.cc`中, utiliser `jump_table_cluster`- Je suis là.`bit_test_cluster`- Je suis là.`switch_decision_tree`et `switch_conversion`类──`-ftree-switch-conversion`Dans le`-O2`- Je suis en train de le faire.`-fjump-tables`et `-fbit-tests`Dans le`-O1` Start, jump 转表  Value est de `case-values-threshold`, par défaut décidée par le moteur. Ce moteur n'est pas installé dans le CCG, donc ces noms proviennent du code source et du manuel du CCG, et peuvent être consultés dans le compiler Explorer.

## 循环: évolutions, évolutions ou remplacements

Le cycle de l' LLVM est`-O2`- Je suis là.`-O3`- Je suis là.`-Os`- Je suis en train de le faire.`-O0`- Je suis là.`-O1`关闭, cette règle remonte à la loi de l'automne 2014 sur la gestion des données de l'entreprise.`-O2`Je suis là .`sum_n`ont montré chaque partie de cette forme:

```text
     1f6: 83 fe 07                     	cmpl	$0x7, %esi
     1f9: 77 09                        	ja	0x204 <sum_n+0x14>
     206: 81 e2 f8 ff ff 7f            	andl	$0x7ffffff8, %edx
     230: f3 0f 6f 14 37               	movdqu	(%rdi,%rsi), %xmm2
     235: 66 0f fe c2                  	paddd	%xmm2, %xmm0
     239: f3 0f 6f 54 37 10            	movdqu	0x10(%rdi,%rsi), %xmm2
     23f: 66 0f fe ca                  	paddd	%xmm2, %xmm1
     243: 48 83 c6 20                  	addq	$0x20, %rsi
     24a: 75 e4                        	jne	0x230 <sum_n+0x40>
     24c: 66 0f fe c8                  	paddd	%xmm0, %xmm1
     250: 66 0f 70 c1 ee               	pshufd	$0xee, %xmm1, %xmm0
     262: 66 0f 7e c8                  	movd	%xmm1, %eax
     270: 03 04 97                     	addl	(%rdi,%rdx,4), %eax
     279: 75 f5                        	jne	0x270 <sum_n+0x80>
```

 conditions de protection `cmpl $7; ja`Il sera inférieur à 8 fois de la circulation de l'échantillon.`andl $0x7ffffff8`Pour les générations suivantes, le nombre de fois est multiplié par 8 et le nombre de fois par cycle est chargé par 32 caractères.`xmm`累加器, chacun contenant quatre 32 passages, donc l'équation des facteurs en 4 交错因子 en 2 循环,`paddd`Les deux articles`pshufd`、另外两条 `paddd`et `movd`Les 8 passages sont réduits à un nombre entier.`0x270`Le cycle de la part est le traitement du dernier cycle de 0 à 7 éléments.`paddd`读取通道数,统计不同累加器,将步长 `0x20`À l'exception de 4, le rapport`4 lanes x 2 accumulators = 8 elements per iteration`,并以字段形式记录掩码、保护条件、归约和余数循环──Aarch64 用`ldp q2, q3`Les deux articles`add v.4s`- Je suis là.`addv s0, v0.4s`et `fmov w8, s0`完成相同工作──

Le nombre fixe de générations élimine le cycle.`sum4`Il est un homme.`movdqu`La réforme`movd`Il n'y a pas de bord.`poly8`≈ ne peut être quantifié, car chaque roue dépend d'un accumulatrice, et le compteur l'exécutera 8 fois:`%rdi`De la déviation 0 à `0x1c`On a fait 8 fois, chaque fois on a fait 5 fois plus.`acc * 31` Les données relatives aux données de l'identifiant et de l'identifiant`loop unrolled by 8, no back edge`◊ La même charge que l'Arch64`ldp`Il est apparu.

- Je veux le faire .`-fno-vectorize -fno-slp-vectorize`关闭向量化器 后,`sum_n`变为展开八次的标量循环, contenant huit articles `addl k(%rdi,%rdx,4), %eax`et `addq $8`, encore plus de cycles`sum4`则变成四次加法──识别器对前者报告 `unrolled loop`- Je suis là.`copies: 8`et `indexStep: 8`, à l'autre rapport`copies: 4`Il y a une autre.

Le thème de la formation`-O2``total`Dans le cadre de la recherche de deux périphériques, on les appelle deux cycles; cette leçon souligne en outre qu'ils sont le sujet de vecteur et le résidu de la même circulation source.`is_loop()`检查这个条件,因为AArch64 的 `digest` contenant des branches de blocs partagés partagés, elles ne sont pas un cycle, mais la première édition du identifiant l'a considéré comme un cycle de flux

### 变成库调用循环

De `-O1`Je suis là.`LoopIdiomRecognize`La transformation de chaque cycle de la vie en`memset`Il est très important de le faire.`-O2`Je suis là .`fill`Oui `testl %esi, %esi; jle; movl %esi, %edx; xorl %esi, %esi; jmp memset@PLT`◊该调用是带 `R_X86_64_PLT32 memset-0x4`Références de la fonction`retq`Il n'y a que des informations disponibles.`store loop recognized as memset(...)`, et pour vérifier le cycle de source, car le source n'a jamais été directement utilisé `memset`Il y a une autre.

`copy16`Utilisation régulière 16`memcpy`,x86 后端将其内联为 `movups (%rsi), %xmm0; movups %xmm0, (%rdi)`, n' a pas dépassé la moyenne .`memcpy`Le maximum de 8 fois de stockage limité.`-O0`La même façon de faire`movq` utilisation `-fno-builtin`时,调用保留为带 `movl $0x10, %edx``jmp memcpy@PLT`Le dépôt de la commission`fill`Conserver le cycle, le métométiseur le transforme en deux cycles par cycle.`movups`储藏──识别器                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `vectorized store loop: 2 x 16-byte stores = 32 bytes per iteration`Il y a une autre.

## 消失或变成跳转调调用

`tail_caller`Retour`tail_target(x + 1)`Dans le monde entier.`-O0`Ça c'est ça.`addl $0x1, %edi; callq tail_target@PLT; addq $0x10, %rsp; popq %rbp; retq`; dans `-O2`Je ne suis pas là.`incl %edi; jmp tail_target@PLT`◊调用者消失,被调用者直接返回调用者的调用者──Aarch64 上是带 `R_AARCH64_JUMP26``b tail_target` Les identifiants seront utilisés pour la redéfinition des positions `jmp`Ou `b`视为尾调用──第 33 课的递归下降必须将它视为函数出口,因为目标位于 hors de la fonction──

`twice_sum`调用 `leaf_add`Dans le monde entier.`-O0`Il y a une autre .`callq leaf_add@PLT`; de `-O1`Je suis là.`leaf_add`       `leal (%rdi,%rsi), %eax`Je suis là .`twice_sum`Encore une fois, je ne suis plus en train de le faire.`-O0`J'ai une idée de ce que tu veux dire.`optnone`et `noinline`, seulement fonctionner à l'intérieur de la connexion.`twice_sum`- Je suis en train de le faire .`leaf_add`, si vous ne trouvez pas de modification ou de saut final, recherchez la forme de la fonction de l'utilisateur utilisé dans l'interface utilisateur: supprimez les notes et les sources de l'opération utilisateur après l'opération cible.`add w8, w1, w0`能匹配被调用者 `add w0, w1, w0` trouver une correspondance est une preuve

`dispatch`Dans le même temps, on retrouve deux modes: une table de 16 articles, chaque section est en train de changer.`movl %esi, %edi; jmp fN@PLT` Identificateur rapport un commutateur et 16 références,并全部与源码中的 16 références

## 变成 données mobile

`clamp_max`Oui `movl %esi, %eax; cmpl %esi, %edi; cmovgl %edi, %eax` La demande de valeur sera`%edi`命名为 `a`- Je suis là.`%esi`命名为 `b`, enregistrement comparatif, revoir `cmovg`解读为 `a > b ? a : b`, avec la source de code`abs_int`Oui `movl %edi, %eax; negl %eax; cmovsl %edi, %eax`, en français`-x < 0 ? x : -x`- Le code de la loi`cmp w0, #0; cneg w0, w0, mi`, en français`x < 0 ? -x : x`Il y a une autre.`is_pos`Oui `xorl %eax, %eax; testl %edi, %edi; setg %al`, qui est`(x > 0)` Le CCG va transformer ce type en`-fif-conversion`,LLVM est appelé `cmov`选择──LLVM 的 `X86CmovConversion`Le processus de jugement est rentable.`cmov`Ré-transformer le branchement, expliquant également la possibilité de l'apparition d'un nouveau mode de fonctionnement dans le même code source.

Dans le`-O0`Ces modèles n'existent pas.`clamp_max`Il est comparable`jle`Deux fois de stockage et une fois de chargement dans le même trou.`-O0`La réforme des données`-O1`起报告 `branchless select`Le graphique montre ce fait.

`mul9`Il n' y a qu'une seule chose.`leal (%rdi,%rdi,8), %eax`, identifiant rapport `strength reduction`et `x * 9`, parce que le code source est vraiment multiplié par 9.`lea`Il ne faut pas être reconnu comme source de la pratique.

## Les deux types de caractéristiques de renforcement du modèle habituel

 le protecteur est une caractéristique du compilateur, qui reste facilement mal interprétée par le système intelligent.`canary.c`Dans x86-64 Linux 上使用 `-fstack-protector-strong`编译, obtenir:

```text
       7: 64 48 8b 04 25 28 00 00 00   	movq	%fs:0x28, %rax
      10: 48 89 44 24 40               	movq	%rax, 0x40(%rsp)
      26: 64 48 8b 0c 25 28 00 00 00   	movq	%fs:0x28, %rcx
      2f: 48 3b 4c 24 40               	cmpq	0x40(%rsp), %rcx
      34: 75 05                        	jne	0x3b <with_canary+0x3b>
      3b: e8 00 00 00 00               	callq	0x40 <plain_leaf>
		000000000000003c:  R_X86_64_PLT32	__stack_chk_fail-0x4
```

`%fs:0x28`C' est une bonne idée .`tcbhead_t`Le centre`stack_guard`,字节偏移为 40;LLVM 的 `getIRStackGuard`Pour glibc、bionic 和 Fuchsia 指定这个槽──函数序言将保护值复制到缓冲区上方,尾声比较,失败路径调用 `__stack_chk_fail`◊AArch64 Linux 上, protection value de la totalité `__stack_chk_guard`Je suis là.`adrp`et `ldr`取得,失败路径为 `bl __stack_chk_fail` Identificateur rapport de protection source √√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√`plain_leaf`Dans le`strong`Il n'y a pas de canaries, il y a des groupes de protection.`alloca`Ou local variable addresses sont obtenus.`/GS`形式: cookie avec `%rsp`- Je suis pas d'accord.`__security_check_cookie`检查──机器上没有MSVC 链接器,因此这种形态仅根据编译器汇编输出描述──

`-fcf-protection=full`Il va`endbr64`(字节 `f3 0f 1e fa`Pour les processeurs de protection obligatoire du flux de contrôle de support, il est indirectement décomposé; dans d'autres processeurs, il est utilisé comme un traitement.`nop`执行──Ghidra's x86-64 函数起始模式因此包含带 `endbr64`Il y a des gens qui ont des problèmes.`push rbp; mov rbp, rsp`变体──识别器将其报告为 `cet landing pad`, éviter de faire une erreur de calcul de la fonction commençant par quatre caractères inhabituels.

## Les modèles sont pliés

Article 37                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `ruleaction.cc`Il est nommé...`RuleDivOpt`est 将 INT_MULT 与移位形式转为 INT_DIV 或 INT_SDIV,包含形式 `sub( (zext(V)*c), d) >> e => V / (2^n/(c-1)) where n = d*8 + e`, ainsi que l'utilisation `sext`et `s>>`Il y a des changements de caractère.`RuleModOpt`Il s'agit de l'expression de l'expression INT_REM et INT_SREM.`RuleDivTermAdd`处理加法修正,`RuleSignDiv2`Il va`(V + -1*(V s>> 31)) s>> 1`转成 `V s/ 2`- Je suis désolé .`RulePositiveDiv`Le code de référence est le code de référence de la valeur de zéro.`-O1`Je suis là .`grade`De l'extrait, écrit-il.`uVar2 = param_1 / 10 - 6;`, explique le détail a été plié

Il est également possible de voir les entrées de ces règles en utilisant Java.`code/fixtures/idioms-x86_64-O2.lifts.json`- Je l' ai gardé .`div10s`Le code P original: 7 commandes à l'égard de 112 articles, dont 7 sont marqués par chaque ordre.`IMARK`Il y en a parmi eux.`unique[95a00:8] = sext(0x66666667)` après `RAX = RAX * unique[95a00:8]`, ainsi que `RCX = RCX >> unique[d1a00:4]`- Je suis là.`RAX = RAX s>> unique[c5c00:4]`Il y a une autre.`shrq`Avec 41 pièces,`sarq`带 40 个,大多用于计算标志位──`RuleDivOpt`Dans ce courant, le code de correspondance multiplie et double déplace, le code de décode élimine et supprime les signes de lecture.

10.0.3 pour les cours`-O2`目标文件运行, le projet de loi de réforme de l'Union européenne`idioms-x86_64-O2.angr.json`保存 contre compilation de 20 fonctions ⋅ elle se replie sans symbole:`div10u`Pour`return a0 / 10;`; mais non pliant avec une forme symbolique:`div10s`Pour`v1 = a0 * 1717986919; return ((long long)(v1) >> 0x22) + (v1 >> 63);`- Je suis désolé .`mod10s`Pour`a0 - (...) * 2 * 5`Pour moi.`div7u`, il est en sortie .`(a0 / 7 + ((a0 * 6 / 7 & 0xffffffff) >> 1 & 0xffffffff) & 0xffffffff) >> 2`, les modifications sont toujours en forme de calcul.`mul9`Le détail`a0 * 9`- Je suis là.`linear_switch`Pour`(a0 < 7 ? a0 * 10 + 10 : 0xffffffff)`- Je suis là.`clamp_max`Pour`((int)a1 < (int)a0 ? a0 : a1)`- Je suis là.`is_pos`Pour`a0 > 0`- Je suis là.`fill`Pour`return memset(a0, 0, a1);`Il va arriver.`table_switch`输出为不含表值的加载 `*(int *)(4 * a0 + 4195400)`Le dépôt de la commission`sum_n`Utilisation `_mm_add_epi32`et `_mm_shuffle_epi32`Fonction de construction;`tail_caller`Pour`tail_target(); return;`, perdus par le nombre.`digest`Le centre de la page est transformé en`goto *((void *)(...))`,并展开表地址 mathématique

De la source code construite à la recherche de la réserve de radar2 6.2.4 et rizin 0.9.1 également pour le même objectif de la mise en œuvre du radar2`pdc`Il va`div10s`输出为 `rax = rax * 0x66666667; rcx >>>= 0x3f; rax >>= 0x22; eax += ecx`, c' est un faux C de classe de référencement sans pliage;`table_switch`Pour`eax = dword [rcx + rax*4]`, dans le`lea`À l' annexe`RELOC 32 .rodata`注释──rizin 没有内建反编译器;其 `aoi`Il va`imul`Le RzIL est imprimé pour 128 places.`disassemble -n div10s`输出与 `llvm-objdump`Les deux utilisent le même code, et le même code.`ret`- Je suis là.`mode64`Étalement, il ne contient pas de mode habituel. Il ne fonctionne pas ici avec IDA Pro et Binary Ninja. Ses documents décrivent cette phase de réécriture, à savoir le processus de micro-optimisation et de MLIL à HLIL, ce cours ne prétend pas qu'ils se plient spécifiquement.

L'Explorateur de compilation est utilisé pour vérifier correctement.`idioms.c`, choisir comme x86-64 clang 18.1.0 ou ARM64 GCC 14.2.0 de l'article de l'éditeur, réinitialiser les paramètres.`GET /api/compilers/c`返回标识符,`POST /api/compiler/<id>/compile`Matt Godbolt a utilisé le système de calcul de la ligne ACM en 2019 pour démontrer la différence entre le nombre de positions et les conditions de chaîne et la demande. Il a utilisé le système pour obtenir des sorties de CCG impossibles à générer, en passant par la valeur du CCG et la valeur du CCG 12.`-O2`Pour la mesure de l'état de la configuration par défaut, comparer avec le clang dans les appareils.

## La construction de soi

运行演示:

```bash
cd phases/13-tools-and-protocols/39-compiler-idioms-and-optimization
python3 code/main.py
```

输出 est un rapport JSON ⋅ pour chacune des 18 constructions, il énumère chaque fonction et son mode d'utilisation habituel, y compris les catégories ⋅ source code formats ⋅ certificat adresses ⋅ état de validation et détails ⋅ enfin donne chaque construction de catégories matrices ⋅ deux types d'architecture ⋅`-O2`Avec `-O3`Comparer et`unverified`- Je suis en train de faire une liste.

预期结构如下:

```json
{
  "builds": {
    "idioms-x86_64-O2": {
      "arch": "x86_64", "level": "O2", "flags": "x86_64",
      "functions": {
        "div7u": [{"kind": "division", "source": "x / 7", "evidence": ["0x30", "0x32", "0x39", "0x3d", "0x3f", "0x41", "0x43"], "verified": true, "form": "magic multiply with add fix-up", "magic": "0x24924925", "effectiveMagic": "0x124924925", "shift": 35, "...": "..."}],
        "table_switch": [{"kind": "switch", "source": "switch (k) as lookup table", "table": ".rodata+0x28", "entries": 7, "values": [10, 20, 30, 40, 50, 60, 71], "...": "..."}],
        "sum_n": [{"kind": "vector loop", "lanes": 4, "accumulators": 2, "elementsPerIteration": 8, "...": "..."}]
      }
    }
  },
  "kindMatrix": {"idioms-x86_64-O2": {"division": 5, "modulo": 3, "switch": 6, "vector loop": 3, "...": "..."}},
  "sameCodeAtO2AndO3": {"x86_64": {"identical": true}, "arm64": {"identical": false, "differences": ["..."]}},
  "unverified": []
}
```

按以下顺序阅读 `code/main.py`- Le numéro de la liste:

1. `parse_listing()`Les deux types de structures`llvm-objdump -d -r`文本转成函数、指令和附带重定位──
2. `ElfFile`读取节、符号和 `.rela.*`条目,`words()`读取表条目──
3. `magic_numbers()`- Je suis là.`divisor_from_magic()`et `evaluate_division()`Résumé: Le projet de loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de la loi de
4. `parse_source()`Le document de recherche et de formation
5. `Evaluator`Il s'agit d'un processus d'analyse des symboles nommés par bloc.
6. `find_divisions()`et `find_modulos()`匹配乘法、移位、修正、乘回和2 的等形式──
7. `find_switches()`Classe de saut à travers des feuilles, recherche de feuilles, cartographie de ligne, sélection de chaînes, comparaison d'arbres et comparaison de chaînes.
8. `find_vector_loops()`- Je suis là.`find_unrolled_loops()`- Je suis là.`find_tail_calls()`- Je suis là.`find_inlined_calls()`- Je suis là.`find_selects()`- Je suis là.`find_memory_builtins()`- Je suis là.`find_stack_protector()`- Je suis là.`find_cet()`et `find_strength_reduction()`Il y a aussi la réaction de la population.
9. `analyze_function()`按顺序运行这些步骤,将每种模式的结果名称送进下一轮求值器──

Il y a trois ordres.`python3 code/main.py scan FILE.objdump.txt [FUNCTION]`Pour un identifiant de fonctionnement simple, et à côté de chercher les documents cibles et correspondants C 文件.`python3 code/main.py magic DIVISOR [signed]`输出乘数、移位、误差, ainsi que le fait que l'équation existent sur la valeur limite`python3 code/main.py figure-data`输出图示嵌入的数据──

## Utilisez-le

Pour les nouveaux documents objectifs de votre construction, utilisez l'identifiant en suivant l'ordre suivant:

1. De l'objectif de l'enquête `llvm-objdump -d -r`输出,并将准确编译命令一起保存──识别器从清单头读取架构──
2. Pour le nettoyage`scan`, avant de lire `unverified`条目── chaque élément soit la structure du résolveur source, soit la forme de l'identificateur mal lu, il vaut la peine de vérifier l'adresse du résultat.
3. Pour chaque débat`algorithm`Il y a une autre.`clangMatchesAlgorithm`Pour le moment, le compilant a choisi la quantité minimale de déplacement; pour le moment, il est clair que le compilant a encore des raisons de ne pas le faire.
4. Pour chaque commutateur, comparer les différents niveaux d'optimisation.`lowering` la valeur de l'indication de la valeur de l'indication de la valeur de l'indication de la valeur de l'indication de la valeur de l'indication de la valeur de l'indication de la valeur de l'indication de la valeur de l'indication de la valeur de l'indication de la valeur de l'indication de la valeur de l'indication de la valeur de l'indication de la valeur de l'indication de la valeur de l'indication de la valeur de l'indication de la valeur de l'indicateur.
5. Pour chaque cycle`elementsPerIteration`et `scalarRemainderLoop`, réaffirme que les deux parties du rapport du 33e cours sont en phase avec un cycle source.
6. Utilisez un anti-compileur pour traiter le même fichier objectif, en citant son texte à côté de chaque modèle, et en enregistrant les modes qu'il a pliés.

## 交互实验

### 实验 A: Pour le retrouver,

Dans le`code`Pour le démarrage de Python:

```bash
cd phases/13-tools-and-protocols/39-compiler-idioms-and-optimization/code
python3 -q
```

运行:

```python
from main import *
magic_numbers(10), magic_numbers(10, signed=True)
magic_numbers(7), magic_numbers(7, signed=True)
divisor_from_magic(0x66666667, 34, signed=True), divisor_from_magic(0x66666667, 33, signed=True)
```

Première fois avant de le faire, première fois sur papier.`ceil(2^35 / 10)`Alors, c'est tout.`idioms.c`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `unsigned div13(unsigned x) { return x / 13; }`, utilisez `build_fixtures.sh`Les ordres du milieu`-O2`构建,将清单中的常量与 `magic_numbers(13)`Pour le contrôle.

### 实验 B:表与树

```python
listing = load_listing("idioms-x86_64-O2.objdump.txt")
elf = load_elf("idioms-x86_64-O2.o")
sources = load_source("idioms.c")
[i.to_dict() for i in analyze_function(listing, "table_switch", elf, sources)]
[i.to_dict() for i in analyze_function(listing, "sparse_switch", elf, sources)]
elf.words(".rodata", 0x28, 7)
```

Dans le`table_switch`Le deuxième tome`71`改回 `70`, en`-O2`Réglage, observe la mise en ligne en cartographie.`ArrayKind`Le tableau

### 实验 C: trois cycles de mise en place

```python
for name in ("idioms-x86_64-O1", "idioms-x86_64-O2", "idioms-x86_64-novec-O2"):
    print(name, [i.source for i in analyze_function(load_listing(name + ".objdump.txt"), "sum_n", load_elf(name + ".o"), sources)])
```

                   `-O2`Je suis là .`sum_n`Les données de contrôle des flux, des conditions de protection, des masques, des objets de vecteurs, des cycles de régulation et de résidu, des cycles de rééquilibrage et de rééquilibrage`detail`字段比较──

### 实验 D: commerce commun

```python
for name in ("idioms-x86_64-O1", "idioms-arm64-O1"):
    print([(i.kind, i.source, i.detail.get("sharedQuotient")) for i in analyze_function(load_listing(name + ".objdump.txt"), "digest", load_elf(name + ".o"), sources)])
```

阅读 `digest``-O1`清单, trouver x86-64 上将商与符号修正合并的两条指令,再解释为什么AArch64 构建只需要一条──

## 实践实验

Dans le même temps, les techniques de calcul de la taille des données sont également utilisées.

要求:

- Utilisation de la fonction de construction et de déplacement ou de la rotation des opérations du CCG, édition `popcount`- Je suis là.`ctz`- Je suis là.`rotl`函数, dans `-O2`Je suis en train de faire une petite partie de la vie.`-mpopcnt -mbmi` Construire, présenter les objectifs et les documents de liste 
- 识别 `TargetLowering::expandCTPOP`               `0x55555555`- Je suis là.`0x33333333`- Je suis là.`0x0f0f0f0f`- Je suis là.`0x01010101`位数序列, rapport pour `popcount`,并以四常量作为证据──
- Il va`rep bsfl`识别为`tzcnt`Ou `bsf`Le code, le directeur`roll %cl`识别为旋转,并将两者解码回内建函数──
- Dans le`parse_source()`验证中加入新类别, faire `popcount` Mode seulement dans le code source `__builtin_popcount`时才被验证──
- Pour chaque modèle, ajoutez un test de la quantité constante de l'équipement.

Les critères de réussite:`python3 code/main.py`Dans les deux constructions, trois nouvelles catégories seront reportées.`verified: true`,测试套件 encore rapporté`unverified`- Je suis en train de faire une liste.

## Le produit

本课包含 `outputs/skill-compiler-idioms-and-optimization.md` Il utilise des documents cibles et leur source pour être transformés en rapports de mode habituel de validation, ainsi que des comparateurs de compilateurs.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/39-compiler-idioms-and-optimization
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明:

- 清单解析器 `-O2`目标文件读取 25 个函数,保留字节,并将 `R_X86_64_PC32 .rodata+0x24`- Je suis là.`table_switch`Le centre`leaq`
- ELF 读取器 `.rodata+0x28`Retour`[10, 20, 30, 40, 50, 60, 71]`,并读取 `.rela.rodata`Le défi de la réforme
- `magic_numbers`返回移位 35 的 `0xcccccccd`、移位 34                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `0x66666667`、移位 35 且带加法形式的 `0x124924925`、移位 32                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `0x55555556`, ainsi que des déplacements de 33 `0xaaaaaaab`
- Pour chaque débit de 2 à 64 n'est pas de 2, qu'il y ait un symbole ou pas, l'équation est établie sur la valeur limite de 32 points.
- `divisor_from_magic`Paramètres à récupérer 10 5, 7, 3, et refuser d'erreur de couplage
- 加法修正序列                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `n // 7`
- Quatre x86-64 Définition du rapport correctement multiples, déplacements, définitions et formes, quatre AArch64 Définition du code`mov`et `movk`
- `-O0`Utilisation `divl`et `idivl`- Je suis désolé .`-O0 -fast-isel=false`Utilisation de la méthode`-O0``digest`混合两者
- 取模可识别为乘回`msub`Je suis là.`sdiv` `mul` `subs`, ainsi que des appareils`idivl`
- Compagnie commerciale`-O1`Suivant la loi et l'exemple
- 两种架构在 `-O2`Les cinq modes de réduction suivants sont classés, comprenant les formules, les valeurs, les objectifs, les axes et les expressions de choix
- `-O0`Le commutateur de basse est dans la barre x86-64 et le commutateur de basse est dans la chaîne de comparaison de l'Aarch64.
- x86-64 `digest`commutation selon le tableau de saut, facteur de pliage de 16 à la recherche du tableau de saut de quatre objectifs différents; AArch64
- `-fno-jump-tables`Les arbres sont des arbres.`dispatch`Dans x86-64 上从重定位读取目标, dans AArch64 上从缩写节表读取
- Rapport de cycle de la quantité 4 通道、2 累加器、 8 éléments par tour, ainsi que le masquerode、 protection conditions、 regroupement et cycle des restes
- Le cycle fixe des générations est totalement quantifié ou complètement déployé,`-fno-vectorize`按 8 次展开
- `-O1`没有向量化;x86-64 上 `-O2`Avec `-O3`À l'Arch64`call_switch`Il y a des différences.`-O3`Il y a 17 ordres.`-O2`Il y a 18 articles
- `-fno-builtin`Le cycle de stockage se transforme en cycle de stockage quantifié, et se`memcpy`Réservation
- 尾调用`memset`替换、内联 16 字节复制, ainsi que `-O0`Les deux copies mobiles sont reconnues
- De `-O1`起能根据函数体形态找到内联的被调用者
- 选择表达式解码为 `a > b ? a : b`- Je suis là.`-x < 0 ? x : -x`- Je suis là.`(x > 0)`et `sum % 10 < 5 ? sum % 10 : 5`
-  rapport du protecteur `%fs:0x28`Les réservoirs et les réservoirs`__stack_chk_fail`,CET  Chaque fonction de la construction est rapportée `endbr64`
- 源码解析器读取函数指针参数、开关 分支、调用和累加器名称
- Chaque modèle de construction est vérifié, correspondant aux catégories de matrices.
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

## Mode de défaillance dans l'environnement de production

| 失败 | 不严谨的工具报告 | 分析必须证明什么 |
|---|---|---|
| 乘以很大的奇数常量 | “乘以 1717986919” | 常量是某个 `d` 对应的 `ceil(2^s / d)`，误差满足界限，移位量是最小有效值 |
| 右移 32 位后的加法修正 | 五条算术指令 | 乘数为 33 位，尾部是同一方法的加法形式 |
| 相同乘数、不同移位 | 相同除数 | 移位决定除数：34 对应 10，33 对应 5 |
| 对 2 的幂有符号取模 | “加 7、掩码、相减” | 偏置使舍入向零，结果为 `x % 8` |
| 从 `.rodata` 索引加载 | “跳转表” | 它是值查找表，条目从加数加 4 处的字节读取 |
| 仿射算术加 `cmov` | “计算 10k + 10” | 这是降低为线性映射的 switch，并与每个源码分支验证 |
| 按序分割的比较链 | “一串 if” | 对分支常量的二分查找，并明确枢轴 |
| 向后分支到默认块 | “循环” | 目标通过无条件跳转离开区域，属于共享尾部 |
| 一个函数中两条回边 | “两个循环” | 一个源码循环的向量主体及其标量余数部分 |
| `jmp memset@PLT` 没有 `ret` | “函数没有返回” | 尾调用通过被调用者返回，替代了存储循环 |
| 调用图缺少被调用者 | “从未调用” | 已内联：调用者中出现被调用者的函数体形态 |
| `%fs:0x28` 加载和比较 | “读取线程局部数据” | 栈保护 canary，失败路径指向 `__stack_chk_fail` |
| 函数起始四个奇怪字节 | “函数前的数据” | `endbr64`，即 CET 落点 |
| 反编译器展示原始算术 | “工具错了” | 工具没有应用折叠；推导给出源码形式，引用输出记录差距 |

## 操作准则

匹配形态,反向执行推导,写出能证明它的常量──为每种模式报告证据地址和编码出发源码形式,对照自己编译的源码逐一验证,并引用每个反编译器对同一字节输出内容──

## 延伸阅读

- [Granlund, Montgomery, "Division by Invariant Integers using Multiplication" (PLDI 1994)](https://gmplib.org/~tege/divcnst-pldi94.pdf)
- [Warren, Hacker's Delight, 2nd edition, Chapter 10: Integer Division By Constants](https://www.informit.com/store/hackers-delight-9780321842688)
- [Lemire, Kaser, Kurz, "Faster Remainder by Direct Computation" (2019)](https://arxiv.org/abs/1902.01961)
- [libdivide, header-only division by runtime constants](https://github.com/ridiculousfish/libdivide)
- [LLVM `DivisionByConstantInfo.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Support/DivisionByConstantInfo.cpp)
- [LLVM `SwitchLoweringUtils.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/CodeGen/SwitchLoweringUtils.cpp)et [`TargetLoweringBase.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/CodeGen/TargetLoweringBase.cpp)
- [LLVM `SimplifyCFG.cpp`, `simplifySwitchLookup`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Transforms/Utils/SimplifyCFG.cpp)
- [LLVM Auto-Vectorization documentation](https://llvm.org/docs/Vectorizers.html)et [LLVM 3.4 release notes](https://releases.llvm.org/3.4/docs/ReleaseNotes.html)
- [LLVM `LoopIdiomRecognize.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Transforms/Scalar/LoopIdiomRecognize.cpp)
- [LLVM `X86CmovConversion.cpp`](https://github.com/llvm/llvm-project/blob/release/20.x/llvm/lib/Target/X86/X86CmovConversion.cpp)
- [LLVM `StackProtector.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/CodeGen/StackProtector.cpp)et [`X86ISelLoweringCall.cpp`, `getIRStackGuard`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Target/X86/X86ISelLoweringCall.cpp)
- [glibc `sysdeps/x86_64/nptl/tls.h`, `tcbhead_t`](https://sourceware.org/git/?p=glibc.git;a=blob;f=sysdeps/x86_64/nptl/tls.h)
- [GCC `tree-switch-conversion.cc`](https://github.com/gcc-mirror/gcc/blob/master/gcc/tree-switch-conversion.cc)- Je suis là .[GCC Optimize Options](https://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html), et [GCC 12 release notes](https://gcc.gnu.org/gcc-12/changes.html)
- [Ghidra decompiler `ruleaction.cc`](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/Decompiler/src/decompile/cpp/ruleaction.cc)
- [angr decompiler documentation](https://docs.angr.io/en/latest/analyses/decompiler.html)
- [radare2 book: decompilers](https://book.rada.re/arch/decompile.html)
- [Compiler Explorer API](https://github.com/compiler-explorer/compiler-explorer/blob/main/docs/API.md)
- [Godbolt, "Optimizations in C++ Compilers: A practical journey", ACM Queue 17(5), 2019](https://queue.acm.org/detail.cfm?id=3372264)
- [Microsoft, `/GS` (Buffer Security Check)](https://learn.microsoft.com/en-us/cpp/build/reference/gs-buffer-security-check)
