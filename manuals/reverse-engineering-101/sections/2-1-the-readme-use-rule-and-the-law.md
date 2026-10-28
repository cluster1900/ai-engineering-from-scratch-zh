# README 使用规则与法律

> 你只能在有权分析时分析程序，而在本手册里，这份权利来自每一个目标都由你自己写。

有人把一份二进制交给你，身边的 agent 能在八秒内反编译它。在第一条命令之前，先有两个问题。谁拥有这个程序，以及法律允许你对一份不是你写的副本做什么？rea 两个问题都不问。它的 `DISCLAIMER.md` 把答案放在你身上，下面的成文法与判决说明答案必须包含什么。

读完本节后，你能说出哪条规则让你分析一个程序，以及为什么本手册里每一个目标都通过那项检验。本节阅读一手材料，不提供法律意见。

## 钉住标签上的使用规则 {#s-the-readme-use-rule-and-the-law-the-use-rule-at-the-tag}

```rule
label: the use rule
source: readme DISCLAIMER.md, Responsible use
---
You must get any permission that you need, and you must follow the law, the license agreement, and the terms of service. Your jurisdiction or the license of the software can limit reverse engineering.
```

这条规则是标签上 `DISCLAIMER.md` 里 `Responsible use` 标题下的一段。README 有一个 `Disclaimer` 标题，把你引向那个文件。它把 REA 限制在合法研究、教育、互操作、软件保存，以及对你拥有或获准检查的软件的分析 {{readme Disclaimer}}。它还写明这一立场覆盖所有 REA 版本与分发渠道。

`DISCLAIMER.md` 也列出了项目不支持的用途。第一项是规避 DRM、许可检查、反作弊系统以及其他保护措施。然后是游戏作弊、绕过认证或访问控制，以及专有软件的副本。最后两项是规避 AI 提供商的使用政策，以及转售或共享 AI 账户。

## 美国：17 U.S.C. 1201 {#s-the-readme-use-rule-and-the-law-united-states-17-u-s-c-1201}

**Circumvention：** 按 1201(a)(3)(A)，在未经版权所有人许可的情况下绕过技术保护措施的行为。解扰、解密、绕过、移除、停用以及削弱该措施都算 {{law 17 U.S.C. 1201(a)(3)(A)}}。第 1201(a)(1)(A) 条禁止它。

第 1201(f) 条是逆向工程例外，它叠了四层限制。当事人必须对程序副本有合法使用权。规避必须只有一个目的。该目的是找出并分析独立创建的程序为与其他程序互操作所需要的那部分程序。那些部分在此之前不能已经很容易为该当事人所获得。这些行为不得依同一标题构成版权侵权 {{law 17 U.S.C. 1201(f)(1)}}。

第 1201(f)(4) 条定义了关键词。Interoperability 是程序交换信息以及使用它们所交换信息的能力 {{law 17 U.S.C. 1201(f)(4)}}。第 1201(j) 条覆盖安全测试。它把安全测试定义为仅为一个目的访问计算机、系统或网络。该目的是善意地测试、调查或纠正安全缺陷。所有者或运营者必须给予许可 {{law 17 U.S.C. 1201(j)(1)}}。

第 1201(f) 条只是反规避规则的例外。它不决定你在分析时制作的副本是否构成版权侵权。第 1201(c)(1) 条把那个问题留给版权法。它写明第 1201 条不改变版权侵权的权利、救济、限制或抗辩。合理使用是那些抗辩之一 {{law 17 U.S.C. 1201(c)(1)}}。下面两个判决回答了它。

## 欧盟：Directive 2009/24/EC {#s-the-readme-use-rule-and-the-law-european-union-directive-2009-24-ec}

第 1(2) 条定下基础。指令不给程序任何部分背后的思想与原则提供版权保护。那包括其接口背后的思想 {{law Directive 2009/24/EC Article 1(2)}}。随后两条规定给合法用户两项权利。

第 5(3) 条是研究运行中程序的权利。有权使用一份副本的人，可以在未经权利人许可的情况下观察、研究或测试程序如何工作。目标必须是找出程序某一部分背后的思想与原则。条件是当事人在做许可已经允许的事时这样做：加载、显示、运行、传输或存储该程序 {{law Directive 2009/24/EC Article 5(3)}}。欧盟法院在 C-406/10 中适用了它。那里被许可人研究了 SAS System，以便在第二个程序中复现其功能，没有反编译，也未侵权。

第 6(1) 条是反编译权。当复制代码并翻译其形式是获取某些信息所必需时，它不需要许可。那些信息是独立创建的程序为与其他程序互操作所需要的信息 {{law Directive 2009/24/EC Article 6(1)}}。

随后有三个条件。第一，有权使用一份副本的人实施这些行为。第二，互操作所需信息在此之前并非很容易获得 {{law Directive 2009/24/EC Article 6(1)(b)}}。第三，这些行为停留在互操作所需要的程序部分之内 {{law Directive 2009/24/EC Article 6(1)(c)}}。

