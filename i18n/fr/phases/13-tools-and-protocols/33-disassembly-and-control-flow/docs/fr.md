# Réaction et contrôle: de la ligne à la ligne de contrôle

> Le texte de l'article est le texte de la section "Enquête des caractères".

**Type:** Build
**Languages:** Python, C, x86-64 assembly
**Prerequisites:** Phase 13 · 32（从零构建 ELF）
**Time:** ~150 分钟

## Objectif de l'apprentissage

- Selon les règles du deuxième chapitre du SDM d'Intel, le code de code est déchiffré dans le code x86-64 instruction.
- Pour chaque exemple, chaque directive sur les produits de construction,`llvm-objdump -d`Pour le déchiffrement de la police.
- Pour les mêmes caractères, les opérations de scan et de regression sont effectuées en fonction de leur position de défaut.
- Le code de contrôle est divisé en blocs de base, avec des types de contrôle de type de construction.
- Utilisez l'algorithme de Cooper, Harvey et Kennedy pour calculer les points de contrôle direct et de revenir à la recherche de cycles.
- De l'orientation vers le saut à la mise en place de l'ordre de rétablissement de l'objectif du saut à la mise en place de l'ordre de rétablissement de l'objectif du saut à la mise en place de l'ordre de rétablissement de l'ordre de rétablissement de l'objectif du saut à la mise en œuvre de l'ordre de rétablissement de l'ordre de rétablissement de l'objectif du saut à la mise en œuvre de l'ordre de rétablissement de l'ordre de rétablissement de l'ordre de rétablissement de l'ordre de rétablissement de l'ordre de rétablissement de l'objectif du saut à la rétablissement de l'ordre de rétablissement de l'ordre de rétablissement de l'ordre de rétablissement de l'ordre de rétablissement de l'ordre de rétablissement de l'ordre de rétablissement de l'ordre de rétablissement de rétablissement de l'ordre de rétablissement de rétablissement de l'ordre de rétablissement de rétablissement de l'ordre de rétablissement de rétablissement de rétablissement de rétablissement de rétablissement de rétablissement de rétablissement de rétablissement de rétablissement de rétablissement de rétablissement de rétablissement de rétablissement de rétablissement de rétablissement de rétablissement de rétablissement de rétablissement de rétablissement.

##  problématique

Vous utilisez `-O0`Il est écrit:`ledger.c`Puis demande à un agent:`grade`À quoi ? agent 调用反汇编器、读取清单, répondant que cette fonction est cible inconnue `jmpq *%rax`Il n'y a qu'une seule histoire.`return 0`Il y a une autre.

Vous utilisez `llvm-objdump -d` ouvrir le même fichier cible, voir le saut après avoir quatre blocs, séparément stockés 4、3、2、1── ils sont toujours en liste.

清单只回答一个问题: quels caractères constituent quel条命令――它不会说明哪些命令会执行――以什么顺序执行――从哪里开始执行――为了 répondre à ces questions, il faut aussi trois structures: contrôler le flux de pouvoir atteindre les caractères、 les blocs fondamentaux, ainsi que les bordures entre les blocs――

réa 6.5.0  n'a pas son propre rédacteur en rouleau. Si vous voulez analyser en profondeur, son README  vous demande de fournir Ghidra、 Hopper ou IDA 离线检查时,rea也能调用您安装的 GNU objdump或 Rizin.

```figure
re-33-sweep-vs-descent
```

## Chaque section du format de l'instruction a des règles de traitement

Le schéma 2 du SDM 2-1 donne l'ordre des caractères de chaque instruction. D'abord, il est possible de choisir avant, puis il est possible de choisir trois caractères de code d'exploitation, puis il est possible de choisir des caractères ModRM et des caractères SIB.

Chaque décideur décide de la signification de chaque décideur.

### Il y a 4 groupes

Le SDM 2.1.1 列出了传统前──第 1 组包含 `F0`Fermeture et réinitialisation`F2`- Je suis là.`F3` Deuxième partie:`2E`Oui `%cs`Il est également possible de faire des observations sur les différents types de données.`66`, qui est le nombre d'opérations.`67`, é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é é

Le manuel dit que chaque groupe peut utiliser un précédent, mais le compilateur va en produire plus.`ledger-x86_64-O0.o`Le décalage`0xf2`Le remplissage est`66 66 66 66 66 2e 0f 1f 84 00 00 00 00 00`Il y en a cinq .`66`Il y a une autre.`llvm-objdump`Il est imprimé pour`nopw %cs:(%rax,%rax)`, vous construisez un décodeur aussi. Décodeur collecte tous les précédents et décide plus tard quelles sont les réelles fonctionnalités.

`66`Il y a aussi un deuxième rôle. Pour les instructions de l'ESS, il s'agit d'une priorité obligatoire de sélection des codes d'exploitation, donc `66 0f ef c0`Oui `pxor %xmm0, %xmm0`C'est pas une opération de 16 places.`F3 0f 6f`Oui `movdqu` Décodeur de recherche d'abord la combinaison de la première et de la deuxième partie du code d'exploitation `66`才表示 16 位操作数──

### REX  augmenter les quatre places, et doit être plus rapidement exploité

Le MDD 2.2.1 définira REX comme étant`40`À la`4F`之间的一个字节,格式为 `0100WRXB`Il y a une autre.`W`选择 64 位操作数──`R`扩展 ModRM 的 reg 字段──`X`扩展 SIB's index 字段。`B`扩展 ModRM's r/m 字段、SIB's base 字段或操作码字节中的寄存器(表 2-4)。REX 必须紧接在操作码或转义字节之前; si REX 后面跟随传统前, il sera alors négligé。

Dans le`48 89 e5`Je suis un homme.`48`Il est réglé.`W`Le code d'exploitation`89`Oui `MOV r/m, r`, ModRM `e5`选择将  élection`%rsp`移入 `%rbp` Débarrasser REX, le reste est devenu `movl %esp, %ebp`Il y a une autre.

