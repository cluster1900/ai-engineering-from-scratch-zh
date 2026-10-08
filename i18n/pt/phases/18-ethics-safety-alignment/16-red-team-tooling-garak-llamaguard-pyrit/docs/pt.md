# Ferramentas da Equipe Vermelha  Garak, Guarda Lama, PyRIT

> Três ferramentas de produção compõem o quadro da pilha de equipe vermelha de 2026: Llama Guard (Meta)  Uma Llama-3.1-8B 分类器, baseada em 14 MLCommons 危害类别进行调整; Llama Guard 4 de 2025 é um 12B 原生多摩达分类器, de Llama 4 Scout 剪剪而来来来. Garak (NVIDIA)  开源 LLM 漏洞扫描器, fornecer probas estáticas, dinâmicas, 和适应性,用于幻觉, jail data leakage, 毒性和破裂.

**类型：**Construir
**语言：**Python (stdlib, simulador de arquitetura de ferramentas e simulação de classificador de estilo Llama Guard)
**先修要求：**Fase 18 · 12-15 (prisioneros e IPI)
**时间：**- 75 minutos.

## Objectivo de aprendizagem

- 描述 Llama Guard 3/4 在安全堆中位置:input classifier、output classifier,或两者兼具──
- Explicar 14 MLCommons 危害类别,并说明一个不明显的类别 (Code Interpreter Abuse)
- 描述 Garak's probe 架构:probes、detetores、harnesses。
- Descreva a estrutura da campanha de várias rotas do PyRIT, bem como como como ela se combina com as sondas Garak 组合──

## 问题

Lições 12-15  mostraram a face de ataque. A produção de equipes precisa de avaliação reprodutiva.

## 概念

### Guarda de lama (Meta)

Llama Guard 3 é um modelo Llama-3.1-8B, dirigido a MLCommons AILuminate 14 个类别                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
- Violência criminal、 não violência crime、sexualrelated、CSAM、 calúnias
- 专业建议、隐私、IP、无差别武器、仇恨
- Autóide/auto-heridas, sexo, eleições, abuso de intérprete de código

支持 8种语言──用法:放在 LLM 之前(input moderation)、LLM 之后(output moderation),或两者都放──两种用法会产生不同的训练分布  Llama Guard 3 以单一模型形式发布,同时处理两者──

Llama Guard 3-1B-INT4 (arXiv:2411.17713, 440MB, 移动 CPU 上约 ~30 tokens/s) 量化后的边缘 变体──

Llama Guard 4 (Llama Guard 4 (Llama Guard 4)) é um 12B, original Multimodal, de Llama 4 Scout 剪剪而来── utilizou um divisor de texto + imagens que pode ser inserido, substituindo o anterior 8B 文本和 11B vision 版本──.

### Garak (NVIDIA)

开源漏洞扫描器──架构:
- **Probes.**Utilizando alucinação, vazamento de dados, injeção rápida, toxicidade, geradores de ataques de jailbreaks, etc.
- **Detectors.**De acordo com o modelo de falha esperado para o lançamento, toxicidade, vazamento, prisão de veículos.
- **Harnesses.**管理 probe-detector 对,运行运动,生成报告──

TrustyAI vai Garak e escudos Llama-Stack ((Prompt-Guard-86M classificador de entrada Llama-Guard-3-8B classificador de saída) integrado, utilizado de extremo a extremo escudo-alvo  avaliação。 pontuação baseada em níveis (TBSA) 取代二元 pass/fail  一个模型可以在同一探测上通过严重度级 3,但在严重度级 5 失败──

### PyRIT (Microsoft)

Python Risk Identification Toolkit──多轮红团运动──围绕以下部分构建:
- **Converters.**Transformar um semente de resposta para parafrasear, codificar, traduzir, interpretar.
- **Orchestrators.**运行 campanha:Crescendo(升级) TAP(分支) RedTeaming(自定义循环) 
- **Scoring.**LLM-como juiz ou classificador-como juiz

O PyRIT é o Garak 更重的近亲──Garak 运行数千个单轮探测;PyRIT 运行深度多轮运动,旨在攻破特定失败模式──

### Estaca

Em ambos os lados do modelo estão colocados os guardas de lama.

###  avaliações

- **Judge identity.**Três ferramentas podem ser utilizadas para a avaliação de jurados de LLM;Justice calibration 会驱动报告的ASRs (Lessão 12)
- **Probe staleness.**随着模型针对探测器被补丁,Garak探测器 会老化──Adaptive probes(PAIR-shaped) Than static probes 老化更慢──
- **Llama Guard 对良性内容的 FPR.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

### Está na fase 18 .

Lições 12-15 é ataque. Lição 16 é ferramenta de produção. Lição 17 (WMDP) é avaliação de capacidade de duplo uso. Lição 18 é marcos de segurança fronteiriça, que incorporam essas ferramentas em políticas.


```figure
al-guard-stack
```

## Use-o

`code/main.py`Construir um classificador de estilo brinquedo Llama Guard (en:                                                                                                                                                                                                                                                      

## Entrega-o

本课会生成 `outputs/skill-red-team-stack.md` Dedicar uma descrição de implementação, que indicará quais dos três instrumentos são adequados  o que cada instrumento deve configurar e qual cadência de regressão deve ser executada 

## 练习

1. 运行 `code/main.py`❖ Comparar classificador estilo Llama-Guard em ataques de uma única rodada com ataques de várias rodadas ❖

2. 实现 uma nova sonda Garak: um pedido prejudicial base64 编码的.

3. Usar um conversor "traduzir para francês, então parafrasear"  ampliar a cadeia de conversores de estilo PyRIT―重新测量攻击成功率―

4. 阅读Llama Guard 3 的危害类别列表―― encontrar duas categorias, em estas categorias, em formação DATA现实中会对合法开发者内容产生较高的虚假阳性率――

5. Comparar Garak 和 PyRIT 的设计原理──论证一个部署场景,其中每个工具分别是正确选择──

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|------|-----------------|------------------------|
| Llama Guard | "the classifier" | 带有 14 个危害类别的 fine-tuned Llama-3.1-8B/4-12B 安全分类器 |
| Garak | "the scanner" | NVIDIA 开源漏洞扫描器；probes、detectors、harnesses |
| PyRIT | "the campaign tool" | Microsoft 多轮 red-team orchestrator；converters、orchestrators、scoring |
| Prompt-Guard | "the small classifier" | Meta 的 86M prompt-injection classifier，与 Llama Guard 配套使用 |
| TBSA | "tier-based scoring" | Garak 的 tier-based pass/fail，用于取代二元结果 |
| Converter chain | "paraphrase + encode + ..." | PyRIT 用于构建多步攻击的组合原语 |
| MLCommons hazard categories | "the 14 taxonomies" | Llama Guard 面向的行业标准分类体系 |

## 延伸阅读

- [Meta — Llama Guard 3 (in Llama 3 Herd paper, arXiv:2407.21783)](https://arxiv.org/abs/2407.21783) 8B 分类器
- [Meta — Llama Guard 3-1B-INT4 (arXiv:2411.17713)](https://arxiv.org/abs/2411.17713) 量化移动端分类器
- [NVIDIA Garak — GitHub](https://github.com/NVIDIA/garak) 扫描器 repo 和文档
- [Microsoft PyRIT — GitHub](https://github.com/Azure/PyRIT) conjunto de ferramentas de campanha
