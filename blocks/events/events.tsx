import { useEffect, useState } from "react";
import { datasource, q, useRecords } from "@/lib/datasource";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Sparkles, Ticket } from "lucide-react";
import { toast } from "sonner";

const ds = datasource.define({ activities: "activities" });
const actSelect = q.select({ title: "l8iVv", type: "TLyTn", desc: "5YoTA", cover: "lDLM9", url: "ugaID", status: "47fzT", start: "uUSvj", end: "pav0R", tag: "StZ28" });
const COUPON_KEY = "genki-claimed-coupons-v1";
const LANG_KEY = "genki-language-v1";
type Language = "zh" | "en";
type Offer = { id: string; activityId: string; kind: "PERCENT" | "FREE_CATEGORY"; title: string; titleEn: string; description: string; descriptionEn: string; percent?: number; category?: string; minQuantity: number };

const ACTIVITY_EN: Record<string, { title: string; desc: string }> = {
  "6SoKB8FOKUckVg": { title: "Bubble Lab · Campus Pop-up", desc: "The CHI FOREST Bubble Lab is coming to campus with limited sparkling specials and a prize draw." },
  "BakdmXngUwsirC": { title: "New Ice Tea · Free Tasting", desc: "Try the new ice tea. Claim a tasting coupon for participating cabinets while daily supplies last." },
  "CCOirBrFitowNz": { title: "Campus Partner Recruitment", desc: "Join the campus team for community operations, event planning and hands-on brand experience." },
  "q7n38cJfNqQAJB": { title: "Member Points & Rewards", desc: "Earn points on purchases and redeem them for merchandise, coupons and limited flavors." },
  "ZkY19jJHFMq611": { title: "Double 11 Stock-up Event", desc: "Get 20% off when your order reaches a full case of 12 items." },
  "dhxE97Mckr4BMj": { title: "CHI FOREST × Campus Music Festival", desc: "A campus music festival with a brand booth, interactive games and refreshing drinks." },
};
const TYPE_EN: Record<string, string> = { "品牌活动": "Brand event", "新品上市": "New product", "合作招募": "Partnership", "会员福利": "Member benefit" };
const STATUS_EN: Record<string, string> = { "进行中": "Active", "即将开始": "Coming soon", "已结束": "Ended" };

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
  return <div className="fixed right-4 top-20 z-[60] flex rounded-full border border-[#CFE3D5] bg-white p-1 shadow-lg"><button className={`rounded-full px-3 py-1.5 text-xs font-bold ${language === "zh" ? "bg-[#1F6B3B] text-white" : "text-[#3C5748]"}`} onClick={() => setLanguage("zh")}>中文</button><button className={`rounded-full px-3 py-1.5 text-xs font-bold ${language === "en" ? "bg-[#1F6B3B] text-white" : "text-[#3C5748]"}`} onClick={() => setLanguage("en")}>EN</button></div>;
}
function readCoupons(): Offer[] {
  try { const value = JSON.parse(window.localStorage.getItem(COUPON_KEY) ?? "[]"); return Array.isArray(value) ? value : []; } catch { return []; }
}
function getOffer(activity: any): Offer | null {
  const desc = String(activity.fields.desc ?? "");
  if (desc.includes("8 折") || desc.includes("8折")) return { id: `${activity.id}-case-20-off`, activityId: activity.id, kind: "PERCENT", percent: 0.8, minQuantity: 12, title: "整箱 8 折券", titleEn: "Full-case 20% off coupon", description: "订单满 12 件即可使用，结算时自动享受 8 折。", descriptionEn: "Use with 12 or more items and receive 20% off at checkout." };
  if (desc.includes("试饮券")) return { id: `${activity.id}-tea-trial`, activityId: activity.id, kind: "FREE_CATEGORY", category: "茶饮", minQuantity: 1, title: "冰茶试饮券", titleEn: "Ice tea trial coupon", description: "购买茶饮时，可享其中 1 件免费；结算页选择本券即可。", descriptionEn: "Get one tea drink free by selecting this coupon at checkout." };
  return null;
}
function imageUrl(value: any) {
  const url = String(value ?? "");
  return /^https?:\/\/.*\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(url) ? url : "";
}

