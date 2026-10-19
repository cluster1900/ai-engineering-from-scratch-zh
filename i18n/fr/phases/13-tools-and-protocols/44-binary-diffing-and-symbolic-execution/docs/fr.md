# Deuxièmement différence par rapport à l'exécution des symboles: fonction de correspondance et demande de résolution

> La correspondance de deux fonctions, est une conclusion donnée par une certaine signature; la recherche de solution d'entrée, est un modèle de conditions de cheminement de certaines étapes.

**Type:** Build
**Languages:** Python, C, x86-64 assembly, Java (one Ghidra script)
**Prerequisites:** Phase 13 · 33（反汇编与控制流）、34（提升为伪代码）、36（重建并证明等价）
**Time:** ~150 分钟

## Objectif de l'apprentissage

- De l'objectif de document et de liste de construction de cinq types de signature de fonction: préciser les caractères, éviter de repositionner les caractères, contrôler les séquences de caractères et les noms de symboles.
- 运行 BinDiff 风格的分阶段贪心匹配器, uniquement lorsque la signature est unique des deux côtés, et enregistrer la qualité et la qualité de chaque étape de la correspondance.
- 复现两个字节完全相同的函数在加载映像上无法通过字节关联器、屏蔽后却能通过情况,并使用重定位算术解释四个变化字节──
- Selon Levenshtein, le ratio de similitude de radiff2 à distance de réaction n'explique pourquoi un seul de ces ratios n'est apparu qu'à 82 cycles de l'arrivée réelle du radar2.
- Dans les petites IR, les routes de fonction sont soumises à des conditions pour chaque route et les éléments de recherche sont utilisés pour chaque élément de recherche.
- La mesure a une explosion de la trajectoire dans le cycle de bordure symbolique, et elle a une quantité de catégories et de modèles avec angr 10.0.3、z3 5.1.0 comparer.

##  problématique

Vous êtes`-O2`Il a été reconstruit.`ledger.c`, agent d' interrogatrice 相比 `-O1`construction ou évolution agent 运行差异工具后报告 `grade`Il a été modifié, car il diffère des caractères des deux programmes chargés. Il utilise ensuite le budget d'analyse, expliquant un changement qui n'existe pas.`grade`Les 46 caractères sont exactement les mêmes.`-O2`程序的 `.rodata`后移了 0x70 字节, donc `grade`Un déplacement a augmenté de 0x70:

Le même jour après midi, tu me demandes quel est le score ?`grade`返回 4──agent 阅读伪代码 答案后90──这是一个答案──函数对90至109的每个分数都返回4,而问题没有限制边界,所以你需要的是集合,agent却给了一个样本──

 Deux types d'échecs proviennent du même défaut: l'ajustement et la recherche de solutions sont derrière les méthodes de support de la conclusion

```figure
re-44-matches-and-paths
```

## La signature de la fonction est la conclusion de la qualité

Flake décrit en 2004 le système de comparaison à deux types de fichiers similaires comme: construire et construire entre deux ensembles de fonctions exécutables. Dullien et Rolles en 2005 l'élargissent à des blocs et des instructions de base. Le concept de page BinDiff décrit la stratégie qui en est issue: calculer une propriété de chaque fonction sur les deux côtés; si une valeur apparaît une fois sur chaque côte, il se compose de manière à se correspondre; plusieurs valeurs sont différenciées, il faut continuer à se diviser dans cette propriété de l'utilisation de la même classe de prix; aucune valeur de l'objet reste incohérente. Après chaque tour, les nouveaux utilisateurs et les utilisateurs sont formés en petit ensemble, l'attribut suivant est le seul possible, puis le processus de répétition de la propriété suivante.

Chaque algorithme de correspondance est qualifié. Cette page donnera une évaluation très bonne de la correspondance et du nom de la partie numérique de la fonction initiale.

Le présent cours conserve cinq attributs, ainsi que l'une des règles les plus importantes: les deux côtés sont uniques, sinon non correspondants.

## Il y a cinq signatures dans un enregistrement de fonction

差异比较器为每目标文件读取两类信息──ELF 提供字节、符号大小和 字节、符号大小和 字符`.rela.*`记录;`llvm-objdump -d`L'écriture de l'article 33 de la loi de l'Union européenne sur les droits de l'homme et de la femme a été mise en œuvre dans le cadre de la procédure de révision des droits de l'homme et de la femme.`function_record()`Check whether the character of each item of listing instructions is equivalent to the character of the target file to the address address, or else throw out abnormal──:

É`ledger-x86_64-O1.o`Le centre`grade`Par exemple, les symboles donnent un décalage de 0x10、 grandeur 46, de sorte que les enregistrements couvrent 0x10 à 0x3e, ne comprennent pas les deux caractères de la fonction suivante.`nop`Il y a une autre.

精确字节签名是这46字节的 SHA-256──屏蔽字节签名先将每个重定位字段置零──这里只有一个字段:偏移 0x36 处的记录`R_X86_64_PC32 .rodata+0x10`, large, est 0x33 处 `leaq (%rip), %rcx`Dans le RELA 目标文件, ces quatre caractères sont originaux de zéro, donc les deux signatures de chaque fonction du RELA 目标文件 sont consensuelles.

助记符签名对以下14 助记符的序列取哈希:

```text
movslq imulq movq sarq shrq addl addl xorl cmpl ja movl leaq movl retq
```

La signature est issue des blocs de base et des types de bord du 33e cours et ne contient que des blocs accessibles à l'entrée.`-O1`Je suis là .`grade`Il y a trois blocs, trois côtés.`ja 0x3d`结尾,有一条跳转边和一条顺序落下边;块 0x31 顺序进入 0x3d;0x3d 返回──度序列按排序后的顺序列出各块的(入入,出),因此签名为`3b 3e [0/2,1/1,2/0]`Pour moi.`-O0`Je suis là .`grade`Comme le 33e cours, il y a cinq.`.rela.rodata`条目解析间接跳转, obtenir 8 blocs 十一条边, dont 4 条是`table`Je suis là.

