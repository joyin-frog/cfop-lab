# CFOP LAB

一个面向个人学习的三阶 CFOP 中文公式库，包含 Cross 训练原则、41 个 F2L、57 个 OLL 与 21 个 PLL。

## 本地运行

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

不配置 Supabase 环境变量也可以使用，学习记录会保存在当前浏览器。需要登录和跨设备同步时，在 `.env.local` 中填写：

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

构建生产版本：

```bash
pnpm build
```

完整检查：

```bash
pnpm check
```

## 部署到 Vercel

这是一个 Vite 单页应用。把 GitHub 仓库导入 Vercel 后，构建配置保持为：

- Framework Preset：`Vite`
- Install Command：`pnpm install --frozen-lockfile`
- Build Command：`pnpm build`
- Output Directory：`dist`

也可以通过 CLI 部署：

```bash
vercel link
vercel --prod
```

### Supabase 云同步

项目使用 Supabase Auth 和带行级权限控制的 PostgreSQL 表保存每个账户的学习记录。通过 Vercel Marketplace 连接 Supabase 后，需要让 Vercel 项目拥有以下公开客户端变量：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

数据库结构在 `supabase/migrations/`。新建 Supabase 项目时，可使用非连接池数据库地址执行迁移：

```bash
psql "$POSTGRES_URL_NON_POOLING" -v ON_ERROR_STOP=1 \
  -f supabase/migrations/20260904070000_create_user_learning_state.sql
```

配置好 `.env.local` 后，可以运行真实权限检查。它会临时创建两个测试用户，验证本人读写、跨用户隔离和匿名访问拦截，并在结束时清理测试用户：

```bash
pnpm verify:supabase
```

## 功能

- Cross / F2L / OLL / PLL 阶段导航
- 共 119 个标准案例，支持分组、搜索、收藏和学习状态筛选
- 列表图在构建时通过 `cubing.js` 从公式逆推并生成本地 SVG
- 详情页使用无控制栏的 3D 魔方；鼠标悬停或手机点按公式步骤即可逐手演示
- 案例详情、公式复制、备选 F2L 公式和拿法提示
- 桌面双栏目录与手机响应式布局
- 学习进度本地优先保存在浏览器；可用邮箱免密登录并通过 Supabase 跨设备同步
- 首次登录自动合并当前浏览器记录，后续切换账户不会串用其他账户的数据

第三方数据与许可见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。
