# Yetenek 调用与路由

> 调用(Invocation) bir öncelikle karar vermenin ardından ilişkili bir karar vermenin bir süreci olacaktır. İyi bir açıklama, modelin seçim yapmasına yardımcı olur. İyi bir strateji, bu seçimin izin verildiğini belirler.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 24 (Skill Discovery and Progressive Disclosure)
**Time:** ~105 minutes

## Öğrenme hedefi

- 区分显式用户调用 (açık kullanıcı çağrısı) 隐式模型调用 (açık model çağrısı) 应用程序调用 (açık uygulama çağrısı)
- Bu nedenle, bu yöntemin kullanımı ve kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin ödenekleri ile ilgili olarak, bu yöntemin ödenekleri ile ilgili olarak, bu yöntemin ödeneklere göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre
- 编写包含正向触发条件和近邻误触发边界 (son sınırları) 的路由描述──
- Bu nedenle, bu süreçte, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir sürececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececece
- 适配特定运行时调用字段,同时避免将它们冒充为可移植的前材料 规范字段.

## 问题

Bir tane ayarladın.`database-migration`Uygulayıcı, bir isimle kullanabilir, ancak model de bir açıklama görebilir ve genel veritabanı sorular soran bir kişi tarafından seçilebilir.

Sen de ekledin.`user-invocable: false`Bu bölüm, kullanıcıların elden çalışmasını engellemek için kullanıldı.`disable-model-invocation: true`Bu becerinin tamamen kaybolmasını bekler. Ancak bu bölümün çalışmasını anlarken kullanıcılar hala açıkça kullanabilirler.

字段名称本身没有错.错在概念模型──用户可以看到它、模型可以选择它、应用程序可以预装它以及它的内部工具可以执行是完全独立的事实──一个名字.`invocable`Tek bir değer bu karmaşık boyutları ifade edemez.

路由也有第二种失败模式──如果描述过模糊,多技能都会显现似而非──如果描述堆了大量关键词,无关键任务也会触发它们──目录本质上是一个概率接口:既要适应下文,又要足够具体以准确路由──

## 概念

### Hayat döngüsünü başlatmanın beş yolu var.

| 主体 (Actor) | 调用形式 | 典型用途 | 主要风险 |
|---|---|---|---|
| 人类用户 (Human user) | 在 UI 或 prompt 中指明 skill 名称 | 刻意选择特定工作流 | 用户期望获得宿主并未授予的可用性或权限 |
| 模型或自主 Agent (Model or autonomous agent) | 根据任务上下文从目录条目中自主选择 | 自动触发专家流程 | 假阳性误路由（False-positive routing） |
| 应用程序 (Application) | 通过运行时代码激活或预加载 skill | 固定的产品工作流 | 对特定 host 产生隐式耦合 |
| 另一个 Skill 或 Subagent | 请求将特定 skill 作为工作流依赖 | 组合（Composition） | 循环调用、依赖缺失或上下文泄露 |
| 评测运行套件 (Evaluation harness) | 在固定测试场景下激活指定 skill | 可重复度量 | 在测试该 skill 的同时意外绕过了正在研究的生产策略 |

Gösterilebilir Ajan Yetenekleri 规范 tarafından tanımlanan yapı paketleri── bu, standartlanmış genel yollama siparişleri UI、 gizli yollama işaretleri、 uygulama API veya alt 生命周期── yoktur.

### 调用五个阶段

```figure
skill-invocation-stages
```

精准使用这些词汇:

- **Eligible（合格）**Bu yetenek için oyuncuyu istemek için.
- **Selected（已选中）**: user direct nomination, or routeı器 determination thereof
- **Activated（已激活）**:其命令已进入工作上下文──
- **Executing（执行中）**Bu talimatların altında model düşünce veya araç işletimine başlamak için bir ajanın
- **Completed（已完成）**: Output geçmiştir bağımsız başarılı bir sınavı.

