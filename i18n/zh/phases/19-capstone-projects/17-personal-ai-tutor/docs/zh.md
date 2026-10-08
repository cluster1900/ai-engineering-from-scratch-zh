# 个人人工智能导师 ((自适应、多模拟、带记忆)

> 汉明戈 (Khan Academy) 、杜林戈马克斯、谷歌学习LM/双子座教育、查询Q-Chat 和合成导师都在2026年规模化交付自适应多模特辅导──共同形态是苏格拉底政策──绝不只是直接给出答案) 、每次交互后都会更新的学习模型──贝叶学知识追踪风格──语音+文字+图片数学输入──课程图片 检查索索索、空间重复调度,以及针对适龄内容的严格安全过──本卡普斯通需要向特定学科的导师提供一个K-12代数或Python介绍,使用10名学习者运行一次为期期并两个周的效果研究,通过内容安全审核──

**Type:** Capstone
**Languages:** Python（backend、learner model）、TypeScript（web app）、SQL（通过 Postgres + Neo4j 构建 curriculum graph）
**Prerequisites:** Phase 5（NLP）、Phase 6（speech）、Phase 11（LLM engineering）、Phase 12（Multimodal）、Phase 14（agents）、Phase 17（infrastructure）、Phase 18（safety）
**Phases exercised:**五·六·十一·十二·十四·十七·十八
**Time:** 30 小时

## 问题
自适应辅导过去曾经是电子技术研究中的小众方向――到2026年,它已经成为消费级产品――Khanmigo 已部署到美国大多数学区――Duolingo Max 达到了数千万 MAU――Google的学习LM /双胞胎为教育为谷歌教室提供辅导能力――查询Q-Chat与闪卡并列使用――合成导师借助导师为好奇儿童 走红红――共同要素包括:多模拟 输入打字、说话、拍摄方程) 索克拉特教学(先问,后话解释) 每次交互都会更新学习模型,以及严格的适龄安全性――

你将为特定团队构建其中一个系统.衡量标准是一个真实的效果研究.

## 概念
五个组件.**Tutor policy**是一个苏格拉底循环:当学习者要求答案时,政策会提出引导性问题;当他们回答时,它会进入下一个概念;当他们卡住时,它会提供架架的提示.**Learner model**是贝叶斯知识追踪 (或简单变体), 在每次交互后更新每个课程节点的掌握概率.**Curriculum graph**是一个包含概念和先决边缘的Neo4j;政策 遍历该图 来选择下一个概念.**Memory**是一个剧情+语义存储器,保存过往交互、错误和偏好──

通过LiveKit + Whisper 实现(复用顶石03),照片输入 用于通过dots.ocr或PaliGemma 2处理数学题.

效果研究是交付物物──10名学习者,前测试和后测试,为期两周──报告学习增长的特拉和信心间隔──与非适应的基线对比(同样的内容以线性方式交付,不使用导师政策)──

## 架构
```
learner device
  |
  +-- text         -> web app
  +-- voice        -> LiveKit Agents (ASR + TTS)
  +-- photo math   -> dots.ocr / PaliGemma 2
       |
       v
  tutor policy (LangGraph)
       - Socratic decision head
       - next-concept chooser (curriculum graph walk)
       - hint scaffolder
       - mastery update
       |
       v
  learner model (BKT / item-response theory)
       - per-concept mastery probability
       - spaced-repetition scheduler (SM-2 or FSRS)
       |
       v
  memory (agentmemory-style)
       - episodic: every interaction
       - semantic: learned mistakes, preferences
       - retention policy: COPPA / GDPR aware
       |
       v
  curriculum graph (Neo4j)
       - prerequisite edges
       - OER content attached
       |
       v
  safety:
    Llama Guard 4 + age-appropriate filter
    memory access guarded by learner ID scope
```

## 技术
- 学科选择:K-12代数或介绍Python(选择一个深入做)
- 导师政策:基于Claude Sonnet 4.7 的 LangGraph(带快速缓存)
- 学习者模型:贝叶斯知识追踪 (古典) 或用于间隔的FSRS
- 课程图:包含概念+先决条件边缘+OER内容的Neo4j
- 记忆:代理记忆 风格的持久 矢量+剧集+语义存储
- 声:LiveKit代理 1.0 +卡特西亚索尼克-2 (复用底石03子堆)
- 图片数学:dots.ocr 或 PaliGemma 2 用于识别方程
- 安全:Llama Guard 4 + 自定义适龄过器
- :花级 问题生成、测试前/后,效率研究工具


```figure
cf-tutor-loop
```

## 构建它
1. **Curriculum graph.**构建一个包含50-150个概念节点的Neo4j (例如K-12代数,从"数线"到"方程公式"),并带有先决边缘.

