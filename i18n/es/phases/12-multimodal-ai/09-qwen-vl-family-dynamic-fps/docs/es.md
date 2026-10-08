# La familia Qwen-VL con vídeo dinámico-FPS

> La familia Qwen-VL  Qwen-VL (2023) ✓ Qwen2-VL (2024) ✓ Qwen2.5-VL (2025) ✓ Qwen3-VL (2025) ✓ es el modelo de visión abierta más influyente del año 2026 ✓ Cada generación hizo una apuesta de arquitectura decisiva y en 12 meses fue copiada en otros proyectos abiertos en vivo: a través de M-RoPE logró una resolución de estado de vida original ✓ Trajo una ventana de atención absoluta en el muestreo dinámico-FPS ✓ ViT, así como un agente de salida de formato ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ 

**Type:** Learn
**Languages:** Python (stdlib, M-RoPE encoder + dynamic-FPS sampler)
**Prerequisites:** Phase 12 · 06 (patch-n'-pack)
**Time:** ~120 minutes

## El objetivo del aprendizaje
- 計算 M-RoPE 的三轴旋转(temporal、高度、宽),并解释为什么三者都需要──
- Por el contrario, el método de muestreo de FPS es un método de selección de tokens por segundo.
- 按顺序说出Qwen-VL cuatro generaciones de mejoras, así como cada generación ha puesto en marcha qué.
- 连接一个Qwen2.5VL-style JSON agent 输出格式,并从VLM 响应中解析结构化工具调用──

##  problemas
Qwen-VL fue lanzado en agosto de 2023, es una respuesta directa a LLaVA-1.5 y BLIP-2.

La primera innovación de la Qwen-VL fue la de 448x448 y la caja de límite de tierra 输出, hacer que el modelo pueda orientarse hacia el objeto―.

视频:Video-LLaMA 堆叠逐编码并把它们给LLM── es válido para cortometrajes, pero no es adecuado para el vídeo de varias horas, ya que el eje de tiempo de este tipo de videos es sólo un señal──Qwen 团队 quiere un único codificador de tiempo para entender──

结构化输出:LLaVA 输出自由格式文本──Agent 需要 JSON──Qwen-VL 使用显式 JSON 输出格式训练,包括把边界框 坐标作为文本──

Cada generación de Qwen-VL han expandido esta línea de tres eixos.

## 概念
### Qwen-VL (agosto 2023)

Primera代:OpenCLIP ViT-bigG/14 作为编码(2.5B params)、LLama-compatible Q-Former(1-step con 256 consultas)、Qwen-7B base。贡献:

- 448x448 分辨率 (en el momento en que se abrió la SOTA de VLM)
- Grounding:使用带显式坐标 Token 输出的 imágenes-texto pares 训练──"El gato está en <box>(112, 204), (280, 344)</box>"──
- Desde el principio se realizan entrenamientos en chino + inglés.

En el momento de la publicación de la publicación, el grupo de expertos de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la ciencia de la ciencia de la ciencia de la ciencia de la ciencia de la ciencia de los Estados Unidos de China, la investigación de la investigación de la investigación de la investigación de la investigación de la ciencia de la ciencia de la ciencia de la ciencia de la ciencia de la ciencia de la ciencia de la ciencia de la ciencia de la ciencia de la ciencia de los Estados Unidos de los Estados Unidos de los Estados Unidos, la ciencia de la ciencia de la ciencia de la ciencia de la ciencia de la ciencia de la ciencia de la ciencia de los Estados Unidos de los Estados Unidos de los Estados Unidos de la ciencia de los Estados Unidos de los Estados Unidos de América, la ciencia de la ciencia de la ciencia de la ciencia de los Estados Unidos de los Estados Unidos de los Estados Unidos de América, la ciencia de la ciencia de la ciencia de los Estados Unidos de la ciencia de los Estados Unidos de América, la ciencia de la ciencia de la

### Qwen2-VL (septiembre 2024)  M-RoPE 与原生分辨率

Qwen2-VL Usado original de resolución ViT codificador  sustituido por resolución fija + Q-Former pila──

- Original生动态分辨率──ViT 接受任何 HxW 可被 28 整除的输入──Patch 14 con 2x merger espacial──1120x672 的图像──40x24 合并的补丁) 产生 960 个视觉 Token──无需大小、无需,无需图片──
- M-RoPE (RoPE multimodal) ―― cada Token 携带 3D 位置 (t, h, w), en lugar de 1D──对图像 t=0;对于视频 t = frame_index──RoPE 按每个轴的频率旋转查询/key Vector──没有位置嵌入表──
- Proyector MLP──去掉 Q-Former; en tokens de parches fusionados 上使用2layer MLP──
- 带动态FPS的视频──默认以1-2 FPS 采样视频,但模型接受任意数──

