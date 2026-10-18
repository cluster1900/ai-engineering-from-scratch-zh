# 程序解剖:从零编写 ELF 读取器

> O processo de composição posterior é um conjunto de tabelas mutuamente orientadas.

**Type:** Build
**Languages:** Python（标准库）、C（仅用于测试夹具）
**Prerequisites:** Phase 0 · 01（开发环境），已安装 clang；Python 3.10 或更高版本；十六进制运算
**Time:** ~120 分钟

## Objectivo de aprendizagem

- Explicar as regras de autorização de cada objetivo de análise, bem como as quatro limitações do 17 U.S.C. 1201 (f)
- Utilização `struct.unpack`读取 ELF 文件头、节头表和两个字符串表──
- Baseado em gABI e x86-64 psABI 中的名称解码 `.symtab`条目与 `.rela`- Não.
- 返回指定函数的准确字节,并将每个文件偏移映射到其属结构──
- 读取程序头, através `PT_LOAD`将虚拟地址映射为文件偏移──
- 读取 Mach-O 目标文件的加载命令,并指出每个命令对应的ELF 概念──

## 开始之前:授权与法律

Seções 32 a 36                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `code/fixtures/ledger.c`, contém quatro curtas funções C ⋅ fonte de código ⋅ comando de composição e de geração dos documentos-alvo são todos de seu domínio ⋅ aqui não é necessário ler licença ⋅ necessidade de contornar a proteção, nem abrir qualquer código de terceiros ⋅ esta série não envolve proteção de software ⋅ permissão de inspeção ou não pertence ao seu programa ⋅

O Tribunal de Justiça determinou que a cópia de texto em contato com o direito de autor é a única forma de obter os elementos ideais e funcionais de um programa de computador protegido por direitos de autor, e que, quando essa espécie é obtida com justificação, a cópia de texto em contato com o direito de autor é constituída por uma utilização razoável do trabalho protegido por direitos de autor.

O segundo caso é *Sony Computer Entertainment, Inc. v. Connectix Corp.*, 203 F.3d 596 (9th Cir. 2000) Connectix em desenvolvimento em simulador copiou o BIOS da PlayStation, o tribunal concluiu que essas cópias pertencem a um uso razoável  Os dois casos protegem o comportamento do estudo, mas não protegem o código de cópia no produto final 

O artigo 120.o, n.o 1, da C.U.C. 1201, estabelece as fronteiras entre os dois elementos da legislação em vigor, que permitem que os utilizadores de programas de computador tenham acesso ao controle de acesso, mas o único objetivo é identificar e analisar os elementos necessários para a realização da interoperabilidade entre os programas de computador criados independentemente.

Na União Europeia, a Diretiva 2009/24/CE n° 5 (pp3) ▌perta a investigação.

Seção 6 permite que os procedimentos de computador que se criem independentemente, sejam interoperados com a informação necessária para a sua criação, sem requisito de autorização do autor, sejam re-complicados.

| 来源 | 允许的行为 | 条件 |
|---|---|---|
| 17 U.S.C. 1201(f) | 绕过访问控制以分析程序 | 合法副本、互操作目的、信息不易获得、不构成侵权 |
| Directive 2009/24/EC 第 5(3) 条 | 观察、研究和测试运行中的程序 | 有权使用副本，行为处于正常加载和运行范围内 |
| Directive 2009/24/EC 第 6 条 | 反编译 | 被许可人、互操作目的、信息不易获得、仅限必要部分 |
| *Sega v. Accolade* | 构成合理使用的反汇编 | 获取思想和功能要素的唯一途径，且理由正当 |
| *Sony v. Connectix* | 逆向工程过程中的中间复制 | 最终产品不侵权 |

Estas indicações provêm de artigos legais e de sentenças, não constituem recomendações legais. Quando, posteriormente, se encontrarem com um documento que não lhe pertença, devem ser obtidos o direito de reabrir o documento, e o direito de reabrir o documento será conservado junto com as provas.

## 问题

Tu compôs .`ledger.c`, e para o documento de destino funcionou .`llvm-objdump -t` Output                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `percent_change`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `0000000000000000`, grande por`0000000000000010`◊ Este 1.768 字节文件中哪个 16 字节属于这个函数?`0x36`处显示 `R_X86_64_PC32 .rodata+0x10`, e os quatro caracteres desta posição no documento são zero.`0x14`Começa, por que mais?`0x10`- Não .

