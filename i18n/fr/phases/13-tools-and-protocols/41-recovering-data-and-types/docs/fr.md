# Récupération de données et types: structures, numéros, C++ objets et DWARF

> Les rédacteurs ont des types de tableaux .`a->balance`, aucun temps de sortie `*(int *)(param_1 + 4)` Le cours est basé sur le tableau de type de construction des opérations de visite, le cours est basé sur le tableau de type DWARF 5 et montre les points communs entre les deux.

**Type:** Build
**Languages:** Python, C, C++, x86-64 assembly
**Prerequisites:** Phase 13 · 33（反汇编与控制流）、Phase 13 · 34（提升为伪代码）
**Time:** ~140 分钟

## Objectif de l'apprentissage

- Selon les règles de l'Intel SDM, le nombre de membres du groupe de structure est augmenté.
- Le système V pour les règles de travail est appliqué `struct account`, expliquer chaque remplissage de caractères.
-  construire un type de restauration analyse tout, transformer les visites dans le tableau en un segment de décalage, de largeur, de classe, de longueur et de taille, et fournir des preuves pour chaque élément
- Pour réafficher les objectifs du dossier `.debug_info`- Je suis là.`.debug_abbrev`- Je suis là.`.debug_str_offsets`et `.debug_addr`编写 DWARF 5 读取器,并对照 `llvm-dwarfdump`- Je suis en train de vous dire.
- Comparer la mise en page de la récupération à la mise en page DWARF, chaque différence sera classée en catégorie de preuve manquante, de la combinaison ou de l'incapacité de démonstration.
- De la réposition des enregistrements de lecture Itanium C++ 虚函数表、类型信息和修饰名称,并将虚调用解析到槽位──

##  problématique

Tu es pas avec moi .`-g`Dans le cas de la compilation `account.c`, puis interrogez l'agent,`bump`L'agent a livré le dossier cible à Ghidra 12.1.4, obtenant les résultats suivants:

```c
void bump(long param_1,int param_2)
{
  *(int *)(param_1 + 4) = param_2 + *(int *)(param_1 + 4);
  return;
}
```

Avec une source de code`-g`编译后, le même anti-compileur a donné les résultats suivants:

```c
int bump(account *a,int by)
{
  a->balance = by + a->balance;
  return a->balance;
}
```

Les instructions des deux fichiers cibles sont complètement les mêmes, la différence réside dans le type de tableau.`balance`字节                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `int`Il n'y a pas de plan, il sait seulement.`%rdi`Le centre de transmission a une valeur de 8 caractères large, et `+4`Les 4 caractères sont lus et écrits.

Chaque élément de la carte a une source.`addl 0x4(%rax), %ecx`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `l`后;名称来自 `.debug_info`Le centre`DW_TAG_member`条目──本课构建这两个部分: un analyse遍的检查命令所能证明信息, ainsi qu'un lecteur de l'enregistrement de l'éditeur de code.

```figure
re-41-struct-recovery
```

## 成员访问就是位移

Intel SDM 第 1 卷 第 3.7.5 节将有效地址定义为 `Offset = Base + (Index * Scale) + Displacement`, dont le facteur de proportion est de 1 ̊2 ̊4 ou 8, le lieu de déplacement est de 8 ̊16 ou 32 ̊.`RIP + Displacement`形式──结构体成员访问采用第一种形式但没有索引:基址寄存器保存对象地址,位移就是成员偏移──数组访问加入索引项,比例因子或单独乘法承载元素大小──

É`-O0`Je suis là .`bump`Pour le cas.`llvm-objdump -d -r`清单如下:

```text
       4: 48 89 7d f8                  	movq	%rdi, -0x8(%rbp)
       e: 48 8b 45 f8                  	movq	-0x8(%rbp), %rax
      12: 03 48 04                     	addl	0x4(%rax), %ecx
      15: 89 48 04                     	movl	%ecx, 0x4(%rax)
```

Utilisez le 33e Règlement de la classe`03 48 04`Il y a une autre.`03`Indiquer `ADD r32, r/m32` ModRM `48`Oui `01 001 000`- Le numéro de la liste:`mod = 01`Indiquer le nombre d'opérations de mémoire de 8 places déplacées,`reg = 001`Oui `%ecx`- Je suis désolé .`r/m = 000`Oui `%rax`△位移字节为 `04`◊该指令读取 `%rax + 4`Il y a 4 caractères, il y a plus de 4 caractères.`%ecx`Il y a une autre.`llvm-objdump`输出 `l`后表示操作数大小,因此字段宽 4 字节。`%rax`Je suis venu .`-0x8(%rbp)`La boue est en train de se déchirer.`%rdi`, c'est-à-dire que le système V utilise le premier paramètre entier de la convention. Il en résulte trois faits: le premier paramètre est une pointe; l'objet à laquelle il est orienté est situé à l'écart de 4 et dispose d'un segment de 4 caractères;`bump`读取并写入该字段──

Ces caractères ne sont pas explicites .`int`- Je suis là.`balance`Ou `struct account`, ne précise pas non plus le nombre d'objets.`bump`Je ne peux pas le voir.

## Règles du système V 布局

x86-64 psABI Section 3.1.2 donne trois règles de type de regroupement: Structures et associations adoptent les exigences de regroupement des membres les plus strictes à leur égard. Chaque membre est affecté à la réalisation des déviations minimales possibles à leurs exigences de regroupement.`char`Pour 1 et 1,`short`Pour 2 et 2,`int`Pour 4 et 4,`double`Pour 8 et 8, tout point est de 8 et 8.

Ces règles seront appliquées.`account.c`Les structures internes:

```c
struct account {
    char kind;
    int balance;
    short code;
    double rate;
    const char *label;
};
```

| 成员 | 大小 | 对齐 | 满足条件的最低偏移 | 前置填充 |
|---|---|---|---|---|
| `kind` | 1 | 1 | 0 | 0 |
| `balance` | 4 | 4 | 4 | 3（字节 1 至 3） |
| `code` | 2 | 2 | 8 | 0 |
| `rate` | 8 | 8 | 16 | 6（字节 10 至 15） |
| `label` | 8 | 8 | 24 | 0 |

Le plus strict est le multiplication de 8,32 par 8, donc le plus grand est 32, sans que la partie finale soit remplie.

成员顺序决定大小──将同样五个成员按 `double, pointer, int, short, char`排列, occuper le décalage 0、8、16、20、22, terminé à 23, reup à z z z z jusqu'à 24、`code/main.py`Le centre`sysv_layout()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `ctypes`模块通过宿主编译器约定应用相同规则;对同一结构体,`ctypes.sizeof`- Je suis là.`ctypes.alignment`Et dans tous les cas`.offset`Je vous donne 32/8 et`0, 4, 8, 16, 24` Lorsqu'un programme est construit et exécuté sur cette machine, le programme imprime lui-même le troisième résultat:

```text
sizeof 32 align 8
kind 0 balance 4 code 8 rate 16 label 24
sum 315 tag -3 projected 318.75 label_length 7
```

L'architecture de la construction originale est arm64[6].Arm AAPCS64 § 5.10.1 § prévoit les mêmes règles de type de regroupement, le document arm64 d'Apple a également conservé ces cinq types de taille, de sorte que le nombre de plateformes cibles est cohérent[6].`-target x86_64-unknown-linux-gnu`编译, afin que le lecteur ELF et le lecteur DWARF des 33 cours puissent les traiter.

## Les autres parties du corps

`bump`Je peux juste voir un passage.`account.c`En plus de cela, quatre autres fonctions peuvent voir le reste des segments, et chaque fonction affiche une forme d'ordre différente.`account-x86_64-O0-g.objdump.txt`Il y a une autre.

`sum_balances`Pour indiquer le nombre de structures:

