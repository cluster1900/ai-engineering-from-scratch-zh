# Capstone 17  Personal AI Tutor ((自适应、多模、带 Memory)

> Khanmigo(Khan Academy)、Duolingo Max、Google LearnLM / Gemini for Education、Quizlet Q-Chat 和 Synthesis Tutor đều được giao cho các học viên trong 2026 năm quy mô tự thích ứng Multimodal 辅导。共同形态是苏格拉底政策(绝不只是直接给出答案)、每次交互后都会更新的学习者模型(Bayesian knowledge tracing 风格)、语音 + văn bản + hình ảnh-数学 输入、课程图 检查索、空间-重复调度,以及针对适龄内容的严格安全过──本 Capstone cần phải trả một người hướng dẫn viên trong một ngành cụ thể của các ngành: K-12 algebra hoặc Python), sử dụng 10 名学习者运行一次为期两周的效果研究,通过内容安全审核──

**Type:** Capstone
**Languages:** Python（backend、learner model）、TypeScript（web app）、SQL（通过 Postgres + Neo4j 构建 curriculum graph）
**Prerequisites:** Phase 5（NLP）、Phase 6（speech）、Phase 11（LLM engineering）、Phase 12（Multimodal）、Phase 14（agents）、Phase 17（infrastructure）、Phase 18（safety）
**Phases exercised:**P5 · P6 · P11 · P12 · P14 · P17 · P18
**Time:** 30 小时

## 问题
自适应辅导过去曾经是 ed-tech 研究中的小众方向――到2026年,它已经成为消费级产品――Khanmigo 已部署到美国大多数学区――Duolingo Max 已达到了数千万 MAU――Google's LearnLM / Gemini for Education 为 Google Classroom 提供辅导能力――Quizlet Q-Chat với flashcard 并列使用――Synthesis Tutor 凭借 tutor-for-curious-kids 走红――共同要素包括:Multimodal 输入打字、说话、拍摄方程)、Socratic pedagogy(先问,后话解释)、每次交互都会更新学习者模型,以及严格的适龄安全――

Bạn sẽ xây dựng một hệ thống cho một nhóm cụ thể. Biểu chuẩn là một nghiên cứu hiệu quả thực tế. 10 người học trong hai tuần trước thử nghiệm và sau thử nghiệm.

## 概念
4 bộ phận.**Tutor policy**Đó là một vòng lặp của Socrates: khi học viên yêu cầu câu trả lời, chính sách sẽ đưa ra các vấn đề hướng dẫn; khi họ trả lời đối với, nó sẽ đi vào khái niệm tiếp theo; khi họ bị mắc kẹt, nó sẽ cung cấp gợi ý được xây dựng.**Learner model**là việc theo dõi kiến thức Bayesian (hoặc một biến thể đơn giản), trong mỗi giao tiếp sau khi cập nhật khả năng làm chủ mỗi nút chương trình giảng dạy.**Curriculum graph**là một bao gồm các khái niệm với các cạnh tiên quyết của Neo4j; chính sách 遍历该图 来选择下一个概念──**Memory**là một cửa hàng tập trung + ngữ nghĩa, lưu trữ quá khứ交互、错误和偏好。

UX là đa phương tiện. Ống nhập văn bản được sử dụng để输入答案. Ống nhập giọng nói được sử dụng thông qua LiveKit + Whisper 实现. Ống nhập ảnh được sử dụng thông qua dots.ocr hoặc PaliGemma 2  xử lý các vấn đề toán học. Ống nhập giọng nói được sử dụng thông qua Cartesia Sonic-2 实现.

效果研究是交付物物──10 名学习者,pre-test 和 post-test,为期两周──报告学习获益 delta 和信心间隔──与非适应基线对比(同内容以线性方式交付,不使用导师政策)──

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
- Học科选择:K-12 algebra hoặc intro Python (đặt một bài viết sâu vào làm)
- Chính sách hướng dẫn: dựa trên Claude Sonnet 4.7 của LangGraph (đồng tính lập trình lưu trữ trước)
- Mô hình học viên:FSS theo dõi kiến thức Bayesian (classic) hoặc sử dụng để phân cách
- Hình đồ chương trình học: bao gồm các khái niệm + cạnh tiên quyết + nội dung OER của Neo4j
- Memory:agentmemory 风格的持久 Dòng lưu trữ tập phim + ngữ nghĩa
- Voice:LiveKit Agents 1.0 + Cartesia Sonic-2 (复用 capstone 03 sub-stack)
- Hình toán:dots.ocr hoặc PaliGemma 2 được sử dụng để nhận ra phương trình
- An toàn:Llama Guard 4 + 自定义适龄 filter
- Eval:Tình độ hoa  vấn đề tạo ra                                                                                                                                                                                                                                                         


