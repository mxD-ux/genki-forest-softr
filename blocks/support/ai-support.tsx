import { useMemo, useState } from "react";
import { q, useRecords } from "@/lib/datasource";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const faqSelect = q.select({ question: "YsXFX", keywords: "QO9OH", answer: "4DTcb", category: "ULtWK" });

const SUGGESTIONS = ["怎么买", "怎么取货", "哪台柜机有货", "能退款吗", "最近活动", "人工客服"];

export default function Block() {
  const { data, status } = useRecords({ select: faqSelect, count: 100 });
  const [input, setInput] = useState("");
  const [asked, setAsked] = useState<string | null>(null);

  const faqs = data?.pages.flatMap((p) => p.items) ?? [];

  const matches = useMemo(() => {
    const kw = (input || "").trim().toLowerCase();
    if (!kw) return [];
    return faqs.filter((f) => {
      const hay = `${f.fields.question ?? ""} ${f.fields.keywords ?? ""} ${f.fields.answer ?? ""}`.toLowerCase();
      return hay.includes(kw);
    });
  }, [faqs, input]);

  const ask = (text: string) => {
    setInput(text);
    setAsked(text);
  };

  return (
    <div className="container py-10">
      <div className="content mx-auto max-w-3xl">
        <div className="rounded-3xl border border-[#D8E8DC] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1F6B3B] text-lg font-bold text-white">AI</span>
            <div>
              <h1 className="text-2xl font-bold text-[#14301F]">元气客服</h1>
              <p className="text-sm text-[#5B6F62]">输入关键词，立刻找到答案 · 7×24 小时</p>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") setAsked(input); }}
              placeholder="例如：怎么取货 / 哪台柜机有白桃 / 能退款吗"
              className="h-12 rounded-full border-[#D8E8DC] px-5"
            />
            <Button className="h-12 rounded-full bg-[#1F6B3B] px-6 hover:bg-[#17542E]" onClick={() => setAsked(input)}>
              发送
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                className="rounded-full border border-[#D8E8DC] bg-[#F7FBF8] px-3 py-1.5 text-xs text-[#3C5748] hover:bg-[#EEF5F0]"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-8 space-y-3">
            {status === "pending" && <p className="text-sm text-[#5B6F62]">知识库加载中…</p>}

            {asked && input.trim() && matches.length === 0 && status === "success" && (
              <div className="rounded-2xl bg-[#FFF7E6] p-4 text-sm text-[#8A5A00]">
                暂时没有匹配到答案。可以换个说法，或点击下方「人工客服」留言，我们会在 24 小时内回复。
              </div>
            )}

            {matches.map((f) => (
              <div key={f.id} className="rounded-2xl border border-[#E3EFE7] bg-[#F7FBF8] p-4">
                <p className="text-sm font-semibold text-[#14301F]">{f.fields.question}</p>
                <p className="mt-2 text-sm leading-6 text-[#3C5748]">{f.fields.answer}</p>
                {f.fields.category?.label && (
                  <span className="mt-3 inline-block rounded-full bg-white px-2 py-0.5 text-[11px] text-[#5B6F62]">
                    {f.fields.category.label}
                  </span>
                )}
              </div>
            ))}

            {!asked && (
              <div className="rounded-2xl bg-[#F7FBF8] p-5 text-sm text-[#5B6F62]">
                试试问：「怎么取货」「哪台柜机有白桃」「能退款吗」「最近有什么活动」。
              </div>
            )}
          </div>

          <p className="mt-8 text-xs text-[#8A9A8F]">
            当前为关键词匹配版客服（知识库 16 条）。预留 API 接口：接入学校提供的模型额度后，可切换为语义理解。
          </p>
        </div>
      </div>
    </div>
  );
}
