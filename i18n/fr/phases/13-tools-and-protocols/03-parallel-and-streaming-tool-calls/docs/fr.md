# Parallèle outil Appels et outils de streaming

> Une enquête météo indépendante est effectuée en trois phases. Après la mise en œuvre, le temps total est réduit à la plus lente de chaque session.

**类型：**Construire
**语言：**Python(stdlib, piscine de fils + harnais de streaming)
**前置要求：**Phase 13 · 02 (fonction appelant à la plongée profonde)
**时间：**À environ 75 minutes.

## Objectif de l'apprentissage

- Expliquer pourquoi il existe`parallel_tool_calls: true`Et quand devrait-on le mettre en place ?
- Pendant le temps de la diffusion parallèle, des éléments d'argument seront diffusés en streaming.
- Avant de le résoudre,`arguments`Chaîne 重组为完整 JSON。
- 运行一个三城市天气基准, démontrant une latence séquentielle par rapport à la latence parallèle.

##  problématique

没有平行电话 时,一个代理 回答 what is the weather in Bengaluru, Tokyo, and Zurich 会这样做:

```
user -> LLM
LLM -> call get_weather(Bengaluru)
host -> run executor, reply with result
LLM -> call get_weather(Tokyo)
host -> run executor, reply with result
LLM -> call get_weather(Zurich)
host -> run executor, reply with result
LLM -> final text answer
```

3 fois LLM 往返, chaque fois retour à payer de l'exécuteur latence ∼大约是理想壁表时间的4倍──

Utilisez des appels parallèles:

```
user -> LLM
LLM -> call get_weather(Bengaluru); call get_weather(Tokyo); call get_weather(Zurich)
host -> run all three executors concurrently, reply with three results
LLM -> final text answer
```

Une fois LLM 往返──Executor 时间是三者的最大值, et non pas总和──在OpenAI、Anthropic 和 Gemini 上的生产基准显示, pour les charges de travail de ventilation, le mur-horloge peut être réduit de 60% à 70%──

Lorsque trois modifications sont effectuées, vos résultats doivent être conformes.`tool_call_id`, laissez le modèle les mettre en commun. Lorsque le résultat est retourné en forme de flux, vous devez d'abord mettre en place des fragments d'arguments complets en JSON, puis les exécuter.

## 概念

### 启用 parallèle

- **OpenAI。** `parallel_tool_calls: true`默认开启── 设置为`false`Une série de séries.
- **Anthropic。**- Je suis là.`disable_parallel_tool_use: false`实现 parallèle Claude 3.5 及以上默认开启)`true`C'est sérieux.
- **Gemini。**始终具备平行能力;`tool_config.function_calling_config.mode = "AUTO"`La décision du modèle.

Quand les outils ont une dépendance`create_file`Alors ...`write_file`) 、 un mode de transport utilisé influence un autre mode de transport utilisé, ou un limitateur de taux ∞ incapable de supporter le ventilateur ∞, désactiver parallèlement ∞

### Corrélation de l'ID

chaque mode d'utilisation a un modèle`id`◊ chaque résultat du retour de l'hôte doit contenir le même id.

- **OpenAI。**Chaque message de rôle de l'outil`tool_call_id`Il y a une autre.
- **Anthropic。**Chaque .`tool_result`Le bloc de dessus`tool_use_id`Il y a une autre.
- **Gemini。**Chaque .`functionResponse`Le plus haut`id`(Gemini 3 及以上;Gemini 2 按名匹配, qui se fera dans les appels parallèles du même nom 时出错)

### Il n' y a pas de connexion

