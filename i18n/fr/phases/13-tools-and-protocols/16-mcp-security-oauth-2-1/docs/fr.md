# MCP 鉴权与授权:CIMD、Emitteur 绑定、PKCE 与权限提升(Step-Up)

> 远程MCP La demande est sans statut, mais son autorisation est absolument anonyme. Il doit lier chaque titre avec l'émetteur de celui qui l'a créé.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09 (transports), Phase 13 · 15 (security)
**Time:** ~90 minutes

## Objectif de l'apprentissage

- 通过受保护资源元数据(Méta-données de ressource protégée)
-  priorités d'adoption de l'identifiant de clientèle 元データ文档(CIMD), plutôt que de l'abandonnée
- Dans le cadre de la procédure de mise en œuvre de la directive,`application_type`Il y a une autre.
- 校验授权响应中的 `iss`参数,并根据签发者物理隔离凭证──
- 熟练运用 PKCE、资源指示符 (indicateurs de ressources) 、受众验证 (validation du public) ainsi que la portée de la croissance.
- En prévision d'une session de non-dépendance, l'envoi est conforme aux règles du 2026-07-28

##  problématique

远程MCP server 可能会读取私有记录、向外部系统写入数据,或触发代价昂贵的运算──身份认证(Authentification)

- Quel serveur autorisé a émis ce certificat ?
- Le token est spécifiquement émis pour quel MCP ?
- Quels clients et quels URI redirigés ont terminé ce processus d'autorisation ?
- Quelles opérations ont été spécifiquement approuvées ?
- Cette demande précise est-elle toujours conforme à la portée de l'agrément de l'époque?

La version 2026-07-28 a renforcé le mécanisme de traitement des clients et des émetteurs. Elle a priorisé l'adoption de l'identifiant client.`application_type`, éprouvé RFC 9207  émetteur de réponse,并严禁跨签发者复用凭证──

Ces règles de sécurité sont en phase avec le protocole central sans état. Elles ne peuvent absolument pas être réintégrées dans le protocole central et ne seront pas réintroduites.`Mcp-Session-Id`Il y a une autre.

## 概念

### 明确三大核心角色

- **MCP Client（客户端）：**代表资源所有者发起请求──
- **MCP Resource Server（资源服务器）：**验证 Access Token 并提供 MCP 端点服务──
- **Authorization Server（授权服务器）：**认证资源所有者、收集用户同意并签发代币──

Le serveur de ressources et le serveur d'autorisation peuvent être gérés par la même équipe, mais doivent maintenir les responsabilités d'identification et de vérification des deux entièrement indépendantes.

### 授权应用于 HTTP 传输层

MCP  autorisation de la réglementation spécifique à la transmission basée sur HTTP ⋅ serveur basé sur le studio local  fonctionne dans le même processus et les mêmes limites de confiance du système d'exploitation ⋅ ne pas seulement pour la surface  l'équivalence ⋅ mais pour le studio ⋅ le navigateur OAuth ⋅ flux

Pour les transmissions HTTP diffusées à distance, il faut en faire une demande.`Authorization`头部中携带Barrier Token。**绝不能**Placez le jeton dans le paramètre de requête de l'URL.

### Depuis les ressources protégées

资源服务器 responsable de la publication de données conformes à la RFC 9728 规范的元数据:

```json
{
  "resource": "https://notes.example.com/mcp",
  "authorization_servers": ["https://auth.example.com"],
  "scopes_supported": ["notes:delete", "notes:read", "notes:write"]
}
```

客户端 issu de l'URL du MCP 资源, obtenir le document de données de l'utilisateur, choisir l'un des déclarations du serveur autorisé, puis récupérer l'OAuth ou OpenID Connect du serveur autorisé 元資料──

