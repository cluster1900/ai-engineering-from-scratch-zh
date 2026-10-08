# Supervisión escalable y generalización de débil a fuerte

> Burns et al.(OpenAI Superalignment,Weak-to-Strong Generalization,2023) propone una misión de superalignamiento: utilizar etiquetas generadas por modelos más débiles para ajustar a un modelo fuerte. Si el modelo fuerte puede generalizarse correctamente en un supervisión débil imperfecto, entonces el método de alineación de la escala humana actual puede extenderse a un sistema superhumano. La supervisión escalable y W2SG son complementarios.

**类型：**El aprendizaje
**语言：**Python(stdlib, simulador de brechas W2SG)
**先修：**Fase 18 · 01(seguida de instrucciones) Fase 18 · 10 Fase 09 Fundamentos de la IA)
**时间：** 60 minutos

## El objetivo del aprendizaje

- 定义可扩展监督和弱到强的概括,并解释它们如何互补──
- 描述 Burns et al. 2023 的实验设置:使用来自GPT-2 的标签来细调GPT-4──
- 解释 rendimiento gap recuperado PGR) indicador y su contenido de medida
- Por lo tanto, el objetivo de la Comisión es que la Comisión pueda adoptar medidas de control de las actividades de la empresa y de la empresa.

##  problemas

Hasta ahora, cada tipo de alineación en la Fase 18 技术都假设监督人能够评估模型行为──当模型达到超人类水平时,监督人就成了弱环节──超级排列的问题是: ¿Podrá un supervisor más débil generar con confianza un modelo más fuerte y alineado?

Burns et al. reducen este problema a una configuración de experiencia operable: con un modelo débil, el modelo de vigilancia fuerte, mide cuántos modelos de vigilancia fuerte tienen capacidad para mantenerse bajo vigilancia débil.

## 概念

### W2SG:Burns et al. de la configuración

- 弱模型:GPT-2 级别──
- 强模型:GPT-4 级别──
- 目标: misión 上强 GPT-4 的天花板──

流程:
1. 获取弱模型在某任务上零射 预测──
2. En el mal etiquetado datos de la fina-tune 强模型──
3. 衡量精调的强模型的准确率──

基线:弱模型自身的准确率、强模型在黄金标签 监督下的天花板──

Gap indicator:Performance Gap Recovered (PGR) = (finado - débil) / (techo - débil) ――PGR 为 表示弱监督完全弥合了差距;PGR 为 0 表示弱监督没有帮助──

### Experiencia de Burns et al.

En el trabajo de PNL, el modelo de ajedrez y de recompensas se generaliza por encima de los errores de los supervisores débiles.

Burns et al. Indicaciones de limitaciones:
- La brecha entre débil y fuerte es la diferencia de capacidad, no la alineación.
- La generalización del modelo fuerte puede ser más de la experiencia de la tarea, en lugar de la restauración de la intención de la verdad fundamental.
- El conocimiento latente de los modelos de extrema fuerza es un verdadero problema; la medición de la RPG es una forma de operación específica.

### Supervisión escalable: 三种机制

- **Debate（Irving et al. 2018）。**Dos ejemplos de U se encuentran en el debate de posición opuesta; juez débil hace un juicio. Su hipótesis es: encontrar una respuesta verdadera con persuasión es más fácil que encontrar una falsa con persuasión.
- **Recursive Reward Modeling（Leike et al. 2018）。**U   ayudar a humanos entrenar U + 1 modelo de recompensa ⋅ la eficacia del supervisor con el aumento de la capacidad de modelo ⋅
- **Task Decomposition（Christiano, Shlegeris, Amodei 2018）。**Se puede desglosar la tarea difícil en subtareas que el hombre puede examinar.

Cada mecanismo hace una especie de hipótesis sobre la alineación de la estructura de tareas o de los componentes intermedios.

### ¿Por qué la supervisión escalable y W2SG son complementarios

Supervisión escalable  mejorar la calidad de los señales eficaces de los supervisores
El W2SG 弥合监督者能够提供任何不完美信号所带来的差距──

