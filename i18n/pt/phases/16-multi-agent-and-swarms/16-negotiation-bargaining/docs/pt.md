# 协商与议价

> O conjunto de metas para o ano de 2026 já é muito claro: Arena de negociação (arXiv:2402.05863) mostra que os LLM podem ser manipulados por pessoas (desespero) aumentará os lucros em cerca de 20%;**OG-Narrator**(Generador de Ofertas Deterministas + Narrador de LLM) a taxa de troca será de 26,67% 提升到 88.88%;Concurso de Negociação Autônoma em Grande Escala (arXiv:2503.06416)  conduziu cerca de 180k vezes consultadas, descoberto **chain-of-thought-concealing**agentes 通过向对手隐藏推理而获胜;Bhattacharya et al. 2025  Based on Harvard Negotiation Project 指标进行排名,Llama-3 最有效,Claude-3 进攻性最强,GPT-4 最公平。本课实现 Contract Net Protocol(FIPA的前身,Lesson 02),连接一个LLM 风格的买家/卖家,运行OG-Narrator 风格的分解,并衡量每一种结构选择如何变化成交率──

**类型：**学习 + 构建
**语言：**Python (stdlib)
**前置要求：**Fase 16 · 02 (FIPA-ACL Heritage), Fase 16 · 09 (Redes de enxames paralelas)
**时间：**Cerca de 75 minutos

## 问题

 dois agentes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

根本问题在于,LLM 混混了两项工作:决定报价和叙述报价――OG-Narrator 将两者分离:deterministic offer generator 计算数值移动;LLM 仅负责叙述――成交率跃升到约89%――

O protocolo de contrato (Contract Net Protocol, FIPA, 1996; Smith, 1980) é um protocolo de referência para o mecanismo de mercado de missões.

## 概念

### Uma história para entender o contrato

Smith 1980 anos de Contrato Net Protocolo: um **manager**广播 **call for proposals (cfp)**O artigo 2.o**bidders**Us containing its offer **propose**mensagens 响应;gerente 选择获胜者,并向获胜者发送 **accept-proposal**, para o derrotado .**reject-proposal**△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △          △                                                                                               **refuse**(o licitador  rejeitou a proposta)`fipa-contract-net`Protocolo de interação.

### Por que o OG-Narrador vai ganhar

"Medindo as habilidades de negociação dos modelos de linguagem" (arXiv:2402.15813)  observar:

