# Chatbots  desde Reglas Basadas hasta Neural Reactions hasta LLM Agentes

> ELIZA Utiliza patrones de coincidencias 回复──DialogFlow 映射意向──GPT 从重量 中作答──Claude 运行工具 并进行验证──每个时代都解决了上一代最严重失败──

**类型：**El aprendizaje
**语言：**Python
**先修要求：**Fase 5 · 13 (respuesta a preguntas), Fase 5 · 14 (recuperación de información)
**时间：**75 minutos

##  problemas

El usuario dice: Quiero cambiar mi vuelo. 系统 must figure out what the user wants 、 la falta de cualesquiera informaciones 、 cómo obtener esta información, así como cómo completar esta operación.

Para el sistema de gestión de datos, el diálogo es difícil. La entrada es abierta. La salida debe mantenerse conectada en varias ocasiones. El sistema puede necesitar una operación de ejecución en el mundo real.

La arquitectura chatbot ha experimentado cuatro ciclos de paradigmas, cada uno de los cuales se introdujo sólo porque el fracaso de la anterior era demasiado evidente.

## 概念

![Chatbot evolution: rule-based → retrieval → neural → agent](../assets/chatbot.svg)

**Rule-based（ELIZA、AIML、DialogFlow）。**Los modelos de escritura de mano de obra 匹配用户输入并生成回复──Intent classifiers将请求路由到预定义流程──Slot-filling state machines 收集必需信息──En el estrecho rango que fue diseñado, el rendimiento fue excelente──once beyond the range就立刻失败── sigue siendo en el área clave de seguridad ([[banque de identificación]], 航空预订) 上线, porque estos escenarios no pueden tolerar alucinaciones──

**Retrieval-based。**FAQ 风格的系统──Encode 每一组(utterance, response)──运行时,encode 用户消息并检索 最接近的已存回复──可以把它理解为Zendesk 经典的类似文章功能──比规则更能处理抛词──没有生成,因此没有幻觉──

**Neural（seq2seq）。**En el diálogo de la jornada de entrenamiento del codificador-decodificador. Desde el zero comienza a generar repetitivos.

**LLM agents。**Un modelo de lenguaje está envasado en un ciclo, utilizado para planificar, utilizar herramientas, y probar resultados. No es un chatbot de chatbot de largo plazo. Es un bucle de agente:plan → herramienta de llamada → observar el resultado → decidir el siguiente paso.

Este tipo de paradigma no es una sustitución de orden. Un chatbot de producción de 2026 pasará por cuatro rutas: basado en reglas, utilizado para la verificación de identidad y acciones destructivas, recuperación, utilizado para las preguntas frecuentes, generación neuronal, utilizado para la expresión natural, agente LLM, utilizado para la búsqueda abierta de la confusión.


```figure
chatbot-lineage
```

## Construirlo

### 步骤 1: ajuste de patrones basado en reglas

```python
import re


class RulePattern:
    def __init__(self, pattern, response_template):
        self.regex = re.compile(pattern, re.IGNORECASE)
        self.template = response_template


PATTERNS = [
    RulePattern(r"my name is (\w+)", "Nice to meet you, {0}."),
    RulePattern(r"i (need|want) (.+)", "Why do you {0} {1}?"),
    RulePattern(r"i feel (.+)", "Why do you feel {0}?"),
    RulePattern(r"(.*)", "Tell me more about that."),
]


def rule_based_respond(user_input):
    for pattern in PATTERNS:
        m = pattern.regex.match(user_input.strip())
        if m:
            return pattern.template.format(*m.groups())
    return "I don't understand."
```

20 行实现 ELIZA──这个反思 技巧(我感到悲 → 为什么你感到悲) es la demo de Weizenbaum 1966 de clásico terapeuta psicológico──hasta hoy sigue teniendo un gran valor de enseñanza──

### 步骤 2: basado en la recuperación

Este ejemplo es necesario.`pip install sentence-transformers`(It will draw torch) ∼ 本课可运行 ∼`code/main.py`改用 stdlib Jaccard similaridad, por lo tanto el curso no necesita una dependencia externa.

```python
from sentence_transformers import SentenceTransformer
import numpy as np


FAQ = [
    ("how do i reset my password", "Go to Settings > Security > Reset Password."),
    ("how do i cancel my order", "Go to Orders, find the order, click Cancel."),
    ("what is your return policy", "30-day returns on unused items, original packaging."),
]


encoder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
faq_questions = [q for q, _ in FAQ]
faq_embeddings = encoder.encode(faq_questions, normalize_embeddings=True)


def faq_respond(user_input, threshold=0.5):
    q_emb = encoder.encode([user_input], normalize_embeddings=True)[0]
    sims = faq_embeddings @ q_emb
    best = int(np.argmax(sims))
    if sims[best] < threshold:
        return None
    return FAQ[best][1]
```

 Rechazar basado en el umbral es un importante diseño.  Si el mejor ajuste no es suficiente, regrese.`None`, hacer que el sistema sea mejorado.

