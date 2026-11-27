import { useEffect, useMemo, useRef, useState } from "react";
import { datasource, q, useRecordCreate, useRecords } from "@/lib/datasource";
import { useArraySetting, useImageSetting, useNavigation, useNavigationSetting, useTextSetting } from "@/lib/editable-settings";
import { NavigationAction } from "@/components/navigation-action";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/user";
import {
  ChevronDown,
  ChevronUp,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
  ArrowRight,
  BrainCircuit,
  RefreshCw,
  Sparkles,
} from "lucide-react";

const ds = datasource.define({ products: "products", orders: "orders", recommendations: "recommendations", stock: "stock" });

const productSelect = q.select({
  name: "RJ4aJ",
  category: "NE6i6",
  price: "huZy5",
  sellingPoint: "YrNOY",
  description: "xN4ON",
  spec: "iJm3k",
  image: "06okE",
  status: "skKyo",
});

const orderSelect = q.select({
  product: "59iV0",
  quantity: "CsoPm",
  orderedAt: "h92rp",
  status: "HYCVr",
  email: "vCrzk",
});

const recommendationSelect = q.select({
  title: "TyiO8",
  userEmail: "ImHjI",
  requestedAt: "ThjKf",
  result: "WMAWL",
  status: "5yhTy",
  error: "SPJqY",
});

const recommendationCreateFields = q.select({
  title: "TyiO8",
  userEmail: "ImHjI",
  requestedAt: "ThjKf",
  purchaseSummary: "mYWRZ",
  productCatalog: "fAWPA",
  status: "5yhTy",
});

type RecommendationEntry = { productId: string; reason: string };

function parseRecommendationEntries(raw?: string): RecommendationEntry[] {
  try {
    const parsed = JSON.parse(raw ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry) => entry && typeof entry.productId === "string" && typeof entry.reason === "string").slice(0, 3);
  } catch {
    return [];
  }
}

const CART_KEY = "genki-forest-shopping-cart-v1";
const currency = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
});

function readCart(): Record<string, number> {
  try {
    const saved = window.localStorage.getItem(CART_KEY);
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([, value]) => typeof value === "number" && value > 0)
        .map(([key, value]) => [key, Math.min(99, Math.floor(value as number))]),
    );
  } catch {
    return {};
  }
}


type GenkiLanguage = "zh" | "en";
type HomeCoupon = { id: string; kind: "PERCENT" | "FREE_CATEGORY"; title: string; titleEn: string; percent?: number; category?: string; minQuantity: number };
const GENKI_LANG_KEY = "genki-language-v1";
const GENKI_COUPON_KEY = "genki-claimed-coupons-v1";
function readGenkiLanguage(): GenkiLanguage { return window.localStorage.getItem(GENKI_LANG_KEY) === "zh" ? "zh" : "en"; }
function useGenkiLanguage() {
  const [language, setLanguage] = useState<GenkiLanguage>(readGenkiLanguage);
  useEffect(() => { window.localStorage.setItem(GENKI_LANG_KEY, language); document.documentElement.lang = language === "zh" ? "zh-CN" : "en"; window.dispatchEvent(new Event("genki-language-change")); }, [language]);
  return { language, setLanguage, t: (zh: string, en: string) => language === "en" ? en : zh };
}
function GenkiLanguageToggle({ language, setLanguage }: { language: GenkiLanguage; setLanguage: (value: GenkiLanguage) => void }) {
  return <div className="fixed right-4 top-20 z-[60] flex rounded-full border border-gray-200 bg-white p-1 shadow-lg"><button type="button" className={`rounded-full px-3 py-1.5 text-xs font-bold ${language === "zh" ? "bg-emerald-600 text-white" : "text-gray-600"}`} onClick={() => setLanguage("zh")}>中文</button><button type="button" className={`rounded-full px-3 py-1.5 text-xs font-bold ${language === "en" ? "bg-emerald-600 text-white" : "text-gray-600"}`} onClick={() => setLanguage("en")}>EN</button></div>;
}
function readHomeCoupons(): HomeCoupon[] {
  try { const value = JSON.parse(window.localStorage.getItem(GENKI_COUPON_KEY) ?? "[]"); return Array.isArray(value) ? value : []; } catch { return []; }
}


