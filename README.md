# 元气森林智能售货机 · Softr 应用源码导出

> 一个基于 **Softr + Vibe Coding** 的校园智能售货机应用：商品选购、库存搜索、活动优惠券、扫码支付、订单申诉与后台运营。

---

## 这是什么

本项目**不是**传统的前后端代码库，而是 **Softr no-code 应用的源码与配置导出**。

Softr 应用运行在云端，页面、导航、权限由 Softr 平台托管；本仓库收录的是：

- 所有 **Vibe Coding 自定义代码块**的完整源码（React + TypeScript + Tailwind）
- 应用的**页面清单、导航结构、用户组与权限**
- **数据表结构**（字段、类型、关联关系）
- 关键业务逻辑说明

| 项目 | 值 |
|---|---|
| 应用名 | 元气森林智能售货机 |
| Softr App ID | `d32688cc-5465-48ee-aee2-e377e3bfe728` |
| Workspace | `BER` (`751e08c8-4375-4763-9438-84182e8aa382`) |
| 线上地址 | https://larae79836.softr.app |
| 管理员账号 | `2051182778@qq.com`（唯一，锁定） |

---

## 技术栈

| 层 | 技术 |
|---|---|
| 应用平台 | Softr（No-code / AI-native） |
| 自定义组件 | Vibe Coding Block（React + TypeScript + Tailwind CSS） |
| 数据存储 | Softr Databases |
| 图标 | `lucide-react` |
| 二维码 | `qrcode.react` |
| 通知 | `sonner` |

> Softr 运行环境内置模块：`@/lib/datasource`、`@/lib/user`、`@/lib/editable-settings`、`@/components/ui/*`。
> 这些由 Softr 平台提供，不在本仓库内，也不能脱离 Softr 独立运行。

---

## 目录结构

```
softr-genki-forest/
├── README.md
├── .gitignore
├── blocks/
│   ├── home/
│   │   ├── shop-drinks.tsx          # 首页商品选购（含购物车、AI 推荐、优惠券）
│   │   └── admin-entry.tsx          # 管理员专属入口（仅 2051182778@qq.com 可见）
│   ├── checkout/
│   │   └── checkout.tsx             # 收银台（支付方式、优惠券、扫码支付、订单写入）
│   ├── orders/
│   │   └── my-orders.tsx            # 我的订单（订单列表、确认取货、订单申诉）
│   ├── admin/
│   │   └── admin-console.tsx        # 运营后台（用户 / 订单 / 库存管理）
│   ├── stock-search/
│   │   └── stock-search.tsx         # 库存搜索
│   ├── events/
│   │   └── events.tsx               # 活动专区（优惠券领取）
│   ├── product-stock/
│   │   └── product-stock.tsx        # 商品库存详情
│   ├── support/
│   │   └── ai-support.tsx           # AI 客服
│   └── shared/
│       └── language-toggle.tsx      # 语言切换（中文 / EN）
└── docs/
    ├── pages.md                     # 页面清单与权限
    ├── navigation.md                # 导航结构
    └── database-schema.md           # 数据表结构
```

---

## 页面清单（14 个业务页）

| 路径 | 名称 | 说明 |
|---|---|---|
| `/` | 首页 | 商品选购（Shop drinks）、购物车、AI 推荐 |
| `/products` | 商品 | 商品列表 |
| `/cabinets` | 柜机 | 柜机列表 |
| `/cabinet` | 柜机详情 | 单台柜机详情 |
| `/stock` | 库存搜索 | 地图 + 库存列表 |
| `/stock-pro` | 库存搜索 Pro | 高级库存搜索 |
| `/product-stock` | 商品库存详情 | 单商品在各柜机的库存 |
| `/events` | 活动专区 | 优惠券领取 |
| `/activities` | 活动 | 活动列表 |
| `/orders` | 我的订单 | 订单列表、确认取货、订单申诉 |
| `/checkout` | 结算支付 | 收银台、支付方式、扫码支付 |
| `/admin` | 管理后台 | 用户 / 订单 / 库存管理 |
| `/support` | AI 客服 | 智能客服对话 |
| `/account` | 账户设置 | Softr 内置账户页 |

系统页：`/login`、`/sign-up`、`/forgot-password`、`/reset-password`、`/onboarding`、`/404`、`/401`、`/link-expired`、`/permission-denied`。

---

## 核心业务逻辑

### 1. 用户与权限

- **唯一管理员**：`2051182778@qq.com`，通过代码白名单（`ADMIN_EMAIL`）硬编码识别，锁定。
- **普通用户**：注册即普通用户，不落入管理员白名单。
- **导航权限**：
  - 首页 / 库存搜索 / 活动专区 / 我的订单 → 所有登录用户可见
  - 商品 / 附近柜机 / 管理后台 → 管理后台与管理员入口提供，普通用户不可见
- **管理后台拦截**：非管理员访问 `/admin` 直接显示「无权限」，无密码旁路。

### 2. 设备维度（双端 vs 平板）

| 设备 | 能力 |
|---|---|
| 双端（桌面 + 手机） | 支持管理员 / 普通用户登录，完整功能 |
| 平板（机载） | 游客模式，仅显示「首页」导航；结算页提供「跳转至会员账户支付」二维码，扫码转手机支付 |

### 3. 支付与订单

- 结算页支持微信 / 支付宝（演示），登录后可写入订单表。
- **支付加固**：
  - 订单号 = `GF-YYYYMMDD-<时间戳后6位><随机4位>-NN`，防碰撞
  - 金额 `Number.isFinite` 兜底 + 非负
  - 单条订单写入失败自动重试 3 次（600ms / 1200ms 退避）
- **异常订单**：若一次支付**一条订单都没写入成功**，自动生成一条 `状态=异常 / 申诉状态=申诉中` 的订单记录，便于用户在「我的订单」里申诉。
- **订单申诉**：订单表新增 `申诉状态`（无 / 申诉中 / 已处理）与 `申诉说明`，用户可在订单卡片提交/修改申诉。

### 4. 国际化

- 全局语言键：`localStorage["genki-language-v1"]`（`zh` / `en`）
- 切换事件：`window.dispatchEvent(new Event("genki-language-change"))`
- 首页、结算页、我的订单、管理员入口等均跟随全局语言切换。

---

## 说明

1. 本项目是 **Softr 应用源码导出**，不能 `npm install && npm run dev` 独立运行；代码块需在 Softr Studio 的 Vibe Coding 块中运行。
2. 导出的代码是**业务逻辑源码**，不包含 Softr 平台自身的运行时。
3. 数据表结构见 `docs/database-schema.md`，实际数据不在本仓库。
