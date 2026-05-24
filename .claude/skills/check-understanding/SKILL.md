---
name: check-understanding
version: 1.0.0
description: AI Engineering from Scratch 的阶段测验。触发词包括 "quiz me"、"test phase"、"check my understanding"、"do I know phase 3"、"考我一下"、"测一下第几阶段"、"检查理解"，或 `/check-understanding <phase>`。
---

# Check Understanding

测试你对 AI Engineering from Scratch 课程中某个已完成阶段的掌握程度。

## 触发方式

当用户说出以下内容时激活：
- `/check-understanding 3` 或 `/check-understanding deep-learning`
- "考我一下 phase 2"
- "测一下第 1 阶段"
- "检查我对 transformers 的理解"
- "我搞懂 phase 3 了吗"
- "可以进入下一阶段了吗"

## 输入

接收一个阶段编号（0-19）或阶段名作为参数。如果没有提供参数，则列出全部 20 个阶段，询问用户想测哪一个。

## 阶段对照表

将参数映射到 `phases/` 下对应的阶段目录：

| 输入关键词 | 目录 | 阶段名 |
|-----------|------|--------|
| 0, setup, tooling | `00-setup-and-tooling` | Setup & Tooling |
| 1, math, math-foundations | `01-math-foundations` | Math Foundations |
| 2, ml, ml-fundamentals | `02-ml-fundamentals` | ML Fundamentals |
| 3, deep-learning, dl | `03-deep-learning-core` | Deep Learning Core |
| 4, cv, computer-vision, vision | `04-computer-vision` | Computer Vision |
| 5, nlp | `05-nlp-foundations-to-advanced` | NLP -- Foundations to Advanced |
| 6, speech, audio | `06-speech-and-audio` | Speech & Audio |
| 7, transformers | `07-transformers-deep-dive` | Transformers Deep Dive |
| 8, generative, gen-ai, genai | `08-generative-ai` | Generative AI |
| 9, rl, reinforcement-learning | `09-reinforcement-learning` | Reinforcement Learning |
| 10, llms, llm, llms-from-scratch | `10-llms-from-scratch` | LLMs from Scratch |
| 11, llm-engineering, llm-eng | `11-llm-engineering` | LLM Engineering |
| 12, multimodal | `12-multimodal-ai` | Multimodal AI |
| 13, tools, protocols, mcp | `13-tools-and-protocols` | Tools & Protocols |
| 14, agents, agent-engineering | `14-agent-engineering` | Agent Engineering |
| 15, autonomous | `15-autonomous-systems` | Autonomous Systems |
| 16, multi-agent, swarms | `16-multi-agent-and-swarms` | Multi-Agent & Swarms |
| 17, infrastructure, production, infra | `17-infrastructure-and-production` | Infrastructure & Production |
| 18, ethics, safety, alignment | `18-ethics-safety-alignment` | Ethics, Safety & Alignment |
| 19, capstone, projects | `19-capstone-projects` | Capstone Projects |

## 流程

### Step 1: 解析阶段

解析参数。如果是数字，校验它在 0 到 19 之间（含端点）。如果超出范围，告诉用户："Phase [N] 不存在。有效的阶段编号是 0-19。"，并把完整列表展示出来让用户挑选。如果是名称或关键词，到上面的阶段对照表里查找。如果关键词在表中找不到对应项，告诉用户："未知阶段 '[keyword]'。请从下面的列表中挑选："，然后展示全部 20 个阶段。如果没有提供任何参数，让用户从完整列表中挑选。

### Step 2: 阅读阶段内容

用 Glob 找到 `phases/<phase-dir>/` 下的所有 lesson 目录。对每个 lesson，读取 `docs/en.md` 文件。这些文档就是后续出题的依据。

读够覆盖整个阶段广度的 lesson 文档。如果某个阶段 lesson 很多（15 个以上），则按代表性分布优先阅读：开头几个、中间几个、最后几个。

### Step 3: 生成 8 道题

依据刚才读到的 lesson 内容，恰好出 8 道选择题：

**第 1-4 题：概念题（What/Why）**
考察对概念、定义和推理的理解。示例：
- "X 的目的是什么？"
- "在 Z 的情况下，为什么会发生 Y？"
- "哪句话最能准确描述 A 与 B 之间的关系？"
- "X 解决了什么问题？"

**第 5-8 题：实践题（How/Build）**
考察应用知识与实现意识。示例：
- "你会如何实现 X？"
- "哪种方法能正确解决 Y？"
- "搭建 Z 的正确步骤顺序是什么？"
- "如果训练过程中你观察到 X，应该怎么做？"

每道题必须有 3 或 4 个选项，分别用 A、B、C（必要时 D）标注。恰好一个选项正确。错误选项要看起来合理，但对于真正学过这部分内容的人来说应是明显错误。

为每道题标注它来自哪个具体的 lesson（例如："Lesson 03: Matrix Transformations"）。

### Step 4: 每次只呈现一道题

使用 AskUserQuestion 工具（或等效的交互式提问方式）逐题呈现。格式：

```
第 1/8 题（概念题）-- 来自 Lesson 03: Matrix Transformations

eigenvalue 的几何意义是什么？

A) 矩阵带来的旋转角度
B) 该 eigenvector 在变换过程中被缩放的倍数
C) 变换矩阵的 determinant
D) 变换后矩阵的 rank
```

等用户作答后再进入下一题。

### Step 5: 记录与计分

持续记录：
- 8 题里答对了多少题
- 对每道答错的题，记下：题号、用户的答案、正确答案、来自哪个 lesson

### Step 6: 展示结果

8 题答完后，显示得分与评级：

**7-8 分：Mastered（已掌握）**
如果该阶段是 19（Capstone Projects）："你已经掌握了最后一个阶段。恭喜你完成整个课程。"
否则："你对 Phase N 掌握得很扎实。可以进入 Phase N+1：[下一阶段名称]。"

**5-6 分：Almost（接近掌握）**
"基础不错。在进入下一阶段前，建议复习这些具体内容："
然后列出错题对应的 lesson。

**3-4 分：Developing（还在建立）**
"你正在建立理解，但有些 lesson 需要回头看："
然后逐题列出每道错题及其需要重读的 lesson。

**0-2 分：Start Over（重新开始）**
"这个阶段还需要更多时间。把 lesson 从头再过一遍，重点关注："
然后列出所有错过的主题。

### Step 7: 错题逐题解析

对用户答错的每一道题，展示：

```
第 N 题：[题目文本，可简写]
你的答案：B
正确答案：C -- [正确选项的文本]
原因：[用 1-2 句话解释为什么 C 是正确的]
复习：Lesson NN -- [lesson 名称] (phases/<phase-dir>/NN-<lesson-slug>/docs/en.md)
```

### Step 8: 接下来怎么做？

最后给出三个选项：

1. **再考一次本阶段** -- 从同一阶段重新出一组 8 题
2. **换一个阶段** -- 选择另一个阶段进行测试
3. **讲解某个主题** -- 针对你答错题里的任意概念提问

等用户作出选择后据此执行。

## 规则

- 在题库未耗尽前，重考时避免重复同一道题。一旦耗尽，再次重考时打乱顺序或改写题目。
- 题目必须直接基于 lesson 文档内容，不能用通用知识。
- 在用户作答之前，不要展示正确答案。
- 题目文本要简洁，最多一两句话。
- 错误选项要合理，不要写搞笑型答案。
- 如果某阶段还没有写好 lesson 文档（找不到 `en.md` 文件），告诉用户："Phase N 还没有 lesson 内容。请选择一个已完成的阶段进行测试。"
