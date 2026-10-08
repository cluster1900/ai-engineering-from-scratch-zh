# MCP 认证与识别权: Ménagement de l'enregistrement et du dépôt de jetons des émetteurs liés

> Le programme de formation de base de la section "CIMD" est basé sur le programme "Customer Identification System" (CIMD), qui vise à créer un système de gestion de la production de données et de données, à créer des systèmes de gestion de données et de données, à mettre en place des systèmes de gestion de données et de données, à mettre en place des systèmes de gestion de données et de gestion de données et de gestion de données et de gestion de données.
> > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > >
> **规范说明（2026-07-28）：**动态客户端注册(DCR) a été officiellement abandonné,首选客户端 ID 元数据文档(CIMD) ・DCR 仅作为后后兼容机制保留──当不得不使用DCR 时,客户端必须声明正确的`application_type` Les clients doivent être vérifiés par la RFC 9207 `iss`参数值,绝不能跨不同授权服务器签发者复用凭证──

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 16 (OAuth 2.1 state machine), Phase 13 · 17 (gateways)
**Time:** ~90 minutes

## Objectif de l'apprentissage

- 通过 RFC 8414 元数据发现授权服务器并严格核验技术契约──
- 通过客户端 ID 元数据文档(CIMD) achever l'enregistrement du client,并将废弃的 DCR 隔离为回归方案──
- 校验 RFC 9207 `iss`,will clientèle enregistrer des certificats en fonction des autorisations des serveurs émetteurs,并will resource tied Token en fonction des émetteurs et des ressources double indice stockage
- 根据定时调度缓存和刷新 JWKS 密钥集, assurer la signature de l'équipe lors du renouvellement de la clé 
- Utiliser la RFC 8707 资源指示符将 Token 强绑定到单一MCP 资源,坚决拒绝混代理 (Confused-Deputy) avec跨资源复用──
- 理性权衡 JWT 本地验证与Token Introspection,界定撤销时效性(Revocation Freshness), et dans le cadre de l'infrastructure de sécurité dépendant de la défaillance lorsqu'elle est réduite.
- Découvrir complètement les responsabilités des serveurs autorisés, des serveurs de ressources et des clients, en leur permettant de ne faire que contrôler la sécurité à leur propre frontière.
- Pour le contrôle de la production du service de contrôle des comptes, il est fermement rejeté l'inscription ou le recours à des tokens à travers le domaine.

##  problématique

Le modèle de la classe 16 est utilisé dans le processus OAuth 2.1 de l'inventaire, mais dans le cadre de la production réelle, il existe trois grands dérivés qui ne peuvent être perçus:

La première est**客户端注册与凭据隔离** Les entreprises réelles peuvent fonctionner sur des centaines de serveurs MCP et des milliers de clients MCP ∙ 2026-07-28  Règlement prioritaire**客户端 ID 元数据文档（CIMD）**: L'utilisateur utilise des URL HTTPS contrôlées par lui-même 带有路径 作为其客户端标识符, l'autorisation du serveur à utiliser activement ces données en cas de besoin. RFC 7591 动态客户端注册(DCR) est réservée uniquement comme un chemin vers l'arrière et compatible abandonné. Dans le cas d'un DCR, la requête doit être clairement déclarée correcte.`application_type` Le client s'inscrira à titre d'identité en fonction du serveur autorisé, et s'inscrira à titre d'identité en fonction du Token d'accès.`(issuer, resource)`Deuxièmement, il est nécessaire de créer des indices.

