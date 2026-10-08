# 协商与议价

> El grupo de trabajo de los agentes ha sido muy claro en el marco de la reunión de 2026: NegociaciónArena (arXiv:2402.05863)  muestra que los LLM pueden ser manipulados por la persona  desesperación) aumentará los beneficios en un 20%; "Medición de las habilidades de negociación" (arXiv:2402.15813)  muestra que el comprador es más difícil que el vendedor, la escala no puede aportar ayuda; su**OG-Narrator**(generador de ofertas deterministas + narrador de LLM) se realizará una conversión del 26,67% 提升至88,88%;Concurso de Negociación Autónoma a Gran escala (arXiv:2503.06416)  se llevó a cabo aproximadamente 180k veces en consulta, encontró **chain-of-thought-concealing**Los agentes 通过向对手隐藏推理而获胜;Bhattacharya et al. 2025  Basado en el Proyecto de Negociación de Harvard 指标进行排名,Llama-3 最有效,Claude-3 进攻性最强,GPT-4 最公平。本课实现 Contract Net Protocol(FIPA的前身,Lesson 02),连接一个LLM 风格的买家/卖家,运行OG-Narrator 风格的分解,并衡量每种结构选择如何变化成交率──

**类型：**学习 + 构建
**语言：**Python (stdlib)
**前置要求：**Fase 16 · 02 (FIPA-ACL Heritage), Fase 16 · 09 (Redes de enjambres paralelas)
**时间：**75 minutos

##  problemas

 Dos agentes  necesitan llegar a un acuerdo de precio. Si sólo dependen de un simple lenguaje de inmediato, las LLM de 2024-2026 en el proceso de negociación son sorprendentemente bajas.  En el arXiv:2402.15813 de la tasa de convergencia estricta en el precio de la propuesta es de aproximadamente el 27%.  Escala no puede solucionar este problema: GPT-4 en la estructura de precios no es mejor que GPT-3.5; es simplemente mejor en la expresión de los precios de la propuesta.

根本问题在于,LLM 混混了两项工作:决定报价和叙述报价――OG-Narrator 将两者分离:deterministic报价发电机 计算数值移动;LLM 仅负责叙述――成交率跃升到约89%――

Este mapa muestra un clásico multi-agente  Descubrir:将机械层与通信层解会赢――Contract Net Protocol (FIPA, 1996; Smith, 1980) es un esquema de referencia del mecanismo de mercado de tareas  Introducir el LLM en el narrativo 

## 概念

### Una sección de Entendimiento de la Red de Contratos

Smith 1980 años de contrato Protocolo Net: uno **manager**广播 **call for proposals (cfp)**El artículo 1**bidders**Contiene su oferta**propose**mensajes 响应; gerente 选择获胜者,并向获胜者发送 **accept-proposal**, a los que pierden el juego**reject-proposal**△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △   △    △ △                                                                                                                                                 **refuse**(ofrecer  rechazar la propuesta)`fipa-contract-net`Protocolo de interacción.

### ¿Por qué OG-Narrador gana

"Medición de las habilidades de negociación de los modelos de lenguaje" (arXiv:2402.15813)  observar:

