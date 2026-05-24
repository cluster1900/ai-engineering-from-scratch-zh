# AGENTS.md

你正在一个使用 agent workbench 运行的 repository 中工作。

行动前请先阅读这些内容：

1. `agent_state.json` — 上一次 session 停止的位置。
2. `task_board.json` — 正在进行什么，下一步是什么。
3. `docs/agent-rules.md` — 启动、禁止事项、完成标准、不确定性、审批。
4. `docs/reliability-policy.md` — 这个 workbench 旨在吸收的 failure modes。
5. `docs/handoff-protocol.md` — session 结束时必须产出的内容。
6. `docs/reviewer-rubric.md` — 如何评判已完成的工作。

验证命令：查看 board 上 active task 中的 `acceptance_criteria`。

Pack version: 1.0.0
