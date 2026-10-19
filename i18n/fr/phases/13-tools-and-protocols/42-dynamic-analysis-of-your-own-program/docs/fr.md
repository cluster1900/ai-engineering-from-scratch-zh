# 动态分析: modifiateur, suivi et validation des conclusions statiques

> 断点命中只是对某一构建的运行观察――本课构建测试驱动器,将这些观察转换为针对静态分析课程结论的已确认已反驳和未观察判定──

**Type:** Build
**Languages:** Python, C, arm64 assembly, lldb command language
**Prerequisites:** Phase 13 · 33（反汇编与控制流）、Phase 13 · 35（证据、置信度和未知项）
**Time:** ~130 分钟

## Objectif de l'apprentissage

- 解释调试器在Linux 上需要哪些操作系统支持(`ptrace`), dans macOS, quelles sont les aides nécessaires pour la machine  tâche port et port rare), ainsi que le coffret de la boîte de réception Pourquoi le processus de modification ne peut pas être démarré ?
- 按名称和清单地址 définition de logiciel de blocage, définition de matériel de observation,并理解处理器对两者施加的限制──
- De Python à partir du mode de traitement de la série, l'utilisation de stop子 dans chaque stop record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record record time line.
- Pour le contrôle de cette ligne de temps, le chapitre 32 33 34 41 conclut la situation statique: paramètres de l'archiviste, des structures, des écarts de temps, des conditions de passage réel et des modifications qui ont eu lieu.
- Pour le`-O2`构建运行同一计划,解读已解析但从未预定的断点,并说明这能证明什么,不能证明什么.
- 保存和加载核心文件,并指出式核心 遗漏了什么──
- Pour l'instruction de l'administration générale,`strace`- Je suis là.`ltrace`- Je suis là.`bpftrace`- Je suis là.`dtrace`et `rr`放到正确的操作系统,并说明版本和许可证──
- Expliquer quelles conditions de signature de code de macOS permettent à l'LDB de modifier le système de construction automatisé, ainsi que les deux situations dans lesquelles il refusera:

##  problématique

第41 课从 DWARF 读取 `struct account`, souligne `balance`位于偏移 4──第 33 课构建 `classify`Le premier groupe de contrôle a été créé en janvier 2007.`return -1`块──第 32 课指出前两个参数通过 `x0`et `x1`传入──每句都从字节推导而来, aucun passage ne vient de l'observation réelle──

Puis, un agent a lu le même programme et a rapporté:`bump`- Je suis là.`classify`et `sum_balances` Le tableau de symboles énumère ces trois fonctions, donc cette phrase semble fiable.`-O2`Construire un programme, pour chaque fonction, définir un point de résolution et le mettre en œuvre.`hit count = 0`Il y a une autre.

Le jugement de l'agent sur le code source n'est pas erroné, l'erreur est le jugement de la construction de l'utilisateur.`sum_balances(rows, 3)`Pour connaître la situation réelle de ce système secondaire sur l'appareil, il faut le faire fonctionner et observer sous le régulateur.

Le programme de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de formation de l'équipe de formation de l'équipe de formation de formation de l'équipe de formation de l'équipe de formation de formation de l'équipe de formation de l'équipe de formation de formation de l'équipe de formation de l'équipe de formation de formation de l'équipe de formation de l'équipe de formation de formation de l'équipe de formation de l'équipe de formation.`account.c`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,`confirmed`Indiquer la validité d'une décision de cessation de cette opération;`refuted`Indiquer une cessation de démonstration de non-validité;`not-observed`Il est écrit que les autorités de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État`controlled-replay``observed`- Je suis là.

```figure
re-42-run-timeline
```

## Le référentiel est trois systèmes de service

Le référentiel peut être utilisé pour les processus qui ne possèdent pas de code.

Le service Linux est `ptrace(2)`                                                                                                                                                                                                                                                              `PTRACE_TRACEME`让子进程声明其父进程将跟踪它;`PTRACE_ATTACH` le processus de mise en relation sans relation;`PTRACE_PEEKDATA`读取被跟踪进程内存中 addr 地址处的一个字母;`PTRACE_GETREGS`读取寄存器;`PTRACE_SINGLESTEP`执行一条指令──Yama 模块限制附加操作:`/proc/sys/kernel/yama/ptrace_scope`默认值 1 signifie que le processus objectif doit être le processus de la prochaine génération du utilisateur  2, indique que seul le gestionnaire peut être ajouté, 3, indique que tout le monde ne peut pas 

macOS `ptrace`接口较小──Apple 手册列出 `PT_TRACE_ME`- Je suis là.`PT_ATTACHEXC`- Je suis là.`PT_STEP`- Je suis là.`PT_CONTINUE`et `PT_KILL`,并说明使用 `PT_ATTACHEXC`时,子进程的信号以马奇形式传给父进程──内存和寄存器根本不经过 时,子进程的信号以马奇异形式传给父进程──内存和寄存器根本不经过 时,子进程的信号以马奇异形式传给父进程──内存和寄存器根本不经过 时,子进程的信号以马奇异形式传给父进程──内存和寄存器根本不经过 时,子进程的信号以马奇异形式传给父进程──内存和寄存器根本不经过`ptrace`◊ ldb de `debugserver`调用 `task_for_pid()`获取进程的Mach 任务端口, puis调用 `task_set_exception_ports()`, pour que le processus de surveillance du système soit terminé sous forme de messages inhabituels`taskgated`Décider qui peut le faire`task_for_pid`Il y a une autre.

