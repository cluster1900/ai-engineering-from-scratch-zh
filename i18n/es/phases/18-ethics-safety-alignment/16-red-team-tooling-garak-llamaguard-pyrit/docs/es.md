# Herramientas del equipo rojo  Garak, Guardia de los Llama, PyRIT

> Tres herramientas de producción constituyen el marco de la pila de equipo rojo de 2026 años. La Guardia de Lama (Meta)  Una Llama-3.1-8B 分类器, basada en 14 MLCommons 危害类别进行调整; La Guardia de Lama 4 de 2025 es un 12B Multimodal de origen, de Llama 4 Scout 剪剪而来来. Garaka (NVIDIA)  开源 LLM 漏洞扫描器, proporcionar estático、 dinámico 和 adaptive probes, para hallucinación, jail data leakage、injección、toxicidad 和breaks.

**类型：**Construir
**语言：**Python (stdlib, simulador de arquitectura de herramientas y simulación de clasificador de estilo Llama Guard)
**先修要求：**Fase 18 · 12-15 (prisioneros y IPI)
**时间：**~ 75 minutos

## El objetivo del aprendizaje

- 描述 Llama Guard 3/4 在安全堆中的位置:clasificador de entrada, clasificador de salida,或两者兼具──
- Cuenta con 14 MLCommons 危害类别,并说明一个不明显的类别 (Code Interpreter Abuse)
- 描述 Garak's probe 架构:probes、detetores、harnesses。
- Describir la estructura de la campaña de varias rondas de PyRIT, así como cómo se combina con las sondas de Garak.

##  problemas

Las lecciones 12-15 mostraron la cara de ataque. La producción de la implementación necesita una evaluación replicable y ampliable. En el año 2026 hay tres herramientas principales:

## 概念

### Guardia de los llama (Meta)

Llama Guard 3 es un modelo Llama-3.1-8B, dirigido a MLCommons AILuminate 14 个类别 de entrada/salida clasificación se realizó afinado:
- Violencia, no violencia, sexo, CSAM, calumnia
- 专业建议、隐私、IP、无差别武器、仇恨
- Suicidio/auto heridos, contenido sexual, elección, abuso de intérprete de código

支持 8种语言──用法:放在 LLM 之前(input moderation)、LLM 后 ([[output moderation]]),或两者都放──两种用法会产生不同的训练分布  Llama Guard 3 以单一模型形式发布,同时处理两者──

Llama Guard 3-1B-INT4 (arXiv:2411.17713, 440MB, 移动 CPU 上约 ~30 tokens/s) es la cantidad de cambios en el borde.

La Guardia de Llama 4 (Llama 4 (Llama 4)) es un 12B, original multimodal, de Llama 4 Scout 剪剪而来── utilizó un divisor de texto + imágenes que sustituye a la versión anterior de 8B 文本和 11B vision 版本──.

### Garak (NVIDIA)

开源漏洞扫描器──架构:
- **Probes.**Utilizando alucinaciones, filtraciones de datos, inyección rápida, toxicidad, jailbreaks, generadores de ataques, etc.
- **Detectors.**Según el modelo de fracaso esperado para la salida de un producto tóxico, filtrado, en prisión.
- **Harnesses.**管理 probe-detector 对,运行运动,生成报告──

