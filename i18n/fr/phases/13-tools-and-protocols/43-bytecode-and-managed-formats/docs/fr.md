# 超越原生代码:Python、JVM、.NET et le WebAssembly 字节码

> 字节码文件既包含程序,也包含编译器对程序的记录;本课将构建读取器,揭露每种容器保留了哪些记录──

**Type:** Build
**Languages:** Python, Java, C#, WebAssembly text
**Prerequisites:** 第 13 阶段 · 32（从零实现 ELF）、33（反汇编与控制流）
**Time:** ~150 分钟

## Objectif de l'apprentissage

- Selon le PEP 552 读取 `.pyc`Je ne l'utilise pas.`marshal`Dans le cas de modules, l'analyse des codes est effectuée en fournisseurs de données.
- Selon le JVMS, le chapitre 4 résoudre les fichiers de type JVM, y compris la pile de fréquence, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, le code, etc.`Code` attribut et `javac -g`- Je suis en train de faire une petite surprise.
- Réponse`Ledger.class`Le code d'exploitation de la JVM intermédiaire est basé sur quatre constructions de code source identique.`javap -c`Il y a une question de base.
- 逐节读取 WebAssembly 模块,解码每个函数体,并与 `wasm-objdump -d`Le résultat nucléaire
- Prouver le programme .NET ECMA-335 DATA, depuis le catalogue de données PE jusqu'à `MethodDef`Il a été utilisé par les utilisateurs de la base de données de chaque méthode.
- Comparer les performances de la même fonction dans cinq conteneurs, mesurer les noms, types et structures de contrôle de chaque format conservés et perdus.

##  problématique

Tu l'as construit .`ledger.py`, et et `__pycache__` 中发现 `ledger.cpython-314.pyc` Vous demandez à l'intelligent ce que le fichier contient.`Unsupported opcode`, reprendre une ligne .`# WARNING: Decompyle incomplete`                                                                                                                                                                                                                                                              

文件并没有混──它的前两个字节是 `2b 0e`, é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é

Le cours 33 présente le contenu perdu du code original: nom, type et transformation en tableau de bord.`switch` Les contenants de code sont perdus moins souvent, et les variables sont différentes.  Les contenants de code sont conservés pour chaque variable, mais ne conservent pas le type  Les types de fichiers conservent le type, mais seulement lorsque vous les avez spécifiquement exigés.  Les modules conservent la structure de contrôle, mais abandonnent le nom, à moins que la section de configuration ne porte ces noms.  Les programmes de NET mettent le nom des paramètres dans la liste, tandis que les noms de variables locales sont conservés dans des fichiers indépendants.  On ne sait pas à quel moment le contenant a pu transporter les enregistrements, en fonction de son sortie.

Ce cours utilise Python standard library construire quatre types de liseuses. Chaque type de liseuse commence par lire un contenant, liste une fonction et examine son propre outil avec ce format sur le test de test que vous construisez.`ledger``grade`Il n'y a pas de comparaison.

```figure
re-43-five-containers
```

## pyc 头部 est composé de quatre caractères

PEP 552 将头部定义为四个32位字符――第一个是魔数,第二个是位字段――第 0位为 1 表示文件基于哈希――第 1位为 1 表示`check_source`: interprète en importation pour calculer le code source.

魔数定义在 `Include/internal/pycore_magic_number.h`À partir de 3.11 , la règle est Python 3.n à partir de 2900 + 50n  commencé, chaque fois que le code change de type dans la période de publication                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `\r\n`La valeur finale est de 3,11 de 3495 ̊3,12 de 3531 ̊3,13 de 3571 ̊3,14 de 3627, ainsi que de 3,15 de 3666 ̊3.15 Python 3.15.0 a été publié en 2026-10-09, mais les machines construites pour ces échantillons ne l'ont pas installé, donc cette valeur provient du fichier principal, et non du fichier réel de ce site.

样本为每一个解释器保留两份 pyc──`compile_pyc.py`Utilisation `py_compile.compile(..., dfile="ledger.py")`写入文件,使存储的文件名为 `ledger.py`, au lieu de construire des machines sur la voie.

```text
checked-hash   2b 0e 0d 0a  03 00 00 00  c7 16 c7 fc c5 1d 81 01
timestamp      2b 0e 0d 0a  00 00 00 00  8d 60 cf 6a  f1 01 00 00
```

逐字读取时间 头部──`03 00 00 00`Ou `00 00 00 00`C'est un signe.`8d 60 cf 6a`Pour 0x6acf608d = 1791975565, c'est-à-dire la construction de fichiers`ledger.py`Le temps de la mort.`f1 01 00 00`Pour 497, le code source est de taille. Les fichiers de hash sont classés en trois caractères et en huit caractères hash.

| 解释器 | 魔数字节 | 字值 | 文件字节数 | `grade.co_code` 字节数 | `grade` 指令数 |
|---|---|---|---|---|---|
| 3.11.14 | `a7 0d 0d 0a` | 3495 | 1054 | 80 | 31 |
| 3.12.12 | `cb 0d 0d 0a` | 3531 | 937 | 62 | 26 |
| 3.13.12 | `f3 0d 0d 0a` | 3571 | 943 | 70 | 26 |
| 3.14.6 | `2b 0e 0d 0a` | 3627 | 965 | 96 | 35 |

`code/main.py`Le centre`read_pyc_header()`Retournez à ces lignes, et faites-les selon la version de la carte de crédit.`importlib.util.MAGIC_NUMBER`给出当前运行解释器对应的相同四字节──`python3 code/main.py compare`Utilisation dans`PATH`Dans chaque trou trou`python3.11`Pour`python3.15`编译源码,并将读者看到的头部与各解释器报告的自信息并排输出──

## Le maréchal 逐字段写入代码对象

Chaque 16 caractères sont des`e3`, qui est`0x80 | ord('c')`C' est réglé.`FLAG_REF`Le code de l'objet est marshal type de code, dites au lecteur de se souvenir de cet objet, pour la suite.`r`引用──marshal 文档明确表示,该格式刻意不提供文档,且代码对象不跨版本兼容──`Python/marshal.c`列出了类型码:`N`Aucun,`i`Indiquer le nombre de 32`s`Je veux dire,`z`et `Z`Précisez le code de la page d'accueil.`(`et `)`Indiquer le groupe,`c`Indiquer le code objet,`r`Pour les objets de référence, le contenant doit d'abord conserver son propre lieu de référence, puis le processeur doit suivre cette séquence.