Un document de ce cours démontre le coût de ce design. La coquille de ce cours fonctionne sous la ceinture de sable. Le même plan produit une tentative de cessation à l'extérieur de la sable, et produit les résultats suivants:

```text
(lldb) run
error: process exited with status -1 (attach failed ((os/kern) invalid address))
```

进程 a été créé, mais ne peut être pris en charge par le contrôleur. 误涉及调试器权限, ne peut pas expliquer le processus lui-même avoir aucun problème. 驱动器将记录为启动失败,停止次数为零,没有判定.

Le répéteur se souvient à quel endroit il a remplacé les instructions, afin de continuer à les exécuter en récupérant le contenu original et en fonction du nombre de fois qu'il a mis en place.`breakpoint list`Imprimez cette feuille, le moteur sera lu à la fin de chaque course.

## 断点: remplacer un caractère ou un caractère

Le code de l'application est un code de code de l'application.`INT3`, opérateur `CC`,长度为一个字节,Intel 手册描述其用途为调用调试异常处理程序──arm64 使用 `BRK #imm16`,一条四字节指令,其异常使用 EC 值 0x3C 将异常记录到 ESR_ELx──Arm 手册还说明,首选返回地址就是`BRK`L'ordre lui-même, donc arrêter le rapport est l'adresse de l'ordre remplacé, et non le suivant.

Il peut être configuré en fonction du nom, du document et du numéro d'adresse.

```text
(lldb) breakpoint set -n bump
Breakpoint 1: where = account-O0`bump + 12 at account.c:13:19, address = 0x00000001000004bc
```

`bump + 12`Il est le quatrième ordre.`sub sp, sp, #0x10`- Je suis là.`str x0, [sp, #0x8]`et `str w1, [sp, #0x4]`, qui est le DWARF 行号表归功于函数起始行的建立代码──停止时,`x0`et `x1`始终保存参数, puisque les préliminaires les ont simplement copiés.

按地址设置时,lldb 需要知道地址属于哪个模块──在进程中尚不存在时,单独的 `breakpoint set -a 0x100000504`C'est un site de chargement sans réponse; lors de la première test, il a été continuellement utilisé pendant toute la durée de la mise en service.`unresolved`, et`hit count = 0` Les modules de formulation de l'utilisation du moteur:

```text
(lldb) breakpoint set -a 0x100000504 -s account-O0
Breakpoint 4: address = 0x0000000100000504
```

Utilisation `-s`后,该数值表示 `account-O0`內文件地址,lldb 加上加载偏移,运行后该位置显示 `resolved, hit count = 2` Le code de classe 33 donne l'adresse du fichier, de sorte que cette forme sera connectée à la liste statique jusqu'à la liste statique stop.

### Le code de la main

`-O0`Je suis là .`classify`La première condition de la répartition est `0x1000004f0`处的字 `36f800a8`- Je suis désolé .`llvm-objdump`Il est imprimé pour`tbz w8, #0x1f, 0x100000504`Selon Arm A64.`TBZ`C'est une bonne idée.

1. 位 31 是位编号的高位 `b5`, valeur pour 0:
2. 位 30 à 25 `011011`, appartient à la sélection des élèves et des élèves.`TBZ`Il n'y a pas de`TBNZ`Il y a une autre.
3. Les positions 23 à 19 sont les 5 plus basses.`b40`- Le numéro de la liste:`11111`= 31―结合 `b5`= 0, est testé par un nombre de bits 31, c'est-à-dire 32 bits de valeur.
4. 位 18 à 5 `imm14`- Le numéro de la liste:`00000000000101`= 5―分支偏移为 `imm14 * 4`- 20 = `0x14`, c'est pourquoi l'objectif est de`0x1000004f0 + 0x14 = 0x100000504`Il y a une autre.
5. 位 4 至 0 `Rt`- Le numéro de la liste:`01000`= 8, donc寄存器 est `w8`Il y a une autre.

`w8`Dans un premier ordre,`ldr w8, [x8, #0x4]`La charge, le déplacement 4 ̊`a->balance`Il y a une autre.`TBZ`Dans ce lieu, le temps de saut est de zéro, donc le symbole de zéro est de zéro, c'est-à-dire`balance >= 0`Il y a une autre source de référence.`if (a->balance < 0) return -1;`, donc l'interprète a changé de condition:`return -1`块,`0x1000004f4`Ainsi, la conclusion statique du moteur est la conclusion du mot:`a->balance >= 0`时跳转,否则顺序落下──第二分支的提升方式相同──`subs w8, w8, #0xc8`计算 `balance - 200`, lorsque le résultat est à zéro, c'est-à-dire`balance <= 200`时,`b.le 0x100000524`Je suis en train de changer.

## 观察点依赖硬件, nombre limité

观察点在某地址内存被访问时停止进程──它不能通过替换指令实现,因为任意位置任意指令都可能进行该访问──因此, le processeur fournit une petite quantité d'adresse comparateur──x86-64 ⋅调试寄存器:`DR0`Pour`DR3`保存最多4个断点的地址,`DR7` Activation des conditions de mise en place et de mise en place de l'application                                                                                                                                                                                                                                                      `DBGWVR<n>_EL1` conserver pour l'observation des données correspondantes à des sites virtuels,`DBGWCR<n>_EL1`保存控制信息;Arm 手册说明 Une réalisation peut contenir 2 à 64 个观察点。

L'Ildb rapporte le nombre de ses actifs:

