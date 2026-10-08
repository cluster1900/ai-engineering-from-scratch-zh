# Applications MCP basées sur le protocole de non-état

> Le résultat de l'interaction est en fait toujours le processus d'échange d'outils et de ressources de MCP.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 10 (resources)
**Time:** ~75 minutes

## Objectif de l'apprentissage

- - Je suis là.`server/discover`Avec chaque demande d'expansion des capacités  déclarations et consultations MCP Apps。
- Avant que l'outil soit réellement utilisé, déclare dans l'outil`ui://`ressources.
- En 2026-07-28   无状态连线上返回完整的工具与资源 执行结果──
- Générer des applications  spécialisées `ui/initialize`La mise en œuvre de la politique de la sécurité sociale et de la sécurité sociale est une priorité pour les pays en développement.
- 综合应用源验证 (validation de l'origine) 沙箱隔离 (contenu sécurisé) CSP (contenu sécurisé) 

##  problématique

Le résultat purement textuel peut décrire la ligne de temps, mais ne peut pas fournir à l'utilisateur une ligne de temps dynamique libre de choix, de révision ou d'interaction.

MCP Apps                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `ui://`Les ressources peuvent être préalablement utilisées et vérifiées avant la mise en œuvre de l'outil, en utilisant le système de gestion des ressources et en utilisant le protocole de coordination des opérations JSON-RPC.

Le protocole central a connu un changement radical dans les règles de 2026-07-28 ⇒ Ne pas mettre l'application enveloppée dans l'ancien cycle de vie de connexion:

- Il n' y a pas de cœur.`initialize`Je vous en prie .`notifications/initialized`- Je vous en prie.
- Il n' y a pas de`Mcp-Session-Id`Je vous en prie.
- Chaque requête est là .`params._meta`La version portée du protocole et les capacités du client.
- Le serveur doit être mis en œuvre`server/discover`, afin que le client 审查协议版本、 les capacités de base et l'expansion de support。
- Chaque succès est porté par les résultats.`resultType`- Je suis un juge.
- HTTP diffusable pour chaque requête utilisant un seul POST.

Applications 桥接通信中仍包含名为 `ui/initialize`Il appartient à l'iframe et à l'hôte  PostMessage 通信方言, ne ressuscitera jamais aucun MCP central 会话。

## 核心概念

### Deux niveaux de protocole, une caractéristique complète

保持清晰的分层视角:

1. MCP 核心协议承载 `server/discover`- Je suis là.`tools/list`- Je suis là.`tools/call`- Je suis là.`resources/list`et `resources/read`Il y a une autre.
2. MCP Apps  étendre pour déclarer UI,并定义 iframe jusqu'à l'hôte de la communication.
3. Les règles de l'interface utilisateur restreignent strictement les limites de l'interface utilisateur.

扩展标识符为 `io.modelcontextprotocol/ui`◊ Les deux parties utilisent le mécanisme de participation à la sélection.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "server/discover",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/ui": {}
        }
      },
      "io.modelcontextprotocol/clientInfo": {
        "name": "timeline-host",
        "version": "1.0.0"
      }
    }
  }
}
```

`clientInfo` Recommandation pour le diagnostic . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

### 染前发现 déclaration

Les résultats de la découverte du serveur déclarent son soutien à cette expansion:

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "tools": {},
    "resources": {},
    "extensions": {
      "io.modelcontextprotocol/ui": {}
    }
  },
  "ttlMs": 300000,
  "cacheScope": "public",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "timeline-app-server",
      "version": "2.0.0"
    }
  }
}
```

Le serveur doit soutenir la découverte, mais le client ne doit pas utiliser la découverte avant chaque mouvement, car chaque mouvement est automatiquement doté de ses propres capacités.

### Dans l' outil  définition  Déclaration d' utilisateur

现代 Apps 契约在 `tools/list`Interface utilisateur  liée à un outil spécifique:

