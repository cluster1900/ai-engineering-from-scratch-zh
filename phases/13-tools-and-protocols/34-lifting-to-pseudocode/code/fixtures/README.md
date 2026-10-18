# 第 34 课测试样例

`ledger.c` 是 Reverse Engineering 101 共用的测试样例。本课保留自己的副本，让代码能够独立运行。

## 目标文件

在 macOS 26.2 arm64 上使用 Apple clang 17.0.0（clang-1700.6.3.2）构建。两种构建均可逐字节复现。

| 文件 | 命令 | SHA-256 |
|---|---|---|
| `ledger-x86_64-O1.o` | `clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c ledger.c -o ledger-x86_64-O1.o` | `9a4a8082ba5e285a732552981a6935e0c5255725664f380e37c44ebfb04d803f` |
| `ledger-x86_64-O0.o` | `clang -target x86_64-unknown-linux-gnu -O0 -fno-asynchronous-unwind-tables -c ledger.c -o ledger-x86_64-O0.o` | `b2046c121930d3d1e5ba84ba796f9e9e161df2fe76f7b9dcf8db63f690447e13` |

## 参考反汇编

`ledger-x86_64-O1.objdump.txt` 和 `ledger-x86_64-O0.objdump.txt` 是以下命令的输出：

```bash
/Library/Developer/CommandLineTools/usr/bin/llvm-objdump -d -r ledger-x86_64-O1.o
/Library/Developer/CommandLineTools/usr/bin/llvm-objdump -d -r ledger-x86_64-O0.o
```

Apple LLVM 版本为 17.0.0。测试要求 `../main.py` 中的解码器与每一行都保持一致。

## 通过 rea 获取的 Ghidra 伪代码

`ghidra/percent_change.json`、`ghidra/grade.json` 和 `ghidra/total.json` 是 rea 6.5.0 使用 Ghidra 12.1.4 提供方执行 `decompile` 动词（操作为 `procedure_pseudo_code`）返回的 Evidence 记录。运行时间为 2026-10-14，环境是 macOS 26.2 arm64，使用 OpenJDK 21.0.12.1：

```bash
export GHIDRA_INSTALL_DIR=/opt/homebrew/Cellar/ghidra/12.1.4/libexec
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
npx -y rea-agents@6.5.0 decompile "$PWD/ledger-x86_64-O1.o" percent_change --provider ghidra --format json
npx -y rea-agents@6.5.0 decompile "$PWD/ledger-x86_64-O1.o" grade --provider ghidra --format json
npx -y rea-agents@6.5.0 decompile "$PWD/ledger-x86_64-O1.o" total --provider ghidra --format json
```

每次调用耗时约 10 秒。`subject.local_path` 字段记录了 `manuals/reverse-engineering-101/capture/fixtures/` 下副本的路径，该副本具有相同的 SHA-256。

`ghidra/ledger-x86_64-O1.ghidra.c` 原样保存了三个 `raw_result.value` 字符串。

`ghidra/ledger-x86_64-O1.ghidra-repaired.c` 是对同一文本做最小修改后得到的可编译版本。修改如下：

1. 添加 `typedef unsigned int uint;` 和 `typedef unsigned long ulong;`，因为 Ghidra 打印的是它自己的类型名称。
2. 将 `DAT_001000b4` 定义为目标文件 `.rodata` 中偏移 0x14 处的 20 个字节，让 `&DAT_001000b4 + (ulong)uVar2 * 4` 保持 Ghidra 原本意图的字节运算。Ghidra 在临时项目中把 `.rodata` 放在 0x001000a0，因此 0x001000b4 就是 `.rodata + 0x14`。
3. 在 `percent_change` 中，将返回类型 `undefined1 [16]` 改为 `int`，移除第三个参数 `param_3`，并将两个 16 字节的 `auVar` 临时变量改为商的低八字节截断到 `int` 后的值。`grade` 和 `total` 函数保持不变。

测试 `test_lifted_functions_behave_like_the_source_on_an_input_grid` 会将此文件与 `ledger.c` 及提升器输出分别编译，并在同一组输入上比较三者。