```text
      51: 48 8b 45 f8                  	movq	-0x8(%rbp), %rax
      55: 48 63 4d ec                  	movslq	-0x14(%rbp), %rcx
      59: 48 c1 e1 05                  	shlq	$0x5, %rcx
      5d: 48 01 c8                     	addq	%rcx, %rax
      60: 8b 40 04                     	movl	0x4(%rax), %eax
```

`%rax`Oui `list`- Je suis désolé .`%rcx`Il est étendu à 64 places.`i`, et `shlq $0x5`Le faire multiplier par 32`addq`后,`%rax`Pour`list + 32 * i`, chargement de l' opération`i`个元素偏移 4 处的 4 字节──移位次数是这个目标文件中唯一的数值形式体现结构体大小的地方──包含这些指令的循环从 个元素偏移 4 处的 4 字节──移位次数是这个目标文件中唯一的数值形式体现结构体大小的地方──包含这些指令的循环从 个元素偏移 4 个字节.`0x49`延伸到 `0x72`- Je suis là.`jmp 0x49`Il y a une autre.

`tag`读取两个狭字段:

```text
      8c: 0f be 00                     	movsbl	(%rax), %eax
      98: 0f bf 48 08                  	movswl	0x8(%rax), %ecx
```

`movsbl`Un élément de la dérive 0 est chargé et effectue une extension de caractères, de sorte que le élément de la dérive 0 est un nombre entier de caractères 1.`movswl`Les deux caractères de la partie 8 sont chargés et sont étendus, de sorte que les caractères de la partie 8 sont entièrement composés de 2 caractères.`-O1`La première visite est devenue`cmpb $0x6c, (%rdi)`Il peut encore expliquer le décalage de 0 à 1 caractères, mais ne peut pas expliquer la caractéristique.

`projected`读取浮点数:

```text
      cc: f2 0f 2a 40 04               	cvtsi2sdl	0x4(%rax), %xmm0
      d5: f2 0f 59 40 10               	mulsd	0x10(%rax), %xmm0
```

`cvtsi2sdl`Pour le calcul de la valeur de l'intégralité de 32 bits, le nombre entier est transformé en double précisité, confirmant le déplacement 4`mulsd`Le nombre de deux échéances dans l'enregistrement est donc déplacé 16 处保存 8 字节浮点值──

`label_length`读取指针, puis en suivant le point de visite:

```text
      f3: 48 8b 40 18                  	movq	0x18(%rax), %rax
      f7: 48 63 4d f4                  	movslq	-0xc(%rbp), %rcx
      fb: 80 3c 08 00                  	cmpb	$0x0, (%rax,%rcx)
```

`movq`读取偏移 24 处的 8 字节──单看这一步,它可能是8 字节整数,也可能是指针──`cmpb`La valeur de chargement est utilisée comme base de l'opération de mémoire.`cmpb`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `%rcx`处的 1 字节;在 `-O1`Suivre le cycle`leaq 0x1(%rcx), %rcx`推进指针, donc il indique l'élément de l'intervalle pour 1 字节.

综合五个函数, structure体为 `{ i8 at 0, i32 at 4, i16 at 8, f64 at 16, pointer at 24 }`, pas long pour 32──1 à 3 和 10 à 15 de la place est exactement le remplissage de la règle de prédiction de l'ABI.`const char *`;偏移 0 处有符字节的声明类型, source code写作 `char`; ainsi que cinq fonctions reçues sont de même type.`main`, il sera transmis à tous les cinq fonctions par le même objet.`-O0`Je suis en train de faire une petite photo.`leaq -0x70(%rbp), %rdi`后, dans `callq bump` 前执行 `addq $0x20, %rdi`, dans le`callq tag` 前执行 `addq $0x40, %rdi`偏移 0`0x20`et `0x40`est le même nombre de trois éléments; pour remplir le nombre de`memcpy`拷贝 `0x60`字节, c'est-à-dire 96 字节, est correctement trois 32 字节元素.

## 分析遍

`code/main.py`Le centre`trace_function()`按地址顺序穿越一个函数的指令,并维护一个小型抽象状态──值的承载位置是64位寄存器或类似的`-0x8(%rbp)`Chaque position a trois valeurs.`Pointer`Les paramètres de la base sont les paramètres de la base, les paramètres de la base sont les paramètres de la base, les paramètres de la base sont les paramètres de la base.`Index`La valeur totale est inconnue, mais pour un certain nombre de fois la valeur totale de certains facteurs.

Première condition faire six Système V 参数寄存器分别保存 `Pointer("param0", 0)`Pour`Pointer("param5", 0)`                                                                                                                                                                                                                                                              

- 64 位 entre le réservoir et le réservoir `movq` la valeur de copie  à 32 bits ou plus de référencement de l'enregistrement sera modifiée en proportion de 1 `Index`Il y a une autre.
- É é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é`leaq`Produit à la suite du déplacement des indices; si il y a un référentiel de référentiel, il est ajouté à l'ensemble de l'indexation.`scale * index_scale`Il est en train de mourir.`%rbp`Ou `%rsp`Pour le site `leaq`L'identification de l'objet, c'est ça.`main`传递  référencement`rows`La façon dont...
- Pour le`Index` exécuter `shlq $n`La proportion sera multipliée par les facteurs`2^n`, exécuter `imulq $k`- Je suis là.`k`Il y a une autre.
- Indice et indice`addq`Maintenir les indices,并将索引比例因子加入步长集合──对指针执行 `addq $k`Il va changer sa déviation, tout en enregistrant l'augmentation du nombre de ces enregistrements.
- 调用使所有调用者保存寄存器变为未知; paramètres de l'index de conservation寄存器会记录为调用点。
- Toutes les opérations de base de l'index de sauvegarde seront modifiées.`Access`, qui contient les racines et les déviations des pointers, les largeurs et les catégories déterminées par les assistants, ainsi que les marqueurs de stockage.

La largeur et la classe sont déterminées par les assistants.`access_width()`Il va`b`- Je suis là.`w`- Je suis là.`l`- Je suis là.`q`后映射到 1、2、4、8 字节;将 `movsbl`et `movswl`映射为有符号窄加载,`movzbl`映射为无符号加载;将 `sd`et `ss`标量 SSE 指令映射为 8 字节和 4 字节浮点数;将 `cvtsi2sdl`映射为有符号 4 字节整数源;将 16 字节的 `movaps`Il est également un des principaux acteurs de la série.`leaq`Et tout le monde`nop`Il n'est pas à la recherche.

```python
if memory.base in FRAME_REGISTERS:
    return Pointer(f"frame({memory.base}{format_signed(memory.displacement) if memory.displacement else ''})", 0)
base = env.get(memory.base)
if not isinstance(base, Pointer):
    return Unknown
strides = set(base.strides)
if memory.index is not None:
    index_value = env.get(memory.index)
    strides.add((index_value.scale if isinstance(index_value, Index) else 1) * memory.scale)
return Pointer(base.root, base.offset + memory.displacement, frozenset(strides), base.origin)
```

通过指针加载 8 字节会生成一个新指针,其根标识值来自的字段,例如 `param0->0x18` Lorsque cette valeur est utilisée comme base de données, ou par voie de`leaq`推进时,来源字段就被标记为已证明是指针──这条规则将偏移 24 8 字节变为指针──

### 4 étapes

`infer_layout()`合并所有见证函数的访问,并从四种来源收集步长,每个项都附带产生它的指示──

