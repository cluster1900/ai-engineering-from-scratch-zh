# LLM Routing Layer  LiteLLM, OpenRouter, Portkey

> Provider lock-in 代价高昂── diferentes ferramentas-chamando 工作负载适合不同模型── Routing gateway 提供统一的API 表面、重试、failover、成本跟踪和 guardrails──2026年有三种主流形态:LiteLLM(开源、自托管)、OpenRouter(托管 SaaS)、Portkey(生产级,2026年 3月开源)──本课会说明决策标准,并演示一个 stdlib routing gateway──

**Type:** Learn
**Languages:** Python (stdlib, routing + failover + cost tracker)
**Prerequisites:** Phase 13 · 02 (function calling), Phase 13 · 17 (gateways)
**Time:** ~45 分钟

## Objectivo de aprendizagem
- 区分自托管、托管和生产级路由 选项──
- 实现 uma cadeia de retorno, em provedor 失败时按定义好的优先级顺序重试──
- Seguir os fornecedores de custos de solicitação única e utilização de tokens.
-  para uma determinada produção, fazer uma escolha entre LiteLLM、OpenRouter e Portkey

## 问题
Roteamento de fornecedores  importante cenário:

1. **成本。**Claude Sonnet's cost é 3 vezes o de Haiku.

2. **Failover。**A OpenAI aparece numa falha de tempo. Todos os pedidos são falhados.

3. **延迟。**实时聊天 UI 需要快速的时间到第一代标语――批量摘摘器不需要――按延迟 SLA 路由──

4. **合规。**Os utilizadores da UE devem permanecer na UE 区域内〜按区域路由〜

5. **实验。**Em simultâneo trabalho, dois modelos são feitos A/B.

Para cada integrado escrever estes lógica muito repetido. Routing gateway fornece uma API compatível com o OpenAI,并处理其余部分.

## 概念
### Proxy compatível com o OpenAI 形态

Todos usam o formato OpenAI.`/v1/chat/completions`, aceitar o esquema OpenAI, e internar em representação de Anthropic / Gemini / Cohere / Ollama / 任何后端──客户端不需要关心──

### Nome de modelo

Seu código não escreve`claude-3-5-sonnet-20251022`- Não , escrevi .`our_smart_model` Gateway vai usar alias 映射到真实模型──当Anthropic 发布Claude 4 时,你在服务端修改 alias;

### Cadeias de retorno

```
primary: openai/gpt-4o
on 5xx: anthropic/claude-3-5-sonnet
on 5xx: google/gemini-1.5-pro
on 5xx: refuse
```

Gateway em configuração define estes.

### Caching semântico

O mesmo ou quase igual a mesma prompt em cache, em vez de um provedor de acesso.

### Ferras de guarda

网关级:

- **PII redaction.**Em envio de imediato, antes de executar Regex ou baseado em ML de tratamento.
- **Policy violations.**Rejeita incluir conteúdo proibido.
- **Output filters.**清理完成 中中的泄漏内容──

Portkey e Kong são inseridos em uma rede de proteção de segurança.

### Limite de taxa por chave

Uma chave API = uma equipe. O orçamento por chave prevê o consumo de uma equipe de quota compartilhada. A maioria dos gateways apoia isso.

### Auto-hosted e administrado

| Factor | LiteLLM (self-hosted) | OpenRouter (managed) | Portkey (production) |
|--------|----------------------|----------------------|----------------------|
| Code | 开源，Python | 托管 SaaS | 开源（2026 年 3 月）+ 托管 |
| Setup | 部署一个 proxy | 注册 | 二者均可 |
| Providers | 100+ | 300+ | 100+ |
| Billing | 你自己的 key | OpenRouter credits | 你自己的 key |
| Observability | OpenTelemetry | Dashboard | 完整 OTel + PII redaction |
| Best for | 想要完全控制的团队 | 快速原型开发 | 有合规需求的生产环境 |

Quando você tem SRE  equipe e quer ter o direito de proprietário de dados,LiteLLM 胜出. Quando você quer um único subscrição e não quer manter a infraestrutura, OpenRouter 胜出.

### Seguimento dos custos

Cada pedido é feito .`provider`- Não.`model`- Não.`input_tokens`- Não.`output_tokens`△乘以模型、按 Token 的价格(从门户维护的价格表 拉取) △按用户 / 团队 / 项目聚聚合──

### MCP mais roteamento

Gateway pode ser simultaneamente routeado por LLM 调用和MCP sampling requests──当 sampling request的模型Preferências 偏好某特定模型时,gateway 会转换到正确后端──这是也是Phase 13 · 17(MCP gateway) 和本课路由 gateway 有时会并成一个服务的地方──

