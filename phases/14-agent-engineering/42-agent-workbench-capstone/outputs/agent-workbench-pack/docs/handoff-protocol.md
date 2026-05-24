# Handoff Protocol

每个 session 都以一个 handoff packet 结束，其中包含：

- summary
- changed_files
- commands_run
- failed_attempts
- open_risks (severity + detail)
- next_action (一个具体步骤)
- verdict_pointer (指向 verification + review reports 的 paths)

该 packet 同时以 handoff.md（供 humans 使用）和 handoff.json（供下一个 agent 使用）交付。
缺失 fields 会使 session-end hook 停止。
