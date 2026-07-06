---
name: check-understanding
version: 1.0.0
description: AI Engineering from Scratch 的阶段测验。可通过 "quiz me"、"test phase"、"check my understanding"、"do I know phase 3" 或 `/check-understanding <phase>` 触发。
---

# 检查理解程度

测试你对 AI Engineering from Scratch 课程中已完成阶段的掌握情况。

## 激活方式

当用户说出类似以下内容时，此 skill 会被激活：
- `/check-understanding 3` 或 `/check-understanding deep-learning`
- "quiz me on phase 2"
- "test phase 1"
- "check my understanding of transformers"
- "do I know phase 3"
- "am I ready for the next phase"

## 输入

接受阶段编号（0-19）或阶段名称作为参数。如果未提供参数，请列出全部 20 个阶段，并询问用户想测试哪个阶段。

## 阶段映射

将参数映射到 `phases/` 下正确的阶段目录：

| Input | Directory | Phase Name |
|-------|-----------|------------|
| 0, setup, tooling | `00-setup-and-tooling` | 设置与工具 |
| 1, math, math-foundations | `01-math-foundations` | 数学基础 |
| 2, ml, ml-fundamentals | `02-ml-fundamentals` | ML 基础 |
| 3, deep-learning, dl | `03-deep-learning-core` | Deep Learning 核心 |
| 4, cv, computer-vision, vision | `04-computer-vision` | Computer Vision |
| 5, nlp | `05-nlp-foundations-to-advanced` | NLP -- 从基础到进阶 |
| 6, speech, audio | `06-speech-and-audio` | 语音与音频 |
| 7, transformers | `07-transformers-deep-dive` | Transformers 深入解析 |
| 8, generative, gen-ai, genai | `08-generative-ai` | Generative AI |
| 9, rl, reinforcement-learning | `09-reinforcement-learning` | Reinforcement Learning |
| 10, llms, llm, llms-from-scratch | `10-llms-from-scratch` | 从零构建 LLMs |
| 11, llm-engineering, llm-eng | `11-llm-engineering` | LLM Engineering |
| 12, multimodal | `12-multimodal-ai` | Multimodal AI |
| 13, tools, protocols, mcp | `13-tools-and-protocols` | 工具与协议 |
| 14, agents, agent-engineering | `14-agent-engineering` | Agent Engineering |
| 15, autonomous | `15-autonomous-systems` | Autonomous Systems |
| 16, multi-agent, swarms | `16-multi-agent-and-swarms` | Multi-Agent 与 Swarms |
| 17, infrastructure, production, infra | `17-infrastructure-and-production` | 基础设施与生产 |
| 18, ethics, safety, alignment | `18-ethics-safety-alignment` | 伦理、安全与 Alignment |
| 19, capstone, projects | `19-capstone-projects` | Capstone Projects |

## 流程

### Step 1: 解析阶段

解析参数。如果参数是数字，验证它是否在 0 到 19（含）之间。如果数字超出范围，告诉用户："Phase [N] does not exist. Valid phases are 0-19."，并显示完整列表供其选择。如果参数是名称或关键词，请在上方的阶段映射中查找。如果关键词不匹配映射中的任何条目，告诉用户："Unknown phase '[keyword]'. Pick from the list below:"，并展示全部 20 个阶段。如果未提供参数，请让用户从完整列表中选择。

### Step 2: 读取阶段内容

使用 Glob 查找 `phases/<phase-dir>/` 下的所有 lesson 目录。对于每个 lesson，读取 `docs/en.md` 文件。这些文档包含你将用于生成问题的教学材料。

根据需要读取足够多的 lesson docs，以覆盖该阶段的完整广度。如果某个阶段包含很多 lessons（15+），优先读取有代表性的分布：前几课、中间部分和最后几课。

### Step 3: 生成 8 道问题

基于刚刚读取的 lesson 内容，创建恰好 8 道选择题：

**问题 1-4：概念类（What/Why）**
这些问题测试对思想、定义和推理的理解。示例：
- "X 的目的是什么？"
- "为什么 Z 发生时会出现 Y？"
- "哪一句最准确描述 A 与 B 的关系？"
- "X 解决了什么问题？"

**问题 5-8：实践类（How/Build）**
这些问题测试应用知识和实现意识。示例：
- "你会如何实现 X？"
- "哪种方法能正确解决 Y？"
- "构建 Z 的正确步骤顺序是什么？"
- "如果训练期间观察到 X，你应该怎么做？"

每道题必须有 3 或 4 个答案选项，标记为 A、B、C（以及可选的 D）。恰好一个选项是正确的。错误选项应当看起来合理，但对于学过材料的人来说应明显不正确。

为每道题标注其来源的具体 lesson（例如："Lesson 03: Matrix Transformations"）。

### Step 4: 一次呈现一道问题

使用 AskUserQuestion tool（或等效的交互式提示）逐题单独呈现。格式：

```
Question 1/8 (Conceptual) -- from Lesson 03: Matrix Transformations

What is the geometric interpretation of an eigenvalue?

A) The angle of rotation applied by the matrix
B) The factor by which the eigenvector is scaled during transformation
C) The determinant of the transformation matrix
D) The rank of the matrix after transformation
```

等待用户回答后再进入下一题。

### Step 5: 跟踪并计分

持续记录：
- 8 题中的正确总数
- 对于每个错误答案，记录：题号、用户答案、正确答案，以及它来自哪个 lesson

### Step 6: 显示结果

完成全部 8 道题后，显示分数和等级：

**7-8 题正确：Mastered**
如果阶段是 19（Capstone Projects）："你已经掌握了最终阶段。恭喜，你已经完成了整套课程。"
否则："你已经很好地掌握了 Phase N，可以进入 Phase N+1：[next phase name]。"

**5-6 题正确：Almost**
"基础扎实。继续之前，请复习这些具体方面："
然后列出与错题相关的 lessons。

**3-4 题正确：Developing**
"你正在建立理解，但还需要回看一些课程："
然后列出每道错题以及需要重读的 lesson。

**0-2 题正确：Start Over**
"这个 Phase 需要更多时间。请从头重新学习这些课程，并重点关注："
然后列出所有遗漏主题。

### Step 7: 错题解析

对于用户答错的每一道题，显示：

```
Question N: [question text, abbreviated]
Your answer: B
Correct answer: C -- [the correct option text]
Why: [1-2 sentence explanation of why C is correct]
Review: Lesson NN -- [lesson name] (phases/<phase-dir>/NN-<lesson-slug>/docs/en.md)
```

### Step 8: 下一步？

最后提供三个选择：

1. **重新参加本次测验** -- 从同一阶段生成一组新的 8 道题
2. **尝试另一个阶段** -- 选择另一个阶段进行测试
3. **解释一个主题** -- 询问你错过的问题中的任意概念

等待用户选择，并据此行动。

## 规则

- 在题库耗尽之前，重测时避免重复问题。题库耗尽后，对后续重测进行重新洗牌或改写问题。
- 问题必须直接基于 lesson docs，而不是泛泛的通用知识。
- 在用户回答之前，不要显示正确答案。
- 问题文本保持简洁。最多一到两句话。
- 错误选项必须看起来合理。不要使用搞笑答案。
- 如果某个阶段还没有写好的 lesson docs（未找到 `en.md` 文件），告诉用户："Phase N does not have lesson content yet. Pick a completed phase to quiz on."
