# Réalisation et démonstration des prix:差分测试、字节

> 测通过 测通过 测通过 测通过 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测试 测 测 测试 测 测 测 测 测 测 测 测 测 测 测 测 测 测 测 测 测 测 测 测 测 测 测 测 测 测 测 测 测 测 测 测 

**Type:** Build
**Languages:** Python, C
**Prerequisites:** Phase 13 · 34（提升为伪代码）、Phase 13 · 35（证据、置信度与未知项）
**Time:** ~110 分钟

## Objectif de l'apprentissage

-  selon l'ordre de réécriture de la réalisation de la reconstruction,并指出 its base de preuve de la documentation
- Pour chaque catégorie de risques, il existe un réseau d'entrée: protection de valeur zéro, nombre négatif, décomposition de décomposition à zéro, 32 décomposition et décomposition de pièges.
- Dans le même programme, les fonctions d'origine et de reconstruction sont effectuées en enregistrant chaque unité d'entrée, y compris les pièges.
- Utilisation d'un paramètre de réorganisation, de réorganisation, de réorganisation, de réorganisation, de réorganisation et de réorganisation.
- 读取并比较重定位指向的常量, empêcher une erreur de caractère de la taille de la page.
- Utilisation de serveurs MCP de petits studios et de serveurs de serveurs de clientèle, et enregistrement de chaque étape.
- Il est également possible de décrire les résultats obtenus par la Commission.

##  problématique

Vous allez réellement demander`ledger-x86_64-O1.o`- Je suis là .`percent_change`Le code de C est le code de la C.

```c
int percent_change(int before, int after) {
    if (before == 0) return 0;
    return (int)(((long)after - before) * 100 / before);
}
```

Quatre essais par:`(100, 150)`Je vais avoir 50.`(200, 100)`Je vais me faire 50 !`(0, 5)`- Je vais avoir 0.`(50, 100)`Je suis à 100...`grade`Il est construit sur quatre de 90/80, 70/60.`if`语句, six autres tests ont également été passés.

Mais ce rapport ne répond à aucune des questions suivantes:

- - Je suis là .`(after - before) * 100` Impossible d'utiliser 32 bits quand, la fonction initiale retourne quoi ?
- Le nombre est de 110 , la fonction initiale retourne à quoi ?
- 重建实现能否编译成 原函数相同的16字节?
- Les deux caractères de la fonction compilée suivantes sont-ils répositionnés en même temps en fonction de la même quantité ?
- Quels sont les éléments de preuve qui permettent de rétablir le code ?
- Comment ça va être ?

Le but de cette classe est de mettre en œuvre et de compiler le programme de notre propre initiative.

```figure
re-36-prove-equal
```

## Les preuves montrent ce que c' est .

`code/main.py`Le cycle de l'intelligence par le studio a été émis à six reprises, le record de fonctionnement se situant à 6.5.0 rea.`code/fixtures/runs/agent-run.json` le serveur à`initialize`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `2025-11-25`◊ parmi les trois fois que j'ai utilisé les preuves:

| 步骤 | 工具 | 耗时 | 证据标识符 |
|---|---|---|---|
| 2 | `analyze_function percent_change` | 6.31 秒 | `ev_e88b10dc0c6400e51bb6f7fdc3eaea8d2c97cc02463f0db3e6afeefc273197cd` |
| 3 | `analyze_function grade` | 0.02 秒 | `ev_67b6d3f992eaf49a2e16de084b6ebfdd9884e8c5c7f75e175b7bb20f4f748ce1` |
| 4 | `read_bytes 0x1000b4, 20` | 0.00 秒 | `ev_c26146cfedf4c1ee146d8ff00cfa9a5d3f5335bdd9c97ccf4e1af5f6ea3ed6bc` |

La première fois, le programme de Ghidra a été réalisé pour la première fois.`confidence: "observed"`- Je suis là.`authority: "shipped-artifact"`, ainsi que le dossier de but SHA-256:`9a4a8082ba5e285a732552981a6935e0c5255725664f380e37c44ebfb04d803f` Ghidra 加载可重定位目标文件时,将 `.text`- Je ne sais pas .`0x100000`, donc `percent_change`      `0x100000`- Je suis désolé .`grade`      `0x100010`Il y a une autre.

`long`Je suis venu .`percent_change`Je suis en train de faire une erreur.

```c
undefined1  [16] percent_change(int param_1,int param_2,ulong param_3)
{
  long lVar1;
  undefined1 auVar3 [16];
  if (param_1 != 0) {
    lVar1 = (long)((param_2 - param_1) * 100);
    auVar3._0_8_ = lVar1 / (long)param_1 & 0xffffffff;
    auVar3._8_8_ = lVar1 % (long)param_1 & 0xffffffff;
    return auVar3;
  }
  ...
}
```

