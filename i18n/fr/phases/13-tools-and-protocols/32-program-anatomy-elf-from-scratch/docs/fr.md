# 程序解剖: de z零编写 ELF 读取器

> Le programme post-compilation est un ensemble de tableaux orientés les uns vers les autres.

**Type:** Build
**Languages:** Python（标准库）、C（仅用于测试夹具）
**Prerequisites:** Phase 0 · 01（开发环境），已安装 clang；Python 3.10 或更高版本；十六进制运算
**Time:** ~120 分钟

## Objectif de l'apprentissage

- Il est également possible de modifier le code de référence de la section "L'utilisation des données" pour les données de référence.
- Utilisation `struct.unpack`读取 ELF 文件头、节头表和两个字符串表──
- Selon gABI et x86-64 psABI`.symtab`条目与 `.rela`- Je suis là.
- 返回指定函数的准确字节,并将每个文件偏移映射到其属结构──
- 读取程序头, par le biais `PT_LOAD`Pour le déplacement du fichier,
- 读取 Mach-O 目标文件的加载命令,并指出每个命令对应的ELF概念──

## 开始之前:授权与法律

Les objectifs de chaque cours sont les processus de rédaction et de compilation que vous écrivez vous-même.`code/fixtures/ledger.c`, qui contient quatre courts C  fonctionnement── source code、 compilation des commandes et de génération des fichiers cibles sont à votre disposition── ici il n'y a pas besoin de lire des licences、 besoin de contourner la protection, ni d'ouvrir un code tiers── cette série ne concerne pas la protection des logiciels、 vérification des licences ou ne fait pas partie de votre programme──

Dans l'affaire *Sega Enterprises Ltd. v. Accolade, Inc.*, 977 F.2d 1510 (9e Cir. 1992) ), la Cour a reconnu que le texte intermédiaire produit par le processus de rédaction appartient à la rédaction au sens du droit d'auteur. Elle a ensuite jugé que le rédaction est la seule voie d'obtention des idées et des fonctionnalités des programmes informatiques protégés par le droit d'auteur, et que, lorsqu'il est cherché à obtenir ce type de rédaction avec des motifs légitimes, la rédaction est constituée en droit pour une utilisation raisonnable de l'œuvre protégée par le droit d'auteur.

Le deuxième cas est *Sony Computer Entertainment, Inc. v. Connectix Corp.*, 203 F.3d 596 (9e Cir. 2000) ―Connectix a rédigé le BIOS de PlayStation en développant un simulateur, le tribunal a reconnu que ces répliques appartenaient à un usage raisonnable―.

La loi américaine de 17 États-Unis 1201 (f) permet à des personnes ayant déjà acquis légalement le droit d'accéder au code de programmation de l'accès à des documents, mais l'unique but est d'identifier et d'analyser les éléments nécessaires à l'interaction entre un programme de programmation de programmation de l'accès à l'accès à l'accès à des documents, mais les quatre restrictions doivent être respectées en même temps:

Dans l'Union européenne, la directive 2009/24/CE n° 5 (3) concerne la recherche. Les personnes qui disposent du droit d'utilisation de la copie peuvent observer la mise en œuvre d'une procédure de recherche ou de test afin de déterminer les idées et les principes de l'un des éléments qui la composent.

Article 6 La mise en œuvre d'un programme informatique indépendant est une mesure de contrôle des données et des données nécessaires à la réalisation de la création indépendante.

| 来源 | 允许的行为 | 条件 |
|---|---|---|
| 17 U.S.C. 1201(f) | 绕过访问控制以分析程序 | 合法副本、互操作目的、信息不易获得、不构成侵权 |
| Directive 2009/24/EC 第 5(3) 条 | 观察、研究和测试运行中的程序 | 有权使用副本，行为处于正常加载和运行范围内 |
| Directive 2009/24/EC 第 6 条 | 反编译 | 被许可人、互操作目的、信息不易获得、仅限必要部分 |
| *Sega v. Accolade* | 构成合理使用的反汇编 | 获取思想和功能要素的唯一途径，且理由正当 |
| *Sony v. Connectix* | 逆向工程过程中的中间复制 | 最终产品不侵权 |

Ces indications proviennent des articles de la loi et des décisions, ne constituent pas des recommandations légales. Si vous rencontrez une situation qui ne vous appartient pas, vous devez d'abord obtenir un permis écrit de rouvrir le dossier et le conserver avec les preuves.

##  problématique

Tu l' as écrit .`ledger.c`, et pour le dossier cible fonctionne`llvm-objdump -t` Exploitation`percent_change`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `0000000000000000`, en gros pour`0000000000000010`◊ Le nombre de caractères de cette fonction est de 1768 caractères.`0x36`处显示 `R_X86_64_PC32 .rodata+0x10`Les quatre caractères de ce lieu sont zéro.`0x14`Pourquoi le nombre est-il augmenté ?`0x10`- Je suis désolé .

Utilisation réelle `inspect_binary_layout` Répondre aux questions de mise en page, mais cet outil est uniquement disponible sur Linux x64 et est partagé `REA_PWNTOOLS_PYTHON`Utilisez les outils 4.15.0...`address_to_file_offset`需要 Ghidra 会话, ainsi que SHA-256 匹配的原始文件完整字节副本──`inspect_artifact`En fonction du chemin et du contenu, le contenu dans le contenu de l'enveloppe ne peut pas être lu.`struct.unpack`Et 0 dépend de l'écriture de l'étudiant.`llvm-objdump`文本 pour faire une comparaison

```figure
elf-byte-map
```

## 文件就是指向其他表的表

Le système V GABI chapitre 4 figure 4-1 présente deux visions du même fichier. Le lien contient le titre du fichier ELF. Le titre du fichier ELF est fixe. Toutes les autres structures sont délocalisées par un autre système.