const HOME_CATEGORY_EN: Record<string, string> = { "气泡水": "Sparkling Water", "茶饮": "Tea", "乳茶": "Milk Tea", "果汁": "Juice", "电解质水": "Electrolyte Water" };
const HOME_PRODUCT_EN: Record<string, { name: string; sellingPoint: string; description: string }> = {
  mTQFTHXBQyNOMp: { name: "White Peach Sparkling Water", sellingPoint: "0 sugar · 0 fat · 0 calories", description: "White peach aroma with fine bubbles. Best served chilled." },
  Jt5lT9bw2XDL6Z: { name: "Lychee Sparkling Water", sellingPoint: "0 sugar · 0 fat · 0 calories", description: "Sweet lychee flavor with delicate bubbles and a refreshing summer finish." },
  "7c3Pydp547eJaB": { name: "Ran Tea · Oolong", sellingPoint: "Sugar free · Refreshing", description: "Sugar-free oolong tea with a clean aroma and smooth aftertaste." },
  eyNnmQkzQhLyDr: { name: "Ran Tea · Peach Oolong", sellingPoint: "Sugar free · Peach aroma", description: "Oolong tea layered with white peach aroma, light and refreshing." },
  "3dtkIFueg0mmn6": { name: "Milk Tea · Original", sellingPoint: "Low sugar · Creamy", description: "Smooth low-sugar milk tea with a rich, creamy finish." },
  WzRrmN3Z32wVLW: { name: "Milk Tea · Coffee Latte", sellingPoint: "Low sugar · With coffee", description: "A balanced blend of coffee and milk tea for a gentle pick-me-up." },
  cwJqFF3542jakn: { name: "Manfen · Grapefruit Juice", sellingPoint: "100% juice", description: "100% grapefruit juice with a sweet-tart taste and vitamin C." },
  egPXhcvlZCq5xh: { name: "Alienergy · Lime Electrolyte Water", sellingPoint: "0 sugar · Electrolytes", description: "Sugar-free electrolytes for quick hydration after exercise." },
};
function homeCategoryText(value: any, language: GenkiLanguage) { const key = String(value ?? ""); return language === "en" ? HOME_CATEGORY_EN[key] ?? key : key; }
function homeProductText(product: any, field: "name" | "sellingPoint" | "description", language: GenkiLanguage) {
  if (language === "en") return HOME_PRODUCT_EN[product.id]?.[field] ?? product.fields[field] ?? "";
  return product.fields[field] ?? "";
}
function useGenkiNavigationLanguage(language: GenkiLanguage) {
  useEffect(() => {
    const labels: Record<string, string> = language === "en"
      ? { "首页": "Home", "商品": "Products", "附近柜机": "Cabinets", "库存搜索": "Stock Search", "活动": "Events", "活动专区": "Events", "我的订单": "Orders", "管理后台": "Admin" }
      : { "Home": "首页", "Products": "商品", "Cabinets": "附近柜机", "Stock Search": "库存搜索", "Events": "活动专区", "Orders": "我的订单", "Admin": "管理后台" };
    const translate = () => {
      document.querySelectorAll("header, nav").forEach((root) => {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let currentNode = walker.nextNode();
        while (currentNode) {
          const value = currentNode.nodeValue ?? "";
          const key = value.trim();
          if (labels[key] && labels[key] !== key) currentNode.nodeValue = value.replace(key, labels[key]);
          currentNode = walker.nextNode();
        }
      });
    };
    translate();
    const observer = new MutationObserver(translate);
    document.querySelectorAll("header, nav").forEach((root) => observer.observe(root, { subtree: true, childList: true, characterData: true }));
    return () => observer.disconnect();
  }, [language]);
}

