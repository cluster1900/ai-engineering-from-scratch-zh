# Capstone 01  终端原生 Kodlama Ajanı

> 2026 yılına kadar, kodlama ajanının biçimi belirlenmiştir. Bir TUI harness、 bir durumlu plan、 bir sandıklanmış araç yüzey、 bir sorumlu plan、 hareket、 gözlem、 kurtarma döngüsü、 Claude Code、Cursor 3 和 OpenCode uzak yerlerden farklılıklar var.

**类型：**Kap taşı
**语言：**TypeScript / Bun (harness), Python (eval skriptler)
**先修要求：**11 (LLM mühendisliği), 13 (üçümler ve protokoller), 14 (ajanlar), 15 (özel sistemler), 17 (infrastür) aşama
**覆盖阶段：**P0 · P5 · P7 · P10 · P11 · P13 · P14 · P15 · P17 · P18
**时间：**35 小时

## 问题
2026 yılına kadar kodlama ajanları  yönetici AI  uygulama sınıfları Claude Code (Anthropic) 带 Composer 2 和 Agent Tabs  Cursor 3 (Cursor)  AMP (Sourcegraph)  OpenCode (112k yıldızlar)  Factory Droids ve Google Jules  Aynı yapıdaki farklı değişkenleri yayınladı: bir terminal harness  bir sınırlı araç yüzey  bir kum kutusu  bir sınır modelinin etrafında inşa edilmesi plan-hareket gözlem döngüsü  Ön kenarında sıkı Live-SWE-agent kullanımı Opus 4.5  SWE-benç Verified  % 79.2  Ama işlemi geniş  Çoğu başarısız model  hata  bunlar araç döngüsü  sabit olmayan  zehirleme  Kontrol, kontrol ve yapılandırma dosya sistemleri 

Bu ajanları dıştan anlayamazsın. Bir tane inşa etmelisin. 47'inci sırada bir döngü inşa etmelisin.

## 概念
Harness dört yüzey vardır.**Plan**维护一个 TodoWrite 风格的状态对象, by model 每一轮重写──**Act**分发 araç çağrıları (okuru, düzenleme, çalıştırma, arama, git)**Observe**捕获 stdout / stderr / exit codes, 截断,并把摘要反回去──**Recover**Türün hatalarını işlemek, aynı zamanda Plat context window veya limitless loopı önlemek.**hooks**- Evet.`PreToolUse`- Evet .`PostToolUse`- Evet .`SessionStart`- Evet .`SessionEnd`- Evet .`UserPromptSubmit`- Evet .`Notification`- Evet .`Stop`ve`PreCompact`Bu, ayarlanabilir genişleme noktasıdır. Operatör politika, telemetri ve koruma rayları içine sokabilir.

sandbox E2B veya Daytona kullanımı. Her görev tamamen yeni bir devcontainer içinde çalışır, ve bir okuyabilir git iş ağacı yerleştirir. Harness. asla sunucu dosya sistemine dokunmaz.

## Yapılandırma
```
  user CLI  ->  harness (Bun + Ink TUI)
                  |
                  v
           plan / act / observe loop  <--->  Claude Sonnet 4.7 / GPT-5.4-Codex / Gemini 3 Pro
                  |                          (via OpenRouter, model-agnostic)
                  v
           tool dispatcher (MCP StreamableHTTP client)
                  |
     +------------+------------+----------+
     v            v            v          v
  read/edit    ripgrep     tree-sitter   git/run
     |            |            |          |
     +------------+------------+----------+
                  |
                  v
           E2B / Daytona sandbox  (worktree isolated)
                  |
                  v
           hooks: Pre/Post, Session, Prompt, Compact
                  |
                  v
           OpenTelemetry -> Langfuse (spans, tokens, $)
                  |
                  v
           PR via GitHub app
```

