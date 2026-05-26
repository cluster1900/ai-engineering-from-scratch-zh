# 任务 - Repo Memory 和持久状态

## 目标
为 `agent_state.json` 和 `task_board.json` 编写 JSON Schema，构建一个 `StateManager`，用于加载、验证、修改并以原子方式写入，并证明两个 turn 之间可以完成往返读写。

## 输入
- lesson 32 中的三文件 workbench 形态
- 一个仅使用 stdlib 的 validator，覆盖 required、type、enum、pattern 和 items

## 交付物
- 与代码放在一起的 `agent_state.schema.json` 和 `task_board.schema.json`
- 带有 temp-and-rename 写入的 `StateManager.load`、`StateManager.update`、`StateManager.commit`
- 一次 demo 运行，跨两个 turn 修改 state 并能干净地重新加载

## 验收标准
- `python3 code/main.py` 以零退出码退出
- 拒绝一次错误写入（缺少 required field、错误 enum），且不会持久化
- 运行后的 `workdir/agent_state.json` 能通过 schema 验证

## 范围外
- SQLite 或外部 storage backend。本课的重点是本地文件。
- LangGraph checkpointers、Letta memory blocks。同一思路，不同 storage；此处不纳入范围。

## 参考
- `docs/en.md` - 完整课程
- `code/main.py` - 参考实现
- `outputs/skill-state-schema.md` - 提取出的 skill
