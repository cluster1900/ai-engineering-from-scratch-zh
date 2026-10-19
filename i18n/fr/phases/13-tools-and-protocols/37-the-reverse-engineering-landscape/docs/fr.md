# 逆向工程全景:历史、工具家族与反编译器的构建方式

> 五种工具读一文件,但给出四种地址,三种基本块计数,以及两种答案,为一个交换.

**Type:** Build
**Languages:** Python, C, x86-64 汇编, Java（一个 Ghidra 脚本）
**Prerequisites:** Phase 13 · 32（从零构建 ELF）, Phase 13 · 33（反汇编与控制流）, Phase 13 · 34（提升为伪代码）
**Time:** ~150 分钟

## Objectif de l'apprentissage

- Leur rôle principal est de mettre en place des périodes de temps de 1973 à 2026 et de décrire leurs familles.
- Il y a aussi les 8 étapes de l'opération de compilation, ainsi que les termes utilisés pour chaque étape.
- Il a été créé par le gouvernement de la République de Suède pour la première fois en 1934.
- Rassembler les adresses des cinq outils en une seule.`.text`偏移, et à vérifier cette régulation sur une fonction.
- 构建读取已采集工具输出对比框架, rapport instruction start point、基本块、边和函数 start point 
- Selon les preuves obtenues, chaque outil est utilisé pour fabriquer des codes, éliminer des codes ou arrêter de sauter indirectement.

##  problématique

Vous demandez un agent 总结三种逆向工程工具对 `ledger-x86_64-O1.o`- Je suis là .`grade`Les résultats de l'analyse ≈ agent ≈ fonctionnement de chaque outil, lecture ≈ trois listes, et rapport ≈ fonction dans un outil situé ≈`0x08000050`, une autre est située`0x400010`, 3°° dans le centre`0x100010`Il est donc clair que les différents outils ont des différences sur la position des fonctions.

En fait, les conclusions de l'outil sont conformes. Le fichier objectif peut être redépositionné, sans adresse de chargement, de sorte que chaque type d'outil choisira lui-même un adresse.`.text`Après l'adresse, toutes les réponses sont `0x10`◊ agent comparé l'adresse originale, car il n'y a aucune information qui lui indique l'importance de ces adresses dans chaque outil.

Puis, avec un agent.`-O0`构建中 `grade`Les quatre chiffres sont vrais. Un outil est en train de s'arrêter.`jmp rax`◊ Deux types d'outils à travers la réposition ◊ un outil pour placer des balises et décomposer les blocs de base dans le balisage ◊ un nombre de blocs de base qui ne s'explique pas, mais qui ne contient pas de chiffres précises ◊

Dans la seconde moitié de la série, vous devez connaître l'histoire du domaine, les outils appartenant à la famille, les flux d'exécution de chaque contre-compileur, ainsi qu'un ensemble de cadres permettant de comparer les conclusions des outils sur les documents objectifs que vous compilerez vous-même.

```figure
re-37-field-map
```

## Uzd日期串起五十三年

Ce domaine est plus ancien que la plupart des outils.

### 1973 à 1991: premier avec un référent, puis avec un référent

Le premier article de la première année de la rédaction est paru en 1973, rédigé par Hollander et Housel de l'Université Stanford et publié par le Harvard University.`adb`Le programme, le programme et le programme de développement de l'UNIX V7 ont été publiés en 1979 par Tim Paterson.`DEBUG`Inté 8086 反汇编器, avec PC-DOS 1.00 de août 1981 发布──Richard Stallman's GDB 于 1986开始分发──SoftICE 于 1987将内核调试器带到DOS 下──

Le système de communication V a été lancé en 1988 sous la forme de Sourcer pour le processus DOS, générant une liste de données et de notes.`objdump`Ilfak Guilfanov a écrit la première ligne du code de l'IDA en janvier 1991 et a publié l'IDA 0.1 en tant que logiciel de partage en mai 1991.

### 1991 à 2009: interaction entre les rédacteurs et les rédacteurs

Cristina Cifuentes est née en 1994 en 7 mois en QUT 完成Reverse Compilation Techniques──她的反编译器 `dcc`Elle a publié un article en 1995 et a établi la phase suivante de l'utilisation de tous les anticompilators.

IDA est né en 1996 dans DataRescue  devenir un produit commercial, 1999 a rejoint le SDK, puis est devenu le Hex-Rays de 2005  Hex-Rays Decompiler 1.0  est sorti en 2007  17 septembre 2007  La même année, Mike Van Emmerik  a soumis  Static Single Assignment for Decompilation, cet article de niveau  SSA  静态单赋) est placé au cœur du flux de données de l'antécran  Halvar Flake  Comparison structurelle d'objets exécutables  2004  Open Difference Comparison Tool Families, BinDiff  a commencé à vendre en août 2004

Radar a été lancé en 2006 en 2 mois, et a été lancé pour la première fois en 2009 en utilisant la version modulaire de LGPL-3.0.

