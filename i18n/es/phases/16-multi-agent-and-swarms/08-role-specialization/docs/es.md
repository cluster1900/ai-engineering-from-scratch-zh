# 角色专业化  Planificador, crítico, ejecutor, verificador

> 2026 años más común de multi-agente de descomposición: un agente  responsable de planificar, ejecutar, evaluar o verificar. MetaGPT (arXiv:2308.00352) se formaliza en codificación a las instrucciones de papel en SOPs entre Product Manager, Arquitecto, Project Manager, Ingeniero, Ingeniero QA                                                                                                                                                                                                                       `Code = SOP(Team)` ChatDev (arXiv:2307.07924) 通过"chat chain" 串联设计者、程序员、评审员、tester,并使用"communicative dehallucination"(agentes 明确请求缺失细节)  Verifier 是承重角色:Cemri et al. (MAST, arXiv:2503.13657) 表明, cada multi-agent 失败 可以追溯到缺失或损坏的验证称──PwC 报告,在 CrewAI 后,准确率提升10% 7×( → 70%) 

**类型：**Aprender + Construir
**语言：**Python (stdlib)
**先修：**Fase 16 · 04 (modelo primitivo), fase 16 · 05 (supervisor)
**时间：**- 60 minutos

##  problemas

Los tres codificadores del grupo de conversaciones escribirán tres tipos de código de la misma manera. Puedes añadir más agentes, aumentar más rondas, pero aún no puedes cruzar el código de calidad.

修复方法不是 más agentes, sino* diferentes* agentes― asignar diferentes papeles― a Critic 配备 Planner 没有的工具― a Verifier una suite de pruebas objetivas― así el sistema ya posee con corrección fundamentada desacuerdo interno, no sólo hacer conjeturas―

## 概念

### Cuatro papeles canónicos

**Planner.**阅读目标,产出步列或规则──Tools: conocimiento de recuperación、docs──Output:plan estructurado──

**Executor.**Una vez leído un plan paso, producir artefacto.

**Critic.**根据 Planner的意图审阅执行人的输出──Tools:对 artefact的仅读访问、静态分析──Output:accept/reject,并给出原因──

**Verifier.**读取 artefacto 并运行确定性检查── herramientas: test runner、type checker、schema validator──Output:pass/fail,并附证──

El crítico es un tema, tiene puntos de vista, generalmente basado en el LLM. El verificador es un objetivo, determinación, generalmente basado en código.

### El patrón de SOP de MetaGPT

MetaGPT (arXiv:2308.00352) se ejecutará software ingeniería SOPs 编码为角色提示:

- **Product Manager**编写 PRD。
- **Architect**产出 diseño del sistema。
- **Project Manager**拆分任务── ¿Qué es eso?
- **Engineer**实现──
- **QA Engineer**运行 pruebas.

Cada papel tiene un esquema de entrada/salida estricto.`Code = SOP(Team)`Esta descripción significa: los SOP de determinación convertirán un conjunto de LLM en un tubo predecible.

### La deshalucinación comunicativa de ChatDev

ChatDev  añade un movimiento clave: cuando el ejecutor  necesita un plan  cuando no hay detalles concretos, que se hará una pregunta clara antes de continuar  Desafensor ∞ Esto puede prevenir el fracaso de la LLM clásica ∞: parece razonablemente elaborar detalles ∞

实现方式:role prompt 包含当你需要未被提供具体信息时,在产出输出 之前按名称询问相关角色──

### ¿Por qué Verificador es lo más importante

Cemri et al. (MAST)  ha rastreado 1642 fallas de ejecución de múltiples agentes ⋅ de las cuales el 21.3% son brechas de verificación  系统交付一个没有人检查过的答案── 剩余79% suele remontar a  un cheque 静默失败或从未运行── ⋅ Verificación es un papel importante──

PwC  report称(CrewAI deployments, 2025), incorporado a la estructuralización de la validación 后, la tasa de precisión aumentó de 10% 提升到70%── un papel 带来了 7× 提升──

### Critico frente a verificador

- El crítico es el revisar el artefacto de calidad LLM.
- El verificador es el operador en el proceso de determinación del artefacto.

两者都用──Critical 能捕捉 Verifier 无法表达的品味问题──Verifier 能捕捉 Critical 看不到的 bug,因为 estos bugs 只有在运行时间才会出现──

### Contrario

 Cada rol en el sistema es LLM, y cada rol de salida es "me parece bien". Este es el clásico modo de falla MAST.

### Mapas de marco

