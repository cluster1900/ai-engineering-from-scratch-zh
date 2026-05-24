# Agent 规则

## startup/state-file-fresh
- category: startup
- check: state_file_fresh
Agent 必须在任何 tool call 之前读取 agent_state.json。

## forbidden/no-out-of-scope-writes
- category: forbidden
- check: no_out_of_scope_writes
绝不要编辑 active task 的 scope contract 之外的文件。

## done/tests-pass
- category: definition_of_done
- check: tests_pass
只有当每个 acceptance command 都以 zero 退出时，task 才算完成。

## uncertainty/open-question-note
- category: uncertainty
- check: opened_question_when_unsure
当 confidence 低于 threshold 时，打开 question note，而不是猜测。

## approval/new-dependency
- category: approval
- check: new_dependency_approved
添加 runtime dependency 需要明确的 human approval。
