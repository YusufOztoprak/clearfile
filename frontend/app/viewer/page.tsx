"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import PdfViewer from "@/components/PdfViewer";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type DocumentStatus = "pending" | "processing" | "needs_review" | "signed" | "rejected";

// Route: /viewer?document=<id>
// Kept as its own page (not a modal) so it has a shareable URL and doesn't
// fight with Review's own state — Review/Archive/Dashboard/Audit just link here.
export default function ViewerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentId = searchParams.get("document");

  const [status, setStatus] = useState<DocumentStatus | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [docError, setDocError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) {
      setLoadingDoc(false);
      return;
    }

    let cancelled = false;
    setLoadingDoc(true);
    setDocError(null);

    fetch(`${API_BASE}/documents/${documentId}`)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data: { status: DocumentStatus; filename: string }) => {
        if (!cancelled) {
          setStatus(data.status);
          setFilename(data.filename);
        }
      })
      .catch(() => {
        if (!cancelled) setDocError("Could not find this document.");
      })
      .finally(() => {
        if (!cancelled) setLoadingDoc(false);
      });

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  if (!documentId) {
    return (
      <div className="space-y-4 py-4">
        <p className="text-sm text-muted-foreground">
          No document selected. Go back and pick a document to view.
        </p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm font-medium transition hover:bg-muted/70"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>
    );
  }

  // Two distinct backend routes, not one — /file is whatever was originally
  // uploaded (PNG/JPG/PDF), /signed-file is always a PDF and only exists
  // once the document has actually been signed (404 otherwise). Showing the
  // signed PDF once it exists is more useful than the pre-signature original,
  // since that's the version with the real digital signature embedded.
  const documentUrl =
    status === "signed"
      ? `${API_BASE}/documents/${documentId}/signed-file`
      : `${API_BASE}/documents/${documentId}/file`;

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col gap-4 py-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm font-medium transition hover:bg-muted/70"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {filename && (
          <span className="line-clamp-1 text-sm font-medium text-muted-foreground">{filename}</span>
        )}
      </div>

      {loadingDoc && (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {!loadingDoc && docError && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {docError}
        </p>
      )}

      {!loadingDoc && !docError && <PdfViewer documentUrl={documentUrl} className="flex-1" />}
    </div>
  );
}