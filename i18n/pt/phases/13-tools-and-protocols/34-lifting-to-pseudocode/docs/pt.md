# 提升为伪代码: de zero construir IR、SSA e estruturar

> A saída do anticomprador é um conjunto de afirmações ocultas do processo de introdução. Após o processo de construção do processo de introdução, cada linha da saída se torna objeto verificável.

**Type:** Build
**Languages:** Python, C
**Prerequisites:** Phase 13 · 32（从零理解 ELF）、Phase 13 · 33（反汇编与控制流）
**Time:** ~150 分钟

## Objectivo de aprendizagem

- A partir de 1 de janeiro de 2016, o sistema de correção de dados (SCR) será criado para a rede de correção de dados (SCR) e para a rede de correção de dados (SCR).
- Para transformar o espaço em variação local, o Sistema V 参数寄存器 槽位转换为形参──
- Em um limite de controle, coloque a função phi, construindo o mínimo SSA (forma de atribuição de valores), e então substitua-la, simplifica-la e elimina-la.
- Utilizando o controle de pontos e de volta, recuperando-se do controle de fluxo`if`- Não.`else`de `if`- Não.`while`和 `do while`- Não.
- Vai multiplicá-lo`0x66666667`Explicação para dividir em 10, e prova esta relação constante.
- 逐行阅读同一组函数的字符,指出每处差异背后的指令或猜测──

## 问题所在

Você vai para a rea Plorar`ledger-x86_64-O1.o`- Não .`percent_change`O Ghidra 12.1.4 aproximadamente 10 segundos depois deu uma resposta:

```c
undefined1  [16] percent_change(int param_1,int param_2,ulong param_3)

{
  long lVar1;
  undefined1 auVar2 [16];
  undefined1 auVar3 [16];
  
  if (param_1 != 0) {
    lVar1 = (long)((param_2 - param_1) * 100);
    auVar3._0_8_ = lVar1 / (long)param_1 & 0xffffffff;
    auVar3._8_8_ = lVar1 % (long)param_1 & 0xffffffff;
    return auVar3;
  }
  auVar2._8_8_ = 0;
  auVar2._0_8_ = param_3;
  return auVar2 << 0x40;
}
```

Apenas quatro linhas, recebe duas.`int`值并返回一个  Valor não é o valor`int`Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra ⇒ Ghidra                                                                            

Realizá-lo como um texto`procedure_pseudo_code`O resultado foi de volta, e deu um registro anexo a uma restrição de explicação: 伪代码是Ghidra反编译器的输出,不是原始源码,也不与Hopper 输出文本等价──`compare_functions`工具按文本行对伪代码做差异比较──它自己的维度记录写着汇编是不透明的提供方文,并说明无法进行重定位归结──area 无法透过这些文本,只读取文本的代理也一样──

A rea de DX-Ball  registros mostrou o preço.`FUN_00406400(void)`调用 `__ftol()`◊ instrução visual mostra uma entrada e uma expressão x87.

O curso de construção de um sistema de composição é um processo de orientação oculto.`percent_change`- Não.`grade`和 `total`伪代码与Ghidra的输出并排对照,解释每处差异──测试会使用 clang 编译你的输出,并输入网格上运行它,对应与源码进行──

```figure
lifting-stages-percent-change
```

## 测试样例与参考判例

`code/fixtures/ledger.c`É um exemplo de teste comum nesta parte do curso:

```c
int percent_change(int before, int after) {
    if (before == 0) return 0;
    return (after - before) * 100 / before;
}

int grade(int score) {
    switch (score / 10) {
    case 10:
    case 9: return 4;
    case 8: return 3;
    case 7: return 2;
    case 6: return 1;
    default: return 0;
    }
}

int total(const int *values, int count) {
    int sum = 0;
    for (int i = 0; i < count; i++) sum += values[i];
    return sum;
}
```

文件和目标文件中还包含 `grade_label`O teste de aula é a de três funções acima.

目标文件使用 `clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c ledger.c`构建──旁边还存放用于槽位章节的 `-O0`目標文件──`code/fixtures/README.md`Lista de duas instruções de construção SHA-256 de cada documento-alvo, bem como de gerar Ghidra 测试样例 rea 命令.

O código de referência é:`llvm-objdump -d -r`◊ O texto gerado para dois documentos-alvo foi enviado para `ledger-x86_64-O1.objdump.txt`和 `ledger-x86_64-O0.objdump.txt` Um teste irá analisar estes documentos, e comparar os endereços e os caracteres das instruções com o texto AT&T.`-O1`Todas as 56 instruções, bem como`-O0`Cada instrução é instalada no caminho fixo.`llvm-objdump`, segundo teste vai funcionar no local, fazer uma comparação novamente.

参考工具打印的 `percent_change`Como segue:

```text
0000000000000000 <percent_change>:
       0: 85 ff                        	testl	%edi, %edi
       2: 74 09                        	je	0xd <percent_change+0xd>
       4: 29 fe                        	subl	%edi, %esi
       6: 6b c6 64                     	imull	$0x64, %esi, %eax
       9: 99                           	cltd
       a: f7 ff                        	idivl	%edi
       c: c3                           	retq
       d: 31 c0                        	xorl	%eax, %eax
       f: c3                           	retq
```

## 阶段 1: do字节 até à instrução

Seção 33  Construir um código. Este curso reserva uma pequena cópia, para que o código possa funcionar de forma independente.`ledger.c`Em`-O0`和 `-O1`Quando se encontra com outro código de operação, ele vai ser lançado.`DecodeError`,附带地址和操作码字节──

O sistema de código segue a ordem de comandos do Intel SDM, primeiro é o anterior, depois é o código de operação, ModR/M、SIB、位移量, finalmente é o número imediato.`0x40`Até`0x4F`间一个字节,必须紧邻操作码之前――REX.W 选择 64 位操作数,REX.R 扩展 `reg`字段,REX.X 扩展 SIB 索引,REX.B 扩展 `r/m`Ou SIB 基址──第 2.1.3 节 定义了ModR/M's三个字段 `mod`- Não.`reg`- Não.`r/m`, bem como os três segmentos do SIB`scale`- Não.`index`- Não.`base`❖ Em 64 位模式下,`mod = 00`Com`r/m = 101`Compartilhamento de dados com a seguinte instrução:

| 操作码字节 | 形式 | 测试样例中的示例 |
|---|---|---|
| `01 29 31 39 85 89` | `op Ev, Gv` | `29 fe` `subl %edi, %esi` |
| `03 2b 3b 8b 8d` | `op Gv, Ev` | `03 04 97` `addl (%rdi,%rdx,4), %eax` |
| 带 REX.W 的 `63` | `movsxd Gv, Ev` | `48 63 c7` `movslq %edi, %rax` |
| `69` 和 `6b` | `imul Gv, Ev, imm` | `48 69 c0 67 66 66 66` |
| `83 /0 /5 /7` | `add sub cmp Ev, imm8` | `83 c1 fa` `addl $-0x6, %ecx` |
| `c1 /5 /7` | `shr sar Ev, imm8` | `48 c1 f9 22` `sarq $0x22, %rcx` |
| `f7 /7` | `idiv Ev` | `f7 ff` `idivl %edi` |
| `ff /0 /4` | `inc Ev`, `jmp Ev` | `48 ff c2` `incq %rdx` |
| `70` 到 `7f`、`eb`、`e8` | `jcc rel8`、`jmp rel8`、`call rel32` | `74 09` `je 0xd` |
| `99`, `c3`, `90`, `0f 1f` | `cltd`, `retq`, `nop` | `66 0f 1f 44 00 00` `nopw (%rax,%rax)` |

`grade+0x23`- Não .`leaq (%rip), %rcx`长七字节,位移量为零──目标文件在位移字段的偏移 `0x36`处携带一个重定位项 `R_X86_64_PC32.rodata+0x10`❖ 提升器会在阶段 3 解析它──

## 阶段 2: elementos básicos e elementos de controlo

基本块是一个语句序列,顶部只有一个进口,底部只有一个出口――这一定义来自Allen(1970),每篇反编译器论文都会沿用──`build_blocks()`收集块首地址: função entrada、 função dentro de cada saltar objetivo, bem como cada post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post post`jmp`Há um.`ret`没有后继,以普通命令结尾的块则顺序落入下一个块首地址──

`-O1`Baixo`total`Há cinco elementos básicos:

| 基本块 | 指令 | 后继 |
|---|---|---|
| `0x40` | `testl %esi, %esi`，然后是 `jle 0x5c` | `0x5c`、`0x44` |
| `0x44` | `movl %esi, %ecx`, `xorl %edx, %edx`, `xorl %eax, %eax`, `nopw` | `0x50` |
| `0x50` | `addl (%rdi,%rdx,4), %eax`, `incq %rdx`, `cmpq %rdx, %rcx`, `jne 0x50` | `0x50`, `0x5b` |
| `0x5b` | `retq` | 出口 |
| `0x5c` | `xorl %eax, %eax`，然后是 `retq` | 出口 |

`immediate_dominators()` realizou o algoritmo de Cooper, Harvey e Kennedy,  (2001) . .......................................................................................................................................................................................................`total`- Não .`0x44`支配 `0x50`- Também o tenho.`0x50`通過回邊支配自身, 階段 8 正 正在此發現循环──

A mesma função também vai re-se executar duas vezes.`dominance_frontiers()`Usá-lo para construir SSA.`post_dominators()`则在添加虚拟出口节点的反向图上运行它,寻找汇合点──

## 阶段 3: 提升为小型 IR

IR 包含六种语句:`Assign`- Não.`Store`- Não.`Branch`- Não.`Jump`- Não.`IndirectJump`和 `Return`◊ expressão inclui constante, variação,`sext`- Não.`zext`- Não.`trunc`(c) e carga. Há cinco outras formas que só existem para ser simplificadas e eliminadas mais tarde:`Flags`- Não.`Cond`- Não.`Concat`- Não.`SignFill`和 `Symbolic`- Não.

寄存器被表示为其64位寄存器族命名的变量──写入`%eax`É para o`rax`O número de pessoas que estão em casa é de 32`Assign`, 读取`%eax`则是以 32 位宽读取 `rax` Em um modo de 64 bits, 32 bits se expandem para todo o arquivo, então, o mesmo valor é lido por 64 bits uma vez.`zext` O elevador não sabe qual é a definição de que está chegando a esta posição, então primeiro registre a sua largura, deixe a SSA em fase 5 插入转换──

| 指令 | IR 语句 |
|---|---|
| `subl %edi, %esi` | `flags = cmp(esi, edi)`，然后是 `esi = esi - edi` |
| `testl %edi, %edi` | `flags = test(edi, edi)` |
| `je 0xd` | `if je(flags) goto 0xd else goto 0x4` |
| `xorl %eax, %eax` | `eax = 0` |
| `cltd` | `edx = signfill(eax)` |
| `idivl %edi` | `dividend = edx:eax`, `eax = dividend / edi`, `edx = dividend % edi` |
| `movslq %edi, %rax` | `rax = sext64(edi)` |
| `sarq $0x22, %rcx` | `rcx = rcx >>s 34` |
| `shrq $0x3f, %rax` | `rax = rax >>u 63` |
| `addl (%rdi,%rdx,4), %eax` | `flags = add(eax, load32(rdi + rdx * 4))`，然后是 `eax = eax + load32(rdi + rdx * 4)` |
| `leaq (%rip), %rcx` 及其重定位项 | `rcx = &.rodata+0x14` |
| `pushq %rbp`、`movq %rsp, %rbp`、`subq $0x10, %rsp`、`popq %rbp` | 不生成语句，仅用于栈帧管理 |
| `retq` | `return rax` |

### 将标志表示为变量

Cada instrução do código de condição será escrita em nome`flags`A mudança, cada condição, tudo o que acontece.`cmp a, b`写入 `cmp(a, b)`- Não .`test a, b`写入 `test(a, b)`- Não .`sub`则作为副作用写入 同样 `cmp`- Formação`jcc`变为 `Branch(Cond(cc, flags), target, fallthrough)` Quando o código condicional e o sinal em fase 6 se encontram, o código condicional decide comparar o operador:

| 条件码 | 在 `cmp(a, b)` 之后 | 在 `test(a, a)` 之后 |
|---|---|---|
| `je` | `a == b` | `a == 0` |
| `jne` | `a != b` | `a != 0` |
| `jl`、`jge`、`jle`、`jg` | 有符号 `<`、`>=`、`<=`、`>` | 与 0 进行有符号比较 |
| `jb`、`jae`、`jbe`、`ja` | 无符号 `<`、`>=`、`<=`、`>` | 与 0 进行无符号比较 |

`xorl %eax, %eax`直接提升为 `eax = 0`◊ É o que se passa.`add`风格的标志,测试样例中没有跳转读取这些标志──`xor`Este é um padrão habitual.`grade`É muito importante, mas Ghidra não o mantém.

### Clínica de informação

