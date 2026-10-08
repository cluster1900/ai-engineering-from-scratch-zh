# Recetas de VLM de peso abierto: lo que realmente importa es qué

> La documentación de VLM de peso abierto de 2024-2026 es una pieza de tablas de ablación de bosque. En Apple MM1 probó 13 tipos de codificadores de imágenes, conectores y combinaciones de datos. En Molmo de Allen AI, se demostraron detalles de las capciones humanas que superaron la destilación GPT-4V. En Cambrian-1 se hicieron más de 20 tipos de codificadores para el diseño de cinco comparativos. Idefices2 se ejecutarán en el espacio de diseño.

**Type:** Learn + lab
**Languages:** Python (stdlib, ablation table parser + recipe picker)
**Prerequisites:** Phase 12 · 05 (LLaVA baseline)
**Time:** ~180 分钟

## El objetivo del aprendizaje
- Explicar el espacio de diseño de VLM:encoder de imagen, conector, LLM, mezcla de datos, calendario de resolución.
- 阅读 MM1 / Idefics2 / Cambrian-1 tabla de ablación,并预测哪个按 会改变给定基准──
- En el caso de un presupuesto de computación y una mezcla de tareas, elegir una nueva receta de VLM (encoder, conector, datos, resolución)
- Explica por qué en el mismo recuento de tokens abajo, detalles personales Capciones  venció GPT-4V destilación。

##  problemas
已 hay cientos de VLM de peso abierto ∼ la mayoría de las diferencias entre los buenos y los más modernos no provienen de la arquitectura, sino de los datos, el calendario de resolución y la elección del codificador ∼ Cuando tu modelo no funciona bien, sabes qué botón puedes cambiar, puedes evitar un error de 500 millones de GPUs ∼小时──

2023 年浪潮(LLaVA-1.5、InstructBLIP、MiniGPT-4) basado en el preentrenamiento de la pareja de captura + LLaVA-Instruct-150k──不错的基线──上限约在MMMU 35%──

Las operaciones de ablación de las plantas de la región de la Tierra se han desarrollado de forma muy detallada.

## 概念
### Espacio de diseño

