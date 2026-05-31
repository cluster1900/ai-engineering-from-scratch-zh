# Lesson 13 - 内部 MCP Server（TypeScript）

capstone 的 TypeScript 部分。Python 侧（`code/main.py`）交付
registry 和 policy gate；这个项目是 MCP transport：手写的、通过 stdio 传输的
newline-delimited JSON-RPC 2.0，配有三个 mock incident tools。不使用
`@modelcontextprotocol/sdk`；你会看到 wire 上的每一个 byte。

## 布局

```text
src/
  index.ts      entry: fixture demo（默认）或 stdio loop（--serve）
  transport.ts  stdin readline + fixture replay
  protocol.ts   initialize / tools/list / tools/call / shutdown
  tools.ts      三个 incident tools + executors
  types.ts      JSON-RPC + tool shapes
tests/
  protocol.test.ts  roundtrip、list shape、dispatch、parse error
```

## 运行

```bash
npm install
npm run typecheck
npm test
npm start            # 自行终止的 fixture demo
npm run serve        # 真正的 stdio loop（等待 stdin）
```