Sadece kayıt .`skill_used=true`Bu, bir hastalıkla ilgili gerçek bir sonucu ortaya çıkaracak.

### 人工与模型调用 2x2 矩阵 oluşturmak

| 人类可调用 | 模型可调用 | 模式 | 适用示例 |
|:---:|:---:|---|---|
| 是 | 是 | 共享 (Shared) | 代码解释、测试规划、文档审查 |
| 是 | 否 | 仅人类 (Human-only) | 发布准备、计费数据导出、破坏性清理方案 |
| 否 | 是 | 仅模型 (Model-only) | 内部风格指南、领域参考、自动化支持流程 |
| 否 | 否 | 禁用或仅应用 (Disabled or application-only) | 分阶段发布、已废弃包、程序化预加载 |

Bu matç bir stratejik model, standart YAML değil.

某当前宿主使用 `disable-model-invocation: true`Sadece insanlık gösterdi, kullan `user-invocable: false`Sadece model kullanıyor.`agents/openai.yaml`Orta `allow_implicit_invocation: false`Bu, açıkça ayarlanmış olan ve gizli seçilen cihazları kullanmayı engelleyen bir zamanlı adaptörlerdir.

容易混的细节非常关键:`user-invocable: false`Bu, modelin bu beceriyi kullanamayacağı anlamına gelmez.`disable-model-invocation: true`Bu da  bu yetenek  yasaklanmış  değil. Sadece modelin başlatıldığı kendiliğinden seçimi kaldırırken kullanıcıların açık erişim hakkını korur.

### Açıkça konuşma öncelikli bir işlevdir.

显式调用直接提供身份标识:

```text
/release-readiness v2.4.0
```

Ya da:

```text
release-readiness check v2.4.0 without publishing
```

Önceki Codex 界面文档记录用于选择的`/skills`Ve açıkça kullanılması için taleplerde doğrudan saf beceri kullanılması.`/skill-name`Ve ayrıca, konukseverinin parametre açılış mekanizması¬nın belirli dilbilimleri¬n, menü görünümleri¬n, alıntı kuralları ve değişken açılışları da konukseverin gerçekleştirilmesine bağlıdır¬lar.

顯示要求仍需通过策略校验──指定某技能不应绕过缺失权限、工作区限制、审批卡点或运行时隔离──

### 隐式调用是描述优先 的

隐式路由 için, model başlangıçta dosya ve verileri değil tam düz metni görmektedir.

薄弱的描述(Zayıf):

```yaml
description: Helps with releases.
```

宽泛无度的描述:

```yaml
description: Use for release, version, package, build, deploy, publish, tag, changelog, GitHub, CI, or software tasks.
```

界界清晰的描述(Kötülmüş):

```yaml
description: Inspect an already prepared release candidate and produce a readiness report. Use when the user asks whether a version, tag, package, or image is ready to publish; do not use for ordinary build failures or feature development.
```

界界清晰的版本包含:

1. **能力（Capability）：**检查已准备好候选版本──
2. **输出（Output）：**Yaptığımız rapor.
3. **正向边界（Positive boundary）：**询问发布产物是否准备就绪──
4. **负向边界（Negative boundary）：**常规构建和功能开发本流程范围内不在──

İki komşu becerisi paylaşılırken, negatif yönü sınırda özellikle yararlıdır.

### 路由是带有弃权选项的分类任务

对于技能 $s$和请求 $x$Bir router'ı düşünebiliriz.

```text
score(s, x) = capability_match + trigger_match + context_match - exclusion_match - ambiguity_penalty
```

具体打分可能由LLM 判定而非算术――工程原理仍然成立: seçimin 值超越, 竞争的技能超越, 竞争的技能――证据不足时,主动弃权 ();

```figure
skill-routing-abstention
```

 Yüksek etkileme yeteneği için, hatta yazılı olarak yazılı olarak tanımlamak da uygun olmayabilir. Yalanlı yanlışı başlatma fiyatı otomatik seçimin kolaylığını aşırırsa, insanlık insanlık  stratejisi kullanılmalıdır.

