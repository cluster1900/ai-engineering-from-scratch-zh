# 文档与图表理解

> 文档不是照片──PDF、科学论文、发票或手写表单单包含布局、表格、图表、脚注、页眉和语义结构,这些是普通图像理解无法捕获的──VLM 之前的堆积是一个管道:Tesseract OCR + LayoutLMv3 + 表格抽取演理学──VLM 浪潮使用 OCR-free models 取代它──Donut (2022) 诺瓦特 (2023) DocLLM (2023) 模型 能直接输出结构化标记──到2026年,前沿已经只是把页面图像以2576课程为本土的输入 Claude Opus 4.7,结构化标记输出这些都得到自然本本本的.── 文档输出这些都得到了自然本的.

**Type:** Build
**Languages:** Python (stdlib, layout-aware document parser skeleton)
**Prerequisites:** Phase 12 · 05 (LLaVA), Phase 5 (NLP)
**Time:** ~180 minutes

## El objetivo del aprendizaje

- 解释文件 AI 的三个时代:OCR pipeline、OCR-free、VLM-native──
- 描述 LayoutLMv3 的三类输入流:文本、布局(bbox) 、图像补丁,以及统一掩饰──
- Conforme a la información de la empresa, la empresa ha sido objeto de una investigación de investigación y de investigación.
- Para nuevos objetivos de selección de modelos de documentos (en chino: 发票,科学论文,手写表单,中文票据)

##  problemas

 Comprender este PDF tiene dificultades fraudulentas.

- 文本内容(90% 的信号)
- Layout (la página se encuentra en la página de la página)
- 表格(行、列、合并单元格)
- 图形和图表──
- Es un libro de escritura.
- 字体与排版(标题 vs 正文) 』

El sistema de emisión de votos necesita saber "Total: $1,245" de la esquina derecha inferior, en lugar de de la esquina abajo.

## 概念

### Era 1  OCR pipeline(2021 年前)

经典 estaca:

1. PDF → Cada página de imágenes
2. Tesseract (Tesseract) o OCR comercial (OCR comercial) extraer texto,并提供逐词边框──
3. Analista de diseño 识别块(título, tabla, párrafo)
4. Reconocedor de estructura de la tabla 解析表格。
5. Reglas de dominio + regex 抽取字段。

适用于干净的印刷文本――遇到手写、倾斜扫描、复杂表格、非英语文字会崩―― cada tipo de modo de falla necesita un camino de excepción autodefinido―

### El importe de la ayuda se calcula en el plazo de cinco meses.

TrOCR(Li et al., arXiv:2109.10282) utiliza un transformer encoder-decoder en sintetizado + 真实文本图像上训练, sustituyó a Tesseract 经典的 CNN-CTC── ha obtenido una clara ventaja en el texto de mano y multilingüe── sigue siendo un tubo de detección, luego TrOCR, luego diseño, pero los pasos de OCR han mejorado considerablemente──

### Era 2  libre de OCR(2022-2023)

La primera serie de modelos libres de OCR es: completamente saltar sobre la detección, directamente colocar los píxeles de imagen 映射为结构化输出──