Le nom de la signature est le nom de la signature.

Il y a aussi un passage pour les cas de correction ultérieurs.`.rodata``lea`Lors du chargement des indices et des contrôles de bord,`referenced_table()`按第 36 课的方式读取表:`ja`Il y a une autre`cmpl $0x4`Je veux dire, 5 articles, chargement `movl (%rcx,%rax,4), %eax`Indiquer chaque four-ligne`-O1`Je suis là .`grade``.rodata+0x14`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `1, 2, 3, 4, 4`Il y a une autre.

## 贪心匹配器

`match_functions()`按顺序运行各阶段──每个阶段按该阶段签名分别对两侧未相匹配的函数分组,接受所有在每侧恰有一个函数的值──相匹配记录阶段、阶段质量、其他同样一致的签名,以及相似度比例──

```python
for stage in order:
    for signature, candidates in left_groups.items():
        partners = right_groups.get(signature, [])
        if len(candidates) != 1 or len(partners) != 1:
            continue
        a, b = candidates[0], partners[0]
        agreeing = [s.id for s in STAGES if a.signatures()[s.id] == b.signatures()[s.id]]
        matches.append(Match(a, b, stage, agreeing, radare2_ratio(a.raw, b.raw), data_equal))
```

Le cours est organisé en quatre étapes, puis en quatre étapes, puis en quatre étapes, puis en quatre étapes.`-O1`Avec `-O2`Par exemple:

| 函数 | 阶段 | 一致的签名 | 相似度 |
|---|---|---|---|
| `percent_change` | 精确字节 | 全部五种 | 1.000 |
| `grade` | 精确字节 | 全部五种 | 1.000 |
| `total` | 名称 | 仅名称 | 0.171 |
| `grade_label` | 精确字节 | 全部五种 | 1.000 |

`total`De 31 字节、13 条 instruction augmente à 140 字节、41 条 instruction, car clang utilise SSE2 vers le cycle quantification, et a conservé le cycle de l'échantillonnage. Sa forme passe de 5 blocs à 10 blocs.

Pour le`-O0`Avec `-O1`, le même ordre génère une erreur de correspondance:

| -O0 函数 | 匹配的 -O1 函数 | 阶段 | 名称一致 |
|---|---|---|---|
| `percent_change` | `grade_label` | 流图形状 | 否 |
| `grade` | `grade` | 名称 | 是 |
| `total` | `total` | 名称 | 是 |
| `grade_label` | 未匹配 | | |

`-O0`Je suis là .`percent_change`Il est en train de faire un test.`before == 0`, deux branches de bras, re汇合回归──其度序列为 `0/2, 1/1, 1/1, 2/0`Il y a une autre.`-O1`Je suis là .`grade_label`Je suis en train de le faire.`grade`La forme est unique sur les deux côtés, la règle l'accepte.`grade_label`, conduit à une véritable`percent_change`et `grade_label`配对保持未匹配──

存在真名时,BinDiff 顺序将名称匹配放在第二阶段,代码中 `BINDIFF_ORDER`C'est aussi ça.`-O0`函数都按名称匹配到其 `-O1`版本, c'est aussi le résultat de la Ghidra.`if`et `else`La forme de la tête.

## Parallèlement, nombre d'opérations après le répositionnement

Ghidra 导入目标文件当应用重定位,因此其字节关联器比较加载后的影像,第36 课也正因如此屏蔽重定位字段──`load_image()`复现导入过程: selon le niveau de l'ordre dans le niveau de la distribution, selon le niveau de l'individu`sh_addralign`Pour les autres, il faut commencer par 0x100000; puis appliquer chaque enregistrement:`R_X86_64_PC32`et `R_X86_64_PLT32`Il va`S + A - P`写为有符号 32 valeur de point,`R_X86_64_64`Il va`S + A`写为 64 位值──

Chaque étape de chaque programme est en phase avec Ghidra 12.1.4, un test kit pour la capture de la version de suivi de la sortie de contrôle:

| 节 | `-O1` 程序 | `-O2` 程序 |
|---|---|---|
| `.text` | 0x100000，159 字节 | 0x100000，271 字节 |
| `.rodata` | 0x1000a0 | 0x100110 |
| `.rodata.str1.1` | 0x1000f0 | 0x100160 |

`-O2`Je suis là .`.text`增长 112 字节,即 `total`De plus, il y a des taux de croissance.`.rodata`后移 0x70 字节──两个程序的 `grade`La ville est située à 0x100010...`leaq`Le nombre de positions est de 0x36, l'ordre se termine par 0x3a.`.rodata+0x14`Il y a une autre.

Dans le`-O1`Dans le film:`0x1000a0 + 0x14 - 0x10003a = 0x7a = 122`Dans le monde entier.`-O2`Dans le film:`0x100110 + 0x14 - 0x10003a = 0xea = 234`◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊     ◊ ◊     ◊                                                                                                                                                                                                                                          `7a 00 00 00`, un autre pour `ea 00 00 00`∼46 字节中一个字节不同,Levenshtein 比例为0.978,精确字节阶段失败;屏蔽字节阶段将字段清零后通过──`grade_label`Le tableau se déplace également par 0x70, de sorte que le déplacement reste le même, en passant par un correspondement exact entre les deux images.

Ghidra  rapport identique `-O1`Avec `-O2`,Excès de fonction par bits correspondant 找到 `percent_change`et `grade_label`;Instructions de fonction exacte correspondant 额外找到 `grade`; Exact Function Mnemonics Match  trouver les mêmes trois fonctions。 instruction connecté apparatus de protection opératoire, donc couvrir le lieu de déplacement。

