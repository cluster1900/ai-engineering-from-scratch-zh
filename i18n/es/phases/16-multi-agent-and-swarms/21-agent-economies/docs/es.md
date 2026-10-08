# Agente 经济、Token  incentivos、 reputación

> 长周期自主代理人 (METR de 1 小时到 8 小时工作曲线) necesita capacidad de agente económico──新兴的 **5-layer stack**Sí:**DePIN**(computación física) **Identity**(W3C DIDs + 声誉资本) **Cognition**(RAG + MCP) →**Settlement**(abstracción de cuentas) **Governance**(DEA agentes)  Producción de agentes-incentivos 网络包括 **Bittensor**(subredes de TAO  modelos específicos de tareas de recompensa)**Fetch.ai / ASI Alliance**(ASI-1 Mini LLM + FET token) y **Gonka**(basado en el PoW de transformador, se calculará la nueva distribución de las tareas de IA con valor de producción)**Shapley-value credit attribution**Para obtener un premio justo a los agentes que hayan contribuido; Google Research diseña un mecanismo para modelos de idiomas grandes  Proponido en una agregación monótona **token auctions** Construir un mercado de agentes mínimos, asignar crédito de valor Shapley 应用于多代理管道,并运行一场二价代币拍卖,让游戏理论 机制具体落地──

**Type:** Learn
**Languages:** Python (stdlib)
**前置要求：**Fase 16 · 16(Negociación y negociación),Fase 16 · 09(Redes de intercambio paralelo)
**Time:** ~75 分钟

##  problemas
Cuando los agentes crean valor juntos, pero también necesitan ser recompensados por separado, los sistemas multiagentes se vuelven complejos. Los mecanismos clásicos, como la distribución media, el último contribuyente se llevan todo, ya sea injusto o fácilmente manipulado. A través de los valores de Shapley, se realizan recompensas basadas en la unión, en la construcción son justas, pero el costo de cálculo es alto.

Además de la atribución de crédito, este campo se ha convertido en un agente económico real:Bittensor TAO  Premios para la computación minera, para ajustar los modelos específicos de la subred;Fetch.ai/ASI con tokens FET  Premios ASI-1 Mini LLM Utilización;Gonka transformará la prueba de trabajo de nuevo distribuido en una IA de valor productivo  tasas ⋅ capaces de negociar de forma independiente agentes hoy ya existen; el problema es cómo se puede coordinar el incentivo ⋅

Este curso considera las economías de los agentes como un problema concreto: atribución de crédito, diseño de mecanismos y reputación, y con el mínimo de matemáticas construye cada parte, hacer que el concepto realmente quede.

## 概念
### 5 capas de la pila de agentes-economías

1. **DePIN（physical compute）。**Descentralización de infraestructuras, para el alquiler de GPUs, almacenamiento, banda ancha, redes de subcomputadores, redes de rendimiento, Akash, no pertenece a agentes, agentes lo utilizan.
2. **Identity。**W3C Identificadores descentralizados (DIDs) para cada agente Una no depende de cualquier plataforma de ID permanente.
3. **Cognition。**El ciclo de razonamiento del agente:LLM + RAG + MCP.
4. **Settlement。**Abstracción de cuentas ((ERC-4337)) Permitir a los agentes pagar gas con su propio saldo, sin tener que tener ETH.
5. **Governance。**Los DAO agentes: por humanos y agentes unidos a los cambios en el protocolo  voting's governance structure, voting rights and reputation tied.

No es que cada sistema de producción use todas las cinco capas. El bitensor utiliza la primera, la segunda, la tercera y la cuarta capas, no utiliza la quinta.

### Bittensor Fetch.ai Gonka: cosas que realmente funcionan

**Bittensor（TAO）。**Las subnetas son tareas especiales ([[modelaje de lenguaje]], generación de imágenes, predicción)  Mineros  envían resultados de modelos  Validadores para su clasificación  puntuación ponderada por apuestas  Distribución de recompensas TAO  Cada subnet tiene su propio método de evaluación  Economía  Educación: 付费 付费 付费 付费 ⇒ calidad de la salida específica de la tarea, no 付费 付费 ⇒ uso de la computación 付费 

**Fetch.ai / ASI Alliance。**ASI-1 Mini LLM 运行在 Fetch.ai's网络上; usuarios utilizan tokens FET 支付推理 费用──这里代理人作为同伴的故事更强:Fetch 上一个代理可以调用另一个代理 完成任务,并使用 FET 付款──

**Gonka。**Proof-of-work del transformador:work es el paso del transformador hacia adelante.

截至 2026 年 4 月, estos tres son de producción-grado. 回报分配方式不同. Bittensor 根据子网验证者的相对质量奖励;Fetch 根据付费用户测量的实用性奖励;Gonka 奖励可验证的推断工作──

### Atribución de crédito por valor de Shapley

Tres agentes colaboraron para completar una tarea. ¿Quién contribuyó?

Valor de Shapley: satisfacer cuatro criterios de eficiencia, simetría, linealidad y cero)`i`¿Qué es esto ?

```
shapley(i) = (1/N!) * sum over all orderings O of (v(S_i_O ∪ {i}) - v(S_i_O))
```

Entre ellos `S_i_O`Es el orden`O`En el centro`i`之前的代理 集合──实践中:枚举所有 permutations,记录每个代理 在每个 permutation 中的边际贡献,然后取平均──

对于N=3 个代理,有6 个变量──对于N=10,有3.6M 个,所以实践中会对命令采样,而不是枚举──

### Utilizado en la subasta de segundo precio de la agregación

Google Research (WEB) propone subastas de tokens de segundo precio para reunir los resultados de LLM. La configuración: N 个代理 各自提出一个完成; cada agente para ser seleccionado tiene un valor privado. El subastador 选择最高价值的提案,并支付 *第二高* 的价值.