### Estratégias de roteamento

- **Static priority.**Primeiro da lista, saído errado.
- **Load balancing.**- Rondas ou agravantes.
- **Cost-aware.**选择满足延迟 / 质量要求的最低成本模型──
- **Latency-aware.**选择过去 N 分钟内最快的模型──
- **Task-aware.**O classificador rápido irá codificar 路由到一个模型, 路由到另一个模型, 路由到另一个模型, 路由到另一个模型, 路由到另一个模型, 路由到另一个模型, 路由到另一个模型, 路由到另一个模型, 路由到另一个模型, 路由到另一个模型, 路由到另一个模型, 路由到另一个模型, 路由到另一个模型, 路由到另一个模型, 路由到另一个模型, 路由到另一个模型, 路由到另一个模型, 路由到一个模型, 路由到一个模型, 路由到一个模型, 路由到一个模型, 路由到一个模型, 路由到一个模型, 路由到一个模型,


```figure
tp-router-failover
```

## Use-o
`code/main.py`Usar cerca de 150 行 implementar um gateway de roteamento: aceitar solicitações em forma de OpenAI, transferir para cada servidor, executar cadeia de fallback de prioridade, acompanhar o custo de pedido único, e executar o passaporte de redação de PII de entrada e aplicação. Usar três cenários para executá-lo: pedido normal, interrupção do servidor principal, falha de dados, vazamento de PII, captura.

需要关注:

- `ROUTES`dict:alias -> 按优先级排序的具体供应商列表──
- O ciclo de regresso vai voltar a tentar em 5xx.
- O rastreador de custos irá utilizar o token multiplicando a taxa de cada modelo.
- O editor de PII 会在转发前清理形状类似SSN的模式.

## Entrega-o
本课会产出 `outputs/skill-routing-config-designer.md` dar um perfil de carga de trabalho (延迟、成本、合规), esta habilidade 会選 LiteLLM / OpenRouter / Portkey,并生成路由配置──

## 练习
1. 运行 `code/main.py` Caso de interrupção de serviços; confirmação de retorno de serviços para o segundo fornecedor, e o custo é corretamente atribuído.

2. 添加语义缓存:prompt 的 SHA256 作为搜索键;缓存击立即返回──测量重复调用成本节省──

3. 添加一个快速分类器,将 `"code ..."`- Não. - Não. - Não.`"summarize ..."`O alias de "pronto" é "rou由到偏向速度".

4. design por equipa orçamento: cada equipa tem um limite de gastos mensal; alcançar o limite de gastos;

5. E também, a sua versão de "LiteLLM"",OpenRouter" e "Portkey" foi publicada em "LiteLLM", em "LiteLLM", em "OpenRouter" e "Portkey" em "Portkey" (em português).

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Routing gateway | "LLM proxy" | 位于多个 provider 前方的统一 API 表面层 |
| OpenAI-compatible | "Speaks the OpenAI schema" | 接受 `/v1/chat/completions` shape，并转换到任意 backend |
| Model alias | "our_smart_model" | 你代码中的名称，由 gateway 映射到具体模型 |
| Fallback chain | "Retry list" | 失败时按顺序尝试的 provider 列表 |
| Semantic caching | "Prompt-embedding cache" | Key 是 prompt 的 Embedding；近似重复内容共享一次 cache hit |
| Guardrails | "Input/output filters" | 脱敏 PII，拒绝 policy violations |
| Per-key rate limit | "Team budget" | 作用域限定到 API key 的 quota |
| Cost tracking | "Per-request spend" | 聚合 Token 使用量 x 每个模型的价格 |
| LiteLLM | "The open proxy" | 可自托管的 OSS routing gateway |
| OpenRouter | "The managed SaaS" | 基于 credit 计费的托管 gateway |
| Portkey | "The production option" | 开源 + 托管，内置 guardrails |

## 延伸阅读
- [LiteLLM — docs](https://docs.litellm.ai/) Autotestão de roteamento
- [OpenRouter — quickstart](https://openrouter.ai/docs/quickstart) 托管 routing SaaS
- [Portkey — docs](https://portkey.ai/docs) 带有护的生产级路由
- [TrueFoundry — LiteLLM vs OpenRouter](https://www.truefoundry.com/blog/litellm-vs-openrouter) 决策指南
- [Relayplane — LLM gateway comparison 2026](https://relayplane.com/blog/llm-gateway-comparison-2026) fornecedor 调研
