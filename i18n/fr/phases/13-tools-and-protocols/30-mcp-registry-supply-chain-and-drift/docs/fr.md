# Registre des PCM  Chaîne d'approvisionnement:准入、漂移与回滚

> Les articles du registre ne peuvent que décrire ce que l'éditeur a déclaré. Le contrôle de la production doit prouver ce que vous avez retenu, observé, approuvé et ce que vous pouvez récupérer.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 17 (gateways and registries), Phase 13 · 18 (production authentication)
**Time:** ~90 minutes

## Objectif de l'apprentissage

- 明确切分 Registry 发布、软件包出处 (来源) 运行时发现与本地审批等不同边界──
- Dans le cadre de la déclaration de l'Independence verification de son nom de domaine, le MCP 服务端记录自声明的前提下,独立验证其命名空间──
- Pour les enregistrements de publication indéfectibles, les sources d'exécution, les paquets de logiciels et les outils en temps réel, les décrivains de fichiers de preuve sont en cours de publication.
- Après l'entrée, le référentiel de référencement réel est modifié par rapport au comportement de la mise en œuvre.
- Dans le cadre d'une réécriture historique, le roulement sera effectué en toute sécurité jusqu'à la version préalable.
- 维护一个防改的准入账本 (en anglais seulement), fournir une explication de l'audit pour chaque décision.

## 核心问题

Tu l' as trouvé dans le registre.`com.example/inventory`◊ sa description semble pleinement conforme à la demande.`server/discover`Il y a une autre.

Ce n'est pas un fait isolé, mais un fait écrit par des organismes de pouvoir différents:

1. Un éditeur qui a passé ce nom de l'identité de l'espace a soumis un document.
2. Un centre d'enregistrement de colis a émis un outil avec une identification spécifique et un résumé de la liste de colis.
3. Un terminal de fonctionnement réel rapporte la version du protocole, la capacité de soutien, les outils disponibles ainsi que les informations du terminal de service de diagnostic.
4. L'organisation a déterminé que cette combinaison définie était conforme à la stratégie et qu'elle était autorisée à fonctionner.

Si ces niveaux sont confondus, il est tout simplement possible de penser que, puisqu'il est dans le Registre, on peut directement y faire confiance, et qu'il reste une énorme zone aveugle sur la sécurité de la chaîne d'approvisionnement. Une version légale de la publication peut être abandonnée à tout moment. Si vous n'avez pas de résumé de l'élément fixe, la balise du logiciel peut être remplacée par un système secondaire inattendu à l'avenir.

La solution est de créer un contrôleur d'entrée, qui doit être obligatoire dans chaque région.

## Le registre est un index, pas votre système d'approbation.

官方 MCP Registry Usée pour le stockage des données du service de stockage.`server.json`记录声明 une version de service, et énumère un ou plusieurs paquets de logiciels ou de points de distanciation. Les règles de publication comprennent le certificat de nom de domaine, le contrôle des droits de propriété du paquet de logiciels, les règles de source d'enregistrement limitée et la position de stockage de données de l'éditeur strictement limitée.

Ces mesures de contrôle répondent:**发布层面**Mais votre stratégie de sécurité de la production doit toujours être répondue.**部署层面**Le problème:

| 边界 | 核心问题 | 证据所有者 |
|---|---|---|
| 命名空间 | 该发布者是否有权使用此名称？ | Registry 认证凭证 + 本地验证过的命名空间输入 |
| 发布记录 | 发布者针对该版本具体声明了什么？ | 不可变的 `server.json` 内容摘要 |
| 执行源 | 最终执行的是哪个软件包或远程端点？ | 已声明的源字段、已验证的所有权结果、传输协议以及可信内容摘要 |
| 运行时 | 该端点当前实际暴露了什么能力？ | 实时 `server/discover` 结果与工具描述符 |
| 准入决策 | 本地安全策略是否批准了这套确切的组合？ | 本地固定的指纹（Pin）与账本记录项 |
| 运维治理 | 当前服务是否依然安全？故障时何者可替代？ | 漂移检测、状态同步、健康检查与备用回滚路由 |

