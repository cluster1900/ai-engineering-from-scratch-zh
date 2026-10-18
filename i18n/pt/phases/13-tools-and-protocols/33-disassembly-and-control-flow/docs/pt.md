# Controlo de dados e fluxos de controle: de um código a um gráfico de dados verificáveis

> Ants汇编单 é uma instrução que diz quais são os caracteres; 本课将构建解码器和图,检查这一断言.

**Type:** Build
**Languages:** Python, C, x86-64 assembly
**Prerequisites:** Phase 13 · 32（从零构建 ELF）
**Time:** ~150 分钟

## Objectivo de aprendizagem

- De acordo com as regras do MDS Intel, Volume 2, capítulo 2, o livro de leitura de código 测试样例中的 x86-64 指令子集──
- Para cada exemplo, cada instrução relativa a produtos de construção,`llvm-objdump -d`"Ao fim de um ano, não há nada que me diga".
- Para os mesmos caracteres de execução, a análise linear e a descida de regresso, e a explicação de cada um dos seus pontos de erro.
- Dividir as instruções em blocos básicos, construindo com o tipo de controle do fluxo de bordo.
- Utilizando o algoritmo de Cooper, Harvey e Kennedy, calcular o controle direto dos pontos, e através do retorno, procurar o ciclo.
- A partir do ponto de vista da redefinição do arquivo de salto retomada de um objetivo de salto indirecto.

## 问题

- Não .`-O0`编译了                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `ledger.c`E depois pergunta a um agente:`grade`Fazer o quê?Agente 调用反汇编器、读取清单, responder que a função é objetiva e não conhecida `jmpq *%rax`Depois, escreveu um falso código.`return 0`- Não.

- Não .`llvm-objdump -d` Abre o mesmo arquivo-alvo, veja o salto e depois há quatro blocos, separadamente armazenados 4、3、2、1── eles estão sempre na lista.

清单只回答一个问题:哪些字节构成哪条指令――它不会说明哪些命令会执行、以什么顺序执行、从哪里开始执行――要回答这些问题,还需要三种结构:控制流能到达的字节、基本块,以及块之间的边──

rea 6.5.0  não tem seu próprio controlador de dados. Se quiser analisar em profundidade, seu README  requer que você forneça Ghidra、Hopper ou IDA、 quando estiver offline, a rea também pode utilizar o GNU objdump ou Rizin que você instalou. Seu uso vai parar para fins não resolvidos:  O usuário/ utilizador só contém funções resolvidas.

```figure
re-33-sweep-vs-descent
```

## Cada parágrafo do formato instrucional tem regras de resposta

O Intel SDM II 卷图 2-1  dá a ordem de caracteres de cada instrução. Primeiro é um previamente selecionável, depois é um a três caracteres de operação, depois é um ModRM 字节 selecionável e um SIB 字节 selecionável. Depois é um 0 、1 、2 ou 4 字节 de local, depois é um número imediato de 0 、1 、2 ou 4 字节.

Cada parágrafo decide o significado do seguinte parágrafo. Portanto, o decodificador é uma série de pequenas decisões, atrás de cada decisão, tudo pode ser encontrado no manual.

### O que é que é isso?

O MDS 2.1.1 列出了传统前──第 1 组包含 `F0`tranca e refaz-se`F2`- Não.`F3` 2 组包含六种段覆盖`2E`Sim `%cs`O que é o problema?`66`, ou seja, operação número grande cobertura.`67`, é o nome do local.

Manual diz que cada grupo pode usar um anterior, mas o compilador irá gerar mais.`ledger-x86_64-O0.o`- Não .`0xf2`É um bom momento.`66 66 66 66 66 2e 0f 1f 84 00 00 00 00 00`, continuam a aparecer cinco .`66`- Não.`llvm-objdump`A imprimir`nopw %cs:(%rax,%rax)`, você construiu um decodificador também.

`66`Há também um segundo papel. Para a instrução da SSE, é a opção de optar por um código de operação, portanto,`66 0f ef c0`Sim `pxor %xmm0, %xmm0`E não é o que é 16?`F3 0f 6f`Sim `movdqu` O descifrador primeiro procura a combinação de um primeiro e um segundo código operacional.`66`才表示 16 位操作数──

### REX  aumentar quatro lugares, e deve ser operado de forma mais rápida

