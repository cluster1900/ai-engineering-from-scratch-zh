# 第 35 课的测试夹具

这里的每个文件，要么是我们自行编写并编译的程序，要么是对该程序运行工具产生的记录。

| 文件 | 内容 |
|---|---|
| `ledger.c` | 共用夹具源码：`percent_change`、`grade`、`total`、`grade_label`。SHA-256 为 `4564c3e7e39fe4d10530bb6489722924ad3f34ffd78d8fa203a5e1fe832fdacb`。 |
| `ledger-x86_64-O1.o` | x86-64 ELF 可重定位目标文件。SHA-256 为 `9a4a8082ba5e285a732552981a6935e0c5255725664f380e37c44ebfb04d803f`。 |
| `harness.c` | 包含 `ledger.c` 的宿主机测试程序，每次运行输出一个函数结果。`main.py` 使用宿主机编译器编译它。 |
| `rea-evidence-percent-change.json` | rea 6.5.0 使用 Ghidra 12.1.4 提供方对 `percent_change` 执行 `analyze_function` 的 Evidence。`evidence_id` 为 `ev_e88b10dc0c6400e51bb6f7fdc3eaea8d2c97cc02463f0db3e6afeefc273197cd`。 |
| `rea-evidence-grade.json` | rea 6.5.0 对 `grade` 执行 `analyze_function` 的 Evidence。`evidence_id` 为 `ev_67b6d3f992eaf49a2e16de084b6ebfdd9884e8c5c7f75e175b7bb20f4f748ce1`。 |
| `rea-snapshot.json` | 上述两次运行写入的 rea 分析快照。包含两个 `query_` 条目，以及存有同样两条记录的证据包。 |
| `run-evidence.json` | `harness.c` 宿主机构建的观察运行记录，于 2026-10-13 使用 `python3 code/main.py --record code/fixtures/run-evidence.json` 导出（macOS 26.2、arm64、Apple clang 17.0.0）。 |

目标文件的构建命令（Apple clang 17.0.0、clang-1700.6.3.2、macOS 26.2，2026-10-13）：

```bash
clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c ledger.c -o ledger-x86_64-O1.o
```

rea 命令（rea-agents 6.5.0、Ghidra 12.1.4、OpenJDK 21.0.12.1，`GHIDRA_INSTALL_DIR=/opt/homebrew/Cellar/ghidra/12.1.4/libexec`、`JAVA_HOME=/opt/homebrew/opt/openjdk@21`），于 2026-10-14 在本目录执行：

```bash
npx -y rea-agents@6.5.0 function "$PWD/ledger-x86_64-O1.o" grade --provider ghidra --format json --snapshot "$PWD/rea-snapshot.json" > rea-evidence-grade.json
npx -y rea-agents@6.5.0 function "$PWD/ledger-x86_64-O1.o" percent_change --provider ghidra --format json --snapshot "$PWD/rea-snapshot.json" > rea-evidence-percent-change.json
```

第一条命令耗时 8.6 秒，第二条耗时 8.5 秒，两者都重新导入了 Ghidra。第三次针对同一快照运行 `grade` 命令耗时 2.1 秒，并返回相同记录及相同的 `evidence_id`。
