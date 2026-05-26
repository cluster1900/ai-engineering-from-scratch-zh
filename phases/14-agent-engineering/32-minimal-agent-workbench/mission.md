# 任务 - Minimal Agent Workbench

## 目标
在全新的 `workdir/` 中放下三文件最小工作台（router、state、task board），并证明单个 Agent 回合可以读取 state、拉取一个 task、写入 scope，并持久化更新后的 state。

## 输入
- lesson code 旁边的一个空 `workdir/` 目录
- 对三个文件的了解：`AGENTS.md`、`agent_state.json`、`task_board.json`

## 交付物
- 创建三个文件并运行一个回合的 `code/main.py`
- `workdir/AGENTS.md`，一个简短 router，指向 state、board 和 verification command
- `workdir/agent_state.json`，包含 active task id、touched files、next action
- `workdir/task_board.json`，包含一个小 backlog 和 statuses

## 验收
- `python3 code/main.py` 在第一次和第二次运行时都以退出码 0 结束
- 第二次运行会从第一次留下的位置继续，而不是从头开始
- 脚本打印的 diff 显示该回合触碰的一个文件

## 范围外
- Scope contracts、verification gates、reviewer agents。这些会在后续课程中叠加。
- 冗长的单体 `AGENTS.md`。router 会有意保持简短。

## 参考
- `docs/en.md` - 完整课程
- `code/main.py` - 参考实现
- `outputs/skill-minimal-workbench.md` - 提取出的 skill
