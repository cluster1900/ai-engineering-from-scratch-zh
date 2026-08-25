---
name: skill-invocation-router
description: 为 Agent Skill 目录设计并测试显式人工调用、隐式 Model 或 Agent 调用、程序化应用调用、有界 Skill 组合以及 harness 激活策略。
license: MIT
metadata:
  lesson: "25"
---

# Skill 调用路由器

当宿主需要可审计的激活策略，而不是单一且不作区分的 `invocable` 标志时，请使用此 Skill。

1. 阅读 `references/invocation-model.md` 并对请求渠道进行分类。
2. 查看 `assets/host-policy.json`，将其作为 adapter 配置示例，而不是可移植标准。
3. 运行 `python3 scripts/simulate_invocation.py --policy assets/host-policy.json --actor ACTOR --name NAME --description DESCRIPTION --query QUERY [--explicit-name NAME] [--caller-name NAME] [--depth N] [--user-invocable true|false] [--disable-model-invocation true|false]`。
4. 对于人工、应用、Skill 或 harness 请求，要求提供已发现的精确名称，并满足其特定渠道的 allowlist。
5. 对于 Skill 调用方，还要求提供调用方身份、非循环目标以及有界的组合深度。
6. 对于 Model 或自主 Agent 请求，移除因 actor 或已识别的宿主扩展而不符合条件的候选项。
7. 仅对剩余描述进行评分。选择最匹配且符合条件的候选项；如果没有符合条件的候选项达到阈值，则放弃选择。
8. 返回包含 adapter、渠道、分数和策略原因的 JSON 决策。

激活操作会加载指令。它不会批准 Tool、文件系统更改、网络访问、secret 使用或捆绑的脚本。
