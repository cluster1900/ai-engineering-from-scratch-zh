# ASCII Art et les jailbreak visuels

> Jiang, Xu, Niu, Xiang, Ramasubramanian, Li, Poovendran, "ArtPrompt: ASCII Art-based Jailbreak Attacks against Aligned LLMs" (ACL 2024, arXiv:2402.11753) ⋅ dans les demandes nocives de masquer avec des jetons liés à la sécurité, utiliser les mêmes lettres ASCII-art 染 les remplacer, puis envoyer cette mise en faux post-impression prompt ⋅GPT-3.5GPT-4、Gemini、Claude、Llama-2 都无法稳健识别 ASCII-art Token──该攻击绕过PPL((Retransplexity filtres) ⋅Paraphrase 防御和相关的okenization──:ViTC语标识别测量对非觉义视觉识别能力;SightSightSight泛其其其其基拟定类型Encom-code ⋅JSON retroquences ⋅Textructions ⋅Textructions ⋅Textructions ⋅Textructions ⋅Textructions ⋅Textructions ⋅Textructions ⋅Textructions ⋅Textructions ⋅Textructions ⋅Textructions ⋅Textructions ⋅Textructions ⋅Textructs ⋅Textructs ⋅Textructs 

**类型：**Construire
**语言：**Python (stdlib, harnais de masquage des jetons ArtPrompt)
**前置要求：**La phase 18 · 12 (PAIR), la phase 18 · 13 (MSJ)
**时间：**À environ 60 minutes.

## Objectif de l'apprentissage

- 描述 ArtPrompt 攻击:word-identification 步骤、ASCII-art 替换、最终伪装后的提示──
- 解释为什么标准防御(PPL、Paraphrase、Retokenization) 会在ArtPrompt 上失败。
- 定義 ViTC,并描述它衡量什么──
- 将 StructuralSleight 描述为向任意不常文本编码结构的泛化.

##  problématique

通過表述和角色扮演 (Leçon 12) 及通過长文文文) 通过长文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文

## 概念

### ArtPrompt, deux étapes

Étape 1. Identification de mot: donner une demande nocive, l'attaquant utilise un LLM pour identifier les mots liés à la sécurité.

Étape 2. Génération rapide masquée. Le mot de chaque identifiant sera remplacé par son ASCII-art 染. Le modèle reçu est un réseau composé de points de marque et de espaces vides. Un modèle assez puissant peut le reconnaître comme un mot.

结果:GPT-4、Gemini、Claude、Llama-2、GPT-3.5 全部失败──

### Pourquoi les normes de défense ont-elles échoué ?

- **PPL（perplexity filter）。**L'art ASCII  a une grande complexité, mais toutes les nouvelles entrées sont également ⋅ capable d'empêcher la sélection de valeur d'ArtPrompt, empêchera également la structuration juridique ⋅
- **Paraphrase。**Pour les parallèles, les parallèles sont souvent conservés ou reconstruits.
- **Retokenization。**À la différence des différents types de séparation des jetons, la reconnaissance visuelle du modèle ne changera pas la forme des lettres.

Le problème fondamental réside dans le fait que les systèmes de sécurité sont à la surface des symboles ou des symboles; ArtPrompt joue un rôle dans la surface de la reconnaissance visuelle.

### Indice de référence ViTC

识别非语义视觉提示──衡量模型读取 ASCII-art、wingdings 和其他非文本语义视觉内容的能力──ArtPrompt's efficacité et précision de ViTC 相关:模型越擅长读取视觉文本,ArtPrompt 在它上越有效──

### StructuralSleight

泛化 ArtPrompt:Strctures enchâssées par texte peu communes (UTES) ―树、图、嵌套 JSON、CSV-in-JSON、diff-style blocs de code―

La sécurité doit être généralisée en représentations structurelles de modèles résolubles.

### Modèle d'image

Les LLM visuels ((GPT-5.2、Gemini 3 Pro、Claude Opus 4.5、Grok 4.1) ont étendu leur portée à l'attaque.

### Il est en phase 18 .

Les leçons 12-14  ont décrit trois types d'attaques correctes Vecteur:代 refinement(PAIR) 、longueur de contexte(MSJ) et codage(ArtPrompt/StructuralSleight) L'étude 15 de l'attaque centrée sur le modèle 转向系统边界攻击(injection rapide indirecte) L'étude 16 描述防御工具响应──


```figure
al-ascii-cloak
```

## Utilisez-le

`code/main.py`Construire un jouet ArtPrompt. Vous pouvez utiliser des glyphes ASCII-art  pseudo-art nocif Enquête spécifique, vérifier les pseudo-arts de la requête peut passer par le filtre de mots clés, et il est possible de choisir avec un simple reconnaisseur de la carte de caractères.

## Je le livre.

本课会产出 `outputs/skill-encoding-audit.md` Donner un rapport de défense contre les jailbreak, il comporte des informations couvrant les codes de la famille des attaques (ASCII art ̇ base 64 ̇ let-speak ̇ UTF-8 homoglyph ̇ UTES) ainsi que la capture de chaque type d'attaque ̇

## 练习

1. 运行  référencement`code/main.py`◊ vérification des caractères de pseudo-conception peuvent passer par un simple filtre de mots clés.

2. 实现第二种编码:对同一个目标词使用基础64──比较它对 ArtPrompt的过率 和恢复难度──

3. 阅读江 et al. 2024 Section 4.3 ((五模型结果) 』 propose une raison, explique pourquoi Claude dans le même benchmark de haute résistance ArtPrompt à Gémeaux。

4. 设计一个前代 防御,用于检测 prompt 中 ASCII-art-shaped 区域──在合法代码、表格和数学记号上衡量虚假阳性率──

5. StructuralSleight a énuméré 10 types de structures de code. Il a élaboré un plan qui peut traiter toutes les 10 types de structures de défense générale et a estimé le coût de calcul de chaque prompt protégé.

## 关键术语

| 术语 | 人们怎么说 | 它实际意味着什么 |
|------|-----------------|------------------------|
| ArtPrompt | "ASCII-art attack" | 使用 ASCII-art 渲染遮蔽安全词的两步 jailbreak |
| Cloaking | "隐藏这个词" | 用模型能读取但过滤器读不到的视觉表示替换被禁止的 Token |
| UTES | "不常见结构" | Uncommon Text-Encoded Structure — 树、图、嵌套 JSON 等，用于夹带内容 |
| ViTC | "visual-text capability" | 衡量模型读取非语义视觉编码能力的 benchmark |
| Perplexity filter | "PPL defense" | 拒绝高 perplexity 的 prompt；会失败，因为合法结构化输入也会得到高分 |
| Retokenization | "tokenizer shift defense" | 用不同的 Tokenizer 预处理 prompt；会失败，因为识别是视觉层面的 |
| Homoglyph | "外观相似字符" | 看起来与拉丁字母相同的 Unicode 字符；绕过 substring 检查 |

## 延伸阅读

- [Jiang et al. — ArtPrompt (ACL 2024, arXiv:2402.11753)](https://arxiv.org/abs/2402.11753) jailbreak ASCII-art 论文
- [Li et al. — StructuralSleight (arXiv:2406.08754)](https://arxiv.org/abs/2406.08754) UTES 泛化
- [Chao et al. — PAIR (Lesson 12, arXiv:2310.08419)](https://arxiv.org/abs/2310.08419) 互补的代攻击
- [Anil et al. — Many-shot Jailbreaking (Lesson 13)](https://www.anthropic.com/research/many-shot-jailbreaking) 互补的长度攻击
