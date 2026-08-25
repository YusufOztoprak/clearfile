"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpToLine, CheckCircle2, FileText, Loader2, ShieldCheck, XCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_SIZE_MB = 15;
const POLL_INTERVAL_MS = 3000;
const STORAGE_KEY = "clearfile:recent-uploads";
const MAX_TRACKED = 8;

// Mirrors backend/app/models/document.py -> Document.status
type DocumentStatus = "pending" | "processing" | "needs_review" | "signed";
type UploadStatus = "uploading" | "extracting" | DocumentStatus | "error";

// Only serializable fields live in state / sessionStorage. The actual File
// object can't survive JSON.stringify (and wouldn't survive a reload
// anyway), so it's kept separately in fileRefs, scoped to this tab's life.
type UploadItem = {
  id: string; // local, stable key for the list (not the backend id)
  documentId?: string; // uuid returned by POST /documents/upload
  fileName: string;
  fileSize: number;
  progress: number;
  status: UploadStatus;
  errorMessage?: string;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const STATUS_LABEL: Record<UploadStatus, string> = {
  uploading: "Uploading…",
  pending: "Pending",
  extracting: "Extracting…",
  processing: "Processing",
  needs_review: "Needs review",
  signed: "Signed",
  error: "Failed",
};

// Status styling reuses the shadcn theme tokens (primary/accent/destructive/muted)
// instead of arbitrary Tailwind colors, so it follows whatever palette is set in globals.css.
const STATUS_BADGE: Record<UploadStatus, string> = {
  uploading: "border-border bg-muted text-muted-foreground",
  pending: "border-border bg-muted text-muted-foreground",
  extracting: "border-border bg-accent text-accent-foreground",
  processing: "border-accent bg-accent text-accent-foreground",
  needs_review: "border-accent bg-accent text-accent-foreground",
  signed: "border-primary/20 bg-primary/10 text-primary",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
};

// Statuses that mean "the backend is still going to change this on its own" — keep polling.
const POLLABLE: DocumentStatus[] = ["pending", "processing"];

// Splits the single items list into two non-overlapping views instead of
// showing the same data twice: "active" is what's still moving through the
// pipeline, "history" is what's done (successfully or not).
const ACTIVE_STATUSES: UploadStatus[] = ["uploading", "extracting", "pending", "processing"];

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Only PDF, PNG or JPG files are accepted.";
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `File is larger than ${MAX_SIZE_MB} MB.`;
  }
  return null;
}

function loadPersisted(): UploadItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UploadItem[]) : [];
  } catch {
    return [];
  }
}

