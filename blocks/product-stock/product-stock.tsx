import { useEffect, useState } from "react";
import { datasource, q, useCurrentRecordId, useRecords } from "@/lib/datasource";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Minus, Plus, ShoppingCart, Sparkles } from "lucide-react";
import { toast } from "sonner";

const ds = datasource.define({ products: "products", stock: "stock" });
const productSelect = q.select({ name: "RJ4aJ", category: "NE6i6", price: "huZy5", sellingPoint: "YrNOY", description: "xN4ON", spec: "iJm3k", heat: "LzYPm", image: "06okE", status: "skKyo" });
const stockSelect = q.select({ aisle: "677yX", qty: "ZNcRL", updatedAt: "ikAmd", machine: "eayDq", product: "wbwWG" });
const CART_KEY = "genki-forest-shopping-cart-v1";
const COUPON_KEY = "genki-claimed-coupons-v1";
const LANG_KEY = "genki-language-v1";
const currency = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" });

type Language = "zh" | "en";
type ClaimedCoupon = { id: string; kind: "PERCENT" | "FREE_CATEGORY"; percent?: number; category?: string; minQuantity: number };

function readLanguage(): Language {
  return window.localStorage.getItem(LANG_KEY) === "zh" ? "zh" : "en";
}
function useLanguage() {
  const [language, setLanguage] = useState<Language>(readLanguage);
  useEffect(() => {
    window.localStorage.setItem(LANG_KEY, language);
    window.dispatchEvent(new Event("genki-language-change"));
  }, [language]);
  return { language, setLanguage, t: (zh: string, en: string) => language === "en" ? en : zh };
}
function useNavigationLanguage(language: Language) {
  useEffect(() => {
    const labels: Record<string, string> = language === "en"
      ? { "首页": "Home", "商品": "Products", "附近柜机": "Cabinets", "库存搜索": "Stock Search", "活动专区": "Events", "我的订单": "My Orders", "管理后台": "Admin" }
      : { "Home": "首页", "Products": "商品", "Cabinets": "附近柜机", "Stock Search": "库存搜索", "Events": "活动专区", "My Orders": "我的订单", "Admin": "管理后台" };
    const translate = () => {
      document.querySelectorAll("header, nav").forEach((root) => {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let node = walker.nextNode();
        while (node) {
          const value = node.nodeValue ?? "";
          const key = value.trim();
          if (labels[key] && labels[key] !== key) node.nodeValue = value.replace(key, labels[key]);
          node = walker.nextNode();
        }
      });
    };
    translate();
    const observer = new MutationObserver(translate);
    document.querySelectorAll("header, nav").forEach((root) => observer.observe(root, { subtree: true, childList: true, characterData: true }));
    return () => observer.disconnect();
  }, [language]);
}
function LanguageToggle({ language, setLanguage }: { language: Language; setLanguage: (value: Language) => void }) {
  return <div className="fixed right-4 top-20 z-[60] flex rounded-full border border-[#CFE3D5] bg-white p-1 shadow-lg"><button className={`rounded-full px-3 py-1.5 text-xs font-bold ${language === "zh" ? "bg-[#1F6B3B] text-white" : "text-[#3C5748]"}`} onClick={() => setLanguage("zh")}>中文</button><button className={`rounded-full px-3 py-1.5 text-xs font-bold ${language === "en" ? "bg-[#1F6B3B] text-white" : "text-[#3C5748]"}`} onClick={() => setLanguage("en")}>EN</button></div>;
}
function readCoupons(): ClaimedCoupon[] {
  try { const value = JSON.parse(window.localStorage.getItem(COUPON_KEY) ?? "[]"); return Array.isArray(value) ? value : []; } catch { return []; }
}
function linkedId(value: any): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0]?.id ?? null : value.id ?? null;
}
function linkedLabel(value: any): string {
  if (!value) return "";
  return Array.isArray(value) ? value[0]?.label ?? "" : value.label ?? "";
}
const dayOf = (value: any) => {
  if (!value) return "";
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
};

