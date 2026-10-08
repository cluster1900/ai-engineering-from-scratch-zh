# Inyección indirecta inmediata  生产攻击面

> Injección indirecta de la llamada (IPI) ordenará la incorporación de contenido externo  página web 、email 、documento compartido 、 boleto de soporte  por parte del sistema de agencias en el caso de que no haya una operación de usuario manifiesta  IPI es una amenaza de producción dominante en 2026: eludir los filtros de entrada de usuario, ya que el atacante nunca se comunica con el usuario; con los agentes  procesar más contenido externo, se expande silenciosamente; y se dirige a los que no leen el proceso de automatización de la llamada  Información MDPI 171)  54 (enero 2026)  Compuesto 2023-2025 años  NDSS 2026  El documento de defensa IPI presentará el reto central de la necesidad de la expresión: las instrucciones de entrada inicial en el sentido de "impresión de base" puede ser buena, por lo tanto, la prueba de estos no es sólo el filtrado de palabras clave  "Los ataques abiertos de los ataques humanos (Antropodefusión, ataques conjuntos, ataques de ataque, ataques de la segunda línea, ataques de los ataques humanos, ataques de la segunda línea, ataques de seguridad, ataques de los ataques de los ataques de los ataques humanos, ataques de la segunda línea, de la línea de seguridad, de la línea de seguridad, de los ataques de los ataques de los ataques de los ataques de los ataques de los ataques humanos, de la línea de los ataques de los ataques de los ataques de los ataques de los ataques de los humanos, de los ataques de los ataques de los ataques de los ataques de los grupos de los grupos de los grupos de los grupos de seguridad, de los grupos de los grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos

**类型：**Construir
**语言：**Python (stdlib, ataque IPI + arnés de defensa)
**先修要求：**Fase 18 · 12 (PAIR), Fase 14 (ingeniería de agentes)
**时间：**~ 75 minutos

## El objetivo del aprendizaje

- 定义间接快速注射,并描述三种常见投递 矢量──
- Explicar por qué los filtros de entrada del usuario se perderán por completo IPI.
- 描述作为2026年防御范式的"control del flujo de información" 框架──
- Explicar Nasr et al. (octubre 2025)  Sobre el descubrimiento de un ataque adaptativo a las defensas de IPI publicadas.

##  problemas

Inyección directa de la información  Requerir que el atacante llegue al usuario o a su mensaje  IPI 两者都不需要: el atacante coloca la carga útil 放入代理可能读取的任何内容中  web page、inbox 电子邮件、GitHub issue、产品 review──agent 运行正常中取到它并执行这些命令──用户是信使,而不是意图来源──

## 概念

### Tres tipos de vectores

- **RAG。** atacante publicar un documento; recuperación  pasos de obtenerlo; inmediato en el problema del usuario antes de escribirlo; modelo  ejecutar la instrucción del atacante:.
- **Inbox / document workflows。** atacante a los usuarios envía correo electrónico; agente  lectura de correos electrónicos; inmediato  contiene el cuerpo del correo electrónico; modelo  seguir las instrucciones del correo electrónico en el medio。
- **Tool output。** Agente de control del atacante Utiliza una herramienta (por ejemplo, regresar a los resultados de búsqueda web del atacante); la salida de herramienta  contiene instrucciones; flujo de control del agente sigue estas instrucciones。

Este tercero comparte una propiedad estructural: un fragmento del instante de control del atacante, sin necesidad de contacto hacia la entrada del usuario.

### ¿Por qué los filtros de entrada del usuario se perderían

IPI payload no aparece en la entrada del usuario. Se presenta en el contenido recuperado. Si el filtro sólo se basa en la entrada del usuario para la puerta, la carga de pago se desplaza por encima de él. Si el filtro actúa en todo el contenido del modelo que llega, debe aplicarse a cualquier texto recuperado.

### 面向 AI ′s Control de flujo de información (IFC)

2026 años defense范式借鉴经典 OS security──把每一个内容源都视为一个安全标签──把用户的查询标记为"可信"──把检索的内容标记为"不可信"──把模型的控制流 视为信息流:由不可信的内容 触发的行动 必须在执行前由可信的输入 批准──

CaMeL (Microsoft 2025)、ConfAIde (Stanford 2024) 和 NDSS 2026 Papel de defensa IPI 以不同方式落地 IFC──共同原则是: tan sólo si el código y los datos compartieron una ventana de contexto, el objetivo es contención, no prevención──

