# Desde CLIP hasta BLIP-2  Q-Former  como puente de modalidad

> CLIP para imágenes y texto, pero no puede generar captura, responder a problemas o mantener conversaciones. BLIP-2 (Salesforce, 2023) resolvió este problema con un pequeño puente de entrenamiento (32 个学习可见的桥接) Vektor 通过跨度关注 关注结结 ViT的功能,然后直接插入结冰 LLM的输入流──188M 参数的桥接将一个11B LLM 连接到 ViT-g/14──到2026年,每个基于适配器的VLM  MiniGPT-4──Instruir 近亲的LLaVA都是它的后代──本课阅读Q-Former的架构,解释其两阶段玩具训练,并输建一个 版本,把代码视觉解解入到结冰文中──

**Type:** Build
**Languages:** Python (stdlib, cross-attention + learnable-query demo)
**前置要求:**Fase 12 · 02 (CLIP), Fase 7 (Transformadores)
**Time:** ~180 minutes

## El objetivo del aprendizaje
- Explica por qué poner una botella de entrenamiento entre el codificador de visión congelado y el LLM congelado es mejor que la regulación de fin de extremo a extremo en términos de coste y estabilidad.
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
- 走读 BLIP-2 的两阶段预训练:representación (ITC + ITM + ITG), luego generativa(utilizando la pérdida de LM del decodificador congelado)。
- Comparar el Q-Former con el proyector MLP más simple de uso en LLaVA 并论证各自何时更占优──

##  problemas
Tienes una ViT congelada, produce 256 parches de parches de cada imagen de la dim 1408 Token. Tienes un parche de parches de 7B LLM, espera que haya un parche de parches de 4096 Token Embedding.

El problema de BLIP-2 es: ¿podría comprimir la representación de imágenes de 256 tokens en un número menor de tokens (por ejemplo 32), al tiempo que se conserva suficiente información, para que el LLM pueda generar capciones de imágenes, responder a las preguntas y realizar razonamientos?

答案是:Q-Former──32 个可学习的"query" Vector, hacer una participación cruzada en el parche de ViT Token, generar un resumen visual de 32 Tokens para LLM  Uso total 188M 参数──在接触 LLM 之前, primero usar contraste、匹配 和生成目标 训练──

## 概念
### Las preguntas que se pueden aprender

Técnicas centrales de Q-Former: no hacer que los tokens de texto de LLM se centren en los parches de imágenes, sino introducir un nuevo conjunto de 32 consultas que se pueden aprender Vector `Q`,并让*它们*关注图像补丁──这些查询是模型参数它们在训练期间学习,并且同一组 32查询用于每张图像──

                                                                                                                                                                                                                                                              

### Arquitectura

Q-Former es un transformador pequeño (~12 niveles, ~100M parámetros), tiene dos rutas:

1. Perguntas de ruta:32 个 query Vector 流经自注意(彼此之间), luego sobre el parche congelado de ViT Token hacer la atención cruzada, finalmente pasó FFN。
2. Camino de texto: un codificador de texto similar a BERT con el camino de consulta compartir autoatención y pesos FFN.

訓練時兩条路径都会运行──cuestiones 和文本通過共享自我注意 交互, esto significa que en las tareas de ITM、ITG, las preguntas pueden ser condicionadas a texto──VLM 交互的推論 阶段, sólo deja que las preguntas fluyan, generando 32 Token visuales──

### Formación en dos etapas

BLIP-2 分两阶段预训练:

