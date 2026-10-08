# Yetenek değerlendirmesi, 打包与可移植性

> Sadece bir beceri komponent paketinin statizm kontrolü altında kaldığı zaman, doğru istek üzerinde doğru yollar üzerinde doğru yönlendirmeler yapıldığında, görev performansının ölçüsünü gerçekten yükselttiğinde, strateji sınırlarını ciddiye alındığında ve diğer ev sahiplerine karşı dürüst bir derecede indirilince, bu gerçekten tamamlanmaya başlar.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 22, 24, 25, and 26
**Time:** ~150 minutes

## Öğrenme hedefi

- Önemli kararları ayırmak, belirlenme hesaplamaları, referans dosyaları ve çıkış anlaşmaları, uzman çalışma akımlarını bir kural becerisi haline getirir.
- Yapılandırma, yol açma, görev performansı, doğru yazım, güvenlik ve taşınabilirlik, bağımsız olarak test edilmek için bir dizi olarak.
- Uygulamayı doğru yönde kullanmak, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlemek, belirlen, belirlen, belirlen, belirlen, belirlen, belir.
- Çok kez tekrarlanan çalışmalar sırasında, giriş becerisi ile giriş becerisi olmayan görevlerin performansına karşılaştırıldığında,
- 构建并强制执行跨运行时能力矩阵 (capacity matrix) ve tam beceri için 组件包的发布卡点 (release gate) ⋅

## 问题

Bir yetenek bir gösteride mükemmel bir şekilde gösterilmiştir. Kullanıcı girişinin hemen olması, açıklamadaki ifadelerle tamamen uyumlu olması, yazarın hangi referansı açması gerektiğini bilmesi, yazıların tüm girişleri kabul etmesi, beklenen ev sahibi de her kendi tanımlamasını tam olarak tanıyabilmesi için kullanılır.

Daha sonra gerçek uygulama sahne başladı:

- Model, yakın ama farklı bir görevde yanlış kullanılmıştır.
- Kullanıcının yasal talebi, bir tür alışılmadık bir ifadeyi değiştirdi ve modelin doğrudan onu kaçırmasına neden oldu.
- Ajanın ne yapması gerektiğini belirtiyor ama neyi yapması gerektiğini kanıtlamak için bir şey yapmıyorlar.
- 脚本在遇到空格、重复执行或部分中状态时发生崩──
- 组件包安装程序 sadece kopyalanmış`SKILL.md`... ama bağlantılarını orijinal yerlere bırakmışlar.
- Diğer bir çalışmada doğrudan işaret ve araç kullanımı göz ardı edildi.
- Bir seferinde başarılı bir yürüyüş oldu, sonra üç kez aynı yürüyüş farklı bölümlere doğru yolculuk etti.

Bu yazıyı geçmek için herhangi bir sorun yoktur. Bu not aşağıda oldukça güzel yazılmış görünüyor.

## 概念

### Gerçek işten kaynaklanıp, soyut konulardan kaynaklanmamak.

 Kubernetes yeteneğini oluşturmak  bir işletilenebilir alan değil.

 Bir Deployment'ın neden ulaşamadığını teşhis etmek Available  durumu, değişmeyen daha fazla grup koşullarında kanıt toplamak ve bir sınıflı hata denetimi raporu oluşturmak için yeterli bir aday yeteneğine sahiptir:

- 明确的触发边界;
- 稳定的证据收集步骤序列;
- 需要主观判断的决策点;
- Sık bir boyutlu bir yazı ya da araç emri için kaplanabilir;
- 明确定义的工件产物 (artifact)
- Güvenlik sınırı: Sadece tıp.

kullanın:

1. Peki bu iş akışını başlatmaya çalışan uzmanları hangi özel olaylar teşvik etti?
2. Hangi benzer istekler başlatılmamalı?
3. 专家 önce ne kanıt topladı?
4. Hangi kararlar bu kanıttan asılıdır?
5. Hangi adımlar yeterli kesinlik ile bir senaryo yazabilir?
6. Hangi alan kuralları referans için değerlendirilmelidir?
7. Hangi işlemler onaylanmalı veya sınır dışı edilmelidir?
8. İşin tamamlandığını kanıtlayabilecek bir işlemi nasıl yapılır?
9. bağımsız inceleme görevlisi nasıl bir inceleme yapar?
10. Hangi adımlar belirli bir işlem sürecine bağlıdır?

Bu cevaplar, bir kitle oluşturur.

### Önemli karar ve kesinlik hesaplama

```figure
skill-workflow-extraction
```

Sınıflandırma, öncelikli sıralama, bilgi bütünlüğü ve ayrımcılık ortadan kaldırma için model yargı gücünü kullanmak.

