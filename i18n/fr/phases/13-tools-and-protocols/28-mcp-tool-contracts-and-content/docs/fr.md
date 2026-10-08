# Contrats et contenus des outils du MCP

>  Lorsque l'on trouve ∞ paramètres ∞ résultats ∞ pages et que les données de transmission sont réunies, l'automatisation est assurée.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13, Lessons 07, 09, and 10
**Time:** ~120 minutes

## Objectif de l'apprentissage

- Utilisation de JSON Schema 2020-12  définir les outils d'entrée et sortie.
- 校验结构化结果, sans supposer qu'il doit être un objet JSON.
- Dans le texte, l'image, le son, le lien entre les ressources et les ressources.
- Avant d'être exposé à un modèle, refusez d'être en sécurité.`x-mcp-header`定义──
- La codage précise des valeurs de référence des paramètres, et l'identification de la rigueur entre le titre de demande et le corps de demande.
- Dans le cadre d'une analyse de la valeur des caractères,
- Pour le`completion/complete`Il est recommandé de définir la portée et de contrôler les limites.

## 核心问题

La fonction Python est très simple, mais en utilisant l'hôte AI, la capacité de déplacement à distance est un problème typique.

Le serveur met en œuvre l'outil. Finalement, le client décide si le résultat du retour est suffisamment sûr et efficace pour le retourner au modèle.

Si une frontière est en panne, tout sera détruit.

考虑以下五种常见故障:

- 描述符声明 retourne le résultat d'un objet, mais le serve端 retourne en réalité un tableau。
- 客户端在 `nextCursor`Pour le temps, j'ai fini par le faire.
- Les paramètres de jetons sensibles sont réfléchis dans le titre HTTP, ce qui les expose à tous les agents intermédiaires et à tous les systèmes de journaux.
- 包含 Unicode 路由值被作为原标标头发发送, entraînant une résolution non conforme entre le lien et la source de la page sur la séquence de caractères.
- Automatisier complet point à un utilisateur de l'environnement de production sans droit de visite a proposé le nom de l'environnement de production.

Ces défauts ne peuvent être résolus de manière plus rapide que la présente.

## 契约流水线

Nous allons chaque fois utiliser des outils pour les séparer en cinq portes de mise en œuvre suivantes:

1. **发现（Discover）**: read取确定性、已分页的工具列表──
2. **准入（Admit）**: éprouver chaque outil descripteur et mettre en œuvre des stratégies de sécurité locales.
3. **调用（Invoke）**: épreuve de références et construction de données de niveau de transmission.
4. **执行（Execute）**:运行工具处理函数并对错误进行正确分类──
5. **消费（Consume）**Avant de livrer le modèle à l'utilisation, les blocs de contenu de l'épreuve sont structurés et sortent.

```figure
mcp-contract-pipeline
```

L'hôte possède le droit de contrôle de la connexion et de la connexion de consommation.

## JSON Schema est une fonctionnalité

Dans le MCP `2026-07-28`Dans le cadre de la réglementation,`inputSchema`Avec `outputSchema`均采用 JSON Schema──当省略 `$schema`声明时,默认方言为 2020-12。

输入 Schema 必须是一个 schema object. Même si un outil n'a pas besoin de paramètres, il doit également précisément déclarer son format acceptable:

```json
{
  "type": "object",
  "additionalProperties": false
}
```

C' est mieux .`{ "type": "object" }` stricte beaucoup, les derniers permettent de transmettre des propriétés supplémentaires.

输出 Schema est optable. Mais le service est publié.`outputSchema`En retour, chaque fois que l'on retourne, on s'engage à revenir conformément au contrat.`structuredContent`, même si les résultats comprennent`isError: true`C'est aussi le cas. L'erreur de marque est une simple classification des résultats d'exécution, elle ne peut absolument pas exonérer les résultats de sortie publiés.

### Le contenu structuré peut être une valeur JSON

Ne le fais pas !`structuredContent`Il peut être:

- Un objet;
- Un tableau;
- Une corde;
- Un numéro;
- Un booléen;
- `null`Il y a une autre.

Par exemple, le tableau ci-dessous est le résultat de cette réaction:

```json
{
  "name": "tag_catalog",
  "inputSchema": {
    "type": "object",
    "additionalProperties": false
  },
  "outputSchema": {
    "type": "array",
    "items": {"type": "string"}
  }
}
```