```text
(lldb) watchpoint set variable a->balance
Watchpoint created: Watchpoint 1: addr = 0x16fdfe00c size = 4 state = enabled type = m
(lldb) watchpoint list
Number of supported hardware watchpoints: 4
```

Il y en a quatre sur cette machine.`0x16fdfe00c`Oui `x0 + 4`Dans le`bump`停止处的结构体指标, ajoutée à DWARF `balance`- Je suis désolé.`size = 4`Pour la`int`- Je suis désolé .`type = m`Si le point d'observation est épuisé, il est possible de supprimer le point d'observation suivant; alors que la zone non étroite ou grande de la seconde dimension peut occuper deux points d'observation, le nombre de points d'observation pouvant être configurés peut donc être inférieur à quatre.

Les données observées au point de vue du rapport après la visite. Intel manuel instructions,  écrire l'ordre de l'inventaire sera d'abord couvrir les données originales, puis de générer des données de blocage provoquant des modifications anormales;lldb conserver l'ancienne valeur dans son propre caisse, afin d'imprimer simultanément la nouvelle valeur ancienne:

```text
Watchpoint 1 hit:
old value: 250
new value: 255
* thread #1, queue = 'com.apple.main-thread', stop reason = watchpoint 1
    frame #0: 0x00000001000004d0 account-O0`bump(a=0x000000016fdfe008, by=5) at account.c:14:12