Idefics2 ((Laurençon et al., 2024) nombró estos ejes:

1. Encodrador de imágenes──CLIP ViT-L/14、SigLIP SO400m/14、DINOv2 ViT-g/14、InternViT-6B──Encodradores en tamaño de parche、resolución 和 objetivo de preentrenamiento 上不同──
2. Conector──MLP(2-4 capas)、Q-Former(32 consultas + cross-attn)、Perceptor Resampler(64 consultas)、C-Abstractor(convolutional + bilinear pooling)―
3. Modelo de lenguaje―Llama-3 8B / 70B、Mistral 7B、Phi-3、Gemma-2、Qwen2.5―El tamaño de la LLM es el principal parámetro de costo―
4. Datos de formación. Parejas de capción.
5. Calendario de resolución: fijo 224/336/448 AnyRes  dinámica nativa 

Cada producción VLM ciudadán en cada eje 上做选择。 La mayor parte de la variación de las puntuaciones de MMMU es explicada por los ejes 1、4 y 5 ⋅, en lugar de por el conector que elijas ⋅ explica¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

### Eje 1:encoder > conector

MM1 Sección 3.2 显示: desde CLIP ViT-L/14 换成 SigLIP SO400m/14,MMMU 增加 3+ puntos。 desde MLP 换成 Perceptor Resampler,增加不到1 point。Idefics2 复现了这一点:SigLIP > CLIP,Q-Former ≈ MLP ≈ Perceptor,在同样的代币数下相近。

Cambrian-1 Cambrian Vision Encoders Match-Up(Tong et al., 2024) en el benchmark centrado en la visión(CV-Bench) se ejecutó 20+ 个编码器──排行榜顶部是DINOv2 和 SigLIP的混合;CLIP 位于中游;ImageBind 和 ViT-MAE 更低──CLIP ViT-L 到 DINOv2 ViT-g/14 在 CV-Bench 上的差距约为 5-7 puntos──

El codificador de VLM abierto de 2026 años es usado para características semánticas + densas de SigLIP 2 SO400m/14, algunas veces se encuentra con DINOv2 ViT-g/14 características 拼接(Cambrian Spatial Vision Aggregator 就这样做)

### Eje 2: Diseño de conector 差异不大

MM1、Idefics2、Prismatic 和 MM-Interleaved todos llegaron a la misma conclusión: en el conteo fijo de tokens visuales, la arquitectura de conectores 几乎不重要── para parches de media conjunta utilizando MLP de 2 capas, en el mismo presupuesto de tokens, bajo, la distancia de 32 preguntas Q-Former no llega a 1 punto──

Verdaderamente, es importante el número de tokens. Más tokens visuales = 更多 LLM computación = 更好表现,直到某个点后收益递递减.

Q-Former vs MLP es un problema de costes, no de calidad: independientemente de la resolución de la imagen  Cómo, Q-Former 都把 tokens 限制在 32-64; MLP 输出全部补丁代币──对高分辨率输入, Q-Former 省 LLM context;对低分辨率,差异只是噪声──

### Eje 3: tamaño de la LLM decide sobre límite

En cada artículo del VLM, poner el LLM de 7B 翻倍到13B, normalmente todos permiten que el MMMU 增加 2-4 puntos── hasta 70B 时, la mayoría de los puntos de referencia 会和──VLM 的多模理性天花板就是LLM 文理性天花板视觉编码器 只能信息,不能替代它推理──

Es por eso que Qwen2.5VL-72B y Claude Opus 4.7 en MMMU-Pro y ScreenSpot-Pro arriba lideran considerablemente: el cerebro del lenguaje 很大── un 7B VLM no puede confiar en el diseño ingenioso del conector 替代 70B VLM──

### Eje 4: Datos  详细的人类字幕 胜过蒸

Molmo + PixMo(Deitke et al., 2024) es el resultado que todo el mundo debería leer de 2024 años. Allen AI 让人类标注员使用 1-3 分钟的密集语音传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递传递

Molmo-72B en 11/11 个基准上击败Llama-3.2-90B-Vision。 La diferencia no es en la arquitectura, sino en la calidad de las capciones。 Detalles de las leyendas personales Cada imagen contiene información de la cantidad de las leyendas web cortas 更多 5-10x, y en la destilación GPT-4V 易 hallucinate 地方保持事實的土壤──

ShareGPT4V(Chen et al., 2023) y Cauldron(Idefics2) adoptaron el mismo libro de juego, las inscripciones humanas mezcladas + GPT-4V。 la tendencia es muy clara: para la frontera de 2026 y palabras, densidad de inscripciones > cantidad de inscripciones > conveniencia de destilación。

### Eje 5: Resolución  y su calendario

Idefics2 的 ablaciones:384 -> 448 增加 1-2 puntos──448 -> 980 配合图像分分 ((AnyRes) en los puntos de referencia OCR 上再增加 3-5──Flat resolution training 会在中等 precisión 附近高原; resolución ramping(从 224 开始,以 448 或 native 结束) entrenamiento更快,最终更高──

Cambrian-1 hizo una resolución frente a tokens trade-off: en la computación fija, puedes elegir una resolución baja, más tokens, o una resolución alta, menos tokens.

Recipe de producción 2026:Etapia 1 以 384 entrenamiento fijo,Etapia 2 para tareas pesadas OCR Utiliza una resolución dinámica de hasta 1280 años.

### Contralor de control prismático

Prismatic VLMs ((Karamcheti et al., 2024)) es el papel de control de todos los ejes.

- Conto de tokens visuales por imagen  explica aproximadamente 60% de variación。
- La elección del codificador  explica aproximadamente 20%。
- Arquitectura de conectores  explica aproximadamente 5%
- 其他所有因素(mix de datos, cronógrafo, LR) explica el 15% restante.

Esto es una descomposición grosera, pero también en la literatura sobre lo que debería ablar primero.

### 2026 año de selección

 Basado en pruebas, reciba de VLM abierta de 2026 años nuevos proyectos:

- Encoder:native resolution 下的 SigLIP 2 SO400m/14 con NaFlex; si se necesita segmentación/terreno, entonces se puede combinar DINOv2 ViT-g/14 para obtener características densas。
- Conector: parche de tokens MLP de 2 capas arriba.
- LLM: Qwen2.5 / Llama-3.1 / Gemma 2;7B Utilizó en el coste, 70B Utilizó en la calidad, según la latencia objetivo 选择。
- Datos:PixMo + ShareGPT4V + Cauldron,并用任务特定指示数据 补足。
- Resolución:dinámica (长边 min 256、max 1280 píxeles)
- Programa:Alineación de la etapa 1 (sólo proyector) Etapes 2 y 2 de ajuste completo de la tarea Etapes 3 de ajuste específico de la tarea 

Cada uno de estos términos se remonta a los documentos de la última cita de este curso.


```figure
l5-vlm-recipe-knobs
```

## Usalo
`code/main.py`Es un analizador de tablas de ablación y receta de recetas.

-  Dedicar el presupuesto X y la tarea Y, ¿cuál receta 胜出?
-  Si yo en 7B Llama arriba subir SigLIP  cambiado a CLIP, esperado MMMU delta ¿qué?
- Para obtener una respuesta de confianza del 80%, ¿debería primero ablar el eje?

输出 es una lista de recetas clasificadas, que contiene el delta de referencia esperado y la primera recomendación de la tabla.

##  entregarlo
本课生成                       `outputs/skill-vlm-recipe-picker.md` dar un objetivo determinado de la mezcla de tareas, presupuesto de cálculo y objetivo de latencia, que emitirá una receta completa de la mezcla de tareas, y para cada elección de referencia a la ablación correspondiente.

##  ejercicios
1. 阅读MM1 Sección 3.2── Para el LLM 2B fijo, en 50M imágenes presupuesto abajo, ¿qué codificador 胜出? Si cambiado a 13B LLM, ¿la respuesta se volverá? ¿Por qué?

2. Cambrian-1 发现,拼音 DINOv2 + SigLIP 在视觉中心的基准上胜过单独使用任一者, pero en MMMU arriba no hay ningún nuevo señal──预测 qué criterios se elevarán, qué se mantendrán平──

3. Su objetivo es construir un agente de UI móvil. Selección de codificador, conector, resolución y mezcla de datos.

4. Molmo publicó modelos 4B y 72B. 4B y VLM cerrados 7B tienen competencia. 72B en 11/11                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  

5. Design a una tabla de ablación, utilizada en 7B VLM 上隔离数据-mix quality 和 encoder quality──最少需要多少次培训 runs? proponer cuatro ajustes de eje──

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Ablation | “调一个 knob” | 训练多次 runs，它们只在一个 design-space axis 上不同，其他全部保持 constant |
| Connector | “Bridge” / “projector” | 将 vision encoder output 映射到 LLM token space 的 trainable module（MLP、Q-Former、Perceiver） |
| Detailed human caption | “Dense caption” | 多句人类撰写的描述（通常 80-300 tokens），比 web alt text 更丰富 |
| Distillation | “GPT-4V captions” | 由更强的 proprietary VLM 生成的 training data；方便，但容易继承 hallucination |
| AnyRes / dynamic res | “High-res path” | 通过 tiling 或 M-RoPE 输入大于 encoder native resolution 的图像的 strategy |
| Resolution ramp | “Curriculum” | 从 low-resolution 开始并逐步提高的 training schedule，可加快 alignment learning |
| Vision-centric bench | “CV-Bench / BLINK” | 强调细粒度 visual perception，而非 language-heavy reasoning 的 evaluation |
| PixMo | “Molmo's data” | Allen AI 的 712K densely-captioned image dataset；人类语音被转写为 dense captions |

## 延伸阅读
- [McKinzie et al. — MM1 (arXiv:2403.09611)](https://arxiv.org/abs/2403.09611)
- [Laurençon et al. — Idefics2 / What matters building VLMs (arXiv:2405.02246)](https://arxiv.org/abs/2405.02246)
- [Deitke et al. — Molmo and PixMo (arXiv:2409.17146)](https://arxiv.org/abs/2409.17146)
- [Tong et al. — Cambrian-1 (arXiv:2406.16860)](https://arxiv.org/abs/2406.16860)
- [Karamcheti et al. — Prismatic VLMs (arXiv:2402.07865)](https://arxiv.org/abs/2402.07865)
