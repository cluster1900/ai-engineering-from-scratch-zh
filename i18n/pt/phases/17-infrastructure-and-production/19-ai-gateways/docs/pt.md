# Portas de inteligência artificial  LiteLLM、Portkey、Kong AI Gateway、Bifrost

> Gateway  localiza o seu aplicativo e o seu provedor de modelo 之间──核心功能是供应商路由、fallback、retries、rate limiting、secret referências、observability、guardrails──2026年的市场分化:**LiteLLM**É MIT OSS, suporta mais de 100 provedores, OpenAI-compatível, mas em cerca de 2000 RPS 时会崩(8 GB de memória, já lançado benchmark apareceu falhas em cascata); mais adequado para Python、<500 RPS、dev/prototyping、**Portkey**定位为控制平面(guardrails、PII redação、jailbreak detection、audit trails),2026 年 3 月转为Apache 2.0 open-source,latency overhead 为 20-40 ms,production tier 为$49/mo。**Kong AI Gateway** 基于 Kong Gateway 构建 — Kong 在相同 12 CPUs 上的自有 benchmark：比 Portkey 快 228%，比 LiteLLM 快 859%；定价 $100/modelo/mês ((Plus tier 最多 5 个); se já estiver a usar o Kong, é adequado para empresa。**Bifrost**(Maxim AI)  retestes automáticos, suporte de backup configurável, OpenAI 429 时 fallback até Anthropic**Cloudflare / Vercel AI Gateways** gerenciado、zero-ops、basic retry。Residência de dados decide auto-host;Portkey 和 Kong 处于中间位置,提供OSS + opcional gerenciado。

**Type:** Learn
**Languages:** Python (stdlib, toy gateway-routing simulator)
**前置要求:**Fase 17 · 01 (Plataformas de LLM gerenciadas), Fase 17 · 16 (Routing de modelo)
**Time:** ~60 minutes

## Objectivo de aprendizagem
- 列举六个核心 gateway 功能 routeamento, retrocesso, retiros, limites de taxa, segredos, observabilidade, guarda-route)
- O programa vai incluir quatro gateways para 2026.
- 引用 Kong benchmark ((相比Portkey 228%,相比LiteLLM 859%),并解释为什么对 >500 RPS 很重要──
- Em casos de residência de dados e orçamento de operações, optar por auto-hosted ou gerenciado.

## 问题
Seu produto é chamado de OpenAI、Anthropic 和一个自主主机 Llama── cada fornecedor tem diferentes SDK、error model、rate limit 和 auth scheme──你需要 failover(如果 OpenAI 返回 429,就尝试 Anthropic)、单一凭证商店、统一可观察性,以及按租户的利率限制──

Na camada de aplicativos, reimplementar estes, permitirá que cada serviço com cada provedor 合──Gateway layer irá integrá-lo em um processo, fornecendo uma API (geralmente compatível com o OpenAI), re-desembolsar para cada provedor──

## 概念
### Seis características principais

1. **Provider routing** Colocar OpenAI, Antropic, Gemini, auto-hosting etc numa API 
2. **Fallback** 遇到429、5xx或质量失败 时,在别处重试──
3. **Retries** retrocesso exponencial, existem tentativas de
4. **Rate limits** 按租客,按密钥,按模型,按租客,按密钥,按模型,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按租客,按客,按租客,按租客,按按按按按按客,按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按按.
5. **Secret references** 运行时从库 拉取凭证(绝不放在app中) ⋅
6. **Observability** ATRITUTOS OTEL + GENAI(Fase 17 · 13)+ atribuição de custos。
7. **Guardrails** Reducção de PII, detecção de jailbreak, filtros de tópicos permitidos

### LiteLLM  MIT OSS, Python

- 100+ provedores  Compativel com o OpenAI  Configuração do roteador  Retorno  Observabilidade básica 
- Em Kong's benchmark 中约2000 RPS 时崩;8 GB de memória, em carga sustentada abaixo aparecem falhas em cascata;;
- 最适合: aplicativo Python ‧<500 RPS ‧dev/staging gateways ‧routing experimental‬
- Custo: OSS é $0; existem níveis livres de nuvem.

### Portkey  posicionamento do plano de controlo

- 截至 2026 年 3 月为Apache 2.0 OSS──Guardrails、PII redação、jailbreak detection、audit trails──
- Cada pedido de atraso é de 20 a 40 ms.
- Nível de produção é de US$ 49/mês, contém retenção + SLA.
- O melhor é que as indústrias regulamentadas precisam de barris de segurança e observabilidade.

### Kong AI Gateway  o jogo de escala

- Baseado em Kong Gateway 构建(成熟的API gateway 产品,lua+OpenResty) ⋅
- O Kong tem um índice de referência em 12 CPU equivalentes.
- Preço: $ 100/modelo/mês, Nível Plus, máximo 5 个.
- O melhor é: já está a ser usado em Kong;> 1000 RPS;

### Bifrost (Maxim AI)

- Re-intentos automáticos, apoio de backup configurável.
- O OpenAI 429 时 fallback até Anthropic é uma receita canônica.
- - Comércio.

### Cloudflare AI Gateway / Vercel AI Gateway

- Gerenciado, zero-operações, retestamento básico e observabilidade.
- O melhor é que você pode usar o aplicativo de JavaScript Edge-servindo em Cloudflare/Vercel.
- Em guarda-roupa e limites de taxa 方面不如 Kong/Portkey。

### Auto-hosted versus gerenciado

Residência de dados é um fator decisivo. Os cuidados de saúde e finanças são geridos em modo individual.

### Orçamento de latência

- LiteLLM: custo máximo típico é de 5 a 15 ms.
- Porto-chave: cabeça para cima 20-40 ms.
- Kong: sobrecarregar é de 3 a 8 ms.
- Cloudflare/Vercel:overhead 为 1-3 ms

A latência do gateway irá aumentar diretamente o TTFT. Para o TTFT P99 < 100 ms SLA, opção Kong ou Cloudflare. Para o P99 < 500 ms, qualquer coisa pode ser.

### Materia semântica de limite de taxa

简单的代币桶 可支到中度规模──Multi-tenant 需要滑窗 + blast allowance + per tenant tiering──LiteLLM 内置代币桶;Kong 内置滑窗;Portkey 内置层次──

### Gateway + observabilidade + roteamento compõe

Fase 17 · 13(observabilidade) + 16 ((modelo de roteamento) + 19 ((gateways)) pertencem à mesma camada da produção.

### Números que você deve lembrar

- LiteLLM: cerca de 2000 RPS 崩,8 GB de memória。
- Portkey: 20-40 ms em carga; desde 2026 年 3 月起 Apache 2.0。
- Kong: Por Portkey 快 228%, por LiteLLM 快 859%
- Preço Kong: $ 100 / modelo / mês, Nível Plus, máximo 5 个.
- Cloudflare/Vercel:edge 上 1-3 ms sobrehead


```figure
mx-gateway-fallback
```

## Use-o
`code/main.py`模拟 3 个供应商 在 429/5xx 注射 下的 gateway routing with fallback──报告延迟、退缩率 和 fallback hit rate──

## Entrega-o
本课产 出 `outputs/skill-gateway-picker.md` dar uma escala definida  postura de operações  conformidade  orçamento de atraso, escolher um portal 

## 练习
1. 运行 `code/main.py` Configuração OpenAI→Antropic→auto-hosted  Rate de erro do provedor em 5%
2. O seu SLA é TTFT P99 < 200 ms, linha de base é de 300 ms... quais gateways ainda estão dentro do orçamento?
3. Um cliente de saúde  requer auto-hosted + redação de PII + auditoria。 seleccionar OSS Portkey 还是 Kong。
4. Comparar LiteLLM com Kong: Qual o limite máximo RPS que a equipa deve mudar?
5. Para multi-tenant SaaS  design rate-limit policy: free tier, trial tier, paid tier, select token-bucket ou sliding-window?

## 关键术语
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
