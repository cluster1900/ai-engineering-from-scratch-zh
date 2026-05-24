# Mission - 最小化 Agent Workbench

## 目标
在一个全新的 `workdir/` 中铺设三文件最小 workbench（router、state、task board），并证明单次 agent turn 可以读取 state、领取任务、写入 scope，并持久化更新后的 state。

## 输入
- 课程代码旁的一个空 `workdir/` 目录
- 三个文件的相关知识：`AGENTS.md`、`agent_state.json`、`task_board.json`

## 交付物
- `code/main.py`，创建这三个文件并运行一次 turn
- `workdir/AGENTS.md`，一份短小的 router，指向 state、board 和验证命令
- `workdir/agent_state.json`，包含 active task id、touched files、next action
- `workdir/task_board.json`，包含一个小型 backlog 与各任务状态

## 验收
- `python3 code/main.py` 在第一次和第二次运行都返回退出码 0
- 第二次运行接续第一次的进度，而不是从头开始
- 脚本打印的 diff 展示本次 turn 触碰的那个文件

## 范围之外
- Scope contract、verification gate、reviewer agent。这些会在后续课程层层叠加。
- 长篇的 `AGENTS.md`。router 故意保持简短。

## 参考
- `docs/en.md` - 完整课程
- `code/main.py` - 参考实现
- `outputs/skill-minimal-workbench.md` - 抽取出的 skill
