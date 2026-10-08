# Cameleón y modelos multimodal de tokens de fusión temprana

> Hasta ahora, cada VLM que hemos visto ha tratado imágenes y textos separadamente. Tokens de visión de un codificador de visión, flujo en un proyector, luego en el LLM  interno con el texto en encuentro.

**类型：**Construir
**语言：**Python(stdlib, tokenizer VQ-VAE + decodificador entrelazado)
**先修：**Fase 12 · 05, Fase 8 (IA generativa)
**时间：** 180 minutos

## El objetivo del aprendizaje

- 解释为什么共享词汇+单损会改变模型能力──
- describir VQ-VAE cómo hacer que la imagen sea Tokenized 成与Transformer siguiente token objetivo 兼容的离散序列──
- Cuál es el método de entrenamiento de Caméleo?
- Comparar el método Q-Former de Chameleon con BLIP-2, y describir sus respectivos escenarios adecuados.

##  problemas

基于适配器的VLM(LLaVA、BLIP-2、Qwen-VL)把文本和图像当作两种不同的东西──文本代码 经过 文本代码 经过 文本代码 经过 文本代码 经过 文本代码 经过 文本代码 经过 文本代码 经过 文本代码 经过 文本代码 经过 文本代码 经过 文本代码 经过 文本代码 经过 文本代码 经过 文本代码 经过 文本代码 经过 文本代码 经过 文本代码 经过 文本代码 经过 文本代码 经过 文本代码 文本代码 文本 文本 经过 文本 文本 文本 文本 文本 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 `embed(text_token)`- ¿Qué pasa ?`visual_encoder(image) → projector → ... pseudo_tokens` El modelo tiene dos vías de entrada y en medio de ellas se combina.

Tres resultados:

1. LLM sólo puede consumir imágenes, no puede exportar imágenes.
2. 混合模态文档 (ex: 文章中段落和图像交换出现) muy diferente: usted quiere en el modelo externo resolver Multimodal 输入, usted quiere串联多次生成──
3. Se encuentra en diferentes áreas del espacio oculto, causando pequeños problemas de equilibrio.

Camelón  rechazó este supuesto: imágenes simplemente provienen de la distribución de palabras 序列.

## 概念

### VQ-VAE  como el Tokenizer de imágenes

Este tokenizer es un autoencoder de variación cuantizada por vectores.

- Encodrador:CNN + ViT, se proyectará la imagen para el mapa de características espaciales, por ejemplo 32x32 个 dim 为 256 的特征――
- Codificación: una aprendizaje obtenido de K 个 Vector 的词表(Chameleon 使用 8192), igual dim 为 256。
- Cuantización: para cada característica espacial, a través de la distancia L2 查找最近的代码簿入口──用整数指数 替换连续特征──
- Descodificador:CNN, se cuantificarán las características 转回像素──

訓練:VAE reconstrucción pérdida + pérdida de compromiso + pérdida de código de libros;; índices de código de libros 构成图像的离散字母──

Para Chameleon para decir:一张图像变成32*32 = 1024 个标签, 来源大小为8192 的词表──与文本 Token( 来源 LLM 的 BPE 词表,例如 32000)拼接──最终词表:40192──Transformer 看到的是一个序列、一个损失──

### 共享词表

Chameleon's word list 文本 图像 Token 和模态分隔符── cada token tiene un solo ID──输入 Embedding layer把 cada ID 映射到D-dim hidden Vector──输出投影把 hidden 映射回语音 logits──Softmax 下选择一个 token, no importa a qué modelo pertenezca──

Es muy importante .`<image>`Y `</image>`标签包住图像 Token 序列──生成时,如果模型输出 `<image>`, el software ya sabe que los siguientes 1024 Tokens es para enviar a un decodificador para realizar la imagen de la infección de índices VQ.

### 混合模态生成

Inferencia es una predicción de la próxima señal en el lenguaje de la comunidad. Ejemplo de la solicitud:"Diseñar un gato y describirlo".

```
<image> 4821 1029 2891 ... (1024 image tokens) </image>
The cat is orange, sitting on a windowsill...
```

模型自主选择序:它可能先生成图像再生成文本,先生成文本再生成图像,或交错生成── el mismo decodificador, la misma pérdida──

En comparación, la generación del adaptador VLM se limita al texto.

### 训练稳定性:QK-Norm  dropout  LayerNorm ordenando

El entrenamiento de fusión temprana en gran escala no está estable.

- QK-Norm──在 Atención 内部, para la consulta y la proyección clave, primero aplicar LayerNorm, volver a hacer punto de producto── prevenir la magnitud de logit en la red profunda 爆──多多2024年后大模型都使用它──
- Colocación de abandono. Después de cada adición residual, se aplica abandono, no sólo atención y MLP. Después de que el Gradiente de Token de imagen pueda dominar, se necesita una regulación más fuerte.
- LayerNorm ordening──Razado rama 上使用 Pre-LN(standard做法), re en el último bloque de la conexión de salto 上额外加一个LN──稳定最后层的渐进流──

 sin estos hábitos,34B-param Camelón  entrenamiento en varios puntos de control 发散── después de tener estos hábitos, entrenamiento puede recibir── entrenamiento receta y la estructura en sí misma tan importante──

### Tokenizer de la reconstrucción

VQ-VAE es un error. En 8192 entradas de códigos, cada uno de los 512x512 imágenes se ha configurado para 1024 tokens, reedificando la PSNR hasta 26-28 dB. Esto es suficiente para generar imágenes identificables, pero claramente no es así como la difusión continua del espacio.

