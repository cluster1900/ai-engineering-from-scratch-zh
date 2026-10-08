# Ajan Yetenekleri: Can Can Canplantation

> Yetenek, sadece daha iyi bir dosya adı değiştirilen bir sürpriz değil. Bu, belirtilen çalışma zamanında anlaşma yüklenen ajanın üst kısmına göre, talimat, kaynak ve uygulanabilir yardımcı araçlar içeren bir program paketidir.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 01 (The Tool Interface), Phase 13 · 05 (Tool Schema Design)
**Time:** ~90 minutes

## Öğrenme hedefi

- 明确定义 Ajan Yetenekli,不将其与 prompt、代码库规范文件(repository instructions) 、工具、hook、subbagent 或插件 混──
- 研讀可移植的 `SKILL.md`契约,并将其与特定运行时专专有扩展清晰解──
- 将服务发现 (Discovery) 选择 (Selection) 激活 (Activation) 资源加载 (Ressource Loading) 工具调用 (Tool Use) 验证 (Verification) 解释为独立的生命周期阶段 (Bütün bunlar, bağımsız bir yaşam döngüsü)
- Uygulama sırasında yetenekleri bir ajanın yetenek defterine dahil edecektir.
-  belirli bir tasarım görevleri için, beceri 、MCP araç 、hak 、 alt veya sıradan kodlar arasında mantıklı teknik seçim yapın.

## 十分钟极速初体验

Bu işlemden önce, inceleme yapmadan önce, bu işlemleri tamamlayın. Bu işlemden önce, bir inceleme becerisi oluşturur, tam inceleme cihazı program paketini gerçek bir ajanın ev sahibi ortamına yükler, onu kullanır, test eder, sonuçları çıkarır ve onu yükler. Bu, gözlemleyici sonuçları yaşam döngüsü boyunca kişisel olarak test etmenizi sağlar.

### Gerçek ev sahibi deney ön konumu kontrol

Gerçek ev sahibi kontrol noktası Node.js'i gerektirir.`npx`、Python 3、 bir seçilmiş destekleme becerisi sunucu ortamı, ayrıca yükleme cihazında seçtiğiniz projeler veya kullanıcı rol alanına yazma hakkına sahip olmak.

```bash
node --version
npx --version
python3 --version
```

Kurulumdan önce, önce kullanmak istediğiniz ev sahibi ve kurulum rol alanını belirleyin. Eğer yukarıda belirtilen herhangi bir bağımlılık eksikse, web sitesinde bu dersleri okuyabilir veya aşağıdaki yazılım paketini doğrudan uygulayabilirsiniz.

### 1. Şimdiki iş başlatma

Bu programı kaydetmek için kullanılır.

```bash
mkdir -p agent-skills-first-run
cd agent-skills-first-run
TARGET_ROOT="$(pwd -P)"
printf 'TARGET_ROOT=%s\n' "$TARGET_ROOT"
ls -A
```

Son bir emir herhangi bir çıkış yapmamalıdır. Eğer çıkış varsa, bu incelemenin net ve net bir sınır olması için boş bir dizin değiştirin.

İlk becerin için  Create Catalogue:

```bash
mkdir -p my-first-skill
```

创建 `my-first-skill/SKILL.md`İçeriği aşağıdakiler:

```markdown
---
name: my-first-skill
description: Turn rough meeting notes into a compact decision record when the user asks to capture a technical decision.
---

# Decision record

Extract the decision, context, alternatives, owner, and next review date.
If the notes do not contain a decision, ask one clarifying question instead
of inventing one.
```

验证该文件是否已成功创建目标目录:

```bash
test -f my-first-skill/SKILL.md
```

无任何输出和退出码为 0 表示文件已经存在──

### 2. Tamamen monte edilmiş inceleme makinesi

Kalın .`agent-skills-first-run`Şu anda:

```bash
npx skills add rohitg00/ai-engineering-from-scratch --skill skill-contract-reviewer --full-depth
```

选择你当前正在使用的代理 宿主和作用域──安装器会列出 `skill-contract-reviewer` ve yazılmasının hedef konumları¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬`--full-depth`Bu ders, referans, yazı ve statistik varlıkları içeren bir beceri paketidir.

