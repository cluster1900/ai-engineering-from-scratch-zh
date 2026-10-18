---
name: skill-invocation-router
description: Design and test explicit human, implicit model or agent, programmatic application, bounded skill-composition, and harness activation policies for an Agent Skill catalog.
license: MIT
metadata:
  lesson: "25"
---

<a id="skill-invocation-router"></a>

# 技能调用路由器

当宿主需要可审计的激活策略，而不是一个不加区分的 `invocable` 标记时，使用此技能。

1. 阅读 `references/invocation-model.md`，对请求渠道分类。
2. 将 `assets/host-policy.json` 视为适配器配置示例进行审查，不要将其当作可移植标准。
3. 运行 `python3 scripts/simulate_invocation.py --policy assets/host-policy.json --actor ACTOR --name NAME --description DESCRIPTION --query QUERY [--explicit-name NAME] [--caller-name NAME] [--depth N] [--user-invocable true|false] [--disable-model-invocation true|false]`。
4. 对人工、应用、技能或运行框架请求，要求使用发现到的准确名称，以及相应渠道的允许列表。
5. 对技能调用方，还要求调用方身份、无循环的目标，以及有界的组合深度。
6. 对模型或自主智能体请求，先移除按执行者或已识别宿主扩展规则判定为不合格的候选项。
7. 仅对剩余描述评分。选择最匹配的合格候选项；若没有合格候选项超过阈值，则不选择。
8. 返回 JSON 决策，包含适配器、渠道、评分和策略原因。

激活只会加载指令，并不批准工具调用、文件系统修改、网络访问、秘密使用或包内脚本执行。