REX changera également le nom du référentiel. Si il y a un REX, le code 4 à 7 sera sélectionné.`%spl`- Je suis là.`%bpl`- Je suis là.`%sil`- Je suis là.`%dil`, au lieu de `%ah`- Je suis là.`%ch`- Je suis là.`%dh`- Je suis là.`%bh`                                                                                                                                                                                                                                                              

### 操作码分布在两张映射表中

单字节操作码最常见──`0F`转义到双字节映射表, alors que `0F 38`Ou `0F 3A`转义到样例从未使用的三字节映射表(SDM 2.1.2)──有些操作码将 ModRM's reg 字段用作额外的三字节映射表,手册中写作 `/digit`Il y a une autre.`83 /7`Il y a 8 places de numéros instantanés.`cmp`- Je suis désolé .`83 /5`Oui `sub`- Je suis désolé .`FF /4`Il est intermédiaire.`jmp`Il y a une autre.

`code/main.py`Le déciffreur central couvre quatre exemples de codes d'exploitation dans les fichiers cibles ainsi qu'une petite quantité de codes d'exploitation proches.`mov`- Je suis là.`lea`- Je suis là.`movslq`- Je suis là.`movzbl`- Je suis là.`imul`、移位 、`test`et `idiv`, ainsi que `push`- Je suis là.`pop`- Je suis là.`call`- Je suis là.`ret`、十六种条件跳转、多字节 `nop`Et cinq codes d'exploitation SSE2 sont déposés avec les adresses et les causes.`DecodeError`                                                                                                                                                                                                                                                              

### ModRM et SIB 选择操作数

Le SDM 2.1.3 va déployer le ModRM en`mod`(Bits 7:6)`reg`- Je suis en train de le faire.`r/m`Je suis en train de vous dire:`mod = 11`Précisez le mot "r/m"`mod = 00`- Je suis là.`01`- Je suis là.`10`分别表示无位移、8位位移或32位位位移的内存寻址──`r/m = 100`Expression de l'arrière suivant un SIB 字节──SIB 分为 `scale`(7:6)`index`- Je suis en train de le faire.`base`(2:0);indice 为 `100`Indique pas d'indice寄存器

Le tableau 2-2 contient deux règles particulières qui sont très importantes dans le cadre de 64 places.`mod = 00`且 `r/m = 101`Ce n' est pas`(%rbp)`Il s'agit d'une approche de la mise en œuvre de la directive de l'Union européenne concernant les mesures de protection des données.`mod = 00`且 SIB's base 为 `101`,则表示没有基址寄存器的32位位位移──

É`-O0`Je suis là .`grade`Le centre`8d 44 08 fa`Pour le code d'exploitation.`8D`Oui `lea` ModRM `44`Oui `01 000 100`:8 位位移、reg 为 `%eax`, derrière le SIB.`08`Oui `00 001 000`: enrichisse 1 索引 `%rcx`、基址 `%rax`△ 位移字节 `fa`Il s'agit d'un projet de loi de l'Union européenne.`leal -0x6(%rax,%rcx), %eax`, calculé est l' indice de commutation`score / 10 - 6`Il y a une autre.

### 位移是链接器的写入位置

`48 8d 0d 00 00 00 00`Oui `leaq (%rip), %rcx`◊ Les quatre zéro caractères sont des caractères de déplacement de l'opération par rapport à l'opération.`.rela.text`Le décalage`0x69`Les articles de l'article`R_X86_64_PC32.rodata-0x4`◊psABI 表 4.9) `R_X86_64_PC32` définition `S + A - P`: 符号地址加上加数,再减去该字段的地址──

Le processeur ajoutera ce segment à l'adresse de l'ordre suivant, donc l'objectif final est de`S + A + (end - P)`Pour cette article`lea`,该字段占最后四字节, donc `end - P`Pour 4, l'objectif est `.rodata + (-4) + 4 =.rodata + 0x0` Le nombre -4  préalablement compensé par ce qu'il s'agit de  chaque RIP de l'échantillon par rapport à l'opération est inclus dans le nombre -4, donc `-O1``lea`Le plus haut`.rodata+0x10` réellement signifiant `.rodata+0x14`Il y a une autre.

解码器记录每条命令内部位移字段的偏移──`resolve_reference()`Dans le tableau de repli, recherchez ce décalage, et rapportez où le nombre d'opérations suivantes du lien se dirigera.`leaq (%rip), %rcx`Il est devenu un lieu de vie.`.rodata+0x0`Le spectacle.

### Le nombre immédiat maximum de 32 places, à une seule exception

Le SDM 2.2.1.5 prévoit que, dans le cadre de 64 places, le nombre immédiat reste au plus élevé de 32 places et que des élargissements sont effectués.`MOV r64, imm64`(带 `REX.W``B8+r`),AT&T 语法称之为 `movabsq`Pour les opérations de calcul, le décodeur sera 8 places immédiatement`83 c1 fa`Oui `addl $-0x6, %ecx`); Pour le nombre de déplacements et le nombre de sélectionnaires,`pshufd $0xee`)¬¬ cette différence avec`llvm-objdump`De l'émission de la même année.

Je suis en train de vous dire`push`et `pop`默认使用 64 位操作数并忽略 `66`(SDM 2.2.1.7)  donc les décodeurs n'ont pas besoin de lire les opérations, ils seront nommés `pushq`- Je suis là.`popq`- Je suis là.`callq`et `retq`Il y a une autre.

## Un ordre de travail

Avant de le faire, d'abord, le code est mis sur papier.`grade`Le centre`48 69 c0 67 66 66 66`Il y a une autre.