- Ben de .`SKILL_ROOT`設置器所報告の絶対路径── 設置器所報告の絶対路径── 設置器所報告の絶対路径── 設置器所報告の絶対路径── 設置器所報告の絶対路径── 設置器所報告の絶対路径── 設置器所報告の絶対路径── 設置器所報告の絶対路径── 設置器所報告の絶対路径── 設置器所報告の絶対路径── 設置器所報告の絶対路径── 設置済み路径── 設置済み路径── 設置済み路径── 設置済み路径── 設置済み路径── 設置済み路径── 設置済み路径── 設置済み路径── 設置済み路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路路`SKILL.md`Program kaynak defteri değil, ne de mevcut çalışma bölgesi:

```bash
# 将占位符替换为安装器打印出的绝对路径
SKILL_ROOT="$(cd "/absolute/path/to/skill-contract-reviewer" && pwd -P)"
test -f "$SKILL_ROOT/SKILL.md"
printf 'SKILL_ROOT=%s\n' "$SKILL_ROOT"
```

Eğer ev sahibi konuşması daha önce açılmışsa, yeni konuşmayı başlatın veya ev sahibi yeteneğini yeniden kullanın.

### 3. 显然调用 it

Ortaya yerleştirilmiş bir ajanın içinde,`agent-skills-first-run`İş başlığı için, bu ev sahibi tarafından desteklenen açıkça ifade edilen dili kullanın:

| 宿主 | 显式调用方式 |
|---|---|
| Codex | 输入 `skill-contract-reviewer`，或从 `/skills` 菜单中选择，然后提交审查请求 |
| Claude Code | 输入 `/skill-contract-reviewer` 紧跟审查请求 |
| 通用可移植回退 | `Use skill-contract-reviewer to review the target package.` |

Çaplama için kullanılır`SKILL_ROOT`和 `TARGET_ROOT`绝对路径── Host'un, mevcut çalışma katalogunun bulanık emirlerine bağımlı olmaksızın, tamamıyla çözülmüş bir emiryi gerçekleştirmeden önce ortaya çıkarmasını ve göstermesini gerektirir:

```text
Use skill-contract-reviewer to review <TARGET_ROOT>/my-first-skill. The installed bundle root is <SKILL_ROOT>. Run python3 <SKILL_ROOT>/scripts/check_skill.py <TARGET_ROOT>/my-first-skill. Before running it, show the fully resolved argv. Return the validation report, selected primitives, and one sentence for each selection. Include the resolved script path, resolved target path, cwd, argv, and exit code as execution evidence.
```

解析后的命令应呈现如下结构,不留任何未填充的占位符:

```bash
python3 "/absolute/install/path/skill-contract-reviewer/scripts/check_skill.py" \
  "/absolute/workspace/path/agent-skills-first-run/my-first-skill"
```

Başarılı inceleme sonuçları aynı zamanda aşağıdaki üç özelliği karşılamalıdır:

1. Ev sahibi tam olarak bulunabilir.`skill-contract-reviewer`- Evet.
2. 审查器成功读取程序包契约并运行其附带的验证脚本──
3. Cevaplar bir test raporu içerir, örneği de yapısal hatalar içerir ve temel yapısal yapısal seçim tiplerini önerir.

执行证据中还必须明确列出脚本路径、目标路径、当前工作目录(cwd)、精确参数数组(argv) 以及退出码;;

Eğer ev sahibi bu beceriyi kullanılamaz olarak rapor ederse, kurulum hedef yolunu kontrol edin, yeniden tarayın veya tekrar başlatın, sonra tekrar açık bir şekilde istekleyin.

### 4. 探查隐式选择(İplak Seçim)

Yeni bir ajan aç, aynı görevi gir.**不提及**Bu beceri adı:

```text
Review <TARGET_ROOT>/my-first-skill as a reusable agent package and tell me whether its package contract is valid.
```

Ev sahibi kullanıcıya seçilen becerileri gösterirse, otomatik olarak seçildiğini kaydet.`skill-contract-reviewer` Eğer ev sahibi karar ayrıntılarını ortaya çıkarmazsa, gizli seçimler kanıtlanmamış olarak işaretlenecektir.

