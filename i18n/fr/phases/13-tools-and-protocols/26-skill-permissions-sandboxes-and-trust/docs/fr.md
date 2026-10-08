# Les compétences 权限、沙箱与信任

> Une compétence peut proposer une proposition d'opération. Mais seul le propriétaire peut l'autoriser, seul le territoire peut le limiter, et seul le mécanisme de vérification peut déterminer si elle fonctionne réellement.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 25 (Skill Invocation and Routing), Phase 13 · 15 (MCP Security I)
**Time:** ~120 minutes

## Objectif de l'apprentissage

- Expliquez pourquoi activer une compétence ne donne ni le droit d'outil ni la création de sacs.
- Pour les personnes âgées, les conditions de travail sont les suivantes:
- La mise en œuvre de la modélisation des menaces est une mesure de mise en œuvre de la modélisation des menaces pour un ensemble de compétences, de ses ressources, de ses scénarios et du contenu qu'elle traite.
- En effet, les données de l'entreprise sont les données de l'entreprise.
- 根据任务的风险等级选择进程 (processus) 容器 (contenu) 容器 (contenu) 容器 (contenu) 容器 (contenu) 容器 (contenu) 容器 (contenu) 容器 (contenu) 容器 (contenu) 容器 (contenu) 容器 (contenu) 容器 (contenu) 容器 (contenu) 容器 (contenu) 容器 (contenu) 容器 (contenu) 容器 (contenu) 容器 (contenu) 容器) 容器 (contenu) 容器) 边界 (contenu) 容器) 容器 (contenu) 容器) 容器 (contenu) 容器) 容器)

## 开始之前

Le cours est basé sur deux étapes.[第 25 课](../../25-skill-invocation-and-routing/)Il n'est pas terminé[第 15 课](../../15-mcp-security-tool-poisoning/)Si la 15e classe n'est pas terminée, veuillez continuer à compléter; le site web routeur conservera la 26e classe visible, mais le marquage ne répond pas à la première dépendance.

##  problématique

Une compétence de révision de code contient une instruction comme:  test suite de projet de mise en œuvre et de vérification de défaillance  Cette phrase est inoffensive dans un environnement, alors que dans un autre environnement elle est dangereuse

Dans un conteneur de stockage abandonné sans licence, le test de fonctionnement est limité. Cependant, sur l'ordinateur portable personnel du développeur, les mêmes commandes peuvent être exécutées par des constructeurs contrôlés par le code stockage, afin d'accéder aux agents SSH, aux licences, aux données du navigateur et à l'ensemble du système de fichiers.

 Le contenu se trouve dans le chemin de l'entrée légale de la compétence, mais il n'est pas autorisé à le faire.

Le modèle de réflexion n'est pas un modèle simple de compétence de confiance par rapport à la compétence de confiance non reconnue.

## 概念

### Les compétences sont sur le dessus, et non sur la sécurité.

activation est généralement simplement une instruction qui est placée dans le texte ci-dessus visible du modèle.

-  exposer les documents;
-  accorder des droits d'entrée;
- 创建操作系统进程;
- isolement du processus;
- 开启网络访问权限;
- Inscription à la confidentialité;
-  ratifier les conséquences importantes;
- 证明执行结果是正确的──

```figure
skill-authority-chain
```

Chaque élément est indépendant, il est configurable.

### 5 étages de contrôle

| 层级 (Layer) | 核心问题 | 示例控制手段 | 它无法证明什么 |
|---|---|---|---|
| 能力暴露 (Capability exposure) | Agent 是否能够请求该操作？ | 不注册 shell 工具 | 已注册的工具是绝对安全的 |
| 权限策略 (Permission policy) | 当前主体是否被允许操作该目标？ | 写入被限制在单一工作区内 | 操作本身是正确且合乎预期的 |
| 审批卡点 (Approval gate) | 授权人员是否接受了该操作后果？ | 确认发布或删除操作 | 实际执行过程受到了严格隔离 |
| 沙箱 (Sandbox) | 执行代码能够触及哪些资源？ | 只读基础镜像、限定工作区、无网络 | 所请求的修改符合业务预期 |
| 验证卡点 (Verification gate) | 执行结果是否满足契约要求？ | 测试套件、diff 范围、产物哈希 | 未来的操作已获得授权 |

