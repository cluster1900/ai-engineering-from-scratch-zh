# Yetenek Kütüphesi ile Öte Yeri Öğrenme (Voyager)

> Voyager (Wang et al., TMLR 2024) bir kod uygulamaya uygulanabilir bir beceri olarak görecektir. Bice  adı kullanılabilir 检索可组合的特性,并通过环境反持续改进──这是Claude Agent SDK becerileri、技能套件,以及 2026 becerileri-kitüphanesi 模式的参考架构──

**类型：**Yapım
**语言：**Python (stdlib)
**先修：**14 · 07 aşaması (MemGPT), 14 · 08 aşaması (Letta blokları)
**时间：**~ 75 dakika

## Öğrenme hedefi

- Voyager'ın üç bileşeni anlatın: otomatik ders programı, beceri kütüphanesi, iteratif uyarı, ve kendi rollerini açıklayın.
- Voyager neden orijinal emir yerine kod olarak tasarlandıracağını açıklayın.
- Bu nedenle, bu programın başarısızlıktan kaynaklanan bir gelişme ve geliştirme becerisi kitlesine destek sağlanmaktadır.
- Voyager'ın modelini 2026 yılına kadar görüntülemek için Claude Agent SDK becerileri ve beceri kitlerini oluşturmak.

## 问题

Her seansda, tüm güçleri yeniden inşa etme yeteneği olan ajanlar üç tür hata yapar:

1. **浪费 Token。**Her görev aynı şekilde yeniden ortaya çıkarılır.
2. **丢失进展。**A seansı A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A. A.
3. **无法处理长程组合。**复杂 görevler, yetenek seviyesine ihtiyaç duyar; tek vuruşta  onları gerçekleştiremezler.

Voyager'ın cevabı: Her tekrarlanabilir kapasiteyi bir kutuda bulunan bir depolama olarak görerek, benzerlik arayışı yoluyla, diğer beceri kitleleriyle birleştirerek ve sürekli gelişmeler yaparak kullanmakla birlikte kullanmakla birlikte,

## 概念

### Üç parça

Voyager (arXiv:2305.16291) 围绕以下内容组织代理:

1. **Automatic curriculum。**Bilgicilik tarafından yönlendirilmiş bir önericiden oluşan bir proje.
2. **Skill library。**Her beceri tamamlanabilir kodlar vardır. Görev başarısı sonrasında yeni beceri eklenecektir.
3. **Iterative prompting mechanism。**Başarısız olduğunda, ajan, hataları, çevreyi ve kendiliğinden denetlemeyi alır ve bu beceriyi geliştirir.

Minecraft 评估(Wang et al., 2024): Asıl değerlere göre, benzersiz eşyalar 3,3 倍, taş aletler 8,5 倍, demir aletler 6,4 倍, 図面 広域距離長 2.3 倍──

### 动作空间 = 代码

Büyük çoğunluk ajanı 输出原始命令──Voyager 输出 JavaScript 函数──一个技能是:

```
async function craftIronPickaxe(bot) {
  await mineIron(bot, 3);
  await mineStick(bot, 2);
  await placeCraftingTable(bot);
  await craft(bot, 'iron_pickaxe');
}
```

Yapılan işlemler, bir istek olarak değil, bir işlem olarak kontrol edilir.

İşte 2026 Claude Agent SDK yeteneği: bir parça adı, arama kodu, tekrar ekle ajan 按需加载说明

### Yetenek 检索

Yeni görev ise bir elmas çivisi yapmak.

1. Görev tanımlaması için  Embedding yapın.
2. 查询技能库,获取顶级k 相似技能──
3. 检索   检索`craftIronPickaxe`- Evet.`mineDiamond`- Evet.`placeCraftingTable`- Evet.
4. Yeni bir Logiği Yapımcılık Yetenekleri

İşte MCP kaynakları (Fase 13) ve Agent SDK becerileri 实现的模式:知识/代码表面上进行检查,并限在当前任务范围内──

### 代改进

Voyager'ın karşı döngüsü:

1. Ajan bir beceri yazıyor.
2. Yetenekler:
3. 返回三种信号之一:`success`- Evet.`error`(Satır izleri)`self-verification failure`- Evet.
4. Ajan bu sinyalleri üst üst yazıyı yeniden yazma becerisi olarak kullanıyor.
5. 循环 until success or reach the maximum number of rounds. Başarılılığa ulaşana kadar döngü.

