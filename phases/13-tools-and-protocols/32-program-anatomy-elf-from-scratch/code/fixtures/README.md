# 第 32 课的测试夹具

这里的每个文件都是你自己构建的程序。`ledger.c` 是逆向工程系列共用的测试夹具（与 `manuals/reverse-engineering-101/capture/fixtures/ledger.c` 为同一份源码）。这些目标文件在 macOS 26.2 上使用 Apple clang 17.0.0 (clang-1700.6.3.2) 和 SDK 26.2 构建。`build_fixtures.sh` 会执行下方所有命令。

| 文件 | 准确的构建命令 |
|---|---|
| `ledger-x86_64-O0.o` | `clang -target x86_64-unknown-linux-gnu -O0 -fno-asynchronous-unwind-tables -c ledger.c -o ledger-x86_64-O0.o` |
| `ledger-x86_64-O1.o` | `clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c ledger.c -o ledger-x86_64-O1.o` |
| `ledger-x86_64-O2.o` | `clang -target x86_64-unknown-linux-gnu -O2 -fno-asynchronous-unwind-tables -c ledger.c -o ledger-x86_64-O2.o` |
| `ledger-arm64-O1.o` | `clang -target arm64-apple-macos -O1 -fno-asynchronous-unwind-tables -c ledger.c -o ledger-arm64-O1.o` |
| `tiny-x86_64` | `python3 build_tiny_elf.py` |

三个 x86-64 目标文件不需要 Linux sysroot，因为 `ledger.c` 不包含任何头文件。arm64 目标文件带有记录 SDK 版本的 `LC_BUILD_VERSION` 命令，因此使用另一 SDK 构建会得到不同字节。已提交的字节就是夹具，测试直接读取它们，所以构建不属于测试运行的一部分。

参考基准文本使用 `/Library/Developer/CommandLineTools/usr/bin/llvm-objdump`（Apple LLVM version 17.0.0）采集：

| 文件 | 采集命令 |
|---|---|
| `ledger-x86_64-O0.objdump.txt` | `llvm-objdump -h -t -r ledger-x86_64-O0.o` |
| `ledger-x86_64-O1.objdump.txt` | `llvm-objdump -h -t -r ledger-x86_64-O1.o` |
| `ledger-x86_64-O2.objdump.txt` | `llvm-objdump -h -t -r ledger-x86_64-O2.o` |
| `ledger-arm64-O1.objdump.txt` | `llvm-objdump -h -t -r ledger-arm64-O1.o` |
| `ledger-arm64-O1.load-commands.txt` | `llvm-objdump --macho --private-headers ledger-arm64-O1.o` |
| `tiny-x86_64.objdump.txt` | `llvm-objdump -h -t -r -p tiny-x86_64` |

目标文件的 SHA-256：

```text
b2046c121930d3d1e5ba84ba796f9e9e161df2fe76f7b9dcf8db63f690447e13  ledger-x86_64-O0.o
9a4a8082ba5e285a732552981a6935e0c5255725664f380e37c44ebfb04d803f  ledger-x86_64-O1.o
ce31eaf10e7cb88fb8e313abfdb4f743964646339260c471ff97d60137bbe89b  ledger-x86_64-O2.o
fe67e3783e24427e4c3264e0e6ff9060f685cdd0939def1cdd99dad66e21c900  ledger-arm64-O1.o
```
