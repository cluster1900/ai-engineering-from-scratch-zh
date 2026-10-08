# Agentes de navegador y tareas web

> Agente ChatGPT(Jul de 2025) combinará Operador y investigación profunda 合并为一个浏览器/终端代理, y se lanzó en BrowseComp 上以 68.9% 创下 SOTA。OpenAI 于2025 年 8 月 31 日关闭 Operador这是产品层整合──人类收购 收购 后, Claude Sonnet en OSWorld su rendimiento en menos del 15% 升级至72.5% Web ・Arena-verified(ServiceNow,ICLR 2026) corregiría la tasa de falsos puntos de ciento negativo de 11.3 en la WebArena original, publicó un subconjunto de 258-task Hard ⋅ estos números son reales。 Los ataques también son reales: la preparación de OpenAI  responsable de la publicidad declaró que la acción dirigida a los agentes de navegador  puede ser ejecutada por una inyección completa de bug                                                                                                                                                       

**Type:** Learn
**Languages:** Python (stdlib, indirect prompt-injection attack surface model)
**先修要求：**Fase 15 · 10 (Modos de autorización), Fase 15 · 01 (agentes de largo horizonte)
**Time:** ~45 minutes

##  problemas

El agente de navegador es un agente de horizonte largo: lee contenido no creído y realiza operaciones con consecuencias. Cada página que visita el agente, es una entrada sin redacción de usuario. Cada uno de los formularios de cada página, es un posible camino de orden. El lenguaje de ataque de 2025-2026 muestra que esto no es una hipótesis: Memorias contaminadas.

La preparación de OpenAI no es cómoda. El responsable de la investigación ha revelado que la inyección indirecta de un prompt no es un error que pueda ser completamente reparado. La causa es que el ataque ocurre en el límite de lectura y acción del agente, y este límite en la estructura es un símbolo de modalidad borrosa.

Este curso se denominó en el marco de la serie de estudios de la Universidad de California en Los Ángeles, en los que se desarrolló un programa de investigación de la Universidad de California en los Estados Unidos.

## 概念

### 2026 年版图: cada sistema un pasaje

**ChatGPT agent (OpenAI).**El año 2025 se publicó en julio de 2025[6].

**Claude Sonnet + Vercept (Anthropic).**Antropic  compra Vercept, enfoque en las capacidades de uso de computadoras ︎ Claude Sonnet en OSWorld                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  

**Gemini 3 Pro with Browser Use (DeepMind).**La integración de uso del navegador  publicar controles de uso de computadoras;FSF v3(2026 年 4 月,Lesson 20) especializada en el seguimiento de la autonomía en el campo de la I+D de ML ⋅

**WebArena-Verified (ServiceNow, ICLR 2026).**修复一个有充分记录的问题:原始 WebArena 约有11.3%的错误负率(tasks were tagged as fail, but actually have been solved) ――condicionado con el uso de la clasificación artificial para el éxito de los estándares de reevaluación,并加入了258-task Hard subset(ICLR 2026 paper,openreview.net/forum?id=94tlGxmqkN) ――

### BrowseComp vs OSWorld vs WebArena

| Benchmark | 衡量什么 | Horizon |
|---|---|---|
| BrowseComp | 在时间压力下，在开放 Web 上查找特定事实 | 分钟级 |
| OSWorld | Agent 操作完整 desktop（mouse、keyboard、shell） | 数十分钟 |
| WebArena-Verified | 模拟网站中的事务型 Web 任务 | 分钟级 |
| Hard subset | 带有多页面状态转换的 WebArena-Verified 任务 | 数十分钟 |

轴线不同──高BrowseComp 分数说明代理 能找到事实; it does not explain agent 能预订航班──OSWorld 分数更接近它不能在我的桌面上工作──WebArena-Verified 更接近它不能完成流程──任何生产决策都需要选择与任务分布匹配的基准──

### 攻击面,命名如下

1. **Indirect prompt injection.**En el artículo de la revista "Memorias contaminadas" se publica el artículo "Memorias contaminadas" del año 2026.
2. **URL fragment / query injection.**Se ha capturado la URL de`#fragment`O una cadena de consultas 包含命令── ellas nunca fueron vistas 染染; pero todavía están en el contexto del agente──
3. **Memory-binding attacks.**页面指示代理 写入一条持续记忆(Leyón 12 涵盖持续状态) ―― en la próxima sesión, esta memoria en caso de no tener un触发器触发的有效载──
4. **Authenticated sessions 上的 CSRF-shaped attacks.**Memorias contaminadas 类:agente 已登录某处; página del atacante发发状态变更请求,agente utiliza cookies del usuario 执行这些请求。
5. **One-click hijack.**Un agente de carga de carga en la imagen inofensivo seguirá la carga útil.
6. **Agent host surface 中的 Content-Security-Policy holes.**Renderización y capas de herramientas 本身也可能成为攻击矢量;browser-in-a-browser-agent stack 很宽──

