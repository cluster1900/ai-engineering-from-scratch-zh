# Capstone 17  Tutor d'IA personnel ((自适应、Multimodal、带 Memory)

> Khanmigo(Khan Academy)、Duolingo Max、Google LearnLM / Gemini for Education、Quizlet Q-Chat 和 Synthesis Tutor 都在2026年规模化交付自适应多模辅导──共同形态是苏格拉底政策(绝不只是直接给出答案)、每次交互后都会更新的学习者模型(Bayesian knowledge tracing 风格)、语音+文字+图片-mathematics 输入、课程图 检查索、空间-repetition 调度,以及针对适龄内容的严格安全过器──本 Capstone 需要支付给特定学科的教师面对K-12 algebra或 Python),使用10名学习者运行一次为期两周的效果研究,通过内容安全审核──

**Type:** Capstone
**Languages:** Python（backend、learner model）、TypeScript（web app）、SQL（通过 Postgres + Neo4j 构建 curriculum graph）
**Prerequisites:** Phase 5（NLP）、Phase 6（speech）、Phase 11（LLM engineering）、Phase 12（Multimodal）、Phase 14（agents）、Phase 17（infrastructure）、Phase 18（safety）
**Phases exercised:**P5 · P6 · P11 · P12 · P14 · P17 · P18
**Time:** 30 小时

##  problématique
Le concept de "Duolingo Max" a atteint des milliers de millions de MAU. Le "LearningLM/Gemini for Education" de Google est une capacité de formation dans la salle de classe. Le quiz Q-Chat et les cartes flash sont utilisés. Le tutor de synthèse est un tuteur pour les enfants curieux.

Vous allez construire un système pour une cohorte spécifique. Mesurer les normes est une étude de résultats réelle.

## 概念
Quatre composants.**Tutor policy**C'est une boucle socratique: lorsque les apprenants demandent une réponse, la politique soulève des questions de guidage; quand ils répondent à la question, elle entre dans le concept suivant; quand ils sont attachés, elle fournit des indices échafaudables.**Learner model**est le suivi des connaissances bayésiennes (ou un simple variateur), la probabilité de maîtrise de chaque nœud de programme de cours est mise à jour après chaque interaction.**Curriculum graph**est un concept contenant des concepts avec des limites prédéfinies de la politique  travers ce graphique  choisir le concept suivant**Memory**C'est un magasin épisodique + sémantique, conservé par l'agent.

UX est multimodal。L'entrée de texte est utilisée pour la saisie de réponses。L'entrée de voix ️ via LiveKit + Whisper 实现(复用 capstone 03)。L'entrée de photo est utilisée pour la saisie de points.ocr ou PaliGemma 2 处理数学题。L'entrée de voix 通过 Cartesia Sonic-2 实现。Safety 使用 Llama Guard 4 加一个适龄过️阻止成人内容暴力、自伤),并使用 COPPA-awareness memory retention policy。

效果研究是交付物──10 名学习者,pre-test 和 post-test,为期两周──报告学习获利 delta 和信心间隔──与非适应基线对比(同内容以线性方式交付,不使用导师政策)──

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
- 学科选择:K-12 algèbre ou intro Python(选择一个深入做)
- Politique de tutorat: basée sur Claude Sonnet 4.7 de LangGraph (avec mise en cache rapide)
- Modèle apprenant:RES de suivi des connaissances bayésiennes (classique) ou utilisés pour l'espacement
- Graphique du programme: contenant des concepts + des bornes prérequis + contenu des RER
- Mémoire:agent mémoire 风格的持久 Vecteur + épisodique + magasin sémantique
- Voix:LiveKit Agents 1.0 + Cartesia Sonic-2
- Photo math:dots.ocr ou PaliGemma 2 utilisé pour la reconnaissance des équations
- Sécurité:Llama Guard 4 + filtre de sécurité
- Eval:niveaux de fleurs  problèmes de production  avant/après test de l'utilisation de l'outillage d'étude de l'efficacité


```figure
cf-tutor-loop
```

