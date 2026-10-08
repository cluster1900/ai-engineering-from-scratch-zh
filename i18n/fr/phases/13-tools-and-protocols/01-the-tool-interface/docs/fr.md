# L'interface des outils  Pourquoi les agents  ont besoin d'une structure I/O

> 语言模型会生成代币――程序会执行动作―― Les différences entre les deux sont l'interface des outils: un contrat, faire en sorte que le modèle puisse demander une action, et faire en sorte que l'hôte l'exécute―2026 Chaque type de stack OpenAI、Anthropic 和 Gemini `tools/call`Les parties de tâche de l'A2A sont différentes de la même cycle de quatre étapes.

**Type:** Learn
**Languages:** Python (stdlib, no LLM)
**Prerequisites:** Phase 11 (LLM completion APIs)
**Time:** ~45 minutes

## Objectif de l'apprentissage
- Expliquer pourquoi un LLM qui ne peut produire que du texte ne peut pas agir seul dans le monde réel.
- 画出四步工具-call loop (descrivez → décidez → exécutez → observez),并说出每一步由谁负责──
- Pour une description d'outil, vous pouvez utiliser la fonction d'exécution de la définition.
- 区分纯工具和副作用工具,并说明为什么这种分类对安全很重要.

##  problématique
LLM 输出是下一个代币的概率分布――这就是它的全部输出表面―― si vous demandez à un modèle de chat Bengaluru 现在天气是如何, il peut écrire une phrase qui semble raisonnable, mais elle ne peut pas entrer dans l'API 天气―― cette phrase peut être juste par hasard, il peut aussi être passé trois jours――

弥合这个差距正是工具界面的目的──主机程序你的代理运行时间──Claude Desktop、ChatGPT、Cursor,或一个自定义脚本会向模型公布一组可调用工具──当模型判断需要某一动作时,它会输出一个结构化用荷,指标工具 及其论据──主机解析该用荷,真正运行工具,并把结果反回去──直到这个循环持续,模型判断不再需要更多调用──

La première version de ce contrat a été publiée en juin 2023 sous forme de paramètres  fonctionnalités  OpenAI  Anthropic puis rejoint dans Claude 2.1 `tool_use`Les Gémeaux ont rejoint quelques mois plus tard.`functionDeclarations` Actuellement, chaque fournisseur est exposé à la même forme: saisir une liste d'outils de type JSON-Schema 标注类型, saisir un appel d'outil de payload JSON 模型 Context Protocol  2024 年 11 月) va généraiser ce contrat, faire un registre d'outils 可以服务每个模型 ・ A2A  2026 年 4 月, v1.0) a superposé une délégation agent-agent sur la même primitive 

Le cycle de quatre étapes est l'invariabilité de ces systèmes. Le reste de la phase 13 est le développement de celle-ci.

## 概念
### Étape 1: décrire

Host avec trois déclarations pour chaque outil.

- **Name.**Un identifiant à lire à la machine.`get_weather`, plutôt que la chose météo 🏼
- **Description.**Une section naturel de la langue est utilisée lorsque les utilisateurs posent des questions sur la situation météorologique actuelle d'une ville spécifique.
- **Input schema.**Un objet de schéma JSON de l'outil de description des arguments du projet 2020-12)

Les fournisseurs modernes utiliseront des modèles spécifiques au fournisseur pour les sélectionner dans le système immédiatement, donc en tant que fournisseur de services, vous n'avez besoin que de traiter la forme structurée.

### Deuxième étape: décider

给定用户消息和可用工具,模型会选择三种行为之一──

1. **直接用文本回答**◊ Ne pas effectuer une appel à l'outil.
2. **调用一个或多个 tools。**输出 structurée appel des objets──在 `parallel_tool_calls: true`Le modèle peut être utilisé pour effectuer plusieurs appels à un tour.
3. **拒绝。**Les sorties structurées en mode strict peuvent générer une classification `refusal`Bloc, plutôt que appel.

Un outil de chargement d'appel , trois lignes de chargement .`id`- outil`name`, ainsi que JSON `arguments`L'existence de l'objet, afin de permettre à l'hôte de pouvoir connecter les résultats ultérieurs à un appel spécifique, est importante lorsque des appels parallèles sont effectués.

### Étape 3: exécuter

