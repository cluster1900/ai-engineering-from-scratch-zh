# Modelo de roteamento  como meio de base para reduzir os custos

> Uma corretora dinâmica irá avaliar cada solicitação ((Typ de tarefa、Longoa de tokens、Similaridade de embedimento、confiança),并把简单查询 发送给便宜模型,把复杂查询 升级到边界模型──也称为模型卡化──Production case studies 显示, no US/UK/EU deployment,iso-quality 下成本可降低2060%; em high-flow SaaS,30% de melhoria da eficiência de roteamento 会降转为六位年度节──2026年背景是LLM 价格下推算每年约10x:从2022年末到2026年,GPT-4-class Token 从$20/M 降到约 $0,40/M。 a maior parte da queda vem de pilas de melhor serviço(Fase 17 · 04-09), não é hardware。 Routing é o que você está fazendo em caso de não causar regressão do produto, transformar esse preço em margem │ modo de falha │ é o modelo barato drift:route │ 40% │ para um modelo mais fraco, tarefas de raciocínio │ qualidade │ 3 │5%, em um trimestre │ não há ninguém observou │

**Type:** Learn
**Languages:** Python (stdlib, toy cascading router simulator)
**前置要求：**Fase 17 · 01 (Plataformas de LLM gerenciadas), Fase 17 · 19 (Gateways de IA)
**Time:** ~60 分钟

## Objectivo de aprendizagem

- Explicação do modelo em cascata: barata-primeira com controlo de confiança, baixa confiança 时 escalade。
- 枚举四个路由信号(classificação de tarefa、prompto length、Embedding similarity to known-hard set、first-pass de autoconfiança)
- Em rotação de objetivo dividido e tolerância de perda de qualidade, abaixo calcula o custo combinado esperado.
- "Quando o sistema de controle de drift é usado para monitorar a qualidade da rede, o sistema de controle de drift é usado para monitorar a qualidade da rede".

## 问题

Seu serviço no GPT-5 上每月花费$80k──Your analytics 显示70% das consultas 都很简单:"qual é a hora em Paris?" "refraze esta frase".

Se você colocar 70% de rota para um modelo barato, colocar 30% de rota para um modelo caro, na mesma qualidade do produto, sua contabilidade vai diminuir cerca de 65%.

## 概念

### Quatro sinais de encaminhamento

1. **Task classification**O método de classificação é: simples/complexo/código/matemática/chat── pode ser um classificador baseado em regras、小型 LLM(Haiku-class, $0.25/M), ou até embutidos em baldes rotulados──输出:route = barato / equilibrado / fronteira──

2. **Prompt length**As instruções são <500 Tokens normalmente não são necessárias。

3. **Embedding similarity to known-hard set**Se a consulta estiver perto de um balde conhecido de duração, escala directamente até a fronteira.

4. **Self-confidence from first-pass**Se os log-probs do modelo mostram baixa confiança, ou se ele recusa, ou saiba a linguagem de cobertura, vamos tentar novamente em cerca de 10% do tráfego, aumentando a latência de P95, mas em outros 90% economizando 50%+.

### 3 modos

**Pre-route**(前置分類器): aumentar cerca de 5-10ms de latência;整体最快──

**Cascade**(prima-barata, baixa confiança 时 escalada): latência média 约1.2x(curso barato加验证), escalada 时约2x── qualidade de piso 最好──

**Ensemble route**(对样本并行运行廉价 和 frontier,由奖励模型选择): qualidade máxima, custo máximo; apenas para A/B-chave

###  realização

Portais de IA(Fase 17 · 19) Exposição de roteamento。LiteLLM`router`Config──Portkey tem guardas + roteamento──Kong AI Gateway tem roteamento baseado em plugins──OpenRouter modelo de mercado  Exposição de recomendação API──

Open-source:RouteLLM (LMSYS) 、Não Diamond (comercial) 、Prompt Mule──

### 2026 价格曲线

| Model class | 2022 年末 | 2026 | 变化 |
|-------------|-----------|------|--------|
| GPT-4-level quality | ~$20/M | ~$0.40/M | 便宜 50x |
| Frontier (GPT-5, Claude 4) | — | ~$3-10/M | 新 tier |

A maior parte da melhoria vem da eficiência de serviço, ou seja, a fase 17 · 04-09 em que os cursos centrais são transformados em fornecedores.

### Drift é o verdadeiro risco

Seu caminho Colocar 40%  Enviar para um modelo barato。 seis meses depois, a distribuição de tarefas  acontece mudança( usuário mais experiente, problema mais longo)。 Router  não percebeu, porque seu classificador é baseado em dados de Q1  treinamento。 Qualidade  baixa。 Ninguém saiu com reclamações suficientemente fortes。 Você só se encontrou perdido no benchmark do concorrente。

Utilize métricas de qualidade online para o gate de rota:

- Cada linha de roteiro de usuário pulgares para cima / pulgares para baixo.
- Cada rota 上对持久样本 ((5%) fazer automático LLM-juiz
- Taxa de escalada: Se a rota de ascensão da cascata > 30%, indica que o modelo barato foi sobre-routado.
- Taxa de recusa de cada rota:

### Você deve lembrar-se de números

- 2026 Anos de isoqualidade: redução da rotação: estudos de caso: 20 a 60%
- A queda dos preços dos LLM 2022-2026:agregado 约每年10x──
- GPT-4 nível 2022 vs 2026:~$20/M → ~$0,40/M:
- Impacto da latência em cascata: média de cerca de 1,2x, escalada de cerca de 2x ((cerca de 10% do tráfego)


```figure
model-cascade-router
```

## Use-o

`code/main.py`O relatório de custos, perda de qualidade e taxa de escalada,

## Entrega-o

本课会产出 `outputs/skill-router-plan.md` Foram definidas as cargas de trabalho e o orçamento de qualidade, escolher os padrões de roteamento e os sinais.

## 练习

1. 运行 `code/main.py`Em que piso de precisão, a cascata vai vencer antes da rota?
2. Sua base de usuários é 30% empresarial (questions complexas) ‒70% de nível gratuito (simples) ‒ design routing split―?
3.                                                                                                                                                                                                                                                               
4. Utilize OpenAI / APIs Antropic logprobs  realçar verificação de confiança  Você vai começar a partir de que limiar?
5. Em seis meses, a taxa de escalada passou de 8% para 22%.

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Model routing | "cost broker" | 每个 request 动态选择 model |
| Model cascade | "cheap-first escalate" | 先运行 cheap，low confidence 时 fall through 到 frontier |
| Pre-route | "classify first" | 前置 classifier；不重新运行 |
| Ensemble route | "parallel pick" | 运行多个，由 reward-model 选最佳 |
| Escalation rate | "uprouted %" | cascade requests 中被 escalated 的比例 |
| RouteLLM | "LMSYS router" | OSS router library |
| Not Diamond | "commercial router" | SaaS model-routing product |
| Drift | "cheap creep" | distribution shift 发生但 router 没注意到 |
| Online quality gate | "live check" | 对 live traffic 采样做 automated LLM-judge |

## 延伸阅读

- [AbhyashSuchi — Model Routing LLM 2026 最佳实践](https://abhyashsuchi.in/model-routing-llm-2026-best-practices/)
- [Lukas Brunner — Rise of Inference Optimization 2026](https://dev.to/lukas_brunner/the-rise-of-inference-optimization-the-real-llm-infra-trend-shaping-2026-4e4o)
- [RouteLLM paper / code](https://github.com/lm-sys/RouteLLM)
- [Not Diamond — model routing](https://www.notdiamond.ai/)
- [OpenRouter](https://openrouter.ai/) 带 routing primitivos multi-modelo gateway。
