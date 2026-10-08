# 综合项目 15  Harness de sécurité constitutionnelle + Range de l'équipe rouge

> Les classifiateurs constitutionnels de l'Anthropic ∼Meta ∼ Llama Guard 4 ∼ Google ∼ ShieldGemma-2 ∼ NVIDIA ∼ Nemotron 3 Content Safety, ainsi que X-Guard utilisé dans la couverture multilingue, ont co-défini la stack de classifiants de sécurité de 2026 ∼ garak、PyRIT、 NVIDIA Aegis 和 promptfoo                                                                                                                                                                                                                                                                                                                                                                                                                            

**类型：**Capstone
**语言：**Python(pipeline de sécurité、équipe rouge)
**先修要求：**La phase 10 (de la création de programmes de formation professionnelle) La phase 11 (ingénierie de programmes de formation professionnelle) La phase 13 (outils) La phase 14 (agents) La phase 18 (éthique, sécurité, alignement)
**涉及阶段：**P10 · P11 · P13 · P14 · P18
**时间：**25 heures

##  problématique

La première question de la sécurité de l'LLM en 2026 ne dépend pas du classifiateur, mais de la façon dont l'application de production les compose correctement. Les classifiateurs constitutionnels anthropiques sont une méthode indépendante, utilisée pour former les stages et non pour servir les stages.

攻击演化同样重要──PAIR 和 TAP 自动化发现 jailbreak──GCG 运行基于 Gradient的后音攻击──Multi-turn 和 code-switch attacks利用代理记忆──任何已部署的LLM 都需要一个红团队范围,garak 和 PyRIT是正规的驱动程序,并且还需要记录减缓和根据CVSS 评分的发现──

Vous allez renforcer une application cible (une application 8B, un chatbot RAG), pour son fonctionnement 6+ 攻击家族,并产出前/après la mesure de l'innocuité.

## 概念