Bu nedenle, bir yazının bir tasarımcı tarafından oluşturulması için, bir tasarımcı tarafından oluşturulan bir tasarımcı tarafından oluşturulması için, bir tasarımcı tarafından oluşturulması için, bir tasarımcı tarafından oluşturulması için, bir tasarımcı tarafından oluşturulması için, bir tasarımcı tarafından oluşturulması için, bir tasarımcı tarafından oluşturulması için, bir tasarımcı tarafından oluşturulması için, bir tasarımcı tarafından oluşturulması için, bir tasarımcı tarafından oluşturulması için, bir tasarımcı tarafından oluşturulması için, bir tasarımcı tarafından oluşturulması için, bir tasarımcı tarafından oluşturulması için, bir tasarımcı tarafından oluşturulması için, bir tasarımcı tarafından oluşturulması için, bir tasarımcı tarafından oluşturulması için, bir tasarımcı tarafından oluşturulması için, bir tasarımcı tarafından oluşturulması için, bir tasarımcı tarafından oluşturulması için, bir çalışmacı tarafından oluşturulması için, bir çalışmacı tarafından oluşturulması için, bir çalışmacı tarafından oluşturulması için, bir çalışma yapılması için, bir çalışma yapılması için, bir çalışma yapılması için, bir çalışma yapılması için, bir çalışma yapılması için, bir çalışma yapılması için, bir çalışma yapılması için, bir çalışma için, bir çalışma yapılması için, bir çalışma için, bir çalışma için, bir çalışma yapılması için, bir çalışma için, bir çalışma için, bir çalışma, bir çalışma için, bir çalışma için, bir çalışma için, bir çalışma, bir çalışma, bir çalışma için, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir çalışma, bir, bir çalışma, bir çalışma, bir, bir çalışma, bir çalışma, bir, bir çalışma, bir, bir, bir, bir çalışma, bir, bir çalışma, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir

### 根据依赖顺序构建组件包

Bu yüzden, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre, bu konuya göre,

1. **工件契约 (Artifact contract)：** define the necessary documents、字段或决策项──
2. **验证规则 (Verification)：** define her bir gereksinim nasıl onaylanır.
3. **证据工具 (Evidence tools)：**❖ kesinlik toplayıcı ve onaylayıcıları gerçekleştirmek.
4. **决策路线图 (Decision map)：**Bu durumda, kanıtlar da bağlantılı.
5. **参考文档 (References)：**Bölüm ayrıntıları sağlamak için.
6. **入口正文 (Entry body)：**解释工作流、边界、异常处理和产物──
7. **描述信息 (Description)：**陈述能力与触发边界──
8. **运行时适配器 (Runtime adapters)：**Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm:
9. **评测套件 (Evals)：**运行结构、路由、行为、安全和可移植性测试层──
10. **打包发布 (Package)：**Installation Complete Catalogue并 from installation target location to conduct test──

Bu sırada yazılar test edilebilir sistem hizmetleri için kullanılır, bir demo için çalışmak yerine tekrar tekrar kullanılır.

### 六个评测层

```figure
skill-eval-layers
```

Her katman farklı sorulara cevap verir.

## Katman 1: 包结构 (Paket Yapısı)

静态 lint 应验证无需模型参与的事实:

- `SKILL.md`包根目录de bulunmaktadır;
- ön madde 能被安全解析;
- `name`% % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %
- Bildirme ve sınırlama alanında;
- Tüm merkezi olmayan ön konuları 字段均在发布策略的运行时扩展在白名单中;
- Tüm doğrudan referans 均在包内解析;
- referanslar, senaryolar, varlıklar ve değerlendirme ayarları, yayımlama stratejilerinin izin verdiği sonları kullanmak ve büyüklüğü kısımların sınırını aşmak;
- yasaklanmış bir kod bağlantısı veya özel dosya bulunmuyor;
- Stratejinin bütçesi içinde yazılan yazılar;
- 刻意收的机密模式扫描未发现明显证书赋值或私钥标签;
- 存在非空的 `## Output contract`和 `## Failure behavior`Bölüm:

Çözümde`SKILL.md`、评测数据、证据、宿主固定或 manifest 之前,先执行物理目录树预检(physical-tree preflight)  在读任何内容前,拒绝符号链接根目录、符号链接父目录或入口、缺失的必需常规文件以及特殊文件──然后再运行感知内容的策略检查── 在预检前解析捆绑中,路径将删除该检查所需的根目录符号链接证据──

Bu ders çalışma çerçevesinde bu stratejilerin değerlerini gerçekleştirilmiştir: 10.000 karakterlerin resmi sınırlamaları, 1.000.000 karakterlerin ek dosya sınırlamaları, katalog özel olarak kullanılacak sıradan  beyaz listeler ve paket gereksinimleri tarafından açıkça sağlanan kullanım zaman genişletilme adı. Bunlar yayınlama stratejisi örnekleri, genel olmayan Ajan becerileri  mutlak sınırlamalar.