运行时的 `allowed-tools`字段 n'affecte généralement que la capacité d'exposer ou de limiter les instructions. Il n'est pas une isolation de niveau du système d'exploitation. Dans le flux de travail de confiance, il peut être exempt de répétition des instructions d'approbation, mais tant que les outils et les coffres ne sont pas eux-mêmes obligatoirement en mesure d'exécuter des limites, il est impossible d'empêcher les outils autorisés de lire des chemins hors de leur attente ou d'exécuter des codes non sécurisés.

### La mise en œuvre de menaces contre l'ensemble du composant

Il y a principalement quatre catégories d'attaquants ou de sources de défaillance:

#### 1. 恶意组件包 (Un paquet malveillant)

Il peut être utilisé pour la rédaction de commandes de malintention cachées dans la référence ou dans le logique de malintention de l'écriture.

#### 2. Une dépendance compromise

La compétence elle-même semble raisonnable, mais le contenu actuel du scénario installé ou importé par des tiers dépend de son contenu actuel, qui n'est pas conforme à la version d'origine examinée par l'auteur.

#### 3. Contenu des tâches non confiées

Les résultats de retour des données contenant des instructions d'injection de commentaires en contradiction avec les objectifs de l'utilisateur sont bons, mais les entrées traitées sont résistantes.

#### 4. Une erreur ordinaire

路径计算越界逃逸出工作区、通配符(glob) a adapté trop de fichiers、重试操作 conduit à écrire à nouveau、 nettoyer les étapes erronées de suppression du répertoire de génération de erreurs。 en ce qui concerne les effets, l'intention est bonne intention ou mauvaise intention并没有区别──

```figure
skill-trust-surface
```

Pour chaque personnage d'influence, dessinez cette image.

### 组件包信任始于激活之前

Le processus d'installation doit être examiné de manière exhaustive avant de copier le répertoire.

Les exigences de contrôle minimales:

1. 要求在预期位置恰好存在一个包入口点──
2. 校验包名和目标路径──
3. 绝对对归档路径和 `..`Tout le monde.
4. Il est interdit de définir les lignes directrices de la déclaration.
5.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
6. 限文件数、单文件大小和压总大小──
7.  Les droits de mise en œuvre sont réservés uniquement pour les scripts qui ont été examinés et dont ils sont réellement nécessaires.
8. Dans le manifeste de mise en place,
9. Dans le cadre de la mise en place de la politique de sécurité, le gouvernement a décidé de mettre en place une politique de sécurité sociale.
10. En ce qui concerne les compétences de la personne à qui on confie des compétences, il faut examiner les différences.

哈希只能证明字节与表单一致,不能证明字节是安全的──签名只能证明是谁对声明做背书,不能证明该主体的代码是正确的──

### content avec des niveaux de pouvoir différents

Même si les instructions et les données sont purement textuelles, elles doivent être strictement séparées.

| 内容类型 | 典型权威等级 | 处理方式 |
|---|---|---|
| 当前用户请求 | 在产品策略内具有最高权限 | 定义活跃目标 |
| 代码仓库指令 (AGENTS.md 等) | 在仓库范围内具有高权限 | 约束本地工作 |
| 已激活的 Skill 正文 | 流程级权限，低于当前任务与硬策略 | 指导具体工作流 |
| Skill 参考文档 (Reference) | 支撑性流程或事实依据 | 仅为其声明的分支加载 |
| Issue、网页、邮件、文档 | 不受信任的数据 (Untrusted data) | 提取证据；不赋予任何操作权限 |
| 工具返回结果 | 来自指定来源的观察记录 (Observation) | 校验数据形状与信任假设 |

