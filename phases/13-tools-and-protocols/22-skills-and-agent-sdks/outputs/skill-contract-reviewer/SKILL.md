---
name: skill-contract-reviewer
description: 在实现之前验证 Agent Skill package，并选择正确的指令、能力或生命周期 primitive。
license: MIT
metadata:
  lesson: "22"
---

# Skill 契约 reviewer

当某个工作流即将成为可复用的 Agent artifact 时，使用此 Skill。

1. 将 `SKILL_ROOT` 设置为包含这个已安装 `SKILL.md` 的绝对目录。
   不要假设进程工作目录就是该 bundle。
2. 将 `TARGET_ROOT` 设置为原始 workspace 工作目录的绝对路径，并在该根目录下
   解析候选 Skill 目录。
3. 阅读 `$SKILL_ROOT/references/contract.md`，并验证可移植
   `SKILL.md` 的身份字段。
4. 阅读 `$SKILL_ROOT/references/decision-model.md`，并区分 repository
   Context、可复用方法、外部能力、生命周期时机、
   确定性逻辑和隔离委派。
5. 执行前，显示准确解析后的参数 Vector。运行
   `python3 "$SKILL_ROOT/scripts/check_skill.py" "$TARGET_SKILL"`，其中
   `TARGET_SKILL` 是 `TARGET_ROOT` 下候选 Skill 目录的绝对路径。
6. 检查 JSON 报告。在讨论 host 特定扩展之前修复所有错误。
7. 将候选 artifact 与
   `$SKILL_ROOT/assets/task-shapes.json` 进行比较，并返回最小的可组合
   primitive 集合。

不要声称 runtime extension 属于可移植契约。不要将有效的 Skill 视为运行 scripts 或访问 Tools 的权限。

返回验证报告、选定的 primitives，并用一句话说明
每项选择。执行证据中应包含解析后的 script
路径、解析后的目标路径、cwd、准确的 argv 和退出码。如果 host 无法
公开其中某项观察结果，请将其标记为未验证，而不要虚构结果。
