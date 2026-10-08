# Transfusão: numa Transformadora 中结合 Autoregressivo Texto + Diffusão Imagem

> Chameleon 和 Emu3 把全部筹码押在离散 Token 上──它们能工作,但量化瓶很明显:图像质量会在低于连续空间扩散 模型的位置进入平台期.Transfusion(Meta,Zhou et al.,2024年8月) 押了相反的方向:保持图像连续,完全消除VQ-VAE,并用两个损失 训练一个变体器──文本 Token 使用下一个变体预测──图像补丁 使用流量匹配 /扩散损失──两个目标优化相同权重──稳定扩散 3层架构MMDiT) 读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读

**Type:** Build
**Languages:** Python（stdlib，MNIST-scale 玩具双 loss trainer）
**Prerequisites:** Phase 12 · 11（Chameleon），Phase 8（Generative AI）
**Time:** ~180 minutes

## Objectivo de aprendizagem
- 连接一个在同一脊柱上运行两个损失的变压器(文本 Token 上的NTP,图像补丁 上的扩散 MSE) ⋅
- 解释为什么图像补丁 之间使用双向注意,同时文本代币 使用因果注意,是正确的面具 选择──
- Em cálculo, qualidade e complexidade do código, em comparação com o estilo Transfusão (contínuo) e o estilo Camelão (NTP).
- Explicar contribuições da MMDiT: cada bloco utiliza pesos específicos de modalidade, em corrente residual, para realizar atenção conjunta.

## 问题
离散图像Token与连续图像Token 的争论比LLM 更早──连续表示(píxels VAE latentes)保留细节──离散图像Token(VQ indices) Adaptado transformador de origem词表, mas irá em quantificação passo perdido细节──

Chameleon / Emu3 选择离散路线: 一损失, 一架构,但图像保真度受 Tokenizer 质量限制──

O modelo de difusão escolheu uma linha de contínuo: a qualidade da imagem é muito forte, mas é um modelo separado do LLM, o engenho de montagem de ruído é complexo, e não tem um método de integração limpa com o texto gerado.

A questão que se coloca na transfusão é: ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿

## 概念
### 双 loss 架构

Um transformador de apenas decodificador 处理包含以下内容的序列:

