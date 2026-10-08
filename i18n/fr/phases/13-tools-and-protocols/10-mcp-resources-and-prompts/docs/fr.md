# MCP Resource avec le prompt:

> L'outil est utilisé pour exécuter l'opération. Les ressources sont utilisées pour exposer le contenu à rechercher.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13, Lesson 07 (Building an MCP Server), Phase 13, Lesson 09 (MCP Transports)
**Time:** ~60 minutes

## Objectif de l'apprentissage

- 根据用户意图在工具、资源和快速之间做出正确选择──
- 通过强制要求 `server/discover`声明 ressource avec capacité de contact rapide 接口。
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `resources/list`Avec `prompts/list`Retournez à la suite.
-  rationnelle application `ttlMs`Avec `cacheScope`, éviter la divulgation de données d'utilisateurs spécifiques.
- 遇到无效或未知资源 URI 时返回 JSON-RPC 错误 `-32602`Il y a une autre.
- - Je suis en train de le faire .`subscriptions/listen`POST 响应流,并通过订阅ID 关联每个事件──
- Le contenu et le prompt sont considérés comme un serveur incroyable.

## Évolue par l'utilisateur

滥用MCP Le moyen le plus facile est de commencer directement à mettre en œuvre le code. La requête de base de données est transformée en outil, la fonction de type est transformée en outil, le flux de travail est transformé en ressource, car il est stocké dans un fichier, le serveur peut être injecté en une stratégie cachée.

Je vous demande d'abord de choisir qui et ce qu'ils attendent de vous.

| Primitive | 主要意图 | 选择主体 | 典型结果 |
|---|---|---|---|
| Tool | 执行某项操作 | Model 或应用程序 | 结构化动作结果 |
| Resource | 读取特定 URI 的内容 | Host、应用程序或用户 | 文本或二进制内容 |
| Prompt | 启动可复用的消息工作流 | 用户（通过 Host UI） | 一条或多条 prompt 消息 |

      `notes://note-1`Le billet est une ressource, car il est le contenu à trouver.`delete_note`C'est un outil, car il va changer d'état.`review_note`C'est un prompt, car il est le processus d'audit pré-défini par l'utilisateur.

Ne pas seulement pour avoir l'air fonctionnellement complet, mais aussi pour exposer les mêmes opérations à ces trois personnes.

## 2026-07-28 无状态信封

本课针对 MCP 协议版本 `2026-07-28` Dans cette configuration, il n'y a pas de serrage de main d'initialisation  saisie de main initiale  session de protocole  session de protocole  chaque requête est en réserve `_meta`键中携带其协议版本和客户端功能──

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "resources/list",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientInfo": {
        "name": "course-client",
        "version": "1.0.0"
      },
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  }
}
```

Le serveur doit être mis en œuvre`server/discover` Ses résultats de retour vers version  ressources et capacités de prompt  réalisation d'identification ainsi que de caches  indices de cache  Le client peut directement utiliser son autre méthode, mais la découverte  permet au client  de pouvoir obtenir un rapide aperçu  dans la construction de l'interface utilisateur.

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "resources": {"listChanged": true, "subscribe": true},
    "prompts": {"listChanged": true}
  },
  "ttlMs": 3600000,
  "cacheScope": "public"
}
```

常规结果会声明 `"resultType": "complete"`◊ Réponse de `_meta`Il est passé .`io.modelcontextprotocol/serverInfo`标识服务端的实现信息── Cette information est utilisée pour le diagnostic, pas pour le permis d'identité── porter une version non soutenue du protocole de demande sera retournée `-32022`错误, simultanément avec la version de la demande ainsi que la liste des versions soutenues par le serveur.

无状态契约会重塑你的设计直觉―― liste de requêtes ne peut dépendre d'une seule ligne de connexion sur l'histoire de la précédente connexion―― identifiant le droit de certification en tant que demande d'entrée peut modifier le retour de l'ensemble visible, mais connexion historique ne peut pas affecter le résultat――

## Résultat est stable

La ressource est le contenu de l'URI identifié.

Les caractéristiques d'une bonne URI:

- 足够稳定, peut être ajouté à la fiche ou transmis entre plusieurs demandes.
- 划分在服务器的专有命名空间 (en anglais seulement) 下。
- 独立于具体进程ID或连接──
- Il a été testé avant de visiter le stockage.
- Chaque fois que je lis, je suis en train de faire un test.

`notes://note-1`- Je suis là .`note-1`Le serveur de fichiers peut être utilisé.`file://`URI, mais après les liens de résolution et les routes relatives, il faut vérifier strictement les limites des répertoires bien configurés.

`resources/list`返回调用方当前可见的资源──必需按照稳定键 (如 URI)排序──确定性的顺序可以防止缓存震荡击穿(缓存错过)、快照漂移以及主机UI 在刷新时发生跳动──

```json
{
  "resultType": "complete",
  "resources": [
    {
      "uri": "notes://note-1",
      "name": "Architecture decision",
      "description": "Why the service uses a stateless boundary",
      "mimeType": "text/markdown"
    }
  ],
  "ttlMs": 300000,
  "cacheScope": "public",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "notes-server",
      "version": "2.0.0"
    }
  }
}
```

`resources/read`返回一个或多个内容项──未知URI 不代表读取成功但内容为空──当前资源规范将无效或未知资源URI 归类为 JSON-RPC 无效参数,错码为`-32602`Il y a une autre.

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "error": {
    "code": -32602,
    "message": "Unknown or invalid resource URI",
    "data": {
      "uri": "notes://missing"
    }
  }
}
```

Cette distinction permet au client de discerner clairement que les ressources ne sont pas disponibles avec des documents vides valides, tout en empêchant un retour accidentel à une recherche plus large.

### Ressources 模板

Les modèles de ressources sont utilisés pour décrire les URI de la famille avec des paramètres.`notes://projects/{project}/decisions/{decision}` dire au client  comment construire un adresse valide, sans avoir besoin d'une liste unique de tous les articles de décision

Le modèle ne signifie pas de simplifier l'expérience. Il permet de résoudre les variables, d'exécuter les identifiants, de limiter la longueur et les caractères, et d'utiliser des paramètres de type fort pour créer des requêtes de stockage.

### 内容并非可信指令

Le texte de la ressource peut contenir un prompt de saisie, de clé, d'erreur de direction ou de marque de format malintentionné. L'hôte doit conserver la source de suivi, et le serveur doit limiter le contenu en termes de données.

## Temps est le module de contrôle utilisateur

Le MCP prompt est conçu pour les utilisateurs en termes de choix explicites. L'hôte peut les rendre en commandes slashes.

Pour le même droit de demande,`prompts/list`Les résultats doivent être définitifs. Chaque prompt a besoin d'un nom stable, d'une description utile, ainsi que de permettre à l'hôte de se mettre en service.`prompts/get`之前收集输入的参数声明。

```json
{
  "resultType": "complete",
  "prompts": [
    {
      "name": "review_note",
      "title": "Review a note",
      "description": "Review one note for a named concern",
      "arguments": [
        {
          "name": "uri",
          "description": "The note resource URI",
          "required": true
        }
      ]
    }
  ],
  "ttlMs": 600000,
  "cacheScope": "public"
}
```

`prompts/get`Le paramètre sera résolu en un ensemble de messages. Il ne remplacera pas les instructions du système de l'hôte. L'hôte a le droit de décider comment le message retourné entre dans le modèle ci-dessous et maintient toujours sa stratégie de confiance avec une priorité plus élevée.

Dans le serveur 边界处严格校验提示 参数。URI 引用中引用的 URI 必须通过与直接读取资源 相同的识别权检查──切勿让提示 成为绕过资源 访问控制的侧信道──

## 缓存提示是正确性的一部分

`ttlMs`L'avis du client peut être utilisé à plusieurs reprises.`cacheScope` décrit qui peut partager cette valeur de stockage

| 范围 | 含义 | 典型用途 |
|---|---|---|
| `public` | 在鉴权许可的前提下可在多用户间复用 | 公共 prompt 目录 |
| `private` | 绑定到请求发起用户或凭证上下文 | 用户名下的私有笔记内容 |

