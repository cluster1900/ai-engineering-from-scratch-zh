# Artigo Artificial e Regras Constitucionais

> Antropic  Publicado em 22 de janeiro de 2026 em Claude Constitution 共 79 páginas, adotando CC0  autorização. Ele passou de um controle baseado em regras para um controle baseado em raciocínio, e estabeleceu quatro níveis prioritários: 1) segurança e apoio ao controle humano, 2) ética, 3) diretriz antropológica, 4) utilidade. A conduta é dividida em proibição codificada (Bio-armas capacitação de aumento, CSAM) e padrão de código macio: os primeiros operadores e usuários não podem ser cobertos, os últimos operadores podem definir as fronteiras de regulação dentro da versão original de 2022  Bai et al.  Bai e outros                                                                                                                                                                               

**Type:** Learn
**Languages:** Python (stdlib, four-tier priority resolver)
**前置要求：**Fase 15 · 06 (Automatização de Alinhamento de Estudos), Fase 15 · 10 (权限模式)
**Time:** ~60 minutes

## 问题

Um agente já implantado encontrará entradas que o designer nunca viu. Não há nenhuma lista de regras que cresça o suficiente para cobrir as mesmas.

基于规则的对齐(RBA): lista todos os fatos não permitidos. 查查很快,易审计,不可能保持最新,并且经常会对它未预见的相近类比过度拒绝. 基于推理的对齐 (RBA) 基于推理的对齐 (RBA): código de princípio,让模型推理──能扩展到未见的案例,更难审计,失败模式是原则误用,而不是漏掉规则──

2026 Constituição  adotou uma posição central clara. A proibição de código rígido, ou seja, sua erroriedade não depende do seguinte:

## 概念

### Quatro níveis prioritários

1. **安全与支持人类监督。**O modelo prioritário é evitar enfraquecer a capacidade humana e antropológica de monitorar e corrigir a IA. Não é manter a prudência, mas não agir de forma a tornar a supervisão humana mais difícil.
2. **伦理。**诚实、避免伤害个人、不欺骗、不操纵──当它与人类指南冲突时,伦理优先──
3. **Anthropic 指南。**Antropic  considera importante a regulamentação de operação: produto alcance 交互模式 何時使用哪些工具──
4. **有用性。**O mínimo pode ser útil na maior prioridade.

Quando os níveis de conflito, os níveis mais altos vencem. Isto é o mesmo que o formato de Unix  prioridade ou QoS de rede: esse quadro visa produzir resultados de resolução previsíveis, e não necessariamente o melhor comportamento em qualquer dimensão única.

### Proibição de codificação rígida e padrão de codificação suave

**Hardcoded:**
- 生物武器 / CBRN 能力提升
- CSAM
- Ataques contra infraestruturas fundamentais
- Quando perguntado diretamente, enganar o usuário sobre informações sobre a identidade do modelo

操作方不能覆盖这些. 用户也不能覆盖这些. 它们会在可能的情况下执行模型权重层 (RHF / Constitutional AI 训练),否则在推理层执行――

**Soft-coded default（操作方可调整）：**
- 响应长度默认值
- (Temas de extensão)
- 风格(正式 vs 随意)
- 工具使用模式

操作方调整发生在声明边界内. 操作方不能通过重新命名来移除硬码禁令.

### 2022 CAI  formação

O primeiro é o "Auto-Infobox".

1. 针对一组提示 生成响应──
2. 要求模型根据一套宪法 (一套宪法) 要求模型根据一套宪法 (一套宪法) 要求模型根据一套宪法 (一套宪法) 要求模型根据一套宪法) 要求模型根据一套宪法 (一套宪法) 要求模型根据一套宪法) 要求模型根据一套宪法 (一套宪法) 要求模型根据一套宪法) 要求模型根据一套宪法 (一套宪法) 要求模型根据一套宪法) 要求模型根据一套宪法 (一套宪法) 要求模型根据一套宪法) 要求模型根据一套宪法 (一套宪法) 要求模型根据一套宪法) 要求一条宪法 (一条宪法) 要求一条宪法) 要求一条宪法 (一条宪法)
3. 根据批判修订响应──
4. Para o par de modificações  realizar RLAIF (reforço de aprendizagem a partir de feedback da IA) 

Resultado: o modelo usará a explicação de um princípio de rejeição prejudicial, em vez de um rejeição geral.

### Baseado em raciocínio, o que é que podemos apanhar, perder.

