# Agentes de navegador e tarefas de Web

> O operador ChatGPT  (em 2025) vai operador e pesquisa profunda                                                                                                                                                                                                                                                      

**Type:** Learn
**Languages:** Python (stdlib, indirect prompt-injection attack surface model)
**先修要求：**Fase 15 · 10 (modos de autorização), Fase 15 · 01 (agentes de longo horizonte)
**Time:** ~45 minutes

## 问题

O agente de navegador é um agente de longo horizonte: ele lê conteúdo não confiável, e executa operações com consequências. Cada página que o agente visita, são entradas não escritas por usuários. Cada um dos formulários de cada página, são passagens de ordens potenciais.

A preparação da OpenAI não é confortável. O responsável disse que a injeção direta não é um erro que pode ser completamente corrigido. A causa é que o ataque ocorre na fronteira de leitura e ação do agente, e esta fronteira é uma estrutura em que cada token que o modelo leu pode ser lido como uma instrução.

Este curso vai nomear este ataque, nomear o índice de referência 版图(BrowseComp、OSWorld、WebArena-Verified), e construir um mínimo de injeção indireta imediata cenário, para que você possa raciocinar a verdadeira defesa das lições 14 e 18.

## 概念

### 2026 図書: Cada sistema

**ChatGPT agent (OpenAI).**Em 2025, em 7 de julho de 2025 foi lançado o SOTA de 68,9% no BrowseComp; em OSWorld e WebArena-Verified, também teve um forte desempenho.

**Claude Sonnet + Vercept (Anthropic).**Antropic  compra Vercept, foco em capacidades de uso de computadores                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

**Gemini 3 Pro with Browser Use (DeepMind).**Integrar o uso do navegador  lançar controles de uso do computador;FSF v3(2026 年 4 月,Lesson 20) especializado em acompanhar a autonomia no campo da I&D ML ⋅

**WebArena-Verified (ServiceNow, ICLR 2026).**修复一个有充分记录的问题:原始 WebArena 约有11.3%的错误负率(任务被标记为失败,但实际已解决) ―― Verificada lançamento Utilize人工整理的成功标准重新评分,并加入了258-task Hard subset(ICLR 2026 paper,openreview.net/forum?id=94tlGxmqkN) 』

### BrowseComp vs OSWorld vs WebArena

| Benchmark | 衡量什么 | Horizon |
|---|---|---|
| BrowseComp | 在时间压力下，在开放 Web 上查找特定事实 | 分钟级 |
| OSWorld | Agent 操作完整 desktop（mouse、keyboard、shell） | 数十分钟 |
| WebArena-Verified | 模拟网站中的事务型 Web 任务 | 分钟级 |
| Hard subset | 带有多页面状态转换的 WebArena-Verified 任务 | 数十分钟 |

轴线不同──高 BrowseComp 分数说明代理 能找到事实; it does not explain agent 能预订航班──OSWorld 分数更接近它不能在我的桌面上工作──WebArena-Verified 更接近它不能完成一个流程──任何生产决策都需要选择与任务分布匹配的基准──

### 攻击面,命名如下

1. **Indirect prompt injection.**Não confiável. Página contém instruções. Agente 读取它们. Agente 执行它们.
2. **URL fragment / query injection.**- Não .`#fragment`Ou uma cadeia de consulta 包含命令──它们从不被见染; mas ainda está no contexto do agente──
3. **Memory-binding attacks.**页面指示代理 写入一条持续记忆(Lessão 12 涵盖持续状态) ・・・ na próxima sessão, essa memória em caso de não ser visto触发器触发有效载──
4. **Authenticated sessions 上的 CSRF-shaped attacks.**Memórias contaminadas 类:agente 已登录某处; página do atacante emite estado变更请求,agente Use cookies do usuário 执行这些请求。
5. **One-click hijack.**Um agente de carga visual inofensivo acompanha a carga útil.
6. **Agent host surface 中的 Content-Security-Policy holes.**Rendering 和 tool layers 本身也可能成为攻击 Vector; browser-in-a-browser-agent stack 很宽──

### Por que é impossível reparar completamente?

Este tipo de ataque e capacidade de agente são concebidos. O agente deve ler conteúdo sem confiança para concluir o trabalho. Qualquer conteúdo que o agente leia pode incluir instruções. Qualquer instrução que o agente siga pode não concordar com a verdadeira solicitação do usuário. Defesa.