La deuxième est:**密钥轮换（Key Rotation）** JWT test de signature locale dépend du JSON Web Key Set publié par le serveur d'autorisation (JWKS)  Le serveur d'autorisation fera régulièrement le tour de ces clés de signature (en général, chaque heure, lors de la réaction à l'événement de sécurité, même plus rapidement)  Un serveur MCP de JWKS ne se déconnecte qu'une seule fois au moment du démarrage, fonctionne normalement avant le premier changement de clé, puis toutes les demandes ultérieures seront signalées en raison de l'échec du test, jusqu'à ce que le service soit redémarré.

La troisième est:**受众绑定（Audience Binding）** La section 16 introduit le RFC 8707                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 `token.aud`L'URL de référence est utilisée pour la configuration de l'URL de référence.

Ce cours va refléter ces trois grandes lignes dans des composants de projet spécifiques: le fichier de données de base pour un point de terminaison HTTP; le cache de JWKS; le cache de mise à jour pour un point de mise à jour de valeur ajoutée; le cache de valeur ajoutée de la tâche fixe; le cache de JWT; la vérification est une procédure de mise en œuvre par le serveur de ressources pour la distribution de tout outil.

## 适用范围: 第16 课后的生产落地强制规范

[第 16 课：基于 OAuth 2.1 的 MCP 安全](../../16-mcp-security-oauth-2-1/docs/en.md)Il couvre les conditions de code autorisé, les PKCE, les indicateurs de ressources protégées, les indicateurs de ressources ainsi que les mécanismes de décision. Ce cours ne ré-définira pas le deuxième ensemble de processus d'AOA. Sur la base des accords susmentionnés, il explore comment les serveurs de ressources en ligne continuent de mettre en œuvre ces normes de sécurité dans les situations réelles de mise en œuvre.

Les limites de production sont davantage axées sur les transports de niveau inférieur:

- JWT 路径 查看每个请求上校验证定发发发发商,算法,验证公钥,受众,时间 Claims and Scope,同时安全更新 JWKS;;
-                                                                                                                                                                                                                                                               
-  la stratégie de résiliation définissant les certificats de résiliation doivent être totalement épuisés dans un délai prolongé, ainsi que les niveaux de stockage qui pourraient être retardés.
- • la mise en œuvre de la stratégie de mise en œuvre de la mise en œuvre de la stratégie de mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la stratégie de mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de mise en œuvre de la mise en œuvre de la mise en œuvre de mise en œuvre de la mise en œuvre de la mise en œuvre de mise en œuvre de mise en œuvre de la mise en œuvre de mise en œuvre de la mise en œuvre de mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en
- 审计证据记录驱动决策的发发发商元数据、公钥集或内幕检查 响应、Token Claims、策略版本以及拒绝原因,且绝不保存Token 明文──

Cette division de responsabilité maintient la bonne connectivité des modules de cours.

## 概念

### RFC 8414  OAuth 授权服务器元数据

      `/.well-known/oauth-authorization-server`Le dossier décrit toutes les informations nécessaires au client:

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  "client_id_metadata_document_supported": true,
  "registration_endpoint": "https://auth.example.com/register",
  "authorization_response_iss_parameter_supported": true,
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "code_challenge_methods_supported": ["S256"],
  "scopes_supported": ["mcp:tools.read", "mcp:tools.invoke"],
  "token_endpoint_auth_methods_supported": ["none", "private_key_jwt"]
}
```

客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客户 客 客户 客户 客 客户 客户 客 客户 客户 客 客户 客`oauth-protected-resource`(资源服务器文档) obtenir le savoir de l'émetteur, puis passer par RFC 8414 (本规范文档) obtenir le service de l'émetteur.

Pour les identifiants de ressources contenant des itinéraires, veuillez insérer des caractères bien connus dans le même itinéraire.`https://mcp.example.com/team/server`L'adresse des ressources protégées à résoudre est:`https://mcp.example.com/.well-known/oauth-protected-resource/team/server` Ne pas le faire`/.well-known/...`错误地增加在资源路径后──

Dans le cadre de la procédure de certification, les parties prenantes doivent être soumises à un accord de certification.

- `code_challenge_methods_supported`must contain `S256`(conformément aux exigences PKCE de la RFC 7636)**缺失**, indique que le serveur autorisé ne prend pas en charge PKCE, clientèle**必须** refuse de continuer à exécuter 
- `grant_types_supported`包含 `authorization_code`, résolument refusé .`password`et `implicit`Il y a une autre.
- Au moins, soutenir un mode d'enregistrement:`client_id_metadata_document_supported: true`(CIMD, sélection initiale)  les informations de clientèle préconfigurées, ou`registration_endpoint`(RFC 7591 兼容模式 déjà abandonné)
- Je suis`authorization_response_iss_parameter_supported`Pour vrai, les exigences obligatoires des clients autorisent à répondre dans RFC 9207 `iss`,并严格将其与重定向前记录发发发人比对对.
- Dans le cadre de la loi de l'Auteur 2.1.`response_types_supported`必須精确為 `["code"]`Il y a une autre.

 若缺少 `S256`支持,MCP server 坚决拒绝连接该IdPPKCE 没有降级模式――若既未声明任何注册模式,又没有预配置的 `client_id`, ne peut pas compléter la connexion; il faut modifier la configuration de la déploiement, et non modifier le code.

### RFC 9728  回顾                                                                                                                                                                                                                                                           

Le document est le produit de la connaissance client.**当前**Le serveur MCP est la seule source de pouvoir de l'ensemble des serveurs autorisés de confiance. Un seul serveur MCP peut également faire confiance à plusieurs IDP (un pour les employés internes, un autre pour les partenaires externes).

```json
{
  "resource": "https://notes.example.com",
  "authorization_servers": ["https://auth.example.com", "https://partners.example.com"],
  "scopes_supported": ["mcp:tools.invoke"],
  "bearer_methods_supported": ["header"],
  "resource_documentation": "https://notes.example.com/docs"
}
```

### 客户端 ID 元数据文档(推默认方案)

CIMD va enregistrer le clientèle à partir de la tradition de 推(Push)  mode revers pour 拉(Pull)  mode。 le clientèle ne cesse de se tourner vers le serveur autorisé requête 动态生成一个 `client_id`Il sera directement capable de contrôler une URL HTTPS.**作为**Le`client_id` Cette URL indique un document JSON 元データ; autoriser le serveur à en tirer le document en fonction de la demande dans le processus OAuth  La relation de confiance est basée sur le système DNS: si le serveur est en train de gérer la confiance des utilisateurs `app.example.com`Le nom du domaine, alors c'est la confiance.`https://app.example.com/client.json`Le système de communication a permis de supprimer les enregistrements et les retours en ligne.`client_id`Le nom de l'espace est trop difficile à trouver.

La structure de l'architecture de données de la société 客户端所托管 est la suivante:

```json
{
  "client_id": "https://app.example.com/oauth/client.json",
  "client_name": "Example MCP Client",
  "client_uri": "https://app.example.com",
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:7333/callback", "http://localhost:7333/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none"
}
```

