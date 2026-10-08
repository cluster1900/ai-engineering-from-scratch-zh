# VLAs incorporados:RT-2, OpenVLA, π0, GR00T

> La primera vez que se ejecuta en el equipo de cocción de la máquina de cocción, es RT-2 (Google DeepMind, 2023 7 月) ⋅ RT-2 (RT-2) se despliega en texto Token, en datos web y datos de acción robot, para realizar un ajuste en línea con VLM, y demostrar que el conocimiento en lenguaje de visión a escala web puede ser transferido al control de los dispositivos. OpenVLA (OpenVLA) publicó en junio de 2024, una 7B (OpenB) en referencia a la realización de la serie π0 de Inteligencia Física (Google DeepMind, 2024-2025) se unió a expertos en acción de coincidencia de flujo.

**Type:** 学习
**语言：**Python(stdlib, Tokenizer de acción + VLA 推理骨架)
**Prerequisites:** Phase 12 · 05（LLaVA），Phase 15（Autonomous Systems，已引用）
**Time:** ~180 分钟

## El objetivo del aprendizaje

- 描述行动标记化:离散 bin 编码(RT-2)、FAST 高效行动标记、连续流量匹配行动(π0)。
- Explicar por qué en la web + datos de robots se realizan ajustes de co-finación, se puede conservar para la transferencia de conocimientos generales de las nuevas tareas.
- En la misma máquina tarea comparar OpenVLA (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenV) (OpenV) (OpenV) (OpenV) (OpenV) (OpenV) (OpenV)) (en)) (en)) (en)) (en)) (en)) (en)) (en)) (en)) (en)) (en))
- Explicar el conjunto de datos de Open X-Embodiment y su papel como cuerpo de entrenamiento de RT-X:

##  problemas

能根据自然语言指令做家务的机器人, desde los años 1970 ha sido el objetivo de la investigación. La respuesta de los años 2020 es: visión-lenguaje-acción (VLA) modelo.

Desafíos especiales de VLA:

1. 动作空间是连续的(ángulos conjuntos、fuerzas), y高维(7-DOF brazo + 3-DOF agarre = 10 dims a 30 Hz)
2. 机器人专专训练数据稀缺──Open X-Embodiment tiene aproximadamente 1M trayectorias; imagen de texto web es 5B+──
3. Control de frecuencia es muy importante. 30 Hz de control de bucle significa que cada movimiento sólo 33ms presupuesto.
4. Seguridad. Error de movimiento puede dañar el hardware.

## 概念

### Tokenización de acciones (RT-2)

Técnicas de RT-2: poner cada objetivo conjunto indicando un Token de texto después de la quantificación. Se convertirá en un Token de control de cada uno de los dos pasos.

En datos mixtos para realizar una co-finación de PaLM-X VLM:

