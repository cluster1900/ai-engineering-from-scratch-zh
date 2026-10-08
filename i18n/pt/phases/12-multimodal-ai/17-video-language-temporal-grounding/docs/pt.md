# Modelos de Vídeo-Languagem: Tokens Temporais e Grounding

> Video não é uma foto. O vídeo tem uma sequência de 5 segundos, e o modelo de imagem não pode ser expresso. O vídeo-LLaMA, Zhang e outros, junho de 2023) publicou o primeiro vídeo aberto com base audiovisual. O vídeo-LLM. VideoChat e Video-LLaVA expandiram esse modelo. Até 2025, o TMRoPE de Qwen2.5-VL reduziu a diferença com os modelos proprietários de fronteira. Cada sistema resolve diferentes tipos de tokens temporais: Q-former por clip, Concat-pool por frame, TMRoPE por token.

**Type:** Build
**Languages:** Python (stdlib, frame sampler + temporal-grounding evaluator)
**Prerequisites:** Phase 12 · 08 (LLaVA-OneVision)
**Time:** ~180 minutes

## Objectivo de aprendizagem
- 解释为什么时间定位编码 会独立于视觉编码器 改变视频VLM性能──
- Comparar a amostragem de quadros dinâmicos-FPS e event-driven em tokens-per-secondes com a precisão de aterragem.
- 描述 Q-former-per-clip(Video-LLaMA)、pooled-per-frame(Video-LLaVA)和M-RoPE-per-token(Qwen2.5-VL)
- Exercícios de vídeo: VideoMME, TempCompass, EgoSchema, Video-MMMU,

## 问题
O vídeo tem 1800 quadros. Por cada quadro, 196 tokens visuais.

Há três estratégias de compressão:

