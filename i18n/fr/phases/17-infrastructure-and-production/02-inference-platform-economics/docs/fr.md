# 推理平台经济学  Feuilletons  Ensemble Basèt­ne Modal Replicate Anyscale

> Le marché de l'infrastructure de l'application de la technologie (GPU) est en train de devenir un marché de l'information et de la technologie.$1/hr，而 $4B  évaluation et traitement de 10T+ par jour des jetons ont montré le volume-driven 模型是可行的──Baseten 于 2026 年 1 月 以$5B 估值完成了 $300M série E。 compétition 定位规则很简单:Fireworks 优化延迟,Together 优化目录宽度,Baseten 优化企业抛光,Modal 优化Python-native DX,Replicate 优化多模范围,Anyscale 优化分布式Python。本课会给你一个可以直接交给创始人的矩阵──

**Type:** Learn
**Languages:** Python (stdlib, toy per-call economics comparator)
**前置要求:**Phase 17 · 01 (plateformes de gestion de la LLM), phase 17 · 04 (internes de gestion de la LLM)
**Time:** ~60 minutes

## Objectif de l'apprentissage
- Il y a trois segments de marché: les plateformes de silicium personnalisées, les plateformes GPU, les API-first, et chaque fournisseur.
- Expliquer pourquoi le modèle de tarification de l'API "par jeton" va vers la courbe de coût du moteur de service 收, plutôt que vers la courbe de coût du matériel 收──
- 計算至少三供應商的每次请求有效成本,并解释什么时候/minute (basétain, modal) 胜过/token,
- 识别给定工作负载的正确默认平台(serverless bursty、stable high-throughput、fine-tuned variants、Multimodal)

##  problématique
Vous avez déjà évalué le système de gestion de la hypercalculer. Vous avez décidé de trouver un fournisseur plus petit et plus rapide.$/M tokens；Baseten 显示 $/minute; Modal 显示 $/second；Replicate 显示 $Si vous ne faites pas face à la charge de travail, vous ne pouvez pas les faire face à face.

Pire encore, chaque page de tarification 背后的商业模式都不同──Fireworks 在共享 GPU 上运行自己的定制引擎(FireAttention); par token rate 反映它们的利用率曲线──Baseten 给你Truss + dedicated GPUs; per minute 反映了独占性──Modal 模型是真正的Python serverless:per-second billing,并且冷开始可低于一秒──相同输出(一个LLM响应),三种不同的成本功能──

Ce cours va construire sur ces six plateformes et vous indiquer quand elles seront les plus efficaces.

## 概念
### Les trois segments

**Custom silicon** Groq(LPU)、Cerebras(WSE)、SambaNova(RDU)。 Sur le même modèle, le décode est généralement plus rapide que sur le cluster basé sur GPU 5-10x。 par token 价格更高(2025年末 Groq 在 Llama-70B 上约为 ~$0.99/M), mais pour les cas d'utilisation sensibles à la latence 无可匹敌──Groq 选择是语音代理和实时翻译的生产环境──

**GPU platforms** Baseten、Together、Fireworks、Modal、Anyscale。运行在NVIDIA(2026年为H100、H200、B200) ou有时运行在 AMD 上。 elles se trouvent dans la " location de GPU brut " (RunPod、Lambda) et dans la " gestion de service hypercaler " (Bedrock) entre la couche économique。

**API-first marketplaces** Répliquer 、Infraprofonte、OpenRouter、Fal。 Catalogue large, paiement par prédiction ou paiement par seconde, souligner le temps à la première appel―

### Feu d'artifice  plateforme GPU optimisée pour la latence

- Moteur FireAttention (custom); le marché de la publicité est en phase avec la configuration de la latence par rapport à la VLLM (moins de 4 fois).
- Le niveau de lot est d'environ 50% du taux sans serveur, utilisé pour les charges de travail non interactives.
- Le modèle finement ajusté et le modèle de base par rapport au même taux de prestation de services, c'est la différence réelle entre ceux qui seront à votre disposition pour recevoir une prime LoRA.
- 2026 年中: location sur demande de GPU depuis 2026 年 5 月 1 日起提高$1/hour──规模化时可协商量定价──
- 财务信号: $4B 估值, traitement quotidien de 10T+ jetons―

### Ensemble  optimisé pour la largeur

- Plus de 200 modèles, y compris des versions open source en ligne en amont de la publication.
- Dans les modèles LLM à effet équivalent, le nombre de répliques est de 50 à 70%; "AI Native Cloud" est le volume et le catalogue.
- L'inference + l'ajustement + la formation sont dans une API.

### Baseten  optimisé pour les entreprises

- Cadre de confiance: mettre les dépendances, les secrets, la configuration de service dans un manifeste et réaliser un emballage de modèle.
- La gamme de GPU varie de T4 à B200── facturation par minute, et offre une réduction raisonnable du démarrage à froid──
- SOC 2 Type II, prêt à l'HIPAA,
- $5B 估值，2026 年 1 月 Series E（来自 CapitalG、IVP、NVIDIA 的 $300 M)

### Modal  Python natif optimisé

- 純 Python 的基础设施-as-code──用 `@modal.function(gpu="A100")`Décorer une fonction, puis utiliser une commande
- Résultats par seconde. Préchauffement à froid: 2-4 secondes.
- $87M Series B，估值 $1.1B(2025)。 dans une enquête indépendante, l'expérience des développeurs est la plus élevée.

