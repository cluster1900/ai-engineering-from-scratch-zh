# Agente 經濟、Token  estimulação、 reputação

> 长周期自主代理人 (METR) 长周期自主代理人 (METR) 长周期自主代理人 (METR) 长周期自主代理人) 长周期自主代理人 (METR) 长周期自主代理人 (METR) 长周期自主代理人) 长周期自主代理人 (METR) 长周期自主代理人 (METR) 长周期自主代理人 (METR) 长周期自主代理人) 长周期自主代理能力 (METR) 长周期自主代理能力 (METR) 长周期自主代理能力) 长周期自主代理能力 (METR) 长周期自主代理能力 (METR) 长周期自主代理能力) 长周期自主代理能力 (新兴的) 长周期自主代理能力 (新兴的) 长周期自主代理能力) 长周期自主代理能力 (新兴的)**5-layer stack**É:**DePIN**(computação física) →**Identity**(W3C DIDs + 声誉资本) →**Cognition**(RAG + MCP) →**Settlement**(abstração da conta) **Governance**(DEAO agentes)  produção de agentes-incentivos 网络包括 **Bittensor**(sub-redes da TAO  modelos específicos de tarefas de recompensa)**Fetch.ai / ASI Alliance**(ASI-1 Mini LLM + FET token)**Gonka**(Baseado em transformador de PoW, será calculado novamente distribuído em AI tasks com valor de produção)**Shapley-value credit attribution**Para um justo recompensas aos agentes que contribuem; Google Research Design do mecanismo para grandes modelos de linguagem  Proposto em agregação monótona **token auctions** Esta categoria irá construir um mercado de agentes mínimos, irá atribuir crédito de valor Shapley 应用于多代理管道,并运行一场第二价代币拍卖,让游戏理论 机制具体落地──

**Type:** Learn
**Languages:** Python (stdlib)
**前置要求：**Fase 16 · 16(Negociação e negociação),Fase 16 · 09(Redes de atração paralela)
**Time:** ~75 分钟

## 问题
Quando os agentes criam valor em conjunto, mas também precisam ser recompensados separadamente, os sistemas multi-agente se tornam complexos. O mecanismo clássico, como a distribuição média, o último contribuinte tira tudo, seja injusto ou fácil de manipular.

Além da atribuição de crédito, esta área já se transformou em agentes económicos reais:Bittensor TAO  prêmio de computação de mineração, para ajustar os modelos específicos da sub-rede;Fetch.ai/ASI com tokens FET  prêmio ASI-1 Mini LLM Utilização;Gonka transformará a prova de trabalho novamente distribuída em uma AI de valor de produção  tasas;.

Este curso considera a economia de agentes como um problema específico: atribuição de crédito, design de mecanismos e reputação, e utiliza a mínima matemática para construir cada parte, deixando o conceito realmente permanecer para baixo.

## 概念
### 5 camadas de agente-economia

1. **DePIN（physical compute）。**Infraestrutura centralizada, para aluguer de GPUs, armazenamento, banda larga, subredes de bitsensores, rede de renderização, Akash, não pertence a agentes, agentes utilizam.
2. **Identity。**W3C Identificadores Descentralizados (DIDs) para cada agente 一个不依赖任何平台的持久 ID──声誉累积到DID 上──Agent Network Protocol (ANP) usando DID 作为发现层──
3. **Cognition。**Localização do agente:LLM + RAG + MCP.
4. **Settlement。**Abstração de contas ((ERC-4337) Deixar os agentes poderem pagar o gás a partir do seu próprio saldo, sem necessitar de ter ETH;.
5. **Governance。**DAOs agentes: por humanos e agentes juntos em relação às mudanças de protocolo votação estrutura de governo, voto e reputação vinculação

Não é que cada sistema de produção use todos os cinco níveis. O bitensor usa o primeiro, segundo, parte usa o terceiro, quarto, não usa o quinto.

### Bittensor、Fetch.ai、Gonka: coisas que realmente funcionam

**Bittensor（TAO）。**As subnetas são tarefas especiais ([[linguagem modelagem]], geração de imagem]], previsão)  Mineros comitantes de resultados de modelos  Validadores para a sua classificação  pontuação ponderada por participações  distribuição de recompensas TAO  cada subnet tem seu próprio método de avaliação  Econômicos: 付费 付费 ⇒ qualidade de produção específica de tarefas, em vez de 付费 ⇒ computação 付费 ⇒ uso 

