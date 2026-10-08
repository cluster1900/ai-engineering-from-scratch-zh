# Sociedad de la Mente y el debate multi-agente

> Minsky en 1986 el supuesto, es decir, la inteligencia es una sociedad compuesta por especialistas, cada década se redescubrirá una vez más. En 2023, Du et al. se convertirá en un algoritmo concreto: múltiples instancias de LLM  presentar respuestas, leer respuestas mutuas, crítica, y actualización.**multiple agents**Y **multiple rounds**Ciudad independiente contribución efectos. la sociedad  ganó un monólogo de un solo agente; intercambio de varias rondas  ganó un voto de una sola vez.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~60 minutes

##  problemas
La autoconsistencia, es decir, a un modelo 采样多次并取多数答案, es el razonamiento más barato que puedes añadir 改进──它有效,但很快会和── puedes duplicar las muestras, pero no ver hasta que vuelva a tener sentido 升级──

El debate rompió este tipo de debate y no se tomó N 个独立样本从一个模型, sino que se permitió que N 个代理阅读彼此的推理并修复.

## 概念
### 2023 算法

De arXiv:2305.14325 (ICML 2024):

1. Cada uno de los agentes de N se encarga de generar una respuesta inicial.
2. R: Para cada agente  mostrar otros agentes en la ronda r-1 de respuesta,并要求它considerando estos, dar su respuesta actualizada.
3. R 轮后, hacer mayoría de votos a la respuesta final.

论文在 MMLU、GSM8K、biografías、MATH 和 factuality benchmarks 上测试──Debate 持续优于 CoT 和自我反思──

### 两个独立旋

Como se dice en el artículo:

- **Agent count alone**(1 rúa, para N 个结果做多数投票) en la mayoría de las tareas superará a un solo agente, pero entrará en la plataforma period¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- **Round count alone**(1 个代理 见自己的先前推理) casi no ayuda, es decir, la debilidad conocida de la reflexión.
- **Both together** Trajo un aumento considerable  intercambio multi-ronda entre varios agentes   impulsó el aumento

### ¿Por qué es efectivo?

 Dos mecanismos:

1. **暴露于分歧。**Cuando un agente ve la cadena de razonamiento de otro agente para sacar conclusiones diferentes, debe justificar, o actualizar. De cualquier manera, el contexto de r+1 es más rico que r r.
2. **相关错误减少。**En la autoconsistencia, todas las muestras provienen del mismo modelo, por lo que los errores  correlacionados, usted tendrá una respuesta segura pero errónea ∼ Diferentes modelos o semillas ∼ correlacionadas ∼ Diferentes *opiniones debatidas ∼ seguirán correlacionadas ∼

### El debate es heterogéneo

A-HMAD 和相关后续工作为不同代理 使用 *不同基模型*──Llama + Claude + GPT debate 会减少单文化崩(Leyón 26),因为 un modelo de familia de errores relacionados no serán compartidos por otros modelos.

缺点: weak model 参与辩论 时可能会把共识 拉向它的错误答案 ((见 ¿Deberíamos estar volviendo locos?, arXiv:2311.17371)。

### NLSOM  129-agente 扩展

Zhuge et al. Mindstorms in Natural Language-Based Societies of Mind,  arXiv:2305.17066) 将这个想法扩展到 129 成员社会──结果是: especialización 和自我组织 随规模涌现,并且系统在视觉问题答等任务上优于单代理──

### Modo de falla

- **Sycophancy cascade。**Todos los agentes se han sometido a la más segura de sí mismos. El debate se ha reducido a la mayor opinión.
- **Topic drift。**El debate de varias rondas se aleja del problema original.
- **Compute blowup。**N agentes × R rondas = N·R veces llamadas LLM, cada llamada del contexto están en aumento. Un debate de 5 agentes ∙ 5 rondas es de 25 llamadas, y el contexto continuar creciendo.


```figure
multi-agent-debate
```

## Construirlo
`code/main.py`En un problema matemático se ejecuta un debate de 3 agentes × 3 rondas, cada uno de los cuales comienza con una respuesta diferente.

La demostración muestra dos efectos clave:

- El intercambio de vueltas solo hará que los agentes se acerquen más a la respuesta correcta.
- La segunda ronda de extra-rotas posteriores muestra un rendimiento decreciente, conforme a la plantilla de Du et al.

运行:

```
python3 code/main.py
```

## Usalo
`outputs/skill-debate-configurator.md`Por otra parte, el proyecto de investigación de la Comisión de Investigación y Desarrollo de la Información sobre la Capacidad de Evaluación de las Capacitaciones de la Comisión de Investigación y Desarrollo de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capacitación de la Capa de la Capacitación de la Capa de la Capacitación de la Capacitación de la Capa de la Capacitación de la Capa de la Capa de la Capa de la Capa de la Capa de la Capa de la Capa de la Capa de la Capa de la Capa de la Capa de la Capa de la Capa de la Capa de la Capa de la Capa de la Capa de la Capa de la Capa de la Capa de la Capa de la Capa de la Capa de la Capa de la Capa de la Capa de la Capa de la Capa de la Capa de la Capa de

##  entregarlo
Si quieres entrar en debate:

- **将 rounds 上限设为 3。**Du et al.  mostraron que 3 rutas capturaron la mayor parte de los beneficios.
- **将 agents 上限设为 5。**超过 5 后, contextos inflados 和 costes de la producción
- **默认 heterogeneous。**池中 al menos dos modelos base diferentes.
- **Adversarial slot。**Un agente es advertido de que no se acuerde de nada.
- **记录每一轮。** oculta de los debates intermediaciones  no puede depurar o auditar

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`, entonces se contará la ronda 设为 5, observar los rendimientos decrecientes― hasta que ronda de convergencia adicional 停止?
2. Añadir un papel adversario en el cuarto agente: ¿Siempre no estoy de acuerdo con la mayoría actual? ¿Destruirá o mejorará la convergencia?
3. 绘制(打印) Score de acuerdo de cada ronda(Staying majority answer  上的代理 比例) ⋅ ¿Cuándo alcanza 1.0? ¿Es igual a correct?
4. 阅读 Du et al. Sección 4 ablaciones。 utilizar este código 复现 agentes-solo vs runds-solo vs both 结果。
5. ¿Deberíamos estar volviendo locos? (arXiv:2311.17371),并列出 周围轮结 之外的两个辩论变化,例如, por ejemplo, el juez liderado, cadena de debate, adversarial──

## 关键术语: "El hombre es un hombre"
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
- [Du et al. — 通过 Multiagent Debate 提升 Language Models 的事实性与推理能力](https://arxiv.org/abs/2305.14325) Papel de referencia,CML 2024
- [Zhuge et al. — Mindstorms in Natural Language-Based Societies of Mind](https://arxiv.org/abs/2305.17066) 129-agente NLSOM
- [Should we be going MAD? A Look at Multi-Agent Debate Strategies for LLMs](https://arxiv.org/abs/2311.17371) Variancias de debate de referencia
- [Debate project page](https://composable-models.github.io/llm_debate/) El código de Du et al.