文档内部的 `client_id`字段值**必须**L'URL du dossier est totalement conforme à la norme RFC 8414 et est strictement conforme à la norme RFC 8414 et est strictement conforme à la norme RFC 8414 et RFC 8414 et RFC 8414 et RFC 8414 et RFC 8414 sont strictement conforme à la norme RFC 8414 et RFC 8414 et RFC 8414 et RFC 8414 sont strictement conforme à la norme RFC 8414 et RFC 8414 et RFC 8414 et RFC 8414 et RFC 8414 sont strictement conforme à la norme RFC 8414 et RFC 8414 et RFC 8414 et RFC 8414 et RFC 8414 sont strictement conforme à la norme RFC 8414 et RFC 8414 et RFC 8414 et RFC 8414 et RFC 8414 et RFC 8414 et RFC 8414 sont entièrement conforme à la norme RFC 8414 et RFC 8414 et RFC 8414 et RFC 8414 et RFC 844 sont entièrement conformes à la norme RFC 844 et RFC.`client_id_metadata_document_supported: true`声明 soutien à cette caractéristique¬

Dans les règles actuelles du CIMD,`client_id`- Je suis là.`client_name`Avec le non-volant`redirect_uris`L'identifiant client doit être un URL HTTPS absolu avec un chemin.`application_type`Mais ce n'est pas une obligation de la CIMD.`application_type`Le système de gestion des ressources humaines est un système de gestion des ressources humaines.

Les deux principaux faits de sécurité énoncés sont:

- **防范 SSRF：**授权服务器拉取是攻击者提供的URL,必须严密防范服务端请求伪造(严禁访问内部私有网络及管理端点)
- **防范 localhost 冒充：** uniquement par CIMD  ne peut pas empêcher les attaquants locaux d' utiliser les URL de données du client légitime `localhost`C'est pourquoi, lorsque le serveur d'autorisation affiche la page d'autorisation de l'utilisateur,**必须**清晰展示重定向 URI 的主机名,并**应当**Pour la pureté`localhost`Résignation de l'avertissement de sécurité

Comme le CIMD n'a pas besoin d'un enregistrement permanent sur le serveau, il n'est plus nécessaire de créer un centre d'enregistrement complexe comme le DCR.

Si le gestionnaire de serveur autorisé a déjà préalablement distribué un identifiant client, il devrait utiliser en priorité ce certificat de préinscription destiné à un émetteur spécifique, puis essayer de s'inscrire automatiquement.

### RFC 7591: voie d'enregistrement de la capacité de l'entreprise abandonnée

DCR en 2026-07-28 规范修订中已正式废弃――仅针对无法使用CIMD 且无法进行人工预注册的旧版授权服务器保留――兼容客户端发送如下注册请求:

```json
POST /register
Content-Type: application/json

{
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:7333/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none",
  "scope": "mcp:tools.invoke",
  "client_name": "Cursor",
  "software_id": "com.cursor.cursor",
  "software_version": "0.42.0"
}
```

服务端响应 `client_id`et pour les mises à jour ultérieures de la configuration.`registration_access_token`- Le numéro de la liste:

```json
{
  "client_id": "c_3e7f1a",
  "client_id_issued_at": 1769472000,
  "redirect_uris": ["http://127.0.0.1:7333/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "registration_access_token": "regt_b2...",
  "registration_client_uri": "https://auth.example.com/register/c_3e7f1a"
}
```

`application_type`具有严格约束力: l'utilisation de l'adresse du réseau de clients doit être déclarée `native`; les clients Web de l'application basés sur les services doivent déclarer que`web`Il est également utilisé pour les clients natifs.`token_endpoint_auth_method: none`C'est une configuration par défaut, alors que le client ne peut être distribué que.`client_id`, la preuve de propriété dépend entièrement de la garantie de la PKCE.

Les trois grandes pièges de défense de la production:

- Les points d'inscription doivent être basés sur des IP de source et être strictement limités.`client_id`Il est nécessaire de mettre en œuvre les procédures de gestion de l'entreprise.
-  certaines entreprises de niveau IDP   obligatoire de fournir `software_statement`(JWT déjà signé pour le client) ⋅ Le modèle de cours sera conservé; mais dans la production devrait augmenter la logique de l'épreuve, refusant d'enregistrer des non-signées en dehors de la réorientation du cycle de production ⋅
- `registration_access_token`Le dépôt de jetons signifie que l'attaquant peut modifier la redirection de l'URI de l'utilisateur.

### RFC 8707 回顾) 资源指示符 (indicateurs de ressources)

Section 16 课 established该报文结构――生产铁律为: chaque jeton requête都必须包含`resource=<canonical-mcp-url>`, et le serveur MCP doit être vérifié chaque fois qu' il est utilisé .`token.aud`L'URL de l'URL est le plus spécifique du serveur.**不应**Il est déconnecté et identifié par un serveur MCP unique.`https://mcp.example.com`- Je suis là.`https://mcp.example.com/mcp`- Je suis là.`https://mcp.example.com:8443`et `https://mcp.example.com/server/mcp`Pour chaque serveur, choisissez une norme URI, et vous allez`aud`Avec son nom complet fixe.`https://notes.example.com`; dans les déploiements de production de plusieurs serveurs MCP sous le même nom de domaine, doit être défini selon le chemin de séparation.

### RFC 7636 ((回顾)  PKCE

PKCE est devenu une norme obligatoire dans OAuth 2.1 .`code_challenge`et `code_verifier` service端坚决拒绝任何不带验证人或验证人的哈希值与预存挑战 不符的代币请求──

### MCP 2026-07-28 授权 Profil 规范

En même temps que la réglementation MCP établit la frontière de sécurité des services de ressources OAuth, la couche de transmission MCP se transforme totalement vers l'état de non-état. Il n'existe donc aucune session de protocole permettant de prendre des décisions sur l'identité du sujet de stockage.