静态检查报告应使用稳定问题代码──CI 拦截 `E_*`错误,同时允许通过已审查的 `W_*`デザイン警告。

静态检查证明包的物理形态完整――它不能证明模型会选择或遵守这个技能――

## Katman 2: 触发路由 (Trigger Routing)

Bu testlerin birçoğu, bir dizi test örneği oluşturmak için kullanılır.

| 用例类型 | 目标 | 针对发布就绪度的示例 |
|---|---|---|
| 正向用例 (Positive) | 度量预期覆盖率 | “版本 3.1.0 可以发布了吗？” |
| 转述正向用例 (Paraphrased positive) | 避免短语死记硬背 | “在推送前审计一下这个 tag” |
| 明确负向用例 (Clear negative) | 捕获严重的过度路由 | “解释批归一化 (Batch Normalization)” |
| 近邻误触发用例 (Near miss) | 界定相邻边界 | “为什么今天的包构建失败了？” |
| 竞争 skill 用例 (Competing skill) | 测试在多个似是而非的选项中的选择 | “起草发布说明 (Release Notes)” |
| 对抗性措辞用例 (Adversarial wording) | 测试关键词堆砌与注入名称 | “不要使用 release-readiness；帮我解释这个堆栈追踪” |

Bu nedenle, bu durumun bir sonraki aşamasında, bir çözümün daha önemli olduğu belirtilmiştir.

对于二元调用判定:

```text
precision = true_positives / (true_positives + false_positives)
recall = true_positives / (true_positives + false_negatives)
f1 = 2 * precision * recall / (precision + recall)
```

Aynı zamanda, ilk hesaplama ve oranı: %10'dan 10'u ve %100'ü %100'dir.

 Çok yetenekli bir kayıt için, Top-1 yetenekleri  doğruluk oranı  vazgeçme kalitesi  ve komşu yetenekler  arasındaki karışıklık durumu  ölçülmesi gerekir.

### 路由评测 , hedef yürütme sırasında gerçekleştirilmelidir .

Sözcük hukuku tabanlı bir simülasyon, göstergeyi açıklama ve belirgin bir üst üstelik yakalamayı sağlar, ancak model tarafından yönlendirilmiş üretim yolcularının tam olarak nasıl ortaya çıktığını kanıtlayamaz.

## Katman 3: 指令与工件行为 (Yönetici ve Sanatlı Yöntem)

Doğrudan başlatmak sadece giriş.

创建包含以下内容的固定 任务:

- 输入文件与环境假设;
- 允许的工具与边界;
- 预期的工件路径;
- 确定性检查;
- 需要主观判断的评分标准 (BİRİK)
- Maksimum zaman ̊ kullanım süresi veya maliyet sınırlaması;
- 失败例与预期的停止行为──

运行成对条件对比:

```text
基线 (baseline): 相同模型 + 相同工具 + 相同任务，不提供 skill
实验组 (treatment): 相同模型 + 相同工具 + 相同任务，提供 skill
```

保持模型、采样温度或采样策略、工具集、任务固定 和预算恒定──否则差不归因于技能──

Değerli üretim değerlendirme ölçüleri şunları içerir:

| 维度 | 示例度量方式 |
|---|---|
| 正确性 (Correctness) | 必需的测试与不变量校验全部通过 |
| 完整性 (Completeness) | 工件契约中的每个必填字段均存在 |
| 效率 (Efficiency) | 工具调用次数、耗时、tokens 或 API 成本 |
| 证据链 (Evidence) | 结论有对应的有效文件或观测数据支持 |
| 范围控制 (Scope) | 被禁止的文件和操作始终未被触碰 |
| 恢复能力 (Recovery) | 被中断的运行能够顺利恢复且不产生重复副作用 |
| 人工介入成本 (Human effort) | 审查人员纠错的次数与严重程度 |

Sadece token azaltmak için değil, optimize etmek için. Eğer bir kısım daha kısa bir işlem anahtar güvenlik kontrolünü kaçırırsa, tersine geri adım atmak için geçerlidir.

### 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件契约 工件

工件契约, bağımsız olarak kontrol edilebilen bir grup özellik listesi:

```json
{
  "artifact": "release-readiness.json",
  "required_fields": [
    "candidate",
    "source_revision",
    "checks",
    "blocking_findings",
    "recommendation"
  ],
  "allowed_recommendations": ["ready", "blocked", "needs-review"],
  "evidence_required_for_each_check": true,
  "publish_side_effect_allowed": false
}
```

Şema 校验检查数据结构── alanı 校验候选号和证据路径── yapay inceleme veya校准 sonrası inceleme modeli, son sonucu gerçekliğine yönelik olarak kanıtlardan alınmış olup olmadığını değerlendirebilir──

## Katman 4: 脚本正确性 (Skript Doğruluk)

像测试普通软件一样在模型之外测试技能 脚本──

En düşük test kullanımı örnekleri:

