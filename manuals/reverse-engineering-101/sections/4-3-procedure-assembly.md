# procedure_assembly

> procedure_assembly 把一个函数的 Ghidra Listing 文本作为字符串返回，每行一条指令，地址在前，不含字节。

你想看到 `grade` 里除以十在处理器眼里的样子。C 源码写的是 `score / 10`。arm64 代码里根本没有除法指令，而读懂为什么，正是汇编教的第一件事。

读完本节后，你能读 `_grade` 的 15 条指令，把它们拆成三块，并解释乘以 `0x66666667`。

## 这次调用与这段文本 {#s-procedure-assembly-the-call-and-the-text}

```listing
title: procedure_assembly for _grade
source: capture/out/10-mcp-06-procedure-assembly-grade.json
lang: json
note: The request arguments and the start of the result. The result is one string with newlines, cut after the second line.
---
"name": "procedure_assembly",
"arguments": {
  "procedure": "_grade"
}
…
"normalized_result": "0x100000518: mov w8, #0x6667\n0x10000051c: movk w8, #0x6666, LSL #16\n…
```

桥解析该过程，不加限制地扫描其指令，把每一条渲染成文本，并附上任何不返回调用的警告。记录带着限制 "Assembly is Ghidra Listing text and does not claim textual equivalence with Hopper output."。这段文本是 Ghidra 的渲染，所以寄存器名、立即数与间距跟 Ghidra，不跟 clang 或 `llvm-objdump`。

