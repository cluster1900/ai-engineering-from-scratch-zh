# 文档与图表理解

> O documento não é uma foto;. PDF, artigos científicos, embaixamentos ou cartas de escrita. Só contém layout, diagramas, notas, páginas e estruturas de texto, estas são imagens comuns que não podem ser capturadas. A pilha anterior do VLM é um pipeline:Tesseract OCR + LayoutLMv3 + 表格抽取演学学――VLM 浪潮使用OCR-free models 取代它――Donut (2022) Nougat (2023) DocLLM (2023) Modelos 能直接输出结构化标签── até 2026 anos, prática já é apenas 把页面图像以 2576课堂原生方式方式输入 Claude Opus 4.7, 结构化标签输出这些都得到自然本本本.

**Type:** Build
**Languages:** Python (stdlib, layout-aware document parser skeleton)
**Prerequisites:** Phase 12 · 05 (LLaVA), Phase 5 (NLP)
**Time:** ~180 minutes

## Objectivo de aprendizagem

- 解释文件 AI 的三个时代:OCR pipeline、OCR-free、VLM-native──
- 描述 LayoutLMv3 的三类输入流:文本、layout(bbox)、image patches,以及统一 masking──
- Comparar Donut(Legislação de imagem livre de OCR,imagem → marcação)、Nougat(科学论文 → LaTeX)、DocLLM(layout-aware generative)、PaliGemma 2(VLM-native)。
- Para um novo trabalho, escolher um modelo de documento ([[发票]], [[科学论文]], [[手写表单]], [[中文票据]]).

## 问题

 Comprender este PDF  tem dificuldade fraudulenta.

