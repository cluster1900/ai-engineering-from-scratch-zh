# Control de IA  en subversión sigue siendo seguro

> Greenblatt, Shlegeris, Sachan, Roger (Redwood Research, arXiv:2312.06942, ICML 2024) ――Control 重新定义了安全问题:给定一个不可信强模型 U,它可能以对抗方式针对你进行优化, ¿qué protocolos pueden permitirle sacar útil trabajo al mismo tiempo que la probabilidad de resultados inaceptables? ¿Los recursos disponibles incluyen un modelo T, un presupuesto humano de trabajo H, así como la capacidad de edición de U 输出――En este marco, en la tarea de código-backdoor 任务, la edición con confianza en el Pareto 意义优于无信监测─, este marco recae la peor hipótesis en el diseño de seguridad: la naturaleza es la probabilidad de medir la presión del equipo rojo, una presión del equipo rojo representa la probabilidad de seguridad, un equipo seleccionado puede causar resultados concretos 无法接受; la presión de este equipo U ⋅ en el Pareto 意义优于无信监测─.

**Type:** 学习
**Languages:** Python (stdlib，code-backdoor 任务上的 safety-vs-usefulness frontier)
**前置要求：**Fase 18 · 07 (agentes de sueño), Fase 18 · 08 (plantilla), Fase 18 · 09 (falsación de alineamiento)
**Time:** ~75 分钟

## El objetivo del aprendizaje

- definición de control de IA  amenaza modelo:不可信强模型 U、可信弱模型 T、可信人类预算 H。
- describir Confidencial Editing 协议, y por qué domina el control no confiado en la misión de código de la puerta trasera del ICML 2024 
- 解释 alineamiento  U 值得信任) y control  U 不值得信任但我们仍然安全) entre la diferencia
- Explique las tres limitaciones del control: el hombre no puede expandirse, el modelo de confianza débil se retrasa, el control no produce un modelo fuerte digno de confianza.

##  problemas

Se puede decir que el modelo fronterizo es engañosamente alineado, esquema o falsificación de alineamiento. El problema de seguridad se reafirma como: ¿Podemos extraer un trabajo útil de un modelo de desconfianza, al mismo tiempo que no le damos la oportunidad de producir resultados inaceptables?

## 概念

### 威胁模型

Control 假设:
- U                                                                                                                                                                                                                                                               
- T  可信弱模型──能力较弱, pero ya sabemos que no es contra-sexual──
- H  可信人类劳动──预算很小;无法扩展──

系统 must use U                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

Control  abandonar la confianza U. La pregunta es: en caso de falta de confianza U, ¿qué acuerdos pueden mantener la seguridad?

### ICML 2024 puerta trasera 任务

Las instrucciones son un tema de programación de nivel de competencia. U produce una solución de candidato. Un oráculo oculto marcará si la solución contiene una puerta trasera.

### Comparación de cuatro acuerdos

- **Baseline:**直接发布 U 的输出――Utilidad máxima――Safety 最低――
- **Upfront auditing:**Para todos los productos y servicios de seguridad, el presupuesto se agota rápidamente.
- **Untrusted Monitoring:**El segundo ejemplo de U da a la primera la salida de un punto; H 审计被标记的输出──风险:两个 U 实例可能串通──
- **Trusted Editing:**T  在每次查询中编辑 U 的输出──如果T 没有把握,则路由给H──

Greenblatt et al. 发现 Trusted Editing Pareto-domina Monitoreo no confiable: en cada seguridad 水平上 tiene una utilidad más alta。

### ¿Por qué la edición confiable 胜胜

El segundo ejemplo de un monitor no puede coordinarse con el primer ejemplo. Se puede hacer esto a través de señales de formación estegográficas o de prioridades de entrenamiento compartidas. El protocolo debe invertir el presupuesto en la resistencia a la colusión, lo que reduce la señal del monitor.

### Cuatro acuerdos

1. U 扮演什么角色: sólo productor, monitoreo, o ambos son.
2. T 扮演什么角色: editor, monitoreo o resampler
3. H 如何分配:audit uniforme,audit aleatorio,o auditoría dirigida a bandera―
4. 协议在共识-resistencia 上花费多少计算──

### Alineación frente al control

- Alineación: ¿Es seguro que pueda confiar en él?
- Control: ¿Podemos usarlo de forma segura en caso de incrédulo?

El control no produce modelos alineados; se produce por el uso seguro de los modelos que no están alineados.

