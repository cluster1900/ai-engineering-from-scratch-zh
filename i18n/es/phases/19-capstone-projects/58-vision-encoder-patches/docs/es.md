# 视觉编码器 Parches

> 读取像素的视觉模型需要像素分词器──补丁嵌入就是那分词器──将图像切割成正方形网格,展平每正方形,投影到线性层,然后添加2D 位置信号,以便Transformer知道每正方形在原始图像中的位置──

**Type:** Build
**Languages:** Python
**Prerequisites:** 第19期第30-37课（B轨基础）
**Time:** ~90 分钟

## El objetivo del aprendizaje

- Convertir la imagen en un conjunto de correcciones de longitud fija.
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `Conv2d`La imagen de la imagen se corresponde con la matemática de la imagen.
- 构建确定性 2D 正弦位置嵌入, para que se haga un orden de codificación de la posición espacial。
- 验证 sintesis fijo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `Conv2d`/展开等效性── también se puede decir que el

##  problemas

Transformer 接收一系列向量──图像是一个3通道网格──将每个像素作为代码读取导致序列长度爆炸:224x224 RGB 图像是150,528个代码,这是12层Transformer 无法承受──将图像读取为一个巨大的平面向量会丢弃局部性,而注意层无法从中恢复──编码器前端的工作是将像素网格压缩为数百代码,每个代码概括一个正方形区域──

补丁嵌入通过一个线性投影解决了这个问题──将224x224 图像切割成16x16块会生成包含196 块的14x14 网格──每补丁都从`(3, 16, 16) = 768`像素值展平为一个向量, luego la capa lineal se proyecta en la dimensión oculta del modelo.`hidden`(normalmente para 768) el token se suma a un token CLS. Este es el secuencia del resto de la red que se puede tomar de préstamo.

## 概念

```mermaid
flowchart LR
  Image[224x224x3 image] --> Cut[cut into 16x16 patches]
  Cut --> Grid[14x14 grid of patches]
  Grid --> Flatten[flatten each patch]
  Flatten --> Proj[linear projection]
  Proj --> Tokens[196 tokens of dim hidden]
  Tokens --> Pos[add 2D sinusoidal position]
  Pos --> Out[final token sequence]
```

### ¿Por qué es un complemento, y no una imagen?

Atención es la segunda cuadra de la longitud de la secuencia. 196 tokens de la secuencia por nivel por precio.`196 * 196 = 38,416`Nota: el costo de la secuencia de tokens es de 150.528`150,528 * 150,528 = 22.6 billion` El complemento puede reducir la cantidad de atención en el cálculo 590.000 veces, y una sola región 16x16 puede soportar suficientes señales para ejecutar tareas de visión avanzada.

### ¿Por qué la proyección de línea es suficiente?

Cada complemento se considera como un espectro independiente.`768 * 768 = 589,824`参数) y la velocidad de entrenamiento es muy rápida. Existe un volumen más profundo de los rodillos, pero la proyección lineal plana es estándar, y la mayoría de los ordenadores modernos de peso abierto tienen esta forma precisa.

### `Conv2d`技巧

 No hay relleno `Conv2d(in_channels=3, out_channels=hidden, kernel_size=patch_size, stride=patch_size)`√ Da el mismo resultado numérico que el de un desenlace y luego lineal, ya que cada posición de salida realizará un punto de acumulación de imágenes complementarias con un 波器. √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ 

###  Posiciones de inserción

Los tokens no llevan ningún orden fuera de la proyección. Los 2D cuerdas encapsuladas para cada token proporcionan una señal fija para codificarla.`(row, col)`位置── emplazado de dimensión: la mitad de la dimensión se emplea para codificar la posición de la línea con un cuadro de cuerdas/cuerdas en múltiples frecuencias; la otra mitad codifica la posición de la columna── codificación es de determinación, por lo que puede intercambiar resolución sin necesidad de volver a entrenar, y puede colocar de forma precisa el valor en el modelo de la red nunca antes visto en el entrenamiento──

|组件|形状|参数|
|-----------|-------|------------|
|补丁投影（`Conv2d`）| `(hidden, 3, patch, patch)` | `3 * P * P * hidden + hidden` |
|位置嵌入（固定）| `(num_patches, hidden)` | 0（计算，未学习）|
| CLS token（已学习）| `(1, hidden)` | `hidden` |

