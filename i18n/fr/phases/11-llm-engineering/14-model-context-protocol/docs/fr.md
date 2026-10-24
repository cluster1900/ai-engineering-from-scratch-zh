# 模型上下文协议(Model Context Protocol, MCP)

> MCP pour l'IA Host a fourni un protocole unifié, utilisé pour la découverte et la mise en œuvre de l'outil de communication.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (函数调用), Phase 11 · 03 (结构化输出)
**Time:** ~75 分钟

## Objectif de l'apprentissage

- 明确区分 MCP Host、Client、Server、传输层(Transport) avec le serveur 原语(Primitifs)。
- 构建携带 MCP 2026-07-28 规范必填元数据的 JSON-RPC 请求──
- Utilisation `server/discover`检查版本、身份与能力声明。
- Les outils, les ressources et les demandes de retour sont des types de identifiants et de résultats de la gestion de la connaissance.
- 解释现代无状态 MCP 如何与握手时代的传承服务器 实现双时代互操作──
- Pour que le serveur établisse des limites de sécurité, des stratégies de transmission et des voies d'approbation artificielle.

## 问题背景

Votre application nécessite des requêtes de base de données, des opérations de calendrier et des fonctions de lecture de fichiers. Sans un protocole de communication unifié, chaque hôte d'IA doit compiler des codes de découverte, de modification, de traitement d'erreur et de transmission et de sélection exclusifs avec la même capacité.

MCP a plié cette énorme N×M intégration de la matrice. Le serveur est exposé à des interfaces JSON-RPC standard; tout client de la norme peut trouver cette interface, la présenter au modèle ou à l'utilisateur, l'exécuter, le faire et résoudre, sans avoir besoin d'un serveur spécifique.

Mais il y a une limite clé: MCP est responsable de la standardisation du protocole de communication lui-même. Il n'est pas responsable de décider quel outil le modèle doit utiliser, n'est pas responsable de la sécurité du contenu incroyable, et ne fera pas non plus de requête de transfert automatique en un état d'application durable. Votre hôte et serveur doivent toujours être responsables de ces décisions centrales.

## 核心概念

![MCP Host、无状态请求与 Server 原语](../assets/mcp-architecture.svg)

### 3 serveur

1. **Tools（工具）**: 可调用动作──每个工具包含名称、描述、JSON Schema 输入约束及执行函数──
2. **Resources（资源）**: ayant nom et selon le contenu de l'URI 寻址, pour le Client 读取。
3. **Prompts（提示模板）**: Modèles structurés à utiliser à l'hôte 展现给用户──

L'hôte indique l'IA  application. Un client MCP à l'intérieur de l'hôte et un serveur 通信.

### 无状态请求取代传统握手

MCP 2026-07-28 a été complètement démoli`initialize`et `notifications/initialized`, a également déplacé la session de niveau accord.`params._meta`Le rapport de travail est basé sur le texte suivant:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "lesson-client",
        "version": "1.0.0"
      }
    }
  }
}
```

协议版本与客户 能力为强制必填项,客户身为推项──缺失 `_meta`、缺少必填字段或字段类型错误均属于参数形, retourner Params invalide 错误码(`-32602`)。 Si la version est légale mais le serveur ne peut pas le prendre en charge, retourne `UnsupportedProtocolVersionError`(le secteur de l'énergie)`-32022`Le serveur peut traiter indépendamment toute requête valide sans enregistrement historique.

无状态绝对不意味着应用无法保持业务状态――它只意味着状态不再隐藏在底层MCP 连接或 连接`Mcp-Session-Id` Si le flux de travail doit être transféré à travers la continuité de la régularité, le serveur produit une position non transparente, le client doit toujours vérifier l'autorisation de chaque requête.

### 服务发现与版本协商

Tous les serveurs modernes doivent être réalisés`server/discover`△ Its return results广播支持的协议版本、能力集合与服务器身份:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "complete",
    "supportedVersions": ["2026-07-28"],
    "capabilities": {
      "tools": {},
      "resources": {},
      "prompts": {}
    },
    "ttlMs": 3600000,
    "cacheScope": "public",
    "_meta": {
      "io.modelcontextprotocol/serverInfo": {
        "name": "demo-server",
        "version": "1.0.0"
      }
    }
  }
}
```

