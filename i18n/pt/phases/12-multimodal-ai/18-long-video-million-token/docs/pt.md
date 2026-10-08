# Contexto de milhões de palavras 下的长视频理解

> Uma 1 horas de vídeo 4K, 24 FPS, através de patching e embutida, gerará cerca de 6 milhões de tokens. Uma transcrição de 2 horas de programação em um vídeo em um vídeo em um vídeo em 24 FPS, gerará cerca de 6 milhões de tokens. Uma transcrição em um vídeo em um vídeo em 24 FPS gerará cerca de 6 milhões de tokens. Uma transcrição em um vídeo em um vídeo em 24 FPS gerará cerca de 30 mil tokens.

**Type:** Build
**Languages:** Python (stdlib, needle-in-haystack simulator + agentic-retrieval router)
**Prerequisites:** Phase 12 · 17 (video temporal tokens)
**Time:** ~180 minutes

## Objectivo de aprendizagem
- 計算不同 FPS 和 pooling 下长视频的总视觉标记 数量──
- 解释三条扩展路径:brute context(Gemini 1.5) 、ring attention(LWM) 、compressão de tokens(LongVILA / Video-XL) ✿
- Em Precisação e Tarde Comparar VLMs de vídeo em contexto bruto com VLMs de recuperação de vídeo em agente (VideoAgent)
- Por 30 minutos de vídeo desenhar uma agulha em um monte de feno 测试,并测量特定分钟处的召回率──

## 问题
Qwen2.5-VL 尺寸的补丁 在 384 原生分辨率下,单约为729 代币――使用3x3聚合 后,每 81 代币――一个 30 分钟片段按1 FPS 计算 = 1800  = 145,800 代币――到2025年开放的VLMs可以做到,但很紧――按2 FPS 计算,则是291,600 代币,只有最大的背景模型能装下――

Uma parte de 2 horas de filme em 1 FPS é 583k Token──超出多数 2026年开放模型能力;需要双子座2.5 Pro,或更激进地聚合──

A expansão é um processo de desenvolvimento.

## 概念
### Caminho 1: contexto bruto (Gemini 1.5, Claude Opus)

Ushardware resolver problemas.

Gemini 1.5 Pro  lançamento  suporte  1M Token; Gemini 1.5 Ultra  atingir 10M; Gemini 2.5 Pro  energia de processamento de 2026 ano   energia de processamento número de horas 视频──论文(arXiv:2403.05530) registrou em alta cerca de 9.5M Token 下, agulha-em-uma-haystack 召回率 召回率 达到99.7%──

工程上: um tipo de auto-descrição de nível de memória (local + global + scarc) 实现,加上用于长文效率的MoE专家路由──完整细节未公开发表──不开源──

### 路径 2: Atenção ao anel (LWM, LongVILA)

Atendimento de anel Colocar a longa sequência distribuída em vários dispositivos, formando um anel, cada dispositivo tem um pedaço. Atendimento da sequência completa através do anel.

LWM(Liu et al., 2024) com este método treinou um contexto de 1M-Token 模型── treinar a quantidade de cálculo com o contexto 线性扩展, em vez de quadrado de expansão, porque o custo quadrado da atenção é distribuído para os dispositivos do meio do anel──

LongVILA(arXiv:2408.10188)把该模式适配到VLMs──1400 视频,每 192 个 Token = 268k contexto,并使用 8-way paralelismo de atenção ao anel 训练──

### 路径 3:Token 压缩 (Video-XL, LongVA)

Em relação ao contexto bruto, é mais conveniente:

Video-XL(arXiv:2409.14485) usar o token de resumo visual: cada um contém um clip de N                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               

LongVA utilizando o contexto longo transferência tecnologia, vai LLM contexto de 200k  expandido para 2M.

A compressão de tokens usa a capacidade de convocação de um determinado tempo para trocar por expansão. O modelo geralmente sabe o que aconteceu, mas às vezes perde a precisão.

### 路径 4: Retorno de Agentes (VideoAgent)

Não coloque o vídeo completo na sua base de dados, e use o vídeo para consultá-lo.