`w_complex_object()`按固定顺序写入代码对象──对于3.11至3.15,先以32位整数写入 `argcount`- Je suis là.`posonlyargcount`- Je suis là.`kwonlyargcount`- Je suis là.`stacksize`- Je suis là.`flags`; re-以 objet écrit `code`- Je suis là.`consts`- Je suis là.`names`- Je suis là.`localsplusnames`- Je suis là.`localspluskinds`- Je suis là.`filename`- Je suis là.`name`- Je suis là.`qualname`; puis sont`firstlineno`, finalement `linetable`et `exceptiontable` À partir du 17e chapitre, on commence à déchiffrer le code 3.14

```text
00 00 00 00   argcount 0
00 00 00 00   posonlyargcount 0
00 00 00 00   kwonlyargcount 0
01 00 00 00   stacksize 1
00 00 00 00   flags 0
f3 22 00 00 00   type 's' with FLAG_REF, 34 bytes of co_code follow
80 00  52 06  74 00  52 01  17 00  74 01 ...
```

代码中每条命令占两字节:`80 00`Oui `RESUME 0`- Je suis désolé .`52 06`Oui `LOAD_CONST 6`- Je suis désolé .`74 00`Oui `STORE_NAME 0`- Je suis désolé .`17 00`Oui `MAKE_FUNCTION` dans le modèle 3.14 清单输出了相同的五条模块级语句──`code`后是包含4 emplacements de code objet de la quantité constante,再后是 `names`- Le numéro de la liste:`('LABELS', 'percent_change', 'grade', 'total', 'grade_label')`Il y a une autre.

`code/main.py`Le centre`Unmarshaller`On peut lire cette disposition, ainsi que les anciennes dispositions de 3.9 et 3.10 utilisées; la dernière sera `nlocals`- Je suis là.`varnames`- Je suis là.`freevars`et `cellvars`Il a construit une.`CodeObject`, utilise le même nom d'attribut que l'objet réel.`varnames`Selon`localspluskinds``CO_FAST_LOCAL`位选 `localsplusnames`Pour chacun des quatre documents.`grade`, il est revenu .`('score', 'bucket')`La valeur est de 10`firstlineno`Avec le temps`linetable`测试 `test_unmarshaller_agrees_with_the_running_interpreter`针对当前解释器写出的文件,将每个字段与 `marshal.loads()`Les trois autres fichiers peuvent être lus par notre code, mais ne peuvent pas être lus par l'interprète actuel.`marshal`Je suis en train de lire.

## Quatre explicateurs, quatre notes

Les données de chaque version contiennent la même mise en garde: le code de Python est le détail de la mise en œuvre de CPython, ne garantit pas de maintenir l'invariable.`python3.1N -m dis ledger.py`输出都已保存──

3.11 En milieu `grade`Le premier est le suivant:

```text
 11           2 LOAD_FAST                0 (score)
              4 LOAD_CONST               1 (10)
              6 BINARY_OP                2 (//)
             10 STORE_FAST               1 (bucket)
 12          12 LOAD_FAST                1 (bucket)
             14 LOAD_CONST               2 (9)
             16 COMPARE_OP               5 (>=)
             22 POP_JUMP_FORWARD_IF_FALSE     2 (to 28)
```

`BINARY_OP`位于偏移 6,下一条指令位于 10──中间两字节是 PEP 659 专门化自适应解释器引入的内联缓存项──偏移 16 的 `COMPARE_OP`Il est donc occupé par deux postes de stockage.`show_caches=True`Dans le cas contraire, le cache sera caché.`LOAD_CONST` `RETURN_VALUE`替换为 `RETURN_CONST`, va sauter à nouveau nommé `POP_JUMP_IF_FALSE`,使 `grade`De 80 caractères réduits à 62 caractères.`L1`Pour`L4`En plus de déplacer, il a fourni des instructions pour afficher le cache.`-C`和 montrer le déplacement `-O` 3.14                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `RETURN_CONST`,加入 `LOAD_SMALL_INT`et `LOAD_FAST_BORROW`, et à chaque condition de saut en arrière .`NOT_TAKEN`- Le numéro de la liste:

```text
 12         20       LOAD_FAST_BORROW         1 (bucket)
            22       LOAD_SMALL_INT           9
            24       COMPARE_OP             188 (bool(>=))
            26       CACHE                    0 (counter: 0)
            28       POP_JUMP_IF_FALSE        3 (to L1)
            30       CACHE                    0 (counter: 0)
            32       NOT_TAKEN
```

`-C -O`清单显示 `grade`Il y en a 13 .`CACHE`项:`BINARY_OP`Les cinq derniers, chacun.`COMPARE_OP`La dernière, chaque.`POP_JUMP_IF_FALSE`Le modèle de l'adaptation montre l'utilisation de ces réserves.`dis.dis(grade, adaptive=True)`Dans le cadre de la procédure`RESUME`et `COMPARE_OP`Localisation de la sortie`RESUME_CHECK`et `COMPARE_OP_INT`, et `total`En milieu de`FOR_ITER_LIST`- Je suis là.`BINARY_OP_ADD_INT`et `JUMP_BACKWARD_NO_JIT` une forme spécialisée existant dans le même groupe `co_code`字节中──pyc 永远不包含它们,因为专门发生在内存中──

C'est la raison pour laquelle il existe des versions limitées de l'anticompileur. Uncompile6 3.9.3  Déclaration accepte Python 1.0 à 3.8 de caractères codes.`python_3_13.cpp`, rencontrer un code d'exploitation inconnu ,`Unsupported opcode`Il est également utilisé pour la rédaction de la version 3.8 à 3.15 de l'exposé et de la réédition de la version 3.8.

## 类文件保存了自己的字典

JVMS Java SE 25 Section 4.1 节将布局 définir en une structure:`magic`- Je suis là.`minor_version`- Je suis là.`major_version`- Je suis là.`constant_pool_count`La quantité de poids`access_flags`- Je suis là.`this_class`- Je suis là.`super_class`、interface、字段、方法、属性──魔数是 `0xCAFEBABE` Java SE 25 虚拟机接受 45 至 69 的主版本号,次版本号 65535 则表示预览特性文件。`Ledger-g.class`Le premier jour de la Croix`ca fe ba be 00 00 00 41 00 5e`: main version 65 pour Java 21,`0x5e`= 94 est le nombre de piles de calcul.`Ledger-jdk25.class`É`ca fe ba be 00 00 00 45`La première, la première version est de 69:

