# 基准测试:WebArena ve OSWorld

> WebArena, dört kendi kendine yönetilen uygulama üzerinde test web-agent 能力──OSWorld, Ubuntu、Windows、macOS üzerinde test masaüstü-agent 能力── yayınlama sırasında(20232024), her ikisi de birinci sınıf ajanla insan arasında büyük bir fark olduğunu göstermektedir── fark azalıyor; başarısızlık modları  hiç değişmedi──

**类型：**Öğrenme
**语言：**Python (stdlib)
**先修要求：**14 · 19 aşama (SWE-bench, GAIA)
**时间：**60 dakika kadar .

## Öğrenme hedefi

- WebArena'nın dört kendi kendine yönetim uygulamasını ve neden gerçekleştirme tabanlı değerlendirmenin önemli olduğunu açıklayın.
- OSWorld'in erişilebilirlik API'leri yerine gerçek OS'yi kullanmasının nedenini açıklayın.
- İki temel OSWorld başarısızlık modunu belirleyin: GUI yerleştirme ve operasyonel bilgi.
- 总结 OSWorld-G 和 OSWorld-Human 基础基准上增加了什么──

## 问题

Genel tip ajanı araçları kullanabilir. Bunlar, tarayıcıda 20 kez tıklayarak bir alışveriş kontrolünü tamamlayabilir mi? Bunlar sadece bir Linux makinesi üzerinde klavye ve fare ayarlamaları ile mi yapılabilir? Bunlar WebArena ve OSWorld'in cevapladığı sorulardır.

## 概念

### WebArena (Zhou et al., ICLR 2024)

- 4 kendi kendine yönetilen web uygulamalarının 812 uzun süreli görevlerini kapsar: alışveriş siteleri, forumlar, GitLab'ın geliştirme araçları, ticari CMS,
- Diğer kullanılabilir araçlar: harita, hesaplama, çizmeleme.
- 评估通过健身房 API 基于执行完成:订单是否下单,问题是否已关闭,CMS 页面是否更新?
- 发布时: En iyi GPT-4 ajanı  14.41% başarısı oranına ulaştı, insan ise 78.24% 👍

Öz-Tüzetleme ayarları önemlidir, çünkü hedef uygulama sabit ve tekrarlanabilir, bu nedenle referans dış değişimlerden dolayı sabit değildir.

### 扩展

- **VisualWebArena** 视觉 grounding 任务, başarısı, ilk gözlem olarak görüntülerin çözülmesine bağlıdır)
- **TheAgentCompany**(Aralık 2024)  加入 terminal + coding;更像真实的远程工作环境──

### OSWorld (Xie et al., NeurIPS 2024)

- Ubuntu, Windows, macOS'un 369 gerçek bilgisayar görevlerini kapsamaktadır.
- Gerçek uygulama için serbest biçimdeki klavye ve fare kontrolü
- 截图作为观察――
- 发布时: en iyi model %12.24 , insan %72.36

### Ana başarısızlık modları

1. **GUI grounding。**Pixel → element 映射──Model 很难在 1920×1080 中可靠定位 UI 元素──
2. **Operational knowledge。**Hangi menüde ayarlama var, hangi klavye kısayolu, hangi tercih paneli.

### 后续工作

- **OSWorld-G** 564 个样本的地面积套+Jedi eğitim seti──将地面积与规划 拆解开来,因此可以分别测量──
- **OSWorld-Human** 人工整理的黄金行动轨迹──显示顶级代理 使用的步骤比必要步骤多 1.4-2.7x(轨迹-效率差)──

### Neden bu çok önemli ?

Claude bilgisayar kullanımı、OpenAI CUA、Gemini 2.5 Bilgisayar kullanımı(Daahi 21) WebArena ve OSWorld tarafından oluşturulan iş yükü üzerinde eğitimler yer alıyor.

### Benchmarking 容易出错的地方

