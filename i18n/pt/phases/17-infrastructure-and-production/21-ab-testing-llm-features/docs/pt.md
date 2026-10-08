# A/B Testing LLM  Função  GrowthBook、Statsig

> 傳統 A/B Testing não é para não-construção de LLM                                                                                                                                                                                                                                                      **Statsig**(Opt-A-I-B) - O teste sequencial ∞ CUPED ∞ integração∞**GrowthBook** código aberto ∼ armazenamento nativo ∼ Bayesian + Frequentist + Sequential  engine ∼CUPED、SRM check ∼Benjamini-Hochberg + Bonferroni 校正── sua escolha depende de se preferir o armazenamento-SQL, bem como  foi adquirido por OpenAI 收购 para a sua organização ∼

**Type:** Learn
**Languages:** Python (stdlib, toy sequential test simulator)
**Prerequisites:** Phase 17 · 13 (Observability), Phase 17 · 20 (Progressive Deployment)
**Time:** ~60 minutes

## Objectivo de aprendizagem
- 区分 evals(模型能完成这项工作吗) e testes A/B (A/B)
- 列举三个可测试轴线(prompt、model、parameters),并为每个轴线选择指标──
- 解释 CUPED、testing sequencial 和 Benjamini-Hochberg correções de comparação múltipla。
-  baseado em armazenamento-SQL 姿态和企业收购立场, entre Statsig ou GrowthBook 

## 问题
Você fez uma modificação do sistema imediatamente. Parece melhor. Você o publicou. A taxa de conversão mudou como ruído. Você culpou o indicador. Ou você publicou um novo modelo, mas a taxa de conversão não mudou.

Evals  responder modelo se pode completar tarefas em um conjunto de tags ⋅ não responder usuário se preferir o output ⋅ apenas experimentos online controlados pode responder a essa questão, e pressupõe que o experimento tem poder suficiente, controle incerteza, e fazer correções para múltiplas comparações ⋅

## 概念
### Evals vs testes A/B

**Evals** 离线、带标签集合、judge(rubrica、LLM-as-judge或人工) ⋅ resposta:

**A/B test** 在线、真实用户、随机分配──答:新变体是否推动了关键用户级指标?

两者都需要──Evals 在曝光前捕捉回归;A/B 在上线后确认产品影响──

### O que testar

1. **Prompt engineering** 措辞、system-prompt 结构、示例──指标: taxa de sucesso da tarefa、 user留存、cost/request──
2. **Model selection** GPT-4 vs GPT-3.5-Turbo vs Llama-OSS── 指标:exactitude(任务) + custo/requisito + latência P99──多目标──
3. **Generation parameters** temperatura top-p、max_tokens。

### CUPED  方差降低

Experimentos controlados Usando dados pré-experimentais.

Realização:Statsig 和 GrowthBook foram realizados.

### Testeamento seqüencial