La pile de données est un type de dossier où l'on stocke son propre livre.`-g`构建中的条目 `#13`Oui, c'est une.`Methodref`, à l'orientation`#8`Nom et catégorie`#14`Je vais trouver ce que je vais trouver.`Ledger.grade:(I)I`, avec `javap -v`Dans le`//`后输出的内容完全一致──描述符 `(I)I`Indiquer une `int`参数 et un `int`Retour à la valeur.`total``([I)I`Indiquer le paramètre`int`Les documents qui ne sont pas conformes à l'article 4.10 sont rejetés par le vérificateur.`code/main.py`Le centre`ClassFile`类读取表 4.4 的全部17 常量标签,并将一个 `Long`Ou `Double`Lorsqu'il rencontre un signe inconnu ou un extrait de caractères après la dernière propriété, il sort en anomalie.

 attributs peuvent être ajoutés à chaque classe, chaque section, chaque méthode et`Code`属性自身上──JVMS 要求虚拟机忽略不认识的属性, therefore add or remove调试表不必改变方法体──javac 手册说明:`-g`Produit comprenant l'ensemble des informations de modification, en fonction des variables locales, générées par défaut uniquement par le numéro et le fichier source,`-g:none`Les résultats de la construction sont les suivants:

| 构建 | 字节数 | 常量池计数 | `LineNumberTable` | `LocalVariableTable` | `SourceFile` | `grade` 代码字节数 |
|---|---|---|---|---|---|---|
| `javac -g` | 1832 | 94 | 7 个方法 | 6 个方法 | 有 | 50 |
| `javac` | 1581 | 82 | 7 个方法 | 无 | 有 | 50 |
| `javac -g:none` | 1404 | 79 | 无 | 无 | 无 | 50 |

Dans trois dossiers .`grade`Le code de 50 caractères est parfaitement conforme, testé et vérifié.`-g`Pour`grade`增加的是一行 `LocalVariableTable`: démarrage 0 长度 50 槽位 0 名称 `score`、 descripteur `I`                                                                                                                                                                                                                                                              `int`Les espaces de 0 doivent être construits de leur propre chef.`StackMapTable`, parce que le testateur a besoin de lui;`BootstrapMethods`属性                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `main`- Je suis là.`invokedynamic`Je suis un homme de la famille de la femme.

## Le commutateur de table

Le chapitre 6 du JVMS définira chaque instruction comme un caractère de code d'exploitation et le nombre d'opérations définies par ce code d'exploitation. Le déviation de branche est une valeur symbolique de 16 bits par rapport à l'adresse du code d'exploitation de branche, ce qui est différent de celui de la section suivante.`tableswitch`et `lookupswitch`开头包含零至三个填充字节, ce qui rend son nombre d'opérations de 32 places de nombre de fois.

`Ledger-g.class`- Je suis là .`grade`Le code de la page de départ est le suivant:

```text
aa                 tableswitch at pc 4
00 00 00           padding to pc 8
00 00 00 2c        default: 4 + 44 = 48
00 00 00 06        low 6
00 00 00 0a        high 10
00 00 00 2a        case 6:  4 + 42 = 46
00 00 00 28        case 7:  4 + 40 = 44
00 00 00 26        case 8:  4 + 38 = 42
00 00 00 24        case 9:  4 + 36 = 40
00 00 00 24        case 10: 4 + 36 = 40
```

Un ordre, ça montre tout.`switch (score / 10)`, comprenant 9 et 10 fractions communes utilisées.`switch`Les constructions originales nécessitent des contrôles de frontières.`lea`Une article`movslq`Une article`add`、 un saut indirect, ainsi que cinq reposi­tions dans l'autre section.

`disassemble_jvm()`覆盖全部 202 已定义操作码及其操作数宽度, suivant les règles de remplissage,并以 `javap`La méthode de présentation des opérations`compare_with_javap()`解析保存 的 `javap -c -p`文本, incluant多行 `tableswitch`块,并检查每条指令的偏移、助记符和操作数──四种构建的108条指令全部一致──测试`test_branch_offsets_are_relative_to_the_branch_instruction`检查 pc 1 的 `ifne`J'ai sauté jusqu'à 6 13`if_icmpge`Juste jusqu'à 33, puis à 30 ans.`goto`J'ai fait une tentative.

Pour ces cours, le même document a été lu dans le cadre du Radar2.6.2.4 de la construction du code source.`rabin2 -I` rapport `arch java`- Je suis là.`lang java 21`- Je suis là.`linenum true`et `lsyms true`Il est également possible de modifier la version et les deux tables de référencement.`pd 14 @ sym.Ledger.grade`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `tableswitch`Il a aussi utilisé l' arrow pointing vers cinq objectifs.`Unable to parse code attribute: 2`C'est la limite que je me suis fixée, et je continue aussi.`javap`Pour le motif de référence, par rapport à Python, ce format est plus mature. CFR 0.152 utilise la licence MIT. Procyon 0.6.0 et Vineflower 1.12.0 utilise Apache 2.0; Vineflower est compatible avec le Fernflower de Java 21.

## Wasm 模块 est une série de séries

核心规范将模块 définir为前导字节 `00 61 73 6d 01 00 00 00`, qui est un mot`\0asm`Et la version 1, après une série de sections. Chaque section est composée d'un code LEB128.`u32`La composition du contenu est de 1 à 13 caractères, chaque type apparaît le plus souvent une fois et suivant l'ordre de la séquence.`e4 00`Pour 100,`80 08`Pour 1024 ⋅`ledger.wasm`运行  référencement`wasm-objdump -h`J'ai été sélectionné pour sept séries.`WasmModule`找到的七节节及其负载偏移完全相同:

