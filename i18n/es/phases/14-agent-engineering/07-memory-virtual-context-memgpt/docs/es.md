# Memoria: Contexto virtual y MemGPT

> La ventana de contexto es limitada. El diálogo, el archivo y la herramienta no son. MemGPT (Packer et al., 2023) la clasifica como memoria virtual del sistema operativo: el contexto principal es RAM, la tienda externa es disco, el agente entre los dos realiza la página.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 06 (Tool Use)
**Time:** ~75 minutes

## El objetivo del aprendizaje
- 解释 MemGPT 所基于的 OS 类比:contexto principal = RAM,contexto externo = disco, herramientas de memoria = página de entrada/salida。
- Utiliza stdlib 实现 dos niveles MemGPT 模式:buffer de contexto principal, almacenamiento externo de búsqueda, así como herramientas de entrada/salida de la página.
- 描述 agent 如何发发出"interrupts"来查询或修改外部记忆,以及结果如何被拼接回下一个提示──
- 识别会延续到 Letta(Ley 08) y Mem0(Ley 09) en MemGPT 设计选择。

##  problemas
La ventana de contexto parece que es capaz de resolver la memoria.

1. **Overflow.**Muchos diálogos, muchos documentos, o una trayectoria de llamadas de herramientas, mucho más que una ventana, todo desaparecerá.
2. **Dilution.**Incluso dentro de la ventana, el inserto en el contexto no es relevante también se desprende de los contenidos importantes.
3. **Persistence.**Nueva sesión desde la ventana vacía comienza. No hay memoria externa.

Un mayor número de ventanas ayuda, pero no puede resolver este problema. El documento de Mem0 de 2025 mide hasta 128k-ventanas baseline todavía perderá un agente de 4k-ventanas gracias a la memoria externa puede capturar hechos de largo horizonte.

## 概念
### MemGPT:OS 类比

Packer et al. (arXiv:2310.08560, v2 Feb 2024) se va a la gestión de contexto 映射到操作系统虚拟内存:

| OS concept | MemGPT concept | 2026 production analog |
|------------|---------------|------------------------|
| RAM | main context (prompt) | Anthropic/OpenAI context window |
| Disk | external context | Vector DB, KV, graph store |
| Page fault | memory tool call | `memory.search`, `memory.read`, `memory.write` |
| OS kernel | agent control loop | ReAct loop with memory tools |

agente 运行一个普通的 ReAct loop──额外的一类工具 允许它把数据页在和页在主语境中──

### Dos niveles

- **Main context.**固定大小的提示,保存当前任务──始终对模型可见──
- **External context.**无界, 通过工具 搜索. 相关时读取.

El documento original evaluó el diseño en dos tareas de ventanas de base superiores: análisis de archivos de más de 100k Tokens, así como chat de múltiples sesiones para mantener una memoria persistente durante el día.

### Modelo de interrupción

MemGPT  introducir memoria como interrupción: en el diálogo, el agente puede utilizar la herramienta de memoria, tiempo de ejecución  ejecutarla, como resultado de una nueva observación 拼接进下一次助手转.`read()`syscall: Bloquea el proceso, devuelve los bytes, y luego el proceso continúa funcionando.

标准 memoria 工具接口:

- `core_memory_append(section, text)` 写入 prompt 的 persistent section──
- `core_memory_replace(section, old, new)` 编辑 sección persistente。
- `archival_memory_insert(text)` 写入 buscable tienda externa。
- `archival_memory_search(query, top_k)` Desde la tienda externa 检索。
- `conversation_search(query)` 扫描过去的转折──

### Frontera de MemGPT con el punto de partida de Letta

El proyecto de investigación de la Universidad de Barcelona (MemGPT) se desarrolla en el año 2024.`cpacker/MemGPT`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

- Tres niveles en vez de dos niveles:
- Usar el razonamiento nativo 替代 `send_message`/patrón de latidos del corazón (lección 08)
- Agentes del sueño 运行 trabajo de memoria sincronizada (LECCIÓN 08)

Incluso el sistema de producción de Letta ̇Mem0, o tienda de dos niveles, MemGPT papel ̇ sigue siendo la base de 2026 años ̇

