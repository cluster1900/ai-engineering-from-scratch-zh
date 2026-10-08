# Emu3: para geração de imagens e vídeos Próxima previsão de toques

> BAAI's Emu3(Wang et al., 2024 年 9 月) é o resultado de uma disputa de difusão e autoregressiva 之争的2024年本应终结 Diffusion与 autoregressive 之争的结果── um único Transformer de decodificador de estilo Llama, apenas em previsão de tokens próximos 目标上训练, abrangendo texto + tokens de imagem VQ + tokens de vídeo 3D VQ 统一词汇, derrotando SDXL na geração de imagens, derrotando LLaVA-1.6── no sentido de perda CLIP── no cronograma de difusão não há orientação livre em razões para melhorar a qualidade, mas é o objetivo do treinamento central que leva o professor a fazer a previsão de tokens próximos── publicado em Natureza── em livro de discussão sobre o Emu3 , que é o motivo de um melhor token de escala, e tudo o que você pode ler sobre a sua difusão, será comparado com o método de leitura.

**Type:** Learn
**语言：**Python(stdlib,3D vídeo tokenizer matemática + autoregressivo esqueleto de amostra)
**Prerequisites:** Phase 12 · 11（Chameleon）
**Time:** ~120 分钟

## Objectivo de aprendizagem
- Explicação de por que a única perda do token seguinte do Emu3  objetivo pode funcionar, apesar de que desde o longo prazo as pessoas têm continuado a supor que a qualidade de imagem precisa de difusão.
- Descrição de 3D Video Tokenizer:Spacetemporal VQ Codebook 是什么样子,为什么补丁 会跨越时间──
- Comparar Emu3 com a Estabilidade de Diffusão XL em formação computação 
- Dizer que o modelo é um Emu3 扮演的三个角色:Emu3-Gen(image gen) 、Emu3-Chat(percepção) 、Emu3-Stage2(video gen) 。

## 问题
截至2024年的传统观点是:图像生成需要 Diffusion──其论点是:图像代币会丢失太多信息,无法重建细节,而autoregressive sampling会在数千代币上累积差──稳定 Diffusion、DALL-E 3、Imagen、Midjourney 都使用某种形式的 Diffusion──Chameleon(Lesson 12.11) Refutava parcialmente esta ideia em pequena escala, mas não alcançou a SDXL──

Emu3 está enfrentando o desafio deste argumento. O seu principal desafio é: melhor Tokenizer visual + tamanho suficiente + perda de token seguinte = em um modelo também capaz de fazer percepção, alcançar a geração de imagens de difusão.

Foi publicado em 2005, mas foi muito controverso. Dois anos depois, a família de geração unificada (Emu3、Show-o、Janus-Pro、Transfusion) tornou-se um caminho de estudo padrão; modelos de produção de nível fronteiriço parecem também usar algum tipo de variação.

## 概念
### O tokenizer Emu3

关键成分是视觉Tokenizer──Emu3 训练一个定制 IBQ-class Tokenizer(Inverse Bottleneck Quantizer,SBER-MoVQGAN family), cada token fazer 8x8 resolução-reduction──一张 512x512 图像会变成64x64 = 4096 tokens, código size 为 32768──

Este comparado com o Camelão em K=8192 时每张 512x512 1024 tokens maiores, mas cada Token mais barato(Menos buscas de código-boco, mais simples de codec)  Key indicator: Reconstruir PSNR em 30,5 dB, capaz de lidar com o espaço latente contínuo de 32 dB de Diffusão Estavel 竞争──

对于视频:3D VQ Tokenizer vai criar um patch espaciotemporal(4x4x4 pixels) codificado para um número inteiro―um clip de 4s,8 FPS, tem 32 quadros; em 256x256、4x espacial e 4x redução temporal 下,Token 数量为 (256/4) * (256/4) * (32/4) = 64 * 64 * 8 = 32,768 tokens―

O Tokenizer 質量就是上限──Emu3 贡献部分在于我们训练了一个非常好的 Tokenizer──

### Formação de perda única

Emu3 utiliza um objetivo: em tokens de texto, tokens de imagem 2D e tokens de vídeo 3D, o vocabulário compartilhado é o mesmo.

訓練資料混合包括:
- Gênero de imagem:`<text caption> <image> image_tokens </image>`
- Percepção de imagem:`<image> image_tokens </image> <question> text_tokens`
- Gênero de vídeo:`<text caption> <video> video_tokens </video>`
- Percepção de vídeo: similar。
- Apenas texto: NTP standard。

模型会从数据分布中学习何时输出图像代币何时输出文本代币―― gerar capacidade de produção de modelos em `<image>`标签后预测 imagem de tokens

### Orientação sem classificador 和 temperatura

Autoregressivo 图像生成在推理时使用分类器-free guidance(CFG) 会好很多──Emu3 utilizó:生成两次,一次使用完整标题,一次使用空标题,然后使用指导权重 混合 logits(典型值 3.0-7.0)──这是 Diffusion 使用的同一个CFG 技巧,借用到了autoregressive 设置中──

Temperatura  muito importante: muito alta produz falsas imagens; muito baixo modo de colapso.

### Três papéis, um modelo

Emu3 é distribuído em três funções diferentes, mas o fundo é um conjunto de pesos:

- Emu3-Gen──图像生成──输入文本,输出图像代币──
- Emu3-Chat──VQA 和 subtítulos──输入图像(tokens),输出文献──
- Emu3-Stage2──video produção e vídeo VQA──输入文本或视频,输出文本或视频──

Não há cabeças específicas de tarefas. Apenas diferentes modelos de prompt.

### Indicadores de referência

Do artigo da Emu3 ((2024 年 9 月):

- 图像生成:在 MJHQ-30K FID(5.4 vs 5.6)、GenEval geral(0.54 vs 0.55,统计上打平)
- 图像感知: 在 VQAv2(75.1 vs 72.4) 上超过 LLaVA-1.6, 在 MMMU 上大致持平──
- 视频生成:4-second-clip 质量在 FVD 上与 Sora-era Public benchmarked models 具备竞争力──

Estes números não são sempre vencedores, Emu3 vai estar aqui mais, mais, menos, mas a previsão do próximo token é tudo o que você precisa.

### Custo de cálculo

Emu3 utiliza modelo de parâmetro 7B, em cerca de 300 bilhões de tokens multimodal 上 тренинг。GPU-hores 大致相当于Llama-2-7B pré-entrenamento(A100-class silicon 上 2k-4k GPU-years)。Stable Diffusion 3 这样 Diffusion models 训练预算类似,但需要独立的文本编码和更复杂的管道──

推理时,Emu3 Cada imagem em comparação com SDXL 慢:4096 tokens de imagem, com 30 tok/s 计算, aproximadamente cada imagem 512x512 图像 2 分钟, enquanto SDXL é de 2-5 秒── 推理时,Emu3 Cada imagem em comparação com SDXL 慢:4096 tokens de imagem, com 30 tok/s 计算, aproximadamente cada imagem 512x512 图像 2 分钟, enquanto SDXL é de 2-5 秒── 推算解解解解和 KV-cache 优化 会缩小差距,但无法消除差距── Autoregressive image gen 计算量很大;这是目前的固定取舍──

### Por que é importante

Emu3 contribui profundamente conceptual. Se a previsão de tokens próximos puder se expandir para a produção de imagens de correspondência, então um modelo unificado é possível.

Show-o、Janus-Pro 和 InternVL-U foram construídos sobre este ponto de vista, ou para o desafiar. Até 2025, a China Laboratory (BAAI、DeepSeek) publicará nesta direção mais ativamente do que a Laboratory of America (USA).


```figure
l5-emu3-next-token
```

## Use-o
`code/main.py`Construir duas peças de brinquedo:

- Um Tokenizer VQ 2D vs 3D 数量计算器:给定: ((resolução, parche, comprimento de vídeo, FPS), calcular imagens e vídeos
- Uma guia sem classificador e um amostragem de imagem autoregressiva de temperatura.

CFG 实现 配方一致与Emu3,即使用指导权 混合条件和无条件逻辑──

## Entrega-o
本课产 出 `outputs/skill-token-gen-cost-analyzer.md` determinar uma especificação de produção de produtos (图像或视频、目标分辨率、质量层、延迟预算), que calculará o número de tokens、 estimando os custos, e faz uma escolha entre a família Emu3 e a difusão 

## 练习
1. Em uma redução de 8x8, cada imagem produz 4096 tokens.

2. 阅读Emu3 Seção 3.3 中关于视频代币器的内容──描述3D VQ patch shape,以及为什么它是4x4x4而不是8x8x1──

3. Peso de orientação livre de classificador 5.0 vs 3.0: efeitos visuais: Qual a variação?`code/main.py`Processo matemático.

4.  calcular Emu3-7B em tokens 300B 下的训练 FLOPs,并与稳定扩散3比较──哪个训练成本更高?

5. Emu3 em FID acima ultrapassa o SDXL, mas em VQAv2 acima não é como os VLM especializados.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Next-token prediction | "NTP" | 标准 autoregressive loss：给定 token[0..i] 预测 token[i+1]；tokenized 后适用于每种 modality |
| IBQ tokenizer | "Inverse bottleneck quantizer" | 一类 VQ-VAE，codebooks 更大（32768+），重建效果优于 Chameleon 的 Tokenizer |
| 3D VQ | "Spatiotemporal quantizer" | 由（time、row、col）索引的 codebook；一个 Token 覆盖一个 4x4x4 pixel cube |
| Classifier-free guidance | "CFG" | 用 weight gamma 混合 conditional 和 unconditional logits；在推理时提升图像质量 |
| Unified vocabulary | "Shared tokens" | Text + image + video 都来自同一个 integer space；模型预测接下来出现的任何 modality |
| MJHQ-30K | "Image gen benchmark" | 含 30k prompts 的 Midjourney-quality benchmark；Emu3 在这里报告 FID |

## 延伸阅读
- [Wang et al. — Emu3: Next-Token Prediction is All You Need (arXiv:2409.18869)](https://arxiv.org/abs/2409.18869)
- [Sun et al. — Emu: Generative Pretraining in Multimodality (arXiv:2307.05222)](https://arxiv.org/abs/2307.05222)
- [Liu et al. — LWM (arXiv:2402.08268)](https://arxiv.org/abs/2402.08268)
- [Yu et al. — MAGVIT-v2 (arXiv:2310.05737)](https://arxiv.org/abs/2310.05737)
- [Tian et al. — VAR (arXiv:2404.02905)](https://arxiv.org/abs/2404.02905)
