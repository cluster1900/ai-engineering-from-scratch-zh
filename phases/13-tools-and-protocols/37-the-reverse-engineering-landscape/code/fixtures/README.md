# 第 37 课的测试夹具

这里的每个目标文件都在本机上由旁边的源码编译而成，每份工具输出也都在本机上从这些目标文件采集。没有下载任何内容。这些目标文件与第 33 课的测试夹具逐字节完全相同。

## 程序

| 文件 | 构建方式 | 用途 |
|---|---|---|
| `ledger.c` | 与第 33 课共享源码 | 四个函数：`percent_change`、`grade`、`total`、`grade_label` |
| `ledger-x86_64-O0.o` | `clang -target x86_64-unknown-linux-gnu -O0 -fno-asynchronous-unwind-tables -c ledger.c -o ledger-x86_64-O0.o` | `grade` 包含一个跳转表，各工具解析结果不同 |
| `ledger-x86_64-O1.o` | 相同命令，改用 `-O1` | 一致性案例：每种工具都找到 3、3、5、4 个块 |
| `ledger-x86_64-O2.o` | 相同命令，改用 `-O2` | `total` 被向量化，每种工具都得到 10 个块 |
| `sweep-trap.s` | 手写 | `.text` 内的四个数据字节 |
| `sweep-trap.o` | `clang -target x86_64-unknown-linux-gnu -c sweep-trap.s -o sweep-trap.o` | 线性扫描将数据解码为代码 |

编译器：Apple clang version 17.0.0 (clang-1700.6.3.2)。`build_fixtures.sh` 保存精确命令。

## 采集结果

`capture_tools.py` 为每种工具运行一次，并写入 `captures.json`，其中记录日期、主机、每种工具的版本，以及每个文件对应的精确命令。课程代码和测试只读取这些文件，从不启动工具。

| 工具 | 版本 | 文件 | 命令 |
|---|---|---|---|
| llvm-objdump | Apple LLVM version 17.0.0 | `*.objdump.txt` | `llvm-objdump -d -r FILE.o` |
| radare2 | 6.2.4 | `*.radare2.json` | `r2 -e scr.color=0 -qc 'iSj' FILE.o`，随后 `aaa; aflj`，并对每个函数执行 `aaa; afbj @ ADDR`、`aaa; pdfj @ ADDR`、`aaa; pdc @ ADDR` |
| rizin | 0.9.1 | `*.rizin.json` | `rizin -e scr.color=0 -qc '<same commands without pdc>' FILE.o` |
| angr | 10.0.3 (pyvex 10.0.3, cle 10.0.3) | `*.angr.json` | `python capture_angr.py FILE.o OUT.json`：对每个符号函数执行 `CFGFast(normalize=True, data_references=True)` 和 `Decompiler` |
| Ghidra | 12.1.4 | `*.ghidra.json` | `analyzeHeadless PROJECT_DIR lesson37 -import FILE.o -scriptPath . -postScript ExportAnalysis.java OUT.json -deleteProject` |
| pyvex, pypcode, radare2, rizin | 10.0.3, 4.0.1, 6.2.4, 0.9.1 | `ir-lifts.json` | `python capture_ir.py`，随后执行 `r2 -a x86 -b 64 -qc 'e asm.esil=true; wx HEX; pd 1' -` 和 `rizin -a x86 -b 64 -qc 'wx HEX; aoi 1' malloc://16` |

每份 JSON 采集结果都保留工具自己的地址。各工具将 `.text` 映射到不同基址：llvm-objdump 打印节内偏移，radare2 和 rizin 将目标映射到 `0x08000040`，angr 映射到 `0x400000`，Ghidra 映射到 `0x100000`。课程代码会减去各自基址。

`ExportAnalysis.java` 列出每个 Ghidra 函数体内的指令、`BasicBlockModel` 的基本块及其流类型、每条指令的原始 P-code、反编译的 C 和数据引用。它不列出函数体外的指令。

Ghidra 需要 JDK 21。在禁止访问默认 Java 临时目录的沙箱内，设置 `JAVA_TOOL_OPTIONS=-Djava.io.tmpdir=$TMPDIR`。

没有运行 IDA Pro 和 Binary Ninja。本课依据其文档进行介绍。
