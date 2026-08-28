"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { LoadingRow, ErrorRow, EmptyRow } from "@/components/TableStates";
import { ChevronDown, ChevronRight, ClipboardList, Search, User } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type ApiDocument = {
  id: string;
  filename: string;
  status: "pending" | "processing" | "needs_review" | "signed" | "rejected";
  uploaded_at: string;
};

type AuditLogEntry = {
  action: string;
  actor: string;
  timestamp: string;
  // Not populated by the backend yet — see note below formatAction. Included
  // now so the UI is ready the moment the backend adds it to /audit responses.
  reason?: string | null;
};

type AuditEntryWithDoc = AuditLogEntry & {
  documentId: string;
  filename: string;
};

type DocumentGroup = {
  documentId: string;
  filename: string;
  latest: AuditEntryWithDoc;
  history: AuditEntryWithDoc[]; // sorted desc, includes latest at [0]
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

// The backend doesn't expose a dedicated "reason" field on audit entries yet
// (its StatusUpdate schema accepts one, but it's currently dropped before
// being saved to the AuditLog — a backend bug, not a frontend gap). This
// reads entry.reason if the backend starts sending it properly, and falls
// back to parsing a "status_changed_to_rejected_<reason>" suffix as a
// stop-gap in case the quick fix embeds it in the action string instead.
function getRejectionReason(entry: AuditLogEntry): string | null {
  if (entry.reason) return entry.reason;
  const match = entry.action.match(/^status_changed_to_rejected_(.+)$/);
  return match ? match[1] : null;
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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
              const data: { audit_trail: AuditLogEntry[] } = await r.json();
              return data.audit_trail.map((log) => ({ ...log, documentId: doc.id, filename: doc.filename }));
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

  // Group the flat, already-sorted (desc) entries by document: one row per
  // document showing its latest event, with the full per-document history
  // available on click instead of one line per action for every document.
  const groups = useMemo<DocumentGroup[]>(() => {
    const byDoc = new Map<string, AuditEntryWithDoc[]>();
    for (const entry of filtered) {
      const list = byDoc.get(entry.documentId) ?? [];
      list.push(entry);
      byDoc.set(entry.documentId, list);
    }
    return Array.from(byDoc.values())
      .map((history) => ({
        documentId: history[0].documentId,
        filename: history[0].filename,
        latest: history[0],
        history,
      }))
      .sort((a, b) => new Date(b.latest.timestamp).getTime() - new Date(a.latest.timestamp).getTime());
  }, [filtered]);

  function toggleExpanded(documentId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(documentId)) next.delete(documentId);
      else next.add(documentId);
      return next;
    });
  }

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
            <h2 className="text-lg font-semibold">
              {groups.length} document{groups.length === 1 ? "" : "s"}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({filtered.length} event{filtered.length === 1 ? "" : "s"} total)
              </span>
            </h2>
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

        {/* table-fixed + colgroup: column widths are locked to fixed
            percentages instead of being recalculated from visible content,
            so expanding/collapsing a row's history no longer reflows the
            whole table. */}
        <div className="mt-5 overflow-hidden rounded-md border border-border">
          <table className="w-full table-fixed divide-y divide-border text-left text-sm">
            <colgroup>
              <col className="w-[30%]" />
              <col className="w-[18%]" />
              <col className="w-[37%]" />
              <col className="w-[15%]" />
            </colgroup>
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Document</th>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Latest action</th>
                <th className="px-4 py-3 font-medium">Who</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {loading && <LoadingRow colSpan={4} />}

              {!loading && error && <ErrorRow colSpan={4} message="Couldn't load audit entries." />}

              {!loading && !error && groups.length === 0 && (
                <EmptyRow
                  colSpan={4}
                  icon={ClipboardList}
                  message={
                    entries.length === 0
                      ? "No audit activity yet. Actions will appear here as documents move through the pipeline."
                      : "No entries match this search or filter."
                  }
                />
              )}

              {!loading &&
                !error &&
                groups.map((group) => {
                  const isExpanded = expandedIds.has(group.documentId);
                  const olderEvents = group.history.slice(1);
                  const latestReason = getRejectionReason(group.latest);

                  return (
                    <Fragment key={group.documentId}>
                      <tr
                        onClick={() => toggleExpanded(group.documentId)}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 font-medium">
                          <span className="flex items-center gap-2">
                            {olderEvents.length > 0 ? (
                              isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              )
                            ) : (
                              <span className="w-3.5 shrink-0" />
                            )}
                            <span className="line-clamp-1 break-all">{group.filename}</span>
                            {olderEvents.length > 0 && (
                              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                {group.history.length}
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {formatTimestamp(group.latest.timestamp)}
                        </td>
                        <td className="px-4 py-3">
                          <p>{formatAction(group.latest.action)}</p>
                          {latestReason && (
                            <p className="mt-0.5 truncate text-xs text-destructive" title={latestReason}>
                              Reason: {latestReason}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 capitalize text-muted-foreground">
                            <User className="h-3.5 w-3.5" />
                            {group.latest.actor}
                          </span>
                        </td>
                      </tr>

                      {isExpanded &&
                        olderEvents.map((entry, idx) => {
                          const reason = getRejectionReason(entry);
                          return (
                            <tr key={`${group.documentId}-${entry.timestamp}-${idx}`} className="bg-muted/30">
                              <td className="px-4 py-2 pl-10">
                                <span className="block h-full border-l-2 border-border pl-3 text-xs text-transparent">
                                  .
                                </span>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-xs text-muted-foreground">
                                {formatTimestamp(entry.timestamp)}
                              </td>
                              <td className="px-4 py-2">
                                <p className="text-xs text-muted-foreground">{formatAction(entry.action)}</p>
                                {reason && (
                                  <p className="mt-0.5 truncate text-xs text-destructive" title={reason}>
                                    Reason: {reason}
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-2">
                                <span className="inline-flex items-center gap-1.5 text-xs capitalize text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  {entry.actor}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </Fragment>
                  );
                })}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Showing the latest action per document — click a row to expand its full history. Entries are fetched per
          document via <code>GET /documents/&#123;id&#125;/audit</code> and merged client-side.
        </p>
      </section>
    </div>
  );
}
