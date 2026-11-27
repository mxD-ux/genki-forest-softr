import { useMemo, useState } from "react";
import { datasource, q, useRecordCreate, useRecordDelete, useRecordUpdate, useRecords } from "@/lib/datasource";
import { useCurrentUser } from "@/lib/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

const ADMIN_EMAILS = ["2051182778@qq.com"];
const ADMIN_EMAIL = ADMIN_EMAILS[0].toLowerCase();
const isAdminEmail = (email?: string | null) => ADMIN_EMAILS.includes((email ?? "").toLowerCase());
const ds = datasource.define({
  stock: "stock",
  products: "products",
  machines: "machines",
  users: "users",
  orders: "orders",
});

const userSelect = q.select({ name: "qE8CD", email: "wLC3j", phone: "ulwRm", createdAt: "FDsTj" });
const userUpdateFields = q.select({ name: "qE8CD", phone: "ulwRm" });
const orderSelect = q.select({
  code: "G6lqU",
  qty: "CsoPm",
  amount: "byTbA",
  status: "HYCVr",
  created: "h92rp",
  buyer: "vCrzk",
  product: "59iV0",
  machine: "4XKOd",
});
const orderUpdateFields = q.select({ status: "HYCVr" });
const stockSelect = q.select({ product: "wbwWG", machine: "eayDq", qty: "ZNcRL", slot: "677yX" });
const stockCreateFields = q.select({ product: "wbwWG", machine: "eayDq", qty: "ZNcRL", slot: "677yX" });
const stockUpdateFields = q.select({ qty: "ZNcRL", slot: "677yX" });
const productSelect = q.select({ name: "RJ4aJ" });
const machineSelect = q.select({ name: "ML6Le" });

const ORDER_STATUSES = [
  { id: "0a02f8b3-7087-4950-bbfc-4b6a1263f936", label: "待取货" },
  { id: "3fcf80ac-c9f2-4a7c-bcfb-0f358635e5d0", label: "已完成" },
  { id: "69f7ec59-5f3a-4b6a-bf37-7a0037fc8b28", label: "已取消" },
];
const CANCELLED_STATUS_ID = "69f7ec59-5f3a-4b6a-bf37-7a0037fc8b28";
const money = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" });
const sanitizePhone = (raw: string) => raw.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");

type EditingUser = { id: string; name: string; phone: string; email: string };
type StockDraft = { qty: string; slot: string };