Le Registre Schema  version avec MCP  protocole version sont indépendants l'un de l'autre.`2025-12-11`服务端规范, tandis que les services de fonctionnement réel ne soutiennent pas les MCP `2026-07-28`Il est impossible de passer d'une version à l'autre.

```figure
mcp-registry-admission
```

## 单次准进决策中的七重控制

### 1. 命名空间验证

Un nom de domaine de l'expérience peut être mappé comme un pré de la forme de nom de domaine inversée.`example.com`Le contrôle peut être établi.`com.example/*`La légitimité de la loi.

绝对不能使用简单的字符串前检查:

```python
server_name.startswith("com.example")
```

Parce que ce jugement serait aussi faux et ne permettrait pas de faire de mauvaises intentions.`com.exampleevil/tool`Il faut que je le fasse !`/`切分名称, exige contenir des fragments de boules non vides,并精确比对命名空间这一段.

 L'espace de nommage organisé basé sur GitHub et l'espace de nommage basé sur le nom de domaine possèdent des voies d'authentification différentes.  Le contrôleur d'accès doit unifier ces deux voies en un même paramètre d'entrée: une chaîne de nommage entièrement correspondante et validée.

### 2. 出处关联(Provenance rejoindre)

Pour les enregistrements de type de logiciel, les données de déclaration doivent être strictement liées aux éléments de travail réellement réalisés dans les sections suivantes:

- 软件包注册中心类型(如PyPI、npm)
- 软件包标识符
- 软件包版本号
- 已验证 propriété contrôle résultat
- 实际下载工件的内容哈希摘要

En outre, il faut également un protocole de transmission de déclaration de téléportation. Si un article de document ne déclare que le point de terminaison à distance, il est également entièrement conforme, il ne peut absolument pas être rejeté en raison du manque de logiciels. Pour les sources à distance, il faut associer l'URL et le type de transmission de la déclaration à la propriété du point de terminaison certifié indépendamment, ainsi qu'un résumé de la connexion ou du déploiement fiable.

Ce code d'exemple de cours soutient simultanément ces deux types de sources, et sera choisi source avec Registry 源、服务端名称、Registry 版本、记录摘要以及凭证摘要共同计算出一个哈希──生成的出处摘要( provenance digest) est un indicateur étroit de la chaîne de preuves complète, mais il ne peut absolument pas remplacer la conservation permanente de la preuve originale complète。

∞ ne peut pas accepter directement les résumés fournis par les éléments de l'objet de l'examen lui-même ∞ doit être recalculé dans un cadre de la limite de téléchargement de confiance, ou reçu du service de gestion de l'emballage de confiance que vous avez déjà vérifié ses résultats ∞

### 3.  décision fixe, et non seulement version fixe

La version du registre est le seul identifiant de publication. Les données publiées sont immuables. Toutes les modifications du registre doivent être publiées pour une nouvelle version. Bien que la version officielle soit recommandée pour utiliser la version synonymisée, le registre lui-même n'est pas obligatoire et n'accepte pas de code générique de version similaire.

Ça veut dire ça.`^1.4`La définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition de la définition est est.

```json
{
  "server": "com.example/inventory",
  "version": "1.0.0",
  "recordDigest": "...",
  "source": {"kind": "package", "registryType": "pypi"},
  "sourceDigest": "...",
  "toolsetDigest": "...",
  "provenanceDigest": "...",
  "registryStatus": "active"
}
```

Pour plusieurs niveaux différents, faire des traits en même temps, vous pouvez rapidement localiser les limites qui ont changé en cas d'apparition d'une anomalie: dans le même Registre  version sous enregistrement résumé changement, appartient à Registre données intégrité de dégradation; dans le même logiciel packaging ou de longue distance déploiement sous résumé source changement, appartient à l'exécution source changement; tandis que les outils ensemble résumé (outillage digest) changement, appartient à la fonctionnement comportement drift.