MDS 2.2.1 definirá REX  `40`Até`4F`之间的一个字节,格式为 `0100WRXB`- Não.`W`选择 64 位操作数──`R`扩展 ModRM 的 reg 字段──`X`扩展 índice do SIB 字段。`B`扩展 ModRM's r/m 字段、SIB's base 字段或操作码字节中的寄存器(表 2-4)。REX 必须紧接在操作码或转义字节之前; se REX 后面遵循传统前, será ignorado。

Em`48 89 e5`É um bom dia.`48`Está configurado.`W`O código de operação.`89`Sim `MOV r/m, r`, ModRM `e5`选择将  escolher  escolher`%rsp`移入 `%rbp`O REX desaparece, o resto é o mesmo.`movl %esp, %ebp`- Não.

REX também mudará o nome do arquivo. Se houver qualquer REX, o código 4 a 7 será escolhido.`%spl`- Não.`%bpl`- Não.`%sil`- Não.`%dil`- Não .`%ah`- Não.`%ch`- Não.`%dh`- Não.`%bh`                                                                                                                                                                                                                                                              

### 操作码分布在两张映射表中

单字节操作码最常见──`0F`转义到双字节映射表, e `0F 38`Ou `0F 3A`转义到样例从未使用的三字节映射表(SDM 2.1.2)──有些操作码将 ModRM 字段用作额外的三字节映射表,手册中写作 `/digit`- Não.`83 /7`É o número 8 de um número imediato.`cmp`- Não .`83 /5`Sim `sub`- Não .`FF /4`É intermédio.`jmp`- Não.

`code/main.py`O Central de Descifrador abrange quatro exemplos de código de operação no arquivo objetivo e uma pequena quantidade de código de operação comparável.`mov`- Não.`lea`- Não.`movslq`- Não.`movzbl`- Não.`imul`、移位、`test`和 `idiv`, bem como `push`- Não.`pop`- Não.`call`- Não.`ret`、十六种条件跳转、多字节 `nop`E os outros cinco códigos de operação são lançados com os seus endereços e causas.`DecodeError` Guess the decoder is worse than stop working 

### ModRM 和 SIB 选择操作数

MDS 2.1.3 irá dividir o MDRM`mod`(Bíblio 7:6)`reg`(5:3) e `r/m`(2:0):`mod = 11`Expressão r/m 是寄存器──`mod = 00`- Não.`01`- Não.`10`分别表示无位移、8位位移或32位位位移的内存寻址──`r/m = 100`Expressão de trás segue um SIB 字节──SIB 分为 `scale`(7:6)`index`(5:3) e `base`(2:0);índice 为 `100`Indica não há nenhuma referência寄存器──

No quadro 2-2, existem duas regras especiais no modelo de 64 pontos.`mod = 00`且 `r/m = 101`Não é .`(%rbp)`Em vez disso, em relação a 32 pontos de deslocamento da seguinte instrução (SDM 2.2.1.6):`mod = 00`且 SIB base 为 `101`,则表示没有基址寄存器的32位位位移──

É`-O0`- Não .`grade`Em meio`8d 44 08 fa`Por exemplo, código de operação.`8D`Sim `lea` ModRM `44`Sim `01 000 100`8 位位移、reg 为 `%eax`, posteriormente seguindo SIB.`08`Sim `00 001 000`:缩放因子 1 索引 `%rcx`、基址 `%rax`△位移字节 `fa`É -6―AT&T 文本为 `leal -0x6(%rax,%rcx), %eax`, calculado é o indicador de interruptor`score / 10 - 6`- Não.

### 位移是链接器写入的位置

`48 8d 0d 00 00 00 00`Sim `leaq (%rip), %rcx`◊ Quatro caracteres são RIP em relação ao número de operações.`.rela.text`- Não .`0x69`É um artigo escrito em`R_X86_64_PC32.rodata-0x4`◊psABI表 4.9) `R_X86_64_PC32` definição `S + A - P`O número de dados que são dados no código de acesso é:

O processador vai adicionar esse segmento ao endereço da instrução seguinte, portanto, o objetivo final é:`S + A + (end - P)`❖ Para esta artigo `lea`,该字段占最后四字节,所以 `end - P`Por quatro, o objectivo é:`.rodata + (-4) + 4 =.rodata + 0x0` adição de -4  previamente compensado este quatro parágrafos  cada RIP em um exemplo em relação ao número de operações estão em adição de -4, portanto `-O1`de `lea`A primeira`.rodata+0x10`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `.rodata+0x14`- Não.