function AdminConsole() {
  const [tab, setTab] = useState<"users" | "orders" | "stock">("users");
  const [keyword, setKeyword] = useState("");
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [showCreateStock, setShowCreateStock] = useState(false);
  const [newStock, setNewStock] = useState({ product: "", machine: "", slot: "", qty: "0" });
  const [stockDrafts, setStockDrafts] = useState<Record<string, StockDraft>>({});

  const { data: userData, status: usersStatus, error: usersError, refetch: refetchUsers } = useRecords({ from: ds.users, select: userSelect, count: 100 });
  const { data: orderData, status: ordersStatus, error: ordersError, refetch: refetchOrders } = useRecords({ from: ds.orders, select: orderSelect, orderBy: q.desc("created"), count: 100 });
  const { data: stockData, status: stockStatus, error: stockError, refetch: refetchStock } = useRecords({ from: ds.stock, select: stockSelect, count: 100 });
  const { data: productData } = useRecords({ from: ds.products, select: productSelect, count: 100 });
  const { data: machineData } = useRecords({ from: ds.machines, select: machineSelect, count: 100 });

  const updateUser = useRecordUpdate({
    from: ds.users,
    fields: userUpdateFields,
    onSuccess: async () => { await refetchUsers(); setEditingUser(null); toast.success("用户信息已更新"); },
    onError: (error) => toast.error(error.message),
  });
  const deleteUser = useRecordDelete({
    from: ds.users,
    onSuccess: async () => { await refetchUsers(); toast.success("用户已删除"); },
    onError: (error) => toast.error(error.message),
  });
  const updateOrder = useRecordUpdate({
    from: ds.orders,
    fields: orderUpdateFields,
    onSuccess: async () => { await refetchOrders(); toast.success("订单状态已更新"); },
    onError: (error) => toast.error(error.message),
  });
  const deleteOrder = useRecordDelete({
    from: ds.orders,
    onSuccess: async () => { await refetchOrders(); toast.success("订单已删除"); },
    onError: (error) => toast.error(error.message),
  });
  const createStock = useRecordCreate({
    from: ds.stock,
    fields: stockCreateFields,
    onSuccess: async () => {
      await refetchStock();
      setNewStock({ product: "", machine: "", slot: "", qty: "0" });
      setShowCreateStock(false);
      toast.success("库存已新增");
    },
    onError: (error) => toast.error(error.message),
  });
  const updateStock = useRecordUpdate({
    from: ds.stock,
    fields: stockUpdateFields,
    onSuccess: async () => { await refetchStock(); toast.success("库存已更新"); },
    onError: (error) => toast.error(error.message),
  });
  const deleteStock = useRecordDelete({
    from: ds.stock,
    onSuccess: async () => { await refetchStock(); toast.success("库存已删除"); },
    onError: (error) => toast.error(error.message),
  });

  const users = userData?.pages.flatMap((p) => p.items) ?? [];
  const orders = orderData?.pages.flatMap((p) => p.items) ?? [];
  const stock = stockData?.pages.flatMap((p) => p.items) ?? [];
  const productOptions = productData?.pages.flatMap((p) => p.items) ?? [];
  const machineOptions = machineData?.pages.flatMap((p) => p.items) ?? [];

  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.fields.status?.label === "待取货").length;
    const revenue = orders.reduce((sum, o) => sum + (o.fields.amount ?? 0), 0);
    return { users: users.length, orders: orders.length, pending, revenue };
  }, [users, orders]);

  const ordersByUser = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((o) => {
      const key = (o.fields.buyer ?? "unknown") as string;
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return map;
  }, [orders]);

  const kw = keyword.trim().toLowerCase();
  const shownUsers = users.filter((u) => !kw || `${u.fields.name ?? ""} ${u.fields.email ?? ""}`.toLowerCase().includes(kw));
  const shownOrders = orders.filter((o) => !kw || `${o.fields.code ?? ""} ${o.fields.product?.label ?? ""} ${o.fields.buyer ?? ""}`.toLowerCase().includes(kw));
  const shownStock = stock.filter((s) => !kw || `${s.fields.product?.label ?? ""} ${s.fields.machine?.label ?? ""}`.toLowerCase().includes(kw));
  const busy = [updateUser, deleteUser, updateOrder, deleteOrder, createStock, updateStock, deleteStock].some((mutation) => mutation.status === "pending");

  const tabBtn = (key: typeof tab, label: string) => (
    <button type="button" onClick={() => setTab(key)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${tab === key ? "bg-[#1F6B3B] text-white" : "bg-[#EEF5F0] text-[#3C5748] hover:bg-[#E3EFE7]"}`}>
      {label}
    </button>
  );

  const onDeleteUser = (id: string, email: string) => {
    if (!deleteUser.enabled || isAdminEmail(email)) return;
    if (!window.confirm(`确定永久删除用户 ${email} 吗？这可能影响其登录和订单关联，且无法撤销。`)) return;
    deleteUser.mutate(id);
  };

  const onOrderStatus = (recordId: string, statusId: string) => {
    if (!updateOrder.enabled) return;
    if (statusId === CANCELLED_STATUS_ID && !window.confirm("确定将该订单取消吗？取消后状态仍可再次修改，但请确认已与用户核对。")) return;
    updateOrder.mutate({ recordId, fields: { status: statusId } });
  };

  const onDeleteOrder = (id: string, code: string) => {
    if (!deleteOrder.enabled) return;
    if (!window.confirm(`确定永久删除订单 ${code} 吗？交易记录将无法恢复。`)) return;
    deleteOrder.mutate(id);
  };

  const onCreateStock = () => {
    if (!createStock.enabled) return;
    if (!newStock.product || !newStock.machine || !newStock.slot.trim()) {
      toast.error("请选择商品和柜机，并填写货道");
      return;
    }
    const qty = Number(newStock.qty);
    if (!Number.isFinite(qty) || qty < 0) {
      toast.error("库存数量必须是大于或等于 0 的数字");
      return;
    }
    createStock.mutate({ product: newStock.product, machine: newStock.machine, slot: newStock.slot.trim(), qty });
  };

  const onSaveStock = (id: string, original: StockDraft) => {
    if (!updateStock.enabled) return;
    const draft = stockDrafts[id] ?? original;
    const qty = Number(draft.qty);
    if (!Number.isFinite(qty) || qty < 0 || !draft.slot.trim()) {
      toast.error("请填写有效货道和非负库存数量");
      return;
    }
    updateStock.mutate({ recordId: id, fields: { slot: draft.slot.trim(), qty } });
  };

  const onDeleteStock = (id: string, label: string) => {
    if (!deleteStock.enabled) return;
    if (!window.confirm(`确定删除库存记录 ${label} 吗？此操作无法撤销。`)) return;
    deleteStock.mutate(id);
  };

  return (
    <div className="container py-10">
      <div className="content space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black tracking-[.2em] text-[#1F6B3B]">ADMIN CONSOLE</p>
            <h1 className="mt-2 text-3xl font-bold text-[#14301F]">运营后台</h1>
            <p className="mt-1 text-sm text-[#5B6F62]">管理员邮箱白名单模式 · 用户、订单与库存管理</p>
          </div>
          <span className="rounded-full bg-[#E7F4EA] px-3 py-1.5 text-xs font-semibold text-[#1F6B3B]">管理员已验证</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ["注册用户", stats.users, "人"],
            ["订单总数", stats.orders, "笔"],
            ["待取货", stats.pending, "笔"],
            ["订单金额", money.format(stats.revenue), ""],
          ].map(([label, value, unit]) => (
            <div key={String(label)} className="rounded-2xl border border-[#D8E8DC] bg-white p-5">
              <p className="text-xs text-[#5B6F62]">{label}</p>
              <p className="mt-2 text-2xl font-bold text-[#14301F]">{value}<span className="ml-1 text-sm font-normal text-[#5B6F62]">{unit}</span></p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {tabBtn("users", `用户 ${users.length}`)}
            {tabBtn("orders", `订单 ${orders.length}`)}
            {tabBtn("stock", `库存 ${stock.length}`)}
          </div>
          <div className="flex flex-wrap gap-2">
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索姓名 / 邮箱 / 订单号 / 商品" className="h-10 w-full max-w-xs rounded-full" />
            {tab === "stock" && createStock.enabled && <Button className="rounded-full bg-[#1F6B3B]" onClick={() => setShowCreateStock(true)}><Plus className="mr-1 h-4 w-4" />新增库存</Button>}
          </div>
        </div>

        {(usersStatus === "error" || ordersStatus === "error" || stockStatus === "error") && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{usersError?.message || ordersError?.message || stockError?.message}</div>
        )}

        <div className="overflow-hidden rounded-2xl border border-[#D8E8DC] bg-white">
          {tab === "users" && (
            <div className="overflow-x-auto">
              <div className="min-w-[900px] divide-y divide-[#EEF5F0]">
                <div className="grid grid-cols-[1.1fr_1.5fr_1fr_.6fr_.9fr] gap-3 bg-[#F3F8F4] px-5 py-3 text-xs font-semibold text-[#3C5748]"><span>姓名</span><span>邮箱</span><span>注册时间</span><span>订单数</span><span>操作</span></div>
                {usersStatus === "pending" && <p className="px-5 py-8 text-center text-sm text-[#5B6F62]">正在加载用户…</p>}
                {shownUsers.map((u) => {
                  const email = u.fields.email ?? "";
                  const isCurrentAdmin = isAdminEmail(email);
                  return (
                    <div key={u.id} className="grid grid-cols-[1.1fr_1.5fr_1fr_.6fr_.9fr] items-center gap-3 px-5 py-3 text-sm">
                      <span className="font-medium text-[#14301F]">{u.fields.name ?? "-"}{isCurrentAdmin && <span className="ml-2 text-xs text-[#1F6B3B]">管理员</span>}</span>
                      <span className="truncate text-[#5B6F62]">{email || "-"}</span>
                      <span className="text-[#5B6F62]">{String(u.fields.createdAt ?? "").slice(0, 10)}</span>
                      <span className="font-semibold text-[#1F6B3B]">{ordersByUser.get(email) ?? 0}</span>
                      <span className="flex gap-1">
                        {updateUser.enabled && <Button variant="ghost" size="sm" disabled={busy} onClick={() => setEditingUser({ id: u.id, name: u.fields.name ?? "", phone: u.fields.phone ?? "", email })}><Pencil className="h-4 w-4" /></Button>}
                        {deleteUser.enabled && <Button variant="ghost" size="sm" disabled={busy || isCurrentAdmin} title={isCurrentAdmin ? "不能删除当前管理员" : "永久删除用户"} onClick={() => onDeleteUser(u.id, email)}><Trash2 className="h-4 w-4 text-[#B42318]" /></Button>}
                      </span>
                    </div>
                  );
                })}
                {shownUsers.length === 0 && usersStatus !== "pending" && <p className="px-5 py-8 text-center text-sm text-[#5B6F62]">没有匹配的用户</p>}
              </div>
            </div>
          )}

          {tab === "orders" && (
            <div className="overflow-x-auto">
              <div className="min-w-[1120px] divide-y divide-[#EEF5F0]">
                <div className="grid grid-cols-[1.1fr_1.2fr_.5fr_.7fr_1fr_1.1fr_.6fr] gap-3 bg-[#F3F8F4] px-5 py-3 text-xs font-semibold text-[#3C5748]"><span>订单号</span><span>商品</span><span>数量</span><span>金额</span><span>状态</span><span>下单人</span><span>操作</span></div>
                {ordersStatus === "pending" && <p className="px-5 py-8 text-center text-sm text-[#5B6F62]">正在加载订单…</p>}
                {shownOrders.map((o) => (
                  <div key={o.id} className="grid grid-cols-[1.1fr_1.2fr_.5fr_.7fr_1fr_1.1fr_.6fr] items-center gap-3 px-5 py-3 text-sm">
                    <span className="font-medium text-[#14301F]">{o.fields.code ?? "-"}</span>
                    <span className="truncate text-[#5B6F62]">{o.fields.product?.label ?? "-"}</span>
                    <span className="text-[#5B6F62]">{o.fields.qty ?? 0}</span>
                    <span className="text-[#14301F]">{money.format(o.fields.amount ?? 0)}</span>
                    <span>
                      <select className="h-9 rounded-lg border border-[#CFE3D5] bg-white px-2 text-xs" value={ORDER_STATUSES.find((s) => s.label === o.fields.status?.label)?.id ?? ""} disabled={!updateOrder.enabled || busy} onChange={(e) => onOrderStatus(o.id, e.target.value)}>
                        {ORDER_STATUSES.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}
                      </select>
                    </span>
                    <span className="truncate text-[#5B6F62]">{o.fields.buyer ?? "-"}</span>
                    <span>{deleteOrder.enabled && <Button variant="ghost" size="sm" disabled={busy} onClick={() => onDeleteOrder(o.id, o.fields.code ?? o.id)}><Trash2 className="h-4 w-4 text-[#B42318]" /></Button>}</span>
                  </div>
                ))}
                {shownOrders.length === 0 && ordersStatus !== "pending" && <p className="px-5 py-8 text-center text-sm text-[#5B6F62]">没有匹配的订单</p>}
              </div>
            </div>
          )}

          {tab === "stock" && (
            <div className="overflow-x-auto">
              <div className="min-w-[980px] divide-y divide-[#EEF5F0]">
                <div className="grid grid-cols-[1.3fr_1.3fr_.9fr_.7fr_1fr] gap-3 bg-[#F3F8F4] px-5 py-3 text-xs font-semibold text-[#3C5748]"><span>商品</span><span>柜机</span><span>货道</span><span>数量</span><span>操作</span></div>
                {stockStatus === "pending" && <p className="px-5 py-8 text-center text-sm text-[#5B6F62]">正在加载库存…</p>}
                {shownStock.map((s) => {
                  const original = { qty: String(s.fields.qty ?? 0), slot: s.fields.slot ?? "" };
                  const draft = stockDrafts[s.id] ?? original;
                  return (
                    <div key={s.id} className="grid grid-cols-[1.3fr_1.3fr_.9fr_.7fr_1fr] items-center gap-3 px-5 py-3 text-sm">
                      <span className="font-medium text-[#14301F]">{s.fields.product?.label ?? "-"}</span>
                      <span className="text-[#5B6F62]">{s.fields.machine?.label ?? "-"}</span>
                      <Input value={draft.slot} disabled={!updateStock.enabled || busy} onChange={(e) => setStockDrafts((prev) => ({ ...prev, [s.id]: { ...draft, slot: e.target.value } }))} className="h-9" />
                      <Input type="number" min="0" value={draft.qty} disabled={!updateStock.enabled || busy} onChange={(e) => setStockDrafts((prev) => ({ ...prev, [s.id]: { ...draft, qty: e.target.value } }))} className="h-9" />
                      <span className="flex gap-1">
                        {updateStock.enabled && <Button variant="ghost" size="sm" disabled={busy} onClick={() => onSaveStock(s.id, original)}><Check className="h-4 w-4 text-[#1F6B3B]" /></Button>}
                        {deleteStock.enabled && <Button variant="ghost" size="sm" disabled={busy} onClick={() => onDeleteStock(s.id, `${s.fields.product?.label ?? "库存"} / ${s.fields.machine?.label ?? "柜机"}`)}><Trash2 className="h-4 w-4 text-[#B42318]" /></Button>}
                      </span>
                    </div>
                  );
                })}
                {shownStock.length === 0 && stockStatus !== "pending" && <p className="px-5 py-8 text-center text-sm text-[#5B6F62]">没有匹配的库存</p>}
              </div>
            </div>
          )}
        </div>

        <p className="text-xs leading-5 text-[#5B6F62]">注意：删除用户、订单和库存均为永久操作；取消订单请将状态改为“已取消”。当前管理员账号不能删除自身。</p>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-[#14301F]">编辑用户</h2><Button variant="ghost" size="sm" onClick={() => setEditingUser(null)}><X className="h-4 w-4" /></Button></div>
            <p className="mt-1 truncate text-sm text-[#5B6F62]">{editingUser.email}</p>
            <label className="mt-5 block text-xs font-semibold text-[#3C5748]">姓名</label>
            <Input value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} className="mt-2" />
            <label className="mt-4 block text-xs font-semibold text-[#3C5748]">手机号（国际格式，如 +8613...）</label>
            <Input value={editingUser.phone} onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })} className="mt-2" />
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingUser(null)}>取消</Button>
              <Button className="bg-[#1F6B3B]" disabled={updateUser.status === "pending"} onClick={() => updateUser.enabled && updateUser.mutate({ recordId: editingUser.id, fields: { name: editingUser.name.trim(), phone: sanitizePhone(editingUser.phone) } })}>保存</Button>
            </div>
          </div>
        </div>
      )}

      {showCreateStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-[#14301F]">新增库存</h2><Button variant="ghost" size="sm" onClick={() => setShowCreateStock(false)}><X className="h-4 w-4" /></Button></div>
            <label className="mt-5 block text-xs font-semibold text-[#3C5748]">商品</label>
            <select className="mt-2 h-10 w-full rounded-md border border-[#CFE3D5] bg-white px-3 text-sm" value={newStock.product} onChange={(e) => setNewStock({ ...newStock, product: e.target.value })}><option value="">请选择商品</option>{productOptions.map((p) => <option key={p.id} value={p.id}>{p.fields.name}</option>)}</select>
            <label className="mt-4 block text-xs font-semibold text-[#3C5748]">柜机</label>
            <select className="mt-2 h-10 w-full rounded-md border border-[#CFE3D5] bg-white px-3 text-sm" value={newStock.machine} onChange={(e) => setNewStock({ ...newStock, machine: e.target.value })}><option value="">请选择柜机</option>{machineOptions.map((m) => <option key={m.id} value={m.id}>{m.fields.name}</option>)}</select>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-semibold text-[#3C5748]">货道</label><Input value={newStock.slot} onChange={(e) => setNewStock({ ...newStock, slot: e.target.value })} className="mt-2" placeholder="如 A-01" /></div>
              <div><label className="block text-xs font-semibold text-[#3C5748]">数量</label><Input type="number" min="0" value={newStock.qty} onChange={(e) => setNewStock({ ...newStock, qty: e.target.value })} className="mt-2" /></div>
            </div>
            <div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={() => setShowCreateStock(false)}>取消</Button><Button className="bg-[#1F6B3B]" disabled={createStock.status === "pending"} onClick={onCreateStock}>确认新增</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Block() {
  const user = useCurrentUser();
  if (!user) {
    return <div className="container py-16"><div className="content mx-auto max-w-md rounded-2xl border border-[#D8E8DC] bg-white p-8 text-center"><h1 className="text-xl font-bold text-[#14301F]">请先登录</h1><p className="mt-2 text-sm text-[#5B6F62]">登录后可验证后台访问权限。</p></div></div>;
  }
  if (!isAdminEmail(user.email)) {
    return (
      <div className="container py-16">
        <div className="content mx-auto max-w-md rounded-2xl border border-[#D8E8DC] bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-[#14301F]">无权限</h1>
          <p className="mt-2 text-sm text-[#5B6F62]">当前账号：{user.email}</p>
          <p className="mt-1 text-xs text-[#5B6F62]">该页面仅管理员可访问。</p>
        </div>
      </div>
    );
  }
  return <AdminConsole />;
}