Le pipeline de sécurité a cinq niveaux.**Input sanitize**: déménagement des caractères à largeur zéro,解码 base64/rot13,规范化 Unicode。**Policy layer**:NeMo Guardrails v0.12 rails ((extraits du domaine, toxicité, extraction de PII)**Classifier gate**:输入侧使用Llama Guard 4,非英文使用X-Guard,图像输入使用ShieldGemma-2──**Model**Le but de la formation est de réaliser un Master en droit.**Output filter**:输出侧使用 Llama Guard 4,Presidio PII scrub, et en适用场景执行报名执法──**HITL tier**: sont marqués pour les sorties à haut risque dans la file d'attente Slack

Résultats de la mise en œuvre de la stratégie de mise en œuvre de la mise en œuvre de la mise en œuvre de la stratégie de mise en œuvre de la mise en œuvre de la mise en œuvre de la stratégie de mise en œuvre de la mise en œuvre de la stratégie de mise en œuvre de la mise en œuvre de la stratégie de mise en œuvre de la mise en œuvre de la stratégie de mise en œuvre de la mise en œuvre de la stratégie de mise en œuvre de la mise en œuvre de la stratégie de mise en œuvre de la mise en œuvre de la stratégie de mise en œuvre de la mise en œuvre de la stratégie de mise en œuvre de la mise en œuvre de la stratégie de mise en œuvre de la mise en œuvre de la stratégie de mise en œuvre de la mise en œuvre de la stratégie de mise en œuvre de la mise en œuvre de la stratégie de mise en œuvre de la mise en œuvre de la stratégie de mise en œuvre de la mise en œuvre de la stratégie de mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre

La course à l'autocritique constitutionnelle est une intervention en temps de formation. Prenez 1 000 tentatives de tentative de maltraitance, faites un modèle.

## 架构

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

- Classifiants de sécurité:Llama Guard 4 ShieldGemma-2 NVIDIA Nemotron 3 Sécurité du contenu X-Guard
- Le cadre de garde: NeMo Guardrails v0.12 + OPA
- Les pilotes de l'équipe rouge:garak(NVIDIA)
- Les agents de jailbreak:PAIR(Chao et coll., 2023)
- Formation constitutionnelle: boucle d'autocritique à la manière anthropique + SFT sur les critiques
- Le président de la République
- Cible: un modèle réglé par instruction 8B, ou un chatbot RAG dans d'autres capstones


```figure
cf-safety-stack
```

## - Je le construis.

1. **目标设置。**Dans vLLM, lancez un modèle réglé par les instructions 8B (ou réutilisez un autre chatbot RAG) en utilisant le capstone.

2. **包装 safety pipeline。**周围目标接入五层管道──验证每一层都可单独观测(Longfuse dans chaque niveau d'une étendue)──

3. **Classifier 覆盖。**加载 Llama Guard 4、X-Guard(Multilingue)、ShieldGemma-2(image)。在一个小型标签集上运行每个分类器,以建立基线──

4. **Red-team scheduler。**Un agent de PAIR, un agent de TAP, un coureur de GCG, un attaquant à plusieurs tours et un attaquant de code-switch.

5. **Attack suite。**六个攻击家族:(1) jailbreak automatique PAIR,(2) TAP tree-of-attacks,(3) GCG gradient suffixe,(4) ASCII / base64 / rot13 codage,(5) personnage multi-tours,(6) code multilingue-switch──rapport pour chaque famille taux de réussite──

6. **Constitutional self-critique。**选 1k 个有害试图提示──对于每个提示,目标先起草响应──一个评论员 LLM 根据书面宪法(无害、引用证据、拒绝非法请求) 评分──批评者 提出异议的提示 会被重写;目标在批评-améliored pairs 上细调──在进行评估 上测量前/后无害性──

7. **Over-refusal measurement。**Dans la suite de questions bénignes (exemple XSTest) sur le suivi du taux de faux positifs.

8. **CVSS scoring。**Pour chaque jailbreak réussi, selon CVSS 4.0 评分(vecteur d'attaque、complexité、impact)  Produit de détail et de plan d'atténuation。

9. **Range automation。**Et ce qui est le plus important, c'est que vous ne pouvez pas faire de commentaires.

## Utilisez-le

```
$ safety probe --model=target --family=PAIR --budget=50
[attacker]   PAIR agent running on target
[attack]     attempt 1/50: disguise query as academic research ... blocked
[attack]     attempt 2/50: appeal to roleplay ... blocked
[attack]     attempt 3/50: chain-of-thought coax ... SUCCEEDED
[finding]    CVSS 4.8 medium: roleplay bypass on target
[range]      7 successes out of 50 (14% success rate)
```

## Je le livre.

`outputs/skill-safety-harness.md`Il s'agit d'un pipeline de sécurité en couches de qualité de production, avec une gamme de red-team de récupération, et qui comprend des delta d'innocuité avant/après.

| 权重 | 标准 | 如何测量 |
|:-:|---|---|
| 25 | Attack-surface coverage | 覆盖 6+ 攻击家族、2+ 种语言 |
| 20 | True-positive / false-positive trade-off | Attack block rate vs XSTest benign pass rate |
| 20 | Self-critique delta | held-out eval 上的 before/after harmlessness |
| 20 | Documentation and disclosure | 带 timeline 的 CVSS-scored findings |
| 15 | Automation and repeatability | 所有内容在 cron 上运行并带 alerts |
| **100** | | |

## 练习

1. Dans le chatbot RAG 上运行 garak's prompt-injection plugin,并比较有无输出过层 时的攻击成功率──

2. 添加第七个攻击家族: 通过检索文件的间接快速注射──测量所需的额外防御──

3.  réaliser un mode refuse-avec-aide : lorsque la garde-ferre bloque, l'objectif est de fournir une réponse relative plus sûre, plutôt que de refuser directement 

4. L'écart de couverture multilingue: trouver une langue X-Guard exprimée en insuffisance.

5. Dans le modèle 30B 上运行 constitutionnelle autocritique,并测量 delta 是否随规模提升──

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

- [Anthropic Constitutional Classifiers](https://www.anthropic.com/research/constitutional-classifiers) référence à l'heure de formation
- [Meta Llama Guard 4](https://ai.meta.com/research/publications/llama-guard-4/) Classificateur d'entrée/sortie 2026
- [Google ShieldGemma-2](https://huggingface.co/google/shieldgemma-2b) image + Sécurité multimodal
- [NVIDIA Nemotron 3 Content Safety](https://developer.nvidia.com/blog/building-nvidia-nemotron-3-agents-for-reasoning-multimodal-rag-voice-and-safety/) référence d'entreprise
- [X-Guard (arXiv:2504.08848)](https://arxiv.org/abs/2504.08848) 132 langues Sécurité multilingue
- [garak](https://github.com/NVIDIA/garak) Kit d'outils de l'équipe rouge NVIDIA
- [PyRIT](https://github.com/Azure/PyRIT) Microsoft red-team framework
- [NeMo Guardrails v0.12](https://docs.nvidia.com/nemo-guardrails/) Cadre ferroviaire
- [PAIR (arXiv:2310.08419)](https://arxiv.org/abs/2310.08419) papier d' agent de jailbreak