`cltd`- Não .`%eax`Of símbolos em preenchido`%edx`- Não.`idivl %edi`将 64 位寄存器对 `%edx:%eax`Além de`%edi`,商写入 `%eax`,余数写入 `%edx` 提升器 primeiro vai colocar este寄存器 para escre-`dividend`De modo que, o número de palavras que se lê é o antigo.`%eax`Em SSA, a metade alta apresenta-se como a metade baixa.`signfill` simplificar o sistema de registro para simplificar para metade, além de transformar-se em 32 bits `/`- Não.

### - O0 baixo de 槽位

Em`-O0`Baixo, clang vai manter cada local de variação dentro.`percent_change`- Não .`%edi`- Não .`-0x8(%rbp)`,把 `%esi`- Não .`-0xc(%rbp)`Depois de cada vez que usamos, vamos ler e voltar.`movq %rsp, %rbp`de `pushq %rbp`在这个函数序言后,基址为 `%rbp`Não há indice e não há quantidade de transferências de memória.`local_<hex>`De variação.`-0x8(%rbp)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `local_8`- Não .`-0xc(%rbp)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `local_c`- Não.

 instrução em si não gera IR, para `%rsp`de `subq`和 `addq`Também não se produzir.`Load`Ou `Store`- Não.

### 重定位

`grade`Em meio`leaq (%rip), %rcx`Em ficheiros, o volume de deslocamentos é de zero.`0x36`O seu peso é de`R_X86_64_PC32.rodata+0x10`                                                                                                                                                                                                                                                              `S + A - P`写入该字段──`S`Sim `.rodata`É o meu nome.`A`É um número .`0x10`- Não .`P`É um dos principais pontos de encontro.`next_ip + disp = (P + 4) + S + A - P = S + A + 4`- Não.

O elevador aplica o mesmo cálculo sem o enlace. O desvio de objetivo é igual a adição de números adicionais a um segmento até a distância do fim da instrução, ou seja,`0x10 + 4 = 0x14`✿IR 写为 `rcx = &.rodata+0x14`O que é que é que é?`int`Valor`1, 2, 3, 4, 4`- Não.

## 阶段 4: do调用约定恢复参数

Sistema V AMD64 psABI § 3.2.3 节规定,INTEGER 类参数依次通过 `%rdi`- Não.`%rsi`- Não.`%rdx`- Não.`%rcx`- Não.`%r8`- Não.`%r9`传递──结果先通过 `%rax`, novamente através de`%rdx`返回──§ 3.2.1 节说明,`%rbp`- Não.`%rbx`和 `%r12`Até`%r15`属于调用方, must be retained; restantes寄存器 pertencem a被调用方.

`collect_params()`应用一条规则: o parameter寄存器 é o formato de um parameter.`%rsi`Não me lembro.`%rdi`A função ainda tem dois parâmetros.`percent_change`读取 `%edi`和 `%esi`, portanto , há`param_1`和 `param_2`- Não.`grade`Só para ler`%edi`- Não.`total`- Não .`%rdi`作为 64 位基址读取,将 `%esi`作为 32 位计数读取──

Agora já posso explicar Ghidra `param_3`- Não.`idivl`- É um bom trabalho .`%rdx`, e a PSABI permite o seu passagem .`%rax:%rdx`返回 128 位 INTEGER── no arquivo objetivo, não há nenhuma forma de usar o modo de dizer-nos o valor de retorno exatamente qual é o tamanho do tamanho.

Em um caminho de volta para zero,`xorl %eax, %eax`Só escrevi.`%eax`Ghidra está no caminho.`%rdx`Como função de entrada, esta entrada é transformada em`param_3` instrução não errada. A assinatura da função é parte de um instrução não definida.

## 阶段 5:SSA, cada definição um nome

Depois de subir,`grade`写入 `rax`Quatro vezes, escrevo.`rcx`三次──Cytron、Ferrante、Rosen、Wegman 和 Zadeck(1991) definiu a forma de atribuição única de valores estáticos: cada variação é atribuída uma vez, a função phi do ponto de encontro é selecionada entre a definição de até aqui.`insert_phis()`和 `rename()`Seguir estes dois métodos.

`total`A lista de SSA mostra os resultados da construção:

```text
block 0x44 -> 0x50
  ecx_1 = esi_0
  edx_1 = 0
  eax_1 = 0
block 0x50 -> 0x50, 0x5b
  eax_2 = phi(0x44: eax_1, 0x50: eax_3)
  rdx_2 = phi(0x44: edx_1, 0x50: rdx_3)
  flags_2 = phi(0x44: flags_1, 0x50: flags_5)
  flags_3 = add(eax_2, load32(rdi_0 + rdx_2 * 4))
  eax_3 = eax_2 + load32(rdi_0 + rdx_2 * 4)
  flags_4 = inc(rdx_2, 1)
  rdx_3 = rdx_2 + 1
  flags_5 = cmp(zext64(ecx_1), rdx_3)
  if jne(flags_5) goto 0x50 else goto 0x5b
```

A versão 0 do寄存器 é o valor da entrada de função.`esi_0`和 `rdi_0`É um ciclo de`0x50`Há dois motores anteriores: bloco inicial e si mesmo, então cada variação definida no ciclo vai obter um phi.`flags_2`Esse é o que se produz, é o código morto. O mínimo que a SSA pode colocar é porque os dois primeiros motores definiram.`flags`É o que eu quero dizer.

O nome de um passo é alterado.`edx_1 = 0`É 32 位 definição,`rdx_3 = rdx_2 + 1`64 位 definição, portanto, phi `rdx_2`采用较大的位宽──`cmpq %rdx, %rcx`Para o`%rcx`É uma versão de 64 bits, e é definida por`ecx_1 = esi_0`É 32 bits, portanto, deve ser usado para`zext64(ecx_1)`                                                                                                                                                                                                                                                              

A sua leveza está agora a sair do SSA.`coalesce_webs()`Para que cada phi se junte a seus parâmetros em uma variação chamada web, e para que essa web tenha um nome. Isso se aplica à estrutura gerada pelos compiladores para essas funções. Mas, quando se encontra com a duplicação, pode falhar, por exemplo, dois valores de troca de phi do mesmo ponto de convergência.

## 阶段 6:化简、替换与死代码消除

`optimize()`Reprodução de três rotas de processamento até que não haja mudanças.

| 改写前 | 改写后 |
|---|---|
| `Cond(je, cmp(a, b))` | `a == b`，其余九种条件码同理 |
| `Cond(jle, test(a, a))` | `a <= 0` |
| `x + (-6)` | `x - 6` |
| `trunc32(zext64(x))`，其中 `x` 为 32 位 | `x` |
| 对 64 位操作数执行 `trunc32(a + b)` | `trunc32(a) + trunc32(b)` |
| `(signfill(x): x) / d` | 位宽为 32 的 `x / d` |
| `load32(base + idx * 4)` | `base[idx]` |
| `trunc32(p >>s 34) + trunc32(p >>u 63)`，其中 `p = sext64(x) * 0x66666667` | `x / 10` |