L'hôte se trouve dans son propre filet, une routine ou un ouvrier à distance, et il utilise chaque utilisateur.`asyncio.gather`Ou une concurrence structurée, ou une concurrence structurée, ou une concurrence structurée, ou une concurrence structurée, ou une concurrence structurée, ou une concurrence structurée, ou une concurrence structurée, ou une concurrence structurée, ou une concurrence structurée, ou une concurrence structurée, ou une concurrence structurée, ou une concurrence structurée, ou une concurrence structurée, ou une concurrence structurée, ou une concurrence structurée, ou une concurrence structurée, ou une concurrence structurée, ou une concurrence structurée, ou une concurrence structurée, ou une concurrence structurée, ou une concurrence structurée, ou une concurrence structurée, ou une concurrence structurée, ou une concurrence structurée, ou une concurrence, ou une autre.

Un bug habituel: selon la liste d'appels 顺序回复结果, plutôt que selon la finition 顺序回复──`tool_call_id`, mais si un résultat est perdu ou répété, le décompte de l'ordre rendra le décompte plus difficile.

### Appels d' outils de diffusion

Lorsque le modèle est utilisé sous forme de flux,`arguments`Il faut préparer un accumulateur pour chaque ID.

按 fournisseur de structure:

- **OpenAI。**Chaque morceau est`choices[0].delta.tool_calls[i].function.arguments`(cordon partiel)`index`(liste d'appels en position centrale)`id`Il est apparu pour la première fois, il l'a lu et il l'a lu.`finish_reason = "tool_calls"`时解析 JSON。
- **Anthropic。**Événements de streaming`message_start`Et puis chaque bloc , un .`content_block_start`, type `tool_use`(contient l'identifiant, le nom, l'entrée)`content_block_delta`événements 携带 `input_json_delta`Des morceaux.`content_block_stop`Il est fermé à chaque bloc.
- **Gemini。** `streamFunctionCallArguments`(Témini 3 及以上)`functionCallId`Les appels peuvent donc être effectués en trois jours, en continuant chaque fois un appel complet.

### JSON partiel et partage précoce

Dans le`arguments`完整之前不能解析── comme `{"city": "Beng`Ce type de JSON partiel n'est pas valide JSON, va abandonner.`finish_reason = "tool_calls"`、Anthropique `content_block_stop`, ou l'événement de fin de stream de Gémeaux.`json.loads` la pratique la plus efficace est d'utiliser un parseur JSON incrémentiel, dans la structure de termination des événements; le guide de streaming d'OpenAI recommande cette pratique, pour démontrer l'utilisation réelle de l'indicateur de pensée .

### Résultats hors commande

```
call_A: fast API, returns first
call_B: slow API, returns second
call_C: median API, returns third
```

réponse de l'hôte  encore doit citer ids:

```
[{role: "tool", tool_call_id: "call_A", content: ...},
 {role: "tool", tool_call_id: "call_B", content: ...},
 {role: "tool", tool_call_id: "call_C", content: ...}]
```

Dans OpenAI ou Anthropic, répondre au milieu de l'ordre n'affecte pas la justesse.

### Indice de référence: séquentiel par rapport parallèle

`code/main.py`Le système de transmission de la ligne de travail est en phase avec le système de gestion de la ligne de travail.

Réponse: Les appels parallèles seront utilisés pour les APIs de téléphonie mobile  augmenter la pression  pour le service à taux limité faire 10 路 fan-out 会失败──Phase 13 · 17 会覆盖 gateway-level backpressure;retry semantics 计划放在未来阶段──

### Le temps de diffusion de l'horloge de mur

Si le modèle est lui-même sorti sous forme de flux, vous pouvez exécuter les arguments d'un certain appel  complet immédiatement après, plutôt que tous les autres appels sont terminés ⋅ c'est une sorte d'optimisation enregistrée par OpenAI, mais pas tous les SDK sont exposés ⋅ le harness de la classe va le faire: si le flux de simulation ⋅ produit un objet d'argument complet, l'hôte lancera l'appel ⋅


```figure
tp-parallel-fanout
```

## Utilisez-le

`code/main.py`Il y a deux parties.`concurrent.futures.ThreadPoolExecutor`, l'ordre et la mise en route de trois appels météorologiques simulés, et l'heure du mur imprimée.`arguments`Les morceaux,并用 `StreamAccumulator`Il n'y a pas de LLM, pas de réseau, seulement de logique de réorganisation.

关注点:

- Le temporiseur séquentiel atteint 1,8 seconde. Le temporiseur parallèle atteint 0,8 seconde.
- L'accumulatrice  via le tampon d'identification, et seulement dans chaque appel de JSON 完整时解析, traiter les morceaux de l'ordre jusqu'à la fin.
- L'exécuteur dans certains id des arguments finaliser 后立即启动, plutôt que d'autres tous les flux 结束──

## Je le livre.

本课会产出 `outputs/skill-parallel-call-safety-check.md` Donner un registre d'outils, cette compétence 会审计 quels outils peuvent être en sécurité parallélisés, quels sont les dépendances de commande, quels sont les limites de taux de pression `parallel_safe`Les drapeaux de l'Union européenne

## 练习

1. 运行  référencement`code/main.py`Il n'y a pas de différence entre les latences parallèles et les ratios séquentiels.`max/sum`(en effet, la programmation des fils, la sérialisation et le débit de harnais sont en fonction de la valeur idéale)

2. 扩展 accumulateur,处理 call a été annulé en milieu de cours 情况:`cancelled`Quel fournisseur a déjà enregistré cette situation ?`content_block_stop`语义和 OpenAI `finish_reason: "length"`- Je suis un homme.

3. - Je veux le faire .`asyncio.gather`替换线程池──对两者做基准──你应该能看到异步 有小幅收益,因为语境切换成本更低,但前提是执行者做真I/O──

4. 选择两个不应对化的 outils (par exemple)`create_file`Alors ...`write_file`)。 vers le registre 添加一个 `ordering_dependency`Le graphique,并基于该图对平行风扇做门――这是依赖意识规划的最小机制,未来的代理工程阶段 会将其形式化――