Les niveaux de commandes peuvent aider les modèles à distinguer ces niveaux, mais cela ne signifie pas que les niveaux de capacité et de pouvoir doivent être protégés.

### L'opération sera examinée en tant que requête structurée

Ne pas envoyer directement le modèle généré par une seule coquille 字符串至操作系统──

```json
{
  "actor": "skill:release-readiness",
  "capability": "process.run",
  "argv": ["python3", "scripts/inspect_release.py", "--format", "json"],
  "cwd": "/workspace/project",
  "paths": ["scripts/inspect_release.py"],
  "network": [],
  "credentials": [],
  "side_effect": "read_only",
  "reason": "collect release evidence"
}
```

Cette demande peut être évaluée indépendamment avant l'exécution, mais elle fournit également une explication significative de l'interface utilisateur approuvée.

### ordre stratégique doit être structurée

`shell=False`C'est un paramètre préférentiel utile, mais ce n'est pas une stratégie complète.

- Les procédures de mise en œuvre des documents et de leur résolution sont définitives.
- 参数数组(argument vecteur) plutôt que de faire un complément de commandes
- 能够执行任意代码的解释器参数标志;
- 工作目录(cwd);
- 类路径参数及响应文件;
- 继承的环境变量;
- 超时、输出量、进程数、内存和文件大小限制;
- 预期 effets secondaires;
- Les actions en réseau des programmes et des projets peuvent être exécutées.

允许 `python3`Il est également possible de mettre en œuvre des codes Python, sauf si la limite spécifique est faite.

Les unités plus sûres sont généralement des outils de narcissomisation de la fonction:

```json
{
  "name": "inspect_release",
  "input": {
    "candidate": "v2.4.0",
    "include_untracked": false
  },
  "effects": "read-only workspace analysis"
}
```

Les types de saisie ont diminué, tandis que la réalisation de la base peut encore fonctionner dans un environnement isolé.

### Route stratégies doivent résoudre des objectifs réels

对于请求路径 $p$Et le répertoire des racines$r$- Le numéro de la liste:

```text
resolved_p = realpath(join(r, p))
resolved_r = realpath(r)
allow only when resolved_p is inside resolved_r
```

En même temps, il faut également vérifier le type d'opération. Les droits de lecture ne sont pas égaux aux droits d'écriture.`open`调用中跟随符号链接可能导致检查时与使用时(TOCTOU) conditions de concurrence, donc les outils de haute sécurité doivent être utilisés par le système d'exploitation.

Cette expérience de cours a démontré la normalisation et la limitation des méthodes, ne prétend pas résoudre toutes les compétitions de systèmes de documents.

### Le traitement des certificats de confidentialité fait partie du design des capacités

Ne pas transférer l'ensemble du processus de l'environnement à un processus normal, puis prier pour la compétence.

Utilisation stricte de liste blanche:

```text
PATH=/controlled/bin
LANG=C.UTF-8
WORKSPACE=/workspace/project
```

 Le permis est inséré dans un outil de petite taille qui a vraiment besoin de lui, valide seulement pendant la mise en service, et uniquement pour un objectif spécifié.

模式匹配 (conformément à la règle), on peut saisir un format de certificat évident, mais on ne peut pas prouver que tout texte est non sensible.

### 网络是独立权限维度

文件系统隔离不能阻止通过HTTP、DNS、包注册表、Git 远程仓库或遥测数据发生的数据外发(exfiltration) ⋅ Il faut clairement choisir une stratégie réseau:

| 网络策略 | 适用场景 | 主要权衡 |
|---|---|---|
| 无网络 (None) | 本地分析与测试 | 无法访问依赖包和远程 API |
| HTTPS Origin 白名单 | 访问文档中记录的单一 API 或注册表 | 重定向与 DNS 仍需严格管控 |
| 代理中介 (Proxy-mediated) | 具备策略审计的出网流量 | 基础设施更复杂，可能暴露元数据 |
| 无限制 (Unrestricted) | 罕见的抛弃型研究环境 | 最大的数据泄露和供应链攻击面 |

