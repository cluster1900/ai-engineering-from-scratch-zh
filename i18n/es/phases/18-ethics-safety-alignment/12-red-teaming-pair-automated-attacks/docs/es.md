# Red-Teaming: PAIR y ataques automatizados

> Chao, Robey, Dobriban, Hassani, Pappas, Wong (NeurIPS 2023, arXiv:2310.08419)  PAIR  Rapid Automatic Iterative Refinement  是经典的自动化黑盒 jailbreak──带有红团系统提示 的攻击者 LLM 会为目标 LLM 代提出 jailbreak,并在自己的聊天历史中累积尝试和响应,作为在语境反──PAIR normalmente在20次查询内成功,比 G(CGZou et al. El sistema de búsqueda de tokens (en inglés) es un sistema de búsqueda de tokens (en inglés) de alto rendimiento (en inglés) y no requiere acceso a la caja blanca.

**类型：**Construir
**语言：**Python (stdlib, simulación de circuito PAIR contra un objetivo de juguete)
**前置要求：**Fase 18 · 01 (siguiendo instrucciones), Fase 14 (ingeniería de agentes)
**时间：**~ 75 minutos

## El objetivo del aprendizaje
- 描述 PAIR 算法: sistema de ataque de inmediato, refinamiento iterativo, retroalimentación en contexto.
- Explicación cuando el objetivo es la caja negra, por qué PAIR  estrictamente que GCG más alta eficiencia.
- Cuatro bases de ataque automático se han definido, y se han definido diferentes características de cada uno.
- describir el protocolo de evaluación de JailbreakBench y HarmBench, así como el significado de "taxa de éxito de ataque" bajo sus respectivos protocolos.

##  problemas
Red-teaming 过去 es una actividad manual. Un pequeño grupo de expertos crean un instante adversario y siguen lo que es efectivo. Esto no se puede extender: la tasa de éxito de los ataques necesita muestras estadísticas, mientras que los objetivos cambian continuamente con cada modelo publicado.

## 概念
### Algorithm de la pareja

输入:
- El objetivo de la LLM es el modelo que estamos atacando.
- El juez LLM J (((评分某响应是否为 jailbreak)
- El atacante LLM A(optimizador de equipo rojo)
- La cadena de objetivos G:"responde con [instrucción perjudicial]."
- Presupuesto K(por lo general para 20 veces de consulta)

循环, por k en 1..K:
1. Usado objetivo G y hasta el momento de (prompto, respuesta) par 历史来提示 A。
2. Una nueva llamada de entrada.
3. Se presentará a T; se recibirá la respuesta r_k。
4. J 根据目标对 (p_k, r_k) 打分──
5. Si el puntaje >= umbral, entonces parar  已 encontrado jailbreak。
6. 否则,将 (p_k, r_k) 追加到 A 的历史中;继续──

经验结果(NeurIPS 2023): para GPT-3.5-turbo、Llama-2-7B-chat tasa de éxito de ataque >50%; la consulta media necesaria para el éxito es de 10-20    

### Por qué PAIR es eficiente

GCG(Zou et al. 2023) a través de Gradient en adversarial Token sufijo 上搜索; necesita acceso al modelo de caja blanca, no generará un sufijo ilegible.

### Ataques automatizados relacionados

- **GCG (Zou et al. 2023, arXiv:2307.15043).**针对对抗性后的代币 级 Gradient search──White-box,可迁移,产生不可读字符串──
- **AutoDAN (Liu et al. 2023).**En la búsqueda evolutiva, dirigida por un objetivo jerárquico.
- **TAP (Mehrotra et al. 2024).**带 pruning of tree-of-attacks  分支出多个 PAIR-style rollout──
- **PAP (Zeng et al. 2024).**Prompts adversarios persuasivos  将人类说服技巧编码为提示模板──

### JailbreakBench y HarmBench

两者(2024) 都将 evaluación 标准化:

- JailbreakBench (arXiv:2404.01318)──覆盖 10 个 OpenAI-política 类别的 100 个 个有害行为──以 Attack Success Rate (ASR) 作为主要指标──需要评判(GPT-4-turbo、Llama Guard或 StrongREJECT)──
- HarmBench (Mazeika et al. 2024)──covercover 7 个类别的 510 个行为,包含语义和功能损害测试──比较 18 种攻击在 33 个模型上的表现──

Las tasas de ASR normalmente se encuentran en el presupuesto de consulta fija.

### Es importante para la implementación de 2026

Ahora cada laboratorio fronterizo ciudadán está en la publicación previa a la producción de modelos de operación PAIR y TAP。TRAECTORIA ASR 会出现在模型卡 (Leyción 26) y apéndice de caso de seguridad (Leyción 18) 中── Este tipo de ataques no son raros  Es una infraestructura estándar。

### Está en la fase 18

Lección 12 es un ataque automático 基础。Lección 13(Many-Shot Jailbreaking) es una forma de intercambio de longitud de utilización。Lección 14(Artes ASCII / Visual) es una forma de codificación de ataque。Lección 15(Injección de inmediato indirecta) es la producción de ataques de 2026 años。Lección 16 覆盖对应的防御工具(Llama Guard、Garak、PyRIT)。


```figure
al-pair-loop
```

## Usalo
`code/main.py`Construir un bucle de PAIR de juguete.  El objetivo es un clasificador falso, rechazará  Obviamente  Perjuicio de la palabra clave (keyword-filter)  El atacante es un refinador basado en reglas, intentará parafrasear  Roleplay-framing 和 codificación  Juzgará la respuesta 打分── Usted verá al atacante en aproximadamente 5-15 veces                                                                                                                                                                                                            

##  entregarlo
本课产 出  `outputs/skill-attack-audit.md` Dedicar un informe de evaluación del equipo rojo, que auditará: ¿qué ataques han sido ejecutados?

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`◊测量三种内置攻击策略的平均求-to-success――explicar cada estrategia utilizando el supuesto de defensa de objetivos――

2. 实现第四种攻击策略 (例如,翻译成另一种语言、base64编码) ⋅报告它在关键字过目标和语义过目标上新中-queries-to-success──

3. 阅读Chao et al. 2023 Figura 5(PAIR vs GCG comparación)  Descripción de dos, a pesar de que PAIR 具有效率优势但仍首选 GCG的场景──

4. JailbreakBench se reunirá para establecer objetivos fijos  informe ASR。 diseñar un indicador extra extra para medir la diversidad de ataques(diversidad de ataque rápida exitosa)。 explicar por qué la diversidad para la evaluación de defensa 很重要。

5. TAP(Mehrotra 2024) a través de la ramificación + poda 扩展 PAIR──为 `code/main.py`草拟一个TAP-style 扩展,并描述计算成本与成功率之间的权衡──

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| PAIR | "automated jailbreak" | Prompt Automatic Iterative Refinement；attacker-LLM + judge-LLM loop |
| GCG | "gradient jailbreak" | 针对 adversarial suffix 的 white-box Token 级 Gradient search |
| Attack success rate (ASR) | "% jailbreaks at k queries" | 主要指标；必须与 query budget 和 judge identity 一起报告 |
| Judge LLM | "the scorer" | 评估响应是否满足 harmful goal 的 LLM |
| JailbreakBench | "the evaluation" | 带有标记类别的标准化 harmful-behaviour set |
| HarmBench | "the broader bench" | 510 个 behaviour，functional + semantic harm test |
| TAP | "tree of attacks" | 带 branching + pruning 的 PAIR；在更高 compute 下获得更好的 ASR |

## 延伸阅读
- [Chao et al. — Jailbreaking Black Box LLMs in Twenty Queries (arXiv:2310.08419)](https://arxiv.org/abs/2310.08419) PAIR 论文,NeurIPS 2023
- [Zou et al. — Universal and Transferable Adversarial Attacks on Aligned LLMs (arXiv:2307.15043)](https://arxiv.org/abs/2307.15043) Papel de GCG
- [Chao et al. — JailbreakBench (arXiv:2404.01318)](https://arxiv.org/abs/2404.01318) Evaluación estandarizada
- [Mazeika et al. — HarmBench (ICML 2024)](https://arxiv.org/abs/2402.04249) evaluación más amplia
