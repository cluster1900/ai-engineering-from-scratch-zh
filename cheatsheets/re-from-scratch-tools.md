---
id: re-from-scratch-tools
title: Binary Analysis Tools from Scratch
code: BA
subtitle: 读 ELF 与 Mach-O，解码 x86-64，建 CFG，提升到 C 并证明。只用 Python 标准库。
hue: 28
sources: phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch, phases/13-tools-and-protocols/33-disassembly-and-control-flow, phases/13-tools-and-protocols/34-lifting-to-pseudocode, projects/binary-inspector, projects/mini-decompiler
source_hash: 41d66339fce016da
---

## 从字节到已校验的 C
type: architecture
from: phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch/docs/en.md, phases/13-tools-and-protocols/33-disassembly-and-control-flow/docs/en.md, phases/13-tools-and-protocols/34-lifting-to-pseudocode/docs/en.md, projects/mini-decompiler/README.md

```arch
node | obj | 1,1 | Object file | ledger.c built by clang | store
node | elf | 2,1 | ELF reader | sections, symbols, rela | process
node | dec | 3,1 | Decoder | REX, ModRM, SIB | process
node | cfg | 4,1 | CFG | blocks, dominators | process
node | ir | 4,2 | Lifter | IR, flags variable | process
node | ssa | 3,2 | SSA | phi, rename | process
node | opt | 2,2 | Simplify | substitute, dead code | process
node | c | 1,2 | Structure | if, while, do while | model
edge | obj | elf | bytes
edge | elf | dec | function bytes
edge | dec | cfg | instructions
edge | cfg | ir |
edge | ir | ssa |
edge | ssa | opt |
edge | opt | c | C text
```

## 运行课程
type: command-table
from: phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch/docs/en.md, phases/13-tools-and-protocols/33-disassembly-and-control-flow/docs/en.md, phases/13-tools-and-protocols/34-lifting-to-pseudocode/docs/en.md

| 命令 | 作用 |
|---|---|
| `python3 code/main.py` (32) | 头、节、符号、重定位、映射 |
| `python3 code/main.py <object>` (32) | 读一个文件。选 ELF 或 Mach-O |
| `python3 code/main.py` (33) | 每个夹具一份 JSON 报告 |
| `python3 code/main.py disasm <object>` | 带重定位目标的列表 |
| `python3 code/main.py cfg <object> <function>` | 分析一个函数 |
| `python3 code/main.py` (34) | IR、SSA、伪代码，对照 Ghidra |
| `python3 -m unittest discover -s code/tests -v` | 第 32 课与第 34 课的测试套件 |
| `python3 code/tests/test_main.py` | 第 33 课的测试套件 |

## ELF64 记录格式
type: task-table
from: phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch/docs/en.md

| 任务 | 代码 |
|---|---|
| e_ident 之后的头，偏移 16 | `"<HHIQQQIHHHHHH"` |
| 节头，64 字节 | `<IIQQQQIIQQ` |
| 符号，24 字节 | `<IBBHQQ` |
| Rela 记录，24 字节 | `<QQq` |
| 程序头，56 字节 | `<IIQQQQQQ` |
| r_info 的符号索引 | `ELF64_R_SYM(i)` 是 `i >> 32` |
| r_info 的类型 | `ELF64_R_TYPE(i)` 是 `i & 0xffffffff` |
| Mach-O 符号，16 字节 | `nlist_64` 没有 size 字段 |

## 地址算术
type: concepts
from: phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch/docs/en.md, phases/13-tools-and-protocols/33-disassembly-and-control-flow/docs/en.md, phases/13-tools-and-protocols/34-lifting-to-pseudocode/docs/en.md

- **函数字节**：文件偏移是 `sh_offset + st_value - sh_addr`。长度是 `st_size`。
- **R_X86_64_PC32**：链接器把 `S + A - P` 写入该字段。
- **R_X86_64_64**：`S + A`。**R_X86_64_PLT32**：`L + A - P`。
- **RIP 目标**：加数加 4。`lea` 上的 `.rodata+0x10` 表示 `.rodata+0x14`。
- **PT_LOAD**：文件偏移是 `p_offset + (address - p_vaddr)`。
- **Mach-O 大小**：同一节里下一个符号减去本符号。
- **除以 10**：`0x66666667`，移位 34。误差 6 不超过 8。

## 用 Python 读一个目标文件
type: annotated-code
lang: python
from: phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch/docs/en.md, phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch/code/main.py

```python
from main import ElfFile, MachOFile, FIXTURES
elf = ElfFile.from_path(FIXTURES / "ledger-x86_64-O1.o")
elf.header.e_shoff, elf.header.e_shnum      # 0x428 and 11 headers
elf.function_span("percent_change")         # 16 bytes at 0x40
elf.function_bytes("percent_change")        # 85 ff 74 09 ...
elf.relocations_for(".text")                # 3 R_X86_64_PC32 records
elf.file_offset_map()                       # 3 gaps of alignment
tiny = ElfFile.from_path(FIXTURES / "tiny-x86_64")
tiny.address_to_file_offset(0x4000b0)       # 0xb0 through PT_LOAD
macho = MachOFile.from_path(FIXTURES / "ledger-arm64-O1.o")
macho.function_span("_percent_change")      # 24 bytes at 648
```

## 扫描或下降：-O0 下的 grade
type: comparison
from: phases/13-tools-and-protocols/33-disassembly-and-control-flow/docs/en.md

