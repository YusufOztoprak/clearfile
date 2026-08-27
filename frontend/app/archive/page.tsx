"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, Download, FileText, Search, ShieldCheck } from "lucide-react";
import { LoadingRow, EmptyRow } from "@/components/TableStates";
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Mirrors backend/app/models/document.py -> Document.status
type DocumentStatus = "pending" | "processing" | "needs_review" | "signed";

type ApiDocument = {
  id: string;
  filename: string;
  status: DocumentStatus;
  uploaded_at: string;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function ArchivePage() {
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/documents`);
        if (!res.ok) throw new Error(String(res.status));
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
    const interval = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const signedDocuments = useMemo(() => documents.filter((d) => d.status === "signed"), [documents]);

  const filtered = useMemo(() => {
    if (!query.trim()) return signedDocuments;
    const q = query.toLowerCase();
    return signedDocuments.filter((doc) => doc.filename.toLowerCase().includes(q));
  }, [signedDocuments, query]);

  return (
    <div className="space-y-8 py-4">
      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Archive</p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] sm:text-4xl">
              Signed documents
            </h1>
            <p className="mt-2 text-muted-foreground">
              Every document that completed the full review and signing cycle ends up here.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by filename"
              className="w-48 bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Signed documents</span>
            <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Archived
            </span>
          </div>
          <div className="mt-5 text-3xl font-bold tracking-[-0.05em]">{signedDocuments.length}</div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total tracked</span>
            <span className="rounded-md border border-border bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              All statuses
            </span>
          </div>
          <div className="mt-5 text-3xl font-bold tracking-[-0.05em]">{documents.length}</div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Completed documents</h2>
        </div>

        <div className="mt-6 overflow-hidden rounded-md border border-border">
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

              {!loading && filtered.length === 0 && (
                <EmptyRow
                  colSpan={4}
                  icon={Archive}
                  message={
                    signedDocuments.length === 0
                      ? "Nothing signed yet. Documents land here once their status is set to \"signed\"."
                      : "No signed documents match this search."
                  }
                />
              )}

              {filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-semibold">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                        <FileText className="h-4 w-4" />
                      </div>
                      <span className="line-clamp-1">{doc.filename}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(doc.uploaded_at)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Signed
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={`${API_BASE}/documents/${doc.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1.5 text-xs font-medium transition hover:bg-muted/70"
                    >
                      <Download className="h-3.5 w-3.5" />
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            There isn&apos;t a dedicated signing endpoint yet (planned for the extraction/signing milestone) — a
            document only reaches &quot;signed&quot; once its status is updated via <code>PATCH /documents/&#123;id&#125;/status</code>.
            The &quot;View&quot; action opens the raw API response for now; it will point to the actual signed
            file and its audit trail once that part of the backend exists.
          </p>
        </div>
      </section>
    </div>
  );
}