```

停止地址为 `0x1000004d0`, qui est`0x1000004cc`- Je suis là.`str w8, [x9, #0x4]`后后的命令――解析输出前需要了解一个特点:刚执行 `watchpoint set`Je vais faire une impression.`Watchpoint 1 hit:`,ancienne valeur pour le ciel,`new value: 250`C'est juste un début de lecture, le moteur va ignorer la vieille valeur de la destinée.

## 单步、停止子和批处理模式

Il est un commandement`<noun> <verb> [-options] [arguments]` Un seul étape de commande comprenant `thread step-in`(le secteur de l'énergie)`s`)`thread step-over`(le secteur de l'énergie)`n`)`thread step-inst`(le secteur de l'énergie)`si`)`thread step-inst-over`(le secteur de l'énergie)`ni`) et `thread step-out`(le secteur de l'énergie)`finish`)。`thread until 12`- Je suis en train de faire une course.`thread return <expr>`携带一个值提前返回──本驱动器不执行单步,而在计划地址停止,让停止子读取数据:

```text
target stop-hook add -o "register read x0 x1 pc" -o "memory read -s4 -fx -c24 $x0" -o "frame variable -P 1"
```

`-o`Je peux le répéter, l'ordre sera exécuté en ordre à chaque arrêt.`register read`☐ désigner deux paramètres de référencement et un programmeur de calcul.`memory read -s4 -fx -c24 $x0`De `x0`Le nom de l'écriture est le même que celui de la traduction.`struct account`Il y a une autre.`frame variable -P 1`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `a`Il y a cinq paragraphes.

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `lldb -b`                                                                                                                                                                                                                                                              `--batch`运行  référencement`-s`- Je suis là.`-S`- Je suis là.`-o`- Je suis là.`-O` l'ordre fourni est retiré; si l'ordre in signal ou défaillance et arrêt, le manipulateur retournera à l'interaction ── le manipulateur planifiera l'écriture du fichier, repassant `-s`Une mise en place importante est `settings set interpreter.stop-command-source-on-error false`Sans elle, le premier processus est terminé.`continue`Je vais mettre fin à tout le dossier de l'ordre,`breakpoint list`Ça ne fonctionnera jamais.`error: Process must be launched.`Je vais continuer.

输出形式的两个事实决定了解分析器的工作方式――首先,子运行时立即打印输出,之后才打印包含 `frame #0`  `Process N stopped`块── donc, le résolveur collecte d'abord le référentiel ̇ la mémoire et la variable pour le traitement des blocs, puis les ajoute à la prochaine rencontre `frame #0`行──若块中的程序计器 se trouve dans `dyld``_dyld_start`, c'est le processus d'exécution avant l'entrée stop, rien.`frame #0`Je vais le recevoir.`--auto-continue`La première version du moteur continue à être utilisée automatiquement, et aucun résultat n'est enregistré.`continue`- Je vous en prie.

## 计划来自清单

`Plan.commands()` selon le système de gestion de l'entreprise `llvm-objdump -d`文本构建命令文件──对 `account-O0`- Le numéro de la liste:

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

Trois noms de la fonction de l'entrée.`Listing.conditional_branches()`Dans le`classify`Les objectifs et les conditions de chaque département sont les suivants:`0x1000004f0`- Je suis là.`tbz`et `0x100000510`- Je suis là.`b.le` Observation du point de vue lors de la première mise en place, plan prévue de la mise en place`bump`Il y en a eu 16 .`continue`命令, dépassant le nombre requis pour une opération, le surplus d'ordre est infaillible après le retrait.

`claims_for()`Utilisation des mêmes entrées et constructions:

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

字段偏移 来自 `struct_layout()`Il est transféré du DSYM à la lecture avec`DW_AT_byte_size (0x20)``DW_TAG_structure_type`, ainsi que cinq `DW_TAG_member`条目的 `DW_AT_data_member_location`: plan de code non plus à la valeur 4, mais de le lire.

## -O0 运行:十一次停止

La première fois que je me suis arrêté`bump`断点──子在停止块之前印印了以下内容:

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

Pour le deuxième jour, le premier épisode de la série est écrit en français.`0x73`, qui est`'s'`Je suis là .`kind`字节,后面是三个填充字节──偏移 4 的字 1 为 `0xfa`= 250,即 `balance`△偏移 8 的字 2 为 `0x9`, qui est`code`La moitié est en bas.`short`, la moitié haute a deux caractères à remplir.`double`Précédent de remplissage:`0x3ff4000000000000`, c'est-à-dire 1,25 de code IEEE-754 偏移 24 的字符 6 和 7 为 `0x100000719`, qui se dirige vers`__TEXT``label`Il y a plus de 8 caractères.`0x6c`- Je suis là.`'l'`et `0xffffffd8`= -40 开头: c' est la troisième ligne de 32 字节后`loan` chaque valeur est`frame variable`Un coup, donc `_check_layout()`Dans cette période, il va s'arrêter.`field-offsets`记录为 `confirmed`, et et `x0`保存结构体指针的全部十一次停止中重复确认──

`x0`Ça va .`a`- Je suis désolé .`x1`Ça va .`by`, donc à l'entrée confirmé`arg-registers`◊ Les moteurs ne comparent que les paramètres de la déclaration ◊ dans `classify`- Je suis en train de me faire arrêter.`x1`仍为 `0x5`C' est ça .`bump`遗留的值; et`classify` Il n'y a qu'un seul paramètre, donc il n'est pas possible de le comparer                                                                                                                                                                                                                                                  

Deuxième arrêt est observation, ancienne valeur 250, nouvelle valeur 255,`by`= 5― Toute la course est une seule fois, donc `store-once`Il a été confirmé.`classify`Il y a trois fois une entrées et deux arrêts:

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

`_check_branches()`Arrêter par fonction d'exécuter des exemples, lire le résidu de l'entrée, et correspondre à chaque arrêt calculé après la mise en valeur des prévisions de la suite.`branch-1`确认三次,`branch-2`确认两次──停止 5 显示余额为255,正是观察点看到写入的值──这是一个程序的一次运行,证据相互连接──

Je suis en train de faire une pause.`list`Je suis en train de lire 24 mots.`_check_stride()`取字 1、字 9 和字 17,即偏移 4、36、68:100、255 和 -40── il va chaque valeur avec `classify`Les résultats obtenus par le même site sont comparés à 315, à reprendre par le programme.`sum 315`Résultats de la procédure suivante`breakpoint list`显示名称断点的命中次数为 1、3、1,四边断点为 2、1、1、1──全部八个结论最终均为 `confirmed`, derrière 25 articles, dont 23 articles connectés à l'arrêt, deux articles connectés à la pleine et entière fonctionnement.

## -O2 运行:零次停止

Le même code source`-O2`Il y a une autre procédure.`main``llvm-objdump -d`输出只有四条 `bl`, tout est en train de changer .`printf`                                                                                                                                                                                                                                                              `mov w8, #-0x1`- Je suis là.`mov w8, #0x1`À travers.`xzr`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `mov w8, #0x13b`取代──编译器在编译期计算了所有结果──`nm`- Je suis encore là .`_bump`- Je suis là.`_classify`et `_sum_balances`, étant donné qu'elles sont des fonctions externes, il faut conserver des copies non interconnectées pour les autres fichiers objectifs.`DW_TAG_subprogram`条目, mais rien `DW_TAG_inlined_subroutine`条目, donc连调试信息也未记录这次内联──

Le plan de construction a trois étapes, sans étapes.`-O2`Je suis là .`classify`Il n'y a que six ordres:`ldr`- Je suis là.`cmp`- Je suis là.`cset`- Je suis là.`cmp`- Je suis là.`csinv`- Je suis là.`ret`, dont aucun n'est conditionné à être reçu.`-O0` Dans ce système secondaire, il n'y a pas d'adresse, les moteurs ne les déplaceront pas                                                                                                                                                                                                                                                  

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

Chaque commentaire est résolu. L'adresse est là, le code est là, l'écriture est là.`BRK` Le nombre de destinations est nul, car il n'y a pas d'ordre d'arriver à cet endroit.

| 结论 | 判定 | 记录 |
|---|---|---|
| `calls` | 已反驳 | 完整运行以状态 0 退出后，入口停止次数为 bump 0、classify 0、sum_balances 0 |
| `output` | 已确认 | 四行输出及退出状态 0 |
| `arg-registers` | 未观察到 | 没有停止检验它，命中次数全为 0 |
| `field-offsets` | 未观察到 | 没有停止检验它 |
| `store-once` | 未观察到 | 未在 bump 停止，因此从未设置观察点 |
| `stride` | 未观察到 | 未在 sum_balances 停止 |

必須准确说明反驳的含义── la conclusion initiale est la suivante:`main`Dans ce programme, trois fonctions sont réutilisées. Pour cette opération de la construction, elle n'est pas réutilisée. Le lecteur vérifie que la mise en œuvre est terminée, car le nombre de fois de sortie préliminaire est de zéro. Il est possible de dire que la fonction n'est pas encore réutilisée.`balance` placer par déplacement 4,`-O2`DWARF l'explique aussi, mais cette opération n'a pas arrêté de lire la mémoire pour la montrer.`not-observed`Gardez cette distinction, le 35ème cours restera ouvert jusqu'à ce qu'une opération puisse vraiment l'observer.

## Réservoir de base

Le fichier principal écrira la mémoire et le référentiel du processus sur le disque, de sorte que le référentiel puisse encore lire son état d'arrêt après la disparition du processus.`core(5)`En définitive,  minorité conduisent à des signaux de terminaison exceptionnelle du processus, qui seront également enregistrés dans le disque, positionné `/cores/core.pid`, présupposant que le processus de finalisation ait le droit d'écrire ce répertoire et que le répertoire existe──`sysctl` rapport `kern.coredump: 1`et `kern.corefile: /cores/core.%P`- Je suis désolé .`/cores`存在,模式为 `drwxrwxr-t root admin`, et la coquille de `ulimit -c`Pour l'utiliser`ulimit -c unlimited`augmenter la limite, ou utiliser `launchctl limit core unlimited`Jusqu'à ce que le système de niveau augmente, le nucléaire ne sortira pas du cœur.

Il est nécessaire de rédiger un document de base.`bump`- Je suis en train de faire une pause.

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

Le retour et l'intégralité du nombre sont parfaits, car ils se trouvent au cœur de la conservation.`label`显示为空字符串, mais son indice est complet.`0x100000719`C' est vrai; il indique que les caractères sont exécutables .`__TEXT`段中的字面量 `"savings"`, et le noyau ne contient pas ce segment. L'index est le résultat de l'observation, les caractères sont inutilisables, l'index ne le construira pas.`--style full`包含全部进程内存; sur le study机器, le cœur complet du programme de 34 KB  atteint 2,1 GB, car le processus a cartographié le cache partagé `ESR_EC_BRK_AARCH64`Le fond est d'avoir des détails.`BRK`- Ça va.

Linux en base`/proc/sys/kernel/core_pattern`- Je suis un peu dégoûté.`%p`Indiquer le PID`%e`Vous avez un nom de commande`%s`Indiquer le signal`%t`Pour le moment, il est temps de le faire.`|`Le système de distribution de la production de produits de base est basé sur la production de produits de base.`systemd-coredump`, à nouveau .`coredumpctl list`- Je suis là.`info`- Je suis là.`dump`et `debug`取回保存的数据──`gdb prog core`et `lldb -c core prog`Tout le monde peut ouvrir le résultat.

## gdb et lldb pour le contrôle

两个调试器用不同命令完成相同工作──驱动器中的 `COMMAND_MAP`Il y a 35 pages, passible.`python3 code/main.py commands`打印──本课使用的如下:

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

Dans le milieu,`p`Oui `dwim-print`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `frame variable`路径打印,其他情况回归到 `expression`Il y a une autre.`v`C' est ça !`frame variable` Les moteurs doivent être utilisés en priorité `frame variable`: it read DWARF 位置, ne pas être modifié dans le processus d'exécution de code.

Les informations suivantes et les licences sont disponibles jusqu'à 2026-10-14。lldb Utilisation de LLVM 版本号,llvm.org La première édition est publiée en 2026-10-06 发布的LLVM 23.1.3,采用附带LLVM 例外的Apache License 2.0。HomeBrew 通过独立公式 `lldb`Les outils de ligne de commande de cette machine fournissent des numéros Apple.`lldb-1703.0.236.21`, est intégré dans Python 3.9.6; lldb d'Apple  déjà disposé à la modification de la signature.`.gdb_index`、Arch64 `FPMR`et Python `gdb.Corefile`Le processus de mise en œuvre de la version originale de l'arch64-Darwin a été publié en octobre 2025 et contient 15 correctifs.`gdb`La formule a un bras64, mais la construction est faite sous forme de faux.`--target=x86_64-apple-darwin20`; ajouter ces paquets de relations publiques 明确说明 Impossible de passer par GDB 调试 aarch64-darwin 二进制──macOS 上的任何非果调试机还需要自签证和 `com.apple.security.cs.debugger`权限,否则 `task_for_pid`Étude de la programmation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de l'équipe de l'équipe de formation de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de la formation de l'équipe de l'équipe de la formation de l'équipe de l'équipe de la formation de l'équipe de l'équipe de la formation de l'équipe de la région de l'équipe de la région de l'équipe de la région de l'équipe de la région de l'équipe de la région de la région de la région de la région de la région de l'équipe de la région de la région de la région de la région de la région de la région de la région de la région de la région de la région de la région de la région de la région de la région de la région de la région de la région de la région de la région de la région de la région de la région de la région de la région de la région de la région de la région de la région de la région de la région de la région de la région de la région de la région de la`rr`Il y a aussi des transports.

## Le processus à l'intérieur du nucléaire a demandé quoi ?

调试器显示程序停止时的状态,跟踪器则显示程序对系统的影响,而不长时间停止程序──工具按操作系统区分──

| 工具 | 操作系统 | 版本 | 许可证 | 记录内容 |
|---|---|---|---|---|
| `strace` | Linux | 7.2，2026-08-18 | LGPL-2.1-or-later | 系统调用及参数和返回值 |
| `ltrace` | Linux | 最后发布的 tarball 为 0.7.3，Debian 使用 git 快照 | GPL-2.0 | 动态库调用 |
| `bpftrace` | Linux | v0.27.0，2026-09-10 | Apache-2.0 | 通过 eBPF 记录内核和用户态探针 |
| `dtrace` 和 `dtruss` | macOS | macOS 26.2 中为 `Sun D 1.19` | CDDL，源自 Sun OpenSolaris | D 探针；`dtruss` 打印系统调用 |

`dtruss`Manual Description:En raison de l'utilisation de DTrace, seuls les utilisateurs dotés de droits de racine peuvent exécuter cette commande―Apple `dtrace(1)`补充:在默认系统完整性保护设置下, ne permet pas au D 程序 d'accéder à la valeur d'adresse interne ou au contenu de la mémoire interne , et SIP 下不允许破坏性操作──本课没有在此机器上运行`sudo dtruss ./account-O0`, puisque le moteur n'utilise pas de racine, il mettra en place ce record pour non validé.`printf`- Je suis parti .`write`是 suivi problème;  jusqu'à `bump`时 `x1`Si le 5 est un problème de réparateur, il ne s'agit que de deux opérations.

## 记录与重放

`rr`记录 une fois de fonctionnement, et gdb`reverse-cont`Le projet s'est déroulé en suivant la définition de la version 5.9.0 de la version 5.9.0 de 2025-02-13. Il ne contient que le BSD-2-Clause. Il ne prend en charge que Linux, nécessite une section statistique de calcul de performances de matériel, donc il peut être utilisé sur Intel Nehalem et la mise à jour de l'architecture, ainsi que sur certains micro-architectures de Linux, comme ARM Neoverse N1 ou Apple Silicon M.

Gdb a aussi son propre logiciel de registre.`record full`记录 process execution日志, par défaut limité à 200 000 条`record btrace`Utilisation Intel 分支跟踪,不记录数据──lldb ne fournit pas ces deux fonctions── sur cette machine macOS, le texte de session de sauvegarde du moteur est enregistré: le même plan agit sur le même système, se produira dans le même ordre, s'arrête dans le même ordre, le test de cas fixe cet ordre──

## Une opération peut prouver quoi

Une opération ne prouve qu'une seule entrée sur une construction. C 标准将未定义行为定义为:使用不可移植或错误程序构建或错误数据时,本文件不施加任何要求的行为.`int`Le processus de décharge`-O0`et `-O2`Il y a des résultats différents.`percent_change`溢出单元中遇到过这种情况──UBSan 将问题转换为停止:`-fsanitize=signed-integer-overflow -fsanitize-trap=undefined`Il s'agit d'une situation qui a entraîné l'arrêt de la mise en œuvre des instructions.

优化代码还会移动你希望观察的内容――GDB 手册说明,优化器重排你的代码,调试机展示现实存在的内容; 优化到不存在的变量是GDB 永远看不到的变量――GDB 将这种值打印为`<optimized out>`, source code le fera avec `<unavailable>`区分: le premier n'existe pas en fait dans le programme, le second existe dans le programme, mais le GDB ne peut pas être obtenu.`<variable not available>` Le point d'observation de l'invite ne s'éteint pas parce que l'invite n'est pas l'invite.`-O2`运行 a montré la situation extrême: toute la fonction est pliée, aucun point d'observation n'a été mis en place, ne peut rien prouver.

Ainsi, le moteur ne écrit que trois enregistrements, il ne écrit jamais le quatrième.`confirmed`;检验后不一致, pour`refuted`Il n'y a pas de contrôle.`not-observed`Le nombre de décès est également une partie de la raison.`controlled-replay``observed`记录,将第三种保留为开放未知项──

## Dans macOS, il suffit de modifier sa propre construction

Sur le silicone d'Apple, le lien vous sera signalé.`ld(1)`Pour le`-adhoc_codesign`Il s'agit d'une série de projets de recherche et de développement qui ont été réalisés par la Commission européenne.`codesign -dvvv account-O0`Il est écrit:

```text
Format=Mach-O thin (arm64)
CodeDirectory v=20400 size=387 flags=0x20002(adhoc,linker-signed) hashes=9+0 location=embedded
Signature=adhoc
TeamIdentifier=not set
```

`0x20002`Oui `CS_ADHOC`(le secteur de l'énergie)`0x2`)`CS_LINKER_SIGNED`(le secteur de l'énergie)`0x20000`), qui est expliqué dans le code signé de l'Apple dans le dossier de signing title `codesign -d --entitlements -`Dans le cadre de la procédure de réception, le document peut être publié à partir de la date de réception.`DevToolsSecurity -status`報告Le mode développeur est actuellement désactivé