1. `48`      `40`À la`4F`之间, donc `W = 1`Le nombre d'opérations de REX ⋅ est de 64 places ⋅
2. `69`Oui `IMUL r, r/m, imm32`Il y a une autre.
3. `c0` ModRM`11 000 000`:寄存器形式, rég 为 `%rax`,r/m pour`%rax`Il y a une autre.
4. Les quatre caractères suivants sont les nombres de la première partie:`0x66666667`Il y a une autre.
5. AT&T 顺序为立即数、源、目标:`imulq $0x66666667, %rax, %rax`Il y a une autre.

总计七字节,`llvm-objdump`Le texte imprimé est exactement le même. Ce nombre est un nombre inverse, laissez-le passer par le multiplicateur et le suivant.`sarq $0x22`(right movement 34 位) réalisation de la mise à jour à 10 ◦ 34 课也会遇到此对操作,届时升机将将将其恢复为`score / 10`Il y a une autre.

Le codeur est en train de`Decoder.decode()`- Je suis là.`_State.modrm()`et `_State.finish()`En suivant cet ordre, il mettra en place chaque branche du SDM avec son fichier de caractères.

## 线性扫描

Schwarz、Debray 和 Andrews 在Dissassembly of Executable Code Revisited(WCRE 2002) section 3.1 décrit la ligne de scan: de la première section du code section commence, de la décode une instruction, de nouveau de son arrière section continue, jusqu'à la fin.`objdump`如此工作,`llvm-objdump`C'est aussi ça.

```python
def linear_sweep(code: bytes, start: int = 0, end: int | None = None) -> SweepResult:
    position = start
    while position < end:
        try:
            instruction = decode(code[:end], position)
        except DecodeError:
            undecodable.append((position, code[position]))
            position += 1
            continue
        instructions.append(instruction)
        position = instruction.end
```

Cette méthode a un mode de défaillance, le diagramme 1 le montre. Les caractères de données sont décodés en commande, puis le décodeur va temporairement passer par la limite de la véritable commande.

Le scan est aussi un déterminant de référence de ce cours.`llvm-objdump -d`Un coup de cœur, alors`llvm-objdump`Le texte de la capture se trouve dans le`code/fixtures/*.objdump.txt`◊测试将每一行解析为地址、字节和文本, deleted `#`后的注释,再进行比较──四个目标文件分别包含 86、56、84 和 11 条指令,总计 237 条,解码器全部匹配──

## 递归下降

Dans le même article, le paragraphe 3.2 de l'article 2 est consacré à la méthode de retour à travers le processus de retour.

```python
if instruction.flow == "branch":
    worklist.append(instruction.target)
    address = instruction.end
elif instruction.flow == "indirect-jump":
    table = resolver(instruction, instructions) if resolver else None
    if table is None:
        unresolved.append(instruction)
        break
```

Le modèle de défaillance de cette méthode est bien le contraire. Dans les cycles de saut indirect, il n'y a pas de but, le processus s'arrête ici, tous les blocs qui peuvent seulement passer par le saut sont encore inconnus.`main.py`Le processus de régression et de déclin central a été enregistré comme un conflit et un arrêt de la voie, faisant apparaître la superposition, plutôt que de se résoudre silencieusement deux fois.

Andriesse et d'autres ont évalué 9 contre-rédacteurs avec 981 fichiers de programmation générés par un compteur.`grade`Le saut en direct est très courant.

## Un cas d'erreur de scan de ligne

`code/fixtures/sweep-trap.s`Il est écrit à la main en 24 caractères, en fonction de l'ensemble de la structure.`movzbl (%rcx,%rax), %eax`Je vais le faire.

```asm
lookup:
        movslq  %edi, %rax
        leaq    .Ltable(%rip), %rcx
        movzbl  (%rcx,%rax), %eax
        jmp     .Ldone
.Ltable:
        .byte   0x31, 0xc0, 0x90, 0x48
.Ldone:
        addl    $1, %eax
        retq
```

Utilisation `clang -target x86_64-unknown-linux-gnu -c sweep-trap.s`Il est possible de le construire en quatre caractères, qui peuvent être décodés en une instruction raisonnable.`31 c0`Oui `xorl %eax, %eax`- Je suis désolé .`90`Oui `nop`Il y a une autre.`48`C'est le réx, donc le scan est réel.`addl $1, %eax`Les trois caractères sont en forme de texte.`addq $0x1, %rax`◊ Capture `llvm-objdump`C' est comme ça:

```text
       e: eb 04                        	jmp	0x14 <lookup+0x14>
      10: 31 c0                        	xorl	%eax, %eax
      12: 90                           	nop
      13: 48 83 c0 01                  	addq	$0x1, %rax
      17: c3                           	retq
```

Cette liste ne se détériore pas: chaque caractère est décodé, chaque assistant est réel, et il y a aussi`retq`Mais il y a encore trois erreurs.`0xe`Le but du saut est de`0x14`Il n' y a pas d' ordonnance dans le dossier.`0x14`Je suis vraiment là.`0x14` Execution est de 32 places `addl`, le code est en 64 places .`addq`◊ 4 éditions sont également affichées en code.

De `lookup`符号开始的递归下降解码出六条命令,沿跳转到达 `0x14`, rapport `addl $0x1, %eax`Il n'y aura pas de 4 épisodes.`plus_one`Toutes les instructions sont déterminées.`main.py`Le centre`trap_report()`打印比较结果:

```json
"linearSweep": {
  "instructions": 9,
  "atJumpTarget": {"starts": "0x13", "text": "addq\t$0x1, %rax", "startsAtTarget": false},
  "claimedDataBytes": 4,
  "claimedPaddingBytes": 8
},
"recursiveDescent": {
  "instructions": 6,
  "atJumpTarget": "addl\t$0x1, %eax",
  "claimedDataBytes": 0,
  "claimedPaddingBytes": 0
}
```

测试  répéteur`test_sweep_and_objdump_share_the_same_mistake`Je vous le dis,`llvm-objdump`Dans le`0x13`- Ça a été imprimé .`addq $0x1, %rax` Le déterminant de référence est un scan de ligne, qui a également hérité de son point aveugle.

