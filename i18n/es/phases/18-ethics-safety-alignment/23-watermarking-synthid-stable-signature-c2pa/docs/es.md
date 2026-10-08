# Marca de agua  SynthID、Signatura estable、C2PA

> Tres tecnologías constituyen la base para el seguimiento de la fuente de contenido de la IA en 2026: SynthID (Google DeepMind)  Marca de agua de imágenes  Lanzamiento en agosto de 2023, texto + video  Lanzamiento en mayo de 2024: Gemini + Veo, texto  Lanzamiento en octubre de 2024  Aplicación de la herramienta GenAI  Open Source, 统一的多媒体探测器  Lanzamiento en noviembre de 2025: Gemini 3 Pro  Lanzamiento de un mismo año:  Marca de agua de texto  En simultáneo, será difícil ajustar las probabilidades de muestreo de los siguientes tokens; imagen / vídeo marcas de agua pueden soportar la compresión  Copping  cambios  Frames  Filtros  Finación estable (Fernandez y otros, ICCV 2023, arXiv:2303.15435)  Marcas de información  Desincronización de agua  Desincronización                                                                                                                                       

**Type:** Build
**Languages:** Python (stdlib, token-watermark embed + detect)
**Prerequisites:** Phase 10 · 04 (sampling), Phase 01 · 09 (information theory)
**Time:** ~75 分钟

## El objetivo del aprendizaje

- 描述 token-level watermarking (marcado de agua a nivel de token) SynthID-text 风格) y su mecanismo de detección.
- Describir la firma estable y el ataque de su eliminación en 2024
- Explicar el efecto de la C2PA y por qué se aplica al marcado de agua 互补.
- 描述关键限制:señales específicos del modelo, paráfrases, así como ataques de preservación de significado (arXiv:2508.20228):

##  problemas

2023-2024 años,profundos y AI Produce contenido en gran escala entran en el escenario político y de consumo. El Watermarking es una propuesta de fuente técnica de señales: en la creación de marcas de contenido generado, después de la reexamen.

## 概念

### Marcado de agua de texto (SynthID-text 风格)

Kirchenbauer et al. 2023 机制, por Google 产品化:

1. En cada paso de decodificación, para hacer un hash de los tokens anteriores, generar una partición pseudorandom, dividir el vocabulario en "verde" y "rojo" 集合。
2.                                                                                                                                                                                                                                                               
3. El número de tokens verdes que contienen resultados será mayor que las expectativas en cualquier caso.

检测:对每个预写重新 hash,统计生成结果中的绿色代币,计算 z-score──水标文字的 z-score >0,human text 约为 0──

 características:
- 读者难以察觉 (d) 足够小,质量损失较轻)
- En la función de partición del vocabulario puede acceder 时可检测。
- Para la paráfrase, no hay nada que arruinar este mensaje.

SynthID-text 于2024 年 10 月通过 Google 的 Responsible GenAI Toolkit 开源──

### Firma estable (imagen)

Fernandez et al. ICCV 2023──Fine-tune decodificador de difusión latente, que permite que cada uno de los ejemplos generados contenga un mensaje binario fijo de representación latente de la escritura──检测通过神经解码从 latente 中解码──对收割的图像,保留10% 内容) , en FPR<1e-6 时检测率 >90%──

2024 年 5 月 "La firma estable es inestable" (arXiv:2405.07145):descodificador de ajuste fino puede mantener la calidad de la imagen al mismo tiempo que se mueve la marca de agua;.

### Detector unificado SynthID (en inglés)

随着Gemini 3 Pro 同发布: un detector multimedia, que puede leer texto, imágenes, audio, vídeos en la misma API.

### C2PA

Coalición para la procedencia y autenticidad de contenidos―Cryptographically signed tamper-evident metadata standard―C2PA 2.2 Explainer (2025)―C2PA manifest 会记录 provenance claims(谁创建、何时创建、做过哪些 transformations),并由创始人关键 签名──

互补:
- Los metadatos pueden ser extraídos; marcas de agua (normalmente) no son fáciles.
- Metadatos 信息丰富( cadena completa de procedencia); marcas de agua 承载 bit。
- C2PA depende de la plataforma adoptada; las marcas de agua se escribirán automáticamente.