Esto es importante para los sistemas de LLM: puedes externalizar las tareas de finalización a varios agentes a diferentes precios; subastas  seleccionar el mejor método y pagar equitativamente, agentes  incentivos sin error 

### Capital de reputación

绑定 DID's reputation score 从已确认贡献中累积──一个简单更新规则:

```
rep(i, t+1) = alpha * rep(i, t) + (1 - alpha) * contribution_quality(i, t)
```

Entre ellos el factor de descomposición .`alpha`接近 1―Reputación:

- Para las decisiones de enrutamiento para leer costes bajos
- 伪造成本高 (As time cum cum cum, tied DID)
- Puede ser reducido:未通過验证的贡献会扣分──

### AAMAS 2025 para centrarse en la LAMAS

La propuesta de la LAMAS (AAMAS 2025) se ha combinado con: identidad DID, atribución de crédito de valor de Shappley y un simple mecanismo de subastas.

### El mecanismo económico se derrumbará

- **Price oracle manipulation。**Si la función de crédito puede ser manipulada, los agentes también la manejarán.
- **Sybil attacks。**Un operador inicia a N 个假代理来升高自己的贡献――DIDs会减缓但不能阻止这种行为;缓解手段是声誉成本-to-forge――
- **Verification cost。**La equidad de la atribución de crédito depende del verificador. Si la verificación es conveniente, puede ser manipulada; si es costoso, el sistema no puede expandirse.
- **Regulatory overhang。**Las economías de los agentes y la supervisión financiera se encuentran en la situación de la ley gris hasta 2026.

### ¿Cuándo las economías de los agentes tienen sentido?

- **具有异构 operators 的开放网络。**No hay un solo equipo que controle a todos los agentes.
- **可验证输出。**No hay verificación, crédito atribuido, sólo supongo.
- **Long-horizon workflows。**Una tarea de naturaleza no puede beneficiarse de la acumulación de reputación.
- **Tokenized payments 在你的司法辖区合法可行。**

En el sistema empresarial cerrado, el mecanismo económico permite una distribución más sencilla de los gerentes, la distribución de trabajo, la métrica es interna.


```figure
swarm-auction
```

## Construirlo
`code/main.py` realización:

- `shapley(value_fn, agents)` 通过枚举为小 N 精确计算 Shapley。
- `second_price_auction(bids)`  真实机制; ganador 支付 segundo más alto。
- `Reputation` 绑定 DID、带指数式衰退 和削减的声誉──
- Demo 1: Tres agentes 协作, exacto Shapley 归因信用──
- Demo 2: Cinco agentes para una plaza de tareas.
- Demo 3:100 轮任务分配给具有异构代表的代理;rep-weighted routing 优于随机――

运行:

```
python3 code/main.py
```

预期输出: valores Shapley de cada agente; mostrar el resultado de la subasta del equilibrio de la oferta verdadera; mostrar el calentamiento 后 rep-weighted routing 相比随机有 10-20% calidad ganar。

## Usalo
`outputs/skill-economy-designer.md`设计一个最小代理经济:identity layer 选择、信用归属机制、支付机制、声誉规则──

##  entregarlo
En 2026 años de operación de la economía de los agentes:

- **从 reputation 开始，而不是 tokens。**Reputancia  lograr un coste bajo, un valor único; los tokens aumentarán la complejidad jurídica y económica¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- **奖励前先验证。**No se distribuya el crédito sin verificación independiente.
- **使用 Shapley-sample，而不是 Shapley-exact。**采样 100-1000 个订单;精确枚举无法扩展──
- **限制 decay factor，并设置 reputation floor。**无界衰退会抹抹合法贡献者;过慢衰退会奖励过时的高代表代理──
- **以 adversarial 方式审计机制。**En los escenarios de equipo rojo, cada mecanismo tiene una teoría de juego; buscas encontrar la brecha, en lugar de encontrar a los atacantes.

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Confirmar los valores de Shapley 之和等于总值 (axioma de eficiencia)  Modificar la función de valor; ¿Las asignaciones de Shapley están cambiando según la dirección prevista?
2. 实现 Shapley *sampling*(在 K 个命令上蒙特卡洛) ――K 如何影响近似精度?与 N=4 的精确结果比较──
3. ¿Qué coaliciones se formarán como una unidad? ¿Será mejor que licitar individualmente?
4. 阅读Google Research's Mechanism-Design 文章── encontrar una hipótesis de que una vez que se infringe, se destruirá la veracidad──En el escenario de LLM, ¿qué es este modo de fracaso?
5. 阅读AAMAS 2025 去中心化 LaMAS 论文──在一个合成任务上上为10代理 实现其中的Shapley 步骤──精确计算 需要多长时间?用100次绘图采样能有多接近?

## 关键术语: "El hombre es un hombre"
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
- [The Agent Economy](https://arxiv.org/abs/2602.14219) 2026 años sobre la pila de 5 capas de agentes-economía
- [Google Research — Mechanism design for large language models](https://research.google/blog/mechanism-design-for-large-language-models/) 带 monótono de la agregación de las subastas simbólicas
- [AAMAS 2025 — decentralized LaMAS](https://www.ifaamas.org/Proceedings/aamas2025/pdfs/p2896.pdf) Atribución de crédito por valor de Shapley
- [Bittensor TAO documentation](https://docs.bittensor.com/) estructura de la subred y distribución de la recompensa
- [Fetch.ai / ASI Alliance](https://fetch.ai/) ASI-1 Mini LLM y FET token
- [W3C Decentralized Identifiers (DIDs) spec](https://www.w3.org/TR/did-core/) Fundación de identidad
