# Décodage spéculatif de l'EGLE-3 dans le milieu de production

> Le décodage spéculatif va être un modèle de projet rapide avec le modèle cible 配对──draft  proposer K 个 Token;target 个一次前进 中验证; accepté Token 个免费──到2026年,EAGLE-3 est une variante de classe de production, il entraîne le projet à l'état caché du modèle cible, plutôt que dans le train de la première Token, de sorte que dans la discussion générale, le taux d'acceptation alpha 推至 0.6-0.8 区间── le vrai problème n'est pas draft 个多快, mais  mon alpha 流量 个多是多少? Si c'est inférieur à environ 0.55, le décodage spéculatif en haute émission se transforme en bénéfice net négatif, car chaque projet rejeté consomme une deuxième fois le code cible 个书 读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读读

**类型：**Apprendre à apprendre
**语言：**Python(stdlib, simulateur de taux d'acceptation de jouets)
**先修要求：**Phase 17 · 04(vLLM Servant Internes),Phase 10 · 18(Prédition multi-tokens)
**时间：**À environ 60 minutes.

## Objectif de l'apprentissage

- Pour expliquer la décodage spéculatif de trois générations, il a expliqué que l'Eagle-3 par rapport à l'Eagle-2 et le modèle classique de projet 改变了什么──
- 定义接受率 alpha,根据 alpha 和 K(草案长度)计算预期加速,并识别目标并发下破平式 alpha──
- Expliquer pourquoi le décoding spéculatif dans vLLM 2026 est opt-in (non par défaut), ainsi que pourquoi ne pas mesurer alpha dès le début de la production contre mode.
- 写出测量计划: utiliser quel point de référence, quelle distribution rapide, quel point de concurrence, quelles mesures, comme référence.

##  problématique

Le décodeur est lié à la mémoire. Dans un système de fonctionnement Llama 3.3 70B FP8 H100, chaque jeton décodé prend environ 140 Go/s de poids et sort un jeton.

Le décoding spéculatif a utilisé cette différence. Il utilise un modèle de projet peu coûteux pour créer des jetons K 个候选, puis permet au modèle cible de vérifier tous les jetons K 个在一次前进通行中验证所有 K 个.

经典草案模型 方法使用同一家族的更小模型(Llama 3.2 1B 为 Llama 3.3 70B起草案)  它能工作,但接受率一般,因为更小模型的分布会偏离目标──EAGLE、EAGLE-2,再到EAGLE-3,直接在目标模型的内部状态上训练轻量草案头,因此草案的分布更紧跟目标──这就是为什么alpha会从草案模型的0.4升至EAGLE-3的0.6-0.8──

关键限制:EAGLE-3 在 vLLM 2026 中是选择进.`speculative_config` Pas de drapeau, pas d'accélération. Si l'équipe ne mesure pas le flux réel alpha, elle s'ouvre directement, elle voit souvent la latence de la queue 变差, plutôt que 变好.

## 概念

### Le décoding spéculatif a effectivement apporté quoi ?

没有规范解码时,每个代币的成本是一个目标前进. 时,使用草案长 K 和接受 alpha的规范解码时,每次目标前进的预期代币数是`1 + K * alpha`◊ Accélérer que `(1 + K * alpha) / (1 + epsilon)`, dont l'epsilon est le coût de révision des projets et de vérification. Pour K=5, alpha=0,7:`(1 + 5*0.7) / (1 + 0.1) = 4.5 / 1.1 = 4.1x`◊ Les chiffres du monde réel se concentrent généralement sur 2-3x, car l'alpha du flux de production est très faible, et l'epsilon se concentrera sur la taille du lot.

### Pourquoi l' alpha est la seule métrique importante

Les jetons rejetés ne disparaîtront pas, ils seront obligés de poursuivre la deuxième cible pour le premier jeton rejeté. Dans la plupart des appareils de 2026 alpha est inférieur à 0,55 heures, le décodage spécifique est en pratique un net résultat négatif.

Alpha 会随着工作负载变化──在 ShareGPT 风格的通用聊天天天,使用 ShareGPT 训练的EAGLE-3 能达到0.6-0.8──在域特定流量(code、medical、legal) 上,使用通用数据训练的草案头 会降至0.4-0.6──训练域特定草案头可以恢复 alfa;相比于目标细节调整,这是一个轻量、快速的训练任务──

### L'AIGLE 代际一览

- **经典 draft model**Les projets de développement de la société sont en cours de réalisation.
- **EAGLE-1（2024）**Le niveau de formation est de 0,5-0,6 à 0,6 par rapport à la taille de l'objectif.
- **EAGLE-2（2025）**Le projet de loi est un projet de loi qui a été adopté par le gouvernement de l'État de l'Allemagne.
- **EAGLE-3（2025-2026）**Le projet de tête dans plusieurs couches cibles 上 тренинг(((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((

### 2026 Coupe de production

1. Il s'agit d'un modèle de référence de la ligne de référence TTFT、ITL、throughput。
2.  À travers VLLM `speculative_config`Initiation du projet EAGLE-3  Réutilisation du point de référence 
3. 记录 acceptation rate alpha──vLLM V1 en général`spec_decode_metrics.accepted_tokens_per_request` À l'exception de la longueur du projet demandé, il est possible d'obtenir un alpha
4. Si la distribution de production de flux 上 alpha < 0,55, désactiver le décode spécifique, ou entraîner le projet EAGLE-3 spécifique au domaine
5. Dans la production et la mise en service, confirme que le P99 ITL n'a pas changé.

### Produit: P99 queue

Le décodage spécifique Réduira la moyenne de l'ITL. Si aucun ajustement n'est fait, P99 pourrait changer.

### L'ÉGLE-3 est déjà déployé

Google a déployé le décoding spéculatif en 2025 dans les revue d'IA.`speculative_config`作为文档化接口发布;N-gram GPU Spekulative decoding 中V1 是兼容零碎预填的变体──SGLang 支持EAGLE-3,并将其作为预写重工作负载的推草案路径──

### Une ligne de calcul

预期加速:`S(alpha, K) = (1 + K*alpha) / (1 + verify_overhead)`Il est en train de mourir.`S = 1`- Je peux le faire.`alpha_breakeven = verify_overhead / K` Pour le type de charge de vérification ≈ 0,15 ≈ K=5:`alpha_breakeven = 0.03`, mais c'est le décode original 数学., vérifier la charge de décharge, augmenter, tandis que le décode de lot  déjà dans plusieurs séries de lecture de la mémoire, donc en pratique, le taux d'alpha_breakeven valide, augmenter à environ 0,45-0,55.

### Ne pas utiliser le décoding spéculatif

- Batch-1 离线生成,且延迟不重要──使用普通目标──
- 输出很短(低于50 Token) ――Draft overhead 和 verifier le coût 占主导。
- 没有领域-trained draft head 的专业领域──Alpha 太低──
- vLLM v0.18.0 加 décodage des spécifications du modèle de projet 加 `--enable-chunked-prefill`◊ Ce composé est impossible à compiler. L'exception de la documentation est le décodeur de spécifications de la GPU N-gramme de V1.


```figure
mx-speculative-tree
```

## Utilisez-le

`code/main.py`Il imprime un cycle de décoding sans décoding spéculatif. Il imprime une boucle de décoding de décoding de décoding. Il imprime un cycle de décoding de décoding spéculatif.

## Je le livre.

本课产 出 `outputs/skill-eagle3-rollout.md` Un modèle cible  une distribution du trafic  une description et une cible de concurrence, qui génèrent un plan de déploiement EAGLE-3 en phase par phase: référence de référence  une configuration en mesure alpha  une mesure alpha >= 0,55  un point de vue P99 ITL 

## 练习

1. 运行  référencement`code/main.py`Pour obtenir une vitesse de 2x, il faut une vitesse d'alpha 3x.
2. supposons que le flux de production soit de 70% ≈ 30% ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ CODE ≈ ≈ CODE ≈ CODE ≈ ≈ CODE ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ 
3. 阅读 vLLM `speculative_config`文档──说出三种模式(drafts model、EAGLE、N-gram), ainsi qu'une pré-remplissage en morceaux de type complémentaire.
4.  Activation de l'EAGLE-3  Après vous voyez la moyenne de l'ITL baisser de 25%, mais la P99 ITL augmenter de 15%―
5. 计算 Llama 3.3 70B de EAGLE-3 projet tête de mémoire coût──il est comparé à Llama 3.2 1B 作为经典草案 运行相比怎么样?

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Speculative decoding | “draft plus verify” | 用便宜模型提出 K 个 Token，在一次 target forward 中验证全部 K 个 |
| Acceptance rate alpha | “spec accept rate” | draft Token 被 target 接受的比例；唯一重要的 metric |
| Draft length K | “spec k” | 每次 target forward 中 draft 提出的 Token 数；典型值 4-8 |
| Verify overhead epsilon | “spec overhead” | verify-and-reroll 相比普通 target forward 的额外成本；随 batch 增长 |
| EAGLE-3 | “latest EAGLE” | 2025-2026 变体；在多个 target layers 上训练 draft head；通用聊天上 alpha 0.6-0.8 |
| `speculative_config` | “vLLM spec config” | vLLM V1 中显式 opt-in；没有默认值就没有加速 |
| N-gram spec decode | “N-gram draft” | 使用 prompt 中 N-gram lookups 的 GPU-side draft；兼容 chunked-prefill |
| Break-even alpha | “no-op alpha” | spec decode 提供零加速时的 alpha；在生产并发下关注它 |
| Rejected-draft two-pass | “reroll cost” | drafts 被拒绝时发生两次 target forward；推高 P99 tail |

## 延伸阅读

- [vLLM — Speculative Decoding docs](https://docs.vllm.ai/en/latest/features/spec_decode/) `speculative_config`Et V1 en décomposé pré-remplisseur
- [vLLM Speculative Config API](https://docs.vllm.ai/en/latest/api/vllm/config/speculative/) 精确字段集合──
- [EAGLE paper (arXiv:2401.15077)](https://arxiv.org/abs/2401.15077) Origini EAGLE tête de tirage
- [EAGLE-2 paper (arXiv:2406.16858)](https://arxiv.org/abs/2406.16858) projets adaptatifs 和 arbres
- [UC Berkeley EECS-2025-224](https://www2.eecs.berkeley.edu/Pubs/TechRpts/2025/EECS-2025-224.html) Utilisation de système de décoding spéculatif de LLM à haut rendement
- [BentoML — Speculative Decoding](https://bentoml.com/llm/inference-optimization/speculative-decoding) Liste de contrôle de déploiement de produits
