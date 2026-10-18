# 第 41 课样例

这里的每个目标文件均在本机由旁边的两份源码编译而来，没有下载任何目标文件。`build_fixtures.sh` 保存确切命令，`SHA256SUMS.txt` 保存生成结果的哈希。`capture_tools.sh` 保存生成 `tools/` 中文件的命令。

## 源码

| 文件 | 用途 |
|---|---|
| `account.c` | `struct account` 的成员位于偏移 0、4、8、16、24，大小为 32；`bump`、`sum_balances`、`tag`、`projected`、`label_length` 各自访问不同成员；`main` 打印布局，并向这五个函数传递同一个包含三个元素的数组 |
| `shapes.cpp` | `Shape` 包含虚析构函数、纯虚 `area()` 和虚 `name()`；`Rect : Shape`；`describe` 执行一次虚调用 |

两份源码都自行声明 `printf`，因此无需系统头文件即可针对 Linux 目标编译。

## 目标文件与捕获文本

使用 Apple clang 17.0.0（clang-1700.6.3.2）构建。每个目标文件旁的文本文件来自 Apple Command Line Tools 的 `llvm-objdump`、`llvm-dwarfdump` 和 `llvm-cxxfilt`，版本均为“Apple LLVM version 17.0.0”。`toolchain-versions.txt` 记录四条版本信息。

| 文件 | 命令 | 作用 |
|---|---|---|
| `account-x86_64-O0-g.o`, `-O1-g.o`, `-O2-g.o` | `clang -target x86_64-unknown-linux-gnu -g -O{0,1,2} -fno-asynchronous-unwind-tables -fdebug-compilation-dir=. -c account.c` | 三个优化级别的 DWARF 5 目标文件；分析遍读取它们的清单，读取器解析 `-O0` 目标文件 |
| `account-x86_64-O1.o` | 同一命令去掉 `-g` | 工具在没有调试信息时看到的目标文件 |
| `*.objdump.txt` | `llvm-objdump -d -r FILE.o` | 分析遍读取的清单 |
| `account-x86_64-O0-g.dwarfdump.txt` | `llvm-dwarfdump --debug-info` | DWARF 读取器测试的对照基准 |
| `account-x86_64-O0-g.dwarfdump-tables.txt` | `llvm-dwarfdump --debug-abbrev --debug-str-offsets --debug-addr --debug-str` | 缩写表和两张间接索引表 |
| `account-x86_64-O0-g.relocs.txt` | `llvm-objdump -r` | 全部重定位，包括调试节上的重定位 |
| `shapes-x86_64-O0-g.o`, `shapes-x86_64-O1-g.o` | `clang++ -target x86_64-unknown-linux-gnu -g -O{0,1} -fno-asynchronous-unwind-tables -fdebug-compilation-dir=. -c shapes.cpp` | `-O0` 目标文件携带两张虚函数表；`-O1` 目标文件没有虚函数表 |
| `shapes-x86_64-O0-g.symbols.txt`, `.relocs.txt`, `.dwarfdump.txt` | `llvm-objdump -t`, `llvm-objdump -r`, `llvm-dwarfdump --debug-info` | 符号、虚函数表重定位和类条目 |
| `shapes-x86_64-O0-g.mangled.txt`, `.cxxfilt.txt` | 以 `_Z` 开头的符号名称，以及对它们运行 `llvm-cxxfilt --no-strip-underscore` | 解修饰器的对照基准 |
| `account-native.run.txt` | 在 arm64 宿主机运行 `clang -g -O0 -o account account.c && ./account` | 程序自身报告的布局 |

`-fdebug-compilation-dir=.` 将 `DW_AT_comp_dir` 设为字符串 `.`，使目标文件不依赖构建目录。目标文件可以逐字节复现。

## `tools/` 中的工具捕获结果

由 `capture_tools.sh` 于 2026-10-14 在 macOS 26.2 arm64 上生成。各工具版本位于对应的 `*-version.txt` 中。

| 文件 | 工具与命令 |
|---|---|
| `ghidra-account-dwarf.txt`, `ghidra-account-nodwarf.txt`, `ghidra-shapes-dwarf.txt` | Ghidra 12.1.4，配合 OpenJDK 21.0.12.1，运行 `analyzeHeadless ... -import FILE.o -postScript ListTypes.java`；`ghidra/ListTypes.java` 列出 Data Type Manager 中的每个 `Structure`，并反编译五个 account 函数 |
| `rizin-account.txt`, `rizin-account-nodwarf.txt` | rizin 0.9.1，在 `sym.bump` 上使用 `ts`、`tsc account`、`afvd` 和 `pdf`；对 `-g` 目标文件启用 `bin.dbginfo=true` |
| `radare2-account.txt` | radare2 6.2.4，使用相同命令并启用 `bin.relocs.apply=true` |
| `lldb-account.txt`, `lldb-shapes.txt` | Apple lldb-1703.0.236.21，`image lookup -t account`、`image lookup -n bump`、`image lookup -t Rect`、`image lookup -t Shape` |
| `pyelftools-account.txt` | 在 Python 3.12.12 和 pyelftools 0.33 下运行 `pyelftools_struct.py` |

radare2 和 rizin 为本课程从源码构建到本地前缀目录。Ghidra 来自 Homebrew 的 `ghidra` formula。捕获脚本会跳过缺失工具，并打印跳过了哪个工具。