2. **Learner model.**使用先例 初始化贝耶斯知识追踪:猜测,滑滑,学习率.

3. **Tutor policy.**拉格格拉夫节点包括:`read_signal`(学习者答案是正确的?`select_concept`(通过课程图,选择优先级最高的概念)`scaffold`现在,我们要做什么?`update_mastery`,我知道.

4. **Memory.**每次交互都写入剧集存储.错误和偏好将升级到语义记忆.

5. **Voice path.**将LiveKit代理工作者 接入导师政策──ASR 使用Whisper-v3-turbo──TTS 使用Cartesia Sonic-2──支持船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船船

6. **Photo-math path.**上传或拍摄图片;运行点.ocr或PaliGemma 2识别方程;以结构化输入形式传给导师──

7. **Safety.**每个模型输出都经历了Llama Guard 4+ 适龄过器(阻止自伤、成人内容、暴力) ―― 记忆访问 根据学习者ID 设定范围;提供家长删除入口。

8. **Efficacy study.**10 名学习者,预测测量(标准化 30 题基线),两周的导师互动(每周 3 次会议),测试后的.

9. **Weekly progress reports.**为了每个学习者自动生成PDF总结,包含了探索的主题,炼的轨迹和推的下一步.

## 使用它
```
learner: "I don't understand why 3x + 6 = 12 means x = 2"
[signal]   stuck
[concept]  'isolating variables' (prerequisite: addition-subtraction-equality)
[scaffold] "what number would you subtract from both sides to start?"
learner: "6"
[signal]   correct
[mastery]  addition-subtraction-equality: 0.62 -> 0.77
[concept]  continue 'isolating variables'
[scaffold] "great. now what is 3x / 3 equal to?"
```

## 交付它
`outputs/skill-ai-tutor.md`是交付物物. 一个面向特定学科的自适应导师,具有多模拟输入,学习者模型,记忆,安全以及可测量的效果.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Learning gain delta | 10 名学习者、两周研究中的 pre/post-test delta |
| 20 | Socratic fidelity | transcript samples 的 rubric score |
| 20 | Multimodal UX | Voice + photo + text 的端到端一致性 |
| 20 | Safety + privacy posture | Llama Guard 4 pass rate + COPPA-aware retention |
| 15 | Curriculum breadth and graph quality | Concept coverage + prerequisite graph consistency |
| **100** | | |

## 练习
1. 分别在启用和不启用适应学习模型的情况下运行效率研究.

2. 添加一个多模特探测器:同一个概念问题 分别以文字、声音 和照片形式交付──衡量学习者是否在其偏好的模式下更快收──

3. 构建主题仪表板:练习过的主题,炼的轨迹,即将学习的概念,安全事件,任何防线撞击事件.

4. 添加语言切换模式:教师接受西班牙语 输入并使用西班牙语教学――衡量X-Guard覆盖――

5. 对于记忆隐私进行压力测试:验证学习者 A 即使通过语音录像重新摄入攻击也无法看到学习者 B 的数据――记录访问尝试并发出警报――

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Socratic policy | "Ask, do not dump" | Tutor 提出引导性问题，而不是直接给出答案 |
| Bayesian knowledge tracing | "BKT" | 用于每个 concept mastery probability 的经典 learner-model equations |
| FSRS | "Free Spaced Repetition Scheduler" | 2024 年 spaced-repetition scheduler，比 SM-2 更好 |
| Curriculum graph | "Concept DAG" | 包含 concepts 与 prerequisite edges 的 Neo4j |
| Episodic memory | "Per-interaction log" | 存储每次交互以便后续检索 |
| Semantic memory | "Learned pattern store" | 从 episodic 中压缩并提升出来的错误和偏好 |
| COPPA | "Kids privacy law" | 美国法律，限制从 13 岁以下儿童收集数据 |

## 延伸阅读
- [Khanmigo (Khan Academy)](https://www.khanmigo.ai) 消费级K-12教师 参考
- [Duolingo Max](https://blog.duolingo.com/duolingo-max/)语言学习教师 参考
- [Google LearnLM / Gemini for Education](https://blog.google/technology/google-deepmind/learnlm) 托管参考模型
- [Quizlet Q-Chat](https://quizlet.com) 替代参考
- [Synthesis Tutor](https://www.synthesis.com)启动 参考
- [FSRS algorithm](https://github.com/open-spaced-repetition/fsrs4anki)间隔重复时间表
- [Bayesian Knowledge Tracing](https://en.wikipedia.org/wiki/Bayesian_knowledge_tracing)学习者模型经典
- [LiveKit Agents](https://github.com/livekit/agents)语音堆
