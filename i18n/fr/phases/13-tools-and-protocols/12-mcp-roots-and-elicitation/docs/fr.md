# 显式权限范围与无状态 Élicitation

> Roots en MCP 2026-07-28 规范中已被弃用,且它从来不是安全沙箱. 详见:                                                                                                                                                                                                                                               

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 11 (stateless MRTR)
**Time:** ~60 minutes

## Objectif de l'apprentissage

- Utilisation de la zone de travail apparente paramètres, URI de ressources ou serveur configuration statique remplacer les racines abandonnées.
- La définition de la portée des informations et des droits de reconnaissance, des restrictions de cheminement et des restrictions de contrôle des systèmes d'exploitation
-  À travers le MRTR `input_required`结果交付表单模式(form-mode) de`elicitation/create`Il y a une autre.
- Dans chaque requête de client capacités, déclarer l'obtention de support et refus de support.
-  strictement`accept`- Je suis là.`decline`et `cancel`Il y a trois résultats très différents.
- L'ensemble des candidats et le délai de validation seront liés à la personne concernée.

## Deux questions qui semblent être similaires

Un outil de notes 收到了如下请求: 删除旧 TPS 报告──

Le serveur doit répondre à deux questions différentes:

1. Cette opération permet de toucher quel espace de travail ?
2. Dans trois notes correspondantes, quelle est la note utilisateur ?

