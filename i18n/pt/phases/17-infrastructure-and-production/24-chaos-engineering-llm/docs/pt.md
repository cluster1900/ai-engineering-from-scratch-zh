# LLM Produção de Engenharia do Caos

> Até 2026, a direção para os LLMs 已成为一门独立实践. 已成为一门独立实践. 已成为一门独立实践. 已定义的SLI/SLO的运行实验前置条件:已定义的SLI/SLO的运行条件:已定义的SLI/SLO的运行条件:已定义的SLI/SLO的运行条件:已定义的SLI/SLO的运行条件:已定义的SLI/SLO的运行条件:已定义的SLI/SLO的运行条件:已定义的SLI/SLO的运行条件:已定义的SLI/SLO的运行条件:已定义的SLI/SLO的运行条件:已定义的SLI/SLO的运行条件:已定义的SLI/SLO的运行条件:已定义的SLO的运行条件:已定义的SLI/SLO的运行条件:已定义的SLI/SLO的运行条件:已定义的SLI/SLO的运行条件:已定义的SLI/SLO的运行条件:已定义的SLO的运行条件:已定义的SLO的运行条件:已定义的SLO的SLO的运行条件:已定义的SLO的运行条件:已定义的SLO的运行条件:已定义的SLO的运行条件:已定义的SLO的运行条件:已定义的SLO的运行条件:已定义的SLO的运行条件:已定义的SLO的运行条件:已定义的SLO的标准标准标准标准标准的标准的标准标准标准的标准的标准的标准的标准的标准的标准的标准的标准的标准的标准的标准的标准的标准的标准的标准的标准的标准的标准的标准的标准的标准的标准的标准的标准的标准的标准的标准的标准的标准的标准是标准的标准的标准的标准,标准的标准的标准的标准的标准的标准的标准的标准的标准的标准的标准是标准的标准的标准的标准的标准的标准的标准的标准的标准的标准的标准的标准的标准,标准的标准的标准的标准的标准的标准的

**类型：**- aprendizagem
**语言：**Python, jogador de experimento de caos)
**前置条件：**Fase 17 · 23(SRE para IA),Fase 17 · 13(Observabilidade)
**时间：**Cerca de 60 minutos

## Objectivo de aprendizagem

- Explicar porque saltar qualquer um vai destruir esta prática.
- - desenhar quatro planos de controlo, alvo, segurança e observabilidade e entrar no ciclo de feedback do SLO.
- 枚举五个LLM-específicos experimentos (memória sobrecarga, falha da rede, interrupção do fornecedor, instante malformado, tempestade de despejo de KV)
- 根据 stack 选择工具  Harness、LitmusChaos、Chaos Mesh。

## 问题

A pilha de Chaos de testes tradicionais já está muito madura. A pilha de LLM adicionou novos modos de falha. Um prompt de token 4K com caracteres venenosos vai permitir que o tokenista fique em 12 segundos.

Estes não aparecem em testes unitários. A Engenharia do Caos é um método para descobrir antes que os usuários os encontrem.

## 概念

### Preconceito

Se não houver o seguinte, não faça caos na produção:

1. **SLI/SLO** 已定义服务水平指标和目标── já definidos indicadores de nível de serviço e objectivos
2. **Observability** rastreos, métricas, logs,并连接到仪表板──
3. **Automated rollback** Fase 17 · 20 Rolo de volta à política de bandeira
4. **Runbooks** 结构化,Fase 17 · 23。
5. **On-call**Alguém é responsável pela resposta.

A falta de qualquer um significa que o caos se tornará um verdadeiro incidente.

### Quatro aviões + feedback

