# 失效模式  MAST、Gruppo pensamento、Monocultura、Erros de cascada

> Taxonomia de referência para 2026 é:**MAST**(Cemri et al., NeurIPS 2025, arXiv:2503.13657), originou-se de 7 state-of-the-art open-source MAS's 1642 条执行 trace,显示出 **41–86.7% 的失败率**❖ três raízes:**Specification Problems**(41,77%) 角色歧义、任务定义不清;**Coordination Failures**(36,94%) 通信中断、 estado desync;**Verification Gaps**(21.30%) 缺少验证、缺少质量检查──**Groupthink**Famili(arXiv:2508.05687) complementou: colapsos da monocultura(Same base model → 相关失败)  viés de conformidade(agentes 相互强化彼此的错误)  teoria de mente déficita、 dinâmica de motivos mistos、 cascada falhas de confiabilidade。级联示例:retry storms,其中一次支付失败 触发订单反复,进而触发库存反复,最终压库存服务几秒内 10x load  需要电路断断机)  Envenenamento da memória: alucinação de um agente 进入共享记忆,下游代理将准其当事率下降;确实逐渐,使根原因 诊断变得痛苦────**STRATUS**(NeurIPS 2025) relatório, através de agentes de detecção / diagnóstico / validação especializados, sucesso de mitigação 提升 1.5x──本课把失败模式 视为一等工程目标──

**Type:** 学习
**Languages:** Python (stdlib)
**前置要求:**Fase 16 · 13 (Memória compartilhada), Fase 16 · 14 (Consenso e BFT), Fase 16 · 15 (Topologia de votação e debate)
**Time:** ~75 分钟

## 问题

Os sistemas multi-agentes em tarefas reais têm uma taxa de falha de 41-86,7% (Cemri et al. 2025 em 7 MAS de código aberto) ⋅ Não é apenas por adicionar mais agentes em termos de capacidade de regulação. Estas falhas têm razões estruturais.

A prática de produção de 2026 é a de colocar os modos de falha como um design input. Sua arquitetura só pode se orientar para cada categoria MAST e dizer que, quando a mitigação já está implantada, é suficientemente boa.

## 概念

### Categorias de MÁST

**Specification Problems（41.77% 的失败）。**A definição das tarefas do agente não é suficientemente rigorosa.

- Ambiguidade de papel: dois agentes se consideram críticos.
- A tarefa foi subespecificada: o usuário quer um ângulo específico, mas apenas disse que resuma isso.
- Critérios de sucesso implícito:agente não pode julgar se é bem sucedido.

Mitigações:
- Escrever contratos de papel definidos. Cada agente é convidado a explicar o que faz, e o que não faz.
- Cada tarefa tem provas de aceitação.
- Verificação de especificações pré-voio: um agente único na expedição

**Coordination Failures（36.94%）。**Comunicação ou estado de interrupção.

exemplo:
- Os dois agentes, sem sincronia, renovaram o estado compartilhado.
- Mensagem entre agentes 丢失(falecimento da fila タイムアウト)
- Drift de Estado:o agente A considera que a missão já foi concluída;o agente B ainda está a executar-se.

Mitigações:
- 带版本的共享状态, usar a concurência otimista
- Para as mensagens-chave fazer reconhecimento expresso (retry until acked)
- 定期 state-sync checkpoints;尽早检测漂移──

**Verification Gaps（21.30%）。**Não há controlo independente para a exportação.

exemplo:
- Um agente afirma ser bem sucedido, não há ninguém a provar.
- Uma série de agentes têm a certeza de que o outro está a sair.
- Para o comportamento composto emergente  falta de cobertura de testes 

Mitigações:
- 独立验证代理 (Leção 13) ・ Apenas leitura, acesso independente à fonte。
- O contrato de transferência é de forma clara: A de saída deve passar pelo check C,B 才能开始──
- Por análise pós-hoc  registar o registro de resultados 

### Família de pensamento em grupo (arXiv:2508.05687)

Quando os agentes se qualificam ou se imitam, surgem cinco tipos de falhas relacionadas:

**Monoculture collapse。**Como o modelo base ou os dados de treinamento → 相关错误──当三代理 共享一个LLM 时,它们也共享它的幻觉──

**Conformity bias。**Agentes para o mais alto ou mais confiante de seus pares, mesmo que seja errado.

**Deficient ToM。**Agentes não conseguem construir crenças entre si; coordenação 崩(Lessão 18)。

**Mixed-motive dynamics。**具有部分一致激励的代理人 漂移到折中中态,结果谁都不满足──

**Cascading reliability failures。**Patrão de erro de um componente 触发依赖组件中的错误模式──

### Exemplo em cascata  a tempestade de retomada

Um clássico padrão de incidente de 2026:

```
payment service fails 10% of requests
   ↓
order agent retries payment (exponential backoff but naive)
   ↓
each retry is a new order-inventory check
   ↓
inventory service sees 2x normal load
   ↓
inventory service starts timing out
   ↓
every order retries inventory check
   ↓
inventory service sees 10x normal load
   ↓
cluster goes down
```

修复方式是经典做法:**circuit breakers** Rate de erro 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时

Os interruptores de circuito são uma das poucas mitigadoras de falhas de vários agentes que podem ser utilizadas e modificadas diretamente a partir de sistemas distribuídos.

### Envenenamento da memória

A partir da lição 13: A alucinação de um agente se transforma em fato de memória compartilhada; os agentes são analisados com base em fatos contaminados.

Os sintomas são a taxa de precisão gradualmente diminuindo. Não se acerta.

Mitigação: só aplique o log, proveniência, verificador não escritível.

### STRATUS  Agentes especializados para detecção de falhas

STRATUS(NeurIPS 2025) relatou que, quando você é implantado no seguinte papel, o sucesso da mitigação aumentou 1,5x:

- **Detection agent。**监视症状模式(高不一致、retry spikes、精度漂移) 
- **Diagnosis agent。**给定症状, from MAST taxonomy 推断可能根原因──
- **Validation agent。**Em aplicação de mitigação, os sintomas do exame são eliminados.

É aplicado aos sistemas de agentes de resposta a incidentes de estilo SRE.

### A auditoria de modo de falha

A melhor prática para 2026 é realizar uma auditoria de modo falha anualmente (ou em grande escala):

1. **Trace sample。**收集约1000 条 verdadeiros vestígios de execução。
2. **Categorize。**Para cada traço de fracasso, mapeado para categorias de MAST + Groupthink.
3. **Compute failure-by-category rate。**Que categorias dirigem o teu sistema?
4. **Rank mitigations。**Qual é a solução que pode eliminar o maior número de falhas?
5. **Pick 2-3 mitigations。**实现;下季度重新审计──

Não há auditorias, falhas, confusão, ruído, nunca há tratamento sistemático.

### Quando os sistemas falham silenciosamente

A categoria de falhas mais perigosa é a falha de corretão silenciosa. Um sistema que fracassou fortemente pode ser monitorado. Um sistema que produz resultados plausíveis mas errados não pode passar por registros de exceções. É por isso que as lacunas de verificação - embora em número apenas representem 21,30%, por vezes, a falha é considerada a classe mais cara.

投资于:
- Revisão humana baseada em amostras.
- Testes de regressão de conjunto de dados dourados:
- Para o controlo transversal de importantes saídas,

### Falha versus falha lenta

Alguns fracassos são imediatos; alguns são lentos.

2026 年の工程動作:instrument slow-failure proxies, so you can in drift 变成可见错误之前捕获它──Contrato taxa, taxa de retiro, distribuição de comprimento de saída, bem como a continuidade de distância entre as versões de agente  são proxies úteis──


```figure
a5-retry-cascade
```

## Construí-lo

`code/main.py`实现:

- `FailureTaxonomy` 将模拟事件 分类为 MAST + Grupo de pensamento categorias。
- `CircuitBreaker` 经典模式;当 error rate 超越 threshold 时打开。
- `RetryStormSimulator` 展示 cascata falha;切换断路开关/关闭──
- `DetectionAgent` Matching de sintomas de estilo STRATUS com guião.

