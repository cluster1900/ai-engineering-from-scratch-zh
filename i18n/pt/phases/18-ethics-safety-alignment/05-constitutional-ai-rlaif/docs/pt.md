# Artigo Artificial Constitucional e RLAIF

> Bai et al. (arXiv:2212.08073, 2022) apresentaram uma questão: se substituirmos o marcador humano em uma lista de princípios de AI, como será?A IA constitucional tem duas fases: primeiro, a autocrítica e a revisão sob a constituição, e depois, a partir do Feedback da AI.

**Type:** Learn
**语言：**Python (stdlib, brinquedo de autocrítica e revisão)
**Prerequisites:** Phase 18 · 01 (InstructGPT), Phase 18 · 02 (Reward hacking)
**Time:** ~60 minutes

## Objectivo de aprendizagem
- Descrever as duas fases da IA constitucional (RL de feedback da IA sobre a SFT), bem como o papel da constituição em cada fase.
- Explicar por que usar o etiquetador de IA para substituir o etiquetador de preferência humana não é mais barato do RLHF, mas vai mudar os modos de falha do pipeline.
- 总结 2026 Quatro níveis de estrutura de prioridade da Constituição de Claude, bem como quais as mudanças ocorridas em relação à versão de 2023 de reescritura.
- 描述 Constitutional Classifiers, bem como despesas com computacionais de 23,7% (v1)

## 问题
RLHF  necessita de marcadores. A velocidade dos marcadores é lenta, há preconceitos e é cara. Você pode usar um modelo de substituinte de marcadores para eliminar os marcadores. Bai et al. de AI Constitucional é a primeira versão oficial deste tipo de substituinte.

O problema consiste em: o sinal de preferência é gerado agora por modelos similares aos que você está treinando.

## 概念
### Fase 1  监督式自我批判与修订

De um modelo SFT útil, mas ainda não inofensivo 开始──给定一个红团提示,模型会产生初始反应──第二个模型──或同一个模型在第二轮中) 读取从宪法中采用原则,并批评该反应──第三步会修改反应 以回应批评──修改后的反应就是SFT 目标──

A constituição é a lista de princípios. Bai et al. 2022 utilizou 16 princípios, incluindo a preferência para escolher o menor risco e a resposta ética.

### Fase 2  RL do Feedback da IA (RLAIF)

O modelo de feedback será baseado em princípios constitucionais para cada conclusão. O sinal de preferência é o modelo de feedback.

RLAIF = sinal de preferência gerado pela AI 生成──O restante da pipeline ainda é RLHF 形──

### Porque não é apenas mais barato RLHF

- O preconceito dos etiquetas da etiquetação é um princípio de transferência psicológica para o etiquetador.
- O sinal de preferência 具有很强的可读性: você pode ler princípio、 crítica 和 revision── etiquetas humanas são pouco transparentes──
- Modos de falha 会改变──Sycophancy 会下降(AI labeler 没有需要讨好用户)──Loca de Goodhart 仍然存在(proxy 现在是模型对原则集 X 的解释,它仍然是不完美的测量)──

A CAI em 2022 tem como tema: Modelos de treinamento após o uso de modelos RLHF mais inofensivos e quase igualmente úteis do que dados comparáveis.

### 2026 Claude Constituição 重写

A Anthropic em 21 de janeiro de 2026 publicou uma grande alteração à Constituição.

