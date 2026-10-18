# Capstone 17  Personal AI Tutor ((自适应、Multimodal、带 Memory)

> Khanmigo(Khan Academy)、Duolingo Max、Google LearnLM / Gemini for Education、Quizlet Q-Chat 和 Synthesis Tutor 都在2026年规模化交付自适应多模辅导──共同形态是苏格拉底政策(绝不只是直接给出答案)、每次交互后都会更新的学习者模型(Bayesian knowledge tracing 风格)、语音 + text + photo-math 输入、课程图 检查索、空间-repetition 调度,以及针对适龄内容的严格安全过器──本 Capstone 需要支付给特定学科的教师的K-12 algebra或 Python intro),使用10名学习者运运一次为期两周的效果研究,通过内容安全审审.

**Type:** Capstone
**Languages:** Python（backend、learner model）、TypeScript（web app）、SQL（通过 Postgres + Neo4j 构建 curriculum graph）
**Prerequisites:** Phase 5（NLP）、Phase 6（speech）、Phase 11（LLM engineering）、Phase 12（Multimodal）、Phase 14（agents）、Phase 17（infrastructure）、Phase 18（safety）
**Phases exercised:**P5 · P6 · P11 · P12 · P14 · P17 · P18
**Time:** 30 小时

## 问题
O "Duolingo Max" alcançou milhares de milhões de MAU, e o "LearnLM/Gemini for Education" do Google é o primeiro e mais recente modelo de aprendizagem para cada interação, bem como uma segurança de idade rigorosa.

Você vai construir um sistema para uma coorte específica. A medida é uma pesquisa de resultados real. 10 anos de estudo em dois dias de pré-teste e pós-teste.

## 概念
Quatro componentes.**Tutor policy**É um ciclo socrático: quando os alunos pedem respostas, a política irá apresentar questões de orientação; quando eles responderem a eles, entrará no próximo conceito; quando eles ficarem, fornecerá sugestões em andares.**Learner model**É o rastreamento de conhecimento bayesiano (ou um simples variação), na probabilidade de domínio de cada nó do currículo, após cada interacção.**Curriculum graph**É um conceito que contém as margens pré-requisitas de Neo4j;política 穿越该图 来选择下一个概念──**Memory**É uma loja episódica + semântica, preservar passados e preferidos.

UX é multimodal。Inputo de texto utilizado para fazer o seu próprio trabalho.──Inputo de voz                                                                                                                                                                                                                                                  

效果研究是交付物物──10 名学习者,pre-test 和 post-test,为期两周──报告学习获利 delta 和信心间隔──与非适应基线对比(同内容以线性方式交付,不使用导师政策)──

## Arquitetura
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
- 学科选择:K-12 algebra ou intro Python(选择一个深入做)
- Política de tutor: baseado em Claude Sonnet 4.7 de LangGraph (com cache rápido)
- Modelo de aprendiz:SRS de rastreamento de conhecimentos baieses (clásico) ou de espaçamento
- Grafico do currículo: contém conceitos + bordas pré-requisitas + conteúdo do OER de Neo4j
- Memória:agente memória 风格的持久 Vector + episódico + armazenamento semântico
- Voz:Agentes LiveKit 1.0 + Cartesia Sonic-2 (sub-pilha 03 de pedra-capa)
- Foto matemática:dots.ocr ou PaliGemma 2 Usado para reconhecimento de equações
- Segurança:Llama Guard 4 + 自定义适龄 filter
- Eval:nivel de flores problem生成、pre/post test harness、outil de estudo da eficácia


```figure
cf-tutor-loop
```

## Construí-lo
1. **Curriculum graph.**Construir um que contenha 50-150 nós conceitual de Neo4j (por exemplo, álgebra K-12, de "linha de números" a "formula quadrática"),并带有先决条件边缘──为每个节点 附加 OER content(Open Textbook、OpenStax)──

2. **Learner model.**Utilize priorities inicialmente tracing knowledge Bayesian:guess、slip、learn-rate──per dia de conversação, depois de actualizar cada conceito, masterização, per learners, perpetuation──

3. **Tutor policy.**LangGraph 节点incluem:`read_signal`(Learninger Antwort ist richtig / 部分正确 / 卡住?)`select_concept`(Próximo ao gráfico do currículo, escolha o conceito de prioridade mais alto)`scaffold`(Promulgação socrática)`update_mastery`- Não.

4. **Memory.**Cada vez que a comunicação é escrita, a memória é aumentada para a memória semântica.

5. **Voice path.**O que é que é o "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support" do "Support"

6. **Photo-math path.**上传或拍摄图片;运行 dots.ocr 或 PaliGemma 2 识别方程;以结构化输入形式传给导师──

7. **Safety.**Cada modelo de saída passou por Llama Guard 4 + 适龄 filter(阻止自伤、成人内容、暴力) ・・・ Acesso à memória 按学习者 ID 设定范围;提供家长删除入口。

8. **Efficacy study.**10 名学習者,pre-test(standardisation 30 題基線),两周 tutor interaction(每周 3 次 session),post-test──与 10 名学習者组成、使用相同内容的非适应基線队对比──

9. **Weekly progress reports.**Para cada aprendiz gerar automaticamente um resumo PDF, contendo os tópicos explorados, as trajetórias de mestria e as próximas etapas sugeridas.

## Use-o
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

## Entrega-o
`outputs/skill-ai-tutor.md`É um material de entrega. Um tutor de adaptação em uma determinada área de ensino, com um modelo multimodal de entrada, aprendizagem, memória, segurança e efeitos mensuráveis.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Learning gain delta | 10 名学习者、两周研究中的 pre/post-test delta |
| 20 | Socratic fidelity | transcript samples 的 rubric score |
| 20 | Multimodal UX | Voice + photo + text 的端到端一致性 |
| 20 | Safety + privacy posture | Llama Guard 4 pass rate + COPPA-aware retention |
| 15 | Curriculum breadth and graph quality | Concept coverage + prerequisite graph consistency |
| **100** | | |

## 练习
1. O estudo de eficácia foi executado em uma situação de "modelo de aprendizagem adaptativo" (adaptive learning model) e "non-enabled" (adaptive learning model).

2. Adicionar uma sonda multimodal: com a mesma questão conceitual, separada em texto, voz e foto, forma de entrega.

3. Construir painel de controle: temas praticados, trajetórias de domínio, conceitos de aprendizagem, eventos de segurança, quaisquer acidentes de guarda-roupa.

4. 添加语言-switch mode:tutor 接受西班牙语 输入并用西班牙语教学──衡量X-Guard cobertura──

5. Para privacidade de memória  fazer pressão test:验证 learner A 即使通过语音录像重摄攻击也无法看到学习者B的数据──记录访问尝试并发出警报──

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
- [Duolingo Max](https://blog.duolingo.com/duolingo-max/) tutor de aprendizagem de línguas 参考
- [Google LearnLM / Gemini for Education](https://blog.google/technology/google-deepmind/learnlm) 托管参考模型
- [Quizlet Q-Chat](https://quizlet.com) 替代参考
- [Synthesis Tutor](https://www.synthesis.com) inicialização 参考
- [FSRS algorithm](https://github.com/open-spaced-repetition/fsrs4anki) Programação de repetições espaçadas
- [Bayesian Knowledge Tracing](https://en.wikipedia.org/wiki/Bayesian_knowledge_tracing) modelo de aprendiz clássico
- [LiveKit Agents](https://github.com/livekit/agents) Estaca de voz