- As LLM  frequentemente prejudicam as regras de preços ((em geral, as empresas oferecem ofertas absurdas, ignorando as ZOPA dos outros) 
-                                                                                                                                                                                                                                                               
-  só por escala  não pode corrigir estes problemas modelos maiores  gerarão linguagem mais confiável, mas estratégia errónea 

OG-Narrador

```
           ┌──────────────────┐        ┌──────────────────┐
  state  → │ offer generator  │ price → │  LLM narrator    │ → message
           │  (deterministic) │        │  (writes the     │
           │                  │        │   human-style    │
           └──────────────────┘        │   accompaniment) │
                                       └──────────────────┘
```

O gerador de ofertas é uma estratégia clássica de negociação: modelo de negociação de Rubinstein, estratégia Zeuthen, ou em torno do preço simples tit-for-tat, LLM 负责叙述, e-mail 包含决定主义价格 和自然语言框架, 和自然语言框架, 和

A taxa de câmbio é aumentada por:
- 价格保持在谈判区内──
- Ancores são estratégicos, não emocionais.
- LLM fazer o que é bom: escrever.

### NegociaçãoArena 发现

O estudo foi publicado em 31 de janeiro de 2006 e foi publicado em 31 de janeiro de 2006 no periódico da Universidade de Lisboa.

- Os LLM podem ser adotados através de pessoas (Eu estou desesperado para vender isso até sexta-feira)
- 公平/合作型代理会被对抗型代理利用; defesa necessita de uma clara contra-posturação。
- Em cenários de referência de cerca de 40% os resultados recebidos para o compartilhamento são injustos.

Não é que os LLM sejam péssimos consultores, mas os LLM são muito humanos, incluindo os que podem ser utilizados.

### Cadeia de pensamento 隐藏

A Grande Concurso de Negociação Autônoma (arXiv:2503.06416) foi realizada cerca de 180 mil vezes em várias estratégias de LLM.

- Se um agente em um scratchpad de público visível em saída eu só vou para$75; my reservation price is $70, em vez de isso, vou ler.
- 胜者私下计算策略;输出通道只包含优惠和最低限度的必要叙述──

É uma teoria clássica do jogo (Aumann 1976  Sobre racionalidade e informação)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

工程结论:将 private-scratchpad contextos e public-message contextos separ separ separation──This is not a viable──

### Bhattacharya et al. 2025  modelo 排名

Baseado no Projeto de Negociação de Harvard, indicações sobre negociação em princípio, respeito pelos interesses, reciprocidade:

- **Llama-3**Em termos de transação, mais eficaz é a taxa de transação + pagamento.
- **Claude-3**É o melhor negociador da invasão.
- **GPT-4**O máximo de diferença entre os preços de pagamento é o mínimo de diferença entre os preços de pagamento.

Este é o rápido lançamento de 2025: o foco não é em que modelo vencer em 2026, mas em diferentes modelos básicos, com uma persistência de negociações.

###                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

Contract Net 在 LLM multi-agente 中的现代复用:

1. O agente gerente vai dividir as tarefas em unidades.
2. Utilize tarefas descrição para agentes de trabalhadores 广播 `cfp`- Não.
3. Cada trabalhador devolve uma oferta:`(price, eta, confidence)`, o preço pode ser tokens, unidades de cálculo ou dólares.
4. Gerente 选择获胜者 (单个或多个,取决于任务)并授予任务──
5. Os trabalhadores rejeitados podem exercer outras tarefas.

Isso pode ser muito bem expandido para 100 ou mais trabalhadores, porque o modo de coordenação é de transmissão e resposta, e não de chat sincrono.

### Negociação interativa entre as partes interessadas da MLL

NeurIPS 2024 (https://proceedings.neurips.cc/paper_files/paper/2024/file/984dd3db213db2d1454a163b65b84d08-Paper-Datasets_and_Benchmarks_Track.pdf)  introduziu                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          **secret scores**和 **minimum-acceptance thresholds**A LLM tem de deduzir-as em mensagens. É uma generalização da formação de coalizões de ambos os lados.

### narration-vs-mecanismo 规则

Entre todos os referências de negociação para 2024-2026, as regras de engenharia concordantes são:

> 让LLM 负责叙述──不要让LLM 计算提供──

Se a oferta 需要一个数字 ((preço ETA 量), depending on the negotiation state deterministic 生成它,并让 LLM 生成框架―― se a oferta 需要一个提案结构 ((tarefa de decomposição 角色分配), pode fazer com que LLM 起草, mas em conformidade com o esquema 验证并进行约束检查──


```figure
a5-og-narrator
```

## Construí-lo

`code/main.py`实现:

- `ContractNetManager`- Não .`ContractNetTask`- Não .`Bid` gerente + licitantes,广播 cfp, recolha de propostas, atribuição de tarefas。
- `og_narrator_bargain(state, rng)` OG-Narrador comprador: face-to-midpoint de determinação Zeuthen-style concessão。
- `seller_response(state, rng)` política determinista de contra-oferta do vendedor (R)
- `naive_llm_bargain(state, rng)` 模拟 all-LLM bargainer:以高变化 选择价格,且经常落在 ZOPA 之外──
- Medida: em 1000 provas, a taxa de transação é medida, e os preços de reserva são reaproveitados em cada ensaio.

运行:

```
python3 code/main.py
```

预期输出:naive-LLM deal rate 约65-75%;OG-Narrator deal rate 约85-95%;15-25 个百分点的差异就是将提供-generación与叙述 分解开来的结构优势――此外还会输出一个包含三个竞标者和一个任务的合同网任务市场分配示例――

## Use-o

`outputs/skill-bargainer-designer.md`设计一个议价协议:谁生成 offers (deliberação ou Mestre em Direitos Jurídicos) 谁负责叙述,private scratchpads 如何与公众信息分离以及如何监控交易率──

##  Publicá-lo

Lista de verificação de preços de produção:

- **分离 scratchpad。**O Estado privado nunca pode entrar no contexto do oponente.
- **Deterministic offer generation。**Preços, quantidades, ETA: calcular, não se apresse.
- **验证所有 incoming offers**Não é conforme com o regime.
- **限制 rounds。**Maximum 3-5 rounds; deadlock 时升级给中介者──
- **持续衡量 deal rate 和 payoff variance。**A taxa de transação, a baixa, é um sintoma, geralmente é uma deriva rápida ou um ataque de contraparte.
- **记录所有 rejected proposals** e sua raciocínio determinista¬¬¬ para os gestores da rede de contratos, os licitantes que não conseguem o contrato¬                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

## 练习

1. 运行 `code/main.py`Confirmar OG-Narrador em taxa de negócios acima de ingênuo-LLM-
2.  realização **persona-based payoff improvement**(arXiv:2402.05863)  comprador  apenas em narrativa  adotar  desesperado para comprar esta semana  persona  de oferta gerador   manter                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
3.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              **concealment**Se você não divulgar, como será que isso acontece?
4. Quando todas as ofertas ultrapassam a reserva, o gerente decide como fazer entre o preço mais baixo e a melhor qualidade.
5. Bhattacharya et al. 2025  Sobre o Projeto de Negociação de Harvard                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| Contract Net | “任务市场” | Smith 1980，FIPA 1996。cfp + propose + accept/reject。规范任务市场。 |
| ZOPA | “Zone of possible agreement” | buyer 最高价与 seller 最低价之间的重叠区间。其外部的 offers 无法成交。 |
| BATNA | “Best alternative to a negotiated agreement” | 如果本次交易失败，你的后备方案。它设定你的 reservation price。 |
| OG-Narrator | “Offer generator + narrator” | 分解：deterministic offer，LLM narration。 |
| Zeuthen strategy | “Risk-minimizing concession” | 根据风险限制让步的经典 offer-generator。 |
| Rubinstein bargaining | “Alternating-offer equilibrium” | 带 discounting 的 infinite-horizon bargaining 的 game-theoretic model。 |
| CoT concealment | “隐藏你的推理” | arXiv:2503.06416 的获胜者保留 private scratchpads；public channel 只显示 offer。 |
| Persona manipulation | “情绪姿态” | arXiv:2402.05863：从 desperation/urgency personas 获得约 20% payoff gain。 |

## 延伸阅读

- [NegotiationArena](https://arxiv.org/abs/2402.05863) referência;manipulação pessoal
- [Measuring Bargaining Abilities of Language Models](https://arxiv.org/abs/2402.15813) OG-Narrador, bem como comprador-mais duro do que vendedor  resultados
- [Large-Scale Autonomous Negotiation Competition](https://arxiv.org/abs/2503.06416)                                                                                                                                                                                                                                                              
- [LLM-Stakeholders Interactive Negotiation (NeurIPS 2024)](https://proceedings.neurips.cc/paper_files/paper/2024/file/984dd3db213db2d1454a163b65b84d08-Paper-Datasets_and_Benchmarks_Track.pdf) 带秘密公用品 的多方可评分博
- [Smith 1980 — The Contract Net Protocol](https://ieeexplore.ieee.org/document/1675516) 经典机制,IEEE Transações em Computadores