### 4. 实时运行时漂移检测

准入流程必须主动观测实际接收业务流量的服务端实例──通过信任通道调用 `server/discover`, éditer ou obtenir des descripteurs des outils exposés, et vérifier:

- `supportedVersions`  `2026-07-28`Le dépôt de la commission
- Toutes les exigences de la stratégie locale sont satisfaites;
- Chaque outil descripteur possède une identité de référence et une surface définie par le schéma;
-                                                                                                                                                                                                                                                               

结果中可选的  résultat parmi les options`_meta["io.modelcontextprotocol/serverInfo"]`Il est possible de le considérer comme une information de diagnostic, mais il est possible de le considérer comme un document de diagnostic.**绝不能**Il est utilisé comme base de jugement sur le nom de domaine, la propriété du logiciel, le point de référence, la licence d'accès ou toute décision de sécurité.`_meta`Directement du ministère`serverInfo`别名更不属于官方契约字段, il est absolument indispensable de le qualifier de preuve de diagnostic légitime.

Il suffit de classer les segments de l'ordre sans signification en eux-mêmes. Dans le calcul, l'exemple de ce cours se classe en fonction de la liste des outils, de sorte que la variation de l'ordre de retour pur ne sera pas mal signalée comme déplacée. Mais elle ne rejettera jamais aucun segments du descripteur.

Le code d'exemple considère que toute modification de description de format d'erreur ou de résumé d'un descripteur est considérée comme un comportement dérivé, qu'il soit immédiatement isolé de l'empreinte, qu'il soit mis en quarantaine, qu'il soit retiré de son chemin actif et qu'il soit bloqué pour être qualifié d'objectif de retour. Dans un environnement de production, même si la modification de description est mineure, il faut également adopter un tout nouveau processus d'audit, car le grand modèle doit être adapté à la description de l'outil pour décider de la modification du texte à la surface de l'outil pour modifier fondamentalement le comportement exécutif de l'agent.

### 5. Registre  état est réel

L'API du registre sera ajoutée à chaque service de niveau de réponse.`_meta`Les données sont conservées par le Registre 官方托管的字段存储`_meta["io.modelcontextprotocol.registry/official"]`路径下──准入控制器需解析该响应并读取 `_meta["io.modelcontextprotocol.registry/official"].status` directement situé au point de la racine `_meta.status`Il ne correspond pas au format officiel de transmission en ligne. Ne mélangez pas les données de réponse extérieures avec les données de publication de l'enregistrement interne.

- `active`:pour un retour par défaut, ayant les conditions requises pour être candidat à l'entrée locale;
- `deprecated`: abandonné, bien qu'il puisse être examiné jusqu'à présent mais accompagné de police, cesse de coordonner pour des options de recommandation automatique;
- `deleted`: supprimé, caché dans la liste par défaut, mais accessible par l'interface du point de vue supprimé ou augmenté

准入完成后必须持续同步状态―― une fois que la version originale active est marquée comme abandonnée ou supprimée, elle doit être immédiatement isolée de ses empreintes et cesser de fournir le nouveau flux de routiers à elle―― tout en conservant tous les certificats historiques de la liste de référence supérieure, cela ne signifie absolument pas que vous pouvez supprimer le registre de suivi des audits sur place――

 Les données personnalisées fournies par l'éditeur ne peuvent être stockées que dans les enregistrements de publication `_meta.io.modelcontextprotocol.registry/publisher-provided`Les données de l'administration du registre sont totalement indépendantes.

### 6. Retour signifie roulement de récupération

Les enregistrements de publication invariables ne seront jamais modifiés au cours du processus de rollout. Les soi-disant rollouts, qui sont déjà passés et qui sont toujours conformes à la condition, sont sélectionnés et modifiés dans le cadre de l'objectif du processus de rollout.

Un objectif de retour sûr doit être atteint en même temps:

1. avoir un dossier d'entrée complet et légal;
2. Dans le cadre de la stratégie locale actuelle, son état de registre reste actif;
3. n'ayant pas été identifiés comme étant isolés par un policier ou un certificat de sécurité en cours de fonctionnement;
4. 仍然能精确解析到已固定的软件包和线上描述符集合;
5. 通過当前最新健康檢查──

Dans le cas de l'exemple de ce cours, il est nécessaire de mettre en œuvre un programme de réinitialisation et de réinitialisation de la production de contrôleurs de comptes.

### 7. 追加准入账本

准入数据库 准入账本 (admission ledger) 准入账本 (admission ledger) 准入账本 (admission ledger) 准入数据库 (admission ledger) 准入账本 (admission ledger) 准入账本) 准入账本 (admission ledger) 准入账本 (admission ledger) 准入账本 (admission ledger) 准入账本 (admission ledger) 准入账本) 准入账本 (admission ledger) 准入账本 (admission ledger) 准入账本) 准入账本 (admission ledger) 准入账本) 准入账本 (admission ledger) 准入账本) 准入账本 (admission ledger) 准入账本) 准入账本 (admission ledger) 准入账本) 准入账本 (admission ledger) 准入账本) 准入账本) 准入账本 (admission ledger) 记录) 准入账本 (admission ledger) 准入账本) 准入账本

Chaque élément du livre de cours contient le premier numéro, le temps, le type d'événement, l'identification du service, la version, le résultat de décision, les explications des causes, le ensemble de preuves, le premier élément de la liste et le deuxième élément de la liste.

Il s'agit d'un mécanisme doté de la capacité de contrôle de la modification de la capacité de vérification, mais non magiquement indestructible. Il faut régulièrement mettre le livre dans un domaine de confiance indépendant, par exemple, le système de diffusion de données de signatures numériques ou le WORM.

## Handwriting réalisation

可直接运行的控制器代码位于 `code/main.py`Tout est basé sur Python.

首先运行有限状态演示:

```bash
cd phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift
python3 code/main.py
```

La démonstration est basée sur cinq opérations fondamentales:

1. - Je suis là .`1.0.0`, nuclear验匹配的命名空间、包出处、协议版本、能力及工具集;
2. - Je suis là .`1.1.0`Il sera transformé en route active;
3. Pendant la mise en œuvre, on observe un outil de suppression inattendu;
4. 观测到 `1.1.0`Le statut officiel du registre est modifié`deprecated`Le dépôt de la commission
5. La route sera désormais plus facile à régler.`1.0.0`- Un signe fixe.

预期输出结构:

```json
{
  "admitted": [true, true],
  "driftAllowed": false,
  "rollbackAllowed": true,
  "activeVersion": "1.0.0",
  "ledgerValid": true
}
```

建议按以下顺序研读实现代码:

1. `namespace_for_domain()`Avec `namespace_matches()`: établir une limite de nommage précis;
2. `digest()`Avec `normalized_tools()`: résumé des preuves de détermination;
3. `RegistryAdmissionController.admit()`: accumuler des documents publiés, des certificats de sortie, des observations et des stratégies locales;
4. `check_live()`: par rapport aux données de l'observation la plus récente et aux empreintes digitales établies;
5. `observe_registry_status()`: à l'exécution de la séparation de la version de l' état de l' enregistrement;
6. `rollback()`: seulement activé à l'avance et conforme à l'objectif de retour légitime;
7. `AdmissionLedger.verify()`: Épreuve de la rédaction de l'article

## 运行与使用

Le contrôleur d'entrée est situé entre la découverte et le chemin:

```text
Registry sync -> artifact verifier -> live discovery -> admission controller -> route table
                                                |                 |
                                                v                 v
                                           evidence store    admission ledger
```

Pour les tâches ci-dessus, la répartition des pouvoirs minimaux est séparée: les tâches de registre et de phase nécessitent des pouvoirs de lecture uniquement des données; les tâches de test des objets nécessitent des pouvoirs de tirage de l'emballage logiciel; les contrôles de route nécessitent des pouvoirs d'activation pour obtenir des empreintes digitales.