Selon la fréquence de changement des données ainsi que les dommages possibles causés par le passé, le TTL est choisi.

MCP 规范中 `cacheScope`La valeur de validité est uniquement définie.`public`et `private`Pour les résultats contenant des secrets sensibles ou des changements extrêmement fréquents, il faut les retourner.`cacheScope: "private"` coup de coeur `ttlMs: 0`Il a ensuite été appliqué à la stratégie de stockage de l'hôte une réglementation plus stricte en matière de non-boutique.`no-store`本身并非 MCP 规范中的 `cacheScope`取值──

缓存提示永远不能取代鉴权――缓存键必须包含所有影响可见性的请求维度,包括租户(租户)、用户、权限范围(scope)、语言区域(local) ainsi que分页游标标(pagination cursor)―如果共享缓存无法安全表达这些维度,请使用`private`配合 0 TTL, et mettre en œuvre à l'hôte 层 no-store 策略──

## 订阅 le flux de réponse de l'utilisation du client

Le mode d'abonnement moderne a remplacé le précédent.`resources/subscribe`RPC et les anciennes versions basées sur HTTP GET.

Client selon la norme JSON-RPC`subscriptions/listen` Dans le niveau de transmission HTTP en continu, il s'agit d'une requête de POST, dont la réponse HTTP doit être maintenue ouverte en tant qu'événements SSE-Server-Sent) `notifications`L'objet est un liste blanche. Le serveur ne peut pas envoyer le type de notification non demandé.

```json
{
  "jsonrpc": "2.0",
  "id": 17,
  "method": "subscriptions/listen",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "course-client",
        "version": "1.0.0"
      }
    },
    "notifications": {
      "resourcesListChanged": true,
      "promptsListChanged": true,
      "resourceSubscriptions": [
        "notes://note-1"
      ]
    }
  }
}
```

Soyez attentif à votre demande de carte d'identité.`notifications/subscriptions/acknowledged`通知── parmi les conditions de traitement, il n'y a que le serveur 实际接受的子集──

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/subscriptions/acknowledged",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/subscriptionId": 17
    },
    "notifications": {
      "resourcesListChanged": true,
      "resourceSubscriptions": [
        "notes://note-1"
      ]
    }
  }
}
```

Chaque événement de la suite est accompagné de la même quantité de données:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/resources/updated",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/subscriptionId": 17
    },
    "uri": "notes://note-1"
  }
}
```

 Notification indiquant la ressource  a été modifié                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 `resources/read`重新读取该资源──Client 不应假设通知事件本身就包含最新文档内容──

Plusieurs abonnements peuvent partager la même article en studio, par le biais de la même méthode. L'identifiant d'abonnement permet au client de faire plusieurs réponses à la même requête.`resultType: "complete"`Je suis là.

切勿将订阅流当作协议会话(protokoll session) usage。后续的读取操作仍然是完整的独立请求,能够路由至任何健康的服务器 实例。

```figure
t3-primitive-sort
```

## 交互式实验

Utiliser le graphique pour les 5 capacités du système de suivi de projet pour effectuer des classifications: problèmes détails (détails de problèmes)  créer des problèmes (créer des problèmes)  créer des problèmes (sample de révision de sprint)  stratégies de réglementation des projets (politique de projet)  et fermer des problèmes (sujets de clôture)  puis déterminer quelles listes peuvent être ouvertes à la caisse publique, quelles lectures doivent être conservées privées, ainsi que quelles ressources  valent la peine d'être mises en place pour une mise à jour de notification 

En fait, chaque fois que vous faites une classe, vous devez déterminer le sujet choisi. Si vous faites une activation par le modèle, utilisez l'outil. Si vous lisez le contenu de l'hôte en fonction de l'URI, utilisez la ressource. Si vous démarrez le flux de messages pré-configuré par l'utilisateur, utilisez le prompt.

## 动手实验

Dans le catalogue des stocks,