- Las LLM  frecuentemente destruyen las reglas de precios de las empresas ((dando ofertas absurdas de precios, ignorando los ZOPA de las demás) 👇
-  su anclaje 很差(aceptar una mala primera oferta; contratación utilizar una cantidad simbólica, en lugar de una cantidad estratégica)
-  Sólo por escala   no se pueden reparar estos problemas  Más grandes modelos generarán un lenguaje más creíble, pero estrategia errónea similar

OG-Narrador 分解:

```
           ┌──────────────────┐        ┌──────────────────┐
  state  → │ offer generator  │ price → │  LLM narrator    │ → message
           │  (deterministic) │        │  (writes the     │
           │                  │        │   human-style    │
           └──────────────────┘        │   accompaniment) │
                                       └──────────────────┘
```

Generador de ofertas es una clásica estrategia de negociación:Rubinstein modelo de negociación, Zeuthen estrategia, o alrededor de precio simple tit-for-tat, LLM 负责叙述, el mensaje contiene precio determinista y el marco de lenguaje natural.

El aumento de las tasas de cambio es debido a:
- 价格保持在谈判区内──
- Los anclajes son estratégicos, no emocionales.
- LLM hacer lo que es bueno: escribir.

### NegociaciónArena 发现

El estudio de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la ciencia de la ciencia de la ciencia de la ciencia de los ciencias de los Estados Unidos de la ciencia de la ciencia de los Estados Unidos de la ciencia de la ciencia de los Estados Unidos de la ciencia de la ciencia de los Estados Unidos de la ciencia de la ciencia de la ciencia de los Estados Unidos de la ciencia de los Estados Unidos de la ciencia de los Estados Unidos de América.

- Las LLM pueden ser adoptadas a través de personas (¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡
- Los agentes de igualdad/cooperación serán utilizados en contra de los agentes de lucha contra la violencia; la defensa necesita una clara contraposición.
- En los escenarios de referencia de aproximadamente el 40% se han obtenido resultados injustos.

No es que los LLM sean un mal negociador sino que los LLM son demasiado como los humanos, incluyendo las partes que pueden ser utilizadas.

### Enlace de pensamiento 隐藏

En el Gran Concurso de Negociación Autónoma (arXiv:2503.06416) se han llevado a cabo unas 180 mil consultas en muchas estrategias de LLM.

- Si un agente en el rascacielos en el exterior sólo voy a$75; my reservation price is $70, la mano en el juego.
- 胜者私下计算策略;输出通道只包含优惠和最低限度的必要叙述──

Esta es la clásica teoría de juegos (Aumann 1976  Sobre la racionalidad y la información) en 2026  回应: Exponer tu valoración privada 会损益. LLMs no entenderán esto directamente, y estarán encantados de poner su reserva en rastros de razonamiento visibles contra ellos.

工程结论:将 privado-scratchpad contexto con el público-mensaje contexto de separación.

### Bhattacharya et al. 2025  modelo 排名

basado en el proyecto de negociación de Harvard 指标(negociación en principio BATNA respeto  interés reciprocidad):

- **Llama-3**En el ámbito de la negociación, la tasa de negociación + el pago es la más efectiva.
- **Claude-3**Es el mejor negociador de la invasión.
- **GPT-4**La diferencia de pago en el mismo tipo de pago es la menor.

Este es el rápido resumen de 2025: el enfoque no es el modelo que se va a ganar en 2026, sino diferentes modelos básicos con un estilo de negociación permanente.

###  A través del contrato Net + LLM  realizar la asignación de tareas

Contract Net en LLM multi-agente 中的现代复用:

1. El agente gerente va a dividir las tareas en unidades.
2. Uso de tareas descriptivas a los agentes de los trabajadores 广播 `cfp`¿Qué es eso?
3. Cada trabajador devuelve una oferta:`(price, eta, confidence)`, el precio puede ser tokens, unidades de cálculo o dólares.
4. El gerente 选择获胜者 (单个或多个,取决于任务) y otorga tareas.
5. Los trabajadores rechazados pueden libremente realizar otras tareas.

Esto puede ampliarse muy bien a más de 100 trabajadores, ya que el modo de coordinar es transmitir y responder, y no chat sincrónico.

### Negociación interactiva entre las partes interesadas de la MLL

El proyecto de ley de la Comisión de Infraestructuras y Desarrollo de la Información (NIIP)https://proceedings.neurips.cc/paper_files/paper/2024/file/984dd3db213db2d1454a163b65b84d08-Paper-Datasets_and_Benchmarks_Track.pdf)  introducido **secret scores**Y **minimum-acceptance thresholds**La mayoría de las empresas tienen servicios privados; los LLM deben deducirlos de los mensajes. Esto se relaciona con el mercado de tareas de producción de las capacidades de los trabajadores con una estructura diferente.

### narrativa contra mecanismo 规则

Entre todos los puntos de referencia de la negociación de 2024-2026, las reglas de construcción coherentes son:

> 让LLM 负责叙述──不要让LLM 计算提供──

Si la oferta 需要一个数字 (pricio, ETA, cantidad), en función de la determinación del estado de negociación, 生成它,并让LLM 生成框架. Si la oferta 需要一个提案结构 (decomposition de tareas, asignación de roles), puede hacer que LLM (proyecto de trabajo) se prepare, pero en el momento de la envío debe realizarse una comprobación de restricción.


```figure
a5-og-narrator
```

## Construirlo

`code/main.py`实现:

- `ContractNetManager`¿ Qué ?`ContractNetTask`¿ Qué ?`Bid` gerente + licitadores,广播 cfp, recopilación de propuestas, otorgamiento de tareas。
- `og_narrator_bargain(state, rng)` Comprador OG-Narrador: Concessión determinista de estilo Zeuthen hacia el punto medio.
- `seller_response(state, rng)` política determinista de contratación de la venta (en inglés)
- `naive_llm_bargain(state, rng)` 模拟 all-LLM bargainer:以高变化 选择价格,且经常落在 ZOPA 之外──
- Medida: en 1000 pruebas, se mide la tasa de transacción, en cada prueba se vuelven a tomar los precios de reservación.

运行:

```
python3 code/main.py
```

预期输出:naive-LLM rate deal 约65-75%;OG-Narrator rate deal 约85-95%;15-25 个百分点的差别就是将提供-generación与叙述 分解开来的结构优势――此外还将输出一个包含三个投标者和一个任务的合同网任务市场分配示例――

## Usalo

`outputs/skill-bargainer-designer.md`设计一个议价协议:谁生成报价 (de-terminista o LLM) 谁负责叙述,private scratchpads 如何与公开信息分离以及如何监控交易率──

##  Publicarlo

Lista de control de precios de la producción:

- **分离 scratchpad。**El Estado privado no puede entrar en el contexto de los oponentes.
- **Deterministic offer generation。**Precios, cantidades, ETA: calcular, no se apresure.
- **验证所有 incoming offers**Sí cumple con el esquema. En los límites del protocolo, rechaza las ofertas fuera de la OPA.
- **限制 rounds。**Última 3-5 rutas; límite de tiempo 升级给中介者──
- **持续衡量 deal rate 和 payoff variance。**La baja de la tasa de negocio es un síntoma, normalmente es una deriva rápida o un ataque de contraparte.
- **记录所有 rejected proposals** y su racionalización determinista― para los gestores de la red de contratos, los licitadores que han perdido  necesitan entender la razón―

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`¿Confirmar que el narrator de OG en el precio de la operación supera a los ingenuos LLM?
2.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              **persona-based payoff improvement**¿Acumulará una persona desesperada para comprar esta semana? ¿Ofrecerá un generador de oferta? ¿La tasa de pago o el pago?
3.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              **concealment**¿Cómo se puede transmitir a la cadena de raspades privados de su contraparte si se le da a conocer?
4. Cuando todas las ofertas superan la reserva, ¿cómo decide el gerente entre el precio más bajo y la más alta calidad? ¿Usted elegirá qué tipo de regla de premio, por qué?
5. 阅读Bhattacharya et al. 2025  Sobre el Proyecto de Negociación de Harvard 指标的内容──实现两个 diferentes estilos de negociadores(agresivos vs. justos)──Mejorar las parejas simétricas y asimetricas 下的收益差异──

## 关键术语: "El hombre es un hombre"

| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| Contract Net | “任务市场” | Smith 1980，FIPA 1996。cfp + propose + accept/reject。规范任务市场。 |
| ZOPA | “Zone of possible agreement” | buyer 最高价与 seller 最低价之间的重叠区间。其外部的 offers 无法成交。 |
| BATNA | “Best alternative to a negotiated agreement” | 如果本次交易失败，你的后备方案。它设定你的 reservation price。 |
| OG-Narrator | “Offer generator + narrator” | 分解：deterministic offer，LLM narration。 |
| Zeuthen strategy | “Risk-minimizing concession” | 根据风险限制让步的经典 offer-generator。 |
| Rubinstein bargaining | “Alternating-offer equilibrium” | 带 discounting 的 infinite-horizon bargaining 的 game-theoretic model。 |
| CoT concealment | “隐藏你的推理” | arXiv:2503.06416 的获胜者保留 private scratchpads；public channel 只显示 offer。 |
| Persona manipulation | “情绪姿态” | arXiv:2402.05863：从 desperation/urgency personas 获得约 20% payoff gain。 |

## 延伸阅读

- [NegotiationArena](https://arxiv.org/abs/2402.05863) índice de referencia;manipulación de personas y explotación 
- [Measuring Bargaining Abilities of Language Models](https://arxiv.org/abs/2402.15813) OG-Narrador, así como comprador-más duro que vendedor 结果
- [Large-Scale Autonomous Negotiation Competition](https://arxiv.org/abs/2503.06416)  约180k 次协商; cadena de pensamiento oculta 获胜
- [LLM-Stakeholders Interactive Negotiation (NeurIPS 2024)](https://proceedings.neurips.cc/paper_files/paper/2024/file/984dd3db213db2d1454a163b65b84d08-Paper-Datasets_and_Benchmarks_Track.pdf) 带秘密公用品 的多方可评分博
- [Smith 1980 — The Contract Net Protocol](https://ieeexplore.ieee.org/document/1675516) 经典机制,IEEE Transacciones en computadoras
