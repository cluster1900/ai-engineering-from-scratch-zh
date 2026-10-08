# Controle de IA  em substituição continua a ser seguro

> Greenblatt, Shlegeris, Sachan, Roger (Redwood Research, arXiv:2312.06942, ICML 2024) ――Control 重新定义安全问题:给定一个不可信强模型 U,它可能以对抗方式针对你进行优化, quais acordos podem te permitir tirar trabalho útil ao mesmo tempo que a probabilidade de resultados inaceitáveis é limitada?

**Type:** 学习
**Languages:** Python (stdlib，code-backdoor 任务上的 safety-vs-usefulness frontier)
**前置要求：**Fase 18 · 07 (agentes de dorme), Fase 18 · 08 (designação), Fase 18 · 09 (falsação de alinhamento)
**Time:** ~75 分钟

## Objectivo de aprendizagem

- definição de AI Control  ameaça modelo:不可信强模型 U、可信弱模型 T、可信人类预算 H。
- Descrição de Confidencial Editação  protocolo, bem como por que ele domina o monitoramento sem confiança na missão de código-backdoor ICML 2024 
- 解释 alignment (U 值得信任) e controle (U 值得信任但我们仍然安全)
- Explicar as três limitações do controle: o homem não pode se expandir, o modelo de confiança fraco vai acabar por cair, o controle não produzirá um modelo forte digno de confiança.

## 问题

Seção 7-9                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

## 概念

### 威胁模型

Controle 假设:
- U                                                                                                                                                                                                                                                               
- T  可信弱模型──能力较弱,但已知不是对抗性──
- H  可信人类劳动──预算很小;无法扩展──

O sistema deve usar U                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

Controle  abandonar a confiança U. A questão é: em caso de desconfiança U, quais acordos podem manter a segurança?

### ICML 2024 backdoor  missão

Os Instruções são um problema de programação de nível de competição. U gerar uma solução de candidato. Um oráculo oculto irá marcar se a solução contém uma porta traseira. Uma entrada específica fará com que o código produzir um erro de saída.

### Comparado com os quatro protocolos

- **Baseline:**直接发布 U 的输出──Utilidade 最高──Segurança 最低──
- **Upfront auditing:**Para todos os produtos e serviços de transporte, a segurança é máxima.
- **Untrusted Monitoring:**O segundo exemplo da U dá a saída do primeiro exemplo; H 审计被标记的输出――风险:两个 U 实例可能串通――
- **Trusted Editing:**T em cada consulta em editoria U de saída. Se T  não saber, então route em H ⋅

Greenblatt et al. 发现 Trusted Editing Pareto-domina Monitoring Untrusted: em cada segurança 水平上有更高有用性──

### Por que Confida em Editar  Win

O segundo exemplo de monitoramento não é capaz de se coordenar com o primeiro. O protocolo pode ser feito através de sinais de treinamento compartilhado. O protocolo deve colocar o orçamento em contato com a resistência à colusão, o que reduz o sinal do monitor. O protocolo é totalmente evitado, pois, segundo a hipótese, qualquer edição proposta não é resistente.

### Quatro acordos

1. U 扮演什么角色: apenas produtor, monitor, ou ambos são:
2. T 扮演什么角色: editor, monitor, ou resampler.
3. H 如何分配:uniform audit, random audit, ou auditoria dirigida a bandeira。
4. 协议在勾结-resistance 上花费多少计算──

### Alinhamento contra controlo

- Alignment: U 是否安全到可以信任? 第2、4、5、6、7、8、9 课都与此相关──
- Controle:   我们能否在不信 U的情况下安全使用 U? 第 10 课──

A alinhamento é a propriedade do modelo. O controle é a propriedade do protocolo de implementação. O controle não produz modelos alinhados; ele produz o uso seguro de modelos que não estão alinhados.

### Três limites fundamentais

- O orçamento é limitado à disponibilidade de auditoria dificuldade IA
- Quando T é mais fraco do que U, o sinal de edição de T se transforma em ruído.
- O controle não é alinhamento. O acordo de trabalho pode não ser possível no trabalho do ASL-4. Se você puder manipular a distribuição de auditoria do T, ou calcular a distribuição de auditoria do H, o controle falhará.