Utilizando rea `inspect_binary_layout`Responde ao problema do layout, mas esta ferramenta é apenas disponível no Linux x64 e é aprovada.`REA_PWNTOOLS_PYTHON`Use pwntools 4.15.0... Este Mac não tem nada...`address_to_file_offset`需要 Ghidra 会话,以及 SHA-256 匹配的原始文件完整字节副本──`inspect_artifact`Por via e conteúdo, o conteúdo do contêiner não é lido no arquivo do objetivo.`struct.unpack`E o seu papel é o de um leitor de texto.`llvm-objdump`文本 fazer comparação

```figure
elf-byte-map
```

## O documento é o de outros documentos.

Sistema V GABI 4o capítulo 4-1 mostra dois visões do mesmo arquivo. O visão de ligação contém o ELF filehead  selecionável programação , bem como o necessário programação , bem como o selecionável programação .

GABI ainda fixou o tipo de quantidade de dados, declarando que o SELF não usa o seu domínio.`Elf64_Addr`和 `Elf64_Off`Cada um deles ocupa 8 字节,`Elf64_Half`占 2 字节,`Elf64_Word`占 4 字节,`Elf64_Xword`占 8 字节──x86-64 psABI 第 4.1.1 节要求使用 `ELFCLASS64`- Não.`ELFDATA2LSB`- Não .`e_machine`Por`EM_X86_64`(62),`e_flags`Por isso, o que significa é que o uso de um dispositivo é um problema.`<`O que é que é?`struct.unpack`Uma vez, é preciso ler um registro.

`ledger-x86_64-O1.o`字节:

```text
00000000: 7f45 4c46 0201 0100 0000 0000 0000 0000  .ELF............
00000010: 0100 3e00 0100 0000 0000 0000 0000 0000  ..>.............
00000020: 0000 0000 0000 0000 2804 0000 0000 0000  ........(.......
00000030: 0000 0000 4000 0000 0000 4000 0b00 0100  ....@.....@.....
```

Controle GABI de HELF Header`e_ident`占 16 字节,包含 `7f 45 4c 46`(魔数,即识别文件格式的固定字节) 类别 2(64位) DATA编码 1(小端) 版本 1、OS ABI 0(System V)及填充──

Depois,`e_type`de `0x0001`Indicar`ET_REL`, é possível re-localizar o seu objetivo.`e_machine`de `0x003e`Por 62, é`EM_X86_64` O objetivo não tem ponto de entrada, portanto `e_entry`Por isso, não há um processo.`e_phoff`Por isso, não.`e_shoff`Por`0x428`, é o movimento dos documentos do quadro.`e_ehsize` `0x40`- Não.`e_phentsize`0`e_phnum`0`e_shentsize` `0x40`- Não.`e_shnum` `0x0b`(11 个节头), bem como `e_shstrndx` `0x0001`- Não.

读取器用一次调用解析 esta linha:

```python
fields = struct.unpack_from("<HHIQQQIHHHHHH", data, 16)
```

字符串对应应从左到右读取的 gABI图:两个半字、一个字、三个 8字节值、一个字、六个半字──读取器拒绝魔数、类别或字节序不符的文件,也拒绝不符合 64 和 56 的`e_shentsize`Ou `e_phentsize`△ amplitude Uma vez que o erro, todos os desvios posteriores são errados, portanto, o exame deve ser colocado na primeira face.

## 节头与两个字符串表

Cada capítulo é de 64 letras .`Elf64_Shdr`(GABI 图 4-8):`sh_name`- Não.`sh_type`- Não.`sh_flags`- Não.`sh_addr`- Não.`sh_offset`- Não.`sh_size`- Não.`sh_link`- Não.`sh_info`- Não.`sh_addralign`- Não.`sh_entsize`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                                                                                          `<IIQQQQIIQQ`- Não.`sh_name`É um indicador`e_shstrndx`Definição do código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de`e_shstrndx`Para 1, clang 将该节命名`.strtab`, portanto, a mesma lista de armazenamento em simultâneo

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

Indicação 0 é reservado de espaço em questão.`.text`Em documentos de mudança`0x40`处存放 159 字节代码,紧接文件头,标志为`A`(在内存中分配) e `X`(可执行)`.rodata`存放 80 字节只读数据──`.rodata.str1.1`存放五个标签符串 `F\0D\0C\0B\0A\0`,共 10 字节, 标志为`M`(可合并) e `S`Não sei.

`.comment`存放 47 字节的编译器标记 `\0Apple clang version 17.0.0 (clang-1700.6.3.2)\0`- Não.`.llvm_addrsig`de tipo é`0x6fff4c03`, localizado em gABI , reservado para sistemas operacionais de tipo especial .`SHT_LOOS`- Não .`SHT_HIOS`范围内,LLVM 的 `ELF.h`Deu-lhe o nome.`E`Por`SHF_EXCLUDE`, portanto, o enlace vai abandoná-lo.