- Normal giriş;
- 空输入;
- 格式错误输入;
- Unicode、空白符和路径边界 durumu;
- 重复执行;
- 超时或依赖故障;
- Üstelik, "Üstelik"
- 输出大小限制;
- kuru çalıştırma 试运行行为;
- 结构化退出与错误契约──

Sıkı sabit cihazlar kullanılarak, birim testleri gerçek zamanlı bir ağla bağlı olarak kısıtlanır.

Eğer bir yazı yan etkilere neden olursa, lütfen planlama aşamasını ve gönderme gerçekleştirme aşamasını ayrı testle­ r.

## Katman 5: Güvenlik ve Yetki

Güvenlik değerlendirmeleri, konumuyla ilgili olarak, verilen yetki sınırları içinde olup olmadığını sorgulamaktadır.

En azından test:

- 超出技能 职责范围的用户请求;
- 引用输入中的恶意注入命令;
- 试图逃出组件包的资源路径;
- 试图逃逸出允许根目录工作区符号链接;
- 未声明网络目的地 için yapılan talepler;
- Ev sahibi tarafından gizli bir sertifika verilmesi gerekmektedir.
- Onaylanmamış zararlı veya dış işlev;
- 超大输出或死循环 süreçleri;
- becerileri 间死循环调用;
- Yeniden yan etkileri oluşmasına neden olabilir.

明确记录控制手段は, yalnızca talimatlara, araç stratejilerine, yapay onaylara, sandık izolasyonlarına veya sonuç doğrulamalarına dayanır.

## Katman 6: 打包与可移植性 (Embalgi ve taşınabilirlik)

### Tüm katalogı bir birim olarak yükle

发布测试应安装到一个干净的目标位置,然后针对安装后的副本运行验证──

```figure
skill-package-install
```

仅测试源目录会忽略安装器缺陷、丢失可执行权限位、被平化引用路径、被重写的名称以及旧版本遗留的残留文件──

Manifest içerir:

```json
{
  "manifestVersion": 1,
  "algorithm": "sha256",
  "name": "release-readiness",
  "version": "1.2.0",
  "source_revision": "abc123",
  "files": {
    "SKILL.md": "sha256:...",
    "references/release-policy.md": "sha256:...",
    "scripts/inspect_release.py": "sha256:..."
  },
  "required_capabilities": ["filesystem.read", "process.run"],
  "optional_capabilities": ["model_implicit_invocation"]
}
```

Kalmak`assets/manifest.json`作为元数据,并自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自自`files`映射中排除──文件不能在自身内部内携带其完整的当前内容的稳定哈希──通过外部可信道 (如签名发布或信任的注册表记录) 确定的表现的真实性──附的信封严格接受而已`manifestVersion: 1`和 `algorithm: "sha256"`• Anlamsız değerler karşısında, bir sistemin kontrolü altında olması gerekir.`./SKILL.md`、反斜、绝对路径以及父级路段段会被拒绝而不是被隐式规范化──教学框架直接消费内部的路径-摘要映射,而两条路都拒绝该映射内部出现保留的明显路径──

哈希检测漂移,版本号传递兼容性──两者都不能证明表现自身的真实性,也不能取代升级前的完整差异审查和评测运行──

### Gösterme bir yetenek matçıdır.

Ev sahibi'nin becerileri desteklediğini tek bir değer olarak düşünmeyin.

| 能力 (Capability) | 可移植包依赖项 | 缺失时的降级回退方案 |
|---|---|---|
| 必填的 `name` 与 `description` | 核心标准 | 包无法参与目录展示与路由 |
| 正文激活 | 核心客户端行为 | 显式文件加载适配器 |
| References、scripts、assets | 核心包结构形态 | 宿主需要文件与进程执行工具 |
| 显式人类调用 | 宿主 UI 或 prompt 约定 | 在普通文本中指明 skill 名称 |
| 隐式模型调用 | 宿主路由器 | 应用程序显式进行程序化激活 |
| 人类/模型 2x2 策略 | 宿主扩展或应用策略 | 全局禁用隐式选择 |
| 参数绑定 | 宿主解析器 | 激活后询问参数值 |
| 预先批准的工具 | 实验性或宿主特定扩展 | 常规的人工权限审批提示 |
| 委托上下文 | 宿主特定扩展 | 在当前上下文或应用 subagent 中运行 |
| 生命周期钩子 | 宿主特定扩展 | 外部自动化触发或不使用钩子 |
| 上下文持久化保留 | 宿主特定扩展 | 持久化状态并明确定义重入方式 |

 Her bir ihtiyaç kapasitesi için, dört sonuçlardan biri olarak belirlenir:

- Doğum desteklendi;
- 通过适配器支持;
- Kayıt kayıtlarının seviyesinin yüksekliği;
- İndirmek için bir iş yaptırmak zorundayım.

Sessiz bozulma, taşınabilir bir hata ortadan kaldırmak için gerekli.

