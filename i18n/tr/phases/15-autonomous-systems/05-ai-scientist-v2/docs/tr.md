# AI Bilimci v2  Atölyesi 级自主研究

> Sakana'nın AI Bilimcisi v2 (Yamada et al., arXiv:2504.08066) 运行完整的研究循环:假设、代码、实验、图表、写作、投稿。它是第一个让生成论文通过ICLR 2025 研讨会同学评审的系统──独立评估 (Beel et al.) 发现,42% 实验因编码错误失败,文学评审也经常把既有概念错误标记为小说──Sakana 自己的 doc 警告说,该代码库会执行LLM 编写的代码,并建议使用Docker 隔离──这两图景共同构成重点──

**Type:** Learn
**Languages:** Python (stdlib, research-loop state-machine toy)
**Prerequisites:** Phase 15 · 03 (AlphaEvolve), Phase 15 · 04 (DGM)
**Time:** ~60 minutes

## 问题

Araştırma bir açık görevdir. AlphaEvolve'in algoritma arama veya DGM'den farklı olarak, araştırma sonuçları makine tarafından kontrol edilebilir doğruluk standartları yoktur. Araştırma sonuçları, incelemeci tarafından yargılanır, birim testleri tarafından yargılanır. Bu da döngüyi daha zorlaştırır.

AI Scientist v1 (Sakana, 2024) 通过从人类编写的模板 开始来闭合循环――LLM 在固定脚手架内填入实验――AI Scientist v2 (Yamada et al., 2025) 使用带有视觉语言模型 批评循环的代理树搜索,移除了模板 要求──系统会产生想法、实现实验、生成图表、撰写论文,并根据评论员反代──