Réfléchissez à ce que je vais faire .`cltd`et `idivl`Avec l' écriture`edx`Avec `eax`,便将其建模为使用64位除法16字节返回值──:

```
0x100000: TEST EDI, EDI
0x100002: JZ 0x0010000d
0x100004: SUB ESI, EDI
0x100006: IMUL EAX, ESI, 0x64
0x100009: CDQ
0x10000a: IDIV EDI
0x10000c: RET
0x10000d: XOR EAX, EAX
0x10000f: RET
```

Chaque opération est de 32 places.`IMUL EAX, ESI, 0x64`执行 32 位乘法, seulement conserver la moitié de la partie`CDQ`Il va`eax`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `edx`- Je suis désolé .`IDIV EDI`则使用32位除数去除这个64位寄存器对──按指令清单重建,应使用 `int`type `100 * (after - before) / before`Il y a une autre.

`grade`C'est aussi le cas.`*(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4)`, et donne une de `0x66666667`                                                                                                                                                                                                                                                              `IMUL RAX, RAX, 0x66666667`- Je suis là.`SAR RCX, 0x22`- Je suis là.`SHR RAX, 0x3f`- Je suis là.`ADD ECX, EAX`∞ réaliser à 10 ∞`ADD ECX, -0x6`- Je suis là.`CMP ECX, 0x4`et `JA`Maintenir 10 places à 6 à 10...`XOR EAX, EAX`给出默认值 0`LEA RCX, [0x1000b4]`et `MOV EAX, dword ptr [RCX + RAX*0x4]`读取包含五个 4 字节条目的表――

Pas 4 读出这20 字节:`01000000 02000000 03000000 04000000 04000000`◊表的内容为 `1, 2, 3, 4, 4`, à la suite de 10 affaires 6 ̊7 ̊8 ̊9 ̊10 ̊.`ledger.c`Le centre`switch`, parmi lesquels `case 10`et `case 9`Une valeur commune de 4...

Les deux preuves de la page de réalisme sont de l'ordre de l'exécution et de l'exécution de la quantité ordinaire.`read_bytes`Le code original du DX-Ball n'a pas été introduit.`FUN_00406400(void)`, l'instruction visuelle a été corrigée.

## 编写候选实现

`code/fixtures/candidates/`Le catalogue contient huit réécrits, chaque document une fonction.

| 文件 | 源码 | 作用 |
|---|---|---|
| `percent_change_mul_first.c` | `100 * (after - before) / before` | 指令清单的 C 表达 |
| `percent_change_split.c` | `(after * 100 - before * 100) / before` | 文本不同，clang 折叠后字节相同 |
| `percent_change_wide.c` | `(int)(((long)after - before) * 100 / before)` | 沿用伪代码的 `long`，先除法再截回 |
| `percent_change_div_first.c` | `(after - before) / before * 100` | 先做除法，因此舍入不同 |
| `grade_switch.c` | 带五个分支的 `switch (score / 10)` | 原始源码 |
| `grade_table.c` | `unsigned slot = score / 10 - 6; slot < 5 ? points[slot] : 0` | 指令清单的 C 表达 |
| `grade_thresholds.c` | `if (score >= 90) return 4; ...` | 最高分段没有上界 |
| `grade_case10_wrong.c` | `case 10: return 3;` | 一个表条目错误 |

Chaque dossier est avec des ordres.`clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c`编译――编译后的目标文件与源码一起提交,以便没有克朗的宿主机也能运行测试――

## 1° chemin de l'évaluation: exécuter et comparer

McKeeman a souligné dans sa définition de test de différence de 1998 que les tests générés par des machines doivent être utilisés pour introduire deux ou plusieurs systèmes comparables et qu'ils doivent être considérés comme des candidats à la défaillance. Il a souligné que les problèmes les plus difficiles de l'essai sont les résultats de l'évaluation.

### 设计输入网格

`code/main.py`Le centre`input_grid()`构建 92 个单元──对 `percent_change`Ça prend 10 .`before`La valeur et les sept`after` Value des propriétaires:

```
before: 0, 1, -1, 3, -3, 7, 100, -100, 2147483647, -2147483648
after:  0, 5, -5, 105, 536870911, 2147483647, -2147483648
```

Pour le`grade`, il prend 22 points: chaque point de la frontière, les deux côtés, négatifs, 0, 110 et deux`int`极值──`classify()`Pour chaque unité, le nombre de coups est de 32 à 17 à la limite de 14 à la limite de 12 à la protection de valeur nulle à 7 à la coupe de 5 à la coupe de 2 à la coupe de 2 à la coupe de 2 à la prise de 1 à la prise de 1 à la coupe de 1 à la coupe de 1 à la coupe de 1 à la coupe de 1 à la coupe de 1 à la coupe de 1 à la coupe de 1 à la coupe de 1 à la coupe de 1 à la coupe de 1 à la coupe de 1 à la coupe de 1 à la coupe de 1 à la coupe de 1 à la coupe de 1 à la coupe de 1 à la coupe de 1 à la coupe de 1 à la coupe de 1 à la coupe de 1 à la coupe de 1 à la coupe de la coupe de la coupe de la coupe.