| 类别 | 来源 | 展示它的构建 |
|---|---|---|
| `scale` | 由 `shlq $0x5` 或 `imulq` 产生、比例因子大于 1 的 `Index` 到达指针 | `-O0`，`0x59` 处的 `shlq $0x5, %rcx` |
| `loop-step` | 循环内基址或索引寄存器的 64 位增量，且同一循环也包含该访问 | `-O1`，`0x24` 处的 `addq $0x20, %rdx` |
| `offset-delta` | 同一循环中通过同一基址寄存器、宽度相同且偏移间距恒定的访问 | `-O2`，八次间隔 32 的加载 |
| `call-site` | 将同一栈帧对象传给见证函数时所采用的偏移 | `-O0`，`main` 传递 `rows`、`rows+0x20`、`rows+0x40` |

 cycle de l'arrière`jmp`Les conditions de la mise en œuvre de la politique de sécurité et de la sécurité des services de santé sont déterminées, si le cycle comprend à la fois la croissance et les visites, la croissance ne peut être considérée comme une preuve.`-O0`La première`i``addl $0x1, %eax`C'est un 32 bits plus, et la visite n'a pas été faite.`%eax`◊ Le long terme est le plus grand nombre de tous les nombres trouvés. Quand le long terme n'est pas inférieur à la position de fin du dernier segment, le grand nombre est le long terme.

### - cycle de métamorphose de l'O2

Dans le`-O2`Je vais vous dire`sum_balances`Pour la quantité.`0x50`À la`0xaa`Le cycle contient 8 éléments:

```text
      3b: 48 8d 87 e4 00 00 00         	leaq	0xe4(%rdi), %rax
      50: 66 0f 6e 50 80               	movd	-0x80(%rax), %xmm2
      55: 66 0f 6e 98 60 ff ff ff      	movd	-0xa0(%rax), %xmm3
      61: 66 0f 6e 90 40 ff ff ff      	movd	-0xc0(%rax), %xmm2
      69: 66 0f 6e a0 20 ff ff ff      	movd	-0xe0(%rax), %xmm4
      7d: 66 0f 6e 10                  	movd	(%rax), %xmm2
      81: 66 0f 6e 58 e0               	movd	-0x20(%rax), %xmm3
      8a: 66 0f 6e 50 c0               	movd	-0x40(%rax), %xmm2
      8f: 66 0f 6e 60 a0               	movd	-0x60(%rax), %xmm4
      a0: 48 05 00 01 00 00            	addq	$0x100, %rax
      aa: 75 a4                        	jne	0x50 <sum_balances+0x40>
```

`%rax`De `list + 0xe4`開始──八位移使位置 de charge par rapport à `list`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `0x04, 0x24, 0x44, 0x64, 0x84, 0xa4, 0xc4, 0xe4`Je suis là .`4, 36, 68, 100, 132, 164, 196, 228`◊ augmentation du volume`0x100`Si l'analyse de la déviation est réalisée directement, elle rapporte huit caractères et un composant de 232 caractères au moins.

`fold_unrolled()`应用一条规则: dans un cycle, les mêmes accès effectués par le même base de données sont effectués par un seul et même base de données.`d`, ici est 32 . Si le cycle est long .`k * d`, et il y a`k`个不同偏移, alors le cycle s'est déroulé `k`Chaque visite est déplacée.`(offset - lowest) mod d`Il y a un élément qui se trouve ici.`256 = 8 * 32`, et il y a huit déviations, donc huit fois les charges se plient jusqu'à déviation 4, étape longue.`offset-delta 32`- Je suis là.`unrolled 32`et `loop-step 256`Il y a une autre.`0xe0`Le cycle de la quantité de résidu`shlq $0x5, %rdx`加入 `scale 32`, de`addq $0x20, %rdx`加入 `loop-step 32`Le nombre maximal de cinq valeurs numériques est de 32

Il y a une couche de coupe de la tête.`-O2`La construction montre sept phases situées après le 32e caractère, sans taille. C'est exactement l'état que le lecteur de la boucle ne verra que si elle est en déplacement.

## From字节读取 DWARF 5

`account.c``-g`Il y a aussi le "Band" et le "Band".`.debug_info`Pour 493 字节,`.debug_abbrev`Pour 179,`.debug_str`Pour 230,`.debug_str_offsets`Pour 124,`.debug_addr`Pour 112,`.debug_line`Pour 312,`.debug_line_str`Pour 12,`.debug_frame`Pour 264♦DWARF 5 标准的引言将`.debug_str_offsets`- Je suis là.`.debug_addr`et `.debug_line_str`列为第5 版新增内容──`code/main.py`Le lecteur central a besoin de 5 sections.

### 单元头

标准第 7.5.1.1 节给出完整编译单元头:`unit_length`- Je suis là.`version`- Je suis là.`unit_type`- Je suis là.`address_size`et `debug_abbrev_offset`Il y a une autre.`.debug_info`Les 12 premiers mots de la phrase sont les suivants:

```text
e9 01 00 00   unit_length = 0x1e9 = 489
05 00         version = 5
01            unit_type = DW_UT_compile
08            address_size = 8
00 00 00 00   debug_abbrev_offset = 0
```

`unit_type`Le caractère est une nouvelle version de la 5e édition, le standard en indiquant le même passage.`4 + 489 = 493`開始,也就是节的末尾.`llvm-dwarfdump --debug-info`Dans le même temps`Compile Unit:`5 valeurs, la première épreuve va résoudre et comparer cette épreuve.

### 缩写

Section 2.1 节说明, chaque référencement est composé de l'identification et d'une série d'attributs ∙∙ 条例 elle-même ne conserve que l'abréviation de code ∙ `.debug_abbrev`Dans le document cible, il y a 14 déclarations, dont deux sont importantes:

```text
[12] DW_TAG_structure_type  DW_CHILDREN_yes
     DW_AT_name              DW_FORM_strx1
     DW_AT_byte_size         DW_FORM_data1
     DW_AT_decl_file         DW_FORM_data1
     DW_AT_decl_line         DW_FORM_data1
[13] DW_TAG_member           DW_CHILDREN_no
     DW_AT_name              DW_FORM_strx1
     DW_AT_type              DW_FORM_ref4
     DW_AT_decl_file         DW_FORM_data1
     DW_AT_decl_line         DW_FORM_data1
     DW_AT_data_member_location  DW_FORM_data1
```

`parse_abbreviations()`读取 ULEB128 代码、ULEB128 标签、一个子条目标志字节, puis 读取属性与形式的配对, jusqu'à ce que vous rencontriez `0, 0` Section 7.5.6 节 节 给出形式编码:`data1`Pour un titre;`ref4`Pour le déplacement des 4 caractères par rapport à l'unité;`strx1`Pour une référence de 1 字节 de la page de déplacement;`sec_offset`et `data4`Pour 4 字节;`addrx`Pour l'index ULEB128 du tableau d'adresse;`exprloc`Pour ULEB128 长度及相应数字节;`flag_present`完全不占字节──

### Résultats de la recherche

`account`Les structures de l'équipe ont été déplacées.`0x195`, 字节为`0c 15 20 00 03`◊ en abrégé code pour 12,表示结构体──`DW_AT_name`Oui, c'est une bonne idée.`0x15`- Je suis désolé .`DW_AT_byte_size`Pour`0x20`- 32`DW_AT_decl_file`Pour 0,`DW_AT_decl_line`Pour 3, il est source de code `struct account {`Je suis en train de marcher.

Deuxième partie`0x1a3`開始,字节为 `0d 10 88 01 00 00 00 05 04`- Le numéro de la liste:

1. `0d`Il est en train de se faire remarquer.
2. `10`est `strx1`编码的 `DW_AT_name`:字符串索引 16
3. `88 01 00 00`est `ref4`编码的 `DW_AT_type`: Le débit de l'unité`0x188`,即名为 `int``DW_TAG_base_type`条目。
4. `00`Oui `DW_AT_decl_file`- Je suis désolé .`05`Oui `DW_AT_decl_line`- Le numéro de la liste:`account.c`Le 5ème.
5. `04`Oui `DW_AT_data_member_location`: par déplacement 4

Article 5.7.6 节说明, membres 条目 peut avoir DW_AT_data_member_location 属性 ou DW_AT_data_bit_offset 属性, tandis que le nombre constant est relativement à la conjonction des caractères contenant les points de départ de l'objet.`addl 0x4(%rax), %ecx`Le nombre de déplacements entre les deux est le même,`compare_layouts()`C'est la fonction de comparation des deux.