Un HTTPS Origin 包含协议方案 (scheme) 、主机名 (host) 及有效端口 (effectif port) ⋅`https://api.example.test`et `https://api.example.test:443`代表同一个规范化起源── et `https://api.example.test:8443`Il faut un seul et unique code d'origine. Il peut y avoir des voies différentes à l'intérieur de l'origine, mais une reorientation doit être effectuée avant de refaire une nouvelle expérience.

Skill 需要连网不是一个合格策略──必须明确说明允许访问的来源、允许离开的数据、重定向规则以及预期响应──

### L'approbation doit être liée aux résultats de l'opération

Pour des opérations qui ne peuvent être autorisées à l'avance, il faut utiliser une approbation artificielle.

```figure
skill-approval-decision
```

L'approbation doit montrer des objectifs et des résultats concrets.`publish_release`工具将版本 2.4.0 发布到阶段 注册表? 才是可决策的──

Ne pas considérer les résultats de plusieurs opérations comme une approbation éblouissante.

### 选择恰当的隔离边界

| 隔离边界 | 隔离的内容 | 本身无法隔离的内容 | 典型用途 |
|---|---|---|---|
| 进程内校验 (In-process validation) | 应用程序数据结构 | 进程内部的 bugs 或任意代码 | 纯解析与策略检查 |
| 受限子进程 (Restricted subprocess) | 环境变量、工作目录、超时、输出 | 未经 OS 控制的内核、宿主文件系统、网络 | 经过审查的本地工具 |
| 容器 (Container) | 文件系统和进程命名空间，可选网络 | 共享内核；宿主挂载与 daemon 访问权限 | 代码仓库构建与测试 |
| Linux 用户命名空间 (User namespace) | 用户与组标识符以及命名空间内的 capabilities | 未经单独控制的挂载、进程、系统调用和网络 | 组合式 Linux 沙箱中的一层 |
| 复合囚禁执行器 (Composed jailed runner) | 选定的用户、挂载、PID、网络、系统调用和资源限制 | 每一个内核漏洞、不安全挂载、凭证泄露或策略错误 | 较强的本地多租户任务 |
| 轻量微虚拟机 (MicroVM) | 独立的客户机内核与虚拟硬件边界 | 配置错误的挂载、凭证或出网规则 | 不信任的代码与高影响负载 |

La qualité de l'isolement dépend de la configuration. Un conteneur de dosage et de logement est installé sur l'hôte.

Le contrôle de l'environnement de production peut inclure: seulement lire la base de l'image, limiter la portée des volumes à écrire, non-root utilisateur, abandonner les capacités Linux, séquence, cgroups, processus et restrictions de fichiers, stratégie réseau, état à abandonner, ainsi que strictement interdire l'insertion dans la production de machines.

### 脚本 devrait rester simple et simple

Le plus sûr des compétences est celui de détermination, de fonctionnalité et de non interaction, et peut être testé indépendamment:

- 接收显式参数;
- En cas de survenue de effets secondaires, l'essai doit être terminé;
- Utilisation structurée de l'émission de données;
- 仅写入声明的输出目录;
- à l'utilisation de l'atome pour le remplacement de documents non disposés dans l'état intermédiaire;
- Pour des changements majeurs de soutien à la conduite sèche (试运行);
- Les clés de l'indépendance;
- limitation du temps de transport et de la quantité de production;
- élimination temporaire du statut de réussite et de défaite;
- Pour les méthodes de refus et de défaillance de l'exécution, les codes de retour et de sortie sont différents.

Si le script est en cours de fonctionnement, utilisez une coquille de caractères en utilisant des coquilles ou en dépendant des certificats cachés de l'environnement environnant, veuillez le considérer comme nécessitant une isolation stricte et un risque clair de censure.