Chaque classe a un but précis.`TEST EDI, EDI`分支── négatif unité de contrôle vers le zéro décomposition:C 和 `idiv`Pour cette raison,`-9 / 10`Pour 0,`-10 / 10`Pour -1──舍入单元检查乘法先于除法, donc `(105 - 100) * 100 / 100`Pour 5 et non pour 0...`(after - before) * 100`超出 32 位── unique piège de l'unité faire revenir le nombre de fois après équivaut à `INT_MIN`, en même temps `before`Pour -1

Yang、Chen、Eide 和 Regehr a construit Csmith, pour générer des procédures d'actions non définies. Les résultats de référence à des actions non définies sont des différences de bruit, ne devraient pas former de défauts de rapport.

### driveurs et pièges

`code/driver.c`De chaque ligne de lecture d'une unité, de sortie, de sortie, de sortie, de résultat initial et de résultat de reconstruction.`build_harness()`- Je veux le faire .`-Dpercent_change=cand_percent_change -Dgrade=cand_grade`编译候选实现, permettant à deux versions de se connecter sous des noms différents dans le même programme.`ledger.c`, rapport de la déclaration`original_kind: fixture-source`Il y a une autre.

驱动程序使用 `sigsetjmp`et `siglongjmp`Montage`SIGFPE`- Je suis un homme.`before = -1`- Je suis là.`after = 536870911`时,差为 536870912,32 位乘积回绕到 -2147483648──在 x86-64 上,`idiv`Il est possible de déduire le nombre de fois par jour, car le processeur ne peut pas utiliser la valeur de 32 bits.`trap`Il y a une autre.

AArch64 上 的 `sdiv`Il est important de noter que les résultats de la mise en œuvre de la Mac64 sont basés sur la structure, et que le rapport doit donc indiquer la structure de la mise en œuvre réelle.

### 结果

`prove_behaviour(PLAUSIBLE)`构建使用 `long`10 exemples simples ont été adoptés, mais 28 unités ont échoué:

| 函数 | 输入 | 类别 | 原始结果 | 重建结果 |
|---|---|---|---|---|
| `percent_change` | 3, 2147483647 | 溢出 | -133 | -1431655899 |
| `percent_change` | 100, 2147483647 | 溢出 | -101 | 2147483547 |
| `percent_change` | 2147483647, 5 | 溢出 | 0 | -99 |
| `grade` | 110 | 超出 switch 范围 | 0 | 4 |
| `grade` | 2147483647 | 超出 switch 范围 | 0 | 4 |

`percent_change`26 fois que j'ai raté tout ça.`|before| > 1`De l'émission de télévision.`before`Pour 1 ou -1 时, 64 bits de trading de revers sont en fait égaux à de revers, donc ces unités ne sont que des coïncidences.`grade`失败, est parce que le changement initial 没有十位商为 11 及以上分支,而 `110 / 10`Pour 11...

`prove_behaviour(EQUAL)` Construction `percent_change_mul_first.c`et `grade_switch.c`, tout 92 unités concordantes.`percent_change_div_first.c`Dans quatre cas simples, j'ai échoué à deux, c'est une erreur que le test de rédaction peut vraiment détecter.

`oracle_disagreements()`Je vais vérifier une autre chose.`percent_change_model()`et `grade_model()`Python 模型, usage `wrap32()`☐ Le nombre de personnes concernées`idiv32()`Exprimer les règles de l'architecture. Le rapport comparant les modèles sur chaque unité avec les résultats initiaux observés réellement.

## Deuxième étape:

Le comportement sur le net est un chemin de vérification. Deuxièmement, il s'agit de la réécrire avec le même compilant et le même paramètre.`compare_functions`Pour la comparaison par étape, il y a des restrictions: 汇编是不透明的提供方文; non possible de réorganiser la normalisation de la localisation.

### 读取目标文件

`code/main.py`Le centre`ElfObject`- Je veux le faire .`struct.unpack_from`读取一个ELF64可重定位目标文件―― il vérifie le nombre de 64 bits`e_machine`62 et `e_type`1, puis à travers le titre,`.symtab`及 chaque `.rela`Dans le milieu,`percent_change`De `.text`Je suis en train de faire un petit tour.`grade`De `0x10`- Je suis un petit garçon.`total`De `0x40`Je commence à 31 ans.`grade_label`De `0x60`Je commence à le faire.