### 2009 à 2019: cadre et intermédiaire

LLDB est devenu un projet LLVM en 2010 et a été annoncé en 2010 par le groupe BAP en utilisant le BIL. Le 1er mars 2011 Google a acheté le développeur de BinDiff.

Le premier code de la ligne angr a été écrit en 2013 8 月。Phoenix 论文(Schwartz、Lee、Woo、Brumley,USENIX Security 2013) a montré une méthode structurée pour maintenir le langage, en conservant 40 articles parmi 8 676 fonctions `goto`语句──DREAM(Yakdan 等,NDSS 2015) par le biais de la structuration du mode non dépendant a éliminé ces `goto`语句。Vector 35 a été lancé en janvier 2015 14 日成立,Binary Ninja a commencé à vendre en juillet 2016 23 日,带有低级IL 和 Python API。angr 于 2015年公开发布, et a été classé troisième dans le DARPA Cyber Grand Challenge en août 2016。BinDiff a été modifié en mars 2016 pour gratuitement。Cutter 1.0 a été lancé en décembre 2017 为 radare2 提供Qt GUI。2018年, Guilfanov 在 Recon 发表Decompiler internals: microcode,首次公开介绍 Hex-Rays IR。

### 2019 à 2026: ouverture à l'écriture et à la recherche

NSA a publié Ghidra 9.0 en mars 2019 à la conférence RSA avec la licence Apache-2.0 un mois plus tard sur GitHub publié le code source complet.

BinDiff 8 est devenu un structurateur en anglais par défaut en 2023 avec Apache-2.0 开源;; SAILR, USENIX Security 2024)`goto`语句,因为 Linux 6.1 源码中原本就有3,754条──Binary Ninja 4.0 于 2024 年 2 月加入免费版,IDA 9.0 则加入用于无界面运行`idalib`◊ apprendre式反编译器论文 de SLaDe(2023) développer à LLM4Decompile(2024) ‧DecompileBench(2025), ainsi que de deux études de 2026 à la suite de laquelle l'agent de discussion 助助的可读性, ainsi que la réussite de la recompagnée ont été plus nombreuses, mais la réserve de mots reste moins grande.

La version actuelle de cette formation est jusqu'à la date du 14 octobre 2026. La version actuelle est Ghidra 12.1.4 ↓ Ghidra 12.1.4 ↓ Ghidra 12.1.4 ↓ Ghidra 12.1.4 ↓ Ghidra 12.1.4 ↓ Ghidra 12.1.4 ↓ Ghidra 12.1.4 ↓ Ghidra 12.1.4 ↓ Ghidra 12.1.4 ↓ Ghidra 12.1.4 ↓ Ghidra 12.1.4 ↓ Ghidra 12.1.4 ↓ Ghidra 12.1.4 ↓ Ghidra 12.1.4 ↓ Ghidra 12.1.4 ↓ Ghidra 12.1.4 ↓ Ghidra 12.1.4 ↓ Ghidra 12.1.4 ↓ Ghidra 12.1.4 ↓ Ghidra 12.1.4 ↓ Ghidra 12.1.4 ↓ Ghidra 12.1.4 ↓ Ghidra 12.1.4.

## 工具家族

Les outils par catégorie de production. Le même processus peut traverser plusieurs familles, et cette superposition est la source de la plupart des confusions.

### Rédacteur en chef

L'analyse de la ligne depuis le premier caractère de la section de code a été déchiffrée jusqu'au dernier caractère.`objdump -d`et `llvm-objdump -d`Tout est comme ça, et tout ne construit pas de contrôle de flux.`objdump`Pour les utilisateurs, il est possible de créer des outils de commande en utilisant la GPL 3.0 ou une version ultérieure.`llvm-objdump`显示为Apple LLVM version 17.0.0,本课采集的就是这个版本──

