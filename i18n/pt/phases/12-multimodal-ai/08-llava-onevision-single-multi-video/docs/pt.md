# LLaVA-OneVision: um modelo de imagens únicas, várias imagens e vídeos

> Antes de lançar o VLM World has a distinct spectrum: used for single image LLaVA-1.5, multi-image model like Mantis 和 VILA, bem como video model like Video-LLaVA 和 Video-LLaMA. Cada um ganhou seu próprio benchmark, mas falhou em outros cenários.

**Type:** Build
**Languages:** Python (stdlib, token budget solver + curriculum planner)
**Prerequisites:** Phase 12 · 05 (LLaVA), Phase 12 · 06 (any-resolution)
**Time:** ~180 minutes

## Objectivo de aprendizagem
- Design a one in single image、 multiple image and video inputs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
- 排列一训练课程, fazer habilidades de um único quadro mudar para o vídeo, ao mesmo tempo evitar esquecimento catastrófico.
- Explica por que, sob a mesma escala de parâmetros, se o currículo for feito corretamente, um único modelo vencerá o modelo especialista.
- Explicar três capacidades emergentes de LLaVA-OneVision  relatório: raciocínio multi-câmera purtando um conjunto de marcas  agente de captura de tela do iPhone

## 问题
图像、多图像和视频会以不同的方式给模型施压──

单图像需要高分辨率 Token ((AnyRes,约2880 视觉代币) para capturar OCR 和细节── cada modelo orçamento: 1 张图像,2880 视觉代币──

Dois imagens precisam de várias imagens de resolução média (cerca de 576 Tokens) para que as imagens sejam concebidas para serem colocadas no contexto.

视频需要许多低分辨率(pooling 后每约196 代币) 后每约196 代币) 后后每约196 代币) 后后每约196 代币) 后后每约196 代币) 后后后每约196 代币) 后后后每约196 代币) 后后后每约196 代币) 后后后后每约196 代币) 后后后后每约196 代币) 后后后后每约196 代币) 后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后

Se você treinar vários modelos independentes, você escolherá um orçamento para cada modelo. Se você treinar um modelo, você precisa fazer com que o orçamento se encolha razoavelmente entre diferentes cenários, ao mesmo tempo em que não pode explodir o contexto.

Em OneVision  anterior, a resposta está em que você treina um cenário, ignorando outros cenários ⋅ Vídeo-LLaVA ⋅ através de um extra treinamento fase transformar a capacidade de vídeo para um modelo de imagem ⋅ LLaVA-NEXT ⋅ através de tijolo ⋅ aumentou o apoio a imagem ⋅ nenhum único pode fazer o tratamento em três pessoas ⋅

## 概念
### OneVision Token  orçamento

LLaVA-OneVision  escolher um conjunto de tokens de vídeo  orçamento, cada amostra cerca de 3000-4000 tokens, distribuídos de acordo com o cenário:

- 单图像:AnyRes-9(3x3 azulejos + miniatura), cada azulejo é 384, contém 729 patches, usando um pooling bilinear de 2x2 → Cada azulejo 182 个 Token。总计:9 * 182 + 182 = 1820 个 Token。或AnyRes-4, cada azulejo 729 个 Token = 2916 + 729。
- 多图像:每张图像使用中等分辨率(384,不 ??),729 个 Token,不聚焦──预算为6 张图像 → 4374 个 Token──
- 视频:32 ,384 分辨率,使用激进的 3x3 bilinear pool → 每 81 个 Token──总计:32 * 81 = 2592 个 Token──

Esta distribuição faz com que o total de tokens num grande número permaneça constante. LLM nunca verá batches de contexto de explosão.

### 3o ciclo

LLaVA-OneVision, três fases de treinamento:

1. 单图像 SFT(stadium SI) ―― todos os dados são de imagem única-mais-texto── utilizam alta resolução AnyRes 输入训练──这会教会模型感知、OCR 和细粒度理解── utilizam LLaVA-NeXT 数据加上 OneVision-specific 单图像数据──
2. OneVision SFT(estágio OV)。混合单图像 + 多图像 + 视频(均采样)。在统一代币 预算上训练。这会教会模型处理异构批形──不重置权重,而是从阶段 SI 继续──
3. Transferência de tarefas (Tase TT) ⋅ Continuar a utilizar o conjunto de tarefas-alvo, normalmente em função do produto que necessita de imagens ou vídeos.

O currículo  sequência é importante. Mesmo usando os mesmos dados, primeiro treinar vídeos ou primeiro treinar várias imagens, também terá melhor desempenho de imagem do que antes treinar imagens únicas.

### Por que o currículo é eficaz

单图像训练建立感知基础──Patch Token 携带细粒度视觉特征;LLM 学会把它们与文本整合──多图像和视频引入结构性挑战(哪张图像是哪张,什么先发生), se não houver uma forte base de percepção, estes desafios são difíceis de aprender──

Se você começar a misturar todas as cenas do zero, o modelo não será adequado para perceber, mas o modelo pode ser seguido através de imagens, mas o visual compreende muito pouco.