Le résultat de son retour est parfaitement légal:

```json
{
  "resultType": "complete",
  "content": [
    {
      "type": "text",
      "text": "[\"contracts\", \"mcp\", \"stateless\"]"
    }
  ],
  "structuredContent": ["contracts", "mcp", "stateless"],
  "isError": false
}
```

Pour maintenir la compatibilité vers l'arrière, le retour aux résultats structurés doit généralement être effectué en JSON avec des textes séquencés dans des blocs de contenu.`structuredContent`C'est tout.

### 简明校验器 encore peut clarifier la nature des limites

Ce cours est spécialement conçu pour mettre en œuvre un ensemble de JSON Schema, afin de se maintenir complètement dans le cadre de la bibliothèque standard Python.

- type objet, ordre, chaîne, nombre entier, nombre, boole et nul;
- les attributs requis;
- `additionalProperties: false`Le dépôt de la commission
- les éléments du tableau;
- enum 枚举值;
- 字符串 minimale de longueur minLength

Ce n'est pas une réalisation complète pour remplacer les épreuves de production.**校验发生的时机与位置**: après la découverte, des tests de décrivaison, des tests de modification des paramètres avant l'exécution, ainsi que des tests de structuration des résultats avant la consommation.

## content bloc de charge des coûts différents

`content`Les données peuvent être regroupées en plusieurs types de blocs de contenu:

| 类型 | 适用场景 | 核心安全与控制边界 |
|------|------------|---------------|
| `text` | 人类与模型可读的摘要文本 | 将文本视为不可信输出 |
| `image` | 以 Base64 编码的视觉凭证 | 严格校验媒体类型（media type）与文件大小 |
| `audio` | 以 Base64 编码的语音或音频 | 严格校验媒体类型与时长上限 |
| `resource_link` | 客户端后续可按需拉取的 URI | 在后续读取资源时重新执行鉴权 |
| `resource` | 直接内嵌在当前结果中的数据 | 在当前调用立即强制执行载荷与内容上限 |

资源链接(`resource_link`) ne garantit pas que cette ressource soit présente.`resources/list`Il est un cité de la liste de ses outils de référencement. Lorsque le client tente de visiter cette URI, il doit toujours mettre en œuvre sa stratégie de contrôle d'accès aux ressources locales.

Résultats de la recherche`resource`Pour les travaux de grande taille ou en constante évolution, il est recommandé d'utiliser des liens de ressources; pour les données de certification limitées liées aux résultats de cet outil, il est recommandé d'utiliser des ressources intégrées.

Dans le cadre de cette étude, les données de référence sont fournies par le`evidence_bundle`Les résultats couvrent également ces cinq types de tests de légitimité de chaque bloc.

## `x-mcp-header`Il est partagé

Dans le`inputSchema`Une propriété interne peut être déclarée.`x-mcp-header` Dans le cadre du protocole de transmission HTTP en continu, le client se fera en image de l'image`Mcp-Param-{name}`Le titre:

```json
{
  "region": {
    "type": "string",
    "x-mcp-header": "Region"
  }
}
```

Quand les paramètres sont`region: "eu-west"`时, le niveau de transmission est le suivant:

```http
Mcp-Param-Region: eu-west
```

L'introduction de cette annotation vise à faire en sorte que l'équilibraire de charge, le réseau ou le moteur de stratégie soit terminé dans le cas d'une requête JSON complète sans avoir à résoudre le problème.**绝对不能**Utilisation pour transmettre des certificats ou des données sensibles

Le protocole a imposé des restrictions strictes:

- 标头名称必须非空, et conforme au code de référence du nom de champ HTTP 语法规范;
- Le nom de l'étiquette doit être unique dans toute la région;
- 参数 attribut type seulement can be string、integer ou booléen;
- Il est interdit d' utiliser`number`(浮点数)
- La solution ne peut être qu' immédiatement présente.`inputSchema.properties`La première étape est directement à l'intérieur du tronc.
- Le nombre total de valeurs doit être limité à`-9007199254740991`À la`9007199254740991`(JavaScript sûr intégralité de la portée)

La position des règles est de niveau linguistique, et doit être un mécanisme de sécurité défaillant. Il faut parcourir l'ensemble du schéma, et non seulement examiner le testateur pour identifier les attributs de haut niveau.`properties`Je suis là.`oneOf`Je suis en train de vous dire...`items`En passant par là.`$ref`Dans la définition du citation, ou dans tout schéma de sortie, tout doit être fermement rejeté.

