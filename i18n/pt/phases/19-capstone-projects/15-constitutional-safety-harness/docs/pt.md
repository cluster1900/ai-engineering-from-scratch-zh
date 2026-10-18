# 综合项目 15  Armadura de segurança constitucional + Red-Team Range

> Os classificadores constitucionais Antropic ✓ Meta ✓ Llama Guard 4 ✓ Google ✓ ShieldGemma-2 ✓ NVIDIA ✓ Nemotron 3 Content Safety, bem como para uso em X-Guard ✓ Multilingual ✓ Coverage, definiram em conjunto o ano 2026 ✓ Stack de classificação de segurança ✓ Garak ✓ Pirit ✓ NVIDIA Aegis 和 promptfoo ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓

**类型：**Capstone
**语言：**Python(pipeline de segurança、equipa vermelha)、YAML(configurações de políticas)
**先修要求：**Fase 10 ((desde zero construção de LLM) Fase 11 ((engenharia de LLM) Fase 13 ((ferramentas) Fase 14 ((agentes) Fase 18 ((ética]], segurança, alinhamento)
**涉及阶段：**P10 · P11 · P13 · P14 · P18
**时间：**25 小时

## 问题

O problema da segurança do LLM em 2026 não é se o classificador é válido, mas como o aplicativo de produção os combina, já que não é exagerado, nem deixa falta uma clara vulnerabilidade.

ATAKING EVENIMENT ISTANTIVE. PAIR 和 TAP Automatização de detecção de jailbreak. GCG 运行 运行基于 Gradient 的后尾攻击.

Você vai confirmar uma aplicação de objetivo ((( um modelo 8B com instruções sintonizadas, ou um chatbot RAG entre outras pedras de chefe), para sua execução 6+  атака家族,并产出前/後無害度測定──

## 概念

O tubo de segurança tem cinco camadas.**Input sanitize**:移除 zero-width chars,解码 base64/rot13,规范化 Unicode。**Policy layer**:NeMo Guardrails v0.12 relhos ((fora do domínio、toxicidade、 extracção de PII) **Classifier gate**:输入侧使用Llama Guard 4,非英文使用X-Guard,图像输入使用ShieldGemma-2──**Model**Objectivo: LLM.**Output filter**Output Side: usar Llama Guard 4, Presidio PII scrub, e aplicar em cenário executar a aplicação da citação.**HITL tier**: são marcados como alta risco de saída para entrar na fila Slack.

RED-TEAM range 按计划器 运行──PAIR 和 TAP 自主发现 jailbreak──GCG 运行基于 Gradient 的后尾攻击──ASCII / base64 / rot13 codificando ataques──Multi-turn attacks(persona adopção、memória exploração)──Code-switch attacks(混合英语与斯瓦希里或泰语)──每次运行都会产出一个结构化发现文件,包含CVSS得分和披露时间线──

A autocrítica constitucional é uma intervenção no tempo de treinamento.

## Arquitetura

```
request (text / image / multilingual)
      |
      v
input sanitize (strip zero-width, decode, normalize)
      |
      v
NeMo Guardrails v0.12 rails (off-domain, policy)
      |
      v
classifier gate:
  Llama Guard 4 (English)
  X-Guard (multilingual, 132 langs)
  ShieldGemma-2 (image prompts)
  Nemotron 3 Content Safety (enterprise)
      |
      v (allowed)
target LLM
      |
      v
output filter: Llama Guard 4 + Presidio PII + citation check
      |
      v
HITL tier for flagged outputs

parallel:
  red-team scheduler
    -> garak (classic attacks)
    -> PyRIT (orchestrated red team)
    -> autonomous jailbreak agent (PAIR + TAP)
    -> GCG suffix attacks
    -> multilingual / code-switch
    -> multi-turn persona adoption

output: CVSS-scored findings + disclosure timeline + before/after harmlessness delta
```

## 技术

- Classificadores de segurança:Llama Guard 4 ShieldGemma-2 NVIDIA Nemotron 3 Segurança de conteúdo X-Guard
- Estrutura de guarda-rail:NeMo Guardrails v0.12 + OPA
- Os drivers do time vermelho:garak(NVIDIA) PyRIT(Microsoft Azure) NVIDIA Aegis、promptfoo
- Agentes de fuga de prisão:PAIR(Chao et al., 2023)
- Formação constitucional:Loop de autocrítica de estilo antropológico + SFT sobre críticas
- Presidio
- Alvo: um modelo 8B com instruções sintonizadas, ou um chatbot RAG entre outras pedras de segurança


```figure
cf-safety-stack
```

## Construí-lo

1. **目标设置。**Em vLLM 上 inicie um modelo com instruções 8B ajustadas (ou replique outro chatbot RAG em capstone)

2. **包装 safety pipeline。**周围目标接入五层管道――验证 每一层都可单独观测(Langfuse 中每层一个跨度) 』

3. **Classifier 覆盖。**加载 Llama Guard 4、X-Guard(Multilíngue)、ShieldGemma-2(imagem)──在一个小型标签的集合上运行每个分类器,以建立基线──

4. **Red-team scheduler。**调度 garak、PYRIT、 um agente PAIR、 um agente TAP、 um corredor GCG、 um atacante multi-turn 和一个代码-switch攻击者──每个都在单独队上运行──

5. **Attack suite。**六个攻击家族:(1) PAIR jailbreak automático,(2) TAP tree-of-attacks,(3) GCG gradient suffix,(4) ASCII / base64 / rot13 codificação,(5) multi-turn persona,(6) multilingual código-switch──報告每个家族的成功率──

6. **Constitutional self-critique。**选 1k 个害意试点提示──对于每个提示,目标先起草响应──一个评论员 根据书面宪法(无害、引用证据、拒绝非法请求) 评分──评论员 提出异议的提示 会被重写;目标在批判改善对上细调──在进行的评估上测量前/后无害性──

7. **Over-refusal measurement。**Na suíte de resposta benigna (por exemplo, XSTest) na taxa de seguimento de falsos positivos.

8. **CVSS scoring。**Para cada jailbreak bem sucedido, conforme o CVSS 4.0 评分(vector de ataque、complexidade、impacto)  produção de cronograma de divulgação 和 plano de mitigação。

9. **Range automation。**O que está no cron é o que está no cron.

## Use-o

```
$ safety probe --model=target --family=PAIR --budget=50
[attacker]   PAIR agent running on target
[attack]     attempt 1/50: disguise query as academic research ... blocked
[attack]     attempt 2/50: appeal to roleplay ... blocked
[attack]     attempt 3/50: chain-of-thought coax ... SUCCEEDED
[finding]    CVSS 4.8 medium: roleplay bypass on target
[range]      7 successes out of 50 (14% success rate)
```

## Entrega-o

`outputs/skill-safety-harness.md`É um dos principais componentes da linha de segurança em camadas de produção, mais uma gama de equipes vermelhas, que inclui antes/após os delta de inocuidade.

| 权重 | 标准 | 如何测量 |
|:-:|---|---|
| 25 | Attack-surface coverage | 覆盖 6+ 攻击家族、2+ 种语言 |
| 20 | True-positive / false-positive trade-off | Attack block rate vs XSTest benign pass rate |
| 20 | Self-critique delta | held-out eval 上的 before/after harmlessness |
| 20 | Documentation and disclosure | 带 timeline 的 CVSS-scored findings |
| 15 | Automation and repeatability | 所有内容在 cron 上运行并带 alerts |
| **100** | | |

## 练习

1. Em RAG chatbot 上运行 garak's prompt-injection plugin,并比较有无输出过层 时的攻击成功率──

2. 添加第七个攻击家族: através da injeção direta de documentos recuperados.

3.  Realizar um refus-with-help 模式: quando o guardrail bloqueia, o objetivo é fornecer uma resposta relacionada mais segura, em vez de rejeitar diretamente.

4. Gap de cobertura multilíngue: encontrar uma linguagem de exibição de X-Guard insuficiente. Propõe um conjunto de dados de sintonia fina para o mesmo.

5. Em 30B modelo 上运行 constitucional autocrítica,并测量 delta 是否随规模提升──

## 关键术语

| 术语 | 常见说法 | 实际含义 |
|------|-----------------|------------------------|
| Layered safety | “Defense in depth” | 在 input、gate、output、HITL 多处设置 guardrails |
| Llama Guard 4 | “Meta's safety classifier” | 2026 年参考级 input/output content classifier |
| PAIR | “Jailbreak agent” | 关于 LLM-driven jailbreak discovery 的论文（Chao et al.） |
| TAP | “Tree-of-Attacks” | PAIR 的 tree-search 变体 |
| GCG | “Greedy coordinate gradient” | 基于 Gradient 的 adversarial suffix attack |
| Constitutional self-critique | “Anthropic-style training” | Target drafts -> critic scores -> rewrite -> retrain |
| XSTest | “Benign probe set” | 用于 over-refusal regression 的 benchmark |
| CVSS 4.0 | “Severity score” | safety findings 的标准 vulnerability scoring |

## 延伸阅读

- [Anthropic Constitutional Classifiers](https://www.anthropic.com/research/constitutional-classifiers) Referência ao tempo de formação
- [Meta Llama Guard 4](https://ai.meta.com/research/publications/llama-guard-4/) Classificador de entrada/saída de 2026
- [Google ShieldGemma-2](https://huggingface.co/google/shieldgemma-2b) imagem + Segurança multimodal
- [NVIDIA Nemotron 3 Content Safety](https://developer.nvidia.com/blog/building-nvidia-nemotron-3-agents-for-reasoning-multimodal-rag-voice-and-safety/) Referência empresarial
- [X-Guard (arXiv:2504.08848)](https://arxiv.org/abs/2504.08848) 132-Linguagem Segurança multilíngue
- [garak](https://github.com/NVIDIA/garak) Kit de ferramentas da equipe vermelha da NVIDIA
- [PyRIT](https://github.com/Azure/PyRIT) Framework do Microsoft Red Team
- [NeMo Guardrails v0.12](https://docs.nvidia.com/nemo-guardrails/) Estrutura ferroviária
- [PAIR (arXiv:2310.08419)](https://arxiv.org/abs/2310.08419)Papel de agente de jailbreak