### 字符串和地址 经由两张表解析

字符串索引 16 不是 `.debug_str`Leur nombre est de 0,6%.`DW_AT_str_offsets_base`, sa valeur est de 8, puis il se lit.`.debug_str_offsets`- Je suis là .`8 + 4 * 16`处的 4 字节条目──该条目保存 `"balance"`Dans le`.debug_str`Le centre de déplacement.`sum_balances`条目以字节 `07 07`开头:缩写 7 表示子程序,随后是以 `addrx`C'est une référence pour 7`DW_AT_low_pc`Il y a une autre.`.debug_addr`- Je suis là .`8 + 8 * 7`处的 8 字节条目为 `0x30`, qui est la fonction dans `.text`Le premier six éléments sont les six caractères.

Dans le fichier objectif à réposition, les deux émissions n'ont pas conservé la valeur finale.`.debug_str_offsets`Chaque élément est à zéro,`.rela.debug_str_offsets` conserver en vue `.debug_str`De 29 个 `R_X86_64_32`Révélation de la révélation de la Bible`.debug_addr`Il y a 13 cibles .`.text`et `.rodata.str1.1``R_X86_64_64`Références`.debug_info`Il a lui-même quatre positions de repère:`.debug_str_offsets+0x8``DW_AT_str_offsets_base`Le dépôt de la commission`DW_AT_stmt_list`; ainsi que`.debug_addr+0x8``DW_AT_addr_base`在读取器解析节之前,`ElfObject.relocated()`Pour les types d'applications de 32 et 64 places `S + A` La valeur du nombre de caractères dans le fichier objectif est 0, de sorte que le nombre de caractères est augmenté.`llvm-dwarfdump`执行 the same analysis, c'est la raison pour laquelle chaque index est entièrement analysé.

### type 函数 et position

`DwarfInfo.type_name()` par la route `DW_AT_type`- Je suis en train de vous suivre.`label`成员指向 `DW_TAG_pointer_type`, le dernier à dire`DW_TAG_const_type`, à nouveau vers`char`基本类型, donc le nom de la composition est `const char *`Il y a une autre.`type_size()`Retour à la catégorie et à la structure fondamentales`DW_AT_byte_size`, pour le retour de la pointe 8, pour le retour de la masse de la quantité par élément`type_kind()`Généralement, les types de base`DW_AT_encoding` simplification pour une relation sexuelle `int`Ou `float`, le type d'indice sera simplifié en`pointer`, ce sont les catégories utilisées lors de la comparaison.

`DwarfInfo.functions()`Je veux dire , je veux dire , je veux dire , je veux dire , je veux dire , je veux dire , je veux dire , je veux dire , je veux dire , je veux dire , je veux dire , je veux dire , je veux dire , je veux dire , je veux dire , je veux dire , je veux dire , je veux dire , je veux dire , je veux dire , je veux dire , je veux dire , je veux dire , je veux dire , je veux dire , je veux dire , je veux dire , je veux dire , je veux dire , je veux , je veux , je veux , je veux , je veux , je veux , je veux , je veux , je veux , je veux , je veux , je veux , je veux , je veux , je veux , je veux , je veux , je , je veux , je veux , je , je veux , je , je veux , je , je veux , je , je veux , je , je ,`DW_TAG_subprogram`条目。`bump`De `0x0`延伸到 `0x21`, qui est`DW_AT_low_pc`À la suite`DW_AT_high_pc`Il est à la base de l'architecture.`DW_OP_reg6 RBP`,参数 `a`La position de l'expression`91 78`- Le numéro de la liste:`DW_OP_fbreg`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `0x78`, c'est à dire -8 . C' est juste un simple .`0x4`Il va`%rdi`- Je suis en train de faire une petite histoire.`-0x8(%rbp)`◊调试信息和命令从两个角度描述一个槽──

## Comparer les deux types de décorations

`compare_layouts()`遍历 DWARF 成员,并寻找相同偏移处的推断字段──没有对应字段的成员标记为 `no-evidence`;字段大小不同为 `size-mismatch`;字段从未被解引用的指针成员为 `pointer-unproven`; classe non cohérente `kind-mismatch`, par exemple, le type est le nombre de points et l'ordre d'adoption de l'algorithme intégral.`unexpected`◊                                                                                                                                                                                                                                                              `DW_AT_byte_size`Comparé à...

Les trois constructions sont de `python3 code/main.py`- Le numéro de la liste:

| 构建 | 通过第一个参数的访问数 | 字段 | 步长证据 | 匹配成员 | 大小 |
|---|---|---|---|---|---|
| `-O0` | 11 | 5 | `scale 32`、`call-site 32`、`call-site 64` | 5/5 | 32，匹配 |
| `-O1` | 9 | 5 | `loop-step 32` | 5/5 | 32，匹配 |
| `-O2` | 17 | 折叠后 5，折叠前 12 | `offset-delta 32`、`unrolled 32`、`loop-step 256`、`scale 32`、`loop-step 32` | 5/5 | 32，匹配 |

Chaque élément de la construction de la hypothèse est en caractères 1 à 3 et 10 à 15, exactement comme le remplissage de caractères de la mise en page DWARF. Chaque élément de la hypothèse se trouve en nombre entier de sa taille, conformément aux règles de la PSABI.`natural_alignment_ok()`Je vais le noter.

个个加入函数时, les résultats sont également variables.`bump`时,布局只有偏移4 的一个字段,大小未知,下界为8──`sum_balances`加入步长;`tag`加入偏移 0 和 8;`projected`加入偏移 16 的浮点数;`label_length`加入偏移 24 的指针,并证明它是指针──`main`Dans le`-O0`Je suis en train de faire une demande.`-O1`et `-O2`Il n'y a pas de contenu supplémentaire, car le compteur a intégré toutes les modifications.

3 catégories d'informations sont toujours inaccessibles.`const`Il n'y a pas de commandes.`label`Les types sont indiqués, seulement à partir de la chaîne de cycle.`leaq 0x1(%rcx), %rcx`Il faut savoir que les éléments sont séparés.`char`, et peut-être aussi .`unsigned char`Ou `_Bool`Dans le monde entier.`-O1`Je ne sais pas si c'est vrai.`cmpb $0x6c, (%rdi)`Il suffit de comparer et de ne pas étendre ses données.`int8`, et en usage`movsbl`符号扩展的                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `-O0`Rapport suivant`i8` § 35 课会将这些事实记录为未知项.

## Objets de C++

`shapes.cpp` définit `Shape`, contient des fonctions de calcul`area()`和虚 `name()`; a également défini la vie`Shape`、 augmenter les deux `int`成员的  membres du groupe`Rect`◊ Itanium C++ ABI 规则 clang dans x86-64 Linux 上如何布局这些对象──

### 修饰名称

ABI § 5.1.2 § Règlement  modification du nom est ajouté à son nom 编码前加`_Z`Il y a 19 symboles de ce type.`_ZNK4Rect4areaEv`Pour le lire:`_Z`, puis `N`Je veux dire,`K`Indiquer la fonction const 成员函数,`4Rect`et `4area`Il est le nom de la famille.`E`Je suis en train de vous dire:`v`Indiquer la liste des paramètres空──`llvm-cxxfilt`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `Rect::area() const`Il y a une autre.`_Z8describeRK5Shapei`Oui `describe(Shape const&, int)`- Le numéro de la liste:`R`Cité par:`K`Indiquer const,`5Shape`Oui, le genre.`i`Indiquer `int` Section 5.1.4 节 节 的特殊名称有:`_ZTV`Précisez une fonction`_ZTI`Indiquer le type d'information,`_ZTS`Indiquer le type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type`C1`- Je suis là.`C2`- Je suis là.`D0`- Je suis là.`D1`- Je suis là.`D2`, donc `_ZN4RectD0Ev`et `_ZN4RectD2Ev`Les villes sont en expansion`Rect::~Rect()`: deleted type de la fonction de composition et de la fonction de base