交互式反汇编器 de l'entrée connue pour effectuer un retour et un déclin, rejoindre les règles de démarrage de la fonction de démarrage de la fonction d'identification,并维护数据库──IDA Pro(processor模块、自动分析队列、FLIRT 签名)、Ghidra(`Disassembler`À la suite de l'analyse, les utilisateurs ont pu trouver des solutions de résistance.`aa`- Je suis là.`aaa`- Je suis là.`af`En 2016, l'USENIX Security 2016 a mesuré neuf des deux types de documents générés par un compilateur. Le taux de précision des instructions est proche de 100%, tandis que la tâche de base difficile est la reconnaissance des points de départ de la fonction, dont le taux de négativité atteint 20% ou plus.

### Rédacteur en chef

商业反编译器包括:Hex-Rays Decompiler(from x86 to RISC-V's十二种目标家族) 、Binary Ninja's HLIL 及其 Pseudo C 染, ainsi que Hopper's pseudocode视图。开放反编译器包括:Ghidra 反编译器, c'est-à-dire en utilisant le moteur C++ d'Apache-2.0,r2ghidra 和 rz-ghidra pour en faire une mise en œuvre,pypcode et js pour en faire une mise en œuvre; basé sur AIL、 utiliser SAILR 结构化、 BSD-2-Clause angr 反dec编译器; utiliser JavaScript 编写的 r2 和 和 和 和作为历史的代表的Boomerang`dcc`Radar 2 encore en place`pdc`,即用类 C 语法表示的伪反汇编输出──rizin 没有内置反编译器──rizin 0.9.1 中不存在 `pdc`- Je vous en prie.`pdg`Il faut une aide.

### 调试器

Il s'agit notamment de la mise en place d'un système de débogage de temps de voyage en temps réel (GDB) en 1986 et de la mise en place de l'équipement de débogage de temps réel (GDB) en 2017) et de la mise en place d'un système de débogage de temps réel (OllyDbg) en 2014.

### Deuxième cadre d'analyse

- le nombre de personnes concernées`CFGFast`et `CFGEmulated`、反编译器) 、BAP(BIL、OCaml) 、Dyninst、Jakstab 和 ByteWeight 是 Andriesse 提到的框架──Ghidra 可通过Pyghidra 作为库使用,Binary Ninja 通过`import binaryninja`,IDA  par le`idalib`Il y a une autre.

### 格式库与引擎库

LIEF 1.0.0(2026 année 7 月 12 日,Apache-2.0)解析 ELF、PE、Mach-O、COFF 和 Android 格式。CLE,即CLE Loads Everything,是angr的加载器。Capstone 5.0.9(2026 année 5 月 28 日,BSD-3-Clause) responsable de la mise en œuvre;Keystone 0.9.2(GPL-2.0) responsable de la mise en œuvre;Unicorn 2.1.4(GPL-2.0) responsable de la simulation ▌radar2 6.2.4 捆绑 Capstone 5,rizin 0.9.1 附随 Capstone、Zydis 和 tree-sitter。

### différence comparer les outils et les rédacteurs

Comprend BinDiff 8(Apache-2.0) et ses utilisations dans IDA Pro、Binary Ninja 和 Ghidra; ainsi que dans le Diaphora 3.4.3 ((2026 年 10 月 11 日,AGPL-3.0); ainsi que dans le`radiff2`et `rz-diff` Compileur Explorer (BSD-2-Clause) affiche le code généré par le compilateur, en fonction de son orientation et de la réaction des autres outils de la liste.

### 版本、 permis et outils de mise en œuvre réelle de ce cours

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

La version gratuite de Binary Ninja est seulement contre la version x86、x86-64、ARMv7 和 AArch64, sans API。IDA`idalib`, its anti-compilator in cloud-end running. This les deux outils sont tous cités dans leurs documents et les instructions de distribution, dans le tableau, il est également marqué non-exécution.

## 逐阶段查看反编译器流水线

Cifuentes a classé en 1994 ces étapes: analyse de langage, analyse de langage, génération de code intermédiaire, génération de flux de contrôle, analyse de flux de données, analyse de flux de contrôle et génération de code. Elle les a classées en deux étapes: les étapes intermédiaires liées aux machines, aux machines et aux langues, ainsi qu'aux étapes intermédiaires liées aux langues. Chaque système de rédaction ultérieur a conservé cette forme, en changeant simplement le nom de chaque partie.

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

### Le chargement

Le contenu du fichier objectif est encore vide, le chargeur choisit donc lui-même le fichier radar2 et rizin.`0x08000000`,使 `.text`      `0x08000040`Parce que cette partie est déménagée du dossier.`0x40`Je vais commencer.`.text`- Je suis là.`0x400000`Ghidra `ElfLoader`Je vais le laisser.`0x100000`Il y a une autre.`llvm-objdump`打印节内偏移,完全不使用基址──

Radar 2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `bin.relocs.apply=true`Comment le chargement traite le redéploiement, décide ce que vous verrez dans les étapes suivantes.`-O0`跳转表中看到其影响──

### Réponse

Le thème de la formation est la formation de deux méthodes.`llvm-objdump`Pour chaque type d'outil, il faut revenir à la suite, puis ajouter une fonction de démarrage.`CFGFast`文档列出函数起点的四个来源:符号、函数序言扫描、调用目标,以及对剩余字节的完整扫描──最后一个来源正是在填充区的模拟函数的原因──

### CFG 恢复

Les outils sont divisés en blocs de base selon la méthode de la 33e classe, mais il y a une différence que vous allez mesurer personnellement.`call`Il s'agit d'un bloc de base, car son IRSB est un seul bloc de base d'entrée, de plusieurs exportations, dont la réutilisation appartient à l'exportation.`grade``-O0`版 `grade_label`Le rapport de la première année de l'année a été publié en décembre.

### 提升

Le Ninja binaire sera amélioré pour se définir comme étant traduit de la langue de bas niveau à la langue de milieu de haut niveau. Les utilisations de chaque IR sont différentes.`MMAT_GENERATED`À la`MMAT_LVARS`Le niveau de maturité de la Ninja binary est le même que celui de la Ninja binary. Il est le premier à être élevé à l'IL.

### SSA

Le thème de Van Emmerik est la capacité de l'ASS à l'encontre de l'interprète: l'expression de la propagation, sans besoin d'ABI, les paramètres de la hypothèse et de la valeur de retour identification, l'analyse de la réserve, l'analyse de type des problèmes de flux de données rares, ainsi que l'analyse de saut et de modification indirects.`Heritage`,并加入                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `MULTIEQUAL`et les effets secondaires`INDIRECT`Ninja binaire dans chaque niveau de l'I.L. exposé à la SSA`Clinic`Il y a deux étapes de SSA: Hex-Rays n'est pas nommé sous la forme de SSA, mais utilise la méthode de déformation des données.

### Les données et les types

Ghidra 的主简化循环不断执行Eliminate Dead CodePropagate Local Types和Perform Term Rewriting, jusqu'à ce qu'il ne change plus, dont la réécriture par `Rule`Pour l'ex-ray 转换微代码,在 `MMAT_CALLS`检测调用实参, dans `MMAT_LVARS`Répartition des évolutions de la situation.`CallingConventionAnalysis`- Je suis là.`VariableRecoveryFast`et `Typehoon`, qui a réalisé Noonan、Loginov 和 Cok's多态类型推断──第41 课讨论这个阶段──

###  Structuration

Ghidra `CollapseStructure`搜索匹配某种结构的子图,将其折叠为一个节点;遇到无法继续的情况,删除一条边并标记为非结构化──Hex-Rays将CFG归约为`if`- Je suis là.`while`- Je suis là.`do`et `switch`, le reste est réservé à la zone ▌angr 识别单入口、单出口区域,默认使用 `SAILRStructurer` structurée, également choisie `PhoenixStructurer`et `DreamStructurer`◊第 34 课手写过一个结构化器──

### 输出

Ghidra est là .`ActionNameVars`et `ActionSetCasts`Après, par le biais.`PrintC`配合 Oppen 美化打印机输出 C token──Hex-Rays 美化并打印 ctree──Binary Ninja va HLIL 染为 Pseudo C、Pseudo Rust 或 Pseudo Python──angr 返回`codegen.text`Radar2 打印 `pdc`- Je suis là.`pdd`Ou `pdg`Il y a une autre.

## Les quatre types d'IR

取 `48 83 ec 10`, qui est`subq $0x10, %rsp`◊ Utilisation du paragraphe 33 de la règle de la classe en papier

1. `48`Oui `W = 1`Le nombre d'opérations est de 64 places.
2. `83`Il est le premier numéro de la série de modrms.
3. `ec` ModRM`11 101 100`Il y a une autre.`mod = 11`Prononcer le nom de l'établissement`reg = 101`Oui `/5`, qui est`sub`Il y a une autre.`r/m = 100`Oui `%rsp`Il y a une autre.
4. `10`Il est un nombre instantané, la valeur est de 16

Ces quatre caractères sont donnés à quatre élèves.

ESIL de radar2 6.2.4 est contenu dans 30 symboles de logements séparés:

```text
16,0x8000000000000000,-,!,16,rsp,-=,63,$o,^,of,:=,63,$s,sf,:=,$z,zf,:=,$p,pf,:=,64,$b,cf,:=,4,$b,af,:=
```

C'est une machine.`16,rsp,-=`Orig地执行减法──, puis, chaque marque est inscrite par l'opérateur interne:`$o`Pour la première fois,`$s`Pour les autres`$z`Indiquer zéro,`$p`Je veux dire,`$b`Pour les autres pays

RZIL de rizin 0.9.1 est un contenant de 14 `set`效果的 S expression:

```text
(seq (set op1 (var rsp)) (set op2 (bv 64 0x10)) (set sub (- (var op1) (var op2))) (set rsp (var sub))
     (set _result (var sub)) (set pf (! (lsb (let _val (cast 8 false (var _result)) ...))))
     (set zf (is_zero (var _result))) (set sf (msb (var _result))) ... (set cf (|| ...)) (set of (|| ...)) (set af (|| ...)))
```

Chaque marque est une expression de la valeur de la marque.`let`Il y a une autre.

通过pypcode 4.0.1 从SLEIGH 规范 `x86:LE:64:default`Codes de P, en`IMARK`Il y a neuf opérations:

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

C'est un groupe de références temporaires.`unique`空间──标志位在命令处立即计算,并且 `CF`et `OF`Dans le cadre de la loi`RSP`Il est déjà calculé.

pyvex 10.0.3 生成的 VEX 在 `IMark`Il y a sept articles de la phrase:

```text
t2 = GET:I64(offset=48)
t0 = Sub64(t2,0x0000000000000010)
PUT(offset=144) = 0x0000000000000008
PUT(offset=152) = t2
PUT(offset=160) = 0x0000000000000010
PUT(offset=168) = 0x0000000000000000
PUT(offset=48) = t0
```

Il n'y a pas de place de signalisation.`rsp`◊ déplacement 144 à 168 分别为 `cc_op`- Je suis là.`cc_dep1`- Je suis là.`cc_dep2`et `cc_ndep` le code d'exploitation de stockage de l'élévateur 8, c'est-à-dire 64 bits de réduction, ainsi que deux numéros d'exploitation.`pcode.writesFlags`Pour vrai`vex.computesFlags`Pour la raison de faux, c'est aussi la raison la plus courte de VEX.

Il sera également utilisé quatre élèveurs.`48 63 c7`, qui est`movslq %edi, %rax`(le secteur de l'énergie)`-O1`Je suis là .`grade`Je suis en train de faire une première mise en garde.`32,edi,~,rax,=`) 、1 个 RzIL `set`、1 个 P-code 操作`RAX = sext(EDI)`Il n'y a pas d'élévateur pour écrire un lieu de référence, car cet ordre lui-même ne concerne pas un lieu de référence.`(register, 0x0, 8) INT_SEXT (register, 0x38, 4)`:寄存器偏移 0 est `RAX`, par déplacement`0x38`Oui `RDI`, en gros, pour 8 et 4 caractères.

`grade`边界检查中的 `83 f9 04`, qui est`cmpl $0x4, %ecx`, produisent 30 jetons ESIL 13 RzIL`set`效果、10 个 P-code 操作, ainsi que 7 条 VEX 语句, les derniers `cc_op`Pour 7, il s'agit de 32 bits de réduction.`%ecx`◊ Les deux types de réduction de largeur que vous rencontrerez dans VEX sont numérotés en 32 bits pour 7,64 bits pour 8; le traducteur que vous construisez conservera ce tableau―

## Quatre types d'adresse de fonction

Avant de commencer à comparer, il doit d'abord unifier la définition de la position de la fonction.`ledger-x86_64-O1.o`Le centre`grade`Je pense à une fois.

| 工具 | `.text` 地址 | `grade` 地址 | 偏移 |
|---|---|---|---|
| `llvm-objdump` | `0x0` | `0x10` | `0x10 - 0x0 = 0x10` |
| radare2, rizin | `0x08000040` | `0x08000050` | `0x08000050 - 0x08000040 = 0x10` |
| angr | `0x400000` | `0x400010` | `0x400010 - 0x400000 = 0x10` |
| Ghidra | `0x100000` | `0x100010` | `0x100010 - 0x100000 = 0x10` |

Le code de la carte`grade`      `.text + 0x10`, en gros pour 46,.. après avoir perdu le site, tous les outils sont en accord,..`iSj`、r 采集结果的 、r 采集结果的 、r 采集结果的 、r 采集结果的 、r 采集结果的 、r 采集结果的 、 采集结果的 、 采集结果的 、 采集结果的 、 采集结果的 、 采集结果的 、 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果的 采集结果`.text`节条目、Ghidra 采集结果的 `.text`Les données de l'analyse de l'analyse de l'échantillon sont en train de se dérouler.`test_every_tool_places_grade_at_offset_0x10_from_its_own_base`Ce fait est confirmé.

## 工具在哪里一致,在哪里分歧

`code/main.py`Le cadre de lecture des résultats de l'enquête, de la révision de chaque adresse, de la réévaluation et de la comparaison.

### Unité de cas: - O1 Le registre des comptes

Il y a 56 instructions dans quatre fonctions, dans une analyse de ligne, dont 54 dans le cadre des symboles, 2 dans la zone de remplissage. Chaque outil rapporte les mêmes instructions dans chaque fonction.`total`Les cinq blocs et les cinq rayons sont les 33e.

唯一差异在填充区──函数之间的 3 个字节(`grade`后的 `66 90`- Je suis là.`total`后的 `90`) a été déchiffré par un scan de ligne, car il n'y a aucune raison de s'arrêter; il les a aussi déchiffrés, et a créé des symboles sans`sub_40003e`et `sub_40005f`                                                                                                                                                                                                                                                              

### Pour les cas de quantification: - O2

Dans quatre types de constructeurs,`total`Il s'agit d'un cycle SSE2 de la section 33 et d'un cycle de traitement des éléments restants, en utilisant la même méthode de séparation entre les différents outils.

### 跳转表:-O0 下的分

Il y a des divisions dans cet outil, et les divisions sont elles-mêmes l'essence de ce cours.

| 工具 | 基本块 | 边 | 采集结果的说明 |
|---|---|---|---|
| radare2 | 3 | 2 | `0x62` 处的块没有后继；从未到达 `0x76` 至 `0x9a` 的字节；缺少 8 个指令起点 |
| rizin | 8 | 11 | `0x62` 处的块带有 `switch_op`，其中有 5 个 case 和 4 个不同目标 |
| angr | 8 | 7 | case 块存在，`0x62` 处的控制转移指向一个无法解析的目标节点 |
| Ghidra | 9 | 12 | `0x74` 处的 `switchD` 标签拆分了块；四条 `COMPUTED_JUMP` 流分别指向 `0x76`、`0x7f`、`0x88`、`0x91` |

Pour atteindre la position correspondante, les quatre outils de déchiffrement sont tous les mêmes.`jmp rax`, laissé sous 36 caractères inconnus, le cadre va être marqué par des code omissions.`.rela.rodata`Les objectifs de la formation sont les suivants:`grade`Dans le cas des blocs, il n'y a toujours pas de saut de blocs vers leur côté; le résultat de leur collecte sera`0x62`处的转移记录为指向无法解析的目标节,反编译器则打印计算式 `goto`Pour le même flux de contrôle, Ghidra est plus rize qu'un bloc et une ligne, car son commutateur est analysé.`jmp rax`Le modèle de bloc de base commence à un nouveau bloc.

Le tableau de la 33e classe comporte 8 blocs, 11 lignes de bord, et est en parfaite harmonie avec elle. L'importance est de comprendre 9, 11, 7, 2, et non de mesurer quatre fois le nombre de codes, mais de choisir quatre outils pour suivre les quatre réponses de chaque section.

### 代码中的数据:pille-piège

`lookup`长 24 字节, dans `0x10`处包含 4 个表数据字节 `31 c0 90 48`◊ L'analyse de la ligne dans ce domaine rapporte 8 instructions de mise en place.`0x10`- Je suis là.`0x12`- Je suis là.`0x13`Je suis là.`0x14`C'est la 33e classe.`addq $0x1, %rax`提前一个字节──radar2、rizin 和 Ghidra 报告 6 个起点、2 个块、1 条边,并将 `0x10`Pour`0x14`Je suis en colère.`lookup` rapport de deux blocs et d'une ligne, puis sur la page de l'écriture`sub_400010`Un bloc de 4 caractères, il y a 2 instructions, le bloc se termine par le`0x14`Je suis là .`lookup`Le second bloc est donc en train de commencer.`0x13`Le récit de la rédaction de REX n'appartient à aucune instruction.`0x10`Pour`0x14`, donc ces caractères situés à l'intérieur de la fonction sont des données.

### 按工具统计 构造与遗漏

Dans quatre documents objectifs, le cadre indique que l'angr a créé 9 fonctions sans symbole, chacune située dans une zone de remplissage ou une table de pièges.`-O0`Je suis là .`grade`Il indique que le code est déchiffré en ligne, mais qu'il n'y a pas de code de 9 couches: 8 remplissages et un code de la table.

## 3 types de compositeurs

Il existe trois types d'outils de collecte:`-O1`Je suis là .`grade`输出类C 文本──源码是带五个案例的 `switch (score / 10)`, compilé après devenir bord de contrôle et de retour tableau de valeur.

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

angr 10.0.3:

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

Radar2 6.2.4, `pdc`- Le numéro de la liste:

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

Les résultats de cette étude seront multipliés par le nombre de réécrits de Ghidra.`0x66666667`和右移 34 位 Pliez-vous`param_1 / 10`, c'est le modèle habituel de la 34e classe.`a0 * 1717986919 >> 0x22`Les radars`pdc`Oui ESIL 仿真加伪语法: utiliser le nom du référentiel, sans variation et type, bordure inspection dans le code sans caractères`<= 0` Ghidra         `DAT_001000b4`Pour la mise en œuvre de la déclaration de type et de type`g_4000b4[4]`Il y a cinq éléments, mais il en a fourni quatre.`-O1`Le changement de caractère est interrompu.`-O0`J'ai écrit une lettre à la police.`switch(param_1 / 10)`,angr 则打印计算式 `goto`Il y a une autre.

Rizin n'a pas son propre anticompilateur, les enregistrements d'enregistrement montrent qu'il n'y en a pas.`pdc`❖ Les HLIL et les Hex-Rays de Ninja binaires sont des deux sortes de sorties.

## 动手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/37-the-reverse-engineering-landscape
python3 code/main.py
```

输出: un rapport JSON ⋅ d'abord une version outil de l'enregistrement de l'extraction, ainsi que des outils existant sur votre machine, les derniers peuvent être totalement manquants. Ensuite, fournissez un ensemble de symboles à chaque fichier cible, remplissez les espaces vides, donnez les bases de référence de chaque outil, donnez-lui les points de départ des fonctions trouvées ou conçues, ainsi que la cohérence des points de départ des instructions de chaque fonction, le nombre de blocs de base, les limites et les limites de chaque outil.

预期 structure:

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

按以下顺序阅读 `code/main.py`- Le numéro de la liste:

1. `read_text_symbols()`读取节头 ainsi que `.text``STT_FUNC`Le code est le seul cadre de valeur réelle,`TextSection.gaps()`Selon ce qui précède,
2. `parse_objdump()`- Je suis là.`parse_r2_family()`- Je suis là.`parse_angr()`et `parse_ghidra()`Les résultats de l'enquête deviendront`ToolView`: contenant des instructions de base, du déplacement de la carte à la longueur, ainsi que des instructions pour chaque fonction à laquelle il est adapté.`FunctionView`, dont il y a des blocs, des bordures et des textes antirouleurs possibles. Chaque résolveur ne connaît que le vocabulaire d'un outil, sans s'intéresser à d'autres outils.
3. `majority()`et `ranges()`Il y a deux fonctions auxiliaires utilisées pour chaque comparaison.
4. `function_report()`Comparer les résultats de la plupart des instructions de démarrage avec ceux du constructeur de diagrammes, comparer le nombre de blocs de base et le nombre de blocs de bord, et répertorier les éléments manquants de chaque outil.
5. `byte_report()`Il est nécessaire de définir chaque caractère comme étant un code de code de la marque, remplissant ainsi que les caractères non reconnus, créés ou omis, et de préciser qu'il n'y a pas de caractères de code de code de la marque à l'intérieur de la marque.
6. `findings()`Pour traduire ces résultats en phrases,`compare()`Pour chaque objectif, le document est composé d'un rapport.
7. `decode_small()`- Je suis là.`to_pcode_like()`et `to_vex_like()`构成翻译器:三种寄存器形式的编码,一种立即计算风格,一种 沉积风格──
8. `observed_ir()`测量采集的提升结果,`figure_data()`Les données de démonstration des étapes et des diagrammes sont présentées dans le tableau.

Il y a trois ordres.`python3 code/main.py compare FIXTURE.o`印单个目标文件报告──`python3 code/main.py ir 4883ec10`打印翻译器对一条命令生成的两种形式──`python3 code/main.py figure-data`打印嵌入图中的数据──

采集由 `code/fixtures/capture_tools.py`Une fois terminé, il est en.`captures.json`Encore une fois, vous pouvez utiliser les outils de test et de test.

##  réel usage

按以下顺序将框架用于新目标文件──

1. Vous devez créer un fichier objectif et le sauvegarder.
2. Dans le mode sans interface pour chaque outil, on peut recueillir une fois. Les sorties et les commandes originales sont présentes à côté du fichier cible.
3. 检查基址──选择一个函数,确认减去各工具的 `.text`Après l'adresse, chaque outil sera positionné sur le même décalage. Si des outils ne sont pas en accord, arrêtez et voyez ce qu'il a chargé.
4. Si le constructeur de diagrammes est en désaccord, la discussion suivante de la comparaison est la résolution du code, et non l'analyse.
5. Comparer les blocs de base et les bordures, en lisant le nombre de notes de chaque outil.`switch_op`- Je suis là.`COMPUTED_JUMP`Ou un point objectif irrésoluble capable d'expliquer la plupart des différences.
6. 字节统计──工具认领填充区,说明启动式规则正在起作用──工具留下符号字节,说明遍历停止──没有图构建器认领的符号字节是数据──
7.  écrire quels outils ne fonctionnent pas  sur la base de la description des documents est utile, mais les résultats de l'obtention appartiennent à différents types de preuves

## 交互实验

### 实验 A: une fonction, quatre types de bases

Dans le`code`Je suis en train de lire Python:

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

运行第二行前,先写下四个原始地址,并对照本课的表格检查――随后将 `grade`替换为 `grade_label`Je le compte dans la position de Ghidra.

###  expérience B: à partir de quatre angles

```python
report = compare("ledger-x86_64-O0.o")
report["functions"]["grade"]["blocks"]
report["functions"]["grade"]["edgesMissingPerTool"]["radare2"]
report["notes"]["rizin"]
report["notes"]["ghidra"]
report["bytes"]["radare2"]["misses"]
```

统计雷达2 缺少边,将每条边与第 33 课`-O0`Une ligne de la liste est mise en ligne pour le faire.`switchD`- Je suis là.

### 实验 C: Immediate calcul des étiquettes avec des pièces

```python
translate("48 83 ec 10")["pcodeLike"]
translate("48 83 ec 10")["vexLike"]
translate("83 f9 04")["vexLike"]
{row["name"]: (row["pcode"]["ops"], row["vex"]["statements"]) for row in observed_ir()["instructions"]}
```

Dans les deux sortes de trouver`cc_op`常量,并解释为什么一个是8 ,另一个是7 .`translate("48 01 c8")`Il a été écrit`TranslateError`Il y a une autre.

### 实验 D: 5种工具下的陷

```python
report = compare("sweep-trap.o")
report["functions"]["lookup"]["instructionStarts"]
report["bytes"]["dataInsideSymbols"]
report["functionStarts"]["angr"]
```

En ligne sur papier pour la façon de déchiffrer`31 c0 90 48 83 c0 01`, à nouveau`jmp`后归降方式解码──将两列表与框架报告的多余及缺失起点对应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应

## 实践实验

加入第五份采集结果并扩展框架──

要求:

-  Choisir un outil de lecture sans collecte ‒ et vous pouvez le faire sur votre propre machine: GNU `objdump`、LIEF 搭配 Capstone、手动导出二进制忍者免费会话, ou utiliser différentes analyses de collection Ghidra── l'extraction sur l'ensemble des quatre objectifs de fichiers, et le`captures.json`Encore une fois, je suis en train de faire une liste.
- 编写一个解析器,将采集结果转换为 `ToolView`, contient les éléments de base de l'outil, les instructions, les fonctions, ainsi que les éléments et les parties fondamentaux de la fourniture de l'outil.
-  将工具加入 `TOOLS`Si elle est construite, elle est également ajoutée.`DESCENT_TOOLS`◊ Exposition de la plupart des collections
- 编写一个测试,断言工具在 `ledger-x86_64-O1.o`Réécriture d'un test, affirmation de la façon dont il traite les pièges.
- Pour écrire un passage dans ce cours, utilisez son propre terme pour expliquer comment il appelle chargeur, contre-montageur et CFG.

Le succès est:`python3 code/main.py`Dans le`captureTools`En ce qui concerne les nouveaux instruments,`ledger-x86_64-O1.o`De chaque fonction sont maintenus `allDescentToolsAgree`Pour vrai, et `sweep-trap.o`Les découvertes expliquent comment traiter les nouveaux outils `0x10`Pour`0x14`Je suis un homme.

## Le produit

本课包含 `outputs/skill-the-reverse-engineering-landscape.md` Utiliser pour gérer plusieurs outils sur un fichier objectif que vous construisez, regrouper les adresses dans le même bas de page, et rendre compte de la cohérence des éléments sur les points de départ, les blocs et les côtés des instructions, ainsi que des caractères de chaque outil inventé ou omis.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/37-the-reverse-engineering-landscape
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明:

- ELF 读取器在 `ledger-x86_64-O1.o`Il y a quatre symboles de fonction, en taille de 16⁄46⁄31⁄63, et il y a deux espaces de remplissage.
- Les résultats de la recherche de quatre documents cibles contiennent respectivement 86,56,84,11
- Radar2 et rizin dans le `ledger-x86_64-O1.o`Le rapport est le même, avec des radars.`pdc`文本
- - Je suis désolé .`sub_40003e`et `sub_40005f`标为没有符号的函数
- Ghidra à`total`Le bloc de division est le 5 de la classe 33, le flux de réglage n'est pas dans le tableau
- Après avoir déposé leurs bases, chaque outil sera déposé.`grade` mettre en déplacement `0x10`
- Chaque outil est à`ledger-x86_64-O1.o`Chaque commande de chaque fonction est cohérente
- 4 types de constructeurs d'images dont les rapports 3 ̊3 ̊5 ̊4 blocs et 2 ̊3 ̊5 ̊4 ̊4 ̊ margin, et les marginals sont les mêmes
- `-O2`Je suis là .`total`Il y a 10 blocs et 13 bordes dans chaque constructeur de dessins.
- `-O0`Je suis là .`grade`Dans le radar2 、rizin、angr、Ghidra, il y a 3、8、8、9 blocs et 2、11、7、12 条边, cause voir chaque outil
- `-O0`Je suis là .`grade_label`Parmi tous les outils, il y a un seul bloc, uniquement en utilisant le bloc de base.
- Angr dans chaque remplissage de vide de créer une fonction, et de créer une autre sur la table de pièges; autres outils n'ont pas de fonction de créer ou de laisser tomber
- L'analyse de la ligne dans le piège`0x10`- Je suis là.`0x12`- Je suis là.`0x13`, perdu .`0x14`, et aucun code de constructeur .`0x10`Pour`0x14`
- 发现列表指出 radar2 遗漏的范围和愤怒 臆造的每个函数
- 清单为全部 21 采集文件记录版本和命令
- 三种工具反编译 `grade`, seulement Ghidra  Folding 除法 habituel mode
- Une sorte de type d'écriture est immédiatement écrite dans CF, OF, SF, ZF, PF, une autre forme d'écriture est écrite dans`cc_op`pour le thunk`cmp`Pour le référencement`movslq`Non écrit
- 翻译器拒绝内存形式、其他操作码、额外REX 位和错误长度
- 翻译器的 `cc_op`Les numéros 8 et 7 sont les mêmes que dans le VEX de l'accumulation
-  Résultat de l'extraction  3 directives  9  1  10  P-code 操作  et 7  4  7 条 VEX 语句
- 时间线按顺序从1973年延伸到2026年,流水线有八阶段和六种工具,每个单元格都有术语,两个闭源工具标为未运行
-  Interaction des données intégrées avec les données générées par le cadre

## Mode de production environnementale défaillant

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

Chaque outil est recueilli une fois, enregistré, ordonné et édité, chaque adresse est regroupée dans le même fondement, d'abord comparé, puis comparé, puis comparé.

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