Fase 1: aprendizaje de representación ((no LLM)──三种损失:
- ITC (imagen-texto contrastivo): contrastivo de estilo CLIP,作用于 pooled query Token 和 text CLS Token。
- ITM (imagen-texto coincidiendo):clasificador binario  这对图像-text 是否匹配?
- ITG (generación de texto basado en imágenes): Causal LM en el texto, en las consultas 为条件――迫使查询 编码可由文本生成的内容――

Sólo entrenar Q-Former。 ViT es congelado。 no LLM  participar。

Etapa 2: Aprendizaje generacional. Entra en un LLM congelado. A través de una pequeña capa lineal, realizará 32 consultas.

La fase 2 之后, Q-Former + proyección 就是完整的视觉适配器──Inferencia 时:image → ViT → Q-Former → linear project → 前置到文 → congelado LLM 发出输出──

### Economía de parámetros

BLIP-2 Utiliza ViT-g/14(1.1B, congelado) + OPT-6.7B(6.7B, congelado) + Q-Former(188M,entrenado) = 总计 8B, entrenamiento 188M。Q-Former 本身约为完整堆积 参数的 2.4%── entrenamiento costo también体现这一点:少量 A100 上训练数天,而不是结尾训练数周──

质量:BLIP-2 在零射VQA 上达到或超过 Flamingo-80B, simultáneamente体量小 50 倍──这个桥接有效──

### Instrucción BLIP y instrucción感知型 Q-Former

InstructBLIP (2023) Usó una extra entrada para ampliar Q-Former:instruction text 本身──在交叉注意时,查询 现在可以访问图像补丁和指示──查询可以根据指示 专门化("contar los coches"、"describir el estado de ánimo"), en lugar de aprender un solo resumen fijo──在完成的任务上基准 提升──

### MiniGPT-4 con enfoque solo con proyector

MiniGPT-4 mantiene Q-Former, pero sólo entrenar para producir proyección lineal, al mismo tiempo que concluye todas las demás partes.

### ¿Por qué LLaVA fue más simple?

LLaVA(2023,Ley 12.05) reemplazó a Q-Former con el MLP de 2 capas ordinario, proyectando cada parche de ViT en el espacio LLM  para 24x24 网格, cada imagen 576 个 Token, todo lo que entra en el LLM.

Para 2026, el campo de la aparición de la división de flujo: Q-Former en el presupuesto de Token  importantes escenarios retenidos 长视频、多图像; MLP proyector en cada Token

### Por el camino de la atención cruzada: Flamingo, este antepasado

Flamingo (Ley 12.04) Antes de BLIP-2, utilizó la misma atención cruzada, pero ocurre en cada capa congelada de LLM, en lugar de como un solo puente. BLIP-2 muestra que solo se puede comprimir a la capa de entrada, todavía valida.

### Los descendientes de 2026

- Previo:BLIP-2、InstructBLIP、MiniGPT-4, así como la mayoría de los casos en el presupuesto de Token 原因的视频语言模型──
- El modelo de percepción:Flamingo 的变体 (Leyón 12.04);La familia de los idiotas Eagle、OmniMAE──
- Proyector de MLP:LLaVA、LLaVA-NeXT、LLaVA-OneVision、Cambrian-1。
- Cuadro de atención:VILA、PaliGemma。

Cuatro personas están en vigor. El problema decisivo es si está limitado al presupuesto de los tokens, o si está limitado a la calidad por token.


```figure
modality-projection
```

## Usalo
`code/main.py`Construye una atención cruzada de estilo Q-Former:

1. 模拟 256 个 parche de imagen Token ((dim 128) 』
2. 实例化 32 个可学习的查询 (en inglés)
3. 运行 escalado-puntos-producto atención cruzada ((Q de consultas, K/V de parches)
4. 通过线性层 投影到 LLM-dim ((512) ⋅
5. 输出 32 个 LLM-ready visual Token──

Todas las matemáticas usan Python puro (~) para Vector (~) para usar bucles anidados (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~) (~ (~) (~) (~) (~) (~) (~) (~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

##  entregarlo
本课生成                       `outputs/skill-modality-bridge-picker.md` Proporcionar un objetivo VLM 配置(Vision encoder Token 数、LLM context budget、部署约束、质量目标), que se recomendará Q-Former vs MLP vs Perceiver resampler, y dará una breve razón así como una estimación de la cantidad de parámetros de cada tipo de puente。

##  ejercicios
1. Utiliza PyTorch                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

2. En la etapa 1 de BLIP-2, Q-Former 同时运行三种损失:ITC、ITM、ITG── con pseudo-código 写出每种的前进签名──¿cuál es el camino que necesita un codificador de texto 处于活跃?

3. Comparación de la cantidad: Q-Former(12 niveles,768 ocultos) vs proyector MLP de 2 niveles(1408 → 4096, dos niveles) ⋅ en qué gran escala de LLM arriba, 188M costos de Q-Former se reciben a través de la eficiencia de entrenamiento?

4. 阅读 BLIP-2 paper(arXiv:2301.12597) Sección 3.2, conocer Q-Former 如何初始化──explicar por qué desde la base BERT初始化(而不是随机初始化) se acelerará la recepción──

5. Por un video de 10 minutos, en 1 FPS 采样到60 ,计算每 Token 成本:(Q-Former → 32 tokens/frame) vs (MLP projector → 576 tokens/frame) ―― ¿cuál de ellos puede colocarse en la ventana de contexto de LLM de 128k-Token?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Q-Former | "Querying transformer" | 带有 32 个可学习 query Vector 的小型 transformer，对 frozen ViT features 做 cross-attend |
| Learnable queries | "Soft prompt for vision" | 一组固定参数，作为 cross-attention 的 query 侧；按模型学习，在所有输入之间共享 |
| Cross-attention | "Q from here, K/V from there" | query、key、value 来自不同来源的 Attention；queries 从 ViT patches 拉取信息的方式 |
| ITC | "Image-text contrastive" | 应用于 Q-Former pooled queries vs text CLS 的 CLIP-style loss |
| ITM | "Image-text matching" | 在 hard-negative-mined pairs 上的 binary classifier；迫使 queries 区分细粒度不匹配 |
| ITG | "Image-grounded text generation" | 文本以 queries 为条件生成时的 causal LM loss；迫使 queries 编码 text-decodable content |
| Two-stage pretraining | "Representation then generative" | Stage 1 单独训练 Q-Former（ITC/ITM/ITG）；Stage 2 接入 frozen LLM，并且只训练 projection + Q-Former |
| Frozen backbone | "Do not finetune" | vision encoder 和 LLM weights 固定；只训练 bridge |
| Projection head | "Linear to LLM dim" | 将 Q-Former 输出映射到 LLM Embedding dimension 的最终 linear layer |
| Perceiver resampler | "Flamingo's version" | 类似的 learnable-query cross-attention，由 Flamingo 在每一层使用，而不是作为单个 bridge |

## 延伸阅读
- [Li et al. — BLIP-2 (arXiv:2301.12597)](https://arxiv.org/abs/2301.12597)  papel central
- [Li et al. — BLIP (arXiv:2201.12086)](https://arxiv.org/abs/2201.12086) 使用 ITC/ITM/ITG 三件套的前身──
- [Li et al. — ALBEF (arXiv:2107.07651)](https://arxiv.org/abs/2107.07651) "align antes de fusión"  etapa 1 de entrenamiento concept ancestral
- [Dai et al. — InstructBLIP (arXiv:2305.06500)](https://arxiv.org/abs/2305.06500) instrucción-consciente Q-Former。
- [Zhu et al. — MiniGPT-4 (arXiv:2304.10592)](https://arxiv.org/abs/2304.10592)  仅投影仪的方法──
- [Jaegle et al. — Perceiver IO (arXiv:2107.14795)](https://arxiv.org/abs/2107.14795) La estructura general de la atención cruzada de las preguntas de aprendizaje.