明确划分版本的状态模型:批准(已批准) signifie que le permis a passé une révision stratégique;Active(活跃) représente le chemin courant de l'utilisation;Quarantaine(已隔离) signifie interdire la réception de nouvelles demandes d'affaires;Superseded(已更替) explique une autre version déjà préparée est en état d'être activée── Impossible d'utiliser une seule valeur de base pour mélanger ces quatre états distinctement différents.

Il faut être à l' écoute`tools/list`Dans le cas contraire, il est très probable que, dans le temps de la publication et de l'évaluation des stratégies de sécurité, l'utilisateur ait découvert accidentellement des outils non fiables.

## 交互式实验

Vous allez voir les frontières de chaque défaite.

### 实验 A: nommé空间冲突

进入代码目录并打开 Python 交互环境:

```bash
cd phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/code
python3 -q
```

执行如下命令:

```python
from main import namespace_matches
namespace_matches("com.example/inventory", "com.example")
namespace_matches("com.exampleevil/inventory", "com.example")
```

Le premier résultat est:`True`Le deuxième résultat est:`False`                                                                                                                                                                                                                                                              `startswith`, observe pourquoi le deuxième mal intentionné se déplace à travers la frontière.

### 实验 B: descrip符漂移

```python
from main import *
times = iter(f"2026-08-21T12:00:{n:02d}+00:00" for n in range(10))
c = RegistryAdmissionController(clock=lambda: next(times))
meta = {OFFICIAL_META_KEY: {"status": "active"}}
c.admit(sample_record("1.0.0"), meta, "com.example", evidence_for("1.0.0"), sample_live("1.0.0"))
c.check_live("com.example/inventory", "1.0.0", sample_live("1.0.0", True))
```

 Revenues et état de route  Software package et Registry  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  recording  recording  recording  recording  recording  recording  recording  recording  recording  recording  recording  recording  recording  recording  recording  recording  recording 

### 实验 C: état avec randonnée

- Je suis là .`1.1.0`, le marquer comme abandonné, et essayer de se réunir séparément pour atteindre ces deux objectifs:

```python
c.admit(sample_record("1.1.0"), meta, "com.example", evidence_for("1.1.0"), sample_live("1.1.0"))
c.observe_registry_status("com.example/inventory", "1.1.0", "deprecated")
c.rollback("com.example/inventory", "1.1.0", "unsafe retry")
c.rollback("com.example/inventory", "1.0.0", "restore known release")
c.ledger.verify()
```

L'objectif de l'isolement sera clairement rejeté, alors que les précédentes règles de conformité`1.0.0`Les empreintes sont activées, les comptes sont toujours valides.

## 动手实践

Pour contrôleur étendre la mise en œuvre du système de contrôle de l'information

需求规范:

- L'approbation des informations doit être stockée en tant que référence à la preuve de signature numérique, et doit être conservée dans les empreintes digitales en tant que caractères changeants;
- Lorsque les outils sont concentrés contiennent une déclaration `destructiveHint: true`Dans les cas de risque élevé, il faut demander la signature de deux membres différents de l'examinateur;
- refuser la réception de la réécriture;
- Lorsque l'approbation n'est pas terminée, le dossier complet de cette tentative d'entrée est toujours dans le livre des comptes;
- 编写测试,分别覆盖 0 人、1 人、重复身份以及 2 scénarios d'approbation de différentes identités légales;
- Il est indispensable d'imprimer une signature numérique, une clé de certificat ou un outil privé complet.

验收标准: tant que les deux examinateurs indépendants ne seront pas disponibles pour un résumé des documents, un résumé des paquets de logiciels et un résumé des ensembles d'outils, les outils destructeurs ne pourront absolument pas entrer dans un état de viabilité actif.

## 交付产物

