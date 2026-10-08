# Utilisation des outils et appel des fonctions

> Toolformer (Schick et coll., 2023) 开创了自监督工具注释──Berkeley Function Calling Leaderboard V4 (Patil et coll., 2025) 设定2026年标准:40% agents、30% multi-turn、10% live、10% non-live、10% hallucination──Single-turn 已解决──memory、dynamic decision-making 和 long-horizon tool chains 还没有解决──

**Type:** Build
**Languages:** Python (stdlib)
**前置要求:**Phase 14 · 01 (loculier d'agent), phase 13 · 01 (fonction appelant plongée profonde)
**Time:** ~60 分钟

## Objectif de l'apprentissage
- 解释 Toolformer's auto-supervisé de formation signal: seulement lorsque l'exécution peut réduire la prochaine perte de jetons 时,才保留工具注释──
- Découvrez les cinq catégories d'évaluation de la BFCL V4, ainsi que chaque classe de mesures.
- 实现 un répertoire d'outils stdlib, contenant la validation du schéma, la coercition des arguments et l'exécution du sandboxing.
- 诊断 2026 岁的三个开放问题:chaîne d'outils à long horizon, prise de décision dynamique et mémoire

##  problématique
L'utilisation moderne des outils modernes est la suivante: modèle 能否跨 40 个步骤链式调用工具, disposer de mémoire, traiter la observabilité partielle, récupérer des défaillances des outils, et ne pas halluciner les outils inexistants ?

Le toolformer a établi un bassin: des modèles peuvent être utilisés par l'auto-supervision.

## 概念
### Le groupe de travail de l'équipe de formation (Schick et coll., NeurIPS 2023)

C'est pourquoi, si vous avez une application de l'API, vous pouvez utiliser l'API du candidat pour l'utiliser.

覆盖的工具:calculateur, système de QA, moteurs de recherche, traducteur, calendrier, signal d'auto-supervision, outil de purement attention,

Les modèles plus petits sont affectés par les annotations des outils, les modèles plus grands sont affectés par les avantages. C'est pourquoi les modèles frontaliers de 2026 ont une forte capacité d'utilisation des outils, tandis que la plupart des modèles 7B ont besoin d'une mise à jour évidente de l'utilisation des outils.

### Le tableau de classement des fonctions de Berkeley V4 (Patil et coll., ICML 2025)

Le BFCL est une évaluation de facto de l'année 2026[6].

- **Agentic (40%)** 完整 agent trajectories: mémoire, décisions dynamiques à plusieurs tours
- **Multi-Turn (30%)** 带 tool chains 的交互式对话──
- **Live (10%)** Réponse de l'utilisateur à la réelle requête de répartition ((
- **Non-Live (10%)** cas d'essai synthétiques。
- **Hallucination (10%)** 检测何时不应调用 outil──

V3 introduit une évaluation basée sur l'état: après la séquence d'outils, vérifiez l'état réel de l'API (par exemple, les fichiers sont-ils créés ?), au lieu de l'AST.

2026 年关键发现:appel de fonction à tour unique 基本已经解决──失败集中在记忆(跨轮 携带背景)、dynamique prise de décision(基于先前结果选择工具)、长视线链(20+ étapes 后漂移) 和幻觉检测(没有合适工具 时拒调用)。

### Schéma d' outil

Chaque fournisseur a un schéma... mais il a la même forme:

```
name: string
description: string (what it does, when to use it)
input_schema: JSON Schema (properties, required, types, enums)
```

Anthropologie 直接使用 `input_schema`✿OpenAI 使用 `function.parameters`Les deux acceptent le schéma JSON. Les descriptions jouent un rôle clé, le modèle les prendra pour choisir le bon outil.

### Validation des arguments

Ne vous fiez à aucun outil.

1. **Type coercion.**Modèle pourrait être dans le schéma  requérir int de locale retour en caractères `"5"`■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
2. **Enum validation.**Si le schéma est écrit`status in {"open", "closed"}`, et le modèle 输出 `"in_progress"`, en utilisant l'erreur descriptive rejeter.
3. **Required fields.**缺少 required field -> 立即把错误观察 返回模型, et non pas crash。
4. **Format validation.**Les dates, les courriels, les URL  utilisent des parseurs spécifiques 验证, et non des régex¬

Chaque défaillance de validation doit être reprise par une observation structurée, permettant au modèle de refaire un essai de forme correcte.

### Appels parallèles à l'outil

现代 providers 支持在一个助手转 中并行 tool calls──Loop:

1. Le modèle a envoyé 3 appels à l'outil, chacun avec des différences.`tool_use_id`Il y a une autre.
2. Le temps de fonctionnement  les exécuter 
3. Chaque résultat est un résultat .`tool_result`Le bloc  retour,并通过 `tool_use_id`Je suis en train de vous parler.

工程规则:把相关性ID 当作关键约束──把它们交换,就会导致错工具到错结果路由──

### La boîte à sable

L'exécution des outils est la limite de la boîte à sable.`run_shell(cmd)`Il s'agit d'un signal de danger.`git_status()`Plus sûr.


```figure
tool-routing
```

## - Je le construis.
`code/main.py`实现 un registre des outils de forme de production:

- Validateur de sous-ensemble JSON Schema (en anglais seulement)
- L'enregistrement de l'outil, comprend une description, un schéma d'entrée, un délai et un exécuteur.
- La coercition des arguments et la validation enum
- 带 correlation IDs de l'outil parallèle dépêche
- 作为结构化 strings 的错误观察──

Je vais le faire.

```
python3 code/main.py
```

Trace  montrant un mini agent à un tour en utilisant trois outils, dont un appel délibérément malformé sera rejeté et retournera au modèle.

## Utilisez-le
Chaque fournisseur a son propre schéma d'outils:Anthropic、OpenAI、Gemini、Bedrock。 si vous avez besoin de plusieurs fournisseurs, veuillez utiliser la couche de traduction(OpenAI Agents SDK、Vercel AI SDK、LangChain outil adaptateur)。BFCL est une référence; si l'utilisation de l'outil est le cœur du produit, publiez-le et veuillez l'utiliser pour tester votre agent。

## Je le livre.
`outputs/skill-tool-registry.md`L'écriture de chaque outil est une description de chaque outil.

## 练习
1. Ajouter un outil "no-op", faire le modèle 能显然拒绝使用任何其他工具──在类似BFCL的幻觉测试上测量──
2. Pour int-as-string et flot-as-string  réaliser des arguments coercition―cohérence De où commencer à cacher de vrais bugs?
3. 添加 per-outil tempsout 和 circuit breaker(连续失败 3 次后, dans les années 60 内拒绝该工具) ⋅ Comment cela changera-t-il la façon de récupérer le modèle?
4. 阅读 BFCL V4 description──选择一个类别(例如"multi-turn"),并让你的代理 跑 10 个例子提示──报告通过率──
5. Le test de validation de la stdlib est transféré à Pydantic ou à Zod.

## 关键术语
| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| Function calling | "Tool use" | 使用 validated schema 的 structured-output tool invocation |
| Toolformer | "Self-supervised tool annotation" | Schick 2023 — 保留那些结果能降低 next-Token Loss 的 tool calls |
| BFCL | "Berkeley Function Calling Leaderboard" | 2026 benchmark：40% agentic、30% multi-turn、10% live、10% non-live、10% hallucination |
| Tool schema | "给 model 的 function signature" | name、description、arguments 的 JSON Schema |
| tool_use_id | "Correlation ID" | 将 tool call 与其 result 绑定；对 parallel dispatch 至关重要 |
| Hallucination detection | "知道何时不调用" | V4 category：没有合适 tool 时拒绝调用 |
| Argument coercion | "String-to-int repair" | 针对可预测 schema mismatch 的窄修复；如果有歧义则 reject |
| Sandboxing | "Tool execution boundary" | 每个 tool 的 read/write surface、network、timeout、memory cap |

## 延伸阅读
- [Schick et al., Toolformer (arXiv:2302.04761)](https://arxiv.org/abs/2302.04761) annotation d'outils autosuvisés
- [Berkeley Function Calling Leaderboard (V4)](https://gorilla.cs.berkeley.edu/leaderboard.html) référence d'évaluation 2026
- [Anthropic, Tool use documentation](https://platform.claude.com/docs/en/agent-sdk/overview) Claude Agent SDK 中的制作工具方案
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) type d'outil de fonction 和 Garderrails
