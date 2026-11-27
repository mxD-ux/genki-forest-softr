# 代码块索引

> 每个 `.tsx` 都是一个 Softr **Vibe Coding Block** 的完整源码，可直接粘贴回 Softr Studio 对应块中。

## 页面 ↔ 代码块映射

| 代码文件 | 对应页面 | 块标题 | 说明 |
|---|---|---|---|
| `home/shop-drinks.tsx` | `/` 首页 | Vibe coding block | 登录后商品选购；未登录展示品牌落地页 |
| `home/admin-entry.tsx` | `/` 首页 | 管理员入口 | 仅 `2051182778@qq.com` 可见 |
| `checkout/checkout.tsx` | `/checkout` 结算支付 | 收银台 | 支付方式、优惠券、扫码支付、订单写入、异常订单 |
| `orders/my-orders.tsx` | `/orders` 我的订单 | 我的订单 | 订单列表、确认取货、订单申诉 |
| `admin/admin-console.tsx` | `/admin` 管理后台 | 管理员库存录入 | 用户 / 订单 / 库存管理，邮箱白名单 |
| `stock-search/stock-search.tsx` | `/stock-pro` 库存搜索 Pro | 库存搜索 | 按商品/柜机搜索库存 |
| `events/events.tsx` | `/events` 活动专区 | 活动专区 | 活动列表与优惠券领取 |
| `product-stock/product-stock.tsx` | `/product-stock` 商品库存详情 | 商品库存详情 | 单商品在各柜机的库存分布 |
| `support/ai-support.tsx` | `/support` AI 客服 | AI 客服 | 关键词匹配版 FAQ 客服 |
| `shared/language-toggle.tsx` | 多个页面 | 语言切换 | 全局中英切换（DOM 翻译） |

## 复用说明

### `shared/language-toggle.tsx`

同一个语言切换块被复用在 7 个页面：

- `/products` 商品
- `/cabinets` 柜机
- `/stock-pro` 库存搜索 Pro
- `/stock` 库存搜索
- `/events` 活动专区
- `/orders` 我的订单（该页另有内置语言切换，此块为导航翻译）
- `/cabinet` 柜机详情

### `home/admin-entry.tsx`

同一个管理员入口块被复用在 4 个页面：

- `/` 首页
- `/stock-pro` 库存搜索 Pro
- `/events` 活动专区
- `/orders` 我的订单

代码完全相同，仅所在页面不同。

## 依赖的 Softr 内置模块

这些模块由 Softr 运行时提供，不在本仓库内：

| 模块 | 用途 |
|---|---|
| `@/lib/datasource` | `datasource.define`、`q.select`、`useRecords`、`useRecordCreate/Update/Delete`、`useCurrentRecordId` |
| `@/lib/user` | `useCurrentUser`（当前登录用户，含 email） |
| `@/lib/editable-settings` | `useTextSetting`、`useImageSetting`、`useArraySetting`、`useNavigationSetting`、`useNavigation` |
| `@/components/ui/button` | Softr 按钮组件 |
| `@/components/ui/input` | Softr 输入框组件 |
| `@/components/navigation-action` | 导航动作组件 |

## 第三方依赖

| 包 | 用途 |
|---|---|
| `lucide-react` | 图标 |
| `qrcode.react` | 二维码（结算页扫码支付） |
| `sonner` | Toast 提示 |
