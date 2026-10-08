# Les tâches du MCP  Élargissement: construction de tâches de pérennisation sur le cœur de l'état inexistant

> Le MCP sans état ne signifie pas que chaque opération doit être effectuée dans une seule demande. Les tâches officielles  étendre à un long cycle de vie du travail fournissent une claire durable.`tools/call`Retournez à cette phrase, tout cas peut être répondu.`tasks/get`, et les entrées du client sont passées par`tasks/update`Il n'y a pas besoin de faire un accord.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09 (transports), Phase 13 · 11 (stateless MRTR), Phase 13 · 12 (elicitation)
**Time:** ~90 minutes

## Objectif de l'apprentissage

-  strictement distinct entre le niveau de transmission de protocole et l'état de tâche de classe d'application de la duration 
- Dans chaque demande de capacités avec`server/discover`中协商 `io.modelcontextprotocol/tasks`- Je suis en train de me lancer.
-  seulement après avoir terminé la création, retour par le serveur `resultType: "task"``CreateTaskResult`Il y a une autre.
- Utilisation `tasks/get` faire des enquêtes, utiliser `tasks/update`提交任务输入,并使用 `tasks/cancel`发起协作式取消──
- 彻底弃旧版中关于 `tasks/status`- Je suis là.`tasks/result`et `tasks/list`De l'ancienne hypothèse.
- 通过 POST 响应的 SSE 流使用 `subscriptions/listen`订阅可选的任务变更通知──
- Réinitialiser le processus de réinitialisation de la tâche

## Pourquoi les tâches sont une extension

Les tâches ont été initiellement mises en œuvre en tant que caractéristiques de base expérimentales en 2025-11-25 规范中.`io.modelcontextprotocol/tasks` Expansion, permettant ainsi au client et au serveur de choisir de manière autonome de se connecter à un cycle de vie de tâche supplémentaire, sans avoir à faire l'objet de tous les scénarios d'expansion du protocole central MCP 

Bien que la norme d'expansion soit actuellement la résolution officielle des tâches, elle est toujours en phase de développement du projet.

Lorsque l'opération présente une ou plusieurs caractéristiques suivantes, utilisez la tâche suivante:

- L'exécution peut dépasser la demande ordinaire.
- 已由工作队列 (depuis la répartition des travailleurs) ou système d'exploitation externe
- Le client doit avoir la capacité de récupérer la requête après son redémarrage.
- L'opération doit être suspendue pendant le processus d'exécution pour attendre que l'utilisateur ou le modèle fournisse des informations supplémentaires.
- 支持取消操作与持久化结果检索是明确的产品功能需求──

Ne cherchez pas à créer des tâches à prix réduit. Introducer des termes, des réserves de stockage, des mécanismes de consultation, des stratégies de dépassement et de suppression des flux de transfert entraînera une complexité réelle.

## 无状态核心,有状态应用

MCP 2026-07-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `initialize`- Je suis là.`notifications/initialized`、 accord et `Mcp-Session-Id` Ce n'est pas excluant la fonction de produit construit en état de fonctionnement

L'id de tâche appartient à l'état de l'application explicite:

- Le serveur doit être durable avant de retourner à la tâche.
- Le client peut conserver cette identité et la refaire après le redémarrage.
- L'identifiant peut être routé vers n'importe quel serveur de la même base de stockage.
- Chaque tâche de réadaptation  Related methods 时都必须重新校鉴权──
- Le temps de transition et de nettoyage sont définis par la tâche, et non par le cycle de vie de la transmission.

Il existe une différence de nature entre l'état caché de la connexion et celui de la connexion au niveau du transport.

Les quatre cycles de vie suivants seront clairement décomposés:

| 状态类别 | 生命周期 | 归属位置 |
|---|---|---|
| 协议元数据 | 单次请求 | `params._meta`，在每次调用中重新校验 |
| 传输层任务 | 单个 stdio 请求或 HTTP 响应 | 具有有界超时期限的正在进行的协调器（in-flight coordinator） |
| MRTR 交互延续 | 单次重试序列 | 受完整性保护的 `requestState`，必要时叠加防重放控制 |
| 持久化任务 | 跨越请求、副本、重启与重连 | 以受权的 `taskId` 为键的共享应用程序存储 |

La tâche de l'enregistrement ne permet pas à MCP de devenir un protocole d'état, mais rend l'application extrêmement imprévisible.`tasks/get`Il est nécessaire de terminer la rédaction permanente avant de retourner la phrase, et de laisser chaque tâche être résolue dans le même partage de la rédaction.

## Capacité 协商

Clients dans chaque requête utilisée Déclaration étendre l'appui:

```json
{
  "_meta": {
    "io.modelcontextprotocol/protocolVersion": "2026-07-28",
    "io.modelcontextprotocol/clientCapabilities": {
      "extensions": {
        "io.modelcontextprotocol/tasks": {}
      }
    },
    "io.modelcontextprotocol/clientInfo": {
      "name": "lesson-client",
      "version": "1.0.0"
    }
  }
}
```

Le serveur de `server/discover`Retourner à la vérité`supportedVersions`、capacités`ttlMs`et `cacheScope`Il a également réalisé des actions obligatoires.`tools/list` Le résultat est de retour à la certitude `generate_report`描述符、合法的 objet 类型 `inputSchema`- Je suis là.`resultType: "complete"`、serveur, données et données publiques 缓存提示──

Si le client n'a pas déclaré l'extension mais a utilisé la méthode de tâche, le serveur reviendra.`-32021`(Capacité de client requis manquant),并将 `data.requiredCapabilities`设为 `{"extensions":{"io.modelcontextprotocol/tasks":{}}}` non soutenues `-32022`Il n' a pas de précision.`supported`Avec `requested`Date de retour de la version de la fiche`-32602`Il y a une autre.

 sans JSON-RPC `id`Le message appartient à la notification. Le destinataire peut le traiter, mais il n'envoie pas de JSON-RPC.`202 Accepted`Il y a une autre.

Actuellement, il n'y a que`tools/call`支持以任务形式增强执行──请合理设计内部抽象,以便未来的请求类型无需重写存储层──

## Création de tâches de serveur

旧版的客户端标志 `params._meta.task.required`已完全移除──现在的机制是:client 声明支持此扩张, puis le serveur décide lui-même d'une certaine chose `tools/call`Il s'agit d'une tâche.

