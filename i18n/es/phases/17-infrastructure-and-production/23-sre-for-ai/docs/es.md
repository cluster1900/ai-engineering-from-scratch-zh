# AI SRE  Multi-Agent 事件响应、Runbooks、预测性检测

> AI SRE                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

**Type:** Learn
**Languages:** Python (stdlib, toy multi-agent incident triage simulator)
**Prerequisites:** Phase 17 · 13 (Observability), Phase 17 · 24 (Chaos Engineering)
**Time:** ~60 minutes

## El objetivo del aprendizaje
- 画出多代理 AI SRE 架构图:supervisor + agentes especializados (日志、指标、runbooks) + puerta de aprobación humana。
- 解释为什么自动补救的范围很窄 (¿qué es el alcance de la auto-remediación?)
- Cuál es el resultado de la evaluación de la adversidad?
- 引用 MIT 89% detección temprana 结果, así como restricción operativa: no hay accionamiento de la predicción de sólo tablas de control.

##  problemas
Un ingeniero en la llamada en la mañana 3 horas recibió la notificación: Checkout La tasa de error en el medio 很高──他们检查 Datadog、Loki、三个 runbooks、部署日志──30 分钟后, se dieron cuenta de que la causa raíz es el aumento de la caché KV 导致 vLLM OOM── ellos reiniciar el pod; error desaparece──

Para 2026, este tipo de encuestas pueden ser automatizadas en 20 minutos. De acuerdo con el servicio de integración de datos, se pueden implementar recientemente libretas de ejecución de compatibilidad.

完全自主修复是另一个问题──Restart pod:安全──Scale GPU pool:如果政策 允许则安全──Rearquite the service:绝对不行──关键原则是划清这条狭窄边界──

## 概念
### Arquitectura multiagente

```
          Incident
             │
             ▼
        Supervisor
        /    |    \
       ▼     ▼     ▼
  Log agent  Metric agent  Runbook agent
       │     │     │
       └─────┴─────┘
             │
             ▼
        Hypothesis + evidence
             │
             ▼
        Human approval
             │
             ▼
        Action (narrow set)
```

Supervisor  llevará a cabo un conjunto de hipótesis + pruebas  presentar a la humanidad  Humanidad aprobada o reorientada  Supervisor  llevará a cabo una composición  Supervisor                                                                                                                                                                                                                                                                                                                                                                                                                                                                                

### El alcance de la reparación automática

**Safe (narrow)**:reiniciar el pod, revertir el despliegue específico, en el grupo de escala de bordes dentro de las fronteras de la autorización previa, activar la bandera de las características de la autorización previa,

**Not safe (broad)**:更改服务拓基"",修改资源限制"",deployar nuevo código"",更改 IAM"",修改数据库"",

Cualquier persona lo vende y se olvida de él. Todos están en exceso de compromiso. Con la IA SRE, la seguridad se expande, pero la frontera es real.

### Sobre la resistencia a la acción de los animales

 Dos modelos independientes analizan el mismo incidente Si se acuerdan de la causa raíz, la confianza es mayor Si no se acuerdan, entonces se acentúan  a la humanidad                                                                                                                                                                                                                                      

### Memoria de operación

团队人员流动是传统SRE的隐形杀手 部落知识 会流失──AI SRE va a almacenar libros de ejecución + post mortem 存入向量DB;agentes 会在每一个新事件中检索──当新工程师加入时,AI 拥有完整历史──

### Previsión de los incidentes

MIT 2025 Estudios: En el conjunto de pruebas, basado en el historial √√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√

现实检查:没有动作的预测只是仪表板――操作问题是:当我们预测到时,要做什么?Preventivo drenamiento?Pager?Auto-scale?答案取决于具体政策――

### Productos en 2026

- **Datadog Bits AI** Datadog 内部的托管 SRE copiloto。
- **Azure SRE Agent** Nativo de Azur.
- **NeuBird Hawkeye** evaluación adversaria + memoria operativa。
- **PagerDuty AIOps** triaje + deduplicación。
- **Incident.io Autopilot** Comandante de incidentes + coordinación。

### Los libros de ejecución como código

Los libros de ejecución de Confluence  página de desarrollo para llevar a cabo un capítulo estructurado de los síntomas, hipótesis, verificación, acción, etc.

### Números que debes recordar

- Detección temprana del MIT: 89% de interrupciones,10-15 minutos de tiempo de entrega.
- Clasificación de múltiples agentes:supervisor +(日志、指标、runbooks) + humano。
- Configuración de reparación automática segura: reiniciar el módulo, volver a desplegar, en escala de frontera.
- Evaluar adversario: dos modelos independientes; acuerdo = confianza.


```figure
i4-incident-agents
```

## Usalo
`code/main.py`模拟多代理分类:log agent 找到错误,metric agent 找到 CPU spike,runbook agent 匹配到已知问题──Supervisor de las hipótesis 排序──

##  entregarlo
本课会生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-ai-sre-plan.md` Basándose en el volumen actual de llamadas, el volumen de incidentes, la madurez del equipo, diseñar un despliegue de AI SRE

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`¿Cómo resolver el problema si los agentes de registro y métrica no coinciden?
2. Por su servicio se definen tres acciones de auto-remediación seguras.
3. 编写一个结构化 runbook template:secciones, campos requeridos, comandos de verificación.
4. ¿Tu política es ¿qué es el "pager pre-drenado", o las dos?
5. 论证 Una 3 人团队 debería adoptar AI SRE en 2026 , ¿está esperando?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| AI SRE | “agent for on-call” | LLM-backed incident investigation + coordination |
| Supervisor agent | “the orchestrator” | 将 incidents 拆分为 sub-queries 的顶层 agent |
| Specialized agent | “domain agent” | 拥有 tool access（日志、指标、runbooks）的 sub-agent |
| Auto-remediation | “AI fixes it” | 狭窄的预先批准 action；不是宽泛的 re-architecture |
| Operational memory | “vector runbooks” | vector DB 中用于 RAG 的 post-mortems + runbooks |
| Adversarial eval | “two-model check” | 独立分析；agreement = confidence |
| NeuBird Hawkeye | “the adversarial one” | 具备 adversarial-eval + memory pattern 的产品 |
| Bits AI | “Datadog's SRE agent” | Datadog 托管的 AI SRE |
| Pre-incident prediction | “early detection” | outage prediction 的 10-15 分钟 lead time |

## 延伸阅读
- [incident.io — AI SRE Complete Guide 2026](https://incident.io/blog/what-is-ai-sre-complete-guide-2026)
- [InfoQ — Human-Centred AI for SRE](https://www.infoq.com/news/2026/01/opsworker-ai-sre/)
- [DZone — AI in SRE 2026](https://dzone.com/articles/ai-in-sre-whats-actually-coming-in-2026)
- [Datadog Bits AI](https://www.datadoghq.com/product/bits-ai/)
- [NeuBird Hawkeye](https://www.neubird.ai/)
- [awesome-ai-sre](https://github.com/agamm/awesome-ai-sre)