### 5. Cleaner

仅移除已安装的审查器程序包:

```bash
npx skills remove skill-contract-reviewer
```

选择与安装时相同的宿主和作用域──在重新扫描或新建会话后,显式请求 `skill-contract-reviewer`Bu becerileri geri getirmek gerek.`my-first-skill` sonraki dersler için kullanılabilir, aynı zamanda bu yönde öğrenmeyi tamamladıktan sonra deney katalogunu tamamen silmek mümkündür.

## 问题

假设你的团队有非常可靠的发布上线工作流:找出已合并的改动;检查数据库迁移说明;更新变更记录;执行打包命令;并输出上线审查清单;

Eğer bu iş akışını doğrudan bir uzun süredir bir sürede bir sürede sokarsak, yapıştırmayı kopyalamak kolay olsa da, mühendislik çalışmalarında bir hata ortaya çıkar: bu sürede  sabit bir kimlik tanımı yok, kurallar bulunmaz, kaynakların bulunmadığı sınır yüklenmesi yok, test edilebilir bir paket yapısı yok ve bir dizi temel mühendislik sorusuna cevap veremiyor: kim onu düzenleme hakkı vardır? model ne zaman seçilmelidir? hangi scriptleri yapabilir? hangi dosyalar güvenilir? üst yazılar sıkıştırıldığında, hangi temel kurallar kalır?

Aksine, son hata, tüm tekrar edilebilir talimatları bir beyinden bir beceri olarak kullanmaktır. Kod kutu kuralları, belirleme otomatik yazısı, dış araçlar, olaylar ve görevli ajanlar tamamen farklı sorunları çözdür.`SKILL.md`Bu nedenle, bu kayıtlar genel bir yapı ile oluşur ve aslında belirli bir ev sahibi tarafından açıklanmamış davranışları derinlemesine bağlarlar.

软件工程'in öncelikli görevi**分类**Bu yapı nasıl paketleneceğini belirlemeden önce, bu yapı aslında ne olduğunu öğrenmek gerekir.

## 概念

### Bilgiler 封装过程性知识 (İşleme bilgisi)

Ajan yeteneği bir .`SKILL.md`Bu giriş dosyası, YAML ön maddesini içerir.

```figure
skill-package-anatomy
```

Bu ...**目录**Sadece bir tek markalı belgeler değil, sadece bir kopya yapıldığında, bu, DEA'nın en küçük birimidir.`SKILL.md`Ama alıntı kaynak dosyasını unuttu, hatta ön yazısı 语法 tamamen doğru, bu da bir kalıntılı bozukluk programı paketleri.

### 临近概念辨析

| 构件类型 | 核心职责 | 何时加载或运行 | 不应被冒充为 |
|---|---|---|---|
| Prompt | 塑造单次模型交互 | 由应用或用户内联引入 | 包含丰富资源的带版本软件包 |
| 代码库规范（Repository instructions） | 阐明某特定代码库的固有通用准则 | 编码运行时进入该作用域时载入 | 可复用的具体任务工作流 |
| Agent Skill | 提供可复用的过程性知识 | 显式或隐式激活时载入 | 强安全隔离边界 |
| MCP Tool | 暴露类型化的远程能力 | 由模型或应用程序主动发起调用时 | 复杂详细的端到端操作步骤 |
| Hook（钩子） | 在特定事件发生时执行确定性逻辑 | 当所声明的事件发生时触发 | 具有概率性的模型自主路由 |
| Subagent（子代理） | 委托具有独立上下文和状态的任务 | 由编排器创建或调用时启动 | 静态的只读指令包 |
| Plugin（插件） | 分发更大规模的运行时功能扩展 | 宿主安装或启用它时生效 | 可移植的 skill 契约本身 |
| 习得的 Skill 库（Learned skill library） | 存储通过实践探索习得的行为沉淀 | 策略检索到先验程序或轨迹时 | 基于规范标准的 `SKILL.md` 软件包 |

