# En la elección de salida antes de definir el resultado

> La capacidad de realización de códigos de la velocidad aumenta el costo de los problemas de selección errónea.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** None
**Time:** ~60 分钟

## El objetivo del aprendizaje

- En el marco de una solución concreta, escriba un marco de resultados.
- 明确目标用户, situación actual y expectativa de mejora de la situación actual y de los indicadores de mejora esperada.
- 显式声明硬性约束 (constraint) con no objetivos (non-goals)
- Identificación de soluciones (soluciones)

## 交付产品不等于实质成效 交付产品不等于实质成效 交付产品不等于实质成效 交付产品不等于实质成效 交付产品不等于实质成效 交付产品不等于实质成效

 Construir un asistente de emergencia de fallas  Indicar que sólo es un producto ([[Output]])  No explica por completo quién lo necesita, qué indicadores mejorarán, y qué claves de seguridad deben mantenerse 

En comparación, el marco de resultados (Reflect Frame) es así:

> Cuando ocurre la denuncia de la policía, el ingeniero de trabajo puede localizar el servicio de fallas en dos minutos y confirmar la siguiente operación de seguridad, mientras que todo el proceso de registro se mantiene solo en el estado de control completo.

El resultado definido por esta frase, tanto puede lograrse a través de un conjunto de software, como puede lograrse mediante la optimización de un libro de ejecución, la reparación de datos o la realización de una modificación de interfaz de mayor alcance para lograrlo.

## Seis elementos principales del marco de trabajo

| 构成要素 | 核心问题 |
|---|---|
| 用户（User） | 谁在直接面对并承受该问题？ |
| 情境（Situation） | 该问题何时、何地发生？ |
| 当前现状（Current behavior） | 现状如何运作，包括现有的各种临时变通手段（Workarounds）？ |
| 期望成效（Desired outcome） | 哪些可观测的状态应当得到实质改善？ |
| 约束条件（Constraints） | 哪些安全、策略、成本或兼容性底线是固定的？ |
| 非目标（Non-goals） | 哪些极具诱惑但相关的邻近工作被明确排除在外？ |

```mermaid
flowchart LR
  U[用户与情境] --> C[当前现状]
  C --> O[期望成效]
  O --> K[约束条件]
  K --> N[非目标]
  N --> E[证据探究问题]
```

## 识别解决方案泄漏

Cuando el resultado de la presentación de resultados trae una forma de producto, forma de interfaz, modelo de selección, marco técnico o estructura de nivel inferior, se produce una fuga de soluciones:

-  Usuario por semana recibe un resumen : ha salido  resumen  esta forma y  por semana  esta frecuencia 
-  el usuario puede comprender el cambio de cuentas antes de la aprobación:
- 部署向量数据库: se ha filtrado el tipo de infraestructura seleccionada
-  Durante la auditoría se puede obtener fácilmente los requisitos de la política de cumplimiento : expresa la verdadera capacidad de aumento 

Cuando el sistema y la compatibilidad existentes realmente bloquean una tecnología, se puede nombrar la tecnología en condiciones de restricción, pero debe registrar claramente la razón objetiva de su bloqueo.

## 约束条件守护成效底线 约束条件守护成效底线 约束条件守护成效底线 约束条件守护成效底线 约束条件守护成效底线 约束条件守护成效底线 约束条件守护成效底线

Los términos de la unión no son detalles de realización, son componentes indissociables de los objetivos del mundo real:

- En el período de diagnóstico de fallas, se prohibirá la ejecución de cualquier operación de registro en el entorno de producción;
-  el tiempo de respuesta debe controlarse dentro del presupuesto de tiempo de ejecución de los accidentes;
-  los registros de auditoría existentes deben continuar teniendo la autoridad única;
- no permitir la introducción de nuevas bases de datos de operaciones;
- 无障碍访问(Accesividad) El apoyo debe mantenerse perfecto.

Si un sistema, aunque superficialmente alcanzó el objetivo esperado, viola cualquier restricción de carácter, entonces el sistema es un completo fracaso.

## De acuerdo con el no objetivo de la frontera

Los objetivos no pueden ser efectivos para evitar que una pequeña y práctica función se expande a una plataforma enorme.

- No se realice una reparación automática de fallas;
- No hacer un nuevo sistema de comunicaciones;
- No sustituye el comandante de incidente;
- Este pedazo no involucra funciones de análisis de datos históricos.

## Construirlo

El programa de experimentación de esta clase será una prueba de la escuela.`OutcomeFrame`La eficacia, y los resultados`outputs/outcome-frame.json`¿Qué es eso?

¿Qué es eso ?

```bash
python3 code/main.py
python3 -m unittest discover code/tests -v
```

尝试将期望成效修改为使用故障应急助手──校验器应敏地指出: el producto propuesto ya ha escapado a la definición de efecto realizado──

##  ejercicios

1. Una de las funciones de la lista de espera de proyectos de la página de fondo es reescribirla como un marco de resultados estándar.
2. Añadir un artículo que cambiará fundamentalmente la rigidez de los espacios de soluciones disponibles.
3. Añadir dos artículos que permitan asegurar que los primeros desarrollos de piezas se mantengan sencillamente sin objetivos.
4.  encontrar los indicadores de observación más tempranos que puedan confirmar el resultado esperado 
5. 构想三种完全不同, pero todos pueden satisfacer la misma forma de producto definido como resultado.

## 延伸阅读

- [Nuseibeh and Easterbrook, Requirements Engineering: A Roadmap](https://www.cs.toronto.edu/~sme/papers/2000/ICSE2000.pdf): explorar el objetivo del mundo real como idea central de la ingeniería de software.
- [Dardenne, van Lamsweerde, and Fickas, Goal-Directed Requirements Acquisition](https://doi.org/10.1016/0167-6423(93)90021-G): Explicar cómo se puede detallar gradualmente el objetivo de la alta clase en términos de operatividad y de reglamentación específica.

## 交付物与沉 交付物与沉 交付物与沉

Por favor, mantenga bien la producción.`outputs/outcome-frame.json`下一节课将对照人们实际执行工作流程进行对照,对其进行检查.
