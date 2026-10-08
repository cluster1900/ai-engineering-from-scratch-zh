# Özerk Kodlama Ajanı 版图(2026)

> SWE-bench Verified, üç yıl içinde %4'ten %80.9'a yükseldi. Aynı Claude Sonnet 4.5'in SWE-agent v1'de %43.2'e ulaştığı, Cline otonomunda %59.8'e ulaştığı  Bugün modelin etrafındaki asfaltlama ve modelin kendisi kadar önemli olan OpenHands (Ölken adı OpenDevin) MIT lisanslı en aktif platformu, CodeAct döngüsü, JSON çağrıları yerine doğrudan Python'da işlemler yerine getirir.

**类型：**Öğrenme
**语言：**Python(stdlib,CodeAct vs JSON araç çağrısı karşılığı)
**先修要求：**Fase 14 · 07(Yalın kullanımı),Fase 15 · 01(Uzun ufuk ajanları)
**时间：**45 dakika kadar .

## 问题

 Hangi kodlama ajanı en iyi                                                                                                                                                                                                                                                           

2022-2026 yılları arasında, bu alan, asfaltlama  geri alım katmanı  plancı ̇ kum kutusu ̇ düzenleme-verifi asfalt ̇ geri bildirim biçimi  ̇ yük yükleme yapısı ̇ Claude Sonnet 4.5 ̇ SWE-agent v1 ̇ üst SWE-benç Verified 得分は43.2%; aynı model Cline'in otonom asfaltında yerleştirilmiş olan ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇

伴随的问题是基准 和会掩盖退步──SWE-bench Verified 已接近和,而易任务尾(500 个任务中只有161 个需要 ≤2 行) 会拉高顶部分数──真实世界质量更适合在SWE-bench Pro(10+ 行修改) 这样的分布上测量,在那里同样的领先系统仍然只有2359%──

## 概念

### SWE-bençini anlamak için.

SWE-bench(Jimenez et al.) seçmek ile birlikte temel gerçeklik patchleri GitHub sorunları,并要求代理 生成一个补丁,让测试套件 通过──SWE-bench Verified(OpenAI,2024) bir 500 任务子集,移除含糊和损坏的任务──SWE-bench Pro 是更难的后后版本  任务要求 10+ 行修改,目前的边境代理得分为 2359%──

### 2022 → 2026 曲线真正说明了什么

- **2022**: araştırma modelleri: %4
- **2024**:GPT-4 + Devin tarzı asfaltlama yaklaşık %14;SWE-ağent yaklaşık %12
- **2025**Sonet: 3.5/3.7 Sonet: Aider: SWE-agent: 40 55% 区间:
- **2026**SWE-bençinde SWE-SONET 4.5 ve SWE-SONET'in sınır yarışmacıları %70'e ulaştılar.

Bu                                                                                                                                                                                                                                                               

### CodeAct vs JSON 工具调用

OpenHands(All-Hands-AI,arXiv:2407.16741, öncü olarak OpenDevin) belirli bir yapısal bahis yapmıştır: modelin host tarafından gönderilmesini değil, oyunun Python kodu gönderilmesini sağlar ve Jupyter tarzı çekirdeği tarafından sandbox içinde çalıştırılır.

权衡如下:

- **JSON tool calls**Her eylem bir dönüştür; denetleme kolay; kompozisyonluluk sınırlıdır; daha güvenli bir şekilde kabul edilir, çünkü her çağrı açık bir onaylayıcıyla geçerlidir.
- **CodeAct**Bir eylem tüm bir program olabilir; yapısı vardır; sert sandbox gerekir; Docker izolasyon kullanmak OpenHands; başarısızlık modları içerir sandbox çalıştırma zaman 允许的任何行为。

两种架构都已用于生产──CodeAct 在开放平台中占主导(OpenHands、smolagents)──JSON araç çağrıları 在管理服务中仍占主导(Anthropic Managed Agents、OpenAI Asistanları),因为提供商 控制执行者──

### 2026 版图中的 asfaltlar

| Scaffold | License | Execution model | Notable property |
|---|---|---|---|
| OpenHands (OpenDevin) | MIT | Docker 中的 CodeAct | 最活跃的 open platform；event-stream 可 replay |
| SWE-agent | MIT | Agent-Computer Interface (ACI) | 第一个端到端 SWE-bench scaffold |
| Aider | Apache-2 | local repo 中 edit-via-diff | Minimal scaffold，regression stability 强 |
| Cline | Apache-2 | 带 tool policy 的 VS Code agent | Sonnet 4.5 上得分最高的 open scaffold |
| Devin (Cognition) | Proprietary | Managed VM + planner | 第一个“AI software engineer”产品类别 |
| Claude Code | Proprietary | Permission modes + routines | Lesson 10 会详细讲解 agent loop |

### Neden asfaltlar  dominant