Cette classe a ajouté une stratégie de sécurité de déploiement:`password`- Je suis là.`secret`- Je suis là.`token`- Je suis là.`api_key`Ou `authorization`Les règles officielles de la société de l'accès à l'accès sont précises:

审计时只记录标头名称,不记录其具体数值. 例代码会记录审计事件 `Mcp-Param-Region`, et sera de valeur concrète `eu-west`排除在审计日志之外──

### En construisant HTTP en tête de code numérique

参数值 est seulement en satisfaisant aux conditions suivantes, et peut être directement transmis sous forme de texte pur dans le titre:`!`À la`~`) composé, et ne contient pas de code de poste de première ligne.

```text
=?base64?{Base64UTF8}?=
```

Parmi eux `Base64UTF8`Base64 编码── Absolument pas avant cela pour les caractères exécuter trim(enlever首尾空格) 规范化或替换操作──Unicode 字符、空字串、空格、制表符、控制字符、CR或LF、带有前导或尾随空白的值, ainsi que tout original basé sur`=?base64?` La valeur initiale doit être codée  La valeur initiale doit être codée à nouveau, afin que le receveur puisse recréer le texte original, sans qu'il puisse être mal interprété comme un élément clé de la transition.

Bl'héritage unifié `true`Ou `false` L'intégralité du nombre doit être unifiée à 10 et doit être placée dans le cadre du nombre entier sûr de JavaScript.

### 服务端校验镜像副本

Le service doit être:

1. Dans le pré-emplacement de la liste des noms, recherchez tous les noms identifiés.`Mcp-Param-*`Le dépôt de la commission
2. S'il existe un format de base 64, effectuer un déchiffrement précis;
3. La comparaison des paramètres de requête JSON avec le texte de réponse après la décodage est stricte;
4. Si on constate une absence, une répétition, une apparition inattendue, une erreur de format ou une incohérence avec la demande, on refuse directement la publication de l'entreprise.

Le refus doit être renvoyé à HTTP `400`ainsi que JSON-RPC  err err err err code `-32020` La valeur du corps de demande et la forme du titre post-codifié ne sont pas du contenu du registre d'audit, le registre d'audit ne fait que reconnaître les titres de titre et les raisons de refus dans la catégorie de la demande.

`code/main.py`Il est donc possible de faire une comparaison directe avec cette logique.[第 09 课](../../09-mcp-transports/) En outre, il a expliqué la compatibilité de la méthode HTTP et de la version du protocole en plus large de la série de tests HTTP diffusés.

## Le signe est opaque

Le système de gestion des données de l'entreprise utilise des pages de navigation (paginaison de cours)  Le service du client décide de la taille et du format de navigation de chaque page  Le client doit simplement suivre un seul jugement:

```python
if result.get("nextCursor") is None:
    break
cursor = result["nextCursor"]
```

**绝对不要**写成如下形式:

```python
if not result.get("nextCursor"):
    break
```

Parce que tu es un homme.`""`Si l'on utilise directement Python pour déterminer la vraie valeur de la vérité, cela entraînera une rupture précoce.

Le client ne peut pas tenter de décoder le fichier, de s'auto-enrichir, de comparer le nouveau fichier avec l'ancien fichier en fonction de l'ordre de jugement ou de la conclusion du fichier. Le terminal peut signer le fichier, le lier à une version de catalogue spécifique ou le cartographier à un état privé de niveau inférieur, ce qui appartient à l'ensemble des détails de mise en œuvre interne du terminal.

Le service d'exemple est revenu après la première page.`""` Le client doit être en mesure de tracer la demande en envoyant la deuxième page de la demande.

```text
<first request with no cursor>
<second request with cursor "">
```

无效的游标输入 devrait générer des paramètres JSON-RPC invalide 错误(错误码 `-32602`)。

## Automatisiel est autorisé à attaquer face

`completion/complete`方法 for Prompt 参数与资源模板参数提供自动补充建议── il est très utile dans la liste des interactions, mais si elle n'est pas protégée, elle peut divulguer les noms sensibles protégés par les interfaces de la liste ordinaire──