`sh_link`和 `sh_info`两列是表之间的指针──`.rela.text`de `sh_info`Por dois`sh_link`Por 10: ele corrigir o 2o parágrafo, e obter o símbolo do 10o parágrafo.`.symtab`de `sh_link`为 1,指向符号名称字符串表;`sh_info`Nove, representa o primeiro índice de símbolos não locais.`sh_addr`Não há nenhum endereço, o endereço é distribuído pelo linker.

As duas regras do gABI permitem que o leitor possa desenhar um arquivo completo.

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

Três espaços em dez letras, todos para sermos juntos.`.rodata`de `sh_addralign`Por isso,`0xe0`Não é?`0xdf`Começa.`.symtab`É preciso ter 8 requisitos, portanto.`.comment`后有七字节未使用──节头表本身也按8字节对齐──

`SHT_NOBITS`类型节完全不占文件字节,因此映射会跳过它们.`.bss` pertence a esta categoria; se o leitor está lá `sh_size`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,

## 符号:绑定、类型、属节、值与大小

`Elf64_Sym`占 24 字节 ((gABI 图 4-18):`st_name`- Não.`st_info`- Não.`st_other`- Não.`st_shndx`- Não.`st_value`- Não.`st_size`, formato para`<IBBHQQ`- Não.`st_info`打包了两个字段:高四位为绑定属性,低四位为类型──gABI 定义的绑定为 `STB_LOCAL`0`STB_GLOBAL`1`STB_WEAK`2 , tipo `STT_NOTYPE`0`STT_OBJECT`1`STT_FUNC`2`STT_SECTION`3`STT_FILE`4 `st_other`De baixo em baixo, tudo aqui.`STV_DEFAULT`0:

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

Indicação 0 é um símbolo não definido.`st_shndx`指定定義符号的节, há outros três valores de reserva:`SHN_UNDEF`0 、 para uso em documentos `SHN_ABS` `0xfff1`, bem como `SHN_COMMON` `0xfff2`△节符号名称为空, portanto `llvm-objdump`会打印节本身的名称,读取器也如此处理──gABI 规定所有具有STB_LOCAL 绑定符号都排在弱符号和全局符号之前,这里体现为前九行,也正因此 `.symtab`Em`sh_info`- Não, não.

Em redefinir o objetivo dos documentos, devido`sh_addr`Por zero,`st_value`É o movimento do símbolo no seu segmento.`sh_offset + st_value - sh_addr`,长度为 `st_size`- Não .

```python
section = elf.sections[symbol.st_shndx]
file_offset = section.sh_offset + (symbol.st_value - section.sh_addr)
code = elf.data[file_offset : file_offset + symbol.st_size]
```

Para o`percent_change`E, em outras palavras,`0x40 + 0`,16 个字节为 `85 ff 74 09 29 fe 6b c6 64 99 f7 ff c3 31 c0 c3`◊ Grandeza e posição de partida são igualmente importantes`grade`Em`.text`De um movimento`0x3e`É o fim.`66 90`É um complemento de composição.`nop`Air Operating instrução, para fazer`total`De`0x40`Esse 16 caracteres de limite começam. Estes dois caracteres não pertencem a nenhum símbolo.`st_size`Como condição de suspensão do reestruturação, o 36o curso bloqueia estes preenchimentos antes dos resultados da comparação de reconstrução.

## 重定位:零字节 significa o que

`Elf64_Rela`占 24 字节 ((gABI 图 4-23):`r_offset`- Não.`r_info`E tem símbolos.`r_addend`, formato para`<QQq` Re-localização registros descrever a ligação quando precisa de reparação de localização e método de cálculo.`r_info`- Não .`ELF64_R_SYM(i)`Por`i >> 32`- Não .`ELF64_R_TYPE(i)`Por`i & 0xffffffff`                                                                                                                                                                                                                                                              `r_offset`É um show de`sh_info`O tipo de nome e fórmula provêm de x86-64 psABI Tabela 4.9, entre eles `S`É um símbolo,`A`É um número,`P`É a posição de reparação,`L`É processo de ligação`R_X86_64_64`Por`S + A`- Não .`R_X86_64_PC32`Por`S + A - P`- Não .`R_X86_64_PLT32`Por`L + A - P`- Não.

- O 1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

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

- Desfeito.`0x36`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `grade`Interior, posterior abrangência `0x10`- Não .`0x3e`- Não.`0x33`As instruções são:`48 8d 0d 00 00 00 00`, é calculado RIP relativa ao endereço `lea`,其四字节位移位于 `0x36` O processador será transferido para o endereço da ordem `0x3a`- Não.

编译器希望结果为 `.rodata + 0x14`, lá é um contendo cinco 32 bits .`1, 2, 3, 4, 4`O valor de armazenamento deve ser`(.rodata + 0x14) - 0x3a`△ fórmula `S + A - P`Em`P = 0x36`- Não .`.rodata + A - 0x36`令两者相等可得 `A = 0x14 - 4 = 0x10` Adição contém quatro caracteres entre o objetivo de deslocamento e o fim da instrução.

É um show de clanges.`grade`- Não .`switch`Como é que o código é usado?`0x66666667`和两次移位计算 `score / 10`, reduza 6、 comparar com 4, e então indexa o quadro──-O1 ELF                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `.rodata`Mais um número, só o mesmo código de origem arm64 construirá o nome dele.`l_switch.table.grade`第二条记录位于 `grade_label`de `0x84`, direcção`.rodata + 0x28`处第二张由 8 字节值组成的表──第三条位于 `0x93`, direcção`.rodata + 0x0`, é`labels.rel`De ponta de cima.

五条 `.rela.rodata`记录填充 `labels.rel` Cada item está em deslocamento`4i`- É isso mesmo.`4i`, portanto `S + A - P`化简为字符串地址减去表基址──`grade_label`- Não .`movslq`读取条目,再加回表基址,就得到指针.`.rodata.str1.1`, adicionar o número para 0, porque o`F`O primeiro capítulo do episódio começou.`.L.str.1`- Não .`.L.str.4`, são compiladores para .`D`- Não.`C`- Não.`B`- Não.`A`O produto é produzido em uma área de produção.

O mesmo código-fonte é composto em três diferentes tipos de gráficos.

| 构建 | `labels` 的位置 | `grade` 如何选择 | `grade_label` 如何到达 `grade` |
|---|---|---|---|
| -O0 | `.data`，五个 8 字节指针，五条 `R_X86_64_64` 记录 | `.rodata` 中的跳转表：五条指向 `.text` 的 `R_X86_64_PC32` 记录 | 带有 `R_X86_64_PLT32 grade-0x4` 的调用 |
| -O1 | `.rodata` 中的 `labels.rel`，五个 32 位相对条目 | `.rodata+0x14` 处的值表，一条 `R_X86_64_PC32` | 已内联，没有调用 |
| -O2 | 与 -O1 相同 | 与 -O1 相同 | 已内联，`total` 增长到 140 字节 |

Em -O0 abaixo,`switch`É um verdadeiro salto, cinco artigos dividindo-se.`.text`Em meio`+0x91`- Não.`+0x8c`- Não.`+0x87`- Não.`+0x82`和 `+0x86`- Não.`grade`O que é que é?`-0x4`Adição, causa e`lea`Paralelamente, no -O1 abaixo, otimizador encontra cada porção de todas as voltas para o volume normal, e então utiliza o resultado para saltar em substituição.

## 程序头:Loader's视图

Não há um processo de redefinição, portanto.`e_phnum`Para executar os documentos e partilhar os objetivos dos documentos, contém o título do programa, o carregador apenas lê estas informações.`Elf64_Phdr`占 56 字节 ((gABI 图 5-1):`p_type`- Não.`p_flags`- Não.`p_offset`- Não.`p_vaddr`- Não.`p_paddr`- Não.`p_filesz`- Não.`p_memsz`- Não.`p_align`, formato para`<IIQQQQQQ`△GABI 为 `PT_LOAD`条目规定三条规则:按 `p_vaddr`升序排列;`p_memsz`Grande`p_filesz`de parte com zero preenchimento;`p_vaddr`Com`p_offset`Para o`p_align`- Não.

Cada um dos objetivos desta série é um programa que você construiu sozinho, e este Mac não pode ser usado.`ledger.o`O Linux é um sistema de ligação de arquivos executáveis.`tiny-x86_64`- Não .`code/fixtures/build_tiny_elf.py`- É o que eu faço .`struct.pack`Escrever 736 字节──文件包含 ELF 文件头,两个程序头,36 字节的`_start`、3 字节 `.rodata`、 símbolos e seis partes de cabeça.`_start`À dossiê descrição 1 写入 `ok\n`, então em código de estado 42  saída. Pode funcionar no Linux x86-64; aqui, é cobrir o programa de teste de processamento de roteiro.

```text
Program headers:
  PT_LOAD          r-x offset=0x0 vaddr=0x400000 filesz=0x2e0 memsz=0x2e0 align=0x1000
  PT_GNU_STACK     rw- offset=0x0 vaddr=0x0 filesz=0x0 memsz=0x0 align=0x10

entry 0x4000b0 is file offset 0xb0 through PT_LOAD
```

Único .`PT_LOAD`O processo de transferência de dados para o site de um site de Internet`0x400000`△ Reader                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `PT_LOAD`, re-compute`p_offset + (address - p_vaddr)`, que pode ser mapeado para o file shift.`0 + (0x4000b0 - 0x400000) = 0xb0`É verdade .`.text`De ponta de cima.

É o que é real.`address_to_file_offset`背后的计算──对 Ghidra 目标,该工具返回 `{address, file_offset}`O Hopper                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `provider_file_offset`和 `image_base_file_offset` O instrumento requer uma cópia completa do documento original, e a cópia do SHA-256 deve corresponder ao objetivo.`inspect_binary_layout`                                                                                                                                                                                                                                                              

O processo também explica por que os documentos executáveis ainda podem ser executados após a separação da informação.`e_shoff`Os instrumentos de um processo de transformação não veem o seu conteúdo, e o carregador nunca depende desses processos.

## Conceptos de resposta de Mach-O

A Apple não publicou a edição de texto de Mach-O.`EXTERNAL_HEADERS/mach-o/loader.h`- Não.`nlist.h`和 `reloc.h`- Não.`ledger-arm64-O1.o`Por um só .`ledger.c`Utilização `clang -target arm64-apple-macos -O1 -fno-asynchronous-unwind-tables -c`Construção.

`mach_header_64`占 32 字节:`magic`- Não.`cputype`- Não.`cpusubtype`- Não.`filetype`- Não.`ncmds`- Não.`sizeofcmds`- Não.`flags`- Não.`reserved`- Não, não.`0xfeedfacf`, é`MH_MAGIC_64`- Não.`cputype`Por`0x0100000c`, é`CPU_TYPE_ARM64`- Não.`filetype`Por 1`MH_OBJECT`- Não.`ncmds`Por 5`sizeofcmds`Por 616:carga de ordem ocupando o file head                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 `{cmd, cmdsize}`Começo.`0x2000`Por`MH_SUBSECTIONS_VIA_SYMBOLS`- Não.

```text
Load commands:
  0 LC_SEGMENT_64                cmdsize=472 at 0x20
  1 LC_BUILD_VERSION             cmdsize=24 at 0x1f8
  2 LC_LINKER_OPTIMIZATION_HINT  cmdsize=16 at 0x210
  3 LC_SYMTAB                    cmdsize=24 at 0x220
  4 LC_DYSYMTAB                  cmdsize=80 at 0x238
```

`LC_SEGMENT_64`0x19)对应 ELF 的两张表――其`segment_command_64`包含 `segname`- Não.`vmaddr`- Não.`vmsize`- Não.`fileoff`- Não.`filesize`- Não.`maxprot`- Não.`initprot`- Não.`nsects`和 `flags`O mesmo comando está em cima.`nsects`条   `section_64`记录,每条 80 字节──`loader.h`Sobre o`MH_OBJECT`Como diz a nota, estes episódios estão em um episódio sem nome, um episódio sem nome,`fileoff`Por 648,`filesize`456, contém cinco partes.

```text
  Idx Section                    Addr   Size Offset Reloff Nreloc Type
    1 __TEXT,__text               0x0   0xd0    648   1104      6 S_REGULAR
    2 __DATA,__const             0xd0   0x28    856   1152      5 S_REGULAR
    3 __TEXT,__cstring           0xf8    0xa    896      0      0 S_CSTRING_LITERALS
    4 __TEXT,__const            0x108   0x40    912      0      0 S_REGULAR
    5 __LD,__compact_unwind     0x148   0x80    976   1192      4 S_REGULAR
```

Cada episódio passa .`segname`Indicando que é um segmento, portanto, dois nomes são:`__const`Não é o mesmo.`__DATA,__const`, outro é .`__TEXT,__const` Re-estabelecer`reloff`和 `nreloc`按节存放;ELF 则为每目标节设置单独 `.rela.X`- Não.

Cada um`relocation_info`O que é que é?`r_address`, seguido por um 32 bits, 打包为 `r_symbolnum`(título de artigo 24.o)`r_pcrel`(1 位)`r_length`(2 位)`r_extern`(1 位) e `r_type`(4 位) 六条`__text`O registro é um trio .`ARM64_RELOC_PAGE21`Com`ARM64_RELOC_PAGEOFF12`, cada vez que se refere a um`adrp`- Não .`add`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `lea`O efeito, portanto, para cada citação são necessárias duas notas.`__DATA,__const`记录为 `ARM64_RELOC_UNSIGNED`- Não .`r_length`Por isso, cada artigo modifica um 8 字节绝对指针.

Em -O1 Abaixo, arm64  Construir `labels`Conservar para indice comum, enquanto x86-64 construção gerou a relação de forma.

`LC_SYMTAB`(0x2) contém `symoff`1240`nsyms`17`stroff`1512`strsize`176.1512 + 176 etc.`nlist_64`占 16 字节:`n_strx`- Não.`n_type`- Não.`n_sect`- Não.`n_desc`- Não.`n_value`- Não.`n_type`É um lugar de interesse.`N_TYPE`(掩码)`0x0e`) igual a `N_SECT`(`0xe`),表示符号定义在序号为 `n_sect`Já está a começar.`N_EXT`(`0x01`) marque o símbolo externo:

`nlist_64`Não há grandes números.`_percent_change`O que é que você está fazendo?`0x18`de `_grade`O símbolo C tem um guia.`_`, portanto , função`_percent_change`- Não.

`LC_DYSYMTAB`(0xb) registado com ELF `sh_info`Paralelas de prioridade de código local:`ilocalsym`0`nlocalsym`13`iextdefsym`13`nextdefsym`4 `LC_BUILD_VERSION`0x32)                          `XXXX.YY.ZZ`整数记录 `platform`1 ((macOS)`minos`26.0 e `sdk`26.2 ― Como esta ordem, arm64 具 deve ser submetido em formato de字节; em Mac de outro SDK, a construção irá produzir diferentes documentos ―

读取器的                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `compare_formats`A partir de agora, a Comissão irá apresentar um relatório sobre a situação dos trabalhadores.

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

rea     `inspect_macho`读取 Mach-O,该工具经由 `xcrun`运行 `otool -h -l`- Não.`nm -gjU`- Não.`dyld_info -imports -exports`和 `dwarfdump --uuid`O teu leitor não precisa destas ferramentas, mas vai ler com ele.`otool -l`输出相同 `symoff`和 `stroff` área de `open_binary`工具通过魔数识别 ELF、MZ、PE, bem como单架构或通用Mach-O, também irá automaticamente ler desvio de 18 处 `e_machine`É o que você está fazendo aqui. Para não ter um arquivo, é preciso fornecer.`format: raw-binary`、 arquitetura e entrada.  Ghidra  fornecedor  rejeitar o uso geral de documentos, requisito primeiro de obter um único arquitetura  seu leitor `0xcafebabe`时也这样处理── Não é assim.

## Autoconstrução

运行仅使用标准库的读取器:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch
python3 code/main.py
```

演示读取 `ledger-x86_64-O1.o`, output file head、节、符号、重定位和文件偏移映射; em seguida, output four functions 字节串,读取 `ledger-arm64-O1.o`Não é o resultado da comparação; final`tiny-x86_64`O processo inicial e o resultado prévio incluem:

```text
percent_change: 16 bytes at file offset 0x40: 85 ff 74 09 29 fe 6b c6 64 99 f7 ff c3 31 c0 c3
grade: 46 bytes at file offset 0x50: 48 63 c7 48 69 c0 67 66 66 66 ...
entry 0x4000b0 is file offset 0xb0 through PT_LOAD
```

传入路径可读取单个文件:`python3 code/main.py code/fixtures/ledger-x86_64-O0.o`△读取器根据前四字节选择 ELF 或 Mach-O──

按以下顺序阅读 `code/main.py`- Não .

1. `ElfFile._read_header()`检查魔数、类别、字节序和条目大小, então desembarca o documento.
2. `ElfFile._read_sections()`Com`read_cstring()`读取节头表,并通过 `e_shstrndx`解析名称──
3. `ElfFile._read_symbols()`- Desmontar .`st_info`, através de `sh_link`解析名称,并保持保留节索引可读──
4. `ElfFile._read_relocations()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `SHT_RELA`- Despejam.`r_info`,并依据表 4.9 为类型命名──
5. `ElfFile.function_span()`Com`function_bytes()`Transformar os símbolos em um arquivo de alcance e seus caracteres.
6. `ElfFile.file_offset_map()`按偏移排序每个结构,并补入未使用空间──
7. `ElfFile._read_program_headers()`Com`address_to_file_offset()`处理可执行文件──
8. `MachOFile`读取文件头,加载命令,包含节的`LC_SEGMENT_64`- Não.`LC_SYMTAB`- Não.`LC_BUILD_VERSION`, e a re-localização de cada capítulo.
9. `compare_formats()`Utilizando dois documentos para mostrar o valor de um mesmo conceito de relação.

## Use-o

Em um curso seguinte, primeiro vai ser o curso.`code`Agora é o meu ano.`sys.path`, novamente através de`from main import ElfFile`导入读取器──第 33 课会请求 `function_bytes`和 `relocations_for(".text")` § 35 课将其输出记录为观察证. § 36 课获重定位偏移,以便在字节比较前屏蔽相应位置.

Usar o mesmo.`clang -target x86_64-unknown-linux-gnu -c`命令,将自己编译为目标文件,再用读取器分析――只有 x86-64 psABI 表 4.9 列出的重定位名称才可添加;只有 gABI 或生成文件的工具链文档记载的节类型才可添加──遇到没有对应名称的值时,读取器打印十六进制数,而不是猜测──

## 交互实验

### 实验 A: manual

Em`code`Agora, inicia Python:

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

O grupo mostra`e_type`- Não.`e_machine`Por 62...`e_shoff`1064, é.`0x428`                                                                                                                                                                                                                                                              `.strtab`存储节名称──

### 实验 B:switch 背后的值表

```python
rodata = elf.section_bytes(elf.section(".rodata"))
[int.from_bytes(rodata[i : i + 4], "little") for i in range(0x14, 0x28, 4)]
[int.from_bytes(rodata[i : i + 8], "little") for i in range(0x28, 0x50, 8)]
[r for r in elf.relocations_for(".text") if r.symbol == ".rodata"]
```

两张表都读出 `1, 2, 3, 4, 4`- Não.`ledger.c`检查:`grade(65)`计算 `65 / 10 - 6 = 0`,读取条目 0, get 1,即 `case 6`O valor é:`grade(100)`读取条目 4, get 4,即 `case 10`Com`case 9`Valor de uso comum.

### 实验C: três formas de construção do mesmo código

```python
for level in ("O0", "O1", "O2"):
    obj = ElfFile.from_path(FIXTURES / f"ledger-x86_64-{level}.o")
    print(level, [s.name for s in obj.sections if s.name in (".data", ".rodata")])
    print(level, sorted({r.type_name for r in obj.relocations}))
    print(level, {s.name: s.st_size for s in obj.symbols if s.type == "FUNC"})
```

- O0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `.data`节和三种重定位类型──-O1与-O2 目标文件没有 `.data`, e há apenas um tipo:`total`Em -O0 下为 66 字节,-O1 下为 31 字节,-O2 下为 140 字节──

### 实验 D:Mach-O 中的相同函数

```python
from main import MachOFile
macho = MachOFile.from_path(FIXTURES / "ledger-arm64-O1.o")
[(c.name, c.cmdsize) for c in macho.load_commands]
macho.function_span("_percent_change")
macho.function_bytes("_percent_change")[:4].hex()
```

函数范围为文件偏移 648 处的24 字节──前四个字节是 `a0000034`, é um ordenamento .`0x340000a0`Como é que é?`llvm-objdump -d`A produção e a exportação`cbz w0, 0x14`É isso.`before == 0`O que é o código de segurança?`85 ff 74 09`É o mesmo que o exame.

## 实践实验

扩展读取器,使其支持已链接程序──在 Linux x86-64 机器上,运行 `clang -O1 -shared -fPIC code/fixtures/ledger.c -o libledger.so`, e adicionado `main`后运行   后运行 `clang -O1 code/fixtures/ledger.c -o ledger_main`Depois, usamos um leitor para analisar estes dois documentos.

要求:

- Usando o mesmo.`Elf64_Sym`布局读取 `.dynsym`Porque ...`SHT_DYNSYM`Por isso, o formato do registro não muda.
- - Não .`.dynamic`读取为由 `d_tag`和 `d_val`组成   composição `Elf64_Dyn`记录,并依据 gABIDynamic Section页面命名 `DT_NEEDED`- Não.`DT_STRTAB`- Não.`DT_SYMTAB`- Não.`DT_RELA`和 `DT_JMPREL`- Não.
- - Não .`st_shndx`Por`SHN_UNDEF`Of undefined符号列为导入项,将 `.rela.plt`Em meio`R_X86_64_JUMP_SLOT`记录列为到达它们调用位置.
- De acordo com o GABI, um documento-alvo contém uma ou mais regras, cada um deles será`PT_LOAD`段映射到其含的节──
- - Não .`address_to_file_offset`prova, compartilhar objetivos de arquivo em cada função definida`function_bytes`O valor de devolução é o mesmo.
- - Não .`llvm-objdump -h -t -r -p`和 `llvm-objdump -T`文本采集到 `code/fixtures/`, e comparar em teste com o leitor.

É necessário que o sistema de avaliação seja efetuado de forma adequada e eficaz.

## 本课产物

本课产 出 `outputs/skill-program-anatomy-elf-from-scratch.md` Pode ser usado em Claude, Cursor, Codex, OpenClaw, Hermes ou qualquer outro sistema inteligente de SKILL.md.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

测试套件验证 Os seguintes fatos:

- Três x86-64  objetivos e micro-arquivos executáveis, cada secção de índice, nome, tamanho, endereço e tipo de tudo e de coleta `llvm-objdump -h`文本一致
- Cada símbolo tem um valor, um tipo, um tipo, um tipo, um tamanho, um nome, um conjunto.`llvm-objdump -t`文本一致
- Cada desvio de reubicação, tipo de nome, símbolo e número são todos com a coleta.`llvm-objdump -r`文本一致, incluindo -O0 下的 `R_X86_64_PLT32`和 `R_X86_64_64`
- `tiny-x86_64`Os dois principais procedimentos são de recolha.`llvm-objdump -p`文本一致,而目标文件没有程序头
- `percent_change`位于文件偏移 `0x40`, 长度 16 字节, 字节 符合预期,且每个函数都位于 `.text`Interior
- 文件偏移映射恰好覆盖每件的每字节一次,且 -O1 目标文件的三个对齐空隙位置正确
- `tiny-x86_64`O ponto de entrada é através`PT_LOAD`映射到文件偏移 `0xb0`, e pode ser re-localizado .
- Mach-O 文件头、每条加载命令、段、五节、`LC_SYMTAB`和 `LC_BUILD_VERSION`Cidades e colheitas`--private-headers`文本一致
- Mach-O símbolo com 15 条重定位都与采集的`llvm-objdump`文本一致,且 `_percent_change`位于偏移 648,长度 24 字节
- 错误魔数、32位类别、大端文件、截断表、通用二进制文件和C 源文件都会触发 `FormatError`
- `build_tiny_elf.py`逐字节复现已提交的 `tiny-x86_64`
- 图示模块 `site/figures-re-32.js`包含 `ledger-x86_64-O1.o`É um bom exemplo.

## Modelo de falha no ambiente de produção

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

读取可信的文件头, em função da sua estrutura de localização de desvio,并根据定义字段的规范为每个字段命名. 读取可信的文件头,并根据定义字段的规范为每个字段命名. 读取可信的文件头,并根据定义字段的规范为每个字段命名. 读取可信的文件头,并根据定义字段的规范为每个字段的规范为每个字段的规范. 读取可信的文件头,并根据定义字段的规范为每个字段的规范为每个字段的规范. 读取可信的文件头,并根据定义字段的规范为每个字段的规范. 读取可信的文件头,并根据定义字段的规范为每个字段的规范,并根据定义字段的规范为每个字段的规范,并根据定义字段的规范为每个字段的规范,并根据规范的规范为每节的规范,当规范没有为某个值命名时,就就打印数值为数值.

## 延伸阅读

- [System V gABI, 第 4 章：目标文件](https://www.sco.com/developers/gabi/latest/ch4.intro.html)Com o [ELF Header](https://www.sco.com/developers/gabi/latest/ch4.eheader.html)- Não .[Sections](https://www.sco.com/developers/gabi/latest/ch4.sheader.html)- Não .[Symbol Table](https://www.sco.com/developers/gabi/latest/ch4.symtab.html), com[Relocation](https://www.sco.com/developers/gabi/latest/ch4.reloc.html)Página
- [System V gABI, 第 5 章：程序头](https://www.sco.com/developers/gabi/latest/ch5.pheader.html)Com[Dynamic Linking](https://www.sco.com/developers/gabi/latest/ch5.dynamic.html)
- [System V ABI, AMD64 Architecture Processor Supplement](https://gitlab.com/x86-psABIs/x86-64-ABI), Tabla 4.9: Tipo de re-localização
- [Apple XNU `loader.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/loader.h)- Não .[`nlist.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/nlist.h), com[`reloc.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/reloc.h)
- [17 U.S.C. 1201](https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title17-section1201&num=0&edition=prelim)Com[Directive 2009/24/EC](https://eur-lex.europa.eu/eli/dir/2009/24/oj/eng)
- [Sega v. Accolade, 977 F.2d 1510](https://law.resource.org/pub/us/case/reporter/F2/977/977.F2d.1510.92-15655.html)Com[Sony v. Connectix, 203 F.3d 596](https://law.resource.org/pub/us/case/reporter/F3/203/203.F3d.596.99-15852.html)
- [rea 6.5.0 `docs/binary-diagnostics.md`](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/binary-diagnostics.md)Com[`docs/ghidra-provider.md`](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/ghidra-provider.md)
