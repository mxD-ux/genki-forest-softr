import { useEffect, useMemo, useState } from "react";
import { datasource, q, useRecords } from "@/lib/datasource";
import { Input } from "@/components/ui/input";
import { Package, Search } from "lucide-react";

const ds = datasource.define({ stock: "stock", products: "products", machines: "machines" });
const KEY = "genki-language-v1";

const NAMES: Record<string, string> = {
  "白桃味气泡水": "Peach Sparkling Water",
  "荔枝味气泡水": "Lychee Sparkling Water",
  "燃茶 乌龙茶": "Ran Tea Oolong",
  "燃茶 桃香乌龙": "Ran Tea Peach Oolong",
  "乳茶 原味": "Milk Tea Original",
  "乳茶 咖啡拿铁": "Milk Tea Latte",
  "乳茶 黑糖烤奶": "Milk Tea Brown Sugar",
  "满分 西柚汁": "Grapefruit Juice",
  "外星人电解质水 青柠": "Alien Electrolyte Lime",
  "外星人 西柚": "Alien Grapefruit",
  "图书馆一层大厅": "Library 1F Hall",
  "教学楼 A 座二层": "Teaching Building A 2F",
  "宿舍区 3 号楼": "Dormitory 3",
  "宿舍区 7 号楼": "Dormitory 7",
  "一食堂西门": "Canteen West Gate",
  "体育馆北门": "Gym North Gate",
  "创新工场一层": "Innovation Hub 1F",
  "图书馆四层自习区": "Library 4F Study Area",
};

const stockSelect = q.select({ product: "wbwWG", machine: "eayDq", qty: "ZNcRL", slot: "677yX" });
const productSelect = q.select({ name: "RJ4aJ", price: "huZy5" });
const machineSelect = q.select({ name: "ML6Le", code: "KBIQH", dist: "pSwfu" });

export default function Block() {
  const [lang, setLang] = useState<"zh" | "en">(() => (localStorage.getItem(KEY) === "zh" ? "zh" : "en"));
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("全部");

  useEffect(() => {
    const sync = () => setLang(localStorage.getItem(KEY) === "zh" ? "zh" : "en");
    window.addEventListener("storage", sync);
    window.addEventListener("genki-language-change", sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("genki-language-change", sync); };
  }, []);

  const t = (zh: string, en: string) => (lang === "en" ? en : zh);
  const name = (cn?: string | null) => (lang === "en" ? NAMES[cn ?? ""] ?? cn : cn);

  const { data: stockData, status } = useRecords({ from: ds.stock, select: stockSelect, count: 500 });
  const { data: productData } = useRecords({ from: ds.products, select: productSelect, count: 100 });
  const { data: machineData } = useRecords({ from: ds.machines, select: machineSelect, count: 100 });

  const stock = stockData?.pages.flatMap((p) => p.items) ?? [];
  const products = productData?.pages.flatMap((p) => p.items) ?? [];
  const machines = machineData?.pages.flatMap((p) => p.items) ?? [];

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const machineById = useMemo(() => new Map(machines.map((m) => [m.id, m])), [machines]);

  const rows = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const seen = new Set<string>();
    return stock
      .filter((s) => {
        const key = `${s.fields.machine?.id ?? ""}-${s.fields.product?.id ?? ""}-${s.fields.slot ?? ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((s) => ({ s, p: productById.get(s.fields.product?.id ?? ""), m: machineById.get(s.fields.machine?.id ?? "") }))
      .filter((row) => row.p && row.m)
      .filter((row) => (category === "全部" ? true : (row.p?.fields.name ?? "").includes(category)))
      .filter((row) => {
        if (!kw) return true;
        return `${row.p?.fields.name ?? ""} ${name(row.p?.fields.name)} ${row.m?.fields.name ?? ""} ${name(row.m?.fields.name)} ${row.m?.fields.code ?? ""}`.toLowerCase().includes(kw);
      })
      .sort((a, b) => (a.m?.fields.dist ?? 9999) - (b.m?.fields.dist ?? 9999));
  }, [stock, productById, machineById, keyword, category, lang]);

  const categories = ["全部", "白桃", "荔枝", "燃茶", "乳茶", "外星人", "西柚"];

  return (
    <div className="container py-8">
      <div className="content">
        <p className="text-xs font-black tracking-[.22em] text-[#1F6B3B]">FIND YOUR DRINK</p>
        <h1 className="mt-2 text-2xl font-bold text-[#14301F] sm:text-3xl">{t("库存搜索", "Stock Search")}</h1>
        <p className="mt-1 text-sm text-[#5B6F62]">{t("输入商品名或柜机编号，看看哪台柜子还有货、离你多远。", "Search by product or machine ID to see what is in stock and how far it is.")}</p>

        <div className="relative mt-5 max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={t("搜商品：白桃 / 乳茶 / 外星人；也可搜 GF-01", "Search: peach / milk tea / Alien; or GF-01")} className="h-11 rounded-full pl-9" />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button key={c} type="button" onClick={() => setCategory(c)} className={`rounded-full px-3 py-1.5 text-xs font-medium ${category === c ? "bg-[#1F6B3B] text-white" : "bg-[#EEF6EF] text-[#3C5748]"}`}>
              {c === "全部" ? t("全部", "All") : name(c) ?? c}
            </button>
          ))}
        </div>

        <p className="mt-4 text-xs text-[#5B6F62]">{t(`共 ${rows.length} 条有货记录，按距离从近到远`, `${rows.length} in-stock records, nearest first`)}</p>

        {status === "pending" && <p className="mt-6 text-sm text-[#5B6F62]">{t("正在加载…", "Loading…")}</p>}

        <div className="mt-3 overflow-hidden rounded-2xl border border-[#D8E8DC] bg-white">
          {rows.length === 0 && status === "success" && (
            <div className="p-8 text-center text-sm text-[#5B6F62]">{t("没有匹配的库存，换个关键词试试（比如「白桃」「乳茶」）。", "No matching stock. Try another keyword such as peach or milk tea.")}</div>
          )}
          {rows.map(({ s, p, m }) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 border-b border-[#EEF5F0] px-4 py-3 last:border-b-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3F8F4] text-[#1F6B3B]">
                <Package className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#14301F]">{name(p?.fields.name)}</p>
                <p className="truncate text-xs text-[#5B6F62]">{m?.fields.code} · {name(m?.fields.name)} · {t("货道", "Slot")} {s.fields.slot}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${Number(s.fields.qty) > 0 ? "text-[#1F6B3B]" : "text-[#B42318]"}`}>{t("剩", "Left")} {s.fields.qty ?? 0} {t("件", "")}</p>
                <p className="text-xs text-[#5B6F62]">{m?.fields.dist ?? "-"} m</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