### 合格性 önce sıralanmalıdır

Her bir buluşmayı bir tek yapmayın, en uygun olanı seçip sonra bu becerinin stratejisini kontrol edin. Eğer en yüksek puanın strateji tarafından engellenmesi durumunda, yanlışlıkla orijinal yeterli ama biraz daha düşük puan alan adayları düşünmeyi engelleyecektir.

隐式路由应采用以下顺序:

1.  Arayan kişi ve şu anda aktif olan ev sahibi uygulama cihazının keşfedilmiş becerilerine göre──
2. Sadece yeterli adaylara 打分。
3. Eğer en yüksek puanı yeterli bir şekilde değer ve farklılık kurallarına uygunsa, seçilir.
4. Eğer herhangi bir aday yeterli veya yeterli puanlar elde edemezse, imtina edilmelidir.

假设 `incident-triage`- Evet .`0.80`, ama ev sahibi model düzenlemeyi yasakladı.`incident-review`- Evet .`0.55`且允许模型调用──路由器应将 `incident-review`En iyi aday olarak değerlendirilmelidir.`incident-triage`, reddet, sonra hemen durdur.

Bu uygulama sırası, stratejinin değişmesini önleyebilir ve ilgili puanların kendi anlamını değiştirir.

### 路由评测需要近邻误触发例

正向例证明召回率 (yardım):

```json
{"prompt":"Is version 2.4.0 ready to publish?","expected":"release-readiness"}
```

明确负向用例证明基本精确率(精确):

```json
{"prompt":"Explain rotary position embeddings.","expected":null}
```

Yakın Yakın Yakın Yakın Yakınlık

```json
{"prompt":"Why did today's package build fail?","expected":"build-diagnostics"}
```

Yakın komşu örnekleri ve yayın becerileri paylaştı `package`和 `build`Sözcükler, ancak tamamen farklı görevlere aittir. Sadece net olarak doğru ve yanlışı olmayan kullanım örnekleri oluşturan yollar tarafından değerlendirilir.

### 参数具有三种表示形式

调用参数在流转过程中跨越多边界:

```figure
skill-argument-boundaries
```

Her sınırda, resimlerin dikkatini çekerek, metni doğrudan kod olarak kullanmayın:

- 宿主解析器决定命令语法和引号转义──
- Ürünler, ev sahibi kurallarına göre,
- Önergi sınavı gerekli parametre değer ve öntanımlı değer
- 工具调用将值转换为类型化方案并重新校验──

İlk parametreyi doğrudan shell 命令中中拼接 etmeyi tercih et.

###  uygulama 调用是显式编排

产品可以直接激活某技能,因为其业务工作流已经预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预预`pull-request-risk-review`- Evet.

Bu yol belirsizliğini ortadan kaldırdı, ancak API'ye bağımlılık oluştu. Lütfen bu tür adaptörleri taşınabilir metin dışında tutun:

```figure
skill-host-adapter
```

Bu nedenle diğer uyumlu müşteri ortamlarında bu beceriyi açtığında, hala açıklıkta kalır.

### Bilgi 间调用 is similar tool of marginal调用

假设当依赖文件发生变化时,`release-readiness`需要请求 `security-change-review`- Evet.

调用方应提供:

- 目標技能の身份識別;
- Görev ve işleme yolları arasında sınırlar;
- 预期的响应契约;
- 调用原因;
- İhtiyacın olmayan geri dönüş programı;
- En yüksek derinlik sınırlaması veya döngü kontrol kuralları:

```json
{
  "target_skill": "security-change-review",
  "task": "Review dependency changes in the candidate diff",
  "inputs": ["artifacts/release.diff"],
  "expected": "risk-report.json",
  "max_depth": 2
}
```

İkinci beceri, ilkinin içinde direkt olarak körüklenmedi. Ev sahibi onu nasıl etkinleştirmeyeceğini, ayrıca bağımsız bir çatalın içinde çalışmaya devam etmesini veya sonuçları bir araçla geri göndermeye karar vermesini belirler.