解码器记录每条命令内部位移字段的偏移──`resolve_reference()`Em Reposition Table, procure esta desviada, e relate que a operação seguinte do link irá indicar para onde.`leaq (%rip), %rcx`Transformou-se em um lugar.`.rodata+0x0`De um show.

### Numero imediato máximo de 32 lugares, apenas uma exceção

O MDS 2.2.1.5 prevê que, no modelo de 64 pontos, o número imediato permaneça máximo de 32 pontos, e que se realize um aumento de números.`MOV r64, imm64`(带 `REX.W`de `B8+r`),AT&T 语法称之为 `movabsq`◊ Para operações de cálculo, o decodificador será 8 bits imediato`83 c1 fa`Sim `addl $-0x6, %ecx`); para o movitímetro e o pesquisar de pesquisa,`pshufd $0xee`O que é o problema?`llvm-objdump`De saída de acordo.

Quase tudo.`push`和 `pop`默认使用 64 位操作数并忽略 `66`(SDM 2.2.1.7)  Portanto, os sistemas de desciframento não precisam de ser utilizados, pois serão nomeados `pushq`- Não.`popq`- Não.`callq`和 `retq`- Não.

## Manual de instruções

Antes de escrever, primeiro escrevo.`grade`Em meio`48 69 c0 67 66 66 66`- Não.

1. `48`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `40`Até`4F`之间, portanto é `W = 1`O número de operações é de 64 bits.
2. `69`Sim `IMUL r, r/m, imm32`- Não.
3. `c0`É ModRM `11 000 000`:寄存器形式, reg 为 `%rax`, r/m 为 `%rax`- Não.
4. Os quatro caracteres são pequenos.`0x66666667`- Não.
5. AT&T 顺序为立即数、源、目标:`imulq $0x66666667, %rax, %rax`- Não.

总计七字节,`llvm-objdump`O texto impresso é completamente o mesmo. Este número constante é um número inverso, deixe o clang pode ser usado através de multiplicado e subsequente.`sarq $0x22`(right move 34 位) realização de um substituto em 10 〜 34 课也会遇到这个对操作,届时升机将将将其恢复为 `score / 10`- Não.

- Não .`Decoder.decode()`- Não.`_State.modrm()`和 `_State.finish()`Em seguida, ele vai executar esta sequência de leitura, e vai levantar cada um dos seus ramos com seus arquivos caracterizados em seu código SDM.

## 线性扫描

Schwarz、Debray 和 Andrews 在Dissassembly of Executable Code Revisited(WCRE 2002) § 3.1 节 descreve a varredura linear: desde o primeiro parágrafo do código, começando, descode uma instrução, novamente desde o outro parágrafo, continuando até o final.`objdump`如此工作,`llvm-objdump`É assim também.

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

Este método tem um padrão de falha, o artigo Fig. 1 mostra que o código de dados é decifrado para instruções, em seguida, o decodificador temporariamente passa a fronteira de instruções reais. Em x86, o decodificador geralmente se re-sincroniza em alguns bits, o que torna o erro difícil de perceber.

O espião é também um determinante de referência deste curso.`llvm-objdump -d`Uma致,而 `llvm-objdump`O texto da captura está localizado em`code/fixtures/*.objdump.txt`△测试将每一行解析为地址、字节和文本, deleted `#`后的注释,再进行比较──四个目标文件分别包含 86、56、84 和 11 条条指令,总计 237 条,解码器全部匹配──

## 递归下降

Para o salto direto, do objetivo continuar; para o condicionamento, do objetivo e da seguinte instrução continuar; para o uso, do seguinte continuar, porque o utilizador retornará; para o retorno, para parar; para o mantenimento já visitado endereço conjunto, assegurar que o uso possa terminar.

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

O modelo de falha deste método é bem oposto. Em alguns casos, os caracteres do salto indirecto não têm um objetivo, o processo termina aqui, todos os blocos que só podem atravessar o salto até chegar ainda não são conhecidos.`main.py`O regresso e descida do meio registram esta situação como conflito e paragem do caminho, deixando a sobreposição manifestar-se, em vez de silenciosamente resolver o código duas vezes.

Andriesse  et al. avaliaram nove documentos de forma dupla gerados por 981 compiladores.`grade`O salto é muito comum.

## Um erro de digitalização linear, regresso e descida exemplo de verdade

