# 任务 - Agents 的初始化脚本

## 目标
构建 `init_agent.py`，用于探测 runtime、dependencies、test command、env vars 和 state freshness，然后写入 `init_report.json`，并在 block-severity probe 失败时高声中止 session。

## 输入
- 一个包含 `requirements.txt`（或等价文件）、test command，以及 lesson 34 中 workbench state file 的 repo
- 本课中的 probe 表（runtime、deps、paths、env、state freshness、last-known-good commit）

## 交付物
- `init_agent.py`，每个 probe 对应一个函数，并返回 `(name, status, detail)`
- `init_report.json`，包含完整 probe 集合和 timestamp
- 任一 block-severity probe 失败时以非零退出码退出

## 验收标准
- 在 happy path 上，`python3 code/main.py` 以零退出码退出
- 连续运行两次时，除 timestamp 外没有其他变化
- 模拟缺失 env var 的 probe 会出现在 report 中，并翻转 exit code

## 范围外
- 自动安装缺失 dependencies。脚本会中止并暴露问题；由人来修复。
- 从 probe 调用 LLM。Probes 保持确定性的 plumbing。

## 参考
- `docs/en.md` - 完整课程
- `code/main.py` - 参考实现
- `outputs/skill-init-script.md` - 提取出的 skill