- Los pares de imágenes web-texto ((captioning、VQA)。
- Demonstraciones de robots, acción expresada por Token.

模型看 pick up the red cube(language)→ image(vision)→ 10-Token action sequence(discretos objetivos conjuntos)。Web pretraining 保留 general-knowledge transfer:即使 fast-moving 不在训练数据中,RT-2 也能遵循 move towards the fast-moving object。

RT-2 论文中的推理为 3-5 Hz, limitado al decodo autoregressivo VLM.

### OpenVLA  开放的 7B 参考实现

OpenVLA(Kim et al.,2024 年 6 月) es una plataforma de código abierto de RT-2 等价物──7B Llama backbone,DINOv2 + SigLIP 双视觉编码器, basada en la tokenización de acción de 256 contenedores──

En el Open X-Embodiment 上训练(跨 22 个机器人的 970k trayectorias)。附带 LoRA fine-tuning 支持,用于适配新机器人──

Inferencia: en A100 arriba se puede combinar con cuantización de 4-5 Hz;; para la operación lenta suficientemente rápido, pero no se adapta al control de alta frecuencia;;

### Rápido tokenización  更快的 acción decodificar

Pertsch et al. (en 2024) señalan que la tokenización discreta bin 效率不高, pues la mayoría de los movimientos se concentran en la pequeña región de bin-space.

Una trayectoria de acción de 30 pasos se convierte en aproximadamente 10 tokens rápidos, en lugar de 300 tokens discretos.

### π0 y acciones de coincidencia de flujo

Inteligencia física de π0(Black et al.,2024 年 10 月) con experto en acción de flujo de coincidencia 替代离散 acción Token:

- Un pequeño transformador de acción 读取 VLM's hidden states,并通过 rectified flow 输出连续的50 pasos de secuencia de acción。
- Cabeza de acción utiliza pérdida de flujo de coincidencia 训练;VLM pretraining 保持不变。
- Inferencia: secuencia de acción completa en unos 5 pasos de denotación, en realidad alcanza 50 Hz 控制。

π0 的主张: en un amplio conjunto de tareas operativas derrotar OpenVLA y Octo.

π0.5 y π0-FAST es el aumento de la escalado.

### GR00T N1  面向人形的双系统

NVIDIA GR00T N1(2025 年 3 月) Face towards humanoid robots(>30 DOF, cuerpo entero) Construcción:

- Sistema 2: grandes VLM 读取场景 + 指令,并以约1 Hz 产生高水平子目标──
- Sistema 1: transformador de cabeza de acción pequeño, según los subobjetivos  producir comandos conjuntos de 50-100 Hz de nivel bajo―

Este tipo de separación se aplica a Kahneman's Rapid Thinking y Slow Thinking:System 2 规划,System 1 执行──优势:慢速VLM 规模规划不会阻阻快控制;System 1 保持小型以降低延迟──

GR00T N1.7(2025 años de final) ha mejorado la escalación de datos──GR00T utiliza datos sim-to-real del Omniverse  realizar ajustes finos──

### Cuadro de la X abierto

训练数据──RT-X(2023年 10月)汇集了22 数据集,覆盖了22 机器人上的1M轨迹──Open X-Embodiment是所有人都使用的体库:

- ALOHA / Puente V2 / Droid / RT-2 Cocina / Mesa de idiomas。
- Cada uno de ellos es un robot de estado, una cámara de vista, una instrucción, una secuencia de acción.
- 训练卫生:统一行动空间、归一化关节范围、调整摄像头尺寸──

OpenVLA y π0 están en Open X-Embodiment.

### Co-ajuste fino con solo robot

Co-ajuste fino de los datos de VQA web con las trayectorias de los robots 混合──比例很重要:VQA 太多,模型会忘记动作;机器人数据 太多,模型会丢失通用知识──

RT-2 proporciona una relación de datos de tamaño de un conjunto de datos.

Solo robot 训练会产生任务专用模型,遇到出发的指令就会失败。Co-fine-tuning 的差异在于,模型不仅能处理 摘取红立方块(en demo) ,还能处理 摘取左边第三大物体 (en la versión de novelas) ──

### Limitos de seguridad y acción

Cada VLA de producción tiene:

- 硬关节限制(不能超过规格施加扭矩)
- Limite de velocidad (clicing suave)
- Los límites del espacio de trabajo (en el punto final, no puede salir de la mesa)
- Para nuevas tareas, la aprobación de uso humano en el ciclo.

Estos como controles de la capa de control se encuentran en el exterior del VLA.


```figure
mm-action-tokens
```

## Usalo

`code/main.py`¿Qué es esto ?

- 实现 256-bin tokenización de acción y destokenización。
- 基于 DCT + cuantización 草拟 FAST tokenizer。
- Confrontación de los tokens en cada paso de acción
- 打印 RT-2 → OpenVLA → π0 → GR00T 的谱系摘要──

##  entregarlo

本课产 出  `outputs/skill-vla-action-format-picker.md`△给定一个机器人任务 ((manipulación, navegación, cuerpo humanoide completo),在分区+RT-2、FAST + OpenVLA、流量匹配+ π0 或双系统+GR00T 之间做选择──

##  ejercicios

1. Un brazo de 10 DOF, con 30 Hz  control de frecuencia de operación ∙ 256 binos de tokenización discretos bin cada segundo emitirá cuántos tokens?

2. FAST tokenization va a comprimir trayectorias de 30 pasos hasta aproximadamente 10 tokens. Si la trayectoria contiene movimientos de alta frecuencia, por ejemplo, el usuario perderá qué?

3. La cabeza de coincidencia de flujo de π0 en aproximadamente 5 pasos denotación. Comparar su volumen de desagregación con el decodificador autoregresivista de OpenVLA en 4-5 Hz.

4. El sistema 1 / Sistema 2 de GR00T 拆分对应 Kahneman── propone un sistema diferente de separación(Sistema 3?), que puede ayudar a caminar bípedo─

5. 阅读Open X-Embodiment Sección 4 关于数据集库存的内容──说出防止域名泄漏的三条库存规则──

## 关键术语: "El hombre es un hombre"

| Term | 人们通常怎么说 | 实际含义 |
|------|-----------------|----------|
| VLA | "Vision-language-action" | 接收 image + instruction 并输出 action commands 的模型 |
| Action tokenization | "Discrete bins" | 将连续 joint targets 量化为每个 dim 256 个 bin，每个 bin 是一个 vocab ID |
| FAST tokenizer | "Frequency action tokens" | DCT + quantize，将 30-step trajectories 压缩到约 10 个 Token |
| Co-fine-tune | "Mix web + robot" | 在 robot demos 旁边同时使用 web VQA data 训练，以保留通用知识 |
| Flow-matching action head | "π0 continuous output" | 小型 transformer，通过 rectified flow 输出 50-step action sequence |
| System 1 / System 2 | "Dual-system control" | 大型 VLM 慢速规划，小型 action head 快速行动；GR00T 模式 |
| Open X-Embodiment | "RT-X dataset" | 1M-trajectory 跨机器人 dataset；training corpus |

## 延伸阅读

- [Brohan et al. — RT-2 (arXiv:2307.15818)](https://arxiv.org/abs/2307.15818)
- [Kim et al. — OpenVLA (arXiv:2406.09246)](https://arxiv.org/abs/2406.09246)
- [Black et al. — π0 (arXiv:2410.24164)](https://arxiv.org/abs/2410.24164)
- [NVIDIA — GR00T N1 (arXiv:2503.14734)](https://arxiv.org/abs/2503.14734)
- [Open X-Embodiment Collab — RT-X (arXiv:2310.08864)](https://arxiv.org/abs/2310.08864)