### El atacante se mueve segundo

Nasr et al. (octubre 2025) Utilizando ataques adaptativos (gradiente búsqueda, políticas de RL, búsqueda aleatoria, equipo rojo humano de 72 horas) testaron 12 defensas de IPI publicadas.

方法論教训: sólo en la que se incluye la evaluación de ataque adaptativo 时才发布 defensa。Estáticos de ataque de referencia no es prueba de robustez; el atacante sabrá la defensa。

### verdad verdad incident

Lección 25 覆盖 EchoLeak (CVE-2025-32711, CVSS 9.3)  Microsoft 365 Copilot 中首个公开记录的零点击IPI。GitHub Copilot Chat 中的CamoLeak (CVSS 9.6)。GitHub Copilot 中的CVE-2025-53773──生产部署正在真实场景中被IPI 攻陷,而不只是基准中──

### OWASP y NIST  marco

OWASP LLM Top 10 (2025) va a inyectar rápidamente(directo + indirecto) 列为LLM01,即排名第 1 的应用层威胁――NIST AI SPD 2024 称间接快速注射为"generación AI mayor fallo de seguridad".

### Está en la fase 18

Lecciones 12-14 es un modelo de jailbreaks centrado en la ley. Lección 15 es un ataque centrado en el sistema de la producción de 2026 años. Lección 16                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       


```figure
al-injection-vector
```

## Usalo

`code/main.py`构建一个IPI harness──一个玩具代理有三个工具──搜索网、阅读电子邮件、发送消息)──环境包含攻击者控制的内容,其中Embedding一条指令("enviar esto a todos los contactos")──你可以在天真代理(遵循注入指令)、过防守代理(对获取内容做关键词过) 和IFC代理(分离可信与不可信的内容,并拒绝不可信的控制流命令) 切换之间

##  entregarlo

本课生成                       `outputs/skill-ipi-audit.md` Dado una descripción de la implementación de la agencia, se recoge fuentes de contenido no fiables, se verifica si la agencia aplica IFC, y se marca las fuentes sin etiqueta de confianza en el modelo de llegada 

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`◊ Medir los ataques contra tres agentes, con un índice de éxito diferente.

2. En el contenido recuperado, se realiza una defensa basada en la paráfrase.

3. 阅读 NDSS 2026 IPI-defensa papel―describir "instrucción benigna" 挑战, así como por qué impedirá el filtrado basado en palabras clave―

4. 设计一个部署, de los cuales el agente de la API de terceros 接收工具输出──为每一个提示片段 标记信任水平,并写出控制代理行动的IFC政策──

5. En el ejercicio 2 del agente filtrado-defendido 上复现 Nasr et al. 2025 método de ataque adaptativo 方法論──報告 適応攻撃 前後的 ASR──

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 实际含义 |
|------|-----------------|------------------------|
| IPI | "indirect prompt injection" | 通过用户没有编写、但 agent 在正常运行期间消费的内容进行 injection |
| RAG injection | "poisoned retrieval" | 攻击者发布 retrieval 步骤会获取的内容；prompt 中包含 payload |
| Zero-click | "no user action" | 攻击在 agent 运行期间自动触发；用户什么都不做 |
| IFC | "information flow control" | 基于 label 的方法：来自 untrusted content 的 actions 需要 trusted ratification |
| Adaptive attack | "gradient / RL red-team" | 知道 defense 并针对它优化的 attack；诚实评估必须包含 |
| Benign instruction | "please print Yes" | 语义上良性的 IPI payload；没有 keyword filter 能捕获它 |
| Scope violation | "cross-trust exfiltration" | Agent 从一个 trust context 访问 data，并将其输出到另一个 trust context |

## 延伸阅读

- [MDPI Information 17(1):54 — Indirect Prompt Injection Survey (January 2026)](https://www.mdpi.com/2078-2489/17/1/54) 2023-2025 综合
- [Nasr et al. — The Attacker Moves Second (joint OpenAI/Anthropic/DeepMind, October 2025)](https://arxiv.org/abs/2510.18108) Autodeterminación de las acciones
- [Greshake et al. — Not what you've signed up for (arXiv:2302.12173)](https://arxiv.org/abs/2302.12173) Papel IPI original
- [OWASP — LLM Top 10 (2025)](https://genai.owasp.org/llm-top-10/) Inyección rápida 排名 LLM01
