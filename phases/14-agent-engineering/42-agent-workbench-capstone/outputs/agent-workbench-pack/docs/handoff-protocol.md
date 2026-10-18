<a id="handoff-protocol"></a>

# 交接协议

每次会话都以一份交接包结束，其中包含：

- summary
- changed_files
- commands_run
- failed_attempts
- open_risks （严重程度 + 详情）
- next_action （一个具体步骤）
- verdict_pointer （指向验证报告和审查报告的路径）

交接包同时以 handoff.md（供人阅读）和 handoff.json（供下一个智能体使用）交付。
缺少字段会导致会话结束钩子停止执行。