- **仅截图 evals。**OSWorld tarafından görüntüleştirilir; eğer OSWorld'de DOM veya erişilebilirlik API'lerinin ajanını değerlendirirseniz, yerleşimden geçersiz kalır 挑战──
- **忽略 trajectory length。**Başarılılık oranına göre, 1.4-2.7x adım düşük performans gösterir.
- **陈旧的自托管 apps。**WebArena uygulamaları belirli bir sürüm ayarladı; eğer yeni sürümde yeniden düzenlenmezse, uygunluğu bozacaktır.


```figure
ae-agent-human-gap
```

## Yapın onu.

`code/main.py`实现 bir oyuncak web-agent harness:

- Bir en küçük alışveriş uygulaması  status机:list_items、add_to_cart、checkout。
- 3 个任务的黄金轨迹――
- Bir girişim, her görev için bir senaryo ajanı.
- 基于执行的评估器 (State Check) 和轨迹效率指标 (Prep vs. Gold) 

- Yapma .

```
python3 code/main.py
```

输出: her görev başarısı oranı ve yörüngesi verimliliği, OSWorld-Human'ın yaklaşım teorisi karşı karşıya

## Kullan

- **WebArena Verified**Kendini sürekli değerlendirme için kullanılır.
- **OSWorld**VM filosu içinde, masaüstü ajanları için kullanılır.
- **Computer-use agents**(Düşünme 21)  Claude、OpenAI CUA、Gemini  都在类似的工作负荷上训练──
- **你自己的产品流程**                                                                                                                                                                                                                                                              

## - Söyle.

`outputs/skill-web-desktop-harness.md` Web/desktop ajan harness oluşturmak, gerçekleştirilen değerlendirme ve yörüngenin verimlilik ölçümlerine dayalı olarak bulunmaktadır.

## 练习

1. Oyuncak harnesini genişletmek için 3. görev ve altın yolları yazmak için.
2. Görev raporunun yörüngesi verimliliği ekle. Oyuncaklarınızda ajanın 1x,2x ya da 3x altın mı?
3. Bir distractor aracı gerçekleştirmek, yani altın yoldaki distractor aracı kullanılamayan  araçları kullanmak.
4. OSWorld-G'yi okuyun. Kendi değerlendirmelerinde yerleştirme başarısızlığı ile planlama başarısızlığı arasında nasıl bir fark yapacaksınız?
5. WebArena'nın uygulamalarını okuyun, okuyun. Bir sabit uygulama  sürümünü yükselttiğinizde, neyi bozursunuz?

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| WebArena | "Web agent benchmark" | 覆盖 4 个自托管 apps 的 812 个任务；gym-style evaluation |
| VisualWebArena | "Visual WebArena" | 视觉 grounding 的 WebArena；截图是 observations |
| OSWorld | "Desktop agent benchmark" | 在真实 Ubuntu/Windows/macOS 上的 369 个任务 |
| GUI grounding | "Pixel-to-element mapping" | Model 在 1920x1080 中定位 UI 元素 |
| Operational knowledge | "OS know-how" | 哪个菜单、哪个 shortcut、哪个 preference pane |
| OSWorld-G | "Grounding suite" | 564 个仅 grounding 样本 + training set |
| OSWorld-Human | "Gold trajectories" | 用于衡量效率的人工专家动作序列 |
| Trajectory efficiency | "Steps over gold" | Agent 步数除以人类最小步数 |

## 延伸阅读

- [Zhou et al., WebArena (arXiv:2307.13854)](https://arxiv.org/abs/2307.13854) 四 uygulama web referans
- [Xie et al., OSWorld (arXiv:2404.07972)](https://arxiv.org/abs/2404.07972) 跨 OS masaüstü referans
- [Anthropic, Introducing computer use](https://www.anthropic.com/news/3-5-models-and-computer-use) Claude by benchmark 塑造 becerisi
- [OpenAI, Computer-Using Agent](https://openai.com/index/computer-using-agent/) OSWorld 和 WebArena 数字