### Ünün hayat döngüsü ev sahibiyle bağlıdır .

                                                                                                                                                                                                                                                              

Gizli yaşam döngüsü varsayımlarına bağlı yazmayın. Dosya veya sınıflandırma durumunda kalıcı olarak üretilen ürünler, güvenli bir şekilde yeniden yüklenmesi için yeniden giriş güvenliğini sağlayın.

```markdown
On resume, read `artifacts/release-readiness.json` if it exists.
Revalidate the candidate commit before continuing.
Do not repeat an external write whose idempotency key is already recorded.
```

## Yapın onu.

`code/main.py`Bu strateji ve stratejiyi bağımsız bir uyarıcı olarak gerçekleştirmek için kullanılır.

Veriler şunları içerir:

- `Actor`: İnsanlara, modellere, bağımsız ajanlara, uygulamalara, becerilere ve değerlendirme süsülerin kullanımı için;
- `SkillMetadata`: Yol kimliği için kullanılır;
- `InvocationPolicy`: İnsan/model矩阵 için;
- `InvocationRequest`ile`InvocationDecision`: takip edilebilir giriş ve karar sonuçları için;
- `CorePolicyAdapter`: Ev sahibi olmayan genişletilmiş taşınabilir davranışlar için;
- `ExtensionPolicyAdapter`: İşlemleri tanımlamak için;
- `build_invocation_matrix(policy)`: 2x2 视图 oluşturmak için;
- `route_request(skills, request, adapter)`Seçim ve reddedilmeden önce önce geçerlilik geçişleri için kullanılır.

运行实验:

```bash
cd phases/13-tools-and-protocols/25-skill-invocation-and-routing
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Bu gösteride matçlar, ayrıca açık insanlık, gizli model, bağımsız ajan, uygulama, beceri kombinasyonu ve değerlendirme takımlarına yönelik karar sonuçları yer alır. Bu gösteride, genişletilmiş adaptör sonuçları, yeterli seçeneklerin sıralanmasından önce, stratejik olarak engellenmiş sözcüğlerin en yüksek uyumluğunu nasıl kaldırıldığını gösterir. Ayrıca, kesin bir isim ve siyahlık içerir. Bu gösteride model API'nin gerekmediği belirlenme yönlendiricilerinin varlığı, stratejik sınırları kontrol edilmesi için, sözcüğün uyumlu olduğunu iddia etmek yerine, mevcut üretim seviyesindeki modellerin yönlendirme davranışlarını yeniden canlandırmak için kullanılır.

### Neden çekirdek strateji ve genişleme adaptörü ayrı olmalıdır ?

Eğer bir çözücü, gözden geçirilmiş her bir ön maddeye özel bir anlam verirse, bu durum, geçerli olduğu zaman, yanlış genel standartlar olarak kabul edilir.

`CorePolicyAdapter` Sadece uygulamaların açıkça sağladığı stratejileri kullanmak.`ExtensionPolicyAdapter`则识别明确一组主段,并记录下究竟是哪个段改变了决策──

## Kullan

Bu konuda bir anlaşma yaptırmak için bir anlaşma yaptırmak için bir anlaşma yaptırmak için bir anlaşma yaptırmak için bir anlaşma yaptırmak için bir anlaşma yaptırmak için bir anlaşma yaptırmak için bir anlaşma yaptırmak için bir anlaşma yaptırmak için bir anlaşma yaptırmak için bir anlaşma yaptırmak için bir anlaşma yaptırmak için bir anlaşma yaptırmak için bir anlaşma yaptırmak için bir anlaşma yaptırmak için bir anlaşma yaptırmak için bir anlaşma yaptırmak için bir anlaşma yaptırmak için bir anlaşma yaptırmak için bir anlaşma yaptırmak için bir anlaşma yaptırmak için bir anlaşma yaptırmak için bir anlaşma yaptırmak için bir anlaşma yaptırmak için bir düzenleme yaptırmak için bir düzenleme yaptırmak için bir düzenleme yaptırmak için bir düzenleme yapılmıştır.

```yaml
actors:
  human: allow
  model: deny
  application: allow
  skill: deny