-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `WWW-Authenticate: Bearer resource_metadata="..."`Le titre de la série**或者**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `/.well-known/oauth-protected-resource`访问(SEP-985 将该响应头设为可选,并以知名端点作为底)`authorization_servers`字段**必须**列出至少一个信任的授权服务器──
- Dans le**每一个**La requête est acceptée`Authorization: Bearer ...`接收 Token ne peut pas être placé dans les paramètres de requête de l'URL, ne peut pas non plus être placé uniquement lors de la réunion de création 验证一次.
- 逐请求校验 `aud`- Je suis là.`iss`- Je suis là.`exp`Et les objectifs nécessaires.**必须**验证 Token is specially for its own issuance                                                                                                                                                                                                                                                         `aud`Il faut refuser directement, il ne peut pas être accepté comme un "travail".
- En retour 401/403  Répondre, retour avec `error=...`- Je suis là.`resource_metadata="<PRM-URL>"`(URL* et non*adresse des ressources nues de l'Ue) ainsi que dans le 403  Lorsque les droits sont insuffisants `scope="..."``WWW-Authenticate: Bearer`头──注意:该质问参数名为 `resource_metadata`, appartient à la recherche de points, qu'il n'existe pas de soi-disant`resource`- Je suis un homme.
- 授权服务器服务发现同时兼容 RFC 8414 OAuth 元数据与 OpenID Connect Discovery 1.0; le client doit tenter ces deux connaissances en fonction de la priorité
- 客户端(而非服务端) responsable de la défense**混淆攻击（Mix-Up Attacks）**: dans le réorientation pré pré pré pré-registration `issuer`, et à l'aide de la code d'autorisation changement de jetons  , avant de strictement éprouver l'autorisation de réponse dans le retour de RFC 9207 `iss`参数值──单纯依赖 PKCE 无法防守混合攻击,因为客户端会盲地将 `code_verifier` soumettre à un objectif de mauvaise volonté 端点.
- 客户端注册凭证 appartient à un seul émetteur de serveur agréé.  Si un service découvre qu'il a déjà déposé un autre émetteur, le client doit se réinscrire, et ne peut pas exprimer ce qu'il a perdu.`client_id`、 Token d'enregistrement ou de connexion 、
- CIMD est le premier mécanisme d'enregistrement client ▌DCR                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `application_type`Il y a une autre.

OAuth 2.1 草案是底层基石;RFC 8414/7591/8707/9728/9207 + RFC 7636 + CIMD 构成交互表面;MCP 规范则是集大成的个人资料──

### capacité de déploiement de la production

Les caractéristiques du fabricant de diffusion du document sont rapidement passées. Il est nécessaire de saisir directement le document de données retourné par le serveur d'autorisation de déploiement pour le faire examiner.

| 核对项目 | 强制要求 |
|---|---|
| 发现的 Issuer | 必须与策略预期的 HTTPS Issuer 字符串精确匹配 |
| PKCE 支持 | 明确声明支持 `S256`；否则坚决终止接入 |
| 注册机制 | 首选 CIMD，接受预注册，仅将 DCR 作为废弃兼容路径 |
| 授权响应 | 出现或声明支持时，必须校验 RFC 9207 `iss` 参数 |
| 资源绑定 | Token 请求携带 `resource`；资源服务器强制校验匹配的 `aud` |
| 凭据存储 | 客户端 ID 与注册凭据以 Issuer 为键；Access Token 以 Issuer + Resource 双重索引 |
| DCR 兼容规范 | 必须声明 `native` 或 `web`；坚决拒绝不符合声明类型的重定向 URI |

Ne pas tirer leçon de la qualité du produit ou du niveau de prix de son support technique.

### JWKS 刷新模式(AS 负责 Rotate, ressources服务器负责 Refresh)

Il faut faire une distinction stricte entre les deux mots, qui sont très faciles à mélanger en production.

- **轮换（Rotate）：**Oui**授权服务器（AS）**Le comportement: générer une nouvelle clé de signature privée, la publier dans JWKS et plus tard faire disparaître l'ancienne clé.
- **刷新（Refresh）：**Oui**资源服务器**Le comportement: via HTTP GET 重新拉取公开发布的 JWKS 并更新其本地缓存── c'est la seule opération de JWKS que le serveur de ressources doit exécuter──

Le modèle de défaillance le plus typique dans l'environnement de production est**缓存过期失效** La solution est d'adopter**定时刷新任务 + 键值缓存** un serveur de ressources effectue une tâche de régulation (Cron、Fixing Time Machine ou Mechanisme de régulation de la fonction), à intervalles de temps fixes`<issuer>/.well-known/jwks.json`Il est écrit:`cache[issuer] = {keys, fetched_at}`▽验签器直接读取该内存缓存──若某个代币的 ▽`kid`Dans le cas où vous ne l'avez pas fait,**单次**Il s'agit de deux scénarios: un cycle fixe de rafraîchissement, et avant le cycle suivant, l'adoption de la clé de la fenêtre de répercussion de la fenêtre de la mise à jour.

Le retour à l'opération**必须是重新拉取（Re-fetch），绝对不能是轮换（Rotate）**◊ Si le cache est mal connecté à un chemin non destiné, il entraîne deux défaillances majeures: 1) générer à l'aveugle la totalité des nouvelles clés obtenues `kid`* pourtant* ne peut pas correspondre avec le jeton émis, l'essai est toujours défait;`kid`Le système de jetons, qui oblige à générer des clés neuf sans limite, provoque un désastre, se refuse à lui-même.`kid`Le plus grand ne fera qu'apporter une seule fois un déséquilibre sans effet.

缓存结构:

```json
{
  "https://auth.example.com": {
    "keys": [
      {"kid": "k_2026_03", "kty": "RSA", "n": "...", "e": "AQAB", "alg": "RS256", "use": "sig"},
      {"kid": "k_2026_04", "kty": "RSA", "n": "...", "e": "AQAB", "alg": "RS256", "use": "sig"}
    ],
    "fetched_at": 1772668800
  }
}
```

Dans un état de fonctionnement stable, il y a généralement deux clés en même temps.`k_2026_03`Il y a aussi des nouvelles clés.`k_2026_04`), afin de s'assurer que les deux sont conservés en même temps que les deux autres Tokens.`kid`- Je suis en train de faire un travail.

