# 综合项目 16  GitHub Emissão-to-PR Agente Autônomo

> AWS Remote SWE Agents、Cursor Background Agents、OpenAI Codex cloud 和 Google Jules todos entregaram o mesmo 2026  Product Form: Give issue 打 label, get a PR── em uma sandbox de nuvem, operando como agente de verificação 通過,并發布有合理的、可供审查的 PR── dificuldade em criar um ambiente de auto-reprodução de repo── prevenir vazamento de credenciais、 forçar execução por orçamento de repo, bem como garantir que o agente 不能强迫推── esta pedra angular irá construir versão auto-hosted , e em 和 和 custo pass rate 上与托管的替代品对比──

**Type:** Capstone
**Languages:** Python (agent), TypeScript (GitHub App), YAML (Actions)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 17 (infrastructure)
**Phases exercised:**P11 · P13 · P14 · P15 · P17
**Time:** 30 小时

## 问题
Async cloud coding agent é um produto independente diferente dos agentes de codificação interativa (capstone 01) .`@agent fix this`,worker 会在云沙箱中启动、克隆 repo、运行测试、编辑文件、验证,并打开一个PR──没有互动循环,也没有终端──AWS Remote SWE Agents、Cursor Background Agents、OpenAI Codex cloud、Google Jules和 Factory Droids 都朝着这个形态收收──

工程挑战很具体:environment reproduction(agent 必须在没有缓存的 dev image的情况下从零 build repo) flaky tests(必须重新运行或隔离) 信用范围处理(必须重新运行或隔离) 具有最小的细粒的权限的 GitHub App) 按 repo 按天执行预算,以及无力推政策──这个顶石会衡通过率、成本和安全,并与托管的替代品对比──

## 概念
触发器是 GitHub webhook ([[etiqueta de problema]] ou comentário de relações públicas]])  dispatcher irá trabalhar em equipe para ECS Fargate ou Lambda。worker irá repo 拉入 Daytona ou E2B sandbox,并使用从 repo 推断出的通用 Dockerfile ([[linguagem]] 框架]]  agent 运行一个面向Claude Opus 4.7 或 GPT-5.4-Codex的迷你自治代理或SWE-agent v2 loop。它会代执行:read code、propose fix、apply patch、run tests。

A verificação é um passo de abertura. PR 打开前, CI completo 必须在沙盒中通过.`needs-review` agente 会把 rationale 作为 PR description 发布,并添加一个评论员可 ping 以进行后续的 `@agent`- Não, não.

Segurança através de duas superfícies diferentes do GitHub  realizar limitação: App  fornecer um token de instalação de curto prazo, disponível `workflows: read`Com efeito, o sistema de informação e comunicação social é um dos principais meios de comunicação social.`main`和 proibido forçamento-push, e o aplicativo 永远不会被加入绕行列表──对 `.github/workflows`O acesso somente para leitura com padrão de escala não é primitivo no GitHub App, portanto, a lista de edições de arquivos do agente deve ser executada no trabalhador.