经典 A/B 假设固定样本量──Sequenciais testes(peek-and-decide) 在重复查看时控制虚假阳性率── Sempre válidos procedimentos sequenciais(mSPRT、Howard's confidence sequences)

### Políticas de avaliação

Em 95% de confiança, executar 20 testes A/B, produzirá um falso positivo por acaso. A correção de Bonferroni irá ser apertada em cada teste.

### Descoincidência da relação SRM  amostras

Assegnação hash vai distribuir o usuário como quiser para os variantes. Se 50/50 切分实际得到 47/53,说明某处坏SRM check 会标记它.

### Statsig vs GrowthBook

**Statsig**- Não .
- Foi lançado em outubro de 2015 e foi lançado em outubro de 2015.
- Testes sequenciais  CUPED  populações excluídas
- Integrado: bandeiras de características + experimentação + observabilidade.
- O que é mais importante é que o grupo já quer comprar produtos e não quer abrir a sua propriedade.

**GrowthBook**- Não .
- Open-source (MIT); warehouse-native(directamente de Snowflake/BigQuery/Redshift 读取)
- Dois tipos de motores: Bayesian, Frequentist, Sequencial.
- CUPED、SRM、Bonferroni、BH correções。
- Auto-host ou nuvem gerenciada.
- 最适合: warehouse-SQL 团队, dados团队控制指标层,希望使用OSS──

### Não-confiança faz com que o funcionamento estatístico se torne complexo

Como um prompt 会产生不同输出── 传统电力计算 假设 IID观测──由于 LLM não é incerta, a quantidade de amostra válida é menor que a nominal de amostra── Como um marginal de segurança, a quantidade de amostra necessária será multiplicada por cerca de 1,3-1,5x──

### Resultados reais dos casos

- Modelo de recompensa do chatbot 变体: +70% 对话长度 +30% 留存──
- Próximo tema: função de recompensa 优化后 +1% CTR──
- Khan Academy Khanmigo: em torno de atraso e matemática de precisión

### Contrário:

Cada engenheiro de capital pode dizer que um função foi lançada em uma situação sem A/B, porque a sensação de melhor foi feita. A maioria deles fez com que os indicadores de produtos não tenham sido notados por meses.

### Você deve lembrar-se de números

- Statsig 被 OpenAI 收购: $1.1B,2025 年 9 月。
- GrowthBook: open source MIT; Bayesian + Frequentist + Sequential。
- CUPED 方差降低30-70%──
- LLM não está definido → +30-50% 样本量缓冲──


```figure
mx-sequential-test
```

## Use-o
`code/main.py`模拟一个带有固定边界和序列边界的序列 A/B test──展示序列 如何让你提前停止──

## Entrega-o
本课生成 `outputs/skill-ab-plan.md` Deste a mudança de características, carga de trabalho, linha de base, selecção de plataforma, portas, tamanho da amostra.

## 练习
1. 运行 `code/main.py`◊ Para a linha de base de conversão de 3%  expectativa de elevação de 5%, para atingir 80% de potência  
2. Para um atendimento à saúde  monitoramento de on-premise  clientes escolher Statsig ou GrowthBook。
3. Design a A/B, test GPT-4 vs GPT-3.5 em custo-por-resolvido-ticket                                                                                                                                                                                                                                                 
4. Seu canário 通過, mas A/B 顯示 -1.2% conversão──你會發布嗎?
5. Para a aplicação de CUPED em um período anterior, a diferença entre a fase posterior e a diferença entre a fase anterior e a fase posterior é de 60% e calcula o aumento efetivo do tamanho da amostra.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Eval | “offline test” | 对模型能力的带标签集合评估 |
| A/B test | “experiment” | 面向用户的在线随机比较 |
| CUPED | “variance reduction” | 用前期回归来降低方差 |
| Sequential test | “peek-ok test” | 允许提前停止的 always-valid procedure |
| Multiple comparison | “the family error” | 运行许多测试会放大 false positives |
| Bonferroni | “tight correction” | 将 α 除以测试数量 |
| Benjamini-Hochberg | “BH FDR” | false-discovery-rate 控制，较不保守 |
| SRM | “bad split” | Sample ratio mismatch；分配 bug |
| Statsig | “OpenAI owned” | 商业一体化平台，2025 年被收购 |
| GrowthBook | “the OSS one” | MIT warehouse-native 平台 |
| mSPRT | “sequential probability ratio test” | 经典 sequential procedure |

## 延伸阅读
- [GrowthBook — How to A/B Test AI](https://blog.growthbook.io/how-to-a-b-test-ai-a-practical-guide/)
- [Statsig — Beyond Prompts: Data-Driven LLM Optimization](https://www.statsig.com/blog/llm-optimization-online-experimentation)
- [Statsig vs GrowthBook comparison](https://www.statsig.com/perspectives/ab-testing-feature-flags-comparison-tools)
- [Deng et al. — CUPED](https://www.exp-platform.com/Documents/2013-02-CUPED-ImprovingSensitivityOfControlledExperiments.pdf)
- [Howard — Confidence Sequences](https://arxiv.org/abs/1810.08240)