### 统一的 Token 验证例程

Le serveur MCP doit être unifié avant d'exécuter n'importe quel outil.`code/main.py`Le modèle de standard de référencement est le suivant:

```python
result = server.validate(bearer_token, required_scope="mcp:tools.invoke")
if not result["valid"]:
    return {"status": result["status"], "WWW-Authenticate": result["www_authenticate"]}
```

`validate`函数负责解码 JWT, de JWKS 缓存中解析签名公钥(未命中时触发单次回退刷新),校验数字签名, puis依次检查 `iss`Y a-t-il une liste blanche ?`aud`Y a-t-il une conformité avec les normes de référence des ressources de ce serveur,`exp`Si le délai de validité est écoulé, et si vous avez la portée requise, une fois que les contrôles ont échoué, retournez immédiatement avec des erreurs spécifiques.`WWW-Authenticate`Le système de contrôle de l'entrée de trafic sur le serveur de ressources est un processus unique qui permet de garantir que chaque entrée de trafic, quel que soit l'outil utilisé, passe par un contrôle de sécurité parfaitement cohérent, et de supprimer toute faille de la logique commerciale qui peut être franchie directement.

### Token non transparent  adoption de l'introspection, et non de la spéculation aveugle

Si le document de l'émetteur indique que le dépôt est non transparent, le serveur de ressources ne peut pas localiser son code pour des revendications crédibles.`active: true`、 correspondant aux émetteurs attendus 、 préciser les MCP correspondants aux destinataires ou aux ressources 、 réclamations d'effet temporel non terminées ainsi que les objectifs des outils spécifiques actuels nécessaires 、

Pour l'introspéction  résultat de faire des caisses locales, en émettant  Token 单向散列摘要 Digest) ainsi que des ressources MCP 作为复合缓存键**绝不能**Pour le cas échéant, le temps de mise en cache de la "Cachage négative" (ou "Cachage inefficace") doit être suffisamment court pour que la nouvelle mise en cache légalement émise ne soit pas jugée incorrecte et non activée. Même si la chaîne de caractères non transparente est elle-même complètement la même, les résultats de la vérification d'une ressource ne peuvent pas être dépassés pour autoriser une autre ressource.

切勿让攻击者通过伪造代币内容来诱导服务切换验证模式――必须根据经验验的发发发商元数据和系统配置,预先确定采用JWT 本地签还是网络内察――在JWT路径上,强制锁定允许接受的算法和可信的`jwks_uri`; Absolument non aveuglément obéissant à la déclaration de la clé URL ou de l'algorithme de cryptage dans le Token 头部.

### 撤销 (annulation) est un contrat de fraîcheur

RFC 7009 permet au client de demander au serveur d'autoriser le retrait d'un Token. Mais cette demande de retrait ne supprimera pas automatiquement le texte de copie déjà existant sur les serveurs de ressources distribuées. Il faut déterminer le délai de retrait maximum que le système peut tolérer et obliger tous les caches locales à respecter ce délai.

L'utilisation d'une architecture de jetons non transparents peut être utilisée à travers une mise à jour à temps par introspection ou une mise à jour très courte de la cache valide pour atteindre un retrait strict en temps réel. L'architecture de JWT qui s'y trouve est généralement utilisée comme suit: raccourcie le cycle de vie valide du jeton d'accès, réalise le retrait du jeton de rafraîchissement sur le côté IP, remplace la clé publique de la signature en cas d'incident de sécurité globale, et aide à résoudre un problème d'urgence.

Les utilisateurs doivent se connecter, désactiver, annuler le permis et les réponses d'urgence, bien qu'ils soient de différentes sources de déclenchement, mais ils doivent finalement recevoir un indicateur de dureté quantifiable: après la fin de la période de la fenêtre de résiliation de la déclaration, tous les exemplaires du groupe doivent résolument refuser ce certificat.

### Le ministère extérieur dépend des déficiences nécessitant une déclaration claire stratégie de décision

绝不要在异常捕获 (试捕) 代码块中临场发挥发挥制定可用性策略──

