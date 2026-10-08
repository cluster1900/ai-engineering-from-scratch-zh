# ASCII Art e Jailbreaks Visuais

> Jiang, Xu, Niu, Xiang, Ramasubramanian, Li, Poovendran, "ArtPrompt: ASCII Art-based Jailbreak Attacks against Aligned LLMs" (ACL 2024, arXiv:2402.11753) ⋅ em petição prejudicial para ocultar e proteger Token, usar as mesmas letras ASCII-art 染 substituí-los, e enviar este falso pedido posterior ⋅ GPT-3.5GPT-4、Gemini、Claude、Llama-2 都无法稳健识别 ASCII-art Token──该攻击绕过PPL((Retransplicity filters) ⋅ Paraphrase defense和相关的okenization──:ViTC语标识别能力;SightSightSight泛其其其基将稳健识别ASCII-art Token── JSON ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅                          

**类型：**Construir
**语言：**Python (stdlib, arneses de enmascaramento de tokens ArtPrompt)
**前置要求：**Fase 18 · 12 (PAIR), Fase 18 · 13 (MSJ)
**时间：**Cerca de 60 minutos

## Objectivo de aprendizagem

- descrição de ArtPrompt  ataque:identificação de palavras 步骤、ASCII-art 替换、最终伪装后的提示──
- 解释为什么标准防御(PPL、Paraphrase、Retokenization) 会在 ArtPrompt 上失败──
- 定義 ViTC,并描述它衡量什么──
- 将 StructuralSleight 描述为向任意 不常文本编码结构的泛化.

## 问题

通過パラфрази 和 角色扮演(Lessão 12) 以及通過長文脈(Lessão 13) 的攻击,作用于文本层面的模式──ArtPrompt 作用于识别层面:模型没有解析被禁止的 Token──它解析的是由字符染出的图像──安全过器看到的是无害的标点──模型看到的是一个词──

## 概念

### ArtPrompt,两步

Passo 1. Identificação de palavras. Foi dada uma solicitação prejudicial, o atacante usou um LLM para identificar palavras relacionadas com segurança.

Passo 2. Capacitado de Geração Prompt. O modelo recebe uma rede composta por marcas e espaços, um modelo capaz de reconhecê-la como palavra.

Resultado:GPT-4、Gemini、Claude、Llama-2、GPT-3.5 全部失败── em seu índice de referência 子集上, a taxa de sucesso de ataque excede 75%──

### Por que os padrões de defesa falham ?

- **PPL（perplexity filter）。**ASCII art  tem alta perplexidade, mas todas as novas entradas também são assim.
- **Paraphrase。**Para fazer parafrases rápidas, irá destruir a arte ASCII.
- **Retokenization。**Em diferentes formas de separar Token, não mudará a forma visual do modelo de identificação das letras.

根本问题在于,安全过器处于Token或语义层面;ArtPrompt 作用于视觉识别层面──

### Indicador de referência ViTC

识别非语义视觉提示──衡量模型读取 ASCII-art、wingdings 和其他非文本语义视觉内容的能力──ArtPrompt's efficacy with ViTC accuracy 相关:模型越擅长读取视觉文本,ArtPrompt在它上越有效── é uma medida de capacidade e segurança──

### EstruturaSleight

泛化 ArtPrompt:Struturas incomuns de texto-encodadas(UTES) ――树、图、嵌套 JSON、CSV-in-JSON、diferente estilo de blocos de código。 Se uma estrutura em segurança treinamento de dados é rara, mas pode ser analisada pelo modelo, pode ocultar conteúdo prejudicial。

Defensão significa: segurança deve ser generalizada para um modelo resolutivo de representação estrutural.

### Modalidade de imagem 类比

Os LLM visuais ((GPT-5.2、Gemini 3 Pro、Claude Opus 4.5、Grok 4.1) expandiram a face de ataque.

### Está na fase 18 .

Lições 12-14  descreveu três tipos de ataques positivos Vector:代 refinement(PAIR) 、context length(MSJ) ̇ and encoding(ArtPrompt/StructuralSleight) ⋅ Lição 15 ⋅ de um ataque centrado em um modelo ⋅ de um ataque orientado para um sistema


```figure
al-ascii-cloak
```

## Use-o

`code/main.py`Construir um brinquedo ArtPrompt. Você pode usar glifos ASCII-art  falsificar pesquisa prejudicial 中中的特定词,验证伪装后的字符串能通过关键字过器,并且(可选) usando um simples reconhecedor 将伪装后的字符串解码回来──

## Entrega-o

本课会产出 `outputs/skill-encoding-audit.md` dar um relatório de defesa de jailbreak, que irá incluir a cobertura de código de ataque familiar (ASCII art ̇ base 64 ̇ leit-speak ̇ UTF-8 homoglif ̇ UTES) bem como capturar cada tipo de ataque ̇

## 练习

1. 运行 `code/main.py`◊ Verificação de falsos caracteres pode passar por simples filtro de palavras-chave.

2. 实现第二种编码:对同一个目标词使用base64──比较它对 ArtPrompt的过率 和恢复难度──

3. 阅读江 et al. 2024 Seção 4.3 ((五模型结果) 』 propõe uma razão, explicar por que Claude está no mesmo índice de referência acima de ArtPrompt-resistência superior a Gemini。

4. design a pre-generation 防御, para testar o prompt 中 ASCII-art-shaped 区域──在合法代码、表格和数学记号上衡错阳性率──

5. StructuralSleight listou 10 tipos de estrutura de codificação.

## 关键术语

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
