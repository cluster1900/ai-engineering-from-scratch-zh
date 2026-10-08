# Yetenek Bulma ve Gelişmiş Açıklama

> Bir beceri, yazılı olarak yüklenmeden önce rol oynamıştır. Adı ve açıklaması, katalogda bir yer kazanır; daha derin düzeyde dosyalar ise, görevleri gerçek anlamda ele alırken, yalnızca aşağıdaki içeriğe girmeye layık olurlar.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 22 (Agent Skills: Portable Contract and Runtime Boundary)
**Time:** ~105 minutes

## Öğrenme hedefi

-  yapılandırmak                                                                                                                                                                                                                                                             
- 解释三种渐进式披露级别(üç açıklama seviyesi):目录元数据(katalog metadata)、激活指令(aktif talimatlar) 和特定任务资源(タスク-specific resources)。
- 设计引用 (引用文档), ajanın doğrudan gerekli ayrıntılı bilgileri elde etmesini sağlar ve tüm paketleri yüklemesi gerekmez.
- Genel olarak, bu programlar, programların ve programların bir parçası olarak kullanılır.
- Bu yüzden, bu konuda bir şey yapmamalıyız.

## 问题

Senin ajanın 200 yeteneği kurdu. Toplantı başlanda her birini yükle.`SKILL.md`、 referans dosyası (reference file) 、脚本和模板, mevcut görevler ilişkisiz süreç ayrıntıları içinde boğulacaktır.

常见的折中方案是目录 (katalog): modellere her yeterlilik niteliğinin tanımını göstermek için, sadece seçilen ve sonra tam düz yazıyı yüklemek için iki yeni mühendislik sorunu ortaya çıkardı.

İlk olarak, keşif (finding) sadece bir dosya arama değil. Bilikler projen çalışma bölgesi, kullanıcı, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi ve yöneticisi, yöneticisi, yöneticisi ve yöneticisi, yöneticisi, yöneticisi ve yöneticisi, yöneticisi ve yöneticisi, yöneticisi, yöneticisi ve yöneticisi, yöneticisi, yöneticisi ve yöneticisi, yöneticisi ve yöneticisi, yöneticisi, yöneticisi ve yöneticisi, yöneticisi ve yöneticisi, yöneticisi, yöneticisi ve yöneticisi, yöneticisi, yöneticisi ve yöneticisi, yöneticisi, yöneticisi ve yöneticisi, yöneticisi, yöneticisi ve yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi ve yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi ve yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticisi, yöneticidir.

Diğer bir deyişle, aşamalı açıklama (progressive disclosure)  aşamalı karışıklığa dönüşebilir.`SKILL.md`写着阅读相关指南,包内包含12指南,模型就只能猜猜. Eğer her指南又指向另3文件,加载过程就会变成无限图遍历──

Bir iyi çalışma zamanı (runtime) bir aşama sürecinin kesin olmasını sağlar ve bilgiyi derin düşüncelerle açıklar.

## 概念

### 发现是一个编译器流水线

Dosya sistemini kaynak kod giriş olarak görme.

```figure
skill-discovery-pipeline
```

Her aşamada yapılandırılmış veriler ve yapılandırılmış hatalar meydana gelmelidir.

- Hangi kök kaydı aradı?
- Hangi adaylık paketini buldun?
- Seçimleri reddettiler, neden?
- Bu savaşta hangi parti başarılı oldu?
- Bütçe sınırları nedeniyle hangi başlıklar kısaltıldı veya kaydedildi?

Bu gözlemli kanıtlar olmadan, neden model benim yeteneklerimi kullanmadığını tespit etmek neredeyse imkansızdır.

### 作用域是运行时策略

Gönderileme kuralları, beceri paketinin yapısını tanımlar, ancak tek bir genel kurulum yolu veya öncelikli bir sırayı tanımlamaktadır.

Bir genel operasyon sırasında aşağıdaki etki alanı kullanılabilir:

| 作用域 (Scope) | 示例根目录 | 预期所有者 |
|---|---|---|
| Workspace (工作区) | `<repo>/.agents/skills/` | 项目维护者 |
| User (用户) | `<user-data>/skills/` | 单个开发者 |
| Administrator (管理员) | `<system>/skills/` | 机器或组织策略 |
| Plugin (插件) | 已签名的插件包 | 插件发布者与安装者 |
| Built-in (内置) | 运行时自带包 | 运行时提供商 |

截至2026年8月,Codex 文档规定项目级发现会 `$CWD/.agents/skills`开始上升遍历祖先目录直至代码仓库根目录,外加、用户管理员和内置位置──它支持符号链接的技能 目录──同名技能可能同时出现,而不是被合并──这些是Codex'in具体行为,并非`SKILL.md`规范的强制要求; 适配器 yazırken, lütfen en son [Codex skill 文档](https://learn.chatgpt.com/docs/build-skills)- Evet.

绝不要凭空从目录名称推断优先级――应声明为明确策略并进行测试――本课实验为每一个课件`Scope`Görünen tam sayı önceliği kullanmak, aynı aday topluluğunu her zaman aynı sonuçları çözmesini sağlamak.

###  konflikt needs超越                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `name`Tek tanımı

İki tane çığlık .`release-readiness`Bu nedenle, katalogı en az aşağıdakilerle oluşturabilir:

```json
{
  "name": "release-readiness",
  "description": "Inspect a release candidate for this repository.",
  "scope": "workspace",
  "source": "/repo/.agents/skills/release-readiness",
  "selected": true
}
```

常见冲突策略包括:

| 策略 | 优势 | 风险 |
|---|---|---|
| 保留所有候选包 | 不会隐藏任何内容 | 模型会看到歧义的名称 |
| 最高优先级作用域胜出 | 调用简单直接 | 本地包可能会遮蔽（shadow）受信任的包 |
| 拒绝重复项 | 无隐式遮蔽 | 合法的覆盖机制将失效 |
| 按来源限定名称（命名空间化） | 身份明确 | 面向用户的名称变长 |

Bu nedenle, bazı aday paketleri model katalogunda görünmese bile, reddedilen veya gizlenen aday paketleri bilgileri de teşhis günlüğünde tutulur.

### Üç açıklama sınıfı

Agent becerileri 规范 described分阶段加载(step loading) ⋅ Its key lies in each level has different purposes──

```figure
skill-disclosure-levels
```

#### Eşit 1: 目录元数据 (Katalog Metadata)

模型, bu beceriyi diğer beceriyle ayırmak için yeterli bilgi gerektirir 规范估计每目录条目约占用100代币,但实际序列化和代币化 细节由主机决定──

Bir faydalı açıklama iki cümle içerir:

```yaml
description: Validate a release candidate and produce a readiness report. Use when the user asks whether a version, tag, or package is ready to publish.
```

İlk ders, doğru yönde test deneyimi ve yakın komşu yanlıştanış test deneyimi örneklerini kullanarak bu sınırı değerlendirecektir.

#### Devamlı Kurallar:

                                                                                                                                                                                                                                                              `SKILL.md`Bu bir tasarım yönlendirme sinyali, yerine getirilmemesi gereken bir hedef değildir.

Yazım içerir:

- 任务边界;
- 默认工作流;
- 分支条件;
- Daha derin düzeyde dosyalara doğrudan alıntı yaparak;
- 工具和脚本契约(kontrat);
- Öte yandan,
- 预期输出 ve onaylama yöntemleri¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

Sadece giriş dosyasının kısa olması için, çekirdek çalışma akışını referans merkezine taşıyın.

#### 3 . Dönem: 支资源 (Devekçi Kaynaklar)

Referanslar  detaylı açıklamalar veya veriler sağlamak. Scripts  kesinlik hesaplamaları sağlamak.

| 目录 | 模型是否读取？ | 模型是否执行？ | 典型内容 |
|---|:---:|:---:|---|
| `references/` | 是，在需要时 | 否 | schemas、策略、领域指南 |
| `scripts/` | 可以视情况检视 | 通过被允许的工具 | 验证器、转换器、数据收集器 |
| `assets/` | 仅在有用时 | 否 | 模板、fixtures、图像、起始文件 |

Bu kataloglar sadece belirlenmiş, sihirli bir yetenek değildir.

