# Puertas de acceso de IA  LiteLLM、Portkey、Kong AI Gateway、Bifrost

> Gateway  está en su aplicación y el proveedor de modelos 之间──核心功能是供应商路由、fallback、retries、rate limiting、secret referencias、observabilidad、guardrails──2026年的市场分化:**LiteLLM**Es el MIT OSS, soporta más de 100 proveedores, compatible con OpenAI, pero en aproximadamente 2000 RPS 时会崩(8 GB de memoria, ya se han publicado puntos de referencia en caso de fallas en cascada); mejor adaptado a Python、<500 RPS、dev/prototyping。**Portkey**定位为控制平面(guardrails、PII redacción、jailbreak detection、audit trails),2026 年 3 月转为Apache 2.0 open source,latency overhead为 20-40 ms,production tier为$49/mo。**Kong AI Gateway** 基于 Kong Gateway 构建 — Kong 在相同 12 CPUs 上的自有 benchmark：比 Portkey 快 228%，比 LiteLLM 快 859%；定价 $100/modelo/mes(Plus tier 最多 5 个); si ya estás usando Kong, es adecuado para la empresa。**Bifrost**(Maxim AI)  retrasos automáticos, soporte de retroceso configurable, OpenAI 429 时 fallback hasta Anthropic**Cloudflare / Vercel AI Gateways** administrado 零-ops 基本再试──Data residency decides self-host;Portkey 和 Kong 处于中间位置,提供 OSS + opcional administrado──

**Type:** Learn
**Languages:** Python (stdlib, toy gateway-routing simulator)
**前置要求:**Fase 17 · 01 (Plataformas de gestión de LLM), Fase 17 · 16 (Rutado de modelo)
**Time:** ~60 minutes

