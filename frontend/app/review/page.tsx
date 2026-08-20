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
    <div className="space-y-8 py-4">
      <section className="border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Review</p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-slate-900 sm:text-4xl">
              Human validation queue
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button className="border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
              Save draft
            </button>
            <button className="border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
              Approve selected
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border border-slate-200 bg-slate-50 text-slate-700">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Supplier invoice</h2>
                <p className="text-sm text-slate-500">Q2 supplier batch</p>
              </div>
            </div>
            <span className="border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
              Needs check
            </span>
          </div>

          <div className="mt-6 border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Invoice</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">Northwind Studio</p>
              </div>
              <div className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified
              </div>
            </div>

            <div className="mt-5 space-y-4 text-sm text-slate-700">
              <div className="flex items-center justify-between border border-slate-200 bg-white p-3">
                <span className="text-slate-500">Reference</span>
                <span className="font-medium text-slate-900">INV-204 / Q2</span>
              </div>
              <div className="flex items-center justify-between border border-slate-200 bg-white p-3">
                <span className="text-slate-500">Issue date</span>
                <span className="font-medium text-slate-900">12 May</span>
              </div>
              <div className="flex items-center justify-between border border-slate-200 bg-white p-3">
                <span className="text-slate-500">Due date</span>
                <span className="font-medium text-slate-900">27 May</span>
              </div>
              <div className="flex items-center justify-between border border-slate-200 bg-white p-3">
                <span className="text-slate-500">Amount</span>
                <span className="font-medium text-slate-900">€4,280.00</span>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border border-slate-200 bg-slate-50 text-slate-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Extraction support</p>
                <p className="text-xl font-semibold text-slate-900">Suggested values</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {reviewFields.map((field) => (
                <div key={field.label} className="border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-600">{field.label}</p>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{field.status}</span>
                  </div>
                  <p className="mt-2 text-base font-semibold text-slate-900">{field.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Queue</h3>
              <span className="border border-cyan-200 bg-cyan-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-700">
                3 items
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {queue.map((item) => (
                <div key={item.name} className="flex items-center justify-between border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.owner}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                      item.status === "Ready"
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : item.status === "Review"
                          ? "border border-amber-200 bg-amber-50 text-amber-700"
                          : "border border-slate-200 bg-slate-100 text-slate-700"
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

      <section className="border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center border border-amber-200 bg-amber-50 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Validation notes</h3>
            <p className="text-sm text-slate-500">Keep the review process transparent and accountable.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            "Check exact issue date against the original PDF.",
            "Confirm VAT treatment before final approval.",
            "Save review comments for the audit trail.",
          ].map((note) => (
            <div key={note} className="border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              {note}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