| 故障场景 | 生产环境安全应对策略 |
|---|---|
| 定时 JWKS 刷新失败，已知 `kid` 仍在尚未过期的受限缓存中 | 仅在声明的故障容忍窗口内允许降级继续运行，并向外暴露系统健康度降级告警证据 |
| Token 携带未知 `kid` 且仅有的一次重试刷新拉取失败 | 坚决拒绝；绝不接受无法完成密码学验签的 Token |
| Introspection 内部端点不可用 | 针对受保护调用严格执行故障闭合（Fail-closed）；绝不把网络超时转化为 `active: true` |
| 受保护资源或签发者元数据发生非预期突变 | 立即停止接受新注册与新 Token 申请；在受限应急策略下仅维系明确锁定的有效配置 |
| 撤销端点不可用 | 将登出或撤销标记为“未完成”，尽可能在本地将该凭据置为不可用，绝不对外谎称全局撤销成功 |
| 系统时钟源异常或 Claim 时间格式无效 | 坚决拒绝；严禁通过扩大时钟容忍偏差（Clock Skew）来强行放行 Token |

Il faut faire une distinction illégale entre les défaillances de l'infrastructure et les défectuosités elles-mêmes. Les défaillances de l'infrastructure de base qui relèvent du niveau de la gestion doivent être combinées à des mécanismes de contrôle et de réévaluation de la santé; les signatures inefficaces, les émetteurs non conformes, les destinataires non conformes, les délais de survie ou les délais de dépôt de permis sont des défectuosités.

### 受众重放攻击全流程演练(Restriction des privilèges d'accès aux codes d'accès)

假设 Serveur A`notes.example.com`) avec le serveur B`tasks.example.com`Un serveur A a été attaqué par un attaquant qui a volé un jeton de notes d'un utilisateur et a essayé de le réaffecter à un serveur B pour effectuer une tâche de connexion.

Le processus d'exécution logique du serveur B est le suivant:

1. 解码 JWT, selon `kid`检索 JWKS,验证数字签名──(通过)
2. 核对  réaction`iss`Si elle se trouve dans sa déclaration de données sur les ressources protégées `authorization_servers`列表中──((通过 appartiennent au même IDP)
3. 校验 `aud == "https://tasks.example.com"`Il est très important.**失败**Token 中真实的 `aud`Pour`https://notes.example.com`)
4.  Retour HTTP 401  Répondre,并携带 `WWW-Authenticate: Bearer error="invalid_token", error_description="audience mismatch", resource_metadata="https://tasks.example.com/.well-known/oauth-protected-resource"`Il y a une autre.

Au niveau de l'accord, la revendication de l'auditoire est le seul obstacle à la défense de ce type d'attaques contre le Vietnam.**每一个独立请求**En général, le système est appelé "régularisation" ou "régularisation".**访问令牌特权限制（Access-Token Privilege Restriction）**: serveur MCP **必须** résolument rejeter tout symbole qui ne figure pas clairement dans la liste de ses propres identités 

> **命名辨析：**规范将**混淆代理（Confused Deputy）** spécialement utilisé pour indiquer un autre type de défaillance liée mais différente:**代理（Proxy）**, en utilisant un ID client statique à l'échelle générale, en émettant des Tokens de transfert aveugle sans avoir obtenu le consentement de l'utilisateur de la terminal spécifique.**并且**严禁将进入站收到的原始代币 直接透传给上游 API(MCP serveur **必须**独立申请专门发发往上游 API 的全新独立代币)

### Combinaison de l'attaque (servi端无法代劳的客户端防御)

Le client doit généralement interagir avec plusieurs serveurs d'autorisation différents au cours de son cycle de vie. Le mal intentionné AS peut induire le client à émettre des codes d'autorisation de l'AS, en obtenant le point de terminaison du token contrôlé par l'attaquant pour le changer. Le bénéficiaire est lié à ce point par force de non-exécution, car à cette phase de l'échange, même les codes d'autorisation n'ont pas encore été émis. Le mécanisme de défense doit être entièrement mis en œuvre par le client.

1. 客户端 en émission de redirection avant autorisation, selon les données de prévision de l'AS`issuer`- Je suis un homme.
2.  Après avoir reçu la réponse autorisée, le client en sera l'autorisation de code envoyé à n'importe quel terminal du réseau avant, le premier d'entre eux `iss`参数与此前记录的发发发人进行纯字符精确比对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对
3. Si vous ne vous conformez pas ou si vous ne vous conformez pas`authorization_response_iss_parameter_supported`Dans le cas de réponse en absence`iss`)→  immédiatement rejeté, et ne montre jamais la réponse de l'attaquant `error`Le journal de l'information

单纯依赖 PKCE 无法防备  Mix-up 攻击,因为客户端会老实实实地把自己的 `code_verifier` la main est soumis à l'objectif de l'objet de l'incitation du mal.  c'est la règle obligatoire qui prévoit que l'émetteur et le vérificateur PKCE seront soumis à l'état de la demande.`state`Une raison de tout ça.

### 常见故障模式(Modes d'échec)