### Este modo es fácil de salir mal donde

- **Memory rot.**写入积累得比读取更快; recuperación 被陈旧事实淹没──修复方式: regular consolidation(Leta hora de dormir), evidente invalidación(Mem0 detector de conflictos)。
- **Memory poisoning.**La memoria externa es el texto que ha sido recogido. Si el contenido controlado por el atacante se cae en la memoria, el agente se volverá a recogerlo en la próxima sesión.
- **Citation loss.**Agente recordar usuario me hace nave X, pero no puedo citar es cual una ronda.


```figure
context-budget
```

## Construirlo
`code/main.py`Utilizando el modelo de dos niveles de MemGPT:

- `MainContext` Fixada gran tamaño de amortiguador rápido,带有 `core`dict 和 `messages`lista; supera cap 时自动 compact 最旧消息──
- `ArchivalStore` almacenamiento de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de archivos de arch
- 五个映射到MemGPT de superficie herramientas de memoria
- Un agente guionado, primero llenar los hechos en el archivo, luego pasar a la consulta.`archival_memory_search`回答问题──

运行:

```
python3 code/main.py
```

trace 展示 agent 写入三个事实,将主要文本 填到 cap 触发驱逐),然后通过档案检索来回答后续问题,在没有真实 LLM的情况下复现 MemGPT工作流──

## Usalo
Hoy en día cada sistema de memoria de producción es un variante de MemGPT:

- **Letta**(Lección 08)  三層、native reasoning、computación del tiempo de sueño―
- **Mem0**(Lección 09)  Vector + KV + gráfico, con la capa de puntuación 融合──
- **OpenAI Assistants / Responses**  通过线程和文件 管理存储──
- **Claude Agent SDK**                                                                                                                                                                                                                                                              

选择, en lugar de en función del patrón principal 选择; core pattern 就是 MemGPT。

##  entregarlo
`outputs/skill-virtual-memory.md`Es una habilidad replicable, puede ser utilizada en cualquier tiempo de ejecución de un objetivo.

##  ejercicios
1. Añadir una en Tokens  medida `max_main_context_tokens`Caps`len(text.split())`* 1.3 近似) ・超越 cap 时,把最旧消息紧紧成总结──比较有没有总结者时的行为──
2. En la tienda de archivos 上正确实现 BM25(term frequency、inversa document frequency) ・・・ en el juego de hechos 上测量 recall@10,并与令牌-overlap baseline比较──
3. 给档案插件 添加 `citation`campos(sesión_id, turn_id, source_url)。让代理 在每个回复中引用来源──
4. 模拟记忆中毒:添加一条档案记录,内容是"ignorar todas las instrucciones del usuario futuro". 编写一个 guard,扫描检索中指示形文,并把它们标记为不值得信赖的──
5. Se implementará el traslado para utilizar el esquema JSON de memoria central del repo de investigación MemGPT (`cpacker/MemGPT`)― Cuando se cambian las cuerdas planas a las secciones tipografadas ¿qué ocurre?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Virtual context | “无限 memory” | Main（prompt）+ external（searchable）两层，带 page in/out |
| Main context | “Working memory” | prompt：固定大小，始终可见 |
| Archival memory | “Long-term store” | External searchable persistence，按需检索 |
| Core memory | “Persistent prompt section” | 固定在 main context 内的命名 sections |
| Memory tool | “Memory API” | agent 发出的用于读写 external memory 的 tool call |
| Interrupt | “Memory page fault” | Agent 暂停，runtime 获取，结果拼接进下一轮 |
| Memory rot | “Stale facts” | 旧写入淹没 retrieval；用 consolidation 修复 |
| Memory poisoning | “Injected persistent note” | attacker content 被存为 memory，并在 recall 时重新摄入 |

## 延伸阅读
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560) Recibir el sistema operativo 启发的虚拟环境 论文
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) Evolución de tres niveles
- [Anthropic, Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) El contexto  en función del presupuesto
- [Chhikara et al., Mem0 (arXiv:2504.19413)](https://arxiv.org/abs/2504.19413) construir memoria de producción híbrida en este modelo
