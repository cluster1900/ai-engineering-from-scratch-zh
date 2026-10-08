# Marco de preparación de OpenAI y Marco de seguridad fronteriza de DeepMind

> OpenAI Preparedness Framework v2(4月) introdujo las categorías de investigación:Autonomía de largo alcance, Sandbagging, Replicación Autónoma y Adaptación, Salvaguardias de minería, que son diferentes a las categorías rastreadas. Las categorías rastreadas se incitarán a informes de capacidades y así como a informes de salvaguardias, y revisadas por el Grupo Asesor de Seguridad. FSF v3 ((9月) del DeepMind del FSF de 2025 9月, Niveles de capacidad rastreadas 于 2026 4月 17日加入) se incorporará la autonomía 纳入 ML R&D y el ámbito de la Ciberseguridad (ML R&D autonomía nivel 1 en relación con el costo de competencia de las herramientas y las personas, la automatización total de la R&D del AI)  FSMV3  FSMV3  FSMV3  FSMV3  FSMV3  FSMV  FSMV  FSMV  FSMV  FSMV  FSMV  FSMV  FSMV  FSMV  FSMV  FSMV  FSMV  FSMV  FSMV  FSMV  FSMV  FSMV  FSMV  FSMV  FSMV  FSMV  FSMV  FSMV  FSMV  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  FSM  F

**Type:** Learn
**Languages:** Python (stdlib, three-framework decision-table diff tool)
**Prerequisites:** Phase 15 · 19 (Anthropic RSP)
**Time:** ~45 minutes

##  problemas

Lección 19 仔細讀了人類學的規模化政策──本课通過讀讀OpenAI和DeepMind的政策來補完全景──These tres archivos son del mismo tipo de productos, tratan sobre el mismo problema: fronterizos laboratorios 什麼時候應該暫停或限制一模型; se trenden en un grupo de clases, también se descienden en algunas posiciones concretas importantes──

趋同之处: 三者都把长远自主权 标记为值得追踪的能力类别──三者都承认欺骗行为(alignment faking、sandbagging) es un tipo específico de riesgo──三者都有内部审查机构──分歧之处:OpenAI 将类别分为Tracked(强制缓解) 和Research(不自动触发)──DeepMind 将自主权 纳入两个领域,而不是单独命名──实验室将使用Tracked Research,Critical vs Moderate、Tier-1 vs Tier-2等名称;能力落在哪个桶里,将在不同实验室产生不同的操作后──

En el mundo de la inteligencia, la capacidad de controlar y controlar las cosas es muy importante.

## 概念

### OpenAI Preparedness Framework v2(2025 年 4 月)

结构:

- **Tracked Categories**• Informe sobre las capacidades de los trabajadores (model能做什么) + Informe sobre salvaguardias (protecciones)
- **Research Categories**El proyecto de investigación de la Comisión sobre la seguridad de los animales y las especies de animales en el sector de la pesca, incluido el estudio de la investigación y la investigación de la investigación, se desarrolló en el marco de la investigación de la investigación de la investigación y la investigación de la investigación.

En el caso de las categorías de investigación, las categorías de investigación no se generan automáticamente con medidas de alivio.

### Marco de seguridad de la frontera de la mente profunda v3(2025 年 9 月;Niveles de capacidad seguidos 于 2026 年 4 月 17 日加入)

结构:

- **Critical Capability Levels (CCLs)**El objetivo de la investigación es mejorar la seguridad y la seguridad de los usuarios.
- **Tracked Capability Levels**:2026 年 4 月加入额外粒度──具体例:ML R&D autonomy level 1 = 以 comparado con los humanos + herramientas de IA Cost competitivo, totalmente automatización de la tubería de I&D de IA──
- **Deceptive alignment monitoring**:明确承诺对仪器推理滥用进行自动监控──

La autonomía se considera una autonomía que puede causar daño en el ámbito de la investigación y desarrollo y el ciberdelincuencia. Su conclusión es que la autonomía de ningún campo es una capacidad de riesgo.

### Tres personas que han tenido tendencias comunes

- 内部 Grupo Asesor de Seguridad (分别命名为人类SAG、OpenAISAG、DeepMind comité interno) (※高能力模型部署前进行审查──)
- 明确提到欺骗性配合/配合假冒 是一类风险──
- Es decir, la Comisión ha decidido que el programa de acción de la Comisión debe ser un instrumento de apoyo a la seguridad de las fronteras.
-  reconocer que la defensa de la monitorización es limitada.DeepMind dice claramente:La monitorización automática no será suficiente a largo plazo.

### ¿Dónde están las diferencias entre ellos?

