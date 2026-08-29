"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  Inbox,
  Loader2,
  PenLine,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";

import { LoadingRow, ErrorRow, EmptyRow, LoadingState, ErrorState, 
  EmptyState } from "@/components/TableStates";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Mirrors backend/app/models/document.py -> Document.status
type DocumentStatus = "pending" | "processing" | "needs_review" | "signed" | "rejected";

type ApiDocument = {
  id: string;
  filename: string;
  status: DocumentStatus;
  uploaded_at: string;
};

type ExtractedField = {
  id: string;
  field_name: string;
  value: string;
  confidence_score: number;
  approved: boolean;
  review_note: string | null;
};

type ApiDocumentDetail = ApiDocument & {
  extracted_fields: ExtractedField[];
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

type FilterMode = "all" | "flagged" | "reliable";
type SortMode = "flagged-first" | "confidence-asc" | "confidence-desc" | "original";

const FILTER_OPTIONS: { value: FilterMode; label: string }[] = [
  { value: "all", label: "All fields" },
  { value: "flagged", label: "Needs attention" },
  { value: "reliable", label: "Reliable only" },
];

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "original", label: "Extraction order" },
  { value: "flagged-first", label: "Flagged first" },
  { value: "confidence-asc", label: "Lowest confidence first" },
  { value: "confidence-desc", label: "Highest confidence first" },
];

function formatConfidence(score: number) {
  return `${Math.round(score * 100)}%`;
}