发布技能 可以指导代理 如何审查发布;;MCP sunucu 可以暴露发布注册中心;;Hook 可以禁止向主分支直接推代码;;Subagent 可以独立审查候选版本;;

### Skil                                                                                                                                                                                                                                                             

Bilimsel araştırma alanında, bazı zamanlar alışılmış program kodlarını, başarılı etkileşim yollarını veya belirli bir ortam için strateji parçalarını belirler.

Bu dizi derslerdeki Agent becerisi tamamen farklıdır. Bu, açık bir açıklama olan bir yazılım paketi, dosya sistem anlaşması, beceri katalogı, veri, ılımlı açıklama, yürütme zamanında yönlendirilmiş bir düzenleme mekanizması ve ev sahibi tarafından sıkı şekilde kontrol edilen araç yetkileri ile birlikte.

| 评估维度 | Agent Skill 软件包 | 习得的 Skill 库 |
|---|---|---|
| 基本单元 | 包含 `SKILL.md` 的目录 | 程序代码、策略片段、交互轨迹或记忆记录 |
| 创建方式 | 人工编写、生成或精选策划 | 通常由 agent 在环境交互中自主探索习得 |
| 选用机制 | 依赖目录描述（Description）加运行时策略 | 基于任务状态的向量检索或策略匹配 |
| 执行方式 | 模型遵循 Markdown 指令并调用宿主工具 | 环境直接执行存储的行为逻辑或代码产物 |
| 可移植性 | 程序包契约可在所有兼容的宿主间流通 | 通常与特定环境及特定的动作空间深度绑定 |
| 评测标准 | 路由准确率、制品质量、安全及宿主兼容性 | 强化学习奖励值、任务成功率、泛化能力及库规模 |

Bu iki düşünce de tekrarlanabilir bir şekilde kullanılabilir, ancak sadece aynı isimle birbirlerinin tasarımlarını birleştirdikleri için değil.

### Gönderilme için temel kural

Ajan Yetenekleri 规范在前面中强制要求两个必填字段:

```yaml
---
name: release-readiness
description: Inspect a release candidate when the user asks whether a version is ready to publish.
---
```

`name`Bu isimler, isim isimlerinin kurallarına uygun olmalıdır ve isimlerin isimlerinin isimleriyle tamamen uyumlu olmalıdır.`description`Hem insan gözüyle görülen dosya, hem de dil anlamı yolunun anahtar verileri için bir model. Bu becerileri net bir şekilde açıklamak zorundadır.**能做什么**Ve**何时应当选用它**- Evet.

核心规范允许的可选字段包括:

| 字段 | 用途 | 可移植性说明 |
|---|---|---|
| `license` | 声明该程序包的开源或商用许可条款 | 核心标准规范 |
| `compatibility` | 声明环境要求（如 Python 3.10+、特定 CLI 工具等） | 核心标准规范 |
| `metadata` | 携带字符串键值的自定义扩展数据 | 核心标准规范 |
| `allowed-tools` | 建议预先批准的工具列表 | 实验性特性；不同宿主支持度不一 |

Markdown, işleyiş yönlendirmesini taşıyan bir yazıdır. Bu, iş akışının net bir şekilde tanımlanması, önemli kararların ayrılığı, sıradan başarısızlıkların işleme stratejileri ve kaynak dosyalarının karşılaştırma yollarını göstermelidir.

```markdown
# Release readiness

Use this workflow for a release candidate, not for ordinary development builds.

1. Read `references/release-policy.md`.
2. Run `python3 scripts/inspect_release.py --format json`.
3. Stop if the report contains a blocking failure.
4. Produce the checklist from `assets/release-checklist.md`.
5. Ask for approval before any publish or tag action.
```

### 运行时扩展(Runtime Extensions) ikinci kat

部分 host allows in frontmatter to write in extra字段 or related specific config file── bu kısımlar belirli bir platformda oldukça yararlıdır, ancak bunlar genel taşınabilir standartlara dahil değildir.