Donut ((Kim et al., arXiv:2111.15664):
- El transformer de codificación y decodificación, el codificador es Swin-B.
- 输出 puede ser usado para expresar JSON de comprensión única ∞ para extraer un marcador, o cualquier esquema de tarea específica ∞
- No hay OCR 、no hay diseño 、no hay detección ∙

Nougat ((Blecher et al., arXiv:2308.13418):
- 专门在科学论文上训练──
- 输出是 LaTeX / marcado abajo
- 处理 equations、多 layout、figures──
- Cada parser de archivos de la ciudad se utiliza el modelo.

Estos son especialistas, no generalistas.

### LayoutLMv3 (2022)

另一条路线──LayoutLMv3(Huang et al., arXiv:2204.08387) conserva la OCR, pero incorpora el entendimiento del diseño:

- Tres clases de entrada: tokens de texto OCR, cuadros de límite 2D de cada token, parches de imagen.
- 跨三种 modalidades de formación enmascarada objetivo
-  下游任务:clasificación, extracción de entidades, tabla de calificación

LayoutLMv3 es basado en el entendimiento de documentos OCR 峰── es muy fuerte en la lista de envíos y envíos.

### DocLLM (2023)

DocLLM(Wang et al., arXiv:2401.00908) es el hermano generado de LayoutLM.

### Era 3  VLM nativo(2024+)

Las VLM de 2024  ya son lo suficientemente buenas como para reemplazar completamente la línea de tubería―: poner una imagen completa de página en VLM de alta resolución, plantear problemas, obtener respuesta―:

- LLaVA-NeXT 336-tile AnyRes  Aplicable para pequeños archivos
- Qwen2.5VL de resolución dinámica
- Claude Opus 4.7 支持 2576px 文档。
- PaliGemma 2(2025 年 4 月) especializada en el ámbito del documentario + 手写训练──

La diferencia entre el VLM-nativo y el OCR-pipeline se reducirá rápidamente.

- Texto de escena (手写 + 印刷,混合文字体系)
- 包含合并单元格的复杂表格──
- Incluir ecuaciones matemáticas en el texto.
- 带文本批注的 cifras

Los oleoductos de OCR siguen en los siguientes aspectos:

- Pura carga de trabajo de gran escala de la exploración, de la cual cada página tardía es importante
- La tubería es fiable.
- 需要可审计 OCR 输出监管环境──

### Claude 4.7 / GPT-5 前沿

En 2576 píxeles nativos de entrada abajo, VLMs de vanguardia pueden realizar un entendimiento de documentos a un ritmo cercano a la precisión humana.

- DocVQA:Claude 4.7 ~95.1,PaliGemma 2 ~88.4,Nougat ~77.3,Layout en tubosLMv3 ~83。
- CÁRTA:Cláusula 4.7 ~92.2,GPT-4V ~78
- VisualMRC:Claude 4.7 ~94

 modelo de fuente cerrada                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

### Equaciones matemáticas y LaTeX 输出

El trabajo de ciencia necesita una ecuación exacta de LaTeX 输出──Nougat 就是为此训练的──带 LaTeX targets 训练的VLMs(Qwen2.5-VL-Math、Nougat derivatives) puede generar LaTeX disponible── no hay una clara 训练时,VLMs generará transcripciones legibles pero no precisas──

El proyecto de investigación de la Universidad de Nueva York (UNA) se desarrolló en el año 2026 en el marco de la investigación de la investigación de la ciencia y el desarrollo de la ciencia.

### Escrito

Este es el subcomitente más difícil. La impresión de mano es la más difícil.

### Recepta de 2026

 para los nuevos proyectos de IA:

- La distribución de las páginas de la página web de la empresa es de la siguiente manera:
- 混合文档(科学 + 手写 + 表单):VLM-nativo(PaliGemma 2 o Qwen2.5-VL)
- 完整 arXiv ingestion:Nougat 处理数学,VLM 处理 figuras。
- 监管场景:OCR pipeline + VLM validator Us 用交叉检查。


```figure
mm-doc-layout
```

## Usalo

`code/main.py`¿Qué es esto ?

- Un tokenizer de diseño de una versión de juego:给定 (texto, bbox) pares, generar LayoutLMv3 风格输入。
- Un generador de esquemas de tareas de donut 风格:用于表单的 JSON Template。
- Comparar el presupuesto de tokens de cada página de OCR-pipeline, Donut, Nougat y VLM-native.

##  entregarlo

本课产 出  `outputs/skill-document-ai-stack-picker.md` fijar un documento-AI 项目 (domaín, escala, calidad, regulación), entre un especialista libre de OCR y un nativo de VLM (en inglés) y un especialista libre de OCR (en inglés).

##  ejercicios

1. ¿Cuál tipo de pila puede minimizar el costo por página en caso de incapacidad de precisión?

2. ¿Por qué el diseño de LV3 en forma de QA es superior a los CLIP-VLMs puros, pero en escena-texto en el rendimiento es peor?

3. Nougat 生成 LaTeX── propone un caso de prueba de Nougat 胜出的 输出在 LaTeX fidelity 上胜过 Nougat, así como un caso de uso de Nougat 胜出的──

4. 阅读 PaliGemma 2 paper(Google, 2024) ―― Comparado con PaliGemma 1, ¿qué es el key training de datos nuevos?

5. Design a regulación segura híbrida:OCR pipeline  como principal, VLM  como secundario control cruzado.

## 关键术语: "El hombre es un hombre"

| Term | 人们的说法 | 实际含义 |
|------|-----------------|------------------------|
| OCR pipeline | "Tesseract-style" | 分阶段 stack：detect -> OCR -> layout -> rules；确定性、脆弱 |
| OCR-free | "Donut-style" | 跳过显式 OCR 的 image-to-output transformer；单一 model |
| Layout-aware | "LayoutLM" | 输入包含逐 token bbox coordinates；跨 modalities 的统一 masking |
| VLM-native | "Frontier VLM" | 直接把 page image 以高分辨率输入 Claude/GPT/Qwen VLM；无 pipeline |
| DocVQA | "Doc benchmark" | Document VQA 标准；最常被引用的分数 |
| Markup output | "LaTeX / MD" | 结构化输出格式，而不是 free-form text；支持下游自动化 |

## 延伸阅读

- [Li et al. — TrOCR (arXiv:2109.10282)](https://arxiv.org/abs/2109.10282)
- [Blecher et al. — Nougat (arXiv:2308.13418)](https://arxiv.org/abs/2308.13418)
- [Huang et al. — LayoutLMv3 (arXiv:2204.08387)](https://arxiv.org/abs/2204.08387)
- [Kim et al. — Donut (arXiv:2111.15664)](https://arxiv.org/abs/2111.15664)
- [Wang et al. — DocLLM (arXiv:2401.00908)](https://arxiv.org/abs/2401.00908)
