# Arte ASCII y las brechas de cárcel visuales

> Jiang, Xu, Niu, Xiang, Ramasubramanian, Li, Poovendran, "ArtPrompt: ASCII Art-based Jailbreak Attacks against Aligned LLMs" (ACL 2024, arXiv:2402.11753)。 en peticiones nocivas para ocultar Token relacionados con la seguridad, usar las mismas letras de ASCII-art 染 sustituirlos, y luego enviar este falso siguiente pedido─GPT-3.5GPT-4、Gemini、Claude、Llama-2 都无法稳健识别 ASCII-art Token──该攻击绕过PPL((Retransposición de filtros)─Paraphrase 防御和相关的okenization──:ViTC语标识测量对非觉义视觉识别能力;SightSightSight泛其其其基将稳健识别ASCII-art 编码树 JSON 编码组件 编码组件 编码组件 编码组件 编码组件 编码组件 编码组件 编码组件 编码组件 编码组件 编码组件 编码组件 编码组件 编码组件 编码组件 编码组件 编码组件 编码组件 编码组件 编码组件 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑 编辑

**类型：**Construir
**语言：**Python (stdlib, ArtPrompt)
**前置要求：**Fase 18 · 12 (PAIR), Fase 18 · 13 (MSJ)
**时间：** 60 minutos

## El objetivo del aprendizaje

- 描述 ArtPrompt 攻击:word-identification 步骤、ASCII-art 替换、最终伪装后的提示──
- 解释为什么标准防御(PPL、Parafrase、Retokenization) 会在 ArtPrompt 上失败。
- 定義 ViTC,并描述它衡量什么──
- 将 StructuralSleight 描述为向任意 不常文本编码结构的泛化.

##  problemas

通过抛词和角色扮演(Leyón 12) y pasando por un largo contexto(Leyón 13) de ataques,作用于文本层面的模式──ArtPrompt 作用于识别层面:模型没有解析被禁止的代币──它解析的是由字符染出的图像──安全过器看到的是无害的标点──模型看到的是一个词──

## 概念

### ArtPrompt, dos pasos

Paso 1. Identificación de palabras. Proporciona una petición nociva, el atacante utiliza un LLM para identificar palabras relacionadas con la seguridad.

Paso 2. Capacitado generación rápida. Se sustituirá cada palabra identificada por su ASCII-art 染(con caracteres compuestos por letras de forma de 7x5 o 7x7 bloques)  El modelo recibe es una red de caracteres y espacios compuestos por puntos, una capacidad suficiente para que un modelo fuerte pueda identificarla como palabra; seguridad   器只看到这个网格──

结果:GPT-4、Gemini、Claude、Llama-2、GPT-3.5 全部失败──En su punto de referencia 子集上, la tasa de éxito del ataque supera el 75%──

### ¿Por qué el estándar de defensa falla?

- **PPL（perplexity filter）。**El arte ASCII  tiene una alta perplejidad, pero todas las nuevas entradas también.
- **Paraphrase。**Para hacer rápidamente parafraseas, se destruye el arte de ASCII.
- **Retokenization。**En diferentes formas de desglosar Token, no cambia el modelo de identificación visual que está identificando la forma de letra.

根本问题在于,安全过器处于Token或语义层面;ArtPrompt 作用于视觉识别层面──

### Indicador de referencia de ViTC

识别非语义视觉提示──衡量模型读取 ASCII-art、wingdings 和其他非文本语义视觉内容的能力──ArtPrompt's eficacia y precisión ViTC 相关:模型越擅长读取视觉文本,ArtPrompt 在它上越有效── es una medida de la capacidad y la seguridad──

### EstructuralSleight

泛化 ArtPrompt:Uncommon Text-Encoded Structures (UTES) ――树、图、嵌套 JSON、CSV-in-JSON、diferente estilo de bloqueo de código―. Si una estructura en seguridad entrenamiento de datos es rara, pero se puede analizar por el modelo, puede ocultar contenido nocivo―.

防御含义: seguridad debe poderse generalizar a un modelo resuelvable de la representación estructural.

### Modularidad de imagen 类比

Los LLM visuales ((GPT-5.2、Gemini 3 Pro、Claude Opus 4.5、Grok 4.1) han ampliado el ataque.

### Está en la fase 18

Lecciones 12-14  describieron tres tipos de ataques correctos Vector:代 refinement(PAIR) 、contexto longitud(MSJ) y codificación(ArtPrompt/StructuralSleight)  Lección 15 de un ataque centrado en el modelo a un ataque de tipo transversal hacia un sistema de bordes  Inyección indirecta de un instante)  Lección 16  describir herramientas de defensa 


```figure
al-ascii-cloak
```

## Usalo

`code/main.py`Construir un juguete ArtPrompt. Puede usar glifos ASCII-art  falsificar preguntas nocivas 中中的特定词,验证伪装后的字符串能通过关键字过器,并且(可选) con un simple reconocedor 将伪装后的字符串解码回来──

##  entregarlo

本课会产出                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `outputs/skill-encoding-audit.md` Proporcionar un informe de defensa de jailbreak, que cubrirá hasta la codificación de ataques familiares  ASCII art  base 64  leet-speak  UTF-8 homoglif  Utes) y capturar cada tipo de ataque de la capa de defensa 

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`◊ Verificación de las letras falsas puede pasar por un simple filtro de palabras clave.

2. 实现第二种编码:对同一个目标词使用base64──比较它对 ArtPrompt的过率 和恢复难度──

3. 阅读 Jiang et al. 2024 Sección 4.3 ((五模型结果) 』 propone una razón, explica por qué Claude en el mismo benchmark arriba de ArtPrompt-resistencia superior a Gemini。

4.  diseñar una pre-generación  defensa, para la prueba de la solicitud 中 ASCII-art-shaped 区域──在合法代码、表格和数学记号上衡量虚阳性率──

5. StructuralSleight ha enumerado 10 tipos de estructuras codificadas. Se ha elaborado una que pueda tratar todas las 10 formas de defensa generalizada de las estructuras, y se ha estimado el costo de cálculo de cada instante de protección.

## 关键术语: "El hombre es un hombre"

| 术语 | 人们怎么说 | 它实际意味着什么 |
|------|-----------------|------------------------|
| ArtPrompt | "ASCII-art attack" | 使用 ASCII-art 渲染遮蔽安全词的两步 jailbreak |
| Cloaking | "隐藏这个词" | 用模型能读取但过滤器读不到的视觉表示替换被禁止的 Token |
| UTES | "不常见结构" | Uncommon Text-Encoded Structure — 树、图、嵌套 JSON 等，用于夹带内容 |
| ViTC | "visual-text capability" | 衡量模型读取非语义视觉编码能力的 benchmark |
| Perplexity filter | "PPL defense" | 拒绝高 perplexity 的 prompt；会失败，因为合法结构化输入也会得到高分 |
| Retokenization | "tokenizer shift defense" | 用不同的 Tokenizer 预处理 prompt；会失败，因为识别是视觉层面的 |
| Homoglyph | "外观相似字符" | 看起来与拉丁字母相同的 Unicode 字符；绕过 substring 检查 |

## 延伸阅读

- [Jiang et al. — ArtPrompt (ACL 2024, arXiv:2402.11753)](https://arxiv.org/abs/2402.11753) ASCII-art jailbreak 论文
- [Li et al. — StructuralSleight (arXiv:2406.08754)](https://arxiv.org/abs/2406.08754) UTES 泛化
- [Chao et al. — PAIR (Lesson 12, arXiv:2310.08419)](https://arxiv.org/abs/2310.08419) 互补的代攻击
- [Anil et al. — Many-shot Jailbreaking (Lesson 13)](https://www.anthropic.com/research/many-shot-jailbreaking) 互补的长度攻击