| 节 | 载荷范围 | 数量 | 为 ledger 保存的内容 |
|---|---|---|---|
| 类型 | 10 至 26 | 3 | `(i32) -> nil`、`(i32, i32) -> i32`、`(i32) -> i32` |
| 导入 | 28 至 39 | 1 | 类型为 0 的 `env.log` |
| 函数 | 41 至 46 | 4 | 每个已定义函数的类型索引 |
| 内存 | 48 至 51 | 1 | 一页，无最大值 |
| 导出 | 53 至 110 | 5 | `memory` 和四个函数名 |
| 代码 | 113 至 271 | 4 | 大小为 23、63、44 和 23 字节的函数体 |
| 数据 | 273 至 290 | 1 | 位于偏移 1024 的 `F\0D\0C\0B\0A\0` |

 Function section et code section séparation, afin que le navigateur puisse commencer à compiler avant l'arrivée de l'ensemble du fichier.`grade`La variation du volume local est `01 7f`Un groupe de personnes`i32`C'est tout.`bucket`, il y a un type et pas de nom:.

Le contrôle du flux de la construction est structuré.`block`- Je suis là.`loop`Ou `if`结构──标签按嵌套深度索引──`br_table`通过索引标签列表的操作数执行间接分支――解码文件偏移 `0xa3`- Je suis là .`grade`Le commutateur:

```text
0e                  br_table
0b                  11 labels follow
04 04 04 04 04 04   buckets 0 to 5: label 4, the outermost block, returns 0
03 02 01 00         buckets 6, 7, 8, 9: labels 3, 2, 1, 0
00                  bucket 10: label 0, shared with 9
04                  default label 4
```

Chaque étiquette est une profondeur.`block`,其 `end`Le code de l' après est`i32.const 4`, puis utilisez `br 4`跳出结果块──表前的六条 `block`10 étiquettes et 5 articles de la liste`br`L'ordre est constitué de l'ensemble.`switch`Le testateur refuse toute séparation de cette structure.`disassemble_wasm()`Suivre la profondeur, faire une liste`wasm-objdump`Il est en train de se resserrer.`unreachable`À la`i64.extend32_s`Chaque code d'exploitation est écrit et conservé en deux types.`wasm-objdump -d`输出实现 77 条 命令全部一致。

Ordinary模块丢弃的是名称──`wasm-objdump`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `<grade>`, puisque le fichier de la section 2 sera cartographié dans l'index de fonction 2, le lecteur en est également le cas.`wat2wasm --debug-names`添加名为 `name`Le nombre de pages de l'article est de 425 caractères.`{0: 'score', 1: 'bucket'}`,为函数 3 找到 `{0: 'values', 1: 'count', 2: 'sum', 3: 'i'}`Il y a une autre.`wasm-strip`Les outils de convention ont été décrits dans le stockage en deux autres catégories:`.debug_*`Définition de la section intégrée;`sourceMappingURL`Définition du caractère de l'image.

工具生态                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `wasm-decompile`, sur cette machine Homebrew  Construire correctement contenant les dix outils restants `print`- Je suis là.`objdump`et `demangle`◊ version binaire_133 提供 `wasm-dis`│ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │`rabin2 -I` rapport `arch wasm`Il va arriver.`grade`Le symbole de démarrage est le symbole de démarrage de la variation de la masse.`0x8e`, et `wasm-objdump`Le marquage des fonctions dans le gros petit élément`0x8b`                                                                                                                                                                                                                                                              `get_local`- Je suis là.`set_local`et le nombre de labels à exporter `brtable 11 4 4 ...`◊ trois outils ◊ Les caractères de lecture sont les mêmes, mais les éditions sont différentes, il faut donc comparer les éléments de référence de la liste de l'outil généré.`wasm-core-2`页面是期为2026 年 10 月 13 日的候选推草案, résumé décrit est la version 3.0; 编辑草案也标有同一天的期期──

## ECMA-335 est une base de données du programme lui-même

.NET 程序集是PE 文件──`LedgerNet.dll`É`MZ`开头,包含名为 `.text`- Je suis là.`.rsrc`et `.reloc`Les trois parties, et les déclarations de type machine sont`0x14c`, puisque le compilateur génère des codes de plateforme sans lien avec le code, le catalogue de données des titres de choix 14, c'est-à-dire le CLR, est dirigé vers RVA.`0x2008` ECMA-335 II.25.3.3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

```text
48 00 00 00   Cb 72
02 00 05 00   MajorRuntimeVersion 2, MinorRuntimeVersion 5
78 21 00 00   MetaData RVA 0x2178
84 07 00 00   MetaData size 1924
01 00 00 00   Flags: COMIMAGE_FLAGS_ILONLY
05 00 00 06   EntryPointToken 0x06000005, MethodDef row 5, which is Main
```

RVA `0x2178`处的元数据根以签名 `42 53 4a 42`Je suis en train de lire.`BSJB`, après est la version 1.1 et les caractères `v4.0.30319`Il y a cinq sections:`0x6c`- Je suis là.`#~`, ainsi que `#Strings`- Je suis là.`#US`- Je suis là.`#GUID`et `#Blob` II.24.2   prévoit que chaque type de courant apparaît le plus souvent une fois `#~`Il y a une autre .`HeapSizes`字节, ici为零, donc chaque字符串、GUID 和 blob 索引都占两字节; un autre a 64 bits `Valid`掩码, identification de l'existence de la carte.

| 表 | 标识 | 行数 | 行大小 | 各行内容 |
|---|---|---|---|---|
| Module | 0x00 | 1 | 10 | 模块名及其 GUID |
| TypeRef | 0x01 | 21 | 6 | `System.Object`、`System.Console` 及另外 19 项 |
| TypeDef | 0x02 | 4 | 14 | `<Module>`、`Ledger` 及两个编译器辅助类型 |
| Field | 0x04 | 2 | 6 | `Labels` 和一个静态数组初始化器 |
| MethodDef | 0x06 | 6 | 14 | 五个方法和 `.cctor` |
| Param | 0x08 | 5 | 6 | `before`、`after`、`score`、`values`、`score` |
| MemberRef | 0x0a | 16 | 6 | 12 个特性构造函数及 `Main` 调用的 4 个方法 |
| CustomAttribute | 0x0c | 12 | 6 | 编译器和 SDK 添加的特性 |
| StandAloneSig | 0x11 | 3 | 2 | 三个局部变量签名 |
| Assembly、AssemblyRef、ClassLayout、FieldRva、NestedClass | | 1、2、1、1、1 | | 标识、引用、布局 |

Le nombre de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de catégories de`HeapSizes`Lorsque le nombre de pages de ces tables est inférieur à 2^16-b), il s'étend à 2^b^.`CliAssembly`Selon ces règles et le nombre de pages calculées, les pages de 14 pages de l'échantillon System.Reflection.Metadata Transportation de données Répôt de données de même taille et de la même page de déviation, test de cette preuve calcul correct.