Le client peut également utiliser directement la méthode d'entreprise et traiter les erreurs de version, mais la recherche peut rendre la capacité de démonstration et de négociation de version plus transparente.`UnsupportedProtocolVersionError`, une erreur .`-32022` Ses données incluent `supported`(Serveur 支持的修订版数组) avec `requested`(rejectée de modification)

Dans le studio 模式下,双时代(double ère) Client utilisation `server/discover`发起探测──découvrir le succès ou recevoir `UnsupportedProtocolVersionError`Étant donné que les erreurs modernes sont déjà identifiées, elles sont prouvées par le serveur moderne; seulement des erreurs non modernes ou des erreurs surchargées sont autorisées à revenir à l'ancienne version de 2025-11-25.`initialize`Le fait de ne pas avoir de héritage ne peut être accepté que comme complice.

### 显式的结果结构

2026-07-28  Chaque succès dans la norme centrale est porté `resultType`- Le numéro de la liste:

- `complete`: indiquer que l'opération est terminée.
- `input_required`: indique que le serveur a besoin de passer par le mode de demande en plusieurs rounds (MRTR) pour émettre des requêtes complémentaires.`tools/call`- Je suis là.`resources/read`Ou `prompts/get`Retour à ce type.

Le client doit être en manque .`resultType`La version ancienne devrait être faite complète.

Le serveur doit être en fonction de chaque résultat.`_meta`  `io.modelcontextprotocol/serverInfo` Cette identité est décrite par le serveur, uniquement pour la démonstration, le journal et le test, et ne peut être utilisée comme base de décision de sécurité.

列表和读取操作的结果还附带 `ttlMs`(Milli seconde de survie) et `cacheScope`(缓存范围) ∼ détermination `tools/list`排序加上新鲜度提示, en permettant au Client 能够安全缓存服务发现结果,并提升模型 Prompt Cache 稳定性──`cacheScope: public`允许跨上下文共享缓存,`private`La loi de l'Union européenne sur les droits de propriété privée et de sécurité civile

### 线缆格式与传输层

MCP dans le studio ou HTTP en streaming 上运行 JSON-RPC 2.0:

- La demande est faite:`jsonrpc`- Je suis là.`id`- Je suis là.`method`et `params`Il y a une autre.
- 响应(Réponses): contenant des`id`et `result`Ou `error`Il y a une autre.
- 通知(Notification):无 `id`, n'a pas besoin de réponse.

现代 Streamable HTTP 暴露单个只接受 POST的端点──每个 JSON-RPC 消息应应应一次独立的 POST──请求 POST 接收单个 JSON对象,或接收以最终响应结尾的请求作用域 SSE 流──被接受通知 POST 返回无响应体的 HTTP 202──本核心修订版未定义任何通过 Streamable HTTP 客户端发送到服务器的通知──

2026-07-28 规范中**不存在**独立的 MCP GET 订阅流、DELETE 注销端点、`Mcp-Session-Id`Ou à la base`Last-Event-ID`Le changement de cycle de l'émission de téléchargement`subscriptions/listen`POST S'il vous plaît, son réponse pour maintenir une longue connexion SSE 流開──

### 无需 Server 发起请求的客户端 输入

旧修订版允许服务器 通过流发送 `sampling/createMessage`- Je suis là.`roots/list`Ou `elicitation/create`之类的请求──当前协议改用多轮往返请求(MRTR)──符合条件的工具 调用、资源读取或快速 获取会回归 `resultType: input_required`,并至少携带 `inputRequests`Ou `requestState`之一──Client 收集所需输入, utiliser le nouveau JSON-RPC ID 和对应的 `inputResponses`重试原始方法; si fourni `requestState`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,`inputRequests`, Reprouver le temps de la province `inputResponses`Il y a une autre.

