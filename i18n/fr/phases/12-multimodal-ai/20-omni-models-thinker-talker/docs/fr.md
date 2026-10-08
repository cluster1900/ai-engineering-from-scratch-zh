# Modèles omni: Qwen2.5 Omni avec Thinker-Talker 拆分

> GPT-4o a un impact sur la présentation de produits en mai 2024, non pas à cause du modèle de base, mais à cause de la forme du produit: une interface vocable, vous dites, le modèle voit ce que la caméra voit, et en 250ms en interne.

**Type:** Build
**Languages:** Python（stdlib，streaming pipeline 延迟模拟器 + VAD 循环）
**Prerequisites:** Phase 12 · 19（audio-LLMs），Phase 12 · 16（any-to-any）
**Time:** ~180 分钟

## Objectif de l'apprentissage
- Pour les développeurs de l'écriture, il est nécessaire de définir les différentes formes de communication.
- 逐组件计算一次对话交互的时间-to-first-audio-byte (TTFAB) budget──
- 描述 TMRoPE 在 Thinker 内部跨视觉、音频和文本的时间对齐位置编码──
- Il y a aussi le double de la moitié du double.

##  problématique
Un assistant de parole en temps réel doit rapidement accomplir beaucoup de choses:

1. 听用户──实时语音 Tokenization, détection de l'activité vocale(VAD) est utilisé pour juger l'utilisateur何时说完──
2. Choisir de voir. Avec 2 à 4 FPS, entrez la caméra de l'écran, en streaming avec le son jusqu'à Thinker.
3. 思考── Basé sur le dialogue
4. Il est également utilisé pour la communication de messages.

Chaque étape augmente le retard. Le temps de retour est inférieur à 500 ms.

Chaque composant a besoin de streaming. Je ne peux pas tout mettre en série.

## 概念
### Pensant et parlant

Qwen2.5-Omni des décompositions:

- Réflexion: un 7B-80B 文本生成 Transformer。消费交错的文本 + 图像 + 音频 Token。输出表示要说什么的文本 Token。
- Parleur: un plus petit de la production de voix Transformer(200M-1B)。消费 Thinker's文本输出代码加上最近的语音上下文代码──输出离散语音代码(residual-VQ 索引)。
- Décodeur de langage: un décodeur de forme d'onde en streaming (SNAC、MoVQGAN famille),将语音 Token 实时转换为音频样本。

Cette séparation est importante. Le penseur doit être assez grand pour avoir une bonne capacité de raisonnement. Le locuteur peut être très petit, car sa tâche est locale: transformer le texte en Token.

两者并行运行:

1. Le penseur 发发出文本 Token t_i。
2. Parleur 消费 t_i(通过流),并发出语音 Token s_i、s_{i+1}、...、s_{i+k}。
3. Décodeur de discours dans les jetons de langage jusqu'à leur consommation,并发发发音频样本──
4. Quand le penseur arrive dans le texte, le parleur est déjà en streaming.

### TMRoPE  时间对齐的 Multimodal 位置

