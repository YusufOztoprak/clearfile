import { Archive, Clock3, Search, ShieldCheck } from "lucide-react";

const archivedDocs = [
  { name: "Supplier invoice", owner: "Finance", status: "Approved", date: "14 May" },
  { name: "Vendor statement", owner: "Operations", status: "Reviewed", date: "11 May" },
  { name: "Corporate expense", owner: "Accounting", status: "Archived", date: "7 May" },
  { name: "Purchase order", owner: "Procurement", status: "Pending review", date: "3 May" },
];

const activity = [
  "Invoice approved and attached to the archive.",
  "Review note added by finance manager.",
  "Payment file exported to internal storage.",
];

export default function ArchivePage() {
  return (
    <div className="space-y-8 py-4">
      <section className="border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Archive</p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-slate-900 sm:text-4xl">
              Document history and approvals
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button className="inline-flex items-center gap-2 border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
              <Search className="h-4 w-4" />
              Search archive
            </button>
            <button className="inline-flex items-center gap-2 border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
              <Archive className="h-4 w-4" />
              Export report
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Recent documents</h2>
            <span className="border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Current
            </span>
          </div>

          <div className="mt-6 overflow-hidden border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Document</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                {archivedDocs.map((doc) => (
                  <tr key={doc.name} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{doc.name}</td>
                    <td className="px-4 py-3 text-slate-600">{doc.owner}</td>
                    <td className="px-4 py-3 text-slate-600">{doc.date}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                          doc.status === "Approved" || doc.status === "Reviewed"
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                            : doc.status === "Pending review"
                              ? "border border-amber-200 bg-amber-50 text-amber-700"
                              : "border border-cyan-200 bg-cyan-50 text-cyan-700"
                        }`}
                      >
                        {doc.status}
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
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Compliance</p>
                <p className="text-xl font-semibold text-slate-900">Audit ready</p>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border border-slate-200 bg-slate-50 text-slate-700">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Recent activity</p>
                <p className="text-xl font-semibold text-slate-900">Updated today</p>
              </div>
            </div>
            <ul className="mt-5 space-y-3 text-sm text-slate-700">
              {activity.map((item) => (
                <li key={item} className="border border-slate-200 bg-slate-50 p-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
