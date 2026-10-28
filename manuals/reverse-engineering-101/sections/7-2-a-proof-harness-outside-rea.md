# A proof harness beyond compare_functions

> compare_functions 对 Ghidra 文本做按行 diff，所以重建函数的相等性需要一个 harness：在一个输入网格上跑两者，并在掩码重定位之后比较字节。

你从[第 4.6 节](#s-analyze-function-and-pseudocode) 的伪代码重建了 `percent_change`，保留了反编译器给出的 `long`，且十个手写测试通过。[第 7.1 节](#s-verify-reconstruction) 表明 rea 只能告诉你两段 Ghidra 文本是否匹配。你的重建等于原件的证明，必须来自你自己运行的 harness。[第 36 课](phases/13-tools-and-protocols/36-rebuild-and-prove-equal) 用 Python 标准库建了一个。

捕获套件在 `ledger-x86_64-O1.o` 上跑了那个 harness，并在 `17-` 下录了四个文件。读完本节后，你能在自己的重建上跑 harness 的两条腿，并读不匹配行与字节报告。然后你能说出每一次失败点名的是哪一类危害或哪一次重定位。

## compare_functions 能看见什么 {#s-a-proof-harness-outside-rea-what-compare-functions-can-see}

`compare_functions` 在八个维度比较两份 `analyze_function` 记录：`identity`、`pseudocode`、`assembly`、`comments`、`calls`、`references`、`strings_names` 与 `cfg`（[捕获](manuals/reverse-engineering-101/capture/out/10-mcp-20-compare-functions-percent-change.json)）。伪代码与汇编维度是两段字符串的有界行 diff。当 diff 超过 100 ms 或超过 10,000 次编辑时，状态是 `unknown`。汇编维度带着两个固定限制：

```listing
title: the assembly dimension of the percent_change comparison
source: capture/out/10-mcp-20-compare-functions-percent-change.json
lang: json
note: One of the eight dimension objects. The counts are characters of provider text. The digests and the text delta are cut.
---
              "dimension": "assembly",
              "left_count": 161,
              "right_count": 161,
              "evidence_links": [
                "ev_b492c85e…",
                "ev_142cc943…"
              ],
              "limitations": [
                "Exact provider text is compared without address or generated-name normalization; layout-only differences do not establish a behavior change.",
                "Assembly is opaque provider text; relocation normalization is unavailable."
              ],
              "status": "unchanged",
```

对 `total`，同一次比较在五个维度报告了 `changed`（[捕获](manuals/reverse-engineering-101/capture/out/10-mcp-21-compare-functions-total.json)）。伪代码从 300 长到 2,904 个字符，汇编从 336 长到 1,866。两份记录来自以 `-O1` 与 `-O2` 编译的同一行源码。因此文本比较对任一方向的行为都不说什么。同一个函数可以打印成不同文本，而一个错误函数可以打印成相同文本。

rea 6.7.0 没有编译器回放，也没有感知重定位的字节比较。下面两条腿是 rea 留给你的部分。

## 第一腿：执行并比较 {#s-a-proof-harness-outside-rea-leg-one-execute-and-compare}

**输入网格：** harness 喂给原件与重建的输入单元列表。每一类单元代表 listing 显示的一种危害。本课的 `input_grid()` 取十个 `before` 值与七个 `after` 值的每一对给 `percent_change`，以及 22 个分数给 `grade`，一共 92 个单元。每一个单元有一个类，该类说明它为何存在。

```listing
title: the 92 cells by hazard class
source: capture/out/17-harness-grid.json
lang: json
note: The input values and the ten naive cases are cut.
---
{
  "cells": 92,
  "classes": {
    "overflow": 32,
    "negative": 17,
    "boundary": 14,
    "plain": 12,
    "zero guard": 7,
    "negative truncation": 5,
    "beyond the switch": 2,
    "rounding": 2,
    "trap": 1
  },
  …
}
```

零守卫单元走 `before == 0` 分支。负值单元检查除法向零截断，所以 `-9 / 10` 是 0，而 `-10 / 10` 是 -1。舍入单元检查乘法发生在除法之前。溢出单元让 `(after - before) * 100` 超过 32 位。那一个陷阱单元让包装后的乘积等于 `INT_MIN`，且 `before` 等于 -1。

对 `grade`，边界单元坐在 60、70、80、90 与 100 的两侧。超出 switch 的两个单元是 110 与 `INT_MAX`。

harness 把 `ledger.c` 与每个函数的一个候选编译进一个带本课 `driver.c` 的程序。候选用 `-Dpercent_change=cand_percent_change -Dgrade=cand_grade` 重命名，所以两个版本以不同名字链接。驱动器每行读一个单元，打印两个结果，并把 `SIGFPE` 转成值 `trap`。

ELF 对象不能在录制捕获的 Mac 上运行。那里的 oracle 是以 `-O1` 本地编译的 `ledger.c`，且报告在 `original_kind: fixture-source` 里这么说。捕获跑了两对。看似合理的一对是伪代码的 `long`，即 `percent_change_wide.c`，配上四个对 90、80、70 与 60 的 `if` 语句，即 `grade_thresholds.c`：

```c
int percent_change(int before, int after) {
    if (before == 0) return 0;
    return (int)(((long)after - before) * 100 / before);
}
```

```listing
title: the plausible pair over the grid
source: capture/out/17-harness-execute-plausible.json
lang: json
note: 26 of the 28 mismatch rows are cut, and the 92 result rows are cut.
---
  "candidates": {
    "percent_change": "phases/13-tools-and-protocols/36-rebuild-and-prove-equal/code/fixtures/candidates/percent_change_wide.c",
    "grade": "phases/13-tools-and-protocols/36-rebuild-and-prove-equal/code/fixtures/candidates/grade_thresholds.c"
  },
  "original": "fixtures/ledger.c compiled with the host clang at -O1",
  "original_kind": "fixture-source",
  "host": "aarch64 Darwin",
  "arch": "aarch64",
  "naive_passed": true,
  "cells": 92,
  "mismatches": [
    {
      "function": "percent_change",
      "args": [
        3,
        2147483647
      ],
      "kind": "overflow",
      "original": -133,
      "candidate": -1431655899,
      "match": false
    },
    …
    {
      "function": "grade",
      "args": [
        110
      ],
      "kind": "beyond the switch",
      "original": 0,
      "candidate": 4,
      "match": false
    },
    …
  ],
```

全部十个朴素案例通过，且 92 个单元里有 28 个失败。26 个 `percent_change` 失败全是 `|before| > 1` 的溢出单元。原件把乘积包装到 32 位再除，而 `long` 重建除未包装的乘积。对等于 1 或 -1 的 `before`，两者偶然一致，因为 64 位商截断回包装后的值。两个 `grade` 失败是 110 与 `INT_MAX`。原件的 switch 对 11 及以上的十位数没有 case 并返回 0，而阈值重建返回 4。

相等的一对是 `percent_change_mul_first.c`，也就是 `100 * (after - before) / before`，配上原件源码 `grade_switch.c`。它在全部 92 个单元上一致，且 listing 的模型与观察到的原件在任何一处都不分歧（[捕获](manuals/reverse-engineering-101/capture/out/17-harness-execute-equal.json)）。那个文件的一行值得一看：

```listing
title: the trap cell on an arm64 host
source: capture/out/17-harness-execute-equal.json
lang: json
note: One of the 92 rows.
---
    {
      "function": "percent_change",
      "args": [
        -1,
        536870911
      ],
      "kind": "trap",
      "original": -2147483648,
      "candidate": -2147483648,
      "match": true
    },
```

差值是 536870912，32 位乘积包装到 -2147483648，除数是 -1。在 x86-64 上 `IDIV` 引发除错误异常，因为商装不进 32 位 {{spec Intel SDM Vol. 2, IDIV}}。在 AArch64 上 `SDIV` 没有陷阱，并返回 -2147483648 {{spec Arm DDI 0487, SDIV}}。报告用该行记录 `"arch": "aarch64"`，而在 Linux x86-64 主机上跑同一网格会记录字符串 `trap`。oracle 依赖体系结构，所以一次证明点名跑它的主机。

## 第二腿：重编译并比较字节 {#s-a-proof-harness-outside-rea-leg-two-recompile-and-compare-bytes}

**重定位掩码：** 在比较两个函数之前，把每一个重定位字段的字节置零。随后的两步按偏移、类型与目标节比较重定位记录，然后读每一个重定位指向的字节。本课的 `ElfObject` 用 `struct.unpack_from` 读 ELF64 对象，而 `mask_relocations()`、`prove_bytes()` 与 `read_table()` 做这三步。没有第一步，普通字节比较会拒绝表坐在另一个偏移处的正确重建。没有第三步，它会接受错误的那个。

```listing
title: grade in the original object
source: capture/out/17-harness-bytes.json
lang: json
note: One of the four function entries. The start is the offset inside .text.
---
      "grade": {
        "section": ".text",
        "start": 16,
        "size": 46,
        "bytes": "4863c74869c0676666664889c148c1f92248c1e83f01c183c1fa31c083f904770c89c8488d0d000000008b0481c3",
        "relocations": [
          {
            "offset": 38,
            "type": "R_X86_64_PC32",
            "symbol": ".rodata",
            "addend": 16
          }
        ]
      },
```

`grade` 是 46 字节，带一个在偏移 38 处的 `R_X86_64_PC32` 重定位，那是加载表地址的 `lea` 的位移。在 RELA 对象里加数活在记录里，四个字段字节是零。上面的十六进制在 `8b0481c3` 之前把它们显示为 `00000000`。目标是 `.rodata+0x10`，且因为该字段结束其指令，CPU 加 4，所以表从 `.rodata+0x14` 开始。每一个候选都用 `clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c` 编译，也就是 fixture 命令，并与这个条目比较。

```listing
title: a wrong constant passes the masked compare
source: capture/out/17-harness-bytes.json
lang: json
note: One of the eight candidate entries. The source path, the differing offsets, the masked ranges, and the two tables are cut, and the reasons line prints both tables.
---
      "candidate": "grade_case10_wrong",
      …
      "original_size": 46,
      "candidate_size": 46,
      "masked_equal": true,
      …
      "relocations_match": true,
      "relocations": [
        {
          "offset": 38,
          "type": "R_X86_64_PC32",
          "original_target": ".rodata+0x10",
          "candidate_target": ".rodata-0x4",
          "same_shape": true
        }
      ],
      …
      "status": "fail",
      "reasons": [
        "referenced constants differ: [1, 2, 3, 4, 4] vs [1, 2, 3, 4, 3]"
      ]
```

`grade_case10_wrong.c` 对 `case 10` 返回 3。其 46 个代码字节在掩码后等于原件，且其一次重定位有相同的偏移、类型与节。只有五个表条目不同。

每一个 `grade` 候选里加数都不同，`+0x10` 对 `-0x4`。原件对象在 switch 表之前持有 `grade_label` 的 `labels` 表于 `.rodata`，而候选对象没有。不同的加数是不同的偏移，所以 harness 比较记录的形状，然后经它读表。对两个正确重建，两张表都读出 `1, 2, 3, 4, 4`。

| Candidate | Source text | Size | Masked bytes | Relocation records | Table | Status |
|---|---|---|---|---|---|---|
| `percent_change_mul_first` | `100 * (after - before) / before` | 16 and 16 | equal | none | none | pass |
| `percent_change_split` | `(after * 100 - before * 100) / before` | 16 and 16 | equal | none | none | pass |
| `percent_change_wide` | 伪代码的 `long` | 16 and 26 | size differs | none | none | fail |
| `percent_change_div_first` | `(after - before) / before * 100` | 16 and 18 | size differs | none | none | fail |
| `grade_switch` | 原件的 `switch` | 46 and 46 | equal | same shape | 两侧都是 `1, 2, 3, 4, 4` | pass |
| `grade_table` | 带边界检查的 `points[slot]` | 46 and 46 | equal | same shape | 两侧都是 `1, 2, 3, 4, 4` | pass |
| `grade_thresholds` | 四个 `if` 语句 | 46 and 39 | size differs | 1 against 0 | none | fail |
| `grade_case10_wrong` | `case 10: return 3;` | 46 and 46 | equal | same shape | `1, 2, 3, 4, 4` 对 `1, 2, 3, 4, 3` | fail |

两行说明字节匹配意味着什么。`percent_change_split.c` 有不同的源文本与相同的字节，因为 clang 把有符号溢出当作未定义，并把两次乘法折成一次。`grade_table.c` 从数组索引到达与原件从 `switch` 到达的同一张表。一次匹配证明：带这些标志的这个编译器从该候选产生了相同代码。它不证明该候选是原件文本。

大小是诊断，绝不是接受条件。`percent_change_wide` 是 26 字节，因为 `movslq`、`imulq`、`cqto` 与 `idivq` 替换了 32 位形式。listing 在任何编译之前就显示了宽度。

```figure
id: fig-7-2
kind: flow
title: two legs of one proof
claim: Leg one runs the original and the candidate over 92 cells, and leg two compares 46 masked bytes, one relocation record, and five table entries.
caption: Read each column top down. Grey boxes are the harness and the compiler, which run outside rea, and green boxes are the fixture bytes. Teal is a passed check and rose is a failed one. From capture/out/17-harness-execute-plausible.json, 17-harness-execute-equal.json, and 17-harness-bytes.json.
```

```figure
id: fig-7-3
kind: decision
title: where each of the eight candidates stops
claim: Three candidates stop at the size check, one passes every byte check and fails on the table it points at, and four reach pass.
caption: Read top down. Each grey box is one check of leg two. The dashed rose boxes to its right are the candidates that fail there, with the reason the report prints. The teal boxes at the bottom passed every check. From capture/out/17-harness-bytes.json.
```

## 2026 年测量补充了什么 {#s-a-proof-harness-outside-rea-what-the-2026-measurements-add}

网格里的危害并不专属于这个 fixture。Liu、Raff 与 Micinski 在 2026 年以九种配置测量了八个反编译系统（[arXiv 2609.05370](https://arxiv.org/abs/2609.05370)）。通过基准每一个测试的候选仍在模糊输入上分歧。总体有 4.9% 发生了这种情况，在一个系统里高达 13%。测试集是 300 个库函数与 287 个带已披露漏洞的函数。那里最强的精炼模型把 Ghidra 的构建率从 75% 提到 90%，而行为匹配率从 74% 落到 62%。

他们把原因追溯到发明的字段、类型、被调者与守卫，它们替换了反编译器留下的可见未知事项。`percent_change_wide.c` 是一个发明的类型，而 `grade_thresholds.c` 是一个发明的守卫。两者都编译，两者都通过十个朴素案例，且在一个重编译并跑其所含断言的基准下都算可再执行。作者提议按函数的驱动器合成，以及从参考做模糊测试，也就是带生成网格的第一条腿。

本课为常量检查加了第三个来源。rea 证据页描述了一个重建项目，它在信任重定位目标的同时比较指令字节。源字面量 `0.0` 对目标字面量 `128.0` 通过了，直到该项目审计了 1,548 个浮点引用。`grade_case10_wrong.c` 是本手册对该缺陷的版本，而 `read_table()` 是那次审计。

```takeaways
- 从 listing 宽度写重建，然后在包装每一个中间值的网格上跑它。
- 用原件标志编译候选，并只在掩码重定位字段之后比较字节。
- 读每一个重定位指向的字节，因为错误常量能通过掩码比较。
- 每一次证明都记录主机与编译器，因为陷阱单元与字节依赖两者。
```

Sources: capture/out/17-harness-grid.json, 17-harness-execute-plausible.json, 17-harness-execute-equal.json, 17-harness-bytes.json, 17-harness.txt, 10-mcp-20-compare-functions-percent-change.json, 10-mcp-21-compare-functions-total.json, 00-versions.txt; capture/README.md; phases/13-tools-and-protocols/36-rebuild-and-prove-equal/code/main.py, driver.c, fixtures/candidates/; rea at rea-agents-6.7.0 (27dc42d): src/domain/functionComparisonDimensions.ts (Liu, Raff, Micinski, arXiv 2609.05370, 2026); Intel 64 and IA-32 Architectures Software Developer's Manual, Volume 2, IDIV; Arm Architecture Reference Manual for A-profile, DDI 0487, SDIV
