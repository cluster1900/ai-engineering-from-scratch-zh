# Auto-mejoramiento limitado  diseño

> El estudio ha recibido cuatro primitivas de un ciclo de auto-mejora de restricciones. Las invariantes formales deben ser creadas en cada edición. Las anclas de alineación deben ser modificadas. Las restricciones multi-objetivas requieren de cada dimensión.

**Type:** Learn
**语言：**Python (stdlib, circuito limitado con control de invariantes)
**Prerequisites:** Phase 15 · 07 (RSI), Phase 15 · 04 (DGM)
**Time:** ~60 minutes

##  problemas

El simulador de carreras de la lección 7 muestra que las pequeñas diferencias de velocidad componen enormes diferencias. El estudio de caso DGM de la lección 4 muestra que el ciclo puede manipular activamente a sus propios evaluadores.

ICLR 2026 RSI Workshop resumen (openreview.net/pdf?id=OsPQ6zTQXV) identificó cuatro primitivas de este tipo. La RSP de Anthropic v3.0 (lección 19) y la FSF de DeepMind v3 (lección 20) están en los umbrales de capacidad.

诚实表述是:这些是减缓. Los resultados del análisis de la información limitan el alcance de cualquier sistema capaz de demostrar su propia naturaleza sistémica posterior, y en la actualidad ningún diseño ha cerrado este problema de forma.

## 概念

### Primitivo 1: invariantes formales

Invariante es una característica que debe existir en cada auto-modificación previa y posterior. Ejemplo:

- Distribución de la producción 以固定的宪章头条 为条件 (Leyción 17)
- 没有 herramienta llamada 指向未授权的终点──
- La memoria escribe 通过已记录、已签名的路径──
- El módulo hash del evaluador coincide con la versión de aprobación.

Invariantes por el ciclo 无法编辑的外部代码检查──如果某一提议修改 违反变量,就会被拒绝──这会捕捉 DGM 风格的评价者-tampering 模式(Leyón 4)──

La dificultad consiste en elegir las variables que se pueden calcular en un tiempo razonable, tanto para la seguridad como para la seguridad.

### Primitivo 2: anclajes de alineación

Ancha de alineación es el eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje de eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje eje

- Cada invocación es de lectura única.
- ▌Evaluador de un repositorio independiente dotado de control de acceso independiente.
- Se firmó por el hombre y en cada ciclo se realizó un nuevo test con el manifiesto de permiso de herramienta.

El rol del anclaje es prevenir la deriva objetiva. El circuito puede mejorar la forma en que se persigue el objetivo, pero no puede editar el objetivo en sí mismo.

微妙的失败模式: incluso el bucle no puede editar ancla, ya está en el proceso de lectura de ancla 方式发生漂移的循环 仍然可以重新解释它.

### Primitivo 3: restricciones multiobjetivas

Sólo optimiza un solo puntaje escalar de un bucle encontrará atajos.