Eşcinsel inceleme sonucu: 一篇由 v2 生成的论文被ICLR 2025 atölyesi tarafından kabul edildi (接收(带披露) ・独立评估结论:该系统远不可靠──两者都是真──

## 概念

### Yapılandırma

1. **想法生成。**LLM 根据主题和已有文献提出研究思想──v1 使用模板;v2 在假设空间上使用代理搜索──
2. **新颖性检查。**Beel et al. tarafından yapılan değerlendirmeler, bu aşamada yanlış bir işaret bulmuştur: zaten bir yöntem sıklıkla roman olarak sınıflandırılmıştır.
3. **实验计划。**Agent 起草实验协议 并编写代码──
4. **执行。**代码在砂箱中运行──失败会反到复试循环── Beel et al. 'ın ölçümlerine göre, bu aşamada deneylerin %42'si 编码错误失败──
5. **图表生成。**Görüş dili modeli 读取生成的图表,并重写它们以提高可读性──这是 v2'in关键技术新增点──
6. **写作。**LLM 起草论文,并与内部评论员 代。
7. **可选：投稿。**Bu makale bir yere gönderildi.

### Atölyenin sonuçları ne anlama geliyor ?

Bir v2 tarafından oluşturulan makale ICLR 2025 atölyesinin eşcinsel incelemesini geçti. Program komitesine yazar, makale kaynağını açıkladı. Bu alım bir veri noktası; bu sistemin araştırmaya izin verdiğini iddia etmiyor.

重要背景:workshop 论文的门低于主要会议论文── 评论 评论 噪声很大;在任意一天,都会有一小部分投稿被接收──一次成功是概念的证明,而不是可靠性声明──自然 2026 论文记录了端到端循环,且它本身由人类研究人员共同签署;它不是系统写了一篇自然论文──

### 独立评估发现了什么

Beel et al. (arXiv:2502.14297)  dış değerlendirme yaptı.

- **实验失败。**%42'nin deneyleri bir bölümünü, ama tümünü değil, bir kısmını yakaladı.
- **新颖性错误标记。**edebiyat-içinde bulma 步骤 sık sık zaten var olan kavramları roman olarak tanımlar.
- **呈现质量差距。**Görüş dili Şekil eleştirileri yayın sınıfı görsel etkilerini oluşturdu, temel deney zayıflıklarını örtdü.

Son bir bulgu bu aşamaya en önemlisi ise, inanılmaz bir üretim üretimi, inanılmaz bir çalışma sistemi yapmamıştır.

### Kum kutu kaçış 风险

Sakana  kendi depo README 警告:

> Bu yazılım LLM'nin kodunu uyguladığı için, güvenlik garanti edilemiyor. Tehlikeli paketler var, kontrolsüz web erişimleri ve beklenmedik süreçler oluşturma riskleri var.

Bu, kanıtlanmamış alanda kendiliğinden işleyiş biçimidir. LLM kod yazma; kod çalışması; kod, izin verilen her şeyi yapabilir. Eğer dosya sistemi, ağ ve süreç eylemleri zor kısıtlamalar yapmazsa, herhangi bir kendiliğinden yönlendirilmiş araştırma ajanı dışı bilgiyi tüketebilir veya kendi kendini yeniden yazabilir.

AlphaEvolve'in kum kutusu  Hikaye daha kolay, çünkü değerlendirici  çok yakındır. AI Scientist v2'in döngüsü açık kod yürütür, ayrıca açık hedefler taşır. Bu nedenle daha güçlü bir ayrım gerektirir.

### v2 sınır yığın ortasındaki konum

| System | Target | Output kind | Evaluator | Known failure |
|---|---|---|---|---|
| AlphaEvolve | algorithms | code | unit + benchmark | 受 evaluator 严谨程度限制 |
| DGM | agent scaffolding | code | SWE-bench | reward hacking |
| AI Scientist v2 | research papers | text + code + figures | peer review（弱） | 实验失败、错误标记、润色掩盖弱点 |

Bu üç kişi arasında, v2'nin otomatik değerlendirici en zayıf, en geniş, en kısa yolları açık eserlere doğru yürür.


```figure
mx-research-loop
```

## Kullan

`code/main.py`Bu nedenle, bir devlete göre, bir devlete göre bir devlete göre bir devlete göre bir devlete göre bir devlete göre bir devlete göre bir devlete göre bir devlete göre bir devlete göre bir devlete göre bir devlete göre bir devlete göre bir devlete göre bir devlete göre bir devlete göre bir devlete göre bir devlete göre bir devlete göre bir devlete göre bir devlete göre bir devlete göre bir devlete göre bir devlete göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye göre bir devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye devreye dev

- Postlama aşamasına kadar çok fikir var.
- Bir çok yazı var ki, gizli bir deney eksikliği var.
- Yeniden tasarruf yapılması  nasıl kalite ve üretim arasında bir tartışma yapılabilir?

## - Söyle.

`outputs/skill-ai-scientist-sandbox-review.md`Bu, iki kapılı bir inceleme kontrol listesi, döngü ajanı araştırmak için kullanılır.

## 练习

1. usage默认参数运行 `code/main.py`◊ Bir çalışma ile sonuçlanan bir çalışma ile sonuçlanan bir çalışma ile sonuçlanan bir çalışma ile sonuçlanan bir çalışma ile sonuçlanan bir çalışma ile sonuçlanan bir çalışma ile sonuçlanan bir çalışma ile sonuçlanan bir çalışma ile sonuçlanan bir çalışma ile sonuçlanan bir çalışma ile sonuçlanan bir çalışma ile sonuçlanan bir çalışma ile sonuçlanan bir çalışma ile sonuçlanan bir çalışma ile sonuçlanan bir çalışma ile sonuçlanan bir çalışma ile sonuçlanan bir çalışma ile sonuçlanan bir çalışma ile sonuçlanan bir çalışma ile sonuçlanan bir çalışma ile sonuçlanan bir çalışma ile sonuçlanan bir çalışma ile sonuçla sonuçlanan bir çalışma ile sonuçla sonuçlanan bir çalışma ile sonuçla sonuçlanan bir çalışma ile sonuçla sonuçlanan bir çalışma ile sonuçla sonuçlanan bir çalışma ile sonuçla sonuçlanacak.

2. %42 / 25% 默认值已使用 `--experiment-failure 0.20 --novelty-mislabel 0.10`和 `--experiment-failure 0.60 --novelty-mislabel 0.40`重新运行──两次运行之间,抛光但缺陷的比例如何变化?

3. 阅读 Sakana's AI Scientist v2 repo README 中关于砂箱 要求的内容──说出两个你会多日自主运行额外施加的限制(Docker 之外)──

4. Beel et al. Bölüm 4'te sunum kalitesi boşluğunun içeriği hakkında.

5. Araştırma ajanı 输出 bir insan inceleme protokolü önerdi, genişletme oranını arttırdı.

## 关键术语

| Term | What people say | What it actually means |
|---|---|---|
| AI Scientist v1 | “Sakana 的 templated research agent” | 将实验填入固定 scaffold |
| AI Scientist v2 | “无 template 的 research agent” | 带有 VLM 图表批评的 agentic tree search |
| Agentic tree search | “分支式 research agent” | 并行扩展多个实验计划；由内部 critic 剪枝 |
| Vision-language critique | “对图表进行 VLM 润色” | Multimodal model 读取图表并重写以提高清晰度 |
| Literature retrieval | “新颖性检查” | 搜索 prior work 以确认想法新颖性，并已被记录会发生错误标记 |
| Polish masking | “漂亮论文，破损研究” | 呈现质量超过实验质量；隐藏弱点 |
| Sandbox escape | “LLM 代码逃逸” | agent 执行的代码做了 loop designer 未预期的事情 |

## 延伸阅读

- [Yamada et al. (2025). The AI Scientist-v2](https://arxiv.org/abs/2504.08066) 论文。
- [Sakana blog on the Nature 2026 publication](https://sakana.ai/ai-scientist-nature/) 带有同行评价 背景的供应商总结──
- [Beel et al. (2025). Independent evaluation of The AI Scientist](https://arxiv.org/abs/2502.14297) Dışişleri Bakanlığı tarafından değerlendirilmiş sayı¬lar
- [Sakana AI Scientist v1 paper](https://arxiv.org/abs/2408.06292) 模板化前身──
- [Anthropic — Measuring AI agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy)Açık araştırma ajanları hakkında daha geniş çerçeve