`code/main.py`Le centre`Demangler` couvrir ce sous-ensemble, ainsi que le code de type intégré de la section 5.1.5.2 et de la section 5.1.10 `S_`替换──测试会对全部19名运行它,并与捕获的 `llvm-cxxfilt --no-strip-underscore`输出比较── Ce marqueur est important dans macOS, car les outils perdent par défaut un avant-guide, puis ne peuvent pas être identifiés `Z8describe...`Il y a une autre.

### From重定位读取虚函数表

ABI § 2.5.2 节按顺序列出虚函数表组成部分:虚调用偏移、虚基类偏移、到顶层对象的偏移、类信息指针,最后是虚函数指针──地址点是对象的 vptr 保存的值,即第一个函数指针的地址`Rect`Il n'y a pas de type de base, donc sa liste contient des déviations de type d'information et de fonction à l'objet de haut niveau.

符号 `_ZTV4Rect`Pour 0x30 字节, c'est-à-dire 6 8 字节槽。`.rela.data.rel.ro._ZTV4Rect`- Le numéro de la liste:

```text
0000000000000008 R_X86_64_64              _ZTI4Rect
0000000000000010 R_X86_64_64              _ZN4RectD2Ev
0000000000000018 R_X86_64_64              _ZN4RectD0Ev
0000000000000020 R_X86_64_64              _ZNK4Rect4areaEv
0000000000000028 R_X86_64_64              _ZNK4Rect4nameEv
```

La tranche 0  préservée jusqu'à la déviation de l'objet de haut niveau, ici pour 0, pas besoin de reposicion.`+16` D'ici, la tranche 0 est la fonction de mise en page complète, la tranche 1 est la fonction de mise en page de type supprimé, la tranche 2 est la`area`, la salle 3 est`name`Il y a une autre.`read_vtable()`读取符号大小、其范围内的重定位以及偏移 0 的零──`Shape`La même forme de la pièce, la pièce 2`__cxa_pure_virtual`, c'est-à-dire une fonction de fonctionnement à l'heure de l'arrivée.

### RTTI

Le deuxième jour de la semaine`std::type_info`描述为 vptr 后一个指向修饰类型名指针,并列出其派生类──`_ZTI4Rect`Il y a trois postes:`_ZTVN10__cxxabiv120__si_class_type_infoE+0x10`- Je suis là.`_ZTS4Rect`et `_ZTI5Shape`La première est:`__si_class_type_info`Le tableau de la fonction fictive, est un ABI utilisé pour le déplacement de zéro où il n'y a qu'un seul type de type public à non fictif,`+0x10`则是该虚函数表的地址点──第二个指向字符串 `4Rect`,即修饰类型名; dans `type_info`上调用 `name()`Le retour est le même que le troisième signe.`_ZTI5Shape`Utilisation `__class_type_info`, sans base de pointeur.`read_typeinfo()`Retournez à ces trois faits.

### 虚调用

`-O0`Je suis là .`describe` effectuer une fois虚调用:

```text
       f: 48 8b 7d f8                  	movq	-0x8(%rbp), %rdi
      13: 48 8b 07                     	movq	(%rdi), %rax
      16: ff 50 10                     	callq	*0x10(%rax)
```

La première .`movq`La seconde lecture prend 8 caractères de l'objet dévié à 0, c'est-à-dire vptr, car ABI le placerait en avant de la classe avec une fonction nulle.`callq`经由 vptr 后 `0x10`La réaction des autorités`0x10 / 8`Pour la résolution 2..`find_virtual_calls()`匹配该模式并报告两个候选人:`_ZTV4Rect``Rect::area() const`, ainsi que de`_ZTV5Shape``__cxa_pure_virtual`                                                                                                                                                                                                                                                              

DWARF a enregistré le même lieu de travail.`area``DW_TAG_subprogram`条目均带有 `DW_AT_vtable_elem_location (DW_OP_constu 0x2)`- Je suis désolé .`name`带有槽 3, 解析构件带有槽 0`Rect`est 16 字节的`DW_TAG_structure_type`, contient des déviations vers le`Shape``DW_TAG_inheritance`条目, ainsi que des membres du groupe`w`Et le décalage de 12 `h`Il y a une autre.`Shape`Pour 8 字节, contenant un membre artificiel `_vptr$Shape` Les deux types de recommandations indépendantes sont fournies.`area`Le lieu de la rencontre est à 2...

Dans le`-O1`La liste des objectifs est entièrement vide.`main`Il va`Rect`                                                                                                                                                                                                                                                              `r.name()`et `describe(r, 2)`Il n'y a pas de lieu pour obtenir des adresses, donc les adresses ne seront pas générées.`describe`仍包含 `movq (%rdi), %rax`et `callq *0x10(%rax)`, parce que ses paramètres peuvent être arbitraires .`Shape`                                                                                                                                                                                                                                                              `test_the_optimised_object_keeps_the_call_pattern_but_drops_the_vtables`检查这两方面――

Microsoft ABI est différent de celui ci-dessus.`?`开头并编码调用约定, donc en tant que C++ `__cdecl`编译的 `void test(void)`Oui `?test@@ZAXXZ` RTTI 定位器  `_RTTICompleteObjectLocator`形式位于 `vfptr[-1]`; 符号`??_7`Indiquer le vftable,`??_R4`Indiquer le paramètre de classement. Microsoft  propre documentation 编译器供应商之间 没有 C++ 命名标准──本课的样例仅采用Itanium──

## 工具如何呈现恢复出的类型

Le tableau ci-dessous mentionne les lignes de sortie, toutes générées et capturées sur cette machine.`code/fixtures/tools/`◊ la section des outils non installés ne décrit que son dossier,并明确标注──

| 工具 | 版本、许可证 | 类型存放位置 | 在本课样例上的结果 |
|---|---|---|---|
| Ghidra | 12.1.4，2026-09-21，Apache-2.0 | Data Type Manager 包含内置、用户定义和派生类型；`.gdt` 存档；程序使用的类型会复制到程序中 | 有 DWARF：`/DWARF/account.c/account size=32 align=8` 和 `a->balance = by + a->balance;`。无 DWARF：`*(int *)(param_1 + 4)`，以及 `long param_1`、`tag(char *param_1)` 和 `*(char **)(param_1 + 0x18)` |
| IDA Pro | 9.4，2026-07-13，商业软件；IDA Free 限非商业使用，云反编译器仅支持 x86 | Local Types 窗口、`.til` 类型库，将 DWARF 和 PDB 导入 `dwarf` 或 `pdb` 文件夹 | 未安装。仅依据文档 |
| Binary Ninja | 6.0，2026-09-03，商业软件，提供 Free 版 | 类型编辑、头文件导入导出、类型存档、DWARF 和 PDB 调试信息、类型库、平台类型 | 未安装。仅依据文档 |
| radare2 | 6.2.4，2026-10-05，LGPLv3 | `ts`、`tsc`、`afvd` | 对设置 `bin.dbginfo=true` 的可重定位目标文件，`ts` 和 `tsc account` 未输出内容；`pdf` 显示 `mov dword [rax + 4], ecx`，附有来自 DWARF 的源码行注释 |
| rizin | 0.9.1，2026-06-29，核心采用 LGPL | `ts`、`tsc`、`afvd` | `tsc account` 从 DWARF 打印 `struct account { char kind; int balance; short code; double rate; const char *label; };`；不带 `-g` 的构建只列出工具自带的头文件类型 |
| lldb | lldb-1703.0.236.21 | `image lookup -t` | 从 ELF 目标文件得到 `byte-size = 32` 及完整 `compiler_type` 文本 |
| gdb | 此处未安装 | `ptype /o` 打印“结构体字段的偏移和大小”，并标记空隙 | 仅依据文档 |
| pyelftools | 0.33，公有领域 | 面向 `.debug_info` 的 Python API | 一个 43 行脚本打印相同五个成员和 `unit version 5` |
| llvm-dwarfdump | Apple LLVM 17.0.0 | `--debug-info`、`--debug-abbrev`、`--debug-str-offsets` | 每个读取器测试的对照基准 |