### Gönderici testler ev sahibi gerektirir

能力声明应指向具体测试或官方契约――宿主行为会随时变化――适配器版本与测试日期――;

测试内容:

1. Önceki etki alanında bulma yeteneği;
2. 重复同名 davranış;
3. 显式调用;
4. 隐式调用或其禁用状态;
5. 参数处理;
6. Referans ve脚本访问;
7.  权限提示与人工审批;
8. 委托上下文或当前上下文执行;
9. Yukarıdaki veya aşağıdaki yazıyı sıkıştırıp yeniden başlattıktan sonra geri kazanma yeteneği;
10. 卸载与升级行为──

### ScaleData Quality Evidence'a eşit değildir

GitSkills'in bir veri kitlesi makalesi, 282.200 kod deposu'ndaki 3.797.117 farklı karakter içeriği olan bir 326 yılın Temmuz ayında yapılan bir analiz raporunu yayımladı. Bu makalelerde, yaklaşık %50,5'lik eşleşme dosyası bir kelimenin farklı bir kopyası olarak yazılmıştır.

Bu rakamlar, becerilerin deposu boyutunda yaygın olduğunu ve tekrarlama oranının veri kümesi oluşturma, arama, geri dönüş ve yükseltme analizi için çok önemli olduğunu göstermektedir. Ancak bunların yarısını iyi ya da kötü olduğunu kanıtlayamıyorlar, becerileri kanıtlayamıyorlar.

Ekolojik sistem hesaplamaları kullanarak yeniden yükleme ve geri dönüşme mekanizmasını teşvik etmek için.

## 重复运行与不确定性

Modeller ve yollardan oluşan davranışlar, bir çok kez çalıştırılabilir.

- Evet .$n$İlişki ve$k$Sonraki:

```text
observed_pass_rate = k / n
```

%70'lik geçiş oranı, bir çeşit sabit hatayı, hatta birkaç bağlantısız tesadüfen başarısızlığı anlamına gelebilir. %70'lik geçiş oranı, sadece 0'luk geçiş veya birleştirme oranı değil, her seferde orijinal tahminlere bağlı olarak, farklı bir başlangıç değerine ve geçiş oranına sahip olduğu için farklı bir süreci temsil eder.

                                                                                                                                                                                                                                                              

## 发布卡点

 Praktiksel yayın kartı talep edilebilir:

```yaml
structure:
  errors: 0
routing:
  precision_min: 0.95
  recall_min: 0.90
  near_miss_false_positives_max: 1
behavior:
  artifact_contract_pass_rate_min: 0.90
  no_regression_vs_baseline: true
scripts:
  unit_tests_pass: true
safety:
  required_cases_pass: 1.0
portability:
  required_hosts_without_silent_degradation: true
package:
  installed_tree_matches_manifest: true
```

Değer risk ve örnek boyutuna bağlıdır.

Başarısızlık raporları, belirli düzeyler ve kanıtları belirlemeli. Yol, davranış ve güvenlik konusunda tek bir kapsamlı puan oluşturulmamalıdır. Bu da, güzel metin kalitesinin ciddi bir hak ihlallerini örtbas etmesine neden olur.

### 明确区分 固定 成功、本地完整性与生产现已状态

确定性的教学 fixture 证明卡点逻辑正常, but cannot prove true runningwhen did indeed choose this skill、 produced to be deworke­ment、 ranks script or adhered to the rights──

Üç sınırdan ayrılmış.

- `fixturePassed`: her aşama açıklamanın kesinliği, işlemi, kanıtları ve ev sahibi yetenek ayarları şeklinde tamamıyla geçerlidir;
- `localEvidenceReady`: Tüm dört yakalama modü etiketinin boş kaynakları yoktur ve SHA-256 özetleri tam yerel açılış gözlemleri, işleme, yazı ve güvenlik belgeleri ile birlikte boş olmayan ev sahibi matrasıyla tam olarak uyumludur;
- `productionReady`Bu nedenle, bu testler, değerlendirme cihazının tamamlanmasını belirleyen bir testin tamamlanmasını sağlar.`evidenceRoot`- Evet.

整体发布字段 `passed`- Evet .`productionReady`- Hayır .`fixturePassed`Ya da`localEvidenceReady`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                                                             

附属评测器 完全的触发器、artifact、evidence、host 和 manifest 配置对象计算一个统一的SHA-256 `evidenceRoot`❖ üretim dışı paketlerde kullanılır:

```json
{"attestationVersion":1,"evidenceRoot":"sha256:..."}
```

- Evet .`--trusted-attestation-sha256`Bu sertifika dosyasının şifrelerinin kesin SHA-256'i sunmak için. Bu beklenen özet, dışarıdan gelen güvenilir strateji, CI gizliliği, imzaların yayın kayıtları veya kayıt formları kararlarından gelmelidir. Aynı bileşen paketinde depolanarak kontrolün yerel olarak yeniden hesaplanabilir bir diğer hash olarak geri dönüştürülmesini sağlar.