结果:Qwen2-VL-7B 在多多多多多多多基准上追平 GPT-4o, y en DocVQA 上超过它(94.5 vs 88.4);; la estructura de cambio es un paso decisivo;;

### Qwen2.5-VL(2025 年 2 月)  FPS dinámico + tiempo absoluto

El cambio principal de Qwen2.5VL es el video.

- 绝对时间 Token──不使用位置索引(frame 0, 1, 2...),而使用实际时间──"A las 0:04, el gato salta". 模型会看到与框架代币 交错的 交错的`<time>0.04</time>`Los tokens
- FPS dinámico, material de velocidad lenta, en el caso de 1 FPS, escenario de movimiento, en el caso de 4+ FPS, seleccionado por el usuario o el entrenador; M-RoPE 会适配──
- Atención Espacial  Adopción de ventanas (bloqueo interno) para aumentar la descomposición; Cada隔几层加入全球关注──
- 显式 JSON 输出格式──使用工具-call 数据训练:"{\"herramienta\": \"clic\", \"coords\": [380, 220]}"──开箱即代理-ready──
- MRoPE-v2 escalado. La posición se reduce con la mayor cantidad de entradas, por lo que 10 minutos de vídeo no consumen el máximo de frecuencia.

基准:Qwen2.5-VL-72B 在多数视频基准上超过 GPT-4o,在文档上追平 Gemini 2.0,并为GUI grounding 设定开放模型 SOTA(ScreenSpot:Curación del 84% frente a GPT-4o del 38%)。

### Qwen3-VL (novembre 2025)

Qwen3-VL es una vez incrementada la mejora de la cantidad, el foco es la integración en lugar de reinventar: una columna vertebral LLM más grande ((Qwen3-72B) 、 ampliar el entrenamiento de datos、 mejorar la OCR, así como a través del modo de pensar de Qwen3  obtener el razonamiento más fuerte――.

Conclusión de este esquema: hasta el año 2025, la arquitectura de Qwen-VL ya está estable.

### M-RoPE matemáticamente

经典 RoPE 使用成对坐标,按位置 `m`旋转维度为 `d`de la consulta `q`¿Qué es esto ?

```
q_rot[2i]   = q[2i]   * cos(m * theta_i) - q[2i+1] * sin(m * theta_i)
q_rot[2i+1] = q[2i]   * sin(m * theta_i) + q[2i+1] * cos(m * theta_i)
theta_i     = 10000^(-2i/d)
```

M-RoPE va a ocultar el color de la banda.`d = 96` Distribuir 32 dims 给 temporal、32 给 height、32 给 width── cada banda 按自己的轴位置旋转──位于 (t=5, h=10, w=20) 位于的补丁 会在其三条带 上分别应用旋转`R_t(5)`¿Qué es esto?`R_h(10)`¿Qué es esto?`R_w(20)`¿Qué es eso?

Tokens de texto `t = text_index, h = 0, w = 0`(o una forma de la selección), para mantener la capacidad de uso.`t = frame_time, h = row, w = col`△ uso de imágenes `t = 0`¿Qué es eso?

Una posición codificada es el procesamiento de textos, imágenes y vídeos, sin necesidad de dividir el código o una posición diferente.

### Dinámico-FPS 采样逻辑

给定一个时间为 `T`秒的视频和目标 Token  presupuesto `B`¿Qué es esto ?

1. 计算你能承担的最大FPS:`fps_max = B / (T * tokens_per_frame)`¿Qué es eso?
2. Desde`{1, 2, 4, 8}`中选择满足   Cómo hacer`fps <= fps_max`El objetivo de la FPS:
3. Si el movimiento es fuerte, se puede elegir un FPS más bajo.
4. 按选定FPS 均采样; entre entre插入 `<time>t</time>`Los tokens

Qwen2.5VL 会隐式训练这种逻辑;推理时用户通过 `fps`参数控制── una secuencia de movimiento de 60 segundos, con 4 FPS、 por cada  81 tokens 计算, igual a 19440 tokens, en un contexto de 32k 中可管理──

### Producción de agentes estructurados

El agente de Qwen2.5VL  entrenamiento de la forma clara hacia la estructuración de la herramienta llamada:

```
{
  "tool": "mouse_click",
  "coords": [1024, 512],
  "button": "left",
  "modifier": null
}
```

解析是确定性的:对模型输出执行 JSON.parse。相比之下,自由格式的"click at (1024, 512) " 需要 regex 和歧义处理──这个转变解释了为什么Qwen2.5-VL de ScreenSpot 分数从Qwen2-VL de 55% 跃升至84%.──


```figure
mm-mrope-axes
```

## Usalo
`code/main.py`实现:

- Para la secuencia de texto mezclado, parches de imágenes y cuadros de vídeo  realizar M-RoPE  ubicación calculación 
- Muestreo dinámico-FPS:给定 (tiempo de duración, presupuesto, movimiento_nivel), seleccionar FPS 并输出 marco de tiempo selos。
- Una versión de juguete Qwen2.5VL JSON-parser de salida, para procesar las respuestas de las llamadas de herramientas de la sección de la página de usuario.

Lo ejecutamos y luego en un video de 5 minutos, cambiamos el FPS fijo en FPS dinámico, percibir diferencias.

##  entregarlo
本课产 出  `outputs/skill-qwen-vl-pipeline-designer.md` dar una tarea de vídeo (monitoreo, agente, reconocimiento de acción, accesibilidad), que producirá Qwen2.5 VL  configuración  presupuesto de marco  estrategia FPS  bandera de atención de ventana  modo de salida de agente) y la estimativa de retraso  Cada vez que usted utiliza para el video producto de la familia Qwen-VL modelo 