Les résultats de Ghidra 不带 DWARF montrent les mêmes règles.`tag`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `char *`, parce que la fonction par elle comparer un caractère; donner `0x18`处的字段分配 `char **`Je suis désolé .`label_length`解引用加载的值并比较字节──这是本课题分析中使用的两条规则:从指令确定宽度,从解引用确定指针──Ghidra's反编译器文档说明,p-code's varnode不一定关联数据类型,反编译器将通过传播最终分配正式数据类型──Infer constant pointers选项将同样传播扩展到常量──Ghidra 12.1 作为反编译器加入位字段恢复,本课例没有覆盖这一能力──

Les données de Ghidra sont classées dans les fichiers de type Ghidra, Ghidra est classé dans les fichiers de type Ghidra, Ghidra est classé dans les fichiers de type Ghidra, Ghidra est classé dans les fichiers de type Ghidra, Ghidra est classé dans les fichiers de type Ghidra, Ghidra est classé dans les fichiers de type Ghidra, Ghidra est classé dans les fichiers de type Ghidra, Ghidra est classé dans les fichiers de type Ghidra, Ghidra est classé dans les fichiers de type Ghidra, Ghidra est classé dans les fichiers de type Ghidra, Ghidra est classé dans les fichiers de type Ghidra, Ghidra est classé dans les fichiers de type Ghidra, Ghidra est classé dans les fichiers de type Ghidra, Ghidra est classé dans les fichiers de type Ghidra, Ghidra est classé dans les fichiers de type Ghidra, Ghidra est classé dans les fichiers de type Ghidra, Ghidra, Ghidra est classé dans les fichiers de type Ghidra, Ghidra, Ghidra, Ghidra est classé dans les fichiers de type Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, Ghidra, G`td`, vous permettront de voir comment les structures sont réintégrées, et de regarder comment les réintégrations sont effectuées.

ré 6.5.0  associé à son fournisseur de Ghidra, va contrecompiler le texte comme un enregistrement retour.`python3 code/main.py infer`On peut obtenir ces preuves.

## 类型推断研究

L'analyse est la moitié de la structure générée par le type de système de déduction et se limite à une structure accessible par les paramètres.

