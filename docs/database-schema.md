# 数据表结构（Softr Databases）

> Database ID：`939b3ea9-8a58-44ff-be96-586cd43bbd40`
> 共 6 张表：商品、柜机、库存、订单、用户、AI 推荐。

---

## 1. 商品 `products`

- **Table ID**：`iR8ojp2O9dxorM`
- **主字段**：商品名

| 字段 ID | 名称 | 类型 | 说明 |
|---|---|---|---|
| `RJ4aJ` | 商品名 | SINGLE_LINE_TEXT | 主字段 |
| `NE6i6` | 分类 | SELECT | 气泡水 / 茶饮 / 果汁 / 乳茶 / 电解质水 |
| `huZy5` | 价格 | CURRENCY | ¥ |
| `YrNOY` | 卖点 | SINGLE_LINE_TEXT | 如「0糖 0脂 0卡」 |
| `xN4ON` | 简介 | LONG_TEXT | 商品描述 |
| `iJm3k` | 规格 | SINGLE_LINE_TEXT | 如 480ml |
| `LzYPm` | 热量 | NUMBER | kcal |
| `skKyo` | 状态 | SELECT | 在售 / 下架 |
| `06okE` | 图片 | URL | 商品图 |
| `Zp5Gp` | 订单 | LINKED_RECORD → `orders` | |
| `FU1zu` | 库存 | LINKED_RECORD → `stock` | |

---

## 2. 柜机 `machines`

- **Table ID**：`gLwB51zTy2n1nG`
- **主字段**：柜机名

| 字段 ID | 名称 | 类型 | 说明 |
|---|---|---|---|
| `ML6Le` | 柜机名 | SINGLE_LINE_TEXT | 主字段 |
| `OWpc1` | 区域 | SELECT | 教学楼 / 图书馆 / 宿舍区 / 食堂 / 体育馆 |
| `LW5Kh` | 具体位置 | SINGLE_LINE_TEXT | |
| `pSwfu` | 距离 | NUMBER | 米 |
| `j3NXP` | 营业时间 | SINGLE_LINE_TEXT | |
| `Y2BPW` | 状态 | SELECT | 正常 / 维护中 |
| `KBIQH` | 编号 | SINGLE_LINE_TEXT | |
| `HiSWh` | 库存 | LINKED_RECORD → `stock` | |
| `eIy0r` | 订单 | LINKED_RECORD → `orders` | |
| `sKFMP` | 地图图片 | URL | |
| `J6e7t` | 地图附件 | ATTACHMENT | |

---

## 3. 库存 `stock`

- **Table ID**：`hSMGu9gZbzQ2fL`
- **主字段**：库存编号

| 字段 ID | 名称 | 类型 | 说明 |
|---|---|---|---|
| `hhVzq` | 库存编号 | SINGLE_LINE_TEXT | 主字段 |
| `677yX` | 货道 | SINGLE_LINE_TEXT | 如 A-01 |
| `ZNcRL` | 数量 | NUMBER | |
| `ikAmd` | 更新时间 | DATETIME | |
| `eayDq` | 柜机 | LINKED_RECORD → `machines` | |
| `wbwWG` | 商品 | LINKED_RECORD → `products` | |
| `jQGGy` | 柜机距离 | LOOKUP | 取自柜机.距离 |

---

## 4. 订单 `orders`

- **Table ID**：`GP4AsQA5kusEvH`
- **主字段**：订单号

| 字段 ID | 名称 | 类型 | 说明 |
|---|---|---|---|
| `G6lqU` | 订单号 | SINGLE_LINE_TEXT | 主字段，格式 `GF-YYYYMMDD-XXXXXX-NN` |
| `CsoPm` | 数量 | NUMBER | |
| `byTbA` | 金额 | CURRENCY | ¥ |
| `HYCVr` | 状态 | SELECT | 待取货 / 已完成 / 已取消 / 已取出 / **异常** |
| `FL32L` | 取货码 | SINGLE_LINE_TEXT | 4 位数字 |
| `h92rp` | 下单时间 | DATETIME | |
| `vCrzk` | 下单人 | EMAIL | |
| `4XKOd` | 柜机 | LINKED_RECORD → `machines` | 代码创建订单时未传，可为空 |
| `MAVGK` | 创建人 | CREATED_BY | 系统字段 |
| `59iV0` | 商品 | LINKED_RECORD → `products` | |
| `GbRUk` | 申诉状态 | SELECT | 无 / 申诉中 / 已处理 |
| `yXreP` | 申诉说明 | LONG_TEXT | 用户填写的申诉内容 |

> 所有字段均非必填（`required: false`）。

---

## 5. 用户 `users`

- **Table ID**：`68xLQvb9ec3rEj`
- **主字段**：邮箱

| 字段 ID | 名称 | 类型 |
|---|---|---|
| `wLC3j` | 邮箱 | EMAIL |
| `qE8CD` | 姓名 | SINGLE_LINE_TEXT |
| `ulwRm` | 手机 | PHONE |
| `FDsTj` | 注册时间 | CREATED_AT |

---

## 6. AI 推荐 `recommendations`

> 首页「AI picks for you」使用。

| 字段 ID | 名称 | 类型 |
|---|---|---|
| `TyiO8` | title | |
| `ImHjI` | userEmail | |
| `ThjKf` | requestedAt | |
| `WMAWL` | result | |
| `5yhTy` | status | |
| `SPJqY` | error | |
| `mYWRZ` | purchaseSummary | |
| `fAWPA` | productCatalog | |

---

## 关联关系

```
products ──1:N──> stock <──N:1── machines
    │                              │
    └──────────1:N──> orders <──N:1┘
                         │
                    vCrzk (下单人邮箱)
                         │
                    users.email
```