Lang et al.  Debate Helps Weak-to-Strong Generalization ((arXiv:2501.13124) 将二者结合:debate 协议提供更好的弱标签,强模型在这些标签上训练──报告显示 NLP 任务上的 PGR 有所提升──

###  Cambios en el nivel de la organización

El equipo de Superalignamiento de OpenAI en Jan Leike 于 2024 年 5 月离职加入人类后解散──该议程(supervisión escalable、W2SG、investigación de alineación automatizada) en la Antropic 和学术实验室 continuar avanzando, incluida MATS(Leyón 28)、Redwood(Leyón 10)、Apollo(Leyón 8)、METR(Leyón 28)

### Está en la fase 18

Las lecciones 6-10 describen la amenaza y la defensa bajo la premisa de la hipótesis de U increíble. La lección 11 es la forma de ataque: hacer que el supervisor sea suficientemente fuerte para verificar la alineación de U. Las lecciones 12-16 se transforman a la evaluación adversaria.


```figure
scalable-oversight
```

## Usalo

`code/main.py`En una misión de composición simula W2SG de tono fino contribution contribution contribución  weak labeler 准确率为 70%,并带有结构错误;强模型在金标签上限为 95% contribution contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribución contribu

##  entregarlo

本课会生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-w2sg-pgr.md`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                                           

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Report debilidad = 0.60、0.70、0.80 时的 PGR──explicar la forma de la curva de PGR──

2.  modificar el etiquetador débil, lo que lo hace con errores estructurales (por ejemplo, en un tipo de entrada específico siempre es un error).

3. 阅读 Burns et al. 2023 Sección 4.3 (Tascas de NLP)  Reproducción  Perdida auxiliar de confianza                                                                                                                                                                                                                                               

4. Para una ingeniería de software 任务设计一个结合辩论和任务分解的可扩展式监督 协议――说出每个组件的故障模式,并解释这种组合如何处理或无法处理这些故障模式――

5. Por ejemplo, el estudio de la generalización de la superalienación es un ejemplo de la generalización de la superalienación.

## 关键术语: "El hombre es un hombre"

| 术语 | 人们常说 | 实际含义 |
|------|----------|----------|
| Scalable oversight | “让监督者更强” | 提高监督者评估更强模型能力的机制 |
| W2SG | “弱监督强” | 在弱标签上 fine-tuning 强模型，并衡量恢复的能力 |
| PGR | “performance gap recovered” | (fine-tuned - weak) / (ceiling - weak)；1.0 = 完全弥合，0 = 无帮助 |
| Debate | “两个 U 实例辩论” | 一种 scalable oversight 机制，其中弱 judge 在两个 U defenders 之间做选择 |
| RRM | “recursive reward modeling” | U 帮助训练 U+1 的 reward model；监督者能力跟随 U |
| Task decomposition | “人类检查子任务” | 将困难任务递归拆解为人类可以验证的子任务 |
| Superalignment | “对齐超人类 AI” | 关注对齐人类无法直接评估的模型的研究议程 |

## 延伸阅读

- [Burns et al. — Weak-to-Strong Generalization (OpenAI 2023)](https://openai.com/index/weak-to-strong-generalization/) W2SG 论文
- [Irving, Christiano, Amodei — AI safety via debate (arXiv:1805.00899)](https://arxiv.org/abs/1805.00899) debate  mecanismo
- [Leike et al. — Scalable agent alignment via reward modeling (arXiv:1811.07871)](https://arxiv.org/abs/1811.07871) Modelado recurrente de recompensas
- [Khan et al. — Debating with More Persuasive LLMs Leads to More Truthful Answers (arXiv:2402.06782)](https://arxiv.org/abs/2402.06782) Experimento de estudio sobre el debate de los más fuertes debatedores en 2024
- [Lang et al. — Debate Helps Weak-to-Strong Generalization (arXiv:2501.13124)](https://arxiv.org/abs/2501.13124) Debate del año 2025 + W2SG
