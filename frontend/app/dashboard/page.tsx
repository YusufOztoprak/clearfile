"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  FileText,
  Filter,
  Loader2,
  Search,
  TrendingUp,
  Wallet,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Mirrors backend/app/models/document.py -> Document.status
type DocumentStatus = "pending" | "processing" | "needs_review" | "signed";

type ApiDocument = {
  id: string;
  filename: string;
  status: DocumentStatus;
  uploaded_at: string;
};

const STATUS_LABEL: Record<DocumentStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  needs_review: "Needs review",
  signed: "Signed",
};

const STATUS_BADGE: Record<DocumentStatus, string> = {
  pending: "border-border bg-muted text-muted-foreground",
  processing: "border-accent bg-accent text-accent-foreground",
  needs_review: "border-accent bg-accent text-accent-foreground",
  signed: "border-primary/20 bg-primary/10 text-primary",
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function DashboardPage() {
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/documents`);
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        const data: ApiDocument[] = await res.json();
        if (!cancelled) {
          setDocuments(data);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Could not reach the backend. Is it running?");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return documents;
    const q = query.toLowerCase();
    return documents.filter((doc) => doc.filename.toLowerCase().includes(q));
  }, [documents, query]);

  const needsReview = documents.filter((doc) => doc.status === "needs_review");
  const signedCount = documents.filter((doc) => doc.status === "signed").length;
  const inFlightCount = documents.filter((doc) => doc.status === "pending" || doc.status === "processing").length;

  const stats = [
    { label: "Total documents", value: String(documents.length), delta: loading ? "Loading" : "Live" },
    { label: "In the pipeline", value: String(inFlightCount), delta: inFlightCount > 0 ? "Active" : "Idle" },
    { label: "Signed", value: String(signedCount), delta: "Completed" },
  ];

  return (
    <div className="space-y-8 py-4">
      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Dashboard</p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] sm:text-4xl">
              Finance operations overview
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-md border border-border bg-muted px-4 py-2 text-sm font-medium text-muted-foreground transition hover:opacity-80">
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <a
              href="/upload"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <ArrowUpRight className="h-4 w-4" />
              New invoice
            </a>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                {stat.delta}
              </span>
            </div>
            <div className="mt-5 text-3xl font-bold tracking-[-0.05em]">{stat.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-lg border border-border bg-card p-5 text-card-foreground sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Invoices</h2>
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by filename"
                className="w-40 bg-transparent outline-none placeholder:text-muted-foreground sm:w-56"
              />
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-md border border-border">
            <table className="min-w-full divide-y divide-border text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Document</th>
                  <th className="px-4 py-3 font-medium">Uploaded</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {loading && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                    </td>
                  </tr>
                )}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                      No documents yet. Upload one to see it here.
                    </td>
                  </tr>
                )}

                {filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 font-semibold">
                      <span className="line-clamp-1">{doc.filename}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(doc.uploaded_at)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${STATUS_BADGE[doc.status]}`}
                      >
                        {STATUS_LABEL[doc.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Vendor and amount columns will be added once field extraction is wired to the backend.
          </p>
        </div>

        <aside className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-muted text-foreground">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Documents in review</p>
                <p className="text-2xl font-bold">{needsReview.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-foreground p-5 text-background sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border/40 bg-background/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm opacity-70">Pipeline load</p>
                <p className="text-2xl font-bold">{inFlightCount > 0 ? "Active" : "Idle"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Review queue</h3>
              <span className="rounded-md border border-accent bg-accent px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
                {needsReview.length > 0 ? "In focus" : "Clear"}
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {needsReview.length === 0 && (
                <p className="text-sm text-muted-foreground">Nothing pending review right now.</p>
              )}

              {needsReview.slice(0, 5).map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 rounded-md border border-border bg-muted p-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="line-clamp-1 text-sm">{doc.filename}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-muted text-foreground">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Recent audit entries</h2>
            <p className="text-sm text-muted-foreground">
              Not wired up yet — the backend does not expose a document audit endpoint at this stage of the build.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}