`code/fixtures/sweep-trap.s`É um texto de 24 caracteres, contendo um quadro de 4 caracteres.`movzbl (%rcx,%rax), %eax`- Não, não. - Não, não.

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

Utilização `clang -target x86_64-unknown-linux-gnu -c sweep-trap.s`Construí-lo. Quatro caracteres foram selecionados, podendo ser decodificados em instruções razoáveis.`31 c0`Sim `xorl %eax, %eax`- Não .`90`Sim `nop`- Não.`48`É o REX anterior, portanto, a digitalização linear será comparada com a real.`addl $1, %eax`O que é o "Tri-Pins"`addq $0x1, %rax`❖ Capturado `llvm-objdump`O que é que é:

```text
       e: eb 04                        	jmp	0x14 <lookup+0x14>
      10: 31 c0                        	xorl	%eax, %eax
      12: 90                           	nop
      13: 48 83 c0 01                  	addq	$0x1, %rax
      17: c3                           	retq
```

Esta lista não parece estar em perigo: cada um dos caracteres é decodificado, cada um dos caracteres é real, e há mais.`retq`Mas o que é errado?`0xe`O objectivo do salto é:`0x14`Não há nenhuma instrução na lista.`0x14`Começamos a ver.`0x14` Execução é 32 位 `addl`O número de páginas foi de 64 páginas.`addq`◊ Quatro caracteres também são mostrados como código.

De`lookup`O código de descida é de 6 instruções, em seguida, o código de descida é de 6 instruções.`0x14`, relatório `addl $0x1, %eax`Não há quatro letras.`plus_one`Qualquer um dos oito preenchimentos de prefácio é um instrução definida.`main.py`Em meio`trap_report()`打印比较结果:

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

测试 `test_sweep_and_objdump_share_the_same_mistake`- Não.`llvm-objdump`Em`0x13`- Imprimir .`addq $0x1, %rax`O determinador de referência é uma análise linear, também herdou seu ponto de cego.

## 基本块

Allen em Control Flow Analysis (1970) define o bloco básico: um segmento só pode entrar da primeira instrução, ou sair da última instrução.

O processo de construção para executar duas vezes a ordem de instruções resolvidas por endereço. Primeiro, a primeira vez a coleta de instruções: entrada, divisão ou salto. Objetivo, objetivo, e qualquer instrução após o controle.

```python
for instruction in self.instructions:
    if instruction.address in leaders or current is None or current.end != instruction.address:
        current = Block(instruction.address, [])
        self.blocks[instruction.address] = current
    current.instructions.append(instruction)
```

边由每个块的最后条命令决定──回归没有后继;跳转一个,标记为 `jump`• condições de pagamento têm dois,`taken`和 `fallthrough`                                                                                                                                                                                                                                                              `table`Se não tiver um objectivo, será o bloco de inscrição.`unresolved`- Não.

A mesma análise também produziu dois outros fatos.`-O0`- Não .`grade`A análise de dados pode gerar cinco pontos. Se o local de partida de um bloco estiver em outro modo, é a situação de sobreposição no exemplo de um bloco.

## total de controle

`-O1`Baixo`total`Há 31 instruções:

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

