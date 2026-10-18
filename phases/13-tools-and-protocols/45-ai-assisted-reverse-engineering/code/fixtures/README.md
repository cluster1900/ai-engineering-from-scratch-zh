# 第 45 课样例

这里的每个文件都由我们制作。`ledger.c` 与第 33、35、36 课使用同一源码。`candidates/` 中的八个候选重建由本课手工编写，用来代表典型模型输出。它们不是任何模型的输出，每份报告都在 `label` 字段中明确说明。

以下构建与捕获命令记录于 2026-10-14，使用 Apple clang version 17.0.0（clang-1700.6.3.2），以及 macOS Command Line Tools 中 Apple LLVM version 17.0.0 的 `llvm-objdump` 和 `llvm-dwarfdump`：

```bash
sh build_fixtures.sh
```

每个目标文件的编译器标志均为 `clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c`。三个 ledger 目标文件只在符号名、调试节和只读数据上不同。它们的 159 个 `.text` 字节彼此相同，也与第 36 课的 `ledger-x86_64-O1.o` 相同。

| 文件 | 内容 |
|---|---|
| `ledger.c` | 原始源码：`percent_change`、`grade`、`total`、`grade_label` |
| `ledger-poisoned.c` | 相同源码，额外添加一个向分析者发号施令的只读字符串 |
| `ledger-x86_64-O1-renamed.o` | 目标。使用 `-Dpercent_change=f1 -Dgrade=f2 -Dtotal=f3 -Dgrade_label=f4` 构建，因此符号为 `f1` 至 `f4`。SHA-256 `3561e8175748e19d631552d52869fe235a82471137528ac2e5ef6b6145967d0c` |
| `ledger-x86_64-O1-g.o` | 真值。使用原始名称和 `-g` 构建，包含 DWARF 5。SHA-256 `7bbe0c151e24f58ff70f2057239b12c4538852805d35e1390b9b51e286be853e` |
| `ledger-x86_64-O1-poisoned.o` | 对 `ledger-poisoned.c` 应用重命名，用于不可信内容实验。SHA-256 `c2ed0a89156ac36162d33c03f740930d8480b75244047aa31b5e8e8708a695bc` |
| `ledger-x86_64-O1-renamed.objdump.txt` | 目标的 `llvm-objdump -d -r` 输出，是引用检查接受的每个立即数的来源 |
| `ledger-x86_64-O1-renamed.symtab.txt` | 目标的 `llvm-objdump -t` 输出 |
| `ledger-x86_64-O1-g.dwarfdump.txt`, `ledger-x86_64-O1-g.abbrev.txt` | 真值的 `llvm-dwarfdump --debug-info` 和 `--debug-abbrev` 输出 |
| `ledger-x86_64-O1-poisoned.sections.txt` | 投毒目标文件两个只读节的 `llvm-objdump -s` 输出 |
| `candidates/<id>.c` | 每个文件一个候选重建，每个目标函数四个 |
| `candidates/<id>.report.json` | 候选报告：目标、结论、引用、标签、工具、成本 |
| `candidates/<id>.o`, `candidates/<id>.objdump.txt` | 使用样例标志编译的各候选及其清单 |
| `runs/scorecards-aarch64-darwin.json` | 在 arm64 Mac 上运行一次 `python3 code/main.py --save-runs` 的记录，是图示数据来源 |

按目标与类别列出的候选：

| 候选 | 目标 | 类别 | 代表的情况 |
|---|---|---|---|
| `f1_mul_first` | `f1` | 正确 | 清单的 C 表达 |
| `f1_wide_long` | `f1` | 看似合理但错误 | 跳过 32 位溢出的 64 位中间值 |
| `f1_base_64` | `f1` | 常量错误 | 将字节 `0x64` 读成十进制 64 |
| `f1_safe_div` | `f1` | 编造辅助函数 | 代码编译为原始字节，但报告中有不存在的辅助函数和消息 |
| `f2_switch` | `f2` | 正确 | 原始 `switch` |
| `f2_thresholds` | `f2` | 看似合理但错误 | 使用不同名称、没有上界的阈值判断 |
| `f2_case10_wrong` | `f2` | 常量错误 | 一个表项错误 |
| `f2_clamp` | `f2` | 编造辅助函数 | 不存在的 clamp 辅助函数和消息 |

测试读取已提交的目标文件、清单和运行记录，因此可在没有 clang 的宿主机上通过。存在 clang 时，还会重新构建每个候选并重跑网格与语料。