GABI a également fixé le type de code, et a déclaré que l'ELF n'utilise pas de domaine de référence.`Elf64_Addr`et `Elf64_Off`Chaque groupe est composé de 8 caractères.`Elf64_Half`占 2 字节,`Elf64_Word`占 4 字节,`Elf64_Xword`占 8 字节──x86-64 psABI Section 4.1.1 节要求使用 `ELFCLASS64`- Je suis là.`ELFDATA2LSB`- Je suis désolé .`e_machine`Pour`EM_X86_64`Les États membres`e_flags`Pour le petit bout de la ligne de ligne, la largeur fixe signifie: utilisation.`<`Il y a des gens qui ont des problèmes.`struct.unpack`Une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une fois, une, une fois, une fois, une, une fois, une fois, une, une fois, une, une fois, une, une fois, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, une, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un, un autre, un autre, un autre, un autre, un autre, un autre, un autre, un autre, un autre, un autre, un autre, un autre, un autre, un autre, un autre, un autre, un

`ledger-x86_64-O1.o`Je suis en train de faire une petite histoire.

```text
00000000: 7f45 4c46 0201 0100 0000 0000 0000 0000  .ELF............
00000010: 0100 3e00 0100 0000 0000 0000 0000 0000  ..>.............
00000020: 0000 0000 0000 0000 2804 0000 0000 0000  ........(.......
00000030: 0000 0000 4000 0000 0000 4000 0b00 0100  ....@.....@.....
```

Pour le titre de la page, lisez ces caractères.`e_ident`占 16 字节,包含 `7f 45 4c 46`(魔数,即识别文件格式的固定字节) 类别 2(64位) DATA编码 1(小端) 版本 1、OS ABI 0(System V)及填充──

Je suis en train de vous dire:`e_type``0x0001`Indiquer `ET_REL`, qui peut être réaffecté dans le fichier cible.`e_machine``0x003e`Pour 62, c'est-à-dire`EM_X86_64` Les objectifs du document ne sont pas accessibles, donc `e_entry`Pour le zero, il n'a pas de code, donc.`e_phoff`Pour le moins.`e_shoff`Pour`0x428`, qui est le titre du dossier déplacé.`e_ehsize` `0x40`- Je suis là.`e_phentsize`0`e_phnum`0`e_shentsize` `0x40`- Je suis là.`e_shnum` `0x0b`(11 个节头), ainsi que `e_shstrndx` `0x0001`Il y a une autre.

读取器用一次调用解析 cette ligne:

```python
fields = struct.unpack_from("<HHIQQQIHHHHHH", data, 16)
```

字符串对应从左到右读取的 gABI 图: 两半字、一个字、三个 8字节值、一个字、六个半字──读取器拒绝魔数、类别或字节序不符的文件,也拒绝不符合 64 和 56 的`e_shentsize`Ou `e_phentsize`△ La largeur une fois que l'erreur est faite, tous les déviations ultérieures sont éliminées, donc le contrôle doit être mis en avant.

## 节头与两个字符串表

Chaque chapitre est un 64 caractères .`Elf64_Shdr`(voir graphique 4 à 8):`sh_name`- Je suis là.`sh_type`- Je suis là.`sh_flags`- Je suis là.`sh_addr`- Je suis là.`sh_offset`- Je suis là.`sh_size`- Je suis là.`sh_link`- Je suis là.`sh_info`- Je suis là.`sh_addralign`- Je suis là.`sh_entsize`│ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │`<IIQQQQIIQQ`Il y a une autre.`sh_name`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `e_shstrndx`Le nom de la section est décalé dans la section 0.`e_shstrndx`Pour 1,clang sera nommé `.strtab`, par conséquent, la même liste de stockage et de stockage

读取器输出 -O1 目标文件的 11 个节头:

```text
Idx Name             Type         Flags   Offset     Size       Addr Link Info Align
  0                  NULL                    0x0      0x0        0x0    0    0     0
  1 .strtab          STRTAB                0x368     0xbe        0x0    0    0     1
  2 .text            PROGBITS     AX        0x40     0x9f        0x0    0    0    16
  3 .rela.text       RELA         I        0x2a8     0x48        0x0   10    2     8
  4 .rodata          PROGBITS     A         0xe0     0x50        0x0    0    0     8
  5 .rela.rodata     RELA         I        0x2f0     0x78        0x0   10    4     8
  6 .rodata.str1.1   PROGBITS     AMS      0x130      0xa        0x0    0    0     1
  7 .comment         PROGBITS     MS       0x13a     0x2f        0x0    0    0     1
  8 .note.GNU-stack  PROGBITS              0x169      0x0        0x0    0    0     1
  9 .llvm_addrsig    LLVM_ADDRSIG E        0x368      0x0        0x0   10    0     1
 10 .symtab          SYMTAB                0x170    0x138        0x0    1    9     8
```

L'indice 0 est réservé à l'emplacement.`.text`Dans les documents déplacés`0x40`处存放 159 字节代码,紧接文件头,标志为`A`(enregistreur de distribution) et `X`(可执行)`.rodata`存放 80 字节 读数据而已`.rodata.str1.1`存放五个标签字符串 `F\0D\0C\0B\0A\0`,共 10 字节, 标志为`M`(可合并) et `S`Je suis désolé.

`.comment`存放 47 字节的编译器标记 `\0Apple clang version 17.0.0 (clang-1700.6.3.2)\0`Il y a une autre.`.llvm_addrsig`                      `0x6fff4c03`, situé dans le gABI, conservé pour le système d'exploitation de type spécial`SHT_LOOS`Pour`SHT_HIOS`Dans le cadre de la LVM`ELF.h`Il a donné son nom.`E`Pour`SHF_EXCLUDE`, donc le lien va le jeter.

`sh_link`et `sh_info`Les deux rangées sont des points entre les deux.`.rela.text``sh_info`Pour 2`sh_link`Pour 10: il modifie la deuxième partie, et de la dixième partie obtient le symbole.`.symtab``sh_link`为 1, indiquer le nombre de caractères;`sh_info`Pour 9, indique le premier indice de symboles non locaux.`sh_addr`Ils sont donc à zéro, car les objectifs du fichier n'ont pas d'adresse.

Les deux règles de gABI permettent au lecteur de dessiner un dossier complet.