O currículo 排序让你从阶段SI 获得感知强度,再从阶段OV 获得组合/时间推理能力,同时不丢任何一边──

### 跨场景 competências emergentes

O artigo LLaVA-OneVision relatou três capacidades emergentes:

1. Raciocínio com várias câmeras. Ao fazer o treinamento, é necessário entender uma cena de condução com várias câmeras. Embora nunca tenha sido visto este formato em treinamento, o modelo ainda pode integrar vários pontos de vista.
2. Set-of-mark prompting── utilizador usando o número de marcação注释图像中的对象;模型推理mark 3 相对mark 7 在做什么──既没有在标签上训练,也没有在注释上训练; é do conjunto de grounding + multi-image reference中学到──
3. O usuário fornece um iPhone Screenshot, e requer planejamento da próxima vez.

Estas não são tarefas de treinamento; elas surgiram da estrutura composta do currículo.

### 视觉 Token pooling

Token  orçamento precisa de pooling. OneVision em 2D patch grid 上 use bilinear interpolação:24x24 = 576 个 patch 变成 12x12 = 144(2x factor) ou 8x8 = 64(3x factor) ――Pooling em patch-grid 空间完成, em vez de em Token 空间完成,以保留局部性。

Cada cenário de pooling factor 选择本身就是一个超参数──更少聚合 = 更多Token = 更丰富的表示──更多聚合 = 更少Token = 能放入更多/图像──

### LLaVA-OneVision-1.5

A versão seguinte de 2025 foi publicada em LLaVA-OneVision-1.5, arXiv 2509.23661) em dados de treinamento, o peso e o código do modelo são totalmente abertos. Em alguns benchmarks, a diferença entre o modelo proprietário e o modelo de referência foi reduzida, tornando a estrutura mais democrática.

### Com relação ao Qwen2,5-VL

Qwen2.5-VL(Lessão 12.09) fez uma escolha diferente. Utiliza M-RoPE e FPS dinâmico, em vez de pooling fixo. Seu orçamento será de 1 minuto de utilização em vídeo.


```figure
l5-onevision-budget
```

## Use-o
`code/main.py`É um programa de estudo e orçamento para VLM de estilo OneVision.

- Para cada cenário, a resolução da distribuição é um factor de agregação e os quadros são
- Verifique se cada cenário está dentro do orçamento comum.
- 报告预期 Token 数量、LLM FLOPs, bem como quais são os cenários sub-tokenizados。
- 打印逐阶段训练计划──

Usá-lo para planejar a OneVision, ou fazer um teste de sanidade para cada pedido de depósito de VLM.

## Entrega-o
本课会产出 `outputs/skill-onevision-budget-planner.md` Dado a distribuição de tarefas e orçamento de cada modelo, ele produz qualquer fator de Res, polarização por quadro, número de vídeos e pesos de estágio do currículo.

## 练习
1. Seu produto suporta 80% 单图像、10% 多图像(2-4 张图像)、10% 视频(8-16 ) ・・・design Token 预算──由于 não faz peso em muitas imagens e não faz orçamento extra, onde você vai colocar?

2. 阅读 LLaVA-OneVision Seção 4.3 (capacidades emergentes)  Propõe um currículo possível de desbloqueio, mas o artigo não relata a quarta espécie de habilidade emergente

3.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

4. 论文报告的视频基准每样本只用8训练――这能泛化为推理时的30秒视频吗?

5. Para fazer um parche 24x24 fazer pooling bilinear até 12x12, em cada dimensão é uma redução de 4x.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| OneVision scenario | “单图像、多图像，或视频” | 统一 VLM 处理的三种输入 shape 之一；预算在三者之间保持恒定 |
| Token budget | “每个样本多少 Token” | LLM 在每个训练/推理样本中看到的视觉 Token 总数，通常为 3000-4000 |
| Curriculum | “训练顺序” | 为了 emergent transfer 而选择的阶段排序（单图像 → 多图像 → 视频） |
| Bilinear pooling | “Token 缩减” | 对 patch grid（2D）应用 bilinear interpolation，以在保留局部性的同时减少 Token 数量 |
| Emergent skill | “没训练过，但仍然能用” | 由于 curriculum composition，在没有匹配训练数据的情况下于推理时出现的能力 |
| AnyRes-k | “k-tile setup” | k 个固定分辨率子 tile 加一个 thumbnail，典型 k ∈ {4, 9} |
| Task transfer | “跨场景泛化” | 在单图像上学到的技能，通过共享 backbone 应用于视频（反之亦然） |

## 延伸阅读
- [Li et al. — LLaVA-OneVision (arXiv:2408.03326)](https://arxiv.org/abs/2408.03326)
- [LLaVA-OneVision-1.5: Fully Open Framework (arXiv:2509.23661)](https://arxiv.org/abs/2509.23661)
- [Lin et al. — Video-LLaVA (arXiv:2311.10122)](https://arxiv.org/abs/2311.10122)
- [Lin et al. — VILA (arXiv:2312.07533)](https://arxiv.org/abs/2312.07533)
- [Wang et al. — Qwen2-VL (arXiv:2409.12191)](https://arxiv.org/abs/2409.12191)