- **陈旧过期的 JWKS：**Après le changement de clé AS, l'erreur de vérification de la mise en cache de jeton est interceptée. La solution est la mise en cache de jeton en temps réel + mode de retrait non prévu.
- **回退机制误搞成密钥轮换：**L'erreur de retour de cache non prévu s'est produite pour générer de nouvelles clés en lieu de les extraire à l'extérieur, ce qui est un bug logique extrêmement grave: il est non seulement impossible de les obtenir à jamais et celui qui manque dans la demande.`kid`Il va aussi laisser les attaquants utiliser des faux.`kid`L'exploitation de la clé est une opération de récupération.
- **缺失 `aud` Claim：**某些旧版 IdP 默认会省略 `aud`, sauf si le clientèle a fourni une demande explicite en Token`resource` Les éprouvateurs doivent résolument refuser l'absence `aud`Les symboles sont définitivement inconnus.
- **遗漏 `iss` 校验导致的 Mix-Up 攻击：**客户端若未校验 RFC 9207 授权响应中的 `iss`参数, pourrait être séduit pour soumettre le code d'autorisation de l'AS à un point de bout de jeton contrôlé par un client. C'est un défaut typique du clientèle, le serveur de ressources ne peut pas être réparé.
- **Scope 提升并发竞争：**Le processus de mise à niveau des deux fois des droits d'accès d'un utilisateur peut être un succès initial, générant deux jetons d'accès de différentes fins. Le testateur doit être entièrement basé sur les jetons spécifiques associés à la demande actuelle.
- **注册 Token 泄露：**- Le débit ?`registration_access_token`Il sera possible de modifier l'URI redirigé du client. Il devra être mis en cache pour son ajout de la cryptographie. Il devra forcer le client à afficher des informations à chaque mise à jour.
- **未固定 `iss` 白名单：**验签器若盲目 accepter quoi que ce soit `iss`, l'attaquant peut construire lui-même un serveur d'autorisation de mal intentionné, destiné à envoyer des jetons de mal intentionné à l'intention du public cible.`authorization_servers`La liste est blanche, il faut être déterminé à effectuer un test de correspondance.
- **凭据或 Token 缓存键混淆：**客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客`(issuer, resource)`复合索引 Token d'accès, et une fois que le émetteur est changé il faut le réinscrire.

```figure
t3-jwks-rotate
```

## Utilisez-le

`code/main.py`L'utilisation de Python 标准库 a permis de réaliser une production complète de certifications de production, couvrant trois rôles principaux:`AuthorizationServer`- Je suis là.`ResourceServer`Avec `Client` Exécution des étapes suivantes:

Dans le code de stockage,

