"use client";

import { useCallback, useRef, useState } from "react";
import { ArrowUpToLine, CheckCircle2, FileText, ShieldCheck, XCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_SIZE_MB = 15;

type UploadStatus = "uploading" | "processed" | "needs-review" | "error";

type UploadItem = {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  errorMessage?: string;
};

const STATUS_LABEL: Record<UploadStatus, string> = {
  uploading: "Uploading…",
  processed: "Processed",
  "needs-review": "Needs review",
  error: "Failed",
};

// Status badges reuse the shadcn theme tokens (primary/accent/destructive/muted)
// instead of arbitrary Tailwind colors, so they follow whatever palette is set in globals.css.
const STATUS_BADGE: Record<UploadStatus, string> = {
  uploading: "border-border bg-muted text-muted-foreground",
  processed: "border-primary/20 bg-primary/10 text-primary",
  "needs-review": "border-accent bg-accent text-accent-foreground",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
};

const STATUS_ICON_WRAP: Record<UploadStatus, string> = {
  uploading: "bg-muted text-muted-foreground",
  processed: "bg-primary/10 text-primary",
  "needs-review": "bg-accent text-accent-foreground",
  error: "bg-destructive/10 text-destructive",
};

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Only PDF, PNG or JPG files are accepted.";
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `File is larger than ${MAX_SIZE_MB} MB.`;
  }
  return null;
}

export default function UploadPage() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateItem = (id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const uploadFile = (item: UploadItem) => {
    const formData = new FormData();
    formData.append("file", item.file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/documents/upload`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        updateItem(item.id, { progress: Math.round((event.loaded / event.total) * 100) });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        updateItem(item.id, { progress: 100, status: "needs-review" });
      } else {
        updateItem(item.id, { status: "error", errorMessage: `Server responded ${xhr.status}` });
      }
    };

    xhr.onerror = () => {
      updateItem(item.id, {
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

      const item: UploadItem = {
        id,
        file,
        progress: 0,
        status: error ? "error" : "uploading",
        errorMessage: error ?? undefined,
      };

      setItems((prev) => [item, ...prev].slice(0, 8));

      if (!error) uploadFile(item);
    });
  }, []);

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length) handleFiles(event.dataTransfer.files);
  };

  const retry = (item: UploadItem) => {
    const error = validateFile(item.file);
    updateItem(item.id, { status: error ? "error" : "uploading", progress: 0, errorMessage: error ?? undefined });
    if (!error) uploadFile(item);
  };

  const activeCount = items.filter((it) => it.status === "uploading").length;

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
            {["PDF", "PNG", "JPG"].map((type) => (
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
                activeCount > 0
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-primary/20 bg-primary/10 text-primary"
              }`}
            >
              {activeCount > 0 ? `${activeCount} in progress` : "Idle"}
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {items.length === 0 && (
              <p className="rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
                Nothing uploaded yet this session. Drop a file above to see it move through the pipeline.
              </p>
            )}

            {items.map((item) => (
              <div key={item.id} className="rounded-md border border-border bg-muted p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm font-medium">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${STATUS_ICON_WRAP[item.status]}`}
                    >
                      {item.status === "error" ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                    </span>
                    <span className="truncate">{item.file.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.status === "uploading" ? `${item.progress}%` : STATUS_LABEL[item.status]}
                  </span>
                </div>

                {item.status === "uploading" && (
                  <div className="mt-2 h-1.5 w-full rounded-full bg-border">
                    <div
                      className="h-1.5 rounded-full bg-primary transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}

                {item.status === "error" && (
                  <div className="mt-2 flex items-center justify-between text-xs text-destructive">
                    <span>{item.errorMessage}</span>
                    <button onClick={() => retry(item)} className="font-semibold underline">
                      Retry
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-lg border border-border bg-card p-5 text-card-foreground sm:p-6">
          <h2 className="text-xl font-semibold">Recent uploads</h2>

          <div className="mt-6 space-y-3">
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground">Uploaded documents will show up here.</p>
            )}

            {items.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-md border border-border bg-muted p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="max-w-[160px] truncate text-sm font-semibold">{item.file.name}</p>
                    <p className="text-xs text-muted-foreground">{(item.file.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
                <span className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${STATUS_BADGE[item.status]}`}>
                  {STATUS_LABEL[item.status]}
                </span>
              </div>
            ))}
          </div>

          
        </aside>
      </div>
    </div>
  );
}