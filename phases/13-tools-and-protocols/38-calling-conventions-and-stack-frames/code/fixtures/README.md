# 第 38 课的测试夹具

这里的每个目标文件都在本机上，通过 `build_fixtures.sh` 中的命令从 `convention.c` 编译，没有下载任何文件。编译器为 Apple clang 17.0.0 (clang-1700.6.3.2)；清单来自 Command Line Tools 中 Apple LLVM 17.0.0 的 `llvm-objdump` 和 `llvm-dwarfdump`。`toolchain-versions.txt` 记录版本，`SHA256SUMS.txt` 记录摘要。

`convention.c` 自行声明 `memcpy` 和 `strncpy`，仅包含 `stdarg.h` 和 `stddef.h`，因为未安装 Linux 或 Windows sysroot，交叉目标只能解析 clang 自带头文件。结构体使用 `long long`，因为 MSVC 目标的 `long` 为 4 字节，其他目标为 8 字节。

| 文件 | 构建方式 | 用途 |
|---|---|---|
| `convention-x86_64-linux-O0.o`, `-O2.o` | `clang -target x86_64-unknown-linux-gnu -O0/-O2 -fno-asynchronous-unwind-tables -c convention.c` | System V AMD64 psABI |
| `convention-x86_64-windows-O0.o`, `-O2.o` | `clang -target x86_64-pc-windows-msvc -O0/-O2 -fno-asynchronous-unwind-tables -c convention.c` | Microsoft x64 |
| `convention-aarch64-linux-O0.o`, `-O2.o` | `clang -target aarch64-unknown-linux-gnu -O0/-O2 -fno-asynchronous-unwind-tables -c convention.c` | AAPCS64 |
| `convention-arm64-macos-O2.o` | `clang -target arm64-apple-macos -O2 -fno-asynchronous-unwind-tables -c convention.c` | Apple arm64 的差异（可变参数槽、帧记录位置） |
| `convention-x86_64-windows-O2-seh.o` | 与 Windows `-O2` 目标相同，但不带 `-fno-asynchronous-unwind-tables` | `.pdata` 和 `.xdata` 栈展开表（`.sections.txt`、`.xdata.txt`、`.relocs.txt`） |
| `convention-x86_64-linux-O2-eh.o`, `convention-aarch64-linux-O2-eh.o` | 与 Linux `-O2` 目标相同，但不带 `-fno-asynchronous-unwind-tables` | `.eh_frame` 调用帧信息（`llvm-dwarfdump --eh-frame` 生成的 `.eh-frame.txt`） |
| `convention-x86_64-linux-O0-noredzone.o` | Linux `-O0` 加 `-mno-red-zone` | 不使用红区的叶函数栈帧 |
| `convention-x86_64-linux-O2-fp.o` | Linux `-O2` 加 `-fno-omit-frame-pointer` | 在 `-O2` 下保留帧指针 |
| `*.objdump.txt` | `llvm-objdump -d -r FILE.o` | 分析器读取的清单 |
| `*.symbols.txt` | `llvm-objdump -t FILE.o` | 供参考的符号表 |

`tools/` 保存 `capture_tools.sh` 于 2026-10-14 采集的输出：radare2 6.2.4（`afcl`、`afc`、`afi`、`afv`、`afs`、`afcr`）、rizin 0.9.1（`afcl`、`afc`、`afi`、`afvl`、`afcr`），以及 angr 10.0.3（`angr_cc.py`：先 `CFGFast` 再 `CompleteCallingConventions`，输出恢复的约定类和原型）。课程代码读取这些采集文件，不需要安装相关工具。