- 文本 Token ((离散, proveniente do vocabulário BPE)
- 图像补丁(连续,16x16 pixel blocks, através de incorporação linear 投影到隐藏 dim,与ViT编码的输入相同)
- `<image>`和 `</image>`标签, usado para marcar o parche de contínuo em seu local.

Passes adiantados apenas para o lançamento de uma vez.

- Sobre o texto Token: в вокаб-логит head 上使用标准交叉
- Para o parche de imagem: em parche de continuidade, a perda de difusão é usada, prévio adição ao ruído de cada parche.

Gradiente 会流经共享的变压器体――两损 同时改进共享权重――

### Mascara de atenção:texto causal + imagem bidireccional

文本 Token 必須是因果的;不能让文本 Token attend 到未来文本,否则老师迫使会被破坏──但图像补丁表示同一个快照;它们应该在同一个图像块内相互双向出席──

Mascarinha:

```
M[i, j] = 1 if:
  (i is text and j is text and j <= i)   # causal for text
  OR (i is image and j is image and same_image_block(i, j))   # bidirectional within image
  OR (i is text and j is image and j < i_image_end)   # text attends to previous images
  OR (i is image and j is text and j < i_image_start)   # image attends to preceding text
```

Em treinamento e meditação, realiza-se a mascareta triangular de bloco.

### Perda de difusão do transformador interno

Perda de difusão é a forma padrão: dar um parche de imagem加噪声,让模型预测噪声(或等价地预测 clean patch) ――Transfusion 的版本使用流量匹配:预测从噪音到清的速度场──

訓練期間:
1. Para cada imagem de parche x0, assim como um passo no tempo.
2. 采样噪声 ε,计算 xt = (1-t) * x0 + t * ε(fluxo de correspondência de 线性插值)
3. transformador 预测 v_theta(xt, t); perda = MSE(v_theta(xt, t), ε - x0)。
4. Com a perda de NTP no mesmo sequência de texto, a Backprop se eleva.

推理时, generar o processo é:
- 文本 Token: standar autoregressive sampling。
- 图像补丁:以此前文本 Token 为条件的扩散样本循环(normalmente 10-30 passos) ⋅

### MMDiT:Difusão estável 3 的变体

Estabilidade de difusão 3 ((Esser et al., 2024 年 3 月) 在与Transfusion 接近的时间发布了MMDiT(Multimodal Diffusion Transformer) ⋅ Estas duas estruturas são同宗分支──

Diferença de função:

- Cada bloco utiliza pesos específicos de modalidade. Cada bloco transformador para texto Token e imagem de parche separadamente Q、K、V 和 MLP 权重. Atenção é conjunto de cross-modalidade.
- Treinamento de fluxo retificado, mais simples que DDPM,
- △MMDiT é a espinha dorsal do SD3 ((2B 和 8B 参数变体) ・Transfusion 论文扩展到7B。

两者汇聚到同一核心思想: um transformador para o texto em execução NTP, para a imagem em execução em execução difusão.

### Por que é que ele venceu o estilo de camaleão

 Continual difusão e NTP em separação na produção de imagens diferença de massa é medível.

- Em 7B, a FID tem um tamanho igual ao estilo camaleão.
- Não precisa treinar Tokenizer: imagem codificador 更简单(projeção linear até oculta, com a camada de entrada de ViT é o mesmo)
- 图像补丁 去噪音可以并行化推理,不像自动降低图像代币──

缺点:Transfusion is double loss 模型, training动态更难――loss weights 需要调参――NTP e difusão 时间表不一致可能导致某头占主导――

### A seguir

Janus-Pro (Lessão 12.15) através de solução para entender e criar um codificador de visão para melhorar a ideia de Transfusão: um usando SigLIP, outro usando VQ, ao mesmo tempo compartilhando o corpo do transformador.

Em 2026 pode produzir imagens em VLMs de produção, como Gemini 3 Pro, GPT-5, Claude Opus 4.7, quase certamente usou uma espécie de geração posterior desta família.


```figure
cfg-guidance-scale
```

## Use-o
`code/main.py`Em um pequeno problema de tipo MNIST, construímos uma transfusão de brinquedos:

- 文本 caption é a descrição de números ((0-9) de短整数序列。
- A imagem é 4x4
- Uma projeção linear de direitos de partilha 充当变压器 替代;文本上使用NTP loss,噪音补丁上使用MSE loss。
- O treinamento é um ciclo de troca de duas perdas, mas a máscara da atenção é evidente.
- 生成在一次前进传中产生文本标题 和 4x4 图片──

Este transformador é de classe de brinquedo.

## Entrega-o
本课产 出 `outputs/skill-two-loss-trainer-designer.md`△ deu-se uma nova tarefa de treinamento multimodal ((文本 + 图像、文本 + 音频、文本 + 视频), ela irá desenhar um cronograma duplo de perda ((peso de perda、mascarete de forma、compartilhada vs blocos específicos de modalidade),并标记实现风险。

## 练习
1. Um treinamento de estilo transfusão contém 70% de tokens de texto e 30% de parches de imagens.

2. Para este processo de realização de bloco-mascaras triangulares:`[T, T, <image>, P, P, P, P, </image>, T]`将每个条目标为0或1──

3. MMDiT tem QKV 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权) 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权 权) 权重 权重 权重 权重 权重 权重 权重

4. 生成:给定一个文本提示,模型先运行NTP 生成50个代币,然后遇到 `<image>`, seguindo em 256 parches , executando 20 passos de difusão de denotação .

5. 阅读SD3论文 部分 3── descrever o fluxo rectificado, bem como por que ele utiliza menos medidas de cálculo do que o DDPM.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Two-loss training | "NTP + diffusion" | 一个 transformer 在同一个 gradient step 中，同时优化文本 Token 上的 cross-entropy 和连续图像 patch 上的 MSE |
| Flow matching | "Rectified flow" | 一种 diffusion 变体，预测从噪声到 clean data 的 velocity field；数学上比 DDPM 更简单 |
| MMDiT | "Multimodal DiT" | Stable Diffusion 3 的架构：joint attention、modality-specific MLPs 和 norms |
| Block-triangular mask | "Causal text + bidirectional image" | 一种 attention mask：跨文本是 causal 的，但在图像区域内是 bidirectional 的 |
| Continuous image representation | "No VQ" | 图像 patch 作为实值 Vector，而不是整数 codebook indices |
| Velocity prediction | "v-parameterization" | 网络输出是噪声与数据之间的 velocity field，而不是噪声本身 |

## 延伸阅读
- [Zhou et al. — Transfusion (arXiv:2408.11039)](https://arxiv.org/abs/2408.11039)
- [Esser et al. — Stable Diffusion 3 / MMDiT (arXiv:2403.03206)](https://arxiv.org/abs/2403.03206)
- [Peebles & Xie — DiT (arXiv:2212.09748)](https://arxiv.org/abs/2212.09748)
- [Zhao et al. — MonoFormer (arXiv:2409.16280)](https://arxiv.org/abs/2409.16280)
- [Xie et al. — Show-o (arXiv:2408.12528)](https://arxiv.org/abs/2408.12528)
