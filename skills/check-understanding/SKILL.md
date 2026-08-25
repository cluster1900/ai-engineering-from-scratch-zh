---
name: check-understanding
version: 1.0.0
description: AI Engineering from Scratch 的阶段测验。可通过“测验我”“测试阶段”“检查我的理解程度”“我掌握阶段 3 了吗”或 `/check-understanding <phase>` 触发。
---

# 检查理解程度

测试你对 AI Engineering from Scratch 课程中已完成阶段的掌握情况。

## 激活方式

当用户说出类似以下内容时，激活此 Skill：
- `/check-understanding 3` 或 `/check-understanding deep-learning`
- “测验我对阶段 2 的掌握情况”
- “测试阶段 1”
- “检查我对 Transformer 的理解程度”
- “我掌握阶段 3 了吗”
- “我准备好进入下一个阶段了吗”

## 输入

接受阶段编号（0-19）或阶段名称作为参数。如果未提供参数，请列出全部 20 个阶段，并询问用户希望测试哪个阶段。

## 阶段映射

将参数映射到 `phases/` 下正确的阶段目录：

| 输入 | 目录 | 阶段名称 |
|-------|-----------|------------|
| 0, setup, tooling | `00-setup-and-tooling` | 设置与工具 |
| 1, math, math-foundations | `01-math-foundations` | 数学基础 |
| 2, ml, ml-fundamentals | `02-ml-fundamentals` | ML 基础 |
| 3, deep-learning, dl | `03-deep-learning-core` | Deep Learning 核心 |
| 4, cv, computer-vision, vision | `04-computer-vision` | 计算机视觉 |
| 5, nlp | `05-nlp-foundations-to-advanced` | NLP——从基础到进阶 |
| 6, speech, audio | `06-speech-and-audio` | 语音与音频 |
| 7, transformers | `07-transformers-deep-dive` | Transformer 深入解析 |
| 8, generative, gen-ai, genai | `08-generative-ai` | 生成式 AI |
| 9, rl, reinforcement-learning | `09-reinforcement-learning` | Reinforcement Learning |
| 10, llms, llm, llms-from-scratch | `10-llms-from-scratch` | 从零构建 LLMs |
| 11, llm-engineering, llm-eng | `11-llm-engineering` | LLM 工程 |
| 12, multimodal | `12-multimodal-ai` | Multimodal AI |
| 13, tools, protocols, mcp | `13-tools-and-protocols` | Tools 与协议 |
| 14, agents, agent-engineering | `14-agent-engineering` | Agent 工程 |
| 15, autonomous | `15-autonomous-systems` | 自主系统 |
| 16, multi-agent, swarms | `16-multi-agent-and-swarms` | Multi-Agent 与集群 |
| 17, infrastructure, production, infra | `17-infrastructure-and-production` | 基础设施与生产环境 |
| 18, ethics, safety, alignment | `18-ethics-safety-alignment` | 伦理、安全与对齐 |
| 19, capstone, projects | `19-capstone-projects` | Capstone 项目 |

## 流程

### 第 1 步：解析阶段

解析参数。如果参数是数字，验证它是否在 0 到 19（含）之间。如果数字超出范围，告诉用户：“阶段 [N] 不存在。有效阶段为 0-19。”并显示完整列表供其选择。如果参数是名称或关键词，在上方阶段映射表中查找。如果关键词与映射表中的任何条目均不匹配，告诉用户：“未知阶段 '[keyword]'。请从下方列表中选择：”并展示全部 20 个阶段。如果未提供参数，请用户从完整列表中选择。

### 第 2 步：读取阶段内容

如果 repo 已克隆（当前目录或其上级目录中存在 `phases/` 目录），查找 `phases/<phase-dir>/` 下的所有课程目录，并读取每节课程的 `docs/en.md`。如果尚未克隆，则从 README 的目录章节获取该阶段的课程列表（获取 `https://raw.githubusercontent.com/rohitg00/ai-engineering-from-scratch/main/README.md`），然后从同一个 raw 基础 URL 获取每节课程的 `docs/en.md`。这些文档包含用于生成问题的教学材料。