- 文本内容(90% 的信号)
- Layout (página 5 do código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de
- 表格(行、列、合并单元格)
- 图形和图表──
- Escrevi-o em vários números.
- 字体与排版(标题 vs 正文) 』

O OCR inicial vai cair para fora do texto, mas perde o resto de informações.

## 概念

### Era 1  OCR pipeline(2021 年前)

经典 stack:

1. PDF → Cada página imagem
2. Tesseract (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract)) (Tesseract)) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tesseract) (Tess) (Tess) (Tess) (Tess) (Tess) (Tess) (Tess) (Tess) (Tess) (Tess) (Tess) (Tess) (Tess) (Tess) (Tess) (Tess) (Tess) (Tess) (Tess) (Tess) (Tess) (Tess) (Tess) (Tess) (Tess) (Tess) (Tess) (Tess
3. Analista de layout 识别 blocks (título, tabela, parágrafo)
4. Reconhecedor de estrutura de tabela 解析表格。
5. Regras de domínio + regex 抽取字段。

适用于干净的印刷文本――遇到手写、倾斜扫描、复杂表格、非英语文字会崩―― cada modo de falha precisa de um caminho de exceção autodeterminado―

### TrOCR (2021)

TrOCR(Li et al., arXiv:2109.10282) usou um transformer encoder-decoder em sintetizado + 真实文本图像上训练, substituindo o clássico CNN-CTC  Tesseract.

### Era 2  livre de OCR(2022-2023)

O primeiro grupo de modelos sem OCR é: completamente saltar sobre a detecção, diretamente colocar pixels de imagem 映射为结构化输出──

Donut ((Kim et al., arXiv:2111.15664):
- Transformador de codificação-decodificação, o codificador é Swin-B.
- output pode ser usado para exibir JSON de simples entendimento 、 para extrair o marcador, ou qualquer esquema de tarefa específica ⋅
- Não há OCR, não há layout, não há detecção.

Nougat ((Blecher et al., arXiv:2308.13418):
- 专门在科学论文上训练──
- 输出是 LaTeX / markdown。
- 处理 equations、多 layout、figures。
- Cada arxiv-parser cidade-modelo usado.

Estes são especialistas, não generalistas.

### LayoutLMv3 (2022)

另一条路线──LayoutLMv3(Huang et al., arXiv:2204.08387) manter OCR, mas incluir compreensão de layout:

- Três tipos de entrada: tokens de texto OCR, dois fichas de limite 2D de cada token, parches de imagem.
- 跨三种 modalidades  mascarado objetivo de formação mascarado texto mascarados patches mascarado layout)
- As tarefas seguintes: classificação, extracção de entidades, tabela QA

LayoutLMv3 é baseado em OCR de compressão de documentos 峰── é muito forte em exibição e emissão── 上游需要 OCR── 上具有最佳VLM 之前准确率──

### DocLLM (2023)

DocLLM(Wang et al., arXiv:2401.00908) é um irmão gerado do LayoutLM.

### Era 3  VLM-nativo(2024+)

As VLMs de 2024 já são boas o suficiente para substituir completamente o pipeline.

- LLaVA-NeXT 336-tile AnyRes  Aplica-se para pequenos arquivos
- Qwen2.5VL de resolução dinâmica 原生處理 2048+ pixels。
- Claude Opus 4.7 支持 2576px 文档。
- PaliGemma 2(2025 年 4 月) é uma série de cursos de literatura e escrita especializada em literatura.

A diferença entre o VLM-nativo e o OCR-pipeline  rapidamente diminuiu. Até 2026 anos, o VLM-nativo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

- Texto de cena ((hand写 + 印刷,混合文字体系) 』
- 包含合并单元格的复杂表格──
- Embedding text文中 matemática equações。
- 带文本批注的数字──

Os canais de OCR continuam a ser utilizados nos seguintes aspectos:

- Pura análise de grande escala de trabalho, de que cada página é muito importante
- O pipeline é confiável.
- 需要可审计 OCR 输出监管环境──

### Claude 4.7 / GPT-5

Em entrada nativa de 2576 pixels, abaixo, VLMs da frente podem realizar uma compreensão de documentos com uma taxa de precisão próxima da humana. Número de referência do início de 2026:

- DocVQA:Claude 4.7 ~95.1,PaliGemma 2 ~88.4,Nougat ~77.3,Layout em tubulaçãoLMv3 ~83。
- ChartQA:Cláude 4.7 ~92,2,GPT-4V ~78。
- VisualMRC:Claude 4.7 ~94

 modelo de fonte fechada  diferença principalmente em resolução e base-LLM  dimensão 7B  modelo de fonte aberta   落后几个点,但正在追赶──

### Equações matemáticas 和 LaTeX 输出

O estudo científico precisa de uma equação latéxica precisa de um método de formação.

2026                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

### Manual

Esta continua a ser a tarefa mais difícil. A mistura de impressão + manuscritos (doutorando, escrevendo, fazendo, fazendo, etc.) é a melhor forma de fazer os canais de OCR em termos de custos.

### 2026 receita

 para os novos projectos de documento-AI:

- Masselha pura impressão:LayoutLMv3 + regras, custo高效──
- 混合文档(科学 + 手写 + 表单):VLM-nativo(PaliGemma 2 ou Qwen2.5-VL)
- 完整 arXiv ingestion:Nougat 处理数学,VLM 处理 figuras。
- 监管场景:OCR pipeline + VLM validator Us 用交叉检查。


```figure
mm-doc-layout
```

## Use-o

`code/main.py`- Não .

- Um tokenizer de layout-consciente da edição de jogos:给定 (texto, bbox) pares, generar LayoutLMv3 风格输入。
- Um gerador de esquema de tarefa de donut 风格:用于表单的 JSON template。
- Comparar OCR-pipeline、Donut、Nougat 和 VLM-native

## Entrega-o

本课产 出 `outputs/skill-document-ai-stack-picker.md` determinar um documento-AI projeto (domínio, escala, qualidade, regulamentação), entre especialistas em OCR e nativos de VLM  fazer escolha 

## 练习

1. O seu projeto é processado 10 milhões de vezes por dia. Qual é o tipo de pilha que pode minimizar o custo por página em uma taxa de precisão de perda?

2. Por que o layout do LMv3 em forma de QA é melhor do que o CLIP-VLMs, mas em cena-texto em performance inferior?

3. Nougat 生成 LaTeX── propôs um caso de teste de Nougat 胜出的 VLM-native 输出在 LaTeX fidelity 上胜过 Nougat 的试用例, bem como um caso de utilização de Nougat 胜出的.

4. 阅读 PaliGemma 2 paper(Google, 2024) ―― Comparado com PaliGemma 1, 提升文档准确率的关键训练数据新增项是什么?

5. design a regulação segura híbrida: OCR pipeline como principal, VLM como secundário cross-check.

## 关键术语

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