TrustyAI se encargará de Garak y los escudos Llama-Stack ((Prompt-Guard-86M clasificador de entrada Llama-Guard-3-8B clasificador de salida) integrado, utilizado de extremo a extremo escudo-algo  evaluación。 puntuación basada en niveles (TBSA) 取代二元通过/失败  一个模型可以在同一探测上通过严重程度级 3,但在严重程度级 5 失败──

### PyRIT (Microsoft)

Python Toolkit de Identificación de Riesgos. Campañas de equipo rojo de varias rondas.
- **Converters.**转换一个种子提示  parafrase、código、traducción、juego de rol。
- **Orchestrators.**运行 campaña:Crescendo(升级) TAP(分支) RedTeaming(自定义循环) 
- **Scoring.**LLM-como juez o clasificador-como juez

PyRIT es un proyecto de Garak 更重的近亲. Garak realiza miles de sondas de una sola ronda.

### El establo

En el modelo ambos lados se colocan la Guardia de Llama. Cada noche se realiza una regresión.

###  evaluación de las trampas

- **Judge identity.**Tres herramientas pueden utilizarse para el juez de LLM; el juez calibración 会驱动报告的 ASRs (Leyón 12)
- **Probe staleness.**随着模型针对探测器被补丁,Garak探测器 会老化──Adaptive probes(PAIR-shaped) que las sondas estáticas 老化更慢──
- **Llama Guard 对良性内容的 FPR.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

### Está en la fase 18

Lecciones 12-15 es un ataque. Lección 16 es un instrumento de producción. Lección 17 (WMDP) es una evaluación de la capacidad de doble uso. Lección 18 es un marco de seguridad fronteriza, que incluye estos instrumentos en la política.


```figure
al-guard-stack
```

## Usalo

`code/main.py`Construir un clasificador de estilo juguete Llama Guard (en inglés)  en 14 个类别 (en inglés)  en 14 个类别 (en inglés)  en 14 个类别 (en inglés)  en 14 个类别 (en inglés)  en 14 个类别 (en inglés)  en 14 个类别 (en inglés)  en 14 个类别 (en inglés)  en 14 个类别 (en inglés)  en 14 个类别 (en inglés)  en 14 个类别 (en inglés)  en 14 个类别 (en inglés)  en 14 个类别 (en inglés)  en 14 个类别 (en inglés)  en 14 个类别 (en inglés)  en 14 个类别 (en inglés)  en 14 个类别 (en inglés)  en 14 个类别 (en inglés)  en 14  en 14 个类别 (en inglés)  en 14  en 14  en 14  en 14  en 14  en 14  en 14  en 14  en 14  en 14  en 14  en 14  en 1  en 1  en 1  en el 1  en el 1  en el 1  en el 1  en el 1  en el 1  en el 1  en el 1  en el 1  en el 1 en el 1 en el que se puede utilizar  en el sistema de  en el sistema de  en el sistema de  en el que se puede utilizar  en el sistema de  en el sistema de  en el sistema de  en el sistema de  en el que se puede utilizar  en el sistema de  en el sistema de  en el sistema de  en el que se puede hacer  en el sistema de  en el sistema de  en el que se puede observar  en el sistema de  en el sistema de  en el que se puede ser utilizado en el sistema de  en el sistema de  en el sistema de  en el que se puede ser utilizado en el

##  entregarlo

本课会生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-red-team-stack.md` Dado una descripción de la implementación, indicará cuáles de los tres instrumentos son adecuados, qué debe configurar cada instrumento y qué cadencia de regresión debe ejecutarse.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`❖ Comparar el índice de inspección en el tipo de clasificación de Llama-Guard en el ataque de una sola ronda con el ataque de varias rondas.

2. 实现 una nueva sonda Garak: una base64 编码的有害请求──测量Llama-Guard-style classifier对其检测情况──

3. Usar un convertidor de "traducir al francés, luego parafrasear"  ampliar cadena de convertidores de estilo PyRIT―

4. 阅读Llama Guard 3的危害类别列表――找出两个类别,在这些类别上训练数据现实中会对合法开发者内容产生较高的虚假阳性率――

5. Comparar Garak 和 PyRIT's Design Principles──论证一个部署场景,其中每个工具分别是正确选择──

## 关键术语: "El hombre es un hombre"

| Term | 人们的说法 | 它实际意味着什么 |
|------|-----------------|------------------------|
| Llama Guard | "the classifier" | 带有 14 个危害类别的 fine-tuned Llama-3.1-8B/4-12B 安全分类器 |
| Garak | "the scanner" | NVIDIA 开源漏洞扫描器；probes、detectors、harnesses |
| PyRIT | "the campaign tool" | Microsoft 多轮 red-team orchestrator；converters、orchestrators、scoring |
| Prompt-Guard | "the small classifier" | Meta 的 86M prompt-injection classifier，与 Llama Guard 配套使用 |
| TBSA | "tier-based scoring" | Garak 的 tier-based pass/fail，用于取代二元结果 |
| Converter chain | "paraphrase + encode + ..." | PyRIT 用于构建多步攻击的组合原语 |
| MLCommons hazard categories | "the 14 taxonomies" | Llama Guard 面向的行业标准分类体系 |

## 延伸阅读

- [Meta — Llama Guard 3 (in Llama 3 Herd paper, arXiv:2407.21783)](https://arxiv.org/abs/2407.21783) 8B 分类器
- [Meta — Llama Guard 3-1B-INT4 (arXiv:2411.17713)](https://arxiv.org/abs/2411.17713) 量化移动端分类器  量化移动端分类器  量化移动端分类器  量化移动端分类器 量化移动端分类器 量化移动端分类器 量化移动端分类器 量化移动端分类器 量化移动端分类器 量化移动端分类器 量化移动端分类器 量化移动端分类器 量化移动端分类器 量化移动端分类器 量化移动端分类器 量化移动端分类器 量化移动端分类器 量化移动端分类器 量化移动端分类器 量化移动端分类器 量化移动端分类器 量化移动端分类器 量化移动端分类器
- [NVIDIA Garak — GitHub](https://github.com/NVIDIA/garak) 扫描器 repo 和文档
- [Microsoft PyRIT — GitHub](https://github.com/Azure/PyRIT) conjunto de herramientas de campaña