- **CrewAI**¿ Qué es esto ?`Agent(role, goal, backstory)`Es una superficie de especialización típica.
- **LangGraph** nodos pueden tener instrucciones especializadas; bordes 强制执行管道。
- **AutoGen** En GroupChat en uso带单词名称的角色特定可交谈的代理人──
- **OpenAI Agents SDK** 在 papel especializado Agentes 之间使用交付工具──


```figure
swarm-roles
```

## Construcción

`code/main.py` Implementar una línea de 4 funciones para construir una función simple de Python:

- **Planner**产出 especificación
- **Executor**Se ha creado una cadena de código.
- **Critic**(MDL-simulado) 标记明显问题──
- **Verifier**En la caja de arena`exec`) en el caso de prueba 运行生成的代码──

Demo 运行两次:一次执行者 产出正确代码(Crítico + Verificador 都通过),一次执行者 产出偏离规范的代码(Crítico 漏掉 bug,因为它看起来合理;Verifier 捕捉到 bug,因为测试 失败) ⋅

运行:

```
python3 code/main.py
```

## Uso

`outputs/skill-role-designer.md`接收一个任务,并产出角色名单 (roluciones 3-5), 个角色的输入/输出方案,以及验证器检查──在把代理 接入框架 之前使用它──

## 交付

Lista de control:

- **至少一个确定性 Verifier。**No es un LLM.
- **每个 role 都有明确 I/O schema。**Planificador 返回 spec, y no en prosa;Ejecutor 读取该 schema。
- **Communicative dehallucination。**Cuando la información está ausente, el ejecutor debe preguntar al planificador;
- **Critic/verifier 顺序。**Antes de la aplicación, el sistema de control de datos de la aplicación de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de cuyo de datos de datos de datos de datos de datos de datos de datos de datos de datos de cuyo de cuyo de cuyo de cuyo cuyo cuyo cuyo cuyo cuyo cuyo cuyo cuyo cuyo cuyo cuyo cuyo cuyo cuyo cuyo cuyo cuyo cu
- **Loop budget。**En la actualidad, el estudio de la crítica ha sido revisado por el autor.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`, observar Verificador cómo capturar Critico 漏掉 de error― Añadir un control de análisis estático `return`¿Qué problemas puede capturar hasta el test de tiempo de ejecución?
2. 添加第 5 个角色:"Analista de requisitos",把用户愿望转换为Planeador-ready spec―― ¿Qué solicitudes de deshallucinación comunicativas  deberían fluir hacia arriba?
3. 阅读 MetaGPT Sección 3 ("Agentes") ――列出 MetaGPT 5 个角色中每个角色的输入/输出方案──
4. 阅读ChatDev's diagram-chain diagram(arXiv:2307.07924 Figura 3)  Identificar la deshallucinación comunicativa en la que se rompe un ciclo continuo ilimitado 
5. La tasa de precisión de PwC 7x aumenta a partir de los bucles de verificación.

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Role specialization | "Different agents, different jobs" | 针对 Planner/Executor/Critic/Verifier roles 调优的不同 system prompts。 |
| SOP pattern | "Encoded standard operating procedure" | MetaGPT 的 framing：每个 role 的严格 I/O schemas 将 team 转换为 pipeline。 |
| Communicative dehallucination | "Ask before inventing" | ChatDev pattern：当细节缺失时，Executor 会询问 Planner，而不是自行编造。 |
| Critic | "LLM reviewer" | 主观、有观点的 reviewer。捕捉品味问题。可能被看似合理的 prose 欺骗。 |
| Verifier | "Deterministic check" | 基于 code 的 pass/fail。Test runner、type checker、schema validator。不会被欺骗。 |
| Verification gap | "No one checked" | MAST failures 的 21.3%。答案在没有能捕捉 bug 的 check 的情况下被交付。 |
| Revision loop | "Critic sends it back" | Critic rejection 会触发 Executor 带 feedback 重新运行。需要 budget。 |
| All-LLM anti-pattern | "Looks good to me" | 每个 role 都是 LLM，没有确定性 check。经典 MAST failure。 |

## 延伸阅读
- [Hong et al. — MetaGPT: Meta Programming for Multi-Agent Collaboration](https://arxiv.org/abs/2308.00352) POP-as-role-prompt  referencia
- [Qian et al. — Communicative Agents for Software Development (ChatDev)](https://arxiv.org/abs/2307.07924) cadena de chat + deshallucinación comunicativa
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) Taxonomía MAST;las brechas de verificación proporcionan el 21,3% de los fallos
- [CrewAI docs — Agent roles](https://docs.crewai.com/en/introduction) Superficie de especificación de rol de producción