```text
     0x0 +64    header   ELF header
    0x40 +159   section  .text
    0xdf +1     gap      inactive space
    0xe0 +80    section  .rodata
   0x130 +10    section  .rodata.str1.1
   0x13a +47    section  .comment
   0x169 +7     gap      inactive space
   0x170 +312   section  .symtab
   0x2a8 +72    section  .rela.text
   0x2f0 +120   section  .rela.rodata
   0x368 +190   section  .strtab
   0x426 +2     gap      inactive space
   0x428 +704   table    section header table
```

Il y a trois espaces, dix caractères, pour être parfait.`.rodata``sh_addralign`Pour 8, donc `0xe0`Au lieu de`0xdf`Je commence.`.symtab`Les exigences sont de 8, donc `.comment`后有七字节未使用──节头表本身也按8字节对齐──

`SHT_NOBITS`类型节完全不占文件字节,因此映射会跳过它们──本目标文件没有这种类型节,但已链接程序中的 `.bss` belongs à cette catégorie; si le lecteur est là  blind blind信任 `sh_size`Je peux lire jusqu'à la fin du dossier.

## 符号: lien, type, appartenance, valeur et taille

`Elf64_Sym`Il y a aussi le fait de se faire des amis.`st_name`- Je suis là.`st_info`- Je suis là.`st_other`- Je suis là.`st_shndx`- Je suis là.`st_value`- Je suis là.`st_size`, format pour`<IBBHQQ`Il y a une autre.`st_info`打包了两个字段:高四位为绑定属性,低四位为类型──gABI 定义的绑定为 `STB_LOCAL`0`STB_GLOBAL`1`STB_WEAK`2, type `STT_NOTYPE`0`STT_OBJECT`1`STT_FUNC`2`STT_SECTION`3`STT_FILE`4 ∞`st_other`Les deux parties sont présentes.`STV_DEFAULT`0:

```text
Idx            Value   Size Bind   Type    Section          Name
  0              0x0      0 LOCAL  NOTYPE  *UND*
  1              0x0      0 LOCAL  FILE    *ABS*            ledger.c
  2              0x0     20 LOCAL  OBJECT  .rodata          labels.rel
  3              0x0      0 LOCAL  SECTION .rodata          .rodata
  4              0x2      2 LOCAL  OBJECT  .rodata.str1.1   .L.str.1
  5              0x4      2 LOCAL  OBJECT  .rodata.str1.1   .L.str.2
  6              0x6      2 LOCAL  OBJECT  .rodata.str1.1   .L.str.3
  7              0x8      2 LOCAL  OBJECT  .rodata.str1.1   .L.str.4
  8              0x0      0 LOCAL  SECTION .rodata.str1.1   .rodata.str1.1
  9              0x0     16 GLOBAL FUNC    .text            percent_change
 10             0x10     46 GLOBAL FUNC    .text            grade
 11             0x40     31 GLOBAL FUNC    .text            total
 12             0x60     63 GLOBAL FUNC    .text            grade_label
```

L'indice 0 est un nombre non défini de conservation.`st_shndx`指定定义符号的节, il existe trois autres valeurs de réserve:`SHN_UNDEF`0 ≈ pour les dossiers`SHN_ABS` `0xfff1`, ainsi que `SHN_COMMON` `0xfff2`△节符号名称为空, donc `llvm-objdump`Le code est donc un code qui est lié à un code STB_LOCAL.`.symtab`Dans le`sh_info`Il y a 9 ans.

Dans le dossier objectif, en raison de`sh_addr`Pour le zéro,`st_value`est le déplacement du symbole dans le segment.`sh_offset + st_value - sh_addr`,长度为 `st_size`- Le numéro de la liste:

```python
section = elf.sections[symbol.st_shndx]
file_offset = section.sh_offset + (symbol.st_value - section.sh_addr)
code = elf.data[file_offset : file_offset + symbol.st_size]
```

Pour le`percent_change`En fait, le déplacement est`0x40 + 0`, 16 个字节为 `85 ff 74 09 29 fe 6b c6 64 99 f7 ff c3 31 c0 c3`◊ La taille est aussi importante que la position de départ`grade`Dans le`.text`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `0x3e`处结束──紧随其后的两个字节 `66 90`Il est un complément de l'article.`nop`Air operation instructions, pour faire`total`De `0x40`Ceci est un 16 caractères de bord. Ces deux caractères ne sont pas des symboles.`st_size`En tant que condition de cessation de l'équipe de réparation, le 36e cours évitera ces remplissages avant les résultats de la comparaison de reconstruction.

## 重定位:零字节 signifie quoi

`Elf64_Rela`Il y a aussi le fait de se faire des amis.`r_offset`- Je suis là.`r_info`Et avec des symboles`r_addend`, format pour`<QQq` Réposition des données de référence des liens et des données de référence des liens et des liens de référence`r_info`- Le numéro de la liste:`ELF64_R_SYM(i)`Pour`i >> 32`- Je suis désolé .`ELF64_R_TYPE(i)`Pour`i & 0xffffffff`Dans le dossier de localisation,`r_offset`Oui, c'est vrai.`sh_info`Le type de nom et la formule proviennent de x86-64 psABI Table 4.9, parmi lesquels `S`est la valeur du symbole,`A`Il y a plus de chiffres,`P`est la position de réparation,`L`Il est nécessaire de faire une analyse de la situation.`R_X86_64_64`Pour`S + A`- Je suis désolé .`R_X86_64_PC32`Pour`S + A - P`- Je suis désolé .`R_X86_64_PLT32`Pour`L + A - P`Il y a une autre.

-O1 目标文件有八条记录:

```text
  .rela.text       0x36 R_X86_64_PC32          .rodata+0x10
  .rela.text       0x84 R_X86_64_PC32          .rodata+0x24
  .rela.text       0x93 R_X86_64_PC32          .rodata-0x4
  .rela.rodata      0x0 R_X86_64_PC32          .rodata.str1.1
  .rela.rodata      0x4 R_X86_64_PC32          .L.str.1+0x4
  .rela.rodata      0x8 R_X86_64_PC32          .L.str.2+0x8
  .rela.rodata      0xc R_X86_64_PC32          .L.str.3+0xc
  .rela.rodata     0x10 R_X86_64_PC32          .L.str.4+0x10
```

