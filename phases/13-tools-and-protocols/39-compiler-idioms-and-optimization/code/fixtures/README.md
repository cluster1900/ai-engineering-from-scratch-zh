# 第 39 课的测试夹具

这里的每个目标文件都在本机上，通过 `build_fixtures.sh` 从旁边的源码编译，没有下载任何文件。编译器为 Apple clang 17.0.0 (clang-1700.6.3.2)，清单来自 `/Library/Developer/CommandLineTools/usr/bin/llvm-objdump -d -r`（Apple LLVM 17.0.0）。`toolchain.txt` 记录构建时的两个版本字符串。

| 文件 | 构建方式 | 用途 |
|---|---|---|
| `idioms.c` | 源码 | 25 个小函数，每个一至两种模式：常量除法和取模、五种 switch 形态、选择、尾调用、内联被调用者、向量化或展开的循环、存储和复制循环，以及在一个函数体内含五种模式的 `digest` |
| `idioms-x86_64-O{0,1,2,3}.{o,s,objdump.txt}` | `clang -target x86_64-unknown-linux-gnu -O<N> -fno-asynchronous-unwind-tables -c idioms.c`，以及加 `-S` 的同等命令 | x86-64 的四个优化级别 |
| `idioms-arm64-O{0,1,2,3}.{o,s,objdump.txt}` | `clang -target aarch64-unknown-linux-gnu -O<N> -fno-asynchronous-unwind-tables -c idioms.c` | AArch64 的四个优化级别 |
| `idioms-x86_64-nofastisel-O0.*` | `-O0 -mllvm -fast-isel=false` | 关闭 FastISel 后，魔数乘法在 `-O0` 即出现 |
| `idioms-x86_64-nojt-O2.*` | `-O2 -fno-jump-tables` | 每张表都变成比较树 |
| `idioms-x86_64-novec-O2.*` | `-O2 -fno-vectorize -fno-slp-vectorize` | 循环按 8 次展开，而不是向量化 |
| `idioms-x86_64-nobuiltin-O2.*` | `-O2 -fno-builtin` | 存储循环不转成 `memset`，`memcpy(…, 16)` 保留为调用 |
| `idioms-arm64-jt4-O2.*` | `-O2 -mllvm -min-jump-table-entries=4` | AArch64 的五分支 `call_switch` 仍为比较树 |
| `dispatch.c`, `dispatch-{x86_64,arm64}-O2.*` | 两种目标均使用 `-O2` | 16 分支尾调用 switch：x86-64 为重定位跳转表，AArch64 为压缩字节跳转表 |
| `canary.c`, `canary-x86_64-ssp-O2.*`, `canary-arm64-ssp-O2.*` | `-O2 -fstack-protector-strong` | 两种目标上的栈保护形态 |
| `canary-x86_64-cet-O2.*` | `-O2 -fcf-protection=full` | 每个函数第一条指令为 `endbr64` |
| `idioms-x86_64-O2.angr.json` | 使用 angr 10.0.3 执行 `venv/bin/python capture_angr.py idioms-x86_64-O2.o idioms-x86_64-O2.angr.json` | 20 个函数的 CFG 块数量及反编译输出 |
| `idioms-x86_64-O2.lifts.json` | 使用 Capstone 5.0.7 和 pypcode 4.0.1 执行 `venv/bin/python capture_lifts.py idioms-x86_64-O2.o idioms-x86_64-O2.lifts.json` | 含指令分组的解码输出，以及 `div10s` 和 `mod8s` 的原始 P-code |
| `idioms-x86_64-O2.radare2.txt` | 使用 radare2 6.2.4 执行 `r2 -e scr.color=0 -qc '...' idioms-x86_64-O2.o` | 对除法、表和选择函数执行 `afl`、`pdf`、`pdc` |
| `idioms-x86_64-O2.rizin.txt` | 使用 rizin 0.9.1 执行 `rizin -e scr.color=0 -qc '...' idioms-x86_64-O2.o` | `afl`、`pdf` 和 `imul` 的 RzIL |
| `idioms-x86_64-O2.lldb.txt` | 使用 lldb-1703.0.236.21 执行 `lldb -b -o 'disassemble -n div10s' ...` | 通过调试器反汇编器查看相同指令 |

每个条目的准确命令均位于对应文本采集文件的第一行及 `build_fixtures.sh` 中。