```json
{
  "name": "notes_timeline",
  "description": "Render a timeline of notes.",
  "inputSchema": {
    "type": "object",
    "properties": {}
  },
  "_meta": {
    "ui": {
      "resourceUri": "ui://notes/timeline.html"
    }
  }
}
```

Il est intentionnellement conçu pour la configuration de données statiques préalables. L'hôte peut afficher les résultats de la configuration réelle avant que le HTML ne soit téléchargé, mis en cache et effectué une vérification de sécurité sur le HTML. Bien que le code de compatibilité puisse toujours accepter l'ancienne version des codes de données, le serveur nouvellement construit doit être unifié en sortie de la mise en cache.`_meta.ui.resourceUri`La structure

Dans les règles de base actuelles`tools/list`Les résultats de retour doivent contenir une séquence de détermination,`ttlMs`et `cacheScope`◊ Si les outils visibles diffèrent selon l'utilisateur ou la marque de propriété, veuillez les utiliser `private`Il y a une autre.

###  retour de données,交由 hôte 绑定视图

Outil 调用回常规内容与结构化数据:

```json
{
  "resultType": "complete",
  "content": [
    {"type": "text", "text": "Timeline ready."}
  ],
  "structuredContent": {
    "notes": [
      {"id": "note-1", "title": "Discover", "created": "2026-07-28"}
    ]
  },
  "isError": false
}
```

L'hôte a déjà clairement compris que cet outil est utilisé pour résoudre les problèmes de visualisation.

### Application  en tant que ressource  fournir des services

Le serveur a déclaré la découverte .`resources`Il faut donc mettre en œuvre la force obligatoire.`resources/list`操作──其确定性的列表条目包含规范 URI、稳定的名称、描述以及 MIME 类型──列表结果同样包含 `resultType`Le serveur est un serveur.`ttlMs`et `cacheScope`Comme l'outil de détermination, comme la liste.

L' hôte 发送 `resources/read`在 Streamable HTTP 上, la requête a la structure suivante:

```text
POST /mcp
MCP-Protocol-Version: 2026-07-28
Mcp-Method: resources/read
Mcp-Name: ui://notes/timeline.html
```

HTTP 头字段值与 JSON-RPC 正文必须严格保持一致──若不匹配,将触发协议错误 `-32020`Il y a une autre.

返回结果 contient une ressource HTML et une cache de suggestions:

```json
{
  "resultType": "complete",
  "contents": [
    {
      "uri": "ui://notes/timeline.html",
      "mimeType": "text/html;profile=mcp-app",
      "text": "<!doctype html>...",
      "_meta": {
        "ui": {
          "csp": {
            "connectDomains": [],
            "resourceDomains": [],
            "frameDomains": [],
            "baseUriDomains": []
          },
          "permissions": {}
        }
      }
    }
  ],
  "ttlMs": 60000,
  "cacheScope": "public"
}
```

### Pour le cache du contenu de l' UI Resource

L'application est une ressource qui est différente du contenu du texte ordinaire.`cacheScope`Pour le cas particulier, les clés de stockage doivent contenir des normes.`ui://`URI 经准入的服务器 身份与版本 资源 内容摘要以及识别权上下文──Ne jamais utiliser une ressource d'application privée à travers un sujet, car même si URI 完全相同, il peut y avoir des différences significatives dans les données HTML 内部 ou de ses stratégies.

Dans les cas suivants, le caisse doit être désactivé:`ttlMs`À l'heure actuelle, l'outil`_meta.ui.resourceUri`绑定发生变化、服务器 版本或准入描述符固定指纹变化, ou encore un changement de ressources déjà confirmé dans l'abonnement a spécifié cet URI── avant de recharger remount, il faut redémarrer et refaire CSP 和权限审查── iframe de passage 绝不能仅仅因为新版本的资源 尚未加载完成就继续保留更广泛的权限──

### Dans l'évaluation des caractéristiques stratégies de priorité refus de l'accord