O uso de um ponto de uso é uma definição que se move para o seu único ponto de uso. Esta regra tem três condições: o ponto de uso está no mesmo bloco básico; o ponto de uso é um frase e não phi; se a definição contém carga, então a definição e o uso não podem ter armazenamento ou modificação.

O código de eliminação eliminação objetivo não é usado e expressão não contém atribuição ou phi.`percent_change`中,余数 `edx_2 = dividend_1 % edi_0`É um código morto, por isso é eliminado.`edx_1 = signfill(eax_1)`Só resta um ponto de uso, então é substituído.`dividend_1 = edx_1:eax_1`- Não.

寄存器对规则随后将 `signfill(eax_1):eax_1`化简为`eax_1`,除法变成`eax_1 / edi_0`Agora.`eax_1 = esi_1 * 100` Apenas um ponto de uso,`esi_1 = esi_0 - edi_0`Também há apenas um ponto de uso, ambos são transferidos para retornar ao idioma.`flags`Definição foi substituída em condições de separação depois de desaparecer.

```c
return (param_2 - param_1) * 100 / param_1;
```

### 乘以 0x66666667

`grade`Vou dividir em 10, mas não se produzirá clang.`idiv`- É o que eu faço.`imulq $0x66666667, %rax, %rax`, re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re-re`sarq $0x22, %rcx`, e depois executar`shrq $0x3f, %rax`,最后将两者相加──Granlund 和 Montgomery 的论文División por inteiros invariantes usando multiplicação(PLDI 1994) descreveu esse método──编译器选择乘数 `m`和移位量 `s`, fazer ao alcance de cada um `x`Todos os lugares`(x * m) >> s`É assim .`x / d`- Não.

Aqui está.`m = 0x66666667 = 1717986919`- Não .`s = 34` Operar:`2^34 / 10 = 1717986918.4`, para cima para cima`1717986919` 误差是 `m * 10 - 2^34 = 6`                                                                                                                                                                                                                                                              `x`Não há nada de errado.`2^31`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `2^34`Aqui, portanto, o erro é de 8:6 não mais do que 8, por isso, para cada não negativo `int`- Não .`(x * m) >> 34`Todos os tipos de`floor(x / 10)`- Não.

对于负数 `x`, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para baixo, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para, para`shrq $0x3f`提取乘积的符号位, e é o que acontece.`x`Por negativo é igual a 1. Adicioná-lo é corrigível em direção.

`magic_divisor(m, s)`检验一对候选价值── é que vai ser `d`计算为 `2^s`Além de`m`É um grande negócio.`d`和 `d + 1`- Só agora.`m`É assim .`2^s / d`O resultado total, e satisfazer os limites de erro, só aceita um.`d`                                                                                                                                                                                                                                                              `s = 33`- Eu vou .`d = 5`É verdade, porque...`0x66666667`É igual a`2^33 / 5`O resultado geral de um teste será de 2.406 valores, que vão aumentar a relação entre o resultado e o resultado.`c_div(x, 10)`Comparar, entre eles `int` Dois pontos de alcance:

启用识别时,`grade`显示为 `ecx_1 = param_1 / 10 - 6;`关闭识别时,演示会打印原始形式:

```c
rax_1 = (long)param_1 * 0x66666667;
ecx_1 = (int)(rax_1 >> 34) + (int)((unsigned long)rax_1 >> 63) - 6;
```

两种形式都编译,也计算出相同的值──保留这个开关── quando você lê o código gerado pelo compilador que ainda não foi estudado, a forma original é apenas uma expressão honesta──

## 阶段 7: do modo de utilização do tipo de

O código do aparelho é apenas de tamanho, não há tipo.`infer_types()`A definição de um site de 32 páginas é:`int`,64 位的网 是 `long` Se uma web é um elemento de visita `base[idx]`É o que eu quero dizer.`int *` Tipo de referência:`-O0`Baixo`local_8 = param_1`Vai fazer tudo acontecer.`int *` Tipo de retorno depende de`return`语句中值的位宽──

`total`O resultado é:`int total(int *param_1, int param_2)`Ghidra escreveu:`int total(long param_1,uint param_2)`                                                                                                                                                                                                                                                              `*(int *)(param_1 + uVar2 * 4)`                                                                                                                                                                                                                                                              `const`Também não posso distinguir .`int *`和 `unsigned *`- Não.

Lee、Avgerinos 和 Brumley(TIE,NDSS 2011) vai tipo de recuperação de expressão para um formato de composição.`const`A taxa de recomposição dos marcadores de referência alcançou 98%.

无符号运算保留在表式中,而不体现变量类型里──`cmpl $0x4, %ecx`后的 `ja`打印为 `(unsigned int)ecx_1 > 4`- Não .`shrq`打印为 `(unsigned long)rax_1 >> 63` A variação mantém um tipo de símbolo, de modo que o leitor pode ver o valor do depositário, também pode ver a instrução em que posição será considerada sem valor de símbolo.

## 阶段 8: da retomada da estrutura

Cifuentes(1994) § 6 章将图中的区域与高级语言的结构形态匹配──先处理循环(6.6.1),再处理双路条件(6.6.2),最后处理多路条件(6.6.3)──Yakdan、Eschweiler、Gerhards-Padilla 和 Smith(NDSS 2015) percorreu outro caminho── eles sugerem cada ponto de execução das condições, novamente a partir dessas condições construção da estrutura, não depende de forma fixa── seu movimento provém de uma medida: Hex-Rays para uma amostra gerada 49,514 行代码 contém 1,571 `goto`, em média, por 32 linhas; enquanto o seu método de estruturação não gerou nenhum desses tipos de palavras em 1,530 kernel  funções.

`structure()`É um método de primeira classe uma pequena realização.`Branch`O bloco final, o seu ponto de controle posterior direto é o ponto de concentração do ponto de condição. O rango é o ponto de concentração do bloco que controla o seu ponto de origem. O ciclo natural é o conjunto dos blocos que não precisam passar por um ciclo para chegar ao ponto de concentração.

对于汇合点为 `j`de `Branch`- Não .