`percent_change`字节为 `85 ff 74 09 29 fe 6b c6 64 99 f7 ff c3 31 c0 c3`, pas de nouveau positionné.`grade`Il y a une section:`0x26`, type `R_X86_64_PC32`, 符号`.rodata`, plus de chiffres .`0x10`Il appartient au mouvement.`0x23`处的 7 字节 `leaq`, ses quatre derniers caractères sont des caractères déplacés.

### Précédent, recompare les données

Dans le RELA 目标文件, le nombre de candidats est conservé dans le RELA 重定位记录, les quatre caractères sont en moyenne zéro.`grade_switch.o`Dans ce cas, même si les deux positions sont orientées vers des positions différentes, la comparaison directe des caractères sera toujours acceptée.`mask_relocations()`仍将两侧字段清零, une méthode similaire peut également être appliquée à la mise en valeur des REL 目标文件和 Mach-O.

         `prove_bytes()`按偏移、类型和目标节比较重定位记录──原始记录为 `.rodata+0x10`, candidat pour`.rodata-0x4`◊ Le nombre de différences est dû au changement de dossier de candidature`labels.rel`表──不同加数 signifie différent décalage, ne signifie pas nécessairement différent de fonction──

### 读取重定位指向的常量

Pour le PC situé à la fin de l'ordre, le code de base est le code de l'adresse de l'ordre, donc le but est de faire un code plus de 4 .`.rodata+0x14`, candidat est`.rodata+0x0`Il y a une autre.`read_table()`De là où je lis cinq 4 caractères, tous les deux sont`1, 2, 3, 4, 4`Il y a une autre.

Numéro 5 vient de l'ordre:`CMP ECX, 0x4` coup de coeur `JA`允许索引 0 à 4, alors`[RCX + RAX*0x4]`Pour chaque indice, on peut lire 4 caractères.`code/main.py`Le centre`CLAIMS`- Je suis en train de le faire .`grade`Cette structure, elle aussi, a été enregistrée.`percent_change`Il n'y a pas de nouveau.

Cette étape est issue d'une défaillance enregistrée par le projet TH08   old comparison method pour remplir l'adresse cible dans le redirectionnaire de l'ordre, mais ne pas vérifier les données de la zone d'affichage de l'adresse  source code `0.0`Ça pourrait sembler objectif.`128.0`完全一致── 修复时审计了1,548 浮点字面量引用, encore rectifié 12 处──`grade_case10_wrong.c`C'est le même type d'erreur de construction de ce cours: son code de 46 caractères correspond à l'original, la structure de l'enregistrement de réposition est la même, mais le code est`1, 2, 3, 4, 3`Seul un contrôle de la quantité peut le faire échouer.

### 结果

| 候选 | 大小 | 屏蔽后的字节 | 重定位记录 | 表 | 状态 |
|---|---|---|---|---|---|
| `percent_change_mul_first` | 16 对 16 | 相同 | 无 | 无 | pass |
| `percent_change_split` | 16 对 16 | 相同 | 无 | 无 | pass |
| `percent_change_wide` | 16 对 26 | 大小不同 | 无 | 无 | fail |
| `percent_change_div_first` | 16 对 18 | 大小不同 | 无 | 无 | fail |
| `grade_switch` | 46 对 46 | 相同 | 结构相同 | 两者均为 `1,2,3,4,4` | pass |
| `grade_table` | 46 对 46 | 相同 | 结构相同 | 两者均为 `1,2,3,4,4` | pass |
| `grade_thresholds` | 46 对 39 | 大小不同 | 1 对 0 | 无 | fail |
| `grade_case10_wrong` | 46 对 46 | 相同 | 结构相同 | `1,2,3,4,4` 对 `1,2,3,4,3` | fail |

Il y a deux résultats qui méritent d'être examinés à nouveau.`percent_change_split.c`Le code source est différent, mais le caractère est tout à fait le même, car le clang aura des symboles qui se déploieront en fonction de l'attitude indéfinie,`after * 100 - before * 100`Je me replie pour une fois.`grade_table.c`Également, les éléments de l'indexation sont également`switch` obtenir le même tableau. 字节匹配: cet éditeur utilise ces paramètres, il va réaliser le candidat compilé en le même code; il ne prouve pas que le candidat est le texte source original.

La page de la preuve de la région a enregistré un candidat de 1 825 caractères, la longueur est correcte mais il y a 467 caractères différents.`wide`Il y a 26 caractères, c'est parce que`movslq`- Je suis là.`imulq`- Je suis là.`cqto`et `idivq`Il y a eu une autre version de la même série, qui a remplacé la version 32 bits.

## 通过 rea 运行 智能体循环

