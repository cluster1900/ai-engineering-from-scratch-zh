# Indicaciones de referencia:SWE-bench,GAIA,AgentBench

> Tres puntos de referencia 构构成 2026年代理评价的点──SWE-bench 测试代码补丁──GAIA 测试一般主义工具使用──AgentBench 测试多环境推理──要了解它们的组成、污染、叙事,以及它们不衡量什么──

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 06 (Tool Use)
**Time:** ~60 minutes

## El objetivo del aprendizaje

- Explicando el arnés de prueba de SWE-bench, el equipo de pruebas de SWE-bench explica por qué se utiliza como puerta de prueba.
- Explica por qué existe una banca SWE Verified (OpenAI, 500 tareas) y por qué se ha eliminado todo esto.
- 描述 GAIA 的设计:对人类简单,对 AI 困难;三个难度等级──
- Explicar los ocho entornos de AgentBench, así como su principal bloqueador de LLM de código abierto.
- 总结 SWE-bench+ 发现污染及其影响──

##  problemas

Las tablas de clasificación te dirán qué modelo en un punto de referencia se ha ganado.

- Se trata de un punto de referencia si las soluciones han sido contaminadas (en los datos de formación, en las pruebas, en las filtraciones).
- Se trata de un ejemplo de la forma en que se puede evaluar el contenido de tu interés.
- evaluador ¿si es robusto?(estabilidad de los AST, controles de estado, revisión humana)

Antes de citar un número, primero comprenda estos tres puntos de referencia y sus modos de fracaso.

## 概念

### En el caso de los Estados miembros, el importe de la ayuda es de un importe de un año.

- Desde 12 repositorios de Python de 2.294 problemas reales de GitHub.
- Agente  get:pre-fix commit de base de código + descripción del problema en lenguaje natural。
- Agente 产出: un parche
- Evaluación: aplicación parche,运行 repo de la suite de pruebas。 parche 必须让 FAIL_TO_PASS tests(之前失败,现在通过)翻转,同时不破坏 PASS_TO_PASS tests。

SWE-agent(Yang et al., 2024) alcanzó el 12,5% en la publicación, cuyo foco es las interfaces agente-ordenador(comando de editor de archivos、modelo 能理解的搜索语法)

### En el caso de los bancos de SWE, el valor de la banca de SWE se verificó.

OpenAI,2024年8月──curated artificial 500-task subset──ha eliminado problemas ambiguos―testes poco fiables, así como arreglar tareas inciertas―.

### Contaminación

-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
- **SWE-bench+** encontró 32.67% de los parches exitosos en el texto de la cuestión filtraron soluciones (modelo en la descripción se vio fijado), otro 31.08% debido a la cobertura de prueba débil y se puede duda
- Verificado, pero no completamente sin contaminación.

实践影响: un modelo en SWE-bench gana 50%, en SWE-bench+ 上可能只有 35%── si usted afirma rendimiento en SWE-bench, por favor siempre siempre informe simultáneamente

### GAIA(Mialon et al., noviembre 2023)

- 466 preguntas; de ellas 300 se reservan para el ranking privado de huggingface.co/gaia-benchmark.
- 设计理念:对人类在概念上简单(92%), pero para la IA 困难(带插件的 GPT-4:15%) 
- 测试 razonamiento, uso multimodal de herramientas, web.
- Tres niveles de dificultad: nivel 3 需要跨modalidades de cadenas de herramientas largas.

GAIA se utiliza para medir la capacidad generalista. No se mezcle con los puntos de referencia específicos del código.

### El artículo 6 del Reglamento (CE) n.o 1295/2008 se aplica a las empresas de la Unión.

- 8 entornos, cubrir código ((Bash、DB、KG) 、juegos(Alfworld、LTP) 、web(WebShop、Mind2Web) y generación abierta。
- Multipursiones, cada división de alrededor de 4K-13K giros.
- El objetivo principal de la investigación es el de la investigación y la investigación de la información sobre la evolución de los sistemas de gestión de riesgos.

### Estos no cuentan qué

- El costo operativo del mundo real (Token, Wall-Clock)
- condiciones adversas.
- Tu dominio de rendimiento (Lección 30)
- Las fallas de cola: 1%)

### Comparativo 常见错误

- **执着于单一数字。**SWE-banch 50%  dirte información menor que P50 / P75 / P95 costo + distribución de paso.
- **Contaminated claims。**报告 SWE-bench 却不提 Verificados o SWE-bench+ es engañoso
- **Benchmark-as-development-target。**Para el punto de referencia 优化会偏离生产有用性──


```figure
ae-swebench-gate
```

## Construirlo

`code/main.py`实现 una versión de juego SWE-bench-like arnés:

- Tarea de solución de errores sintéticos (Tarefas 3)
- Un agente guionado, propondrá parches.
- Un corredor de pruebas, para revisar FAIL_TO_PASS.
- Un clasificador de dificultad de estilo GAIA basado en la profundidad de la descomposición de la pregunta.

¿Qué es eso ?

```
python3 code/main.py
```

输遇展示每一个任务+每一个难度的解决率,并让评价者规则 变得具体――

## Usalo

- **SWE-bench Verified**Utilizando agentes de código. Siempre reportando puntuaciones verificadas.
- **GAIA**Usar para agentes generalistas. Usar la división de la tabla de clasificación privada.
- **AgentBench**Utilizándose para la comparación entre múltiples ambientes.
- **Custom evals**(Lección 30) Para usar la forma real de tu producto.

##  entregarlo

`outputs/skill-benchmark-harness.md`Se puede construir un arnés de estilo SWE-bench, con un gate de FAIL_TO_PASS / PASS_TO_PASS.

##  ejercicios

1. Para usar este arnés de juguete, se puede transferir a un repo real para que pueda ejecutarse.
2. Añadir una métrica de recuento de pasos. ¿Cuántos pasos de agente se necesitan para cada resolución?
3. 阅读 SWE-bench+ paper──实现一个解决方案-leakage check(将发文与不同做模式匹配)──
4. ¿Cómo hacer esto? ¿Qué herramientas necesita?
5. ¿Qué medio ambiente es el que muestra la superficie de tu producto?

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| SWE-bench | “Code agent benchmark” | 2,294 个 GitHub issues；patch 必须翻转 FAIL_TO_PASS tests |
| SWE-bench Verified | “Clean SWE-bench” | 500 个由人工 curated 的 tasks，OpenAI |
| FAIL_TO_PASS | “Fix gate” | 之前 failing、patch 后必须 passing 的 tests |
| PASS_TO_PASS | “No-regression gate” | 之前 passing 且必须仍然 passing 的 tests |
| GAIA | “Generalist benchmark” | 466 个 human-easy / AI-hard 的 multi-tool questions |
| AgentBench | “Multi-env benchmark” | 8 个 environments；long-horizon multi-turn |
| Contamination | “Training-set leak” | benchmark tasks 出现在 model training 中 |
| SWE-bench+ | “Contamination audit” | 在 successful SWE-bench patches 中发现 32.67% solution leakage |

##  más阅读

- [Jimenez et al., SWE-bench (arXiv:2310.06770)](https://arxiv.org/abs/2310.06770) Origen de referencia
- [OpenAI, SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) 精选子集
- [Mialon et al., GAIA (arXiv:2311.12983)](https://arxiv.org/abs/2311.12983) Referencia generalista
- [Liu et al., AgentBench (arXiv:2308.03688)](https://arxiv.org/abs/2308.03688) Suites de muchos ambientes
