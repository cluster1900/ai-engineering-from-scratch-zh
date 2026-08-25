# YouTube 来源审查

> 视频教授操作过程。官方文档定义接口。

**审查日期：** 2026-08-09

视频用于教学顺序、实验构思和讲解，而不作为考试权重、费用、政策、资格或当前 API 字段的权威来源。2026 年 7 月的公开考试指南和当前 Anthropic 文档优先于所有视频。

## 课程锚点

| 来源 | 重要原因 | 实用章节 |
|--------|----------------|-----------------|
| [Prompting 101](https://www.youtube.com/watch?v=ysPbXH0LpIE)，Anthropic | 从失败出发的 Prompting 和最小干预 | [10:10 的分隔符](https://www.youtube.com/watch?v=ysPbXH0LpIE&t=610s)、[13:11 的 few-shot](https://www.youtube.com/watch?v=ysPbXH0LpIE&t=791s)、[15:47 的 Prompt 位置](https://www.youtube.com/watch?v=ysPbXH0LpIE&t=947s) |
| [Prompting for Agents](https://www.youtube.com/watch?v=XSZP9GhhuAc)，Anthropic | Agent 边界、Tool 设计、预算和最终状态 Evaluation | [9:47 的预算](https://www.youtube.com/watch?v=XSZP9GhhuAc&t=587s)、[15:42 的裸基线](https://www.youtube.com/watch?v=XSZP9GhhuAc&t=942s)、[21:38 的小型 eval](https://www.youtube.com/watch?v=XSZP9GhhuAc&t=1298s) |
| [The CLAUDE.md file](https://www.youtube.com/watch?v=O0FGCxkHM-U)，Claude | 将精简的项目指令用于入门 | [0:40 的入门](https://www.youtube.com/watch?v=O0FGCxkHM-U&t=40s)、[1:57 的辅助文档](https://www.youtube.com/watch?v=O0FGCxkHM-U&t=117s) |
| [Hooks in Claude Code](https://www.youtube.com/watch?v=IkaPHiMDazM)，Claude | 围绕概率性行为设置确定性控制 | [0:13 的确定性](https://www.youtube.com/watch?v=IkaPHiMDazM&t=13s)、[1:50 的 Tool 调用前阻止](https://www.youtube.com/watch?v=IkaPHiMDazM&t=110s) |
| [Tool, skill, or subagent?](https://www.youtube.com/watch?v=mWvtOHlZM-I)，Claude | 拆解累积了过多关注点的 Prompt | [1:18 的 Prompt 膨胀](https://www.youtube.com/watch?v=mWvtOHlZM-I&t=78s)、[3:54 的 Context 隔离](https://www.youtube.com/watch?v=mWvtOHlZM-I&t=234s)、[35:19 的 subagent](https://www.youtube.com/watch?v=mWvtOHlZM-I&t=2119s) |
| [Claude Agent SDK full workshop](https://www.youtube.com/watch?v=TqC1qOfiVcQ)，AI Engineer with Anthropic | harness、Tool、文件、会话、hook、sandboxing 和 subagent | [4:47 的文件系统](https://www.youtube.com/watch?v=TqC1qOfiVcQ&t=287s)、[5:46 的压缩和 hook](https://www.youtube.com/watch?v=TqC1qOfiVcQ&t=346s)、[14:17 的 sandboxing](https://www.youtube.com/watch?v=TqC1qOfiVcQ&t=857s) |
| [Building Agents with MCP](https://www.youtube.com/watch?v=kQmXtrmQ5Zg)，AI Engineer with Anthropic | client、server、Tool、资源、Prompt 和发现 | [4:24 的 client 角色](https://www.youtube.com/watch?v=kQmXtrmQ5Zg&t=264s)、[52:14 的 Tool 发现](https://www.youtube.com/watch?v=kQmXtrmQ5Zg&t=3134s) |
| [Building with MCP and the Claude API](https://www.youtube.com/watch?v=aZLr962R6Ag)，Anthropic | Claude API 集成形式 | 完整的 25 分钟构建过程，并已依据当前 MCP 文档核验 |
| [Build Agents That Run for Hours](https://www.youtube.com/watch?v=mR-WAvEPRwE)，AI Engineer with Anthropic | Checkpoint、评估器、工作契约和长周期一致性 | [10:14 的 Checkpoint](https://www.youtube.com/watch?v=mR-WAvEPRwE&t=614s)、[19:02 的评估器](https://www.youtube.com/watch?v=mR-WAvEPRwE&t=1142s) |

## 实践实验来源

- [Your First Agent on the Raw Messages API](https://www.youtube.com/watch?v=RheXq2HKJmY)
  为原始状态机实验提供支持：检查 `stop_reason`、保留完整消息历史、匹配 Tool 使用标识符、返回 Tool 结果，并在满足明确的终止条件时停止。
- [Hooks, Guardrails and Security](https://www.youtube.com/watch?v=GGO4tn4RTvY)
  为破坏性命令阻止、输出规范化、证据检查和间接 Prompt injection 测试夹具提供支持。
- [Complete Beginner's Course on AI Evaluations](https://www.youtube.com/watch?v=TL527yTpxlk)
  提供了实用的 golden set 和人工 Label 教学顺序。
- [How to Systematically Set Up LLM Evals](https://www.youtube.com/watch?v=a3SMraZWNNs)
  强化了单元检查、人工审查、Model judge、A/B 比较，以及分析-度量-改进循环。

## 认证配套资源

- [Claude Certified Architect Foundations full course](https://www.youtube.com/watch?v=reDRM0tqhNs)，
  由 freeCodeCamp 和 ExamPro 制作，是一份广泛的主题清单。它不是编辑范本，也不定义考试事实。
- [Claude Certified Architect Foundations exam review](https://www.youtube.com/watch?v=n-Jse3TE3MI)，
  由 Tim Warner 制作，强调针对每个公开场景构建项目，而不是记忆答案。
- 独立的 Associate 和 Professional 课程表明，场景连续性和事件优先教学是有效的。本课程使用这些模式，但采用全新的场景和语言。

## 用户提供的审查集合

这些来源已作为社区材料接受审查，并依据当前官方考试指南、认证 FAQ、Academy 课程目标和产品文档进行核验。

| 来源 | 保留的信号 | 不作为事实的主张 |
|--------|-------------|---------------------------|
| [freeCodeCamp and ExamPro CCAR-F course](https://www.youtube.com/watch?v=reDRM0tqhNs) | 覆盖公开 CCAR-F 场景的构建优先顺序 | 演示行为、个人建议，以及缺少当前文档支持的产品详情 |
| [Chance Xie exam experience](https://www.youtube.com/watch?v=kY9z4hiH4nk) | 实践使用和场景推理比术语记忆更重要 | 分数、准备时间、难度和回忆的题目模式 |
| [Preporato study guide](https://www.youtube.com/watch?v=akzKBQVyFEI) | 实用的学习节奏和错误答案分类法 | 从原始分数到通过结果的换算、保证有效的时间表，以及预测的考试分布 |
| [Ivan Fediaev exam breakdown](https://www.youtube.com/watch?v=PUnB9b6VIWk) | 检查具体机制和被排除的替代方案 | 个人遇到的考试构成、难度排名和回忆的题目 |
| [freeCodeCamp Claude Code Essentials](https://www.youtube.com/watch?v=brLhhkUqcn4) | 适合考生长期练习的配套资源 | 未引入任何事实主张：本次审查期间无法获得公开字幕 |
| [Peace Of Code 22-video playlist](https://www.youtube.com/playlist?list=PLviC8AFqAj5A9MHkRIn2fU5Ac2lEdJxNf) | Agent 循环、subagent 契约、Tool、恢复、Context 和审查演示 | 旧版 MCP transport 指南、用仅依赖 Prompt 的 JSON 替代原生结构化输出，以及考试安排 |
| [Tech With Deepanshu Academy ranking](https://www.youtube.com/watch?v=OYyYlH6Un0Y) | 优先学习 API 生命周期、Claude Code 运营、Skill、MCP、subagent 和能力限制 | 固定课程数量、课程排名、学习时长估算、证书价值，以及高级主题曾出现在考试中的主张 |

该排名视频将目录称为包含 18 门课程、五条 Track 的集合，并估计完整学习一遍需要 50 至 60 小时。Academy 变化太快，这些数字不能成为课程的不变量。本 repository 改为将官方课程目标映射到持久课程，并记录核验日期。

有一项直接更正对教学很重要：该视频将 AI Fluency 的第四项能力称为 “Dialogue”。官方框架是 **Delegation、Description、Discernment 和 Diligence**。本课程使用官方术语。视频旁白还表示演讲者完成了 17 门课程，却同时描述了包含 18 门课程的目录，这进一步说明不应将目录数量保留为要求。

## 标准教学模式

1. 展示一个合理可信的失败。
2. 捕获可度量的基线。
3. 添加一项设计干预。
4. 同时测试最终状态和执行轨迹。
5. 记录被排除的替代方案。
6. 将结果打包为其他人可以检查的产物。

安全实验始终包含 red-team 测试夹具。架构实验始终包含独立审查者。Professional 实验始终以面向利益相关者的说明和指定的运营负责人收尾。

## 漂移警告

- 2025 年 3 月的 MCP workshop 早于后续 transport、身份验证、registry 和 SDK 变更。
- 较早的 Claude Code 视频可能保留了良好的工作流建议，但其中展示的设置 key、权限行为或 Feature 名称可能已经过时。
- 独立认证课程可能落后于蓝图修订。
- 个人考试报告属于学习者轶事，而不是规范。
- 关于课程数量、时长、排名和认证价值的主张，是目录快照或个人观点，而不是持久的认证要求。
- 没有任何来源可以为答案模式技巧、重建题目、题库泄露或保证通过的主张提供依据。
