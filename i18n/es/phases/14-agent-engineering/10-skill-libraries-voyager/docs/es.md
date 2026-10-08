# Capacidad y formación (Voyager)

> Voyager (Wang et al., TMLR 2024) va a ejecutar el código como una forma de Habilidad. Habilidad: tener características de nombre, capacidad de recogida, capacidad de combinación, y mejorar continuamente a través del ambiente. Esta es la estructura de referencia de las habilidades SDK de Claude Agent, así como de la biblioteca de habilidades de 2026 .

**类型：**Construir
**语言：**Python (stdlib)
**先修：**Fase 14 · 07 (MemGPT), Fase 14 · 08 (Letta Blocks)
**时间：**~ 75 minutos

## El objetivo del aprendizaje

- Explicar los tres componentes de Voyager: currículo automático, biblioteca de habilidades, incitación iterativa, y explicar su papel.
- Explica por qué Voyager se encargará de diseñar el espacio en código, en lugar de orden original.
- Utiliza la Sdlib para lograr un apoyo a la inscripción, la búsqueda, la combinación y la mejora de habilidades impulsadas por el fracaso.
- Mapear el modelo de Voyager hasta 2026 Claude Agente habilidades SDK y habilidades kit 生態系

##  problemas

Cada sesión se lleva a cabo desde cero, con capacidad de reconstrucción de todos los agentes, y se cometen tres tipos de errores:

1. **浪费 Token。**Cada tarea se reinicia con la misma idea.
2. **丢失进展。**Sesión A. La modificación de la escuela no se trasladará a la sesión B.
3. **无法处理长程组合。**complex tareas requieren niveles de capacidad; un disparo rápido imposible para expresarlas 

La respuesta de Voyager es: considerar cada capacidad de repetición como un segmento de código denominado almacenado en la biblioteca, puede ser revisado de similitud, puede combinarse con otros componentes de habilidades, y puede ejecutarse en constante mejora.

## 概念

### Tres componentes

Voyager (arXiv:2305.16291) 围绕以下内容组织代理:

1. **Automatic curriculum。**Proponente impulsado por curiosidad, se basará en el agente actual.
2. **Skill library。**Cada habilidad es ejecutable. Después del éxito de la tarea se añade una nueva habilidad.
3. **Iterative prompting mechanism。**Cuando fracasas, el agente recibirá ejecutar errores, el ambiente y la autoevaluación, y luego mejorará la habilidad.

Minecraft 评估(Wang et al., 2024):相比基线,独特物品多 3.3 倍,石器工具 快 8.5 倍,铁工具 快 6.4 倍,地图遍历距离长 2.3 倍──这些数字是Minecraft 特定的,但模式可迁移──

### 动作空间 = 代码

输出原始命令──Voyager 输出 JavaScript 函数──一个技能是:

```
async function craftIronPickaxe(bot) {
  await mineIron(bot, 3);
  await mineStick(bot, 2);
  await placeCraftingTable(bot);
  await craft(bot, 'iron_pickaxe');
}
```

Por el mismo modo, el programa es un proceso de búsqueda de habilidades y de forma más rápida.

Esto es 2026 Claude Agent SDK habilidad: un fragmento de código, recarga el agente 按需加载说明.

### Habilidad 检索

Nueva tarea es hacer una picada de diamantes.

1. Para la descripción de tareas  realizar la incorporación 
2. Encuentra la capacidad, obtenga la capacidad de la clase superior.
3. 检索                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `craftIronPickaxe`¿Qué es esto?`mineDiamond`¿Qué es esto?`placeCraftingTable`Y así.
4. Usando el idioma original + Nuevo logístico nuevo Habilidad.

Éste es el modo de lograr los recursos MCP (Fase 13) y las habilidades de SDK de Agente: realizar búsquedas en la superficie del conocimiento/código, y no limitarse a la gama de tareas actuales.

### 代改进 (se puede hacer más rápido)

El ciclo de la Voyager:

1. Agente, escribe una habilidad.
2. Habilidad en el medio ambiente.
3. 返回三种信号之一:`success`¿Qué es esto?`error`(Bandado con rastro de pila)`self-verification failure`¿Qué es eso?
4. El agente utiliza este señal como habilidad para escribir de nuevo.
5. 循环 hasta el éxito o alcanzar el número máximo de rotas.