- Se `j`É um salto de meta, gerar.`if (!cond) { fallthrough region }`, e depois de`j`Continuem.
- Se `j`É a sequência de entrada e saída.`if (cond) { target region }`, e depois de`j`Continuem.
- Se `j`É a saída de funções, duas partes retornarão.`if (cond) {... }`, outro分支放在后面,不使用 `else`É isso.`percent_change`和 `total`- Não, não.
- 否则生成 `if (cond) { target } else { fallthrough }`, e depois de`j`Continuem.`-O0`Baixo`percent_change`É assim: dois grupos de armazenamento.`local_4`, e em função尾声处汇合──

 para o ciclo:

- Se o ciclo de`Branch`结尾,且有一个后继位于循环外,生成 `while (cond) { body }`- Não.`-O0`Baixo`total`É assim: ciclo de comparação`local_14`和 `local_c`,并通过 `jge`- Não.
- Se o ciclo também for um bloco de volta, ou se a saída estiver no bloco de volta, gerar-se-á`do { body } while (cond);`- Não.`-O1`Baixo`total`É esta forma: bloco`0x50`执行加法、递增、比较, então salta de volta a si mesmo.

`IndirectJump`Acabará com um bloco e não haverá mais.`-O0`Baixo`grade`Utilize real jump转表:`jmpq *%rax` através `.rodata+0x0`O curso de ciências da informação sobre a evolução de um sistema de informação sobre a evolução de um sistema de informação sobre a evolução de um sistema de informação sobre a evolução de um sistema de informação sobre a evolução de um sistema de informação sobre a evolução de um sistema de informação sobre a evolução de um sistema de informação sobre a evolução de um sistema de informação sobre a evolução de um sistema de informação sobre a evolução de um sistema de informação sobre a evolução de um sistema de informação sobre a evolução de um sistema de informação sobre a evolução de um sistema de informação sobre a evolução de um sistema de informação sobre a evolução de um sistema de informação sobre a evolução de um sistema de informação sobre a evolução de um sistema de informação sobre a evolução de um sistema de informação sobre a evolução de um sistema de informação sobre a evolução de um sistema de informação sobre a evolução de um sistema de informação sobre a evolução de um sistema de informação sobre a informação sobre a sua informação sobre a sua informação sobre a sua informação sobre a sua informação sobre a sua informação sobre a sua informação sobre a sua informação sobre a informação sobre a informação sobre a informação sobre a informação sobre a informação sobre a informação sobre a informação sobre a informação sobre a informação sobre a informação sobre a informação sobre a informação sobre o sistema de um sistema de informação sobre o sistema de informação sobre o sistema de informação sobre o sistema de informação sobre o sistema de informação sobre o sistema de informação sobre o sistema.`0x76`- Não.`0x7f`- Não.`0x88`和 `0x91`Os quatro blocos de um local só podem ser transmissos indiretamente, por isso não foram promovidos.`switch`- Não.

### - O1 para o interruptor o quê?

Em`-O1`Não há nada para isso.`grade`Mantém-se a saltar.`score / 10 - 6`, o resultado será comparado como um número sem símbolo com 4, e depois`.rodata+0x14`- Há cinco .`int`O valor de devolução de um símbolo é coberto.`score / 10 < 6`和 `score / 10 > 10`两种情况──负差值作为无符号数很大,因此也无法通过检查──

- Não .`1, 2, 3, 4, 4`,分分对应商 6 到 10 带五条 `return`de `switch`Tornou-se um .`if`E assim, o número de elevadores é elevado a um nível de elevação.`lookup_14`- Não.

O governo federal decidiu que a lei de abertura do governo federal seria aplicada em todos os Estados Unidos.`table_values()`Desde o início até o final.`.text`重定位项引用的下一个 `.rodata`偏移, ou até ao final do capítulo.`0x28`, é`grade_label`É um bom exemplo.`lookup_14`- Não .`(0x28 - 0x14) / 4 = 5`项──与 4 的无符比较也吻合──Ghidra 同样不知道表长──它写成 `*(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4)`, isto é, um endereço de um字节, adicionado à variação, e deixando o leitor a encontrar cinco valores de trabalho.

## Com Ghidra 并排对照

O resultado é o resultado da apresentação.`code/fixtures/ghidra/*.json`, que será devolvido em 2026-10-14 .`npx -y rea-agents@6.5.0 decompile ledger-x86_64-O1.o <function> --provider ghidra --format json`                                                                                                                                                                                                                                                              `confidence: observed`和 `authority: shipped-artifact`O texto é observado, mas as afirmações internas do texto são sugeridas, enquanto o registro não indica quais são os resultados sugeridos.

### %_change

```text
lifter                                         | ghidra
-----------------------------------------------+-----------------------------------------------
int percent_change(int param_1, int param_2)   | undefined1  [16] percent_change(int param_1,int param_2,ulong param_3)
{                                              | {
  if (param_1 == 0) {                          |   long lVar1;
    return 0;                                  |   undefined1 auVar2 [16];
  }                                            |   undefined1 auVar3 [16];
  return (param_2 - param_1) * 100 / param_1;  |   if (param_1 != 0) {
}                                              |     lVar1 = (long)((param_2 - param_1) * 100);
                                               |     auVar3._0_8_ = lVar1 / (long)param_1 & 0xffffffff;
                                               |     auVar3._8_8_ = lVar1 % (long)param_1 & 0xffffffff;
                                               |     return auVar3;
                                               |   }
                                               |   auVar2._8_8_ = 0;
                                               |   auVar2._0_8_ = param_3;
                                               |   return auVar2 << 0x40;
                                               | }
```

| 差异 | 指令或猜测 |
|---|---|
| 返回类型 `undefined1 [16]` 与 `int` | 猜测。`idivl` 写入 `%rax` 和 `%rdx`，且没有调用方确定返回位宽，因此两个寄存器都被保留。 |
| `param_3` | 由第一个猜测引出的猜测。返回零的路径上只有 `%eax` 被写入，所以 `%rdx` 被作为输入读取。 |
| `lVar1 / (long)param_1 & 0xffffffff` 与 `/ param_1` | 来自指令。`cltd` 加 `idivl` 对符号扩展后的 32 位值做 64 位除法，再截断到 32 位。两段文本都在描述这个过程。我们的版本用 `signfill` 规则化简了寄存器对。 |
| 保留 `lVar1 % (long)param_1` | 源于返回类型。在我们的分析中，`%rdx` 中的余数是死值；在 Ghidra 的分析中，它是活值。 |
| `if (param_1 != 0)`，后面才是零值情况 | 源于指令顺序。`je 0xd` 跳到返回零的位置。Ghidra 先放计算分支，我们先放较小分支。两者都正确。 |
| `return auVar2 << 0x40` | 猜测。反编译器用一个低半部装有 `param_3`、再移到高半部的 16 字节值，表达 `%rax = 0` 且 `%rdx` 未知的情况。 |