**Control plane** programação de experimentos ((Litmus workflow、Chaos Mesh schedule、Harness UI) 。

**Target plane** serviços, pods, nós, balançadores de carga, armazéns de dados,

**Safety plane** interruptor de apagão, janelas de supressão, limites de raio de explosão, portões de erro orçamental,

**Observability plane** 常规 métricas + correlação trace-ID, para distinguir falhas induzidas pelo caos 和 natural falhas。

**Feedback loop** 发现结果反到 SLO ajuste, atualizações do livro de execução, correções de código.

### Os guardrails são obrigatórios .

- **Burn-rate alert**Se o orçamento de erro diário exceder o esperado 2x, então suspender a experiência.
- **Suppression windows**Durante a experiência, no raio da explosão, são emitidos alertas de não experiência.
- **Trace-ID correlation**Todos os erros induzidos pela experiência têm uma etiqueta, deixe-se ligar para poder voltar.

### 五个 LLM-específicos experimentos

1. **Memory overload**                                                                                                                                                                                                                                                              

2. **Network failure** 切断 inference gateway 连接与供应商 之间的连接──观察:fallback 是否在 SLA 内生效?(Fase 17 · 19)

3. **Provider outage simulation** OpenAI 100% 返回 429── observar: routing 是否 failover到Antropic?

4. **Malformed prompt** Inject into let tokenizer 卡住的有效载荷 (por exemplo, unicode profundamente aninhado 巨型UTF-8代码点) 观察:单个请求 是否会锁死一个工人?

5. **KV eviction storm**                                                                                                                                                                                                                                                              

### Cadência

- **每周** Durante a fase de execução de pequenos experimentos canários, também é possível durante a produção de 5% 流量上运行──
- **每月** 针对特定场景 安排游戏日;跨团队参与;后死――
- **每季度** Auditoria de resiliência entre equipes; atualização do mapa de dependência。

### Ferramentas

- **Harness Chaos Engineering** 商业工具;recomendações de experiências derivadas da IA;descálera de rádio de explosão;integração de ferramentas de MCP。
- **LitmusChaos** CNCF graduado; baseado no fluxo de trabalho Kubernetes。
- **Chaos Mesh** Capa de areia CNCF; CCRD nativo de Kubernetes 风格。
- **Gremlin** 商业工具; amplo apoio
- **AWS FIS**- Não .**Azure Chaos Studio** Ofertas em nuvem gerenciadas。

### Desde pequeno

Primeiro experimento: em estabilização de fluxo, um pod-kill, uma réplica de decodificação, observação de redirecionamento e recuperação, se ele puder funcionar e parecer seguro, ele irá ser atualizado para o caos da rede.

Primeiro experimento específico do LLM: Injectar um provedor 429, durou 5 minutos. Observar o retrocesso.

### Você deve lembrar-se de números

- Quatro planos: controlo, alvo, segurança, observabilidade.
- Pausa de taxa de queimação: pré-espectos de queimação de orçamento diário de 2x:
- Cadência: canário semanal, dia de jogo mensal, auditoria trimestral.
- 五个 LLM experiments: memória, rede, fornecedor, prompt malformado, KV storm.


```figure
i4-chaos-guard
```

## Use-o

`code/main.py`Use safety plane gates 模拟三个混乱实验──报告哪些实验 会触发燃烧率中断──

## Entrega-o

本课会生成 `outputs/skill-chaos-plan.md`△ dado estaca e maturidade, seleção de três experimentos e ferramentas.

## 练习

1. 运行 `code/main.py`Qual experimento desencadeou o portão de taxa de queimação, porquê?
2. Para um serviço RAG baseado em vLLM design 前五个混乱实验──包括成功标准──
3. O teu alerta de queima de água para um experimento. Como é que sabes se a causa é caos ou natural?
4. 论证 Chaos  deveria funcionar na produção, ou apenas na fase de execução...
5. Há três modos de falha específicos do LLM que não podem ser recuperados.

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| SLI / SLO | "service targets" | Indicator + objective；必需前置条件 |
| Blast radius | "scope" | 受 experiment 影响的 services / users 集合 |
| Burn-rate alert | "budget gate" | 当 error-budget burn rate > 预期的 2x 时触发 |
| Game day | "monthly drill" | 计划好的 cross-team chaos exercise |
| LitmusChaos | "CNCF workflow" | Graduated CNCF Kubernetes chaos tool |
| Chaos Mesh | "CNCF CRD" | CNCF sandbox Kubernetes-native chaos |
| Harness CE | "commercial AI-assisted" | 带有 AI recommendations 的 Harness chaos |
| Malformed prompt | "tokenizer bomb" | 会让 tokenization 卡住的输入 |
| KV eviction storm | "preemption cascade" | 大规模 eviction 触发 re-prefills |

## 延伸阅读

- [DevSecOps School — Chaos Engineering 2026 指南](https://devsecopsschool.com/blog/chaos-engineering/)
- [Ankush Sharma — Observability for LLMs（书）](https://www.amazon.com/Observability-Large-Language-Models-Engineering-ebook/dp/B0DJSR65TR)
- [LitmusChaos（CNCF）](https://litmuschaos.io/)
- [Chaos Mesh（CNCF）](https://chaos-mesh.org/)
- [Harness Chaos Engineering](https://www.harness.io/products/chaos-engineering)
- [AWS FIS](https://aws.amazon.com/fis/)
