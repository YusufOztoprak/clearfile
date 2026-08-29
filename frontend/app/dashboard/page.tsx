"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  ChevronDown,
  ClipboardList,
  Download,
  Eye,
  FileX2,
  Filter,
  Inbox,
  Loader2,
  Search,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Mirrors backend/app/models/document.py -> Document.status
type DocumentStatus = "pending" | "processing" | "needs_review" | "signed" | "rejected";
type StatusFilter = "all" | DocumentStatus;

type ApiDocument = {
  id: string;
  filename: string;
  status: DocumentStatus;
  uploaded_at: string;
  // Not exposed by GET /documents yet — see the note under the table.
  signed_file_path?: string | null;
};

type AuditLogEntry = {
  action: string;
  actor: string;
  timestamp: string;
};

type AuditEntryWithDoc = AuditLogEntry & {
  documentId: string;
  filename: string;
};

const STATUS_LABEL: Record<DocumentStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  needs_review: "Needs review",
  signed: "Signed",
  rejected: "Rejected",
};

const STATUS_BADGE: Record<DocumentStatus, string> = {
  pending: "border-border bg-muted text-muted-foreground",
  processing: "border-accent bg-accent text-accent-foreground",
  needs_review: "border-accent bg-accent text-accent-foreground",
  signed: "border-primary/20 bg-primary/10 text-primary",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
};

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "needs_review", label: "Needs review" },
  { value: "signed", label: "Signed" },
  { value: "rejected", label: "Rejected" },
];

function formatAction(action: string): string {
  if (action.startsWith("status_changed_to_")) {
    return `Status changed to "${action.replace("status_changed_to_", "")}"`;
  }
  if (action.startsWith("field_approved:")) {
    return `Approved field "${action.split(":")[1]?.trim()}"`;
  }
  if (action.startsWith("field_rejected:")) {
    return `Rejected field "${action.split(":")[1]?.trim()}"`;
  }
  const known: Record<string, string> = {
    uploaded: "Document uploaded",
    extracted: "Fields extracted",
    extraction_failed: "Extraction failed",
    signed: "Document signed",
  };
  return known[action] ?? action;
}

function formatTimestamp(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

// Reused empty-state block: an icon + a message, consistent across every
// table on this page instead of some having an icon and others plain text.
function EmptyRow({
  colSpan,
  icon: Icon,
  message,
}: {
  colSpan: number;
  icon: typeof Inbox;
  message: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Icon className="h-6 w-6" />
          <p className="text-sm">{message}</p>
        </div>
      </td>
    </tr>
  );
}

function ErrorRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-6 text-center">
        <div className="flex items-center justify-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">{message}</span>
        </div>
      </td>
    </tr>
  );
}

function LoadingRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-muted-foreground">
        <Loader2 className="mx-auto h-4 w-4 animate-spin" />
      </td>
    </tr>
  );
}

