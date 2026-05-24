# Agent Workbench Pack

适用于任何需要可靠 agent 工作的 repo 的即插即用 workbench。

## 你会得到什么

- `AGENTS.md`：指向 pack 其余部分的简短 router。
- `docs/`：规则、可靠性政策、handoff protocol、reviewer rubric。
- `schemas/`：用于 state、board 和 scope contract 的 JSON Schemas。
- `scripts/`：初始化、feedback runner、verification gate、handoff generator。
- `bin/install.sh`：幂等 installer。

## Quickstart

```
bin/install.sh
$EDITOR task_board.json
python3 scripts/init_agent.py
```

## Versioning

`VERSION` 文件就是 contract。Major bumps 需要进行 state migration。