III.1.9 定义令牌:高字节表示表,低三个字节表示从 1 开始的行号──`0x06000002`Oui `MethodDef`La RVA de la ligne 2`0x2060`, nommé `Grade`, signé blob pour`00 01 08 08`:默认调用约定、一个参数、返回 `int32`、paramètres pour `int32`Il est là.`ParamList`À l' orientation`Param`第 3 行, its name is called `score` Param expression utilisant ILSpy 能从剥离后发布构建中输出 `Grade(int score)` RVA`0x2060`Le début de la tête grasse:

```text
13 30         flags 0x13: fat, init locals; size 3 dwords
02 00         MaxStack 2
2d 00 00 00   CodeSize 45
01 00 00 11   LocalVarSigTok 0x11000001
```

`StandAloneSig`La première étape`07 01 08`- Le numéro de la liste:`LOCAL_SIG`Une variation de la situation`int32` Le nom de la variable locale a un type et un nom. ECMA-335 conserve le nom de la variable locale dans le format de modification de la partie V.`DebugType`Aucun bâtiment, donc aucun document portant le nom.`bucket`Il y a une autre.`PercentChange`则使用微型头部:首字节 `3a`Pour`0x0e << 2 | 2`, indique un 14 字节的方法体,没有局部变量,默认深为8──

`Grade`Le code de l'application est de 45 caractères utilisant la partie III.`switch`Le code d'exploitation est`0x45`, le suivant`u32`计数, ainsi que le nombre de相应 `int32`目标, elles sont calculées par rapport à la page suivante:

```text
IL_0000: 02           ldarg.0
IL_0001: 1f 0a        ldc.i4.s 10
IL_0003: 5b           div
IL_0004: 0a           stloc.0
IL_0005: 06           ldloc.0
IL_0006: 1c           ldc.i4.6
IL_0007: 59           sub
IL_0008: 45 05 00 00 00 08 00 00 00 06 00 00 00 04 00 00 00 02 00 00 00 02 00 00 00
                      switch (IL_0029, IL_0027, IL_0025, IL_0023, IL_0023)
IL_0021: 2b 08        br.s IL_002b
IL_0023: 1a 2a        ldc.i4.4, ret
```

编译器在 `switch`之前减去了 6, donc分支 6 est le premier objectif.`disassemble_cil()`通过表解析并呈现令牌:`ldsfld Labels`- Je suis là.`call Grade`- Je suis là.`call System.Console::WriteLine`, ainsi que de`#US`- Je suis là .`ldstr ' '`                                                                                                                                                                                                                                                              `MetaDump`, qui est basé sur des données de base de l' ILSpy`System.Reflection.Metadata`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `System.Reflection.Emit.OpCodes`Il y a 226 pages.`compare_with_metadump()`Le tableau de bord de la mise en service comporte 218 codes d'exploitation ainsi que huit codes.`prefix`Le tableau de ce cours comporte 219 articles, car il contient les éléments de III.2.2`no.`, et émette le tableau ne contient jamais.

Le format de l'outil comprend:ILSpy 11.0(MIT  Permis,2026-08-12 发布) via Avalonia 桌面构建在 macOS 上运行──`ilspycmd`11.1.0.9782 Utilisation `-il`输出 IL, usage `-m 0x06000002`按令牌选择方法──dnSpyEx 6.6.0 继续维护 dnSpy, mais seulement sous Windows──IL 反汇编器 `ildasm`Pour les données suivantes, le module de recherche est configuré en mode SDK.`rabin2 -I` rapport `arch cil`et `class PE32`- Je suis désolé .`is`- Je suis là .`Ledger.Grade(int:score):int`, dont les paramètres et deux types sont tirés de Param 表及签名表。 dans cette construction il n'y a pas de CIL 反汇编器。 dans cette construction il n'y a pas de modèle utilisant le .NET SDK 8.0.205 构建, car le constructeur de machines installé est ce SDK。.NET 10 depuis 2025-11-11 起成为当前版本, écrit ECMA-335 结构相同。

## Chaque conteneur a conservé ce qu'il faut .

Je vais mettre en place un nouveau système de gestion.`grade`On les met dans la même pièce.`python3 code/main.py keeps`, il sera utilisé pour le modèle de l'appareil:

| 容器 | 函数体字节数 | 函数名 | 参数名 | 参数与返回类型 | 局部变量名 | 行号 | 控制流 |
|---|---|---|---|---|---|---|---|
| ELF 目标文件，clang -O0 | 118 | `.symtab` 中的 `grade` | 无 | 无 | 无 | 无，没有 `.debug_*` 节 | 5 次跳转及 1 次经过重定位表的间接跳转 |
| CPython 3.14 pyc | 96 | `co_qualname` | `score` | 无 | `bucket` | `co_linetable`，首行为 10 | 4 对比较及 `POP_JUMP_IF_FALSE` |
| JVM 类，`javac -g` | 50 | 常量池 | `LocalVariableTable` 中的 `score` | `(I)I` | 参数以外无其他名称 | `LineNumberTable`，6 行 | 1 条 `tableswitch` |
| WebAssembly | 63 | 导出节 | 仅在有名称节时存在 | `(i32) -> i32` | 仅在有名称节时存在 | 无 | 6 个嵌套块、1 条 `br_table`、4 条 `br` |
| .NET 程序集 | 45 | `MethodDef` | `Param` 中的 `score` | `static int32(int32)` | 无，只有 `StandAloneSig` 中的类型 | 没有 PDB 则无 | 1 条 `switch`、1 条 `br.s` |

Cette liste explique les résultats de la contre-composition que vous verrez.`int total(const int *, int)`Avec Ghidra de la résolution de l'origine`int total(long param_1, uint param_2)`En comparaison, comme le code original ne conserve pas les informations de ces rangées, il peut conserver tout le nom et ne pas conserver le type, son flux de contrôle est le saut de la forme avec la modification de la version, de sorte que Python anti-compileur peut être désactivé en raison de la modification de la version, mais peut directement récupérer le nom.`-g`时保留名称,并用一条命令表达 `switch`❖ Les modules de l'atmosphère sont conservés dans la structure de la construction, de sorte que `wasm2wat`La seule chose perdue est la description la plus complète du nombre de conservation.