El tokenizer es un botelón. Un mejor tokenizer. (Magvit-v2、IBQ、SBER-MoVQGAN) se elevará a la cima.

### Cameleón vs BLIP-2 / LLaVA

Cameleón ([[Fusión temprana]],共享词表):
- Una pérdida, un decodificador.
- Productos de producción y producción
- El tokenizer es la calidad de la cantidad.
- 成本高:caminada de inferencia 上每张生成图像都需要VQ-VAE decoder。

BLIP-2 / LLaVA ((fusión tardía, separándose de las torres):
- 视觉输入, sólo puede exportar texto.
- 复用 pre-entrenado LLM。
- Comprender tareas no tiene Tokenizer.
- 便宜:单次前行: pase de viaje hacia adelante

按任务选择── Si necesitas imágenes generadas, escoge la familia Caméleo── si sólo necesitas entender, adaptador-VLM más sencillo, y volver a usar más computación pre-entrenada──

### Fuyu y AnyGPT

Fuyu(Adept,2023) es un método relacionado: completamente saltó un codificador de visión individual, puso parches de imágenes originales 像 Token 一样送入 LLM's input projection, no utiliza Tokenizer──比 Chameleon 更简单, pero perdió la capacidad de expresión compartida 输出生成──

AnyGPT(Zhan et al., 2024) ha extendido el Camelón a cuatro modalidades:文本、图像、语音、音乐──每种模态都使用相同的VQ-VAE 技巧,共享变革器──Any-to-any generation──LECCIÓN 12.16 中会进一步介绍──


```figure
vq-codebook
```

## Usalo

`code/main.py`Construye un modelo de fusión temprana de extremo a extremo de juguete:

- Un cuantificador de estilo VQ-VAE muy pequeño, coloca parches 8x8 映射到代码簿指数(K=16)。
- Una palabra compartida, de un texto de identificación 0..31) + de una imagen de identificación 32..47) + de un separador 48, 49)
- Un juguete autoregresivamente decodificador (bigram table), en sintetizado captura + secuencias de imágenes-token 上训练。
- Un bucle de muestreo, dado un prompt 后输出交换的文本 + 图像 Token。

代码有意让变体极小(bigrams), así que puedes seguir el flujo de señal de cabeza a final.

##  entregarlo

本课产 出  `outputs/skill-tokenizer-vs-adapter-picker.md` Específico de producto determinado (sólo se entiende frente a entender + 生成、 需图像质量、成本预算), se hace una elección entre la familia Chameleon (la primera fusión) y la familia LLaVA (la última fusión), y se utiliza la experiencia en la medida de la razón.

##  ejercicios

1. Camelón utiliza K=8192 个代码簿入口,每张 512x512 图像 1024 个代码──估算对24bit RGB 图像的压缩比──¿Es lo que está pasando? ¿Hay más que pasar?

2. ¿Cuántas imágenes se producen en la misma densidad de VQ-VAE? ¿Cómo puede un modelo de estilo camaleón generar una imagen en 4K en una sola llamada de inferencia? ¿El primer problema que surge es el contexto? ¿El tokenizer?

3. Utilice Python para implementar la norma QK. Dedicar una consulta y clave de 64 dimensiones, mostrando el producto punto de la norma Layer. ¿Por qué es importante el control de magnitud en la red profunda?

4. 阅读Chameleon Section 2.3 中关于训练稳定性的内容――描述论文 observado 34B 模型在没有QK-Norma 时的确定的失败模式――"explosión norma" ¿Cuáles son las características?

5.  Extensión del decodificador de juguete, haciendo que sea en un texto determinado en un momento de respuesta                                                                                                                                                                                                                                                   

## 关键术语: "El hombre es un hombre"

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| Early fusion | "Unified tokens" | 图像从第一步起就被转换为离散 Token，并共享 Transformer 的词表 |
| VQ-VAE | "Image tokenizer" | CNN + ViT + codebook，将图像映射为 Transformer 可预测的整数 indices |
| Shared vocabulary | "One dictionary" | 覆盖文本 + 图像 + 模态分隔符的单一 Token ID 空间 |
| QK-Norm | "Attention stabilizer" | 在 query 和 key 做 dot product 之前对它们应用 LayerNorm，防止 norm blowup |
| Mixed-modality generation | "Text + image output" | 一次 pass 中自主生成交错文本和图像 Token 的 inference |
| Codebook size | "K entries" | VQ-VAE 可 quantize 到的离散 Vector 数量；在压缩率和 fidelity 之间权衡 |
| Tokenizer ceiling | "Reconstruction limit" | 解码 VQ Token 能达到的最佳 PSNR；限制模型的图像质量 |

## 延伸阅读

- [Chameleon Team — Chameleon: Mixed-Modal Early-Fusion Foundation Models (arXiv:2405.09818)](https://arxiv.org/abs/2405.09818)
- [Aghajanyan et al. — CM3 (arXiv:2201.07520)](https://arxiv.org/abs/2201.07520)
- [Yu et al. — CM3Leon (arXiv:2309.02591)](https://arxiv.org/abs/2309.02591)
- [Zhan et al. — AnyGPT (arXiv:2402.12226)](https://arxiv.org/abs/2402.12226)
- [Adept — Fuyu-8B blog (adept.ai)](https://www.adept.ai/blog/fuyu-8b)
