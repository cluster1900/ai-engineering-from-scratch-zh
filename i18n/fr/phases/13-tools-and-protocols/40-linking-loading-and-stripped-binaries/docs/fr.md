# 链接、加载与剥离符号后的二进制:PLT、GOT、导入、修正与函数识别

> Le programme suivant le lien va réunir des fonctions qui ne contiennent pas lui-même. Le lien est utilisé pour ces fonctions, puis il est utilisé pour les réunir dans trois formats de table, puis il est utilisé pour les suivre jusqu'à ce que le chargement soit rempli et pour retrouver la fonction après la disparition du nom du produit de construction.

**Type:** Build
**Languages:** Python, C, x86-64 和 arm64 汇编
**Prerequisites:** Phase 13 · 32（从零理解 ELF）、33（反汇编与控制流）、38（调用约定）
**Time:** ~160 分钟

## Objectif de l'apprentissage

- Selon le registre et le tableau de référence, le lien d'évaluation sera traité à distance fixe, avec l'article PLT du GOT 槽位, ou en mode de redéfinition.
- 读取位置无关 ELF 可执行文件的动态节、PLT 和 GOT,并使用 psABI 公式沿着一次调用穿越这些结构──
- 读取 COFF 目标文件(20 字节文件头、40 字节节表项、18 字节符号记录、10 字节重定位记录) ainsi que l'entrée, sortie et sortie du PE32+ 映像的导入, sortie et sortie du nouveau lieu de travail.
- 逐字解码 Mach-O 链式修改链,并将每个字与 `dyld_info`Pour le contrôle.
- Pour chaque type de style`strip`删除什么、保留什么,并运行剥离后程序证明它仍然能工作──
- - Je veux le faire .`LC_FUNCTION_STARTS`、initiation de l'analyse et de la modification de l'objectif de récupération des éléments 64                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

##  problématique

Tu vas être`main.c`Avec `libledger.dylib`链接,并问一个代理:`main`Dans le`0x1000005a0`调用了哪个函数──agent 反汇编该指令,读到 `bl 0x100000694`Il y a 12 caractères:`adrp x16`- Je suis là.`ldr x16, [x16, #0x38]`- Je suis là.`br x16` agent 沿载操作追踪 `0x100004038`, lire jusqu' à 8 caractères `00 00 00 00 00 00 10 80`Le programme de rapport a été modifié par un indicateur de dégradation pour utiliser l'espace nucléaire.

Ensuite, vous avez déconnecté le même processus de la structure statique des produits, et vous demandez combien de fonctions il y a.`nm`, voir seulement un nom .`__mh_execute_header`Je réponds à un.

Les deux réponses sont de lire le document comme un processus en cours.`0x100004038`处的字是链式修正──第 63 位表示绑定,十二位表示下一个修正的位置,低位表示要绑定哪个导入──dyld 在 `main`运行前将该字替换为 `_puts`Les fichiers ont perdu leur code, mais ils sont conservés.`LC_FUNCTION_STARTS`, le dernier a énuméré les points de départ de toutes les cinq fonctions en neuf caractères.

Ce cours utilise Python standard library construire cinq lecteurs: COFF  Reader pour nos propres fichiers cibles, ainsi que PE32 +  Reader pour lire les importations, les exportations et les réaffectations du répertoire de localisation des emplacements;                                                                                                                                                                                                                                `dyld_info`逐字核对;读取动态节、PLT 和 GOT's ELF 读取器,加上预测这些目标文件经 PIE 链接会生成什么的规划器; using four methods查找已剥离构建中函数、并为各方法评分的函数查找器; ainsi que FLIRT 式签名构建器, redirectionne 字节设为通配,并计算尾部的CRC16──

Le lien est terminé. Le lien est terminé.`clang -target`编译;由于没有安装 ELF或PE 链接器, ces deux types de formats déjà liés sont écrits par des appareils 文件中的两个 Python 脚本按规范逐字节写出──`llvm-objdump`Et les programmes de recherche sont en mesure de les lire. Ils ne fonctionnent pas, comme le souligne le texte.

```figure
re-40-call-through-three-formats
```

## 链接器 comment traiter le redirection

Section 32 课读取重定位记录, Section 33 课将 `S + A - P`应用于一条 `lea`✿ Un enregistrement de la position`P`、type 符号 `S`et plus`A`◊x86-64 psABI Table 4.9 Pour chaque type donne une formule, dont `L`Pour les points de vue de la PLT,`G`Pour le déménagement,`GOT`Pour le localisation,`B`Pour les vidéos de la mise en ligne, notre dossier d'objectifs couvre trois résultats.

链接器将值写入字段,记录随之消失──针对输入中已定义符号的 `R_X86_64_PC32` appartient à cette situation.  Quelle que soit la façon dont le site est chargé, la distance entre les deux cycles d'un même film ne change pas.

链接器 créer un PLT 条目和一个GOT 槽位──针对未定义函数的 `R_X86_64_PLT32`Il est vrai que les gens ont des problèmes de santé.`L + A - P`, à savoir à une distance de l'objet.`.rela.plt`Le centre`R_X86_64_JUMP_SLOT`记录通知动态链接器 remplir ce lieu de réservation

链接器为载器保留一个重定位──`R_X86_64_64`Il n'y a pas de lien entre les fichiers et l'adresse de votre fichier.`.rela.dyn`Le centre`R_X86_64_RELATIVE`,公式为 `B + A`Il y a une autre.

`main-x86_64-O1.o`Il y a 18 articles:`.text`Le 14 de juin.`.data.rel.ro`Le deuxième`.rodata`Le deuxième est:`code/main.py`Le centre`plan_dynamic_link()`Les trois règles ci-dessus seront appliquées à ces enregistrements ainsi qu'à`ledger-x86_64-O1.o`- Le numéro de la liste:

| 记录 | 数量 | 决策 | 原因 |
|---|---|---|---|
| 指向 `.rodata`、`.L.str`、`fns`、`.rodata` 中表的 `R_X86_64_PC32` | 16 | 原地处理 | 符号在输入中已定义 |
| 指向 `percent_change`、`grade`、`total`、`grade_label` 的 `R_X86_64_PLT32` | 4 | 直接调用，不使用 PLT | 在 `ledger-x86_64-O1.o` 中已定义，因此链接器将 PLT32 化简为 PC32 |
| 两次指向 `puts`、两次指向 `printf` 的 `R_X86_64_PLT32` | 4 | PLT 条目和 GOT 槽位 | 未定义，由共享库提供 |
| 指向 `fns[]` 中 `grade` 的 `R_X86_64_64` | 2 | `R_X86_64_RELATIVE` | PIE 中的绝对地址字段 |

两个导入产生 48 字节 的`.plt`(PLT0 plus 2 16 字节条目)`.got.plt`(trois réserves de réserves plus deux réserves) et 48 字节的`.rela.plt`◊ Deux enregistrements de positionnement par rapport à la position ont été produits 48 字节 `.rela.dyn`Ces chiffres proviennent des normes appliquées à nos enregistrements.`tiny-dyn-x86_64`Les deux mêmes entrées ont réalisé la partie PLT de ce plan, dont la taille est en accord avec le plan.