Une déclaration de requête complète sur les objets cités ainsi que sur les paramètres actuels en cours de complémentation:

```json
{
  "method": "completion/complete",
  "params": {
    "ref": {
      "type": "ref/prompt",
      "name": "deployment_review"
    },
    "argument": {
      "name": "environment",
      "value": "st"
    }
  }
}
```

Le résultat de retour maximum contient 100 valeurs recommandées et peut être ajouté.`total`Avec `hasMore`Je suis en train de vous dire:

 doit être appliquée dans une application qui soit en parfaite conformité avec le Rapport ou la ressource cité.`development`Avec `staging`                                                                                                                                                                                                                                                              `production`Le conseil

Le service de production complète doit également disposer de:

- strictement de l'entrée;
- 区分调用者身份过;
- 客户端防(débarquement);
- 服务端限流(limiter le taux);
- Limitation du nombre de résultats;
- Dans le journal, éviter d'être exposé à des substances sensibles est recommandé.

Le complément appartient à l'assistance des moyens d'entrée, il ne peut jamais être le dernier pas de la vérification des droits de découverte.

## Mécanisme d'erreur à deux niveaux

Il faut faire une distinction stricte entre les erreurs de niveau de protocole et les erreurs de mise en œuvre des outils.

Lorsque MCP demande ne peut pas être correctement déployé, utilisez **JSON-RPC error**- Le numéro de la liste:

- Nom de l'instrument inconnu;
- 格式错误的请求报文;
- 缺失必要的请求元数据;
- 无效的分页游标──

Lorsque vous utilisez un outil de réussite et que l'outil est un défaut exploitable, utilisez un outil de réussite.`isError: true`**完整工具结果（complete tool result）**- Le numéro de la liste:

-  une source de données de rapport est temporairement inutilisable;
- 传入日期 dépasse la portée soutenue;
- Les règles de l'entreprise refusent l'opération demandée.

Le grand modèle est généralement capable de comprendre et de corriger les erreurs commises par les outils, mais le grand modèle ne peut pas corriger lui-même en violation de son propre système de sortie.

Si un outil déclare un schéma de sortie, il doit être construit à l'intérieur du schéma pour les défaillances exploitables.`route_report`Quand je ne réussis pas, je reviendrai.`isError: true`), la région requise est`accepted: false`La structure de la société est de retour.

## Handwriting réalisation

`code/main.py`L'utilisation de Python 标准库 complète réalisé la logique centrale des deux côtés de la frontière.

服务端实现:

-  pour chaque demande de MCP;
-  déclaré les outils et les capacités `server/discover`Le dépôt de la commission
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `tools/list`- Le détail
- Quatre descripteurs d'outils:
- Les données de type numérique sont des données de type numérique.
- Toutes les outils contenus blocs de type support;
- En streaming HTTP un致性门禁:解码已识别的参数标题, et retourner HTTP lorsque le contenu ne correspond pas `400`et JSON-RPC `-32020`Le dépôt de la commission
- 带权限控制与限流的补充功能──

客户端 réalisée:

- 工具描述符准入机制;
- Tout le monde.`x-mcp-header` stratégies de protection des zones de contrôle de position et de protection des zones sensibles;
- 精确的纯ASCII可见字符直接传输或Base64 UTF-8 编码;
- Exact trace de l'intransparence du cycle de pages de caractères vides;
- 参数与回归结果校验;
- 内容块合法性校验;
- ☐ seulement le nom de la marque et non le chiffre sensible du registre des événements de vérification de la marque.

Le décrivaine de non-sécurité contenu dans le but est un excellent exemple d'enseignement. Il prouve qu'un seul outil rejeté ne gênera jamais le chargement et l'enregistrement normal d'autres outils conformes à la réglementation.

## 运行验证 Le dépôt

À partir de code root

```bash
cd phases/13-tools-and-protocols/28-mcp-tool-contracts-and-content/code
python3 main.py
python3 -m unittest discover tests -v
```

Le programme de démonstration imprimera les outils déjà disponibles, les descripteurs rejetés, les deux requêtes de pages, les détails de retour, le contenu de l'archive structurée, les types de blocs de contenu, le nom de l'image, la valeur numérique ou le code, l'état de l'expérience HTTP, ainsi que la liste complète de recommandations en fonction du rôle du rédacteur.

## 交互式实验

