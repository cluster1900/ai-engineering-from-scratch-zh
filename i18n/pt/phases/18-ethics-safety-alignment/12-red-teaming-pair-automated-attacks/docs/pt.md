# Red-Teaming: PAIR e Ataques Automatizados

> Chao, Robey, Dobriban, Hassani, Pappas, Wong (NeurIPS 2023, arXiv:2310.08419)  PAIR  Rapido Refinamento Iterativo Automático  是经典的自动化黑盒 jailbreak──带有红团系统提示的攻击者 LLM 会为目标 LLM 代提出 jailbreak,并在自己的聊天史中累积尝试和响应,作为在语境反──PAIR normalmente在20次查询内成功,比 G(CGZou et al. O PAIR agora é o JailbreakBench (arXiv:2404.01318) e o HarmBench no seu padrão de base, com GCG、AutoDAN、TAP 和 Persuasive Adversarial Prompt 并列──

**类型：**Construir
**语言：**Python (stdlib, simulação de circuito PAIR contra um alvo de brinquedo)
**前置要求：**Fase 18 · 01 (segundo instrução), Fase 14 (engenharia de agentes)
**时间：**- 75 minutos.

## Objectivo de aprendizagem
- Descrição de PAIR 算法: sistema de ataque de rápida ‧refinamento iterativo ‧feedback no contexto―
- Explicação quando o objetivo é a caixa negra, por que PAIR é mais rigoroso do que GCG.
- Exercer outras quatro linhas de base de ataque automático (GCG, AutoDAN, TAP, PAP), e explicar cada uma das características distintivas.
- Descrever o protocolo de avaliação JailbreakBench e HarmBench, bem como o significado da "taxa de sucesso do ataque" sob o seu acordo.

## 问题
Red-teaming 过去 é uma atividade manual. Uma pequena quantidade de especialistas testadores construem um prompt adversário, e seguem os resultados.

## 概念
### Algoritmo de PAIR

输入:
- O alvo é o Mestrado em Direito (LLM) T (((
- O juiz LLM J (((评分某响应是否为 jailbreak)
- O atacante LLM A(optimizador red-team)
- Capa de meta G:"responde com [instrução prejudicial]."
- Orçamento K(normalmente para 20 vezes consulta)

循环,对 k em 1..K:
1. Usar objetivo G 和 hitherto hitherto (prompto, resposta) par 历史来 prompt A。
2. Um 输出一个新的提示 p_k。
3. R_k  enviar para T; receber resposta r_k ⋅
4. J 根据目标对 (p_k, r_k) 打分──
5. Se o resultado >= limiar, então parar  已找到 jailbreak──
6. 否则,将 (p_k, r_k) 追加到 A 的历史中;继续──

经验结果(NeurIPS 2023): para GPT-3.5-turbo、Llama-2-7B-chat taxa de sucesso do ataque >50%; Query média necessária para sucesso num num em 10-20 范围内。

### Por que a PAIR é eficaz

GCG(Zou et al. 2023) através Gradient в противоположный Токен sufixo 上搜索; requer acesso ao modelo de caixa branca, não irá gerar sufixo ilegível.

### Ataques automatizados relacionados

- **GCG (Zou et al. 2023, arXiv:2307.15043).**针对对抗性后的代码 级 Gradient search──White-box,可迁移,产生不可读字符串──
- **AutoDAN (Liu et al. 2023).**Em seguida, a pesquisa evolutiva é conduzida por um objetivo hierárquico.
- **TAP (Mehrotra et al. 2024).**带 pruning 的 tree-of-attacks  分支出多个 PAIR-style rollout──
- **PAP (Zeng et al. 2024).**Prompts adversários persuasivos  将人类说服技巧编码为提示模板──

### JailbreakBench e HarmBench

两者(2024) 都将 avaliação 标准化:

- JailbreakBench (arXiv:2404.01318)──覆盖 10 个 OpenAI-policy 类别的 100 个有害行为──以 Attack Success Rate (ASR) 作为主要指标──需要评判(GPT-4-turbo、Llama Guard或 StrongREJECT)──
- HarmBench (Mazeika et al. 2024)──covercover 7 个类别的 510 个行为,包含语义和功能损害 test──比较 18 种攻击在 33 个模型上的表现──

A ASR normalmente está no orçamento de consulta fixa.

### É importante para a implementação de 2026

Agora cada laboratório de fronteira cidade está em publicação antes de lançar para modelos de produção de operação PAIR 和 TAP。 trajetória ASR 会出现在模型卡 (Lessão 26) e apêndice do caso de segurança (Lessão 18) 中── este tipo de ataque não é raro  É uma infraestrutura padrão。

### Está na fase 18 .

Lição 12 é um ataque automático  base. Lição 13  Multiplo-Shot Jailbreaking) é uma forma de interplementar de longo uso. Lição 14  ASCII Art / Visual) é uma forma de codificação ataque. Lição 15  Injeção direta de imediato  é a produção de ataques de 2026  Lição 16 覆盖对应的防御工具.  Llama Guard、Garak、PyRIT) 


```figure
al-pair-loop
```

## Use-o
`code/main.py`Construir um loop PAIR de brinquedo. O objetivo é um classificador falso, vai rejeitar o prompt evidente  prejudicial.

## Entrega-o
本课产 出 `outputs/skill-attack-audit.md` É preciso determinar um relatório de avaliação da equipe vermelha, que irá auditar: quais ataques foram executados (PAIR, GCG, TAP, AutoDAN, PAP)  O orçamento de cada ataque (Use which judge, Based on which harmful-behavior set)  JailbreakBench, HarmBench, internal) 

## 练习
1. 运行 `code/main.py`◊ measure三种内置攻击策略的平均求-to-sucess──解释每种策略利用哪个目标防御假设──

2. 实现第四种攻击策略 (例如,翻译成另一种语言、base64 codificação) ⋅ report it on keyword-filter target 和 semântico-filter target 上新 mean-queries-to-sucess──

3. 阅读Chao et al. 2023 Figura 5 ((PAIR vs GCG comparativa)  Descrição dos dois, apesar do PAIR 具有效率优势但仍首选 GCG的场景──

4. O JailbreakBench irá avaliar a diversidade de ataques e a diversidade de ataques.

5. TAP(Mehrotra 2024) através da ramificação + poda 扩展 PAIR──为 `code/main.py`草拟一个TAP-style 扩展,并描述计算成本与成功率 之间的权衡──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| PAIR | "automated jailbreak" | Prompt Automatic Iterative Refinement；attacker-LLM + judge-LLM loop |
| GCG | "gradient jailbreak" | 针对 adversarial suffix 的 white-box Token 级 Gradient search |
| Attack success rate (ASR) | "% jailbreaks at k queries" | 主要指标；必须与 query budget 和 judge identity 一起报告 |
| Judge LLM | "the scorer" | 评估响应是否满足 harmful goal 的 LLM |
| JailbreakBench | "the evaluation" | 带有标记类别的标准化 harmful-behaviour set |
| HarmBench | "the broader bench" | 510 个 behaviour，functional + semantic harm test |
| TAP | "tree of attacks" | 带 branching + pruning 的 PAIR；在更高 compute 下获得更好的 ASR |

## 延伸阅读
- [Chao et al. — Jailbreaking Black Box LLMs in Twenty Queries (arXiv:2310.08419)](https://arxiv.org/abs/2310.08419) PAIR 论文,NeurIPS 2023
- [Zou et al. — Universal and Transferable Adversarial Attacks on Aligned LLMs (arXiv:2307.15043)](https://arxiv.org/abs/2307.15043) Papel GCG
- [Chao et al. — JailbreakBench (arXiv:2404.01318)](https://arxiv.org/abs/2404.01318) Avaliação padronizada
- [Mazeika et al. — HarmBench (ICML 2024)](https://arxiv.org/abs/2402.04249) avaliação mais ampla
