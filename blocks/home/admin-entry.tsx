import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/user";
import { useNavigation } from "@/lib/editable-settings";
import { Boxes, Settings, ShoppingBag } from "lucide-react";

const ADMIN_EMAIL = "2051182778@qq.com";
const LANG_KEY = "genki-language-v1";

function readLang() {
  return window.localStorage.getItem(LANG_KEY) === "zh" ? "zh" : "en";
}

export default function Block() {
  const user = useCurrentUser();
  const navigate = useNavigation();
  const [lang, setLang] = useState(readLang);
  useEffect(() => {
    const handler = () => setLang(readLang());
    window.addEventListener("genki-language-change", handler);
    return () => window.removeEventListener("genki-language-change", handler);
  }, []);
  const email = (user?.email ?? "").toLowerCase();
  if (email !== ADMIN_EMAIL) return null;

  const t = (zh: string, en: string) => (lang === "en" ? en : zh);
  const links = [
    { path: "/products", label: t("商品", "Products"), icon: ShoppingBag },
    { path: "/cabinets", label: t("附近柜机", "Cabinets"), icon: Boxes },
    { path: "/admin", label: t("管理后台", "Admin Console"), icon: Settings },
  ];

  return (
    <div className="container py-3">
      <div className="content mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <span className="mr-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">{t("管理入口", "Admin")}</span>
          {links.map(({ path, label, icon: Icon }) => (
            <button key={path} type="button" onClick={() => navigate({ action: "OPEN_PAGE", destination: path, openIn: "SELF" })} className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-emerald-800 shadow-sm ring-1 ring-emerald-200 transition hover:bg-emerald-100">
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
