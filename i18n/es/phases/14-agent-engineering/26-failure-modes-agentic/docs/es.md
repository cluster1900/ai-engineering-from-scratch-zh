# Los agentes por qué fallarán

> MASFT (Berkeley, 2025) clasificará 14 modos de falla de agentes en 3 categorías. La taxonomía de Microsoft registra los errores de IA existentes.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**先修要求：**Fase 14 · 05 (Auto-refinado y crítico), Fase 14 · 24 (Observabilidad)
**Time:** ~60 minutes

## El objetivo del aprendizaje
- Expresar tres categorías de fallas de MASFT y, en cada clase, al menos cuatro modelos específicos.
- explicar por qué el fracaso de la inteligencia artificial aumentará los modos de fracaso de la inteligencia artificial 
- Describir los cinco tipos de modelos de repetición de la industria y sus métodos de aceleración.
- 实现 un detector de problemas, con etiquetas de modo de falla 标注代理痕迹──

##  problemas
Los agentes de la equipo publicaron un 90% de los rastros de los cuales los demás 10% de los errores no son ruidos al azar, sino que se encuentran en una pequeña cantidad de categorías que aparecen de nuevo.

## 概念
### MASFT (Berkeley, arXiv:2503.13657)

Taxonomía de fallas de sistemas multiagentes. 14 modos de fallas.

核心主张: los fracasos son las deficiencias fundamentales del diseño de los sistemas de muchos agentes, en lugar de que se puedan superar mejores modelos básicos 修复的LLM 限制──

### Taconomía de Microsoft del modo de falla en los sistemas de IA agenciales

- 现有AI故障 (bias, halucinaciones, filtraciones de datos) 会在代理场景中被放大──
- Nuevos fracasos de la autonomía: acción involuntaria a gran escala, mal uso de herramientas, derivación de misión.
- Este documento blanco es un registro de riesgos de productos agentes.

### Caracterizando las fallas en la IA agencial (arXiv:2603.06847)

- Los fracasos de la orquestación, la evolución del estado interno y la interacción ambiental.
- No es sólo un mal código o un mal modelo de salida.

### Encuesta de alucinaciones de agentes de LLM (arXiv:2509.18970)

两种主要表现:

1. **Instruction-following Deviation** Agente 没有 seguir el sistema de aviso 
2. **Long-range Contextual Misuse** Agente  olvidar o usar erróneamente en el contexto de las primeras rondas 

Errores de subintención:Omición(漏掉步骤) ‧Redundancia(重复步骤) ‧Desorden(步骤顺序错误) ‧

### 五种行业反复出现的模式

Arize、Galileo、NimbleBrain analítica de la situación actual de la temporada 2024-2026 recibieron:

1. **Hallucinated actions.**El agente ha utilizado una herramienta inexistente o ha elaborado argumentos.
2. **Scope creep.**El agente extenderá la tarea a más allá de las necesidades del usuario (crear relaciones públicas extra, enviar correos electrónicos extra)
3. **Cascading errors.**Una falsa llamada a las API, convirtiéndose en un incidente de varios sistemas.
4. **Context loss.**长周期任务忘记早期轮次的约束──
5. **Tool misuse.**Usar argumentos erróneos 调用正确工具, o directamente调用错误工具──

El cascading es el más mortal. Los agentes no pueden distinguir que he fracasado y que la tarea no se puede completar.

### Mitigation: cada paso todos los puertos de configuración

En cada paso de la cadena de razonamiento, establecer puertas de verificación automática, contratar el estado del entorno  verificar la base de datos, específicamente:

- Cada paso clasificador de seguridad (lección 21)
- Validación de argumentos de llamada de herramienta (lección 06):
- Se recogerá el contenido con hechos conocidos 交叉检查(LECCIÓN 05, CRITICO)
- 通过重新探测状态 来检测 éxito alucinación 文件真的被创建了吗?)。

### Monitoreo de fallas  fácil de salir errores

- **Tagging only crashes.**La mayoría de los fallas de los agentes se producen como resultados eficaces.
- **No baseline.**Detección de deriva  necesita el último conocido-bueno; sin ella, no puedes juzgar  Esto está cambiando ──
- **Over-alerting.**Cada fallo produce una página. Deberían agruparse y limitar el ritmo.


```figure
failure-cascade
```

## Construirlo
`code/main.py`实现 un etiquetador de modo de falla de stdlib:

- Un conjunto de datos de rastro sintético de cinco modos de cobertura.
- Cada tipo de patrones corresponde a las funciones del detector (llamadas de herramienta, salidas, acciones repetidas de los patrones de firma)
- Una etiqueta, para marcar cada rastro y distribuir el modo de informe.

¿Qué es eso ?

```
python3 code/main.py
```

输出: etiquetas de cada línea de rastro + distribución agregada, es una forma de reducción de costos de los contenidos presentados en el clustering de rastro de Phoenix.

## Usalo
- **Phoenix**Utilizado para la producción de grupos de deriva ambiental (lección 24)
- **Langfuse**Usándolo en la repetición de la sesión + anotación.
- **Custom**Utilizando la plataforma de observabilidad 无法检测的 dominio-específicos firmas。

##  entregarlo
`outputs/skill-failure-detector.md`Los detectores de modo de falla de tu dominio,并连接到追踪商店──

##  ejercicios
1. 添加一个 成功幻觉探测器:Agente 返回成功,但目标状态 没有变化──
2. 标注 100 条 de un producto que has construido que tienen huellas reales. ¿Qué tipo de modelo lo domina? ¿Cuál es el costo de su reparación?
3.  Realizar una métrica de radio de cascada: dado el fracaso del N 步, ¿influyó en cuánto los pasos siguientes?
4. 阅读 MASFT's 14 种故障模式选择──三种适用于您的产品模式──编写探测器──
5. Para conectar un detector a la función de CI: si >=5% de las huellas están marcadas para algún tipo de modelo, entonces haga que la construcción  fracase.

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MASFT | “Multi-agent failure taxonomy” | Berkeley 14-mode categorization |
| Cascading error | “Ripple failure” | 一个早期错误会通过 N 个步骤传播 |
| Context loss | “Forgot the constraint” | 长周期轮次丢失早期轮次事实 |
| Tool misuse | “Wrong tool / wrong args” | 调用有效，但调用方式错误 |
| Success hallucination | “Faked completion” | Agent 在 400 上声称成功；state 未变化 |
| Scope creep | “Overreach” | Agent 做了超出要求的事 |
| Instruction-following deviation | “Disobedience” | 忽略 system prompt 或用户 constraint |
| Sub-intention errors | “Plan bugs” | plan execution 中的 omission、redundancy、disorder |

## 延伸阅读
- [Cemri et al., MASFT (arXiv:2503.13657)](https://arxiv.org/abs/2503.13657) 14 modalidades de fallas,3 个类别
- [Microsoft, Taxonomy of Failure Mode in Agentic AI Systems](https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/final/en-us/microsoft-brand/documents/Taxonomy-of-Failure-Mode-in-Agentic-AI-Systems-Whitepaper.pdf) Registro de riesgos
- [Arize Phoenix](https://docs.arize.com/phoenix) 实践中的 derivación en grupos
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) patrones más simples, ¿cómo evitarlos por completo?
