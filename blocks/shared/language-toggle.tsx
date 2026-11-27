import { useEffect, useState } from "react";

const KEY = "genki-language-v1";
const D: Array<[string, string]> = [
  ["白桃味气泡水", "White Peach Sparkling Water"], ["荔枝味气泡水", "Lychee Sparkling Water"],
  ["燃茶 乌龙茶", "Ran Tea · Oolong"], ["燃茶 桃香乌龙", "Ran Tea · Peach Oolong"],
  ["乳茶 原味", "Milk Tea · Original"], ["乳茶 咖啡拿铁", "Milk Tea · Coffee Latte"],
  ["乳茶 黑糖烤奶", "Milk Tea · Brown Sugar"], ["满分 西柚汁", "Manfen · Grapefruit Juice"],
  ["外星人电解质水 青柠", "Alienergy · Lime Electrolyte Water"], ["外星人 青柠", "Alienergy · Lime"],
  ["白桃", "White Peach"], ["荔枝", "Lychee"], ["燃茶", "Ran Tea"], ["乳茶", "Milk Tea"], ["外星人", "Alienergy"], ["西柚", "Grapefruit"],
  ["图书馆一层大厅", "Library 1F Hall"], ["教学楼 A 座二层", "Teaching Building A 2F"],
  ["宿舍区 3 号楼", "Dormitory 3"], ["宿舍区 7 号楼", "Dormitory 7"],
  ["一食堂西门", "Canteen West Gate"], ["体育馆北门", "Gym North Gate"],
  ["创新工场一层", "Innovation Hub 1F"], ["图书馆四层自习区", "Library 4F Study"],
  ["首页", "Home"], ["商品", "Products"], ["附近柜机", "Cabinets"], ["库存搜索", "Stock Search"],
  ["活动专区", "Events"], ["活动", "Events"], ["我的订单", "My Orders"], ["管理后台", "Admin"],
  ["仅显示当前账号的订单，最新订单排在最前面", "Only your orders are shown, newest first"], ["刷新订单", "Refresh orders"],
  ["时间未知", "Unknown time"], ["请先登录", "Please sign in"], ["登录后即可查看自己的订单记录", "Sign in to view your orders"],
  ["订单加载失败", "Failed to load orders"], ["请稍后重试", "Please try again later"], ["还没有订单", "No orders yet"],
  ["完成一次结算后，真实订单会出现在这里", "Complete checkout to see your orders here"], ["订单记录", "Order records"],
  ["累计金额", "Total amount"], ["未知状态", "Unknown status"], ["商品信息不可用", "Product unavailable"], ["数量：", "Qty: "],
  ["搜索", "Search"], ["全部", "All"], ["价格", "Price"], ["库存", "Stock"], ["数量", "Qty"],
  ["状态", "Status"], ["加入购物车", "Add to cart"], ["购买", "Buy"], ["登录", "Log in"],
  ["退出", "Log out"], ["加载中", "Loading"], ["暂无", "None"], ["详情", "Details"],
  ["距离", "Distance"], ["货道", "Slot"], ["剩余", "Left"], ["图书馆", "Library"],
  ["教学楼", "Teaching"], ["宿舍区", "Dormitory"], ["食堂", "Canteen"], ["体育馆", "Gym"],
  ["正常", "Normal"], ["维护中", "Maintenance"], ["待取货", "Pending"], ["已完成", "Completed"],
  ["已取消", "Cancelled"], ["在售", "On sale"], ["下架", "Off"],
  ["图书馆 1F 借阅区旁", "Next to the 1F reading area"], ["A 座 2F 连廊", "Block A 2F corridor"],
  ["3 号楼门厅", "Building 3 lobby"], ["7 号楼门厅", "Building 7 lobby"],
  ["一食堂西门入口", "Canteen west entrance"], ["体育馆北门入口", "Gym north entrance"],
  ["创新工场 1F 中庭", "Innovation Hub 1F atrium"], ["图书馆 4F 自习区", "Library 4F study area"],
  ["气泡实验室 · 校园快闪", "Sparkling Lab Campus Pop-up"], ["冰茶新品 · 免费试饮", "Iced Tea Launch Free Tasting"],
  ["校园合伙人招募", "Campus Partner Recruitment"], ["会员积分兑好礼", "Membership Points Rewards"],
  ["双十一囤货节", "Double 11 Stock-up Festival"], ["元气森林 × 校园音乐节", "Genki Forest x Campus Music Festival"],
  ["已取出", "Picked up"], ["取货码", "Pickup code"], ["订单号", "Order No."], ["下单时间", "Ordered at"],
];

const tr = (value: string) => {
  let out = value;
  for (const [zh, en] of D) if (out.includes(zh)) out = out.split(zh).join(en);
  return out;
};

function getOpenRoots() {
  const roots: Array<Document | ShadowRoot> = [document.body];
  const visit = (root: Document | ShadowRoot) => {
    root.querySelectorAll("*").forEach((element) => {
      if (element.shadowRoot) {
        roots.push(element.shadowRoot);
        visit(element.shadowRoot);
      }
    });
  };
  visit(document.body);
  return roots;
}

function translateRoot(root: Document | ShadowRoot) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (!(node.parentElement?.closest("script,style"))) {
      const text = node.nodeValue ?? "";
      const nextText = tr(text);
      if (nextText !== text) node.nodeValue = nextText;
    }
    node = walker.nextNode();
  }
  root.querySelectorAll("input[placeholder], textarea[placeholder]").forEach((input) => {
    const ph = input.getAttribute("placeholder") ?? "";
    const nextPh = tr(ph);
    if (nextPh !== ph) input.setAttribute("placeholder", nextPh);
  });
}

function translateDocument() {
  getOpenRoots().forEach(translateRoot);
}

export default function Block() {
  const [lang, setLang] = useState<"zh" | "en">(() => localStorage.getItem(KEY) === "zh" ? "zh" : "en");

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    if (lang !== "en") return;
    let timer = 0;
    const observedRoots = new Set<Document | ShadowRoot>();
    const attachObservers = () => {
      getOpenRoots().forEach((root) => {
        if (!observedRoots.has(root)) {
          observedRoots.add(root);
          observer.observe(root, { subtree: true, childList: true, characterData: true });
        }
      });
    };
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        translateDocument();
        attachObservers();
      }, 40);
    };
    const observer = new MutationObserver(schedule);
    translateDocument();
    attachObservers();
    return () => { observer.disconnect(); window.clearTimeout(timer); }
  }, [lang]);

  const choose = (next: "zh" | "en") => {
    localStorage.setItem(KEY, next);
    window.dispatchEvent(new Event("genki-language-change"));
    if (next === "zh") {
      window.location.reload();
      return;
    }
    setLang("en");
  };

  return (
    <div style={{ position: "fixed", right: 16, top: 76, zIndex: 60, display: "flex", gap: 4, background: "#fff", border: "1px solid #D8E8DC", borderRadius: 999, padding: 4, boxShadow: "0 6px 18px rgba(20,48,31,.12)" }}>
      <button type="button" onClick={() => choose("zh")} style={{ border: 0, borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", background: lang === "zh" ? "#1F6B3B" : "transparent", color: lang === "zh" ? "#fff" : "#5B6F62" }}>中文</button>
      <button type="button" onClick={() => choose("en")} style={{ border: 0, borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", background: lang === "en" ? "#1F6B3B" : "transparent", color: lang === "en" ? "#fff" : "#5B6F62" }}>EN</button>
    </div>
  );
}
