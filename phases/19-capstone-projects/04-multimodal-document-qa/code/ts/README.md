# Capstone 04 - Multimodal Document QA (TypeScript)

Viewer 骨架，会为文档返回一个页面图片 URL，以及一个包含引用 bounding
boxes 的 JSON 列表。HTML 响应内联了一小段 canvas-overlay 脚本，
用于在页面图片上方绘制被引用的区域。与 `../main.py` 中的 Python
pipeline 配套使用。

## Layout

```text
ts/
  package.json
  tsconfig.json
  src/
    index.ts        # entrypoint、demo + HTTP server
    server.ts       # hono app、/health、/、/document/:id
    fixtures.ts     # 10-K table + Nature figure fixtures
    render.ts       # HTML index + 单文档 overlay renderer
    types.ts        # DocumentFixture、EvidenceRegion、BoundingBox
  tests/
    fixtures.test.ts
    render.test.ts
    server.test.ts
```

## Run

```bash
npm install
npm run typecheck
npm test
npm start          # 一次 self-check，通过后以 0 退出
npm run serve      # 127.0.0.1:<port> 上的交互式 HTTP server
```

当未设置 `PORT` 时，交互式 server 会选择一个空闲端口，并在 stdout 打印
所选 URL。访问 `/` 查看 index，访问 `/document/10k-acme-2025` 查看
demo overlay，或设置 `accept: application/json` 获取结构化响应。

## Tests

通过 tsx 使用 `node --test` runner。Tests 覆盖 fixture lookup（正向 + 负向）、
五个恶意字符的 HTML escaping、document HTML payload 结构，以及 hono routes
（200、404、content negotiation）。