- **Anthropic**:v3.0 移除了暂停承诺;AI R&D-4 umbral es el siguiente portal de la llamada 
- **OpenAI**:Tracked vs Research 拆分;Categorías de investigación (incluida la autonomía a largo plazo) no se automatizarán.
- **DeepMind**La autonomía se incluye en otros ámbitos; los niveles de capacidad seguidos se han incorporado a la región en 2026 y se han incrementado en 4 meses.

### El saco de arena: una capacidad específica para hacer que los tres personas se compliquen

Sandbagging (模型在评估中策略性表现不佳) se encuentra en OpenAI's Research Categories。Anthropic's RSP v3.0 通过评估-context gap(Leyón 1) procesarla──DeepMind 在 FSF v3 中通过欺骗性对齐监测处理它──

Si un modelo está en la bolsa de arena de evaluación, entonces la capacidad de cada marco valor se subestimará . El marco sólo es válido cuando se mide . Por eso, además de la evaluación de sí mismo en el laboratorio, también se necesitan mediciones externas .

### 政策阅读技能

- 定位: Cada una de las capacidades que te preocupan debería encontrarse en la política. Si no se encuentra, la política no la cubre.
- ¿Es rastreado o investigado pero no es rastreado?
- 节奏: ¿La política es según el calendario de la declaración, o sólo se actualiza después de un evento específico?
- 独立性: Exterior review is compulsory or optional?Antropic with Apollo y US AI Safety Institute 合作;OpenAI with METR 合作;DeepMind depende principalmente de SAG interno


```figure
a5-tracked-vs-research
```

## Usalo

`code/main.py` Implementar una pequeña herramienta de decisión de la tabla de diferencia.  Dado una capacidad:  autonomía  alineación engañosa  automatización de I+D  ciberelevación, etc.  emitirá tres políticas:

##  entregarlo

`outputs/skill-cross-policy-diff.md`Utiliza tres marcos como referencia, para la capacidad específica de generación de políticas en relación a la política.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Confirmar la compatibilidad de las diferentes herramientas con las políticas, al menos verificar la capacidad de los dos usuarios para examinar los archivos de la fuente de datos.

2. 完整阅读 OpenAI Preparedness Framework v2──识别每个研究类别──对每项,用一句话说明为什么它在研究而不是追踪──

3. 完整阅读 DeepMind FSF v3, así como los niveles de capacidad seguida de abril de 2026 更新──识别 ML R&D autonomía nivel 1 具体评估标准──你会如何从外部测量它?

4. Sandbagging  está en OpenAI de las categorías de investigación. Diseñar una evaluación, obligar a los modelos de la bolsa de arena a exponer su verdadera capacidad.

5. 针对某项具体能力 (由你选择) 比较三项政策――说明你认为哪些政策的分类最严谨的,哪些最不严谨的,用文本证明――

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| Preparedness Framework | “OpenAI 的 scaling policy” | PF v2（2025 年 4 月）；Tracked vs Research categories |
| Tracked Category | “Mandatory mitigation” | 触发 Capabilities + Safeguards Reports；SAG review |
| Research Category | “Monitored only” | 被追踪但没有自动缓解措施；包括 Long-range Autonomy |
| Frontier Safety Framework | “DeepMind 的 scaling policy” | FSF v3（2025 年 9 月）+ Tracked Capability Levels（2026 年 4 月） |
| CCL | “Critical Capability Level” | DeepMind 每个领域的阈值（Cyber、Bio、ML R&D、CBRN） |
| ML R&D autonomy level 1 | “R&D automation” | 以有竞争力的成本完全自动化 AI R&D pipeline |
| Sandbagging | “Strategic underperformance” | 模型在 evals 中表现不佳；位于 OpenAI Research Categories |
| Instrumental reasoning | “Means-ends reasoning” | 关于如何实现目标的推理；DeepMind monitoring 的目标 |

## 延伸阅读

- [OpenAI — Updating our Preparedness Framework](https://openai.com/index/updating-our-preparedness-framework/) v2 publicidad
- [OpenAI — Preparedness Framework v2 PDF](https://cdn.openai.com/pdf/18a02b5d-6b67-4cec-ab64-68cdfbddebcd/preparedness-framework-v2.pdf) 完整文档──
- [DeepMind — Strengthening our Frontier Safety Framework](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) FSF v3 公告──
- [DeepMind — Updating the Frontier Safety Framework (April 2026)](https://deepmind.google/blog/updating-the-frontier-safety-framework/) Niveles de capacidad seguidos 增补。
- [Gemini 3 Pro FSF Report](https://storage.googleapis.com/deepmind-media/gemini/gemini_3_pro_fsf_report.pdf) FSF 格式 风险报告示例──