Il y a 65 outils de MCP qui ne répondent pas aux ordres de CLI,`verify_reconstruction`C'est l'un d'entre eux.`code/main.py`Le centre`McpStdioClient`Il est capable de les utiliser sur le plus petit client.`npx -y rea-agents@6.5.0 mcp`, à chaque ligne d'écriture dans un JSON-RPC demande, et dans le fil de la ligne de chaque ligne de lecture d'un objet JSON.`2025-11-25` Envoyer `initialize`, revoir`notifications/initialized`, dernière émission `tools/call` Le temps de démarrage par défaut de chaque appel est de 330 secondes, le même que le temps de démarrage par le Ghidra Froid réellement autorisé.

`agent_loop()`发发出六次调用并记录每一次:

```json
{
  "step": 2,
  "tool": "analyze_function",
  "arguments": {"procedure": "percent_change"},
  "seconds": 6.31,
  "is_error": false,
  "evidence_id": "ev_e88b10dc0c6400e51bb6f7fdc3eaea8d2c97cc02463f0db3e6afeefc273197cd",
  "confidence": "observed",
  "authority": "shipped-artifact",
  "limitations": ["Resolved reference metadata identifies computed, indirect, external, call, jump, and data edges; unresolved targetless flows remain unknown, and function classifications distinguish thunks and externals.", "..."],
  "result_sha256": "..."
}
```

Completé des preuves  enregistrement selon les identifiants présents dans le même document ⋅ réétablissement de la base de la mise en œuvre de la pseudo-code et des instructions ⋅`table_address()`Dans le`grade`清单中找到 `LEA`操作数,并将其传给 `read_bytes`Il y a une autre.`open_binary`- Je suis là.`get_evidence_bundle`et `close_binary`Il n'est pas possible de retourner les données de preuve, donc les identifiants de ses données sont nulles.

Quand le chemin est en haut`npx`, et`GHIDRA_INSTALL_DIR`Il y a une liste de choses à faire.`run_agent(live=True)`Il est également possible de faire des tests de dépistage de la réaction de l'équipe de recherche.`code/tests/fake_rea_server.py`C'est un serveur de remplacement, pour chaque fois.`tools/call`Retour sur les résultats enregistrés de chaque test ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅                                                                                                                                                                                                                      

### Le réel de l'épreuve peut dire quoi, ne peut pas dire quoi

réal `verify_reconstruction`接收指向比较 Évidence de la déclaration,并为每项回归通过、失败或未知──其固定限制为:Pass signifie chaque déclaration de la déclaration都通过; elle ne peut pas établir la réalisation globale du prix égal──`compare_functions`返回的提供方文本; comportement déclarations comparer `compare_process_captures`Les deux parties du processus de retour ont été capturées.`unknown`◊région 内部 没有任何部分会编译重建函数,或在您的输入网格上运行它──本课的两条验证路径,就是真正留给您的工作──

Les obligations de réalisation de l'activité de l'entreprise sont définies dans le rapport de référence.`predicate_type: "rea.reconstruction-proof"`- Je suis là.`operation: "verify_reconstruction_obligations"`- Je suis là.`confidence: "observed"`, ainsi que `normalized_result.passed === true`Il n'y a pas de réel outil public qui génère ce type de documentation.`code/main.py`Le centre`build_proof()`Je vais le générer:

```json
{
  "predicate_type": "rea.reconstruction-proof",
  "operation": "verify_reconstruction_obligations",
  "confidence": "observed",
  "authority": "controlled-replay",
  "normalized_result": {
    "passed": true,
    "status": "pass",
    "claims": [
      {"claim_id": "percent_change.behaviour", "kind": "behavioral", "status": "pass", "evidence_ids": ["ev_e88b10dc..."]},
      {"claim_id": "grade.behaviour", "kind": "behavioral", "status": "pass", "evidence_ids": ["ev_67b6d3f9..."]},
      {"claim_id": "percent_change.bytes", "kind": "structural-function", "status": "pass", "evidence_ids": ["ev_e88b10dc..."]},
      {"claim_id": "grade.bytes", "kind": "structural-function", "status": "pass", "evidence_ids": ["ev_67b6d3f9..."]},
      {"claim_id": "grade.referenced-constants", "kind": "structural-function", "status": "pass", "evidence_ids": ["ev_67b6d3f9..."]}
    ]
  },
  "evidence_links": ["ev_e88b10dc...", "ev_67b6d3f9..."],
  "evidence_id": "ev_..."
}
```

标识符为 `ev_`加记录 deleted SHA-256 de l'identifiant suivant, en utilisant le JSON en forme de clé`aggregate()`adopter le principe conservatoire de défaillance:`fail`优先,其次是 `unknown`,空断言 `unknown`◊ hôtes hôtes                                                                                                                                                                                                                                                            `unknown`Même si deux phrases sont passées, le dossier est toujours en cours.`unknown`Il y a une autre.`authority`Pour`controlled-replay`Parce que la preuve vient de notre propre test drive, pas seulement du dossier de but.

## Les résultats de l'étude montrent ce que

