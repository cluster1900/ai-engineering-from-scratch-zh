# Capstone 10  Çoklu Ajan Yazılım Mühendisliği Ekibi

> SWE-AF'ın fabrika yapısı, MetaGPT'nin rol tabanlı teşvikleri, AutoGen 0.4'ün tipize edilmiş aktör grafiği, Devin'in algılama, ve ayrıca Fabrika'nın droidleri, 2026 yılında aynı biçime ulaştı: mimarist sorumlu planlama,N 个编码器在并行工作中工作,评论员负责门,测试员负责验证;;并行工作树将墙-clock 转换为吞吐量共享状态和交付协议 成为失败表面;; Bu baş taşı, bu ekip oluşturma, SWE-bench Pro'nun başarısızlık oranını değerlendirmek,并报告哪些交付将失败以及失败率.

**Type:** Capstone
**Languages:** Python / TypeScript (agents), Shell (worktree scripts)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 16 (multi-agent), Phase 17 (infrastructure)
**Phases exercised:**P11 · P13 · P14 · P15 · P16 · P17
**Time:** 40 小时

## 问题
单代理编码利用在大型任务上会碰到上限──原因不是任何单个代理 很弱,而是200k-Token context 无法同时容纳建筑计划、四个并行代码库片、评论员评论和测试输出──多代理厂会拆分问题:建筑师 负责计划,编码者 在并行工作树中负责实现,评论员 负责门,测试员 负责验证──SWE-AF'ın "fabrik" mimarisı、MetaGPT'lerin rollleri、AutoGen'in tipileşmiş aktör grafikleri, bu üç çerçeve aynı biçimleri tanımlıyor──

Başarısızlık yüzeyi ise el uzatma biçimidir. Arsitekt  planlamış kodlayıcılar  gerçekleştirilmeyen içeriklerdir. Kodlayıcılar  birbirleriyle çatışmalar meydana getirir.

## 概念
Roller tipli ajanlar.**Architect**(Claude Opus 4.7) 读取 issue,编写 plan,并将其分为带有显式接口的子任务――**Coders**(Claude Sonnet 4.7, N 个并行实例, her örnek bir `git worktree`+ Daytona sandbox 中) 独立实现 alt görevler。**Reviewer**(GPT-5.4) 读取合并后的差,并批准或请求具体修改──**Tester**(Gemini 2.5 Pro) 報告合格/fail──

通信通過共享タスクボード(ファイルバックド 或 Redis)完成。各役割 消费它被允许处理的任务。Handofs is A2A-protocol-type messages。协调问题包括: birleşik çatışma çözümü(koordinator role 或自動三向融合)、shared-state synchronization(coders 开始后计划 被结;replans 是独立事件),以及 समीक्षक gatekeeping(reviewer 不能批准它自己做出的更改或它提出的更改)。

Token amplification is hidden cost── her rol sınırı, özet isteklerini ve teslimat bağlamını arttırır── 40 dönüş tek ajan çalışması, dört rolün 160 dönüşü içine dönüşecek── rubrikler, özel olarak değerlendirme token verimliliğini tek ajanın temel çizgisine göre ölçer, çünkü sorun multi-agent değil, multi-agent değil, multi-agent  değil, multi-agent  değil.

## Yapılandırma
```
GitHub issue URL
      |
      v
Architect (Opus 4.7)
   reads issue, produces plan with subtasks + interfaces
      |
      v
Task board (file / Redis)
      |
   +-- subtask 1 ---+-- subtask 2 ---+-- subtask 3 ---+-- subtask 4 ---+
   v                v                v                v                v
Coder A          Coder B          Coder C          Coder D          (4 parallel)
 (Sonnet)         (Sonnet)         (Sonnet)         (Sonnet)
 worktree A       worktree B       worktree C       worktree D
 Daytona          Daytona          Daytona          Daytona
      |                |                |                |
      +--------+-------+-------+--------+
               v
           merge coordinator  (three-way merge + conflict resolution)
               |
               v
           Reviewer (GPT-5.4)
               |
               v
           Tester  (Gemini 2.5 Pro)  -> passes? -> open PR
                                     -> fails?  -> route back to coder
```

## 技术
- Orkestralama: LangGraph ortak devlet + ajan başına alt grafikler ile
- Mesajlaşma: A2A protokolü (Google 2025) tipileşmiş ajanlar arası mesajlar için
- Modeller: Opus 4.7 (memar) Sonet 4.7 (kodlayıcılar), GPT-5.4 (kazeticiler), Gemini 2.5 Pro (tester)
- İş ağacı izolasyonu: `git worktree add`Kodlayıcıya göre + Daytona kum kutusu
- Birleştirme koordinatörü: özel üç yönlü birleştirme + LLM aracılığıyla çatışma çözümü
- Eval: SWE-bench Pro (50 sayı), SWE-AF senaryoları, Unit testleri için HumanEval++
- Gözlemsellik: Rol etiketleri ile Langfuse, ajan başına token muhasebe
- Deployment: K8s, her rol bir bağımsız Deployment,并 Based Backlog  Konfigurasyon HPA


```figure
ce-team-handoff
```

## Yapın onu.
1. **Task board.**Dosya desteklenen JSONL, yazılmış mesajlar içerir:`plan_request`- Evet.`subtask`- Evet.`diff_ready`- Evet.`review_needed`- Evet.`test_needed`- Evet.`approved`- Evet.`rejected`- Evet.`replan_needed`❖ Ajanlar 订阅 tags──