本课程交付 `outputs/skill-mcp-registry-admission.md` Lors de la révision de la nouvelle version du Registre ou du processus de révision, il peut être considéré comme un manuel de rédaction directement réutilisable. Il définit indépendamment les paramètres d'entrée, les règles de refus, les certificats de liaison, les exigences de processus et de référencement, sans dépendre de n'importe quel nom de classe dans le code d'exemple spécifique.

## 验证标准

运行演示程序与全套确定性单元测试:

```bash
cd phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

测试套件 doit être strictement prouvé:

- 精确的命名空间边界能成功拦截形似前的恶意名称;
- 只有官方命名空间所附附的登记处 状态才能决定版本是否具有候选资格;
- Les paquets de logiciels non expérimentés ou non conformes au contenu et les certificats de terminaison à distance seront fermement rejetés;
- ▌l' éditeur ne peut absolument pas charger le registre 官方托管元数据;
- L'ordre des listes d'outils a été normalisé sans masquer les changements substantiels du descripteur;
- La structure des logiciels et des outils modifiés est définie pour provoquer des défaillances de sécurité;
- `serverInfo`☐ ne peut être accordée qu'à titre de certificat de diagnostic;
- Lorsque le décrivaine se déplace, le système exécute immédiatement le processus d'isolement et de retrait, et bloque le roulement du trait d'empreinte;
- Le changement de l'état de l'élévation peut entraîner l'isolement des traits actifs;
- La version de la réplique est définie comme étant indépendante ou inconnue.
- Toutes les modifications apportées au livre historique peuvent être immédiatement vérifiées.

## Mode de déclenchement de la production

| 故障现象 | 发生原因 | 必须采取的应对措施 |
|---|---|---|
| 名称看似合法但命名空间从未经验证 | 准入策略轻信了记录内部的自述文本 | 严格拒绝，直到可信命名空间验证方提供精确前缀 |
| 相同软件包坐标拉取到了全新的二进制内容 | 上游版本被覆盖或分发源遭受投毒篡改 | 立即终止激活，保留两份摘要，调查拉取网络边界 |
| “latest”版本在未经人工审查的情况下发生漂移 | 浮动版本选择绕过了固定指纹机制 | 始终只解析和激活完全精确的已准入版本与摘要 |
| 安全审查通过后线上悄然出现新工具 | 发生了运行时行为漂移，或部署了不同镜像 | 隔离该路由，重新采集最新的实时描述符快照 |
| 已废弃的版本依然在线上持续运行 | 状态同步机制缺失或同步存在严重延迟 | 建立定时状态调和机制，并在每次路由激活前复核 |
| 已删除记录在默认同步中彻底消失 | 客户端只向 Registry 增量请求活跃记录 | 采用增量式或感知删除事件的调和机制，并在本地归档历史 |
| 回滚的目标版本根本从未通过准入审查 | 路由切换与准入审批状态彼此脱节 | 坚决拒绝回滚，强制对该目标走全新的准入流程 |
| 攻击者重写全部账本后本地依然校验通过 | 哈希链缺乏外部信任根的约束锚定 | 定期将带签名的账本头发布到独立的外部信任域 |
| 留存的凭据中泄露了 Bearer Token 或参数 | 日志和证据记录盲目复制了完整请求 | 在采集入口处执行脱敏，仅持久化留存最小必要凭据 |

## 运维守则

Le processus de publication répond: " Est-ce que cette personne a le droit de publier ce nom ? " Le processus de publication répond: " Est-ce que nous sommes sûrs d'exécuter ce travail spécifique et de le faire connaître à un grand modèle ? " Les deux décisions seront strictement séparées, les empreintes digitales seront fixées à chaque point de connexion, et le retour du roulement deviendra une opération d'ingénierie réalisée sur la base de preuves vérifiables, et non une tentative de chance de mémoire humaine.

## 延伸阅读

- [官方 Registry server.json 规范要求](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/official-registry-requirements.md)
- [官方 Registry OpenAPI 接口定义](https://registry.modelcontextprotocol.io/openapi.yaml)
- [MCP 2026-07-28 服务端发现规范](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