export default function Block() {
  const contextId = useCurrentRecordId();
  const queryId = new URLSearchParams(window.location.search).get("id");
  const recordId = contextId || queryId || "";
  const { language, setLanguage, t } = useLanguage();
  useNavigationLanguage(language);
  const [quantity, setQuantity] = useState(1);
  const [claimedCoupons] = useState<ClaimedCoupon[]>(readCoupons);
  const { data: productData, status: productStatus, error: productError } = useRecords({ from: ds.products, select: productSelect, count: 100 });
  const { data: stockData, status: stockStatus } = useRecords({ from: ds.stock, select: stockSelect, count: 100 });

  const products = productData?.pages.flatMap((p) => p.items) ?? [];
  const allStock = stockData?.pages.flatMap((p) => p.items) ?? [];
  const product = products.find((p) => p.id === recordId);
  const f = product?.fields ?? {};
  const unavailable = f.status?.label === "下架";
  const rows = allStock.filter((item) => linkedId(item.fields.product) === recordId).map((item) => ({ id: item.id, aisle: item.fields.aisle ?? "", qty: Number(item.fields.qty) || 0, updatedAt: item.fields.updatedAt, machine: linkedLabel(item.fields.machine) || t("未指定柜机", "Unassigned cabinet") }));
  const days = Array.from(new Set(rows.map((r) => dayOf(r.updatedAt)).filter(Boolean))).sort();
  const latestDay = days.length ? days[days.length - 1] : "";
  const latestRows = latestDay ? rows.filter((r) => dayOf(r.updatedAt) === latestDay) : rows;
  const totalQty = latestRows.reduce((sum, r) => sum + r.qty, 0);
  const groups = Array.from(latestRows.reduce((map, row) => {
    const list = map.get(row.machine) ?? [];
    list.push(row);
    map.set(row.machine, list);
    return map;
  }, new Map<string, typeof rows>()).entries()).map(([machine, items]) => ({ machine, items, sum: items.reduce((sum, r) => sum + r.qty, 0) })).sort((a, b) => b.sum - a.sum);

  const percentCoupon = claimedCoupons.find((c) => c.kind === "PERCENT");
  const freeCategoryCoupon = claimedCoupons.find((c) => c.kind === "FREE_CATEGORY" && c.category === f.category?.label);
  const couponHint = freeCategoryCoupon
    ? t("已领取冰茶试饮券：此商品结算时可享 1 件免费", "Ice tea trial coupon claimed: one item is free at checkout")
    : percentCoupon
      ? (quantity >= (percentCoupon.minQuantity ?? 12) ? t("本商品已满足 8 折券条件，结算时可用", "This item meets the 20% off coupon condition") : t(`已领取 8 折券：订单满 ${percentCoupon.minQuantity ?? 12} 件可用`, `20% off coupon claimed: valid with ${percentCoupon.minQuantity ?? 12} items`))
      : t("活动页有可领取优惠券，领取后可在结算时使用", "Coupons are available on the events page and can be used at checkout");

  function addToCart() {
    if (!product || unavailable) return;
    try {
      const saved = JSON.parse(window.localStorage.getItem(CART_KEY) ?? "{}");
      const cart = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
      cart[product.id] = Math.min(99, (Number(cart[product.id]) || 0) + quantity);
      window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
      window.dispatchEvent(new Event("genki-cart-change"));
      toast.success(t("已加入购物车", "Added to cart"));
    } catch { toast.error(t("暂时无法加入购物车", "Unable to add to cart")); }
  }

  if (productStatus === "pending" || stockStatus === "pending") return <div className="container py-16"><LanguageToggle language={language} setLanguage={setLanguage} /><div className="content text-sm text-[#5B6F62]">{t("正在加载商品详情…", "Loading product details…")}</div></div>;
  if (productStatus === "error") return <div className="container py-16"><LanguageToggle language={language} setLanguage={setLanguage} /><div className="content text-sm text-red-700">{productError?.message}</div></div>;
  if (!product) return <div className="container py-16"><LanguageToggle language={language} setLanguage={setLanguage} /><div className="content mx-auto max-w-md rounded-2xl border bg-white p-8 text-center"><h1 className="text-xl font-bold">{t("没有找到这个商品", "Product not found")}</h1><a href="/" className="mt-5 inline-block text-[#1F6B3B] underline">← {t("返回主页", "Back to home")}</a></div></div>;

  return (
    <div className="container py-8 sm:py-10">
      <LanguageToggle language={language} setLanguage={setLanguage} />
      <div className="content">
        <a href="/" className="inline-flex items-center gap-2 text-sm text-[#5B6F62] hover:text-[#14301F]"><ArrowLeft className="h-4 w-4" />{t("返回商品列表", "Back to products")}</a>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div className="flex min-h-[420px] items-center justify-center overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#FFF0D8,#F9D9E2)] p-8">
            {f.image ? <img src={f.image} alt={f.name} className="max-h-[430px] w-full object-contain mix-blend-multiply" /> : <ShoppingCart className="h-20 w-20 text-white" />}
          </div>
          <div className="py-2">
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#EAF5E7] px-3 py-1 text-xs font-semibold text-[#1F6B3B]">{f.category?.label ?? t("饮品", "Drink")}</span>{unavailable && <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">{t("已下架", "Unavailable")}</span>}</div>
            <h1 className="mt-4 text-4xl font-black tracking-[-.04em] text-[#14301F]">{f.name}</h1>
            <p className="mt-3 text-lg font-medium text-[#3C5748]">{f.sellingPoint}</p>
            <p className="mt-4 text-sm leading-7 text-[#5B6F62]">{f.description}</p>
            <div className="mt-6 flex items-end gap-3"><span className="text-4xl font-black text-[#14301F]">{currency.format(f.price ?? 0)}</span><span className="pb-1 text-sm text-[#5B6F62]">/ {f.spec || t("件", "item")}</span></div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-[#F3F8F4] p-3"><span className="text-xs text-[#5B6F62]">{t("规格", "Specification")}</span><p className="mt-1 font-semibold">{f.spec || "—"}</p></div><div className="rounded-xl bg-[#F3F8F4] p-3"><span className="text-xs text-[#5B6F62]">{t("热量", "Calories")}</span><p className="mt-1 font-semibold">{typeof f.heat === "number" ? `${f.heat} kcal` : "—"}</p></div></div>

            <div className="mt-5 flex items-start gap-2 rounded-2xl border border-[#D8E8DC] bg-[#F3F8F4] p-4 text-sm text-[#1F6B3B]"><Sparkles className="mt-0.5 h-4 w-4 shrink-0" /><a href="/events" className="leading-6 hover:underline">{couponHint}</a></div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 rounded-full bg-gray-100 p-1"><Button variant="ghost" size="sm" className="rounded-full" disabled={quantity <= 1} onClick={() => setQuantity((q) => Math.max(1, q - 1))}><Minus className="h-4 w-4" /></Button><span className="w-8 text-center font-bold">{quantity}</span><Button variant="ghost" size="sm" className="rounded-full" disabled={quantity >= 99} onClick={() => setQuantity((q) => Math.min(99, q + 1))}><Plus className="h-4 w-4" /></Button></div>
              <Button className="h-12 flex-1 rounded-full bg-[#1F6B3B] px-7 text-white hover:bg-[#17542E]" disabled={unavailable} onClick={addToCart}><ShoppingCart className="mr-2 h-4 w-4" />{t("加入购物车", "Add to cart")}</Button>
            </div>
          </div>
        </div>

        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black tracking-[.2em] text-[#1F6B3B]">STOCK AVAILABILITY</p><h2 className="mt-2 text-2xl font-bold text-[#14301F]">{t("柜机库存分布", "Cabinet availability")}</h2></div><p className="text-sm text-[#5B6F62]">{t("当前总库存", "Total stock")} <strong className="text-[#14301F]">{totalQty}</strong> {t("瓶", "bottles")}</p></div>
          {groups.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-[#CFE3D5] p-8 text-center text-sm text-[#5B6F62]">{t("这个商品目前没有库存记录", "No stock records for this product")}</div> : <div className="mt-5 grid gap-4 md:grid-cols-2">{groups.map((group) => <div key={group.machine} className="rounded-2xl border border-[#D8E8DC] bg-white"><div className="flex items-center justify-between border-b border-[#EEF5F0] px-4 py-3"><span className="font-semibold text-[#14301F]">{group.machine}</span><span className="text-xs text-[#5B6F62]">{t("共", "Total")} {group.sum} {t("瓶", "bottles")}</span></div><div className="divide-y divide-[#EEF5F0]">{group.items.map((row) => <div key={row.id} className="flex items-center justify-between px-4 py-2.5 text-sm"><span className="text-[#5B6F62]">{t("货道", "Slot")} {row.aisle || "—"}</span><span className={row.qty === 0 ? "text-red-600" : "font-semibold text-[#1F6B3B]"}>{row.qty === 0 ? t("已售空", "Sold out") : `${row.qty} ${t("瓶", "bottles")}`}</span></div>)}</div></div>)}</div>}
        </section>
      </div>
    </div>
  );
}