Le tableau décrit ce que l'anticompileur peut utiliser, ainsi que les sorties qui ont copié les faits stockés, quelles sont les hypothèses. Les paramètres de sortie de l'ILSpy sont les mêmes; les variables locales de sortie sont hypothétiques, sauf si le PDB est fourni.

## 动手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/43-bytecode-and-managed-formats
python3 code/main.py
```

输出 est un rapport JSON ⋅ pour chaque pyc, il fournit deux types de titres 文件和 `grade`La taille de la liste de conservation et le nombre de commandes et de codes d'exploitation, ainsi que le nombre de commandes et de codes d'exploitation que l'interprète actuel peut lire, fournissent des versions et des modifications de chaque type de construction de fichiers.`javap`Pour chaque type de construction, il fournit des éléments, des types, des fonctions, des noms, des éléments et des éléments.`wasm-objdump`La cohérence des données métadonnées est définie comme la cohérence des données métadonnées, ainsi que la cohérence des données métadonnées.`PATH`Liste des explicateurs trouvées dans le milieu:

按以下顺序阅读 `code/main.py`- Le numéro de la liste:

1. `Reader`保存游标和整数宽度──`uleb()`et `sleb()`Il y a aussi des blocs de .NET qui sont nécessaires à la lecture de l'EEB128.
2. `read_pyc_header()`- Je suis là.`Unmarshaller`et `PycFile`Je suis en train de lire.`parse_dis_text()`读取保存的 `dis`清单, donc trans version comparer n'est pas nécessaire lors de la mise à l'essai installer quatre interprètes.
3. `ClassFile`读取类文件,`disassemble_jvm()`Le code de l'un d'eux.`parse_javap_code()`et `compare_with_javap()`负责基准核对――
4. `WasmModule`读取各节,`disassemble_wasm()`Il y a une grande différence entre les deux.`compare_with_wasm_objdump()`负责基准核对――
5. `CliAssembly`Il y a aussi des échanges de données.`TABLE_SCHEMAS`Avec `CODED_INDEXES`Les données sont exprimées en termes de données.`disassemble_cil()`- Je suis désolé.`compare_with_metadump()`Le résultat nucléaire
6. `NativeObject`读取足以列出函数符号的ELF内容,并采用第33课单作为文本──`what_each_keeps()`et `figure_data()`构建比较结果──

Il y a cinq autres ordres.`python3 code/main.py pyc FILE`- Je suis là.`class FILE`- Je suis là.`wasm FILE`et `dll FILE`输出 de la structure du fichier et des listes de chaque fonction.`python3 code/main.py compare`Utilisation `PATH`中的每个解释器编译 `ledger.py`,并输出 leurs propres écrits.

##  réel usage

Pour les conteneurs que vous construisez vous-même, utilisez les lecteurs en suivant l'ordre suivant:

1. 读取开头字节并识别格式──两个字节后接 `0d 0a`Indiquer le pyc,`ca fe ba be`Pour les documents,`00 61 73 6d`Indiquer le module,`4d 5a`且数据目录 14 已设置则表示程序集──
2. 读取头部并记录它指示的生成工具版本──pyc Selon le nombre, class of files selon la version principale, programme ensemble selon le temps de fonctionnement et les données de la version
3. Avant de mettre en œuvre tout projet utilisé par les rédacteurs, vérifiez d'abord si elle prend en charge cette version.
4. Pour le même lecteur de documents et son propre outil de format, la comparaison progressive. L'incohérence signifie que le lecteur a des défauts ou des changements dans l'outil; quelle que soit la situation, il faut d'abord déterminer la cause, pour que cela puisse être prouvé.
5. Pour les fonctions qui vous intéressent, remplissez le tableau de conservation des informations.
6. 完成以上步骤后再阅读反编译输出──将每个名称和类型标记为已保留的事实的复制,或标记为推断──

Pour les modifications de la version, utilisez:`build_fixtures.sh`Réconstruire et conserver les sorties, car la simple modification signifie une modification de l'échantillon.

## 交互实验

### 实验 A:先读头部,再读代码对象

De `code`Je suis en Python.

```bash
cd phases/13-tools-and-protocols/43-bytecode-and-managed-formats/code
python3 -q
```

运行:

```python
from main import *
pyc = load_pyc("ledger.cpython-311.pyc")
pyc.header.to_dict()
pyc.module.names
pyc.functions()["grade"].varnames
len(pyc.functions()["grade"].code)
```

La première fois, j'ai écrit le numéro de téléphone.`ledger.cpython-314.pyc`, comparer les deux`code`La durée de la lecture est de 3,11 minutes.`import marshal; marshal.loads(pyc.data[16:])`, lire les erreurs de l'information:.

### 实验 B: habituelle

```python
cls = load_class("Ledger-g.class")
cls.constant(13)
cls.constant(14)
cls.describe_constant(13)
[row["text"] for row in jvm_listing(cls, "grade")]
```

调用 `describe_constant`Avant, avant de commencer.`#13`- Je suis là .`#8`et `#14`, à nouveau à la recherche de`Utf8`条目──                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `Ledger-gnone.class`, à deux objets séparément调用`cls.method("grade").attribute_names()`Il y a une autre.`Code`Les nombres sont les mêmes, mais les propriétés sont différentes.

### 实验 C: profondeur et étiquette

```python
module = load_wasm("ledger.wasm")
[(row["depth"], row["text"]) for row in wasm_listing(module, "grade")]
module.function_name(2)
load_wasm("ledger-names.wasm").names["locals"][2]
```

找到 `br_table`行并读取深度──统计其后的 `end`Résumé: Le code de l'étiquette est défini dans le tableau.`ledger.wat`, trouver les étiquettes 3 pour les réactions `block $six`Il y a une autre.

### 实验 D: de令牌 à字节

```python
asm = load_assembly("LedgerNet.dll")
asm.method("Grade")
body = asm.method_body(asm.method("Grade")["RVA"])
body.fat, body.max_stack, body.code_size, hex(body.local_signature_token)
asm.token_text(0x11000001)
[row["text"] for row in cil_listing(asm, "GradeLabel")]
```

Selon`.text`节头部, manu动计算 RVA `0x2060`Les documents de traitement sont déplacés, et sont`asm.rva_to_offset(0x2060)`Pour voir.`asm.row(0x08, 3)`, trouver un nom`score`La position de l'équipe

