# 第 36 课的测试夹具

这里的每个文件都属于我们。`ledger.c` 是 `manuals/reverse-engineering-101/capture/fixtures/ledger.c` 的副本。

本目录和 `candidates/` 中每个 x86-64 目标文件的构建命令：

```bash
clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c <source>.c
```

| 文件 | 内容 |
|---|---|
| `ledger.c` | 原始源码：`percent_change`、`grade`、`total`、`grade_label` |
| `ledger-x86_64-O1.o` | 原始目标文件，SHA-256 为 `9a4a8082ba5e285a732552981a6935e0c5255725664f380e37c44ebfb04d803f` |
| `candidates/*.c` | `percent_change` 和 `grade` 的八个重建实现，每个文件一个函数 |
| `candidates/*.o` | 使用上述命令编译的各个重建实现 |
| `runs/agent-run.json` | 使用 rea 6.5.0 和 Ghidra 12.1.4 的一次智能体循环运行，由 `main.py --live` 记录 |
| `runs/leg-one-*.json` | 一次执行比较运行的各行结果，由 `main.py --save-runs` 记录 |

测试读取已提交的目标文件和运行记录，因此在没有 clang、rea 或 Ghidra 的宿主机上也能通过。
