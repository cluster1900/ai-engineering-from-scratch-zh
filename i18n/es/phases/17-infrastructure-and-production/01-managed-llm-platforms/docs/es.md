# 托管 LLM 平台  Bedrock, Vertex AI, Azure OpenAI

> Tres hiperescaladores, tres estrategias diferentes. AWS Bedrock es un modelo de mercado  Claude, Llama, Titan, Stability, Cohere situado en una misma API 后后.Azure OpenAI es una exclusiva OpenAI 合作关系, además de unidades de rendimiento provistas (PTUs) de capacidad especial.

**Type:** Learn
**语言：**Python (stdlib, comparador de costos y latencia de juguete)
**前置要求：**Fase 11 (Ingeniería de LLM), Fase 13 ( Herramientas y Protocolos)
**Time:** ~60 minutes

## El objetivo del aprendizaje
- Cuenta con tres estrategias de plataforma: mercado vs exclusiva vs gemini-first), y cada estrategia se adapta a un ejemplo de uso de producto.
- Explicar las unidades de rendimiento proporcionadas (PTU) en Azure OpenAI 给你买到了什么,以及为什么 on-demand Bedrock en 405B 规模下通常读数会慢约25 ms──
- 绘制每个平台的 FinOps 归因界面(Bedrock Application Inference Profiles vs Vertex proyecto por equipo vs Azure scopes + PTU reservas)
- 写下一条两供应商最低策略,并解释为什么单供应商锁定是2026年代价高昂的错误――

##  problemas
Usted ha elegido para su producto Claude 3.7 Sonnet. Ahora usted necesita proporcionar servicio. Puede utilizar directamente la API Anthropic, también puede utilizar a través de AWS Bedrock, o a través de un gateway.

Más profundo problema es el catálogo. Si necesitas usar Claude、Llama 和 Gemini en el mismo producto, entonces no puedes comprarlos desde un solo lugar, a menos que ese lugar sea Bedrock加 Vertex加 Azure OpenAI──hiperscaler no es intercambiable   cada uno de ellos hace diferentes apuestas a quien posee la capa del modelo―.

Este curso se trata de tres tipos de apuestas, diferencias de latencia, diferencias de finales y riesgos de bloqueo.

## 概念
### Tres estrategias

**AWS Bedrock** mercado de la información. Claude (Antropic) ✓ Llama (Meta) ✓ Titan (AWS primera parte) ✓ Estabilidad (imagen) ✓ Cohere (embeddings) ✓ Mistral, así como imagen 和 embedding 子目录。 una API, una IAM 界面, una CloudWatch exportación。 Betrock ✓ Bedsrock ✓ Bet is,客户想要可选性,胜过想要单一模型。

**Azure OpenAI** Asociación exclusiva― obtuvo GPT-4 / 4o / 5 / o serie  DALL·E、Whisper, así como ajuste fino del modelo de OpenAI                                                                                                                                                                                                                                           

**Vertex AI** Gemini primero,其余第二──Gemini 1.5 / 2.0 / 2.5 Flash y Pro,加上 Model Garden(tercer partido)──Vertex 的押注是多型式 长上下文  1M-token Gemini context 是差异化因素──

### Latencia  Diferencia bajo la escala

Análisis Artificial 运行持续基准──在等效的 Llama 3.1 405B 部署上(shared on demand),Azure OpenAI mediana latencia de primer token 约为50 ms;Bedrock 约为75 ms── esta diferencia no es AWS 失败 它是容量模型差异──Azure 销售PTUs (Provisioned Throughput Units),为你的租户 预留 GPU 容量──Bedrock 的等价格──Bedrock 的等价格──也存在,但每单位 起价约$21/小时,大多数共享客户仍然停留在需求──

Capacidad compartida a pedido 会与所有其他客户的流量竞争──Capacidad dedicada 不会──Si su producto SLA es TTFT < 100 ms en P99, entonces usted debe comprar PTUs de Azure, comprar Bedrock Provisioned Throughput, o aceptar un embrazo de la potencia──

### Producción proporcionada 经济性

PTUs de Azure: un bloque de cálculo de inferencia pre-reservado. Para la carga de trabajo predecible, en comparación con la demanda, el máximo ahorro es de aproximadamente el 70%.

Bedrock Provisioned Throughput: según el modelo y la región, cada hora $21-$50― matemáticas similares  break-even 大约在峰值利用的一半──需要月 commitment──

Capacidad de suministro vertical  según Gemini SKU  Venta; Precio  因模型和地区 而异, 公开宣传更少──

### FinOps 界面  Verdaderos factores de diferenciación

**Bedrock Application Inference Profiles**Es el mercado más puro de la industria.`team`¿Qué es esto?`product`¿Qué es esto?`feature` Marca el perfil; deja que todos los modelos se adapten a través de él; CloudWatch  no necesita procesamiento posterior  desplegación de costes ⋅ es un nuevo crecimiento en el año 2025, todavía es el más pequeño de los hiperescalado original capacidad ⋅

**Vertex**归因是项目-per-team加标签-en todas partes. Tú haces que cada equipo se forme para un proyecto GCP, en cada recurso, y en BigQuery Billing Export + DataStudio hacer un rollo.

**Azure**Dependiendo de los escopo de suscripción/grupo de recursos + etiquetas,并把 PTU reservas 作为一等成本对象──Tags de grupos de recursos 继承, en lugar de de las solicitudes 继承, por lo que por solicitud 归因需要 应用洞察的定制度,或一个会写入头条的门户──