## 实践实验

Pour comparer à la 5ème langue source, ou pour ajouter la 6ème factos.

要求:

- Utilisez le langage du compteur installé, écrivez des fonctions contenant des variables de cycle et de lieu, par exemple Kotlin 编译为类文件, ou Rust 编译为 Wasm 模块──提交输出和基准清单, et`build_fixtures.sh`Je vous ai donné des ordres.
- 让对应读取器的每条指令都与基准一致. 只有在样本需要时添加操作码.
- 扩展 `what_each_keeps()`, ajouter un nouveau contenant, et pour tous les contenants ajouter un fait: fonctionnements sont-ils porteurs de manifestations anormales ou`try`La région
- 将新容器加入 `figure_data()`,并重生`site/figures-re-43.js`Il y a une autre.
- 编写测试: Lorsque le lecteur affirme qu'un fait est conservé, sans préciser sa nature ou sa durée de stockage, le test doit échouer.

Les critères d'accès sont:`python3 code/main.py keeps`显示新行, chaque unité a des preuves, et toutes les comparaisons de base sont toujours cohérentes.

## Le produit

本课包含 `outputs/skill-bytecode-and-managed-formats.md` L'utilisation de ce contenant en caractères peut être transformée en un rapport de tête  une liste de fonctions uniques vérifiées, ainsi que la mise en évidence de chaque nom, type et structure comme un tableau de faits conservé ou perdu  Il exige que le format soit utilisé comme un outil de base, en fonctionnant toute version pré-inspection de l'anticompilatrice, et que chaque fait perdu soit indiqué dans quelles parties le texte original devrait être stocké 

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/43-bytecode-and-managed-formats
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明:

- Les quatre pièces du code sont divisées en 3495、3531、3571 和 3627, marquées par 3, et contenant 8 caractères.
- 3.11 et les versions ultérieures de chaque numéro sont situées`2900 + 50n`规则为其版本在规定的范围内
- Pour les documents écrits par l'interprète actuel, l'interprète retourne le nom, la fréquence, le code, les caractères, les noms et les lignes de la liste.`marshal.loads()`Parallèlement
- Quatre documents ont été conservés.`grade``('score', 'bucket')`、首行号 10, ainsi que le nom du dossier `ledger.py`
- Quatre versions de`grade.co_code`Les instructions de conservation sont de 31 26 et 35
- 3.11 清单含有 `POP_JUMP_FORWARD_IF_FALSE`,3.12 et 3.13  contenant `RETURN_CONST`,3.14  contenant `LOAD_SMALL_INT`- Je suis là.`LOAD_FAST_BORROW`et `NOT_TAKEN`
- 3.14 `-C -O`清单显示 `grade`Il y a 13 réserves, dont cinq sont situées.`BINARY_OP`后,自适应清单中出现 `COMPARE_OP_INT`
- 缺少 `0d 0a`Les têtes, les coups de tête, ainsi que les objets non codés sont touchés.`FormatError`
- Il n'y a que des instructions de production et de conservation pour les utilisateurs.`dis`输出一致
- 类文件 主版本为 65 或 69,大小分别为 1581、1832、1404 和 1581,常量池计数分别为 82、94、79 和 82
- 常量 `#13`解析为 `Method Ledger.grade:(I)I`- Je suis désolé .`#47`解析为 `String F`
- JVM contre-référencement en quatre constructions`javap -c -p`实现 108 条 命令全部一致
- pc 4 处 `tableswitch`长 36 字节, le bas de limite est 6 ∞ le haut de limite est 10 ∞ l'objectif est 48, le reste est 46 ∞ 44 ∞ 42 ∞ 40 ∞ 40
- Trois classes de modification de la quantité d'attributs, mais `grade`Les 50 caractères sont conformes
- `ifne`- Je suis là.`if_icmpge`et `goto`Le but par rapport au calcul des fractions d'opération
- 错误魔数、尾随字节和未定义操作码都会触发 `FormatError`
- 7 parties de la charge de la chaîne de réaction`wasm-objdump -h`输出一致,带名称构建在 293至425 处添加 `name`Définition
- type`env.log`导入,5输出和偏移 1024 处的数据段均按 `ledger.wat`Pour écrire
- Les références de l'équipement sont différentes.`wasm-objdump -d`实现 77 条 命令全部一致
- `grade`Il y a 6 blocs de plaques, en profondeur 6 places.`br_table`含标签 `4 4 4 4 4 4 3 2 1 0 0`且默认标签为 4, ainsi qu'un `i32`局部变量
- 没有名称节时, le nom de la fonction provient de la sortie; la variable nom locale n'existe que lorsque le nom de la section existe
- Les résultats`e4 00`Pour 100`7f`Pour -1`80 08`Pour 1024, le mode de présentation de type bloc`wasm-objdump`Un groupe
- 错误前导字节、版本 2 和未知操作码都会触发 `FormatError`
- 程序集为 PE32,机器类型为 `0x14c`,CLI 头部位于 RVA `0x2008`, 2,5 pour le transport`ILONLY`, pour l'entrée`0x06000005`
- 元数据版本为 `v4.0.30319`Il existe cinq flux, 14 feuilles de calcul et un nombre de feuilles de calcul correspondant au rapport de base
- .NET 读取器与 System.Reflection.Metadata  246 项检查全部一致
- `Grade`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `score`,签名为`static int32(int32)`Je suis fat.`MaxStack`Pour 2, code long 45 字节, il y a un nom`int32`局部变量
- CIL `switch` objectifs et `br.s`- Je suis là.`ldsfld`- Je suis là.`call`et `ldstr`操作数均通过表和堆解析
- CIL 操作码表覆盖运行时的每操作码,只额外加入 `no.`
- 信息保留表显示四种容器保留参数名,原生代码不保留;三种容器保留类型
- 演示中的 chaque ligne de base des résultats tous montrent n 项比较中 n 项一致
- 交互图嵌入的数据与 `figure_data()`Les données de production sont les mêmes

## Mode de défaillance dans l'environnement de production

