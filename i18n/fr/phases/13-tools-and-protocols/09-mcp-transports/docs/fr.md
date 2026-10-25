# MCP 传输层:studio avec sans état HTTP diffusable

> Le niveau de transmission est responsable du transport de MCP, mais il ne fournit pas l'état de l'accord manquant.`2026-07-28`规范中,本地 stdio et le téléchargement en direct HTTP 均承载完全自描述的独立请求──

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 07 与 08（构建 MCP Server 与 Client）
**Time:** ~65 分钟

## Objectif de l'apprentissage

- Pour le processus de sélection de l'étudiant, pour le réseau de service sélection de l'HTTP diffusée.
- 实现现代单端点、纯 POST(POST-only) du protocole de transmission HTTP diffusable
- 镜像并校验 MCP 版本号、方法名与名称
- L'échéance de la demande de répartition de la durée de la demande de répartition de la durée de la demande de répartition de la durée de la demande de répartition de la durée de répartition de la demande de répartition de la durée de répartition de la demande de répartition de répartition de la durée de répartition de la demande de répartition de répartition de la durée de répartition de la demande de répartition de répartition de la durée de répartition de la demande de répartition de répartition de répartition de la durée de répartition de la demande de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition de répartition.`subscriptions/listen`Je suis là.
- 迁移基于 Session 和早期 HTTP+SSE 的部署,杜绝将 Legacy 行为误当现代规范呈现──

## 问题背景

早期的流媒体HTTP 修订版将协议协商与底层的连接和会议 绑定混为一谈――Server 可以发发发`Mcp-Session-Id`、 exposer indépendamment de GET 推送流、 accepter de DELETE`Last-Event-ID`Retourner à la vie

MCP `2026-07-28`Toutes les requêtes peuvent être distribuées à n'importe quel travailleur en bonne santé, car la version du protocole et la capacité du client sont entièrement enveloppées dans le corps de requête.

Le système ainsi construit possède une capacité d'expansion horizontale plus forte et un esprit de référencement plus clair. Cela signifie également que si la couche de transmission de 2025 continue à être considérée comme la norme actuelle, il y aura un modèle de sécurité et de défaillance à l'intérieur de l'infiltration.

## 核心概念

### stdio 模式

stdio 绑定专用于 启动客户端本地子进程:

- Client chaque page vers stdin 写入一条 UTF-8 编码的 JSON-RPC 消息──
- Le serveur chaque fois vers stdout 写入一条 UTF-8 编码的 JSON-RPC 消息──
- Le serveur va tout mettre en ligne.
- Lorsque vous recevez le message, le serveur doit rapidement sortir.
- Chaque requête moderne est en cours.`params._meta`Le modèle de la version et la capacité.

进程生命周期 appartient au cycle de transport physique, n'est pas une session de protocole moderne ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅  ⋅                                                                                                                                                                                  

### Résultats de la recherche

现代 Server 暴露一个单一的 MCP 端点(如 `/mcp`), et seulement accepter POST

Chaque requête ou notification JSON-RPC, c'est un nouveau HTTP POST.

Pour les demandes reçues, le serveur retourne à l'une des suivantes:

- `Content-Type: application/json`: retourner un seul JSON-RPC 响应;
- `Content-Type: text/event-stream`: Retour sur les événements de notification liés à la demande, en suivant le dernier JSON-RPC  Réponses.

Pour les notifications reçues, le serveur est revenu sans réponse.`202 Accepted`Il y a une autre.

Le client déclare simultanément ces deux types de réponse:

```http
Accept: application/json, text/event-stream
```

### 纯 POST(POST-only) du réseau ferroviaire

现代 Streamable HTTP non existe GET 推送端点,也没有 DELETE Session 端点:

- `GET /mcp`Retour direct`405 Method Not Allowed`Il y a une autre.
- `DELETE /mcp`Retour direct`405 Method Not Allowed`Il y a une autre.
- `Mcp-Session-Id`直接被忽视, 绝不生成, 绝不回显.
- `Last-Event-ID`直接被忽视,因为现代流不支持断点重放续传.

Si le SSE du champ d'action de la demande est en cours de réception avant la rupture de la réponse finale, le client peut utiliser le nouveau JSON-RPC ID pour émettre une nouvelle demande indépendante, mais il ne peut pas tenter de récupérer ce flux.

### 源站校验(Validation de l'origine)

Le serveur est en train de recevoir des messages de connexion`Origin`Si le titre existe et n'est pas autorisé dans le liste blanche, retournez `403 Forbidden` Non-browser Client peut être épargné `Origin`Les règles officielles de transport sont permises.

本地开发 Server 应绑定到 `127.0.0.1`Les services de réseau doivent être autorisés à exécuter les certifications et les autorisations sur chaque demande; l'originalité ne peut jamais remplacer l'identité.