La première question concerne la portée (scope) et le droit d'identifier (autorisation) de la première question concerne la communication (interaction) de l'interface (interaction) de l'interface (interaction) de l'interface (interaction) de l'interface (interaction) de l'interface (interaction) de l'interface (interaction) de l'interface (interface) de l'interface (interface) de l'interface (interface) de l'interface (interface) de l'interface (interface) de l'interface (interface) de l'interface (interface) de l'interface (interface) de l'interface (interface) de l'interface (interface) de l'interface (interface) de l'interface (interface) de l'interface (interface) de l'interface (interface) de l'interface (interface) de l'interface (interface) de l'interface (interface) de l'interface (interface) de l'interface (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (interface) (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (

## Les racines  仅为迁移过渡表面

Les premières règles du MCP permettaient au client de déclarer les racines et de notifier le serveur au moment où la liste change. Cependant, les racines ne sont que des informations de guidage suggestives.

MCP 2026-07-28  Pour le nouveau design, l'utilisation totale a été abandonnée `roots/list`Avec `notifications/roots/list_changed` Recommandation d'utiliser les solutions suivantes:

- Lorsque la portée change avec chaque modification, utilisez`workspaceUri`Ou `directory`outil 参数。
- Lorsque l'opération elle-même est dirigée vers une ressource spécifique, utilisez l'URI de la ressource.
- Lorsque un déploiement spécifique occupe une zone de travail fixe, utilisez un serveur 配置文件。
- Lorsque vous devez bloquer le code de manière technique, utilisez le processus dans la boîte de sable du processus ou le système de fichiers emprisonné.

Si le programme d'accès existant de 2026 à 28 juillet est encore nécessaire pendant la période de transition abandonnée`roots/list`Le serveur doit être intégré à la MRTR.`inputRequests`En effet, il est impossible de transmettre des requêtes inverses en temps réel.

Le modèle peut voir et répéter des expressions apparentes (en anglais) et le cadre caché dans les discussions de la transmission est plus difficile à examiner, à réécrire, à vérifier et à traiter.

### 3 étages de défense

L'IRU évidente ne s'est pas elle-même prouvée légitime.

1. **鉴权（Authorization）：**L'organisme ayant le droit de reconnaissance est-il autorisé à utiliser cette zone de travail?
2. **路径限制（Containment）：**L'objectif de la normalisation ultérieure est-il strictement de maintenir l'URI à l'intérieur des frontières des zones de travail autorisées ?
3. **沙箱隔离（Sandbox）：**Une fois que le serveur est en panne, le système d'exploitation peut-il effectivement empêcher sa fuite ?

Le serveur opérationnel 会维护一个信任工作区 URI 白名单,规范化处理百分号编码的路径,校验真实的路径组件边界,并执行物理删除前即时重新检查路径限制──

L'inspection préliminaire de caractères de l'enfant est une faille grave:

```text
allowed:   file:///work/notes
attacker:  file:///work/notes-evil/secret.md
traversal: file:///work/notes/%2e%2e/private.md
```

Les deux voies malintentionnées sont toutes en ligne de ligne avec la loi. Il faut d'abord normaliser, puis rétablir un niveau de niveau par rapport aux composants de chemin.

## L'élicitation existe toujours, mais la façon de communiquer a changé.

L'élicitation est une pratique courante dans le monde moderne.`tools/call`- Je suis là.`prompts/get`Ou `resources/read`                                                                                                                                                                                                                                                              `elicitation/create`                                                                                                                                                                                                                                                              

Le serveur de 2026-07-28 ne sera pas envoyé contre JSON-RPC`InputRequiredResult`- Le numéro de la liste:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "input_required",
    "inputRequests": {
      "delete_choice": {
        "method": "elicitation/create",
        "params": {
          "mode": "form",
          "message": "Choose one matching note and confirm deletion.",
          "requestedSchema": {
            "type": "object",
            "properties": {
              "note_id": {
                "type": "string",
                "enum": ["note-3", "note-7", "note-14"]
              },
              "confirm": {"type": "boolean"}
            },
            "required": ["note_id", "confirm"]
          }
        }
      }
    },
    "requestState": "integrity-protected-delete-state"
  }
}
```

Host 负责染表单──user can choose to submit accept (accepter) 、显式拒绝 (decline) 直接取消/关闭 (canceller) ──suite client 携带全新 id 重试原始的 `tools/call`- Le numéro de la liste:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "notes_delete",
    "arguments": {
      "workspaceUri": "file:///Users/alice/Documents/Notes",
      "title": "TPS report"
    },
    "inputResponses": {
      "delete_choice": {
        "action": "accept",
        "content": {"note_id": "note-14", "confirm": true}
      }
    },
    "requestState": "integrity-protected-delete-state",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "elicitation": {"form": {}}
      }
    }
  }
}
```

Il n'y a pas de protocole entre les deux appels. L'état de l'expérience du serveur, selon le schéma prévu, confirme que la note sélectionnée est contenue dans le groupe de candidats signés, réinitialise le droit d'identification de la zone de travail, réinitialise la limite de chemin de vérification, et finalement, effectue la suppression.

##  pour chaque demande  capacité de négocier

支持表单模式 elicitation 的客户 会声明:

```json
{
  "io.modelcontextprotocol/clientCapabilities": {
    "elicitation": {"form": {}}
  }
}
```

Capacité d'élicitation`"elicitation": {}`) pour la compatibilité considérée est égale à la simple prise en charge de la forme unique.`"elicitation": {"form": {}}`De même, vous pouvez utiliser un seul modèle.`"elicitation": {"url": {}}`) ne supporte pas la présentation unique. Le serveur ne peut pas intégrer les capacités de la demande en cours dans le modèle manquant, même si la demande précédente a déclaré ce modèle.

Chaque requête doit être portée.`io.modelcontextprotocol/protocolVersion` version défaut ou non-filette type retour `-32602`▽不支持的版本字符串返回 `-32022`Il n' a pas de précision.`supported`Avec `requested`Date: absence ou seulement support de l' URL`-32021`,并将 `data.requiredCapabilities`设为 `{"elicitation":{"form":{}}}`Il y a une autre.

 sans JSON-RPC `id`Le message appartient à la notification. Il est traité directement, ne pas émettre de JSON-RPC succès ou erreur de réponse.`202 Accepted`Il y a une autre.

`clientInfo` doit être inclus pour le diagnostic, mais il est indépendant et ne peut pas être utilisé pour identifier les droits d'identification de l'utilisateur.

Le serveur est réalisé .`server/discover`Il n' y a pas de retour`resultType: "complete"``supportedVersions`、capacités`ttlMs`et `cacheScope`Pour ce design moderne, il ne s'exprime pas à l'extérieur Roots.`tools/list` Le résultat est de retour à la certitude `notes_delete`描述符、合法的 objet 类型 `inputSchema`、serveur, données et données publiques 缓存提示──

## 表单模式(Mode de forme)

Le schéma JSON est un schéma JSON limité. Le schéma JSON est un schéma JSON qui est utilisé pour créer des modèles de dialogue.

Mode de travail unique s'applique à:

- Choisir parmi plusieurs projets candidats;
- ¢ confirmer une opération perturbatrice;
-  préférences de configure de la collecte d'informations sensibles;
- La quantité d'extraction doit être déterminée par les hommes et non par le modèle.

绝对不要使用单单模式来收集密码,API key,访问令牌或支付凭证――这些密码信息如果通过MCP client,极易流入日志或模型上下文中――

Le serveur doit être testé à nouveau pour le contenu de la transmission.

## Modèle URL

URL 模式发送一个安全的网址以进行带外(out-of-band)交互:

```json
{
  "method": "elicitation/create",
  "params": {
    "mode": "url",
    "message": "Connect the report service to continue.",
    "url": "https://mcp.example.com/connect/report-service"
  }
}
```

Lorsque des informations sensibles doivent être directement introduites dans le Web contrôlé par le serveur (par exemple, le tiers autorisé à autoriser) alors utilisez le modèle URL. Le client se présente à l'utilisateur pour afficher le but de saut complet et obtenir le consentement de l'utilisateur avant l'ouverture.

`accept` Répondre seulement indique que l'utilisateur a accepté d'ouvrir cette URL, ne prouve pas que la communication externe a été réussie.`input_required`Le résultat:

L'exécution d'URL  ne peut absolument pas remplacer le mécanisme de détection entre le client MCP et le serveur MCP― c'est pour que le serveur MCP représente l'utilisateur pour exécuter une interaction externe et conçue―. Le serveur doit être étroitement lié à l'utilisateur du terminal du navigateur avec le même sujet de détection de l'opération MCP―.

## 响应分支与处理分支

Veuillez prendre des décisions de production et non de production de produits strictement liées à la politique de l'entreprise.

| 动作 | 含义 | 安全的 Server 处理行为 |
|---|---|---|
| `accept` | 用户提交了交互内容 | 校验内容并继续执行 |
| `decline` | 用户明确表示拒绝 | 返回一个执行完成且非错误的拒绝结果 |
| `cancel` | 用户关闭对话框或未能完成交互 | 安全停止并允许稍后重试 |

绝不要将缺失内容解读为默许同意. 绝不要将衰退. 绝不要将衰退. 绝不要将转变为重复追问的死循环.

##  protection perturbatrice MRTR  état

La liste des candidats ne peut pas être uniquement présente dans la base 64 de la liste de référence ou non signée. Le client a le contrôle de tout ce qui est transmis.

Le cours a été signé pour la charge de l'état, contenant:

- 经过鉴权的主体;
- 发起调用 méthode originale;
- `workspaceUri`Avec `title`Le résumé
- Liste des notes et des pièces justificatives de la mise en valeur;
- 操作执行阶段;
- - Je suis en train de faire une petite pause.

Avant l'exécution des modifications, le serveur vérifie également les derniers enregistrements de notes vivantes. Cela permet de prévenir les conditions de mise en œuvre de l'opération de suppression ainsi que la situation où les notes cibles sont déplacées de la zone de travail à la frontière après la présentation de la carte de travail.

Pour une opération financière unique ou une opération irréversible, le HMAC seul ne peut empêcher l'état légitime de se réaffecter pendant sa durée de validité. Il doit être strictement utilisé pour générer et consommer des opérations atomiques et des opérations aléatoires.

Avant de déclarer que la communication est légale, il faut d'abord vérifier la légitimité de la communication.`cancel`Ne fera aucun changement, et ne permettra pas à cet état de refaire des essais préliminaires.`decline`Il est donc nécessaire de ne pas exécuter de suppression.

```figure
t3-roots-boundary
```

## Handwriting réalisation

`code/main.py`Une démonstration moderne.`notes_delete`outil:

- `tools/list`返回确定性、可缓存的描述符, contenant l'espace de travail nécessaire et le schéma de titre。
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `workspaceUri`参数传递。
- Configuration du serveur pour le sujet du cours en cours d'accès à la zone de travail.
- URI 规范化有效拒绝前混与编码后的目录遍历攻击──
- Les exigences de destruction sont imposées par un seul mode d'élimination.
- Élicitation 封装在 `resultType: "input_required"`Le transport est terminé.
- 签名 `requestState` lié à la liste des candidats précise avec les paramètres originaux
- Les réserves de stockage de résistance à la répartition peuvent être utilisées sur plusieurs serveurs, par exemple en refusant de réutiliser le même acceptation ou déclin.
- 重试调用 adopter un nouveau code de demande et le retour`resultType: "complete"`Il y a une autre.

Le stockage de données utilise la mémoire interne pour réaliser un accord de contrôle clair. Si vous accédez à la base de données, les règles de sécurité sont parfaitement cohérentes.

## Utilisation et fonctionnement

Dans le catalogue des magasins:

```bash
cd phases/13-tools-and-protocols/12-mcp-roots-and-elicitation/code
python3 main.py
python3 -m unittest discover tests -v
```

预期检查点:

- Les outils de découverte 声明 且不包含 Roots。
- Découverte de l' outil  retour `notes_delete`, avec`resultType`、serveur Identité et cache
- Veuillez obtenir un identifiant`1`Dans le`inputRequests.delete_choice`Je reviens à la maison.
- Veuillez obtenir un identifiant`2`Révélation de l'état de signature并完成删除──
- Les méthodes de fraude et de code de tout le monde ont entraîné des échecs limitants.
- 改 title 无法复用先前的确认状态──
- 执行 decline 会保留笔记完好无损──
- Les deux serveurs en état de réparation et de réparation ne peuvent pas être réécrits et confirmés une fois.
- Les déclarations de configuration et de déclaration de déclaration sont normales, et seulement les déclarations de URL sont correctement retournées.`-32021`Il y a une erreur de demande.
- Version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte de la version incorrecte`-32022`Les données sont structurées.
- 没有 id 的通知 不产生任何 JSON-RPC 响应──

## 交付产物

`outputs/skill-elicitation-form-designer.md`能够辅助设计显式范围、识别权检查、MRTR表单、响应分支与状态绑定──it interdit strictement les racines déjà abandonnées lorsqu'elles sont utilisées dans des boîtes, ou encore la collecte de renseignements sensibles en utilisant des modèles simples.

## 课后练习

1. Pour une seule opération, une déclaration d'atomisation nonce et la suppression de notes prouvent que deux processus ne peuvent pas être soumis simultanément avec succès.
2. 增加 `url`Capacité de négocier avec le processus de mise en place de la licence.`inputResponses`Il y a une autre.
3. Le droit de réapprentissage et de restriction de cheminement sont limités dans les changements de données.
4. Pour le système de fichiers réels, il est possible de créer des liens symboliques.
5.  concevoir un 2025-11-25  adaptateur, 将现代MRTR handler 输出映射为旧式服务器 发起的发动,并保持其与当前处理器的代码隔离──

## 关键术语

| 术语 | 2026-07-28 中的含义 |
|------|------------------------|
| Roots | 已弃用的提示性工作区指引，不具备鉴权或沙箱隔离能力 |
| 显式权限范围（Explicit scope） | 在请求参数中清晰可见的工作区、目录或 resource 句柄 |
| 路径限制（Containment） | 规范化路径组件校验，确保目标严格限制在受控边界之内 |
| Elicitation | 在 MCP 操作执行期间用于获取用户输入的 client 特性 |
| 表单模式（Form mode） | 使用受限扁平 schema 的带内（in-band）结构化用户输入 |
| URL 模式（URL mode） | 针对敏感或外部工作流的带外（out-of-band）Web 交互 |
| MRTR | 多轮往返请求，返回 input-required 结果后由 client 发起全新重试 |
| `requestState` | 不透明的状态凭证，由 client 原样回显并由 server 进行完整性校验 |
| Decline（拒绝） | 用户明确作出的拒绝操作 |
| Cancel（取消） | 用户主动关闭界面或在未获批准的情况下中断交互 |

## 旧版兼容性

Pour les deux versions fixées en 2025-11-25,`roots/list`- Je suis là.`notifications/roots/list_changed`Et le serveur en temps réel`elicitation/create`Peut-être existe-t-il encore. Veuillez identifier clairement l'adaptateur comme héritage.

## 延伸阅读

- [MCP 2026-07-28 Elicitation](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation)
- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 Roots deprecation](https://modelcontextprotocol.io/specification/2026-07-28/client/roots)
- [MCP 2026-07-28 server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
