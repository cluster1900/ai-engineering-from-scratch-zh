# Fonction Appelant à l'aide de l'opération  OpenAI, Anthropic, Gemini

> Les trois fournisseurs frontaliers ont reçu en 2024 la même boucle d'appel d'outils, puis distribué dans tous les autres endroits.`tools`et `tool_calls`❖ Utilisation anthropique `tool_use`et `tool_result`Les blocs`functionDeclarations`Et la corrélation unique-id. Ceci est différent, laissez le code livré par un fournisseur être transféré à un autre fournisseur.

**Type:** Build
**Languages:** Python (stdlib, schema translators)
**Prerequisites:** Phase 13 · 01（the tool interface）
**Time:** ~75 分钟

## Objectif de l'apprentissage
- Il y a aussi des différences entre les trois types de charges utiles appelant à la fonction OpenAI, Anthropic et Gemini.
- Pour les autres, il est nécessaire de modifier les paramètres de la liste des paramètres de l'application.
- Dans chaque fournisseur`tool_choice`Pour imposer, interdire ou sélectionner automatiquement les appels d'outils.
-  Comprendre les limites d'utilisation de chaque fournisseur  (numéro d'outils, profondeur de schéma, longueur de l'argument), ainsi que les signatures d'erreur émises par chaque fournisseur 

##  problématique
La forme de la demande d'appel à la fonction en tant que fournisseur et en tant que tel.

**OpenAI Chat Completions / Responses API.**Tu es entré .`tools: [{type: "function", function: {name, description, parameters, strict}}]` la réponse du modèle 包含 `choices[0].message.tool_calls: [{id, type: "function", function: {name, arguments}}]`, parmi lesquels `arguments`Il faut résoudre la chaîne JSON.`strict: true`) par décoding restreint 强制方案 de conformité.

**Anthropic Messages API.**Tu es entré .`tools: [{name, description, input_schema}]`◊ réponse 以 `content: [{type: "text"}, {type: "tool_use", id, name, input}]`Retournez.`input`已被解析 (): 已被解析 (): 已被解析 (): 已被解析) 已是对象,不是字符串 (: 已被解析) ── 你再回复一个新的 (: 已被解析) `user`Message, dont le contenu`{type: "tool_result", tool_use_id, content}`Le bloc