Lors de la réalisation de la normalisation de la configuration, utilisez des correspondances de la source précises, comme:`origin.startswith("https://trusted.example")`Le contrôle de l'attaquant n'est pas sûr, car il peut accepter le contrôle de l'attaquant.

### requête de données HTTP

Chaque requête est composée de:

```http
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes_search
```

规则要求:

- `MCP-Protocol-Version`Il est indispensable de s'y joindre.`params._meta.io.modelcontextprotocol/protocolVersion`- C'est tout à fait le cas.
- `Mcp-Method`Pour les éléments nécessaires, il faut les utiliser avec JSON-RPC.`method`- C'est tout à fait le cas.
- `Mcp-Name`Dans le`tools/call`- Je suis là.`resources/read`et `prompts/get`Il faut le faire.
- `Mcp-Name`Pour la`params.name`(ou `resources/read`时的 `params.uri`)。
- La valeur de la requête est différente de la taille de l'écriture, bien que la requête ne soit pas différente de la taille de l'écriture.

对于包含非 ASCII ou caractères spéciaux `Mcp-Name`, utilisez un format précis UTF-8 Base64 .

```text
=?base64?{Base64EncodedValue}?=
```

Le serveur décode cette valeur avant de la comparer avec la requête.

 Toute absence  forme ou non conforme à la requête du corps, retourner immédiatement HTTP `400`Avec l' erreur`-32020`◊ Si la version du serveur n'est pas compatible, retournez à HTTP `400`Avec l' erreur`-32022`, et avec des erreurs précises, par exemple`{"supported":["2026-07-28"],"requested":"2027-01-01"}`Il y a une autre.

Méthode moderne non connu pour retourner HTTP `404`Avec JSON-RPC `-32601`◊ JSON-RPC 响应体 est important, car les deux temps Client dépend de la différence entre l'erreur moderne et l'erreur héréditaire 端点未命中。

### Résultats de la demande de réaction

Le serveur peut utiliser SSE pour une seule demande plus longue:

```text
POST tools/call id=41
  <- notifications/progress related to id=41
  <- notifications/progress related to id=41
  <- JSON-RPC response id=41
stream closes
```

Le serveur ne peut pas être activé dans ce flux  Envoyer des requêtes JSON-RPC indépendantes  Sampleing、Elicitation et Roots 交互使用多轮往返请求(Multi Round-Trip Request)

Ne pas ajouter de nouvelles informations sur l'incident.`Last-Event-ID`Le mécanisme de récupération ne fait pas partie de la modern modification.

### 长周期变更推送:`subscriptions/listen`

变更通知 doit être lancé par le Client, et non par un GET indépendant:

```json
{
  "jsonrpc": "2.0",
  "id": "listen-1",
  "method": "subscriptions/listen",
  "params": {
    "notifications": {
      "toolsListChanged": true,
      "resourceSubscriptions": ["notes://note-1"]
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "course-client",
        "version": "1.0.0"
      }
    }
  }
}
```

POST 响应是一个长连接 SSE 流──其首条协议消息为 `notifications/subscriptions/acknowledged` La notification de confirmation  chaque modification de la notification suivante ainsi que les résultats finaux, sont`_meta`Dans le port`io.modelcontextprotocol/subscriptionId`, et la valeur égale à l'identifiant de la demande de surveillance. Le serveur peut envoyer un SSE.`subscriptions/listen`Il est possible de récupérer des données qui ont changé.

`resources/subscribe`Avec `resources/unsubscribe`属于 Legacy 时代, ne les utilisez pas dans les liens modernes.

### 显式应用层状态

移除协议 Session 绝对不意味着禁止有状态的工作流──Serveur peut générer un gestus de l'état opaque (State Handle) et le retourner dans le résultat normal de l'outil──Client dans la régularisation ultérieure le gestus sera utilisé comme un paramètre explicite pour le saisir──

Le terme est lié à l'objet de l'identité, confère un temps de péremption indéterminé et de validité indéterminée et est strictement autorisé à chaque utilisation.

Les défauts induits par l'état de l'inconnu sont mécaniques:

1. Demandez à A de créer un projet dans l'inventaire du processus.
2. 响应没有回复草稿句柄, car la réalisation d'un faux lien elle-même peut identifier le projet.
3. La requête B est une nouvelle fois, il y a un deuxième numéro.
4. 副本 2  posséder des données relatives à un accord légal, mais ne pouvoir nommer ou charger le projet, c'est que le flux de travail a échoué ou a lu des objets locaux erronés.
5. 粘性路由 ([[routage fixe]) semble avoir réparé les symptômes jusqu'à ce qu'une fois de nouveau démarrer, publier, redéfinir ou faire une erreur de déplacement jusqu'à ce que la prochaine requête soit déplacée.

La limite exacte comprend deux parties: le texte du protocole est conservé dans chaque demande; l'état d'application durable est conservé dans le stockage partagé, avec le serveur produit et retourné à la clé du client. La prochaine fois que vous utiliserez ce dernier, chaque copie peut charger la même pièce, l'autorité est donnée pour lier les documents à un sujet et un locataire certifiés.

 selon le mécanisme de sélection de l'état du cycle de vie: requête interne local variable seulement service une seule fois de modification;  court MRTR  continuation peut être utilisé avec protection intégralité `requestState`Les projets ou tâches de duration nécessitent une explication claire, une réécriture de la mise en commun de la duration, du temps, du contrôle et de l'équivalence.

### HTTP 双时代兼容

同时支持现代与 Legacy Server 首先尝试现代 POST──如果收到HTTP `400`- Je suis là.`404`Ou `405`, il va vérifier la réponse:

- 已识别的现代 JSON-RPC 错误证明 Server is现代的── modifier la requête ou modifier la version de la version publiée par l'autre.
- Un réacteur de réponse ou un réacteur de réponse indétectable peut signifier que c'est un serveur HTTP+SSE hérité.`endpoint`- Je suis désolé.

Pendant le transfert, le serveur peut simultanément soutenir deux époques: porter les demandes de données modernes via le POST moderne 实现, tout en conservant l'héritage indépendant du client ancien 端点.`2026-07-28`Une partie de la...

```figure
tp-transport-handshake
```

## 动手实践

`code/main.py`仅使用Python 标准库实现一个有限的现代流动HTTP Server──它校验 Origin与镜像请求头,忽略已移移的Session请求头,为普通调用返回JSON,并演示一个有限的 `subscriptions/listen`- Je suis en train de le faire.

```bash
cd code
python3 main.py --probe
python3 -m unittest discover tests -v
```

探针会依次检验:

- Illegal Origin 会被拒绝;
- 服务发现在没有Session ID en cas de réussite;
- 传入的 `Mcp-Session-Id`Avec `Last-Event-ID`Ils sont ignorés.
- 头部与请求体不一致时返回 `-32020`Le dépôt de la commission
- 版本不支持时返回 `-32022`及 précis `supported`Avec `requested`données;
- Recevoir de l' avis sans ID  Retour HTTP `202`Air response;
- GET 和 DELETE Soyez en mesure de retourner directement à HTTP `405`Le dépôt de la commission
- `subscriptions/listen`Il s'agit d'un POST 响应流, dont les notifications de confirmation 变更通知和最终结果都带着对应的订阅 ID.

## 交付物

本课交付 `outputs/skill-mcp-transport-migrator.md`Il fournit des instructions de réglementation pour le déplacement des protocoles passés Session, complément des titres de cours, utilisation`subscriptions/listen`替代裸 GET 流,并使 Legacy 适配层保持清晰独立──

##  exercice et réflexion

1. De l' un à l' autre`Mcp-Method`, confirmer le retour HTTP `400`Avec l' erreur `-32020`Il y a une autre.
2. 发送请求头与请求体一致的版本 `2027-01-01`, confirmer le retour HTTP `400`Il y a une erreur.`-32022`Et des données précises.`{"supported":["2026-07-28"],"requested":"2027-01-01"}`Il y a une autre.
3. Pour une ressource non ASCII URI envoyer Base64 en format poste`Mcp-Name`, confirmer la valeur de la résolution`params.uri` effectuer une comparaison 
4. Dans une écoute limitée, le résultat final sera retracé, avec un nouveau JSON-RPC ID, et le redépartement de l'outil.
5. Pour ping 工具 添加显式工作流句柄, le lier au sujet autorisé, sans dépendre de la connexion personnelle.

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| stdio | 基于 Client 发起的子进程 stdin/stdout、以换行符分隔的 JSON-RPC 传输 |
| Streamable HTTP | 单一端点架构，其中每条现代消息均为一次全新的 HTTP POST 调用 |
| 请求作用域 SSE (Request-scoped SSE) | 针对单个请求的 POST 响应流，输出相关通知及最终响应后自动关闭 |
| `subscriptions/listen` | 客户端主动开启的长周期 POST 请求，用于接收选择订阅的变更通知 |
| 请求头不匹配 (Header mismatch) | 当镜像请求头与请求体内容不一致时，返回 HTTP 400 与 -32020 报错 |
| 源站校验 (Origin validation) | 针对传入网络连接的 DNS 重绑定防御机制，不能替代身份认证 |
| 显式状态句柄 (Explicit state handle) | 作为普通业务参数传递的应用层 Token，代替隐藏的 Session 状态 |
| Legacy 桥接层 (Legacy bridge) | 专门隔离保留的旧版本行为，仅用于向后兼容历史客户端 |

## 延伸阅读

- [MCP Transport Overview](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
- [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP Subscriptions](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions)
- [MCP 2026-07-28 Changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