réa 6.5.0 `compare_functions`Pour le fournisseur de texte, la normalisation de la relocalisation est indisponible.

## radiff2 测量 quoi

Radar2 6.2.4  fourni `radiff2` utilisation `-AC`时, il analyse deux fichiers, imprimant une ligne pour chaque fonction: gauche grandeur et adresse, MATCH ou UNMATCH, proportion, droite grandeur et adresse, pour la capture de la ligne suivante:

| 比较对 | `percent_change` | `grade` | `total` | `grade_label` |
|---|---|---|---|---|
| `-O0` 对 `-O1` | UNMATCH 0.130435 | UNMATCH 0.426829 | UNMATCH 0.106061 | UNMATCH 0.269841 |
| `-O1` 对 `-O2` | MATCH 1.000000 | MATCH 1.000000 | UNMATCH 0.171429 | MATCH 1.000000 |
| `-O1` 对 `-O1` | MATCH 1.000000 | MATCH 1.000000 | MATCH 1.000000 | MATCH 1.000000 |

Résultats de la recherche`1 - distance / max(len_a, len_b)`, dont la distance est la distance entre deux traits de fonction Levenshtein, traits de distance sont selon l'ordre de l'adresse`code/main.py`Le centre`radare2_ratio()`Pour réaliser la même formule, la section numérique initiale sera 0.130435、0.1060、610,269841 和 0.171429 复现到小数点后六位──

Il est impossible de le réécrire.`-O0`Je suis là .`grade`Le nombre de radios est de 0,426829[6].`118`, mais son index est plus court. Il ne peut pas résoudre le tableau de bord, donc l'analyse ne peut atteindre que le bloc d'entrée.`jmpq *%rax`終的块、默认分支和回归:共 82 字节,正是第 33 课普通回归下降认定的那82 字节──这82 字节与 `-O1`Levenshtein est à 47 km de la ville de Levenshtein.`1 - 47/82 = 0.426829`Il est utilisé.`-e bin.relocs.apply=true`后,radare2 找到全部 118 字节,打印 0.288136,等于本课对重定位影像计算的比例;四位移字节在影像中的不同于目标文件的零字段――只有比较相同字节时,两种工具才一致,而大小列不说明实际输入了哪些字节――

`-O`La ligne d'ouverture est défini comme un code d'exploitation.`-O0`Pour le`-O1`Le taux de croissance est passé à 0,239130 ̊ 0,512195 ̊ 0,303030 ̊ 0,523810 ̊;`total`Dans le`-O1`Pour le`-O2`时提高到0.192857── peut également calculer la distance de l'ensemble du fichier:`-s`(Myers) rapporté deux objectifs de similitude de 0,956 ≈ distance de 162;`-ss`(Levenshtein) rapport 0.927 和 137── ces valeurs numériques contiennent tête、符号表和重定位节, ne peuvent pas expliquer la situation de la fonction──

## Ghidra Version Tracking 关联器

Ghidra's Version Tracking 工具通过关联器将源程序与目标程序匹配──函数关联器包括 Exact Function Bytes Match、Exact Function Instructions Match(屏蔽操作数)、Exact Function Mnemonics Match,以及 Duplicate Function Instructions Match(1:N 和 N:M)──数据关联器包括 Exact、Duplicate 和 Similar Data Match──符号关联器按名称精确、重复或相似已匹配──引用关联器使用已接受更多匹配──目标程序必须定义函数,最小函数长度默认为10 字节──Auto Tracking 依次运行了 Exact Name、Data、Exact Function Bytes、Exact Function Instructions、Exact Mnemonic Duplicate Function隐关联器, 引用关联器, 引用关联器, 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用 引用

Cette classe est utilisée pour capturer les connecteurs et les sorties.`capture_ghidra_vt.sh`Les trois objectifs du projet`ListVersionTrackingMatches.java`                                                                                                                                                                                                                                                              `AbstractGhidraVersionTrackingScript`, selon le processus de routage et de suivi des versions automatiques, fonctionne en ordre de six connecteurs non-cités et est imprimé en ligne pour chaque bloc, fonction, connecteur et correspondance.

| 关联器 | `-O0` 到 `-O1` | `-O1` 到 `-O2` |
|---|---|---|
| Exact Symbol Name Match | 4 个函数 | 4 个函数、5 个数据项（`labels.rel`、`.L.str.1` 至 `.L.str.4`） |
| Exact Data Match | 0 | 0 |
| Exact Function Bytes Match | 0 | 2（`percent_change`、`grade_label`） |
| Exact Function Instructions Match | 0 | 3（增加 `grade`） |
| Exact Function Mnemonics Match | 0 | 3 |
| Duplicate Function Instructions Match | 0 | 0 |

De `-O0`À la`-O1`, chaque fonction change, donc il est simplement appelé correspondance, c'est aussi le résultat de ce matériau de classe à l'aide de BinDiff  séquence ⋅. chaque correspondance imprime une similitude de 1.000, une similitude de 10.000, une similitude de 1.0, une similitude de 1.0, donc le schéma de la similitude d'imprimer une similitude de 1.0 est un problème ouvert qui n'est pas résolu dans ce cours.

Les différences de programme ci-dessous sont une autre chose. Il s'adresse à deux programmes du même espace d'adresse, comparant les caractères, les étiquettes, les unités de code, les citations et les fonctions à l'adresse même.

## Selon le document, connaître Diaphora et Binary Ninja