function InternalHome() {
  const heading = useTextSetting({
    name: "shopping-heading",
    label: "选购区标题",
    initialValue: "商品选购",
  });
  const subheading = useTextSetting({
    name: "shopping-subheading",
    label: "选购区副标题",
    initialValue: "选择喜欢的饮品，加入购物车",
  });
  const cartLabel = useTextSetting({
    name: "cart-label",
    label: "购物车名称",
    initialValue: "购物车",
  });
  const navigate = useNavigation();
  const { language, setLanguage, t } = useGenkiLanguage();
  useGenkiNavigationLanguage(language);
  const [claimedCoupons] = useState<HomeCoupon[]>(readHomeCoupons);
  const checkoutNavigation = useNavigationSetting({
    name: "checkout-navigation",
    label: "结算页面",
    initialValue: { action: "OPEN_PAGE", destination: "/checkout", openIn: "SELF" },
  });

  const { data, status, error } = useRecords({
    from: ds.products,
    select: productSelect,
    count: 100,
  });

  const user = useCurrentUser();
  const userEmail = user?.email ?? null;
  const { data: orderData, status: orderStatus } = useRecords({
    from: ds.orders,
    select: orderSelect,
    where: q.text("email").is(userEmail ?? "__logged_out__"),
    orderBy: q.desc("orderedAt"),
    count: 10,
    enabled: Boolean(userEmail),
  });
  const {
    data: recommendationData,
    status: recommendationStatus,
    refetch: refetchRecommendations,
    isRefetching: isRecommendationRefetching,
  } = useRecords({
    from: ds.recommendations,
    select: recommendationSelect,
    where: q.text("userEmail").is(userEmail ?? "__logged_out__"),
    orderBy: q.desc("requestedAt"),
    count: 1,
    enabled: Boolean(userEmail),
  });
  const {
    enabled: canCreateRecommendation,
    mutateAsync: createRecommendation,
    status: createRecommendationStatus,
    error: createRecommendationError,
    reset: resetRecommendationMutation,
  } = useRecordCreate({ from: ds.recommendations, fields: recommendationCreateFields });

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("全部");
  const [cart, setCart] = useState<Record<string, number>>(readCart);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiExpanded, setAiExpanded] = useState(false);
  const autoRecommendationStarted = useRef(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // The cart still works for this session if storage is unavailable.
    }
  }, [cart]);

  const products = data?.pages.flatMap((page) => page.items) ?? [];
  const { data: stockData } = useRecords({ from: ds.stock, select: q.select({ product: "wbwWG", qty: "ZNcRL" }), count: 500 });
  const stockByProduct = (stockData?.pages.flatMap((p) => p.items) ?? []).reduce<Record<string, number>>((acc, s) => {
    const pid = s.fields.product?.id;
    if (pid) acc[pid] = (acc[pid] ?? 0) + (s.fields.qty ?? 0);
    return acc;
  }, {});
  const categories = useMemo(
    () => Array.from(new Set(products.map((item) => item.fields.category?.label).filter(Boolean))),
    [products],
  );

  const filteredProducts = products.filter((item) => {
    const matchesCategory = category === "全部" || item.fields.category?.label === category;
    const keyword = search.trim().toLowerCase();
    const matchesSearch = !keyword || [item.fields.name, homeProductText(item, "name", language), homeProductText(item, "sellingPoint", language), homeProductText(item, "description", language)]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
    return matchesCategory && matchesSearch;
  });

  const totalQuantity = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const cartItems = products.filter((item) => (cart[item.id] ?? 0) > 0);
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + (item.fields.price ?? 0) * (cart[item.id] ?? 0),
    0,
  );
  const percentCoupon = claimedCoupons.find((coupon) => coupon.kind === "PERCENT");
  const teaCoupon = claimedCoupons.find((coupon) => coupon.kind === "FREE_CATEGORY" && cartItems.some((item) => item.fields.category?.label === coupon.category));
  const percentEligible = Boolean(percentCoupon && totalQuantity >= percentCoupon.minQuantity);
  const teaEligible = Boolean(teaCoupon);
  const estimatedDiscount = percentEligible && percentCoupon ? Math.round(totalPrice * (1 - (percentCoupon.percent ?? 1)) * 100) / 100 : teaEligible && teaCoupon ? Math.min(...cartItems.filter((item) => item.fields.category?.label === teaCoupon.category).map((item) => item.fields.price ?? 0)) : 0;
  const estimatedTotal = Math.max(0, totalPrice - estimatedDiscount);

  const orders = orderData?.pages.flatMap((page) => page.items) ?? [];
  const recommendationRecords = recommendationData?.pages.flatMap((page) => page.items) ?? [];
  const latestRecommendation = recommendationRecords[0];
  const latestRecommendationStatus = latestRecommendation?.fields.status?.label;
  const recommendationCards = parseRecommendationEntries(latestRecommendation?.fields.result).flatMap((entry) => {
    const product = products.find((item) => item.id === entry.productId);
    return product ? [{ entry, product }] : [];
  });

  useEffect(() => {
    if (totalQuantity === 0) setIsCartOpen(false);
  }, [totalQuantity]);

  async function generateRecommendations() {
    if (!userEmail || !canCreateRecommendation || createRecommendationStatus === "pending") return;
    const purchaseSummary = orders.length
      ? orders.map((order, index) => `${index + 1}. ${order.fields.product?.label ?? "未知商品"} | 数量 ${order.fields.quantity ?? 0} | 下单时间 ${order.fields.orderedAt ?? "未知"} | 状态 ${order.fields.status?.label ?? "未知"}`).join("\n")
      : "该账号暂无历史购买订单，请根据当前时间和商品目录进行冷启动推荐。";
    const productCatalog = products
      .filter((item) => item.fields.status?.label !== "下架")
      .map((item) => `${item.id} | ${homeProductText(item, "name", language)} | ${item.fields.category?.label ?? "未分类"} | 价格 ${item.fields.price ?? 0} 元 | ${item.fields.sellingPoint ?? ""}`)
      .join("\n");
    const requestedAt = new Date().toISOString();
    setAiMessage("");
    resetRecommendationMutation();
    try {
      await createRecommendation({
        title: `AI推荐-${requestedAt}`,
        userEmail,
        requestedAt,
        purchaseSummary,
        productCatalog,
        status: "待处理",
      });
      await refetchRecommendations();
    } catch (requestError) {
      setAiMessage(requestError instanceof Error ? requestError.message : "推荐请求提交失败，请稍后重试");
    }
  }

  useEffect(() => {
    if (autoRecommendationStarted.current) return;
    if (userEmail && status === "success" && orderStatus !== "pending" && recommendationStatus === "success" && !latestRecommendation && canCreateRecommendation) {
      autoRecommendationStarted.current = true;
      void generateRecommendations();
    }
  }, [userEmail, status, orderStatus, recommendationStatus, latestRecommendation, canCreateRecommendation]);

  useEffect(() => {
    if (!latestRecommendation || !["待处理", "处理中"].includes(latestRecommendationStatus ?? "")) return;
    const timer = window.setInterval(() => {
      void refetchRecommendations();
    }, 5000);
    const stopTimer = window.setTimeout(() => window.clearInterval(timer), 130000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(stopTimer);
    };
  }, [latestRecommendation?.id, latestRecommendationStatus, refetchRecommendations]);

  function changeQuantity(productId: string, delta: number) {
    setCart((current) => {
      const nextQuantity = Math.min(99, Math.max(0, (current[productId] ?? 0) + delta));
      const next = { ...current };
      if (nextQuantity === 0) delete next[productId];
      else next[productId] = nextQuantity;
      return next;
    });
  }

  function removeItem(productId: string) {
    setCart((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  }

  function clearCart() {
    setCart({});
    setIsCartOpen(false);
  }

  return (
    <div className="container py-8">
      <GenkiLanguageToggle language={language} setLanguage={setLanguage} />
      <div className="content">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-gray-950 sm:text-2xl">{language === "en" ? "Shop drinks" : heading}</h2>
            <p className="mt-1 text-sm text-gray-500">{language === "en" ? "Choose your drinks and add them to the cart" : subheading}</p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("搜索商品", "Search products")}
              aria-label={t("搜索商品", "Search products")}
              className="h-10 w-full rounded-full border border-gray-200 bg-white pl-10 pr-24 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <a href="/support" className="absolute right-10 top-1/2 -translate-y-1/2 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100">{t("AI客服", "AI Help")}</a>{search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label={t("清空搜索", "Clear search")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {status === "success" && categories.length > 0 && (
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
            {["全部", ...categories].map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => { setCategory(item); window.setTimeout(() => window.scrollTo({ top: 620, behavior: "smooth" }), 80); }}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${category === item ? "bg-emerald-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {item === "全部" ? t("全部", "All") : homeCategoryText(item, language)}
              </button>
            ))}
          </div>
        )}

        <section className="mb-4 overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50 shadow-sm">
          <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm">
                <BrainCircuit className="h-5 w-5" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-950">{t("为你智能推荐", "AI picks for you")}</h2><button type="button" onClick={() => setAiExpanded((v) => !v)} className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-emerald-700">{aiExpanded ? t("收起", "Hide") : t("查看推荐", "Show")}</button>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">DeepSeek AI</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">{orders.length ? t(`根据最近 ${orders.length} 笔购买记录和当前时间生成`, `Based on ${orders.length} recent orders and the current time`) : t("根据当前时间和商品目录进行冷启动推荐", "Based on the current time and product catalog")}</p>
              </div>
            </div>
            {userEmail && canCreateRecommendation && (
              <button
                type="button"
                onClick={() => void generateRecommendations()}
                disabled={createRecommendationStatus === "pending" || ["待处理", "处理中"].includes(latestRecommendationStatus ?? "")}
                className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-violet-600 px-4 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {latestRecommendation ? t("重新生成", "Regenerate") : t("生成专属推荐", "Generate my picks")}
              </button>
            )}
          </div>

          <div className="border-t border-emerald-100/70 bg-white/70 p-3 sm:p-4" style={{ display: aiExpanded ? "block" : "none" }}>
            {!userEmail && (
              <div className="rounded-2xl border border-dashed border-violet-200 bg-white p-5 text-center text-sm text-gray-500">{t("登录后即可根据你的购买记录生成专属推荐", "Sign in to generate picks from your purchase history")}</div>
            )}

            {userEmail && !canCreateRecommendation && (
              <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">{t("当前账号没有推荐生成权限，请登录后再试", "This account cannot generate recommendations. Please sign in again.")}</div>
            )}

            {createRecommendationStatus === "pending" && (
              <div className="flex items-center gap-3 rounded-2xl bg-violet-50 p-4 text-sm text-violet-700"><RefreshCw className="h-4 w-4 animate-spin" /> {t("正在提交匿名化推荐请求...", "Submitting an anonymous recommendation request...")}</div>
            )}

            {["待处理", "处理中"].includes(latestRecommendationStatus ?? "") && (
              <div className="flex flex-col gap-3 rounded-2xl bg-violet-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-sm text-violet-700"><RefreshCw className="h-4 w-4 animate-spin" /> {t("AI 正在分析购买记录与当前时间，结果将自动更新", "AI is analyzing purchases and the current time. Results update automatically.")}</div>
                <button type="button" onClick={() => void refetchRecommendations()} disabled={isRecommendationRefetching} className="text-sm font-medium text-violet-700 underline disabled:opacity-50">{t("手动刷新", "Refresh")}</button>
              </div>
            )}

            {latestRecommendationStatus === "失败" && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p className="font-medium">{t("本次推荐生成失败", "Recommendation failed")}</p>
                <p className="mt-1 text-xs">{latestRecommendation?.fields.error || t("请稍后点击重新生成", "Please try regenerating later")}</p>
              </div>
            )}

            {latestRecommendationStatus === "已完成" && recommendationCards.length > 0 && (
              <div className="grid gap-4 md:grid-cols-3">
                {recommendationCards.map(({ entry, product }) => (
                  <article key={entry.productId} className="flex flex-col rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">{homeCategoryText(product.fields.category?.label, language) || t("推荐商品", "Recommended")}</span>
                      <span className="text-xs text-gray-400">{t("AI 精选", "AI Pick")}</span>
                    </div>
                    <h3 className="mt-3 font-semibold text-gray-950">{homeProductText(product, "name", language)}</h3>
                    <p className="mt-1 text-sm font-bold text-gray-900">{currency.format(product.fields.price ?? 0)}</p>
                    <p className="mt-2 flex-1 text-sm leading-6 text-gray-600">{language === "en" ? `${homeProductText(product, "sellingPoint", language)} · Recommended for you.` : entry.reason}</p>
                    <button type="button" onClick={() => changeQuantity(entry.productId, 1)} className="mt-4 flex h-9 items-center justify-center gap-2 rounded-full bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700">
                      <Plus className="h-4 w-4" /> {t("加入购物车", "Add to cart")}
                    </button>
                  </article>
                ))}
              </div>
            )}

            {latestRecommendationStatus === "已完成" && recommendationCards.length === 0 && (
              <div className="rounded-2xl bg-gray-50 p-4 text-center text-sm text-gray-500">{t("AI 暂未返回可购买的推荐，请重新生成", "No purchasable recommendations yet. Please regenerate.")}</div>
            )}

            {(aiMessage || createRecommendationError) && (
              <p className="mt-3 text-sm text-red-600">{aiMessage || createRecommendationError?.message}</p>
            )}
          </div>
        </section>

        {status === "pending" && (
          <div className="space-y-3" aria-label={t("正在加载商品", "Loading products")}>
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            {t("商品加载失败：", "Unable to load products: ")}{error?.message ?? t("请稍后重试", "Please try again later")}
          </div>
        )}

        {status === "success" && filteredProducts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
            <Package className="mx-auto mb-3 h-8 w-8 text-gray-400" />
            <p className="font-medium text-gray-700">{t("没有找到匹配的商品", "No matching products")}</p>
            <p className="mt-1 text-sm text-gray-500">{t("试试其他关键词或分类", "Try another keyword or category")}</p>
          </div>
        )}

        <div className="space-y-3">
          {filteredProducts.map((item) => {
            const quantity = cart[item.id] ?? 0;
            const unavailable = item.fields.status?.label === "下架";
            return (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:flex-row sm:items-center"
              >
                <a href={`/product-stock?id=${item.id}`} className="flex min-w-0 flex-1 items-center gap-4 rounded-xl outline-none transition hover:bg-emerald-50/60 focus:ring-2 focus:ring-emerald-500" aria-label={`${t("查看商品详情", "View product")}: ${homeProductText(item, "name", language)}`}>
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-100 via-orange-100 to-rose-200">
                    {item.fields.image ? (
                      <img src={item.fields.image} alt={homeProductText(item, "name", language)} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-8 w-8 text-white/90" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-950">{homeProductText(item, "name", language)}</h3>
                      {item.fields.category?.label && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          {homeCategoryText(item.fields.category.label, language)}
                        </span>
                      )}
                      {unavailable && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{t("已下架", "Unavailable")}</span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-gray-500">
                      {[homeProductText(item, "sellingPoint", language), item.fields.spec].filter(Boolean).join(" · ")}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs text-gray-400">{homeProductText(item, "description", language)}</p>
                    <p className="mt-0.5 text-xs font-semibold text-emerald-700">{t("剩", "In stock:")} {stockByProduct[item.id] ?? 0} {t("件", "")}</p>
                  </div>
                </a>

                <div className="flex items-center justify-between gap-5 sm:justify-end">
                  <div className="min-w-20 text-lg font-bold text-gray-950">
                    {currency.format(item.fields.price ?? 0)}
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-gray-50 p-1">
                    <button
                      type="button"
                      onClick={() => changeQuantity(item.id, -1)}
                      disabled={quantity === 0}
                      aria-label={`减少${homeProductText(item, "name", language)}数量`}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-7 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeQuantity(item.id, 1)}
                      disabled={unavailable || quantity >= 99}
                      aria-label={`增加${homeProductText(item, "name", language)}数量`}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {totalQuantity > 0 && <div className="h-28" />}

        {totalQuantity > 0 && (
          <div
            className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 sm:bottom-5"
            style={{ width: "min(680px, calc(100vw - 32px))" }}
          >
            {isCartOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-3 flex max-h-[calc(100vh-180px)] flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl sm:max-h-[60vh]" role="dialog" aria-label={t("购物车明细", "Cart details")}>
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                  <div>
                    <h3 className="font-semibold text-gray-950">{t("购物车明细", "Cart details")}</h3>
                    <p className="mt-0.5 text-xs text-gray-500">{t(`${cartItems.length} 种商品，共 ${totalQuantity} 件`, `${cartItems.length} products · ${totalQuantity} items`)}</p>
                  </div>
                  <button type="button" onClick={clearCart} className="text-sm font-medium text-gray-500 hover:text-red-600">
                    {t("清空", "Clear")}
                  </button>
                </div>

                <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-2">
                  {cartItems.map((item) => {
                    const quantity = cart[item.id] ?? 0;
                    return (
                      <div key={item.id} className="flex items-center gap-3 rounded-2xl px-2 py-3 hover:bg-gray-50">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">{homeProductText(item, "name", language)}</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {currency.format(item.fields.price ?? 0)} × {quantity} = {currency.format((item.fields.price ?? 0) * quantity)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.id, -1)}
                            aria-label={`减少购物车中${homeProductText(item, "name", language)}数量`}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-700 hover:bg-gray-100"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold tabular-nums">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.id, 1)}
                            disabled={quantity >= 99}
                            aria-label={`增加购物车中${homeProductText(item, "name", language)}数量`}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-300"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            aria-label={`从购物车删除${homeProductText(item, "name", language)}`}
                            className="ml-1 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="shrink-0 border-t border-gray-100 bg-[#F3F8F4] px-5 py-3 text-xs text-[#1F6B3B]">
                  {claimedCoupons.length === 0 ? <a href="/events" className="font-semibold hover:underline">{t("有活动优惠券可领取，点击去活动页看看", "Coupons available — visit events to claim")}</a> : <div className="space-y-1">{percentCoupon && <p>{percentEligible ? t("已满足整箱 8 折券条件，结算时可用", "Full-case coupon available at checkout") : t(`整箱 8 折券：还差 ${percentCoupon.minQuantity - totalQuantity} 件可用`, `Full-case coupon: add ${percentCoupon.minQuantity - totalQuantity} more items`)}</p>}{claimedCoupons.some((coupon) => coupon.kind === "FREE_CATEGORY") && <p>{teaEligible ? t("冰茶试饮券可使用：茶饮 1 件免费", "Tea trial coupon available: one tea drink free") : t("冰茶试饮券：订单中加入茶饮即可使用", "Tea trial coupon: add a tea drink to use it")}</p>}</div>}
                </div>
                <div className="flex shrink-0 items-center gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">{t("合计", "Total")}</p>
                    <p className="text-xl font-bold text-gray-950">{currency.format(estimatedTotal)}</p>
                    {estimatedDiscount > 0 && <p className="text-xs font-medium text-emerald-700">{t("预计优惠", "Est. discount")} -{currency.format(estimatedDiscount)}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(checkoutNavigation)}
                    aria-label={t("去结算", "Checkout")}
                    className="flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 font-semibold text-white transition hover:bg-emerald-700"
                  >
                    {t("结算", "Checkout")} <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center rounded-full bg-gray-950 p-2 text-white shadow-2xl">
              <button
                type="button"
                onClick={() => setIsCartOpen((open) => !open)}
                aria-expanded={isCartOpen}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-full px-3 py-1 text-left"
              >
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-gray-950">
                    {totalQuantity}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{language === "en" ? "Cart" : cartLabel}</span>
                  <span className="block text-xs text-white/60">{t("点击查看商品明细", "Tap to view cart details")}</span>
                </span>
                <span className="px-2 text-lg font-bold">{currency.format(totalPrice)}</span>
                {isCartOpen ? <ChevronDown className="mr-2 h-5 w-5" /> : <ChevronUp className="mr-2 h-5 w-5" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const landingProductThemes = [
  { background: "#FFD8DF", accent: "#F27C91", rotate: "-5deg" },
  { background: "#DCD2FF", accent: "#8B72D9", rotate: "4deg" },
  { background: "#E8F5B9", accent: "#739633", rotate: "-3deg" },
];

function LandingStar({ className = "" }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden="true">
      <path d="M50 4C52 32 63 45 94 50C65 54 54 66 50 96C46 66 34 54 6 50C35 46 47 33 50 4Z" fill="currentColor" />
    </svg>
  );
}

function LandingSquiggle({ className = "" }) {
  return (
    <svg viewBox="0 0 180 90" className={className} fill="none" aria-hidden="true">
      <path d="M7 68C28 18 55 15 63 44C72 76 94 77 105 44C116 12 141 16 169 31" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M154 18L172 30L157 45" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PublicLanding() {
  const { language, setLanguage, t } = useGenkiLanguage();
  const eyebrow = useTextSetting({
    name: "landing-eyebrow",
    label: "Landing eyebrow",
    initialValue: "CHI FOREST · SMART RETAIL",
  });
  const heroTitle = useTextSetting({
    name: "landing-hero-title",
    label: "Landing hero title",
    initialValue: "元气美味，触手可及",
  });
  const heroDescription = useTextSetting({
    name: "landing-hero-description",
    label: "Landing hero description",
    initialValue: "把清爽饮品与智能零售带进日常。浏览商品、在线选购，再到附近柜机取货，让每一口元气都更近一点。",
  });
  const heroImage = useImageSetting({
    name: "landing-hero-image",
    label: "Landing hero image",
    initialValue: {
      src: "https://www.yuanqisenlin.com/public/assets/news/official/content/news-78-7dd6048c96.png",
      alt: "元气森林 M1 智能柜",
    },
  });
  const familyImage = useImageSetting({
    name: "landing-family-image",
    label: "Brand family image",
    initialValue: {
      src: "https://www.yuanqisenlin.com/public/assets/brand/brand-family-white-bg.png?v=20260831",
      alt: "元气森林产品全家福",
    },
  });
  const modesImage = useImageSetting({
    name: "landing-modes-image",
    label: "Smart cabinet modes image",
    initialValue: {
      src: "https://www.yuanqisenlin.com/public/assets/news/official/content/news-78-18991b6358.png",
      alt: "元气森林智能柜的多种商品组合模式",
    },
  });
  const products = useArraySetting({
    name: "landing-products",
    label: "Landing product cards",
    schema: {
      title: { type: "text", label: "Product title", initialValue: "产品名称" },
      description: { type: "text", label: "Product description", initialValue: "产品描述" },
      image: { type: "image", label: "Product image" },
    },
    initialValue: [
      {
        title: "爆汁白桃",
        description: "清新香甜，轻盈气泡裹着白桃香气。",
        image: { src: "https://www.yuanqisenlin.com/public/assets/products/official/sparkling-item-1.jpg", alt: "元气森林白桃味气泡水" },
      },
      {
        title: "爆汁葡萄",
        description: "果香浓郁，让清爽多一点层次。",
        image: { src: "https://www.yuanqisenlin.com/public/assets/products/official/sparkling-item-3.jpg", alt: "元气森林爆汁葡萄味气泡水" },
      },
      {
        title: "冰爆小青柠",
        description: "酸甜带劲，唤醒每一个日常瞬间。",
        image: { src: "https://www.yuanqisenlin.com/public/assets/products/official/sparkling-item-4.png", alt: "元气森林冰爆小青柠味气泡水" },
      },
    ],
  });
  const loginNavigation = useNavigationSetting({
    name: "landing-login-navigation",
    label: "Login navigation",
    initialValue: { action: "OPEN_PAGE", destination: "/login", openIn: "SELF" },
  });
  const signUpNavigation = useNavigationSetting({
    name: "landing-signup-navigation",
    label: "Sign up navigation",
    initialValue: { action: "OPEN_PAGE", destination: "/sign-up", openIn: "SELF" },
  });
  const displayHeroTitle = language === "en" ? "Refreshment,within reach" : heroTitle;
  const [heroTitleLead, heroTitleRest = ""] = displayHeroTitle.split(",");

  return (
    <div className="gf-landing gf-v2 overflow-hidden bg-[#F8F6F0] text-[#111111]">
      <GenkiLanguageToggle language={language} setLanguage={setLanguage} />
      <style>{`
        .gf-v2 .gf-hero-grid { display: grid; grid-template-columns: 52% 48%; min-height: calc(100vh - 76px); }
        .gf-v2 .gf-hero-copy { position: relative; z-index: 3; display: flex; flex-direction: column; justify-content: center; padding: 64px clamp(30px,5.5vw,88px); }
        .gf-v2 .gf-hero-title { margin: 22px 0 0; max-width: 760px; font-size: clamp(68px,7.4vw,122px); font-weight: 950; line-height: .92; letter-spacing: -.075em; }
        .gf-v2 .gf-go { display: inline-block; width: fit-content; margin: 10px 0 0 12%; color: #B3A1F4; font-family: "Segoe Print","Comic Sans MS",cursive; font-size: clamp(58px,7vw,112px); font-weight: 900; line-height: .9; letter-spacing: -.08em; transform: rotate(-8deg); }
        .gf-v2 .gf-hero-visual { position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #E6F773; clip-path: polygon(15% 0,100% 0,100% 100%,0 100%); }
        .gf-v2 .gf-hero-visual::before { content: ""; position: absolute; width: 62%; aspect-ratio: 1; border: 2px solid rgba(17,17,17,.14); border-radius: 50%; transform: translate(15%,-8%); }
        .gf-v2 .gf-hero-product { position: relative; z-index: 2; width: 88%; max-height: 69vh; object-fit: contain; mix-blend-mode: multiply; filter: contrast(1.04); animation: gf-v2-float 5.5s ease-in-out infinite; }
        .gf-v2 .gf-sticker { position: absolute; z-index: 4; right: 7%; bottom: 8%; padding: 13px 18px; border: 2px solid #111; background: #fff; box-shadow: 5px 5px 0 #111; font-size: 12px; font-weight: 900; letter-spacing: .13em; transform: rotate(5deg); }
        .gf-v2 .gf-ticker { overflow: hidden; border-top: 2px solid #111; border-bottom: 2px solid #111; background: #E6F773; }
        .gf-v2 .gf-ticker-track { display: flex; width: max-content; animation: gf-v2-marquee 24s linear infinite; }
        .gf-v2 .gf-ticker-set { display: flex; align-items: center; gap: 32px; padding: 17px 16px; white-space: nowrap; font-size: 15px; font-weight: 900; letter-spacing: .08em; }
        .gf-v2 .gf-dot { width: 8px; height: 8px; border-radius: 50%; background: #111; }
        .gf-v2 .gf-flavor-poster { position: relative; min-height: 570px; overflow: hidden; border: 2px solid #111; border-radius: 26px; transition: transform .25s ease, box-shadow .25s ease; }
        .gf-v2 .gf-flavor-poster:hover { transform: translateY(-8px); box-shadow: 8px 8px 0 #111; }
        .gf-v2 .gf-flavor-image { height: 340px; width: 100%; object-fit: contain; mix-blend-mode: multiply; transition: transform .35s ease; }
        .gf-v2 .gf-flavor-poster:hover .gf-flavor-image { transform: rotate(0deg) scale(1.04) !important; }
        .gf-v2 .gf-outline-word { position: absolute; left: -1%; top: 2%; color: transparent; -webkit-text-stroke: 1px rgba(255,255,255,.09); font-size: clamp(100px,17vw,250px); font-weight: 950; line-height: 1; letter-spacing: -.07em; pointer-events: none; }
        .gf-v2 .gf-step { border-top: 2px solid #111; padding-top: 22px; }
        @keyframes gf-v2-float { 0%,100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(-13px) rotate(1deg); } }
        @keyframes gf-v2-marquee { to { transform: translateX(-50%); } }
        @media (max-width: 1023px) {
          .gf-v2 .gf-hero-grid { grid-template-columns: 1fr; min-height: auto; }
          .gf-v2 .gf-hero-copy { padding: 62px 28px 50px; }
          .gf-v2 .gf-hero-title { font-size: clamp(58px,12vw,96px); }
          .gf-v2 .gf-hero-visual { min-height: 580px; clip-path: none; }
          .gf-v2 .gf-hero-product { max-height: 520px; }
        }
        @media (max-width: 640px) {
          .gf-v2 .gf-hero-copy { padding: 48px 20px 42px; }
          .gf-v2 .gf-hero-title { font-size: clamp(52px,16vw,78px); }
          .gf-v2 .gf-go { margin-left: 5%; }
          .gf-v2 .gf-hero-visual { min-height: 450px; }
          .gf-v2 .gf-hero-product { max-height: 410px; }
          .gf-v2 .gf-sticker { right: 5%; bottom: 5%; }
          .gf-v2 .gf-flavor-poster { min-height: 520px; }
          .gf-v2 .gf-flavor-image { height: 300px; }
        }
        @media (prefers-reduced-motion: reduce) { .gf-v2 *, .gf-v2 *::before, .gf-v2 *::after { animation: none !important; transition: none !important; } }
      `}</style>

      <section className="gf-hero-grid">
        <div className="gf-hero-copy">
          <div className="flex items-center gap-3 text-[11px] font-black tracking-[0.2em]">
            <span className="h-3 w-3 rounded-full bg-[#B3A1F4]" />
            {eyebrow}
          </div>
          <h1 className="gf-hero-title">
            {heroTitleLead}，<br />{heroTitleRest}
          </h1>
          <div className="gf-go" aria-hidden="true">GO!</div>
          <LandingSquiggle className="mt-3 h-16 w-36 text-[#111]" />
          <p className="mt-5 max-w-lg text-sm font-medium leading-7 text-black/60 sm:text-base">{language === "en" ? "Discover refreshing drinks, shop online and pick up at a nearby smart cabinet." : heroDescription}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full border-2 border-[#111] bg-[#111] px-7 text-white shadow-[4px_4px_0_#B3A1F4] hover:bg-[#292929]">
              <NavigationAction navigation={loginNavigation}>{t("登录并选购", "Sign in to shop")} <ArrowRight className="ml-2 h-4 w-4" /></NavigationAction>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-2 border-[#111] bg-transparent px-7 text-[#111] hover:bg-white">
              <NavigationAction navigation={signUpNavigation}>{t("注册账户", "Create account")}</NavigationAction>
            </Button>
          </div>
        </div>
        <div className="gf-hero-visual">
          <LandingStar className="absolute right-[9%] top-[9%] z-[3] h-16 w-16 rotate-12 text-[#B3A1F4]" />
          <div className="absolute left-[18%] top-[10%] z-[3] -rotate-6 text-xs font-black tracking-[.18em]">FRESH. SMART. BRIGHT.</div>
          <div className="gf-hero-product" style={{ background: "linear-gradient(165deg,#E9F7D8 0%,#C9EBC8 55%,#9FD9AE 100%)", borderRadius: "38px", minHeight: "58vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px" }}><span style={{ fontSize: "13px", fontWeight: 900, letterSpacing: ".22em", color: "#1F6B3B" }}>GENKI FOREST</span><span style={{ fontSize: "38px", fontWeight: 950, color: "#14301F", letterSpacing: "-.04em" }}>智能柜</span></div>
          <div className="gf-sticker">M1 · SMART CABINET</div>
        </div>
      </section>

      <div className="gf-ticker" aria-label="品牌特点">
        <div className="gf-ticker-track">
          {[0, 1].map((set) => (
            <div className="gf-ticker-set" key={set} aria-hidden={set === 1 ? "true" : undefined}>
              <span>清爽气泡</span><span className="gf-dot" /><span>智能零售</span><span className="gf-dot" /><span>元气美味</span><span className="gf-dot" /><span>触手可及</span><span className="gf-dot" /><span>CHI FOREST GO</span><span className="gf-dot" />
            </div>
          ))}
        </div>
      </div>

      <section id="products" className="relative bg-[#FFE65A] py-20 sm:py-28">
        <LandingStar className="absolute right-[8%] top-16 h-20 w-20 text-[#B3A1F4]" />
        <div className="container">
          <div className="content">
            <div className="text-center">
              <p className="text-xs font-black tracking-[.22em]">OVERFLOWING WITH FLAVOR</p>
              <h2 className="mx-auto mt-5 max-w-5xl text-[clamp(56px,8.2vw,126px)] font-black leading-[.94] tracking-[-.07em]">{language === "en" ? <>Big flavor.<br />Every day.</> : <>把好喝，<br />装进日常。</>}</h2>
              <p className="mx-auto mt-7 max-w-xl text-sm font-medium leading-7 text-black/60">从经典气泡水到多元饮品，用更明亮的色彩与风味，回应每一个想要清爽一点的瞬间。</p>
            </div>
            <div className="relative mx-auto mt-12 max-w-5xl">
              <div className="absolute inset-x-8 bottom-0 h-20 rounded-[50%] bg-black/10 blur-2xl" />
              <div className="relative flex h-[380px] w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#EAF6D9,#CBEBC9)] text-2xl font-black tracking-[-.03em] text-[#1F6B3B]">0 糖 · 0 脂 · 0 卡</div>
            </div>
            <div className="mt-16 grid gap-6 lg:grid-cols-3">
              {products.map((product, index) => {
                const theme = landingProductThemes[index % landingProductThemes.length];
                return (
                  <article key={`${product.title}-${index}`} className="gf-flavor-poster p-6" style={{ backgroundColor: theme.background }}>
                    <div className="flex items-start justify-between">
                      <span className="text-6xl font-black leading-none tracking-[-.07em] text-black/15">0{index + 1}</span>
                      <span className="rounded-full border-2 border-black px-3 py-1 text-[10px] font-black tracking-[.16em]">0 SUGAR</span>
                    </div>
                    <img src={product.image.src} alt={product.image.alt} className="gf-flavor-image -my-3" style={{ transform: `rotate(${theme.rotate})` }} loading="lazy" />
                    <div className="relative border-t-2 border-black pt-5">
                      <p className="text-[10px] font-black tracking-[.2em] text-black/50">SPARKLING WATER</p>
                      <h3 className="mt-2 text-3xl font-black tracking-[-.045em]">{product.title}</h3>
                      <p className="mt-2 text-sm font-medium leading-6 text-black/60">{product.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="experience" className="relative overflow-hidden bg-[#111111] py-24 text-white sm:py-32">
        <div className="gf-outline-word" aria-hidden="true">SMART</div>
        <div className="container relative">
          <div className="content">
            <div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold text-[#E6F773]"><Sparkles className="h-3.5 w-3.5" />CHI FOREST GO</div>
                <h2 className="mt-6 text-[clamp(48px,6vw,88px)] font-black leading-[.98] tracking-[-.06em]">{language === "en" ? <>Smart retail,<br />made refreshingly simple.</> : <>智能零售，<br />也可以很轻盈。</>}</h2>
                <p className="mt-6 max-w-md text-sm leading-7 text-white/55">依托智能识别与数字化运营，让选品更贴近场景，让购买流程更简单。</p>
              </div>
              <div className="relative rounded-[28px] bg-[#F8F6F0] p-5 text-black sm:p-8">
                <div className="mb-4 flex items-center justify-between text-[10px] font-black tracking-[.18em]"><span>ONE CABINET, MORE POSSIBILITIES</span><span>01—03</span></div>
                <div className="flex min-h-[300px] w-full items-center justify-center rounded-2xl bg-[linear-gradient(160deg,#F3FAEC,#D6EFD5)] text-center text-xl font-bold text-[#1F6B3B]">智能柜 · 扫码开门 · 自动结算</div>
              </div>
            </div>
            <div className="mt-16 grid gap-px overflow-hidden border border-white/15 bg-white/15 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["01", "授权开门", "扫码或授权后开启柜门"],
                ["02", "智能识别", "自动识别取走的商品"],
                ["03", "自动结算", "关门后完成结算流程"],
                ["04", "灵活选品", "按场景与口味组合商品"],
              ].map(([number, title, description]) => (
                <div key={number} className="bg-[#111111] p-6 sm:p-7">
                  <span className="text-sm font-black text-[#E6F773]">{number}</span>
                  <h3 className="mt-10 text-2xl font-black">{title}</h3>
                  <p className="mt-3 text-xs leading-6 text-white/45">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#F8F6F0] py-20 sm:py-28">
        <div className="container">
          <div className="content">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="text-xs font-black tracking-[.22em]">FROM SCREEN TO SIP</p><h2 className="mt-4 text-4xl font-black tracking-[-.05em] sm:text-6xl">{t("四步，清爽到手。", "Four steps to refreshment")}</h2></div>
              <p className="max-w-sm text-sm leading-7 text-black/50">从 Web 端登录到查看订单，原有购物流程保持不变。</p>
            </div>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["01", "登录账户", "进入现有账户系统，开始选购。"],
                ["02", "挑选饮品", "浏览商品与风味，加入购物车。"],
                ["03", "在线结算", "确认商品并完成结算支付。"],
                ["04", "取货查单", "查看订单与取货信息。"],
              ].map(([number, title, description]) => (
                <div key={number} className="gf-step">
                  <span className="text-6xl font-black tracking-[-.07em]">{number}</span>
                  <h3 className="mt-7 text-xl font-black">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-black/50">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#B3A1F4] px-5 py-20 text-center sm:py-28">
        <div className="relative mx-auto max-w-5xl">
          <LandingStar className="absolute -left-8 top-0 h-16 w-16 text-[#E6F773]" />
          <p className="text-xs font-black tracking-[.22em]">READY FOR SOME CHI?</p>
          <h2 className="mt-5 text-[clamp(52px,7.5vw,112px)] font-black leading-[.95] tracking-[-.065em]">{language === "en" ? <>Your next refreshment<br />starts here.</> : <>下一瓶清爽，<br />从这里开始。</>}</h2>
          <p className="mx-auto mt-6 max-w-xl text-sm font-medium leading-7 text-black/60">登录后即可使用商品选购、购物车、订单和柜机查询等现有功能。</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-13 rounded-full border-2 border-black bg-black px-8 py-4 text-white shadow-[5px_5px_0_#E6F773] hover:bg-[#292929]"><NavigationAction navigation={loginNavigation}>{t("立即登录", "Sign in now")} <ArrowRight className="ml-2 h-4 w-4" /></NavigationAction></Button>
            <Button asChild size="lg" variant="outline" className="h-13 rounded-full border-2 border-black bg-transparent px-8 py-4 text-black hover:bg-white/30"><NavigationAction navigation={signUpNavigation}>{t("创建账户", "Create account")}</NavigationAction></Button>
          </div>
        </div>
      </section>

      <footer className="border-t-2 border-black bg-[#F8F6F0] py-6">
        <div className="container">
          <div className="content flex flex-col gap-3 text-xs font-medium text-black/50 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-black tracking-[.12em] text-black">CHI FOREST GO</p>
            <p>品牌与产品图片来源：<a href="https://www.yuanqisenlin.com/" target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-black">元气森林官网</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Block() {
  const user = useCurrentUser();
  return user ? <InternalHome /> : <PublicLanding />;
}
