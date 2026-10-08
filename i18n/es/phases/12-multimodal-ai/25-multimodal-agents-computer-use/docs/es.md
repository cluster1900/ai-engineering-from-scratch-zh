# Agentes multimodal y uso informático (Capstone)

> 2026 año de producto fronterizo es un agente multimodal: puede leer capturas de pantalla, hacer clic en botones, revisar las interfaces web, rellenar formularios, y terminar hasta terminar los flujos de trabajo. SeeClick y CogAgent(2024) demostró que la base de la UGUI es primitiva.

**Type:** Capstone
**语言：**Python(stdlib、esquema de acción + esqueleto de bucle del agente)
**Prerequisites:** Phase 12 · 05（LLaVA）、Phase 12 · 09（Qwen-VL JSON）、Phase 14（Agent Engineering）
**Time:** 约 240 分钟

## El objetivo del aprendizaje
- 设计一个多模特代理循环:perceive → reason → act → observe → repeat。
- Construir un esquema de salida de tierra de la interfaz gráfica (GUI) Click coordenadas Texto de tipo Scroll Drag), permita que VLM Pueda emitirse con JSON 
- Comparar agentes sólo para capturas de pantalla, agentes de árbol de accesibilidad y agentes híbridos.
- En una pequeña sección de VisualWebArena, se establece la evaluación de referencia de agentes multimodal.

##  problemas
Un flujo de trabajo de la reserva: "Encuentra un vuelo a Tokio para el 15 de abril, asiento en el pasillo bajo $800, reserva".

Agente multimodal 需要:

1. 获取浏览器的截图──
2. Voy a tomar una captura de pantalla + URL + objetivo 解析为计划。
3. 发出 estructurada acción:clica en la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la dirección de la
4. La acción se aplicará al navegador.
5. 观察新状态 (nuevo estado)
6. 重复 Hasta que la tarea se complete.

Cada paso es una llamada de VLM multimodale. La salida de VLM debe ser JSON resuelvable. Los errores se acumulan en los pasos, por lo que la recuperación es importante.

## 概念
### La conexión a tierra de la interfaz gráfica  primitiva

La conexión a tierra de la interfaz gráfica es:给定一个屏幕截图 和一条自然语言指令,输出要点击的 (x, y) coordenadas(或其他 acción) ⋅

SeeClick(arXiv:2401.10935) es el primer resultado abierto en escala: en datos de GUI sintéticos + reales, en un VLM de tono fino, con tokens de texto en blanco 输出坐标──有效──

CogAgent(arXiv:2312.08914) para las UIs densas  aumentó el codificación de alta resolución 1120x1120 ∙分数:web navigation 约 84% ∙

Ferret-UI(arXiv:2404.05719) se especializa en las UI móviles,并与iOS accesibility data 集成──

El formato de salida suele ser JSON:

```json
{"action": "click", "x": 384, "y": 220, "element_desc": "Search button"}
```

`element_desc`Ayuda a la recuperación: si las coordenadas se desplazan entre las capturas de pantalla, la pista semántica puede hacer que el sistema se vuelva a colocar.

### Regímenes de acción

Un esquema de acción típico tiene 6-10 tipos de acciones:

- `click`(x, y)
- `type`¿Qué es esto?
- `scroll`: (dirección, cantidad)
- `drag`(x0, y0, x1, y1)
- `select`: (option_index)
- `hover`(x, y)
- `navigate`¿Qué es esto ?
- `wait`(ms)
- `done`: (éxito, explicación)

Cada paso del agente envía una acción.

### 仅截图 vs 可访问性树

两种输入模式:

- Sólo capturas de pantalla: imagen completa, no hay información estructural.
- Árbol de accesibilidad:DOM estructurado / información de accesibilidad iOS.
- Híbrido: ambos tienen, usando árbol como base de las acciones atómicas, usando capturas de pantalla para proporcionar un contexto semántico.

Los agentes de producción en el tiempo posible utilizar híbrido.

### Memoria de largo horizonte

Un flujo de trabajo de 20 pasos generará 20 capturas de pantalla.

- Resumen-cadena: cada 5 pasos 后,总结已经发生的事情,丢弃旧截图──
- Esquipa-marco: conservar la primera, última y cada 3 imágenes de pantalla.
- Registro de texto grabado por la herramienta: ejecutar acciones, mantener el registro de texto del contenido completado; no vuelva a ver las capturas de pantalla antiguas.

La API de uso informático de Claude utiliza el patrón de registro.

### Uso de herramientas visuales

ChartAgent(arXiv:2510.04514) para el entendimiento de gráficos  introdujo el uso de herramientas visuales:crop、zoom、OCR、调用外检查──agent puede colocar "crop to region (100, 200, 300, 400) then call OCR" 作为工具调用 输出──工具 返回文本;VLM 继续推理──