Google en Buscar, anuncios y "Acerca de esta imagen" en simultáneo

###  limitación

- **Model-specific.**SynthID se encuentra en los modelos sin SynthID habilitados con marcas de agua.
- **Paraphrase.**Marcas de agua de texto 无法经受 significado-preserving parafrase。
- **Transformation attacks.**ArXiv:2508.20228 (2025)  mostró ataques de conservación del significado de marcas de agua de texto y muchas marcas de agua de imagen que pueden dañar la text.
- **Fine-tune removal.**Según "La firma estable es inestable", la ajuste fino de post-generación puede ser transferido de las marcas de agua.

### Artículo 50 de la Ley de IA de la UE

El código de transparencia de AI 生成内容标注的(1st Edition Draft 2025 年 12 月, 2nd Edition Draft 2026 年 3 月,根据 [European Commission status page](https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content),预计最终版 2026 年 6 月发布) ・截至 2026 年 4 月,该代码 仍为草案,时间线可能变化──监管层要求技术层提供这些措施──Deepfakes 必须标注──

### Está en la fase 18

Lecciones 22-23 关注模型输出的内容(datos privados、signales de origen) ――Lección 27 覆盖培训-data governance──Lección 24 是要求这些技术措施的监管框架──


```figure
an-watermark-greenlist
```

## Usalo

`code/main.py`Construir un símbolo de agua de texto de juguete。 Tokens is an integral 0..N-1;watermarked sampling 会偏向 hash 定义的绿色集合。 Detector 会计算绿色代币z-score。 Puedes observar 1000代币下的检测结果, ver la paráfrase 如何破坏该信号,并测量人类文字上的错阳性率──

##  entregarlo

本课会产出                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `outputs/skill-provenance-audit.md` Determinar la robustez de sus respectivas adversidades, así como la cobertura de cada modalidad.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Report watermarked 1000-token generation with z-scores of human-authored text―identificar el umbral de confianza del 95%

2. 实现 un ataque de paráfrases, con sinónimos  sustituir 30% de Token──重新测量 z-score──

3. 阅读 Kirchenbauer et al. 2023 Sección 6 中关于强度的内容──为什么文字水印会在表语下失效,而图像水印能经受收割?

4. Design a use SynthID-text + C2PA metadata de la implementación―describir la cadena de procedencia de los consumidores ve―identificar un modo de falla de cada componente―

5. 2024 "La firma estable es inestable"  resultados indican, ajuste fino se puede mover el marcas de agua de la imagen ⋅ diseñar una limitación de este ataque ⋅ medidas de control de la implementación  Por ejemplo, requieren que los controles de control ajustados de los puntos de control son liberados ⋅

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 它实际含义 |
|------|------------|------------|
| SynthID | "Google's watermark" | Cross-modal provenance signal；text、image、audio、video |
| Token watermark | "Kirchenbauer-style" | Biased-sampling text watermark，可通过 green-token z-score 检测 |
| Stable Signature | "image watermark" | Fine-tuned-decoder watermark；ICCV 2023 |
| C2PA | "the metadata standard" | Cryptographically signed tamper-evident provenance metadata |
| Paraphrase robustness | "does rewording break it" | Text watermark 属性；目前有限 |
| Fine-tune removal | "adversarial unwatermark" | 通过 decoder fine-tuning 移除 image watermark 的攻击 |
| Cross-modal detector | "unified SynthID" | 2025 年 11 月跨 modalities 的 unified API |

## 延伸阅读

- [Kirchenbauer et al. — A Watermark for Large Language Models (ICML 2023, arXiv:2301.10226)](https://arxiv.org/abs/2301.10226) mecanismo de marcas de agua
- [Fernandez et al. — Stable Signature (ICCV 2023, arXiv:2303.15435)](https://arxiv.org/abs/2303.15435) marcas de agua de imagen 论文
- ["Stable Signature is Unstable" (arXiv:2405.07145)](https://arxiv.org/abs/2405.07145) ataque de eliminación
- [Google DeepMind — SynthID](https://deepmind.google/models/synthid/) Marca de agua transmódica
- [C2PA 2.2 Explainer (2025)](https://c2pa.org/specifications/specifications/2.2/explainer/Explainer.html) Norma de metadatos