```bash
cd phases/13-tools-and-protocols/10-mcp-resources-and-prompts/code
python3 main.py
python3 -m unittest discover tests -v
```

按以下顺序检查交互记录(transcription):

1. 确认 `server/discover`☐ la mise en œuvre de la nouvelle version du protocole et de deux capacités:
2. confirmer les résultats de deux enquêtes de liste ont été classés et contenus `resultType: "complete"`Il y a une autre.
3. La liste de confirmation et les résultats de lecture ont tous apporté des suggestions de stockage correspondant à l'attente.
4. L' URI de l' URI sera modifié`notes://missing`Il a été arrêté.`-32602`- Je suis désolé.
5. 确认订阅 确认通知先于资源 更新事件发发出──
6. 确认事件与平稳关闭均携带订阅ID `5`Il y a une autre.

Le modèle Python n'ouvre pas de véritables connexions HTTP. Il est conçu pour montrer que le SDK doit être placé dans le champ de réponse de la requête.

## 交付产物

`outputs/skill-primitive-splitter.md`Il est actuellement capable de vérifier la découverte de la détermination, la portée de la cache, le comportement de traitement des URI inefficaces et les appareils modernes de recherche.

本课还附带 `assets/primitive-split.svg`, a fourni des images statiques primitives et de bordures de l'abonnement pour l'apprentissage en ligne.

## - Il est mort.

```bash
cd phases/13-tools-and-protocols/10-mcp-resources-and-prompts/code
python3 main.py
python3 -m unittest discover tests -v
```

预期结果: le principal programme a produit JSON 交互记录, test order report au moins 12 cas de test utilisés passés。

## Capstone 连接

Lorsque votre serveur de capstone, en plus de l'action                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                

Votre certificat de test doit être capable de prouver que toute liste ne dépend pas de l'histoire de connexion et que les événements d'abonnement ne seront jamais autorisés à divulguer les droits d'accès à la ressource de base.

## 课后练习

1. - Je suis là.`notes://projects/{project}/notes/{id}`Les données de base sont les données de base de la source.
2. Pour`resources/list`添加分页支持, tout en maintenant la détermination du classement
3. Pour une ressource`cacheScope: "private"`且 `ttlMs: 0`, augmenter le niveau d'hébergement sans magasin stratégie,并解释支 these two control measures' threat model──
4. 添加 prompt 列表变更订阅,并证明当过条件省略 `promptsListChanged`Il ne vous enverra rien.
5. Créer deux abonnements et prouver que chaque événement a une vraie demande d'identité.
6. Pour le lecteur 添加鉴权主体(subject),并证明缓存条目无法跨主体越权复用──

## 关键术语

- **Resource：**Le serveur MCP 暴露的、通过 URI 寻址的内容──
- **Prompt：**Le serveur MCP 暴露的、由用户控制的消息模板──
- **确定性列表（Deterministic list）：**针对相同的请求输入,其成员与顺序保持稳定的发现结果──
- **`ttlMs`：**缓存新鲜度持续时间 (milli secondes)
- **`cacheScope`：**缓存结果的共享边界`public`Ou `private`)。
- **`subscriptions/listen`：**Une demande de long cycle de vie, dont la réponse est conforme à une déclaration de livraison explicite.
- **Subscription ID（订阅 ID）：**Original écouter La demande d'identification, dans le notification de l'information
- **无效参数（Invalid parameters）：**JSON-RPC  err err err err `-32602`, pour URI de ressources inefficaces ou inconnues
- **不支持的协议版本（Unsupported protocol version）：**JSON-RPC  err err err err `-32022`, contient`supported`Avec `requested`版本列表。
- **`server/discover`：**强制要求的服务器 方法,返回支持的版本、能力、服务身份识别及可选的缓存提示──

## 延伸阅读

- [MCP 2026-07-28 Resources](https://modelcontextprotocol.io/specification/2026-07-28/server/resources)
- [MCP 2026-07-28 Prompts](https://modelcontextprotocol.io/specification/2026-07-28/server/prompts)
- [MCP 2026-07-28 Subscriptions](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions)
- [MCP 2026-07-28 Caching](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/caching)
