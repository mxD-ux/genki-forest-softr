import { useEffect, useState } from "react";
import { useRecordUpdate, datasource, q, useRecords } from "@/lib/datasource";
import { toast } from "sonner";
import { useTextSetting } from "@/lib/editable-settings";
import { useCurrentUser } from "@/lib/user";
import { CheckCircle2, Clock3, MessageCircle, Package, ReceiptText, RefreshCw, ShoppingBag, X } from "lucide-react";

const ds = datasource.define({ orders: "orders" });
const orderSelect = q.select({
  orderNumber: "G6lqU",
  quantity: "CsoPm",
  amount: "byTbA",
  status: "HYCVr",
  pickupCode: "FL32L",
  orderedAt: "h92rp",
  email: "vCrzk",
  product: "59iV0",
  appealStatus: "GbRUk",
  appealNote: "yXreP",
});
const currency = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" });
const orderUpdateFields = q.select({ status: "HYCVr" });
const orderAppealFields = q.select({ appealStatus: "GbRUk", appealNote: "yXreP" });

const LANG_KEY = "genki-language-v1";
type Language = "zh" | "en";
function readLanguage(): Language { return window.localStorage.getItem(LANG_KEY) === "zh" ? "zh" : "en"; }
function useLanguage() {
  const [language, setLanguage] = useState<Language>(readLanguage);
  useEffect(() => {
    window.localStorage.setItem(LANG_KEY, language);
    window.dispatchEvent(new Event("genki-language-change"));
  }, [language]);
  useEffect(() => {
    const handler = () => {
      const next = readLanguage();
      setLanguage((prev) => (prev === next ? prev : next));
    };
    window.addEventListener("genki-language-change", handler);
    return () => window.removeEventListener("genki-language-change", handler);
  }, []);
  return { language, setLanguage, t: (zh: string, en: string) => (language === "en" ? en : zh) };
}

const STATUS_LABELS: Record<string, { zh: string; en: string }> = {
  "待取货": { zh: "待取货", en: "Awaiting pickup" },
  "已完成": { zh: "已完成", en: "Completed" },
  "已取消": { zh: "已取消", en: "Cancelled" },
  "已取出": { zh: "已取出", en: "Picked up" },
  "异常": { zh: "异常", en: "Exception" },
};
const APPEAL_LABELS: Record<string, { zh: string; en: string }> = {
  "无": { zh: "无", en: "None" },
  "申诉中": { zh: "申诉中", en: "In progress" },
  "已处理": { zh: "已处理", en: "Resolved" },
};