- Je suis là .`code/main.py`Il n' a pas trouvé`TOOLS`变量:

1. Il va`tag_catalog.outputSchema.type`De `array`改为 `object`Il y a une autre.
2. 运行演示程序──观察客户端如何坚决拒绝回归的数组结果──
3. 恢复原始 Schema。
4.  garder la première page `nextCursor`Pour`""`, puis la dernière page revient .`nextCursor: None`Au lieu de le dire directement,
5. 运行测试并对比游标的追踪链路──
6. Pour une chaîne  attribut ajouter `x-mcp-header: "Authorization"`Il y a une autre.
7. 确认描述符准入检查在调用前将其成功拒绝──
8. 尝试使用包含Unicode、换行符、首尾空格以及字面文本 `=?base64?SGVsbG8=?=``region`取值──解码每标标发,验证原始值被完全无损地回原──
9. Je vais déménager`oneOf`- Je suis là.`items`Ou `$ref`定义的深层分支下──确认即使 la présentation ne pénètre pas dans cette branche, le descripteur pénétrera toujours dans le rejet──
10. 删除已识别标标头或改其解码后的取值── confirmer le code de retour de l'état HTTP 边界 `400`ainsi que JSON-RPC  err err err err code `-32020`Il y a une autre.

L'objectif central de cette expérience n'est pas de faire une note de JSON, mais de voir comment chaque branche est efficace.

## 动手实践

Pour faire une expérience étendre`search_evidence`Les outils

需求规范:

1. Son système d'entrée  accepté `query`- Je suis là.`limit`Et de sécurité.`region`Je suis en train de vous dire que vous êtes un homme.
2. Son schéma de sortie est constitué d'un ensemble d'objets, chaque objet comprenant`uri`- Je suis là.`title`et `score`Il y a une autre.
3. 结果中每项需要包含兼容性文本以及一个对应的资源链接(resource_link) 
4. 参数校验时拒绝未知属性──
5. `limit`受到应用层校验的上限约束──
6. 无权访问特定URI的调调用者, soit par complément automatique soit par sortie d'outil,都绝不能看到该URI──
7. 编写测试,覆盖不合规的分 评分、非法的标标注注解,以及两页分页列表场景──
8. Les tests de valeur numérique doivent être couverts par ASCII, Unicode, caractères de contrôle, caractères blancs, textes de type poste, ainsi que par JavaScript.
9. HTTP test 具需支持大小写不敏感标题名称查找, mais en cas de défaut ou de défaut de titre déjà identifié, il est déterminé à retourner le code d'état `400`Avec l' erreur`-32020`Il y a une autre.

## 交付产物

`outputs/skill-mcp-contract-reviewer.md`Il s'agit d'une compétence d'examen indépendante à répéter directement. Il peut également être utilisé pour décrire les outils d'entrée, les résultats d'exemple, les comportements et les compléments complets, il peut également être utilisé pour produire des décisions d'entrée, des programmes d'expérience de résultats, des stratégies de sécurité des titres et des cas de test négatifs spécifiques.

## 验证标准

Lorsque toutes les activités suivantes seront réalisées, l'objectif de cette partie sera d'achever:

- `tools/list`En plusieurs fois répétition, il faut maintenir la même logique.
- 客户端在 `nextCursor`Pour`""`时能正确发起第二分页请求──
- Les descripteurs de l'étiquette sensible à l'insécurité sont supprimés, tandis que d'autres outils de conformité sont normalement introduits.
- Les résultats peuvent être obtenus par le biais de son nombre de sorties Schéma
- Les résultats de l'expérience ont été négligés.
- 报错结果(Error results) ne doit pas être ignoré ou contraire au schéma de sortie publié.
- Les données de l'équipe de recherche sont à la recherche de données et de données.
- 标头审计事件仅记录标头名称,不记录其具体数值──
-  Pure ASCII 可见字符保持直传; Unicode、控制字符、带空格填充、空字符串及形似哨兵的值均均通过Base64 UTF-8 精确往返编解码──
- L'intégralité des images dépassant JavaScript est rejetée lorsqu'elle est dans la gamme de l'intégralité de sécurité.
-       `oneOf`- Je suis là.`items`- Je suis un objet.`$ref`Ou de sortie de schéma Interruption de l'entrée en phase de sortie
- Les titres identifiés ne sont pas sensibles à la rédaction, mais uniquement lorsqu'ils sont entièrement conformes à la valeur de la requête.`400`et JSON-RPC `-32020`Il y a une autre.
- L' analyseur ne revient pas .`production`Il y a une autre.
- 工具自身业务失败使用 `isError: true`; protocole format变 utilisant JSON-RPC `error`Il y a une autre.