Je suis en train de faire une démarche.`0x36`      `grade`En effet, la portée de l'article est de`0x10`Pour`0x3e`Il y a une autre.`0x33`Les instructions sont:`48 8d 0d 00 00 00 00`, qui est calculé RIP par rapport à l' adresse `lea`,其四字节位移位于 `0x36` Le processeur sera déplacé à l'adresse de l'ordre suivant `0x3a`À la hauteur.

编译器希望结果为 `.rodata + 0x14`, là-bas est une page contenant 5 32 bits de valeur .`1, 2, 3, 4, 4`Le point de départ du tableau.`(.rodata + 0x14) - 0x3a`◊ la formule `S + A - P`Dans le`P = 0x36`Je l' ai reçu .`.rodata + A - 0x36`令两者相等可得 `A = 0x14 - 4 = 0x10` Le nombre de caractères inclus entre le point de départ et le point de départ est supérieur à celui du point de départ.

Ceci est le signe de la voix dans le -O1 下编译 `grade`- Je suis là .`switch`Le code est passé par le code.`0x66666667`和两次移位计算 `score / 10`, à nouveau déduire 6 ≠ 4 comparer, puis indiquer le tableau ∞-O1 ELF                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     `.rodata`En plus d'un add-on, il n'y a que le même code source que l'arm64 qui le nomme.`l_switch.table.grade`第二条记录位于 `grade_label``0x84`, à l' orientation`.rodata + 0x28`处第二张由 8 字节值组成的表──第三条位于 `0x93`, à l' orientation`.rodata + 0x0`, qui est`labels.rel`Le point de départ.

五条 `.rela.rodata`记录填充 `labels.rel` Chaque article est déplacé`4i`, il y a aussi plus de .`4i`, donc `S + A - P`化简为字符串地址减去表基址。`grade_label`- Je veux le faire .`movslq`读取条目, 再加回表基址,就得到指针──第一条记录引用节符号 `.rodata.str1.1`, plus le nombre est 0, parce que`F`Le premier épisode de ce film commence.`.L.str.1`Pour`.L.str.4`, ils sont des compilés pour .`D`- Je suis là.`C`- Je suis là.`B`- Je suis là.`A`Étiquette de la région de la vie

Les mêmes sources de code sont classées sous trois niveaux d'optimisation.

| 构建 | `labels` 的位置 | `grade` 如何选择 | `grade_label` 如何到达 `grade` |
|---|---|---|---|
| -O0 | `.data`，五个 8 字节指针，五条 `R_X86_64_64` 记录 | `.rodata` 中的跳转表：五条指向 `.text` 的 `R_X86_64_PC32` 记录 | 带有 `R_X86_64_PLT32 grade-0x4` 的调用 |
| -O1 | `.rodata` 中的 `labels.rel`，五个 32 位相对条目 | `.rodata+0x14` 处的值表，一条 `R_X86_64_PC32` | 已内联，没有调用 |
| -O2 | 与 -O1 相同 | 与 -O1 相同 | 已内联，`total` 增长到 140 字节 |

Dans le -O0`switch`C'est vraiment un vrai saut, cinq articles séparés.`.text`Le centre`+0x91`- Je suis là.`+0x8c`- Je suis là.`+0x87`- Je suis là.`+0x82`et `+0x86`Pour moi.`grade`Avec des modèles similaires.`-0x4`Le nombre, les causes et les`lea`Dans le même temps, l'optimisateur a découvert que chaque fraction de l'échantillon retourne à la quantité normale, et il a utilisé le résultat de la table pour sauter.

## 程序头: 卡载器的视图

Le fichier objectif ne dispose donc pas de programme.`e_phnum`Pour les fichiers exécutables et les fichiers objectifs partagés, il est possible de lire ces informations uniquement.`Elf64_Phdr`占 56 字节(gABI 图 5-1):`p_type`- Je suis là.`p_flags`- Je suis là.`p_offset`- Je suis là.`p_vaddr`- Je suis là.`p_paddr`- Je suis là.`p_filesz`- Je suis là.`p_memsz`- Je suis là.`p_align`, format pour`<IIQQQQQQ`Pour le moment,`PT_LOAD`条目规定三条规则: selon `p_vaddr`升序排列;`p_memsz`Il est grand.`p_filesz`de la partie utilisée pour le remplissage;`p_vaddr`Avec `p_offset`Pour le`p_align`Je suis en train de faire un travail.

Chaque objectif de cette série est un programme que vous construisez vous-même, et ce Mac ne peut pas le faire.`ledger.o`Produit Linux pouvant être exécuté`tiny-x86_64`Je suis venu .`code/fixtures/build_tiny_elf.py`- Il est utilisé .`struct.pack`写出 736 字节──文件包含 ELF 文件头、两个程序头、36 字节的 `_start`、3 字节 `.rodata`、 符号表和六节头──`_start`À dossiers descriptifs 1 写入 `ok\n`, puis avec le code d'état 42 退出── il peut fonctionner sur Linux x86-64; ici, il est couvrant le processus de traitement des routes de test.

```text
Program headers:
  PT_LOAD          r-x offset=0x0 vaddr=0x400000 filesz=0x2e0 memsz=0x2e0 align=0x1000
  PT_GNU_STACK     rw- offset=0x0 vaddr=0x0 filesz=0x0 memsz=0x0 align=0x10

entry 0x4000b0 is file offset 0xb0 through PT_LOAD
```

Le seul.`PT_LOAD`Pour la première fois, le projet de loi est de faire apparaître le projet de loi.`0x400000`△ Les lecteurs trouver contenu certains endroits `PT_LOAD`, à nouveau calculé`p_offset + (address - p_vaddr)`, dès que l'adresse sera cartographiée pour le déplacement du fichier.`0 + (0x4000b0 - 0x400000) = 0xb0`C' est vrai .`.text`Le point de départ.