Diaphora est un plug-in IDA Pro, publié pour la première fois en 2015, à compter de 2026-08-18 pour 3.4.2♦ à partir de 2.0 adopter AGPL-3.0, nécessite IDAPython, donc fonctionne dans IDA Home ou IDA Pro, ne peut pas fonctionner dans IDA Free♦ il exportera chaque base de données vers SQLite, en fonction de la mise en œuvre de SQL 查询♦ chaque type de mise en œuvre est nommé Best/Partial/Unreliable 类别、比例类型, ainsi que SAME_CPU ou SLOW 等可选块标志♦ Le nom du code source est similaire à ce stade, mais plus:Bytes hash Same and mnemonics Same sorted assemblyMnemonics small-prime-product Same nodes, ed, loops and Top components Top-speed R, ainsi que des fonctionnalités de mise en œuvre non fiables R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R,R,R,R,R,

2026-09-03 发布的Binary Ninja 6.0 加入 Binary Similarity 框架,包含 provider 和 resolver。 il va utiliser BinDiff 作为结构供应商,并提供 WARP,用于容忍可重定位操作数的精确函数匹配。指南建议: fonction à l'exception de commandes de localisation可重定位外一致时使用 WARP; encore rester en contact structurel après avoir été recompilé 随时使用 BinDiff。 Cette fonction est limitée à la seule version ∞

BinDiff est disponible depuis 2023-09-25 en Apache-2.0 open source, la dernière version est disponible en version 8.♦ Il a besoin d'un rédacteur de devis et d'un plug-in BinExport, qui prend en charge IDA Pro 9.4 ou une nouvelle version.

## Parallèlement, différent de la quantité habituelle

Section 36 Réserve une`grade`候选重建, son dernier épisode est de 3, tandis que la valeur initiale est de 4.`grade_case10_wrong.o`Avec `-O1`Je suis là .`grade`具有完全相同的46 个代码字节──匹配器按精确字节配对,所有签名一致──引用表检查通过一个重定位读出 `1, 2, 3, 4, 4`, par une autre lecture `1, 2, 3, 4, 3`, rapport `dataEqual: false`                                                                                                                                                                                                                                                              `-O1`函数在左侧不匹配, car le dossier cible de candidature n'a qu'une seule fonction。

C'est la forme typique de l'analyse des correctifs. Les comparaisons de fonction de la section de code sont sans changement.

## 符号执行: route, conditions et résolutions

King décrit en 1976 l'exécution des symboles. Les entrées sont transformées en symboles, chaque phrase renouvelle le stockage des symboles, chaque branche se soumet à des conditions d'adhésion du chemin, demande le débat de la possibilité d'un chemin, et produit des entrées spécifiques exécutées le long du chemin.

Baldoni、Coppa、D'Elia、Demetrescu 和 Finocchi a résumé le domaine en 2018[3]. Son 5e paragraphe souligne que le cheminement explose est le coût central: l'exécuteur peut être distribué dans chaque branche, de sorte que le nombre d'états peut augmenter de manière exponentielle; si le cycle frontalier dépend de l'entrée des symboles, il se produit un ensemble de chemins sans limites。 Les mesures de réduction comprennent: chaque branche de recherche de solution et de découpe des chemins inaccessibles, des fonctions et des cycles résumé de l'état proche, ainsi que la mise en œuvre mixte en même temps spécifique et des symboles, enregistrer les conditions de fonctionnement spécifiques, en prenant une, la requête de réaction des analystes en fonction d'une entrée.

KLEE(Cadar、Dunbar、Engler,OSDI 2008) est le code bit de LLVM, donc l'entrée est `clang -emit-llvm`Il fournit un modèle et une base de données POSIX  environnementales  en 89 programmes GNU, il atteint un taux de couverture de 84,5%  en 67,7% par les développeurs, et il a trouvé 56 défauts graves  KLEE 3.2  en 2025-12-23  publié, en adoptant la licence NCSA  en recommandant LLVM 16 ⋅

L'équipe de formation de la Commission européenne a été créée pour la première fois en juin.`angr.Project`包含映射目标文件并应用重定位的 CLE 加载器,将块转换为 VEX IR(`block.vex`) de l'équipement de mise à niveau, de l'équipement de remplacement du code pipeline, ainsi que de l'usine de l'état.`SimState`保存寄存器、内存和求解器──`SimulationManager`Pour le nom`active`- Je suis là.`deadended`- Je suis là.`found`- Je suis là.`avoided`et `errored`De l'état de la collection`explore(find=..., avoid=...)`Le système de traitement de l'unicorne de données spécifiques, le dernier retour à VEX, la clarté est la première partie de la demande de résolution de Z3, en angr 10.0`from angr import claripy`导入. ・angr 10.0.3 于 2026-10-10 上传, adoption de la clause BSD-2, nécessite Python 3.12 或更新版本──Z3 5.1.0 于 2026-08-16 发布, adoption du MIT, 是angr、Triton以及 KLEE 可选后端后背的求解器──

## Basé sur le 34ème cours IR de petit exécuteur

`code/main.py`Le système d'exécution utilise des IR de petite taille, en termes de forme de phrase correspondant au 34e cours:`Assign`- Je suis là.`Branch`- Je suis là.`Jump`- Je suis là.`Return`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,`Switch`终结指令──表达式包括 `Const`- Je suis là.`Var`、 la largeur `Bin`- Je suis là.`Cast`、 de nom spécifique `Load`et `Not` Quatre exemples de fonction sont atteints après la simplification de la classe 34 au niveau de l'amélioration manuelle, en ce moment.`0x66666667`乘法已变为 `score / 10`, chaque bloc de l'IR sont classés en directrices de référence.`check_ir_against_listing()`断言这些地址恰好覆盖函数清单一次──

Le IR`-O0`Je suis là .`grade`- Le numéro de la liste:

```text
0x30: local_8 = score; local_10 = score / 10 - 6; if (local_10 >u 4) goto 0x9a else 0x62
0x62: switch local_10 -> 0x91, 0x88, 0x7f, 0x76, 0x76
0x76: local_4 = 4; goto 0xa1        0x7f: local_4 = 3; goto 0xa1
0x88: local_4 = 2; goto 0xa1        0x91: local_4 = 1; goto 0xa1
0x9a: local_4 = 0                    0xa1: return local_4
```