// Lightweight client-side heuristic, separate from the backend's confidence
// score. It doesn't know if a value is *correct* — it only flags patterns
// that often mean two fields got merged or the OCR read something oddly
// (stray punctuation, mixed digits/letters in a run, multiple clauses
// separated by ; or ?). Treat it as "double-check this", not a verdict.
function looksNoisy(value: string): boolean {
  const suspiciousPunctuation = (value.match(/[!?;#]/g) ?? []).length;
  const hasMixedAlnumRun = /[a-zA-Z]{2,}\d{2,}[a-zA-Z]|\d{2,}[a-zA-Z]{2,}\d/.test(value);
  const looksLikeTwoClauses = /[a-z]\s*[;?]\s*[A-Z]/.test(value);
  return suspiciousPunctuation >= 2 || hasMixedAlnumRun || looksLikeTwoClauses;
}

function DocumentButton({
  doc,
  selected,
  onSelect,
}: {
  doc: ApiDocument;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center justify-between gap-3 rounded-md border p-3 text-left transition ${
        selected ? "border-primary bg-primary/5" : "border-border bg-muted hover:bg-muted/70"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-card">
          <FileText className="h-4 w-4" />
        </div>
        <span className="line-clamp-1 text-sm font-medium">{doc.filename}</span>
      </div>
      <span className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${STATUS_BADGE[doc.status]}`}>
        {STATUS_LABEL[doc.status]}
      </span>
    </button>
  );
}

// Same custom dropdown pattern used for the dashboard's status filter:
// a plain button + an absolutely positioned popup, closed on outside click.
// Replaces the native <select> so the popup's font/colors follow the
// site's theme instead of the browser/OS default.
function SortDropdown({ value, onChange }: { value: SortMode; onChange: (v: SortMode) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = SORT_OPTIONS.find((o) => o.value === value) ?? SORT_OPTIONS[0];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative flex items-center gap-2 text-xs text-muted-foreground">
      Sort:
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted/70"
      >
        {current.label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-10 mt-2 w-52 rounded-md border border-border bg-card p-1 font-sans shadow-md">
          {SORT_OPTIONS.map((opt) => (
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

export default function ReviewPage() {
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ApiDocumentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [sortMode, setSortMode] = useState<SortMode>("original");

  const [savingFieldId, setSavingFieldId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

  // Document-level rejection: a lightweight inline form (not a modal) next
  // to the sign button, with an optional free-text reason — see backend's
  // StatusUpdate schema (status + optional reason) on PATCH /status.
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Collapsed by default — this explanation is only useful the first few
  // times someone uses the page, not on every single visit.
  const [showInfoBanner, setShowInfoBanner] = useState(false);

  // Every field can be expanded/collapsed the same way regardless of
  // whether it's flagged or reliable — this set only decides the *default*
  // state when a document loads (flagged/noisy fields start open, reliable
  // ones start closed), not which fields are allowed to toggle.
  const [expandedFieldIds, setExpandedFieldIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/documents`);
        if (!res.ok) throw new Error(String(res.status));
        const data: ApiDocument[] = await res.json();
        if (cancelled) return;
        setDocuments(data);
        setListError(null);
        if (!selectedId && data.length > 0) {
          const firstNeedsReview = data.find((d) => d.status === "needs_review");
          setSelectedId((firstNeedsReview ?? data[0]).id);
        }
      } catch {
        if (!cancelled) setListError("Could not reach the backend. Is it running?");
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setLoadingDetail(true);
    setDetailError(null);
    setSignError(null);
    setRejectError(null);
    setShowRejectForm(false);
    setRejectReason("");

    fetch(`${API_BASE}/documents/${selectedId}`)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data: ApiDocumentDetail) => {
        if (cancelled) return;
        setDetail(data);
        // Default: anything flagged (unapproved) or noisy-looking opens
        // expanded so it gets attention immediately; reliable fields start
        // collapsed to keep the page scannable.
        const defaultExpanded = new Set(
          data.extracted_fields.filter((f) => !f.approved || looksNoisy(f.value)).map((f) => f.id)
        );
        setExpandedFieldIds(defaultExpanded);
      })
      .catch(() => {
        if (!cancelled) setDetailError("Could not load this document's extracted fields.");
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const needsReviewDocs = useMemo(() => documents.filter((d) => d.status === "needs_review"), [documents]);
  const otherDocs = useMemo(() => documents.filter((d) => d.status !== "needs_review"), [documents]);

  const fields = detail?.extracted_fields ?? [];
  const lowConfidenceCount = useMemo(() => fields.filter((f) => !f.approved).length, [fields]);
  const noisyCount = useMemo(() => fields.filter((f) => looksNoisy(f.value)).length, [fields]);
  const allApproved = fields.length > 0 && fields.every((f) => f.approved);

  // A document can only be signed or rejected while it's still actively
  // under review — once it's already signed or rejected, both actions
  // no longer make sense and the panel switches to a read-only status view.
  const isDecided = detail?.status === "signed" || detail?.status === "rejected";

  const visibleFields = useMemo(() => {
    let list = fields;

    if (filterMode === "flagged") {
      list = list.filter((f) => !f.approved || looksNoisy(f.value));
    } else if (filterMode === "reliable") {
      list = list.filter((f) => f.approved && !looksNoisy(f.value));
    }

    const sorted = [...list];
    if (sortMode === "confidence-asc") {
      sorted.sort((a, b) => a.confidence_score - b.confidence_score);
    } else if (sortMode === "confidence-desc") {
      sorted.sort((a, b) => b.confidence_score - a.confidence_score);
    } else if (sortMode === "flagged-first") {
      sorted.sort((a, b) => {
        const aFlag = (!a.approved ? 2 : 0) + (looksNoisy(a.value) ? 1 : 0);
        const bFlag = (!b.approved ? 2 : 0) + (looksNoisy(b.value) ? 1 : 0);
        if (aFlag !== bFlag) return bFlag - aFlag;
        return a.confidence_score - b.confidence_score;
      });
    }
    // "original" -> leave extraction order untouched

    return sorted;
  }, [fields, filterMode, sortMode]);

  const toggleApproval = async (field: ExtractedField) => {
    if (!selectedId) return;
    const nextApproved = !field.approved;
    setSavingFieldId(field.id);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field.id];
      return next;
    });

    try {
      const res = await fetch(`${API_BASE}/documents/${selectedId}/fields/${field.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: nextApproved }),
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);

      setDetail((prev) =>
        prev
          ? {
              ...prev,
              extracted_fields: prev.extracted_fields.map((f) =>
                f.id === field.id ? { ...f, approved: nextApproved } : f
              ),
            }
          : prev
      );
    } catch {
      setFieldErrors((prev) => ({
        ...prev,
        [field.id]: "Couldn't save this decision. Check the backend and try again.",
      }));
    } finally {
      setSavingFieldId(null);
    }
  };

  const signDocument = async () => {
    if (!selectedId) return;
    setSigning(true);
    setSignError(null);

    try {
      const res = await fetch(`${API_BASE}/documents/${selectedId}/sign`, { method: "POST" });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      setDetail((prev) => (prev ? { ...prev, status: (data.status as DocumentStatus) ?? "signed" } : prev));
      setDocuments((prev) =>
        prev.map((d) => (d.id === selectedId ? { ...d, status: (data.status as DocumentStatus) ?? "signed" } : d))
      );
    } catch {
      setSignError("Signing failed. Check the backend and try again.");
    } finally {
      setSigning(false);
    }
  };

  // Document-level reject, separate from per-field "Mark as rejected" — this
  // sets the whole document's status via PATCH /documents/{id}/status with
  // an optional free-text reason. Confirmed against the backend's
  // StatusUpdate schema (status: str, reason: str | None = None).
  const rejectDocument = async () => {
    if (!selectedId) return;
    setRejecting(true);
    setRejectError(null);

    try {
      const res = await fetch(`${API_BASE}/documents/${selectedId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "rejected",
          reason: rejectReason.trim() ? rejectReason.trim() : null,
        }),
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      setDetail((prev) => (prev ? { ...prev, status: "rejected" } : prev));
      setDocuments((prev) => prev.map((d) => (d.id === selectedId ? { ...d, status: "rejected" } : d)));
      setShowRejectForm(false);
      setRejectReason("");
    } catch {
      setRejectError("Rejection failed. Check the backend and try again.");
    } finally {
      setRejecting(false);
    }
  };

  function toggleFieldExpanded(fieldId: string) {
    setExpandedFieldIds((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) next.delete(fieldId);
      else next.add(fieldId);
      return next;
    });
  }

  return (
    <div className="space-y-8 py-4">
      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Review</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] sm:text-4xl">
          Extracted fields review
        </h1>
        <p className="mt-2 text-muted-foreground">
          Fields below the confidence threshold are flagged automatically and come with a short note.
        </p>

        <button
          onClick={() => setShowInfoBanner((v) => !v)}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent-foreground underline"
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          {showInfoBanner ? "Hide" : "Why some fields might be missing"}
        </button>

        {showInfoBanner && (
          <div className="mt-2 flex items-start gap-2 rounded-md border border-accent bg-accent/40 p-3 text-sm text-accent-foreground">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Only fields Nutrient managed to detect show up below. If something you expect from the original
              invoice is missing entirely, that&apos;s a detection gap, not a rejection — check the document in the
              viewer to confirm before trusting the extraction as complete.
            </p>
          </div>
        )}

        {listError && <ErrorState message={listError} />}
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
        <section className="rounded-lg border border-border bg-card p-5 text-card-foreground sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Documents</h2>
            {needsReviewDocs.length > 0 && (
              <span className="rounded-md border border-accent bg-accent px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
                {needsReviewDocs.length} to review
              </span>
            )}
          </div>

          {loadingList && <LoadingState className="p-6" />}

          {!loadingList && documents.length === 0 && (
            <EmptyState icon={Inbox} message="No documents uploaded yet." />
)}

          {!loadingList && needsReviewDocs.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Needs your review
              </p>
              <div className="space-y-2">
                {needsReviewDocs.map((doc) => (
                  <DocumentButton
                    key={doc.id}
                    doc={doc}
                    selected={selectedId === doc.id}
                    onSelect={() => setSelectedId(doc.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {!loadingList && otherDocs.length > 0 && (
            <div className={needsReviewDocs.length > 0 ? "mt-6" : "mt-4"}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {needsReviewDocs.length > 0 ? "Other documents" : "Documents"}
              </p>
              <div className="space-y-2">
                {otherDocs.map((doc) => (
                  <DocumentButton
                    key={doc.id}
                    doc={doc}
                    selected={selectedId === doc.id}
                    onSelect={() => setSelectedId(doc.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-border bg-card p-5 text-card-foreground sm:p-6">
          {!selectedId && (
            <p className="text-sm text-muted-foreground">Select a document on the left to review its fields.</p>
          )}

          {selectedId && loadingDetail && (
            <div className="flex items-center justify-center p-10 text-muted-foreground">
              <LoadingState className="p-4" />
            </div>
          )}

          {selectedId && detailError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {detailError}
            </p>
          )}

          {selectedId && !loadingDetail && detail && (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{detail.filename}</h2>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_BADGE[detail.status]}`}>
                      {STATUS_LABEL[detail.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {fields.length} field{fields.length === 1 ? "" : "s"} extracted
                    {lowConfidenceCount > 0 && ` — ${lowConfidenceCount} need${lowConfidenceCount === 1 ? "s" : ""} attention`}
                    {noisyCount > 0 && ` — ${noisyCount} look${noisyCount === 1 ? "s" : ""} unusual`}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <a
                    href={`/viewer?document=${selectedId}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1.5 text-xs font-medium transition hover:bg-muted/70"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </a>

                  {fields.length > 0 && !isDecided && (
                    <>
                      <button
                        onClick={() => {
                          setShowRejectForm((v) => !v);
                          setRejectError(null);
                        }}
                        disabled={rejecting}
                        className="inline-flex items-center justify-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs font-semibold text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </button>
                      <button
                        onClick={signDocument}
                        disabled={!allApproved || signing}
                        title={allApproved ? undefined : "All fields must be approved before signing"}
                        className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {signing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PenLine className="h-3.5 w-3.5" />}
                        Sign
                      </button>
                    </>
                  )}
                </div>
              </div>

              {showRejectForm && !isDecided && (
                <div className="mt-3 rounded-md border border-destructive/20 bg-destructive/5 p-3">
                  <label htmlFor="reject-reason" className="text-xs font-semibold text-destructive">
                    Reason (optional)
                  </label>
                  <textarea
                    id="reject-reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Amount doesn't match the purchase order, or vendor is unrecognized…"
                    rows={2}
                    className="mt-1.5 w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-destructive/40"
                  />
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectReason("");
                      }}
                      disabled={rejecting}
                      className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={rejectDocument}
                      disabled={rejecting}
                      className="inline-flex items-center gap-1.5 rounded-md bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {rejecting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Confirm rejection
                    </button>
                  </div>
                </div>
              )}

              {isDecided && detail.status === "rejected" && (
                <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>This document has been rejected. Check the audit trail for who rejected it and when.</p>
                </div>
              )}

              {signError && (
                <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {signError}
                </p>
              )}

              {rejectError && (
                <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {rejectError}
                </p>
              )}

              {fields.length > 0 && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <SortDropdown value={sortMode} onChange={setSortMode} />

                  <div className="flex flex-wrap gap-1.5">
                    {FILTER_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFilterMode(opt.value)}
                        className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                          filterMode === opt.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-muted text-muted-foreground hover:bg-muted/70"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-2">
                {fields.length === 0 && (
                  <p className="rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
                    No fields extracted yet for this document. Run extraction first.
                  </p>
                )}

                {fields.length > 0 && visibleFields.length === 0 && (
                  <p className="rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
                    No fields match this filter.
                  </p>
                )}

                {visibleFields.map((field) => {
                  const flagged = !field.approved;
                  const noisy = looksNoisy(field.value);
                  const isSaving = savingFieldId === field.id;
                  const saveError = fieldErrors[field.id];
                  const isExpanded = expandedFieldIds.has(field.id);

                  // Collapsed view — same layout for every field regardless
                  // of flagged/reliable status, just a different leading
                  // icon. Clicking anywhere on the row (not just the
                  // chevron) expands it, and the chevron is always on the
                  // same left-hand spot so collapsing later is the same motion.
                  if (!isExpanded) {
                    return (
                      <div
                        key={field.id}
                        onClick={() => toggleFieldExpanded(field.id)}
                        className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 transition ${
                          flagged
                            ? "border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
                            : "border-border bg-muted/40 hover:bg-muted/70"
                        }`}
                      >
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {flagged ? (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                        ) : (
                          <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                        )}
                        <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {field.field_name.replace(/_/g, " ")}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-mono text-sm">{field.value}</span>
                        {noisy && (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                        )}
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatConfidence(field.confidence_score)}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={field.id}
                      className={`rounded-md border p-4 ${
                        flagged ? "border-destructive/30 bg-destructive/5" : "border-border bg-muted"
                      }`}
                    >
                      {/* Same chevron, same left-hand spot as the collapsed
                          row above — this header is the only part that
                          toggles, so the Approve/Reject button below isn't
                          accidentally caught by the same click. */}
                      <div
                        onClick={() => toggleFieldExpanded(field.id)}
                        className="flex cursor-pointer flex-wrap items-start justify-between gap-3"
                      >
                        <div className="flex min-w-0 items-start gap-2">
                          <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {field.field_name.replace(/_/g, " ")}
                            </p>
                            <p className="mt-1 break-words font-mono text-sm font-semibold leading-relaxed">
                              {field.value}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <span
                            className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                              flagged
                                ? "border-destructive/30 bg-destructive/10 text-destructive"
                                : "border-primary/20 bg-primary/10 text-primary"
                            }`}
                          >
                            {formatConfidence(field.confidence_score)} confidence
                          </span>
                          {noisy && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                              <AlertTriangle className="h-3 w-3" />
                              Looks unusual
                            </span>
                          )}
                        </div>
                      </div>

                      {noisy && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          This value has an odd shape (stray punctuation or mixed text/numbers) — it may combine two
                          fields Nutrient couldn&apos;t separate. Worth comparing against the original document.
                        </p>
                      )}

                      {field.review_note && (
                        <div className="mt-3 flex items-start gap-2 rounded-md border border-accent bg-accent/50 p-3 text-sm text-accent-foreground">
                          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                          <p>{field.review_note}</p>
                        </div>
                      )}

                      {saveError && (
                        <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                          {saveError}
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {isSaving ? (
                            <span className="inline-flex items-center gap-1">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
                            </span>
                          ) : field.approved ? (
                            <span className="inline-flex items-center gap-1 text-primary">
                              <Check className="h-3.5 w-3.5" /> Approved
                            </span>
                          ) : (
                            "Awaiting your review"
                          )}
                        </span>

                        <button
                          onClick={() => toggleApproval(field)}
                          disabled={isSaving}
                          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            field.approved
                              ? "border-border bg-card hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                              : "border-border bg-card hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                          }`}
                        >
                          {field.approved ? "Mark as rejected" : "Approve field"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {fields.length > 0 && (
                <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <p>
                    Decisions are saved to the backend via <code>PATCH /documents/&#123;id&#125;/fields/&#123;field_id&#125;</code> and
                    logged to the audit trail. Signing checks approval status on this page only — the backend&apos;s{" "}
                    <code>/sign</code> endpoint doesn&apos;t enforce it yet.
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}