| 行为特性 | 宿主扩展示例 | 属于通用核心规范？ |
|---|---|:---:|
| 对模型自主路由隐藏，但保留用户手动直接调用 | `disable-model-invocation` | 否 |
| 对用户的命令菜单隐藏，但允许模型自主路由选用 | `user-invocable` | 否 |
| 在斜杠命令菜单中展示参数使用提示 | `argument-hint` | 否 |
| 在被委托的隔离子上下文中运行该 skill | `context`, `agent` | 否 |
| 固定模型型号或思考计算等级（Reasoning Effort） | `model`, `effort` | 否 |
| 注册生命周期自动化钩子 | `hooks` | 否 |
| 在 Codex 中禁用隐式调用 | `agents/openai.yaml` 策略 | 否 |

 her bir özel bölüm genişletilmesi dışa aktarma adaptör olarak görülmelidir. ️ bu bölümlerden ayrıldığında bile, çekirdek çalışma akımı hala yasal olarak kullanılabilir olduğundan emin olmak; onlar için derecelendirme geri dönüş belgesi yazmak ve aslında tüketmek için onları ev sahibi üzerinde hedeflenmiş test tamamlamak ️ bilinmeyen özel bölümler kullanıldığında doğrudan göz ardı edilmek ️ hata reddedilebilir, veya sadece orijinal olarak saklanarak herhangi bir pratik eylem yapmayarak ️

### Ön madde: Yapabilir

Bilgi, bir teknik yazının model olarak okunmasından önce, sistemin işleyişini değiştirmiştir:

- 格式错误的                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `name`Hizmet başarısızlığına doğrudan yol açacak.
- 含糊不清的 `description`Yanlış bir yolla sonuçlanacak.
- Sadece yapay bir işlev için kullanılan işaretler bu beceriyi modelin kullanılabilir beceri listesinden tamamen çıkarır.
- 工具预授权配置会改变宿主是否弹出用户授权确认框──
- 上下文委托设置会将后续执行重定向到独立子代理 会话中──

Bu nedenle, bu konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir şekilde, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir şekilde, bir diğer konularda, bir diğer konularda, bir şekilde, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir şekilde, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer diğer diğer, bir, bir, bir diğer, bir, bir diğer, bir, bir diğer diğer, bir, bir, daha, bir, bir, bir, bir diğer diğer, daha, daha, bir, bir, bir, bir, daha, bir, bir, bir, bir, daha, bir, bir, bir, daha, bir, bir, bir, daha, daha, bir, bir, bir, daha, daha, daha, daha, bir, bir, daha, daha, daha, daha, daha, daha, daha daha, daha daha daha daha daha daha daha, daha daha

### Yeteneklerin yaşam döngüsü

```figure
skill-runtime-lifecycle
```

Resimdeki her bir ok, bağımsız bir başarısızlık modeli ile sınırları temsil eder:

1. **服务发现（Discovery）：**Önceden ayarlanmış bir katalog yolunda kontrol edilebilir program paketleri
2. **静态校验（Validation）：**Kayıtlara açığa çıkmadan önce, yanlış veya güvenli olmayan bir biçimdeki programı kesin olarak durdurun.
3. **编目索引（Cataloging）：**Sadece model üzerinde aşağıdaki açıklamaları açıklayın`name`ile`description`,绝不提前全量加载──
4. **决策选择（Selection）：**Bu yeteneklerin mevcut görevle ilişkili olup olmadığını belirlemek için bir model veya açık bir talimat ile belirlenir.
5. **按需激活（Activation）：**- Ben de .`SKILL.md`Normalde tüm miktarda yüklenmiş model görünen üst aşağıdaki metinlerde.
6. **渐进披露（Disclosure）：**Sadece belirli bir bölümde gerçek ihtiyaç olduğunda, sadece referans veya varlıkları okumak için kullanılır.
7. **执行推进（Execution）：**Ev sahibi yetkisini incelemek ve bu kutuların ayrılık kuralları altında her türlü ev sahibi aletini kullanmak.
8. **结果核验（Verification）：**独立于模型的自述表态,客观核验最终产品质量──

Bu aşamalar yanlış düşünce modeline yol açar: keşfedilen beceri, etkinleştirilmiş gibi değildir; etkinleştirilmiş beceri, tanımladığı tüm işlem yetkisini elde etmek gibi değildir; tek bir araç kullanımı, sona ermiş iş sonuçlarının doğru olduğu gibi değildir.

