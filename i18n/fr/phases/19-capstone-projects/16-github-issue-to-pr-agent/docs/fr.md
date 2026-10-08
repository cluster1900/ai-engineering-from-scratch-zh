# 综合项目 16  GitHub Émission à PR Agent autonome

> AWS Remote SWE Agents、Cursor Background Agents、OpenAI Codex cloud 和 Google Jules ont livré le même modèle de produit 2026: donner un étiquette 打, obtenir un PR── dans une boîte à sable dans le cloud, agent de validation 通过,并发布一个带有合理的、可供审查的 PR── difficulté réside dans l'environnement de construction de repo réactif automatique、 empêcher la fuite de crédits、 exécuter par répo budgets, ainsi que dans la prévention de l'agent 无法 forcer-pousser── cette pierre angulaire va construire une version auto-hébergée, et et et et et et et et et le coût de passage des taux de mise en service de la hauteur avec les alternatives hébergées par rapport à──

**Type:** Capstone
**Languages:** Python (agent), TypeScript (GitHub App), YAML (Actions)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 17 (infrastructure)
**Phases exercised:**P11 · P13 · P14 · P15 · P17
**Time:** 30 小时

##  problématique
L'agent de codage en nuage asynchrone est un produit indépendant de l'agent de codage interactif (capstone 01)`@agent fix this`,worker 会在云沙箱中启动、克隆 repo、运行测试、编辑文件、验证,并打开一个在正文中包含代理理性的PR──没有互动循环,也没有终端──AWS Remote SWE Agents、Cursor Background Agents、OpenAI Codex cloud、Google Jules和 Factory Droids都朝着这个形态收收──

工程挑战很具体:environment reproduction (environnement reproduction) agent 必须在没有缓存的开发图像的情况下从零 build repo) flaky tests (必须重新运行或隔离) 权限范围 (credit scoring) 必须重新运行或隔离) 必须拥有最小的细微的权限的 GitHub App) 按 repo 按天执行预算,以及没有强迫政策──这个顶石会衡量通过率、成本和安全,并与托管的替代方案对比──

## 概念
触发器是 GitHub webhook ([[étiquette de problème ou commentaire de relations publiques]])  le dispatcher travaillera dans l'équipe d'ECS Fargate ou Lambda。 le travailleur va repo 拉入 Daytona ou E2B sandbox,并使用从 repo 推断出的通用 Dockerfile(language、framework)  agent 运行一个面向Claude Opus 4.7 或 GPT-5.4-Codex的迷你自拍代理或SWE-agent v2 loop。

La vérification est une étape de mise en place de la porte. PR 打开前, l'ensemble de la CI 必须在沙盒中通过──计算覆盖率; si elle dépasse值为负, PR 仍将打开,但将被标记为 `needs-review` agent 会把理由 作为 PR description 发布,并添加一个评论员可 ping 以进行后续的 `@agent`Le fil

Sécurité via deux surfaces GitHub différentes  être limité: App  fournir un jeton d'installation à court terme, disposant `workflows: read`L'application est une application de la même nature que la version précédente.`main`和禁止强迫推,且app 永远不会被加入绕行列表──对 `.github/workflows`L'accès à la lecture uniquement par voie de développement n'est pas réellement primitif dans l'application GitHub, donc les modifications de fichiers de l'agent doivent être exécutées par les travailleurs.

## 架构
```
GitHub issue 被标记为 `@agent fix` 或 PR comment
            |
            v
    GitHub App webhook -> AWS Lambda dispatcher
            |
            v
    ECS Fargate task（或 GitHub Actions self-hosted runner）
       - pull repo
       - infer Dockerfile（language、package manager）
       - Daytona / E2B sandbox，带 target runtime
       - clone -> git worktree -> agent branch
            |
            v
    mini-swe-agent / SWE-agent v2 loop
       Claude Opus 4.7 或 GPT-5.4-Codex
       tools: ripgrep, tree-sitter, read/edit, run_tests, git
            |
            v
    verify CI passes in-sandbox + coverage delta check
            |
            v（已验证）
    git push + 通过 GitHub App open PR
       PR body = rationale + diff summary + trace URL
       label: needs-review
            |
            v
    operator review；可以 @-mention agent 进行 follow-ups
```

