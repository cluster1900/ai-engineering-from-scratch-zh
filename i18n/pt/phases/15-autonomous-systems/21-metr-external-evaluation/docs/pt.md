# METR Horizontes temporais e avaliação das capacidades externas

> METR(preventes para ARC Evals) a partir de 12 de janeiro de 2023 tornar-se independente 501 ((c) 3) Organização  seu Time Horizon 1.1 benchmark  1 de janeiro de 2026  vai ser a probabilidade de sucesso da missão e log  Especialistas humanos completar tempo)  se adaptar a uma curva logística;  em 50%                                                                                                                                                                                                                 

**类型：**Aprenda
**语言：**Python (stdlib, estimador de horizonte logístico)
**先修：**Fase 15 · 01 (agentes de longo horizonte), Fase 15 · 19 (RSP)
**时间：**- 60 minutos.

## 问题

A política de escalagem (Leções 19, 20) depende dos resultados de medição que são citados. A autonomia de longo alcance é definida no texto da política.

METR é uma organização de avaliação externa de 20242026 anos, definindo muitos dos números. Eles avaliam modelos de fronteira, geralmente realizados sob as condições de um modelo publicado antes de assinar a NDA com laboratórios, e depois publicam metodologias. Time Horizon 1.1 benchmark (em janeiro de 2026) é o resultado central deles: um modelo que irá comprimir a capacidade em uma única quantidade de unidades de leitura humana.

Esta aula é uma parte sobre metodologia (como calcular o horizonte), uma parte sobre a maneira de explicar (por que o horizonte é o horizonte superior, e não a implementação de previsão)  Estas duas habilidades devem ser colocadas em conjunto para entender.

## 概念

### METR 背景