```bash
cd phases/13-tools-and-protocols/18-mcp-auth-production
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Le premier ordre sortira l'enregistrement du distributeur et l'enregistrement complet du contrôle de validation des jetons. Le second ordre sera effectué à travers les 18 tests de la liste.

1. 授权服务器在 `/.well-known/oauth-authorization-server` éditer RFC 8414 元データ。
2. MCP 客户端调用该端点,审查其注册模式(`client_id_metadata_document_supported`Pour la CIMD,`registration_endpoint`Pour la RDC) ainsi que pour la RDC.`S256`La situation de soutien de la PKCE:
3. 客户端 priorité d'approbation de préconfiguration enregistrement, sinon utiliser son hôte dans HTTPS de l'ID du clientèle  元データ文档完成注册──废弃的DCR保存为独立兼容性测试分支──
4. 客户端记录经验的签发发者, générer S256 Challenge, recevoir un seul code d'autorisation et `iss`, le référent de retour, et le vérificateur original conformément à la RFC 8707 `resource`指示符向端点 换 Token。
5. MCP 客户端携带 `Authorization: Bearer ...`调用 MCP serveur 上的工具──
6. serveur MCP 触发 `validate`Par exemple, le résultat de la révision des données de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de résolution de la résolution de résolution de la résolution de résolution de résolution de la résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution.
7. IdP 模拟轮换公钥;定时刷新任务自动拉取最新JWKS 并更新缓存──
8. La prochaine fois que vous aurez utilisé le nouveau jeton, il sera automatiquement effectué la vérification de la nouvelle clé sans avoir besoin de redémarrer le service, et la valeur de l'ancien jeton restera valide pendant la période de la fenêtre de surcharge.
9. 模拟向另一台MCP 资源发起的受众重放攻击,精准触发 HTTP 401 报错,回复 `audience mismatch`Et les directives de redécouverte`resource_metadata`Une pointe.

Dans l'exemple, JWT  afin de pouvoir fonctionner dans une base de données standard Python  sans dépendance de tiers, a adopté un algorithme HS256  avec clé partagée . . .....................................................................................................................................................................................................................................`refresh_jwks`直接读取授权服务器内存密钥列表; en ligne dans l'environnement c'est un émetteur `jwks_uri`Les normes HTTP GET sont remplies.

## Je le livre.

本课交付 `outputs/skill-mcp-auth.md` Donner un serveur MCP  configurer avec IdP  capacité liste, cette compétence peut automatiquement être transférée sur le lieu de naissance  comprenant les ressources protégées DATA  routes d'inscription à l'inscription à l'inscription  optionnelle  CIMD  pré-inscription  base  DCR )  JWKS  réviser la stratégie  Scope  mapping  relation, ainsi que les règles de défense  lorsque l'IDP  ne peut pas pleinement satisfaire RFC Profil 

## 课后深练习

1. 运行  référencement`code/main.py`◊仔细追踪执行流──观察 IdP 在步骤 6 中轮换密钥,定时 `refresh_jwks`重新拉取已发布的公钥集合,验证旧代币(重叠窗口期内) avec le nouveau签发的代币 如何均在未重启服务的情况下顺利验证通过──
2. Dans les ressources de données protégées `authorization_servers`La liste comporte un nouvel IDP. Il est ensuite publié un seul IDP.`WWW-Authenticate: Bearer error="invalid_token", error_description="iss not allowed"`Il y a une autre.
3. Pour`register_client`增加速率限制检查,在注册机真正处理请求前执行拦截──在内存使用按来源IP为键字典实现一个轻量级的代币桶限制器──
4. 研读 RFC 7591 规范, pointant à l'exemple code `/register`处理器尚未校验的两个协议字段,并补全校验逻辑──(提示:`software_statement`Avec `redirect_uris`Le système de l'IRU est en cours de révision.
5. 接入第二台授权服务器──验证客户端能够根据发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发`client_id`Retour à la deuxième serveuse.
6. 动手复现并修复潜在的 DoS 漏洞: à l'essai de l'expéditeur envoyer une copie contenant des faux`kid`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `refresh_jwks`Le nombre de clés publiques du serveur autorisé ne sera pas augmenté de façon inhabituelle. Il sera ensuite retourné à la logique en générant de nouvelles clés, observant la contrefaçon des jetons.
7. Pour les autres .`native`Avec `web`两类客户端测试已废弃 DCR 路径──验证带有HTTP重定向URI的Web 客户端,以及未使用精确回环重定向的Native 客户端会被系统准确拦截拒绝──

## 关键术语

| 术语 | 通俗说法 | 精确工程含义 |
|------|---------|-------------|
| ASM | "OAuth 元数据文档" | RFC 8414 规范的 `/.well-known/oauth-authorization-server` JSON 文档 |
| CIMD | "客户端元数据 URL" | 客户端 ID 元数据文档（Client ID Metadata Document）：将 HTTPS URL 直接作为 `client_id`，由 AS 主动拉取 JSON。MCP 2026-07-28 首选注册方式 |
| DCR | "自助客户端动态注册" | RFC 7591 规定的 `POST /register`；在当前 MCP 规范中已废弃，仅作兼容兜底 |
| JWKS | "用于 JWT 验签的公钥集合" | JSON Web Key Set，从 `jwks_uri` 拉取，内部按 `kid` 进行哈希索引 |
| Rotate vs Refresh | "更新公钥" | **Rotate（轮换）** = 授权服务器签发/作废签名密钥；**Refresh（刷新）** = 资源服务器重新拉取发布的公钥。资源服务器仅能执行 Refresh |
| 资源指示符（Resource indicator） | "受众参数" | RFC 8707 规定的 `resource` 参数，用于将 Token 强绑定到特定 server |
| `aud` Claim | "受众标识" | JWT 中的 Claim 字段，验签器将其与自身的规范化资源 URL 进行严格字符串比对 |
| 受众重放（Audience replay） | "Token 重放攻击" | 将为 Server A 签发的 Token 拿到 Server B 去尝试调用；由受众校验防御（规范术语：访问令牌特权限制） |
| 混淆代理（Confused deputy） | "代理 Token 滥用" | 拥有静态客户端 ID 的 MCP 代理服务在未获取逐客户端同意授权的情况下盲目转发 Token；与受众重放本质不同 |
| Mix-up 混淆攻击 | "Token 端点走错门" | 客户端被恶意诱导将诚实 AS 派发的授权码拿到攻击者控制的端点去兑换；由客户端依照 RFC 9207 `iss` 校验进行防御 |
| `iss` 白名单 | "受信任的授权服务器集合" | 在受保护资源元数据的 `authorization_servers` 字段中显式声明的受信任列表 |
| `resource_metadata` | "去哪里查找 PRM 文档" | 401/403 质询头 `WWW-Authenticate` 中的标准参数，指向 RFC 9728 元数据文档的获取 URL |
| 公共客户端（Public client） | "Native 或浏览器端客户端" | 无法安全保管 `client_secret` 的客户端类型；依赖 PKCE 机制实现所有权证明 |
| `WWW-Authenticate` | "401/403 响应头" | 携带 `Bearer error=...` 等指令指导客户端如何进行凭据补全与错误恢复的标准 HTTP 响应头 |

## 延伸阅读

- [MCP 授权规范（2026-07-28 修订版）](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)- Actuellement autorité de MCP  autorité Profil
- [MCP 2026-07-28 更新日志](https://modelcontextprotocol.io/specification/2026-07-28/changelog)- couvrant les activités de CIMD, de l'émission des certificats, de la RDC et des modifications importantes de l'isolement des certificats
- [OAuth 客户端 ID 元数据文档规范草案（draft-ietf-oauth-client-id-metadata-document-00）](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-client-id-metadata-document-00) CIMD 核心标准
- [RFC 8414 — OAuth 2.0 授权服务器元数据](https://datatracker.ietf.org/doc/html/rfc8414) 服务发现技术契约
- [RFC 7591 — OAuth 2.0 动态客户端注册协议](https://datatracker.ietf.org/doc/html/rfc7591) RDC 规范(向后兼容路径)
- [RFC 7636 — 代码兑换证明密钥（PKCE）](https://datatracker.ietf.org/doc/html/rfc7636) 公共 clientèle preuve de propriété
- [RFC 8707 — OAuth 2.0 资源指示符](https://datatracker.ietf.org/doc/html/rfc8707) Mécanisme central de mise en œuvre de la politique de sécurité
- [RFC 9728 — OAuth 2.0 受保护资源元数据](https://datatracker.ietf.org/doc/html/rfc9728) 资源服务器服务发现
- [RFC 9207 — OAuth 2.0 授权服务器签发者识别](https://datatracker.ietf.org/doc/html/rfc9207)Pour défendre les attaques mixtes.`iss`参数规范
- [RFC 7662: OAuth 2.0 Token 内省协议（Token Introspection）](https://datatracker.ietf.org/doc/html/rfc7662)
- [RFC 7009: OAuth 2.0 Token 撤销协议（Token Revocation）](https://datatracker.ietf.org/doc/html/rfc7009)