VideoAgente ((arXiv:2403.10517):

1. LLM 读取问题──
2. LLM Peça ferramenta de recuperação 提供相关片段(mostra-me segmentos com um gato)。
3. Ferramenta 返回匹配的剪辑时间标签──
4. LLM 通過VLM 读取這些剪辑──
5. LLM  organização de resposta, ou apresentar uma consulta posterior.

É aplicado ao longo do vídeo.

### Indicador de referência de agulha em um manto de feno

标准 long-context 测试: inserir um marcador visual ou texto único em qualquer posição no vídeo, e então apresentar uma pergunta que precisa de lembrança para esse marcador.

Metrícula:跨视频长度和标记位置的 Recall@k。

Gemini 2.5 Pro em 90 minutos de vídeo com pontuação >99%  Callback Rate── Open 72B 模型(Qwen2.5-VL-72B、InternVL3-78B) em 30 minutos de vídeo com pontuação de 85-90%, mais de 60 minutos de baixa──

Se a ferramenta é boa o suficiente, o VideoAgent em 2+ situações pode ser combinado ou superior ao modelo de contexto bruto, pois a recuperação pode ser feita com agulha.

### Que caminho escolher

对于边界精度的 15 分钟片:开放 72B + 原生 context 通常可行──选择 Qwen2.5-VL-72B──

对于 30 分钟到 1 小时内容:开放模型选择 LongVILA 或 Video-XL;闭源选择 Gemini 2.5 Pro──质量门很重要,边界 走闭源──

对于 2+ 小时内容:VideoAgent 或类似检索模式──或, resumo em pequenos pedaços,并输入 hierarquias resumos──

### Modelo de produção 2026

Na prática, as linhas de produção de vídeos são:

1. Para todo o vídeo, a amostragem dinâmica-FPS + agressão de pooling (), obtém 100k-Token (Token)
2. Transmitir para 72B VLM
3. Se o usuário apresentar uma questão de detalhe, use este resumo como índice 运行代理检索――

Isso combina a capacidade de compreensão e recuperação de detalhes locais do contexto bruto.


```figure
mm-video-token-budget
```

## Use-o
`code/main.py`- Não .

- 计算 1 分钟到 3 小时视频在不同 FPS + pooling 下的 Token 预算。
- 模拟一次针-in-a-haystack 运行:在随机时刻 注入标记,提出问题,并评估召回──
- incluindo um simulador de roteador de recuperação de agentes, para escolher para inserir clips específicos do VLM.

运行预算表,感受尺度差距──

## Entrega-o
本课产 出 `outputs/skill-long-video-strategy-planner.md` Dado o tempo e a complexidade da consulta, ele vai ser escolhido entre conteúdo bruto ̊ compressão e recuperação agencial ̊,并计算延迟 + 质量预期

## 练习
1. 一段 45 分钟讲座,1 FPS, por 81 代币── 代币总数是多少?

2. Design a needle-in-a-haystack 测试: você vai injectar marcador em primeira minutos, preciso inquérito formato é o quê?

3. Em 1 小时视频上比较原文文 Qwen2.5-VL-72B(80k context) com VideoAgent(Claude 3.5 + retrieval) ・・・ qual é o melhor jogo em convocação? qual é o melhor jogo em atraso?

4. O custo de memória da atenção ao anel aumenta com a sequência de extensão linear, também com a expansão linear do número de dispositivos.

5. 阅读双子座 1.5 第5节关于针子在草堆的内容──论文关于1M和10M Token 边界处的召回有什么发现?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Brute context | “只是更多 Token” | 将 LLM context 扩展到数百万 Token；一次性处理所有内容 |
| Ring attention | “LWM-style parallel” | 分布式 attention 模式：每个设备持有一个 chunk 并轮转 |
| Token compression | “Summary tokens” | 在进入 LLM 前，通过 learned compressor 减少每个 clip 的 Token |
| Needle-in-haystack | “NIH test” | 在随机位置插入唯一 marker，在测试时要求模型回忆它 |
| Agentic retrieval | “LLM as query planner” | LLM 向 retrieval tool 请求相关 clips，通过 VLM 读取它们，并组织答案 |
| VideoAgent | “Retrieval pattern for video” | 规范的 agentic-retrieval 设计：question -> tool -> clip -> answer |

## 延伸阅读
- [Gemini Team — Gemini 1.5 (arXiv:2403.05530)](https://arxiv.org/abs/2403.05530)
- [Liu et al. — LWM / RingAttention (arXiv:2402.08268)](https://arxiv.org/abs/2402.08268)
- [Xue et al. — LongVILA (arXiv:2408.10188)](https://arxiv.org/abs/2408.10188)
- [Shu et al. — Video-XL (arXiv:2409.14485)](https://arxiv.org/abs/2409.14485)
- [Wang et al. — VideoAgent (arXiv:2403.10517)](https://arxiv.org/abs/2403.10517)