La logique de test a un ordre strict: d'abord, le format JSON-RPC est testé, une carte de cartes des capacités des données et des capacités du client du type objet; puis, le nom de la demande de chemin est conforme au contenu réel; et finalement, la version du protocole correspondante est approuvée.

| 异常情况 | HTTP 状态码 | JSON-RPC 错误 |
|---|---|---|
| 请求头与正文在版本、方法或名称上不一致 | 400 | `-32020` |
| 请求头与正文一致，但版本不受支持 | 400 | `-32022`，且 `data` 准确为 `{"supported":["2026-07-28"],"requested":"<实际版本>"}` |
| `resources/read` 缺少 Apps 扩展 capability | 400 | `-32021`，附带 `data.requiredCapabilities.extensions.io.modelcontextprotocol/ui` |
| 请求的方法未知 | 404 | `-32601` |

Notification JSON-RPC 没有 `id`, le serveur ne peut donc pas générer de JSON-RPC  Réponses ⋅ Réception d'une notification HTTP acceptée Retourne avec un texte texte en blanc ⋅ Bien que l'erreur puisse modifier le code d'état HTTP, elle ne peut toujours pas générer de notification ⋅ JSON-RPC  ⋅ erreur texte ⋅

### La boîte est la frontière de défense, et non la confiance.

L'hôte est en contrôle de l'iframe. L'application ne peut pas lire directement les cookies de l'hôte.

Veuillez suivre les lignes de sécurité suivantes:

- Pour les autres utilisateurs, la liste de noms de domaine de l'application est définie par défaut.`connectDomains`Utilisé pour récupérer  XHR et WebSocket;将 `resourceDomains`Utilisé dans le scénario, le style, l'image et le type.
- Dans les cas possibles, couvrir le code et les ressources données.
- À moins que les fonctions visibles par l'utilisateur ne soient précisées, il ne sera pas demandé de permis de photo, de climat ou de position géographique.
- Il va`postMessage`Réglementé à l'origine exacte, il refuse d'être d'origine quelconque.
- L'outil 参数、工具 结果、资源 文本以及桥接消息一律视为不可信输入──
- Le consentement de l'utilisateur est conservé sur le côté hôte.

Ne pas être fixé dans le processus.`sandbox`属性直接照搬到所有主中──Host 必须根据 App's source model and its own isolation design to choose carefully sandbox 标志──

Le nom de domaine est encore à l'extérieur des données.`connectDomains: ["https://api.example.com"]`Il est possible de faire une analyse de l'origine exacte de l'application, mais il est impossible de déterminer si le contenu de la charge est valide.`resourceDomains`Avec `connectDomains`Le droit de chargement de caractères ou de scripts ne devrait absolument pas conférer le droit de transmission de données.

### Applications 桥接通道 ont un cycle de vie indépendant

Applications 桥接协议 est établi `postMessage`Il est possible de l'échanger.`ui/initialize`Avec `ui/*`通知, peut également être représenté par des méthodes similaires à celle du protocole central.`tools/call`)。

Voir  envoyer avec `appInfo`et `appCapabilities`Les objets`ui/initialize` L'hôte retourne ses capacités avec l'hôte 上下文── seulement après avoir reçu cette réponse,View 才会发送 `ui/notifications/initialized` L'hôte doit attendre que les applications soient notifiées après leur arrivée, afin de pouvoir voir 发送消息。

Cette société a créé un pont entre un seul iframe et une seule fenêtre hôte. Elle n'est pas responsable de négocier la version du protocole MCP, ne crée pas de serveur, ne crée pas de conférence de niveau de transmission.`notifications/initialized`ont été déménagés, tandis que les applications  étendues `ui/notifications/initialized`依然保留──通过桥梁产生的工具调用所触发的核心请求,是一个拥有全新的 JSON-RPC id 和完整请求元数据的、自含的独立请求──