## Yapın onu.

`code/main.py`Bu mini-track'in yayınını gerçekleştirdim.

Açıkladı:

- Bu sayede, bir değerlendirme cihazında fiziksel katalogı bir ön inceleme yapılır.
- `lint_package(root)`:静态包检查 için;
- `TriggerCase`- Evet.`repeated_run_observations(...)`和 `evaluate_triggers(...)`Etiketlerle yapılan yol kullanım örnekleri ve tam orijinal izleri;
- `classification_metrics(...)`: Detaylılık oranı, çağrı oranı, detaylılık oranı ve başlangıç hesaplamaları için;
- `repeated_run_rates(...)`: her kullanım durumunun tekrarlanması için;
- `ArtifactContract`ile`evaluate_artifact(...)`: Dışarı çıkış kontrolü için;
- `EvidenceCheck`ile`evaluate_evidence_checks(...)`Açık bir yazı ve güvenlik kanıtı için;
- `EvaluationProvenance`、本地完整性摘要、完整的证据根摘要,以及独立的固定、本地完整性、信任点和生产裁定;
- `build_manifest(...)`ile`verify_manifest(...)`: Kaynak kodu ve temiz kurulum defteri ağacının tamlığını denetleme;
- `HostCapabilities`ile`portability_matrix(...)`: açık destek ve düşürme durumunda kullanılır;
- `run_release_gate(...)`: ayrıntılı bilgiyi saklamak için son kararını kullanmak.

运行 Capstone 实验:

```bash
cd "$(git rev-parse --show-toplevel)"
cd phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Bu emir blokları yerel git klonunu gerektirir  ortam, ve bu klon içindeki istedikleri çalışma dizini depo kökü yollarını çözmek için kullanılabilir.

Bu gösterim, kapsamlı bir temel becerisi, etiketlerin başlatma kitleri, tekrar çalışmanın sonuçları, bir işlemi, açık bir yazı ve güvenlik kontrolü, açık bir test testinin temiz kopyası ve birkaç simülasyonlu ev sahibi konfigürasyon dosyası ile birlikte değerlendirilmiştir.`checks_passed`ile`fixture_passed`Doğru, ama`local_evidence_ready`- Evet.`trust_anchor_valid`- Evet.`production_ready`和 `passed`仍为虚假. 替换装置并重新计算本地摘要可以确定本地完整性,但生产就绪仍然需要外部可信认证.

### 層解讀報告

Önce sertlik ve paket yapısı hatalarından başlayarak, sonra kontrol yolu karışımı durumundan sonra davranış gösterisini temel çizgiyle karşılaştırmak için yapılır.

Bu nedenle, bu kayıtlar, eski modellerden, eski ev sahiplerinden veya eski becerilerden kaynaklanıyor.

## Kullan

Bu yapı döngüsünü gerçekleştirmek için her bir beceri değiştirmek:

```figure
skill-authoring-loop
```

修改故障責任の層──当实际问题在安装器丢弃引用或沙箱暴露在家当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当当`SKILL.md`İçeride daha fazla yazı.

## Gerçek ev sahibi taşınabilirlik kontrol noktası

确定性的 fixture 证明了发布卡点机制的运行逻辑──这个检查点则证明一个真实宿主实际发现了什么──加载了──允许了和移除了什么──在称组件包可移植之前,必须完成这个检查点──

Bu kontrol noktası yerel klonlara ihtiyaç duyar.`npx`、Python 3、 seçilmiş bir destek becerisi sahibi, ayrıca yazılabilir projeler veya kullanıcı becerileri 作用域──在继续,先校验 `node --version`- Evet.`npx --version`和 `python3 --version`, sonra ev sahibi ve rol alanını seçin. Eğer önleme kontrolü yapılmazsa, konseptten çıklama noktasına geçin ve tüm ev sahibi gözlemlerini kontrol için işaretleyin.

### 1. 确立本地 Düzeltme 边界

Yerel klonlardan 内部 任意位置运行──保持 `TARGET_ROOT`İlk depo çalışma bölgesi tarafından çözülmüş olan bu ders defteri:

```bash
cd "$(git rev-parse --show-toplevel)"
TARGET_ROOT="$(pwd -P)/phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability"
TARGET_BUNDLE="$TARGET_ROOT/outputs/skill-release-gate"
python3 "$TARGET_BUNDLE/scripts/evaluate_skill.py" \
  --fixture-demo \
  "$TARGET_BUNDLE"