根据需要读取足够多的课程文档，以覆盖该阶段的全部内容范围。如果一个阶段包含很多课程（15 节以上），优先选择具有代表性的分布：最前面的几节、中间几节和最后几节。

### 第 3 步：生成 8 道题

根据刚刚读取的课程内容，准确创建 8 道选择题：

**问题 1-4：概念题（是什么/为什么）**
这些问题测试对思想、定义和推理的理解。例如：
- “X 的目的是什么？”
- “当 Z 发生时，为什么会出现 Y？”
- “以下哪项陈述最准确地描述了 A 与 B 之间的关系？”
- “X 解决了什么问题？”

**问题 5-8：实践题（怎么做/如何构建）**
这些问题测试应用知识和实现意识。例如：
- “你会如何实现 X？”
- “哪种方法能够正确解决 Y？”
- “构建 Z 的正确步骤顺序是什么？”
- “如果你在 Training 期间观察到 X，应该怎么做？”

每道题必须包含 3 或 4 个答案选项，并标记为 A、B、C（以及可选的 D）。只能有一个正确选项。错误选项应具有迷惑性，但对学过材料的人而言应明确不正确。

为每道题标注其来源课程（例如，“课程 03：Matrix 变换”）。

### 第 4 步：逐题展示

使用 AskUserQuestion Tool（或等效的交互式 Prompt）逐题展示。格式如下：

```text
问题 1/8（概念题）——来自课程 03：Matrix 变换

Eigenvalue 的几何解释是什么？

A) Matrix 施加的旋转角度
B) Eigenvector 在变换期间被缩放的倍数
C) 变换 Matrix 的 Determinant
D) 变换后 Matrix 的 Rank
```

等待用户回答后，再继续下一题。

### 第 5 步：记录并评分

持续记录：
- 8 道题中的答对总数
- 对于每个错误答案，记录：题号、用户答案、正确答案以及题目来源课程

### 第 6 步：显示结果

完成全部 8 道题后，显示分数和等级：

**答对 7-8 道：已掌握**
如果测试的是阶段 19（Capstone 项目）：“你已经掌握了最后一个阶段——阶段 19。”只有当你能验证课程的其他部分均已完成时（当前目录中的 `LEARNING.md`，其 Path 表显示阶段 0-18 均为 Done 或 Skip），才添加：“恭喜，你已经完成整个课程体系。”单次阶段测验不能证明整个课程体系已经完成。
否则：“你已经扎实掌握阶段 N，可以继续学习阶段 N+1：[下一阶段名称]。”

**答对 5-6 道：接近掌握**
“基础扎实。在继续之前，请复习以下具体内容：”
然后列出与答错问题相关的课程。

**答对 3-4 道：正在形成理解**
“你正在建立理解，但还需要重新学习部分课程：”
然后列出每道答错的问题以及需要重新阅读的课程。

**答对 0-2 道：重新开始**
“这个阶段还需要投入更多时间。请从头重新学习这些课程，并重点关注：”
然后列出所有未掌握的主题。

### 第 7 步：错题分析

针对用户答错的每道题，显示：

```text
问题 N：[问题文本，缩写]
你的答案：B
正确答案：C——[正确选项文本]
原因：[用 1-2 句话解释为什么 C 正确]
复习：课程 NN——[课程名称]（phases/<phase-dir>/NN-<lesson-slug>/docs/en.md）
```

### 第 8 步：下一步做什么？

最后提供三个选项：

1. **重新参加本次测验**——从同一阶段生成一套新的 8 道题
2. **尝试其他阶段**——选择另一个阶段进行测试
3. **解释一个主题**——询问答错问题中的任何概念

等待用户选择，并据此继续。

## 规则

- 在题库耗尽之前，重新测验时应避免重复问题。题库耗尽后，对后续测验重新排序或改写问题。
- 问题必须直接基于课程文档，而不是常识。
- 用户回答前不要显示正确答案。
- 问题文本应简洁，最多一到两句话。
- 错误选项必须具有迷惑性。不要使用搞笑答案。
- 如果某个阶段尚未编写课程文档（未找到 `en.md` 文件），告诉用户：“阶段 N 尚无课程内容。请选择一个已完成的阶段进行测验。”