[第 4.6 节](#s-analyze-function-and-pseudocode) 的 dossier 以数组形式带着同样的行，读起来更容易。

```listing
title: the fifteen instructions of _grade
source: capture/out/06-function-grade.json
lang: json
note: The assembly array of the dossier, complete.
---
"assembly": [
  "0x100000518: mov w8, #0x6667",
  "0x10000051c: movk w8, #0x6666, LSL #16",
  "0x100000520: smull x8, w0, w8",
  "0x100000524: lsr x9, x8, #0x3f",
  "0x100000528: asr x8, x8, #0x22",
  "0x10000052c: add w8, w8, w9",
  "0x100000530: sub w8, w8, #0x6",
  "0x100000534: cmp w8, #0x4",
  "0x100000538: b.hi 0x10000054c",
  "0x10000053c: adrp x9, 0x100000000",
  "0x100000540: add x9, x9, #0x7d0",
  "0x100000544: ldr w0, [x9, w8, UXTW #0x2]",
  "0x100000548: ret",
  "0x10000054c: mov w0, #0x0",
  "0x100000550: ret"
],
```

## 读这十五条指令 {#s-procedure-assembly-reading-the-fifteen-instructions}

参数 `score` 到达 `w0`，也就是 `x0` 的低 32 位，结果从 `w0` 离开。把这段文本分成四组来读。

前两行构建一个常量。`mov w8, #0x6667` 设置低半，`movk w8, #0x6666, LSL #16` 插入高半，于是 `w8` 是 `0x66666667`。

接下来四行在没有除法的情况下除以十。`smull x8, w0, w8` 把两个 32 位值乘成 64 位积。`asr x8, x8, #0x22` 把积右移 34，`lsr x9, x8, #0x3f` 取其符号位。`add w8, w8, w9` 加上符号位，这对负分数校正舍入。结果是带 C 截断的 `score / 10`。[第 34 课](phases/13-tools-and-protocols/34-lifting-to-pseudocode) 证明，对每一个 32 位 `int`，`0x66666667` 与一次移 34 都给出那个商。

接下来三行是 switch。`sub w8, w8, #0x6` 把情形 6 到 10 变成索引 0 到 4。`cmp w8, #0x4` 与 `b.hi 0x10000054c` 把任何大于 4 的索引送到默认。比较是无符号的，所以负分数给出负索引，也走到默认。那是一条指令在做 `default` 标签与低于 6 的情形的工作。

最后六行是两次返回。`adrp x9, 0x100000000` 与 `add x9, x9, #0x7d0` 组成地址 `0x1000007d0`，也就是[第 3.2 节](#s-inspect-binary-layout-and-the-load-image) 里 `__TEXT,__const` 的起点。`ldr w0, [x9, w8, UXTW #0x2]` 加载该地址加上四倍索引处的 32 位字。文件偏移 2000 上的 20 字节是小端字形式的 `1, 2, 3, 4, 4`，所以这次加载返回等级。默认路径是 `mov w0, #0x0` 与 `ret`。

```figure
id: fig-4-4
kind: state
title: the three blocks of _grade
claim: Ghidra's basic_blocks split the fifteen instructions at the one conditional branch, and both leaf blocks end in ret with no successor.
caption: Read from the top block. The arrows are the two successors of the first block, and each leaf block has an empty successors list. From capture/out/06-function-grade.json.
```

**基本块：** 一段指令，顶部一个入口，底部一个出口。控制只在第一条指令进入，只在最后一条之后离开。dossier 的 `basic_blocks` 为 `_grade` 列出三个：`0x100000518` 到 `0x10000053c`，后继是 `0x10000053c` 与 `0x10000054c`，以及两个没有后继的叶块。[第 33 课](phases/13-tools-and-protocols/33-disassembly-and-control-flow) 构建从字节产生同一划分的解码器与块分割器。

## 同一个函数在 x86-64 上 {#s-procedure-assembly-the-same-function-on-x86-64}

```listing
title: grade in the x86-64 object
source: capture/out/06-function-grade-x86_64-O1.json
lang: json
note: The assembly array of the x86-64 dossier, complete. Ghidra renders x86 in Intel syntax with uppercase mnemonics.
---
"assembly": [
  "0x100010: MOVSXD RAX, EDI",
  "0x100013: IMUL RAX, RAX, 0x66666667",
  "0x10001a: MOV RCX, RAX",
  "0x10001d: SAR RCX, 0x22",
  "0x100021: SHR RAX, 0x3f",
  "0x100025: ADD ECX, EAX",
  "0x100027: ADD ECX, -0x6",
  "0x10002a: XOR EAX, EAX",
  "0x10002c: CMP ECX, 0x4",
  "0x10002f: JA 0x0010003d",
  "0x100031: MOV EAX, ECX",
  "0x100033: LEA RCX, [0x1000b4]",
  "0x10003a: MOV EAX, dword ptr [RCX + RAX*0x4]",
  "0x10003d: RET"
],
```

十四条指令，同样的形状。乘法是一条指令，`IMUL RAX, RAX, 0x66666667`，两次移位还是 34 与 63。`XOR EAX, EAX` 在比较之前把默认返回值设为零，所以默认路径不需要额外的块，函数只有一个 `RET`。表在 `0x1000b4`，也就是 `.rodata` 加 `0x14`。listing 把那个地址显示成一个普通数字，因为 Ghidra 在加载目标文件时应用了重定位。[第 4.6 节](#s-analyze-function-and-pseudocode) 会回到那行 `XOR`，因为反编译器写它的方式把那个零藏了起来。

## 不返回警告放在哪里 {#s-procedure-assembly-where-the-no-return-warnings-go}

对 `_grade`，`raw_result.limitations` 是空的。当一个函数调用某个 Ghidra 标为永不返回的东西时，扫描可以在那里停下，这份列表就点名调用点。在 macOS 与 Linux 上，rea 在导入之后跑一段修复脚本。它清除六个常见库名上错误的不返回标志，所以你在这里读到的函数体是修复过的。文档陈述留下标志的效果。一次被 Ghidra 推断为不返回的调用，可以在它后面的字节之前结束函数体 {{ghidra §Admitted function-analysis semantics}}。

```takeaways
- 按组读汇编：常量、算术、比较与分支、返回。
- 把一次减法之后的无符号比较当作也会拒绝负数的边界检查。
- 点名一对 `adrp` 与 `add` 指向的表，然后在文件偏移处读它的字节。
- 在信任函数体大小之前，检查 `raw_result.limitations` 里有没有终端调用。
```

Sources: capture/out/10-mcp-06-procedure-assembly-grade.json, capture/out/06-function-grade.json, capture/out/06-function-grade-x86_64-O1.json, capture/out/04-inspect-macho.json, capture/fixtures/ledger-arm64-O1, capture/fixtures/ledger.c; rea 6.7.0 at 27dc42d: bridge/ghidra/ReaGhidraBridge.java, src/ghidra/GhidraProviderCapabilities.ts; rea docs/ghidra-provider.md
