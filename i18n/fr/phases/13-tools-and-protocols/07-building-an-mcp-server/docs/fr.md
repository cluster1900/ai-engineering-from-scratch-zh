# Construire MCP Server: Python et TypeScript en état

> Le serveur MCP moderne ne se souvient pas du statut de la main. Il évalue les données de chaque requête, exécute le traitement du gestionnaire et retourne les résultats d'un seul type d'identification.

**Type:** Build
**Languages:** Python, TypeScript
**Prerequisites:** Phase 13 · 06（MCP 基础）
**Time:** ~85 分钟

## Objectif de l'apprentissage

- Pour le MCP `2026-07-28`规范实现强制要求 `server/discover`- Je suis désolé.
- Dans chaque requête reçue, la version du protocole d'expérience est accompagnée d'une déclaration de capacité du client.
- Étiquette de définition des outils, des ressources et des instructions
- Retourner dans les résultats corrects`resultType`、Serveur Identité de serveur)
- Dans Python et TypeScript, en modifiant les paramètres séparés, l'étude réalise le même protocole de non-état.

## 问题背景

Le serveur de capacité du client est en mémoire après la réception de la première information, bien que simple à réaliser, mais très vulnérable à la production. Le même processus peut être effectué plus tard pour fournir des services à plusieurs clients. Les demandes à distance peuvent également être envoyées à différents travailleurs.

MCP `2026-07-28`规范通过使**每个请求自描述**Le problème du niveau de l'accord est complètement résolu. Votre application peut toujours maintenir des notes de duration, des tâches ou des statuts de statut explicites.

Ce cours va créer deux fois un note Server:Python et TypeScript versions utilisent uniquement son standard de base de données pour réaliser le protocole de cœur, les deux exposent la même méthode d'interface et exécutent la même communication.

## 核心概念

### 现代请求分发循环(La boucle de dépêche)

```text
读取一行 JSON-RPC 文本
解析外层 Envelope
若为通知（Notification），则不予响应
针对当前请求校验 params._meta
根据 method 执行路由分发
使用 resultType 与 serverInfo 封装成功结果
写回一行 JSON-RPC 响应文本
立即遗忘当前请求作用域的元数据
```

Dans le mode studio, il y a trois règles clés:

-                                                                                                                                                                                                                                                               
- 报文以换行符分隔, et effectuer le flush à chaque fois qu'il écrit.
- Lorsque le processus est terminé, le processus doit être immédiatement terminé.

Le cycle de vie du processus ne représente que la durée de vie de la couche de transmission physique, pas une session au sens du protocole MCP moderne.

### Pléger à l'expérience

Chaque requête doit contenir:

```json
{
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "notes-client",
        "version": "1.0.0"
      }
    }
  }
}
```

Il y a deux paragraphes pour la force.`clientInfo`Si des données d'identité sont fournies, on peut vérifier leur structure de données, mais on ne peut pas les considérer comme des certificats de sécurité.

Si la version n'est pas prise en charge, retournez l'erreur`-32022`Il est accompagné`requested`Avec `supported` Si vous avez demandé une absence de données, vous avez été informé de l'erreur.`-32602`Il est impossible de remplir les données manquantes dans l'histoire.

### 强制的服务发现 (Discovery obligatoire)

现代 Server  doit être réalisé `server/discover` Un service complet a été trouvé avec la version moderne du protocole supportée, le serveur, le groupe de capacités, les instructions d'utilisation, les conseils de stockage et les résultats.`_meta`Identification de personne du serveur central:

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "tools": {"listChanged": false},
    "resources": {"listChanged": false, "subscribe": false},
    "prompts": {"listChanged": false}
  },
  "ttlMs": 3600000,
  "cacheScope": "public",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "notes-server",
      "version": "2.0.0"
    }
  }
}
```

服务发现并非解锁 服务发现并非解锁 服务服务的前提大门──客户端 完全可以在不调用发现的情况下直接发起 服务发现并不是解锁 服务发现并不是解锁 服务发现并不是解锁 服务发现并不是解锁 服务发现并不是解锁 服务发现并不是解锁 服务发现并不是解锁`tools/list`Je suis désolé .`tools/list`Il a déjà fourni les mêmes données requises.

### Les outils

`tools/list`返回具有确定性排序工具 描述符列表──稳定排序能提高响应缓存命中率,并保持模型快速上下文的稳定性──该结果同样要求携带`ttlMs`et `cacheScope`Il y a une autre.

`tools/call`返回内容块(blocs de contenu)`isError`⇒ Lorsque le protocole est enveloppé ou que les paramètres de méthode sont illégaux, retournez JSON-RPC  erreur de réponse; lorsque le Conformateur d'outil 调用成功触发但在业务执行层面失败时,返回带有 `isError: true`Les résultats de la règle générale

L'outil 注解(Annotations) est juste donner un conseil à l'hôte, pas pour l'exécuter:

- `readOnlyHint`
- `destructiveHint`
- `idempotentHint`
- `openWorldHint`

L'hôte doit les utiliser pour effectuer des vérifications interactives et des présentations d'interface utilisateur, mais le serveur doit exécuter des vérifications authentiques d'autorisation au niveau de l'entreprise.

### Résultats de la recherche

`resources/list`返回稳定的 URI 描述符──`resources/read`返回带类型内容──在 `2026-07-28`Les deux éléments sont des résultats de stockage, doivent être inclus.`ttlMs`et `cacheScope`Il y a une autre.

Pour les données de notes privées des utilisateurs, il faut les utiliser.`cacheScope: "private"` Compartie de la réserve ne peut pas être transmise par le sous-secteur de la réserve.

现代数据变更推送 cesser d'être utilisé `resources/subscribe`◊ Le client 通过发起 `subscriptions/listen`Déclaration`resourceSubscriptions`Ou liste des événements à recevoir

### Les instructions

`prompts/list`Il peut également être conservé et disposer d'une séquence de certitude.`prompts/get`

### Chaque succès est un type de concours.

Dans la mise en œuvre du code, vous pouvez utiliser un ensemble d'emballage pour traiter toutes les réponses réussis:

```python
def complete(payload):
    return {
        "resultType": "complete",
        **payload,
        "_meta": {SERVER_INFO_KEY: SERVER_INFO},
    }