### Bilim ve Yönetim

MCP  çözümü:  mevcut uygulamaların hangi dış yetenekleri kullanabileceği, parametreleri Schema nedir?  ve Yetenek  çözümü:  Ajan  nasıl bu tür görevleri işyerinde nasıl işleyebilir?

```figure
skill-tool-orthogonality
```

Bilgi, bir araçın adını yazıda belirtir, ancak gerçek araçların kayıt ve kullanımı yetkisi tamamen host çalışmasına ait olacaktır. Eğer araç, bir çalışım ortamında eksikse, bir açık derecelendirme açıklaması veya doğrudan net bir rapor vermesi gerekir.

### Bilgiler ve kodlar (Keyfi)

代码库说明文件(如 `AGENTS.md`) Seni tanımlamak için**当前所处**Bu nedenle, bu programın en iyi yöntemi, bu programın en iyi yöntemi ve en iyi yöntemi oluşturur.

İkisi aynı anda uygulandığında, kullanıcıların anlık talimatları ve mevcut kod kutularının mevcut kuralları daha yüksek önceliklere sahiptir ve becerilere bir bağ oluşturur. Örneğin, genel bir yeniden yapılandırma becerisi yerel kod kutularının üzerinde kesinlikle geçerli değildir.

### Bilgiler 之间不进行代码级 İçe aktar

Bir yetenek, bir diğer yeteneği kullanmak için bir yazılım yönlendirmesi aracı olabilir, ama bu kesinlikle programlama dili seviyesindeki kod değildir.`import`◊ ikinci beceri, hala hizmetin tam olarak kullanılması gereken bir süreçtir.

Üzerine yetenekler yazma sırasında, gözlemlenebilir iş akışının adımları olarak ifade edilmelidir:

```markdown
After producing the candidate changelog, invoke the `release-risk-review` skill.
Pass the candidate path and require a blocking or non-blocking verdict.
If that skill is unavailable, stop and report the missing dependency.
```

Bu ifade, bağımlılıkların açık bir şekilde test edilmesini sağlar ve ev sahibi'nin yürürlükte uyum stratejisini gerçekleştirme şansını sağlar.

## 动手构建

`code/main.py` Uygulama için kolay bir standart testçi ve yapılandırma seçeneği kullanmak.

验证器对外暴露:

- `parse_frontmatter(text)`Markdown'la ayrılmış.
- `validate_skill_text(text, directory_name, allowed_runtime_extensions=())`:严格校验必填字段、命名约束、未声明扩展、正文存在性以及可移植长度限制──
- `ValidationIssue`ile`SkillReport`Bu, bir tek açık olmayan değer değil, yapılandırılmış bir denetim testi olarak görülmektedir.
- `FrontmatterSyntaxError`Bu nedenle, bu durumun bir parçası olarak, bir diğerinin de bir parçası olarak, bir diğerinin de bir parçası olarak, bir diğerinin de bir parçası olarak, bir diğerinin de bir parçası olarak, bir diğerinin de bir parçası olarak, bir diğerinin de bir parçası olarak, bir diğerinin de bir parçası olarak, bir diğerinin de bir parçası olarak, bir diğerinin de bir parçası olarak, bir diğerinin de bir parçası olarak, bir diğerinin de bir parçası olarak, bir diğerinin de bir parçası olarak, bir diğerinin de bir parçası olarak, bir diğerinin de bir parçası olarak, bir diğerinin de bir diğerinin de bir parçası olarak, bir diğerinin de birinden, bir diğerinin de birinden, bir diğerinin de birinden, bir diğerinin de birinden, bir diğerinin de birinden, bir diğerinin de birinden, bir diğerinden, bir diğerinden, bir diğerinden de birinden, bir diğerinden, bir diğerinden de birinden, bir diğerinden, bir diğerinden de birinden, bir diğerinden, bir diğerinden, bir diğerinden, bir diğerinden, bir diğerinden, bir diğerinden, bir diğerinden, bir diğerinden, bir diğerinden, bir diğerinden, bir diğerinden, bir diğerinden, bir diğerinden, bir diğerinden, bir diğerinden, bir diğerinden, bir diğerinden, bir diğerinden, bir diğerinden, bir diğerinden, diğerinden, diğerinden, diğerinden, diğerinden, diğerinden, diğer bir diğerinden, diğerinden, diğer bir diğerinden, diğerinden, diğerinden, diğer diğer diğerinden, diğer bir diğerinden, diğer bir de, diğerinden, diğer bir diğerinden, diğer diğer diğerinden, diğer bir diğerinden, diğer diğer diğerinden, diğerinden, diğer diğer, diğer diğer diğer diğer, diğer, diğer diğer, diğer diğer, diğer diğer diğer diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer, diğer