Liu Raff et Micinski ont mesuré en 2026 neuf configurations de huit systèmes anti-compilation. Les candidats à l'ensemble des tests passés par la base de données, qui seront toujours déviés des résultats originaux, ont obtenu une proportion globale de 4,9%, un système atteignant jusqu'à 13%. Sur 300 fonctions de base de données GitHub et 287 fonctions associées à CVE, le modèle le plus fort amélioré augmentera le taux de réussite de la construction de Ghidra de 75% à 90%, mais le taux de correspondance comportementale du même lot de fonctions passera de 74% à 62%. Les raisons de la recherche remontent aux caractères, types, utilisateurs et conditions de protection du modèle conçu, ils ont remplacé les éléments de référence restés dans le code anti-compilation traditionnel.

本课的 `percent_change_wide.c`Il appartient à ce type de fabrication:`long`Les résultats obtenus par l'indicateur peuvent être compilés, mais ne parviennent pas à être compilés sur 26 unités de décomposition.

DecompileBench a mesuré 23 400 fonctions provenant de 130 programmes réels, et a constaté que la fonctionnalité correcte du LLM était inférieure de 52,2% à celle des analogues de classe industrielle, mais que le score compréhensible était plus élevé.

Les trois méthodes de démonstration utilisées dans ce domaine sont les trois voies de validation que vous pouvez construire. Phénix et DREAM reprennent la composition de la sortie et de la mise en œuvre du programme original. McKeeman et Csmith vont générer des entrées par rapport au programme original, tout en limitant les entrées dans la portée définie.

## La construction de soi

运行仅使用标准库的测试框架:

```bash
cd phases/13-tools-and-protocols/36-rebuild-and-prove-equal
python3 code/main.py
```

PATH 上有 clang 时,演示会编译两对候选实现,并为每对运行92个单元;随后重新编译八个候选、重放智能体运行,并生成证明记录──没有 clang 时,读取已提交的目标文件,并将行为断言报告为`unknown`Il y a une autre.

Dans le cadre de la mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de mise en œuvre de la stratégie de la stratégie de mise en œuvre de la stratégie de la stratégie de mise en œuvre de la stratégie de la stratégie de la stratégie de la stratégie de mise en œuvre de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la stratégie de la

```json
{
  "host": "aarch64 Darwin",
  "originalKind": "fixture-source",
  "gridCells": 92,
  "plausible": {"naivePassed": true, "gridMismatches": 28, "oracleDisagreements": 0},
  "equal": {"naivePassed": true, "gridMismatches": 0, "oracleDisagreements": 0},
  "legTwo": {
    "percent_change_mul_first": {"status": "pass", "reasons": []},
    "percent_change_wide": {"status": "fail", "reasons": ["size 16 vs 26 bytes"]},
    "grade_case10_wrong": {"status": "fail", "reasons": ["referenced constants differ: [1, 2, 3, 4, 4] vs [1, 2, 3, 4, 3]"]}
  },
  "agentRun": {"mode": "replayed fixture", "server": {"name": "rea", "version": "6.5.0", "protocolVersion": "2025-11-25"}},
  "proof": {"status": "pass", "evidence_id": "ev_..."}
}
```

按以下顺序阅读 `code/main.py`- Le numéro de la liste:

1. `wrap32()`- Je suis là.`c_div()`- Je suis là.`idiv32()`Et deux`*_model()`函数实现指令清单的整数语义──
2. `input_grid()`et `classify()`构建并标记 92 个单元──
3. `build_harness()`et `execute()`L'équipe de réécriture de la liste des candidats`driver.c`编译成一个程序,然后运行各单元──
4. `prove_behaviour()`返回第一条 验证路径报告, incluant des projets et des modèles non conformes
5. `ElfObject`读取文件头、符号和 `.rela`记录;`mask_relocations()`et `read_table()`Pour comparer les préparatifs...
6. `prove_bytes()`Retour à la deuxième section Rapport sur les méthodes de vérification, y compris la taille, la couverture, la structure et la structure de réposition.
7. `McpStdioClient`et `agent_loop()`驱动 rea 并记录每一步──
8. `build_proof()`et `aggregate()`Il a été créé en utilisant le principe conservateur de l'échec.

## Utilisez-le

Pour prouver une nouvelle fonction et prix, reprendre les étapes suivantes:

1. 获取该函数 的 `analyze_function`结果并记录证据标识符──先读指令清单,再读伪代码──
2. 按清单中操作的位宽编写候选实现──保留原始函数名──
3. L'ajout permet de faire entrer chaque opération dans le réseau environnant son emplacement.
4. Pour chaque comparaison de la liste, ajouter des entrées de deux côtés.`grade`, ils sont les 6 et 4 de la diminution de la loi.
5. Ajouter chaque possible débit de pièges sur l'objectif, et enregistrer la structure du réseau.
6. 运行两条验证路径,先看原因,再看状态──
7. La preuve de l'existence de candidats à l'épreuve de la présidence`evidence_links`Dites à l'étudiant qu'il est en train de faire des déclarations.