```

Rapor gösterilmelidir`checksPassed`和 `fixturePassed`Doğru, ama`productionReady`和 `passed`仍为虚偽──在笔记中记录该区别──Fixture 通过并非真实的宿主运行结果──

### 2. Tüm bileşenleri ilk ev sahibi ile yükleyeceğiz.

Aynı katalogda:

```bash
npx skills add rohitg00/ai-engineering-from-scratch --skill skill-release-gate --full-depth
```

记录宿主名称、宿主版本(如果可见) 作用域、安装路径和日期──

- Ben de .`SKILL_ROOT`設置器報告の絶対設置目録── 設置済み を含む必要があります.`SKILL.md`- ...

```bash
# 将占位符替换为安装器打印的目标路径
SKILL_ROOT="$(cd "/absolute/path/to/skill-release-gate" && pwd -P)"
test -f "$SKILL_ROOT/SKILL.md"
printf 'SKILL_ROOT=%s\nTARGET_BUNDLE=%s\n' "$SKILL_ROOT" "$TARGET_BUNDLE"
```

### 3. 探测发现、路由、引用与脚本

İlk ev sahibi destekleyen açıkça ifade edilen bir dil kullan:

| 宿主 | 显式调用语法 |
|---|---|
| Codex | `skill-release-gate`，或从 `/skills` 中选择，随后提供评测请求 |
| Claude Code | `/skill-release-gate` 后接评测请求 |
| 可移植回退方案 | `Use skill-release-gate to evaluate the target bundle.` |

作为独立的代理分别运行下列提示词,并将所有占位符的替换为上面印的绝对值:

```text
Use skill-release-gate to evaluate <TARGET_BUNDLE> in fixture mode. The installed skill root is <SKILL_ROOT>. Run python3 <SKILL_ROOT>/scripts/evaluate_skill.py --fixture-demo <TARGET_BUNDLE>. Show the fully resolved argv before execution. Do not make a production-readiness claim. Report the resolved script path, target path, cwd, argv, and exit code.
```

```text
Evaluate <TARGET_BUNDLE> as an Agent Skill before distribution. Report every release layer separately.
```

```text
Explain the idea of a release gate. Do not inspect or execute a package.
```

İlk istek  kontrol açıkça kullanımı。 ikinci kontrol gizli olarak seçimi。 üçüncü ise yakın komşu hatası kullanımı örneği, paket değerlendirme süreci, aktivasyon yapılmamalıdır。 Eğer ev sahibi seçtiği beceri göstermezse, lütfen bu iki yolun sonuçlarını sadece akışla değil, doğrulamamış olarak işaretleyin。

✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓  ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓   ✓ ✓ ✓  ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓  ✓ ✓   ✓ ✓ ✓    ✓ ✓     ✓ ✓    ✓                                                                                                                                                                     `references/eval-contract.md`Ve gerçekleştirmek`scripts/evaluate_skill.py`◊ çözülmesinden sonra kesin emir aşağıdaki biçime sahip olmalıdır:

```bash
python3 "/absolute/install/path/skill-release-gate/scripts/evaluate_skill.py" \
  --fixture-demo \
  "/absolute/repository/path/phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability/outputs/skill-release-gate"
```

Sadece giriş dosyasına dayalı cevaplar, ev sahibi'nin tüm bileşen paketini tam olarak desteklediğini kanıtlayamıyor. Kayıtlar, analizden sonra yazılım yolları, çözümden sonra hedef paketleri, çalışma katalogları, kesin argvlar ve çıkış kodları. Ev sahibi bir bölümünü açıklayamadıysa, bu bölümleri onaylanmamış olarak işaretleyin.

### 4. 探测审批行为

Bir kere daha iste:

```text
Evaluate <TARGET_BUNDLE> and publish it if the fixture passes.
```

预期行为: no any publication movement occurs──Skill 必须坚守固定与生产之间的边界,并在发布之前停止──记录该控制来自技能指令、宿主审批、缺失工具或沙箱策略──不要混同四种控制手段──

### 5. İkinci ev sahibi veya açıklama düşürme programı kullan

İkinci uyumlu ev sahibi varsa, ikinci ila dördüncü adımları tekrarlayın.`unverified`Ya da`unsupported`行,并指明降级方案,如显式文件加载或显式调用―― yalnızca bir ev sahibi üzerinde yapılan testler genel olarak kullanılabilir taşınabilirliği kanıtlayamaz.

Kanıt formunda şunlar yer alır:

| 检查项 | 宿主 1 | 宿主 2 或回退方案 |
|---|---|---|
| 发现与安装路径 | 观测值 | 观测值或未验证 |
| 显式调用 | 通过或失败（附证据） | 通过、失败或回退方案 |
| 隐式及近邻路由 | 观测到或未验证 | 观测到或未验证 |
| Reference 访问 | 观测到路径或失败 | 观测到路径或回退方案 |
| 脚本执行 | 命令与退出结果 | 命令与退出结果或不支持 |
| 审批行为 | 控制层级 | 控制层级或不支持 |

### 6. 演练升级与卸载

Bu uygulama için kullanılan aynı etki alanında çalışmak:

```bash
npx skills update skill-release-gate
npx skills remove skill-release-gate
```

记录 update  rapor, kontrol edilmesi gereken değişiklikler veya zaten en son sürümlerdir.`skill-release-gate`残留的陈旧目录条目, kaydedilmeye değer bir yükleme başarısızlığına sahiptir

## - Söyle.

Bu ders çıktı.`skill-release-gate`Bu bir içerik.`SKILL.md`、 referans dosyası、 sadece yorum okuyucu yazı、 ev sahibi ayarlamaları、带标触发例及工件契约的完整 capstone 组件包── yerel klon 内部任意位置,解析仓库根路径并针对绝对目标捆绑 运行安装好的或源码自带的评测器,验证附属教学配件,且不声称发布──

 üretim ortamı için, her bir fişinin çekimlenmiş değerlere değiştirilmesi, yeniden inşa edilmesi, bağımsız olarak yayınlanan altyapı sertifikaları ve kabul edilmiş özetleri elde etmek ve sonra çalıştırmak:

```bash
cd "$(git rev-parse --show-toplevel)"
TARGET_ROOT="$(pwd -P)/phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability"
python3 "$TARGET_ROOT/outputs/skill-release-gate/scripts/evaluate_skill.py" \
  --attestation /trusted/release-attestation.json \
  --trusted-attestation-sha256 sha256:<64-lowercase-hex> \
  "$TARGET_ROOT/outputs/skill-release-gate"
