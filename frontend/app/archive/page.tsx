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
    <div className="space-y-8 py-6">
      <section className="rounded-[28px] border border-white/10 bg-[#111827] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.45)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-300">Archive</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Document history and approvals
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10">
              <Search className="h-4 w-4" />
              Search archive
            </button>
            <button className="inline-flex items-center gap-2 rounded-full bg-teal-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-teal-900/30 hover:bg-teal-300">
              <Archive className="h-4 w-4" />
              Export report
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-white/10 bg-[#111827] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.4)]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Recent documents</h2>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
              Current
            </span>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-slate-900 text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">Document</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-[#111827] text-slate-200">
                {archivedDocs.map((doc) => (
                  <tr key={doc.name} className="hover:bg-slate-900/80">
                    <td className="px-4 py-3 font-semibold text-white">{doc.name}</td>
                    <td className="px-4 py-3 text-slate-300">{doc.owner}</td>
                    <td className="px-4 py-3 text-slate-300">{doc.date}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                          doc.status === "Approved" || doc.status === "Reviewed"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : doc.status === "Pending review"
                              ? "bg-amber-500/15 text-amber-300"
                              : "bg-cyan-500/15 text-cyan-300"
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
          <div className="rounded-[28px] border border-white/10 bg-[#111827] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.35)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Compliance</p>
                <p className="text-xl font-bold text-white">Audit ready</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#111827] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.35)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Recent activity</p>
                <p className="text-xl font-bold text-white">Updated today</p>
              </div>
            </div>
            <ul className="mt-5 space-y-3 text-sm text-slate-200">
              {activity.map((item) => (
                <li key={item} className="rounded-2xl bg-slate-900 p-3 ring-1 ring-white/10">
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