### Tres límites fundamentales

- La humanidad no puede expandirse. El presupuesto está limitado a la voluntad de auditoría.
- Cuando T es más débil que U, la señal de edición de T se convierte en ruido.
- El control no es una alineación. Puede que el acuerdo de trabajo en ASL-3 (§ 18) pueda no funcionar en ASL-4 (§ 1) Si U puede manipular T, o calcular la distribución de auditoría de H, el control fracasará.

### Progreso del año 2025

Reino Unido AISI 和 Redwood 合作研究 Control Safety Cases(metr.org / redwoodresearch.org 2025): el caso de seguridad de control 论证 es, en relación con la peor de las hipótesis de U, que el acuerdo limita la probabilidad de resultados inaceptables.

### Está en la fase 18

Sección 6-9 课描述威胁(lusiones es posible)  Sección 10 课描述在假设威胁真实存在时的防御范式──第 11 课描述互补的进攻范式──通过可扩展的监督 让你变得值得信任)  Sección 10 课描述在假设威胁真实存在时的防御范式──第 11 课描述互补的进攻范式── 通过可扩展的监督 让你变得值得信任)  Sección 10 课描述在假设威胁真实存在时的防御范式──第 11 课描述互补的进攻范式── 通过可扩展的监督 让你变得值得信任)


```figure
al-control-protocol
```

## Usalo

`code/main.py`En un juego de puerta trasera 任务上模拟四种协议──U 生成输出; parte de ellos带有后门(Red-team policy)──T 批准或编辑──H 在预算内被调用──H 在预算内被调用──H 在预算内被调用──H 在预算内被调用──H 在预算内被调用──H 调用.

##  entregarlo

本课生成                       `outputs/skill-control-protocol-audit.md` Determinar un protocolo de implementación descripción, que reconocerá U / T / H 角色, nombrará vectores de colusión, y estimará que el protocolo se encuentra en la posición de la frontera de utilidad-seguridad bajo presión del equipo rojo.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Reacción: La utilización de la información en el mercado de trabajo en el que se trabaja es una cuestión de seguridad.

2. Añade un nuevo protocolo:T con una muestra de baja temperatura, luego U 编辑 T 的输出──衡量它在边界上的位置──为什么比 Trusted Editing 失败更灾难性?

3. 2024 论文假设 U can see agreement. ¿Qué requisitos tiene este acuerdo para la implementación de infraestructuras?

4. 阅读Greenblatt et al. 2024 Sección 7(collusión) ⋅ propone una medida de resistencia a la colusión,并解释它的预期的有用性 成本──

5. Para un uso U = GPT-4-clase T = GPT-3.5-clase H = 审计 1% 输出部署,清晰表述一个控制安全案例――识别该案例依赖最强单一假设――

## 关键术语: "El hombre es un hombre"

| Term | 人们通常怎么说 | 它实际上的含义 |
|------|-----------------|------------------------|
| AI Control | “safety under subversion” | 在最坏情况 U 下限制不可接受结果的协议设计 |
| Untrusted model (U) | “强模型” | 我们想从中提取工作、但并不信任的有能力模型 |
| Trusted model (T) | “弱模型” | 一个较弱、已知不是对抗性的模型，用作 editor/monitor |
| Trusted human (H) | “审计预算” | 有界的专家劳动；昂贵；ground-truth 信号 |
| Trusted Editing | “T edits U” | T 作为 U 输出 gate 的协议；H 被用于模糊输出 |
| Untrusted Monitoring | “U monitors U” | 第二个 U 实例给输出打分的协议；只有额外投入后才具备 collusion-resistance |
| Control safety case | “正式论证” | 书面论证：一个协议在最坏情况 U 下限制对手成功率 |

## 延伸阅读

- [Greenblatt, Shlegeris, Sachan, Roger — AI Control (arXiv:2312.06942)](https://arxiv.org/abs/2312.06942) 经典 ICML 2024 论文
- [Redwood Research — Recent AI Control papers index](https://redwoodresearch.substack.com/) 2024-2025 后续研究
- [UK AISI + METR — Control safety cases](https://metr.org/blog/2025-03-26-common-elements-of-frontier-ai-safety-policies/) 面向边境实验室的运营
- [Hubinger et al. — Sleeper Agents (Lesson 7, arXiv:2401.05566)](https://arxiv.org/abs/2401.05566) control y hipótesis de amenaza modelo