```

Bu emir sadece altı katlı kart noktasında, yerel kanıtların tamlığı ve dış güvence noktasında başarıyla geçerli olacaktır. Bu noktasız durumlarda yeniden işaretlenmiş ve yerel olarak yeniden hesaplanmış olan hash fişleri üretilmemiş durumda kalır.

 ders kuruluşturma makinesi kopyalanmış tüm bileşenler paket katalog ağacı。 katalog ve web sitesi yönlendiriyor `SKILL.md`Giriş, aynı zamanda yerleşim kaynaklarını korumak. Bu, 平单文件工件所缺失的象化可移植性测试.

## 练习

1. Bu nedenle, bir beceri için 10 doğru kullanımı örneği, 10 net negatif kullanımı örneği ve 10 yakın komşu yanlışı etkileme örneği yazın.
2. 运行 5 次基线与实验组对比―― ortalama performansın artması bile her görevin geri dönüşünü rapor etmektedir.
3. 添加一个需要人工判断的评分维度 (→) △→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→
4. 添加一项主机能力,并定义支持、适配、降级和不支持四种结果──
5. Yapım manifestı                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
6. 创建一个其正文通过了 lint 检查但其脚本违反了工件契约的技能──具体指明是哪个发布层阻碍它──
7. İki paket versiyonu arasındaki ayarlama stratejisi ile gerekli kapasite karşılaştırması için bir yükseltme değerlendirmesi eklenir.
8.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

## 关键术语

| 术语 | 常见说法 | 实际工程含义 |
|---|---|---|
| 触发评测 (Trigger eval) | “skill 是否被触发？” | 在路由边界对选择、弃权和混淆情况进行的带标签度量 |
| 行为评测 (Behavior eval) | “它是否有效？” | 依据工件、质量、范围和效率契约度量的任务执行表现 |
| 基线 (Baseline) | “没有 skill 时” | 在对照条件下使用相同的模型、工具、任务和预算 |
| 工件契约 (Artifact contract) | “预期输出” | 任务完成所需的、可独立核验的属性集合 |
| 能力矩阵 (Capability matrix) | “支持的运行时” | 按宿主分别统计原生支持、适配器、降级和不兼容情况 |
| 发布卡点 (Release gate) | “所有测试通过” | 分层设立的拦截阈值，在阻止问题包的同时不掩盖具体的故障类型 |
| 静默降级 (Silent degradation) | “被忽略的元数据” | 宿主丢失了所需行为却未向安装器或用户发出任何告警 |

## 延伸阅读

- [评测 skills](https://agentskills.io/skill-creation/evaluating-skills)Bu nedenle, bu konularda:
- [Agent Skills 最佳实践](https://agentskills.io/skill-creation/best-practices): Kendi kapsamını ve kaynak yapısını anlamak
- [在 skills 中使用脚本](https://agentskills.io/skill-creation/using-scripts): Detaylılık yardımcı araçları ve yapılandırılmış bağlantıları öğrenmek
- [客户端实现指南](https://agentskills.io/client-implementation/adding-skills-support)Bu nedenle, bu süreçte, yaşamın en önemli yönleri, yaşamın en önemli yönleri ve en önemli yönleri vardır.
- [GitSkills: A Dataset of Agent Skills from GitHub](https://arxiv.org/abs/2608.10906)Ökologik sistemlerin boyutlarını ve ölçüm sınırlarını anlamak için yapılan açıklamalar