Le but est de`jump_table_targets()`Il est donc possible de faire des calculs de positionnement de la même manière que dans le chapitre 33.

`execute()`L'état contient les blocs actuels, les blocs de trajet, la liste des conditions, ainsi que la mise en place de chaque variable pour le cadre de l'expression de l'environnement.`Assign`L'environnement est une source d'expression et de conservation des résultats.`Branch`Une fois ajouter une condition, une fois ajouter son refus.`Switch` selon les objectifs de chaque épisode, pour chaque épisode, les conditions sont les conditions de chaque épisode et les conditions de l'analyse;`Return`Lorsque le chemin est supérieur au nombre de pas, le chemin est marqué comme interrompu et arrêté.

Le travail se fait à la fin.`return 4`Le chemin de l'entrée`local_10 = score / 10 - 6` Conditions de la route`local_10 >u 4`Pour le cas échéant, la liste des conditions inclut:`!(score / 10 - 6 >u 4)`◊switch 条目 3 和 4 都指向0x76,所以进入0x76 的分叉加入 `score / 10 - 6 == 3 || score / 10 - 6 == 4`◊ bloc 0x76                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `local_4 = 4`, saute à 0xa1, retour à la valeur`4`Le point de départ est le second groupe composé de cette condition et de cette valeur.

求解器为 `BoundedSearch`Il est utilisé pour chaque entrée conserver un domaine limité, élever ces domaines de cartes, et calculer chaque ensemble selon la C 语义计算每束:32 位回绕、截断除法、有符号与无符号比较,以及算术或逻辑移位──除零或表索引越界将使该赋值无法满足约束──`score`À partir de 200 à 1200 heures,`grade`Les cinq voies nécessitent 44 460 fois de recherche, en quelques millisecondes. Pour chaque élément de recherche, on obtient:

| 叶节点 | 返回值 | 条件 | 边界内的分数 |
|---|---|---|---|
| 0x76 | 4 | `!(q >u 4) && (q == 3 \|\| q == 4)` | 90 至 109，20 个输入 |
| 0x7f | 3 | `!(q >u 4) && q == 2` | 80 至 89，10 个输入 |
| 0x88 | 2 | `!(q >u 4) && q == 1` | 70 至 79，10 个输入 |
| 0x91 | 1 | `!(q >u 4) && q == 0` | 60 至 69，10 个输入 |
| 0x9a | 0 | `q >u 4` | 1,351 个输入，即域中其余输入 |

`q`代表 `score / 10 - 6`Il y a une autre.`-O1`Je suis là .`grade`Il existe également des catégories similaires, mais il n'y a que deux voies:`lookup_14[q]`La question se pose à la fois sur le chemin de recherche et sur le chemin de retour par défaut.`lookup_14`Du dossier de l'objectif`.rodata`Je suis en train de lire.

La limite est la limite de cette méthode. Il y a une limite de recherche dans le domaine, dans le domaine, sans conclure. Dans les -200 à 1200 à 60 à 109 entre les fractions, aucun nombre de fractions ne revient à 0,110 ou plus, aucun nombre ne revient à la valeur non-zéro.

## 测量路径 explosion

`-O1`Je suis là .`total`C'est le cycle du 33e cours:`count`, cycle de l'accumulation`values[rdx]`Il n' y a pas de croissance`rdx`- Je suis là .`rdx != rcx`时通过 `jne`Retour à la circulation.`rcx`Pour`zext64(count)`- Je suis désolé .`rdx`Depuis le début, chaque fois que je passe, tout est là.`rdx != count`À la tête, parmi eux.`rdx`Pour une quantité constante, donc `count = c`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `c`Je vais vous voir.`count`限为0至2,执行器找到3条路径;0至4时为5条;0至8时为9条.`-O2`; son nombre de cycles de rotation est au moins de 8, donc le nombre de routes ne change pas dans ce domaine.

 Lorsque l'exécuteur n'a pas de frontière, il ne s'arrêtera jamais, car chaque génération de fois est un autre chemin à parcourir.`count`Le rapport donne ces trois chiffres. Le coût de la demande augmente également: la limite 2 时求值 33 fois, 4 时 115 fois, 8 时 531 fois, limité de la durée de la demande 6 900 fois.

## Uzzr 和 z3  Répondre à la même question

`capture_angr.py`Dans trois fichiers cibles, fonctionne angr 10.0.3──CLE Utilisez ELF 后端`-O0`应用 13 重定位,对其他文件应用 8 ,并解析四符号――对具有一个符号的64 位参数`grade`- Je suis désolé .`run()`Dans le`-O0`Je suis dans un état de 5 morts.`-O1`et `-O2`Les deux suivants sont suivis en suivant les étapes suivantes:`eax == v`, demande le solliciteur de donner des symboles avec la valeur minimale et la valeur maximale, dans chaque niveau d'optimisation,`v`Pour 1 à 4 heures, on obtient 60 à 69、70 à 79、80 à 89、90 à 109; pour 0 heures, on obtient -2147483648 à 2147483647。 deux contrôles de croisement sont insatisfaits。

À la forme de blocs désignés`-O0`Je suis là .`grade`Utilisez CFGFast, listez le 33ème cours trouvé de 8 blocs, encore une fois`explore(find=0x400076)`寻找存储4的块──0.47 secondes après avoir trouvé un état, il y a encore trois 状态; paramètre de valeur minimale 90、maximum value 109, sample for 91、93、94、97 和 101──