O primeiro comando é:`0x40`(entrada)`0x44`(`jle`之后) 、`0x50`(`jne`(Objetivo)`0x5b`(`jne`之后) 和 `0x5c`(`jle`dos objetivos) ❖五块、五条边:

| 起点 | 终点 | 类型 | 原因 |
|---|---|---|---|
| `0x40` | `0x44` | fallthrough | `jle` 未跳转，计数为正 |
| `0x40` | `0x5c` | taken | 计数为零或负数，返回 0 |
| `0x44` | `0x50` | fallthrough | `nopw` 是块内的对齐填充，执行会经过它 |
| `0x50` | `0x50` | taken | `jne 0x50`，即循环 |
| `0x50` | `0x5b` | fallthrough | 循环退出，返回总和 |

`0x4a`处的六字节  处的六字节  处的六字节 `nopw`É um preenchimento, deixe-me.`0x50`O ciclo está localizado em 16 bits de limite.`0x44`                                                                                                                                                                                                                                                              `retq`Depois,`0x5f`处的单字节  处的单字节 `nop`Também é um preenchimento, mas não há caminho para chegar lá.`unreachable()`Vai sair.

Em`-O2`A mesma função tem 140 caracteres e dois ciclos.`0x80`处的SSE2 循环体通过 `paddd`Cada rodada adiciona oito valores, o valor restante é`0xc0`Tratamento: CFG`0x80 -> 0x80`和 `0xc0 -> 0xc0`, test sujets inspeccionou estes dois lados.

## Utilize o algoritmo de cálculo

Se de entrada para bloco`b`Cada caminho passa por um bloco.`d`,则称 `d`支配 `b`- Não.`b`O que é que é?`b`de controle em relação ao ponto de partida`b`Recent One. This concept through Allen(1970) can be traced to Prosser(1959), no 34 课正是依赖于这种结构正确放置`if`和 `while`- Não.

Cooper, Harvey e Kennedy escreveram um algoritmo de dominação simples e rápido (2001): eles acreditam que, adotando um algoritmo de fluxo de dados que funciona de forma oposta, em aproximadamente 1000 pontos abaixo do gráfico de Lengauer-Tarjan (1979): o seu objetivo não é propor um novo algoritmo, mas explicar que o simples algoritmo também pode vencer na prática, e é adequado para a aprendizagem.

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

`number`保存每个块在逆后序中的位置, entrada é 0──`intersect`Usar dois pontos ao longo do atual domínio de árvore para cima, até encontrar-se.`<`进行比较──本代码使用逆后序号,因此比较符是 `>`O resto segue o falso código do artigo.

Para o`-O1`Baixo`total`O resultado é:`idom(0x44) = 0x40`- Não.`idom(0x50) = 0x44`- Não.`idom(0x5b) = 0x50`和 `idom(0x5c) = 0x40`- Não.`0x50 -> 0x50`É o que acontece quando o objetivo é atingir o ponto de partida.`back_edges()`返回这条边──测试 `test_dominators_on_a_hand_built_diamond_with_a_loop`Em 16 caracteres de um conjunto de pontos de exchange, executar o mesmo código, deixe`intersect`Tratar dois primeiros.

## - 0 Baixo grau - 0

Em`-O0`Baixo, clang vai`grade`Em meio`switch`编译为位置无关跳转表的常用形式:

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

Vou ler-o em quatro fatos.`subl $0x4`Depois de tudo .`ja`É um check-up de fronteira: maior que 4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  `0x9a`O que é que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é.`leaq`Vai mostrar o seu endereço`%rcx`, 上一节已经说明该地址为 `.rodata+0x0`- Não.`movslq`以 4 para enfraquecer um elemento carregando um símbolo 32 位条目.`addq`Adicionalmente, cada elemento é a distância entre o bloco do caso e o objeto.

目標文件中的每表字节都是零. 目標只有以.`.rela.rodata`Há uma forma de re-locação:

```text
RELOCATION RECORDS FOR [.rodata]:
OFFSET           TYPE                     VALUE
0000000000000000 R_X86_64_PC32            .text+0x91
0000000000000004 R_X86_64_PC32            .text+0x8c
0000000000000008 R_X86_64_PC32            .text+0x87
000000000000000c R_X86_64_PC32            .text+0x82
0000000000000010 R_X86_64_PC32            .text+0x86
```

Para a deslocação`4k`- Não .`k`项应用 `S + A - P` Valor de armazenamento`.text + A - (.rodata + 4k)`, code re-add up `.rodata + 0`O objetivo é...`.text + A - 4k`△第 0 项是 `0x91 - 0 = 0x91`, 1o 项是`0x8c - 4 = 0x88`, 2o 项是`0x87 - 8 = 0x7f`△ △ 3 △ 4 项分别是 `0x82 - 12 = 0x76`和 `0x86 - 16 = 0x76`- Não.`score / 10`O caso 6、7、8、9、10 分别到达存储 1、2、3、4、4块── isto é, com o código-fonte C 源行逐行对应, incluindo o caso 9 和 10 共享──

`recover_table()` Execução destas contas.`jump_table_resolver()`De`jmpq`Para posterior correspondência de forma habitual, encontrar a gerar o valor do`addq`Carrega-o.`movslq`、 gerar o seu site `leaq`, bem como a execução de inspecções de fronteira.`ja` Regression down subsequentemente vai ter quatro objetivos diferentes para o processamento do conjunto e continuar.`evidence`记录生成目标所用的路径──

Aqui está:`-O0`- Não .`grade`Os dados são de`python3 code/main.py cfg code/fixtures/ledger-x86_64-O0.o grade`- Não .

| 方法 | 指令数 | 块数 | 边数 | 字节 | 问题 |
|---|---|---|---|---|---|
| 线性扫描 | 34 | 9 | 7 | 118 代码 + 10 填充 | 5 个不可达块，没有进入四个 case 块的边，填充被解码为 `nopw` |
| 递归下降 | 25 | 3 | 2 | 82 代码 | 36 个代码字节从未到达，`0x74` 处的 `jmpq *%rax` 未解析 |
| 带表的递归下降 | 33 | 8 | 11 | 118 代码 | 无 |

Depois da recuperação, o arco está completo.`idom`É um bloco de mudança.`0x62`- Não.`0xa1`de `idom`É entrada.`0x30`Porque é que eu sou .`0x9a`O caminho não precisa de passagem.`0x62`É assim que eu consigo chegar.`0xa1`- Não.

## O que é que fazemos com a nota?

Você pode ter visto uma descrição assim:`grade`É uma composição de um switch de salto de dia.`-O1`和 `-O2`- Não.`grade`Não há nada de errado.

```text
      2c: 83 f9 04                     	cmpl	$0x4, %ecx
      2f: 77 0c                        	ja	0x3d <grade+0x2d>
      31: 89 c8                        	movl	%ecx, %eax
      33: 48 8d 0d 00 00 00 00         	leaq	(%rip), %rcx
		0000000000000036:  R_X86_64_PC32	.rodata+0x10
      3a: 8b 04 81                     	movl	(%rcx,%rax,4), %eax
      3d: c3                           	retq
```

重定位加数 `0x10`Mais do que o normal, 4 recebem o seu nome.`.rodata+0x14`O carregamento é simples.`movl`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,`01 00 00 00 02 00 00 00 03 00 00 00 04 00 00 00 04 00 00 00`◊ Compilador usado contém cinco valores de retorno de um bloco de cinco casos ◊ Aqui há um re-localização ◊ Há um bloco de controle de limites, mas o fluxo de controle é apenas três blocos ◊ Três margens e um condição de divisão ◊`find_value_tables()`O seu relatório foi`value-table`,条目为`[1, 2, 3, 4, 4]`, e não tem .`evidence: "bytes"`- Não.

`-O2`Baixo`grade_label`Mais adiante: contém cinco caracteres de indicadores.`labels`Num grupo, transformando-se em localizações.`.rodata+0x0`、 contém cinco tabelas de 32 pontos de desvio.`R_X86_64_PC32`重定位, função将表地址加到所加载的条目上──`recover_table()`读取这五重定位, volta para trás `.rodata.str1.1`Centro de deslocamento`0, 2, 4, 6, 8`, eles se separam .`F`- Não.`D`- Não.`C`- Não.`B`- Não.`A` recuperar o mesmo conjunto de cálculos de balanço também pode recuperar relativamente à tabular de dados, pois os dois são conhecidos por um desvio de pontos.`S + A - P`- Não.

Os dois edições de construção trazem a seguinte lição:

## Rea 和 Ghidra está aqui para oferecer

rea 6.5.0 配合 Ghidra 12.1.4 fornecedor,将 `procedure_assembly`Lista de uma função como um símbolo de um símbolo.`inspect_native_instruction`返回单条命令的字节、长度、解码文本、操作数代币、带类型引用和控制流, em que retornar a operação baseada em p-code 分类──`xrefs`返回 Ghidra 的 `ReferenceManager.getReferencesTo`O que é que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é.`analyze_function`包含函数的CFG 和 `body`- Não.`procedure_info`A função representa um espaço de endereço em ambos os lados, e lembra-se que não pode ser visto como um endereço de função em que o espaço e o endereço são compartilhados.

Estes fatos são a forma de sequenciação da Ghidra e a redução e descida do resultado do analisador.`instruction_flow_evidence`- Não.`function_references`和 `jump_table_evidence`Por isso, os resultados marcarão a sua regra, mas não podem demonstrar o processo de indução. Quando Ghidra não chega ao dia, o controle é desconhecido.

Agora, já tens um processo de orientação.`python3 code/main.py cfg`, a partir do bloco de início, o número de bordas e o endereço de recuperação do formulário e do provedor de retorno do conteúdo.

Reconsiderar o nível de segurança do programa: Capstone 6.0.0-Alpha10(2026-07-21) Modificou CVE-2026-55893 和 CVE-2026-55894 涉及的越界读写,5.0.9(2026-05-28)`_Cursor.byte()`O código de operação desconhecido está protegido.`main.py`, evitando o tratamento de entrada que exceda o seu alcance de design.

## 动手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow
python3 code/main.py
```

Output é um relatório JSON. Ele dá para cada exemplo de objetivo de arquivo a compatibilidade com o determinante de referência; para cada função é dado o número de instruções, blocos e números de margens sob três métodos. Ele também lista blocos inacessíveis, não resolvidos, saltos indiretos, retornos, pontos de controle direto e todos os quadros, finalmente, dá uma comparação de exemplos de armadilhas.

预期 estrutura:

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

按以下顺序阅读 `code/main.py`- Não .

1. `ElfObject`读取节头、符号和 `.rela.*`条目,`symbolize()`按 `llvm-objdump`É o nome do local.
2. `Decoder.decode()`读取前和REX, em seguida, segundo um único ou dois caracteres
3. `_State.modrm()`读取 ModRM、SIB 和位移,并记录位移字段的偏移──
4. `resolve_reference()`Aplicação de reubicação em segmentos digitais em movimento ou imediato`S + A - P`- Não.
5. `linear_sweep()`和 `recursive_descent()`É uma das duas formas de falhar o seu registro.
6. `recover_table()`和 `jump_table_resolver()`通過重定位或字节读取表──
7. `ControlFlowGraph`Construção de ordens, blocos e tipos de bordas,`dominators()`Realizar o algoritmo.
8. `analyze_function()`Para uma função operar todos os métodos,`compare_with_oracle()`- Não. - Não.

Há duas ordens.`python3 code/main.py disasm FILE.o`Imprimir o mapa e mostrar o objetivo em cada instrução de re-localização.`python3 code/main.py cfg FILE.o FUNCTION`打印单个函数的分析――

## 实际使用

Para novos documentos de objetivos, em seguida, use três métodos:

1. Antes de operar, consulte o seu aplicativo.`llvm-objdump`Não coincide, há um bug, depois todas as estruturas vão herdar-se.
2. De cada símbolo funcional começa a funcionar, regressa e desce,并阅读 `unresolved` Todos os itens são os que ainda não conseguiram o seu objetivo.
3. Para cada salto não resolvido, procura a forma habitual do gráfico e a posição de re-ubicação do gráfico.
4. 字节比线性扫描与递归下降―― apenas os caracteres do comando são preenchidos ou dados; ambos são não reconhecidos como não-códados, ou pertencem a funções que você ainda não encontrou―
5. Usando o resultado de regresso e descida do programa de recuperação, construímos o CFG, e vemos o lado de volta.`while`Ou `for`- Não.

Para manter o documento de referência e o documento de destino em conjunto, quando se muda para a nova versão do compilador, recapturá-los, pois a mudança de lista significa que o exemplo também mudou.

## 交互实验

### Experimento A: Primeiro, desbloqueio no papel, reexame

Em`code`Agora abro Python:

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

Cada vez que você faz isso, você deve escrever o resultado.`48`, observar a operação grande variação.`decode(bytes.fromhex("0f 0a"), 0)`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,`DecodeError`- Não.

### 实验 B:lea 上的重定位

```python
elf = load_fixture("ledger-x86_64-O0.o")
code = elf.section(".text").data
lea = decode(code, 0x66)
lea.displacement_offset
resolve_reference(elf, lea)
```

引用结果是 `.rodata+0x0`△将地址改成 `grade_label`Em meio`0x116`, 读取指向 `.data`O que é que eu disse?`0x10e`- Não .`callq`E resolveu-o.`R_X86_64_PLT32 grade-0x4`, finalidade final do`0x30`- Não , não .`grade`- Não.

### 实验 C: observar duas formas de diferença

```python
trap = load_fixture("sweep-trap.o")
text = trap.section(".text").data
[i.text for i in linear_sweep(text, 0, 0x20).instructions]
[i.text for i in recursive_descent(text, [0], 0x20).sorted_instructions()]
```

统计                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `0x13`Começa aquela linha.`sweep-trap.s`O último parágrafo do texto`0x48`改为 `0xe8`, reconstruir, operar novamente dois métodos.`addl`和 `retq`吞进一条目标位于节外的 `callq`A função parece não ter voltado.

### 实验 D: 手算支配节点

```python
analysis = analyze_function(load_fixture("ledger-x86_64-O1.o"), "total")
analysis.cfg.edges
analysis.cfg.reverse_postorder()
analysis.cfg.dominators()
analysis.cfg.back_edges()
```

Em papel desenhar cinco blocos, primeiro calcular o controle do ponto, depois ver o resultado.`-O0`Baixo`grade`- Não, não. - Não, não.`idom(0xa1)`Sim `0x30`Não é?`0x62`- Não.

## 实践实验

Para exemplo, adicionar um ponto de manipulação indirecto,并扩展分析──

要求:

-  redactar uma função C, através de um índice de função selecionado entre os pequenos números 调用函数──分别用 `-O0`和 `-O1`Construir, dar os objetivos e os documentos `llvm-objdump`文本一起提交──
- 让解码器在两个目标文件上都与参考结果一致. 只有当例中的命令需要时才添加操作码. 只有当例中的命令需要时才添加操作码.
- 扩展 `recursive_descent()`, Deixe o intervalo de conversação será o intervalo de conversação de conversação`calls`, objectivo`None`, em seguida, continuar a executar.
- 编写解析器,通过重定位读取函数指针数组并报告可能的被调用者──
- Será convocado para o grupo de usuários`indirectCalls`Adicionado ao relatório de função, e para cada objetivo fornecer tipo de prova.
- 编写测试, fazer o resolvedor retornar não-função símbolo de meta 时测试失败。

O sucesso é:`python3 code/main.py cfg`能列出每可能被调用者及证明其重定位, e todos os documentos-alvo ainda são passados por referência对照.

## 本课产物

本课包含 `outputs/skill-disassembly-and-control-flow.md` Usá-lo para transformar os documentos e nomes de funções alvos em lista de revisão, blocos básicos, com tipos de bordes, nodos de controle, bem como todos os transferências de controle não resolvidos.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow
python3 code/main.py
python3 code/tests/test_main.py
```

验证应证明:

- O descifrador em quatro exemplos de objetivos dos arquivos de 237 instruções`llvm-objdump -d`Uma linha
- REX.W 选择 64 位操作数,REX.R 和 REX.B 扩展寄存器字段
- ModRM e SIB apresentam verdadeiramente os números de operação de memória AT&T, incluindo o factor de encolhimento, índice e um símbolo de movimento
- RIP relativa à deslocação será conectado com o seu segmento de deslocação dentro da ordem
- 重复 传统前和段覆盖的解码结果与参考结果一致
- 强制 `66`Antes de escolher o código de operação, fazer o depositário manter 32 lugares
- 8 números instantâneos para fazer extensão de símbolos em cálculo, para transferência de números para números sem símbolos
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `DecodeError`
- `lea`A primeira`R_X86_64_PC32`Resolver para a hora`call`A primeira`R_X86_64_PLT32`解析为被调用者
- O programa de análise de dados será codificado e o objetivo de transmissão será desligado sem instruções.
- 递归下降从不将表或填充认定为指令, e em destino 读取`addl $0x1, %eax`
- `llvm-objdump`Cometeu o mesmo erro que a digitação.
- A entrada de instruções interna é registrada como conflito .
- Não resolvido Jump-in stop regression descending, não foi listado
- `-O1`Baixo`total`Há cinco blocos, cinco tipos de bordas, uma linha de bordas, e um ponto de controle direto de espera.
- Manual de construção de rodovias de forma a produzir algoritmos definidos de controle
- `-O2`Baixo`total`Há dois ciclos .
- `-O0`Baixo`grade`De`.rela.rodata`恢复出五项跳转表, objectivo `0x91, 0x88, 0x7f, 0x76, 0x76`
- Não se recuperou.`-O0`Baixo`grade`Há três blocos e um não resolvido
- `-O1`和 `-O2`Baixo`grade`É valor `[1, 2, 3, 4, 4]`Não há salto direto .
- `-O2`Baixo`grade_label`通过五重定位读取相对字符串表
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

## O ambiente de produção é um problema

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

Em referência ao determinador, o código de verificação será verificado a partir de entrada conhecida através do fluxo de controle, para que cada código seja verificado, preenchido, dados ou conteúdo inacessível.

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
- 本课描述的 rea 6.5.0 源码位于标签 `3b79af2`- Não .`README.md`- Não.`docs/ghidra-provider.md`- Não.`docs/ghidra-dos.md`- Não.`docs/reverse-engineering-tools.md`- Não.`bridge/ghidra/ReaGhidraBridge.java`- Não.`src/contracts/officialToolContracts.ts`- Não.`src/ghidra/GhidraAnalysisProfile.ts`- Não.
