# LLaVA-OneVision: una sola imagen en un modelo, varias imágenes y videos

> En LLaVA-OneVision, Li et al., agosto de 2024, se inauguró el VLM World has a una gama de modelos separados entre sí: para modelos de imágenes únicas LLaVA-1.5, como Mantis y VILA, así como modelos de imágenes múltiples, como Video-LLaVA y Video-LLaMA. Cada uno ganó su propio punto de referencia, pero fracasó en otros escenarios.

**Type:** Build
**Languages:** Python (stdlib, token budget solver + curriculum planner)
**Prerequisites:** Phase 12 · 05 (LLaVA), Phase 12 · 06 (any-resolution)
**Time:** ~180 minutes

## El objetivo del aprendizaje
-  diseñar una en un solo retrato 多图像和视频输入之间保持恒定视觉代币 预算。
- 排列一个训练课程, hacer que las habilidades de un solo retrato se transfieran al video, al mismo tiempo que evitan el olvido catastrófico.
- Explica por qué, bajo la misma escala de parámetros, si el plan de estudios se hace correctamente, un modelo único ganará al modelo especialista.
- Explicar las tres capacidades emergentes de LLaVA-OneVision  informes: razonamiento multi-camera Promulgación de marcas Agent de capturas de pantalla del iPhone

##  problemas
图像、多图像和视频将以不同的方式给模型施压──