选型器对外暴露 `TaskShape`ile`select_primitives(task)` Görevlerin gerçek özelliklerine göre, bunu tam olarak normal kod için haritalamak  kod defteri  beceriler  hak  alt veya MCP araç olarak 

运行实验:

```bash
cd "$(git rev-parse --show-toplevel)"
cd phases/13-tools-and-protocols/22-skills-and-agent-sdks
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Bu emir blokları yerel git klonlaması gerekir  ortam, ve bu depodan herhangi bir dizin açılabilir, böylece `git rev-parse --show-toplevel`解析代码库根路径──

运行输遇 JSON biçiminde basın 运行输遇 JSON biçiminde basın 运行输遇 运输输遇 运输输输的 JSON biçiminde basın 运行输的 JSON biçiminde basın 运行输的 JSON biçiminde basın 运行输的 JSON biçiminde basın 运行输的 JSON biçiminde basın 运输输的输输的 JSON biçiminde basın 运输输输的输输的输的输的输的输的输的输出的结果的非法规程序包,以及多任务特征的选择决策的选择方案的选择结果的运行输输的输的输的输的输的输的输的代码的细细观察.

### 验证顺序至关重要

Derin seviye içerik kurallarını uygulamak için öncelikle daha düşük yapısal özellikleri kontrol etmelisiniz:

```figure
skill-validation-order
```

Bu sıkı sırayı takip ederek, ilk olarak bozulmuş olan temel değişimlerin temelini aşama aşamasında yanlış örtbas etme sistemini etkili bir şekilde önleyebilmektedir.

## Kullan

Yeni bir beceri yazmadan önce, lütfen bu kararı ciddi şekilde doldurun:

| 决策问题 | 若答案为“是” | 最匹配的基本构件 |
|---|---|---|
| 该任务是否需要在多个步骤中反复运用模型的主观判断？ | 操作流程基本固定，但具体决策千变万化 | Skill |
| 该操作是否必须在特定事件发生时 100% 强制触发？ | 哪怕遗漏一次执行也是完全不可接受的故障 | Hook 或常规业务代码 |
| 模型是否需要调用具有类型化输入的外部能力？ | 该操作本身存在于模型的思维上下文之外 | Tool 或 MCP Server |
| 该工作是否需要完全隔离的上下文、独立状态或责任归属？ | 由独立的执行单元完成工作并仅返回受限结果 | Subagent |
| 该指南是否仅适用于当前这一个特定的代码库？ | 描述的是本地开发命令、目录规范与约束边界 | 代码库说明（如 AGENTS.md） |
| 单次简短的即时交互是否就足以解决问题？ | 无需任何版本化和包生命周期的管理维护 | Prompt |

Birçok karmaşık üretim aşamasında iş akışı genellikle çok çeşitli bileşenlerin bir parçasıdır. Bu karar, geliştiricinin tüm işlevlerini tek bir bileşenin yapısal hata bölgesi içine sokmasını önleyebilir.

## - Söyle.

本课在 `outputs/`Kayıtta tam teslimat yapıldı.`skill-contract-reviewer`Programı içerir:

- Bir nakli olabilir.`SKILL.md`, yetenek değerlendirmeyi incelemek için;
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
- Bir kesinlik otomatik test (Skript)
- 覆盖 prompt、技能、工具、hook、普通代码与 subagent 的全量任务特征测试具(Assets)

Tüm paketleri, sadece giriş dosyalarını değil,

```bash
cd "$(git rev-parse --show-toplevel)"
python3 scripts/install_skills.py /tmp/aiefs-skills --phase 13 --type skill
```

 ders kurma metni çıkış kopyasının her bir 13. aşama becerisi,并生成 `/tmp/aiefs-skills/manifest.json`Bu nedenle, bu konudaki kurulumlar, test yapısı biçimlerini kullanmak için kullanılır.

Sonraki dersler her yaşam döngüsü aşamasında aşamalı olarak derinleştirilecek: 24. ders; hizmet keşfi ve aşamalı açıklama; 25. ders; stratejileri ve anlam yollarını derinlemesine inceleme; 26. ders; yetki kontrolünün ve sandıkların ayırılmasının ciddi çözümü; 27. ders; tüm programın yoğun bir değerlendirme yaparak dağıtılabilir yayın ürünleri oluşturulacak.

## 课后深练习

1. Kullanım`TaskShape`Kendi takımınızın günlük 5 gerçek R&D çalışma akışları için yapılandırma sınıfları oluşturmak. Her biri için çeşitli yapılandırma bileşimi durumları için teknik seçim tipi tartışmalı nedenler yazmak.
2. 编写边界测试用例:证明刚好 500 个字符的 `compatibility`字段能顺利通过, 501 字符的值将被视为超规范标准的误准拦截──
3. Yeni bir işlev oluşturulduğunda genişleme bölümleri. Otomatik testler yazıldı. Dosya başarılı bir şekilde tanınırken, hala tamamen nakliye edilebilir bir yetenekle açık bir şekilde ayırt edilebildiklerini kanıtladı.
4. 400 derecede uzun bir kitap hazırlamak için ,`SKILL.md`、 bir özel referans (referans) 、 bir scriptbook (bir iletişim sözleşmesi) 、 bir productoutput (bir ürün çıkış) 、 her ayrılmış dosyanın her birinde görevlerini sağlamak.
5. Bu nedenle, MCP Aracının becerileri, mevcut ortamda kullanılamaz olduğunu belirtti.
6. 审查 a existing Skill, will each sentence separately be tagged:意图路由、操作规则、安全策略、参考资料指针或输出形式契约──将任何不属于该类的冗余内容坚定除或转移至应文件──

## 关键术语

| 术语 | 通俗说法 | 精确工程含义 |
|---|---|---|
| Agent Skill | "保存好的 Prompt 模板" | 包含过程性操作指南与可选资源的标准化、可发现文件目录 |
| 可移植核心（Portable Core） | "所有运行时共享的通用字段" | 由 Agent Skills 官方规范所定义的基础契约标准 |
| 运行时扩展（Runtime Extension） | "额外的 Frontmatter 字段" | 平台特定的专有配置，其行为生效需要对应宿主适配器的支持 |
| 激活（Activation） | "Skill 跑起来了" | Skill 的正文指令被完整载入模型可见的上下文，后续执行可能滞后发生 |
| Skill 依赖（Skill Dependency） | "Import 另一个 Skill" | 由运行时负责调度的调用关联步骤，受到环境可用性与权限策略的严密审查 |
| Tool 契约（Tool Contract） | "函数 Schema 声明" | 为某项外部能力所定义的输入、输出、权限、副作用、错误码以及审计证据规范 |

## 延伸阅读

- [Agent Skills 规范官方文档](https://agentskills.io/specification)- 权威的可移植目录与前文 契约标准──
- [Agent Skills 最佳实践指南](https://agentskills.io/skill-creation/best-practices)- 作用域界定、指示撰写及资源编排的最佳范式──
- [OpenAI: 构建 Skills 开发者指南](https://learn.chatgpt.com/docs/build-skills)- Kodeks'in  çevre hizmetleri bulma ve uygulama davranışlarını derinlemesine anlamak
- [Claude Code Skills 文档](https://code.claude.com/docs/en/skills)- Platform kullanma mekanizması, parametre önerileri, araçlar, önceden yetki ve aşağıdaki yazılardaki görevlilerin genişlemesi için tam bir referansı kapsamaktadır.