Je vous en prie:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "generate_report",
    "arguments": {"size": "large"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

响应:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "task",
    "taskId": "tsk_786512e29e0d",
    "status": "working",
    "statusMessage": "Preparing report outline.",
    "createdAt": "2026-08-21T10:30:00Z",
    "lastUpdatedAt": "2026-08-21T10:30:00Z",
    "ttlMs": 900000,
    "pollIntervalMs": 1000
  }
}
```

Jusqu'à ce que je puisse être accepté.`tasks/get`Dans le système de stockage de cohérence finale, il faut attendre qu'il ait une visibilité lisible (read visibility) et ensuite réagir.

La réponse à la tâche a des caractéristiques de requête non active non demandée, à savoir que le client n'est pas manifestement obligé d'entrer dans le mode de tâche; mais elle n'est pas nécessairement non négociée.

## Structure des tâches

Chaque tâche à l'objet porte les lignes suivantes:

- `taskId`: un identifiant de stabilité produit par le serveur;
- `status`:取值为 `working`- Je suis là.`input_required`- Je suis là.`completed`- Je suis là.`cancelled`Ou `failed`Le dépôt de la commission
- `createdAt`Avec `lastUpdatedAt`:ISO 8601 时间;
- `ttlMs`: depuis sa création, le temps passé (mm), ou`null`Indiquer que le nombre de personnes concernées est supérieur à celui de l'autre personne;
- Choisir `pollIntervalMs`:serveur pendant la période de recommandation de la période de requête minimale;
- Choisir `statusMessage`: face à l'utilisateur ou modèle de la description ci-dessus.

特定状態专用字段 特定状态专用字段 特定状态专用字段 特定状态专用字段 特定状态专用字段 特定状态专用字段 特定状态专用字段 特定状态专用字段 特定状态专用字段 特定状态专用字段 特定状态专用字段 特定状态专用字段 特定状态专用字段 特定状态专用字段 特定状态专用字段 特定状态专用字段 特定状态专用字段 特定状态专用字段 特定状态专用字段 特定状态专用字段 特定状态专用字段 特定状态 特定状态 特定状态 特定状态 特定状态 特定字段 特定字段 特定字段 特定字段 特定字段 特定状态 特定字段 特定字段 特定字段 特定字段 特定字段 特定字段 特定字段 特定字段 特定字段 特定字段 特定字段 特定字段 特定字段 特定字段 特定字段 特定 特定 特定 特定 特定 特定 特定 特定 特定 状态 特定 特定 状态 特定 特定 特定 状态 特定 特定 特定 状态 特定 特定 特定 状态 特定 特定 特定 状态 特定 特定 特定 特定 状态 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 特定 

- `input_required`包含 `inputRequests`Il y a une autre.
- `completed`包含原始请求的 `result`La structure
- `failed`incluant JSON-RPC `error`Les objets

Le client doit se conformer`pollIntervalMs`Le serveur peut régler les interférences de temps sur les demandes sur-activées et peut modifier les mouvements de la tâche dans le cycle de vie.

## Utilisation des tâches/obtenir des demandes

Clients: demandeurs d'emploi

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tasks/get
Mcp-Name: tsk_786512e29e0d
```

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tasks/get",
  "params": {
    "taskId": "tsk_786512e29e0d",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

`tasks/get`Cette deuxième RPC a été réalisée avec succès, et son plus haut niveau de réponse est donc toujours inclus.`resultType: "complete"` et la tâche de l'intérieur de la mise en place de ses objets `status`Je peux toujours.`working`Ou `input_required`Il y a une autre.

Cette différence peut efficacement éviter les bugs de résolution courants:

```text
result.resultType = complete    表示 tasks/get RPC 本次调用完成
result.status = working        表示其代表的后台作业仍在运行中
```

La réglementation n' existe pas`tasks/result`方法──当任务 完成时,下一次 `tasks/get`响应会直接在 `result`字段内嵌原始的                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      `CallToolResult`- Le numéro de la liste:

```json
{
  "resultType": "complete",
  "taskId": "tsk_786512e29e0d",
  "status": "completed",
  "createdAt": "2026-08-21T10:30:00Z",
  "lastUpdatedAt": "2026-08-21T10:34:12Z",
  "ttlMs": 900000,
  "result": {
    "resultType": "complete",
    "content": [
      {"type": "text", "text": "Generated large report with approved outline."}
    ],
    "structuredContent": {"size": "large", "approved": true},
    "isError": false,
    "_meta": {
      "io.modelcontextprotocol/serverInfo": {
        "name": "tasks-demo",
        "version": "1.0.0"
      }
    }
  },
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "tasks-demo",
      "version": "1.0.0"
    }
  }
}
```

À l'extérieur `resultType`Indiquer `tasks/get`RPC 顺利执行;内层的 `result.resultType`Indiquer l'outil original 调用已执行完成── ce dispositif de détermination de ce niveau est obligatoire── l'intérieur du niveau.`CallToolResult`Il faut aussi en faire un.`io.modelcontextprotocol/serverInfo`; le cours sera conservé en entier et non stocké pour des charges ordinaires sans type.

La réglementation n' existe pas`tasks/list` Le serveur de discussion  incapable de déterminer en toute sécurité quelles tâches doivent apparaître dans une liste de domaines de travail de connexion  L'application de l'historique doit être exposée à un outil de domaine d'activité autorisé avec une violation évidente des règles de propriété 

## Transmissions et échanges de données pendant l'exécution des tâches

L'entrée interne de la tâche ressemble à celle du MRTR central, mais utilise un mécanisme de prolongation de processus différent.

### 任务创建前所需的输入

Depuis le début`tools/call`Le centre de l'information`resultType: "input_required"` Le client                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

### 任务创建后所需输入

La tâche sera mise en état`input_required`❖ À travers `tasks/get` exposé `inputRequests`, par le client`tasks/update` soumission                                       **不需要**Révélation`tools/call`Il y a une autre.

Je suis en train de faire une photo.

```json
{
  "resultType": "complete",
  "taskId": "tsk_786512e29e0d",
  "status": "input_required",
  "createdAt": "2026-08-21T10:30:00Z",
  "lastUpdatedAt": "2026-08-21T10:31:00Z",
  "ttlMs": 900000,
  "inputRequests": {
    "approve_outline": {
      "method": "elicitation/create",
      "params": {
        "mode": "form",
        "message": "Approve the generated report outline?",
        "requestedSchema": {
          "type": "object",
          "properties": {"approved": {"type": "boolean"}},
          "required": ["approved"]
        }
      }
    }
  }
}
```

更新:

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tasks/update
Mcp-Name: tsk_786512e29e0d
```

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tasks/update",
  "params": {
    "taskId": "tsk_786512e29e0d",
    "inputResponses": {
      "approve_outline": {
        "action": "accept",
        "content": {"approved": true}
      }
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

Le succès est une confirmation de l' échec .`resultType: "complete"`◊ Comme le changement de statut est possible de manière définitive, le client doit continuer à se renseigner ou à écouter.

Chaque .`inputRequests`La clé de toute la tâche dans le cycle de vie doit être la seule.`tasks/get`快照可能显示相同未决密钥; client 端应在 UI 层面进行重复, tandis que le serveur 则应忽略针对未知已覆盖或已执行密钥的响应.`input_required`État, jusqu'à ce que toutes les clés nécessaires 均被作答──

## 取消操作 appartient à la coopération式取消

`tasks/cancel`Il est utilisé pour exprimer l'intention d'éliminer et de revenir à un vide complet. Cette confirmation ne garantit pas que le travailleur de la posture s'arrête immédiatement.

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tasks/cancel
Mcp-Name: tsk_786512e29e0d
```

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tasks/cancel",
  "params": {
    "taskId": "tsk_786512e29e0d",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

Pour toutes ces trois tâches,`Mcp-Name`Requête de l'image`params.taskId`, au lieu de重复 JSON-RPC 方法名──`code/main.py`Dans le`make_http_request`Le gouvernement a adopté cette règle.

Le travailleur de l'exemple de ce cours sera immédiatement réactif à l'annulation, ce qui permettra de réappeler à la rééducation des équipements et des équipements.

Ne pas utiliser`notifications/cancelled`Pour la résiliation de la tâche, le notification appartient à la catégorie de la demande de résiliation, mais non à la résiliation de la tâche de résiliation.

Cette distinction est essentielle dans le cadre de la route. La requête de suppression est destinée à l'exécution d'une seule opération JSON-RPC ou à la réponse HTTP de son domaine de demande.`tools/call`Il est revenu .`resultType: "task"`, indique que la demande est terminée, que la fermeture de son canal de transmission est non seulement impossible de déterminer, mais aussi impossible de mettre fin à l'opération de pérennisation.`tasks/cancel`C'est un tout nouveau RPC autorisé.`params.taskId`, dans le`Mcp-Name`Le code de travail est un code de travail qui est utilisé pour la gestion de la tâche.

Ainsi, le réseau doit être mis en place séparément entre le coordonnateur de requête et le tableau du chemin de tâche.[第 29 课：MCP 可靠性、取消与流控](../../29-mcp-reliability-cancellation-and-flow-control/docs/en.md)Il est également possible de faire une analyse plus approfondie des règles de concurrence, de super-temps, etc.

## Avis de sélection

轮询是基准方案――期望推送更新客户可以发送带有任务 id 列表的 `subscriptions/listen`◊ Dans le HTTP en streaming, il s'agit d'une requête POST, dont la réponse est un flux SSE de la zone de requête ◊ il n'y a pas de flux de GET indépendant 事件流, ni il n'y a besoin de sauvegarder le processus de négociation ◊

Le serveur`notifications/subscriptions/acknowledged`确认接受的 id 列表, puis peut être adopté `notifications/tasks`发送完整的快照── 确认通知与每个任务 通知都在 `_meta`Dans le port`io.modelcontextprotocol/subscriptionId`(à la valeur égale à `subscriptions/listen`En revanche, chaque tâche 通知都等价于此时调用 `tasks/get`Pour le retour de la photo.

Le client doit encore déclarer les tâches  élargir                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 `Last-Event-ID`Il y a une autre.

## 失败语义

S'il vous plaît, faites une distinction entre deux erreurs de niveau:

### 协议错误

无效的方法参数或未知任务 id 返回 JSON-RPC 错误, généralement pour `-32602`◊ absence de développement `-32021`Il est nécessaire de fournir les données nécessaires aux objets.

### 任务执行结果

- Avec`isError: true`Les résultats de l'outil habituel`completed`任务, parce que l'outil 调用 a déjà produit sa définition de la structure de résultats.
- Une erreur de niveau du protocole JSON-RPC qui s'est produite pendant la mise en œuvre tardive a permis d'entrer dans la tâche .`failed` état, et `error`字段下记录该 JSON-RPC 错误──
- L'utilisateur refuse de pouvoir produire`cancelled`、 un indice de rejet des résultats obtenus ou des produits de sécurité spécifiques dans un autre domaine.

## La durée de la durée et la propriété

Il faut au moins perpétuer la tâche de stockage id, statut, temps, temps, temps, temps, temps, temps, temps, temps, effet, temps, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, effet, et effet, effet, à cause,

Les clés de stockage doivent contenir ou pouvoir résoudre le loyer et le sujet de l'autorité.`tasks/get`- Je suis là.`tasks/update`- Je suis là.`tasks/cancel`及订阅调用中都必须核验所有权──

`ttlMs`Le serveur peut échouer à marquer une tâche expirée et plus tard effectuer un nettoyage physique. Ne pas la diffuser pour maintenir le résultat obtenu après la fin de la tâche.

采用原子写入或事务机制――本课先写入临时文件再执行原子重命名――跨多副本的服务应使用共享持久化存储,并配合工人租约(租) 或等价的并发控制机制――

```figure
tp-task-lifecycle
```

## Handwriting réalisation

`code/main.py`实现 un objectif déterminé:

- `server/discover`Retour`supportedVersions`、缓存提示与 Tasks 扩展──
- `tools/list`Retour à la certitude `generate_report`描述符,附带合法 input scheme。
- `tools/call`Dans le retour`resultType: "task"`之前完成任务的创建与持久化──
- Un tout nouveau service instance rechargement de la même tâche, démontrant la capacité de redémarrage de la récupération.
- `tasks/get`Retourner à la tâche complète.
- Travailleur de`working` état de flux `input_required`Il y a une autre.
- `tasks/update`收录表单响应并返回空的完整确认──
- Travailleur  stockage `CallToolResult`(incluant ses propres `resultType`Avec le serveur, puis l'état est transféré`completed`Il y a une autre.
- Dans la réalisation`tasks/cancel`Il est aussi un homme.
- HTTP  constructeur `tasks/get`- Je suis là.`tasks/update`et `tasks/cancel``Mcp-Name`头统一设置为 `params.taskId`Il y a une autre.
- 通知助手函数使用 `notifications/subscriptions/acknowledged`Avec `notifications/tasks`, sont signés avec écouter
- 无 id 的通知不产生任何 JSON-RPC 响应──

Le travailleur utilise un état de progression évident plutôt que de dormir dans le train arrière. Cela rend chaque état de flux plus déterminé et permet de dégager clairement les exemples de protocoles et les mécanismes de file d'attente.

## Utilisation et fonctionnement

Dans le catalogue des magasins:

```bash
cd phases/13-tools-and-protocols/13-mcp-async-tasks/code
python3 main.py
python3 -m unittest discover tests -v
```

预期结果序列:

```text
id=0 resultType=complete status=ack
id=1 resultType=task status=working
id=2 resultType=complete status=working
id=3 resultType=complete status=input_required
id=4 resultType=complete status=ack
id=5 resultType=complete status=completed
```

Dans le service moderne, l'utilisation de l'épreuve est courante.`tasks/status`- Je suis là.`tasks/result`et `tasks/list`会返回方法未找到 (méthode non-trouvée)
验证 `tools/list`具有确定性,且当前所有HTTP任务 方法均通过 `Mcp-Name`L'image de sa tâche

## 交付产物

`outputs/skill-task-store-designer.md`现已提供适应扩展的设计:包括能力 协商、回归前必须持久化(持久-before-return) 现代方法集、输入更新流、所有权隔离、过期管理、取消处理、订阅机制以及方案从废弃实验性方法平稳迁移的方案──

## 课后练习

1. 增加第二未决输入键──发送包含部分字段的 `tasks/update`, prouver que, jusqu'à ce que les deux questions clés soient terminées, la tâche reste en cours`input_required`- Le statut
2. Pour le stockage de la propriété du locataire, une décharge est directement refusée lorsque l'objet du droit d'identification déposé par erreur exprime une tâche légale.
3. 引入带过期时间的工人租约――证明两个服务实例无法并发完成同一个任务――
4. Pour`subscriptions/listen`实现 POST 响应的 SSE 适配器──切勿引入 GET 端点、`Last-Event-ID`Ou séance, demandez-moi
5. 增加过期清理逻辑── en prématurant que l'existence d'une fuite existante entre les locataires ne doit pas entraîner de fuite, faire la distinction entre les tâches ayant été exécutées et les tâches ayant été formellement erronées──

## 关键术语

| 术语 | 当前扩展中的含义 |
|------|----------------------------------|
| Tasks 扩展 | 用于持久化异步工作的可选 `io.modelcontextprotocol/tasks` capability |
| `CreateTaskResult` | 对符合条件请求返回的、由 server 主导的 `resultType: "task"` 响应 |
| `tasks/get` | 轮询完整的当前任务快照，包含终态结果或未决输入 |
| `tasks/update` | 针对任务当前未决的 `inputRequests` 提交响应 |
| `tasks/cancel` | 确认接收到协作式取消的意图 |
| `input_required` | 表示任务正在等待 client 提供输入的任务状态 |
| `pollIntervalMs` | Server 建议的下次轮询前的最小等待时长 |
| `ttlMs` | 自任务创建起计算的有效时长 |
| 返回前持久化（Durable-before-return） | 必须在 task id 具备可解析可读性之后才能发出其句柄的规则 |
| `notifications/tasks` | 在已订阅的 SSE 响应流上投递的可选完整任务快照 |

## 旧版兼容性

2025-11-25 Programmes expérimentaux ont été adoptés pour renforcer les demandes des clients`tasks/status`- Je suis là.`tasks/result`Et les options`tasks/list` Réserver les noms dans les appareils adaptateurs  Client moderne                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `tasks/get`, par le biais de `tasks/update`提交输入,并从任务快照中读取最终结果──

## 延伸阅读

- [Official MCP Tasks extension](https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks)
- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
