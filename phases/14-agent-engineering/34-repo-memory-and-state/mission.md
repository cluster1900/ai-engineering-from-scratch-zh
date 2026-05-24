# Mission - Repo Memory 与持久 State

## 目标
为 `agent_state.json` 和 `task_board.json` 编写 JSON Schema，构建一个 `StateManager` 负责加载、校验、修改并原子写入，并证明它能跨两次 turn 完整往返。

## 输入
- 来自 lesson 32 的三文件 workbench 形态
- 一个仅依赖 stdlib 的 validator，覆盖 required、type、enum、pattern 与 items

## 交付物
- 紧邻代码的 `agent_state.schema.json` 和 `task_board.schema.json`
- 采用 temp-and-rename 写法的 `StateManager.load`、`StateManager.update`、`StateManager.commit`
- 一次 demo 运行：跨两次 turn 修改 state 并干净地重新加载

## 验收
- `python3 code/main.py` 退出码为 0
- 一次坏写入（缺失必填字段、错误 enum）会被拒绝，而不是被持久化
- 运行结束后 `workdir/agent_state.json` 通过 schema 校验

## 范围之外
- SQLite 或其他外部存储后端。本课程的对象就是本地文件。
- LangGraph checkpointer、Letta memory block。思路相同，存储不同；此处不在范围内。

## 参考
- `docs/en.md` - 完整课程
- `code/main.py` - 参考实现
- `outputs/skill-state-schema.md` - 抽取出的 skill