L'hôte recevoir l'appel, selon le schéma déclaré verification arguments,并运行执行者── arguments inefficaces Signification modèle halluciné 了某段或使用错误类型

L'exécuteur est simplement un code ordinaire. Python, TypeScript, commandes de coque, requête de base de données. Il produit un résultat, généralement une chaîne, mais peut aussi être une valeur JSON ou un bloc de contenu structuré.

### Étape 4: observer

L' hôte va ajouter le résultat de l' outil à la conversation`id``tool`Le modèle possède maintenant un outil de sortie dans le contexte, peut générer une réponse finale, ou demander plus d'appels. Ce processus se poursuivra jusqu'à ce que le modèle arrête de faire des appels, ou l'hôte atteigne la limite de sécurité du nombre de fois.

### La confiance s' est brisée

Les outils ont deux types de sécurité.

- **Pure.**Il n'y a pas d'effets secondaires.`get_weather`- Je suis là.`search_docs`- Je suis là.`get_current_time`                                                                                                                                                                                                                                                              
- **Consequential.**Il va changer l'état, les dépenses, les données des utilisateurs.`send_email`- Je suis là.`delete_file`- Je suis là.`execute_trade`Il faut ajouter la porte.

Meta 2026 année utilisée pour la sécurité des agents Rule de deux  Indique qu'un tour, le dernier, ne peut contenir simultanément que deux des trois éléments suivants: entrée non fiable, données sensibles, action conséquente, interface de l'outil                                                                                                                                                                                                                               

### Où vit la boucle

| Context | Who describes | Who decides | Who executes |
|---------|---------------|-------------|--------------|
| Single-turn function calling (OpenAI/Anthropic/Gemini) | App developer | LLM | App developer |
| MCP | MCP server | LLM via MCP client | MCP server |
| A2A | Agent Card publisher | Calling agent | Called agent |
| Web browser (function-calling agent) | Browser extension / WebMCP | LLM | Browser runtime |

Quoi qu'il en soit, les quatre étapes sont les mêmes.

### Pourquoi pas directement demander à l'extrait de JSON ?

 faire un modèle avec JSON 回复 est une fonction appelant le modèle de l'arrivée de la dernière fois. Il est utilisé dans les modèles frontaliers, avec un taux d'échec de 5% à 15% environ, dans les modèles plus petits, le taux d'échec est plus élevé.

La fonction native appelant mieux, raison ayant trois points. Premièrement, le fournisseur utilisera une forme d'appel précise pour le modèle pour effectuer un entraînement de bout en bout, donc le mode strict en mode bas de la valeur JSON augmentera de 98% à 99%. Deuxièmement, la charge utile de l'appel se trouve dans sa propre fente de protocole, plutôt que dans le texte libre.`tool_use`Les Gémeaux`responseSchema`• une conformité obligatoire au schéma.

Phase 13 · 02 会并排讲解三供应商API──Phase 13 · 04 会深入结构化输出──

### Les interrupteurs de circuit

Lorsque le modèle cesse de faire des appels, ou l'hôte atteint le nombre maximal de tours, le cycle se termine. Les hôtes de l'environnement de production le définissent généralement entre 5 et 20 tours.

Une autre option  boucles illimitées tous les six mois  agent  entre une nuit de passer 400  dollars API appels fait apparaître  révolte  en forme de réapprovisionnement  ne pas sur la ligne dans des circonstances sans frontière

Phase 14 · 12 会深入讲解错误恢复和自我治愈;Phase 17 会覆盖生产率限制──

### La phase 13 se poursuit.

- Les leçons 02 à 05 会打磨 surface d'appel d'outils au niveau du fournisseur.
- Les leçons 06 à 14 seront généralement transférées en MCP.
- Les leçons 15 à 18 会防护这个循环,抵御 hostiles serveurs, utilisateurs adversaires, et les surfaces d'auteurs distants non authentifiées.
- Les leçons 19 à 22 vont se développer à la collaboration agent-agent, à l'observabilité, au routage et à l'emballage.
- Leçon 23 会交付一个使用每个原始的完整生态系统的.

Le reste de chaque cours est le début de ce cycle de quatre étapes.


```figure
tp-tool-loop
```