Bu Self-Refine (Özel-Temizleme) (Deneleme 05) kod üretimi için kullanılır, değil çevre aşamaları için kullanılır.

### Eğitim planı ve araştırmalar

Voyager'ın eğitim modülü, ajanın 已拥有什么、还没有做什么, 已拥有什么、还没有做什么, 已拥有什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做什么, 已做了, 已做了, 已做了, 已做了, 已做了, 已做了, 已做了, 已做了, 已做了, 已做了, 已做了, 已做了, 已做了, 已做了, 已做了, 已做了, 已做了, 已做了, 已做了, 已做了, 已做了, 已做了, 已做了, 已做了, 已做了, 已做了, 已做了, 

Üretim ajanı için, bu bir ne eksik  operatör olarak dönüşür:                                                                                                                                                                                                                                                    

### Bu tür bir yol kolayca yanlış olur.

- **Skill library rot。**Aynı beceri kullanılır. Farklı bir tanım var. 10 kez eklenir.
- **Composed-skill drift。**Baba becerisi, daha sonra geliştirilen bir çocuğun becerisine bağlıdır.
- **Retrieval quality。**Skiller 库 birkaç yüz 以上の büyüdüğüyle, Skiller Description'e dayalı vektör geri alımı 会退化。 tag filtre ile 和硬约束補充(Only skills with `category=tooling`) 


```figure
voyager-skills
```

## Yapın onu.

`code/main.py`实现一个 stdlib 库:

- `Skill` isim, açıklama, kod, versiyon, etiket, bağımlılıklar.
- `SkillLibrary` register、search(token overlap)、compose(dependence拓排序) ve refine(更新时版本 bump)。
- Bir yazılımcı: kayıt üç orijinal beceri, dördüncü bir takım, bir kez başarısızlık, sonra geliştirmek için.

运行:

```
python3 code/main.py
```

ve v2 改进, yani Voyager 循环'un sonuna sonuna kadar süreci

## Kullan

- **Claude Agent SDK skills**(Antropik)  2026 参考: her beceri için bir tarif、kod ve talimatlar vardır;
- **skillkit**(npm: skillkit)  面向 32+ AI kodlama ajanları 的跨代理技能管理──
- **Custom skill libraries** 特定領域 (例えばデータエージェントの SQL becerileri, infra-エージェントの Terraform becerileri) ・・・Voyager 模式可以缩小应用──
- **OpenAI Agents SDK `tools`** 低配版本; her araç  低配 versiyonu;

## - Söyle.

`outputs/skill-skill-library.md`Bu, Voyager biçimindeki bir beceri kitlesini oluşturur.

## 练习

1. - Ver .`compose()`A'nın yeteneği B'ye bağlıyken B'nin de A'ya bağlı olduğu zaman ne olur?
2. 实现每个技能的版本固定──当父技能组合子技能 `crafting@1`时,对 `crafting@2`Değişiklikler yapamaz.
3. Bu, bir 50 yetenek oyuncak kütüphanesi üzerinde bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test yaparak bir test ederek bir test yaparak bir test yaparak bir test yaparak bir test ederek bir test ederek bir test yaparak bir test ederekine
4. 添加一个课程代理:给定当前库和一个域描述,提出 5 个缺失技能──每周调用一次──
5. Antropik'in Claude Agent SDK yetenekleri dokümanları... Oyuncak kütüphanesi  SDK'ın yetenek skemasına aktarılacak...

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Skill | “可复用能力” | 带有 description 的命名代码块，可通过相似度检索 |
| Skill library | “agent 的 how-to 记忆” | Skill 的持久化存储，可搜索、可组合 |
| Curriculum | “任务 proposer” | 由当前能力缺口驱动的自底向上目标生成器 |
| Composition | “Skill DAG” | Skill 调用 Skill；执行时进行拓扑排序 |
| Iterative refinement | “自我修正循环” | Env 反馈 + 错误 + 自验证，会折回到下一个版本中 |
| Action-space-as-code | “程序化动作” | 输出函数，而不是原始命令，用于时间跨度更长的行为 |
| Dedup on write | “Skill collapse” | 近重复 description 会合并为一个 canonical Skill |

## 延伸阅读

- [Wang et al., Voyager (arXiv:2305.16291)](https://arxiv.org/abs/2305.16291) 原始 Yetenek-kitaphane 论文
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) becerilerin 2026 产品化形态
- [Anthropic, Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)  praktikadaki beceriler ve alt görevliler
- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651)Voyager'ın alt katındaki iyileşme döngüsü
