import {
  ArrowUpRight,
  Check,
  FileText,
  Filter,
  Search,
  TrendingUp,
  Wallet,
} from "lucide-react";

const stats = [
  { label: "Processing queue", value: "Current", delta: "Live" },
  { label: "Review cycle", value: "Daily", delta: "On track" },
  { label: "Approval status", value: "Ready", delta: "Stable" },
];

const invoices = [
  { id: "Supplier invoice", vendor: "Northwind Studio", date: "Current cycle", amount: "€ —", status: "Approved" },
  { id: "Vendor statement", vendor: "Aster Labs", date: "Review queue", amount: "€ —", status: "Review" },
  { id: "Purchase record", vendor: "BluePeak CG", date: "Awaiting validation", amount: "€ —", status: "Approved" },
  { id: "Expense file", vendor: "Northwind Studio", date: "Pending review", amount: "€ —", status: "Pending" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8 py-6">
      <section className="rounded-[28px] border border-white/10 bg-[#111827] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.45)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-300">Dashboard</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Finance operations overview
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10">
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <button className="inline-flex items-center gap-2 rounded-full bg-teal-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-teal-900/30 hover:bg-teal-300">
              <ArrowUpRight className="h-4 w-4" />
              New invoice
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[24px] border border-white/10 bg-[#111827] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.25)]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">{stat.label}</span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                {stat.delta}
              </span>
            </div>
            <div className="mt-5 text-3xl font-black tracking-tight text-white">{stat.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-[28px] border border-white/10 bg-[#111827] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.4)]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Invoices</h2>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-300">
              <Search className="h-4 w-4" />
              Search
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-slate-900 text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">Document</th>
                  <th className="px-4 py-3 font-medium">Vendor</th>
                  <th className="px-4 py-3 font-medium">Cycle</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-[#111827] text-slate-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-900/80">
                    <td className="px-4 py-3 font-semibold text-white">{invoice.id}</td>
                    <td className="px-4 py-3 text-slate-300">{invoice.vendor}</td>
                    <td className="px-4 py-3 text-slate-300">{invoice.date}</td>
                    <td className="px-4 py-3 font-medium text-white">{invoice.amount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                          invoice.status === "Approved"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : invoice.status === "Review"
                              ? "bg-amber-500/15 text-amber-300"
                              : "bg-slate-700 text-slate-200"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-[#111827] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.35)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Current spend</p>
                <p className="text-2xl font-black text-white">In review</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950 p-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.35)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5">
                <TrendingUp className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-sm text-slate-300">Efficiency trend</p>
                <p className="text-2xl font-black">Stable</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#111827] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Review queue</h3>
              <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                In focus
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {[
                "Low-confidence tax field",
                "Supplier mismatch",
                "Duplicate invoice detected",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-slate-900 p-3 ring-1 ring-white/10">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-slate-200">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[#111827] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.35)]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Recent audit entries</h2>
            <p className="text-sm text-slate-400">Every document action is captured and traceable.</p>
          </div>
        </div>
      </section>
    </div>
  );
}