Roots、Sampling et Logging  encore utilisable mais abandonné, nouvelle réalisation ne devrait pas les adopter  Roots ou échantillonnage existants `inputRequests`En passant, il n'est absolument pas nécessaire d'utiliser un serveur indépendant au client JSON-RPC.

```figure
mcp-nxm-collapse
```

## 动手构建

### 步骤 1: enregistrer le serveur 表面

Bien que la demande de contrat ait changé, le mode d'enregistrement est toujours simple:

```python
server = MCPServer("demo-server")

@server.tool(
    "add",
    "Add two integers.",
    {
        "type": "object",
        "properties": {
            "a": {"type": "integer"},
            "b": {"type": "integer"}
        },
        "required": ["a", "b"]
    }
)
def add(a: int, b: int) -> dict:
    return {"sum": a + b}
```

`code/main.py`Le développement complet de l'interface a également enregistré un outil et un prompt. Il utilise intentionnellement uniquement la base de données standard, pour que vous puissiez voir chaque structure de la mise en œuvre, plutôt que de donner les détails du protocole au SDK.

### 步骤 2: Pour chaque demande de données supplémentaires

```python
def request(method, params=None):
    body_params = dict(params or {})
    body_params["_meta"] = {
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientCapabilities": {},
        "io.modelcontextprotocol/clientInfo": {
            "name": "demo-client",
            "version": "1.0.0"
        }
    }
    return {
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": body_params
    }
```

Ne mettez pas ces données dans les objets connectés. Le serveur va les tester sur chaque requête.

### 步骤 3: ((可选) d'abord retrouver la liste

调用 `server/discover`, choisir une version prise en charge, puis l'utiliser `tools/list`Si vous savez déjà la version ne peut pas être traitée.`-32022`, directement调用 `tools/list`Il est légal.

演示按名称顺序返回工具列表,并附带 `ttlMs`- Je suis là.`cacheScope`- Je suis là.`resultType`Avec le serveur en tant qu'outil, il est possible de récupérer les résultats complets mais non stockés, car sa sortie peut dépendre de l'état actuel.

### 步骤 4: Mettre la même requête dans HTTP

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `tools/call`POST  portant l'image JSON-RPC

```http
POST /mcp HTTP/1.1
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: add
```

`MCP-Protocol-Version`La requête doit être accompagnée`_meta`La version moyenne est de:`Mcp-Method`Dans chaque JSON-RPC, les requêtes sont obligatoires et doivent être remplies.`method`Une seule.`Mcp-Name`                           `tools/call`- Je suis là.`resources/read`Avec `prompts/get`时必填,且必须与工具名、资源 URI或提示名一致. 时必填请求头或不一致时,返回 HTTP 400与 `HeaderMismatch`错误码 `-32020`Il y a une autre.

### Étape 5: mettre en œuvre la sécurité en dehors de l'état de l'accord

- Dans chaque HTTP, demandez à l'accueil de votre auditoire.
- 本地 Server  lié à l'hôte local, et diffusé en HTTP`Origin`Il y a une autre.
- - Je veux le faire .`destructiveHint: true`标记会修改状态的工具,并要求主持人 审批──
- 显式传递目录与文件范围, plutôt que de dépendre des racines abandonnées
- Les ressources et les outils de production sont considérés comme incroyables.
- Le programme de formation est basé sur la formation des chercheurs en médecine.

## 动手实践

Dans le catalogue des cours:

```bash
python3 code/main.py
cd code
python3 -m unittest discover tests -v
```

Première ligne de rapport sur l'exportation`2026-07-28`Je l' ai trouvé .`demo-server`Puis regardez.`MCPClient.request`Il est reconstitué pour chaque utilisation.`_meta`◊ Déplacer des données d'une demande, observer Le serveur  refuser ◊

## 交付物

本课交付 `outputs/skill-mcp-server-designer.md` Il peut transformer un domaine d'activité en un MCP sans état 方案── Its acceptance  Requisites: découverte des résultats ‧ demande par demande DATA ‧ liste de cache de détermination ‧ claire statuts ‧ transmission des tests ‧ autorisation et approbation 