## - Je le construis.

`code/main.py`Il ne fonctionne jamais vraiment sur aucun ordre. Ce design permet à la classe de se concentrer sur les limites de la décision précédant l'exécution.

实验 fournis interfaces comprennent:

- `Verdict`Pour permettre, demander, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter, rejeter ou rejeter, rejeter, rejeter, rejeter, ou rejeter, ou rejeter, ou rejeter,
- `SandboxPolicy`: pour les zones de travail, les types d'opération, les fichiers exécutables, le réseau, la confidentialité, les règles d'approbation et de effets secondaires;
- `ActionRequest`: pour les propositions structurelles;
- `ReviewDecision`: pour l'export de conclusions, raisons et approbations nécessaires;
- `normalize_https_origin(...)`: pour la normalisation des ports IDNA、IP 字面量及有效端口;
- `normalize_workspace_path(...)`: pour le contrôle des limites de cheminée utilisées après la résolution;
- `inspect_command(...)`: pour l'examen des documents et des paramètres exécutables;
- `contains_secret(...)`: fournir des signaux de mode de sécurisation;
- `review_action(policy, request)`: mettre en œuvre des décisions globales.

运行模拟策略决策:

```bash
cd "$(git rev-parse --show-toplevel)"
cd phases/13-tools-and-protocols/26-skill-permissions-sandboxes-and-trust
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Le bloc de commande doit cloner son environnement et peut être défini à partir du répertoire de travail de l'intérieur du clone.

La présentation évalue une opération de lecture, une opération d'écriture non approuvée et une opération d'écriture approuvée, une route échappée, un ordre destructeur, une demande de réseau non reconnu et une tentative de modification de la stratégie. Les kits de test augmentent la charge secrète, la normalisation des ports par défaut, l'isolement des ports non par défaut et l'origine des erreurs de format. Les deux routes sont utilisées pour imprimer ou prendre des décisions en cas de non-initiation de tout processus ou d'ouverture de toute connexion réseau.

### 运行隔离演练

La révision stratégique et l'isolement environnemental sont deux moyens de contrôle différents.`code/sandbox/`Le dossier optionnel suivant a été testé dans un conteneur OCI pour que vous puissiez observer de vos yeux une frontière de sécurité imposée, sans vous arrêter sur le papier pour lire.

```bash
cd "$(git rev-parse --show-toplevel)"
cd phases/13-tools-and-protocols/26-skill-permissions-sandboxes-and-trust
docker build -f code/sandbox/Containerfile -t aiefs-skill-sandbox code/sandbox
docker run --rm --network none --read-only --cap-drop ALL \
  --security-opt no-new-privileges --pids-limit 64 --memory 128m --cpus 0.5 \
  --tmpfs /tmp:rw,noexec,nosuid,size=16m \
  --mount type=bind,src="${PWD}/code/sandbox/input",dst=/input,readonly \
  --env DEMO_VALUE=bounded aiefs-skill-sandbox
