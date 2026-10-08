# Bloques de memoria y computación del tiempo de sueño (Letta)

> MemGPT en 2024 se convirtió en Letta. En el desarrollo de 2026 se unieron dos ideas: el modelo puede editar directamente los bloques de memoria funcionales separados, así como el agente del tiempo de sueño en el agente primario de la memoria de integración de los cambios en el tiempo.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 07 (MemGPT)
**Time:** ~75 minutes

## El objetivo del aprendizaje
- Explicar las tres capas de memoria de Letta (corazón, recuerdo, archivo) y el papel de cada capas.
- explicar patrón de bloqueo de memoria:bloqueo humano,bloqueo de persona, así como bloques definidos por el usuario de objetos de tipo primero y otro.
- Describa lo que es la computación del tiempo de sueño, por qué se encuentra fuera de la ruta crítica, y por qué puede funcionar en comparación con el agente primario más fuerte modelo.
-  Realizar un ciclo de doble agente guionado, en el que el agente primario  proporciona respuesta, agente del tiempo de sueño                                                                                                                                                                                                                                                                                                            

##  problemas
MemGPT (Lección 07) resolvió el flujo de control de memoria virtual.

1. **Latency.**Cada operación de memoria está en el camino crítico. Si el agente tiene que cortar, recoger o ajustar mientras el usuario espera, la latencia de cola aumentará dramáticamente.
2. **Memory rot.**写入会不断累积――被矛盾推翻的事实会留下――检索会被陈旧内容淹没―― y también en el pasado, el hecho de que el contenido de la contradición haya sido rechazado, se ha vuelto a añadir.
3. **Structure loss.**平的存档库 无法表达Human block 总是在提示中;Persona block 总是在提示中;Task block 按会议 交换──

Letta (letta.com) es una versión de 2026 años de nuevo escrito.

## 概念
### Tres niveles

| Tier | Scope | Where it lives | Written by |
|------|-------|----------------|------------|
| Core | 始终可见 | 在 main prompt 内 | Agent tool call + sleep-time rewrites |
| Recall | 对话历史 | 可检索 | 自动轮次日志 |
| Archival | 任意事实 | Vector + KV + graph | Agent tool call + sleep-time ingest |

El núcleo es MemGPT core──Recall es el buffer de conversación  y su parte final de la expulsión──Archivo es el almacén externo──Este desmantelamiento ha resuelto las dos capas de carga de MemGPT──

### Bloques de memoria

El bloque es el nivel central de una sección de tipografía persistente editable.

- **Human block** 关于用户的事实(姓名、角色、偏好、目标)
- **Persona block** autoconcepto del agente 身份、语气、约束)

Letta generaliza su contenido en bloques definidos por el usuario: para su uso en el objetivo actual.`Task`Bloqueo, para base de códigos hechos`Project`Bloqueo, para usar en la construcción de un bloqueo`Safety`Bloqueo... cada bloque tiene...`id`¿Qué es esto?`label`¿Qué es esto?`value`¿Qué es esto?`limit`(字符上限)`description`(让模型知道何时编辑它)

Bloques de la superficie de la herramienta 编辑:

- `block_append(label, text)`
- `block_replace(label, old, new)`
- `block_read(label)`
- `block_summarize(label)`                                                                                                                                                                                                                                                              

### Computación del tiempo de sueño

2025 年 Letta 的新增项: 在后台运行第二个代理,位于关键路径之外──睡眠时间代理 处理对话转录和代码基础背景,将 `learned_context`写入共享区块,并整合或作废档案记录──

Las propiedades obtenidas:

- **No latency cost.**Respuestas primarias no esperan operaciones de memoria.
- **Stronger model allowed.**El agente de tiempo de sueño puede ser un modelo más caro, más lento, ya que no tiene latencia.
- **Natural consolidation window.**Cuando el usuario no espera, se realiza el re-evento.

Esta forma se ajusta al modo de trabajo humano: tu completas tareas, duermes, recuerdos de larga duración en la noche.