### Réplication  largeur multimodal

- Pay-per-prediction: image, vidéo et modèles audio
- L'écosystème d'intégration (Zapier, Vercel, CMS)
- En effet, les taux de participation au MLL par jeton sont plus faibles, mais les taux de participation au MLL par jeton sont plus faibles.

### Native à rayons

- 构建在 Ray 上;RayTurbo est un moteur d'inférence propriétaire de Anyscale (WEB
- Le dernier pas est un nœud de plus grand graphique.
- Gestion des groupes de rayons; avec Ray AIR 和 Ray Serve profondément intégré

### Par-token et par minute:分别在什么时候胜出

Lorsque la charge de travail est insensée à la latence et éclate, le token est raisonnable, car vous ne payez que pour l'utilisation réelle.

粗略规则:当工作负载高于专用GPU 约30%的持续利用率时,每分钟(Baseten、Modal) commence à gagner par token(Fireworks、Together) ∼低于该水平时, per token 获胜,因为你避免为空付费──

### Le moteur sur mesure est le vrai fossé

Chaque plateforme de vLLM et SGLang affirme posséder un moteur personnalisé. FireAttention、RayTurbo、Baseten's inference stack。custom-engine 声称带有营销色;更诚实的表述是, vLLM + SGLang représente environ 80% de la production de la classe d'inference open source, tandis que la différence entre la couche de plateforme est DX、attribution 和 SLAs。

### Les chiffres que vous devriez vous rappeler

- Location de GPU de feux d'artifice: depuis 2026 年 5 月 1 日起提高 $1/h。
- Réponse de feu d'artifice: dans la même configuration, la latence est 4 fois plus faible que dans le vLLM.
- Ensemble: dans les LLM, le taux de réplique est de 50 à 70%*.
- Valorisation du basétain:$5B（Series E，2026 年 1 月，$300 M de tour)
- Valorisation des capitaux: 1,1 milliard de dollars (série B, 2025)
- Le taux d'utilisation continue est de 30% par minute.


```figure
cost-per-token
```

## Utilisez-le
`code/main.py`Dans un rapport de six fournisseurs, la charge de travail synthétique est de plus en plus élevée.$/day 和 effective $/M tokens。运行它来找出每代币与每分钟的破解平衡──

## Je le livre.
本课会生成 `outputs/skill-inference-platform-picker.md` donner un profil de charge de travail, SLA et budget, choisir une plateforme d'inférence primaire,

## 练习
1. 运行  référencement`code/main.py`Pour un bloc H100 de modèle 70B, dans quelles conditions l'utilisation continue est basée sur le nombre de points de vente par minute.
2. Vos produits fournissent la génération d'images, le chat et le discours-téxtes. Pour chaque modalité, vous choisissez un site et vous nommez le modèle de passerelle qui les unira.
3. Les feux d'artifice vont augmenter le prix de votre modèle principal de 1 $/h. Si 40% du trafic est transféré au niveau du lot, 50% de réduction, le coût de construction mixte est réduit.
4. Un client sous surveillance exige des GPU dédiées SOC 2 Type II + HIPAA + .
5. Comparer Fireworks sans serveur ✓ Ensemble à la demande ✓ Baset dédié 和 Réplicate API 上 Llama 3.1 70B ✓ 1000 prédictions ✓ Coût ✓ 10 prédictions par jour ✓ Quel est le plus bon marché?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Custom silicon | "non-GPU chips" | Groq LPU、Cerebras WSE、SambaNova RDU — 针对 decode 优化 |
| FireAttention | "Fireworks engine" | Custom attention kernel；市场宣传为 latency 比 vLLM 低 4x |
| Truss | "Baseten's format" | Model packaging manifest；dependencies + secrets + serving config |
| Per-token | "API pricing" | 按消耗的 tokens 收费；无需为空闲付费 |
| Per-minute | "dedicated pricing" | 按 wall-clock GPU time 收费；在高 utilization 时胜出 |
| Per-prediction | "Replicate pricing" | 按 model invocation 收费；常见于 image/video |
| RayTurbo | "Anyscale engine" | Ray 上的 proprietary inference；在 Ray clusters 上与 vLLM 竞争 |
| Batch tier | "50% off" | 降价的 non-interactive queue；常见于 Fireworks、OpenAI |
| Fine-tuned at base rate | "Fireworks LoRA" | 以 base model 的 rate 对 LoRA-served requests 收费（差异点） |

## 延伸阅读
- [Fireworks Pricing](https://fireworks.ai/pricing) tarifs par jeton  niveau de lot  location de GPU 
- [Baseten Pricing](https://www.baseten.co/pricing/) taux par minute  capacité engagée  niveaux d'entreprise
- [Modal Pricing](https://modal.com/pricing) taux de GPU par seconde 和 niveau libre.
- [Together AI Pricing](https://www.together.ai/pricing) catalogue de modèles 和 taux par jeton。
- [Anyscale Pricing](https://www.anyscale.com/pricing) RayTurbo et géré Ray prix
- [Northflank — Fireworks AI Alternatives](https://northflank.com/blog/7-best-fireworks-ai-alternatives-for-inference) évaluation comparative¬
- [Infrabase — AI Inference API Providers 2026](https://infrabase.ai/blog/ai-inference-api-providers-compared) paysage des fournisseurs。
