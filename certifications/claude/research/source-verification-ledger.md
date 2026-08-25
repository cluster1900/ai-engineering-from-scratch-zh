# Claude Certification 来源核验记录

> 社区材料用于发现教学缺口。Anthropic 官方来源决定哪些内容可以成为课程事实。

**核验日期：** 2026-08-09

## 权威性顺序

1. 当前公开考试指南和认证 FAQ 定义蓝图、交付方式、评分、资格、有效期、定价和重考政策。
2. 当前 Anthropic 产品文档和 Academy 课程目标定义产品机制及推荐的学习内容。
3. 社区视频、文章和练习材料可以为讲解、练习或薄弱领域提供建议，但不能定义考试。
4. 不使用任何来源重建保密题目或承诺通过考试。

## 已核验的项目事实

- 目前仅限 Claude Partner Network 组织注册，并且需要获得认可的公司域名。
- Pearson 通过在线监考或考试中心提供考试。
- 每场考试允许 120 分钟。考生应为完整预约预留约 135 分钟。
- 通过标准是在 100 至 1,000 分量表中获得 720 的换算分数，并非原始百分比换算。
- 认证有效期为 12 个月。
- 考试采用闭卷形式。不允许使用文档、笔记、AI 助手和浏览器翻译 Tool。
- 重考等待期依次为 14 天、30 天和 90 天；在滚动的 12 个月内，每场考试最多可参加四次。
- 先前的官方练习考试已停用。当前考试指南包含示例题目。
- 当前标价分别为：Associate Foundations 99 美元、Developer Foundations 125 美元、Architect Foundations 125 美元，以及 Architect Professional 175 美元。
- Architect Foundations 不是 Architect Professional 的先修要求，也不会自动升级为 Architect Professional。

来源：[官方认证 FAQ](https://anthropic-partners.skilljar.com/page/faq-certifications)、
[官方备考课程索引](https://anthropic-partners.skilljar.com/page/claude-certification-exam-prep-courses)、
[CCAO-F 指南](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542847%2FClaude+Certified+Associate+%E2%80%93+Foundations+Exam+Guide.pdf)、
[CCDV-F 指南](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542875%2FClaude+Certified+Developer+%E2%80%93+Foundations+Exam+Guide.pdf)、
[CCAR-F 指南](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542750%2FClaude+Certified+Architect+%E2%80%93+Foundations+Exam+Guide.pdf)，以及
[CCAR-P 指南](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542810%2FClaude+Certified+Architect+%E2%80%93+Professional+Exam+Guide.pdf)。

## 社区主张处理结论

### 考生文章

随附的考生评论有助于确定具体机制和场景判断的优先级。其中公布的时间安排、分数、课程完成时间估算、考试难度排名、推荐考试顺序和回忆的题目构成仍属于第一手经验。

以下两项主张不得成为官方课程事实：

- 考试并非仅支持在线参加。Pearson 也提供考试中心服务。
- 已发布的 CCAR-P 规范列出了单项选择题和多项选择题。某位考生观察到的匹配或下拉界面并不构成第三种官方题型。

### 练习 PDF

所提供的 60 题 Associate 练习材料包遵循七个公开领域的权重，其答案可以得到合理辩护。它仍然是独立练习来源，本课程没有复制其中任何题目措辞。

以下三项注意事项影响了本课程自身的解析：

- 内部笔记工作流必须明确说明内容不敏感，并且已根据组织政策获得批准。
- 项目知识是可检索的 Context，而不会自动成为事实。相关主张仍需验证。
- 75% 的练习目标是一种学习启发式标准，并不等同于官方换算分数。

### 视频和播放列表

每个来源的完整处理结论记录在
[`youtube-source-review.md`](youtube-source-review.md) 中。在整个审查集合中，保留的持久信号包括实践构建、具体机制查证、场景权衡、错误诊断和重复复习。个人分数、学习时长、目录数量、产品排名、回忆的题目，以及保证某主题必然出现的主张，均被拒绝作为事实输入。

Academy 排名视频将 AI Fluency 的第四项能力错误地称为 “Dialogue”。Anthropic 官方框架使用 **Diligence**。本课程教授 Delegation、Description、Discernment 和 Diligence。

## 产品机制漂移控制

- 将 stdio 和 Streamable HTTP 视为当前 MCP transport。仅在需要历史背景时，将旧版 HTTP+SSE 标记为已弃用。
- 当需要机器契约时，优先使用原生结构化输出或严格的 Tool schema，而不是仅依赖 Prompt 的 JSON。
- 通过标注日期的决策流程教授速度、effort、thinking 和 Model 选择，而不是使用永久兼容性表。
- 发布前，根据当前文档核验准确的 Claude Code flag、路径、设置优先级、hook 和 Agent SDK 生命周期字段。
- 将直接使用 Claude、Amazon Bedrock、Google Vertex AI 和 Microsoft Foundry 保留为部署选项，其适用性取决于采购、身份、合规性、Cloud 承诺、运营控制和成本。

## 发布规则

发布课程前，重新检查 FAQ、四份考试指南、官方课程目标，以及课程中引用的每项具体产品机制。仅有社区来源的变化，绝不足以成为修改蓝图、分数、资格规则或评估格式的依据。
