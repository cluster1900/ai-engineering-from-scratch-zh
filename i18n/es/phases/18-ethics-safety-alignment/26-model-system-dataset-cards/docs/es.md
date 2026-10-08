# Modelo, Sistema y tarjetas de conjunto de datos

> Tres tipos de archivos forma constituyen la estructura de la IA 透明度──Model Cards(Mitchell et al. En el año 2019, el modelo de etiquetas nutricionales: entrenamiento de datos, análisis de grupos de análisis, análisis de valores y consideraciones; sólo el 0,3% de las tarjetas de modelos Hugging Face registraban valores y consideraciones. 2023) ・Fabricas de datos para Datasets (Gebru et al. 2018, CACM) 动机、组成、收集过程、标注、分发、维护;类比电子元件数据 Sheet──Data Cards(Pushkarna et al., Google 2022) 模块化分层细节(telescópico、periscópico、microscópico), como un objeto de frontera de diferentes lectores──2024-2025 años de desarrollo: a través de LLMs automática generación(CardGen, Liu et al. 2024);modelo-carta  detalles relacionados con HF arriba hasta 29% de la subida de volumen de aumento La Comisión ha aprobado el proyecto de ley de la Unión Europea (UE) n.o 525/2012. El informe de sostenibilidad de la región de la Unión Europea (CAP) se complementa con el informe de la Comisión de la Unión Europea (CAP) sobre la sostenibilidad de la región de la Unión Europea (CAP). • Cartas de control de la UE/ISO están apareciendo. • Cartas de sistema: • Siddhpurwala 2024; • Meta  sistemas de transparencia; • Planes de confianza: arXiv:2509.20394)

**Type:** Build
**Languages:** Python (stdlib, model-card + datasheet + system-card generator)
**Prerequisites:** Phase 18 · 18（安全框架），Phase 18 · 24（监管）
**Time:** ~60 分钟

## El objetivo del aprendizaje

- 描述 Mitchell et al. 2019 原始模型卡 和 Gebru et al. 2018 ficha de datos。
- 描述 Datos de tarjetas de datos de la sección de la sección de la tarjeta de datos de la sección de la tarjeta de datos de la sección de la tarjeta de datos de la tarjeta de datos de la tarjeta de datos de la tarjeta de datos de la tarjeta de datos de la tarjeta de datos de la tarjeta de datos de la tarjeta de datos de la tarjeta de datos de la tarjeta de datos de la tarjeta de datos de la tarjeta de datos de la tarjeta de datos de la tarjeta de la tarjeta de datos de la tarjeta de datos de la tarjeta de la tarjeta de datos de la tarjeta de la tarjeta de datos de la tarjeta de la tarjeta de datos de la tarjeta de la tarjeta de datos de la tarjeta de la tarjeta de datos de la tarjeta de la tarjeta de datos de la tarjeta de la tarjeta de datos de la tarjeta de la tarjeta de datos de la tarjeta de datos de la tarjeta de la tarjeta de datos de la tarjeta de datos de la tarjeta de datos de la tarjeta de la tarjeta de datos de la tarjeta de datos de la tarjeta de datos de la tarjeta de datos de la tarjeta de datos de la tarjeta de datos de la tarjeta de datos de la tarjeta de la tarjeta de datos de datos de la tarjeta de datos de la tarjeta de tarjeta de datos de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta de tarjeta
- describir las tarjetas de sistema  y su alcance de cobertura de terminación hasta terminación¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- Explicar tres proyectos de desarrollo de 2024-2025:

##  problemas

监管框架 (Ley 24) y la política de seguridad de laboratorio (Ley 18) ⇒ todo requiere un archivo.

## 概念

### Carteles modelo (Michell et al. 2019)

章节:
- Detalles del modelo.
- Uso previsto:
- Factores (de la población o del medio ambiente) para la evaluación.
- Las métricas.
- Datos de evaluación:
- Datos de formación
- Análisis cuantitativos (en función de los factores, 分组)
- Considerancias éticas.
- Atención y recomendaciones.

 Adopción:Oreamuno et al. 2023  Audit de las tarjetas de modelo Hugging Face  sólo el 0,3%  registró el examen étnico

### Ficha de datos para conjuntos de datos (Gebru et al. 2018)

