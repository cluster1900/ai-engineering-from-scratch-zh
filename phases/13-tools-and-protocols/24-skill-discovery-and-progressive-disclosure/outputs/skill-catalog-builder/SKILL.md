---
name: skill-catalog-builder
description: 跨显式发现作用域构建受限的 Agent Skill 目录，并在加载指令主体之前报告冲突。
license: MIT
metadata:
  lesson: "24"
---

# Skill 目录构建器

当 Agent host 需要跨多个 Skill 目录进行确定性发现时，使用此 Skill。

1. 阅读 `references/discovery-contract.md`。
2. 检查 `assets/scope-policy.json` 中的示例 host policy；不要假设其中的顺序具有通用性。
3. 运行 `python3 scripts/build_catalog.py project=PATH user=PATH`，并按优先级从高到低列出作用域。
4. 激活 Skill 前，检查 JSON 中的 `collisions` 和 `omitted` 数组。
5. 仅加载选中的 SKILL.md 主体。仅当该主体明确指出某个直接 reference 时才加载它。

发现过程中绝不要执行 bundle 内的 script。绝不要根据偶然的文件系统顺序选择同等优先级的重名项。

返回目录预算、选中的条目、冲突解决结果和省略项。