Lors de la construction d'une URL bien connue de RFC 9728, il faut conserver le chemin des ressources originales.`https://notes.example.com/mcp`,本课使用的标准路径为 `https://notes.example.com/.well-known/oauth-protected-resource/mcp`Si tu me quittes`/mcp`后, il se peut que vous ayez choisi à tort les données de l'autre ressource protégée sous ce nom de domaine.

Ne pas croire en l'erreur de réponse de l'émetteur fournie dans le corps.

### 验证授权服务器元数据

Les données des serveurs de délivrance doivent être exposées aux caractéristiques de contrôle de sécurité de chaque point et de ce qui est soutenu:

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "code_challenge_methods_supported": ["S256"],
  "authorization_response_iss_parameter_supported": true,
  "client_id_metadata_document_supported": true
}
```

强制要求 PKCE 采用 S256 算法──完整记录签发者(issuor)字符串── cette spécifique fichier sera transformée en clé clé du stockage des informations et des jetons 客户端后续注册信息和代币存储的核心索引键(Key)──

###  suivre les règles de priorité de l'inscription

Si un clientèle et un émetteur sélectionné ont déjà une relation de préconfiguration évidente, en utilisant directement les certificats de clientèle pré-enregistrés.

### 优先采用客户端 ID 元数据文档(CIMD)

客户端 ID 元数据文档(CIMD) a fourni un URL HTTPS pour le serveur autorisé, qui est à la fois le seul identifiant du client`client_id`), en même temps que son adresse d'accès à l'archives de données:

```json
{
  "client_id": "https://client.example.com/oauth/metadata.json",
  "client_name": "Notes desktop client",
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:8765/callback"],
  "grant_types": ["authorization_code"],
  "response_types": ["code"]
}
```

授权服务器获取并校验该文档──`client_id`∞ doit contenir l'URL HTTPS du chemin, et la valeur de la déclaration interne du document doit être entièrement conforme à cette URL.`client_id`- Je suis là.`client_name`Avec `redirect_uris` Dans certains cas,`application_type`Bien que ce ne soit pas une exigence obligatoire de la CIMD, elle apparaît dans le cadre de la RDC en tant que code obligatoire.

Il est nécessaire de prendre en compte les opérations de ce document (voir: résoudre et vérifier l'objectif IP, rejeter le réseau privé, la chaîne locale et le réseau restreint, la réorientation et le DNS, la ré-liensation du DNS, la limitation du nombre de fois de réorientation, la réponse à la taille et au temps superflu, les exigences obligatoires).`application/json`,并严格按照有效的HTTP 缓存控制头进行缓存──`client_name`Écoutez-moi, je vous écris.

Le CIMD élimine les étapes difficiles de la première connexion lors de l'émission de nouveaux identifiants, mais n'élimine pas les exigences de réorientation vers l'URI 校验、 issuer's confidence strategy or user authorization consentement.

### DCR  seulement comme chemin vers l'arrière

动态客户端注册 (DCR) est toujours disponible pour l'utilisation de l'ancien serveur autorisé, mais pour la mise en œuvre du nouveau MCP, il a été officiellement abandonné.

Lorsqu'il utilise le DCR, il est nécessaire de déclarer`application_type`- Le numéro de la liste:

```json
{
  "client_name": "Notes desktop client",
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:8765/callback"],
  "grant_types": ["authorization_code"],
  "response_types": ["code"]
}
```

- 桌面端、移动端、命令行工具及采用回环地址的客户端使用 `native`Il y a une autre.
- 远程托管的 Web 浏览器应用使用 `web`,并配置远程 HTTPS 重定向地址。

Si vous préférez ce passage, OpenID Connect s'inscrit dans la réalisation de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de`web`Le processus de réintégration des lois a été détourné de la réalité.

Le code DCR est mis en place après une décision de dégradation évidente. Ne pas renoncer à la DCR lorsque la vérification du CIMD échoue de manière inattendue, ce qui pourrait transformer l'échec de la vérification de sécurité en une défense plus faible.

### La déclaration de l'autorité de l'État membre

Les certificats d'enregistrement envoyés par l'émetteur doivent être déposés sous le nom de l'émetteur précis:

```text
issuer_credentials[issuer] = pre_registered_or_dcr_client
tokens[(issuer, resource)] = access_token
```

Si les résultats de la découverte des ressources protégées`https://auth-one.example`Il est devenu`https://auth-two.example`, doit être réévalué dans la chaîne de confiance;. Il ne peut absolument pas être attribué au secret client du premier émetteur;. ID client de DCR;. enregistrer le jeton d'accès, jeton de rafraîchissement ou jeton d'accès; expédier au deuxième émetteur;.