```

Liste ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ `ttlMs`Avec `cacheScope`◊ le traitement centralisé peut empêcher le traitement individuel 疏漏了现代规范所需的字段──

### 绝不发起 Le serveur 端请求

现代 Server peut être envoyé avec le Client demande de notification directement liée, ou dans le Client  ouverte `subscriptions/listen`- Je vous ai envoyé un message.**绝不能**Il est également possible de modifier le code de la page de l'utilisateur.

Quand le gestionnaire a besoin de l'échantillonnage, de l'obtention ou des racines, il retourne à l'intérieur.`input_required`结果── Après avoir effectué l'entrée de la demande du client, utiliser le nouveau identifiant de demande 重新发起原始方法调用──

```figure
t3-dispatch-loop
```

## 动手实践

运行 Python Server's détail et test:

```bash
cd code
python3 main.py --demo
python3 -m unittest discover tests -v
```

Utilisation de typeScript 运行器运行 TypeScript 版本:

```bash
npx tsx main.ts --demo
```

演示流程会发送 `server/discover`、 Listez tous les outils de référencement, et affichez des erreurs de référencement non prises en charge dans la version suivante.

## 交付物

本课交付 `outputs/skill-mcp-server-scaffolder.md`Il peut générer des serveurs conformes aux normes modernes, couvrant des services de recherche, des demandes de test, des listes de caches de détermination et des échelles de succession indépendantes.

##  exercice et réflexion

1. Le serveur ne réutilisera jamais les anciennes capacités de la déclaration de la requête précédente.
2. 颠倒 `TOOLS`- Je suis là.`PROMPTS`及笔记数据的录入顺序, confirmer que les résultats de toutes les enquêtes de liste sont toujours stables.
3. Une nouvelle fois, une nouvelle fois, une nouvelle fois, une nouvelle fois, une nouvelle fois, une nouvelle fois, une nouvelle fois.`notes_delete`工具, et intégrer le contrôle, l'évaluation et l'exécution de l'exécution`destructiveHint`                                                                                                                                                                                                                                                              
4. 补充 `resources/templates/list`接口, exigences de l'accès`ttlMs`- Je suis là.`cacheScope`L'équipe de la Commission a été chargée de la mise en œuvre de la politique de sécurité et de la sécurité.
5. Pour`2025-11-25`编写一个完全隔离的遗产 适配器,并通过测试证明现代请求绝不会错进遗产 处理路径──

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| 无状态 Server (Stateless server) | 仅从每个请求自身的元数据处理调用，无任何协议 Session 内存记忆 |
| `server/discover` | 强制实现的现代方法，用于向调用方公布支持的版本与功能集 |
| 完整结果 (Complete result) | 携带 `resultType: "complete"` 的成功现代结果 |
| 可缓存结果 (Cacheable result) | 附带强制 `ttlMs` 与 `cacheScope` 提示的发现、列表或只读结果 |
| 确定性列表 (Deterministic list) | 逻辑相同的注册表必须输出完全一致、可复现的条目顺序 |
| Server 身份 (Server identity) | 在结果 `_meta` 中携带的 `io.modelcontextprotocol/serverInfo` 标识 |
| Tool 业务错误 (Tool error) | Tool 调用正常被解析执行，但业务逻辑失败，返回包含 `isError: true` 的 content |
| 协议错误 (Protocol error) | 非法的 JSON-RPC 格式或无效的 MCP 请求参数，直接通过顶层 `error` 报错返回 |

## 延伸阅读

- [MCP Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- [MCP Resources](https://modelcontextprotocol.io/specification/2026-07-28/server/resources)
- [MCP Prompts](https://modelcontextprotocol.io/specification/2026-07-28/server/prompts)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