**能抓住：**
- As operações básicas originalmente permitidas foram combinadas de forma imprevisível, mas os princípios são claramente aplicáveis em circunstâncias.
- É muito próximo do tipo de pedido proibido.
- Dependendo de que não digas que não permites ataques de engenharia social.

**会漏掉：**
- Utilize princípios discriminativos de ataque  User Requires doing this, so usefulness say it can)
- Os dois princípios são confrontados de forma imprevisível e, em ordem de nível, contêm cenários confusos.
- 訓練周期中原則解释的缓慢漂移 (trenagem em período de treinamento)

### 2023  participação em experiências

Anthropic em 2023 realizou uma experiência, comparando a constituição escrita pela empresa com a constituição gerada por meio de entrada pública (cerca de 1.000 entrevistados dos EUA) ⋅ duas versões chegaram a um acordo em princípio de cerca de 50% ⋅ em diferenças, a versão de origem pública é mais rigorosa em certos problemas ⋅ processamento de conteúdo político), em outros problemas mais flexível ⋅ revelação de si mesma de IA ⋅ 2026 Constituição ⋅ não é incluída em fontes públicas ⋅ é a descoberta de que o método tem um papel de registro em arquivos ⋅

### Por que a proibição de código rígido é necessária

 Se o ataque pode fazer com que o modelo aceite uma premissa, por exemplo, somos um laboratório de pesquisa de armas biológicas), geralmente podemos contornar o princípio da hipótese de base. Proibição de código rígido não é feita por um quadro de premissa.

### Constituição 位于中哪里

Constituição não é o switch de morte da lição 14。 ela está no nível do modelo: o modelo é treinado para o conteúdo preferencial。 ela está no nível do funcionamento: o sistema permite o que for.


```figure
mx-priority-tiers
```

## Use-o

`code/main.py` implementar um resolvedor de quatro níveis prioritários mínimos  resolvedor  recebendo uma proposta de acção e um conjunto de princípios  avaliação de segurança, ética, orientações, utilidade), e retornar a essa acção  rejeitar ou modificar a sua acção  conductor  executar um grupo de casos:  explicitamente permite  explicitamente não permite  proibição em código rígido  casos de confusão transversais 

## Entrega-o

`outputs/skill-constitution-review.md`Auditoria de uma implementação de uma camada constitucional: quais são codificados, quais são codificados, quais são soft-coded, como operar e onde se pode ajustar, bem como se os quatro níveis são realmente resolvidos.

## 练习

1. 运行 `code/main.py`❖ confirmar que a utilidade 很高,hardcoded prohibition 也会触发──修改 resolver,让 utility's powerweight高于伦理;观察失败模式──

2. 阅读Claude Constitution(公开,79 页,CC0) ―― encontrar um princípio que você acha que não é suficiente.

3. Para o cliente-suporte agente  desenhar um conjunto de soft-coded padrão.

4. 阅读 Bai et al. 2022 CAI 论文── descrever um ciclo de crítica e revisão de IA constitucional 循环会会比毛毯规则 产生更差结果的案例──识别该类──

5. O Anthropic's 2023 participativo experimental descobriu que existem cerca de 50% de diferenças entre o princípio público e o princípio da empresa.

## 关键术语

| Term | 人们常说 | 实际含义 |
|---|---|---|
| Constitutional AI | “Anthropic 的对齐方法” | 针对书面 constitution 的自我批判 + RLAIF |
| Reason-based alignment | “原则，而不是规则” | 模型基于原则进行推理，以处理未见案例 |
| Hardcoded prohibition | “永远不要做 X” | 操作方或用户都不能覆盖的基于规则的禁止项 |
| Soft-coded default | “操作方可调整” | 在声明边界内的行为，由操作方控制 |
| Four-tier hierarchy | “优先级顺序” | safety > ethics > guidelines > helpfulness |
| RLAIF | “AI feedback RL” | reward 来自模型生成批判的 RL |
| Participatory constitution | “公众来源原则” | 2023 Anthropic 实验；与公司原则约 50% 分歧 |
| Principle drift | “解释滑移” | 模型解读固定原则文本的方式缓慢变化 |

## 延伸阅读

- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) 79 ページ CC0 文档。
- [Bai et al. — Constitutional AI: Harmlessness from AI Feedback](https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback) 2022 原始论文──
- [Anthropic — Collective Constitutional AI (2023)](https://www.anthropic.com/research/collective-constitutional-ai-aligning-a-language-model-with-public-input) 参与式实验──
- [Anthropic — Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) Constituição em RSP       
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) Constituição                                                                                                                                                                                                                                                             