Deux contrôles de pouvoir qui peut contrôler qui, séparément se trouve sur les deux côtés.`com.apple.security.cs.debugger` belongs à la référencée:  a un valeur globale, indiquant si l'application est référencée, ainsi que si elle peut ajouter d'autres processus ou obtenir des tâches à la portée de l'application.`debugserver`porter sa forme privée; 运行对命令线工具中的副本`codesign -d --entitlements -`Je vais sortir .`com.apple.private.cs.debugger`- Je suis là.`com.apple.private.set-exception-port`- Je suis là.`com.apple.private.thread-set-state`et `com.apple.private.logging.diagnostic`Il y a une autre.`com.apple.security.get-task-allow`属于目标. Xcode a été inséré dans la configuration, démonté à l'exportation, tandis que l'entreprise a refusé de le transporter à la seconde.`get-task-allow`时, les terminaux de tâches seront rejetés.`clang`La construction n'a pas été renforcée, la mise en œuvre n'a pas été refusée.`codesign --options runtime`给样例签名,调试前需使用 `codesign -s - -f --entitlements get-task-allow.plist`Je suis en train de faire une nouvelle signature.

Il y a trois faits. Premièrement, lors de la première modification de la session de session de session, vous pouvez voir que l'Accès aux outils de développement doit prendre le contrôle d'un autre processus de débogage pour continuer la boîte de dialogue.`sudo DevToolsSecurity -enable`Pour`admin`Ou `_developer`组成员免去额外密码──第二,调试自己的代码无需关闭SIP──Apple 详细介绍从Xcode 运行和调试应用无需关闭SIP;涉及调试的SIP组件,仅仅是`csrutil enable --without debug`Pour le reste, laissez-moi vous dire que la ceinture de sécurité est bloquée.`task_for_pid`, exemple `sandbox-O0.lldb.txt`Les résultats démontrés. Les opérations initiales appartiennent à l'environnement.

