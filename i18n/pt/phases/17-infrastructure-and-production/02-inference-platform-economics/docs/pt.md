# 推理平台经济学  Futebolistas  Juntos  Baseta  Modal Replicado  Anyscale

> O mercado de 2026 não é mais apenas GPU 时间租── divide-se em sílicon personalizado(Groq、Cerebras、SambaNova)、 plataformas GPUs(Baseten、Together、Fireworks、Modal) e mercados API-primeiros(Replicate、DeepInfra)──Fireworks em 2026 5 月 1 日 irá aumentar o preço de cada bloco de GPU$1/hr，而 $4B  估值和每日 10T+ tokens 的处理量说明了量驱动的模型是可行的──Baseten 于 2026 年 1 月 以$5B 估值完成了 $300M Série E。 competência 定位规则很简单:Fireworks 优化延迟,Together 优化目录宽度,Baseten 优化企业抛光,Modal 优化Python-native DX,Replicate 优化多模范围,Anyscale 优化分布式Python。本课会给你一个可以直接交给创始人的矩阵──

**Type:** Learn
**Languages:** Python (stdlib, toy per-call economics comparator)
**前置要求:**Fase 17 · 01 (Plataformas de Mestrado em Direito Executivo), Fase 17 · 04 (VLLM Servings Internals)
**Time:** ~60 minutes

## Objectivo de aprendizagem
- Para explicar os três segmentos de mercado: "plataformas de silicone, GPU, API-primeiro", "e cada fornecedor será mapeado para um segmento".
- Explicação de porquê o modelo de preços da API "por token" vai para a curva de custo do motor de serviço 收, em vez de para a curva de custo do hardware 收──
- 計算至少三供應商的每次请求有效成本,并解释什么时候/minute (Baseito, modal) 胜过/token (Módal)
- 识别给定工作负载的正确默认平台(erro servido bursty、static high-throughput、fine-tuned variantes、Multimodal)

## 问题
Você já avaliou o sistema de supercalculação de servidores. Você decidiu que precisa de um fornecedor mais pequeno e rápido: Fireworks para a latência, Juntos para a largura, Baseten para o modelo personalizado perfeitamente ajustado. Agora você tem seis opções reais, enquanto as páginas de preços não concordam. Fireworks mostra.$/M tokens；Baseten 显示 $/minute; Modal 显示 $/second；Replicate 显示 $Se não se encaixar na carga de trabalho, não se pode lidar com eles.

Além disso, cada página de preços 背后的商业模式都不同──Fireworks在共享 GPU 上运行自己的定制引擎(FireAttention);per-token rate 反映它们的利用率曲线──Baseten 给你Truss + dedicated GPUs;per-minute 反映了独占性──Modal é o verdadeiro Python serverless:per-second billing,而且冷开始可低于一秒──相同输出(一个LLM响应),三种不同的成本功能──

Esta aula vai construir estas seis plataformas e dizer-lhe quando elas se diferenciam.

## 概念
### Os três segmentos

**Custom silicon** Groq(LPU)、Cerebras(WSE)、SambaNova(RDU)。 Em um mesmo modelo, o decodificador normalmente é mais rápido que o cluster baseado em GPUs 快 5-10x。 por token 价格更高(2025 年末年 Groq 在 Llama-70B 上约为 ~$0,99/M), mas para casos de uso sensíveis à latência 无可匹敌──Groq é um agente de voz e um ambiente de produção de tradução em tempo real──

**GPU platforms** Baseten、Together、Fireworks、Modal、Anyscale──运行在NVIDIA(2026年为H100、H200、B200) or有时运行在AMD 上──它们位于"Raw GPU rental"(RunPod、Lambda) e "hyperscaler managed service" (Bedrock) entre o nível económico──

**API-first marketplaces** Replicar 、Infraprofunda 、OpenRouter 、Fal──Catalho amplo, pagamento por previsão ou pagamento por segundo, enfatização de tempo a primeira chamada―

### Fireworks  Plataforma de GPU optimizada para latência

- FireAttention engine (custom); mercado宣傳为在等效配置上延迟比 vLLM 低 4x──
- Batch tier 约为 serverless rate 的 50%, para cargas de trabalho não interativas.
- Modelo de ajuste fino em relação ao modelo base, esta é a verdadeira diferença entre os fornecedores que receberão o seu prêmio de LoRA e o seu preço.
- 2026 年中:on-demand GPU rental 自 2026 年 5 月 1 日起提高$1/hour──规模化时可协商 量价──
- 财务信号: $4B 估值, processing 10T+ tokens per day―

### Juntos  Otimizado em largura

- 200+ modelos, incluindo versões de código aberto em linha em ascensão  publicadas em poucos dias após a publicação 
- Em modelos de LLM de igual efeito, em comparação com Replicação, conveniente de 50-70%; "AI Native Cloud" 定位的核心是卷和目录──
- Inferência + ajuste fino + treinamento estão em uma API.

### Baseten  empresa-polonês-otimizado

- Truss framework: vai dependeres, segredos, config serve colocar num manifesto para realizar o modelo de embalagem.
- A GPU   gama de T4 a B200― por minuto de faturamento,并 fornece uma mitigação razoável de início a frio―
- SOC 2 Tipo II,preparado para HIPAA.
- $5B 估值，2026 年 1 月 Series E（来自 CapitalG、IVP、NVIDIA 的 $300M) ⋅

### Modal  Python nativo-otimizado