## 基本块

Allen dans le Control Flow Analysis(1970) définit le bloc de base: un passage ne peut entrer que de la première instruction ∼ de la dernière instruction ∼ de la séquence de instructions de départ ∼ Yakdan  et d'autres dans No More Gotos(NDSS 2015)

Le processus de construction pour exécuter deux fois l'ordre de la séquence de code déroulé par adresse. La première fois, la première fois, la première fois, la première fois, le leader: l'entrée, la branche ou le saut de but, l'objectif, l'objectif, ainsi que les instructions après tout transfert de contrôle.

```python
for instruction in self.instructions:
    if instruction.address in leaders or current is None or current.end != instruction.address:
        current = Block(instruction.address, [])
        self.blocks[instruction.address] = current
    current.instructions.append(instruction)
```

Le dernier ordre de chaque bloc détermine le retour sans suite; le saut en fait un, marqué par le`jump`; conditions de paiement ont deux, séparément marqués pour `taken`et `fallthrough`◊ L'ordre ordinaire de l'ordre de la fin du bloc est entré dans le prochain bloc, ce qui se produit dans le prochain ordre est la partie du but.`table`Si aucun objectif n'est atteint, il sera inscrit.`unresolved`Il y a une autre.

Il y a deux autres faits:`-O0`Pour toi !`grade`Si l'adresse de départ d'un bloc tombe dans une autre méthode de nettoyage, c'est la situation de superposition dans le cas de la trappe.

## Total des contrôles

`-O1`Je suis là .`total`Il y a 31 commandes:

```text
      40: 85 f6                        	testl	%esi, %esi
      42: 7e 18                        	jle	0x5c <total+0x1c>
      44: 89 f1                        	movl	%esi, %ecx
      46: 31 d2                        	xorl	%edx, %edx
      48: 31 c0                        	xorl	%eax, %eax
      4a: 66 0f 1f 44 00 00            	nopw	(%rax,%rax)
      50: 03 04 97                     	addl	(%rdi,%rdx,4), %eax
      53: 48 ff c2                     	incq	%rdx
      56: 48 39 d1                     	cmpq	%rdx, %rcx
      59: 75 f5                        	jne	0x50 <total+0x10>
      5b: c3                           	retq
      5c: 31 c0                        	xorl	%eax, %eax
      5e: c3                           	retq
```

