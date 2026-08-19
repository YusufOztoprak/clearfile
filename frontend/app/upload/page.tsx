import { ArrowUpToLine, CheckCircle2, FileText, ShieldCheck } from "lucide-react";

const recentUploads = [
  { name: "Supplier invoice.pdf", status: "Processed", tone: "emerald" },
  { name: "Vendor statement.png", status: "Needs review", tone: "amber" },
  { name: "Purchase record.jpg", status: "Approved", tone: "blue" },
];

export default function UploadPage() {
  return (
    <div className="space-y-8 py-6">
      <div className="rounded-[28px] border border-white/10 bg-[#111827] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.45)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-300">Upload</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Add a new invoice document
            </h1>
          </div>

          <button className="inline-flex items-center justify-center gap-2 rounded-full bg-teal-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-300">
            <ArrowUpToLine className="h-4 w-4" />
            Upload file
          </button>
        </div>

        <div className="mt-8 rounded-[26px] border border-dashed border-white/15 bg-slate-900/80 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-400/10 text-teal-300 ring-1 ring-teal-400/20">
            <FileText className="h-8 w-8" />
          </div>

          <h2 className="mt-5 text-2xl font-bold text-white">Drag and drop your invoice</h2>
          <p className="mt-2 text-slate-300">
            PDF, PNG, and JPG files are supported. The intake workflow begins as soon as the file is uploaded.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-300">
            {[
              "PDF",
              "PNG",
              "JPG",
              "Validated intake",
            ].map((type) => (
              <span key={type} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                {type}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[28px] border border-white/10 bg-[#111827] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.45)]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Processing status</h2>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
              Active
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {[
              { label: "Document detected", done: true },
              { label: "Document review", done: true },
              { label: "Validation check", done: false },
              { label: "Final approval", done: false },
            ].map((step) => (
              <div key={step.label} className="flex items-center justify-between rounded-2xl bg-slate-900 p-3 ring-1 ring-white/10">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-200">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${
                      step.done ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  {step.label}
                </div>
                <span className="text-xs text-slate-400">{step.done ? "Done" : "Pending"}</span>
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-[28px] border border-white/10 bg-[#111827] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.45)]">
          <h2 className="text-xl font-bold text-white">Recent uploads</h2>

          <div className="mt-6 space-y-3">
            {recentUploads.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-2xl bg-slate-900 p-3 ring-1 ring-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-200 ring-1 ring-white/10">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.status}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                    item.tone === "emerald"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : item.tone === "amber"
                        ? "bg-amber-500/15 text-amber-300"
                        : "bg-cyan-500/15 text-cyan-300"
                  }`}
                >
                  {item.tone}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              Secure workflow
            </div>
            <p className="mt-2 leading-6 text-emerald-100/90">
              Every upload is encrypted and logged for audit and compliance purposes.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}