### 面向分支的具体参考优于粗暴的专题倾倒

Giriş dosyasını karar çizgisine yaz:

```markdown
## Choose the path

- For a Python package, read `references/python-release.md`.
- For a container image, read `references/container-release.md`.
- For a documentation-only release, read `references/docs-release.md`.
- If the release combines artifact types, read only the guides for those artifacts.
```

Bu her referans için bir yükleme şartı sağlar.`references/`Daha fazla bilgi için Bu açıklama yok.

保持引用图(reference graph) 平浅显──官方指南建议从 `SKILL.md`直接链接, avoid deep layer调用链──单跳(one hop) kullanılabilirliği kolaylaştırır, test yapılır ve gerekli bağ koşullarını asla üst aşağıdaki risklere girmemek için azaltır.

```figure
skill-reference-map
```

### Şu anki bütçe ve aktif olarak aşağıdaki iki farklı bütçe vardır.

设 $c_i$Yetenek için$i$Sıralama sonrası kataloglar$B_c$Bütçeye göre,$b_j$- Evet.$r_k$Gerçek yükleme kaynakları

```text
catalog_cost = sum(c_i for every published skill)
active_cost = sum(b_j for every activated skill) + sum(r_k for every disclosed resource)
```

Bir bütçeyi azaltmak otomatik olarak diğer bütçeyi azaltmaz. Kısaca açıklama, katalog alanını tasarruf edebilir, ancak etkinleştirilen 900 行正文 hala etkinleştirilmiş görev üzerinde baskı altında olabilir.

Codex şu anda bilinen üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst üst mekanı olarak, başlangıç becerileri listesi bütçe kontrolü kontrolü %2 olarak bilinir.

### 资源路径是信任边界

Bir beceri sadece kendi paketinin içindeki dosyaları okuyabilmelidir.

```text
references/../../../../.ssh/config
references/external-link -> /private/company-secrets
```

Fayl sistemleri dilini kullanarak kök dizini ve aday yolu çözün, giriş yolu kesinlikle reddedin, ve çözünününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününününün

```figure
skill-resource-containment
```

路径限制并建立内容信任──一个有效的包内引用──仍然可能包含恶意指令──第 26 课将专门处理这一威胁──

### Üretim süreci görülebilir

Kayıtlı bilgiyi kaydetmek için:

```json
{
  "event": "skill.resource.loaded",
  "skill": "release-readiness",
  "resource": "references/python-release.md",
  "reason": "candidate contains pyproject.toml",
  "bytes": 2840
}
```

`reason`字段 will once on below select translate into available review evidence. Bu ayrıca, tüm dosyaları yüklemek için ajanlara yol açan kötü talimatları tanımlamayı yardımcı olur.

## Yapın onu.

`code/main.py`Bir kesinlik ve açıklama motoru oluşturmak.

发现模块的接口包括:

- `Scope`: Kaynak ve öncelikli veri için;
- `SkillCandidate`:表示未校验的文件系统候选包;
- `discover_scope(scope)`Bu yüzden, bu konuda bir şey yapmamalıyız.
- `resolve_collisions(candidates, precedence)`: Application declarations of conflict strategies;
- `CatalogEntry`ile`build_catalog(...)`: bir sınırlı veri yayınlamak;
- `CatalogBudget`: Nükleer hesaplama sırasılılık 条目的空間占用, avoid假定字符数等通用代號数──

披露模块'un bağlantıları şunları içerir:

- `load_skill_body(entry, ...)`: Level 2'nin aktif yüklenmesi için;
- `validate_reference(skill_dir, reference)`: Yol sınırlama kontrolü için;
- `load_reference(...)`: Uygulamalı var界in 3 seviyesinde

运行实验:

```bash
cd "$(git rev-parse --show-toplevel)"
cd phases/13-tools-and-protocols/24-skill-discovery-and-progressive-disclosure
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Bu emir blokları yerel git klonunu gerektirir  ortam, ve bu klon içindeki istedikleri çalışma dizini depo kökü yollarını çözmek için kullanılabilir.

Bu gösterim, geçici proje rol alanı ve kullanıcı rol alanı oluşturur, çatışmalara yol açar, kasıtlı olarak ayarlanmış çok küçük bütçede bir katalog oluşturur, bir beceri etkinleştirir, ve yasal referansları 读取和目录遍历逃逸── gösterim herhangi bir kalıcı dosya yüklemez.

### Neden aşama aşamasını buldu?

`discover_scope`仅检查直接子目录下 `SKILL.md`- Her bir yerin içine dönmeyecek.`SKILL.md`视为独立包── bu, paket sınırlarını korur, tesadüfen kurulmuş beceri 内部的示例或测试装置的发布避免──

### Neden deney isteksiz YAML çözmedi ?

实验仅支持其目录所需的标量前材料――生产运行时应使用安全的YAML 解析器,配备显式 schema、大小限制,并禁用自定义对象构建──仅使用标准库(Stdlib-only)

## Kullan

Bu kontrol listesi, herhangi bir aşıklık için uygulanır:

1. 列出各配置的根目录及其写入权所有者──
2. 明确说明是否允许符号链接包──
3. 校验包名、目录名、必需元数据和入口正文大小。
4. İçeriyel olarak tanımlamalarda kalınma kaynak (sör)
5. 声明并测试同名重复行为。
6. 精确测量发送给模型的序列化目录大小──
7. Kayıt yüklenmiş bir kaynak veya kaynak nedenleri.
8. Kaynaklar, incelemenin ardından kısıtlı olarak okunur.
9. Kayıt eksikliği sırasında açıklama başarısızlığı.
10. Kurulum durumunda veya stratejide değişiklik olduğunda yeniden inşa edilme katkıları:

## - Söyle.

Bu ders çıktı.`skill-catalog-builder`组件包── açıkça belirtilen sırayla kök defterini tarayarak, giriş dosyalarını ve isim-katalog eşleşmezliklerini reddeder, etki alanı çatışmasını çözür, eşit öncelikli tekrarlamaları reddeder ve açıklamada yazılım sayısını, tanımını ve sıralamasını belirler.

JSON raporu seçilen yazıları içerir, gizlenmiş aday paketleri, gözden kaçırılan yazıları, sınav hataları, öncelik ve bütçe kullanım durumları.

## 练习

1. 添加一个插件 作用域,将其优先级放在用户与内置之间. 编写测试证明其冲突解决结果.
2. Konflikt stratejisini en yüksek öncelikten 限定名称 (Kualified Names) ── olarak değiştirmek.
3. Çı`load_reference`添加字节大小限制──测试一个恰好等于限制文件和一个超出一字节的文件──
4. 编写两个听起来几乎相同的描述――重写它们,使它们的触发边界不重叠――
5. 添加一个包含每个引用和脚本 哈希值的表.
6. Gösterme için, bölüm raporları 1 ̊Level 2 y 3 ̊Level ̊

## 关键术语

| 术语 | 常见说法 | 实际工程含义 |
|---|---|---|
| Skill 发现 (Skill discovery) | “找到所有 SKILL.md” | 搜索配置的作用域，校验包，附加来源溯源信息，并应用策略 |
| Skill 目录 (Skill catalog) | “已安装 skills 列表” | 面向合格包的、模型可见的紧凑路由元数据 |
| 冲突策略 (Collision policy) | “哪个重复项胜出” | 针对来自不同来源的同名候选包所声明的处理规则 |
| 渐进式披露 (Progressive disclosure) | “懒加载” | 从目录到正文再到特定分支资源的分阶段上下文引入 |
| 引用图 (Reference graph) | “skill 链接的文件” | 可达的资源结构及其加载条件 |
| 路径限制 (Path containment) | “留在文件夹内” | 验证解析后的资源目标路径始终位于解析后的包根目录下 |

## 延伸阅读

- [Agent Skills 规范](https://agentskills.io/specification)Bu nedenle, bu konularda,
- [优化 skill 描述](https://agentskills.io/skill-creation/optimizing-descriptions): Kader Haberleri:
- [Agent Skills 最佳实践](https://agentskills.io/skill-creation/best-practices): Anlamak için doğrudan alıntılar ve giriş dosyası
- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills): Anlamak için mevcut Kodeks'in bulma etki alanı ve katalog sınırlamaları
