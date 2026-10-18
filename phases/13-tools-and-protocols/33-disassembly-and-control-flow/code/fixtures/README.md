# 第 33 课的测试样例

这里的每个目标文件都在本机上由旁边的源文件编译而成，没有下载任何文件。

| 文件 | 构建方式 | 用途 |
|---|---|---|
| `ledger.c` | 与 `manuals/reverse-engineering-101/capture/fixtures/ledger.c` 共用的源码 | 四个函数：`percent_change`、`grade`、`total`、`grade_label` |
| `ledger-x86_64-O0.o` | `clang -target x86_64-unknown-linux-gnu -O0 -fno-asynchronous-unwind-tables -c ledger.c -o ledger-x86_64-O0.o` | `grade` 包含真正的跳转表：`jmpq *%rax`，以及五个 `.rela.rodata` 条目 |
| `ledger-x86_64-O1.o` | `clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c ledger.c -o ledger-x86_64-O1.o` | `grade` 变成值表加载，`total` 是标量循环 |
| `ledger-x86_64-O2.o` | `clang -target x86_64-unknown-linux-gnu -O2 -fno-asynchronous-unwind-tables -c ledger.c -o ledger-x86_64-O2.o` | `total` 使用 SSE2 向量化，包含两个循环 |
| `sweep-trap.s` | 手工编写 | `.text` 内的字节表，会被线性扫描解码为代码 |
| `sweep-trap.o` | `clang -target x86_64-unknown-linux-gnu -c sweep-trap.s -o sweep-trap.o` | 构建后的陷阱样例 |
| `*.objdump.txt` | `/Library/Developer/CommandLineTools/usr/bin/llvm-objdump -d FILE.o`（Apple LLVM 17.0.0） | 解码器测试用于对照的参考输出 |

编译器是 Apple clang 17.0.0（clang-1700.6.3.2）。三个 `ledger` 目标文件与 `manuals/reverse-engineering-101/capture/fixtures/` 中捕获的样例逐字节相同。
