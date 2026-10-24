# 综合项目 16  GitHub Emission-to-PR özerk ajanı

> AWS Uzak SWE Ajanları、Kursor Arkaplan Ajanları、OpenAI Codex bulutları ve Google Julesları aynı 2026  ürün biçimi teslim ettiler: bir sorun 打标签, get a PR── cloud sandbox içinde çalışan bir ajan, doğrulama testleri 通過,并發布有合理的、可供审查的 PR── zorluk otomatik olarak yeniden mevcut repo'nun oluşturma ortamında bulunmaktadır、 kredi sızanmasını önlemek、 repo bütçelerini zorla yürütmek, yanı sıra ajanın 強制推力できない── bu baş taşı, kendi kendine barındırılmış  sürümün oluşturulmasını sağlar, ve 和 kostu geçiş oranı üstü hosted alternatiflerle karşılaştırmak.

**Type:** Capstone
**Languages:** Python (agent), TypeScript (GitHub App), YAML (Actions)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 17 (infrastructure)
**Phases exercised:**P11 · P13 · P14 · P15 · P17
**Time:** 30 小时

## 问题
async bulut kodlama ajanı, interaktif kodlama ajanlarından (capstone 01) farklı bir ürün sınıfıdır. UX bir GitHub etiketidir.`@agent fix this`,workers will start in cloud sandbox、clone repo、running tests、edited files、验证,并打开一个PR──无交互循环,也没有终端──AWS Uzak SWE Ajanları、Cursor Background Ajanları、OpenAI Codex cloud、Google Jules和 Factory Droids hepsi bu yönde bir şekilde alıyor──