## 技术
- Harness çalışması süresi: Bun 1.2 + Ink 5 (Terminal'da reaksiyon)
- Model 访问:OpenRouter 统一 API, destek Claude Sonnet 4.7、GPT-5.4-Codex、Gemini 3 Pro、Opus 4.5(用于最难任务)
- Araç taşımacılığı: Modelle Kontext Protocol StreamableHTTP (MCP 2026 reviziyonu)
- Kum Kutusu: E2B kum kutusu (JS SDK) veya Daytona dev konteynerleri
- Kod arama: ripgrep alt işlem, 17 dil için ağaç bakıcı parserler (önceden oluşturulmuş)
- İzolasyon: `git worktree add`Görev başına, başarısızlık / başarısızlık üzerine temizlik
- Eval harness: SWE-bench Pro (verified subset) + Terminal-Bench 2.0 + kendi 30 görev tutma
- Gözlem: OpenTelemetry SDK ile `gen_ai.*`semconv → kendi kendine barındırılan Langfuse
- PR yayınlama: GitHub App kullanın ince topu token, kapsamı  sınırlama  hedef repo


```figure
ce-agent-loop
```

## Yapın onu.
1. **TUI and command loop.**搭建一个使用墨的 Bun 项目──接收 `agent run <repo> "<task>"`△打印一个分屏视图:plan pane(顶部)、工具通话流(中部)、Token budget(底部)。添加 Ctrl-C 取消逻辑,在退出前触发 △`SessionEnd`- Evet.

2. **Plan state.**定义一个带类型的 TodoWrite schema(包含 pending / in_progress / done items 和 notes) 』模型 每一轮通过工具调重写完整状态不要让它增量修改──将计划 持久化到`.agent/state.json`Bu şekilde çöküşten sonra devam edebiliriz.

3. **Tool surface.**定义六个工具:`read_file`- Evet .`edit_file`(带 diff ön izleme),`ripgrep`- Evet .`tree_sitter_symbols`- Evet .`run_shell`(Birtamlı bir süre),`git`(status / diff / commit / push) ・・・ MCP StreamableHTTP 暴露, make harness with transport 解── her araç 都返回截断后的输出(每次调用最多 4k Tokens) ・・・

4. **Sandbox wrapping.**Her görev bir E2B kum kutusu ile başlatılır.`git worktree add -b agent/$TASK_ID`Yeni bir şubesi oluşturun. Tüm araç çağrıları sandbox içinde uygulanıyor.

5. **Hooks.**实现全部八种 2026 hook 类型──至少接入四个用户编写的 hooks:(a)`PreToolUse`Yıkıcı komutanlık koruması, iş ağacını durdurma.`rm -rf`,(b)`PostToolUse`Token muhasebeciliği,`SessionStart`Bütçe başlangıcı,`Stop`Son iz paketini yazıyorum.

6. **Eval loop.**Bir SWE-bench Pro Python 子集── için her sorun 运行你的harness──与迷你-swe-agent(最小基线)`eval/results.jsonl`- Evet.

7. **Cost control.**Kırık kesim: 50 dönüş, 200 bin bağlam, 5 dolarlık bir görev.`PreCompact`150k'de daha erken dönüşler olacak. Önceki durum blokları için, yeni gözlemler için out space, simultaneously not lost plan.

8. **PR posting.**Başarıdan sonra, son adım.`git push`GitHub API'siyle bir PR açın ve planı ve farklı özetleri içerelim.

## Kullan
```
$ agent run ./my-repo "Fix the race condition in worker.rs"
[plan]  1 locate worker.rs and enumerate mutex uses
        2 identify shared state under contention
        3 propose fix, verify tests
[tool]  ripgrep mutex.*lock -t rust           (44 matches, truncated)
[tool]  read_file src/worker.rs 120..180
[tool]  edit_file src/worker.rs (+8 -3)
[tool]  run_shell cargo test worker::          (passed)
[plan]  1 done · 2 done · 3 done
[done]  PR opened: #482   turns=9   tokens=38k   cost=$0.41
```

## - Söyle.
Yapabilir yetenekler 位于 `outputs/skill-terminal-coding-agent.md`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                                           

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 vs baseline | 你的 harness 与 mini-swe-agent 在 30 个匹配 Python tasks 上对比 |
| 20 | Architecture clarity | Plan/act/observe 分离、hook surface、tool schema——对照 Live-SWE-agent layout 评审 |
| 20 | Safety | Sandbox escape tests、permission prompts、destructive-command guard 通过 red-team |
| 20 | Observability | Trace completeness（100% 的 tool calls 都有 span）、每轮 Token accounting |
| 15 | Developer UX | Cold-start < 2s，crash recovery resumes plan，Ctrl-C 能干净地取消 mid-tool |
| **100** | | |

## 练习
1. Bu, bir çalışma için kullanılan bir sistem olarak görülür.

2. Bir ekle.`reviewer`Sub-agent, PR yayınında 前读取 diff,并可以请求一个修订循环──衡量虚假积极评论是否会让SWE-bench pass rate 低于单代理基线(提示:通常会)。

3. 压测 sandbox:编写一个尝试 `curl`Dışişleri URL'lerinin görevleri, ve bir çalışma ağacını yazmaya deneme. Dışişleri'nin görevleri.

4. Daha Küçük Bir Modelle (Haiku 4.5)  实现 `PreCompact`Kısacası, 3x kompaktasyonda ölçülmüştür.

5. MCP StreamableHTTP nakliye için stüdyo için değiştirmek.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Harness | “agent loop” | 围绕 model 的代码，负责分发 tools、维护 plan state，并强制执行 budgets |
| Hook | “Agent event listener” | 由 harness 在八种 lifecycle events 之一上运行的用户编写脚本 |
| Worktree | “Git sandbox” | 位于独立路径的 linked git checkout；可以丢弃而不触碰 main clone |
| TodoWrite | “Plan state” | model 每轮都会重写的 typed list，包含 pending/in-progress/done items |
| StreamableHTTP | “MCP transport” | 2026 MCP revision：具备双向 streaming 的 long-lived HTTP connection；取代 SSE |
| Token ceiling | “Context budget” | 对 input+output Tokens 设置的每轮或每 session 上限；触发 compaction 或 termination |
| pass@1 | “Single-attempt pass rate” | SWE-bench tasks 在第一次运行中解决的比例，不包含 retry 或 test-set peeking |

## 延伸阅读
- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code) Antropic'in referans harnesinden
- [Cursor 3 changelog](https://cursor.com/changelog) Ajan Tabs 和 Composer 2 ürün notları
- [mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent) SWE-bench harness karşılaştırma için minimum başlangıç
- [Live-SWE-agent](https://github.com/OpenAutoCoder/live-swe-agent) Opus 4.5 kullanımı SWE-bençinde doğrulanmış % 79.2 'e ulaştı
- [OpenCode](https://opencode.ai) açık harman,112k yıldız
- [SWE-bench Pro leaderboard](https://www.swebench.com) 本 面向的评估
- [Model Context Protocol 2026 roadmap](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/) Akışlanabilir HTTP,eğitimlilik metadataları
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) araç çağrıları 和 Token kullanımının uzantı şeması