## Utilisez-le
`code/main.py`Une fausse fonction de décideur  fonction de fonctionnement  fonctionnement  fonctionnement  fonctionnement  fonctionnement  fonctionnement  fonctionnement  fonctionnement  fonctionnement  fonctionnement  fonctionnement  fonctionnement  fonctionnement  fonctionnement  fonctionnement  fonctionnement  fonctionnement  fonctionnement  fonctionnement  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction  fonction 

需要关注的内容:

- Registre d'outils Pour chaque outil 持有三个字段:nom、description、schéma, ainsi que référence de l'exécuteur。
- Le validateur est un sous-ensemble minimal de JSON Schema (types, requises, enum, minutes/max), uniquement avec stdlib 编写。Phase 13 · 04 会提供更完整的版本。
- Le nombre d'itérations de cycle est limité à 5 fois.

## Je le livre.
本课会产出 `outputs/skill-tool-interface-reviewer.md` donner une définition de projet d'outil (nom + description + schéma + contour d'exécuteur), cette compétence 会审计它的循环 fitness:nom oui-ou non-machine-stable, description oui-ou non-ou non-complete de l'utilisation bref,schema oui-ou non correctement JSON Schema 2020-12, ainsi que la classification pure-vs-consequentielle oui-ou non-明确──

## 练习
1. À`code/main.py`添加第四工具,名为 `get_stock_price(ticker)`将其描述 写成:当用户按 ticker 询问当前股票价格时使用──不要用于历史价格或市场摘要── 运行利用,并确认假决策者 会将提及 ticker的查询 路由到这个新工具──

2. 破坏 schéma validateur──传入一个 `arguments`Objet 缺少 required field  Call,并确认 host 会在执行前拒绝它──然后传入一个带有额外未知字段的 call──做出决定: host 应该拒绝还是忽视?

3. Va utiliser chaque outil en classe pour le pur ou le conséquent. Donnez les entrées de registre nécessaires.`consequential: true`flag,并修改循环,使其在选择后果工具 时打印一行 将与用户确认──这是每个生产主机都需要的确认门 形状──

4. Dans le papier, dessinez un cycle de quatre étapes, et utilisez la table de colonne fournisseur ci-dessus pour remplir votre client préféré (Claude Desktop, Cursor, ChatGPT ou stack de définition personnelle) et la variante spécifique au MCP de la phase 13 · 06

5. De la tête à la fin de la lecture du guide d'appel à la fonction d'OpenAI. Trouvez un élément situé au milieu de la demande, mais non présenté dans le cycle de quatre étapes présenté dans cet article. Expliquez ce qui l'a augmenté, ainsi que pourquoi il est un élément de commodité et non un élément nécessaire.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Tool | “模型可以调用的东西” | name + JSON-Schema-typed input + executor function 组成的三元组 |
| Function calling | “Native tool use” | Provider-level API 支持，用于输出结构化 tool calls，而不是 prose |
| Tool call | “模型发出的行动请求” | 模型输出的一个 JSON payload，包含 `id`、`name`、`arguments` |
| Tool result | “tool 返回的内容” | executor 的输出，被包装在带有匹配 id 的 `tool` role message 中 |
| Parallel tool calls | “一次多个 calls” | 一个 model turn 中的多个 call objects，彼此独立，并可通过 id 排序 |
| Strict mode | “Guaranteed JSON” | Constrained decoding，强制模型输出通过已声明 schema 的验证 |
| Pure tool | “Read-only tool” | 无 side effects；可以安全地重新运行 |
| Consequential tool | “Action tool” | 会改变 external state；需要 gate、audit 或用户确认 |
| Four-step loop | “The tool-call cycle” | describe → decide → execute → observe |
| Host | “Agent runtime” | 持有 tool registry、调用模型并运行 executor 的程序 |

## 延伸阅读
- [OpenAI — Function calling guide](https://platform.openai.com/docs/guides/function-calling) Déclarations d'outils à l'ouvertureAI et références canoniques de formes d'appel
- [Anthropic — Tool use overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview) Claude de `tool_use`- Je suis là .`tool_result`format de bloc
- [Google — Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling) Gémeaux 中的 `functionDeclarations`和 la sémantique parallèle
- [Model Context Protocol — Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28) Actuellement sans état  Règlement sur les outils d'interface utilisés par les fournisseurs
- [JSON Schema — 2020-12 release notes](https://json-schema.org/draft/2020-12/release-notes) Chaque API moderne outil utilisé dans tous les dialectes de schéma