工程挑战很具体:环境复制(agent 必须在没有缓存的开发图像的情况下从零 build repo) flaky tests(必须重新运行或隔离) 信用范围测试( GitHub App'ın en az ince tobutlu izinleri vardır)  根据 repo 根据天执行预算,以及无力推政策──这个顶石会衡量通过率、成本和安全,并与托管的替代品对比──

## 概念
触发器是 GitHub webhook ([[Söz etiket veya PR yorum]]) ￼ dispatcher, ECS Fargate veya Lambda'ya işçi olarak 拉入 Daytona veya E2B sandbox'a repo yapacaktır, ￼repo'dan 推断出的通用 Dockerfile ([[dilliy ]] çerçeve) ￼agent 运行一个面向Claude Opus 4.7 veya GPT-5.4-Codex'in mini-swe-agent veya SWE-agent v2 loop──它会代执行:read code、propose fix、apply patch、run tests──

Verifikasyon kapı aşamasıdır. PR 打开前, tam CI 必须在沙箱中通过──计算覆盖德拉; eğer 值为负, PR 仍将打开,但将被标记为 `needs-review` ajan 会把 rationale 作为 PR description 发布,并添加一个评论员可 ping 以进行后续的 `@agent`İpuçla

Güvenlik  İki farklı GitHub yüzeyinden  sınırlı: Uygulama  kısa süreli bir kurulum jetonu sunmak, `workflows: read`Yapılan uygulamaların kullanımına yönelik uygulamaların kullanımına yönelik uygulamaların kullanımına yönelik uygulamaların kullanımına yönelik uygulamaların kullanımına yönelik uygulamaların kullanımına yönelik uygulamaların kullanımına yönelik uygulamaların kullanımına yönelik uygulamaların kullanımına yönelik uygulamaların kullanımına yönelik uygulamaların kullanımına yönelik uygulamaların kullanımına yönelik uygulamaların kullanımına yönelik uygulamaların kullanımına yönelik uygulamaların kullanımına yönelik uygulamaların kullanımına yönelik uygulamaların kullanımına yönelik uygulamaların kullanılması.`main`和禁止强迫推,且app 永远不会被加入绕行列表──对 `.github/workflows`GitHub uygulaması için sadece okuma yoluyla erişimi gerçekçi değildir, bu nedenle ajanın dosya düzenlemeleri izin listesi 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須執行── 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須 必須

## Yapılandırma
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
- Trigger: 具備微粒的代币的 GitHub App; Lambda veya Fly.io'nun webhook alıcısı üzerinden
- İşçi: ECS Fargate görevi ((or GitHub Actions kendi kendine barındırılan koşucu)
- Kum kutusu: Her görev bir Daytona dev konteyneri veya E2B kum kutusu
- Agent döngüsü: 基于Claude Opus 4.7 / GPT-5.4-Codex'in mini-swe-agent baz hatları veya SWE-agent v2
- Arama: ağaç bekçisi repo haritası + ripgrep
- Verifikasyon: Tam bilgi bilgisası kum kutusunda + kapsam delta kapısı
- Gözlem: Langfuse,带 per-PR iz arşiv,并从 PR organ 链接
- Bütçe: Rapor başına günlük dolar tavanı; Rapor başına günlük en fazla PR sayısı


```figure
cf-issue-to-pr
```

## Yapın onu.
1. **GitHub App.**İyi tohumlu kurulum simgesi: sorunlar ok + yaz ✓ çek ✓ istekler ✓ yaz ✓ içerikler ✓ ok + yaz ✓ iş akışları ✓ ok ✓ branch protection ✓ sadece bunu yapabilecek yüzey ✓`main`和禁止强迫推;app 不在绕行列中──员工对拟议的差异 执行禁止写入 `.github/workflows`Aşağıdaki içeriğin izin listesi kontrolü, çünkü GitHub Uygulama izinleri yol kapsamında değildir.

2. **Webhook receiver.**Lambda işlevi 接收 issue label / PR comment webhooks──按 label `@agent fix this`SQS'e girmek için.

3. **Dispatcher.**SQS'ten 弹出 görevleri──强制执行 per-repo per-day budget──repo URL、issues body 和一个全新的 Daytona sandbox──启动 ECS Fargate görev──

4. **Environment inference.**检测 language(Python、Node、Go、Rust) ve paket yöneticisi(uv、pnpm、go mod、cargo) ・・・Dockerfile yoksa,则动态生成一个。

5. **Agent loop.**Kullanım: ripgrep、tree-sitter repo-map、read_file、edit_file、run_tests、git──硬限制: $ 20 cost、30 min duvar saati、30 ajan dönüşો。

6. **Verification.**Çapı bitince, kum kutu içinde tam test süiti yürütülüyor.`needs-review`Etiketlerin PR'leri

7. **PR posting.**GitHub API'si üzerinden PR açın, içerir: başlık, mantıklı, farklı özet, URL izleme, maliyet, dönüşümler.

8. **Credential hygiene.**Çalışan kısa süreli GitHub Uygulama yükleme simgesi kullanıyor.

9. **Eval.**30 farklı zorlukların oluşturduğu iç sorunlar── geçiş oranını ölçmek, PR kalitesi, farklı boyut, stil, kapsam) ‒ maliyet, gecikme­lik.

## Kullan
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

## - Söyle.
`outputs/skill-issue-to-pr.md`GitHub App + async bulut çalışanı, belirlenebilir sorunlar  sınırlı maliyet ve kapsamlı yetenekler  Available Review PR  olarak dönüştürülebilir 

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | 30 个 issues 上的 pass rate | End-to-end success（CI green + coverage OK） |
| 20 | PR quality | Diff size、coverage delta、style conformance |
| 20 | 每个已解决 issue 的 cost 和 latency | 每个 PR 的 $ 和 wall-clock |
| 20 | Safety | Scoped token、per-repo budget、no force-push、credential hygiene |
| 15 | Operator UX | Rationale comments、retry affordance、@-mention follow-up |
| **100** | | |

## 练习
1. 添加一个fix flaky test模式:label `@agent stabilize-flake TestX`Sandbox'ta 50 kez test yaparak, en az bir değişiklik önerdi.

2. Üç ortak sorunun üstü, Cursor Arka Yöntemli Ajanların maliyetleri ile karşılaştırıldığında hangi araçların hangi yerlerde başarılı olduğunu rapor etmektedir.

3. Bütçe aracını gerçekleştirmek: günlük maliyet  kullanıcı maliyeti  Anomaliye karşı uyarı yayınlamak 

4.  Kuru çalıştırma modeli oluşturmak: CI'yi çalıştırmayın.

5. 添加保留政策: 7'den fazla 未合并的PR şubesi 会自动删除──

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
- [AWS Remote SWE Agents](https://github.com/aws-samples/remote-swe-agents) 标准 async bulut ajanı referansı
- [SWE-agent](https://github.com/SWE-agent/SWE-agent) CLI referansı
- [Cursor Background Agents](https://docs.cursor.com/background-agent) Ticari alternatif
- [OpenAI Codex (cloud)](https://openai.com/codex) Ev sahibi rekabetçi
- [Google Jules](https://jules.google) Google'ın barındırılan versiyonu
- [Factory Droids](https://www.factory.ai) alternatif ticari referans
- [GitHub App documentation](https://docs.github.com/en/apps) Görevi bot kimliği
- [Daytona cloud sandboxes](https://daytona.io) Referans kum kutusu
