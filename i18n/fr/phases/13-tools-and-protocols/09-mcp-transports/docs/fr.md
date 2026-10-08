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

Si la SSE du champ d'action de la demande est en cours de réception avant la rupture, le client peut utiliser le nouveau JSON-RPC ID pour créer une nouvelle demande indépendante.

### 源站校验(Validation de l'origine)

Le serveur est en train de recevoir des messages de connexion`Origin`Si le titre existe et n'est pas autorisé dans le liste blanche, retournez `403 Forbidden` Non-browser Client peut être épargné `Origin`Les règles officielles de transport sont permises.

本地开发 Server 应绑定到 `127.0.0.1`Au lieu de`0.0.0.0` Les services en ligne doivent être autorisés à exécuter les certificats et les certificats d'origine sur chaque demande;

### requête de données HTTP

Chaque requête est composée de:

```http
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes_search
```

规则要求:

- `MCP-Protocol-Version`obligatoire`params._meta.io.modelcontextprotocol/protocolVersion`- C'est tout à fait le cas.
- `Mcp-Method`obligatoire avec JSON-RPC `method`- C'est tout à fait le cas.
- `Mcp-Name`Dans le`tools/call`- Je suis là.`resources/read`et `prompts/get`Il faut le faire.
- `Mcp-Name`Pour la`params.name`(ou `resources/read`时的 `params.uri`)。
- La valeur de la requête est de taille moyenne.

对于包含非 ASCII ou caractères spéciaux `Mcp-Name`, utiliser le standard de Base64 哨兵格式:

```text
=?base64?{Base64EncodedValue}?=
```

 Toute absence  forme ou non conforme à la requête du corps, retourner immédiatement HTTP `400`Avec l' erreur`-32020`◊ Si la version du serveur n'est pas compatible, retournez à HTTP `400`Avec l' erreur`-32022`Il y a une autre.

### Résultats de la demande de réaction

Le serveur peut utiliser SSE pour une seule demande plus longue:

```text
POST tools/call id=41
  <- notifications/progress (针对 id=41)
  <- notifications/progress (针对 id=41)
  <- JSON-RPC response (id=41)
流关闭
```

Le serveur ne peut pas être activé dans ce flux pour envoyer une requête JSON-RPC indépendante au client.

### 长周期变更推送:`subscriptions/listen`

变更通知 doit être passé par Client 主动发起的专业 POST

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

POST 响应是一个长连接 SSE 流──其首条协议消息为 `notifications/subscriptions/acknowledged` La notification de confirmation  chaque modification de la notification suivante ainsi que les résultats finaux, sont`_meta`Dans le port`io.modelcontextprotocol/subscriptionId`, et vaut l'identification de la demande de surveillance. Après la rupture, le client commence un nouveau processus.`subscriptions/listen`Il est possible de récupérer des données qui ont changé.

### 显式应用层状态

移除协议 Session 绝对不意味着禁止有状态的工作流──Serveur peut générer un gestus de l'état opaque (State Handle) et le retourner dans le résultat normal de l'outil──Client dans la régularisation ultérieure le gestus sera utilisé comme un paramètre explicite pour le saisir──

Le terme est lié à l'objet de l'identité, confère un temps de péremption indéniable et de validité et est strictement autorisé à chaque utilisation.

```figure
tp-transport-handshake
```

## 动手实践

`code/main.py`仅使用Python 标准库实现一个小巧、合规的现代 Streamable HTTP Server:

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
- 版本不支持时返回 `-32022` et sa liste de versions prises en charge;
- Recevoir de l' avis sans ID  Retour HTTP `202`Air response;
- GET 和 DELETE Soyez en mesure de retourner directement à HTTP `405`Le dépôt de la commission
- `subscriptions/listen`建立长连接并携带应对应的订阅 ID在通知中

## 交付物

本课交付 `outputs/skill-mcp-transport-migrator.md`Il fournit des instructions de réglementation pour le déplacement des protocoles passés Session, complément des titres de cours, utilisation`subscriptions/listen`替代裸 GET 流,并使 Legacy 适配层保持清晰独立──

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| stdio | 基于 Client 发起的子进程 stdin/stdout、以换行符分隔的 JSON-RPC 传输 |
| Streamable HTTP | 单一端点架构，其中每条现代消息均为一次全新的 HTTP POST 调用 |
| 请求作用域 SSE (Request-scoped SSE) | 针对单个请求的 POST 响应流，输出相关通知及最终响应后自动关闭 |
| `subscriptions/listen` | 客户端主动开启的长周期 POST 请求，用于接收选择订阅的变更通知 |
| 请求头不匹配 (Header mismatch) | 当镜像请求头与请求体内容不一致时，返回 HTTP 400 与 -32020 报错 |
| 源站校验 (Origin validation) | 针对传入网络连接的 DNS 重绑定防御机制，不能替代身份认证 |
| 显式状态句柄 (Explicit state handle) | 作为普通业务参数传递的应用层 Token，代替底层隐藏的传输连接状态 |
| Legacy 桥接层 (Legacy bridge) | 专门隔离保留的旧版本行为，仅用于向后兼容历史客户端 |

## 延伸阅读

- [MCP Transport Overview](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
- [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP Subscriptions](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions)