C'est vraiment ça.`address_to_file_offset`背后的计算──对 Ghidra 目标,该工具返回 `{address, file_offset}`J' espère que vous reviendrez .`provider_file_offset`et `image_base_file_offset` Les outils doivent être complets et la copie originale du document SHA-256 doit être conforme à l'objectif.`inspect_binary_layout`Il y a aussi une phrase à retenir dans le document:  l'adresse du lien n'est pas en cours de fonctionnement   position  non-exécutable 文件会加载到内核选择的基址, uniquement les fichiers sont déplacés en un lieu fixe 

Le programme explique également pourquoi les fichiers exécutables peuvent encore fonctionner après avoir été déconnectés.`e_shoff`Les outils de la section de transformation ne regardent pas à tout contenu, et le chargement ne dépend jamais de ces sections.

## Concept de réaction de Mach-O

Apple n'a pas publié de code de Mach-O.`EXTERNAL_HEADERS/mach-o/loader.h`- Je suis là.`nlist.h`et `reloc.h`Les pièces`ledger-arm64-O1.o`Par le même.`ledger.c`Utilisation `clang -target arm64-apple-macos -O1 -fno-asynchronous-unwind-tables -c`La construction.

`mach_header_64`占 32 字节:`magic`- Je suis là.`cputype`- Je suis là.`cpusubtype`- Je suis là.`filetype`- Je suis là.`ncmds`- Je suis là.`sizeofcmds`- Je suis là.`flags`- Je suis là.`reserved`Il y a beaucoup de choses à faire.`0xfeedfacf`, qui est`MH_MAGIC_64`Il y a une autre.`cputype`Pour`0x0100000c`, qui est`CPU_TYPE_ARM64`Il y a une autre.`filetype`Pour 1, c'est-à-dire`MH_OBJECT`Il y a une autre.`ncmds`Pour 5,`sizeofcmds`Pour 616: charge des ordres occupation du dossier tête après 616 字节, chaque article ordonnance moyenne`{cmd, cmdsize}`- Je suis en train de faire un tour.`0x2000`Pour`MH_SUBSECTIONS_VIA_SYMBOLS`Il y a une autre.

```text
Load commands:
  0 LC_SEGMENT_64                cmdsize=472 at 0x20
  1 LC_BUILD_VERSION             cmdsize=24 at 0x1f8
  2 LC_LINKER_OPTIMIZATION_HINT  cmdsize=16 at 0x210
  3 LC_SYMTAB                    cmdsize=24 at 0x220
  4 LC_DYSYMTAB                  cmdsize=80 at 0x238
```

`LC_SEGMENT_64`(0x19) Pour les deux étoiles de l'ELF`segment_command_64`包含 `segname`- Je suis là.`vmaddr`- Je suis là.`vmsize`- Je suis là.`fileoff`- Je suis là.`filesize`- Je suis là.`maxprot`- Je suis là.`initprot`- Je suis là.`nsects`et `flags` Dans le même ordre `nsects`条 `section_64`记录,每条 80 字节──`loader.h`À propos de`MH_OBJECT`Les éléments sont situés dans un passage vide, sans nom.`fileoff`Pour 648,`filesize`Pour 456, il y a cinq sections.

```text
  Idx Section                    Addr   Size Offset Reloff Nreloc Type
    1 __TEXT,__text               0x0   0xd0    648   1104      6 S_REGULAR
    2 __DATA,__const             0xd0   0x28    856   1152      5 S_REGULAR
    3 __TEXT,__cstring           0xf8    0xa    896      0      0 S_CSTRING_LITERALS
    4 __TEXT,__const            0x108   0x40    912      0      0 S_REGULAR
    5 __LD,__compact_unwind     0x148   0x80    976   1192      4 S_REGULAR
```

Chaque étape passe .`segname`Il y a deux noms:`__const`Les parties ne sont pas les mêmes:`__DATA,__const`, l' autre est `__TEXT,__const` Réinitialisation`reloff`et `nreloc`按节存放;ELF 则为每一个目标节设置单独 `.rela.X`- Je suis là.

