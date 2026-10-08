# MCP 基础: requête sans état avec JSON-RPC

> 现代 MCP 既没有握手,也没有协议 Session──每一个请求都必须独立携带足够的元数据,以便能够独立解析、授权、路由和重试──

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 01 至 05（Tool 接口与函数调用）
**Time:** ~55 分钟

## Objectif de l'apprentissage

- 区分 MCP's Server 原语(primitives) avec le Client 端特性的差异──
- Pour le MCP `2026-07-28`规范构建合规的 JSON-RPC 2.0 Enveloppe de requête et réponse
- Dans chaque demande de mise en œuvre de la version numéro de la convention, le client est déclaré en tant que titulaire de la licence.
- Utilisation `server/discover`Il n' y a pas de traitement`UnsupportedProtocolVersionError`, sans aucune première main de poing.
-  Complete suivi de la demande indépendante unique de l'expérience de base de données jusqu'à la reprise du cycle de vie des résultats 

## 问题背景

Dans le même processus de fonctionnement ou HTTP Worker, MCP Server peut recevoir en continu deux requêtes de clients différents avec des capacités différentes. Si le serveur se souvient ou dépend de la description ci-dessus d'une requête, il se retrouvera errant dans les règles d'application des autorisations, ou retourne à une structure de message incompatible.

MCP `2026-07-28`La réglementation a complètement éliminé ce genre de différences:**协议核心完全无状态**Le serveur doit se baser uniquement sur la requête en cours pour décider comment traiter la requête en cours, sans dépendre du historique de la connexion.

Cela a complètement changé le modèle mental. L'ordre de l'ancienne époque était: d'abord établir une connexion, ensuite exécuter la poignée de main, enfin lancer l'opération commerciale.

1. Le client 发送一个完全自描述的独立请求──
2. La version du protocole et la capacité du client 
3. Le serveur  traitement à la gestion de la méthode:
4. Le serveur 返回带类型标识的结果(typed result) ou JSON-RPC 错误──

La prochaine requête va commencer à répéter ce processus complet à partir de zéro.

## 核心概念

### Serveur 原语(Serveur primitifs)

MCP Server 暴露三个核心原语:

1. **Tools（工具）**:                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `tools/list`发现并由 `tools/call`Il est très important de le faire.
2. **Resources（资源）**: selon les données de l'URI, par`resources/list`发现并由 `resources/read`Je suis en train de lire.
3. **Prompts（提示模板）**: modèles à utiliser, par`prompts/list`发现并由 `prompts/get`Il est mort.

Résultats de l'analyse et de l'analyse`2026-07-28`模式中为了兼容性予保留, mais déjà clairement marqué comme abandonné (deprécié) ⋅ Dans toute la nouvelle mise en œuvre, devrait utiliser une outil ou une ressource apparente 输入替代 Roots, utiliser une API de modèle direct fournisseur 替代 Sampling, utiliser stderr ou OpenTelemetry 替代 Logging。 L'élicitation 则通过多轮请求(Multi Round-Trip Requests, MRTR) rester disponible, dont le serveur 返回输入请求, Client 重新启动原始操作后输入。现代服务器 绝不主动发起独立的 JSON-RPC 请求──

### Enveloppes JSON-RPC

MCP basement utilisant JSON-RPC 2.0:

- Je vous en prie.`{jsonrpc, id, method, params}`
- 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响应 响`{jsonrpc, id, result}`Ou `{jsonrpc, id, error}`
- 通知(Notification):`{jsonrpc, method, params}`, sans`id`字段

Dans la requête`id`pour une seule réponse, ne créera aucune session de niveau d'accord

### Les données requises doivent être remplies

Chaque requête moderne est là.`params`- Je suis en train de faire ça.`_meta`Objets:

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/list",
  "params": {
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

协议版本号(`protocolVersion`) et capacité du client`clientCapabilities`Il est obligatoire de remplir le mandat du client.`clientInfo`) Pour les recommandations, qui relèvent de la présentation et du contrôle de l'information, ne peuvent être considérées comme des justificatifs de sécurité.

Le serveur est strictement interdit de séparer ces données de la requête précédente, du cadre de processus, du réseau HTTP ou du niveau de transmission.

### 完整结果与 Server Identité