单图像需要高分辨率 Token ((AnyRes,约2880 视觉代币) para capturar OCR 和细节──每个样本的预算:1张图像,2880 视觉代币──

Muchos ejemplos necesitan una gran cantidad de ejemplos de resolución media (~ 576 Tokens) para poder ponerlos en contexto.

视频需要许多低分辨率(pooling 后每约196 代币) para capturar el tiempo de la actividad──每样本的预算:8-32 ,每 196 代币,总计1600-6200 代币──

Si entrenas varios modelos independientes, elegirás un presupuesto para cada modelo. Si entrenas un modelo, necesitas que el presupuesto se reduzca razonablemente entre diferentes escenarios, sin poder explotar el contexto.

En OneVision  previo, la respuesta está en que entrenar una escena, ignorar otras escenarias ∙∙ Video-LLaVA  mediante un extra entrenamiento de la etapa de transformar la capacidad de vídeo en un modelo de imagen ∙ LLaVA-NEXT  mediante el mosaico                                                                                                                                                                                                                                                                                                                                                                                                                                                          

## 概念
### Token de OneVision  presupuesto

LLaVA-OneVision  seleccionó un conjunto de tokens de visión  presupuesto, cada muestra de aproximadamente 3000-4000 tokens, y distribuido según las diferentes situaciones:

- 单图像:AnyRes-9(3x3 azulejos + miniatura), cada azulejo es 384, contiene 729 parches, uso de un pooling bilinear de 2x2 activado → Cada azulejo 182 个 Token。总计:9 * 182 + 182 = 1820 个 Token。或 AnyRes-4, cada azulejo 729 个 Token = 2916 + 729。
- Más imágenes: por cada imagen uso en la resolución media (en inglés)
- 视频:32 ,384 分辨率,使用激进的 3x3 bilinear pool → 每 81 个代币──总计:32 * 81 = 2592 个代币──

Esta distribución hace que el total de tokens número de grandes cantidades se mantenga constante. LLM nunca verá el lote de contexto de la explosión.

### Tres fases del currículo

LLaVA-OneVision dividido en tres fases de entrenamiento:

1. 单图像 SFT(estadio SI) ∼ Todos los datos son de una sola imagen-más-texto── utilizar alta resolución AnyRes 输入训练──这会教会模型感知、OCR 和细粒度理解── usar LLaVA-NeXT 数据加上 OneVision-specific 单图像数据──
2. OneVision SFT(estadio OV)。混合单图像 + 多图像 + 视频(均采样)。在统一代币 预算上训练。这会教会模型处理异构批形──不重置权重,而是从阶段 SI 继续──
3. Traslado de tareas (Tase TT) ⋅ Continuar utilizando el conjunto de tareas objetivo, normalmente en función de los productos que requieren de imágenes o vídeos ⋅

关键点:curriculum 顺序很重要── incluso si se utilizan los mismos datos, primero se entrenan vídeos o primero se entrenan varias imágenes, también se obtendrán mejores rendimientos de imágenes que si se entrenan imágenes únicas──论文明确实做了这一消融──

### ¿Por qué el plan de estudios es eficaz

单图像训练建立感知基础──Patch Token 携带细粒度视觉特征;LLM 学会把它们与文本整合──多图像和视频引入结构性挑战(哪张图像是哪张,什么先发生), si no hay una fuerte base de percepción, estos retos son difíciles de aprender──

Si comenzamos a mezclar todos los escenarios desde cero, el modelo no estará preparado para percibirse, pero el modelo puede seguirse a través de imágenes, pero el concepto visual no es adecuado.

El plan de estudios  orden te hace obtener la intensidad de percepción de la etapa SI  y de la etapa OV  obtener la capacidad de la combinación/ tiempo de la capacidad de la evaluación, al mismo tiempo que no pierdes ningún lado 

### 跨场景 habilidades emergentes

El artículo LLaVA-OneVision informa sobre tres capacidades emergentes:

1. El razonamiento de varias cámaras. Se trata de un proceso de formación en el que se requiere comprender una escena de conducción con varias cámaras.
2. Petición de marcas de conjunto. Usuario con números de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de marcas de mar
3. El usuario proporciona una imagen de pantalla de iPhone, y requiere planificar la próxima vez.

Estos no son tareas de entrenamiento; surgieron de la estructura de la combinación del currículo.

### 视觉 Compilación de tokens

Token  presupuesto necesita de agrupación. OneVision en 2D parche de la red 上 utilizar interpolación bilinear:24x24 = 576 个 parche 变成 12x12 = 144(2x factor) o 8x8 = 64(3x factor) ―― Pooling en parche-grid 空间完成, y no en Token 空间完成, para conservar la局部性。

Cada escenario de un factor de agrupación  seleccion en sí mismo es un hiperparámetro ⋅ menos agrupación = 更多 Token = 更丰富的表示──更多 agrupación = 更少 Token = 能放入更多/图像──

### LLaVA-OneVision-1.5

La versión siguiente de 2025 (((LaVA-OneVision-1.5,arXiv 2509.23661) en el entrenamiento de datos, el peso del modelo y el código son completamente abiertos── en algunos puntos de referencia se ha reducido la diferencia con el modelo propietario, y hace que esta configuración sea más democrática── el mismo currículo, más datos, mejor base LLM── no hay cambios de estructura──

### Con respecto a Qwen2.5-VL

Qwen2.5-VL(Lección 12.09) hizo diferentes opciones. Utiliza M-RoPE y FPS dinámico, en lugar de un pooling fijo. Su presupuesto se compone con un input reducido: 1 分钟视频使用的代币比 5 秒视频更多.


```figure
l5-onevision-budget
```

## Usalo
`code/main.py`Es un programa de estudios y un planificador de presupuesto de VLM de estilo OneVision.

- Para cada escenario, la resolución de la distribución del factor de agrupación y los marcos.
- Chequear si cada caso está dentro del presupuesto compartido ⋅
- 报告预期 Token 数量、LLM FLOPs, así como qué escenarios están sub-tokenados―
- 打印逐阶段训练计划──

Usalo para planificar la perfección de OneVision o hacer un control de cordura de cada solicitud de la VLM.

##  entregarlo
本课会产出                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `outputs/skill-onevision-budget-planner.md` Dado el objetivo de la distribución de tareas y el presupuesto de cada muestra, se producirá cualquier factor de Res, por marco de agrupación, vídeo y el número de niveles del currículo.

##  ejercicios
1. Su producto soporta el 80% 单图像、10% 多图像(2-4 张图像)、10% 视频(8-16 ) ・・・ diseño Token 预算──由于 no hace peso en muchas imágenes y la provincia extra presupuesto, ¿dónde lo pondrá?

2. 阅读 LLaVA-OneVision Sección 4.3 capacidades emergentes  Proponer un plan de estudios posible de desbloqueo  pero el trabajo no informa sobre la cuarta clase de habilidades emergentes

3.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

4. ¿Puede esto ampliarse a 30 segundos de video de tiempo de cálculo? ¿La primera pregunta que surge es el presupuesto de token o el tiempo de cálculo?

5. Para realizar el pooling, utilizar Python para lograr el pooling, y comprobar el promedio de cada bloque de 2x2 con el bilinear output match.

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| OneVision scenario | “单图像、多图像，或视频” | 统一 VLM 处理的三种输入 shape 之一；预算在三者之间保持恒定 |
| Token budget | “每个样本多少 Token” | LLM 在每个训练/推理样本中看到的视觉 Token 总数，通常为 3000-4000 |
| Curriculum | “训练顺序” | 为了 emergent transfer 而选择的阶段排序（单图像 → 多图像 → 视频） |
| Bilinear pooling | “Token 缩减” | 对 patch grid（2D）应用 bilinear interpolation，以在保留局部性的同时减少 Token 数量 |
| Emergent skill | “没训练过，但仍然能用” | 由于 curriculum composition，在没有匹配训练数据的情况下于推理时出现的能力 |
| AnyRes-k | “k-tile setup” | k 个固定分辨率子 tile 加一个 thumbnail，典型 k ∈ {4, 9} |
| Task transfer | “跨场景泛化” | 在单图像上学到的技能，通过共享 backbone 应用于视频（反之亦然） |

## 延伸阅读
- [Li et al. — LLaVA-OneVision (arXiv:2408.03326)](https://arxiv.org/abs/2408.03326)
- [LLaVA-OneVision-1.5: Fully Open Framework (arXiv:2509.23661)](https://arxiv.org/abs/2509.23661)
- [Lin et al. — Video-LLaVA (arXiv:2311.10122)](https://arxiv.org/abs/2311.10122)
- [Lin et al. — VILA (arXiv:2312.07533)](https://arxiv.org/abs/2312.07533)
- [Wang et al. — Qwen2-VL (arXiv:2409.12191)](https://arxiv.org/abs/2409.12191)