### Accueil 上下文、动作 Agents et autorisations annulation

Après la mise en œuvre du canal de communication, l'hôte conserve le pouvoir suprême. Il ne peut voir que la capacité de l'hôte à demander des outils 动作、页导航、剪贴板访问或其它特权效果.

Pour les thèmes, la taille et l'accessibilité, il faut considérer comme un hôte de changements de dynamique, et non comme une seule fois.

- 应用主机 提供颜色与排版代币, et dans le sujet ou la comparaison des préférences de changement 时实时响应
- 允许 voir la taille de son rapport, mais par l'hôte 限制并应用 iframe 尺寸, empêcher le contenu de se démarquer ou de créer une couverture frauduleuse.
- Dans l'iframe, il est possible de maintenir l'ordre de navigation du clavier, de voir le point de vue, de voir le nom du lecteur, de voir le lecteur de l'écran, de voir le support de l'écran, de voir le mouvement réduit, de voir le le lecteur de l'écran, de voir le le lecteur de l'écran, de voir le le lecteur de l'écran, de voir le le lecteur de l'écran, de voir le le lecteur de l'écran, de voir le le lecteur de l'écran, de voir le le lecteur de l'écran, de voir le le lecteur de l'écran, de voir le le lecteur de l'écran, de voir le le lecteur de l'écran, de voir le le lecteur de l'écran, de voir le le le lecteur de l'écran, de voir le le le lecteur de l'écran.
- Dans la fenêtre, le contrôle de l'hôte est modifié et le contrôle de la vue est redéfini.

Pendant la mise en œuvre de l'application, en raison du changement de la stratégie de sécurité des utilisateurs en matière de changement de compte, du contrôle de l'isolement ou de la réduction de la portée des autorisations de l'hôte, les capacités connexes peuvent être retirées.`ui/initialize`Une fois le droit retiré, il faut immédiatement refuser de suspendre le privilège de convocation, mettre fin à l'activité en ligne qui ne correspond plus à la stratégie, nettoyer l'état infecté sensible et ne plus être autorisé à recharger ou à rétrécir la ressource UI en personne.

### La réduction du revenu est une partie essentielle du contrat.

Dont le serveur de l'application Conscient de la capacité  doit toujours être capable de servir un hôte de l'extension de l'interface utilisateur non déclarée:

- Dans le`tools/list`中返回不带 `_meta.ui`Le même outil.
- Pour`tools/call`Résultats du livre de la Bible
- Pour l' hôte de la capacité non déclarée 读取 UI `resources/read`时返回缺失能力 错误──
- Lorsqu'un outil de jugement est exécuté ou non, il est absolument impossible de supposer que l'iframe existe.

```figure
t3-ui-sandbox
```

## Handwriting réalisation

`code/main.py`Il est également utilisé pour la création de logiciels de traitement de données.`server/discover`声明 Applications  Extension, liste des outils et ressources, outil d'exécution,并 fournir des ressources HTML 服务

Le modèle de réception a terminé la résolution des textes et des routes. Il n'est pas un adaptateur HTTP complet, pas responsable de la résolution.`Content-Type`Ou `Accept`◊ complet 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适配器 适应器 适应器 适应器 适应器 适应器 适应器 适应器 适应器 适应器 适应 适用器 适用器 适用器 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适`Content-Type: application/json`且 `Accept`En même temps`application/json`Avec `text/event-stream`Il y a une autre.

运行测试:

```bash
cd phases/13-tools-and-protocols/14-mcp-apps
python3 code/main.py
python3 -m unittest discover code/tests -v
```

检查输出中五大核心特征:

1. Chaque utilisation est totalement indépendante.
2. Chaque requête est portée .`_meta`Les capacités
3. `resources/list`Dans l'exécution de toute ressource 读取前均返回稳定的描述符──
4. Chaque résultat est accompli .`resultType`Et le serveur est un serveur.
5. Il n'existe aucun protocole de référence.