### 步骤 3: generación neural (baseline)

Utiliza un pequeño codificador-decodificador afinado de instrucciones (FLAN-T5) o un modelo de conversación afinado. Hasta 2026 años, solo se utiliza para producir todavía no se puede usar, pero se utilizará como parte de sistemas híbridos para la expresión natural.

```python
from transformers import pipeline

chatbot = pipeline("text2text-generation", model="google/flan-t5-small")

response = chatbot("Respond politely to: Hi there!", max_new_tokens=40)
print(response[0]["generated_text"])
```

### Paso 4: Bucle de agente LLM

Formación de producción del año 2026:

```python
def agent_loop(user_message, tools, llm, max_steps=5):
    history = [{"role": "user", "content": user_message}]
    for _ in range(max_steps):
        response = llm(history, tools=tools)
        tool_call = response.get("tool_call")
        if tool_call:
            tool_name = tool_call.get("name")
            args = tool_call.get("arguments")
            if not isinstance(tool_name, str) or tool_name not in tools:
                history.append({"role": "assistant", "tool_call": tool_call})
                history.append({"role": "tool", "name": str(tool_name), "content": f"error: unknown tool {tool_name!r}"})
                continue
            if not isinstance(args, dict):
                history.append({"role": "assistant", "tool_call": tool_call})
                history.append({"role": "tool", "name": tool_name, "content": f"error: arguments must be a dict, got {type(args).__name__}"})
                continue
            fn = tools[tool_name]
            result = fn(**args)
            history.append({"role": "assistant", "tool_call": tool_call})
            history.append({"role": "tool", "name": tool_name, "content": result})
        else:
            return response["content"]
    return "I could not complete the task in the step budget."
```

需要明确三件事──Tools is LLM puede ser utilizado para funciones llamables── Cuando LLM 返回最终答案而不是 llamada de herramienta 时,循环终止──Step budget 防止在模糊任务上出现无限循环──

El sistema de producción real también se incluirá: recuperación-primera tierración(en cada llamada de LLM 之前注入相关文档) 防护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护

### 步骤 5: enrutamiento híbrido

```python
def hybrid_chat(user_input):
    if is_destructive_action(user_input):
        return structured_flow(user_input)

    faq_answer = faq_respond(user_input, threshold=0.6)
    if faq_answer:
        return faq_answer

    return agent_loop(user_input, tools, llm)


def is_destructive_action(text):
    danger_words = ["delete", "cancel", "charge", "refund", "transfer"]
    return any(w in text.lower() for w in danger_words)
```

模式是: para cualquier contenido destructivo  utilizar reglas deterministas, para las preguntas frecuentes fijas  utilizar la recuperación, el resto todo entregado a los agentes LLM ⋅ esto es la práctica de los sistemas de apoyo al cliente de 2026 ⋅

## Usalo

Tecnología de 2026:

| Use case | Architecture |
|---------|---------------|
| 预订、支付、身份验证 | Rule-based state machines + slot filling |
| 客户支持 FAQs | 对 curated answers 做 Retrieval |
| 开放式帮助聊天 | 带 RAG + tool calls 的 LLM agent |
| 内部工具 / IDE assistants | 带 tool calls 的 LLM agent（search, read, write） |
| Companion / character chatbots | 带 persona system prompt 的 tuned LLM，并对知识做 retrieval |

生产中始终使用混合路由──没有单一架构能很好处理所有请求──路由层 本身通常是一个小型意向分类器──

##  todavía se encuentra en línea de modos de falla

- **自信的编造。**El agente de LLM  afirma haber completado operaciones prácticamente no completadas ∙ medidas de alivio: resultados de verificación, registros de llamadas de herramientas, absolutamente no permite que el LLM en caso de no tener un resultado de la herramienta de retorno exitoso, afirme haber realizado algo ∙
- **Prompt injection。**Useruse插入覆盖系统 prompt 的文本──在 OWASP Top 10 para LLM Aplicaciones 2025 中排名 LLM01──两种形式: inyección directa(直接粘贴到聊天中) y inyección indirecta(藏在代理 读取的文档、邮件或工具输出中)──

   ataque de éxito en función de la situación. En el uso general de herramientas y de los puntos de referencia de codificación, los modelos fronterizos, la tasa de éxito obtenida es de aproximadamente 0.5-8.5%  configuración de alto riesgo específica  Ataques adaptativos de agentes de codificación de IA  Orquestación vulnerable) han alcanzado aproximadamente 84%  Producción de CVEs incluyendo EchoLeak  CVE-2025-32711, CVSS 9.3)  Microsoft 365 Copilot  Error de filtración de datos de cero-clics provocado por el correo electrónico controlado por el atacante 

  缓解措施: durante todo el ciclo todo el usuario entrará como increíble; antes de las llamadas a la herramienta se realizará la desinfección; se separarán las salidas de la herramienta con el principal prompt; se utilizará el modelo Plan-Verify-Execute (PVE), se hará un plan de planificación por adelantado, y luego se ejecutará el proceso de verificación de cada movimiento según el plan. Esto impedirá que los resultados de la herramienta entren en nuevos movimientos no planificados.

  También no se puede eliminar completamente este riesgo. Se deben utilizar capas de defensa de tiempo de ejecución externas.