Depuis les articles 2.31 ((H.J. Lu,2018-02-13) et LLVM 7.0.0 ((D43383,2018-02-20)`PLT32`,不论目标已定义与否―― décision权在链接器――, par conséquent, dans le fichier objectif `PLT32`Il n'est pas possible de préciser si l'on va utiliser des dispositions PLT.`R_X86_64_GOTPCRELX`et `R_X86_64_REX_GOTPCRELX`(le secteur de l'énergie)`G + GOT + A - P`) demande pas avec PLT de GOT 槽位, c'est `-fno-plt` forme née; 符号为本地符号时,链接器可能将其松为直接 `lea`Ou `call`(PSABI 附录 B)`R_X86_64_32`et `R_X86_64_32S`无法容纳 PIE's addresses, entraînera la défaillance du lien. Nos deux fichiers cibles ne sont pas apparus dans ces deux catégories de situations.

## 动态节、PLT et GOT

Le chapitre 5 de la GABI souligne que le fichier exécutable du lien participatif possède un fichier`PT_INTERP`Il doit être situé avant tout le passage qui peut être chargé; il doit également avoir une couverture.`.dynamic`节的 `PT_DYNAMIC`Il est là.`Elf64_Dyn`Deux groupes de groupes, chacun comprenant des symboles, des étiquettes et des valeurs,`DT_NULL`C'est fini !

`tiny-dyn-x86_64`Par`build_tiny_dyn_elf.py`按 gABI 和 psABI 写出,共 5,184 字节──它的动态节在 `0x1000`Il y a 12 groupes:

| 标签 | 编号 | 值 | 含义 |
|---|---|---|---|
| `DT_NEEDED` | 1 | `libc.so.6` | 字符串表偏移 `0xb`，指定要加载的库 |
| `DT_HASH` | 4 | `0x1a0` | SysV 哈希表 |
| `DT_STRTAB` | 5 | `0x188` | `.dynstr` |
| `DT_SYMTAB` | 6 | `0x140` | `.dynsym`，每条目 24 字节 |
| `DT_STRSZ` | 10 | `0x15` | 21 字节的字符串 |
| `DT_SYMENT` | 11 | `0x18` | 24 |
| `DT_PLTGOT` | 3 | `0x10c0` | `.got.plt` |
| `DT_PLTRELSZ` | 2 | `0x30` | 两条 24 字节记录 |
| `DT_PLTREL` | 20 | 7 | 记录类型为 `DT_RELA` |
| `DT_JMPREL` | 23 | `0x1b8` | `.rela.plt` |
| `DT_FLAGS_1` | `0x6ffffffb` | `0x08000000` | `DF_1_PIE`，GNU 标签 |
| `DT_NULL` | 0 | 0 | 结束 |

GABI explique pourquoi`DT_JMPREL`Il est possible de les ignorer pendant le démarrage du processus.`DT_FLAGS`Le centre`DF_BIND_NOW`- Je suis là.`DT_FLAGS_1`Le centre`DF_1_NOW`ou dans l'environnement`LD_BIND_NOW`L'équipe de communication de la communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de communication de l'équipe de communication de communication de l'équipe de communication de l'équipe de communication de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de communication de l'équipe de l'équipe de communication de l'équipe de l'équipe de communication de l'équipe de l'équipe de communication.

### Règlement de la PLT0 et des points

Les deux formes sont données en figure 5.2 par le paragraphe 5.2 de la section psABI.

```text
     1f0: ff 35 d2 0e 00 00    pushq  0xed2(%rip)      # 0x10c8 = GOT+8
     1f6: ff 25 d4 0e 00 00    jmpq   *0xed4(%rip)     # 0x10d0 = GOT+16
     1fc: 0f 1f 40 00          nopl   (%rax)

     200: ff 25 d2 0e 00 00    jmpq   *0xed2(%rip)     # 0x10d8 = GOT+24, the slot for puts
     206: 68 00 00 00 00       pushq  $0x0             # index 0 into DT_JMPREL
     20b: e9 e0 ff ff ff       jmp    0x1f0            # PLT0
```

亲手计算一次──RIP 相对位移后一条命令为基准──`0x1f6 + 0xed2 = 0x10c8`, qui est`.got.plt + 8`Il y a une autre.`0x1fc + 0xed4 = 0x10d0`, qui est`.got.plt + 16`Il y a une autre.`0x206 + 0xed2 = 0x10d8`, c'est le quatrième tranché.`0x210 - 0x20 = 0x1f0`, c'est-à-dire PLT0── chaque article est de 16 caractères, donc `exit`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `0x210`開始,将 `$0x1`Entrée, mise à jour`0x10e0`Il y a une autre.

GOT 保留三个槽位──psABI 5.2 规定:第零个条目保存 `_DYNAMIC`Les articles 1 et 2 du tableau de décalage sont également conservés.`.got.plt`内容为 `0x1000, 0, 0, 0x206, 0x216`◊glibc 加载文件时,将自己的 `struct link_map`填入槽位一,将 `_dl_runtime_resolve`填入槽位二──文件中的槽位三保存 `0x206`, qui est`puts@plt` interne `pushq`◊psABI                                                                                                                                                                                                                                                             

Ainsi, pour la première fois, il est nécessaire de mettre en œuvre`call 0x200`- Je suis désolé .`jmpq *0x10d8`Je suis tombée .`pushq $0`- Je suis désolé .`jmp 0x1f0`使 GOT+8 入并经 GOT+16 跳入解析器;解析器读取 `DT_JMPREL`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `R_X86_64_JUMP_SLOT puts`, dans le`libc.so.6`Le détail`puts`,将其地址写入 `0x10d8`, puis sautez dans le passé.`call`- Je suis là.`jmpq *0x10d8`Pour cette raison, à l'exception de la première fois, toutes les dépenses de transport ne sont effectuées qu'une seule fois.`%r11`Le script note explique l'un des choix de l'un des 38 cours: c'est un enregistrement temporaire, donc le code du PLT n'a pas besoin de surcharger pour enregistrer un enregistrement.

`.text`- Je suis là .`0x227`处的调用点字节为 `e8 d4 ff ff ff`, et `0x22c - 0x2c = 0x200`Il y a une autre.`llvm-objdump`Il est imprimé pour`callq 0x200 <puts@plt>`,并根据 `.rela.plt`记录为条目命名,`plt_entries()`Il est aussi utilisé de la même manière.

### Il n' y a rien dans le dossier

Le dossier n' a pas été trouvé .`PT_GNU_RELRO` Jacob Jelinek a proposé en 2004-01-06 dans une liste de courriels binaires RELRO: les parties qui seront écrites ne seront transférées qu'à la période de réposition, et les parties qui seront écrites seront ensuite utilisées.`mprotect`Le texte est en mode par défaut.`.init_array`- Je suis là.`.fini_array`- Je suis là.`.data.rel.ro`- Je suis là.`.dynamic`et `.got`- Je suis là.`.got.plt`Il n'y aura que trois réserves de 24 bits pour les autres, car les réserves restantes seront retardées.`-z now` mise en place `DF_BIND_NOW`,并将整个 `.got.plt`Il y a une RELRO complète, car après le lancement, il n'y a plus de références.`_dl_protect_relro`Pour la page à la page`mprotect(start, end - start, PROT_READ)`Il y a une autre.`-fno-plt`Dans le cadre de la rédaction,`jmpq *name@GOTPCREL(%rip)`, incapable de retarder, GCC Handbook nommé Tous les symboles externes sont en cours de chargement

Le dossier n'a pas de version.`libc.so.6`Il y a une autre .`.gnu.version`, chaque `.dynsym`条目对应一个 `Elfxx_Half`; encore une fois`.gnu.version_r`Chacun d'eux est en face de l' autre.`Verneed`, chaque édition nom pour l' article`Vernaux`- Je suis là.`printf@GLIBC_2.2.5`Ça veut dire:`printf`Dans le`.gnu.version`En ce qui concerne les données, le document contient un lien entre les données et les données.`vna_other`C' est comme ça.`Vernaux``vna_name`Pour le GLIBC_2.2.5, il appartient à`vn_file`Pour les autres, il est nécessaire de se préparer à la mise en œuvre de la politique de sécurité.`Verneed`△索引 0 表示本地,1 表示全局,第 15 位(`VERSYM_HIDDEN`- Je suis là.`0x8000`) faire regarder le lien jusqu'à une version.

C' est SysV`DT_HASH`, contient un baril et une section trois chaînes, total 24 字节──动态链接器需要 `DT_HASH`Ou `DT_GNU_HASH`Pour trouver le code dans le fichier, le fichier ne contient aucun contenu, il n'y a pas non plus de fonctionnement, donc il n'a pas encore été vérifié si le fichier accepte un seul fichier.

### .dynsym、.symtab avec la bande

Je vais vous dire`.dynsym`et `.dynstr`规定为分配内存的节,将 `.symtab`et `.strtab`                                                                                                                                                                                                                                                              

GNU `strip --strip-all`删除 `.symtab`- Je suis là.`.strtab`- Je suis là.`.debug_*`et `.comment` Toutes les parties de la distribution de l'inventaire seront conservées:`.interp`- Je suis là.`.dynsym`- Je suis là.`.dynstr`- Je suis là.`.gnu.hash`- Je suis là.`.gnu.version*`- Je suis là.`.rela.dyn`- Je suis là.`.rela.plt`- Je suis là.`.plt`- Je suis là.`.text`- Je suis là.`.rodata`- Je suis là.`.eh_frame`- Je suis là.`.init_array`- Je suis là.`.dynamic`- Je suis là.`.got`- Je suis là.`.got.plt`- Je suis là.`.data`- Je suis là.`.bss`Et note: les articles seront conservés, sauf ajout.`--strip-section-headers`(articles 2.41) ou运行 `llvm-strip --strip-sections`Il y a une autre.`--strip-debug`Pour garder un code.`--only-keep-debug`写出调试文件, puis disponible `--add-gnu-debuglink`Il l'a citée dans le dossier de la séparation et a été`.gnu_debuglink`中保存 CRC32;`ld --build-id`写入 `.note.gnu.build-id`, pour le réglage du matériel de correspondance.

## COFF 目标文件

`clang -target x86_64-pc-windows-msvc -O1 -fno-asynchronous-unwind-tables -c`Il est devenu`main-x86_64.obj`et `ledger-x86_64.obj` PE Format  page définit ce type de fichier: 20 caractères fichier tête, pas de titre à choisir, graphique par élément 40 caractères, graphique par élément 18 caractères, graphique par élément 10 caractères

`code/main.py`Le centre`CoffObject`读取这四部分──文件头给出机器类型 `0x8664`、10 个节、37 条 条 符号记录, ainsi que pour 0 `SizeOfOptionalHeader` Le référencement`.text`- Je suis là.`.data`- Je suis là.`.bss`Il y a six noms.`.rdata`            `/16`Il est en train de mourir.`/`Le titre de la première partie est le décimal de la liste des lignes, la liste des lignes est constituée de quatre lignes de la même taille.`/16`解析为 `.llvm_addrsig`Je suis là .`llvm-objdump -h`打印的名称──

37 条记录包含辅助记录──节符号(储存类别 3)带带一条辅助记录,保存节长度、重定位数、校验和及COMDAT 选择策略──五个`.rdata`节的选择值为 2,即any,每个都以 MSVC 修饰后的名称保存一个字符串字面量:`??_C@_04JDDJEAHN@even?$AA@`C'est le seul lien qui reste.`.file`, aide à la réalisation de la documentation`llvm-objdump -t`Je vais les imprimer pour`[ 0]`- Je suis là.`AUX scnlen ...`- Je suis là.`[ 2]`Également, j'ai sauté les indices de l'enregistrement; testera notre indice et nom comparer avec le même texte.

重定位 comprennent:`.text`- Je suis un homme.`IMAGE_REL_AMD64_REL32`, ainsi que `.rdata`Le nom de l' artiste`IMAGE_REL_AMD64_ADDR64`Il y a une autre.`REL32`C'est l'équivalent de 32 places de l'ordre du jour.`-4``R_X86_64_PC32`:ELF 记录携带加数 `-4`Parce que les enregistrements ont des numéros supplémentaires, et les enregistrements de COFF ne sont pas disponibles.`ledger-x86_64.obj`Dans le`0x36`- Je suis là.`0x84`et `0x93`Il y a trois articles.`REL32`, 32 课的`ledger-x86_64-O1.o`Les trois articles`R_X86_64_PC32`Il y a aussi trois écarts. Le code est le même, la différence de format ne réside que dans ce qu'il y a quatre écarts.`ADDR64`Oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui, oui`labels`, dans le film, change pour le lieu de résidence, comme `R_X86_64_64`变为 `R_X86_64_RELATIVE`Comme ça.

| | ELF `Elf64_Rela` | COFF 重定位 | Mach-O `relocation_info` |
|---|---|---|---|
| 记录大小 | 24 字节 | 10 字节 | 8 字节 |
| 字段 | 偏移、`r_info` 中的类型与符号、加数 | 偏移、符号索引、类型 | 地址，随后为含 symbolnum:24、pcrel:1、length:2、extern:1、type:4 的 32 位字 |
| 加数 | 显式给出 | 无，存于被修正字段内 | 无，或在真正记录之前有一条 `ARM64_RELOC_ADDEND` 记录 |
| 对 `puts` 的调用 | `R_X86_64_PLT32 puts-0x4` | `IMAGE_REL_AMD64_REL32 puts` | `ARM64_RELOC_BRANCH26 _puts` |

## Retour de l'appareil:

`tiny-x86_64.exe`Par`build_tiny_pe.py`写出,共 2,560 字节──它与微型ELF的任务相同:调用 `msvcrt.dll`Le centre`puts`et `exit`Il a également émis un nom, et a porté un nouveau lieu de base, de sorte que les trois catalogues nécessaires à ce cours sont complets.`pefile`Le 24 août`llvm-objdump -p`Tout le monde peut le lire, les deux sont captifs et sortants.

逐步浏览头部──MS-DOS 以 `MZ`- Je suis en train de bouger.`0x3c`处保存 `e_lfanew`, valeur pour`0x40`Il y a une autre.`0x40`Je suis signé .`PE\0\0`                                                                                                                                                                                                                                                              `0x8664`4 sections`SizeOfOptionalHeader`Pour 240   `0x22`(Pouvoir d'exécution de la vidéo 支持大地址)`Magic`字段开头, valeur pour `0x20b`, indique PE32+。`AddressOfEntryPoint`Pour`0x1000`- Je suis désolé .`ImageBase`Pour`0x140000000`- Je suis désolé .`SectionAlignment`Pour`0x1000`- Je suis désolé .`FileAlignment`Pour`0x200`- Je suis désolé .`SizeOfImage`Pour`0x5000`- Je suis désolé .`Subsystem`Pour le contrôle de la vie.`DllCharacteristics``0x8160`- Je suis désolé .`HIGH_ENTROPY_VA 0x0020`- Je suis là.`DYNAMIC_BASE 0x0040`- Je suis là.`NX_COMPAT 0x0100`et `TERMINAL_SERVER_AWARE 0x8000` Il y a ensuite 16 catalogues de données composés de RVA et de grandes quantités.`0x2080`Il est grand.`0x4d`, l'importation dans le répertoire se trouve `0x2000`Il est grand.`0x28`,基址重定位目录 se trouve dans `0x4000`Il est grand.`0xc`,IAT 位于 `0x2040`Il est grand.`0x18`Il y a une autre.

L'adresse dans l'image est RVA, c'est-à-dire le déplacement par rapport au déplacement du base de données chargée.`.text`Le RVA est`0x1000`, dans le document`0x200`Le dépôt de la commission`.rdata`Le RVA est`0x2000`, situé à`0x400`Le dépôt de la commission`.data`Le RVA est`0x3000`, situé à`0x600`Le dépôt de la commission`.reloc`Le RVA est`0x4000`, situé à`0x800`Il y a une autre.`PeImage.rva_to_offset()`C'est ce que je veux réaliser.

### 导入目录

RVA `0x2000`处 est composé de 20 caractères 导入描述符 ∞以全零描述符终止的数组.`0x2028`、 temps 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 `0x2068`、导入地址表 `0x2040` Nom RVA 指向 msvcrt.dll──查找表保存 64 位条目,以零结束──第 63 位置位表示按序号导入,序号位于第 15 至 0 位──第 63 位清零表示第 30 至 0 位是提示/name 条目的 RVA:先是 16 位提示值,即导出名称指针表中的索引,然后是ASCII 名称──我们的条目为`0x2058`(souci de valeur 0,puts)`0x2060`(souci de valeur 0,exit)

La norme indique que, avant la mise en ligne de l'image, le contenu de l'appareil était exactement le même que celui de l'appareil.`0x2040`Les deux RVA sont conservés.`0x2028`处的 24 字节等于 `0x2040`处的 24 字节──绑定期间,导入地址表的条目会被导入符号的 32 位(PE32) ou 64 位(PE32+)地址覆盖──Windows 加载器在入口点运行前完成此事──这里没有延迟绑定,也没有──代码直接访问槽位:

```text
    100b: ff 15 2f 10 00 00    call qword ptr [rip + 0x102f]   # 0x1011 + 0x102f = 0x2040, the IAT slot of puts
    1013: ff 15 2f 10 00 00    call qword ptr [rip + 0x102f]   # 0x1019 + 0x102f = 0x2048, the IAT slot of exit
```

`FF /2`Les deux instructions sont les mêmes, car le dernier se trouve après le premier, le slot de lecture se trouve aussi après le premier.`iat_calls()`Dans la section de code ,`ff 15`,加上六和位移,再依据导入目录为槽位命名──

### 导出目录

RVA `0x2080`处是 40 字节导出目录表:标志、时间、版本、指向tiny-x86_64.exe的名称 RVA、序号基数 1、1 个地址表条目、1个名称指针──随后有三张表──`0x20a8`处的导出地址表保存一个RVA `0x1000`Il y a une autre.`0x20ac`处的导出名称指针表保存一个指向字符串tiny_entry的 RVA──`0x20b0`处的导出序号表保存一个16位未加基数的索引 0──名称 `k`映射到地址条目 `ordinals[k]`, pour les élèves`ordinals[k] + ordinal base` La règle complète une règle que nous n'avons pas utilisée: si l'adresse est orientée vers l'intérieur, c'est un lien de transmission, par exemple `MYDLL.expfunc`; nom indice de référence  selon le classement des caractères, pour soutenir la recherche ──

### 基址重定位

`.reloc`保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块. 保存多块.`0x3000`、大小 12 条目 `0xa000`、type 10, à savoir`IMAGE_REL_BASED_DIR64`、 déviation 0, ainsi qu'un type 0 de remplissage`IMAGE_REL_BASED_ABSOLUTE` RVA`0x3000`处的八字节保存 `0x1400020d0`, qui est le fichier de l'image basée sur le fichier de l'image basée sur le fichier de l'image basée sur le fichier de l'image basée sur le fichier de l'image basée sur le fichier de l'image basée sur le fichier de l'image basée sur le fichier de l'image basée sur le fichier de l'image basée sur le fichier de l'image basée sur le fichier de l'image basée sur le fichier de l'image basée sur le fichier de l'image basée sur le fichier de l'image basée sur le fichier de l'image basée sur le fichier de l'image basée sur le fichier de l'image basée sur le fichier de l'image basée sur le fichier de l'image basée sur le fichier de l'image basée sur le fichier de l'image basée sur le fichier de l'image basse de l'image basée de l'image basée de l'image basée sur le fichier de l'image basée de l'image basée de l'image basée de l'image basée de l'image basée de l'image basée de l'image basée de l'image basée de l'image basée de l'image basée de l'image.`/DYNAMICBASE`, donc les vidéos sont prises .`.reloc`et `DYNAMIC_BASE`Il y a une autre.

Le code de la vidéo n'est pas disponible.`PointerToSymbolTable` Pour les images, il faut les réduire à zéro, car les informations de COFF sont abandonnées , le nom est conservé dans un PDB unique .`.pdata`, parmi lesquels `RUNTIME_FUNCTION`条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条  条  条 条   条   条  条       条     条      条                                                                                                                                                                                                                                                                                                                                                                                  

## Mach-O 映像: charge de commande 

`ledger_main`Il est en lien avec le dossier de l'article 64`otool -h`打印 19 条加载命令和标志 `0x00200085`Il y a une autre.`MH_NOUNDEFS 0x1`- Je suis là.`MH_DYLDLINK 0x4`- Je suis là.`MH_TWOLEVEL 0x80`et `MH_PIE 0x200000`L'ordre de l'article 19 comprend quatre articles.`LC_SEGMENT_64`(le secteur de l'énergie)`__PAGEZERO`- Je suis là.`__TEXT`- Je suis là.`__DATA_CONST`- Je suis là.`__LINKEDIT`), 两条 `LC_LOAD_DYLIB`(Première `@rpath/libledger.dylib`, `/usr/lib/libSystem.B.dylib`), ainsi que les différentes articles `LC_DYLD_CHAINED_FIXUPS`- Je suis là.`LC_DYLD_EXPORTS_TRIE`- Je suis là.`LC_SYMTAB`- Je suis là.`LC_DYSYMTAB`- Je suis là.`LC_LOAD_DYLINKER`- Je suis là.`LC_UUID`- Je suis là.`LC_BUILD_VERSION`- Je suis là.`LC_SOURCE_VERSION`- Je suis là.`LC_MAIN`- Je suis là.`LC_RPATH`- Je suis là.`LC_FUNCTION_STARTS`- Je suis là.`LC_DATA_IN_CODE`et `LC_CODE_SIGNATURE`Il y a une autre.`MachoFile.command_names()`返回与 `otool -l`Liste des mêmes et dans l'ordre correspondant:

`__TEXT`De `0x100000000`Je commence.`__text`      `0x100000558`,长 256 字节, seulement `main`, parce que quatre livres de calcul fonctionnent dans le dylib.`__stubs`      `0x100000658`,长 84 字节, contient sept 12 字节──`__DATA_CONST`De `0x100004000`開始,包含长 64 字节的 `__got`Il y a 8 types de points de repère.`S_NON_LAZY_SYMBOL_POINTERS`; également contenant长 32 字节的 `__const`, qui est`main.c``fns[]`et `names[]`Le tableau

### Un résultat

`_puts`La première est la première.`0x100000694`- Le numéro de la liste:

```text
    30 00 00 90    adrp x16, 0x100004000
    10 1e 40 f9    ldr  x16, [x16, #0x38]
    00 02 1f d6    br   x16
```

`0x90000030`Oui `adrp` Nom de l'émetteur de référence est à 16 places.`immlo`Dans la troisième à la quatrième position, la valeur est de 0.`immhi`Dans le 23e à 5e, la valeur est de 1...`immhi << 2 | immlo = 4`, l'unité est de 4 096 pages, donc la page cible est l'ordre de la page.`0x100000000`À la suite`0x4000`Il y a une autre.`0xf9401e10`Oui `ldr`, avec 8                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `0x38`, donc charger`0x100004038`Il y a une autre.`0xd61f0200`Oui `br x16`L'ordre de l'arm64 est exact.`StubAtom`Il y a une autre.

Le nom du lieu appartient à l'intermédiaire du nombre de symboles.`LC_DYSYMTAB`Indice de fichier de référence`reserved1` pointant le point de départ de l'indice de soi, us `reserved2`指出每个大小(12)。指针节使用 `reserved1`, chaque tranche est pour 8 caractères.`__stubs`Depuis le début,`__got`Depuis l'index 7 开始, donc  5 映射到符号表条目 10,即 `_puts`- Je suis désolé .`__got`Le même article.`otool -Iv`Il est possible de faire une impression sur ces deux indices.`indirect_table()`复现其中, chaque ligne

### 两级命名空间

`nm -m`打印 `(undefined) external _puts (from libSystem)`et `(undefined) external _grade (from libledger)`Les informations du livre proviennent du code lui-même.`nlist.h`Il va`GET_LIBRARY_ORDINAL(n_desc)` définition `n_desc`Le point 15 à 8 est de 1 à 1.`LC_LOAD_DYLIB`,2 à la deuxième article,`0xfe`Indiquer le mode de recherche,`0xff`Indiquer des fichiers exécutables.`ld(1)`Lorsque le lien est utilisé, il est possible de trouver des symboles dans les lignes directrices.`nm_lines()`Selon`n_type`- Je suis là.`n_sect`- Je suis là.`n_desc`et `n_value`染十二条记录,测试将将其输出和捕获的 `nm -m`- Je suis en train de faire une comparaison.`-Wl,-flat_namespace`Récitation du livre`otool -h`Je peux voir .`MH_TWOLEVEL`Il disparaît.

## 逐字节理解链式修正

`LC_DYLD_CHAINED_FIXUPS`C'est une histoire.`linkedit_data_command`- Le numéro de la liste:`dataoff 0x8000`- Je suis là.`datasize 208` This 208 字节 Suivre `fixup-chains.h`Il y a une autre.

Il y a 7 paragraphes à 32 pages:`fixups_version 0`- Je suis là.`starts_offset 32`- Je suis là.`imports_offset 80`- Je suis là.`symbols_offset 112`- Je suis là.`imports_count 8`- Je suis là.`imports_format 1`(le secteur de l'énergie)`DYLD_CHAINED_IMPORT`)`symbols_format 0`(未压缩)`llvm-objdump --macho --chained-fixups`Imprimez ces sept valeurs, testes les pour les comparer.

偏移 32 处是 `dyld_chained_starts_in_image`- Le numéro de la liste:`seg_count 4`Et quatre déviations, chaque section, sans modification de section.`__DATA_CONST`Il y a des modifications.`dyld_chained_starts_in_segment`内容为 `size 24`- Je suis là.`page_size 0x4000`- Je suis là.`pointer_format 6`(le secteur de l'énergie)`DYLD_CHAINED_PTR_64_OFFSET`, l'objectif est de déplacer la mémoire virtuelle)`segment_offset 0x4000`- Je suis là.`max_valid_pointer 0`- Je suis là.`page_count 1`, ainsi qu' un pour 0 `page_start`Il y a une autre.`DYLD_CHAINED_PTR_START_NONE`, qui est`0xffff`, indique que cette page n'a pas été modifiée.

链从文件偏移 `0x4000 + 0`开始──每 64 位字带有两条信息:应在此写入什么,以及下一个字在哪里──

```text
  dyld_chained_ptr_64_bind    ordinal:24  addend:8  reserved:19  next:12  bind:1 = 1
  dyld_chained_ptr_64_rebase  target:36   high8:8   reserved:7   next:12  bind:1 = 0
```

读取第一个字`0x8010000000000000`❖第 63 位置位,表示绑定──`next`位于第 62 至 51 位, valeur`0x002`, unité pour 4 caractères, donc la prochaine modification dans 8 caractères après.`0x4058`La deuxième lettre de la lettre`0x00000000000006db`△第 63 位清零,表示重设基址──`next`Pour 0, indique la fin de la chaîne.`0x6db`, c'est un déplacement de mémoire virtuel, plus le filmage.`0x100000000`后成为 `0x1000006db`, qui est`__cstring`Le mot "l'homme" est un mot qui signifie "l'homme".`0x00100000000006d6`则将 `names[0]`Le poids de la couche est de 5 à 7 cm.

Je suis en train de lire:`__got`Le numéro de milieu est de 0 à 7 fois lié,`__const`Le nombre de deux lignes est de 0.`fns[]`Les deux articles sont orientés vers`_grade`), ainsi que `names[]`Les deux premières étapes`chained_fixups()`返回它们及其文件偏移和原始字,测试将12对 `(offset, raw)`Avec `dyld_info -fixup_chain_details`Comparaison, le dernier à la première impression`raw: 0x8010000000000000 bind: (next: 002, bindOrdinal: 0x000000)`Il y a une autre.

偏移 80 处的导入表有八个32 位条目:`lib_ordinal:8`- Je suis là.`weak_import:1`- Je suis là.`name_offset:23`, le nom se trouve dans le parcours 112 . Le numéro 0 à 3 est de la base 1 .`_grade`- Je suis là.`_grade_label`- Je suis là.`_percent_change`- Je suis là.`_total`Le numéro 4 à 7 vient de la bibliothèque 2.`___stack_chk_fail`- Je suis là.`___stack_chk_guard`- Je suis là.`_printf`- Je suis là.`_puts`Il y a une autre.`fixup_rows()`连接两张表, génération `dyld_info -fixups`打印的行, par exemple `__DATA_CONST __got 0x100004038 bind libSystem/_puts`;测试比较全部十二行──

Donc,`0x100004038`Le point de détérioration de la chaîne est en fait introduit 7...`_puts`Apple explique dans sa présentation à la WWDC22: dans la position de 64 points de pointe de données, certains points comprennent jusqu'à un décalage de position de modification suivante.`main`运行前完成绑定──

### Il remplace la mise en page

`ledger_main_nochain`Utilisez le même processus de liaison, mais ajouter `-Wl,-no_fixup_chains`Il a changé d'usage.`LC_DYLD_INFO_ONLY`, contient quatre caractères: base de données à redéfinir 8 caractères, lié à 72 caractères, retardé à lier à 120 caractères, généré à 64 caractères.`__TEXT,__stub_helper`(108 字节) 、 seulement 16 字节且保存 `___stack_chk_guard`Avec `dyld_stub_binder``__got`, ainsi que `__DATA,__la_symbol_ptr`Il y a aussi des gens qui ont des problèmes.`dyld_info -fixups`列出七行 `lazy-bind`Et chaque article va avoir un retard de passage vers elle.`__stub_helper`Dans son propre saut.`dyld_stub_binder`,后者解析名称并写入槽位──这是前文 PLT 和 GOT 的马克-奥形态:`__la_symbol_ptr`Pour la`.got.plt`- Je suis désolé .`__stub_helper`Pour la PLT0 et `pushq $index`- Je suis désolé .`dyld_stub_binder`Pour la`_dl_runtime_resolve`Il y a une autre.`code/main.py` rapport des déviations et des sections du document, mais non résolues; la pratique exige que cette partie soit terminée.

### 导出典树

`LC_DYLD_EXPORTS_TRIE`Il s'agit d'un arbre pré. Chaque point est d'abord un uleb128 编码的终端数据大小;若非零, suivi d'un uleb128 标志和 uleb128 偏移; puis d'un nombre de sub-nôts d'un caractère; chaque nôte contient une string边和一个 uleb128 节偏移.`exports_trie()`Pour l'arbre.`libledger.dylib`, il est revenu `_percent_change 0x410`- Je suis là.`_grade 0x428`- Je suis là.`_total 0x464`- Je suis là.`_grade_label 0x498`, qui est`dyld_info -exports`Pour les fichiers exécutables, il revient.`__mh_execute_header`- Je suis là.`_fns`et `_main`Il y a une autre.

## dépouiller 留下什么

Les pommes`strip(1)`Expliquer que lorsque des liens dynamiques sont exécutés, ils comportent des comportements similaires à ceux de`-u -r`: conservation de symboles non définis et symboles de référence en mode dynamique`-x`删除本地符号──`-N`删除整个符号表和字符串表―― Pour le stockage de données, la plus grande classe de séparation est généralement -x, car le processus de liaison d'éléments est uniquement basé sur des symboles globaux──

Nous avons observé dans les tests:`strip ledger_main`Il va`LC_SYMTAB`De 12 条减为 10 条,并删除 `_main`- Je suis là.`_fns`et `_names`◊ 8 importations non définies sont conservées, car elles ont besoin de leur nom pour être liées;`__mh_execute_header`Je le garde aussi, parce que c'est.`REFERENCED_DYNAMICALLY`△第十条记录是一个类型为 `N_OPT`、名为 `radr://5614542`Le coup de couteau, Apple 工具 écrit dans pour assurer que le spectacle ne sera jamais vide;`nm`Il est imprimé en trois lignes, et est sorti en zéro.`LC_FUNCTION_STARTS`Il y a encore un point de départ, c'est-à-dire`main`Il y a une autre.

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `strip libledger.dylib`Il y a plus de choses que ça.`-x`En plus de tout:`LC_SYMTAB`Il y a des enregistrements.`nm`打印无符号──导出字典树仍然在相同偏移处列出四个函数,因为ld 通过字典树绑定,从不通过 `LC_SYMTAB`Il y a une autre.`LC_FUNCTION_STARTS`Il y a encore quatre points de départ.`main.c`Le lien avec le lien de séparation, pour montrer que le lien dépend aussi de cet arbre de l'écriture.

| 内容 | ELF 在 `--strip-all` 后 | PE 映像 | Mach-O 在 `strip` 后 |
|---|---|---|---|
| 静态符号表 | 删除 | 映像中从不存在 | 本地名称与已定义名称被删除，未定义导入保留 |
| 加载器绑定的名称 | `.dynsym` 和 `.dynstr` 保留 | 导入目录保留 | 导入保留在 `LC_SYMTAB` 和链式导入表中 |
| 导出的名称 | `.dynsym` 保留 | 导出目录保留 | 导出字典树保留 |
| 函数起点 | `.eh_frame` 的 FDE，除非构建时禁用了展开表 | 非叶函数的 `.pdata` | `LC_FUNCTION_STARTS` 保留 |
| 调试信息 | `.debug_*` 删除 | 位于 PDB，从不在映像中 | 位于 dSYM，从不在映像中 |
| 节头或加载命令头 | 除非使用 `--strip-section-headers`，否则保留 | 保留 | 保留 |

## 没有符号时查找 fonction

`static-arm64-O2`Il va`main-arm64-O2.o`Avec `ledger-arm64-O2.o`链接为一个可执行文件,`__text`Il y a cinq fonctions.`nm -n`C'est vrai.`_main`      `0x100000500`(voir le paragraphe 244)`_percent_change`      `0x1000005f4`(24),`_grade`      `0x10000060c`60),`_total`      `0x100000648`(248),`_grade_label`      `0x100000740`(72):`static-arm64-O2.stripped``__text`Il n' y a pas de`N_SECT`- Je suis un homme.`FunctionFinder`Il y a quatre méthodes à suivre.`score()`Comparer chaque liste avec la base réelle.

### LC_FUNCTION_STARTS

L' ordre est direct.`__LINKEDIT`Le nombre de pages:`80 0a f4 01 18 3c f8 01 00`◊ Format est uleb128 增量,第一个以 `__TEXT`Le lieu de résidence`80 0a`Pour`0x500`, donc le premier point de départ est `0x100000500`Il y a une autre.`f4 01`Pour`0xf4`Je suis là .`0x1000005f4`Il y a une autre.`18`Je l' ai reçu .`0x10000060c`- Je suis désolé .`3c`Je l' ai reçu .`0x100000648`- Je suis désolé .`f8 01`Je l' ai reçu .`0x100000740`- Je suis désolé .`00`La liste est terminée.`-O0`et `-O2`Les cinq autres sont tous sortis, sans erreur.`strip`Il ne change pas. La fonction machine démarre.`dyld_info -function_starts`Il est imprimé, il est exposé.`function_starts`Il y a une autre.

### 序言扫描

Ghidra' s AARCH64  Résumé`fd 7b bf a9`开始,即 `stp x29, x30, [sp, #-0x10]!`Dans nos dossiers, il est dans deux niveaux d'optimisation où il ne se trouve que 0/5―clang avant génération`sub sp, sp, #N`, régénération en mode correctement déplacé `stp x29, x30, [sp, #M]`, par conséquent, il n'y a jamais eu de précédent indice de forme.`sub sp, sp, #imm`Utilisation de la couverture`(word & 0xff0003ff) == 0xd10003ff`, dans chaque fonction il y a des  `-O0`Je peux trouver 5/5, alors que dans `-O2`Je n'ai trouvé que 1/5, parce que`percent_change`- Je suis là.`grade`- Je suis là.`total`et `grade_label`Tout est sans fonction de feu.`percent_change`É`cbz w0, ...`Le commencement. Le premier ouvrage de sélection de texte est le contenu que le compilateur choisit de générer.

Il n'y a pas d'erreur dans les deux analyses, car le processus est très petit.`push rbp`Les résultats`55`C'est le mode de caractères, qui se trouve à l'intérieur des autres instructions; par conséquent, le modèle de Ghidra x86-64 est le même.`55 48 89 e5`Ce type de mode de retrait`ret`Ou `nop`Ce type de mode de préposition est associé à une fonction.

### 调用目标

`__text`Chaque groupe`bl`Tout cela se passe en fonction du point de départ, car le compilateur ne génère pas de code C pour sauter dans le milieu de la fonction.`bl` 编码为`0x94000000`, avec un symbole de 26 places de déplacement.`0x1000005a0`- Je suis là.`bl`字节为 `3d 00 00 94`- Le numéro de la liste:`0x3d`Oui, 61, 4 est`0xf4`, c'est pourquoi l'objectif est de`0x100000694`Dans le monde entier.`ledger_main`C'est le centre.`_puts`Dans la construction statique,`call_targets()` collecte `__text`内部的目标, abandonné `__stubs`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `LC_MAIN`Entrée, parce que aucune fonction n'est utilisée.`main` Deux niveaux d'optimisation ont été trouvés 5/5♦Nucléus(Andriesse、Slowinska、Bos,2017) basé sur ce processus de révision des fonctions dans le code généré par l'équipe de rédaction;Andriesse  et autres ont indiqué dans une mesure de 2016 que les limites des fonctions sont des points difficiles à rédiger, plus difficiles que les limites des instructions.

## Flirter avec une femme

Hex-Rays décrit dans le document FLIRT comme suit: le modèle est le premier 32 caractères de la fonction , dont tous les caractères variables sont marqués , les caractères variables proviennent de modifications et de citations externes, le modèle est dans l'arbre; après le modèle,  nous commençons à calculer le CRC16 du caractère 33 à partir de la position, jusqu'à ce que nous rencontrons le premier caractère variable, et conservons cette longueur. Le modèle et le CRC conservent cette longueur. Deux fonctions similaires, à travers le bout de la partie, distinguent des caractères de certaines positions différentes, puis à travers leur nom de référence . Si aucune information ne peut distinguer les conflits, alors  la fonction humaine de résoudre .

`signatures_from_object()`De `ledger-arm64-O2.o`et `main-arm64-O2.o`Construire ce type de signature, comme FLAIR de la bibliothèque de fichiers cibles Construire une signature comme...`relocation_info`记录覆盖一个四字节字, ces caractères sont devenus可变字节.`.pat`Résultats de la mise en page`:0000`Nom et nom, ainsi que chaque référence au nom`^offset name`- Le numéro de la liste:

```text
A00000342800004B890C8052087D091B000DC01AC0035FD6 00 0000 0018 :0000 _percent_change
E8CC8C52C8CCAC72087C289B09FD7FD308FD62930801090B081900511F110071 04 9AAF 003C :0000 _grade ^0000 l_switch.table.grade ^0001 l_switch.table.grade
E8CC8C52C8CCAC72087C289B09FD7FD308FD62930801090B081900511F110071 04 9AAF 0048 :0000 _grade_label ^0000 l_switch.table.grade_label ^0001 l_switch.table.grade_label ^0002 _labels ^0003 _labels
```

`_percent_change`长 24 字节, donc le mode est l'ensemble de la fonction, le CRC 长度为 0。`_grade`长 60 字节,第一个重定位在字节 36, c'est pourquoi le CRC couvre quatre caractères.`.pat`解析器中的算法:多项式 `0x8408`, première valeur `0xffff`,取反, re-échanger deux caractères.`0x6e90`, test sera fixé ici.

`match_signatures()`Dans chaque fonction de construction détachée, essayez chaque signature, d'abord l'adaptation, de nouveau l'adaptation CRC.`-O0`Les cinq fonctions sont toutes restaurées, aucun conflit.`-O2`Les deux lignes sont en conflit.`grade_label`Je suis en train de le faire.`grade`, donc deux fonctions partagées, ainsi que les quatre caractères CRC.`0x10000060c`et `0x100000740`Les deux parties se séparent.`_grade`Oui `20`- Je suis désolé .`_grade_label`Oui `28`,分别对应 `ldr w0, [x9, w8, uxtw #2]`Avec `ldr x8, [x9, w8, uxtw #3]`, longueur séparée de 60 et 72;. rapport enregistré deux conflits et des caractères déterminés;. deux niveaux d'optimisation ont été nommés avec succès 5/5。

测试  répéteur`test_object_bytes_equal_linked_bytes_outside_relocated_words`Check this premise: tous les caractères non variables de chaque fonction de fichier cible sont égaux aux caractères du fichier exécutable lié au même emplacement, de sorte que le lien d'installation modifie uniquement les caractères de redéposition.`_total`Il n'y a pas de repose, pas de changement.

### 工具如何运用同样思路

IDA Pro 9.4  accompagné de différents processeurs de FLIRT  signature, ainsi que pour la construction de signature `sigmake`工具;IDA Free 仅支持 x86 和 x86-64, limité à l'utilisation non commerciale。Lumina est un serveur avec une fonction md5 pour le stockage de données de fonctions clés, qui saute sur une fonction de 32 caractères insuffisantes。Ghidra 12.1.4(Apache-2.0) avec ID de fonction: pour aider les notes et le mode d'adresse calculer la complète hash, ce qui rend sa capacité à résister aux changements causés par les liens; également avoir à ajouter des indices de calculs constants spécifiés hash, selon la notation des instructions de mise en place, en utilisant les fonctions parent pour briser la plage; sa base de données annexe ne couvre que la Visual Studio Library, vous pouvez remplir votre propre base de données à partir de votre propre ordinateur.`zg`- Je suis là.`z/`- Je suis là.`zb`),并用 `zfs`读取 Flirte `.sig`文件;rizin 0.9.1(LGPL-3.0) `Fc`De l'ouverture du système de création`.pat`Ou `.sig`, utilisez `Fs`Il est également un des principaux acteurs de la société.

IDA et Binary Ninja sont des outils de source fermée, dont la présentation est basée sur son dossier.`clang`- Je suis là.`ld`- Je suis là.`llvm-objdump`- Je suis là.`otool`- Je suis là.`nm`- Je suis là.`strip`et `dyld_info`, ainsi que des outils de recherche LIEF 1.0.0 ▌, qui fonctionnent par le biais de programmes de détection 0.33 ▌ et du profil 2024.8.26 ▌LIEF a lu tous les formats qui y figurent, y compris les fichiers objectifs COFF pris en charge depuis 0.17.0; il s'agit de `ledger_main`報告十次绑定和两次基址重设,即同样十二次修正──pytools 只读取 ELF文件──profil 以`PEFormatError: 'DOS Header magic not found.'`- Je ne veux pas .`main-x86_64.obj`Mais avec succès, j'ai pu lire une vidéo.

## 亲手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries
python3 code/main.py
```

输出 est un rapport JSON contenant 5 parties.`elf`preser le nombre de réposition de deux dossiers objectifs `tiny-dyn-x86_64`Les résultats de la recherche ont été positifs.`coff`保存两个目标文件的节、重定位、函数和未定义名称──`pe`保存 `tiny-x86_64.exe`Les données de référence sont les données de référence de l'entreprise.`macho`保存 `ledger_main`Les modifications et les émissions de données`ledger_main_nochain`Le rapport de la Commission sur les mesures de sécurité et de sécurité a été publié en décembre.`identification`保存 `-O0`et `-O2`Les quatre méthodes de réalisme et de signature et de conflit

预期 structure:

```json
{
  "elf": {"linkPlan": {"pltSymbols": ["puts", "printf"], "sizes": {".plt": 48, ".got.plt": 40, ".rela.plt": 48, ".rela.dyn": 48}, "...": "..."}, "tiny-dyn-x86_64": {"...": "..."}},
  "coff": {"main-x86_64.obj": {"...": "..."}},
  "pe": {"imports": [{"dll": "msvcrt.dll", "iat": "0x2040", "...": "..."}], "...": "..."},
  "macho": {"ledger_main": {"flags": "0x200085", "fixupRows": ["__DATA_CONST __got 0x100004000 bind libledger/_grade", "..."], "...": "..."}, "strip": {"...": "..."}},
  "identification": {"O2": {"methods": {"functionStarts": {"recall": "5/5"}, "prologueSub": {"recall": "1/5"}, "...": "..."}, "correctNames": 5}}
}
```

按以下顺序阅读 `code/main.py`- Le numéro de la liste:

1. `ElfFile`读取头部节 两张符号表和重定位,`dynamic_entries()`- Je suis là.`jump_slots()`- Je suis là.`plt_entries()`et `plt0()`读取已链接映像──
2. `plan_dynamic_link()`Les sections 4.9 et 5.2 sont appliquées aux dossiers de redéplacement des fichiers objectifs de redéplacement.
3. `CoffObject`读取文件头、节表、带辅助记录的18 字节符号记录, ainsi que de 10 字节重定位记录──
4. `PeImage`读取 MS-DOS 、PE 签名、可选头、数据目录、节, ainsi que le référentiel de réposition des importations, des exportations et des bases,`iat_calls()`- Je suis désolé .`ff 15`Il y a une autre.
5. `MachoFile`Je suis en train de faire une commande.`nlist`记录、间接符号表、、链式修正、导出字典树和目标文件重定位──
6. `FunctionFinder`运行四种起点搜寻器,`score()`Comparer chaque résultat avec le fondement réel.
7. `signatures_from_object()`et `match_signatures()`构建并应用 FLIRT 式签名──
8. `parse_*`函数读取捕获的工具文本,供测试对照──

更多命令:`python3 code/main.py elf FILE`- Je suis là.`coff FILE`- Je suis là.`pe FILE`et `macho FILE`Chaque éditeur doit publier un rapport.`python3 code/main.py plan OBJECT...`打印任意一组 ELF 目标文件的链接规划──`python3 code/main.py functions STRIPPED UNSTRIPPED OBJECT...`Résultats de recherche et de signature sur votre propre produit de construction.

##  réel usage

Pour le programme que vous construisez, utilisez le lecteur en suivant l'ordre suivant:

1. 读取头部, déterminer le format et la catégorie:可重定位目标文件、可执行文件或共享库──读取器会拒绝不认识的内容,这种 rejet en soi est aussi l'information──
2. 列出导入 et ses fournisseurs: usage `DT_NEEDED`et `.dynsym`、l'importation de l'étiquette ou de la liste de l'importation en chaîne`LC_LOAD_DYLIB`◊ chaque utilisation du nom de la liste sera abandonnée à l'image actuelle.
3. Le manuel suit une fois la rédaction jusqu'à son emplacement. Le rédacteur en chef de l'équipe de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction de rédaction.
4. Comparer les symboles avec les sorties et les fonctions.`strip`后保留, 仅调试器需要的名称则不会──说明缺失名称原本属于哪一组──
5. Dans la construction déjà détachée, le moteur de recherche utilisable, et en utilisant la liste des références de l'écrivain, c'est-à-dire`LC_FUNCTION_STARTS`- Je suis là.`.pdata`Ou `.eh_frame`, au lieu de la méthode de caractères, il n'est pas utilisé pour remplir les espaces vides.
6. De ses propres documents cibles, il construit et applique une signature. Il enregistre chaque conflit et en détermine les caractères.

Les outils capturés seront conservés avec les documents. Les outils seront récupérés en cas de changement, car la modification de la liste de sortie signifie que les outils de test seront également modifiés.

## 交互实验

### 实验 A: analyse de main

Dans le`code`Pour le démarrage de Python:

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries/code
python3 -q
```

运行:

```python
from main import *
elf = load_elf("tiny-dyn-x86_64")
[(e.tag_name, e.text) for e in elf.dynamic_entries()]
elf.plt0()
[(e.symbol, hex(e.address), hex(e.slot), hex(e.slot_initial)) for e in elf.plt_entries()]
[hex(w) for w in elf.got_plt_words()]
```

Avant chaque rédaction, d'abord selon les caractères de l'article ci-dessus.`build_tiny_dyn_elf.py`Le centre`IMPORTS`改为三个名称, reconstruire, et apprendre à faire`.plt`- Je suis là.`.got.plt`et `.rela.plt`De la nouvelle taille.

### 实验 B: une correction de chaîne

```python
exe = load_macho("ledger_main")
stub = next(s for s in exe.stubs() if s.symbol == "_puts")
stub.lines()
raw = int.from_bytes(exe.read(stub.slot, 8), "little")
hex(raw), raw >> 63, (raw >> 51) & 0xfff, raw & 0xffffff
[(i.index, i.name, i.library) for i in exe.chained_fixups()["imports"]]
```

Avant de déchiffrer le code de la carte`next`字段、序号──然后读取八字节后的字,确认它是下一个修正──再读取链中位于 `0x100004058`Le dernier mot, explique pourquoi.`next`Pour le moins.

### 实验 C: séparation et relieu

Dans les fichiers actuels, un nouveau programme sera lancé avec une nouvelle version de la suite:

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries/code/fixtures
clang -target arm64-apple-macos -O1 main.c -L. -lledger.stripped -Wl,-rpath,@executable_path -o /tmp/relinked
nm /tmp/relinked | grep ' U '
dyld_info -exports libledger.stripped.dylib
```

Même si c'est le cas.`LC_SYMTAB`Pour l'instant, le lien peut encore réussir, parce que le lien reçoit un lien vers le bas.`python3 ../main.py macho libledger.stripped.dylib`, comparer `symtab`- Je suis là.`exports`et `functionStarts`                                                                                                                                                                                                                                                              `-N`剥离静态构建, voir voir voir `dyld_info -function_starts`Je vais toujours imprimer.

### 实验 D: conflit

```python
from main import *
stripped = load_macho("static-arm64-O2.stripped")
sigs = signatures_from_object(load_macho("ledger-arm64-O2.o"))
[s.pat_line() for s in sigs]
starts = FunctionFinder(stripped).function_starts()
match_signatures(sigs, stripped, starts)
```

阅读两条冲突记录──然后从 `ledger-arm64-O0.o`构建签名, avec`static-arm64-O0.stripped`匹配,并根据 `.pat`行 expliquer pourquoi `-O0`Il n'y a pas de conflit.`PATTERN_LENGTH`缩短到 16,统计有多少函数发生冲突──

## 实践实验

解码旧版绑定表,并添加 PE 查找器──

要求:

- Il va`ledger_main_nochain``LC_DYLD_INFO_ONLY`基址重设、绑定和延迟绑定操作码流解码为包含段、节、地址、类型及目标的行,使其与捕获的`dyld_info -fixups`文本中 21 行一致。
- Dans le`build_tiny_dyn_elf.py`À la suite de`PT_GNU_RELRO`程序头和带 `DF_BIND_NOW``DT_FLAGS`,将 `.got.plt`移入覆盖范围, faire `llvm-objdump -p`显示新头部──在装备中 README说明这复现了完整RELRO的哪一部分,以及哪一部分只能由glibc 执行──
- Pour PE32+ 映像编写 `.pdata`读取器, ainsi que l'utilisation `RUNTIME_FUNCTION`起始地址的函数查找器──使用 `clang -target x86_64-pc-windows-msvc -c`Construire un objectif de document, plus `-fno-asynchronous-unwind-tables`, 读取其 `.pdata`重定位,并说明哪些函数是该表省略的叶函数──
- Pour chaque lecteur, des tests comparatifs sont effectués avec des textes de capture.

Les critères de réussite:`python3 code/main.py macho ledger_main_nochain`打印与 `dyld_info`Parallèlement à 21  行修正; micro ELF 携带能被 `llvm-objdump`列出的 `PT_GNU_RELRO`Le dépôt de la commission`.pdata`查找器命名它能找到的函数,并列出它无法找到的叶函数──

## Le produit

本课包含 `outputs/skill-linking-loading-and-stripped-binaries.md` Il transforme le programme que vous construisez en un rapport: liste des importateurs et fournisseurs, une fois de plus, il réutilise le suivi des emplacements de remplissage du chargement, description `strip`删除和保留的内容,并进行评分,并进行评分,并进行评分,并进行评分. 删除的内容,并进行评分. 删除的内容,并进行评分.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries
python3 code/main.py
python3 code/tests/test_main.py
```

验证应证明:

- `tiny-dyn-x86_64`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `llvm-objdump -p`逐标签一致, et `DT_FLAGS_1`- Je suis là.`DF_1_PIE`
- - Je suis là.`R_X86_64_JUMP_SLOT`记录与 `llvm-objdump -R`致,并分别命名 `puts`et `exit`
- PLT0 va GOT+8 entrer 并经 GOT+16 跳转, chaque article lire son propre slot 并将索引, chaque slot 保存其自身 `pushq`À l'adresse
- 微型 ELF 节和程序头与 `llvm-objdump -h -p`Un groupe
- 两个 ELF 目标文件的重定位记录与 `llvm-objdump -r`Un groupe
- 链接规划 查找两个PLT 符号、四次直接调调用、两条相对重定位,以及微型视频各部分的大小
- 37 articles de code de la COFF 节表、 contenant des documents d'aide et des documents de réaffectation et de réaffectation`llvm-objdump -h -t -r`Un致, et `/16`解析为 `.llvm_addrsig`
- `ledger`Je suis en train de faire une petite fête.`REL32`记录位于三个 ELF `PC32`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
- Le PE`DllCharacteristics`et le répertoire de données`llvm-objdump -p`Un groupe
- 导入目录、intuition/nom 条目和 IAT avec `llvm-objdump`及 `pefile`Un coup, et avant de se lier IAT est comme chercher des feuilles
- 导出目录和 `DIR64`基址重定位可正确解码,重定位后的指针指向字符串链接手头
- RVA `0x100b`- Je suis là.`ff 15`解析 jusqu' à `puts`Le dépôt de l'IAT
- Mach-O 标志、19 个加载命令名称和两个库与 `otool`Un groupe
- 7 可解码并对应 à 8 `__got`槽位,间接符号表与 `otool -Iv`Un groupe
- 链式修正头部与 `llvm-objdump --macho --chained-fixups`Un groupe
- 链遍历复现 `dyld_info -fixup_chain_details`Tous les 12 premiers mots
- 修正行和导入表与 `dyld_info -fixups`及 `-imports`Un groupe
- Le livre de référence et ses extraits`dyld_info -exports`Un groupe
- pour les documents exécutables et leurs copies,`nm_lines()`Ça va .`nm -m`
- `strip`删除 `_main`- Je suis là.`_fns`et `_names`, conserver 9 noms et une article `radr://5614542`l'impression et la sortie du même procédé
- 旧布局具有 `LC_DYLD_INFO_ONLY`、7 points de retard, ainsi que des points de retard`__stub_helper`Le fondement
- arm64 目标文件重定位与 `llvm-objdump -r`Un groupe
- `LC_FUNCTION_STARTS`Dans les deux niveaux d'optimisation, tous les 5/5, et avec`nm`et `dyld_info -function_starts`Un groupe
- `sub sp`扫描在 `-O0`找到 5/5, dans `-O2`找到 1/5, alors `stp`扫描一个也找不到
- `bl` objectifs `LC_MAIN`Retour à l'entrée 5/5
-  Signature dans deux niveaux d'optimisation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  `grade` conflit
- 123456789  du CRC16 pour `0x6e90`, et`main`Les 8 caractères de la loi sont modifiés .
- Chaque caractère du fichier objectif non variable est égal à celui du fichier déjà lié.
-  Présentation et rapport de données graphiques identiques à l'adresse et à la même date

## Mode de défaillance dans l'environnement de production

| 失败情况 | 能力不足的工具如何报告 | 分析必须证明什么 |
|---|---|---|
| `bl` 或 `call` 落入桩 | “调用了 0x694 处的未命名函数” | 桩的字节、它加载的槽位，以及该槽位绑定的导入 |
| 从文件读取 GOT 字 | “损坏指针 0x8010000000000007” | 第 63 位表示绑定，`next` 为 2，序号 7 是来自库 2 的 `_puts` |
| 目标文件中的 `PLT32` | “每次调用都经过 PLT” | 已定义符号被化简为直接距离，只有未定义符号才获得条目 |
| 将部分 RELRO 误读为完整 RELRO | “GOT 是只读的” | 不使用 `-z now` 时，`.got.plt` 中三个保留槽位之后的槽位位于 `PT_GNU_RELRO` 之外 |
| 将 COFF `REL32` 与 ELF `PC32` 比较 | “Windows 构建使用了不同重定位” | 偏移相同，`-4` 分别存于 ELF 加数和 COFF 字段中 |
| 加载前读取 IAT | “导入指向字符串” | 加载器绑定之前，IAT 等于查找表，而这些字符串属于 hint/name 条目 |
| 已剥离的 dylib | “没有符号，也没有导出” | 导出字典树和 `LC_FUNCTION_STARTS` 列出每个函数 |
| 在已剥离可执行文件上运行 `nm` | “一个函数” | `LC_FUNCTION_STARTS` 用九字节列出五个起点 |
| 在 `-O2` 下扫描序言 | “一个函数” | 四个叶函数没有栈帧，调用目标和起点表能找到它们 |
| 两个函数共享 36 个字节 | “grade_label 就是 grade” | 尾部字节 44 以及长度 60 和 72 将冲突区分开 |
| 在另一台机器的构建产物上运行工具 | 本文中的数字 | 从你自己的测试夹具重新捕获每份清单 |

## 操作准则

De chaque point de chargement à chaque point de chargement extérieur, le chargement est effectué jusqu'à l'adresse du chargement; avant de mettre en place un code de chargement, le chargement est définie en format.

## 延伸阅读

- [System V gABI，第 5 章：程序加载与动态链接](https://www.sco.com/developers/gabi/latest/ch5.dynamic.html)
- [System V 应用二进制接口，AMD64 架构处理器补充规范：第 5.2 节与表 4.9](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Drepper，《如何编写共享库》，版本 4.1.2](https://akkadia.org/drepper/dsohowto.pdf)
- [Drepper，《ELF 符号版本控制》](https://akkadia.org/drepper/symbol-versioning)
- [Jelinek，《对 DSO/可执行文件进行少量加固以抵御利用》，binutils 邮件列表，2004-01-06](https://www.sourceware.org/ml/binutils/2004-01/msg00070.html)
- [Taylor，《链接器 relro》，2008](https://www.airs.com/blog/archives/189)
- [binutils 提交 bd7ab16b：为调用使用 PLT32，2018-02-13](https://gnu.googlesource.com/binutils-gdb/+/bd7ab16b4537788ad53521c45469a1bdae84ad4a)et [LLVM D43383](https://reviews.llvm.org/D43383)
- [GNU Binutils：strip](https://sourceware.org/binutils/docs/binutils/strip.html)et [llvm-objcopy](https://llvm.org/docs/CommandGuide/llvm-objcopy.html)
- [Microsoft，PE 格式](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format)
- [CALL 指令参考，FF /2](https://www.felixcloutier.com/x86/call)
- [Apple，mach-o/loader.h](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/loader.h)et [mach-o/nlist.h](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/nlist.h)
- [Apple dyld, mach-o/fixup-chains.h](https://github.com/apple-oss-distributions/dyld/blob/main/include/mach-o/fixup-chains.h)
- [Apple ld64, stub_arm64.hpp](https://github.com/apple-oss-distributions/ld64/blob/main/src/ld/passes/stubs/stub_arm64.hpp)
- [Xcode 13 发布说明：链式修正](https://developer.apple.com/documentation/xcode-release-notes/xcode-13-release-notes)et [WWDC22 第 110362 场，《快速链接：改善构建与启动时间》](https://developer.apple.com/videos/play/wwdc2022/110362/)
- [strip(1)](https://keith.github.io/xcode-man-pages/strip.1.html)- Je suis là.[ld(1)](https://keith.github.io/xcode-man-pages/ld.1.html)et [dyld(1)](https://keith.github.io/xcode-man-pages/dyld.1.html)
- [Hex-Rays，深入理解 IDA F.L.I.R.T. 技术](https://docs.hex-rays.com/core/flirt/concepts/ida-f.l.i.r.t.-technology-in-depth)et [Lumina 概览](https://docs.hex-rays.com/add-ons/lumina/overview)
- [Ghidra Function ID 帮助](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/FunctionID/src/main/help/help/topics/FunctionID/FunctionID.html)et [AARCH64 函数起点模式](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Processors/AARCH64/data/patterns/AARCH64_LE_patterns.xml)
- [Vector 35，WARP](https://github.com/Vector35/warp)et [Binary Ninja WARP 指南](https://docs.binary.ninja/guide/warp.html)
- [BinDiff 手册](https://www.zynamics.com/bindiff/manual/)et [BinDiff 源码](https://github.com/google/bindiff)
- [Diaphora](https://github.com/joxeankoret/diaphora)
- [rizin pat.c，.pat 解析器](https://github.com/rizinorg/rizin/blob/dev/librz/sign/pat.c)- Je suis là.[radare2 flirt.c](https://github.com/radareorg/radare2/blob/master/libr/anal/flirt.c)et [radare2 手册：Zignatures](https://book.rada.re/signatures/zignatures.html)
- [Andriesse 等，《对完整规模 x86/x64 二进制反汇编的深入分析》（USENIX Security 2016）](https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/andriesse)et [Andriesse、Slowinska、Bos，《与编译器无关的二进制函数检测》（EuroS&P 2017）](https://danielandriesse.com/papers/eurosp-2017.pdf)
- [Bao 等，ByteWeight（USENIX Security 2014）](https://www.usenix.org/conference/usenixsecurity14/technical-sessions/presentation/bao)et [Shin、Song、Moazzezi，《用神经网络识别二进制中的函数》（USENIX Security 2015）](https://www.usenix.org/conference/usenixsecurity15/technical-sessions/presentation/shin)
- [LIEF 更新日志](https://lief.re/doc/latest/changelog.html)- Je suis là.[pyelftools](https://github.com/eliben/pyelftools)et [pefile](https://github.com/erocarrera/pefile)