2. **Architect.**GitHub'un 4.7 plan şablonunu kullanmak için açık alt görev arayüzlerini gerektirir.`plan_request`- Evet.

3. **Coders.**N 个并行工人,每个工人从董事会中要求一个子任务――每个工人 启动一个新的`git worktree add`Ürün ve bir Daytona kum kutusu, alt görev gerçekleştirmek, patç ve test deltaları ile çıkmak.`diff_ready`- Evet.

4. **Merge coordinator.**Tüm kodlayıcılar 完成后,将 N 个分公司 通过三向合并 合并到阶段分公司──只有存在文件级重叠──,才使用LLM-mediated conflict resolution──

5. **Reviewer.**GPT-5.4 读取合并后的差异──不能批准它自己编写的差异──发出 `approved`(no-op) veya belirli değişiklik istekleri ile`review_feedback`,并路由回相关编码器──

6. **Tester.**Gemini 2.5 Pro, sandbox içinde çalışıyor.`test_passed`Ya da`test_failed`◊ başarısız testler, başarısız alt görev kodlayıcıya kadar döner.

7. **Handoff accounting.**Her bir alt görev için bir token amplifikasyonu hesaplamak için, coder_tokens + reviewer_tokens + tester_tokens + architect_share / coder_tokens)

8. **Eval.**50 SWE-bench Pro baskılarında 上运行──将 pass@1 和 $-per-solved-issue ile tek ajan temel çizgisi(1 Sonet 4.7,在单个工作树中)

9. **Post-mortem.**Her başarısızlık sorunu için, başarısızlıktan çıkmış el uzatmalarını tanımlamak için çok belirsiz bir plan oluşturmak, birleştirme çatışması oluşturmak, değerlendirici yanlış onaylamaları, testçi kayıpları oluşturmak.

## Kullan
```
$ team run --issue https://github.com/acme/widget/issues/842
[architect] plan: 4 subtasks (parser, cache, api, migration)
[board]     dispatched to 4 coders in parallel worktrees
[coder-A]   subtask parser  -> 42 lines, tests pass locally
[coder-B]   subtask cache   -> 88 lines, tests pass locally
[coder-C]   subtask api     -> 31 lines, tests pass locally
[coder-D]   subtask migration -> 19 lines, tests pass locally
[merge]     3-way merge: 0 conflicts
[reviewer]  comments on cache (thread pool sizing); routed to coder-B
[coder-B]   revision: 92 lines; submits
[reviewer]  approved
[tester]    all 412 tests pass
[pr]        opened #3382   4 coders, 1 revision, $4.90, 18m
```

## - Söyle.
`outputs/skill-multi-agent-team.md`Bu ekip bir birleşme hazır PR oluşturur ve rol başına token muhasebeciliği sağlar.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 | 匹配的 50-issue subset，pass@1 |
| 20 | Parallel speedup | Wall-clock vs single-agent baseline |
| 20 | Review quality | injected-bug probe 上的 false-approval rate |
| 20 | Token efficiency | 每个 solved issue 的 total tokens vs single-agent |
| 15 | Coordination engineering | Merge-conflict resolution、handoff-failure histogram |
| **100** | | |

## 练习
1. İşlem sırasında fark farkı fark ederken belirgin bir hata oluştu .`return None`)。 ölçüm değerlendiricisinin yanlış onay oranı──调优 değerlendiricisi yanlış onayın % 5'ten düşük olduğu sürece uyarı yapar.

2. 減少到两个编码器 (architekt +编码器 +审查员 +测试员,编码器 顺序运行两个子任务) △

3. Util single-writer constraint 替换 merge coordinator ️ alt görevler 触及不相交的 dosya kümeleri) ️ ölçüm mimarının planlama yükü️

4. GPT-5.4'ten Claude Opus 4.7'e değişecek.

5. 添加第五个角色:documenter (Haiku 4.5) ・ review 之后, değişken log girişleri üretir──dokumentasyon kalitesini ölçmek

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Parallel worktree | "隔离分支" | `git worktree add` 为每个 coder 生成一个新的 working tree |
| Task board | "共享 message bus" | 存储 typed messages 的 File 或 Redis store，agents 会订阅它 |
| Handoff | "Role boundary" | 从一个 role 的 context 跨到另一个 role 的任何 message |
| Token amplification | "Multi-agent overhead" | 同一任务下跨 roles 的 total tokens / single-agent tokens |
| A2A protocol | "Agent-to-agent" | Google 2025 年用于 typed inter-agent messages 的 spec |
| Merge coordinator | "Integrator" | 运行 three-way merge 并调解 conflicts 的组件 |
| False approval | "Reviewer hallucination" | Reviewer 批准带有已知 bugs 的 diff |

## 延伸阅读
- [SWE-AF factory architecture](https://github.com/Agent-Field/SWE-AF) 2026'da çoklu ajan fabrikasının referans gerçekleşmesi
- [MetaGPT](https://github.com/FoundationAgents/MetaGPT)  Rol Based Multi-Agent Framework
- [AutoGen v0.4](https://github.com/microsoft/autogen) Microsoft'un tipiş aktör çerçevesini
- [Cognition AI (Devin)](https://cognition.ai) 参考产品
- [Factory Droids](https://www.factory.ai)  Diğer bir referans ürün
- [Google A2A protocol](https://developers.google.com/agent-to-agent) ajanlar arası mesajlaşma özellikleri
- [git worktree documentation](https://git-scm.com/docs/git-worktree) izole altyapı
- [SWE-bench Pro](https://www.swebench.com) değerlendirme hedefi