类比电子元件 ficha de datos.
- Motivation (por qué crear este grupo de datos)
- Compuesto ((incluye qué)
- Proceso de recogida (how to collect)
- Etiquetado (如适用)
- Uso (precision usage, prohibition usage,风险)
- Distribución
- Mantenimiento

发表于 CACM 2021──datasheet 是上游文档;modelo de tarjeta depende de la exactitud de la hoja de datos──

### Carteles de datos (Pushkarna et al., Google 2022)

模块化分层细节──三个 niveles reducidos:
- **Telescopic。**面向非专家的高层摘要──
- **Periscopic。**面向 ML practicantes de la capa media
- **Microscopic。**面向审计员详细特征级档档――

边界对象框架: diferentes lectores de los mismos documentos

### Carnetas de sistema

范围:端到端 AI 系统, incluyendo el modelo + 安全 + 部署上下文── capítulos generalmente incluyen:
- Capacidad de seguridad.
- Inyección rápida 防护。
- Exfiltración de datos 检测。
- Mantenerse en consonancia con los valores humanos declarados.
- 事件响应.

Sidhpurwala 2024 和 Meta 系统级透明度工作──"Bluprints of Trust" (arXiv:2509.20394) se formulará el Sistema de Tarjetas en forma de Modelo de Tarjetas en el nivel de la implementación.

### Desarrollo de las etapas 2024-2025

- **CardGen (Liu et al. 2024)。** A través de LLM Automatic Generating Model-Card; Report称在标准化米切尔 2019 字段上, que muchas tarjetas escritas por humanos 具有更高客观性──
- **下载相关性 (Liang et al. 2024)。**详细的模型卡与HF上最高29%下载率升高相关采用压力现在由市场驱动而不是仅仅由规则驱动而而已
- **Laminator (Duddu et al. 2024)。**通过硬件 TEE / 加密签名实现可验证证明允许 el modelo de tarjeta 携带索赔的证明, no sólo la reclamación en sí misma
- **Sustainability (Jouneaux et al. July 2025)。**增加碳、水和计算能耗足迹; 新兴 ISO 标准──
- **Regulatory cards。**Ley de IA de la UE ((Lección 24) Código de prácticas de la GPAI Transparencia 章节要求模型卡

### Está en la fase 18

Las lecciones 24-25 es la supervisión y la CVE 层――Ley 26 es la documentación 层――Ley 27 es el entrenamiento de la gestión de datos, es decir, la gestión de la hoja de datos――Ley 28 es el estudio de los sistemas vivos, las tarjetas de producción y la evaluación de los datos−−Ley 27 es la evaluación de los datos y la información sobre los datos.


```figure
an-card-scopes
```

## Usalo

`code/main.py`Se puede generar un modelo mínimo de tarjeta de juego, ficha de datos y tarjeta de sistema. Cada uno de ellos sigue la estructura de los capítulos de la normativa.

##  entregarlo

本课产 出  `outputs/skill-card-audit.md` Determinar un modelo de tarjeta, ficha de datos o tarjeta de sistema, que incluirá la cobertura del capítulo de auditoría, el grupo de valores y la existencia de pruebas verificables.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`◊ Revisar las tarjetas generadas―identificar los puntos de venta (en inglés: check-generated cards).

2. 扩展模型卡,加入跨两个人口统计群的量化分组分析 (también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido como "también conocido en el mundo").

3. 阅读Oreamuno et al. 2023 关于 0.3% 采用率的内容── propone una modificación estructural de las normas de la tarjeta modelo 为了提高道德考虑的采用率──

4. Laminator (Duddu et al. 2024) Utiliza TEEs  realizar verificabilidad prueba― diseñar un modelo-carta 字段, para llevar la prueba de ciertas evaluaciones,并描述验证人的角色―

5. Para usted un proyecto pasado o una falsa idea de implementación redactar una tarjeta de sistema, tarjeta de sistema, no tarjeta modelo)  Identificación del capítulo más alto del valor de un auditor tercero 

## 关键术语: "El hombre es un hombre"

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| Model Card | "the Mitchell card" | Mitchell et al. 2019 针对 ML models 的标准文档 |
| Datasheet | "the Gebru datasheet" | Gebru et al. 2018 针对数据集的标准文档 |
| Data Card | "the Pushkarna card" | Google 2022 模块化分层数据文档 |
| System Card | "the deployment card" | 包括安全栈在内的端到端 AI 系统文档 |
| Boundary object | "different readers, one doc" | Data Cards 框架：同一文档服务不同受众 |
| Verifiable attestation | "the Laminator attestation" | 附加到文档 claim 上的加密或 TEE 证明 |
| Sustainability field | "carbon / water footprint" | 2025 年出现的环境核算补充项 |

## 延伸阅读

- [Mitchell et al. — Model Cards for Model Reporting (arXiv:1810.03993, FAT* 2019)](https://arxiv.org/abs/1810.03993) 规范 tarjeta modelo
- [Gebru et al. — Datasheets for Datasets (CACM 2021, arXiv:1803.09010)](https://arxiv.org/abs/1803.09010) hoja de datos 论文
- [Pushkarna et al. — Data Cards (Google 2022)](https://arxiv.org/abs/2204.01075) Categorías de datos
- [Sidhpurwala et al. — Blueprints of Trust (arXiv:2509.20394)](https://arxiv.org/abs/2509.20394) Tarjeta de sistema  formalización
