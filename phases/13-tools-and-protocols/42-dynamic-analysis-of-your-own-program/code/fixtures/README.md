# 第 42 课样例

这里的每个文件都是我们编写并在本机编译的程序，或工具在该程序上运行的输出。没有下载任何内容。调试器始终只针对这两个构建运行。

| 文件 | 内容 |
|---|---|
| `account.c` | 本课程序：包含五个字段的 `struct account`，以及 `bump`、`classify`、`sum_balances`，`main` 分别调用它们一次、三次和一次。 |
| `account-O0`, `account-O0.dSYM/` | `clang -g -O0 -o account-O0 account.c`。Mach-O arm64，由链接器进行 ad-hoc 签名，dSYM 包中包含 DWARF 5。 |
| `account-O2`, `account-O2.dSYM/` | `clang -g -O2 -o account-O2 account.c`。相同源码，`main` 中每个调用都被内联和折叠。 |
| `account-O0.objdump.txt`, `account-O2.objdump.txt` | 各二进制的 `llvm-objdump -d` 输出。驱动器从中读取函数范围和条件分支。 |
| `account-O0.nm.txt`, `account-O2.nm.txt` | 各二进制的 `nm` 输出。两者都列出 `_bump`、`_classify`、`_sum_balances`。 |
| `account-O0.dwarfdump.txt`, `account-O2.dwarfdump.txt` | 各 dSYM 的 `llvm-dwarfdump --debug-info` 输出。提供驱动器检查内存时使用的结构体布局。 |
| `account-O0.codesign.txt` | `-O0` 二进制的 `codesign -dvvv` 和 `codesign -d --entitlements -` 输出。 |
| `session-O0.lldb`, `session-O2.lldb` | `python3 ../main.py capture` 根据计划写出的命令文件。测试检查它们与计划相等。 |
| `session-O0.lldb.txt`, `session-O2.lldb.txt` | 这些会话的 lldb 批处理记录，在 `#` 头部记录命令行、lldb 版本和日期。 |
| `core-save-O0.lldb`, `core-save-O0.lldb.txt` | 在 `bump` 停止，然后执行 `process save-core --style stack`。不保留 core 文件本身。 |
| `core-load-O0.lldb`, `core-load-O0.lldb.txt` | 使用 `lldb -c` 加载该 core，读取回溯、结构体和内存。 |
| `types-O0.lldb`, `types-O0.lldb.txt` | 不启动进程的 lldb Python API：嵌入式 Python 版本、结构体字段、结构体大小、函数范围。 |
| `sandbox-O0.lldb.txt` | 在会话的 Seatbelt 沙箱内运行相同 `session-O0` 计划。启动在任何停止发生前失败。 |
| `build_fixtures.sh` | 生成以上全部文件的确切命令。 |

2026-10-14，在 macOS 26.2（Darwin 25.2.0）、Apple silicon 上的工具版本：

- Apple clang 17.0.0（clang-1700.6.3.2），带 SDK 26.2 的 Command Line Tools
- lldb-1703.0.236.21，嵌入式 Python 3.9.6
- 来自 `/Library/Developer/CommandLineTools/usr/bin` 的 `llvm-objdump` 和 `llvm-dwarfdump`，Apple LLVM version 17.0.0

在本目录运行 `sh build_fixtures.sh` 可重建全部内容。捕获步骤需要 shell 能够在 lldb 下启动进程。在 Seatbelt 沙箱内，它会改为写出类似 `sandbox-O0.lldb.txt` 的记录。环境不同时，新捕获的栈地址会与已提交会话记录不同，因此测试固定检查已提交记录，而实时模式独立评判新运行。