- **Scope creep。**El agente de una llamada de herramienta  devolvió información relacionada con el borde y desviación de la tarea  medidas de alivio: estrechar los contratos de herramientas  mantener el sistema en orden  enfocarse  participar en evaluaciones de la tasa de fuera de la tarea 
- **无限循环。**El agente continuó调用同一个工具──缓解措施:step budget──工具调用减倍──关于我们正在取得进展的LLM评审──
- **Context window exhaustion。**长对话会把最早的轮次挤出上下文──缓解措施: resumir los turnos más antiguos, recuperar en función de las similitudes 相关历史轮次, o utilizar un modelo de largo contexto──

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-chatbot-architect.md`¿Qué es esto ?

```markdown
---
name: chatbot-architect
description: 为给定 use case 设计 chatbot stack。
version: 1.0.0
phase: 5
lesson: 17
tags: [nlp, agents, chatbot]
---

给定一个产品上下文（用户需求、合规约束、可用 tools、数据规模），输出：

1. Architecture。Rule-based、retrieval、neural、LLM agent 或 hybrid（说明哪些路径走哪里）。
2. LLM choice（如适用）。命名 model family（Claude、GPT-4、Llama-3.1、Mixtral）。匹配 tool-use quality 和成本。
3. Grounding strategy。RAG sources、retrieval method（见 lesson 14）、tool contracts。
4. Evaluation plan。Task success rate、tool-call correctness、off-task rate、held-out dialogs 上的 hallucination rate。

对于任何 destructive action（payments、account deletion、data modification），如果没有 structured confirmation flow，拒绝推荐 pure-LLM agent。如果 agent 对任何内容拥有 write access，拒绝跳过 prompt-injection audit。
```

##  ejercicios

1. **Easy。**Utilice 10 patrones para el bot de pedido de la cafetería                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
2. **Medium。**Construir una FAQ híbrida + LLM fallback── para un producto SaaS  preparar 50 条 entradas de FAQ enlatadas, LLM fallback Utiliza el sitio de documentos  上的检索── en 100 个真实支持问题 上测量拒绝率 和准确性──
3. **Hard。**Utilice tres herramientas (search,read,user,data,send-email) para implementar el ciclo de agentes de arriba. Utilice 50 evaluaciones de casos de prueba de inyección rápida.

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Intent | 用户想要什么 | Categorical label（book_flight, reset_password）。路由到 handler。 |
| Slot | 一条信息 | Bot 需要的 parameter（date, destination）。Slot filling 是一系列询问。 |
| RAG | Retrieval 加 generation | Retrieve 相关文档，然后 ground LLM 的 response。 |
| Tool call | Function invocation | LLM 发出带有 name + args 的 structured call。Runtime 执行并返回结果。 |
| Agent loop | Plan、act、verify | 交替运行 LLM calls 和 tool calls 的 controller，直到任务完成。 |
| Prompt injection | 用户攻击 prompt | 试图覆盖 system prompt 的恶意输入。 |

## 延伸阅读

- [Weizenbaum (1966). ELIZA — A Computer Program For the Study of Natural Language Communication](https://web.stanford.edu/class/cs124/p36-weizenabaum.pdf) Originario de las reglas basadas en chatbot 论文。
- [Thoppilan et al. (2022). LaMDA: Language Models for Dialog Applications](https://arxiv.org/abs/2201.08239) Google 较晚期的神经聊天机论文, 正好在 LLM agentes 接管之前──
- [Yao et al. (2022). ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)  命名 agent loop pattern 的论文──
- [Anthropic's guide on building effective agents](https://www.anthropic.com/research/building-effective-agents) Directrices de producción de 2024 años, hasta 2026 años todavía vigentes¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- [Greshake et al. (2023). Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection](https://arxiv.org/abs/2302.12173) Inyección rápida 论文。
- [OWASP Top 10 for LLM Applications 2025 — LLM01 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) 让快速注射 成为首要安全关注点的排名──
- [AWS — Securing Amazon Bedrock Agents against Indirect Prompt Injections](https://aws.amazon.com/blogs/machine-learning/securing-amazon-bedrock-agents-a-guide-to-safeguarding-against-indirect-prompt-injections/)  Defesas de la capa de orquestación prácticas, incluidos los flujos de Plan-Verificar-Ejecutar y confirmación del usuario。
- [EchoLeak (CVE-2025-32711)](https://www.vectra.ai/topics/prompt-injection) inyección directa directa  conducir a la exfiltración de datos con cero clics  CVE típico .
