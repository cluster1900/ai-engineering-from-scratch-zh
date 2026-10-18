# Capstone 17  Personal AI Tutor(自适应、Multimodal、带 Memoria)

> Khanmigo(Khan Academy)、Duolingo Max、Google LearnLM / Gemini for Education、Quizlet Q-Chat 和 Synthesis Tutor 都在2026年规模化交付自适应多模辅导──共同形态是苏格拉底政策(绝不只是直接给出答案)、每次交互后都会更新的学习者模型(Bayesian knowledge tracing 风格)、语音 + text + photo-math 输入、课程图图 检查索、空间重复调度,以及针对适龄内容的严格安全过器──本 Capstone 需要支付给特定学科的教师(K-12 algebra或 Python intro),使用10名学习者运行一次为期两周的效果研究,通过内容安全审审.

**Type:** Capstone
**Languages:** Python（backend、learner model）、TypeScript（web app）、SQL（通过 Postgres + Neo4j 构建 curriculum graph）
**Prerequisites:** Phase 5（NLP）、Phase 6（speech）、Phase 11（LLM engineering）、Phase 12（Multimodal）、Phase 14（agents）、Phase 17（infrastructure）、Phase 18（safety）
**Phases exercised:**P5 · P6 · P11 · P12 · P14 · P17 · P18
**Time:** 30 小时

##  problemas
Hasta 2026 años, ya se ha convertido en un producto de consumo. Hanmigo  ha sido implementado en la mayoría de las áreas de estudio de los Estados Unidos. Duolingo Max  ha alcanzado miles de millones de MAU. Google LearnLM / Gemini for Education  Google Classroom  Capacidad de asesoramiento en el aula.

Usted construirá uno de ellos para una cohorte específica. El estándar de medida es un estudio de efectos reales.

## 概念
Cuatro componentes.**Tutor policy**Es un ciclo socrático: cuando los estudiantes piden una respuesta, la política plantea problemas de orientación; cuando ellos responden a ella, entra en el siguiente concepto; cuando ellos se quedan, proporciona una pista de andamio.**Learner model**Es el rastreo de conocimientos bayesianos (o una simple variación), la probabilidad de dominio de cada nodo del currículo se actualiza después de cada interacción.**Curriculum graph**Es una política que contiene conceptos y bordes previo de Neo4j; política que recorre este gráfico para seleccionar el siguiente concepto.**Memory**Es una tienda de episodios + semántica, almacenar su memoria y el error y la preferencia.

UX es multimodal。Inputo de texto utiliza para la entrada de respuesta。Inputo de voz a través de LiveKit + Whisper 实现(复用 capstone 03)。Inputo de foto utiliza para la entrada de datos a través de dots.ocr o PaliGemma 2 处理数学题──Exputo de voz 通过 Cartesia Sonic-2 实现──Safety 使用 Llama Guard 4 加一个适龄过器(阻止成人内容暴力、自伤),并使用 COPPA-awaren memory retention policy──

效果研究是交付物──10 名学习者,pre-test 和 post-test,为期两周──报告学习获益 delta 和信心间隔──与非适应基线对比(同内容以线性方式交付,不使用导师政策)──

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
- 学科选择: K-12 álgebra o intro Python(选择一个深入做)
- Política de tutor: basada en Claude Sonnet 4.7 de LangGraph (con caché rápido)
- Modelo de aprendiz:SRS de seguimiento de conocimientos bayesios (clásico) o de espaciamiento
- Gráfico del currículo: contiene conceptos + bordes prerequisitos + contenido de OER de Neo4j
- Memoria:agentememoria 风格的持久 Vector + episódico + almacenaje semántico
- Voz:LiveKit Agents 1.0 + Cartesia Sonic-2 (subestaca de piedra caliza 03)
- Foto matemática:dots.ocr o PaliGemma 2 para el reconocimiento de ecuaciones
- Seguridad:Llama Guard 4 + filtro de seguridad
- Eval:nivel de floración problem生成、pre/post test harness、herramienta de estudio de la eficacia


```figure
cf-tutor-loop
```