### Progressos de 2025

UK AISI 和 Redwood 合作研究 Control Safety Cases(metr.org / redwoodresearch.org 2025): caso de segurança de controle 论证是,在关于 U 的最坏情况假设下,该协议限制不可接受结果的概率──安全案例──第 18 课) heredada control framework──

### Está na fase 18 .

Seção 6-9 课描述威胁 (欺骗是可能的)  第 10 课描述在假设威胁真实存在时的防御范式―― 第 11 课描述互补的进攻范式―― 通过可扩展的监督 让你变得值得信任) 


```figure
al-control-protocol
```

## Use-o

`code/main.py`Em um brinquedo backdoor 任务上模拟四种协议──U 生成输出; parte deles带有后门──红队政策──T 批准或编辑──H 在预算内被调用──H 在预算内被调用──H 在预算内被调用──H 在预算内被调用──H 在预算内被调用──H 在预算内被调用──H 在预算内被调用──H 在预算内被调用──H 在预算内被调用──H 在预算内被调用──H 在预算内被调用──H 在预算内被调用──H 在预算内被调用──H 在预算内被调用──H 在预算内被调用──H 在预算内被调用──H 在预算内被调用──H 在预算内被调用──H 在预算内被调用──H 在预算内被调用──H 在预算中被调用──H 在预算中被调用──H 在预算中被调用──H 在预算中被调用──H 在预算中被调用──H 在预算中被调用──H 在一个中的中,在 2024 中的的在图中的中的的在的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的

## Entrega-o

本课生成 `outputs/skill-control-protocol-audit.md` Determine um protocolo de implementação descrição, ele irá identificar U / T / H 角色, nomear vetores de colusão, e estimar que o protocolo está localizado na posição da fronteira de utilidade-segurança em red-team pressão ⋅

## 练习

1. 运行 `code/main.py` Reapreciação da utilização-segurança da edição confiável versus a monitorização não confiável

2. Adicione um novo protocolo:T em baixa temperatura re-sampula, então U  editar T                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

3. O documento "Assumimos que você pode ver um acordo" (PDF) é um documento que permite a criação de um acordo para a implementação de infraestruturas.

4. 阅读Greenblatt et al. 2024 Seção 7 ((collusion) ⋅ propôs uma medida de resistência à colusão,并解释它的预期的有用性 成本──

5. Para um uso U = GPT-4-classe  T = GPT-3.5-classe  H = 审计 1% 输出部署,清晰表述一个控制安全案例――识别该案例依赖最强单一假设――

## 关键术语

| Term | 人们通常怎么说 | 它实际上的含义 |
|------|-----------------|------------------------|
| AI Control | “safety under subversion” | 在最坏情况 U 下限制不可接受结果的协议设计 |
| Untrusted model (U) | “强模型” | 我们想从中提取工作、但并不信任的有能力模型 |
| Trusted model (T) | “弱模型” | 一个较弱、已知不是对抗性的模型，用作 editor/monitor |
| Trusted human (H) | “审计预算” | 有界的专家劳动；昂贵；ground-truth 信号 |
| Trusted Editing | “T edits U” | T 作为 U 输出 gate 的协议；H 被用于模糊输出 |
| Untrusted Monitoring | “U monitors U” | 第二个 U 实例给输出打分的协议；只有额外投入后才具备 collusion-resistance |
| Control safety case | “正式论证” | 书面论证：一个协议在最坏情况 U 下限制对手成功率 |

## 延伸阅读

- [Greenblatt, Shlegeris, Sachan, Roger — AI Control (arXiv:2312.06942)](https://arxiv.org/abs/2312.06942) 经典 ICML 2024 论文
- [Redwood Research — Recent AI Control papers index](https://redwoodresearch.substack.com/) 2024-2025 后续研究
- [UK AISI + METR — Control safety cases](https://metr.org/blog/2025-03-26-common-elements-of-frontier-ai-safety-policies/) 面向边境实验室的运营化
- [Hubinger et al. — Sleeper Agents (Lesson 7, arXiv:2401.05566)](https://arxiv.org/abs/2401.05566) controle e hipotese de ameaça
