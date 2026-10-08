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
3. **Prompts（提示模板）**: Modèles structurés à utiliser à nouveau, pour Host 展现给用户快捷触发──

Host 指 AI 宿主应用程序 (exemple Claude Desktop) ――MCP Client dans Host 专职与特定服务器 通信──传输层负责在两者之间搬运 JSON-RPC 报文──

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

无状态绝对不意味着应用无法保持业务状态――它只意味着状态不再隐藏在底层MCP 连接或 连接`Mcp-Session-Id` Si le flux de travail doit être transféré à la continuité, le serveur produit une position de contrôle opaque, le client en utilisant la suite le fera en tant qu'outil ordinaire 参数传入。

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

Le client peut également utiliser directement la méthode d'entreprise et traiter les erreurs de version, mais la recherche peut rendre la capacité de démonstration et de négociation de version plus transparente.`-32022`, ses données supplémentaires contiennent le serveur  supporté `supported`版本数组以及 ceux qui ont été rejetés `requested`版本。

Dans le studio 模式下,双时代(double ère) Client utilisation `server/discover`发起探测──découvrir le succès ou recevoir`-32022`Étant donné que les erreurs modernes sont déjà identifiées, elles sont prouvées par le serveur moderne; seulement des erreurs non modernes ou des erreurs surchargées sont autorisées à revenir à l'ancienne version de 2025-11-25.`initialize`Le fait de ne pas avoir de héritage ne peut être accepté que comme complice.

### 显式的结果结构

2026-07-28  Chaque succès dans la norme centrale est porté `resultType`- Le numéro de la liste:

- `complete`: indiquer que l'opération est terminée.
- `input_required`: indique que le serveur a besoin de passer par le mode de demande en plusieurs rounds (MRTR) pour émettre des requêtes complémentaires.`tools/call`- Je suis là.`resources/read`Ou `prompts/get`Retour à ce type.

Le client doit être en manque .`resultType`La version ancienne devrait être faite complète.

列表和读取操作的结果还附带 `ttlMs`(Milli seconde de survie) et `cacheScope`(缓存范围) ∼ détermination `tools/list`排序加上新鲜度提示, en permettant au Client 能够安全缓存服务发现结果, considérablement améliorer la stabilité du modèle de prompt cache.`cacheScope: public`允许跨上下文共享缓存,`private`La loi de l'Union européenne sur les droits de propriété privée et de sécurité civile

### 线缆格式与传输层

MCP dans le studio ou HTTP en streaming 上运行 JSON-RPC 2.0:

- La demande est faite:`jsonrpc`- Je suis là.`id`- Je suis là.`method`et `params`Il y a une autre.
- 响应(Réponses): contenant des`id`et `result`Ou `error`Il y a une autre.
- 通知(Notification):无 `id`, n'a pas besoin de réponse.

现代 Streamable HTTP 暴露单个只接受 POST的端点──每个 JSON-RPC 消息对应一次独立的 POST──请求 POST 接收单个 JSON对象,或接收以最终响应结尾的请求作用域 SSE 流──被接受的通知 POST 返回无响应体的 HTTP 202──

2026-07-28 规范中**不存在**独立的 MCP GET 订阅流、DELETE 注销端点、`Mcp-Session-Id`Ou à la base`Last-Event-ID`Le changement de cycle de l'émission de téléchargement`subscriptions/listen`POST S'il vous plaît, son réponse pour maintenir une longue connexion SSE 流開──

```figure
mcp-nxm-collapse
```

## 动手实践

### 步骤 1: enregistrer le serveur 表面

Dans le`code/main.py`En particulier, en Python 标准库实现服务注册与报文解析:

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

### 步骤 3: HTTP 镜像头映射

远程调用通过HTTP POST 发起时,需要镜像指定头部:

```http
POST /mcp HTTP/1.1
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: add
```

Lorsque la requête n'est pas conforme à la requête, retournez immédiatement HTTP 400 avec le code d'erreur `-32020`Il y a une autre.

运行测试命令:

```bash
cd phases/11-llm-engineering/14-model-context-protocol
python3 code/main.py
cd code
python3 -m unittest discover tests -v
```

## 交付物

本课交付 `outputs/skill-mcp-server-designer.md`Il peut transformer un domaine d'activité spécifique en un programme d'architecture conforme aux normes modernes de MCP sans état, comprenant des stratégies de découverte de conventions, de demande par demande, de liste de stockage de données, de contrôle de l'état, de transmission et d'approbation.

## continuer à s'infiltrer dans le système de production de PCM

Ce cours vous a permis d'établir un esprit de protocole unifié.

1. [MCP Tool Contracts 与内容](../../../13-tools-and-protocols/28-mcp-tool-contracts-and-content/docs/en.md): couvrent des schémas d'entrée stricts, des contenus structurés, des routes de données, des droits de partage des pages ainsi que la distinction entre les accords et les erreurs d'entreprise
2. [MCP 可靠性、取消与流控](../../../13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/docs/en.md): couvrant les demandes d'annulation, les tâches de longue durée, les délais de mise en service, les conditions de travail, les contraintes et les mécanismes de reprise de service.
3. [MCP Registry 供应链、准入、漂移与回滚](../../../13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/docs/en.md)Il s'agit d'une série de documents de référence, qui sont disponibles dans les pays tiers.
4. [MCP 一致性工程](../../../13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/docs/en.md)Les résultats de la recherche ont été publiés en décembre 2009 et ont été publiés en décembre 2014.

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| MCP | 用于向 AI Host 暴露服务发现、工具、资源、提示模板与扩展的 JSON-RPC 协议 |
| Host | 拥有大模型与用户交互界面、挂载一个或多个 MCP Client 的 AI 应用程序 |
| Client | 代表 Host 与单个具体 Server 执行 MCP 通信的连接器组件 |
| 无状态 MCP (Stateless MCP) | 每个请求携带版本与能力元数据，不存在与底层物理连接绑定的协议状态 |
| `server/discover` | 强制实现的 Server 方法，用于公布支持版本、能力集与身份标识 |
| `resultType` | 区分成功结果状态的鉴别字段（如 `complete` 或 `input_required`） |
| 显式状态句柄 (State handle) | 由 Server 签发、作为普通业务参数传递的应用层唯一标识符 |
| Streamable HTTP | 单一 POST 端点架构，返回常规 JSON 或请求作用域的 SSE 响应 |
| MRTR (多轮请求模式) | 嵌入在响应结果中的输入请求，完成后由客户端重新发起原始操作重试 |

## 延伸阅读

- [MCP 2026-07-28 核心变更](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP 服务发现规范](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP Streamable HTTP 传输规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP 多轮请求模式 (MRTR)](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