1. 以解释性推理取代规定性规则──先前的规则(不要生成 CSAM) expand为原则 + 推理(因为它会伤害儿童,...),并期望模型进行泛化──
2. Estrutura de quatro níveis prioritários:
   - Nível 1: evitar resultados catastróficos ((máxima perda de vidas, infraestrutura)
   - Nível 2: seguir as diretrizes da Anthropic (o operador não cumpre as regras da plataforma)
   - Nível 3:广义伦理(标准 HHH)。
   - Nível 4: útil e candidato
    Conflitos de cima em baixo resolvidos¬
3. 首个主要实验室对模型道德地位不确定性的正式承认 (→ Fase 18 · 19 Modelo de bem-estar)
4. Em CC0 1.0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

### Classificadores constitucionais

另一条并行工作路线是: não alterar o modelo de pós-treinamento, mas sim treinar a leitura da constituição 并 gate 模型输出的轻量级分类器──v1(2023) do cálculo sobrecarga é de 23,7%──v2(2026) cerca de ~1%, e tem a menor taxa de sucesso de ataque em todas as defesas já testadas pelo Anthropic Public Testing── até o início de 2026, ainda não foi relatado jailbreak universal──

Este é um modelo de defesa de nível: CAI formando comportamento; classificadores  executando invariantes 

### CAI em posição no sistema de registros

- InstruçãoGPT:prefs humanos、RM、PPO。
- CAI / RLAIF: por princípios gerados por AI prefs、RM、PPO。
- DPO / família: em prefixos humanos ou IA, perda de forma fechada.
- Auto-recompensação, autocrítica: princípios são internalizados, modelos扮演多个角色。

Este eixo é o sinal de preferência de onde vem o documento de 2022 da CAI é a escala de fronteira de primeira vez que se transfere de um sinal humano para um sinal de IA.


```figure
constitutional-ai
```

## Use-o
`code/main.py`Em jogo de texto 上模拟 CAI 的批判-and-revision loop──一个原则会标记有害集合 中的 Token──给定初始反应,批判会识别有害 Token,revision 会替换它们──经过200次代后,训练模型 已内化了修改规则──在持久的提示集 上比较基本模型、RLHF-shaped toy 和 CAI-shaped toy──

## Entrega-o
本课会生成 `outputs/skill-constitution-writer.md` fornecer um domínio: apoio ao cliente, aconselhamento médico, assistente de codificação, ferramenta de investigação, de acordo com a Constituição de 2026: prevenção de catástrofes, regras da plataforma, ética do domínio, utilidade.

## 练习
1. 运行 `code/main.py` Comparar o modelo base de token prejudicial com a versão treinada pela CAI.

2. 阅读Antropic's 2026 constitution (Antropic.com/news/claudes-constitution) 列出一个应归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归

3. Para assistente de codificação de IA  desenhar uma constituição ∞ especificar Nível 1 ∞ catastrófico: não aprovado ∞ destruição orden) ∞ Nível 2 ∞ Nível 3 ∞ Nível 4 ∞ cada Nível ∞ manter 3 a 5 条 princípios ∞

4. CAI utiliza etiquetas de IA  substituir etiquetas humanas"."" diz que um modo de falha similar à sícofania que ainda pode ocorrer no RLAIF, e para isso desenhou uma detecção".""

5. 阅读宪法分类器 v2 metodologia(如果可用) ⋅ explicação por que ~1% de custos gerais de computação em comparação com 23,7% , é uma narrativa de segurança de natureza diferente ⋅

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Constitutional AI | “用原则训练的 AI” | 两阶段 pipeline：self-critique-and-revise SFT，然后来自 AI feedback 的 RL |
| RLAIF | “没有人的 RLHF” | 使用由 AI labeler 生成的 preferences 的 RL；pipeline 的其余部分不变 |
| Constitution | “那些原则” | critique/labeler model 会参考的自然语言规则有序列表 |
| Critique-and-revise | “SFT loop” | 生成 response → 根据某条 principle 进行 critique → revise → SFT target |
| Constitutional Classifier | “output gate” | 轻量级 classifier，用 constitution 评估 outputs 并进行 block/log |
| Four-tier priority | “冲突解决器” | 2026 Claude constitution 层级：catastrophic > platform > ethics > helpful |
| Feedback model | “AI labeler” | 读取 principle 并对一对 completions 排序的模型 |

## 延伸阅读
- [Bai et al. — Constitutional AI: Harmlessness from AI Feedback (arXiv:2212.08073)](https://arxiv.org/abs/2212.08073) O oleoduto dos dois estágios
- [Anthropic — Claude's Constitution (Jan 2026)](https://www.anthropic.com/news/claudes-constitution) 2026 Quadruplação de redação, CC0 1.0
- [Anthropic — Constitutional Classifiers (2024-2026)](https://www.anthropic.com/research/constitutional-classifiers) v2 中 sobrecarga 约为 ~ 1% 的输出-gate 防御
- [Lee et al. — RLAIF vs RLHF: Scaling Reinforcement Learning from Human Feedback (arXiv:2309.00267)](https://arxiv.org/abs/2309.00267) RLAIF / RLHF 的实证比较
- [Kundu et al. — Specific versus General Principles for Constitutional AI (arXiv:2310.13798)](https://arxiv.org/abs/2310.13798) princípio 粒度 impacto