- Infraestrutura como código de Python`@modal.function(gpu="A100")`Decorar uma função, e depois usar um comando.
- Faturamento por segundo── pré-calor ̇ começo frio − 2-4s; 小模型低于 1s──
- $87M Series B，估值 $1.1B(2025)── em inquérito independente experiência de desenvolvedor obtém o maior

### Replicação  largura multimodal

- Pagamento por previsão―imagem―vídeo―audio e modelos de áudio―
- Ecossistema de integração ((Zapier、Vercel、CMS plugins)
- Em LLM por taxa de token, a concorrência é mais fraca, mas vence na variedade multimodal.

### Qualquer escala  Ray-native

- 构建在 Ray 上;RayTurbo é um motor de inferência proprietário de Anyscale (WEB
- 最适合分布式Python workloads, em que o passo de inferência é um nó no gráfico maior.
- Gerenciado Ray clusters;

### Por token e por minuto:分别在什么时候胜出

Quando a carga de trabalho é insensível à latência e explode, por token é razoável, porque você só paga por uso real. Quando a utilização é alta e previsível, por minuto é razoável, porque uma vez que você deixa a GPU 和, você vai vencer por token.

粗略规则:当工作负载高于专用GPU 约 ~30% 的持续利用率时,每分钟(Baseten、Modal) 开始胜过每代币(Fireworks、Together) ∼低于该水平时,每代币 获胜,因为你避免为空付费──

### O motor personalizado é o verdadeiro fosso .

Cada plataforma em vLLM e SGLang 之都声称拥有自定义引擎──FireAttention、RayTurbo、Baseten的推理堆──custom-engine 声称带有营销色;更诚实的表述是, vLLM + SGLang 代表大约80% de produção de alta qualidade de código aberto, enquanto a diferença entre a camada de plataforma é DX、attribution 和 SLAs──

### Números que você deve lembrar

- Aluguer de GPU de fogos de artifício: desde 2026 年 5 月 1 日起提高 $1/h──
- Reclamação de fogos de artifício: em comparação com a configuração de efeitos, a latência é 4x menor que a de vLLM.
- Juntos: em LLMs 上比 Replicate 便宜 50-70%。
- Valoração do baseto:$5B（Series E，2026 年 1 月，$300M rodadas)
- Valoração do capital: US$ 1,1B ((Série B,2025)。
- por minuto está em ~ 30% 持续利用率时胜过每代币──


```figure
cost-per-token
```

## Use-o
`code/main.py`Em um trabalho sintético, os modelos de preços são comparados por seis fornecedores.$/day 和 effective $/M tokens──运行它来找出每代币与每分钟的破解平衡──

## Entrega-o
本课会生成 `outputs/skill-inference-platform-picker.md` determinar o perfil da carga de trabalho  SLA 和 orçamento, escolher a plataforma de inferência primária,  dar o segundo lugar 

## 练习
1. 运行 `code/main.py` Para um bloco de H100 acima do modelo 70B, em que taxa de utilização continua baixo Baseten (per-minuto) vai vencer Fireworks (per-token)?
2. Seu produto fornece geração de imagem, chat e fala-a-texto.
3. Os fogos de artifício vão aumentar o preço do seu modelo principal por 1 hora. Se 40% do tráfego for transferido para o nível de lote, 50% de desconto, o impacto de custo misturado será observado.
4. Uma clientela regulada requer SOC 2 Tipo II + HIPAA + GPUs dedicados.
5. Comparar Fireworks sem servidor, Com base em pedido, basetão dedicado e API de replicação, Llama 3.1 70B, por 1.000 previsões.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Custom silicon | "non-GPU chips" | Groq LPU、Cerebras WSE、SambaNova RDU — 针对 decode 优化 |
| FireAttention | "Fireworks engine" | Custom attention kernel；市场宣传为 latency 比 vLLM 低 4x |
| Truss | "Baseten's format" | Model packaging manifest；dependencies + secrets + serving config |
| Per-token | "API pricing" | 按消耗的 tokens 收费；无需为空闲付费 |
| Per-minute | "dedicated pricing" | 按 wall-clock GPU time 收费；在高 utilization 时胜出 |
| Per-prediction | "Replicate pricing" | 按 model invocation 收费；常见于 image/video |
| RayTurbo | "Anyscale engine" | Ray 上的 proprietary inference；在 Ray clusters 上与 vLLM 竞争 |
| Batch tier | "50% off" | 降价的 non-interactive queue；常见于 Fireworks、OpenAI |
| Fine-tuned at base rate | "Fireworks LoRA" | 以 base model 的 rate 对 LoRA-served requests 收费（差异点） |

## 延伸阅读
- [Fireworks Pricing](https://fireworks.ai/pricing) taxas por token ‧ batch tier ‧ GPU rent
- [Baseten Pricing](https://www.baseten.co/pricing/) taxas por minuto  capacidade comprometida  níveis de empresa
- [Modal Pricing](https://modal.com/pricing) velocidades de GPU por segundo 和 nível livre
- [Together AI Pricing](https://www.together.ai/pricing) catálogo de modelos 和 taxas por token。
- [Anyscale Pricing](https://www.anyscale.com/pricing)O RayTurbo e o Ray Price Management.
- [Northflank — Fireworks AI Alternatives](https://northflank.com/blog/7-best-fireworks-ai-alternatives-for-inference) avaliação comparativa¬¬
- [Infrabase — AI Inference API Providers 2026](https://infrabase.ai/blog/ai-inference-api-providers-compared) paisagem de fornecedores。
