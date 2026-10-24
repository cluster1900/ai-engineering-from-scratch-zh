# Capstone 17  Kişisel Yapay zeka öğretmeni ((自适应、多模的、带 Memory)

> Khanmigo(Khan Academy)、Duolingo Max、Google LearnLM / Gemini for Education、Quizlet Q-Chat 和 Synthesis Tutor 都在2026年规模化交付自适应多模辅导──共同形态是苏格拉底政策(绝不只是直接给出答案)、每次交互后都会更新的学习者模型(Bayesian knowledge tracing 风格)、语音 +文 +图片-math 输入、课程图图 检查索、空间-重复调度,以及适龄内容的严格安全过器──本 Capstone 需要支付给特定学科的教师的K-12 algèbre或 Python 序文),使用10名学习者运行一次为期并两周的效果研究,通过内容安全审审──

**Type:** Capstone
**Languages:** Python（backend、learner model）、TypeScript（web app）、SQL（通过 Postgres + Neo4j 构建 curriculum graph）
**Prerequisites:** Phase 5（NLP）、Phase 6（speech）、Phase 11（LLM engineering）、Phase 12（Multimodal）、Phase 14（agents）、Phase 17（infrastructure）、Phase 18（safety）
**Phases exercised:**P5 · P6 · P11 · P12 · P14 · P17 · P18
**Time:** 30 小时

## 问题
Kendi kendine eğitim eğitimi geçmişte ed-tech araştırmalardaki küçük kitle yönleri olmuştur. 2026 yılına kadar, tüketim seviyesine dönüşmüştür.

Siz belirli bir kohort için  yapılandırmak  sistemlerden biri  Ölçme standartı gerçek bir etki çalışmasıdır                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    

## 概念
Dört parça.**Tutor policy**Bu bir Sokratik döngüdür: Öğrenciler cevap istediğinde politika yönlendirme sorunu ortaya çıkarır; cevap verdiğinde bir sonraki kavrama girer; kalınca bir ipucu verir.**Learner model**Bu Bayesian bilgi izlemeyi (or a simple变体), her bir iletişimden sonra her bir eğitim dizisi düğümünün ustalık olasılığını yenilemektedir.**Curriculum graph**Yenilikçi bir kavram ve ön koşullar sınırları içerir.**Memory**Bu, bir bölümsel + semantik depo, 风格),保存过往交互、错误和偏好。

UX is Multimodal。Teks girişi için kullanılan giriş ⇒输入答案。Voice input ⇒ LiveKit + Whisper 实现(复用 capstone 03)。Foto giriş için kullanılan giriş ⇒ dots.ocr veya PaliGemma 2 处理数学题。Voice output ⇒ Cartesia Sonic-2 实现。Safety 使用 Llama Guard 4 加一个适龄过器(阻止成人内容暴力、自伤),并使用 COPPA-aware memory retention policy。

效果研究是交付物──10 名学习者,pre-test 和 post-test,为期两周──报告学习获益 delta 和信心间隔──与非适应基线对比(同内容以线性方式交付,不使用导师政策)──

## Yapılandırma
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
- 学科选择:K-12 cebir veya giriş Python(选择一个深入做)
- Öğretmen politikası: Claude Sonnet 4.7'e dayalı LangGraph(带 prompt caching)
- Öğrenci modeli:Bayesian bilgi izleme (klasik) veya uzananlık için kullanılır FSRS
- Eğitim grafikleri: Konsepler + Ön şartlar + OER içeriği
- Hatırlama:agenthatırlama 风格的持久 Vektor + bölümsel + semantik depo
- Ses:LiveKit Ajanları 1.0 + Cartesia Sonic-2(复用 capstone 03 alt toplama)
- Fotoğraf matematik: dots.ocr veya PaliGemma 2 denklem tanıma için kullanılır
- Güvenlik:Llama Guard 4 + 自定义适龄 filter
- Eval: Çiçek seviyesinde  problem生成、pre/post test harness、effekti çalışması aletleri


```figure
cf-tutor-loop
```