| 因素 | 线性扫描 | 递归下降 | 带表的下降 |
|---|---|---|---|
| 指令 | 34 | 25 | 33 |
| 块 | 9 | 3 | 8 |
| 边 | 7 | 2 | 11 |
| 失败 | 数据被解码成代码 | 停在 `jmpq *%rax` | 没有 |
| 用于 | 与 oracle 一致 | 哪些字节会执行 | 完整 CFG |

## 分析一个新目标文件
type: flow
from: phases/13-tools-and-protocols/33-disassembly-and-control-flow/docs/en.md

1. **Oracle**：先把解码器与 `llvm-objdump -d` 对照。
2. **Descent**：从每个函数符号走起。读 `unresolved`。
3. **Tables**：对每个间接跳转匹配表惯用法及其重定位。
4. **Bytes**：只有扫描声称拥有的字节是填充或数据。
5. **CFG**：用恢复出的表来建。每条回边是一个循环。

## 指令到 IR
type: command-table
from: phases/13-tools-and-protocols/34-lifting-to-pseudocode/docs/en.md

| 命令 | 作用 |
|---|---|
| `testl %edi, %edi` | `flags = test(edi, edi)` |
| `je 0xd` | `if je(flags) goto 0xd else goto 0x4` |
| `xorl %eax, %eax` | `eax = 0` |
| `cltd` | `edx = signfill(eax)` |
| `movslq %edi, %rax` | `rax = sext64(edi)` |
| `sarq $0x22, %rcx` | `rcx = rcx >>s 34` |
| `pushq %rbp` 与帧移动 | 什么也不做，帧簿记 |
| `retq` | `return rax` |

## 失败与修复
type: troubleshooting
span: 2
from: phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch/docs/en.md, phases/13-tools-and-protocols/33-disassembly-and-control-flow/docs/en.md, phases/13-tools-and-protocols/34-lifting-to-pseudocode/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| "`percent_change` 在 0" | `st_value` 被当成文件偏移 | 用 `sh_offset + st_value - sh_addr`，此处是 `0x40` |
| "`grade` 是 48 字节" | 填充 `66 90` 被算成代码 | `st_size` 是 46。填充不属于任何符号 |
| "表从 `0x10` 开始" | 把加数读成目标偏移 | 把这 4 字节加到指令末尾：`0x14` |
| 数据表上出现像样的列表 | 线性扫描把数据解码成代码 | 从符号下降，不认领任何数据字节 |
| "jmp rax" 与死块 | 间接跳转没有表 | 从 `.rela.rodata` 与边界检查读目标 |
| 反编译器报告第三个参数 | `idivl` 写入 `%rdx`，返回宽度是猜测 | 参数寄存器上先读后写才是参数 |

## 两个项目
type: comparison
span: 2
from: projects/binary-inspector/README.md, projects/binary-inspector/API.md, projects/mini-decompiler/README.md

| 因素 | binary-inspector | mini-decompiler |
|---|---|---|
| 构建 | ELF、PE/COFF、Mach-O 的静态检查器 | 面向 x86-64 子集的反编译器 |
| 输入 | ELF64 目标、COFF 目标、PE32+ 映像、Mach-O 64 | clang 构建的 ELF64 `ET_REL` 目标 |
| 输出 | JSON 报告、HTML 字节图、构建 diff | 结构化 C 与 `report.json` |
| 运行 | `python3 cli.py inspect <file> --json report.json` | `python3 -m minidec verify <object> --source <source>` |
| 检查 | 用 precision 与 recall 给函数起点打分 | 掩码字节与行为网格 |
| 退出 | 坏文件时以 2 退出并带 `error: <message>` | `pass` 或 `behaviour-only` 时为 0，否则为 1 |

## 项目命令
type: command-table
span: 2
from: projects/binary-inspector/README.md, projects/binary-inspector/API.md, projects/mini-decompiler/README.md, projects/mini-decompiler/solution/minidec/cli.py

| 命令 | 作用 |
|---|---|
| `python3 scripts/project_test.py <project> --init learning-artifacts/<project>` | 建工作区。第 1 阶段故意失败 |
| `python3 scripts/project_test.py <project> --all --path learning-artifacts/<project> --strict` | 跑累积评分器 |
| `python3 cli.py inspect <stripped> --truth <unstripped> --html report.html` | 对照未剥离构建给函数起点打分 |
| `python3 cli.py diff <old> <new> --json diff.json` | 节增长、移动的符号、变化的导入 |
| `python3 -m minidec decompile <object> --ir --no-division-idioms` | 显示 IR 与 SSA，保留魔数乘法 |
| `python3 -m minidec verify <object> --source <source> --opt O1 --out <dir>` | 重新编译、比较字节、跑网格 |

## 问题
type: qa
from: phases/13-tools-and-protocols/33-disassembly-and-control-flow/docs/en.md, phases/13-tools-and-protocols/34-lifting-to-pseudocode/docs/en.md, phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch/docs/en.md, projects/mini-decompiler/README.md

- **为什么 oracle 在陷阱上与扫描一致？** `llvm-objdump` 也是线性扫描。
- **何时一条边是回边？** 它的目标支配它的源。它标记一个循环。
- **为什么 `total` 在 -O1 是 `do while`？** 头部也是带回边的那个块。
- **为什么 `grade` 在 -O1 没有跳转表？** 每个 case 都返回常量。值表取代了跳转。
- **行为通过能证明等价吗？** 不能。它只覆盖一台主机上声明的网格。
