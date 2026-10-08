# Sociedade da Mente e debate multi-agente

> Minsky em 1986 premissa, ou seja, a inteligência é uma sociedade composta por especialistas, cada década será redescoberta uma vez. Em 2023, Du et al. transformá-la em um algoritmo específico: várias instâncias de LLM  apresentar respostas, ler respostas um ao outro, crítica, e atualização.**multiple agents**和 **multiple rounds**Toda a sociedade  venceu um monólogo de agente único; intercâmbio de várias rondas  venceu um voto de um tiro 

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~60 minutes

## 问题
Auto-consistência, ou seja, para um modelo 采样多次并取多数答案, é o raciocínio mais barato que você pode adicionar 改进── é eficaz, mas rapidamente 和── você pode duplicar as amostras, mas não vê até outra vez de melhoria significativa──

O debate 打破了这种和── não é de um modelo 取 N 个独立样本, em vez de deixar N 个代理 阅读彼此的推理并修复──样本之间的相关性下降((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((

## 概念
### Du et al. 2023 算法

De arXiv:2305.14325 (ICML 2024):

1. Cada um dos agentes do meio tem um problema para gerar uma resposta inicial.
2. Para a rodada r = 2..R: Para cada agente  mostrar outros agentes em rodada r-1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
3. R 轮后, fazer maioria-voto à resposta final.

论文在 MMLU、GSM8K、biografias、MATH 和 factuality benchmarks 上测试──Debate 持续优于 CoT 和 Self-Reflection──

### 两个独立旋

Como se fosse um caso, o que é que eu quero dizer?

- **Agent count alone**(1 r, para N 个结果做多数投票) excede o agente único na maioria das tarefas, mas entra na plataforma period.
- **Round count alone**(1 个代理 见自己的先前推理) quase não ajuda, é o conhecido fracasso da reflexão.
- **Both together**O intercâmbio entre vários agentes levou a um aumento significativo.

### Porquê ?

 dois mecanismos:

1. **暴露于分歧。**Quando um agente vê a cadeia de raciocínio de outro agente e chega a conclusões diferentes, ela deve justificar, ou atualizar.
2. **相关错误减少。**Em auto-consistência, todas as amostras são provenientes do mesmo modelo, portanto, erros  correlacionados, você vai ter uma resposta média confiante mas errada ∼ diferentes modelos ou sementes ∼ correlacionadas ∼ diferentes *visões debatidas ∼ irá continuar a correlacionar ∼

### O debate é heterogêneo

A-HMAD 和相关后续工作为不同代理 使用 *不同基模型*──Llama + Claude + GPT debate 会减少 monoculture collapse(Lesson 26),因为一个模型家族的相关错误不会被其他模型家族共享────────────────────────────────────────────────────────────────────────────────────────────────────

缺点: weak model 参与辩论 时可能会把共识 拉向它的错误答案 (((见 

### NLSOM  129-agente 扩展

Zhuge et al. Mindstorms in Natural Language-Based Societies of Mind, arXiv:2305.17066) 将这个想法扩展到 129 成员社会──结果是: especialização 和自我组织 随规模涌现,并且系统在视觉问题答等任务上优于单代理──

### Modos de falha

- **Sycophancy cascade。**Todos os agentes estão obedecendo ao agente mais confiante. O debate se resume a opiniões adversárias.
- **Topic drift。**Douradas de debate 会偏离原始问题──缓解措施:每轮重新注入问题──
- **Compute blowup。**N agentes × R rodadas = N·R vezes chamadas de LLM, por chamada contexto estão em crescimento.


```figure
multi-agent-debate
```

## Construí-lo
`code/main.py`Em um problema matemático, é executado um debate de 3 agentes × 3 rodadas, em que cada agente começa a partir de uma resposta diferente.

A demonstração mostra dois principais efeitos:

- Uma vez que o intercâmbio de rotas vai fazer com que os agentes se aproximem mais da resposta correta.
- A segunda ronda de rotas adicionais após a apresentação de retornos em declínio (conforme o plano de Du et al.)

运行:

```
python3 code/main.py
```

## Use-o
`outputs/skill-debate-configurator.md`Para o novo debate de atribuição de tarefas: agentes números, rodadas, números, heterogeneidade, modelo igual versus misturado, atribuição de papéis, simetria versus oposição.

## Entrega-o
Se queres entrar em debate:

- **将 rounds 上限设为 3。**Du et al. mostram que 3 rotas capturaram a maior parte dos benefícios.
- **将 agents 上限设为 5。**超過 5 后, contextos bloat 和成本占主导──
- **默认 heterogeneous。**池中 pelo menos dois modelos base diferentes.
- **Adversarial slot。**Um agente é sugerido que, de qualquer forma, não concorde.
- **记录每一轮。**Os sistemas de debate de rodadas intermediárias não podem ser debug ou auditados.

## 练习
1. 运行 `code/main.py`, então vamos contar as rodadas 设为 5, observar retornos decrescentes... até que rodada de convergência adicional 停止?
2. O quarto agente do papel adversário: sempre discordar da maioria atual.
3. 绘制(打印) Score de acordo de cada rodada(Stopping majority answer 上的代理比例) ・・・ quando é que ele chega a 1.0?
4. 阅读 Du et al. Seção 4 ablações。 usar este código 复现 agentes-somente vs rounds-somente vs both 结果。
5. 阅读 Deberíamos estar indo LOCO? (arXiv:2311.17371),并列出 周轮轮 之外的两个辩论变化,例如法官领导的辩论链的辩论对抗性──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Society of Mind | “Minsky 的想法” | Intelligence 是互动专家集合；1986 年的 framing 现在通过 LLM debate 被 operationalized。 |
| Multi-agent debate | “Agents 争论” | N 个 agents 提出答案、相互 critique、经过 R 轮 revise，然后 majority-vote。 |
| Consensus | “他们达成一致” | 不是 epistemic truth，只是 fraction-on-majority-answer。可能自信地错误。 |
| Rounds | “Exchange steps” | 一轮 = 每个 agent 读取其他 agents 并 update 一次。 |
| Heterogeneous debate | “混合 model families” | 使用不同 base models 来去相关 errors。 |
| Sycophancy cascade | “每个人都同意那个大声的人” | 一种 debate failure：agents 不管正确性如何，都顺从最自信的 agent。 |
| NLSOM | “129-agent society” | Natural-language society of mind；Zhuge et al. 的 scaled version。 |
| Correlated error | “同一个 model，同一个 bug” | self-consistency 饱和的原因；跨不同 views 的 debate 会去相关。 |

## 延伸阅读
- [Du et al. — 通过 Multiagent Debate 提升 Language Models 的事实性与推理能力](https://arxiv.org/abs/2305.14325) Papel de referência,ICML 2024
- [Zhuge et al. — Mindstorms in Natural Language-Based Societies of Mind](https://arxiv.org/abs/2305.17066) 129-agente NLSOM
- [Should we be going MAD? A Look at Multi-Agent Debate Strategies for LLMs](https://arxiv.org/abs/2311.17371) Variantes de debate de referência
- [Debate project page](https://composable-models.github.io/llm_debate/) Código de Du et al. 、demos 和 detalhes de ablação