- Performance (marco de referencia a nivel de tarea)
- Seguridad (evaluaciones del equipo rojo, tasa de rechazo de los conocidos)
- Equidad (subgrupos sensibles)
- Robustez ((conjunto de ensayos OOD √ Manejo de entradas adversos)

Sólo cuando cada restricción se establezca, la modificación será aceptada. El gobernador de gastos de la lección 13 la considerará como un elemento de seguridad.

### Primitivo 4: detección de regresión

Las puntuaciones de cada ciclo se compararán con las distribuciones históricas comparar. Superarán la tolerancia de la configuración. La baja de la tolerancia se suspenderá en el ciclo. Esto puede capturar la pérdida de capacidad silenciosa, de lo contrario se mejorará en el ciclo.

Una práctica realización: almacenamiento reciente N 个 ciclos de puntajes por tarea. Cada nuevo ciclo 计算 per tarea delta. Si cualquier delta 低于门值,则拒绝该周期并交交由人评――

### 信息论限制

La complejidad de Kolmogorov y el teorema de Lob sobre el sistema capaz de demostrar el alcance de su naturaleza establecieron los límites superiores. La Máquina formal de Godel de Schmidthub (lección 4) 准 es el tipo de límite más alto; actualmente todavía no hay nadie que complete la prueba extraordinaria. Los resultados de Lob indican: si un sistema puede demostrar que cree que si yo demuestro que debería hacer X, entonces haría X, que hará X en caso de no demostrar que debería hacer X, es un notable fracaso de autorreferencia.

Esto significa que a nuestros primitivos no se les puede cerrar el problema de seguridad. Se les hace más caros los fallos silenciosos. Un ciclo malicioso o desviado. Si el original se borra de un examen de falta, ahora debe destruir un examen de forma activa, y es una firma más fácil de detectar.

### Un ejemplo que funcionó

Supongamos que un agente propone una edición.

1. Verificación de las variables: módulos hashes, manifiesto de permisos de herramientas, encabezado constitucional,
2. Verificación de anclaje: declaración objetiva con la versión de la aprobación
3. Evaluación multiobjetivo: eje de rendimiento, seguridad, equidad, robustez,
4. Detección de regresión: no hay ningún eje de baja que exceda la tolerancia.

Todo lo que pasa debe pasar, cualquier fracaso se interrumpe.


```figure
bounded-gates
```

## Usalo

`code/main.py`En la Lección 4 de DGM, el juego de estilo funciona en un bucle de auto-mejora limitado, pero sobrepone estos cuatro primitivos. Cada primitivo puede activarse o desactivarse de forma individual. El objetivo de la demostración es: cada primitivo puede capturar una clase de fracaso específica, mientras que la eliminación de cualquiera de ellos permitirá que la clase de fracaso se enfrente.

##  entregarlo

`outputs/skill-bounded-loop-review.md`Auditoría un bucle limitado propuesto, y evalúa cuál de las cuatro primitivas logró realmente, en lugar de solo ver cuál afirma lograr.

##  ejercicios

1. En todos los primitivos se ejecuta en el caso de que se inicie .`code/main.py`❖ El ciclo de confirmación  todavía puede mejorar en la métrica primaria, mientras que no deja que el hack 获胜──

2. 禁用回归检测――construir una entrada, que conduce a la pérdida de capacidad silenciosa 接受──

3. 禁用 multi-objetivo restricción── muestra bucle en el eje de rendimiento 上收, simultáneamente eje de seguridad 下降──

4. ¿Qué texto, almacenamiento en dónde, cómo comprobar?

5. 阅读 ICLR 2026 RSI Workshop resumen。 seleccionar uno de los cuatro primitivos,并为当前状态艺术 提出一个具体改进──

## 关键术语: "El hombre es un hombre"

| Term | 人们的说法 | 实际含义 |
|---|---|---|
| Invariant | “始终为真的属性” | 每次 edit 前后由外部代码检查的属性 |
| Alignment anchor | “固定的目标” | 位于 loop edit surface 之外的不可变 core-goal representation |
| Multi-objective constraint | “所有 axes 都必须成立” | Performance、safety、fairness、robustness——全部必需 |
| Regression detection | “下降时暂停” | 当历史 metric deltas 暗示 capability loss 时暂停 loop |
| Kolmogorov bound | “信息论限制” | 限制系统能够证明其自身后继系统性质的范围 |
| Lob's theorem | “self-reference 陷阱” | 系统可以在没有证明自己应该做某事的情况下，依据“我应该”采取行动 |
| Gate stack | “分层检查” | 多个 primitives 的组合；任何 failure 都会拒绝 edit |
| Bounded improvement | “mitigation，而不是 proof” | 提高 silent-failure 成本；不会关闭 safety problem |

## 延伸阅读

- [ICLR 2026 RSI Workshop summary (OpenReview)](https://openreview.net/pdf?id=OsPQ6zTQXV) Cuatro primitivos de la recepción ──
- [Anthropic Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) umbrales de capacidad multiobjetivos。
- [DeepMind Frontier Safety Framework v3](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) El monitoreo de alineación engañosa  como primitiva invariante
- [Schmidhuber (2003). Godel Machines](https://people.idsia.ch/~juergen/goedelmachine.html) Los ancestros de estas primitivas 
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) anclaje de alineación basado en la razón。