```

Les résultats de la recherche JSON doivent indiquer que l'entrée de la déclaration est lisible,`/tmp`                                                                                                                                                                                                                                                              

Dans l'exécuteur de production, l'approbation génère un dossier d'opération de portée de la production. L'exécuteur ne peut pas immédiatement réinitialiser l'objet de l'exécution avant le début de l'exécution.

### Pourquoi ?`ask`Non , pas du tout .`allow`

 Les stratégies de révision ont trois résultats:

- `allow`: les opérations sont conformes aux stratégies préalablement autorisées;
- `ask`: les résultats de l'exposition doivent être présentés par les autorités compétentes;
- `deny`: les opérations contrevenant à l'approbation du flux de travail ne peuvent pas non plus franchir les limites de dureté.

Il va`ask`Avec `deny`La confusion entre les utilisateurs entraîne une tendance à contourner les stratégies.`ask`Avec `allow`La conférence est organisée par le Conseil des ministres.

## Utilisez-le

Avant d'activer une compétence tierce ou nouvelle, il faut examiner:

```text
[ ] 完整的组件包目录树与入口元数据
[ ] 每个可执行脚本及声明的依赖项
[ ] 每个引用的命令与外部 HTTPS origin（包括非默认端口）
[ ] 所需的读取和写入根目录
[ ] 所需凭证及其作用域
[ ] 用户与模型调用策略
[ ] 审批卡点及所展示的操作后果
[ ] 实际执行器的隔离手段
[ ] 输出验证与回滚预案
[ ] 安装溯源记录及升级差异对比
```

Si vous ne pouvez pas répondre clairement à l'une d'elles, réduisez vos capacités jusqu'à ce que vous puissiez répondre à la fin.

## Je le livre.

Le cours est terminé.`skill-safety-reviewer`组件包── Il lit une requête d'opération structurée et une stratégie de boîte à outils explicite, puis retourne à la réglementation de la permission, du refus ou de l'interception de la requête.

Son scénario d'accompagnement est uniquement responsable de la décision. Il contient des restrictions de zone de travail de l'école, des formes d'ordre, des normes de port valides HTTPS d'origine, des charges secrètes, des exigences d'approbation et des autorisations négligées. Il ne remplit jamais les ordres, ouvre une URL ou modifie l'objet visé.

## 练习

1. 添加独立读取、创建、覆盖和删除路径权限── dans chaque opération, tester le même chemin──
2. 添加一个来源 策略: permettre 443 端口上 `https://registry.example.test`, uniquement autorisé à 8443 port, et refusé de se rediriger vers toute origine non déclarée.
3.  la décision est de l'approuver, de l'abandon ou de l'isolement strict 
4. Pour`ActionRequest`扩展等键(idempotence key),并要求所有外部写入必须携带该键──
5. Pour la première étape, écrivez une note d'approbation, pour la seconde, écrivez une note de production, pour assurer la réalisation de l'objectif, du produit et du roulement.
6. Pour une lecture de la page et de l'écriture de Pull Request 评论                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

## 关键术语

| 术语 | 常见说法 | 实际工程含义 |
|---|---|---|
| 权限 (Permission) | “工具可以运行” | 策略显式授权特定主体、操作类型、目标对象和有效时长 |
| 审批卡点 (Approval gate) | “询问用户” | 在执行重大后果操作之前必须由授权主体做出的决策 |
| 沙箱 (Sandbox) | “安全模式” | 限制可访问文件、进程、网络、凭证和系统资源的隔离执行环境 |
| 能力暴露 (Capability exposure) | “工具列表” | 在授权发生之前，模型被允许请求的操作集合 |
| 信任边界 (Trust boundary) | “安全边缘” | 数据或权限在不同信任假设之间跨越的接口 |
| 路径囚禁 (Path jail) | “留在工作区内” | 基于解析后的实际物理目标而非前缀字符串强制执行的文件系统限制 |
| 出网策略 (Egress policy) | “访问互联网” | 针对执行程序允许访问的目的地和允许发送的数据所制定的规则 |

## 延伸阅读

- [Agent Skills: using scripts](https://agentskills.io/skill-creation/using-scripts): comprendre les interfaces de script, le traitement d'erreurs et la sortie structurée
- [客户端实现指南](https://agentskills.io/client-implementation/adding-skills-support)• la connaissance de la confiance, de l'activation et de la consultation des ressources
- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills): Comprendre la différence entre les stratégies de compétences et les mécanismes de contrôle du Codex 沙箱 actuels.
- [NIST SP 800-190](https://csrc.nist.gov/pubs/sp/800/190/final): comprendre les moyens de sécurité et de contrôle du contenant.
- [SLSA specification](https://slsa.dev/spec/v1.2/): connaître la traçabilité et l'intégrité de la chaîne d'approvisionnement en logiciels.
