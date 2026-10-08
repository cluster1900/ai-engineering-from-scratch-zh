# Debate e cooperação entre vários agentes

> Du et al. ((ICML 2024,Society of Minds)) operar N 个模型实例, estes casos primeiro independentemente apresentar respostas, então em R 轮中相互代批判, para realizar recepção──它能提升事实性、规则遵循和推理──Sparse topology 在 Token 成本上优于全网──

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 12（Workflow Patterns），Phase 14 · 05（Self-Refine and CRITIC）
**Time:** ~60 分钟

## Objectivo de aprendizagem
- 解释辩论协议:N 个提议者、R 轮,并收到一个共享答案──
- Descrição do porquê do debate 能提升事实性、遵循规则 和推理──
- Explicar topologia escassa: não todos os debatedores precisam ver todos os outros debatedores.
- Em LLM escrito 上实现一个stdlib debate, contendo rede completa 和稀变体;

## 问题
Auto-refinamento (第 05 课) é um modelo de crítica auto, existe o pensamento de grupo 风险――CRITIC (风险――CRITIC)

## 概念
### Sociedade das Mentes ((Du et al., ICML 2024)

- N 个模型例针对同一个问题独立提出答案――
- Em R 轮中, cada modelo lê as propostas dos outros modelos e os critica.
- Modelo baseado em críticas, actualizar suas respostas.
- R 轮后, retornar 收收后的答案──

O primeiro experimento foi feito com o custo de considerar o uso de N=3、R=2── em problemas difíceis, mas o primeiro foi o uso de mais agentes e mais rotas para melhorar a precisão.

组合 跨型模型优于单型辩论:ChatGPT + Bard 组合 > 任一单独模型──

### Topologia de escassez

 Melhoria do debate multi-agente com topologia de comunicação Sparse(arXiv:2406.11776,2024-2025) mostrou, debate de rede completa 并不总是最优──Sparse topologies(star、ring、hub-and-spoke) pode ser usado com Token 成本更低 达到相近精度── cada um dos debatedores apenas vê um subconjunto de seus pares──

 impacto:

- Messa completa N=5,R=3 = 5 × 3 = 15 propostas, cada um de nós lida 4 peers = 60 vezes opções críticas.
- Estrela N=5,R=3 ((um hub + 4 个发言) = 15 个提案,发言 只读取 hub = 12 vezes crítica opções。

### Quando o debate ajuda

- **Factuality。**N 个独立提案,cross-check 降低幻觉──
- **Rule-following。**A validade do movimento de xadrez. Um modelo deixa de cumprir as regras, outros modelos o conseguem.
- **Open-ended reasoning。**Diversas formas de enquadramento vão se encolher gradualmente até a resposta correta.

### Quando o debate dói

- **Latency-sensitive UX。**N × R 个串行轮次会产生你可能无法承受的延迟──
- **Cost-sensitive scale。**Cada problema precisa de um N × R Token.
- **Simple factual lookups。**Uma vez mais, mais barato que cinco debates.

### 2026 instâncias práticas

- **Anthropic orchestrator-workers**(第 12 课)  带合成步骤的一种辩论 变体──
- **LangGraph supervisor**(第 13 课)  Roteador central + agentes especializados podem transformar o debate em um nó.
- **OpenAI Agents SDK**(第 16 课)  agentes 通过 handoff 来回进行反复批评──
- **Multi-agent evals** Vai debater + evaluador-optimizador 配对, para o sinal de avaliação

### Este é um lugar fácil de sair

- **Convergence collapse。**Todos os agentes foram recebidos para a primeira resposta errada.
- **Hub failure。**Na topologia estelar, um centro de ruína contaminará todos os habitantes.
- **Prompt homogenization。**Todos os agentes utilizam o mesmo prompt; eles geram a mesma resposta.


```figure
debate-converge
```

## Construí-lo
`code/main.py`实现了 stdlib debate:

- `Debater`classe (带有每个辩论者意见漂移的脚本的LLM) ⋅
- `FullMeshDebate`和 `SparseDebate`Corredores.
- Três questões: um factual, um baseado em regras, um raciocínio.
- Metricas: resposta convergente, rodadas de convergência, operações de crítica total,

运行:

```
python3 code/main.py
```

输出: precisão e custo de cada protocolo;esparsa em 2/3 问题以更低成本匹配全网──

## Use-o
- **Anthropic orchestrator-workers**Usado para debates simples de 2-3 trabalhadores.
- **LangGraph**Usado para levar o ponto de checagem de um debate estatal de várias rodadas.
- **Custom**Utilizadas para garantir a correcção de estudos ou de garantias especiais.

## Entrega-o
`outputs/skill-debate.md` criar um debate multi-agente, com topologia configurável ∞ N、R 和 regra de convergência ∞

## 练习
1.  Realizar um desacuerdo forçado Regra:                                                                                                                                                                                                                                                         
2. 添加信心重量集:debaters 返回 (resposta, confiança);agregador 按信心 加权──¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿
3. O que é o "Heterogeneity"?
4. Em seus 3 problemas, medir a malha completa com o token escasso, o custo de desenho vs precisão.
5. Leia o artigo da Sociedade das Mentes. Transporte o teu brinquedo para N=5, R=3.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Debate | “Multi-agent critique” | N 个 proposers，R 轮 cross-critique，并收敛 |
| Full mesh | “Everyone reads everyone” | 每个 debater 每轮读取每个 peer |
| Sparse topology | “Limited peer view” | Debaters 只读取 peers 的一个子集 |
| Hub-and-spoke | “Star topology” | 一个 central debater，N-1 个 spokes 只读取 hub |
| Convergence | “Agreement” | Debaters 收敛到一个共享答案 |
| Society of Minds | “Du et al. debate paper” | ICML 2024 multi-agent debate method |

## 延伸阅读
- [Du et al., Society of Minds (arXiv:2305.14325)](https://arxiv.org/abs/2305.14325) 经典 debate multi-agente
- [Sparse Communication Topology (arXiv:2406.11776)](https://arxiv.org/abs/2406.11776) topologia escassa 结果
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) Orquestra-trabalhadores  como um debate 变体
- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) Autocrítica de um único modelo para o tratamento