Chaque succès moderne a des résultats.`resultType`◊ habituel de résultats de usage `"complete"` Le serveur doit également déclarer sa propre identité dans les résultats des données:

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "resultType": "complete",
    "tools": [],
    "ttlMs": 30000,
    "cacheScope": "public",
    "_meta": {
      "io.modelcontextprotocol/serverInfo": {
        "name": "notes-server",
        "version": "1.0.0"
      }
    }
  }
}
```

`tools/list`- Je suis là.`resources/list`- Je suis là.`prompts/list`- Je suis là.`resources/templates/list`- Je suis là.`resources/read`et `server/discover`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `ttlMs`(Milli seconde de temps) et `cacheScope`(缓存范围) ∼ sécurité de la valeur par défaut est `ttlMs: 0`et `cacheScope: "private"`Les éléments du résultat de la liste doivent adopter un ordre déterminant, afin de garantir que la réponse de l'équivalent puisse générer un caché stable et un modèle cohérent.

### 无握手的服务发现(Découverte sans poing à main)

Chaque serveur moderne doit être mis en œuvre .`server/discover` Le client peut le faire en démarrant une entreprise et l'utiliser pour obtenir:

- `supportedVersions`:Server 支持的协议版本列表
- `capabilities`:Serveur  fournir capacité字典
- Dossiers d'utilisation`instructions`)
-  résultats `_meta`Identification de serveur central
- 缓存提示`ttlMs`et `cacheScope`)

Le service est très utile, mais il n'est pas nécessaire de le consulter.`tools/list` comme première demande, car cette demande elle-même est déjà complète avec la version du protocole et la capacité du client

Si la version de la demande n'est pas prise en charge, le serveur retourne JSON-RPC  err err err errcode `-32022`Il est accompagné de données:

```json
{
  "requested": "2027-01-01",
  "supported": ["2026-07-28"]
}
```

Client  choisi la version moderne du protocole soutenu par les deux parties, et utilise le nouveau JSON-RPC

### 单次请求的完整生命周期

Veuillez strictement suivre la procédure suivante:

1. 解析单个 JSON-RPC Enveloppe
2. 校验 `jsonrpc`字段为 `"2.0"`, existent`id`- Je suis désolé .`method`Pour les mots, et`params`Pour l'objet.
3. 校验 `params._meta`Le code de la version est un code de la version.`-32602`Il y a une autre.
4. En HTTP, le nom du protocole est conforme à la version initiale du protocole, le nom du protocole est conforme au nom du protocole, le nom du protocole est conforme au protocole.`-32020`(même si une de ces valeurs de version n'est pas prise en charge)
5. Dans le cas où la version requise est prise en charge mais le serveur n'est pas compatible, retournez `-32022`Il y a une autre.
6.  Inspection des capacités nécessaires, puis selon `method`路由并校验方法专有参数──
7. Dans le cas d'un gestionnaire spécifique, il est possible de modifier le code de dépôt.
8. 返回带有服务器 身份信息的完整结果(résultat complet)。
9. 立即遗忘当前请求作用域的协议元数据──

Ce type de strict ordre permet de créer des désaccords entre les différents composants.`Mcp-Name: notes.read`En même temps, par la source de l'exécution`params.name: notes.delete` Il permet également de faire des informations de type input, de type mix, de type consultatif, de type manque de compétences, de type de défaillance, de type de diagnostic et de type de diagnostic.

关闭 stdin 关闭 HTTP 响应连接 关闭 HTTP 响应连接 关闭 关闭 HTTP 响应连接 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关

### 显式 Héritage 兼容

`2025-11-25`及更早版本 `initialize`- Je suis là.`notifications/initialized`、 Connection Binded Capabilities, ainsi que les séances optionnelles dans le cadre de HTTP en streaming.

Mais il faut séparer complètement les deux temps. Les requêtes modernes sont obligatoirement reconnues par chaque requête; les connexions anciennes ne peuvent être déterminées que par des voies de retour spécifiquement définies par les archives.**绝不能把 `initialize` 当作连接 `2026-07-28` Server 的默认行为。**

```figure
mcp-tool-call
```

## 动手实践

`code/main.py`Dans le cadre de la mise en œuvre de la loi, le système de surveillance et de surveillance des données est basé sur des normes de sécurité et de sécurité.

```bash
python3 code/main.py
python3 -m unittest discover code/tests -v
```

Dans le cadre de la mise en œuvre de la politique de sécurité, il y a trois éléments essentiels à prendre en compte:

- Chaque requête est complète .`_meta`Je suis en train de vous dire:
- Chaque succès est inclus .`resultType: "complete"`Il ne contient pas d'identification de serveur.
- Les résultats de la liste ont un ordre strictement déterminé,并附带显式的缓存提示(TTL 和 Cache Scope)

## 交付物

本课交付 `outputs/skill-mcp-handshake-tracer.md`, bien que le nom du document historique soit conservé, cet artefact est maintenant un traceur de requêtes sans état (en anglais: Stateless request tracer).

##  exercice et réflexion

1. Modifier la version de protocole d'une demande en `2027-01-01`                                                                                                                                                                                                                                                              `-32022`, et retourner les données 字段中正确广播了支持版本列表──
2. De la deuxième demande de déplacement`io.modelcontextprotocol/clientCapabilities` Confirmer que le serveur ne réutilisera jamais la capacité de déclaration dans la première requête.
3. 颠倒内存中的工具注册表顺序── confirmer `tools/list`输出 est toujours maintenu dans le même ordre de détermination.
4. Il va`cacheScope`De `public`修改为 `private` Expliquer dans deux cas séparément ce qui permet de réutiliser ce réaction
5. 编写一个省略 `clientInfo`Les demandes de confirmation sont toujours valides, car l'identification de client est uniquement pour les recommandations et non pour les exigences obligatoires.

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| 无状态协议 (Stateless protocol) | 每一个请求都自包含解析它所需的完整元数据 |
| 请求元数据 (Request metadata) | 在 `params._meta` 中携带的协议版本、Client 能力声明及推荐的 Client 身份 |
| `server/discover` | 强制实现的 Server 方法，用于声明支持版本、能力、使用说明及身份 |
| `resultType` | 每个现代成功结果上的类型鉴别字段（如 `"complete"`） |
| 可缓存结果 (Cacheable result) | 必须包含 `ttlMs` 与 `cacheScope` 提示的查询或列表结果 |
| 协议时代 (Protocol era) | 现代基于每次请求元数据的模式，或旧版连接作用域初始化的模式 |
| 传输生命周期 (Transport lifetime) | 进程、连接或响应流的物理生存周期，不等同于协议 Session |
| `-32022` | 不支持的协议版本错误码，返回请求的版本及支持的版本列表 |

## 延伸阅读

- [MCP Architecture](https://modelcontextprotocol.io/specification/2026-07-28/architecture)
- [MCP Base Protocol](https://modelcontextprotocol.io/specification/2026-07-28/basic)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP 2026-07-28 Changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
