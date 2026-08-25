"use client";

import { useEffect, useMemo, useState } from "react";
import { Select } from "@base-ui/react/select";

import {
  AlertTriangle,
  Check,
  ChevronDown,
  FileText,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
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
};

const STATUS_BADGE: Record<DocumentStatus, string> = {
  pending: "border-border bg-muted text-muted-foreground",
  processing: "border-accent bg-accent text-accent-foreground",
  needs_review: "border-accent bg-accent text-accent-foreground",
  signed: "border-primary/20 bg-primary/10 text-primary",
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

// Same idea as the upload page's "active vs history" split: rather than one
// flat list of every document (which just duplicates the dashboard), the
// selector is grouped by whether it actually needs a human decision here.
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

  // Local-only overrides: the backend has no endpoint yet to persist
  // approve/reject decisions on individual fields, so this stays client-side
  // until Yusuf ships PATCH /documents/{id}/fields/{field_id}.
  const [decisions, setDecisions] = useState<Record<string, "approved" | "rejected">>({});

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
    setDecisions({});

    fetch(`${API_BASE}/documents/${selectedId}`)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data: ApiDocumentDetail) => {
        if (!cancelled) setDetail(data);
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

  const decide = (fieldId: string, decision: "approved" | "rejected") => {
    setDecisions((prev) => ({ ...prev, [fieldId]: decision }));
  };

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

        <div className="mt-4 flex items-start gap-2 rounded-md border border-accent bg-accent/40 p-3 text-sm text-accent-foreground">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Only fields Nutrient managed to detect show up below. If something you expect from the original
            invoice is missing entirely, that&apos;s a detection gap, not a rejection — check the document in the
            viewer to confirm before trusting the extraction as complete.
          </p>
        </div>

        {listError && (
          <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {listError}
          </p>
        )}
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

          {loadingList && (
            <div className="flex items-center justify-center p-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}

          {!loadingList && documents.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">No documents uploaded yet.</p>
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
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}

          {selectedId && detailError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {detailError}
            </p>
          )}

          {selectedId && !loadingDetail && detail && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{detail.filename}</h2>
                  <p className="text-sm text-muted-foreground">
                    {fields.length} field{fields.length === 1 ? "" : "s"} extracted
                    {lowConfidenceCount > 0 && ` — ${lowConfidenceCount} need${lowConfidenceCount === 1 ? "s" : ""} attention`}
                    {noisyCount > 0 && ` — ${noisyCount} look${noisyCount === 1 ? "s" : ""} unusual`}
                  </p>
                </div>
                <span className={`rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${STATUS_BADGE[detail.status]}`}>
                  {STATUS_LABEL[detail.status]}
                </span>
              </div>

              {fields.length > 0 && (
                <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                  

                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    Sort:
                    <Select.Root value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                      <Select.Trigger className="flex items-center gap-2 rounded-md border border-border bg-muted px-2 py-1.5 text-xs font-sans text-foreground outline-none">
                        <Select.Value />
                        <Select.Icon>
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Select.Icon>
                      </Select.Trigger>

                      <Select.Portal>
                        <Select.Positioner sideOffset={4}>
                          <Select.Popup className="rounded-md border border-border bg-card p-1 font-sans text-xs shadow-md">
                            {SORT_OPTIONS.map((opt) => (
                              <Select.Item
                                key={opt.value}
                                value={opt.value}
                                className="cursor-pointer rounded-sm px-2 py-1.5 text-foreground outline-none hover:bg-muted data-[selected]:bg-primary/10 data-[selected]:text-primary"
                              >
                                <Select.ItemText>{opt.label}</Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.Popup>
                        </Select.Positioner>
                      </Select.Portal>
                    </Select.Root>  
                  </label>

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

              <div className="mt-4 space-y-3">
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
                  const decision = decisions[field.id];
                  const flagged = !field.approved;
                  const noisy = looksNoisy(field.value);

                  return (
                    <div
                      key={field.id}
                      className={`rounded-md border p-4 ${
                        flagged ? "border-destructive/30 bg-destructive/5" : "border-border bg-muted"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {field.field_name.replace(/_/g, " ")}
                          </p>
                          <p className="mt-1 break-words font-mono text-sm font-semibold leading-relaxed">
                            {field.value}
                          </p>
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

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {decision === "approved" && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                              <Check className="h-3.5 w-3.5" /> Approved
                            </span>
                          )}
                          {decision === "rejected" && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                              <AlertTriangle className="h-3.5 w-3.5" /> Rejected
                            </span>
                          )}
                          {!decision && (
                            <span className="text-xs text-muted-foreground">
                              {field.approved ? "Auto-approved" : "Awaiting your review"}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => decide(field.id, "approved")}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold transition hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => decide(field.id, "rejected")}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold transition hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <ThumbsDown className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {fields.length > 0 && (
                <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <p>
                    Approve/reject decisions aren&apos;t saved to the backend yet — there&apos;s no endpoint for it.
                    This stays local until that&apos;s wired up.
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