L'ID du client CIMD est différent: comme il s'agit d'une URL HTTPS autogestionnée, et non d'un certificat interne envoyé par un serveur autorisé, le même URL CIMD possède une capacité de transfert. Le nouvel émetteur fidèle peut directement extraire et vérifier le document, sans avoir à se rendre à la DCR pour re-enregistrer.

### 带 PKCE 的授权码模式

Le processus d'autorisation de l'entreprise comprend les étapes suivantes:

1. Le nombre de cas de croissance`code_verifier`Il y a une autre.
2. Utilisation de SHA-256 派生出 `code_challenge`(S256 方式)
3. 发送授权请求,携带精确的 `client_id`- Je suis là.`redirect_uri`- Je suis là.`scope`- Je suis là.`code_challenge`et `resource`Il y a une autre.
4. Recevoir le code de délivrance, ce code de délivrance`code`, et de soutien en portant`iss`Il y a une autre.
5. Dans l'utilisation de la réponse, tout est strictement`iss`Est-ce que le formulaire correspond parfaitement à l'enregistrement précédent ?
6. Utilisation `code_verifier`、 la même orientation de réorientation URI 及 la même `resource`Pour échanger des symboles.
7. Les jetons seront stockés dans le stockage.`(issuer, resource)`Je suis en train de faire une petite histoire.

De la RFC 8707 `resource`参数 apparaît simultanément dans la demande d'autorisation et la demande de jeton, il identifie précisément l'URI du serveur MCP autorisé.

###  strictement`iss`参数

RFC 9207 Peut empêcher la confusion entre les réponses autorisées d'un émetteur et celles d'un autre émetteur (Mix-up  Attack)

Quand les réactions sont apparues`iss`En effet, il est interdit de faire des comparaisons avec l'émetteur du registre, de supprimer les défauts de port par défaut ou de réglementer le code URL. Une fois que le code n'est pas conforme, il doit utiliser le code autorisé, voire afficher les erreurs de contrôle de l'attaquant dans la réponse.

Si le serveur autorisé contient `iss`, généralement déclaré dans les données de l'échange`authorization_response_iss_parameter_supported: true`                                                                                                                                                                                                                                                              `iss`Il est également tenu de mener à bien ces tests.

### Dans le MCP Server 端校验受众(Audience)

资源服务器 ne reçoit que des jetons spécialement émis pour:

```text
token.issuer == configured_authorization_server
token.audience == canonical_mcp_resource
```

Tout jeton inefficace, expiré ou non correspondant à l'émetteur sera reçu par le serveur HTTP 401 non autorisé.

### 仅申请当前最小所需范围

遵循 le principe de la limite minimale de pouvoir, seulement demander la portée nécessaire à l'opération actuelle.  Si un outil  nécessite une limite plus élevée, le serveur retournera HTTP 403 et le champ d'autorité 质问(Challenge):

```text
WWW-Authenticate: Bearer error="insufficient_scope",
  scope="notes:delete",
  resource_metadata="https://notes.example.com/.well-known/oauth-protected-resource/mcp"
```

客户端 expliquer à l'utilisateur la nécessité de cette nouvelle autorisation, obtenir le consentement de l'utilisateur, lancer un nouveau processus d'autorisation pour inclure le nouveau ensemble de vieilles limites, et utiliser le nouveau JSON-RPC id 重试刚才的 MCP 请