Chaque jour`relocation_info`Il y a 8 caractères, tout d'abord il y a des symboles.`r_address`, puis un 32 bits, 打包为`r_symbolnum`(à 24 places)`r_pcrel`(à l'intérieur de la zone de référence)`r_length`(à l'intérieur de la zone de décharge)`r_extern`(1 位) et `r_type`Je suis un homme.`__text`Le record est trois contre .`ARM64_RELOC_PAGE21`Avec `ARM64_RELOC_PAGEOFF12`, chaque fois citation à l'article`adrp` `add`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `lea`Le rôle de l'auteur est de faire une référence à la situation actuelle.`__DATA,__const`记录为 `ARM64_RELOC_UNSIGNED`- Je suis désolé .`r_length`Pour 3, donc chaque article modifie un 8 字节绝对指针──

Dans le cas de l'arm64,`labels`Conserver pour une pointe ordinaire, tandis que x86-64 construit génère une table relative.

`LC_SYMTAB`(0x2) contient `symoff`1240`nsyms`17`stroff`1512`strsize`176.1512 plus 176 et ainsi de suite.`nlist_64`占 16 字节:`n_strx`- Je suis là.`n_type`- Je suis là.`n_sect`- Je suis là.`n_desc`- Je suis là.`n_value`Il y a une autre.`n_type`C'est un domaine.`N_TYPE`(掩码)`0x0e`) est égal à `N_SECT`(le secteur de l'énergie)`0xe`),表示符号定义在序号为 `n_sect`Dans la partie, le premier numéro commence par le premier.`N_EXT`(le secteur de l'énergie)`0x01`) marque des symboles externes

`nlist_64`Il n'y a pas de grosse pièce.`_percent_change`Le code de l'article suivant est le même que celui de l'article suivant.`0x18``_grade`Il y a un code C avec un prédécesseur.`_`, donc la fonction nomée `_percent_change`Il y a une autre.

`LC_DYSYMTAB`(0xb) enregistré avec ELF `sh_info`Les règles de priorité des symboles locaux sont les suivantes:`ilocalsym`0`nlocalsym`13`iextdefsym`13`nextdefsym`4 ∞`LC_BUILD_VERSION`(0x32)                                 `XXXX.YY.ZZ`整数记录 `platform`1(macOS)`minos`26 et`sdk`26.2  justement à cause de cette ordonnance, arm64 具 doit être soumis sous forme de caractères; dans un Mac utilisant un autre SDK, une configuration produira différents fichiers

读取器 的 `compare_formats`Comparer les deux documents:

| 概念 | ELF，`ledger-x86_64-O1.o` | Mach-O，`ledger-arm64-O1.o` |
|---|---|---|
| 文件标识 | `e_ident` `7f 45 4c 46`，类别 64，数据 LSB | `magic` `0xfeedfacf` |
| 机器架构 | `e_machine` 62，`EM_X86_64` | `cputype` `0x100000c`，`CPU_TYPE_ARM64` |
| 文件种类 | `e_type` 1，`ET_REL` | `filetype` 1，`MH_OBJECT` |
| 表的位置 | `e_shoff` `0x428`，11 个节头 | 5 条加载命令，位于文件头后的 616 字节 |
| 代码 | `.text` 位于 `0x40`，大小 `0x9f`，标志 `AX` | 无名段内的 `__TEXT,__text` 位于 648，大小 `0xd0` |
| 符号名称 | `.symtab`（第 10 节），通过 `sh_link` 1 在 `.strtab` 中查找名称 | `LC_SYMTAB` 的 `symoff` 1240、`nsyms` 17，名称位于 `stroff` 1512 |
| 符号大小 | `st_size`：`percent_change` 为 16 字节 | 没有对应字段：下一符号减去当前符号，得到 24 字节 |
| 重定位 | `.rela.text`，3 条记录，`R_X86_64_PC32` | `__text` 的 `reloff` 1104，6 条记录，`PAGE21` 与 `PAGEOFF12` |
| 函数字节 | `percent_change`：`0x40` 处的 16 字节 | `_percent_change`：`0x288` 处的 24 字节 |

réellement   `inspect_macho`读取 Mach-O,该工具经由 `xcrun`运行  référencement`otool -h -l`- Je suis là.`nm -gjU`- Je suis là.`dyld_info -imports -exports`et `dwarfdump --uuid` Votre lecteur n'a pas besoin de ces outils, mais il va lire avec `otool -l`输出相同 `symoff`et `stroff`La région de`open_binary`工具通过魔数识别 ELF、MZ、PE, ainsi que des machines à sous uniques ou génériques, également automatiquement lues `e_machine`C'est exactement ce que vous avez réalisé ici. Pour les fichiers sans titre, il faut fournir.`format: raw-binary`、architecture et adresse d'entrée.`0xcafebabe`C'est aussi le cas.

## La construction de soi

运行仅使用标准库的读取器:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch
python3 code/main.py
```

演示读取 `ledger-x86_64-O1.o`, sort le titre du fichier, les caractères, la redéplacement et le déplacement du fichier; puis sort le fichier de quatre fonctions, lire`ledger-arm64-O1.o`Il n'y a pas de comparaison;`tiny-x86_64`Les résultats de la procédure sont:

```text
percent_change: 16 bytes at file offset 0x40: 85 ff 74 09 29 fe 6b c6 64 99 f7 ff c3 31 c0 c3
grade: 46 bytes at file offset 0x50: 48 63 c7 48 69 c0 67 66 66 66 ...
entry 0x4000b0 is file offset 0xb0 through PT_LOAD
```

传入路径可读取单个文件:`python3 code/main.py code/fixtures/ledger-x86_64-O0.o`△读取器根据前四字节选择 ELF ou Mach-O──

按以下顺序阅读 `code/main.py`- Le numéro de la liste:

1. `ElfFile._read_header()`检查魔数、类别、字节序和条目大小, puis déballer le dossier
2. `ElfFile._read_sections()`Avec `read_cstring()`读取节头表,并通过 `e_shstrndx`解析名称。
3. `ElfFile._read_symbols()`- Je suis désolé .`st_info`, par le biais de `sh_link`解析名称,并保持保留节索引可读──
4. `ElfFile._read_relocations()`Tout le monde`SHT_RELA`- Je vous en prie.`r_info`,并依据表 4.9 为类型命名──
5. `ElfFile.function_span()`Avec `function_bytes()`Le symbole sera transformé en un fichier et en un caractère.
6. `ElfFile.file_offset_map()`按偏移排序每个结构,并补入未使用空间──
7. `ElfFile._read_program_headers()`Avec `address_to_file_offset()`处理可执行文件──
8. `MachOFile`读取文件头,加载命令,包含节的`LC_SEGMENT_64`- Je suis là.`LC_SYMTAB`- Je suis là.`LC_BUILD_VERSION`, ainsi que la réposition de chaque section.
9. `compare_formats()`Utilisation de deux documents pour démontrer la valeur de la même conception de relation relationnelle.

## Utilisez-le

Dans le cours suivant, le premier sera celui de la classe suivante.`code`Actuellement`sys.path`, encore une fois`from main import ElfFile`导入读取器──第 33 课会请求 `function_bytes`et `relocations_for(".text")` Section 35 课将其输出记录为观察证.  Section 36 课获取重定位偏移, afin de pouvoir être protégé de la position correspondante en fonction de la taille de la page.

Utilisation similaire `clang -target x86_64-unknown-linux-gnu -c`命令,将自己编写的C 编译为目标文件,再用读取器分析――只有 x86-64 psABI 表 4.9 列出的重定位名称才可添加;只有 gABI 或生成文件的工具链文档记载的节类型才可添加――遇到没有对应名称的值时,读取器打印了十六进制数,而不是猜测――

## 交互实验

### 实验 A: manuel

Dans le`code`Pour le démarrage de Python:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch/code
python3 -q
```

运行:

```python
import struct
from main import ElfFile, FIXTURES
data = (FIXTURES / "ledger-x86_64-O1.o").read_bytes()
data[:4], data[4], data[5]
struct.unpack_from("<HHIQQQIHHHHHH", data, 16)
elf = ElfFile(data)
elf.header.e_shoff, elf.header.e_shnum, elf.sections[elf.header.e_shstrndx].name
```

Le groupe montre`e_type`Pour 1`e_machine`Pour 62`e_shoff`Pour 1064, c'est-à-dire`0x428`                                                                                                                                                                                                                                                              `.strtab`Le nom du stockage

### 实验 B: commutateur 背后的值表

```python
rodata = elf.section_bytes(elf.section(".rodata"))
[int.from_bytes(rodata[i : i + 4], "little") for i in range(0x14, 0x28, 4)]
[int.from_bytes(rodata[i : i + 8], "little") for i in range(0x28, 0x50, 8)]
[r for r in elf.relocations_for(".text") if r.symbol == ".rodata"]
```

两张表都读出 `1, 2, 3, 4, 4`Pour le voir.`ledger.c`检查:`grade(65)`计算 `65 / 10 - 6 = 0`,读取条目 0, obtenir 1,即 `case 6`La valeur de la valeur`grade(100)`读取条目 4, obtenir 4,即 `case 10`Avec `case 9`Value de co-utilisation

###  expérience C: trois types de construction du même code

```python
for level in ("O0", "O1", "O2"):
    obj = ElfFile.from_path(FIXTURES / f"ledger-x86_64-{level}.o")
    print(level, [s.name for s in obj.sections if s.name in (".data", ".rodata")])
    print(level, sorted({r.type_name for r in obj.relocations}))
    print(level, {s.name: s.st_size for s in obj.symbols if s.type == "FUNC"})
```

-O0  objectifs de documentation `.data`节和三种重定位类型──-O1与-O2 目标文件没有 `.data`Il n'y a qu'un seul type.`total`Dans -O0 下为 66 字节,-O1 下为 31 字节,-O2 下为 140 字节──

### 实验 D:Mach-O 中的相同函数

```python
from main import MachOFile
macho = MachOFile.from_path(FIXTURES / "ledger-arm64-O1.o")
[(c.name, c.cmdsize) for c in macho.load_commands]
macho.function_span("_percent_change")
macho.function_bytes("_percent_change")[:4].hex()
```

函数范围为文件偏移 648 处的24 字节──前四个字节是 `a0000034`, qui est l' ordonnance`0x340000a0`En petit format,`llvm-objdump -d`La production et la production`cbz w0, 0x14`C'est tout à fait ça.`before == 0`Les données de protection sont fournies par le système de protection.`85 ff 74 09`Le même contrôle.

## 实践实验

扩展读取器,使其支持已链接程序──在 Linux x86-64 机器上,运行 `clang -O1 -shared -fPIC code/fixtures/ledger.c -o libledger.so`, et ajouter `main`后运行  référencement`clang -O1 code/fixtures/ledger.c -o ledger_main`Puis, avec un lecteur, analysez ces deux fichiers.

要求:

- Avec le même.`Elf64_Sym`布局读取 `.dynsym`Je suis désolé .`SHT_DYNSYM`Pour 11, et le format des enregistrements est inchangé.
- Il va`.dynamic`读取为由 `d_tag`et `d_val`组成 `Elf64_Dyn`记录,并依据 gABIDynamic Section页面命名 `DT_NEEDED`- Je suis là.`DT_STRTAB`- Je suis là.`DT_SYMTAB`- Je suis là.`DT_RELA`et `DT_JMPREL`Il y a une autre.
- Il va`st_shndx`Pour`SHN_UNDEF`De l'indicatif de l'importation`.rela.plt`Le centre`R_X86_64_JUMP_SLOT`Les enregistrements sont en cours d'utilisation.
- Selon le GABI, un document objectif contient une ou plusieurs règles, chaque section sera`PT_LOAD`段映射到其含的节点──
- - Je veux le faire .`address_to_file_offset`prova, partage des objectifs dans chaque fichier de fonction définie`function_bytes`De retour est le même.
- Je vais mettre deux dossiers.`llvm-objdump -h -t -r -p`et `llvm-objdump -T`文本采集到 `code/fixtures/`, et comparer les résultats des tests avec les résultats des analyses.

Équelles sont les caractéristiques de l'équipement de recherche et de recherche ?

## 评分实验

5 questions sur les fixations de ce cours.`code/lab_answers.json`◊ Numéro écrit en chiffre, ou écrit en chiffre `"0x40"`Une liste écrite en JSON.

1. `t1`Le nombre de personnes qui ont été arrêtées par l'État est de 6%.
2. `t2`:leger-x86_64-O1.o Moyen pourcentage_changement de la taille st_¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
3. `t3`Le texte de l'article est modifié par le texte de l'article.
4. `t4`:ledger-x86_64-O0.o 中的重定位类型名,排序后写成列表──
5. `t5`:ledger-x86_64-O1.o 中 .rodata+0x14 处的五个 int 值,写成列表──

检查你的答案:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch
python3 code/lab.py
```

 inspecteur dans les fixations soumises `code/main.py`计算每个期望值──它为每道题输出 `PASS`- Je suis là.`FAIL`Ou `TODO`Et le total, seulement cinq questions sont passées.`python3 code/lab.py my-answers.json`Je peux vérifier un autre dossier.`code/tests/test_lab.py`证明检查器接受正确答案并拒绝错误答案──

### Regardez ça fonctionne

[Inside a Decompiler](https://aiengineeringfromscratch.com/inside-a-decompiler)Le machine a mis ce cours comme ses deux premiers postes pour fonctionner.`percent_change`Le dossier de l'objectif, le coffre ouvert`.text`Il est également utilisé pour la communication de données.

## Le produit

本课产 出 `outputs/skill-program-anatomy-elf-from-scratch.md` Peut être utilisé pour Claude,Cursor,Codex,OpenClaw,Hermes ou tout autre logiciel intelligent de SKILL.md. Cette compétence transforme le fichier de compilation objectif ou fichier exécutable construit par l'utilisateur en rapport de mise en page, donne une portée de fichier pour chaque structure, symbole et réposition, et fournit des certificats de sortie aux outils de collecte de données.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

测试套件验证 Faits suivants:

- Dans trois x86-64  objectifs fichiers et micro types exécutables, chaque section indique 名称 サイズ 住所 类型 采集 `llvm-objdump -h`文本一致
- La valeur de chaque symbole, la liaison, le type, l'association, la taille et le nom sont tous associés à l'ensemble.`llvm-objdump -t`文本一致
- Chaque déviation de repose, type de nom, symbole et nombre sont en train de se rassembler.`llvm-objdump -r`文本一致, incluant -O0 下的 `R_X86_64_PLT32`et `R_X86_64_64`
- `tiny-x86_64`Les deux processus sont liés à l'acquisition.`llvm-objdump -p`文本一致, alors que les objectifs du document n'ont pas de processus
- `percent_change`位于文件偏移 `0x40`, la longueur 16 字节, 字节 correspond à l'attente, et chaque fonction est située `.text`En intérieur
- 文件偏移映射恰好覆盖每件的每字节一次,且 -O1 目标文件的三个对齐空隙位置正确
- `tiny-x86_64`Le point d'entrée`PT_LOAD`映射到文件偏移 `0xb0`, et peut être réaffiché objectif fichier refuser
- Mach-O 文件头、每条加载命令、段、五节、`LC_SYMTAB`et `LC_BUILD_VERSION`Les villes et les collections`--private-headers`文本一致
- Le code Mach-O et les 15 articles de recrutement`llvm-objdump`文本一致, et `_percent_change`位于偏移 648,长度 24 字节
- 错误魔数、32 位类别、大端文件、截断表、通用二进制文件和C 源文件都会触发 `FormatError`
- `build_tiny_elf.py`逐字节复现已提交的 `tiny-x86_64`
- 图示模块 `site/figures-re-32.js`包含 `ledger-x86_64-O1.o`Oui, c'est vrai.

## Mode de défaillance dans l'environnement de production

| 失败 | 不严谨的读取会报告什么 | 读取器必须证明什么 |
|---|---|---|
| 将 `st_value` 当成文件偏移 | “`percent_change` 在 0 处” | 偏移为 `sh_offset + st_value - sh_addr`，这里是 `0x40` |
| 将填充计为代码 | “`grade` 有 48 字节” | `st_size` 为 46，之后的 `66 90` 不属于任何符号 |
| 从错误的表读取节名称 | 乱码名称或异常 | `e_shstrndx` 指定名称表，这里是第 1 节 |
| 对 `SHT_NOBITS` 盲目信任 `sh_size` | 读到文件末尾之外 | `.bss` 不占文件字节，映射应跳过它 |
| 将零字节读成操作数 | “`lea 0(%rip)`” | `0x36` 处的 `.rela.text` 记录指定 `.rodata+0x10` |
| 将加数读成目标偏移 | “表从 `0x10` 开始” | `S + A - P` 结合指令末尾得到 `0x14` |
| 对剥离信息的可执行文件遍历节 | “文件没有代码” | `PT_LOAD` 映射加载器使用的每个地址 |
| 将链接地址视为运行时地址 | 随机基址下得到错误偏移 | 从 `PT_LOAD` 得到的文件偏移才是稳定坐标 |
| 只按 `sectname` 查找 Mach-O 节 | 两个 `__const` 节被合并成一个 | 名称应为 `segname,sectname` |
| 期待 `nlist_64` 有大小字段 | 异常或零字节 | 同一节内的下一个符号标记函数终点 |
| 将通用二进制文件当成单一 Mach-O 读取 | “未知魔数 `0xcafebabe`” | 拒绝读取，并要求提供单架构切片 |
| 在另一台 Mac 上重建 arm64 目标文件 | “夹具变了” | `LC_BUILD_VERSION` 记录 SDK，因此已提交的字节才是夹具 |

## 操作准则

读取可信的文件头, le long de la structure de positionnement de déviation,并根据定义字段的规范为每段命名. 读取可信的文件头,并根据定义字段的规范为每段命名. 读取可信的文件头,并根据定义字段的规范为每段命名. 读取可信的文件头,并根据定义字段的规范为每段命名. 读取可信的文件头,并根据定义字段的规范为每段命名. 读取可信的文件头,并根据定义字段的规范为每段命名. 读取可信的文件头,并根据定义字段的规范为每段命名. 读取可信的文件头,并根据定义字段的规范为每段命名. 读取可信的规范为每节的规范为某个值命名,就打印数值. 读取可取的字节核对的读者才是后节核对的可靠基础.

## 延伸阅读

- [System V gABI, 第 4 章：目标文件](https://www.sco.com/developers/gabi/latest/ch4.intro.html)Avec le [ELF Header](https://www.sco.com/developers/gabi/latest/ch4.eheader.html)- Je suis là .[Sections](https://www.sco.com/developers/gabi/latest/ch4.sheader.html)- Je suis là .[Symbol Table](https://www.sco.com/developers/gabi/latest/ch4.symtab.html), avec[Relocation](https://www.sco.com/developers/gabi/latest/ch4.reloc.html) page
- [System V gABI, 第 5 章：程序头](https://www.sco.com/developers/gabi/latest/ch5.pheader.html)Avec [Dynamic Linking](https://www.sco.com/developers/gabi/latest/ch5.dynamic.html)
- [System V ABI, AMD64 Architecture Processor Supplement](https://gitlab.com/x86-psABIs/x86-64-ABI), Tableau 4.9: type de réorientation
- [Apple XNU `loader.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/loader.h)- Je suis là .[`nlist.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/nlist.h), avec[`reloc.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/reloc.h)
- [17 U.S.C. 1201](https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title17-section1201&num=0&edition=prelim)Avec [Directive 2009/24/EC](https://eur-lex.europa.eu/eli/dir/2009/24/oj/eng)
- [Sega v. Accolade, 977 F.2d 1510](https://law.resource.org/pub/us/case/reporter/F2/977/977.F2d.1510.92-15655.html)Avec [Sony v. Connectix, 203 F.3d 596](https://law.resource.org/pub/us/case/reporter/F3/203/203.F3d.596.99-15852.html)
- [rea 6.5.0 `docs/binary-diagnostics.md`](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/binary-diagnostics.md)Avec [`docs/ghidra-provider.md`](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/ghidra-provider.md)
