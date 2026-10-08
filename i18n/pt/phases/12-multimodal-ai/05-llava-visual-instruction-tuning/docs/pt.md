# LLaVA com a sintonia de instruções visuais

> LLaVA(4 de abril de 2023) é a mais replicada arquitetura multimodal da Terra. Ele substituiu o Q-Former do BLIP-2 com MLP de 2 camadas, com uma simples concatenação de tokens. Substituiu a atenção cruzada fechada do Flamingo e fez 158 mil instruções visuais para treinar. Estes dados foram gerados por GPT-4 a partir de capções de textos puros.

**类型：**Construção
**语言：**Python(stdlib、projector + constructor de instruções-template)
**先修：**Fase 12 · 02(CLIP),Fase 11(LLM Engenharia  sintonização de instruções)
**时间：**- 180 minutos.

## Objectivo de aprendizagem

- Construir um projeto MLP de 2 camadas, vai ViT patch Embedding(dim 1024)映射到 LLM 的 Embedding dim(dim 4096)。
- 走通 LLaVA receita em duas etapas:(1) em pares de legendas 558k 上做 projetor alinhamento,(2) em 158k GPT-4-generado viradas 上做 instrução visual sintonização。
- 构建一个LLaVA-format prompt,包含图像Token placeholder、system prompt 和 user/assistant turns──
- 解释为什么社区从Q-Former 转向MLP,尽管Q-Former 在代币预算上有优势──

## 问题

BLIP-2 de Q-Former(Lessão 12.03) colocar uma imagem comprimida em 32 Token──干净、高效、ベンチマーク 表现好── mas tem dois problemas──

Primeiro, Q-Former é treinável, mas sua perda não é a tarefa final.

Segundo, Q-Former tem 188M parâmetros, e na escala de 2023 do LLaVA, você deve colocá-lo e o objetivo LLM 一起协同设计――换 LLM, você deve re-treinar Q-Former――换视野编码器, também deve re-treinar―― cada conjunto é um projeto de I & D independente――

LLaVA's Answer Simple to Embarrassant: Get ViT's 576 Patch Token, deixe cada token passar por um MLP de 2 camadas`1024 → 4096 → 4096`), então coloque todos os 576 个都塞 vào序列 do LLM. Não há botelhas. Não há pré-treino em fase 1 baseado em um objetivo estranho.

O GPT-4 é um sistema de instrução de texto (ou de texto) para gerar dados de instrução.

Resultado: um em 8 张 A100 上运行一天、在MMMU 上击败 Flamingo、并发布社区可扩展的开放检查点的VLM── até o final de 2023, já tinha gerado 50+ garfos──

## 概念

### Arquitetura

LLaVA-1.5 em 13B:
- Encoder de visão: CLIP ViT-L/14 @ 336(fase 1 结,fase 2 可选解)
- Projector: MLP de 2 camadas de ativação de GELU,`1024 → 4096 → 4096`- Não.
- LLM: Vicina-13B (mais tarde é Llama-3.1-8B)

图像 + 文本 prompt 的 pass para frente:

```
img -> ViT -> 576 patches of dim 1024
patches -> MLP -> 576 tokens of dim 4096
prompt: system + "<image>" placeholder + user question
replace <image> token with the 576 projected tokens
feed the full sequence to the LLM
decode response
```

Em 2048 contextos, o texto ainda resta 1472 Token. Em 32k contextos, isso é apenas um erro.

### Fase 1: Alineação do projector

结 ViT──结 LLM──只训练 2-layer MLP──Dataset:558k imagem-caption pares(LAION-CC-SBU)──Loss:在 projetado imagem Token 条件下,对 caption 做语言建模──

Em lote 128                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

### Fase 2: sintonização das instruções visuais

解 projector (?? 還可訓練) ――解 LLM (?? 解 LLM)  通常全量,有時使用LoRA)──在158k visual-instruction turns 上訓練──

