# Janus-Pro: usado para unificar Multimodal 模型的解 Encoder

> 统一 Multimodal 模型存在一种不可避免的张力──理解需要语义特征,即SigLIP或DINOv2 输出矢量,富含概念级信息──生成需要有利于重建代码,即能够重新组合清晰像素的VQ Tokens── Estes dois objetivos não são compativeis em um único Encoder. Janus(DeepSeek,2024 年 10 月) e Janus-Pro(DeepSeek,2025 年 1 月) consideram que o método de modificação é parar de funcionar fortemente.

**类型：**Construir
**语言：**Python(stdlib, roteamento de duplo codificador + sinal de corpo compartilhado)
**先修：**Fase 12 · 13(Transfusão),Fase 12 · 14(Show-o)
**时间：**Cerca de 120 minutos

## Objectivo de aprendizagem
- Explicar por que um único codificador compartilhado irá sacrificar um lado na compreensão de qualidade ou produção de qualidade.
- Descrição de roteamento de Janus-Pro: compreender usando características SigLIP no lado de entrada, gerado em ambos os lados de entrada e saída usando Tokens VQ。
- Tracking fazer Janus-Pro sucesso  enquanto Janus não consegue fazer isso 
- Comparar decoupled (Janus-Pro) ‧coupled-continuous (Transfusion) ‧coupled-discrete (Show-o) 架构──

## 问题
统一模型在理解和生成之间共享 Transformer body──此前的尝试(Chameleon、Show-o、Transfusion) 都在两个方向上使用同一个视觉Tokenizer──这个Tokenizer是一个折中:

- Por outro lado, o que é mais importante é que o valor de um token seja o valor de um pixel.
- Para entender:SigLIP Embeddings 会把"cat" 图像聚到"cat" Tokens 附近,但不能支持良好重建──

Show-o 和 Transfusion, portanto, em uma certa direção pagou um custo de qualidade visível.

## 概念
### 解视觉编码

A estrutura do Janus-Pro é dividida em dois Encoder:

- Comprender caminho. ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞
- 生成路径──输入图像(如果基于已有图像进行条件化)→ VQ Tokenizer → Token IDs → Transformer body──
- 输出生成──Transformer 预测的图像代币 → VQ decoder → pixels──

O corpo transformador é comum. Tudo o que faz o corpo, para cima e para baixo, é de missão específica.

输入通过快速格式 消除歧义:`<understand>`Tag 通過 SigLIP 路由;`<generate>`通過VQ 路由──或路由也可以由任务隐式决定── também pode ser decidido por missão oculta.

### Por que é que é bom?

Perda de compreensão  obter características SigLIP, enquanto o pré-treino estilo CLIP  já está ajustado para se adequar à linguagem 义相似性── modelo de referência de percepção 优于Show-o / Transfusion,因为 características de entrada é mais adequado para esta tarefa──

生成 loss 获得 VQ Tokens, enquanto Tokenizer 已被调优为适合重建──图像质量优于 Show-o,因为 VQ códigos 能干净地组合回像素──

Compartilhamento O corpo transformador vai ver duas formas de entrada distribuída (SigLIP e VQ), e aprender a processar simultaneamente as duas.

### Número de dados: Janus vs Janus-Pro

Janus(原始版,arXiv 2410.13848) introduziu o conhecimento, mas a escala é menor(1.3B params,数据有限) ・Janus-Pro(arXiv 2501.17811) realizou a expansão:

- 7B parâmetros ((相对 1.3B) ⋅
- fase 1 ((alignamento) usando 90M pares de imagem-texto,高于 72M。
- fase 2 (unificada) utilização de 72M,高于 26M。
- fase 3  aumentar 200k amostras de instrução de geração de imagem。

结论是:Janus-Pro-7B 在 MMMU 上匹配 LLaVA(60.3 vs ~58), e GenEval 上超过 DALL-E 3(0.80 vs 0.67)。

### JanusFlow:fluxo rectificado 变体

JanusFlow(arXiv 2411.07975) usou fluxo rectificado 生成路径(continuous) substituído VQ 生成路径──拆分成 SigLIP-for-understanding + rectified-flow-for-generation──质量上限进一步提高──架构仍然是脱码-shared-body──

### Compartilhar o corpo de responsabilidades

O corpo transformador 处理统一序列, mas face à duas espécies de distribuição de entrada.

- Para compreender: consumo SigLIP recursos + texto Tokens → 自回归地输出文本。
- 对生成:消费文字 Tokens +(可选图像 VQ Tokens)→ 自回归地输出图像 VQ Tokens。

Não há pesos específicos de modalidade em cada bloco. É o que você espera ver no interior do Transformer de estilo de texto em Qwen ou Llama.

É interessante que isso significa que o corpo do Janus-Pro pode ser iniciado com um LLM pré-treinado.

### Comparado com o InternVL-U

InternVL-U (Lessão 12.10) é um trabalho posterior para 2026 ano.

- Pre-treino Multimodal Nativo (InternVL3)
- Roteamento de codificador descoplado ((SigLIP em, VQ + difusão é saída)
- 统一理解 + 生成 + 编辑。

InternVL-U irá absorver a estrutura do Janus-Pro em um quadro maior.

### Limitações

解 Encoder vai aumentar a complexidade da estrutura.

对于不需要理解的产品,Janus-Pro 能力过剩,选择 Stable Diffusion 3 / Flux 模型即可──

Para os produtos que são necessários, o Janus-Pro é agora uma referência de estrutura aberta.


```figure
l5-janus-decouple
```

## Use-o
`code/main.py`模拟 Janus-Pro roteamento:

- 两个伪编码器:SigLIP-like (产生256-dim 语义 矢量) 和VQ-like (产生整数码) 
- Um roteador rápido, de acordo com a tag de tarefa 选择 Encoder。
- Uma entidade comum (stand-in), independentemente dos Tokens, a sequência de quaisquer codificadores é processada.
- A partir da fase 1 (alignamento) até à fase 3 (tune de instrução) do cronograma de amostra ponderada 切换──

打印 3 个示例的路由路径:image QA、T2I、image editing──

## Entrega-o
本课会生成 `outputs/skill-decoupled-encoder-picker.md` Dado uma esperança de obter um produto de qualidade e de compreensão na fronteira, ele escolhe Janus-Pro、JanusFlow ou InternVL-U, e dá recomendações específicas de tamanho de dados.

## 练习
1. Janus-Pro-7B em GenEval 上 上超过 DALL-E 3。 Explicar por que um modelo 7B aberto 模型能在生成上匹配边界 专有模型,但在理解上不能──

2. 实现 a função de roteador: given determin prompt text,将其分类为 `understand`Ou `generate`Como é que se trata de "descrever e depois esboçar" tais perguntas?

3. JanusFlow com fluxo rectificado substitui o VQ.

4. propôs a construção de Janus-Pro arquitectura pode ser adicionada através de uma redexposição de um codificador para tratar de quarta espécie de tarefa.

5. 阅读Janus-Pro Section 4.2 sobre o conteúdo da expansão de dados.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Decoupled encoding | "两个 visual encoders" | 每个方向使用单独的 Tokenizer 或 Encoder：理解使用语义向，生成使用重建向 |
| Shared body | "一个 Transformer" | 单个 Transformer 处理任一 Encoder 的输出；没有 modality-specific weights |
| SigLIP for understanding | "语义 features" | CLIP-family vision tower，提供丰富的概念 features，但重建较差 |
| VQ for generation | "重建 codes" | Vector-quantized Tokens，可以干净地 decode 回 pixels |
| JanusFlow | "Rectified-flow variant" | 使用 continuous flow-matching generation head 替代 VQ 的 Janus-Pro |
| Routing tag | "Task tag" | Prompt marker（`<understand>` / `<generate>`），用于选择输入 Encoder |

## 延伸阅读
- [Wu et al. — Janus (arXiv:2410.13848)](https://arxiv.org/abs/2410.13848)
- [Chen et al. — Janus-Pro (arXiv:2501.17811)](https://arxiv.org/abs/2501.17811)
- [Ma et al. — JanusFlow (arXiv:2411.07975)](https://arxiv.org/abs/2411.07975)
- [InternVL-U (arXiv:2603.09877)](https://arxiv.org/abs/2603.09877)
- [Dong et al. — DreamLLM (arXiv:2309.11499)](https://arxiv.org/abs/2309.11499)