| 失效情况 | 不完善的工具报告什么 | 分析必须证明什么 |
|---|---|---|
| 反编译器比解释器旧 | `Unsupported opcode`、输出被标记为不完整，或声称存在混淆 | 魔数字、它对应的版本及工具文档中的版本上限 |
| 用错误解释器读取 pyc | `marshal.loads` 抛出异常或返回无效数据 | 我们的反序列化器可读取任意 3.9 至 3.15 文件的名称、常量和大小，指令来自匹配的 `dis` |
| 将专门化操作码误认为文件内容 | 清单中出现 `COMPARE_OP_INT` | pyc 保存非专门化形式，专门化在预热后的内存中发生 |
| 声称默认 javac 构建保留局部变量名 | 将 `var1`、`var2` 当作源码名称 | `LocalVariableTable` 只在启用 `-g` 时存在，两种情况下的 50 个代码字节相同 |
| 分支目标偏差一个指令长度 | JVM 清单中的跳转落在指令中间 | 偏移相对于分支操作码，并与 `javap` 核对 |
| 跳过 switch 填充 | `tableswitch` 的默认目标错误，分支错位 | 用零至三个字节将 pc 对齐到 4，五个分支总计 36 字节 |
| 以为 Wasm 名称已被剥离 | “没有符号” | 导出为每个导出函数命名，局部变量需要 `name` 节，`wasm-strip` 只移除该节 |
| 三种工具，三种拼写 | `get_local` 与 `local.get`，函数位置为 `0x8b` 或 `0x8e` | 字节相同，并明确用于比较的清单由什么工具生成 |
| 猜测表行大小 | 第一张表之后的每行都被读错 | 行大小由 `HeapSizes`、行数及编码索引宽度决定，并与基准相同 |
| 期望发布程序集保留局部变量名 | 将 `V_0` 当作源码名称 | 局部变量类型在 `StandAloneSig` 中，名称只在 PDB 中，而 `DebugType` none 不会生成它 |
| 读取器猜测未知操作码或类型码 | 一个看似合理的助记符 | 抛出含偏移的 `FormatError`，并在此处停止基准比较 |
| 基准来自另一构建 | 测试依靠过时文本通过 | `build_fixtures.sh` 记录每个工具版本，并写入 `versions.txt` 和 `sha256.txt` |

## 操作原理

Avant de lire le titre, identifier les outils de production qui s'y orientent. Utiliser le contenu inconnu pour refuser de continuer à lire le contenu du contenu du contenu du contenu du contenu du contenu du contenu du contenu du contenu du contenu du contenu.

## 延伸阅读

- [PEP 552：确定性 pyc](https://peps.python.org/pep-0552/)
- [CPython `Include/internal/pycore_magic_number.h`](https://github.com/python/cpython/blob/main/Include/internal/pycore_magic_number.h)
- [Python `marshal` 模块文档](https://docs.python.org/3/library/marshal.html)
- [CPython `Python/marshal.c`](https://github.com/python/cpython/blob/main/Python/marshal.c)
- [Python 3.14 `dis` 模块文档](https://docs.python.org/3.14/library/dis.html)
- [PEP 659：专门化自适应解释器](https://peps.python.org/pep-0659/)
- [PEP 626：供调试及其他工具使用的精确行号](https://peps.python.org/pep-0626/)
- [PEP 790：Python 3.15 发布计划](https://peps.python.org/pep-0790/)
- [PyPI 上的 uncompyle6](https://pypi.org/project/uncompyle6/)- Je suis là.[PyPI 上的 decompyle3](https://pypi.org/project/decompyle3/)- Je suis là.[PyPI 上的 xdis](https://pypi.org/project/xdis/)- Je suis là.[GitHub 上的 pycdc](https://github.com/zrax/pycdc)- Je suis là.[GitHub 上的 PyLingual](https://github.com/syssec-utd/pylingual)
- [Java 虚拟机规范，Java SE 25，第 4 章：类文件格式](https://docs.oracle.com/javase/specs/jvms/se25/html/jvms-4.html)
- [Java 虚拟机规范，Java SE 25，第 6 章：Java 虚拟机指令集](https://docs.oracle.com/javase/specs/jvms/se25/html/jvms-6.html)
- [javac 手册，Java SE 25](https://docs.oracle.com/en/java/javase/25/docs/specs/man/javac.html)et [javap 手册](https://docs.oracle.com/en/java/javase/25/docs/specs/man/javap.html)
- [CFR](https://www.benf.org/other/cfr/)- Je suis là.[Procyon](https://github.com/mstrobel/procyon)- Je suis là.[Vineflower](https://github.com/Vineflower/vineflower)- Je suis là.[intellij-community 中的 Fernflower](https://github.com/JetBrains/intellij-community/tree/master/plugins/java-decompiler/engine)- Je suis là.[JADX](https://github.com/skylot/jadx)
- [Harrand、Soto-Valero、Monperrus、Baudry，《Java 反编译器的多样性及其在元反编译中的应用》（JSS 2020）](https://arxiv.org/abs/2005.11315)
- [ECMA-335，公共语言基础结构，第 6 版（2012 年 6 月）](https://ecma-international.org/publications-and-standards/standards/ecma-335/)
- [PE 格式，Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format)
- [System.Reflection.Metadata.Ecma335.TableIndex](https://learn.microsoft.com/en-us/dotnet/api/system.reflection.metadata.ecma335.tableindex)
- [GitHub 上的 ILSpy](https://github.com/icsharpcode/ILSpy)- Je suis là.[NuGet 上的 ilspycmd](https://www.nuget.org/packages/ilspycmd)- Je suis là.[GitHub 上的 dnSpyEx](https://github.com/dnSpyEx/dnSpy)
- [WebAssembly 核心规范：二进制格式，模块](https://webassembly.github.io/spec/core/binary/modules.html)et [值](https://webassembly.github.io/spec/core/binary/values.html)
- [WebAssembly 核心规范：自定义节（名称节）](https://webassembly.github.io/spec/core/appendix/custom.html)
- [WebAssembly tool-conventions：调试](https://github.com/WebAssembly/tool-conventions/blob/main/Debugging.md)
- [wabt 1.0.42 发布说明](https://github.com/WebAssembly/wabt/releases/tag/1.0.42)- Je suis là.[wasm-tools](https://github.com/bytecodealliance/wasm-tools)- Je suis là.[Binaryen](https://github.com/WebAssembly/binaryen)- Je suis là.[ghidra-wasm-plugin](https://github.com/nneonneo/ghidra-wasm-plugin)
- [GitHub 上的 radare2](https://github.com/radareorg/radare2), cette classe utilise la version 6.2.4 de la construction du code source