### Letta V1 y el razonamiento de los nativos

Letta V1 (`letta_v1_agent`, 2026) abandonado `send_message`/bate de corazón y en línea `Thought:`Las señales, los cambios y el apoyo al razonamiento nativo. Las respuestas de la API (OpenAI) y los mensajes de pensamiento extendido. Las mensajes de la API (Antropic) se encuentran en un canal único.

### Este modo es fácil de salir mal donde

- **Block bloat.**无限 `block_append`Se puede ver en el resumen de los bloques de entrada.
- **Silent drift.**Agente del sueño vuelve a escribir el bloque, mientras que el agente principal de la no-observado.
- **Poisoned consolidation.**El agente del sueño será el atacante de procesamiento de contenido de alcance en el núcleo. Lección 27 También se aplica a la superficie del sueño.


```figure
memory-blocks
```

## Construirlo
`code/main.py`实现:

- `Block` id、etiqueta、valor、limitamento、descripción。
- `BlockStore` CRUD + `near_limit(label)`ayudante.
- 两个 guionista agentes  `PrimaryAgent` Servicio una vez,`SleepTimeAgent`En la ronda de entre los integrados.
- Una pista, muestra contiene un bloque de escritos, así como un paso de sueño, que resume un bloque y se deshace de un viejo hecho.

运行:

```
python3 code/main.py
```

Transcripción  muestra este despliegue: turnos primarios  rápidamente 并产生 原始写入; sueño pase 负责压缩和清理。

## Usalo
- **Letta**(letta.com)  Como aplicación de referencia, puede ser administrada en la nube o utilizar la nube gestionada.
- **Claude Agent SDK skills**Como un bloque de conocimiento, la habilidad es un bloque de instrucciones, agente, carga por carga.
- **Custom builds**适用于希望控制存储后端的团队──使用Letta API contract,以便后续迁移──

##  entregarlo
`outputs/skill-memory-blocks.md`Se creó un sistema de bloque en forma de Letta, con ganchos de sueño, incluyendo reglas de seguridad y cableado de citación.

##  ejercicios
1. Añade uno.`block_summarize`herramienta:当 `near_limit`返回 true 时, usando el resumen generado por el modelo 替换块值──哪个触发值能同时最小化总结调用 和块溢出?
2. En archivos para lograr la deducción del tiempo de sueño: el texto de dos registros tiene >90% de tokens superpuestos 时折叠为一个.
3. Por bloques 加版本──每次写入都记录旧值和差──暴露 `block_history(label)`, dejan que los operadores puedan probar por qué el agente olvidó X──
4. Cuando toquen el bloque de Persona o Seguridad, envíen un pedido de revisión de otro agente.
5. Se puede utilizar una API Letta (`letta_v1_agent`¿Qué cambios hay en el esquema de bloque, el razonamiento nativo? ¿Cómo cambiar la forma de la huella?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Memory block | “可编辑的 prompt section” | Core memory 中 typed、persistent、LLM-editable 的 segment |
| Human block | “用户记忆” | 关于用户的事实，固定在 core 中 |
| Persona block | “Agent 身份” | Self-concept、语气、约束，固定在 core 中 |
| Sleep-time compute | “异步记忆工作” | 第二个 agent 在 critical path 之外执行整合 |
| Core / Recall / Archival | “层级” | 三层记忆拆分：始终可见 / 对话 / external |
| Block limit | “上限” | 每个 block 的字符限制；迫使进行 summarization |
| Native reasoning | “Thinking channel” | Provider-level reasoning output，而不是 prompt-level `Thought:` |
| Learned context | “Sleep output” | Sleep-time agent 写入 shared blocks 的事实 |

## 延伸阅读
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) patrón de bloqueo
- [Letta, Sleep-time Compute blog](https://www.letta.com/blog/sleep-time-compute) 异步整合
- [Letta, Rearchitecting the Agent Loop](https://www.letta.com/blog/letta-v1-agent) 原生 razonamiento 重写
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560) 起源
