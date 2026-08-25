"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ClipboardList, Loader2, Search, User } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type ApiDocument = {
  id: string;
  filename: string;
  status: "pending" | "processing" | "needs_review" | "signed";
  uploaded_at: string;
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

type ActorFilter = "all" | string;

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
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

// Same custom dropdown pattern used elsewhere in the app (dashboard's status
// filter, review's sort control): button + absolutely positioned popup,
// closed on outside click, styled with the site's theme tokens.
function ActorFilterDropdown({
  value,
  options,
  onChange,
}: {
  value: ActorFilter;
  options: string[];
  onChange: (v: ActorFilter) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        <User className="h-4 w-4" />
        {value === "all" ? "All actors" : value}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-2 w-40 rounded-md border border-border bg-card p-1 font-sans shadow-md">
          <button
            onClick={() => {
              onChange("all");
              setOpen(false);
            }}
            className={`block w-full rounded-sm px-3 py-2 text-left text-sm transition ${
              value === "all" ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
            }`}
          >
            All actors
          </button>
          {options.map((actor) => (
            <button
              key={actor}
              onClick={() => {
                onChange(actor);
                setOpen(false);
              }}
              className={`block w-full rounded-sm px-3 py-2 text-left text-sm capitalize transition ${
                value === actor ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
              }`}
            >
              {actor}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AuditPage() {
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [entries, setEntries] = useState<AuditEntryWithDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [actorFilter, setActorFilter] = useState<ActorFilter>("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/documents`);
        if (!res.ok) throw new Error(String(res.status));
        const docs: ApiDocument[] = await res.json();
        if (cancelled) return;
        setDocuments(docs);

        const results = await Promise.all(
          docs.map(async (doc) => {
            try {
              const r = await fetch(`${API_BASE}/documents/${doc.id}/audit`);
              if (!r.ok) throw new Error(String(r.status));
              const data: { logs: AuditLogEntry[] } = await r.json();
              return data.logs.map((log) => ({ ...log, documentId: doc.id, filename: doc.filename }));
            } catch {
              return [];
            }
          })
        );

        if (cancelled) return;
        const merged = results
          .flat()
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setEntries(merged);
        setError(null);
      } catch {
        if (!cancelled) setError("Could not reach the backend. Is it running?");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const actors = useMemo(() => Array.from(new Set(entries.map((e) => e.actor))).sort(), [entries]);

  const filtered = useMemo(() => {
    let list = entries;

    if (actorFilter !== "all") {
      list = list.filter((e) => e.actor === actorFilter);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (e) => e.filename.toLowerCase().includes(q) || formatAction(e.action).toLowerCase().includes(q)
      );
    }

    return list;
  }, [entries, query, actorFilter]);

  return (
    <div className="space-y-8 py-4">
      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Audit</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] sm:text-4xl">
          Audit trail
        </h1>
        <p className="mt-2 text-muted-foreground">
          Every action taken across all {documents.length} document{documents.length === 1 ? "" : "s"} — who did
          what, and when.
        </p>

        {error && (
          <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted">
              <ClipboardList className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold">{filtered.length} entries</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search document or action"
                className="w-40 bg-transparent outline-none placeholder:text-muted-foreground sm:w-56"
              />
            </div>

            <ActorFilterDropdown value={actorFilter} options={actors} onChange={setActorFilter} />
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-md border border-border">
          <table className="min-w-full divide-y divide-border text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Document</th>
                <th className="px-4 py-3 font-medium">What</th>
                <th className="px-4 py-3 font-medium">Who</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    {entries.length === 0
                      ? "No audit activity yet. Actions will appear here as documents move through the pipeline."
                      : "No entries match this search or filter."}
                  </td>
                </tr>
              )}

              {filtered.map((entry, idx) => (
                <tr key={`${entry.documentId}-${entry.timestamp}-${idx}`} className="hover:bg-muted/50">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {formatTimestamp(entry.timestamp)}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <span className="line-clamp-1 max-w-[220px]">{entry.filename}</span>
                  </td>
                  <td className="px-4 py-3">{formatAction(entry.action)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 capitalize text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      {entry.actor}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Entries are fetched per document via <code>GET /documents/&#123;id&#125;/audit</code> and merged
          client-side — a global <code>GET /audit</code> endpoint would be more efficient at real scale.
        </p>
      </section>
    </div>
  );
}