## - Je le construis.
1. **Curriculum graph.**构建一个包含50-150 个概念节点的Neo4j(例如K-12代数,从"数线"到"方形公式"),并带有先决边缘──为每个节点 附加OER内容(Open Textbook、OpenStax)──

2. **Learner model.**Utilisation des connaissances bayésiennes: deviner, glisser, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, apprendre, et faire, apprendre,

3. **Tutor policy.**LangGraph 节点 comprennent:`read_signal`(Leurner's answer is correct / 部分正确 / 卡住?)`select_concept`(à travers le graphique du programme, sélectionnez le concept le plus élevé)`scaffold`(Précédent socratique)`update_mastery`Il y a une autre.

4. **Memory.**Chaque interaction est enregistrée dans le magasin épisodique.

5. **Voice path.**Pour les agents de LiveKit, il est nécessaire de mettre en place une politique de tutorat.

6. **Photo-math path.**上传或拍摄图片;运行 dots.ocr 或 PaliGemma 2 识别方程;以结构化输入形式传给导师──

7. **Safety.**Chaque sortie de modèle a été réalisée par Llama Guard 4 + 适龄 filter(阻止自伤、成人内容、暴力) ――Accès à la mémoire 根据学习者 ID 设定范围;提供家长删除入口。

8. **Efficacy study.**10 名学习者, pré-test(standardisation 30 题基线),两周导师互动(每周3次会议),后测试──与 10 名学习者组成、使用相同内容的非适应基线队对比──

9. **Weekly progress reports.**Pour chaque apprenant, générez automatiquement un résumé PDF, contenant des sujets explorés, des trajectoires de maîtrise et des prochaines étapes recommandées.

## Utilisez-le
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

## Je le livre.
`outputs/skill-ai-tutor.md`Il est un enseignant qui s'adapte à un domaine spécifique, possède un modèle multimodal d'entrée, de sécurité et de mémoire.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Learning gain delta | 10 名学习者、两周研究中的 pre/post-test delta |
| 20 | Socratic fidelity | transcript samples 的 rubric score |
| 20 | Multimodal UX | Voice + photo + text 的端到端一致性 |
| 20 | Safety + privacy posture | Llama Guard 4 pass rate + COPPA-aware retention |
| 15 | Curriculum breadth and graph quality | Concept coverage + prerequisite graph consistency |
| **100** | | |

## 练习
1. Les résultats de l'étude d'efficacité sont présentés dans le cadre de l'étude d'efficacité dans le cadre du modèle adaptatif des apprenants activés et non activés, mais le véritable intérêt est la portée.

2. 添加一个多模探:同一个概念问题 分别以文字、声音 和照片形式交付──衡量学习者是否在其偏好的模式下更快收──

3. Construire le tableau de bord parent: exercices de thèmes, trajectoires de maîtrise, concepts de formation, événements de sécurité, tout accès à la garde-robe.

4. 添加语言-switch mode:tutor 接受西班牙语 输入并用西班牙语教学──衡量X-Guard couverture──

5. Pour la confidentialité de la mémoire  effectuer un test de pression: tester apprenant A même par re-ingestion d'attaque de vidéo vocale, il ne peut pas non plus voir les données de l'apprenant B.

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
- [Khanmigo (Khan Academy)](https://www.khanmigo.ai) 消费级 K-12 tuteur 参考
- [Duolingo Max](https://blog.duolingo.com/duolingo-max/) tutorat d'apprentissage des langues 参考
- [Google LearnLM / Gemini for Education](https://blog.google/technology/google-deepmind/learnlm) 托管参考模型
- [Quizlet Q-Chat](https://quizlet.com) 替代参考
- [Synthesis Tutor](https://www.synthesis.com) démarrage 参考
- [FSRS algorithm](https://github.com/open-spaced-repetition/fsrs4anki) programmeur de répétition à distance
- [Bayesian Knowledge Tracing](https://en.wikipedia.org/wiki/Bayesian_knowledge_tracing) modèle classique des apprenants
- [LiveKit Agents](https://github.com/livekit/agents) épilation de voix