Bir kere kodlama çalışması bir uzun uzayda yolculuk yapmaktır.

1. **Retrieval**Bu sorunu çözmek için Aider'in repo haritası ve SWE-agent'in ACI, OpenHands dosya indeksleri hazırlanıyor.
2. **Verifier loop**SWE-bencinde 10+ bölümü getirebilirim.
3. **Failure containment**Çıkış: Çıkış sırasında geri dönebilir sandbox                                                                                                                                                                                                                                                         

### Benchmark 和与真实分布

OpenHands yazarları ve Epoch AI'nin belirttiği gibi SWE-bench Verified  kolay quyruğu var: 500 个任务中161 个只需要12 行修饰──高分部分由这个尾 驱动──SWE-bench Pro 限定为10+ 行修改, hatta sınır sistemlerinde bile,分数也只有2359%──

选择代理的含义是: kendi hata arka arkadasında Pro'ya benzer bir parça oluşturmak için kullanılan 选择代理的含义是: 选择代理的含义是: 选择代理的含义是: 选择代理的含义是: 选择代理的含义是: 选择代理的含义是: 选择代理的含义是: 选择代理的含义是: 选择代理的含义是: 选择代理的含义是: 选择代理的含义是: 选择代理的含义是: 选择代理的含义是: 选择代理的含义是: 选择代理的含义是: 选择代理的含义是: 选择代理的含义是: 选择代理的含义是: 选择代理的含义是: 选择你实际交付内容的任务上的分数, 代表你实际交付内容的任务的分数.


```figure
a5-scaffold-delta
```

## Kullan

`code/main.py`Bir sabit mini-iş dağıtımında iki oyuncak ajan asfaltları karşılaştırın:

1. Bir tane .**JSON tool-call**Hepsi bir hareket yaparak.
2. Bir tane .**CodeAct**Hepsi bir Python fragmanı çıkarabilir.

两者都使用 stub model(deterministik kurallar), bu nedenle asfaltı model质量隔离──输见显示 CodeAct asfaltı daha az dönüşü kullan 解决更多任务,代价是每个动作的爆炸半径更大──

## - Söyle.

`outputs/skill-scaffold-audit.md` yardımcı olmak  önerilir kodlama ajanı asfaltı  önce denetim yapın: kurtarma kalitesi, verifier varlığı, kum kutu izolesi, ve referans-to-distribusiyon uygunluğu

## 练习

1. 运行  İşlem`code/main.py`❖ Aynı görev setinde, her asfalt kaç dönüş gerektiriyor?

2. Bu makale, CodeAct'in karmaşık görevlerde JSON araç çağrılarından daha iyi olduğunu düşünüyor. Kağıtın başarısızlık modunu kabul etmesini ve bu modun üretimde baskın olduğunu belirttiğini yazıyor.

3. Buğunun arka kaydından Seçim: Bir tane seçin, iki dosya arasında geçmek gerekir. 10+ 行の課題を修正します.

4. SWE-bench Verified 161 tane tek dosya var. 1 2 行 görevleri var.

5. 阅读 SWE-bench Verified(OpenAI) 』i tanıttırmak, belirsiz görevlerin kaldırılması için kullanılan spesifik metodolojiyi açıklamak, bir kurasyon ortaya çıkarmak, 会漏掉的类别──

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|---|---|---|
| SWE-bench | “Coding benchmark” | 带有 ground-truth patches 和 test suites 的真实 GitHub issues |
| SWE-bench Verified | “Cleaned subset” | 500 个经过人工筛选的任务，存在 easier-tail |
| SWE-bench Pro | “Harder subset” | 10+ 行修改；frontier 得分为 23–59% |
| CodeAct | “Code-as-action” | Agent 发出 Python；Jupyter-style kernel 在 sandbox 中执行 |
| JSON tool call | “Function calling” | 每个 action 都是执行前经过验证的 structured JSON payload |
| Scaffold | “Agent framework” | 围绕基础模型的 retrieval + planner + executor + verifier loop |
| ACI (Agent-Computer Interface) | “SWE-agent's format” | 为 LLM ergonomics 设计的 command set，而不是 human shells |
| Verifier loop | “Test-and-retry” | 运行 tests、读取 output、修订 patch；最大的非模型可靠性收益 |

## 延伸阅读

- [Jimenez et al. — SWE-bench](https://www.swebench.com/) 原始基準 和 yöntemi¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- [OpenAI — Introducing SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) kurate alt kümesi  nasıl yapılandırılır
- [Wang et al. — OpenHands: An Open Platform for AI Software Developers](https://arxiv.org/abs/2407.16741) CodeAct 架构和事件流 设计──
- [Epoch AI — SWE-bench leaderboard](https://epoch.ai/benchmarks) 实时追踪的分数──
- [Anthropic — Measuring agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) uzun uzayda kodlama ajanı güvenilirliği çerçevesini oluşturmak。