5. 阅读 OpenAI's section d'appels parallèles et de l'anthropic `disable_parallel_tool_use`Documents                                                                                                                                                                                                                                                              

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| Parallel tool calls | “一个 turn 里的 fan-out” | Model 在单个 assistant message 中发出多个 tool calls |
| `parallel_tool_calls` | “OpenAI 的 flag” | 启用或禁用 multi-call emission |
| `disable_parallel_tool_use` | “Anthropic 的反向开关” | Opt-out flag；默认启用 parallel |
| Tool call id | “Correlation handle” | 每次调用的标识符，result message 必须原样回显 |
| Accumulator | “Stream buffer” | 用于 partial `arguments` chunks 的 per-id string buffer |
| Out-of-order completion | “最快的先返回” | Parallel calls 以不可预测的顺序完成；ids 是粘合剂 |
| Dependency graph | “Ordering constraints” | 某些 tools 的输出会进入其他 tools 的输入；不能 parallelize |
| Parse-early trap | “JSON.parse 炸了” | 尝试解析不完整的 `arguments` string |
| `streamFunctionCallArguments` | “Gemini 3 feature” | 带有每次调用 unique id 的 streamed argument chunks |
| Completion-order reply | “不要等全部完成” | 结果一到就回复，并按 id 标记 |

## 延伸阅读

- [OpenAI — Parallel function calling](https://platform.openai.com/docs/guides/function-calling#parallel-function-calling) 默认行为和opt-out flag
- [Anthropic — Tool use: implementing tool use](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/implementing-tool-use) `disable_parallel_tool_use`Et le résultat de la collecte
- [Google — Gemini function calling parallel section](https://ai.google.dev/gemini-api/docs/function-calling) Appels parallèles liés à l' id de Gémeaux 3
- [OpenAI — Streaming responses with tools](https://platform.openai.com/docs/api-reference/responses-streaming) Rassemblement des arguments déchiquetés des flux OpenAI
- [Anthropic — Streaming messages](https://docs.anthropic.com/en/api/messages-streaming)- Je suis là.`input_json_delta``content_block_delta`