Ne prenez pas pour acquis que la portée des demandes de renseignements est nécessairement comprise dans les premières.`scopes_supported`En effet, la question de savoir si les actions sont ou non les plus puissantes est la seule requête de pouvoir.

### 授权与无状态 MCP 底层报文

经过授权的工具 调用仍携带完整的现代请求信封:

```text
POST /mcp
Authorization: Bearer <access-token>
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes.delete
```

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "tools/call",
  "params": {
    "name": "notes.delete",
    "arguments": {"id": "note-7"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "oauth-lesson-client",
        "version": "1.0.0"
      }
    }
  }
}
```

Les jetons sont utilisés pour autoriser les droits du sujet; les demandes de données sont utilisées pour négocier les accords de négociation.

底层报文校验遵循固定时序:JSON-RPC 及元数据类型有效性、header与体 一致性, puis est protocole version support校验──路由或版本 header`-32020` Si l'en-tête et le corps sont compatibles, mais la version n'est pas prise en charge, retournez à HTTP 400 avec l'erreur de code `-32022`, et`data`精确为 `{"supported":["2026-07-28"],"requested":"<actual>"}` Request unknown method de retour HTTP 404 avec le code d'erreur `-32601`Il y a une autre.

Propriété requête classe erreur (incluant 401 Token 无效和 403 Scope 不足)`id`Pour répondre à JSON-RPC  err err err err                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 `data`字段中;`WWW-Authenticate`则作为标准 HTTP 响应头返回──通知因为没有 `id`, Donc ne retourne pas JSON-RPC 响应体──被接受的HTTP 通知回归HTTP 202 且响应体为空──

Le serveur est réalisé .`server/discover`Il est nécessaire de mettre en œuvre des outils de soutien, et donc de les imposer.`tools/list`方法──····························································································································································································································································································································································································································································`inputSchema` Cette liste de sortie est définitive,并返回 `resultType`、 identité du serveur 、 limitée `ttlMs`Avec `cacheScope` L'outil général de découverte des services et de l'utilisation des utilisateurs  Listes accessibles avant autorisation; si le contenu de la liste est différent de l'identité du sujet, il doit être appliqué une stratégie d'autorisation normale et l'adoption de caches privées 

### 禁止 Token 直通转发(Pas de passe de jeton par le biais)

Le serveur MCP ne peut pas transférer directement le MCP Access Token envoyé par le client à l'API de l'application. Il doit demander uniquement au service de l'application de la mise en ligne des jetons avec un véritable auditoire ou en utilisant un échange de jetons explicite.

### Récupération de jeton 处理

Une fois déposé, il doit être strictement caché, et effectuer une double indication selon l'émetteur et les ressources. Ne supposez pas qu'il soit nécessaire d'exister.

```figure
t3-scope-stepup
```

## 动手构建

`code/main.py`Il est un protocole en cours avec un simulateur d'autorisation. Il est intégré dans la réalisation de la découverte de ressources protégées, des données des serveurs d'autorisation, du CIMD enregistrement, du contrôle de la version avec le DCR retour, des tests de type d'application, du PKCE, des validations de l'émetteur, des fichiers de liaison des ressources, du champ d'application, des améliorations des autorisations,`server/discover`- Je suis là.`tools/list`Et l'outil de déstabilisation

Le modèle reçoit des en-têtes de requêtes et de routes résolus. Il n'est pas lui-même un adaptateur HTTP complet, il n'est pas responsable de la résolution.`Content-Type`Ou `Accept` Vous pouvez le connecter à l'adaptateur HTTP en streaming de la section 09                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `Content-Type: application/json`且 `Accept`需同时支持 `application/json`et `text/event-stream`Il y a une autre.

Je vais le faire.

```bash
cd phases/13-tools-and-protocols/16-mcp-security-oauth-2-1
python3 code/main.py
python3 -m unittest discover code/tests -v
```

控制台输出按顺序展示服务发现、CIMD注册、常规读取、两次独立 Scope 权限提升流程,以及根据发发放者隔离的证据存储机制──

## Utilisez-le

Pour les classes de l'imagerie à la production:

- `ResourceServer.protected_resource_metadata`映射为 RFC 9728 元数据端点──
- `AuthorizationServer.metadata`映射为 RFC 8414 或 OpenID Connect 发现端点──
- `Client.enroll`映射为 CIMD 解析及显式的 DCR 兼容回退分支──
- 签发者派发的客户端凭证及 `tokens_by_issuer_resource`映射为加密存储记录──CIMD URL 保持可移植, tandis que les produits autorisés sont toujours liés à un émetteur spécifique──
- `ResourceServer.handle`映射为校验现代 MCP header、token 和 tool scope 的网关中间件, et分发前将所有请求错误封装进匹配的 JSON-RPC 信封中──

## Je le livre.

本课交付 `outputs/skill-oauth-scope-planner.md`Il a conçu un ensemble complet de domaines de référence, tels que la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, la gestion des données, etc.

## 课后深练习

1. Pour le modèle augmenter le mécanisme de changement de jeton de rafraîchissement,并测试 refuse de réutiliser l'ancien jeton de rafraîchissement déjà changé une fois par jour.
2. Lorsque l'expéditeur est vérifié, il ne reçoit que l'URL CIMD transférable, et refuse fermement tous les titres et jetons des expéditeurs précédents.
3. Pour augmenter le délai de validité, il est confirmé que la demande de validité de la modification de la validité de validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité de la validité
4. Construire un Web  clientèle variable avec adresse HTTPS à distance, par rapport à ses différences avec le clientèle natif dans les données d'origine DCR 
5. Enregistré sous le même émetteur sous une deuxième ressource, le Token d'accès à la nouvelle ressource requise ne peut être autorisé à être utilisé à la première fin de la ressource.

## 关键术语

| 术语 | 含义 |
|------|------|
| 受保护资源元数据 | RFC 9728 文档，用于声明资源地址、授权服务器列表及支持的 scopes |
| CIMD | 客户端 ID 元数据文档（Client ID Metadata Document），其 HTTPS URL 即为 OAuth client_id |
| DCR | 动态客户端注册（Dynamic Client Registration），已废弃并仅作为向后兼容路径保留 |
| `application_type` | `native` 或 `web`，用于校验重定向 URI 的合法性规则 |
| PKCE | 包含 verifier 与 S256 challenge 的机制，用于防止授权码拦截攻击 |
| `iss` | RFC 9207 授权响应中的签发者标识符，用于防范 Mix-up 混淆攻击 |
| 资源指示符（Resource indicator） | RFC 8707 参数，用于将 Token 申请显式绑定到目标 MCP 资源 |
| 受众（Audience） | Token 允许被使用的合法资源范围 |
| 权限提升（Step-Up） | 针对当前操作需要的新 scope，发起用户再次同意并获取新 token 的机制 |
| 签发者绑定凭据 | 将客户端注册凭据与 Token 严格按授权服务器签发者物理隔离的存储机制 |

## 延伸阅读

- [MCP 2026-07-28 授权规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)
- [RFC 9728: OAuth 2.0 受保护资源元数据（Protected Resource Metadata）](https://www.rfc-editor.org/rfc/rfc9728)
- [RFC 8707: OAuth 2.0 资源指示符（Resource Indicators）](https://www.rfc-editor.org/rfc/rfc8707)
- [RFC 9207: OAuth 2.0 授权服务器签发者识别（Issuer Identification）](https://www.rfc-editor.org/rfc/rfc9207)
- [OAuth 客户端 ID 元数据文档（CIMD）规范草案](https://datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document/)