`code/fixtures/ghidra/ledger-x86_64-O1.ghidra-repaired.c`A versão revisada do meio apenas modifica esta função, testando-a em 81 para compará-la com o código-fonte.

### grau

```text
lifter                                         | ghidra
-----------------------------------------------+-----------------------------------------------
static const int lookup_14[5] = {1, 2, 3, 4, 4}; | uint grade(int param_1)
int grade(int param_1)                         | {
{                                              |   uint uVar1;
  int eax_1;                                   |   uint uVar2;
  int ecx_1;                                   |   
                                               |   uVar2 = param_1 / 10 - 6;
  ecx_1 = param_1 / 10 - 6;                    |   uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);
  eax_1 = 0;                                   |   if (uVar2 < 5) {
  if ((unsigned int)ecx_1 <= 4) {              |     uVar1 = *(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4);
    eax_1 = lookup_14[(unsigned long)(unsigned int)ecx_1]; |   }
  }                                            |   return uVar1;
  return eax_1;                                | }
}                                              |
```

| 差异 | 指令或猜测 |
|---|---|
| 两者都有 `param_1 / 10 - 6` | 来自指令。两者都识别出了 `0x66666667` 惯用模式。 |
| `uVar1 = -(param_1 >> 0x1f) ^ (uint)(... >> 0x3f)` 与 `eax_1 = 0` | 来自 `grade+0x1a` 处的 `xorl %eax, %eax`。寄存器为零。Ghidra 将 `xor` 表达为 `param_1` 的符号与乘积符号位的异或，这是同一个位的两种写法，却没有将两者消去。对每个 `int`，值都为 0，测试在 141 个分数上验证了这一点。相信文本的读者会误以为默认值依赖分数。 |
| `uVar2 < 5` 与 `(unsigned int)ecx_1 <= 4` | 来自 `cmpl $0x4, %ecx`，随后是 `ja`。条件相同。Ghidra 将 `uVar2` 定为 `uint`，我们则在使用处转换。 |
| `*(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4)` 与 `lookup_14[...]` | 来自指令加重定位。Ghidra 加载目标文件时，将 `.rodata` 放在 `0x001000a0`，所以 `0x001000b4` 就是 `.rodata + 0x14`。它应用了重定位并保留字节地址。我们为表命名，并读取了其中五个值。 |
| `uint` 返回值与 `int` | 两边都是猜测。指令只说明是 32 位。 |

### Total

```text
lifter                                         | ghidra
-----------------------------------------------+-----------------------------------------------
int total(int *param_1, int param_2)           | int total(long param_1,uint param_2)
{                                              | {
  int eax_1;                                   |   int iVar1;
  int ecx_1;                                   |   ulong uVar2;
  long rdx_1;                                  |   
                                               |   if (0 < (int)param_2) {
  if (param_2 <= 0) {                          |     uVar2 = 0;
    return 0;                                  |     iVar1 = 0;
  }                                            |     do {
  ecx_1 = param_2;                             |       iVar1 = iVar1 + *(int *)(param_1 + uVar2 * 4);
  rdx_1 = 0;                                   |       uVar2 = uVar2 + 1;
  eax_1 = 0;                                   |     } while (param_2 != uVar2);
  do {                                         |     return iVar1;
    eax_1 = eax_1 + param_1[rdx_1];            |   }
    rdx_1 = rdx_1 + 1;                         |   return 0;
  } while ((unsigned long)(unsigned int)ecx_1 != rdx_1); | }
  return eax_1;                                |
}                                              |
```

| 差异 | 指令或猜测 |
|---|---|
| `int *param_1` 与 `long param_1` | 我们根据 `addl (%rdi,%rdx,4), %eax` 作出的推断。Ghidra 保留了位宽。 |
| `uint param_2` 与 `(int)param_2`，对比 `int param_2` | Ghidra 选择无符号类型，因为 `cmpq %rdx, %rcx` 比较的是零扩展后的计数。我们保留 `int`，在比较处转换。 |
| 两者都有 `do { } while` | 来自块跳回自身的指令 `jne 0x50`。编译器旋转了循环。`-O0` 目标文件保留 `while`。 |
| 保留 `ecx_1 = param_2`，对比 `param_2 != uVar2` | 我们的替换规则仅限于同一基本块。复制 `movl %esi, %ecx` 位于初始化块，而比较位于循环内，所以变量保留。Ghidra 则传播了它。 |
| `(unsigned long)(unsigned int)ecx_1` | 来自指令。`movl %esi, %ecx` 执行零扩展，64 位比较读取整个寄存器。 |

行为测试会原样编译 `grade`和 `total`Ghidra 文本, apenas adicionar duas linhas `typedef`, e de acordo com`.rodata+0x14`处二十个字节                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `DAT_001000b4`定义──在输入网格上, duas funções são coincidentes com o código-fonte──

## Estudar a falsa leitura de revelação

LLM4Decompile (EMNLP 2024) testado, individualmente usando Ghidra em HumanEval-Decompile, a taxa de re-execução é de 20,12%。 aproximadamente cinco por cento das funções são capazes de re-complicar e através de um teor de base                                                                                                                                                                                                                              

Liu、Raff 和 Micinski(arXiv 2609.05370, 2026 年 9 月) explicou essa diferença. Eles usaram 300 funções de biblioteca do GitHub e 287 funções baseadas em CVE. O modelo de revisão mais forte aumentará a taxa de sucesso de construção da Ghidra de 75% para 90%, mas a taxa de correspondência de comportamento desceu de 74% para 62%.

Eles seguem a razão é simples: com o espaço de redação de um字段、类型、 foram convocados funções e condições de proteção, substituindo os anticomprador deixados no texto por expressos desconhecidos.

É a impressão do elevador.`(unsigned long)(unsigned int)ecx_1`Não é por causa de um nome mais bonito.`switch`Para o seu uso.`lookup_14`Não é um modelo que pode ser feito com uma etiqueta.`code/main.py`中阅读的推导过程──Ghidra 的推导过程──Ghidra 的推导过程──Ghidra 的推导过程──Ghidra 的推导过程──Ghidra 的推导过程──Ghidra 的推导过程──Ghidra 的推导过程──Ghidra 的推导过程──Ghidra 的推导过程──Ghidra 的推导过程──Ghidra 的推导过程──Ghidra 的推导过程──Ghidra 的推导过程──Ghidra 的推导过程──Ghidra 的推导过程──Ghidra 的推导过程──Ghidra 的推导过程──Ghidra 的推导过程──Ghidra 的推导过程──Ghidra 的推导过程──Ghidra 的推导过程`undefined1 [16]`很难看,但诚实──修订模型生成的整洁签名 `int percent_change(int, int)`Embora seja verdade, as razões não são contrárias. O mesmo modelo pode gerar uma assinatura completa mas errada na função seguinte.

