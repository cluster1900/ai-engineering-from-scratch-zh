---
name: skill-contract-reviewer
description: Validate an Agent Skill package and choose the right instruction, capability, or lifecycle primitive before implementation.
license: MIT
metadata:
  lesson: "22"
---

<a id="skill-contract-reviewer"></a>

# 技能契约审查器

当某个工作流即将成为可复用的智能体产物时，使用此技能。

1. 将 `SKILL_ROOT` 设为包含已安装 `SKILL.md` 的绝对目录。
   不要假设进程工作目录就是技能包目录。
2. 将 `TARGET_ROOT` 设为原始工作区的绝对工作目录，
   并在该根目录下解析拟议技能目录。
3. 阅读 `$SKILL_ROOT/references/contract.md`，验证可移植的
   `SKILL.md` 身份字段。
4. 阅读 `$SKILL_ROOT/references/decision-model.md`，区分仓库上下文、
   可复用方法、外部能力、生命周期时机、确定性逻辑和隔离委派。
5. 执行前展示解析后的准确参数向量。运行
   `python3 "$SKILL_ROOT/scripts/check_skill.py" "$TARGET_SKILL"`，其中
   `TARGET_SKILL` 是位于 `TARGET_ROOT` 下的拟议技能目录的绝对路径。
6. 检查 JSON 报告。在讨论宿主特有扩展之前，修复每一项错误。
7. 将拟议产物与 `$SKILL_ROOT/assets/task-shapes.json` 比较，
   返回可组合的最小原语集合。

不要声称运行时扩展属于可移植契约。不要将一个结构有效的技能视为运行脚本或访问工具的授权。

返回验证报告、选定原语，以及解释每项选择的一句话。
附上执行证据，包括解析后的脚本路径、目标路径、cwd、准确的 argv 和退出码。
如果宿主无法提供某项观测，将其标为未验证，不要编造。
