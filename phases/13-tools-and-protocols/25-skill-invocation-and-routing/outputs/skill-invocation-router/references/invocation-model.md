# 调用 Model

| 渠道 | 发起者 | 选择方式 | 典型用途 |
|---|---|---|---|
| 显式人工调用 | 用户 | 精确的已发现名称 | 主动选择工作流 |
| 隐式 Model 或 Agent 调用 | Model 或自主 Agent | 描述相关性与 host 策略 | 基于 Context 的路由 |
| 程序化应用调用 | 产品 runtime | 精确的已配置名称和目标 allowlist | 确定性产品工作流 |
| Skill 组合 | 另一个 Skill 或 subagent | 精确目标、调用者身份和深度策略 | 有边界的工作流依赖 |
| 程序化 harness | Evaluation runtime | 精确的已配置名称和目标 allowlist | 确定性 Evaluation |

人工激活和 Model 激活构成一个 2x2 组合：均不激活、仅人工激活、仅 Model 激活或两者均激活。应用程序激活、组合激活和 harness 激活是相互独立的渠道，各自拥有自己的目标、调用者和深度策略。

对于隐式路由，应先应用参与者资格和 host-extension 资格规则，再进行相关性排序。得分很高但被阻止的 Skill 并非最终选择；应将其从候选集合中移除，并评估其余符合条件的候选项。如果符合条件的集合为空，或其中的最高分未达到阈值，则放弃调用。

`user-invocable` 或 `disable-model-invocation` 等字段可能仅对特定 host 有意义。adapter 可以强制执行这些字段，但可移植文档不得声称每个 runtime 都能识别相同的字段或值。