### ¿Por qué no se puede reparar por completo?

Este tipo de ataque y la capacidad del agente. El agente debe leer contenido sin confianza para completar el trabajo. Cualquier contenido que el agente lee puede contener instrucciones. Cualquier instrucción que el agente siga puede no coincidir con la verdadera solicitud del usuario. Defensa.

Esto es similar al teorema de Lob. La lección 8 es la misma: agente no puede probar que un token es seguro; sólo puede construir un sistema, hacer que el token no sea seguro, más fácilmente puede ser probado.

### El verdadero poder de la línea de defensa

- **Read / write boundary.**读取永远不产生后果──写入(提交表单、发布内容、调用有副作用的工具) Si el contenido se inicia por el límite de confianza, el Ministerio de Relaciones Exteriores necesita una nueva aprobación laboral―
- **Tool allowlist per task.**El agente puede navegar; a menos que una herramienta esté activada para la tarea, de lo contrario no puede emitir transferencias telefónicas.
- **Session isolation.**Las sesiones de los agentes del navegador sólo utilizan credenciales de alcance 运行―― no hay autor de producción, no hay correo electrónico personal― conservar cada solicitud HTTP 日志 para auditoría―
- **Content sanitizer.**Trajo HTML en el contexto del modelo 前,会剥离已知-bad patterns──(减少容易的攻击;无法阻止复杂的有效载──)
- **对 consequential actions 使用 HITL。**Proponer y luego hacer el patrón de la lección 15)
- **Canary tokens on memory.**Si una entrada de memoria 触发, el usuario lo verá ((Lección 14) ⋅


```figure
injection-boundary
```

## Usalo

`code/main.py`建模一个小浏览器-代理运行,目标是三个合成页面──一页是良性,一个在可见文本中有直接提示注射斑点,一个有URL-fragment注射(不可见,但位于代理的背景中)──脚本展示了 (a) naïve agent 会做什么,(b) read/write boundary 会捕获什么,(c) sanitizer 会捕获什么,(d) 二者都捕获不了什么──

##  entregarlo

`outputs/skill-browser-agent-trust-boundary.md`Definir un despliegue de navegador-agente propuesto: que alcanza las zonas de confianza, que está autorizado a escribir, así como la primera operación antes de tener que estar en las defensas.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` encontrar un desinfectante que pueda capturar, pero un límite de lectura/escritura que no puede capturar los ataques, así como un límite de lectura/escritura que pueda capturar los ataques 

2. 扩展干净剂, use it检测一类HashJack-style URL-fragment injection──在带有合法fragments的良性URL 上测量虚阳性率──

3. 选择一个你知道的真实浏览器-代理工作流 (例如,预订飞) ――列出每次阅读和每次写――标记哪些写 需要 HITL,以及为什么──

4. 阅读 WebArena-Verified ICLR 2026 paper──找到出一个原始 WebArena 评分不可靠的任务类别,并解释 Verified subset 如何解决它──

5. Para configuración de agente del navegador diseñar un canario de memoria. ¿Qué almacenarás, dónde estarás, qué activará la alarma?

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 实际含义 |
|---|---|---|
| Indirect prompt injection | “坏页面文本” | Agent 读取的页面中有不受信任内容，其中包含 agent 会执行的指令 |
| Tainted Memories | “Memory attack” | Agent 将攻击者提供的指令写入 durable memory；下一次 session 触发 |
| HashJack | “URL fragment attack” | 隐藏在 URL fragment / query string 中的 payload 位于 agent 的 context 中，但不会被可见渲染 |
| One-click hijack | “坏按钮” | 可见 affordance 承载 agent 会执行的后续 payload |
| BrowseComp | “Web search benchmark” | 在开放 Web 上查找特定事实；分钟级 horizon |
| OSWorld | “Desktop benchmark” | 完整 OS control；多步骤 GUI tasks |
| WebArena-Verified | “修复后的 web-task benchmark” | ServiceNow 重新评分的 WebArena，带 Hard subset |
| Read/write boundary | “Side-effect gate” | 读取永远不产生后果；如果内容来自 trust 外部，写入需要新的批准 |

## 延伸阅读

- [OpenAI — Introducing ChatGPT agent](https://openai.com/index/introducing-chatgpt-agent/) Operador y investigación profunda 合并;BrowseComp SOTA。
- [OpenAI — Computer-Using Agent](https://openai.com/index/computer-using-agent/) Lineaje de operador, así como posteriormente se convirtió en la arquitectura de agente ChatGPT。
- [Zhou et al. — WebArena](https://webarena.dev/) Origen de referencia
- [WebArena-Verified (OpenReview)](https://openreview.net/forum?id=94tlGxmqkN) Papel ICLR 2026 de subconjunto fijo。
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 包含 la discusión sobre la superficie de ataque de los agentes de uso informático。