Este patrón puede generalizarse: la solicitud de marcas de conjunto, la anotación de regiones y las herramientas de detección externa se ajustan al mismo tipo de llamada de herramienta de salida, recepción y respuesta estructurada.

### Los índices de referencia de 2026

- ScreenSpot-Pro── aproximadamente 1k capturas de pantalla web de la GUI de tierra─Open SOTA Qwen2.5-VL-72B ≈ 85%─Frontier ≈ 90%─
- VisualWebArena。Tascas web de extremo a extremo(shop、forum、clasificados)。Open SOTA 约20%──Gemini 3 Pro 约27%──
- AgentVista(arXiv:2602.23166)。 lo más difícil de 2026 referencia。 transcurridos 12 dominios de flujos de trabajo realistas。 Los modelos fronterizos obtengan un 27-40%; los modelos abiertos un 10-20%。
- WebArena / WebShop── anteriores; ya ha sido fronterizado 和──

### ¿Por qué es difícil?

Agente 性能瓶:

1. 细粒度 visual grounding──"Clique en la pequeña X" 经常在移动分辨率 下失败──
2. Planificación a largo plazo. 10 acciones. Después, el agente se aleja del objetivo.
3. Recuperación de error── Cuando una vez haga clic en 失败(错误 botón)
4. Contexto de página intersectorial.

Direcciones de investigación:arquitecturas de memoria, replanamiento explícito, verificación multimodal, para la aplicación de capturas de pantalla de éxito de la acción)

### La piedra angular construyó

Capstone tarea: construir un agente de uso de computadora, que puede:

1. 读取 página falsa de la página de reservas de HTML + captura de pantalla。
2. 规划 secuencia de varios pasos:search → select → fill form → submit。
3. 发发出与行动方案匹配的JSON acciones──
4. En fijo 10-task slice arriba evaluación。

Esta lección proporciona código de andamio, fácil de ampliar para el navegador real.


```figure
mm-agent-loop
```

## Usalo
`code/main.py`Es un andamio de piedra angular:

- Esquema de acción de JSON 定义(10 个 acciones)。
- Como dictado de estado de navegador simulado.
- El esqueleto de la bucle de agente:recibe estado, emite acción, aplica, bucle.
- 10-task mini-benchmark (páginas sintéticas), para medir la tasa de éxito de extremo a extremo.
- Cuando la acción 失败时的 error-recovery hook──

##  entregarlo
本课 生成 `outputs/skill-multimodal-agent-designer.md` determinar un producto de uso informático (dominio, conjunto de acciones, objetivo de evaluación), diseñar un ciclo completo de agentes, estrategia de memoria, modo de enraizamiento y puntuación de referencia esperada.

##  ejercicios
1. Uso `screenshot_region`herramienta ((cultura + zoom) ampliar el esquema de acción―¿Qué tareas se beneficiarán?

2. 阅读 AgentVista(arXiv:2602.23166)。 describe la categoría de tareas más difíciles, así como por qué los modelos fronterizos  siguen fracasando―

3. Compresión de memoria de largo horizonte: diseñar una cadena de resumen, conservar ≤4 张 capturas de pantalla en vivo, registrado 数量不限。

4. Cuando el botón no se encuentra, ¿qué hace el agente?

5. Comparar Claude 4.7 con una captura de pantalla híbrida + árbol de accesibilidad Qwen2.5-VL en 10 tareas web.

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| GUI grounding | "Click coordinates" | Model 在 screenshot 上针对 instruction 的 target 输出 (x,y) |
| Action schema | "Tool definitions" | 有效 actions（click、type、scroll、drag）的 JSON description |
| Accessibility tree | "Structured DOM" | 来自 browser/iOS APIs 的 machine-readable UI hierarchy |
| Hybrid agent | "Screenshot + tree" | 同时使用 image 和 structured info；比单独使用任一者更可靠 |
| Visual tool use | "Zoom/crop/detect" | Agent 在 plan 中途调用 external vision tools（OCR、detection） |
| Summary-chain | "Memory compression" | 周期性 text summaries 替代很长的 screenshot history |
| VisualWebArena | "E2E web bench" | 2024 benchmark，用于 end-to-end web tasks |
| AgentVista | "2026 hard bench" | 12-domain realistic workflows；即使 Gemini 3 Pro 也只有约 30% |

## 延伸阅读
- [Cheng et al. — SeeClick (arXiv:2401.10935)](https://arxiv.org/abs/2401.10935)
- [Hong et al. — CogAgent (arXiv:2312.08914)](https://arxiv.org/abs/2312.08914)
- [You et al. — Ferret-UI (arXiv:2404.05719)](https://arxiv.org/abs/2404.05719)
- [ChartAgent (arXiv:2510.04514)](https://arxiv.org/abs/2510.04514)
- [Koh et al. — VisualWebArena (arXiv:2401.13649)](https://arxiv.org/abs/2401.13649)
- [AgentVista (arXiv:2602.23166)](https://arxiv.org/abs/2602.23166)