Le penseur a besoin d'intégrer des images (par exemple, à 4 FPS jusqu'à) 音频(à 50 /秒 jusqu'à) ainsi que des textes de l'histoire du dialogue.

TMRoPE pour chaque jeton Répartition absolue du temps──t=2.3s 的视觉 Token──t=2.32s 的音频 Token──来自用户文本 Token stop 位于 t=2.35s──RoPE 按时间旋转 注意;模型将将它们看作在时间发生在同时──

C'est lui qui a dit bonjour à l'infrastructure capable de travailler: le modèle a été vu en même temps que le vidéo et le son.

### Diffusion en continu

语音 Token 必须流媒体──Mini-Omni(Xie & Wu, 2024) propose que les modèles de langage puissent entendre, parler tout en pensant en streaming:Thinker 输出 Token 和 Talker 输出 Token 在同一个序列中交错──Talker 在 Thinker 确认下一个文本 Token 后立即启动──没有批量 边界──

Moshi(Défossez et al., 2024 年 10 月) est la réalisation ouverte la plus rapide.

### VAD et tournée

Détection de l'activité vocale 运行在输入侧──两种模式:

- Une double-duplex: utilisateur parle, modèle écoute, modèle parle, utilisateur écoute, passer par VAD 静音检测(~200ms) réaliser une communication claire,
- Le double double: les deux parties peuvent parler simultanément. Le modèle peut être retransmis en double.

Qwen2.5 Omni 默认支持半duplex, 通过静音值进行转换──Full-duplex 需要应用层处理──

### Qwen3-Omni(2025 年 11 月)

后继版本──Qwen3-80B Thinker, Greater Talker,改进的TMRoPE-v2──延迟接近 GPT-4o 的250ms──开放权重──在OmniBench 上的基准与Gemini 2.0 Live 具有竞争力──

### Budget de la latence de production

Pour le streaming typique:

- Mic -> 音频 Token:40-80ms。
- Remplissez rapidement: 7B 上 100-200ms, 70B 上高得多。
- La première pensée est de 40 minutes.
- Parleur 处理第一个文本 Token:20ms。
- La première émission de jeton est de 40 minutes.
- Décode résiduel-VQ: 30ms.
- Décode de forme d'onde: 50-80 ms.

总 TTFAB:7B 上 320-510ms,70B 上 600-900ms。 La qualité de la frontière signifie généralement 70B+; c'est la source de la différence de retard frontalier。

### Mathématiques du taux de jetons

Pour les 16 kHz et 50 Hz, vous avez besoin de 50 Tokens de langage par seconde. Le haut-parleur doit émettre 50 Tokes pour suivre.

C'est pourquoi il existe un modèle de petit parleur spécialisé, plutôt que le modèle principal directement utilisé.


```figure
l5-thinker-talker
```

## Utilisez-le
`code/main.py`- Le numéro de la liste:

- Utilisez un faux jeton de débit de débit similaire à un pipeline Thinker-Talker.
- Pour la taille du modèle et le taux de prélèvement du micro, le TTFAB est calculé.
- UZ VAD 静音值演示 demi-duplex tour-prendre

## Je le livre.
本课产 出 `outputs/skill-omni-streaming-budget.md`△ donner un objectif de produit de la langue en temps réel TTFAB 和功能集合(vision-in、bilingual、full-duplex), choisir Qwen2.5Omni、Qwen3-Omni、Moshi ou Mini-Omni,并确定 Thinker/Talker's size。

## 练习
1. Votre objectif TTFAB est de 300ms. Dans 7B Thinker et 300M Talker, écrivez le retard de chaque composant.

2. Qwen2.5-Omni Utilise TMRoPE。 Décrire un prompt comme celui-ci 中模型看的内容:用户在 t=1s 开始说话,摄像头在 t=1.2s 捕捉到一个手势。

3. Le modèle de support du doublex exige que les élèves écoutent et émettent des voix en même temps.

4. 阅读 Moshi 论文 Section 4── décrit le monologue intérieur 分离, ainsi que pourquoi il a évité le démembrement Thinker-Talker 分离──

5.  calcul de débit  budget: Pour suivre les 16 kHz 语音和 50 基层 Token/秒, le locuteur 必须发发发 Token à plus rapide?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Thinker | “推理大脑” | 生成要说什么的大型文本生成 Transformer |
| Talker | “语音生成嘴巴” | 从 Thinker 文本生成离散语音 Token 的小型 Transformer |
| TTFAB | “延迟预算” | Time-to-first-audio-byte：从用户语音结束到第一个音频 sample 输出 |
| TMRoPE | “时间对齐 RoPE” | 使用跨视觉、音频、文本的绝对时间戳的位置编码 |
| Half-duplex | “Turn-taking” | 用户和模型交替；VAD 静音检测用户已说完 |
| Full-duplex | “同时进行” | 模型可以同时说话和聆听；具备 backchannel 能力 |
| Inner monologue | “Moshi 分离” | 单模型设计，其中思考流和说话流交错 |

## 延伸阅读
- [Xu et al. — Qwen2.5-Omni (arXiv:2503.20215)](https://arxiv.org/abs/2503.20215)
- [Qwen Team — Qwen3-Omni (arXiv:2509.17765)](https://arxiv.org/html/2509.17765v1)
- [Xie & Wu — Mini-Omni (arXiv:2408.16725)](https://arxiv.org/abs/2408.16725)
- [Défossez et al. — Moshi (arXiv:2410.00037)](https://arxiv.org/abs/2410.00037)
- [Zeng et al. — GLM-4-Voice (arXiv:2412.02612)](https://arxiv.org/abs/2412.02612)