Chaque fois que le compilateur est mis à jour, il est réutilisé à deux niveaux.

## 交互实验

### 实验 A: modèle avec fonctionnement

Dans le`code`Pour le démarrage de Python:

```bash
cd phases/13-tools-and-protocols/36-rebuild-and-prove-equal/code
python3 -q
```

运行:

```python
from main import *
percent_change_model(3, INT_MAX)
percent_change_model(-1, 536870911, "x86_64")
percent_change_model(-1, 536870911, "aarch64")
report = prove_behaviour(PLAUSIBLE)
report.naive_passed, len(report.mismatches), report.mismatches[0]
```

La première fois, on obtient -133, c'est-à-dire à revenir en arrière par multiplication par 3; la seconde fois, on obtient.`'trap'`Le rapport montre que 10 exemples simples de défaillance ont été adoptés.`report.oracle_disagreements`Comparer avec la liste de l'air

### 实验 B:读取目标文件

```python
obj = ElfObject(ORIGINAL_OBJECT)
grade = obj.function("grade")
grade.size, grade.data[0x26:0x2a].hex(), grade.relocations
read_table(obj, grade.relocations[0], 5, 4)
```

字段字节为 `00000000` Références`.rodata`, pour le plus grand nombre`0x10`, pour le contenu`[1, 2, 3, 4, 4]`Il y a une autre.

### 实验 C: détruire une quantité constante

```python
report = prove_bytes("grade", CANDIDATES / "grade_case10_wrong.o")
report.masked_equal, report.relocations_match, report.tables_equal, report.reasons()
```

字节匹配、记录匹配, mais le tableau ne correspond pas.`grade_case10_wrong.c`Je vous en prie .`case 10`重新返回 4, utiliser 具命令 重复编译, observer état changer `pass`Il y a une autre.

### 实验 D: action de réaction

Installation réelle 6.5.0 et Ghidra 12.1.4 后:

```bash
GHIDRA_INSTALL_DIR=/opt/homebrew/Cellar/ghidra/12.1.4/libexec \
JAVA_HOME=/opt/homebrew/opt/openjdk@21 \
python3 code/main.py --live
```

La première fois .`analyze_function`Il faut quelques secondes, car Ghidra est en train d'importer le fichier cible. Les nouveaux identifiants de données seront comparés à ceux qui ont été soumis.

## 实践实验

Les deux voies de vérification se sont étendues à la même file d'objet.`total`et `grade_label`Il y a une autre.

要求:

- Pour le`total`, pour les composants et les composants, pour les composants et les composants, pour les composants et les composants, pour les composants et les composants, pour les composants et les composants, pour les composants et les composants, pour les composants et les composants, pour les composants et les composants, pour les composants et les composants, pour les composants et les composants, pour les composants et les composants, pour les composants et les composants, pour les composants et les composants, pour les composants et les composants, pour les composants et les composants, pour les composants et les composants, pour les composants et les composants.
- Pour le`grade_label`, fonction intègre`grade`,并读取 `labels.rel`Il s'agit d'une table composée de cinq lignes de décalage par rapport à la lettre.`.rela.rodata`Le centre a ses propres positions de repère.
- Pour`grade_label`添加一条  Je suis là`CLAIMS`, contient deux lignes de repli et cinq lignes de 4 lignes de la liste des lignes de référence, et compare les lignes de référence à la ligne de référence.
- Si le modèle et le fonctionnement ne sont pas en accord sur certaines unités, enregistrer ces unités et les expliquer en fonction des instructions.
- Dans le dossier de preuve, pour chaque chemin de vérification de chaque fonction, ajouter une affirmation, et faire en sorte que le système soit toujours en phase avec le principe conservateur de défaillance.

Success standard: preuve enregistré liste quatre fonctions, chaque affirmation sont portées avec un identifiant de preuve, et laisser un étiquette string différent lorsque `grade_label`Il ne peut pas.

## 输出技能

本课产 出 `outputs/skill-rebuild-and-prove-equal.md` Utiliser le document de fonction et le candidat pour la reconstruction de la structure de la preuve et de la preuve de deux voies.

## 验证

运行演示和测试套件:

```bash
cd phases/13-tools-and-protocols/36-rebuild-and-prove-equal
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

35 项测试证明:

- `c_div()`à l'écart,`wrap32()` Suivre les règles du code
- 模型对 `(3, INT_MAX)`Je suis en train de faire une erreur.`trap`Je suis en train de faire un test.
- Il y a 92 unités qui couvrent chaque catégorie de risques, et les exemples simples évitent toutes les catégories difficiles.
- ELF  Reader dans les enregistrements de déviation et de taille trouver quatre fonctions
- `percent_change`Pour 16 字节 et sans lourd poste,`grade`Dans le`0x26`Il y a une section.`R_X86_64_PC32`
- Le contenu du RELA ne changera rien dans le fichier objectif.
- Tous les huit candidats soumis ont atteint l'état prévu et ont donné les raisons du dossier.
- `grade_case10_wrong`                                                                                                                                                                                                                                                              
- 已记录的第一条路径运行显示十个简单使用例通过、28个不匹配项、零模型分歧
- Lorsqu'il existe un compteur, les deux réalisations reconstruites et fonctionnelles obtiennent toujours les mêmes résultats.
- 智能体运行 定位已提交目标文件,顺序正确,每个证据 步骤都带有 `ev_`标识符
- `read_bytes`记录与 ELF 读取器找到的表相同
- serveur client-driven simulé, identifiant de preuve identique à la réalité du processus
-  serveur erreur résultat entraîneur de l' enregistrement de fonctionnement
- `aggregate()`adopter le principe conservatoire de défaillance, démontrer que les identifiants peuvent être recalculés par le contenu

## Mode de défaillance dans l'environnement de production

| 失败 | 不严谨的报告会说什么 | 测试框架必须证明什么 |
|---|---|---|
| 重建保留反编译器的 `long` | “十个测试通过” | 26 个溢出单元与原始结果不同 |
| 用阈值替代 switch | “每个分数段都通过” | 原始实现在 110 及更高输入上返回 0 |
| 先除后乘 | “公式在代数上等价” | 舍入单元不同，简单用例失败 |
| 跳过陷阱单元 | “没有崩溃” | x86-64 触发 `#DE`，AArch64 返回 `INT_MIN`，报告说明宿主架构 |
| 不屏蔽就比较字节 | “字节相同” | 重定位记录指向不同偏移 |
| 只屏蔽，不读常量 | “屏蔽后字节相同” | `1,2,3,4,3` 与 `1,2,3,4,4` 不同 |
| 把大小当接受标准 | “长度相同” | 相同长度内仍有不同字节 |
| 编译器或参数不同 | “字节不同，重建错误” | 相同源码会生成不同字节，因此该比较无效 |
| 将模型当作观察 | “模型一致” | 运行是观察，模型是推导，并列出分歧 |
| 断言没有证据标识符 | “已验证” | 每项断言链接到所覆盖函数的 `ev_` 记录 |
| CI 宿主机没有编译器 | “通过” | 行为断言为 `unknown`，汇总也为 `unknown` |
| 将伪代码视为源码 | “反编译器说是 long” | 清单显示 `IMUL EAX`、`CDQ`、`IDIV EDI` |

## 操作准则

根据指令清单编写重建实现,并指出源记录――在能让每个中间值回绕、跨越每个比较常量的输入网格上,与原始实现对照运行――使用原始参数重新编译,屏蔽重定位字段,比较记录,再读取它们指向的常量――为每一个断言记录证标识符,让未经验证的断言继续保持未知――

## 延伸阅读

- [McKeeman, Differential Testing for Software, Digital Technical Journal 10(1), 1998](https://www.cs.tufts.edu/comp/150FP/archive/bill-mckeeman/DifferentailTesting.pdf)
- [Yang, Chen, Eide, Regehr, Finding and Understanding Bugs in C Compilers, PLDI 2011](https://doi.org/10.1145/1993498.1993532)
- [Ramos, Engler, Practical, Low-Effort Equivalence Verification of Real Code, CAV 2011](https://doi.org/10.1007/978-3-642-22110-1_55)
- [Schwartz, Lee, Woo, Brumley, Native x86 Decompilation Using Semantics-Preserving Structural Analysis, USENIX Security 2013](https://www.usenix.org/conference/usenixsecurity13/technical-sessions/presentation/schwartz)
- [Liu, Raff, Micinski, When LLM Decompilers Recompile More and Preserve Less, arXiv 2609.05370, 2026](https://arxiv.org/abs/2609.05370)
- [Gao et al., DecompileBench, Findings of ACL 2025](https://aclanthology.org/2025.findings-acl.1194/)
- [Tan et al., LLM4Decompile, arXiv 2403.05286, 2024](https://arxiv.org/abs/2403.05286)
- [System V gABI, Chapter 4, Relocation](https://www.sco.com/developers/gabi/latest/ch4.reloc.html)
- [x86-64 psABI repository, relocation types](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Intel 64 and IA-32 Architectures Software Developer's Manual, Volume 2, IDIV](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [Arm Architecture Reference Manual for A-profile, DDI 0487, SDIV](https://developer.arm.com/documentation/ddi0487/latest)
- [rea 6.5.0 MCP contracts](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/mcp-contracts.md)
- [rea 6.5.0 reconstruction obligation ledgers](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/reconstruction-obligation-ledgers.md)