## Arquitetura
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
- Trigger: 具備微粒的代币的 GitHub App; através de Lambda ou Fly.io de webhook receptor
- Trabalhador: tarefa ECS Fargate (((or GitHub Actions auto-hosted runner)
- Sandbox: para cada tarefa um contêiner de dev Daytona ou sandbox E2B
- Loop de Agente: baseado em Claude Opus 4.7 / GPT-5.4-Codex de mini-swe-agente base ou SWE-agente v2
- Retorno: mapa de repo de árvore + ripgrep
- Verificação: IC completa na caixa de areia + porta delta de cobertura
- Observabilidade: Langfuse,带 per-PR trace archive,并从 PR body 链接
- Orçamento: limite diário de dólar por repo; cada repo, cada dia, número máximo de relações públicas


```figure
cf-issue-to-pr
```

## Construí-lo
1. **GitHub App.**Tokens de instalação de grãos finas:problemas de leitura+escritura、pull_requests de escrita、contentes de leitura+escritura、flow de trabalho de leitura。 proteção de ramo( única superfície capaz de fazer isso)`main`和禁止强迫推;app 不在绕行列中──practicante para a proposta de diferença 执行禁止写入 `.github/workflows`A lista de permissões de verificação do conteúdo, pois as permissões do GitHub App não são escalonadas pelo caminho.

2. **Webhook receiver.**Função Lambda 接收 issue label / PR comment webhooks──按标签 `@agent fix this`Entrar na equipa para o SQS.

3. **Dispatcher.**A partir de SQS 弹出 tarefas──强制执行 per-repo per-day budget── utilizando o corpo de URLs, emissão de repo 和一个全新的 Daytona sandbox 启动 ECS Fargate task──

4. **Environment inference.**检测 language(Python、Node、Go、Rust) e gerenciador de pacotes(uv、pnpm、go mod、cargo)

5. **Agent loop.**Utilize Claude Opus 4.7's mini-swe-agent ou SWE-agent v2── Ferramentas: ripgrep、tree-sitter repo-map、read_file、edit_file、run_tests、git──硬限制: $ 20 custo、30 min mural-reloj、30 agentes giras──

6. **Verification.**Loop 结束后,在沙盒中运行完整测试套件──通过 jacoco / coverage.py 计算覆盖 delta──如果CI红:停止,不打开PR──如果覆盖下降超过2%:打开带 `needs-review`Redação de Redação de Redação

7. **PR posting.**Push agent branche── através da API GitHub 打开 PR,包含:title、rational、diff summary、trace URL、cost、turns──

8. **Credential hygiene.**Trabalhador Utilizao de breve prazo GitHub App instalação token 运行──Logs 在归档前会 scrub secrets──

9. **Eval.**30 个不同难度的种种内问题――衡量通过率、PR quality(diff size、style、coverage)、cost、latency──在同一问题上与Cursor Background Agents 和 AWS Remote SWE Agents对比──

## Use-o
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

## Entrega-o
`outputs/skill-issue-to-pr.md`É entregue. Um funcionário de nuvem GitHub App + async, pode ser marcado por problemas.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | 30 个 issues 上的 pass rate | End-to-end success（CI green + coverage OK） |
| 20 | PR quality | Diff size、coverage delta、style conformance |
| 20 | 每个已解决 issue 的 cost 和 latency | 每个 PR 的 $ 和 wall-clock |
| 20 | Safety | Scoped token、per-repo budget、no force-push、credential hygiene |
| 15 | Operator UX | Rationale comments、retry affordance、@-mention follow-up |
| **100** | | |

## 练习
1. 添加一个fix flaky test 模式:label `@agent stabilize-flake TestX`O teste foi executado 50 vezes e foi proposto um mínimo de modificações que pudessem ser fixadas.

2. Em três questões compartilhadas, o custo de comparação com os agentes de fundo de cursor é de três.

3.  Realizar um painel de orçamento: custo por reposição por dia, custo por utilizador,  alarme de anomalia.

4. Construir um modelo de execução seca: não funcionar CI, abrir o projeto de relações públicas, para que os revisores possam ter um plano de inspecção de baixo custo.

5. 添加保留政策:超過 7 天未合併的PR分支会自动删除──

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
- [AWS Remote SWE Agents](https://github.com/aws-samples/remote-swe-agents) 标准 referência de agente de nuvem asynchrono
- [SWE-agent](https://github.com/SWE-agent/SWE-agent) Referência CLI
- [Cursor Background Agents](https://docs.cursor.com/background-agent) alternativa comercial
- [OpenAI Codex (cloud)](https://openai.com/codex) concorrente hospedado
- [Google Jules](https://jules.google) Google ' s versão hospedada
- [Factory Droids](https://www.factory.ai) Referência comercial alternativa
- [GitHub App documentation](https://docs.github.com/en/apps) Identidade de bot de alcance
- [Daytona cloud sandboxes](https://daytona.io) caixa de areia de referência