explicit_name: release-readiness
arguments:
  candidate: required
  publish: fixed_false
ambiguity: ask_user
missing_dependency: stop
context:
  durable_state: artifacts/release-readiness.json
  max_composition_depth: 2
```

Bu anlaşma, standart açıkça kabul edilmedikçe, test ve uyarlama için tasarlanmış bir dosyadır.`SKILL.md`Önceki konu 字段。

## - Söyle.

Bu ders çıktı.`skill-invocation-router`组件包── bu bir düzenleme modeli referansı, bir örnek ev sahibi stratejisi ve bir icra edilmeyen CLI aracı içerir── bu araç bir kez insan, model, bağımsız ajan, uygulama, beceri birleştirme veya değerlendirme kitlemi isteklerini değerlendirebilir ve 道、适配器、得分和原因を含む JSON 决策を返還することができる──

Tek istekli CLI, tam olmayan bir stratejik araştırma aracıdır. 27 . sınıfta etiketlenmiş doğru yönlü kullanım örneklerini ve komşu yanlış kullanım örneklerini kullanarak, karışıklık sayısını, doğruluk oranını, geri dönüş oranını ve çok kez çalışmanın sabitliğini hesaplamak için kullanın.

## 练习

1. 创建人类/模型矩阵的全部四行,并为每一行编写一个合法的实际使用场景――
2. Çı`CorePolicyAdapter`                                                                                                                                                                                                                                                              
3. Bir görevlendirme becerisi için 10 yakın komşu hatası kullanımı örneği yazmak.
4. En yüksek puan alanı olan iki yol arasındaki farkın farkı belirsizlik sınırına eklenir.`ask`- Evet.
5. Bu nedenle, en büyük bir dizi derinliği sınırlaması için, iki beceri oluşturan ölüm döngüsünden çıkıp tespit edilebilir.
6. Kütle Adapter ve Genişleyici Adapter kullanılarak aynı etiketleme test kitlesi kullanılır.

## 关键术语

| 术语 | 常见说法 | 实际工程含义 |
|---|---|---|
| 显式调用 (Explicit invocation) | “斜杠命令” | 调用方直接提供 skill 身份标识，受策略约束 |
| 隐式调用 (Implicit invocation) | “模型自主选择” | 路由器根据任务上下文从合格的目录元数据中自主选择 |
| 用户可调用 (User-invocable) | “人类可以使用” | 特定于宿主的菜单或直接调用属性，而非核心标准字段 |
| 模型可调用 (Model-invocable) | “agent 可以使用” | 在宿主策略下具备隐式模型选择资格 |
| 调用适配器 (Invocation adapter) | “frontmatter 解析器” | 将宿主字段和 API 映射到已声明策略模型的代码 |
| 近邻误触发用例 (Near miss) | “困难负例” | 与 skill 预期输入高度相似但不应触发该 skill 的请求 |
| 弃权 (Abstention) | “未选中任何 skill” | 在缺乏足够证据或存在歧义时刻意做出的路由结果 |

## 延伸阅读

- [优化 skill 描述](https://agentskills.io/skill-creation/optimizing-descriptions)Bu nedenle, bu konularda, "İş ve iş" sözcüğü hakkında daha fazla bilgi edinmek için,
- [评测 skills](https://agentskills.io/skill-creation/evaluating-skills)Bu nedenle, bu konuyla ilgili bir bilgi edinmek için,
- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills): Anlamak için mevcut Kodeks'in açık ve gizli kullanım kontrolü
- [Claude Code skills](https://code.claude.com/docs/en/skills)Konkret ev sahibi hakkında bilgi edinmek`user-invocable`- Evet.`disable-model-invocation`、parametrlerin aktarılması ve emniyetle ilgili aşağıdaki mekanizmalar
