# 页面清单与权限

> 应用：元气森林智能售货机（`d32688cc-5465-48ee-aee2-e377e3bfe728`）
> 共 14 个业务页 + 9 个系统页。

## 业务页

| # | 路径 | 名称 | 类型 | 页面权限 | 主要代码块 |
|---|---|---|---|---|---|
| 1 | `/` | 首页 | USER | 登录用户 | `shop-drinks`、`admin-entry` |
| 2 | `/products` | 商品 | USER | 登录用户 | 原生 List 块 + 语言切换 |
| 3 | `/cabinets` | 柜机 | USER | 登录用户 | 原生 List 块 + 语言切换 |
| 4 | `/cabinet` | 柜机详情 | USER | 登录用户 | 语言切换 |
| 5 | `/stock` | 库存搜索 | USER | 登录用户 | Google Map + List 块 + 语言切换 |
| 6 | `/stock-pro` | 库存搜索 Pro | USER | 登录用户 | `stock-search`、`admin-entry` |
| 7 | `/product-stock` | 商品库存详情 | USER | 登录用户 | `product-stock` |
| 8 | `/events` | 活动专区 | USER | 登录用户 | `events`、`admin-entry` |
| 9 | `/activities` | 活动 | USER | 登录用户 | 原生 List 块 |
| 10 | `/orders` | 我的订单 | USER | 登录用户 | `my-orders`、`admin-entry` |
| 11 | `/checkout` | 结算支付 | USER | 所有用户 | `checkout` |
| 12 | `/admin` | 管理后台 | USER | 登录用户 + 代码白名单 | `admin-console` |
| 13 | `/support` | AI 客服 | USER | 所有用户 | `ai-support` |
| 14 | `/account` | 账户设置 | USER_ACCOUNT | 登录用户 | Softr 内置账户设置块 |

## 系统页

| 路径 | 名称 | 类型 |
|---|---|---|
| `/login` | Log in | LOG_IN |
| `/sign-up` | Sign up | SIGN_UP |
| `/forgot-password` | Forgot password | FORGOT_PASSWORD |
| `/reset-password` | Reset password | RESET_PASSWORD |
| `/onboarding` | Onboarding flow | ONBOARDING_FLOW |
| `/404` | Page not found | PAGE_NOT_FOUND |
| `/401` | Permission denied | PERMISSION_DENIED |
| `/link-expired` | Link expired | LINK_EXPIRED |
| `/c7cdf289-…` | Shared blocks 容器 | SHARED_BLOCKS |

## 权限说明

### 用户组

应用仅有 3 个**预定义组**（套餐不含自定义用户组）：

- `All users` — 所有人
- `Logged in users` — 已登录用户
- `Non logged in users` — 未登录游客

### 管理员识别

不依赖用户组，而是**代码白名单**：

```ts
const ADMIN_EMAIL = "2051182778@qq.com";
const email = (user?.email ?? "").toLowerCase();
if (email !== ADMIN_EMAIL) return null; // 非管理员不渲染
```

- 首页 / 库存搜索 / 活动专区 / 我的订单 四页各有一个 `admin-entry` 块，仅管理员可见。
- `/admin` 页的 `admin-console` 块同样以邮箱白名单判断，非管理员显示「无权限」。

### 设备维度

| 设备 | 行为 |
|---|---|
| 桌面 + 手机（双端） | 管理员 / 普通用户均可登录，完整功能 |
| 平板（机载） | 游客模式，导航仅「首页」；结算页展示会员支付二维码 |

> 平板登录按钮受 Softr 导航设备可见性限制（平板跟随桌面端），无法单独隐藏。