Esto es Auto-Refine (LECCIÓN 05) se utiliza para generar código, y se utiliza para implementar el entorno.

### Currículo y exploración

El módulo de currículo de Voyager se basará en el agente 已拥有什么、还没有做什么, proponiendo similarconstruir un refugio cerca del lago的任务──proponente Uso de estado ambiental + Inventario de habilidades selección略高于当前能力的任务,也就是探索的最佳区间──

Para el agente de producción, esto se convertirá en un operador que no tiene: una base de habilidades y un dominio, ¿qué habilidades aún no hemos cubierto?

### Este modo es fácil de salir mal donde

- **Skill library rot。**La misma habilidad se utiliza con una descripción diferente añadir 10 veces.
- **Composed-skill drift。**El padre habilidad depende de un hijo habilidad mejorada posteriormente.
- **Retrieval quality。**Con la crecimiento de la base de habilidades a varios cientos, basado en la descripción de habilidades de recuperación de vectores 会退化── utilizar filtro de etiquetas 和硬约束补充(`category=tooling`) 


```figure
voyager-skills
```

## Construirlo

`code/main.py`实现 una biblioteca de habilidades:

- `Skill` nombre, descripción, código, versión, etiquetas y dependencias.
- `SkillLibrary` registro  búsqueda  tokens superposición  composición  dependen de la extensión 排序) y refinar 更新时 version bump) 
- Un agente de guionado: registrarse tres habilidades originales, juntar la cuarta, encontrar una vez un fracaso, y luego mejorar.

运行:

```
python3 code/main.py
```

trace 会展示库写入、检索、组合、一次失败执行,以及 v2 改进, es decir, el proceso de final a final del ciclo Voyager.

## Usalo

- **Claude Agent SDK skills**(Antropico)  2026 参考: cada habilidad tiene descripción、código 和 instrucciones; en sesión de agente 中按需加载。
- **skillkit**(npm: skillkit)  面向 32+ agentes de codificación de IA 跨代理 技能管理──
- **Custom skill libraries**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
- **OpenAI Agents SDK `tools`** 低配版本; cada herramienta es una habilidad de poca monta.

##  entregarlo

`outputs/skill-skill-library.md`Se generará una biblioteca de habilidades en forma de Voyager, para cualquier objetivo en el tiempo de ejecución.

##  ejercicios

1. - ¿ Qué ?`compose()`¿Cuándo la habilidad A depende de B y B también depende de A? ¿Qué ocurrirá? ¿Erro o advertencia?
2. 实现每个技能的版本固定──当父技能组合子技能 `crafting@1`时,对 `crafting@2`La mejora no puede ser silenciosa.
3. 将 token-overlap retrieval 替换为句子变换器嵌入式(或 BM25 stdlib 实现) ・・・在一个50Skill juguete biblioteca 上测量 retrieval@5。
4. Añadir un agente de currículum:给定当前库和一个域描述, proponer 5 个缺失技能──每周调用一次──
5. ¿Qué cambios han ocurrido en la biblioteca de juguetes  transferido al esquema de habilidades de SDK?

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Skill | “可复用能力” | 带有 description 的命名代码块，可通过相似度检索 |
| Skill library | “agent 的 how-to 记忆” | Skill 的持久化存储，可搜索、可组合 |
| Curriculum | “任务 proposer” | 由当前能力缺口驱动的自底向上目标生成器 |
| Composition | “Skill DAG” | Skill 调用 Skill；执行时进行拓扑排序 |
| Iterative refinement | “自我修正循环” | Env 反馈 + 错误 + 自验证，会折回到下一个版本中 |
| Action-space-as-code | “程序化动作” | 输出函数，而不是原始命令，用于时间跨度更长的行为 |
| Dedup on write | “Skill collapse” | 近重复 description 会合并为一个 canonical Skill |

## 延伸阅读

- [Wang et al., Voyager (arXiv:2305.16291)](https://arxiv.org/abs/2305.16291) 原始 Habilidades-Biblioteca 论文
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) Formación de las competencias para el año 2026
- [Anthropic, Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)  habilidades en la práctica y subagentes
- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) Ciclo de mejoras de la Voyager
