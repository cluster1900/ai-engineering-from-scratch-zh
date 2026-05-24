# Agent Rules

## startup/state-file-fresh
- category: startup
- check: state_file_fresh
Agent 在执行任何 tool call 之前必须先读取 agent_state.json。

## forbidden/no-release-script-edits
- category: forbidden
- check: no_release_script_edits
除非处于已批准的 release 任务中，否则永远不要编辑 scripts/release.sh。

## done/tests-pass
- category: definition_of_done
- check: tests_pass
只有当 acceptance 命令退出码为 0 时，任务才算完成。

## uncertainty/open-question-note
- category: uncertainty
- check: opened_question_when_unsure
当 confidence 低于阈值时，写一条 question note，而不是猜测。

## approval/new-dependency
- category: approval
- check: new_dependency_approved
新增 runtime dependency 必须经过明确的人类批准。