## Yapın onu.
1. **Curriculum graph.**50-150 个概念节点的Neo4j (örneğin K-12 cebir, "sayı çizgisi" dan "kvadratik formül"e kadar) oluşturmak,并带有前提边缘──为每个节点 附加 OER content(Open Textbook、OpenStax)──

2. **Learner model.**Önceden kullanıldığında, Bayesian bilgiyi ilk olarak takip etmektedir: tahmin, kayış, öğrenme oranı, her bir kavramın ustalıkını yenilemektedir.

3. **Tutor policy.**LangGraph 节点包括:`read_signal`(学习者答案是正确 / 部分正确 / 卡住?)`select_concept`(Kürsül grafikinde, öncelikli en yüksek kavramı seçin)`scaffold`(Sokratik uyarı)`update_mastery`- Evet.

4. **Memory.**Her zamanki iletişim bölümlü mağazaya yazılır. Hata ve tercihler semantik hafıza olarak yükseltilmektedir.

5. **Voice path.**Bu yüzden, bu programın en son başlıca amacı, bu programın en son başlıca amacı, bu programın sonuna kadar devam etmesi ve bu programın sonuna kadar devam etmesi.

6. **Photo-math path.**Ünlü Ya da fotoğraf fotoğrafı; Çekim noktaları.ocr veya PaliGemma 2  tanımlama yöntemi; yapılandırılmış giriş biçiminde öğretmenlere aktarım

7. **Safety.**Her model çıkışı Llama Guard 4 + 适龄 filter tarafından geçmiştir.

8. **Efficacy study.**10 名学習者,pre-test(standardisation 30 题 baseline),两周 tutor interaction(每周 3 次 session),post-test──与 10 名学习者组成、使用相同内容的非适应的基线队对比──

9. **Weekly progress reports.**Öğrenci için, araştırılan konular, ustalık yolları ve önerilir sonraki adımları içeren PDF özetleri otomatik olarak oluşturulur.

## Kullan
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

## - Söyle.
`outputs/skill-ai-tutor.md`Bu, öğrenci modelinin, hafızanın ve güvenin, ayrıca ölçülebilir etkilerinin yanı sıra, belirli bir disiplin için bir özelleştirme öğretmeni.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Learning gain delta | 10 名学习者、两周研究中的 pre/post-test delta |
| 20 | Socratic fidelity | transcript samples 的 rubric score |
| 20 | Multimodal UX | Voice + photo + text 的端到端一致性 |
| 20 | Safety + privacy posture | Llama Guard 4 pass rate + COPPA-aware retention |
| 15 | Curriculum breadth and graph quality | Concept coverage + prerequisite graph consistency |
| **100** | | |

## 练习
1. Bölümler: %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2

2. 添加一个多模调查:同一个概念问题 分别以文字、声音 和照片 形式交付──衡量学习者是否在其偏好的modality 下更快收──

3. 构建家长仪表板:练习过的话题、掌握轨迹、即将学习的概念、安全事件(任何防线撞击)

4. 添加语言-switch mode:tutor 接受西班牙语 输入并用西班牙语教学──衡量X-Guard kapsamını──

5. Hatırlama gizliliği  Pressure Test:验证 learner A 即使通过语音录像重复摄入攻击也无法看到学习者 B 的数据──记录访问尝试并发出警报──

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
- [Khanmigo (Khan Academy)](https://www.khanmigo.ai) 消费级 K-12 öğretmen 参考
- [Duolingo Max](https://blog.duolingo.com/duolingo-max/) Dil öğrenme öğretmeni 参考
- [Google LearnLM / Gemini for Education](https://blog.google/technology/google-deepmind/learnlm) 托管参考模型
- [Quizlet Q-Chat](https://quizlet.com) 替代参考
- [Synthesis Tutor](https://www.synthesis.com) başlatma 参考
- [FSRS algorithm](https://github.com/open-spaced-repetition/fsrs4anki) Aralıklı tekrar programı
- [Bayesian Knowledge Tracing](https://en.wikipedia.org/wiki/Bayesian_knowledge_tracing) öğrenci modeli klasik
- [LiveKit Agents](https://github.com/livekit/agents) Sesli bir yığın