```figure
cf-tutor-loop
```

##  xây dựng nó
1. **Curriculum graph.**Xây dựng một bao gồm 50-150 nút khái niệm của Neo4j (ví dụ như đại số K-12, từ "đường số" đến "hình thức hình vuông"),并带有先决边缘──为每个节点 附加 OER content(Open Textbook、OpenStax)──

2. **Learner model.**Sử dụng tiền lệ bắt đầu theo dõi kiến thức Bayesian: đoán, trượt, học-thường.

3. **Tutor policy.**LangGraph 节点 bao gồm:`read_signal`(学习者答案是正确 / 部分正确 / 卡住?)`select_concept`(Trong suốt biểu đồ chương trình giảng dạy, chọn khái niệm ưu tiên cao nhất)`scaffold`(Socratic prompt)`update_mastery`

4. **Memory.**Mỗi lần giao tiếp đều được viết vào cửa hàng tập trung.

5. **Voice path.**将 LiveKit Agents nhân viên 接入导师 chính sách。ASR 使用 Whisper-v3-turbo。TTS 使用 Cartesia Sonic-2。支持 barge-in(复用 capstone 03 机)。

6. **Photo-math path.**上传或拍摄图片;运行 dots.ocr 或 PaliGemma 2 识别方程;以结构化输入形式传给导师──

7. **Safety.**Mỗi mô hình đầu ra đều trải qua Llama Guard 4 + 适龄 filter(阻止自伤、成人内容、暴力) ――Trong truy cập bộ nhớ 按学习者 ID 设定范围;提供家长删除入口。

8. **Efficacy study.**10 名学习者,pre-test(标准化 30 题基线),两周导师互动(每周3次会议),后测试──与 10 名学习者组成、使用相同内容的非适应基线队对比──

9. **Weekly progress reports.**Đối với mỗi học viên tự động tạo bản tóm tắt PDF, bao gồm các chủ đề đã khám phá, các quỹ đạo làm chủ và các bước tiếp theo được đề xuất.

## Sử dụng nó
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

## 交付 nó
`outputs/skill-ai-tutor.md`là một đối tượng. Một hướng dẫn viên tự thích nghi đối với một ngành học cụ thể, có mô hình nhập học đa phương thức, bộ nhớ, an toàn, và hiệu quả có thể đo lường.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Learning gain delta | 10 名学习者、两周研究中的 pre/post-test delta |
| 20 | Socratic fidelity | transcript samples 的 rubric score |
| 20 | Multimodal UX | Voice + photo + text 的端到端一致性 |
| 20 | Safety + privacy posture | Llama Guard 4 pass rate + COPPA-aware retention |
| 15 | Curriculum breadth and graph quality | Concept coverage + prerequisite graph consistency |
| **100** | | |

## 练习
1. 分別在启用和不启用适应学习者模型 (随机概念顺序) 情况运行效率研究――报告 delta――预期适应会赢,但真正有意的是幅度――

2. 添加一个多模调查:同一个概念问题 分别以文字、声音 和照片形式交付──衡量学习者是否在其偏好的模式下更快收──

3. 构建家长仪表板:练习过的主题、掌握轨迹、即将学习的概念、安全事件(任何防线撞击)

4. 添加 ngôn ngữ-switch mode:tutor 接受西班牙语 输入并使用西班牙语教学──衡量X-Guard覆盖──

5. Đối với quyền riêng tư bộ nhớ  tiến hành thử nghiệm áp lực:验证 học viên A ngay cả thông qua cuộc tấn công tái nhập bằng video thoại cũng không thể nhìn thấy dữ liệu của học viên B.

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
- [Khanmigo (Khan Academy)](https://www.khanmigo.ai) 消费级 K-12 tutor 参考
- [Duolingo Max](https://blog.duolingo.com/duolingo-max/) Giáo viên học ngôn ngữ 参考
- [Google LearnLM / Gemini for Education](https://blog.google/technology/google-deepmind/learnlm) 托管参考模型
- [Quizlet Q-Chat](https://quizlet.com) 替代参考
- [Synthesis Tutor](https://www.synthesis.com) khởi động 参考
- [FSRS algorithm](https://github.com/open-spaced-repetition/fsrs4anki) lập trình lặp lại khoảng cách
- [Bayesian Knowledge Tracing](https://en.wikipedia.org/wiki/Bayesian_knowledge_tracing) mô hình học tập cổ điển
- [LiveKit Agents](https://github.com/livekit/agents) tiếng nói