## 亲手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/34-lifting-to-pseudocode
python3 code/main.py
```

- Não .`-O1` Todas as quatro funções do documento-alvo, e  cada instrução com os submetidos `llvm-objdump`文本比较──对 `percent_change`- Não.`grade`和 `total`, imprimirá o SSA    anterior IR 、 contendo     função phi  lista de SSA, bem como o Ghidra 文本并排的伪代码── em seguida, imprimirá 关闭除法识别后的 `grade`- Não.`-O0`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `percent_change`- Não.`total`和 `grade_label`, e汇总:

```json
{
  "functions": ["grade", "grade_label", "percent_change", "total"],
  "instructions": 56,
  "blocks": {"percent_change": 3, "grade": 3, "total": 5, "grade_label": 4},
  "phis": {"percent_change": 0, "grade": 1, "total": 2, "grade_label": 1},
  "objdumpDifferences": 0
}
```

按以下顺序阅读 `code/main.py`- Não .

1. `read_object()`读取 ELF64 可重定位目标文件的节头,符号表和 `.rela`- Não.
2. `decode_one()`和 `render_att()`解码一条命令,并按 `llvm-objdump`Como imprimir.
3. `build_blocks()`- Não.`immediate_dominators()`和 `dominance_frontiers()`构建图的相关事实──
4. `lift_insn()`将一条命令转换为 IR 语句,并解析重定位──
5. `insert_phis()`和 `rename()`Construir SSA,并插入位宽转换──
6. `make_simplifier()`- Não.`substitute_once()`和 `remove_dead_code()`Em`optimize()`- Não.
7. `collect_params()`- Não.`coalesce_webs()`和 `infer_types()`Por web 命名并推断类型──
8. `structure()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `post_dominators()`和 `natural_loops()`生成 C 函数体──
9. `lift_function()`串联各阶段,`lift_all()`则携带被调用函数签名,提升整个目标文件──

## 实际使用

Para melhorar a função do seu próprio arquivo de objetivos, use `clang -target x86_64-unknown-linux-gnu -c`Construí-lo e depois o usei.`lift_all(read_object(path))` Descargar`DecodeError`时, de notícias para ler o código de operação, em SDM 操作码映射表中查找它,再加一条在文件顶部表中.`lift_insn()`增加一条规则── estruturação gerar `goto`时,使用 `IrPrinter`印图,判断缺少哪条形态规则── cada vez mais o conteúdo é muito pequeno, já existem testes`llvm-objdump`Ou clang 检查它──

Depois de instalar Ghidra, em relação à mesma função, ele vai colocar dois parágrafos do texto em sua lista. Antes de acreditar em qualquer parágrafo do texto, preencha primeiro a diferença de forma a expressar.

## 交互实验

### 实验 A: Deixar uma função passar por cinco fases

Em`code`Agora abro Python:

```bash
cd phases/13-tools-and-protocols/34-lifting-to-pseudocode/code
python3 -q
```

运行:

```python
from main import *
obj = read_object(FIXTURES / "ledger-x86_64-O1.o")
lifted = lift_function(obj, "percent_change")
for insn in lifted.decoded: print(f"0x{insn.address:x}: {insn.raw.hex(' ')}  {insn.att()}")
print(lifted.ir_text)
print(lifted.ssa_text)
print(lifted.pseudocode)
```

Com o meu .`%esi`Como é que eu faço isso ?`subl %edi, %esi`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `esi_1 = esi_0 - edi_0`, re-transformado`(param_2 - param_1)`△字节 `fe`Sim `subl`de ModR/M, entre eles `mod = 11`- Não.`reg = edi`- Não.`r/m = esi`- Não.

### 实验 B:除法惯用模式

```python
print(lift_function(obj, "grade", recognize_division=False).pseudocode)
print(magic_divisor(0x66666667, 34), magic_divisor(0x66666667, 33), magic_divisor(0x66666667, 31))
```

Primeiro, imprimir original乘法和移位.`10 5 None` Por favor, sugira por que o mesmo número multiplicado em número de mudanças diminuiu quando um indicou dividido em 5, e por que o número de mudanças 31 não satisfaz a diferença de diferença 

### 实验 C: new target文件让解码器停下

É`-O2`Construir testes de teste exemplo并提升它:

```bash
clang -target x86_64-unknown-linux-gnu -O2 -fno-asynchronous-unwind-tables -c fixtures/ledger.c -o "$TMPDIR/ledger-O2.o"
python3 -c 'from main import *; from pathlib import Path; import os; lift_all(read_object(Path(os.environ["TMPDIR"]) / "ledger-O2.o"))'
```

- Não .`0x56`处停止, relatório `opcode 81 is outside the fixture subset`操作码 `81`É o primeiro grupo de 32 números de número imediato.`andl $0x7ffffff8, %edx`, clang em `total`Usou-o no ciclo de quantificação.`decode_one()`de `0x83`Além disso, reinicie, e registre o próximo código de operação que te deixa parar.`llvm-objdump`- Inspecção.

### 实验 D:Ghidra 在 级中 的默认值

```python
print(ghidra_pseudocode("grade"))
for score in (-25, 0, 59, 60, 100, 115):
    sign = -(score >> 31)
    product_sign = ((score * 0x66666667) & ((1 << 64) - 1)) >> 63
    print(score, sign ^ product_sign)
```

Cada vez que imprimiu,`uVar1`A expressão é difícil de ler, mas as instruções são fáceis de ler.`xorl %eax, %eax`Usando dois caracteres, expressamos o mesmo significado.

## 实践实验

Por`-O0`Baixo`grade`添加 `switch`- Recuperação.

要求:

- 读取 `ledger-x86_64-O0.o`de `.rela.rodata`Há cinco pontos de reposição, cada um deles é um.`R_X86_64_PC32.text+offset`,并根据 `.rodata+0x0`处的表计算五个案例 目标──
- Por isso , não é preciso .`Switch`终结命令,incluindo índice expressão ∞ lista de objetivos, bem como desde o`ja`- Não, não.
- Para mudar cada objetivo do bloco, definir um segundo, deixar o controle do ponto e SSA continuar a funcionar normalmente.
-  生成`switch (local_10) { case 0:... }`Cada objetivo é de acordo com um .`case`,并将共用函数尾声放在汇合点后──
- Para não determinar a relação entre os limites, reservar a notação:
- Usando o clang 编译结果, e comparando o número de testes em seu teste com o código fonte.

