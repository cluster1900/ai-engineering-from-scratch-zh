# Debate y colaboración entre varios agentes

> Du et al. ((ICML 2024,Society of Minds)运行 N 个模型实例, estos casos primero proponen independientemente las respuestas, luego se critican entre sí en R 轮中, para lograr la recepción.

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 12（Workflow Patterns），Phase 14 · 05（Self-Refine and CRITIC）
**Time:** ~60 分钟

## El objetivo del aprendizaje
- 解释辩论协议:N 个提议者、R 轮,并收到一个共享答案──
- 描述为什么辩论 能提升事实性、遵循规则 和推理──
- Explicar topología escasa: no todos los debatedores necesitan ver todos los demás debatedores.
- En el LLM escrito 上实现一个 stdlib debate, contenida red completa 和 σάρς 变体; medir Token 成本与精度──

##  problemas
Auto-refinado (第 05 课) es un modelo de crítica propia, existe el pensamiento de grupo 风险――CRITIC (第 05 课) pone la crítica en tierra hacia las herramientas externas, pero estas herramientas no son siempre disponibles. El debate introdujo un tercer modelo: múltiples ejemplos, crítica cruzada, así como a través de la diferencia para lograr la recepción.

## 概念
### Sociedad de las Mentes (Du et al., ICML 2024)

- N 个模型例针对同一个问题独立提出答案──
- En R 轮中, cada modelo lee otras propuestas de modelos y las critica.
- 模型根据批评 更新自己的答案──
- R 轮后, retroceder 后的答案──

El primer experimento se basó en el costo de considerar el uso de N=3、R=2── en problemas difíciles, MMLU、GSM8K、Caches Move Validity、biografía generación), más agentes y más rotas para mejorar la precisión──

组合 跨型模型优于单型辩论:ChatGPT + Bard 组合 > 任一单独模型──

### Topología de la escasa

Mejorando el debate multi-agente con la topología de comunicación Sparse(arXiv:2406.11776,2024-2025) indican que el debate de red completa 并不总是最优优──Sparse topologies(star、ring、hub-and-spoke) puede utilizarse con más bajos Token 成本 para alcanzar una precisión casi igual──cada debatidora sólo ve un subconjunto de sus pares──

 influencia:

- N=5,R=3 = 5 × 3 = 15 propuestas, cada uno de ellos lee 4 opciones de crítica: 60 veces.
- Estrella N=5,R=3 ((un centro + 4 个话) = 15 个建议,话只读取中心 = 12 veces crítica opciones。

### Cuando el debate ayuda

- **Factuality。**No hay propuestas independientes, control cruzado, reducción de las alucinaciones.
- **Rule-following。**Validez de movimiento de ajedrez En, un modelo pierde las reglas, otros modelos lo capturan.
- **Open-ended reasoning。**En el marco de la política de la Unión Europea, el sistema de gestión de las emisiones de gases de efecto invernadero se ha convertido en un sistema de gestión de la energía de la Unión Europea.

### Cuando el debate duele

- **Latency-sensitive UX。**N × R 个串行轮次会产生你可能无法承受的延迟──
- **Cost-sensitive scale。**Cada problema necesita un N × R Token.
- **Simple factual lookups。**Una vez más que los debates de cinco juegos más barato.

### 2026 instancias prácticas

- **Anthropic orchestrator-workers**(第 12 课)  带合成步的一种辩论 变体──
- **LangGraph supervisor**(第 13 课)  Router central + agentes especializados pueden llevar el debate a cabo en un nodo.
- **OpenAI Agents SDK**(第 16 课)  agentes 通过交付来回进行反复批评──
- **Multi-agent evals** Debate + evaluador-optimizador 配对, para utilizar la señal de evaluación

### Este modo es fácil de salir mal donde

- **Convergence collapse。**Todos los agentes han recibido la primera respuesta equivocada.
- **Hub failure。**En la topología estelar, un mal centro de trabajo contaminará a todos los usuarios.
- **Prompt homogenization。**Todos los agentes utilizan el mismo prompt; generan la misma respuesta.


```figure
debate-converge
```

## Construirlo
`code/main.py`实现了 el debate sobre el tema:

- `Debater`clase (带有每个辩论者意见漂移的剧本LLM)
- `FullMeshDebate`Y `SparseDebate`Corredores.
- Tres problemas: un hecho, una regla, un razonamiento.
- Metricas: respuestas convergentes, rondas de convergencia, operaciones de crítica total.

运行:

```
python3 code/main.py
```

输出: precisión y costo de cada protocolo; ahorro en 2/3 问题以更低成本匹配全网──

## Usalo
- **Anthropic orchestrator-workers**Usados para debates simples de 2-3 trabajadores.
- **LangGraph**Usado para llevar el debate estatal de puntos de control.
- **Custom**Para garantizar la exactitud de los datos realizados en investigación o en especial.

##  entregarlo
`outputs/skill-debate.md` Construir un debate multi-agente, con topología configurable ∞ N、R y regla de convergencia ∞

##  ejercicios
1.  Realizar un desacuerdo forzado regla: en la primera ronda, cada debatedor  debe presentar una propuesta diferente para medir su impacto sobre la velocidad de convergencia
2. 添加信心重量集:debaters 返回 (respuesta, confianza);agregador 按信心 加权──¿hay ayuda?
3. ¿La heterogeneidad mejora la precisión?
4. En su 3 个问题上衡量全网与稀缺的代币 成本──绘图成本与精度──
5. ¿Qué se va a perder? ¿Qué va a mejorar?

## 关键术语: "El hombre es un hombre"
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
- [Sparse Communication Topology (arXiv:2406.11776)](https://arxiv.org/abs/2406.11776) topología escasa 结果
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) Orquesta-trabajadores  como un debate 变体
- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) Autocrítica de un modelo único a los métodos de tratamiento