function formatTime(value: string | undefined, language: Language) {
  if (!value) return language === "en" ? "Unknown time" : "时间未知";
  const dt = new Intl.DateTimeFormat(language === "en" ? "en-US" : "zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return dt.format(new Date(value));
}

function LanguageToggle({ language, setLanguage }: { language: Language; setLanguage: (value: Language) => void }) {
  return <div className="fixed right-4 top-20 z-[60] flex rounded-full border border-gray-200 bg-white p-1 shadow-lg"><button className={`rounded-full px-3 py-1.5 text-xs font-bold ${language === "zh" ? "bg-emerald-600 text-white" : "text-gray-600"}`} onClick={() => setLanguage("zh")}>中文</button><button className={`rounded-full px-3 py-1.5 text-xs font-bold ${language === "en" ? "bg-emerald-600 text-white" : "text-gray-600"}`} onClick={() => setLanguage("en")}>EN</button></div>;
}

export default function Block() {
  const heading = useTextSetting({ name: "orders-heading", label: "页面标题", initialValue: "我的订单" });
  const user = useCurrentUser();
  const userEmail = user?.email ?? null;
  const { language, setLanguage, t } = useLanguage();
  const [appealOrderId, setAppealOrderId] = useState<string | null>(null);
  const [appealText, setAppealText] = useState("");
  const { data, status, error, refetch, isRefetching } = useRecords({
    from: ds.orders,
    select: orderSelect,
    where: q.text("email").is(userEmail ?? "__logged_out__"),
    orderBy: q.desc("orderedAt"),
    count: 100,
    enabled: Boolean(userEmail),
  });
  const orders = data?.pages.flatMap((page) => page.items) ?? [];
  const pendingCount = orders.filter((item) => item.fields.status?.label === "待取货").length;
  const appealCount = orders.filter((item) => item.fields.appealStatus?.label === "申诉中").length;
  const totalAmount = orders.reduce((sum, item) => sum + (item.fields.amount ?? 0), 0);
  const updateOrder = useRecordUpdate({
    from: ds.orders,
    fields: orderUpdateFields,
    onSuccess: async () => {
      await refetch();
      toast.success(t("已确认取货", "Pickup confirmed"));
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });
  const updateAppeal = useRecordUpdate({
    from: ds.orders,
    fields: orderAppealFields,
    onSuccess: async () => {
      await refetch();
      setAppealOrderId(null);
      setAppealText("");
      toast.success(t("申诉已提交", "Appeal submitted"));
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  const activeAppealOrder = orders.find((order) => order.id === appealOrderId) ?? null;
  const pageTitle = language === "en" ? "My Orders" : heading;
  const statusText = (label?: string) => {
    if (!label) return t("未知状态", "Unknown");
    const entry = STATUS_LABELS[label];
    if (!entry) return label;
    return language === "en" ? entry.en : entry.zh;
  };
  const appealLabelText = (label?: string) => {
    const key = label ?? "无";
    const entry = APPEAL_LABELS[key];
    if (!entry) return key;
    return language === "en" ? entry.en : entry.zh;
  };

  return (
    <div className="container py-8">
      <LanguageToggle language={language} setLanguage={setLanguage} />
      <div className="content mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-950">{pageTitle}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("仅显示当前账号的订单，最新订单排在最前面", "Only your own orders, newest first")}</p>
          </div>
          {userEmail && (
            <button type="button" onClick={() => void refetch()} disabled={isRefetching} className="flex h-10 w-fit items-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} /> {t("刷新订单", "Refresh")}
            </button>
          )}
        </div>

        {!userEmail && (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-gray-300" />
            <h2 className="mt-4 font-semibold text-gray-900">{t("请先登录", "Please sign in")}</h2>
            <p className="mt-1 text-sm text-gray-500">{t("登录后即可查看自己的订单记录", "Sign in to view your orders")}</p>
          </div>
        )}

        {userEmail && status === "pending" && (
          <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse rounded-3xl bg-gray-100" />)}</div>
        )}

        {userEmail && status === "error" && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{t("订单加载失败：", "Failed to load orders: ")}{error?.message ?? t("请稍后重试", "Please try again later")}</div>
        )}

        {userEmail && status === "success" && orders.length === 0 && (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <ReceiptText className="mx-auto h-10 w-10 text-gray-300" />
            <h2 className="mt-4 font-semibold text-gray-900">{t("还没有订单", "No orders yet")}</h2>
            <p className="mt-1 text-sm text-gray-500">{t("完成一次结算后，真实订单会出现在这里", "Complete a checkout and your orders will appear here")}</p>
          </div>
        )}

        {userEmail && status === "success" && orders.length > 0 && (
          <>
            <div className="mb-5 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-xs text-gray-500">{t("订单记录", "Orders")}</p><p className="mt-1 text-xl font-bold text-gray-950">{orders.length}</p></div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-xs text-gray-500">{t("待取货", "Awaiting pickup")}</p><p className="mt-1 text-xl font-bold text-emerald-600">{pendingCount}</p></div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-xs text-gray-500">{t("累计金额", "Total spent")}</p><p className="mt-1 text-xl font-bold text-gray-950">{currency.format(totalAmount)}</p></div>
            </div>

            {appealCount > 0 && (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{t(`有 ${appealCount} 笔订单正在申诉中，管理员处理后会更新状态。`, `${appealCount} order(s) are under appeal; the status updates after review.`)}</div>
            )}

            <div className="space-y-4">
              {orders.map((order) => {
                const rawStatusLabel = order.fields.status?.label ?? "";
                const pending = rawStatusLabel === "待取货";
                const rawAppealLabel = order.fields.appealStatus?.label ?? "无";
                const hasAppeal = rawAppealLabel !== "无";
                return (
                  <article key={order.id} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{t("订单号", "Order no.")}</p>
                        <h2 className="mt-1 font-semibold text-gray-950">{order.fields.orderNumber}</h2>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${pending ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> {statusText(order.fields.status?.label)}
                        </span>
                        {hasAppeal && (
                          <span className={`flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${rawAppealLabel === "申诉中" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                            <MessageCircle className="h-3.5 w-3.5" /> {t("申诉", "Appeal")}: {appealLabelText(rawAppealLabel)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex items-center gap-4 rounded-2xl bg-gray-50 p-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-rose-100"><Package className="h-6 w-6 text-white" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-950">{order.fields.product?.label ?? t("商品信息不可用", "Product unavailable")}</p>
                        <p className="mt-1 text-sm text-gray-500">{t("数量", "Qty")}：{order.fields.quantity ?? 0}</p>
                      </div>
                      <p className="text-lg font-bold text-gray-950">{currency.format(order.fields.amount ?? 0)}</p>
                    </div>

                    {hasAppeal && order.fields.appealNote && (
                      <div className="mt-3 rounded-2xl bg-amber-50/60 px-4 py-3 text-xs leading-5 text-amber-800">{t("申诉说明", "Appeal note")}：{order.fields.appealNote}</div>
                    )}

                    <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-gray-500"><Clock3 className="h-4 w-4" /><span>{formatTime(order.fields.orderedAt, language)}</span></div>
                      <div className="flex items-center gap-2"><span className="text-gray-500">{t("取货码", "Pickup code")}</span><span className="rounded-lg bg-gray-950 px-3 py-1 font-mono text-lg font-bold tracking-widest text-white">{order.fields.pickupCode || "----"}</span></div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => { setAppealOrderId(order.id); setAppealText(order.fields.appealNote ?? ""); }}
                          className="rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
                        >
                          {hasAppeal ? t("修改申诉", "Edit appeal") : t("订单申诉", "Order appeal")}
                        </button>
                        {pending && (
                          <button
                            type="button"
                            disabled={!updateOrder.enabled || updateOrder.status === "pending"}
                            onClick={() => updateOrder.mutate({ recordId: order.id, fields: { status: "已取出" } })}
                            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {updateOrder.status === "pending" ? t("处理中…", "Processing...") : t("确认取货", "Confirm pickup")}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>

      {activeAppealOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-950">{t("订单申诉", "Order appeal")}</h2>
              <button type="button" onClick={() => { setAppealOrderId(null); setAppealText(""); }} className="rounded-full p-1 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-1 text-sm text-gray-500">{t("订单号", "Order no.")}：{activeAppealOrder.fields.orderNumber}</p>
            <label className="mt-5 block text-xs font-semibold text-gray-600">{t("申诉说明", "Appeal details")}</label>
            <textarea
              value={appealText}
              onChange={(event) => setAppealText(event.target.value)}
              rows={4}
              placeholder={t("请描述遇到的问题，例如：支付成功但未出货、商品与订单不符、取货码无法使用等", "Describe the issue, e.g. paid but nothing dispensed, wrong item, or pickup code not working")}
              className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => { setAppealOrderId(null); setAppealText(""); }} className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">{t("取消", "Cancel")}</button>
              <button
                type="button"
                disabled={!appealText.trim() || updateAppeal.status === "pending"}
                onClick={() => updateAppeal.mutate({ recordId: activeAppealOrder.id, fields: { appealStatus: "申诉中", appealNote: appealText.trim() } })}
                className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
              >
                {updateAppeal.status === "pending" ? t("提交中…", "Submitting...") : t("提交申诉", "Submit appeal")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
