import { useEffect, useRef, useState } from "react";
import { datasource, q, useRecordCreate, useRecords } from "@/lib/datasource";
import { useNavigation, useNavigationSetting, useTextSetting } from "@/lib/editable-settings";
import { useCurrentUser } from "@/lib/user";
import { ArrowLeft, Check, CheckCircle2, CreditCard, Loader2, LockKeyhole, MessageCircle, Package, ShieldCheck, ShoppingBag, Smartphone, Ticket } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const ds = datasource.define({ products: "products", orders: "orders" });
const checkoutSelect = q.select({ name: "RJ4aJ", category: "NE6i6", price: "huZy5", image: "06okE", spec: "iJm3k" });
const orderCreateFields = q.select({ orderNumber: "G6lqU", quantity: "CsoPm", amount: "byTbA", status: "HYCVr", pickupCode: "FL32L", orderedAt: "h92rp", email: "vCrzk", product: "59iV0", appealStatus: "GbRUk", appealNote: "yXreP" });
const CART_KEY = "genki-forest-shopping-cart-v1";
const COUPON_KEY = "genki-claimed-coupons-v1";
const LANG_KEY = "genki-language-v1";
const currency = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" });
const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
type Language = "zh" | "en";
type Coupon = { id: string; kind: "PERCENT" | "FREE_CATEGORY"; title: string; titleEn: string; description: string; descriptionEn: string; percent?: number; category?: string; minQuantity: number };

function readCart(): Record<string, number> {
  try {
    const saved = window.localStorage.getItem(CART_KEY);
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, value]) => typeof value === "number" && value > 0).map(([key, value]) => [key, Math.min(99, Math.floor(value as number))]));
  } catch { return {}; }
}
function readCoupons(): Coupon[] {
  try { const value = JSON.parse(window.localStorage.getItem(COUPON_KEY) ?? "[]"); return Array.isArray(value) ? value : []; } catch { return []; }
}
function readLanguage(): Language { return window.localStorage.getItem(LANG_KEY) === "zh" ? "zh" : "en"; }
function useLanguage() {
  const [language, setLanguage] = useState<Language>(readLanguage);
  useEffect(() => { window.localStorage.setItem(LANG_KEY, language); window.dispatchEvent(new Event("genki-language-change")); }, [language]);
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
  return <div className="fixed right-4 top-20 z-[60] flex rounded-full border border-gray-200 bg-white p-1 shadow-lg"><button className={`rounded-full px-3 py-1.5 text-xs font-bold ${language === "zh" ? "bg-emerald-600 text-white" : "text-gray-600"}`} onClick={() => setLanguage("zh")}>中文</button><button className={`rounded-full px-3 py-1.5 text-xs font-bold ${language === "en" ? "bg-emerald-600 text-white" : "text-gray-600"}`} onClick={() => setLanguage("en")}>EN</button></div>;
}