Os dados de instrução são os principais métodos de produção:
1. - Não, não.
2. 提取文本描述(5 条 personagens + lista de caixa de limites)
3. Usar três modelos de envio de resposta para GPT-4:
   - Conversa: Generar um segmento de usuário e assistente A volta da imagem para o diálogo.
   - 详细描述: Dê uma rica e detalhada descrição da imagem.
   - 复杂推理: apresentar uma pergunta que precisa ser feita de acordo com a imagem, e então responder-lhe.
4. Para resolver o problema, o GPT-4 é um sistema de informação e de informação.

O processo inteiro não foi diretamente contato com imagens  apenas contato com texto descrição  GPT-4 会 halucinar 合理的图像内容── há algum ruído, mas funcionou: 158k voltas 足以解锁对话能力──

### Por que a comunidade replicou este programa

- 没有调调调的阶段-1具体损失――全程使用 LM损失――
- O projeto é treinado em horas, não em dias.
-  através de apenas re-treinar projector, podemos substituir LLM  LLaVA-Llama2、 LLaVA-Mistral、 LLaVA-Llama3) 
- O custo de reproduzir dados de instrução visual é muito baixo, utilizando o GPT-4, e para novos domínios.

### LLaVA-1.5 Com LLaVA- NEXT

LLaVA-1.5(2023 年 10 月)加入:
- • "Acompanhar os dados académicos" (VQA、OKVQA、RefCOCO)
- Melhor sistema rápido.
- 2048 → 32k contexto