export default function UploadPage() {
  const router = useRouter();
  const [items, setItems] = useState<UploadItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Live File objects, kept only for this tab's lifetime — never persisted,
  // since a File can't be serialized into sessionStorage.
  const fileRefs = useRef<Record<string, File>>({});

  const updateItem = (id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const pollStatus = useCallback((id: string, documentId: string) => {
    const tick = async () => {
      try {
        const res = await fetch(`${API_BASE}/documents/${documentId}`);
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        const status = data.status as DocumentStatus;

        updateItem(id, { status });

        if (POLLABLE.includes(status)) {
          pollTimers.current[id] = setTimeout(tick, POLL_INTERVAL_MS);
        }
      } catch {
        // A transient polling failure shouldn't flip the item to "error" —
        // the upload itself already succeeded. Just retry on the next interval.
        pollTimers.current[id] = setTimeout(tick, POLL_INTERVAL_MS);
      }
    };

    pollTimers.current[id] = setTimeout(tick, POLL_INTERVAL_MS);
  }, []);

  // Restore the last session's uploads on mount, and resume polling for
  // anything that was still pending/processing when the page was left.
  useEffect(() => {
    const restored = loadPersisted();
    setItems(restored);
    setHydrated(true);

    restored.forEach((item) => {
      if (item.documentId && POLLABLE.includes(item.status as DocumentStatus)) {
        pollStatus(item.id, item.documentId);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist every change, but only once hydration has run — otherwise the
  // very first empty render would overwrite the stored history.
  useEffect(() => {
    if (!hydrated) return;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  useEffect(() => {
    const timers = pollTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const extractDocument = async (id: string, documentId: string) => {
    updateItem(id, { status: "extracting", errorMessage: undefined });
    try {
      const res = await fetch(`${API_BASE}/documents/${documentId}/extract`, { method: "POST" });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      const status = (data.status as DocumentStatus) ?? "needs_review";
      updateItem(id, { status });
      if (POLLABLE.includes(status)) pollStatus(id, documentId);
    } catch {
      updateItem(id, {
        status: "error",
        errorMessage: "Extraction failed. The file uploaded fine, but Nutrient couldn't process it.",
      });
    }
  };

  const uploadFile = (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/documents/upload`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        updateItem(id, { progress: Math.round((event.loaded / event.total) * 100) });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          updateItem(id, { progress: 100, documentId: data.id });
          if (data.id) extractDocument(id, data.id);
        } catch {
          updateItem(id, { progress: 100, status: "pending" });
        }
      } else {
        updateItem(id, { status: "error", errorMessage: `Server responded ${xhr.status}` });
      }
    };

    xhr.onerror = () => {
      updateItem(id, {
        status: "error",
        errorMessage: "Could not reach the backend. Is it running?",
      });
    };

    xhr.send(formData);
  };

  const handleFiles = useCallback((fileList: FileList) => {
    const incoming = Array.from(fileList);

    incoming.forEach((file) => {
      const error = validateFile(file);
      const id = `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`;

      fileRefs.current[id] = file;

      const item: UploadItem = {
        id,
        fileName: file.name,
        fileSize: file.size,
        progress: 0,
        status: error ? "error" : "uploading",
        errorMessage: error ?? undefined,
      };

      setItems((prev) => [item, ...prev].slice(0, MAX_TRACKED));

      if (!error) uploadFile(id, file);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length) handleFiles(event.dataTransfer.files);
  };

  const retry = (item: UploadItem) => {
    if (item.documentId) {
      extractDocument(item.id, item.documentId);
      return;
    }

    const liveFile = fileRefs.current[item.id];
    if (!liveFile) {
      updateItem(item.id, {
        status: "error",
        errorMessage: "This file isn't available anymore after a reload — please drop it again.",
      });
      return;
    }

    const error = validateFile(liveFile);
    updateItem(item.id, {
      status: error ? "error" : "uploading",
      progress: 0,
      errorMessage: error ?? undefined,
      documentId: undefined,
    });
    if (!error) uploadFile(item.id, liveFile);
  };

  // Only navigable once extraction has actually run — before that there's
  // nothing for the review page to show for this document yet.
  const openInReview = (item: UploadItem) => {
    if (!item.documentId) return;
    router.push(`/review?document=${item.documentId}`);
  };

  const activeItems = items.filter((it) => ACTIVE_STATUSES.includes(it.status));
  const historyItems = items.filter((it) => !ACTIVE_STATUSES.includes(it.status));

  return (
    <div className="space-y-8 py-4">
      <div className="rounded-lg border border-border bg-card p-5 text-card-foreground sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Upload</p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] sm:text-4xl">
              Add a new invoice document
            </h1>
          </div>

          <button
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <ArrowUpToLine className="h-4 w-4" />
            Upload file
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`mt-8 cursor-pointer rounded-md border border-dashed p-8 text-center transition ${
            isDragging ? "border-primary bg-accent" : "border-border bg-muted"
          }`}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-md border border-border bg-card text-foreground">
            <FileText className="h-8 w-8" />
          </div>

          <h2 className="mt-5 text-2xl font-semibold">Drag and drop your invoice</h2>
          <p className="mt-2 text-muted-foreground">
            PDF, PNG, and JPG files are supported. The intake workflow begins as soon as the file is uploaded.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            {["PDF", "PNG", "JPG", "Validated intake"].map((type) => (
              <span key={type} className="rounded-md border border-border bg-card px-3 py-1.5">
                {type}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-border bg-card p-5 text-card-foreground sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Processing status</h2>
            <span
              className={`rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                activeItems.length > 0
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-primary/20 bg-primary/10 text-primary"
              }`}
            >
              {activeItems.length > 0 ? `${activeItems.length} in progress` : "Idle"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">What&apos;s currently moving through the pipeline.</p>

          <div className="mt-6 space-y-3">
            {activeItems.length === 0 && (
              <p className="rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
                Nothing in progress right now. Drop a file above to see it move through the pipeline.
              </p>
            )}

            {activeItems.map((item) => (
              <div key={item.id} className="rounded-md border border-border bg-muted p-3">
                <div className="flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-3 text-sm font-medium">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </span>
                    <span className="truncate">{item.fileName}</span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {item.status === "uploading" ? `${item.progress}%` : STATUS_LABEL[item.status]}
                  </span>
                </div>

                {item.documentId && (
                  <p className="mt-1.5 truncate pl-9 font-mono text-[11px] text-muted-foreground">
                    {formatFileSize(item.fileSize)}
                  </p>
                )}

                {item.status === "uploading" && (
                  <div className="mt-2 h-1.5 w-full rounded-full bg-border">
                    <div
                      className="h-1.5 rounded-full bg-primary transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-lg border border-border bg-card p-5 text-card-foreground sm:p-6">
          <h2 className="text-xl font-semibold">Recent uploads</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Completed or failed uploads. Click one to open it in Review.
          </p>

          <div className="mt-5 space-y-3">
            {historyItems.length === 0 && (
              <p className="text-sm text-muted-foreground">Completed uploads will show up here.</p>
            )}

            {historyItems.slice(0, 5).map((item) => {
              const canOpen = Boolean(item.documentId);
              return (
                <div
                  key={item.id}
                  role={canOpen ? "button" : undefined}
                  tabIndex={canOpen ? 0 : undefined}
                  onClick={() => canOpen && openInReview(item)}
                  onKeyDown={(e) => {
                    if (canOpen && (e.key === "Enter" || e.key === " ")) openInReview(item);
                  }}
                  className={`rounded-md border border-border bg-muted p-3 transition ${
                    canOpen ? "cursor-pointer hover:border-primary/40 hover:bg-muted/70" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground">
                        {item.status === "error" ? (
                          <XCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="max-w-[160px] truncate text-sm font-semibold">{item.fileName}</p>
                        <p className="truncate text-xs text-muted-foreground">{formatFileSize(item.fileSize)}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${STATUS_BADGE[item.status]}`}>
                      {STATUS_LABEL[item.status]}
                    </span>
                  </div>

                  {item.status === "error" && (
                    <div className="mt-2 flex items-center justify-between gap-3 text-xs text-destructive">
                      <span className="truncate">{item.errorMessage}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          retry(item);
                        }}
                        className="shrink-0 font-semibold underline"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-md border border-primary/20 bg-primary/10 p-4 text-sm text-primary">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              Secure workflow
            </div>
            <p className="mt-2 leading-6 opacity-90">
              Every upload is encrypted and logged for audit and compliance purposes.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}