**Fetch.ai / ASI Alliance。**ASI-1 Mini LLM 运行在 Fetch.ai's网络上; usuário usando tokens FET 支付推理 费用──这里代理人作为同伴的故事更强:Fetch 上一个代理可以调用另一个代理 完成任务,并使用 FET 付款──

**Gonka。**Transformador prova de trabalho:work é o passo para frente do transformador.

截至2026年4月, estes três são de nível de produção.

### Atribuição de crédito de valor Shapley

Três agentes colaboraram para completar uma tarefa.

Valor de Shapley: satisfazer quatro critérios de eficiência, simetria, linearidade e zero)`i`- Não .

```
shapley(i) = (1/N!) * sum over all orderings O of (v(S_i_O ∪ {i}) - v(S_i_O))
```

Entre eles `S_i_O`É um ranking .`O`- Não .`i`之前的代理 集合──实践中:枚举所有 permutations,记录每个代理 在每个 permutation 中的边际贡献,然后取平均──

Para N=3 agentes, há 6 permutações. Para N=10, há 3,6 milhões.

### Utilizado para o leilão de segundo preço de agregação

Google Research (WEB) propôs leilões de tokens de segundo preço para agrupar os resultados do LLM.

Isto é importante para os sistemas de LLM: pode transferir as tarefas de conclusão para vários agentes a preços diferentes; leilão: escolher o melhor método e pagar equitativamente; incentivos para os agentes: não há erros de informação.

### Capitais de reputação

绑定 DID's reputation score 从已确认贡献中累积──一个简单更新规则:

```
rep(i, t+1) = alpha * rep(i, t) + (1 - alpha) * contribution_quality(i, t)
```

Entre eles , o fator de decomposição .`alpha`接近 1― Reputation:

- Para decisões de roteamento para ler custos baixos
- 伪造成本高 (PDF)
- Pode ser cortado:未通過驗證的贡献会扣分──

### AAMAS 2025 para centralizar a LAMAS

LaMAS  proposta(AAMAS 2025) combinado: identidade DID, atribuição de crédito de valor de Shappley, e um simples mecanismo de leilão.

### O mecanismo económico vai cair

- **Price oracle manipulation。**Se a função de crédito pode ser manipulada, os agentes também a manipularão.
- **Sybil attacks。**Um operador inicia N 个假代理来提高自己的贡献──DIDs会减缓但不能阻止这种行为;缓解手段是声誉成本-to-forge──
- **Verification cost。**A equidade da atribuição de crédito depende do verificador. Se a verificação é conveniente, pode ser manipulada; se é caro, o sistema não pode ser expandido.
- **Regulatory overhang。**As economias de agentes e a gestão financeira estão em situação de "Legal Gray" até 2026.

### 什么时候 agentes economias 有意义

- **具有异构 operators 的开放网络。**Não há uma única equipa a controlar todos os agentes.
- **可验证输出。**Não há verificação, crédito é apenas um palpite.
- **Long-horizon workflows。**Uma tarefa de natureza não pode beneficiar-se da acumulação de reputação.
- **Tokenized payments 在你的司法辖区合法可行。**

No sistema empresarial fechado, o mecanismo económico permite uma distribuição mais simples (gerentes distribuem trabalho, métricas são internas).


```figure
swarm-auction
```

## Construí-lo
`code/main.py`实现:

- `shapley(value_fn, agents)` 通过枚举为小 N 精确计算 Shapley。
- `second_price_auction(bids)` 真实机制; vencedor 支付 segundo maior 
- `Reputation` 绑定 DID、带指数式衰退 和削减的声誉──
- Demo 1: três agentes 协作, exato Shapley 归因信用──
- Demo 2: Cinco agentes para um espaço de tarefa
- Demo 3:100 轮任务分配给具有异构代表的代理;rep-weighted routing 优于随机――