## continuer à s'infiltrer dans le système de production de PCM

Cette formation vous aidera à établir un modèle de protocole. La phase 13 divisera les quatre frontières de production en différents programmes indépendants:

1. [MCP Tool Contracts 与内容](../../../13-tools-and-protocols/28-mcp-tool-contracts-and-content/docs/en.md): couvre le schéma d'entrée clos, le contenu structurel, les données de la route, l'insécurité des pages, la complémentation des autorisations et la distinction entre les accords et les erreurs d'entreprise.
2. [MCP 可靠性、取消与流控](../../../13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/docs/en.md): couvrant les demandes d'annulation, les demandes de mise à jour, les délais de mise à jour, les conditions de mise à jour, les conditions de mise en service, les conditions de mise en service et les conditions de mise en service.
3. [MCP Registry 供应链、准入、漂移与回滚](../../../13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/docs/en.md)Les données de référence sont les données de référence de l'entreprise.
4. [MCP 一致性工程](../../../13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/docs/en.md)Les données de l'éditeur sont fournies par le service de télévision de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de l'État de

Lorsque le serveur va traverser une équipe ou une frontière de confiance, s'il vous plaît les apprendre en ordre. Ils vous accompagnent de la méthode à utiliser jusqu'à la convention pour rester sûrs et diagnosticables tout au long du processus de déploiement.

##  exercice et réflexion

1. - Je suis là.`subtract`工具, confirmer `tools/list`仍按字母序排列──
2. 移除 protocol-version 键,验证返回 Params en cours de validité`-32602`)¬ puis envoyé en format correct mais non supporté version `2025-11-25`, vérifier retour `-32022`, confirmer `requested`Révélation de cette modification, et de`supported`中选择版本──
3. Pour créer des opérations ajoutées par le serveur`draftId`,并 requérant une mise à jour de l'opération, le considérer comme un paramètre de transmission.
4. 让一个需要用户确认的工具返回 `input_required`◊ utiliser une nouvelle ID ∞`inputResponses`条目和原样 `requestState`重试原始调用, plutôt que de créer un serveur à client de JSON-RPC requête.
5. design a bi-temps studio Client 草图:把结果或已识别的现代错误视为现代对端, uniquement en cas d'erreur indétectable ou de surtemps seulement permet de revenir en arrière `initialize`Il y a une autre.

## 核心专业术语

| 术语 | 通俗说法 | 实际含义 |
|------|-----------------|------------------------|
| MCP | “LLM 的工具协议” | 用于服务发现、工具、资源、提示模板与扩展的 JSON-RPC 协议 |
| Host | “AI 应用” | 拥有大模型与用户交互界面、挂载一个或多个 MCP Client 的 AI 应用程序 |
| Client | “连接器” | 代表 Host 与单个具体 Server 执行 MCP 通信的连接器组件 |
| 无状态 MCP (Stateless MCP) | “没有 Session” | 每个请求携带版本与能力元数据，不存在与底层物理连接绑定的协议状态 |
| `server/discover` | “能力探测” | 强制实现的 Server 方法，用于公布支持版本、能力集与身份标识 |
| `resultType` | “结果状态” | 把结果标记为 `complete` 或 `input_required` |
| 显式状态句柄 (State handle) | “工作流 ID” | 由 Server 签发、作为普通业务参数传递的应用层唯一标识符 |
| Streamable HTTP | “远程传输” | 单一 POST 端点架构，返回常规 JSON 或请求作用域的 SSE 响应 |
| MRTR (多轮请求模式) | “请求输入再重试” | 嵌入在响应结果中的输入请求，完成后由客户端重新发起原始操作重试 |

## 延伸阅读

- [MCP 2026-07-28 核心变更](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP 服务发现规范](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP Streamable HTTP 传输规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP 多轮请求模式 (MRTR)](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 已弃用特性](https://modelcontextprotocol.io/specification/2026-07-28/deprecated)