Tout ce qui est dans ce cours est applicable à votre propre processus de compilation.

## 亲手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/42-dynamic-analysis-of-your-own-program
python3 code/main.py
```

输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输出 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 输 

预期 structure:

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

按以下顺序阅读 `code/main.py`- Le numéro de la liste:

1. `Listing`Il va`llvm-objdump -d`文本解析为函数和命令,`Function.conditional_branches()`查找分支及目标与顺序落下地址──
2. `struct_layout()`De `llvm-dwarfdump`文本读取结构体和成员条目──
3. `lift_condition()`Pour transformer un conditionnement en un prétexte, c'est la 34ème classe.`tbz`- Je suis là.`cbz`Et comparer avec les autres étapes de promotion.
4. `Plan.commands()`Selon le document de commande de l'Ildb,`Plan.lldb_command()`提供批处理调用。
5. `parse_transcript()`ordre de sortie, de construction contenant les enregistrements                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 `Stop`记录, ainsi que le résultat et le retrait.
6. `claims_for()`声明八个结论,`evaluate()`Utilisation `_check_*`函数逐次停止评判它们──
7. `rollup()`Le record sera attribué à chaque conclusion un jugement, un rejet prioritaire à la confirmation.
8. `capture()`et `capture_extras()` 生成例;当 `clang`et `lldb`À la suite de la réception,`live()`Dans la nouvelle construction, répétez tout le processus.

Il y a encore quatre ordres.`python3 code/main.py plan O0`打印某构建的命令文件;`python3 code/main.py commands`打印 gdb 和 lldb pour les résultats;`python3 code/main.py tools` rapport `PATH`Il y a des outils externes;`python3 code/main.py live O0`Il va`account.c`编译到临时目录,根据新清单制定计划,运行 lldb,再根据本次运行评判结论──在沙箱内,它报告 lldb 无法启动进程,附带错误,并以 1 退出──

##  réel usage

按以下顺序将驱动器用于自己的程序──

1. Utilisation `-g`L'élaboration de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en.`llvm-objdump -d`文本一起保存──
2. 运行前写出结论―― chaque élément désigne une fonction, un référentiel ou un emplacement, une valeur ou un bord, ainsi que son cours ou son document d'origine―― voir stop.
3. 根据清单生成计划并阅读──每个地址都应追溯到清单的一行──若断点没有对应行,就删除它──
4. Dans le mode de traitement de la série, il est possible de conserver le record du session et de le faire en tête du record de la ligne de commandes et du record du référent.
5. 进行判定──阅读 确认结果之前,先读每条 `not-observed`记录及原因──原因 vous dira quelles conclusions nécessitent d'autres entrées, autres constructions ou autres conclusions──
6. Utiliser les mêmes conclusions pour optimiser la construction. Les points de connexion peuvent apparaître déjà résolus mais dans le destin, il faut conserver l'état indéterminé de la conclusion correspondante.
7. Les documents confirmés et réfutés seront considérés comme`observed`、 autorité source `controlled-replay`写入第 35 课账本,每次停止一条记录──未观察的结论仍然作为未知项,附上断点命中次数──

## 交互实验

### 实验 A: Hand工读取一次停止

De `code`Actuellement Python:

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

执行第二行之前,先写下预期哪个字保存 250,哪两个字保存 1.25──然后运行 `struct.unpack("<d", struct.pack("<II", s.memory[4], s.memory[5]))`Il est plus que rien.`t.stops[1].watch_hit`et `t.stops[1].pc`, dans le`account-O0.objdump.txt`C'est une commande après le stockage.

### 实验 B:分支与后继

```python
plan = make_plan("O0")
plan.branches()
classify = plan.listing.function("classify")
[lift_condition(classify, b, "a->balance")[0] for b in plan.branches()]
[(hex(s.pc), s.struct_pointer().field_int("balance")) for s in t.stops_in("classify")]
```

Pour chaque côté de l'entrée, il faut voir les preuves, puis déterminer ce qui se passe.`[e.to_dict() for e in evaluate(plan, t, struct_layout(open("fixtures/account-O0.dwarfdump.txt").read(), "account")) if e.claim.startswith("branch")]`Il n'y a pas de comparaison.

### 实验 C:从未停止的运行

```python
o2 = load_transcript("session-O2.lldb.txt")
len(o2.stops), o2.exit_status, o2.hits()
o2.errors[:3]
make_plan("O2").branches()
rollup(evaluate(make_plan("O2"), o2, struct_layout(open("fixtures/account-O2.dwarfdump.txt").read(), "account")))
```

Avec ses propres mots, explique-le à chacun.`not-observed`Puis ouvre .`account-O2.objdump.txt`, trouver `main`Le centre de l'échange de quatre quantités constantes.`count_tags()` statistique `account-O2.dwarfdump.txt`Le centre`DW_TAG_inlined_subroutine`Il y a une autre.

### 实验 D: preuve de dégâts

```python
text = open("fixtures/session-O0.lldb.txt").read().replace("x1 = 0x0000000000000005", "x1 = 0x0000000000000006", 1)
broken = parse_transcript(text)
[e.to_dict() for e in evaluate(plan, broken, struct_layout(open("fixtures/account-O0.dwarfdump.txt").read(), "account")) if e.claim == "arg-registers"][:2]
```

Modifier un référentiel, on va faire la première article.`arg-registers`记录及汇总变为 `refuted`, les quatre autres entrées sont encore disponibles .`confirmed`                                                                                                                                                                                                                                                              `old value: 250`行, observer `store-once`变为 `not-observed` Impossible d'être délibérément trompé dans le jugement, il n'y a pas de jugement.

Si lldb peut démarrer le processus dans votre coque, finalement fonctionner `python3 main.py live O0`et `python3 main.py live O2`                                                                                                                                                                                                                                                              

## 实践实验

Pour les moteurs augmenter`sum_balances`Conclusion du cycle:

要求:

- Utilisation `conditional_branches()`Dans le`-O0`清单中找到 `sum_balances`Le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de retour, le cycle de la déclin, le cycle de la déclin.
- 增加结论:当 `count`= 3 时, cycle de l'exécution `count + 1`Deuxièmement, c'est le retour de la classe 33 et le retour de l'examen.
-  élargir l'arrêt 子 ou plan, faire 子 dans chaque cycle de l'arrêt de lecture de la machine de calcul de cycle, et de rédaction `_check_loop()`记录计计器值序列──
- Dans l'ordinateur du processus d'initiation, utilisez`python3 main.py capture O0`Récapture de nouveau texte et réécriture de texte. Avant que le document de commande soumis ne soit conforme au nouveau texte, le texte ne sera pas réussi.
- 增加测试, modifier une valeur de compteur dans le registre du cours,并断言结论变为 `refuted`Il y a une autre.

Le succès est: le rapport montre l'ordre de l'arrêt du cycle et la valeur du compteur, et`-O2`运行将新结论 Réservation pour `not-observed`, la raison est que le cycle est éliminé par la météorisation ou la pliage.

## Le produit

本课包含 `outputs/skill-dynamic-analysis-of-your-own-program.md` Utiliser cette liste de processus, de calcul et de conclusions statiques qui seront auto-construites et transformées en un enregistrement de session de la rééducatrice conservée, ainsi qu'un résumé de chaque conclusion, et qui sera accompagné d'un résumé de la fin et de la cause de chaque conclusion non observée.

## 验证

运行演示和确定性套件:

```bash
cd phases/13-tools-and-protocols/42-dynamic-analysis-of-your-own-program
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Il faut le faire, il faut le faire.`code/fixtures/`Le dépôt de la commission de l'enquête a été effectué à l'issue de la réunion.