Pour le`percent_change`, obtenir deux échéances, condition,`before[31:0] != 0`et `before[31:0] == 0` à la demande d'état non-zéro `eax == 50`, dans le`-O0`Je l' ai reçu .`before = 21055744, after = 332315210`, dans le`-O1`Je l' ai reçu .`40566804, 834296877`, dans le`-O2`Je l' ai reçu .`-24484867, 993934694` 16 à 16 內有界搜索给出 `before = -10, after = -15`◊z3 pour le § 34                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      `before = -25092599, after = 305712160` Test kit avec IR 求值器 calculer l'ensemble des 5 entrées, pour chaque entrées 50 résultats.

`capture_z3.py`Utilisez 32 places pour construire`grade``-O1`清单, contenant multiplications 两次移位和表, a posé quatre autres questions `switch`Différent:0,068 secondes sont non satisfaites, donc la fonction de compilation est égale au code source sur toutes les 2^32 entrées.`score / 10`Pour 70634653, le commutateur entre dans la partie par défaut, et la version de valeur retourne à 4,.. il y aura la même différence limitée à 0 à 109: non satisfaite, c'est la raison pour laquelle le 36ème cours ne peut pas trouver la différence,..`percent_change`, exigences `before == 3`且结果为 -133,在 `after = 1073741823`时得到坐, c'est-à-dire 36 课的溢出单元; il y a une recherche dans son domaine pour trouver un deuxième témoin `after = -1`, à l' heure`(-1 - 3) * 100 / 3`-133, pas de débit.

## 亲手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/44-binary-diffing-and-symbolic-execution
python3 code/main.py
```

输出 est un rapport JSON ⋅`diffs`保存 `-O0`Pour le`-O1`- Je suis là.`-O1`Pour le`-O2`Les objectifs de la mise en ligne de fichiers et de l'application sont les suivants:`-O0`Par rapport à la même chose.`toolComparison`Pour chaque fonction, il faut définir les conditions de fonctionnement et de fonctionnement.`patch`Oui `grade_case10_wrong.o`Dans le cas présent,`radare2Ratios`复现 radiff2 数值,`gradeRelocationCase` présentation du plan et des deux déplacements,`symbolic`保存路径、类和爆炸计数──

按以下顺序阅读 `code/main.py`- Le numéro de la liste:

1. `ElfObject`读取节、符号和 `.rela.*`记录,`parse_listing()`读取 `llvm-objdump`Je suis en train de vous dire.
2. `jump_table_targets()`et `build_cfg()` Donner des blocs et des types de bord`FunctionRecord.signatures()`构建五种签名──
3. `load_image()`布局已分配节,并应用 `S + A - P`et `S + A`Il y a une autre.
4. `match_functions()`est un matériau de mise en phase;`levenshtein()`et `radare2_ratio()`- Je suis un peu comme toi.
5. `parse_radiff2()`et `parse_ghidra_vt()`读取捕获的工具输出, utilisé pour comparer
6. `evaluate()`- Je suis là.`substitute()`et `BoundedSearch`提供表达式语义和求解器──
7. `execute()`- Le chemin de la vie`solve_returns()`Pour chaque élément de la requête,
8. `grade_ir_o0()`- Je suis là.`grade_ir_o1()`- Je suis là.`percent_change_ir_o1()`et `total_ir_o1()`Il y a aussi des commandes de maîtrise de la main.

Il y a trois ordres.`python3 code/main.py diff A.o B.o`Comparer les deux documents objectifs de la liste de conservation,`--image`则比较加载映像──`python3 code/main.py paths grade O0`imprimer un chemin et une catégorie de fonction,`paths total 8`印有边界的循环──`python3 code/main.py figure-data`打印交互图嵌入的数据──

##  réel usage

Pour les deux constructions de votre propre programme, utilisez comparateur et exécuteur, selon l'ordre suivant:

1. Pour chaque dossier, saisissez le menu.`function_record()`Pour le premier, modifier le code.
2. Pour les deux parties, la première phase de la correspondance est la suivante:
3. Comparer les images chargées. De la fonction qui correspond à la fonction de la spécification de caractères à la fonction de la protection, les données sont déplacées par rapport à celles-ci.
4. Pour chaque correspondance, le même code est utilisé avec des valeurs différentes, mais la fonction est toujours différente.
5. 运行名称阶段并比较──有符号时采用BinDiff 顺序, seulement utiliser les résultats de la structure pour évaluer chaque étape──
6. 工具报告比例时, déterminer d'abord quels caractères ont été insérés, puis comparer avec les résultats propres.
7. Pour la fonction de recherche d'entrée, rédiger chaque phrase avec adresse IR, pour chaque symbole cycle compteur de fonctionnement après la limite.`execute()`,并求解每叶节点──报告结果时同时报告边界──
8. À l'heure actuelle, on utilise angr ou z3 pour effectuer la même requête et comparer les classes de bord.

## 交互实验

### 实验 A: 手工计算五种签名

De `code`Actuellement Python:

```bash
cd phases/13-tools-and-protocols/44-binary-diffing-and-symbolic-execution/code
python3 -q
```

运行:

```python
from main import *
grade = {r.name: r for r in fixture_records("ledger-x86_64-O1.o")}["grade"]
grade.raw.hex(" ")
grade.masked_bytes() == grade.raw
grade.mnemonics
grade.cfg_shape()
grade.signatures()
```

打印 `grade.raw`Avant, avant de rédiger la fonction, la déviation est de 0x26 处的四个字节.`ledger-x86_64-O0.o`Le centre`grade`运行相同代码,统计 `grade.edges`Le centre`table`Je suis là.

### 实验 B: observer重定位 comment détruire

```python
case = grade_relocation_case()
case["layout"]
case["displacements"], case["rodataShift"]
case["objectBytesEqual"], case["imageBytesEqual"], case["maskedImageBytesEqual"]
```

读取 `displacements`Il y a des choses qui se passent.`0x100110 + 0x14 - 0x10003a`Il y a une autre.`load_image()`Le lieu de base est modifié en 0x400000, confirme que le lieu de déplacement n'a pas changé, car deux opérateurs se déplacent ensemble.

### 实验 C: erreur de correspondance et de l'éviter

```python
report = diff_fixtures("ledger-x86_64-O1.o", "ledger-x86_64-O2.o")
[(m.left.name, m.right.name, m.stage) for m in report.matches]
report = diff_fixtures("ledger-x86_64-O0.o", "ledger-x86_64-O1.o")
[(m.left.name, m.right.name, m.stage, m.names_agree) for m in report.matches]
report = diff_fixtures("ledger-x86_64-O0.o", "ledger-x86_64-O1.o", stages=BINDIFF_ORDER)
[(m.left.name, m.right.name, m.stage) for m in report.matches]
```

打印 `-O0`Je suis là .`records(...)["percent_change"].cfg_shape()`et `-O1`Je suis là .`grade_label`, lire les deux séquences de degrés, réécrire la sixième étape, en appliquant les notes de suivi de la séquence, pour que la séquence ne soit plus importante, observer si elle peut les distinguer.

### 实验 D: route et frontière

```python
report = grade_paths("O0")
[(p["trace"], p["condition"], p["returns"]) for p in report["paths"]]
report["returns"]["4"]
total_paths(2), total_paths(4), total_paths(8)
total_paths(64, step_limit=24)["truncated"]
```

Il va`SCORE_DOMAIN`改为 `range(0, 110)`, à nouveau`grade_paths("O0")` Retour à 0 de catégories réduites à 60 entrées, deux contrôles de croisement sont encore en place  Retour à la zone de mise en œuvre  Retour à la catégorie 0`range(90, 100)`Regardez quelles sont les parties complètement sans modèle.

## 实践实验

Dans le cas de BinDiff, il y a déjà trois résultats comparés.

要求:

- Dans Ghidra 12.1.4 中安装 BinExport 扩展,导出三个账本 程序──记录 BinExport 发布标签和 Ghidra 版本──
- Installation BinDiff 8 命令行, utilisant seulement la similitude option générer `-O0`Pour le`-O1`et `-O1`Pour le`-O2`Le résultat:
- La comparabilité et la confiance des fonctions par étape`code/fixtures/`, et et `build_fixtures.sh`Je suis en train de faire des commentaires.
- Pour`tool_comparison()`增加 `bindiff`列,并添加测试, comparer BinDiff 在 `-O1`Pour le`-O2`Les classes suivantes sont les suivantes:
- Je vais écrire un mot pour le faire remarquer.`grade`Utilisation de l'algorithme et de la comparaison des images chargées

Le succès est: la démonstration imprime quatre rangées d'outils pour chaque fonction, le nouveau test indique clairement une relation de phase égale ou une différence expliquée.

## Le produit

本课包含 `outputs/skill-binary-diffing-and-symbolic-execution.md` Il sera utilisé pour transformer deux constructions et une fonction en: rapport de différence de phase de la qualité identifiée par correspondance, explication de chaque fonction non correspondante ou modifiée, ainsi que rapport de la voie de l'entrée et de la production de chaque élément de la collection.

## 验证

运行演示和套件:

```bash
cd phases/13-tools-and-protocols/44-binary-diffing-and-symbolic-execution
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明:

- Le code donne quatre fonctions,`-O0`Il est de 46... 118.`-O1`Pour 16 46 31 63,`-O2`Pour 16 46 140 63
- `-O1`目标文件 的 `.rela.text`记录与 `llvm-objdump -r`打印的描述一致
- Chaque ordre de liste se trouve dans son nombre, les caractères sont égaux aux fichiers cibles, les modifications des caractères sont inhabituelles.
- `-O1`Je suis là .`total`Il y a cinq blocs, cinq côtés et un cycle, une chaîne de forme avec une certaine précision.
- `-O0`Je suis là .`grade`De `.rela.rodata`Retournez à cinq objectifs, obtenez huit blocs
- Il n'y a pas de saut à la vitesse.`-O0`Je suis là .`grade`Il y a 82 caractères dans quatre blocs.
- `-O0`Je suis là .`percent_change`Avec `-O1`Je suis là .`grade_label` ayant la même forme
- Pouvant être réaffiché chaque fonction du fichier cible, précisément
- `-O1`et `-O2`Il y a trois parties numériques identiques,`-O0`et `-O1`Pas de
- `grade`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `1, 2, 3, 4, 4`, candidat pour`1, 2, 3, 4, 3`
- Le chargement sera de deux processus `.text`- Je suis là.`.rodata`et `.rodata.str1.1` position similaire à Ghidra
- `R_X86_64_PC32`按 `S + A - P`写入并产生位移 122,`.data`Le centre`R_X86_64_64`条目获得字符串地址
- `grade`Dans le fichier objectif, le caractère correspond, différemment du lieu de déplacement dans l'image, à l'image de retrait de la protection
- `-O1`Pour le`-O2`Il y a trois fonctions correspondantes,`total`按名称匹配; 映像视图中 `grade`按屏蔽字节匹配,相似度为 1 - 1/46
- Le cours est en cours.`-O0`Pour le`-O1`En générant une erreur de type de correspondance, BinDiff  ordre règle que quatre fonctions correspondent toutes au nom
- 补丁候选在字节上匹配, dans la référence données
- Levenshtein Bijvoorbeeld复现 0.130435、0.106061、0.269841、0.171429、82 字节上的 0.426829, ainsi que radiff2 应用重定位后打印的重定位字节比例
- Le matching de radiff2 est égal à la définition des phrases, le matching de Ghidra est égal à la définition des images.
- Ghidra est là .`-O0`Pour le`-O1`En général, les résultats sont comparables à ceux de la même catégorie.
- L'IR 恰好覆盖每条清单指令一次,求值器 suivant C 语义
- `grade`Dans le`-O0`Il y a cinq étapes de la route.`-O1`Il y a deux chemins, mais les classes sont les mêmes.
- Il y a des classes de 60 à 69、70 à 79、80 à 89、90 à 109, avec angr 三个优化级别及 z3 一致,deadended 状态为 5 和 2,到达块的范围为 90 到 109
- 两项交叉检查在有界域、angr和z3 中均无模型,z3 证明清单等于源码开关
- Il y a des limites à chaque recherche.`percent_change`模型都求值得到请求值
- `total` donner 3、5、9 条 路径及三角数和,与angr相似,步数限制回归 22 条并截断 2 条
- Data graphique contient deux types de visuels ∞ valeur de reposicion, ainsi que cinq nœuds de feuille et leurs propres ensembles d'entrée, des modules de stationnement intégrés dans les mêmes données