- 成立时间:2023 年 12 月(前身为 ARC Evals,拆分为独立 501(c)(3))
- 范围: avaliar as capacidades autônomas dos modelos de fronteira, geralmente realizadas antes da publicação.
- 合作实验室:Antropic、OpenAI(20252026
- 重要交付物:Time Horizon 1.0(2025 年 3 月) 、Time Horizon 1.1(2026 年 1 月) 、原型监控评估──

### Horizonte do Tempo 拟合

方法论(de METR blog 和 papers):

1. 收集一个任务套件,覆盖分钟级到小时级的专家完成时间──当前套件:HCAST(180+个任务)、RE-Bench(71个任务)、SWAA──
2. 让模型运行每个任务;记录成功或失败――
3. 拟合一条 逻辑曲线:P(sucesso) 是 log(专家完成时间) 的函数──
4. O horizonte é o sucesso = 0,5 de especialistas tempo.

A forma logística-ajustada é adequada, pois normalmente existe uma relação entre capacidade e dificuldade de tarefa. 50% é uma opção.

### 2026 ano 1 月数字

De acordo com o Horizonte do Tempo 1.1:

- Claude Opus 4.6: em 50% de confiabilidade, em torno de 14 horas, proveniente do Time Horizon 1.1 ((2026 Year 1 月) ⋅
- O tempo duplicado na missão em estilo HCAST:Time Horizon 1.1 (01 de janeiro de 2026) do relatório pós-2023 拟合约为 4.3 个月(130.8 天); cerca de 7 个月的数字是Time Horizon 1.0 em 20192025 总量拟合, e TH1.1 em 2023 随与2023 个月的数字一起报告──

Estes são os números concretos da Fase 15 后续引用的数字──Anthropic's RSP v3.0 Lesson 19) 和 DeepMind's FSF v3 Lesson 20) todos os citados, como uma das medidas das avaliações de limiar de entrada──

### Suítes de referência

- **HCAST**O programa de pesquisa foi desenvolvido em 18 de janeiro de 2015 e foi criado em 18 de janeiro de 2015.
- **RE-Bench**A pesquisa de tecnologia de inteligência artificial (AI) foi realizada em uma área de investigação e engenharia de inteligência artificial (AI) e foi realizada em uma área de investigação e desenvolvimento de tecnologia de inteligência artificial (AI).
- **SWAA**Para::较短任务;用于校准视界曲线的低端──

### Origem de avaliação de controlo

20252026 工作 METR 工作包含监视-评估原型:monitor 能否发现模型正在执行副任务 ((即操作员所要求之外的事情);agent 能否规避监视──这些直接输入到OpenAI PF v2 的Undermining Safeguards类别,以及DeepMind FSF v3(Lessão 20)

### Por que os horizontes são o limite superior

- **理想化工具**As tarefas de referência 给模型提供干净工具和格式良好的数据──真实部署更混乱── são:
- **没有真实后果**O modelo não vai realmente pagar ao cliente, eliminar dados reais ou contatar pessoas reais.
- **Eval-context gaming**Leção 1 ― Modelo em testes comportamentos diferentes ― Relatório Internacional de Segurança da IA de 2026 tem registado este ponto
- **没有真实用户差异**Os pedidos de referência são estruturados.

O horizonte é o limite de capacidade sob condições favoráveis. A confiabilidade da implantação é outro número, menor, e a equipe deve medir sua distribuição para saber.

### Artigo anteriorA avaliação do Ministério

A independência do METR: uma possuir metodologia pública e artigos revisados por pares 501 (c) (3), é uma medida de alívio estrutural. Não é em si própria suficiente.

### 如何在实践中使用视界 数字

- **作为能力过滤器**Se o horizonte de um modelo é muito inferior ao tempo do especialista da tarefa proposta, não o coloque em linha de forma autônoma.
- **作为趋势指标**O tempo duplicado diz-te que, mesmo sem novas mitigações, a prática atual também pode ser mantida segura por muito tempo.
- **作为 prior**O horizonte da hora é de início. De acordo com a sua distribuição de tarefas, a qualidade e a implementação de ferramentas, a sua configuração é de baixa para baixa.


```figure
a5-horizon-fit
```

## Use-o

`code/main.py`Baseado em resultados sintetizados, realizou o sucesso da tarefa com logar (expert time) e logística.

## Entrega-o

`outputs/skill-horizon-interpretation.md`审查 o pedido de horizonte do fornecedor,并产出基准要求与部署现实之间的差距分析──

## 练习

1. 运行 `code/main.py` confirmar que 50% do horizonte correspondente ao que se encontra em terra sintética  agora será reduzida a metade a rede de tempo de tarefa  estimativa do horizonte

2. 阅读METR's Time Horizon 1.1 blog post── encontrar tarefas específicas de máxima e mínima confiabilidade── explicar por que haverá essa diferença──

3. 阅读 METR 的衡量自主AI Capacidades资源──列出 HCAST 任务类别──选择一个你会在生产任务中赋予更高权重的类别,并说明理由──

4. Introdução de simulador: transformar 20% das tarefas fracassadas em sucesso.

5. Baseado em seu próprio backlog de bugs ou representativo conjunto de tarefas, desenhe uma avaliação de horizonte interno. Descreva a coleta de dados, a sua configuração e o seu resultado.

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| METR | “外部评估者” | 前身为 ARC Evals；自 2023 年 12 月起为独立 501(c)(3) |
| Time Horizon | “能力度量” | 来自 logistic fit 的、50% 可靠性下的专家任务长度 |
| HCAST | “METR 的主套件” | 180+ 个任务，跨度从 1 分钟到 8+ 小时 |
| RE-Bench | “Research engineering” | 71 个带人类 baseline 的 ML research-engineering 任务 |
| SWAA | “短任务套件” | 校准 horizon curve 的低端 |
| Doubling time | “增长率” | 50% horizon 翻倍所需时间；按 HCAST 约 7 个月 |
| Eval-context gaming | “模型行为不同” | 测试与部署之间有记录的行为差距 |
| Upper bound | “Horizon 是上限” | benchmark horizon > 负载下的 deployment reliability |

## 延伸阅读

- [METR — Resources for Measuring Autonomous AI Capabilities](https://metr.org/measuring-autonomous-ai-capabilities/) HCAST、RE-Bench、SWAA 规格──
- [METR — Measuring AI Ability to Complete Long Tasks](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/) Origem de papel horizonte。
- [METR — Time Horizon 1.1 (January 2026)](https://metr.org/research/) 当前数字和方法论──
- [Epoch AI — METR Time Horizons benchmark](https://epoch.ai/benchmarks/metr-time-horizons)- Não, não.
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 关于 METR measurements 的内部视角──