- 清单解析器 trouver quatre fonctions et leur champ d'application, ainsi que `-O0`Je suis là .`classify`Les deux conditions de l'objectif et de l'ordre
- `tbz w8, #0x1f`提升为 `a->balance >= 0`- Je suis désolé .`subs` `b.le`提升为 `a->balance <= 200`
- `-O0`Je suis là .`main`调用 `bump`Il y a trois fois.`classify`et `sum_balances`- Je suis désolé .`-O2`Je suis là .`main`Il suffit de le faire.`printf`
- x86-64 `j<cc>`助记符 appartient à la condition分支,`jmp`et `callq`Ne fait pas partie
- DWARF 转储产生大小 32 字节、成员位于 0、4、8、16、24 的结构体
- `-O2`DWARF a quatre fils de processus, et zéro fils de processus interconnectés.`nm`仍列出三个函数
- Les deux projets de construction sont liés à la commande de la mise en œuvre de l'ordre.
- `-O0`L'étape de la fonction de prévision est de 10 fois, l'étape de sortie est de 0, contient 4 lignes de sortie.
- 子输出 附加到其后的停止, parmi lesquels `x1`= 5,内存 `x0`开始,并包含标签字符串
- 断点表带解析状态, nombre de fois dans la vie est de 1 、3 、1 、2 、1 、1
- 观察点为 `x0 + 4`处的 4 字节 modifier 类型,命中一次,旧值 250、新值 255,并报告四硬件槽位
- `-O2`Les discussions ne s'arrêtent pas, trois points sont résolus, aucun point d'observation, chacun n'est pas utilisé.`continue`Tout le monde a fait une erreur.
- 沙箱启动在任何停止前因附加错误失败
- base 保存加载往返 `balance`= 250, mais perdu `label`Indice de la ligne
- Python API  sans processus est disponible pour cinq phases 大小 32 和函数范围
- Je peux résoudre le problème .`rdi`- Je suis là.`rsi`et `rip`
- `-O0`Les conclusions sont toutes confirmées, séparément il y a 5、11、3、2、1、1、1 条 条
- Les éléments de preuve indiquant la valeur, les conditions et les limites
- 字段偏移证据通过 DWARF 布局解码各个字
- 存储和步长证据带有新旧值及三行余额
- `-O2`运行反驳调用边,将其他结论保留为未观察
- 修改寄存器值会反驳, deleted observation point命中会未观察,汇总时反驳优先
- 命令映射每行均有gdb 和 lldb 形式,硬件表列出四个x86 调试寄存器
- 演示 Liste des outils manquants au lieu de défaillance, modèle réel par nom rapport outils manquants
- D'après les données de l'image, les deux sessions ont été effectuées en intégrant les mêmes données

## Mode de production environnementale défaillant

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

## 操作准则

Selon le schéma de cessez de faire, de faire une opération en série, de conserver les enregistrements de la réunion et de juger de manière arrêtée chaque fois que vous pouvez vérifier une conclusion statique.

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