## Mode de déclenchement de la production

| 故障现象 | 学习者看到的表象 | 正确处理方案 |
|---------|-----------------------|------------------|
| 客户端假定输出必定是 object | 合法的数组校验失败或被静默包装 | 依据发布的 Schema 进行校验，不假定结果必须为 object |
| 空字符串游标被当成 False 处理 | 最后一页数据意外丢失 | 只要 `nextCursor` 存在且非 null，就继续拉取下一页 |
| 镜像了敏感参数值 | 凭证密钥暴露在代理、WAF 或链路追踪日志中 | 拒绝该描述符，将机密保留在受保护的请求体内部 |
| 原始 Unicode 或空白字符直接镜像 | 网关与源站解析不一致，或值被意外规范化 | 使用 Base64 UTF-8 哨兵编码并在解码后进行比对 |
| 注解隐藏在 Schema 的复杂分支中 | 客户端在准入时漏检了路由元数据 | 遍历整棵 Schema 树，仅允许直接位于一级的属性携带注解 |
| 镜像了大整数 | 中间 JavaScript 代理对路由数值进行了舍入 | 拒绝超出 JavaScript 安全整数范围的数值 |
| 标头与请求体不一致 | 网关路由给服务 A，而源站实际执行服务 B | 在业务分发前以 HTTP `400` 和 JSON-RPC `-32020` 拒绝 |
| 忽略了输出 Schema | 下游程序消费了损坏的脏数据结构 | 在交给模型或应用程序前进行严格校验 |
| 盲目信任返回的资源链接 | 调用方直接读取了未获授权的 URI | 对每一次资源读取重新执行鉴权 |
| 自动补全共享了全局建议列表 | 多租户敏感隔离名称被泄露 | 按调用者身份、引用上下文与权限范围进行过滤 |
| 将工具注解当作安全策略 | 破坏性危险操作跳过了二次确认 | 在注解之外建立独立的授权与审批流 |
| 单个格式错误的工具搞垮整个发现流程 | 整台 MCP 服务端完全不可用 | 拒绝有问题的描述符，独立准入其余合规工具 |

## Capstone 串联

La phase 13 du projet Capstone nécessite un réseau capable de se regrouper à partir de plusieurs terminaux de service.

Utilisez ce cours pour évaluer les quatre principaux diplômes de Capstone:

-  un processus de découverte déterminant et complet;
- En exposant au modèle précédent des outils descripteurs de l'épreuve;
- Les blocs de contenu structurés et de sortie strictement définies qui ont été adoptés par l'école;
- Réglementation de la frontière de l'autorisation et de la mise en œuvre de la législation en vigueur.

Ne fais pas ça une seule fois.`tools/call`调用成功就宣称兼容网关规范──请务必捕获描述符、分页链路追踪、已准备入工具集、被拒绝工具集,以及至少一个完整的校验通过结果──

## 关键术语

| 术语 | 含义 |
|------|---------|
| `inputSchema` | 定义工具所接受参数的 JSON Schema 对象 |
| `outputSchema` | 定义 `structuredContent` 格式的可选 JSON Schema |
| `structuredContent` | 工具执行结果所生成的任意 JSON 结构化数值 |
| 内容块（Content block） | 具备类型化标记的 text、image、audio、resource_link 或 embedded resource |
| `x-mcp-header` | 将基础类型参数镜像为 Streamable HTTP 标头元数据的 Schema 注解 |
| 不透明游标（Opaque cursor） | 服务端发出的分页标记，客户端不得解释其内部含义 |
| 补全引用（Completion reference） | 正在请求参数补全的 Prompt 名称或资源 URI/模板 |
| 准入（Admission） | 客户端根据本地策略决定公开暴露还是拒绝已发现描述符的决策过程 |

## 延伸阅读

- [MCP Tools 规范](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- [MCP Completion 自动补全规范](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/completion)
- [MCP Pagination 游标分页规范](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/pagination)
- [MCP Streamable HTTP 参数标头规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#custom-headers-from-tool-parameters)