对于 224 分辨率的 ViT-Base/16:投影中有590,592 参数,CLS token中有768 参数,正弦位置为零──下一课 (59) 在该前端顶部堆叠一个12层变压器──

### ), como equivalencia de los controles de salud

补丁步骤 tiene dos tipos de letra:`Conv2d`La proyección y la expresión se desarrollan y luego lineal. Tienen que producir la misma salida con el mismo peso. Si no lo hacen, entonces la matemática se desarrolla erróneamente, el resto del codificador se basa en la arena.


```figure
ch-patch-tokenizer
```

## Construirlo

`code/main.py` realización:

- `PatchEmbed`¿ Qué ?`nn.Module`包装                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `Conv2d`Usado para la proyección de corrección.
- `sinusoidal_2d(grid_h, grid_w, dim)`, una función de estado sin estado de la tabla de posición 2D construida.
- `VisionFrontEnd`, se incorporará el complemento, CLS preimposición y la posición de añadida de la combinación hasta una vez en el transcurso de la transmisión.
- Una de ellas .`synthesize_image(seed)`ayudante, puede`numpy.random`构建确定性 224x224x3 fijo
- Una demostración, a través de un codificador front-end 运行一张 fixture 图像,并印出形状、CLS token 范数和一行位置嵌入──

¿Qué es eso ?

```bash
python3 code/main.py
```

输出: 24x224 fijación codificada en forma `(1, 197, 768)`La primera señal es CLS; las siguientes 196 son símbolos de corrección.

## Usalo

Paralelamente, el mismo complemento se encuentra en cada modelo de lenguaje moderno: CLIP ViT-L/14、SigLIP、DINOv2、Qwen-VL 系列和InternVL 堆都从`Conv2d`补丁投影加上位置信号开始──下游各系列之间的差异(CLS y sin CLS 池化、注册代币、 diferentes补丁大小 14 y 16、 mediante inserción de posición realizar una resolución dinámica)──

## 测试

`code/test_main.py`Cobre:

-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `(image_size / patch_size) ** 2`
- 输出形状匹配 输出形状匹配 输出形状匹配 输出形状匹配 输出形状匹配 输出形状匹配 输出形状匹配 输出形状匹配 输出形状匹配 输出形形形形形形匹配 输出形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形形`(batch, num_patches + 1, hidden)`
- `Conv2d`La proyección es como una fijación pequeña, que se desarrolla a mano y luego se proyecta en línea.
- La posición de la cuerda es determinada entre las reglas
- El token CLS se transmite sin que se escape

¿Qué es eso?

```bash
python3 -m unittest code/test_main.py
```

##  ejercicios

1. Usando para aprender`nn.Parameter`换正弦位置,并比较小综合分类任务的第一纪元损失;; la posición de aprendizaje con resolución fija gana; cuando usted cambia la resolución después del entrenamiento, la curva de los cuerpos de la cuerda gana;;

2. ¿ Qué ?`Conv2d`替换为显式    sustitución por`nn.Unfold`¡ Qué !`nn.Linear`,并断言输出匹配在浮动容量差范围内── igual matemática, hay dos tipos de métodos de escritura──

3. Añadir un gran soporte a los complementos de forma no cuadrada (por ejemplo, la pantalla ancha tiene 32x16), y verificar la posición de la pantalla de tratamiento de la red de forma no cuadrada.

4. En el análisis de la cantidad de 1⁄8⁄64 补丁步骤──补丁投投影很少是瓶; la atención de la baja es dominante──

5. En 4 clases de forma sintética (conjunto de datos de datos de la serie de ejemplos de forma de ejemplos de forma de ejemplos de forma de ejemplos de forma de ejemplos de forma de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ej

## 关键术语: "El hombre es un hombre"

|术语 |这意味着什么 |
|------|---------------|
|补丁|图像的方形子区域，通常为 14x14 或 16x16 |
|补丁嵌入 |一个扁平面片到hidden dim区域的线性投影 |
|序列长度|补丁token化后的 token数量，通常加上 CLS |
|正弦位置 |修复了编码 2D 网格坐标的 sin/cos 信号 |
| CLS token |学习向量作为池化头添加到序列前面 |

##  más阅读

- 对于原始补丁嵌入框架,图像值16x16 个字符(ViT,2021)。
- La atención es todo lo que necesitas (2017) está disponible en 2D.
- Para usar el ensayo DINOv2 de registrar tokens, puedes añadir una extensión como ejercicio 6..