## El objetivo del aprendizaje
- 列举六个核心 gateway 功能 路由,倒退,retries,rate limits,secretes,observabilidad,guardrails)
- Se han creado cuatro puertas de acceso para 2026.
- 引用 Kong benchmark ((相比Portkey 228%,相比LiteLLM 859%),并解释为什么对 >500 RPS 很重要──
- En el caso de la residencia de datos y el presupuesto de operaciones, optar por ser alojado o administrado.

##  problemas
Su producto es OpenAI, Antropic y un Llama auto-hosted. Cada proveedor tiene diferentes SDK, modelo de error, límite de tasa y esquema de autor.

En la capa de aplicación, volver a implementar esto, permitirá que cada servicio se ajuste a cada proveedor. La capa de puerta de entrada lo integrará en un proceso, proporcionando una API (normalmente compatible con OpenAI), re-dividida a cada proveedor.

## 概念
### Seis características centrales

1. **Provider routing** colocar OpenAI, Antropic, Gemini, auto-hosted etc en una API 后面.
2. **Fallback** 遇到429、5xx o de calidad fallo 时,在别处重试──
3. **Retries** retroceso exponencial, ¿hay intentos de界──
4. **Rate limits** 按租客,按按按按按按租客,按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按
5. **Secret references** 运行时从库 拉取凭证(绝不放在app中) ⋅
6. **Observability** ATRITUTOS OTEL + GenAI(Fase 17 · 13) + atribución de costes。
7. **Guardrails** Reducción de PII, detección de jailbreak, filtros de temas permitidos

### LiteLLM  MIT OSS, Python

- 100+ proveedores  Compatible con OpenAI  Configuración del router  retroceso  observabilidad básica 
- En el índice de referencia de Kong, se producen fallas en cascada en la carga sostenida.
- La aplicación Python ∞<500 RPS ∞dev/estaging gateways ∞ routing experimental ∞
- Costo: OSS es $0; hay nivel libre de nube.

### Portkey  posicionamiento del plano de control

- 截至 2026 年 3 月为Apache 2.0 OSS──Guardrails、PII redacción、jailbreak detección、audit trails──
- Cada solicitud de la latencia de gastos generales es de 20-40 ms.
- El nivel de producción es de $49 / mes, incluye retención + SLA.
- Lo mejor es que las industrias reguladas necesitan barandillas de seguridad + observabilidad.

### Kong AI Gateway  el juego de la escala

- 基于 Kong Gateway 构建(成熟的 API gateway 产品,lua+OpenResty) 』
- Kong tiene un índice de referencia en el equivalente de 12 CPUs 上:比 Portkey 快 228%,比 LiteLLM 快 859%。
- Precio: $ 100 / modelo / mes, nivel más máximo 5 个.
- Lo mejor es que ya está en uso en Kong;> 1000 RPS;

### Bifrost (Maxim AI)

- Pruebas automáticas, apoyo de retroceso configurable.
- OpenAI 429 时 fallback hasta Anthropic es una receta canónica.
- 较新入口;comercial;;

### Puerta de entrada de IA de Cloudflare / Puerta de entrada de IA de Vercel

- Gestionado, operaciones cero, retraso básico y observabilidad.
- Lo mejor es que se ejecute en las aplicaciones de JavaScript de Edge de Cloudflare/Vercel.
- En los barandillas y los límites de velocidad 方面不如 Kong/Portkey。

### Auto-hosted vs administrado

Residencia de datos es un factor decisivo. Cuidado de la salud y finanzas 默认 self-hosted (LiteLLM o Portkey OSS o Kong)  Productos de consumo 默认 managed (Cloudflare AI Gateway) o de nivel medio (Portkey managed)  Híbrido: tenente regulado (HYBRID: tenant regulated)  auto-hosted,其他用途 (HYBRID: tenant regulated) 

### Presupuesto de la latencia

- LiteLLM: típico gasto aéreo 为 5-15 ms.
- Tenga en cuenta que el tiempo de la puesta es de 20 a 40 ms.
- Kong: sobrecarga de 3 a 8 ms.
- Cloudflare/Vercel: sobrecarga 为 1-3 ms

La latencia de la puerta de enlace aumentará directamente el TTFT. Para TTFT P99 < 100 ms SLA, opciones Kong o Cloudflare. Para P99 < 500 ms, cualquier cosa.

### Materia de semántica de límite de tasas

简单的 token-bucket 可支到中度规模──Multi-tenant 需要滑窗 + blast allowance + per tenant tiering──LiteLLM 内置 token-bucket;Kong 内置滑窗;Portkey 内置层──

### Puerta de entrada + observabilidad + enrutamiento componer

Fase 17 · 13(observabilidad) + 16 ((routing modelo) + 19 ((puertas)) en la producción pertenecen a la misma capa。 seleccionar un cover ̓s tool, o仔细把它们串起来:多数 2026 deployments 会组合 Helicone (helicone) observabilidad) o Portkey (guardrails) 与 Kong (scale), para ser utilizados en roles divididos。

### Números que debes recordar

- LiteLLM: aproximadamente 2000 RPS 崩,8 GB de memoria。
- Portkey: 20-40 ms por encima; desde 2026 年 3 月起 Apache 2.0
- Kong: Por el Portkey 快 228%, por el LiteLLM 快 859%―
- Precio de Kong: $ 100 / modelo / mes, nivel más máximo 5 个.
- Cloudflare/Vercel:edge 上 1-3 ms por encima de la carga.


```figure
mx-gateway-fallback
```

## Usalo
`code/main.py`模拟 3 个供应商 在 429/5xx inyección 下的 gateway routing with fallback──报告延迟、退缩率 和 fallback hit rate──

##  entregarlo
本课产 出  `outputs/skill-gateway-picker.md` dar una escala determinada, postura de operaciones, cumplimiento, presupuesto de latencia, seleccionar una puerta de entrada.

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Configurar OpenAI→Antropic→auto-hosted de fallback──En 5% de la tasa de error del proveedor, ¿cuál es la tasa de impacto esperada?
2. Su SLA es TTFT P99 < 200 ms, base para 300 ms... ¿Qué puertas de acceso están dentro del presupuesto?
3. Un cliente de atención médica  requirió auto-hosted + redacción de PII + auditoría。 seleccionar OSS de llave de puerto 还是 Kong。
4. Comparar LiteLLM con Kong: ¿Qué equipo debería mudarse al límite máximo de RPS?
5. ¿Por qué no se ha creado una política de límite de tarifas para múltiples inquilinos? ¿Por qué no se ha creado una política de límite de tarifas para múltiples inquilinos? ¿Por qué no se ha creado una política de tarifas de tipo libre?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Gateway | “API broker” | 位于 apps 和 providers 之间的 process |
| LiteLLM | “the MIT one” | Python OSS，100+ providers，2K RPS 时崩溃 |
| Portkey | “guardrails gateway” | Control plane + observability，Apache 2.0 |
| Kong AI Gateway | “the scale one” | 基于 Kong Gateway 构建，benchmark leader |
| Bifrost | “Maxim's gateway” | Retries + Anthropic fallback recipe |
| Cloudflare AI Gateway | “edge managed” | Edge-deployed managed gateway，zero-ops |
| PII redaction | “data scrub” | 发送到 model 前进行 Regex + NER mask |
| Jailbreak detection | “prompt injection guard” | 对 user input 的 Classifier |
| Audit trail | “regulated log” | 每次 LLM call 的 immutable record |
| Token-bucket | “simple rate limit” | 基于 refill 的 rate limiter |
| Sliding-window | “precise rate limit” | Time-windowed rate limiter；fairness 更好 |

## 延伸阅读
- [Kong AI Gateway Benchmark](https://konghq.com/blog/engineering/ai-gateway-benchmark-kong-ai-gateway-portkey-litellm)
- [TrueFoundry — AI Gateways 2026 Comparison](https://www.truefoundry.com/blog/a-definitive-guide-to-ai-gateways-in-2026-competitive-landscape-comparison)
- [Techsy — Top LLM Gateway Tools 2026](https://techsy.io/en/blog/best-llm-gateway-tools)
- [LiteLLM GitHub](https://github.com/BerriAI/litellm)
- [Portkey GitHub](https://github.com/Portkey-AI/gateway)
- [Kong AI Gateway docs](https://docs.konghq.com/gateway/latest/ai-gateway/)