- TIE (Lee、Avgerinos、Brumley, NDSS 2011) a présenté un type de reconstruction pour une production et une demande de résolution de la structure IR, pour mesurer la conservation et la précision, et pour comparer les 87 éléments clés du processus avec les systèmes de compilation commerciaux.
- Retypd(Noonan、Loginov、Cok,PLDI 2016) a augmenté le sous-type、多态和递归类型,并报告指针`const`Le taux de réintégration est de 98%.
- OSPREY(Zhang 等,IEEE S&P 2021) va chaque position de l'inventaire être considérée comme une variation de la probabilité, de sorte que le type le plus élevé soit le type.
- DIRTY(Chen 等,USENIX Security 2022) et ReSym(Xie 等,CCS 2024) utilisent des modèles de formation pour effectuer un traitement ultérieur à l'extraction de la compilation,ReSym  rapport un taux d'exactitude de la mise en page de la structure complète de 72,9%。
- RecStruct ((Chen 等,USENIX Security 2026) 无需反编译器,通过流不敏感符号执行及槽上的并查集恢复嵌套结构体──

                                                                                                                                                                                                                                                              `-O1`Je suis là.`main`Il va`rows`Présentation 上, intérieurs `0x24(%rsp)`- Je suis là.`0x40(%rsp)`- Je suis là.`0x48(%rsp)`- Je suis là.`0x30(%rsp)`et `0x38(%rsp)` Ces déviations vers 32 取模后分别是 4、0、8、16、24: le même structure, mais aucun paramètre utilisable comme première semence.

## 亲手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/41-recovering-data-and-types
python3 code/main.py
```

输出 est un rapport JSON contenant 5 parties.`dwarf`保存 `-O0`objet du document: unités de tête, structures et fonctions;`oracles`保存 psABI 规则布局`ctypes`L'élaboration de la stratégie de développement`agree`标志;`builds`preser les trois documents objectifs de leur visite, de leur mise en page et de leurs résultats de comparaison;`cxx`保存解修饰名称、两张虚函数表、两类信息记录、虚调用和 DWARF 槽位;`tools`列出捕获的工具输出──

预期 structure:

```json
{
  "dwarf": {"unit": {"unitLength": 489, "version": 5, "unitType": "DW_UT_compile", "addressSize": 8, "abbrevOffset": 0}, "...": "..."},
  "oracles": {"agree": true, "psabiRules": {"size": 32, "align": 8, "...": "..."}, "...": "..."},
  "builds": {
    "O0": {"layout": {"stride": 32, "size": 32, "gaps": [1, 2, 3, 10, 11, 12, 13, 14, 15], "...": "..."}, "comparison": {"matches": 5, "members": 5, "...": "..."}},
    "O1": {"...": "..."},
    "O2": {"...": "..."}
  },
  "cxx": {"virtualCalls": [{"slot": 2, "candidates": {"Shape": "__cxa_pure_virtual", "Rect": "_ZNK4Rect4areaEv"}, "...": "..."}], "...": "..."}
}
```

按以下顺序阅读 `code/main.py`- Le numéro de la liste:

1. `ElfObject`读取节、符号和重定位,`relocated()`Pour l'application du`S + A`Il y a une autre.
2. `parse_abbreviations()`et `DwarfInfo._parse_unit()`读取头、缩写表和条目, puis passer par deux张表解析 `strx`et `addrx`Il y a une autre.
3. `DwarfInfo.struct_layouts()`et `functions()`借助 `type_name()`- Je suis là.`type_size()`et `type_kind()`,将条目转换为 `StructLayout`et `FunctionInfo`- Je suis là.
4. `parse_listing()`- Je suis là.`parse_memory()`et `access_width()`读取 `llvm-objdump`Je suis en train de vous dire.
5. `trace_function()`C'est un état de l'extraction,`fold_unrolled()`et `infer_layout()`Il sera transféré en bouton de bord.
6. `compare_layouts()`Le système de gestion des ressources`sysv_layout()`et `ctypes_layout()`Il y a deux autres.
7. `Demangler`- Je suis là.`read_vtable()`- Je suis là.`read_typeinfo()`et `find_virtual_calls()`负责 C++ 目标文件──

Il y a encore quatre ordres.`python3 code/main.py dwarf FILE.o`imprimer n'importe quel DWARF 5 可重定位目标文件的结构体和函数──`python3 code/main.py infer LISTING.txt [FILE.o]`Pour le calcul des données, si vous fournissez des documents objectifs, comparez-les à ceux de DWARF.`python3 code/main.py demangle NAME...`et `python3 code/main.py vtable FILE.o`负责 C++ 部分──

##  réel usage

Pour les nouveaux objectifs que vous construisez vous-même:

1.  Capture du dossier `llvm-objdump -d -r`输出,并与目标文件一起保存──分析遍读此文──
2. Pour le nettoyage`python3 code/main.py infer`◊ première lecture de la ligne de fonction témoin: elle énumère le premier paramètre utilisé comme fonction de base de données de mémoire. Si une fonction est manquante, indique que ses paramètres n'ont pas atteint l'opérateur de mémoire de mémoire, ou qu'ils ont traversé une voie d'analyse non suivie.
3. 结合访问次数读取每个字段――一次访问就是一个见证――只有单条见证的字段应记录为推断结果――
4. 阅读步长证券──`call-site`Ou `scale`条目是强证; aucun autre article ne soutient cette catégorie `loop-step`C'est une preuve faible, car le cycle de développement est le rythme de plusieurs éléments.`unrolled`,应手工检查折叠──
5. Si vous avez`-g`Construire, faire fonctionner et comparer `match`Je vais.`no-evidence`行指出没有函数触及的成员,`unexpected`行指出分析遍无法定位的访问──
6. L'établissement en tant qu'outil de type de gestion de l'entrée structurelle, et enregistrer les segments, les noms et les catégories qui relèvent de la spéculation.

Il y a trois règles.`ctypes`Et si vous n'êtes pas d'accord avec la structure de votre rédaction, vous avez déjà rencontré des structures de mise en page, des sections de site ou une plateforme cible de différentes règles.

## 交互实验

### 实验 A:解码成员条目

De `code`Actuellement Python:

```bash
cd phases/13-tools-and-protocols/41-recovering-data-and-types/code
python3 -q
```

运行:

```python
from main import *
elf = load_object("account-x86_64-O0-g.o")
dwarf = DwarfInfo(elf)
dwarf.header()
elf.section(".debug_info").data[0x1a3:0x1ac].hex(" ")
dwarf.dies[0x1a3].attributes
dwarf.type_name(dwarf.type_of(dwarf.dies[0x1a3]))
```

查看字典前,先用缩写13 在纸上解码这九字节──随后读取未重定位的原始节 `elf.section(".debug_str_offsets").data[8:16].hex()`Et le rétablissement de la section suivante`elf.relocated(".debug_str_offsets")[8:16].hex()`,并解释差异──

### 实验 B: suivre une fonction

```python
listing = load_listing("account-x86_64-O0-g.objdump.txt")
trace = trace_function("label_length", listing["label_length"])
[(hex(a.address), a.root, a.offset, a.width, a.kind) for a in trace.accesses]
trace.pointer_uses
trace_function("sum_balances", listing["sum_balances"]).loops
```

运行前先写下,哪次访问证明偏移 24 是指针──然后对 `-O1`清单运行相同代码, et dans `trace.increments`中找到 `leaq 0x1(%rcx), %rcx`Il y a une autre.

### 实验 C: cycle de déploiement

```python
o2 = load_listing("account-x86_64-O2-g.objdump.txt")
trace = trace_function("sum_balances", o2["sum_balances"])
sorted({a.offset for a in trace.accesses})
folded, evidence = fold_unrolled(trace, trace.accesses)
sorted({a.offset for a in folded}), [(e.kind, e.value, e.text) for e in evidence]
```

- Je suis en train de travailler .`analyze_build("O2", fold=False)["comparison"]`, statistique`unexpected`Réglementation de la réglementation de la pliage, exigence de la longueur du cycle doit être correctement`k * d`, et`k`Au moins 2 fois, confirmez une seule visite.`-O1`Le cycle reste le même.

### 实验 D:虚函数表和名称

```python
shapes = load_object("shapes-x86_64-O0-g.o")
read_vtable(shapes, "_ZTV4Rect")
read_typeinfo(shapes, "_ZTI4Rect")
demangle("_ZNK4Rect4areaEv"), demangle("_Z8describeRK5Shapei")
find_virtual_calls(load_listing("shapes-x86_64-O0-g.objdump.txt"), [read_vtable(shapes, "_ZTV5Shape"), read_vtable(shapes, "_ZTV4Rect")])
```

Sur papier`callq *0x10(%rax)`计算槽位, puis utiliser `DwarfInfo(shapes).struct("Rect").virtual_methods`Confirmation ∞`shapes-x86_64-O1-g.o`Il n'a pas essayé de le régler.`read_vtable`Je suis en train de lire.`ElfError`, expliquer pourquoi il manque.

## 实践实验

 Rétablissement `-O1`Je suis là .`main`Le milieu de la structure

要求:

- 扩展 `trace_function()`, faire des zones de creusement peut être utilisé comme racine.`movaps`Les graines sont stockées.`.data.rel.ro`Remplissez`0x0(%rsp)`Pour`0x5f(%rsp)`, qui est`rows`Le contenu de la première partie de la page 96
- Généralement`0x24(%rsp)`- Je suis là.`0x40(%rsp)`- Je suis là.`0x48(%rsp)`- Je suis là.`0x30(%rsp)`et `0x38(%rsp)`归属该根,并报告其偏移对候选人步长取模的结果.
- De `0x120`Pour`0x12c`Le cycle de la formation:`%r14`Depuis le 4 开始,`0x20`递增直至 `0x64`; et expliquer le cycle de bordure `0x64`Il y a trois éléments qui se déplacent.
- Comparer les résultats avec la mise en page DWARF, atteindre cinq correspondances, et enregistrer les catégories qui ne sont pas encore prouvées.
- 添加一个测试, assurez-vous que l'erreur de base sera attribuée aux paramètres lors du test échec.

Le succès est:`-O1`清单运行  rédaction`python3 code/main.py infer`时,将 `main`列为具有根的证人函数,且仅凭`main`On peut voir 5 correspondances.

## Le produit

本课包含 `outputs/skill-recovering-data-and-types.md` Il est nécessaire de fournir un tableau d'accès, un document de documentation, un contrôle de pliage, un document de référence existant, et de déclarer les noms et les limites que les instructions ne peuvent fournir.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/41-recovering-data-and-types
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明:

- 单元头、14 个缩写和五个成员偏移与 `llvm-dwarfdump`Un groupe
- 名称经由重定位后的 `.debug_str_offsets`Pour obtenir, et unités `str_offsets_base`et `addr_base` moyenne de 8
- 六个函数带转储显示的地址范围`DW_OP_reg6 RBP`et `DW_OP_fbreg`位置, et son initi initier est égal au point de départ de la fonction dans le tableau
- 缺少 `.debug_info`Les objectifs de la réforme sont différents.`0x78`处理为 -8
- `pyelftools`et `lldb`Impression et lecture du même tableau
- Les règles de l'ABI`ctypes`、DWARF 和原生运行均给出偏移 `0, 4, 8, 16, 24`和大小 32,重排后的结构体为 24 字节
- 清单解析器 在 `bump`中读取 13 条 命令,将 `R_X86_64_PLT32 bump-0x4`- Je suis là.`0x194`处的调用,并找到 `0x72`Le saut vers le bas
- L'opérationnel de mémoire interne, la largeur, la classe et le symbole sont décrits par AT&T
- `-O0`Je suis là .`bump`Il a effectué trois visites à partir de la boucle de l'indice et a déplacé 4 places.
- Je suis en train de faire ça.`-O0`Je viens de`shlq $0x5`, dans le`-O1`Je viens de`addq $0x20, %rdx`, dans le`-O2`Voici les 8 charges de 256 plies
- `label_length`通过解引用证明偏移 24 是指针
- `main`Dans le`-O0`À partir de 0`0x20`et `0x40`传递 le même objet, dans `-O1`Je ne fais que le faire.`printf`
- Chaque structure est équipée de cinq membres, en taille de 32, espaces avec DWARF  remplissage correspondant
- Il ne se replie pas,`-O2`构建报告七位位于字节 32 后的字段,且没有大小
- 解修饰器复现全部 19 个 `llvm-cxxfilt`字符串
- 两张虚函数表、两类信息记录及 `0x16`处的虚调用均解析到槽 2,DWARF 也一致
- `-O1`C++ 目标文件保留调用模式, mais pas de tableau de fonction
- Ghidra、rizin 和 radar2  Capture résultat dans le temps d'affichage de structure, sans DWARF indiquer le déplacement initial
- Interaction entre les données intégrées et les données générées par l'analyse

## Mode de production environnementale défaillant

| 失效情况 | 能力不足的工具报告什么 | 分析必须证明什么 |
|---|---|---|
| 展开循环 | 八个间隔 32 字节的字段，以及一个 232 字节结构体 | 循环步幅 256 等于偏移差 32 的 8 倍，因此只有偏移 4 的一个字段 |
| 从单个增量读取步长 | 从 `addq $0x100` 得到 `sizeof` 为 256 | 所有步长来源的最大公约数，包括标量尾循环的 `addq $0x20` |
| 将 8 字节字段称为指针 | 偏移 24 处是 `void *` | 后续访问将加载的值作为基址，否则类别仍应为 `int64` |
| 将指针称为整数 | 偏移 24 处是 `long` | `0xfb` 处的解引用，应记录为指针证据 |
| 窄比较 | 带符号性的 `char` | `cmpb` 不携带符号性，只有 `movsbl` 或 `movzbl` 才携带 |
| 假定五个函数共享类型 | 没有别名证据却合并为一个结构体 | `main` 中传递同一栈帧对象的调用点，或分析人员的明确断言 |
| 按索引从 `.debug_str` 读字符串 | 从可重定位目标文件读出乱码名称 | `str_offsets_base` 加上重定位后的 `.debug_str_offsets` 条目 |
| 将地址直接作为数值读取 | 每个函数的 `low_pc` 都为 0 | 通过重定位后的 `.debug_addr` 表解析 `addrx` |
| DWARF 4 目标文件 | 读取器错误解析头部 | 检查第二个头字段中的版本；第 4 版没有 `unit_type` 字节 |
| 虚函数表缺失 | “这个类没有虚函数” | `-O1` 目标文件内联了全部调用；`-O0` 目标文件包含表及其重定位 |
| 从错误基址读取虚函数槽位 | 槽号偏差为二 | 地址点在符号之后 16 字节，位于到顶层对象的偏移和类型信息之后 |
| 修饰名称被剥离前缀 | `Z8describeRK5Shapei` 保持原样 | 在 macOS 使用 `--no-strip-underscore`，或使用检查 `_Z` 的解修饰器 |
| 根据单个工具的猜测定义结构体 | 将 `char *param_1` 当作字段类型 | 将宽度和解引用写为证据，并将名称标为猜测 |

## 操作准则

De la lecture de la page de référence, de la lecture de la page de référence, de la lecture de la page de référence, de la lecture de la page de référence, de la lecture de la page de référence, de la lecture de la page de référence, de la lecture de la page de référence, de la lecture de la page de référence, de la lecture de la page de référence, de la lecture de la page de référence, de la lecture de la page de référence, de la lecture de la page de référence, de la lecture de la page de référence, de la lecture de la page de référence, de la lecture de la page de référence, de la lecture de la page de référence, de la lecture de la page de référence, de la lecture de la page de référence, de la lecture de la page de référence, de la lecture de la page de référence, de la lecture de la page de référence, de la page de référence, de la page de référence, de la page de référence, de la page de référence, de la page de référence, de la page de référence, de la page de référence, de la page de référence, de la page de référence, de la page de référence, de la page de référence, de la page de référence, de la page de référence, de la page de référence, de la page de référence, de la page de référence, de la page de référence, de la page de référence, de la page de référence, de page de page de référence, de page de page de page de page de page de page de page, de page de page de page, de page de page de page, de page de page de page, de page, de page de page, de page de page de page, de page de page, de page de page, de page de page de page, de page de page, de page de page de page, de page de page, de page de page, de page, de page de page de page, de page de page de page, de page de page, de page de page de page, de page, de page de page de page, de page de page de page, de page de page de page de page, de page, de page de page de page de page de page, de page de page de page de page de page de page de page de page, de page de page de page de page de page, de page de page de page de page de page de page de

## 延伸阅读

- [System V Application Binary Interface, AMD64 Architecture Processor Supplement, section 3.1.2: Data Representation](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Procedure Call Standard for the Arm 64-bit Architecture (AAPCS64), section 5.10: Composite Types](https://github.com/ARM-software/abi-aa/blob/main/aapcs64/aapcs64.rst)
- [Writing ARM64 code for Apple platforms](https://developer.apple.com/documentation/xcode/writing-arm64-code-for-apple-platforms)
- [Intel 64 and IA-32 Architectures Software Developer's Manual, Volume 1, section 3.7.5: Specifying an Offset](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [DWARF Debugging Information Format Version 5, sections 2.1, 5.7.6, 7.5.1.1, 7.5.3, 7.5.6](https://dwarfstd.org/doc/DWARF5.pdf)
- [Itanium C++ ABI, sections 2.5 (Virtual Table Layout), 2.9 (Run-Time Type Information), 5.1 (External Names)](https://itanium-cxx-abi.github.io/cxx-abi/abi.html)
- [Microsoft Learn: Decorated names](https://learn.microsoft.com/en-us/cpp/build/reference/decorated-names?view=msvc-170)et [Name Decoration](https://learn.microsoft.com/en-us/cpp/error-messages/tool-errors/name-decoration?view=msvc-170)
- [llvm-dwarfdump command guide](https://llvm.org/docs/CommandGuide/llvm-dwarfdump.html)et [llvm-cxxfilt command guide](https://llvm.org/docs/CommandGuide/llvm-cxxfilt.html)
- [Python ctypes: Structure layout, sizeof, alignment](https://docs.python.org/3/library/ctypes.html)
- [Ghidra Data Type Manager](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/Base/src/main/help/help/topics/DataTypeManagerPlugin/data_type_manager_description.htm)- Je suis là .[Decompiler Concepts](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/Decompiler/src/main/help/help/topics/DecompilePlugin/DecompilerConcepts.html)- Je suis là .[Decompiler Options](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/Decompiler/src/main/help/help/topics/DecompilePlugin/DecompilerOptions.html), et [Ghidra 12.1.4 release](https://github.com/NationalSecurityAgency/ghidra/releases/tag/Ghidra_12.1.4_build)
- [IDA 9.1 user guide: Types](https://docs.hex-rays.com/9.1/user-guide/types)- Je suis là .[IDA 9.4 release post](https://hex-rays.com/blog/ida-9.4-release-a-new-dyld-shared-cache-swift-analysis-new-teams-add-on-and-more-), et [IDA Free](https://hex-rays.com/ida-free)
- [Binary Ninja user guide: Types](https://docs.binary.ninja/guide/types/)et [Binary Ninja 6.0 Krypton](https://binary.ninja/2026/09/03/binary-ninja-6.0-krypton.html)
- [radare2 6.2.4 release](https://github.com/radareorg/radare2/releases/tag/6.2.4)et [rizin v0.9.1 release](https://github.com/rizinorg/rizin/releases/tag/v0.9.1)
- [GDB manual: Examining the Symbol Table, ptype /o](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Symbols.html)
- [pyelftools on PyPI](https://pypi.org/project/pyelftools/)
- [Lee, Avgerinos, Brumley, "TIE: Principled Reverse Engineering of Types in Binary Programs" (NDSS 2011)](https://www.ndss-symposium.org/ndss2011/tie-principled-reverse-engineering-of-types-in-binary-programs/)
- [Noonan, Loginov, Cok, "Polymorphic Type Inference for Machine Code" (PLDI 2016)](https://arxiv.org/abs/1603.05495)et [the retypd repository](https://github.com/GrammaTech/retypd)
- [Zhang et al., "OSPREY: Recovery of Variable and Data Structure via Probabilistic Analysis for Stripped Binary" (IEEE S&P 2021)](https://ieeexplore.ieee.org/document/9519451/)
- [Chen et al., "Augmenting Decompiler Output with Learned Variable Names and Types" (USENIX Security 2022)](https://www.usenix.org/conference/usenixsecurity22/presentation/chen-qibin)
- [Xie et al., "ReSym: Harnessing LLMs to Recover Variable and Data Structure Symbols from Stripped Binaries" (CCS 2024)](https://dl.acm.org/doi/10.1145/3658644.3670340)
- [Chen et al., "RecStruct" (USENIX Security 2026)](https://www.usenix.org/conference/usenixsecurity26/presentation/chen-yuxin)
