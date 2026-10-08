# Camelão e modelos multimodal de tokens de fusão inicial

> Até agora, cada VLM que já vimos tem um visual em formato de imagem e texto em separado. Token de visão de um codificador de visão, fluindo para um projeto, e depois em LLM. interno em formato de texto.

**类型：**Construir
**语言：**Python(stdlib, tokenizer VQ-VAE + decodificador interligado)
**先修：**Fase 12 · 05, Fase 8 (AI geradora)
**时间：**Cerca de 180 minutos

## Objectivo de aprendizagem

- Explicar por que o vocabulário compartilhado + perda única 会改变模型能力。
- descrição VQ-VAE  como tokenizar imagem 成与Transformer próximo-token objetivo 兼容的离散序列──
- Explicar o treinamento de Chameleon: QK-Norm, colocação de abandono, LayerNorm ordenamento.
- Comparar o método Q-Former do Camelão com o BLIP-2, e descrever seus cenários adequados.

## 问题

Baseado em adaptador VLM(LLaVA、BLIP-2、Qwen-VL) 把文本和图像当作两种不同的东西──文本 Token 经过 `embed(text_token)`- Não .`visual_encoder(image) → projector → ... pseudo_tokens` Modelo tem dois caminhos de entrada e em meio caminho

Três consequências:

1. LLM só pode consumir imagens, não pode exportar imagens.
2. 混合模态文档 (ex.: 文章中段落和图像交换出现) muito diferente: você quer em modelo externo resolver Multimodal 输入, quer串联多次生成──
3. Distribuição de dados e informações sobre o espaço oculto.

Camelão  rejeita esta premissa: imagens são apenas de um conjunto de palavras comuns.

## 概念

### VQ-VAE  Como imagem Tokenizer

Este Tokenizer é um autoencoder de variação quantizada por vetores.

- Encoder:CNN + ViT, vai mapear imagens para o mapa de características espaciais, por exemplo 32x32 个 dim 为 256 的特征――
- Código: um aprendizagem de K 个 Vector 的词表(Chameleon 使用 8192), igual dim 为 256。
- Quantização: para cada característica espacial, através da distância L2 查找最近的代码簿入口──用整数索引──替换连续特征──
- Decodificador:CNN, vai quantizar as características 转回像素──

訓練:VAE reconstrução perda + perda de compromisso + perda de livro de códigos。 índices de livro de códigos 构成图像的离散字母──

Para Chameleon para dizer:一张图像变成32*32 = 1024 个代币, 来源大小为8192 的词表──与文本代币( 来源 LLM 的 BPE 词表,例如 32000)拼接──最终词表:40192──Transformer 看到的是一个序列、一个损失──

### 共享词表

Chameleon's word listing: Textos Token, imagens Token, e modelos separados. Todos os tokens têm um único ID.

É muito importante:`<image>`和 `</image>`标签包住图像 Token 序列──生成时,如果模型输出 `<image>`O software já sabe que os próximos 1024 Tokens são para ser enviados para o decodificador para executar imagens de índices VQ.

### 混合模态生成

Inferência é a previsão do próximo token em um texto.

```
<image> 4821 1029 2891 ... (1024 image tokens) </image>
The cat is orange, sitting on a windowsill...
```

模型自主选择顺序:它可能先生成图像再生成文本,先生成文本再生成图像,或交错生成── mesmo decodificador, mesma perda──

Em comparação, a produção do adaptador VLM é limitada ao texto.

### 训练稳定性:QK-Norm  Dropout  LayerNorm ordenando

O treino de fusão precoce é muito difícil de encontrar.

- QK-Norm──在 Atenção 内部, para consulta 和 projeção de chave 先应用 LayerNorm,再做点产品──防止深层网络中的逻辑大小爆炸──多个2024年后的大模型都使用它──
- Colocação de abandono. Aplicação de abandono, não apenas atenção, mas também MLP. Quando o Gradiente do Token vem de imagem, pode ser dominado, é necessário um melhor padrão.
- LayerNorm ordenando──Razado ramo 上 use Pre-LN(standard practice), reocupando no último bloco de ligação de salto  额外加一个LN── estabilizando o último nível do fluxo gradiente──

 Sem estas habilidades,34B-param Camelão  treinamento em vários pontos de controle  difusão

### Tokenizer de reconstrução

VQ-VAE é um problema. Em 8192 entradas de código-libro, 512x512 imagens são reproduzidas em 26-28 dB.

O Tokenizer é um bom Tokenizer (MAGVIT-v2、IBQ、SBER-MoVQGAN) vai subir ao máximo.

