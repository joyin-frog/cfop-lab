# CFOP LAB

一个面向个人学习的三阶 CFOP 中文公式库，包含 Cross 训练原则、41 个 F2L、57 个 OLL 与 21 个 PLL。

## 本地运行

```bash
pnpm install
pnpm dev
```

构建生产版本：

```bash
pnpm build
```

## 功能

- Cross / F2L / OLL / PLL 阶段导航
- 共 119 个标准案例，支持分组、搜索、收藏和学习状态筛选
- 列表图在构建时通过 `cubing.js` 从公式逆推并生成本地 SVG
- 详情页使用无控制栏的 3D 魔方；鼠标悬停或手机点按公式步骤即可逐手演示
- 案例详情、公式复制、备选 F2L 公式和拿法提示
- 桌面双栏目录与手机响应式布局
- 学习进度保存在当前浏览器 `localStorage`

第三方数据与许可见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。
