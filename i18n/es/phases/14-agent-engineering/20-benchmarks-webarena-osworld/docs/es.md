# 基准测试: WebArena y OSWorld

> WebArena en cuatro aplicaciones de administración propia en Ubuntu, Windows y macOS, muestra una gran diferencia entre el agente de primera línea y el humano. La diferencia se está reduciendo; los modos de falla no han cambiado.

**类型：**El aprendizaje
**语言：**Python (stdlib)
**先修要求：**Fase 14 · 19 (banco SWE, GAIA)
**时间：** 60 minutos

## El objetivo del aprendizaje

- Describa las cuatro aplicaciones de autoadministración de WebArena y por qué es importante evaluar la ejecución.
- Explica por qué OSWorld utiliza un sistema operativo real 截图, en lugar de API de accesibilidad.
- Expresar dos principales modos de falla de OSWorld: conexión a tierra de la UIG y conocimientos operacionales.
- 总结 OSWorld-G 和 OSWorld-Human en base al índice de referencia 之上增加了什么──

##  problemas

¿Pueden utilizarse las herramientas de un agente de uso general? ¿Pueden realizar 20 clics en el navegador para completar una compra? ¿Pueden configurar solo un teclado y un ratón en una máquina Linux?

## 概念

### WebArena (Zhou et al., ICLR 2024)

- 覆盖四自托管网应用的812长程任务:购物网站,论坛,类 GitLab的开发工具,商业 CMS,
-  hay otras herramientas prácticas: mapa, calculador, raspad.
-  evaluación a través de APIs de gimnasio  basado en ejecución completada: ¿ha bajado el pedido, el tema está cerrado, la página del CMS está actualizada?
- 发布时: el mejor agente GPT-4 alcanzó la tasa de éxito del 14,41%, mientras que el humano fue del 78,24%.

La configuración de auto-administrador es importante, ya que la aplicación de destino está fija y se puede replicar, por lo que el benchmark no se hace estable debido a cambios externos.

### 扩展

- **VisualWebArena** 视觉 grounding 任务, éxito depende de la interpretación de la imagen 截图作为一等观察)
- **TheAgentCompany**(Decembro 2024)  加入 terminal + codificación;更像真实的远程工作环境。

### OSWorld (Xie et al., NeurIPS 2024)

- 覆盖 Ubuntu、Windows、macOS 个 369 个真实计算机任务──
- Para la aplicación real de la forma libre de control de teclados y ratones.
- 以 1920×1080 截图 como observación
- 发布时: el mejor modelo fue el 12,24%, el humano fue el 72,36%.

### Principales modos de falla

1. **GUI grounding。**Pixel → elemento 映射──Modelo 很难在 1920×1080 中可靠定位 UI 元素──
2. **Operational knowledge。**¿Qué menú hay en el listado, qué acceso directo al teclado, qué pane de preferencias?

### 后续工作

- **OSWorld-G** 564 个样本的地面积套装 + Jedi training set──将地面积与规划 拆解开来,因此可以分别测量──
- **OSWorld-Human**  人工整理的黄金行动轨迹──显示顶级代理 使用的步骤比必要步骤多 1.4-2.7x(trayectoria-eficiencia gap)──

### ¿Por qué es tan importante ?

Claude uso informático、OpenAI CUA、Gemini 2.5 Uso informático(Lección 21) Todos están en la carga de trabajo de la WebArena y OSWorld 塑造 上练──BENCHMARK es el objetivo; modelo de producción es la respuesta entregada──

### Comparar las diferencias 容易出错的地方

- **仅截图 evals。**OSWorld es un proyecto de investigación y desarrollo de sistemas operativos.
- **忽略 trajectory length。**Sólo según la tasa de éxito, se perderá la exposición de los 1.4-2.7x pasos de bajo efecto.
- **陈旧的自托管 apps。**Las aplicaciones de WebArena fijan una versión específica; si no se reorganizan en la versión actualizada, se destruirá la comparabilidad.


```figure
ae-agent-human-gap
```

## Construirlo

`code/main.py`实现 un juego de agente web arnés:

- Una aplicación de compras mínima  estado: lista_items add_to_cart checkout
- 3 个任务的黄金轨迹――
- Un agente guionado de cada misión.
- 基于执行的评估 () 状态检查 () 和轨迹效率 () 步与黄金 () 

¿Qué es eso ?

```
python3 code/main.py
```

输出: tasa de éxito y eficiencia de trayectoria de cada misión, en respuesta a los métodos OSWorld-Human

## Usalo

- **WebArena Verified**Autosubvenciones en el grupo interno, para su evaluación continua.
- **OSWorld**运行在 VM flota, para agentes de escritorio.
- **Computer-use agents**(Lección 21)  Claude、OpenAI CUA、Gemini  都在类似类型的工作负载上训练──
- **你自己的产品流程** Para las 20 tareas más importantes de captura de trayectorias de oro; cada semana con su agente de prueba.

##  entregarlo

`outputs/skill-web-desktop-harness.md`Construir un arnés de agente web/de escritorio, que incluya métricas de evaluación y eficiencia de trayectoria basadas en la ejecución.

##  ejercicios

1. Use otra aplicación (en inglés) para ampliar el arnés de juguetes.
2. ¿En tu juguete, el agente es oro de 1x 2x o 3x?
3. ¿Se inducirá el agente escrito?
4. ¿Cómo distinguirás en tus evaluaciones entre fallas de tierra y fallas de planificación?
5. Cuando actualizas una aplicación fija, ¿qué destruye?

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| WebArena | "Web agent benchmark" | 覆盖 4 个自托管 apps 的 812 个任务；gym-style evaluation |
| VisualWebArena | "Visual WebArena" | 视觉 grounding 的 WebArena；截图是 observations |
| OSWorld | "Desktop agent benchmark" | 在真实 Ubuntu/Windows/macOS 上的 369 个任务 |
| GUI grounding | "Pixel-to-element mapping" | Model 在 1920x1080 中定位 UI 元素 |
| Operational knowledge | "OS know-how" | 哪个菜单、哪个 shortcut、哪个 preference pane |
| OSWorld-G | "Grounding suite" | 564 个仅 grounding 样本 + training set |
| OSWorld-Human | "Gold trajectories" | 用于衡量效率的人工专家动作序列 |
| Trajectory efficiency | "Steps over gold" | Agent 步数除以人类最小步数 |

## 延伸阅读

- [Zhou et al., WebArena (arXiv:2307.13854)](https://arxiv.org/abs/2307.13854) 4 app web benchmark
- [Xie et al., OSWorld (arXiv:2404.07972)](https://arxiv.org/abs/2404.07972) 跨 OS de escritorio de referencia
- [Anthropic, Introducing computer use](https://www.anthropic.com/news/3-5-models-and-computer-use) Claude by benchmark 塑造 capacidad
- [OpenAI, Computer-Using Agent](https://openai.com/index/computer-using-agent/) OSWorld y WebArena
