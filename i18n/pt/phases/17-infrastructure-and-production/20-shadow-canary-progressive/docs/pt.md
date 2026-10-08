# Tráfico de sombras dos LLMs, implantação e implantação progressiva dos Canários

> Os lançamentos de LLM combinam a parte mais difícil da implementação de software: não há modos de teste de unidade, falha, sinais estão atrasados. O sequência é: 1) modo sombra  irá fazer pedidos de produtor copiar para um modelo candidato, registar o dia e comparar, para o usuário 零; pode capturar problemas de distribuição evidentes, mas não garante a qualidade; 2) lançamento de canais                                                                                                                                                                                                             

**Type:** 学习
**语言：**Python, simulador de progressão canária de brinquedos)
**Prerequisites:** Phase 17 · 13（Observability），Phase 17 · 21（A/B Testing）
**Time:** ~60 分钟

## Objectivo de aprendizagem

- 区分影音模式 (零影响比较) 卡纳里 (canário) 直播流量 (live traffic)  A/B (stability confirmation)  后的比较)
- 列举五个LLM-specific canary metrics (latencia, custo/ solicitação, erro/recusado, distribuição de comprimento de saída, feedback do utilizador)
- 解释为什么LLM não-determinismo ((最高15%) 会改变 rollout 中 stable 的含义──
- 设计一个耗时几秒的政策转换) em vez de 几个小时的重新部署) de um caminho de retorno 

## 问题

Você lançou um novo modelo. Avaliações offline mostram precisão. Avaliou 3%. Você está em produção.

Tudo isso poderia ser evitado. O modo sombra irá capturar até 40% de aumento de custos antes que qualquer usuário veja. O Canary irá parar em 10% quando o movimento é alterado.

## 概念

### Modo de sombra

Candidato  recepção e produção Similar requisites; resultados serão registrados, mas não serão devolvidos ao usuário ∞ para usuário ∞ impacto ∞ registros:

- O conteúdo da produção é diferente da produção.
- Contagem de tokens (Delta de custo)
- Latência.
- Rejeição e erro.

能捕捉:cost blow-ups、length regressions、manifest refusal changes、hard errors──不能捕捉:user will perceive its quality delta──Shadow is a smoke test, not a quality test──

### Lançamento das Canárias

带 gate 的渐进的交通转移──典型进度:1% → 10% → 25% → 50% → 75% → 100%── cada passo baseado em 5 métricas 设置门:

1. **Latency percentiles** P50、P95、P99。 violação: canário de P99 > linha de base de 1.5x。
2. **Cost per request** 混合 $──违规:高于基线 >20%──
3. **Error / refusal rate** 5xx 加明显拒绝──违规:baseline 的 2x──
4. **Output length distribution** média + P99。 violação: deslocamento de distribuição。
5. **User-feedback rate** pulgares para baixo / bilhetes de depósito。 violação: linha de base 的 1.5x。

### Não-determinismo é uma nova variância .

As mesmas entradas produzem não-exatamente as mesmas saídas.

- Não-associação do GPU FP (ordem de redução de ponto flutuante 会随批 变化)
- Variância de tamanho do lote (((o mesmo pedido em lote de 128 com lote de 16 中不同)
- Amostragem de temperatura > 0)

实测: em setos de avaliação iguais 上, variação de precisão run-to-run máxima de 15%。Stable Em rollout significa métricas 处于预期变化内, em vez de com a linha de base 完全相同──把门 设置在噪音 floor 之上──

### Custo é variação

Um bom modelo de 20% Cada vez que o uso é caro 3 vezes.

### O Rollback é uma arma .

- Flag Policy ((feature flag system): está em configuração.
- Modelo de fixação de registos: modelo de fixação de registos Não será automatizada.
- Rollback = revert flag + set pined digest para anterior──数秒,而不是数小时──

Se a sua pilha precisar de redeployar para o rollback, antes de ser lançada, primeiro corrija isso.

### Ferramentas

**Argo Rollouts**- Não .**Flagger** Controllers de entrega progressivos Kubernetes──与 Istio/Linkerd roteamento ponderado 集成──

**Istio weighted routing** serviço-messe 级流量拆分──

**KServe / Seldon Core** 内置 canary さんのモデルサービス。

**Feature flags**Lançamento: Darkly, Flagsmith, Unleash, Flip de nível de política, não precisa de redeployment.

### Cadência de métricas

Canary gates Cada 5-15 minutos de verificação uma vez, depende especificamente do volume de tráfego. 1% de tráfego e 10 req/min.

### A/B 步骤是可选的

Se o novo modelo 明显不同( diferentes comportamentos、 diferentes curvas de custo、 diferentes tomes), em canary 通過後以 50% fazer teste A/B──

### Você deve lembrar-se de números

- Progressão canária: 1% → 10% → 25% → 50% → 75% → 100%。
- Limites de não-determinismo: variação corrida a corrida da mesma entrada máxima máxima de 15%
- 五个加纳里指标: atraso, custo, erro/recusado, duração de saída, feedback do utilizador,
- Portais de custo:高于基线 >20% 即为违规――
- Rollback: alguns segundos, em vez de alguns minutos.


```figure
i4-canary-ramp
```

## Use-o

`code/main.py`模拟带有注入回归的加纳里推广――报告推广 在哪个阶段 停止,以及哪个门被触发──

## Entrega-o

本课生成 `outputs/skill-rollout-runbook.md` Designado modelo candidato, linha de base, tolerância ao risco, designado plano de sombra→canário→100%

## 练习

1. 运行 `code/main.py`◊ Injectar 25% de regressão de custos ―canary 会在哪个阶段 停止?
2. Seu novo modelo em linha de fora tem um ganho de 3% de precisão, mas o custo/requisito é +18%── será lançado?
3. Desenhar um tempo de volta de 60 segundos a menos. Listing needed infrastructure
4. Não-determinismo em sua avaliação 上显示 ±7%── configurar portões canários, evitar falsos alarmes── você usa quais multiplicadores?
5. Modo de sombra em canário                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Shadow mode | “duplicate to new” | 用于 logging 的零影响 send-to-candidate |
| Canary | “progressive traffic” | 带 gates、暴露给用户的渐进式 rollout |
| Gates | “rollout checks” | 阻止 progression 的 metric thresholds |
| Non-determinism | “LLM variance” | 不可消除的 run-to-run differences |
| Policy flag | “flag flip rollback” | Config-level rollback，数秒而不是数小时 |
| Model pin | “registry digest” | 指向 model version 的不可变 reference |
| Argo Rollouts | “K8s progressive” | Kubernetes-native canary/rollback controller |
| KServe | “inference K8s” | 带 canary primitives 的 model serving |
| Istio weighted | “mesh split” | Service-mesh traffic splitter |

## 延伸阅读

- [TianPan — Releasing AI Features Without Breaking Production](https://tianpan.co/blog/2026-04-09-llm-gradual-rollout-shadow-canary-ab-testing)
- [MarkTechPost — Safely Deploying ML Models](https://www.marktechpost.com/2026/03/21/safely-deploying-ml-models-to-production-four-controlled-strategies-a-b-canary-interleaved-shadow-testing/)
- [APXML — Advanced LLM Deployment Patterns](https://apxml.com/courses/mlops-for-large-models-llmops/chapter-4-llm-deployment-serving-optimization/advanced-llm-deployment-patterns)
- [Argo Rollouts docs](https://argo-rollouts.readthedocs.io/)
- [Flagger docs](https://docs.flagger.app/)