运行:

```
python3 code/main.py
```

预期输出:
- 没有断路的重试暴风雨: erros de inventário 爆炸式增长(模拟) 』
- Existe interruptor de circuito: em limite de entrada, fornece respostas de modo degradado.
- Agente de detecção 标记该模式并命名 MAST categoria。

## Use-o

`outputs/skill-mast-auditor.md`Para o sistema multi-agente 运行 MAST-style failure-mode audit──Traces → categorization → mitigation ranking──

##  Publicá-lo

Disciplina de modo de falha em 生产中:

- **每季度 MAST audit。**Não é anual. As categorias vão evoluir e mudar com o crescimento do sistema.
- **到处部署 circuit breakers。**Para cada chamada de saída de qualquer serviço dependente, o limiar aberto é de 5 a 10% de taxa de erro.
- **Golden datasets。**O teste de regressão é realizado semanalmente.
- **STRATUS trio。**Detecção + Diagnóstico + Agentes de validação  monitoramento produção―previamente apenas de agente de detecção  começam; quando os sintomas são ruidosos 时再添加诊断―
- **Failure budget。**Por categoria 统计的失败率 设定显式 SLO──超出预算 会触发停止运输对话──

## 练习

1. 运行 `code/main.py`Confirmar interruptor de circuito limitou tempestade de retoma, ajustar o limiar de falha e observar a diferença.
2.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              **slow-failure proxy**A taxa de concordância dos agentes de correlação é de 3%, quando a taxa de concordância é de uma baixa acentuada.
3. 阅读 Cemri et al.(arXiv:2503.13657)。 escolher um dos seus 7 sistemas MAS,并映射其前3失败类别──它们与 MAST的预测相比如何?
4. 阅读 Groupthink paper(arXiv:2508.05687)。识别五种模式 中哪一种在生产中最难检测── apresentar uma métrica proxy──
5. Para que você entenda de um determinado sistema multi-agente específico  desenhar um trio de detecção-diagnóstico-validação de estilo STRATUS  Detecção  Monitorizar quais sintomas? Diagnóstico  Recomendação de quais medidas de mitigação? Validação  Como confirmar que são eficazes?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MAST | “2026 taxonomy” | Cemri 2025；3 个根类别 + 14 个 failure sub-types。 |
| Specification Problem | “Role ambiguity” | 任务或角色定义不足；agents 不知道该做什么。 |
| Coordination Failure | “State drift” | agents 之间的通信或同步中断。 |
| Verification Gap | “No one checked” | 输出在没有独立验证的情况下被接受。 |
| Groupthink family | “Homogeneity failures” | Monoculture、conformity、deficient ToM、mixed-motive、cascading。 |
| Monoculture collapse | “Same model, same hallucinations” | 来自共享 base model 或 training data 的相关错误。 |
| Retry storm | “Cascading error amplification” | 一次 failure 触发 retries，进而放大下游 load。 |
| Circuit breaker | “Fail fast on error rate” | 当 error rate 超过 threshold 时打开；用 default 短路。 |
| STRATUS | “Incident response trio” | Detection + diagnosis + validation agents。1.5x mitigation success。 |
| Memory poisoning | “Hallucinations propagate” | Shared-memory fact 被污染；下游 agents 基于 poison 推理。 |

## 延伸阅读
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) Taxonomia MAST, NeurIPS 2025
- [Groupthink failures in multi-agent LLMs](https://arxiv.org/abs/2508.05687) monocultura, conformidade e taxonomia de cinco famílias
- [STRATUS — specialized agents for MAS incident response](https://neurips.cc/) Introdução ao processo NeurIPS 2025 (detecção + diagnóstico + validação)
- [Release It! — stability patterns (Nygard)](https://pragprog.com/titles/mnee2/release-it-second-edition/) 经典 interruptor de circuito 参考
- [Anthropic — Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) Notas de falha de modo de produção