Modelo es:Bedrock Original生最干净,Vertex 通过BigQuery 最灵活,Azure 最不透明,除非你做仪器──

### El bloqueo es un riesgo de 2026

Cuando un modelo domina, el compromiso de hiperescalada única también puede ser aceptado. En 2026, la primera línea de cada mes está en movimiento. Una temporada es Claude 3.7, la siguiente temporada es Gemini 2.5, la siguiente temporada es GPT-5.

El modelo de adopción de los equipos efectivos es: para cualquier producto clave llamada de LLM, al menos con el uso de dos proveedores mínimo. Bedrock加 Azure OpenAI es un conjunto habitual.  Desde una plataforma a Claude, desde otra plataforma a GPT, entre ellos falloover, utilizando el mismo gateway.

### Residencia de datos, BAAs y industria de la regulación

Bedrock: la mayoría de las regiones  proporcionan BAAs; puntos finales de VPC; barrancas 常见 fintech 默认选项。
Azure OpenAI:HIPAA、SOC 2、ISO 27001; residencia de datos de la UE;
Vertex:HIPAA, GDPR, residencia de datos por región, Google Cloud y la pila de cumplimiento de datos.

Los datos de los usuarios de Internet se pueden utilizar para comprobar si los datos de los usuarios de Internet son accesibles o no.

### Debes recordar el número

- Azure OpenAI en Llama 3.1 405B 等效场景 bajo mediana TTFT: ~ 50 ms(utilizando PTUs)
- Camacho bajo demanda 中位 TTFT: ~ 75 ms。
- Capacidad de transmisión de la cama: por unidad $21-$50/hora.
- Reto de equilibrio de las PTU de Azure: ~ 40-60% de utilización sostenida.
- Al mismo tiempo, el consumo de energía en el mercado de la Unión Europea se ha reducido en un 70% en comparación con el consumo de energía en el mercado de la Unión Europea.


```figure
i4-platform-lanes
```

## Usalo
`code/main.py`Se trata de un proyecto de investigación que se desarrolla en el mercado de la tecnología de la información y de la información.

##  entregarlo
本课会生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-managed-platform-picker.md` Proporcionar un perfil de carga de trabajo (necessity model, TTFT SLA, volumen diario, requisitos de cumplimiento), recomendar la plataforma primaria, el retroceso y el plan de instrumentación de FinOps.

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Para el modelo de clase 70B, Azure PTU en qué uso sostenido es inferior a la demanda?
2. Tu producto necesita Claude 3.7 Sonnet y GPT-4o... diseñar un despliegue de dos proveedores... ¿quién pone a cual hiperescalador, ¿qué puerta de entrada, ¿qué política de fallas es?
3. Una plataforma de salud 客户要求BAAs、US-East data residency 和 sub-100ms P99 TTFT── seleccionar una plataforma, y utilizar tres funciones específicas para obtener resultados.
4. ¿Cuándo encontraras el culpable? ¿Cuánto tiempo tardarás en encontrar el culpable?
5. 阅读Azure OpenAI 和 Bedrock precios páginas。 Para 100M-token/mes Claude carga de trabajo, ¿qué es más conveniente  directos API Antropic、Bedrock a pedido, o Bedrock Provisioned Throughput?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Bedrock | "AWS LLM service" | 跨 Claude、Llama、Titan、Mistral、Cohere 的模型 marketplace |
| Azure OpenAI | "Azure's ChatGPT" | 位于 Azure datacenters 中、带企业控制能力的独家 OpenAI 模型 |
| Vertex AI | "Google's LLM" | 以 Gemini 为先的平台，Model Garden 用于 third-party models |
| PTU | "dedicated capacity" | Provisioned Throughput Unit — 预留 inference GPUs，按小时定价 |
| Application Inference Profile | "Bedrock tagging" | 带 tags 的 per-product cost/usage profile，CloudWatch-native |
| Model Garden | "Vertex catalog" | Vertex AI 的 third-party model section，独立于 Gemini |
| Two-provider minimum | "LLM redundancy" | 让每条关键 LLM 路径跨 ≥2 个 hyperscaler 运行的策略 |
| BAA | "HIPAA paperwork" | Business Associate Agreement；PHI 所必需；三者均提供 |
| Abuse monitoring | "the log watcher" | provider-side safety scan，作用于 prompts/outputs；enterprise 可 opt-out |

## 延伸阅读
- [AWS Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/) 权威 tarifa tarjeta 和 Precio de rendimiento provisto。
- [Azure OpenAI Service Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/) PTU economía y tarjetas de tasa
- [Vertex AI Generative AI Pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing) Tías Gemini y recargos de jardín modelo。
- [Artificial Analysis LLM Leaderboard](https://artificialanalysis.ai/)  跨供应商持续延迟和吞吐量基准──
- [The AI Journal — AWS Bedrock vs Azure OpenAI CTO Guide 2026](https://theaijournal.co/2026/03/aws-bedrock-vs-azure-openai/) marco de decisión empresarial¬¬
- [Finout — Bedrock vs Vertex vs Azure FinOps](https://www.finout.io/blog/bedrock-vs.-vertex-vs.-azure-cognitive-a-finops-comparison-for-ai-spend) Mecánica de atribución lado a lado。