La première instruction à séparer est`0x40`(entrée)`0x44`(le secteur de l'énergie)`jle`之后)`0x50`(le secteur de l'énergie)`jne`Les résultats de l'enquête`0x5b`(le secteur de l'énergie)`jne`后) 和 `0x5c`(le secteur de l'énergie)`jle`Le but de cette étude est de réaliser des objectifs:

| 起点 | 终点 | 类型 | 原因 |
|---|---|---|---|
| `0x40` | `0x44` | fallthrough | `jle` 未跳转，计数为正 |
| `0x40` | `0x5c` | taken | 计数为零或负数，返回 0 |
| `0x44` | `0x50` | fallthrough | `nopw` 是块内的对齐填充，执行会经过它 |
| `0x50` | `0x50` | taken | `jne 0x50`，即循环 |
| `0x50` | `0x5b` | fallthrough | 循环退出，返回总和 |

`0x4a`处的六字节 `nopw`Oui, remplissez-le.`0x50`Le circuit est situé à 16 caractères à la limite.`0x44`La dernière.`retq`Après,`0x5f`处的单字节 `nop`Il y a aussi un remplissage, mais aucun chemin pour y arriver.`unreachable()`Je vais le mettre en liste.

Dans le`-O2`La même fonction a 140 caractères et deux cycles.`0x80`Le cycle SSE2 est passé par`paddd`Chaque tour a 8 valeurs, les quantités restantes sont`0xc0`处理──CFG 有两条回边:`0x80 -> 0x80`et `0xc0 -> 0xc0`Je suis allé voir ces deux côtés.

## Utilisez l'algorithme de calcul

Si de l'entrée au bloc `b`Chaque chemin est traversé par un bloc.`d`,则称 `d`- Je veux dire .`b`Il y a une autre.`b`Le point de contrôle direct, est`b`La distance entre les points de contrôle`b`Recent One. This concept through Allen(1970) remonte à Prosser(1959), le 34ème cours est basé sur cette structure correctement placé`if`et `while`Il y a une autre.

Cooper, Harvey et Kennedy ont écrit un algorithme de domination simple et rapide en 2001: ils considèrent que l'adoption d'un système de données qui fonctionne à l'opposé de l'ordre de l'ordre, sur les diagrammes ci-dessous, est supérieure à celle de Lengauer et Tarjan en 1979.

```python
def intersect(first: int, second: int) -> int:
    while first != second:
        while number[first] > number[second]:
            first = idom[first]
        while number[second] > number[first]:
            second = idom[second]
    return first

changed = True
while changed:
    changed = False
    for start in order[1:]:
        processed = [p for p in self.predecessors(start) if p in idom]
        candidate = processed[0]
        for other in processed[1:]:
            candidate = intersect(other, candidate)
        if idom.get(start) != candidate:
            idom[start] = candidate
            changed = True
```

`number`保存 chaque bloc dans la position inverse, entrée est 0。`intersect`Avec deux pointers, le courant est en train de régner jusqu'à la rencontre.`<`进行比较──本代码使用逆后序号,因此比较符是 `>`Le reste suit le pseudo-code de l'article.

Pour le`-O1`Je suis là .`total`, le résultat est `idom(0x44) = 0x40`- Je suis là.`idom(0x50) = 0x44`- Je suis là.`idom(0x5b) = 0x50`et `idom(0x5c) = 0x40`Il est en train de mourir.`0x50 -> 0x50`Il est également connu pour sa conception de la technologie de l'information.`back_edges()`Retournez à cette section.`test_dominators_on_a_hand_built_diamond_with_a_loop`Dans la même série de 16 caractères, le même code fonctionne.`intersect`- Je suis en train de vous dire.

## - 0 - classe moyenne

Dans le`-O0`Je vais vous dire`grade`Le centre`switch`编译为位置无关跳转表的常用形式:

```text
      5d: 83 e8 04                     	subl	$0x4, %eax
      60: 77 38                        	ja	0x9a <grade+0x6a>
      62: 48 8b 45 f0                  	movq	-0x10(%rbp), %rax
      66: 48 8d 0d 00 00 00 00         	leaq	(%rip), %rcx
		0000000000000069:  R_X86_64_PC32	.rodata-0x4
      6d: 48 63 04 81                  	movslq	(%rcx,%rax,4), %rax
      71: 48 01 c8                     	addq	%rcx, %rax
      74: ff e0                        	jmpq	*%rax
```

Je vais le lire en quatre faits.`subl $0x4`Après`ja`C'est un défi de plus de 4 ans.`0x9a`Il y a donc cinq branches.`leaq`Pour la mise en place`%rcx`, la section précédente a déjà expliqué que cet endroit était`.rodata+0x0`Il y a une autre.`movslq`É4 pour réduire le facteur charger un symbole 32 articles.`addq`Les éléments sont donc de la distance entre le tableau et le bloc de l'objet.

目标文件中的每个表字节都是零. 目标仅以`.rela.rodata`Le centre de la répartition est:

```text
RELOCATION RECORDS FOR [.rodata]:
OFFSET           TYPE                     VALUE
0000000000000000 R_X86_64_PC32            .text+0x91
0000000000000004 R_X86_64_PC32            .text+0x8c
0000000000000008 R_X86_64_PC32            .text+0x87
000000000000000c R_X86_64_PC32            .text+0x82
0000000000000010 R_X86_64_PC32            .text+0x86
```

Pour le déplacement`4k`La première`k`项应用 `S + A - P` La valeur de stockage`.text + A - (.rodata + 4k)`, code encore ajouter `.rodata + 0`Le but est donc de`.text + A - 4k`△第 0 项是 `0x91 - 0 = 0x91`, 1er épisode`0x8c - 4 = 0x88`, 2ème 项是 `0x87 - 8 = 0x7f`◊III 3, 4 项分别是 `0x82 - 12 = 0x76`et `0x86 - 16 = 0x76`Il y a une autre.`score / 10`Les cas 6、7、8、9、10 sont séparés jusqu'à ce que le stockage 1、2、3、4、4 blocs soit atteint.

`recover_table()`执行这些计算――`jump_table_resolver()`De `jmpq`Pour une forme habituelle, trouver la valeur générée par le référentiel.`addq`- Je le charge.`movslq`、 générer des bases `leaq`, ainsi que de l'exécution des contrôles frontaliers `ja` Revenir à la suite de la rédaction de la liste des fichiers liés à l'exécution, sans réposition;`evidence`记录生成目标所用的路径──

Voici ce qui suit:`-O0`Je suis là .`grade`Les données proviennent de:`python3 code/main.py cfg code/fixtures/ledger-x86_64-O0.o grade`- Le numéro de la liste:

| 方法 | 指令数 | 块数 | 边数 | 字节 | 问题 |
|---|---|---|---|---|---|
| 线性扫描 | 34 | 9 | 7 | 118 代码 + 10 填充 | 5 个不可达块，没有进入四个 case 块的边，填充被解码为 `nopw` |
| 递归下降 | 25 | 3 | 2 | 82 代码 | 36 个代码字节从未到达，`0x74` 处的 `jmpq *%rax` 未解析 |
| 带表的递归下降 | 33 | 8 | 11 | 118 代码 | 无 |

Après la réparation, le contrôle est terminé.`idom`est contenu dans le bloc de saut`0x62`Il y a une autre.`0xa1``idom`Il est à l'entrée.`0x30`Parce que je viens de`0x9a`Des routes par défaut`0x62`On peut arriver.`0xa1`Il y a une autre.

## Qu'est-ce que tu fais pour la classe ?

Vous avez peut-être déjà vu une description comme celle-ci:`grade`C'est un changement de saut en mode de tournage.`-O1`et `-O2`Je suis là.`grade`Il n'y a pas de changement de direction.

```text
      2c: 83 f9 04                     	cmpl	$0x4, %ecx
      2f: 77 0c                        	ja	0x3d <grade+0x2d>
      31: 89 c8                        	movl	%ecx, %eax
      33: 48 8d 0d 00 00 00 00         	leaq	(%rip), %rcx
		0000000000000036:  R_X86_64_PC32	.rodata+0x10
      3a: 8b 04 81                     	movl	(%rcx,%rax,4), %eax
      3d: c3                           	retq
```

Références`0x10`Plus de 4, on obtient l'adresse de l'appareil.`.rodata+0x14`La charge est ordinaire.`movl`, qui est écrit pour`01 00 00 00 02 00 00 00 03 00 00 00 04 00 00 00 04 00 00 00`◊ Le tableau contenant cinq valeurs de retour a remplacé cinq blocs de cas ◊ ici il y a un redéploiement ◊ ici il y a aussi un contrôle de bordure, mais le flux de contrôle ne comporte que trois blocs ◊ trois bordures et une condition de branche ◊`find_value_tables()`Le rapport est`value-table`,条目为`[1, 2, 3, 4, 4]`, et avec`evidence: "bytes"`Il y a une autre.

`-O2`Je suis là .`grade_label`Plus encore: 5 points de référence`labels`Numéro, devenir situé`.rodata+0x0`、 contient cinq tableaux de 32 déviations.`R_X86_64_PC32`Réinitialisation, fonction sera ajoutée à l'article chargé.`recover_table()`读取这五重定位, retournez `.rodata.str1.1`Le centre de décalage`0, 2, 4, 6, 8`, ils sont séparés de conserver `F`- Je suis là.`D`- Je suis là.`C`- Je suis là.`B`- Je suis là.`A` Récupérer le même ensemble de calculs de la table de saut peut également être récupéré par rapport à la table de données, car les deux sont des positions de décalage connues `S + A - P`Il y a une autre.

Les deux versions de construction ont été formées par: nommé selon le caractère présenté en réalité.

## Réa 和 Ghidra est ici pour vous offrir

réa 6.5.0 配合 Ghidra 12.1.4 fournisseur,`procedure_assembly`Liste de la fonction en tant que boîte de références`inspect_native_instruction`返回单条命令的字节、长度、解码文本、操作数代币、带类型引用和控制流, dont le retour des opérations selon le code p 分类──`xrefs`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `ReferenceManager.getReferencesTo`Les résultats obtenus sont:`analyze_function`包含函数的CFG 和 `body`Il y a une autre.`procedure_info`Pour indiquer la portée d'adresse contenue dans les deux extrémités, il est rappelé que les espaces et les endroits partagés ne peuvent être considérés comme des caractères possédés par la fonction.

Ces faits sont la régression et la baisse de Ghidra et la configuration des résultats de l'analyseur.`instruction_flow_evidence`- Je suis là.`function_references`et `jump_table_evidence`Le résultat sera donc marqué par ses règles, mais ne peut pas démontrer le processus de mise en œuvre.

Maintenant, vous avez un processus de recommandation.`python3 code/main.py cfg`, le nombre de blocs de démarrage, le nombre de bord et le nombre de restaurations, le contenu de retour et le fournisseur de contrôle.

Révélation du programme de sécurité à l'angle de la mise en garde: Capstone 6.0.0-Alpha10(2026-07-21) Modifié CVE-2026-55893 和 CVE-2026-55894 涉及越界读写,5.0.9(2026-05-28) 则回移移 CVE 修复──解码器读取的字节并非自发生成──15 字节限制──`_Cursor.byte()`Les contrôles de coupure, ainsi que les codes d'exploitation inconnus, sont protégés.`main.py`, éviter de traiter les entrées qui dépassent la portée de leur conception.

## 动手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow
python3 code/main.py
```

输出 est un rapport JSON. Il donne une cohérence avec le déterminateur de référence de chaque exemple de fichier cible; il donne un nombre de blocs et un nombre de bord à chaque fonction sous trois méthodes. Il énumère également des blocs non résolus, des sauts indirects, des retours, des nœuds de contrôle direct ainsi que toutes les tables, et donne une comparaison des exemples de pièges.

预期 structure:

```json
{
  "fixtures": {
    "ledger-x86_64-O0.o": {
      "oracle": "86/86 instructions agree with llvm-objdump",
      "functions": {
        "grade": {
          "range": "0x30-0xa6",
          "paddingBytes": 10,
          "linearSweep": {"instructions": 34, "blocks": 9, "edges": 7, "unreachableBlocks": ["0x76", "0x7f", "0x88", "0x91", "0xa6"], "...": "..."},
          "recursiveDescent": {"instructions": 25, "blocks": 3, "edges": 2, "unresolvedIndirectJumps": ["0x74"], "...": "..."},
          "recursiveDescentWithTables": {"instructions": 33, "blocks": 8, "edges": 11, "...": "..."},
          "tables": [{"kind": "jump-table", "table": ".rodata+0x0", "count": 5, "entries": ["0x91", "0x88", "0x7f", "0x76", "0x76"], "evidence": "relocation", "...": "..."}]
        }
      }
    }
  },
  "sweepTrap": {"...": "..."}
}
```

按以下顺序阅读 `code/main.py`- Le numéro de la liste:

1. `ElfObject`读取节头、符号和 `.rela.*`条目,`symbolize()`按 `llvm-objdump`Le nom de l'endroit.
2. `Decoder.decode()`读取前和REX, puis selon un seul caractère ou deux caractères
3. `_State.modrm()`读取 ModRM、SIB 和位移,并记录位移字段的偏移──
4. `resolve_reference()`Application de replacement sur le segment numérique de déplacement ou de replacement instantané`S + A - P`Il y a une autre.
5. `linear_sweep()`et `recursive_descent()`Il y a deux méthodes, chacun avec son propre dossier.
6. `recover_table()`et `jump_table_resolver()`通過重定位或字节读取表──
7. `ControlFlowGraph`Construire des instructions 块和带类型边,`dominators()`实现代算法──
8. `analyze_function()`Pour une fonction fonction fonctionnaliser tous les méthodes,`compare_with_oracle()`- Je suis en train de vous dire.

Il y a deux ordres.`python3 code/main.py disasm FILE.o`印清单, et avec le réaffichage de l'objectif après chaque instruction de l'objectif.`python3 code/main.py cfg FILE.o FUNCTION`打印单个函数的分析──

##  réel usage

Pour les nouveaux documents objectifs, utilisez trois méthodes en suivant cet ordre:

1. Précédent de l'examen`llvm-objdump`Il y a un bug, et toutes les structures le reçoivent.
2. Chaque symbole fonctionnel commence à fonctionner, à descendre et à descendre.`unresolved` Tous les éléments sont des mouvements ou des mouvements que vous n'avez pas encore réalisés.
3. Pour chaque saut non résolu, recherche la forme habituelle du tableau ainsi que la position de réposition du tableau.
4. 字节比线性扫描与递归下降――on ne reconnaît que les caractères de l'ordre de la scanation comme étant remplissants ou données; les deux caractères non reconnus sont inconnus du code, ou appartiennent à une fonction que vous n'avez pas encore trouvée―
5. Avec le résultat de la régression et de la baisse de la réparation, le CFG est construit et le revers est examiné.`while`Ou `for`Il y a une autre.

Lorsque vous passez à la version du nouveau compteur, recaptez-les, car les changements de liste signifient que les exemples ont également changé.

## 交互实验

### 实验 A: d'abord le code sur papier, puis le reconsidérer

Dans le`code`Je suis en train de lire Python:

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow/code
python3 -q
```

运行:

```python
from main import *
decode(bytes.fromhex("48 8d 0d 00 00 00 00"), 0).text
decode(bytes.fromhex("8d 44 08 fa"), 0).text
decode(bytes.fromhex("66 66 66 66 66 2e 0f 1f 84 00 00 00 00 00"), 0).length
```

Chaque fois que vous avez utilisé le premier, vous avez écrit le dernier résultat.`48`, observer les grandes variations de l'opération.`decode(bytes.fromhex("0f 0a"), 0)`, lire `DecodeError`Il y a une autre.

### 实验 B: laisser le dessus de la position

```python
elf = load_fixture("ledger-x86_64-O0.o")
code = elf.section(".text").data
lea = decode(code, 0x66)
lea.displacement_offset
resolve_reference(elf, lea)
```

引用结果是 `.rodata+0x0`将地址改成 `grade_label`Le centre`0x116`, 读取指向 `.data`Il y a une autre question.`0x10e`- Je suis là.`callq`Il a été détecté.`R_X86_64_PLT32 grade-0x4`, résolution de l'objectif`0x30`Je suis là .`grade`Il y a une autre.

### 实验 C: observer les différences entre les deux méthodes

```python
trap = load_fixture("sweep-trap.o")
text = trap.section(".text").data
[i.text for i in linear_sweep(text, 0, 0x20).instructions]
[i.text for i in recursive_descent(text, [0], 0x20).sorted_instructions()]
```

统计                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `0x13`Il y a une autre chose qui se passe.`sweep-trap.s`Le dernier caractère du texte`0x48`改为 `0xe8`Il y a deux méthodes de réaménagement, de reconstruction et de réutilisation.`addl`et `retq`吞进一条目标位于节外的 `callq`, la fonction semble ne pas être retournée.

### 实验 D: manu算支配节点

```python
analysis = analyze_function(load_fixture("ledger-x86_64-O1.o"), "total")
analysis.cfg.edges
analysis.cfg.reverse_postorder()
analysis.cfg.dominators()
analysis.cfg.back_edges()
```

Sur le papier, dessinez cinq blocs, d'abord calculer le contrôle du nœud, puis voir le résultat.`-O0`Je suis là .`grade`运行相同四行代码, explique pourquoi `idom(0xa1)`Oui `0x30`Au lieu de`0x62`Il y a une autre.

## 实践实验

À titre d'exemple, ajouter un point de référencement indirect, et étendre l'analyse.

要求:

-  éditer une fonction C, en utilisant un indicateur de fonction choisi dans un petit nombre de groupes 调用函数──分别用 `-O0`et `-O1`construire, réaliser des objectifs et leurs documents `llvm-objdump`文本一起提交──
- 让解码器在两个目标文件上都与参考结果一致. 只有当例中的指令需要时才添加操作码.
- 扩展 `recursive_descent()`, faire une mise en place de la mise en place de la mise en place de la mise en place de la mise en place de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en`calls`, objectif de mise en œuvre`None`, puis continuer à exécuter.
- 编写解析器,通过重定位读取函数指针数组并报告可能的被调用者──
- sera régulièrement utilisé`indirectCalls`添加到函数报告,并为每个目标提供证据类型──
- 编写测试, faire retourner le résolveur à l'objectif du symbole non fonctionnel 时测试失败。

Le succès est:`python3 code/main.py cfg`Il peut être répertorié par chaque utilisateur possible et prouver sa réposition, et tous les documents objectifs sont toujours en cours de référence.

## 评分实验

5 questions sur les fixations de ce cours.`code/lab_answers.json`◊ Numéro écrit en chiffre, ou écrit en chiffre `"0x40"`Une liste écrite en JSON.

1. `t1`:递归下降在 -O1 的级 中解码出的指令数──
2. `t2`:- Le nombre total de blocs de base de l'O1
3. `t3`:- Le total des adresses du centre circulaire de O1, écrit en 1016进制──
4. `t4`: Dans le cadre de la mise en pièces, couvrir l'adresse de départ de l'ordre de mise en pièces de 0x14, écrire en 16 dans le système
5. `t5`:-0 de la note 中跳转表的条目数──

检查你的答案:

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow
python3 code/lab.py
```

 inspecteur dans les fixations soumises `code/main.py`计算每个期望值──它为每道题输出 `PASS`- Je suis là.`FAIL`Ou `TODO`Et le total, seulement cinq questions sont passées.`python3 code/lab.py my-answers.json`Je peux vérifier un autre dossier.`code/tests/test_lab.py`证明检查器接受正确答案并拒绝错误答案──

### Regardez ça fonctionne

[Inside a Decompiler](https://aiengineeringfromscratch.com/inside-a-decompiler?program=trap&sweep=linear)Le système de calcul de la machine utilise ce cours comme base de calcul et de calcul de base.`sweep-trap.o`Le code de déchiffrement affiche quatre caractères de données du code de déchiffrement, et un seul marqueur indique qu'il se trouve à`0x13`- Je suis là .`addq`内部、地址 `0x14`Le déchiffreur est passé à la descente, on peut voir le saut à travers ces données.

## Le produit

本课包含 `outputs/skill-disassembly-and-control-flow.md`Il est utilisé pour transformer les fichiers cibles et les noms de fonctions en un ensemble de fichiers et de blocs de base, avec des types de bord, des nœuds de contrôle et tous les contrôles non résolus. Il est nécessaire de fournir des informations de référence, des méthodes de compilation de deux types de fichiers, des caractères de calcul, des preuves de positionnement de chaque tableau de récupération, ainsi que des informations de contenu encore inconnues.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow
python3 code/main.py
python3 code/tests/test_main.py
```

验证应证明:

- Le décodage est en quatre cas, l'ensemble des documents cibles est classé dans les 237 articles.`llvm-objdump -d`Un groupe
- REX.W 选择 64 位操作数,REX.R 和 REX.B 扩展寄存器字段
- ModRM et SIB présentent correctement les opérations de stockage AT&T, y compris les facteurs d'encombrement, les indices et les symboles de déplacement
- RIP par rapport à la position des mouvements seront connectés à l'ordre dans les segments de la position des mouvements
- Récapitulatif des résultats de la rédaction et de la rédaction de la version précédente
-  imposer`66`Avant de choisir SSE 操作码,并让寄存器保持 32 位
- 8 chiffres instantanés pour l'expansion des symboles en calcul, pour le débit des symboles en calcul
- Les instructions de plus de 15 caractères, les instructions interrompues et les codes d'exploitation inconnus seront expulsés.`DecodeError`
- `lea`Le plus haut`R_X86_64_PC32`解析为表,`call`Le plus haut`R_X86_64_PLT32`解析为被调用者
- L'analyse de la ligne sera codée et le saut sera effectué sans instruction.
- 递归下降从不将表或填充认定为指令, et dans le but de lire `addl $0x1, %eax`
- `llvm-objdump`Dans le piège, on a commis la même erreur que la scan de ligne.
- Les entrées de l'ordre sont enregistrées comme des conflits.
- Un pas de transition ininterrompu et ininterrompu, non résolu, est classé
- `-O1`Je suis là .`total`Il y a cinq blocs, cinq bandes de type bord, un bord et des nœuds de contrôle direct prévus.
- Les éléments de la structure manuelle sont des cycles de forme qui produisent des éléments de contrôle définis par un algorithme.
- `-O2`Je suis là .`total`Il y a deux cycles.
- `-O0`Je suis là .`grade`De `.rela.rodata`恢复出五项跳转表, objectif:`0x91, 0x88, 0x7f, 0x76, 0x76`
- Il n'y a pas de rétablissement.`-O0`Je suis là .`grade`Il y a trois blocs et un résolu
- `-O1`et `-O2`Je suis là .`grade`          `[1, 2, 3, 4, 4]`, pas de saut en direct
- `-O2`Je suis là .`grade_label`通过五重定位读取对字符串表
- Les données de l'interface sont les mêmes que celles de l'analyse

## Mode de défaillance de l'environnement de production

| 故障 | 较弱工具的报告 | 分析必须证明的内容 |
|---|---|---|
| `.text` 内有数据 | 每个字节都被解码、看似合理的清单 | 递归下降未认定任何数据字节为指令，且跳转目标是指令起点 |
| 最后一次返回之后的填充 | 函数末尾有一条 `nopw` | 这些字节从入口不可达 |
| 通过表的间接跳转 | “jmp rax”和四个死块 | 表地址来自 `lea` 重定位，条目数来自边界检查，目标来自 `.rela.rodata` |
| switch 变成值表 | “带重定位的跳转表” | 从 `.rodata+0x14` 进行 `movl` 加载，三个块，没有间接转移 |
| 位移为零的调用 | `callq 0x113`，即下一条指令 | `R_X86_64_PLT32 grade-0x4` 解析为 `0x30` |
| 解码器猜测未知操作码 | 看起来正确的助记符 | 带地址的 `DecodeError`，扫描记录该字节 |
| 指令超过 15 字节 | 一条很长的“指令” | 游标在读取第 16 字节之前抛出异常 |
| 分支进入指令中间 | 两份重叠的清单 | 包含两个地址的冲突记录 |
| 循环被报告为直线代码 | 伪代码中没有 `while` | 一条目标支配源节点的回边 |
| 参考输出来自不同编译器 | 测试在过时文本上通过 | 样例 README 标明精确的编译器和命令 |

## 操作准则

En référence au détecteur de code de contrôle, à partir du flux de contrôle de l'entrée connue, chaque élément sera défini comme un code de contrôle de remplissage, de données ou de contenu inaccessible.

## 延伸阅读

- [Intel 64 and IA-32 Architectures Software Developer's Manual，第 2 卷第 2 章：指令格式](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [AMD64 Architecture Programmer's Manual 第 3 卷第 1 章：指令编码](https://docs.amd.com/v/u/en-US/24594_3.38_APM_Vol3_PUB)
- [System V Application Binary Interface，AMD64 Architecture Processor Supplement，表 4.9：重定位类型](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Schwarz、Debray、Andrews，《Disassembly of Executable Code Revisited》（WCRE 2002）](https://www2.cs.arizona.edu/~debray/Publications/disasm.pdf)
- [Andriesse 等，《An In-Depth Analysis of Disassembly on Full-Scale x86/x64 Binaries》（USENIX Security 2016）](https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/andriesse)
- [Allen，《Control Flow Analysis》（1970）](https://doi.org/10.1145/800028.808479)
- [Cooper、Harvey、Kennedy，《A Simple, Fast Dominance Algorithm》（2001）](https://www.cs.tufts.edu/~nr/cs257/archive/keith-cooper/dom14.pdf)
- [Lengauer、Tarjan，《A fast algorithm for finding dominators in a flowgraph》（1979）](https://doi.org/10.1145/357062.357071)
- [Capstone 6.0.0-Alpha10 发布说明](https://github.com/capstone-engine/capstone/releases/tag/6.0.0-Alpha10)
- 本课描述的 rea 6.5.0 源码位于标签 `3b79af2`- Le numéro de la liste:`README.md`- Je suis là.`docs/ghidra-provider.md`- Je suis là.`docs/ghidra-dos.md`- Je suis là.`docs/reverse-engineering-tools.md`- Je suis là.`bridge/ghidra/ReaGhidraBridge.java`- Je suis là.`src/contracts/officialToolContracts.ts`- Je suis là.`src/ghidra/GhidraAnalysisProfile.ts`Il y a une autre.