O sucesso é:`-O0`Baixo`grade`Com`-O1`Baixo`grade`Em toda a rede, a saída é a mesma, e o resultado de recuperação contém um `switch`Não há nada .`goto`- Não.

## 交付产物

本课产 出 `outputs/skill-lifting-to-pseudocode.md` Usá-lo para elevar uma função, fornecer orientação para cada linha, e preencher o formulário de diferença com o texto do anticomprador.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/34-lifting-to-pseudocode
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

套件共有 25 个测试──验证证明:

- Para os dois documentos-alvo, cada instrução, decodificador e submetido.`llvm-objdump`文本一致;若安装了 `llvm-objdump`, também coincidem com os resultados do funcionamento no local
- REX, Modr/M, SIB e`leaq (%rip), %rcx`Descrição do SDM
- 遇到子集之外的操作码时抛出 `DecodeError`, em vez de adivinhar
- ELF 读取器列出四函数和三 `.text`重定位项
- `total`Há cinco pedaços.`0x44`支配 `0x50`- Não .`0x50`É o ciclo do corpo em si mesmo
- `%rdi`和 `%rsi`变为 `param_1`和 `param_2`, e`total`Em meio`param_1`Por`int *`
- `test`和 `cmp`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `je`- Não.`jle`- Não.`ja`和 `jge`,变为 `==`- Não.`<=`Não há símbolo.`>`和 `<`
- SSA em`total`循环头放置两个活的 phi 函数,在 `percent_change`Não deixe nada
- `percent_change`- Não.`grade`和 `total`O código falso é o mesmo que o texto previsto
- 启用识别时,`grade`显示 `param_1 / 10 - 6`;关闭识别时,显示原始乘法
- `0x66666667`配合移位量 34 expressão dividido em 10, 配合移位量 33 expressão dividido em 5, e relacionamento igual é estabelecido na rede de entrada
- `-O0`A posição de baixo é transformada em`local_4`- Não.`local_8`- Não.`local_c`, e não aparecem mais indicadores
- 通過重定位,在 `.rodata+0x14`处的表中读取到 `1, 2, 3, 4, 4`
- `-O0`- Não .`grade`de um salto indireto ligado a quatro blocos não elevados foram relatados juntos
- Ghidra 测试样例包含 16 字节返回值、`param_3`Não se simplifica.`xor`和 `long param_1`
- Seis unidades de produção disponíveis.`clang -std=c11 -Wall -Werror`Por`x86_64-unknown-linux-gnu`编译
- 提升后函数、修复后 Ghidra 文本和源码, em formato de entrada, impressão igual 232 行

## Modelo de inefficiência no ambiente de produção

| 失效情况 | 浅层阅读的结论 | 推导过程必须展示的内容 |
|---|---|---|
| 反编译器扩大返回值位宽 | “返回 16 字节结构体” | `idivl` 写入 `%rdx`，且没有调用方确定其位宽 |
| 反编译器增加参数 | “接收三个参数” | 只是因为猜测了返回位宽，才在一条路径上读取该寄存器 |
| 未识别惯用模式 | “乘以魔数常量” | 乘数是 `2^s / d` 向上取整的结果，且满足误差界 |
| 识别了惯用模式，却丢失 `xor` | “默认值依赖输入” | `xorl %eax, %eax` 写入零，同一位的两种表达相互抵消 |
| 指针被定为整数类型 | “接收一个 long” | 从该寄存器进行带比例因子的 4 字节加载，是指针的证据 |
| 表长未知 | “读出了表的范围” | 下一个被引用的偏移或节末尾限定表边界，且范围检查与此吻合 |
| 误读循环结构 | “while 循环” | 循环头没有出口，闩锁块向后跳转，因此是 `do while` |
| 猜测间接跳转 | “有五个 case 的 switch” | 目标来自 `.rela.rodata`，否则应报告跳转未解析 |
| 跨存储进行替换 | “一个表达式” | 将已加载的值移过存储或调用，会改变含义 |
| 修订模型编辑文本 | “能够编译，看起来没错” | 构建成功率上升，行为匹配率下降，编造的保护条件替换了显式未知项 |
| 解码器猜测未知操作码 | “反汇编看起来没问题” | 抛出含地址与字节的 `DecodeError`，然后增加一个经 `llvm-objdump` 验证的表项 |

## 操作原理

Considerar o código falso como um processo de introdução que você ainda não viu. Usando um elevador que você pode ler, reproduzir o instrução. Colocar dois parágrafos de texto em uma fila, escrever instruções ou suposições para cada linha de diferença.

## 延伸阅读

- [Intel SDM Volume 2, chapter 2, Instruction Format](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [System V AMD64 psABI, section 3.2, Function Calling Sequence](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Cytron et al., Efficiently Computing Static Single Assignment Form and the Control Dependence Graph, TOPLAS 1991](https://doi.org/10.1145/115372.115320)
- [Cooper, Harvey, Kennedy, A Simple, Fast Dominance Algorithm, 2001](https://www.cs.tufts.edu/~nr/cs257/archive/keith-cooper/dom14.pdf)
- [Cifuentes, Reverse Compilation Techniques, PhD thesis, QUT 1994](https://eprints.qut.edu.au/36820/)
- [Yakdan et al., No More Gotos, NDSS 2015](https://www.ndss-symposium.org/ndss2015/ndss-2015-programme/no-more-gotos-decompilation-using-pattern-independent-control-flow-structuring-and-semantics/)
- [Granlund, Montgomery, Division by Invariant Integers using Multiplication, PLDI 1994](https://doi.org/10.1145/178243.178249)
- [Lee, Avgerinos, Brumley, TIE, NDSS 2011](https://www.ndss-symposium.org/ndss2011/tie-principled-reverse-engineering-of-types-in-binary-programs/)
- [Noonan, Loginov, Cok, Polymorphic Type Inference for Machine Code, PLDI 2016](https://arxiv.org/abs/1603.05495)
- [LLM4Decompile, EMNLP 2024](https://arxiv.org/abs/2403.05286)
- [DecompileBench, Findings of ACL 2025](https://aclanthology.org/2025.findings-acl.1194/)
- [Liu, Raff, Micinski, When LLM Decompilers Recompile More and Preserve Less, 2026](https://arxiv.org/abs/2609.05370)
- [rea 6.5.0 Ghidra provider notes](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/ghidra-provider.md)
- Este curso discute rea 6.5.0 源码位于标签 `3b79af2`- Não .`src/domain/functionComparisonDimensions.ts`- Não.`website/evidence/dx-ball-sound-pan.md`- Não.
