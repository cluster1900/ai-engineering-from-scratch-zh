# AI SRE  Multi-Agent 事件响应、Runbooks、预测性检测

> AI SRE  através do RAG  Utilizando dados de infraestrutura DATA 日志、runbooks、サービス拓) de LLM, vem de análise de atividades 文档记录和协调阶段。 2026 ano modelo de estrutura é multi-agente orquestração  专门代理人 日志、指标、runbooks) pelo supervisor 协调;AI 提出假设和询问,人类批准需要判断的决策。 Dog Bits AI 和 Azure SRE Agent 将其作为托管产品提供──Runbooks 正在发展:NeuBird Hawkeye 使用对抗评估◆ 2 modelos analisam o mesmo incidente;一致 = 信,不一致 = 不确定; 运行会在团队测试后持续保留──Auto-remediation 提提提提提提提提提提提提提提提提提提提提提提提提提提提: 建议, 批准人类企业预备全行动范围 非常紧️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

**Type:** Learn
**Languages:** Python (stdlib, toy multi-agent incident triage simulator)
**Prerequisites:** Phase 17 · 13 (Observability), Phase 17 · 24 (Chaos Engineering)
**Time:** ~60 minutes

## Objectivo de aprendizagem
- 画出多代理 AI SRE 架构图:supervisor + agentes especializados (日志、指标、runbooks) + portal de aprovação humana。
- 解释为什么自动补救的范围很窄 (também é muito grande) 重启 pod,重启部署 (re-deploy),而不是很宽 (re-architect service) 
- 模式 (Não-Velho-Velho-Oye): dos modelos concordantes = 置信;不一致 = escalada。
- 引用 MIT 89% detecção precoce 结果,以及 operational constraint:没有动作的预测只是仪表板──

## 问题
Um engenheiro em linha de chamada recebeu um aviso na manhã de 3 horas: Checkout  中的错误率很高──他们检查了 Datadog、Loki、三跑簿、部署日志──30分钟后, eles perceberam que a causa raiz é o aumento do cache KV 导致 vLLM OOM── eles reiniciaram o pod; erro desapareceu──

Até 2026, este tipo de pesquisa pode ser automatizada. De acordo com o serviço de agregação de dados.

完全自主修复是另一个问题──Restart pod:安全──Scale GPU pool:如果政策 允许则安全──Rearchitett the service:绝对不行──关键原则是划清这条狭窄边界──

## 概念
### Arquitetura multi-agente

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

Supervisor irá dispor o incidente em sub-queries. Agentes especializados têm acesso a ferramentas.

### Ámbito de aplicação da remediação automática

**Safe (narrow)**:reboot pod、revert deployment específico、en pré-aprovado bord bord bord bordin-in scale pool、activação pré-aprovado flag função。

**Not safe (broad)**A nova tecnologia é a tecnologia que permite a criação de novos sistemas de informação e comunicação.

Qualquer pessoa que o vende e esqueça está em excesso de compromisso. Com a AI SRE crescendo, a segurança se expandirá, mas a fronteira é real.

### Não é um problema.

 Dois modelos analíticos independentes do mesmo incidente Se eles concordam com a causa raiz , a confiança é maior Se eles não concordam, então, com duas hipóteses visíveis, escalada para o ser humano Modelo simples, mas é um mecanismo eficaz de causas raizes alucinadas

### Memória operacional

团队人员流动是传统SRE的隐形杀手 部落知识 会流失──AI SRE vai guardar runbooks + post-mortems 存入 vector DB;agentes 会在每一个新事件中检索──当新工程师加入时,AI 拥有完整历史──

### Previsão de incidentes

MIT 2025 Estudos: no conjunto de testes, baseado em histórico DATAGUE 温度 API 错误模式训练的LLM, durante os apagões 发生前 10-15分预测到了其中89%──

现实检查:没有动作的预测只是仪表板――操作问题是:当我们预测到时,要做什么?Preventive drain?Pager?Auto-scale?答案取决于具体政策──

### Produtos em 2026

- **Datadog Bits AI** Datadog 内部的托管 SRE copilot──
- **Azure SRE Agent**- Nativo de Azul.
- **NeuBird Hawkeye** avaliação adversária + memória operacional。
- **PagerDuty AIOps** triagem + deduplicação。
- **Incident.io Autopilot** Comandante de incidentes + coordenação。

### Livros de execução como código

Runbooks de Confluence 页面演进为带有结构化章节 ([[symptom]], hipotese, verificação, acto]]) 版本化标记下降──结构化 runbooks 能提供更好的RAG retrieval──启动任何AI-SRE rollout 时,都应先把非结构化 runbooks 转换成结构化格式──

### Números que você deve lembrar

- MIT detecção precoce: 89% de interrupções,10-15 minutos de tempo de liderança.
- Triamento multi-agente:supervisor +(日志、指标、runbooks) + humano。
- Configuração de remediação automática segura: reinicialização do módulo, reimplementação, em escala de limitações.
- Avaliação adversária: dois modelos independentes; acordo = confiança。


```figure
i4-incident-agents
```

## Use-o
`code/main.py`模拟多代理 triage:log agent 找到错误,metric agent 找到 CPU spike,runbook agent 匹配到已知问题──supervisor para as hipóteses 排序──

## Entrega-o
本课会生成 `outputs/skill-ai-sre-plan.md` Baseado no volume de incidentes em curso, maturidade da equipe, desenhar uma implementação de AI SRE

## 练习
1. 运行 `code/main.py`Se os agentes logísticos e métricos não coincidem, como resolver?
2. Para o seu serviço definir três ações de auto-remediação seguras.
3. 编写一个结构化 runbook template:sections、required fields、verification commands──
4. A sua política é o que é o pager, pré-descasque, ou ambos?
5. 论证 一 3 人团队应在2026年采用 AI SRE,还是等.

## 关键术语
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
