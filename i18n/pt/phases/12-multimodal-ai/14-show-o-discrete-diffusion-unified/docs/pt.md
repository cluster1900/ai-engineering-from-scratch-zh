# Show-o 和 Discreto-Difusão 统一模型

> Transfusão 混合连续和离散表示──Show-o(Xie et al., 2024 年 8 月)走的是另一条路:text tokens 使用因果性下代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代

**Type:** Learn
**Languages:** Python (stdlib, masked-discrete-diffusion sampler)
**Prerequisites:** Phase 12 · 13 (Transfusion)
**Time:** ~120 minutes

## Objectivo de aprendizagem
- Explicação de difusão discreta mascarada: uma forma de fazer mascaras Tokens 再让 Transformer 恢复它们的时间表──
- Desde velocidade e qualidade comparado e decodificação de imagem ((Show-o, MaskGIT) com decodificação de imagem autoregressiva ((Chameleon, Emu3))).
- Exposição em um ponto de controle.
- 选择一种掩盖时间表 ((cosine、linear、truncated),并推理它对样品质量的影响──

## 问题
A formação de duas perdas de transfusão é eficaz, mas a dinâmica é mais complicada: a perda contínua de difusão com a perda de NTP discreta está localizada em diferentes valores.

A resposta do show-o é: manter duas modalidades são separadas, mas através da difusão discreta mascarada e gerar imagens, em vez de gerar em ordem. O objetivo do treinamento se torna uma única previsão de tokens mascarados, que naturalmente se generaliza para a previsão de tokens seguintes.

## 概念
### Dispersão discreta mascarada (MaskGIT)

Origini Chang et al. (2022) 技巧 MaskGIT 技巧很优雅──从一个完全蒙面的图像开始(每个代币都是特殊的`<MASK>`id) ―― em cada passo,并行预测所有蒙面 Tokens,然后保留 top-K 个置信度最高的预测,并重新掩盖 其余部分──大约8-16次代后,所有 Tokens都被填满完成──每一步揭露 多少 Tokens的时间表 需要调优,可西内时间表 效果很好──

訓練很簡單: de [0, 1] 中均采样一个掩饰比率,将其应用到图像的VQ代币上,训练变压器 恢复被掩饰的部分──这是BERT对文字做的事情,只是扩展到图像生成──

### Show-o: um Transformador, máscara híbrida

Mostra-o-á MaskGIT 放进因果语言模型变压器──Máscara de atenção 如下:

- Text tokens:causal (standard LLM)
- Tokens de imagem: в блоке изображения в полностью двусторонний(((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((
- Texto-para-imagem: texto assistir até imagens anteriores, imagem assistir até texto anterior.

訓練在以下任务之间交换:
1. NTP em norma de texto 序列──
2. T2I 样本:text → image, use masked image tokens 和 masked-token-prediction Loss。
3. VQA 样本:image → text, use masked text tokens ((本质上就是 NTP) ⋅

统一 Loss é `<MASK>`Tokens 上的交叉 Entropia,它同时覆盖文字 NTP(只有最后一个 Token被masked) 和图像被masked-diffusion(随机子集被masked) 

### Amostragem paralela

Show-o usando cerca de 16 步骤生成一张图像, em vez de cerca de 1000 步 (cada token autoregressivo) ou cerca de 20 步 (difusão) .

Em relação a:
- Camelão / Emu3(对 Tokens autoregressive):N_tokens 次 前行,通常每张图 1024-4096 次。
- Transfusão: 20 passos, cada passagem é um Transformador completo.
- Show-o(mascarada difusão discreta): aproximadamente 16 步, cada passo uma vez completo Transformer passar。

Em um modelo de tamanho próximo, Show-o é mais rápido do que o camaleão; é grande para se adequar ao número de passos da transfusão, ao mesmo tempo em que o custo por passos é menor.

### Funções num único ponto de controlo

Show-o em sugestão apoiar quatro tipos de tarefas, por formato prompt  seleccionar:

- Geração de texto: Standard autoregressive text output。
- VQA:imagem, mensagem de texto.
- T2I:texto em, através de dispersão discreta mascarada 输出 image。
- Imagem de Tokens mascarados,并填充──

Inpainting 能力来自 masked-prediction 训练,几乎是免费的──mask VQ-token grid 的一个区域,输入其余部分加一个文本提示,预测 masked Tokens──

### Programa de enmascaramento

Cada passo desmascarar 多少 Tokens 的时间表 会塑造质量──Show-o 推 cosine:

```
mask_ratio(t) = cos(pi * t / (2 * T))   # t = 0..T
```

第 0 步, todos os Tokens são mascarados(ratio 1.0)。第 T 步, nenhum Tokens é mascarado。Cosine vai concentrar seu peso em proporções entre áreas, onde prevê a maior quantidade de informações。

### - O2

Show-o2(2025 follow-up, arXiv 2506.15564) expandir Show-o: maior base de LLM, melhor Tokenizer, melhor programa de mascaras, arXiv 2506.15564)

### Onde o Show-o está sentado

Em 2026 Taxonomia Em:

- Tokens discretos + NTP:Chameleon、Emu3──简单但推理慢──
- Tokens discretos + difusão mascarada:Show-o、MaskGIT、LlamaGen、Muse。并行采样,但仍受 Tokenizer lossy 限制。
- Continuidade + Difusão:Transfusão, MMDiT, DiT,
- Continuo + fluxo de correspondência em um VLM:JanusFlow、InternVL-U──最新路线──

按任务选择:当你想在一个开放模型中同时获得T2I + inpainting + VQA,并且速度合理时,选择 Show-o;当质量最重要且你能承担两损管道时,选择 Transfusion。


```figure
masked-diffusion-unmask
```

## Use-o
`code/main.py`模拟 Amostra de exibição:

- Uma grelha de brinquedos contendo 16 tokens VQ.
- Uma simulação de transformador, baseado em instantâneo e atualmente desenmascarados Tokens.
- Utilize cosine schedule fazer 8 步并行 enmascarada amostragem。
- 打印中间状态 (mask pattern evolution)和最终 Tokens──

Operar, observar a máscara, como é que se resolve.

## Entrega-o
本课产 出 `outputs/skill-unified-gen-model-picker.md`△ deu-ti-a um tanto precisa de compreensão (VQA, subtítulos) ∞ precisa de geração (T2I, pintura) ∞ dos produtos, ∞ tem peso aberto ∞, ela vai ser entre a família Show-o ∞ Transfusion/MMDiT família 和 Emu3 / família Camelão ∞ fazer escolha, ∞ dar trade-offs concretos ∞

## 练习
1. Mascarada difusão discreta em cerca de 16 passos para completar a amostra. Por que não 1 passos? Se você desmascarar todo o conteúdo no passo 0, que problema surgirá?

2. Utilize masquerado difusão 时,inpinting 几乎是免费的──提出一个产品用例真实或假设),其中 Show-o de pintura 胜过专业模型──

3. Calendário cosínico vs calendário linear: seguimento T=8 时 cada passo número de Tokens desmascarados.

4. Uma imagem de exibição de 512x512 é 1024 Tokens. Em vocab K=16384 时, modelo output 1024 * log2(16384) = 14,336 bits (cerca de 1,75 KiB) de dados.

5. 阅读 LlamaGen(arXiv:2406.06525) ―― O modelo de imagem autoregressiva condicional de classe do LlamaGen com a abordagem mascarada do Show-o Há alguma diferença?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Masked discrete diffusion | “MaskGIT-style” | 训练模型预测 masked Tokens；推理时，迭代式 unmask 置信度最高的预测 |
| Cosine schedule | “Unmask schedule” | mask ratio 随推理步数衰减；将置信度增长集中在中间区间 |
| Parallel decoding | “All tokens at once” | 每一步用一次 forward pass 预测完整的 masked Token 序列，然后提交 top-K |
| Hybrid attention | “Causal + bidirectional” | 一种 mask：对 text tokens 是 causal，在 image blocks 内是 bidirectional |
| Inpainting | “Fill-in generation” | 以部分 Tokens 被 masked 的 image 为条件，预测缺失部分；从训练目标中免费获得 |
| Commitment rate | “Top-K per step” | 每次迭代中有多少 Tokens 被声明为“完成”；控制推理与质量的 trade-off |

## 延伸阅读
- [Xie et al. — Show-o (arXiv:2408.12528)](https://arxiv.org/abs/2408.12528)
- [Show-o2 (arXiv:2506.15564)](https://arxiv.org/abs/2506.15564)
- [Chang et al. — MaskGIT (arXiv:2202.04200)](https://arxiv.org/abs/2202.04200)
- [Sun et al. — LlamaGen (arXiv:2406.06525)](https://arxiv.org/abs/2406.06525)
- [Chang et al. — Muse (arXiv:2301.00704)](https://arxiv.org/abs/2301.00704)
