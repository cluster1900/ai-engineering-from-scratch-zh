# Show-o 和 Discreto-Difusión 统一模型

> Transfusión 混合连续和离散表示──Show-o(Xie et al., 2024 年 8 月)走的是另一条路:text tokens 使用因果下代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代

**Type:** Learn
**Languages:** Python (stdlib, masked-discrete-diffusion sampler)
**Prerequisites:** Phase 12 · 13 (Transfusion)
**Time:** ~120 minutes

## El objetivo del aprendizaje
- 解释 mascarado Discrete Diffusion:一种先均 mask Tokens、再让 Transformer 恢复它们的时间表──
- Desde velocidad y calidad en comparación con la descodificación de imágenes (Show-o, MaskGIT) con la descodificación de imágenes autoregresivas (Chameleon, Emu3):
- Exposición de Show-o en un puesto de control en el centro de tratamiento de tres clases de tareas: T2I, VQA, pintura de imágenes.
- 选择一种掩盖时间表 ((kosine、线性、 troncated),并推理它对样品质量的影响──

##  problemas
La transmisión de dos pérdidas  entrenamiento eficaz, pero dinámica 更棘手:Continuous Diffusion Loss con discreto NTP Loss 位于 diferentes valores de la medida.

La respuesta de Show-o es: mantener dos modalidades están separadas, pero a través de una difusión discreta enmascarada y generar imágenes, en lugar de generar secuencias. El objetivo de entrenamiento se convierte en una sola predicción de tokens enmascarados, que naturalmente generaliza la predicción de tokens siguientes.

## 概念
### Difusión discreta enmascarada (MaskGIT)

Original Chang et al. (2022) 技巧 MaskGIT 技巧很优雅── desde una imagen totalmente enmascarada 开始( cada token 都是特殊的 `<MASK>`en cada paso,并行预测所有蒙面的代币,然后保留顶-K 个置信度最高的预测,并重新掩盖其余部分──大约8-16次代后, todos los tokens fueron llenados完成──每一步揭开多少代币的时间表 需要调优,可سین时间表 效果很好──

训练很简单: desde [0, 1] en media 采样一个掩饰比,将其应用到图像的VQ代币上,训练变压器 恢复被掩饰的部分──这是BERT haciendo cosas con texto, simplemente se expandió a la generación de imágenes──

### Show-o: un Transformer, máscara híbrida

Show-o 将 MaskGIT 放进因果语言模型变压器──Máscara de atención 如下:

- Los signos de texto:causal (standard LLM)
- Tokens de imagen: en el bloque de imagen dentro totalmente bidireccional( así enmascarados Tokens 在预测时可以看到所有其他图像 Tokens)。
- Texto a imagen: texto asiste hasta las imágenes anteriores, imagen asiste hasta el texto anterior.

訓練在以下任务之间交换:
1. NTP estándar en la secuencia de texto.
2. T2I 样本:text → image, use masked image tokens 和 masked-token-prediction Loss。
3. VQA 样本:imagen → texto, uso de tokens de texto enmascarados(本质上就是 NTP) ⋅

统一 Perdida es `<MASK>`Tokens 上的交叉 Entropia, que a la vez cubre el texto NTP(sólo el último Token fue mascarado) y la imagen enmascarada-difusión(随机子集被掩饰)

### Muestreo paralelo

Show-o utiliza aproximadamente 16 pasos para generar una imagen, en lugar de aproximadamente 1000 pasos (cada token autoregresivamente) o aproximadamente 20 pasos (difusión) ⋅ en cada paso,并行预测所有蒙面的代币;提交 top-K 高置信度代币;重复──

En comparación:
- Cameleón / Emu3(对 Tokens autoregressive):N_tokens 次 前行,通常每张图 1024-4096 次。
- Transfusión: aproximadamente 20 pasos, cada paso una vez completo Transformer pase.
- Exposición de difusión discreta enmascarada: aproximadamente 16 pasos, cada paso una vez completo Transformer pase.

En el modelo de tamaño más cercano, Show-o es más rápido que el camaleón; es más similar a la cantidad de pasos de transfusión, mientras que el costo de cada paso es más bajo.

### tareas en un solo puesto de control

Show-o en el tiempo de la propuesta de apoyo cuatro clases de tareas, por formato de solicitud  seleccionar:

- Generación de texto: estándar de salida de texto autoregresista.
- VQA:imagen en, mensaje de texto fuera.
- T2I:texto en, a través de la difusión discreta enmascarada 输出 imagen。
- Pintura:输入带有部分 Enmascarado Tokens de imagen,并填充──

Envasado  capacidad proviene de la predicción enmascarada  entrenamiento, casi es gratis.

### Programa de enmascaramiento

Cada paso desmascarar Más Menores Tokens de la agenda 会塑造质量──Show-o 推 cosine:

```
mask_ratio(t) = cos(pi * t / (2 * T))   # t = 0..T
```

第 0 步, todos los Tokens fueron enmascarados(ratio 1.0)。第 T 步, no hay Tokens fueron enmascarados。Cosine se concentrará en las relaciones entre las zonas, donde se prevé la mayor cantidad de información。Los horarios lineales también son disponibles, pero más rápidamente entran en la meseta。

### El programa de trabajo

Show-o2(2025 seguimiento, arXiv 2506.15564) expandió Show-o: mayor base de LLM, mejor Tokenizer, mejor programa de máscaras, arquitectura y modelo es igual.

### Donde se sienta Show-o

En la taxonomía de 2026 En:

- Tokens discretos + NTP:Chameleon、Emu3──简单但推理慢──
- Tokens discretos + difusión enmascarada:Show-o、MaskGIT、LlamaGen、Muse。并行采样, pero todavía recibe pérdidas de Tokenizer 限制。
- Continuo + Difusión:Transfusión,MMDiT,DiT,
- Continuo + flujo de coincidencia en un VLM:JanusFlow、InternVL-U──最新路线──

按任务选择:当你想在一个开放模型中同时获得T2I + inpainting + VQA,并且速度合理时,选择 Show-o;当质量最重要且你能承担两损管道时,选择转.


```figure
masked-diffusion-unmask
```

## Usalo
`code/main.py`模拟 Muestreo de muestra:

- Una cuadrícula de juguetes que contiene 16 tokens VQ.
- Una simulación de Transformer, se basa en el prompt 和当前 desenmascarados Tokens 预测 logits。
- Utiliza el calendario cosino hacer 8 pasos并行 muestreo enmascarado。
- 打印中间状态(mascaras de patrón evolución) y Tokens finales。

¿Cómo se puede hacer esto?

##  entregarlo
本课产 出  `outputs/skill-unified-gen-model-picker.md`△给定一个既需要理解(VQA, subtítulo) 又需要一代(T2I, inpainting) de productos, y también tiene un peso abierto 约束, se desarrollará en la familia Show-o、Transfusion/MMDiT familia 和 Emu3 / familia Cameleon 之间做选择,并给出具体 trade-offs──

##  ejercicios
1. Disfusión discreta enmascarada en aproximadamente 16 pasos completando la muestra. ¿Por qué no 1 paso?

2. Uso de difusión enmascarada 时,intallación 几乎是免费的──提出一个产品用例(真实或假设),其中 Show-o de la pintura 胜过专业模型──

3. Calendario cosino vs calendario lineal: seguimiento T=8 时 cada paso número de Tokens desmascarados―¿cuál es el mejor equilibrio?

4. Una imagen de 512x512 es 1024 Tokens. En la vocab K=16384 时, modelo输出 1024 * log2(16384) = 14,336 bits (aproximadamente 1,75 KiB) de datos.

5. 阅读 LlamaGen(arXiv:2406.06525) ―― ¿Qué diferencia hay entre el modelo de imagen autoregresista con condiciones de clase de LlamaGen y el enfoque enmascarado de Show-o?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Masked discrete diffusion | “MaskGIT-style” | 训练模型预测 masked Tokens；推理时，迭代式 unmask 置信度最高的预测 |
| Cosine schedule | “Unmask schedule” | mask ratio 随推理步数衰减；将置信度增长集中在中间区间 |
| Parallel decoding | “All tokens at once” | 每一步用一次 forward pass 预测完整的 masked Token 序列，然后提交 top-K |
| Hybrid attention | “Causal + bidirectional” | 一种 mask：对 text tokens 是 causal，在 image blocks 内是 bidirectional |
| Inpainting | “Fill-in generation” | 以部分 Tokens 被 masked 的 image 为条件，预测缺失部分；从训练目标中免费获得 |
| Commitment rate | “Top-K per step” | 每次迭代中有多少 Tokens 被声明为“完成”；控制推理与质量的 trade-off |

## 延伸阅读
- [Xie et al. — Show-o (arXiv:2408.12528)](https://arxiv.org/abs/2408.12528)
- [Show-o2 (arXiv:2506.15564)](https://arxiv.org/abs/2506.15564)
- [Chang et al. — MaskGIT (arXiv:2202.04200)](https://arxiv.org/abs/2202.04200)
- [Sun et al. — LlamaGen (arXiv:2406.06525)](https://arxiv.org/abs/2406.06525)
- [Chang et al. — Muse (arXiv:2301.00704)](https://arxiv.org/abs/2301.00704)