## Construirlo
1. **Curriculum graph.**Construir un Neo4j que contenga 50-150 个 concept nodos de Neo4j (por ejemplo, álgebra K-12, desde la "línea numérica" hasta la "formula cuadrática"),并带有前条件边缘──为每节点 附加 OER content(Open Textbook、OpenStax)──

2. **Learner model.**Utiliza prioridades Iniciasamiento del conocimiento bayesiano: adivinación, deslizamiento, tasa de aprendizaje.

3. **Tutor policy.**LangGraph 节点 incluye:`read_signal`(Learning: ¿Es verdad / ¿Se trata de una pregunta?`select_concept`(a través del gráfico del currículo, seleccionar el concepto de prioridad más alto)`scaffold`(Promulgación de Sócrates)`update_mastery`¿Qué es eso?

4. **Memory.**Cada vez que se escribe en la tienda episódica, los errores y preferencias se elevan a la memoria semántica, la política de retención consciente de la COPPA: 1 año después se elimina automáticamente, el usuario puede visitar.

5. **Voice path.**Se trata de un programa de trabajo de la compañía de servicios de transporte de vehículos de alta velocidad.

6. **Photo-math path.**上传或拍摄图片;运行 dots.ocr 或 PaliGemma 2 识别方程;以结构化输入形式传给导师──

7. **Safety.**Cada modelo de salida ha pasado por Llama Guard 4 + 适龄 filter(阻止自伤、成人内容、暴力) ――Acceso a la memoria 按学习者 ID 设定范围;提供家长删除入口。

8. **Efficacy study.**10 名学习者, pre-test(standardisation 30 题 baseline), dos semanas de interacción con los tutores(cada semana 3 次 session), post-test──与 10 名学习者组成、使用相同内容的非适应的基线队对比──

9. **Weekly progress reports.**Para cada estudiante generar automáticamente un resumen PDF, que incluye temas explorados, trayectorias de dominio y recomendaciones de los próximos pasos.

## Usalo
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

##  entregarlo
`outputs/skill-ai-tutor.md`Es un tutor de adaptación a una disciplina específica, con un modelo de entrada multimodal, memoria, seguridad y efectos medibles.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Learning gain delta | 10 名学习者、两周研究中的 pre/post-test delta |
| 20 | Socratic fidelity | transcript samples 的 rubric score |
| 20 | Multimodal UX | Voice + photo + text 的端到端一致性 |
| 20 | Safety + privacy posture | Llama Guard 4 pass rate + COPPA-aware retention |
| 15 | Curriculum breadth and graph quality | Concept coverage + prerequisite graph consistency |
| **100** | | |

##  ejercicios
1. Se puede utilizar el modelo de aprendizaje adaptativo en el caso de que el modelo de aprendizaje adaptativo sea activado y no activado.

2. Añadir una sonda multimodal: con la misma pregunta conceptual, dividida en texto, voz y foto, forma de entrega.

3. Construir un panel de control: temas practicados, trayectorias de dominio, conceptos de aprendizaje, eventos de seguridad, cualquier paso de baranda.

4. 添加 lenguaje-configurar modo:tutor 接受 español 输入并用西班牙语教学──衡量X-Guard cobertura──

5. En el caso de la privacidad de la memoria, el usuario puede utilizar la información de la memoria de su usuario.

## 关键术语: "El hombre es un hombre"
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
- [Duolingo Max](https://blog.duolingo.com/duolingo-max/) tutor de aprendizaje de idiomas 参考
- [Google LearnLM / Gemini for Education](https://blog.google/technology/google-deepmind/learnlm) 托管参考模型
- [Quizlet Q-Chat](https://quizlet.com) 替代参考
- [Synthesis Tutor](https://www.synthesis.com) inicio 参考
- [FSRS algorithm](https://github.com/open-spaced-repetition/fsrs4anki) Programación de repeticiones espaciadas
- [Bayesian Knowledge Tracing](https://en.wikipedia.org/wiki/Bayesian_knowledge_tracing) modelo de aprendizaje clásico
- [LiveKit Agents](https://github.com/livekit/agents) la pila de voz