运行:

```
python3 code/main.py
```

预期输出: valores Shapley de cada agente; mostrar o resultado da licitação do equilíbrio de oferta verdadeira; mostrar aquecimento 后 rep-weighted routing 相比随机有 10-20% de ganho de qualidade。

## Use-o
`outputs/skill-economy-designer.md`design a economia de um agente mínimo: camada de identidade  seleccionar  mecanismo de atribuição de crédito  mecanismo de pagamento  regra de reputação 

## Entrega-o
Em 2026 anos de operação de agente economia:

- **从 reputation 开始，而不是 tokens。**Reputasão  Realização de custos baixos, de valor exclusivo; tokens aumentam a complexidade jurídica e económica¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- **奖励前先验证。**Não distribuir créditos sem verificação independente.
- **使用 Shapley-sample，而不是 Shapley-exact。**采样 100-1000 个订单;精确枚举无法扩展──
- **限制 decay factor，并设置 reputation floor。**无界衰退会抹抹合法贡献者;过慢衰退会奖励过时的高代表代理──
- **以 adversarial 方式审计机制。**Em um cenário de equipe vermelha, cada mecanismo tem teoria do jogo; você deve encontrar falhas, em vez de encontrar outros atacantes.

## 练习
1. 运行 `code/main.py` Confirmar os valores de Shapley 之和等于总值 (axioma da eficiência)  Modificar a função de valor; As atribuições de Shapley estão ou não a mudar de direção prevista?
2. 实现 Shapley *sampling*(在 K 个命令上蒙特卡罗) ――K 如何影响近似精度?与 N=4 的精确结果比较──
3. O resultado será melhor do que a oferta individual?
4. 阅读Google Research's Mechanism-Design 文章;; encontrar uma hipótese de que uma vez que for violada, isso irá destruir a veracidade;; em um caso de LLM, o que é esse modo de falha?
5. 阅读AAMAS 2025 去中心化 LaMAS 论文──在一个合成任务上上为10代理 实现其中的Shapley 步骤──精确计算 需要多长时间?用100次绘图采样能有多接近?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| DePIN | “Decentralized physical infrastructure” | Token-incentivized compute/storage/bandwidth。Bittensor、Akash、Render。 |
| DID | “Decentralized identifier” | 用于 portable IDs 的 W3C spec。Agent reputation 绑定到 DID，而不是平台。 |
| ERC-4337 | “Account abstraction” | 可以 sponsor gas 的 contract accounts，从而支持 agent payments。 |
| Shapley value | “Fair credit attribution” | 满足 efficiency、symmetry、linearity、null 的唯一 allocation。 |
| Second-price auction | “Vickrey auction” | 真实机制：winner 支付 second-highest bid。与 monotone aggregation 兼容。 |
| Reputation capital | “Accumulated quality score” | 来自已确认贡献、绑定 DID 的 score；会随时间 decay。 |
| Agentic DAO | “Agents + humans govern” | 把 agent voters 作为 first-class、投票权绑定 reputation 的 DAO。 |
| TAO / FET / GPU credits | “Token denominations” | Bittensor TAO、Fetch.ai FET、各种 DePIN tokens。 |

## 延伸阅读
- [The Agent Economy](https://arxiv.org/abs/2602.14219) 2026 ano sobre a pilha de 5 camadas de agentes-economia
- [Google Research — Mechanism design for large language models](https://research.google/blog/mechanism-design-for-large-language-models/)Ações de leilão simbólica de agregação monótona
- [AAMAS 2025 — decentralized LaMAS](https://www.ifaamas.org/Proceedings/aamas2025/pdfs/p2896.pdf) Atribuição de crédito de valor Shapley
- [Bittensor TAO documentation](https://docs.bittensor.com/) Estrutura da sub-rede e distribuição de recompensas
- [Fetch.ai / ASI Alliance](https://fetch.ai/) ASI-1 Mini LLM e FET token
- [W3C Decentralized Identifiers (DIDs) spec](https://www.w3.org/TR/did-core/) Fundação da identidade
