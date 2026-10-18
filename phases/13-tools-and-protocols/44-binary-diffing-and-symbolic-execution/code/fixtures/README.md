# 第 44 课样例

这里的每个目标文件都在本机由旁边的源码编译，每份工具输出也都在本机针对这些目标文件捕获，没有下载任何内容。`build_fixtures.sh` 按顺序运行下面的所有命令。

## 目标文件

| 文件 | 构建方式 | 用途 |
|---|---|---|
| `ledger.c` | 与第 32 至 36 课共享的源码 | 四个函数：`percent_change`、`grade`、`total`、`grade_label` |
| `ledger-x86_64-O0.o` | `clang -target x86_64-unknown-linux-gnu -O0 -fno-asynchronous-unwind-tables -c ledger.c` | `grade` 包含带五个 `.rela.rodata` 条目的跳转表 |
| `ledger-x86_64-O1.o` | 相同命令使用 `-O1` | `grade` 读取值表，`total` 是标量循环 |
| `ledger-x86_64-O2.o` | 相同命令使用 `-O2` | `total` 使用 SSE2 向量化，从 31 增长到 140 字节 |
| `grade_case10_wrong.c` | 第 36 课候选的副本 | 与 `-O1` 下的 `grade` 具有相同 46 个代码字节，但 case 10 的表项改为 3 |
| `grade_case10_wrong.o` | 相同命令使用 `-O1` | 补丁分析样例：代码字节相同，常量不同 |
| `*.objdump.txt` | `/Library/Developer/CommandLineTools/usr/bin/llvm-objdump -d FILE.o`（Apple LLVM 17.0.0） | 比较器用于读取指令边界和助记符的清单 |

编译器为 Apple clang 17.0.0（clang-1700.6.3.2）。三个 `ledger` 目标文件的 SHA-256：`b2046c12...`（O0）、`9a4a8082...`（O1）、`ce31eaf1...`（O2）。它们与第 33 课的目标文件逐字节相同。

## 工具捕获结果

| 文件 | 命令 | 工具版本 |
|---|---|---|
| `radiff2-AC-O0-vs-O1.txt`, `radiff2-AC-O1-vs-O2.txt`, `radiff2-AC-O1-vs-O1.txt` | `radiff2 -AC A.o B.o`，包含 `sym.` 名称的行 | radare2 6.2.4（`radiff2-version.txt`） |
| `radiff2-AC-relocs-O0-vs-O1.txt` | `radiff2 -e bin.relocs.apply=true -AC` | 同上 |
| `radiff2-AOC-*.txt` | `radiff2 -AOC`，仅操作码字节 | 同上 |
| `radiff2-s-O1-vs-O2.txt`, `radiff2-ss-O1-vs-O2.txt` | 对整个文件运行 `radiff2 -s`（Myers）和 `-ss`（Levenshtein） | 同上 |
| `ghidra-vt-O0-vs-O1.txt`, `ghidra-vt-O1-vs-O2.txt` | `capture_ghidra_vt.sh`：`analyzeHeadless` 导入三个目标文件，再将源和目标程序路径作为参数，运行后处理脚本 `ghidra/ListVersionTrackingMatches.java` | Ghidra 12.1.4、OpenJDK 21（`ghidra-version.txt`） |
| `angr-runs.json` | 在安装 angr 10.0.3 的 Python 3.12 venv 中运行 `capture_angr.py` | angr 10.0.3，claripy 内置为 `angr.rustylib.claripy` |
| `z3-runs.json` | 在同一 venv 中运行 `capture_z3.py` | z3-solver 5.1.0.0 |

`ListVersionTrackingMatches.java` 按文档顺序逐个运行六个 Auto Version Tracking 关联器，为每个程序块、函数、关联器和匹配打印一条 `VT|` 行。shell 脚本将 Ghidra 设置、缓存和临时目录保存在同一工作目录下，使运行不会在主目录遗留内容。

测试读取已提交的捕获结果，因此无需在宿主机安装 radare2、Ghidra、angr 或 z3。与捕获结果比较的测试在捕获文件缺失时跳过。
