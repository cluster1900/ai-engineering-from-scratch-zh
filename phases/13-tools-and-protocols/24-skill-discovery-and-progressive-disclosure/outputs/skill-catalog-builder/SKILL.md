---
name: skill-catalog-builder
description: Build a bounded Agent Skill catalog across explicit discovery scopes and report collisions before loading instruction bodies.
license: MIT
metadata:
  lesson: "24"
---

<a id="skill-catalog-builder"></a>

# 技能目录构建器

当智能体宿主需要跨多个技能目录进行确定性发现时，使用此技能。

1. 阅读 `references/discovery-contract.md`。
2. 审查 `assets/scope-policy.json` 中的宿主策略示例；不要假设其中的顺序普遍适用。
3. 运行 `python3 scripts/build_catalog.py project=PATH user=PATH`，按优先级从高到低列出范围。
4. 激活技能前，检查 JSON 中的 `collisions` 和 `omitted` 数组。
5. 仅加载所选 SKILL.md 的正文。只有正文明确引用时，才加载直接引用文件。

发现阶段绝不执行包内脚本。绝不依靠偶然的文件系统顺序，从优先级相同的重复项中做选择。

返回目录预算、选中条目、冲突解决结果和省略项。