### Camelão vs BLIP-2 / LLaVA

Chameleon ((fuso inicial,共享词表):
- Uma perda, um decodificador.
- Produção de produtos de qualidade
- Tokenizer é a qualidade.
- 成本高:inferência path 上每张生成图像都需要VQ-VAE decoder──

BLIP-2 / LLaVA ((fusão tardia, separada das torres):
- 视觉输入, apenas pode exportar texto.
- 复用 LLM pré-treinado
- Não há nenhum Tokenizer.
- 便宜:单次 前行通行.

Se você precisar de gerar imagens, escolha a família Chameleon. Se você só precisa entender, adaptador-VLM é mais simples, e reutiliza mais computação pré-treinada.

### Fuyu e AnyGPT

Fuyu(Adept,2023) é um método relacionado: completamente saltar um codificador de visão único, colocar patches de imagem originais 像 Token 一样送入 LLM's input projection, não usar Tokenizer──比 Chameleon 更简单, mas perdeu a capacidade de vocabulário compartilhado 输出生成──

AnyGPT(Zhan et al., 2024) colocar o Camelão  expandido para quatro modalidades:文本、图像、语音、音乐──每种模态都使用相同的VQ-VAE 技巧,共享 Transformer──Any-to-any generation──Lesson 12.16 中会进一步介绍──


```figure
vq-codebook
```

## Use-o

`code/main.py`Construir um modelo de fusão inicial de brinquedo de ponta a ponta:

- Um quantizador de estilo VQ-VAE muito pequeno, coloca 8x8 parches 映射到代码簿索引(K=16)。
- Uma palavra de texto: 0..31) + imagem: 32..47) + separadores: 48, 49)
- Uma máquina de descodificação autoregressiva de brinquedos, em seqüências de imagem-tokens
- Um ciclo de amostragem, dado um prompt 后输出交换的文本 + 图像 Token。

O Transformer é muito pequeno, para que possa seguir o fluxo de sinal de ponta a ponta.

## Entrega-o

本课产 出 `outputs/skill-tokenizer-vs-adapter-picker.md` dado especificação do produto (solo entendimento vs entendimento + 生成、 需图像质量、成本预算), ele vai fazer uma escolha entre Chameleon-família (early fusion) e LLaVA-família (late fusion),并用定量经验法则说明理由──

## 练习

1. Camelão utiliza K=8192 个代码簿入,每张 512x512 图像 1024 个代码.

2. Uma imagem 4K (contexto) é a primeira questão que surge é o contexto, a qualidade do tokenizer ou o cache KV?

3. Usar Python puro  implementar QK-Norm ⋅ dar uma consulta de 64 dimensões 和 chave, mostrar LayerNorm ⋅ produto de pontos ⋅ por que é importante controlar magnitude em redes de nível profundo ⋅

4. 阅读Chameleon Section 2.3 中关于训练稳定性的内容――描述论文观察到的34B 模型在没有QK-Norma 时的确实失败模式――"explosion norm" (explosão norma)

5.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| Early fusion | "Unified tokens" | 图像从第一步起就被转换为离散 Token，并共享 Transformer 的词表 |
| VQ-VAE | "Image tokenizer" | CNN + ViT + codebook，将图像映射为 Transformer 可预测的整数 indices |
| Shared vocabulary | "One dictionary" | 覆盖文本 + 图像 + 模态分隔符的单一 Token ID 空间 |
| QK-Norm | "Attention stabilizer" | 在 query 和 key 做 dot product 之前对它们应用 LayerNorm，防止 norm blowup |
| Mixed-modality generation | "Text + image output" | 一次 pass 中自主生成交错文本和图像 Token 的 inference |
| Codebook size | "K entries" | VQ-VAE 可 quantize 到的离散 Vector 数量；在压缩率和 fidelity 之间权衡 |
| Tokenizer ceiling | "Reconstruction limit" | 解码 VQ Token 能达到的最佳 PSNR；限制模型的图像质量 |

## 延伸阅读

- [Chameleon Team — Chameleon: Mixed-Modal Early-Fusion Foundation Models (arXiv:2405.09818)](https://arxiv.org/abs/2405.09818)
- [Aghajanyan et al. — CM3 (arXiv:2201.07520)](https://arxiv.org/abs/2201.07520)
- [Yu et al. — CM3Leon (arXiv:2309.02591)](https://arxiv.org/abs/2309.02591)
- [Zhan et al. — AnyGPT (arXiv:2402.12226)](https://arxiv.org/abs/2402.12226)
- [Adept — Fuyu-8B blog (adept.ai)](https://www.adept.ai/blog/fuyu-8b)