1. Quadros de submudeis (de acordo com o conteúdo utilizado em 1 a 8 FPS)
2. Para cada quadro de patch tokens  realizar forte força pooling ((3x3 ou 4x4 bilinear pool) 👇
3. 通過Q-former 壓縮:输入一片16frame,输出64 tokens──

Cada tipo de variação. A sub-sampulação perde detalhes temporais. A poluição perde detalhes espaciais.

A codificação de posição temporal é uma outra dimensão: modelo como saber que quadro 5 ocorreu em quadro 6                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

## 概念
### Video-LLaMA: cada clip um ex-Q + ramo de áudio

Video-LLaMA(2023) é o primeiro vídeo-LLM...Arquitetura:

- Clip de 16 quadros a 2 FPS ((即 8 秒) ⋅
- Características de ViT por quadro -> Video Q-former,对全部16 framees做交叉服务 -> 32 consultas aprendidas -> LLM。
- 并行 áudio branca:waveform -> ImageBind áudio encoder -> Áudio Q-former -> 32 consultas -> LLM。

优势: raciocínio conjunto audiovisual。 weak点: comprimento fixo do clipe, incapaz de lidar com o tempo arbitrário de fixação。

### VideoChat e Video-LLaVA

VideoChat manteve o caminho do Video-LLaMA, mas eliminou o áudio e simplificou-se.

Os dois são sistemas de 8-16 quadros.

### Qwen2,5-VL e TMRoPE

Qwen2.5-VL  introduziu TMRoPE, isto é, Embedding de Posição Rotária Temporal-Modality.

Diferença fundamental entre a simples incorporação temporal:

- O modelo que vemos é em 4,2 segundos, não em 15 segundos.
- Rotatividade por token, em vez de por clip. Cada token visual tem seu próprio tempo.
- 兼容动态FPS──若这里以2 FPS采样、那里以4 FPS采样,TMRoPE pode ser originalmente processado neste diferencial间隔──

TMRoPE 支持猫在第几秒跳起? 这类查询──模型可以输出在 4.2 segundos──视频-LLaMA 只有可以说在片段──

### Estratexias de amostragem de quadro

Uniforme: durante toda a duração, dentro de quadros simples, mas perderá picos de movimento.

FPS dinâmico: De acordo com a intensidade de movimento 自适应采样――O fluxo óptico ou diferenciação de quadro 会在高动作段 选择更密集的采样――Qwen2.5-VL 会这样训练――

Evento-driven:运行一个轻量探测器,在行动发生处采样更多──VideoAgent 使用这种方式──

Quadro de teclado + contexto: em limites de filmagem + cadros adjacentes 采样── para conteúdo cinematográfico──

### Reunião por quadro

Em 1 FPS 且每框架 576 tokens 时,一个5分钟片是172,800 tokens──Qwen2.5-VL-72B 的 128k contextos 可以勉强处理,但成本高──

Polar bilinear 3x3 vai reduzir cada quadro para 64 tokens -> 5 minutos para 19.200 tokens― para a maioria das tarefas é um ponto doce―

Para os fluxos de trabalho de agentes pode ser mais ativado em conjunto ((6x6 -> 16 tokens por quadro), porque o detalhe espacial 没那么重要――

### Os quatro critérios de referência de vídeo

- VideoMME: compreensão integral de vídeo, incluindo curto + médio + longo。
- TempCompass:细粒度 raciocínio temporal, contendo questões "antes" / "depois"
- EgoSchema:长时程第一人称视频──
- Video-MMMU:Multimodal 多学科视频问题──

完整视频-VLM evaluation 会覆盖全部四个──它们强调不同维度:TempCompass 关注订单,EgoSchema 关注 3+ minutos de raciocínio,VideoMME 覆盖多种持续时间──

### Formatos de saída de aterragem

A terra temporária de saída

- Texto livre:"O gato salta ao redor da marca de 4 segundos". 易于解析但不精确──
- JSON estruturado:`{"event": "jump", "start": 4.1, "end": 4.3}`❖ Qwen2.5VL 会訓練这种形式──
- Baseado em tokens: especial `<time>4.1</time>`Tokens 与答案交错──Qwen2.5-VL's interior formato──

Para uso em downstream, o formato de saída JSON de Qwen2.5VL pode ser resolvido diretamente.

### 2026 melhores práticas

2026 Video melhor prática de VLMs:

- Encoder:带 M-RoPE 或 TMRoPE 的 SigLIP 2(Qwen2.5-VL) 』
- Amostragem de quadro: FPS dinâmico (de acordo com o movimento)
- A combinação por quadro: 3x3 bilinear.
- Output: contém tempo + evento 字段的结构化 JSON。
- Benchmarks:VideoMME + TempCompass Usado para geral;EgoSchema Usado para longo horizonte。


```figure
video-temporal-patches
```

## Use-o
`code/main.py`包含:

- Modelo de tela de fotogramas FPS uniforme e dinâmico
- Uma avaliação de tempo de base de brinquedo: dado tempo determinado T 处 "verdade base" evento 和 modelo de saída, em tolerância 内评分精度──
- Video-LLaMA(16 quadros,Q-ex)、Video-LLaVA(8 quadros,MLP)、Qwen2.5-VL(FPS dinâmico + TMRoPE)

## Entrega-o
本课会产出 `outputs/skill-video-vlm-frame-planner.md` É dada uma tarefa de vídeo ((monitoring、ação de reconhecimento、termo temporal、resumo), ele seleciona o modelo de quadro、pooling factor、output format 和 expectativa nível de precisão。

## 练习
1. Para uma demonstração de 3 minutos de cozinha, escolha uniforme ou FPS dinâmico.

2. TMRoPE  especificamente aumentou o que, é simples temporário de inserção tabela fazer não está?

3. 写一个 VLM 可学习输出时间接地 JSON schema──包含错误案──

4. 阅读 Video-LLaVA Secção 3 中的"Alignment Before Projection"──为什么比训练独立图像和视频编码器更好?

5.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Temporal grounding | "Time-localized answers" | VLM 会为事件发生时间输出具体 timestamp range |
| TMRoPE | "Time-Multimodal RoPE" | 带绝对 timestamps 的 3D rotary position，由 Qwen2.5-VL 使用 |
| Dynamic FPS | "Motion-aware sampling" | 在 high-motion segments 采样更多 frames，在 static segments 采样更少 |
| Frame pooling | "Spatial compress per frame" | 在进入 LLM 前用 bilinear interpolation 减少每个 frame 的 patches |
| Video Q-former | "Clip compressor" | 将 N frames 映射到 K learned queries 的 cross-attention bottleneck |
| VideoMME | "Video bench" | 综合 short/medium/long video benchmark，2500+ samples |

## 延伸阅读
- [Zhang et al. — Video-LLaMA (arXiv:2306.02858)](https://arxiv.org/abs/2306.02858)
- [Li et al. — VideoChat (arXiv:2305.06355)](https://arxiv.org/abs/2305.06355)
- [Lin et al. — Video-LLaVA (arXiv:2311.10122)](https://arxiv.org/abs/2311.10122)
- [Qwen Team — Qwen2.5-VL (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)
- [Lin et al. — VILA-1.5 (arXiv:2312.07533)](https://arxiv.org/abs/2312.07533)
