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
    <div className="space-y-8 py-4">
      <section className="border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Dashboard</p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-slate-900 sm:text-4xl">
              Finance operations overview
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button className="inline-flex items-center gap-2 border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <button className="inline-flex items-center gap-2 border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
              <ArrowUpRight className="h-4 w-4" />
              New invoice
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">{stat.label}</span>
              <span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                {stat.delta}
              </span>
            </div>
            <div className="mt-5 text-3xl font-bold tracking-[-0.05em] text-slate-900">{stat.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Invoices</h2>
            <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <Search className="h-4 w-4" />
              Search
            </div>
          </div>

          <div className="mt-6 overflow-hidden border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Document</th>
                  <th className="px-4 py-3 font-medium">Vendor</th>
                  <th className="px-4 py-3 font-medium">Cycle</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{invoice.id}</td>
                    <td className="px-4 py-3 text-slate-600">{invoice.vendor}</td>
                    <td className="px-4 py-3 text-slate-600">{invoice.date}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{invoice.amount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                          invoice.status === "Approved"
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                            : invoice.status === "Review"
                              ? "border border-amber-200 bg-amber-50 text-amber-700"
                              : "border border-slate-200 bg-slate-100 text-slate-700"
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
          <div className="border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border border-slate-200 bg-slate-50 text-slate-700">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Current spend</p>
                <p className="text-2xl font-bold text-slate-900">In review</p>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 bg-slate-900 p-5 text-white sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border border-slate-700 bg-slate-800">
                <TrendingUp className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-sm text-slate-300">Efficiency trend</p>
                <p className="text-2xl font-bold">Stable</p>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Review queue</h3>
              <span className="border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                In focus
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {[
                "Low-confidence tax field",
                "Supplier mismatch",
                "Duplicate invoice detected",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 border border-slate-200 bg-slate-50 p-3">
                  <div className="flex h-7 w-7 items-center justify-center bg-amber-100 text-amber-700">
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center border border-slate-200 bg-slate-50 text-slate-700">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Recent audit entries</h2>
            <p className="text-sm text-slate-500">Every document action is captured and traceable.</p>
          </div>
        </div>
      </section>
    </div>
  );
}