LLaVA-NEXT(2024 年 1 月)加入:
- AnyRes:把高分辨率图像切成2x2或1x3 网格的336x336 crops,再加一个全球低分辨率小图片──每种 crop 变成576 个标签;每张图像总计约2880 个视觉标签──OCR和图表 任务大幅提升──
- Utilize ShareGPT4V ([[高质量GPT-4V captions) ]]) de melhor mistura de dados de instrução.
- Mais forte do LLM base ((Mistral-7B、Yi-34B) ⋅

### LLaVA-OneVision

Lição 12.08 会深入讲 OneVision──简短版:同一个投影机,但用一个课程 训练,在一个模型中覆盖单图片、多图片 和视频,并共享视觉标标预算──

### Comparar com Q-Former

| | Q-Former（BLIP-2） | MLP（LLaVA） |
|---|---|---|
| 每张图像的 visual Token | 32 | 576（base）或 2880（AnyRes） |
| 可训练参数 | 188M + LM | 40M + LM |
| Stage 1 loss | ITC+ITM+ITG | 仅 LM |
| LLM drop-in | 需要重新训练 | 最小重新训练即可替换 |
| Multi-image | 别扭 | 自然（concat） |
| Video | 别扭 | 自然（per-frame concat） |
| Token budget | 小 | 大 |

MLP 赢在简单性和 Token 灵活性──Q-Anterior 赢在 Token orçamento── até o final de 2023, o orçamento de Token  já não é mais um limite(contextos LLM  cresceram para 32k-128k+), simplesmente 赢在 Token orçamento──

### Formatos de execução

```
A chat between a curious human and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the human's questions. USER: <image> Describe this image in detail. ASSISTANT: The image shows ...
```

`<image>`Antes da tokenização, ele será substituído por 576 Tokens visuais (AnyRes) para 2880 (Tokenizer) para que a sequência de tokenização seja um pouco mais longa do que a sua formação, mas o LLM pode processar essa nova entrada, pois a fase 1 já a ensinou.

### 参数经济性

LLaVA-1.5-7B
- CLIP ViT-L/14 @ 336:303M(fase 1 结,fase 2 normalmente解)
- Projector ((2x linear): ~ 22M 可训练──
- Llama-7B:7B:
- 总计:7.3B params──fase 2 期间可训练:完整 7B + 22M projector──

Esta é a razão pela qual a LLaVA se espalhou.


```figure
mm-llava-projector
```

## Use-o

`code/main.py`实现:

1. 純 Python 中的 2 layers MLP projector(escala de brinquedo 下 dim 16 → 32 → 32)。
2. Projeto de construção de toros: sistema de execução + 用 N 个 projetado Token 替换 `<image>`+ turno de utilizador + colocador de geração assistente。
3. Um visualizer, usado para mostrar um bloco visual de 576 tokens em contexto LLM

## Entrega-o

本课产 出 `outputs/skill-llava-vibes-eval.md` Dado um ponto de verificação de família LLaVA, ele vai executar uma suite de vibrações de 10 velocidades  3 subtítulos  3 VQA  2 raciocínio  2 recusa), e relatar um cartão de pontuação humano-leitor  Não é um benchmark; mas um teste de fumaça, para confirmar o projeto e o LLM                                                                                                                                                                                                                                                                                                                                                                                                                                  

## 练习

1. 计算 `1024 → 4096 → 4096`Com GELU e bias, que proporção ocupa o LLaVA-13B?

2. Para um caso de recusa, construção de um pedido de LLaVA, que contém imagens de indivíduos privados, escreve uma resposta de assistente esperada, por que o LLaVA deve recusar essa solicitação?

3. 阅读 LLaVA-NeXT blog 的 AnyRes 部分──计算一张 1344x672 图像在 AnyRes 下的视觉代币计量──与 336x336 下的基 576代币对比──

4. LLaVA fase-1 projector Use captions 上的 LM loss 训练──若跳过阶段1,直接进入阶段2(视觉指令调整),会发生什么?引用Prismatic VLMs ablation(arXiv:2402.07865)作答──

5. LLaVA-Instruir-150k usando GPT-4 e COCO captions 生成指示── para um novo campo(radiografia médica、imagem por satélite), descrever a geração de instruções de domínio de quatro etapas do pipeline de dados── cada passo possivelmente sair quais problemas?

## 关键术语

| 术语 | 人们的说法 | 它实际上的含义 |
|------|----------------|------------------------|
| Projector | “MLP bridge” | 带 GELU 的 2-layer MLP，将 ViT dim 映射到 LLM dim |
| Image Token | “<image> placeholder” | Prompt marker，在 inference 前被 N 个 projected visual Token 替换 |
| Visual instruction tuning | “LLaVA stage 2” | 在 GPT-4-generated（image, instruction, response）triplets 上训练 |
| Stage 1 alignment | “Projector pretraining” | 冻结 ViT 和 LLM，用 captions 上的 LM loss 训练 projector |
| AnyRes | “Multi-crop tiling” | 将高分辨率图像切分为 tile grid，并拼接每个 tile 的 visual Token |
| LLaVA-Instruct | “GPT-4-generated” | 从 COCO captions + GPT-4 合成的 158k instruction-response pairs |
| Vision encoder freeze | “Backbone locked” | CLIP weights 在 stage 1 不更新，有时在 stage 2 也不更新 |
| ShareGPT4V | “Better captions” | 由 GPT-4V 生成的 1M dense captions，用于更高质量 alignment |
| VQA | “Visual question answering” | 回答关于图像的自由形式问题的任务 |
| Prismatic VLMs | “Design-space paper” | Karamcheti 2024 ablation，系统测试 projector 和 data choices |

## 延伸阅读

- [Liu et al. — Visual Instruction Tuning (arXiv:2304.08485)](https://arxiv.org/abs/2304.08485) LLaVA 论文。
- [Liu et al. — Improved Baselines with Visual Instruction Tuning (arXiv:2310.03744)](https://arxiv.org/abs/2310.03744) LLaVA-1.5。
- [Chen et al. — ShareGPT4V (arXiv:2311.12793)](https://arxiv.org/abs/2311.12793) subtítulos densos 数据集。
- [Karamcheti et al. — Prismatic VLMs (arXiv:2402.07865)](https://arxiv.org/abs/2402.07865) ablações de design-espaço。
- [Li et al. — LLaVA-OneVision (arXiv:2408.03326)](https://arxiv.org/abs/2408.03326) 统一的单图、多图、视频──