function StatusFilterDropdown({ value, onChange }: { value: StatusFilter; onChange: (v: StatusFilter) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = STATUS_FILTER_OPTIONS.find((o) => o.value === value) ?? STATUS_FILTER_OPTIONS[0];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition ${
          value !== "all"
            ? "border-primary/30 bg-primary/10 text-primary"
            : "border-border bg-muted text-muted-foreground hover:opacity-80"
        }`}
      >
        <Filter className="h-4 w-4" />
        {value === "all" ? "Filter" : current.label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-2 w-44 rounded-md border border-border bg-card p-1 font-sans shadow-md">
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`block w-full rounded-sm px-3 py-2 text-left text-sm transition ${
                value === opt.value ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [auditEntries, setAuditEntries] = useState<AuditEntryWithDoc[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [auditError, setAuditError] = useState<string | null>(null);

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

  // GET /documents/{id}/audit is per-document, so the dashboard's global
  // feed is built by fetching each document's log and merging them by
  // timestamp. Fine at hackathon scale; a global GET /audit endpoint would
  // be cheaper server-side at real scale.
  useEffect(() => {
    if (documents.length === 0) {
      setLoadingAudit(false);
      return;
    }

    let cancelled = false;
    setLoadingAudit(true);
    setAuditError(null);

    Promise.all(
      documents.map(async (doc) => {
        try {
          const res = await fetch(`${API_BASE}/documents/${doc.id}/audit`);
          if (!res.ok) throw new Error(String(res.status));
          const data: { audit_trail: AuditLogEntry[] } = await res.json();
          return data.audit_trail.map((log) => ({ ...log, documentId: doc.id, filename: doc.filename }));
        } catch {
          return [];
        }
      })
    )
      .then((results) => {
        if (cancelled) return;
        const merged = results.flat().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAuditEntries(merged);
      })
      .catch(() => {
        if (!cancelled) setAuditError("Could not load audit history.");
      })
      .finally(() => {
        if (!cancelled) setLoadingAudit(false);
      });

    return () => {
      cancelled = true;
    };
  }, [documents]);

  const filtered = useMemo(() => {
    let list = documents;

    if (statusFilter !== "all") {
      list = list.filter((doc) => doc.status === statusFilter);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((doc) => doc.filename.toLowerCase().includes(q));
    }

    return list;
  }, [documents, query, statusFilter]);

  const needsReview = documents.filter((doc) => doc.status === "needs_review");
  const signedCount = documents.filter((doc) => doc.status === "signed").length;
  const inFlightCount = documents.filter((doc) => doc.status === "pending" || doc.status === "processing").length;

  const stats = [
    { label: "Total documents", value: String(documents.length), delta: loading ? "Loading" : "Live" },
    { label: "In the pipeline", value: String(inFlightCount), delta: inFlightCount > 0 ? "Active" : "Idle" },
    { label: "Signed", value: String(signedCount), delta: "Completed" },
  ];

  // Wired directly to the backend's download route now that it exists —
  // gated on status === "signed" (the only status guaranteed to have a
  // signed_file_path saved server-side), not on signed_file_path being
  // present in this response, since GET /documents doesn't expose that
  // field yet.
  const downloadUrl = (doc: ApiDocument) => `${API_BASE}/documents/${doc.id}/signed-file`;
  const viewUrl = (doc: ApiDocument) => `/viewer?document=${doc.id}`;

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

          <a
            href="/upload"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <ArrowUpRight className="h-4 w-4" />
            New invoice
          </a>
        </div>

        {error && (
          <p className="mt-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
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
            <div className="mt-5 text-3xl font-bold tracking-[-0.05em]">
              {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : stat.value}
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-lg border border-border bg-card p-5 text-card-foreground sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold">Invoices</h2>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                <Search className="h-4 w-4" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by filename"
                  className="w-36 bg-transparent outline-none placeholder:text-muted-foreground sm:w-48"
                />
              </div>

              <StatusFilterDropdown value={statusFilter} onChange={setStatusFilter} />
            </div>
          </div>

          {statusFilter !== "all" && (
            <p className="mt-3 text-xs text-muted-foreground">
              Showing only <span className="font-medium text-foreground">{STATUS_LABEL[statusFilter]}</span> documents
              —{" "}
              <button onClick={() => setStatusFilter("all")} className="underline">
                clear filter
              </button>
            </p>
          )}

          <div className="mt-4 overflow-hidden rounded-md border border-border">
            <table className="min-w-full divide-y divide-border text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Document</th>
                  <th className="px-4 py-3 font-medium">Uploaded</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {loading && <LoadingRow colSpan={4} />}

                {!loading && error && documents.length === 0 && (
                  <ErrorRow colSpan={4} message="Couldn't load documents." />
                )}

                {!loading && !error && filtered.length === 0 && (
                  <EmptyRow
                    colSpan={4}
                    icon={documents.length === 0 ? Inbox : FileX2}
                    message={
                      documents.length === 0
                        ? "No documents yet. Upload one to see it here."
                        : "No documents match this filter."
                    }
                  />
                )}

                {filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 font-semibold">
                      <span className="line-clamp-1">{doc.filename}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatTimestamp(doc.uploaded_at)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`whitespace-nowrap rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${STATUS_BADGE[doc.status]}`}
                      >
                        {STATUS_LABEL[doc.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <a
                          href={viewUrl(doc)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1.5 text-xs font-medium transition hover:bg-muted/70"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </a>
                        {doc.status === "signed" && (
                          <a
                            href={downloadUrl(doc)}
                            download
                            className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Vendor and amount columns will be added once field extraction is wired to the backend. Signed documents
            also live in the <a href="/archive" className="underline">Archive</a>.
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
                <p className="text-2xl font-bold">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : needsReview.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-muted">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pipeline load</p>
                <p className="text-2xl font-bold">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : inFlightCount > 0 ? "Active" : "Idle"}
                </p>
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
              {loading && (
                <div className="flex items-center justify-center p-4 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}

              {!loading && needsReview.length === 0 && (
                <div className="flex flex-col items-center gap-2 p-2 text-center text-muted-foreground">
                  <Inbox className="h-5 w-5" />
                  <p className="text-sm">Nothing pending review right now.</p>
                </div>
              )}

              {needsReview.slice(0, 5).map((doc) => (
                <a
                  key={doc.id}
                  href="/review"
                  className="flex items-center gap-3 rounded-md border border-border bg-muted p-3 transition hover:bg-muted/70"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="line-clamp-1 text-sm">{doc.filename}</span>
                </a>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}