Este é o teorema de Lob (Lessão 8) é o mesmo modelo de raciocínio: agente não pode provar que o próximo token é seguro; ele só pode construir um sistema, fazer o token inseguro mais facilmente detectado.

### Real poder de defesa

- **Read / write boundary.**读取永远不产生后果──写入(提交表单、发布内容、调用有副作用的工具) Se o conteúdo for iniciado pelo limite de confiança, é necessário uma nova aprovação do Ministério da Humanidade──
- **Tool allowlist per task.**O agente pode navegar; a menos que uma ferramenta esteja explicitamente habilitada para a missão, senão não pode lançar transferências bancárias.
- **Session isolation.**Sessões de agente do navegador apenas usar credenciais de alcance 运行―― não produção auth, não e-mail pessoal― reter cada pedido HTTP 日志 para auditoria―
- **Content sanitizer.**Trazido HTML em contexto do modelo 前,会剥离已知-bad patterns──( reduzir facilmente ataques; não pode impedir carga útil complexa──)
- **对 consequential actions 使用 HITL。**Propõe-se-depois-comprometam padrão (Lessão 15)
- **Canary tokens on memory.**Se uma entrada de memória 触发, o usuário vai vê-la ((Lessão 14) ⋅


```figure
injection-boundary
```

## Use-o

`code/main.py`建模一个小浏览器-代理运行,目标是三个合成页面──一页是好良性的,一个在可见文本中有直接提示注射斑块,一个有URL-fragment注射(不可见,但位于代理的背景中)──脚本展示了 (a) naívo agente 会做什么,(b) read/write boundary 会捕获什么,(c) sanitizer 会捕获什么,(d) 二者都捕获不了什么──

## Entrega-o

`outputs/skill-browser-agent-trust-boundary.md`Definir uma implementação de um navegador-agente: ele atinge quais zonas de confiança, ele é autorizado a escrever o que, bem como a primeira operação antes de ser necessário em quais defesas.

## 练习

1. 运行 `code/main.py` encontrar um desinfetante capaz de capturar, mas não consegue capturar ataques, bem como apenas um limite de leitura/escritura capaz de capturar ataques.

2. 扩展无洁剂, use it检测一类HashJack-style URL-fragment injeção──在带有合法fragments的好良 URL 上测量虚假阳性率──

3. 选择一个你知道的真实浏览器-agent workflow(例如,预订飞) ――列出每次阅读和每次写──标记哪些写 需要 HITL,以及为什么──

4. 阅读 WebArena-Verified ICLR 2026 paper──找到一个原始 WebArena 评分不可靠的任务类别,并解释 Verified subset 如何解决它──

5. Para configuração de agente do navegador, desenhe um canário de memória.

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|---|---|---|
| Indirect prompt injection | “坏页面文本” | Agent 读取的页面中有不受信任内容，其中包含 agent 会执行的指令 |
| Tainted Memories | “Memory attack” | Agent 将攻击者提供的指令写入 durable memory；下一次 session 触发 |
| HashJack | “URL fragment attack” | 隐藏在 URL fragment / query string 中的 payload 位于 agent 的 context 中，但不会被可见渲染 |
| One-click hijack | “坏按钮” | 可见 affordance 承载 agent 会执行的后续 payload |
| BrowseComp | “Web search benchmark” | 在开放 Web 上查找特定事实；分钟级 horizon |
| OSWorld | “Desktop benchmark” | 完整 OS control；多步骤 GUI tasks |
| WebArena-Verified | “修复后的 web-task benchmark” | ServiceNow 重新评分的 WebArena，带 Hard subset |
| Read/write boundary | “Side-effect gate” | 读取永远不产生后果；如果内容来自 trust 外部，写入需要新的批准 |

## 延伸阅读

- [OpenAI — Introducing ChatGPT agent](https://openai.com/index/introducing-chatgpt-agent/)Operador e pesquisa profunda
- [OpenAI — Computer-Using Agent](https://openai.com/index/computer-using-agent/) Linhagem do operador, bem como posteriormente se tornar a arquitetura do agente ChatGPT。
- [Zhou et al. — WebArena](https://webarena.dev/) Origins de referência
- [WebArena-Verified (OpenReview)](https://openreview.net/forum?id=94tlGxmqkN) Papel ICLR 2026 de subconjunto fixo
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含 包含                                                                                                                                                                                                                                                                                          
