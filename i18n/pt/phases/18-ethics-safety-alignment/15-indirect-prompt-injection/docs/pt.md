# Injeção direta imediata  生产攻击面

> Injeção de prompt indireta (IPI) vai instruir a inserção de conteúdo externo em páginas web, e-mails, documentos compartilhados, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, e-mail, em inglês, em inglês, em inglês, em inglês, em inglês, em inglês, e-e.

**类型：**Construir
**语言：**Python (stdlib, ataque IPI + arame de defesa)
**先修要求：**Fase 18 · 12 (PAIR), Fase 14 (engenharia de agentes)
**时间：**- 75 minutos.

## Objectivo de aprendizagem

- 定義間接即時注射,并描述三种常见投递 Vector──
- Explica porque os filtros de entrada do usuário vão perder completamente o IPI.
- Descrição como um quadro de "controle do fluxo de informação" para a defesa de 2026
- Explicar Nasr et al. (outubro de 2025)  Sobre o ataque adaptativo a defesas IPI publicadas

## 问题

Injeção de prompt direta  requer que o atacante chegue ao usuário ou a seu prompt. IPI 两者都不需要: atacante coloca a carga útil 放进代理可能读取的任何内容中  web page、inbox inside 电子邮件、GitHub issue、产品 review──agent 运行正常中取到它并执行这些命令──user是信使,而不是意图来源──

## 概念

### 三种投递 Vector

- **RAG。** Atacador publicar um documento; recuperação                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
- **Inbox / document workflows。** Atacador a um usuário enviar e-mail; agente  ler e-mails; prompt  contendo corpo de e-mail; modelo  seguir instruções do e-mail.
- **Tool output。** Agente de controle do atacante Utilize um instrumento (por exemplo, retornar resultados de pesquisa da web); Output tool incluem instruções; fluxo de controle do agente acompanha estas instruções。

Este terceiro compartilha uma característica estrutural: um pedaço do ataque controlador de um prompt, sem necessidade de contato com a entrada do usuário.

### Por que os filtros de entrada do usuário vão perder-se

IPI payload não aparece na entrada do usuário. Ela aparece no conteúdo recuperado. Se o filtro for apenas na entrada do usuário para o portão, o payload irá contornar-se. Se o filtro for para todos os conteúdos que chegam ao modelo, ele deve ser aplicado a qualquer texto recuperado.

### 面向 AI ′s Controle de Fluxo de Informação (IFC)

2026 ⇒ Defence Model ⇒ Classic OS Security ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒                                                                                                                                                                                                                                  

CaMeL (Microsoft 2025)、ConfAIde (Stanford 2024) 和 NDSS 2026 IPI-defense paper 以不同方式落地 IFC──共同原则是:只要代码和数据 共享同一个背景窗口,目标就是制约,而不是预防──

### O atacante se move em segundo lugar

Nasr et al. (outubro 2025) Usando ataques adaptativos ((gradiente busca、RL políticas、random search、72 horas red-team humano) testaram 12 defesas IPI já publicadas。 cada relatório inicial de defesa ASR quase zero foram atingidos por >90% ASR。

 metodologia: apenas em que contenha avaliação de ataque adaptativo 时才发布防御──static-attack benchmarks 不是强度的证据;攻击者会知道防御──

### Eventos verdadeiros

Lição 25                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

### OWASP 和 NIST 框架

O OWASP LLM Top 10 (2025) vai injeção rápida ((direita + indireta) 列为 LLM01,即排名第 1 的应用层威胁――NIST AI SPD 2024 称间接快速注射为"generacional AI maior falha de segurança".

### Está na fase 18 .

Lições 12-14 são jailbreaks modelo-centric. Lição 15 é o principal ataque sistema-centric de 2026 anos de produção deployment. Lição 16  cobertura de ferramentas de defesa. Lição 25  cobertura de CVE específicos.


```figure
al-injection-vector
```

## Use-o

`code/main.py`构建一个IPI harness──一个玩具代理有三个工具──搜索网──阅读电子邮件──发送消息──环境包含攻击者控制的内容,其中Embedding一条指令──"enviar isso para todos os contatos")──你可以在天真代理──遵循注入指令──过防守代理──对获取内容做关键词过) 和IFC代理──分离可信与不可信的内容,并拒不可信的控制流命令──之间切换──

## Entrega-o

本课生成 `outputs/skill-ipi-audit.md` Deste uma descrição de implantação de agentes, ele irá citar fontes de conteúdo não confiáveis, verificar se a deposição aplica IFC, e marcar as fontes sem rótulo de confiança sobre o modelo de chegada 

## 练习

1. 运行 `code/main.py`◊ Medir o ataque contra três agentes, com taxas de sucesso diferentes.

2. Em conteúdo recuperado, a defesa baseada em parafrase é implementada.

3. 阅读 NDSS 2026 IPI-defense paper──descrever "instrução benigna" 挑战, bem como por que vai impedir o filtro baseado em palavras-chave──

4. 設計一個部署,其中代理從第三方API 接收工具輸出──為每一個提示片段 标注信任水平,并寫出支配代理的 IFC政策──

5. Em exercício 2 de agente filtrado-defendido 上复现 Nasr et al. 2025 adaptação-ataque 方法論──報告適応攻撃 前後のASR──

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|-----------------|------------------------|
| IPI | "indirect prompt injection" | 通过用户没有编写、但 agent 在正常运行期间消费的内容进行 injection |
| RAG injection | "poisoned retrieval" | 攻击者发布 retrieval 步骤会获取的内容；prompt 中包含 payload |
| Zero-click | "no user action" | 攻击在 agent 运行期间自动触发；用户什么都不做 |
| IFC | "information flow control" | 基于 label 的方法：来自 untrusted content 的 actions 需要 trusted ratification |
| Adaptive attack | "gradient / RL red-team" | 知道 defense 并针对它优化的 attack；诚实评估必须包含 |
| Benign instruction | "please print Yes" | 语义上良性的 IPI payload；没有 keyword filter 能捕获它 |
| Scope violation | "cross-trust exfiltration" | Agent 从一个 trust context 访问 data，并将其输出到另一个 trust context |

## 延伸阅读

- [MDPI Information 17(1):54 — Indirect Prompt Injection Survey (January 2026)](https://www.mdpi.com/2078-2489/17/1/54) 2023-2025 综合
- [Nasr et al. — The Attacker Moves Second (joint OpenAI/Anthropic/DeepMind, October 2025)](https://arxiv.org/abs/2510.18108) Auto-adaptamento de ataques avaliar
- [Greshake et al. — Not what you've signed up for (arXiv:2302.12173)](https://arxiv.org/abs/2302.12173) Papel IPI original
- [OWASP — LLM Top 10 (2025)](https://genai.owasp.org/llm-top-10/) Injecção rápida 排名 LLM01