## 技术
- Trigger:  posséder des jetons à grains fins de l' App GitHub; via Lambda ou Fly.io du récepteur webhook
- Travailleur: tâche ECS Fargate(ou coureur auto-hébergé d'actions GitHub)
- Sandbox: pour chaque tâche un conteneur de déversement de Daytona ou une sandbox E2B
- Boucle d'agent: basée sur le Claude Opus 4.7 / GPT-5.4-Codex de base mini-swe-agent ou SWE-agent v2
- Récupération: carte de référencement de l'arbre-sitter + ripgrep
- Vérification: IC complète dans la boîte à sable + porte delta de couverture
- Observabilité: Langfuse,带 par archives de traces de relations publiques,并从 PR body 链接
- Budget: plafond de dollar par rapport au rapport par jour; chaque rapport par jour


```figure
cf-issue-to-pr
```

## - Je le construis.
1. **GitHub App.**Les problèmes de lecture+écriture、pull_requests écriture、contents lire+écrire、workflows lire。protection de branche(la seule surface à pouvoir le faire)`main`和禁止强迫推;app 不在绕行列中──travail for proposed diff 执行禁止写入 `.github/workflows`Vérifiez la liste d'autorisations des contenus, car les autorisations de l'application GitHub ne sont pas étendues par voie.

2. **Webhook receiver.**Fonction Lambda 接收 étiquette de problème / commentaires de relations publiques webhooks。 selon l'étiquette `@agent fix this`Il est parti à la SQS.

3. **Dispatcher.**De SQS 弹出 tâches──强制执行 per-repo par jour budget──utiliser l'URL de repo、issu body 和一个全新的 Daytona sandbox 启动 ECS Fargate tâche──

4. **Environment inference.**检测 language(Python、Node、Go、Rust) et le gestionnaire de paquets(uv、pnpm、go mod、cargo)

5. **Agent loop.**Utilisation de Claude Opus 4.7 mini-swe-agent ou SWE-agent v2──outils: ripgrep、tree-sitter repo-map、read_file、edit_file、run_tests、git──硬限制: $ 20 coût、30 min mur-horloge、30 tournées d'agent──

6. **Verification.**La couverture de la zone de détection est de 2%, mais la couverture est de 2%.`needs-review`L'étiquette de PR

7. **PR posting.**La branche de l'agent de poussée, via l'API GitHub, ouvre les relations publiques, contenant: titre, rationnel, résumé différent, URL de suivi, coût, chiffres de retour.

8. **Credential hygiene.**Employé utilise à court terme GitHub App installation de jeton 运行。Logs 在归档前会 scrub secrets。

9. **Eval.**30 problèmes internes semés à différents niveaux de difficulté: mesure du taux de réussite, qualité des relations publiques, taille, style, couverture, coût, latence, comparaison avec les agents de base de cursor et les agents de SWE distants d'AWS.

## Utilisez-le
```
# on github.com
  - user 用 `@agent fix this` 标记 issue #842
  - 14 分钟后出现 PR #1903
  - body:
    > 修复了 widget.dedupe() 中由 null comparator entry 导致的 NPE。
    > 添加了 regression test widget_test.go::TestDedupeNullComparator。
    > Coverage delta: +0.12%
    > Turns: 7  Cost: $1.80  Trace: langfuse:...
    > Label: needs-review
```

## Je le livre.
`outputs/skill-issue-to-pr.md`Il est livré à un utilisateur de cloud GitHub App + asynchronous, qui peut être marqué pour des problèmes de communication à coût limité et des informations d'identification à portée de main.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | 30 个 issues 上的 pass rate | End-to-end success（CI green + coverage OK） |
| 20 | PR quality | Diff size、coverage delta、style conformance |
| 20 | 每个已解决 issue 的 cost 和 latency | 每个 PR 的 $ 和 wall-clock |
| 20 | Safety | Scoped token、per-repo budget、no force-push、credential hygiene |
| 15 | Operator UX | Rationale comments、retry affordance、@-mention follow-up |
| **100** | | |

## 练习
1. 添加一个fix test éclairé 模式:label `@agent stabilize-flake TestX`Il a fait 50 fois le test et a proposé un minimum de changement.

2. Dans trois questions partagées, le rapport sur les outils qui ont été utilisés dans les domaines de la compétitivité et de la compétitivité des entreprises.

3. ¢ réaliser un tableau de bord budgétaire: coût par rapport au coût par jour ¢ coût par utilisateur ¢ contre une anomalie ¢ émettre un avertissement ¬

4. Construire un modèle de gestion sèche: non fonctionnant CI, ouvrir le projet de relations publiques, afin que les examinateurs puissent obtenir un plan de contrôle à faible coût.

5. 添加保留政策: plus de 7 filières de relations publiques non fusionnées 会自动删除──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| GitHub App | “Scoped bot identity” | 具备 fine-grained permissions + short-lived installation token 的 App |
| Async cloud agent | “Background agent” | 在 cloud sandbox 中运行的 non-interactive worker，而不是 terminal |
| Environment inference | “Dockerfile synthesis” | 检测 language + package manager，若缺失则生成 Dockerfile |
| Verification | “CI-in-sandbox” | 打开 PR 前在 worker 内运行完整 test suite |
| Coverage delta | “Coverage preservation” | 从 base 到 agent branch 的 test coverage % 变化 |
| Per-repo budget | “Daily ceiling” | 在 dispatcher 强制执行的 dollar 和 PR-count cap |
| Rationale | “PR body explanation” | agent 对变更内容及原因的总结；PR body 中必须包含 |

## 延伸阅读
- [AWS Remote SWE Agents](https://github.com/aws-samples/remote-swe-agents) 标准 référence d'agent de nuage asynchrone
- [SWE-agent](https://github.com/SWE-agent/SWE-agent) référence aux CLI
- [Cursor Background Agents](https://docs.cursor.com/background-agent) alternative commerciale
- [OpenAI Codex (cloud)](https://openai.com/codex) concurrent hébergé
- [Google Jules](https://jules.google) Google est hébergé version
- [Factory Droids](https://www.factory.ai) référence commerciale alternative
- [GitHub App documentation](https://docs.github.com/en/apps) identité du bot à portée de main
- [Daytona cloud sandboxes](https://daytona.io) boîte à sable de référence