## Mode de production environnementale défaillant

| 失效情况 | 能力不足的工具报告什么 | 分析必须证明什么 |
|---|---|---|
| 对加载映像取字节哈希 | 两个代码相同的构建之间“grade 被修改” | 字段偏移、两个位移和节的移动；屏蔽哈希匹配 |
| 对可重定位目标文件取屏蔽哈希 | “屏蔽没有影响” | 字段原本就是零；变更存在于重定位记录和引用常量中 |
| 只看流图形状 | 自信地配对两个无关函数 | 第二种签名一致，否则名称矛盾时丢弃匹配 |
| 对已剥离符号构建先用名称再用结构 | 无法匹配 | 各结构阶段及质量，以及未匹配列表 |
| 跨工具直接比较比例 | “radiff2 为 0.43，本课为 0.30” | 两侧各自取指纹的字节；无重定位时 82 字节，有重定位时 118 字节 |
| 相同代码，不同常量 | “精确匹配” | 通过重定位和边界检查读取的表 |
| 将一个模型报告为唯一输入 | “分数是 90” | 90 至 109 的类别、数量，以及发现它的边界 |
| 将有界搜索报告为 unsat | “没有输入产生 -133” | 只在边界内 unsat；z3 在边界外找到 1073741823 |
| 符号循环没有边界 | 超时 | 边界或上限，以及返回、截断和从未开始的路径 |
| 将未运行的闭源工具描述为已运行 | 没有捕获来源的数值 | 带命令和版本的捕获文件，或明确声明仅依据文档 |

## 操作准则

Chaque correspondance de signature, accepte seulement la valeur unique des deux côtés et conserve la phase et sa qualité dans la correspondance. Comparer les documents objectifs et les images de chargement, expliquer chaque fonction qui change entre deux visions.

## 延伸阅读

- [BinDiff concepts: matching strategy, algorithms, and quality ratings](https://github.com/google/bindiff/blob/main/docs/concepts.md)
- [BinDiff repository and the v8 open-source release](https://github.com/google/bindiff/releases/tag/v8)
- [BinExport README: IDA Pro, Binary Ninja, and Ghidra exporters](https://github.com/google/binexport)
- [Flake, "Structural Comparison of Executable Objects" (DIMVA 2004) and Dullien, Rolles, "Graph-based comparison of Executable Objects" (SSTIC 2005), shipped in the BinDiff repository](https://github.com/google/bindiff/tree/main/docs/papers)
- [Diaphora README and heuristics source](https://github.com/joxeankoret/diaphora)
- [Ghidra Version Tracking correlators help page](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/VersionTracking/src/main/help/help/topics/VersionTrackingPlugin/VT_Correlators.html)
- [Ghidra Auto Version Tracking help page](https://www.ghidradocs.com/11.0_PUBLIC/help/VersionTracking/help/topics/VersionTrackingPlugin/VT_AutoVT.html)
- [Ghidra 12.1.4 release](https://github.com/NationalSecurityAgency/ghidra/releases)
- [Binary Ninja 6.0 "Krypton" release notes](https://binary.ninja/2026/09/03/binary-ninja-6.0-krypton.html)et [Binary Similarity user guide](https://docs.binary.ninja/guide/similarity.html)
- [radare2 book: radiff2](https://book.rada.re/tools/radiff2/intro.html)et [radare2 6.2.4 source](https://github.com/radareorg/radare2/releases/tag/6.2.4)
- [King, "Symbolic execution and program testing" (CACM 1976)](https://dl.acm.org/doi/10.1145/360248.360252)
- [Baldoni et al., "A Survey of Symbolic Execution Techniques" (ACM Computing Surveys 2018)](https://dl.acm.org/doi/10.1145/3182657)
- [Cadar, Sen, "Symbolic execution for software testing: three decades later" (CACM 2013)](https://dl.acm.org/doi/10.1145/2408776.2408795)
- [Cadar, Dunbar, Engler, "KLEE: Unassisted and Automatic Generation of High-Coverage Tests for Complex Systems Programs" (OSDI 2008)](https://www.usenix.org/legacy/events/osdi08/tech/full_papers/cadar/cadar.pdf)et [KLEE 3.2 release](https://github.com/klee/klee/releases/tag/v3.2)
- [Shoshitaishvili et al., "SoK: (State of) The Art of War: Offensive Techniques in Binary Analysis" (IEEE S&P 2016)](https://oaklandsok.github.io/papers/shoshitaishvili2016.pdf)
- [angr documentation: loading, simulation managers, and the simulation pipeline](https://docs.angr.io/en/latest/core-concepts/toplevel.html)et [angr 10.0.3 on PyPI](https://pypi.org/project/angr/)
- [Z3 5.1.0 release](https://github.com/Z3Prover/z3/releases/tag/z3-5.1.0)
- [Triton dynamic binary analysis library](https://github.com/JonathanSalwan/Triton)
- [System V Application Binary Interface, AMD64 Architecture Processor Supplement, Table 4.9: Relocation Types](https://gitlab.com/x86-psABIs/x86-64-ABI)