## Utilisation et fonctionnement

De `server/discover`- Je vous en prie.`io.modelcontextprotocol/ui`Application de l'application de téléchargement de l'application de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de la téléchargement de téléchargement de téléchargement de la téléchargement de téléchargement de téléchargement de la téléchargement de téléchargement de la téléchargement de la téléchargement de la téléchargement de la téléchargement de la téléchargement de la téléchargement de la téléchargement de la téléchargement de la téléchargement de la téléchargement de la téléchargement de la télé.`tools/list`La première réponse est la déclaration de ressource 绑定, la seconde est maintenue pour un outil de texte pur à usage direct.

读取 `ui://notes/timeline.html` dans le HTML`hostOrigin`et `event.origin`防护代码── These two lines code are proof bridgeway not adopted通配符目标 (la ligne de référence est le plus petit témoin de l'objectif de la carte sauvage).

## 交付产物

本课交付 `outputs/skill-mcp-apps-spec.md` Avant de rédiger le code cadre, il est possible de l'utiliser pour examiner les accords d'application. Il oblige le concepteur à expliquer clairement le contenu de l'application, à étendre la consultation, à réduire le niveau de retour, à utiliser les ressources de l'utilisateur, à mettre en cache les stratégies de mise en cache, à utiliser le système de gestion des données, à utiliser la portée des autorisations, à utiliser les méthodes de communication et à utiliser les limites de l'accord des utilisateurs.

## 课后练习

1. Modifier la capacité du client  Modifier le tableau de bord de l'expansion du vide  Confirmer `tools/list`J'ai gardé cet outil, mais j'ai déconnecté les ressources de l'interface utilisateur.
2.  Envoyer `Mcp-Name: ui://notes/other.html`, mais j'ai juste demandé de lire la chronologie.`-32020`Il y a une autre.
3. Modifier l'attribut de cache de la ressource`cacheScope: private`◊ description des conditions de propriété des utilisateurs de cette conférence
4. Le script est déplacé`https://static.example.com/app.js`◊将该起源 添加到 `resourceDomains`En ce qui concerne la sécurité de la chaîne d'approvisionnement, il est nécessaire de prendre en compte les risques liés à la sécurité de la chaîne d'approvisionnement.
5. 增加一个 `notes_open`L'outil ne sera pas cliqué sur le chemin de l'accueil.

## 关键术语

| 术语 | 含义 |
|------|---------|
| MCP Apps | 由 MCP host 渲染交互式 HTML 的可选扩展规范 |
| `io.modelcontextprotocol/ui` | 通信双方声明的扩展标识符 |
| `ui://` | 用于标识 App UI 模板的专用 resource scheme |
| `text/html;profile=mcp-app` | 用于 MCP App HTML 的标准 MIME 类型 |
| `server/discover` | 用于协议与 capability 发现的当前规范 RPC 方法 |
| `resources/list` | 当 server 声明支持 resources 时强制必须实现的资源枚举方法 |
| `resultType` | 现代协议规范中成功的返回结果所必须携带的判别器 |
| `ui/initialize` | Apps 桥接通道的首个请求，与已移除的核心协议握手完全独立 |
| `ui/notifications/initialized` | Apps View 在收到 host 响应后发出的就绪通知 |
| CSP | 用于限制脚本、样式、图片和网络 origin 的浏览器内容安全策略 |
| 文本降级（Text fallback） | 面向不支持 Apps 扩展的 host 所保留的 tool 基础行为 |

## 延伸阅读

- [MCP 2026-07-28 base protocol](https://modelcontextprotocol.io/specification/2026-07-28/basic)
- [MCP Apps overview](https://modelcontextprotocol.io/extensions/apps/overview)
- [MCP Apps build guide](https://modelcontextprotocol.io/extensions/apps/build)
- [Official extension support matrix](https://modelcontextprotocol.io/extensions/client-matrix)