export default function Block() {
  const { language, setLanguage, t } = useLanguage();
  useNavigationLanguage(language);
  const { data, status, error } = useRecords({ from: ds.activities, select: actSelect, count: 50 });
  const [claimed, setClaimed] = useState<Offer[]>(readCoupons);
  const acts = data?.pages.flatMap((p) => p.items) ?? [];
  const selectedId = new URLSearchParams(window.location.search).get("id");
  const current = acts.find((a) => a.id === selectedId);

  function claim(offer: Offer) {
    const existing = readCoupons();
    if (existing.some((item) => item.id === offer.id)) { toast(t("已经领取过这张券了", "You already claimed this coupon")); return; }
    const next = [...existing, offer];
    window.localStorage.setItem(COUPON_KEY, JSON.stringify(next));
    setClaimed(next);
    window.dispatchEvent(new Event("genki-coupon-change"));
    toast.success(t("领取成功，结算时可选择使用", "Coupon claimed. Select it at checkout."));
  }

  const titleFor = (a: any) => language === "en" ? ACTIVITY_EN[a.id]?.title ?? a.fields.title : a.fields.title;
  const descFor = (a: any) => language === "en" ? ACTIVITY_EN[a.id]?.desc ?? a.fields.desc : a.fields.desc;
  const typeFor = (a: any) => language === "en" ? TYPE_EN[a.fields.type?.label] ?? a.fields.type?.label : a.fields.type?.label;
  const statusFor = (a: any) => language === "en" ? STATUS_EN[a.fields.status?.label] ?? a.fields.status?.label : a.fields.status?.label;

  if (selectedId) {
    if (status === "pending") return <div className="container py-16"><LanguageToggle language={language} setLanguage={setLanguage} /><div className="content text-sm text-[#5B6F62]">{t("正在加载活动详情…", "Loading event details…")}</div></div>;
    if (!current) return <div className="container py-16"><LanguageToggle language={language} setLanguage={setLanguage} /><div className="content mx-auto max-w-md rounded-2xl border bg-white p-8 text-center"><h1 className="text-xl font-bold">{t("没有找到这个活动", "Event not found")}</h1><a href="/events" className="mt-5 inline-block text-[#1F6B3B] underline">← {t("返回活动列表", "Back to events")}</a></div></div>;
    const offer = getOffer(current);
    const isClaimed = offer ? claimed.some((item) => item.id === offer.id) : false;
    const cover = imageUrl(current.fields.cover);
    return (
      <div className="container py-8 sm:py-10">
        <LanguageToggle language={language} setLanguage={setLanguage} />
        <div className="content mx-auto max-w-5xl">
          <a href="/events" className="inline-flex items-center gap-2 text-sm text-[#5B6F62] hover:text-[#14301F]"><ArrowLeft className="h-4 w-4" />{t("返回活动列表", "Back to events")}</a>
          <div className="mt-6 overflow-hidden rounded-[2rem] border border-[#D8E8DC] bg-white">
            <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#E6F773,#FFD8DF)] p-8">
              {cover ? <img src={cover} alt={titleFor(current)} className="absolute inset-0 h-full w-full object-cover" /> : <div className="text-center"><Ticket className="mx-auto h-14 w-14 text-[#1F6B3B]" /><p className="mt-4 text-sm font-black tracking-[.22em] text-[#1F6B3B]">CHI FOREST · WHAT'S ON</p></div>}
              <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-[#1F6B3B]">{typeFor(current)} · {statusFor(current)}</div>
            </div>
            <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.2fr_.8fr]">
              <div>
                <h1 className="text-4xl font-black tracking-[-.04em] text-[#14301F]">{titleFor(current)}</h1>
                <p className="mt-5 text-base leading-8 text-[#5B6F62]">{descFor(current)}</p>
                <div className="mt-6 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-[#F3F8F4] p-4"><span className="text-xs text-[#5B6F62]">{t("开始时间", "Starts")}</span><p className="mt-1 font-semibold">{current.fields.start || "—"}</p></div><div className="rounded-xl bg-[#F3F8F4] p-4"><span className="text-xs text-[#5B6F62]">{t("结束时间", "Ends")}</span><p className="mt-1 font-semibold">{current.fields.end || "—"}</p></div></div>
                {current.fields.url && <a href={String(current.fields.url)} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#1F6B3B] underline underline-offset-4">{t("查看官方活动信息", "Official event information")}<ArrowRight className="h-4 w-4" /></a>}
              </div>
              <aside className="rounded-3xl border border-[#D8E8DC] bg-[#F8FBF7] p-6">
                {offer ? <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E6F773] text-[#1F6B3B]"><Ticket className="h-6 w-6" /></div>
                  <p className="mt-5 text-xs font-black tracking-[.18em] text-[#1F6B3B]">{t("可直接领取", "DIRECT CLAIM")}</p>
                  <h2 className="mt-2 text-2xl font-black text-[#14301F]">{language === "en" ? offer.titleEn : offer.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-[#5B6F62]">{language === "en" ? offer.descriptionEn : offer.description}</p>
                  <div className="mt-4 rounded-xl bg-white p-3 text-xs leading-5 text-[#3C5748]">{offer.kind === "PERCENT" ? t("使用条件：订单商品总数满 12 件", "Condition: 12 or more items in the order") : t("使用条件：订单中包含茶饮商品", "Condition: the order contains a tea drink")}</div>
                  <Button className="mt-5 h-11 w-full rounded-full bg-[#1F6B3B] text-white" disabled={isClaimed || current.fields.status?.label === "已结束"} onClick={() => claim(offer)}>{isClaimed ? <><Check className="mr-2 h-4 w-4" />{t("已领取", "Claimed")}</> : current.fields.status?.label === "已结束" ? t("活动已结束", "Event ended") : t("立即领取", "Claim now")}</Button>
                  {isClaimed && <a href="/" className="mt-3 flex items-center justify-center gap-1 text-sm font-semibold text-[#1F6B3B]">{t("去选购并使用", "Shop and use coupon")}<ArrowRight className="h-4 w-4" /></a>}
                </> : <>
                  <Sparkles className="h-8 w-8 text-[#1F6B3B]" /><h2 className="mt-4 text-xl font-bold text-[#14301F]">{t("活动详情", "Event details")}</h2><p className="mt-2 text-sm leading-6 text-[#5B6F62]">{t("此活动无需领取优惠券，按照活动说明参与即可。", "No coupon is required. Follow the event instructions to participate.")}</p><a href="/" className="mt-5 flex h-11 items-center justify-center rounded-full bg-[#1F6B3B] text-sm font-semibold text-white">{t("去逛逛商品", "Browse products")}</a>
                </>}
              </aside>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <LanguageToggle language={language} setLanguage={setLanguage} />
      <div className="content">
        <p className="text-xs font-black tracking-[.22em] text-[#1F6B3B]">WHAT'S ON</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-.04em] text-[#14301F]">{t("活动专区", "Events & Offers")}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5B6F62]">{t("品牌活动、新品试饮、会员福利与校园合作。点击广告卡片进入详情，可领取的优惠券会直接显示。", "Brand events, new tastings, member benefits and campus partnerships. Open any card for details and available coupons.")}</p>
        {status === "pending" && <p className="mt-8 text-sm text-[#5B6F62]">{t("加载中…", "Loading…")}</p>}
        {status === "error" && <p className="mt-8 text-sm text-red-700">{error?.message}</p>}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {acts.map((a) => {
            const offer = getOffer(a);
            const cover = imageUrl(a.fields.cover);
            return <article key={a.id} className="flex flex-col overflow-hidden rounded-3xl border border-[#D8E8DC] bg-white transition hover:-translate-y-1 hover:shadow-lg">
              <a href={`/events?id=${a.id}`} className="block">
                {cover ? <img src={cover} alt={titleFor(a)} className="h-48 w-full object-cover" /> : <div className="flex h-48 items-center justify-center bg-[linear-gradient(135deg,#EAF6D9,#FAD9E3)] px-6 text-center text-lg font-black text-[#1F6B3B]">{typeFor(a) ?? "CHI FOREST"}</div>}
              </a>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-2"><span className="rounded-full bg-[#EEF6EF] px-2 py-0.5 text-[11px] text-[#1F6B3B]">{typeFor(a)}</span><span className="text-[11px] text-[#5B6F62]">{statusFor(a)}</span>{offer && <span className="ml-auto rounded-full bg-[#FFF1C7] px-2 py-0.5 text-[11px] font-bold text-[#8A5A00]">{t("可领券", "Coupon")}</span>}</div>
                <h3 className="mt-3 text-xl font-bold text-[#14301F]">{titleFor(a)}</h3>
                <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-[#5B6F62]">{descFor(a)}</p>
                <a href={`/events?id=${a.id}`} className="mt-5 flex h-10 items-center justify-center gap-2 rounded-full bg-[#1F6B3B] text-sm font-semibold text-white">{t("查看详情", "View details")}<ArrowRight className="h-4 w-4" /></a>
              </div>
            </article>;
          })}
        </div>
        {status === "success" && acts.length === 0 && <p className="mt-8 text-sm text-[#5B6F62]">{t("暂无活动。", "No events yet.")}</p>}
      </div>
    </div>
  );
}