export default function Block() {
  const heading = useTextSetting({ name: "checkout-heading", label: "支付页标题", initialValue: "收银台" });
  const demoNotice = useTextSetting({ name: "demo-notice", label: "演示提示", initialValue: "演示支付环境，不会产生真实扣款" });
  const memberPayUrl = useTextSetting({ name: "member-pay-url", label: "会员支付链接", initialValue: "" });
  const navigate = useNavigation();
  const homeNavigation = useNavigationSetting({ name: "return-home", label: "返回商城页面", initialValue: { action: "OPEN_PAGE", destination: "/", openIn: "SELF" } });
  const user = useCurrentUser();
  const userEmail = user?.email ?? null;
  const { language, setLanguage, t } = useLanguage();
  useNavigationLanguage(language);
  const { data, status, error } = useRecords({ from: ds.products, select: checkoutSelect, count: 100 });
  const { enabled: canCreateOrders, mutateAsync: createOrder, reset: resetOrderMutation } = useRecordCreate({ from: ds.orders, fields: orderCreateFields });
  const isLoggedIn = !!userEmail && canCreateOrders;
  const qrValue = memberPayUrl || (typeof window !== "undefined" ? window.location.origin + "/checkout" : "/checkout");
  const [cart] = useState<Record<string, number>>(readCart);
  const [claimedCoupons] = useState<Coupon[]>(readCoupons);
  const [selectedCouponId, setSelectedCouponId] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("wechat");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [orderMessage, setOrderMessage] = useState("");
  const [completedOrderCount, setCompletedOrderCount] = useState(0);
  const [completedPickupCode, setCompletedPickupCode] = useState("");
  const orderBatchRef = useRef<{ key: string; pickupCode: string; createdCount: number; orderNumbers: string[] } | null>(null);

  const paymentMethods = [
    { id: "wechat", name: t("微信支付", "WeChat Pay"), description: t("使用微信扫码或微信余额支付", "Pay with a QR code or WeChat balance"), icon: MessageCircle, color: "bg-emerald-500" },
    { id: "alipay", name: t("支付宝", "Alipay"), description: t("使用支付宝余额或绑定银行卡支付", "Use Alipay balance or a linked bank card"), icon: CreditCard, color: "bg-blue-500" },
  ];
  const products = data?.pages.flatMap((page) => page.items) ?? [];
  const cartItems = products.filter((item) => (cart[item.id] ?? 0) > 0);
  const totalQuantity = cartItems.reduce((sum, item) => sum + (cart[item.id] ?? 0), 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.fields.price ?? 0) * (cart[item.id] ?? 0), 0);
  const selectedMethod = paymentMethods.find((method) => method.id === selectedPayment) ?? paymentMethods[0];
  const selectedCoupon = claimedCoupons.find((coupon) => coupon.id === selectedCouponId) ?? null;

  const couponResult = (() => {
    if (!selectedCoupon) return { eligible: false, discount: 0, reason: "" };
    if (selectedCoupon.kind === "PERCENT") {
      const eligible = totalQuantity >= selectedCoupon.minQuantity;
      return {
        eligible,
        discount: eligible ? roundMoney(totalPrice * (1 - (selectedCoupon.percent ?? 1))) : 0,
        reason: eligible ? t("已满足使用条件", "Condition met") : t(`还差 ${selectedCoupon.minQuantity - totalQuantity} 件即可使用`, `Add ${selectedCoupon.minQuantity - totalQuantity} more items to use this coupon`),
      };
    }
    const eligibleItems = cartItems.filter((item) => item.fields.category?.label === selectedCoupon.category);
    const eligible = eligibleItems.length > 0;
    const unitPrice = eligible ? Math.min(...eligibleItems.map((item) => item.fields.price ?? 0)) : 0;
    return { eligible, discount: eligible ? Math.min(totalPrice, unitPrice) : 0, reason: eligible ? t("茶饮商品可享 1 件免费", "One tea drink is free") : t("订单中需要包含茶饮商品", "Add a tea drink to use this coupon") };
  })();
  const discount = couponResult.eligible ? couponResult.discount : 0;
  const payableTotal = Math.max(0, roundMoney(totalPrice - discount));
  const discountedLineAmounts = (() => {
    if (!discount) return cartItems.map((item) => roundMoney((item.fields.price ?? 0) * (cart[item.id] ?? 0)));
    let allocated = 0;
    return cartItems.map((item, index) => {
      const lineSubtotal = (item.fields.price ?? 0) * (cart[item.id] ?? 0);
      if (index === cartItems.length - 1) return roundMoney(payableTotal - allocated);
      const amount = roundMoney(lineSubtotal * (payableTotal / totalPrice));
      allocated += amount;
      return amount;
    });
  })();

  async function handlePayment() {
    if (!cartItems.length || paymentStatus === "processing") return;
    if (!userEmail || !canCreateOrders) {
      setPaymentStatus("error");
      setOrderMessage(t("请先登录，登录后才能生成真实订单记录", "Sign in to create order records"));
      return;
    }
    setPaymentStatus("processing");
    setOrderMessage("");
    resetOrderMutation();
    try {
      if (!orderBatchRef.current) {
        const now = new Date();
        const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
        const randomPart = `${String(Date.now()).slice(-6)}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        orderBatchRef.current = { key: `GF-${datePart}-${randomPart}`, pickupCode: String(Math.floor(1000 + Math.random() * 9000)), createdCount: 0, orderNumbers: [] };
      }
      const batch = orderBatchRef.current;
      for (let index = batch.createdCount; index < cartItems.length; index++) {
        const item = cartItems[index];
        const quantity = cart[item.id] ?? 0;
        const orderNumber = `${batch.key}-${String(index + 1).padStart(2, "0")}`;
        const rawAmount = discountedLineAmounts[index];
        const amount = Number.isFinite(rawAmount) ? Math.max(0, roundMoney(rawAmount)) : 0;
        let lastError: unknown = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            await createOrder({ orderNumber, quantity, amount, status: "待取货", pickupCode: batch.pickupCode, orderedAt: new Date().toISOString(), email: userEmail, product: [item.id] });
            lastError = null;
            break;
          } catch (err) {
            lastError = err;
            if (attempt < 2) await new Promise((resolve) => window.setTimeout(resolve, 600 * (attempt + 1)));
          }
        }
        if (lastError) throw lastError;
        batch.orderNumbers.push(orderNumber);
        batch.createdCount = index + 1;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      window.localStorage.removeItem(CART_KEY);
      if (selectedCoupon && couponResult.eligible) {
        const remaining = readCoupons().filter((coupon) => coupon.id !== selectedCoupon.id);
        window.localStorage.setItem(COUPON_KEY, JSON.stringify(remaining));
      }
      setCompletedOrderCount(batch.createdCount);
      setCompletedPickupCode(batch.pickupCode);
      setPaymentStatus("success");
    } catch (orderError) {
      const created = orderBatchRef.current?.createdCount ?? 0;
      const message = orderError instanceof Error ? orderError.message : t("订单写入失败", "Order creation failed");
      if (created === 0) {
        try {
          const batch = orderBatchRef.current;
          const failOrderNumber = `${batch?.key ?? `GF-${Date.now()}`}-FAIL`;
          const totalQty = cartItems.reduce((sum, item) => sum + (cart[item.id] ?? 0), 0);
          await createOrder({
            orderNumber: failOrderNumber,
            quantity: totalQty,
            amount: Number.isFinite(payableTotal) ? Math.max(0, roundMoney(payableTotal)) : 0,
            status: "异常",
            pickupCode: "",
            orderedAt: new Date().toISOString(),
            email: userEmail,
            product: cartItems.length ? [cartItems[0].id] : [],
            appealStatus: "申诉中",
            appealNote: t(`支付失败自动记录：${message}`, `Auto-recorded payment failure: ${message}`),
          });
          setOrderMessage(t(`支付失败：${message}。已在「我的订单」生成一条异常记录，可在那里提交申诉。`, `Payment failed: ${message}. An exception record was created in My Orders; you can file an appeal there.`));
        } catch {
          setOrderMessage(t(`支付失败：${message}。异常记录也未能写入，请稍后重试。`, `Payment failed: ${message}. The exception record could not be written either; please retry later.`));
        }
      } else {
        setOrderMessage(`${message}${t(` 已成功写入 ${created} 条，重试将从下一条继续。`, ` ${created} orders were created; retrying continues from the next.`)}`);
      }
      setPaymentStatus("error");
    }
  }

  if (paymentStatus === "success") {
    return <div className="container py-10 sm:py-16"><LanguageToggle language={language} setLanguage={setLanguage} /><div className="content mx-auto max-w-lg"><div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-lg sm:p-10" aria-live="polite">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100"><CheckCircle2 className="h-11 w-11 text-emerald-600" /></div>
      <h1 className="mt-6 text-2xl font-bold text-gray-950">{t("支付成功（演示）", "Payment successful (demo)")}</h1><p className="mt-2 text-sm text-gray-500">{t("本次模拟支付已完成，没有产生真实扣款", "The demo payment completed without a real charge")}</p>
      <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800"><p className="font-semibold">{t(`已生成 ${completedOrderCount} 条真实订单记录`, `${completedOrderCount} order records created`)}</p><p className="mt-1">{t("状态：待取货 · 取货码：", "Status: awaiting pickup · Pickup code: ")}<span className="text-lg font-bold">{completedPickupCode}</span></p></div>
      <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-left"><div className="flex justify-between text-sm"><span className="text-gray-500">{t("支付方式", "Payment method")}</span><span className="font-medium text-gray-900">{selectedMethod.name}</span></div><div className="mt-3 flex justify-between text-sm"><span className="text-gray-500">{t("商品数量", "Items")}</span><span className="font-medium text-gray-900">{totalQuantity}</span></div>{discount > 0 && <div className="mt-3 flex justify-between text-sm"><span className="text-gray-500">{t("优惠金额", "Discount")}</span><span className="font-medium text-emerald-700">-{currency.format(discount)}</span></div>}<div className="mt-3 flex justify-between"><span className="text-sm text-gray-500">{t("模拟支付金额", "Demo payment")}</span><span className="text-xl font-bold text-gray-950">{currency.format(payableTotal)}</span></div></div>
      <div className="mt-7 flex flex-col gap-2">
        <button type="button" onClick={() => navigate(homeNavigation)} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-600 font-semibold text-white transition hover:bg-emerald-700">{t("返回商城", "Back to store")}</button>
        <button type="button" onClick={() => navigate({ action: "OPEN_PAGE", destination: "/orders", openIn: "SELF" })} className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-amber-300 bg-white font-semibold text-amber-700 transition hover:bg-amber-50">{t("订单申诉", "Order appeal")}</button>
      </div>
    </div></div></div>;
  }

  return <div className="container py-6 sm:py-10"><LanguageToggle language={language} setLanguage={setLanguage} /><div className="content mx-auto max-w-5xl">
    <button type="button" onClick={() => navigate(homeNavigation)} className="mb-5 flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-950"><ArrowLeft className="h-4 w-4" />{t("返回商品列表", "Back to products")}</button>
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-3xl font-bold tracking-tight text-gray-950">{language === "en" ? "Checkout" : heading}</h1><p className="mt-1 text-sm text-gray-500">{t("确认订单、优惠券并选择支付方式", "Review your order, coupon and payment method")}</p></div><div className="flex w-fit items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800"><ShieldCheck className="h-4 w-4" />{language === "en" ? "Demo checkout — no real charge" : demoNotice}</div></div>

    {status === "pending" && <div className="grid gap-6 lg:grid-cols-[1fr_360px]"><div className="h-80 animate-pulse rounded-3xl bg-gray-100" /><div className="h-80 animate-pulse rounded-3xl bg-gray-100" /></div>}
    {status === "error" && <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">{t("订单加载失败：", "Unable to load order: ")}{error?.message}</div>}
    {status === "success" && cartItems.length === 0 && <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center"><ShoppingBag className="mx-auto h-12 w-12 text-gray-300" /><h2 className="mt-4 text-xl font-semibold text-gray-900">{t("购物车还是空的", "Your cart is empty")}</h2><p className="mt-2 text-sm text-gray-500">{t("先挑选喜欢的商品，再来结算吧", "Choose some products before checking out")}</p><button type="button" onClick={() => navigate(homeNavigation)} className="mt-6 rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700">{t("去挑选商品", "Browse products")}</button></div>}

    {status === "success" && cartItems.length > 0 && <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
      <section className="order-2 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 lg:order-1">
        <div className="mb-5"><h2 className="text-lg font-semibold text-gray-950">{t("选择支付方式", "Payment method")}</h2><p className="mt-1 text-xs text-gray-500">{t("以下方式仅用于界面演示", "For interface demonstration only")}</p></div>
        <div className="space-y-3" role="radiogroup" aria-label={t("支付方式", "Payment method")}>{paymentMethods.map((method) => { const Icon = method.icon; const selected = selectedPayment === method.id; return <button type="button" role="radio" aria-checked={selected} key={method.id} onClick={() => setSelectedPayment(method.id)} className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${selected ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"}`}><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${method.color}`}><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-semibold text-gray-950">{method.name}</span><span className="mt-0.5 block text-xs text-gray-500">{method.description}</span></span><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selected ? "border-emerald-600 bg-emerald-600 text-white" : "border-gray-300 text-transparent"}`}><Check className="h-4 w-4" /></span></button>; })}</div>
        <div className="mt-6 rounded-2xl bg-gray-50 p-4"><div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" /><p className="text-xs leading-5 text-gray-500">{t("真实收款需要配置支付商户与服务器回调。当前按钮只模拟支付流程；成功后会向订单表写入折扣后的订单金额。", "Real payments require a merchant account and server callbacks. This demo writes discounted order amounts after the simulated payment.")}</p></div></div>
        {!isLoggedIn && <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100"><Smartphone className="h-6 w-6 text-emerald-600" /></div>
          <h3 className="mt-3 text-base font-semibold text-gray-950">{t("跳转至会员账户支付", "Pay via member account")}</h3>
          <p className="mt-1 text-xs text-gray-500">{t("请使用手机扫描二维码，在会员 App 中完成支付", "Scan the QR code with your phone to pay in the member app")}</p>
          <div className="mt-4 inline-flex rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><QRCodeSVG value={qrValue} size={200} level="M" /></div>
          {!memberPayUrl && <p className="mt-3 text-[11px] text-amber-600">{t("（支付链接尚未配置，暂指向本结算页）", "(Payment link not set yet - pointing to this checkout page)")}</p>}
          <div className="mt-4"><a href="/login" className="text-xs font-medium text-emerald-700 hover:underline">{t("已登录？点此登录后在本机支付", "Already signed in? Log in to pay on this device")}</a></div>
        </div>}
        {paymentStatus === "error" && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert"><p>{orderMessage || t("订单写入失败，请重试", "Order creation failed")}</p><button type="button" onClick={() => navigate({ action: "OPEN_PAGE", destination: "/orders", openIn: "SELF" })} className="mt-2 text-xs font-semibold text-red-800 underline">{t("去「我的订单」提交申诉", "Go to My Orders to file an appeal")}</button></div>}
        {isLoggedIn && <button type="button" onClick={handlePayment} disabled={paymentStatus === "processing"} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gray-950 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-wait disabled:opacity-70">{paymentStatus === "processing" ? <><Loader2 className="h-5 w-5 animate-spin" />{t("正在模拟支付...", "Processing demo payment...")}</> : <>{t("模拟支付", "Demo pay")} {currency.format(payableTotal)}</>}</button>}
      </section>

      <aside className="order-1 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 lg:order-2">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-gray-950">{t("订单明细", "Order summary")}</h2><span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">{totalQuantity} {t("件", "items")}</span></div>
        <div className="mt-4 max-h-80 space-y-4 overflow-y-auto pr-1">{cartItems.map((item) => { const quantity = cart[item.id] ?? 0; return <div key={item.id} className="flex items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-100 to-rose-100">{item.fields.image ? <img src={item.fields.image} alt={item.fields.name} className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-white" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-gray-900">{item.fields.name}</p><p className="mt-0.5 text-xs text-gray-500">{currency.format(item.fields.price ?? 0)} × {quantity}</p></div><span className="text-sm font-semibold text-gray-900">{currency.format((item.fields.price ?? 0) * quantity)}</span></div>; })}</div>
        <div className="mt-5 border-t border-gray-100 pt-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-900"><Ticket className="h-4 w-4 text-emerald-600" />{t("优惠券", "Coupon")}</label>
          {claimedCoupons.length === 0 ? <a href="/events" className="mt-3 block rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-800 hover:underline">{t("有活动优惠券可领取，先去活动页看看吧", "Coupons are available on the events page")}</a> : <>
            <select className="mt-3 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm" value={selectedCouponId} disabled={paymentStatus === "processing"} onChange={(e) => setSelectedCouponId(e.target.value)}><option value="">{t("选择优惠券", "Select a coupon")}</option>{claimedCoupons.map((coupon) => <option key={coupon.id} value={coupon.id}>{language === "en" ? coupon.titleEn : coupon.title}</option>)}</select>
            {selectedCoupon && <p className={`mt-2 text-xs leading-5 ${couponResult.eligible ? "text-emerald-700" : "text-amber-700"}`}>{couponResult.reason}</p>}
          </>}
        </div>
        <div className="mt-5 space-y-3 border-t border-gray-100 pt-4 text-sm"><div className="flex justify-between text-gray-500"><span>{t("商品合计", "Subtotal")}</span><span>{currency.format(totalPrice)}</span></div>{discount > 0 && <div className="flex justify-between text-emerald-700"><span>{t("优惠券折扣", "Coupon discount")}</span><span>-{currency.format(discount)}</span></div>}<div className="flex justify-between text-gray-500"><span>{t("配送费", "Delivery")}</span><span>¥0.00</span></div><div className="flex items-end justify-between border-t border-gray-100 pt-4"><span className="font-medium text-gray-900">{t("应付合计", "Total")}</span><span className="text-2xl font-bold text-gray-950">{currency.format(payableTotal)}</span></div></div>
      </aside>
    </div>}
  </div></div>;
}