**Google Gemini API.**Tu es entré .`tools: [{functionDeclarations: [{name, description, parameters}]}]`(Enchâssé dans `functionDeclarations`Réponse`candidates[0].content.parts: [{functionCall: {name, args, id}}]`À l'arrivée, parmi eux.`id`Dans la version précédente, il était utilisé pour la corrélation parallèle.`{functionResponse: {name, id, response}}`Il y a une autre.

Une équipe a écrit un agent météorologique sur OpenAI, juste pour plomber, être transplanté à Anthropic, il faut deux jours, être transplanté à Gémeaux, il faut aussi un jour.

Le cours de formation de la formation de traducteur, de formation de trois formats, de formation de la formation de la formation de traduction, de formation de la formation de la formation de la formation de la formation de la formation de traduction, de formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation.

## 概念
### La structure commune

Chaque fournisseur a besoin de cinq choses:

1. **Tool list.**Nom de chaque outil, description et schéma d'entrée
2. **Tool choice.** obliger à utiliser un outil spécifique  interdire des outils, ou faire en sorte que le modèle décide
3. **Call emission.**命名 outil 和 arguments de sortie structurée。
4. **Call id.**La réponse 关联到正确的调用 (parallèle 时很重要)
5. **Result injection.**Un message ou un blocage, résultat sera un appel.

### 个个场比较形状 diffère par rapport à la forme

| Aspect | OpenAI | Anthropic | Gemini |
|--------|--------|-----------|--------|
| Declaration envelope | `{type: "function", function: {...}}` | `{name, description, input_schema}` | `{functionDeclarations: [{...}]}` |
| Schema field | `parameters` | `input_schema` | `parameters` |
| Response container | assistant message 上的 `tool_calls[]` | type 为 `tool_use` 的 `content[]` | type 为 `functionCall` 的 `parts[]` |
| Arguments type | stringified JSON | parsed object | parsed object |
| Id format | `call_...`（OpenAI 生成） | `toolu_...`（Anthropic） | UUID（Gemini 3+） |
| Result block | role `tool`, `tool_call_id` | 带 `tool_result`, `tool_use_id` 的 `user` | 带匹配 `id` 的 `functionResponse` |
| Force-a-tool | `tool_choice: {type: "function", function: {name}}` | `tool_choice: {type: "tool", name}` | `tool_config: {function_calling_config: {mode: "ANY"}}` |
| Forbid tools | `tool_choice: "none"` | `tool_choice: {type: "none"}` | `mode: "NONE"` |
| Strict schema | `strict: true` | schema-is-schema（始终 enforce） | request level 的 `responseSchema` |

### Vous rencontrerez réellement des limites

- **OpenAI.**Chaque requête maximum 128 outils ⋅ Profondeur du schéma 5⋅ Chaîne d'arguments <= 8192 octets ⋅ Mode strict                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `$ref`Il n' y a pas de chevauchement .`oneOf`- Je suis là.`anyOf`- Je suis là.`allOf`, chaque propriété est en place`required`Dans le centre.
- **Anthropic.**Chaque demande, maximum 64 outils. La profondeur du schéma n'a pas de limite, mais la limite pratique est de 10.
- **Gemini.**Chaque requête maximal 64 个函数──Types de schéma sont un sous-ensemble OpenAPI 3.0(par rapport au schéma JSON 2020-12 略有差异)──自 Gemini 3 起,appels parallèles 使用 unique-id──

### `tool_choice`comportement

Trois modes que tout le monde soutient, juste nommé différemment.

- **Auto.**Modèle 选择 tool 或 text──默认值──
- **Required / Any.**Le modèle doit au moins utiliser un outil.
- **None.**Le modèle n'a pas besoin d'outils.

En outre, chaque fournisseur a un modèle unique:

- **OpenAI.**按名 强制使用特定工具──
- **Anthropic.**按名 强制使用特定工具;`disable_parallel_tool_use`flag 区分 single vs multi。
- **Gemini.** `mode: "VALIDATED"`La réponse sera traitée par un validateur de schéma, quel que soit l'intention du modèle.

### Appels parallèles

Les ouvertures`parallel_tool_calls: true`(默认) va envoyer plusieurs appels dans un message d'assistant.`tool_call_id`Pour répondre à une demande, le passé anthropique est une seule demande.`disable_parallel_tool_use: false`(截至Claude 3.5 的默认值) Activer multi―Gemini 2 允许通话并行, mais ne donne pas d'id stables;Gemini 3 增加 UUIDs, de sorte que les réponses hors ordre peuvent être nettement correlatives―

### Retour en continu

三者都支持流媒体工具调用──导线格式 不同:

- **OpenAI.** `tool_calls[i].function.arguments`Les morceaux du delta augmenteront jusqu'à ce que vous ayez accumulé jusqu'à ce que vous ayez accumulé.`finish_reason: "tool_calls"`Il y a une autre.
- **Anthropic.**Événements de démarrage/delta/arrêt de blocage。`input_json_delta`Les pièces porter avec des arguments partiels。
- **Gemini.** `streamFunctionCallArguments`(Gemini 3 新增) Début de l' émission`functionCallId`Les pièces, donc plusieurs appels parallèles peuvent être échangés.

Phase 13 · 03 会深入讲 parallèle + streaming reassemblage。本课聚焦宣言 和单调形──

### Erreurs et réparations

Les erreurs d'argumentation invalide sont également différentes.

- **OpenAI (non-strict).**Modèle  retour `arguments: "{bad json}"`, votre JSON parse  défaut, vous avez inséré un message d'erreur et réappeler 
- **OpenAI (strict).**Validation pendant le décoding  survenue; JSON non valide ne peut pas apparaître, mais peut apparaître `refusal`Il y a une autre.
- **Anthropic.** `input`Peut contenir des champs inattendus; le schéma est conseillé.
- **Gemini.**OpenAPI 3.0 quirk: champs d'objet 上的 `enum`Il faut que tu te valides.

### Le modèle de traducteur

Vous code dans la déclaration de l'outil canonique Looking like this ((formulaire de votre choix):

```python
Tool(
    name="get_weather",
    description="Use when ...",
    input_schema={"type": "object", "properties": {...}, "required": [...]},
    strict=True,
)
```

三小函数将它翻译成三种提供形式──`code/main.py`Le harnais central est en train de le faire, puis de mettre un faux appel d'outil via la forme de réponse de chaque fournisseur faire un aller-retour.

Les équipes de production vont mettre ce traducteur dans le bureau .`AbstractToolset`(AI piydantique)`UniversalToolNode`(Langgraph) ou `BaseTool`(LlamaIndex) ――Phase 13 · 17 会交付一个门户,在三者任意一个前面暴露OpenAI-shaped API──


```figure
function-call-args
```

## Utilisez-le
`code/main.py` définir un canonique `Tool`Dataclass, ainsi que trois traducteurs, sont utilisés pour émettre OpenAI、Anthropic 和 Gemini déclaration JSON。 puis il résoudra chaque forme de réponse fournisseur faite à la main 解析为同一个可нониcal call object,展示语义在表层之下是相同的──运行它,并并排差三种声明──

需要观察的点:

- Trois blocs de déclaration sont uniquement dans l'enveloppe et les noms de champs sont différents.
- Les trois blocs de réponse sont différents en fonction de l'appel Location Location`tool_calls`- Je suis là.`content[]`bloc`parts[]`entrée)
- Une .`canonical_call()`fonction de toutes les trois formes de réponse 中提取 `{id, name, args}`Il y a une autre.

## Je le livre.
本课产 出 `outputs/skill-provider-portability-audit.md` En définissant une intégration d'appels à fonction vers un fournisseur, cette compétence générera une vérification de portabilité: elle dépend des limites du fournisseur, des champs qui devront être renommés, ainsi que des pannes qui surviendront lorsqu'ils seront transférés vers un autre fournisseur.

## 练习
1. 运行  référencement`code/main.py`, vérifier trois déclarations fournisseurs JSONs sont classés dans la même couche inférieure `Tool`Objet: Modifier outil canonique, ajouter un paramètre enum,并确认只有双子翻译

2. Pour chaque fournisseur     `ListToolsResponse`Parser, du modèle à la`list_tools`Ou une liste d'outils de recherche 后返回的内容中提取工具.

3.  réaliser `tool_choice`Conversion:将 canonique `ToolChoice(mode="force", tool_name="x")`映射到三种供应商形状──然后映射 `mode="any"`et `mode="none"`◊ Checkha本课的差表──

4. 选择三个供应商中一个,从头到尾阅读它的函数调用指南――找出它的方案规范中一个其他两个不支持的领域――候选项:OpenAI `strict`、Anthropique `disable_parallel_tool_use`Les Gémeaux`function_calling_config.allowed_function_names`Il y a une autre.

5. 写一个测试向量:一个论点 违反声明的方案的工具调用──将它运行过每个供应商的验证器(Lesson 01 中的 stdlib验证器可以作为代理),并记录触发了哪些错误──记录你在生产中会为了严格使用哪个供应商──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Function calling | "Tool use" | 用于 structured tool-call emission 的 provider-level API |
| Tool declaration | "Tool spec" | Name + description + JSON Schema input payload |
| `tool_choice` | "Force / forbid" | Auto / required / none / specific-name modes |
| Strict mode | "Schema enforcement" | OpenAI flag，用于约束 decoding 以匹配 schema |
| `tool_use` block | "Anthropic's call shape" | 带 id、name、input 的 inline content block |
| `functionCall` part | "Gemini's call shape" | 包含 name、args 和 id 的 `parts[]` entry |
| Arguments-as-string | "Stringified JSON" | OpenAI 将 args 作为 JSON string 返回，而不是 object |
| Parallel tool calls | "Fan-out in one turn" | 一个 assistant message 中的多个 tool calls |
| Refusal | "Model declines" | strict-mode-only 的 refusal block，而不是 call |
| OpenAPI 3.0 subset | "Gemini schema quirk" | Gemini 使用一种类似 JSON-Schema 的 dialect，存在细微差异 |

## 延伸阅读
- [OpenAI — Function calling guide](https://platform.openai.com/docs/guides/function-calling) 包含 le mode strict et les appels parallèles de référence canonique
- [Anthropic — Tool use overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview) `tool_use`et `tool_result`sémantique de bloc
- [Google — Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling) appels parallèles, identifiants uniques et sous-ensemble OpenAPI
- [Vertex AI — Function calling reference](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/function-calling) Surface de l'entreprise de Gémeaux
- [OpenAI — Structured outputs](https://platform.openai.com/docs/guides/structured-outputs) schéma de mode strict 强制执行细节