##  ejercicios
1. 计算 hidden 48(每条 band 16,base theta 10000)时,位于 (t=3, h=5, w=7) de parche de M-RoPE 旋转──展示每条 band 中前三对的旋转角度──

2. Una sección de 10 minutos de seguridad de la cámara de vídeo, ¿cuánto se producirá en 1 FPS? en 384 resolución y 3x piscina abajo, el total de tokens número es cuánto?

3. Por 30 segundos, el programa de la pantalla de usuario se utiliza para seleccionar FPS.

4. Qwen2.5VL  completamente eliminado Q-Former──¿Por qué simple MLP en 2025 años disponibles, pero en 2023 años imposible de hacer?

5. ¿Qué sucederá con el error? ¿Qué libro de cocina Qwen  ¿Qué estrategia de recuperación?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| M-RoPE | "Multimodal RoPE" | hidden dim 中带 temporal、height 和 width bands 的 3D rotary position embedding |
| Dynamic FPS | "Smart sampling" | 根据运动、时长和 Token 预算为每个视频选择的帧采样率 |
| Absolute time token | "Timestamp token" | 在序列中交错插入的 `<time>t</time>`，让模型看到实际秒数而不是帧索引 |
| Window attention | "Local attention" | 为提速而限制在小窗口内的 spatial self-attention；周期性加入 global attention |
| Structured agent output | "JSON mode" | 通过训练数据监督教 VLM 输出可解析 JSON，其中包含 coords 和 tool names |
| min_pixels / max_pixels | "Resolution bounds" | Qwen2.5-VL 的每请求控制项，用来约束总像素数，从而约束 Token 数 |
| Grounding | "Point-at-it" | 将 bounding-box 坐标作为文本 Token 输出；自 Qwen-VL v1 起使用 |

## 延伸阅读
- [Bai et al. — Qwen-VL (arXiv:2308.12966)](https://arxiv.org/abs/2308.12966)
- [Wang et al. — Qwen2-VL (arXiv:2409.12191)](https://arxiv.org/abs/2409.12191)
- [Qwen Team — Qwen2.5-VL Technical Report (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)
- [Qwen Team — Qwen3-VL (arXiv:2511.21631)](https://arxiv.org/abs/2511.21631)
- [Zhu et al. — InternVL3 (arXiv:2504.10479)](https://arxiv.org/abs/2504.10479)
