import { AlertTriangle, FileText, ShieldCheck, Sparkles } from "lucide-react";

const reviewFields = [
  { label: "Vendor", value: "Northwind Studio", status: "Matches record" },
  { label: "Invoice reference", value: "INV-204 / Q2", status: "Confirmed" },
  { label: "Issue date", value: "12 May", status: "Needs check" },
  { label: "Total amount", value: "€4,280.00", status: "Verified" },
  { label: "VAT", value: "20%", status: "Confirmed" },
];

const queue = [
  { name: "Supplier invoice", owner: "Finance team", status: "Ready" },
  { name: "Vendor statement", owner: "Operations", status: "Review" },
  { name: "Purchase record", owner: "Accounting", status: "Pending" },
];

export default function ReviewPage() {
  return (
    <div className="space-y-8 py-6">
      <section className="rounded-[28px] border border-white/10 bg-[#111827] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.45)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-300">Review</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Human validation queue
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10">
              Save draft
            </button>
            <button className="rounded-full bg-teal-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-teal-900/30 hover:bg-teal-300">
              Approve selected
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[28px] border border-white/10 bg-[#111827] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.4)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Supplier invoice</h2>
                <p className="text-sm text-slate-400">Q2 supplier batch</p>
              </div>
            </div>
            <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-300">
              Needs check
            </span>
          </div>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-slate-950 p-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Invoice</p>
                <p className="mt-2 text-lg font-bold text-white">Northwind Studio</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified
              </div>
            </div>

            <div className="mt-5 space-y-4 text-sm text-slate-300">
              <div className="flex items-center justify-between rounded-2xl bg-slate-900 p-3">
                <span className="text-slate-400">Reference</span>
                <span className="font-medium text-slate-100">INV-204 / Q2</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-900 p-3">
                <span className="text-slate-400">Issue date</span>
                <span className="font-medium text-slate-100">12 May</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-900 p-3">
                <span className="text-slate-400">Due date</span>
                <span className="font-medium text-slate-100">27 May</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-900 p-3">
                <span className="text-slate-400">Amount</span>
                <span className="font-medium text-slate-100">€4,280.00</span>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-[#111827] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.35)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-400/10 text-teal-300">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Extraction support</p>
                <p className="text-xl font-bold text-white">Suggested values</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {reviewFields.map((field) => (
                <div key={field.label} className="rounded-2xl border border-white/10 bg-slate-900 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-300">{field.label}</p>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400">{field.status}</span>
                  </div>
                  <p className="mt-2 text-base font-semibold text-white">{field.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#111827] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Queue</h3>
              <span className="rounded-full bg-cyan-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-300">
                3 items
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {queue.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-2xl bg-slate-900 p-3 ring-1 ring-white/10">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.owner}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                      item.status === "Ready"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : item.status === "Review"
                          ? "bg-amber-500/15 text-amber-300"
                          : "bg-slate-700 text-slate-200"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <section className="rounded-[28px] border border-white/10 bg-[#111827] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.35)]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Validation notes</h3>
            <p className="text-sm text-slate-400">Keep the review process transparent and accountable.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            "Check exact issue date against the original PDF.",
            "Confirm VAT treatment before final approval.",
            "Save review comments for the audit trail.",
          ].map((note) => (
            <div key={note} className="rounded-2xl border border-white/10 bg-slate-900 p-4 text-sm text-slate-200">
              {note}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
