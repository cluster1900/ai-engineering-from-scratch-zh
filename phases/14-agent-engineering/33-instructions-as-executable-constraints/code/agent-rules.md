# Agent 规则

## startup/state-file-fresh
- category: startup
- check: state_file_fresh
Agent 必须在任何 tool call 之前读取 agent_state.json。

## forbidden/no-release-script-edits
- category: forbidden
- check: no_release_script_edits
除非处于已批准的 release task，否则绝不要编辑 scripts/release.sh。

## done/tests-pass
- category: definition_of_done
- check: tests_pass
只有当任务的验收命令以退出码 0 结束时，该任务才算完成。

## uncertainty/open-question-note
- category: uncertainty
- check: opened_question_when_unsure
当信心低于阈值时，写下一个问题 note，而不是猜测。

## approval/new-dependency
- category: approval
- check: new_dependency_approved
添加 runtime dependency 需要明确的人类批准。
