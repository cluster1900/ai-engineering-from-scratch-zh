# Mission - 面向 Agent 的 Initialization Script

## 目标
构建 `init_agent.py`，探测 runtime、dependency、test 命令、env var 与 state 新鲜度，写出 `init_report.json`，并在任何 block 级 probe 失败时大声终止整个 session 循环。

## 输入
- 一个带有 `requirements.txt`（或等价物）、一个 test 命令，以及 lesson 34 的 workbench state 文件的 repo
- 课程里那张 probe 表（runtime、deps、paths、env、state freshness、last-known-good commit）

## 交付物
- `init_agent.py`，每个 probe 对应一个函数，返回 `(name, status, detail)`
- `init_report.json`，承载完整 probe 集合和一个 timestamp
- 任何 block 级 probe 失败时返回非零退出码

## 验收
- `python3 code/main.py` 在 happy path 下退出码为 0
- 连续运行两次，除了 timestamp 外是 no-op
- 一次模拟缺失 env var 的 probe 在报告中浮现，并反转退出码

## 范围之外
- 自动安装缺失依赖。脚本只负责终止并暴露问题；由人来修。
- 在 probe 里调用 LLM。Probe 保持为确定性的管线代码。

## 参考
- `docs/en.md` - 完整课程
- `code/main.py` - 参考实现
- `outputs/skill-init-script.md` - 抽取出的 skill