第 6(2)(c) 条随后禁止用结果去开发、生产或销售表达实质相似的程序 {{law Directive 2009/24/EC Article 6(2)(c)}}。合同不能拿走这些权利。按第 8 条，违背第 6 条或违背第 5(2) 与 5(3) 条例外的合同条款无效 {{law Directive 2009/24/EC Article 8}}。在 C-13/20 中法院又加了第三条路径。合法购买者可按第 5(1) 条反编译以纠正错误，不必满足第 6 条条件。反编译不得超出纠正所需 {{law C-13/20 ruling 2}}。

## 两个判决：Sega v. Accolade 与 Sony v. Connectix {#s-the-readme-use-rule-and-the-law-two-decisions-sega-v-accolade-and-sony-v-connectix}

在 Sega Enterprises Ltd. v. Accolade, Inc., 977 F.2d 1510 (9th Cir. 1992) 中，Accolade 购买了 Genesis 主机与卡带，反汇编目标代码，写出一份接口需求手册，然后写了自己的游戏。

法院认定，在两个条件成立时，反汇编作为法律问题属于合理使用。反汇编是到达受版权保护程序的思想与功能要素的唯一途径。到达它们有正当理由 {{law Sega v. Accolade, 977 F.2d at 1527-1528}}。Accolade 保留的唯一代码是主机要求的 20 到 25 字节的头。

在 Sony Computer Entertainment, Inc. v. Connectix Corp., 203 F.3d 596 (9th Cir. 2000) 中，Connectix 在构建一个不含任何 Sony 代码的模拟器时，多次把 PlayStation BIOS 复制进内存。法院认定，Connectix 在逆向工程 Sony BIOS 时制作的中间副本属于合理使用。那些副本是让它自己的不侵权 Virtual Game Station 能跑 PlayStation 游戏所必需的 {{law Sony v. Connectix, 203 F.3d 596}}。

法院列出了到达程序功能要素的四种方式。其中两种是对指令的静态检查，以及对运行中程序的动态检查，并都称为反汇编。两个判决都保护中间副本，对成品中的复制代码则只字不提。

```figure
id: fig-2-1
kind: decision
title: five questions before the first command
claim: Five questions from 17 USC 1201(f), Directive 2009/24/EC, Sega, and Connectix stand before the first command, and the fixtures of this manual answer all five by construction.
caption: Read the five questions from the top down, and follow a dashed rose arrow at the first no. The references are the statutes and decisions that the sources reference lists.
```

## 本手册的规则 {#s-the-readme-use-rule-and-the-law-the-rule-of-this-manual}

本手册里每一个目标都是为它写的程序。`ledger.c` 与 `ledger-main.c` 是 C 源，`js-app/` 是一个六文件应用，`wasm/ledger.wat` 是手写模块。捕获套件记录它们的哈希与大小：

```listing
title: the fixtures and their hashes
source: capture/out/00-fixtures.txt
lang: text
note: Cut to the two C sources, the two arm64 executables, the module, and its text. The object files, the JavaScript files, and the smoke-test program are cut.
---
01b5d08b…   33872  fixtures/ledger-arm64-O1
…
8bbbaa58…   33872  fixtures/ledger-arm64-O2
…
80af384b…     743  fixtures/ledger-main.c
…
4564c3e7…     568  fixtures/ledger.c
…
699f6ff7…     290  fixtures/wasm/ledger.wasm
2e0b5792…    1841  fixtures/wasm/ledger.wat
```

对这些文件，[图](#fig-2-1) 里的五个问题自行回答。你持有副本，因为是你编译的。目的是研究。不需要别的途径，因为源码就在二进制旁边，两者的比较正是重点。整个程序都是你的，所以那些部分与表达都是你的。

本手册从不分析保护、许可检查、防篡改方案、游戏，或你不拥有的程序。它从不对其 fixture 以外的运行中程序做插桩。

对任何其他程序，先回答那五个问题并把答案写下来。从你合法获得的副本出发。点名法律所点名的目的。法律点名 1201(f) 与第 6 条下的互操作、第 5(3) 条下的研究，以及第 5(1) 条下的错误纠正。它也点名在所有者授权下按 1201(j) 做的安全测试。

检查那些事实是否已经发表。把工作限制在你需要的部分，并让最终产品成为你自己的表达。许可或合同说得更多时，去读它。第 1201(f) 条不覆盖合同法，第 8 条只使违背第 5(2)、5(3) 与 6 条的条款无效。

```takeaways
- 把 `DISCLAIMER.md` 读一遍。取得授权是你的任务，rea 不检查它。
- 在第一条命令之前，写下合法副本、点名的目的，以及缺失的事实。
- 只分析你写的或获准检查的程序，本手册每一节都这样做。
- 为分析保留中间副本，并把复制的代码留在你发布的任何东西之外。
```

Sources: readme Disclaimer (rea README.md); rea DISCLAIMER.md, Responsible use, at 27dc42d; law: 17 U.S.C. 1201(a)(1)(A), (a)(3)(A), (c)(1), (f)(1), (f)(4), (j)(1), Directive 2009/24/EC Articles 1(2), 5(1), 5(3), 6(1), 6(2)(c), 8, CJEU C-406/10 and C-13/20, Sega v. Accolade, 977 F.2d 1510, Sony v. Connectix, 203 F.3d 596; capture/out/00-fixtures.txt
